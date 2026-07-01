import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import HealthForm from "../src/components/HealthForm";

describe("HealthForm Component Integration", () => {
  it("navigates through steps, calculates BMI dynamically, and handles the final submission", async () => {
    const handleSubmit = vi.fn();
    const { container } = render(<HealthForm onSubmit={handleSubmit} loading={false} />);

    // --- STEP 1: Basic Info ---
    expect(screen.getByText("Step 1: Basic Information")).toBeInTheDocument();
    
    // Check default BMI (Weight 70, Height 170 -> 24.2)
    expect(screen.getByText(/BMI:/i)).toHaveTextContent("24.2");

    // Change height range to trigger BMI recalculation
    const heightInput = container.querySelector('input[name="height"]');
    fireEvent.change(heightInput, { target: { value: "180" } });
    
    // 70 / (1.8 * 1.8) = 21.60 -> 21.6
    expect(screen.getByText(/BMI:/i)).toHaveTextContent("21.6");

    const nextBtn = screen.getByRole("button", { name: /Next Step/i });
    fireEvent.click(nextBtn);

    // --- STEP 2: Vitals & Medical History ---
    expect(screen.getByText("Step 2: Vitals & Medical History")).toBeInTheDocument();
    
    // Test a condition button toggle
    const diabetesYesBtn = screen.getAllByRole("button", { name: "Yes" })[0]; // first yes btn is diabetes
    fireEvent.click(diabetesYesBtn);
    expect(diabetesYesBtn).toHaveClass("active");

    fireEvent.click(nextBtn);

    // --- STEP 3: Lifestyle & Environment ---
    expect(screen.getByText("Step 3: Lifestyle & Environment")).toBeInTheDocument();
    
    // Select dietType option
    const dietSelect = container.querySelector('select[name="dietType"]');
    fireEvent.change(dietSelect, { target: { value: "non-veg" } });
    expect(dietSelect.value).toBe("non-veg");

    fireEvent.click(nextBtn);

    // --- STEP 4: Verification ---
    expect(screen.getByText("Step 4: Verify Your Details")).toBeInTheDocument();
    
    // Validate that inputs from previous steps are shown in Verification screen
    expect(screen.getByText(/180 cm/)).toBeInTheDocument();
    expect(screen.getByText(/Diabetes/i)).toBeInTheDocument();
    expect(screen.getByText(/non veg/i)).toBeInTheDocument();

    fireEvent.click(nextBtn);

    // --- STEP 5: Final Confirmation ---
    expect(screen.getByText("Step 5: Final Confirmation")).toBeInTheDocument();

    // Submit button should have text "Continue to Final Step" and should be disabled
    const continueBtn = screen.getByRole("button", { name: /Continue to Final Step/i });
    expect(continueBtn).toBeDisabled();

    // Check the final confirmation checkbox
    const confirmCheckbox = screen.getByLabelText(/I confirm that all details are correct/i);
    fireEvent.click(confirmCheckbox);

    // Should no longer be disabled
    expect(continueBtn).not.toBeDisabled();
    fireEvent.click(continueBtn);

    // --- STEP 6: Submission ---
    expect(screen.getByText("Step 6: Generating your report...")).toBeInTheDocument();

    // The submit button is now "Predict Health Risk" or "Analyzing..."
    const submitBtn = screen.getByRole("button", { name: /Predict Health Risk/i });
    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);

    // Verify onSubmit callback was fired with structured payload
    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        age: 30,
        bmi: 21.6,
        diabetes: true,
        dietType: "non-veg",
        location: "urban",
        bloodPressure: "120/80",
      })
    );
  });
});
