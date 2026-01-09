import express from "express";
import { body, validationResult } from "express-validator";
import {
  supabase,
  setAuthCookies,
  clearAuthCookies,
} from "../middleware/auth.js";

const router = express.Router();

// Input validation middleware
const validateLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

const validateSignup = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must be at least 8 characters with uppercase, lowercase, and number"
    ),
];

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: errors.array()[0].msg,
      errors: errors.array(),
    });
  }
  next();
};

/**
 * POST /api/auth/login
 * Login with email and password, sets HTTP-only cookies
 */
router.post(
  "/login",
  validateLogin,
  handleValidationErrors,
  async (req, res) => {
    const { email, password } = req.body;

    console.log("[AUTH] Login attempt for:", email);
    console.log("[AUTH] Supabase configured:", !!supabase);
    console.log("[AUTH] Request origin:", req.headers.origin);

    if (!supabase) {
      console.error("[AUTH] CRITICAL: Supabase not configured!");
      console.error(
        "[AUTH] SUPABASE_URL:",
        process.env.SUPABASE_URL ? "SET" : "NOT SET"
      );
      console.error(
        "[AUTH] SUPABASE_SERVICE_KEY:",
        process.env.SUPABASE_SERVICE_KEY ? "SET" : "NOT SET"
      );
      return res.status(500).json({ error: "Auth not configured" });
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("[AUTH] Login failed:", error.message);
        // Generic error message to prevent user enumeration
        return res.status(401).json({ error: "Invalid email or password" });
      }

      console.log("[AUTH] Login successful for:", email);

      // Set HTTP-only cookies
      setAuthCookies(res, data.session);

      console.log("[AUTH] Cookies set for user:", data.user.id);

      // Return user info (without tokens - never expose tokens to client)
      res.json({
        user: {
          id: data.user.id,
          email: data.user.email,
          created_at: data.user.created_at,
        },
      });
    } catch (error) {
      console.error("[AUTH] Login exception:", error.message);
      res.status(500).json({ error: "Login failed" });
    }
  }
);

/**
 * POST /api/auth/signup
 * Sign up new user with email and password
 */
router.post(
  "/signup",
  validateSignup,
  handleValidationErrors,
  async (req, res) => {
    const { email, password } = req.body;

    if (!supabase) {
      return res.status(500).json({ error: "Auth not configured" });
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        // Don't reveal if email exists
        return res.status(400).json({ error: "Could not create account" });
      }

      // If email confirmation is required, don't set cookies yet
      if (!data.session) {
        return res.json({
          message: "Please check your email to confirm your account",
          user: { email: data.user.email },
        });
      }

      // Set HTTP-only cookies
      setAuthCookies(res, data.session);

      res.json({
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      });
    } catch (error) {
      console.error("Signup error:", error.message);
      res.status(500).json({ error: "Signup failed" });
    }
  }
);

/**
 * POST /api/auth/logout
 * Clear auth cookies
 */
router.post("/logout", async (req, res) => {
  clearAuthCookies(res);
  res.json({ message: "Logged out successfully" });
});

/**
 * GET /api/auth/me
 * Get current user from cookie session
 */
router.get("/me", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Auth not configured" });
  }

  const accessToken = req.cookies?.["sb-access-token"];

  if (!accessToken) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      clearAuthCookies(res);
      return res.status(401).json({ error: "Invalid session" });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to get user" });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh the session using the refresh token cookie
 */
router.post("/refresh", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Auth not configured" });
  }

  const refreshToken = req.cookies?.["sb-refresh-token"];

  if (!refreshToken) {
    return res.status(401).json({ error: "No refresh token" });
  }

  try {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      clearAuthCookies(res);
      return res.status(401).json({ error: "Failed to refresh session" });
    }

    setAuthCookies(res, data.session);

    res.json({
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    });
  } catch (error) {
    console.error("Refresh error:", error);
    res.status(500).json({ error: "Failed to refresh session" });
  }
});

export default router;
