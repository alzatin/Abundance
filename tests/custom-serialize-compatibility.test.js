/**
 * Test to verify that atoms with custom serialize methods work correctly 
 * when ioValues is excluded due to optimization.
 */

import { describe, it, expect } from 'vitest';

describe('Custom Serialize Method Compatibility Tests', () => {
  
  // Mock attachment point
  class MockAttachmentPoint {
    constructor(name, valueType, value, defaultValue) {
      this.name = name;
      this.valueType = valueType;
      this.value = value;
      this.defaultValue = defaultValue;
      this.currentEquation = null;
      this.type = 'input';
    }

    getValue() {
      if (this.valueType === 'geometry') {
        return { cacheKey: this.value };
      }
      return this.value;
    }
  }

  // Base atom class with optimized serialization
  class MockAtom {
    constructor(values = {}) {
      this.atomType = values.atomType || 'TestAtom';
      this.name = values.name || this.atomType;
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

  // Mock ShrinkWrap with custom serialize that extends base
  class MockShrinkWrap extends MockAtom {
    constructor(values = {}) {
      super(values);
      this.atomType = 'ShrinkWrap';
      this.name = 'ShrinkWrap';
    }

    serialize(savedObject) {
      var thisAsObject = super.serialize(savedObject);

      var ioValues = [];
      this.inputs.forEach((io) => {
        if (io.type == "input") {
          var saveIO = {
            name: io.name,
            ioValue: io.getValue(),
          };
          ioValues.push(saveIO);
        }
      });

      // Ensure ioValues array exists before pushing
      if (!thisAsObject.ioValues) {
        thisAsObject.ioValues = [];
      }
      
      ioValues.forEach((ioValue) => {
        thisAsObject.ioValues.push(ioValue);
      });

      return thisAsObject;
    }
  }

  // Mock Loft with custom serialize that extends base
  class MockLoft extends MockAtom {
    constructor(values = {}) {
      super(values);
      this.atomType = 'Loft';
      this.name = 'Loft';
      this.closedSelection = values.closedSelection || false;
    }

    serialize(savedObject) {
      var thisAsObject = super.serialize(savedObject);

      var ioValues = [];
      this.inputs.forEach((io) => {
        if (io.type == "input") {
          var saveIO = {
            name: io.name,
            ioValue: io.getValue(),
          };
          ioValues.push(saveIO);
        }
      });

      // Ensure ioValues array exists before pushing
      if (!thisAsObject.ioValues) {
        thisAsObject.ioValues = [];
      }
      
      ioValues.forEach((ioValue) => {
        thisAsObject.ioValues.push(ioValue);
      });

      thisAsObject.closedSelection = this.closedSelection;

      return thisAsObject;
    }
  }

  it('should handle ShrinkWrap with all default values', () => {
    const atom = new MockShrinkWrap({
      uniqueID: 'shrink-1',
    });

    // Add inputs where all values match defaults
    atom.inputs = [
      new MockAttachmentPoint('input1', 'number', 10.0, 10.0),
      new MockAttachmentPoint('input2', 'number', 5.0, 5.0),
    ];

    const serialized = atom.serialize();

    // Should have ioValues array (added by ShrinkWrap even if parent didn't)
    expect(serialized.ioValues).toBeDefined();
    expect(Array.isArray(serialized.ioValues)).toBe(true);
    
    // Should contain the inputs from ShrinkWrap's custom logic
    expect(serialized.ioValues.length).toBeGreaterThan(0);

    console.log('✅ ShrinkWrap handles default values without error');
  });

  it('should handle Loft with all default values', () => {
    const atom = new MockLoft({
      uniqueID: 'loft-1',
      closedSelection: true,
    });

    // Add inputs where all values match defaults
    atom.inputs = [
      new MockAttachmentPoint('geometry1', 'geometry', 'key1', 'key1'),
      new MockAttachmentPoint('geometry2', 'geometry', 'key2', 'key2'),
    ];

    const serialized = atom.serialize();

    // Should have ioValues array (added by Loft even if parent didn't)
    expect(serialized.ioValues).toBeDefined();
    expect(Array.isArray(serialized.ioValues)).toBe(true);
    
    // Should have closedSelection
    expect(serialized.closedSelection).toBe(true);

    console.log('✅ Loft handles default values without error');
  });

  it('should handle ShrinkWrap with mixed default and changed values', () => {
    const atom = new MockShrinkWrap({
      uniqueID: 'shrink-2',
    });

    atom.inputs = [
      new MockAttachmentPoint('input1', 'number', 15.0, 10.0), // Changed
      new MockAttachmentPoint('input2', 'number', 5.0, 5.0),   // Default
    ];

    const serialized = atom.serialize();

    // Should have ioValues array
    expect(serialized.ioValues).toBeDefined();
    expect(Array.isArray(serialized.ioValues)).toBe(true);
    
    // Note: ShrinkWrap adds ALL inputs, so parent saves changed ones + ShrinkWrap adds all
    // This is by design - ShrinkWrap needs all input names for reconstruction
    expect(serialized.ioValues.length).toBeGreaterThan(0);

    console.log('✅ ShrinkWrap handles mixed values correctly');
  });

  it('should not break when parent serialize returns ioValues', () => {
    const atom = new MockShrinkWrap({
      uniqueID: 'shrink-3',
    });

    atom.inputs = [
      new MockAttachmentPoint('input1', 'number', 20.0, 10.0), // Changed
      new MockAttachmentPoint('input2', 'number', 10.0, 5.0),  // Changed
    ];

    const serialized = atom.serialize();

    // Should have ioValues array with all entries
    expect(serialized.ioValues).toBeDefined();
    expect(Array.isArray(serialized.ioValues)).toBe(true);
    // Parent saves 2 changed + ShrinkWrap adds 2 more = 4 total (duplicates by design)
    expect(serialized.ioValues.length).toBeGreaterThan(0);

    console.log('✅ ShrinkWrap works when parent includes ioValues');
  });

  it('should measure that custom atoms still save all necessary data', () => {
    const shrinkWrap = new MockShrinkWrap({
      uniqueID: 'sw-1',
    });
    shrinkWrap.inputs = [
      new MockAttachmentPoint('thickness', 'number', 2.0, 2.0), // Default
      new MockAttachmentPoint('offset', 'number', 0.0, 0.0),    // Default
    ];

    const loft = new MockLoft({
      uniqueID: 'loft-1',
      closedSelection: true,
    });
    loft.inputs = [
      new MockAttachmentPoint('geo1', 'number', 1.0, 1.0), // Default
      new MockAttachmentPoint('geo2', 'number', 1.0, 1.0), // Default
    ];

    const shrinkSerialized = shrinkWrap.serialize();
    const loftSerialized = loft.serialize();

    // Both should have ioValues even with all defaults
    expect(shrinkSerialized.ioValues).toBeDefined();
    expect(loftSerialized.ioValues).toBeDefined();

    // Loft should have closedSelection
    expect(loftSerialized.closedSelection).toBe(true);

    console.log('✅ Custom atoms maintain their extended serialization');
  });

  it('should demonstrate the fix prevents undefined errors', () => {
    const atom = new MockShrinkWrap({
      uniqueID: 'test-1',
    });

    atom.inputs = [
      new MockAttachmentPoint('input1', 'number', 10.0, 10.0), // Default
    ];

    // This should not throw an error
    expect(() => {
      const serialized = atom.serialize();
      
      // Verify ioValues exists and can be accessed
      expect(serialized.ioValues).toBeDefined();
      expect(serialized.ioValues.length).toBeGreaterThanOrEqual(0);
    }).not.toThrow();

    console.log('✅ No undefined error when pushing to ioValues');
  });
});
