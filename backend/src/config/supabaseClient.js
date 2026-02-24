const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Create an authenticated Supabase client that carries the user's JWT.
 * This ensures RLS policies (auth.uid()) work correctly on the backend.
 */
function createAuthClient(accessToken) {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
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
