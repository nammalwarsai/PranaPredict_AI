import { describe, it, expect } from "vitest";

// Extract utility functions for testing
const cholesterolMap = { normal: 1, borderline: 2, high: 3 };
const activityMap = { low: 1, moderate: 2, high: 3 };

function normalizeValue(report, field) {
  const raw = report[field.key];
  if (raw === null || raw === undefined) return null;

  if (field.type === "number") {
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  if (field.type === "bpSystolic") {
    if (typeof raw !== "string" || !raw) return null;
    const systolic = Number(raw.split("/")[0]);
    return Number.isFinite(systolic) ? systolic : null;
  }

  if (field.type === "cholesterol") return cholesterolMap[String(raw).toLowerCase()] ?? null;
  if (field.type === "activity") return activityMap[String(raw).toLowerCase()] ?? null;
  return null;
}

function formatLabel(dateText) {
  if (dateText == null) return "Unknown";
  const d = new Date(dateText);
  return Number.isNaN(d.getTime())
    ? "Unknown"
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

describe("Analytics Utility Functions", () => {
  describe("normalizeValue", () => {
    describe("number type", () => {
      const numberField = { key: "bmi", type: "number" };

      it("normalizes valid numbers correctly", () => {
        expect(normalizeValue({ bmi: 24.5 }, numberField)).toBe(24.5);
        expect(normalizeValue({ bmi: 30 }, numberField)).toBe(30);
        expect(normalizeValue({ bmi: 0 }, numberField)).toBe(0);
      });

      it("normalizes string numbers correctly", () => {
        expect(normalizeValue({ bmi: "24.5" }, numberField)).toBe(24.5);
        expect(normalizeValue({ bmi: "30" }, numberField)).toBe(30);
      });

      it("returns null for null or undefined values", () => {
        expect(normalizeValue({ bmi: null }, numberField)).toBeNull();
        expect(normalizeValue({ bmi: undefined }, numberField)).toBeNull();
        expect(normalizeValue({}, numberField)).toBeNull();
      });

      it("returns null for non-numeric values", () => {
        expect(normalizeValue({ bmi: "abc" }, numberField)).toBeNull();
        expect(normalizeValue({ bmi: "N/A" }, numberField)).toBeNull();
        expect(normalizeValue({ bmi: NaN }, numberField)).toBeNull();
        expect(normalizeValue({ bmi: Infinity }, numberField)).toBeNull();
      });
    });

    describe("bpSystolic type", () => {
      const bpField = { key: "blood_pressure", type: "bpSystolic" };

      it("extracts systolic value from BP string", () => {
        expect(normalizeValue({ blood_pressure: "120/80" }, bpField)).toBe(120);
        expect(normalizeValue({ blood_pressure: "140/90" }, bpField)).toBe(140);
        expect(normalizeValue({ blood_pressure: "110/70" }, bpField)).toBe(110);
      });

      it("handles edge cases for BP strings", () => {
        expect(normalizeValue({ blood_pressure: "130/85" }, bpField)).toBe(130);
        expect(normalizeValue({ blood_pressure: "180/120" }, bpField)).toBe(180);
      });

      it("returns null for invalid BP formats", () => {
        expect(normalizeValue({ blood_pressure: "abc/def" }, bpField)).toBeNull();
        expect(normalizeValue({ blood_pressure: "invalid" }, bpField)).toBeNull();
        expect(normalizeValue({ blood_pressure: "" }, bpField)).toBeNull();
        expect(normalizeValue({ blood_pressure: 120 }, bpField)).toBeNull(); // Not a string
      });

      it("returns null for null or undefined BP", () => {
        expect(normalizeValue({ blood_pressure: null }, bpField)).toBeNull();
        expect(normalizeValue({ blood_pressure: undefined }, bpField)).toBeNull();
        expect(normalizeValue({}, bpField)).toBeNull();
      });
    });

    describe("cholesterol type", () => {
      const cholesterolField = { key: "cholesterol", type: "cholesterol" };

      it("maps cholesterol categories to numeric values", () => {
        expect(normalizeValue({ cholesterol: "normal" }, cholesterolField)).toBe(1);
        expect(normalizeValue({ cholesterol: "borderline" }, cholesterolField)).toBe(2);
        expect(normalizeValue({ cholesterol: "high" }, cholesterolField)).toBe(3);
      });

      it("handles case-insensitive cholesterol values", () => {
        expect(normalizeValue({ cholesterol: "Normal" }, cholesterolField)).toBe(1);
        expect(normalizeValue({ cholesterol: "NORMAL" }, cholesterolField)).toBe(1);
        expect(normalizeValue({ cholesterol: "Borderline" }, cholesterolField)).toBe(2);
        expect(normalizeValue({ cholesterol: "HIGH" }, cholesterolField)).toBe(3);
      });

      it("returns null for invalid cholesterol values", () => {
        expect(normalizeValue({ cholesterol: "invalid" }, cholesterolField)).toBeNull();
        expect(normalizeValue({ cholesterol: "low" }, cholesterolField)).toBeNull();
        expect(normalizeValue({ cholesterol: "" }, cholesterolField)).toBeNull();
      });

      it("returns null for null or undefined cholesterol", () => {
        expect(normalizeValue({ cholesterol: null }, cholesterolField)).toBeNull();
        expect(normalizeValue({ cholesterol: undefined }, cholesterolField)).toBeNull();
        expect(normalizeValue({}, cholesterolField)).toBeNull();
      });
    });

    describe("activity type", () => {
      const activityField = { key: "activity_level", type: "activity" };

      it("maps activity levels to numeric values", () => {
        expect(normalizeValue({ activity_level: "low" }, activityField)).toBe(1);
        expect(normalizeValue({ activity_level: "moderate" }, activityField)).toBe(2);
        expect(normalizeValue({ activity_level: "high" }, activityField)).toBe(3);
      });

      it("handles case-insensitive activity values", () => {
        expect(normalizeValue({ activity_level: "Low" }, activityField)).toBe(1);
        expect(normalizeValue({ activity_level: "LOW" }, activityField)).toBe(1);
        expect(normalizeValue({ activity_level: "Moderate" }, activityField)).toBe(2);
        expect(normalizeValue({ activity_level: "HIGH" }, activityField)).toBe(3);
      });

      it("returns null for invalid activity values", () => {
        expect(normalizeValue({ activity_level: "invalid" }, activityField)).toBeNull();
        expect(normalizeValue({ activity_level: "sedentary" }, activityField)).toBeNull();
        expect(normalizeValue({ activity_level: "" }, activityField)).toBeNull();
      });

      it("returns null for null or undefined activity", () => {
        expect(normalizeValue({ activity_level: null }, activityField)).toBeNull();
        expect(normalizeValue({ activity_level: undefined }, activityField)).toBeNull();
        expect(normalizeValue({}, activityField)).toBeNull();
      });
    });

    describe("unknown type", () => {
      const unknownField = { key: "unknown_field", type: "unknown" };

      it("returns null for unknown field types", () => {
        expect(normalizeValue({ unknown_field: "value" }, unknownField)).toBeNull();
        expect(normalizeValue({ unknown_field: 123 }, unknownField)).toBeNull();
      });
    });
  });

  describe("formatLabel", () => {
    it("formats valid dates correctly", () => {
      const result = formatLabel("2026-01-15T10:00:00Z");
      expect(result).toContain("Jan");
      expect(result).toContain("15");
    });

    it("formats different months correctly", () => {
      const jan = formatLabel("2026-01-15T10:00:00Z");
      const feb = formatLabel("2026-02-20T10:00:00Z");
      const dec = formatLabel("2026-12-25T10:00:00Z");

      expect(jan).toContain("Jan");
      expect(feb).toContain("Feb");
      expect(dec).toContain("Dec");
    });

    it("returns 'Unknown' for invalid date strings", () => {
      expect(formatLabel("invalid-date")).toBe("Unknown");
      expect(formatLabel("")).toBe("Unknown");
      expect(formatLabel("not a date")).toBe("Unknown");
    });

    it("returns 'Unknown' for null or undefined", () => {
      expect(formatLabel(null)).toBe("Unknown");
      expect(formatLabel(undefined)).toBe("Unknown");
    });

    it("handles various date formats", () => {
      const iso = formatLabel("2026-06-15T08:30:00.000Z");
      const simple = formatLabel("2026-06-15");

      expect(iso).toContain("Jun");
      expect(iso).toContain("15");
      expect(simple).toContain("Jun");
      expect(simple).toContain("15");
    });
  });

  describe("Statistics Calculations (Integration)", () => {
    const mockReports = [
      { bmi: 22.5, created_at: "2026-01-10T10:00:00Z" },
      { bmi: 24.0, created_at: "2026-01-15T10:00:00Z" },
      { bmi: 23.2, created_at: "2026-01-20T10:00:00Z" },
    ];

    const bmiField = { key: "bmi", type: "number" };

    it("calculates average correctly", () => {
      const values = mockReports.map((r) => normalizeValue(r, bmiField));
      const sum = values.reduce((a, b) => a + b, 0);
      const average = (sum / values.length).toFixed(1);

      expect(average).toBe("23.2"); // (22.5 + 24.0 + 23.2) / 3 = 23.23
    });

    it("calculates min and max correctly", () => {
      const values = mockReports.map((r) => normalizeValue(r, bmiField));
      const min = Math.min(...values);
      const max = Math.max(...values);

      expect(min).toBe(22.5);
      expect(max).toBe(24.0);
    });

    it("gets latest value correctly", () => {
      const sortedReports = [...mockReports].sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      );
      const values = sortedReports.map((r) => normalizeValue(r, bmiField));
      const latest = values[values.length - 1];

      expect(latest).toBe(23.2);
    });

    it("filters out null values from calculations", () => {
      const mixedReports = [
        { bmi: 22.5, created_at: "2026-01-10T10:00:00Z" },
        { bmi: null, created_at: "2026-01-15T10:00:00Z" },
        { bmi: 24.0, created_at: "2026-01-20T10:00:00Z" },
      ];

      const values = mixedReports
        .map((r) => normalizeValue(r, bmiField))
        .filter((v) => v !== null);

      expect(values).toHaveLength(2);
      expect(values).toEqual([22.5, 24.0]);
    });
  });
});
