from __future__ import annotations

import shutil
from dataclasses import dataclass
from pathlib import Path

from app.ingestion.fingerprint import FileFingerprint, fingerprint_file


class ImmutableSourceError(RuntimeError):
    """Raised when source bytes cannot be retained without mutation or ambiguity."""


@dataclass(frozen=True, slots=True)
class RetainedSource:
    fingerprint: FileFingerprint
    storage_key: str
    path: Path
    created: bool


class ContentAddressedLocalSourceStore:
    """POC-only immutable source store; production object storage is not selected."""

    def __init__(self, root: Path) -> None:
        self._root = root.resolve()

    def retain(self, source: Path, *, source_system: str) -> RetainedSource:
        original = fingerprint_file(source)
        suffix = source.suffix.lower()
        if suffix != ".xlsx":
            raise ImmutableSourceError("Only .xlsx sources are supported by this Phase 2 adapter")
        if not source_system or any(
            character not in "abcdefghijklmnopqrstuvwxyz_" for character in source_system
        ):
            raise ValueError("source_system must contain only lowercase letters and underscores")

        relative = Path(source_system) / original.sha256[:2] / f"{original.sha256}{suffix}"
        target = (self._root / relative).resolve()
        if self._root not in target.parents:
            raise ImmutableSourceError("Resolved storage path escaped the configured root")
        target.parent.mkdir(parents=True, exist_ok=True)

        created = False
        try:
            with source.open("rb") as input_stream, target.open("xb") as output_stream:
                created = True
                shutil.copyfileobj(input_stream, output_stream, length=1024 * 1024)
        except FileExistsError:
            pass
        except Exception:
            if created:
                target.unlink(missing_ok=True)
            raise

        retained = fingerprint_file(target)
        source_after_copy = fingerprint_file(source)
        if retained != original or source_after_copy != original:
            if created:
                target.unlink(missing_ok=True)
            raise ImmutableSourceError(
                "Source or retained bytes changed during immutable retention"
            )

        return RetainedSource(
            fingerprint=original,
            storage_key=relative.as_posix(),
            path=target,
            created=created,
        )
