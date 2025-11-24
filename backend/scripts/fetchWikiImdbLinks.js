import database from "../src/config/database.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Fetch Wikipedia page for a title
 * Uses Wikipedia API to search and get page info with proper URLs
 */
async function searchWikipedia(title, type, releaseDate) {
  try {
    const year = releaseDate ? releaseDate.split("-")[0] : "";

    // Add disambiguation hints based on type
    let searchTerm = title;
    if (type === "Movie") {
      searchTerm = `${title} ${year} film`;
    } else if (type === "Series") {
      searchTerm = `${title} ${year} TV series`;
    } else if (type === "Anime") {
      searchTerm = `${title} anime`;
    } else if (type === "Book") {
      searchTerm = `${title} ${year} book`;
    }

    // Search Wikipedia using opensearch
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(
      searchTerm
    )}&limit=5&format=json`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (searchData[1].length === 0) {
      // Try without year/type hint
      const retryUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(
        title
      )}&limit=5&format=json`;
      const retryResponse = await fetch(retryUrl);
      const retryData = await retryResponse.json();

      if (retryData[1].length === 0) {
        return null;
      }

      return await getWikipediaDetails(
        retryData[1][0],
        retryData[3][0],
        title,
        year
      );
    }

    // Get the first result (most likely match)
    const pageTitle = searchData[1][0];
    const pageUrl = searchData[3][0];

    return await getWikipediaDetails(pageTitle, pageUrl, title, year);
  } catch (error) {
    console.error(`Error fetching Wikipedia for "${title}":`, error.message);
    return null;
  }
}

/**
 * Get detailed Wikipedia page info including image
 */
async function getWikipediaDetails(pageTitle, pageUrl, originalTitle, year) {
  try {
    // Get page details including image and extract
    const detailsUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(
      pageTitle
    )}&prop=pageimages|extracts|info&pithumbsize=500&exintro=1&explaintext=1&inprop=url&format=json&origin=*`;

    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();

    const pages = detailsData.query.pages;
    const pageId = Object.keys(pages)[0];
    const pageInfo = pages[pageId];

    return {
      url: pageUrl, // Use the URL from opensearch (it's the proper full URL)
      title: pageTitle,
      image: pageInfo.thumbnail?.source || null,
      extract: pageInfo.extract || null, // Short description/intro
      confidence: calculateConfidence(originalTitle, pageTitle, year, pageUrl),
    };
  } catch (error) {
    console.error(`Error getting Wikipedia details:`, error.message);
    return {
      url: pageUrl,
      title: pageTitle,
      image: null,
      extract: null,
      confidence: 0.5,
    };
  }
}

/**
 * Search IMDb using OMDb API
 * Gets actual IMDb data with ID, rating, poster, etc.
 */
async function searchIMDb(title, type, releaseDate) {
  try {
    const OMDB_API_KEY = "9059d346";
    const searchTerm = encodeURIComponent(title);
    const year = releaseDate ? releaseDate.split("-")[0] : "";

    // Determine OMDb type parameter
    let omdbType = "";
    if (type === "Movie") omdbType = "movie";
    else if (type === "Series" || type === "Anime") omdbType = "series";
    // Books don't exist in OMDb, skip
    else if (type === "Book") return null;

    // Search OMDb by title
    const searchUrl = `http://www.omdbapi.com/?apikey=${OMDB_API_KEY}&t=${searchTerm}${
      year ? `&y=${year}` : ""
    }${omdbType ? `&type=${omdbType}` : ""}`;

    const response = await fetch(searchUrl);
    const data = await response.json();

    if (data.Response === "False") {
      // Try without year if first search failed
      if (year) {
        const retryUrl = `http://www.omdbapi.com/?apikey=${OMDB_API_KEY}&t=${searchTerm}${
          omdbType ? `&type=${omdbType}` : ""
        }`;
        const retryResponse = await fetch(retryUrl);
        const retryData = await retryResponse.json();

        if (retryData.Response === "False") {
          return null;
        }

        return parseOMDbResponse(retryData, title);
      }
      return null;
    }

    return parseOMDbResponse(data, title);
  } catch (error) {
    console.error(`Error searching IMDb for "${title}":`, error.message);
    return null;
  }
}

/**
 * Parse OMDb API response into our format
 */
function parseOMDbResponse(data, originalTitle) {
  const imdbId = data.imdbID;
  const imdbUrl = `https://www.imdb.com/title/${imdbId}/`;

  // Calculate confidence based on title match
  let confidence = 0.5;
  if (data.Title.toLowerCase() === originalTitle.toLowerCase()) {
    confidence = 0.9;
  } else if (
    data.Title.toLowerCase().includes(originalTitle.toLowerCase()) ||
    originalTitle.toLowerCase().includes(data.Title.toLowerCase())
  ) {
    confidence = 0.7;
  }

  // Add confidence for having good data
  if (data.Poster && data.Poster !== "N/A") confidence += 0.1;
  if (data.imdbRating && data.imdbRating !== "N/A") confidence += 0.1;

  return {
    url: imdbUrl,
    title: data.Title,
    id: imdbId,
    image: data.Poster !== "N/A" ? data.Poster : null,
    rating: data.imdbRating !== "N/A" ? parseFloat(data.imdbRating) : null,
    votes:
      data.imdbVotes !== "N/A"
        ? parseInt(data.imdbVotes.replace(/,/g, ""))
        : null,
    year: data.Year,
    plot: data.Plot !== "N/A" ? data.Plot : null,
    confidence: Math.min(confidence, 1.0),
  };
}

