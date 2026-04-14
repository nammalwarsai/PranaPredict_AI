import { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import { getAllReports } from "../api/api";
import { useTheme } from "../context/ThemeContext";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

const ANALYTICS_FIELDS = [
  { key: "risk_score", label: "Risk Score", unit: "", type: "number" },
  { key: "bmi", label: "BMI", unit: "", type: "number" },
  { key: "age", label: "Age", unit: "years", type: "number" },
  { key: "water_intake", label: "Water Intake", unit: "L/day", type: "number" },
  { key: "sleep_duration", label: "Sleep Duration", unit: "hours", type: "number" },
  { key: "blood_pressure", label: "Systolic BP", unit: "mmHg", type: "bpSystolic" },
  { key: "cholesterol", label: "Cholesterol Category", unit: "", type: "cholesterol" },
  { key: "activity_level", label: "Activity Level", unit: "", type: "activity" },
];

const cholesterolMap = { normal: 1, borderline: 2, high: 3 };
const activityMap = { low: 1, moderate: 2, high: 3 };

function normalizeValue(report, field) {
  const raw = report[field.key];
  if (raw === null || raw === undefined) return null;

  if (field.type === "number") {
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  if (field.type === "bpSystolic") {
    if (typeof raw !== "string") return null;
    const systolic = Number(raw.split("/")[0]);
    return Number.isFinite(systolic) ? systolic : null;
  }

  if (field.type === "cholesterol") return cholesterolMap[String(raw).toLowerCase()] ?? null;
  if (field.type === "activity") return activityMap[String(raw).toLowerCase()] ?? null;
  return null;
}

function formatLabel(dateText) {
  const d = new Date(dateText);
  return Number.isNaN(d.getTime())
    ? "Unknown"
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function Analytics() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFieldKey, setSelectedFieldKey] = useState("risk_score");

  useEffect(() => {
    let active = true;

    async function loadReports() {
      setLoading(true);
      setError(null);
      try {
        const allReports = await getAllReports();
        if (!active) return;
        setReports(allReports);
      } catch (err) {
        if (!active) return;
        setError(err.response?.data?.error || "Failed to load analytics data");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadReports();
    return () => {
      active = false;
    };
  }, []);

  const selectedField = useMemo(
    () => ANALYTICS_FIELDS.find((f) => f.key === selectedFieldKey) || ANALYTICS_FIELDS[0],
    [selectedFieldKey]
  );

  const points = useMemo(() => {
    return [...reports]
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .map((report) => ({
        id: report.id,
        created_at: report.created_at,
        label: formatLabel(report.created_at),
        value: normalizeValue(report, selectedField),
      }))
      .filter((p) => p.value !== null);
  }, [reports, selectedField]);

  const average = useMemo(() => {
    if (!points.length) return "—";
    const sum = points.reduce((acc, p) => acc + p.value, 0);
    return (sum / points.length).toFixed(1);
  }, [points]);

  const latest = points.length ? points[points.length - 1].value : "—";
  const min = points.length ? Math.min(...points.map((p) => p.value)) : "—";
  const max = points.length ? Math.max(...points.map((p) => p.value)) : "—";

  const labels = points.map((p) => p.label);
  const values = points.map((p) => p.value);
  const axisText = isDark ? "#94a3b8" : "#64748b";
  const gridColor = isDark ? "#334155" : "#e2e8f0";
  const lineColor = "#2563eb";

  const lineData = {
    labels,
    datasets: [
      {
        label: selectedField.label,
        data: values,
        borderColor: lineColor,
        backgroundColor: isDark ? "rgba(37, 99, 235, 0.2)" : "rgba(37, 99, 235, 0.1)",
        pointBackgroundColor: "#1d4ed8",
        pointRadius: 4,
        borderWidth: 2.5,
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const barData = {
    labels,
    datasets: [
      {
        label: selectedField.label,
        data: values,
        backgroundColor: "rgba(14, 165, 233, 0.75)",
        borderRadius: 8,
        maxBarThickness: 32,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: isDark ? "#334155" : "#1e293b" },
    },
    scales: {
      y: {
        ticks: { color: axisText },
        grid: { color: gridColor },
      },
      x: {
        ticks: { color: axisText },
        grid: { display: false },
      },
    },
  };

  return (
    <div className="analytics-page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Value Analytics</h1>
          <p className="page-subtitle">
            Select a health field and explore trends from your historical assessments.
          </p>
        </div>
      </div>

      <div className="analytics-controls">
        <label htmlFor="analytics-field" className="analytics-label">Select field</label>
        <select
          id="analytics-field"
          className="analytics-select"
          value={selectedFieldKey}
          onChange={(e) => setSelectedFieldKey(e.target.value)}
        >
          {ANALYTICS_FIELDS.map((field) => (
            <option key={field.key} value={field.key}>{field.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="loading-text">Loading analytics...</p>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : points.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">&#128200;</span>
          <p>
            Not enough data for this field yet. Add more health reports to unlock analytics.
          </p>
        </div>
      ) : (
        <>
          <div className="analytics-stats">
            <div className="analytics-stat-card">
              <span className="analytics-stat-label">Latest</span>
              <strong>{latest}{selectedField.unit ? ` ${selectedField.unit}` : ""}</strong>
            </div>
            <div className="analytics-stat-card">
              <span className="analytics-stat-label">Average</span>
              <strong>{average}{selectedField.unit ? ` ${selectedField.unit}` : ""}</strong>
            </div>
            <div className="analytics-stat-card">
              <span className="analytics-stat-label">Range</span>
              <strong>{min} - {max}</strong>
            </div>
          </div>

          <div className="analytics-chart-grid">
            <div className="analytics-chart-card">
              <h3>{selectedField.label} Trend</h3>
              <div className="analytics-chart-wrap">
                <Line data={lineData} options={chartOptions} />
              </div>
            </div>
            <div className="analytics-chart-card">
              <h3>{selectedField.label} Distribution</h3>
              <div className="analytics-chart-wrap">
                <Bar data={barData} options={chartOptions} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Analytics;
