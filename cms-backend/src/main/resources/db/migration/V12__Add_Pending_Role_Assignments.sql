-- V12: Pending role assignments
-- When Admin assigns a role to an email that hasn't signed up yet,
-- we store it here. On first login (/users/sync), we check this table
-- and apply the role automatically.

CREATE TABLE IF NOT EXISTS pending_role_assignments (
                                                        id          BIGSERIAL PRIMARY KEY,
                                                        email       VARCHAR(255) NOT NULL UNIQUE,
    role        VARCHAR(50)  NOT NULL,
    tenant_id   VARCHAR(255),
    assigned_at TIMESTAMP    NOT NULL DEFAULT NOW()
    );