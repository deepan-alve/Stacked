-- Migration: Create movie_content table for scraped Wikipedia/IMDb data
-- Uses JSON for flexible, non-consistent data storage

DROP TABLE IF EXISTS movie_content;

CREATE TABLE movie_content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id INTEGER UNIQUE NOT NULL,
  
  -- Source information
  source_type TEXT NOT NULL,  -- 'wikipedia' or 'imdb'
  source_url TEXT NOT NULL,
  
  -- Scraped content (JSON for flexibility)
  content JSON NOT NULL,
  
  -- Full text for search/AI
  full_text TEXT,
  
  -- Status tracking
  scrape_status TEXT DEFAULT 'pending',  -- 'pending', 'success', 'failed'
  scrape_error TEXT,
  scraped_at DATETIME,
  
  -- Timestamps
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (entry_id) REFERENCES movies(id) ON DELETE CASCADE
);

CREATE INDEX idx_content_entry_id ON movie_content(entry_id);
CREATE INDEX idx_content_status ON movie_content(scrape_status);
CREATE INDEX idx_content_source ON movie_content(source_type);
