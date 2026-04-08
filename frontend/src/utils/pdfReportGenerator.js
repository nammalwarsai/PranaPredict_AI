import { jsPDF } from "jspdf";

const COLORS = {
  brand: [26, 77, 127],
  brandDeep: [15, 42, 67],
  brandSoft: [237, 243, 249],
  accent: [249, 115, 22],
  textStrong: [18, 38, 58],
  textBody: [44, 72, 99],
  textMuted: [90, 118, 146],
  border: [196, 214, 232],
  panel: [248, 251, 255],
  success: [22, 163, 74],
  warning: [217, 119, 6],
  danger: [220, 38, 38],
};

function getRiskPalette(level) {
  if (level === "High") {
    return {
      strong: COLORS.danger,
      soft: [254, 242, 242],
    };
  }

  if (level === "Moderate") {
    return {
      strong: COLORS.warning,
      soft: [255, 247, 237],
    };
  }

  return {
    strong: COLORS.success,
    soft: [240, 253, 244],
  };
}

function normalizeValue(value, fallback = "N/A") {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string" && value.trim() === "") return fallback;
  return value;
}

function titleCase(text) {
  const normalized = String(normalizeValue(text, "N/A")).replace(/-/g, " ");
  if (normalized === "N/A") return normalized;

  return normalized
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function yesNo(value) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "N/A";
}

function formatDateTime(value) {
  if (!value) return "N/A";

  return new Date(value)
    .toLocaleString("en-IN", {
      day: "numeric",
      month: "long",
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
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .trim();
}

function parseAdviceBlocks(advice) {
  const lines = String(advice || "").split(/\r?\n/);
  const blocks = [];
  let paragraphBuffer = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length === 0) return;
    blocks.push({
      type: "paragraph",
      text: stripMarkdown(paragraphBuffer.join(" ")),
    });
    paragraphBuffer = [];
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      return;
    }

    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(line);
    if (headingMatch) {
      flushParagraph();
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        text: stripMarkdown(headingMatch[2]),
      });
      return;
    }

    const numberedMatch = /^(\d+)\.\s+(.*)$/.exec(line);
    if (numberedMatch) {
      flushParagraph();
      blocks.push({
        type: "list",
        marker: `${numberedMatch[1]}.`,
        text: stripMarkdown(numberedMatch[2]),
      });
      return;
    }

    const bulletMatch = /^[-*]\s+(.*)$/.exec(line);
    if (bulletMatch) {
      flushParagraph();
      blocks.push({
        type: "list",
        marker: "-",
        text: stripMarkdown(bulletMatch[1]),
      });
      return;
    }

    paragraphBuffer.push(line);
  });

  flushParagraph();
  return blocks;
}

function createContext(doc, report) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 16;

  return {
    doc,
    report,
    pageWidth,
    pageHeight,
    marginX,
    contentWidth: pageWidth - marginX * 2,
    bottomLimit: pageHeight - 18,
    y: 16,
  };
}

function setColor(doc, rgb) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
}

function ensureSpace(ctx, requiredHeight) {
  if (ctx.y + requiredHeight <= ctx.bottomLimit) return;

  ctx.doc.addPage();
  drawHeader(ctx, true);
}

function drawWrappedText(ctx, text, options = {}) {
  const {
    x = ctx.marginX,
    width = ctx.contentWidth,
    font = "helvetica",
    style = "normal",
    size = 10,
    color = COLORS.textBody,
    lineHeight = 4.8,
    gapAfter = 0,
  } = options;

  const value = stripMarkdown(text);
  if (!value) return;

  const lines = ctx.doc.splitTextToSize(value, width);
  ctx.doc.setFont(font, style);
  ctx.doc.setFontSize(size);
  setColor(ctx.doc, color);

  lines.forEach((line) => {
    ensureSpace(ctx, lineHeight);
    ctx.doc.text(line, x, ctx.y);
    ctx.y += lineHeight;
  });

  ctx.y += gapAfter;
}

