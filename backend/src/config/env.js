const NODE_ENV = process.env.NODE_ENV || "development";
const REQUESTED_GIT_SYNC = process.env.ENABLE_GIT_SYNC === "true";

export const isProduction = NODE_ENV === "production";
export const ENABLE_GIT_SYNC = REQUESTED_GIT_SYNC && !!process.env.GITHUB_TOKEN;
export const SYNC_ADMIN_EMAILS = new Set(
  (process.env.SYNC_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
);

export function validateEnvironment() {
  if (!process.env.JWT_SECRET) {
    console.warn(
      `[ENV] JWT_SECRET is not set${isProduction ? " in production" : ""}. Using compatibility fallback secret. Set JWT_SECRET in Dokploy.`
    );
  }

  if (REQUESTED_GIT_SYNC && !process.env.GITHUB_TOKEN) {
    console.warn(
      "[ENV] ENABLE_GIT_SYNC=true but GITHUB_TOKEN is missing. Git sync is disabled."
    );
  }

  if (REQUESTED_GIT_SYNC && SYNC_ADMIN_EMAILS.size === 0) {
    console.warn(
      "[ENV] ENABLE_GIT_SYNC=true but SYNC_ADMIN_EMAILS is empty. Sync routes will be denied."
    );
  }

  if (!process.env.TMDB_API_KEY) {
    console.warn("[ENV] TMDB_API_KEY is not set. TMDB-backed features will be limited.");
  }
}
