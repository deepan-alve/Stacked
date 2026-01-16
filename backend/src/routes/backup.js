// Backup Routes - API endpoints for backup management
import express from "express";
import backupService from "../services/backupService.js";
import database from "../config/database.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pkg from "sqlite3";
const { Database: SQLiteDatabase } = pkg.verbose();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Test Supabase connection
router.get("/test", async (req, res) => {
  try {
    const connected = await backupService.testConnection();
    res.json({
      success: connected,
      message: connected
        ? "Supabase connection successful"
        : "Connection failed",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Trigger manual sync
router.post("/sync", async (req, res) => {
  try {
    const result = await backupService.fullSync();
    res.json({
      success: true,
      message: "Sync completed successfully",
      ...result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get sync status
router.get("/status", async (req, res) => {
  try {
    const status = await backupService.getSyncStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Restore from Supabase
router.post("/restore", async (req, res) => {
  try {
    const result = await backupService.restoreFromSupabase();
    res.json({
      success: true,
      message: "Restore completed successfully",
      ...result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Git backup only
router.post("/git", async (req, res) => {
  try {
    const result = backupService.gitBackup();
    res.json({
      success: result.success,
      message: result.message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Start periodic sync
router.post("/start-periodic", async (req, res) => {
  try {
    const { intervalHours = 6 } = req.body;
    backupService.startPeriodicSync(intervalHours);
    res.json({
      success: true,
      message: `Periodic sync started (every ${intervalHours} hours)`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stop periodic sync
router.post("/stop-periodic", async (req, res) => {
  try {
    backupService.stopPeriodicSync();
    res.json({
      success: true,
      message: "Periodic sync stopped",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download user's data as SQLite database
router.get("/download", async (req, res) => {
  const userId = req.user.id;
  const tempDir = "/tmp";
  const fileName = `stacked-export-${userId}-${Date.now()}.db`;
  const filePath = path.join(tempDir, fileName);

  try {
    // Get user's data
    const movies = await database.all(
      "SELECT * FROM movies WHERE user_id = ?",
      [userId]
    );
    const movieDetails = await database.all(
      "SELECT md.* FROM movie_details md INNER JOIN movies m ON md.entry_id = m.id WHERE m.user_id = ?",
      [userId]
    );
    const dlangMovies = await database.all(
      "SELECT * FROM dlang_movies WHERE user_id = ?",
      [userId]
    );
    const user = await database.get(
      "SELECT id, email, created_at FROM users WHERE id = ?",
      [userId]
    );

    // Create new SQLite database with user's data
    await new Promise((resolve, reject) => {
      const exportDb = new SQLiteDatabase(filePath, async (err) => {
        if (err) {
          reject(err);
          return;
        }

        // Create tables
        exportDb.serialize(() => {
          // Users table
          exportDb.run(`
            CREATE TABLE users (
              id INTEGER PRIMARY KEY,
              email TEXT,
              created_at TEXT
            )
          `);

          // Movies table
          exportDb.run(`
            CREATE TABLE movies (
              id INTEGER PRIMARY KEY,
              user_id INTEGER,
              title TEXT,
              type TEXT,
              rating REAL,
              season INTEGER,
              notes TEXT,
              assignee TEXT,
              due_date TEXT,
              poster_url TEXT,
              api_id TEXT,
              api_provider TEXT,
              description TEXT,
              release_date TEXT,
              year INTEGER,
              watch_date TEXT,
              created_at TEXT,
              updated_at TEXT
            )
          `);

          // Movie details table
          exportDb.run(`
            CREATE TABLE movie_details (
              id INTEGER PRIMARY KEY,
              user_id INTEGER,
              entry_id INTEGER,
              wikipedia_url TEXT,
              wikipedia_summary TEXT,
              wikipedia_plot TEXT,
              imdb_url TEXT,
              imdb_rating REAL,
              imdb_plot TEXT,
              created_at TEXT,
              updated_at TEXT
            )
          `);

          // Dlang movies table
          exportDb.run(`
            CREATE TABLE dlang_movies (
              id INTEGER PRIMARY KEY,
              user_id INTEGER,
              title TEXT,
              year INTEGER,
              language TEXT,
              genre TEXT,
              director TEXT,
              rating REAL,
              poster_url TEXT,
              notes TEXT,
              created_at TEXT,
              updated_at TEXT
            )
          `);

          // Insert user
          if (user) {
            exportDb.run(
              "INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)",
              [user.id, user.email, user.created_at]
            );
          }

          // Insert movies
          const movieStmt = exportDb.prepare(`
            INSERT INTO movies VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          for (const m of movies) {
            movieStmt.run([
              m.id, m.user_id, m.title, m.type, m.rating, m.season, m.notes,
              m.assignee, m.due_date, m.poster_url, m.api_id, m.api_provider,
              m.description, m.release_date, m.year, m.watch_date, m.created_at, m.updated_at
            ]);
          }
          movieStmt.finalize();

          // Insert movie details
          const detailStmt = exportDb.prepare(`
            INSERT INTO movie_details VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          for (const d of movieDetails) {
            detailStmt.run([
              d.id, d.user_id, d.entry_id, d.wikipedia_url, d.wikipedia_summary,
              d.wikipedia_plot, d.imdb_url, d.imdb_rating, d.imdb_plot,
              d.created_at, d.updated_at
            ]);
          }
          detailStmt.finalize();

          // Insert dlang movies
          const dlangStmt = exportDb.prepare(`
            INSERT INTO dlang_movies VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          for (const d of dlangMovies) {
            dlangStmt.run([
              d.id, d.user_id, d.title, d.year, d.language, d.genre,
              d.director, d.rating, d.poster_url, d.notes, d.created_at, d.updated_at
            ]);
          }
          dlangStmt.finalize();
        });

        exportDb.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });

    // Send file
    res.download(filePath, `stacked-backup-${user?.email || userId}.db`, (err) => {
      // Clean up temp file
      fs.unlink(filePath, () => {});
      if (err && !res.headersSent) {
        res.status(500).json({ error: "Failed to download file" });
      }
    });

  } catch (error) {
    console.error("Export error:", error);
    // Clean up on error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.status(500).json({ error: error.message });
  }
});

export default router;
