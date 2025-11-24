/**
 * Wikipedia scraper service
 * Fetches detailed information from Wikipedia pages
 */

const WIKIPEDIA_API_BASE = "https://en.wikipedia.org/api/rest_v1";
const WIKIPEDIA_BASE = "https://en.wikipedia.org";

/**
 * Search for Wikipedia page by title
 */
async function searchWikipedia(title) {
  try {
    const searchUrl = `${WIKIPEDIA_API_BASE}/page/title/${encodeURIComponent(
      title
    )}`;

    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": "MovieTrackerApp/1.0",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      // Try search API if direct title doesn't work
      return await searchWikipediaAlternate(title);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Wikipedia search error:", error.message);
    return null;
  }
}

/**
 * Alternate search using Wikipedia search API
 */
async function searchWikipediaAlternate(title) {
  try {
    const searchUrl = `${WIKIPEDIA_BASE}/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      title
    )}&format=json&origin=*`;

    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": "MovieTrackerApp/1.0",
        Accept: "application/json",
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data.query?.search?.length > 0) {
      return data.query.search[0];
    }
    return null;
  } catch (error) {
    console.error("Wikipedia alternate search error:", error.message);
    return null;
  }
}

/**
 * Get Wikipedia page summary
 */
async function getWikipediaSummary(pageTitle) {
  try {
    const summaryUrl = `${WIKIPEDIA_API_BASE}/page/summary/${encodeURIComponent(
      pageTitle
    )}`;

    const response = await fetch(summaryUrl, {
      headers: {
        "User-Agent": "MovieTrackerApp/1.0",
        Accept: "application/json",
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    return {
      title: data.title,
      summary: data.extract,
      url: data.content_urls?.desktop?.page,
      thumbnail: data.thumbnail?.source,
    };
  } catch (error) {
    console.error("Wikipedia summary error:", error.message);
    return null;
  }
}

/**
 * Scrape full Wikipedia page for detailed information
 */
async function scrapeWikipediaDetails(pageTitle) {
  try {
    const pageUrl = `${WIKIPEDIA_BASE}/wiki/${encodeURIComponent(
      pageTitle.replace(/ /g, "_")
    )}`;

    const response = await fetch(pageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!response.ok) return null;

    const html = await response.text();

    // Extract infobox data
    const infobox = extractInfobox(html);

    // Extract plot/synopsis
    const plot = extractPlot(html);

    // Extract cast
    const cast = extractCast(html);

    // Extract crew
    const crew = extractCrew(html);

    return {
      url: pageUrl,
      infobox,
      plot,
      cast,
      crew,
    };
  } catch (error) {
    console.error("Wikipedia scraping error:", error.message);
    return null;
  }
}

/**
 * Extract infobox data from Wikipedia HTML
 */
function extractInfobox(html) {
  const infobox = {};

  try {
    // Match infobox table
    const infoboxMatch = html.match(
      /<table[^>]*class="[^"]*infobox[^"]*"[^>]*>([\s\S]*?)<\/table>/i
    );
    if (!infoboxMatch) return infobox;

    const infoboxHtml = infoboxMatch[1];

    // Extract rows
    const rowMatches = infoboxHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);

    for (const rowMatch of rowMatches) {
      const rowHtml = rowMatch[1];

      // Extract label and value
      const labelMatch = rowHtml.match(/<th[^>]*>([\s\S]*?)<\/th>/i);
      const valueMatch = rowHtml.match(/<td[^>]*>([\s\S]*?)<\/td>/i);

      if (labelMatch && valueMatch) {
        const label = stripHtml(labelMatch[1]).trim();
        const value = stripHtml(valueMatch[1]).trim();

        if (label && value) {
          infobox[label] = value;
        }
      }
    }
  } catch (error) {
    console.error("Infobox extraction error:", error.message);
  }

  return infobox;
}

/**
 * Extract plot/synopsis from Wikipedia HTML
 */
function extractPlot(html) {
  try {
    // Look for Plot or Synopsis section
    const plotMatch = html.match(
      /<span[^>]*id="(?:Plot|Synopsis)"[^>]*>[\s\S]*?<\/span>[\s\S]*?<\/h2>([\s\S]*?)(?:<h2|<div[^>]*class="[^"]*navbox)/i
    );

    if (plotMatch) {
      let plotHtml = plotMatch[1];

      // Extract paragraphs
      const paragraphs = [];
      const paraMatches = plotHtml.matchAll(/<p>([\s\S]*?)<\/p>/gi);

      for (const paraMatch of paraMatches) {
        const text = stripHtml(paraMatch[1]).trim();
        if (text.length > 50) {
          // Filter out short/empty paragraphs
          paragraphs.push(text);
        }
      }

      return paragraphs.join("\n\n");
    }
  } catch (error) {
    console.error("Plot extraction error:", error.message);
  }

  return "";
}

/**
 * Extract cast from Wikipedia HTML
 */
function extractCast(html) {
  const cast = [];

  try {
    // Look for Cast section
    const castMatch = html.match(
      /<span[^>]*id="Cast"[^>]*>[\s\S]*?<\/span>[\s\S]*?<\/h2>([\s\S]*?)(?:<h2|<div[^>]*class="[^"]*navbox)/i
    );

    if (castMatch) {
      const castHtml = castMatch[1];

      // Extract list items
      const listMatches = castHtml.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi);

      for (const listMatch of listMatches) {
        const text = stripHtml(listMatch[1]).trim();
        if (text.length > 5) {
          cast.push(text);
        }
      }
    }
  } catch (error) {
    console.error("Cast extraction error:", error.message);
  }

  return cast;
}

/**
 * Extract crew from infobox
 */
function extractCrew(html) {
  const crew = {};

  try {
    const infobox = extractInfobox(html);

    const crewFields = [
      "Directed by",
      "Written by",
      "Produced by",
      "Starring",
      "Music by",
      "Cinematography",
      "Edited by",
    ];

    for (const field of crewFields) {
      if (infobox[field]) {
        crew[field] = infobox[field];
      }
    }
  } catch (error) {
    console.error("Crew extraction error:", error.message);
  }

  return crew;
}

/**
 * Strip HTML tags and decode entities
 */
function stripHtml(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Main function to get complete Wikipedia details
 */
export async function getWikipediaDetails(title, year = null) {
  try {
    console.log(`Fetching Wikipedia details for: ${title}`);

    // Search for the page
    let searchQuery = year ? `${title} ${year} film` : `${title} film`;
    const searchResult = await searchWikipedia(searchQuery);

    if (!searchResult) {
      console.log("No Wikipedia page found");
      return null;
    }

    const pageTitle = searchResult.title || searchResult.pageid;

    // Get summary
    const summary = await getWikipediaSummary(pageTitle);

    // Get detailed information
    const details = await scrapeWikipediaDetails(pageTitle);

    if (!summary && !details) {
      return null;
    }

    return {
      url: summary?.url || details?.url,
      summary: summary?.summary || "",
      plot: details?.plot || "",
      cast: details?.cast || [],
      crew: details?.crew || {},
      infobox: details?.infobox || {},
    };
  } catch (error) {
    console.error("Error fetching Wikipedia details:", error.message);
    return null;
  }
}

export default {
  getWikipediaDetails,
  searchWikipedia,
  getWikipediaSummary,
  scrapeWikipediaDetails,
};
