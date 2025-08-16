import { expect, test, describe } from "vitest";

describe("G-code Interior-First Cutting Order", () => {
  // Mock the operation generation logic from KirimotoUpdate.js
  const generateOperations = (passes, z, extra, speed) => {
    const operations = [];
    const totalDepth = z + extra;
    const depthPerPass = totalDepth / passes;
    
    // Create two operations for each pass: interior cuts first, then exterior cuts
    for (let i = 1; i <= passes; i++) {
      const currentDepth = depthPerPass * i;
      
      // First operation: Cut interior shapes (inside cuts)
      operations.push({
        type: "outline",
        tool: 1000,
        spindle: 1000,
        step: depthPerPass,           // Depth for this specific pass
        steps: 1,                     // Single step per operation
        down: currentDepth,           // Depth for this pass
        rate: speed,
        plunge: 250,
        dogbones: true,
        omitvoid: false,
        omitthru: false,
        outside: false,               // Do NOT cut outside edges
        inside: true,                 // Cut inside/interior shapes first
        wide: false,
        top: true,
        ov_topz: 0,
        ov_botz: 0,
        ov_conv: false,
      });
      
      // Second operation: Cut exterior shapes (outside cuts)
      operations.push({
        type: "outline",
        tool: 1000,
        spindle: 1000,
        step: depthPerPass,           // Depth for this specific pass
        steps: 1,                     // Single step per operation
        down: currentDepth,           // Depth for this pass
        rate: speed,
        plunge: 250,
        dogbones: true,
        omitvoid: false,
        omitthru: false,
        outside: true,                // Cut outside edges after interior
        inside: false,                // Do NOT cut inside shapes in this operation
        wide: false,
        top: true,
        ov_topz: 0,
        ov_botz: 0,
        ov_conv: false,
      });
    }
    
    // Add separator
    operations.push({
      type: "|",
    });
    
    return operations;
  };

  test("should generate interior-first cutting operations for single pass", () => {
    const operations = generateOperations(1, 5, 1.5, 1500);
    
    // Should have 2 cutting operations + 1 separator = 3 total
    expect(operations.length).toBe(3);
    
    // First operation should be interior cut
    const firstOp = operations[0];
    expect(firstOp.inside).toBe(true);
    expect(firstOp.outside).toBe(false);
    expect(firstOp.down).toBe(6.5); // 5 + 1.5
    
    // Second operation should be exterior cut
    const secondOp = operations[1];
    expect(secondOp.inside).toBe(false);
    expect(secondOp.outside).toBe(true);
    expect(secondOp.down).toBe(6.5); // Same depth as interior
    
    // Third should be separator
    expect(operations[2].type).toBe("|");
  });

  test("should generate interior-first cutting operations for multiple passes", () => {
    const operations = generateOperations(3, 5, 1.5, 1500);
    
    // Should have 6 cutting operations (3 passes × 2 ops) + 1 separator = 7 total
    expect(operations.length).toBe(7);
    
    const totalDepth = 6.5;
    const depthPerPass = totalDepth / 3;
    
    // Check each pass has interior first, then exterior
    for (let i = 0; i < 3; i++) {
      const expectedDepth = depthPerPass * (i + 1);
      
      // Interior operation (even indices: 0, 2, 4)
      const interiorOp = operations[i * 2];
      expect(interiorOp.inside).toBe(true);
      expect(interiorOp.outside).toBe(false);
      expect(interiorOp.down).toBeCloseTo(expectedDepth);
      
      // Exterior operation (odd indices: 1, 3, 5)
      const exteriorOp = operations[i * 2 + 1];
      expect(exteriorOp.inside).toBe(false);
      expect(exteriorOp.outside).toBe(true);
      expect(exteriorOp.down).toBeCloseTo(expectedDepth);
    }
    
    // Last should be separator
    expect(operations[6].type).toBe("|");
  });

  test("should maintain correct cutting sequence depth progression", () => {
    const operations = generateOperations(2, 5, 1.5, 1500);
    
    // Should have 4 cutting operations + 1 separator = 5 total
    expect(operations.length).toBe(5);
    
    const expectedDepths = [3.25, 3.25, 6.5, 6.5]; // Pass 1: interior+exterior at 3.25, Pass 2: interior+exterior at 6.5
    
    for (let i = 0; i < 4; i++) {
      expect(operations[i].down).toBeCloseTo(expectedDepths[i]);
      // Verify alternating interior/exterior pattern
      if (i % 2 === 0) {
        // Even indices should be interior cuts
        expect(operations[i].inside).toBe(true);
        expect(operations[i].outside).toBe(false);
      } else {
        // Odd indices should be exterior cuts
        expect(operations[i].inside).toBe(false);
        expect(operations[i].outside).toBe(true);
      }
    }
  });

  test("should demonstrate the cutting sequence advantage", () => {
    // This test documents the advantage of the new approach
    const operations = generateOperations(2, 5, 1.5, 1500);
    
    // Cutting sequence with new approach:
    // 1. Interior at depth 3.25mm (part still held by exterior material)
    // 2. Exterior at depth 3.25mm (part still connected via remaining material)
    // 3. Interior at depth 6.5mm (part still held by exterior material)
    // 4. Exterior at depth 6.5mm (final cut releases the part)
    
    const cuttingSequence = operations.filter(op => op.type === "outline").map((op, index) => ({
      step: index + 1,
      type: op.inside ? "Interior" : "Exterior",
      depth: op.down,
      secured: op.inside || (op.outside && op.down < 6.5), // Interior cuts are always secured, exterior cuts are secured until final depth
    }));
    
    expect(cuttingSequence).toEqual([
      { step: 1, type: "Interior", depth: 3.25, secured: true },
      { step: 2, type: "Exterior", depth: 3.25, secured: true },
      { step: 3, type: "Interior", depth: 6.5, secured: true },
      { step: 4, type: "Exterior", depth: 6.5, secured: false }, // Final cut
    ]);
    
    // Verify that all but the last cut keep the part secured
    const securedCuts = cuttingSequence.filter(cut => cut.secured);
    expect(securedCuts.length).toBe(3);
    
    // Verify only the last cut releases the part
    const releasingCuts = cuttingSequence.filter(cut => !cut.secured);
    expect(releasingCuts.length).toBe(1);
    expect(releasingCuts[0].step).toBe(4); // Last step
    expect(releasingCuts[0].type).toBe("Exterior"); // Exterior cut
  });

  test("should have consistent operation parameters between interior and exterior cuts", () => {
    const operations = generateOperations(2, 5, 1.5, 1500);
    
    // Get pairs of interior/exterior operations at the same depth
    const pairs = [];
    for (let i = 0; i < operations.length - 1; i += 2) {
      if (operations[i].type === "outline" && operations[i + 1].type === "outline") {
        pairs.push([operations[i], operations[i + 1]]);
      }
    }
    
    pairs.forEach(([interior, exterior]) => {
      // Both operations should have the same depth parameters
      expect(interior.down).toBe(exterior.down);
      expect(interior.step).toBe(exterior.step);
      expect(interior.steps).toBe(exterior.steps);
      
      // Both should have the same tool and speed settings
      expect(interior.tool).toBe(exterior.tool);
      expect(interior.rate).toBe(exterior.rate);
      expect(interior.spindle).toBe(exterior.spindle);
      
      // But different inside/outside settings
      expect(interior.inside).toBe(true);
      expect(interior.outside).toBe(false);
      expect(exterior.inside).toBe(false);
      expect(exterior.outside).toBe(true);
    });
  });
});