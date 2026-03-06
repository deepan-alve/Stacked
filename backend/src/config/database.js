import pkg from "sqlite3";
const { Database: SQLiteDatabase } = pkg.verbose();
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DB_PATH || path.join(__dirname, "../../data/movies.db");

console.log("[DB] Database path configured:", dbPath);
console.log("[DB] DB_PATH env:", process.env.DB_PATH);

class Database {
  constructor() {
    this.db = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      console.log("[DB] Attempting to connect to database at:", dbPath);
      this.db = new SQLiteDatabase(dbPath, (err) => {
        if (err) {
          console.error("[DB] Error opening database:", err.message);
          reject(err);
        } else {
          console.log("[DB] ✓ Connected to SQLite database");
          this.initializeDatabase()
            .then(() => resolve())
            .catch(reject);
        }
      });
    });
  }

  initializeDatabase() {
    return new Promise((resolve, reject) => {
      const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `;

      const createMoviesTable = `
        CREATE TABLE IF NOT EXISTS movies (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER DEFAULT 1,
          title TEXT NOT NULL,
          type TEXT NOT NULL,
          rating REAL,
          season INTEGER,
          notes TEXT,
          assignee TEXT,
          due_date TEXT,
          poster_url TEXT,
          api_id TEXT,
          api_provider TEXT,
          description TEXT,
          release_date TEXT,
          year INTEGER DEFAULT 2025,
          watch_date TEXT DEFAULT CURRENT_TIMESTAMP,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `;

      const createDetailsTable = `
        CREATE TABLE IF NOT EXISTS movie_details (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER DEFAULT 1,
          entry_id INTEGER UNIQUE NOT NULL,
          wikipedia_url TEXT,
          wikipedia_summary TEXT,
          wikipedia_plot TEXT,
          wikipedia_cast TEXT,
          wikipedia_crew TEXT,
          wikipedia_infobox TEXT,
          imdb_url TEXT,
          imdb_rating REAL,
          imdb_votes INTEGER,
          imdb_metascore INTEGER,
          imdb_plot TEXT,
          imdb_cast TEXT,
          imdb_crew TEXT,
          imdb_reviews TEXT,
          imdb_awards TEXT,
          imdb_trivia TEXT,
          last_synced DATETIME,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (entry_id) REFERENCES movies(id) ON DELETE CASCADE
        )
      `;

      const createDlangTable = `
        CREATE TABLE IF NOT EXISTS dlang_movies (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER DEFAULT 1,
          title TEXT NOT NULL,
          year INTEGER,
          language TEXT,
          genre TEXT,
          director TEXT,
          rating REAL,
          poster_url TEXT,
          notes TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `;

      this.db.run(createUsersTable, (err) => {
        if (err) {
          console.error("[DB] Error creating users table:", err.message);
          reject(err);
        } else {
          console.log("[DB] ✓ Users table ready");
          this.db.run(createMoviesTable, (err) => {
            if (err) {
              console.error("[DB] Error creating movies table:", err.message);
              reject(err);
            } else {
              this.db.run(createDetailsTable, (err) => {
                if (err) {
                  console.error(
                    "[DB] Error creating movie_details table:",
                    err.message
                  );
                  reject(err);
                } else {
                  this.db.run(createDlangTable, (err) => {
                    if (err) {
                      console.error(
                        "[DB] Error creating dlang_movies table:",
                        err.message
                      );
                      reject(err);
                    } else {
                      console.log("[DB] ✓ All database tables ready");
                      // Run migrations for existing databases
                      this.runMigrations()
                        .then(() => resolve())
                        .catch(reject);
                    }
                  });
                }
              });
            }
          });
        }
      });
    });
  }

  async runMigrations() {
    console.log("[DB] Running migrations...");

    // Helper to check if column exists
    const columnExists = (table, column) => {
      return new Promise((resolve) => {
        this.db.all(`PRAGMA table_info(${table})`, [], (err, rows) => {
          if (err) {
            resolve(false);
          } else {
            resolve(rows.some(row => row.name === column));
          }
        });
      });
    };

    // Helper to add column
    const addColumn = (table, column, definition) => {
      return new Promise((resolve, reject) => {
        this.db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`, [], (err) => {
          if (err) {
            // Column might already exist, ignore error
            console.log(`[DB] Column ${column} might already exist in ${table}`);
            resolve();
          } else {
            console.log(`[DB] ✓ Added ${column} to ${table}`);
            resolve();
          }
        });
      });
    };

    try {
      // Add user_id to movies if missing
      if (!(await columnExists('movies', 'user_id'))) {
        await addColumn('movies', 'user_id', 'INTEGER DEFAULT 1');
      }

      // Add user_id to dlang_movies if missing
      if (!(await columnExists('dlang_movies', 'user_id'))) {
        await addColumn('dlang_movies', 'user_id', 'INTEGER DEFAULT 1');
      }

      // Add user_id to movie_details if missing
      if (!(await columnExists('movie_details', 'user_id'))) {
        await addColumn('movie_details', 'user_id', 'INTEGER DEFAULT 1');
      }

      // Add year to movies if missing
      if (!(await columnExists('movies', 'year'))) {
        await addColumn('movies', 'year', 'INTEGER DEFAULT 2025');
      }

      // Add watch_date to movies if missing
      if (!(await columnExists('movies', 'watch_date'))) {
        await addColumn('movies', 'watch_date', 'TEXT');
      }

      // Convert 10-scale ratings to 5-scale (ratings > 5 need conversion)
      // Formula: round to nearest 0.5 after dividing by 2
      await new Promise((resolve, reject) => {
        this.db.run(
          `UPDATE movies SET rating = ROUND(rating / 2.0 * 2) / 2 WHERE rating > 5`,
          [],
          (err) => {
            if (err) {
              console.log("[DB] Rating conversion error:", err.message);
            } else {
              console.log("[DB] ✓ Ratings converted to 5-star scale");
            }
            resolve();
          }
        );
      });

      // Also convert dlang_movies ratings
      await new Promise((resolve, reject) => {
        this.db.run(
          `UPDATE dlang_movies SET rating = ROUND(rating / 2.0 * 2) / 2 WHERE rating > 5`,
          [],
          (err) => {
            if (err) {
              console.log("[DB] Dlang rating conversion error:", err.message);
            }
            resolve();
          }
        );
      });

      // Add status column to movies
      if (!(await columnExists('movies', 'status'))) {
        await addColumn('movies', 'status', "TEXT DEFAULT 'completed'");
      }

      // Add progress_current column to movies
      if (!(await columnExists('movies', 'progress_current'))) {
        await addColumn('movies', 'progress_current', 'INTEGER DEFAULT 0');
      }

      // Add progress_total column to movies
      if (!(await columnExists('movies', 'progress_total'))) {
        await addColumn('movies', 'progress_total', 'INTEGER DEFAULT 0');
      }

      // Add tags column to movies
      if (!(await columnExists('movies', 'tags'))) {
        await addColumn('movies', 'tags', "TEXT DEFAULT '[]'");
      }

      // Create goals table
      await new Promise((resolve) => {
        this.db.run(`CREATE TABLE IF NOT EXISTS goals (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          type TEXT NOT NULL,
          target INTEGER NOT NULL,
          period TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )`, [], (err) => {
          if (err) console.log("[DB] Goals table error:", err.message);
          else console.log("[DB] ✓ Goals table ready");
          resolve();
        });
      });

      // Create share_links table
      await new Promise((resolve) => {
        this.db.run(`CREATE TABLE IF NOT EXISTS share_links (
          id TEXT PRIMARY KEY,
          user_id INTEGER NOT NULL,
          collection TEXT NOT NULL,
          filters TEXT DEFAULT '{}',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )`, [], (err) => {
          if (err) console.log("[DB] Share links table error:", err.message);
          else console.log("[DB] ✓ Share links table ready");
          resolve();
        });
      });

      // Create activity_log table
      await new Promise((resolve) => {
        this.db.run(`CREATE TABLE IF NOT EXISTS activity_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          action TEXT NOT NULL,
          entry_id INTEGER,
          entry_title TEXT,
          entry_type TEXT,
          metadata TEXT DEFAULT '{}',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )`, [], (err) => {
          if (err) console.log("[DB] Activity log table error:", err.message);
          else console.log("[DB] ✓ Activity log table ready");
          resolve();
        });
      });

      // Backfill activity_log from existing entries that have no activity record
      const unloggedEntries = await new Promise((resolve) => {
        this.db.all(
          `SELECT m.id, m.user_id, m.title, m.type, m.created_at
           FROM movies m
           LEFT JOIN activity_log a ON a.entry_id = m.id AND a.user_id = m.user_id AND a.action = 'added'
           WHERE a.id IS NULL`,
          [],
          (err, rows) => {
            if (err) {
              console.log("[DB] Backfill query error:", err.message);
              resolve([]);
            } else {
              resolve(rows || []);
            }
          }
        );
      });

      if (unloggedEntries.length > 0) {
        for (const entry of unloggedEntries) {
          await new Promise((resolve) => {
            this.db.run(
              `INSERT INTO activity_log (user_id, action, entry_id, entry_title, entry_type, created_at)
               VALUES (?, 'added', ?, ?, ?, ?)`,
              [entry.user_id, entry.id, entry.title, entry.type, entry.created_at || new Date().toISOString()],
              (err) => {
                if (err) console.log(`[DB] Backfill error for ${entry.title}:`, err.message);
                resolve();
              }
            );
          });
        }
        console.log(`[DB] ✓ Backfilled ${unloggedEntries.length} activity_log entries`);
      }

      // Add display_name and bio columns to users
      if (!(await columnExists('users', 'display_name'))) {
        await addColumn('users', 'display_name', 'TEXT');
      }
      if (!(await columnExists('users', 'bio'))) {
        await addColumn('users', 'bio', 'TEXT');
      }

      console.log("[DB] ✓ Migrations complete");
    } catch (error) {
      console.error("[DB] Migration error:", error.message);
      throw error;
    }
  }

  all(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  get(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(query, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  run(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(query, params, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error("Error closing database:", err.message);
            reject(err);
          } else {
            console.log("Database connection closed");
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

const database = new Database();

export default database;
