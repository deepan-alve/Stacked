# IMDB API Integration Documentation

This system integrates with [imdbapi.dev](https://imdbapi.dev/) to provide comprehensive IMDB data access.

## Base URL
```
http://localhost:3000/api/imdb
```

## Available Endpoints

### 1. Search IMDB Titles
**Endpoint:** `GET /api/imdb/search`

Search for movies, TV shows, and other titles on IMDB.

**Query Parameters:**
- `q` (required): Search query string
- `type` (optional): Filter by type (`movie`, `series`, `episode`, etc.)
- `year` (optional): Filter by release year
- `page` (optional): Page number for pagination (default: 1)

**Example Request:**
```bash
GET /api/imdb/search?q=Inception&type=movie&year=2010
```

**Example Response:**
```json
{
  "success": true,
  "query": "Inception",
  "filters": {
    "type": "movie",
    "year": "2010",
    "page": 1
  },
  "count": 5,
  "results": [
    {
      "imdbId": "tt1375666",
      "title": "Inception",
      "year": 2010,
      "type": "Movie",
      "poster": "https://m.media-amazon.com/images/...",
      "rating": 8.8,
      "plot": "A thief who steals corporate secrets...",
      "genres": ["Action", "Sci-Fi", "Thriller"],
      "stars": ["Leonardo DiCaprio", "Joseph Gordon-Levitt"],
      "provider": "imdb"
    }
  ]
}
```

---

### 2. Get Title Details
**Endpoint:** `GET /api/imdb/title/:imdbId`

Get comprehensive details for a specific IMDB title.

**URL Parameters:**
- `imdbId` (required): IMDB ID (e.g., `tt1375666`)

**Example Request:**
```bash
GET /api/imdb/title/tt1375666
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "imdbId": "tt1375666",
    "title": "Inception",
    "originalTitle": "Inception",
    "year": 2010,
    "releaseDate": "2010-07-16",
    "runtime": "2h 28min",
    "runtimeMinutes": 148,
    "type": "Movie",
    "genres": ["Action", "Sci-Fi", "Thriller"],
    "plot": "A thief who steals corporate secrets through the use of dream-sharing technology...",
    "plotSummary": "Dom Cobb is a skilled thief, the absolute best...",
    "poster": "https://m.media-amazon.com/images/...",
    "rating": 8.8,
    "ratingCount": 2300000,
    "contentRating": "PG-13",
    "directors": ["Christopher Nolan"],
    "writers": ["Christopher Nolan"],
    "stars": ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Elliot Page"],
    "cast": [
      {
        "name": "Leonardo DiCaprio",
        "character": "Cobb"
      }
    ],
    "tagline": "Your mind is the scene of the crime",
    "keywords": ["dream", "subconscious", "heist"],
    "languages": ["English", "Japanese", "French"],
    "countries": ["USA", "UK"],
    "awards": "Won 4 Oscars. 157 wins & 220 nominations total",
    "boxOffice": {
      "budget": "$160,000,000",
      "openingWeekend": "$62,785,337",
      "gross": "$292,576,195",
      "cumulativeWorldwide": "$836,848,102"
    },
    "productionCompanies": ["Warner Bros.", "Legendary Pictures"],
    "trailer": "https://www.youtube.com/watch?v=...",
    "imdbUrl": "https://www.imdb.com/title/tt1375666/",
    "provider": "imdb"
  }
}
```

---

### 3. Get Top Rated
**Endpoint:** `GET /api/imdb/top-rated`

Get the top rated movies and TV shows from IMDB.

**Query Parameters:**
- `limit` (optional): Number of results to return (default: 50, max: 250)

**Example Request:**
```bash
GET /api/imdb/top-rated?limit=10
```

**Example Response:**
```json
{
  "success": true,
  "limit": 10,
  "count": 10,
  "results": [
    {
      "imdbId": "tt0111161",
      "title": "The Shawshank Redemption",
      "year": 1994,
      "type": "Movie",
      "poster": "https://m.media-amazon.com/images/...",
      "rating": 9.3,
      "rank": 1,
      "provider": "imdb"
    }
  ]
}
```

---

### 4. Get Popular Titles
**Endpoint:** `GET /api/imdb/popular`

Get currently popular movies and TV shows.

**Query Parameters:**
- `limit` (optional): Number of results to return (default: 50, max: 250)

**Example Request:**
```bash
GET /api/imdb/popular?limit=20
```

**Example Response:**
```json
{
  "success": true,
  "limit": 20,
  "count": 20,
  "results": [
    {
      "imdbId": "tt15398776",
      "title": "Oppenheimer",
      "year": 2023,
      "type": "Movie",
      "poster": "https://m.media-amazon.com/images/...",
      "rating": 8.4,
      "provider": "imdb"
    }
  ]
}
```

---

### 5. Get Poster URL
**Endpoint:** `GET /api/imdb/poster/:imdbId`

Get the poster image URL for a specific title.

**URL Parameters:**
- `imdbId` (required): IMDB ID (e.g., `tt1375666`)

**Example Request:**
```bash
GET /api/imdb/poster/tt1375666
```

**Example Response:**
```json
{
  "success": true,
  "imdbId": "tt1375666",
  "posterUrl": "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_.jpg"
}
```

---

### 6. Extract IMDB ID from URL
**Endpoint:** `POST /api/imdb/extract-id`

Extract the IMDB ID from an IMDB URL.

**Request Body:**
```json
{
  "url": "https://www.imdb.com/title/tt1375666/"
}
```

**Example Response:**
```json
{
  "success": true,
  "url": "https://www.imdb.com/title/tt1375666/",
  "imdbId": "tt1375666"
}
```

---

## Legacy Search Endpoints

These endpoints are also available through the unified search API:

### Search via unified API
**Endpoint:** `GET /api/search/imdb`

**Query Parameters:**
- `query` (required): Search query
- `type`, `year`, `page`: Same as above

### Get details via unified API
**Endpoint:** `GET /api/search/imdb/:imdbId`

---

## Error Responses

All endpoints return standardized error responses:

```json
{
  "success": false,
  "error": "Error description",
  "message": "Detailed error message"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (missing/invalid parameters)
- `404` - Not Found
- `500` - Internal Server Error

---

## Usage Examples

### Example 1: Search and Get Details
```javascript
// Search for a movie
const searchResponse = await fetch('/api/imdb/search?q=The Matrix&type=movie');
const searchData = await searchResponse.json();

// Get detailed information
const imdbId = searchData.results[0].imdbId;
const detailsResponse = await fetch(`/api/imdb/title/${imdbId}`);
const details = await detailsResponse.json();
```

### Example 2: Get Top Rated Movies
```javascript
const response = await fetch('/api/imdb/top-rated?limit=50');
const data = await response.json();
const topMovies = data.results;
```

### Example 3: Extract ID and Get Poster
```javascript
// Extract IMDB ID from URL
const extractResponse = await fetch('/api/imdb/extract-id', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: 'https://www.imdb.com/title/tt1375666/' })
});
const { imdbId } = await extractResponse.json();

