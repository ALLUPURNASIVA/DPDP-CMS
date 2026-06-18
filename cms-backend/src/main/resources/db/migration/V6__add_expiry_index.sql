-- This index allows PostgreSQL to instantly find active records that are past their expiration date,
-- reducing the database lock time from seconds to milliseconds.
CREATE INDEX idx_consent_status_expires ON consent_artifacts(status, expires_at);