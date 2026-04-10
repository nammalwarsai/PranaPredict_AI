import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// ─── Premium Design Tokens ──────────────────────────────────────────────────────
const C = {
  // Primary brand – deep navy to electric blue gradient spectrum
  brand950: [8, 24, 48],
  brand900: [12, 35, 62],
  brand800: [16, 50, 88],
  brand700: [22, 70, 120],
  brand600: [30, 95, 160],
  brand500: [42, 120, 195],
  brand400: [80, 155, 215],
  brand300: [130, 185, 230],
  brand200: [180, 215, 242],
  brand100: [220, 236, 250],

  // Accent – warm amber / gold
  accent600: [217, 119, 6],
  accent500: [245, 158, 11],
  accent400: [251, 191, 36],
  accent300: [252, 211, 77],
  accent200: [254, 240, 138],
  accent100: [255, 251, 235],

  // Teal accent – for secondary highlights
  teal600: [13, 148, 136],
  teal500: [20, 184, 166],
  teal400: [45, 212, 191],
  teal100: [204, 251, 241],

  // Success
  success600: [22, 163, 74],
  success500: [34, 197, 94],
  success400: [74, 222, 128],
  success100: [220, 252, 231],

  // Warning
  warning600: [202, 138, 4],
  warning500: [234, 179, 8],
  warning400: [250, 204, 21],
  warning100: [254, 249, 195],

  // Danger
  danger600: [220, 38, 38],
  danger500: [239, 68, 68],
  danger400: [248, 113, 113],
  danger100: [254, 226, 226],

  // Neutral surfaces
  surface0: [255, 255, 255],
  surface50: [248, 250, 252],
  surface100: [241, 245, 249],
  surface200: [226, 232, 240],
  surface300: [203, 213, 225],
  surface400: [148, 163, 184],

  // Text
  text950: [15, 23, 42],
  text900: [30, 41, 59],
  text800: [51, 65, 85],
  text700: [71, 85, 105],
  text600: [100, 116, 139],
  text500: [148, 163, 184],
  text400: [203, 213, 225],

  white: [255, 255, 255],
  black: [0, 0, 0],
};

// ─── Utility Helpers ────────────────────────────────────────────────────────────
function clamp(value, min, max) {
  const n = Number(value);
  if (!isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function normalizeValue(value, fallback = "N/A") {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string" && value.trim() === "") return fallback;
  return value;
}

function titleCase(value) {
  const text = String(normalizeValue(value, "N/A")).replace(/[_-]/g, " ");
  if (text === "N/A") return text;
  return text
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function yesNo(value) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "N/A";
}

function formatDateTime(value) {
  if (!value) return "N/A";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "N/A";
  return d
    .toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .replace(",", " at");
}

function formatDate(value) {
  if (!value) return "N/A";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function stripMarkdown(text) {
  return String(text || "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .trim();
}

function parseAdviceBlocks(advice) {
  const lines = String(advice || "").split(/\r?\n/);
  const blocks = [];
  let paragraphBuffer = [];

  const flushParagraph = () => {
    if (!paragraphBuffer.length) return;
    blocks.push({ type: "paragraph", text: stripMarkdown(paragraphBuffer.join(" ")) });
    paragraphBuffer = [];
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushParagraph();
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      flushParagraph();
      blocks.push({ type: "heading", level: heading[1].length, text: stripMarkdown(heading[2]) });
      continue;
    }

    const numbered = /^(\d+)\.\s+(.*)$/.exec(line);
    if (numbered) {
      flushParagraph();
      blocks.push({ type: "list", marker: `${numbered[1]}.`, text: stripMarkdown(numbered[2]) });
      continue;
    }

    const bullets = /^[-*]\s+(.*)$/.exec(line);
    if (bullets) {
      flushParagraph();
      blocks.push({ type: "list", marker: "•", text: stripMarkdown(bullets[1]) });
      continue;
    }

    paragraphBuffer.push(line);
  }

  flushParagraph();
  return blocks;
}

// ─── Color & Drawing Primitives ─────────────────────────────────────────────────
function mix(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function alpha(color, opacity) {
  return mix(color, C.white, 1 - opacity);
}

function riskPalette(level) {
  const text = String(normalizeValue(level, "Moderate")).toLowerCase();
  if (text.includes("high")) {
    return {
      strong: C.danger600,
      mid: C.danger400,
      soft: C.danger100,
      label: "High Risk",
      emoji: "▲",
    };
  }
  if (text.includes("moderate")) {
    return {
      strong: C.accent600,
      mid: C.accent400,
      soft: C.accent100,
      label: "Moderate Risk",
      emoji: "◆",
    };
  }
  return {
    strong: C.success600,
    mid: C.success400,
    soft: C.success100,
    label: "Low Risk",
    emoji: "●",
  };
}

const rgb = (doc, c) => doc.setTextColor(c[0], c[1], c[2]);
const fill = (doc, c) => doc.setFillColor(c[0], c[1], c[2]);
const stroke = (doc, c) => doc.setDrawColor(c[0], c[1], c[2]);

function font(doc, size, style = "normal", family = "helvetica") {
  doc.setFont(family, style);
  doc.setFontSize(size);
}

function roundRect(doc, x, y, w, h, r, mode = "F") {
  if (r > 0) {
    doc.roundedRect(x, y, w, h, r, r, mode);
  } else {
    doc.rect(x, y, w, h, mode);
  }
}

// Vertical gradient fill
function gradientV(doc, x, y, w, h, top, bottom, steps = 40) {
  const slice = h / steps;
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    fill(doc, mix(top, bottom, t));
    doc.rect(x, y + i * slice, w, slice + 0.4, "F");
  }
}

// Horizontal gradient fill
function gradientH(doc, x, y, w, h, left, right, steps = 40) {
  const slice = w / steps;
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    fill(doc, mix(left, right, t));
    doc.rect(x + i * slice, y, slice + 0.4, h, "F");
  }
}

// Premium panel with soft shadow
function panel(doc, x, y, w, h, opts = {}) {
  const {
    bg = C.surface0,
    border = C.surface200,
    radius = 5,
    shadow = true,
    shadowOffset = 1,
    shadowColor = [210, 218, 230],
  } = opts;

  if (shadow) {
    fill(doc, shadowColor);
    roundRect(doc, x + shadowOffset, y + shadowOffset, w, h, radius, "F");
  }

  fill(doc, bg);
  stroke(doc, border);
  doc.setLineWidth(0.3);
  roundRect(doc, x, y, w, h, radius, "FD");
}

// Decorative dots pattern
function drawDotPattern(doc, x, y, cols, rows, spacing, color, radius = 0.5) {
  fill(doc, color);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      doc.circle(x + c * spacing, y + r * spacing, radius, "F");
    }
  }
}

