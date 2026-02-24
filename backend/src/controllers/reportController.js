const { createAuthClient } = require("../config/supabaseClient");

async function getReports(req, res, next) {
  try {
    const supabase = createAuthClient(req.token);
    const { data, error } = await supabase
      .from("health_reports")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("getReports error:", error.message);
      return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ success: true, data: data || [] });
  } catch (error) {
    next(error);
  }
}

async function getReportById(req, res, next) {
  try {
    const supabase = createAuthClient(req.token);
    const { id } = req.params;

    const { data, error } = await supabase
      .from("health_reports")
      .select("*")
      .eq("id", id)
      .eq("user_id", req.user.id)
      .single();

    if (error) {
      return res.status(404).json({ success: false, error: "Report not found" });
    }

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = { getReports, getReportById };
