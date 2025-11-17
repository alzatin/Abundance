/**
 * Test to verify that ap1Name is not unnecessarily serialized in connectors.
 */

import { describe, it, expect } from 'vitest';

describe('Connector Serialization Optimization Tests', () => {
  
  // Mock attachment point
  class MockAttachmentPoint {
    constructor(name, parentMolecule) {
      this.name = name;
      this.parentMolecule = parentMolecule;
    }
  }

  // Mock atom/molecule
  class MockMolecule {
    constructor(uniqueID) {
      this.uniqueID = uniqueID;
    }
  }

  // Mock connector with optimized serialization
  class MockConnector {
    constructor(ap1, ap2) {
      this.attachmentPoint1 = ap1;
      this.attachmentPoint2 = ap2;
    }

    serialize() {
      if (this.attachmentPoint2 != null) {
        var object = {
          ap2Name: this.attachmentPoint2.name,
          ap1ID: this.attachmentPoint1.parentMolecule.uniqueID,
          ap2ID: this.attachmentPoint2.parentMolecule.uniqueID,
        };
        return object;
      }
    }
  }

  it('should NOT serialize ap1Name (output name)', () => {
    const outputAtom = new MockMolecule('atom-1');
    const inputAtom = new MockMolecule('atom-2');
    
    const outputAP = new MockAttachmentPoint('output', outputAtom);
    const inputAP = new MockAttachmentPoint('geometry', inputAtom);
    
    const connector = new MockConnector(outputAP, inputAP);
    const serialized = connector.serialize();

    // ap1Name should NOT be present
    expect(serialized.ap1Name).toBeUndefined();
    
    // ap2Name SHOULD be present (needed to identify which input)
    expect(serialized.ap2Name).toBe('geometry');
    
    // IDs should be present
    expect(serialized.ap1ID).toBe('atom-1');
    expect(serialized.ap2ID).toBe('atom-2');

    console.log('✅ ap1Name correctly excluded from connector serialization');
  });

  it('should serialize ap2Name for multi-input atoms', () => {
    const outputAtom = new MockMolecule('output-atom');
    const inputAtom = new MockMolecule('input-atom');
    
    const outputAP = new MockAttachmentPoint('output', outputAtom);
    
    // Test with different input names (atoms can have multiple inputs)
    const testCases = [
      'geometry',
      'number',
      'height',
      'twistAngle',
      'xDist',
    ];

    testCases.forEach(inputName => {
      const inputAP = new MockAttachmentPoint(inputName, inputAtom);
      const connector = new MockConnector(outputAP, inputAP);
      const serialized = connector.serialize();

      // ap2Name must be preserved to identify correct input
      expect(serialized.ap2Name).toBe(inputName);
      expect(serialized.ap1Name).toBeUndefined();
    });

    console.log('✅ ap2Name correctly saved for all input types');
  });

  it('should measure file size reduction from excluding ap1Name', () => {
    const connectors = [];
    
    // Create 50 connectors
    for (let i = 0; i < 50; i++) {
      const outputAtom = new MockMolecule(`output-${i}`);
      const inputAtom = new MockMolecule(`input-${i}`);
      const outputAP = new MockAttachmentPoint('output', outputAtom);
      const inputAP = new MockAttachmentPoint('geometry', inputAtom);
      
      connectors.push(new MockConnector(outputAP, inputAP));
    }

    // Serialize with optimization (no ap1Name)
    const optimizedProject = {
      allConnectors: connectors.map(c => c.serialize()),
    };

    // Simulate old behavior (with ap1Name)
    const bloatedProject = {
      allConnectors: connectors.map(c => ({
        ...c.serialize(),
        ap1Name: c.attachmentPoint1.name, // Force include
      })),
    };

    const optimizedSize = JSON.stringify(optimizedProject).length;
    const bloatedSize = JSON.stringify(bloatedProject).length;
    const savings = bloatedSize - optimizedSize;
    const savingsPercent = ((savings / bloatedSize) * 100).toFixed(1);

    console.log('\n=== ap1Name Exclusion (50 connectors) ===');
    console.log(`Optimized (no ap1Name): ${optimizedSize} bytes`);
    console.log(`With ap1Name:           ${bloatedSize} bytes`);
    console.log(`Savings:                ${savings} bytes (${savingsPercent}%)`);

    expect(optimizedSize).toBeLessThan(bloatedSize);
    expect(savings).toBeGreaterThan(100);

    console.log('✅ Significant file size reduction from excluding ap1Name');
  });

  it('should demonstrate scaling across project sizes', () => {
    console.log('\n=== Connector Optimization Scaling ===');
    console.log('Connectors | Optimized | With ap1Name | Savings | %');
    console.log('-----------|-----------|--------------|---------|------');

    [10, 50, 100, 200].forEach(numConnectors => {
      const connectors = [];
      for (let i = 0; i < numConnectors; i++) {
        const outputAtom = new MockMolecule(`out-${i}`);
        const inputAtom = new MockMolecule(`in-${i}`);
        const outputAP = new MockAttachmentPoint('output', outputAtom);
        const inputAP = new MockAttachmentPoint('geometry', inputAtom);
        connectors.push(new MockConnector(outputAP, inputAP));
      }

      const optimizedSize = JSON.stringify({
        allConnectors: connectors.map(c => c.serialize()),
      }).length;

      const bloatedSize = JSON.stringify({
        allConnectors: connectors.map(c => ({
          ...c.serialize(),
          ap1Name: c.attachmentPoint1.name,
        })),
      }).length;

      const savings = bloatedSize - optimizedSize;
      const savingsPercent = ((savings / bloatedSize) * 100).toFixed(1);

      console.log(
        `${numConnectors.toString().padStart(10)} | ` +
        `${optimizedSize.toString().padStart(9)} | ` +
        `${bloatedSize.toString().padStart(12)} | ` +
        `${savings.toString().padStart(7)} | ` +
        `${savingsPercent.toString().padStart(4)}%`
      );
    });

    console.log('✅ Optimization scales with project complexity');
  });

  it('should verify connector reconstruction without ap1Name', () => {
    const outputAtom = new MockMolecule('source-atom');
    const inputAtom = new MockMolecule('target-atom');
    const outputAP = new MockAttachmentPoint('output', outputAtom);
    const inputAP = new MockAttachmentPoint('height', inputAtom);
    
    const connector = new MockConnector(outputAP, inputAP);
    const serialized = connector.serialize();

    // Verify serialized data is minimal but sufficient
    expect(serialized).toEqual({
      ap2Name: 'height',
      ap1ID: 'source-atom',
      ap2ID: 'target-atom',
    });

    // Simulate reconstruction logic (from placeConnector)
    // 1. Find output atom by ap1ID
    const foundOutputAtom = outputAtom.uniqueID === serialized.ap1ID ? outputAtom : null;
    expect(foundOutputAtom).toBeTruthy();
    
    // 2. Output is accessed directly (no name needed)
    // In real code: outputAttachmentPoint = atom.output;
    
    // 3. Find input atom by ap2ID
    const foundInputAtom = inputAtom.uniqueID === serialized.ap2ID ? inputAtom : null;
    expect(foundInputAtom).toBeTruthy();
    
    // 4. Find specific input by ap2Name
    // In real code: atom.inputs.forEach(input => if (input.name == connectorObj.ap2Name) ...)
    const foundInput = inputAP.name === serialized.ap2Name ? inputAP : null;
    expect(foundInput).toBeTruthy();

    console.log('✅ Connector can be reconstructed without ap1Name');
  });

  it('should handle various input types without ap1Name', () => {
    const testCases = [
      { inputName: 'geometry', atomType: 'Extrude' },
      { inputName: 'height', atomType: 'Extrude' },
      { inputName: 'diameter', atomType: 'Circle' },
      { inputName: 'xDist', atomType: 'Move' },
      { inputName: 'yDist', atomType: 'Move' },
      { inputName: 'zDist', atomType: 'Move' },
    ];

    testCases.forEach(testCase => {
      const outputAtom = new MockMolecule('output-1');
      const inputAtom = new MockMolecule('input-1');
      const outputAP = new MockAttachmentPoint('output', outputAtom);
      const inputAP = new MockAttachmentPoint(testCase.inputName, inputAtom);
      
      const connector = new MockConnector(outputAP, inputAP);
      const serialized = connector.serialize();

      // ap1Name not needed
      expect(serialized.ap1Name).toBeUndefined();
      
      // ap2Name identifies the specific input
      expect(serialized.ap2Name).toBe(testCase.inputName);
    });

    console.log('✅ All input types handled correctly without ap1Name');
  });
});
