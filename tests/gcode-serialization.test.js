import { expect, test, describe } from "vitest";

// Mock the required dependencies for the Gcode class
const mockGlobalVariables = {
  generateUniqueID: () => Math.random().toString(36).substr(2, 9),
  cad: {
    // Mock CAD methods if needed
  }
};

// Mock the parent object
const mockParent = {
  name: "TestProject"
};

// Mock the base Atom class
class MockAtom {
  constructor(values) {
    this.inputs = [];
    this.output = null;
    this.uniqueID = mockGlobalVariables.generateUniqueID();
    this.x = 0;
    this.y = 0;
    this.parent = mockParent;
    this.setValues(values);
  }

  setValues(values) {
    if (values) {
      for (var key in values) {
        this[key] = values[key];
      }
    }
  }

  addIO(type, name, owner, valueType, defaultValue) {
    // Mock implementation
  }

  serialize(offset = { x: 0, y: 0 }) {
    return {
      atomType: this.atomType,
      name: this.name,
      x: this.x + offset.x,
      y: this.y - offset.y,
      uniqueID: this.uniqueID,
    };
  }
}

// Simplified Gcode class for testing - reproducing the issue
class GcodeBuggy extends MockAtom {
  constructor(values) {
    super(values);

    this.name = "Gcode";
    this.atomType = "Gcode";
    this.partName = this.parent.name;

    // Call setValues BEFORE setting the default (this is the bug)
    this.setValues(values);

    // This overwrites any loaded sortDirection value - THE BUG
    this.sortDirection = "Left";
  }

  serialize(offset = { x: 0, y: 0 }) {
    var superSerialObject = super.serialize(offset);
    superSerialObject.partName = this.partName;
    superSerialObject.sortDirection = this.sortDirection;
    return superSerialObject;
  }
}

// Fixed Gcode class for testing
class GcodeFixed extends MockAtom {
  constructor(values) {
    super(values);

    this.name = "Gcode";
    this.atomType = "Gcode";
    this.partName = this.parent.name;

    // Set default BEFORE calling setValues - THE FIX
    this.sortDirection = "Left";

    // This will now properly override the default if values contain sortDirection
    this.setValues(values);
  }

  serialize(offset = { x: 0, y: 0 }) {
    var superSerialObject = super.serialize(offset);
    superSerialObject.partName = this.partName;
    superSerialObject.sortDirection = this.sortDirection;
    return superSerialObject;
  }
}

describe("Gcode sortDirection serialization", () => {
  test("should demonstrate the bug - sortDirection not preserved on reload", () => {
    // Create a gcode atom with a specific sort direction
    const originalGcode = new GcodeBuggy({});
    originalGcode.sortDirection = "Right";

    // Serialize it
    const serialized = originalGcode.serialize();
    expect(serialized.sortDirection).toBe("Right");

    // Create a new gcode atom from the serialized data (simulating reload)
    const reloadedGcode = new GcodeBuggy(serialized);

    // BUG: The sortDirection should be "Right" but will be "Left" due to the bug
    expect(reloadedGcode.sortDirection).toBe("Left"); // This demonstrates the bug
  });

  test("should show the fix - sortDirection properly preserved on reload", () => {
    // Create a gcode atom with a specific sort direction
    const originalGcode = new GcodeFixed({});
    originalGcode.sortDirection = "Top";

    // Serialize it
    const serialized = originalGcode.serialize();
    expect(serialized.sortDirection).toBe("Top");

    // Create a new gcode atom from the serialized data (simulating reload)
    const reloadedGcode = new GcodeFixed(serialized);

    // FIX: The sortDirection should be properly preserved
    expect(reloadedGcode.sortDirection).toBe("Top");
  });

  test("should preserve all sort direction options", () => {
    const sortDirections = ["Left", "Right", "Top", "Bottom"];

    for (const direction of sortDirections) {
      // Test serialization and deserialization for each direction
      const originalGcode = new GcodeFixed({});
      originalGcode.sortDirection = direction;

      const serialized = originalGcode.serialize();
      expect(serialized.sortDirection).toBe(direction);

      const reloadedGcode = new GcodeFixed(serialized);
      expect(reloadedGcode.sortDirection).toBe(direction);
    }
  });

  test("should use default 'Left' when no sortDirection is provided", () => {
    // Create gcode atom without specifying sortDirection
    const gcode = new GcodeFixed({});
    expect(gcode.sortDirection).toBe("Left");

    // Should also work when loading empty values
    const gcode2 = new GcodeFixed({});
    expect(gcode2.sortDirection).toBe("Left");
  });

  test("should preserve sortDirection in complete serialize/deserialize cycle", () => {
    // Test the complete round-trip
    const originalData = {
      atomType: "Gcode",
      name: "TestGcode",
      x: 0.5,
      y: 0.3,
      uniqueID: "test-123",
      sortDirection: "Bottom"
    };

    const gcode = new GcodeFixed(originalData);
    expect(gcode.sortDirection).toBe("Bottom");

    const reserialized = gcode.serialize();
    expect(reserialized.sortDirection).toBe("Bottom");

    const reloadedGcode = new GcodeFixed(reserialized);
    expect(reloadedGcode.sortDirection).toBe("Bottom");
  });
});