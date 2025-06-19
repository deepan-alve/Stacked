-- Create custom types
CREATE TYPE media_type AS ENUM ('movie', 'tv', 'book', 'anime', 'game', 'podcast');
CREATE TYPE media_status AS ENUM ('completed', 'in_progress', 'planned', 'dropped', 'on_hold');

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Media Items table (stores all media information)
CREATE TABLE media_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  type media_type NOT NULL,
  description TEXT,
  cover_url TEXT,
  release_year INTEGER,
  external_id TEXT, -- ID from external APIs (TMDB, IGDB, etc.)
  external_source TEXT, -- Source API (tmdb, igdb, jikan, etc.)
  metadata JSONB DEFAULT '{}', -- Flexible storage for API-specific data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Create unique constraint for external items
  UNIQUE(external_id, external_source)
);

-- User Media table (tracks user's relationship with media)
CREATE TABLE user_media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  media_id UUID REFERENCES media_items(id) ON DELETE CASCADE NOT NULL,
  status media_status NOT NULL DEFAULT 'planned',
  rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5), -- 0-5 stars with half increments
  review TEXT,
  notes TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Ensure one entry per user per media item
  UNIQUE(user_id, media_id)
);

-- Collections table
CREATE TABLE collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  cover_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Collection Items table (many-to-many between collections and media)
CREATE TABLE collection_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE NOT NULL,
  media_id UUID REFERENCES media_items(id) ON DELETE CASCADE NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Ensure one entry per collection per media item
  UNIQUE(collection_id, media_id)
);

-- Tags table
CREATE TABLE tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  color TEXT DEFAULT '#00C2FF',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- User Media Tags table (many-to-many between user_media and tags)
CREATE TABLE user_media_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_media_id UUID REFERENCES user_media(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  
  -- Ensure one entry per user_media per tag
  UNIQUE(user_media_id, tag_id)
);

-- Create indexes for performance
CREATE INDEX idx_media_items_type ON media_items(type);
CREATE INDEX idx_media_items_external ON media_items(external_id, external_source);
CREATE INDEX idx_user_media_user_id ON user_media(user_id);
CREATE INDEX idx_user_media_status ON user_media(status);
CREATE INDEX idx_user_media_rating ON user_media(rating);
CREATE INDEX idx_collections_user_id ON collections(user_id);
CREATE INDEX idx_collections_public ON collections(is_public) WHERE is_public = true;

-- Enable Real-time subscriptions
ALTER publication supabase_realtime ADD TABLE profiles;
ALTER publication supabase_realtime ADD TABLE user_media;
ALTER publication supabase_realtime ADD TABLE collections;

-- Row Level Security Policies

-- Profiles policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Media Items policies (public read, authenticated write)
ALTER TABLE media_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view media items" ON media_items
  FOR SELECT TO PUBLIC USING (true);

CREATE POLICY "Authenticated users can insert media items" ON media_items
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update media items" ON media_items
  FOR UPDATE TO authenticated USING (true);

-- User Media policies
ALTER TABLE user_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own media" ON user_media
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own media" ON user_media
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own media" ON user_media
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own media" ON user_media
  FOR DELETE USING (auth.uid() = user_id);

-- Collections policies
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own collections" ON collections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public collections" ON collections
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can insert their own collections" ON collections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections" ON collections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections" ON collections
  FOR DELETE USING (auth.uid() = user_id);

-- Collection Items policies
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view items in their collections" ON collection_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM collections 
      WHERE collections.id = collection_items.collection_id 
      AND (collections.user_id = auth.uid() OR collections.is_public = true)
    )
  );

CREATE POLICY "Users can manage items in their collections" ON collection_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM collections 
      WHERE collections.id = collection_items.collection_id 
      AND collections.user_id = auth.uid()
    )
  );

-- Tags policies
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tags" ON tags
  FOR SELECT TO PUBLIC USING (true);

CREATE POLICY "Authenticated users can create tags" ON tags
  FOR INSERT TO authenticated WITH CHECK (true);

-- User Media Tags policies
ALTER TABLE user_media_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own media tags" ON user_media_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_media 
      WHERE user_media.id = user_media_tags.user_media_id 
      AND user_media.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own media tags" ON user_media_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_media 
      WHERE user_media.id = user_media_tags.user_media_id 
      AND user_media.user_id = auth.uid()
    )
  );

-- Functions and Triggers

-- Function to automatically create a profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'display_name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

CREATE TRIGGER media_items_updated_at BEFORE UPDATE ON media_items
  FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

CREATE TRIGGER user_media_updated_at BEFORE UPDATE ON user_media
  FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

CREATE TRIGGER collections_updated_at BEFORE UPDATE ON collections
  FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
