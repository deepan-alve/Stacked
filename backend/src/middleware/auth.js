import jwt from "jsonwebtoken";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret-in-production";
const JWT_EXPIRES_IN = "7d"; // 7 days
const JWT_REFRESH_EXPIRES_IN = "30d"; // 30 days

if (!process.env.JWT_SECRET) {
  console.warn("[AUTH] WARNING: Using default JWT_SECRET. Set JWT_SECRET in production!");
}

/**
 * Generate JWT access token
 */
export const generateAccessToken = (user) => {
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
 * Hash password using SHA-256
 */
export const hashPassword = (password) => {
  return crypto.createHash("sha256").update(password).digest("hex");
};

/**
 * Verify JWT token
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
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
          // Generate new tokens
          const newAccessToken = generateAccessToken({ id: refreshDecoded.id, email: refreshDecoded.email });
          const newRefreshToken = generateRefreshToken({ id: refreshDecoded.id });

          setAuthCookies(res, newAccessToken, newRefreshToken);
          req.user = { id: refreshDecoded.id, email: refreshDecoded.email };
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
  const isProduction = process.env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
  };

  res.clearCookie("access-token", cookieOptions);
  res.clearCookie("refresh-token", cookieOptions);
};
