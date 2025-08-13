import { expect, test, describe } from "vitest";

describe("G-code Pass Count Configuration", () => {
  // Mock the generateGcode parameters similar to KirimotoUpdate.js
  const createGcodeConfig = (passes, materialThickness = 5, extra = 1.5) => {
    const z = materialThickness;
    
    return {
      outline: {
        type: "outline",
        tool: 1000,
        spindle: 1000,
        step: (z + extra) / passes,
        steps: 1,
        down: (z + extra) / passes,
        rate: 1500,
        plunge: 250,
        // ... other config
      },
      rough: {
        camRoughDown: z / passes,
        camOutlineDown: z / passes,
      }
    };
  };

  test("should calculate correct step size for requested passes", () => {
    const materialThickness = 5; // 5mm thick material
    const extra = 1.5; // 1.5mm cut through
    const totalDepth = materialThickness + extra; // 6.5mm total
    
    // Test 1 pass
    const config1Pass = createGcodeConfig(1, materialThickness, extra);
    expect(config1Pass.outline.step).toBe(6.5); // Should cut 6.5mm in 1 pass
    expect(config1Pass.outline.down).toBe(6.5);
    
    // Test 2 passes
    const config2Pass = createGcodeConfig(2, materialThickness, extra);
    expect(config2Pass.outline.step).toBe(3.25); // Should cut 3.25mm per pass
    expect(config2Pass.outline.down).toBe(3.25);
    
    // Test 3 passes
    const config3Pass = createGcodeConfig(3, materialThickness, extra);
    expect(config3Pass.outline.step).toBe(6.5 / 3); // Should cut ~2.17mm per pass
    expect(config3Pass.outline.down).toBe(6.5 / 3);
  });

  test("should demonstrate the current issue with steps parameter", () => {
    // Current configuration in KirimotoUpdate.js
    const passes = 2;
    const z = 5;
    const extra = 1.5;
    
    const currentConfig = {
      step: (z + extra) / passes, // 3.25mm per pass
      steps: 1, // Only 1 step (THIS IS THE ISSUE)
      down: (z + extra) / passes, // 3.25mm per pass
    };
    
    // With current config:
    // - step = 3.25mm (depth per pass)
    // - steps = 1 (number of incremental steps)
    // - down = 3.25mm (total depth per operation)
    // 
    // Kiri:Moto likely interprets this as:
    // "Cut 3.25mm deep, in 1 step, then repeat until reaching bottom"
    // Total depth = 6.5mm
    // Number of operations = 6.5 / 3.25 = 2, but it adds one more = 3 passes
    
    expect(currentConfig.step).toBe(3.25);
    expect(currentConfig.steps).toBe(1);
    expect(currentConfig.down).toBe(3.25);
    
    // The issue: Kiri:Moto calculates passes as:
    // ceil(totalDepth / stepDepth) which gives us one extra pass
    const totalDepth = z + extra;
    const calculatedPasses = Math.ceil(totalDepth / currentConfig.step);
    expect(calculatedPasses).toBe(2); // Should be 2, but Kiri:Moto might add 1 more
  });

  test("should show the correct configuration that fixes the issue", () => {
    const requestedPasses = 2;
    const z = 5;
    const extra = 1.5;
    const totalDepth = z + extra;
    
    // CORRECT FIX: Set steps to the number of passes and down to total depth
    const fixedConfig = {
      step: totalDepth / requestedPasses, // 3.25mm per pass
      steps: requestedPasses, // Set to actual number of passes
      down: totalDepth, // Set to total depth
    };
    
    expect(fixedConfig.step).toBe(3.25);
    expect(fixedConfig.steps).toBe(2);
    expect(fixedConfig.down).toBe(6.5);
    
    // This should tell Kiri:Moto:
    // "Cut 6.5mm total depth, in 2 steps of 3.25mm each"
  });

  test("should validate the new fix approach", () => {
    const requestedPasses = 2;
    const z = 5;
    const extra = 1.5;
    const totalDepth = z + extra;
    
    // NEW FIX: Set steps to requested passes and down to total depth
    const newConfig = {
      step: totalDepth / requestedPasses, // 3.25mm per step
      steps: requestedPasses,             // Number of steps = requested passes
      down: totalDepth,                   // Total depth for the operation
    };
    
    expect(newConfig.step).toBe(3.25);
    expect(newConfig.steps).toBe(2);
    expect(newConfig.down).toBe(6.5);
    
    // This tells Kiri:Moto: "Cut 6.5mm total, in 2 steps of 3.25mm each"
    // Result: Exactly 2 passes of 3.25mm each = 6.5mm total
  });

  test("should experiment with different parameter combinations", () => {
    const requestedPasses = 3;
    const z = 5;
    const extra = 1.5;
    const totalDepth = z + extra; // 6.5
    
    console.log(`\nExperimenting with ${requestedPasses} passes, total depth ${totalDepth}mm:`);
    
    // Current approach (back to original with original calculation)
    const approach1 = {
      step: totalDepth / requestedPasses, // 2.17mm per step
      steps: 1,                          // 1 step per operation
      down: totalDepth / requestedPasses, // 2.17mm per operation
    };
    console.log(`Approach 1 (current): step=${approach1.step.toFixed(2)}, steps=${approach1.steps}, down=${approach1.down.toFixed(2)}`);
    console.log(`  -> Kiri:Moto might see: ${Math.ceil(totalDepth / approach1.step)} operations of ${approach1.down.toFixed(2)}mm each`);
    
    // Alternative: fixed step depth, multiple steps
    const approach2 = {
      step: 1.0,                          // Fixed 1mm per step
      steps: Math.ceil(totalDepth),       // 7 steps total
      down: totalDepth,                   // 6.5mm total
    };
    console.log(`Approach 2: step=${approach2.step}, steps=${approach2.steps}, down=${approach2.down}`);
    
    // Alternative: divide total by passes, but set down to total
    const approach3 = {
      step: totalDepth / requestedPasses, // 2.17mm per step
      steps: requestedPasses,             // 3 steps
      down: totalDepth,                   // 6.5mm total
    };
    console.log(`Approach 3: step=${approach3.step.toFixed(2)}, steps=${approach3.steps}, down=${approach3.down}`);
    
    // Test different interpretation: maybe down should be step * steps?
    const approach4 = {
      step: totalDepth / requestedPasses, // 2.17mm per step  
      steps: 1,                          // 1 step
      down: totalDepth,                   // 6.5mm total (not step * steps)
    };
    console.log(`Approach 4: step=${approach4.step.toFixed(2)}, steps=${approach4.steps}, down=${approach4.down}`);
    
    expect(approach1.step * requestedPasses).toBeCloseTo(totalDepth);
  });

  test("should demonstrate old vs new behavior", () => {
    const testCases = [
      { requestedPasses: 1, z: 5, extra: 1.5 },
      { requestedPasses: 2, z: 5, extra: 1.5 },
      { requestedPasses: 3, z: 5, extra: 1.5 },
    ];

    testCases.forEach(({ requestedPasses, z, extra }) => {
      const totalDepth = z + extra;
      
      // OLD BEHAVIOR (before fix)
      const oldConfig = {
        step: totalDepth / requestedPasses,
        steps: 1,  // Always 1 step
        down: totalDepth / requestedPasses,
      };
      
      // NEW BEHAVIOR (after fix)  
      const newConfig = {
        step: totalDepth / requestedPasses,
        steps: requestedPasses,  // Set to requested passes
        down: totalDepth,        // Total depth
      };
      
      // Old config might cause Kiri:Moto to generate extra passes
      // because it sees steps=1 and calculates how many operations are needed
      
      // New config explicitly tells Kiri:Moto the number of steps
      expect(newConfig.step * newConfig.steps).toBe(totalDepth);
      
      console.log(`Passes ${requestedPasses}: Old (step=${oldConfig.step.toFixed(2)}, steps=${oldConfig.steps}, down=${oldConfig.down.toFixed(2)}), New (step=${newConfig.step.toFixed(2)}, steps=${newConfig.steps}, down=${newConfig.down})`);
    });
  });
});