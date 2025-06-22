-- Migration: Add AniList integration and power user features
-- File: supabase/migrations/002_anilist_integration.sql

-- Add AniList connection fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS anilist_user_id INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS anilist_username TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS anilist_avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS anilist_access_token TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS anilist_connected_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS power_user_features_enabled BOOLEAN DEFAULT FALSE;

-- Enhanced media_items table with AniList data
ALTER TABLE media_items ADD COLUMN IF NOT EXISTS anilist_id INTEGER UNIQUE;
ALTER TABLE media_items ADD COLUMN IF NOT EXISTS title_romaji TEXT;
ALTER TABLE media_items ADD COLUMN IF NOT EXISTS title_english TEXT;
ALTER TABLE media_items ADD COLUMN IF NOT EXISTS title_native TEXT;
ALTER TABLE media_items ADD COLUMN IF NOT EXISTS banner_image_url TEXT;
ALTER TABLE media_items ADD COLUMN IF NOT EXISTS episodes INTEGER;
ALTER TABLE media_items ADD COLUMN IF NOT EXISTS duration INTEGER; -- minutes per episode
ALTER TABLE media_items ADD COLUMN IF NOT EXISTS genres TEXT[];
ALTER TABLE media_items ADD COLUMN IF NOT EXISTS studios TEXT[];
ALTER TABLE media_items ADD COLUMN IF NOT EXISTS average_score INTEGER;
ALTER TABLE media_items ADD COLUMN IF NOT EXISTS popularity INTEGER;
ALTER TABLE media_items ADD COLUMN IF NOT EXISTS trending INTEGER;
ALTER TABLE media_items ADD COLUMN IF NOT EXISTS season TEXT;
ALTER TABLE media_items ADD COLUMN IF NOT EXISTS season_year INTEGER;
ALTER TABLE media_items ADD COLUMN IF NOT EXISTS format TEXT; -- TV, MOVIE, OVA, etc.
ALTER TABLE media_items ADD COLUMN IF NOT EXISTS anime_status TEXT; -- FINISHED, RELEASING, etc.

-- Add index for AniList ID lookups
CREATE INDEX IF NOT EXISTS idx_media_items_anilist_id ON media_items(anilist_id);

-- Cache table for AniList user data
CREATE TABLE IF NOT EXISTS anilist_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  data_type TEXT NOT NULL, -- 'anime_list', 'stats', 'profile'
  last_synced TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, data_type)
);

-- Analytics cache for performance
CREATE TABLE IF NOT EXISTS user_analytics_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analytics_type TEXT NOT NULL, -- 'basic', 'power_user'
  data JSONB NOT NULL,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour'),
  UNIQUE(user_id, analytics_type)
);

-- User achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  achievement_description TEXT,
  achievement_icon TEXT,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data JSONB, -- Additional achievement data
  UNIQUE(user_id, achievement_id)
);

-- Power user analytics events (for advanced tracking)
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'anime_completed', 'binge_session', 'genre_explored', etc.
  event_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_anilist_cache_user_id ON anilist_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_anilist_cache_type ON anilist_cache(data_type);
CREATE INDEX IF NOT EXISTS idx_user_analytics_cache_user_id ON user_analytics_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_cache_valid_until ON user_analytics_cache(valid_until);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);

-- Row Level Security policies
ALTER TABLE anilist_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Policies for anilist_cache
CREATE POLICY "Users can view their own AniList cache" ON anilist_cache
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AniList cache" ON anilist_cache
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AniList cache" ON anilist_cache
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AniList cache" ON anilist_cache
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for user_analytics_cache
CREATE POLICY "Users can view their own analytics cache" ON user_analytics_cache
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics cache" ON user_analytics_cache
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analytics cache" ON user_analytics_cache
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies for user_achievements
CREATE POLICY "Users can view their own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for analytics_events
CREATE POLICY "Users can view their own analytics events" ON analytics_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics events" ON analytics_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to clean up expired cache
CREATE OR REPLACE FUNCTION cleanup_expired_analytics_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM user_analytics_cache WHERE valid_until < NOW();
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a scheduled job to clean up cache (if using pg_cron extension)
-- SELECT cron.schedule('cleanup-analytics-cache', '0 * * * *', 'SELECT cleanup_expired_analytics_cache();');
