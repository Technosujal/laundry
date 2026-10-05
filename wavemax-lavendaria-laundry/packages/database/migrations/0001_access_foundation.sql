BEGIN;

CREATE TYPE application_role AS ENUM ('OWNER', 'MANAGER');

CREATE TABLE stores (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  timezone text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE application_users (
  id uuid PRIMARY KEY,
  store_id uuid NOT NULL REFERENCES stores(id),
  external_auth_subject text NOT NULL UNIQUE,
  role application_role NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE employees (
  id uuid PRIMARY KEY,
  store_id uuid NOT NULL REFERENCES stores(id),
  source_system text,
  source_employee_id text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, source_system, source_employee_id)
);

CREATE TABLE manager_assignments (
  id uuid PRIMARY KEY,
  store_id uuid NOT NULL REFERENCES stores(id),
  employee_id uuid NOT NULL REFERENCES employees(id),
  manager_user_id uuid NOT NULL REFERENCES application_users(id),
  effective_from timestamptz NOT NULL,
  effective_until timestamptz,
  created_by_user_id uuid NOT NULL REFERENCES application_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (effective_until IS NULL OR effective_until > effective_from)
);

CREATE UNIQUE INDEX manager_assignments_one_open_assignment
  ON manager_assignments (employee_id)
  WHERE effective_until IS NULL;

CREATE INDEX manager_assignments_scope_lookup
  ON manager_assignments (store_id, manager_user_id, effective_from, effective_until);

COMMIT;
