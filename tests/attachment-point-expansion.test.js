import { describe, it, expect, beforeAll, vi } from "vitest";

describe("Attachment Point Expansion for Multiple Inputs", () => {
  // Mock GlobalVariables for testing
  const mockGlobalVariables = {
    atomSize: 1/65,
    widthToPixels: (x) => x * 1000,
    heightToPixels: (y) => y * 800,
    pixelsToWidth: (x) => x / 1000,
    pixelsToHeight: (y) => y / 800,
    constrainToCanvasBorders: (x, y) => [Math.max(0, Math.min(1, x)), Math.max(0, Math.min(1, y))],
    c: {
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      closePath: vi.fn(),
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 1,
      globalCompositeOperation: "source-over",
      measureText: vi.fn(() => ({ width: 50 })),
      rect: vi.fn(),
      fillText: vi.fn(),
      stroke: vi.fn()
    },
    canvas: { current: { width: 1000, height: 800 } },
    distBetweenPoints: (x1, x2, y1, y2) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      return Math.sqrt(dx * dx + dy * dy);
    }
  };

  // Mock modules
  vi.doMock("../src/js/globalvariables.js", () => ({
    default: mockGlobalVariables
  }));

  let AttachmentPoint;

  beforeAll(async () => {
    // Import the class after mocking
    AttachmentPoint = (await import("../src/prototypes/attachmentpoint.js")).default;
  });

  it("should use DIST_FROM_PARENT of 2 for molecules with 5 or fewer inputs", () => {
    const mockMolecule = {
      x: 0.5,
      y: 0.5,
      radius: 0.05,
      atomType: "TestAtom",
      color: "#333333",
      selected: false,
      inputs: []
    };

    // Create 5 input attachment points
    for (let i = 0; i < 5; i++) {
      const inputAP = new AttachmentPoint({
        type: "input",
        parentMolecule: mockMolecule,
        name: `input${i}`,
        valueType: "geometry",
        uniqueID: `test-input-${i}`
      });
      mockMolecule.inputs.push(inputAP);
    }

    // The activation boundary should be based on DIST_FROM_PARENT = 2
    const expectedBoundary = 2 * mockMolecule.radius;
    
    // Verify DIST_FROM_PARENT constant
    expect(AttachmentPoint.DIST_FROM_PARENT).toBe(2);
  });

  it("should increase DIST_FROM_PARENT for molecules with more than 5 inputs", () => {
    const mockMolecule = {
      x: 0.5,
      y: 0.5,
      radius: 0.05,
      atomType: "TestAtom",
      color: "#333333",
      selected: false,
      inputs: []
    };

    // Create 7 input attachment points (more than 5)
    for (let i = 0; i < 7; i++) {
      const inputAP = new AttachmentPoint({
        type: "input",
        parentMolecule: mockMolecule,
        name: `input${i}`,
        valueType: "geometry",
        uniqueID: `test-input-${i}`
      });
      mockMolecule.inputs.push(inputAP);
    }

    // With many inputs, we need to ensure they can all be clicked
    // The boundary should be larger than the default
    const inputCount = mockMolecule.inputs.filter(ap => ap.type === "input").length;
    const expectedDistFromParent = inputCount > 5 ? 2 + (inputCount - 5) * 0.3 : 2;
    
    // When computing the activation boundary in mouseMove, it should use the dynamic value
    expect(AttachmentPoint.getDistFromParent(inputCount)).toBeCloseTo(expectedDistFromParent, 2);
  });

  it("should position attachment points in an arc when there are multiple inputs", () => {
    const mockMolecule = {
      x: 0.5,
      y: 0.5,
      radius: 0.05,
      atomType: "TestAtom",
      color: "#333333",
      selected: false,
      inputs: []
    };

    // Create 6 input attachment points
    for (let i = 0; i < 6; i++) {
      const inputAP = new AttachmentPoint({
        type: "input",
        parentMolecule: mockMolecule,
        name: `input${i}`,
        valueType: "geometry",
        uniqueID: `test-input-${i}`
      });
      mockMolecule.inputs.push(inputAP);
    }

    // Calculate positions for each attachment point
    const inputCount = mockMolecule.inputs.length;
    const distFromParent = AttachmentPoint.getDistFromParent(inputCount);
    const boundary = distFromParent * mockMolecule.radius;
    
    // Verify that positions are computed correctly
    mockMolecule.inputs.forEach((ap, index) => {
      const [x, y] = ap.computePosition(boundary);
      
      // Each point should be within the boundary distance from parent
      const dx = x - mockMolecule.x;
      const dy = y - mockMolecule.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Distance should be approximately equal to the hover radius
      // (slightly less due to attachment point size)
      expect(dist).toBeLessThanOrEqual(boundary);
      expect(dist).toBeGreaterThan(0);
    });
  });

  it("should ensure attachment points don't overlap when there are many inputs", () => {
    const mockMolecule = {
      x: 0.5,
      y: 0.5,
      radius: 0.05,
      atomType: "TestAtom",
      color: "#333333",
      selected: false,
      inputs: []
    };

    // Create 10 input attachment points (stress test)
    for (let i = 0; i < 10; i++) {
      const inputAP = new AttachmentPoint({
        type: "input",
        parentMolecule: mockMolecule,
        name: `input${i}`,
        valueType: "geometry",
        uniqueID: `test-input-${i}`
      });
      mockMolecule.inputs.push(inputAP);
    }

    const inputCount = mockMolecule.inputs.length;
    const distFromParent = AttachmentPoint.getDistFromParent(inputCount);
    const boundary = distFromParent * mockMolecule.radius;
    
    // Compute all positions
    const positions = mockMolecule.inputs.map(ap => ap.computePosition(boundary));
    
    // Check that no two attachment points are too close to each other
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const [x1, y1] = positions[i];
        const [x2, y2] = positions[j];
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Distance between attachment points should be at least the diameter
        // of an attachment point to avoid overlap
        const minDist = 2 * AttachmentPoint.RADIUS;
        expect(dist).toBeGreaterThanOrEqual(minDist * 0.8); // Allow some tolerance
      }
    }
  });

  it("should demonstrate the scaling behavior for different input counts", () => {
    // Test the scaling formula for various input counts
    const testCases = [
      { inputs: 1, expectedDist: 2 },      // <= 5 inputs: use default
      { inputs: 3, expectedDist: 2 },      // <= 5 inputs: use default
      { inputs: 5, expectedDist: 2 },      // exactly 5: use default
      { inputs: 6, expectedDist: 2.3 },    // 6 inputs: 2 + (6-5)*0.3 = 2.3
      { inputs: 7, expectedDist: 2.6 },    // 7 inputs: 2 + (7-5)*0.3 = 2.6
      { inputs: 10, expectedDist: 3.5 },   // 10 inputs: 2 + (10-5)*0.3 = 3.5
      { inputs: 15, expectedDist: 5.0 },   // 15 inputs: 2 + (15-5)*0.3 = 5.0
    ];

    testCases.forEach(({ inputs, expectedDist }) => {
      const result = AttachmentPoint.getDistFromParent(inputs);
      expect(result).toBeCloseTo(expectedDist, 2);
    });
  });
});
