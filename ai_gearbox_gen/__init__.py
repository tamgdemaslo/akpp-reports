"""
High-throughput OpenAI-based generator for automatic transmission (АКПП) service templates.

Main entrypoints are in `cli.py` (for the CLI) and `pipeline.py` (for programmatic use).
"""

from .config import AppConfig, load_config
from .models import GearboxInput, GearboxTemplate
from .pipeline import run_realtime_generation, prepare_batch_requests

__all__ = [
    "AppConfig",
    "load_config",
    "GearboxInput",
    "GearboxTemplate",
    "run_realtime_generation",
    "prepare_batch_requests",
]

