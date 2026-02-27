import EntryModel from "../models/entryModel.js";
import ActivityModel from "../models/activityModel.js";
import googleSearchService from "../services/googleSearch.js";

class EntryController {
  async getAll(req, res) {
    try {
      const userId = req.user.id;
      const yearParam = req.query.year ? parseInt(req.query.year) : null;
      const year = yearParam && !isNaN(yearParam) ? yearParam : null;
      const options = {
        status: req.query.status || null,
        sort: req.query.sort || null,
        tags: req.query.tags || null,
      };
      console.log(
        "[ENTRIES] Fetching entries for user:",
        userId,
        "Year filter:",
        year || "all"
      );
      const entries = await EntryModel.findAll(year, userId, options);
      console.log("[ENTRIES] Found", entries.length, "entries");
      res.json(entries);
    } catch (error) {
      console.error("[ENTRIES] Error fetching entries:", error.message);
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req, res) {
    try {
      const userId = req.user.id;
      const entry = await EntryModel.findById(req.params.id, userId);
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
      const userId = req.user.id;
      const { title, type, api_id, api_provider } = req.body;

      if (!title || !type) {
        return res.status(400).json({ error: "Title and type are required" });
      }

      // Check for duplicates (skip if user confirmed with force flag)
      if (!req.body.force) {
        const duplicate = await EntryModel.checkDuplicate(title, api_id, api_provider, userId);
        if (duplicate) {
          return res.status(409).json({
            error: "Duplicate entry",
            message: `You've already added "${duplicate.title}" in ${duplicate.year}!`,
            existingEntry: duplicate
          });
        }
      }

      const entry = await EntryModel.create(req.body, userId);
      await ActivityModel.log(userId, "added", entry.id, entry.title, entry.type).catch(() => {});
      res.status(201).json(entry);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async quickRate(req, res) {
    try {
      const userId = req.user.id;
      const { rating } = req.body;
      if (rating === undefined || rating === null) {
        return res.status(400).json({ error: "rating is required" });
      }
      const entry = await EntryModel.quickRate(req.params.id, parseFloat(rating), userId);
      if (!entry) return res.status(404).json({ error: "Entry not found" });
      await ActivityModel.log(userId, "rated", entry.id, entry.title, entry.type, { rating }).catch(() => {});
      res.json(entry);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async addByImdb(req, res) {
    try {
      const userId = req.user.id;
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

      // Check for duplicates (skip if user confirmed with force flag)
      if (!req.body.force) {
        const duplicate = await EntryModel.checkDuplicate(details.title, imdbId, "imdb", userId);
        if (duplicate) {
          return res.status(409).json({
            error: "Duplicate entry",
            message: `You've already added "${duplicate.title}" in ${duplicate.year}!`,
            existingEntry: duplicate
          });
        }
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

      const entry = await EntryModel.create(entryData, userId);
      res.status(201).json(entry);
    } catch (error) {
      console.error("Error adding by IMDB:", error);
      res.status(500).json({ error: error.message });
    }
  }

  async update(req, res) {
    try {
      const userId = req.user.id;
      const { title, type } = req.body;

      if (!title || !type) {
        return res.status(400).json({ error: "Title and type are required" });
      }

      const entry = await EntryModel.update(req.params.id, req.body, userId);
      if (!entry) {
        return res.status(404).json({ error: "Entry not found" });
      }

      const action = req.body.status === "completed" ? "completed" : "updated";
      await ActivityModel.log(userId, action, entry.id, entry.title, entry.type).catch(() => {});
      res.json(entry);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async delete(req, res) {
    try {
      const userId = req.user.id;
      // Get entry title before deleting for activity log
      const entry = await EntryModel.findById(req.params.id, userId);
      const deleted = await EntryModel.delete(req.params.id, userId);
      if (!deleted) {
        return res.status(404).json({ error: "Entry not found" });
      }
      if (entry) {
        await ActivityModel.log(userId, "deleted", req.params.id, entry.title, entry.type).catch(() => {});
      }
      res.json({ message: "Entry deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getStatistics(req, res) {
    try {
      const userId = req.user.id;
      const yearParam = req.query.year ? parseInt(req.query.year) : null;
      const year = yearParam && !isNaN(yearParam) ? yearParam : null;
      const stats = await EntryModel.getStatistics(year, userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async checkDuplicate(req, res) {
    try {
      const userId = req.user.id;
      const { title, api_id, api_provider } = req.query;

      if (!title && !api_id) {
        return res.status(400).json({ error: "Title or api_id is required" });
      }

      const duplicate = await EntryModel.checkDuplicate(title, api_id, api_provider, userId);
      res.json({ isDuplicate: !!duplicate, entry: duplicate || null });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAvailableYears(req, res) {
    try {
      const userId = req.user.id;
      const years = await EntryModel.getAvailableYears(userId);
      res.json(years);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new EntryController();
