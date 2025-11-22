import { fileURLToPath } from "url";
import { dirname, join } from "path";
import pkg from "sqlite3";
const { Database } = pkg.verbose();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, "..", "movies.db");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getIMDBPoster(imdbUrl) {
  try {
    const response = await fetch(imdbUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    const html = await response.text();

    // Extract poster URL from HTML
    const posterMatch = html.match(
      /<img[^>]+src="(https:\/\/m\.media-amazon\.com\/images\/M\/[^"]+)"/
    );

    if (posterMatch && posterMatch[1]) {
      // Clean up the URL to get high quality version
      let posterUrl = posterMatch[1].split("._V1_")[0] + "._V1_.jpg";
      return posterUrl;
    }
  } catch (error) {
    console.error(`Error fetching IMDB poster:`, error.message);
  }

  return null;
}

async function getYouTubeThumbnail(youtubeUrl) {
  // Extract video ID from URL
  const videoIdMatch = youtubeUrl.match(/[?&]v=([^&]+)/);
  if (videoIdMatch && videoIdMatch[1]) {
    const videoId = videoIdMatch[1];
    // YouTube max quality thumbnail
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }
  return null;
}

async function updateManualPosters() {
  const db = new Database(DB_PATH);

  const updates = [
    {
      title: "Don (2007)",
      imdbUrl: "https://www.imdb.com/title/tt1169270/",
    },
    {
      title: "Aval Ennaval",
      youtubeUrl: "https://www.youtube.com/watch?v=dhneSE3jWl4",
    },
    {
      title: "Seenu",
      imdbUrl: "https://www.imdb.com/title/tt14787854/",
    },
    {
      title: "Lovely",
      imdbUrl: "https://www.imdb.com/title/tt11448432/",
    },
    {
      title: "Chakravarthy",
      imdbUrl: "https://www.imdb.com/title/tt10699816/",
    },
    {
      title: "Bata Boy and Crocs Girl",
      imdbUrl: "https://www.imdb.com/title/tt35322891/",
    },
    {
      title: "Bale Pandiya",
      imdbUrl: "https://www.imdb.com/title/tt1539491/",
    },
    {
      title: "Chinna Mapillai",
      imdbUrl: "https://www.imdb.com/title/tt0317239/",
    },
  ];

  console.log("Updating manual poster corrections...\n");

  for (const update of updates) {
    console.log(`Updating "${update.title}"...`);

    let posterUrl = null;

    if (update.imdbUrl) {
      posterUrl = await getIMDBPoster(update.imdbUrl);
    } else if (update.youtubeUrl) {
      posterUrl = await getYouTubeThumbnail(update.youtubeUrl);
    }

    if (posterUrl) {
      // Try main title first
      await new Promise((resolve) => {
        db.run(
          `UPDATE movies SET poster_url = ?, api_provider = 'manual_correction' WHERE title = ?`,
          [posterUrl, update.title],
          function (err) {
            if (err) {
              console.error(`  ❌ Error: ${err.message}`);
            } else if (this.changes > 0) {
              console.log(`  ✅ Updated successfully`);
            } else if (update.altTitle) {
              // Try alternate title
              db.run(
                `UPDATE movies SET poster_url = ?, api_provider = 'manual_correction' WHERE title = ?`,
                [posterUrl, update.altTitle],
                function (err2) {
                  if (err2) {
                    console.error(`  ❌ Error with alt title: ${err2.message}`);
                  } else if (this.changes > 0) {
                    console.log(
                      `  ✅ Updated successfully (using alt title: ${update.altTitle})`
                    );
                  } else {
                    console.log(`  ⚠️  Movie not found in database`);
                  }
                }
              );
            } else {
              console.log(`  ⚠️  Movie not found in database`);
            }
            resolve();
          }
        );
      });
    } else {
      console.log(`  ❌ Could not fetch poster`);
    }

    await delay(1000);
  }

  db.close();
  console.log("\n✨ Manual updates complete!");
}

updateManualPosters().catch(console.error);
