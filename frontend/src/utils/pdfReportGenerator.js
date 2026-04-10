import { jsPDF } from "jspdf";

// Design language mirrored from frontend CSS tokens.
const C = {
  brand900: [15, 42, 67],
  brand800: [19, 57, 94],
  brand700: [26, 77, 127],
  brand600: [33, 102, 166],
  brand500: [47, 128, 199],
  brand400: [98, 165, 218],

  accent500: [249, 115, 22],
  accent400: [251, 146, 60],
  accent100: [255, 237, 213],

  success500: [22, 163, 74],
  success300: [134, 239, 172],
  success100: [240, 253, 244],

  warning500: [217, 119, 6],
  warning300: [252, 211, 77],
  warning100: [255, 251, 235],

  danger500: [220, 38, 38],
  danger300: [252, 165, 165],
  danger100: [254, 242, 242],

  surface0: [255, 255, 255],
  surface50: [246, 249, 252],
  surface100: [237, 243, 249],
  surface200: [218, 230, 242],
  surface300: [196, 214, 232],

  text900: [18, 38, 58],
  text700: [44, 72, 99],
  text600: [62, 95, 127],
  text500: [90, 118, 146],
  text400: [122, 147, 173],

  white: [255, 255, 255],
};

const FONT_DISPLAY = "helvetica";
const FONT_BODY = "helvetica";

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
      blocks.push({ type: "list", marker: "-", text: stripMarkdown(bullets[1]) });
      continue;
    }

    paragraphBuffer.push(line);
  }

  flushParagraph();
  return blocks;
}

function mixColor(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function riskPalette(level) {
  const text = String(normalizeValue(level, "Moderate")).toLowerCase();
  if (text.includes("high")) {
    return {
      strong: C.danger500,
      mid: C.danger300,
      soft: C.danger100,
      label: "High Risk",
    };
  }
  if (text.includes("moderate")) {
    return {
      strong: C.warning500,
      mid: C.warning300,
      soft: C.warning100,
      label: "Moderate Risk",
    };
  }
  return {
    strong: C.success500,
    mid: C.success300,
    soft: C.success100,
    label: "Low Risk",
  };
}

const setTextRgb = (doc, c) => doc.setTextColor(c[0], c[1], c[2]);
const setFillRgb = (doc, c) => doc.setFillColor(c[0], c[1], c[2]);
const setStrokeRgb = (doc, c) => doc.setDrawColor(c[0], c[1], c[2]);

function setFont(doc, size, style = "normal", family = FONT_BODY) {
  doc.setFont(family, style);
  doc.setFontSize(size);
}

function roundedRect(doc, x, y, w, h, radius, mode = "F") {
  if (radius > 0) {
    doc.roundedRect(x, y, w, h, radius, radius, mode);
    return;
  }
  doc.rect(x, y, w, h, mode);
}

function drawVerticalGradient(doc, x, y, w, h, topColor, bottomColor, steps = 36) {
  const slice = h / steps;
  for (let i = 0; i < steps; i++) {
    const t = i / Math.max(1, steps - 1);
    setFillRgb(doc, mixColor(topColor, bottomColor, t));
    doc.rect(x, y + i * slice, w, slice + 0.35, "F");
  }
}

function drawPanel(doc, x, y, w, h, options = {}) {
  const {
    fill = C.surface0,
    border = C.surface300,
    radius = 4,
    shadow = true,
    shadowColor = C.surface200,
  } = options;

  if (shadow) {
    setFillRgb(doc, shadowColor);
    roundedRect(doc, x + 0.9, y + 0.9, w, h, radius, "F");
  }

  setFillRgb(doc, fill);
  setStrokeRgb(doc, border);
  doc.setLineWidth(0.25);
  roundedRect(doc, x, y, w, h, radius, "FD");
}

function polar(cx, cy, radius, deg) {
  const rad = (deg * Math.PI) / 180;
  return {
    x: cx + Math.cos(rad) * radius,
    y: cy + Math.sin(rad) * radius,
  };
}

function drawArcSegment(doc, cx, cy, radius, startDeg, endDeg, color, width) {
  const p0 = polar(cx, cy, radius, startDeg);
  const p1 = polar(cx, cy, radius, endDeg);
  setStrokeRgb(doc, color);
  doc.setLineWidth(width);
  doc.line(p0.x, p0.y, p1.x, p1.y);
}

function drawSegmentedArc(doc, cx, cy, radius, startDeg, endDeg, color, width, segments = 48) {
  const span = endDeg - startDeg;
  if (span <= 0) return;

  const segmentSpan = span / segments;
  for (let i = 0; i < segments; i++) {
    const segStart = startDeg + i * segmentSpan;
    const segEnd = segStart + segmentSpan * 0.78;
    drawArcSegment(doc, cx, cy, radius, segStart, segEnd, color, width);
  }
}


function drawGradientArc(doc, cx, cy, radius, startDeg, endDeg, fromColor, toColor, width, segments = 34) {
  const span = endDeg - startDeg;
  if (span <= 0) return;

  const segmentSpan = span / segments;
  for (let i = 0; i < segments; i++) {
    const t = (i + 1) / segments;
    const segStart = startDeg + i * segmentSpan;
    const segEnd = segStart + segmentSpan * 0.84;
    const color = mixColor(fromColor, toColor, t);
    drawArcSegment(doc, cx, cy, radius, segStart, segEnd, color, width);
  }
}

function drawPill(doc, x, y, text, options = {}) {
  const {
    fg = C.brand700,
    bg = C.surface100,
    border = C.surface300,
    padX = 4,
    padY = 2.7,
    size = 8,
    style = "bold",
  } = options;

  setFont(doc, size, style);
  const textW = doc.getTextWidth(String(text));
  const w = textW + padX * 2;
  const h = 7.4;

  setFillRgb(doc, bg);
  setStrokeRgb(doc, border);
  doc.setLineWidth(0.22);
  roundedRect(doc, x, y, w, h, 3.7, "FD");

  setTextRgb(doc, fg);
  doc.text(String(text), x + padX, y + padY + 2.2);

  return w;
}

function createCtx(doc, report) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const marginX = 16;
  return {
    doc,
    report,
    W,
    H,
    marginX,
    contentW: W - marginX * 2,
    bottomLimit: H - 17,
    y: 16,
  };
}

