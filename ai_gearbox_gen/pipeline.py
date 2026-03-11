from __future__ import annotations

import asyncio
import csv
import json
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List, Tuple

import yaml

from .config import AppConfig
from .models import GearboxInput, GearboxTemplate
from .openai_client import GearboxOpenAIClient
from .validation import ValidationIssue, validate_semantics

logger = logging.getLogger(__name__)


@dataclass(slots=True)
class GenerationResult:
    input: GearboxInput
    output: GearboxTemplate | None
    error: str | None
    validation_issues: List[ValidationIssue]


def _load_from_csv(path: Path) -> List[GearboxInput]:
    items: List[GearboxInput] = []
    with path.open("r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            items.append(
                GearboxInput(
                    manufacturer=row.get("manufacturer", "").strip(),
                    gearbox=row.get("gearbox", "").strip(),
                    notes=row.get("notes") or None,
                    source_snippets=row.get("source_snippets") or None,
                    vin_notes=row.get("vin_notes") or None,
                ),
            )
    return items


def _load_from_jsonl(path: Path) -> List[GearboxInput]:
    items: List[GearboxInput] = []
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            obj = json.loads(line)
            items.append(GearboxInput.model_validate(obj))
    return items


def _load_from_yaml_or_json(path: Path) -> List[GearboxInput]:
    with path.open("r", encoding="utf-8") as f:
        if path.suffix.lower() in {".yaml", ".yml"}:
            data = yaml.safe_load(f)
        else:
            data = json.load(f)

    items: List[GearboxInput] = []
    if isinstance(data, list):
        for obj in data:
            items.append(GearboxInput.model_validate(obj))
    elif isinstance(data, dict) and "items" in data:
        for obj in data["items"]:
            items.append(GearboxInput.model_validate(obj))
    else:
        raise ValueError("Unsupported YAML/JSON structure for gearbox inputs")
    return items


def load_inputs(path: Path) -> List[GearboxInput]:
    suffix = path.suffix.lower()
    if suffix == ".csv":
        return _load_from_csv(path)
    if suffix in {".jsonl", ".ndjson"}:
        return _load_from_jsonl(path)
    if suffix in {".yaml", ".yml", ".json"}:
        return _load_from_yaml_or_json(path)
    raise ValueError(f"Unsupported input format: {suffix}")


def _build_system_prompt(cfg: AppConfig) -> str:
    return (
        "Заполни шаблон для АКПП.\n"
        "Всегда пиши ответы на русском языке.\n"
        "Всю информацию проверяй максимально тщательно, особенно OEM-номера.\n"
        "OEM-номера должны быть как можно более точными и реалистичными.\n"
        "Если есть различия по OEM-номеру между ревизиями/рынками или ты не уверен, допускается указать\n"
        "несколько OEM-номеров в одном поле с подробными пояснениями в соответствующем *_info,\n"
        "но делай это только при реальной необходимости и избегай лишнего дублирования.\n"
        "Если масляный фильтр НЕ меняется во время стандартного сервисного обслуживания и для его замены\n"
        "нужно снимать коробку, так и указывай в *_info и НЕ заполняй для него OEM-номер.\n"
        "Считаем, что если поддон нижний и снимается при обслуживании — фильтр меняется и его OEM можно указывать,\n"
        "если поддон боковой и фильтр конструктивно не обслуживается при обычном ТО — фильтр считаем не сервисным.\n"
        "Строго соблюдай различия между спецификацией масла, брендом, OEM-кодами, фильтрами, прокладками,\n"
        "кольцами, пробками, шайбами и болтами. Не путай эти сущности между собой.\n"
        "Ответ должен строго соответствовать заданной JSON-схеме, без добавления лишних полей."
    )


def _build_user_prompt(item: GearboxInput) -> str:
    # В пользовательский промт теперь отправляем только название/обозначение АКПП,
    # без дополнительного контекста.
    return f"АКПП: {item.gearbox}"


def _ensure_dirs(cfg: AppConfig) -> None:
    cfg.output_dir.mkdir(parents=True, exist_ok=True)
    cfg.checkpoint_path.parent.mkdir(parents=True, exist_ok=True)
    cfg.aggregated_jsonl_path.parent.mkdir(parents=True, exist_ok=True)
    cfg.batch_output_path.parent.mkdir(parents=True, exist_ok=True)


def _sanitize_key(text: str) -> str:
    safe = "".join(c if c.isalnum() or c in "._-" else "_" for c in text)
    return safe or "gearbox"


def _write_json(path: Path, obj: dict) -> None:
    with path.open("w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)


def _append_jsonl(path: Path, obj: dict) -> None:
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(obj, ensure_ascii=False))
        f.write("\n")


