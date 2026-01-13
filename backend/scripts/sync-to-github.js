#!/usr/bin/env node
// Script to sync data TO GitHub from local database
import "dotenv/config";
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

if (!GITHUB_TOKEN) {
  console.error("Error: GITHUB_TOKEN environment variable is required");
  console.error("Create a token at: https://github.com/settings/tokens");
  console.error("Required scope: repo (or public_repo for public repos)");
  process.exit(1);
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const db = new Database(DB_PATH, (err) => {
      if (err) reject(err);
      else resolve(db);
    });
  });
}

function getAll(db, query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function exportData(db) {
  const movies = await getAll(db, "SELECT * FROM movies ORDER BY id");
  const users = await getAll(db, "SELECT id, email, created_at FROM users ORDER BY id");
  const movieDetails = await getAll(db, "SELECT * FROM movie_details ORDER BY id");

  return {
    exportedAt: new Date().toISOString(),
    movies,
    users,
    movieDetails,
  };
}

async function pushToGitHub(data) {
  console.log("Pushing to GitHub...");

  const content = Buffer.from(JSON.stringify(data, null, 2)).toString("base64");

  // Get current file SHA (needed for update)
  let sha = null;
  try {
    const getResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${SYNC_FILE}`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );
    if (getResponse.ok) {
      const fileData = await getResponse.json();
      sha = fileData.sha;
    }
  } catch (e) {
    // File doesn't exist yet
  }

  // Create or update file
  const response = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${SYNC_FILE}`,
    {
      method: "PUT",
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Sync database from local: ${new Date().toISOString()}`,
        content,
        branch: "main",
        ...(sha && { sha }),
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} - ${await response.text()}`);
  }

  return await response.json();
}

async function main() {
  try {
    console.log("=== Sync to GitHub ===");
    console.log(`Database: ${DB_PATH}`);
    console.log(`GitHub Repo: ${GITHUB_REPO}`);
    console.log("");

    // Open database
    const db = await openDatabase();
    console.log("✓ Connected to local database");

    // Export data
    const data = await exportData(db);
    console.log(`✓ Exported data:`);
    console.log(`  Movies: ${data.movies?.length || 0}`);
    console.log(`  Users: ${data.users?.length || 0}`);
    console.log("");

    // Push to GitHub
    await pushToGitHub(data);
    console.log("✓ Pushed to GitHub");

    // Close database
    db.close();
    console.log("\n=== Sync Complete ===");
  } catch (error) {
    console.error("Sync failed:", error.message);
    process.exit(1);
  }
}

main();
