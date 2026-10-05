from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum
from typing import Any

DEFINITION_VERSION = "wavemax-metrics/1.0.0"


class CoverageState(StrEnum):
    """How completely the supplied evidence covers the measure's intended population."""

    COMPLETE = "COMPLETE"
    PARTIAL = "PARTIAL"


@dataclass(frozen=True, slots=True)
class MetricDefinition:
    """A published measure and everything required to defend it.

    Nothing may be displayed in the product unless it has one of these. Fields mirror the
    calculation standard: a reader must be able to see what was counted, what was left out,
    and what remains unproven, without opening the source files.
    """

    metric_id: str
    label: str
    business_meaning: str
    formula: str
    source_system: str
    source_files: tuple[str, ...]
    source_fields: tuple[str, ...]
    unit: str
    grain: str
    population: str
    inclusions: tuple[str, ...]
    exclusions: tuple[str, ...]
    null_treatment: str
    duplicate_treatment: str
    rounding: str
    timezone_basis: str
    coverage_state: CoverageState
    coverage_note: str
    known_limitations: tuple[str, ...]
    drill_down: str
    definition_version: str = DEFINITION_VERSION

    def as_dict(self) -> dict[str, Any]:
        return {
            "metric_id": self.metric_id,
            "label": self.label,
            "business_meaning": self.business_meaning,
            "formula": self.formula,
            "source_system": self.source_system,
            "source_files": list(self.source_files),
            "source_fields": list(self.source_fields),
            "unit": self.unit,
            "grain": self.grain,
            "population": self.population,
            "inclusions": list(self.inclusions),
            "exclusions": list(self.exclusions),
            "null_treatment": self.null_treatment,
            "duplicate_treatment": self.duplicate_treatment,
            "rounding": self.rounding,
            "timezone_basis": self.timezone_basis,
            "coverage_state": str(self.coverage_state),
            "coverage_note": self.coverage_note,
            "known_limitations": list(self.known_limitations),
            "drill_down": self.drill_down,
            "definition_version": self.definition_version,
        }


_UNCONFIRMED_TZ = (
    "Source days are used exactly as exported, with no timezone conversion applied. The store "
    "timezone is not yet confirmed, so no re-bucketing is performed that would depend on it."
)

_LAUNDRO_DAILY = "LaundroPortal daily history export"

