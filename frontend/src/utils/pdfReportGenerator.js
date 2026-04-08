import { jsPDF } from "jspdf";
import "jspdf-autotable"; // Add this dependency

// Enhanced color system with semantic meaning
const THEME = {
  primary: { main: [26, 77, 127], light: [237, 243, 249], dark: [15, 42, 67] },
  accent: { main: [249, 115, 22], light: [255, 247, 237] },
  risk: {
    low: { main: [22, 163, 74], bg: [240, 253, 244], gradient: [[34, 197, 94], [22, 163, 74]] },
    moderate: { main: [217, 119, 6], bg: [255, 247, 237], gradient: [[251, 191, 36], [217, 119, 6]] },
    high: { main: [220, 38, 38], bg: [254, 242, 242], gradient: [ [248, 113, 113], [220, 38, 38]] }
  },
  text: { primary: [18, 38, 58], secondary: [44, 72, 99], muted: [90, 118, 146] },
  ui: { border: [196, 214, 232], surface: [248, 251, 255], white: [255, 255, 255] }
};

// Medical icon mapping using emoji (or swap for custom PNGs)
const ICONS = {
  heart: "❤️",
  activity: "📊",
  warning: "⚠️",
  calendar: "📅",
  user: "👤",
  stethoscope: "🩺",
  pill: "💊",
  drop: "💧",
  moon: "🌙",
  food: "🥗"
};

class HealthReportPDF {
  constructor(report) {
    this.report = report;
    this.doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 16;
    this.contentWidth = this.pageWidth - (this.margin * 2);
    this.y = 0;
    
    // Set PDF metadata for medical compliance
    this.doc.setProperties({
      title: `Health Risk Assessment - ${report.patientName || 'Patient'}`,
      subject: "Medical Risk Assessment Report",
      author: "PranaPredict AI",
      keywords: "health, risk assessment, medical, AI",
      creator: "PranaPredict AI System"
    });
    
    this.initFonts();
  }

  initFonts() {
    // Load custom medical-grade fonts if available
    this.doc.setFont("helvetica");
    this.primaryFont = "helvetica";
  }

  // Color utilities
  color(rgb) { return Array.isArray(rgb) ? rgb : THEME.primary.main; }
  setFillColor(rgb) { const c = this.color(rgb); this.doc.setFillColor(c[0], c[1], c[2]); }
  setDrawColor(rgb) { const c = this.color(rgb); this.doc.setDrawColor(c[0], c[1], c[2]); }
  setTextColor(rgb) { const c = this.color(rgb); this.doc.setTextColor(c[0], c[1], c[2]); }

  // Layout utilities with smart page breaks
  checkPageBreak(heightNeeded, triggerNewPage = true) {
    if (this.y + heightNeeded > this.pageHeight - 20) {
      if (triggerNewPage) {
        this.addPage();
        return true;
      }
    }
    return false;
  }

  addPage() {
    this.doc.addPage();
    this.y = this.margin;
    this.renderHeader(true);
  }

