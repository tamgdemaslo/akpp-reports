from __future__ import annotations

import asyncio
import logging
import random
import time
from dataclasses import dataclass, field
from typing import Any, Dict, Optional, Tuple

from openai import AsyncOpenAI
from openai import APIStatusError, RateLimitError, APITimeoutError

from .config import AppConfig
from .models import GearboxTemplate, gearbox_json_schema

logger = logging.getLogger(__name__)


@dataclass(slots=True)
class Metrics:
    total_requests: int = 0
    total_success: int = 0
    total_errors: int = 0
    total_rate_limits: int = 0
    total_server_errors: int = 0
    total_timeouts: int = 0
    total_validation_errors: int = 0
    last_error: Optional[str] = None


@dataclass(slots=True)
class AdaptiveConcurrency:
    cfg: AppConfig
    current: int = field(init=False)

    def __post_init__(self) -> None:
        self.current = self.cfg.max_concurrency

    def on_error(self) -> None:
        if self.current > self.cfg.min_concurrency:
            self.current = max(self.cfg.min_concurrency, self.current - 1)
            logger.warning("Снижаю параллелизм до %s из-за ошибок/лимитов", self.current)

    def on_success(self) -> None:
        if self.current < self.cfg.max_concurrency:
            self.current += 1


class GearboxOpenAIClient:
    """
    Thin async wrapper around the OpenAI Responses API with Structured Outputs.
    """

    def __init__(self, cfg: AppConfig) -> None:
        self.cfg = cfg
        self.client = AsyncOpenAI()
        self.metrics = Metrics()
        self.concurrency = AdaptiveConcurrency(cfg)
        self._semaphore = asyncio.Semaphore(cfg.max_concurrency)

        self._json_schema = gearbox_json_schema()

    async def _call_model_once(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute one raw Responses API call.
        """
        self.metrics.total_requests += 1
        start = time.monotonic()
        try:
            resp = await self.client.responses.create(
                **payload,
                timeout=self.cfg.request_timeout_seconds,
            )
        except RateLimitError as e:
            self.metrics.total_errors += 1
            self.metrics.total_rate_limits += 1
            self.metrics.last_error = str(e)
            self.concurrency.on_error()
            raise
        except APITimeoutError as e:
            self.metrics.total_errors += 1
            self.metrics.total_timeouts += 1
            self.metrics.last_error = str(e)
            self.concurrency.on_error()
            raise
        except APIStatusError as e:
            self.metrics.total_errors += 1
            if 500 <= e.status_code < 600:
                self.metrics.total_server_errors += 1
                self.concurrency.on_error()
            self.metrics.last_error = str(e)
            raise
        except Exception as e:  # noqa: BLE001
            self.metrics.total_errors += 1
            self.metrics.last_error = str(e)
            raise
        finally:
            elapsed = time.monotonic() - start
            logger.debug("OpenAI call took %.2fs", elapsed)

        # Structured Outputs with JSON Schema: модель возвращает валидный JSON.
        # В текущей версии SDK безопасно распарсить текстовое содержимое вручную.
        try:
            first_output = resp.output[0]
            first_item = first_output.content[0]
            # SDK также даёт output_text, но для совместимости берём первый элемент.
            import json  # локальный импорт, чтобы не засорять глобальный namespace

            parsed = json.loads(first_item.text)
        except Exception as e:  # noqa: BLE001
            self.metrics.total_validation_errors += 1
            self.metrics.last_error = f"Failed to parse JSON output: {e!r}"
            raise

        self.metrics.total_success += 1
        self.concurrency.on_success()
        return parsed

    async def generate_with_retries(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> Tuple[Optional[GearboxTemplate], Optional[str]]:
        """
        Call the model with retries, backoff, and adaptive concurrency.

        Returns (result, error_message).
        """
        attempt = 0
        last_error: Optional[Exception] = None

        while attempt < self.cfg.max_retries:
            attempt += 1
            try:
                async with self._semaphore:
                    payload = {
                        "model": self.cfg.model,
                        "input": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt},
                        ],
                        # Structured Outputs через text.format
                        "text": {
                            "format": {
                                "type": "json_schema",
                                "name": "gearbox_template",
                                "schema": self._json_schema,
                                "strict": True,
                            }
                        },
                        "temperature": self.cfg.temperature,
                        "max_output_tokens": self.cfg.max_output_tokens,
                    }
                    raw = await self._call_model_once(payload)

                model_obj = GearboxTemplate.model_validate(raw)
                return model_obj, None
            except (RateLimitError, APITimeoutError, APIStatusError) as e:
                last_error = e
                backoff = min(
                    self.cfg.base_backoff_seconds * (2 ** (attempt - 1)),
                    self.cfg.max_backoff_seconds,
                )
                jitter = backoff * self.cfg.jitter_fraction * random.random()
                sleep_for = backoff + jitter
                logger.warning(
                    "Ошибка/лимит при обращении к OpenAI (попытка %s/%s): %s; ожидание %.1fs",
                    attempt,
                    self.cfg.max_retries,
                    e,
                    sleep_for,
                )
                await asyncio.sleep(sleep_for)
            except Exception as e:  # noqa: BLE001
                last_error = e
                logger.exception("Непредвиденная ошибка при генерации: %s", e)
                break

        return None, f"Не удалось получить корректный ответ от модели: {last_error}"