def _load_completed_keys(checkpoint_path: Path) -> set[str]:
    if not checkpoint_path.exists():
        return set()
    completed: set[str] = set()
    with checkpoint_path.open("r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            rec = json.loads(line)
            if rec.get("status") == "ok":
                completed.add(rec["gearbox_key"])
    return completed


async def _generate_one(
    client: GearboxOpenAIClient,
    cfg: AppConfig,
    item: GearboxInput,
) -> GenerationResult:
    system_prompt = _build_system_prompt(cfg)
    user_prompt = _build_user_prompt(item)

    output, error = await client.generate_with_retries(system_prompt, user_prompt)

    issues: List[ValidationIssue] = []
    if output is not None:
        issues = validate_semantics(output)
    return GenerationResult(
        input=item,
        output=output,
        error=error,
        validation_issues=issues,
    )


async def run_realtime_generation(cfg: AppConfig) -> None:
    """
    High-throughput realtime mode: concurrent direct API calls.
    """
    _ensure_dirs(cfg)

    items = load_inputs(cfg.input_path)
    if cfg.manufacturer_filter:
        items = [i for i in items if i.manufacturer.lower() == cfg.manufacturer_filter.lower()]

    if not items:
        logger.warning("Нет входных записей для генерации")
        return

    logger.info("Всего коробок для генерации: %s", len(items))

    completed_keys = _load_completed_keys(cfg.checkpoint_path)
    logger.info("Пропускаю уже сгенерированные коробки: %s", len(completed_keys))

    client = GearboxOpenAIClient(cfg)

    async def worker(item: GearboxInput) -> None:
        key = f"{item.manufacturer}_{item.gearbox}"
        safe_key = _sanitize_key(key)
        if key in completed_keys or safe_key in completed_keys:
            logger.info("Пропуск (уже есть в чекпоинте): %s", key)
            return

        result = await _generate_one(client, cfg, item)

        record_key = safe_key
        if result.output is not None:
            out_dict = result.output.model_dump()
            file_path = cfg.output_dir / f"{safe_key}.json"
            _write_json(file_path, out_dict)
            _append_jsonl(cfg.aggregated_jsonl_path, out_dict)
            status = "ok"
        else:
            status = "error"

        checkpoint_record = {
            "gearbox_key": record_key,
            "manufacturer": item.manufacturer,
            "gearbox": item.gearbox,
            "status": status,
            "error": result.error,
            "validation_issues": [
                {"level": i.level, "field": i.field, "message": i.message}
                for i in result.validation_issues
            ],
        }
        _append_jsonl(cfg.checkpoint_path, checkpoint_record)

        if result.validation_issues:
            for issue in result.validation_issues:
                logger.warning(
                    "Проблема валидации [%s] %s: %s (%s)",
                    issue.level,
                    issue.field,
                    issue.message,
                    key,
                )

        if result.error:
            logger.error("Ошибка генерации для %s: %s", key, result.error)

    # Simple task fan-out respecting adaptive concurrency via client semaphore
    await asyncio.gather(*(worker(item) for item in items))

    logger.info(
        "Генерация завершена. Успехов: %s, ошибок: %s, лимитов: %s",
        client.metrics.total_success,
        client.metrics.total_errors,
        client.metrics.total_rate_limits,
    )


def prepare_batch_requests(cfg: AppConfig) -> None:
    """
    Batch mode: create JSONL with /v1/responses requests for the Batch API.
    """
    _ensure_dirs(cfg)

    items = load_inputs(cfg.input_path)
    if cfg.manufacturer_filter:
        items = [i for i in items if i.manufacturer.lower() == cfg.manufacturer_filter.lower()]

    if not items:
        logger.warning("Нет входных записей для подготовки batch JSONL")
        return

    system_prompt = _build_system_prompt(cfg)
    schema = {
        "name": "gearbox_template",
        "schema": GearboxTemplate.model_json_schema(),
        "strict": True,
    }

    with cfg.batch_output_path.open("w", encoding="utf-8") as f:
        for item in items:
            user_prompt = _build_user_prompt(item)
            body = {
                "model": cfg.model,
                "input": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "response_format": {
                    "type": "json_schema",
                    "json_schema": schema,
                },
                "temperature": cfg.temperature,
                "max_output_tokens": cfg.max_output_tokens,
            }
            custom_id = _sanitize_key(f"{item.manufacturer}_{item.gearbox}")
            batch_line = {
                "custom_id": custom_id,
                "method": "POST",
                "url": "/v1/responses",
                "body": body,
            }
            f.write(json.dumps(batch_line, ensure_ascii=False))
            f.write("\n")

    logger.info(
        "Batch JSONL для OpenAI Batch API сохранён в %s (записей: %s)",
        cfg.batch_output_path,
        len(items),
    )