  // Enhanced header with gradient simulation
  renderHeader(compact = false) {
    const { doc, margin, contentWidth, pageWidth } = this;
    
    if (compact) {
      // Compact running header
      doc.setFillColor(THEME.ui.surface[0], THEME.ui.surface[1], THEME.ui.surface[2]);
      doc.roundedRect(margin, 8, contentWidth, 10, 1.5, 1.5, "F");
      
      doc.setFont(this.primaryFont, "bold");
      doc.setFontSize(9);
      this.setTextColor(THEME.primary.main);
      doc.text("PranaPredict AI | Health Risk Assessment", margin + 3, 14.5);
      
      doc.setFont(this.primaryFont, "normal");
      this.setTextColor(THEME.text.muted);
      doc.text(`ID: ${this.truncate(this.report.id, 8)}`, pageWidth - margin, 14.5, { align: "right" });
      
      this.y = 22;
    } else {
      // Full first-page header with gradient bands
      const headerHeight = 45;
      
      // Main dark band
      doc.setFillColor(THEME.primary.dark[0], THEME.primary.dark[1], THEME.primary.dark[2]);
      doc.roundedRect(margin, 12, contentWidth, headerHeight, 3, 3, "F");
      
      // Accent stripe
      doc.setFillColor(THEME.accent.main[0], THEME.accent.main[1], THEME.accent.main[2]);
      doc.rect(margin, 12, 1.5, headerHeight, "F");
      
      // Logo area
      doc.setFont(this.primaryFont, "bold");
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text("PranaPredict AI", margin + 6, 28);
      
      doc.setFontSize(11);
      doc.text("Health Risk Assessment Report", margin + 6, 36);
      
      // Metadata grid
      doc.setFontSize(8.5);
      doc.setTextColor(200, 220, 240);
      const dateStr = this.formatDate(this.report.created_at);
      doc.text(`${ICONS.calendar} Generated: ${dateStr}`, margin + 6, 44);
      
      // Patient info box
      const infoBoxX = pageWidth - margin - 60;
      doc.setFillColor(255, 255, 255, 0.1); // Transparent white
      doc.roundedRect(infoBoxX, 20, 55, 32, 2, 2, "F");
      
      doc.setFont(this.primaryFont, "bold");
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text("PATIENT", infoBoxX + 5, 28);
      
      doc.setFontSize(11);
      doc.text(this.report.patientName || "Anonymous", infoBoxX + 5, 35);
      
      doc.setFontSize(8);
      doc.setTextColor(180, 200, 220);
      doc.text(`Age: ${this.report.age || 'N/A'} | BMI: ${this.report.bmi || 'N/A'}`, infoBoxX + 5, 42);
      
      this.y = 65;
    }
  }

  // Visual Risk Gauge (semicircle chart)
  renderRiskGauge() {
    const { doc, margin, contentWidth } = this;
    const riskLevel = (this.report.risk_level || "low").toLowerCase();
    const score = Number(this.report.risk_score || 0);
    const palette = THEME.risk[riskLevel] || THEME.risk.low;
    
    const boxHeight = 50;
    const centerX = margin + contentWidth / 2;
    const centerY = this.y + 35;
    const radius = 22;
    
    // Background container
    doc.setFillColor(palette.bg[0], palette.bg[1], palette.bg[2]);
    doc.setDrawColor(palette.main[0], palette.main[1], palette.main[2]);
    doc.roundedRect(margin, this.y, contentWidth, boxHeight, 4, 4, "FD");
    
    // Draw gauge background arc
    doc.setDrawColor(THEME.ui.border[0], THEME.ui.border[1], THEME.ui.border[2]);
    doc.setLineWidth(3);
    this.drawArc(centerX, centerY, radius, Math.PI, 0);
    
    // Draw value arc with color based on risk
    doc.setDrawColor(palette.main[0], palette.main[1], palette.main[2]);
    const endAngle = Math.PI + (Math.PI * (score / 100));
    this.drawArc(centerX, centerY, radius, Math.PI, endAngle);
    doc.setLineWidth(0.2); // Reset
    
    // Center text
    doc.setFont(this.primaryFont, "bold");
    doc.setFontSize(24);
    this.setTextColor(palette.main);
    doc.text(String(score), centerX, centerY + 3, { align: "center" });
    
    doc.setFontSize(8);
    this.setTextColor(THEME.text.muted);
    doc.text("RISK SCORE", centerX, centerY - 8, { align: "center" });
    doc.text("out of 100", centerX, centerY + 10, { align: "center" });
    
    // Risk level label right side
    const labelX = margin + contentWidth - 45;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(labelX, this.y + 12, 40, 26, 2, 2, "F");
    
    doc.setFont(this.primaryFont, "bold");
    doc.setFontSize(14);
    this.setTextColor(palette.main);
    doc.text(riskLevel.toUpperCase(), labelX + 20, this.y + 22, { align: "center" });
    
    doc.setFontSize(8);
    this.setTextColor(THEME.text.muted);
    doc.text("Risk Level", labelX + 20, this.y + 30, { align: "center" });
    
    // Left side context
    doc.setFontSize(9);
    this.setTextColor(THEME.text.secondary);
    doc.text(`${ICONS.warning} AI-generated assessment`, margin + 5, this.y + 20);
    doc.text("based on medical, lifestyle", margin + 5, this.y + 26);
    doc.text("and preventive markers", margin + 5, this.y + 32);
    
    this.y += boxHeight + 8;
  }

