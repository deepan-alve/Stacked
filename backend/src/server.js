import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import database from "./config/database.js";
import entryRoutes from "./routes/entries.js";
import searchRoutes from "./routes/search.js";
import imdbRoutes from "./routes/imdb.js";
import detailsRoutes from "./routes/details.js";
import dlangRoutes from "./routes/dlang.js";
import backupRoutes from "./routes/backup.js";
import backupService from "./services/backupService.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const BACKUP_INTERVAL_HOURS = parseInt(process.env.BACKUP_INTERVAL_HOURS) || 6;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use("/api/entries", entryRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/imdb", imdbRoutes);
app.use("/api/details", detailsRoutes);
app.use("/api/dlang", dlangRoutes);
app.use("/api/backup", backupRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Combined stats endpoint for Raycast
app.get("/api/stats", async (req, res) => {
  try {
    // Get main collection stats
    const mainTotal = await database.get(
      "SELECT COUNT(*) as count FROM movies"
    );
    const movieCount = await database.get(
      "SELECT COUNT(*) as count FROM movies WHERE type = 'movie'"
    );
    const seriesCount = await database.get(
      "SELECT COUNT(*) as count FROM movies WHERE type = 'series'"
    );
    const animeCount = await database.get(
      "SELECT COUNT(*) as count FROM movies WHERE type = 'anime'"
    );
    const bookCount = await database.get(
      "SELECT COUNT(*) as count FROM movies WHERE type = 'book'"
    );

    // Get dlang count
    const dlangCount = await database.get(
      "SELECT COUNT(*) as count FROM dlang_movies"
    );

    res.json({
      total: mainTotal.count + dlangCount.count,
      collection: {
        total: mainTotal.count,
        movies: movieCount.count,
        series: seriesCount.count,
        anime: animeCount.count,
        books: bookCount.count,
      },
      dlang: dlangCount.count,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Initialize database and start server
database
  .connect()
  .then(async () => {
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    });

    // Initialize Supabase backup if connection is configured
    if (process.env.SUPABASE_DB_HOST) {
      try {
        const connected = await backupService.testConnection();
        if (connected) {
          await backupService.initSupabaseTables();
          // Start periodic sync
          backupService.startPeriodicSync(BACKUP_INTERVAL_HOURS);
          console.log(
            `Backup enabled: syncing every ${BACKUP_INTERVAL_HOURS} hours`
          );
        }
      } catch (error) {
        console.error("Backup initialization failed:", error.message);
        console.log("Server will continue without backup functionality");
      }
    } else {
      console.log("SUPABASE_DB_URL not set - backup disabled");
    }
  })
  .catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
  });

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\nShutting down gracefully...");
  backupService.stopPeriodicSync();
  await database.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\nShutting down gracefully...");
  backupService.stopPeriodicSync();
  await database.close();
  process.exit(0);
});
