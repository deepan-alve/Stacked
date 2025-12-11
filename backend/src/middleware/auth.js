import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Create Supabase client with service key for server-side verification
const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

/**
 * Auth middleware that validates the session from HTTP-only cookies
 */
export const requireAuth = async (req, res, next) => {
  // Skip auth in development if SKIP_AUTH is set
  if (process.env.SKIP_AUTH === "true") {
    req.user = { id: "dev-user", email: "dev@localhost" };
    return next();
  }

  // Check if Supabase is configured
  if (!supabase) {
    console.warn("Supabase not configured - auth disabled");
    return next();
  }

  try {
    // Get the access token from HTTP-only cookie
    const accessToken = req.cookies?.["sb-access-token"];
    const refreshToken = req.cookies?.["sb-refresh-token"];

    if (!accessToken) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      // Try to refresh the token if we have a refresh token
      if (refreshToken) {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
          refresh_token: refreshToken
        });

        if (!refreshError && refreshData.session) {
          // Set new tokens in cookies
          setAuthCookies(res, refreshData.session);
          req.user = refreshData.user;
          return next();
        }
      }

      // Clear invalid cookies
      clearAuthCookies(res);
      return res.status(401).json({ error: "Invalid or expired session" });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ error: "Authentication error" });
  }
};

/**
 * Optional auth - doesn't require auth but attaches user if present
 */
export const optionalAuth = async (req, res, next) => {
  if (!supabase) {
    return next();
  }

  try {
    const accessToken = req.cookies?.["sb-access-token"];
    
    if (accessToken) {
      const { data: { user } } = await supabase.auth.getUser(accessToken);
      if (user) {
        req.user = user;
      }
    }
  } catch (error) {
    // Silently continue without user
  }
  
  next();
};

/**
 * Set auth cookies with secure settings
 */
export const setAuthCookies = (res, session) => {
  const isProduction = process.env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction, // Only send over HTTPS in production
    sameSite: isProduction ? "strict" : "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  res.cookie("sb-access-token", session.access_token, {
    ...cookieOptions,
    maxAge: 60 * 60 * 1000, // 1 hour for access token
  });

  res.cookie("sb-refresh-token", session.refresh_token, cookieOptions);
};

/**
 * Clear auth cookies
 */
export const clearAuthCookies = (res) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    path: "/",
  };

  res.clearCookie("sb-access-token", cookieOptions);
  res.clearCookie("sb-refresh-token", cookieOptions);
};

export { supabase };
