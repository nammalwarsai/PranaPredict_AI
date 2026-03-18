const {
  getClient,
  MODEL,
  HF_API_URL,
} = require("../config/hfClient");

function buildPrompt(healthData, riskResult) {
  const { 
    age, bmi, bloodPressure, cholesterol, smoking, activityLevel,
    location, dietType, alcoholConsumption, waterIntake, sleepDuration, workType,
    diabetes, hypertension, heartDisease, kidneyDisease
  } = healthData;
  const { score, level } = riskResult;

  return `You are PranaPredict AI, a health wellness advisor inspired by Ayurveda and modern preventive medicine. Analyze the following health data and provide personalized, actionable advice.

Patient Health Data:
- Age: ${age}
- BMI: ${bmi}
- Blood Pressure: ${bloodPressure || "N/A"}
- Cholesterol: ${cholesterol || "N/A"}
- Smoking: ${smoking ? "Yes" : "No"}
- Activity Level: ${activityLevel || "N/A"}
- Work & Location: ${workType || "N/A"} / ${location || "N/A"}
- Diet & Alcohol: ${dietType || "N/A"} diet, ${alcoholConsumption || "N/A"} alcohol
- Water Intake: ${waterIntake || 0} liters/day
- Sleep: ${sleepDuration || 0} hours/day
- Pre-existing Conditions: ${[diabetes && 'Diabetes', hypertension && 'Hypertension', heartDisease && 'Heart Disease', kidneyDisease && 'Kidney Disease'].filter(Boolean).join(', ') || 'None'}
- Risk Score: ${score}/100 (${level} Risk)

Provide a highly comprehensive and exhaustively detailed health assessment. The report MUST CONSTITUTE NO LESS THAN 150 LINES of detailed text.

Format the response strictly using markdown outlines and deep paragraphs covering the following mandatory sections:
1. **Executive Risk Summary**: Extremely thorough analysis of their overall risk level.
2. **Key Predictive Concerns**: In-depth medical elaboration on at least 4 specific health concerns derived directly from their data points (BP, BMI, habits, history). Explain the biochemical and physiological reasons.
3. **Ayurvedic Insights**: Detailed Ayurvedic assessment (Dosha balancing) corresponding to their attributes, mentioning herbs, lifestyle, and philosophy.
4. **Extensive Recommendations**: 10-15 deep, actionable lifestyle changes (diet, daily routine, mental health, exercise). Provide specific scientifically backed reasons.
5. **Pathological Risk Forecast**: What their long-term health trajectory looks like if habits aren't changed.
6. **Encouraging Observation**: Expand on the positives in their profile deeply.

CRITICAL REQUIREMENT: Do not summarize. You must write an extensive, highly informative essay covering every possible angle. Ensure the output is visually long using paragraphs and lists, guaranteed exceeding 150 lines.`;
}

async function generateHealthAdvice(healthData, riskResult) {
  const client = getClient();

  if (!client) {
    return {
      advice: getFallbackAdvice(healthData, riskResult),
      model: "fallback",
    };
  }

  try {
    const prompt = buildPrompt(healthData, riskResult);

    const response = await client.post(HF_API_URL, {
      model: MODEL,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 2800,
      temperature: 0.7,
      top_p: 0.95,
    });

    const content = response.data?.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Empty response from LLM");
    }

    return {
      advice: content.trim(),
      model: MODEL,
    };
  } catch (error) {
    console.error("LLM API error:", {
      message: error?.response?.data?.message || error.message,
      reason: error?.response?.data?.reason,
      model: MODEL,
    });

    return {
      advice: getFallbackAdvice(healthData, riskResult),
      model: "fallback",
    };
  }
}

function getFallbackAdvice(healthData, riskResult) {
  const { age, bmi, smoking, activityLevel, cholesterol, bloodPressure } = healthData;
  const { score, level } = riskResult;

  const tips = [];

  if (bmi > 30) tips.push("Consider a balanced diet with portion control to manage your BMI.");
  else if (bmi > 25) tips.push("Your BMI is slightly elevated. Light dietary adjustments can help.");

  if (bloodPressure) {
    const parts = bloodPressure.split("/").map(Number);
    const sys = parts[0];
    const dia = parts[1];
    if (!isNaN(sys) && !isNaN(dia)) {
      if (sys > 140 || dia > 90) tips.push("Your blood pressure is high. Reduce sodium intake and manage stress.");
      else if (sys > 120 || dia > 80) tips.push("Monitor your blood pressure regularly and stay hydrated.");
    }
  }

  if (cholesterol === "high") tips.push("Reduce saturated fats and include more fiber in your diet.");

  if (smoking) tips.push("Quitting smoking is the single most impactful change for your health.");

  if (activityLevel === "low") tips.push("Aim for at least 30 minutes of moderate activity daily.");

  if (age > 50) tips.push("Regular health checkups become increasingly important at your age.");

  if (tips.length === 0) tips.push("Maintain your current healthy lifestyle with regular exercise and balanced nutrition.");

  return `Your health risk level is ${level} (score: ${score}/100). ${tips.join(" ")} Consult a healthcare professional for personalized medical advice.`;
}

module.exports = { generateHealthAdvice };
