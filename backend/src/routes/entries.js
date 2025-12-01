import express from "express";
import EntryController from "../controllers/entryController.js";

const router = express.Router();

// Get all entries
router.get("/", EntryController.getAll);

// Get statistics
router.get("/stats", EntryController.getStatistics);

// Get single entry
router.get("/:id", EntryController.getById);

// Create entry
router.post("/", EntryController.create);

// Add entry by IMDB ID
router.post("/add-by-imdb", EntryController.addByImdb);

// Update entry
router.put("/:id", EntryController.update);

// Delete entry
router.delete("/:id", EntryController.delete);

export default router;