function drawHeader(ctx, compact = false) {
  const { doc, marginX, contentWidth, pageWidth } = ctx;

  if (compact) {
    doc.setFillColor(COLORS.brandSoft[0], COLORS.brandSoft[1], COLORS.brandSoft[2]);
    doc.roundedRect(marginX, 10, contentWidth, 12, 2, 2, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    setColor(doc, COLORS.brand);
    doc.text("PranaPredict AI Health Risk Assessment Report", marginX + 3, 17);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setColor(doc, COLORS.textMuted);
    doc.text(`Report ID: ${String(normalizeValue(ctx.report.id, "N/A")).slice(0, 8)}`, pageWidth - marginX, 17, {
      align: "right",
    });

    ctx.y = 28;
    return;
  }

  doc.setFillColor(COLORS.brandDeep[0], COLORS.brandDeep[1], COLORS.brandDeep[2]);
  doc.roundedRect(marginX, 12, contentWidth, 38, 4, 4, "F");

  doc.setFillColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
  doc.roundedRect(marginX, 12, 5, 38, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text("PranaPredict AI", marginX + 10, 26);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12.2);
  doc.text("Health Risk Assessment Report", marginX + 10, 34);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.2);
  doc.text(formatDateTime(ctx.report.created_at), marginX + 10, 42);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.8);
  doc.text(`Report ID: ${String(normalizeValue(ctx.report.id, "N/A")).slice(0, 8)}`, pageWidth - marginX, 26, {
    align: "right",
  });

  doc.text("Confidential health profile for personal use", pageWidth - marginX, 34, {
    align: "right",
  });

  ctx.y = 58;
}

function drawSectionTitle(ctx, title) {
  ensureSpace(ctx, 12);

  ctx.doc.setFillColor(COLORS.brand[0], COLORS.brand[1], COLORS.brand[2]);
  ctx.doc.roundedRect(ctx.marginX, ctx.y - 4.5, 2.4, 7, 1, 1, "F");

  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.setFontSize(12.5);
  setColor(ctx.doc, COLORS.textStrong);
  ctx.doc.text(title, ctx.marginX + 5, ctx.y);

  ctx.y += 6;
}

