-- Add missing columns to media_items table for different media types

-- Add columns for books
ALTER TABLE media_items ADD COLUMN pages INTEGER;
ALTER TABLE media_items ADD COLUMN author TEXT;
ALTER TABLE media_items ADD COLUMN isbn TEXT;

-- Add columns for TV/Anime
ALTER TABLE media_items ADD COLUMN episodes INTEGER;
ALTER TABLE media_items ADD COLUMN seasons INTEGER;
ALTER TABLE media_items ADD COLUMN episode_duration INTEGER; -- in minutes

-- Add columns for movies/videos
ALTER TABLE media_items ADD COLUMN duration INTEGER; -- in minutes
ALTER TABLE media_items ADD COLUMN director TEXT;

-- Add columns for games
ALTER TABLE media_items ADD COLUMN platform TEXT;
ALTER TABLE media_items ADD COLUMN developer TEXT;
ALTER TABLE media_items ADD COLUMN publisher TEXT;

-- Add columns for podcasts
ALTER TABLE media_items ADD COLUMN podcast_duration INTEGER; -- in minutes
ALTER TABLE media_items ADD COLUMN host TEXT;

-- Add genres as an array of text
ALTER TABLE media_items ADD COLUMN genres TEXT[];

-- Add rating information
ALTER TABLE media_items ADD COLUMN imdb_rating DECIMAL(3,1);
ALTER TABLE media_items ADD COLUMN tmdb_rating DECIMAL(3,1);
ALTER TABLE media_items ADD COLUMN mal_rating DECIMAL(3,1); -- MyAnimeList rating

-- Add language and country
ALTER TABLE media_items ADD COLUMN language TEXT;
ALTER TABLE media_items ADD COLUMN country TEXT;

-- Add status for ongoing series
ALTER TABLE media_items ADD COLUMN status TEXT; -- 'ongoing', 'completed', 'cancelled', etc.

-- Add indexes for better performance
CREATE INDEX idx_media_items_type ON media_items(type);
CREATE INDEX idx_media_items_release_year ON media_items(release_year);
CREATE INDEX idx_media_items_genres ON media_items USING GIN(genres);
CREATE INDEX idx_media_items_external ON media_items(external_id, external_source);
