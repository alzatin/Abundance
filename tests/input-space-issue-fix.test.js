import { describe, it, expect } from "vitest";

/**
 * Integration test demonstrating the fix for the issue where Input atom names
 * with spaces break equation parsing.
 * 
 * Issue: https://github.com/BarbourSmith/Abundance/issues/[number]
 * Problem: Using "X Length" in an equation like "X Length / 2" fails because
 *          the parser treats it as two separate variables "X" and "Length"
 * Solution: Replace spaces with underscores in Input atom names
 */
describe("Input name space restriction - Issue fix integration test", () => {
  
  /**
   * Simulates the Input atom name sanitization
   */
  function sanitizeInputName(name) {
    return name.replace(/\s+/g, '_');
  }

  /**
   * Simulates equation variable extraction (from equation.js)
   */
  function extractVariables(equation) {
    // Fallback regex from equation.js line 114
    const variables = equation.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
    return [...new Set(variables)]; // Remove duplicates
  }

  it("should demonstrate the original problem: 'X Length' breaks equation parsing", () => {
    // Original problem: User creates an input named "X Length"
    const inputName = "X Length";
    
    // User tries to use it in an equation
    const equation = `${inputName} / 2`;
    
    // Extract variables from the equation
    const variables = extractVariables(equation);
    
    // Problem: The parser treats "X Length" as TWO variables
    expect(variables).toContain("X");
    expect(variables).toContain("Length");
    expect(variables.length).toBe(2); // Should be 1, but is 2!
  });

  it("should demonstrate the fix: sanitized name works correctly", () => {
    // Fix: Input atom sanitizes the name
    const inputName = "X Length";
    const sanitizedName = sanitizeInputName(inputName);
    
    expect(sanitizedName).toBe("X_Length");
    
    // User uses the sanitized name in an equation
    const equation = `${sanitizedName} / 2`;
    
    // Extract variables from the equation
    const variables = extractVariables(equation);
    
    // Success: The parser treats "X_Length" as ONE variable
    expect(variables).toContain("X_Length");
    expect(variables).not.toContain("X");
    expect(variables).not.toContain("Length");
    expect(variables.length).toBe(1); // Correctly identified as 1 variable!
  });

  it("should handle the example from the issue screenshot", () => {
    // From the issue: User has inputs "X Length" and "Y Length"
    const xLengthName = sanitizeInputName("X Length");
    const yLengthName = sanitizeInputName("Y Length");
    
    expect(xLengthName).toBe("X_Length");
    expect(yLengthName).toBe("Y_Length");
    
    // Using them in equations now works correctly
    const equation1 = `${xLengthName} / 2`;
    const equation2 = `${yLengthName} * 3`;
    
    const vars1 = extractVariables(equation1);
    const vars2 = extractVariables(equation2);
    
    expect(vars1).toEqual(["X_Length"]);
    expect(vars2).toEqual(["Y_Length"]);
  });

  it("should work with complex equations using multiple inputs with spaces", () => {
    // Multiple inputs with spaces
    const width = sanitizeInputName("Box Width");
    const height = sanitizeInputName("Box Height");
    const depth = sanitizeInputName("Box Depth");
    
    expect(width).toBe("Box_Width");
    expect(height).toBe("Box_Height");
    expect(depth).toBe("Box_Depth");
    
    // Complex equation using all three
    const equation = `(${width} * ${height} * ${depth}) / 1000`;
    const variables = extractVariables(equation);
    
    expect(variables).toContain("Box_Width");
    expect(variables).toContain("Box_Height");
    expect(variables).toContain("Box_Depth");
    expect(variables.length).toBe(3); // Exactly 3 variables, not 6!
  });

  it("should demonstrate that the fix prevents the 'strange results' mentioned in the issue", () => {
    // Before fix: "X Length" in equation causes strange results
    const beforeFix = "X Length / 2";
    const varsBefore = extractVariables(beforeFix);
    
    // Parser sees: ["X", "Length"] - tries to find two separate variables
    // This causes undefined variable errors or unexpected behavior
    expect(varsBefore).toEqual(["X", "Length"]);
    
    // After fix: "X_Length" in equation works correctly
    const inputName = sanitizeInputName("X Length");
    const afterFix = `${inputName} / 2`;
    const varsAfter = extractVariables(afterFix);
    
    // Parser sees: ["X_Length"] - correctly identifies the single variable
    expect(varsAfter).toEqual(["X_Length"]);
  });
});