function drawPageBackground(ctx, variant = "inner") {
  const { doc, W, H } = ctx;

  setFillRgb(doc, C.surface50);
  doc.rect(0, 0, W, H, "F");

  if (variant === "cover") {
    setFillRgb(doc, mixColor(C.brand400, C.surface50, 0.72));
    doc.circle(-16, -8, 88, "F");

    setFillRgb(doc, mixColor(C.accent100, C.surface50, 0.35));
    doc.circle(W + 12, -6, 60, "F");
  } else {
    setFillRgb(doc, C.surface100);
    doc.rect(0, 0, W, 28, "F");
  }

  drawPanel(doc, 8, 8, W - 16, H - 16, {
    fill: C.surface0,
    border: C.surface200,
    radius: 5,
    shadow: false,
  });
}

function addPage(ctx) {
  ctx.doc.addPage();
  drawPageBackground(ctx, "inner");
  drawCompactHeader(ctx);
}

function ensureSpace(ctx, needed) {
  if (ctx.y + needed <= ctx.bottomLimit) return;
  addPage(ctx);
}

function wrappedText(ctx, text, options = {}) {
  const {
    x = ctx.marginX,
    width = ctx.contentW,
    size = 9.4,
    style = "normal",
    color = C.text700,
    lineHeight = 4.8,
    gapAfter = 0,
    align = "left",
  } = options;

  const value = stripMarkdown(text);
  if (!value) return;

  setFont(ctx.doc, size, style);
  setTextRgb(ctx.doc, color);
  const lines = ctx.doc.splitTextToSize(value, width);

  for (const line of lines) {
    ensureSpace(ctx, lineHeight);
    ctx.doc.text(line, x, ctx.y, { align });
    ctx.y += lineHeight;
  }

  ctx.y += gapAfter;
}