// Decorative diagonal lines
function drawDiagonalLines(doc, x, y, w, h, color, spacing = 4) {
  stroke(doc, color);
  doc.setLineWidth(0.15);
  for (let i = -h; i < w; i += spacing) {
    const x1 = Math.max(x, x + i);
    const y1 = Math.max(y, y - i);
    const x2 = Math.min(x + w, x + i + h);
    const y2 = Math.min(y + h, y + h - (i + h - w));
    doc.line(x1, y1, x2, y + Math.min(h, i + h < w ? h : w - i));
  }
}

// Polar coordinate helper
function polar(cx, cy, radius, deg) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + Math.cos(rad) * radius, y: cy + Math.sin(rad) * radius };
}

// ─── Arc Drawing (improved) ─────────────────────────────────────────────────────
function drawArc(doc, cx, cy, r, startDeg, endDeg, color, width, segments = 64) {
  const span = endDeg - startDeg;
  if (span <= 0) return;
  stroke(doc, color);
  doc.setLineWidth(width);
  const step = span / segments;
  for (let i = 0; i < segments; i++) {
    const a1 = startDeg + i * step;
    const a2 = a1 + step;
    const p1 = polar(cx, cy, r, a1);
    const p2 = polar(cx, cy, r, a2);
    doc.line(p1.x, p1.y, p2.x, p2.y);
  }
}

// Gradient arc
function drawGradientArc(doc, cx, cy, r, startDeg, endDeg, fromColor, toColor, width, segments = 64) {
  const span = endDeg - startDeg;
  if (span <= 0) return;
  const step = span / segments;
  doc.setLineWidth(width);
  for (let i = 0; i < segments; i++) {
    const t = i / segments;
    const a1 = startDeg + i * step;
    const a2 = a1 + step;
    const p1 = polar(cx, cy, r, a1);
    const p2 = polar(cx, cy, r, a2);
    stroke(doc, mix(fromColor, toColor, t));
    doc.line(p1.x, p1.y, p2.x, p2.y);
  }
}

// Segmented (dashed) arc
function drawSegmentedArc(doc, cx, cy, r, startDeg, endDeg, color, width, segments = 48) {
  const span = endDeg - startDeg;
  if (span <= 0) return;
  const step = span / segments;
  doc.setLineWidth(width);
  stroke(doc, color);
  for (let i = 0; i < segments; i++) {
    const a1 = startDeg + i * step;
    const a2 = a1 + step * 0.72;
    const p1 = polar(cx, cy, r, a1);
    const p2 = polar(cx, cy, r, a2);
    doc.line(p1.x, p1.y, p2.x, p2.y);
  }
}

// ─── Context Manager ────────────────────────────────────────────────────────────
function createCtx(doc, report) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const mx = 18;
  return {
    doc,
    report,
    W,
    H,
    mx,
    cw: W - mx * 2,
    bottomLimit: H - 18,
    y: 18,
    pageNum: 1,
  };
}

function ensureSpace(ctx, needed) {
  if (ctx.y + needed <= ctx.bottomLimit) return;
  newPage(ctx);
}

function newPage(ctx) {
  ctx.doc.addPage();
  ctx.pageNum++;
  drawInnerPageBg(ctx);
  drawCompactHeader(ctx);
}

// ─── Page Backgrounds ───────────────────────────────────────────────────────────
function drawCoverBg(ctx) {
  const { doc, W, H } = ctx;

  // Full-page deep gradient
  gradientV(doc, 0, 0, W, H, C.brand950, C.brand800, 60);

  // Large decorative circle – top right
  fill(doc, alpha(C.brand500, 0.08));
  doc.circle(W + 10, -20, 90, "F");

  // Medium circle – bottom left
  fill(doc, alpha(C.teal500, 0.06));
  doc.circle(-30, H + 10, 75, "F");

  // Small accent circle
  fill(doc, alpha(C.accent400, 0.07));
  doc.circle(W - 40, H - 50, 35, "F");

  // Dot grid decoration – top-left
  drawDotPattern(doc, 20, 20, 6, 6, 5, alpha(C.white, 0.06), 0.6);

  // Dot grid decoration – bottom-right
  drawDotPattern(doc, W - 55, H - 55, 6, 6, 5, alpha(C.white, 0.04), 0.5);

  // Thin horizontal accent lines
  stroke(doc, alpha(C.brand400, 0.1));
  doc.setLineWidth(0.15);
  for (let i = 0; i < 5; i++) {
    const lineY = 70 + i * 8;
    doc.line(W - 60, lineY, W - 20, lineY);
  }
}

