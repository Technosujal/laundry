BEGIN;

ALTER TYPE application_role ADD VALUE IF NOT EXISTS 'EMPLOYEE';

ALTER TABLE application_users
  ADD CONSTRAINT application_users_id_store_unique UNIQUE (id, store_id);

ALTER TABLE employees
  ADD COLUMN application_user_id uuid;

ALTER TABLE employees
  ADD CONSTRAINT employees_user_store_fk
  FOREIGN KEY (application_user_id, store_id)
  REFERENCES application_users (id, store_id);

CREATE UNIQUE INDEX employees_one_user_link
  ON employees (application_user_id)
  WHERE application_user_id IS NOT NULL;

COMMIT;
