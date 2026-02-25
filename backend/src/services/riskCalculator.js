/**
 * Risk Calculator Service
 * Rule-based health risk scoring system
 */

function calculateRiskScore(healthData) {
  const { age, bmi, bloodPressure, cholesterol, smoking, activityLevel } = healthData;
  let score = 0;

  // BMI scoring
  if (bmi > 30) score += 20;
  else if (bmi > 25) score += 10;

  // Blood pressure scoring (systolic/diastolic)
  if (bloodPressure) {
    const parts = bloodPressure.split("/").map(Number);
    const systolic = parts[0];
    const diastolic = parts[1];
    if (!isNaN(systolic) && !isNaN(diastolic)) {
      if (systolic > 140 || diastolic > 90) score += 25;
      else if (systolic > 120 || diastolic > 80) score += 10;
    }
  }

  // Cholesterol scoring
  if (cholesterol === "high") score += 20;
  else if (cholesterol === "borderline") score += 10;

  // Smoking scoring
  if (smoking) score += 15;

  // Activity level scoring
  if (activityLevel === "low") score += 10;
  else if (activityLevel === "moderate") score += 5;

  // Age scoring
  if (age > 50) score += 10;
  else if (age > 40) score += 5;

  // Cap score at 100
  const finalScore = Math.min(score, 100);

  return {
    score: finalScore,
    level: getRiskLevel(finalScore),
  };
}

function getRiskLevel(score) {
  if (score <= 30) return "Low";
  if (score <= 60) return "Moderate";
  return "High";
}

module.exports = { calculateRiskScore };
