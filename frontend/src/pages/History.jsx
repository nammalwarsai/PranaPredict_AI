import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { getReports } from "../api/api";
import TrendCharts from "../components/TrendCharts";
import { generateHealthReportPdf } from "../utils/pdfReportGenerator";

function getRiskTone(level) {
  switch (level) {
    case "Low": return "low";
    case "Moderate": return "moderate";
    case "High": return "high";
    default: return "unknown";
  }
}

function formatReportDate(value) {
  return new Date(value).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function History() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    let active = true;
    let safetyTimer;

    async function fetchReports() {
      setLoading(true);
      setError(null);
      try {
        const response = await getReports(page);
        if (!active) return;
        clearTimeout(safetyTimer);
        setReports(response.data.data || []);
        setPagination(response.data.pagination || null);
      } catch (err) {
        if (!active) return;
        clearTimeout(safetyTimer);
        if (err.code === "ECONNABORTED") {
          setError("Loading reports timed out. Please try again.");
        } else {
          setError(err.response?.data?.error || "Failed to load reports");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    safetyTimer = setTimeout(() => {
      if (!active) return;
      setError("Loading reports timed out. Please try again.");
      setLoading(false);
    }, 13000);

    fetchReports();

    return () => {
      active = false;
      clearTimeout(safetyTimer);
    };
  }, [page]);

  const handleDownload = useCallback((report) => {
    setDownloadingId(report.id);

    try {
      generateHealthReportPdf(report);
    } catch (downloadError) {
      console.error("PDF generation failed:", downloadError);
      setError("Failed to generate PDF report. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  }, []);

  const pageHeader = (
    <div className="page-head history-page-head">
      <div className="history-head-copy">
        <h1 className="page-title">Health Report History</h1>
        <p className="page-subtitle">Track your historical assessments, monitor trend movement, and export any report as PDF.</p>
      </div>
      <div className="history-head-pill">
        {reports.length} Report{reports.length === 1 ? "" : "s"}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="history-page history-page-modern">
        {pageHeader}
        <div className="history-loading-card">
          <p className="loading-text">Loading your reports...</p>
        </div>
      </div>
    );
  }

  const totalPages = pagination?.totalPages ?? 1;
  const averageScore = reports.length
    ? Math.round(reports.reduce((sum, report) => sum + Number(report.risk_score || 0), 0) / reports.length)
    : 0;

  return (
    <div className="history-page history-page-modern">
      {pageHeader}

      <div className="history-stats-grid">
        <div className="history-stat-card">
          <span className="history-stat-label">Reports on this page</span>
          <strong className="history-stat-value">{reports.length}</strong>
        </div>
        <div className="history-stat-card">
          <span className="history-stat-label">Average risk score</span>
          <strong className="history-stat-value">{averageScore}/100</strong>
        </div>
        <div className="history-stat-card">
          <span className="history-stat-label">Current page</span>
          <strong className="history-stat-value">{page} / {totalPages}</strong>
        </div>
      </div>

      {error && <div className="error-message history-error">{error}</div>}

      {reports.length === 0 && !error ? (
        <div className="empty-state">
          <span className="empty-icon">&#128203;</span>
          <p>No reports yet. Go to the Dashboard to create your first health assessment.</p>
          <Link to="/dashboard" className="btn-primary empty-cta">Start Your First Assessment</Link>
        </div>
      ) : (
        <>
        {page === 1 && reports.length >= 2 && <TrendCharts reports={reports} />}
        <div className="reports-list">
          {reports.map((report) => (
            <div key={report.id} className="report-card">
              <div className="report-card-header">
                <span
                  className={`report-risk-badge report-risk-badge--${getRiskTone(report.risk_level)}`}
                >
                  {report.risk_level} Risk
                </span>
                <span className="report-date">
                  {formatReportDate(report.created_at)}
                </span>
              </div>
              <div className="report-card-body">
                <div className="report-score">
                  Risk Score <strong>{report.risk_score}</strong>/100
                </div>
                <div className="report-details-row">
                  <span>Age: {report.age}</span>
                  <span>BMI: {report.bmi}</span>
                  <span>BP: {report.blood_pressure}</span>
                  <span>Cholesterol: {report.cholesterol || "N/A"}</span>
                </div>
              </div>
              {report.llm_advice && (
                <div className="report-advice-preview">
                  {report.llm_advice.length > 150
                    ? report.llm_advice.substring(0, 150) + "..."
                    : report.llm_advice}
                </div>
              )}
              <div className="report-card-footer">
                <button
                  className="download-pdf-btn"
                  onClick={() => handleDownload(report)}
                  title="Download PDF Report"
                  disabled={downloadingId === report.id}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  {downloadingId === report.id ? "Preparing PDF..." : "Download Premium PDF"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="pagination-btn"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Previous
            </button>
            <span className="pagination-info">Page {page} of {totalPages}</span>
            <button
              className="pagination-btn"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next →
            </button>
          </div>
        )}
        </>
      )}
    </div>
  );
}

export default History;
