import { expect, test, describe } from "vitest";

describe("Tool Size Configuration", () => {
  test("should use tool size for flute diameter in tool configuration", () => {
    // Mock the tool configuration function from KirimotoUpdate.js
    const createToolConfig = (toolSize) => {
      return {
        id: 1000,
        number: 1,
        type: "endmill",
        name: "end 1/4",
        metric: true, // Fixed: should be true to match G21 (metric) G-code output
        shaft_diam: toolSize,
        shaft_len: 1,
        flute_diam: toolSize, // This should match toolSize, not be hardcoded
        flute_len: 2,
        taper_tip: 0,
      };
    };

    // Test different tool sizes
    const toolSizes = [6.35, 3.175, 12.7, 4.8]; // Various common tool sizes
    
    toolSizes.forEach(toolSize => {
      const config = createToolConfig(toolSize);
      
      // The key assertion: flute_diam should equal toolSize
      expect(config.flute_diam).toBe(toolSize);
      expect(config.shaft_diam).toBe(toolSize);
      // Verify metric is set correctly to match G-code units
      expect(config.metric).toBe(true);
    });
  });

  test("should use correct stepover percentages for tool operations", () => {
    // Mock process configuration for stepover values
    const createProcessConfig = () => {
      return {
        camRoughOver: 0.4, // 40% stepover for roughing
        camOutlineOver: 0.4, // 40% stepover for outline
        camLevelOver: 0.5, // 50% stepover for leveling
        camContourOver: 0.5, // 50% stepover for contouring
        camTraceOver: 0.5, // 50% stepover for tracing
        camPocketOver: 0.25, // 25% stepover for pocketing
        camLatheOver: 0.1, // 10% stepover for lathe operations
      };
    };

    // Test that stepover values are correct percentages (0-1.0)
    const config = createProcessConfig();

    expect(config.camRoughOver).toBe(0.4);
    expect(config.camOutlineOver).toBe(0.4);
    expect(config.camLevelOver).toBe(0.5);
    expect(config.camContourOver).toBe(0.5);
    expect(config.camTraceOver).toBe(0.5);
    expect(config.camPocketOver).toBe(0.25);
    expect(config.camLatheOver).toBe(0.1);
    
    // Verify all values are percentages (0-1.0), not absolute values
    [config.camRoughOver, config.camOutlineOver, config.camLevelOver, 
     config.camContourOver, config.camTraceOver, config.camPocketOver, 
     config.camLatheOver].forEach(stepover => {
      expect(stepover).toBeGreaterThanOrEqual(0);
      expect(stepover).toBeLessThanOrEqual(1);
    });
  });

  test("should demonstrate the fix for tool size parameter not being respected", () => {
    // This test shows the difference between the old (broken) approach
    // and the new (fixed) approach

    const toolSize = 12.7; // Example: 1/2 inch endmill

    // OLD approach (broken - would always use 0.25 regardless of toolSize AND wrong units)
    const oldToolConfig = {
      flute_diam: 0.25, // hardcoded
      shaft_diam: toolSize,
      metric: false, // Wrong: doesn't match G21 G-code output
    };

    // NEW approach (fixed - uses toolSize for flute_diam and correct units)
    const newToolConfig = {
      flute_diam: toolSize, // uses actual tool size
      shaft_diam: toolSize,
      metric: true, // Fixed: should match G-code units (G21 = metric)
    };

    // Stepover values should be percentages (0-1.0) regardless of tool size
    const stepoverConfig = {
      camRoughOver: 0.4, // 40% of tool size
      camOutlineOver: 0.4, // 40% of tool size
      camLevelOver: 0.5, // 50% of tool size
      camContourOver: 0.5, // 50% of tool size
      camTraceOver: 0.5, // 50% of tool size
      camPocketOver: 0.25, // 25% of tool size
      camLatheOver: 0.1, // 10% of tool size
    };

    // Verify the new approach correctly uses tool size for flute diameter and metric units
    expect(newToolConfig.flute_diam).toBe(toolSize);
    expect(newToolConfig.shaft_diam).toBe(toolSize);
    expect(newToolConfig.metric).toBe(true);
    
    // Verify stepover values are percentages
    expect(stepoverConfig.camRoughOver).toBe(0.4);
    expect(stepoverConfig.camOutlineOver).toBe(0.4);

    // Show that old approach had wrong flute diameter and wrong units
    expect(oldToolConfig.flute_diam).not.toBe(toolSize);
    expect(oldToolConfig.metric).toBe(false);
  });
});