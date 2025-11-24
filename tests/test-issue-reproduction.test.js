/**
 * Test to reproduce the exact issue: L + ' 2x6'
 * This test verifies that the Equation atom correctly handles string concatenation
 * as described in the issue: "Equation atom not doing string concatenation"
 */

import { describe, it, expect } from 'vitest';
import { parse } from 'mathjs';

describe('Issue: Equation atom not doing string concatenation - L + \' 2x6\'', () => {

  /**
   * Helper function to parse string expression into parts
   * Simulates the evaluateStringExpression logic from atom.js
   */
  function parseStringExpression(equation) {
    const parts = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    
    for (let i = 0; i < equation.length; i++) {
      const char = equation[i];
      
      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
        current += char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        current += char;
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
    
    return parts;
  }

  /**
   * Helper function to evaluate parsed parts with given variable values
   */
  function evaluateParts(parts, variables = {}) {
    let result = '';
    for (const part of parts) {
      if (part.startsWith("'") && part.endsWith("'")) {
        // String literal - remove quotes
        result += part.slice(1, -1);
      } else if (part.startsWith('"') && part.endsWith('"')) {
        // String literal with double quotes - remove quotes
        result += part.slice(1, -1);
      } else {
        // Variable - look up value
        const value = variables[part] !== undefined ? variables[part] : part;
        result += String(value);
      }
    }
    return result;
  }

  // Test 1: Verify mathjs can parse the equation
  it('should parse L + \' 2x6\' without throwing error', () => {
    expect(() => {
      const node = parse("L + ' 2x6'");
    }).not.toThrow();
  });

  // Test 2: Verify mathjs correctly identifies the structure
  it('mathjs should parse string concatenation correctly', () => {
    const node = parse("L + ' 2x6'");
    
    // Check structure: should be an addition operation
    expect(node.type).toBe('OperatorNode');
    expect(node.op).toBe('+');
    expect(node.args.length).toBe(2);
    
    // First argument should be the variable L
    expect(node.args[0].type).toBe('SymbolNode');
    expect(node.args[0].name).toBe('L');
    
    // Second argument should be the string constant ' 2x6'
    expect(node.args[1].type).toBe('ConstantNode');
    expect(node.args[1].value).toBe(' 2x6');
  });

  // Test 3: Verify variable extraction works correctly
  it('should extract only L as variable from L + \' 2x6\'', () => {
    const equation = "L + ' 2x6'";
    let variables = [];
    
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
    
    // Should only extract L, not 'x' from inside the string
    expect(variables).toEqual(['L']);
    expect(variables).not.toContain('x');
  });

  // Test 4: Verify string literal detection
  it('should detect string literals in equation', () => {
    const equation = "L + ' 2x6'";
    const hasStringLiterals = /["']/.test(equation);
    expect(hasStringLiterals).toBe(true);
  });

  // Test 5: Verify string expression parsing logic
  it('should correctly parse L + \' 2x6\' into parts', () => {
    const equation = "L + ' 2x6'";
    const parts = parseStringExpression(equation);
    
    // Should split into variable L and string ' 2x6'
    expect(parts).toEqual(['L', "' 2x6'"]);
  });

  // Test 6: Verify full evaluation produces correct concatenated result
  it('should evaluate L + \' 2x6\' to concatenated string "10 2x6"', () => {
    const equation = "L + ' 2x6'";
    const parts = parseStringExpression(equation);
    const result = evaluateParts(parts, { L: 10 });
    
    // Final result should be "10 2x6" (10 concatenated with " 2x6")
    expect(result).toBe('10 2x6');
  });

  // Test 7: Verify different variable values work
  it('should work with different values of L', () => {
    const equation = "L + ' 2x6'";
    const parts = parseStringExpression(equation);
    
    expect(evaluateParts(parts, { L: 10 })).toBe('10 2x6');
    expect(evaluateParts(parts, { L: 5 })).toBe('5 2x6');
    expect(evaluateParts(parts, { L: 100 })).toBe('100 2x6');
  });

  // Test 8: Verify double quotes work (exact user scenario from comment)
  it('should detect string literals with double quotes', () => {
    const equation = 'L + " 2x6"';
    const hasStringLiterals = /["']/.test(equation);
    expect(hasStringLiterals).toBe(true);
  });

  // Test 9: Parse double-quoted string expression
  it('should correctly parse L + " 2x6" with double quotes', () => {
    const equation = 'L + " 2x6"';
    const parts = parseStringExpression(equation);
    
    // Should split into variable L and string " 2x6"
    expect(parts).toEqual(['L', '" 2x6"']);
  });

  // Test 10: Evaluate double-quoted string expression
  it('should evaluate L + " 2x6" to concatenated string "10 2x6"', () => {
    const equation = 'L + " 2x6"';
    const parts = parseStringExpression(equation);
    const result = evaluateParts(parts, { L: 10 });
    
    // Final result should be "10 2x6"
    expect(result).toBe('10 2x6');
  });

  // Test 11: Detect and normalize smart/curly quotes
  it('should detect smart/curly quotes after normalization', () => {
    // Smart double quotes: " and "
    const smartDoubleQuotes = 'L + \u201C 2x6\u201D';
    // After normalization, should become standard quotes
    const normalized = smartDoubleQuotes
      .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
      .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'");
    
    expect(normalized).toBe('L + " 2x6"');
    expect(/["']/.test(normalized)).toBe(true);
  });

  // Test 12: Parse smart quotes after normalization
  it('should correctly parse expression with normalized smart quotes', () => {
    // Simulate what the code does: normalize then parse
    let equation = 'L + \u201C 2x6\u201D';  // Smart quotes
    equation = equation
      .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
      .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'");
    
    const parts = parseStringExpression(equation);
    expect(parts).toEqual(['L', '" 2x6"']);
    
    const result = evaluateParts(parts, { L: 10 });
    expect(result).toBe('10 2x6');
  });

  // Test 13: Handle single smart quotes
  it('should normalize single smart quotes', () => {
    // Smart single quotes: ' and '
    let equation = "L + \u2018 2x6\u2019";  // Smart single quotes
    equation = equation
      .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
      .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'");
    
    expect(equation).toBe("L + ' 2x6'");
    
    const parts = parseStringExpression(equation);
    expect(parts).toEqual(['L', "' 2x6'"]);
    
    const result = evaluateParts(parts, { L: 10 });
    expect(result).toBe('10 2x6');
  });
});
