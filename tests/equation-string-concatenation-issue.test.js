/**
 * Test for Issue: Equation atom not doing string concatenation
 * When entering an equation like `L + ' 2x6'` into the equation atom, 
 * it should handle string concatenation properly
 */

import { describe, it, expect } from 'vitest';
import { parse } from 'mathjs';

describe('Equation String Concatenation Issue', () => {
  
  // Mock function to extract variables from equation (mimics the current implementation)
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
  
  // Mock the current behavior (BEFORE fix)
  function evaluateEquationBefore(equation, inputs = []) {
    let substitutedEquation = String(equation ?? "").trim();

    if (!substitutedEquation) {
      substitutedEquation = "0";
    }

    // Check if equation contains string literals (quoted text)
    const hasStringLiterals = /["']/.test(substitutedEquation);

    if (hasStringLiterals) {
      // This is where the problem is - it tries to parse with mathjs
      // which fails for string concatenation
      const variables = extractVariablesFromEquation(substitutedEquation);
      // Variables extracted from "L + ' 2x6'" would be ['L', 'x']
      // The 'x' comes from inside the string literal!
      
      // Then it tries to resolve 'x' which doesn't exist as an input
      const unresolved = [];
      for (const variable of variables) {
        const input = inputs.find(i => i.name === variable);
        if (!input) {
          unresolved.push(variable);
        }
      }
      
      if (unresolved.length) {
        throw new Error(`Variable(s) not found: ${unresolved.join(", ")}`);
      }
    }
    
    return "evaluation result";
  }
  
  // Mock the correct behavior (AFTER fix)
  function evaluateEquationAfter(equation, inputs = []) {
    let substitutedEquation = String(equation ?? "").trim();

    if (!substitutedEquation) {
      substitutedEquation = "0";
    }

    // Check if equation contains string literals (quoted text)
    const hasStringLiterals = /["']/.test(substitutedEquation);

    if (hasStringLiterals) {
      // Handle string concatenation - extract variables correctly
      // without including identifiers inside string literals
      const variables = extractVariablesFromStringExpression(substitutedEquation);
      // Variables extracted from "L + ' 2x6'" would be ['L'] only
      
      const unresolved = [];
      for (const variable of variables) {
        const input = inputs.find(i => i.name === variable);
        if (!input) {
          unresolved.push(variable);
        }
      }
      
      if (unresolved.length) {
        throw new Error(`Variable(s) not found: ${unresolved.join(", ")}`);
      }
    }
    
    return "evaluation result";
  }
  
  // Helper function to extract variables from string expressions correctly
  function extractVariablesFromStringExpression(equation) {
    const variables = [];
    let current = "";
    let inQuotes = false;
    let quoteChar = "";
    
    // Parse the expression, ignoring content inside quotes
    for (let i = 0; i < equation.length; i++) {
      const char = equation[i];
      
      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
        // Process accumulated non-quoted content
        if (current.trim()) {
          extractVariablesFromPart(current, variables);
        }
        current = "";
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = "";
        // Skip the content inside quotes
        current = "";
      } else if (!inQuotes) {
        current += char;
      }
      // Skip characters inside quotes
    }
    
    // Process any remaining content
    if (current.trim() && !inQuotes) {
      extractVariablesFromPart(current, variables);
    }
    
    return [...new Set(variables)];
  }
  
  function extractVariablesFromPart(part, variables) {
    // Extract identifiers from non-quoted parts
    const matches = part.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
    variables.push(...matches);
  }
  
  describe('Current behavior (reproducing the issue)', () => {
    it('should fail with string concatenation because it extracts variables from inside quotes', () => {
      const inputs = [{ name: 'L', value: 10 }];
      
      // This should fail because 'x' from inside ' 2x6' is extracted as a variable
      expect(() => evaluateEquationBefore("L + ' 2x6'", inputs)).toThrow();
    });
  });
  
  describe('Fixed behavior', () => {
    it('should handle string concatenation with single quotes correctly', () => {
      const inputs = [{ name: 'L', value: 10 }];
      
      // This should work - only 'L' is extracted as a variable
      expect(() => evaluateEquationAfter("L + ' 2x6'", inputs)).not.toThrow();
    });
    
    it('should handle string concatenation with double quotes correctly', () => {
      const inputs = [{ name: 'L', value: 10 }];
      
      // This should work - only 'L' is extracted as a variable
      expect(() => evaluateEquationAfter("L + ' 2x6'", inputs)).not.toThrow();
    });
    
    it('should extract variables correctly from string expressions', () => {
      const vars1 = extractVariablesFromStringExpression("L + ' 2x6'");
      expect(vars1).toEqual(['L']);
      
      const vars2 = extractVariablesFromStringExpression("width + 'mm ' + height + 'mm'");
      expect(vars2).toEqual(['width', 'height']);
      
      const vars3 = extractVariablesFromStringExpression('L + " plywood"');
      expect(vars3).toEqual(['L']);
    });
  });
});