function drawHeroHeader(ctx) {
  const { doc, marginX, contentW, W } = ctx;
  const headerY = 12;
  const headerH = 50;

  drawPanel(doc, marginX, headerY, contentW, headerH, {
    fill: C.brand700,
    border: C.brand600,
    radius: 6,
    shadowColor: C.surface200,
  });

  drawVerticalGradient(doc, marginX, headerY, contentW, headerH, C.brand800, C.brand500, 42);

  setFillRgb(doc, mixColor(C.white, C.brand500, 0.65));
  doc.circle(W - marginX - 17, headerY + 10, 8, "F");
  doc.circle(W - marginX - 7, headerY + 22, 4.2, "F");

  setFillRgb(doc, C.accent400);
  roundedRect(doc, marginX, headerY, 4.5, headerH, 2, "F");
  doc.rect(marginX + 2.3, headerY, 2.2, headerH, "F");

  setFont(doc, 11, "bold", FONT_DISPLAY);
  setTextRgb(doc, C.accent100);
  doc.text("PRANA", marginX + 9.5, headerY + 10.5);
  const brandW = doc.getTextWidth("PRANA");
  setTextRgb(doc, C.white);
  doc.text("PREDICT AI", marginX + 9.5 + brandW + 1.2, headerY + 10.5);

  setFont(doc, 7.6, "normal");
  setTextRgb(doc, mixColor(C.surface100, C.brand500, 0.3));
  doc.text("AI-POWERED HEALTH INTELLIGENCE", marginX + 9.5, headerY + 16.8);

  setFont(doc, 16.2, "bold", FONT_DISPLAY);
  setTextRgb(doc, C.white);
  doc.text("Health Risk Intelligence Report", marginX + 9.5, headerY + 29.2);

  setFont(doc, 8.8, "normal");
  setTextRgb(doc, mixColor(C.surface100, C.brand500, 0.28));
  doc.text(formatDateTime(ctx.report.created_at), marginX + 9.5, headerY + 37.2);

  const id = String(normalizeValue(ctx.report.id, "N/A")).slice(0, 8).toUpperCase();
  const level = riskPalette(ctx.report.risk_level).label;

  const badgeX = W - marginX - 49;
  const badgeY = headerY + 8;
  drawPanel(doc, badgeX, badgeY, 43, 33, {
    fill: mixColor(C.brand900, C.white, 0.08),
    border: mixColor(C.white, C.brand500, 0.55),
    radius: 3.5,
    shadow: false,
  });

  setFont(doc, 7.3, "bold");
  setTextRgb(doc, C.accent100);
  doc.text("REPORT ID", badgeX + 3.5, badgeY + 7);

  setFont(doc, 10.3, "bold");
  setTextRgb(doc, C.white);
  doc.text(id, badgeX + 3.5, badgeY + 13.7);

  const pal = riskPalette(level);
  drawPill(doc, badgeX + 3.5, badgeY + 18, pal.label, {
    fg: pal.strong,
    bg: C.white,
    border: mixColor(pal.mid, C.white, 0.2),
    size: 7.2,
  });

  setFont(doc, 6.9, "normal");
  setTextRgb(doc, mixColor(C.surface100, C.brand500, 0.3));
  doc.text("Confidential", badgeX + 3.5, badgeY + 30);

  ctx.y = headerY + headerH + 8;
}

function drawCompactHeader(ctx) {
  const { doc, marginX, contentW, W } = ctx;
  const y = 11;

  drawPanel(doc, marginX, y, contentW, 12.5, {
    fill: C.surface50,
    border: C.surface200,
    radius: 2.5,
    shadow: false,
  });

  setFillRgb(doc, C.brand500);
  roundedRect(doc, marginX, y, 3, 12.5, 1, "F");
  doc.rect(marginX + 1.5, y, 1.5, 12.5, "F");

  setFont(doc, 9.1, "bold", FONT_DISPLAY);
  setTextRgb(doc, C.brand700);
  doc.text("PranaPredict AI | Health Risk Assessment", marginX + 6, y + 7.9);

  setFont(doc, 7.4, "normal");
  setTextRgb(doc, C.text500);
  doc.text(
    `ID: ${String(normalizeValue(ctx.report.id, "N/A")).slice(0, 8).toUpperCase()}`,
    W - marginX,
    y + 7.9,
    { align: "right" }
  );

  ctx.y = 29;
}

