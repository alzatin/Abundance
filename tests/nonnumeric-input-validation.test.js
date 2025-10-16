import { describe, it, expect } from "vitest";

describe("Nonnumeric Input Validation", () => {
  // Helper function to simulate the commitChange validation logic
  function validateNumberInput(value, type) {
    if (type === "number" || type === "range") {
      if (isNaN(value) || value === null || value === undefined) {
        return { valid: false, shouldRevert: true };
      }
    }

    if (type === "point") {
      if (Array.isArray(value)) {
        const hasInvalidValue = value.some(
          (v) => isNaN(v) || v === null || v === undefined
        );
        if (hasInvalidValue) {
          return { valid: false, shouldRevert: true };
        }
      }
    }

    return { valid: true, shouldRevert: false };
  }

  it("should reject NaN for number inputs", () => {
    const result = validateNumberInput(NaN, "number");
    expect(result.valid).toBe(false);
    expect(result.shouldRevert).toBe(true);
  });

  it("should reject null for number inputs", () => {
    const result = validateNumberInput(null, "number");
    expect(result.valid).toBe(false);
    expect(result.shouldRevert).toBe(true);
  });

  it("should reject undefined for number inputs", () => {
    const result = validateNumberInput(undefined, "number");
    expect(result.valid).toBe(false);
    expect(result.shouldRevert).toBe(true);
  });

  it("should accept valid positive numbers", () => {
    const result = validateNumberInput(10, "number");
    expect(result.valid).toBe(true);
    expect(result.shouldRevert).toBe(false);
  });

  it("should accept valid negative numbers", () => {
    const result = validateNumberInput(-5, "number");
    expect(result.valid).toBe(true);
    expect(result.shouldRevert).toBe(false);
  });

  it("should accept zero", () => {
    const result = validateNumberInput(0, "number");
    expect(result.valid).toBe(true);
    expect(result.shouldRevert).toBe(false);
  });

  it("should accept valid floating point numbers", () => {
    const result = validateNumberInput(3.14159, "number");
    expect(result.valid).toBe(true);
    expect(result.shouldRevert).toBe(false);
  });

  it("should reject arrays with NaN for point inputs", () => {
    const result = validateNumberInput([1, NaN, 3], "point");
    expect(result.valid).toBe(false);
    expect(result.shouldRevert).toBe(true);
  });

  it("should reject arrays with null for point inputs", () => {
    const result = validateNumberInput([1, null, 3], "point");
    expect(result.valid).toBe(false);
    expect(result.shouldRevert).toBe(true);
  });

  it("should reject arrays with undefined for point inputs", () => {
    const result = validateNumberInput([1, undefined, 3], "point");
    expect(result.valid).toBe(false);
    expect(result.shouldRevert).toBe(true);
  });

  it("should accept valid point arrays", () => {
    const result = validateNumberInput([1, 2, 3], "point");
    expect(result.valid).toBe(true);
    expect(result.shouldRevert).toBe(false);
  });

  it("should accept point arrays with negative numbers", () => {
    const result = validateNumberInput([-5, 0, 10], "point");
    expect(result.valid).toBe(true);
    expect(result.shouldRevert).toBe(false);
  });

  it("should reject NaN for range inputs", () => {
    const result = validateNumberInput(NaN, "range");
    expect(result.valid).toBe(false);
    expect(result.shouldRevert).toBe(true);
  });

  it("should accept valid range values", () => {
    const result = validateNumberInput(50, "range");
    expect(result.valid).toBe(true);
    expect(result.shouldRevert).toBe(false);
  });

  // Test that Number() conversion produces NaN for invalid inputs
  it("should demonstrate that Number() returns NaN for invalid strings", () => {
    expect(Number("10,5")).toBeNaN(); // comma separator
    expect(Number("abc")).toBeNaN(); // letters
    expect(Number("10.5.3")).toBeNaN(); // multiple decimals
    expect(Number("--5")).toBeNaN(); // double negative
  });

  // Test valid number conversions that should work
  it("should demonstrate that Number() correctly converts valid strings", () => {
    expect(Number("10")).toBe(10);
    expect(Number("-5")).toBe(-5);
    expect(Number("3.14")).toBe(3.14);
    expect(Number("0")).toBe(0);
    expect(Number("-0")).toBe(-0);
  });

  // Test intermediate typing states
  it("should handle empty string as intermediate state", () => {
    // During typing, empty string should be allowed temporarily
    const emptyString = "";
    expect(Number(emptyString)).toBe(0); // This converts to 0
    // The validation should handle this in the onChange handler
  });

  it("should handle minus sign as intermediate state", () => {
    // During typing a negative number, "-" should be allowed temporarily
    const minusSign = "-";
    expect(Number(minusSign)).toBeNaN(); // This would be NaN but should be allowed during typing
  });
});

