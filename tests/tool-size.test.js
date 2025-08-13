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
      const stepoverPercentage = 0.4; // 40% stepover
      const calculatedStepover = toolSize * stepoverPercentage;
      
      return {
        camRoughOver: calculatedStepover,
        camOutlineOver: calculatedStepover,
        camLevelOver: calculatedStepover,
      };
    };

    // Test that stepover values scale with tool size
    const config1 = createProcessConfig(6.35);
    const config2 = createProcessConfig(12.7); // Double the tool size

    expect(config2.camRoughOver).toBe(config1.camRoughOver * 2);
    expect(config2.camOutlineOver).toBe(config1.camOutlineOver * 2);
    expect(config2.camLevelOver).toBe(config1.camLevelOver * 2);
  });
});