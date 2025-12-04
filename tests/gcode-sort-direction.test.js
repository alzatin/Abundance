import { expect, test, describe } from "vitest";

describe("G-code sort direction logic", () => {
  /**
   * Check if bounding box A is entirely inside bounding box B (in XY plane)
   * @param {Object} boundsA - Bounding box with min/max arrays [x, y, z]
   * @param {Object} boundsB - Bounding box with min/max arrays [x, y, z]
   * @returns {boolean} True if A is entirely inside B
   */
  function isBoundsInsideBounds(boundsA, boundsB) {
    return (
      boundsA.min[0] > boundsB.min[0] &&
      boundsA.max[0] < boundsB.max[0] &&
      boundsA.min[1] > boundsB.min[1] &&
      boundsA.max[1] < boundsB.max[1]
    );
  }

  /**
   * Reorder parts so that interior parts come before their containing exterior parts
   * Uses topological sort to handle nested containment
   * @param {Array} partsWithBounds - Array of parts with bounds info
   * @returns {Array} Reordered array with interior parts before exterior parts
   */
  function reorderForNestedParts(partsWithBounds) {
    const n = partsWithBounds.length;
    if (n <= 1) return partsWithBounds;

    // Build containment relationships: contains[i] = indices of parts that are inside part i
    const contains = partsWithBounds.map(() => []);

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          // Check if part j is inside part i
          if (isBoundsInsideBounds(partsWithBounds[j].bounds, partsWithBounds[i].bounds)) {
            contains[i].push(j);
          }
        }
      }
    }

    // Topological sort: when we visit a part, first add all parts it contains
    const visited = new Set();
    const result = [];

    const visit = (index) => {
      if (visited.has(index)) return;
      visited.add(index);

      // First recursively add all parts contained within this part
      for (const containedIndex of contains[index]) {
        visit(containedIndex);
      }

      // Then add this part
      result.push(partsWithBounds[index]);
    };

    // Visit in original order to maintain directional sort as tiebreaker
    for (let i = 0; i < n; i++) {
      visit(i);
    }

    return result;
  }

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

    // Reorder to ensure interior parts are cut before their containing exterior parts
    const reorderedParts = reorderForNestedParts(partsWithBounds);

    return reorderedParts.map((part) => part.id);
  }

  test("should sort parts correctly by left direction (X ascending)", () => {
    const mockParts = ["part1", "part2", "part3"];
    const partsWithBounds = [
      { id: "part1", centerX: 0.5, centerY: 0.5, bounds: { min: [0, 0, 0], max: [1, 1, 1] } },
      { id: "part2", centerX: 2.5, centerY: 0.5, bounds: { min: [2, 0, 0], max: [3, 1, 1] } },
      { id: "part3", centerX: -1.5, centerY: 0.5, bounds: { min: [-2, 0, 0], max: [-1, 1, 1] } },
    ];

    const sortedParts = sortParts(mockParts, partsWithBounds, "Left");
    
    // Should be sorted by X coordinate ascending: part3 (-1.5), part1 (0.5), part2 (2.5)
    expect(sortedParts).toEqual(["part3", "part1", "part2"]);
  });

  test("should sort parts correctly by right direction (X descending)", () => {
    const mockParts = ["part1", "part2", "part3"];
    const partsWithBounds = [
      { id: "part1", centerX: 0.5, centerY: 0.5, bounds: { min: [0, 0, 0], max: [1, 1, 1] } },
      { id: "part2", centerX: 2.5, centerY: 0.5, bounds: { min: [2, 0, 0], max: [3, 1, 1] } },
      { id: "part3", centerX: -1.5, centerY: 0.5, bounds: { min: [-2, 0, 0], max: [-1, 1, 1] } },
    ];

    const sortedParts = sortParts(mockParts, partsWithBounds, "Right");
    
    // Should be sorted by X coordinate descending: part2 (2.5), part1 (0.5), part3 (-1.5)
    expect(sortedParts).toEqual(["part2", "part1", "part3"]);
  });

  test("should sort parts correctly by top direction (Y descending)", () => {
    const mockParts = ["part1", "part2", "part3"];
    const partsWithBounds = [
      { id: "part1", centerX: 0.5, centerY: 0.5, bounds: { min: [0, 0, 0], max: [1, 1, 1] } },
      { id: "part2", centerX: 0.5, centerY: 2.5, bounds: { min: [0, 2, 0], max: [1, 3, 1] } },
      { id: "part3", centerX: 0.5, centerY: -1.5, bounds: { min: [0, -2, 0], max: [1, -1, 1] } },
    ];

    const sortedParts = sortParts(mockParts, partsWithBounds, "Top");
    
    // Should be sorted by Y coordinate descending: part2 (2.5), part1 (0.5), part3 (-1.5)
    expect(sortedParts).toEqual(["part2", "part1", "part3"]);
  });

  test("should sort parts correctly by bottom direction (Y ascending)", () => {
    const mockParts = ["part1", "part2", "part3"];
    const partsWithBounds = [
      { id: "part1", centerX: 0.5, centerY: 0.5, bounds: { min: [0, 0, 0], max: [1, 1, 1] } },
      { id: "part2", centerX: 0.5, centerY: 2.5, bounds: { min: [0, 2, 0], max: [1, 3, 1] } },
      { id: "part3", centerX: 0.5, centerY: -1.5, bounds: { min: [0, -2, 0], max: [1, -1, 1] } },
    ];

    const sortedParts = sortParts(mockParts, partsWithBounds, "Bottom");
    
    // Should be sorted by Y coordinate ascending: part3 (-1.5), part1 (0.5), part2 (2.5)
    expect(sortedParts).toEqual(["part3", "part1", "part2"]);
  });

  test("should fall back to left direction for invalid sort direction", () => {
    const mockParts = ["part1", "part2"];
    const partsWithBounds = [
      { id: "part1", centerX: 2.5, centerY: 0.5, bounds: { min: [2, 0, 0], max: [3, 1, 1] } },
      { id: "part2", centerX: 0.5, centerY: 0.5, bounds: { min: [0, 0, 0], max: [1, 1, 1] } },
    ];

    const sortedParts = sortParts(mockParts, partsWithBounds, "Invalid");
    
    // Should default to left direction (X ascending): part2 (0.5), part1 (2.5)
    expect(sortedParts).toEqual(["part2", "part1"]);
  });

  test("should handle edge case with same coordinates", () => {
    const mockParts = ["part1", "part2", "part3"];
    const partsWithBounds = [
      { id: "part1", centerX: 1.0, centerY: 1.0, bounds: { min: [0, 0, 0], max: [2, 2, 1] } },
      { id: "part2", centerX: 1.0, centerY: 1.0, bounds: { min: [0, 0, 0], max: [2, 2, 1] } },
      { id: "part3", centerX: 1.0, centerY: 1.0, bounds: { min: [0, 0, 0], max: [2, 2, 1] } },
    ];

    const sortedParts = sortParts(mockParts, partsWithBounds, "Left");
    
    // Should maintain original order when coordinates are the same
    expect(sortedParts).toEqual(["part1", "part2", "part3"]);
  });

  // Tests for nested parts handling
  describe("nested parts handling", () => {
    test("should cut interior part before exterior part regardless of sort direction", () => {
      // Outer part is a large square, inner part is a small square centered inside
      const mockParts = ["outer", "inner"];
      const partsWithBounds = [
        { 
          id: "outer", 
          centerX: 5, 
          centerY: 5, 
          bounds: { min: [0, 0, 0], max: [10, 10, 1] }  // Large square from 0 to 10
        },
        { 
          id: "inner", 
          centerX: 5, 
          centerY: 5, 
          bounds: { min: [3, 3, 0], max: [7, 7, 1] }  // Small square from 3 to 7 (inside outer)
        },
      ];

      // Even though outer comes first by directional sort, inner should be cut first
      const sortedParts = sortParts(mockParts, partsWithBounds, "Left");
      expect(sortedParts).toEqual(["inner", "outer"]);
    });

    test("should handle nested parts with Right sort direction", () => {
      const mockParts = ["inner", "outer"];
      const partsWithBounds = [
        { 
          id: "inner", 
          centerX: 5, 
          centerY: 5, 
          bounds: { min: [3, 3, 0], max: [7, 7, 1] }
        },
        { 
          id: "outer", 
          centerX: 5, 
          centerY: 5, 
          bounds: { min: [0, 0, 0], max: [10, 10, 1] }
        },
      ];

      const sortedParts = sortParts(mockParts, partsWithBounds, "Right");
      expect(sortedParts).toEqual(["inner", "outer"]);
    });

    test("should handle nested parts with Top sort direction", () => {
      const mockParts = ["outer", "inner"];
      const partsWithBounds = [
        { 
          id: "outer", 
          centerX: 5, 
          centerY: 5, 
          bounds: { min: [0, 0, 0], max: [10, 10, 1] }
        },
        { 
          id: "inner", 
          centerX: 5, 
          centerY: 5, 
          bounds: { min: [3, 3, 0], max: [7, 7, 1] }
        },
      ];

      const sortedParts = sortParts(mockParts, partsWithBounds, "Top");
      expect(sortedParts).toEqual(["inner", "outer"]);
    });

    test("should handle deeply nested parts (3 levels)", () => {
      // Three concentric squares
      const mockParts = ["outer", "middle", "inner"];
      const partsWithBounds = [
        { 
          id: "outer", 
          centerX: 5, 
          centerY: 5, 
          bounds: { min: [0, 0, 0], max: [10, 10, 1] }  // Largest
        },
        { 
          id: "middle", 
          centerX: 5, 
          centerY: 5, 
          bounds: { min: [2, 2, 0], max: [8, 8, 1] }    // Medium
        },
        { 
          id: "inner", 
          centerX: 5, 
          centerY: 5, 
          bounds: { min: [4, 4, 0], max: [6, 6, 1] }    // Smallest
        },
      ];

      const sortedParts = sortParts(mockParts, partsWithBounds, "Left");
      // Inner should come first, then middle, then outer
      expect(sortedParts).toEqual(["inner", "middle", "outer"]);
    });

    test("should maintain directional sort for non-nested parts", () => {
      // Two separate parts plus one with nested inner part
      const mockParts = ["leftPart", "outer", "inner", "rightPart"];
      const partsWithBounds = [
        { 
          id: "leftPart", 
          centerX: -5, 
          centerY: 0, 
          bounds: { min: [-7, -1, 0], max: [-3, 1, 1] }
        },
        { 
          id: "outer", 
          centerX: 5, 
          centerY: 0, 
          bounds: { min: [2, -3, 0], max: [8, 3, 1] }
        },
        { 
          id: "inner", 
          centerX: 5, 
          centerY: 0, 
          bounds: { min: [3, -2, 0], max: [7, 2, 1] }
        },
        { 
          id: "rightPart", 
          centerX: 15, 
          centerY: 0, 
          bounds: { min: [13, -1, 0], max: [17, 1, 1] }
        },
      ];

      const sortedParts = sortParts(mockParts, partsWithBounds, "Left");
      // Left to right, but inner before outer
      expect(sortedParts).toEqual(["leftPart", "inner", "outer", "rightPart"]);
    });

    test("should not reorder parts that are adjacent but not nested", () => {
      // Two adjacent squares side by side
      const mockParts = ["left", "right"];
      const partsWithBounds = [
        { 
          id: "left", 
          centerX: 2.5, 
          centerY: 5, 
          bounds: { min: [0, 0, 0], max: [5, 10, 1] }
        },
        { 
          id: "right", 
          centerX: 7.5, 
          centerY: 5, 
          bounds: { min: [5, 0, 0], max: [10, 10, 1] }
        },
      ];

      const sortedParts = sortParts(mockParts, partsWithBounds, "Left");
      // Should remain in directional order since they're not nested
      expect(sortedParts).toEqual(["left", "right"]);
    });

    test("should not treat overlapping parts as nested", () => {
      // Two overlapping squares where neither is fully inside the other
      const mockParts = ["partA", "partB"];
      const partsWithBounds = [
        { 
          id: "partA", 
          centerX: 3, 
          centerY: 5, 
          bounds: { min: [0, 0, 0], max: [6, 10, 1] }
        },
        { 
          id: "partB", 
          centerX: 7, 
          centerY: 5, 
          bounds: { min: [4, 0, 0], max: [10, 10, 1] }  // Overlaps but not inside A
        },
      ];

      const sortedParts = sortParts(mockParts, partsWithBounds, "Left");
      // Should remain in directional order
      expect(sortedParts).toEqual(["partA", "partB"]);
    });

    test("should handle part that touches edge but is not inside", () => {
      // Inner part touches one edge of outer
      const mockParts = ["outer", "inner"];
      const partsWithBounds = [
        { 
          id: "outer", 
          centerX: 5, 
          centerY: 5, 
          bounds: { min: [0, 0, 0], max: [10, 10, 1] }
        },
        { 
          id: "inner", 
          centerX: 5, 
          centerY: 5, 
          bounds: { min: [0, 3, 0], max: [7, 7, 1] }  // Touches left edge, so not fully inside
        },
      ];

      const sortedParts = sortParts(mockParts, partsWithBounds, "Left");
      // inner is not strictly inside (touches edge), so directional order preserved
      expect(sortedParts).toEqual(["outer", "inner"]);
    });

    test("should handle multiple separate nested pairs", () => {
      // Two separate pairs of nested parts
      const mockParts = ["outerA", "innerA", "outerB", "innerB"];
      const partsWithBounds = [
        { 
          id: "outerA", 
          centerX: 5, 
          centerY: 5, 
          bounds: { min: [0, 0, 0], max: [10, 10, 1] }
        },
        { 
          id: "innerA", 
          centerX: 5, 
          centerY: 5, 
          bounds: { min: [3, 3, 0], max: [7, 7, 1] }
        },
        { 
          id: "outerB", 
          centerX: 20, 
          centerY: 5, 
          bounds: { min: [15, 0, 0], max: [25, 10, 1] }
        },
        { 
          id: "innerB", 
          centerX: 20, 
          centerY: 5, 
          bounds: { min: [18, 3, 0], max: [22, 7, 1] }
        },
      ];

      const sortedParts = sortParts(mockParts, partsWithBounds, "Left");
      // Both inner parts should come before their respective outer parts
      expect(sortedParts).toEqual(["innerA", "outerA", "innerB", "outerB"]);
    });
  });
});