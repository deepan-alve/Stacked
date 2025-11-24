/**
 * IMDB Details scraper service
 * Fetches complete information from IMDB title pages
 */

/**
 * Get complete IMDB details for a title
 */
export async function getIMDBDetails(imdbId) {
  try {
    console.log(`Fetching complete IMDB details for: ${imdbId}`);

    const url = `https://www.imdb.com/title/${imdbId}/`;

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://www.imdb.com/",
      },
    });

    const html = await response.text();

    // Extract JSON-LD structured data
    const jsonLdMatch = html.match(
      /<script type="application\/ld\+json">(.*?)<\/script>/s
    );
    let jsonData = null;
    if (jsonLdMatch) {
      try {
        jsonData = JSON.parse(jsonLdMatch[1]);
      } catch (e) {
        console.log("Failed to parse JSON-LD data");
      }
    }

    // Basic info
    const basicInfo = extractBasicInfo(html, jsonData, imdbId);

    // Cast
    const cast = await extractCast(imdbId, html, jsonData);

    // Crew
    const crew = await extractCrew(imdbId, html, jsonData);

    // Plot
    const plot = extractPlot(html, jsonData);

    // Ratings and reviews
    const ratings = extractRatings(html, jsonData);

    // Awards
    const awards = await scrapeAwards(imdbId);

    // Trivia
    const trivia = await scrapeTrivia(imdbId);

    return {
      imdbId,
      url,
      ...basicInfo,
      plot,
      cast,
      crew,
      ...ratings,
      awards,
      trivia,
    };
  } catch (error) {
    console.error("Error fetching IMDB details:", error.message);
    return null;
  }
}

/**
 * Extract basic information
 */
function extractBasicInfo(html, jsonData, imdbId) {
  const info = {};

  // Title
  if (jsonData?.name) {
    info.title = jsonData.name;
  } else {
    const titleMatch =
      html.match(
        /<h1[^>]*data-testid="hero__primary-text"[^>]*>([^<]+)<\/h1>/
      ) || html.match(/<title>([^<]+)<\/title>/);
    info.title = titleMatch
      ? titleMatch[1].trim().replace(/ - IMDb$/, "")
      : "Unknown";
  }

  // Clean title
  info.title = info.title.replace(/\s*\(\d{4}[–-]?\d*\).*$/, "").trim();

  // Year
  if (jsonData?.datePublished) {
    info.year = jsonData.datePublished.substring(0, 4);
  } else {
    const yearMatch =
      html.match(
        new RegExp(
          `<a[^>]+href="/title/${imdbId}/releaseinfo[^>]*>(\\d{4})</a>`
        )
      ) ||
      html.match(/releaseinfo.*?(\d{4})/) ||
      html.match(/\((\d{4})\)/);
    info.year = yearMatch ? yearMatch[1] : null;
  }

  // Runtime
  if (jsonData?.duration) {
    const durationMatch = jsonData.duration.match(/PT(\d+)H?(\d+)?M/);
    if (durationMatch) {
      const hours = parseInt(durationMatch[1] || 0);
      const minutes = parseInt(durationMatch[2] || 0);
      info.runtime = hours * 60 + minutes;
    }
  } else {
    const runtimeMatch =
      html.match(/(\d+)\s*(?:hour|hr)s?\s*(\d+)?\s*(?:minute|min)/) ||
      html.match(/(\d+)\s*min/);
    if (runtimeMatch) {
      info.runtime = parseInt(runtimeMatch[1]);
      if (runtimeMatch[2]) {
        info.runtime =
          parseInt(runtimeMatch[1]) * 60 + parseInt(runtimeMatch[2]);
      }
    }
  }

  // Genres
  if (jsonData?.genre) {
    info.genres = Array.isArray(jsonData.genre)
      ? jsonData.genre
      : [jsonData.genre];
  } else {
    const genreMatches = html.matchAll(
      /<a[^>]+href="\/search\/title\/\?genres=[^"]+[^>]*>([^<]+)<\/a>/g
    );
    info.genres = Array.from(genreMatches)
      .map((m) => m[1])
      .slice(0, 5);
  }

  // Content rating
  const contentRatingMatch =
    html.match(
      /<a[^>]+href="\/title\/[^>]+\/parentalguide\/certificates[^>]*>([^<]+)<\/a>/
    ) || html.match(/contentRating":"([^"]+)"/);
  info.contentRating = contentRatingMatch ? contentRatingMatch[1] : null;

  return info;
}

/**
 * Extract plot/synopsis
 */
function extractPlot(html, jsonData) {
  if (jsonData?.description) {
    return jsonData.description;
  }

  const plotMatch =
    html.match(/"description":"([^"]+)"/) ||
    html.match(/<span data-testid="plot-[^"]*"[^>]*>([^<]+)<\/span>/) ||
    html.match(/<p[^>]*><span[^>]*>([^<]+)<\/span><\/p>/);

  return plotMatch ? plotMatch[1] : null;
}

