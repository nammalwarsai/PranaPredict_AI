import { jsPDF } from "jspdf";

// ─── Design tokens ─────────────────────────────────────────────────────────────

const C = {
  brand:        [26,  77, 127],
  brandDeep:    [15,  42,  67],
  brandSoft:    [237, 243, 249],
  accent:       [249, 115,  22],
  white:        [255, 255, 255],
  textStrong:   [ 18,  38,  58],
  textBody:     [ 44,  72,  99],
  textMuted:    [110, 138, 166],
  textOnDark:   [160, 190, 220],
  border:       [208, 222, 236],
  borderLight:  [226, 232, 242],
  panel:        [248, 251, 255],
  track:        [226, 232, 240],
  success:      [ 22, 163,  74],
  successMid:   [134, 214, 152],
  successSoft:  [240, 253, 244],
  warning:      [217, 119,   6],
  warningMid:   [251, 191,  36],
  warningSoft:  [255, 247, 237],
  danger:       [220,  38,  38],
  dangerMid:    [252, 165, 165],
  dangerSoft:   [254, 242, 242],
};

const FONT = "helvetica";

// ─── Utilities ─────────────────────────────────────────────────────────────────

function clamp(value, min, max) {
  const n = Number(value);
  return isFinite(n) ? Math.max(min, Math.min(max, n)) : min;
}

function normalizeValue(value, fallback = "N/A") {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string" && value.trim() === "") return fallback;
  return value;
}

function titleCase(text) {
  const s = String(normalizeValue(text, "N/A")).replace(/-/g, " ");
  if (s === "N/A") return s;
  return s.split(" ").filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function yesNo(value) {
  if (value === true)  return "Yes";
  if (value === false) return "No";
  return "N/A";
}

function formatDateTime(value) {
  if (!value) return "N/A";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "N/A";
  return d.toLocaleString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  }).replace(",", " at");
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
  let buf = [];

  const flush = () => {
    if (!buf.length) return;
    blocks.push({ type: "paragraph", text: stripMarkdown(buf.join(" ")) });
    buf = [];
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flush(); continue; }

    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) { flush(); blocks.push({ type: "heading", level: h[1].length, text: stripMarkdown(h[2]) }); continue; }

    const n = /^(\d+)\.\s+(.*)$/.exec(line);
    if (n) { flush(); blocks.push({ type: "list", marker: `${n[1]}.`, text: stripMarkdown(n[2]) }); continue; }

    const b = /^[-*]\s+(.*)$/.exec(line);
    if (b) { flush(); blocks.push({ type: "list", marker: "\u2022", text: stripMarkdown(b[1]) }); continue; }

    buf.push(line);
  }
  flush();
  return blocks;
}

function riskPalette(level) {
  if (level === "High")     return { strong: C.danger,  mid: C.dangerMid,  soft: C.dangerSoft  };
  if (level === "Moderate") return { strong: C.warning, mid: C.warningMid, soft: C.warningSoft };
  return                           { strong: C.success, mid: C.successMid, soft: C.successSoft };
}

// ─── Drawing primitives ─────────────────────────────────────────────────────────

const setRgb   = (doc, c) => doc.setTextColor(c[0], c[1], c[2]);
const setFill  = (doc, c) => doc.setFillColor(c[0], c[1], c[2]);
const setStroke= (doc, c) => doc.setDrawColor(c[0], c[1], c[2]);
const setFont  = (doc, size, style = "normal") => { doc.setFont(FONT, style); doc.setFontSize(size); };

function roundedRect(doc, x, y, w, h, r, mode = "F") {
  if (r > 0) doc.roundedRect(x, y, w, h, r, r, mode);
  else       doc.rect(x, y, w, h, mode);
}

function accentStripe(doc, x, y, h, color = C.accent) {
  setFill(doc, color);
  roundedRect(doc, x, y, 5, h, 2);
  // Square-off the right side of the stripe
  doc.rect(x + 2, y, 3, h, "F");
}

// ─── Context ──────────────────────────────────────────────────────────────────

function createCtx(doc, report) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const mx = 16;
  return { doc, report, W, H, mx, cw: W - mx * 2, bottomLimit: H - 20, y: 16 };
}

function ensureSpace(ctx, needed) {
  if (ctx.y + needed <= ctx.bottomLimit) return;
  ctx.doc.addPage();
  drawCompactHeader(ctx);
}

