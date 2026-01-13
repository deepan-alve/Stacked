import pkg from "sqlite3";
const { Database: SQLiteDatabase } = pkg.verbose();
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DB_PATH || path.join(__dirname, "../../movies.db");

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
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `;

      const createDetailsTable = `
        CREATE TABLE IF NOT EXISTS movie_details (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
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
          FOREIGN KEY (entry_id) REFERENCES movies(id) ON DELETE CASCADE
        )
      `;

      const createDlangTable = `
        CREATE TABLE IF NOT EXISTS dlang_movies (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          year INTEGER,
          language TEXT,
          genre TEXT,
          director TEXT,
          rating REAL,
          poster_url TEXT,
          notes TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
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
                  console.error("[DB] Error creating movie_details table:", err.message);
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
                      resolve();
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
