const NODE_ENV = process.env.NODE_ENV || "development";

export const isProduction = NODE_ENV === "production";
export const ENABLE_GIT_SYNC = process.env.ENABLE_GIT_SYNC === "true";
export const SYNC_ADMIN_EMAILS = new Set(
  (process.env.SYNC_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
);

export function validateEnvironment() {
  const errors = [];

  if (isProduction && !process.env.JWT_SECRET) {
    errors.push("JWT_SECRET is required in production");
  }

  if (ENABLE_GIT_SYNC && !process.env.GITHUB_TOKEN) {
    errors.push("GITHUB_TOKEN is required when ENABLE_GIT_SYNC=true");
  }

  if (errors.length > 0) {
    throw new Error(errors.join(" | "));
  }

  if (ENABLE_GIT_SYNC && SYNC_ADMIN_EMAILS.size === 0) {
    console.warn(
      "[ENV] ENABLE_GIT_SYNC=true but SYNC_ADMIN_EMAILS is empty. Sync routes will be denied."
    );
  }

  if (!process.env.TMDB_API_KEY) {
    console.warn("[ENV] TMDB_API_KEY is not set. TMDB-backed features will be limited.");
  }
}
