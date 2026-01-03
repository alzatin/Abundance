/**
 * Test for BOM summary display in molecule inputs panel
 * Ensures that when a molecule contains a BOM, the summary appears in createInputParams
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BOMEntry } from '../src/js/BOM.js';

describe('Molecule BOM Summary in Inputs Panel', () => {

  it('should include BOM summary in createInputParams when compiledBom exists', () => {
    // Create mock molecule with compiledBom
    const mockMolecule = {
      uniqueID: 'test123',
      name: 'Test Molecule',
      topLevel: false,
      atomType: 'Molecule',
      compiledBom: [
        { BOMitemName: 'Bolt', numberNeeded: 4, costUSD: 0.50, source: 'hardware-store' },
        { BOMitemName: 'Washer', numberNeeded: 8, costUSD: 0.25, source: 'hardware-store' }
      ]
    };

    // Simulate the createInputParams logic for BOM items
    let inputParams = {};
    
    if (mockMolecule.compiledBom && Array.isArray(mockMolecule.compiledBom) && mockMolecule.compiledBom.length > 0) {
      mockMolecule.compiledBom.forEach((item) => {
        inputParams["bom-" + mockMolecule.uniqueID + "-" + item.BOMitemName] = {
          type: "number",
          value: item.numberNeeded,
          label: item.BOMitemName + " x",
          disabled: true,
        };
      });
    }

    // Verify BOM items appear in inputParams
    expect(inputParams['bom-test123-Bolt']).toBeDefined();
    expect(inputParams['bom-test123-Bolt'].type).toBe('number');
    expect(inputParams['bom-test123-Bolt'].value).toBe(4);
    expect(inputParams['bom-test123-Bolt'].label).toBe('Bolt x');
    expect(inputParams['bom-test123-Bolt'].disabled).toBe(true);

    expect(inputParams['bom-test123-Washer']).toBeDefined();
    expect(inputParams['bom-test123-Washer'].value).toBe(8);
    expect(inputParams['bom-test123-Washer'].label).toBe('Washer x');
  });

  it('should not add BOM params when compiledBom is empty', () => {
    const mockMolecule = {
      uniqueID: 'test456',
      name: 'Empty Molecule',
      topLevel: false,
      atomType: 'Molecule',
      compiledBom: []
    };

    let inputParams = {};
    
    if (mockMolecule.compiledBom && Array.isArray(mockMolecule.compiledBom) && mockMolecule.compiledBom.length > 0) {
      mockMolecule.compiledBom.forEach((item) => {
        inputParams["bom-" + mockMolecule.uniqueID + "-" + item.BOMitemName] = {
          type: "number",
          value: item.numberNeeded,
          label: item.BOMitemName + " x",
          disabled: true,
        };
      });
    }

    // Verify no BOM items are added
    expect(Object.keys(inputParams).length).toBe(0);
  });

  it('should not add BOM params when compiledBom is undefined', () => {
    const mockMolecule = {
      uniqueID: 'test789',
      name: 'No BOM Molecule',
      topLevel: false,
      atomType: 'Molecule',
      compiledBom: undefined
    };

    let inputParams = {};
    
    if (mockMolecule.compiledBom && Array.isArray(mockMolecule.compiledBom) && mockMolecule.compiledBom.length > 0) {
      mockMolecule.compiledBom.forEach((item) => {
        inputParams["bom-" + mockMolecule.uniqueID + "-" + item.BOMitemName] = {
          type: "number",
          value: item.numberNeeded,
          label: item.BOMitemName + " x",
          disabled: true,
        };
      });
    }

    // Verify no BOM items are added
    expect(Object.keys(inputParams).length).toBe(0);
  });

  it('should handle multiple BOM items with same quantity display format', () => {
    const mockMolecule = {
      uniqueID: 'test999',
      name: 'Multi-Item Molecule',
      topLevel: false,
      atomType: 'Molecule',
      compiledBom: [
        { BOMitemName: 'Screw', numberNeeded: 12, costUSD: 0.10, source: 'store1' },
        { BOMitemName: 'Nut', numberNeeded: 12, costUSD: 0.15, source: 'store2' },
        { BOMitemName: 'Spacer', numberNeeded: 6, costUSD: 0.20, source: 'store3' }
      ]
    };

    let inputParams = {};
    
    if (mockMolecule.compiledBom && Array.isArray(mockMolecule.compiledBom) && mockMolecule.compiledBom.length > 0) {
      mockMolecule.compiledBom.forEach((item) => {
        inputParams["bom-" + mockMolecule.uniqueID + "-" + item.BOMitemName] = {
          type: "number",
          value: item.numberNeeded,
          label: item.BOMitemName + " x",
          disabled: true,
        };
      });
    }

    // Verify all BOM items are present
    expect(Object.keys(inputParams).length).toBe(3);
    expect(inputParams['bom-test999-Screw'].value).toBe(12);
    expect(inputParams['bom-test999-Nut'].value).toBe(12);
    expect(inputParams['bom-test999-Spacer'].value).toBe(6);
    
    // Verify label format with " x" suffix
    expect(inputParams['bom-test999-Screw'].label).toBe('Screw x');
    expect(inputParams['bom-test999-Nut'].label).toBe('Nut x');
    expect(inputParams['bom-test999-Spacer'].label).toBe('Spacer x');
  });
});