function wrappedText(ctx, str, opts = {}) {
  const {
    x = ctx.mx, width = ctx.cw,
    size = 9.8, style = "normal",
    color = C.textBody,
    lineHeight = 5,
    gapAfter = 0,
  } = opts;

  const val = stripMarkdown(str);
  if (!val) return;

  const lines = ctx.doc.splitTextToSize(val, width);
  setFont(ctx.doc, size, style);
  setRgb(ctx.doc, color);

  for (const line of lines) {
    ensureSpace(ctx, lineHeight);
    ctx.doc.text(line, x, ctx.y);
    ctx.y += lineHeight;
  }
  ctx.y += gapAfter;
}

// ─── Header ────────────────────────────────────────────────────────────────────

function drawHeader(ctx) {
  const { doc, mx, cw, W } = ctx;
  const hH = 44, hY = 12;

  // Background
  setFill(doc, C.brandDeep);
  roundedRect(doc, mx, hY, cw, hH, 4);

  // Left accent stripe
  accentStripe(doc, mx, hY, hH, C.accent);

  // "PRANAPPREDICT" logo treatment
  setFont(doc, 11, "bold");
  setRgb(doc, C.accent);
  doc.text("PRANA", mx + 11, hY + 11);
  const pranaW = doc.getTextWidth("PRANA");
  setRgb(doc, C.white);
  doc.text("PREDICT", mx + 11 + pranaW + 1, hY + 11);

  // Tagline
  setFont(doc, 7.5, "normal");
  doc.setTextColor(C.textOnDark[0], C.textOnDark[1], C.textOnDark[2]);
  doc.text("AI-POWERED HEALTH INTELLIGENCE", mx + 11, hY + 17);

  // Report title
  setFont(doc, 14, "bold");
  setRgb(doc, C.white);
  doc.text("Health Risk Assessment Report", mx + 11, hY + 28);

  // Date
  setFont(doc, 8.8, "normal");
  doc.setTextColor(C.textOnDark[0], C.textOnDark[1], C.textOnDark[2]);
  doc.text(formatDateTime(ctx.report.created_at), mx + 11, hY + 36);

  // Right — Report ID
  setFont(doc, 8, "bold");
  setRgb(doc, C.accent);
  doc.text("REPORT ID", W - mx, hY + 11, { align: "right" });

  setFont(doc, 9.5, "normal");
  setRgb(doc, C.white);
  doc.text(
    String(normalizeValue(ctx.report.id, "N/A")).slice(0, 8).toUpperCase(),
    W - mx, hY + 19, { align: "right" }
  );

  setFont(doc, 8, "normal");
  doc.setTextColor(C.textOnDark[0], C.textOnDark[1], C.textOnDark[2]);
  doc.text("Confidential · Personal Use Only", W - mx, hY + 30, { align: "right" });

  ctx.y = hY + hH + 8;
}

function drawCompactHeader(ctx) {
  const { doc, mx, cw, W } = ctx;

  setFill(doc, C.brandSoft);
  setStroke(doc, C.border);
  doc.setLineWidth(0.2);
  roundedRect(doc, mx, 10, cw, 11, 2, "FD");

  setFill(doc, C.brand);
  roundedRect(doc, mx, 10, 3, 11, 1);
  doc.rect(mx + 1.5, 10, 1.5, 11, "F");

  setFont(doc, 9, "bold");
  setRgb(doc, C.brand);
  doc.text("PranaPredict AI  \u00B7  Health Risk Assessment", mx + 7, 17);

  setFont(doc, 7.5, "normal");
  setRgb(doc, C.textMuted);
  doc.text(`ID: ${String(normalizeValue(ctx.report.id, "N/A")).slice(0, 8)}`, W - mx, 17, { align: "right" });

  ctx.y = 27;
}

// ─── Section title ─────────────────────────────────────────────────────────────

function sectionTitle(ctx, title, gapBefore = 6) {
  ctx.y += gapBefore;
  ensureSpace(ctx, 14);

  const { doc, mx, cw } = ctx;

  // Accent bar
  setFill(doc, C.accent);
  roundedRect(doc, mx, ctx.y - 5.5, 2.5, 8, 1);

  setFont(doc, 12.5, "bold");
  setRgb(doc, C.textStrong);
  doc.text(title, mx + 6, ctx.y);
  ctx.y += 3;

  // Underline
  setStroke(doc, C.borderLight);
  doc.setLineWidth(0.25);
  doc.line(mx + 6, ctx.y, mx + cw, ctx.y);
  ctx.y += 5;
}

// ─── Risk summary card ─────────────────────────────────────────────────────────

