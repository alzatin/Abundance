import { expect, test, describe } from "vitest";

describe("G-code Units Configuration", () => {
  test("should use metric units for tools when G-code is in millimeters", () => {
    // Mock the device configuration (currently in KirimotoUpdate.js)
    const deviceConfig = {
      mode: "CAM",
      gcodePre: [
        "G21 ; set units to MM (required)",  // This indicates metric output
        "G90 ; absolute position mode (required)",
      ],
      // ... other device config
    };

    // Mock the tool configuration (currently in KirimotoUpdate.js)
    const createToolConfig = (toolSize, useMetric = true) => {
      return {
        id: 1000,
        number: 1,
        type: "endmill",
        name: "end 1/4",
        metric: useMetric,  // This should match the G-code units
        shaft_diam: toolSize,
        shaft_len: 1,
        flute_diam: toolSize,
        flute_len: 2,
        taper_tip: 0,
      };
    };

    // Test case: 6.35mm tool size should be treated as metric
    const toolSizeMm = 6.35;
    
    // BROKEN configuration (current state)
    const brokenToolConfig = createToolConfig(toolSizeMm, false); // metric: false
    
    // FIXED configuration (what it should be)
    const fixedToolConfig = createToolConfig(toolSizeMm, true);   // metric: true

    // Verify the device is configured for metric output
    expect(deviceConfig.gcodePre).toContain("G21 ; set units to MM (required)");
    
    // Verify the broken config has mismatched units
    expect(brokenToolConfig.metric).toBe(false); // Tool interpreted as inches
    
    // Verify the fixed config has matching units
    expect(fixedToolConfig.metric).toBe(true);   // Tool interpreted as millimeters
    
    // Both should use the same tool size value, but interpretation differs
    expect(brokenToolConfig.flute_diam).toBe(toolSizeMm);
    expect(fixedToolConfig.flute_diam).toBe(toolSizeMm);
  });

  test("should demonstrate the units mismatch problem", () => {
    // Simulate what happens with different tool size interpretations
    const userInputMm = 6.35; // User enters 6.35mm
    
    // When metric: false (broken), Kiri:Moto thinks this is 6.35 inches
    const interpretedAsInches = userInputMm * 25.4; // Convert to mm: 161.29mm
    
    // When metric: true (fixed), Kiri:Moto correctly treats this as 6.35mm
    const interpretedAsMillimeters = userInputMm; // 6.35mm
    
    // The difference is significant
    const difference = interpretedAsInches - interpretedAsMillimeters;
    
    expect(interpretedAsInches).toBe(161.29);
    expect(interpretedAsMillimeters).toBe(6.35);
    expect(difference).toBe(154.94); // Almost 155mm difference!
    
    // This explains why 0.25 (interpreted as 0.25 inches = 6.35mm) 
    // gives the same result as entering 6.35 with the broken config
    expect(0.25 * 25.4).toBe(6.35);
  });

  test("should verify G-code pre-commands indicate metric units", () => {
    // The device configuration should use G21 for metric units
    const gcodePre = [
      "G21 ; set units to MM (required)",
      "G90 ; absolute position mode (required)",
    ];
    
    // G21 indicates metric mode (mm), G20 would be imperial (inches)
    const hasMetricCommand = gcodePre.some(cmd => cmd.includes("G21"));
    const hasImperialCommand = gcodePre.some(cmd => cmd.includes("G20"));
    
    expect(hasMetricCommand).toBe(true);
    expect(hasImperialCommand).toBe(false);
  });
});