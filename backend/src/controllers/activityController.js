import ActivityModel from "../models/activityModel.js";

class ActivityController {
  async getRecent(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const activities = await ActivityModel.getRecent(req.user.id, limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getStreak(req, res) {
    try {
      const streak = await ActivityModel.getStreak(req.user.id);
      res.json(streak);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getHeatmap(req, res) {
    try {
      const days = parseInt(req.query.days) || 30;
      const heatmap = await ActivityModel.getHeatmap(req.user.id, days);
      res.json(heatmap);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new ActivityController();
