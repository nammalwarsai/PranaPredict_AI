import { useState, useEffect } from "react";
import { getReports } from "../api/api";
import { jsPDF } from "jspdf";

function History() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function fetchReports() {
      try {
        const response = await getReports();
        if (!active) return;
        setReports(response.data.data || []);
      } catch (err) {
        if (!active) return;
        if (err.code === "ECONNABORTED") {
          setError("Loading reports timed out. Please try again.");
        } else {
          setError(err.response?.data?.error || "Failed to load reports");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    const safetyTimer = setTimeout(() => {
      if (!active) return;
      setError("Loading reports timed out. Please try again.");
      setLoading(false);
    }, 13000);

    fetchReports();

    return () => {
      active = false;
      clearTimeout(safetyTimer);
    };
  }, []);

  const getRiskColor = (level) => {
    switch (level) {
      case "Low": return "#22c55e";
      case "Moderate": return "#f59e0b";
      case "High": return "#ef4444";
      default: return "#6b7280";
    }
  };

  const downloadPDF = (report) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = 20;

    // --- Header background ---
    const riskColor = getRiskColor(report.risk_level);
    const [r, g, b] = [
      parseInt(riskColor.slice(1, 3), 16),
      parseInt(riskColor.slice(3, 5), 16),
      parseInt(riskColor.slice(5, 7), 16),
    ];
    doc.setFillColor(37, 99, 235); // primary blue
    doc.rect(0, 0, pageWidth, 48, "F");

    // --- Title ---
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("PranaPredict AI", margin, y + 8);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Health Risk Assessment Report", margin, y + 18);

    const reportDate = new Date(report.created_at).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    doc.setFontSize(9);
    doc.text(reportDate, pageWidth - margin, y + 8, { align: "right" });
    doc.text(`Report ID: ${report.id?.substring(0, 8) || "N/A"}`, pageWidth - margin, y + 16, { align: "right" });

    y = 58;

    // --- Risk Score Box ---
    doc.setFillColor(r, g, b);
    doc.roundedRect(margin, y, contentWidth, 36, 4, 4, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text(`${report.risk_score}`, margin + contentWidth / 2 - 10, y + 18, { align: "center" });
    doc.setFontSize(12);
    doc.text(`/ 100`, margin + contentWidth / 2 + 12, y + 18);
    doc.setFontSize(16);
    doc.text(`${report.risk_level} Risk`, margin + contentWidth / 2, y + 30, { align: "center" });

    y += 46;

    // --- Health Data Section ---
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Health Data Summary", margin, y);
    y += 3;
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.8);
    doc.line(margin, y, margin + 50, y);
    y += 10;

    const healthFields = [
      ["Age", `${report.age} years`],
      ["BMI", `${report.bmi}`],
      ["Blood Pressure", report.blood_pressure || "N/A"],
      ["Cholesterol", report.cholesterol || "N/A"],
      ["Smoking", report.smoking ? "Yes" : "No"],
      ["Activity Level", report.activity_level || "N/A"],
    ];

    doc.setFontSize(10);
    const colWidth = contentWidth / 2;
    healthFields.forEach((field, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const xPos = margin + col * colWidth;
      const yPos = y + row * 16;

      // Label
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(field[0], xPos, yPos);
      // Value
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text(field[1], xPos, yPos + 6);
    });

    y += Math.ceil(healthFields.length / 2) * 16 + 8;

    // --- AI Health Advice Section ---
    if (report.llm_advice) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text("AI Health Advice", margin, y);
      y += 3;
      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(0.8);
      doc.line(margin, y, margin + 40, y);
      y += 8;

      const adviceLines = doc.splitTextToSize(report.llm_advice, contentWidth);
      const lineHeight = 5.5;
      const pageHeight = doc.internal.pageSize.getHeight();
      const bottomMargin = 30;

      doc.setFontSize(9.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 41, 59);

      for (let i = 0; i < adviceLines.length; i++) {
        if (y + lineHeight > pageHeight - bottomMargin) {
          doc.addPage();
          y = 25;
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(30, 41, 59);
          doc.text("AI Health Advice (continued)", margin, y);
          y += 10;
          doc.setFontSize(9.5);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(30, 41, 59);
        }
        doc.text(adviceLines[i], margin, y);
        y += lineHeight;
      }
      y += 10;
    }

    // --- Footer ---
    const footerY = doc.internal.pageSize.getHeight() - 15;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text("Generated by PranaPredict AI — For informational purposes only. Not a medical diagnosis.", margin, footerY);
    doc.text(`Page 1`, pageWidth - margin, footerY, { align: "right" });

    // Save
    const fileName = `PranaPredict_Report_${report.risk_level}_${new Date(report.created_at).toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
  };

  if (loading) {
    return (
      <div className="history-page">
        <h1>Health Report History</h1>
        <p className="loading-text">Loading your reports...</p>
      </div>
    );
  }

  return (
    <div className="history-page">
      <h1>Health Report History</h1>

      {error && <div className="error-message">{error}</div>}

      {reports.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">&#128203;</span>
          <p>No reports yet. Go to the Dashboard to create your first health assessment.</p>
        </div>
      ) : (
        <div className="reports-list">
          {reports.map((report) => (
            <div key={report.id} className="report-card">
              <div className="report-card-header">
                <span
                  className="report-risk-badge"
                  style={{ backgroundColor: getRiskColor(report.risk_level) }}
                >
                  {report.risk_level} Risk
                </span>
                <span className="report-date">
                  {new Date(report.created_at).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="report-card-body">
                <div className="report-score">
                  Score: <strong>{report.risk_score}</strong>/100
                </div>
                <div className="report-details-row">
                  <span>Age: {report.age}</span>
                  <span>BMI: {report.bmi}</span>
                  <span>BP: {report.blood_pressure}</span>
                  <span>Cholesterol: {report.cholesterol}</span>
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
                  onClick={() => downloadPDF(report)}
                  title="Download PDF Report"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default History;
