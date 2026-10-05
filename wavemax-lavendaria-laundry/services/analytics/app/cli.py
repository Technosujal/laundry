from __future__ import annotations

import argparse
import sys
from collections.abc import Sequence
from pathlib import Path

from app.ingestion.run_wdf_sales import run_wdf_sales_ingestion
from app.metrics.build_artifact import build_artifact, write_artifact
from app.observability.events import IngestionEventLogger


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="wavemax-analytics")
    commands = parser.add_subparsers(dest="command", required=True)
    audit = commands.add_parser(
        "audit-wdf-sales", help="Retain and audit the approved WDF annual sales workbook"
    )
    audit.add_argument("--source", type=Path, required=True)
    audit.add_argument("--raw-store", type=Path, required=True)
    audit.add_argument("--summary-output", type=Path, required=True)

    artifact = commands.add_parser(
        "build-analytics-artifact",
        help="Build the deterministic analytics artifact served by the API",
    )
    artifact.add_argument("--laundro-dir", type=Path, required=True)
    artifact.add_argument("--wdf-dir", type=Path, required=True)
    artifact.add_argument("--output", type=Path, required=True)
    return parser


def main(arguments: Sequence[str] | None = None) -> int:
    args = build_parser().parse_args(arguments)
    if args.command == "audit-wdf-sales":
        logger = IngestionEventLogger(sys.stdout)
        try:
            summary = run_wdf_sales_ingestion(
                source=args.source,
                raw_store=args.raw_store,
                summary_output=args.summary_output,
                logger=logger,
            )
        except Exception:
            return 1
        summary.assert_complete_accounting()
        return 0
    if args.command == "build-analytics-artifact":
        artifact = build_artifact(laundro_dir=args.laundro_dir, wdf_dir=args.wdf_dir)
        digest = write_artifact(artifact, args.output)
        print(
            f"artifact written run_id={artifact['run_id'][:16]} "
            f"payload_sha256={digest[:16]} metrics={len(artifact['metrics'])}"
        )
        return 0
    raise AssertionError("Unreachable command")


if __name__ == "__main__":
    raise SystemExit(main())
