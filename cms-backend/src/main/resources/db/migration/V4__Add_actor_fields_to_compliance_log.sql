ALTER TABLE compliance_log ADD COLUMN actor_id VARCHAR(255);
ALTER TABLE compliance_log ADD COLUMN actor_role VARCHAR(50);
ALTER TABLE compliance_log ADD COLUMN action_type VARCHAR(50);