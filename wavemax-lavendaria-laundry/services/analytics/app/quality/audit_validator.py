from __future__ import annotations

import json
import re
from dataclasses import asdict, dataclass
from decimal import Decimal
from pathlib import Path
from typing import Any


class BlockingDataQualityError(ValueError):
    """Raised when an audited blocking rule fails before artifact publication."""


@dataclass(frozen=True, slots=True)
class QualityResult:
    check_id: str
    check: str
    status: str
    action_on_fail: str
    detail: str
    display_state: str
    data_use: str
    rule_reason: str
    next_step: str


RULE_METADATA = {
    "V01": ("Block", "Required files must exist.", "Add missing exports"),
    "V02": ("Block", "Sales must match period.", "Use matching sales dates"),
    "V03": ("Included", "Missing dates remain visible.", "Export complete daily history"),
    "V04": ("Excluded", "Outside-period VAC is ignored.", "Use matching VAC dates"),
    "V05": ("Excluded", "Incomplete exports are not calculated.", "Export every page"),
    "V06": ("Block", "Sales must reconcile exactly.", "Reconcile sales workbook"),
    "V07": ("Separate", "Sales stay line-based.", "Recheck payment totals"),
    "V08": (
        "Separate",
        "Production records lack paid-sale match.",
        "Review unmatched production orders",
    ),
    "V09": ("Excluded", "Invalid durations are excluded.", "Correct invalid time entries"),
    "V10": ("Excluded", "Incomplete voids are not calculated.", "Export every void"),
    "V11": ("Separate", "Voids remain separately reported.", "Recheck void population"),
    "V12": ("Included", "No stable line ID exists.", "Verify repeated source rows"),
    "V13": ("Included", "Category controls service grouping.", "Correct category flags"),
    "V14": ("Included", "Blanks remain visibly classified.", "Complete missing line fields"),
    "V15": ("Block", "Machine totals must reconcile.", "Reconcile machine totals"),
    "V16": ("Limited", "Dryer revenue remains included.", "Export dryer cycles"),
    "V17": ("Included", "Unusual IDs remain visible.", "Correct invalid machine IDs"),
    "V18": ("Included", "Zero days remain recorded.", "Verify zero-revenue dates"),
    "V19": ("Separate", "Free starts remain separate.", "Review free-start months"),
    "V20": ("Separate", "Revenue remains unchanged.", "Reconcile cash and payouts"),
    "V21": ("Separate", "Order populations stay separate.", "Resolve unmatched order states"),
}


def _decimal(value: Any) -> Decimal:
    return Decimal(str(value or "0"))


def _result(
    actions: dict[str, str], check_id: str, check: str, passed: bool | None, detail: str
) -> QualityResult:
    status = "NOT_EVALUATED" if passed is None else "PASS" if passed else "FAIL"
    action = actions.get(check_id, "warn")
    display_state = (
        "PASS"
        if status == "PASS"
        else "N/A"
        if status == "NOT_EVALUATED"
        else "BLOCK"
        if action == "block"
        else "REVIEW"
        if action == "warn"
        else "NOTE"
    )
    data_use, rule_reason, next_step = RULE_METADATA[check_id]
    return QualityResult(
        check_id,
        check,
        status,
        action,
        detail,
        display_state,
        data_use,
        rule_reason,
        "None" if status == "PASS" else next_step,
    )


