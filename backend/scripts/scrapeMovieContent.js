import "dotenv/config";
import database from "../src/config/database.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OMDB_API_KEY = process.env.OMDB_API_KEY;

/**
 * Scrape Wikipedia page using Wikipedia API
 */
async function scrapeWikipedia(url) {
  try {
    // Extract page title from URL
    const urlParts = url.split("/wiki/");
    if (urlParts.length < 2) {
      throw new Error("Invalid Wikipedia URL");
    }
    const pageTitle = decodeURIComponent(urlParts[1]);

    console.log(`   📖 Scraping Wikipedia: ${pageTitle}`);

    // Get page content from Wikipedia API
    const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages|categories|info&exintro=false&explaintext=true&piprop=original&inprop=url&titles=${encodeURIComponent(
      pageTitle
    )}&format=json&origin=*`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0];
    const page = pages[pageId];

    if (pageId === "-1" || !page) {
      throw new Error("Wikipedia page not found");
    }

    // Get additional structured data (infobox, etc.)
    const infoboxUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=content&rvslots=main&titles=${encodeURIComponent(
      pageTitle
    )}&format=json&origin=*`;

    const infoboxResponse = await fetch(infoboxUrl);
    const infoboxData = await infoboxResponse.json();
    const infoboxPages = infoboxData.query.pages;
    const infoboxPageId = Object.keys(infoboxPages)[0];
    const wikitext =
      infoboxPages[infoboxPageId]?.revisions?.[0]?.slots?.main?.["*"] || "";

    // Extract infobox data (simplified)
    const infobox = extractInfobox(wikitext);

    // Get categories
    const categories =
      page.categories?.map((cat) => cat.title.replace("Category:", "")) || [];

    return {
      title: page.title,
      url: page.fullurl,
      extract: page.extract || "",
      full_text: page.extract || "",
      image: page.original?.source || null,
      categories: categories,
      infobox: infobox,
      page_id: pageId,
      scraped_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`   ❌ Wikipedia scrape failed: ${error.message}`);
    throw error;
  }
}

/**
 * Extract infobox data from Wikipedia wikitext (basic parsing)
 */
function extractInfobox(wikitext) {
  const infobox = {};

  // Look for infobox
  const infoboxMatch = wikitext.match(/\{\{Infobox[^\}]+\}\}/s);
  if (!infoboxMatch) return infobox;

  const infoboxText = infoboxMatch[0];

  // Extract key-value pairs (simplified)
  const lines = infoboxText.split("\n");
  for (const line of lines) {
    const match = line.match(/\|\s*([^=]+?)\s*=\s*(.+)/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/\[\[|\]\]|'{2,}/g, "");
      if (key && value) {
        infobox[key] = value;
      }
    }
  }

  return infobox;
}

/**
 * Scrape IMDb page using HTML scraping + OMDb API
 */
async function scrapeIMDb(url) {
  try {
    // Extract IMDb ID from URL
    const imdbIdMatch = url.match(/title\/(tt\d+)/);
    if (!imdbIdMatch) {
      throw new Error("Invalid IMDb URL");
    }
    const imdbId = imdbIdMatch[1];

    console.log(`   🎬 Scraping IMDb: ${imdbId}`);

    if (!OMDB_API_KEY) {
      throw new Error("OMDB_API_KEY is not configured");
    }

    // Get data from OMDb API
    const omdbUrl = `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${imdbId}&plot=full`;
    const omdbResponse = await fetch(omdbUrl);
    const omdbData = await omdbResponse.json();

    if (omdbData.Response === "False") {
      throw new Error(omdbData.Error || "IMDb data not found");
    }

    // Scrape additional data from IMDb HTML page
    const htmlResponse = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    const html = await htmlResponse.text();

    // Extract additional info from HTML (basic)
    const plotMatch = html.match(
      /<span[^>]*data-testid="plot-xl"[^>]*>([^<]+)<\/span>/
    );
    const fullPlot = plotMatch ? plotMatch[1] : omdbData.Plot;

    return {
      imdb_id: imdbId,
      title: omdbData.Title,
      url: url,
      year: omdbData.Year,
      rated: omdbData.Rated,
      released: omdbData.Released,
      runtime: omdbData.Runtime,
      genre: omdbData.Genre,
      director: omdbData.Director,
      writer: omdbData.Writer,
      actors: omdbData.Actors,
      plot: fullPlot,
      full_text: `${omdbData.Title} (${omdbData.Year}). ${fullPlot}. Directed by ${omdbData.Director}. Starring ${omdbData.Actors}.`,
      language: omdbData.Language,
      country: omdbData.Country,
      awards: omdbData.Awards,
      poster: omdbData.Poster !== "N/A" ? omdbData.Poster : null,
      ratings: omdbData.Ratings || [],
      imdb_rating: omdbData.imdbRating,
      imdb_votes: omdbData.imdbVotes,
      metascore: omdbData.Metascore,
      box_office: omdbData.BoxOffice,
      production: omdbData.Production,
      scraped_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`   ❌ IMDb scrape failed: ${error.message}`);
    throw error;
  }
}

