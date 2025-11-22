import { fileURLToPath } from "url";
import { dirname, join } from "path";
import pkg from "sqlite3";
const { Database } = pkg.verbose();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, "..", "movies.db");

// TMDB Configuration
const TMDB_API_KEY = "***REMOVED_TMDB_KEY***";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

// AniList GraphQL endpoint
const ANILIST_API_URL = "https://graphql.anilist.co";

// Open Library
const OPENLIBRARY_BASE_URL = "https://openlibrary.org";
const OPENLIBRARY_COVERS_URL = "https://covers.openlibrary.org/b";

// Rate limiting
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function searchTMDBMovie(title) {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
        title
      )}`
    );
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const movie = data.results[0];
      return {
        poster_url: movie.poster_path
          ? `${TMDB_IMAGE_BASE}${movie.poster_path}`
          : null,
        api_id: movie.id.toString(),
        api_provider: "tmdb",
        description: movie.overview || null,
        release_date: movie.release_date || null,
      };
    }
  } catch (error) {
    console.error(`TMDB Movie error for "${title}":`, error.message);
  }
  return null;
}

async function searchTMDBSeries(title) {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
        title
      )}`
    );
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const series = data.results[0];
      return {
        poster_url: series.poster_path
          ? `${TMDB_IMAGE_BASE}${series.poster_path}`
          : null,
        api_id: series.id.toString(),
        api_provider: "tmdb",
        description: series.overview || null,
        release_date: series.first_air_date || null,
      };
    }
  } catch (error) {
    console.error(`TMDB Series error for "${title}":`, error.message);
  }
  return null;
}

async function searchAniList(title) {
  const query = `
    query ($search: String) {
      Page(page: 1, perPage: 1) {
        media(search: $search, type: ANIME) {
          id
          title {
            romaji
            english
          }
          coverImage {
            large
          }
          description
          startDate {
            year
            month
            day
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(ANILIST_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query,
        variables: { search: title },
      }),
    });

    const data = await response.json();
    if (data.data?.Page?.media?.[0]) {
      const anime = data.data.Page.media[0];
      return {
        poster_url: anime.coverImage.large || null,
        api_id: anime.id.toString(),
        api_provider: "anilist",
        description: anime.description
          ? anime.description.replace(/<[^>]*>/g, "")
          : null,
        release_date: anime.startDate?.year
          ? `${anime.startDate.year}-${anime.startDate.month || 1}-${
              anime.startDate.day || 1
            }`
          : null,
      };
    }
  } catch (error) {
    console.error(`AniList error for "${title}":`, error.message);
  }
  return null;
}

async function searchOpenLibrary(title) {
  try {
    const response = await fetch(
      `${OPENLIBRARY_BASE_URL}/search.json?q=${encodeURIComponent(
        title
      )}&limit=1`
    );
    const data = await response.json();

    if (data.docs && data.docs.length > 0) {
      const book = data.docs[0];
      return {
        poster_url: book.cover_i
          ? `${OPENLIBRARY_COVERS_URL}/id/${book.cover_i}-L.jpg`
          : null,
        api_id: book.key || null,
        api_provider: "openlibrary",
        description: book.first_sentence ? book.first_sentence[0] : null,
        release_date: book.first_publish_year
          ? `${book.first_publish_year}-01-01`
          : null,
      };
    }
  } catch (error) {
    console.error(`Open Library error for "${title}":`, error.message);
  }
  return null;
}

async function backfillPosters() {
  const db = new Database(DB_PATH);

  return new Promise((resolve, reject) => {
    db.all(
      "SELECT id, title, type, poster_url FROM movies",
      async (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        console.log(`Found ${rows.length} entries in database`);
        let updated = 0;
        let skipped = 0;
        let failed = 0;

        for (const row of rows) {
          // Skip if already has poster
          if (row.poster_url) {
            skipped++;
            console.log(
              `[${row.id}] ${row.title} - Already has poster, skipping`
            );
            continue;
          }

          console.log(
            `[${row.id}] Fetching poster for "${row.title}" (${row.type})...`
          );

          let apiData = null;

          // Search based on type
          switch (row.type) {
            case "Movie":
              apiData = await searchTMDBMovie(row.title);
              break;
            case "Series":
              apiData = await searchTMDBSeries(row.title);
              break;
            case "Anime":
              apiData = await searchAniList(row.title);
              break;
            case "Book":
              apiData = await searchOpenLibrary(row.title);
              break;
          }

          if (apiData && apiData.poster_url) {
            // Update the database
            await new Promise((resolve) => {
              db.run(
                `UPDATE movies 
               SET poster_url = ?, api_id = ?, api_provider = ?, description = ?, release_date = ? 
               WHERE id = ?`,
                [
                  apiData.poster_url,
                  apiData.api_id,
                  apiData.api_provider,
                  apiData.description,
                  apiData.release_date,
                  row.id,
                ],
                (err) => {
                  if (err) {
                    console.error(`  ❌ Failed to update: ${err.message}`);
                    failed++;
                  } else {
                    console.log(
                      `  ✅ Updated with poster from ${apiData.api_provider}`
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

          // Rate limiting - wait 250ms between requests
          await delay(250);
        }

        console.log("\n=== Backfill Complete ===");
        console.log(`✅ Updated: ${updated}`);
        console.log(`⏭️  Skipped: ${skipped}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`📊 Total: ${rows.length}`);

        db.close();
        resolve();
      }
    );
  });
}

// Run the script
console.log("Starting poster backfill...\n");
backfillPosters()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
