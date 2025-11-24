/**
 * Bulk scraper script
 * Fetches Wikipedia and IMDB details for all movies in the database
 */

import database from "../src/config/database.js";
import { getWikipediaDetails } from "../src/services/wikipediaScraper.js";
import { getIMDBDetails } from "../src/services/imdbDetailsScraper.js";
import googleSearchService from "../src/services/googleSearch.js";

// Configuration
const BATCH_SIZE = 5; // Process 5 movies at a time
const DELAY_BETWEEN_BATCHES = 5000; // 5 seconds delay between batches
const DELAY_BETWEEN_MOVIES = 2000; // 2 seconds delay between movies

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Process a single movie
 */
async function processMovie(movie) {
  try {
    console.log(`\n[${movie.id}] Processing: ${movie.title}`);

    // Check if details already exist
    const existing = await database.get(
      "SELECT id, last_synced FROM movie_details WHERE entry_id = ?",
      [movie.id]
    );

    if (existing?.last_synced) {
      const lastSynced = new Date(existing.last_synced);
      const daysSince =
        (Date.now() - lastSynced.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSince < 7) {
        console.log(
          `  ⏭️  Skipping - details synced ${Math.floor(daysSince)} days ago`
        );
        return { status: "skipped", movie: movie.title };
      }
    }

    // Get IMDB ID if available
    let imdbId = null;
    if (movie.api_id && movie.api_provider === "imdb") {
      imdbId = movie.api_id;
    }

    // Fetch Wikipedia details
    console.log("  📖 Fetching Wikipedia...");
    const wikiData = await getWikipediaDetails(
      movie.title,
      movie.release_date?.substring(0, 4)
    );

    if (wikiData) {
      console.log(`  ✅ Wikipedia: Found`);
    } else {
      console.log(`  ⚠️  Wikipedia: Not found`);
    }

    await sleep(1000); // Small delay between services

    // If no IMDB ID, search for it
    if (!imdbId) {
      console.log("  🔍 Searching IMDB...");
      const searchQuery = movie.release_date
        ? `${movie.title} ${movie.release_date.substring(0, 4)}`
        : movie.title;
      const searchResults = await googleSearchService.searchIMDB(searchQuery);

      if (searchResults && searchResults.length > 0) {
        // Get the first result
        const firstResult = searchResults[0];

        // Verify title similarity (basic match)
        const titleMatch =
          firstResult.title
            .toLowerCase()
            .includes(movie.title.toLowerCase().substring(0, 10)) ||
          movie.title
            .toLowerCase()
            .includes(firstResult.title.toLowerCase().substring(0, 10));

        if (titleMatch) {
          imdbId = firstResult.imdbId;
          console.log(`  ✅ Found IMDB: ${firstResult.title} (${imdbId})`);

          // Update the movie entry with IMDB ID
          await database.run(
            "UPDATE movies SET api_id = ?, api_provider = ? WHERE id = ?",
            [imdbId, "imdb", movie.id]
          );
        } else {
          console.log(
            `  ⚠️  IMDB search result doesn't match: "${firstResult.title}" vs "${movie.title}"`
          );
        }
      } else {
        console.log(`  ⚠️  No IMDB results found`);
      }

      await sleep(1000);
    }

    // Fetch IMDB details
    let imdbData = null;
    if (imdbId) {
      console.log("  🎬 Fetching IMDB details...");
      imdbData = await getIMDBDetails(imdbId);

      if (imdbData) {
        console.log(
          `  ✅ IMDB: Rating ${imdbData.rating || "N/A"}, ${
            imdbData.cast?.length || 0
          } cast members`
        );
      } else {
        console.log(`  ⚠️  IMDB: Failed to fetch details`);
      }
    } else {
      console.log(`  ⏭️  IMDB: Could not find matching entry`);
    }

    // Store in database
    const detailsData = {
      entry_id: movie.id,
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
      imdb_awards: imdbData?.awards ? JSON.stringify(imdbData.awards) : null,
      imdb_trivia: imdbData?.trivia ? JSON.stringify(imdbData.trivia) : null,
      last_synced: new Date().toISOString(),
    };

    if (existing) {
      // Update
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
        movie.id,
      ]);

      console.log(`  💾 Updated details in database`);
    } else {
      // Insert
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

      console.log(`  💾 Inserted details into database`);
    }

    return { status: "success", movie: movie.title };
  } catch (error) {
    console.error(`  ❌ Error processing ${movie.title}:`, error.message);
    return { status: "error", movie: movie.title, error: error.message };
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log("🚀 Starting bulk scraping script...\n");

    // Connect to database
    await database.connect();

    // Get all movies
    const movies = await database.all("SELECT * FROM movies ORDER BY id");
    console.log(`📊 Found ${movies.length} movies in database\n`);

    // Process in batches
    const results = {
      success: 0,
      skipped: 0,
      error: 0,
      errors: [],
    };

    for (let i = 0; i < movies.length; i += BATCH_SIZE) {
      const batch = movies.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(movies.length / BATCH_SIZE);

      console.log(
        `\n📦 Batch ${batchNum}/${totalBatches} (Movies ${i + 1}-${Math.min(
          i + BATCH_SIZE,
          movies.length
        )})`
      );
      console.log("=".repeat(60));

      for (const movie of batch) {
        const result = await processMovie(movie);

        if (result.status === "success") {
          results.success++;
        } else if (result.status === "skipped") {
          results.skipped++;
        } else if (result.status === "error") {
          results.error++;
          results.errors.push({ movie: result.movie, error: result.error });
        }

        // Delay between movies
        if (movie !== batch[batch.length - 1]) {
          await sleep(DELAY_BETWEEN_MOVIES);
        }
      }

      // Delay between batches
      if (i + BATCH_SIZE < movies.length) {
        console.log(
          `\n⏸️  Waiting ${
            DELAY_BETWEEN_BATCHES / 1000
          } seconds before next batch...`
        );
        await sleep(DELAY_BETWEEN_BATCHES);
      }
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 SUMMARY");
    console.log("=".repeat(60));
    console.log(`✅ Success: ${results.success}`);
    console.log(`⏭️  Skipped: ${results.skipped}`);
    console.log(`❌ Errors:  ${results.error}`);
    console.log(`📈 Total:   ${movies.length}`);

    if (results.errors.length > 0) {
      console.log("\n❌ ERRORS:");
      results.errors.forEach((err) => {
        console.log(`  - ${err.movie}: ${err.error}`);
      });
    }

    console.log("\n✨ Bulk scraping complete!\n");

    // Close database
    await database.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Fatal error:", error);
    await database.close();
    process.exit(1);
  }
}

// Run the script
main();
