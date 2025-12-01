-- Migration: Create dlang_movies table for favorite movies
-- The special collection of all-time favorites

CREATE TABLE IF NOT EXISTS dlang_movies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  year INTEGER,
  language TEXT,
  genre TEXT,
  director TEXT,
  rating REAL,
  poster_url TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_dlang_language ON dlang_movies(language);
CREATE INDEX IF NOT EXISTS idx_dlang_genre ON dlang_movies(genre);
CREATE INDEX IF NOT EXISTS idx_dlang_year ON dlang_movies(year);
