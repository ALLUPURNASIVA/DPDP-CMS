ALTER TABLE purposes ADD COLUMN is_active BOOLEAN DEFAULT TRUE;

-- Ensure any existing purposes (like Core Service or Marketing) are set to true
UPDATE purposes SET is_active = TRUE WHERE is_active IS NULL;