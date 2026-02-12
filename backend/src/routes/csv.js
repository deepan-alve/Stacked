import express from "express";
import CsvController from "../controllers/csvController.js";

const router = express.Router();

router.get("/export", CsvController.exportCsv);
router.post("/import", CsvController.importCsv);

export default router;
