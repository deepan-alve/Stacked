#!/usr/bin/env node
// Script to sync data FROM GitHub to local database
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pkg from "sqlite3";

const { Database } = pkg.verbose();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO || "deepan-alve/Stacked-db";
const SYNC_FILE = "data/sync.json";
const DB_PATH = process.env.DB_PATH || path.join(__dirname, "../data/movies.db");

async function fetchFromGitHub() {
  console.log("Fetching sync data from GitHub...");

  const headers = {
    Accept: "application/vnd.github.v3+json",
  };

  if (GITHUB_TOKEN) {
    headers.Authorization = `token ${GITHUB_TOKEN}`;
  }

  const response = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${SYNC_FILE}`,
    { headers }
  );

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} - ${await response.text()}`);
  }

  const fileData = await response.json();
  const content = Buffer.from(fileData.content, "base64").toString("utf-8");
  return JSON.parse(content);
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const db = new Database(DB_PATH, (err) => {
      if (err) reject(err);
      else resolve(db);
    });
  });
}

function runQuery(db, query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function getOne(db, query, params = []) {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function importData(db, data) {
  let imported = 0;
  let updated = 0;

  for (const movie of data.movies || []) {
    const existing = await getOne(db, "SELECT id FROM movies WHERE id = ?", [movie.id]);

    if (existing) {
      await runQuery(db,
        `UPDATE movies SET title=?, type=?, rating=?, season=?, notes=?, assignee=?,
         due_date=?, poster_url=?, api_id=?, api_provider=?, description=?,
         release_date=?, year=?, watch_date=?, updated_at=? WHERE id=?`,
        [movie.title, movie.type, movie.rating, movie.season, movie.notes, movie.assignee,
         movie.due_date, movie.poster_url, movie.api_id, movie.api_provider, movie.description,
         movie.release_date, movie.year, movie.watch_date, movie.updated_at, movie.id]
      );
      updated++;
    } else {
      await runQuery(db,
        `INSERT INTO movies (id, title, type, rating, season, notes, assignee, due_date,
         poster_url, api_id, api_provider, description, release_date, year, watch_date,
         created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [movie.id, movie.title, movie.type, movie.rating, movie.season, movie.notes,
         movie.assignee, movie.due_date, movie.poster_url, movie.api_id, movie.api_provider,
         movie.description, movie.release_date, movie.year, movie.watch_date,
         movie.created_at, movie.updated_at]
      );
      imported++;
    }
  }

  return { imported, updated };
}

async function main() {
  try {
    console.log("=== Sync from GitHub ===");
    console.log(`Database: ${DB_PATH}`);
    console.log(`GitHub Repo: ${GITHUB_REPO}`);
    console.log("");

    // Fetch data from GitHub
    const data = await fetchFromGitHub();
    console.log(`✓ Fetched sync data (exported: ${data.exportedAt})`);
    console.log(`  Movies: ${data.movies?.length || 0}`);
    console.log("");

    // Open database
    const db = await openDatabase();
    console.log("✓ Connected to local database");

    // Import data
    const result = await importData(db, data);
    console.log(`✓ Import complete: ${result.imported} new, ${result.updated} updated`);

    // Close database
    db.close();
    console.log("\n=== Sync Complete ===");
  } catch (error) {
    console.error("Sync failed:", error.message);
    process.exit(1);
  }
}

main();
