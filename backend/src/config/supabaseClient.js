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
 * This ensures RLS policies (auth.uid()) work correctly on the backend.
 */
function createAuthClient(accessToken) {
  return createClient(
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
}

module.exports = supabase;
module.exports.createAuthClient = createAuthClient;
