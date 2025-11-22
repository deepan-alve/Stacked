# Movie Tracker - Full Stack Application

A modern, full-stack movie/series/anime/book tracking application built with React and Express.

## 🏗️ Architecture

### Backend
- **Framework**: Express.js with ES modules
- **Database**: SQLite3
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
│   │   │   └── database.js       # Database connection & queries
│   │   ├── models/
│   │   │   └── entryModel.js     # Data access layer
│   │   ├── controllers/
│   │   │   └── entryController.js # Business logic
│   │   ├── routes/
│   │   │   └── entries.js        # API routes
│   │   └── server.js             # Express app setup
│   ├── .env                      # Environment variables
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/           # React components (in App.jsx)
│   │   ├── hooks/
│   │   │   └── useEntries.js     # Custom hook for data
│   │   ├── services/
│   │   │   └── api.js            # API client
│   │   ├── App.jsx               # Main application
│   │   ├── main.jsx              # React entry point
│   │   └── index.css             # Tailwind styles
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

### Frontend Development
```powershell
cd frontend
npm run dev  # Vite dev server with HMR
```

### Build for Production
```powershell
cd frontend
npm run build
```

## 🔧 Configuration

### Backend (.env)
```env
PORT=3000
DB_PATH=../movies.db
NODE_ENV=development
```

### Frontend (vite.config.js)
- Proxy configured to forward `/api` requests to backend
- Port: 5173

## 📦 Dependencies

### Backend
- express: Web framework
- sqlite3: Database
- cors: Cross-origin resource sharing
- dotenv: Environment variables

### Frontend
- react & react-dom: UI library
- vite: Build tool
- tailwindcss: Styling
- lucide-react: Icons
- axios: HTTP client

## 🎯 Best Practices Implemented

1. **Separation of Concerns**: MVC architecture in backend
2. **Custom Hooks**: Reusable logic with `useEntries`
3. **API Service Layer**: Centralized API calls with interceptors
4. **Error Handling**: Try-catch blocks and user-friendly messages
5. **TypeScript-Ready**: ES modules structure
6. **Environment Variables**: Configuration management
7. **Responsive Design**: Mobile-first approach
8. **Loading States**: User feedback during async operations
9. **Form Validation**: Required fields and input constraints
10. **Database Promises**: Async/await pattern throughout

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