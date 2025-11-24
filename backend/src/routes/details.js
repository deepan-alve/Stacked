/**
 * Details routes
 * Endpoints for fetching and managing movie details
 */

import express from "express";
import {
  fetchMovieDetails,
  getMovieDetails,
  getAllMoviesWithDetailStatus,
} from "../controllers/detailsController.js";

const router = express.Router();

// Get all movies with detail status
router.get("/status", getAllMoviesWithDetailStatus);

// Get stored details for a movie
router.get("/:id", getMovieDetails);

// Fetch and store details for a movie (scrapes Wikipedia and IMDB)
router.post("/:id", fetchMovieDetails);

export default router;