  drawArc(x, y, r, startAngle, endAngle) {
    const { doc } = this;
    const steps = 30;
    const angleStep = (endAngle - startAngle) / steps;
    
    for (let i = 0; i < steps; i++) {
      const angle1 = startAngle + (i * angleStep);
      const angle2 = startAngle + ((i + 1) * angleStep);
      doc.line(
        x + Math.cos(angle1) * r,
        y + Math.sin(angle1) * r,
        x + Math.cos(angle2) * r,
        y + Math.sin(angle2) * r
      );
    }
  }

  // Enhanced metrics with icons and trends
  renderVitalGrid() {
    const vitals = [
      { icon: ICONS.user, label: "Age", value: `${this.report.age || 'N/A'}`, unit: "years", trend: null },
      { icon: ICONS.activity, label: "BMI", value: `${this.report.bmi || 'N/A'}`, unit: "kg/m²", trend: this.getBMITrend(this.report.bmi) },
      { icon: ICONS.heart, label: "Blood Pressure", value: this.report.blood_pressure || 'N/A', unit: "mmHg", trend: null },
      { icon: ICONS.pill, label: "Cholesterol", value: this.titleCase(this.report.cholesterol), unit: "", trend: null },
      { icon: "🚬", label: "Smoking", value: this.report.smoking ? "Yes" : "No", unit: "", status: this.report.smoking ? "warning" : "good" },
      { icon: "🏃", label: "Activity", value: this.titleCase(this.report.activity_level), unit: "", trend: null }
    ];

    this.renderSectionTitle(`${ICONS.activity} Key Health Metrics`);
    
    // 3-column grid
    const cols = 3;
    const colWidth = (this.contentWidth - (cols - 1) * 4) / cols;
    const cardHeight = 22;
    
    vitals.forEach((vital, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = this.margin + col * (colWidth + 4);
      const y = this.y + row * (cardHeight + 4);
      
      // Card background
      const bgColor = vital.status === 'warning' ? THEME.risk.high.bg : THEME.ui.surface;
      const borderColor = vital.status === 'warning' ? THEME.risk.high.main : THEME.ui.border;
      
      this.setFillColor(bgColor);
      this.setDrawColor(borderColor);
      this.doc.roundedRect(x, y, colWidth, cardHeight, 2, 2, "FD");
      
      // Icon
      this.doc.setFontSize(10);
      this.doc.text(vital.icon, x + 3, y + 5);
      
      // Label
      this.doc.setFont(this.primaryFont, "normal");
      this.doc.setFontSize(7.5);
      this.setTextColor(THEME.text.muted);
      this.doc.text(vital.label.toUpperCase(), x + 3, y + 10);
      
      // Value
      this.doc.setFont(this.primaryFont, "bold");
      this.doc.setFontSize(11);
      this.setTextColor(THEME.text.primary);
      this.doc.text(vital.value, x + 3, y + 16);
      
      if (vital.unit) {
        this.doc.setFontSize(7);
        this.setTextColor(THEME.text.muted);
        this.doc.text(vital.unit, x + 3 + this.doc.getTextWidth(vital.value) + 1, y + 16);
      }
      
      // Trend indicator
      if (vital.trend) {
        const trendColor = vital.trend === 'up' ? THEME.risk.high.main : THEME.risk.low.main;
        this.doc.setTextColor(trendColor);
        this.doc.text(vital.trend === 'up' ? '↑' : '↓', x + colWidth - 6, y + 16);
      }
    });
    
    const rows = Math.ceil(vitals.length / cols);
    this.y += rows * (cardHeight + 4) + 4;
  }

