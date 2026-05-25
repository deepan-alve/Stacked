import express from "express";
import jwt from "jsonwebtoken";
import { requireAuth } from "../middleware/auth.js";
import database from "../config/database.js";

const JWT_SECRET =
  process.env.JWT_SECRET || "change-this-secret-in-production";

// Allowed external origins that may request a connect grant.
// Padam (this user's own client) — extend via env if you ever add more.
const ALLOWED_CONNECT_ORIGINS = new Set(
  [
    process.env.PADAM_URL,
    "https://padam.deepanalve.dev",
    "http://localhost:3000",
  ].filter(Boolean)
);

function isAllowedOrigin(origin) {
  try {
    const u = new URL(origin);
    const normalised = `${u.protocol}//${u.host}`;
    return ALLOWED_CONNECT_ORIGINS.has(normalised);
  } catch {
    return false;
  }
}

/**
 * GET /connect (top-level, no /api prefix — it's a user-facing HTML page)
 * Rendered into a popup window from an external client (e.g. Padam).
 * Self-contained: detects login via /api/auth/me, shows login if needed,
 * shows the authorize UI, then on approval redirects to
 *   ${from}/stacked/callback#token=<jwt>&state=<state>
 */
export function connectPage(req, res) {
  const from = String(req.query.from ?? "");
  const state = String(req.query.state ?? "");
  const fromAllowed = isAllowedOrigin(from);

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.send(renderConnectPage({ from, state, fromAllowed }));
}

/**
 * Router for /api/connect/* endpoints.
 */
export const connectApi = express.Router();

connectApi.post("/grant", requireAuth, async (req, res) => {
  const { from } = req.body ?? {};

  if (!from || !isAllowedOrigin(from)) {
    return res.status(400).json({ error: "Origin not allowed" });
  }

  const user = await database.get(
    "SELECT id, email FROM users WHERE id = ?",
    [req.user.id]
  );
  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      scope: "external",
      origin: new URL(from).host,
    },
    JWT_SECRET,
    { expiresIn: "90d" }
  );

  return res.json({ token, user: { id: user.id, email: user.email } });
});

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[c]
  );
}

