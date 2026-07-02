import { useMemo, useState, useCallback, memo, useEffect } from "react";
import { calculateBMI, getBMICategory } from "../utils/bmiCalculator";
import { useDebounce } from "../hooks/usePerformance";
import { getAriaAttributes, getErrorMessage } from "../utils/accessibility";
import "./HealthForm.css";

const TOTAL_STEPS = 6;

const CONDITION_FIELDS = [
  { key: "diabetes", label: "Diabetes" },
  { key: "hypertension", label: "Hypertension" },
  { key: "heartDisease", label: "Heart Disease" },
  { key: "kidneyDisease", label: "Kidney Disease" },
];

const INITIAL_FORM_DATA = {
  age: 30,
  weight: 70,
  height: 170,
  systolic: 120,
  diastolic: 80,
  cholesterol: "normal",
  diabetes: false,
  hypertension: false,
  heartDisease: false,
  kidneyDisease: false,
  location: "urban",
  dietType: "vegetarian",
  waterIntake: 2,
  sleepDuration: 7,
  alcoholConsumption: "none",
  workType: "active",
  activityLevel: "moderate",
  smoking: false,
};

function toLabel(value) {
  return String(value).replace(/-/g, " ");
}

// Memoized step components to prevent unnecessary re-renders
const Step1 = memo(({ formData, handleChange, bmiValue, bmiCategory }) => (
  <div className="form-section" role="region" aria-label="Step 1: Basic Information">
    <h3 id="step-1-heading">Step 1: Basic Information</h3>
    
    <div className="form-group range-slider-container">
      <div className="range-header">
        <label htmlFor="age">Age</label>
        <span aria-live="polite">{formData.age} years</span>
      </div>
      <input 
        type="range" 
        id="age" 
        name="age" 
        min="1" 
        max="120" 
        value={formData.age} 
        onChange={handleChange} 
        required
        aria-required="true"
        aria-describedby="age-desc"
      />
      <span id="age-desc" className="sr-only">Use slider to select your age</span>
    </div>

    <div className="form-group range-slider-container">
      <div className="range-header">
        <label htmlFor="weight">Weight (kg)</label>
        <span aria-live="polite">{formData.weight} kg</span>
      </div>
      <input 
        type="range" 
        id="weight" 
        name="weight" 
        min="10" 
        max="250" 
        step="0.5" 
        value={formData.weight} 
        onChange={handleChange} 
        required
        aria-required="true"
        aria-describedby="weight-desc"
      />
      <span id="weight-desc" className="sr-only">Use slider to select your weight in kilograms</span>
    </div>

    <div className="form-group range-slider-container">
      <div className="range-header">
        <label htmlFor="height">Height (cm)</label>
        <span aria-live="polite">{formData.height} cm</span>
      </div>
      <input 
        type="range" 
        id="height" 
        name="height" 
        min="50" 
        max="250" 
        step="0.5" 
        value={formData.height} 
        onChange={handleChange} 
        required
        aria-required="true"
        aria-describedby="height-desc"
      />
      <span id="height-desc" className="sr-only">Use slider to select your height in centimeters</span>
    </div>

    {bmiValue && (
      <div 
        className="bmi-display" 
        role="status" 
        aria-live="polite"
        aria-atomic="true"
      >
        BMI: <strong>{bmiValue.toFixed(1)}</strong> ({bmiCategory})
      </div>
    )}
  </div>
));

Step1.displayName = 'Step1';

