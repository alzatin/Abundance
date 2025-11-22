/**
 * Test to reproduce the exact issue: L + ' 2x6'
 */

import { describe, it, expect } from 'vitest';
import { parse } from 'mathjs';

describe('Issue Reproduction: Equation atom not doing string concatenation', () => {

  // Test mathjs parsing behavior
  it('should parse L + \' 2x6\' without throwing error', () => {
    expect(() => {
      const node = parse("L + ' 2x6'");
    }).not.toThrow();
  });

  it('mathjs should parse string concatenation correctly', () => {
    const node = parse("L + ' 2x6'");
    
    // Check structure
    expect(node.type).toBe('OperatorNode');
    expect(node.op).toBe('+');
    expect(node.args.length).toBe(2);
    expect(node.args[0].type).toBe('SymbolNode');
    expect(node.args[0].name).toBe('L');
    expect(node.args[1].type).toBe('ConstantNode');
    expect(node.args[1].value).toBe(' 2x6');
  });

  // Test variable extraction
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
    
    expect(variables).toEqual(['L']);
  });

  // Test string concatenation evaluation
  it('should detect string literals in equation', () => {
    const equation = "L + ' 2x6'";
    const hasStringLiterals = /["']/.test(equation);
    expect(hasStringLiterals).toBe(true);
  });

  // Test evaluateStringExpression logic
  it('should correctly parse and evaluate string expression', () => {
    const equation = "L + ' 2x6'";
    
    // Simulate evaluateStringExpression
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
    
    expect(parts).toEqual(['L', "' 2x6'"]);
    
    // Simulate evaluation
    let result = '';
    for (const part of parts) {
      if (part.startsWith("'") && part.endsWith("'")) {
        result += part.slice(1, -1);
      } else {
        // Assume L = 10
        result += '10';
      }
    }
    
    expect(result).toBe('10 2x6');
  });
});
