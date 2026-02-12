import database from "../config/database.js";

class ActivityModel {
  async log(userId, action, entryId = null, entryTitle = null, entryType = null, metadata = {}) {
    return database.run(
      "INSERT INTO activity_log (user_id, action, entry_id, entry_title, entry_type, metadata) VALUES (?, ?, ?, ?, ?, ?)",
      [userId, action, entryId, entryTitle, entryType, JSON.stringify(metadata)]
    );
  }

  async getRecent(userId, limit = 50) {
    const rows = await database.all(
      "SELECT * FROM activity_log WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
      [userId, limit]
    );
    return rows.map((r) => ({ ...r, metadata: JSON.parse(r.metadata || "{}") }));
  }

  async getStreak(userId) {
    // Get all distinct dates with activity, ordered descending
    const rows = await database.all(
      `SELECT DISTINCT DATE(created_at) as activity_date FROM activity_log WHERE user_id = ? ORDER BY activity_date DESC`,
      [userId]
    );

    if (rows.length === 0) return { streak: 0, dates: [] };

    const today = new Date().toISOString().split("T")[0];
    const dates = rows.map((r) => r.activity_date);

    // Check if user has activity today or yesterday
    let streak = 0;
    let checkDate = new Date(today);

    // If no activity today, check if yesterday has activity to start the streak
    if (dates[0] !== today) {
      const yesterday = new Date(checkDate);
      yesterday.setDate(yesterday.getDate() - 1);
      if (dates[0] !== yesterday.toISOString().split("T")[0]) {
        return { streak: 0, dates: dates.slice(0, 30) };
      }
      checkDate = yesterday;
    }

    // Count consecutive days
    for (let i = 0; i < dates.length; i++) {
      const expected = checkDate.toISOString().split("T")[0];
      if (dates[i] === expected) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return { streak, dates: dates.slice(0, 30) };
  }

  async getHeatmap(userId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const rows = await database.all(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM activity_log WHERE user_id = ? AND created_at >= ?
       GROUP BY DATE(created_at) ORDER BY date`,
      [userId, startDate.toISOString()]
    );

    return rows;
  }
}

export default new ActivityModel();
