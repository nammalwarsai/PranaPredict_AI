import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// ─── Clean Design Tokens ────────────────────────────────────────────────────────
// Minimal palette: navy primary, teal secondary, red for risk only
const C = {
  // Primary — navy
  navy900: [10, 25, 47],
  navy800: [15, 38, 68],
  navy700: [20, 52, 92],
  navy600: [28, 72, 125],
  navy500: [38, 100, 165],
  navy400: [70, 140, 200],
  navy300: [130, 180, 220],
  navy200: [185, 210, 235],
  navy100: [225, 238, 250],

  // Teal accent
  teal600: [13, 148, 136],
  teal500: [20, 184, 166],
  teal100: [204, 251, 241],

  // Amber (for moderate/warnings)
  amber600: [217, 119, 6],
  amber500: [245, 158, 11],
  amber100: [255, 251, 235],

  // Red (risk only)
  red600: [220, 38, 38],
  red500: [239, 68, 68],
  red100: [254, 226, 226],

  // Green (positive)
  green600: [22, 163, 74],
  green500: [34, 197, 94],
  green100: [220, 252, 231],

  // Neutrals
  white: [255, 255, 255],
  gray50: [248, 250, 252],
  gray100: [241, 245, 249],
  gray200: [226, 232, 240],
  gray300: [203, 213, 225],
  gray400: [148, 163, 184],
  gray500: [100, 116, 139],
  gray600: [71, 85, 105],
  gray700: [51, 65, 85],
  gray800: [30, 41, 59],
  gray900: [15, 23, 42],
};

// ─── Spacing Grid (8mm base) ────────────────────────────────────────────────────
const S = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
};

// ─── Typography Scale ───────────────────────────────────────────────────────────
const T = {
  h1: 22,
  h2: 13,
  h3: 10.5,
  body: 9,
  small: 7.5,
  tiny: 6.5,
};

// ─── Utilities ──────────────────────────────────────────────────────────────────
function clamp(v, min, max) { const n = Number(v); return isFinite(n) ? Math.max(min, Math.min(max, n)) : min; }
function norm(v, fb = "N/A") { return (v === null || v === undefined || (typeof v === "string" && !v.trim())) ? fb : v; }
function title(v) { const t = String(norm(v)).replace(/[_-]/g, " "); return t === "N/A" ? t : t.split(" ").filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(" "); }
function yn(v) { return v === true ? "Yes" : v === false ? "No" : "N/A"; }
function mix(a, b, t) { return [Math.round(a[0]+(b[0]-a[0])*t), Math.round(a[1]+(b[1]-a[1])*t), Math.round(a[2]+(b[2]-a[2])*t)]; }
function alpha(c, o) { return mix(c, C.white, 1 - o); }
function polar(cx, cy, r, deg) { const rad = deg * Math.PI / 180; return { x: cx + Math.cos(rad) * r, y: cy + Math.sin(rad) * r }; }

function fmtDate(v) {
  if (!v) return "N/A";
  const d = new Date(v);
  return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function fmtDateTime(v) {
  if (!v) return "N/A";
  const d = new Date(v);
  return isNaN(d.getTime()) ? "N/A" : d.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }).replace(",", " at");
}

