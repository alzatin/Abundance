// Test file for getBounds functionality
import { beforeAll, describe, it, expect } from "vitest";
import { init, getBounds } from "../src/worker/util.ts";
import { rectangle } from "../src/worker/shapes.ts";
import { extrude } from "../src/worker/actions.ts";
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
});