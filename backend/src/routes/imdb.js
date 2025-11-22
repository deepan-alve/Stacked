import express from "express";
import imdbService from "../services/imdb.js";

const router = express.Router();

/**
 * @route   GET /api/imdb/search
 * @desc    Search IMDB titles
 * @query   q - Search query (required)
 * @query   type - Filter by type (movie, series, etc.)
 * @query   year - Filter by year
 * @query   page - Page number (default: 1)
 */
router.get("/search", async (req, res) => {
  try {
    const { q, type, year, page } = req.query;

    if (!q) {
      return res.status(400).json({ error: "Search query (q) is required" });
    }

    const results = await imdbService.search(q, {
      type,
      year: year ? parseInt(year) : undefined,
      page: page ? parseInt(page) : 1,
    });

    res.json({
      success: true,
      query: q,
      filters: { type, year, page: page || 1 },
      count: results.length,
      results,
    });
  } catch (error) {
    console.error("IMDB Search Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to search IMDB",
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/imdb/title/:imdbId
 * @desc    Get detailed information for an IMDB title
 * @param   imdbId - IMDB ID (e.g., 'tt1234567')
 */
router.get("/title/:imdbId", async (req, res) => {
  try {
    const { imdbId } = req.params;

    if (!imdbId) {
      return res.status(400).json({ error: "IMDB ID is required" });
    }

    const details = await imdbService.getDetails(imdbId);

    res.json({
      success: true,
      data: details,
    });
  } catch (error) {
    console.error("IMDB Details Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get IMDB details",
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/imdb/top-rated
 * @desc    Get top rated movies/shows
 * @query   limit - Number of results (default: 50, max: 250)
 */
router.get("/top-rated", async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const parsedLimit = Math.min(parseInt(limit), 250);

    const results = await imdbService.getTopRated(parsedLimit);

    res.json({
      success: true,
      limit: parsedLimit,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error("IMDB Top Rated Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get top rated",
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/imdb/popular
 * @desc    Get popular movies/shows
 * @query   limit - Number of results (default: 50)
 */
router.get("/popular", async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const parsedLimit = Math.min(parseInt(limit), 250);

    const results = await imdbService.getPopular(parsedLimit);

    res.json({
      success: true,
      limit: parsedLimit,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error("IMDB Popular Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get popular titles",
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/imdb/poster/:imdbId
 * @desc    Get poster URL for a title
 * @param   imdbId - IMDB ID (e.g., 'tt1234567')
 */
router.get("/poster/:imdbId", async (req, res) => {
  try {
    const { imdbId } = req.params;

    if (!imdbId) {
      return res.status(400).json({ error: "IMDB ID is required" });
    }

    const posterUrl = await imdbService.getPosterUrl(imdbId);

    if (!posterUrl) {
      return res.status(404).json({
        success: false,
        error: "Poster not found",
      });
    }

    res.json({
      success: true,
      imdbId,
      posterUrl,
    });
  } catch (error) {
    console.error("IMDB Poster Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get poster",
      message: error.message,
    });
  }
});

/**
 * @route   POST /api/imdb/extract-id
 * @desc    Extract IMDB ID from URL
 * @body    url - IMDB URL
 */
router.post("/extract-id", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    const imdbId = imdbService.extractImdbId(url);

    if (!imdbId) {
      return res.status(400).json({
        success: false,
        error: "Could not extract IMDB ID from URL",
      });
    }

    res.json({
      success: true,
      url,
      imdbId,
    });
  } catch (error) {
    console.error("Extract ID Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to extract IMDB ID",
      message: error.message,
    });
  }
});

export default router;
