const { createAuthClient } = require("../config/supabaseClient");

const PAGE_SIZE = 20;

// Columns needed for the list view (llm_advice included for preview; excludes internal metadata)
const LIST_COLUMNS = "id,user_id,age,bmi,blood_pressure,cholesterol,smoking,activity_level,risk_score,risk_level,llm_advice,created_at";

async function getReports(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const offset = (page - 1) * PAGE_SIZE;

    const supabase = createAuthClient(req.token);
    const { data, error, count } = await supabase
      .from("health_reports")
      .select(LIST_COLUMNS, { count: "exact" })
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error("getReports error:", error.message);
      return res.status(500).json({ success: false, error: error.message });
    }

    res.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total: count ?? 0,
        totalPages: count != null ? Math.ceil(count / PAGE_SIZE) : null,
      },
    });
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
