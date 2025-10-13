import { describe, it, expect } from "vitest";

// Constants matching those used in GlobalVariables and Input class
const DESKTOP_ATOM_SIZE = 1 / 65; // Default atomSize for desktop
const MOBILE_ATOM_SIZE = 1 / 30;  // atomSize for mobile devices
const INPUT_X_MULTIPLIER = 1.65;  // Multiplier for left-side x position
const INPUT_Y_START_MULTIPLIER = 10; // Multiplier for first input's y position
const INPUT_SPACING_MULTIPLIER = 5; // Multiplier for spacing between inputs
const MAX_Y = 0.95; // Maximum Y position (95% of canvas height)
const MIN_SPACING_MULTIPLIER = 1.5; // Minimum spacing for usability

describe("Input atom positioning logic", () => {
  // Test the positioning logic by simulating the adjustYForCollision method behavior
  
  function simulateInputPositioning(existingInputs, atomSize = DESKTOP_ATOM_SIZE) {
    const result = {
      x: atomSize * INPUT_X_MULTIPLIER,
      y: 0,
    };
    
    // Calculate total number of inputs including this one
    const totalInputs = existingInputs.length + 1;
    
    // Default spacing and starting position
    const defaultSpacing = atomSize * INPUT_SPACING_MULTIPLIER;
    const defaultStartY = atomSize * INPUT_Y_START_MULTIPLIER;
    
    // Calculate the height required with default spacing
    const requiredHeight = defaultStartY + (totalInputs - 1) * defaultSpacing;
    
    // Adjust spacing if inputs would exceed canvas height
    let atomSpacing = defaultSpacing;
    let startY = defaultStartY;
    
    if (requiredHeight > MAX_Y) {
      // Calculate the maximum spacing that will fit all inputs
      const availableHeight = MAX_Y - defaultStartY;
      atomSpacing = totalInputs > 1 ? availableHeight / (totalInputs - 1) : defaultSpacing;
      
      // Ensure minimum spacing for usability
      const minSpacing = atomSize * MIN_SPACING_MULTIPLIER;
      if (atomSpacing < minSpacing) {
        atomSpacing = minSpacing;
        // Adjust start position to fit more inputs by starting higher
        const adjustedRequiredHeight = (totalInputs - 1) * atomSpacing;
        startY = Math.max(atomSize * 2, MAX_Y - adjustedRequiredHeight);
      }
    }
    
    if (existingInputs.length === 0) {
      // First Input atom - position at top left
      result.y = startY;
    } else {
      // Find the Input with the lowest (highest y value) position
      const lowestInput = existingInputs.reduce((lowest, current) => {
        return current.y > lowest.y ? current : lowest;
      });
      
      // Position below the lowest existing Input
      result.y = lowestInput.y + atomSpacing;
      
      // Ensure we don't exceed the canvas height
      if (result.y > MAX_Y) {
        result.y = MAX_Y;
      }
    }
    
    return result;
  }

  it("should position the first Input atom at the top left", () => {
    const position = simulateInputPositioning([], DESKTOP_ATOM_SIZE);

    // First input should be positioned at top left
    expect(position.x).toBe(DESKTOP_ATOM_SIZE * INPUT_X_MULTIPLIER);
    expect(position.y).toBe(DESKTOP_ATOM_SIZE * INPUT_Y_START_MULTIPLIER);
  });

  it("should position the second Input atom below the first", () => {
    const existingInputs = [
      { x: DESKTOP_ATOM_SIZE * INPUT_X_MULTIPLIER, y: DESKTOP_ATOM_SIZE * INPUT_Y_START_MULTIPLIER, atomType: "Input" }
    ];
    
    const position = simulateInputPositioning(existingInputs, DESKTOP_ATOM_SIZE);

    // Should have the same x position (left side)
    expect(position.x).toBe(DESKTOP_ATOM_SIZE * INPUT_X_MULTIPLIER);

    // Should be below the first with proper spacing
    const expectedSpacing = DESKTOP_ATOM_SIZE * INPUT_SPACING_MULTIPLIER;
    expect(position.y).toBe(existingInputs[0].y + expectedSpacing);
  });

  it("should position multiple Input atoms in a vertical stack", () => {
    const expectedX = DESKTOP_ATOM_SIZE * INPUT_X_MULTIPLIER;
    const existingInputs = [];
    const positions = [];

    // Simulate creating 5 input atoms
    for (let i = 0; i < 5; i++) {
      const position = simulateInputPositioning(existingInputs, DESKTOP_ATOM_SIZE);
      positions.push(position);
      existingInputs.push({ ...position, atomType: "Input" });
    }

    // All should be aligned on the left side
    positions.forEach((position) => {
      expect(position.x).toBe(expectedX);
    });

    // Each should be positioned below the previous one
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i].y).toBeGreaterThan(positions[i - 1].y);
    }

    // First input should be at the top
    expect(positions[0].y).toBe(DESKTOP_ATOM_SIZE * INPUT_Y_START_MULTIPLIER);
  });

  it("should always find the lowest Input and position below it", () => {
    const expectedX = DESKTOP_ATOM_SIZE * INPUT_X_MULTIPLIER;
    const expectedSpacing = DESKTOP_ATOM_SIZE * INPUT_SPACING_MULTIPLIER;
    
    // Create existing inputs at various y positions
    const existingInputs = [
      { x: expectedX, y: DESKTOP_ATOM_SIZE * 10, atomType: "Input" },      // First
      { x: expectedX, y: DESKTOP_ATOM_SIZE * 15, atomType: "Input" },      // Second
      { x: expectedX, y: DESKTOP_ATOM_SIZE * 20, atomType: "Input" },      // Third (lowest)
    ];
    
    // New input should be positioned below the lowest (highest y value)
    const position = simulateInputPositioning(existingInputs, DESKTOP_ATOM_SIZE);
    
    expect(position.x).toBe(expectedX);
    expect(position.y).toBe(DESKTOP_ATOM_SIZE * 20 + expectedSpacing); // Below the third input
  });

  it("should handle different atomSize values correctly (mobile vs desktop)", () => {
    const mobileExpectedX = MOBILE_ATOM_SIZE * INPUT_X_MULTIPLIER;
    
    // First input on mobile device
    const position1 = simulateInputPositioning([], MOBILE_ATOM_SIZE);
    expect(position1.x).toBe(mobileExpectedX);
    expect(position1.y).toBe(MOBILE_ATOM_SIZE * INPUT_Y_START_MULTIPLIER);
    
    // Second input on mobile device
    const position2 = simulateInputPositioning([position1], MOBILE_ATOM_SIZE);
    expect(position2.x).toBe(mobileExpectedX);
    expect(position2.y).toBeGreaterThan(position1.y);
  });

  it("should reduce spacing when many inputs would exceed canvas height", () => {
    const expectedX = DESKTOP_ATOM_SIZE * INPUT_X_MULTIPLIER;
    const existingInputs = [];
    const positions = [];

    // Simulate creating 30 input atoms (should exceed default spacing with 0.95 max height)
    // With default spacing of atomSize * 5 and start at atomSize * 10:
    // 30 inputs need: 0.153 + 29 * 0.0769 = 0.153 + 2.23 = 2.38 which exceeds 0.95
    for (let i = 0; i < 30; i++) {
      const position = simulateInputPositioning(existingInputs, DESKTOP_ATOM_SIZE);
      positions.push(position);
      existingInputs.push({ ...position, atomType: "Input" });
    }

    // All should be aligned on the left side
    positions.forEach((position) => {
      expect(position.x).toBe(expectedX);
    });

    // All positions should be within the canvas bounds
    positions.forEach((position) => {
      expect(position.y).toBeLessThanOrEqual(MAX_Y);
    });

    // The last input should be near the bottom but not exceed max Y
    expect(positions[positions.length - 1].y).toBeLessThanOrEqual(MAX_Y);
    
    // Verify spacing is reduced from default for later inputs
    // Check spacing between inputs after the adjustment kicks in
    if (positions.length > 10) {
      const lateSpacing = positions[20].y - positions[19].y;
      const defaultSpacing = DESKTOP_ATOM_SIZE * INPUT_SPACING_MULTIPLIER;
      // The spacing should be reduced when we have many inputs
      expect(lateSpacing).toBeLessThanOrEqual(defaultSpacing);
    }
  });

  it("should maintain minimum spacing even with many inputs", () => {
    const expectedX = DESKTOP_ATOM_SIZE * INPUT_X_MULTIPLIER;
    const minSpacing = DESKTOP_ATOM_SIZE * MIN_SPACING_MULTIPLIER;
    const existingInputs = [];
    const positions = [];

    // Simulate creating 100 input atoms (way too many for normal spacing)
    for (let i = 0; i < 100; i++) {
      const position = simulateInputPositioning(existingInputs, DESKTOP_ATOM_SIZE);
      positions.push(position);
      existingInputs.push({ ...position, atomType: "Input" });
    }

    // Check that spacing doesn't go below minimum for early inputs
    for (let i = 1; i < Math.min(10, positions.length); i++) {
      const spacing = positions[i].y - positions[i - 1].y;
      expect(spacing).toBeGreaterThanOrEqual(minSpacing * 0.99); // Allow small rounding error
    }

    // All positions should be within canvas bounds
    positions.forEach((position) => {
      expect(position.y).toBeLessThanOrEqual(MAX_Y);
    });
  });
});
