import { expect, test, describe } from "vitest";

describe("G-code sort direction logic", () => {
  // Mock implementation of the sorting logic from the Gcode class
  function sortParts(parts, partsWithBounds, sortDirection) {
    // Sort based on the selected direction
    switch (sortDirection) {
      case "Left":
        // Sort by X coordinate ascending (left to right)
        partsWithBounds.sort((a, b) => a.centerX - b.centerX);
        break;
      case "Right":
        // Sort by X coordinate descending (right to left)
        partsWithBounds.sort((a, b) => b.centerX - a.centerX);
        break;
      case "Top":
        // Sort by Y coordinate descending (top to bottom, assuming Y+ is up)
        partsWithBounds.sort((a, b) => b.centerY - a.centerY);
        break;
      case "Bottom":
        // Sort by Y coordinate ascending (bottom to top)
        partsWithBounds.sort((a, b) => a.centerY - b.centerY);
        break;
      default:
        // Default to left to right
        partsWithBounds.sort((a, b) => a.centerX - b.centerX);
        break;
    }

    return partsWithBounds.map((part) => part.id);
  }

  test("should sort parts correctly by left direction (X ascending)", () => {
    const mockParts = ["part1", "part2", "part3"];
    const partsWithBounds = [
      { id: "part1", centerX: 0.5, centerY: 0.5 },
      { id: "part2", centerX: 2.5, centerY: 0.5 },
      { id: "part3", centerX: -1.5, centerY: 0.5 },
    ];

    const sortedParts = sortParts(mockParts, partsWithBounds, "Left");
    
    // Should be sorted by X coordinate ascending: part3 (-1.5), part1 (0.5), part2 (2.5)
    expect(sortedParts).toEqual(["part3", "part1", "part2"]);
  });

  test("should sort parts correctly by right direction (X descending)", () => {
    const mockParts = ["part1", "part2", "part3"];
    const partsWithBounds = [
      { id: "part1", centerX: 0.5, centerY: 0.5 },
      { id: "part2", centerX: 2.5, centerY: 0.5 },
      { id: "part3", centerX: -1.5, centerY: 0.5 },
    ];

    const sortedParts = sortParts(mockParts, partsWithBounds, "Right");
    
    // Should be sorted by X coordinate descending: part2 (2.5), part1 (0.5), part3 (-1.5)
    expect(sortedParts).toEqual(["part2", "part1", "part3"]);
  });

  test("should sort parts correctly by top direction (Y descending)", () => {
    const mockParts = ["part1", "part2", "part3"];
    const partsWithBounds = [
      { id: "part1", centerX: 0.5, centerY: 0.5 },
      { id: "part2", centerX: 0.5, centerY: 2.5 },
      { id: "part3", centerX: 0.5, centerY: -1.5 },
    ];

    const sortedParts = sortParts(mockParts, partsWithBounds, "Top");
    
    // Should be sorted by Y coordinate descending: part2 (2.5), part1 (0.5), part3 (-1.5)
    expect(sortedParts).toEqual(["part2", "part1", "part3"]);
  });

  test("should sort parts correctly by bottom direction (Y ascending)", () => {
    const mockParts = ["part1", "part2", "part3"];
    const partsWithBounds = [
      { id: "part1", centerX: 0.5, centerY: 0.5 },
      { id: "part2", centerX: 0.5, centerY: 2.5 },
      { id: "part3", centerX: 0.5, centerY: -1.5 },
    ];

    const sortedParts = sortParts(mockParts, partsWithBounds, "Bottom");
    
    // Should be sorted by Y coordinate ascending: part3 (-1.5), part1 (0.5), part2 (2.5)
    expect(sortedParts).toEqual(["part3", "part1", "part2"]);
  });

  test("should fall back to left direction for invalid sort direction", () => {
    const mockParts = ["part1", "part2"];
    const partsWithBounds = [
      { id: "part1", centerX: 2.5, centerY: 0.5 },
      { id: "part2", centerX: 0.5, centerY: 0.5 },
    ];

    const sortedParts = sortParts(mockParts, partsWithBounds, "Invalid");
    
    // Should default to left direction (X ascending): part2 (0.5), part1 (2.5)
    expect(sortedParts).toEqual(["part2", "part1"]);
  });

  test("should handle edge case with same coordinates", () => {
    const mockParts = ["part1", "part2", "part3"];
    const partsWithBounds = [
      { id: "part1", centerX: 1.0, centerY: 1.0 },
      { id: "part2", centerX: 1.0, centerY: 1.0 },
      { id: "part3", centerX: 1.0, centerY: 1.0 },
    ];

    const sortedParts = sortParts(mockParts, partsWithBounds, "Left");
    
    // Should maintain original order when coordinates are the same
    expect(sortedParts).toEqual(["part1", "part2", "part3"]);
  });
});