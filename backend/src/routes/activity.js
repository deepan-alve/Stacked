import express from "express";
import ActivityController from "../controllers/activityController.js";

const router = express.Router();

router.get("/", ActivityController.getRecent);
router.get("/streak", ActivityController.getStreak);
router.get("/heatmap", ActivityController.getHeatmap);

export default router;
