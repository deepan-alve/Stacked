import tmdbService from "../services/tmdb.js";
import anilistService from "../services/anilist.js";
import openlibraryService from "../services/openlibrary.js";
import imdbService from "../services/imdb.js";
import omdbService from "../services/omdb.js";
import imdbScraper from "../services/imdbScraper.js";

const MAX_SPOTLIGHT_RESULTS = 15;

function dedupeSpotlightResults(resultSets) {
  const seen = new Set();
  const merged = [];

  for (const results of resultSets) {
    for (const item of results || []) {
      if (!item?.title) continue;

      const imdbId = item.imdbId || item.id || null;
      const key =
        imdbId ||
        `${item.title.toLowerCase()}::${item.year || ""}::${(
          item.type || ""
        ).toLowerCase()}`;

      if (seen.has(key)) continue;
      seen.add(key);

      merged.push({
        ...item,
        imdbId,
        provider: item.provider || "imdb",
      });

      if (merged.length >= MAX_SPOTLIGHT_RESULTS) {
        return merged;
      }
    }
  }

  return merged;
}

const searchController = {
  // Search for movies
  searchMovies: async (req, res) => {
    try {
      const { query } = req.query;

      if (!query) {
        return res.status(400).json({ error: "Search query is required" });
      }

      const results = await tmdbService.searchMovies(query);
      res.json(results);
    } catch (error) {
      console.error("Search Movies Error:", error);
      res.status(500).json({ error: "Failed to search movies" });
    }
  },

  // Search for TV shows/series
  searchSeries: async (req, res) => {
    try {
      const { query } = req.query;

      if (!query) {
        return res.status(400).json({ error: "Search query is required" });
      }

      const results = await tmdbService.searchTVShows(query);
      res.json(results);
    } catch (error) {
      console.error("Search Series Error:", error);
      res.status(500).json({ error: "Failed to search series" });
    }
  },

  // Search for anime
  searchAnime: async (req, res) => {
    try {
      const { query } = req.query;

      if (!query) {
        return res.status(400).json({ error: "Search query is required" });
      }

      const results = await anilistService.searchAnime(query);
      res.json(results);
    } catch (error) {
      console.error("Search Anime Error:", error);
      res.status(500).json({ error: "Failed to search anime" });
    }
  },

  // Search for books
  searchBooks: async (req, res) => {
    try {
      const { query } = req.query;

      if (!query) {
        return res.status(400).json({ error: "Search query is required" });
      }

      const results = await openlibraryService.searchBooks(query);
      res.json(results);
    } catch (error) {
      console.error("Search Books Error:", error);
      res.status(500).json({ error: "Failed to search books" });
    }
  },

  // Get details for a specific item
  getDetails: async (req, res) => {
    try {
      const { type, id } = req.params;
      let details;

      switch (type.toLowerCase()) {
        case "movie":
          details = await tmdbService.getMovieDetails(id);
          break;
        case "series":
          details = await tmdbService.getTVDetails(id);
          break;
        case "anime":
          details = await anilistService.getAnimeDetails(id);
          break;
        case "book":
          details = await openlibraryService.getBookDetails(id);
          break;
        case "imdb":
          details = await imdbService.getDetails(id);
          break;
        default:
          return res.status(400).json({
            error: "Invalid type. Use: movie, series, anime, book, or imdb",
          });
      }

      res.json(details);
    } catch (error) {
      console.error("Get Details Error:", error);
      res.status(500).json({ error: "Failed to get details" });
    }
  },

  // Search IMDB
  searchIMDB: async (req, res) => {
    try {
      const { query, type, year, page } = req.query;

      if (!query) {
        return res.status(400).json({ error: "Search query is required" });
      }

      const results = await imdbService.search(query, { type, year, page });
      res.json(results);
    } catch (error) {
      console.error("Search IMDB Error:", error);
      res.status(500).json({ error: "Failed to search IMDB" });
    }
  },

  // Get IMDB title by ID
  getIMDBDetails: async (req, res) => {
    try {
      const { imdbId } = req.params;

      if (!imdbId) {
        return res.status(400).json({ error: "IMDB ID is required" });
      }

      try {
        const details = await imdbService.getDetails(imdbId);
        return res.json(details);
      } catch (imdbError) {
        console.warn(
          "Primary IMDB details lookup failed, falling back to OMDb:",
          imdbError.message
        );
        const details = await omdbService.getDetails(imdbId);
        return res.json(details);
      }
    } catch (error) {
      console.error("Get IMDB Details Error:", error);
      res.status(500).json({ error: "Failed to get IMDB details" });
    }
  },

  // Get top rated from IMDB
  getTopRated: async (req, res) => {
    try {
      const { limit = 50 } = req.query;
      const results = await imdbService.getTopRated(parseInt(limit));
      res.json(results);
    } catch (error) {
      console.error("Get Top Rated Error:", error);
      res.status(500).json({ error: "Failed to get top rated" });
    }
  },

  // Get popular from IMDB
  getPopular: async (req, res) => {
    try {
      const { limit = 50 } = req.query;
      const results = await imdbService.getPopular(parseInt(limit));
      res.json(results);
    } catch (error) {
      console.error("Get Popular Error:", error);
      res.status(500).json({ error: "Failed to get popular" });
    }
  },

  // Spotlight search - Uses IMDB suggestion API scraper
  spotlightSearch: async (req, res) => {
    try {
      const { query } = req.query;

      if (!query) {
        return res.status(400).json({ error: "Search query is required" });
      }

      console.log("Spotlight search for:", query);

      // Check if query includes "anime" prefix
      const isAnimeQuery = query.toLowerCase().startsWith("anime ");

      let searchResults;
      if (isAnimeQuery) {
        // For anime queries, use AniList
        searchResults = await anilistService.searchAnime(
          query.replace(/^anime\s+/i, "")
        );
      } else {
        // Merge the fast IMDb suggestion endpoint with the broader IMDb search API.
        const [suggestionResults, fullSearchResults] = await Promise.allSettled([
          imdbScraper.search(query),
          imdbService.search(query, { page: 1 }),
        ]);

        searchResults = dedupeSpotlightResults([
          suggestionResults.status === "fulfilled" ? suggestionResults.value : [],
          fullSearchResults.status === "fulfilled" ? fullSearchResults.value : [],
        ]);
      }

      console.log("Sending", searchResults.length, "results");

      res.json({ results: searchResults });
    } catch (error) {
      console.error("Spotlight Search Error:", error);
      res.status(500).json({ error: "Failed to search" });
    }
  },
};

export default searchController;
