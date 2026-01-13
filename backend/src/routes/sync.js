import express from "express";
import { requireAuth } from "../middleware/auth.js";
import gitSyncService from "../services/gitSyncService.js";

const router = express.Router();

/**
 * POST /api/sync/push
 * Push database to GitHub
 */
router.post("/push", requireAuth, async (req, res) => {
  try {
    const result = await gitSyncService.syncToGitHub();
    res.json(result);
  } catch (error) {
    console.error("[Sync] Push error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/sync/pull
 * Pull database from GitHub
 */
router.post("/pull", requireAuth, async (req, res) => {
  try {
    const result = await gitSyncService.syncFromGitHub();
    res.json(result);
  } catch (error) {
    console.error("[Sync] Pull error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/sync/export
 * Export database as JSON (download)
 */
router.get("/export", requireAuth, async (req, res) => {
  try {
    const data = await gitSyncService.exportData();
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename=stacked-export-${Date.now()}.json`);
    res.json(data);
  } catch (error) {
    console.error("[Sync] Export error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/sync/import
 * Import database from JSON
 */
router.post("/import", requireAuth, async (req, res) => {
  try {
    const data = req.body;
    if (!data || !data.movies) {
      return res.status(400).json({ success: false, message: "Invalid import data" });
    }
    const result = await gitSyncService.importData(data);
    res.json(result);
  } catch (error) {
    console.error("[Sync] Import error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
