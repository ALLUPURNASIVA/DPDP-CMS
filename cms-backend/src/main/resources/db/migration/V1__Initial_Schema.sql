CREATE TABLE tenants (
                         id VARCHAR(50) PRIMARY KEY,
                         name VARCHAR(100) NOT NULL
);

CREATE TABLE users (
                       id VARCHAR(255) PRIMARY KEY,
                       email VARCHAR(255),
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purposes (
                          id BIGSERIAL PRIMARY KEY,           -- Changed from SERIAL to BIGSERIAL
                          tenant_id VARCHAR(50) REFERENCES tenants(id),
                          name VARCHAR(100) NOT NULL,
                          description TEXT,
                          is_mandatory BOOLEAN DEFAULT FALSE
);

CREATE TABLE consent_artifacts (
                                   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                   user_id VARCHAR(255) REFERENCES users(id),
                                   purpose_id BIGINT REFERENCES purposes(id), -- Changed from INT to BIGINT
                                   tenant_id VARCHAR(50) REFERENCES tenants(id),
                                   status VARCHAR(20) NOT NULL,
                                   granted_at TIMESTAMP NOT NULL,
                                   expires_at TIMESTAMP
);

CREATE TABLE audit_logs (
                            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                            user_id VARCHAR(255) NOT NULL,
                            tenant_id VARCHAR(50),
                            action_type VARCHAR(20) NOT NULL,
                            timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            source_ip VARCHAR(45),
                            cryptographic_hash VARCHAR(256) NOT NULL
);

-- Insert sample multi-tenant data for testing
INSERT INTO tenants (id, name) VALUES ('TENANT_A', 'Alpha Corp'), ('TENANT_B', 'Beta LLC');

INSERT INTO purposes (tenant_id, name, description, is_mandatory) VALUES
                                                                      ('TENANT_A', 'Core Service', 'Essential data required to provide the platform.', TRUE),
                                                                      ('TENANT_A', 'Marketing', 'Receive promotional emails and offers.', FALSE),
                                                                      ('TENANT_A', 'Analytics', 'Allow us to track usage to improve the product.', FALSE);