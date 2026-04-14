const nodemailer = require("nodemailer");

const FRONTEND_PUBLIC_URL = (process.env.FRONTEND_PUBLIC_URL || "http://localhost:5173").replace(/\/$/, "");
const DASHBOARD_URL = `${FRONTEND_PUBLIC_URL}/dashboard`;
const LOGIN_URL = `${FRONTEND_PUBLIC_URL}/login`;

const emailAppPassword = (process.env.EMAIL_APP_PASSWORD || "").replace(/\s+/g, "");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // use STARTTLS on port 587 (more reliable than SSL on 465)
  auth: {
    user: process.env.EMAIL_USER,
    pass: emailAppPassword,
  },
});

async function verifySmtpConnection() {
  try {
    await transporter.verify();
    console.log("[SMTP] Transport verified successfully.");
  } catch (err) {
    console.error("[SMTP] Verification failed:", err.message);
  }
}

// ── Shared styling tokens ────────────────────────────────────────────
const BRAND = {
  primary: "#6C63FF",
  primaryDark: "#5A52D5",
  accent: "#00D2FF",
  success: "#00C48C",
  warning: "#FFB800",
  danger: "#FF6B6B",
  dark: "#1A1A2E",
  cardBg: "#FFFFFF",
  textPrimary: "#1A1A2E",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function baseLayout(title, preheader, bodyContent) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
</style>
</head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<span style="display:none;font-size:1px;color:#f0f2f5;max-height:0;overflow:hidden;">${preheader}</span>

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:linear-gradient(135deg,${BRAND.dark} 0%,#16213E 50%,#0F3460 100%);padding:40px 20px;">
  <tr><td align="center">

    <!-- Logo / Brand -->
    <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;">
      <tr><td align="center" style="padding-bottom:30px;">
        <div style="display:inline-block;background:linear-gradient(135deg,${BRAND.primary},${BRAND.accent});border-radius:16px;padding:12px 24px;">
          <span style="font-size:24px;font-weight:700;color:#fff;letter-spacing:0.5px;">🩺 PranaPredict AI</span>
        </div>
      </td></tr>

      <!-- Main Card -->
      <tr><td>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${BRAND.cardBg};border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
          <!-- Gradient header band -->
          <tr><td style="height:6px;background:linear-gradient(90deg,${BRAND.primary},${BRAND.accent},${BRAND.success});"></td></tr>
          <tr><td style="padding:40px 40px 32px;">
            ${bodyContent}
          </td></tr>
        </table>
      </td></tr>

      <!-- Footer -->
      <tr><td align="center" style="padding-top:30px;">
        <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.5);line-height:1.6;">
          This email was sent by PranaPredict AI &bull; AI-Powered Wellness Platform<br>
          &copy; ${new Date().getFullYear()} PranaPredict AI. All rights reserved.
        </p>
      </td></tr>
    </table>

  </td></tr>
</table>
</body>
</html>`;
}

// ── Risk-level color helper ──────────────────────────────────────────
function riskColor(level) {
  const l = (level || "").toLowerCase();
  if (l === "low") return BRAND.success;
  if (l === "moderate") return BRAND.warning;
  return BRAND.danger; // high / critical
}

// ── 1. Prediction Result Email ────────────────────────────────────────
function buildPredictionEmail(userName, data) {
  const { healthData, riskScore, riskLevel, advice } = data;
  const color = riskColor(riskLevel);
  const name = escapeHtml(userName || "there");

  // Convert markdown-style bold (**text**) to HTML <strong>
  const formattedAdvice = (advice || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>");

  const body = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:${BRAND.textPrimary};">
      Your Health Risk Report 📊
    </h1>
    <p style="margin:0 0 28px;font-size:15px;color:${BRAND.textSecondary};">
      Hello <strong>${name}</strong>, here are the results of your latest health risk assessment.
    </p>

    <!-- Risk Score Card -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:linear-gradient(135deg,${BRAND.dark},#16213E);border-radius:12px;margin-bottom:24px;">
      <tr><td style="padding:28px;text-align:center;">
        <div style="display:inline-block;width:90px;height:90px;border-radius:50%;background:conic-gradient(${color} ${riskScore}%, #2d2d44 0);padding:6px;">
          <div style="width:78px;height:78px;border-radius:50%;background:${BRAND.dark};display:flex;align-items:center;justify-content:center;line-height:78px;text-align:center;">
            <span style="font-size:26px;font-weight:700;color:#fff;">${riskScore}</span>
          </div>
        </div>
        <p style="margin:12px 0 0;font-size:18px;font-weight:600;color:${color};text-transform:uppercase;letter-spacing:1px;">
          ${riskLevel} Risk
        </p>
      </td></tr>
    </table>

    <!-- Health Data Summary -->
    <h2 style="margin:0 0 12px;font-size:16px;font-weight:600;color:${BRAND.textPrimary};">Health Parameters</h2>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid ${BRAND.border};border-radius:8px;overflow:hidden;margin-bottom:24px;">
      <tr style="background:#f9fafb;">
        <td style="padding:10px 16px;font-size:13px;font-weight:600;color:${BRAND.textSecondary};border-bottom:1px solid ${BRAND.border};">Parameter</td>
        <td style="padding:10px 16px;font-size:13px;font-weight:600;color:${BRAND.textSecondary};border-bottom:1px solid ${BRAND.border};text-align:right;">Value</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:14px;color:${BRAND.textPrimary};border-bottom:1px solid ${BRAND.border};">Age</td>
        <td style="padding:10px 16px;font-size:14px;color:${BRAND.textPrimary};border-bottom:1px solid ${BRAND.border};text-align:right;">${healthData.age}</td>
      </tr>
      <tr style="background:#f9fafb;">
        <td style="padding:10px 16px;font-size:14px;color:${BRAND.textPrimary};border-bottom:1px solid ${BRAND.border};">BMI</td>
        <td style="padding:10px 16px;font-size:14px;color:${BRAND.textPrimary};border-bottom:1px solid ${BRAND.border};text-align:right;">${healthData.bmi}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:14px;color:${BRAND.textPrimary};border-bottom:1px solid ${BRAND.border};">Blood Pressure</td>
        <td style="padding:10px 16px;font-size:14px;color:${BRAND.textPrimary};border-bottom:1px solid ${BRAND.border};text-align:right;">${healthData.bloodPressure || "N/A"}</td>
      </tr>
      <tr style="background:#f9fafb;">
        <td style="padding:10px 16px;font-size:14px;color:${BRAND.textPrimary};border-bottom:1px solid ${BRAND.border};">Cholesterol</td>
        <td style="padding:10px 16px;font-size:14px;color:${BRAND.textPrimary};border-bottom:1px solid ${BRAND.border};text-align:right;text-transform:capitalize;">${healthData.cholesterol || "N/A"}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:14px;color:${BRAND.textPrimary};border-bottom:1px solid ${BRAND.border};">Smoking</td>
        <td style="padding:10px 16px;font-size:14px;color:${BRAND.textPrimary};border-bottom:1px solid ${BRAND.border};text-align:right;">${healthData.smoking ? "Yes ⚠️" : "No ✅"}</td>
      </tr>
      <tr style="background:#f9fafb;">
        <td style="padding:10px 16px;font-size:14px;color:${BRAND.textPrimary};">Activity Level</td>
        <td style="padding:10px 16px;font-size:14px;color:${BRAND.textPrimary};text-align:right;text-transform:capitalize;">${healthData.activityLevel || "N/A"}</td>
      </tr>
    </table>

    <!-- AI Advice -->
    <h2 style="margin:0 0 12px;font-size:16px;font-weight:600;color:${BRAND.textPrimary};">🤖 AI Health Advice</h2>
    <div style="background:linear-gradient(135deg,#f0f0ff,#e8f4ff);border-left:4px solid ${BRAND.primary};border-radius:0 8px 8px 0;padding:20px;margin-bottom:24px;">
      <p style="margin:0;font-size:14px;line-height:1.7;color:${BRAND.textPrimary};">
        ${formattedAdvice}
      </p>
    </div>

    <!-- CTA -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr><td align="center">
        <a href="${DASHBOARD_URL}" style="display:inline-block;background:linear-gradient(135deg,${BRAND.primary},${BRAND.accent});color:#fff;font-size:14px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:8px;letter-spacing:0.3px;">
          View Full Dashboard →
        </a>
      </td></tr>
    </table>

    <p style="margin:24px 0 0;font-size:12px;color:${BRAND.textSecondary};text-align:center;">
      ⚕️ <em>This is an AI-generated assessment. Please consult a healthcare professional for medical advice.</em>
    </p>`;

  return baseLayout(
    "Your Health Risk Report — PranaPredict AI",
    `Your risk score is ${riskScore}/100 (${riskLevel}). See the full AI-powered analysis inside.`,
    body
  );
}

