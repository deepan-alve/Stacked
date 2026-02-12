import database from "../config/database.js";
import crypto from "crypto";

class ShareModel {
  async create(userId, collection, filters = {}) {
    const id = crypto.randomBytes(8).toString("hex");
    await database.run(
      "INSERT INTO share_links (id, user_id, collection, filters) VALUES (?, ?, ?, ?)",
      [id, userId, collection, JSON.stringify(filters)]
    );
    return { id, user_id: userId, collection, filters, created_at: new Date().toISOString() };
  }

  async findById(id) {
    const row = await database.get("SELECT * FROM share_links WHERE id = ?", [id]);
    if (row) {
      row.filters = JSON.parse(row.filters || "{}");
    }
    return row;
  }

  async findByUser(userId) {
    const rows = await database.all(
      "SELECT * FROM share_links WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
    return rows.map((r) => ({ ...r, filters: JSON.parse(r.filters || "{}") }));
  }

  async delete(id, userId) {
    const result = await database.run(
      "DELETE FROM share_links WHERE id = ? AND user_id = ?",
      [id, userId]
    );
    return result.changes > 0;
  }

  async getSharedData(id) {
    const link = await this.findById(id);
    if (!link) return null;

    let entries;
    if (link.collection === "favorites") {
      entries = await database.all(
        "SELECT * FROM dlang_movies WHERE user_id = ? ORDER BY rating DESC",
        [link.user_id]
      );
    } else {
      let query = "SELECT * FROM movies WHERE user_id = ?";
      const params = [link.user_id];

      if (link.filters.year) {
        query += " AND year = ?";
        params.push(link.filters.year);
      }
      if (link.filters.type) {
        query += " AND type = ?";
        params.push(link.filters.type);
      }

      query += " ORDER BY COALESCE(watch_date, created_at) DESC";
      entries = await database.all(query, params);
    }

    return { link, entries };
  }
}

export default new ShareModel();
