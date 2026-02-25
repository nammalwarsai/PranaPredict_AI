import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

function TrendCharts({ reports }) {
  const sorted = useMemo(
    () =>
      [...reports].sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      ),
    [reports]
  );

  const lineData = useMemo(() => {
    const labels = sorted.map((r) =>
      new Date(r.created_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      })
    );

    return {
      labels,
      datasets: [
        {
          label: "Risk Score",
          data: sorted.map((r) => r.risk_score),
          borderColor: "#2563eb",
          backgroundColor: "rgba(37, 99, 235, 0.08)",
          pointBackgroundColor: sorted.map((r) => {
            if (r.risk_level === "High") return "#ef4444";
            if (r.risk_level === "Moderate") return "#f59e0b";
            return "#22c55e";
          }),
          pointRadius: 6,
          pointHoverRadius: 9,
          borderWidth: 2.5,
          tension: 0.35,
          fill: true,
        },
      ],
    };
  }, [sorted]);

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1e293b",
        titleFont: { size: 13, weight: "bold" },
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          afterLabel: (ctx) => {
            const r = sorted[ctx.dataIndex];
            return `Risk: ${r.risk_level}`;
          },
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: { stepSize: 20, color: "#64748b", font: { size: 11 } },
        grid: { color: "#f1f5f9" },
      },
      x: {
        ticks: { color: "#64748b", font: { size: 11 } },
        grid: { display: false },
      },
    },
  };

  const distribution = useMemo(() => {
    const counts = { Low: 0, Moderate: 0, High: 0 };
    reports.forEach((r) => {
      if (counts[r.risk_level] !== undefined) counts[r.risk_level]++;
    });
    return counts;
  }, [reports]);

  const doughnutData = {
    labels: ["Low", "Moderate", "High"],
    datasets: [
      {
        data: [distribution.Low, distribution.Moderate, distribution.High],
        backgroundColor: ["#22c55e", "#f59e0b", "#ef4444"],
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "65%",
    plugins: {
      legend: {
        position: "bottom",
        labels: { padding: 16, usePointStyle: true, pointStyleWidth: 10, font: { size: 12 } },
      },
      tooltip: {
        backgroundColor: "#1e293b",
        padding: 10,
        cornerRadius: 8,
      },
    },
  };

  const avgScore =
    reports.length > 0
      ? (reports.reduce((s, r) => s + r.risk_score, 0) / reports.length).toFixed(
          1
        )
      : "—";

  const latestScore = sorted.length > 0 ? sorted[sorted.length - 1].risk_score : "—";

  const trend = useMemo(() => {
    if (sorted.length < 2) return null;
    const last = sorted[sorted.length - 1].risk_score;
    const prev = sorted[sorted.length - 2].risk_score;
    const diff = last - prev;
    if (diff > 0) return { dir: "up", diff: `+${diff}`, color: "#ef4444", icon: "↑" };
    if (diff < 0) return { dir: "down", diff: `${diff}`, color: "#22c55e", icon: "↓" };
    return { dir: "same", diff: "0", color: "#64748b", icon: "→" };
  }, [sorted]);

  return (
    <div className="trend-section">
      <h2 className="trend-heading">Your Health Trends</h2>

      {/* Summary stat cards */}
      <div className="trend-stats">
        <div className="trend-stat-card">
          <span className="trend-stat-label">Assessments</span>
          <span className="trend-stat-value">{reports.length}</span>
        </div>
        <div className="trend-stat-card">
          <span className="trend-stat-label">Average Score</span>
          <span className="trend-stat-value">{avgScore}</span>
        </div>
        <div className="trend-stat-card">
          <span className="trend-stat-label">Latest Score</span>
          <span className="trend-stat-value">
            {latestScore}
            {trend && (
              <span className="trend-indicator" style={{ color: trend.color }}>
                {" "}{trend.icon} {trend.diff}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Charts grid */}
      <div className="trend-charts-grid">
        <div className="trend-chart-card">
          <h3>Risk Score Over Time</h3>
          <div className="trend-chart-wrap">
            <Line data={lineData} options={lineOptions} />
          </div>
        </div>

        <div className="trend-chart-card">
          <h3>Risk Distribution</h3>
          <div className="trend-chart-wrap trend-chart-wrap--donut">
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default TrendCharts;
