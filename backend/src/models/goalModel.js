import database from "../config/database.js";

class GoalModel {
  async findAll(userId) {
    return database.all(
      "SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
  }

  async findById(id, userId) {
    return database.get(
      "SELECT * FROM goals WHERE id = ? AND user_id = ?",
      [id, userId]
    );
  }

  async create(data, userId) {
    const { type, target, period } = data;
    const result = await database.run(
      "INSERT INTO goals (user_id, type, target, period) VALUES (?, ?, ?, ?)",
      [userId, type, target, period]
    );
    return { id: result.id, user_id: userId, type, target, period, created_at: new Date().toISOString() };
  }

  async update(id, data, userId) {
    const { type, target, period } = data;
    const result = await database.run(
      "UPDATE goals SET type = ?, target = ?, period = ? WHERE id = ? AND user_id = ?",
      [type, target, period, id, userId]
    );
    if (result.changes === 0) return null;
    return this.findById(id, userId);
  }

  async delete(id, userId) {
    const result = await database.run(
      "DELETE FROM goals WHERE id = ? AND user_id = ?",
      [id, userId]
    );
    return result.changes > 0;
  }

  async getProgress(userId) {
    const goals = await this.findAll(userId);
    const now = new Date();
    const progressData = [];

    for (const goal of goals) {
      let startDate;
      if (goal.period === "weekly") {
        const day = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - day);
        startDate.setHours(0, 0, 0, 0);
      } else if (goal.period === "monthly") {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      } else {
        startDate = new Date(now.getFullYear(), 0, 1);
      }

      const count = await database.get(
        `SELECT COUNT(*) as count FROM movies WHERE user_id = ? AND created_at >= ?`,
        [userId, startDate.toISOString()]
      );

      progressData.push({
        ...goal,
        current: count.count,
        percentage: Math.min(100, Math.round((count.count / goal.target) * 100)),
      });
    }

    return progressData;
  }
}

export default new GoalModel();