const Step2 = memo(({ formData, handleChange, selectedConditions }) => (
  <div className="form-section" role="region" aria-label="Step 2: Vitals and Medical History">
    <h3 id="step-2-heading">Step 2: Vitals & Medical History</h3>

    <div className="form-group range-slider-container">
      <div className="range-header">
        <label htmlFor="systolic">Systolic Blood Pressure</label>
        <span aria-live="polite">{formData.systolic} mmHg</span>
      </div>
      <input 
        type="range" 
        id="systolic" 
        name="systolic" 
        min="60" 
        max="250" 
        value={formData.systolic} 
        onChange={handleChange} 
        required
        aria-required="true"
      />
    </div>

    <div className="form-group range-slider-container">
      <div className="range-header">
        <label htmlFor="diastolic">Diastolic Blood Pressure</label>
        <span aria-live="polite">{formData.diastolic} mmHg</span>
      </div>
      <input 
        type="range" 
        id="diastolic" 
        name="diastolic" 
        min="40" 
        max="150" 
        value={formData.diastolic} 
        onChange={handleChange} 
        required
        aria-required="true"
      />
    </div>

    <div className="form-group">
      <label htmlFor="cholesterol">Cholesterol Level</label>
      <select 
        id="cholesterol" 
        name="cholesterol" 
        value={formData.cholesterol} 
        onChange={handleChange}
        aria-required="true"
      >
        <option value="normal">Normal</option>
        <option value="borderline">Borderline</option>
        <option value="high">High</option>
      </select>
    </div>

    <fieldset className="medical-history-fieldset">
      <legend>Medical History</legend>
      {CONDITION_FIELDS.map(({ key, label }) => (
        <div className="form-group" key={key}>
          <label htmlFor={key}>{label}</label>
          <div className="toggle-group" role="group" aria-label={`Select if you have ${label}`}>
            <button
              type="button"
              id={`${key}-yes`}
              className={`toggle-btn ${formData[key] ? "active" : ""}`}
              onClick={() => handleChange({ target: { name: key, value: true, type: 'checkbox' } })}
              aria-pressed={formData[key] === true}
              aria-label={`Yes, I have ${label}`}
            >
              Yes
            </button>
            <button
              type="button"
              id={`${key}-no`}
              className={`toggle-btn ${!formData[key] ? "active" : ""}`}
              onClick={() => handleChange({ target: { name: key, value: false, type: 'checkbox' } })}
              aria-pressed={formData[key] === false}
              aria-label={`No, I don't have ${label}`}
            >
              No
            </button>
          </div>
        </div>
      ))}
    </fieldset>
  </div>
));

Step2.displayName = 'Step2';

const Step3 = memo(({ formData, handleChange }) => (
  <div className="form-section" role="region" aria-label="Step 3: Lifestyle and Environment">
    <h3 id="step-3-heading">Step 3: Lifestyle & Environment</h3>

    <div className="form-row">
      <div className="form-group">
        <label htmlFor="location">Location</label>
        <select 
          id="location" 
          name="location" 
          value={formData.location} 
          onChange={handleChange}
          aria-required="true"
        >
          <option value="urban">Urban</option>
          <option value="rural">Rural</option>
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="workType">Work Type</label>
        <select 
          id="workType" 
          name="workType" 
          value={formData.workType} 
          onChange={handleChange}
          aria-required="true"
        >
          <option value="active">Active</option>
          <option value="sedentary">Sedentary</option>
        </select>
      </div>
    </div>

    <div className="form-row">
      <div className="form-group">
        <label htmlFor="dietType">Diet Type</label>
        <select 
          id="dietType" 
          name="dietType" 
          value={formData.dietType} 
          onChange={handleChange}
          aria-required="true"
        >
          <option value="vegetarian">Vegetarian</option>
          <option value="non-veg">Non-veg</option>
          <option value="junk-heavy">Junk-heavy</option>
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="activityLevel">Activity Level</label>
        <select 
          id="activityLevel" 
          name="activityLevel" 
          value={formData.activityLevel} 
          onChange={handleChange}
          aria-required="true"
        >
          <option value="high">High</option>
          <option value="moderate">Moderate</option>
          <option value="low">Low</option>
        </select>
      </div>
    </div>

    <div className="form-row">
      <div className="form-group">
        <label htmlFor="alcoholConsumption">Alcohol Consumption</label>
        <select 
          id="alcoholConsumption" 
          name="alcoholConsumption" 
          value={formData.alcoholConsumption} 
          onChange={handleChange}
          aria-required="true"
        >
          <option value="none">None</option>
          <option value="occasional">Occasional</option>
          <option value="frequent">Frequent</option>
        </select>
      </div>
      <div className="form-group form-group--checkbox">
        <div className="checkbox-group">
          <label htmlFor="smoking">
            <input 
              type="checkbox" 
              id="smoking" 
              name="smoking" 
              checked={formData.smoking} 
              onChange={handleChange}
              aria-describedby="smoking-desc"
            />
            Smoker
          </label>
          <span id="smoking-desc" className="sr-only">Check if you are a smoker</span>
        </div>
      </div>
    </div>

    <div className="form-group range-slider-container">
      <div className="range-header">
        <label htmlFor="waterIntake">Water Intake</label>
        <span aria-live="polite">{formData.waterIntake} Liters/day</span>
      </div>
      <input 
        type="range" 
        id="waterIntake" 
        name="waterIntake" 
        min="0" 
        max="8" 
        step="0.5" 
        value={formData.waterIntake} 
        onChange={handleChange} 
        required
        aria-required="true"
      />
    </div>

    <div className="form-group range-slider-container">
      <div className="range-header">
        <label htmlFor="sleepDuration">Sleep Duration</label>
        <span aria-live="polite">{formData.sleepDuration} Hours</span>
      </div>
      <input 
        type="range" 
        id="sleepDuration" 
        name="sleepDuration" 
        min="0" 
        max="16" 
        step="0.5" 
        value={formData.sleepDuration} 
        onChange={handleChange} 
        required
        aria-required="true"
      />
    </div>
  </div>
));

