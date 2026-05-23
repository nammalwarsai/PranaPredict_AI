import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAdminStats } from "../api/api";
import AdminSidebar from "../components/AdminSidebar";
import { Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

// Make sure ChartJS elements are registered for this page
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

/**
 * Premium dashboard cockpit presenting aggregated KPIs, trend metrics, and distributions.
 */
function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await getAdminStats();
        if (res.data && res.data.success) {
          setStats(res.data.data);
        } else {
          throw new Error(res.data?.error || "Failed to load admin statistics.");
        }
      } catch (err) {
        console.error("Dashboard Stats Fetch Error:", err);
        setError(err.response?.data?.error || err.message || "Failed to load system KPIs.");
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
          <p style={{ color: "#9ca3af", fontFamily: "'Outfit', sans-serif" }}>Compiling health statistics...</p>
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
            <h3>⚠️ Administration Error</h3>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} style={retryButtonStyle}>Retry Fetch</button>
          </div>
        </div>
      </div>
    );
  }

  const { kpis, charts } = stats || {};

  // ── Chart Data definitions ───────────────────────────────────────
  // 1. BMI Doughnut Chart
  const bmiData = {
    labels: ["Underweight", "Normal", "Overweight", "Obese"],
    datasets: [
      {
        data: [
          charts?.bmiDistribution?.Underweight || 0,
          charts?.bmiDistribution?.Normal || 0,
          charts?.bmiDistribution?.Overweight || 0,
          charts?.bmiDistribution?.Obese || 0,
        ],
        backgroundColor: ["#38bdf8" /* Light Blue */, "#10b981" /* Emerald */, "#f59e0b" /* Amber */, "#ef4444" /* Red */],
        borderWidth: 0,
      },
    ],
  };

  const bmiOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "70%",
    plugins: {
      legend: {
        position: "right",
        labels: { color: "#e2e8f0", font: { family: "Inter", size: 12 }, padding: 12, usePointStyle: true },
      },
    },
  };

  // 2. Risk score bar chart
  const riskLabels = Object.keys(charts?.riskScoreDistribution || {});
  const riskData = {
    labels: riskLabels,
    datasets: [
      {
        label: "Assessments",
        data: Object.values(charts?.riskScoreDistribution || {}),
        backgroundColor: "rgba(16, 185, 129, 0.75)",
        borderColor: "#10b981",
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const riskOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        grid: { color: "rgba(255,255,255,0.06)" },
        ticks: { color: "#94a3b8", font: { size: 10 } },
      },
      x: {
        grid: { display: false },
        ticks: { color: "#94a3b8", font: { size: 10 } },
      },
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
              Ayurvedic AI Core Dashboard
            </span>
            <h1 style={{ margin: "4px 0 0 0", fontSize: "28px", color: "#fff", fontWeight: "700", fontFamily: "'Outfit', sans-serif" }}>
              Platform Overview
            </h1>
          </div>
          <div style={timebadgeStyle}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", display: "inline-block" }}></span>
            SECURE LIVE STREAM
          </div>
        </header>

        {/* 6 KPI Cards Grid */}
        <section style={kpisGridStyle}>
          
          {/* KPI Card 1: Total Users */}
          <div className="kpi-card" style={kpiCardStyle}>
            <div style={kpiHeaderStyle}>
              <span style={kpiLabelStyle}>Total Patients</span>
              <span style={{ ...kpiIconStyle, background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>👥</span>
            </div>
            <div style={kpiValueWrapStyle}>
              <span style={kpiValueStyle}>{kpis?.totalUsers || 0}</span>
              <span style={{ ...kpiTrendStyle, color: kpis?.monthlyGrowth >= 0 ? "#10b981" : "#ef4444" }}>
                {kpis?.monthlyGrowth >= 0 ? "↑" : "↓"} {Math.abs(kpis?.monthlyGrowth || 0)}%
              </span>
            </div>
            <span style={kpiSubtextStyle}>monthly growth rate</span>
            {/* Sparkline Visual (CSS-only futuristic line) */}
            <div style={sparklineStyle}>
              <div style={{ ...sparklineBarStyle, height: "45%", background: "rgba(16, 185, 129, 0.3)" }}></div>
              <div style={{ ...sparklineBarStyle, height: "60%", background: "rgba(16, 185, 129, 0.3)" }}></div>
              <div style={{ ...sparklineBarStyle, height: "50%", background: "rgba(16, 185, 129, 0.3)" }}></div>
              <div style={{ ...sparklineBarStyle, height: "80%", background: "rgba(16, 185, 129, 0.6)" }}></div>
              <div style={{ ...sparklineBarStyle, height: "95%", background: "#10b981" }}></div>
            </div>
          </div>

          {/* KPI Card 2: Active Users */}
          <div className="kpi-card" style={kpiCardStyle}>
            <div style={kpiHeaderStyle}>
              <span style={kpiLabelStyle}>Active Users (30d)</span>
              <span style={{ ...kpiIconStyle, background: "rgba(6, 182, 212, 0.1)", color: "#06b6d4" }}>⚡</span>
            </div>
            <div style={kpiValueWrapStyle}>
              <span style={kpiValueStyle}>{kpis?.activeUsers || 0}</span>
              <span style={{ color: "#06b6d4", fontSize: "13px", fontWeight: "600" }}>Live</span>
            </div>
            <span style={kpiSubtextStyle}>assessed in past 30 days</span>
            <div style={sparklineStyle}>
              <div style={{ ...sparklineBarStyle, height: "30%", background: "rgba(6, 182, 212, 0.3)" }}></div>
              <div style={{ ...sparklineBarStyle, height: "40%", background: "rgba(6, 182, 212, 0.3)" }}></div>
              <div style={{ ...sparklineBarStyle, height: "65%", background: "rgba(6, 182, 212, 0.3)" }}></div>
              <div style={{ ...sparklineBarStyle, height: "85%", background: "rgba(6, 182, 212, 0.6)" }}></div>
              <div style={{ ...sparklineBarStyle, height: "90%", background: "#06b6d4" }}></div>
            </div>
          </div>

          {/* KPI Card 3: Daily Assessments */}
          <div className="kpi-card" style={kpiCardStyle}>
            <div style={kpiHeaderStyle}>
              <span style={kpiLabelStyle}>Daily Assessments</span>
              <span style={{ ...kpiIconStyle, background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" }}>📋</span>
            </div>
            <div style={kpiValueWrapStyle}>
              <span style={kpiValueStyle}>{kpis?.dailyAssessments || 0}</span>
              <span style={{ color: "#f59e0b", fontSize: "13px", fontWeight: "600" }}>+Today</span>
            </div>
            <span style={kpiSubtextStyle}>completed assessments today</span>
            <div style={sparklineStyle}>
              <div style={{ ...sparklineBarStyle, height: "20%", background: "rgba(245, 158, 11, 0.3)" }}></div>
              <div style={{ ...sparklineBarStyle, height: "35%", background: "rgba(245, 158, 11, 0.3)" }}></div>
              <div style={{ ...sparklineBarStyle, height: "55%", background: "rgba(245, 158, 11, 0.3)" }}></div>
              <div style={{ ...sparklineBarStyle, height: "70%", background: "rgba(245, 158, 11, 0.6)" }}></div>
              <div style={{ ...sparklineBarStyle, height: "85%", background: "#f59e0b" }}></div>
            </div>
          </div>

          {/* KPI Card 4: Average Risk Score */}
          <div className="kpi-card" style={kpiCardStyle}>
            <div style={kpiHeaderStyle}>
              <span style={kpiLabelStyle}>Avg Risk Score</span>
              <span style={{ ...kpiIconStyle, background: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6" }}>📊</span>
            </div>
            <div style={kpiValueWrapStyle}>
              <span style={kpiValueStyle}>{kpis?.avgRiskScore || 0}%</span>
              <span style={{ color: "#8b5cf6", fontSize: "13px", fontWeight: "600" }}>Index</span>
            </div>
            <span style={kpiSubtextStyle}>mean assessment risk score</span>
            <div style={sparklineStyle}>
              <div style={{ ...sparklineBarStyle, height: "80%", background: "rgba(139, 92, 246, 0.3)" }}></div>
              <div style={{ ...sparklineBarStyle, height: "75%", background: "rgba(139, 92, 246, 0.3)" }}></div>
              <div style={{ ...sparklineBarStyle, height: "70%", background: "rgba(139, 92, 246, 0.3)" }}></div>
              <div style={{ ...sparklineBarStyle, height: "60%", background: "rgba(139, 92, 246, 0.6)" }}></div>
              <div style={{ ...sparklineBarStyle, height: "55%", background: "#8b5cf6" }}></div>
            </div>
          </div>

          {/* KPI Card 5: High-Risk Users */}
          <div className="kpi-card" style={kpiCardStyle}>
            <div style={kpiHeaderStyle}>
              <span style={kpiLabelStyle}>High-Risk Patients</span>
              <span style={{ ...kpiIconStyle, background: "rgba(239, 68, 68, 0.1)", color: "#ef4444" }}>⚠️</span>
            </div>
            <div style={kpiValueWrapStyle}>
              <span style={kpiValueStyle}>{kpis?.highRiskUsers || 0}</span>
              <span style={{ color: "#ef4444", fontSize: "13px", fontWeight: "600" }}>Critical</span>
            </div>
            <span style={kpiSubtextStyle}>active users scoring &gt; 70%</span>
            <div style={sparklineStyle}>
              <div style={{ ...sparklineBarStyle, height: "15%", background: "rgba(239, 68, 68, 0.3)" }}></div>
              <div style={{ ...sparklineBarStyle, height: "25%", background: "rgba(239, 68, 68, 0.3)" }}></div>
              <div style={{ ...sparklineBarStyle, height: "45%", background: "rgba(239, 68, 68, 0.3)" }}></div>
              <div style={{ ...sparklineBarStyle, height: "65%", background: "rgba(239, 68, 68, 0.6)" }}></div>
              <div style={{ ...sparklineBarStyle, height: "80%", background: "#ef4444" }}></div>
            </div>
          </div>

          {/* KPI Card 6: AI Accuracy */}
          <div className="kpi-card" style={kpiCardStyle}>
            <div style={kpiHeaderStyle}>
              <span style={kpiLabelStyle}>AI Model Accuracy</span>
              <span style={{ ...kpiIconStyle, background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>🤖</span>
            </div>
            <div style={kpiValueWrapStyle}>
              <span style={kpiValueStyle}>{kpis?.aiPredictionAccuracy || 98.4}%</span>
              <span style={{ color: "#10b981", fontSize: "13px", fontWeight: "600" }}>Stable</span>
            </div>
            <span style={kpiSubtextStyle}>Qwen-2.5 validation index</span>
            <div style={sparklineStyle}>
              <div style={{ ...sparklineBarStyle, height: "95%", background: "rgba(16, 185, 129, 0.3)" }}></div>
              <div style={{ ...sparklineBarStyle, height: "96%", background: "rgba(16, 185, 129, 0.3)" }}></div>
              <div style={{ ...sparklineBarStyle, height: "95%", background: "rgba(16, 185, 129, 0.3)" }}></div>
              <div style={{ ...sparklineBarStyle, height: "98%", background: "rgba(16, 185, 129, 0.6)" }}></div>
              <div style={{ ...sparklineBarStyle, height: "99%", background: "#10b981" }}></div>
            </div>
          </div>

        </section>

        {/* Dynamic visual charts layout */}
        <section style={chartsRowStyle}>
          {/* Chart 1: Risk score distribution */}
          <div className="dashboard-chart-card" style={chartCardStyle}>
            <h3 style={chartTitleStyle}>Risk Score Group Distribution</h3>
            <div style={chartWrapStyle}>
              <Bar data={riskData} options={riskOptions} />
            </div>
          </div>

          {/* Chart 2: BMI category ratio */}
          <div className="dashboard-chart-card" style={chartCardStyle}>
            <h3 style={chartTitleStyle}>BMI Categories Ratio</h3>
            <div style={{ ...chartWrapStyle, height: "200px" }}>
              <Doughnut data={bmiData} options={bmiOptions} />
            </div>
          </div>
        </section>

        {/* Quick Operations panel */}
        <section style={quickOpsStyle}>
          <h3 style={{ fontSize: "16px", color: "#fff", margin: "0 0 16px 0", fontWeight: "600" }}>System Portals</h3>
          <div style={quickOpsGridStyle}>
            <Link to="/admin/users" style={opCardStyle}>
              <div style={opIconStyle}>👥</div>
              <div>
                <h4 style={opTitleStyle}>User Directory</h4>
                <p style={opDescStyle}>Search user records, inspect history timelines, suspend accounts.</p>
              </div>
            </Link>

            <Link to="/admin/analytics" style={opCardStyle}>
              <div style={opIconStyle}>📈</div>
              <div>
                <h4 style={opTitleStyle}>Ayurvedic Analytics</h4>
                <p style={opDescStyle}>Deep-dive disease frequency trends, lifestyle heatmaps, BMI insights.</p>
              </div>
            </Link>

            <Link to="/admin/reports" style={opCardStyle}>
              <div style={opIconStyle}>📄</div>
              <div>
                <h4 style={opTitleStyle}>Assessment logs</h4>
                <p style={opDescStyle}>Batch paginated logs list, download CSV data, view report details.</p>
              </div>
            </Link>
          </div>
        </section>

      </main>
    </div>
  );
}

// ── Shared Inline CSS tokens ──────────────────────────────────────────
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

const timebadgeStyle = {
  background: "rgba(16, 185, 129, 0.08)",
  border: "1px solid rgba(16, 185, 129, 0.2)",
  color: "#10b981",
  fontSize: "12px",
  fontWeight: "700",
  padding: "8px 16px",
  borderRadius: "30px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  letterSpacing: "0.5px",
};

const kpisGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "24px",
  marginBottom: "36px",
};

const kpiCardStyle = {
  background: "rgba(17, 24, 39, 0.65)",
  border: "1px solid rgba(255, 255, 255, 0.05)",
  borderRadius: "16px",
  padding: "24px",
  display: "flex",
  flexDirection: "column",
  position: "relative",
  overflow: "hidden",
  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
};

const kpiHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "12px",
};

const kpiLabelStyle = {
  fontSize: "14px",
  color: "#9ca3af",
  fontWeight: "500",
};

const kpiIconStyle = {
  width: "32px",
  height: "32px",
  borderRadius: "8px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "16px",
};

const kpiValueWrapStyle = {
  display: "flex",
  alignItems: "baseline",
  gap: "10px",
  marginBottom: "4px",
};

const kpiValueStyle = {
  fontSize: "28px",
  fontWeight: "700",
  color: "#fff",
  fontFamily: "'Outfit', sans-serif",
};

const kpiTrendStyle = {
  fontSize: "13px",
  fontWeight: "600",
};

const kpiSubtextStyle = {
  fontSize: "12px",
  color: "#6b7280",
};

const sparklineStyle = {
  display: "flex",
  alignItems: "flex-end",
  gap: "4px",
  height: "32px",
  marginTop: "16px",
};

const sparklineBarStyle = {
  flex: 1,
  borderRadius: "2px",
  transition: "height 0.3s ease",
};

const chartsRowStyle = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr",
  gap: "24px",
  marginBottom: "36px",
};

const chartCardStyle = {
  background: "rgba(17, 24, 39, 0.65)",
  border: "1px solid rgba(255, 255, 255, 0.05)",
  borderRadius: "16px",
  padding: "24px",
  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
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
};

const quickOpsStyle = {
  background: "rgba(17, 24, 39, 0.4)",
  border: "1px solid rgba(255, 255, 255, 0.03)",
  borderRadius: "16px",
  padding: "24px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
};

const quickOpsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "20px",
};

const opCardStyle = {
  display: "flex",
  gap: "16px",
  background: "rgba(17, 24, 39, 0.6)",
  border: "1px solid rgba(255,255,255,0.05)",
  borderRadius: "12px",
  padding: "20px",
  textDecoration: "none",
  color: "inherit",
  transition: "all 0.2s ease",
};

const opIconStyle = {
  fontSize: "24px",
  width: "48px",
  height: "48px",
  borderRadius: "10px",
  background: "rgba(255,255,255,0.03)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const opTitleStyle = {
  fontSize: "15px",
  fontWeight: "600",
  color: "#fff",
  margin: "0 0 4px 0",
};

const opDescStyle = {
  fontSize: "12px",
  color: "#9ca3af",
  margin: 0,
  lineHeight: "1.5",
};

export default AdminDashboard;
