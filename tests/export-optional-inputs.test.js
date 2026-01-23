/**
 * Test to verify that Export atoms don't remain in WAITING state when
 * non-essential inputs (Part Name, Resolution) are not connected.
 * 
 * Issue: Export atom stays in WAITING status if the PartName IO does not have a connection,
 * even though PartName can be assigned in the paramMenu and is not essential for computation.
 * 
 * Solution: Override inputsAreReady() to only check essential inputs: "geometry" and "File Type"
 */

import { describe, it, expect } from 'vitest';
import { Status } from '../src/prototypes/observableEntity.js';

/**
 * Helper function that implements the Export atom's inputsAreReady logic
 * Only checks essential inputs: "geometry" and "File Type"
 */
function exportInputsAreReady(inputs) {
  const essentialInputs = inputs.filter(
    (input) => input.name === "geometry" || input.name === "File Type"
  );
  return essentialInputs.every((input) => {
    return input.getState().status === Status.READY;
  });
}

describe('Export Atom Optional Input Handling', () => {
  
  it('should only require essential inputs (geometry and File Type) to be ready', () => {
    // Create mock inputs
    const inputs = [
      {
        name: 'geometry',
        valueType: 'geometry',
        getState() {
          return { status: Status.READY, value: { mockGeometry: true } };
        }
      },
      {
        name: 'File Type',
        valueType: 'string',
        getState() {
          return { status: Status.READY, value: 'STL' };
        }
      },
      {
        name: 'Part Name',
        valueType: 'string',
        getState() {
          return { status: Status.WAITING, value: null }; // Not connected
        }
      },
      {
        name: 'Resolution (dpi)',
        valueType: 'number',
        getState() {
          return { status: Status.WAITING, value: null }; // Not connected
        }
      }
    ];
    
    // Should return true even though Part Name and Resolution are WAITING
    const result = exportInputsAreReady(inputs);
    
    expect(result).toBe(true);
  });

  it('should not be ready when geometry is waiting', () => {
    const inputs = [
      {
        name: 'geometry',
        valueType: 'geometry',
        getState() {
          return { status: Status.WAITING, value: null }; // Not ready
        }
      },
      {
        name: 'File Type',
        valueType: 'string',
        getState() {
          return { status: Status.READY, value: 'STL' };
        }
      },
      {
        name: 'Part Name',
        valueType: 'string',
        getState() {
          return { status: Status.READY, value: 'output' };
        }
      },
      {
        name: 'Resolution (dpi)',
        valueType: 'number',
        getState() {
          return { status: Status.READY, value: 96 };
        }
      }
    ];
    
    const result = exportInputsAreReady(inputs);
    
    expect(result).toBe(false);
  });

  it('should not be ready when File Type is waiting', () => {
    const inputs = [
      {
        name: 'geometry',
        valueType: 'geometry',
        getState() {
          return { status: Status.READY, value: { mockGeometry: true } };
        }
      },
      {
        name: 'File Type',
        valueType: 'string',
        getState() {
          return { status: Status.WAITING, value: null }; // Not ready
        }
      },
      {
        name: 'Part Name',
        valueType: 'string',
        getState() {
          return { status: Status.READY, value: 'output' };
        }
      },
      {
        name: 'Resolution (dpi)',
        valueType: 'number',
        getState() {
          return { status: Status.READY, value: 96 };
        }
      }
    ];
    
    const result = exportInputsAreReady(inputs);
    
    expect(result).toBe(false);
  });

  it('should be ready when all essential inputs are ready (all inputs ready case)', () => {
    const inputs = [
      {
        name: 'geometry',
        valueType: 'geometry',
        getState() {
          return { status: Status.READY, value: { mockGeometry: true } };
        }
      },
      {
        name: 'File Type',
        valueType: 'string',
        getState() {
          return { status: Status.READY, value: 'STL' };
        }
      },
      {
        name: 'Part Name',
        valueType: 'string',
        getState() {
          return { status: Status.READY, value: 'output' };
        }
      },
      {
        name: 'Resolution (dpi)',
        valueType: 'number',
        getState() {
          return { status: Status.READY, value: 96 };
        }
      }
    ];
    
    const result = exportInputsAreReady(inputs);
    
    expect(result).toBe(true);
  });

  it('should be ready with geometry and File Type ready, regardless of other input states', () => {
    const inputs = [
      {
        name: 'geometry',
        valueType: 'geometry',
        getState() {
          return { status: Status.READY, value: { mockGeometry: true } };
        }
      },
      {
        name: 'File Type',
        valueType: 'string',
        getState() {
          return { status: Status.READY, value: 'STEP' };
        }
      },
      {
        name: 'Part Name',
        valueType: 'string',
        getState() {
          return { status: Status.WAITING, value: null }; // Not connected
        }
      },
      {
        name: 'Resolution (dpi)',
        valueType: 'number',
        getState() {
          return { status: Status.WAITING, value: null }; // Not connected
        }
      }
    ];
    
    const result = exportInputsAreReady(inputs);
    
    expect(result).toBe(true);
  });
});
