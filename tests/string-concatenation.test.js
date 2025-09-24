/**
 * Tests for string concatenation functionality in equations
 * These tests validate string concatenation support for BOM naming
 */

import { describe, it, expect } from 'vitest';
import { parse } from "mathjs";

describe('String Concatenation in Equations', () => {

  // Mock evaluateEquation function with string concatenation support
  function evaluateEquationWithStrings(equation, inputs = []) {
    let substitutedEquation = String(equation ?? "").trim();

    if (!substitutedEquation) {
      substitutedEquation = "0";
    }

    // Check if equation contains string literals (quoted text)
    const hasStringLiterals = /["']/.test(substitutedEquation);
    
    if (hasStringLiterals) {
      // Handle as string concatenation
      return evaluateStringExpression(substitutedEquation, inputs);
    } else {
      // Handle as mathematical expression (existing behavior)
      return evaluateMathExpression(substitutedEquation, inputs);
    }
  }

  function evaluateStringExpression(equation, inputs) {
    // Simple string concatenation parser
    // Split by + operator, handling quoted strings
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
    
    // Evaluate each part
    let result = '';
    for (const part of parts) {
      if (part.startsWith('"') && part.endsWith('"')) {
        // String literal with double quotes - remove quotes and keep content
        result += part.slice(1, -1);
      } else if (part.startsWith("'") && part.endsWith("'")) {
        // String literal with single quotes - remove quotes and keep content
        result += part.slice(1, -1);
      } else {
        // Variable or number
        const trimmed = part.trim();
        if (trimmed) {
          let value = null;
          
          // Check if it's a number
          const num = Number(trimmed);
          if (!isNaN(num) && isFinite(num)) {
            value = num;
          } else {
            // Look for variable in inputs
            const input = inputs.find(input => input.name === trimmed);
            value = input ? input.value : trimmed;
          }
          
          result += String(value);
        }
      }
    }
    
    return result;
  }

  function evaluateMathExpression(equation, inputs) {
    // Simplified math evaluation for testing
    const variables = extractVariablesFromEquation(equation);
    const resolvedValues = {};
    
    for (const variable of variables) {
      const input = inputs.find(input => input.name === variable);
      if (input) {
        resolvedValues[variable] = input.value;
      } else {
        resolvedValues[variable] = 1; // default value
      }
    }
    
    // Simple substitution
    let substituted = equation;
    for (const [variable, value] of Object.entries(resolvedValues)) {
      const regex = new RegExp(`\\b${variable}\\b`, 'g');
      substituted = substituted.replace(regex, String(value));
    }
    
    // Use eval for simple math (in real code, this would use mathjs)
    return eval(substituted);
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
      // Fallback for string expressions that mathjs can't parse
      variables = equation.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
      variables = [...new Set(variables)];
    }
    return variables;
  }

  describe('String concatenation functionality', () => {
    it('should handle simple string concatenation with variables', () => {
      const inputs = [{ name: 'x', value: 18 }];
      const result = evaluateEquationWithStrings('x + "mm plywood"', inputs);
      expect(result).toBe("18mm plywood");
    });

    it('should handle string concatenation with multiple variables', () => {
      const inputs = [
        { name: 'x', value: 12 },
        { name: 'y', value: 18 }
      ];
      const result = evaluateEquationWithStrings('x + "x" + y + "mm sheet"', inputs);
      expect(result).toBe("12x18mm sheet");
    });

    it('should handle pure string concatenation', () => {
      const result = evaluateEquationWithStrings('"Plywood " + "Sheet"');
      expect(result).toBe("Plywood Sheet");
    });

    it('should maintain backward compatibility with mathematical expressions', () => {
      const inputs = [
        { name: 'x', value: 10 },
        { name: 'y', value: 5 }
      ];
      const result = evaluateEquationWithStrings('x + y * 2', inputs);
      expect(result).toBe(20); // 10 + 5*2 = 20
    });

    it('should handle mixed expressions for BOM use case', () => {
      const inputs = [
        { name: 'thickness', value: 6 },
        { name: 'material', value: "plywood" }
      ];
      const result = evaluateEquationWithStrings('thickness + "mm " + material', inputs);
      expect(result).toBe("6mm plywood");
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle empty strings', () => {
      const inputs = [{ name: 'x', value: 42 }];
      const result = evaluateEquationWithStrings('x + ""', inputs);
      expect(result).toBe("42");
    });

    it('should handle special characters in strings', () => {
      const inputs = [
        { name: 'x', value: "Bolt" },
        { name: 'y', value: 4 }
      ];
      const result = evaluateEquationWithStrings('x + " (qty: " + y + ")"', inputs);
      expect(result).toBe("Bolt (qty: 4)");
    });

    it('should handle single quotes', () => {
      const inputs = [{ name: 'thickness', value: 18 }];
      const result = evaluateEquationWithStrings("thickness + 'mm plywood'", inputs);
      expect(result).toBe("18mm plywood");
    });
  });
});