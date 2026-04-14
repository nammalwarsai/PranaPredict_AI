const { z } = require("zod");
const { calculateRiskScore } = require("../services/riskCalculator");
const { generateHealthAdvice } = require("../services/llmService");
const { createAuthClient } = require("../config/supabaseClient");
const { sendPredictionEmail } = require("../services/emailService");

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
  diabetes: z.boolean().optional().default(false),
  hypertension: z.boolean().optional().default(false),
  heartDisease: z.boolean().optional().default(false),
  kidneyDisease: z.boolean().optional().default(false),
  location: z.enum(["urban", "rural"]).optional().default("urban"),
  dietType: z.enum(["vegetarian", "non-veg", "junk-heavy"]).optional().default("vegetarian"),
  waterIntake: z.number().min(0).max(20).optional().default(2),
  sleepDuration: z.number().min(0).max(24).optional().default(7),
  alcoholConsumption: z.enum(["none", "occasional", "frequent"]).optional().default("none"),
  workType: z.enum(["active", "sedentary"]).optional().default("active"),
});

async function predict(req, res, next) {
  try {
    // Validate input
    const parseResult = predictSchema.safeParse(req.body);
    if (!parseResult.success) {
      const messages = parseResult.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`);
      return res.status(400).json({ success: false, error: "Validation failed", details: messages });
    }

    const { 
      age, bmi, bloodPressure, cholesterol, smoking, activityLevel,
      diabetes, hypertension, heartDisease, kidneyDisease, location,
      dietType, waterIntake, sleepDuration, alcoholConsumption, workType 
    } = parseResult.data;
    
    const healthData = { 
      age, bmi, bloodPressure, cholesterol, smoking, activityLevel,
      diabetes, hypertension, heartDisease, kidneyDisease, location,
      dietType, waterIntake, sleepDuration, alcoholConsumption, workType 
    };

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
        diabetes,
        hypertension,
        heart_disease: heartDisease,
        kidney_disease: kidneyDisease,
        location,
        diet_type: dietType,
        water_intake: waterIntake,
        sleep_duration: sleepDuration,
        alcohol_consumption: alcoholConsumption,
        work_type: workType,
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

    const responseData = {
      id: report?.id,
      healthData,
      riskScore: riskResult.score,
      riskLevel: riskResult.level,
      riskBreakdown: riskResult.breakdown,
      advice: llmResult.advice,
      model: llmResult.model,
      createdAt: report?.created_at,
    };

    // Fire-and-forget: send prediction email without blocking the response
    const userEmail = req.user?.email;
    const userName = req.user?.user_metadata?.full_name || userEmail?.split("@")[0] || "User";
    if (userEmail) {
      sendPredictionEmail(userEmail, userName, responseData).catch(() => {});
    }

    res.json({ success: true, data: responseData });
  } catch (error) {
    next(error);
  }
}

module.exports = { predict };