/**
 * Extract ratings information
 */
function extractRatings(html, jsonData) {
  const ratings = {};

  // IMDB Rating
  if (jsonData?.aggregateRating) {
    ratings.rating = parseFloat(jsonData.aggregateRating.ratingValue);
    ratings.votes = parseInt(jsonData.aggregateRating.ratingCount);
  } else {
    const ratingMatch =
      html.match(/"ratingValue":"?([\d.]+)"?/) ||
      html.match(/(\d+\.\d+)<\/span>\s*<span[^>]*>\/10/);
    ratings.rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;

    const votesMatch =
      html.match(/"ratingCount":"?([\d,]+)"?/) ||
      html.match(/(\d+(?:,\d+)*)\s*(?:votes|user ratings)/i);
    ratings.votes = votesMatch
      ? parseInt(votesMatch[1].replace(/,/g, ""))
      : null;
  }

  // Metascore
  const metascoreMatch =
    html.match(/<span[^>]*data-testid="metacritic-score[^>]*>(\d+)<\/span>/) ||
    html.match(/Metascore[^>]*>(\d+)</) ||
    html.match(/"metascore":\s*"?(\d+)"?/);
  ratings.metascore = metascoreMatch ? parseInt(metascoreMatch[1]) : null;

  return ratings;
}

/**
 * Extract cast from main page or fullcredits page
 */
async function extractCast(imdbId, html, jsonData) {
  const cast = [];

  try {
    // Try JSON-LD first
    if (jsonData?.actor) {
      const actors = Array.isArray(jsonData.actor)
        ? jsonData.actor
        : [jsonData.actor];
      for (const actor of actors.slice(0, 15)) {
        cast.push({
          name: actor.name,
          character: null,
        });
      }

      if (cast.length > 0) return cast;
    }

    // Scrape fullcredits page for complete cast
    const creditsUrl = `https://www.imdb.com/title/${imdbId}/fullcredits`;
    const response = await fetch(creditsUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html",
      },
    });

    const creditsHtml = await response.text();

    // Extract cast table
    const castTableMatch = creditsHtml.match(
      /<table[^>]*class="[^"]*cast_list[^"]*"[^>]*>([\s\S]*?)<\/table>/
    );

    if (castTableMatch) {
      const rows = castTableMatch[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g);

      for (const row of rows) {
        const rowHtml = row[1];

        // Extract actor name
        const nameMatch = rowHtml.match(
          /<a[^>]+href="\/name\/[^>]+>([^<]+)<\/a>/
        );

        // Extract character name
        const characterMatch = rowHtml.match(
          /<td[^>]*class="[^"]*character[^"]*"[^>]*>([\s\S]*?)<\/td>/
        );
        let character = null;
        if (characterMatch) {
          const charText = characterMatch[1].replace(/<[^>]+>/g, "").trim();
          character = charText;
        }

        if (nameMatch) {
          cast.push({
            name: nameMatch[1].trim(),
            character: character,
          });
        }

        if (cast.length >= 15) break; // Limit to top 15
      }
    }
  } catch (error) {
    console.error("Cast extraction error:", error.message);
  }

  return cast;
}

/**
 * Extract crew information
 */