function drawRiskSummary(ctx) {
  const { doc, mx, cw } = ctx;
  const riskLevel = String(normalizeValue(ctx.report.risk_level, "Moderate"));
  const riskScore = clamp(ctx.report.risk_score, 0, 100);
  const pal = riskPalette(riskLevel);

  ensureSpace(ctx, 54);
  const y0 = ctx.y;

  // Card background
  setFill(doc, pal.soft);
  setStroke(doc, pal.mid);
  doc.setLineWidth(0.5);
  roundedRect(doc, mx, y0, cw, 48, 4, "FD");

  // Left accent stripe
  accentStripe(doc, mx, y0, 48, pal.strong);

  // Risk level label
  setFont(doc, 8.5, "bold");
  doc.setTextColor(pal.strong[0], pal.strong[1], pal.strong[2]);
  doc.text("CURRENT RISK LEVEL", mx + 10, y0 + 9);

  // Risk level value
  setFont(doc, 17, "bold");
  doc.setTextColor(pal.strong[0], pal.strong[1], pal.strong[2]);
  doc.text(`${riskLevel} Risk`, mx + 10, y0 + 19);

  // Subtitle
  setFont(doc, 8.5, "normal");
  setRgb(doc, C.textBody);
  doc.text("Calculated from medical history, lifestyle & biometric data", mx + 10, y0 + 26);

  // Progress bar — track
  const barX = mx + 10;
  const barY = y0 + 32;
  const barW = cw - 66;
  const barH = 6;

  setFill(doc, C.track);
  roundedRect(doc, barX, barY, barW, barH, 3);

  // Progress bar — fill (min 4mm so it's always visible)
  const fillW = Math.max(4, (riskScore / 100) * barW);
  setFill(doc, pal.strong);
  roundedRect(doc, barX, barY, fillW, barH, 3);

  // Tick marks at 25, 50, 75
  setStroke(doc, pal.soft);
  doc.setLineWidth(0.5);
  for (const pct of [25, 50, 75]) {
    const tickX = barX + (pct / 100) * barW;
    doc.line(tickX, barY + 1, tickX, barY + barH - 1);
  }

  // Bar labels
  setFont(doc, 7.2, "normal");
  setRgb(doc, C.textMuted);
  doc.text("0",   barX,           barY + barH + 4);
  doc.text("50",  barX + barW / 2, barY + barH + 4, { align: "center" });
  doc.text("100", barX + barW,     barY + barH + 4, { align: "right" });

  // Score box (right)
  const boxX = mx + cw - 46;
  const boxY = y0 + 7;
  setFill(doc, C.white);
  setStroke(doc, pal.mid);
  doc.setLineWidth(0.35);
  roundedRect(doc, boxX, boxY, 40, 34, 3, "FD");

  // Score number
  setFont(doc, 24, "bold");
  doc.setTextColor(pal.strong[0], pal.strong[1], pal.strong[2]);
  doc.text(String(riskScore), boxX + 20, boxY + 17, { align: "center" });

  setFont(doc, 7.5, "normal");
  setRgb(doc, C.textMuted);
  doc.text("out of 100", boxX + 20, boxY + 23, { align: "center" });

  // Short interpretation
  const hint = riskScore >= 70 ? "Consult a doctor soon"
             : riskScore >= 40 ? "Take preventive steps"
             :                   "Keep up healthy habits";
  setFont(doc, 7.5, "bold");
  doc.setTextColor(pal.strong[0], pal.strong[1], pal.strong[2]);
  doc.text(hint, boxX + 20, boxY + 30, { align: "center" });

  ctx.y = y0 + 54;
}

// ─── Metric cards (3-column) ──────────────────────────────────────────────────

function metricStatus(label, value) {
  if (label === "BMI") {
    const n = parseFloat(value);
    if (!isFinite(n)) return "neutral";
    if (n < 18.5 || n >= 30) return "danger";
    if (n >= 25)             return "warning";
    return "success";
  }
  if (label === "Smoking") return value === "Yes" ? "danger" : "success";
  if (label === "Activity") {
    const v = String(value).toLowerCase();
    if (v.includes("sedent"))   return "danger";
    if (v.includes("light"))    return "warning";
    if (v.includes("moderate")) return "warning";
    return "success";
  }
  return "neutral";
}

function statusDotColor(status) {
  return { success: C.success, warning: C.warning, danger: C.danger }[status] ?? null;
}

