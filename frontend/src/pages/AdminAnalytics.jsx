import { useState, useEffect } from "react";
import { getAdminStats } from "../api/api";
import AdminSidebar from "../components/AdminSidebar";
import { Doughnut, Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

// Register elements
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

/**
 * Advanced analytics center visualizing disease prediction frequency, lifestyle risk mappings, and parameters ratios.
 */
function AdminAnalytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Timeframe and Risk category filter selections (simulated on client for instant premium feedback)
  const [timeframe, setTimeframe] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await getAdminStats();
        if (res.data && res.data.success) {
          setStats(res.data.data);
        } else {
          throw new Error(res.data?.error || "Failed to fetch analytics statistics.");
        }
      } catch (err) {
        console.error("Analytics Stats Fetch Error:", err);
        setError(err.response?.data?.error || err.message || "Failed to load analytics panels.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="admin-layout" style={adminLayoutStyle}>
        <AdminSidebar />
        <div style={adminContentLoadingStyle}>
          <div className="spinner" style={spinnerStyle}></div>
          <p style={{ color: "#9ca3af", fontFamily: "'Outfit', sans-serif" }}>Compiling health databases...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-layout" style={adminLayoutStyle}>
        <AdminSidebar />
        <div style={adminContentErrorStyle}>
          <div style={errorBoxStyle}>
            <h3>⚠️ Analytics Engine Error</h3>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} style={retryButtonStyle}>Retry Engine</button>
          </div>
        </div>
      </div>
    );
  }

  const { charts } = stats || {};

  // ── Charts definitions ───────────────────────────────────────────
  // 1. Disease Prediction Frequency (Bar Chart)
  const diseaseData = {
    labels: Object.keys(charts?.diseasePredictionFrequency || {}),
    datasets: [
      {
        data: Object.values(charts?.diseasePredictionFrequency || {}),
        backgroundColor: ["rgba(16, 185, 129, 0.75)" /* Emerald */, "rgba(6, 182, 212, 0.75)" /* Teal */, "rgba(245, 158, 11, 0.75)" /* Amber */, "rgba(239, 68, 68, 0.75)" /* Red */],
        borderColor: ["#10b981", "#06b6d4", "#f59e0b", "#ef4444"],
        borderWidth: 1.5,
        borderRadius: 8,
      },
    ],
  };

  const diseaseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { cornerRadius: 8, padding: 12 },
    },
    scales: {
      y: { grid: { color: "rgba(255,255,255,0.06)" }, ticks: { color: "#94a3b8" } },
      x: { grid: { display: false }, ticks: { color: "#94a3b8" } },
    },
  };

  // 2. Cholesterol Distribution (Pie Chart)
  const cholesterolData = {
    labels: ["Normal", "Borderline", "High"],
    datasets: [
      {
        data: [
          charts?.cholesterolDistribution?.normal || 0,
          charts?.cholesterolDistribution?.borderline || 0,
          charts?.cholesterolDistribution?.high || 0,
        ],
        backgroundColor: ["#10b981", "#f59e0b", "#ef4444"],
        borderWidth: 0,
      },
    ],
  };

  const cholesterolOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", labels: { color: "#e2e8f0", padding: 12, usePointStyle: true } },
    },
  };

  // 3. Blood Pressure Stacked categories
  const bpData = {
    labels: Object.keys(charts?.bloodPressureCategories || {}),
    datasets: [
      {
        data: Object.values(charts?.bloodPressureCategories || {}),
        backgroundColor: ["#10b981" /* Normal */, "#f59e0b" /* Prehyp */, "#8b5cf6" /* Stage 1 */, "#ef4444" /* Stage 2 */],
        borderWidth: 0,
        borderRadius: 10,
      },
    ],
  };

  const bpOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { grid: { color: "rgba(255,255,255,0.06)" }, ticks: { color: "#94a3b8" } },
      x: { grid: { display: false }, ticks: { color: "#94a3b8" } },
    },
  };

  // 4. BMI Distribution bar
  const bmiData = {
    labels: Object.keys(charts?.bmiDistribution || {}),
    datasets: [
      {
        label: "Patients Count",
        data: Object.values(charts?.bmiDistribution || {}),
        backgroundColor: "rgba(6, 182, 212, 0.75)",
        borderColor: "#06b6d4",
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const bmiOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { grid: { color: "rgba(255,255,255,0.06)" }, ticks: { color: "#94a3b8" } },
      x: { grid: { display: false }, ticks: { color: "#94a3b8" } },
    },
  };

  return (
    <div className="admin-layout" style={adminLayoutStyle}>
      <AdminSidebar />
      <main className="admin-main-content" style={adminMainContentStyle}>
        
        {/* Header Block */}
        <header style={dashboardHeaderStyle}>
          <div>
            <span style={{ fontSize: "12px", color: "#10b981", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase" }}>
              Analytics Core
            </span>
            <h1 style={{ margin: "4px 0 0 0", fontSize: "28px", color: "#fff", fontWeight: "700", fontFamily: "'Outfit', sans-serif" }}>
              Health Analytics
            </h1>
          </div>
        </header>

        {/* Filters bar */}
        <section style={filterBarWrapStyle}>
          <div style={filterLabelStyle}>Simulated Filters Controls:</div>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <div style={selectWrapStyle}>
              <span>Timeframe:</span>
              <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} style={selectStyle}>
                <option value="all">All-time Log</option>
                <option value="30d">Last 30 Days</option>
                <option value="7d">Last 7 Days</option>
              </select>
            </div>

            <div style={selectWrapStyle}>
              <span>Risk Category:</span>
              <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)} style={selectStyle}>
                <option value="all">All Risk Levels</option>
                <option value="high">High Risk Only</option>
                <option value="moderate">Moderate Only</option>
                <option value="low">Low Only</option>
              </select>
            </div>
          </div>
        </section>

        {/* 4-chart Grid layout */}
        <section style={analyticsGridStyle}>
          
          {/* Chart 1: Disease Prediction frequency */}
          <div className="chart-panel-card" style={chartCardStyle}>
            <h3 style={chartTitleStyle}>🩺 Disease Co-morbidities Frequency</h3>
            <div style={chartWrapStyle}>
              <Bar data={diseaseData} options={diseaseOptions} />
            </div>
          </div>

          {/* Chart 2: Cholesterol levels */}
          <div className="chart-panel-card" style={chartCardStyle}>
            <h3 style={chartTitleStyle}>🧪 Serum Cholesterol Distribution</h3>
            <div style={{ ...chartWrapStyle, height: "190px" }}>
              <Pie data={cholesterolData} options={cholesterolOptions} />
            </div>
          </div>

          {/* Chart 3: Blood Pressure classifications */}
          <div className="chart-panel-card" style={chartCardStyle}>
            <h3 style={chartTitleStyle}>❤️ Blood Pressure Classifications</h3>
            <div style={chartWrapStyle}>
              <Bar data={bpData} options={bpOptions} />
            </div>
          </div>

          {/* Chart 4: BMI categories */}
          <div className="chart-panel-card" style={chartCardStyle}>
            <h3 style={chartTitleStyle}>⚖️ BMI Density Distribution</h3>
            <div style={chartWrapStyle}>
              <Bar data={bmiData} options={bmiOptions} />
            </div>
          </div>

        </section>

        {/* Lifestyle Risk heat ratios mapping */}
        <section style={heatmapSectionStyle}>
          <h3 style={{ fontSize: "16px", color: "#fff", margin: "0 0 16px 0", fontWeight: "600" }}>
            🥗 Lifestyle & Activity Risk Matrix
          </h3>
          <p style={{ color: "#9ca3af", fontSize: "13px", margin: "0 0 20px 0", lineHeight: "1.5" }}>
            The table below aggregates the mean AI-calculated risk index grouped by dietary lifestyle and physical activity levels.
          </p>

          <div style={tableContainerStyle}>
            <table style={tableStyle}>
              <thead>
                <tr style={tableHeaderRowStyle}>
                  <th style={thStyle}>Diet Type</th>
                  <th style={thStyle}>Activity Level</th>
                  <th style={thStyle}>Average Risk Index</th>
                  <th style={thStyle}>Sample Density</th>
                </tr>
              </thead>
              <tbody>
                {(charts?.lifestyleRiskHeatmap || []).map((row, idx) => {
                  const parts = row.group.split("-");
                  const diet = parts[0] === "non" ? "Non-Vegetarian" : parts[0] === "junk" ? "Junk-heavy" : "Vegetarian";
                  const act = parts[parts.length - 1];
                  const risk = row.avgRiskScore;
                  
                  // Color scale depending on risk score
                  const riskColor = risk > 65 ? "#ef4444" : risk > 35 ? "#f59e0b" : "#10b981";
                  const riskBg = risk > 65 ? "rgba(239, 68, 68, 0.12)" : risk > 35 ? "rgba(245, 158, 11, 0.12)" : "rgba(16, 185, 129, 0.12)";

                  return (
                    <tr key={idx} style={trStyle}>
                      <td style={{ ...tdStyle, textTransform: "capitalize", fontWeight: "600" }}>{diet}</td>
                      <td style={{ ...tdStyle, textTransform: "capitalize" }}>{act}</td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: "4px 12px",
                          borderRadius: "30px",
                          fontWeight: "700",
                          background: riskBg,
                          color: riskColor,
                          fontSize: "13px"
                        }}>
                          {risk}% Risk
                        </span>
                      </td>
                      <td style={tdStyle}>{row.count} reports</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

      </main>
    </div>
  );
}

// ── Shared Styling CSS tokens ─────────────────────────────────────────
const adminLayoutStyle = {
  display: "flex",
  minHeight: "100vh",
  background: "var(--bg-dark, #0b0f19)",
};

const adminContentLoadingStyle = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "Inter, sans-serif",
};

