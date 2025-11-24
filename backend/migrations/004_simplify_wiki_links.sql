-- Migration: Simplify wiki_links table to store only ONE link per entry
-- Either Wikipedia (preferred) OR IMDb (fallback)

DROP TABLE IF EXISTS wiki_links;

CREATE TABLE wiki_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id INTEGER UNIQUE NOT NULL,
  
  -- Single source - either Wikipedia or IMDb
  source_type TEXT NOT NULL,  -- 'wikipedia' or 'imdb'
  url TEXT NOT NULL,
  title TEXT,
  image_url TEXT,
  confidence REAL DEFAULT 0,
  
  -- Additional metadata (only for IMDb)
  imdb_id TEXT,  -- Only populated if source_type = 'imdb'
  
  -- Verification
  verified BOOLEAN DEFAULT 0,
  
  -- Metadata
  last_checked DATETIME,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (entry_id) REFERENCES movies(id) ON DELETE CASCADE
);

CREATE INDEX idx_wiki_entry_id ON wiki_links(entry_id);
CREATE INDEX idx_wiki_source_type ON wiki_links(source_type);
CREATE INDEX idx_wiki_verified ON wiki_links(verified);
