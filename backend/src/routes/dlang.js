import express from "express";
import db from "../config/database.js";
import imdbService from "../services/imdb.js";
import omdbService from "../services/omdb.js";

const router = express.Router();

// Get all dlang movies for user
router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;
    const movies = await db.all(
      "SELECT * FROM dlang_movies WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
    res.json(movies);
  } catch (error) {
    console.error("Error fetching dlang movies:", error);
    res.status(500).json({ error: "Failed to fetch dlang movies" });
  }
});

// Get single dlang movie
router.get("/:id", async (req, res) => {
  try {
    const userId = req.user.id;
    const movie = await db.get(
      "SELECT * FROM dlang_movies WHERE id = ? AND user_id = ?",
      [req.params.id, userId]
    );
    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }
    res.json(movie);
  } catch (error) {
    console.error("Error fetching dlang movie:", error);
    res.status(500).json({ error: "Failed to fetch dlang movie" });
  }
});

// Create dlang movie
router.post("/", async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      title,
      year,
      language,
      genre,
      director,
      rating,
      poster_url,
      notes,
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const result = await db.run(
      `INSERT INTO dlang_movies (user_id, title, year, language, genre, director, rating, poster_url, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, title, year, language, genre, director, rating, poster_url, notes]
    );

    const newMovie = await db.get(
      "SELECT * FROM dlang_movies WHERE id = ? AND user_id = ?",
      [result.id, userId]
    );

    res.status(201).json(newMovie);
  } catch (error) {
    console.error("Error creating dlang movie:", error);
    res.status(500).json({ error: "Failed to create dlang movie" });
  }
});

// Update dlang movie
router.put("/:id", async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      title,
      year,
      language,
      genre,
      director,
      rating,
      poster_url,
      notes,
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    await db.run(
      `UPDATE dlang_movies
       SET title = ?, year = ?, language = ?, genre = ?, director = ?, rating = ?, poster_url = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [
        title,
        year,
        language,
        genre,
        director,
        rating,
        poster_url,
        notes,
        req.params.id,
        userId,
      ]
    );

    const updatedMovie = await db.get(
      "SELECT * FROM dlang_movies WHERE id = ? AND user_id = ?",
      [req.params.id, userId]
    );

    if (!updatedMovie) {
      return res.status(404).json({ error: "Movie not found" });
    }

    res.json(updatedMovie);
  } catch (error) {
    console.error("Error updating dlang movie:", error);
    res.status(500).json({ error: "Failed to update dlang movie" });
  }
});

// Delete dlang movie
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.run(
      "DELETE FROM dlang_movies WHERE id = ? AND user_id = ?",
      [req.params.id, userId]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "Movie not found" });
    }

    res.json({ success: true, message: "Movie deleted" });
  } catch (error) {
    console.error("Error deleting dlang movie:", error);
    res.status(500).json({ error: "Failed to delete dlang movie" });
  }
});

// Add movie by IMDB ID
router.post("/add-by-imdb", async (req, res) => {
  try {
    const userId = req.user.id;
    const { imdbId } = req.body;

    if (!imdbId) {
      return res.status(400).json({ error: "IMDB ID is required" });
    }

    let details;
    try {
      details = await imdbService.getDetails(imdbId);
    } catch (imdbError) {
      console.warn(
        "Primary IMDB lookup failed in dlang add-by-imdb, falling back to OMDb:",
        imdbError.message
      );
      details = await omdbService.getDetails(imdbId);
    }

    if (!details || !details.title || details.title === "Unknown") {
      return res.status(404).json({ error: "Movie not found on IMDB" });
    }

    // Extract director name (from scraped data if available)
    const director =
      details.director ||
      details.directors?.[0]?.name ||
      details.directors?.[0] ||
      "";

    // Extract first genre
    const genre =
      details.genres?.[0]?.name ||
      details.genres?.[0] ||
      details.type ||
      "";

    // Extract language
    const language =
      details.languages?.[0]?.name ||
      details.languages?.[0] ||
      details.language ||
      "English";

    const result = await db.run(
      `INSERT INTO dlang_movies (user_id, title, year, language, genre, director, rating, poster_url, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        details.title,
        details.year,
        language,
        genre,
        director,
        details.rating,
        details.poster || details.poster_url,
        `IMDB: ${imdbId} | ${details.plot || ""}`,
      ]
    );

    const newMovie = await db.get(
      "SELECT * FROM dlang_movies WHERE id = ? AND user_id = ?",
      [result.id, userId]
    );

    res.status(201).json(newMovie);
  } catch (error) {
    console.error("Error adding movie by IMDB:", error);
    res.status(500).json({ error: "Failed to add movie: " + error.message });
  }
});

export default router;