// ── 2. Login Confirmation Email ───────────────────────────────────────
function buildLoginEmail(userName) {
  const name = escapeHtml(userName || "there");
  const timestamp = new Date().toLocaleString("en-IN", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });

  const body = `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,${BRAND.success},#00E5A0);line-height:72px;text-align:center;font-size:32px;">
        ✅
      </div>
    </div>

    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:${BRAND.textPrimary};text-align:center;">
      Welcome Back, ${name}! 👋
    </h1>
    <p style="margin:0 0 28px;font-size:15px;color:${BRAND.textSecondary};text-align:center;">
      You've successfully signed in to PranaPredict AI.
    </p>

    <!-- Login Details Card -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f9fafb;border:1px solid ${BRAND.border};border-radius:12px;margin-bottom:24px;">
      <tr><td style="padding:20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding:8px 0;font-size:13px;color:${BRAND.textSecondary};font-weight:500;">🕐 Login Time</td>
            <td style="padding:8px 0;font-size:13px;color:${BRAND.textPrimary};font-weight:600;text-align:right;">${timestamp}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:13px;color:${BRAND.textSecondary};font-weight:500;">📍 Platform</td>
            <td style="padding:8px 0;font-size:13px;color:${BRAND.textPrimary};font-weight:600;text-align:right;">PranaPredict AI Web App</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:13px;color:${BRAND.textSecondary};font-weight:500;">🔒 Status</td>
            <td style="padding:8px 0;font-size:13px;color:${BRAND.success};font-weight:600;text-align:right;">Authenticated ✓</td>
          </tr>
        </table>
      </td></tr>
    </table>

    <!-- CTA -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr><td align="center">
        <a href="${DASHBOARD_URL}" style="display:inline-block;background:linear-gradient(135deg,${BRAND.primary},${BRAND.accent});color:#fff;font-size:14px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:8px;">
          Go to Dashboard →
        </a>
      </td></tr>
    </table>

    <p style="margin:24px 0 0;font-size:12px;color:${BRAND.textSecondary};text-align:center;">
      If this wasn't you, please secure your account immediately.
    </p>`;

  return baseLayout(
    "Login Successful — PranaPredict AI",
    `Hey ${name}, you just signed in to PranaPredict AI at ${timestamp}.`,
    body
  );
}

