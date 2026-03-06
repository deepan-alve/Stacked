import express from "express";
import { body, validationResult } from "express-validator";
import database from "../config/database.js";
import {
  setAuthCookies,
  clearAuthCookies,
  generateAccessToken,
  generateRefreshToken,
  hashPassword,
  verifyPassword,
  needsPasswordRehash,
  verifyToken,
  requireAuth,
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

const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

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

    try {
      // Get user from database
      const user = await new Promise((resolve, reject) => {
        database.db.get(
          "SELECT * FROM users WHERE email = ?",
          [email],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      const isValidPassword = await verifyPassword(password, user?.password);

      if (!user || !isValidPassword) {
        console.error("[AUTH] Login failed: invalid credentials");
        // Generic error message to prevent user enumeration
        return res.status(401).json({ error: "Invalid email or password" });
      }

      if (needsPasswordRehash(user.password)) {
        const upgradedHash = await hashPassword(password);
        await new Promise((resolve, reject) => {
          database.db.run(
            "UPDATE users SET password = ? WHERE id = ?",
            [upgradedHash, user.id],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }

      console.log("[AUTH] Login successful for:", email);

      // Generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // Set HTTP-only cookies
      setAuthCookies(res, accessToken, refreshToken);

      console.log("[AUTH] Cookies set for user:", user.id);

      // Return user info (without tokens - never expose tokens to client)
      res.json({
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
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

    try {
      const hashedPassword = await hashPassword(password);

      // Check if user already exists
      const existingUser = await new Promise((resolve, reject) => {
        database.db.get(
          "SELECT id FROM users WHERE email = ?",
          [email],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Create new user
      const result = await new Promise((resolve, reject) => {
        database.db.run(
          "INSERT INTO users (email, password, created_at) VALUES (?, ?, datetime('now'))",
          [email, hashedPassword],
          function (err) {
            if (err) reject(err);
            else resolve({ id: this.lastID });
          }
        );
      });

      console.log("[AUTH] User created:", email, "ID:", result.id);

      // Get the created user
      const newUser = await new Promise((resolve, reject) => {
        database.db.get(
          "SELECT id, email, created_at FROM users WHERE id = ?",
          [result.id],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      // Generate tokens
      const accessToken = generateAccessToken(newUser);
      const refreshToken = generateRefreshToken(newUser);

      // Set HTTP-only cookies
      setAuthCookies(res, accessToken, refreshToken);

      res.json({
        user: {
          id: newUser.id,
          email: newUser.email,
          created_at: newUser.created_at,
        },
      });
    } catch (error) {
      console.error("[AUTH] Signup error:", error.message);
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
  const accessToken = req.cookies?.["access-token"];

  if (!accessToken) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const decoded = verifyToken(accessToken);

    if (!decoded || decoded.type === "refresh") {
      clearAuthCookies(res);
      return res.status(401).json({ error: "Invalid session" });
    }

    // Get user from database
    const user = await new Promise((resolve, reject) => {
      database.db.get(
        "SELECT id, email, display_name, bio, created_at FROM users WHERE id = ?",
        [decoded.id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!user) {
      clearAuthCookies(res);
      return res.status(401).json({ error: "User not found" });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name || null,
        bio: user.bio || null,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error("[AUTH] Get user error:", error);
    res.status(500).json({ error: "Failed to get user" });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh the session using the refresh token cookie
 */
router.post("/refresh", async (req, res) => {
  const refreshToken = req.cookies?.["refresh-token"];

  if (!refreshToken) {
    return res.status(401).json({ error: "No refresh token" });
  }

  try {
    const decoded = verifyToken(refreshToken);

    if (!decoded || decoded.type !== "refresh") {
      clearAuthCookies(res);
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    // Get user from database
    const user = await new Promise((resolve, reject) => {
      database.db.get(
        "SELECT id, email FROM users WHERE id = ?",
        [decoded.id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!user) {
      clearAuthCookies(res);
      return res.status(401).json({ error: "User not found" });
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    setAuthCookies(res, newAccessToken, newRefreshToken);

    res.json({
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("[AUTH] Refresh error:", error);
    res.status(500).json({ error: "Failed to refresh session" });
  }
});

/**
 * PUT /api/auth/profile
 * Update display name and bio
 */
router.put("/profile", requireAuth, async (req, res) => {
  const { display_name, bio } = req.body;
  const userId = req.user.id;

  try {
    await new Promise((resolve, reject) => {
      database.db.run(
        "UPDATE users SET display_name = ?, bio = ? WHERE id = ?",
        [display_name || null, bio || null, userId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    const user = await new Promise((resolve, reject) => {
      database.db.get(
        "SELECT id, email, display_name, bio, created_at FROM users WHERE id = ?",
        [userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name || null,
        bio: user.bio || null,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error("[AUTH] Profile update error:", error.message);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

/**
 * PUT /api/auth/password
 * Change password (requires current password)
 */
router.put("/password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Current and new password are required" });
  }

  if (newPassword.length < 8 || !STRONG_PASSWORD_REGEX.test(newPassword)) {
    return res.status(400).json({
      error:
        "New password must be at least 8 characters with uppercase, lowercase, and number",
    });
  }

  try {
    const user = await new Promise((resolve, reject) => {
      database.db.get(
        "SELECT id, password FROM users WHERE id = ?",
        [userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    const isValidPassword = await verifyPassword(currentPassword, user?.password);
    if (!user || !isValidPassword) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const hashedNew = await hashPassword(newPassword);

    await new Promise((resolve, reject) => {
      database.db.run(
        "UPDATE users SET password = ? WHERE id = ?",
        [hashedNew, userId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("[AUTH] Password change error:", error.message);
    res.status(500).json({ error: "Failed to change password" });
  }
});

export default router;