/**
 * Calculate confidence score for a match
 */
function calculateConfidence(originalTitle, foundTitle, year, url) {
  let confidence = 0.5;

  // Exact title match
  if (originalTitle.toLowerCase() === foundTitle.toLowerCase()) {
    confidence += 0.3;
  }

  // Partial title match
  if (
    foundTitle.toLowerCase().includes(originalTitle.toLowerCase()) ||
    originalTitle.toLowerCase().includes(foundTitle.toLowerCase())
  ) {
    confidence += 0.2;
  }

  // Year in title
  if (year && foundTitle.includes(year)) {
    confidence += 0.2;
  }

  // Valid URL format
  if (url && (url.includes("wikipedia.org") || url.includes("imdb.com"))) {
    confidence += 0.1;
  }

  return Math.min(confidence, 1.0);
}

/**
 * Compare images (placeholder - needs actual implementation)
 */
function compareImages(dbPosterUrl, wikiImageUrl, imdbImageUrl) {
  // This would need an image comparison library like pixelmatch or opencv
  // For now, just check if URLs are similar or return false
  return false;
}

/**
 * Score data completeness for a source
 * Returns a score out of 100 based on how much information is available
 */
function scoreDataCompleteness(source, type) {
  let score = 0;

  if (!source) return 0;

  // Has URL (required)
  if (source.url) score += 20;

  // Has title match
  if (source.title) score += 10;

  // Has image/poster
  if (source.image) score += 25;

  // Confidence in match
  if (source.confidence) {
    score += source.confidence * 30; // Up to 30 points for confidence
  }

  // Additional data (Wikipedia has more narrative content, IMDb has ratings)
  if (type === "wikipedia") {
    // Wikipedia typically has better plot summaries and cast info
    score += 15;
  } else if (type === "imdb") {
    // IMDb has ratings and votes which are valuable
    if (source.rating) score += 10;
    if (source.votes) score += 5;
  }

  return Math.min(score, 100);
}

/**
 * Choose the best source between Wikipedia and IMDb
 * Returns 'wikipedia', 'imdb', or 'both' based on data quality
 */
function chooseBestSource(wikiData, imdbData) {
  const wikiScore = scoreDataCompleteness(wikiData, "wikipedia");
  const imdbScore = scoreDataCompleteness(imdbData, "imdb");

  // If scores are close (within 15 points), use both
  if (
    Math.abs(wikiScore - imdbScore) < 15 &&
    wikiScore > 50 &&
    imdbScore > 50
  ) {
    return {
      choice: "both",
      wikiScore,
      imdbScore,
      reason: "Both sources have good data",
    };
  }

  // Choose the better one
  if (wikiScore > imdbScore) {
    return {
      choice: "wikipedia",
      wikiScore,
      imdbScore,
      reason:
        wikiScore > 70
          ? "Wikipedia has excellent data"
          : "Wikipedia has better data",
    };
  } else if (imdbScore > wikiScore) {
    return {
      choice: "imdb",
      wikiScore,
      imdbScore,
      reason:
        imdbScore > 70 ? "IMDb has excellent data" : "IMDb has better data",
    };
  }

  // Both scores are low or equal
  return {
    choice: wikiScore > 0 ? "wikipedia" : "imdb",
    wikiScore,
    imdbScore,
    reason: "Limited data available, using best available",
  };
}

