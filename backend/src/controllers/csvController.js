import database from "../config/database.js";
import ActivityModel from "../models/activityModel.js";

class CsvController {
  async exportCsv(req, res) {
    try {
      const userId = req.user.id;
      const entries = await database.all(
        "SELECT * FROM movies WHERE user_id = ? ORDER BY created_at DESC",
        [userId]
      );

      const headers = ["title", "type", "rating", "season", "status", "tags", "year", "watch_date", "notes", "poster_url", "api_id", "api_provider", "description", "release_date"];
      const csvRows = [headers.join(",")];

      for (const entry of entries) {
        const row = headers.map((h) => {
          const val = entry[h] ?? "";
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        });
        csvRows.push(row.join(","));
      }

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=stacked-export.csv");
      res.send(csvRows.join("\n"));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async importCsv(req, res) {
    try {
      const userId = req.user.id;
      const { data } = req.body;

      if (!data || !Array.isArray(data)) {
        return res.status(400).json({ error: "data array is required" });
      }

      let imported = 0;
      let skipped = 0;

      for (const row of data) {
        if (!row.title || !row.type) {
          skipped++;
          continue;
        }

        // Check for duplicate
        const existing = await database.get(
          "SELECT id FROM movies WHERE user_id = ? AND LOWER(title) = LOWER(?)",
          [userId, row.title]
        );

        if (existing) {
          skipped++;
          continue;
        }

        const now = new Date().toISOString();
        await database.run(
          `INSERT INTO movies (user_id, title, type, rating, season, status, tags, year, watch_date, notes, poster_url, api_id, api_provider, description, release_date, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            row.title,
            row.type,
            row.rating ? parseFloat(row.rating) : null,
            row.season ? parseInt(row.season) : null,
            row.status || "completed",
            row.tags || "[]",
            row.year ? parseInt(row.year) : new Date().getFullYear(),
            row.watch_date || now,
            row.notes || "",
            row.poster_url || null,
            row.api_id || null,
            row.api_provider || null,
            row.description || null,
            row.release_date || null,
            now,
            now,
          ]
        );

        await ActivityModel.log(userId, "imported", null, row.title, row.type);
        imported++;
      }

      res.json({ imported, skipped, total: data.length });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new CsvController();
