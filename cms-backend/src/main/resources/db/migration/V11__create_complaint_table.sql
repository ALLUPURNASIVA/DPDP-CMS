CREATE TABLE complaint (
    id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255),
    user_id VARCHAR(255),
    subject VARCHAR(255),
    description TEXT,
    status VARCHAR(50),
    created_at TIMESTAMP
);