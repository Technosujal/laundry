from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from enum import StrEnum
from typing import Any

from app.ingestion.models import OutcomeStatus


class MeasureUnit(StrEnum):
    CURRENCY_USD = "CURRENCY_USD"
    COUNT = "COUNT"


class MachineScope(StrEnum):
    """Which machines a measure actually covers. Recorded because cycles and revenue differ."""

    ALL_MACHINES = "ALL_MACHINES"
    WASHERS_ONLY = "WASHERS_ONLY"
    NOT_MACHINE_SCOPED = "NOT_MACHINE_SCOPED"


@dataclass(frozen=True, slots=True)
class DailySeriesSpec:
    """Identity and semantics of one supplied daily-history export."""

    series_id: str
    filename: str
    measure_label: str
    unit: MeasureUnit
    machine_scope: MachineScope
    business_event: str
    coverage_note: str


@dataclass(frozen=True, slots=True)
class DailyPoint:
    day: date
    amount: Decimal


@dataclass(frozen=True, slots=True)
class DailyRowOutcome:
    source_row_number: int
    source_row_identity: str
    raw_record: tuple[str | None, ...]
    status: OutcomeStatus
    reason_codes: tuple[str, ...]
    warning_codes: tuple[str, ...]
    parsed: DailyPoint | None


@dataclass(frozen=True, slots=True)
class MachineTotal:
    machine: str
    machine_class: str
    total_revenue: Decimal
    total_cycles: Decimal


@dataclass(frozen=True, slots=True)
class MachineRowOutcome:
    source_row_number: int
    source_row_identity: str
    raw_record: tuple[str | None, ...]
    status: OutcomeStatus
    reason_codes: tuple[str, ...]
    warning_codes: tuple[str, ...]
    parsed: MachineTotal | None


@dataclass(frozen=True, slots=True)
class LaundroIngestionSummary:
    run_id: str
    source_kind: str
    series_id: str
    source_sha256: str
    source_size_bytes: int
    storage_key: str
    retained_copy_created: bool
    parser_version: str
    rule_version: str
    input_rows: int
    accepted_rows: int
    quarantined_rows: int
    reason_counts: dict[str, int]
    warning_counts: dict[str, int]
    first_day: str | None
    last_day: str | None
    distinct_days: int
    total_amount: str

    def assert_complete_accounting(self) -> None:
        if self.input_rows != self.accepted_rows + self.quarantined_rows:
            raise AssertionError("Input rows do not equal accepted plus quarantined rows")

    def as_safe_dict(self) -> dict[str, Any]:
        return {
            "run_id": self.run_id,
            "source_system": "LAUNDRO_PORTAL",
            "source_kind": self.source_kind,
            "series_id": self.series_id,
            "source_sha256": self.source_sha256,
            "source_size_bytes": self.source_size_bytes,
            "storage_key": self.storage_key,
            "retained_copy_created": self.retained_copy_created,
            "parser_version": self.parser_version,
            "rule_version": self.rule_version,
            "input_rows": self.input_rows,
            "accepted_rows": self.accepted_rows,
            "quarantined_rows": self.quarantined_rows,
            "reason_counts": dict(sorted(self.reason_counts.items())),
            "warning_counts": dict(sorted(self.warning_counts.items())),
            "first_day": self.first_day,
            "last_day": self.last_day,
            "distinct_days": self.distinct_days,
            "total_amount": self.total_amount,
        }
