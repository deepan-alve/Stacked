/**
 * Movie Details Controller
 * Handles fetching and storing detailed information from Wikipedia and IMDB
 */

import database from "../config/database.js";
import { getWikipediaDetails } from "../services/wikipediaScraper.js";
import { getIMDBDetails } from "../services/imdbDetailsScraper.js";

/**
 * Fetch and store complete details for a movie
 */
export async function fetchMovieDetails(req, res) {
  try {
    const { id } = req.params;

    console.log(`Fetching details for movie ID: ${id}`);

    // Get movie entry
    const movie = await database.get("SELECT * FROM movies WHERE id = ?", [id]);

    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }

    // Check if we have api_id (IMDB ID)
    let imdbId = null;
    if (movie.api_id && movie.api_provider === "imdb") {
      imdbId = movie.api_id;
    }

    // Fetch Wikipedia details
    console.log("Fetching Wikipedia details...");
    const wikiData = await getWikipediaDetails(
      movie.title,
      movie.release_date?.substring(0, 4)
    );

    // Fetch IMDB details
    let imdbData = null;
    if (imdbId) {
      console.log("Fetching IMDB details...");
      imdbData = await getIMDBDetails(imdbId);
    }

    // Store in database
    const detailsData = {
      entry_id: id,
      wikipedia_url: wikiData?.url || null,
      wikipedia_summary: wikiData?.summary || null,
      wikipedia_plot: wikiData?.plot || null,
      wikipedia_cast: wikiData?.cast ? JSON.stringify(wikiData.cast) : null,
      wikipedia_crew: wikiData?.crew ? JSON.stringify(wikiData.crew) : null,
      wikipedia_infobox: wikiData?.infobox
        ? JSON.stringify(wikiData.infobox)
        : null,
      imdb_url: imdbData?.url || null,
      imdb_rating: imdbData?.rating || null,
      imdb_votes: imdbData?.votes || null,
      imdb_metascore: imdbData?.metascore || null,
      imdb_plot: imdbData?.plot || null,
      imdb_cast: imdbData?.cast ? JSON.stringify(imdbData.cast) : null,
      imdb_crew: imdbData?.crew ? JSON.stringify(imdbData.crew) : null,
      imdb_reviews: null, // Reviews feature for later
      imdb_awards: imdbData?.awards ? JSON.stringify(imdbData.awards) : null,
      imdb_trivia: imdbData?.trivia ? JSON.stringify(imdbData.trivia) : null,
      last_synced: new Date().toISOString(),
    };

    // Check if details already exist
    const existing = await database.get(
      "SELECT id FROM movie_details WHERE entry_id = ?",
      [id]
    );

    if (existing) {
      // Update existing
      const updateQuery = `
        UPDATE movie_details SET
          wikipedia_url = ?,
          wikipedia_summary = ?,
          wikipedia_plot = ?,
          wikipedia_cast = ?,
          wikipedia_crew = ?,
          wikipedia_infobox = ?,
          imdb_url = ?,
          imdb_rating = ?,
          imdb_votes = ?,
          imdb_metascore = ?,
          imdb_plot = ?,
          imdb_cast = ?,
          imdb_crew = ?,
          imdb_awards = ?,
          imdb_trivia = ?,
          last_synced = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE entry_id = ?
      `;

      await database.run(updateQuery, [
        detailsData.wikipedia_url,
        detailsData.wikipedia_summary,
        detailsData.wikipedia_plot,
        detailsData.wikipedia_cast,
        detailsData.wikipedia_crew,
        detailsData.wikipedia_infobox,
        detailsData.imdb_url,
        detailsData.imdb_rating,
        detailsData.imdb_votes,
        detailsData.imdb_metascore,
        detailsData.imdb_plot,
        detailsData.imdb_cast,
        detailsData.imdb_crew,
        detailsData.imdb_awards,
        detailsData.imdb_trivia,
        detailsData.last_synced,
        id,
      ]);

      console.log(`Updated details for movie ID ${id}`);
    } else {
      // Insert new
      const insertQuery = `
        INSERT INTO movie_details (
          entry_id, wikipedia_url, wikipedia_summary, wikipedia_plot,
          wikipedia_cast, wikipedia_crew, wikipedia_infobox,
          imdb_url, imdb_rating, imdb_votes, imdb_metascore,
          imdb_plot, imdb_cast, imdb_crew, imdb_awards, imdb_trivia,
          last_synced
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await database.run(insertQuery, [
        detailsData.entry_id,
        detailsData.wikipedia_url,
        detailsData.wikipedia_summary,
        detailsData.wikipedia_plot,
        detailsData.wikipedia_cast,
        detailsData.wikipedia_crew,
        detailsData.wikipedia_infobox,
        detailsData.imdb_url,
        detailsData.imdb_rating,
        detailsData.imdb_votes,
        detailsData.imdb_metascore,
        detailsData.imdb_plot,
        detailsData.imdb_cast,
        detailsData.imdb_crew,
        detailsData.imdb_awards,
        detailsData.imdb_trivia,
        detailsData.last_synced,
      ]);

      console.log(`Inserted details for movie ID ${id}`);
    }

    // Return the stored details
    const storedDetails = await database.get(
      "SELECT * FROM movie_details WHERE entry_id = ?",
      [id]
    );

    res.json({
      success: true,
      movie: movie.title,
      details: {
        ...storedDetails,
        wikipedia_cast: storedDetails.wikipedia_cast
          ? JSON.parse(storedDetails.wikipedia_cast)
          : null,
        wikipedia_crew: storedDetails.wikipedia_crew
          ? JSON.parse(storedDetails.wikipedia_crew)
          : null,
        wikipedia_infobox: storedDetails.wikipedia_infobox
          ? JSON.parse(storedDetails.wikipedia_infobox)
          : null,
        imdb_cast: storedDetails.imdb_cast
          ? JSON.parse(storedDetails.imdb_cast)
          : null,
        imdb_crew: storedDetails.imdb_crew
          ? JSON.parse(storedDetails.imdb_crew)
          : null,
        imdb_awards: storedDetails.imdb_awards
          ? JSON.parse(storedDetails.imdb_awards)
          : null,
        imdb_trivia: storedDetails.imdb_trivia
          ? JSON.parse(storedDetails.imdb_trivia)
          : null,
      },
    });
  } catch (error) {
    console.error("Error fetching movie details:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get stored details for a movie
 */
export async function getMovieDetails(req, res) {
  try {
    const { id } = req.params;

    const details = await database.get(
      "SELECT * FROM movie_details WHERE entry_id = ?",
      [id]
    );

    if (!details) {
      return res
        .status(404)
        .json({
          error: "Details not found. Use POST /api/details/:id to fetch.",
        });
    }

    // Parse JSON fields
    const parsedDetails = {
      ...details,
      wikipedia_cast: details.wikipedia_cast
        ? JSON.parse(details.wikipedia_cast)
        : null,
      wikipedia_crew: details.wikipedia_crew
        ? JSON.parse(details.wikipedia_crew)
        : null,
      wikipedia_infobox: details.wikipedia_infobox
        ? JSON.parse(details.wikipedia_infobox)
        : null,
      imdb_cast: details.imdb_cast ? JSON.parse(details.imdb_cast) : null,
      imdb_crew: details.imdb_crew ? JSON.parse(details.imdb_crew) : null,
      imdb_awards: details.imdb_awards ? JSON.parse(details.imdb_awards) : null,
      imdb_trivia: details.imdb_trivia ? JSON.parse(details.imdb_trivia) : null,
    };

    res.json({ details: parsedDetails });
  } catch (error) {
    console.error("Error getting movie details:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get all movies with their detail status
 */
export async function getAllMoviesWithDetailStatus(req, res) {
  try {
    const query = `
      SELECT 
        m.id,
        m.title,
        m.type,
        m.api_id,
        md.id as has_details,
        md.last_synced
      FROM movies m
      LEFT JOIN movie_details md ON m.id = md.entry_id
      ORDER BY m.title
    `;

    const movies = await database.all(query);

    const summary = {
      total: movies.length,
      with_details: movies.filter((m) => m.has_details).length,
      without_details: movies.filter((m) => !m.has_details).length,
    };

    res.json({
      summary,
      movies,
    });
  } catch (error) {
    console.error("Error getting movies with detail status:", error);
    res.status(500).json({ error: error.message });
  }
}

export default {
  fetchMovieDetails,
  getMovieDetails,
  getAllMoviesWithDetailStatus,
};
