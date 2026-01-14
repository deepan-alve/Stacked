import database from "../config/database.js";

class EntryModel {
  async findAll(year = null, userId) {
    try {
      let query = "SELECT * FROM movies WHERE user_id = ?";
      const params = [userId];

      if (year !== null) {
        query += " AND year = ?";
        params.push(year);
      }

      // Order by watch_date (with NULL handling), then by id DESC
      query += " ORDER BY COALESCE(watch_date, created_at) DESC, id DESC";

      const entries = await database.all(query, params);
      return entries;
    } catch (error) {
      throw new Error(`Error fetching entries: ${error.message}`);
    }
  }

  async findById(id, userId) {
    try {
      const entry = await database.get(
        "SELECT * FROM movies WHERE id = ? AND user_id = ?",
        [id, userId]
      );
      return entry;
    } catch (error) {
      throw new Error(`Error fetching entry: ${error.message}`);
    }
  }

  async create(data, userId) {
    const {
      title,
      type,
      rating,
      season,
      notes,
      poster_url,
      api_id,
      api_provider,
      description,
      release_date,
      year,
      watch_date,
    } = data;
    const now = new Date().toISOString();
    const currentYear = new Date().getFullYear();

    // Default to current year and today's date
    const entryYear = year || currentYear;
    const entryWatchDate = watch_date || now;

    try {
      const result = await database.run(
        "INSERT INTO movies (user_id, title, type, rating, season, notes, poster_url, api_id, api_provider, description, release_date, year, watch_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          userId,
          title,
          type,
          rating || null,
          season || null,
          notes || "",
          poster_url || null,
          api_id || null,
          api_provider || null,
          description || null,
          release_date || null,
          entryYear,
          entryWatchDate,
          now,
          now,
        ]
      );

      return {
        id: result.id,
        user_id: userId,
        title,
        type,
        rating: rating || null,
        season: season || null,
        notes: notes || "",
        poster_url: poster_url || null,
        api_id: api_id || null,
        api_provider: api_provider || null,
        description: description || null,
        release_date: release_date || null,
        year: entryYear,
        watch_date: entryWatchDate,
        created_at: now,
        updated_at: now,
      };
    } catch (error) {
      throw new Error(`Error creating entry: ${error.message}`);
    }
  }

  async update(id, data, userId) {
    const {
      title,
      type,
      rating,
      season,
      notes,
      poster_url,
      api_id,
      api_provider,
      description,
      release_date,
      watch_date,
      year,
    } = data;
    const now = new Date().toISOString();

    try {
      // Only update watch_date and year if provided (for backward compatibility)
      const updateFields = [
        "title = ?",
        "type = ?",
        "rating = ?",
        "season = ?",
        "notes = ?",
        "poster_url = ?",
        "api_id = ?",
        "api_provider = ?",
        "description = ?",
        "release_date = ?",
      ];
      const params = [
        title,
        type,
        rating || null,
        season || null,
        notes || "",
        poster_url || null,
        api_id || null,
        api_provider || null,
        description || null,
        release_date || null,
      ];

      if (watch_date !== undefined) {
        updateFields.push("watch_date = ?");
        params.push(watch_date);
      }

      if (year !== undefined) {
        updateFields.push("year = ?");
        params.push(year);
      }

      updateFields.push("updated_at = ?");
      params.push(now);
      params.push(id);
      params.push(userId);

      const query = `UPDATE movies SET ${updateFields.join(", ")} WHERE id = ? AND user_id = ?`;
      const result = await database.run(query, params);

      if (result.changes === 0) {
        return null;
      }

      // Fetch the complete entry to return all fields including year and created_at
      const updatedEntry = await database.get(
        "SELECT * FROM movies WHERE id = ? AND user_id = ?",
        [id, userId]
      );
      return updatedEntry;
    } catch (error) {
      throw new Error(`Error updating entry: ${error.message}`);
    }
  }

  async delete(id, userId) {
    try {
      const result = await database.run(
        "DELETE FROM movies WHERE id = ? AND user_id = ?",
        [id, userId]
      );
      return result.changes > 0;
    } catch (error) {
      throw new Error(`Error deleting entry: ${error.message}`);
    }
  }

  async getStatistics(year = null, userId) {
    try {
      let statsQuery = `
        SELECT
          type,
          COUNT(*) as count,
          AVG(rating) as avg_rating
        FROM movies
        WHERE user_id = ?
      `;
      let totalQuery = "SELECT COUNT(*) as count FROM movies WHERE user_id = ?";
      const params = [userId];

      if (year !== null) {
        statsQuery += " AND year = ?";
        totalQuery += " AND year = ?";
        params.push(year);
      }

      statsQuery += " GROUP BY type";

      const stats = await database.all(statsQuery, params);
      const total = await database.get(totalQuery, params);

      return {
        total: total.count,
        byType: stats,
        year: year,
      };
    } catch (error) {
      throw new Error(`Error fetching statistics: ${error.message}`);
    }
  }

  async checkDuplicate(title, api_id = null, api_provider = null, userId) {
    try {
      let query = "SELECT id, title, year FROM movies WHERE user_id = ? AND ";
      const params = [userId];

      // Check by API ID first (more accurate)
      if (api_id && api_provider) {
        query += "api_id = ? AND api_provider = ?";
        params.push(api_id, api_provider);
      } else {
        // Fall back to title match (case-insensitive)
        query += "LOWER(title) = LOWER(?)";
        params.push(title);
      }

      const duplicate = await database.get(query, params);
      return duplicate;
    } catch (error) {
      throw new Error(`Error checking duplicate: ${error.message}`);
    }
  }

  async getAvailableYears(userId) {
    try {
      const years = await database.all(
        "SELECT DISTINCT year FROM movies WHERE user_id = ? ORDER BY year DESC",
        [userId]
      );
      return years.map(row => row.year);
    } catch (error) {
      throw new Error(`Error fetching available years: ${error.message}`);
    }
  }
}

export default new EntryModel();
