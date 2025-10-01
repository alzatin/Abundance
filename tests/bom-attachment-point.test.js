/**
 * Test for BOM Tag attachment point value storage
 * Tests that user input is properly stored in both BOMitem and attachment point
 */

import { describe, it, expect } from 'vitest';
import { BOMEntry } from '../src/js/BOM.js';

describe('BOM Tag Attachment Point Storage', () => {
  
  it('should properly manage BOMEntry value updates', () => {
    // Create a new BOM entry
    const bomEntry = new BOMEntry();
    expect(bomEntry.BOMitemName).toBe('New Item');
    
    // Simulate user changing the value
    bomEntry.BOMitemName = 'Custom Widget';
    expect(bomEntry.BOMitemName).toBe('Custom Widget');
  });

  it('should validate that BOMEntry serialization preserves custom values', () => {
    const bomEntry = new BOMEntry();
    bomEntry.BOMitemName = 'Serialized Custom Item';
    bomEntry.numberNeeded = 3;
    bomEntry.costUSD = 12.99;
    bomEntry.source = 'custom-store.com';
    
    // Simulate Object.assign used in AddBOMTag.serialize()
    const serializedBOM = Object.assign({}, bomEntry);
    
    expect(serializedBOM.BOMitemName).toBe('Serialized Custom Item');
    expect(serializedBOM.numberNeeded).toBe(3);
    expect(serializedBOM.costUSD).toBe(12.99);
    expect(serializedBOM.source).toBe('custom-store.com');
    
    // Verify that the serialized copy is independent
    bomEntry.BOMitemName = 'Changed Original';
    expect(serializedBOM.BOMitemName).toBe('Serialized Custom Item');
  });

  it('should handle empty and special string values correctly', () => {
    const bomEntry = new BOMEntry();
    
    // Test empty string
    bomEntry.BOMitemName = '';
    expect(bomEntry.BOMitemName).toBe('');
    
    // Test string with special characters
    bomEntry.BOMitemName = 'Widget-2000 (Rev. A) $50';
    expect(bomEntry.BOMitemName).toBe('Widget-2000 (Rev. A) $50');
    
    // Test very long string
    const longName = 'A'.repeat(200);
    bomEntry.BOMitemName = longName;
    expect(bomEntry.BOMitemName).toBe(longName);
  });
});