// Get poster URL
const posterResponse = await fetch(`/api/imdb/poster/${imdbId}`);
const { posterUrl } = await posterResponse.json();
```

---

## Features

- ✅ **Full text search** with filters (type, year, pagination)
- ✅ **Detailed information** including cast, crew, ratings, box office
- ✅ **Top rated** movies and shows
- ✅ **Popular** trending titles
- ✅ **Poster URLs** for all titles
- ✅ **IMDB ID extraction** from URLs
- ✅ **Type normalization** to match system standards
- ✅ **Error handling** with descriptive messages
- ✅ **Rate limiting friendly** with proper delays

---

## Notes

- The IMDB API (imdbapi.dev) is free and doesn't require an API key
- All responses are cached and optimized for performance
- The service automatically normalizes IMDB types to match your system
- IMDB IDs can be provided with or without the 'tt' prefix
- Poster URLs are high-quality direct links to Amazon CDN

---

## Integration with Existing System

The IMDB service is now integrated into your existing search system:

1. **Service Layer**: `src/services/imdb.js`
2. **Controller**: `src/controllers/searchController.js` (updated)
3. **Routes**: 
   - Dedicated: `src/routes/imdb.js`
   - Unified: `src/routes/search.js` (updated)
4. **Server**: `src/server.js` (updated to include IMDB routes)

You can use IMDB data alongside TMDB, AniList, and Open Library data for comprehensive media information.