function drawInnerPageBg(ctx) {
  const { doc, W, H } = ctx;

  // Soft off-white base
  fill(doc, C.surface50);
  doc.rect(0, 0, W, H, "F");

  // Subtle top gradient strip
  gradientV(doc, 0, 0, W, 6, C.brand100, C.surface50, 12);

  // Inner content frame with very faint border
  stroke(doc, C.surface200);
  doc.setLineWidth(0.2);
  roundRect(doc, 10, 10, W - 20, H - 20, 4, "S");

  // Corner decorations – small L-shaped brackets
  const cornerLen = 8;
  stroke(doc, C.brand300);
  doc.setLineWidth(0.4);

  // Top-left
  doc.line(10, 10, 10 + cornerLen, 10);
  doc.line(10, 10, 10, 10 + cornerLen);

  // Top-right
  doc.line(W - 10, 10, W - 10 - cornerLen, 10);
  doc.line(W - 10, 10, W - 10, 10 + cornerLen);

  // Bottom-left
  doc.line(10, H - 10, 10 + cornerLen, H - 10);
  doc.line(10, H - 10, 10, H - 10 - cornerLen);

  // Bottom-right
  doc.line(W - 10, H - 10, W - 10 - cornerLen, H - 10);
  doc.line(W - 10, H - 10, W - 10, H - 10 - cornerLen);
}

// ─── Wrapped Text Helper ────────────────────────────────────────────────────────
function wrappedText(ctx, text, opts = {}) {
  const {
    x = ctx.mx,
    width = ctx.cw,
    size = 9.5,
    style = "normal",
    color = C.text700,
    lineHeight = 4.8,
    gapAfter = 0,
    align = "left",
  } = opts;

  const value = stripMarkdown(text);
  if (!value) return;

  font(ctx.doc, size, style);
  rgb(ctx.doc, color);
  const lines = ctx.doc.splitTextToSize(value, width);

  for (const line of lines) {
    ensureSpace(ctx, lineHeight);
    ctx.doc.text(line, x, ctx.y, { align });
    ctx.y += lineHeight;
  }

  ctx.y += gapAfter;
}

// ─── Cover Page Hero ────────────────────────────────────────────────────────────
function drawCoverPage(ctx) {
  const { doc, W, H, mx } = ctx;

  drawCoverBg(ctx);

  // ── Accent stripe at the very top ──
  gradientH(doc, 0, 0, W, 3, C.accent500, C.teal500, 20);

  // ── Brand badge ──
  const badgeY = 38;
  fill(doc, alpha(C.white, 0.08));
  roundRect(doc, mx, badgeY, 130, 28, 6, "F");

  // Orange left accent
  fill(doc, C.accent500);
  roundRect(doc, mx, badgeY, 4, 28, 2, "F");
  doc.rect(mx + 2, badgeY, 2, 28, "F");

  // Brand name
  font(doc, 13, "bold");
  rgb(doc, C.accent400);
  doc.text("PRANA", mx + 10, badgeY + 11);
  const pw = doc.getTextWidth("PRANA");
  rgb(doc, C.white);
  doc.text("PREDICT", mx + 10 + pw + 1.5, badgeY + 11);
  const pw2 = doc.getTextWidth("PREDICT");
  rgb(doc, C.brand300);
  doc.text("AI", mx + 10 + pw + pw2 + 3, badgeY + 11);

  // Tagline
  font(doc, 8.5, "normal");
  rgb(doc, alpha(C.white, 0.5));
  doc.text("Advanced AI-Powered Health Intelligence Platform", mx + 10, badgeY + 19);

  // ── Main title block ──
  const titleY = 92;

  // Decorative line before title
  stroke(doc, C.accent500);
  doc.setLineWidth(1);
  doc.line(mx, titleY - 8, mx + 42, titleY - 8);
  stroke(doc, C.teal400);
  doc.setLineWidth(0.5);
  doc.line(mx + 44, titleY - 8, mx + 64, titleY - 8);

  font(doc, 28, "bold");
  rgb(doc, C.white);
  doc.text("Health Risk", mx, titleY + 4);
  doc.text("Intelligence Report", mx, titleY + 16);

  // Subtitle
  font(doc, 11, "normal");
  rgb(doc, alpha(C.white, 0.55));
  doc.text("Comprehensive AI-Generated Health Assessment & Personalized Recommendations", mx, titleY + 28);

  // ── Report metadata card ──
  const metaY = titleY + 44;
  const metaH = 52;

  fill(doc, alpha(C.white, 0.06));
  stroke(doc, alpha(C.white, 0.1));
  doc.setLineWidth(0.3);
  roundRect(doc, mx, metaY, W - mx * 2, metaH, 5, "FD");

  // Inner dividers
  const colW = (W - mx * 2) / 4;
  stroke(doc, alpha(C.white, 0.08));
  doc.setLineWidth(0.2);
  for (let i = 1; i < 4; i++) {
    doc.line(mx + colW * i, metaY + 8, mx + colW * i, metaY + metaH - 8);
  }

  const metaItems = [
    { label: "REPORT ID", value: String(normalizeValue(ctx.report.id, "N/A")).slice(0, 8).toUpperCase() },
    { label: "GENERATED ON", value: formatDate(ctx.report.created_at) },
    { label: "RISK ASSESSMENT", value: riskPalette(ctx.report.risk_level).label },
    { label: "CONFIDENCE", value: "AI Model v2.0" },
  ];

  metaItems.forEach((item, i) => {
    const itemX = mx + colW * i + colW / 2;

    // Label
    font(doc, 7, "bold");
    rgb(doc, C.accent400);
    doc.text(item.label, itemX, metaY + 16, { align: "center" });

    // Value
    font(doc, 11, "bold");
    rgb(doc, C.white);
    doc.text(item.value, itemX, metaY + 28, { align: "center" });
  });

  // Accent dot under risk level
  const pal = riskPalette(ctx.report.risk_level);
  fill(doc, pal.strong);
  doc.circle(mx + colW * 2 + colW / 2, metaY + 35, 2.2, "F");
  fill(doc, alpha(pal.mid, 0.4));
  doc.circle(mx + colW * 2 + colW / 2, metaY + 35, 3.6, "F");

  // ── Patient info strip ──
  const stripY = metaY + metaH + 12;
  fill(doc, alpha(C.white, 0.04));
  roundRect(doc, mx, stripY, W - mx * 2, 18, 3, "F");

  const quickInfo = [
    `Age: ${normalizeValue(ctx.report.age, "N/A")}`,
    `BMI: ${normalizeValue(ctx.report.bmi, "N/A")}`,
    `Score: ${clamp(ctx.report.risk_score, 0, 100)}/100`,
    `Smoking: ${yesNo(ctx.report.smoking)}`,
  ];

  font(doc, 8.5, "normal");
  rgb(doc, alpha(C.white, 0.6));
  const infoSpacing = (W - mx * 2) / quickInfo.length;
  quickInfo.forEach((info, i) => {
    doc.text(info, mx + infoSpacing * i + infoSpacing / 2, stripY + 11, { align: "center" });
  });

  // ── Bottom decorative element ──
  const bottomY = H - 35;
  stroke(doc, alpha(C.white, 0.12));
  doc.setLineWidth(0.2);
  doc.line(mx, bottomY, W - mx, bottomY);

  font(doc, 7.5, "normal");
  rgb(doc, alpha(C.white, 0.3));
  doc.text("CONFIDENTIAL HEALTH DOCUMENT", mx, bottomY + 8);
  doc.text(formatDateTime(ctx.report.created_at), W - mx, bottomY + 8, { align: "right" });

  // Accent bar at bottom
  gradientH(doc, 0, H - 3, W, 3, C.teal500, C.accent500, 20);
}

