import database from "../src/config/database.js";

async function checkCount() {
  await database.connect();

  const result = await database.get("SELECT COUNT(*) as total FROM movies");
  console.log(`Total entries in database: ${result.total}`);

  const byType = await database.all(
    "SELECT type, COUNT(*) as count FROM movies GROUP BY type ORDER BY count DESC"
  );

  console.log("\nBreakdown by type:");
  for (const row of byType) {
    console.log(`  ${row.type}: ${row.count}`);
  }

  await database.close();
}

checkCount();
