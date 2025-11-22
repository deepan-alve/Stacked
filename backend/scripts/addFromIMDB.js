import { fileURLToPath } from "url";
import { dirname, join } from "path";
import pkg from "sqlite3";
const { Database } = pkg.verbose();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, "..", "movies.db");

const IMDB_BASE_URL = "https://imdbapi.dev";

async function scrapeIMDBPage(imdbUrl) {
  try {
    const response = await fetch(imdbUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    const html = await response.text();

    // Extract title
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    let title = titleMatch
      ? titleMatch[1].replace(/ - IMDb$/, "").trim()
      : "Unknown";

    // Extract year from title (format: "Title (Year)")
    const yearMatch = title.match(/\((\d{4})\)/);
    const year = yearMatch ? yearMatch[1] : null;
    title = title.replace(/\s*\(\d{4}\).*$/, "").trim();

    // Extract poster
    const posterMatch = html.match(
      /<img[^>]+src="(https:\/\/m\.media-amazon\.com\/images\/M\/[^"]+)"/
    );
    const poster = posterMatch
      ? posterMatch[1].split("._V1_")[0] + "._V1_.jpg"
      : null;

    // Extract rating
    const ratingMatch = html.match(/"ratingValue":"([\d.]+)"/);
    const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;

    // Extract plot/description
    const plotMatch = html.match(/"description":"([^"]+)"/);
    const plot = plotMatch ? plotMatch[1] : null;

    // Extract type
    const typeMatch = html.match(/"@type":"([^"]+)"/);
    let type = "Movie";
    if (
      typeMatch &&
      (typeMatch[1].includes("Series") || typeMatch[1].includes("TV"))
    ) {
      type = "Series";
    }

    return {
      title,
      year,
      poster,
      rating,
      plot,
      type,
    };
  } catch (error) {
    console.error("Error scraping IMDB page:", error);
    throw error;
  }
}

async function getIMDBDetails(imdbId) {
  try {
    const cleanId = imdbId.replace(/^tt/, "");
    const response = await fetch(`${IMDB_BASE_URL}/title/tt${cleanId}`);

    if (!response.ok) {
      // Fallback to scraping if API fails
      console.log("API not available, falling back to web scraping...");
      return await scrapeIMDBPage(`https://www.imdb.com/title/tt${cleanId}/`);
    }

    const data = await response.json();
    return {
      title: data.title,
      year: data.year,
      poster: data.image || data.poster,
      rating: data.rating,
      plot: data.plot || data.plotSummary,
      type: data.type,
    };
  } catch (error) {
    console.error("Error fetching IMDB details:", error);
    throw error;
  }
}

async function addMovieFromIMDB(imdbUrl) {
  const imdbIdMatch = imdbUrl.match(/tt\d{7,}/);
  if (!imdbIdMatch) {
    console.error("Invalid IMDB URL");
    return;
  }

  const imdbId = imdbIdMatch[0];
  console.log(`Fetching details for ${imdbId}...`);

  const details = await getIMDBDetails(imdbId);

  console.log(`\nFound: ${details.title} (${details.year})`);
  console.log(`Type: ${details.type}`);
  console.log(`Rating: ${details.rating}/10`);
  console.log(`Plot: ${details.plot?.substring(0, 100)}...`);

  const db = new Database(DB_PATH);

  // Determine type
  let type = "Movie";
  if (
    details.type?.toLowerCase().includes("series") ||
    details.type?.toLowerCase().includes("tv")
  ) {
    type = "Series";
  }

  // Insert into database
  db.run(
    `INSERT INTO movies (title, type, rating, poster_url, api_id, api_provider, description, release_date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [
      details.title,
      type,
      details.rating || null,
      details.image || details.poster || null,
      imdbId,
      "imdb",
      details.plot || details.plotSummary || null,
      details.releaseDate || details.year || null,
    ],
    function (err) {
      if (err) {
        console.error("\n❌ Error adding to database:", err.message);
      } else {
        console.log(
          `\n✅ Successfully added "${details.title}" to database (ID: ${this.lastID})`
        );
      }
      db.close();
    }
  );
}

const imdbUrl = "https://www.imdb.com/title/tt37803840/";
addMovieFromIMDB(imdbUrl).catch(console.error);
