import EntryModel from "../models/entryModel.js";
import googleSearchService from "../services/googleSearch.js";

class EntryController {
  async getAll(req, res) {
    try {
      console.log("[ENTRIES] Fetching all entries for user:", req.user?.id || 'unknown');
      const entries = await EntryModel.findAll();
      console.log("[ENTRIES] Found", entries.length, "entries");
      res.json(entries);
    } catch (error) {
      console.error("[ENTRIES] Error fetching entries:", error.message);
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

  async addByImdb(req, res) {
    try {
      const { imdbId, type } = req.body;

      if (!imdbId) {
        return res.status(400).json({ error: "IMDB ID is required" });
      }

      // Default type is 'movie'
      const entryType = type || "movie";

      // Fetch details by scraping IMDB directly
      console.log("Scraping IMDB details for:", imdbId);
      const details = await googleSearchService.scrapeIMDBDetails(imdbId);

      if (!details || !details.title || details.title === "Unknown") {
        return res.status(404).json({ error: "Movie not found on IMDB" });
      }

      // Create entry with fetched details
      const entryData = {
        title: details.title,
        type: entryType,
        rating: null, // User will rate it themselves
        poster_url: details.poster,
        api_id: imdbId,
        api_provider: "imdb",
        description: details.plot,
        release_date: details.year ? `${details.year}-01-01` : null,
        notes: "",
      };

      const entry = await EntryModel.create(entryData);
      res.status(201).json(entry);
    } catch (error) {
      console.error("Error adding by IMDB:", error);
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
