-- Migration: Add API metadata fields to movies table
-- Run this to add support for external API data

ALTER TABLE movies ADD COLUMN poster_url TEXT;
ALTER TABLE movies ADD COLUMN api_id TEXT;
ALTER TABLE movies ADD COLUMN api_provider TEXT;
ALTER TABLE movies ADD COLUMN description TEXT;
ALTER TABLE movies ADD COLUMN release_date TEXT;
