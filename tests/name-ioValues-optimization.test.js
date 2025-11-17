/**
 * Test to verify that atom names and empty ioValues are not unnecessarily serialized.
 */

import { describe, it, expect } from 'vitest';

describe('Further Serialization Optimization Tests', () => {
  
  // Mock attachment point
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

  // Mock atom with optimized serialization
  class MockAtom {
    constructor(values = {}) {
      this.atomType = values.atomType || 'Circle';
      this.name = values.name || this.atomType; // Default name matches atomType
      this.uniqueID = values.uniqueID || 'id-1';
      this.x = values.x || 0.5;
      this.y = values.y || 0.5;
      this.inputs = values.inputs || [];
    }

    serialize(offset = { x: 0, y: 0 }) {
      var ioValues = [];
      this.inputs.forEach((ap) => {
        if (
          typeof ap.getValue() == "number" ||
          typeof ap.getValue() == "string"
        ) {
          const currentValue = ap.getValue();
          const hasCustomEquation = ap.currentEquation && ap.currentEquation.trim() !== '';
          const isDifferentFromDefault = ap.defaultValue !== currentValue;
          
          if (isDifferentFromDefault || hasCustomEquation) {
            var saveIO = {
              name: ap.name,
              ioValue: currentValue,
            };
            if (hasCustomEquation) {
              saveIO.currentEquation = ap.currentEquation;
            }
            ioValues.push(saveIO);
          }
        }
      });
      
      var object = {
        atomType: this.atomType,
        x: this.x + offset.x,
        y: this.y - offset.y,
        uniqueID: this.uniqueID,
      };
      
      // Only save name if it differs from atomType or for special types
      const needsName = this.atomType === "Molecule" || 
                        this.atomType === "GitHubMolecule" || 
                        this.name !== this.atomType;
      if (needsName) {
        object.name = this.name;
      }
      
      // Only save ioValues if not empty
      if (ioValues.length > 0) {
        object.ioValues = ioValues;
      }
      
      return object;
    }
  }

  it('should NOT serialize name when it matches atomType', () => {
    const atom = new MockAtom({
      atomType: 'Circle',
      name: 'Circle', // Matches atomType
      uniqueID: 'circle-1',
    });

    const serialized = atom.serialize();

    // Name should NOT be in serialized object
    expect(serialized.name).toBeUndefined();
    expect(serialized.atomType).toBe('Circle');

    console.log('✅ Name excluded when it matches atomType');
  });

  it('should serialize name when it differs from atomType', () => {
    const atom = new MockAtom({
      atomType: 'Input',
      name: 'myCustomInput', // Different from atomType
      uniqueID: 'input-1',
    });

    const serialized = atom.serialize();

    // Name SHOULD be in serialized object
    expect(serialized.name).toBe('myCustomInput');
    expect(serialized.atomType).toBe('Input');

    console.log('✅ Name included when it differs from atomType');
  });

  it('should ALWAYS serialize name for Molecule atoms', () => {
    const atom = new MockAtom({
      atomType: 'Molecule',
      name: 'MyProject', // Custom project name
      uniqueID: 'mol-1',
    });

    const serialized = atom.serialize();

    // Name should ALWAYS be included for Molecules
    expect(serialized.name).toBe('MyProject');
    expect(serialized.atomType).toBe('Molecule');

    console.log('✅ Name always included for Molecule');
  });

  it('should ALWAYS serialize name for GitHubMolecule atoms', () => {
    const atom = new MockAtom({
      atomType: 'GitHubMolecule',
      name: 'ImportedProject', // From GitHub
      uniqueID: 'gh-1',
    });

    const serialized = atom.serialize();

    // Name should ALWAYS be included for GitHubMolecules
    expect(serialized.name).toBe('ImportedProject');
    expect(serialized.atomType).toBe('GitHubMolecule');

    console.log('✅ Name always included for GitHubMolecule');
  });

  it('should NOT serialize empty ioValues array', () => {
    const atom = new MockAtom({
      atomType: 'Circle',
      name: 'Circle',
      uniqueID: 'circle-1',
    });

    // Add inputs where all values match defaults
    atom.inputs = [
      new MockAttachmentPoint('diameter', 'number', 10.0, 10.0),
      new MockAttachmentPoint('sides', 'number', 32, 32),
    ];

    const serialized = atom.serialize();

    // ioValues should NOT be in serialized object when empty
    expect(serialized.ioValues).toBeUndefined();
    expect(serialized.atomType).toBe('Circle');

    console.log('✅ Empty ioValues array excluded from serialization');
  });

  it('should serialize ioValues when not empty', () => {
    const atom = new MockAtom({
      atomType: 'Circle',
      name: 'Circle',
      uniqueID: 'circle-1',
    });

    // Add input with changed value
    atom.inputs = [
      new MockAttachmentPoint('diameter', 'number', 25.0, 10.0), // Changed
    ];

    const serialized = atom.serialize();

    // ioValues SHOULD be included when not empty
    expect(serialized.ioValues).toBeDefined();
    expect(serialized.ioValues).toHaveLength(1);
    expect(serialized.ioValues[0].ioValue).toBe(25.0);

    console.log('✅ Non-empty ioValues included in serialization');
  });

  it('should measure file size reduction from excluding names', () => {
    const atoms = [];
    
    // Create 50 atoms with default names (name === atomType)
    for (let i = 0; i < 50; i++) {
      const atom = new MockAtom({
        atomType: 'Circle',
        name: 'Circle', // Matches atomType
        uniqueID: `id-${i}`,
        x: Math.random(),
        y: Math.random(),
      });
      
      // All use default values
      atom.inputs = [
        new MockAttachmentPoint('diameter', 'number', 10.0, 10.0),
      ];
      
      atoms.push(atom);
    }

    // Serialize with optimization (excludes name and empty ioValues)
    const optimizedProject = {
      fileTypeVersion: 1,
      atomType: 'Molecule',
      allAtoms: atoms.map(atom => atom.serialize()),
    };

    // Simulate old behavior (includes name and empty ioValues)
    const bloatedProject = {
      fileTypeVersion: 1,
      atomType: 'Molecule',
      allAtoms: atoms.map(atom => ({
        ...atom.serialize(),
        name: atom.name, // Force include name
        ioValues: [], // Force include empty array
      })),
    };

    const optimizedSize = JSON.stringify(optimizedProject).length;
    const bloatedSize = JSON.stringify(bloatedProject).length;
    const savings = bloatedSize - optimizedSize;
    const savingsPercent = ((savings / bloatedSize) * 100).toFixed(1);

    console.log('\n=== Name & Empty ioValues Optimization (50 atoms) ===');
    console.log(`Optimized (no names/empty arrays): ${optimizedSize} bytes`);
    console.log(`With names & empty arrays:         ${bloatedSize} bytes`);
    console.log(`Savings:                           ${savings} bytes (${savingsPercent}%)`);

    expect(optimizedSize).toBeLessThan(bloatedSize);
    expect(savings).toBeGreaterThan(300); // Should save significant space

    console.log('✅ Significant file size reduction from excluding names and empty arrays');
  });

  it('should handle mixed scenario correctly', () => {
    const atoms = [
      // Regular atom with default name
      new MockAtom({
        atomType: 'Circle',
        name: 'Circle',
        uniqueID: 'c1',
      }),
      // Regular atom with custom name
      new MockAtom({
        atomType: 'Input',
        name: 'myInput',
        uniqueID: 'i1',
      }),
      // Molecule with custom name
      new MockAtom({
        atomType: 'Molecule',
        name: 'SubProject',
        uniqueID: 'm1',
      }),
      // Atom with changed IO values
      new MockAtom({
        atomType: 'Extrude',
        name: 'Extrude',
        uniqueID: 'e1',
        inputs: [
          new MockAttachmentPoint('height', 'number', 50.0, 10.0),
        ],
      }),
    ];

    const serialized = atoms.map(a => a.serialize());

    // Circle: no name, no ioValues
    expect(serialized[0].name).toBeUndefined();
    expect(serialized[0].ioValues).toBeUndefined();

    // Input: has custom name, no ioValues
    expect(serialized[1].name).toBe('myInput');
    expect(serialized[1].ioValues).toBeUndefined();

    // Molecule: has name, no ioValues
    expect(serialized[2].name).toBe('SubProject');
    expect(serialized[2].ioValues).toBeUndefined();

    // Extrude: no name, has ioValues
    expect(serialized[3].name).toBeUndefined();
    expect(serialized[3].ioValues).toBeDefined();
    expect(serialized[3].ioValues).toHaveLength(1);

    console.log('✅ Mixed scenario handled correctly');
  });

  it('should demonstrate cumulative file size reduction', () => {
    const results = [];
    
    console.log('\n=== Cumulative Optimization Impact ===');
    console.log('Atoms | Optimized | With Names+Arrays | Savings | %');
    console.log('------|-----------|-------------------|---------|------');

    [10, 50, 100, 200].forEach(numAtoms => {
      const atoms = [];
      for (let i = 0; i < numAtoms; i++) {
        const atom = new MockAtom({
          atomType: 'Circle',
          name: 'Circle',
          uniqueID: `id-${i}`,
        });
        
        // Most use defaults
        if (i % 10 === 0) {
          atom.inputs = [
            new MockAttachmentPoint('diameter', 'number', 25.0, 10.0),
          ];
        } else {
          atom.inputs = [
            new MockAttachmentPoint('diameter', 'number', 10.0, 10.0),
          ];
        }
        
        atoms.push(atom);
      }

      const optimizedSize = JSON.stringify({
        allAtoms: atoms.map(a => a.serialize()),
      }).length;

      const bloatedSize = JSON.stringify({
        allAtoms: atoms.map(a => ({
          ...a.serialize(),
          name: a.name,
          ioValues: a.serialize().ioValues || [],
        })),
      }).length;

      const savings = bloatedSize - optimizedSize;
      const savingsPercent = ((savings / bloatedSize) * 100).toFixed(1);

      console.log(
        `${numAtoms.toString().padStart(5)} | ` +
        `${optimizedSize.toString().padStart(9)} | ` +
        `${bloatedSize.toString().padStart(17)} | ` +
        `${savings.toString().padStart(7)} | ` +
        `${savingsPercent.toString().padStart(4)}%`
      );

      results.push({ numAtoms, optimizedSize, bloatedSize, savings });
    });

    // Verify savings increase with project size
    for (let i = 1; i < results.length; i++) {
      expect(results[i].savings).toBeGreaterThan(results[i - 1].savings);
    }

    console.log('✅ Optimization scales with project size');
  });

  it('should handle atom reconstruction without saved name', () => {
    const original = new MockAtom({
      atomType: 'Circle',
      name: 'Circle',
      uniqueID: 'c1',
    });

    // Serialize (name will be excluded)
    const serialized = original.serialize();
    expect(serialized.name).toBeUndefined();

    // Simulate loading - constructor sets default name
    const loaded = new MockAtom({
      atomType: serialized.atomType,
      uniqueID: serialized.uniqueID,
      x: serialized.x,
      y: serialized.y,
      // name not provided - will default to atomType
    });

    // Loaded atom should have name set to atomType
    expect(loaded.name).toBe('Circle');
    expect(loaded.atomType).toBe('Circle');

    console.log('✅ Atom reconstructs correctly without saved name');
  });
});
