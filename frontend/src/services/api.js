import axios from "axios";

const API_BASE_URL = "/api";

let isDemoMode = false;

export const setDemoMode = (isDemo) => {
  isDemoMode = isDemo;
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 10000,
});

apiClient.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message
      || error.response?.data?.error
      || error.message
      || "An error occurred";
    console.error("API Error:", message);
    return Promise.reject(new Error(message));
  }
);

export const entryService = {
  getAll: (year = null, options = {}) => {
    const url = isDemoMode ? "/public/entries" : "/entries";
    const params = new URLSearchParams();
    if (year) params.set("year", year);
    if (options.status) params.set("status", options.status);
    if (options.sort) params.set("sort", options.sort);
    if (options.tags) params.set("tags", options.tags);
    const qs = params.toString();
    return apiClient.get(qs ? `${url}?${qs}` : url);
  },

  getById: (id) =>
    apiClient.get(isDemoMode ? `/public/entries/${id}` : `/entries/${id}`),

  create: (data) => {
    if (isDemoMode) return Promise.reject(new Error("DEMO_MODE"));
    return apiClient.post("/entries", data);
  },

  update: (id, data) => {
    if (isDemoMode) return Promise.reject(new Error("DEMO_MODE"));
    return apiClient.put(`/entries/${id}`, data);
  },

  quickRate: (id, rating) => {
    if (isDemoMode) return Promise.reject(new Error("DEMO_MODE"));
    return apiClient.put(`/entries/${id}/quick-rate`, { rating });
  },

  delete: (id) => {
    if (isDemoMode) return Promise.reject(new Error("DEMO_MODE"));
    return apiClient.delete(`/entries/${id}`);
  },

  getStatistics: () =>
    apiClient.get(isDemoMode ? "/public/stats" : "/entries/stats"),

  checkDuplicate: (title, api_id = null, api_provider = null) => {
    let url = `/entries/check-duplicate?title=${encodeURIComponent(title)}`;
    if (api_id) url += `&api_id=${api_id}`;
    if (api_provider) url += `&api_provider=${api_provider}`;
    return apiClient.get(url);
  },

  getAvailableYears: () =>
    apiClient.get(isDemoMode ? "/public/years" : "/entries/years"),
};

export const searchService = {
  searchMovies: (query) =>
    apiClient.get(`/search/movies?query=${encodeURIComponent(query)}`),
  searchSeries: (query) =>
    apiClient.get(`/search/series?query=${encodeURIComponent(query)}`),
  searchAnime: (query) =>
    apiClient.get(`/search/anime?query=${encodeURIComponent(query)}`),
  searchBooks: (query) =>
    apiClient.get(`/search/books?query=${encodeURIComponent(query)}`),
  getDetails: (type, id) => apiClient.get(`/search/${type}/${id}`),
};

export const goalService = {
  getAll: () => apiClient.get("/goals"),
  create: (data) => apiClient.post("/goals", data),
  update: (id, data) => apiClient.put(`/goals/${id}`, data),
  delete: (id) => apiClient.delete(`/goals/${id}`),
};

export const activityService = {
  getRecent: (limit = 50) => apiClient.get(`/activity?limit=${limit}`),
  getStreak: () => apiClient.get("/activity/streak"),
  getHeatmap: (days = 30) => apiClient.get(`/activity/heatmap?days=${days}`),
};

export const shareService = {
  create: (collection, filters = {}) => apiClient.post("/share", { collection, filters }),
  getPublic: (id) => apiClient.get(`/share/${id}/public`),
  getUserLinks: () => apiClient.get("/share"),
  delete: (id) => apiClient.delete(`/share/${id}`),
};

export const csvService = {
  exportCsv: () => apiClient.get("/csv/export", { responseType: "text" }),
  importCsv: (data) => apiClient.post("/csv/import", { data }),
};

export const recommendationService = {
  get: () => apiClient.get("/recommendations"),
};

export default apiClient;
