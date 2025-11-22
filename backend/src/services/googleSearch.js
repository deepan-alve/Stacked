// Google Search scraper for IMDB results

class GoogleSearchService {
  /**
   * Search Google for IMDB results
   * @param {string} query - Search query
   * @returns {Promise<Array>} Array of IMDB results with details
   */
  async searchIMDB(query) {
    try {
      // Skip Google scraping entirely - go straight to IMDB search
      // Google often blocks automated requests
      console.log(`Searching IMDB for: ${query}`);
      return await this.fallbackIMDBSearch(query);
    } catch (error) {
      console.error("Search Error:", error);
      return [];
    }
  }

  /**
   * Extract IMDB IDs from Google search results HTML
   * @param {string} html - HTML content from Google search
   * @returns {Array<string>} Array of IMDB IDs
   */
  extractIMDBIds(html) {
    const imdbIdPattern = /\/title\/(tt\d{7,})/g;
    const matches = html.matchAll(imdbIdPattern);
    const ids = new Set();

    for (const match of matches) {
      ids.add(match[1]);
    }

    return Array.from(ids);
  }

  /**
   * Direct IMDB search scraping (no API)
   * @param {string} query - Search query
   * @returns {Promise<Array>} Array of search results
   */
  async fallbackIMDBSearch(query) {
    try {
      // Go straight to scraping IMDB search page
      return await this.scrapeIMDBSearch(query);
    } catch (error) {
      console.error("IMDB Search Error:", error);
      return [];
    }
  }

  /**
   * Scrape IMDB search page directly
   * @param {string} query - Search query
   * @returns {Promise<Array>} Array of search results
   */
  async scrapeIMDBSearch(query) {
    try {
      const searchUrl = `https://www.imdb.com/find/?q=${encodeURIComponent(
        query
      )}&s=tt&ttype=ft,tv`;

      console.log(`Scraping IMDB search: ${searchUrl}`);

      const response = await fetch(searchUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          Referer: "https://www.imdb.com/",
          "Cache-Control": "max-age=0",
        },
      });

      const html = await response.text();

