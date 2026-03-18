import { useState } from "react";
import { calculateBMI, getBMICategory } from "../utils/bmiCalculator";
import "./HealthForm.css";

function HealthForm({ onSubmit, loading }) {
  const [step, setStep] = useState(1);
  const totalSteps = 5;

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

  const [bmiInfo, setBmiInfo] = useState({ value: calculateBMI(70, 170), category: getBMICategory(calculateBMI(70, 170)) });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newVal = value;
    if (type === "checkbox") {
      newVal = checked;
    } else if (type === "range" || type === "number") {
      newVal = parseFloat(value);
    }
    
    const newData = {
      ...formData,
      [name]: newVal,
    };
    setFormData(newData);
    updateBmiIfNecessary(name, newVal, newData);
  };

  const setToggleValue = (name, value) => {
    const newData = { ...formData, [name]: value };
    setFormData(newData);
  };

  const updateBmiIfNecessary = (name, newVal, newData) => {
    if (name === "weight" || name === "height") {
      const bmi = calculateBMI(
        parseFloat(name === "weight" ? newVal : newData.weight),
        parseFloat(name === "height" ? newVal : newData.height)
      );
      if (bmi) {
        setBmiInfo({ value: bmi, category: getBMICategory(bmi) });
      }
    }
  };

  const handleNext = () => setStep((s) => Math.min(totalSteps, s + 1));
  const handleBack = () => setStep((s) => Math.max(1, s - 1));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step !== totalSteps) {
      handleNext();
      return;
    }
    const bmi = calculateBMI(parseFloat(formData.weight), parseFloat(formData.height));
    const payload = {
      age: parseInt(formData.age),
      bmi: bmi,
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

          {bmiInfo && (
            <div className="bmi-display" style={{ marginTop: '1.5rem' }}>
              BMI: <strong>{bmiInfo.value}</strong> ({bmiInfo.category})
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
          {['diabetes', 'hypertension', 'heartDisease', 'kidneyDisease'].map((disease) => (
            <div className="form-group" key={disease}>
              <label>{disease.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</label>
              <div className="toggle-group">
                <button type="button" className={`toggle-btn ${formData[disease] === true ? 'active' : ''}`} onClick={() => setToggleValue(disease, true)}>Yes</button>
                <button type="button" className={`toggle-btn ${formData[disease] === false ? 'active' : ''}`} onClick={() => setToggleValue(disease, false)}>No</button>
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
            <div className="form-group" style={{display: 'flex', alignItems: 'flex-end', paddingBottom: '0.2rem'}}>
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
          <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
            Please review the data you've entered before generating your comprehensive report.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ background: "var(--bg-subtle)", padding: "1rem", borderRadius: "var(--radius)" }}>
              <h4 style={{ marginBottom: "0.5rem", color: "var(--primary)" }}>Basic Info</h4>
              <p><strong>Age:</strong> {formData.age} years</p>
              <p><strong>Weight:</strong> {formData.weight} kg</p>
              <p><strong>Height:</strong> {formData.height} cm</p>
              {bmiInfo && <p><strong>BMI:</strong> {bmiInfo.value} ({bmiInfo.category})</p>}
            </div>

            <div style={{ background: "var(--bg-subtle)", padding: "1rem", borderRadius: "var(--radius)" }}>
              <h4 style={{ marginBottom: "0.5rem", color: "var(--primary)" }}>Vitals & Medical History</h4>
              <p><strong>Blood Pressure:</strong> {formData.systolic}/{formData.diastolic} mmHg</p>
              <p><strong>Cholesterol:</strong> <span style={{ textTransform: "capitalize" }}>{formData.cholesterol}</span></p>
              <p>
                <strong>Pre-existing Conditions:</strong>{" "}
                {[
                  formData.diabetes && "Diabetes",
                  formData.hypertension && "Hypertension",
                  formData.heartDisease && "Heart Disease",
                  formData.kidneyDisease && "Kidney Disease"
                ].filter(Boolean).join(", ") || "None"}
              </p>
            </div>

            <div style={{ background: "var(--bg-subtle)", padding: "1rem", borderRadius: "var(--radius)" }}>
              <h4 style={{ marginBottom: "0.5rem", color: "var(--primary)" }}>Lifestyle & Environment</h4>
              <p><strong>Location:</strong> <span style={{ textTransform: "capitalize" }}>{formData.location}</span></p>
              <p><strong>Work Type:</strong> <span style={{ textTransform: "capitalize" }}>{formData.workType}</span></p>
              <p><strong>Diet Type:</strong> <span style={{ textTransform: "capitalize" }}>{formData.dietType}</span></p>
              <p><strong>Activity Level:</strong> <span style={{ textTransform: "capitalize" }}>{formData.activityLevel}</span></p>
              <p><strong>Alcohol:</strong> <span style={{ textTransform: "capitalize" }}>{formData.alcoholConsumption}</span></p>
              <p><strong>Smoker:</strong> {formData.smoking ? "Yes" : "No"}</p>
              <p><strong>Water Intake:</strong> {formData.waterIntake} Liters/day</p>
              <p><strong>Sleep Duration:</strong> {formData.sleepDuration} Hours/day</p>
            </div>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="form-section">
          <h3>Step 5: Ready for Analysis</h3>
          <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
            All your details have been collected and verified. 
            Click the button below to generate your comprehensive PranaPredict AI health report.
          </p>
          <div style={{ padding: "2rem", textAlign: "center", background: "var(--bg-subtle)", borderRadius: "var(--radius)" }}>
            <span style={{ fontSize: "3rem", display: "block", marginBottom: "1rem" }}>🩺</span>
            <h4>Generate Your Health Forecast</h4>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.5rem" }}>
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
        
        {step < totalSteps ? (
          <button type="button" className="submit-btn" onClick={handleNext} disabled={loading} style={{marginTop: 0}}>
            Next Step
          </button>
        ) : (
          <button type="submit" className="submit-btn" disabled={loading} style={{marginTop: 0}}>
            {loading ? "Analyzing..." : "Predict Health Risk"}
          </button>
        )}
      </div>
    </form>
  );
}

export default HealthForm;
