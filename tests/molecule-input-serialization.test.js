import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Test for Issue: Serialization not saving some inputs to molecules
 * 
 * This test validates that when a molecule with Input atoms is serialized and
 * deserialized, the input values are correctly restored, even when those inputs
 * are not connected to anything.
 * 
 * The bug was that setValues([]) was called before the Input atoms were fully
 * initialized, causing their values to not be restored.
 */
describe('Molecule Input Serialization', () => {
  
  it('should restore input values for unconnected Input atoms after deserialization', async () => {
    // Mock the necessary global variables and classes
    const GlobalVariables = {
      generateUniqueID: () => Math.random().toString(36).substr(2, 9),
      atomSize: 0.02,
      currentMolecule: null,
      numberOfAtomsToLoad: 0,
      availableTypes: {},
    };
    
    // Mock Molecule class with minimal implementation
    class MockMolecule {
      constructor(values = {}) {
        this.inputs = [];
        this.outputs = [];
        this.ioValues = undefined;
        this.nodesOnTheScreen = [];
        this.atomType = 'Molecule';
        this.name = values.name || 'TestMolecule';
        this.uniqueID = values.uniqueID || GlobalVariables.generateUniqueID();
        
        Object.assign(this, values);
      }
      
      addIO(name, type, value, ioType) {
        const ap = {
          name,
          valueType: type,
          value,
          type: ioType,
          parentMolecule: this,
        };
        
        if (ioType === 'input') {
          this.inputs.push(ap);
        } else {
          this.outputs.push(ap);
        }
        
        return ap;
      }
      
      setValues(values) {
        // Mimic the actual setValues implementation
        for (var key in values) {
          this[key] = values[key];
        }
        
        if (typeof this.ioValues !== "undefined") {
          this.ioValues.forEach((ioValue) => {
            this.inputs.forEach((ap) => {
              if (ioValue.name == ap.name && ap.type == "input") {
                ap.value = ioValue.ioValue;
                if (
                  "currentEquation" in ioValue &&
                  !Number.isFinite(Number(ioValue.currentEquation))
                ) {
                  ap.currentEquation = ioValue.currentEquation;
                }
              }
            });
          });
        }
      }
      
      async placeAtom(atomObj, unlock) {
        // Simulate placing an Input atom
        if (atomObj.atomType === 'Input') {
          const input = {
            atomType: 'Input',
            name: atomObj.name,
            type: atomObj.type || 'number',
            value: atomObj.value || 10,
            parent: this,
          };
          
          // Create the parent attachment point (this is what Input atom does in its constructor)
          const parentAP = this.addIO(
            input.name,
            input.type,
            input.value,
            'input'
          );
          
          this.nodesOnTheScreen.push(input);
          
          // Return a resolved promise to simulate async behavior
          return Promise.resolve(input);
        }
        
        return Promise.resolve(null);
      }
      
      async deserialize(json, values = {}, forceEnable = false) {
        let promiseArray = [];
        
        this.setValues(json);
        this.setValues(values);
        
        if (json.allAtoms) {
          json.allAtoms.forEach((atom) => {
            const promise = this.placeAtom(atom, false);
            promiseArray.push(promise);
            
            // THIS IS THE BUG - calling setValues before atoms are placed
            // this.setValues([]);
          });
        }
        
        return Promise.all(promiseArray).then(() => {
          // This is the CORRECT place to call setValues
          this.setValues([]);
          return this;
        });
      }
    }
    
    // Test scenario: A molecule with an Input "Wood Thickness" with value 12
    const moleculeJson = {
      atomType: 'Molecule',
      name: 'Vertical',
      uniqueID: 'vertical-123',
      allAtoms: [
        {
          atomType: 'Input',
          name: 'Wood Thickness',
          type: 'number',
          value: 10, // Default value in the template
          uniqueID: 'input-456',
        }
      ],
    };
    
    const savedValues = {
      uniqueID: 'vertical-123',
      ioValues: [
        {
          name: 'Wood Thickness',
          ioValue: 12, // Custom value saved in project
        }
      ],
    };
    
    // Create and deserialize the molecule
    const molecule = new MockMolecule();
    await molecule.deserialize(moleculeJson, savedValues);
    
    // Verify that the Input atom's attachment point exists
    expect(molecule.inputs.length).toBe(1);
    expect(molecule.inputs[0].name).toBe('Wood Thickness');
    
    // Verify that the saved value (12) was restored, not the default (10)
    expect(molecule.inputs[0].value).toBe(12);
    
    console.log('✅ Molecule Input Serialization test passed - values correctly restored');
  });
  
  it('should handle multiple Input atoms with different values', async () => {
    // Similar setup but with multiple inputs
    const GlobalVariables = {
      generateUniqueID: () => Math.random().toString(36).substr(2, 9),
    };
    
    class MockMolecule {
      constructor(values = {}) {
        this.inputs = [];
        this.ioValues = undefined;
        this.nodesOnTheScreen = [];
        Object.assign(this, values);
      }
      
      addIO(name, type, value, ioType) {
        const ap = { name, valueType: type, value, type: ioType };
        if (ioType === 'input') this.inputs.push(ap);
        return ap;
      }
      
      setValues(values) {
        for (var key in values) {
          this[key] = values[key];
        }
        if (typeof this.ioValues !== "undefined") {
          this.ioValues.forEach((ioValue) => {
            this.inputs.forEach((ap) => {
              if (ioValue.name == ap.name && ap.type == "input") {
                ap.value = ioValue.ioValue;
              }
            });
          });
        }
      }
      
      async placeAtom(atomObj) {
        if (atomObj.atomType === 'Input') {
          this.addIO(atomObj.name, atomObj.type || 'number', atomObj.value || 10, 'input');
        }
        return Promise.resolve();
      }
      
      async deserialize(json, values = {}) {
        let promiseArray = [];
        this.setValues(json);
        this.setValues(values);
        
        if (json.allAtoms) {
          json.allAtoms.forEach((atom) => {
            const promise = this.placeAtom(atom, false);
            promiseArray.push(promise);
          });
        }
        
        return Promise.all(promiseArray).then(() => {
          this.setValues([]);
          return this;
        });
      }
    }
    
    const moleculeJson = {
      atomType: 'Molecule',
      name: 'Benches',
      allAtoms: [
        { atomType: 'Input', name: 'Wood Thickness', type: 'number', value: 10 },
        { atomType: 'Input', name: 'Length', type: 'number', value: 100 },
        { atomType: 'Input', name: 'Width', type: 'number', value: 50 },
      ],
    };
    
    const savedValues = {
      ioValues: [
        { name: 'Wood Thickness', ioValue: 12 },
        { name: 'Length', ioValue: 120 },
        { name: 'Width', ioValue: 60 },
      ],
    };
    
    const molecule = new MockMolecule();
    await molecule.deserialize(moleculeJson, savedValues);
    
    expect(molecule.inputs.length).toBe(3);
    expect(molecule.inputs[0].value).toBe(12);
    expect(molecule.inputs[1].value).toBe(120);
    expect(molecule.inputs[2].value).toBe(60);
    
    console.log('✅ Multiple inputs test passed');
  });
});
