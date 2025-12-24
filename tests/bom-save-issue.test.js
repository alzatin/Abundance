/**
 * Test to reproduce the BOM tag values not saving correctly issue
 * The issue: onChange handlers for Number Needed, Cost (USD), and Source Link
 * update BOMitem but don't update the attachment point value, so the values
 * aren't properly saved during serialization.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import AddBOMTag from '../src/molecules/BOM.js';

describe('BOM Tag Value Saving Issue', () => {
  let bomAtom;

  beforeEach(() => {
    // Create a fresh BOM atom for each test
    bomAtom = new AddBOMTag({});
  });

  it('should update attachment point when Item Name changes via onChange', () => {
    const itemNameInput = bomAtom.inputs.find(input => input.name === "Item Name");
    expect(itemNameInput).toBeDefined();
    
    // Simulate the UI onChange handler being called
    const params = bomAtom.createInputParams();
    const itemNameKey = Object.keys(params).find(k => k.endsWith('BOMitemName'));
    
    // Call onChange to simulate user input
    params[itemNameKey].onChange("Custom Item");
    
    // Both BOMitem and attachment point should be updated
    expect(bomAtom.BOMitem.BOMitemName).toBe("Custom Item");
    expect(bomAtom.findIOValue("Item Name")).toBe("Custom Item");
  });

  it('BUG: Number Needed onChange does not update attachment point', () => {
    const numberNeededInput = bomAtom.inputs.find(input => input.name === "Number Needed");
    expect(numberNeededInput).toBeDefined();
    
    // Get the initial value from attachment point
    const initialValue = bomAtom.findIOValue("Number Needed");
    expect(initialValue).toBe(1); // default value
    
    // Simulate the UI onChange handler being called
    const params = bomAtom.createInputParams();
    const numberNeededKey = Object.keys(params).find(k => k.endsWith('numberNeeded'));
    
    // Call onChange to simulate user changing the value
    params[numberNeededKey].onChange(5);
    
    // BOMitem is updated
    expect(bomAtom.BOMitem.numberNeeded).toBe(5);
    
    // BUG: Attachment point is NOT updated, still has old value
    const updatedValue = bomAtom.findIOValue("Number Needed");
    // This test documents the bug - the attachment point doesn't get updated
    expect(updatedValue).toBe(1); // Still the default value!
  });

  it('BUG: Cost (USD) onChange does not update attachment point', () => {
    const costInput = bomAtom.inputs.find(input => input.name === "Cost (USD)");
    expect(costInput).toBeDefined();
    
    const initialValue = bomAtom.findIOValue("Cost (USD)");
    expect(initialValue).toBe(0);
    
    const params = bomAtom.createInputParams();
    const costKey = Object.keys(params).find(k => k.endsWith('costUSD'));
    
    params[costKey].onChange(12.50);
    
    expect(bomAtom.BOMitem.costUSD).toBe(12.50);
    
    // BUG: Attachment point is NOT updated
    const updatedValue = bomAtom.findIOValue("Cost (USD)");
    expect(updatedValue).toBe(0); // Still the default value!
  });

  it('BUG: Source Link onChange does not update attachment point', () => {
    const sourceInput = bomAtom.inputs.find(input => input.name === "Source Link");
    expect(sourceInput).toBeDefined();
    
    const initialValue = bomAtom.findIOValue("Source Link");
    expect(initialValue).toBe("");
    
    const params = bomAtom.createInputParams();
    const sourceKey = Object.keys(params).find(k => k.endsWith('source'));
    
    params[sourceKey].onChange("https://example.com");
    
    expect(bomAtom.BOMitem.source).toBe("https://example.com");
    
    // BUG: Attachment point is NOT updated
    const updatedValue = bomAtom.findIOValue("Source Link");
    expect(updatedValue).toBe(""); // Still the default value!
  });
});
