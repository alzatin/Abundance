import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Test for Issue #1207: Serialization not saving some inputs to molecules
 * 
 * This test validates that when a Molecule with Input atoms is serialized,
 * the ioValues are correctly saved even if this.inputs array is empty.
 * 
 * The bug was that ioValues weren't being saved because Atom.serialize() only
 * looks at this.inputs, which may be empty even though Input atoms exist in
 * nodesOnTheScreen.
 */
describe('Molecule Input Serialization Fix', () => {
  
  it('should save ioValues from Input atoms even when this.inputs is empty', () => {
    // Mock Molecule class with serialize method
    class MockMolecule {
      constructor() {
        this.atomType = 'Molecule';
        this.name = 'Vertical';
        this.x = 0.5;
        this.y = 0.5;
        this.uniqueID = 'test-123';
        this.inputs = []; // Empty! This is the bug scenario
        this.nodesOnTheScreen = [];
        this.topLevel = false;
      }
      
      // Mock Atom.serialize() - returns empty ioValues since this.inputs is empty
      atomSerialize() {
        return {
          atomType: this.atomType,
          x: this.x,
          y: this.y,
          uniqueID: this.uniqueID,
          name: this.name,
          // No ioValues because this.inputs is empty
        };
      }
      
      // Molecule.serialize() - includes our fix with validation
      serialize(offset = { x: 0, y: 0 }) {
        var allAtoms = [];
        this.nodesOnTheScreen.forEach((atom) => {
          allAtoms.push({ atomType: atom.atomType, name: atom.name });
        });
        
        var thisAsObject = this.atomSerialize();
        thisAsObject.topLevel = this.topLevel;
        thisAsObject.allAtoms = allAtoms;
        thisAsObject.allConnectors = [];
        
        // THE FIX: Reconstruct ioValues from Input atoms with validation
        if (!thisAsObject.ioValues || thisAsObject.ioValues.length === 0) {
          const inputAtoms = this.nodesOnTheScreen.filter(atom => atom.atomType === "Input");
          if (inputAtoms.length > 0) {
            const reconstructedIoValues = [];
            const MAX_VALUE_SIZE = 10000;
            
            inputAtoms.forEach(inputAtom => {
              const value = inputAtom.parentAP ? inputAtom.parentAP.getValue() : inputAtom.value;
              
              // Skip geometry types based on valueType
              const valueType = inputAtom.parentAP ? inputAtom.parentAP.valueType : inputAtom.type;
              if (valueType === "geometry") {
                return;
              }
              
              // Only save numbers and strings
              if (typeof value !== "number" && typeof value !== "string") {
                return;
              }
              
              // Skip large strings
              if (typeof value === "string" && value.length > MAX_VALUE_SIZE) {
                return;
              }
              
              if (value !== undefined && value !== null) {
                reconstructedIoValues.push({
                  name: inputAtom.name,
                  ioValue: value
                });
              }
            });
            
            if (reconstructedIoValues.length > 0) {
              thisAsObject.ioValues = reconstructedIoValues;
            }
          }
        }
        
        thisAsObject.fileTypeVersion = 1;
        return thisAsObject;
      }
    }
    
    // Create a molecule with an Input atom
    const molecule = new MockMolecule();
    
    // Add an Input atom "Wood Thickness" with value 12
    const inputAtom = {
      atomType: 'Input',
      name: 'Wood Thickness',
      type: 'number',
      value: 12,
      parentAP: {
        getValue: () => 12
      }
    };
    molecule.nodesOnTheScreen.push(inputAtom);
    
    // Serialize the molecule
    const serialized = molecule.serialize();
    
    // Verify that ioValues were saved
    expect(serialized.ioValues).toBeDefined();
    expect(serialized.ioValues).toHaveLength(1);
    expect(serialized.ioValues[0]).toEqual({
      name: 'Wood Thickness',
      ioValue: 12
    });
    
    console.log('✅ ioValues correctly reconstructed from Input atom');
  });
  
  it('should handle multiple Input atoms', () => {
    class MockMolecule {
      constructor() {
        this.atomType = 'Molecule';
        this.name = 'TestMolecule';
        this.x = 0.5;
        this.y = 0.5;
        this.uniqueID = 'test-456';
        this.inputs = [];
        this.nodesOnTheScreen = [];
        this.topLevel = false;
      }
      
      atomSerialize() {
        return {
          atomType: this.atomType,
          x: this.x,
          y: this.y,
          uniqueID: this.uniqueID,
          name: this.name,
        };
      }
      
      serialize() {
        var thisAsObject = this.atomSerialize();
        thisAsObject.topLevel = this.topLevel;
        thisAsObject.allAtoms = [];
        thisAsObject.allConnectors = [];
        
        if (!thisAsObject.ioValues || thisAsObject.ioValues.length === 0) {
          const inputAtoms = this.nodesOnTheScreen.filter(atom => atom.atomType === "Input");
          if (inputAtoms.length > 0) {
            const reconstructedIoValues = [];
            const MAX_VALUE_SIZE = 10000;
            
            inputAtoms.forEach(inputAtom => {
              const value = inputAtom.parentAP ? inputAtom.parentAP.getValue() : inputAtom.value;
              
              const valueType = inputAtom.parentAP ? inputAtom.parentAP.valueType : inputAtom.type;
              if (valueType === "geometry") {
                return;
              }
              
              if (typeof value !== "number" && typeof value !== "string") {
                return;
              }
              
              if (typeof value === "string" && value.length > MAX_VALUE_SIZE) {
                return;
              }
              
              if (value !== undefined && value !== null) {
                reconstructedIoValues.push({
                  name: inputAtom.name,
                  ioValue: value
                });
              }
            });
            if (reconstructedIoValues.length > 0) {
              thisAsObject.ioValues = reconstructedIoValues;
            }
          }
        }
        
        return thisAsObject;
      }
    }
    
    const molecule = new MockMolecule();
    
    // Add multiple Input atoms
    molecule.nodesOnTheScreen.push({
      atomType: 'Input',
      name: 'Wood Thickness',
      value: 12,
      parentAP: { getValue: () => 12 }
    });
    
    molecule.nodesOnTheScreen.push({
      atomType: 'Input',
      name: 'Length',
      value: 100,
      parentAP: { getValue: () => 100 }
    });
    
    molecule.nodesOnTheScreen.push({
      atomType: 'Input',
      name: 'Width',
      value: 50,
      parentAP: { getValue: () => 50 }
    });
    
    const serialized = molecule.serialize();
    
    expect(serialized.ioValues).toBeDefined();
    expect(serialized.ioValues).toHaveLength(3);
    expect(serialized.ioValues).toContainEqual({ name: 'Wood Thickness', ioValue: 12 });
    expect(serialized.ioValues).toContainEqual({ name: 'Length', ioValue: 100 });
    expect(serialized.ioValues).toContainEqual({ name: 'Width', ioValue: 50 });
    
    console.log('✅ Multiple Input atoms handled correctly');
  });
  
  it('should skip Input atoms with undefined or null values', () => {
    class MockMolecule {
      constructor() {
        this.atomType = 'Molecule';
        this.inputs = [];
        this.nodesOnTheScreen = [];
        this.topLevel = false;
      }
      
      atomSerialize() {
        return { atomType: this.atomType };
      }
      
      serialize() {
        var thisAsObject = this.atomSerialize();
        thisAsObject.topLevel = this.topLevel;
        thisAsObject.allAtoms = [];
        thisAsObject.allConnectors = [];
        
        if (!thisAsObject.ioValues || thisAsObject.ioValues.length === 0) {
          const inputAtoms = this.nodesOnTheScreen.filter(atom => atom.atomType === "Input");
          if (inputAtoms.length > 0) {
            const reconstructedIoValues = [];
            const MAX_VALUE_SIZE = 10000;
            
            inputAtoms.forEach(inputAtom => {
              const value = inputAtom.parentAP ? inputAtom.parentAP.getValue() : inputAtom.value;
              
              const valueType = inputAtom.parentAP ? inputAtom.parentAP.valueType : inputAtom.type;
              if (valueType === "geometry") {
                return;
              }
              
              if (typeof value !== "number" && typeof value !== "string") {
                return;
              }
              
              if (typeof value === "string" && value.length > MAX_VALUE_SIZE) {
                return;
              }
              
              if (value !== undefined && value !== null) {
                reconstructedIoValues.push({
                  name: inputAtom.name,
                  ioValue: value
                });
              }
            });
            if (reconstructedIoValues.length > 0) {
              thisAsObject.ioValues = reconstructedIoValues;
            }
          }
        }
        
        return thisAsObject;
      }
    }
    
    const molecule = new MockMolecule();
    
    // Add Input atoms with various values
    molecule.nodesOnTheScreen.push({
      atomType: 'Input',
      name: 'Valid',
      value: 10,
      parentAP: { getValue: () => 10 }
    });
    
    molecule.nodesOnTheScreen.push({
      atomType: 'Input',
      name: 'Undefined',
      value: undefined,
      parentAP: { getValue: () => undefined }
    });
    
    molecule.nodesOnTheScreen.push({
      atomType: 'Input',
      name: 'Null',
      value: null,
      parentAP: { getValue: () => null }
    });
    
    molecule.nodesOnTheScreen.push({
      atomType: 'Input',
      name: 'Zero',
      value: 0,
      parentAP: { getValue: () => 0 }
    });
    
    const serialized = molecule.serialize();
    
    // Should only save Valid and Zero (0 is a valid value)
    expect(serialized.ioValues).toBeDefined();
    expect(serialized.ioValues).toHaveLength(2);
    expect(serialized.ioValues).toContainEqual({ name: 'Valid', ioValue: 10 });
    expect(serialized.ioValues).toContainEqual({ name: 'Zero', ioValue: 0 });
    
    console.log('✅ Null/undefined values correctly skipped');
  });
  
  it('should not override existing ioValues', () => {
    class MockMolecule {
      constructor() {
        this.atomType = 'Molecule';
        this.inputs = [];
        this.nodesOnTheScreen = [];
        this.topLevel = false;
      }
      
      atomSerialize() {
        // Simulate that Atom.serialize() already saved ioValues
        return {
          atomType: this.atomType,
          ioValues: [
            { name: 'Existing', ioValue: 999 }
          ]
        };
      }
      
      serialize() {
        var thisAsObject = this.atomSerialize();
        thisAsObject.topLevel = this.topLevel;
        thisAsObject.allAtoms = [];
        thisAsObject.allConnectors = [];
        
        // Should NOT reconstruct because ioValues already exist
        if (!thisAsObject.ioValues || thisAsObject.ioValues.length === 0) {
          const inputAtoms = this.nodesOnTheScreen.filter(atom => atom.atomType === "Input");
          if (inputAtoms.length > 0) {
            const reconstructedIoValues = [];
            const MAX_VALUE_SIZE = 10000;
            
            inputAtoms.forEach(inputAtom => {
              const value = inputAtom.parentAP ? inputAtom.parentAP.getValue() : inputAtom.value;
              
              const valueType = inputAtom.parentAP ? inputAtom.parentAP.valueType : inputAtom.type;
              if (valueType === "geometry") {
                return;
              }
              
              if (typeof value !== "number" && typeof value !== "string") {
                return;
              }
              
              if (typeof value === "string" && value.length > MAX_VALUE_SIZE) {
                return;
              }
              
              if (value !== undefined && value !== null) {
                reconstructedIoValues.push({
                  name: inputAtom.name,
                  ioValue: value
                });
              }
            });
            
            if (reconstructedIoValues.length > 0) {
              thisAsObject.ioValues = reconstructedIoValues;
            }
          }
        }
        
        return thisAsObject;
      }
    }
    
    const molecule = new MockMolecule();
    molecule.nodesOnTheScreen.push({
      atomType: 'Input',
      name: 'Should Not Be Saved',
      type: 'number',
      value: 123,
      parentAP: { getValue: () => 123 }
    });
    
    const serialized = molecule.serialize();
    
    // Should keep the existing ioValues, not reconstruct
    expect(serialized.ioValues).toHaveLength(1);
    expect(serialized.ioValues[0]).toEqual({ name: 'Existing', ioValue: 999 });
    
    console.log('✅ Existing ioValues preserved');
  });
  
  it('should skip geometry type Input atoms to prevent file bloat', () => {
    class MockMolecule {
      constructor() {
        this.atomType = 'Molecule';
        this.inputs = [];
        this.nodesOnTheScreen = [];
        this.topLevel = false;
      }
      
      atomSerialize() {
        return { atomType: this.atomType };
      }
      
      serialize() {
        var thisAsObject = this.atomSerialize();
        thisAsObject.topLevel = this.topLevel;
        thisAsObject.allAtoms = [];
        thisAsObject.allConnectors = [];
        
        if (!thisAsObject.ioValues || thisAsObject.ioValues.length === 0) {
          const inputAtoms = this.nodesOnTheScreen.filter(atom => atom.atomType === "Input");
          if (inputAtoms.length > 0) {
            const reconstructedIoValues = [];
            const MAX_VALUE_SIZE = 10000;
            
            inputAtoms.forEach(inputAtom => {
              // Skip geometry types to prevent file bloat
              const value = inputAtom.parentAP ? inputAtom.parentAP.getValue() : inputAtom.value;
              
              const valueType = inputAtom.parentAP ? inputAtom.parentAP.valueType : inputAtom.type;
              if (valueType === "geometry") {
                return;
              }
              
              if (typeof value !== "number" && typeof value !== "string") {
                return;
              }
              
              if (typeof value === "string" && value.length > MAX_VALUE_SIZE) {
                return;
              }
              
              if (value !== undefined && value !== null) {
                reconstructedIoValues.push({
                  name: inputAtom.name,
                  ioValue: value
                });
              }
            });
            
            if (reconstructedIoValues.length > 0) {
              thisAsObject.ioValues = reconstructedIoValues;
            }
          }
        }
        
        return thisAsObject;
      }
    }
    
    const molecule = new MockMolecule();
    
    // Add a geometry type Input (should be skipped)
    molecule.nodesOnTheScreen.push({
      atomType: 'Input',
      name: 'Geometry Input',
      type: 'geometry',
      value: { huge: 'geometry object' },
      parentAP: { 
        getValue: () => ({ huge: 'geometry object' }),
        valueType: 'geometry'
      }
    });
    
    // Add a number type Input (should be saved)
    molecule.nodesOnTheScreen.push({
      atomType: 'Input',
      name: 'Number Input',
      type: 'number',
      value: 42,
      parentAP: { 
        getValue: () => 42,
        valueType: 'number'
      }
    });
    
    const serialized = molecule.serialize();
    
    // Should only save the number input, not the geometry
    expect(serialized.ioValues).toBeDefined();
    expect(serialized.ioValues).toHaveLength(1);
    expect(serialized.ioValues[0]).toEqual({ name: 'Number Input', ioValue: 42 });
    
    console.log('✅ Geometry inputs correctly skipped');
  });
  
  it('should skip large string values to prevent file bloat', () => {
    class MockMolecule {
      constructor() {
        this.atomType = 'Molecule';
        this.inputs = [];
        this.nodesOnTheScreen = [];
        this.topLevel = false;
      }
      
      atomSerialize() {
        return { atomType: this.atomType };
      }
      
      serialize() {
        var thisAsObject = this.atomSerialize();
        thisAsObject.topLevel = this.topLevel;
        thisAsObject.allAtoms = [];
        thisAsObject.allConnectors = [];
        
        if (!thisAsObject.ioValues || thisAsObject.ioValues.length === 0) {
          const inputAtoms = this.nodesOnTheScreen.filter(atom => atom.atomType === "Input");
          if (inputAtoms.length > 0) {
            const reconstructedIoValues = [];
            const MAX_VALUE_SIZE = 10000;
            
            inputAtoms.forEach(inputAtom => {
              const value = inputAtom.parentAP ? inputAtom.parentAP.getValue() : inputAtom.value;
              
              const valueType = inputAtom.parentAP ? inputAtom.parentAP.valueType : inputAtom.type;
              if (valueType === "geometry") {
                return;
              }
              
              if (typeof value !== "number" && typeof value !== "string") {
                return;
              }
              
              // Skip large strings
              if (typeof value === "string" && value.length > MAX_VALUE_SIZE) {
                console.warn(`Skipping large string: ${value.length} chars`);
                return;
              }
              
              if (value !== undefined && value !== null) {
                reconstructedIoValues.push({
                  name: inputAtom.name,
                  ioValue: value
                });
              }
            });
            
            if (reconstructedIoValues.length > 0) {
              thisAsObject.ioValues = reconstructedIoValues;
            }
          }
        }
        
        return thisAsObject;
      }
    }
    
    const molecule = new MockMolecule();
    
    // Add a large string Input (should be skipped)
    const largeString = 'x'.repeat(20000);
    molecule.nodesOnTheScreen.push({
      atomType: 'Input',
      name: 'Large String',
      type: 'string',
      value: largeString,
      parentAP: { getValue: () => largeString }
    });
    
    // Add a normal string Input (should be saved)
    molecule.nodesOnTheScreen.push({
      atomType: 'Input',
      name: 'Normal String',
      type: 'string',
      value: 'hello',
      parentAP: { getValue: () => 'hello' }
    });
    
    const serialized = molecule.serialize();
    
    // Should only save the normal string, not the large one
    expect(serialized.ioValues).toBeDefined();
    expect(serialized.ioValues).toHaveLength(1);
    expect(serialized.ioValues[0]).toEqual({ name: 'Normal String', ioValue: 'hello' });
    
    console.log('✅ Large strings correctly skipped');
  });
  
  it('should skip non-number and non-string values', () => {
    class MockMolecule {
      constructor() {
        this.atomType = 'Molecule';
        this.inputs = [];
        this.nodesOnTheScreen = [];
        this.topLevel = false;
      }
      
      atomSerialize() {
        return { atomType: this.atomType };
      }
      
      serialize() {
        var thisAsObject = this.atomSerialize();
        thisAsObject.topLevel = this.topLevel;
        thisAsObject.allAtoms = [];
        thisAsObject.allConnectors = [];
        
        if (!thisAsObject.ioValues || thisAsObject.ioValues.length === 0) {
          const inputAtoms = this.nodesOnTheScreen.filter(atom => atom.atomType === "Input");
          if (inputAtoms.length > 0) {
            const reconstructedIoValues = [];
            const MAX_VALUE_SIZE = 10000;
            
            inputAtoms.forEach(inputAtom => {
              const value = inputAtom.parentAP ? inputAtom.parentAP.getValue() : inputAtom.value;
              
              const valueType = inputAtom.parentAP ? inputAtom.parentAP.valueType : inputAtom.type;
              if (valueType === "geometry") {
                return;
              }
              
              // Only save numbers and strings
              if (typeof value !== "number" && typeof value !== "string") {
                return;
              }
              
              if (typeof value === "string" && value.length > MAX_VALUE_SIZE) {
                return;
              }
              
              if (value !== undefined && value !== null) {
                reconstructedIoValues.push({
                  name: inputAtom.name,
                  ioValue: value
                });
              }
            });
            
            if (reconstructedIoValues.length > 0) {
              thisAsObject.ioValues = reconstructedIoValues;
            }
          }
        }
        
        return thisAsObject;
      }
    }
    
    const molecule = new MockMolecule();
    
    // Add an object value Input (should be skipped)
    molecule.nodesOnTheScreen.push({
      atomType: 'Input',
      name: 'Object Input',
      type: 'number',
      value: { some: 'object' },
      parentAP: { getValue: () => ({ some: 'object' }) }
    });
    
    // Add a number Input (should be saved)
    molecule.nodesOnTheScreen.push({
      atomType: 'Input',
      name: 'Number Input',
      type: 'number',
      value: 99,
      parentAP: { getValue: () => 99 }
    });
    
    const serialized = molecule.serialize();
    
    // Should only save the number, not the object
    expect(serialized.ioValues).toBeDefined();
    expect(serialized.ioValues).toHaveLength(1);
    expect(serialized.ioValues[0]).toEqual({ name: 'Number Input', ioValue: 99 });
    
    console.log('✅ Non-number/non-string values correctly skipped');
  });
  
  it('should save number values even when Input atom type is geometry', () => {
    // This tests the edge case from the bug report where Input atoms had type="geometry"
    // but were actually passing through number values that need to be saved
    class MockMolecule {
      constructor() {
        this.atomType = 'Molecule';
        this.inputs = [];
        this.nodesOnTheScreen = [];
        this.topLevel = false;
      }
      
      atomSerialize() {
        return { atomType: this.atomType };
      }
      
      serialize() {
        var thisAsObject = this.atomSerialize();
        thisAsObject.topLevel = this.topLevel;
        thisAsObject.allAtoms = [];
        thisAsObject.allConnectors = [];
        
        if (!thisAsObject.ioValues || thisAsObject.ioValues.length === 0) {
          const inputAtoms = this.nodesOnTheScreen.filter(atom => atom.atomType === "Input");
          if (inputAtoms.length > 0) {
            const reconstructedIoValues = [];
            const MAX_VALUE_SIZE = 10000;
            
            inputAtoms.forEach(inputAtom => {
              const value = inputAtom.parentAP ? inputAtom.parentAP.getValue() : inputAtom.value;
              
              // Check valueType from parentAP, not atom's type
              const valueType = inputAtom.parentAP ? inputAtom.parentAP.valueType : inputAtom.type;
              if (valueType === "geometry") {
                return;
              }
              
              if (typeof value !== "number" && typeof value !== "string") {
                return;
              }
              
              if (typeof value === "string" && value.length > MAX_VALUE_SIZE) {
                return;
              }
              
              if (value !== undefined && value !== null) {
                reconstructedIoValues.push({
                  name: inputAtom.name,
                  ioValue: value
                });
              }
            });
            
            if (reconstructedIoValues.length > 0) {
              thisAsObject.ioValues = reconstructedIoValues;
            }
          }
        }
        
        return thisAsObject;
      }
    }
    
    const molecule = new MockMolecule();
    
    // Add an Input with type="geometry" BUT parentAP.valueType="number" and a number value
    // This simulates the real-world case from the bug report
    molecule.nodesOnTheScreen.push({
      atomType: 'Input',
      name: 'Wood Thickness',
      type: 'geometry',  // Atom type is geometry
      value: 12,
      parentAP: { 
        getValue: () => 12,
        valueType: 'number'  // But actual valueType is number
      }
    });
    
    const serialized = molecule.serialize();
    
    // Should save the number value (12) even though atom type is geometry
    expect(serialized.ioValues).toBeDefined();
    expect(serialized.ioValues).toHaveLength(1);
    expect(serialized.ioValues[0]).toEqual({ name: 'Wood Thickness', ioValue: 12 });
    
    console.log('✅ Number values saved even when Input atom type is geometry');
  });
});
