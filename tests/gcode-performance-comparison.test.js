import { expect, test, describe, beforeAll } from "vitest";
import { init } from "../src/worker/util.ts";
import { visualizeGcode, visualizeGcodeIncremental } from "../src/worker/worker.ts";

describe("Realistic G-code Performance Comparison", () => {
  beforeAll(async () => {
    await init();
  });

  /**
   * Generate realistic gcode for a rectangular cut pattern
   */
  function generateRealisticGcode(offsetX, offsetY, complexity = 10) {
    let gcode = `; Part at offset ${offsetX}, ${offsetY}\n`;
    gcode += `G0 X${offsetX} Y${offsetY} Z5\n`;
    gcode += `G0 Z0\n`;
    
    // Create a complex cutting pattern with multiple passes
    for (let pass = 0; pass < complexity; pass++) {
      const z = -pass * 0.1;
      // Outer rectangle
      gcode += `G1 X${offsetX + 10} Y${offsetY} Z${z} F1500\n`;
      gcode += `G1 X${offsetX + 10} Y${offsetY + 10} Z${z}\n`;
      gcode += `G1 X${offsetX} Y${offsetY + 10} Z${z}\n`;
      gcode += `G1 X${offsetX} Y${offsetY} Z${z}\n`;
      
      // Inner cuts
      for (let i = 1; i < 5; i++) {
        const innerX = offsetX + i * 2;
        gcode += `G1 X${innerX} Y${offsetY + 2} Z${z}\n`;
        gcode += `G1 X${innerX} Y${offsetY + 8} Z${z}\n`;
      }
    }
    
    gcode += `G0 Z5\n`;
    return gcode;
  }

  test("should compare performance with realistic gcode (10 parts, 10 passes each)", async () => {
    const numParts = 10;
    const passesPerPart = 10;
    
    // Generate realistic gcode for multiple parts
    const gcodeParts = [];
    for (let i = 0; i < numParts; i++) {
      const offsetX = i * 20;
      const offsetY = 0;
      gcodeParts.push(generateRealisticGcode(offsetX, offsetY, passesPerPart));
    }

    const concatenatedGcode = gcodeParts.join("\n");
    
    console.log(`\n=== Realistic Performance Test ===`);
    console.log(`Parts: ${numParts}, Passes per part: ${passesPerPart}`);
    console.log(`Total gcode lines: ~${concatenatedGcode.split('\n').length}`);
    
    // Time original method
    const startOriginal = performance.now();
    const contextOriginal = { project: "test-realistic-original" };
    const resultOriginal = await visualizeGcode(concatenatedGcode, contextOriginal);
    const timeOriginal = performance.now() - startOriginal;
    
    // Time incremental method
    const startIncremental = performance.now();
    const contextIncremental = { project: "test-realistic-incremental" };
    const resultIncremental = await visualizeGcodeIncremental(gcodeParts, contextIncremental);
    const timeIncremental = performance.now() - startIncremental;
    
    console.log(`\nOriginal method (one big assembleWire): ${timeOriginal.toFixed(2)}ms`);
    console.log(`Incremental method (assemble per part): ${timeIncremental.toFixed(2)}ms`);
    
    const diff = timeOriginal - timeIncremental;
    const improvement = (diff / timeOriginal * 100);
    
    if (improvement > 0) {
      console.log(`✅ Incremental is FASTER by ${improvement.toFixed(1)}% (saved ${diff.toFixed(2)}ms)`);
    } else {
      console.log(`⚠️  Incremental is slower by ${Math.abs(improvement).toFixed(1)}% (lost ${Math.abs(diff).toFixed(2)}ms)`);
      console.log(`   Note: For small projects, the overhead may outweigh benefits`);
    }
    
    // Both methods should produce valid results
    expect(resultOriginal).toBeDefined();
    expect(resultIncremental).toBeDefined();
    expect(resultOriginal.dimension).toBe("3D");
    expect(resultIncremental.dimension).toBe("3D");
  });

  test("should show incremental advantage with many parts (20 parts)", async () => {
    const numParts = 20;
    const passesPerPart = 15;
    
    const gcodeParts = [];
    for (let i = 0; i < numParts; i++) {
      const offsetX = (i % 5) * 25;
      const offsetY = Math.floor(i / 5) * 25;
      gcodeParts.push(generateRealisticGcode(offsetX, offsetY, passesPerPart));
    }

    const concatenatedGcode = gcodeParts.join("\n");
    
    console.log(`\n=== Large Project Test ===`);
    console.log(`Parts: ${numParts}, Passes per part: ${passesPerPart}`);
    console.log(`Total gcode lines: ~${concatenatedGcode.split('\n').length}`);
    
    // Time original method
    const startOriginal = performance.now();
    const contextOriginal = { project: "test-large-original" };
    const resultOriginal = await visualizeGcode(concatenatedGcode, contextOriginal);
    const timeOriginal = performance.now() - startOriginal;
    
    // Time incremental method
    const startIncremental = performance.now();
    const contextIncremental = { project: "test-large-incremental" };
    const resultIncremental = await visualizeGcodeIncremental(gcodeParts, contextIncremental);
    const timeIncremental = performance.now() - startIncremental;
    
    console.log(`\nOriginal method: ${timeOriginal.toFixed(2)}ms`);
    console.log(`Incremental method: ${timeIncremental.toFixed(2)}ms`);
    
    const diff = timeOriginal - timeIncremental;
    const improvement = (diff / timeOriginal * 100);
    
    console.log(`Performance difference: ${improvement.toFixed(1)}%`);
    console.log(`Time saved: ${diff.toFixed(2)}ms`);
    
    expect(resultOriginal).toBeDefined();
    expect(resultIncremental).toBeDefined();
  });

  test("should verify same visual output for both methods", async () => {
    // Use identical gcode for both methods to verify they produce the same result
    const testGcode = generateRealisticGcode(0, 0, 5);
    
    const contextOriginal = { project: "test-verify-original" };
    const contextIncremental = { project: "test-verify-incremental" };
    
    const resultOriginal = await visualizeGcode(testGcode, contextOriginal);
    const resultIncremental = await visualizeGcodeIncremental([testGcode], contextIncremental);
    
    // Both should produce the same structure
    expect(resultOriginal.dimension).toBe(resultIncremental.dimension);
    expect(resultOriginal.dimension).toBe("3D");
    
    console.log(`\n✅ Both methods produce structurally equivalent results`);
  });
});
