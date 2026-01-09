-- Add year and watch_date columns for yearly collection tracking
-- This enables automatic yearly archiving of collections

ALTER TABLE movies ADD COLUMN year INTEGER DEFAULT 2025;
ALTER TABLE movies ADD COLUMN watch_date TEXT DEFAULT CURRENT_TIMESTAMP;

-- Set all existing entries to 2025 (the year before feature activation)
UPDATE movies SET year = 2025 WHERE year IS NULL OR year = 2025;
UPDATE movies SET watch_date = created_at WHERE watch_date IS NULL;
