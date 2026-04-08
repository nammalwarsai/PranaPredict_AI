import { useMemo, useState } from "react";
import { calculateBMI, getBMICategory } from "../utils/bmiCalculator";
import "./HealthForm.css";

const TOTAL_STEPS = 5;

const CONDITION_FIELDS = [
  { key: "diabetes", label: "Diabetes" },
  { key: "hypertension", label: "Hypertension" },
  { key: "heartDisease", label: "Heart Disease" },
  { key: "kidneyDisease", label: "Kidney Disease" },
];

function toLabel(value) {
  return String(value).replace(/-/g, " ");
}

function HealthForm({ onSubmit, loading }) {
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    age: 30,
    weight: 70,
    height: 170,
    // Step 2: Vitals & Medical History
    systolic: 120,
    diastolic: 80,
    cholesterol: "normal",
    diabetes: false,
    hypertension: false,
    heartDisease: false,
    kidneyDisease: false,
    // Step 3: Lifestyle & Environment
    location: "urban",
    dietType: "vegetarian",
    waterIntake: 2,
    sleepDuration: 7,
    alcoholConsumption: "none",
    workType: "active",
    activityLevel: "moderate",
    smoking: false,
  });

  const bmiValue = useMemo(
    () => calculateBMI(Number(formData.weight), Number(formData.height)),
    [formData.weight, formData.height]
  );

  const bmiCategory = useMemo(
    () => (bmiValue ? getBMICategory(bmiValue) : null),
    [bmiValue]
  );

  const selectedConditions = useMemo(
    () => CONDITION_FIELDS.filter(({ key }) => formData[key]).map(({ label }) => label),
    [formData]
  );

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const nextValue =
      type === "checkbox" ? checked : type === "range" || type === "number" ? Number(value) : value;

    setFormData((prev) => ({
      ...prev,
      [name]: nextValue,
    }));
  };

  const setToggleValue = (name, value) => {
    const newData = { ...formData, [name]: value };
    setFormData(newData);
  };

  const handleNext = () => setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  const handleBack = () => setStep((s) => Math.max(1, s - 1));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step !== TOTAL_STEPS) {
      handleNext();
      return;
    }

    const payload = {
      age: Number.parseInt(formData.age, 10),
      bmi: bmiValue,
      bloodPressure: `${formData.systolic}/${formData.diastolic}`,
      cholesterol: formData.cholesterol,
      diabetes: formData.diabetes,
      hypertension: formData.hypertension,
      heartDisease: formData.heartDisease,
      kidneyDisease: formData.kidneyDisease,
      location: formData.location,
      dietType: formData.dietType,
      waterIntake: parseFloat(formData.waterIntake),
      sleepDuration: parseFloat(formData.sleepDuration),
      alcoholConsumption: formData.alcoholConsumption,
      workType: formData.workType,
      activityLevel: formData.activityLevel,
      smoking: formData.smoking,
    };

    onSubmit(payload);
  };

  return (
    <form className="health-form" onSubmit={handleSubmit}>
      <h2>Health Assessment</h2>

      <div className="health-form-progress">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className={`step-indicator ${step === s ? "active" : ""} ${step > s ? "completed" : ""}`}>
            {s}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="form-section">
          <h3>Step 1: Basic Information</h3>
          
          <div className="form-group range-slider-container">
            <div className="range-header">
              <label>Age</label>
              <span>{formData.age} years</span>
            </div>
            <input type="range" name="age" min="1" max="120" value={formData.age} onChange={handleChange} required />
          </div>

          <div className="form-group range-slider-container">
            <div className="range-header">
              <label>Weight (kg)</label>
              <span>{formData.weight} kg</span>
            </div>
            <input type="range" name="weight" min="10" max="250" step="0.5" value={formData.weight} onChange={handleChange} required />
          </div>

          <div className="form-group range-slider-container">
            <div className="range-header">
              <label>Height (cm)</label>
              <span>{formData.height} cm</span>
            </div>
            <input type="range" name="height" min="50" max="250" step="0.5" value={formData.height} onChange={handleChange} required />
          </div>

          {bmiValue && (
            <div className="bmi-display" role="status" aria-live="polite">
              BMI: <strong>{bmiValue}</strong> ({bmiCategory})
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="form-section">
          <h3>Step 2: Vitals & Medical History</h3>

          <div className="form-group range-slider-container">
            <div className="range-header">
              <label>Systolic Blood Pressure</label>
              <span>{formData.systolic} mmHg</span>
            </div>
            <input type="range" name="systolic" min="60" max="250" value={formData.systolic} onChange={handleChange} required />
          </div>

          <div className="form-group range-slider-container">
            <div className="range-header">
              <label>Diastolic Blood Pressure</label>
              <span>{formData.diastolic} mmHg</span>
            </div>
            <input type="range" name="diastolic" min="40" max="150" value={formData.diastolic} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Cholesterol Level</label>
            <select name="cholesterol" value={formData.cholesterol} onChange={handleChange}>
              <option value="normal">Normal</option>
              <option value="borderline">Borderline</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Medical history toggles */}
          {CONDITION_FIELDS.map(({ key, label }) => (
            <div className="form-group" key={key}>
              <label>{label}</label>
              <div className="toggle-group">
                <button
                  type="button"
                  className={`toggle-btn ${formData[key] ? "active" : ""}`}
                  onClick={() => setToggleValue(key, true)}
                  aria-pressed={formData[key] === true}
                >
                  Yes
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${!formData[key] ? "active" : ""}`}
                  onClick={() => setToggleValue(key, false)}
                  aria-pressed={formData[key] === false}
                >
                  No
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {step === 3 && (
        <div className="form-section">
          <h3>Step 3: Lifestyle & Environment</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Location</label>
              <select name="location" value={formData.location} onChange={handleChange}>
                <option value="urban">Urban</option>
                <option value="rural">Rural</option>
              </select>
            </div>
            <div className="form-group">
              <label>Work Type</label>
              <select name="workType" value={formData.workType} onChange={handleChange}>
                <option value="active">Active</option>
                <option value="sedentary">Sedentary</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Diet Type</label>
              <select name="dietType" value={formData.dietType} onChange={handleChange}>
                <option value="vegetarian">Vegetarian</option>
                <option value="non-veg">Non-veg</option>
                <option value="junk-heavy">Junk-heavy</option>
              </select>
            </div>
            <div className="form-group">
              <label>Activity Level</label>
              <select name="activityLevel" value={formData.activityLevel} onChange={handleChange}>
                <option value="high">High</option>
                <option value="moderate">Moderate</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div className="form-row">
             <div className="form-group">
              <label>Alcohol Consumption</label>
              <select name="alcoholConsumption" value={formData.alcoholConsumption} onChange={handleChange}>
                <option value="none">None</option>
                <option value="occasional">Occasional</option>
                <option value="frequent">Frequent</option>
              </select>
            </div>
            <div className="form-group form-group--checkbox">
              <div className="checkbox-group">
                <label>
                  <input type="checkbox" name="smoking" checked={formData.smoking} onChange={handleChange} />
                  Smoker
                </label>
              </div>
            </div>
          </div>

          <div className="form-group range-slider-container">
            <div className="range-header">
              <label>Water Intake</label>
              <span>{formData.waterIntake} Liters/day</span>
            </div>
            <input type="range" name="waterIntake" min="0" max="8" step="0.5" value={formData.waterIntake} onChange={handleChange} required />
          </div>

          <div className="form-group range-slider-container">
            <div className="range-header">
              <label>Sleep Duration</label>
              <span>{formData.sleepDuration} Hours</span>
            </div>
            <input type="range" name="sleepDuration" min="0" max="16" step="0.5" value={formData.sleepDuration} onChange={handleChange} required />
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="form-section verification-section">
          <h3>Step 4: Verify Your Details</h3>
          <p className="form-helper-text">
            Please review the data you've entered before generating your comprehensive report.
          </p>

          <div className="verification-grid">
            <div className="verification-card">
              <h4 className="verification-card-title">Basic Info</h4>
              <p className="verification-row"><strong>Age:</strong> {formData.age} years</p>
              <p className="verification-row"><strong>Weight:</strong> {formData.weight} kg</p>
              <p className="verification-row"><strong>Height:</strong> {formData.height} cm</p>
              {bmiValue && <p className="verification-row"><strong>BMI:</strong> {bmiValue} ({bmiCategory})</p>}
            </div>

            <div className="verification-card">
              <h4 className="verification-card-title">Vitals & Medical History</h4>
              <p className="verification-row"><strong>Blood Pressure:</strong> {formData.systolic}/{formData.diastolic} mmHg</p>
              <p className="verification-row"><strong>Cholesterol:</strong> <span className="text-capitalize">{formData.cholesterol}</span></p>
              <p className="verification-row">
                <strong>Pre-existing Conditions:</strong>{" "}
                {selectedConditions.join(", ") || "None"}
              </p>
            </div>

            <div className="verification-card">
              <h4 className="verification-card-title">Lifestyle & Environment</h4>
              <p className="verification-row"><strong>Location:</strong> <span className="text-capitalize">{toLabel(formData.location)}</span></p>
              <p className="verification-row"><strong>Work Type:</strong> <span className="text-capitalize">{formData.workType}</span></p>
              <p className="verification-row"><strong>Diet Type:</strong> <span className="text-capitalize">{toLabel(formData.dietType)}</span></p>
              <p className="verification-row"><strong>Activity Level:</strong> <span className="text-capitalize">{formData.activityLevel}</span></p>
              <p className="verification-row"><strong>Alcohol:</strong> <span className="text-capitalize">{formData.alcoholConsumption}</span></p>
              <p className="verification-row"><strong>Smoker:</strong> {formData.smoking ? "Yes" : "No"}</p>
              <p className="verification-row"><strong>Water Intake:</strong> {formData.waterIntake} Liters/day</p>
              <p className="verification-row"><strong>Sleep Duration:</strong> {formData.sleepDuration} Hours/day</p>
            </div>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="form-section">
          <h3>Step 5: Ready for Analysis</h3>
          <p className="form-helper-text">
            All your details have been collected and verified. 
            Click the button below to generate your comprehensive PranaPredict AI health report.
          </p>
          <div className="analysis-ready-card">
            <span className="analysis-ready-icon">🩺</span>
            <h4>Generate Your Health Forecast</h4>
            <p className="analysis-ready-text">
              Our AI engine will analyze your inputs against modern medical parameters and Ayurvedic principles to build an exhaustive report.
            </p>
          </div>
        </div>
      )}

      <div className="form-actions">
        {step > 1 && (
          <button type="button" className="btn-secondary" onClick={handleBack} disabled={loading}>
            Back
          </button>
        )}

        {step < TOTAL_STEPS ? (
          <button type="button" className="submit-btn" onClick={handleNext} disabled={loading}>
            Next Step
          </button>
        ) : (
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Analyzing..." : "Predict Health Risk"}
          </button>
        )}
      </div>
    </form>
  );
}

export default HealthForm;
