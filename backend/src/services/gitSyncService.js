// Git Sync Service - Sync database to GitHub
import database from "../config/database.js";
import { ENABLE_GIT_SYNC } from "../config/env.js";

class GitSyncService {
  constructor() {
    this.githubToken = process.env.GITHUB_TOKEN || "";
    this.githubRepo = process.env.GITHUB_REPO || "deepan-alve/Stacked-db";
    this.syncBranch = process.env.SYNC_BRANCH || "main";
    this.syncFile = "data/sync.json";
  }

  isGitSyncEnabled() {
    return ENABLE_GIT_SYNC;
  }

  /**
   * Export all data from database
   */
  async exportData() {
    try {
      const movies = await database.all("SELECT * FROM movies ORDER BY id");
      const dlangMovies = await database.all(
        "SELECT * FROM dlang_movies ORDER BY id"
      );

      return {
        exportedAt: new Date().toISOString(),
        schemaVersion: 2,
        movies,
        dlangMovies,
      };
    } catch (error) {
      console.error("[GitSync] Export error:", error.message);
      throw error;
    }
  }

  /**
   * Push data to GitHub
   */
  async pushToGitHub(data) {
    if (!this.isGitSyncEnabled()) {
      return { success: false, message: "Git sync is disabled" };
    }

    if (!this.githubToken) {
      console.log("[GitSync] No GITHUB_TOKEN set, skipping push");
      return { success: false, message: "No GitHub token configured" };
    }

    try {
      const content = Buffer.from(JSON.stringify(data, null, 2)).toString("base64");

      // Get current file SHA (needed for update)
      let sha = null;
      try {
        const getResponse = await fetch(
          `https://api.github.com/repos/${this.githubRepo}/contents/${this.syncFile}?ref=${this.syncBranch}`,
          {
            headers: {
              Authorization: `token ${this.githubToken}`,
              Accept: "application/vnd.github.v3+json",
            },
          }
        );
        if (getResponse.ok) {
          const fileData = await getResponse.json();
          sha = fileData.sha;
        }
      } catch (e) {
        // File doesn't exist yet, that's ok
      }

      // Create or update file
      const response = await fetch(
        `https://api.github.com/repos/${this.githubRepo}/contents/${this.syncFile}`,
        {
          method: "PUT",
          headers: {
            Authorization: `token ${this.githubToken}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: `Sync database: ${new Date().toISOString()}`,
            content,
            branch: this.syncBranch,
            ...(sha && { sha }),
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`GitHub API error: ${response.status} - ${error}`);
      }

      console.log("[GitSync] ✓ Pushed to GitHub");
      return { success: true, message: "Synced to GitHub" };
    } catch (error) {
      console.error("[GitSync] Push error:", error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Pull data from GitHub
   */
  async pullFromGitHub() {
    if (!this.isGitSyncEnabled()) {
      return { success: false, message: "Git sync is disabled" };
    }

    if (!this.githubToken) {
      return { success: false, message: "No GitHub token configured" };
    }

    try {
      const response = await fetch(
        `https://api.github.com/repos/${this.githubRepo}/contents/${this.syncFile}?ref=${this.syncBranch}`,
        {
          headers: {
            Authorization: `token ${this.githubToken}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const fileData = await response.json();
      const content = Buffer.from(fileData.content, "base64").toString("utf-8");
      const data = JSON.parse(content);

      console.log("[GitSync] ✓ Pulled from GitHub");
      return { success: true, data };
    } catch (error) {
      console.error("[GitSync] Pull error:", error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Import data into database
   */
  async importData(data) {
    try {
      // Import movies
      for (const movie of data.movies || []) {
        const existing = await database.get("SELECT id FROM movies WHERE id = ?", [movie.id]);
        if (existing) {
          await database.run(
            `UPDATE movies SET user_id=?, title=?, type=?, rating=?, season=?, notes=?, assignee=?,
             due_date=?, poster_url=?, api_id=?, api_provider=?, description=?,
             release_date=?, year=?, watch_date=?, status=?, progress_current=?, progress_total=?,
             tags=?, created_at=?, updated_at=? WHERE id=?`,
            [
              movie.user_id ?? 1,
              movie.title,
              movie.type,
              movie.rating,
              movie.season,
              movie.notes,
              movie.assignee,
              movie.due_date,
              movie.poster_url,
              movie.api_id,
              movie.api_provider,
              movie.description,
              movie.release_date,
              movie.year,
              movie.watch_date,
              movie.status ?? "completed",
              movie.progress_current ?? 0,
              movie.progress_total ?? 0,
              movie.tags ?? "[]",
              movie.created_at,
              movie.updated_at,
              movie.id,
            ]
          );
        } else {
          await database.run(
            `INSERT INTO movies (id, title, type, rating, season, notes, assignee, due_date,
             poster_url, api_id, api_provider, description, release_date, year, watch_date,
             status, progress_current, progress_total, tags, user_id, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              movie.id,
              movie.title,
              movie.type,
              movie.rating,
              movie.season,
              movie.notes,
              movie.assignee,
              movie.due_date,
              movie.poster_url,
              movie.api_id,
              movie.api_provider,
              movie.description,
              movie.release_date,
              movie.year,
              movie.watch_date,
              movie.status ?? "completed",
              movie.progress_current ?? 0,
              movie.progress_total ?? 0,
              movie.tags ?? "[]",
              movie.user_id ?? 1,
              movie.created_at,
              movie.updated_at,
            ]
          );
        }
      }

      for (const movie of data.dlangMovies || []) {
        const existing = await database.get(
          "SELECT id FROM dlang_movies WHERE id = ?",
          [movie.id]
        );

        if (existing) {
          await database.run(
            `UPDATE dlang_movies SET user_id=?, title=?, year=?, language=?, genre=?, director=?,
             rating=?, poster_url=?, notes=?, created_at=?, updated_at=? WHERE id=?`,
            [
              movie.user_id ?? 1,
              movie.title,
              movie.year,
              movie.language,
              movie.genre,
              movie.director,
              movie.rating,
              movie.poster_url,
              movie.notes,
              movie.created_at,
              movie.updated_at,
              movie.id,
            ]
          );
        } else {
          await database.run(
            `INSERT INTO dlang_movies (id, user_id, title, year, language, genre, director, rating,
             poster_url, notes, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              movie.id,
              movie.user_id ?? 1,
              movie.title,
              movie.year,
              movie.language,
              movie.genre,
              movie.director,
              movie.rating,
              movie.poster_url,
              movie.notes,
              movie.created_at,
              movie.updated_at,
            ]
          );
        }
      }

      console.log(
        "[GitSync] ✓ Imported",
        data.movies?.length || 0,
        "movies and",
        data.dlangMovies?.length || 0,
        "favorites"
      );
      return {
        success: true,
        imported: (data.movies?.length || 0) + (data.dlangMovies?.length || 0),
      };
    } catch (error) {
      console.error("[GitSync] Import error:", error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Full sync - export and push to GitHub
   */
  async syncToGitHub() {
    console.log("[GitSync] Starting sync to GitHub...");
    const data = await this.exportData();
    return await this.pushToGitHub(data);
  }

  /**
   * Full sync - pull from GitHub and import
   */
  async syncFromGitHub() {
    console.log("[GitSync] Starting sync from GitHub...");
    const result = await this.pullFromGitHub();
    if (result.success && result.data) {
      return await this.importData(result.data);
    }
    return result;
  }
}

export default new GitSyncService();