function sectionTitle(ctx, title, subtitle = "") {
  ctx.y += 2.5;
  ensureSpace(ctx, 13);

  const { doc, marginX, contentW } = ctx;

  setFillRgb(doc, C.accent400);
  roundedRect(doc, marginX, ctx.y - 5.8, 2.6, 8.4, 1, "F");

  setFont(doc, 12.6, "bold", FONT_DISPLAY);
  setTextRgb(doc, C.text900);
  doc.text(title, marginX + 5.8, ctx.y);

  if (subtitle) {
    setFont(doc, 8, "normal");
    setTextRgb(doc, C.text500);
    doc.text(subtitle, marginX + 5.8, ctx.y + 4.5);
  }

  setStrokeRgb(doc, C.surface200);
  doc.setLineWidth(0.25);
  doc.line(marginX + 5.8, ctx.y + 6, marginX + contentW, ctx.y + 6);

  ctx.y += subtitle ? 11 : 8;
}

function drawScoreGauge(doc, cx, cy, score, palette) {
  const safeScore = clamp(score, 0, 100);
  const startDeg = 150;
  const endDeg = 390;
  const activeDeg = startDeg + ((endDeg - startDeg) * safeScore) / 100;

  setFillRgb(doc, C.white);
  doc.circle(cx, cy, 17.2, "F");

  drawSegmentedArc(doc, cx, cy, 16.3, startDeg, endDeg, C.surface300, 2.65, 48);
  drawGradientArc(doc, cx, cy, 16.3, startDeg, activeDeg, palette.mid, palette.strong, 2.9, 32);

  const knob = polar(cx, cy, 16.3, activeDeg);
  setFillRgb(doc, palette.strong);
  doc.circle(knob.x, knob.y, 1.8, "F");
  setFillRgb(doc, C.white);
  doc.circle(knob.x, knob.y, 0.8, "F");

  setFont(doc, 14.2, "bold", FONT_DISPLAY);
  setTextRgb(doc, C.text900);
  doc.text(String(safeScore), cx, cy + 2, { align: "center" });

  setFont(doc, 6.8, "normal");
  setTextRgb(doc, C.text500);
  doc.text("OUT OF 100", cx, cy + 6.8, { align: "center" });
}

