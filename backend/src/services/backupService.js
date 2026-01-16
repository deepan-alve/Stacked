// Backup Service - SQLite backup with Supabase Storage
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class BackupService {
  constructor() {
    this.lastBackupTime = null;
    this.backupInterval = null;
    this.backupDir = process.env.BACKUP_DIR || "/app/backups";
    this.dbPath = process.env.DB_PATH || path.join(__dirname, "../../data/movies.db");
    this.supabase = null;
    this.bucketName = "stacked-backups";

    // Initialize Supabase if credentials are provided
    this.initSupabase();
  }

  /**
   * Initialize Supabase client
   */
  initSupabase() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      console.log("☁️  Supabase backup enabled");
    } else {
      console.log("☁️  Supabase backup disabled (no credentials)");
    }
  }

  /**
   * Upload backup to Supabase Storage
   */
  async uploadToSupabase(filePath, fileName) {
    if (!this.supabase) {
      return { success: false, message: "Supabase not configured" };
    }

    try {
      const fileBuffer = fs.readFileSync(filePath);

      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(fileName, fileBuffer, {
          contentType: "application/x-sqlite3",
          upsert: true
        });

      if (error) {
        console.error("Supabase upload error:", error.message);
        return { success: false, message: error.message };
      }

      console.log(`☁️  Uploaded to Supabase: ${fileName}`);
      return { success: true, path: data.path };
    } catch (error) {
      console.error("Supabase upload failed:", error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * List backups from Supabase Storage
   */
  async listSupabaseBackups() {
    if (!this.supabase) {
      return [];
    }

    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list("", {
          limit: 20,
          sortBy: { column: "created_at", order: "desc" }
        });

      if (error) {
        console.error("Failed to list Supabase backups:", error.message);
        return [];
      }

      return data.filter(f => f.name.endsWith(".db")).map(f => ({
        file: f.name,
        size: f.metadata?.size || 0,
        created: f.created_at,
        source: "supabase"
      }));
    } catch (error) {
      console.error("Failed to list Supabase backups:", error.message);
      return [];
    }
  }

  /**
   * Download backup from Supabase and restore
   */
  async restoreFromSupabase(fileName) {
    if (!this.supabase) {
      return { success: false, message: "Supabase not configured" };
    }

    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .download(fileName);

      if (error) {
        return { success: false, message: error.message };
      }

      // Create local backup first
      await this.createBackup(false);

      // Write the downloaded file
      const buffer = Buffer.from(await data.arrayBuffer());
      fs.writeFileSync(this.dbPath, buffer);

      console.log(`☁️  Restored from Supabase: ${fileName}`);
      return { success: true, message: `Restored from ${fileName}` };
    } catch (error) {
      console.error("Supabase restore failed:", error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Create a backup of the SQLite database
   */
  async createBackup(uploadToCloud = true) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFileName = `stacked-backup-${timestamp}.db`;
    const backupPath = path.join(this.backupDir, backupFileName);

    try {
      // Ensure backup directory exists
      if (!fs.existsSync(this.backupDir)) {
        fs.mkdirSync(this.backupDir, { recursive: true });
      }

      // Copy the database file
      if (fs.existsSync(this.dbPath)) {
        fs.copyFileSync(this.dbPath, backupPath);
        this.lastBackupTime = new Date();
        console.log(`✓ Backup created: ${backupFileName}`);

        // Upload to Supabase if enabled
        if (uploadToCloud && this.supabase) {
          await this.uploadToSupabase(backupPath, backupFileName);
        }

        // Clean old local backups (keep last 10)
        this.cleanOldBackups();

        return { success: true, file: backupFileName, time: this.lastBackupTime };
      } else {
        console.log("Database file not found, skipping backup");
        return { success: false, message: "Database file not found" };
      }
    } catch (error) {
      console.error("Backup failed:", error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Clean old backups, keeping only the last N
   */
  cleanOldBackups(keepCount = 10) {
    try {
      if (!fs.existsSync(this.backupDir)) return;

      const files = fs.readdirSync(this.backupDir)
        .filter(f => f.startsWith("stacked-backup-") && f.endsWith(".db"))
        .sort()
        .reverse();

      // Delete old backups
      files.slice(keepCount).forEach(file => {
        fs.unlinkSync(path.join(this.backupDir, file));
        console.log(`Deleted old backup: ${file}`);
      });
    } catch (error) {
      console.error("Failed to clean old backups:", error.message);
    }
  }

  /**
   * List all backups (local + Supabase)
   */
  async listBackups() {
    const localBackups = this.listLocalBackups();
    const supabaseBackups = await this.listSupabaseBackups();

    return {
      local: localBackups,
      supabase: supabaseBackups
    };
  }

  /**
   * List local backups
   */
  listLocalBackups() {
    try {
      if (!fs.existsSync(this.backupDir)) return [];

      return fs.readdirSync(this.backupDir)
        .filter(f => f.startsWith("stacked-backup-") && f.endsWith(".db"))
        .sort()
        .reverse()
        .map(file => ({
          file,
          path: path.join(this.backupDir, file),
          size: fs.statSync(path.join(this.backupDir, file)).size,
          source: "local"
        }));
    } catch (error) {
      console.error("Failed to list backups:", error.message);
      return [];
    }
  }

  /**
   * Restore from a local backup file
   */
  async restoreFromBackup(backupFileName) {
    const backupPath = path.join(this.backupDir, backupFileName);

    try {
      if (!fs.existsSync(backupPath)) {
        return { success: false, message: "Backup file not found" };
      }

      // Create a backup of current DB first
      await this.createBackup(false);

      // Restore
      fs.copyFileSync(backupPath, this.dbPath);
      console.log(`✓ Restored from: ${backupFileName}`);

      return { success: true, message: `Restored from ${backupFileName}` };
    } catch (error) {
      console.error("Restore failed:", error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Start periodic backups
   */
  startPeriodicBackup(intervalHours = 6) {
    const intervalMs = intervalHours * 60 * 60 * 1000;

    console.log(`⏰ Starting periodic backup every ${intervalHours} hours`);

    // Run initial backup after a delay (let DB initialize first)
    setTimeout(() => {
      this.createBackup().catch(console.error);
    }, 10000);

    // Set up interval
    this.backupInterval = setInterval(() => {
      this.createBackup().catch(console.error);
    }, intervalMs);
  }

  /**
   * Stop periodic backups
   */
  stopPeriodicBackup() {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
      console.log("⏹ Periodic backup stopped");
    }
  }

  /**
   * Get backup status
   */
  async getStatus() {
    const backups = await this.listBackups();
    return {
      lastBackupTime: this.lastBackupTime,
      isPeriodicBackupActive: this.backupInterval !== null,
      supabaseEnabled: this.supabase !== null,
      backups
    };
  }

  // Legacy methods for compatibility
  async testConnection() { return true; }
  async initSupabaseTables() { return true; }
  startPeriodicSync(hours) { this.startPeriodicBackup(hours); }
  stopPeriodicSync() { this.stopPeriodicBackup(); }
  async fullSync() { return this.createBackup(); }
  async getSyncStatus() { return this.getStatus(); }
  gitBackup() { return { success: true, message: "Git backup disabled" }; }
}

export default new BackupService();
