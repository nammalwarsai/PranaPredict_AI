const { createAuthClient } = require("../config/supabaseClient");

/**
 * Middleware to restrict route access only to authenticated administrators.
 * Selects `is_admin` using the user's current token (respects active user session).
 */
async function adminMiddleware(req, res, next) {
  try {
    if (!req.user || !req.token) {
      return res.status(401).json({ success: false, error: "Unauthorized. Missing active session." });
    }

    const supabase = createAuthClient(req.token);
    
    // Select is_admin and is_suspended from the authenticated user's own profile row.
    // This uses the user's JWT so it is always permitted under basic RLS.
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("is_admin, is_suspended")
      .eq("id", req.user.id)
      .maybeSingle();

    if (error) {
      console.error("adminMiddleware SELECT error:", error.message);
      return res.status(500).json({ success: false, error: "Database error during authorization check." });
    }

    if (!profile) {
      return res.status(403).json({ success: false, error: "Access denied. Profile not found." });
    }

    if (profile.is_suspended) {
      return res.status(403).json({ success: false, error: "Access denied. Your account is suspended." });
    }

    if (!profile.is_admin) {
      return res.status(403).json({ success: false, error: "Access denied. Administrative privileges required." });
    }

    req.profile = profile;
    next();
  } catch (err) {
    console.error("adminMiddleware caught error:", err.message || err);
    return res.status(500).json({ success: false, error: "Internal server error during authorization check." });
  }
}

module.exports = adminMiddleware;
