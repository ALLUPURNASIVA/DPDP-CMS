CREATE TABLE compliance_log (
                                id VARCHAR(255) PRIMARY KEY,
                                tenant_id VARCHAR(255),
                                admin_email VARCHAR(255),
                                action VARCHAR(255),
                                target_identity VARCHAR(255),
                                reason VARCHAR(255),
                                timestamp TIMESTAMP
);