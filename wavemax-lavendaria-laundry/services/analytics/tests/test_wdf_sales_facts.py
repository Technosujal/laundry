from __future__ import annotations

from decimal import Decimal

from app.metrics.wdf_sales_analytics import build_sales_analytics
from app.metrics.wdf_sales_facts import COLUMN_NAMES, build_sales_facts
from tests.test_wdf_sales_analytics import SAMPLE, line


def _decode(facts: dict) -> list[list[int]]:
    columns = [
        [int(value) for value in facts["data"][name].split(",") if value != ""]
        for name in COLUMN_NAMES
    ]
    return [list(row) for row in zip(*columns, strict=True)]


def test_empty_lines_report_unavailable() -> None:
    facts = build_sales_facts([])
    assert facts["available"] is False


def test_every_line_is_published_once() -> None:
    facts = build_sales_facts(SAMPLE)
    rows = _decode(facts)
    assert facts["row_count"] == len(SAMPLE)
    assert len(rows) == len(SAMPLE)
    for name in COLUMN_NAMES:
        assert len(facts["data"][name].split(",")) == len(SAMPLE)


def test_facts_reconcile_to_the_aggregate_series() -> None:
    """The fact table and the published series must be two views of the same lines."""
    facts = build_sales_facts(SAMPLE)
    analytics = build_sales_analytics(SAMPLE)
    totals = analytics["totals"]

    assert Decimal(facts["checksum"]["subtotal_cents"]) / 100 == Decimal(totals["net_sales"])
    assert Decimal(facts["checksum"]["tax_units"]) / 100_000 == Decimal(totals["tax"])
    assert Decimal(facts["checksum"]["pounds_milli"]) / 1000 == Decimal(totals["pounds"])
    assert facts["checksum"]["line_count"] == totals["line_count"]
    assert facts["checksum"]["order_count"] == totals["order_count"]


def test_filtering_the_facts_matches_the_published_department_series() -> None:
    """Summing a filtered slice of the fact table must equal the service's own subtotal."""
    facts = build_sales_facts(SAMPLE)
    analytics = build_sales_analytics(SAMPLE)
    rows = _decode(facts)
    department_column = COLUMN_NAMES.index("department")
    subtotal_column = COLUMN_NAMES.index("subtotal_cents")
    order_column = COLUMN_NAMES.index("order")

    for published in analytics["by_department"]:
        index = facts["departments"].index(published["name"])
        matching = [row for row in rows if row[department_column] == index]
        cents = sum(row[subtotal_column] for row in matching)
        assert Decimal(cents) / 100 == Decimal(published["subtotal"])
        assert len({row[order_column] for row in matching}) == published["order_count"]
        assert len(matching) == published["line_count"]


def test_dimension_values_are_deduplicated() -> None:
    facts = build_sales_facts(SAMPLE)
    assert len(facts["orders"]) == len(set(facts["orders"])) == 3
    assert len(facts["departments"]) == len(set(facts["departments"])) == 2


def test_tax_survives_sub_cent_precision() -> None:
    """Tax in the source carries up to 17 decimal places, so cent-scaling would lose money."""
    fine = line(when=SAMPLE[0].paid_at, order="# 5", subtotal="1.00")
    fine.tax = Decimal("0.21684")
    facts = build_sales_facts([fine] * 100)
    # Rounded to cents per line this would be 100 x 0.22 = 22.00, not the true 21.684.
    assert Decimal(facts["checksum"]["tax_units"]) / 100_000 == Decimal("21.684")


def test_pounds_are_counted_only_for_weighed_lines() -> None:
    facts = build_sales_facts(
        [
            line(when=SAMPLE[0].paid_at, order="# 9", subtotal="1.00", quantity="5", units="lb"),
            line(when=SAMPLE[0].paid_at, order="# 9", subtotal="1.00", quantity="5", units=None),
        ]
    )
    assert facts["checksum"]["pounds_milli"] == 5000
