const { calculateRiskScore } = require("../services/riskCalculator");
const { generateHealthAdvice } = require("../services/llmService");
const { createAuthClient } = require("../config/supabaseClient");

async function predict(req, res, next) {
  try {
    const { age, bmi, bloodPressure, cholesterol, smoking, activityLevel } = req.body;

    if (age === undefined || bmi === undefined) {
      return res.status(400).json({ error: "Age and BMI are required fields" });
    }

    const healthData = { age, bmi, bloodPressure, cholesterol, smoking, activityLevel };

    const riskResult = calculateRiskScore(healthData);

    const llmResult = await generateHealthAdvice(healthData, riskResult);

    // Store in Supabase using authenticated client so RLS allows the insert
    const supabase = createAuthClient(req.token);
    const { data: report, error: dbError } = await supabase
      .from("health_reports")
      .insert({
        user_id: req.user.id,
        age,
        bmi,
        blood_pressure: bloodPressure,
        cholesterol,
        smoking: smoking || false,
        activity_level: activityLevel,
        risk_score: riskResult.score,
        risk_level: riskResult.level,
        llm_advice: llmResult.advice,
      })
      .select()
      .single();

    if (dbError) {
      console.error("DB insert error:", dbError.message);
    }

    res.json({
      success: true,
      data: {
        id: report?.id,
        healthData,
        riskScore: riskResult.score,
        riskLevel: riskResult.level,
        advice: llmResult.advice,
        model: llmResult.model,
        createdAt: report?.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { predict };
