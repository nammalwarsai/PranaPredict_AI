function RiskResult({ result }) {
  if (!result) return null;

  const { riskScore, riskLevel, advice, healthData, model } = result;

  const getRiskColor = (level) => {
    switch (level) {
      case "Low": return "#22c55e";
      case "Moderate": return "#f59e0b";
      case "High": return "#ef4444";
      default: return "#6b7280";
    }
  };

  // Convert basic markdown to HTML for LLM output
  function renderAdvice(text) {
    if (!text) return null;
    const lines = text.split("\n").filter((l) => l.trim() !== "");
    return lines.map((line, i) => {
      // Bold: **text**
      const formatted = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      // Numbered list items
      if (/^\d+\.\s/.test(line)) {
        return <p key={i} className="advice-line advice-numbered" dangerouslySetInnerHTML={{ __html: formatted }} />;
      }
      // Bullet list items
      if (/^[-*]\s/.test(line)) {
        return <p key={i} className="advice-line advice-bullet" dangerouslySetInnerHTML={{ __html: formatted.replace(/^[-*]\s/, "") }} />;
      }
      return <p key={i} className="advice-line" dangerouslySetInnerHTML={{ __html: formatted }} />;
    });
  }

  return (
    <div className="risk-result">
      <h2>Your Health Risk Assessment</h2>

      <div className="risk-score-card" style={{ borderColor: getRiskColor(riskLevel) }}>
        <div className="risk-score-circle" style={{ backgroundColor: getRiskColor(riskLevel) }}>
          <span className="score-number">{riskScore}</span>
          <span className="score-label">/ 100</span>
        </div>
        <div className="risk-level" style={{ color: getRiskColor(riskLevel) }}>
          {riskLevel} Risk
        </div>
      </div>

      <div className="risk-details">
        <h3>Input Summary</h3>
        <div className="details-grid">
          <div><strong>Age:</strong> {healthData.age}</div>
          <div><strong>BMI:</strong> {healthData.bmi}</div>
          <div><strong>Blood Pressure:</strong> {healthData.bloodPressure}</div>
          <div><strong>Cholesterol:</strong> {healthData.cholesterol}</div>
          <div><strong>Smoking:</strong> {healthData.smoking ? "Yes" : "No"}</div>
          <div><strong>Activity:</strong> {healthData.activityLevel}</div>
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
          {renderAdvice(advice)}
        </div>
      </div>
    </div>
  );
}

export default RiskResult;
