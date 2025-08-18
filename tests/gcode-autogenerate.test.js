import { describe, test, expect, vi, beforeEach } from "vitest";

// Mock the global objects and methods
global.window = {
  location: {
    pathname: "/edit/" // Not in run mode
  },
  generateGcode: vi.fn((stlURL, center, toolSize, passes, speed, cutThrough, callback) => {
    // Simulate successful gcode generation
    setTimeout(() => {
      callback("G21\nG90\nM3 S1500\nG0 X0 Y0\nM30");
    }, 10);
  })
};

global.URL = {
  createObjectURL: vi.fn(() => "blob://test-url"),
  revokeObjectURL: vi.fn()
};

// Mock GlobalVariables
const mockGlobalVariables = {
  generateUniqueID: vi.fn(() => `test-id-${Math.random()}`),
  cad: {
    isAssembly: vi.fn(() => Promise.resolve(false)),
    visExport: vi.fn(() => Promise.resolve()),
    downExport: vi.fn(() => Promise.resolve(new Blob(["test"], { type: "application/octet-stream" }))),
    getBoundingBox: vi.fn(() => Promise.resolve({
      min: [0, 0, 0],
      max: [10, 10, 5]
    })),
    visualizeGcode: vi.fn(() => Promise.resolve())
  },
  topLevelMolecule: {
    unitsKey: "MM"
  }
};

vi.doMock("../src/js/globalvariables.js", () => ({
  default: mockGlobalVariables
}));

// Mock the parent Atom class
class MockAtom {
  constructor(values) {
    this.inputs = [];
    this.output = null;
    this.uniqueID = mockGlobalVariables.generateUniqueID();
    this.parent = { name: "TestParent" };
    this.processing = false;
    this.selected = false;
    
    if (values) {
      this.setValues(values);
    }
  }
  
  setValues(values) {
    Object.assign(this, values);
  }
  
  addIO(type, name, atom, valueType, defaultValue) {
    const io = {
      name,
      type,
      valueType,
      value: defaultValue,
      connectors: [],
      ready: true,
      getValue: () => io.value,
      setValue: (value) => io.value = value
    };
    
    if (type === "input") {
      this.inputs.push(io);
    } else if (type === "output") {
      this.output = io;
    }
  }
  
  findIOValue(name) {
    const io = this.inputs.find(input => input.name === name);
    return io ? io.value : null;
  }
  
  updateValue() {
    // Base implementation - to be overridden
  }
  
  basicThreadValueProcessing() {
    this.processing = false;
    if (this.output) {
      this.output.ready = true;
    }
  }
  
  sendToRender() {
    // Mock implementation
  }
  
  setError(error) {
    this.error = error;
  }
  
  serialize() {
    return {
      uniqueID: this.uniqueID,
      name: this.name,
      atomType: this.atomType
    };
  }
}

vi.doMock("../src/prototypes/atom.js", () => ({
  default: MockAtom
}));

// Import Gcode after mocks are set up
const { default: Gcode } = await import("../src/molecules/gcode.js");

describe("Gcode Autogenerate", () => {
  let gcode;
  
  beforeEach(() => {
    vi.clearAllMocks();
    gcode = new Gcode({});
    
    // Set up a valid geometry input
    const geometryInput = gcode.inputs.find(input => input.name === "Geometry");
    if (geometryInput) {
      geometryInput.value = "test-geometry-id";
      geometryInput.connectors = [{ id: "test-connector" }]; // Simulate connected input
    }
  });

  test("should auto-generate gcode when updateValue is called with geometry", async () => {
    const generateSpy = vi.spyOn(gcode, "_generateGcode");
    
    // Simulate updateValue being called (as happens when input changes)
    await gcode.updateValue();
    
    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Should have called _generateGcode automatically
    expect(generateSpy).toHaveBeenCalled();
  });

  test("should auto-generate gcode even when not in run mode and output not connected", async () => {
    // Ensure we're not in run mode
    window.location.pathname = "/edit/";
    
    // Ensure output is not connected
    if (gcode.output) {
      gcode.output.connectors = [];
    }
    
    const generateSpy = vi.spyOn(gcode, "_generateGcode");
    
    // Simulate updateValue being called
    await gcode.updateValue();
    
    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Should still generate gcode automatically (this is the new behavior)
    expect(generateSpy).toHaveBeenCalled();
  });

  test("should trigger updateValue when beginPropagation is called with connected geometry", () => {
    const updateValueSpy = vi.spyOn(gcode, "updateValue");
    
    // Ensure geometry input is connected
    const geometryInput = gcode.inputs.find(input => input.name === "Geometry");
    if (geometryInput) {
      geometryInput.connectors = [{ id: "test-connector" }];
    }
    
    // Reset gcode generation flag
    gcode.gcodeGenerated = false;
    
    gcode.beginPropagation();
    
    expect(updateValueSpy).toHaveBeenCalled();
  });

  test("should not trigger updateValue when beginPropagation is called without connected geometry", () => {
    const updateValueSpy = vi.spyOn(gcode, "updateValue");
    
    // Ensure geometry input is not connected
    const geometryInput = gcode.inputs.find(input => input.name === "Geometry");
    if (geometryInput) {
      geometryInput.connectors = [];
    }
    
    gcode.beginPropagation();
    
    expect(updateValueSpy).not.toHaveBeenCalled();
  });

  test("should still allow manual gcode generation via _generateGcode method", async () => {
    const gcodeGeneratedPromise = new Promise(resolve => {
      const originalCallback = window.generateGcode;
      window.generateGcode = (...args) => {
        const callback = args[6]; // callback is the 7th argument
        setTimeout(() => {
          callback("G21\nG90\nM3 S1500\nG0 X0 Y0\nM30");
          resolve();
        }, 10);
      };
    });
    
    // Manually call _generateGcode
    await gcode._generateGcode();
    
    // Wait for gcode generation to complete
    await gcodeGeneratedPromise;
    
    // Should have generated gcode
    expect(gcode.gcodeGenerated).toBe(true);
    expect(gcode.gcodeString).toContain("G21");
  });

  test("should auto-generate for single parts", async () => {
    // Mock isAssembly to return false (single part)
    mockGlobalVariables.cad.isAssembly.mockResolvedValue(false);
    
    const generateSpy = vi.spyOn(gcode, "_generateGcode");
    
    await gcode.updateValue();
    
    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(generateSpy).toHaveBeenCalled();
  });

  test("should auto-generate for assemblies", async () => {
    // Mock isAssembly to return true (assembly)
    mockGlobalVariables.cad.isAssembly.mockResolvedValue(true);
    
    // Mock assembly processing methods
    gcode._extractPartsFromAssembly = vi.fn().mockResolvedValue(["part1", "part2"]);
    gcode._sortParts = vi.fn().mockResolvedValue(["part1", "part2"]);
    gcode._generateSequentialGcode = vi.fn().mockResolvedValue();
    
    const generateSequentialSpy = vi.spyOn(gcode, "_generateSequentialGcode");
    
    await gcode.updateValue();
    
    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(generateSequentialSpy).toHaveBeenCalled();
  });
});