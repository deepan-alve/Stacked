// OMDb API Service - Uses IMDB data
// Free tier: 1000 requests/day
// Get your own key at: https://www.omdbapi.com/apikey.aspx

const OMDB_API_KEY = process.env.OMDB_API_KEY || "trilogy"; // Default demo key
const OMDB_BASE_URL = "https://www.omdbapi.com";

// TMDB for poster fallback (more reliable image hosting)
const TMDB_API_KEY = "***REMOVED_TMDB_KEY***";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

class OMDbService {
  // Cache for TMDB poster lookups to avoid duplicate requests
  posterCache = new Map();

  async getTMDBPoster(title, year, type) {
    const cacheKey = `${title}-${year}-${type}`;
    if (this.posterCache.has(cacheKey)) {
      return this.posterCache.get(cacheKey);
    }

    try {
      const searchType = type === "Series" ? "tv" : "movie";
      const yearParam = year ? `&year=${year}` : "";
      const response = await fetch(
        `${TMDB_BASE_URL}/search/${searchType}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}${yearParam}`
      );
      const data = await response.json();

      if (data.results && data.results.length > 0 && data.results[0].poster_path) {
        const poster = `${TMDB_IMAGE_BASE}${data.results[0].poster_path}`;
        this.posterCache.set(cacheKey, poster);
        return poster;
      }
    } catch (error) {
      // Silently fail - will use OMDb poster or null
    }

    this.posterCache.set(cacheKey, null);
    return null;
  }

  async search(query) {
    try {
      const response = await fetch(
        `${OMDB_BASE_URL}/?s=${encodeURIComponent(query)}&apikey=${OMDB_API_KEY}`
      );
      const data = await response.json();

      if (data.Response === "False") {
        console.log("OMDb search returned no results:", data.Error);
        return [];
      }

      // Get TMDB posters in parallel for all results
      const results = await Promise.all(
        (data.Search || []).map(async (item) => {
          const type = item.Type === "movie" ? "Movie" : item.Type === "series" ? "Series" : item.Type;
          const year = item.Year ? parseInt(item.Year) : null;

          // Try TMDB poster first (more reliable), fall back to OMDb
          const tmdbPoster = await this.getTMDBPoster(item.Title, year, type);
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
