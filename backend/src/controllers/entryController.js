import EntryModel from "../models/entryModel.js";

class EntryController {
  async getAll(req, res) {
    try {
      const entries = await EntryModel.findAll();
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req, res) {
    try {
      const entry = await EntryModel.findById(req.params.id);
      if (!entry) {
        return res.status(404).json({ error: "Entry not found" });
      }
      res.json(entry);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async create(req, res) {
    try {
      const { title, type } = req.body;

      if (!title || !type) {
        return res.status(400).json({ error: "Title and type are required" });
      }

      const entry = await EntryModel.create(req.body);
      res.status(201).json(entry);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async update(req, res) {
    try {
      const { title, type } = req.body;

      if (!title || !type) {
        return res.status(400).json({ error: "Title and type are required" });
      }

      const entry = await EntryModel.update(req.params.id, req.body);
      if (!entry) {
        return res.status(404).json({ error: "Entry not found" });
      }

      res.json(entry);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async delete(req, res) {
    try {
      const deleted = await EntryModel.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Entry not found" });
      }
      res.json({ message: "Entry deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getStatistics(req, res) {
    try {
      const stats = await EntryModel.getStatistics();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new EntryController();