async function extractCrew(imdbId, html, jsonData) {
  const crew = {};

  try {
    // Try JSON-LD first
    if (jsonData?.director) {
      const directors = Array.isArray(jsonData.director)
        ? jsonData.director
        : [jsonData.director];
      crew.directors = directors.map((d) => d.name).slice(0, 5);
    }

    if (jsonData?.creator) {
      const creators = Array.isArray(jsonData.creator)
        ? jsonData.creator
        : [jsonData.creator];
      crew.writers = creators.map((c) => c.name).slice(0, 5);
    }

    // Scrape fullcredits page for complete crew
    const creditsUrl = `https://www.imdb.com/title/${imdbId}/fullcredits`;
    const response = await fetch(creditsUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html",
      },
    });

    const creditsHtml = await response.text();

    // Extract directors if not from JSON
    if (!crew.directors) {
      const directorSection = creditsHtml.match(
        /<h4[^>]*>Directed by[^<]*<\/h4>([\s\S]*?)(?:<h4|<div[^>]*class="[^"]*header)/i
      );
      if (directorSection) {
        const nameMatches = directorSection[1].matchAll(
          /<a[^>]+href="\/name\/[^>]+>([^<]+)<\/a>/g
        );
        crew.directors = Array.from(nameMatches)
          .map((m) => m[1])
          .slice(0, 5);
      }
    }

    // Extract writers if not from JSON
    if (!crew.writers) {
      const writerSection = creditsHtml.match(
        /<h4[^>]*>Writing Credits[^<]*<\/h4>([\s\S]*?)(?:<h4|<div[^>]*class="[^"]*header)/i
      );
      if (writerSection) {
        const nameMatches = writerSection[1].matchAll(
          /<a[^>]+href="\/name\/[^>]+>([^<]+)<\/a>/g
        );
        crew.writers = Array.from(nameMatches)
          .map((m) => m[1])
          .slice(0, 5);
      }
    }

    // Extract producers
    const producerSection = creditsHtml.match(
      /<h4[^>]*>Produced by[^<]*<\/h4>([\s\S]*?)(?:<h4|<div[^>]*class="[^"]*header)/i
    );
    if (producerSection) {
      const nameMatches = producerSection[1].matchAll(
        /<a[^>]+href="\/name\/[^>]+>([^<]+)<\/a>/g
      );
      crew.producers = Array.from(nameMatches)
        .map((m) => m[1])
        .slice(0, 5);
    }

    // Extract music
    const musicSection = creditsHtml.match(
      /<h4[^>]*>Music by[^<]*<\/h4>([\s\S]*?)(?:<h4|<div[^>]*class="[^"]*header)/i
    );
    if (musicSection) {
      const nameMatches = musicSection[1].matchAll(
        /<a[^>]+href="\/name\/[^>]+>([^<]+)<\/a>/g
      );
      crew.music = Array.from(nameMatches)
        .map((m) => m[1])
        .slice(0, 3);
    }

    // Extract cinematography
    const cinematographySection = creditsHtml.match(
      /<h4[^>]*>Cinematography by[^<]*<\/h4>([\s\S]*?)(?:<h4|<div[^>]*class="[^"]*header)/i
    );
    if (cinematographySection) {
      const nameMatches = cinematographySection[1].matchAll(
        /<a[^>]+href="\/name\/[^>]+>([^<]+)<\/a>/g
      );
      crew.cinematography = Array.from(nameMatches)
        .map((m) => m[1])
        .slice(0, 3);
    }
  } catch (error) {
    console.error("Crew extraction error:", error.message);
  }

  return crew;
}

/**
 * Scrape awards page
 */
async function scrapeAwards(imdbId) {
  try {
    const awardsUrl = `https://www.imdb.com/title/${imdbId}/awards`;

    const response = await fetch(awardsUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html",
      },
    });

    const html = await response.text();

    const awards = [];

    // Extract award sections
    const awardMatches = html.matchAll(
      /<h3[^>]*>([^<]+)<\/h3>([\s\S]*?)(?=<h3|<\/div>)/g
    );

    for (const match of awardMatches) {
      const awardName = match[1].trim();
      const awardSection = match[2];

      // Count wins and nominations
      const wins = (awardSection.match(/Won/g) || []).length;
      const nominations = (awardSection.match(/Nominated/g) || []).length;

      if (wins > 0 || nominations > 0) {
        awards.push({
          name: awardName,
          wins,
          nominations,
        });
      }

      if (awards.length >= 10) break; // Limit to top 10
    }

    return awards;
  } catch (error) {
    console.error("Awards scraping error:", error.message);
    return [];
  }
}

/**
 * Scrape trivia page
 */
async function scrapeTrivia(imdbId) {
  try {
    const triviaUrl = `https://www.imdb.com/title/${imdbId}/trivia`;

    const response = await fetch(triviaUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html",
      },
    });

    const html = await response.text();

    const trivia = [];

    // Extract trivia items
    const triviaMatches = html.matchAll(
      /<div[^>]*class="[^"]*ipc-html-content-inner-div[^"]*"[^>]*>([\s\S]*?)<\/div>/g
    );

    for (const match of triviaMatches) {
      const triviaText = match[1]
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim();

      if (triviaText.length > 20 && triviaText.length < 1000) {
        trivia.push(triviaText);
      }

      if (trivia.length >= 10) break; // Limit to top 10
    }

    return trivia;
  } catch (error) {
    console.error("Trivia scraping error:", error.message);
    return [];
  }
}

export default {
  getIMDBDetails,
};