METRICS: tuple[MetricDefinition, ...] = (
    MetricDefinition(
        metric_id="machine_revenue_total",
        label="Machine revenue",
        business_meaning=(
            "Value spent by customers at the machines. This is money consumed at washers and "
            "dryers, not money loaded onto cards and not wash-dry-fold sales."
        ),
        formula="sum(Amount) over the machine revenue daily history",
        source_system="LAUNDRO_PORTAL",
        source_files=("history_report - Machine Revenue.csv",),
        source_fields=("Day", "Amount"),
        unit="CURRENCY_USD",
        grain="day, aggregated to the requested period",
        population="All 56 machines at the single store.",
        inclusions=("Washer cycle value.", "Dryer cycle value."),
        exclusions=(
            "Card value loaded but not yet spent.",
            "Wash-dry-fold counter sales recorded in WDF.",
        ),
        null_treatment=(
            "No null amounts occur; any row failing to parse is quarantined, never skipped."
        ),
        duplicate_treatment="Duplicate days are flagged as warnings and retained, not merged.",
        rounding="Exact decimal arithmetic. No intermediate rounding.",
        timezone_basis=_UNCONFIRMED_TZ,
        coverage_state=CoverageState.COMPLETE,
        coverage_note=(
            "365 distinct days for calendar 2025 with no gaps, and the total reconciles exactly "
            "to the independent per-machine breakdown export."
        ),
        known_limitations=(
            "Covers machine revenue only. It is not total store revenue and must not be "
            "labelled as such.",
        ),
        drill_down="Daily values, plus the per-machine breakdown by washer and dryer.",
    ),
    MetricDefinition(
        metric_id="washer_cycles_total",
        label="Washer cycles",
        business_meaning="Completed wash cycles.",
        formula="sum(Amount) over the washer cycles daily history",
        source_system="LAUNDRO_PORTAL",
        source_files=("history_report - Machine Cycles (All Washers).csv",),
        source_fields=("Day", "Amount"),
        unit="COUNT",
        grain="day, aggregated to the requested period",
        population="The 26 washers only.",
        inclusions=("Washer cycles.",),
        exclusions=("All dryer activity, which the supplied export does not contain.",),
        null_treatment="Rows failing to parse are quarantined, never skipped.",
        duplicate_treatment="Duplicate days are flagged as warnings and retained.",
        rounding="Exact integer counts.",
        timezone_basis=_UNCONFIRMED_TZ,
        coverage_state=CoverageState.PARTIAL,
        coverage_note=(
            "Complete for washers across 365 days, but dryers are absent from this export. The "
            "vendor does record dryer cycles, split into full and top-off, so this is a gap in "
            "what was supplied rather than a gap in the data that exists."
        ),
        known_limitations=(
            "This is not a total cycle count for the store.",
            "It must never be used as the denominator for all-machine revenue. In a vendor "
            "summary sample, top-off dryer cycles alone were roughly three quarters of all cycles.",
        ),
        drill_down="Daily washer cycle counts, plus per-washer cycle totals.",
    ),
    MetricDefinition(
        metric_id="card_value_loaded_total",
        label="Card value loaded",
        business_meaning=(
            "Money customers put onto laundry cards. This is a deposit, not a sale. It becomes "
            "revenue only when it is later spent at a machine."
        ),
        formula="sum(Amount) over the payments daily history",
        source_system="LAUNDRO_PORTAL",
        source_files=("history_report - Payments.csv",),
        source_fields=("Day", "Amount"),
        unit="CURRENCY_USD",
        grain="day, aggregated to the requested period",
        population="All card load transactions at the single store.",
        inclusions=("Cash loads.", "Credit and debit loads."),
        exclusions=("Machine spend.", "WDF counter sales."),
        null_treatment="Rows failing to parse are quarantined, never skipped.",
        duplicate_treatment="Duplicate days are flagged as warnings and retained.",
        rounding="Exact decimal arithmetic.",
        timezone_basis=_UNCONFIRMED_TZ,
        coverage_state=CoverageState.COMPLETE,
        coverage_note="365 distinct days for calendar 2025 with no gaps.",
        known_limitations=(
            "Loading and spending are different events in different periods, so this figure must "
            "never be added to machine revenue or presented as sales.",
        ),
        drill_down="Daily loaded value.",
    ),
    MetricDefinition(
        metric_id="accounts_used_total",
        label="Account activity",
        business_meaning=(
            "How many card accounts were active each day, summed across the period. This counts "
            "visits, not people."
        ),
        formula="sum(Amount) over the accounts-used daily history",
        source_system="LAUNDRO_PORTAL",
        source_files=("history_report - Number of Accounts Used.csv",),
        source_fields=("Day", "Amount"),
        unit="COUNT",
        grain="day, aggregated to the requested period",
        population="Card accounts active per day.",
        inclusions=("Any account used at least once on a day.",),
        exclusions=("Cash-only customers who never touch a card.",),
        null_treatment="Rows failing to parse are quarantined, never skipped.",
        duplicate_treatment="Duplicate days are flagged as warnings and retained.",
        rounding="Exact integer counts.",
        timezone_basis=_UNCONFIRMED_TZ,
        coverage_state=CoverageState.COMPLETE,
        coverage_note="365 distinct days for calendar 2025 with no gaps.",
        known_limitations=(
            "A returning customer is counted on every day they visit, so this is not a unique "
            "customer count and must never be labelled as one.",
        ),
        drill_down="Daily active account counts.",
    ),
    MetricDefinition(
        metric_id="new_cards_total",
        label="New cards dispensed",
        business_meaning="Laundry cards issued, a proxy for first-time card customers.",
        formula="sum(Amount) over the new-cards daily history",
        source_system="LAUNDRO_PORTAL",
        source_files=("history_report - New Cards Dispensed.csv",),
        source_fields=("Day", "Amount"),
        unit="COUNT",
        grain="day, aggregated to the requested period",
        population="Cards dispensed at the single store.",
        inclusions=("Newly issued cards.",),
        exclusions=("Reloads of existing cards.",),
        null_treatment="Rows failing to parse are quarantined, never skipped.",
        duplicate_treatment="Duplicate days are flagged as warnings and retained.",
        rounding="Exact integer counts.",
        timezone_basis=_UNCONFIRMED_TZ,
        coverage_state=CoverageState.PARTIAL,
        coverage_note=(
            "Complete daily coverage for 2025, but a vendor summary shows replacement cards are "
            "reported separately from regular issues, and the supplied daily export does not "
            "make that split available."
        ),
        known_limitations=(
            "Replacements cannot be separated from genuinely new customers here, so this "
            "overstates new-customer acquisition by an unknown amount.",
        ),
        drill_down="Daily dispensed counts.",
    ),
    MetricDefinition(
        metric_id="management_card_starts_value",
        label="Management card starts",
        business_meaning=(
            "Cycle value started on management cards rather than paid customer value. This is "
            "the vendor's Free Starts measure."
        ),
        formula="sum(Amount) over the free-starts daily history",
        source_system="LAUNDRO_PORTAL",
        source_files=("history_report - Free Starts.csv",),
        source_fields=("Day", "Amount"),
        unit="CURRENCY_USD",
        grain="day, aggregated to the requested period",
        population="Management card starts at the single store.",
        inclusions=("Cycle value consumed by management cards.",),
        exclusions=("Paid customer cycles.",),
        null_treatment="Rows failing to parse are quarantined, never skipped.",
        duplicate_treatment="Duplicate days are flagged as warnings and retained.",
        rounding="Exact decimal arithmetic.",
        timezone_basis=_UNCONFIRMED_TZ,
        coverage_state=CoverageState.COMPLETE,
        coverage_note=(
            "365 distinct days for 2025. The measure's identity is proven: a vendor monthly "
            "summary reports the same count and value under both Free Starts and Management "
            "Card Starts."
        ),
        known_limitations=(
            "Whether this should be reported as a cost, a discount, or excluded from revenue is "
            "an open client decision, so it is shown on its own and never netted against revenue.",
        ),
        drill_down="Daily management card start value.",
    ),
    MetricDefinition(
        metric_id="wdf_pos_paid_sales_total",
        label="WDF counter sales (paid at point of sale)",
        business_meaning=(
            "Wash-dry-fold and retail sales recorded against a paid date in the annual WDF "
            "workbook."
        ),
        formula="sum(Line Item Subtotal) over all Sales Breakdown rows",
        source_system="WDF_POS",
        source_files=("WDF POS 2025 report -2025-01-01 to 2025-12-31.xlsx",),
        source_fields=("Paid Date", "Line Item Subtotal", "Category", "Department"),
        unit="CURRENCY_USD",
        grain="line item, aggregated to category and department",
        population="Orders paid at the point of sale within the export window.",
        inclusions=(
            "Drop-off laundry line items.",
            "Retail line items.",
            "Refund lines, which are negative.",
        ),
        exclusions=(
            "Voided orders, roughly $23,000 gross in 2025.",
            "Large commercial orders that were processed but never reached the paid-sales export, "
            "roughly $33,000 in 2025.",
        ),
        null_treatment="Rows failing to parse are quarantined with a reason code, never skipped.",
        duplicate_treatment=(
            "Exactly repeated line content is flagged as a warning and retained, because the "
            "export carries no immutable line-item identifier that could prove a true duplicate."
        ),
        rounding="Exact decimal arithmetic on the supplied subtotals.",
        timezone_basis=_UNCONFIRMED_TZ,
        coverage_state=CoverageState.PARTIAL,
        coverage_note=(
            "Every one of the 5,119 supplied rows is accounted for, and the total reconciles "
            "exactly to the workbook's own financial summary. However, reconciliation against "
            "the store's own order list shows this represents roughly 56% of non-voided order "
            "value for 2025."
        ),
        known_limitations=(
            "This is point-of-sale paid sales, not total revenue.",
            "Commercial or on-account work is absent, so the largest orders are not represented.",
            "The workbook and the printed PDF summary disagree slightly on net sales, tax, and "
            "grand total; the line-item basis used here is the one that reconciles exactly.",
        ),
        drill_down="Category, department, and line item totals with row counts.",
    ),
)