function drawCardGrid(ctx, items, statusFn = null) {
  const { doc, mx, cw } = ctx;
  const cols = 3, gap = 4, cardH = 17;
  const cardW = (cw - gap * (cols - 1)) / cols;
  const rows = Math.ceil(items.length / cols);

  ensureSpace(ctx, rows * (cardH + gap));
  const startY = ctx.y;

  items.forEach((m, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);

    // Page-break within a grid: if this row would overflow, start a new page
    if (row > 0 && col === 0) {
      const rowY = startY + row * (cardH + gap);
      if (rowY + cardH > ctx.bottomLimit) {
        ctx.doc.addPage();
        drawCompactHeader(ctx);
        // rebase remaining items
        const remaining = items.slice(i);
        drawCardGrid(ctx, remaining, statusFn);
        // update ctx.y to after the re-drawn grid
        return;
      }
    }

    const x = mx + col * (cardW + gap);
    const y = startY + row * (cardH + gap);
    const status = statusFn ? statusFn(m.label, m.value) : "neutral";
    const dotColor = statusDotColor(status);

    // Card
    setFill(doc, C.panel);
    setStroke(doc, C.border);
    doc.setLineWidth(0.2);
    roundedRect(doc, x, y, cardW, cardH, 2.5, "FD");

    // Top status bar
    if (dotColor) {
      setFill(doc, dotColor);
      roundedRect(doc, x, y, cardW, 2, 1.5);
      doc.rect(x, y + 1, cardW, 1, "F");
    }

    // Label
    setFont(doc, 7.8, "normal");
    setRgb(doc, C.textMuted);
    doc.text(m.label, x + 3, y + 8);

    // Value
    setFont(doc, 10.5, "bold");
    setRgb(doc, C.textStrong);
    doc.text(String(m.value), x + 3, y + 14);

    // Status dot (top-right)
    if (dotColor) {
      setFill(doc, dotColor);
      doc.circle(x + cardW - 5, y + 6, 1.8, "F");
    }
  });

  ctx.y = startY + rows * (cardH + gap) + 2;
}

function drawMetricCards(ctx) {
  sectionTitle(ctx, "Key Health Metrics");

  const metrics = [
    { label: "Age",            value: `${normalizeValue(ctx.report.age)} yrs` },
    { label: "BMI",            value: String(normalizeValue(ctx.report.bmi)) },
    { label: "Blood Pressure", value: normalizeValue(ctx.report.blood_pressure) },
    { label: "Cholesterol",    value: titleCase(ctx.report.cholesterol) },
    { label: "Smoking",        value: yesNo(ctx.report.smoking) },
    { label: "Activity Level", value: titleCase(ctx.report.activity_level) },
  ];

  drawCardGrid(ctx, metrics, metricStatus);
}

// ─── Lifestyle profile ─────────────────────────────────────────────────────────

function drawLifestyleProfile(ctx) {
  sectionTitle(ctx, "Lifestyle Profile");

  const items = [
    { label: "Location",     value: titleCase(ctx.report.location) },
    { label: "Work Type",    value: titleCase(ctx.report.work_type) },
    { label: "Diet",         value: titleCase(ctx.report.diet_type) },
    { label: "Alcohol",      value: titleCase(ctx.report.alcohol_consumption) },
    { label: "Water Intake", value: ctx.report.water_intake   != null ? `${ctx.report.water_intake} L/day`    : "N/A" },
    { label: "Sleep",        value: ctx.report.sleep_duration != null ? `${ctx.report.sleep_duration} hrs/day` : "N/A" },
  ];

  drawCardGrid(ctx, items, null);
}

// ─── Conditions — pill tags ─────────────────────────────────────────────────────

function drawConditions(ctx) {
  sectionTitle(ctx, "Pre-existing Conditions");
  ensureSpace(ctx, 14);

  const { doc, mx, cw } = ctx;

  const conditions = [
    { label: "Diabetes",      active: !!ctx.report.diabetes },
    { label: "Hypertension",  active: !!ctx.report.hypertension },
    { label: "Heart Disease", active: !!ctx.report.heart_disease },
    { label: "Kidney Disease",active: !!ctx.report.kidney_disease },
  ];

  const tagH = 9, tagGap = 4, tagPad = 6;
  let tagX = mx;

  for (const cond of conditions) {
    setFont(doc, 9, "bold");
    const tagW = doc.getTextWidth(cond.label) + tagPad * 2 + 5;

    if (tagX + tagW > mx + cw) {
      tagX = mx;
      ctx.y += tagH + 3;
      ensureSpace(ctx, tagH);
    }

    const bg     = cond.active ? C.dangerSoft : C.panel;
    const border = cond.active ? C.dangerMid  : C.border;
    const dot    = cond.active ? C.danger      : C.textMuted;
    const label  = cond.active ? C.danger      : C.textMuted;

    setFill(doc, bg);
    setStroke(doc, border);
    doc.setLineWidth(0.3);
    roundedRect(doc, tagX, ctx.y - 1, tagW, tagH, 2.5, "FD");

    setFill(doc, dot);
    doc.circle(tagX + 5, ctx.y + 3.5, 1.5, "F");

    setRgb(doc, label);
    doc.text(cond.label, tagX + 9, ctx.y + 5.5);

    tagX += tagW + tagGap;
  }

  ctx.y += tagH + 6;
}

