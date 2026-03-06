import jwt from "jsonwebtoken";
import crypto from "crypto";
import { promisify } from "util";
import database from "../config/database.js";
import { SYNC_ADMIN_EMAILS, isProduction } from "../config/env.js";

const JWT_SECRET =
  process.env.JWT_SECRET || (isProduction ? null : "dev-only-insecure-secret");
const JWT_EXPIRES_IN = "7d"; // 7 days
const JWT_REFRESH_EXPIRES_IN = "30d"; // 30 days
const SCRYPT_PREFIX = "scrypt";
const SCRYPT_KEYLEN = 64;
const scryptAsync = promisify(crypto.scrypt);

if (!process.env.JWT_SECRET && !isProduction) {
  console.warn(
    "[AUTH] WARNING: Using a development JWT secret. Set JWT_SECRET before deployment."
  );
}

/**
 * Generate JWT access token
 */
export const generateAccessToken = (user) => {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * Generate JWT refresh token
 */
export const generateRefreshToken = (user) => {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      id: user.id,
      type: "refresh",
    },
    JWT_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );
};

/**
 * Hash password using scrypt with a per-password salt
 */
const hashLegacyPassword = (password) => {
  return crypto.createHash("sha256").update(password).digest("hex");
};

export const hashPassword = async (password) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scryptAsync(password, salt, SCRYPT_KEYLEN);
  return `${SCRYPT_PREFIX}$${salt}$${Buffer.from(derivedKey).toString("hex")}`;
};

export const verifyPassword = async (password, storedHash) => {
  if (!storedHash) return false;

  if (storedHash.startsWith(`${SCRYPT_PREFIX}$`)) {
    const [, salt, storedKeyHex] = storedHash.split("$");
    if (!salt || !storedKeyHex) return false;

    const derivedKey = Buffer.from(
      await scryptAsync(password, salt, SCRYPT_KEYLEN)
    );
    const storedKey = Buffer.from(storedKeyHex, "hex");

    if (derivedKey.length !== storedKey.length) {
      return false;
    }

    return crypto.timingSafeEqual(derivedKey, storedKey);
  }

  return hashLegacyPassword(password) === storedHash;
};

export const needsPasswordRehash = (storedHash) => {
  return !storedHash || !storedHash.startsWith(`${SCRYPT_PREFIX}$`);
};

/**
 * Verify JWT token
 */
export const verifyToken = (token) => {
  if (!JWT_SECRET) {
    return null;
  }

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

const getUserById = async (id) => {
  return database.get("SELECT id, email FROM users WHERE id = ?", [id]);
};

/**
 * Auth middleware that validates the JWT from HTTP-only cookies
 */
export const requireAuth = async (req, res, next) => {
  // Skip auth in development if SKIP_AUTH is set (NEVER use in production)
  if (
    process.env.SKIP_AUTH === "true" &&
    process.env.NODE_ENV !== "production"
  ) {
    req.user = { id: "dev-user", email: "dev@localhost" };
    return next();
  }

  try {
    // Get the access token from HTTP-only cookie
    const accessToken = req.cookies?.["access-token"];
    const refreshToken = req.cookies?.["refresh-token"];

    console.log(
      "[AUTH] Request to:",
      req.path,
      "- Has access token:",
      !!accessToken,
      "- Has refresh token:",
      !!refreshToken
    );

    if (!accessToken) {
      console.log("[AUTH] No access token found in cookies");
      return res.status(401).json({ error: "Authentication required" });
    }

    // Verify the token
    const decoded = verifyToken(accessToken);

    if (!decoded || decoded.type === "refresh") {
      // Try to refresh the token if we have a refresh token
      if (refreshToken) {
        const refreshDecoded = verifyToken(refreshToken);

        if (refreshDecoded && refreshDecoded.type === "refresh") {
          const user = await getUserById(refreshDecoded.id);
          if (!user) {
            clearAuthCookies(res);
            return res.status(401).json({ error: "Session expired" });
          }

          // Generate new tokens
          const newAccessToken = generateAccessToken({
            id: user.id,
            email: user.email,
          });
          const newRefreshToken = generateRefreshToken({
            id: user.id,
          });

          setAuthCookies(res, newAccessToken, newRefreshToken);
          req.user = { id: user.id, email: user.email };
          return next();
        }
      }

      // Clear invalid cookies
      clearAuthCookies(res);
      return res.status(401).json({ error: "Session expired" });
    }

    // Attach user to request (only safe fields)
    req.user = {
      id: decoded.id,
      email: decoded.email,
    };
    next();
  } catch (error) {
    console.error("[AUTH] Auth middleware error:", error.message);
    return res.status(500).json({ error: "Authentication error" });
  }
};

/**
 * Optional auth - doesn't require auth but attaches user if present
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const accessToken = req.cookies?.["access-token"];

    if (accessToken) {
      const decoded = verifyToken(accessToken);
      if (decoded && decoded.type !== "refresh") {
        req.user = {
          id: decoded.id,
          email: decoded.email,
        };
      }
    }
  } catch (error) {
    // Silently continue without user
  }

  next();
};

/**
 * Set auth cookies with secure settings
 * Following OWASP guidelines for secure cookie configuration
 */
export const setAuthCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === "production";

  // Base cookie options following security best practices
  const baseCookieOptions = {
    httpOnly: true, // Prevents XSS attacks from reading cookies
    secure: isProduction, // Only send over HTTPS in production
    sameSite: "lax", // Same-origin requests (nginx proxy), 'lax' is appropriate
    path: "/",
  };

  // Access token - 7 days
  res.cookie("access-token", accessToken, {
    ...baseCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // Refresh token - 30 days
  res.cookie("refresh-token", refreshToken, {
    ...baseCookieOptions,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};

/**
 * Clear auth cookies - important to clear with same options
 */
export const clearAuthCookies = (res) => {
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
  };

  res.clearCookie("access-token", cookieOptions);
  res.clearCookie("refresh-token", cookieOptions);
};

export const requireSyncAdmin = (req, res, next) => {
  const email = req.user?.email?.toLowerCase();

  if (!email || !SYNC_ADMIN_EMAILS.has(email)) {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
};
