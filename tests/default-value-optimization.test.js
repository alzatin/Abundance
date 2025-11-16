/**
 * Test to verify that default values are not serialized unnecessarily.
 * Only values that differ from defaults should be saved.
 */

import { describe, it, expect } from 'vitest';

describe('Default Value Optimization Tests', () => {
  
  // Mock attachment point with default value tracking
  class MockAttachmentPoint {
    constructor(name, valueType, value, defaultValue) {
      this.name = name;
      this.valueType = valueType;
      this.value = value;
      this.defaultValue = defaultValue;
      this.currentEquation = null;
    }

    getValue() {
      if (this.valueType === 'geometry') {
        return { cacheKey: this.value };
      }
      return this.value;
    }
  }

  // Mock atom with default-aware serialization
  class MockAtom {
    constructor(values = {}) {
      this.atomType = values.atomType || 'TestAtom';
      this.name = values.name || 'TestAtom';
      this.uniqueID = values.uniqueID || 'id-1';
      this.x = values.x || 0.5;
      this.y = values.y || 0.5;
      this.inputs = values.inputs || [];
    }

    // Updated serialize method that excludes default values
    serialize(offset = { x: 0, y: 0 }) {
      var ioValues = [];
      this.inputs.forEach((ap) => {
        if (
          typeof ap.getValue() == "number" ||
          typeof ap.getValue() == "string"
        ) {
          // Only save values that differ from defaults or have custom equations
          const currentValue = ap.getValue();
          const hasCustomEquation = ap.currentEquation && ap.currentEquation.trim() !== '';
          const isDifferentFromDefault = ap.defaultValue !== currentValue;
          
          // Save if value changed from default OR if there's a custom equation
          if (isDifferentFromDefault || hasCustomEquation) {
            var saveIO = {
              name: ap.name,
              ioValue: currentValue,
            };
            // Only include currentEquation if it exists
            if (hasCustomEquation) {
              saveIO.currentEquation = ap.currentEquation;
            }
            ioValues.push(saveIO);
          }
        }
      });
      
      var object = {
        atomType: this.atomType,
        name: this.name,
        x: this.x + offset.x,
        y: this.y - offset.y,
        uniqueID: this.uniqueID,
        ioValues: ioValues,
      };
      return object;
    }
  }

  it('should NOT save input values that match defaults', () => {
    const atom = new MockAtom({
      atomType: 'Circle',
      name: 'MyCircle',
      uniqueID: 'circle-1',
    });

    // Add inputs where values match defaults
    atom.inputs = [
      new MockAttachmentPoint('diameter', 'number', 10.0, 10.0), // Same as default
      new MockAttachmentPoint('sides', 'number', 32, 32), // Same as default
    ];

    const serialized = atom.serialize();

    // Should NOT save any ioValues since all match defaults
    expect(serialized.ioValues).toHaveLength(0);
    
    console.log('✅ Default values correctly excluded from serialization');
  });

  it('should save input values that differ from defaults', () => {
    const atom = new MockAtom({
      atomType: 'Circle',
      name: 'MyCircle',
      uniqueID: 'circle-1',
    });

    // Add inputs where values differ from defaults
    atom.inputs = [
      new MockAttachmentPoint('diameter', 'number', 25.0, 10.0), // Changed from default
      new MockAttachmentPoint('sides', 'number', 32, 32), // Same as default
    ];

    const serialized = atom.serialize();

    // Should only save the changed value
    expect(serialized.ioValues).toHaveLength(1);
    expect(serialized.ioValues[0].name).toBe('diameter');
    expect(serialized.ioValues[0].ioValue).toBe(25.0);
    
    console.log('✅ Changed values correctly saved');
  });

  it('should save values with custom equations even if value matches default', () => {
    const atom = new MockAtom({
      atomType: 'Move',
      name: 'MyMove',
      uniqueID: 'move-1',
    });

    const input = new MockAttachmentPoint('distance', 'number', 10, 10); // Value matches default
    input.currentEquation = 'radius * 2'; // But has custom equation
    atom.inputs = [input];

    const serialized = atom.serialize();

    // Should save because there's a custom equation
    expect(serialized.ioValues).toHaveLength(1);
    expect(serialized.ioValues[0].name).toBe('distance');
    expect(serialized.ioValues[0].ioValue).toBe(10);
    expect(serialized.ioValues[0].currentEquation).toBe('radius * 2');
    
    console.log('✅ Custom equations correctly saved even when value matches default');
  });

  it('should NOT save empty or whitespace-only equations', () => {
    const atom = new MockAtom({
      atomType: 'Extrude',
      name: 'MyExtrude',
    });

    const input1 = new MockAttachmentPoint('height', 'number', 10.0, 10.0);
    input1.currentEquation = '   '; // Whitespace only
    
    const input2 = new MockAttachmentPoint('twist', 'number', 0, 0);
    input2.currentEquation = ''; // Empty
    
    atom.inputs = [input1, input2];

    const serialized = atom.serialize();

    // Should not save anything since values match defaults and equations are empty
    expect(serialized.ioValues).toHaveLength(0);
    
    console.log('✅ Empty equations correctly ignored');
  });

  it('should measure file size reduction from excluding defaults', () => {
    // Create project with 50 atoms, all using default values
    const atomsWithDefaults = [];
    for (let i = 0; i < 50; i++) {
      const atom = new MockAtom({
        atomType: 'Circle',
        name: `Circle${i}`,
        uniqueID: `id-${i}`,
        x: Math.random(),
        y: Math.random(),
      });
      
      // All values are at defaults
      atom.inputs = [
        new MockAttachmentPoint('diameter', 'number', 10.0, 10.0),
        new MockAttachmentPoint('sides', 'number', 32, 32),
      ];
      
      atomsWithDefaults.push(atom);
    }

    // Serialize with optimization (excludes defaults)
    const optimizedProject = {
      fileTypeVersion: 1,
      atomType: 'Molecule',
      allAtoms: atomsWithDefaults.map(atom => atom.serialize()),
    };

    // Create comparison: if we saved all values (old behavior)
    const atomsWithAllValues = atomsWithDefaults.map(atom => {
      const serialized = atom.serialize();
      // Simulate old behavior by adding back the defaults
      return {
        ...serialized,
        ioValues: atom.inputs.map(ap => ({
          name: ap.name,
          ioValue: ap.getValue(),
        })),
      };
    });

    const bloatedProject = {
      fileTypeVersion: 1,
      atomType: 'Molecule',
      allAtoms: atomsWithAllValues,
    };

    const optimizedSize = JSON.stringify(optimizedProject).length;
    const bloatedSize = JSON.stringify(bloatedProject).length;
    const savings = bloatedSize - optimizedSize;
    const savingsPercent = ((savings / bloatedSize) * 100).toFixed(1);

    console.log('\n=== Default Value Optimization (50 atoms) ===');
    console.log(`With defaults excluded: ${optimizedSize} bytes`);
    console.log(`With all values saved:  ${bloatedSize} bytes`);
    console.log(`Savings:                ${savings} bytes (${savingsPercent}%)`);

    expect(optimizedSize).toBeLessThan(bloatedSize);
    expect(savings).toBeGreaterThan(1000); // Should save significant space

    console.log('✅ Significant file size reduction achieved');
  });

  it('should handle mixed scenario: some defaults, some changed', () => {
    const atom = new MockAtom({
      atomType: 'Rectangle',
      name: 'MyRect',
    });

    atom.inputs = [
      new MockAttachmentPoint('width', 'number', 10.0, 10.0), // Default
      new MockAttachmentPoint('height', 'number', 20.0, 10.0), // Changed
      new MockAttachmentPoint('radius', 'number', 0, 0), // Default
    ];

    const serialized = atom.serialize();

    // Should only save the changed value
    expect(serialized.ioValues).toHaveLength(1);
    expect(serialized.ioValues[0].name).toBe('height');
    expect(serialized.ioValues[0].ioValue).toBe(20.0);

    console.log('✅ Mixed scenario handled correctly');
  });

  it('should handle edge case: default is 0 and value is 0', () => {
    const atom = new MockAtom({
      atomType: 'Rotate',
      name: 'MyRotate',
    });

    atom.inputs = [
      new MockAttachmentPoint('angle', 'number', 0, 0), // Both zero
    ];

    const serialized = atom.serialize();

    // Should not save since value matches default
    expect(serialized.ioValues).toHaveLength(0);

    console.log('✅ Zero default correctly handled');
  });

  it('should handle string values correctly', () => {
    const atom = new MockAtom({
      atomType: 'Text',
      name: 'MyText',
    });

    atom.inputs = [
      new MockAttachmentPoint('text', 'string', 'Hello', 'Default'), // Changed
      new MockAttachmentPoint('font', 'string', 'Arial', 'Arial'), // Default
    ];

    const serialized = atom.serialize();

    // Should only save the changed string
    expect(serialized.ioValues).toHaveLength(1);
    expect(serialized.ioValues[0].name).toBe('text');
    expect(serialized.ioValues[0].ioValue).toBe('Hello');

    console.log('✅ String values handled correctly');
  });

  it('should demonstrate file size scaling with project complexity', () => {
    const results = [];
    
    console.log('\n=== Scaling Analysis: Default Value Optimization ===');
    console.log('Atoms | Optimized | With Defaults | Savings | Savings %');
    console.log('------|-----------|---------------|---------|----------');

    [10, 50, 100, 200].forEach(numAtoms => {
      const atoms = [];
      for (let i = 0; i < numAtoms; i++) {
        const atom = new MockAtom({
          atomType: 'Circle',
          name: `Atom${i}`,
          uniqueID: `id-${i}`,
        });
        
        // 80% of atoms use defaults, 20% have changed values
        if (i % 5 === 0) {
          // Changed value
          atom.inputs = [
            new MockAttachmentPoint('diameter', 'number', 25.0, 10.0),
          ];
        } else {
          // Default values
          atom.inputs = [
            new MockAttachmentPoint('diameter', 'number', 10.0, 10.0),
          ];
        }
        
        atoms.push(atom);
      }

      const optimizedSize = JSON.stringify({
        allAtoms: atoms.map(a => a.serialize()),
      }).length;

      // Simulate old behavior
      const bloatedSize = JSON.stringify({
        allAtoms: atoms.map(atom => ({
          ...atom.serialize(),
          ioValues: atom.inputs.map(ap => ({
            name: ap.name,
            ioValue: ap.getValue(),
          })),
        })),
      }).length;

      const savings = bloatedSize - optimizedSize;
      const savingsPercent = ((savings / bloatedSize) * 100).toFixed(1);

      console.log(
        `${numAtoms.toString().padStart(5)} | ` +
        `${optimizedSize.toString().padStart(9)} | ` +
        `${bloatedSize.toString().padStart(13)} | ` +
        `${savings.toString().padStart(7)} | ` +
        `${savingsPercent.toString().padStart(7)}%`
      );

      results.push({ numAtoms, optimizedSize, bloatedSize, savings });
    });

    // Verify savings increase with project size
    for (let i = 1; i < results.length; i++) {
      expect(results[i].savings).toBeGreaterThan(results[i - 1].savings);
    }

    console.log('✅ Optimization scales well with project size');
  });
});
