// Backup Service - Syncs SQLite to Supabase PostgreSQL
import pg from "pg";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import database from "../config/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

// Build connection config from environment
const getPoolConfig = () => {
  // Force require SSL mode for Supabase
  return {
    host: process.env.SUPABASE_DB_HOST,
    port: parseInt(process.env.SUPABASE_DB_PORT) || 5432,
    database: process.env.SUPABASE_DB_NAME || "postgres",
    user: process.env.SUPABASE_DB_USER || "postgres",
    password: String(process.env.SUPABASE_DB_PASSWORD || ""),
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
    connectionTimeoutMillis: 30000,
  };
};

// Supabase PostgreSQL connection
let supabasePool = null;
const getPool = () => {
  if (!supabasePool && process.env.SUPABASE_DB_HOST) {
    supabasePool = new Pool(getPoolConfig());
  }
  return supabasePool;
};

class BackupService {
  constructor() {
    this.lastSyncTime = null;
    this.syncInterval = null;
  }

  /**
   * Initialize Supabase tables if they don't exist
   */
  async initSupabaseTables() {
    const client = await getPool().connect();
    try {
      // Create movies table (main collection)
      await client.query(`
        CREATE TABLE IF NOT EXISTS movies_backup (
          id INTEGER PRIMARY KEY,
          title TEXT NOT NULL,
          type TEXT,
          rating REAL,
          season TEXT,
          notes TEXT,
          poster_url TEXT,
          api_id TEXT,
          api_provider TEXT,
          description TEXT,
          release_date TEXT,
          created_at TEXT,
          updated_at TEXT,
          synced_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create dlang_movies table
      await client.query(`
        CREATE TABLE IF NOT EXISTS dlang_movies_backup (
          id INTEGER PRIMARY KEY,
          title TEXT NOT NULL,
          year INTEGER,
          language TEXT,
          genre TEXT,
          director TEXT,
          rating REAL,
          poster_url TEXT,
          notes TEXT,
          created_at TEXT,
          synced_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create sync log table
      await client.query(`
        CREATE TABLE IF NOT EXISTS sync_log (
          id SERIAL PRIMARY KEY,
          sync_type TEXT,
          records_synced INTEGER,
          status TEXT,
          error_message TEXT,
          started_at TIMESTAMP,
          completed_at TIMESTAMP DEFAULT NOW()
        )
      `);

      console.log("✓ Supabase backup tables initialized");
      return true;
    } catch (error) {
      console.error("Failed to initialize Supabase tables:", error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Sync all movies from SQLite to Supabase
   */
  async syncMovies() {
    const client = await getPool().connect();
    try {
      // Get all movies from SQLite
      const movies = await database.all("SELECT * FROM movies");
      
      if (movies.length === 0) {
        console.log("No movies to sync");
        return 0;
      }

      // Upsert each movie
      for (const movie of movies) {
        await client.query(
          `INSERT INTO movies_backup (id, title, type, rating, season, notes, poster_url, api_id, api_provider, description, release_date, created_at, updated_at, synced_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
           ON CONFLICT (id) DO UPDATE SET
             title = EXCLUDED.title,
             type = EXCLUDED.type,
             rating = EXCLUDED.rating,
             season = EXCLUDED.season,
             notes = EXCLUDED.notes,
             poster_url = EXCLUDED.poster_url,
             api_id = EXCLUDED.api_id,
             api_provider = EXCLUDED.api_provider,
             description = EXCLUDED.description,
             release_date = EXCLUDED.release_date,
             created_at = EXCLUDED.created_at,
             updated_at = EXCLUDED.updated_at,
             synced_at = NOW()`,
          [
            movie.id,
            movie.title,
            movie.type,
            movie.rating,
            movie.season,
            movie.notes,
            movie.poster_url,
            movie.api_id,
            movie.api_provider,
            movie.description,
            movie.release_date,
            movie.created_at,
            movie.updated_at,
          ]
        );
      }

      console.log(`✓ Synced ${movies.length} movies to Supabase`);
      return movies.length;
    } catch (error) {
      console.error("Failed to sync movies:", error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Sync all dlang movies from SQLite to Supabase
   */
  async syncDlangMovies() {
    const client = await getPool().connect();
    try {
      // Get all dlang movies from SQLite
      const movies = await database.all("SELECT * FROM dlang_movies");
      
      if (movies.length === 0) {
        console.log("No dlang movies to sync");
        return 0;
      }

      // Upsert each movie
      for (const movie of movies) {
        await client.query(
          `INSERT INTO dlang_movies_backup (id, title, year, language, genre, director, rating, poster_url, notes, created_at, synced_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
           ON CONFLICT (id) DO UPDATE SET
             title = EXCLUDED.title,
             year = EXCLUDED.year,
             language = EXCLUDED.language,
             genre = EXCLUDED.genre,
             director = EXCLUDED.director,
             rating = EXCLUDED.rating,
             poster_url = EXCLUDED.poster_url,
             notes = EXCLUDED.notes,
             created_at = EXCLUDED.created_at,
             synced_at = NOW()`,
          [
            movie.id,
            movie.title,
            movie.year,
            movie.language,
            movie.genre,
            movie.director,
            movie.rating,
            movie.poster_url,
            movie.notes,
            movie.created_at,
          ]
        );
      }

      console.log(`✓ Synced ${movies.length} dlang movies to Supabase`);
      return movies.length;
    } catch (error) {
      console.error("Failed to sync dlang movies:", error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Full sync - syncs everything
   */
  async fullSync() {
    const startTime = new Date();
    console.log(`\n🔄 Starting full sync at ${startTime.toISOString()}`);

    try {
      const moviesCount = await this.syncMovies();
      const dlangCount = await this.syncDlangMovies();
      
      // Also commit to Git
      const gitResult = this.gitBackup();

      this.lastSyncTime = new Date();

      // Log sync to Supabase
      await this.logSync("full", moviesCount + dlangCount, "success", null, startTime);

      console.log(`✅ Full sync completed: ${moviesCount} movies, ${dlangCount} dlang movies`);
      
      return {
        success: true,
        moviesCount,
        dlangCount,
        gitBackup: gitResult,
        syncTime: this.lastSyncTime,
      };
    } catch (error) {
      await this.logSync("full", 0, "error", error.message, startTime);
      console.error("❌ Full sync failed:", error.message);
      throw error;
    }
  }

  /**
   * Git backup - commits database to repository
   */
  gitBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const ROOT_DIR = path.resolve(__dirname, "../../..");

    try {
      // Change to root directory
      process.chdir(ROOT_DIR);

      // Check if there are changes to the database
      const status = execSync("git status --porcelain backend/movies.db", { encoding: "utf-8" });

      if (!status.trim()) {
        console.log(`📝 No database changes to commit to Git`);
        return { success: true, message: "No changes" };
      }

      // Stage the database file
      execSync("git add backend/movies.db", { encoding: "utf-8" });

      // Commit with timestamp
      const commitMessage = `chore: auto-backup database ${timestamp}`;
      execSync(`git commit -m "${commitMessage}"`, { encoding: "utf-8" });

      // Push to remote
      try {
        execSync("git push", { encoding: "utf-8" });
        console.log(`📝 ✓ Database committed and pushed to Git`);
        return { success: true, message: "Committed and pushed" };
      } catch (pushError) {
        console.log(`📝 ✓ Database committed (push pending)`);
        return { success: true, message: "Committed locally" };
      }
    } catch (error) {
      if (error.message?.includes("nothing to commit")) {
        console.log(`📝 No database changes to commit to Git`);
        return { success: true, message: "No changes" };
      }

      console.error(`📝 ✗ Git backup failed:`, error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Log sync operation to Supabase
   */
  async logSync(syncType, recordsSynced, status, errorMessage, startTime) {
    const client = await getPool().connect();
    try {
      await client.query(
        `INSERT INTO sync_log (sync_type, records_synced, status, error_message, started_at, completed_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [syncType, recordsSynced, status, errorMessage, startTime]
      );
    } catch (error) {
      console.error("Failed to log sync:", error.message);
    } finally {
      client.release();
    }
  }

  /**
   * Restore from Supabase to SQLite
   */
  async restoreFromSupabase() {
    console.log("🔄 Starting restore from Supabase...");

    try {
      const client = await getPool().connect();

      // Restore movies
      const moviesResult = await client.query("SELECT * FROM movies_backup");
      for (const movie of moviesResult.rows) {
        await database.run(
          `INSERT OR REPLACE INTO movies (id, title, type, rating, season, notes, poster_url, api_id, api_provider, description, release_date, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            movie.id,
            movie.title,
            movie.type,
            movie.rating,
            movie.season,
            movie.notes,
            movie.poster_url,
            movie.api_id,
            movie.api_provider,
            movie.description,
            movie.release_date,
            movie.created_at,
            movie.updated_at,
          ]
        );
      }

      // Restore dlang movies
      const dlangResult = await client.query("SELECT * FROM dlang_movies_backup");
      for (const movie of dlangResult.rows) {
        await database.run(
          `INSERT OR REPLACE INTO dlang_movies (id, title, year, language, genre, director, rating, poster_url, notes, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            movie.id,
            movie.title,
            movie.year,
            movie.language,
            movie.genre,
            movie.director,
            movie.rating,
            movie.poster_url,
            movie.notes,
            movie.created_at,
          ]
        );
      }

      client.release();

      console.log(`✅ Restored ${moviesResult.rows.length} movies, ${dlangResult.rows.length} dlang movies`);
      
      return {
        success: true,
        moviesCount: moviesResult.rows.length,
        dlangCount: dlangResult.rows.length,
      };
    } catch (error) {
      console.error("❌ Restore failed:", error.message);
      throw error;
    }
  }

  /**
   * Start periodic sync (every N hours)
   */
  startPeriodicSync(intervalHours = 6) {
    const intervalMs = intervalHours * 60 * 60 * 1000;

    console.log(`⏰ Starting periodic sync every ${intervalHours} hours`);

    // Run initial sync
    this.fullSync().catch(console.error);

    // Set up interval
    this.syncInterval = setInterval(() => {
      this.fullSync().catch(console.error);
    }, intervalMs);
  }

  /**
   * Stop periodic sync
   */
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log("⏹ Periodic sync stopped");
    }
  }

  /**
   * Get sync status
   */
  async getSyncStatus() {
    const client = await getPool().connect();
    try {
      const result = await client.query(
        "SELECT * FROM sync_log ORDER BY completed_at DESC LIMIT 10"
      );

      return {
        lastSyncTime: this.lastSyncTime,
        isPeriodicSyncActive: this.syncInterval !== null,
        recentSyncs: result.rows,
      };
    } catch (error) {
      return {
        lastSyncTime: this.lastSyncTime,
        isPeriodicSyncActive: this.syncInterval !== null,
        recentSyncs: [],
        error: error.message,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Test Supabase connection
   */
  async testConnection() {
    try {
      const client = await getPool().connect();
      await client.query("SELECT 1");
      client.release();
      console.log("✓ Supabase connection successful");
      return true;
    } catch (error) {
      console.error("✗ Supabase connection failed:", error.message);
      return false;
    }
  }
}

export default new BackupService();
