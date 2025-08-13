import { describe, it, expect } from "vitest";

describe("Auto Connector Feature", () => {
  // Test the logic of the helper functions without full class instantiation
  
  // Mock molecule structure
  function createMockMolecule() {
    return {
      nodesOnTheScreen: [],
      
      // Copy the helper functions we want to test
      findSelectedAtomsWithGeometryOutput() {
        return this.nodesOnTheScreen.filter((atom) => {
          return atom.selected && atom.output && atom.output.valueType === "geometry";
        });
      },

      findFirstAvailableGeometryInput(atom) {
        if (!atom.inputs) return null;
        
        return atom.inputs.find((input) => {
          return input.valueType === "geometry" && input.connectors.length === 0;
        }) || null;
      }
    };
  }

  // Mock atom factory functions
  function createMockAtomWithGeometryOutput(atomType, selected = false) {
    return {
      atomType: atomType,
      selected: selected,
      output: {
        valueType: "geometry"
      },
      inputs: []
    };
  }

  function createMockAtomWithGeometryInput(atomType) {
    return {
      atomType: atomType,
      selected: false,
      output: null,
      inputs: [
        {
          name: "geometry",
          valueType: "geometry",
          connectors: []
        },
        {
          name: "height",
          valueType: "number",
          connectors: []
        }
      ]
    };
  }

  function createMockAtomWithoutGeometry(atomType) {
    return {
      atomType: atomType,
      selected: false,
      output: null,
      inputs: [
        {
          name: "diameter",
          valueType: "number",
          connectors: []
        }
      ]
    };
  }

  it("should find selected atoms with geometry output", () => {
    const molecule = createMockMolecule();
    
    // Add a selected atom with geometry output
    const selectedCircle = createMockAtomWithGeometryOutput("Circle", true);
    molecule.nodesOnTheScreen.push(selectedCircle);
    
    // Add a non-selected atom with geometry output
    const unselectedCircle = createMockAtomWithGeometryOutput("Circle", false);
    molecule.nodesOnTheScreen.push(unselectedCircle);
    
    // Add a selected atom without geometry output
    const selectedNonGeometry = createMockAtomWithoutGeometry("Input");
    selectedNonGeometry.selected = true;
    molecule.nodesOnTheScreen.push(selectedNonGeometry);

    const result = molecule.findSelectedAtomsWithGeometryOutput();
    
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(selectedCircle);
  });

  it("should find first available geometry input", () => {
    const molecule = createMockMolecule();
    
    // Test atom with geometry input
    const extrudeAtom = createMockAtomWithGeometryInput("Extrude");
    const geometryInput = molecule.findFirstAvailableGeometryInput(extrudeAtom);
    
    expect(geometryInput).toBeDefined();
    expect(geometryInput.name).toBe("geometry");
    expect(geometryInput.valueType).toBe("geometry");
    
    // Test atom without geometry input
    const circleAtom = createMockAtomWithoutGeometry("Circle");
    const noGeometryInput = molecule.findFirstAvailableGeometryInput(circleAtom);
    
    expect(noGeometryInput).toBeNull();
  });

  it("should not find geometry input if already connected", () => {
    const molecule = createMockMolecule();
    
    const extrudeAtom = createMockAtomWithGeometryInput("Extrude");
    
    // Mark the geometry input as already connected
    extrudeAtom.inputs[0].connectors.push({ id: "mock-connector" });
    
    const geometryInput = molecule.findFirstAvailableGeometryInput(extrudeAtom);
    
    expect(geometryInput).toBeNull();
  });

  it("should find multiple selected atoms with geometry outputs", () => {
    const molecule = createMockMolecule();
    
    const circle1 = createMockAtomWithGeometryOutput("Circle", true);
    const circle2 = createMockAtomWithGeometryOutput("Circle", true);
    const rectangle = createMockAtomWithGeometryOutput("Rectangle", false);
    
    molecule.nodesOnTheScreen.push(circle1, circle2, rectangle);
    
    const result = molecule.findSelectedAtomsWithGeometryOutput();
    
    expect(result).toHaveLength(2);
    expect(result).toContain(circle1);
    expect(result).toContain(circle2);
    expect(result).not.toContain(rectangle);
  });

  it("should handle empty molecule", () => {
    const molecule = createMockMolecule();
    
    expect(molecule.findSelectedAtomsWithGeometryOutput()).toHaveLength(0);
    
    const mockAtom = createMockAtomWithoutGeometry("Test");
    expect(molecule.findFirstAvailableGeometryInput(mockAtom)).toBeNull();
  });

  it("should validate the auto-connector logic flow", () => {
    const molecule = createMockMolecule();
    
    // Mock the placeConnector function
    let connectorCreated = false;
    let connectorData = null;
    molecule.placeConnector = function(connectorObj) {
      connectorCreated = true;
      connectorData = connectorObj;
    };
    
    // Add the autoCreateConnector function
    molecule.autoCreateConnector = function(newAtom) {
      const selectedGeometryAtoms = this.findSelectedAtomsWithGeometryOutput();
      
      if (selectedGeometryAtoms.length === 0) {
        return;
      }

      const geometryInput = this.findFirstAvailableGeometryInput(newAtom);
      
      if (!geometryInput) {
        return;
      }

      const sourceAtom = selectedGeometryAtoms[0];
      
      this.placeConnector({
        ap1ID: sourceAtom.uniqueID,
        ap2ID: newAtom.uniqueID,
        ap2Name: geometryInput.name,
      });
    };
    
    // Setup: Selected atom with geometry output
    const selectedCircle = createMockAtomWithGeometryOutput("Circle", true);
    selectedCircle.uniqueID = "circle-1";
    molecule.nodesOnTheScreen.push(selectedCircle);
    
    // Action: Place new atom with geometry input
    const newExtrude = createMockAtomWithGeometryInput("Extrude");
    newExtrude.uniqueID = "extrude-1";
    
    molecule.autoCreateConnector(newExtrude);
    
    // Verify: Connector was created with correct parameters
    expect(connectorCreated).toBe(true);
    expect(connectorData).toEqual({
      ap1ID: "circle-1",
      ap2ID: "extrude-1", 
      ap2Name: "geometry"
    });
  });

  it("should not create connector when conditions are not met", () => {
    const molecule = createMockMolecule();
    
    let connectorCreated = false;
    molecule.placeConnector = function() {
      connectorCreated = true;
    };
    
    // Add the autoCreateConnector function
    molecule.autoCreateConnector = function(newAtom) {
      const selectedGeometryAtoms = this.findSelectedAtomsWithGeometryOutput();
      
      if (selectedGeometryAtoms.length === 0) {
        return;
      }

      const geometryInput = this.findFirstAvailableGeometryInput(newAtom);
      
      if (!geometryInput) {
        return;
      }

      const sourceAtom = selectedGeometryAtoms[0];
      
      this.placeConnector({
        ap1ID: sourceAtom.uniqueID,
        ap2ID: newAtom.uniqueID,
        ap2Name: geometryInput.name,
      });
    };
    
    // Test 1: No selected atoms
    const newExtrude1 = createMockAtomWithGeometryInput("Extrude");
    molecule.autoCreateConnector(newExtrude1);
    expect(connectorCreated).toBe(false);
    
    // Test 2: Selected atom but new atom has no geometry input
    const selectedCircle = createMockAtomWithGeometryOutput("Circle", true);
    molecule.nodesOnTheScreen.push(selectedCircle);
    
    const newCircle = createMockAtomWithoutGeometry("Circle");
    molecule.autoCreateConnector(newCircle);
    expect(connectorCreated).toBe(false);
  });
});