// ─── Compact Inner-Page Header ──────────────────────────────────────────────────
function drawCompactHeader(ctx) {
  const { doc, mx, cw, W } = ctx;
  const y = 14;

  // Header bar background
  fill(doc, C.surface100);
  stroke(doc, C.surface200);
  doc.setLineWidth(0.2);
  roundRect(doc, mx, y, cw, 13, 3, "FD");

  // Brand accent stripe (left)
  gradientV(doc, mx, y, 3, 13, C.brand500, C.teal500, 8);
  
  // Brand text
  font(doc, 8.5, "bold");
  rgb(doc, C.brand700);
  doc.text("PranaPredict AI", mx + 6, y + 8.2);

  // Separator dot
  fill(doc, C.accent500);
  doc.circle(mx + 44, y + 6.5, 1, "F");

  // Report subtitle
  font(doc, 7.8, "normal");
  rgb(doc, C.text600);
  doc.text("Health Risk Assessment Report", mx + 48, y + 8.2);

  // Right-aligned ID
  font(doc, 7.5, "normal");
  rgb(doc, C.text500);
  doc.text(
    `ID: ${String(normalizeValue(ctx.report.id, "N/A")).slice(0, 8).toUpperCase()}`,
    W - mx,
    y + 8.2,
    { align: "right" }
  );

  ctx.y = 32;
}

// ─── Section Title ──────────────────────────────────────────────────────────────
function sectionTitle(ctx, title, subtitle = "") {
  ctx.y += 3;
  ensureSpace(ctx, 14);

  const { doc, mx, cw } = ctx;

  // Accent bar
  gradientV(doc, mx, ctx.y - 6, 3, 10, C.brand500, C.teal500, 6);

  // Title
  font(doc, 13, "bold");
  rgb(doc, C.text950);
  doc.text(title, mx + 7, ctx.y);

  if (subtitle) {
    font(doc, 7.8, "normal");
    rgb(doc, C.text500);
    doc.text(subtitle, mx + 7, ctx.y + 5);
  }

  // Separator line
  stroke(doc, C.surface200);
  doc.setLineWidth(0.2);
  doc.line(mx + 7, ctx.y + (subtitle ? 7.5 : 3), mx + cw, ctx.y + (subtitle ? 7.5 : 3));

  // Small decorative dot at end of line
  fill(doc, C.accent500);
  doc.circle(mx + cw, ctx.y + (subtitle ? 7.5 : 3), 0.8, "F");

  ctx.y += subtitle ? 13 : 8;
}

