import axios from "axios";

const API_BASE_URL = "/api/auth";

const authClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important: send cookies with requests
});

export const authService = {
  /**
   * Login with email and password
   * Server sets HTTP-only cookies
   */
  login: async (email, password) => {
    const response = await authClient.post("/login", { email, password });
    return response.data;
  },

  /**
   * Sign up new user
   */
  signup: async (email, password) => {
    const response = await authClient.post("/signup", { email, password });
    return response.data;
  },

  /**
   * Logout - clears cookies on server
   */
  logout: async () => {
    const response = await authClient.post("/logout");
    return response.data;
  },

  /**
   * Get current user from session cookie
   */
  getCurrentUser: async () => {
    try {
      const response = await authClient.get("/me");
      return response.data.user;
    } catch (error) {
      if (error.response?.status === 401) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Refresh the session
   */
  refresh: async () => {
    try {
      const response = await authClient.post("/refresh");
      return response.data.user;
    } catch (error) {
      return null;
    }
  },
};

export default authService;
