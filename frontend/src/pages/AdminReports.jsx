import { useState, useEffect, useCallback } from "react";
import { getAdminReports } from "../api/api";
import AdminSidebar from "../components/AdminSidebar";

/**
 * Admin Reports — paginated assessment log table with search, CSV export, and printable design.
 */
function AdminReports() {
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  const fetchReports = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminReports({ page, limit: 20 });
      if (res.data && res.data.success) {
        setReports(res.data.data);
        setPagination(res.data.pagination);
      } else {
        throw new Error(res.data?.error || "Failed to load assessment logs.");
      }
    } catch (err) {
      console.error("Reports fetch error:", err);
      setError(err.response?.data?.error || err.message || "Failed to compile report records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports(1);
  }, [fetchReports]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchReports(newPage);
  };

  // Client-side search filter over fetched reports
  const filteredReports = search
    ? reports.filter((r) => {
        const s = search.toLowerCase();
        return (
          (r.userEmail && r.userEmail.toLowerCase().includes(s)) ||
          (r.userFullName && r.userFullName.toLowerCase().includes(s)) ||
          (r.risk_level && r.risk_level.toLowerCase().includes(s)) ||
          String(r.risk_score).includes(s)
        );
      })
    : reports;

  // CSV Export utility
  const handleExportCSV = () => {
    if (!filteredReports.length) return;
    const headers = [
      "Report ID", "User", "Email", "Age", "BMI", "BP",
      "Cholesterol", "Smoking", "Activity", "Risk Score", "Risk Level", "Date"
    ];
    const rows = filteredReports.map((r) => [
      r.id,
      r.userFullName || "Unknown",
      r.userEmail || "",
      r.age,
      r.bmi,
      r.blood_pressure,
      r.cholesterol,
      r.smoking ? "Yes" : "No",
      r.activity_level,
      r.risk_score,
      r.risk_level,
      new Date(r.created_at).toLocaleDateString("en-IN"),
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pranapredict_reports_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Print utility
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="admin-layout" style={adminLayoutStyle}>
      <AdminSidebar />
      <main className="admin-main-content" style={adminMainContentStyle}>

        {/* Header */}
        <header style={dashboardHeaderStyle}>
          <div>
            <span style={labelStyle}>Database Records</span>
            <h1 style={headingStyle}>Assessment Logs</h1>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={handleExportCSV} style={exportBtnStyle} disabled={!filteredReports.length}>
              📥 Export CSV
            </button>
            <button onClick={handlePrint} style={{ ...exportBtnStyle, background: "rgba(139, 92, 246, 0.12)", borderColor: "rgba(139, 92, 246, 0.25)", color: "#8b5cf6" }}>
              🖨️ Print
            </button>
          </div>
        </header>

        {/* Search bar */}
        <div style={searchBarStyle}>
          <input
            type="text"
            placeholder="Filter by user name, email, or risk level..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={searchInputStyle}
          />
          <span style={searchCountStyle}>{filteredReports.length} records displayed</span>
        </div>

        {/* Table content */}
        {loading ? (
          <div style={centerStyle}>
            <div className="spinner" style={spinnerStyle}></div>
            <p style={{ color: "#9ca3af", marginTop: "12px" }}>Querying assessment database...</p>
          </div>
        ) : error ? (
          <div style={errorCardStyle}>
            <p>{error}</p>
            <button onClick={() => fetchReports(1)} style={retryBtnStyle}>Retry</button>
          </div>
        ) : filteredReports.length === 0 ? (
          <div style={emptyCardStyle}>No assessment records found matching filters.</div>
        ) : (
          <>
            <div style={tableContainerStyle} id="reports-print-area">
              <table style={tableStyle}>
                <thead>
                  <tr style={tableHeaderRowStyle}>
                    <th style={thStyle}>Patient</th>
                    <th style={thStyle}>Age</th>
                    <th style={thStyle}>BMI</th>
                    <th style={thStyle}>BP</th>
                    <th style={thStyle}>Cholesterol</th>
                    <th style={thStyle}>Smoking</th>
                    <th style={thStyle}>Activity</th>
                    <th style={thStyle}>Risk Score</th>
                    <th style={thStyle}>Risk Level</th>
                    <th style={thStyle}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((r) => {
                    const isHigh = r.risk_score > 70 || r.risk_level === "High" || r.risk_level === "Critical";
                    const isMod = r.risk_level === "Moderate";
                    const riskColor = isHigh ? "#ef4444" : isMod ? "#f59e0b" : "#10b981";
                    const riskBg = isHigh ? "rgba(239,68,68,0.12)" : isMod ? "rgba(245,158,11,0.12)" : "rgba(16,185,129,0.12)";
                    const date = new Date(r.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    });

                    return (
                      <tr key={r.id} style={trStyle}>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: "600", color: "#fff" }}>{r.userFullName || "Unknown"}</div>
                          <div style={{ fontSize: "11px", color: "#6b7280" }}>{r.userEmail}</div>
                        </td>
                        <td style={tdStyle}>{r.age}</td>
                        <td style={tdStyle}>{r.bmi}</td>
                        <td style={tdStyle}>{r.blood_pressure}</td>
                        <td style={{ ...tdStyle, textTransform: "capitalize" }}>{r.cholesterol}</td>
                        <td style={tdStyle}>{r.smoking ? <span style={{ color: "#ef4444" }}>Yes</span> : <span style={{ color: "#10b981" }}>No</span>}</td>
                        <td style={{ ...tdStyle, textTransform: "capitalize" }}>{r.activity_level}</td>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: "700", color: riskColor, fontSize: "15px" }}>{r.risk_score}%</span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            padding: "3px 10px",
                            borderRadius: "20px",
                            fontSize: "11px",
                            fontWeight: "700",
                            background: riskBg,
                            color: riskColor,
                          }}>
                            {r.risk_level}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{date}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={paginationWrapStyle}>
              <span style={{ color: "#9ca3af", fontSize: "13px" }}>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total records)
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  style={pageBtnStyle(pagination.page <= 1)}
                >
                  ← Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  style={pageBtnStyle(pagination.page >= pagination.totalPages)}
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Print styles */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @media print {
          .admin-sidebar, .admin-layout > main > header, .admin-layout > main > div:first-of-type {
            display: none !important;
          }
          .admin-layout {
            display: block !important;
          }
          .admin-main-content {
            padding: 0 !important;
            max-height: none !important;
          }
          #reports-print-area {
            box-shadow: none !important;
            border: 1px solid #ccc !important;
          }
          #reports-print-area th, #reports-print-area td {
            color: #000 !important;
            background: #fff !important;
            border-bottom: 1px solid #eee !important;
          }
        }
      `}</style>
    </div>
  );
}

// ── Style tokens ──────────────────────────────────────────────────────
const adminLayoutStyle = {
  display: "flex",
  minHeight: "100vh",
  background: "var(--bg-dark, #0b0f19)",
};

const adminMainContentStyle = {
  flex: 1,
  padding: "36px",
  maxHeight: "calc(100vh - 64px)",
  overflowY: "auto",
  fontFamily: "Inter, sans-serif",
};

const dashboardHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "24px",
};

const labelStyle = {
  fontSize: "12px",
  color: "#10b981",
  fontWeight: "600",
  letterSpacing: "1px",
  textTransform: "uppercase",
};

const headingStyle = {
  margin: "4px 0 0 0",
  fontSize: "28px",
  color: "#fff",
  fontWeight: "700",
  fontFamily: "'Outfit', sans-serif",
};

const exportBtnStyle = {
  padding: "10px 20px",
  borderRadius: "10px",
  background: "rgba(16, 185, 129, 0.12)",
  border: "1px solid rgba(16, 185, 129, 0.25)",
  color: "#10b981",
  fontWeight: "600",
  fontSize: "13px",
  cursor: "pointer",
  transition: "all 0.2s ease",
};

const searchBarStyle = {
  display: "flex",
  alignItems: "center",
  gap: "16px",
  marginBottom: "24px",
};

const searchInputStyle = {
  flex: 1,
  padding: "10px 18px",
  borderRadius: "10px",
  background: "rgba(17, 24, 39, 0.65)",
  border: "1px solid rgba(255,255,255,0.06)",
  color: "#fff",
  fontSize: "14px",
  outline: "none",
  maxWidth: "480px",
};

const searchCountStyle = {
  fontSize: "13px",
  color: "#6b7280",
  whiteSpace: "nowrap",
};

const centerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "80px 0",
  fontFamily: "Inter, sans-serif",
};

const spinnerStyle = {
  border: "4px solid rgba(255,255,255,0.06)",
  borderLeftColor: "#10b981",
  borderRadius: "50%",
  width: "40px",
  height: "40px",
  animation: "spin 1s linear infinite",
};

const errorCardStyle = {
  background: "rgba(239, 68, 68, 0.08)",
  border: "1px solid rgba(239, 68, 68, 0.15)",
  color: "#fca5a5",
  padding: "24px",
  borderRadius: "12px",
  textAlign: "center",
};

const retryBtnStyle = {
  marginTop: "12px",
  padding: "8px 20px",
  borderRadius: "8px",
  background: "#ef4444",
  border: "none",
  color: "#fff",
  fontWeight: "600",
  cursor: "pointer",
};

const emptyCardStyle = {
  background: "rgba(17, 24, 39, 0.3)",
  border: "1px solid rgba(255,255,255,0.04)",
  color: "#9ca3af",
  padding: "48px",
  borderRadius: "12px",
  textAlign: "center",
  fontSize: "15px",
};

const tableContainerStyle = {
  background: "rgba(17, 24, 39, 0.65)",
  border: "1px solid rgba(255, 255, 255, 0.05)",
  borderRadius: "16px",
  overflow: "auto",
  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  textAlign: "left",
  minWidth: "900px",
};

const tableHeaderRowStyle = {
  background: "rgba(255,255,255,0.02)",
  borderBottom: "1px solid rgba(255,255,255,0.05)",
};

const thStyle = {
  padding: "14px 18px",
  fontSize: "11px",
  color: "#9ca3af",
  fontWeight: "700",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  whiteSpace: "nowrap",
};

const trStyle = {
  borderBottom: "1px solid rgba(255,255,255,0.03)",
};

const tdStyle = {
  padding: "14px 18px",
  fontSize: "13px",
  color: "#cbd5e1",
  verticalAlign: "middle",
};

const paginationWrapStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: "20px",
  padding: "16px 0",
};

const pageBtnStyle = (disabled) => ({
  padding: "8px 18px",
  borderRadius: "8px",
  background: disabled ? "rgba(255,255,255,0.02)" : "rgba(16, 185, 129, 0.1)",
  border: disabled ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(16, 185, 129, 0.2)",
  color: disabled ? "#4b5563" : "#10b981",
  fontWeight: "600",
  fontSize: "13px",
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.5 : 1,
});

export default AdminReports;
