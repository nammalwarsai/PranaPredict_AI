import { useMemo, memo } from "react";
import DOMPurify from "dompurify";

const SANITIZE_OPTIONS = { ALLOWED_TAGS: ["strong", "em", "b", "i"] };

function getRiskColor(level) {
  switch (level) {
    case "Low": return "#22c55e";
    case "Moderate": return "#f59e0b";
    case "High": return "#ef4444";
    default: return "#6b7280";
  }
}

function RiskResult({ result }) {
  const { riskScore, riskLevel, advice, healthData, model } = result || {};

  const renderedAdvice = useMemo(() => {
    if (!advice) return null;
    const lines = advice.split("\n").filter((l) => l.trim() !== "");
    return lines.map((line, i) => {
      const formatted = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      const clean = DOMPurify.sanitize(formatted, SANITIZE_OPTIONS);
      if (/^\d+\.\s/.test(line)) {
        return <p key={i} className="advice-line advice-numbered" dangerouslySetInnerHTML={{ __html: clean }} />;
      }
      if (/^[-*]\s/.test(line)) {
        const bulletClean = DOMPurify.sanitize(
          formatted.replace(/^[-*]\s/, ""),
          SANITIZE_OPTIONS
        );
        return <p key={i} className="advice-line advice-bullet" dangerouslySetInnerHTML={{ __html: bulletClean }} />;
      }
      return <p key={i} className="advice-line" dangerouslySetInnerHTML={{ __html: clean }} />;
    });
  }, [advice]);

  const riskColor = getRiskColor(riskLevel);

  if (!result) return null;

  return (
    <div className="risk-result">
      <h2>Your Health Risk Assessment</h2>

      <div className="risk-score-card" style={{ borderColor: riskColor }}>
        <div className="risk-score-circle" style={{ backgroundColor: riskColor }}>
          <span className="score-number">{riskScore}</span>
          <span className="score-label">/ 100</span>
        </div>
        <div className="risk-level" style={{ color: riskColor }}>
          {riskLevel} Risk
        </div>
      </div>

      <div className="risk-details">
        <h3>Input Summary</h3>
        <div className="details-grid">
          <div><strong>Age:</strong> {healthData.age}</div>
          <div><strong>BMI:</strong> {healthData.bmi}</div>
          <div><strong>Blood Pressure:</strong> {healthData.bloodPressure}</div>
          <div><strong>Cholesterol:</strong> <span style={{ textTransform: "capitalize" }}>{healthData.cholesterol}</span></div>
          <div><strong>Smoking:</strong> {healthData.smoking ? "Yes" : "No"}</div>
          <div><strong>Activity:</strong> <span style={{ textTransform: "capitalize" }}>{healthData.activityLevel}</span></div>
          <div><strong>Location:</strong> <span style={{ textTransform: "capitalize" }}>{healthData.location}</span></div>
          <div><strong>Work Type:</strong> <span style={{ textTransform: "capitalize" }}>{healthData.workType}</span></div>
          <div><strong>Diet Type:</strong> <span style={{ textTransform: "capitalize" }}>{healthData.dietType}</span></div>
          <div><strong>Alcohol:</strong> <span style={{ textTransform: "capitalize" }}>{healthData.alcoholConsumption}</span></div>
          <div><strong>Water:</strong> {healthData.waterIntake} L</div>
          <div><strong>Sleep:</strong> {healthData.sleepDuration} hrs</div>
          <div style={{ gridColumn: "1 / -1" }}>
            <strong>Pre-existing Conditions:</strong>{" "}
            {[
              healthData.diabetes && "Diabetes",
              healthData.hypertension && "Hypertension",
              healthData.heartDisease && "Heart Disease",
              healthData.kidneyDisease && "Kidney Disease"
            ].filter(Boolean).join(", ") || "None"}
          </div>
        </div>
      </div>

      <div className="risk-advice">
        <div className="advice-header">
          <h3>Health Advice</h3>
          {model && model !== "fallback" && (
            <span className="advice-badge">AI Powered</span>
          )}
        </div>
        <div className="advice-content">
          {renderedAdvice}
        </div>
      </div>
    </div>
  );
}

export default memo(RiskResult);
