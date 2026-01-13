# Stacked - Movie/Series/Anime Tracker

A modern, full-stack tracking application for movies, series, anime, and books built with React and Express. Fully self-hostable with Dokploy.

## 🚀 Quick Start with Dokploy

### Prerequisites
- A server with Docker installed
- Dokploy installed on your server ([dokploy.com](https://dokploy.com))
- Git repository (GitHub, GitLab, etc.)

### Deployment Steps

1. **Push your code to a git repository**
   ```bash
   git add .
   git commit -m "Ready for Dokploy deployment"
   git push origin main
   ```

2. **In Dokploy Dashboard:**
   - Create a new application
   - Select "Docker Compose" as the type
   - Connect your git repository
   - Dokploy will auto-detect `docker-compose.yml`

3. **Set Environment Variables in Dokploy:**
   ```
   NODE_ENV=production
   JWT_SECRET=your-secure-random-string-here
   FRONTEND_URL=https://yourdomain.com
   TMDB_API_KEY=your-tmdb-key (optional)
   GOOGLE_API_KEY=your-google-key (optional)
   GOOGLE_SEARCH_ENGINE_ID=your-search-id (optional)
   ```

   Generate a secure JWT_SECRET with:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. **Configure Domain:**
   - In Dokploy, add your domain
   - SSL will be automatically configured with Let's Encrypt

5. **Deploy!**
   - Click "Deploy" in Dokploy
   - Your app will be built and deployed automatically

## 🏗️ Architecture

### Backend
- **Framework**: Express.js with ES modules
- **Database**: SQLite3 (file-based, git-committable)
- **Authentication**: JWT with HTTP-only cookies
- **Architecture**: MVC pattern
  - Models: Data access layer
  - Controllers: Business logic
  - Routes: API endpoints
- **API**: RESTful API with proper error handling

### Frontend
- **Framework**: React 18 with Hooks
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Axios with interceptors

## 📁 Project Structure

```
Stacked/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js       # SQLite database connection
│   │   ├── models/
│   │   │   └── entryModel.js     # Data access layer
│   │   ├── controllers/
│   │   │   └── entryController.js # Business logic
│   │   ├── middleware/
│   │   │   └── auth.js           # JWT authentication
│   │   ├── routes/
│   │   │   ├── entries.js        # Main API routes
│   │   │   └── auth.js           # Auth routes
│   │   └── server.js             # Express app setup
│   ├── Dockerfile                # Backend container
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/           # React components
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx   # Authentication context
│   │   ├── hooks/
│   │   │   └── useEntries.js     # Custom hook for data
│   │   ├── services/
│   │   │   ├── api.js            # API client
│   │   │   └── auth.js           # Auth service
│   │   ├── App.jsx               # Main application
│   │   └── main.jsx              # React entry point
│   ├── Dockerfile                # Frontend container
│   └── package.json
│
├── data/                         # SQLite database files
│   └── stacked.db               # Main database (gitignored)
├── backups/                      # Automatic backups
├── docker-compose.yml            # Dokploy configuration
├── dokploy.json                  # Dokploy metadata
├── .env.example                  # Environment template
└── setup.sh                      # Setup script
│   ├── index.html
│   ├── vite.config.js            # Vite configuration
│   ├── tailwind.config.js        # Tailwind configuration
│   └── package.json
│
└── movies.db                     # SQLite database

```

## 🚀 Setup & Installation

### 1. Backend Setup

```powershell
cd backend
npm install
npm start
```

Backend will run on `http://localhost:3000`

### 2. Frontend Setup

```powershell
cd frontend
npm install
npm run dev
```

Frontend will run on `http://localhost:5173`

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/entries` | Get all entries |
| GET | `/api/entries/:id` | Get single entry |
| POST | `/api/entries` | Create new entry |
| PUT | `/api/entries/:id` | Update entry |
| DELETE | `/api/entries/:id` | Delete entry |
| GET | `/api/entries/stats` | Get statistics |
| GET | `/api/health` | Health check |

## 📊 Features

### ✅ Implemented
- CRUD operations for movies, series, anime, and books
- Real-time search functionality
- Filter by type (All, Movie, Series, Anime, Book)
- Statistics dashboard with:
  - Total counts by type
  - Average ratings per type
  - Collection distribution charts
- Rating system (0-10)
- Season tracking for Series/Anime
- Notes field for each entry
- Responsive dark theme UI
- Modal-based entry editor
- SQLite database persistence
- Proper error handling
- Loading states

### 🎨 UI Features
- Modern dark theme matching original design
- Smooth animations and transitions
- Responsive layout (mobile, tablet, desktop)
- Custom scrollbars
- Glassmorphism effects
- Icon-based navigation
- Visual indicators for entry types

## 🛠️ Development

### Backend Development
```powershell
cd backend
npm run dev  # Uses nodemon for auto-reload
```

## 💻 Local Development

### Prerequisites
- Node.js 20+ and npm
- Docker and Docker Compose (optional)

### Method 1: Docker Compose (Recommended)
```bash
# Clone the repository
git clone <your-repo-url>
cd Stacked

# Run setup script
chmod +x setup.sh
./setup.sh

# Edit .env file with your configuration
nano .env

# Start with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Method 2: Local Development (Without Docker)
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Start backend (from backend directory)
npm run dev

# Start frontend (from frontend directory, in another terminal)
npm run dev
```

### Frontend Development
```bash
cd frontend
npm run dev  # Vite dev server with HMR at http://localhost:5173
```

### Backend Development
```bash
cd backend
npm run dev  # Nodemon with auto-reload at http://localhost:3000
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory (or set in Dokploy UI):

```env
# Required
NODE_ENV=production
JWT_SECRET=your-secure-random-string-here
FRONTEND_URL=https://yourdomain.com

# Database
DB_PATH=/app/data/stacked.db
BACKUP_INTERVAL_HOURS=6

# Optional - Enhanced Features
TMDB_API_KEY=your-tmdb-api-key
GOOGLE_API_KEY=your-google-api-key
GOOGLE_SEARCH_ENGINE_ID=your-search-engine-id

# Frontend Build
VITE_API_URL=http://backend:3000
```

## 📊 Database Management

### SQLite Database
- **Location**: `data/stacked.db`
- **Type**: File-based SQLite3
- **Backups**: Automatic backups every 6 hours to `backups/` directory

### Committing Database to Git

By default, the database is **not** committed to git. To commit it:

1. Edit `data/.gitignore` and comment out the `*.db` line
2. Commit the database:
   ```bash
   git add data/stacked.db
   git commit -m "Add database to repository"
   git push
   ```

**Note**: Only commit the database if it's small and doesn't contain sensitive data.

### Database Schema
- **users**: Authentication (email, password hash)
- **movies**: Main entries (movies, series, anime, books)
- **movie_details**: Extended information from IMDB/Wikipedia
- **dlang_movies**: Regional/dubbed content tracking

## 🔐 Authentication

- **Method**: JWT (JSON Web Tokens)
- **Storage**: HTTP-only cookies (secure, not accessible via JavaScript)
- **Password**: SHA-256 hashed
- **Token Expiry**: 7 days (access), 30 days (refresh)

### First User
The app doesn't have a default admin account. Sign up with the first account to get started.

## 📦 Dependencies

### Backend
- express: Web framework
- sqlite3: Database
- jsonwebtoken: JWT authentication
- cors: Cross-origin resource sharing
- helmet: Security headers
- express-rate-limit: Rate limiting
- express-validator: Input validation

### Frontend
- react & react-dom: UI library
- vite: Build tool
- tailwindcss: Styling
- lucide-react: Icons
- axios: HTTP client

## 🎯 Features

- ✅ Track movies, TV series, anime, and books
- ✅ JWT-based authentication
- ✅ Auto-fetch posters and details from TMDB
- ✅ Search IMDb integration
- ✅ Wikipedia content scraping
- ✅ Automatic database backups
- ✅ Responsive design
- ✅ Docker support
- ✅ Dokploy-ready deployment
- ✅ SQLite (no external database needed)

## 🔄 Updates and Maintenance

### Updating the App
With Dokploy:
```bash
# Just push to your git repository
git add .
git commit -m "Update app"
git push

# Dokploy will auto-deploy on git push (if configured)
# Or manually trigger deploy in Dokploy UI
```

### Backup and Restore
Backups are automatic every 6 hours. To manually backup:
```bash
# Backup
docker-compose exec backend node scripts/gitBackup.js

# Restore
docker-compose exec backend cp /app/backups/backup-name.db /app/data/stacked.db
docker-compose restart backend
```

## 🐛 Troubleshooting

### Database locked error
```bash
# Stop containers
docker-compose down

# Remove lock files
rm data/*.db-journal data/*.db-wal data/*.db-shm

# Restart
docker-compose up -d
```

### Authentication issues
```bash
# Verify JWT_SECRET is set
docker-compose exec backend printenv | grep JWT_SECRET

# Clear cookies in browser
# Or use incognito mode
```

### Port conflicts
Edit `docker-compose.yml` and change the ports:
```yaml
ports:
  - "8080:80"  # Change 8080 to your preferred port
```

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

````

## 🚦 Running Both Servers

Open two terminal windows:

**Terminal 1 - Backend:**
```powershell
cd backend
npm start
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
```

Then open `http://localhost:5173` in your browser!

## 📝 Notes

- Database file (`movies.db`) is shared between old and new setup
- Frontend proxies API calls to avoid CORS issues
- All 265 existing movies will be displayed
- Original HTML file preserved for reference

## 🎨 Design System

- **Font**: Inter
- **Color Scheme**: Dark (zinc palette)
- **Primary Actions**: White/zinc-100
- **Borders**: zinc-800
- **Background**: #09090b (zinc-950)
- **Accent Colors**:
  - Movie: Indigo
  - Series: Violet
  - Anime: Pink
  - Book: Emerald


# Get all entries
Invoke-RestMethod -Uri http://localhost:3000/api/entries

# Get single entry by ID
Invoke-RestMethod -Uri http://localhost:3000/api/entries/1

# Create new entry
$body = @{title='Movie Name'; type='Movie'; rating=8.5; season=1; notes='Notes'} | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:3000/api/entries -Method Post -Body $body -ContentType 'application/json'

# Update entry
$body = @{title='Updated Title'; type='Movie'; rating=9.0} | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:3000/api/entries/1 -Method Put -Body $body -ContentType 'application/json'

# Delete entry
Invoke-RestMethod -Uri http://localhost:3000/api/entries/1 -Method Delete

# Get statistics
Invoke-RestMethod -Uri http://localhost:3000/api/entries/stats


/// I came into integration branch 