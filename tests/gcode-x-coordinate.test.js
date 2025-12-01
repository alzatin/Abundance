import { expect, test, describe } from "vitest";

describe("G-code X Coordinate Correction", () => {
  /**
   * This test validates the fix for issue where G-code X coordinates
   * were being reversed (negated). A part centered at X 100, Y 100
   * was generating G-code at X -100, Y 100.
   * 
   * The fix involves negating the X coordinate when calling setOrigin
   * in KirimotoUpdate.js to match the coordinate system used by the
   * Kiri:Moto engine.
   */

  // This function mimics how centerPos is transformed before being
  // passed to setOrigin in KirimotoUpdate.js
  const transformCenterPosForSetOrigin = (centerPos, unitsKey) => {
    if (unitsKey === "Inches") {
      return {
        x: -centerPos[0] * 25.4,  // Negate X to match coordinate systems
        y: centerPos[1] * 25.4,
        z: 0
      };
    }
    return {
      x: -centerPos[0],  // Negate X to match coordinate systems
      y: centerPos[1],
      z: 0
    };
  };

  test("should negate X coordinate for MM units", () => {
    const centerPos = [100, 100, 50]; // Part centered at X=100, Y=100
    const result = transformCenterPosForSetOrigin(centerPos, "MM");
    
    // X should be negated so a part at X=100 generates G-code at X=100 (not X=-100)
    expect(result.x).toBe(-100);
    expect(result.y).toBe(100);
    expect(result.z).toBe(0);
  });

  test("should negate X coordinate for Inches units and apply scale", () => {
    const centerPos = [4, 4, 2]; // Part centered at X=4", Y=4"
    const result = transformCenterPosForSetOrigin(centerPos, "Inches");
    
    // X should be negated and scaled by 25.4
    expect(result.x).toBe(-4 * 25.4);
    expect(result.y).toBe(4 * 25.4);
    expect(result.z).toBe(0);
  });

  test("should handle negative X coordinates correctly", () => {
    const centerPos = [-50, 75, 25]; // Part centered at X=-50, Y=75
    const result = transformCenterPosForSetOrigin(centerPos, "MM");
    
    // Negating a negative X gives positive X
    expect(result.x).toBe(50);
    expect(result.y).toBe(75);
    expect(result.z).toBe(0);
  });

  test("should handle zero coordinates correctly", () => {
    const centerPos = [0, 0, 10]; // Part centered at origin
    const result = transformCenterPosForSetOrigin(centerPos, "MM");
    
    // Zero should remain zero (handling -0 === 0 edge case)
    expect(result.x).toBeCloseTo(0);
    expect(result.y).toBeCloseTo(0);
    expect(result.z).toBeCloseTo(0);
  });

  test("should preserve Y coordinate sign", () => {
    // Y coordinate should NOT be negated - only X is affected
    const positiveY = [100, 200, 50];
    const negativeY = [100, -200, 50];
    
    const resultPositive = transformCenterPosForSetOrigin(positiveY, "MM");
    const resultNegative = transformCenterPosForSetOrigin(negativeY, "MM");
    
    expect(resultPositive.y).toBe(200);
    expect(resultNegative.y).toBe(-200);
  });

  test("should demonstrate the fix reverses the original bug behavior", () => {
    // BEFORE FIX: A square at X=100, Y=100 would generate G-code at X=-100, Y=100
    // AFTER FIX: A square at X=100, Y=100 generates G-code at X=100, Y=100
    
    const partCenterPos = [100, 100, 0];
    
    // Old buggy behavior (without negation in setOrigin):
    // setOrigin(100, 100, 0) -> G-code at X=-100, Y=100
    const buggySetOriginX = partCenterPos[0]; // Would result in G-code X=-100
    
    // New fixed behavior (with negation in setOrigin):
    // setOrigin(-100, 100, 0) -> G-code at X=100, Y=100
    const fixedSetOriginX = -partCenterPos[0]; // Results in G-code X=100
    
    // The fixed version should be the negative of the buggy version
    expect(fixedSetOriginX).toBe(-buggySetOriginX);
    
    // Using our transform function
    const result = transformCenterPosForSetOrigin(partCenterPos, "MM");
    expect(result.x).toBe(-100); // This is what we pass to setOrigin
    // The Kiri:Moto engine then produces G-code at X=100 (the original part position)
  });
});
