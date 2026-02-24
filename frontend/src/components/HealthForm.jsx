import { useState } from "react";
import { calculateBMI, getBMICategory } from "../utils/bmiCalculator";

function HealthForm({ onSubmit, loading }) {
  const [formData, setFormData] = useState({
    age: "",
    weight: "",
    height: "",
    systolic: "",
    diastolic: "",
    cholesterol: "normal",
    smoking: false,
    activityLevel: "moderate",
  });

  const [bmiInfo, setBmiInfo] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newData = {
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    };
    setFormData(newData);

    // Auto-calculate BMI
    if (name === "weight" || name === "height") {
      const bmi = calculateBMI(
        parseFloat(name === "weight" ? value : newData.weight),
        parseFloat(name === "height" ? value : newData.height)
      );
      if (bmi) {
        setBmiInfo({ value: bmi, category: getBMICategory(bmi) });
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const bmi = calculateBMI(parseFloat(formData.weight), parseFloat(formData.height));
    const payload = {
      age: parseInt(formData.age),
      bmi: bmi,
      bloodPressure: `${formData.systolic}/${formData.diastolic}`,
      cholesterol: formData.cholesterol,
      smoking: formData.smoking,
      activityLevel: formData.activityLevel,
    };
    onSubmit(payload);
  };

  return (
    <form className="health-form" onSubmit={handleSubmit}>
      <h2>Health Assessment</h2>

      <div className="form-group">
        <label htmlFor="age">Age</label>
        <input
          type="number"
          id="age"
          name="age"
          value={formData.age}
          onChange={handleChange}
          placeholder="Enter your age"
          min="1"
          max="120"
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="weight">Weight (kg)</label>
          <input
            type="number"
            id="weight"
            name="weight"
            value={formData.weight}
            onChange={handleChange}
            placeholder="e.g. 70"
            min="1"
            step="0.1"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="height">Height (cm)</label>
          <input
            type="number"
            id="height"
            name="height"
            value={formData.height}
            onChange={handleChange}
            placeholder="e.g. 170"
            min="1"
            step="0.1"
            required
          />
        </div>
      </div>

      {bmiInfo && (
        <div className="bmi-display">
          BMI: <strong>{bmiInfo.value}</strong> ({bmiInfo.category})
        </div>
      )}

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="systolic">Systolic BP</label>
          <input
            type="number"
            id="systolic"
            name="systolic"
            value={formData.systolic}
            onChange={handleChange}
            placeholder="e.g. 120"
            min="60"
            max="250"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="diastolic">Diastolic BP</label>
          <input
            type="number"
            id="diastolic"
            name="diastolic"
            value={formData.diastolic}
            onChange={handleChange}
            placeholder="e.g. 80"
            min="40"
            max="150"
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="cholesterol">Cholesterol Level</label>
        <select
          id="cholesterol"
          name="cholesterol"
          value={formData.cholesterol}
          onChange={handleChange}
        >
          <option value="normal">Normal</option>
          <option value="borderline">Borderline</option>
          <option value="high">High</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="activityLevel">Activity Level</label>
        <select
          id="activityLevel"
          name="activityLevel"
          value={formData.activityLevel}
          onChange={handleChange}
        >
          <option value="high">High</option>
          <option value="moderate">Moderate</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div className="form-group checkbox-group">
        <label>
          <input
            type="checkbox"
            name="smoking"
            checked={formData.smoking}
            onChange={handleChange}
          />
          Smoker
        </label>
      </div>

      <button type="submit" className="submit-btn" disabled={loading}>
        {loading ? "Analyzing..." : "Predict Health Risk"}
      </button>
    </form>
  );
}

export default HealthForm;
