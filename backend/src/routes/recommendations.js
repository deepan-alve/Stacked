import express from "express";
import RecommendationController from "../controllers/recommendationController.js";

const router = express.Router();

router.get("/", RecommendationController.getRecommendations);

export default router;
