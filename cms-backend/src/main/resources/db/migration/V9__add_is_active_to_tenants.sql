-- Adds soft deletion capability to companies for legal compliance
ALTER TABLE tenants ADD COLUMN is_active BOOLEAN DEFAULT TRUE;

-- Ensure existing testing data (like Alpha Corp) is set to active
UPDATE tenants SET is_active = TRUE WHERE is_active IS NULL;