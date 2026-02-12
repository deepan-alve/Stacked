import database from "../config/database.js";

class RecommendationController {
  async getRecommendations(req, res) {
    try {
      const userId = req.user.id;

      // Get user's top-rated movies with TMDB IDs
      const topRated = await database.all(
        `SELECT * FROM movies WHERE user_id = ? AND rating >= 4 AND api_id IS NOT NULL
         ORDER BY rating DESC LIMIT 5`,
        [userId]
      );

      if (topRated.length === 0) {
        return res.json([]);
      }

      const tmdbApiKey = process.env.TMDB_API_KEY;
      if (!tmdbApiKey) {
        return res.json([]);
      }

      // Get similar movies from TMDB for the top-rated entry
      const recommendations = [];
      const seenIds = new Set();

      // Get user's existing api_ids to avoid recommending already-added items
      const existingIds = await database.all(
        "SELECT api_id FROM movies WHERE user_id = ? AND api_id IS NOT NULL",
        [userId]
      );
      const existingSet = new Set(existingIds.map((e) => e.api_id));

      for (const entry of topRated.slice(0, 3)) {
        try {
          // Try TMDB similar endpoint
          const tmdbId = entry.api_provider === "tmdb" ? entry.api_id : null;
          if (!tmdbId) continue;

          const mediaType = entry.type === "Movie" ? "movie" : "tv";
          const response = await fetch(
            `https://api.themoviedb.org/3/${mediaType}/${tmdbId}/similar?api_key=${tmdbApiKey}&page=1`
          );

          if (!response.ok) continue;

          const data = await response.json();
          for (const item of (data.results || []).slice(0, 5)) {
            const id = String(item.id);
            if (seenIds.has(id) || existingSet.has(id)) continue;
            seenIds.add(id);

            recommendations.push({
              title: item.title || item.name,
              poster_url: item.poster_path
                ? `https://image.tmdb.org/t/p/w300${item.poster_path}`
                : null,
              api_id: id,
              api_provider: "tmdb",
              type: entry.type,
              rating: item.vote_average ? (item.vote_average / 2).toFixed(1) : null,
              description: item.overview,
              release_date: item.release_date || item.first_air_date,
              based_on: entry.title,
            });
          }
        } catch {
          // Skip failed lookups
        }
      }

      res.json(recommendations.slice(0, 10));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new RecommendationController();
