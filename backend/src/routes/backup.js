// Backup Routes - API endpoints for backup management
import express from "express";
import backupService from "../services/backupService.js";

const router = express.Router();

// Test Supabase connection
router.get("/test", async (req, res) => {
  try {
    const connected = await backupService.testConnection();
    res.json({
      success: connected,
      message: connected
        ? "Supabase connection successful"
        : "Connection failed",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Trigger manual sync
router.post("/sync", async (req, res) => {
  try {
    const result = await backupService.fullSync();
    res.json({
      success: true,
      message: "Sync completed successfully",
      ...result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get sync status
router.get("/status", async (req, res) => {
  try {
    const status = await backupService.getSyncStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Restore from Supabase
router.post("/restore", async (req, res) => {
  try {
    const result = await backupService.restoreFromSupabase();
    res.json({
      success: true,
      message: "Restore completed successfully",
      ...result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Git backup only
router.post("/git", async (req, res) => {
  try {
    const result = backupService.gitBackup();
    res.json({
      success: result.success,
      message: result.message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Start periodic sync
router.post("/start-periodic", async (req, res) => {
  try {
    const { intervalHours = 6 } = req.body;
    backupService.startPeriodicSync(intervalHours);
    res.json({
      success: true,
      message: `Periodic sync started (every ${intervalHours} hours)`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stop periodic sync
router.post("/stop-periodic", async (req, res) => {
  try {
    backupService.stopPeriodicSync();
    res.json({
      success: true,
      message: "Periodic sync stopped",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
