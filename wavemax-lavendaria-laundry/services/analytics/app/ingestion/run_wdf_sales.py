from __future__ import annotations

import json
from collections import Counter
from hashlib import sha256
from pathlib import Path
from time import monotonic_ns

from app.ingestion.models import IngestionSummary, OutcomeStatus
from app.ingestion.source_store import ContentAddressedLocalSourceStore
from app.ingestion.wdf_sales import (
    PARSER_VERSION,
    RULE_VERSION,
    parse_wdf_sales_workbook,
)
from app.observability.events import IngestionEvent, IngestionEventLogger


def run_wdf_sales_ingestion(
    *,
    source: Path,
    raw_store: Path,
    summary_output: Path | None,
    logger: IngestionEventLogger,
) -> IngestionSummary:
    failure_started_ns = monotonic_ns()
    try:
        return _run_wdf_sales_ingestion_unchecked(
            source=source,
            raw_store=raw_store,
            summary_output=summary_output,
            logger=logger,
        )
    except Exception as error:
        logger.emit(
            IngestionEvent(
                event="ingestion.failed",
                run_id="unavailable",
                source_sha256="unavailable",
                parser_version=PARSER_VERSION,
                rule_version=RULE_VERSION,
                duration_ms=(monotonic_ns() - failure_started_ns) // 1_000_000,
                error_code=type(error).__name__,
            )
        )
        raise


def _run_wdf_sales_ingestion_unchecked(
    *,
    source: Path,
    raw_store: Path,
    summary_output: Path | None,
    logger: IngestionEventLogger,
) -> IngestionSummary:
    started_ns = monotonic_ns()
    retained = ContentAddressedLocalSourceStore(raw_store).retain(source, source_system="wdf_pos")
    run_id = sha256(
        f"{retained.fingerprint.sha256}:{PARSER_VERSION}:{RULE_VERSION}".encode()
    ).hexdigest()
    logger.emit(
        IngestionEvent(
            event="ingestion.started",
            run_id=run_id,
            source_sha256=retained.fingerprint.sha256,
            parser_version=PARSER_VERSION,
            rule_version=RULE_VERSION,
        )
    )
    logger.emit(
        IngestionEvent(
            event="source.retained",
            run_id=run_id,
            source_sha256=retained.fingerprint.sha256,
            parser_version=PARSER_VERSION,
            rule_version=RULE_VERSION,
            retained_copy_created=retained.created,
        )
    )

    outcomes = list(
        parse_wdf_sales_workbook(retained.path, source_sha256=retained.fingerprint.sha256)
    )
    accepted = [outcome for outcome in outcomes if outcome.status is OutcomeStatus.ACCEPTED]
    quarantined = [outcome for outcome in outcomes if outcome.status is OutcomeStatus.QUARANTINED]
    logger.emit(
        IngestionEvent(
            event="parse.completed",
            run_id=run_id,
            source_sha256=retained.fingerprint.sha256,
            parser_version=PARSER_VERSION,
            rule_version=RULE_VERSION,
            input_rows=len(outcomes),
        )
    )

    reason_counts = Counter(reason for row in outcomes for reason in row.reason_codes)
    warning_counts = Counter(warning for row in outcomes for warning in row.warning_codes)
    negative_subtotal_rows = sum(
        1
        for outcome in accepted
        if outcome.parsed is not None and outcome.parsed.line_item_subtotal < 0
    )
    zero_subtotal_rows = sum(
        1
        for outcome in accepted
        if outcome.parsed is not None and outcome.parsed.line_item_subtotal == 0
    )
    logger.emit(
        IngestionEvent(
            event="validation.completed",
            run_id=run_id,
            source_sha256=retained.fingerprint.sha256,
            parser_version=PARSER_VERSION,
            rule_version=RULE_VERSION,
            input_rows=len(outcomes),
            accepted_rows=len(accepted),
            quarantined_rows=len(quarantined),
            reason_counts=reason_counts,
            warning_counts=warning_counts,
        )
    )

    summary = IngestionSummary(
        run_id=run_id,
        source_sha256=retained.fingerprint.sha256,
        source_size_bytes=retained.fingerprint.size_bytes,
        storage_key=retained.storage_key,
        retained_copy_created=retained.created,
        parser_version=PARSER_VERSION,
        rule_version=RULE_VERSION,
        input_rows=len(outcomes),
        accepted_rows=len(accepted),
        quarantined_rows=len(quarantined),
        reason_counts=dict(reason_counts),
        warning_counts=dict(warning_counts),
        negative_subtotal_rows=negative_subtotal_rows,
        zero_subtotal_rows=zero_subtotal_rows,
    )
    summary.assert_complete_accounting()
    if summary_output is not None:
        _write_summary_once_or_verify(summary_output, summary)

    duration_ms = (monotonic_ns() - started_ns) // 1_000_000
    logger.emit(
        IngestionEvent(
            event="ingestion.completed",
            run_id=run_id,
            source_sha256=retained.fingerprint.sha256,
            parser_version=PARSER_VERSION,
            rule_version=RULE_VERSION,
            input_rows=summary.input_rows,
            accepted_rows=summary.accepted_rows,
            quarantined_rows=summary.quarantined_rows,
            reason_counts=summary.reason_counts,
            warning_counts=summary.warning_counts,
            duration_ms=duration_ms,
        )
    )
    return summary


def _write_summary_once_or_verify(path: Path, summary: IngestionSummary) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(summary.as_safe_dict(), indent=2, sort_keys=True) + "\n"
    try:
        with path.open("x", encoding="utf-8", newline="\n") as stream:
            stream.write(payload)
    except FileExistsError:
        existing = json.loads(path.read_text(encoding="utf-8"))
        comparable = summary.as_safe_dict()
        existing.pop("retained_copy_created", None)
        comparable.pop("retained_copy_created", None)
        if existing != comparable:
            raise RuntimeError(
                "Existing run summary does not match this deterministic run"
            ) from None