// ─── Premium Score Gauge ────────────────────────────────────────────────────────
function drawScoreGauge(doc, cx, cy, score, palette) {
  const safeScore = clamp(score, 0, 100);
  const startDeg = 135;
  const endDeg = 405;
  const activeDeg = startDeg + ((endDeg - startDeg) * safeScore) / 100;
  const gaugeR = 20;

  // Outer glow ring
  fill(doc, alpha(palette.mid, 0.15));
  doc.circle(cx, cy, gaugeR + 4, "F");

  // White background circle
  fill(doc, C.white);
  doc.circle(cx, cy, gaugeR + 1, "F");

  // Track arc (background)
  drawSegmentedArc(doc, cx, cy, gaugeR, startDeg, endDeg, C.surface200, 3.2, 54);

  // Active arc with gradient
  drawGradientArc(doc, cx, cy, gaugeR, startDeg, activeDeg, palette.mid, palette.strong, 3.5, 48);

  // Knob indicator at end of active arc
  const knob = polar(cx, cy, gaugeR, activeDeg);
  fill(doc, C.white);
  doc.circle(knob.x, knob.y, 2.8, "F");
  fill(doc, palette.strong);
  doc.circle(knob.x, knob.y, 1.8, "F");
  fill(doc, C.white);
  doc.circle(knob.x, knob.y, 0.7, "F");

  // Inner circle (clean white center)
  fill(doc, C.white);
  doc.circle(cx, cy, gaugeR - 5.5, "F");

  // Score number
  font(doc, 18, "bold");
  rgb(doc, C.text950);
  doc.text(String(safeScore), cx, cy + 2.5, { align: "center" });

  // "of 100" label
  font(doc, 7, "normal");
  rgb(doc, C.text500);
  doc.text("of 100", cx, cy + 8, { align: "center" });

  // Tick marks
  stroke(doc, C.surface300);
  doc.setLineWidth(0.2);
  const tickR = gaugeR + 2;
  for (let deg = startDeg; deg <= endDeg; deg += (endDeg - startDeg) / 10) {
    const inner = polar(cx, cy, tickR - 1, deg);
    const outer = polar(cx, cy, tickR + 0.5, deg);
    doc.line(inner.x, inner.y, outer.x, outer.y);
  }
}

// ─── Risk Overview Section ──────────────────────────────────────────────────────
function drawRiskOverview(ctx) {
  sectionTitle(ctx, "Risk Overview", "AI-computed health risk assessment summary");

  const { doc, mx, cw } = ctx;
  const riskScore = clamp(ctx.report.risk_score, 0, 100);
  const palette = riskPalette(ctx.report.risk_level);

  ensureSpace(ctx, 78);
  const cardY = ctx.y;
  const cardH = 72;

  // Main card
  panel(doc, mx, cardY, cw, cardH, {
    bg: C.surface0,
    border: C.surface200,
    radius: 6,
    shadowColor: [220, 228, 238],
  });

  // Left accent bar with gradient
  gradientV(doc, mx, cardY, 4, cardH, palette.strong, palette.mid, 10);

  // Draw the gauge
  drawScoreGauge(doc, mx + 36, cardY + 36, riskScore, palette);

  // Right side content
  const rightX = mx + 66;

  // Risk signal label
  font(doc, 7.5, "bold");
  rgb(doc, C.text500);
  doc.text("CURRENT RISK SIGNAL", rightX, cardY + 12);

  // Risk level
  font(doc, 20, "bold");
  rgb(doc, palette.strong);
  doc.text(palette.label, rightX, cardY + 24);

  // Description
  font(doc, 8.5, "normal");
  rgb(doc, C.text600);
  const descLines = doc.splitTextToSize(
    "Computed from your health history, lifestyle behaviors, biometric patterns, and AI model analysis.",
    cw - 72
  );
  descLines.forEach((line, i) => {
    doc.text(line, rightX, cardY + 31 + i * 4.2);
  });

  // Quick stat pills
  const pillY = cardY + 46;
  const pills = [
    { label: `Age ${normalizeValue(ctx.report.age)}`, color: C.brand500 },
    { label: `BMI ${normalizeValue(ctx.report.bmi)}`, color: C.teal600 },
    { label: `Score ${riskScore}/100`, color: palette.strong },
  ];

  let pillX = rightX;
  pills.forEach((p) => {
    font(doc, 7.8, "bold");
    const tw = doc.getTextWidth(p.label);
    const pw = tw + 8;
    const ph = 8;

    fill(doc, alpha(p.color, 0.12));
    stroke(doc, alpha(p.color, 0.25));
    doc.setLineWidth(0.2);
    roundRect(doc, pillX, pillY, pw, ph, 4, "FD");

    rgb(doc, p.color);
    doc.text(p.label, pillX + 4, pillY + 5.5);

    pillX += pw + 4;
  });

  // Risk band Legend (compact, right-aligned)
  const legendX = mx + cw - 42;
  const legendY = cardY + 8;

  panel(doc, legendX, legendY, 38, 55, {
    bg: C.surface50,
    border: C.surface200,
    radius: 4,
    shadow: false,
  });

  font(doc, 6.5, "bold");
  rgb(doc, C.text500);
  doc.text("RISK SPECTRUM", legendX + 4, legendY + 7);

  const bands = [
    { label: "Low (0-33)", color: C.success600, range: [0, 33] },
    { label: "Moderate (34-66)", color: C.accent600, range: [34, 66] },
    { label: "High (67-100)", color: C.danger600, range: [67, 100] },
  ];

  bands.forEach((band, i) => {
    const by = legendY + 13 + i * 12;

    // Color indicator bar
    fill(doc, band.color);
    roundRect(doc, legendX + 4, by - 1.5, 18, 3, 1.5, "F");

    // Progress fill indication
    const progress = riskScore >= band.range[0] && riskScore <= band.range[1] ? 1 : 0;
    if (progress) {
      fill(doc, C.white);
      const dotPos = ((riskScore - band.range[0]) / (band.range[1] - band.range[0])) * 18;
      doc.circle(legendX + 4 + Math.min(dotPos, 17), by, 1.5, "F");
    }

    // Label
    font(doc, 6.5, "normal");
    rgb(doc, C.text700);
    doc.text(band.label, legendX + 4, by + 6);
  });

  ctx.y = cardY + cardH + 6;
}