/**
 * Main function to fetch Wikipedia links (with IMDb fallback)
 */
async function fetchAllWikiLinks() {
  await database.connect();

  console.log("🔍 Fetching Wikipedia links (IMDb fallback when needed)...\n");

  // Get all movies from database
  const entries = await database.all(
    "SELECT id, title, type, release_date, poster_url FROM movies ORDER BY id"
  );

  console.log(`Found ${entries.length} entries to process\n`);

  const results = [];
  let processed = 0;

  for (const entry of entries) {
    processed++;
    console.log(`[${processed}/${entries.length}] Processing: ${entry.title}`);

    // Fetch Wikipedia first
    const wikiData = await searchWikipedia(
      entry.title,
      entry.type,
      entry.release_date
    );

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Only fetch IMDb if Wikipedia is NOT found
    let imdbData = null;
    let usedSource = "wikipedia";

    if (!wikiData) {
      console.log(`   ⚠️ No Wikipedia found, trying IMDb...`);
      imdbData = await searchIMDb(entry.title, entry.type, entry.release_date);
      usedSource = "imdb";
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    // Store only ONE link - Wikipedia if available, otherwise IMDb
    const result = {
      id: entry.id,
      title: entry.title,
      type: entry.type,
      release_date: entry.release_date,
      db_poster: entry.poster_url,
      source_type: null,
      url: null,
      source_title: null,
      image: null,
      confidence: null,
      imdb_id: null,
    };

    if (wikiData) {
      // Use Wikipedia
      result.source_type = "wikipedia";
      result.url = wikiData.url;
      result.source_title = wikiData.title;
      result.image = wikiData.image;
      result.confidence = wikiData.confidence;
    } else if (imdbData) {
      // Use IMDb as fallback
      result.source_type = "imdb";
      result.url = imdbData.url;
      result.source_title = imdbData.title;
      result.image = imdbData.image;
      result.confidence = imdbData.confidence;
      result.imdb_id = imdbData.id;
    }

    results.push(result);

    // Small delay between entries
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return results;
}

/**
 * Generate markdown report - Simple format
 */
function generateMarkdownReport(results) {
  let markdown = "# Wikipedia & IMDb Links Report\n\n";
  markdown += `Generated: ${new Date().toLocaleString()}\n`;
  markdown += `Total: ${results.length} entries\n\n`;

  // Summary
  const withWiki = results.filter((r) => r.source_type === "wikipedia").length;
  const withImdb = results.filter((r) => r.source_type === "imdb").length;
  const noSource = results.filter((r) => !r.source_type).length;

  markdown += `✅ Wikipedia: ${withWiki} | 🔄 IMDb: ${withImdb} | ❌ None: ${noSource}\n\n`;
  markdown += "---\n\n";

  // Simple list format
  for (const result of results) {
    if (result.url) {
      markdown += `${result.id}. ${result.title} - ${result.url}\n`;
    } else {
      markdown += `${result.id}. ${result.title} - ❌ No link found\n`;
    }
  }

  return markdown;
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log("🚀 Starting Wikipedia/IMDb link fetcher...\n");

    const results = await fetchAllWikiLinks();

    console.log("\n✅ Fetching complete!\n");
    console.log("📝 Generating report...\n");

    const markdown = generateMarkdownReport(results);

    // Save to file
    const outputPath = path.join(__dirname, "..", "WIKI_IMDB_LINKS_REPORT.md");
    fs.writeFileSync(outputPath, markdown, "utf-8");

    console.log(`✅ Report saved to: WIKI_IMDB_LINKS_REPORT.md`);
    const wikiCount = results.filter(
      (r) => r.source_type === "wikipedia"
    ).length;
    const imdbCount = results.filter((r) => r.source_type === "imdb").length;
    const noneCount = results.filter((r) => !r.source_type).length;

    console.log("\n📊 Summary:");
    console.log(`   - Total entries processed: ${results.length}`);
    console.log(`   - ✅ Wikipedia: ${wikiCount}`);
    console.log(`   - 🔄 IMDb (fallback): ${imdbCount}`);
    console.log(`   - ❌ No source: ${noneCount}`);
    console.log("\n✨ Please review the report!\n");

    await database.close();
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

// Run if called directly
main();

export {
  fetchAllWikiLinks,
  searchWikipedia,
  searchIMDb,
  chooseBestSource,
  scoreDataCompleteness,
};