function drawRiskSummary(ctx) {
  const { doc, marginX, contentWidth } = ctx;
  const riskLevel = normalizeValue(ctx.report.risk_level, "Moderate");
  const riskScore = Number(ctx.report.risk_score ?? 0);
  const riskPalette = getRiskPalette(riskLevel);

  ensureSpace(ctx, 40);

  doc.setFillColor(riskPalette.soft[0], riskPalette.soft[1], riskPalette.soft[2]);
  doc.setDrawColor(riskPalette.strong[0], riskPalette.strong[1], riskPalette.strong[2]);
  doc.roundedRect(marginX, ctx.y, contentWidth, 34, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  setColor(doc, COLORS.textMuted);
  doc.text("Current Risk Snapshot", marginX + 4, ctx.y + 8);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  setColor(doc, riskPalette.strong);
  doc.text(`${riskLevel} Risk`, marginX + 4, ctx.y + 17);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.3);
  setColor(doc, COLORS.textBody);
  doc.text("AI-generated score from medical, lifestyle and preventive markers", marginX + 4, ctx.y + 24);

  const scoreBoxWidth = 42;
  const scoreX = marginX + contentWidth - scoreBoxWidth - 4;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(scoreX, ctx.y + 5, scoreBoxWidth, 24, 3, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  setColor(doc, riskPalette.strong);
  doc.text(`${riskScore}`, scoreX + scoreBoxWidth / 2, ctx.y + 16, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.8);
  setColor(doc, COLORS.textMuted);
  doc.text("out of 100", scoreX + scoreBoxWidth / 2, ctx.y + 23, { align: "center" });

  ctx.y += 40;
}

function drawMetricCards(ctx) {
  const { doc, marginX, contentWidth } = ctx;

  const metrics = [
    { label: "Age", value: `${normalizeValue(ctx.report.age)} years` },
    { label: "BMI", value: `${normalizeValue(ctx.report.bmi)}` },
    { label: "Blood Pressure", value: normalizeValue(ctx.report.blood_pressure) },
    { label: "Cholesterol", value: titleCase(ctx.report.cholesterol) },
    { label: "Smoking", value: yesNo(ctx.report.smoking) },
    { label: "Activity", value: titleCase(ctx.report.activity_level) },
  ];

  const cardGap = 5;
  const cardHeight = 14;
  const cardWidth = (contentWidth - cardGap) / 2;
  const rows = Math.ceil(metrics.length / 2);

  drawSectionTitle(ctx, "Key Health Metrics");
  ensureSpace(ctx, rows * (cardHeight + 3) + 2);

  const startY = ctx.y;

  metrics.forEach((metric, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = marginX + col * (cardWidth + cardGap);
    const y = startY + row * (cardHeight + 3);

    doc.setFillColor(COLORS.panel[0], COLORS.panel[1], COLORS.panel[2]);
    doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
    doc.roundedRect(x, y, cardWidth, cardHeight, 2.2, 2.2, "FD");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    setColor(doc, COLORS.textMuted);
    doc.text(metric.label, x + 3, y + 4.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    setColor(doc, COLORS.textStrong);
    doc.text(String(metric.value), x + 3, y + 10.5);
  });

  ctx.y = startY + rows * (cardHeight + 3);
}

function drawDetailedSummary(ctx) {
  const details = [
    { label: "Location", value: titleCase(ctx.report.location) },
    { label: "Work Type", value: titleCase(ctx.report.work_type) },
    { label: "Diet Type", value: titleCase(ctx.report.diet_type) },
    { label: "Alcohol", value: titleCase(ctx.report.alcohol_consumption) },
    {
      label: "Water Intake",
      value: ctx.report.water_intake === null || ctx.report.water_intake === undefined
        ? "N/A"
        : `${ctx.report.water_intake} L/day`,
    },
    {
      label: "Sleep Duration",
      value: ctx.report.sleep_duration === null || ctx.report.sleep_duration === undefined
        ? "N/A"
        : `${ctx.report.sleep_duration} hrs/day`,
    },
    { label: "Diabetes", value: yesNo(ctx.report.diabetes) },
    { label: "Hypertension", value: yesNo(ctx.report.hypertension) },
    { label: "Heart Disease", value: yesNo(ctx.report.heart_disease) },
    { label: "Kidney Disease", value: yesNo(ctx.report.kidney_disease) },
  ];

  const rowHeight = 8.2;
  const rows = Math.ceil(details.length / 2);

  drawSectionTitle(ctx, "Detailed Health Profile");
  ensureSpace(ctx, rows * rowHeight + 8);

  const startY = ctx.y;
  const leftX = ctx.marginX;
  const colWidth = ctx.contentWidth / 2;

  details.forEach((item, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = leftX + col * colWidth;
    const y = startY + row * rowHeight;

    ctx.doc.setFont("helvetica", "normal");
    ctx.doc.setFontSize(8.7);
    setColor(ctx.doc, COLORS.textMuted);
    ctx.doc.text(item.label, x, y);

    ctx.doc.setFont("helvetica", "bold");
    ctx.doc.setFontSize(10);
    setColor(ctx.doc, COLORS.textStrong);
    ctx.doc.text(String(item.value), x, y + 4.4);
  });

  ctx.y = startY + rows * rowHeight + 2;
}

function drawConditions(ctx) {
  drawSectionTitle(ctx, "Pre-existing Conditions");

  const conditions = [
    ctx.report.diabetes ? "Diabetes" : null,
    ctx.report.hypertension ? "Hypertension" : null,
    ctx.report.heart_disease ? "Heart Disease" : null,
    ctx.report.kidney_disease ? "Kidney Disease" : null,
  ].filter(Boolean);

  ensureSpace(ctx, 11);

  ctx.doc.setFillColor(COLORS.panel[0], COLORS.panel[1], COLORS.panel[2]);
  ctx.doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
  ctx.doc.roundedRect(ctx.marginX, ctx.y, ctx.contentWidth, 9, 2, 2, "FD");

  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.setFontSize(9.8);
  setColor(ctx.doc, COLORS.textStrong);
  ctx.doc.text(conditions.length > 0 ? conditions.join(", ") : "None", ctx.marginX + 3, ctx.y + 5.8);

  ctx.y += 13;
}

function drawAdvice(ctx) {
  drawSectionTitle(ctx, "AI Health Advice");

  const blocks = parseAdviceBlocks(ctx.report.llm_advice);
  if (blocks.length === 0) {
    drawWrappedText(ctx, "No advice available for this report.", {
      size: 10,
      color: COLORS.textBody,
    });
    return;
  }

  blocks.forEach((block) => {
    if (block.type === "heading") {
      const size = block.level <= 1 ? 12 : block.level === 2 ? 11.2 : 10.5;
      ensureSpace(ctx, 9);

      ctx.doc.setFont("helvetica", "bold");
      ctx.doc.setFontSize(size);
      setColor(ctx.doc, COLORS.brand);
      ctx.doc.text(block.text, ctx.marginX, ctx.y);
      ctx.y += 6;
      return;
    }

    if (block.type === "list") {
      const markerX = ctx.marginX;
      const textX = ctx.marginX + 7;
      const textWidth = ctx.contentWidth - 7;
      const lines = ctx.doc.splitTextToSize(block.text, textWidth);
      const itemHeight = lines.length * 4.7 + 1;

      ensureSpace(ctx, itemHeight);

      ctx.doc.setFont("helvetica", "bold");
      ctx.doc.setFontSize(9.6);
      setColor(ctx.doc, COLORS.brand);
      ctx.doc.text(block.marker, markerX, ctx.y);

      ctx.doc.setFont("helvetica", "normal");
      ctx.doc.setFontSize(9.7);
      setColor(ctx.doc, COLORS.textBody);

      lines.forEach((line) => {
        ctx.doc.text(line, textX, ctx.y);
        ctx.y += 4.7;
      });

      ctx.y += 1;
      return;
    }

    drawWrappedText(ctx, block.text, {
      size: 9.8,
      lineHeight: 4.9,
      color: COLORS.textBody,
      gapAfter: 1.5,
    });
  });
}

function drawDisclaimer(ctx) {
  ensureSpace(ctx, 16);

  ctx.doc.setFillColor(COLORS.brandSoft[0], COLORS.brandSoft[1], COLORS.brandSoft[2]);
  ctx.doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
  ctx.doc.roundedRect(ctx.marginX, ctx.y, ctx.contentWidth, 12, 2, 2, "FD");

  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.setFontSize(9.2);
  setColor(ctx.doc, COLORS.textStrong);
  ctx.doc.text("Clinical Notice", ctx.marginX + 3, ctx.y + 4.5);

  ctx.doc.setFont("helvetica", "normal");
  ctx.doc.setFontSize(8.6);
  setColor(ctx.doc, COLORS.textMuted);
  ctx.doc.text(
    "This report is informational and preventive in nature. It does not replace a licensed medical diagnosis.",
    ctx.marginX + 3,
    ctx.y + 9
  );

  ctx.y += 16;
}

function applyFooters(ctx) {
  const { doc, pageWidth, pageHeight, marginX } = ctx;
  const totalPages = doc.getNumberOfPages();

  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);

    const footerY = pageHeight - 9;
    doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
    doc.setLineWidth(0.2);
    doc.line(marginX, footerY - 4, pageWidth - marginX, footerY - 4);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setColor(doc, COLORS.textMuted);
    doc.text("Generated by PranaPredict AI - For informational purposes only. Not a medical diagnosis.", marginX, footerY);

    doc.text(`Page ${page} of ${totalPages}`, pageWidth - marginX, footerY, { align: "right" });
  }
}

export function generateHealthReportPdf(report) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const ctx = createContext(doc, report);

  drawHeader(ctx, false);
  drawRiskSummary(ctx);
  drawMetricCards(ctx);
  drawDetailedSummary(ctx);
  drawConditions(ctx);
  drawAdvice(ctx);
  drawDisclaimer(ctx);
  applyFooters(ctx);

  const datePart = report?.created_at
    ? new Date(report.created_at).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  const riskPart = String(normalizeValue(report?.risk_level, "Report")).replace(/\s+/g, "");

  doc.save(`PranaPredict_Report_${riskPart}_${datePart}.pdf`);
}
