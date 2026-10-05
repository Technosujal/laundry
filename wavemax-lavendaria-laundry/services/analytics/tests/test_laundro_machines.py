from __future__ import annotations

from decimal import Decimal
from pathlib import Path

import pytest

from app.ingestion.laundro_machines import (
    DRYER,
    UNKNOWN,
    WASHER,
    LaundroMachineSchemaError,
    classify_machine,
    parse_machine_totals,
)
from app.ingestion.models import OutcomeStatus
from app.metrics.definitions import METRICS, METRICS_BY_ID, CoverageState


def write_csv(tmp_path: Path, body: str) -> Path:
    path = tmp_path / "machines.csv"
    path.write_text(body, encoding="utf-8", newline="")
    return path


def outcomes_for(path: Path):
    return list(parse_machine_totals(path, source_sha256="b" * 64))


def test_classifies_by_vendor_prefix() -> None:
    assert classify_machine("W01") == WASHER
    assert classify_machine("D56") == DRYER
    assert classify_machine("X99") == UNKNOWN


def test_parses_and_classifies_rows(tmp_path: Path) -> None:
    path = write_csv(tmp_path, "Machine,Total Revenue,Total Cycles\nW01,100.50,10\nD01,50.25,0\n")
    results = outcomes_for(path)
    assert [r.status for r in results] == [OutcomeStatus.ACCEPTED] * 2
    assert results[0].parsed is not None
    assert results[0].parsed.machine_class == WASHER
    assert results[0].parsed.total_revenue == Decimal("100.50")
    assert results[1].parsed is not None
    assert results[1].parsed.machine_class == DRYER


def test_flags_revenue_without_cycles(tmp_path: Path) -> None:
    """Dryers in the supplied export report revenue and no cycles; the gap must stay visible."""
    path = write_csv(tmp_path, "Machine,Total Revenue,Total Cycles\nD01,50.25,0\n")
    results = outcomes_for(path)
    assert "REVENUE_WITHOUT_CYCLES" in results[0].warning_codes
    assert results[0].status is OutcomeStatus.ACCEPTED


def test_flags_unclassified_machine(tmp_path: Path) -> None:
    path = write_csv(tmp_path, "Machine,Total Revenue,Total Cycles\nX1,1,1\n")
    assert "UNCLASSIFIED_MACHINE" in outcomes_for(path)[0].warning_codes


def test_flags_duplicate_machine(tmp_path: Path) -> None:
    path = write_csv(tmp_path, "Machine,Total Revenue,Total Cycles\nW01,1,1\nW01,2,2\n")
    results = outcomes_for(path)
    assert "DUPLICATE_MACHINE" in results[1].warning_codes
    assert results[1].parsed is not None


def test_quarantines_invalid_numbers(tmp_path: Path) -> None:
    path = write_csv(tmp_path, "Machine,Total Revenue,Total Cycles\nW01,abc,1\n")
    results = outcomes_for(path)
    assert results[0].status is OutcomeStatus.QUARANTINED
    assert "TOTAL_REVENUE_INVALID" in results[0].reason_codes


def test_rejects_wrong_headers(tmp_path: Path) -> None:
    with pytest.raises(LaundroMachineSchemaError):
        outcomes_for(write_csv(tmp_path, "Machine,Revenue\nW01,1\n"))


def test_every_metric_definition_is_complete() -> None:
    """No measure may ship without the fields required to defend it."""
    for metric in METRICS:
        assert metric.business_meaning.strip(), metric.metric_id
        assert metric.formula.strip(), metric.metric_id
        assert metric.source_files, metric.metric_id
        assert metric.source_fields, metric.metric_id
        assert metric.population.strip(), metric.metric_id
        assert metric.drill_down.strip(), metric.metric_id
        assert metric.coverage_note.strip(), metric.metric_id
        assert isinstance(metric.coverage_state, CoverageState)


def test_partial_measures_declare_their_limitations() -> None:
    """A partial measure that does not say what it is missing would mislead."""
    for metric in METRICS:
        if metric.coverage_state is CoverageState.PARTIAL:
            assert metric.known_limitations, metric.metric_id


def test_washer_cycles_metric_warns_against_use_as_denominator() -> None:
    metric = METRICS_BY_ID["washer_cycles_total"]
    assert metric.coverage_state is CoverageState.PARTIAL
    assert any("denominator" in item for item in metric.known_limitations)


def test_wdf_sales_metric_declares_the_commercial_gap() -> None:
    metric = METRICS_BY_ID["wdf_pos_paid_sales_total"]
    assert metric.coverage_state is CoverageState.PARTIAL
    assert any("commercial" in item.lower() for item in metric.exclusions)
