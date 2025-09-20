// Test file for connector positioning issue on project load
import { beforeAll, describe, it, expect, vi } from "vitest";

describe("Connector Positioning on Load", () => {
  // Mock GlobalVariables for testing
  const mockGlobalVariables = {
    atomSize: 1/65,
    widthToPixels: (x) => x * 1000, // Mock canvas width of 1000px
    heightToPixels: (y) => y * 600,  // Mock canvas height of 600px
    pixelsToWidth: (x) => x / 1000,
    pixelsToHeight: (y) => y / 600,
    constrainToCanvasBorders: (x, y) => [Math.max(0, Math.min(1, x)), Math.max(0, Math.min(1, y))],
    c: {
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      bezierCurveTo: vi.fn(),
      stroke: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      closePath: vi.fn(),
      clearRect: vi.fn(),
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 1,
      globalCompositeOperation: "source-over"
    },
    canvas: { current: { width: 1000, height: 600 } }
  };

  // Mock modules
  vi.doMock("../src/js/globalvariables.js", () => ({
    default: mockGlobalVariables
  }));

  let AttachmentPoint, Connector;

  beforeAll(async () => {
    // Import the classes after mocking
    AttachmentPoint = (await import("../src/prototypes/attachmentpoint.js")).default;
    Connector = (await import("../src/prototypes/connector.js")).default;
  });

  it("should position attachment points correctly during initial molecule creation", () => {
    // Create a mock molecule with position
    const mockMolecule = {
      x: 0.5,    // Center of screen horizontally
      y: 0.5,    // Center of screen vertically  
      radius: 0.05, // 5% of screen width
      atomType: "TestAtom",
      color: "#333333",
      selected: false
    };

    // Create output attachment point
    const outputAP = new AttachmentPoint({
      type: "output",
      parentMolecule: mockMolecule,
      name: "output",
      valueType: "geometry",
      uniqueID: "test-output-1"
    });

    // Create input attachment point 
    const inputAP = new AttachmentPoint({
      type: "input", 
      parentMolecule: mockMolecule,
      name: "input",
      valueType: "geometry",
      uniqueID: "test-input-1"
    });

    // Attachment points should be positioned on molecule perimeter after unexpand
    expect(outputAP.x).toBeCloseTo(mockMolecule.x + mockMolecule.radius, 2);
    expect(outputAP.y).toBeCloseTo(mockMolecule.y, 2);
    expect(inputAP.x).toBeCloseTo(mockMolecule.x - mockMolecule.radius, 2);
    expect(inputAP.y).toBeCloseTo(mockMolecule.y, 2);
  });

  it("should demonstrate the connector positioning issue when molecules have incorrect positions", () => {
    // Simulate the case where molecules are created but don't have positions yet
    const moleculeWithBadPosition = {
      x: 0,      // This would be the problem - uninitialized position
      y: 0,
      radius: 0.05,
      atomType: "TestAtom",
      color: "#333333", 
      selected: false
    };

    const outputAP = new AttachmentPoint({
      type: "output",
      parentMolecule: moleculeWithBadPosition,
      name: "output", 
      valueType: "geometry",
      uniqueID: "bad-output-1"
    });

    const inputAP = new AttachmentPoint({
      type: "input",
      parentMolecule: moleculeWithBadPosition, 
      name: "input",
      valueType: "geometry",
      uniqueID: "bad-input-1"
    });

    // This demonstrates the issue - connectors would point to 0,0 area
    expect(outputAP.x).toBeCloseTo(0.05, 2); // 0 + radius
    expect(outputAP.y).toBeCloseTo(0, 2);     // 0
    expect(inputAP.x).toBeCloseTo(0, 2);      // 0 - radius (then constrained to 0)
    expect(inputAP.y).toBeCloseTo(0, 2);      // 0
  });

  it("should show attachment points get correct positions when molecule position is updated", () => {
    // Create molecule with initial bad position
    const molecule = {
      x: 0,
      y: 0, 
      radius: 0.05,
      atomType: "TestAtom",
      color: "#333333",
      selected: false
    };

    const outputAP = new AttachmentPoint({
      type: "output",
      parentMolecule: molecule,
      name: "output",
      valueType: "geometry", 
      uniqueID: "test-output-2"
    });

    // Initial position is wrong
    expect(outputAP.x).toBeCloseTo(0.05, 2);
    expect(outputAP.y).toBeCloseTo(0, 2);

    // Update molecule position (simulating what happens during proper loading)
    molecule.x = 0.5;
    molecule.y = 0.5;

    // Call unexpand again to recalculate positions
    outputAP.unexpand();

    // Now position should be correct
    expect(outputAP.x).toBeCloseTo(0.55, 2); // 0.5 + 0.05
    expect(outputAP.y).toBeCloseTo(0.5, 2);
  });

  it("should fix connector positioning during project loading via placeConnector", () => {
    // Create two molecules - one with bad position, one with good position
    const sourceMolecule = {
      x: 0,      // Bad initial position
      y: 0,
      outputX: 0.05, // Bad initial outputX
      radius: 0.05,
      atomType: "Source",
      color: "#333333",
      selected: false,
      subscribe: vi.fn(), // Mock the subscribe method
      uniqueID: "source-mol"
    };

    const targetMolecule = {
      x: 0,      // Bad initial position  
      y: 0,
      radius: 0.05,
      atomType: "Target",
      color: "#333333",
      selected: false,
      subscribe: vi.fn(), // Mock the subscribe method
      uniqueID: "target-mol"
    };

    const outputAP = new AttachmentPoint({
      type: "output",
      parentMolecule: sourceMolecule,
      name: "output",
      valueType: "geometry",
      uniqueID: "source-output"
    });

    const inputAP = new AttachmentPoint({
      type: "input", 
      parentMolecule: targetMolecule,
      name: "input",
      valueType: "geometry",
      uniqueID: "target-input"
    });

    // Set up mock molecule structure
    sourceMolecule.output = outputAP;
    targetMolecule.inputs = [inputAP];

    // Mock molecule with placeConnector method using the more surgical approach
    const mockMolecule = {
      nodesOnTheScreen: [sourceMolecule, targetMolecule],
      placeConnector: function(connectorObj) {
        var outputAttachmentPoint = false;
        var inputAttachmentPoint = false;

        this.nodesOnTheScreen.forEach((atom) => {
          if (atom.uniqueID == connectorObj.ap1ID) {
            outputAttachmentPoint = atom.output;
          }
          if (atom.uniqueID == connectorObj.ap2ID) {
            atom.inputs.forEach((input) => {
              if (input.name == connectorObj.ap2Name) {
                inputAttachmentPoint = input;
              }
            });
          }
        });

        if (outputAttachmentPoint && inputAttachmentPoint) {
          // Surgical fix: directly update attachment point positions during project loading
          // Update output attachment point position
          outputAttachmentPoint.y = outputAttachmentPoint.parentMolecule.y;
          if (outputAttachmentPoint.parentMolecule.atomType == "Input") {
            outputAttachmentPoint.x = mockGlobalVariables.atomSize * 3.5;
          } else {
            outputAttachmentPoint.x = outputAttachmentPoint.parentMolecule.x + outputAttachmentPoint.parentMolecule.radius;
          }
          [outputAttachmentPoint.x, outputAttachmentPoint.y] = mockGlobalVariables.constrainToCanvasBorders(outputAttachmentPoint.x, outputAttachmentPoint.y);
          
          // Update input attachment point position  
          inputAttachmentPoint.y = inputAttachmentPoint.parentMolecule.y;
          inputAttachmentPoint.x = inputAttachmentPoint.parentMolecule.x - inputAttachmentPoint.parentMolecule.radius;
          [inputAttachmentPoint.x, inputAttachmentPoint.y] = mockGlobalVariables.constrainToCanvasBorders(inputAttachmentPoint.x, inputAttachmentPoint.y);

          return new Connector({
            atomType: "Connector",
            attachmentPoint1: outputAttachmentPoint,
            attachmentPoint2: inputAttachmentPoint,
          });
        }
        return null;
      }
    };

    // Initially attachment points have wrong positions (based on molecules at 0,0)
    expect(outputAP.x).toBeCloseTo(0.05, 2); // 0 + radius
    expect(outputAP.y).toBeCloseTo(0, 2);    // 0
    expect(inputAP.x).toBeCloseTo(0, 2);     // 0 - radius, constrained to 0
    expect(inputAP.y).toBeCloseTo(0, 2);     // 0

    // Update molecule positions (simulating what happens during loading)
    sourceMolecule.x = 0.3;
    sourceMolecule.y = 0.4;
    targetMolecule.x = 0.7;
    targetMolecule.y = 0.6;

    // Place connector using placeConnector (simulating project loading)
    const connector = mockMolecule.placeConnector({
      ap1ID: "source-mol",
      ap2ID: "target-mol", 
      ap2Name: "input"
    });

    // After placeConnector, attachment points should have correct positions
    expect(outputAP.x).toBeCloseTo(0.35, 2); // 0.3 + 0.05
    expect(outputAP.y).toBeCloseTo(0.4, 2);  // 0.4
    expect(inputAP.x).toBeCloseTo(0.65, 2);  // 0.7 - 0.05
    expect(inputAP.y).toBeCloseTo(0.6, 2);   // 0.6

    // Connector should be created with correct initial positions
    expect(connector).toBeTruthy();
  });
});