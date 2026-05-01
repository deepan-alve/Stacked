<div align="center">

# Stacked

**Self-hosted tracker for movies, series, anime, and books.**

[![Live](https://img.shields.io/badge/Live-stacked.deepanalve.dev-D4A655?style=flat&logo=vercel&logoColor=white)](https://stacked.deepanalve.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Express](https://img.shields.io/badge/Express-4-000?logo=express&logoColor=white)](https://expressjs.com)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white)](https://sqlite.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose)
[![License](https://img.shields.io/badge/License-AGPLv3-blue.svg)](LICENSE)

[**🔗 Live demo →**](https://stacked.deepanalve.dev/)

</div>

<br/>

<p align="center">
  <img src="docs/screenshots/landing.png" alt="Stacked landing page" width="900"/>
</p>

A Letterboxd-style tracker you can run on your own server. Log what you've watched or read, rate it, set yearly goals, and pull in metadata from IMDb / TMDb / OMDb. One database for movies, series, anime, and books. The whole thing is a single `docker-compose up` away.

## Preview

<table>
  <tr>
    <td width="58%" valign="top">
      <img src="docs/screenshots/stats.png" alt="Stats dashboard"/>
      <br/>
      <sub><b>Stats dashboard</b> — streaks, ratings, monthly activity, collection distribution, rating distribution, top rated</sub>
    </td>
    <td width="42%" valign="top">
      <img src="docs/screenshots/library.jpg" alt="Library grid"/>
      <br/>
      <sub><b>Library grid</b> — full collection across movies, series, anime, and books</sub>
    </td>
  </tr>
</table>

## Features

- **Unified library.** One database for movies, series, anime, and books — with type-aware fields (seasons for series, watch dates, etc.).
- **External metadata.** IMDb search and ID lookup with poster, plot, cast, and release-date enrichment. TMDb and OMDb supported as alternate providers (helpful for regional film coverage).
- **Stats dashboard.** Daily watch streaks, monthly activity bars, collection / rating distributions, and a top-rated leaderboard.
- **Goals & activity.** Set yearly watch / read targets and view rolling activity timelines per content type.
- **Recommendations.** Server-side recommendation engine over your library.
- **CSV import / export.** Bring your data in from Letterboxd, Trakt, or anywhere else; export it just as easily.
- **Public sharing.** Generate a public read-only URL for any list.
- **Spotlight search.** Cmd-K style global search across library + external providers.
- **Self-hostable.** SQLite for storage, JWT for auth, Docker Compose for deploy. No external services required.

## Architecture

```
┌────────────────┐      ┌─────────────────────┐      ┌──────────────┐
│  React + Vite  │ ───► │  Express REST API   │ ───► │   SQLite     │
│  (frontend)    │      │  helmet • rate-limit│      │  (data/)     │
│                │      │  validator • JWT    │      │              │
└────────────────┘      └─────────┬───────────┘      └──────────────┘
                                  │
                                  ├─► IMDb / TMDb / OMDb metadata
                                  └─► Optional Supabase auth
```

The backend exposes 14 route modules grouped by domain — `auth`, `entries`, `details`, `search`, `imdb`, `recommendations`, `goals`, `activity`, `share`, `csv`, `backup`, `sync`, `dlang`, `public`. Each follows a controllers / services / models split.

## Tech stack

| Layer    | Tech                                                     |
| -------- | -------------------------------------------------------- |
| Frontend | React 19, Vite, Tailwind                                 |
| Backend  | Node.js, Express 4, ES modules                           |
| Auth     | JWT (with Supabase Auth as optional provider)            |
| Storage  | SQLite (file-based, zero-config)                         |
| Security | helmet, express-rate-limit, express-validator, CORS       |
| Deploy   | Docker Compose / Dokploy / Fly.io                        |

## Quick start

### With Docker (recommended)

```bash
git clone https://github.com/deepan-alve/Stacked.git
cd Stacked
cp .env.example .env       # then fill in JWT_SECRET, optional API keys
docker compose up -d
```

Frontend at <http://localhost:5173>, API at <http://localhost:3000>.

### Without Docker

```bash
# Backend
cd backend
npm install
cp .env.example .env       # set JWT_SECRET
npm run dev                # nodemon on :3000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev                # vite on :5173
```

The SQLite database is created automatically on first run (`backend/data/movies.db`) — no migrations to apply manually.

### Environment variables

| Variable                  | Required | Notes                                                  |
| ------------------------- | -------- | ------------------------------------------------------ |
| `JWT_SECRET`              | yes      | Generate with `openssl rand -hex 32`                   |
| `FRONTEND_URL`            | yes      | Used for CORS and share-link generation                |
| `TMDB_API_KEY`            | optional | Enables TMDb metadata lookup                           |
| `GOOGLE_API_KEY`          | optional | Enables Wikipedia / Google search enrichment           |
| `GOOGLE_SEARCH_ENGINE_ID` | optional | Pairs with `GOOGLE_API_KEY`                            |
| `SUPABASE_URL`            | optional | Drop-in replacement for JWT auth                       |
| `SUPABASE_ANON_KEY`       | optional | Required if using Supabase auth                        |

## Project structure

```
Stacked/
├── backend/
│   ├── src/
│   │   ├── config/         # database, env loader
│   │   ├── controllers/    # request handlers per domain
│   │   ├── middleware/     # auth, validation
│   │   ├── models/         # SQLite query layer
│   │   ├── routes/         # 14 route modules
│   │   ├── services/       # IMDb / TMDb / sync / recommendations
│   │   └── server.js       # Express app entry
│   └── migrations/         # additive schema changes (auto-skipped on fresh installs)
├── frontend/
│   └── src/                # React app, Vite, Tailwind
├── docs/
│   └── screenshots/        # README assets
├── docker-compose.yml
└── .env.example
```

## License

[AGPL-3.0-or-later](LICENSE) — strong network copyleft, see [NOTICE](NOTICE) for terms. Copyright (C) 2026 Deepan Alve
