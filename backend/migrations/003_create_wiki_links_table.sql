-- Migration: Create wiki_links table for Wikipedia and IMDb links
-- This separates external links from the main movies table

CREATE TABLE IF NOT EXISTS wiki_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id INTEGER UNIQUE NOT NULL,
  
  -- Wikipedia
  wikipedia_url TEXT,
  wikipedia_title TEXT,
  wikipedia_image_url TEXT,
  wikipedia_score INTEGER DEFAULT 0,
  wikipedia_verified BOOLEAN DEFAULT 0,
  
  -- IMDb
  imdb_url TEXT,
  imdb_id TEXT,
  imdb_title TEXT,
  imdb_image_url TEXT,
  imdb_score INTEGER DEFAULT 0,
  imdb_verified BOOLEAN DEFAULT 0,
  
  -- Recommendation
  recommended_source TEXT,  -- 'wikipedia', 'imdb', or 'both'
  recommendation_reason TEXT,
  
  -- Metadata
  image_matches BOOLEAN DEFAULT 0,
  last_checked DATETIME,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (entry_id) REFERENCES movies(id) ON DELETE CASCADE
);

CREATE INDEX idx_wiki_entry_id ON wiki_links(entry_id);
CREATE INDEX idx_wiki_verified ON wiki_links(wikipedia_verified, imdb_verified);
