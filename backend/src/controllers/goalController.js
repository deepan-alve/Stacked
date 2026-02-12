import GoalModel from "../models/goalModel.js";

class GoalController {
  async getAll(req, res) {
    try {
      const goals = await GoalModel.getProgress(req.user.id);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async create(req, res) {
    try {
      const { type, target, period } = req.body;
      if (!type || !target || !period) {
        return res.status(400).json({ error: "type, target, and period are required" });
      }
      const goal = await GoalModel.create(req.body, req.user.id);
      res.status(201).json(goal);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async update(req, res) {
    try {
      const goal = await GoalModel.update(req.params.id, req.body, req.user.id);
      if (!goal) return res.status(404).json({ error: "Goal not found" });
      res.json(goal);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async delete(req, res) {
    try {
      const deleted = await GoalModel.delete(req.params.id, req.user.id);
      if (!deleted) return res.status(404).json({ error: "Goal not found" });
      res.json({ message: "Goal deleted" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new GoalController();