WORKFORCE_HOURS = MetricDefinition(
    metric_id="workforce_plausible_hours",
    label="Recorded labour hours (plausible entries)",
    business_meaning=(
        "Hours worked, counting only clock entries of a credible length. The supplied timesheet "
        "contains entries spanning months, which are missed clock-outs rather than real shifts."
    ),
    formula=(
        "sum(duration_minutes) / 60 over accepted time entries where "
        "0 < duration_minutes <= 960 (16 hours)"
    ),
    source_system="WDF_POS",
    source_files=("Timesheet 2025-01-01 to 2025-12-31.csv",),
    source_fields=("employee_name", "clock_in", "clock_out", "duration_minutes"),
    unit="HOURS",
    grain="time entry, aggregated across the period",
    population="Clock entries in the supplied 2025 timesheet export.",
    inclusions=("Entries longer than zero and no longer than 16 hours.",),
    exclusions=(
        "Entries longer than 16 hours, which are excluded from hours but counted and shown.",
        "Zero-length and negative entries, which are likewise excluded and counted.",
    ),
    null_treatment=(
        "Entries without a usable duration are quarantined with a reason code and never skipped."
    ),
    duplicate_treatment=(
        "No duplicate rule is applied; every supplied entry is treated as distinct."
    ),
    rounding="Minutes summed exactly, converted to hours only for display.",
    timezone_basis=(
        "Durations are taken as reported by the source, which records true elapsed time across "
        "daylight-saving transitions. Displayed clock times are truncated to the minute, so "
        "durations are never recomputed from them."
    ),
    coverage_state=CoverageState.PARTIAL,
    coverage_note=(
        "The source reports 19,478.3 hours in total, but 53 entries longer than 24 hours carry "
        "85.4% of that time and three entries alone span 155 to 226 days. Only the plausible "
        "remainder is published as hours."
    ),
    known_limitations=(
        "Excluded entries are real records of something; they are most likely missed clock-outs, "
        "but the cause is unconfirmed and awaiting client input.",
        "Because excluded time is unknown rather than zero, these hours are a lower bound.",
        "Labour cost cannot be derived, as no pay rate exists in any supplied file.",
    ),
    drill_down="Per-employee plausible hours, entry counts, and the excluded-entry count.",
)

METRICS = (*METRICS, WORKFORCE_HOURS)

METRICS_BY_ID = {metric.metric_id: metric for metric in METRICS}
