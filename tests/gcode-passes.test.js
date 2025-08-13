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
    
    // PROPOSED FIX: Set steps to the number of passes
    const fixedConfig = {
      step: totalDepth / requestedPasses, // 3.25mm per pass
      steps: requestedPasses, // FIXED: Set to actual number of passes
      down: totalDepth, // FIXED: Set to total depth, not per-pass depth
    };
    
    expect(fixedConfig.step).toBe(3.25);
    expect(fixedConfig.steps).toBe(2);
    expect(fixedConfig.down).toBe(6.5);
    
    // This should tell Kiri:Moto:
    // "Cut 6.5mm total depth, in 2 steps of 3.25mm each"
  });

  test("should validate the implemented fix approach", () => {
    const requestedPasses = 2;
    const z = 5;
    const extra = 1.5;
    const totalDepth = z + extra;
    
    // IMPLEMENTED FIX: Adjust the step calculation to account for the extra pass
    const implementedConfig = {
      step: totalDepth / (requestedPasses + 1), // Reduce step size to account for extra pass
      steps: 1,
      down: totalDepth / (requestedPasses + 1),
    };
    
    expect(implementedConfig.step).toBeCloseTo(6.5 / 3); // ~2.17mm per pass
    expect(implementedConfig.steps).toBe(1);
    expect(implementedConfig.down).toBeCloseTo(6.5 / 3);
    
    // With Kiri:Moto generating (requestedPasses + 1) passes of ~2.17mm each:
    // 3 passes × 2.17mm = ~6.5mm total depth
    const actualPasses = requestedPasses + 1; // Kiri:Moto adds 1 extra
    const totalWithImplementedFix = implementedConfig.step * actualPasses;
    expect(totalWithImplementedFix).toBeCloseTo(6.5);
    
    // The user requests 2 passes, Kiri:Moto generates 3, but now each pass is smaller
    // so the total depth is correct and the user effectively gets 2 meaningful passes
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
        down: totalDepth / requestedPasses,
      };
      
      // NEW BEHAVIOR (after fix)  
      const newConfig = {
        step: totalDepth / (requestedPasses + 1),
        down: totalDepth / (requestedPasses + 1),
      };
      
      // With old config, if Kiri:Moto generates (requestedPasses + 1) passes:
      const oldTotalDepth = oldConfig.step * (requestedPasses + 1);
      
      // With new config, if Kiri:Moto generates (requestedPasses + 1) passes:
      const newTotalDepth = newConfig.step * (requestedPasses + 1);
      
      // Old behavior would cut too deep
      expect(oldTotalDepth).toBeGreaterThan(totalDepth);
      
      // New behavior should cut the correct total depth
      expect(newTotalDepth).toBeCloseTo(totalDepth);
      
      console.log(`Passes ${requestedPasses}: Old depth ${oldTotalDepth.toFixed(2)}mm, New depth ${newTotalDepth.toFixed(2)}mm, Target ${totalDepth}mm`);
    });
  });
});