// ── 3. Logout Confirmation Email ──────────────────────────────────────
function buildLogoutEmail(userName) {
  const name = escapeHtml(userName || "there");
  const timestamp = new Date().toLocaleString("en-IN", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });

  const body = `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,${BRAND.primary},${BRAND.primaryDark});line-height:72px;text-align:center;font-size:32px;">
        👋
      </div>
    </div>

    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:${BRAND.textPrimary};text-align:center;">
      Session Ended
    </h1>
    <p style="margin:0 0 28px;font-size:15px;color:${BRAND.textSecondary};text-align:center;">
      You've been safely signed out of PranaPredict AI, <strong>${name}</strong>.
    </p>

    <!-- Logout Details Card -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f9fafb;border:1px solid ${BRAND.border};border-radius:12px;margin-bottom:24px;">
      <tr><td style="padding:20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding:8px 0;font-size:13px;color:${BRAND.textSecondary};font-weight:500;">🕐 Logout Time</td>
            <td style="padding:8px 0;font-size:13px;color:${BRAND.textPrimary};font-weight:600;text-align:right;">${timestamp}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:13px;color:${BRAND.textSecondary};font-weight:500;">🔐 Session</td>
            <td style="padding:8px 0;font-size:13px;color:${BRAND.textSecondary};font-weight:600;text-align:right;">Terminated Securely</td>
          </tr>
        </table>
      </td></tr>
    </table>

    <!-- Message -->
    <div style="background:linear-gradient(135deg,#f0f0ff,#e8f4ff);border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
      <p style="margin:0;font-size:14px;color:${BRAND.textPrimary};line-height:1.6;">
        🌿 <strong>Stay healthy!</strong> Remember to track your health regularly<br>
        for the best AI-powered insights and recommendations.
      </p>
    </div>

    <!-- CTA -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr><td align="center">
        <a href="${LOGIN_URL}" style="display:inline-block;background:linear-gradient(135deg,${BRAND.primary},${BRAND.accent});color:#fff;font-size:14px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:8px;">
          Sign In Again →
        </a>
      </td></tr>
    </table>`;

  return baseLayout(
    "Signed Out — PranaPredict AI",
    `You've been signed out of PranaPredict AI at ${timestamp}.`,
    body
  );
}

// ── Senders ──────────────────────────────────────────────────────────
async function sendPredictionEmail(toEmail, userName, predictionData) {
  try {
    const html = buildPredictionEmail(userName, predictionData);
    await transporter.sendMail({
      from: `"PranaPredict AI" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `📊 Your Health Risk Report — ${predictionData.riskLevel} Risk (${predictionData.riskScore}/100)`,
      html,
    });
    console.log(`✉️  Prediction email sent to ${toEmail}`);
  } catch (err) {
    console.error("Failed to send prediction email:", err.message);
  }
}

async function sendLoginEmail(toEmail, userName) {
  try {
    const html = buildLoginEmail(userName);
    await transporter.sendMail({
      from: `"PranaPredict AI" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: "✅ Login Successful — PranaPredict AI",
      html,
    });
    console.log(`✉️  Login email sent to ${toEmail}`);
  } catch (err) {
    console.error("Failed to send login email:", err.message);
  }
}

async function sendLogoutEmail(toEmail, userName) {
  try {
    const html = buildLogoutEmail(userName);
    await transporter.sendMail({
      from: `"PranaPredict AI" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: "👋 Signed Out — PranaPredict AI",
      html,
    });
    console.log(`✉️  Logout email sent to ${toEmail}`);
  } catch (err) {
    console.error("Failed to send logout email:", err.message);
  }
}

module.exports = { sendPredictionEmail, sendLoginEmail, sendLogoutEmail, verifySmtpConnection };
