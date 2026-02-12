import express from "express";
import GoalController from "../controllers/goalController.js";

const router = express.Router();

router.get("/", GoalController.getAll);
router.post("/", GoalController.create);
router.put("/:id", GoalController.update);
router.delete("/:id", GoalController.delete);

export default router;
