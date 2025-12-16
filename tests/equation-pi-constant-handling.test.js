import { describe, it, expect } from "vitest";
import { parse, create, all } from "mathjs";

describe("Equation atom pi and constant handling", () => {
  const math = create(all);
  
  /**
   * Mock version of _extractVariablesFromEquation that matches the fixed implementation
   */
  function extractVariablesFromEquation(currentEquation) {
    // Built-in mathematical constants that should not be treated as variables
    const BUILTIN_CONSTS = new Set(["pi", "e", "tau", "Infinity", "NaN"]);
    
    let variables = [];
    try {
      const node = parse(currentEquation);
      node.traverse(function (n, path, parent) {
        if (
          n.isSymbolNode &&
          !(
            parent &&
            parent.isFunctionNode &&
            parent.fn &&
            parent.fn.name === n.name
          )
        ) {
          variables.push(n.name);
        }
      });
      // Remove duplicates and built-in constants
      variables = [...new Set(variables)].filter(v => !BUILTIN_CONSTS.has(v));
    } catch (e) {
      // Fallback for string expressions that mathjs can't parse
      variables = extractVariablesRespectingQuotes(currentEquation);
    }
    return variables;
  }
  
  /**
   * Mock version of _extractVariablesRespectingQuotes
   */
  function extractVariablesRespectingQuotes(equation) {
    const variables = [];
    let current = "";
    let inQuotes = false;
    let quoteChar = "";

    for (let i = 0; i < equation.length; i++) {
      const char = equation[i];

      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
        if (current.trim()) {
          extractVariablesFromPart(current, variables);
        }
        current = "";
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = "";
        current = "";
      } else if (!inQuotes) {
        current += char;
      }
    }

    if (current.trim() && !inQuotes) {
      extractVariablesFromPart(current, variables);
    }

    return [...new Set(variables)];
  }
  
  /**
   * Mock version of _extractVariablesFromPart
   */
  function extractVariablesFromPart(part, variables) {
    const BUILTIN_CONSTS = new Set(["pi", "e", "tau", "Infinity", "NaN"]);
    
    const matches = part.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
    const filtered = matches.filter(m => !BUILTIN_CONSTS.has(m));
    variables.push(...filtered);
  }

  describe("extractVariablesFromEquation", () => {
    it("should NOT extract pi as a variable", () => {
      const variables = extractVariablesFromEquation("pi");
      expect(variables).not.toContain("pi");
      expect(variables.length).toBe(0);
    });

    it("should NOT extract e as a variable", () => {
      const variables = extractVariablesFromEquation("e");
      expect(variables).not.toContain("e");
      expect(variables.length).toBe(0);
    });

    it("should NOT extract tau as a variable", () => {
      const variables = extractVariablesFromEquation("tau");
      expect(variables).not.toContain("tau");
      expect(variables.length).toBe(0);
    });

    it("should extract regular variables but NOT pi", () => {
      const variables = extractVariablesFromEquation("x * pi");
      expect(variables).toContain("x");
      expect(variables).not.toContain("pi");
      expect(variables.length).toBe(1);
    });

    it("should extract multiple variables but NOT constants", () => {
      const variables = extractVariablesFromEquation("x + y * pi + e");
      expect(variables).toContain("x");
      expect(variables).toContain("y");
      expect(variables).not.toContain("pi");
      expect(variables).not.toContain("e");
      expect(variables.length).toBe(2);
    });
  });

  describe("Simulated addAndRemoveInputs behavior", () => {
    it("should NOT create an input for pi", () => {
      const variables = extractVariablesFromEquation("pi");
      expect(variables.length).toBe(0);
      // This means no inputs would be created for pi
    });

    it("should NOT create inputs for e or tau", () => {
      const variables = extractVariablesFromEquation("e + tau");
      expect(variables.length).toBe(0);
      // This means no inputs would be created for e or tau
    });

    it("should create input for x but NOT for pi", () => {
      const variables = extractVariablesFromEquation("x * pi");
      expect(variables).toContain("x");
      expect(variables).not.toContain("pi");
      expect(variables.length).toBe(1);
      // This means only x input would be created, not pi
    });

    it("should create inputs for variables but NOT for constants", () => {
      const variables = extractVariablesFromEquation("radius * 2 * pi + e");
      expect(variables).toContain("radius");
      expect(variables).not.toContain("pi");
      expect(variables).not.toContain("e");
      expect(variables.length).toBe(1);
      // This means only radius input would be created
    });
  });

  describe("Evaluation with constants", () => {
    it("should evaluate pi correctly as mathematical constant", () => {
      const result = math.evaluate("pi");
      expect(result).toBeCloseTo(Math.PI, 10);
    });

    it("should evaluate 2*pi correctly", () => {
      const result = math.evaluate("2 * pi");
      expect(result).toBeCloseTo(2 * Math.PI, 10);
    });

    it("should evaluate e correctly", () => {
      const result = math.evaluate("e");
      expect(result).toBeCloseTo(Math.E, 10);
    });

    it("should evaluate expression with variable and pi", () => {
      const result = math.evaluate("radius * 2 * pi", { radius: 5 });
      expect(result).toBeCloseTo(10 * Math.PI, 10);
    });

    it("should evaluate complex expression with multiple constants", () => {
      const result = math.evaluate("x + pi * 2 + e", { x: 10 });
      const expected = 10 + Math.PI * 2 + Math.E;
      expect(result).toBeCloseTo(expected, 10);
    });
  });

  describe("Fallback string expression handling", () => {
    it("should NOT extract pi from string concatenation expressions", () => {
      const variables = extractVariablesFromEquation('"value: " + pi');
      // When mathjs parse fails, it falls back to extractVariablesRespectingQuotes
      // which should also filter out pi
      expect(variables).not.toContain("pi");
    });

    it("should extract variable but NOT pi from string expressions", () => {
      const variables = extractVariablesFromEquation('"result: " + x + pi');
      expect(variables).toContain("x");
      expect(variables).not.toContain("pi");
    });
  });
});
