// Backup Service - Simple file-based SQLite backup
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class BackupService {
  constructor() {
    this.lastBackupTime = null;
    this.backupInterval = null;
    this.backupDir = process.env.BACKUP_DIR || "/app/backups";
    this.dbPath = process.env.DB_PATH || path.join(__dirname, "../../data/movies.db");
  }

  /**
   * Create a backup of the SQLite database
   */
  async createBackup() {
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

        // Clean old backups (keep last 10)
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
   * List all backups
   */
  listBackups() {
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
        }));
    } catch (error) {
      console.error("Failed to list backups:", error.message);
      return [];
    }
  }

  /**
   * Restore from a backup file
   */
  async restoreFromBackup(backupFileName) {
    const backupPath = path.join(this.backupDir, backupFileName);

    try {
      if (!fs.existsSync(backupPath)) {
        return { success: false, message: "Backup file not found" };
      }

      // Create a backup of current DB first
      await this.createBackup();

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
  getStatus() {
    return {
      lastBackupTime: this.lastBackupTime,
      isPeriodicBackupActive: this.backupInterval !== null,
      backups: this.listBackups(),
    };
  }

  // Legacy methods for compatibility (no-ops)
  async testConnection() { return true; }
  async initSupabaseTables() { return true; }
  startPeriodicSync(hours) { this.startPeriodicBackup(hours); }
  stopPeriodicSync() { this.stopPeriodicBackup(); }
  async fullSync() { return this.createBackup(); }
  async getSyncStatus() { return this.getStatus(); }
  gitBackup() { return { success: true, message: "Git backup disabled" }; }
  async restoreFromSupabase() { return { success: false, message: "Supabase not configured" }; }
}

export default new BackupService();
