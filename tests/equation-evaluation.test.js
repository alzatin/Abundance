import { describe, it, expect } from "vitest";
import { parse } from "mathjs";

describe("Equation evaluation issue reproduction", () => {
  // Mock simple evaluateEquation method to reproduce the issue (before fix)
  function mockEvaluateEquationBefore(equation, inputs = []) {
    let substitutedEquation = String(equation ?? "").trim();

    if (!substitutedEquation) {
      substitutedEquation = "0";
    }

    const variables = extractVariablesFromEquation(substitutedEquation);
    const unresolved = [];
    const resolvedValues = {};
    const BUILTIN_CONSTS = new Set(["pi", "e", "tau", "Infinity", "NaN"]);
    
    if (variables.length > 0) {
      for (const variable of variables) {
        if (BUILTIN_CONSTS.has(variable)) {
          continue;
        }
        
        let value = null;
        // Check if variable exists in inputs
        for (let i = 0; i < inputs.length; i++) {
          if (inputs[i].name === variable) {
            value = inputs[i].value;
            break;
          }
        }
        
        let num = Number(value);
        if (
          value === null ||
          value === undefined ||
          (typeof value === "string" && value.trim() === "") ||
          !Number.isFinite(num)
        ) {
          unresolved.push(variable);
        } else {
          resolvedValues[variable] = num;
        }
      }
    }
    
    if (unresolved.length) {
      const msg = `Variable(s) not found: ${unresolved.join(
        ", "
      )}. Make sure the variables you are using exist as inputs`;
      throw new Error(msg);
    }
    
    // Substitute variables and evaluate
    for (const variable of Object.keys(resolvedValues)) {
      const safeVar = variable.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const variablePattern = new RegExp(`\\b${safeVar}\\b`, "gu");
      substitutedEquation = substitutedEquation.replace(
        variablePattern,
        String(resolvedValues[variable])
      );
    }
    
    return eval(substitutedEquation);
  }

  // Mock evaluateEquation method with fix (automatically adds missing inputs)  
  function mockEvaluateEquationAfter(equation, inputs = []) {
    let substitutedEquation = String(equation ?? "").trim();

    if (!substitutedEquation) {
      substitutedEquation = "0";
    }

    const variables = extractVariablesFromEquation(substitutedEquation);
    const BUILTIN_CONSTS = new Set(["pi", "e", "tau", "Infinity", "NaN"]);
    
    // Simulate ensureInputsForEquation - add missing inputs
    for (const variable of variables) {
      if (BUILTIN_CONSTS.has(variable)) {
        continue;
      }
      
      const existsAsInput = inputs.some(input => input.name === variable);
      if (!existsAsInput) {
        // Add missing input with default value
        inputs.push({ name: variable, value: 1 });
      }
    }
    
    const unresolved = [];
    const resolvedValues = {};
    
    if (variables.length > 0) {
      for (const variable of variables) {
        if (BUILTIN_CONSTS.has(variable)) {
          continue;
        }
        
        let value = null;
        // Check if variable exists in inputs
        for (let i = 0; i < inputs.length; i++) {
          if (inputs[i].name === variable) {
            value = inputs[i].value;
            break;
          }
        }
        
        let num = Number(value);
        if (
          value === null ||
          value === undefined ||
          (typeof value === "string" && value.trim() === "") ||
          !Number.isFinite(num)
        ) {
          unresolved.push(variable);
        } else {
          resolvedValues[variable] = num;
        }
      }
    }
    
    if (unresolved.length) {
      const msg = `Variable(s) not found: ${unresolved.join(
        ", "
      )}. Make sure the variables you are using exist as inputs`;
      throw new Error(msg);
    }
    
    // Substitute variables and evaluate
    for (const variable of Object.keys(resolvedValues)) {
      const safeVar = variable.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const variablePattern = new RegExp(`\\b${safeVar}\\b`, "gu");
      substitutedEquation = substitutedEquation.replace(
        variablePattern,
        String(resolvedValues[variable])
      );
    }
    
    return eval(substitutedEquation);
  }

  function extractVariablesFromEquation(equation) {
    let variables = [];
    try {
      const node = parse(equation);
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
      variables = [...new Set(variables)];
    } catch (e) {
      variables = [];
    }
    return variables;
  }

  describe("Before fix", () => {
    it("should reproduce the issue: 'Variable not found' when inputs not updated", () => {
      // Simulate the scenario - equation changes to use 'L' but inputs are not updated
      const inputs = [
        { name: "x", value: 10 },
        { name: "y", value: 20 }
      ];
      
      // This should fail because 'L' is not in inputs
      expect(() => mockEvaluateEquationBefore("L*25.4", inputs)).toThrow("Variable(s) not found: L");
    });

    it("should work when inputs contain the required variable", () => {
      // Inputs contain 'L'
      const inputs = [
        { name: "L", value: 1 }
      ];
      
      // This should work
      expect(() => mockEvaluateEquationBefore("L*25.4", inputs)).not.toThrow();
      expect(mockEvaluateEquationBefore("L*25.4", inputs)).toBe(25.4);
    });
  });

  describe("After fix", () => {
    it("should automatically add missing inputs and not throw error", () => {
      // Start with inputs that don't contain 'L'
      const inputs = [
        { name: "x", value: 10 },
        { name: "y", value: 20 }
      ];
      
      // This should work now because missing inputs are automatically added
      expect(() => mockEvaluateEquationAfter("L*25.4", inputs)).not.toThrow();
      
      // Check that 'L' input was added with default value 1
      expect(inputs.some(input => input.name === "L")).toBe(true);
      expect(mockEvaluateEquationAfter("L*25.4", inputs)).toBe(25.4);
    });

    it("should work with multiple new variables", () => {
      const inputs = [];
      
      // This should work and add both W and H inputs
      expect(() => mockEvaluateEquationAfter("W*H", inputs)).not.toThrow();
      
      // Check that both inputs were added
      expect(inputs.some(input => input.name === "W")).toBe(true);
      expect(inputs.some(input => input.name === "H")).toBe(true);
      expect(mockEvaluateEquationAfter("W*H", inputs)).toBe(1);
    });

    it("should not duplicate existing inputs", () => {
      const inputs = [
        { name: "L", value: 5 }
      ];
      
      // This should work and not add duplicate 'L' input
      expect(() => mockEvaluateEquationAfter("L*2", inputs)).not.toThrow();
      
      // Check that we still have only one 'L' input
      const lInputs = inputs.filter(input => input.name === "L");
      expect(lInputs.length).toBe(1);
      expect(lInputs[0].value).toBe(5); // Original value preserved
      expect(mockEvaluateEquationAfter("L*2", inputs)).toBe(10);
    });
  });
});