// ─── Key Health Metrics (Metric Cards) ──────────────────────────────────────────
function metricStatus(label, value) {
  if (label === "BMI") {
    const n = parseFloat(value);
    if (!isFinite(n)) return "neutral";
    if (n < 18.5 || n >= 30) return "danger";
    if (n >= 25) return "warning";
    return "success";
  }
  if (label === "Smoking") {
    return String(value).toLowerCase() === "yes" ? "danger" : "success";
  }
  if (label === "Activity Level") {
    const normalized = String(value).toLowerCase();
    if (normalized.includes("sedent")) return "danger";
    if (normalized.includes("light") || normalized.includes("moderate")) return "warning";
    return "success";
  }
  return "neutral";
}

function statusColorMap(status) {
  if (status === "success") return C.success600;
  if (status === "warning") return C.accent600;
  if (status === "danger") return C.danger600;
  return C.brand500;
}

function drawMetricCard(doc, x, y, w, h, label, value, status) {
  const color = statusColorMap(status);

  // Card background
  panel(doc, x, y, w, h, {
    bg: C.surface0,
    border: C.surface200,
    radius: 4,
    shadow: true,
    shadowOffset: 0.6,
    shadowColor: [225, 232, 240],
  });

  // Top colored stripe
  fill(doc, color);
  roundRect(doc, x, y, w, 2.2, 1, "F");
  doc.rect(x, y + 1, w, 1.2, "F");

  // Status indicator dot
  fill(doc, alpha(color, 0.15));
  doc.circle(x + w - 6, y + 8, 3.2, "F");
  fill(doc, color);
  doc.circle(x + w - 6, y + 8, 1.5, "F");

  // Label
  font(doc, 7, "normal");
  rgb(doc, C.text500);
  doc.text(label, x + 4, y + 9);

  // Value
  font(doc, 11.5, "bold");
  rgb(doc, C.text950);
  const displayVal = String(normalizeValue(value));
  const truncated = displayVal.length > 14 ? displayVal.slice(0, 13) + "…" : displayVal;
  doc.text(truncated, x + 4, y + 18);
}

function drawHealthMetrics(ctx) {
  sectionTitle(ctx, "Key Health Metrics", "Core biometric indicators");

  const metrics = [
    { label: "Age", value: `${normalizeValue(ctx.report.age)} yrs` },
    { label: "BMI", value: String(normalizeValue(ctx.report.bmi)) },
    { label: "Blood Pressure", value: normalizeValue(ctx.report.blood_pressure) },
    { label: "Cholesterol", value: titleCase(ctx.report.cholesterol) },
    { label: "Smoking", value: yesNo(ctx.report.smoking) },
    { label: "Activity Level", value: titleCase(ctx.report.activity_level) },
  ];

  const cols = 3;
  const gap = 4;
  const cardH = 23;
  const cardW = (ctx.cw - gap * (cols - 1)) / cols;

  for (let i = 0; i < metrics.length; i += cols) {
    const row = metrics.slice(i, i + cols);
    ensureSpace(ctx, cardH + gap + 2);
    const y = ctx.y;

    row.forEach((m, ci) => {
      const x = ctx.mx + ci * (cardW + gap);
      const status = metricStatus(m.label, m.value);
      drawMetricCard(ctx.doc, x, y, cardW, cardH, m.label, m.value, status);
    });

    ctx.y += cardH + gap;
  }

  ctx.y += 2;
}

// ─── Lifestyle Profile (Table Style) ────────────────────────────────────────────
function drawLifestyleProfile(ctx) {
  sectionTitle(ctx, "Lifestyle Profile", "Daily patterns & environmental context");

  const lifestyle = [
    ["Location", titleCase(ctx.report.location)],
    ["Work Type", titleCase(ctx.report.work_type)],
    ["Diet Type", titleCase(ctx.report.diet_type)],
    ["Alcohol Consumption", titleCase(ctx.report.alcohol_consumption)],
    ["Water Intake", ctx.report.water_intake != null ? `${ctx.report.water_intake} L/day` : "N/A"],
    ["Sleep Duration", ctx.report.sleep_duration != null ? `${ctx.report.sleep_duration} hrs/day` : "N/A"],
  ];

  ensureSpace(ctx, 10);

  autoTable(ctx.doc, {
    startY: ctx.y,
    margin: { left: ctx.mx, right: ctx.mx },
    head: [["Parameter", "Value"]],
    body: lifestyle,
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: { top: 3.5, bottom: 3.5, left: 5, right: 5 },
      lineColor: C.surface200,
      lineWidth: 0.2,
      textColor: C.text800,
    },
    headStyles: {
      fillColor: C.brand800,
      textColor: C.white,
      fontStyle: "bold",
      fontSize: 8.5,
      cellPadding: { top: 3.5, bottom: 3.5, left: 5, right: 5 },
    },
    alternateRowStyles: {
      fillColor: C.surface50,
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 55, textColor: C.text900 },
      1: { textColor: C.text700 },
    },
    didDrawPage: () => {
      // Ensure inner page background on new pages created by autotable
    },
  });

  ctx.y = ctx.doc.lastAutoTable.finalY + 6;
}