function renderConnectPage({ from, state, fromAllowed }) {
  // from/state are injected as JSON literals into the inline script — safe via JSON.stringify.
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Connect to Stacked</title>
<style>
  :root {
    --bg: #0d0b09;
    --card: #181410;
    --border: rgba(255,255,255,0.1);
    --fg: #f6f1ea;
    --mute: #8a8378;
    --brand: #d4a655;
    --brand-deep: #b78937;
    --err: #c14d34;
    --pad: #e50914;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: var(--bg); color: var(--fg); font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; }
  body { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
  .card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 32px; max-width: 420px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.6); }
  .brand { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
  .stacked-mark { font-size: 22px; font-weight: 800; color: var(--brand); letter-spacing: -0.02em; }
  .pad-mark { font-size: 22px; font-weight: 900; color: var(--pad); letter-spacing: -0.04em; }
  .arrow { color: var(--mute); }
  h1 { font-size: 22px; line-height: 1.25; margin: 0 0 8px; font-weight: 700; }
  p { color: var(--mute); margin: 0 0 18px; font-size: 14px; line-height: 1.55; }
  .info { background: rgba(212,166,85,0.08); border: 1px solid rgba(212,166,85,0.3); padding: 12px 14px; border-radius: 8px; font-size: 13px; margin-bottom: 20px; }
  .info b { color: var(--brand); }
  label { display: block; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--mute); font-weight: 600; margin-bottom: 6px; }
  input { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid var(--border); color: var(--fg); padding: 10px 12px; border-radius: 8px; font-size: 15px; margin-bottom: 12px; }
  input:focus { outline: none; border-color: var(--brand); }
  button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; font-family: inherit; font-weight: 600; }
  .btn-primary { background: var(--brand); color: #1a1208; border: 0; padding: 12px 18px; border-radius: 8px; font-size: 15px; width: 100%; margin-top: 8px; }
  .btn-primary:hover { background: var(--brand-deep); }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-cancel { background: transparent; color: var(--mute); border: 1px solid var(--border); padding: 10px 16px; border-radius: 8px; font-size: 14px; }
  .btn-cancel:hover { color: var(--fg); border-color: var(--mute); }
  .err { background: rgba(193,77,52,0.15); border: 1px solid var(--err); color: #ffb09f; padding: 10px 12px; border-radius: 8px; font-size: 13px; margin-bottom: 12px; }
  .hidden { display: none; }
  .row { display: flex; gap: 10px; margin-top: 12px; }
  .row .btn-primary { margin-top: 0; }
  .scopes { list-style: none; padding: 0; margin: 0 0 18px; font-size: 13px; color: var(--fg); }
  .scopes li { padding: 6px 0; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 8px; }
  .scopes li:last-child { border-bottom: 0; }
  .scopes svg { color: var(--brand); flex: 0 0 16px; }
  .signed-in { font-size: 13px; color: var(--mute); margin-bottom: 16px; }
  .signed-in b { color: var(--fg); }
  .spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid currentColor; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
</head>
<body>
  <div class="card" role="dialog" aria-labelledby="title">
    <div class="brand">
      <span class="stacked-mark">Stacked</span>
      <span class="arrow">⇄</span>
      <span class="pad-mark">PADAM</span>
    </div>

    <div id="loading">
      <h1>Loading…</h1>
      <p>Checking your session.</p>
    </div>

    <div id="badOrigin" class="hidden">
      <h1>Origin not allowed</h1>
      <p>The site that opened this window isn't on the trusted list. Close this and try again from your own Padam install.</p>
    </div>

    <div id="login" class="hidden">
      <h1 id="title">Sign in to Stacked</h1>
      <p>Padam wants access to your library. Sign in to your Stacked account to continue.</p>
      <div id="loginErr" class="err hidden"></div>
      <form id="loginForm" autocomplete="on">
        <label for="email">Email</label>
        <input id="email" name="email" type="email" autocomplete="email" required />
        <label for="password">Password</label>
        <input id="password" name="password" type="password" autocomplete="current-password" required />
        <button type="submit" class="btn-primary" id="loginBtn">Sign in</button>
      </form>
    </div>

    <div id="authorize" class="hidden">
      <h1 id="title2">Authorize Padam</h1>
      <div class="signed-in">Signed in as <b id="meEmail"></b></div>
      <div class="info">
        <b>Padam</b> is requesting permission to read and update your Stacked library.
      </div>
      <ul class="scopes">
        <li>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Add entries (movies, series, anime) to your library
        </li>
        <li>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Read your existing library and stats
        </li>
        <li>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Update ratings, notes, and watched dates
        </li>
      </ul>
      <div id="authErr" class="err hidden"></div>
      <div class="row">
        <button id="cancelBtn" type="button" class="btn-cancel">Cancel</button>
        <button id="authBtn" type="button" class="btn-primary">Authorize</button>
      </div>
    </div>
  </div>

  <script>
    (function () {
      const FROM = ${JSON.stringify(from)};
      const STATE = ${JSON.stringify(state)};
      const FROM_ALLOWED = ${JSON.stringify(fromAllowed)};

      const $ = (id) => document.getElementById(id);
      function show(id) {
        ["loading","badOrigin","login","authorize"].forEach((x) => $(x).classList.toggle("hidden", x !== id));
      }

      if (!FROM_ALLOWED) {
        show("badOrigin");
        return;
      }

      async function refreshState() {
        try {
          const r = await fetch("/api/auth/me", { credentials: "include" });
          if (r.ok) {
            const j = await r.json();
            const email = (j && (j.email || (j.user && j.user.email))) || "";
            $("meEmail").textContent = email;
            show("authorize");
          } else {
            show("login");
          }
        } catch {
          show("login");
        }
      }

      $("loginForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        $("loginErr").classList.add("hidden");
        const btn = $("loginBtn");
        btn.disabled = true;
        const original = btn.textContent;
        btn.innerHTML = '<span class="spinner"></span> Signing in';
        try {
          const r = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              email: $("email").value,
              password: $("password").value,
            }),
          });
          if (!r.ok) {
            const err = await r.json().catch(() => ({}));
            $("loginErr").textContent = err.error || "Sign-in failed";
            $("loginErr").classList.remove("hidden");
            btn.disabled = false;
            btn.textContent = original;
            return;
          }
          await refreshState();
        } catch (e) {
          $("loginErr").textContent = "Network error";
          $("loginErr").classList.remove("hidden");
          btn.disabled = false;
          btn.textContent = original;
        }
      });

      $("cancelBtn").addEventListener("click", () => {
        try { window.opener && window.opener.postMessage({ type: "stacked.connect", error: "cancelled", state: STATE }, FROM); } catch {}
        window.close();
      });

      $("authBtn").addEventListener("click", async () => {
        $("authErr").classList.add("hidden");
        const btn = $("authBtn");
        btn.disabled = true;
        const original = btn.textContent;
        btn.innerHTML = '<span class="spinner"></span> Connecting';
        try {
          const r = await fetch("/api/connect/grant", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ from: FROM }),
          });
          if (!r.ok) {
            const err = await r.json().catch(() => ({}));
            $("authErr").textContent = err.error || "Could not grant access";
            $("authErr").classList.remove("hidden");
            btn.disabled = false;
            btn.textContent = original;
            return;
          }
          const { token } = await r.json();
          const url = new URL(FROM);
          url.pathname = "/stacked/callback";
          url.hash = "token=" + encodeURIComponent(token) + "&state=" + encodeURIComponent(STATE);
          window.location.replace(url.toString());
        } catch (e) {
          $("authErr").textContent = "Network error";
          $("authErr").classList.remove("hidden");
          btn.disabled = false;
          btn.textContent = original;
        }
      });

      refreshState();
    })();
  </script>
</body>
</html>`;
}
