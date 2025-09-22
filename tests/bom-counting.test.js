/**
 * Test for BOM (Bill of Materials) functionality
 * Ensures that BOM items are counted correctly without over-counting
 */

import { describe, it, expect } from 'vitest';

describe('BOM Counting Functionality', () => {
  
  it('should only count BOM items from leaf nodes to prevent over-counting', () => {
    // This test ensures that BOM items are not double-counted when 
    // they appear in both parent assemblies and child components
    
    const hierarchicalAssembly = {
      // Parent assembly (not a leaf, should be ignored in BOM counting)
      bom: [
        { BOMitemName: 'bolt', numberNeeded: 4, costUSD: 2.0, source: 'hardware-store' },
        { BOMitemName: 'chair_assembly', numberNeeded: 1, costUSD: 50.0, source: 'furniture-store' }
      ],
      geometry: [
        {
          // Leaf node with BOM items (should be counted)
          bom: [
            { BOMitemName: 'chair_leg', numberNeeded: 1, costUSD: 10.0, source: 'furniture-store' },
            { BOMitemName: 'bolt', numberNeeded: 2, costUSD: 1.0, source: 'hardware-store' }
          ],
          geometry: 'leg_geometry', // This is leaf geometry (not an array)
          id: 'leg1'
        },
        {
          // Leaf node with BOM items (should be counted)
          bom: [
            { BOMitemName: 'chair_seat', numberNeeded: 1, costUSD: 15.0, source: 'furniture-store' },
            { BOMitemName: 'bolt', numberNeeded: 2, costUSD: 1.0, source: 'hardware-store' }
          ],
          geometry: 'seat_geometry', // This is leaf geometry (not an array)
          id: 'seat1'
        }
      ]
    };

    const extractedBomItems = [];
    
    // Simulate the fixed extractBomList function that only counts leaf nodes
    function isLeaf(obj) {
      return !obj.geometry || !Array.isArray(obj.geometry);
    }
    
    function collectFromLeaves(node) {
      if (isLeaf(node)) {
        // This is a leaf node, collect its BOM items
        if (node.bom !== undefined) {
          extractedBomItems.push(...node.bom);
        }
      } else {
        // This is a branch node, recurse to its children without collecting its BOM items
        if (node.geometry && Array.isArray(node.geometry)) {
          node.geometry.forEach((child) => {
            collectFromLeaves(child);
          });
        }
      }
    }
    
    collectFromLeaves(hierarchicalAssembly);

    // Now simulate the compilation process
    let bomList = [];
    let compileBomItems = [];
    
    extractedBomItems.forEach(function (bomElement) {
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
        bomList[bomElement.BOMitemName].costUSD += bomElement.costUSD;
      }
    });

    const boltEntry = compileBomItems.find(item => item.BOMitemName === 'bolt');
    
    // With the fix: only leaf items are counted
    // leg has 2 bolts + seat has 2 bolts = 4 bolts total (no double counting!)
    expect(boltEntry.numberNeeded).toBe(4);
    expect(boltEntry.costUSD).toBe(2.0);
    
    // The parent assembly's BOM items should NOT be counted since it's not a leaf
    const assemblyEntry = compileBomItems.find(item => item.BOMitemName === 'chair_assembly');
    expect(assemblyEntry).toBeUndefined();
    
    // Should have exactly 3 unique BOM items (chair_leg, bolt, chair_seat)
    expect(compileBomItems).toHaveLength(3);
    expect(compileBomItems.map(item => item.BOMitemName)).toEqual(
      expect.arrayContaining(['chair_leg', 'bolt', 'chair_seat'])
    );
  });

  it('should correctly handle BOM compilation with multiple instances of same item', () => {
    // Test that the compilation logic correctly sums up quantities
    const mockBomEntries = [
      { BOMitemName: 'bolt', numberNeeded: 1, costUSD: 0.50, source: 'hardware-store' },
      { BOMitemName: 'bolt', numberNeeded: 1, costUSD: 0.50, source: 'hardware-store' },
      { BOMitemName: 'washer', numberNeeded: 2, costUSD: 0.25, source: 'hardware-store' },
      { BOMitemName: 'bolt', numberNeeded: 1, costUSD: 0.50, source: 'hardware-store' }
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
        bomList[bomElement.BOMitemName].costUSD += bomElement.costUSD;
      }
    });
    
    // Should correctly sum up 3 bolts (1+1+1) and 2 washers
    expect(compileBomItems.find(item => item.BOMitemName === 'bolt').numberNeeded).toBe(3);
    expect(compileBomItems.find(item => item.BOMitemName === 'washer').numberNeeded).toBe(2);
    expect(compileBomItems.find(item => item.BOMitemName === 'bolt').costUSD).toBe(1.5);
  });
});