-- Add missing columns to media_items table for proper analytics support

-- Add episodes column for TV shows, anime, podcasts
ALTER TABLE media_items ADD COLUMN IF NOT EXISTS episodes INTEGER;

-- Add duration column (in minutes) for movies, episodes, podcasts
ALTER TABLE media_items ADD COLUMN IF NOT EXISTS duration INTEGER;

-- Add pages column for books
ALTER TABLE media_items ADD COLUMN IF NOT EXISTS pages INTEGER;

-- Add genres as an array of text for all media types
ALTER TABLE media_items ADD COLUMN IF NOT EXISTS genres TEXT[];

-- Optional: Add some indexes for better performance
CREATE INDEX IF NOT EXISTS idx_media_items_type ON media_items(type);
CREATE INDEX IF NOT EXISTS idx_media_items_genres ON media_items USING gin(genres);

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'media_items' 
ORDER BY ordinal_position;
