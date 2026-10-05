BEGIN;

CREATE TABLE source_files (
  id uuid PRIMARY KEY,
  store_id uuid NOT NULL REFERENCES stores(id),
  source_system text NOT NULL CHECK (source_system IN ('WDF_POS', 'LAUNDRO_PORTAL')),
  source_kind text NOT NULL,
  original_filename text NOT NULL,
  sha256 character(64) NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  size_bytes bigint NOT NULL CHECK (size_bytes >= 0),
  storage_key text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, source_system, sha256),
  UNIQUE (storage_key)
);

CREATE TABLE ingestion_runs (
  id uuid PRIMARY KEY,
  source_file_id uuid NOT NULL REFERENCES source_files(id),
  parser_version text NOT NULL,
  rule_version text NOT NULL,
  status text NOT NULL CHECK (status IN ('RUNNING', 'COMPLETED', 'FAILED')),
  input_rows integer,
  accepted_rows integer,
  quarantined_rows integer,
  started_at timestamptz NOT NULL,
  completed_at timestamptz,
  failure_code text,
  UNIQUE (source_file_id, parser_version, rule_version),
  CHECK (input_rows IS NULL OR input_rows >= 0),
  CHECK (accepted_rows IS NULL OR accepted_rows >= 0),
  CHECK (quarantined_rows IS NULL OR quarantined_rows >= 0),
  CHECK (
    status <> 'COMPLETED'
    OR (
      completed_at IS NOT NULL
      AND input_rows IS NOT NULL
      AND accepted_rows IS NOT NULL
      AND quarantined_rows IS NOT NULL
      AND input_rows = accepted_rows + quarantined_rows
      AND failure_code IS NULL
    )
  ),
  CHECK (status <> 'FAILED' OR failure_code IS NOT NULL)
);

CREATE TABLE raw_wdf_sales_rows (
  id uuid PRIMARY KEY,
  source_file_id uuid NOT NULL REFERENCES source_files(id),
  first_observed_run_id uuid NOT NULL REFERENCES ingestion_runs(id),
  sheet_name text NOT NULL CHECK (sheet_name = 'Sales Breakdown'),
  source_row_number integer NOT NULL CHECK (source_row_number >= 2),
  source_row_identity character(64) NOT NULL CHECK (
    source_row_identity ~ '^[0-9a-f]{64}$'
  ),
  raw_record_hash character(64) NOT NULL CHECK (raw_record_hash ~ '^[0-9a-f]{64}$'),
  raw_record jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_file_id, sheet_name, source_row_number),
  UNIQUE (source_row_identity)
);

CREATE TABLE ingestion_row_outcomes (
  run_id uuid NOT NULL REFERENCES ingestion_runs(id),
  source_row_identity character(64) NOT NULL REFERENCES raw_wdf_sales_rows(source_row_identity),
  outcome text NOT NULL CHECK (outcome IN ('ACCEPTED', 'QUARANTINED')),
  reason_codes text[] NOT NULL DEFAULT '{}',
  warning_codes text[] NOT NULL DEFAULT '{}',
  PRIMARY KEY (run_id, source_row_identity),
  CHECK (outcome <> 'QUARANTINED' OR cardinality(reason_codes) > 0),
  CHECK (outcome <> 'ACCEPTED' OR cardinality(reason_codes) = 0)
);

CREATE TABLE wdf_sales_line_items (
  id uuid PRIMARY KEY,
  source_row_identity character(64) NOT NULL REFERENCES raw_wdf_sales_rows(source_row_identity),
  parser_version text NOT NULL,
  rule_version text NOT NULL,
  paid_date date NOT NULL,
  source_order_number text NOT NULL,
  source_store text NOT NULL,
  category text,
  department text,
  line_item_name text NOT NULL,
  quantity numeric NOT NULL,
  units text,
  line_item_subtotal numeric NOT NULL,
  tax_1 numeric NOT NULL,
  tax_2 numeric NOT NULL,
  tax_3 numeric NOT NULL,
  line_item_note text,
  laundry_service_item boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_row_identity, parser_version, rule_version)
);

COMMIT;