  // Professional medical table using autoTable
  renderMedicalHistory() {
    this.renderSectionTitle(`${ICONS.stethoscope} Detailed Health Profile`);
    
    const details = [
      ["Location", this.titleCase(this.report.location)],
      ["Work Type", this.titleCase(this.report.work_type)],
      ["Diet Type", `${ICONS.food} ${this.titleCase(this.report.diet_type)}`],
      ["Alcohol", this.titleCase(this.report.alcohol_consumption)],
      ["Water Intake", `${ICONS.drop} ${this.report.water_intake || 'N/A'} L/day`],
      ["Sleep", `${ICONS.moon} ${this.report.sleep_duration || 'N/A'} hrs/day`],
      ["Diabetes", this.formatCondition(this.report.diabetes)],
      ["Hypertension", this.formatCondition(this.report.hypertension)],
      ["Heart Disease", this.formatCondition(this.report.heart_disease)],
      ["Kidney Disease", this.formatCondition(this.report.kidney_disease)]
    ];

    this.doc.autoTable({
      startY: this.y,
      margin: { left: this.margin, right: this.margin },
      tableWidth: this.contentWidth,
      body: details,
      theme: 'grid',
      styles: { 
        font: this.primaryFont, 
        fontSize: 9,
        cellPadding: 3,
        lineColor: THEME.ui.border,
        lineWidth: 0.2
      },
      columnStyles: {
        0: { fontStyle: 'bold', textColor: THEME.text.muted, fillColor: THEME.ui.surface },
        1: { textColor: THEME.text.primary }
      },
      alternateRowStyles: { fillColor: false }
    });
    
    this.y = this.doc.lastAutoTable.finalY + 6;
  }

  // AI Advice with better markdown parsing
  renderMedicalAdvice() {
    this.renderSectionTitle(`${ICONS.stethoscope} Clinical Recommendations`);
    
    const advice = this.report.llm_advice || "No specific recommendations available.";
    const blocks = this.parseStructuredAdvice(advice);
    
    blocks.forEach((block, idx) => {
      this.checkPageBreak(20);
      
      if (block.type === 'heading') {
        this.doc.setFont(this.primaryFont, "bold");
        this.doc.setFontSize(block.level === 1 ? 12 : 11);
        this.setTextColor(THEME.primary.main);
        this.doc.text(block.text, this.margin, this.y);
        this.y += 6;
      } 
      else if (block.type === 'priority') {
        // Priority callout box
        const boxHeight = 12;
        this.setFillColor(THEME.accent.light);
        this.setDrawColor(THEME.accent.main);
        this.doc.roundedRect(this.margin, this.y, this.contentWidth, boxHeight, 2, 2, "FD");
        
        this.doc.setFont(this.primaryFont, "bold");
        this.doc.setFontSize(9);
        this.setTextColor(THEME.accent.main);
        this.doc.text(`${ICONS.warning} HIGH PRIORITY`, this.margin + 3, this.y + 5);
        
        this.doc.setFont(this.primaryFont, "normal");
        this.setTextColor(THEME.text.secondary);
        this.doc.text(block.text, this.margin + 3, this.y + 9);
        
        this.y += boxHeight + 4;
      }
      else if (block.type === 'list') {
        const lines = this.doc.splitTextToSize(block.text, this.contentWidth - 8);
        const itemHeight = lines.length * 4.5 + 2;
        
        this.checkPageBreak(itemHeight);
        
        // Bullet
        this.doc.setFont(this.primaryFont, "bold");
        this.doc.setFontSize(10);
        this.setTextColor(THEME.primary.main);
        this.doc.text("▸", this.margin, this.y + 3);
        
        // Text
        this.doc.setFont(this.primaryFont, "normal");
        this.doc.setFontSize(9.5);
        this.setTextColor(THEME.text.secondary);
        
        lines.forEach((line, i) => {
          this.doc.text(line, this.margin + 5, this.y + 3 + (i * 4.5));
        });
        
        this.y += itemHeight;
      }
      else {
        // Paragraph
        const lines = this.doc.splitTextToSize(block.text, this.contentWidth);
        this.doc.setFont(this.primaryFont, "normal");
        this.doc.setFontSize(9.5);
        this.setTextColor(THEME.text.secondary);
        
        lines.forEach(line => {
          this.checkPageBreak(5);
          this.doc.text(line, this.margin, this.y);
          this.y += 4.5;
        });
        this.y += 2;
      }
    });
  }

