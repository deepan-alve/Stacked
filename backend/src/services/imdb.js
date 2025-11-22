// IMDB API Service using imdbapi.dev
const IMDB_BASE_URL = "https://imdbapi.dev";

class IMDBService {
  /**
   * Search for titles on IMDB
   * @param {string} query - Search query
   * @param {object} options - Optional filters
   * @param {string} options.type - Filter by type: 'movie', 'series', 'episode', etc.
   * @param {number} options.year - Filter by release year
   * @param {number} options.page - Page number for pagination (default: 1)
   * @returns {Promise<Array>} Array of search results
   */
  async search(query, options = {}) {
    try {
      const { type, year, page = 1 } = options;

      let url = `${IMDB_BASE_URL}/search?q=${encodeURIComponent(
        query
      )}&page=${page}`;

      if (type) {
        url += `&type=${type}`;
      }

      if (year) {
        url += `&year=${year}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`IMDB API returned ${response.status}`);
      }

      const data = await response.json();

      // Transform results to match our standard format
      return (
        data.results?.map((item) => ({
          imdbId: item.imdbId || item.id,
          title: item.title || item.name,
          year: item.year,
          type: this.normalizeType(item.type),
          poster: item.image || item.poster,
          rating: item.rating,
          plot: item.plot,
          genres: item.genres || [],
          stars: item.stars || [],
          provider: "imdb",
        })) || []
      );
    } catch (error) {
      console.error("IMDB Search Error:", error);
      throw new Error(`Failed to search IMDB: ${error.message}`);
    }
  }

  /**
   * Get detailed information for a specific IMDB title
   * @param {string} imdbId - IMDB ID (e.g., 'tt1234567')
   * @returns {Promise<Object>} Detailed information about the title
   */
  async getDetails(imdbId) {
    try {
      // Remove 'tt' prefix if present for the API call
      const cleanId = imdbId.replace(/^tt/, "");

      const response = await fetch(`${IMDB_BASE_URL}/title/tt${cleanId}`);

      if (!response.ok) {
        throw new Error(`IMDB API returned ${response.status}`);
      }

      const data = await response.json();

      return {
        imdbId: data.imdbId || `tt${cleanId}`,
        title: data.title,
        originalTitle: data.originalTitle,
        year: data.year,
        releaseDate: data.releaseDate,
        runtime: data.runtime,
        runtimeMinutes: data.runtimeMinutes,
        type: this.normalizeType(data.type),
        genres: data.genres || [],
        plot: data.plot,
        plotSummary: data.plotSummary,
        poster: data.image || data.poster,
        rating: data.rating,
        ratingCount: data.ratingCount,
        contentRating: data.contentRating,
        directors: data.directors || [],
        writers: data.writers || [],
        stars: data.stars || [],
        cast: data.cast || [],
        tagline: data.tagline,
        keywords: data.keywords || [],
        languages: data.languages || [],
        countries: data.countries || [],
        awards: data.awards,
        boxOffice: data.boxOffice,
        productionCompanies: data.productionCompanies || [],
        trailer: data.trailer,
        // TV Series specific
        seasons: data.seasons,
        episodes: data.episodes,
        // Additional metadata
        imdbUrl: `https://www.imdb.com/title/tt${cleanId}/`,
        provider: "imdb",
      };
    } catch (error) {
      console.error("IMDB Details Error:", error);
      throw new Error(`Failed to get IMDB details: ${error.message}`);
    }
  }

  /**
   * Get top rated movies
   * @param {number} limit - Number of results to return (default: 50, max: 250)
   * @returns {Promise<Array>} Array of top rated movies
   */
  async getTopRated(limit = 50) {
    try {
      const response = await fetch(`${IMDB_BASE_URL}/top?limit=${limit}`);

      if (!response.ok) {
        throw new Error(`IMDB API returned ${response.status}`);
      }

      const data = await response.json();

      return (
        data.results?.map((item) => ({
          imdbId: item.imdbId || item.id,
          title: item.title,
          year: item.year,
          type: this.normalizeType(item.type),
          poster: item.image || item.poster,
          rating: item.rating,
          rank: item.rank,
          provider: "imdb",
        })) || []
      );
    } catch (error) {
      console.error("IMDB Top Rated Error:", error);
      throw new Error(`Failed to get top rated: ${error.message}`);
    }
  }

  /**
   * Get popular movies/shows
   * @param {number} limit - Number of results to return
   * @returns {Promise<Array>} Array of popular titles
   */
  async getPopular(limit = 50) {
    try {
      const response = await fetch(`${IMDB_BASE_URL}/popular?limit=${limit}`);

      if (!response.ok) {
        throw new Error(`IMDB API returned ${response.status}`);
      }

      const data = await response.json();

      return (
        data.results?.map((item) => ({
          imdbId: item.imdbId || item.id,
          title: item.title,
          year: item.year,
          type: this.normalizeType(item.type),
          poster: item.image || item.poster,
          rating: item.rating,
          provider: "imdb",
        })) || []
      );
    } catch (error) {
      console.error("IMDB Popular Error:", error);
      throw new Error(`Failed to get popular titles: ${error.message}`);
    }
  }

  /**
   * Search by IMDB ID directly
   * @param {string} imdbId - IMDB ID (e.g., 'tt1234567')
   * @returns {Promise<Object>} Title details
   */
  async searchById(imdbId) {
    return this.getDetails(imdbId);
  }

  /**
   * Get poster URL for a title
   * @param {string} imdbId - IMDB ID
   * @returns {Promise<string|null>} Poster URL or null
   */
  async getPosterUrl(imdbId) {
    try {
      const details = await this.getDetails(imdbId);
      return details.poster || null;
    } catch (error) {
      console.error("IMDB Poster Error:", error);
      return null;
    }
  }

  /**
   * Normalize type to match our system's types
   * @param {string} imdbType - Type from IMDB API
   * @returns {string} Normalized type
   */
  normalizeType(imdbType) {
    if (!imdbType) return "Unknown";

    const type = imdbType.toLowerCase();

    if (type.includes("movie")) return "Movie";
    if (type.includes("series") || type.includes("tv")) return "Series";
    if (type.includes("episode")) return "Episode";
    if (type.includes("video")) return "Video";
    if (type.includes("game")) return "Game";

    return imdbType;
  }

  /**
   * Extract IMDB ID from various URL formats
   * @param {string} url - IMDB URL
   * @returns {string|null} IMDB ID or null
   */
  extractImdbId(url) {
    const match = url.match(/tt\d{7,}/);
    return match ? match[0] : null;
  }
}

export default new IMDBService();
