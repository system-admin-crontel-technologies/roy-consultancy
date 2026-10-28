-- Audit logs are append-only. Reject UPDATE and DELETE at the database level so that
-- ordinary application code (and ordinary DB users) cannot rewrite history.
CREATE OR REPLACE FUNCTION audit_logs_block_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only (% not permitted)', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_logs_no_update
  BEFORE UPDATE ON "audit_logs"
  FOR EACH ROW EXECUTE FUNCTION audit_logs_block_mutation();

CREATE TRIGGER audit_logs_no_delete
  BEFORE DELETE ON "audit_logs"
  FOR EACH ROW EXECUTE FUNCTION audit_logs_block_mutation();

-- Case-insensitive uniqueness on user email (emails are also normalised in the application).
CREATE UNIQUE INDEX "users_email_lower_key" ON "users" (LOWER("email"));