function drawRiskOverview(ctx) {
  sectionTitle(ctx, "Risk Overview", "Dashboard-inspired summary card");

  const { doc, marginX, contentW } = ctx;
  const riskScore = clamp(ctx.report.risk_score, 0, 100);
  const palette = riskPalette(ctx.report.risk_level);

  ensureSpace(ctx, 71);
  const cardY = ctx.y;
  const cardH = 64;

  drawPanel(doc, marginX, cardY, contentW, cardH, {
    fill: palette.soft,
    border: mixColor(palette.mid, C.white, 0.28),
    radius: 5,
  });

  setFillRgb(doc, mixColor(palette.strong, C.white, 0.65));
  roundedRect(doc, marginX, cardY, 3.8, cardH, 1.8, "F");

  drawScoreGauge(doc, marginX + 28, cardY + 29, riskScore, palette);

  setFont(doc, 8.1, "bold");
  setTextRgb(doc, palette.strong);
  doc.text("CURRENT SIGNAL", marginX + 51, cardY + 10);

  setFont(doc, 16.5, "bold", FONT_DISPLAY);
  setTextRgb(doc, palette.strong);
  doc.text(palette.label, marginX + 51, cardY + 19);

  setFont(doc, 8.5, "normal");
  setTextRgb(doc, C.text600);
  doc.text(
    "Computed from health history, lifestyle behavior, and biometric patterns.",
    marginX + 51,
    cardY + 25
  );

  drawPill(doc, marginX + 51, cardY + 30, `Age ${normalizeValue(ctx.report.age)}`, {
    fg: C.brand700,
    bg: C.surface0,
    border: C.surface300,
    size: 7.8,
  });

  drawPill(doc, marginX + 77, cardY + 30, `BMI ${normalizeValue(ctx.report.bmi)}`, {
    fg: C.brand700,
    bg: C.surface0,
    border: C.surface300,
    size: 7.8,
  });

  drawPill(doc, marginX + 108, cardY + 30, `Smoking ${yesNo(ctx.report.smoking)}`, {
    fg: C.brand700,
    bg: C.surface0,
    border: C.surface300,
    size: 7.8,
  });

  const legendX = marginX + contentW - 48;
  const legendY = cardY + 8;

  drawPanel(doc, legendX, legendY, 42, 48, {
    fill: C.white,
    border: C.surface300,
    radius: 3.4,
    shadow: false,
  });

  setFont(doc, 7.2, "bold");
  setTextRgb(doc, C.text500);
  doc.text("RISK BANDS", legendX + 4, legendY + 6);

  const bands = [
    { label: "Low", color: C.success500 },
    { label: "Moderate", color: C.warning500 },
    { label: "High", color: C.danger500 },
  ];

  bands.forEach((band, idx) => {
    const y = legendY + 12 + idx * 10;
    setFillRgb(doc, band.color);
    roundedRect(doc, legendX + 4, y - 3.2, 5, 5, 1.2, "F");

    setFont(doc, 7.6, "normal");
    setTextRgb(doc, C.text700);
    doc.text(band.label, legendX + 11, y);
  });

  setFont(doc, 7, "normal");
  setTextRgb(doc, C.text500);
  doc.text("Score", legendX + 4, legendY + 42);

  setFont(doc, 10.5, "bold");
  setTextRgb(doc, palette.strong);
  doc.text(String(riskScore), legendX + 27, legendY + 42, { align: "right" });

  ctx.y = cardY + cardH + 5;
}

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

function statusColor(status) {
  if (status === "success") return C.success500;
  if (status === "warning") return C.warning500;
  if (status === "danger") return C.danger500;
  return C.brand500;
}

function drawInfoGrid(ctx, items, options = {}) {
  const { doc, marginX, contentW } = ctx;
  const cols = options.cols || 3;
  const gap = options.gap || 4;
  const cardH = options.cardH || 19;
  const useStatus = Boolean(options.statusFn);
  const cardW = (contentW - gap * (cols - 1)) / cols;

  for (let i = 0; i < items.length; i += cols) {
    const rowItems = items.slice(i, i + cols);
    ensureSpace(ctx, cardH + gap + 1);
    const y = ctx.y;

    rowItems.forEach((item, colIndex) => {
      const x = marginX + colIndex * (cardW + gap);
      const status = useStatus ? options.statusFn(item.label, item.value) : "neutral";
      const lineColor = statusColor(status);

      drawPanel(doc, x, y, cardW, cardH, {
        fill: C.surface50,
        border: C.surface300,
        radius: 3,
        shadow: false,
      });

      setFillRgb(doc, lineColor);
      roundedRect(doc, x, y, cardW, 1.8, 1, "F");

      setFillRgb(doc, mixColor(lineColor, C.white, 0.75));
      doc.circle(x + cardW - 4.5, y + 5.8, 1.6, "F");

      setFont(doc, 7.4, "normal");
      setTextRgb(doc, C.text500);
      doc.text(item.label, x + 2.7, y + 7.3);

      setFont(doc, 10, "bold", FONT_DISPLAY);
      setTextRgb(doc, C.text900);
      doc.text(String(normalizeValue(item.value)), x + 2.7, y + 14.2);
    });

    ctx.y += cardH + gap;
  }

  ctx.y += 1;
}

function drawHealthMetrics(ctx) {
  sectionTitle(ctx, "Key Health Metrics", "Styled like dashboard metric cards");

  const metrics = [
    { label: "Age", value: `${normalizeValue(ctx.report.age)} yrs` },
    { label: "BMI", value: String(normalizeValue(ctx.report.bmi)) },
    { label: "Blood Pressure", value: normalizeValue(ctx.report.blood_pressure) },
    { label: "Cholesterol", value: titleCase(ctx.report.cholesterol) },
    { label: "Smoking", value: yesNo(ctx.report.smoking) },
    { label: "Activity Level", value: titleCase(ctx.report.activity_level) },
  ];

  drawInfoGrid(ctx, metrics, { cols: 3, cardH: 19, statusFn: metricStatus });
}