// ─── Pre-existing Conditions ────────────────────────────────────────────────────
function drawConditions(ctx) {
  sectionTitle(ctx, "Pre-existing Conditions", "Medical history flags");

  const conditions = [
    { label: "Diabetes", active: Boolean(ctx.report.diabetes) },
    { label: "Hypertension", active: Boolean(ctx.report.hypertension) },
    { label: "Heart Disease", active: Boolean(ctx.report.heart_disease) },
    { label: "Kidney Disease", active: Boolean(ctx.report.kidney_disease) },
  ];

  ensureSpace(ctx, 22);
  const { doc, mx, cw } = ctx;

  // Container
  panel(doc, mx, ctx.y, cw, 18, {
    bg: C.surface0,
    border: C.surface200,
    radius: 4,
    shadow: false,
  });

  const tagW = cw / conditions.length;

  conditions.forEach((cond, i) => {
    const x = mx + i * tagW;
    const centerX = x + tagW / 2;

    // Divider (not on first)
    if (i > 0) {
      stroke(doc, C.surface200);
      doc.setLineWidth(0.2);
      doc.line(x, ctx.y + 3, x, ctx.y + 15);
    }

    // Status indicator
    const dotColor = cond.active ? C.danger500 : C.success600;
    const bgColor = cond.active ? alpha(C.danger500, 0.12) : alpha(C.success600, 0.1);

    fill(doc, bgColor);
    doc.circle(centerX - 12, ctx.y + 9, 3, "F");
    fill(doc, dotColor);
    doc.circle(centerX - 12, ctx.y + 9, 1.5, "F");

    // Label
    font(doc, 8.5, "bold");
    rgb(doc, C.text900);
    doc.text(cond.label, centerX - 7, ctx.y + 8);

    // Status text
    font(doc, 7, "normal");
    rgb(doc, cond.active ? C.danger600 : C.success600);
    doc.text(cond.active ? "Detected" : "Clear", centerX - 7, ctx.y + 13);
  });

  ctx.y += 24;
}

// ─── AI Health Advice ───────────────────────────────────────────────────────────
function drawAdvice(ctx) {
  sectionTitle(ctx, "AI Health Advice", "Personalized recommendations powered by AI analysis");

  const blocks = parseAdviceBlocks(ctx.report.llm_advice);
  if (!blocks.length) {
    wrappedText(ctx, "No advice available for this report.", {
      color: C.text500,
      size: 9,
      gapAfter: 2,
    });
    return;
  }

  const { doc, mx, cw } = ctx;
  let headingColorIndex = 0;
  const headingColors = [C.brand700, C.teal600, C.accent600, C.brand500, C.teal500];

  for (const block of blocks) {
    if (block.type === "heading") {
      ensureSpace(ctx, 14);

      const hColor = headingColors[headingColorIndex % headingColors.length];
      headingColorIndex++;

      const size = block.level <= 1 ? 12 : block.level === 2 ? 11 : 10;

      // Heading background bar
      fill(doc, alpha(hColor, 0.06));
      roundRect(doc, mx, ctx.y - 6, cw, 10, 3, "F");

      // Left accent
      fill(doc, hColor);
      roundRect(doc, mx, ctx.y - 6, 3, 10, 1.5, "F");

      // Heading text
      font(doc, size, "bold");
      rgb(doc, hColor);
      doc.text(block.text, mx + 7, ctx.y);

      ctx.y += 8;
      continue;
    }

    if (block.type === "list") {
      font(doc, 9.2, "normal");
      const textW = cw - 16;
      const lines = doc.splitTextToSize(block.text, textW);
      const itemH = lines.length * 4.6 + 5;

      ensureSpace(ctx, itemH + 2);

      // List item background
      fill(doc, C.surface50);
      stroke(doc, C.surface200);
      doc.setLineWidth(0.15);
      roundRect(doc, mx, ctx.y, cw, itemH, 3, "FD");

      // Bullet marker badge
      fill(doc, C.brand100);
      roundRect(doc, mx + 3, ctx.y + 2.5, 7, 6.5, 2.5, "F");

      font(doc, 8, "bold");
      rgb(doc, C.brand600);
      doc.text(block.marker, mx + 4.8, ctx.y + 7);

      // Text content
      let textY = ctx.y + 7;
      font(doc, 9.2, "normal");
      rgb(doc, C.text700);
      for (const line of lines) {
        doc.text(line, mx + 14, textY);
        textY += 4.6;
      }

      ctx.y += itemH + 2.5;
      continue;
    }

    // Paragraph
    font(doc, 9.4, "normal");
    const paraLines = doc.splitTextToSize(block.text, cw - 8);
    const paraH = paraLines.length * 4.8 + 5;

    ensureSpace(ctx, paraH + 2);

    fill(doc, C.surface0);
    stroke(doc, C.surface200);
    doc.setLineWidth(0.15);
    roundRect(doc, mx, ctx.y, cw, paraH, 3, "FD");

    let textY = ctx.y + 6;
    rgb(doc, C.text700);
    for (const line of paraLines) {
      doc.text(line, mx + 4, textY);
      textY += 4.8;
    }

    ctx.y += paraH + 2.5;
  }
}

