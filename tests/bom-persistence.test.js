/**
 * Test for BOM Tag persistence functionality
 * Tests that BOM item names are properly preserved when the atom loses and regains focus
 */

import { describe, it, expect, beforeEach } from 'vitest';
import AddBOMTag from '../src/molecules/BOM.js';

describe('BOM Tag Persistence', () => {
  
  it('should preserve BOM item name after construction and value changes', () => {
    // Create a new BOM tag atom
    const bomTag = new AddBOMTag();
    
    // Initially, the BOM item should have the default "name" value from BOMEntry
    expect(bomTag.BOMitem.BOMitemName).toBe('name');
    
    // Simulate user changing the item name
    bomTag.BOMitem.BOMitemName = 'Custom Widget';
    
    // Verify the change was applied
    expect(bomTag.BOMitem.BOMitemName).toBe('Custom Widget');
    
    // Simulate what happens when creating input params (like when atom gets focus)
    const inputParams = bomTag.createInputParams();
    const itemNameParam = inputParams[bomTag.uniqueID + 'BOMitemName'];
    
    // The input parameter should reflect the current BOM item name, not reset to default
    expect(itemNameParam.value).toBe('Custom Widget');
  });

  it('should preserve BOM item name during serialization/deserialization cycle', () => {
    // Create a new BOM tag atom with custom name
    const originalBomTag = new AddBOMTag();
    originalBomTag.BOMitem.BOMitemName = 'My Custom Item';
    originalBomTag.BOMitem.numberNeeded = 5;
    originalBomTag.BOMitem.costUSD = 10.50;
    originalBomTag.BOMitem.source = 'example.com';
    
    // Serialize the atom
    const serializedData = originalBomTag.serialize();
    
    // Verify the BOMitem is included in serialized data
    expect(serializedData.BOMitem).toBeDefined();
    expect(serializedData.BOMitem.BOMitemName).toBe('My Custom Item');
    
    // Create a new atom and deserialize the data
    const restoredBomTag = new AddBOMTag(serializedData);
    
    // Verify the BOM item was properly restored
    expect(restoredBomTag.BOMitem.BOMitemName).toBe('My Custom Item');
    expect(restoredBomTag.BOMitem.numberNeeded).toBe(5);
    expect(restoredBomTag.BOMitem.costUSD).toBe(10.50);
    expect(restoredBomTag.BOMitem.source).toBe('example.com');
    
    // Verify input params reflect the restored values
    const inputParams = restoredBomTag.createInputParams();
    const itemNameParam = inputParams[restoredBomTag.uniqueID + 'BOMitemName'];
    expect(itemNameParam.value).toBe('My Custom Item');
  });

  it('should handle default values correctly for new atoms', () => {
    // Create a new BOM tag atom
    const bomTag = new AddBOMTag();
    
    // Create input params for a new atom
    const inputParams = bomTag.createInputParams();
    const itemNameParam = inputParams[bomTag.uniqueID + 'BOMitemName'];
    
    // For a new atom, should use the BOMitem.BOMitemName value ("name")
    // not the defaultValue from the input definition ("New Item")
    expect(itemNameParam.value).toBe('name');
  });

  it('should handle the case where findIOValue returns a value', () => {
    // Create a BOM tag atom
    const bomTag = new AddBOMTag();
    
    // Mock findIOValue to return a specific value (simulating connected input)
    const originalFindIOValue = bomTag.findIOValue;
    bomTag.findIOValue = (name) => {
      if (name === 'Item Name') return 'Connected Value';
      return originalFindIOValue.call(bomTag, name);
    };
    
    // Create input params
    const inputParams = bomTag.createInputParams();
    const itemNameParam = inputParams[bomTag.uniqueID + 'BOMitemName'];
    
    // Should use the findIOValue result over the BOMitem value
    expect(itemNameParam.value).toBe('Connected Value');
  });
});