function drawLifestyleProfile(ctx) {
  sectionTitle(ctx, "Lifestyle Profile", "Daily patterns and environmental context");

  const lifestyle = [
    { label: "Location", value: titleCase(ctx.report.location) },
    { label: "Work Type", value: titleCase(ctx.report.work_type) },
    { label: "Diet", value: titleCase(ctx.report.diet_type) },
    { label: "Alcohol", value: titleCase(ctx.report.alcohol_consumption) },
    {
      label: "Water Intake",
      value: ctx.report.water_intake != null ? `${ctx.report.water_intake} L/day` : "N/A",
    },
    {
      label: "Sleep",
      value: ctx.report.sleep_duration != null ? `${ctx.report.sleep_duration} hrs/day` : "N/A",
    },
  ];

  drawInfoGrid(ctx, lifestyle, { cols: 3, cardH: 19 });
}

function drawConditions(ctx) {
  sectionTitle(ctx, "Pre-existing Conditions", "Condition tags mirror app badge styling");

  ensureSpace(ctx, 16);
  const { doc, marginX, contentW } = ctx;

  const conditions = [
    { label: "Diabetes", active: Boolean(ctx.report.diabetes) },
    { label: "Hypertension", active: Boolean(ctx.report.hypertension) },
    { label: "Heart Disease", active: Boolean(ctx.report.heart_disease) },
    { label: "Kidney Disease", active: Boolean(ctx.report.kidney_disease) },
  ];

  const tagGap = 4;
  const tagH = 9.4;
  let x = marginX;

  conditions.forEach((cond) => {
    setFont(doc, 8.8, "bold");
    const w = doc.getTextWidth(cond.label) + 14;

    if (x + w > marginX + contentW) {
      x = marginX;
      ctx.y += tagH + 2.6;
      ensureSpace(ctx, tagH + 3);
    }

    const bg = cond.active ? C.danger100 : C.surface50;
    const border = cond.active ? C.danger300 : C.surface300;
    const dot = cond.active ? C.danger500 : C.text500;
    const text = cond.active ? C.danger500 : C.text600;

    drawPanel(doc, x, ctx.y - 1.2, w, tagH, {
      fill: bg,
      border,
      radius: 3,
      shadow: false,
    });

    setFillRgb(doc, dot);
    doc.circle(x + 4.5, ctx.y + 3.5, 1.35, "F");

    setFont(doc, 8.3, "bold");
    setTextRgb(doc, text);
    doc.text(cond.label, x + 7.2, ctx.y + 5.1);

    x += w + tagGap;
  });

  ctx.y += tagH + 5.5;
}

function drawAdviceBlockContainer(ctx, height) {
  ensureSpace(ctx, height);
  drawPanel(ctx.doc, ctx.marginX, ctx.y, ctx.contentW, height, {
    fill: C.surface50,
    border: C.surface300,
    radius: 3.2,
    shadow: false,
  });
}

