// OMDb API Service - Uses IMDB data
// Free tier: 1000 requests/day
// Get your own key at: https://www.omdbapi.com/apikey.aspx

const OMDB_API_KEY = process.env.OMDB_API_KEY;
const OMDB_BASE_URL = "https://www.omdbapi.com";

// TMDB for poster fallback (more reliable image hosting)
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

class OMDbService {
  // Cache for TMDB poster lookups to avoid duplicate requests
  posterCache = new Map();

  async getTMDBPosterByImdbId(imdbId) {
    if (!TMDB_API_KEY) {
      return null;
    }

    if (this.posterCache.has(imdbId)) {
      return this.posterCache.get(imdbId);
    }

    try {
      // Use TMDB's find endpoint - looks up by IMDB ID (more accurate)
      const response = await fetch(
        `${TMDB_BASE_URL}/find/${imdbId}?api_key=${TMDB_API_KEY}&external_source=imdb_id`
      );
      const data = await response.json();

      // Check movie results first, then TV
      const result = data.movie_results?.[0] || data.tv_results?.[0];
      if (result?.poster_path) {
        const poster = `${TMDB_IMAGE_BASE}${result.poster_path}`;
        this.posterCache.set(imdbId, poster);
        return poster;
      }
    } catch (error) {
      // Silently fail - will use OMDb poster or null
    }

    this.posterCache.set(imdbId, null);
    return null;
  }

  async search(query) {
    if (!OMDB_API_KEY) {
      console.warn("[OMDb] OMDB_API_KEY is not configured. Search disabled.");
      return [];
    }

    try {
      const response = await fetch(
        `${OMDB_BASE_URL}/?s=${encodeURIComponent(query)}&apikey=${OMDB_API_KEY}`
      );
      const data = await response.json();

      if (data.Response === "False") {
        console.log("OMDb search returned no results:", data.Error);
        return [];
      }

      // Get TMDB posters in parallel for all results (using IMDB ID lookup)
      const results = await Promise.all(
        (data.Search || []).map(async (item) => {
          const type = item.Type === "movie" ? "Movie" : item.Type === "series" ? "Series" : item.Type;
          const year = item.Year ? parseInt(item.Year) : null;

          // Try TMDB poster first (by IMDB ID - more accurate), fall back to OMDb
          const tmdbPoster = await this.getTMDBPosterByImdbId(item.imdbID);
          const omdbPoster = item.Poster !== "N/A" ? item.Poster : null;

          return {
            imdbId: item.imdbID,
            title: item.Title,
            year,
            type,
            poster: tmdbPoster || omdbPoster,
            provider: "omdb",
          };
        })
      );

      return results;
    } catch (error) {
      console.error("OMDb Search Error:", error);
      return [];
    }
  }

  async getDetails(imdbId) {
    if (!OMDB_API_KEY) {
      throw new Error("OMDB_API_KEY is not configured");
    }

    try {
      const response = await fetch(
        `${OMDB_BASE_URL}/?i=${imdbId}&plot=full&apikey=${OMDB_API_KEY}`
      );
      const data = await response.json();

      if (data.Response === "False") {
        throw new Error(data.Error);
      }

      return {
        imdbId: data.imdbID,
        title: data.Title,
        year: data.Year ? parseInt(data.Year) : null,
        type: data.Type === "movie" ? "Movie" : data.Type === "series" ? "Series" : data.Type,
        poster: data.Poster !== "N/A" ? data.Poster : null,
        plot: data.Plot !== "N/A" ? data.Plot : null,
        rating: data.imdbRating !== "N/A" ? parseFloat(data.imdbRating) : null,
        runtime: data.Runtime !== "N/A" ? data.Runtime : null,
        genres: data.Genre !== "N/A" ? data.Genre.split(", ") : [],
        director: data.Director !== "N/A" ? data.Director : null,
        actors: data.Actors !== "N/A" ? data.Actors : null,
        language: data.Language !== "N/A" ? data.Language : null,
        country: data.Country !== "N/A" ? data.Country : null,
        provider: "omdb",
      };
    } catch (error) {
      console.error("OMDb Details Error:", error);
      throw error;
    }
  }
}

export default new OMDbService();
