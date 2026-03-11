from __future__ import annotations

import argparse
import asyncio
import logging
from pathlib import Path

from .config import AppConfig, load_config
from .pipeline import prepare_batch_requests, run_realtime_generation


def _setup_logging(level: str) -> None:
    logging.basicConfig(
        level=getattr(logging, level.upper(), logging.INFO),
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Массовая генерация JSON-шаблонов обслуживания АКПП через OpenAI Responses API.",
    )
    parser.add_argument(
        "--config",
        type=Path,
        help="Путь к YAML-конфигу (по умолчанию используются встроенные значения).",
    )

    subparsers = parser.add_subparsers(dest="command", required=True)

    realtime = subparsers.add_parser(
        "realtime",
        help="Режим быстрых параллельных запросов в OpenAI.",
    )
    realtime.add_argument(
        "--input",
        type=Path,
        help="Файл с входными данными (CSV/JSONL/YAML/JSON). Если не указан, берётся из конфига.",
    )
    realtime.add_argument(
        "--manufacturer",
        type=str,
        help="Фильтр по производителю (например 'Ford').",
    )

    batch = subparsers.add_parser(
        "batch",
        help="Подготовка JSONL для OpenAI Batch API.",
    )
    batch.add_argument(
        "--input",
        type=Path,
        help="Файл с входными данными (CSV/JSONL/YAML/JSON). Если не указан, берётся из конфига.",
    )
    batch.add_argument(
        "--manufacturer",
        type=str,
        help="Фильтр по производителю (например 'Ford').",
    )

    return parser


def _apply_cli_overrides(cfg: AppConfig, args: argparse.Namespace) -> AppConfig:
    if getattr(args, "input", None):
        cfg.input_path = args.input
    if getattr(args, "manufacturer", None):
        cfg.manufacturer_filter = args.manufacturer
    return cfg


def main(argv: list[str] | None = None) -> None:
    parser = build_arg_parser()
    args = parser.parse_args(argv)

    cfg = load_config(args.config) if args.config else AppConfig()
    cfg = _apply_cli_overrides(cfg, args)

    _setup_logging(cfg.log_level)

    if args.command == "realtime":
        asyncio.run(run_realtime_generation(cfg))
    elif args.command == "batch":
        prepare_batch_requests(cfg)
    else:
        parser.error(f"Неизвестная команда: {args.command}")


if __name__ == "__main__":
    main()