      // Multiple patterns to catch different HTML structures
      const patterns = [
        // Pattern 1: Standard link format
        /<a[^>]+href="\/title\/(tt\d+)\/[^"]*"[^>]*>/g,
        // Pattern 2: JSON-LD data
        /"url":"\/title\/(tt\d+)\/"/g,
        // Pattern 3: Data attributes
        /data-testid="[^"]*"[^>]*href="\/title\/(tt\d+)\/"/g,
      ];

      const seenIds = new Set();
      const results = [];

      // Try all patterns to extract IMDB IDs
      for (const pattern of patterns) {
        const matches = html.matchAll(pattern);
        for (const match of matches) {
          const imdbId = match[1];
          if (!seenIds.has(imdbId)) {
            seenIds.add(imdbId);
          }
        }
      }

      console.log(`Found ${seenIds.size} unique IMDB IDs`);

      // Limit to top 10 results for faster response
      const limitedIds = Array.from(seenIds).slice(0, 10);

      // Parallel scraping with Promise.all (10 concurrent requests)
      const scrapePromises = limitedIds.map(async (imdbId) => {
        try {
          const details = await this.scrapeIMDBDetails(imdbId);
          return details;
        } catch (error) {
          console.error(
            `Failed to fetch details for ${imdbId}:`,
            error.message
          );
          return null;
        }
      });

      // Wait for all parallel requests to complete
      const allResults = await Promise.all(scrapePromises);

      // Filter out null results
      const validResults = allResults.filter((r) => r !== null);

      console.log(`Returning ${validResults.length} results`);
      return validResults;
    } catch (error) {
      console.error("IMDB Search Scraping Error:", error);
      return [];
    }
  }

  /**
   * Scrape IMDB title page for details
   * @param {string} imdbId - IMDB ID
   * @returns {Promise<Object>} Title details
   */
  async scrapeIMDBDetails(imdbId) {
    try {
      const url = `https://www.imdb.com/title/${imdbId}/`;

      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          Referer: "https://www.imdb.com/",
        },
      });

      const html = await response.text();

      // Extract JSON-LD data (most reliable method)
      const jsonLdMatch = html.match(
        /<script type="application\/ld\+json">(.*?)<\/script>/s
      );
      let jsonData = null;
      if (jsonLdMatch) {
        try {
          jsonData = JSON.parse(jsonLdMatch[1]);
        } catch (e) {
          console.log("Failed to parse JSON-LD data");
        }
      }

      // Extract title
      let title = "Unknown";
      if (jsonData && jsonData.name) {
        title = jsonData.name;
      } else {
        const titleMatch =
          html.match(
            /<h1[^>]*data-testid="hero__primary-text"[^>]*>([^<]+)<\/h1>/
          ) ||
          html.match(/<h1[^>]*>([^<]+)<\/h1>/) ||
          html.match(/<title>([^<]+)<\/title>/);
        title = titleMatch
          ? titleMatch[1].trim().replace(/ - IMDb$/, "")
          : "Unknown";
      }

      // Extract year
      let year = null;
      if (jsonData && jsonData.datePublished) {
        year = jsonData.datePublished.substring(0, 4);
      } else {
        const yearMatch =
          html.match(
            /<a[^>]+href="\/title\/${imdbId}\/releaseinfo[^>]*>(\d{4})<\/a>/
          ) ||
          html.match(/releaseinfo.*?(\d{4})/) ||
          title.match(/\((\d{4})\)/);
        year = yearMatch ? yearMatch[1] : null;
      }

      // Clean title (remove year and extra text)
      title = title.replace(/\s*\(\d{4}[–-]?\d*\).*$/, "").trim();

      // Extract poster
      let poster = null;
      if (jsonData && jsonData.image) {
        poster = jsonData.image.split("._V1_")[0] + "._V1_.jpg";
      } else {
        const posterMatch =
          html.match(
            /<img[^>]+class="[^"]*ipc-image[^"]*"[^>]+src="(https:\/\/m\.media-amazon\.com\/images\/M\/[^"]+)"/
          ) ||
          html.match(
            /<img[^>]+src="(https:\/\/m\.media-amazon\.com\/images\/M\/[^"]+)"/
          );
        poster = posterMatch
          ? posterMatch[1].split("._V1_")[0] + "._V1_.jpg"
          : null;
      }

      // Extract rating
      let rating = null;
      if (jsonData && jsonData.aggregateRating) {
        rating = parseFloat(jsonData.aggregateRating.ratingValue);
      } else {
        const ratingMatch =
          html.match(/"ratingValue":"?([\d.]+)"?/) ||
          html.match(/(\d+\.\d+)<\/span>\s*<span[^>]*>\/10/) ||
          html.match(/(\d+\.\d+)\/10/);
        rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;
      }

      // Extract plot
      let plot = null;
      if (jsonData && jsonData.description) {
        plot = jsonData.description;
      } else {
        const plotMatch =
          html.match(/"description":"([^"]+)"/) ||
          html.match(/<span data-testid="plot-[^"]*"[^>]*>([^<]+)<\/span>/) ||
          html.match(/<p[^>]*><span[^>]*>([^<]+)<\/span><\/p>/);
        plot = plotMatch ? plotMatch[1] : null;
      }

      // Determine type
      let type = "Movie";
      if (jsonData && jsonData["@type"]) {
        if (
          jsonData["@type"] === "TVSeries" ||
          jsonData["@type"] === "TVMiniSeries"
        ) {
          type = "Series";
        }
      } else if (
        html.includes("TV Series") ||
        html.includes("TV Mini Series") ||
        html.includes('"@type":"TVSeries"')
      ) {
        type = "Series";
      }

      console.log(`Scraped ${imdbId}: ${title} (${year}) - ${type}`);

      return {
        imdbId,
        title,
        year,
        type,
        poster,
        rating,
        plot,
        genres: [],
        provider: "imdb",
      };
    } catch (error) {
      console.error(`Scrape IMDB Details Error for ${imdbId}:`, error.message);
      return null;
    }
  }

  /**
   * Search with anime prefix for AniList results
   * @param {string} query - Search query
   * @returns {Promise<Array>} Combined IMDB and AniList results
   */
  async searchWithAnime(query) {
    try {
      // Search both IMDB with "anime" prefix and AniList
      const [imdbResults] = await Promise.all([
        this.searchIMDB(`anime ${query}`),
      ]);

      // For now, just return IMDB results
      // Can add AniList integration later if needed
      return imdbResults;
    } catch (error) {
      console.error("Anime Search Error:", error);
      return [];
    }
  }
}

export default new GoogleSearchService();
