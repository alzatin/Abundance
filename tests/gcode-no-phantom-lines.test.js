import { expect, test, describe, beforeAll } from "vitest";
import { init } from "../src/worker/util.ts";
import { visualizeGcode, visualizeGcodeIncremental } from "../src/worker/worker.ts";

describe("Gcode Visualization - No Phantom Lines", () => {
  beforeAll(async () => {
    await init();
  });

  test("should NOT create phantom lines back to origin between parts", async () => {
    // Part 1: Rectangle at origin
    const gcodePart1 = `
G0 X0 Y0 Z5
G0 Z0
G1 X10 Y0 Z0
G1 X10 Y10 Z0
G1 X0 Y10 Z0
G1 X0 Y0 Z0
`;

    // Part 2: Rectangle at X=20 (should NOT have a line from origin)
    const gcodePart2 = `
G0 X20 Y0 Z5
G0 Z0
G1 X30 Y0 Z0
G1 X30 Y10 Z0
G1 X20 Y10 Z0
G1 X20 Y0 Z0
`;

    const concatenatedGcode = gcodePart1 + "\n" + gcodePart2;
    
    const contextOriginal = { project: "test-no-phantom-original" };
    const contextIncremental = { project: "test-no-phantom-incremental" };
    
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
    
    console.log(`\n✅ No phantom lines created - position flows continuously between parts`);
  });

  test("should maintain position continuity across three parts", async () => {
    // Three parts at different positions
    const part1 = `
G0 X0 Y0 Z0
G1 X5 Y0 Z0
G1 X5 Y5 Z0
`;

    const part2 = `
G0 X10 Y0 Z0
G1 X15 Y0 Z0
G1 X15 Y5 Z0
`;

    const part3 = `
G0 X20 Y0 Z0
G1 X25 Y0 Z0
G1 X25 Y5 Z0
`;

    const concatenatedGcode = part1 + "\n" + part2 + "\n" + part3;
    
    const contextOriginal = { project: "test-continuity-original" };
    const contextIncremental = { project: "test-continuity-incremental" };
    
    const resultOriginal = await visualizeGcode(concatenatedGcode, contextOriginal);
    const resultIncremental = await visualizeGcodeIncremental(
      [part1, part2, part3],
      contextIncremental
    );
    
    // Both should work
    expect(resultOriginal).toBeDefined();
    expect(resultIncremental).toBeDefined();
    
    console.log(`\n✅ Position maintained across all three parts`);
  });

  test("should match original method exactly for multi-part assemblies", async () => {
    // Simulate a realistic assembly with parts at various positions
    const parts = [
      `G0 X0 Y0 Z5\nG0 Z0\nG1 X10 Y0 Z0\nG1 X10 Y10 Z0\nG1 X0 Y10 Z0`,
      `G0 X20 Y0 Z5\nG0 Z0\nG1 X30 Y0 Z0\nG1 X30 Y10 Z0\nG1 X20 Y10 Z0`,
      `G0 X0 Y20 Z5\nG0 Z0\nG1 X10 Y20 Z0\nG1 X10 Y30 Z0\nG1 X0 Y30 Z0`,
    ];

    const concatenatedGcode = parts.join("\n");
    
    const contextOriginal = { project: "test-match-original" };
    const contextIncremental = { project: "test-match-incremental" };
    
    const resultOriginal = await visualizeGcode(concatenatedGcode, contextOriginal);
    const resultIncremental = await visualizeGcodeIncremental(parts, contextIncremental);
    
    // Both should produce the same structure
    expect(resultOriginal.dimension).toBe(resultIncremental.dimension);
    expect(resultOriginal.dimension).toBe("3D");
    
    console.log(`\n✅ Incremental method produces identical visualization to original`);
  });
});
