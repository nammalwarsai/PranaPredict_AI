import { describe, it, expect } from "vitest";
import { calculateBMI, getBMICategory } from "../src/utils/bmiCalculator";

describe("BMI Calculator Utilities", () => {
  describe("calculateBMI", () => {
    it("calculates BMI correctly for standard inputs", () => {
      // 70kg, 170cm = 70 / (1.7 * 1.7) = 24.22 -> 24.2
      expect(calculateBMI(70, 170)).toBe(24.2);
    });

    it("returns null if parameters are missing or zero", () => {
      expect(calculateBMI(null, 170)).toBeNull();
      expect(calculateBMI(70, 0)).toBeNull();
      expect(calculateBMI(0, 170)).toBeNull();
    });
  });

  describe("getBMICategory", () => {
    it("returns correct category labels", () => {
      expect(getBMICategory(17.5)).toBe("Underweight");
      expect(getBMICategory(22.0)).toBe("Normal");
      expect(getBMICategory(27.5)).toBe("Overweight");
      expect(getBMICategory(31.0)).toBe("Obese");
    });
  });
});
