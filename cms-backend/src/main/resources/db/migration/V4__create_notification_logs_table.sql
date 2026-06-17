CREATE TABLE notification_logs (
                                   id UUID PRIMARY KEY,
                                   message_id VARCHAR(255) UNIQUE,
                                   recipient VARCHAR(255),
                                   status VARCHAR(50),
                                   timestamp TIMESTAMP,
                                   error_log TEXT
);