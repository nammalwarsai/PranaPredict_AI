const {
  getClient,
  PRIMARY_MODEL,
  MODEL_CANDIDATES,
  HF_API_URL,
} = require("../config/hfClient");

function buildPrompt(healthData, riskResult) {
  const { age, bmi, bloodPressure, cholesterol, smoking, activityLevel } = healthData;
  const { score, level } = riskResult;

  return `You are PranaPredict AI, a health wellness advisor inspired by Ayurveda and modern preventive medicine. Analyze the following health data and provide personalized, actionable advice.

Patient Health Data:
- Age: ${age}
- BMI: ${bmi}
- Blood Pressure: ${bloodPressure || "N/A"}
- Cholesterol: ${cholesterol || "N/A"}
- Smoking: ${smoking ? "Yes" : "No"}
- Activity Level: ${activityLevel || "N/A"}
- Risk Score: ${score}/100 (${level} Risk)

Provide a concise health assessment in this format:
1. **Risk Summary**: One sentence about their overall risk.
2. **Key Concerns**: List 2-3 specific health concerns based on their data.
3. **Recommendations**: 3-4 actionable lifestyle changes (diet, exercise, habits) inspired by Ayurvedic wellness principles and modern medicine.
4. **Positive Note**: One encouraging observation about their health.

Keep the response under 250 words. Be specific to their data, not generic.`;
}

async function generateHealthAdvice(healthData, riskResult) {
  const client = getClient();

  // Fallback if no API key configured
  if (!client) {
    const { score, level } = riskResult;
    return {
      advice: getFallbackAdvice(healthData, riskResult),
      model: "fallback",
    };
  }

  try {
    const prompt = buildPrompt(healthData, riskResult);
    let lastError = null;

    for (const model of MODEL_CANDIDATES) {
      try {
        const response = await client.post(HF_API_URL, {
          model,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 512,
          temperature: 0.6,
          top_p: 0.95,
        });

        const content = response.data?.choices?.[0]?.message?.content;

        if (!content) {
          throw new Error("Empty response from LLM");
        }

        return {
          advice: content.trim(),
          model,
        };
      } catch (error) {
        lastError = error;
        const reason = error?.response?.data?.reason;
        const message = error?.response?.data?.message;
        const isModelNotFound = reason === "MODEL_NOT_FOUND" || /model not found/i.test(message || "");

        if (!isModelNotFound) {
          throw error;
        }
      }
    }

    throw lastError || new Error("No available model accepted by the router");
  } catch (error) {
    console.error("LLM API error:", {
      message: error?.response?.data?.message || error.message,
      reason: error?.response?.data?.reason,
      triedModels: MODEL_CANDIDATES,
      primaryModel: PRIMARY_MODEL,
    });

    // Return fallback advice on error so the prediction still works
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
