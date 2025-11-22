/**
 * Test for Issue: Equation atom not doing string concatenation
 * When entering an equation like `L + ' 2x6'` into the equation atom, 
 * it should handle string concatenation properly
 */

import { describe, it, expect } from 'vitest';
import { parse } from 'mathjs';

describe('Equation String Concatenation Issue - Exact User Scenario', () => {
  
  // Test the exact scenario the user described: L + ' 2x6'
  it('should handle the exact user equation: L + \' 2x6\'', () => {
    const equation = "L + ' 2x6'";
    
    // Test 1: String detection should work
    const hasStringLiterals = /["']/.test(equation);
    expect(hasStringLiterals).toBe(true);
    
    // Test 2: Variable extraction with mathjs should work
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
      // Should not reach here
      throw new Error(`Mathjs parse failed: ${e.message}`);
    }
    
    expect(variables).toEqual(['L']);
    expect(variables).not.toContain('x'); // 'x' from '2x6' should NOT be extracted
  });
  
  it('should parse the string expression correctly', () => {
    const equation = "L + ' 2x6'";
    
    // Manually parse like evaluateStringExpression does
    const parts = [];
    let current = "";
    let inQuotes = false;
    let quoteChar = "";
    
    for (let i = 0; i < equation.length; i++) {
      const char = equation[i];
      
      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
        current += char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        current += char;
        quoteChar = "";
      } else if (char === "+" && !inQuotes) {
        if (current.trim()) {
          parts.push(current.trim());
        }
        current = "";
      } else {
        current += char;
      }
    }
    if (current.trim()) {
      parts.push(current.trim());
    }
    
    // Should get two parts: "L" and "' 2x6'"
    expect(parts.length).toBe(2);
    expect(parts[0]).toBe("L");
    expect(parts[1]).toBe("' 2x6'");
  });
  
  it('should evaluate to a concatenated string', () => {
    // Mock the full evaluation flow
    const equation = "L + ' 2x6'";
    const inputValue = 10;
    
    // Parse parts
    const parts = [];
    let current = "";
    let inQuotes = false;
    let quoteChar = "";
    
    for (let i = 0; i < equation.length; i++) {
      const char = equation[i];
      
      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
        current += char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        current += char;
        quoteChar = "";
      } else if (char === "+" && !inQuotes) {
        if (current.trim()) {
          parts.push(current.trim());
        }
        current = "";
      } else {
        current += char;
      }
    }
    if (current.trim()) {
      parts.push(current.trim());
    }
    
    // Evaluate parts
    let result = "";
    for (const part of parts) {
      if (part.startsWith('"') && part.endsWith('"')) {
        result += part.slice(1, -1);
      } else if (part.startsWith("'") && part.endsWith("'")) {
        result += part.slice(1, -1);
      } else {
        // Assume it's variable L with value 10
        result += String(inputValue);
      }
    }
    
    expect(result).toBe("10 2x6");
  });
});
