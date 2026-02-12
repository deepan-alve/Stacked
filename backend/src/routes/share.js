import express from "express";
import ShareController from "../controllers/shareController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Public route - no auth needed
router.get("/:id/public", ShareController.getPublic);

// Protected routes
router.post("/", requireAuth, ShareController.create);
router.get("/", requireAuth, ShareController.getUserLinks);
router.delete("/:id", requireAuth, ShareController.delete);

export default router;
