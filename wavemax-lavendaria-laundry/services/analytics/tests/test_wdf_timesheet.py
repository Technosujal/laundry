from __future__ import annotations

from pathlib import Path

import pytest

from app.ingestion.models import OutcomeStatus
from app.ingestion.wdf_timesheet import (
    IMPLAUSIBLE_SHIFT_MINUTES,
    TimesheetSchemaError,
    parse_timesheet,
)

HEADER = "record_type,employee_name,clock_in,clock_out,duration_minutes\n"


def write(tmp_path: Path, body: str) -> Path:
    path = tmp_path / "timesheet.csv"
    path.write_text(HEADER + body, encoding="utf-8", newline="")
    return path


def outcomes(path: Path):
    return list(parse_timesheet(path, source_sha256="c" * 64))


def test_accepts_a_normal_shift(tmp_path: Path) -> None:
    path = write(tmp_path, "time_entry,Someone,Sat 10/11/25 7:01 AM,Sat 10/11/25 1:57 PM,416\n")
    [entry] = outcomes(path)
    assert entry.status is OutcomeStatus.ACCEPTED
    assert entry.parsed is not None
    assert entry.parsed.plausible is True
    assert entry.parsed.duration_minutes == 416


def test_ignores_non_entry_rows(tmp_path: Path) -> None:
    path = write(
        tmp_path,
        "employee_total,Someone,,,38902\nreport_total,,,,1168701\n"
        "time_entry,Someone,Sat 10/11/25 7:01 AM,Sat 10/11/25 1:57 PM,60\n",
    )
    assert len(outcomes(path)) == 1


def test_marks_over_length_shift_implausible_without_deleting_it(tmp_path: Path) -> None:
    minutes = IMPLAUSIBLE_SHIFT_MINUTES + 1
    path = write(
        tmp_path, f"time_entry,Someone,Mon 12/29/25 3:44 PM,Wed 8/12/26 5:00 PM,{minutes}\n"
    )
    [entry] = outcomes(path)
    assert entry.status is OutcomeStatus.ACCEPTED
    assert entry.parsed is not None
    assert entry.parsed.plausible is False
    assert "IMPLAUSIBLE_SHIFT_LENGTH" in entry.warning_codes
    assert entry.parsed.duration_minutes == minutes


def test_flags_clock_out_in_a_later_year(tmp_path: Path) -> None:
    path = write(tmp_path, "time_entry,Someone,Mon 12/29/25 3:44 PM,Wed 8/12/26 5:00 PM,325456\n")
    [entry] = outcomes(path)
    assert "CLOCK_OUT_IN_LATER_YEAR" in entry.warning_codes


def test_zero_and_negative_durations_are_excluded_but_retained(tmp_path: Path) -> None:
    path = write(
        tmp_path,
        "time_entry,A,Sat 10/11/25 7:01 AM,Sat 10/11/25 7:01 AM,0\n"
        "time_entry,B,Sat 10/11/25 7:01 AM,Sat 10/11/25 6:01 AM,-60\n",
    )
    results = outcomes(path)
    assert all(r.status is OutcomeStatus.ACCEPTED for r in results)
    assert all(r.parsed is not None and r.parsed.plausible is False for r in results)
    assert "ZERO_DURATION" in results[0].warning_codes
    assert "NEGATIVE_DURATION" in results[1].warning_codes


def test_quarantines_unusable_duration(tmp_path: Path) -> None:
    path = write(tmp_path, "time_entry,Someone,Sat 10/11/25 7:01 AM,Sat 10/11/25 1:57 PM,abc\n")
    [entry] = outcomes(path)
    assert entry.status is OutcomeStatus.QUARANTINED
    assert "DURATION_INVALID" in entry.reason_codes
    assert entry.parsed is None


def test_row_accounting_holds(tmp_path: Path) -> None:
    path = write(
        tmp_path,
        "time_entry,A,Sat 10/11/25 7:01 AM,Sat 10/11/25 1:57 PM,416\n"
        "time_entry,B,Sat 10/11/25 7:01 AM,Sat 10/11/25 1:57 PM,bad\n",
    )
    results = outcomes(path)
    accepted = [r for r in results if r.status is OutcomeStatus.ACCEPTED]
    quarantined = [r for r in results if r.status is OutcomeStatus.QUARANTINED]
    assert len(results) == len(accepted) + len(quarantined)


def test_employee_names_never_leave_the_parser(tmp_path: Path) -> None:
    """The pseudonymous key must not contain or reveal the name."""
    path = write(tmp_path, "time_entry,Jane Doe,Sat 10/11/25 7:01 AM,Sat 10/11/25 1:57 PM,60\n")
    [entry] = outcomes(path)
    assert entry.parsed is not None
    key = entry.parsed.employee_key
    assert "jane" not in key.lower()
    assert "doe" not in key.lower()
    assert len(key) == 16


def test_same_employee_yields_a_stable_key(tmp_path: Path) -> None:
    path = write(
        tmp_path,
        "time_entry,Jane Doe,Sat 10/11/25 7:01 AM,Sat 10/11/25 1:57 PM,60\n"
        "time_entry,jane doe,Sun 10/12/25 7:01 AM,Sun 10/12/25 1:57 PM,60\n",
    )
    first, second = outcomes(path)
    assert first.parsed is not None and second.parsed is not None
    assert first.parsed.employee_key == second.parsed.employee_key


def test_rejects_missing_columns(tmp_path: Path) -> None:
    path = tmp_path / "bad.csv"
    path.write_text("record_type,employee_name\ntime_entry,A\n", encoding="utf-8", newline="")
    with pytest.raises(TimesheetSchemaError):
        outcomes(path)