def validate_artifact(artifact: dict[str, Any], config_path: Path) -> dict[str, Any]:
    """Evaluate the audit rules against the canonical artifact before it can be written.

    Rules that need raw fields not yet retained by the canonical artifact are explicitly marked
    NOT_EVALUATED. They never become an assumed pass. All configured blocking rules are fully
    evaluated here and abort publication on failure.
    """
    config = json.loads(config_path.read_text(encoding="utf-8"))
    actions: dict[str, str] = config["actions"]
    thresholds = config["thresholds"]
    tolerance = _decimal(config["tolerances"]["money_abs"])
    wdf = artifact["wdf_sales"]
    analytics = wdf["analytics"]
    operations = wdf["operations"]
    financial = wdf["financial_summary"]
    metrics = artifact["metrics"]
    machines = artifact["machines"]
    workforce = artifact["workforce"]
    sources = {source["file"] for source in artifact["sources"]}

    required = {
        "WDF POS 2025 report -2025-01-01 to 2025-12-31.xlsx",
        "history_report - Machine Revenue.csv",
        "history_report - Payments.csv",
        "history_report - Free Starts.csv",
        "history_report - Number of Accounts Used.csv",
        "history_report - New Cards Dispensed.csv",
        "history_report - Machine Cycles (All Washers).csv",
        "Machine Breakdown Report - Individual Machine Totals-3.csv",
    }
    missing = sorted(required - sources)
    results = [
        _result(
            actions,
            "V01",
            "Required exports present",
            not missing,
            "All required files found" if not missing else f"Missing: {', '.join(missing)}",
        ),
        _result(
            actions,
            "V02",
            "Sales lines inside reporting period",
            analytics["totals"]["first_day"] >= config["period"]["start"]
            and analytics["totals"]["last_day"] <= config["period"]["end"],
            f"{analytics['totals']['first_day']} to {analytics['totals']['last_day']}",
        ),
    ]
    daily_metrics = [metric for metric in metrics.values() if "distinct_days" in metric]
    results.append(
        _result(
            actions,
            "V03",
            "LaundroPortal history covers every day",
            all(metric["distinct_days"] == 365 for metric in daily_metrics),
            f"{len(daily_metrics)} daily series evaluated",
        )
    )
    vac = artifact["vac"]
    vac_in_period = not vac.get("available") or (
        (vac.get("first_seen") or "")[:10] >= config["period"]["start"]
        and (vac.get("last_seen") or "")[:10] <= config["period"]["end"]
    )
    results.append(
        _result(
            actions,
            "V04",
            "Other dated files inside period",
            vac_in_period,
            "VAC log is outside 2025 and is excluded"
            if not vac_in_period
            else "Dated optional sources are inside period",
        )
    )
    coverage = operations["coverage"]
    low = [
        f"{name} {row['displayed']}/{row['reported']}"
        for name, row in coverage.items()
        if row.get("reported")
        and Decimal(row["displayed"]) / Decimal(row["reported"]) * 100
        < _decimal(config["tolerances"]["export_min_coverage_pct"])
    ]
    results.append(
        _result(
            actions,
            "V05",
            "Paged exports contain all rows",
            not low,
            "; ".join(low) if low else "All evaluated exports meet coverage threshold",
        )
    )
    net = _decimal(wdf["total"])
    summary_net = _decimal(financial["totals"].get("Net Sales"))
    results.append(
        _result(
            actions,
            "V06",
            "Line subtotals equal Financial Summary Net Sales",
            abs(net - summary_net) <= tolerance,
            f"lines {net} vs summary {summary_net}",
        )
    )
    payment_gap = _decimal(financial["payment_gap"])
    results.append(
        _result(
            actions,
            "V07",
            "Grand Total equals payment types",
            abs(payment_gap) <= tolerance,
            f"payment gap {payment_gap}",
        )
    )
    missing_orders = int(wdf["coverage"]["absent_commercial_orders"])
    results.append(
        _result(
            actions,
            "V08",
            "Production orders present in paid sales",
            missing_orders <= int(thresholds["unpaid_production_orders_max"]),
            f"{missing_orders} processed orders absent from paid sales",
        )
    )
    excluded = int(workforce["excluded_entries"])
    results.append(
        _result(
            actions,
            "V09",
            "Timesheet entries within limits",
            excluded == 0,
            f"{excluded} entries excluded by the established timesheet rule",
        )
    )
    void_rows = operations["voids"]["by_customer"]
    void_detail = _decimal(operations["voids"]["displayed_total"])
    top_void = max((_decimal(row["amount"]) for row in void_rows), default=Decimal("0"))
    top_share = top_void / void_detail * 100 if void_detail else Decimal("0")
    void_complete = bool(coverage.get("voids", {}).get("complete"))
    results.append(
        _result(
            actions,
            "V10",
            "No single customer dominates voids",
            top_share <= _decimal(thresholds["void_top_customer_share_pct"])
            if void_complete
            else None,
            f"top masked customer share {top_share.quantize(Decimal('0.01'))}%"
            if void_complete
            else "Not calculated because the void export is incomplete",
        )
    )
    void_total = _decimal(financial["totals"].get("Total Voided Sales"))
    void_rate = void_total / net * 100 if net else Decimal("0")
    results.append(
        _result(
            actions,
            "V11",
            "Voided sales divided by paid sales within limit",
            void_rate <= _decimal(thresholds["void_rate_pct_of_sales"]),
            f"void rate {void_rate.quantize(Decimal('0.01'))}%",
        )
    )
    source_quality = wdf["source_quality"]
    duplicate_lines = int(source_quality["duplicate_lines"])
    results.append(
        _result(
            actions,
            "V12",
            "No exact duplicate sales lines",
            duplicate_lines <= int(thresholds["duplicate_sales_lines_max"]),
            f"{duplicate_lines} duplicate lines worth {source_quality['duplicate_value']}",
        )
    )
    conflicts = int(source_quality["category_flag_conflicts"])
    results.append(
        _result(
            actions,
            "V13",
            "Category and laundry flag agree",
            conflicts == 0,
            f"{conflicts} conflicting lines worth {source_quality['category_flag_conflict_value']}",
        )
    )
    blank_units = int(source_quality["blank_units"])
    blank_categories = int(source_quality["blank_categories"])
    results.append(
        _result(
            actions,
            "V14",
            "Units and Category filled",
            blank_units + blank_categories == 0,
            f"{blank_units} blank units, {blank_categories} blank categories",
        )
    )
    machine_total = sum(
        (_decimal(row["revenue"]) for row in machines["by_class"].values()), Decimal("0")
    )
    history_total = _decimal(metrics["machine_revenue_total"]["total"])
    created_orders = int(coverage["order_list"].get("reported") or 0)
    results.append(
        _result(
            actions,
            "V15",
            "Machine totals equal daily machine revenue",
            abs(machine_total - history_total) <= tolerance,
            f"machines {machine_total} vs daily {history_total}",
        )
    )
    dryer_missing = sum(
        1
        for row in machines["machines"]
        if row["machine_class"] == "DRYER"
        and _decimal(row["revenue"]) > 0
        and _decimal(row["cycles"]) == 0
    )
    results.append(
        _result(
            actions,
            "V16",
            "Dryers with revenue report cycles",
            dryer_missing == 0,
            f"{dryer_missing} dryers have revenue and zero cycles in this export",
        )
    )
    bad_ids = [
        row["machine"]
        for row in machines["machines"]
        if re.fullmatch(r"[WD]\d{2}", row["machine"]) is None
    ]
    results.append(
        _result(
            actions,
            "V17",
            "Machine IDs follow W##/D##",
            not bad_ids,
            f"Unexpected IDs: {', '.join(bad_ids) if bad_ids else 'none'}",
        )
    )
    zeros = [
        row["period"]
        for row in metrics["machine_revenue_total"]["by_day"]
        if _decimal(row["value"]) == 0
    ]
    results.append(
        _result(
            actions,
            "V18",
            "No zero-revenue days",
            not zeros,
            f"Zero days: {', '.join(zeros) if zeros else 'none'}",
        )
    )
    revenue_months = {
        row["period"]: _decimal(row["value"])
        for row in metrics["machine_revenue_total"]["by_month"]
    }
    free_months = {
        row["period"]: _decimal(row["value"])
        for row in metrics["management_card_starts_value"]["by_month"]
    }
    over = [
        period
        for period, value in free_months.items()
        if revenue_months.get(period, Decimal("0"))
        and value / revenue_months[period] * 100 > _decimal(thresholds["free_start_rate_pct_month"])
    ]
    results.append(
        _result(
            actions,
            "V19",
            "Free-start rate within monthly limit",
            not over,
            f"Months over limit: {', '.join(over) if over else 'none'}",
        )
    )
    cash = _decimal(financial["payments"].get("Cash"))
    payouts = _decimal(financial["totals"].get("Total Payouts"))
    results.append(
        _result(
            actions,
            "V20",
            "Payouts do not exceed cash sales",
            payouts <= cash,
            f"expected deposit {cash - payouts}",
        )
    )
    results.append(
        _result(
            actions,
            "V21",
            "Created order count equals paid orders",
            created_orders == int(wdf["order_count"]),
            (
                f"{created_orders} created orders vs {wdf['order_count']} paid orders; "
                "populations remain separately labelled"
            ),
        )
    )

    blocked = [row for row in results if row.status == "FAIL" and row.action_on_fail == "block"]
    health = {
        "checks": len(results),
        "pass": sum(row.status == "PASS" for row in results),
        "fail": sum(row.status == "FAIL" for row in results),
        "not_evaluated": sum(row.status == "NOT_EVALUATED" for row in results),
        "blocking": len(blocked),
        "results": [asdict(row) for row in results],
    }
    if blocked:
        names = ", ".join(row.check_id for row in blocked)
        raise BlockingDataQualityError(
            f"Artifact publication blocked by data-quality checks: {names}"
        )
    return health
