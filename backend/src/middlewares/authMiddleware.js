const supabase = require("../config/supabaseClient");

// In-memory token cache: token -> { user, expiresAt }
const tokenCache = new Map();
const CACHE_TTL_MS = 30 * 1000; // 30 seconds — balances freshness vs. Supabase calls
const AUTH_TIMEOUT_MS = 3000;
const MAX_CACHE_SIZE = 500;

// Lazy eviction: clean up on every set instead of a periodic timer.
// This avoids the overhead of setInterval and is more predictable.
function evictExpired() {
  const now = Date.now();
  for (const [key, entry] of tokenCache) {
    if (now > entry.expiresAt) tokenCache.delete(key);
  }
}

function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Auth validation timed out")), timeoutMs);
    }),
  ]);
}

function getCached(token) {
  const entry = tokenCache.get(token);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    tokenCache.delete(token);
    return null;
  }
  return entry.user;
}

function setCached(token, user) {
  // Evict expired entries before adding new ones
  if (tokenCache.size > MAX_CACHE_SIZE * 0.8) {
    evictExpired();
  }

  tokenCache.set(token, { user, expiresAt: Date.now() + CACHE_TTL_MS });

  // If still over limit after eviction, remove oldest
  if (tokenCache.size > MAX_CACHE_SIZE) {
    const firstKey = tokenCache.keys().next().value;
    tokenCache.delete(firstKey);
  }
}

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, error: "Missing or invalid authorization header" });
    }

    const token = authHeader.split(" ")[1];

    // Serve from cache to avoid repeated Supabase network calls
    const cachedUser = getCached(token);
    if (cachedUser) {
      req.user = cachedUser;
      req.token = token;
      return next();
    }

    const { data: { user }, error } = await withTimeout(
      supabase.auth.getUser(token),
      AUTH_TIMEOUT_MS
    );

    if (error || !user) {
      return res.status(401).json({ success: false, error: "Invalid or expired token" });
    }

    setCached(token, user);
    req.user = user;
    req.token = token;
    next();
  } catch (_error) {
    return res.status(503).json({ success: false, error: "Authentication service timeout. Please retry." });
  }
}

module.exports = authMiddleware;
