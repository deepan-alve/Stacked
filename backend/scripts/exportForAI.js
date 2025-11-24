import database from "../src/config/database.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Export scraped content to JSON file for AI training
 */
async function exportForAI() {
  await database.connect();

  console.log("📦 Exporting scraped content for AI training...\n");

  // Get all successfully scraped movies
  const movies = await database.all(
    `SELECT 
      m.id,
      m.title,
      m.type,
      m.rating,
      m.release_date,
      mc.source_type,
      mc.source_url,
      mc.content,
      mc.full_text,
      mc.scraped_at
    FROM movie_content mc
    JOIN movies m ON m.id = mc.entry_id
    WHERE mc.scrape_status = 'success'
    ORDER BY m.id`
  );

  console.log(`Found ${movies.length} successfully scraped movies\n`);

  // Parse JSON content for each movie
  const exportData = movies.map((movie) => ({
    id: movie.id,
    title: movie.title,
    type: movie.type,
    rating: movie.rating,
    release_date: movie.release_date,
    source_type: movie.source_type,
    source_url: movie.source_url,
    scraped_at: movie.scraped_at,
    content: JSON.parse(movie.content),
    full_text: movie.full_text,
  }));

  // Export to JSON file
  const outputPath = path.join(__dirname, "..", "movie_training_data.json");
  fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2), "utf-8");

  console.log(`✅ Exported to: ${outputPath}`);
  console.log(
    `   File size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(
      2
    )} MB`
  );

  // Also create a simplified text-only export
  const textData = movies.map((movie) => ({
    id: movie.id,
    title: movie.title,
    type: movie.type,
    source: movie.source_type,
    text: movie.full_text,
  }));

  const textOutputPath = path.join(__dirname, "..", "movie_training_text.json");
  fs.writeFileSync(textOutputPath, JSON.stringify(textData, null, 2), "utf-8");

  console.log(`✅ Text-only export: ${textOutputPath}`);
  console.log(
    `   File size: ${(fs.statSync(textOutputPath).size / 1024 / 1024).toFixed(
      2
    )} MB`
  );

  // Statistics
  const stats = {
    total_movies: movies.length,
    by_source: {
      wikipedia: movies.filter((m) => m.source_type === "wikipedia").length,
      imdb: movies.filter((m) => m.source_type === "imdb").length,
    },
    by_type: {},
  };

  movies.forEach((movie) => {
    if (!stats.by_type[movie.type]) {
      stats.by_type[movie.type] = 0;
    }
    stats.by_type[movie.type]++;
  });

  console.log("\n📊 Export Statistics:");
  console.log(`   Total movies: ${stats.total_movies}`);
  console.log(`   Wikipedia: ${stats.by_source.wikipedia}`);
  console.log(`   IMDb: ${stats.by_source.imdb}`);
  console.log("\n   By type:");
  Object.entries(stats.by_type).forEach(([type, count]) => {
    console.log(`     ${type}: ${count}`);
  });

  await database.close();
}

exportForAI();