// ─── Disclaimer ─────────────────────────────────────────────────────────────────
function drawDisclaimer(ctx) {
  ensureSpace(ctx, 28);
  const { doc, mx, cw } = ctx;

  // Warning panel with distinct styling
  panel(doc, mx, ctx.y, cw, 20, {
    bg: C.accent100,
    border: alpha(C.accent500, 0.3),
    radius: 4,
    shadow: false,
  });

  // Left accent bar
  fill(doc, C.accent500);
  roundRect(doc, mx, ctx.y, 3.5, 20, 1.5, "F");

  // Warning icon (triangle)
  fill(doc, alpha(C.accent600, 0.15));
  doc.circle(mx + 10.5, ctx.y + 10, 4.5, "F");
  font(doc, 10, "bold");
  rgb(doc, C.accent600);
  doc.text("!", mx + 9.5, ctx.y + 12.2);

  // Title
  font(doc, 10, "bold");
  rgb(doc, C.text950);
  doc.text("Clinical Notice & Disclaimer", mx + 18, ctx.y + 8);

  // Text
  font(doc, 8, "normal");
  rgb(doc, C.text700);
  doc.text(
    "This report is generated by AI for informational purposes only. It does not constitute medical advice,",
    mx + 18,
    ctx.y + 13
  );
  doc.text(
    "diagnosis, or treatment. Always consult qualified healthcare professionals for medical decisions.",
    mx + 18,
    ctx.y + 17
  );

  ctx.y += 26;
}

// ─── Footer ─────────────────────────────────────────────────────────────────────
function applyFooters(ctx) {
  const { doc, W, H, mx } = ctx;
  const totalPages = doc.getNumberOfPages();

  for (let page = 2; page <= totalPages; page++) {
    doc.setPage(page);
    const fy = H - 12;

    // Separator line
    stroke(doc, C.surface300);
    doc.setLineWidth(0.2);
    doc.line(mx, fy - 3, W - mx, fy - 3);

    // Small decorative dot
    fill(doc, C.accent500);
    doc.circle(W / 2, fy - 3, 0.6, "F");

    // Left text
    font(doc, 7, "normal");
    rgb(doc, C.text500);
    doc.text("PranaPredict AI  •  Confidential Health Report  •  Not a Medical Diagnosis", mx, fy);

    // Right - page number with pill
    const pageText = `${page - 1} / ${totalPages - 1}`;
    font(doc, 7, "bold");
    const ptw = doc.getTextWidth(pageText);

    fill(doc, C.surface100);
    stroke(doc, C.surface300);
    doc.setLineWidth(0.15);
    roundRect(doc, W - mx - ptw - 6, fy - 4.5, ptw + 6, 7, 3.5, "FD");

    rgb(doc, C.text600);
    doc.text(pageText, W - mx - 3, fy, { align: "right" });
  }
}

// ─── Executive Summary Card ─────────────────────────────────────────────────────
function drawExecutiveSummary(ctx) {
  sectionTitle(ctx, "Executive Summary", "At-a-glance overview of your health profile");

  const { doc, mx, cw } = ctx;
  const riskScore = clamp(ctx.report.risk_score, 0, 100);
  const palette = riskPalette(ctx.report.risk_level);

  ensureSpace(ctx, 38);
  const cardY = ctx.y;

  panel(doc, mx, cardY, cw, 32, {
    bg: C.surface0,
    border: C.surface200,
    radius: 5,
  });

  // Left colored stripe
  gradientV(doc, mx, cardY, 3, 32, C.teal500, C.brand500, 8);

  // Summary text
  font(doc, 9.5, "normal");
  rgb(doc, C.text700);

  const summaryText = `Based on comprehensive AI analysis, your health profile indicates a ${palette.label.toLowerCase()} ` +
    `with a risk score of ${riskScore}/100. Key factors include ` +
    `${normalizeValue(ctx.report.smoking) ? "smoking habits" : "non-smoking status"}, ` +
    `BMI of ${normalizeValue(ctx.report.bmi, "N/A")}, ` +
    `and ${titleCase(ctx.report.activity_level).toLowerCase()} activity level. ` +
    `Please review the detailed assessment and recommendations below.`;

  const lines = doc.splitTextToSize(summaryText, cw - 14);
  let textY = cardY + 8;
  for (const line of lines) {
    doc.text(line, mx + 7, textY);
    textY += 4.8;
  }

  ctx.y = cardY + 36;
}

// ─── Main Export ────────────────────────────────────────────────────────────────
export function generateHealthReportPdf(report) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const ctx = createCtx(doc, report || {});

  // Page 1: Cover
  drawCoverPage(ctx);

  // Page 2+: Content
  newPage(ctx);
  drawExecutiveSummary(ctx);
  drawRiskOverview(ctx);
  drawHealthMetrics(ctx);
  drawLifestyleProfile(ctx);
  drawConditions(ctx);
  drawAdvice(ctx);
  drawDisclaimer(ctx);
  applyFooters(ctx);

  // Generate filename
  const date = report?.created_at
    ? new Date(report.created_at).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  const risk = String(normalizeValue(report?.risk_level, "Report")).replace(/\s+/g, "");

  doc.save(`PranaPredict_Report_${risk}_${date}.pdf`);
}