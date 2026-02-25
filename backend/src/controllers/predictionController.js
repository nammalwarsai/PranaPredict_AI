const { z } = require("zod");
const { calculateRiskScore } = require("../services/riskCalculator");
const { generateHealthAdvice } = require("../services/llmService");
const { createAuthClient } = require("../config/supabaseClient");

// Strict input schema
const predictSchema = z.object({
  age: z.number().int().min(1).max(120),
  bmi: z.number().min(10).max(80),
  bloodPressure: z
    .string()
    .regex(/^\d{2,3}\/\d{2,3}$/, "Blood pressure must be in format 'systolic/diastolic' e.g. 120/80")
    .optional()
    .default("120/80"),
  cholesterol: z.enum(["normal", "borderline", "high"]).optional().default("normal"),
  smoking: z.boolean().optional().default(false),
  activityLevel: z.enum(["low", "moderate", "high"]).optional().default("moderate"),
});

async function predict(req, res, next) {
  try {
    // Validate input
    const parseResult = predictSchema.safeParse(req.body);
    if (!parseResult.success) {
      const messages = parseResult.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
      return res.status(400).json({ success: false, error: "Validation failed", details: messages });
    }

    const { age, bmi, bloodPressure, cholesterol, smoking, activityLevel } = parseResult.data;
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
        smoking,
        activity_level: activityLevel,
        risk_score: riskResult.score,
        risk_level: riskResult.level,
        llm_advice: llmResult.advice,
      })
      .select()
      .single();

    if (dbError) {
      console.error("DB insert error:", dbError.message);
      return res.status(500).json({
        success: false,
        error: "Failed to save health report. Please try again.",
      });
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