// ─── AI Advice ─────────────────────────────────────────────────────────────────

function drawAdvice(ctx) {
  sectionTitle(ctx, "AI Health Advice");

  const blocks = parseAdviceBlocks(ctx.report.llm_advice);
  if (!blocks.length) {
    wrappedText(ctx, "No advice available for this report.", { color: C.textMuted });
    return;
  }

  for (const block of blocks) {
    if (block.type === "heading") {
      const size = block.level <= 1 ? 12 : block.level === 2 ? 11 : 10.2;
      ctx.y += 3;
      ensureSpace(ctx, 13);

      const { doc, mx, cw } = ctx;

      // Highlighted heading band
      setFill(doc, C.brandSoft);
      roundedRect(doc, mx, ctx.y - 5.5, cw, 8.5, 1.5);

      setFill(doc, C.brand);
      roundedRect(doc, mx, ctx.y - 5.5, 3, 8.5, 1);
      doc.rect(mx + 1.5, ctx.y - 5.5, 1.5, 8.5, "F");

      setFont(doc, size, "bold");
      setRgb(doc, C.brand);
      doc.text(block.text, mx + 7, ctx.y);
      ctx.y += 6;
      continue;
    }

    if (block.type === "list") {
      const textX = ctx.mx + 9;
      const textW = ctx.cw - 9;
      const lines = ctx.doc.splitTextToSize(block.text, textW);
      const itemH = lines.length * 4.9 + 2;

      ensureSpace(ctx, itemH);

      setFont(ctx.doc, 10, "bold");
      setRgb(ctx.doc, C.accent);
      ctx.doc.text(block.marker, ctx.mx + 2, ctx.y);

      setFont(ctx.doc, 9.8, "normal");
      setRgb(ctx.doc, C.textBody);
      for (const line of lines) {
        ctx.doc.text(line, textX, ctx.y);
        ctx.y += 4.9;
      }
      ctx.y += 1.5;
      continue;
    }

    wrappedText(ctx, block.text, { size: 9.8, lineHeight: 5, color: C.textBody, gapAfter: 2 });
  }
}

// ─── Disclaimer ─────────────────────────────────────────────────────────────────

function drawDisclaimer(ctx) {
  ctx.y += 6;
  ensureSpace(ctx, 16);

  const { doc, mx, cw } = ctx;

  setFill(doc, C.brandSoft);
  setStroke(doc, C.border);
  doc.setLineWidth(0.25);
  roundedRect(doc, mx, ctx.y, cw, 13, 2.5, "FD");

  accentStripe(doc, mx, ctx.y, 13, C.brand);

  setFont(doc, 9.5, "bold");
  setRgb(doc, C.textStrong);
  doc.text("Clinical Notice", mx + 9, ctx.y + 5.5);

  setFont(doc, 8.5, "normal");
  setRgb(doc, C.textMuted);
  doc.text(
    "This report is informational only and does not replace a licensed medical diagnosis or professional consultation.",
    mx + 9, ctx.y + 10.5
  );

  ctx.y += 17;
}

// ─── Footers ──────────────────────────────────────────────────────────────────

function applyFooters(ctx) {
  const { doc, W, H, mx } = ctx;
  const total = doc.getNumberOfPages();

  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    const fy = H - 9;

    setStroke(doc, C.border);
    doc.setLineWidth(0.25);
    doc.line(mx, fy - 4, W - mx, fy - 4);

    setFont(doc, 7.5, "normal");
    setRgb(doc, C.textMuted);
    doc.text(
      "PranaPredict AI  \u00B7  For informational purposes only  \u00B7  Not a medical diagnosis",
      mx, fy
    );
    doc.text(`Page ${p} of ${total}`, W - mx, fy, { align: "right" });
  }
}

// ─── Entry point ───────────────────────────────────────────────────────────────

export function generateHealthReportPdf(report) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const ctx = createCtx(doc, report);

  drawHeader(ctx);
  drawRiskSummary(ctx);
  drawMetricCards(ctx);
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