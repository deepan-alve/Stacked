import database from "../config/database.js";

class EntryModel {
  async findAll(year = null) {
    try {
      let query = "SELECT * FROM movies";
      const params = [];
      
      if (year !== null) {
        query += " WHERE year = ?";
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

  async findById(id) {
    try {
      const entry = await database.get("SELECT * FROM movies WHERE id = ?", [
        id,
      ]);
      return entry;
    } catch (error) {
      throw new Error(`Error fetching entry: ${error.message}`);
    }
  }

  async create(data) {
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
        "INSERT INTO movies (title, type, rating, season, notes, poster_url, api_id, api_provider, description, release_date, year, watch_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
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

  async update(id, data) {
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

      const query = `UPDATE movies SET ${updateFields.join(", ")} WHERE id = ?`;
      const result = await database.run(query, params);

      if (result.changes === 0) {
        return null;
      }

      // Fetch the complete entry to return all fields including year and created_at
      const updatedEntry = await database.get("SELECT * FROM movies WHERE id = ?", [id]);
      return updatedEntry;
    } catch (error) {
      throw new Error(`Error updating entry: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      const result = await database.run("DELETE FROM movies WHERE id = ?", [
        id,
      ]);
      return result.changes > 0;
    } catch (error) {
      throw new Error(`Error deleting entry: ${error.message}`);
    }
  }

  async getStatistics(year = null) {
    try {
      let statsQuery = `
        SELECT
          type,
          COUNT(*) as count,
          AVG(rating) as avg_rating
        FROM movies
      `;
      let totalQuery = "SELECT COUNT(*) as count FROM movies";
      const params = [];

      if (year !== null) {
        statsQuery += " WHERE year = ?";
        totalQuery += " WHERE year = ?";
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

  async checkDuplicate(title, api_id = null, api_provider = null) {
    try {
      let query = "SELECT id, title, year FROM movies WHERE ";
      const params = [];
      
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

  async getAvailableYears() {
    try {
      const years = await database.all(
        "SELECT DISTINCT year FROM movies ORDER BY year DESC"
      );
      return years.map(row => row.year);
    } catch (error) {
      throw new Error(`Error fetching available years: ${error.message}`);
    }
  }
}

export default new EntryModel();
