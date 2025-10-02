/**
 * Simple test for BOM Tag basic functionality
 */

import { describe, it, expect } from 'vitest';
import { BOMEntry } from '../src/js/BOM.js';

describe('BOM Basic Functionality', () => {

  it('should create BOMEntry with correct default values', () => {
    const bomEntry = new BOMEntry();
    
    expect(bomEntry.BOMitemName).toBe('New Item');
    expect(bomEntry.numberNeeded).toBe(1);
    expect(bomEntry.costUSD).toBe(0.0);
    expect(bomEntry.source).toBe('www.example.com');
  });

  it('should allow modification of BOMEntry values', () => {
    const bomEntry = new BOMEntry();
    
    bomEntry.BOMitemName = 'Custom Widget';
    bomEntry.numberNeeded = 5;
    bomEntry.costUSD = 12.50;
    bomEntry.source = 'custom-source.com';
    
    expect(bomEntry.BOMitemName).toBe('Custom Widget');
    expect(bomEntry.numberNeeded).toBe(5);
    expect(bomEntry.costUSD).toBe(12.50);
    expect(bomEntry.source).toBe('custom-source.com');
  });
});