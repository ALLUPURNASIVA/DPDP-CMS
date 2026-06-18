-- Adds a dynamic expiration rule to purposes, defaulting to 6 months for existing records
ALTER TABLE purposes ADD COLUMN retention_period_months INTEGER DEFAULT 6;