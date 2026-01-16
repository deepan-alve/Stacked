import pkg from "sqlite3";
const { Database: SQLiteDatabase } = pkg.verbose();
import path from "path";
import { fileURLToPath } from "url";

// TMDB API for fetching posters
const TMDB_API_KEY = "***REMOVED_TMDB_KEY***";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

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

      // Update password for deepanalve@gmail.com
      const newPasswordHash = '370bef004aa7146e8f2221c70380a55205083b94104758824c3f2732677998d2';
      await new Promise((resolve) => {
        this.db.run(
          `UPDATE users SET password = ? WHERE email = ?`,
          [newPasswordHash, 'deepanalve@gmail.com'],
          (err) => {
            if (err) {
              console.log("[DB] Password update error:", err.message);
            } else {
              console.log("[DB] ✓ Password updated for deepanalve@gmail.com");
            }
            resolve();
          }
        );
      });

      // Add 2026 movies data (one-time migration)
      const movies2026 = [
        { title: 'Thenali', type: 'Movie', rating: 3.5, year: 2026, watch_date: '2026-01-14', created_at: '2026-01-13T20:48:26.276Z' },
        { title: 'The Family Man', type: 'Series', rating: 2.5, year: 2026, watch_date: '2026-01-11', created_at: '2026-01-13T21:11:48.259Z' },
        { title: 'Uri: The Surgical Strike', type: 'Movie', rating: 3.5, year: 2026, watch_date: '2026-01-03', created_at: '2026-01-14T08:30:14.784Z' },
        { title: 'Monster', type: 'Anime', rating: 4.0, year: 2026, watch_date: '2026-01-04', created_at: '2026-01-14T09:07:43.189Z' },
        { title: 'The Hangover', type: 'Movie', rating: 3.5, year: 2026, watch_date: '2026-01-09', created_at: '2026-01-14T09:11:10.599Z' },
        { title: 'Central Intelligence', type: 'Movie', rating: 2.5, year: 2026, watch_date: '2026-01-05', created_at: '2026-01-14T09:12:15.882Z' },
        { title: 'Wrath of Man', type: 'Movie', rating: 3.0, year: 2026, watch_date: '2026-01-10', created_at: '2026-01-14T09:15:58.311Z' },
        { title: 'The Beekeeper', type: 'Movie', rating: 2.5, year: 2026, watch_date: '2026-01-10', created_at: '2026-01-14T09:16:39.274Z' },
        { title: 'The Bad Guys', type: 'Movie', rating: 4.0, year: 2026, watch_date: '2026-01-06', created_at: '2026-01-14T09:17:15.690Z' },
        { title: 'The Bad Guys 2', type: 'Movie', rating: 2.5, year: 2026, watch_date: '2026-01-06', created_at: '2026-01-14T09:17:34.749Z' },
        { title: 'Hacksaw Ridge', type: 'Movie', rating: 4.5, year: 2026, watch_date: '2026-01-07', created_at: '2026-01-14T09:18:18.537Z' },
        { title: 'Shutter Island', type: 'Movie', rating: 4.0, year: 2026, watch_date: '2026-01-08', created_at: '2026-01-14T09:20:23.961Z' },
        { title: '12th Fail', type: 'Movie', rating: 4.5, year: 2026, watch_date: '2026-01-11', created_at: '2026-01-14T09:20:49.609Z' },
        { title: 'Zombieland', type: 'Movie', rating: 3.0, year: 2026, watch_date: '2026-01-08', created_at: '2026-01-14T09:21:44.521Z' },
        { title: 'Parasakthi', type: 'Movie', rating: 2.5, year: 2026, watch_date: '2026-01-10', created_at: '2026-01-14T09:23:00.201Z' },
        { title: 'Mannan', type: 'Movie', rating: 3.0, year: 2026, watch_date: '2026-01-11', created_at: '2026-01-14T09:24:03.066Z' },
        { title: 'Pistha', type: 'Movie', rating: 3.0, year: 2026, watch_date: '2026-01-13', created_at: '2026-01-14T09:24:24.629Z' },
        { title: 'Stranger Things', type: 'Series', rating: 2.0, year: 2026, watch_date: '2026-01-01', created_at: '2026-01-14T09:24:50.124Z' },
        { title: 'Gentleman', type: 'Movie', rating: 3.0, year: 2026, watch_date: '2026-01-12', created_at: '2026-01-14T09:31:27.744Z' },
        { title: 'Argo', type: 'Movie', rating: 4.5, year: 2026, watch_date: '2026-01-11', created_at: '2026-01-14T09:33:28.473Z' },
        { title: 'Kill', type: 'Movie', rating: 4.0, year: 2026, watch_date: '2026-01-10', created_at: '2026-01-14T09:34:02.103Z' },
        { title: 'Snowpiercer', type: 'Movie', rating: 3.5, year: 2026, watch_date: '2026-01-09', created_at: '2026-01-14T09:37:02.868Z' },
        { title: 'Theri', type: 'Movie', rating: 3.5, year: 2026, watch_date: '2026-01-09', created_at: '2026-01-14T09:49:16.681Z' },
      ];

      for (const movie of movies2026) {
        // Check if movie already exists
        const exists = await new Promise((resolve) => {
          this.db.get(
            `SELECT id FROM movies WHERE title = ? AND year = ? AND user_id = 1`,
            [movie.title, movie.year],
            (err, row) => resolve(row ? true : false)
          );
        });

        if (!exists) {
          await new Promise((resolve) => {
            this.db.run(
              `INSERT INTO movies (user_id, title, type, rating, year, watch_date, created_at, updated_at) VALUES (1, ?, ?, ?, ?, ?, ?, ?)`,
              [movie.title, movie.type, movie.rating, movie.year, movie.watch_date, movie.created_at, movie.created_at],
              (err) => {
                if (err) {
                  console.log(`[DB] Error inserting ${movie.title}:`, err.message);
                }
                resolve();
              }
            );
          });
        }
      }
      console.log("[DB] ✓ 2026 movies data migration complete");

      // Fetch posters for movies without images
      const moviesWithoutPosters = await new Promise((resolve) => {
        this.db.all(
          `SELECT id, title, type FROM movies WHERE (poster_url IS NULL OR poster_url = '') AND user_id = 1`,
          [],
          (err, rows) => resolve(rows || [])
        );
      });

      if (moviesWithoutPosters.length > 0) {
        console.log(`[DB] Fetching posters for ${moviesWithoutPosters.length} entries...`);

        for (const movie of moviesWithoutPosters) {
          try {
            let posterUrl = null;
            const searchType = movie.type.toLowerCase();

            if (searchType === 'movie') {
              const response = await fetch(
                `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(movie.title)}`
              );
              const data = await response.json();
              if (data.results && data.results[0] && data.results[0].poster_path) {
                posterUrl = `${TMDB_IMAGE_BASE}${data.results[0].poster_path}`;
              }
            } else if (searchType === 'series') {
              const response = await fetch(
                `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(movie.title)}`
              );
              const data = await response.json();
              if (data.results && data.results[0] && data.results[0].poster_path) {
                posterUrl = `${TMDB_IMAGE_BASE}${data.results[0].poster_path}`;
              }
            } else if (searchType === 'anime') {
              // Use AniList for anime
              const query = `query ($search: String) { Media(search: $search, type: ANIME) { coverImage { large } } }`;
              const response = await fetch('https://graphql.anilist.co', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, variables: { search: movie.title } })
              });
              const data = await response.json();
              if (data.data?.Media?.coverImage?.large) {
                posterUrl = data.data.Media.coverImage.large;
              }
            }

            if (posterUrl) {
              await new Promise((resolve) => {
                this.db.run(
                  `UPDATE movies SET poster_url = ? WHERE id = ?`,
                  [posterUrl, movie.id],
                  (err) => {
                    if (!err) console.log(`[DB] ✓ Poster fetched for: ${movie.title}`);
                    resolve();
                  }
                );
              });
            }

            // Small delay to avoid rate limiting
            await new Promise(r => setTimeout(r, 200));
          } catch (error) {
            console.log(`[DB] Failed to fetch poster for ${movie.title}:`, error.message);
          }
        }
        console.log("[DB] ✓ Poster migration complete");
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
