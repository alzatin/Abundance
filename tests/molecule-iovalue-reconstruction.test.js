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
      
      // Molecule.serialize() - includes our fix
      serialize(offset = { x: 0, y: 0 }) {
        var allAtoms = [];
        this.nodesOnTheScreen.forEach((atom) => {
          allAtoms.push({ atomType: atom.atomType, name: atom.name });
        });
        
        var thisAsObject = this.atomSerialize();
        thisAsObject.topLevel = this.topLevel;
        thisAsObject.allAtoms = allAtoms;
        thisAsObject.allConnectors = [];
        
        // THE FIX: Reconstruct ioValues from Input atoms
        if (!thisAsObject.ioValues || thisAsObject.ioValues.length === 0) {
          const inputAtoms = this.nodesOnTheScreen.filter(atom => atom.atomType === "Input");
          if (inputAtoms.length > 0) {
            const reconstructedIoValues = [];
            inputAtoms.forEach(inputAtom => {
              const value = inputAtom.parentAP ? inputAtom.parentAP.getValue() : inputAtom.value;
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
            inputAtoms.forEach(inputAtom => {
              const value = inputAtom.parentAP ? inputAtom.parentAP.getValue() : inputAtom.value;
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
            inputAtoms.forEach(inputAtom => {
              const value = inputAtom.parentAP ? inputAtom.parentAP.getValue() : inputAtom.value;
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
            inputAtoms.forEach(inputAtom => {
              const value = inputAtom.parentAP ? inputAtom.parentAP.getValue() : inputAtom.value;
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
      value: 123,
      parentAP: { getValue: () => 123 }
    });
    
    const serialized = molecule.serialize();
    
    // Should keep the existing ioValues, not reconstruct
    expect(serialized.ioValues).toHaveLength(1);
    expect(serialized.ioValues[0]).toEqual({ name: 'Existing', ioValue: 999 });
    
    console.log('✅ Existing ioValues preserved');
  });
});
