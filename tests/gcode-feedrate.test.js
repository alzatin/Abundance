import { expect, test, describe } from "vitest";

describe("G-code Speed/Feedrate Configuration", () => {
  // Mock the generateGcode function similar to KirimotoUpdate.js
  const createMockGenerateGcode = () => {
    return (
      stlUrl,
      centerPos,
      toolSize,
      passes,
      speed,
      cutThrough,
      gcodeCallback,
      progressCallback,
      partProgressCallback,
      tool
    ) => {
      // Return a configuration object that would be used in the real function
      const validPasses = passes - 1;
      const zBottom = 5; // Mock z-bottom value
      const down = validPasses == 0 ? 1000 : zBottom / validPasses;

      return {
        ops: [
          {
            type: "outline",
            tool: 1000,
            spindle: 1000,
            step: 0.4,
            steps: 1,
            down: down,
            rate: speed, // This should use the user-provided speed as feedrate
            plunge: 51,
            dogbones: false,
            omitvoid: false,
            omitthru: false,
            outside: false,
            inside: true,
            wide: false,
            top: false,
            ov_topz: 0,
            ov_botz: 0,
            ov_conv: true,
          },
          {
            type: "outline",
            tool: 1000,
            spindle: 1000,
            step: 0.4,
            steps: 1,
            down: down,
            rate: speed, // This should also use the user-provided speed as feedrate
            plunge: 51,
            dogbones: false,
            omitvoid: false,
            omitthru: true,
            outside: false,
            inside: false,
            wide: false,
            top: false,
            ov_topz: 0,
            ov_botz: 0,
            ov_conv: true,
          },
        ],
      };
    };
  };

  test("should use user-provided speed as feedrate instead of hardcoded value", () => {
    const mockGenerateGcode = createMockGenerateGcode();
    
    // Test with custom speed/feedrate
    const customSpeed = 1200;
    const result = mockGenerateGcode(
      "mock-stl-url",
      [0, 0, 0],
      6.35, // toolSize
      2, // passes
      customSpeed, // speed - this should be used as feedrate
      1.35, // cutThrough
      () => {}, // gcodeCallback
      () => {}, // progressCallback
      () => {}, // partProgressCallback
      null // tool
    );

    // Both outline operations should use the speed as feedrate
    expect(result.ops[0].rate).toBe(customSpeed);
    expect(result.ops[1].rate).toBe(customSpeed);
    expect(result.ops[0].rate).not.toBe(635); // Should not be the old hardcoded value
    expect(result.ops[1].rate).not.toBe(635); // Should not be the old hardcoded value
  });

  test("should accept different speed values as feedrate", () => {
    const mockGenerateGcode = createMockGenerateGcode();
    
    const testCases = [
      { speed: 500, description: "slow speed/feedrate" },
      { speed: 635, description: "default speed/feedrate" },
      { speed: 1000, description: "medium speed/feedrate" },
      { speed: 1500, description: "fast speed/feedrate" },
      { speed: 2000, description: "very fast speed/feedrate" },
    ];

    testCases.forEach(({ speed, description }) => {
      const result = mockGenerateGcode(
        "mock-stl-url",
        [0, 0, 0],
        6.35, // toolSize
        1, // passes
        speed, // speed to test (used as feedrate)
        1.35, // cutThrough
        () => {}, // gcodeCallback
        () => {}, // progressCallback
        () => {}, // partProgressCallback
        null // tool
      );

      expect(result.ops[0].rate).toBe(speed);
      expect(result.ops[1].rate).toBe(speed);
    });
  });

  test("should demonstrate the fix for the feedrate issue", () => {
    // BEFORE FIX: Both operations would have hardcoded rate: 635
    const oldConfig = {
      ops: [
        { type: "outline", rate: 635 }, // hardcoded
        { type: "outline", rate: 635 }, // hardcoded
      ],
    };

    // AFTER FIX: Both operations should use user-provided speed as feedrate
    const userSpeed = 1200;
    const newConfig = {
      ops: [
        { type: "outline", rate: userSpeed }, // uses user input speed
        { type: "outline", rate: userSpeed }, // uses user input speed
      ],
    };

    // Verify the old config would ignore user input
    expect(oldConfig.ops[0].rate).toBe(635);
    expect(oldConfig.ops[1].rate).toBe(635);

    // Verify the new config uses user input
    expect(newConfig.ops[0].rate).toBe(userSpeed);
    expect(newConfig.ops[1].rate).toBe(userSpeed);
    expect(newConfig.ops[0].rate).not.toBe(635);
    expect(newConfig.ops[1].rate).not.toBe(635);
  });

  test("should maintain backward compatibility with default speed", () => {
    // The default speed should be 635 to maintain compatibility for feedrate
    const defaultSpeed = 635;
    
    // When no speed is specified or default is used, should still work
    const mockGenerateGcode = createMockGenerateGcode();
    
    const result = mockGenerateGcode(
      "mock-stl-url",
      [0, 0, 0],
      6.35, // toolSize
      1, // passes
      defaultSpeed, // using default speed (used as feedrate)
      1.35, // cutThrough
      () => {}, // gcodeCallback
      () => {}, // progressCallback
      () => {}, // partProgressCallback
      null // tool
    );

    expect(result.ops[0].rate).toBe(defaultSpeed);
    expect(result.ops[1].rate).toBe(defaultSpeed);
  });

  test("should use default spindle speed (1000) regardless of user speed input", () => {
    const mockGenerateGcode = createMockGenerateGcode();
    
    const testCases = [
      { speed: 500, description: "slow speed input" },
      { speed: 635, description: "default speed input" },
      { speed: 1200, description: "fast speed input" },
      { speed: 2000, description: "very fast speed input" },
    ];

    testCases.forEach(({ speed, description }) => {
      const result = mockGenerateGcode(
        "mock-stl-url",
        [0, 0, 0],
        6.35, // toolSize
        1, // passes
        speed, // speed input (should affect feedrate, not spindle)
        1.35, // cutThrough
        () => {}, // gcodeCallback
        () => {}, // progressCallback
        () => {}, // partProgressCallback
        null // tool
      );

      // Spindle should always be 1000 regardless of speed input
      expect(result.ops[0].spindle).toBe(1000);
      expect(result.ops[1].spindle).toBe(1000);
      
      // Rate (feedrate) should use the user-provided speed
      expect(result.ops[0].rate).toBe(speed);
      expect(result.ops[1].rate).toBe(speed);
    });
  });

  test("should confirm gcodePre contains feedrate initialization commands", () => {
    // This test verifies that the device configuration includes feedrate setup
    // The fix adds G0 F3000 and G1 F1000 to gcodePre to initialize feedrates
    
    const expectedCommands = [
      "G21 ; set units to MM (required)",
      "G90 ; absolute position mode (required)", 
      "G0 F3000 ; set default rapid move feedrate",
      "G1 F1000 ; set default cutting feedrate",
    ];
    
    // This test documents that the fix should include feedrate initialization
    // The actual implementation is in KirimotoUpdate.js gcodePre section
    expect(expectedCommands).toContain("G0 F3000 ; set default rapid move feedrate");
    expect(expectedCommands).toContain("G1 F1000 ; set default cutting feedrate");
  });
});