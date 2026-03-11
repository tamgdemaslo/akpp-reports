from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class OEMJson(BaseModel):
    oem_fluid_1: str = ""
    oem_fluid_1_price: float = 0
    oem_fluid_2: str = ""
    oem_fluid_2_price: float = 0
    oem_filter_internal: str = ""
    oem_filter_internal_price: float = 0
    oem_filter_internal_info: str = ""
    oem_filter_external: str = ""
    oem_filter_external_price: float = 0
    oem_filter_external_info: str = ""
    oem_gasket_1: str = ""
    oem_gasket_1_price: float = 0
    oem_gasket_1_info: str = ""
    oem_gasket_2: str = ""
    oem_gasket_2_price: float = 0
    oem_gasket_2_info: str = ""
    oem_o_ring_1: str = ""
    oem_o_ring_1_price: float = 0
    oem_o_ring_1_info: str = ""
    oem_o_ring_2: str = ""
    oem_o_ring_2_price: float = 0
    oem_o_ring_2_info: str = ""
    oem_drain_plug: str = ""
    oem_drain_plug_price: float = 0
    oem_drain_plug_info: str = ""
    oem_drain_plug_washer: str = ""
    oem_drain_plug_washer_price: float = 0
    oem_drain_plug_washer_info: str = ""
    oem_bolt_1: str = ""
    oem_bolt_1_price: float = 0
    oem_bolt_1_info: str = ""
    oem_bolt_2: str = ""
    oem_bolt_2_price: float = 0
    oem_bolt_2_info: str = ""


class GearboxTemplate(BaseModel):
    manufacturer: str
    gearbox: str
    summary: str
    analogs: List[str]
    fluid: str
    drain_volume: float
    fluid_type: str
    fluid_spec: str
    fill_range_celsius: str
    work_temp_celsius: str
    pan_torque_nm: float
    drain_torque_nm: float
    fill_torque_nm: float
    dry_capacity: str
    service_interval: str
    tools: List[str]
    parts_list: List[str]
    oem_json: OEMJson
    procedure: str
    mistakes: List[str]
    nuances: str

    @field_validator(
        "drain_volume",
        "pan_torque_nm",
        "drain_torque_nm",
        "fill_torque_nm",
        mode="after",
    )
    @classmethod
    def non_negative(cls, v: float) -> float:
        if v < 0:
            raise ValueError("numeric field must be non-negative")
        return v


class GearboxInput(BaseModel):
    """
    One gearbox description to be sent to the model.
    """

    manufacturer: str
    gearbox: str
    notes: Optional[str] = None
    source_snippets: Optional[str] = None
    vin_notes: Optional[str] = None


def gearbox_json_schema() -> dict:
    """
    JSON Schema used for Structured Outputs (Responses API).
    """
    # Явная статическая схема, согласованная с README_AI_IMPORT.
    return {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "manufacturer": {"type": "string"},
            "gearbox": {"type": "string"},
            "summary": {"type": "string"},
            "analogs": {
                "type": "array",
                "items": {"type": "string"},
            },
            "fluid": {"type": "string"},
            "drain_volume": {"type": "number"},
            "fluid_type": {"type": "string"},
            "fluid_spec": {"type": "string"},
            "fill_range_celsius": {"type": "string"},
            "work_temp_celsius": {"type": "string"},
            "pan_torque_nm": {"type": "number"},
            "drain_torque_nm": {"type": "number"},
            "fill_torque_nm": {"type": "number"},
            "dry_capacity": {"type": "string"},
            "service_interval": {"type": "string"},
            "tools": {
                "type": "array",
                "items": {"type": "string"},
            },
            "parts_list": {
                "type": "array",
                "items": {"type": "string"},
            },
            "oem_json": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "oem_fluid_1": {"type": "string"},
                    "oem_fluid_1_price": {"type": "number"},
                    "oem_fluid_2": {"type": "string"},
                    "oem_fluid_2_price": {"type": "number"},
                    "oem_filter_internal": {"type": "string"},
                    "oem_filter_internal_price": {"type": "number"},
                    "oem_filter_internal_info": {"type": "string"},
                    "oem_filter_external": {"type": "string"},
                    "oem_filter_external_price": {"type": "number"},
                    "oem_filter_external_info": {"type": "string"},
                    "oem_gasket_1": {"type": "string"},
                    "oem_gasket_1_price": {"type": "number"},
                    "oem_gasket_1_info": {"type": "string"},
                    "oem_gasket_2": {"type": "string"},
                    "oem_gasket_2_price": {"type": "number"},
                    "oem_gasket_2_info": {"type": "string"},
                    "oem_o_ring_1": {"type": "string"},
                    "oem_o_ring_1_price": {"type": "number"},
                    "oem_o_ring_1_info": {"type": "string"},
                    "oem_o_ring_2": {"type": "string"},
                    "oem_o_ring_2_price": {"type": "number"},
                    "oem_o_ring_2_info": {"type": "string"},
                    "oem_drain_plug": {"type": "string"},
                    "oem_drain_plug_price": {"type": "number"},
                    "oem_drain_plug_info": {"type": "string"},
                    "oem_drain_plug_washer": {"type": "string"},
                    "oem_drain_plug_washer_price": {"type": "number"},
                    "oem_drain_plug_washer_info": {"type": "string"},
                    "oem_bolt_1": {"type": "string"},
                    "oem_bolt_1_price": {"type": "number"},
                    "oem_bolt_1_info": {"type": "string"},
                    "oem_bolt_2": {"type": "string"},
                    "oem_bolt_2_price": {"type": "number"},
                    "oem_bolt_2_info": {"type": "string"},
                },
                "required": [
                    "oem_fluid_1",
                    "oem_fluid_1_price",
                    "oem_fluid_2",
                    "oem_fluid_2_price",
                    "oem_filter_internal",
                    "oem_filter_internal_price",
                    "oem_filter_internal_info",
                    "oem_filter_external",
                    "oem_filter_external_price",
                    "oem_filter_external_info",
                    "oem_gasket_1",
                    "oem_gasket_1_price",
                    "oem_gasket_1_info",
                    "oem_gasket_2",
                    "oem_gasket_2_price",
                    "oem_gasket_2_info",
                    "oem_o_ring_1",
                    "oem_o_ring_1_price",
                    "oem_o_ring_1_info",
                    "oem_o_ring_2",
                    "oem_o_ring_2_price",
                    "oem_o_ring_2_info",
                    "oem_drain_plug",
                    "oem_drain_plug_price",
                    "oem_drain_plug_info",
                    "oem_drain_plug_washer",
                    "oem_drain_plug_washer_price",
                    "oem_drain_plug_washer_info",
                    "oem_bolt_1",
                    "oem_bolt_1_price",
                    "oem_bolt_1_info",
                    "oem_bolt_2",
                    "oem_bolt_2_price",
                    "oem_bolt_2_info",
                ],
            },
            "procedure": {"type": "string"},
            "mistakes": {
                "type": "array",
                "items": {"type": "string"},
            },
            "nuances": {"type": "string"},
        },
        "required": [
            "manufacturer",
            "gearbox",
            "summary",
            "analogs",
            "fluid",
            "drain_volume",
            "fluid_type",
            "fluid_spec",
            "fill_range_celsius",
            "work_temp_celsius",
            "pan_torque_nm",
            "drain_torque_nm",
            "fill_torque_nm",
            "dry_capacity",
            "service_interval",
            "tools",
            "parts_list",
            "oem_json",
            "procedure",
            "mistakes",
            "nuances",
        ],
    }

