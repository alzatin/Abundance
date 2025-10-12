import { describe, it, expect } from "vitest";

describe("Input atom positioning logic", () => {
  // Test the positioning logic by simulating the adjustYForCollision method behavior
  
  function simulateInputPositioning(existingInputs, atomSize = 1 / 65) {
    const result = {
      x: atomSize * 1.65,
      y: 0,
    };
    
    const atomSpacing = atomSize * 2;
    
    if (existingInputs.length === 0) {
      // First Input atom - position at top left
      result.y = atomSize * 2;
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
    const atomSize = 1 / 65;
    const position = simulateInputPositioning([], atomSize);

    // First input should be positioned at top left
    expect(position.x).toBe(atomSize * 1.65);
    expect(position.y).toBe(atomSize * 2);
  });

  it("should position the second Input atom below the first", () => {
    const atomSize = 1 / 65;
    const existingInputs = [
      { x: atomSize * 1.65, y: atomSize * 2, atomType: "Input" }
    ];
    
    const position = simulateInputPositioning(existingInputs, atomSize);

    // Should have the same x position (left side)
    expect(position.x).toBe(atomSize * 1.65);

    // Should be below the first with proper spacing
    const expectedSpacing = atomSize * 2;
    expect(position.y).toBe(existingInputs[0].y + expectedSpacing);
  });

  it("should position multiple Input atoms in a vertical stack", () => {
    const atomSize = 1 / 65;
    const expectedX = atomSize * 1.65;
    const expectedSpacing = atomSize * 2;
    const existingInputs = [];
    const positions = [];

    // Simulate creating 5 input atoms
    for (let i = 0; i < 5; i++) {
      const position = simulateInputPositioning(existingInputs, atomSize);
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
    expect(positions[0].y).toBe(atomSize * 2);
  });

  it("should always find the lowest Input and position below it", () => {
    const atomSize = 1 / 65;
    const expectedX = atomSize * 1.65;
    const expectedSpacing = atomSize * 2;
    
    // Create existing inputs at various y positions
    const existingInputs = [
      { x: expectedX, y: atomSize * 2, atomType: "Input" },      // First
      { x: expectedX, y: atomSize * 4, atomType: "Input" },      // Second
      { x: expectedX, y: atomSize * 6, atomType: "Input" },      // Third (lowest)
    ];
    
    // New input should be positioned below the lowest (highest y value)
    const position = simulateInputPositioning(existingInputs, atomSize);
    
    expect(position.x).toBe(expectedX);
    expect(position.y).toBe(atomSize * 6 + expectedSpacing); // Below the third input
  });

  it("should handle different atomSize values correctly", () => {
    const atomSize = 1 / 30; // Mobile size
    const expectedX = atomSize * 1.65;
    const expectedSpacing = atomSize * 2;
    
    // First input
    const position1 = simulateInputPositioning([], atomSize);
    expect(position1.x).toBe(expectedX);
    expect(position1.y).toBe(atomSize * 2);
    
    // Second input
    const position2 = simulateInputPositioning([position1], atomSize);
    expect(position2.x).toBe(expectedX);
    expect(position2.y).toBe(position1.y + expectedSpacing);
  });
});
