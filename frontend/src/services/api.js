import axios from "axios";

const API_BASE_URL = "/api";

// Check if we're in demo mode (can be set by app)
let isDemoMode = false;

export const setDemoMode = (isDemo) => {
  isDemoMode = isDemo;
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important: send cookies with all requests
  timeout: 10000,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // For duplicate errors, pass the full message from backend
    const message = error.response?.data?.message 
      || error.response?.data?.error 
      || error.message 
      || "An error occurred";
    console.error("API Error:", message);
    return Promise.reject(new Error(message));
  }
);

export const entryService = {
  // Get all entries with optional year filter
  getAll: (year = null) => {
    const url = isDemoMode ? "/public/entries" : "/entries";
    return apiClient.get(year ? `${url}?year=${year}` : url);
  },

  // Get single entry by ID
  getById: (id) =>
    apiClient.get(isDemoMode ? `/public/entries/${id}` : `/entries/${id}`),

  // Create new entry
  create: (data) => {
    if (isDemoMode) {
      return Promise.reject(new Error("DEMO_MODE"));
    }
    return apiClient.post("/entries", data);
  },

  // Update entry
  update: (id, data) => {
    if (isDemoMode) {
      return Promise.reject(new Error("DEMO_MODE"));
    }
    return apiClient.put(`/entries/${id}`, data);
  },

  // Delete entry
  delete: (id) => {
    if (isDemoMode) {
      return Promise.reject(new Error("DEMO_MODE"));
    }
    return apiClient.delete(`/entries/${id}`);
  },

  // Get statistics
  getStatistics: () =>
    apiClient.get(isDemoMode ? "/public/stats" : "/entries/stats"),

  // Check for duplicate
  checkDuplicate: (title, api_id = null, api_provider = null) => {
    let url = `/entries/check-duplicate?title=${encodeURIComponent(title)}`;
    if (api_id) url += `&api_id=${api_id}`;
    if (api_provider) url += `&api_provider=${api_provider}`;
    return apiClient.get(url);
  },

  // Get available years
  getAvailableYears: () =>
    apiClient.get(isDemoMode ? "/public/years" : "/entries/years"),
};

export const searchService = {
  // Search movies
  searchMovies: (query) =>
    apiClient.get(`/search/movies?query=${encodeURIComponent(query)}`),

  // Search TV series
  searchSeries: (query) =>
    apiClient.get(`/search/series?query=${encodeURIComponent(query)}`),

  // Search anime
  searchAnime: (query) =>
    apiClient.get(`/search/anime?query=${encodeURIComponent(query)}`),

  // Search books
  searchBooks: (query) =>
    apiClient.get(`/search/books?query=${encodeURIComponent(query)}`),

  // Get details
  getDetails: (type, id) => apiClient.get(`/search/${type}/${id}`),
};

export default apiClient;
