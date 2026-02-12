import ShareModel from "../models/shareModel.js";

class ShareController {
  async create(req, res) {
    try {
      const { collection, filters } = req.body;
      if (!collection) {
        return res.status(400).json({ error: "collection is required" });
      }
      const link = await ShareModel.create(req.user.id, collection, filters);
      res.status(201).json(link);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getPublic(req, res) {
    try {
      const data = await ShareModel.getSharedData(req.params.id);
      if (!data) return res.status(404).json({ error: "Share link not found" });
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getUserLinks(req, res) {
    try {
      const links = await ShareModel.findByUser(req.user.id);
      res.json(links);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async delete(req, res) {
    try {
      const deleted = await ShareModel.delete(req.params.id, req.user.id);
      if (!deleted) return res.status(404).json({ error: "Share link not found" });
      res.json({ message: "Share link deleted" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new ShareController();
