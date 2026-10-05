from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any

from openpyxl import load_workbook

PARSER_VERSION = "wdf-financial-summary-xlsx/1.0.0"
RULE_VERSION = "wdf-financial-summary-quality/1.0.0"
SHEET_NAME = "Financial Summary"

# Labels are read from the sheet's own first column. Only these are published, so an
# unexpected label is ignored rather than guessed at.
MONEY_LABELS = (
    "Net Sales",
    "Net Tax 1",
    "Credit Card Tips",
    "Credit Card Surcharges",
    "Grand Total",
    "Total Payouts",
    "Total Voided Sales",
)
PAYMENT_LABELS = (
    "Cash",
    "Check",
    "Credit Card",
    "On Account",
    "Store Credit",
    "Gift Card",
    "Other",
)
DEPOSIT_LABELS = (
    "Total Cash Sales",
    "Total Payouts",
    "Total Expected Cash",
    "Total Check Sales",
    "Expected Deposit",
)


class FinancialSummarySchemaError(ValueError):
    """Raised when the workbook does not contain the approved financial summary sheet."""


@dataclass(frozen=True, slots=True)
class FinancialSummary:
    totals: dict[str, Decimal]
    payments: dict[str, Decimal]
    deposit: dict[str, Decimal]
    reconciles: bool
    reconciliation_note: str
    payment_total: Decimal
    payment_gap: Decimal
    payments_reconcile: bool

    def as_dict(self) -> dict[str, Any]:
        return {
            "totals": {k: str(v.quantize(Decimal("0.01"))) for k, v in sorted(self.totals.items())},
            "payments": {
                k: str(v.quantize(Decimal("0.01"))) for k, v in sorted(self.payments.items())
            },
            "deposit": {
                k: str(v.quantize(Decimal("0.01"))) for k, v in sorted(self.deposit.items())
            },
            "reconciles": self.reconciles,
            "reconciliation_note": self.reconciliation_note,
            "payment_total": str(self.payment_total.quantize(Decimal("0.01"))),
            "payment_gap": str(self.payment_gap.quantize(Decimal("0.01"))),
            "payments_reconcile": self.payments_reconcile,
        }


def _decimal(value: Any) -> Decimal | None:
    if value is None or isinstance(value, bool):
        return None
    try:
        result = Decimal(str(value))
    except (InvalidOperation, ValueError):
        return None
    return result if result.is_finite() else None


def parse_financial_summary(path: Path) -> FinancialSummary:
    workbook = load_workbook(path, read_only=True, data_only=True)
    try:
        if SHEET_NAME not in workbook.sheetnames:
            raise FinancialSummarySchemaError(f"Required worksheet is missing: {SHEET_NAME}")
        sheet = workbook[SHEET_NAME]

        totals: dict[str, Decimal] = {}
        payments: dict[str, Decimal] = {}
        deposit: dict[str, Decimal] = {}
        section = "totals"

        for row in sheet.iter_rows(values_only=True):
            label = str(row[0]).strip() if row and row[0] is not None else ""
            if not label:
                continue
            if label == "Payment Types":
                section = "payments"
                continue
            if label == "Expected Deposit Breakdown":
                section = "deposit"
                continue
            amount = _decimal(row[1]) if len(row) > 1 else None
            if amount is None:
                continue
            if section == "payments" and label in PAYMENT_LABELS:
                payments[label] = amount
            elif section == "deposit" and label in DEPOSIT_LABELS:
                deposit[label] = amount
            elif label in MONEY_LABELS:
                totals[label] = amount
    finally:
        workbook.close()

    missing = [label for label in ("Net Sales", "Grand Total") if label not in totals]
    if missing:
        raise FinancialSummarySchemaError(
            f"Financial summary is missing required labels: {missing}"
        )

    # The sheet's own identity: net sales plus tax plus tips should equal its grand total.
    expected = (
        totals.get("Net Sales", Decimal("0"))
        + totals.get("Net Tax 1", Decimal("0"))
        + totals.get("Credit Card Tips", Decimal("0"))
        + totals.get("Credit Card Surcharges", Decimal("0"))
    )
    grand = totals["Grand Total"]
    reconciles = expected == grand
    note = (
        "Net sales plus tax, tips and surcharges equals the sheet's own grand total exactly."
        if reconciles
        else (
            f"Net sales plus tax, tips and surcharges is {expected}, while the sheet reports "
            f"{grand}. The difference is shown rather than resolved."
        )
    )
    payment_total = sum(payments.values(), Decimal("0"))
    payment_gap = payment_total - grand
    return FinancialSummary(
        totals=totals,
        payments=payments,
        deposit=deposit,
        reconciles=reconciles,
        reconciliation_note=note,
        payment_total=payment_total,
        payment_gap=payment_gap,
        payments_reconcile=payment_gap == Decimal("0"),
    )
