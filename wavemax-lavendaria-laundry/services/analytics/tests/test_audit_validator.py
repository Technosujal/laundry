from copy import deepcopy
from pathlib import Path

import pytest

from app.quality.audit_validator import BlockingDataQualityError, validate_artifact

CONFIG = Path(__file__).parents[1] / "config" / "dq_config.yaml"


def _artifact() -> dict:
    required = [
        "WDF POS 2025 report -2025-01-01 to 2025-12-31.xlsx",
        "history_report - Machine Revenue.csv",
        "history_report - Payments.csv",
        "history_report - Free Starts.csv",
        "history_report - Number of Accounts Used.csv",
        "history_report - New Cards Dispensed.csv",
        "history_report - Machine Cycles (All Washers).csv",
        "Machine Breakdown Report - Individual Machine Totals-3.csv",
    ]
    daily = [{"period": "2025-01-01", "value": "10"}]
    metrics = {f"series_{index}": {"distinct_days": 365} for index in range(4)}
    metrics.update(
        {
            "machine_revenue_total": {
                "distinct_days": 365,
                "total": "10.00",
                "by_day": daily,
                "by_month": [{"period": "2025-01", "value": "10"}],
            },
            "management_card_starts_value": {
                "distinct_days": 365,
                "by_month": [{"period": "2025-01", "value": "0"}],
            },
        }
    )
    return {
        "sources": [{"file": name} for name in required],
        "metrics": metrics,
        "vac": {"available": False},
        "machines": {
            "by_class": {"WASHER": {"revenue": "10.00"}},
            "machines": [
                {"machine": "W01", "machine_class": "WASHER", "revenue": "10", "cycles": "1"}
            ],
        },
        "workforce": {"excluded_entries": 0},
        "wdf_sales": {
            "total": "100.00",
            "order_count": 10,
            "coverage": {"absent_commercial_orders": 0},
            "source_quality": {
                "duplicate_lines": 0,
                "duplicate_value": "0.00",
                "category_flag_conflicts": 0,
                "category_flag_conflict_value": "0.00",
                "blank_units": 0,
                "blank_categories": 0,
            },
            "analytics": {"totals": {"first_day": "2025-01-01", "last_day": "2025-12-31"}},
            "financial_summary": {
                "totals": {
                    "Net Sales": "100.00",
                    "Grand Total": "100.00",
                    "Total Voided Sales": "0.00",
                    "Total Payouts": "0.00",
                },
                "payments": {"Cash": "100.00"},
                "payment_gap": "0.00",
            },
            "operations": {
                "coverage": {
                    "order_list": {"displayed": 10, "reported": 10},
                },
                "voids": {"by_customer": [], "displayed_total": "0.00"},
            },
        },
    }


def test_validator_emits_all_audited_checks() -> None:
    health = validate_artifact(_artifact(), CONFIG)

    assert health["checks"] == 21
    assert health["blocking"] == 0
    assert {row["check_id"] for row in health["results"]} == {
        f"V{number:02d}" for number in range(1, 22)
    }


def test_validator_blocks_publication_when_sales_do_not_reconcile() -> None:
    artifact = deepcopy(_artifact())
    artifact["wdf_sales"]["financial_summary"]["totals"]["Net Sales"] = "99.00"

    with pytest.raises(BlockingDataQualityError, match="V06"):
        validate_artifact(artifact, CONFIG)
