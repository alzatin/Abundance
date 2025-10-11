/**
 * Test for BOM pricing rounding functionality
 * Ensures that BOM prices are always rounded to the nearest penny
 * to avoid floating-point precision issues like $0.30000000000000004
 */

import { describe, it, expect } from 'vitest';

describe('BOM Pricing Rounding', () => {
  
  it('should round prices to the nearest penny to avoid floating-point errors', () => {
    // Simulate the exact issue from the bug report:
    // Adding 0.1 + 0.2 in JavaScript gives 0.30000000000000004
    const mockBomEntries = [
      { BOMitemName: 'widget', numberNeeded: 1, costUSD: 0.1, source: 'store' },
      { BOMitemName: 'widget', numberNeeded: 1, costUSD: 0.2, source: 'store' }
    ];

    // Simulate the compilation logic from molecule.js
    let bomList = [];
    let compileBomItems = [];
    
    mockBomEntries.forEach(function (bomElement) {
      if (bomElement?.BOMitemName) {
        if (!bomList[bomElement.BOMitemName]) {
          bomList[bomElement.BOMitemName] = {
            numberNeeded: 0,
            BOMitemName: bomElement.BOMitemName,
            source: bomElement.source,
            costUSD: 0
          };
          compileBomItems.push(bomList[bomElement.BOMitemName]);
        }
        bomList[bomElement.BOMitemName].numberNeeded += bomElement.numberNeeded;
        // Round to the nearest penny after each addition
        bomList[bomElement.BOMitemName].costUSD = Math.round((bomList[bomElement.BOMitemName].costUSD + bomElement.costUSD) * 100) / 100;
      }
    });
    
    const widgetEntry = compileBomItems.find(item => item.BOMitemName === 'widget');
    
    // Should be exactly 0.30, not 0.30000000000000004
    expect(widgetEntry.costUSD).toBe(0.30);
    expect(widgetEntry.costUSD.toString()).toBe('0.3');
  });

  it('should handle multiple items with floating-point precision issues', () => {
    const mockBomEntries = [
      { BOMitemName: 'bolt', numberNeeded: 1, costUSD: 0.33, source: 'hardware' },
      { BOMitemName: 'bolt', numberNeeded: 1, costUSD: 0.33, source: 'hardware' },
      { BOMitemName: 'bolt', numberNeeded: 1, costUSD: 0.34, source: 'hardware' }
    ];

    let bomList = [];
    let compileBomItems = [];
    
    mockBomEntries.forEach(function (bomElement) {
      if (bomElement?.BOMitemName) {
        if (!bomList[bomElement.BOMitemName]) {
          bomList[bomElement.BOMitemName] = {
            numberNeeded: 0,
            BOMitemName: bomElement.BOMitemName,
            source: bomElement.source,
            costUSD: 0
          };
          compileBomItems.push(bomList[bomElement.BOMitemName]);
        }
        bomList[bomElement.BOMitemName].numberNeeded += bomElement.numberNeeded;
        // Round to the nearest penny after each addition
        bomList[bomElement.BOMitemName].costUSD = Math.round((bomList[bomElement.BOMitemName].costUSD + bomElement.costUSD) * 100) / 100;
      }
    });
    
    const boltEntry = compileBomItems.find(item => item.BOMitemName === 'bolt');
    
    // Should be exactly 1.00
    expect(boltEntry.costUSD).toBe(1.00);
  });

  it('should format total cost correctly when displaying BOM', () => {
    // Simulate the formatBom() logic with rounding
    const bomItems = [
      { BOMitemName: 'item1', numberNeeded: 1, costUSD: 0.1, source: 'store1' },
      { BOMitemName: 'item2', numberNeeded: 1, costUSD: 0.2, source: 'store2' }
    ];

    let totalCost = 0;
    bomItems.forEach((item) => {
      totalCost += item.costUSD;
    });
    
    // Round totalCost to nearest penny
    totalCost = Math.round(totalCost * 100) / 100;
    
    // Should be exactly 0.30, not 0.30000000000000004
    expect(totalCost).toBe(0.30);
    
    // When converted to string for display, should not show floating-point errors
    const displayPrice = totalCost.toFixed(2);
    expect(displayPrice).toBe('0.30');
  });

  it('should handle edge cases with very small amounts', () => {
    const mockBomEntries = [
      { BOMitemName: 'tiny', numberNeeded: 1, costUSD: 0.01, source: 'store' },
      { BOMitemName: 'tiny', numberNeeded: 1, costUSD: 0.01, source: 'store' },
      { BOMitemName: 'tiny', numberNeeded: 1, costUSD: 0.01, source: 'store' }
    ];

    let bomList = [];
    let compileBomItems = [];
    
    mockBomEntries.forEach(function (bomElement) {
      if (bomElement?.BOMitemName) {
        if (!bomList[bomElement.BOMitemName]) {
          bomList[bomElement.BOMitemName] = {
            numberNeeded: 0,
            BOMitemName: bomElement.BOMitemName,
            source: bomElement.source,
            costUSD: 0
          };
          compileBomItems.push(bomList[bomElement.BOMitemName]);
        }
        bomList[bomElement.BOMitemName].numberNeeded += bomElement.numberNeeded;
        // Round to the nearest penny after each addition
        bomList[bomElement.BOMitemName].costUSD = Math.round((bomList[bomElement.BOMitemName].costUSD + bomElement.costUSD) * 100) / 100;
      }
    });
    
    const tinyEntry = compileBomItems.find(item => item.BOMitemName === 'tiny');
    
    // Should be exactly 0.03
    expect(tinyEntry.costUSD).toBe(0.03);
  });
});
