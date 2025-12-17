// Test file for getBounds functionality
import { beforeAll, describe, it, expect } from "vitest";
import { init, getBounds } from "../src/worker/util.ts";
import { rectangle } from "../src/worker/shapes.ts";
import { extrude, move } from "../src/worker/actions.ts";
import { executeCode } from "../src/worker/code.ts";

describe("getBounds function", () => {
  beforeAll(async () => {
    await init();
  });

  it("should return finite bounds for a simple 3D cube", async () => {
    // Create a 10x10x10 cube
    const rect = await rectangle(10, 10);
    const cube = await extrude(rect, 10);

    // Get bounds
    const bounds = await getBounds(cube);

    // Verify bounds are finite and reasonable
    expect(bounds.min).toBeDefined();
    expect(bounds.max).toBeDefined();
    expect(bounds.min).toHaveLength(3);
    expect(bounds.max).toHaveLength(3);

    // All values should be finite (not Infinity or -Infinity)
    bounds.min.forEach(val => {
      expect(isFinite(val)).toBe(true);
      expect(val).not.toBe(Infinity);
      expect(val).not.toBe(-Infinity);
    });

    bounds.max.forEach(val => {
      expect(isFinite(val)).toBe(true);
      expect(val).not.toBe(Infinity);
      expect(val).not.toBe(-Infinity);
    });

    // For a 10x10x10 cube centered at origin, bounds should be approximately -5 to 5
    expect(bounds.min[0]).toBeCloseTo(-5, 1);
    expect(bounds.min[1]).toBeCloseTo(-5, 1);
    expect(bounds.min[2]).toBeCloseTo(0, 1);
    expect(bounds.max[0]).toBeCloseTo(5, 1);
    expect(bounds.max[1]).toBeCloseTo(5, 1);
    expect(bounds.max[2]).toBeCloseTo(10, 1);
  });

  it("should return finite bounds for a 2D rectangle", async () => {
    // Create a 10x5 rectangle
    const rect = await rectangle(10, 5);

    // Get bounds
    const bounds = await getBounds(rect);

    // Verify bounds are finite and reasonable
    expect(bounds.min).toBeDefined();
    expect(bounds.max).toBeDefined();
    expect(bounds.min).toHaveLength(3);
    expect(bounds.max).toHaveLength(3);

    // All values should be finite (not Infinity or -Infinity)
    bounds.min.forEach(val => {
      expect(isFinite(val)).toBe(true);
      expect(val).not.toBe(Infinity);
      expect(val).not.toBe(-Infinity);
    });

    bounds.max.forEach(val => {
      expect(isFinite(val)).toBe(true);
      expect(val).not.toBe(Infinity);
      expect(val).not.toBe(-Infinity);
    });

    // For a 10x5 rectangle, bounds should be approximately -5 to 5 in X, -2.5 to 2.5 in Y, 0 in Z
    expect(bounds.min[0]).toBeCloseTo(-5, 1);
    expect(bounds.min[1]).toBeCloseTo(-2.5, 1);
    expect(bounds.min[2]).toBe(0);
    expect(bounds.max[0]).toBeCloseTo(5, 1);
    expect(bounds.max[1]).toBeCloseTo(2.5, 1);
    expect(bounds.max[2]).toBe(0);
  });

  it("should work correctly when called from Code atom context", async () => {
    // This test replicates the exact scenario from the issue description
    const codeString = `
      Inputs = [
       {inputName: "A", type: "geometry", defaultValue: null},
        {inputName: "B", type: "geometry", defaultValue: null},
      ]
      //This defines the molecules inputs and creates variables with the same names which can be referenced in the code

      //Takes the address and gets the shape from the library
      let importedShape = library[A]

      console.log("Bounding box:");
      console.log(await GetBounds(A));
      
      return importedShape;
    `;

    // Create a 10x10x10 cube to match the issue description
    const rect = await rectangle(10, 10);
    const cube = await extrude(rect, 10);
    
    const library = {
      test_cube: cube,
    };
    
    const args = {
      A: "test_cube",
      B: null,
    };

    // Execute the code - this should not throw an error and should work correctly
    const result = await executeCode(codeString, args, library);
    
    expect(result).toBeDefined();
    // The result should be the imported shape
    expect(result.geometry).toBeDefined();
  });

  it("should handle null geometry input in conditional code (move above B or XY plane)", async () => {
    // This test exactly matches the user's issue: Move A above B if B exists,
    // otherwise move A above the XY plane (B_maxZ defaults to 0)
    const codeString = `
      Inputs = [
        {inputName: "A", type: "geometry", defaultValue: null},
        {inputName: "B", type: "geometry", defaultValue: null}
      ]

      let boundsA = await GetBounds(A);
      let A_minZ = boundsA.min[2];

      let B_maxZ = 0;
      if(B){
          let boundsB = await GetBounds(B);
          B_maxZ  = boundsB.max[2];
      }

      let translationZ = B_maxZ - A_minZ;
      
      let movedOutput = await Move(A, 0, 0, translationZ);

      return movedOutput;
    `;

    // Create a test cube that starts at Z=0 and goes to Z=10
    const rect = await rectangle(10, 10);
    const cube = await extrude(rect, 10);
    
    const library = {
      test_cube: cube,
    };
    
    // Test case 1: B is null (should move A so bottom is at Z=0)
    const args1 = {
      A: "test_cube",
      B: null,
    };

    const result1 = await executeCode(codeString, args1, library);
    
    expect(result1).toBeDefined();
    expect(result1.geometry).toBeDefined();
    
    // Verify the cube was moved correctly (bottom should be at Z=0)
    const bounds1 = await getBounds(result1);
    expect(bounds1.min[2]).toBeCloseTo(0, 1); // Bottom at Z=0
    expect(bounds1.max[2]).toBeCloseTo(10, 1); // Top at Z=10

    // Test case 2: Both A and B connected (should move A above B)
    const cube2 = await extrude(await rectangle(8, 8), 5); // 5mm tall cube
    const library2 = {
      cubeA: cube,
      cubeB: cube2,
    };
    
    const args2 = {
      A: "cubeA",
      B: "cubeB",
    };

    const result2 = await executeCode(codeString, args2, library2);
    
    expect(result2).toBeDefined();
    expect(result2.geometry).toBeDefined();
    
    // Verify A was moved so its bottom is at B's top (Z=5)
    const bounds2 = await getBounds(result2);
    expect(bounds2.min[2]).toBeCloseTo(5, 1); // Bottom at B's top (Z=5)
    expect(bounds2.max[2]).toBeCloseTo(15, 1); // Top at Z=15
  });
});