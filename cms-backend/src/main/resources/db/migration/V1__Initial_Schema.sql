-- ============================================================
--  V1__Initial_Schema.sql
--  Single combined migration — reflects all Java entities exactly
-- ============================================================

-- ── 1. TENANTS ──────────────────────────────────────────────
--  Entity: Tenant.java
--  Fields: id (String PK), name, isActive → is_active
CREATE TABLE tenants (
                         id        VARCHAR(50)  PRIMARY KEY,
                         name      VARCHAR(100) NOT NULL,
                         is_active BOOLEAN      NOT NULL DEFAULT TRUE
);

-- ── 2. USERS ────────────────────────────────────────────────
--  Entity: User.java
--  Fields: id (Auth0 string PK), email, role, tenantId → tenant_id
CREATE TABLE users (
                       id         VARCHAR(255) PRIMARY KEY,
                       email      VARCHAR(255),
                       role       VARCHAR(50),
                       tenant_id  VARCHAR(50)  REFERENCES tenants(id),
                       created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── 3. PURPOSES ─────────────────────────────────────────────
--  Entity: Purpose.java
--  Fields: id (BIGSERIAL), tenantId, name, description,
--          isActive, mandatory → is_mandatory, retentionPeriodMonths → retention_period_months
CREATE TABLE purposes (
                          id                      BIGSERIAL    PRIMARY KEY,
                          tenant_id               VARCHAR(50)  REFERENCES tenants(id),
                          name                    VARCHAR(100) NOT NULL,
                          description             TEXT,
                          is_active               BOOLEAN      NOT NULL DEFAULT TRUE,
                          is_mandatory            BOOLEAN      NOT NULL DEFAULT FALSE,
                          retention_period_months INTEGER               DEFAULT 6
);

-- ── 4. CONSENT_ARTIFACTS ────────────────────────────────────
--  Entity: ConsentArtifact.java
--  Fields: id (UUID), userId, tenantId, purpose (FK → purposes),
--          status (Enum: ACTIVE/WITHDRAWN/EXPIRED/REVOKED_BY_SYSTEM),
--          grantedAt, expiresAt
--  NOTE: VARCHAR(30) — "REVOKED_BY_SYSTEM" is 17 chars; old VARCHAR(20) was too small
CREATE TABLE consent_artifacts (
                                   id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
                                   user_id    VARCHAR(255) REFERENCES users(id),
                                   tenant_id  VARCHAR(50)  REFERENCES tenants(id),
                                   purpose_id BIGINT       REFERENCES purposes(id),
                                   status     VARCHAR(30)  NOT NULL,
                                   granted_at TIMESTAMP    NOT NULL,
                                   expires_at TIMESTAMP
);

-- Index for fast expiry lookups (used by scheduled jobs / queries)
CREATE INDEX idx_consent_status_expires ON consent_artifacts(status, expires_at);

-- ── 5. AUDIT_LOGS ───────────────────────────────────────────
--  Entity: AuditLog.java
--  Fields: id (UUID), userId, tenantId,
--          actionType (Enum: GRANT/WITHDRAW/UPDATE/VALIDATE/EXPIRED),
--          timestamp, sourceIp, cryptographicHash,
--          purposeId, consentStatus, expiryDate   ← 3 dashboard columns added
CREATE TABLE audit_logs (
                            id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
                            user_id            VARCHAR(255) NOT NULL,
                            tenant_id          VARCHAR(50),
                            action_type        VARCHAR(20)  NOT NULL,
                            timestamp          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            source_ip          VARCHAR(45),
                            cryptographic_hash VARCHAR(256) NOT NULL,
                            purpose_id         BIGINT       REFERENCES purposes(id),
                            consent_status     VARCHAR(30),
                            expiry_date        TIMESTAMP
);

-- ── 6. NOTIFICATION_LOGS ────────────────────────────────────
--  Entity: NotificationLog.java
--  Fields: id (UUID), messageId (unique), recipient,
--          status (Enum: PENDING/SENT/FAILED), timestamp, errorLog (TEXT)
CREATE TABLE notification_logs (
                                   id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
                                   message_id VARCHAR(255) UNIQUE,
                                   recipient  VARCHAR(255),
                                   status     VARCHAR(50),
                                   timestamp  TIMESTAMP,
                                   error_log  TEXT
);

-- ── 7. FIDUCIARY_WORKERS ────────────────────────────────────
--  Entity: FiduciaryWorker.java
--  Fields: id (UUID), tenantId, email, addedAt → added_at
CREATE TABLE fiduciary_workers (
                                   id        UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
                                   tenant_id VARCHAR(255) NOT NULL,
                                   email     VARCHAR(255) NOT NULL,
                                   added_at  TIMESTAMP
);

-- ── 8. COMPLAINT ────────────────────────────────────────────
--  Entity: Complaint.java  (no @Table → defaults to "complaint")
--  Fields: id (UUID as String), tenantId, userId, subject,
--          description (length=2000), status, createdAt
--  NOTE: VARCHAR(2000) matches @Column(length=2000) on the entity
CREATE TABLE complaint (
                           id          VARCHAR(255) PRIMARY KEY,
                           tenant_id   VARCHAR(255),
                           user_id     VARCHAR(255),
                           subject     VARCHAR(255),
                           description VARCHAR(2000),
                           status      VARCHAR(50),
                           created_at  TIMESTAMP
);

-- ── 9. PENDING_ROLE_ASSIGNMENTS ─────────────────────────────
--  Entity: PendingRoleAssignment.java
--  Fields: id (BIGSERIAL), email (unique, not null), role (not null),
--          tenantId → tenant_id, assignedAt → assigned_at (not null)
--  Purpose: pre-assign a role to an email before the user registers.
--           On first login (/users/sync) the role is applied and this row deleted.
CREATE TABLE pending_role_assignments (
                                          id          BIGSERIAL    PRIMARY KEY,
                                          email       VARCHAR(255) NOT NULL UNIQUE,
                                          role        VARCHAR(50)  NOT NULL,
                                          tenant_id   VARCHAR(255),
                                          assigned_at TIMESTAMP    NOT NULL DEFAULT NOW()
);