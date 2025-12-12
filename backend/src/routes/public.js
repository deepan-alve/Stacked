import express from "express";
import database from "../config/database.js";

const router = express.Router();

// Get all entries (public, read-only)
router.get("/entries", async (req, res) => {
  try {
    const entries = await database.all(
      `SELECT * FROM movies ORDER BY created_at DESC`
    );
    res.json(entries);
  } catch (error) {
    console.error("Error fetching public entries:", error);
    res.status(500).json({ error: "Failed to fetch entries" });
  }
});

// Get single entry (public, read-only)
router.get("/entries/:id", async (req, res) => {
  try {
    const entry = await database.get("SELECT * FROM movies WHERE id = ?", [
      req.params.id,
    ]);
    if (!entry) {
      return res.status(404).json({ error: "Entry not found" });
    }
    res.json(entry);
  } catch (error) {
    console.error("Error fetching public entry:", error);
    res.status(500).json({ error: "Failed to fetch entry" });
  }
});

// Get statistics (public, read-only)
router.get("/stats", async (req, res) => {
  try {
    const stats = {};

    // Total count
    const totalResult = await database.get(
      "SELECT COUNT(*) as count FROM movies"
    );
    stats.total = totalResult.count;

    // Count by type
    const types = ["Movie", "Series", "Anime", "Book"];
    for (const type of types) {
      const result = await database.get(
        "SELECT COUNT(*) as count FROM movies WHERE type = ?",
        [type]
      );
      stats[type.toLowerCase()] = result.count;
    }

    // Average rating
    const avgRating = await database.get(
      "SELECT AVG(rating) as avg FROM movies WHERE rating IS NOT NULL AND rating != ''"
    );
    stats.averageRating = avgRating.avg
      ? parseFloat(avgRating.avg).toFixed(1)
      : 0;

    res.json(stats);
  } catch (error) {
    console.error("Error fetching public stats:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

// Get all dlang movies (public, read-only)
router.get("/dlang", async (req, res) => {
  try {
    const movies = await database.all(
      "SELECT * FROM dlang_movies ORDER BY created_at DESC"
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
      "SELECT * FROM dlang_movies WHERE id = ?",
      [req.params.id]
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
