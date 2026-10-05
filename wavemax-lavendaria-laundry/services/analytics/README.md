# Wavemax Analytics Service

This package owns deterministic source ingestion, data quality, lineage, metrics, and later approved forecasting. Phase 2 implements only the WDF annual-sales workbook ingestion foundation.

## Verify

From this directory:

```powershell
uv --cache-dir ..\..\.uv-cache sync --all-groups --frozen
uv --cache-dir ..\..\.uv-cache run pytest
uv --cache-dir ..\..\.uv-cache run ruff check --no-cache .
uv --cache-dir ..\..\.uv-cache run ruff format --no-cache --check .
uv --cache-dir ..\..\.uv-cache run mypy app
```

## Audit the supplied WDF workbook

The source remains outside Git. The retained copy and privacy-safe summary are written only to ignored local directories.

```powershell
uv --cache-dir ..\..\.uv-cache run python -m app.cli audit-wdf-sales `
  --source "C:\Users\ankus\OneDrive\laundry platform\Documents\WDF POS\WDF POS 2025 report -2025-01-01 to 2025-12-31.xlsx" `
  --raw-store "..\..\data\raw" `
  --summary-output "..\..\data\ingestion-runs\wdf-2025.json"
```

The command prints only allowlisted operational events. It never prints source rows or field values.
