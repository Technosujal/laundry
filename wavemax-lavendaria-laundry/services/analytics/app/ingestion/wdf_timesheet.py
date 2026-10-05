from __future__ import annotations

import csv
import re
from collections.abc import Iterator
from dataclasses import dataclass
from datetime import datetime
from hashlib import sha256
from pathlib import Path

from app.ingestion.models import OutcomeStatus

PARSER_VERSION = "wdf-timesheet-csv/1.0.0"
RULE_VERSION = "wdf-timesheet-quality/1.0.0"
SOURCE_FILENAME = "Timesheet 2025-01-01 to 2025-12-31.csv"

# A shift longer than this is not credible for a single unbroken clock entry and is excluded
# from published hours. The entry is retained and counted, never deleted.
IMPLAUSIBLE_SHIFT_MINUTES = 16 * 60

_STAMP = re.compile(r"^[A-Za-z]{3}\s+(\d{1,2}/\d{1,2}/\d{2})\s+(\d{1,2}:\d{2}\s*[AP]M)$")


class TimesheetSchemaError(ValueError):
    """Raised when the timesheet export does not match the approved schema."""


@dataclass(frozen=True, slots=True)
class TimeEntry:
    employee_key: str
    clock_in: datetime | None
    clock_out: datetime | None
    duration_minutes: int
    plausible: bool


@dataclass(frozen=True, slots=True)
class TimeEntryOutcome:
    source_row_number: int
    source_row_identity: str
    status: OutcomeStatus
    reason_codes: tuple[str, ...]
    warning_codes: tuple[str, ...]
    parsed: TimeEntry | None


def _parse_stamp(value: str | None) -> datetime | None:
    if not value:
        return None
    match = _STAMP.match(value.strip())
    if not match:
        return None
    try:
        return datetime.strptime(
            f"{match.group(1)} {match.group(2).replace(' ', '')}", "%m/%d/%y %I:%M%p"
        )
    except ValueError:
        return None


def _employee_key(name: str) -> str:
    """Stable pseudonymous key. Employee names never leave the parser."""
    return sha256(name.strip().lower().encode()).hexdigest()[:16]


def parse_timesheet(path: Path, *, source_sha256: str) -> Iterator[TimeEntryOutcome]:
    if path.suffix.lower() != ".csv":
        raise TimesheetSchemaError("The timesheet source must use the .csv format")

    with path.open("r", encoding="utf-8-sig", newline="") as stream:
        reader = csv.DictReader(stream)
        headers = reader.fieldnames or []
        required = {"record_type", "employee_name", "clock_in", "clock_out", "duration_minutes"}
        missing = required - set(headers)
        if missing:
            raise TimesheetSchemaError(f"Timesheet export is missing columns: {sorted(missing)}")

        for source_row_number, row in enumerate(reader, start=2):
            if (row.get("record_type") or "").strip() != "time_entry":
                continue
            identity = sha256(f"{source_sha256}:timesheet:{source_row_number}".encode()).hexdigest()
            reasons: list[str] = []
            warnings: list[str] = []

            raw_duration = (row.get("duration_minutes") or "").strip()
            if not raw_duration:
                reasons.append("DURATION_MISSING")
                duration = 0
            else:
                try:
                    duration = int(raw_duration)
                except ValueError:
                    reasons.append("DURATION_INVALID")
                    duration = 0

            name = (row.get("employee_name") or "").strip()
            if not name:
                reasons.append("EMPLOYEE_MISSING")

            clock_in = _parse_stamp(row.get("clock_in"))
            clock_out = _parse_stamp(row.get("clock_out"))
            if clock_in is None:
                warnings.append("CLOCK_IN_UNPARSED")
            if clock_out is None:
                warnings.append("CLOCK_OUT_UNPARSED")

            plausible = True
            if not reasons:
                if duration < 0:
                    warnings.append("NEGATIVE_DURATION")
                    plausible = False
                elif duration == 0:
                    warnings.append("ZERO_DURATION")
                    plausible = False
                elif duration > IMPLAUSIBLE_SHIFT_MINUTES:
                    warnings.append("IMPLAUSIBLE_SHIFT_LENGTH")
                    plausible = False
                spans_years = (
                    clock_out is not None
                    and clock_in is not None
                    and clock_out.year > clock_in.year
                )
                if spans_years:
                    warnings.append("CLOCK_OUT_IN_LATER_YEAR")

            status = OutcomeStatus.QUARANTINED if reasons else OutcomeStatus.ACCEPTED
            parsed = (
                TimeEntry(
                    employee_key=_employee_key(name),
                    clock_in=clock_in,
                    clock_out=clock_out,
                    duration_minutes=duration,
                    plausible=plausible,
                )
                if status is OutcomeStatus.ACCEPTED
                else None
            )
            yield TimeEntryOutcome(
                source_row_number=source_row_number,
                source_row_identity=identity,
                status=status,
                reason_codes=tuple(sorted(set(reasons))),
                warning_codes=tuple(warnings),
                parsed=parsed,
            )
