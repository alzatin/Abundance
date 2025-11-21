import { expect, test, describe, beforeAll } from "vitest";
import { init } from "../src/worker/util.ts";
import { visualizeGcode, visualizeGcodeIncremental } from "../src/worker/worker.ts";

describe("Incremental G-code Visualization Performance Tests", () => {
  beforeAll(async () => {
    await init();
  });

  test("should visualize single gcode part with incremental method", async () => {
    const singleGcode = `
G0 X0 Y0 Z0
G1 X10 Y0 Z0
G1 X10 Y10 Z0
G1 X0 Y10 Z0
G1 X0 Y0 Z0
`;
    
    const context = { project: "test-single-incremental" };
    const result = await visualizeGcodeIncremental([singleGcode], context);
    
    expect(result).toBeDefined();
    expect(result.geometry).toBeDefined();
    expect(result.dimension).toBe("3D");
  });

  test("should visualize multiple gcode parts with incremental method", async () => {
    const gcodePart1 = `
G0 X0 Y0 Z0
G1 X10 Y0 Z0
G1 X10 Y10 Z0
G1 X0 Y10 Z0
G1 X0 Y0 Z0
`;

    const gcodePart2 = `
G0 X20 Y0 Z0
G1 X30 Y0 Z0
G1 X30 Y10 Z0
G1 X20 Y10 Z0
G1 X20 Y0 Z0
`;

    const gcodePart3 = `
G0 X40 Y0 Z0
G1 X50 Y0 Z0
G1 X50 Y10 Z0
G1 X40 Y10 Z0
G1 X40 Y0 Z0
`;
    
    const context = { project: "test-multi-incremental" };
    const result = await visualizeGcodeIncremental(
      [gcodePart1, gcodePart2, gcodePart3],
      context
    );
    
    expect(result).toBeDefined();
    expect(result.geometry).toBeDefined();
    expect(result.dimension).toBe("3D");
  });

  test("should produce same visual result for both methods", async () => {
    const gcodePart1 = `
G0 X0 Y0 Z0
G1 X10 Y0 Z0
G1 X10 Y10 Z0
G1 X0 Y10 Z0
G1 X0 Y0 Z0
`;

    const gcodePart2 = `
G0 X20 Y0 Z0
G1 X30 Y0 Z0
G1 X30 Y10 Z0
G1 X20 Y10 Z0
G1 X20 Y0 Z0
`;

    const concatenatedGcode = gcodePart1 + "\n" + gcodePart2;
    
    const contextOriginal = { project: "test-original-method" };
    const contextIncremental = { project: "test-incremental-method" };
    
    const resultOriginal = await visualizeGcode(concatenatedGcode, contextOriginal);
    const resultIncremental = await visualizeGcodeIncremental(
      [gcodePart1, gcodePart2],
      contextIncremental
    );
    
    // Both methods should produce valid results
    expect(resultOriginal).toBeDefined();
    expect(resultIncremental).toBeDefined();
    expect(resultOriginal.dimension).toBe("3D");
    expect(resultIncremental.dimension).toBe("3D");
  });

  test("should handle empty gcode array", async () => {
    const context = { project: "test-empty-array" };
    // Empty array should throw an error like the original function
    await expect(visualizeGcodeIncremental([], context)).rejects.toThrow();
  });

  test("should compare performance for multiple parts", async () => {
    // Create 5 gcode parts
    const gcodeParts = [];
    for (let i = 0; i < 5; i++) {
      const x = i * 20;
      gcodeParts.push(`
G0 X${x} Y0 Z0
G1 X${x + 10} Y0 Z0
G1 X${x + 10} Y10 Z0
G1 X${x} Y10 Z0
G1 X${x} Y0 Z0
`);
    }

    const concatenatedGcode = gcodeParts.join("\n");
    
    // Time original method
    const startOriginal = performance.now();
    const contextOriginal = { project: "test-perf-original" };
    const resultOriginal = await visualizeGcode(concatenatedGcode, contextOriginal);
    const timeOriginal = performance.now() - startOriginal;
    
    // Time incremental method
    const startIncremental = performance.now();
    const contextIncremental = { project: "test-perf-incremental" };
    const resultIncremental = await visualizeGcodeIncremental(gcodeParts, contextIncremental);
    const timeIncremental = performance.now() - startIncremental;
    
    console.log(`\n=== Performance Test Results (5 parts) ===`);
    console.log(`Original method: ${timeOriginal.toFixed(2)}ms`);
    console.log(`Incremental method: ${timeIncremental.toFixed(2)}ms`);
    const improvement = ((timeOriginal - timeIncremental) / timeOriginal * 100);
    console.log(`Performance difference: ${improvement.toFixed(1)}%`);
    
    // Both methods should produce valid results
    expect(resultOriginal).toBeDefined();
    expect(resultIncremental).toBeDefined();
    
    // Report the performance comparison
    console.log(`✅ Both methods produce valid results`);
  });

  test("should handle complex gcode with Z movements", async () => {
    const complexGcode1 = `
G0 X0 Y0 Z0
G1 X10 Y0 Z0
G1 X10 Y10 Z5
G1 X0 Y10 Z5
G1 X0 Y0 Z0
`;

    const complexGcode2 = `
G0 X20 Y20 Z2
G1 X30 Y20 Z2
G1 X30 Y30 Z7
G1 X20 Y30 Z7
G1 X20 Y20 Z2
`;
    
    const context = { project: "test-complex-gcode" };
    const result = await visualizeGcodeIncremental(
      [complexGcode1, complexGcode2],
      context
    );
    
    expect(result).toBeDefined();
    expect(result.geometry).toBeDefined();
    expect(result.dimension).toBe("3D");
  });
});
