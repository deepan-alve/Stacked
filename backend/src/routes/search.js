import express from "express";
import searchController from "../controllers/searchController.js";

const router = express.Router();

// Search routes
router.get("/spotlight", searchController.spotlightSearch);
router.get("/movies", searchController.searchMovies);
router.get("/series", searchController.searchSeries);
router.get("/anime", searchController.searchAnime);
router.get("/books", searchController.searchBooks);
router.get("/imdb", searchController.searchIMDB);

// IMDB specific routes
router.get("/imdb/:imdbId", searchController.getIMDBDetails);
router.get("/imdb/top-rated", searchController.getTopRated);
router.get("/imdb/popular", searchController.getPopular);

// Details route
router.get("/:type/:id", searchController.getDetails);

export default router;
