import { useState } from "react";
import HealthForm from "../components/HealthForm";
import RiskResult from "../components/RiskResult";
import { submitPrediction } from "../api/api";

function Dashboard() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (healthData) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await submitPrediction(healthData);
      setResult(response.data.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to get prediction. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <span className="dashboard-header-icon">🩺</span>
        <h1>Health Risk Predictor</h1>
        <p>Enter your health data below to get an AI-powered risk assessment</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className={`dashboard-content${result ? " dashboard-content--has-result" : ""}`}>
        <HealthForm onSubmit={handleSubmit} loading={loading} />
        <RiskResult result={result} />
      </div>
    </div>
  );
}

export default Dashboard;
