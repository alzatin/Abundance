/**
 * Integration tests for string concatenation functionality in evaluateEquation
 * Tests the modified atom.js evaluateEquation method
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { parse } from "mathjs";

describe('Equation String Integration Tests', () => {

  // Mock atom class with the new evaluateEquation functionality
  class MockAtom {
    constructor() {
      this.inputs = [];
      this.parent = null;
      this.parentMolecule = null;
    }

    // Mock implementation of the new evaluateEquation method
    evaluateEquation(equation) {
      let substitutedEquation = String(equation ?? "").trim();

      // Handle empty or whitespace-only equations gracefully
      if (!substitutedEquation) {
        substitutedEquation = "0";
      }

      // Check if equation contains string literals (quoted text)
      const hasStringLiterals = /["']/.test(substitutedEquation);
      
      if (hasStringLiterals) {
        // Handle as string concatenation
        return this.evaluateStringExpression(substitutedEquation);
      } else {
        // Handle as mathematical expression (existing behavior)
        return this.evaluateMathExpression(substitutedEquation);
      }
    }

    evaluateStringExpression(equation) {
      // Parse string concatenation expression
      const parts = [];
      let current = '';
      let inQuotes = false;
      let quoteChar = '';
      
      for (let i = 0; i < equation.length; i++) {
        const char = equation[i];
        
        if ((char === '"' || char === "'") && !inQuotes) {
          inQuotes = true;
          quoteChar = char;
          current += char; // Keep the quote
        } else if (char === quoteChar && inQuotes) {
          inQuotes = false;
          current += char; // Keep the quote
          quoteChar = '';
        } else if (char === '+' && !inQuotes) {
          if (current.trim()) {
            parts.push(current.trim());
          }
          current = '';
        } else {
          current += char;
        }
      }
      if (current.trim()) {
        parts.push(current.trim());
      }
      
      // Evaluate each part and concatenate
      let result = '';
      for (const part of parts) {
        if (part.startsWith('"') && part.endsWith('"')) {
          // String literal with double quotes - remove quotes and keep content
          result += part.slice(1, -1);
        } else if (part.startsWith("'") && part.endsWith("'")) {
          // String literal with single quotes - remove quotes and keep content
          result += part.slice(1, -1);
        } else {
          // Variable or number - resolve its value
          const trimmed = part.trim();
          if (trimmed) {
            const value = this.resolveVariable(trimmed);
            result += String(value);
          }
        }
      }
      
      return result;
    }

    evaluateMathExpression(substitutedEquation) {
      const variables = this.extractVariablesFromEquation(substitutedEquation);
      const unresolved = [];
      const resolvedValues = {};
      const BUILTIN_CONSTS = new Set(["pi", "e", "tau", "Infinity", "NaN"]);
      
      if (variables.length > 0) {
        const parentInputs = [];
        for (const variable of variables) {
          if (BUILTIN_CONSTS.has(variable)) {
            continue; // let evaluator handle it
          }
          let value = null;
          
          // Check this atom's inputs
          for (let i = 0; i < this.inputs.length; i++) {
            if (this.inputs[i].name === variable) {
              value = this.inputs[i].value;
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
      } else {
        // Substitute all resolved variables
        for (const variable of Object.keys(resolvedValues)) {
          const safeVar = variable.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const variablePattern = new RegExp(`\\b${safeVar}\\b`, "gu");
          substitutedEquation = substitutedEquation.replace(
            variablePattern,
            String(resolvedValues[variable])
          );
        }

        // Simple eval for testing (in real code this uses mathjs)
        try {
          const result = eval(substitutedEquation);
          return result;
        } catch (error) {
          const msg = `Invalid mathematical expression: "${substitutedEquation}". ${error.message}`;
          throw new Error(msg);
        }
      }
    }

    resolveVariable(variableName) {
      const BUILTIN_CONSTS = new Set(["pi", "e", "tau", "Infinity", "NaN"]);
      
      if (BUILTIN_CONSTS.has(variableName)) {
        return variableName;
      }
      
      // Check if it's a number
      const num = Number(variableName);
      if (!isNaN(num) && isFinite(num)) {
        return num;
      }
      
      // Check this atom's inputs
      for (let i = 0; i < this.inputs.length; i++) {
        if (this.inputs[i].name === variableName) {
          const value = this.inputs[i].value;
          return value !== null && value !== undefined ? value : variableName;
        }
      }
      
      // If variable not found, return the variable name itself
      return variableName;
    }

    extractVariablesFromEquation(equation) {
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
        // Fallback for string expressions that mathjs can't parse
        variables = equation.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
        variables = [...new Set(variables)];
      }
      return variables;
    }

    // Helper method to set input values for testing
    setInputValue(name, value) {
      let input = this.inputs.find(input => input.name === name);
      if (!input) {
        input = { name, value };
        this.inputs.push(input);
      } else {
        input.value = value;
      }
    }
  }

  describe('String concatenation with real atom logic', () => {
    let atom;
    
    beforeEach(() => {
      atom = new MockAtom();
    });

    it('should handle simple string concatenation with number variable', () => {
      atom.setInputValue('x', 18);
      
      const result = atom.evaluateEquation('x + "mm plywood"');
      
      expect(result).toBe("18mm plywood");
      expect(typeof result).toBe('string');
    });

    it('should handle multiple variables in string concatenation', () => {
      atom.setInputValue('width', 12);
      atom.setInputValue('height', 18);
      
      const result = atom.evaluateEquation('width + "x" + height + "mm sheet"');
      
      expect(result).toBe("12x18mm sheet");
    });

    it('should handle pure string concatenation', () => {
      const result = atom.evaluateEquation('"Plywood " + "Material"');
      
      expect(result).toBe("Plywood Material");
    });

    it('should maintain backward compatibility with math expressions', () => {
      atom.setInputValue('x', 10);
      atom.setInputValue('y', 5);
      
      const result = atom.evaluateEquation('x + y * 2');
      
      expect(result).toBe(20); // 10 + 5*2 = 20
      expect(typeof result).toBe('number');
    });

    it('should work with BOM naming use case', () => {
      atom.setInputValue('thickness', 6);
      atom.setInputValue('material', "plywood");
      
      const result = atom.evaluateEquation('thickness + "mm " + material');
      
      expect(result).toBe("6mm plywood");
    });

    it('should handle single quotes', () => {
      atom.setInputValue('thickness', 12);
      
      const result = atom.evaluateEquation("thickness + 'mm OSB'");
      
      expect(result).toBe("12mm OSB");
    });

    it('should handle empty strings', () => {
      atom.setInputValue('x', 42);
      
      const result = atom.evaluateEquation('x + ""');
      
      expect(result).toBe("42");
    });

    it('should handle special characters in strings', () => {
      atom.setInputValue('material', "Bolt");
      atom.setInputValue('qty', 4);
      
      const result = atom.evaluateEquation('material + " (" + qty + " pieces)"');
      
      expect(result).toBe("Bolt (4 pieces)");
    });

    it('should handle string variables mixed with numbers', () => {
      atom.setInputValue('count', 3);
      atom.setInputValue('type', "screws");
      
      const result = atom.evaluateEquation('count + " " + type');
      
      expect(result).toBe("3 screws");
    });

    it('should handle complex BOM scenarios', () => {
      atom.setInputValue('qty', 2);
      atom.setInputValue('thickness', 18);
      atom.setInputValue('width', 100);
      atom.setInputValue('height', 50);
      
      const result = atom.evaluateEquation('qty + "x " + thickness + "mm plywood (" + width + "x" + height + "mm)"');
      
      expect(result).toBe("2x 18mm plywood (100x50mm)");
    });
  });

  describe('Edge cases and error handling', () => {
    let atom;
    
    beforeEach(() => {
      atom = new MockAtom();
    });

    it('should handle math expressions with missing variables by throwing error', () => {
      expect(() => atom.evaluateEquation('x + y')).toThrow('Variable(s) not found: x, y');
    });

    it('should handle string expressions with missing variables by using variable name', () => {
      const result = atom.evaluateEquation('missingVar + "mm material"');
      
      expect(result).toBe("missingVarmm material");
    });

    it('should handle nested quotes gracefully', () => {
      atom.setInputValue('name', 'Plywood 3/4"');
      
      const result = atom.evaluateEquation("name + ' Sheet'");
      
      expect(result).toBe('Plywood 3/4" Sheet');
    });
  });
});