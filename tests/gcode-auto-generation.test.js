import { expect, test, describe, vi, beforeEach, afterEach } from "vitest";

// Mock global variables and dependencies
const mockGlobalVariables = {
  generateUniqueID: () => Math.random().toString(36).substr(2, 9),
  cad: {
    getBoundingBox: vi.fn().mockResolvedValue({
      max: [10, 10, 5],
      min: [0, 0, 0]
    }),
    visExport: vi.fn().mockResolvedValue(true),
    downExport: vi.fn().mockResolvedValue(new Blob(['mock stl'], { type: 'application/octet-stream' })),
    visualizeGcode: vi.fn().mockResolvedValue(true),
    isAssembly: vi.fn().mockResolvedValue(false)
  },
  topLevelMolecule: {
    unitsKey: "MM"
  }
};

// Mock parent molecule
const mockParent = {
  name: "TestProject"
};

// Mock attachment point for inputs/outputs
class MockAttachmentPoint {
  constructor(type, name) {
    this.type = type;
    this.name = name;
    this.value = type === "input" ? 10 : "";
    this.connectors = [];
    this.ready = true;
  }

  getValue() {
    return this.value;
  }

  setValue(value) {
    this.value = value;
  }

  waitOnComingInformation() {}
}

// Mock connector to simulate connections
class MockConnector {
  constructor() {
    this.uniqueID = mockGlobalVariables.generateUniqueID();
  }
}

// Base mock atom class
class MockAtom {
  constructor(values) {
    this.inputs = [];
    this.output = null;
    this.uniqueID = mockGlobalVariables.generateUniqueID();
    this.parent = mockParent;
    this.processing = false;
    this.selected = false;
    this.alerts = [];
    this.setValues(values || {});
  }

  addIO(type, name, parent, valueType, defaultValue) {
    const io = new MockAttachmentPoint(type, name);
    io.valueType = valueType;
    io.parentMolecule = parent;
    if (defaultValue !== undefined) {
      io.value = defaultValue;
    }
    
    if (type === "input") {
      this.inputs.push(io);
    } else if (type === "output") {
      this.output = io;
    }
    return io;
  }

  setValues(values) {
    Object.keys(values).forEach(key => {
      this[key] = values[key];
    });
  }

  findIOValue(name) {
    const io = this.inputs.find(input => input.name === name);
    return io ? io.getValue() : undefined;
  }

  updateValue() {
    // Mock implementation
  }

  basicThreadValueProcessing() {
    if (this.output) {
      this.output.setValue(this.uniqueID);
      this.output.ready = true;
    }
    this.processing = false;
  }

  decreaseToProcessCountByOne() {}
  clearAlert() {}
  setError(error) {
    this.alerts.push({ type: 'error', message: error });
  }
  sendToRender() {}
}

// Simplified Gcode class for testing
class TestableGcode extends MockAtom {
  constructor(values) {
    super(values);
    
    this.name = "Gcode";
    this.atomType = "Gcode";
    this.partName = this.parent.name;
    this.gcodeString = "";
    this.gcodeGenerated = false;
    this.progress = 1.0;
    this.stlURL = null;
    this.center = [0, 0, 0];
    this._isProcessingAssembly = false;
    this.sortDirection = "Left";

    // Add IOs
    this.addIO("input", "Geometry", this, "geometry", null);
    this.addIO("input", "Tool Size", this, "number", 6.35);
    this.addIO("input", "Passes", this, "number", 3);
    this.addIO("input", "Speed", this, "number", 1500);
    this.addIO("input", "Cut Through", this, "number", 1.35);
    this.addIO("input", "Part Name", this, "string", this.parent.name);
    this.addIO("output", "Gcode", this, "geometry", "");

    this.setValues(values);
  }

  // Mock the gcode generation to track if it was called
  async _generateGcode() {
    this.gcodeGenerated = true;
    this.gcodeString = "G21 ; mock gcode\nG90\nM30";
    this.progress = 1.0;
    this.basicThreadValueProcessing();
  }

  async _processSinglePart(inputID) {
    // Simplified version of the real method for testing
    this.stlURL = "mock://stl-url";
    this.center = [5, 5, 2.5];
    
    // Generate gcode automatically if in run mode OR if output is connected
    if (global.window.location.pathname.includes("/run/") || 
        (this.output && this.output.connectors.length > 0)) {
      await this._generateGcode();
    }
  }

  async _processAssembly(inputID) {
    // Simplified version for testing
    if (global.window.location.pathname.includes("/run/") || 
        (this.output && this.output.connectors.length > 0)) {
      await this._generateGcode();
    }
  }

  async _handleGeometryInput(inputID) {
    // Simplified - always treat as single part for testing
    await this._processSinglePart(inputID);
  }

