import axios from "axios";

const API_BASE_URL = "/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
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
    const message =
      error.response?.data?.error || error.message || "An error occurred";
    console.error("API Error:", message);
    return Promise.reject(new Error(message));
  }
);

export const entryService = {
  // Get all entries
  getAll: () => apiClient.get("/entries"),

  // Get single entry by ID
  getById: (id) => apiClient.get(`/entries/${id}`),

  // Create new entry
  create: (data) => apiClient.post("/entries", data),

  // Update entry
  update: (id, data) => apiClient.put(`/entries/${id}`, data),

  // Delete entry
  delete: (id) => apiClient.delete(`/entries/${id}`),

  // Get statistics
  getStatistics: () => apiClient.get("/entries/stats"),
};

export default apiClient;
