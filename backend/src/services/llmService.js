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
  const { score, level, breakdown } = riskResult;

  // Build breakdown explanation for the LLM
  const breakdownText = breakdown ? [
    `  - Pre-existing Conditions: ${breakdown.conditions.pct}% contribution (${breakdown.conditions.details.join(", ") || "None"})`,
    `  - Vitals (BMI/BP/Cholesterol): ${breakdown.vitals.pct}% contribution (${breakdown.vitals.details.join(", ")})`,
    `  - Lifestyle Factors: ${breakdown.lifestyle.pct}% contribution (${breakdown.lifestyle.details.join(", ") || "None"})`,
    `  - Age Factor: ${breakdown.age.pct}% contribution (${breakdown.age.details.join(", ")})`,
  ].join("\n") : "Breakdown not available.";

  return `You are PranaPredict AI, a health wellness advisor combining modern preventive medicine with Ayurvedic wisdom. Generate a structured health report for the following patient data.

PATIENT HEALTH DATA:
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

RISK FACTOR BREAKDOWN (explain these percentages in your analysis):
${breakdownText}

CRITICAL INSTRUCTIONS — USE EXACTLY THESE SECTION HEADINGS:

## Top 3 Immediate Health Risks
List the top 3 most urgent health risks for this patient, ordered by priority. For each risk use EXACTLY this format:
- **Risk Name**: [name]
- **Severity**: [Critical/High/Moderate/Low]
- **Why**: [1-2 sentence explanation tied to their data]
- **Immediate Action**: [specific action to take]

## Key Health Concerns
For each concern (cover at least 4), use this EXACT Cause → Impact → Fix format:
- **Concern**: [name]
- **Cause**: [specific cause from their data, e.g., "Junk-heavy diet with only 1.5L water/day"]
- **Impact**: [physiological impact, e.g., "Leads to chronic dehydration and insulin resistance"]
- **Fix**: [specific actionable fix, e.g., "Switch to low-GI foods, increase water to 3L/day"]

## Personalized Daily Targets
Provide SPECIFIC numbers personalized to this patient:
- Daily steps target
- Daily calorie range
- Daily water intake target (liters)
- Sleep window (e.g., "10:30 PM – 6:30 AM")
- Exercise type and duration
- Key foods to add / avoid

## 30-Day Action Plan
Structure as 4 weeks:
- **Week 1**: [Focus area + specific daily actions]
- **Week 2**: [Focus area + specific daily actions]
- **Week 3**: [Focus area + specific daily actions]
- **Week 4**: [Focus area + specific daily actions]

## Ayurvedic & Holistic Insights
Integrate Ayurvedic analysis WITH modern medicine correlations:
- Identify likely dosha imbalance based on their data
- Connect it to their modern medical concerns (e.g., "Junk diet → Pitta aggravation → inflammatory markers")
- Recommend specific herbs, routines, and practices
- Keep this integrated with the medical analysis, not separate

## Positive Observations
Highlight 2-3 genuinely positive aspects of their health profile with encouragement.

## Next Steps
Provide 3 clear, urgent next steps:
1. Medical consultation recommendation with timeline
2. When to re-evaluate (e.g., "Re-assess in 60 days")
3. Most important single change to make TODAY

FORMATTING RULES:
- Use bullet points and short paragraphs, NOT dense essays
- Be specific with numbers: exact calories, exact steps, exact sleep times
- Reference their actual data in every recommendation
- Each section must be substantial (at least 8-10 lines)
- Total output must be at least 120 lines
- Do NOT repeat the risk score multiple times — mention it ONCE in the opening`;
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
      max_tokens: 3500,
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
