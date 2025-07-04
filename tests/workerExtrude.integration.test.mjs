// Integration test for extrude in worker.js using real replicad and WASM
import { 
  library, 
  started, 
  circle, 
  rectangle, 
  extrude, 
  is3D 
} from '../src/worker.js';

describe('worker.js extrude integration', () => {
  beforeAll(async () => {
    // Wait for the worker to initialize (WASM loading)
    await started;
  });

  afterEach(() => {
    // Reset library after each test
    for (const key of Object.keys(library)) {
      delete library[key];
    }
  });

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
