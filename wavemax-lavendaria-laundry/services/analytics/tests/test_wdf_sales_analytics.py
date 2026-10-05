from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from pathlib import Path

import pytest
from openpyxl import Workbook

from app.ingestion.wdf_financial_summary import (
    FinancialSummarySchemaError,
    parse_financial_summary,
)
from app.metrics.wdf_sales_analytics import SalesLine, build_sales_analytics


def line(
    *,
    when: datetime,
    order: str,
    subtotal: str,
    quantity: str = "1",
    units: str | None = None,
    department: str = "Laundry",
    category: str = "Drop-Off Laundry",
    item: str = "Wash-Dry-Fold Next Day",
    laundry: bool = True,
) -> SalesLine:
    return SalesLine(
        paid_at=when,
        order_number=order,
        category=category,
        department=department,
        item_name=item,
        quantity=Decimal(quantity),
        units=units,
        subtotal=Decimal(subtotal),
        tax=Decimal("0"),
        laundry_service=laundry,
    )


SAMPLE = [
    line(when=datetime(2025, 1, 6, 9, 30), order="# 1", subtotal="10.00", quantity="8", units="lb"),
    line(when=datetime(2025, 1, 6, 9, 45), order="# 1", subtotal="5.00"),
    line(
        when=datetime(2025, 2, 10, 14, 0), order="# 2", subtotal="20.00", quantity="4", units="lb"
    ),
    line(
        when=datetime(2025, 2, 11, 16, 0),
        order="# 3",
        subtotal="7.50",
        department="Retail Sales Bags",
        category="Retail Sales",
        item="Laundry Bag",
        laundry=False,
    ),
]


def test_empty_input_is_reported_as_unavailable() -> None:
    assert build_sales_analytics([])["available"] is False


def test_totals_match_the_sum_of_lines() -> None:
    result = build_sales_analytics(SAMPLE)
    assert result["totals"]["net_sales"] == "42.50"
    assert result["totals"]["order_count"] == 3
    assert result["totals"]["line_count"] == 4
    assert result["totals"]["pounds"] == "12"


def test_average_ticket_divides_by_distinct_orders_not_lines() -> None:
    """Two lines on one order must not be counted as two tickets."""
    result = build_sales_analytics(SAMPLE)
    assert result["totals"]["average_ticket"] == "14.17"


@pytest.mark.parametrize(
    "series", ["by_month", "by_day", "by_week", "by_weekday", "by_hour", "by_department"]
)
def test_every_breakdown_sums_back_to_the_total(series: str) -> None:
    """A breakdown that does not reconcile would silently mislead."""
    result = build_sales_analytics(SAMPLE)
    total = sum(Decimal(row["subtotal"]) for row in result[series])
    assert total == Decimal(result["totals"]["net_sales"]), series


def test_months_are_ordered_and_labelled() -> None:
    result = build_sales_analytics(SAMPLE)
    assert [row["period"] for row in result["by_month"]] == ["2025-01", "2025-02"]


def test_momentum_has_no_change_for_the_first_month() -> None:
    result = build_sales_analytics(SAMPLE)
    assert result["momentum"][0]["change"] is None
    assert result["momentum"][1]["change"] is not None


def test_trailing_average_equals_the_value_on_the_first_day() -> None:
    result = build_sales_analytics(SAMPLE)
    first = result["trailing"][0]
    assert first["trailing_average"] == first["subtotal"]


def test_heatmap_covers_every_weekday_and_hour_and_counts_orders() -> None:
    result = build_sales_analytics(SAMPLE)
    assert len(result["heatmap"]) == 7 * 24
    monday_nine = next(
        cell for cell in result["heatmap"] if cell["weekday"] == 0 and cell["hour"] == 9
    )
    # Two lines share one order, so the hour counts one order, not two.
    assert monday_nine["order_count"] == 1


def test_pounds_only_count_lines_measured_in_pounds() -> None:
    result = build_sales_analytics(SAMPLE)
    per_pound = result["per_pound_services"]
    assert all(Decimal(row["pounds"]) > 0 for row in per_pound)


def test_service_split_separates_laundry_from_retail() -> None:
    result = build_sales_analytics(SAMPLE)
    names = {row["name"] for row in result["by_service_type"]}
    assert names == {"Laundry service", "Retail"}


def _workbook(tmp_path: Path, rows: list[list[object]]) -> Path:
    book = Workbook()
    sheet = book.active
    sheet.title = "Financial Summary"
    for row in rows:
        sheet.append(row)
    path = tmp_path / "summary.xlsx"
    book.save(path)
    book.close()
    return path


def test_financial_summary_reads_totals_and_payments(tmp_path: Path) -> None:
    path = _workbook(
        tmp_path,
        [
            ["Net Sales", 100],
            ["Net Tax 1", 8],
            ["Credit Card Tips", 2],
            ["Grand Total", 110],
            ["Payment Types", None],
            ["Cash", 40],
            ["Credit Card", 70],
        ],
    )
    summary = parse_financial_summary(path)
    assert summary.totals["Net Sales"] == Decimal("100")
    assert summary.payments["Cash"] == Decimal("40")
    assert summary.reconciles is True


def test_financial_summary_reports_a_mismatch_rather_than_hiding_it(tmp_path: Path) -> None:
    path = _workbook(
        tmp_path,
        [["Net Sales", 100], ["Net Tax 1", 8], ["Credit Card Tips", 2], ["Grand Total", 999]],
    )
    summary = parse_financial_summary(path)
    assert summary.reconciles is False
    assert "999" in summary.reconciliation_note


def test_financial_summary_requires_its_key_labels(tmp_path: Path) -> None:
    path = _workbook(tmp_path, [["Something Else", 1]])
    with pytest.raises(FinancialSummarySchemaError):
        parse_financial_summary(path)
