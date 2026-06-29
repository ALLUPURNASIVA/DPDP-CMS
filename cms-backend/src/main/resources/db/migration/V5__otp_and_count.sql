ALTER TABLE tenants ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;
UPDATE tenants SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
ALTER TABLE tenants ALTER COLUMN created_at SET NOT NULL;

CREATE TABLE IF NOT EXISTS general_user_otps (
                                                 id UUID PRIMARY KEY,
                                                 user_id VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    otp_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    verified_at TIMESTAMP NULL,
    used BOOLEAN NOT NULL
    );

CREATE INDEX IF NOT EXISTS idx_general_user_otps_user_email
    ON general_user_otps (user_id, email);