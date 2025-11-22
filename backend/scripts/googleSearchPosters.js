import { fileURLToPath } from "url";
import { dirname, join } from "path";
import pkg from "sqlite3";
const { Database } = pkg.verbose();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, "..", "movies.db");

// Rate limiting
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Google Custom Search API (you need to add your API key)
const GOOGLE_API_KEY = "YOUR_GOOGLE_API_KEY"; // Get from: https://console.cloud.google.com/
const GOOGLE_CX = "YOUR_SEARCH_ENGINE_ID"; // Get from: https://programmablesearchengine.google.com/

async function searchPosterWithGoogle(movieTitle, type) {
  // Build search query
  const query = `${movieTitle} official poster site:movieposterdb.com OR site:imdb.com OR site:themoviedb.org`;

  try {
    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${encodeURIComponent(
        query
      )}&searchType=image&num=5`
    );

    const data = await response.json();

    if (data.items && data.items.length > 0) {
      // Try to find the best match
      for (const item of data.items) {
        // Prefer certain sources
        if (
          item.link &&
          (item.link.includes("movieposterdb.com") ||
            item.link.includes("themoviedb.org") ||
            item.link.includes("imdb.com"))
        ) {
          return {
            poster_url: item.link,
            api_provider: "google_search",
            matched_title: movieTitle,
            source: item.displayLink,
          };
        }
      }

      // If no preferred source, use first result
      return {
        poster_url: data.items[0].link,
        api_provider: "google_search",
        matched_title: movieTitle,
        source: data.items[0].displayLink,
      };
    }
  } catch (error) {
    console.error(`Google Search error for "${movieTitle}":`, error.message);
  }

  return null;
}

// Alternative: Direct IMDB/TMDB search without Google API
async function searchIMDBPoster(movieTitle) {
  const cleanTitle = movieTitle.replace(/[^\w\s]/g, "").replace(/\s+/g, "+");

  try {
    // Search IMDB
    const searchUrl = `https://www.imdb.com/find?q=${cleanTitle}&s=tt&ttype=ft`;
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    const html = await response.text();

    // Try to extract poster URL from HTML (basic regex)
    const posterMatch = html.match(
      /<img[^>]+src="(https:\/\/m\.media-amazon\.com\/images\/M\/[^"]+)"/
    );

    if (posterMatch && posterMatch[1]) {
      // Clean up the URL (remove size parameters to get original)
      let posterUrl = posterMatch[1].split("._V1_")[0] + "._V1_.jpg";

      return {
        poster_url: posterUrl,
        api_provider: "imdb_direct",
        matched_title: movieTitle,
      };
    }
  } catch (error) {
    console.error(`IMDB search error for "${movieTitle}":`, error.message);
  }

  return null;
}

async function searchWithMultipleSources(movieTitle, type) {
  console.log(`  → Trying Google Custom Search...`);

  // Only try Google if API key is configured
  if (GOOGLE_API_KEY !== "YOUR_GOOGLE_API_KEY") {
    const googleResult = await searchPosterWithGoogle(movieTitle, type);
    if (googleResult && googleResult.poster_url) {
      return googleResult;
    }
    await delay(1000);
  }

  // Try direct IMDB scraping for movies
  if (type === "Movie") {
    console.log(`  → Trying IMDB direct search...`);
    const imdbResult = await searchIMDBPoster(movieTitle);
    if (imdbResult && imdbResult.poster_url) {
      return imdbResult;
    }
  }

  return null;
}

async function googleSearchPosters() {
  const db = new Database(DB_PATH);

  return new Promise((resolve, reject) => {
    // Get entries without posters
    db.all(
      'SELECT id, title, type FROM movies WHERE poster_url IS NULL OR poster_url = ""',
      async (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        console.log(`Found ${rows.length} entries without posters\n`);

        if (GOOGLE_API_KEY === "YOUR_GOOGLE_API_KEY") {
          console.log("⚠️  WARNING: Google API key not configured!");
          console.log("To use Google Custom Search:");
          console.log("1. Get API key from: https://console.cloud.google.com/");
          console.log(
            "2. Create search engine at: https://programmablesearchengine.google.com/"
          );
          console.log(
            "3. Update GOOGLE_API_KEY and GOOGLE_CX in this script\n"
          );
          console.log(
            "Falling back to IMDB direct search for movies only...\n"
          );
        }

        let updated = 0;
        let failed = 0;

        for (const row of rows) {
          console.log(
            `[${row.id}] Searching for "${row.title}" (${row.type})...`
          );

          const apiData = await searchWithMultipleSources(row.title, row.type);

          if (apiData && apiData.poster_url) {
            // Update the database
            await new Promise((resolve) => {
              db.run(
                `UPDATE movies 
               SET poster_url = ?, api_provider = ? 
               WHERE id = ?`,
                [apiData.poster_url, apiData.api_provider, row.id],
                (err) => {
                  if (err) {
                    console.error(`  ❌ Failed to update: ${err.message}`);
                    failed++;
                  } else {
                    console.log(
                      `  ✅ Found poster from ${apiData.api_provider}${
                        apiData.source ? ` (${apiData.source})` : ""
                      }`
                    );
                    updated++;
                  }
                  resolve();
                }
              );
            });
          } else {
            console.log(`  ⚠️  No poster found`);
            failed++;
          }

          // Rate limiting - wait 2 seconds between requests to be respectful
          await delay(2000);
        }

        console.log("\n=== Google Search Complete ===");
        console.log(`✅ Updated: ${updated}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`📊 Total Attempted: ${rows.length}`);

        db.close();
        resolve();
      }
    );
  });
}

// Run the script
console.log("Searching for posters using Google Search...\n");
googleSearchPosters()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
