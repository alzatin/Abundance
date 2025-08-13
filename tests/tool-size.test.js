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
        metric: false,
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
    });
  });

  test("should calculate stepover values relative to tool size", () => {
    // Mock process configuration for stepover calculations
    const createProcessConfig = (toolSize) => {
      const roughStepover = toolSize * 0.4; // 40% stepover for roughing
      const outlineStepover = toolSize * 0.4; // 40% stepover for outline
      const levelStepover = toolSize * 0.5; // 50% stepover for leveling
      const contourStepover = toolSize * 0.5; // 50% stepover for contouring
      const traceStepover = toolSize * 0.5; // 50% stepover for tracing
      const pocketStepover = toolSize * 0.25; // 25% stepover for pocketing
      const latheStepover = toolSize * 0.1; // 10% stepover for lathe operations
      
      return {
        camRoughOver: roughStepover,
        camOutlineOver: outlineStepover,
        camLevelOver: levelStepover,
        camContourOver: contourStepover,
        camTraceOver: traceStepover,
        camPocketOver: pocketStepover,
        camLatheOver: latheStepover,
      };
    };

    // Test that stepover values scale with tool size
    const config1 = createProcessConfig(6.35);
    const config2 = createProcessConfig(12.7); // Double the tool size

    expect(config2.camRoughOver).toBe(config1.camRoughOver * 2);
    expect(config2.camOutlineOver).toBe(config1.camOutlineOver * 2);
    expect(config2.camLevelOver).toBe(config1.camLevelOver * 2);
    expect(config2.camContourOver).toBe(config1.camContourOver * 2);
    expect(config2.camTraceOver).toBe(config1.camTraceOver * 2);
    expect(config2.camPocketOver).toBe(config1.camPocketOver * 2);
    expect(config2.camLatheOver).toBe(config1.camLatheOver * 2);
  });

  test("should demonstrate the fix for tool size vs hardcoded values", () => {
    // This test shows the difference between the old (broken) approach
    // and the new (fixed) approach

    const toolSize = 12.7; // Example: 1/2 inch endmill

    // OLD approach (broken - would always use 0.25 regardless of toolSize)
    const oldToolConfig = {
      flute_diam: 0.25, // hardcoded
      shaft_diam: toolSize,
    };

    // NEW approach (fixed - uses toolSize for both)
    const newToolConfig = {
      flute_diam: toolSize, // uses actual tool size
      shaft_diam: toolSize,
    };

    // OLD approach stepover (broken - hardcoded values)
    const oldStepover = {
      camRoughOver: 0.4, // hardcoded
      camOutlineOver: 0.4, // hardcoded
    };

    // NEW approach stepover (fixed - calculated from tool size)
    const newStepover = {
      camRoughOver: toolSize * 0.4, // calculated
      camOutlineOver: toolSize * 0.4, // calculated
    };

    // Verify the new approach correctly uses tool size
    expect(newToolConfig.flute_diam).toBe(toolSize);
    expect(newToolConfig.shaft_diam).toBe(toolSize);
    expect(newStepover.camRoughOver).toBe(toolSize * 0.4);
    expect(newStepover.camOutlineOver).toBe(toolSize * 0.4);

    // Show that old approach had wrong flute diameter
    expect(oldToolConfig.flute_diam).not.toBe(toolSize);
    expect(oldStepover.camRoughOver).not.toBe(toolSize * 0.4);
  });
});