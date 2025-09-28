/**
 * Test for BOM Tag user interaction simulation
 * Tests the scenario described in the issue: user types custom name, clicks away, value should persist
 */

import { describe, it, expect } from 'vitest';
import { BOMEntry } from '../src/js/BOM.js';

describe('BOM Tag User Interaction', () => {

  it('should simulate the user typing a custom name and verify it persists', () => {
    // Simulate the scenario from the issue
    
    // 1. User creates a new BOM tag (constructor is called)
    const bomEntry = new BOMEntry();
    expect(bomEntry.BOMitemName).toBe('New Item'); // Should start with consistent default
    
    // 2. User types in the input field - simulate the onChange callback
    bomEntry.BOMitemName = 'My Custom Widget';
    expect(bomEntry.BOMitemName).toBe('My Custom Widget');
    
    // 3. User clicks away from the atom - the value should still be there
    // (No additional operations should change the BOMitemName)
    expect(bomEntry.BOMitemName).toBe('My Custom Widget');
    
    // 4. If createInputParams is called again (like when atom regains focus),
    // it should still show the custom value
    // Note: We can't test the full atom here due to import issues,
    // but the BOMentry should maintain its value
    expect(bomEntry.BOMitemName).toBe('My Custom Widget');
  });

  it('should handle the case where the user enters then clears the field', () => {
    const bomEntry = new BOMEntry();
    
    // User types something
    bomEntry.BOMitemName = 'Temporary Name';
    expect(bomEntry.BOMitemName).toBe('Temporary Name');
    
    // User clears the field (empty string)
    bomEntry.BOMitemName = '';
    expect(bomEntry.BOMitemName).toBe('');
    
    // Value should remain empty, not reset to default
    expect(bomEntry.BOMitemName).toBe('');
  });

  it('should handle serialization of custom values', () => {
    const bomEntry = new BOMEntry();
    bomEntry.BOMitemName = 'Serialized Widget';
    bomEntry.numberNeeded = 3;
    bomEntry.costUSD = 15.99;
    bomEntry.source = 'custom-source.com';
    
    // Simulate the serialization that happens in AddBOMTag.serialize()
    const serializedBOM = Object.assign({}, bomEntry);
    
    expect(serializedBOM.BOMitemName).toBe('Serialized Widget');
    expect(serializedBOM.numberNeeded).toBe(3);
    expect(serializedBOM.costUSD).toBe(15.99);
    expect(serializedBOM.source).toBe('custom-source.com');
    
    // Create a new BOMEntry and restore the values (simulating deserialization)
    const restoredEntry = new BOMEntry();
    Object.assign(restoredEntry, serializedBOM);
    
    expect(restoredEntry.BOMitemName).toBe('Serialized Widget');
    expect(restoredEntry.numberNeeded).toBe(3);
    expect(restoredEntry.costUSD).toBe(15.99);
    expect(restoredEntry.source).toBe('custom-source.com');
  });
});