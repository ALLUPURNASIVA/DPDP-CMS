CREATE TABLE fiduciary_workers (
                                   id UUID PRIMARY KEY,
                                   tenant_id VARCHAR(255) NOT NULL,
                                   email VARCHAR(255) NOT NULL,
                                   added_at TIMESTAMP
);