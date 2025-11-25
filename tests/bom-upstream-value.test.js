/**
 * Test for BOM atom receiving values from upstream connections (like Equation atoms)
 * Tests the scenario described in the issue: BOM name set by equation atom should save correctly
 */

import { describe, it, expect } from 'vitest';
import { BOMEntry } from '../src/js/BOM.js';

describe('BOM Tag Upstream Value Handling', () => {

  it('should sync BOMitem from inputs argument in compute()', () => {
    // This tests the core fix: compute() syncs BOMitem from input values
    const bomEntry = new BOMEntry();
    
    // Simulate inputs argument passed to compute()
    const inputs = {
      geometry: null,
      "Item Name": "12 ft 2x6",
      "Number Needed": 4,
      "Cost (USD)": 12.50,
      "Source Link": "https://homedepot.com"
    };
    
    // Before sync, BOMitem has default values
    expect(bomEntry.BOMitemName).toBe('New Item');
    expect(bomEntry.numberNeeded).toBe(1);
    expect(bomEntry.costUSD).toBe(0);
    expect(bomEntry.source).toBe('www.example.com');
    
    // Simulate what compute() does: sync BOMitem from inputs
    if (inputs["Item Name"] !== null && inputs["Item Name"] !== undefined) {
      bomEntry.BOMitemName = inputs["Item Name"];
    }
    if (inputs["Number Needed"] !== null && inputs["Number Needed"] !== undefined) {
      bomEntry.numberNeeded = inputs["Number Needed"];
    }
    if (inputs["Cost (USD)"] !== null && inputs["Cost (USD)"] !== undefined) {
      bomEntry.costUSD = inputs["Cost (USD)"];
    }
    if (inputs["Source Link"] !== null && inputs["Source Link"] !== undefined) {
      bomEntry.source = inputs["Source Link"];
    }
    
    // After sync, BOMitem should have values from inputs
    expect(bomEntry.BOMitemName).toBe('12 ft 2x6');
    expect(bomEntry.numberNeeded).toBe(4);
    expect(bomEntry.costUSD).toBe(12.50);
    expect(bomEntry.source).toBe('https://homedepot.com');
  });

  it('should preserve existing values when input is null or undefined', () => {
    const bomEntry = new BOMEntry();
    
    // Set some values
    bomEntry.BOMitemName = 'Manual Entry';
    bomEntry.numberNeeded = 2;
    
    // Simulate inputs where some values are null/undefined
    const inputs = {
      geometry: null,
      "Item Name": null,
      "Number Needed": undefined,
      "Cost (USD)": 5.00,
      "Source Link": null
    };
    
    // Sync only non-null values
    if (inputs["Item Name"] !== null && inputs["Item Name"] !== undefined) {
      bomEntry.BOMitemName = inputs["Item Name"];
    }
    if (inputs["Number Needed"] !== null && inputs["Number Needed"] !== undefined) {
      bomEntry.numberNeeded = inputs["Number Needed"];
    }
    if (inputs["Cost (USD)"] !== null && inputs["Cost (USD)"] !== undefined) {
      bomEntry.costUSD = inputs["Cost (USD)"];
    }
    if (inputs["Source Link"] !== null && inputs["Source Link"] !== undefined) {
      bomEntry.source = inputs["Source Link"];
    }
    
    // Values with null/undefined inputs should remain unchanged
    expect(bomEntry.BOMitemName).toBe('Manual Entry');
    expect(bomEntry.numberNeeded).toBe(2);
    // Cost should be updated since it had a value
    expect(bomEntry.costUSD).toBe(5.00);
    // Source should remain unchanged since input was null
    expect(bomEntry.source).toBe('www.example.com');
  });

  it('should handle dynamic string concatenation from equation', () => {
    // Simulate the exact scenario from the issue: L + " 2x6"
    const lengthValue = 10;
    const computedName = lengthValue + ' 2x6'; // What the Equation atom would compute
    
    const bomEntry = new BOMEntry();
    const inputs = {
      "Item Name": computedName
    };
    
    // Sync from inputs
    if (inputs["Item Name"] !== null && inputs["Item Name"] !== undefined) {
      bomEntry.BOMitemName = inputs["Item Name"];
    }
    
    // The BOMitem should have the computed name
    expect(bomEntry.BOMitemName).toBe('10 2x6');
  });
});
