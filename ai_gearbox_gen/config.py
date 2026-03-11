from __future__ import annotations

import dataclasses
from dataclasses import dataclass
from pathlib import Path
from typing import Literal, Optional

import yaml


DEFAULT_MODEL = "gpt-5.4-2026-03-05"


@dataclass(slots=True)
class AppConfig:
    """
    Top-level configuration for the gearbox AI generator.
    """

    # OpenAI / model config
    model: str = DEFAULT_MODEL
    temperature: float = 0.1
    max_output_tokens: int = 2000

    # Concurrency / retries
    mode: Literal["realtime", "batch"] = "realtime"
    max_concurrency: int = 8
    min_concurrency: int = 1
    max_retries: int = 5
    base_backoff_seconds: float = 1.0
    max_backoff_seconds: float = 30.0
    jitter_fraction: float = 0.25

    # Timeouts
    request_timeout_seconds: float = 45.0

    # IO / paths
    input_path: Path = Path("data/gearboxes_ford.yaml")
    output_dir: Path = Path("ai_outputs")
    batch_output_path: Path = Path("ai_outputs/batch_requests.jsonl")
    checkpoint_path: Path = Path("ai_outputs/checkpoints/gearboxes_checkpoint.jsonl")
    aggregated_jsonl_path: Path = Path("ai_outputs/gearboxes_aggregated.jsonl")

    # Logging / metrics
    log_level: str = "INFO"

    # Domain
    language: Literal["ru", "en"] = "ru"
    manufacturer_filter: Optional[str] = None


def _coerce_paths(cfg: AppConfig, base_dir: Path) -> AppConfig:
    """
    Make all relative paths config-relative, not CWD-relative.

    YAML конфиг даёт строки, поэтому здесь приводим как строки, так и Path.
    """
    path_fields = {
        "input_path",
        "output_dir",
        "batch_output_path",
        "checkpoint_path",
        "aggregated_jsonl_path",
    }
    for field in dataclasses.fields(cfg):
        if field.name not in path_fields:
            continue
        value = getattr(cfg, field.name)
        if isinstance(value, str):
            path = Path(value)
        elif isinstance(value, Path):
            path = value
        else:
            continue

        if not path.is_absolute():
            path = (base_dir / path).resolve()
        setattr(cfg, field.name, path)
    return cfg


def load_config(path: Optional[str | Path] = None) -> AppConfig:
    """
    Load configuration from a YAML file if provided, otherwise use defaults.
    """
    if path is None:
        return _coerce_paths(AppConfig(), Path.cwd())

    config_path = Path(path)
    if not config_path.exists():
        raise FileNotFoundError(f"Config file not found: {config_path}")

    with config_path.open("r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}

    field_names = {f.name for f in dataclasses.fields(AppConfig)}
    filtered = {k: v for k, v in data.items() if k in field_names}

    cfg = AppConfig(**filtered)  # type: ignore[arg-type]
    return _coerce_paths(cfg, config_path.parent)

