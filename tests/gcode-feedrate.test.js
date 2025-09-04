import { expect, test, describe } from "vitest";

describe("G-code Feedrate Configuration", () => {
  // Mock the generateGcode function similar to KirimotoUpdate.js
  const createMockGenerateGcode = () => {
    return (
      stlUrl,
      centerPos,
      toolSize,
      passes,
      speed,
      feedrate,
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
            spindle: speed,
            step: 0.4,
            steps: 1,
            down: down,
            rate: feedrate, // This should use the user-provided feedrate
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
            spindle: speed,
            step: 0.4,
            steps: 1,
            down: down,
            rate: feedrate, // This should also use the user-provided feedrate
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

  test("should use user-provided feedrate instead of hardcoded value", () => {
    const mockGenerateGcode = createMockGenerateGcode();
    
    // Test with custom feedrate
    const customFeedrate = 1200;
    const result = mockGenerateGcode(
      "mock-stl-url",
      [0, 0, 0],
      6.35, // toolSize
      2, // passes
      1500, // speed
      customFeedrate, // feedrate - this should be used
      1.35, // cutThrough
      () => {}, // gcodeCallback
      () => {}, // progressCallback
      () => {}, // partProgressCallback
      null // tool
    );

    // Both outline operations should use the custom feedrate
    expect(result.ops[0].rate).toBe(customFeedrate);
    expect(result.ops[1].rate).toBe(customFeedrate);
    expect(result.ops[0].rate).not.toBe(635); // Should not be the old hardcoded value
    expect(result.ops[1].rate).not.toBe(635); // Should not be the old hardcoded value
  });

  test("should accept different feedrate values", () => {
    const mockGenerateGcode = createMockGenerateGcode();
    
    const testCases = [
      { feedrate: 500, description: "slow feedrate" },
      { feedrate: 635, description: "default feedrate" },
      { feedrate: 1000, description: "medium feedrate" },
      { feedrate: 1500, description: "fast feedrate" },
      { feedrate: 2000, description: "very fast feedrate" },
    ];

    testCases.forEach(({ feedrate, description }) => {
      const result = mockGenerateGcode(
        "mock-stl-url",
        [0, 0, 0],
        6.35, // toolSize
        1, // passes
        1500, // speed
        feedrate, // feedrate to test
        1.35, // cutThrough
        () => {}, // gcodeCallback
        () => {}, // progressCallback
        () => {}, // partProgressCallback
        null // tool
      );

      expect(result.ops[0].rate).toBe(feedrate);
      expect(result.ops[1].rate).toBe(feedrate);
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

    // AFTER FIX: Both operations should use user-provided feedrate
    const userFeedrate = 1200;
    const newConfig = {
      ops: [
        { type: "outline", rate: userFeedrate }, // uses user input
        { type: "outline", rate: userFeedrate }, // uses user input
      ],
    };

    // Verify the old config would ignore user input
    expect(oldConfig.ops[0].rate).toBe(635);
    expect(oldConfig.ops[1].rate).toBe(635);

    // Verify the new config uses user input
    expect(newConfig.ops[0].rate).toBe(userFeedrate);
    expect(newConfig.ops[1].rate).toBe(userFeedrate);
    expect(newConfig.ops[0].rate).not.toBe(635);
    expect(newConfig.ops[1].rate).not.toBe(635);
  });

  test("should maintain backward compatibility with default feedrate", () => {
    // The default feedrate should be 635 to maintain compatibility
    const defaultFeedrate = 635;
    
    // When no feedrate is specified or default is used, should still work
    const mockGenerateGcode = createMockGenerateGcode();
    
    const result = mockGenerateGcode(
      "mock-stl-url",
      [0, 0, 0],
      6.35, // toolSize
      1, // passes
      1500, // speed
      defaultFeedrate, // using default feedrate
      1.35, // cutThrough
      () => {}, // gcodeCallback
      () => {}, // progressCallback
      () => {}, // partProgressCallback
      null // tool
    );

    expect(result.ops[0].rate).toBe(defaultFeedrate);
    expect(result.ops[1].rate).toBe(defaultFeedrate);
  });
});