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

export default router;
