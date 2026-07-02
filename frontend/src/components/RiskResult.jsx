import { useMemo, memo, useCallback, useState, useEffect } from "react";
import DOMPurify from "dompurify";
import { getAriaAttributes } from "../utils/accessibility";

const SANITIZE_OPTIONS = { ALLOWED_TAGS: ["strong", "em", "b", "i", "p", "br"], ALLOWED_ATTR: [] };

// Risk level configuration
const RISK_CONFIG = {
  Low: {
    color: "#22c55e",
    bgColor: "#dcfce7",
    borderColor: "#86efac",
    description: "Your health risk is low. Keep up the good habits!"
  },
  Moderate: {
    color: "#f59e0b",
    bgColor: "#fef3c7",
    borderColor: "#fde68a",
    description: "Your health risk is moderate. Consider making some lifestyle improvements."
  },
  High: {
    color: "#ef4444",
    bgColor: "#fee2e2",
    borderColor: "#fecaca",
    description: "Your health risk is high. Please consult with a healthcare professional."
  }
};

// Memoized risk color getter
const getRiskConfig = (level) => RISK_CONFIG[level] || RISK_CONFIG.Low;

// Memoized advice parser
const parseAdvice = (advice) => {
  if (!advice) return [];
  
  return advice.split("\n").filter((l) => l.trim() !== "");
};

// Memoized advice line renderer
const renderAdviceLine = (line, index) => {
  const formatted = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  const clean = DOMPurify.sanitize(formatted, SANITIZE_OPTIONS);
  
  if (/^\d+\.\s/.test(line)) {
    return <p key={index} className="advice-line advice-numbered" dangerouslySetInnerHTML={{ __html: clean }} />;
  }
  
  if (/^[-*]\s/.test(line)) {
    const bulletClean = DOMPurify.sanitize(
      formatted.replace(/^[-*]\s/, ""),
      SANITIZE_OPTIONS
    );
    return <p key={index} className="advice-line advice-bullet" dangerouslySetInnerHTML={{ __html: bulletClean }} />;
  }
  
  return <p key={index} className="advice-line" dangerouslySetInnerHTML={{ __html: clean }} />;
};

// Memoized condition formatter
const formatConditions = (healthData) => {
  if (!healthData) return "None";
  
  const conditions = [
    healthData.diabetes && "Diabetes",
    healthData.hypertension && "Hypertension",
    healthData.heartDisease && "Heart Disease",
    healthData.kidneyDisease && "Kidney Disease"
  ].filter(Boolean);
  
  return conditions.length > 0 ? conditions.join(", ") : "None";
};

// Score circle component
const ScoreCircle = memo(({ riskScore, riskColor, riskLevel }) => (
  <div 
    className="risk-score-circle" 
    style={{ backgroundColor: riskColor }}
    role="img"
    aria-label={`Risk score: ${riskScore} out of 100, ${riskLevel} risk`}
  >
    <span className="score-number" aria-hidden="true">{riskScore}</span>
    <span className="score-label" aria-hidden="true">/ 100</span>
  </div>
));

ScoreCircle.displayName = 'ScoreCircle';

// Risk level display
const RiskLevelDisplay = memo(({ riskLevel, riskColor }) => (
  <div 
    className="risk-level" 
    style={{ color: riskColor }}
    aria-live="polite"
  >
    {riskLevel} Risk
  </div>
));

RiskLevelDisplay.displayName = 'RiskLevelDisplay';

// Score card component
const ScoreCard = memo(({ riskScore, riskLevel, riskColor, riskConfig }) => (
  <div 
    className="risk-score-card" 
    style={{ 
      borderColor: riskColor, 
      background: riskConfig.bgColor 
    }}
    role="region"
    aria-label={`Risk score card showing ${riskScore} out of 100`}
  >
    <ScoreCircle riskScore={riskScore} riskColor={riskColor} riskLevel={riskLevel} />
    <RiskLevelDisplay riskLevel={riskLevel} riskColor={riskColor} />
  </div>
));

ScoreCard.displayName = 'ScoreCard';

