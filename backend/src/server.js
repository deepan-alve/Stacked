import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import database from "./config/database.js";
import entryRoutes from "./routes/entries.js";
import searchRoutes from "./routes/search.js";
import imdbRoutes from "./routes/imdb.js";
import detailsRoutes from "./routes/details.js";
import dlangRoutes from "./routes/dlang.js";
import backupRoutes from "./routes/backup.js";
import publicRoutes from "./routes/public.js";
import authRoutes from "./routes/auth.js";
import syncRoutes from "./routes/sync.js";
import backupService from "./services/backupService.js";
import gitSyncService from "./services/gitSyncService.js";
import { requireAuth } from "./middleware/auth.js";

const app = express();
const PORT = process.env.PORT || 3000;
const BACKUP_INTERVAL_HOURS = parseInt(process.env.BACKUP_INTERVAL_HOURS) || 6;
const isProduction = process.env.NODE_ENV === "production";

// Trust proxy - REQUIRED when behind nginx/traefik
// This enables Express to trust X-Forwarded-* headers
app.set("trust proxy", 1);

// ===================
// SECURITY MIDDLEWARE
// ===================

// Helmet - sets various HTTP security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:", "http:"], // Allow external images for posters
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Disable for external images
  })
);

// Rate limiting - general API
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !isProduction, // Skip in development
});

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 login attempts per 15 minutes
  message: { error: "Too many login attempts, please try again in 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: false,
  skip: (req) => !isProduction, // Skip in development
});

// Allowed origins for CORS
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:3000",
  "https://stacked.deepanalve.dev",
].filter(Boolean);

// CORS configuration for credentials (cookies)
const corsOptions = {
  origin: function (origin, callback) {
    // Block requests with no origin in production (except for same-origin)
    if (!origin) {
      // Allow same-origin requests and server-to-server
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // Allow cookies to be sent
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400, // Cache preflight for 24 hours
};

// Middleware
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: "10mb" })); // Limit body size
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Apply general rate limiting to all routes
app.use(generalLimiter);

// Request logging (don't log sensitive data)
app.use((req, res, next) => {
  // Sanitize logging - don't log passwords or tokens
  const sanitizedPath = req.path;
  console.log(`${new Date().toISOString()} - ${req.method} ${sanitizedPath}`);
  next();
});

// API Routes
app.use("/api/auth", authLimiter, authRoutes); // Auth routes with strict rate limiting
app.use("/api/public", publicRoutes); // Public routes (no auth required)
app.use("/api/entries", requireAuth, entryRoutes); // Protected
app.use("/api/search", searchRoutes); // Search can be public
app.use("/api/imdb", requireAuth, imdbRoutes); // Protected
app.use("/api/details", detailsRoutes); // Details can be public
app.use("/api/dlang", requireAuth, dlangRoutes); // Protected
app.use("/api/backup", requireAuth, backupRoutes); // Protected
app.use("/api/sync", requireAuth, syncRoutes); // Protected - Git sync

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

    // Start periodic file backups
    backupService.startPeriodicBackup(BACKUP_INTERVAL_HOURS);
    console.log(`Backup enabled: every ${BACKUP_INTERVAL_HOURS} hours`);

    // Start periodic Git sync (every 30 minutes if GITHUB_TOKEN is set)
    if (process.env.GITHUB_TOKEN) {
      console.log("Git sync enabled - syncing to GitHub every 30 minutes");
      setInterval(() => {
        gitSyncService.syncToGitHub().catch(console.error);
      }, 30 * 60 * 1000); // 30 minutes

      // Initial sync after 1 minute
      setTimeout(() => {
        gitSyncService.syncToGitHub().catch(console.error);
      }, 60 * 1000);
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