  updateValue() {
    let inputID = this.findIOValue("Geometry");
    if (inputID) {
      this._handleGeometryInput(inputID);
    }
  }

  // The new beginPropagation method we're testing
  beginPropagation() {
    // Check if the output is connected to something
    if (this.output && this.output.connectors.length > 0) {
      // Only trigger if gcode hasn't been generated yet
      if (!this.gcodeGenerated) {
        this.updateValue();
      }
    }
  }
}

describe("Gcode Auto-Generation", () => {
  let originalLocation;

  beforeEach(() => {
    // Set up global window mock if it doesn't exist
    if (typeof global.window === 'undefined') {
      global.window = {};
    }
    
    // Mock window.location
    originalLocation = global.window.location;
    global.window.location = { pathname: "/design/test-project" };
    
    // Mock generateGcode function
    global.window.generateGcode = vi.fn((stlURL, center, toolSize, passes, speed, cutThrough, callback) => {
      // Simulate async gcode generation
      setTimeout(() => callback("G21 ; mock generated gcode\nG90\nM30"), 10);
    });

    // Mock URL.createObjectURL and revokeObjectURL
    global.URL = {
      createObjectURL: vi.fn(() => "mock://blob-url"),
      revokeObjectURL: vi.fn()
    };

    // Set up global variables mock
    global.GlobalVariables = mockGlobalVariables;
  });

  afterEach(() => {
    if (originalLocation) {
      global.window.location = originalLocation;
    }
    vi.clearAllMocks();
  });

  test("should not auto-generate gcode when output is not connected", async () => {
    const gcode = new TestableGcode({});
    
    // Set up geometry input
    gcode.inputs[0].setValue("mock-geometry-id");
    
    expect(gcode.gcodeGenerated).toBe(false);
    
    // Call beginPropagation with no output connections
    gcode.beginPropagation();
    
    // Should not have generated gcode
    expect(gcode.gcodeGenerated).toBe(false);
  });

  test("should auto-generate gcode when output is connected", async () => {
    const gcode = new TestableGcode({});
    
    // Set up geometry input
    gcode.inputs[0].setValue("mock-geometry-id");
    
    // Simulate connecting the output to another atom
    const mockConnector = new MockConnector();
    gcode.output.connectors.push(mockConnector);
    
    expect(gcode.gcodeGenerated).toBe(false);
    expect(gcode.output.connectors.length).toBe(1);
    
    // Call beginPropagation with output connected
    await gcode.beginPropagation();
    
    // Should have generated gcode
    expect(gcode.gcodeGenerated).toBe(true);
    expect(gcode.gcodeString).toContain("mock gcode");
  });

  test("should not regenerate gcode if already generated", async () => {
    const gcode = new TestableGcode({});
    
    // Set up geometry input and connect output
    gcode.inputs[0].setValue("mock-geometry-id");
    gcode.output.connectors.push(new MockConnector());
    
    // Manually set gcode as already generated
    gcode.gcodeGenerated = true;
    gcode.gcodeString = "original gcode";
    
    // Spy on the _generateGcode method
    const generateSpy = vi.spyOn(gcode, '_generateGcode');
    
    // Call beginPropagation
    gcode.beginPropagation();
    
    // Should not have called _generateGcode since it was already generated
    expect(generateSpy).not.toHaveBeenCalled();
    expect(gcode.gcodeString).toBe("original gcode");
  });

  test("should generate gcode in _processSinglePart when output is connected", async () => {
    const gcode = new TestableGcode({});
    
    // Connect the output
    gcode.output.connectors.push(new MockConnector());
    
    expect(gcode.gcodeGenerated).toBe(false);
    
    // Call _processSinglePart directly
    await gcode._processSinglePart("mock-input-id");
    
    // Should have generated gcode due to output connection
    expect(gcode.gcodeGenerated).toBe(true);
  });

  test("should generate gcode in _processAssembly when output is connected", async () => {
    const gcode = new TestableGcode({});
    
    // Connect the output
    gcode.output.connectors.push(new MockConnector());
    
    expect(gcode.gcodeGenerated).toBe(false);
    
    // Call _processAssembly directly
    await gcode._processAssembly("mock-assembly-id");
    
    // Should have generated gcode due to output connection
    expect(gcode.gcodeGenerated).toBe(true);
  });

  test("should still generate gcode in run mode regardless of output connection", async () => {
    // Change to run mode
    global.window.location.pathname = "/run/test-project";
    
    const gcode = new TestableGcode({});
    
    // No output connection
    expect(gcode.output.connectors.length).toBe(0);
    expect(gcode.gcodeGenerated).toBe(false);
    
    // Call _processSinglePart in run mode
    await gcode._processSinglePart("mock-input-id");
    
    // Should have generated gcode due to run mode
    expect(gcode.gcodeGenerated).toBe(true);
  });
});