// Details grid component
const DetailsGrid = memo(({ healthData }) => {
  if (!healthData) return null;
  
  const details = [
    { label: "Age", value: healthData.age },
    { label: "BMI", value: healthData.bmi },
    { label: "Blood Pressure", value: healthData.bloodPressure },
    { label: "Cholesterol", value: healthData.cholesterol },
    { label: "Smoking", value: healthData.smoking ? "Yes" : "No" },
    { label: "Activity", value: healthData.activityLevel },
    { label: "Location", value: healthData.location },
    { label: "Work Type", value: healthData.workType },
    { label: "Diet Type", value: healthData.dietType },
    { label: "Alcohol", value: healthData.alcoholConsumption },
    { label: "Water", value: `${healthData.waterIntake} L` },
    { label: "Sleep", value: `${healthData.sleepDuration} hrs` }
  ];

  return (
    <div className="details-grid" role="list" aria-label="Health data summary">
      {details.map((detail, index) => (
        <div 
          key={index} 
          className="detail-item" 
          role="listitem"
        >
          <strong>{detail.label}:</strong> <span className="text-capitalize">{detail.value}</span>
        </div>
      ))}
      <div className="details-full-row" role="listitem">
        <strong>Pre-existing Conditions:</strong> {formatConditions(healthData)}
      </div>
    </div>
  );
});

DetailsGrid.displayName = 'DetailsGrid';

// Advice header component
const AdviceHeader = memo(({ model }) => (
  <div className="advice-header">
    <h3>Health Advice</h3>
    {model && model !== "fallback" && (
      <span className="advice-badge" role="status" aria-label="AI Powered advice">
        AI Powered
      </span>
    )}
  </div>
));

AdviceHeader.displayName = 'AdviceHeader';

// Advice content component
const AdviceContent = memo(({ advice }) => {
  const lines = useMemo(() => parseAdvice(advice), [advice]);
  
  if (!lines || lines.length === 0) {
    return <p className="advice-line">No specific advice available.</p>;
  }
  
  return (
    <div 
      className="advice-content" 
      role="region" 
      aria-label="Health advice"
    >
      {lines.map((line, index) => renderAdviceLine(line, index))}
    </div>
  );
});

AdviceContent.displayName = 'AdviceContent';

// Risk details component
const RiskDetails = memo(({ healthData, riskLevel, riskConfig }) => (
  <div 
    className="risk-details" 
    role="region" 
    aria-label="Input summary and risk details"
  >
    <h3>Input Summary</h3>
    <p className="risk-description" aria-live="polite">
      {riskConfig.description}
    </p>
    <DetailsGrid healthData={healthData} />
  </div>
));

RiskDetails.displayName = 'RiskDetails';

// Main RiskResult component
function RiskResult({ result }) {
  const { riskScore, riskLevel, advice, healthData, model } = result || {};

  // Get risk configuration
  const riskConfig = useMemo(() => getRiskConfig(riskLevel), [riskLevel]);
  const riskColor = riskConfig.color;

  // Memoize rendered advice
  const renderedAdvice = useMemo(() => {
    if (!advice) return null;
    const lines = parseAdvice(advice);
    return lines.map((line, index) => renderAdviceLine(line, index));
  }, [advice]);

  // Animation state
  const [animate, setAnimate] = useState(false);

  // Trigger animation on mount
  useEffect(() => {
    if (result) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => setAnimate(true), 50);
      return () => clearTimeout(timer);
    }
  }, [result]);

  if (!result) return null;

  return (
    <div 
      className={`risk-result${animate ? ' risk-result--animate' : ''}`}
      role="region"
      aria-label="Your Health Risk Assessment"
      aria-describedby="risk-assessment-description"
    >
      <h2 id="risk-assessment-heading">Your Health Risk Assessment</h2>
      <span id="risk-assessment-description" className="sr-only">
        This section displays your health risk score, level, and personalized advice based on your input.
      </span>

      <ScoreCard 
        riskScore={riskScore} 
        riskLevel={riskLevel} 
        riskColor={riskColor} 
        riskConfig={riskConfig}
      />

      <RiskDetails 
        healthData={healthData} 
        riskLevel={riskLevel} 
        riskConfig={riskConfig}
      />

      <div 
        className="risk-advice" 
        role="region" 
        aria-label="Health advice section"
      >
        <AdviceHeader model={model} />
        <AdviceContent advice={advice} />
      </div>
    </div>
  );
}

export default memo(RiskResult);
