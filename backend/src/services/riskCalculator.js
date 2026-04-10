/**
 * Risk Calculator Service
 * Rule-based health risk scoring system with detailed factor breakdown
 */

function calculateRiskScore(healthData) {
  const { 
    age, bmi, bloodPressure, cholesterol, smoking, activityLevel,
    diabetes, hypertension, heartDisease, kidneyDisease,
    dietType, waterIntake, sleepDuration, alcoholConsumption, workType 
  } = healthData;

  // ── Category: Pre-existing Conditions ──
  let conditionScore = 0;
  const conditionDetails = [];
  if (heartDisease) { conditionScore += 20; conditionDetails.push("Heart Disease (+20)"); }
  if (diabetes) { conditionScore += 15; conditionDetails.push("Diabetes (+15)"); }
  if (hypertension) { conditionScore += 15; conditionDetails.push("Hypertension (+15)"); }
  if (kidneyDisease) { conditionScore += 15; conditionDetails.push("Kidney Disease (+15)"); }

  // ── Category: Vitals (BMI, BP, Cholesterol) ──
  let vitalsScore = 0;
  const vitalsDetails = [];

  // BMI
  if (bmi > 30) { vitalsScore += 20; vitalsDetails.push(`BMI ${bmi} - Obese (+20)`); }
  else if (bmi > 25) { vitalsScore += 10; vitalsDetails.push(`BMI ${bmi} - Overweight (+10)`); }
  else if (bmi < 18.5) { vitalsScore += 5; vitalsDetails.push(`BMI ${bmi} - Underweight (+5)`); }
  else { vitalsDetails.push(`BMI ${bmi} - Normal (+0)`); }

  // Blood pressure
  if (bloodPressure) {
    const parts = bloodPressure.split("/").map(Number);
    const systolic = parts[0];
    const diastolic = parts[1];
    if (!isNaN(systolic) && !isNaN(diastolic)) {
      if (systolic > 140 || diastolic > 90) { vitalsScore += 25; vitalsDetails.push(`BP ${bloodPressure} - High (+25)`); }
      else if (systolic > 120 || diastolic > 80) { vitalsScore += 10; vitalsDetails.push(`BP ${bloodPressure} - Elevated (+10)`); }
      else { vitalsDetails.push(`BP ${bloodPressure} - Normal (+0)`); }
    }
  }

  // Cholesterol
  if (cholesterol === "high") { vitalsScore += 20; vitalsDetails.push("Cholesterol High (+20)"); }
  else if (cholesterol === "borderline") { vitalsScore += 10; vitalsDetails.push("Cholesterol Borderline (+10)"); }
  else { vitalsDetails.push("Cholesterol Normal (+0)"); }

  // ── Category: Lifestyle ──
  let lifestyleScore = 0;
  const lifestyleDetails = [];

  if (smoking) { lifestyleScore += 15; lifestyleDetails.push("Smoking (+15)"); }
  if (activityLevel === "low") { lifestyleScore += 10; lifestyleDetails.push("Low Activity (+10)"); }
  else if (activityLevel === "moderate") { lifestyleScore += 5; lifestyleDetails.push("Moderate Activity (+5)"); }

  if (dietType === "junk-heavy") { lifestyleScore += 10; lifestyleDetails.push("Junk-heavy Diet (+10)"); }
  else if (dietType === "vegetarian") { lifestyleScore -= 5; lifestyleDetails.push("Vegetarian Diet (-5)"); }

  if (alcoholConsumption === "frequent") { lifestyleScore += 15; lifestyleDetails.push("Frequent Alcohol (+15)"); }
  else if (alcoholConsumption === "occasional") { lifestyleScore += 5; lifestyleDetails.push("Occasional Alcohol (+5)"); }

  if (workType === "sedentary") { lifestyleScore += 5; lifestyleDetails.push("Sedentary Work (+5)"); }

  if (sleepDuration < 6) { lifestyleScore += 10; lifestyleDetails.push(`Sleep ${sleepDuration}h - Insufficient (+10)`); }
  else if (sleepDuration >= 7 && sleepDuration <= 9) { lifestyleScore -= 5; lifestyleDetails.push(`Sleep ${sleepDuration}h - Optimal (-5)`); }

  if (waterIntake < 1.5) { lifestyleScore += 5; lifestyleDetails.push(`Water ${waterIntake}L - Low (+5)`); }
  else if (waterIntake > 2.5) { lifestyleScore -= 5; lifestyleDetails.push(`Water ${waterIntake}L - Good (-5)`); }

  // ── Category: Age ──
  let ageScore = 0;
  const ageDetails = [];
  if (age > 50) { ageScore += 10; ageDetails.push(`Age ${age} - Over 50 (+10)`); }
  else if (age > 40) { ageScore += 5; ageDetails.push(`Age ${age} - Over 40 (+5)`); }
  else { ageDetails.push(`Age ${age} (+0)`); }

  // ── Totals ──
  const rawScore = conditionScore + vitalsScore + lifestyleScore + ageScore;
  const finalScore = Math.max(0, Math.min(rawScore, 100));
  const rawTotal = Math.max(1, conditionScore + vitalsScore + Math.max(0, lifestyleScore) + ageScore);

  return {
    score: finalScore,
    level: getRiskLevel(finalScore),
    breakdown: {
      conditions: { score: Math.max(0, conditionScore), pct: Math.round((Math.max(0, conditionScore) / rawTotal) * 100), details: conditionDetails },
      vitals:     { score: Math.max(0, vitalsScore),     pct: Math.round((Math.max(0, vitalsScore) / rawTotal) * 100),     details: vitalsDetails },
      lifestyle:  { score: lifestyleScore,                pct: Math.round((Math.max(0, lifestyleScore) / rawTotal) * 100),  details: lifestyleDetails },
      age:        { score: ageScore,                      pct: Math.round((ageScore / rawTotal) * 100),                     details: ageDetails },
    },
  };
}

function getRiskLevel(score) {
  if (score <= 30) return "Low";
  if (score <= 60) return "Moderate";
  return "High";
}

module.exports = { calculateRiskScore };