function stripMd(text) {
  return String(text || "").replace(/\*\*(.*?)\*\*/g, "$1").replace(/__(.*?)__/g, "$1").replace(/`([^`]+)`/g, "$1").replace(/\[(.*?)\]\(.*?\)/g, "$1").trim();
}

function riskPalette(level) {
  const t = String(norm(level, "Moderate")).toLowerCase();
  if (t.includes("high")) return { strong: C.red600, mid: C.red500, soft: C.red100, label: "High Risk" };
  if (t.includes("moderate")) return { strong: C.amber600, mid: C.amber500, soft: C.amber100, label: "Moderate Risk" };
  return { strong: C.green600, mid: C.green500, soft: C.green100, label: "Low Risk" };
}

// ─── Drawing Primitives ─────────────────────────────────────────────────────────
const setC = (d, c) => d.setTextColor(c[0], c[1], c[2]);
const setF = (d, c) => d.setFillColor(c[0], c[1], c[2]);
const setS = (d, c) => d.setDrawColor(c[0], c[1], c[2]);
function font(d, sz, st = "normal") { d.setFont("helvetica", st); d.setFontSize(sz); }
function rr(d, x, y, w, h, r, mode = "F") { r > 0 ? d.roundedRect(x, y, w, h, r, r, mode) : d.rect(x, y, w, h, mode); }

function gradV(d, x, y, w, h, top, bot, steps = 40) {
  const s = h / steps;
  for (let i = 0; i < steps; i++) { setF(d, mix(top, bot, i / (steps - 1))); d.rect(x, y + i * s, w, s + 0.4, "F"); }
}

function gradH(d, x, y, w, h, left, right, steps = 40) {
  const s = w / steps;
  for (let i = 0; i < steps; i++) { setF(d, mix(left, right, i / (steps - 1))); d.rect(x + i * s, y, s + 0.4, h, "F"); }
}

function panel(d, x, y, w, h, opts = {}) {
  const { bg = C.white, border = C.gray200, radius = 4, shadow = true } = opts;
  if (shadow) { setF(d, [220, 225, 235]); rr(d, x + 0.7, y + 0.7, w, h, radius, "F"); }
  setF(d, bg); setS(d, border); d.setLineWidth(0.25); rr(d, x, y, w, h, radius, "FD");
}

function drawGradientArc(d, cx, cy, r, s, e, from, to, w, seg = 64) {
  if (e - s <= 0) return;
  const step = (e - s) / seg; d.setLineWidth(w);
  for (let i = 0; i < seg; i++) {
    const p1 = polar(cx, cy, r, s + i * step), p2 = polar(cx, cy, r, s + (i + 1) * step);
    setS(d, mix(from, to, i / seg)); d.line(p1.x, p1.y, p2.x, p2.y);
  }
}

function drawSegArc(d, cx, cy, r, s, e, color, w, seg = 48) {
  if (e - s <= 0) return;
  const step = (e - s) / seg; d.setLineWidth(w); setS(d, color);
  for (let i = 0; i < seg; i++) {
    const p1 = polar(cx, cy, r, s + i * step), p2 = polar(cx, cy, r, s + i * step + step * 0.7);
    d.line(p1.x, p1.y, p2.x, p2.y);
  }
}

// ─── Parse LLM Advice into Structured Sections ─────────────────────────────────
function parseAdviceSections(advice) {
  const text = String(advice || "");
  const sections = {};
  const sectionOrder = [];

  // Split by ## headings
  const parts = text.split(/^##\s+/m);

  for (const part of parts) {
    if (!part.trim()) continue;
    const lines = part.split(/\r?\n/);
    const heading = stripMd(lines[0].trim());
    const body = lines.slice(1).join("\n").trim();
    if (heading) {
      sections[heading] = body;
      sectionOrder.push(heading);
    }
  }

  return { sections, sectionOrder };
}

function parseListItems(text) {
  return String(text || "").split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l && !l.startsWith("#"))
    .map(l => stripMd(l.replace(/^[-*•]\s*/, "").replace(/^\d+\.\s*/, "")))
    .filter(Boolean);
}

// ─── Compute approximate breakdown from report data (for old reports) ───────────
function computeBreakdown(report) {
  if (report.riskBreakdown) return report.riskBreakdown;

  let cond = 0, vit = 0, life = 0, ageSc = 0;
  if (report.heart_disease) cond += 20;
  if (report.diabetes) cond += 15;
  if (report.hypertension) cond += 15;
  if (report.kidney_disease) cond += 15;

  const bmi = parseFloat(report.bmi);
  if (bmi > 30) vit += 20; else if (bmi > 25) vit += 10;

  if (report.blood_pressure) {
    const [sys, dia] = report.blood_pressure.split("/").map(Number);
    if (sys > 140 || dia > 90) vit += 25; else if (sys > 120 || dia > 80) vit += 10;
  }
  if (report.cholesterol === "high") vit += 20; else if (report.cholesterol === "borderline") vit += 10;

  if (report.smoking) life += 15;
  if (report.activity_level === "low") life += 10; else if (report.activity_level === "moderate") life += 5;
  if (report.diet_type === "junk-heavy") life += 10;
  if (report.alcohol_consumption === "frequent") life += 15; else if (report.alcohol_consumption === "occasional") life += 5;
  if (report.work_type === "sedentary") life += 5;
  if (report.sleep_duration < 6) life += 10;
  if (report.water_intake < 1.5) life += 5;

  const age = report.age;
  if (age > 50) ageSc += 10; else if (age > 40) ageSc += 5;

  const total = Math.max(1, cond + vit + Math.max(0, life) + ageSc);
  return {
    conditions: { score: cond, pct: Math.round(cond / total * 100) },
    vitals: { score: vit, pct: Math.round(vit / total * 100) },
    lifestyle: { score: Math.max(0, life), pct: Math.round(Math.max(0, life) / total * 100) },
    age: { score: ageSc, pct: Math.round(ageSc / total * 100) },
  };
}

// ─── Context ────────────────────────────────────────────────────────────────────
function createCtx(doc, report) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const mx = S.xl + 2; // 18mm margin
  return { doc, report, W, H, mx, cw: W - mx * 2, bottom: H - S.xl, y: S.xl, page: 1 };
}

function ensureSpace(ctx, need) { if (ctx.y + need > ctx.bottom) newPage(ctx); }

function newPage(ctx) {
  ctx.doc.addPage(); ctx.page++;
  drawInnerBg(ctx);
  drawPageHeader(ctx);
}

// ─── Page Backgrounds ───────────────────────────────────────────────────────────
function drawCoverBg(ctx) {
  const { doc, W, H } = ctx;
  gradV(doc, 0, 0, W, H, C.navy900, C.navy700, 50);

  // Accent top bar
  gradH(doc, 0, 0, W, 2.5, C.teal500, C.navy400, 20);
  // Bottom bar
  gradH(doc, 0, H - 2.5, W, 2.5, C.navy400, C.teal500, 20);
}

function drawInnerBg(ctx) {
  const { doc, W, H } = ctx;
  setF(doc, C.gray50); doc.rect(0, 0, W, H, "F");

  // Thin top accent line
  gradH(doc, 0, 0, W, 1.5, C.navy500, C.teal500, 15);

  // Subtle inner frame
  setS(doc, C.gray200); doc.setLineWidth(0.15);
  rr(doc, 10, 10, W - 20, H - 20, 3, "S");
}

// ─── Wrapped Text ───────────────────────────────────────────────────────────────
function wrappedText(ctx, text, opts = {}) {
  const { x = ctx.mx, w = ctx.cw, size = T.body, style = "normal", color = C.gray700, lh = 4.5, gap = 0 } = opts;
  const value = stripMd(text); if (!value) return;
  font(ctx.doc, size, style); setC(ctx.doc, color);
  const lines = ctx.doc.splitTextToSize(value, w);
  for (const line of lines) { ensureSpace(ctx, lh); ctx.doc.text(line, x, ctx.y); ctx.y += lh; }
  ctx.y += gap;
}

// ─── Cover Page ─────────────────────────────────────────────────────────────────
function drawCoverPage(ctx) {
  const { doc, W, H, mx } = ctx;
  drawCoverBg(ctx);

  // Brand
  const by = 40;
  font(doc, 14, "bold"); setC(doc, C.teal500); doc.text("PRANA", mx, by);
  const pw = doc.getTextWidth("PRANA");
  setC(doc, C.white); doc.text("PREDICT AI", mx + pw + 2, by);

  font(doc, T.small, "normal"); setC(doc, C.navy300);
  doc.text("AI-Powered Health Intelligence", mx, by + 7);

  // Divider line
  setS(doc, C.teal500); doc.setLineWidth(0.8); doc.line(mx, by + 14, mx + 45, by + 14);

  // Main title
  font(doc, 26, "bold"); setC(doc, C.white);
  doc.text("Health Risk", mx, by + 28);
  doc.text("Intelligence Report", mx, by + 38);

  font(doc, 10, "normal"); setC(doc, C.navy300);
  doc.text("Comprehensive Assessment & Personalized Action Plan", mx, by + 48);

  // Metadata card — clean 4-column (dark translucent navy, not white)
  const my = by + 62;
  const mh = 42;
  setF(doc, mix(C.navy900, C.navy700, 0.3));
  setS(doc, mix(C.navy600, C.navy400, 0.3)); doc.setLineWidth(0.25);
  rr(doc, mx, my, W - mx * 2, mh, 4, "FD");

  const colW = (W - mx * 2) / 4;
  setS(doc, mix(C.navy600, C.navy400, 0.4)); doc.setLineWidth(0.15);
  for (let i = 1; i < 4; i++) doc.line(mx + colW * i, my + 6, mx + colW * i, my + mh - 6);

  const meta = [
    { label: "REPORT ID", value: String(norm(ctx.report.id, "N/A")).slice(0, 8).toUpperCase() },
    { label: "DATE", value: fmtDate(ctx.report.created_at) },
    { label: "RISK LEVEL", value: riskPalette(ctx.report.risk_level).label },
    { label: "SCORE", value: `${clamp(ctx.report.risk_score, 0, 100)} / 100` },
  ];

  meta.forEach((m, i) => {
    const cx = mx + colW * i + colW / 2;
    font(doc, T.tiny, "bold"); setC(doc, C.teal500); doc.text(m.label, cx, my + 14, { align: "center" });
    font(doc, 11, "bold"); setC(doc, C.white); doc.text(m.value, cx, my + 24, { align: "center" });
  });

  // Bottom info
  const bby = H - 30;
  setS(doc, C.navy400); doc.setLineWidth(0.15); doc.line(mx, bby, W - mx, bby);
  font(doc, T.tiny, "normal"); setC(doc, C.navy300);
  doc.text("CONFIDENTIAL HEALTH DOCUMENT", mx, bby + 6);
  doc.text(fmtDateTime(ctx.report.created_at), W - mx, bby + 6, { align: "right" });
}

// ─── Page Header (inner pages) ──────────────────────────────────────────────────
function drawPageHeader(ctx) {
  const { doc, mx, cw, W } = ctx;
  const y = 14;

  setF(doc, C.gray100); setS(doc, C.gray200); doc.setLineWidth(0.2);
  rr(doc, mx, y, cw, 11, 2.5, "FD");

  // Accent bar
  setF(doc, C.navy500); rr(doc, mx, y, 2.5, 11, 1, "F");

  font(doc, 8, "bold"); setC(doc, C.navy600); doc.text("PranaPredict AI", mx + 5, y + 7);
  font(doc, 7.5, "normal"); setC(doc, C.gray500); doc.text("Health Risk Assessment", mx + 44, y + 7);

  font(doc, T.small, "normal"); setC(doc, C.gray400);
  doc.text(`ID: ${String(norm(ctx.report.id, "N/A")).slice(0, 8).toUpperCase()}`, W - mx, y + 7, { align: "right" });

  ctx.y = 30;
}

// ─── Section Title ──────────────────────────────────────────────────────────────
function sectionTitle(ctx, title, sub = "") {
  ctx.y += S.sm;
  ensureSpace(ctx, 14);
  const { doc, mx, cw } = ctx;

  setF(doc, C.navy500); rr(doc, mx, ctx.y - 5.5, 2.5, 9, 1, "F");
  font(doc, T.h2, "bold"); setC(doc, C.gray900); doc.text(title, mx + 6, ctx.y);
  if (sub) { font(doc, T.small, "normal"); setC(doc, C.gray500); doc.text(sub, mx + 6, ctx.y + 5); }

  setS(doc, C.gray200); doc.setLineWidth(0.15);
  doc.line(mx + 6, ctx.y + (sub ? 7 : 3), mx + cw, ctx.y + (sub ? 7 : 3));

  ctx.y += sub ? 12 : S.md;
}

// ─── Score Gauge ────────────────────────────────────────────────────────────────
function drawGauge(doc, cx, cy, score, pal) {
  const safe = clamp(score, 0, 100);
  const sD = 135, eD = 405;
  const aD = sD + (eD - sD) * safe / 100;
  const R = 18;

  setF(doc, alpha(pal.mid, 0.12)); doc.circle(cx, cy, R + 3, "F");
  setF(doc, C.white); doc.circle(cx, cy, R + 0.5, "F");

  drawSegArc(doc, cx, cy, R, sD, eD, C.gray200, 3, 50);
  drawGradientArc(doc, cx, cy, R, sD, aD, pal.mid, pal.strong, 3.2, 48);

  const knob = polar(cx, cy, R, aD);
  setF(doc, C.white); doc.circle(knob.x, knob.y, 2.2, "F");
  setF(doc, pal.strong); doc.circle(knob.x, knob.y, 1.4, "F");

  setF(doc, C.white); doc.circle(cx, cy, R - 5, "F");
  font(doc, 16, "bold"); setC(doc, C.gray900); doc.text(String(safe), cx, cy + 2, { align: "center" });
  font(doc, T.tiny, "normal"); setC(doc, C.gray500); doc.text("of 100", cx, cy + 7, { align: "center" });
}

// ─── Risk Overview ──────────────────────────────────────────────────────────────
function drawRiskOverview(ctx) {
  sectionTitle(ctx, "Risk Overview", "AI-computed health risk assessment");

  const { doc, mx, cw } = ctx;
  const score = clamp(ctx.report.risk_score, 0, 100);
  const pal = riskPalette(ctx.report.risk_level);

  ensureSpace(ctx, 68);
  const cy = ctx.y;

  panel(doc, mx, cy, cw, 60, { bg: C.white, border: C.gray200, radius: 5 });

  // Left accent
  setF(doc, pal.strong); rr(doc, mx, cy, 3, 60, 1.5, "F");

  // Gauge
  drawGauge(doc, mx + 32, cy + 30, score, pal);

  // Right content
  const rx = mx + 60;
  font(doc, T.small, "bold"); setC(doc, C.gray500); doc.text("RISK ASSESSMENT", rx, cy + 10);
  font(doc, 18, "bold"); setC(doc, pal.strong); doc.text(pal.label, rx, cy + 20);
  font(doc, T.body, "normal"); setC(doc, C.gray600);
  const desc = doc.splitTextToSize("Based on your health data, lifestyle factors, pre-existing conditions, and biometric analysis.", cw - 66);
  desc.forEach((l, i) => doc.text(l, rx, cy + 27 + i * 4));

  // Quick pills
  const py = cy + 41;
  const pills = [
    `Age: ${norm(ctx.report.age)}`, `BMI: ${norm(ctx.report.bmi)}`,
    `BP: ${norm(ctx.report.blood_pressure)}`, `Smoking: ${yn(ctx.report.smoking)}`
  ];
  let px = rx;
  pills.forEach(p => {
    font(doc, 7, "bold"); const tw = doc.getTextWidth(p); const pw = tw + 6;
    setF(doc, alpha(C.navy500, 0.08)); rr(doc, px, py, pw, 7, 3, "F");
    setC(doc, C.navy600); doc.text(p, px + 3, py + 4.8);
    px += pw + 3;
  });

  ctx.y = cy + 66;
}

// ─── Risk Factor Breakdown (NEW — fixes issue #1 and #4) ───────────────────────
function drawRiskBreakdown(ctx) {
  sectionTitle(ctx, "Risk Factor Breakdown", "Why your score is what it is");

  const { doc, mx, cw } = ctx;
  const bd = computeBreakdown(ctx.report);

  ensureSpace(ctx, 44);
  const cy = ctx.y;

  panel(doc, mx, cy, cw, 38, { bg: C.white, border: C.gray200, radius: 4 });

  // Stacked horizontal bar
  const barX = mx + 5, barY = cy + 6, barW = cw - 10, barH = 8;
  const categories = [
    { key: "conditions", label: "Conditions", color: C.red500 },
    { key: "vitals", label: "Vitals", color: C.amber500 },
    { key: "lifestyle", label: "Lifestyle", color: C.navy500 },
    { key: "age", label: "Age", color: C.teal500 },
  ];

  // Background bar
  setF(doc, C.gray100); rr(doc, barX, barY, barW, barH, 4, "F");

  // Stacked fills
  let offsetX = barX;
  categories.forEach(cat => {
    const pct = bd[cat.key]?.pct || 0;
    const segW = barW * pct / 100;
    if (segW > 0.5) {
      setF(doc, cat.color); rr(doc, offsetX, barY, segW, barH, 0, "F");
      offsetX += segW;
    }
  });

  // Round the ends
  setF(doc, C.gray100); rr(doc, barX, barY, barW, barH, 4, "S");

  // Legend below bar
  const legY = barY + barH + 5;
  const legW = cw / 4;

  categories.forEach((cat, i) => {
    const lx = mx + 5 + i * legW;
    const pct = bd[cat.key]?.pct || 0;
    const pts = bd[cat.key]?.score || 0;

    setF(doc, cat.color); doc.circle(lx + 2, legY + 1, 1.5, "F");
    font(doc, 7.5, "bold"); setC(doc, C.gray800); doc.text(cat.label, lx + 5, legY + 2.5);
    font(doc, T.tiny, "normal"); setC(doc, C.gray500); doc.text(`${pct}% (${pts} pts)`, lx + 5, legY + 7);
  });

  // Explanation note
  font(doc, T.small, "normal"); setC(doc, C.gray500);
  doc.text("This breakdown shows how much each category contributes to your overall risk score.", mx + 5, legY + 14);

  ctx.y = cy + 44;
}

// ─── Health Metrics Grid ────────────────────────────────────────────────────────
function metricStatus(label, value) {
  if (label === "BMI") { const n = parseFloat(value); if (!isFinite(n)) return "neutral"; if (n < 18.5 || n >= 30) return "danger"; if (n >= 25) return "warning"; return "success"; }
  if (label === "Smoking") return String(value).toLowerCase() === "yes" ? "danger" : "success";
  if (label === "Activity") { const v = String(value).toLowerCase(); if (v.includes("low")) return "danger"; if (v.includes("moderate")) return "warning"; return "success"; }
  return "neutral";
}

function statusColor(s) { return s === "success" ? C.green600 : s === "warning" ? C.amber600 : s === "danger" ? C.red600 : C.navy500; }

function drawHealthMetrics(ctx) {
  sectionTitle(ctx, "Key Health Metrics");

  const metrics = [
    { label: "Age", value: `${norm(ctx.report.age)} yrs` },
    { label: "BMI", value: String(norm(ctx.report.bmi)) },
    { label: "Blood Pressure", value: norm(ctx.report.blood_pressure) },
    { label: "Cholesterol", value: title(ctx.report.cholesterol) },
    { label: "Smoking", value: yn(ctx.report.smoking) },
    { label: "Activity", value: title(ctx.report.activity_level) },
  ];

  const cols = 3, gap = S.sm, cardH = 20;
  const cardW = (ctx.cw - gap * (cols - 1)) / cols;

  for (let i = 0; i < metrics.length; i += cols) {
    const row = metrics.slice(i, i + cols);
    ensureSpace(ctx, cardH + gap + 2);
    const y = ctx.y;

    row.forEach((m, ci) => {
      const x = ctx.mx + ci * (cardW + gap);
      const st = metricStatus(m.label, m.value);
      const sc = statusColor(st);

      panel(ctx.doc, x, y, cardW, cardH, { bg: C.white, border: C.gray200, radius: 3, shadow: true });
      setF(ctx.doc, sc); rr(ctx.doc, x, y, cardW, 1.8, 0, "F");

      font(ctx.doc, T.small, "normal"); setC(ctx.doc, C.gray500); ctx.doc.text(m.label, x + 3, y + 8);
      font(ctx.doc, 10.5, "bold"); setC(ctx.doc, C.gray900);

      const dv = String(norm(m.value));
      ctx.doc.text(dv.length > 14 ? dv.slice(0, 13) + "\u2026" : dv, x + 3, y + 15.5);
    });

    ctx.y += cardH + gap;
  }
  ctx.y += 2;
}

// ─── Lifestyle Table ────────────────────────────────────────────────────────────
function drawLifestyle(ctx) {
  sectionTitle(ctx, "Lifestyle Profile");

  const data = [
    ["Location", title(ctx.report.location)],
    ["Work Type", title(ctx.report.work_type)],
    ["Diet Type", title(ctx.report.diet_type)],
    ["Alcohol", title(ctx.report.alcohol_consumption)],
    ["Water Intake", ctx.report.water_intake != null ? `${ctx.report.water_intake} L/day` : "N/A"],
    ["Sleep Duration", ctx.report.sleep_duration != null ? `${ctx.report.sleep_duration} hrs/day` : "N/A"],
  ];

  ensureSpace(ctx, 8);

  autoTable(ctx.doc, {
    startY: ctx.y,
    margin: { left: ctx.mx, right: ctx.mx },
    head: [["Parameter", "Value"]],
    body: data,
    theme: "plain",
    styles: { font: "helvetica", fontSize: T.body, cellPadding: { top: 3, bottom: 3, left: 4, right: 4 }, lineColor: C.gray200, lineWidth: 0.15, textColor: C.gray700 },
    headStyles: { fillColor: C.navy700, textColor: C.white, fontStyle: "bold", fontSize: 8.5 },
    alternateRowStyles: { fillColor: C.gray50 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 50, textColor: C.gray800 } },
  });

  ctx.y = ctx.doc.lastAutoTable.finalY + S.md;
}

// ─── Pre-existing Conditions ────────────────────────────────────────────────────
function drawConditions(ctx) {
  sectionTitle(ctx, "Pre-existing Conditions");

  const conds = [
    { label: "Diabetes", active: Boolean(ctx.report.diabetes) },
    { label: "Hypertension", active: Boolean(ctx.report.hypertension) },
    { label: "Heart Disease", active: Boolean(ctx.report.heart_disease) },
    { label: "Kidney Disease", active: Boolean(ctx.report.kidney_disease) },
  ];

  ensureSpace(ctx, 18);
  const { doc, mx, cw } = ctx;
  panel(doc, mx, ctx.y, cw, 14, { bg: C.white, border: C.gray200, radius: 3, shadow: false });

  const segW = cw / conds.length;
  conds.forEach((c, i) => {
    const x = mx + i * segW, cx = x + segW / 2;
    if (i > 0) { setS(doc, C.gray200); doc.setLineWidth(0.15); doc.line(x, ctx.y + 2, x, ctx.y + 12); }

    const dc = c.active ? C.red500 : C.green600;
    setF(doc, alpha(dc, 0.1)); doc.circle(cx - 10, ctx.y + 7, 2.5, "F");
    setF(doc, dc); doc.circle(cx - 10, ctx.y + 7, 1.2, "F");

    font(doc, 8, "bold"); setC(doc, C.gray900); doc.text(c.label, cx - 6, ctx.y + 6);
    font(doc, T.tiny, "normal"); setC(doc, dc); doc.text(c.active ? "Detected" : "Clear", cx - 6, ctx.y + 10.5);
  });

  ctx.y += 20;
}

// ─── AI Explainability Section (NEW — fixes issue #2, #12) ──────────────────────
function drawExplainability(ctx) {
  sectionTitle(ctx, "How This Score Is Computed", "AI model transparency & methodology");

  const { doc, mx, cw } = ctx;
  ensureSpace(ctx, 38);
  const cy = ctx.y;

  panel(doc, mx, cy, cw, 32, { bg: C.navy100, border: C.navy200, radius: 4, shadow: false });
  setF(doc, C.navy500); rr(doc, mx, cy, 2.5, 32, 1, "F");

  const items = [
    "Data Inputs: Age, BMI, blood pressure, cholesterol, medical history, lifestyle factors (16 parameters)",
    "Model: Rule-based risk scoring + Qwen 2.5 AI language model for personalized analysis",
    "Score Calculation: Weighted sum across 4 categories — conditions, vitals, lifestyle, and age",
    "Guidelines: Analysis framework aligned with WHO cardiovascular risk assessment and CDC preventive health guidelines",
    "Limitations: This is a screening tool, not a diagnostic instrument. Individual scores may not capture all nuances of personal health. Always validate with a licensed physician.",
  ];

  let iy = cy + 7;
  items.forEach(item => {
    const [label, ...rest] = item.split(": ");
    font(doc, T.small, "bold"); setC(doc, C.navy700); doc.text(label + ":", mx + 6, iy);
    const lw = doc.getTextWidth(label + ": ");
    font(doc, T.small, "normal"); setC(doc, C.gray700);
    const lines = doc.splitTextToSize(rest.join(": "), cw - 12 - lw);
    if (lines.length === 1) {
      doc.text(lines[0], mx + 6 + lw, iy);
    } else {
      doc.text(lines[0], mx + 6 + lw, iy);
      for (let li = 1; li < lines.length; li++) {
        iy += 4;
        doc.text(lines[li], mx + 6, iy);
      }
    }
    iy += 5;
  });

  ctx.y = cy + 38;
}

// ─── AI Health Advice (structured sections) ─────────────────────────────────────
function drawAdvice(ctx) {
  sectionTitle(ctx, "AI Health Advice", "Personalized recommendations from AI analysis");

  const { sections, sectionOrder } = parseAdviceSections(ctx.report.llm_advice);
  const { doc, mx, cw } = ctx;

  if (!sectionOrder.length) {
    // Fallback: render raw advice as simple text
    const rawLines = String(ctx.report.llm_advice || "No advice available.").split(/\r?\n/);
    for (const line of rawLines) {
      const stripped = stripMd(line.trim());
      if (!stripped) { ctx.y += 2; continue; }
      if (line.trim().startsWith("#")) {
        ensureSpace(ctx, 10);
        font(doc, T.h3, "bold"); setC(doc, C.navy600); doc.text(stripped, mx, ctx.y); ctx.y += 6;
      } else if (/^[-*•]/.test(line.trim()) || /^\d+\./.test(line.trim())) {
        wrappedText(ctx, `\u2022 ${stripped.replace(/^[-*•]\s*/, "").replace(/^\d+\.\s*/, "")}`, { x: mx + 4, w: cw - 8, color: C.gray700, lh: 4.5 });
        ctx.y += 1;
      } else {
        wrappedText(ctx, stripped, { color: C.gray700, lh: 4.5, gap: 1 });
      }
    }
    return;
  }

  // Color rotation for section headings
  const headColors = [C.navy600, C.teal600, C.amber600, C.navy500, C.teal500, C.green600, C.red600];
  let hci = 0;

  for (const heading of sectionOrder) {
    const body = sections[heading];
    if (!body) continue;

    ensureSpace(ctx, 12);
    const hc = headColors[hci % headColors.length]; hci++;

    // Section heading bar
    setF(doc, alpha(hc, 0.06)); rr(doc, mx, ctx.y - 5, cw, 9, 2.5, "F");
    setF(doc, hc); rr(doc, mx, ctx.y - 5, 2.5, 9, 1, "F");
    font(doc, T.h3, "bold"); setC(doc, hc); doc.text(heading, mx + 6, ctx.y);
    ctx.y += 7;

    // Parse items within the section
    const lines = body.split(/\r?\n/);
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) { ctx.y += 1.5; continue; }

      const stripped = stripMd(line);
      if (!stripped) continue;

      // Bold field detection (e.g., "- **Risk Name**: value")
      const boldField = /^\-?\s*\*\*(.+?)\*\*:\s*(.+)$/.exec(line);
      if (boldField) {
        const label = stripMd(boldField[1]);
        const value = stripMd(boldField[2]);
        ensureSpace(ctx, 5);
        font(doc, T.body, "bold"); setC(doc, C.gray800);
        doc.text(`${label}:`, mx + 6, ctx.y);
        const lw = doc.getTextWidth(`${label}: `);
        font(doc, T.body, "normal"); setC(doc, C.gray700);
        const valLines = doc.splitTextToSize(value, cw - 10 - lw);
        if (valLines.length <= 1) {
          doc.text(value, mx + 6 + lw, ctx.y);
          ctx.y += 4.5;
        } else {
          doc.text(valLines[0], mx + 6 + lw, ctx.y);
          ctx.y += 4.5;
          for (let vi = 1; vi < valLines.length; vi++) {
            ensureSpace(ctx, 4.5);
            doc.text(valLines[vi], mx + 6, ctx.y);
            ctx.y += 4.5;
          }
        }
        continue;
      }

      // Bullet or numbered item
      if (/^[-*•]/.test(line) || /^\d+\./.test(line)) {
        const clean = stripped.replace(/^[-*•]\s*/, "").replace(/^\d+\.\s*/, "");
        ensureSpace(ctx, 5);
        font(doc, T.body, "normal"); setC(doc, C.navy500); doc.text("\u2022", mx + 4, ctx.y);
        setC(doc, C.gray700);
        const bLines = doc.splitTextToSize(clean, cw - 12);
        for (const bl of bLines) { doc.text(bl, mx + 8, ctx.y); ctx.y += 4.5; }
        continue;
      }

      // Week labels in action plan (e.g., "Week 1: ...")
      const weekMatch = /^(Week \d+):?\s*(.*)$/i.exec(stripped);
      if (weekMatch) {
        ensureSpace(ctx, 6);
        font(doc, T.body, "bold"); setC(doc, C.teal600);
        doc.text(weekMatch[1] + ":", mx + 4, ctx.y);
        font(doc, T.body, "normal"); setC(doc, C.gray700);
        const wl = doc.splitTextToSize(weekMatch[2], cw - 28);
        doc.text(wl[0] || "", mx + 24, ctx.y);
        ctx.y += 4.5;
        for (let wi = 1; wi < wl.length; wi++) { doc.text(wl[wi], mx + 8, ctx.y); ctx.y += 4.5; }
        continue;
      }

      // Regular paragraph
      wrappedText(ctx, stripped, { x: mx + 4, w: cw - 8, color: C.gray700, lh: 4.5 });
      ctx.y += 1;
    }

    ctx.y += 3;
  }
}

// ─── Call-to-Action (NEW — fixes issue #13) ─────────────────────────────────────
function drawCallToAction(ctx) {
  sectionTitle(ctx, "Next Steps", "Your immediate action items");

  const { doc, mx, cw } = ctx;
  ensureSpace(ctx, 38);
  const cy = ctx.y;

  panel(doc, mx, cy, cw, 32, { bg: C.white, border: C.gray200, radius: 4 });
  setF(doc, C.teal500); rr(doc, mx, cy, 3, 32, 1.5, "F");

  const steps = [
    { icon: "1", title: "Consult a Doctor", desc: "Schedule a comprehensive health checkup within the next 30 days. Share this report with your physician." },
    { icon: "2", title: "Start Your Action Plan", desc: "Begin implementing the 30-Day Action Plan from this report today. Focus on Week 1 goals first." },
    { icon: "3", title: "Re-evaluate in 60 Days", desc: "Generate a new PranaPredict report after 60 days to track improvement and adjust your plan." },
  ];

  let sy = cy + 5;
  steps.forEach(s => {
    // Number circle
    setF(doc, C.navy500); doc.circle(mx + 10, sy + 3.5, 3.5, "F");
    font(doc, 9, "bold"); setC(doc, C.white); doc.text(s.icon, mx + 10, sy + 5, { align: "center" });

    // Title & desc
    font(doc, T.body, "bold"); setC(doc, C.gray900); doc.text(s.title, mx + 17, sy + 3);
    font(doc, T.small, "normal"); setC(doc, C.gray600);
    const lines = doc.splitTextToSize(s.desc, cw - 24);
    lines.forEach((l, i) => doc.text(l, mx + 17, sy + 7 + i * 3.5));
    sy += 10;
  });

  ctx.y = cy + 38;
}

// ─── Disclaimer ─────────────────────────────────────────────────────────────────
function drawDisclaimer(ctx) {
  ensureSpace(ctx, 22);
  const { doc, mx, cw } = ctx;

  panel(doc, mx, ctx.y, cw, 16, { bg: C.amber100, border: alpha(C.amber500, 0.25), radius: 3, shadow: false });
  setF(doc, C.amber500); rr(doc, mx, ctx.y, 2.5, 16, 1, "F");

  font(doc, T.h3, "bold"); setC(doc, C.gray900); doc.text("Clinical Disclaimer", mx + 6, ctx.y + 6);
  font(doc, T.small, "normal"); setC(doc, C.gray700);
  doc.text("This report is generated by AI for informational purposes only and does not constitute medical advice, diagnosis, or treatment.", mx + 6, ctx.y + 10.5);
  doc.text("Always consult qualified healthcare professionals for medical decisions. Do not delay seeking care based on this report.", mx + 6, ctx.y + 14);

  ctx.y += 22;
}

// ─── Footers ────────────────────────────────────────────────────────────────────
function applyFooters(ctx) {
  const { doc, W, H, mx } = ctx;
  const total = doc.getNumberOfPages();

  for (let p = 2; p <= total; p++) {
    doc.setPage(p);
    const fy = H - 12;

    setS(doc, C.gray300); doc.setLineWidth(0.15); doc.line(mx, fy - 2.5, W - mx, fy - 2.5);

    font(doc, T.tiny, "normal"); setC(doc, C.gray400);
    doc.text("PranaPredict AI  \u2022  Confidential  \u2022  Not a Medical Diagnosis", mx, fy);

    // Page pill
    const pt = `${p - 1} / ${total - 1}`;
    font(doc, T.tiny, "bold"); const ptw = doc.getTextWidth(pt);
    setF(doc, C.gray100); setS(doc, C.gray300); doc.setLineWidth(0.12);
    rr(doc, W - mx - ptw - 5, fy - 3.5, ptw + 5, 6, 3, "FD");
    setC(doc, C.gray600); doc.text(pt, W - mx - 2.5, fy, { align: "right" });
  }
}

// ─── Main Export ────────────────────────────────────────────────────────────────
export function generateHealthReportPdf(report) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const ctx = createCtx(doc, report || {});

  // Page 1: Cover
  drawCoverPage(ctx);

  // Page 2+: Content (clear visual flow — no redundancy)
  newPage(ctx);

  // 1. Risk Overview (score shown ONCE prominently here)
  drawRiskOverview(ctx);

  // 2. Risk Breakdown (explains WHY the score is what it is)
  drawRiskBreakdown(ctx);

  // 3. Health Metrics
  drawHealthMetrics(ctx);

  // 4. Lifestyle Profile
  drawLifestyle(ctx);

  // 5. Pre-existing Conditions
  drawConditions(ctx);

  // 6. AI Explainability
  drawExplainability(ctx);

  // 7. AI Health Advice (structured sections — parsed from LLM)
  drawAdvice(ctx);

  // 8. Call-to-Action
  drawCallToAction(ctx);

  // 9. Clinical Disclaimer
  drawDisclaimer(ctx);

  // Footers
  applyFooters(ctx);

  // Save
  const date = report?.created_at ? new Date(report.created_at).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
  const risk = String(norm(report?.risk_level, "Report")).replace(/\s+/g, "");
  doc.save(`PranaPredict_Report_${risk}_${date}.pdf`);
}