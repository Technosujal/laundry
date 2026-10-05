from __future__ import annotations

import json
from collections.abc import Mapping
from dataclasses import dataclass
from typing import TextIO


@dataclass(frozen=True, slots=True)
class IngestionEvent:
    event: str
    run_id: str
    source_sha256: str
    parser_version: str
    rule_version: str
    input_rows: int | None = None
    accepted_rows: int | None = None
    quarantined_rows: int | None = None
    retained_copy_created: bool | None = None
    duration_ms: int | None = None
    error_code: str | None = None
    reason_counts: Mapping[str, int] | None = None
    warning_counts: Mapping[str, int] | None = None


class IngestionEventLogger:
    """Writes only a fixed set of non-record event fields."""

    def __init__(self, stream: TextIO) -> None:
        self._stream = stream

    def emit(self, event: IngestionEvent) -> None:
        payload: dict[str, str | int | bool | dict[str, int]] = {
            "event": event.event,
            "run_id": event.run_id,
            "source_system": "WDF_POS",
            "source_sha256": event.source_sha256,
            "parser_version": event.parser_version,
            "rule_version": event.rule_version,
        }
        optional: dict[str, str | int | bool | Mapping[str, int] | None] = {
            "input_rows": event.input_rows,
            "accepted_rows": event.accepted_rows,
            "quarantined_rows": event.quarantined_rows,
            "retained_copy_created": event.retained_copy_created,
            "duration_ms": event.duration_ms,
            "error_code": event.error_code,
            "reason_counts": event.reason_counts,
            "warning_counts": event.warning_counts,
        }
        for key, value in optional.items():
            if value is None:
                continue
            payload[key] = dict(sorted(value.items())) if isinstance(value, Mapping) else value
        self._stream.write(json.dumps(payload, sort_keys=True, separators=(",", ":")) + "\n")
        self._stream.flush()