function drawAdvice(ctx) {
  sectionTitle(ctx, "AI Health Advice", "Readable narrative cards with list emphasis");

  const blocks = parseAdviceBlocks(ctx.report.llm_advice);
  if (!blocks.length) {
    wrappedText(ctx, "No advice available for this report.", {
      color: C.text500,
      size: 9,
      gapAfter: 2,
    });
    return;
  }

  for (const block of blocks) {
    if (block.type === "heading") {
      ensureSpace(ctx, 13);
      const size = block.level <= 1 ? 11.8 : block.level === 2 ? 10.8 : 10;

      drawPanel(ctx.doc, ctx.marginX, ctx.y - 5.8, ctx.contentW, 9.6, {
        fill: C.surface100,
        border: C.surface200,
        radius: 2,
        shadow: false,
      });

      setFillRgb(ctx.doc, C.brand500);
      roundedRect(ctx.doc, ctx.marginX, ctx.y - 5.8, 2.8, 9.6, 0.9, "F");

      setFont(ctx.doc, size, "bold", FONT_DISPLAY);
      setTextRgb(ctx.doc, C.brand700);
      ctx.doc.text(block.text, ctx.marginX + 6.2, ctx.y);

      ctx.y += 8;
      continue;
    }

    if (block.type === "list") {
      const contentW = ctx.contentW - 14;
      const lines = ctx.doc.splitTextToSize(block.text, contentW);
      const rowH = lines.length * 4.6 + 5;

      drawAdviceBlockContainer(ctx, rowH);

      setFillRgb(ctx.doc, C.accent100);
      roundedRect(ctx.doc, ctx.marginX + 2.4, ctx.y + 2.2, 7.3, 6.4, 2, "F");

      setFont(ctx.doc, 8.4, "bold");
      setTextRgb(ctx.doc, C.accent500);
      ctx.doc.text(block.marker, ctx.marginX + 4.4, ctx.y + 6.7);

      let textY = ctx.y + 6.6;
      setFont(ctx.doc, 9.3, "normal");
      setTextRgb(ctx.doc, C.text700);
      for (const line of lines) {
        ctx.doc.text(line, ctx.marginX + 12, textY);
        textY += 4.6;
      }

      ctx.y += rowH + 2.2;
      continue;
    }

    const lines = ctx.doc.splitTextToSize(block.text, ctx.contentW - 6);
    const paraH = lines.length * 4.8 + 5;

    drawAdviceBlockContainer(ctx, paraH);

    let textY = ctx.y + 6;
    setFont(ctx.doc, 9.4, "normal");
    setTextRgb(ctx.doc, C.text700);
    for (const line of lines) {
      ctx.doc.text(line, ctx.marginX + 3, textY);
      textY += 4.8;
    }

    ctx.y += paraH + 2.2;
  }
}

function drawDisclaimer(ctx) {
  ensureSpace(ctx, 22);
  const { doc, marginX, contentW } = ctx;

  drawPanel(doc, marginX, ctx.y, contentW, 15, {
    fill: C.warning100,
    border: C.warning300,
    radius: 3,
    shadow: false,
  });

  setFillRgb(doc, C.warning500);
  roundedRect(doc, marginX, ctx.y, 3.2, 15, 1.3, "F");

  setFont(doc, 9.5, "bold", FONT_DISPLAY);
  setTextRgb(doc, C.text900);
  doc.text("Clinical Notice", marginX + 7, ctx.y + 5.4);

  setFont(doc, 8.4, "normal");
  setTextRgb(doc, C.text600);
  doc.text(
    "This report is informational only and does not replace licensed medical diagnosis or professional consultation.",
    marginX + 7,
    ctx.y + 10.8
  );

  ctx.y += 19;
}

function applyFooters(ctx) {
  const { doc, W, H, marginX } = ctx;
  const totalPages = doc.getNumberOfPages();

  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);
    const footerY = H - 9;

    setStrokeRgb(doc, C.surface300);
    doc.setLineWidth(0.23);
    doc.line(marginX, footerY - 3.6, W - marginX, footerY - 3.6);

    setFont(doc, 7.3, "normal");
    setTextRgb(doc, C.text500);
    doc.text("PranaPredict AI | Informational report only | Not a medical diagnosis", marginX, footerY);
    doc.text(`Page ${page} of ${totalPages}`, W - marginX, footerY, { align: "right" });
  }
}

export function generateHealthReportPdf(report) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const ctx = createCtx(doc, report || {});

  drawPageBackground(ctx, "cover");
  drawHeroHeader(ctx);
  drawRiskOverview(ctx);
  drawHealthMetrics(ctx);
  drawLifestyleProfile(ctx);
  drawConditions(ctx);
  drawAdvice(ctx);
  drawDisclaimer(ctx);
  applyFooters(ctx);

  const date = report?.created_at
    ? new Date(report.created_at).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  const risk = String(normalizeValue(report?.risk_level, "Report")).replace(/\s+/g, "");

  doc.save(`PranaPredict_Report_${risk}_${date}.pdf`);
}