const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    "[FATAL] Missing required environment variables: SUPABASE_URL and/or SUPABASE_ANON_KEY.\n" +
    "  Copy .env.example to .env and fill in the values."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Create an authenticated Supabase client that carries the user's JWT.
 * Cached per token so repeated calls within the same request (or short window)
 * reuse the same instance instead of allocating a new one every time.
 */
const _authClientCache = new Map();
const AUTH_CLIENT_MAX = 200;

function createAuthClient(accessToken) {
  const cached = _authClientCache.get(accessToken);
  if (cached) return cached;

  const client = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  );

  _authClientCache.set(accessToken, client);

  // Prevent unbounded growth: evict oldest entry
  if (_authClientCache.size > AUTH_CLIENT_MAX) {
    const firstKey = _authClientCache.keys().next().value;
    _authClientCache.delete(firstKey);
  }

  return client;
}

module.exports = supabase;
module.exports.createAuthClient = createAuthClient;