/**
 * Parse the report file and extract movie links
 */
function parseReportFile() {
  const reportPath = path.join(__dirname, "..", "WIKI_IMDB_LINKS_REPORT.md");
  const reportContent = fs.readFileSync(reportPath, "utf-8");

  const movies = [];
  const lines = reportContent.split("\n");

  for (const line of lines) {
    // Match format: "1. Movie Name - URL"
    const match = line.match(/^(\d+)\.\s+(.+?)\s+-\s+(https?:\/\/[^\s]+)/);
    if (match) {
      const id = parseInt(match[1]);
      const title = match[2].trim();
      const url = match[3].trim();

      // Determine source type
      let sourceType;
      if (url.includes("wikipedia.org")) {
        sourceType = "wikipedia";
      } else if (url.includes("imdb.com")) {
        sourceType = "imdb";
      } else if (url.includes("youtube.com")) {
        sourceType = "other";
      } else {
        sourceType = "unknown";
      }

      movies.push({ id, title, url, sourceType });
    }
  }

  return movies;
}

/**
 * Scrape all movies and store in database
 */
async function scrapeAllContent() {
  await database.connect();

  console.log("🚀 Starting content scraper...\n");

  // Parse report file
  const movies = parseReportFile();
  console.log(`Found ${movies.length} movies to scrape\n`);

  let scraped = 0;
  let failed = 0;
  let skipped = 0;

  for (const movie of movies) {
    console.log(`[${movie.id}/${movies.length}] ${movie.title}`);

    // Skip non-Wikipedia/IMDb sources
    if (movie.sourceType !== "wikipedia" && movie.sourceType !== "imdb") {
      console.log(`   ⏭️  Skipping (unsupported source: ${movie.sourceType})`);
      skipped++;
      continue;
    }

    try {
      // Check if already scraped
      const existing = await database.get(
        "SELECT id FROM movie_content WHERE entry_id = ? AND scrape_status = 'success'",
        [movie.id]
      );

      if (existing) {
        console.log(`   ✅ Already scraped (skipping)`);
        skipped++;
        continue;
      }

      // Scrape based on source type
      let content;
      if (movie.sourceType === "wikipedia") {
        content = await scrapeWikipedia(movie.url);
      } else if (movie.sourceType === "imdb") {
        content = await scrapeIMDb(movie.url);
      }

      // Store in database
      await database.run(
        `INSERT OR REPLACE INTO movie_content 
         (entry_id, source_type, source_url, content, full_text, scrape_status, scraped_at)
         VALUES (?, ?, ?, ?, ?, 'success', ?)`,
        [
          movie.id,
          movie.sourceType,
          movie.url,
          JSON.stringify(content),
          content.full_text,
          new Date().toISOString(),
        ]
      );

      console.log(`   ✅ Scraped successfully`);
      scraped++;

      // Rate limiting - wait 1 second between requests
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}`);

      // Store error in database
      await database.run(
        `INSERT OR REPLACE INTO movie_content 
         (entry_id, source_type, source_url, scrape_status, scrape_error)
         VALUES (?, ?, ?, 'failed', ?)`,
        [movie.id, movie.sourceType, movie.url, error.message]
      );

      failed++;
    }
  }

  console.log("\n✅ Scraping complete!\n");
  console.log("📊 Summary:");
  console.log(`   - Successfully scraped: ${scraped}`);
  console.log(`   - Failed: ${failed}`);
  console.log(`   - Skipped: ${skipped}`);
  console.log(`   - Total: ${movies.length}`);

  await database.close();
}

// Run scraper
scrapeAllContent();
