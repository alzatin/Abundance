import { describe, it, expect } from "vitest";

/**
 * Tests for Input atom name sanitization - ensuring spaces are replaced with underscores
 * to maintain compatibility with equation parsing
 */
describe("Input atom name sanitization logic", () => {
  
  /**
   * Simulates the sanitization logic used in Input constructor and onChange handler
   */
  function sanitizeName(name) {
    return name.replace(/\s+/g, '_');
  }

  it("should replace spaces with underscores in a name containing spaces", () => {
    const result = sanitizeName("X Length");
    expect(result).toBe("X_Length");
  });

  it("should replace multiple consecutive spaces with a single underscore", () => {
    const result = sanitizeName("My   Test   Input");
    expect(result).toBe("My_Test_Input");
  });

  it("should handle names with leading and trailing spaces", () => {
    const result = sanitizeName("  Test Input  ");
    // Multiple consecutive spaces are collapsed to single underscores
    expect(result).toBe("_Test_Input_");
  });

  it("should not modify names without spaces", () => {
    const result = sanitizeName("TestInput");
    expect(result).toBe("TestInput");
  });

  it("should handle names that already use underscores", () => {
    const result = sanitizeName("Test_Input_Name");
    expect(result).toBe("Test_Input_Name");
  });

  it("should handle tab characters and other whitespace", () => {
    const result = sanitizeName("Test\tInput\nValue");
    expect(result).toBe("Test_Input_Value");
  });

  it("should handle mixed spaces and underscores", () => {
    const result = sanitizeName("Test_Input Name");
    expect(result).toBe("Test_Input_Name");
  });

  it("should handle empty string", () => {
    const result = sanitizeName("");
    expect(result).toBe("");
  });

  it("should handle string with only spaces", () => {
    const result = sanitizeName("   ");
    expect(result).toBe("_");
  });

  it("should be compatible with equation variable parsing regex", () => {
    // This regex is used in equation.js to extract variables
    const variableRegex = /\b[a-zA-Z_][a-zA-Z0-9_]*\b/g;
    
    // Names with spaces would break
    const nameWithSpaces = "X Length";
    const spacesMatch = nameWithSpaces.match(variableRegex);
    expect(spacesMatch).toEqual(["X", "Length"]); // Breaks into two variables
    
    // Sanitized names work correctly
    const sanitizedName = sanitizeName(nameWithSpaces);
    const sanitizedMatch = sanitizedName.match(variableRegex);
    expect(sanitizedMatch).toEqual(["X_Length"]); // Correctly matches as one variable
  });

  it("should handle the example from the issue: 'X Length / 2'", () => {
    const inputName = "X Length";
    const sanitized = sanitizeName(inputName);
    
    // After sanitization, it should work in equations
    const equation = `${sanitized} / 2`;
    expect(equation).toBe("X_Length / 2");
    
    // And be parseable as a single variable
    const variableRegex = /\b[a-zA-Z_][a-zA-Z0-9_]*\b/g;
    const variables = equation.match(variableRegex);
    expect(variables).toContain("X_Length");
    expect(variables).not.toContain("X");
    expect(variables).not.toContain("Length");
  });
});

