import { describe, it, expect } from "vitest";

// Constants matching those used in GlobalVariables and Input class
const DESKTOP_ATOM_SIZE = 1 / 65; // Default atomSize for desktop
const MOBILE_ATOM_SIZE = 1 / 30;  // atomSize for mobile devices
const INPUT_X_MULTIPLIER = 1.65;  // Multiplier for left-side x position
const INPUT_Y_START_MULTIPLIER = 2; // Multiplier for first input's y position
const INPUT_SPACING_MULTIPLIER = 2; // Multiplier for spacing between inputs

describe("Input atom positioning logic", () => {
  // Test the positioning logic by simulating the adjustYForCollision method behavior
  
  function simulateInputPositioning(existingInputs, atomSize = DESKTOP_ATOM_SIZE) {
    const result = {
      x: atomSize * INPUT_X_MULTIPLIER,
      y: 0,
    };
    
    const atomSpacing = atomSize * INPUT_SPACING_MULTIPLIER;
    
    if (existingInputs.length === 0) {
      // First Input atom - position at top left
      result.y = atomSize * INPUT_Y_START_MULTIPLIER;
    } else {
      // Find the Input with the lowest (highest y value) position
      const lowestInput = existingInputs.reduce((lowest, current) => {
        return current.y > lowest.y ? current : lowest;
      });
      
      // Position below the lowest existing Input
      result.y = lowestInput.y + atomSpacing;
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
    const expectedSpacing = DESKTOP_ATOM_SIZE * INPUT_SPACING_MULTIPLIER;
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
      expect(positions[i].y).toBe(positions[i - 1].y + expectedSpacing);
    }

    // First input should be at the top
    expect(positions[0].y).toBe(DESKTOP_ATOM_SIZE * INPUT_Y_START_MULTIPLIER);
  });

  it("should always find the lowest Input and position below it", () => {
    const expectedX = DESKTOP_ATOM_SIZE * INPUT_X_MULTIPLIER;
    const expectedSpacing = DESKTOP_ATOM_SIZE * INPUT_SPACING_MULTIPLIER;
    
    // Create existing inputs at various y positions
    const existingInputs = [
      { x: expectedX, y: DESKTOP_ATOM_SIZE * 2, atomType: "Input" },      // First
      { x: expectedX, y: DESKTOP_ATOM_SIZE * 4, atomType: "Input" },      // Second
      { x: expectedX, y: DESKTOP_ATOM_SIZE * 6, atomType: "Input" },      // Third (lowest)
    ];
    
    // New input should be positioned below the lowest (highest y value)
    const position = simulateInputPositioning(existingInputs, DESKTOP_ATOM_SIZE);
    
    expect(position.x).toBe(expectedX);
    expect(position.y).toBe(DESKTOP_ATOM_SIZE * 6 + expectedSpacing); // Below the third input
  });

  it("should handle different atomSize values correctly (mobile vs desktop)", () => {
    const mobileExpectedX = MOBILE_ATOM_SIZE * INPUT_X_MULTIPLIER;
    const mobileExpectedSpacing = MOBILE_ATOM_SIZE * INPUT_SPACING_MULTIPLIER;
    
    // First input on mobile device
    const position1 = simulateInputPositioning([], MOBILE_ATOM_SIZE);
    expect(position1.x).toBe(mobileExpectedX);
    expect(position1.y).toBe(MOBILE_ATOM_SIZE * INPUT_Y_START_MULTIPLIER);
    
    // Second input on mobile device
    const position2 = simulateInputPositioning([position1], MOBILE_ATOM_SIZE);
    expect(position2.x).toBe(mobileExpectedX);
    expect(position2.y).toBe(position1.y + mobileExpectedSpacing);
  });
});