Step3.displayName = 'Step3';

const Step4 = memo(({ formData, bmiValue, bmiCategory, selectedConditions }) => (
  <div className="form-section verification-section" role="region" aria-label="Step 4: Verify Your Details">
    <h3 id="step-4-heading">Step 4: Verify Your Details</h3>
    <p className="form-helper-text">
      Please review the data you've entered before generating your comprehensive report.
    </p>

    <div className="verification-grid">
      <div className="verification-card" role="region" aria-label="Basic Information">
        <h4 className="verification-card-title" id="basic-info-title">Basic Info</h4>
        <p className="verification-row"><strong>Age:</strong> {formData.age} years</p>
        <p className="verification-row"><strong>Weight:</strong> {formData.weight} kg</p>
        <p className="verification-row"><strong>Height:</strong> {formData.height} cm</p>
        {bmiValue && <p className="verification-row"><strong>BMI:</strong> {bmiValue.toFixed(1)} ({bmiCategory})</p>}
      </div>

      <div className="verification-card" role="region" aria-label="Vitals and Medical History">
        <h4 className="verification-card-title" id="vitals-title">Vitals & Medical History</h4>
        <p className="verification-row"><strong>Blood Pressure:</strong> {formData.systolic}/{formData.diastolic} mmHg</p>
        <p className="verification-row"><strong>Cholesterol:</strong> <span className="text-capitalize">{formData.cholesterol}</span></p>
        <p className="verification-row">
          <strong>Pre-existing Conditions:</strong>{" "}
          {selectedConditions.join(", ") || "None"}
        </p>
      </div>

      <div className="verification-card" role="region" aria-label="Lifestyle and Environment">
        <h4 className="verification-card-title" id="lifestyle-title">Lifestyle & Environment</h4>
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
));

Step4.displayName = 'Step4';

const Step5 = memo(({ finalConfirmed, setFinalConfirmed }) => (
  <div className="form-section" role="region" aria-label="Step 5: Final Confirmation">
    <h3 id="step-5-heading">Step 5: Final Confirmation</h3>
    <p className="form-helper-text">
      Please confirm your details once more before moving to the final submission step.
    </p>
    <div className="analysis-ready-card">
      <span className="analysis-ready-icon" aria-hidden="true">🩺</span>
      <h4>Confirmation Required</h4>
      <p className="analysis-ready-text">
        The system will only allow submission after you confirm below and proceed to Step 6.
      </p>
    </div>
    <div className="form-group form-group--checkbox">
      <div className="checkbox-group">
        <label htmlFor="finalConfirmation">
          <input
            type="checkbox"
            id="finalConfirmation"
            name="finalConfirmation"
            checked={finalConfirmed}
            onChange={(e) => setFinalConfirmed(e.target.checked)}
            required
            aria-required="true"
            aria-describedby="confirmation-desc"
          />
          I confirm that all details are correct and I want to generate my final report.
        </label>
        <span id="confirmation-desc" className="sr-only">You must check this box to proceed</span>
      </div>
    </div>
  </div>
));

Step5.displayName = 'Step5';

const Step6 = memo(({ loading }) => (
  <div className="form-section" role="region" aria-label="Step 6: Generating Report">
    <h3 id="step-6-heading">Step 6: Generating your report...</h3>
    <p className="form-helper-text">
      Please wait while we generate your report...
    </p>
    {loading && (
      <div className="loading-indicator" role="status" aria-live="polite">
        <div className="spinner" aria-hidden="true" />
        <span className="sr-only">Generating your health risk report...</span>
      </div>
    )}
  </div>
));

Step6.displayName = 'Step6';

// Progress indicator component
const ProgressIndicator = memo(({ step, totalSteps }) => (
  <div 
    className="health-form-progress" 
    role="progressbar" 
    aria-valuenow={step} 
    aria-valuemin={1} 
    aria-valuemax={totalSteps}
    aria-label={`Step ${step} of ${totalSteps}`}
  >
    {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
      <div 
        key={s} 
        className={`step-indicator ${step === s ? "active" : ""} ${step > s ? "completed" : ""}`}
        aria-label={`Step ${s}${step === s ? ' (current)' : step > s ? ' (completed)' : ''}`}
      >
        {s}
      </div>
    ))}
  </div>
));

