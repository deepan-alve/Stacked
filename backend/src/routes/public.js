import express from "express";
import database from "../config/database.js";

const router = express.Router();

// Demo mode always shows deepanalve's data (user_id = 1)
const DEMO_USER_ID = 1;

// Get all entries (public, read-only - shows demo user's data)
router.get("/entries", async (req, res) => {
  try {
    const yearParam = req.query.year ? parseInt(req.query.year) : null;
    const year = yearParam && !isNaN(yearParam) ? yearParam : null;
    let query = "SELECT * FROM movies WHERE user_id = ?";
    const params = [DEMO_USER_ID];

    if (year !== null) {
      query += " AND year = ?";
      params.push(year);
    }

    query += " ORDER BY COALESCE(watch_date, created_at) DESC, created_at DESC";

    const entries = await database.all(query, params);
    res.json(entries);
  } catch (error) {
    console.error("Error fetching public entries:", error);
    res.status(500).json({ error: "Failed to fetch entries" });
  }
});

// Get single entry (public, read-only)
router.get("/entries/:id", async (req, res) => {
  try {
    const entry = await database.get(
      "SELECT * FROM movies WHERE id = ? AND user_id = ?",
      [req.params.id, DEMO_USER_ID]
    );
    if (!entry) {
      return res.status(404).json({ error: "Entry not found" });
    }
    res.json(entry);
  } catch (error) {
    console.error("Error fetching public entry:", error);
    res.status(500).json({ error: "Failed to fetch entry" });
  }
});

// Get available years (public, read-only - shows demo user's years)
router.get("/years", async (req, res) => {
  try {
    const years = await database.all(
      "SELECT DISTINCT year FROM movies WHERE user_id = ? ORDER BY year DESC",
      [DEMO_USER_ID]
    );
    res.json(years.map(row => row.year));
  } catch (error) {
    console.error("Error fetching public years:", error);
    res.status(500).json({ error: "Failed to fetch years" });
  }
});

// Get statistics (public, read-only - shows demo user's stats)
router.get("/stats", async (req, res) => {
  try {
    const yearParam = req.query.year ? parseInt(req.query.year) : null;
    const year = yearParam && !isNaN(yearParam) ? yearParam : null;
    const stats = {};

    // Base params always include user_id
    const baseParams = [DEMO_USER_ID];

    // Total count
    let totalQuery = "SELECT COUNT(*) as count FROM movies WHERE user_id = ?";
    const totalParams = [...baseParams];
    if (year !== null) {
      totalQuery += " AND year = ?";
      totalParams.push(year);
    }
    const totalResult = await database.get(totalQuery, totalParams);
    stats.total = totalResult.count;

    // Count by type
    const types = ["Movie", "Series", "Anime", "Book"];
    for (const type of types) {
      let typeQuery = "SELECT COUNT(*) as count FROM movies WHERE user_id = ? AND type = ?";
      const typeParams = [DEMO_USER_ID, type];
      if (year !== null) {
        typeQuery += " AND year = ?";
        typeParams.push(year);
      }
      const result = await database.get(typeQuery, typeParams);
      stats[type.toLowerCase()] = result.count;
    }

    // Average rating
    let ratingQuery = "SELECT AVG(rating) as avg FROM movies WHERE user_id = ? AND rating IS NOT NULL AND rating != ''";
    const ratingParams = [DEMO_USER_ID];
    if (year !== null) {
      ratingQuery += " AND year = ?";
      ratingParams.push(year);
    }
    const avgRating = await database.get(ratingQuery, ratingParams);
    stats.averageRating = avgRating.avg
      ? parseFloat(avgRating.avg).toFixed(1)
      : 0;

    stats.year = year;
    res.json(stats);
  } catch (error) {
    console.error("Error fetching public stats:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

// Get all dlang movies (public, read-only - shows demo user's data)
router.get("/dlang", async (req, res) => {
  try {
    const movies = await database.all(
      "SELECT * FROM dlang_movies WHERE user_id = ? ORDER BY created_at DESC",
      [DEMO_USER_ID]
    );
    res.json(movies);
  } catch (error) {
    console.error("Error fetching public dlang movies:", error);
    res.status(500).json({ error: "Failed to fetch dlang movies" });
  }
});

// Get single dlang movie (public, read-only)
router.get("/dlang/:id", async (req, res) => {
  try {
    const movie = await database.get(
      "SELECT * FROM dlang_movies WHERE id = ? AND user_id = ?",
      [req.params.id, DEMO_USER_ID]
    );
    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }
    res.json(movie);
  } catch (error) {
    console.error("Error fetching public dlang movie:", error);
    res.status(500).json({ error: "Failed to fetch movie" });
  }
});

export default router;
