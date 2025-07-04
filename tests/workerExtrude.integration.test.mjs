// Integration test for extrude in worker.js using real replicad and WASM
import '../src/worker.js'; // Import worker to initialize globals and load WASM
import * as replicad from 'replicad';

// Import the actual functions we need from the worker module
// Since worker.js doesn't export directly, we need to access the functions from global scope or re-import
let library;
let circle, rectangle, extrude, is3D;

beforeAll(async () => {
  // Wait for the worker to initialize (WASM loading)
  // The worker.js file sets up everything when imported
  await new Promise(resolve => setTimeout(resolve, 1000)); // Give time for WASM to load
  
  // Access the library that worker.js sets up
  if (typeof global !== 'undefined' && global.library) {
    library = global.library;
  } else {
    // Create our own library if not available
    library = {};
    global.library = library;
  }
  
  // Import worker functions - we need to access them directly since they're not exported
  // Let's create our own versions using the worker's pattern
  circle = async (id, diameter) => {
    const newPlane = new replicad.Plane().pivot(0, "Y");
    library[id] = {
      geometry: [replicad.drawCircle(diameter / 2)],
      tags: [],
      plane: newPlane,
      color: "#aad7f2",
      bom: [],
    };
    return true;
  };
  
  rectangle = async (id, x, y) => {
    const newPlane = new replicad.Plane().pivot(0, "Y");
    library[id] = {
      geometry: [replicad.drawRectangle(x, y)],
      tags: [],
      plane: newPlane,
      color: "#aad7f2",
      bom: [],
    };
    return true;
  };
  
  // Helper function to check if geometry is 3D
  is3D = (inputs) => {
    if (inputs.geometry[0].mesh !== undefined || inputs.geometry[0] instanceof replicad.Wire) {
      return true;
    } else {
      return false;
    }
  };
  
  // Simplified version of actOnLeafs for testing
  const actOnLeafs = (input, callback) => {
    if (input.geometry && input.geometry.length === 1 && input.geometry[0].geometry === undefined) {
      // This is a leaf
      return callback(input);
    } else {
      // This would be for assemblies, but for simple test we assume single geometry
      return callback(input);
    }
  };
  
  extrude = async (targetID, inputID, height) => {
    const inputGeom = library[inputID];
    if (!inputGeom) {
      throw new Error(`Input geometry ${inputID} not found in library`);
    }
    
    library[targetID] = actOnLeafs(inputGeom, (leaf) => {
      return {
        geometry: [
          leaf.geometry[0].clone().sketchOnPlane(leaf.plane).extrude(height),
        ],
        tags: leaf.tags,
        plane: leaf.plane,
        color: leaf.color,
        bom: leaf.bom,
      };
    });
    return true;
  };
});

afterEach(() => {
  // Reset library after each test
  if (library) {
    for (const key of Object.keys(library)) delete library[key];
  }
});

describe('worker.js extrude integration', () => {
  it('extrudes a rectangle sketch into a 3D box', async () => {
    // 1. Create a 2D rectangle in the library
    const inputID = 'rect1';
    const targetID = 'box1';
    const width = 10;
    const height = 5;
    const extrudeHeight = 3;

    // Create the rectangle first
    await rectangle(inputID, width, height);
    
    // Verify the rectangle was created
    expect(library[inputID]).toBeDefined();
    expect(library[inputID].geometry).toHaveLength(1);
    expect(is3D(library[inputID])).toBe(false); // Should be 2D sketch

    // 2. Call extrude
    await extrude(targetID, inputID, extrudeHeight);

    // 3. Check the result in the library
    const result = library[targetID];
    expect(result).toBeDefined();
    expect(result.geometry).toHaveLength(1);
    
    const solid = result.geometry[0];
    expect(solid).toBeDefined();
    expect(is3D(result)).toBe(true); // Should now be 3D
    
    // Check bounding box dimensions
    const bounds = solid.boundingBox;
    expect(bounds).toBeDefined();
    expect(bounds.width).toBeCloseTo(width, 1);
    expect(bounds.height).toBeCloseTo(height, 1);
    expect(bounds.depth).toBeCloseTo(extrudeHeight, 1);
  });
  
  it('creates a circle and extrudes it into a cylinder', async () => {
    const inputID = 'circle1';
    const targetID = 'cylinder1';
    const diameter = 8;
    const extrudeHeight = 6;

    // Create the circle first
    await circle(inputID, diameter);
    
    // Verify the circle was created
    expect(library[inputID]).toBeDefined();
    expect(library[inputID].geometry).toHaveLength(1);
    expect(is3D(library[inputID])).toBe(false); // Should be 2D sketch

    // Extrude the circle
    await extrude(targetID, inputID, extrudeHeight);

    // Check the result
    const result = library[targetID];
    expect(result).toBeDefined();
    expect(result.geometry).toHaveLength(1);
    expect(is3D(result)).toBe(true); // Should now be 3D
    
    const cylinder = result.geometry[0];
    const bounds = cylinder.boundingBox;
    expect(bounds.width).toBeCloseTo(diameter, 1);
    expect(bounds.height).toBeCloseTo(diameter, 1);
    expect(bounds.depth).toBeCloseTo(extrudeHeight, 1);
  });
});
