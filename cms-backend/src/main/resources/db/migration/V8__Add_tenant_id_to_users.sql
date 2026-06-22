-- Link users to specific companies for the Fiduciary Admin module
ALTER TABLE users ADD COLUMN tenant_id VARCHAR(50) REFERENCES tenants(id);

-- Optional Clean-up: Drop the redundant V5 table since 'tenants' handles this perfectly
DROP TABLE IF EXISTS fiduciaries;