  // Professional footer with page management
  renderFooter() {
    const totalPages = this.doc.getNumberOfPages();
    
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      
      // Footer line
      this.setDrawColor(THEME.ui.border);
      this.doc.setLineWidth(0.3);
      this.doc.line(this.margin, this.pageHeight - 12, this.pageWidth - this.margin, this.pageHeight - 12);
      
      // Left: Disclaimer
      this.doc.setFont(this.primaryFont, "normal");
      this.doc.setFontSize(7.5);
      this.setTextColor(THEME.text.muted);
      this.doc.text(
        "Confidential Medical Document | Generated by PranaPredict AI | Not a substitute for professional medical advice", 
        this.margin, 
        this.pageHeight - 6
      );
      
      // Right: Page numbers
      this.doc.text(`Page ${i} of ${totalPages}`, this.pageWidth - this.margin, this.pageHeight - 6, { align: "right" });
      
      // Watermark on each page
      if (i > 1) {
        this.doc.setFontSize(40);
        this.doc.setTextColor(230, 240, 250);
        this.doc.text("PRANAPREDICT", this.pageWidth / 2, this.pageHeight / 2, { 
          align: "center",
          angle: 45
        });
      }
    }
  }

  // Utility methods
  renderSectionTitle(title) {
    this.checkPageBreak(12);
    
    this.doc.setFont(this.primaryFont, "bold");
    this.doc.setFontSize(12);
    this.setTextColor(THEME.primary.main);
    this.doc.text(title, this.margin, this.y);
    
    // Underline
    this.setDrawColor(THEME.accent.main);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.y + 2, this.margin + this.doc.getTextWidth(title), this.y + 2);
    
    this.y += 8;
  }

  parseStructuredAdvice(advice) {
    const lines = String(advice).split(/\r?\n/);
    const blocks = [];
    let currentPara = [];
    
    const flushPara = () => {
      if (currentPara.length) {
        blocks.push({ type: 'paragraph', text: this.stripMarkdown(currentPara.join(" ")) });
        currentPara = [];
      }
    };
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) {
        flushPara();
        return;
      }
      
      // Priority markers [!] or IMPORTANT:
      if (trimmed.match(/^!+|^important:|^priority:/i)) {
        flushPara();
        blocks.push({ type: 'priority', text: trimmed.replace(/^!+\s*|^important:\s*|^priority:\s*/i, '') });
        return;
      }
      
      // Headers
      const headerMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
      if (headerMatch) {
        flushPara();
        blocks.push({ type: 'heading', level: headerMatch[1].length, text: headerMatch[2] });
        return;
      }
      
      // Numbered lists with medical indicators
      const numMatch = trimmed.match(/^(\d+)[.)]\s+(.+)$/);
      if (numMatch) {
        flushPara();
        blocks.push({ type: 'list', marker: numMatch[1], text: numMatch[2] });
        return;
      }
      
      // Bullet points
      if (trimmed.match(/^[-*•]\s+/)) {
        flushPara();
        blocks.push({ type: 'list', marker: '•', text: trimmed.replace(/^[-*•]\s+/, '') });
        return;
      }
      
      currentPara.push(trimmed);
    });
    
    flushPara();
    return blocks;
  }

  stripMarkdown(text) {
    return String(text)
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/`(.+?)`/g, '$1')
      .replace(/\[(.+?)\]\((.+?)\)/g, '$1')
      .trim();
  }

  formatDate(date) {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric", month: "long", year: "numeric"
    });
  }

  titleCase(str) {
    if (!str) return "N/A";
    return String(str).replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  }

  truncate(str, len) {
    return String(str || "").slice(0, len);
  }

  formatCondition(val) {
    if (val === true) return "Yes ⚠️";
    if (val === false) return "No ✓";
    return "N/A";
  }

  getBMITrend(bmi) {
    if (!bmi) return null;
    const num = parseFloat(bmi);
    if (num > 25) return 'up';
    if (num < 18.5) return 'down';
    return null;
  }

  // Main generation method
  generate() {
    try {
      this.renderHeader(false);
      this.renderRiskGauge();
      this.renderVitalGrid();
      this.renderMedicalHistory();
      this.renderMedicalAdvice();
      this.renderFooter();
      
      // Save with sanitized filename
      const date = new Date().toISOString().slice(0, 10);
      const risk = (this.report.risk_level || "unknown").replace(/\s+/g, "");
      const name = (this.report.patientName || "Patient").replace(/\s+/g, "_");
      
      this.doc.save(`PranaPredict_${name}_${risk}_${date}.pdf`);
      return true;
    } catch (error) {
      console.error("PDF Generation Error:", error);
      return false;
    }
  }
}

// Export factory function
export function generateHealthReportPdf(report) {
  const generator = new HealthReportPDF(report);
  return generator.generate();
}