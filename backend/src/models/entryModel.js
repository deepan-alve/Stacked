import database from "../config/database.js";

class EntryModel {
  async findAll() {
    try {
      const entries = await database.all(
        "SELECT * FROM movies ORDER BY id DESC"
      );
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
    const { title, type, rating, season, notes } = data;
    const now = new Date().toISOString();

    try {
      const result = await database.run(
        "INSERT INTO movies (title, type, rating, season, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [title, type, rating || null, season || null, notes || "", now, now]
      );

      return {
        id: result.id,
        title,
        type,
        rating: rating || null,
        season: season || null,
        notes: notes || "",
        created_at: now,
        updated_at: now,
      };
    } catch (error) {
      throw new Error(`Error creating entry: ${error.message}`);
    }
  }

  async update(id, data) {
    const { title, type, rating, season, notes } = data;
    const now = new Date().toISOString();

    try {
      const result = await database.run(
        "UPDATE movies SET title = ?, type = ?, rating = ?, season = ?, notes = ?, updated_at = ? WHERE id = ?",
        [title, type, rating || null, season || null, notes || "", now, id]
      );

      if (result.changes === 0) {
        return null;
      }

      return {
        id: parseInt(id),
        title,
        type,
        rating: rating || null,
        season: season || null,
        notes: notes || "",
        updated_at: now,
      };
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

  async getStatistics() {
    try {
      const stats = await database.all(`
        SELECT 
          type,
          COUNT(*) as count,
          AVG(rating) as avg_rating
        FROM movies
        GROUP BY type
      `);

      const total = await database.get("SELECT COUNT(*) as count FROM movies");

      return {
        total: total.count,
        byType: stats,
      };
    } catch (error) {
      throw new Error(`Error fetching statistics: ${error.message}`);
    }
  }
}

export default new EntryModel();