const adminContentErrorStyle = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "40px",
};

const errorBoxStyle = {
  background: "rgba(239, 68, 68, 0.08)",
  border: "1px solid rgba(239, 68, 68, 0.2)",
  padding: "32px",
  borderRadius: "16px",
  maxWidth: "500px",
  width: "100%",
  textAlign: "center",
  fontFamily: "Inter, sans-serif",
  color: "#fff",
};

const retryButtonStyle = {
  marginTop: "16px",
  padding: "10px 24px",
  borderRadius: "10px",
  background: "#ef4444",
  border: "none",
  color: "#fff",
  fontWeight: "600",
  cursor: "pointer",
};

const spinnerStyle = {
  border: "4px solid rgba(255,255,255,0.06)",
  borderLeftColor: "#10b981",
  borderRadius: "50%",
  width: "40px",
  height: "40px",
  animation: "spin 1s linear infinite",
  marginBottom: "16px",
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
  marginBottom: "32px",
};

const filterBarWrapStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
  flexWrap: "wrap",
  background: "rgba(17, 24, 39, 0.4)",
  border: "1px solid rgba(255, 255, 255, 0.03)",
  borderRadius: "12px",
  padding: "16px 24px",
  marginBottom: "28px",
};

const filterLabelStyle = {
  color: "#9ca3af",
  fontSize: "13px",
  fontWeight: "500",
};

const selectWrapStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontSize: "13px",
  color: "#e2e8f0",
};

const selectStyle = {
  background: "rgba(17, 24, 39, 0.8)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#fff",
  borderRadius: "8px",
  padding: "6px 12px",
  fontSize: "13px",
  outline: "none",
  cursor: "pointer",
};

const analyticsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
  gap: "24px",
  marginBottom: "36px",
};

const chartCardStyle = {
  background: "rgba(17, 24, 39, 0.65)",
  border: "1px solid rgba(255, 255, 255, 0.05)",
  borderRadius: "16px",
  padding: "24px",
  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
  display: "flex",
  flexDirection: "column",
};

const chartTitleStyle = {
  fontSize: "15px",
  color: "#fff",
  margin: "0 0 20px 0",
  fontWeight: "600",
};

const chartWrapStyle = {
  height: "220px",
  position: "relative",
  flex: 1,
};

const heatmapSectionStyle = {
  background: "rgba(17, 24, 39, 0.4)",
  border: "1px solid rgba(255, 255, 255, 0.03)",
  borderRadius: "16px",
  padding: "28px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
};

const tableContainerStyle = {
  background: "rgba(17, 24, 39, 0.65)",
  border: "1px solid rgba(255, 255, 255, 0.05)",
  borderRadius: "12px",
  overflow: "hidden",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  textAlign: "left",
};

const tableHeaderRowStyle = {
  background: "rgba(255,255,255,0.02)",
  borderBottom: "1px solid rgba(255,255,255,0.05)",
};

const thStyle = {
  padding: "14px 20px",
  fontSize: "12px",
  color: "#9ca3af",
  fontWeight: "600",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const trStyle = {
  borderBottom: "1px solid rgba(255,255,255,0.03)",
};

const tdStyle = {
  padding: "16px 20px",
  fontSize: "14px",
  color: "#cbd5e1",
};

export default AdminAnalytics;
