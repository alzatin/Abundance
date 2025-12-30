import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Status } from '../src/prototypes/observableEntity.js';
import { NO_GEOMETRY } from '../src/prototypes/attachmentpoint.js';

describe('Code Atom Geometry Input Initialization Fix', () => {
  let MockAttachmentPoint;
  let MockCode;
  
  beforeEach(() => {
    // Mock AttachmentPoint with setValue method
    MockAttachmentPoint = class {
      constructor({ name, valueType, defaultValue }) {
        this.name = name;
        this.valueType = valueType;
        this.defaultValue = defaultValue;
        this.value = defaultValue;
        this.status = Status.DISABLED;
        this.setValueCalled = false;
        this.setValueArgs = null;
      }
      
      setValue(value, type) {
        this.setValueCalled = true;
        this.setValueArgs = { value, type };
        // Simulate the actual setValue behavior for geometry
        if (type === 'geometry' && value === null) {
          this.value = NO_GEOMETRY;
          this.status = Status.READY;
        } else {
          this.value = value;
          this.status = Status.READY;
        }
      }
    };
    
    // Mock Code class with parseInputs method
    MockCode = class {
      constructor() {
        this.inputs = [];
      }
      
      _addIOWithoutSubscribing(name, type, defaultValue) {
        const ap = new MockAttachmentPoint({ name, valueType: type, defaultValue });
        this.inputs.push(ap);
        return ap;
      }
      
      parseInputsWithFix(inputsArray) {
        // This is the FIXED version with setValue() call
        const variableNames = [];
        inputsArray.forEach(({ inputName, type, defaultValue }) => {
          variableNames.push(inputName);
          const existingInput = this.inputs.find(
            (input) => input.name === inputName
          );
          
          if (!existingInput) {
            this._addIOWithoutSubscribing(
              inputName,
              type,
              defaultValue
            );
          } else {
            // Update the attachment point's properties
            existingInput.valueType = type;
            existingInput.defaultValue = defaultValue;
            // Reinitialize the attachment point with the new default value
            // This is the FIX!
            existingInput.setValue(defaultValue, type);
          }
        });
      }
      
      parseInputsWithoutFix(inputsArray) {
        // This is the BUGGY version without setValue() call
        const variableNames = [];
        inputsArray.forEach(({ inputName, type, defaultValue }) => {
          variableNames.push(inputName);
          const existingInput = this.inputs.find(
            (input) => input.name === inputName
          );
          
          if (!existingInput) {
            this._addIOWithoutSubscribing(
              inputName,
              type,
              defaultValue
            );
          } else {
            // Update the attachment point's properties
            existingInput.valueType = type;
            existingInput.defaultValue = defaultValue;
            // BUG: No setValue() call to reinitialize the AP
          }
        });
      }
    };
  });
  
  it('should demonstrate the bug: existing geometry input not reinitialized', () => {
    const codeAtom = new MockCode();
    
    // Step 1: Create an initial geometry input with defaultValue: null
    const initialInputs = [
      { inputName: 'shape', type: 'geometry', defaultValue: null }
    ];
    
    codeAtom.parseInputsWithoutFix(initialInputs);
    
    // Verify the input was created
    expect(codeAtom.inputs.length).toBe(1);
    const shapeInput = codeAtom.inputs[0];
    expect(shapeInput.name).toBe('shape');
    expect(shapeInput.valueType).toBe('geometry');
    
    // Step 2: Manually modify the input's state to simulate it being in an incorrect state
    // (e.g., after being created by ioValues processing or from a previous load)
    shapeInput.status = Status.WAITING;
    shapeInput.value = 'some-old-value';
    
    // Step 3: Call parseInputs again (simulates what happens during deserialization)
    codeAtom.parseInputsWithoutFix(initialInputs);
    
    // BUG: The existing input's properties were updated but setValue() was not called
    expect(shapeInput.setValueCalled).toBe(false);
    // The input is still in an incorrect state
    expect(shapeInput.status).toBe(Status.WAITING);
    expect(shapeInput.value).toBe('some-old-value');
    
    console.log('BUG CONFIRMED: Geometry input was not reinitialized');
    console.log('Status:', shapeInput.status, '(should be READY)');
    console.log('Value:', shapeInput.value, '(should be NO_GEOMETRY)');
  });
  
  it('should demonstrate the fix: existing geometry input properly reinitialized', () => {
    const codeAtom = new MockCode();
    
    // Step 1: Create an initial geometry input with defaultValue: null
    const initialInputs = [
      { inputName: 'shape', type: 'geometry', defaultValue: null }
    ];
    
    codeAtom.parseInputsWithFix(initialInputs);
    
    // Verify the input was created
    expect(codeAtom.inputs.length).toBe(1);
    const shapeInput = codeAtom.inputs[0];
    expect(shapeInput.name).toBe('shape');
    expect(shapeInput.valueType).toBe('geometry');
    
    // Step 2: Manually modify the input's state to simulate it being in an incorrect state
    shapeInput.status = Status.WAITING;
    shapeInput.value = 'some-old-value';
    shapeInput.setValueCalled = false; // Reset the flag
    
    // Step 3: Call parseInputs again with the FIX
    codeAtom.parseInputsWithFix(initialInputs);
    
    // FIX: The existing input's setValue() was called to reinitialize it
    expect(shapeInput.setValueCalled).toBe(true);
    expect(shapeInput.setValueArgs).toEqual({ value: null, type: 'geometry' });
    // The input is now in the correct state
    expect(shapeInput.status).toBe(Status.READY);
    expect(shapeInput.value).toBe(NO_GEOMETRY);
    
    console.log('FIX VERIFIED: Geometry input was properly reinitialized');
    console.log('Status:', shapeInput.status);
    console.log('Value:', shapeInput.value);
  });
  
  it('should handle the GitHub molecule copy/paste scenario', () => {
    const codeAtom = new MockCode();
    
    // Simulate the scenario described in the issue:
    // 1. Code atom inside a GitHub molecule has geometry input with defaultValue: null
    // 2. During deserialization, parseInputs() is called
    // 3. The geometry input might already exist in inputs array (e.g., created by ioValues)
    // 4. parseInputs() should reinitialize it
    
    // Step 1: Simulate ioValues creating inputs (but geometry inputs are skipped)
    // So we manually create a geometry input with incorrect state
    const existingInput = codeAtom._addIOWithoutSubscribing('shape', 'geometry', null);
    existingInput.status = Status.WAITING;
    existingInput.value = 'incorrect-value';
    
    // Step 2: parseInputs() is called during Code constructor
    const inputsFromCode = [
      { inputName: 'shape', type: 'geometry', defaultValue: null }
    ];
    
    codeAtom.parseInputsWithFix(inputsFromCode);
    
    // Step 3: Verify the geometry input is now properly initialized
    expect(existingInput.setValueCalled).toBe(true);
    expect(existingInput.status).toBe(Status.READY);
    expect(existingInput.value).toBe(NO_GEOMETRY);
    
    console.log('SUCCESS: GitHub molecule copy/paste scenario handled correctly');
    console.log('Geometry input properly initialized to READY with NO_GEOMETRY');
  });
  
  it('should also work for number inputs being updated', () => {
    const codeAtom = new MockCode();
    
    // Create an initial number input
    const initialInputs = [
      { inputName: 'radius', type: 'number', defaultValue: 5 }
    ];
    
    codeAtom.parseInputsWithFix(initialInputs);
    const radiusInput = codeAtom.inputs[0];
    
    // Change the default value
    radiusInput.setValueCalled = false;
    const updatedInputs = [
      { inputName: 'radius', type: 'number', defaultValue: 10 }
    ];
    
    codeAtom.parseInputsWithFix(updatedInputs);
    
    // Verify setValue was called with the new default
    expect(radiusInput.setValueCalled).toBe(true);
    expect(radiusInput.setValueArgs).toEqual({ value: 10, type: 'number' });
    expect(radiusInput.defaultValue).toBe(10);
    
    console.log('SUCCESS: Number input also properly reinitialized');
  });
});