ProgressIndicator.displayName = 'ProgressIndicator';

// Form actions component
const FormActions = memo(({ step, totalSteps, loading, finalConfirmed, handleBack, handleNext, handleSubmit }) => (
  <div className="form-actions">
    {step > 1 && (
      <button 
        type="button" 
        className="btn-secondary" 
        onClick={handleBack} 
        disabled={loading}
        aria-disabled={loading}
      >
        Back
      </button>
    )}

    {step < totalSteps ? (
      <button
        type="button"
        className="submit-btn"
        onClick={handleNext}
        disabled={loading || (step === 5 && !finalConfirmed)}
        aria-disabled={loading || (step === 5 && !finalConfirmed)}
        aria-busy={loading}
      >
        {step === 5 ? "Continue to Final Step" : "Next Step"}
      </button>
    ) : (
      <button 
        type="submit" 
        className="submit-btn" 
        disabled={loading || !finalConfirmed}
        aria-disabled={loading || !finalConfirmed}
        aria-busy={loading}
      >
        {loading ? "Analyzing..." : "Predict Health Risk"}
      </button>
    )}
  </div>
));

FormActions.displayName = 'FormActions';

function HealthForm({ onSubmit, loading }) {
  const [step, setStep] = useState(1);
  const [finalConfirmed, setFinalConfirmed] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  // Use debounced state updates for better performance
  const debouncedSetFormData = useDebounce(setFormData, 50);

  // Memoized calculations
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

  // Optimized change handler with debouncing for rapid inputs
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const nextValue =
      type === "checkbox" ? checked : type === "range" || type === "number" ? Number(value) : value;

    // Use debounced update for range inputs to reduce re-renders
    if (type === "range") {
      debouncedSetFormData((prev) => ({
        ...prev,
        [name]: nextValue,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: nextValue,
      }));
    }
  }, [debouncedSetFormData]);

  const setToggleValue = useCallback((name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleNext = useCallback(() => {
    setStep((s) => {
      const nextStep = Math.min(TOTAL_STEPS, s + 1);
      if (nextStep === 5) {
        setFinalConfirmed(false);
      }
      return nextStep;
    });
  }, []);

  const handleBack = useCallback(() => setStep((s) => Math.max(1, s - 1)), []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (step !== TOTAL_STEPS) {
      handleNext();
      return;
    }
    if (!finalConfirmed) {
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
  }, [step, finalConfirmed, formData, bmiValue, handleNext, onSubmit]);

  // Memoize step props to prevent unnecessary re-renders
  const stepProps = useMemo(() => ({
    step,
    formData,
    bmiValue,
    bmiCategory,
    selectedConditions,
    finalConfirmed,
    loading,
    handleChange,
    setToggleValue,
    setFinalConfirmed
  }), [step, formData, bmiValue, bmiCategory, selectedConditions, finalConfirmed, loading, handleChange, setToggleValue]);

  // Render current step
  const renderStep = () => {
    switch (step) {
      case 1:
        return <Step1 
          formData={formData} 
          handleChange={handleChange} 
          bmiValue={bmiValue} 
          bmiCategory={bmiCategory}
        />;
      case 2:
        return <Step2 
          formData={formData} 
          handleChange={handleChange} 
          selectedConditions={selectedConditions}
        />;
      case 3:
        return <Step3 formData={formData} handleChange={handleChange} />;
      case 4:
        return <Step4 
          formData={formData} 
          bmiValue={bmiValue} 
          bmiCategory={bmiCategory} 
          selectedConditions={selectedConditions}
        />;
      case 5:
        return <Step5 finalConfirmed={finalConfirmed} setFinalConfirmed={setFinalConfirmed} />;
      case 6:
        return <Step6 loading={loading} />;
      default:
        return <Step1 formData={formData} handleChange={handleChange} />;
    }
  };

  return (
    <form 
      className="health-form" 
      onSubmit={handleSubmit}
      aria-label="Health Assessment Form"
      aria-describedby="form-description"
    >
      <h2 id="form-heading">Health Assessment</h2>
      <span id="form-description" className="sr-only">
        A multi-step form to assess your health risk. Please complete all steps.
      </span>

      <ProgressIndicator step={step} totalSteps={TOTAL_STEPS} />
      
      {renderStep()}

      <FormActions
        step={step}
        totalSteps={TOTAL_STEPS}
        loading={loading}
        finalConfirmed={finalConfirmed}
        handleBack={handleBack}
        handleNext={handleNext}
        handleSubmit={handleSubmit}
      />
    </form>
  );
}

export default memo(HealthForm);
