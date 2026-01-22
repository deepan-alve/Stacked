// IMDB Scraper using the suggestion/autocomplete API
// This API doesn't have WAF protection and returns good data

const IMDB_SUGGEST_URL = "https://v3.sg.media-imdb.com/suggestion/x";

class IMDBScraper {
  /**
   * Search IMDB using the suggestion API
   * @param {string} query - Search query
   * @returns {Promise<Array>} Array of search results
   */
  async search(query) {
    try {
      // The suggestion API uses the first letter of the query in the URL path
      const encodedQuery = encodeURIComponent(query.toLowerCase());
      const url = `${IMDB_SUGGEST_URL}/${encodedQuery}.json`;

      console.log(`IMDB Scraper searching: ${query}`);

      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Accept": "application/json",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });

      if (!response.ok) {
        throw new Error(`IMDB API returned ${response.status}`);
      }

      const data = await response.json();

      // Filter and map results
      const results = (data.d || [])
        .filter((item) => {
          // Only include movies and TV series (not people, music videos, etc.)
          return item.qid === "movie" || item.qid === "tvSeries" || item.qid === "tvMiniSeries";
        })
        .map((item) => ({
          imdbId: item.id,
          title: item.l,
          year: item.y || null,
          type: this.normalizeType(item.qid),
          poster: this.formatPosterUrl(item.i?.imageUrl),
          stars: item.s || null,
          rank: item.rank,
          provider: "imdb",
        }));

      console.log(`IMDB Scraper found ${results.length} results`);
      return results;
    } catch (error) {
      console.error("IMDB Scraper Error:", error);
      return [];
    }
  }

  /**
   * Format poster URL to get a good quality image
   * @param {string} url - Original poster URL
   * @returns {string|null} Formatted poster URL
   */
  formatPosterUrl(url) {
    if (!url) return null;

    // The suggestion API returns full quality URLs
    // Optionally resize to a reasonable size (500px width)
    // Format: https://m.media-amazon.com/images/M/...@._V1_.jpg
    // Can add ._V1_SX500.jpg for 500px width

    try {
      // Remove any existing size parameters and add our preferred size
      const baseUrl = url.split("._V1_")[0];
      return `${baseUrl}._V1_SX500.jpg`;
    } catch {
      return url;
    }
  }

  /**
   * Normalize IMDB type to our standard format
   * @param {string} qid - IMDB type ID
   * @returns {string} Normalized type
   */
  normalizeType(qid) {
    switch (qid) {
      case "movie":
      case "feature":
        return "Movie";
      case "tvSeries":
      case "tvMiniSeries":
        return "Series";
      default:
        return "Movie";
    }
  }
}

export default new IMDBScraper();
