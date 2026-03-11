from __future__ import annotations

from dataclasses import dataclass
from typing import List

from .models import GearboxTemplate


@dataclass(slots=True)
class ValidationIssue:
    level: str  # "warning" | "error"
    field: str
    message: str


def validate_semantics(data: GearboxTemplate) -> List[ValidationIssue]:
    issues: List[ValidationIssue] = []

    if not data.manufacturer.strip():
        issues.append(
            ValidationIssue("error", "manufacturer", "Производитель не должен быть пустым"),
        )

    if not data.gearbox.strip():
        issues.append(
            ValidationIssue("error", "gearbox", "Название АКПП не должно быть пустым"),
        )

    if data.drain_volume > 20:
        issues.append(
            ValidationIssue(
                "warning",
                "drain_volume",
                "Объём слива выглядит слишком большим для АКПП, проверьте значение",
            ),
        )

    for field_name in ("pan_torque_nm", "drain_torque_nm", "fill_torque_nm"):
        value = getattr(data, field_name)
        if value > 250:
            issues.append(
                ValidationIssue(
                    "warning",
                    field_name,
                    "Момент затяжки выглядит нереалистично большим, проверьте значение",
                ),
            )

    # Duplicate / empty OEM detection
    oem = data.oem_json
    oem_codes = {
        "oem_fluid_1": oem.oem_fluid_1,
        "oem_fluid_2": oem.oem_fluid_2,
        "oem_filter_internal": oem.oem_filter_internal,
        "oem_filter_external": oem.oem_filter_external,
        "oem_gasket_1": oem.oem_gasket_1,
        "oem_gasket_2": oem.oem_gasket_2,
    }

    non_empty_codes = {k: v for k, v in oem_codes.items() if v.strip()}
    if len(set(non_empty_codes.values())) != len(non_empty_codes):
        issues.append(
            ValidationIssue(
                "warning",
                "oem_json",
                "Обнаружены дублирующиеся OEM-коды в разных полях, проверьте соответствие",
            ),
        )

    return issues

