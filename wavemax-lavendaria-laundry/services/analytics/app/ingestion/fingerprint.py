from __future__ import annotations

from dataclasses import dataclass
from hashlib import sha256
from pathlib import Path


@dataclass(frozen=True, slots=True)
class FileFingerprint:
    sha256: str
    size_bytes: int


def fingerprint_file(path: Path, *, chunk_size: int = 1024 * 1024) -> FileFingerprint:
    if chunk_size < 1:
        raise ValueError("chunk_size must be positive")
    if not path.is_file():
        raise FileNotFoundError(f"Source is not a file: {path}")

    digest = sha256()
    size_bytes = 0
    with path.open("rb") as source:
        while chunk := source.read(chunk_size):
            digest.update(chunk)
            size_bytes += len(chunk)
    return FileFingerprint(sha256=digest.hexdigest(), size_bytes=size_bytes)
