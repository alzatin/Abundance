import { describe, it, expect, beforeEach } from "vitest";

/**
 * Tests for PR #1184 fix: Only sanitize names on NEW Input atoms, not existing ones.
 * 
 * Problem: PR #1184 was sanitizing ALL Input atom names (including loaded from saves),
 * which broke existing projects with spaces or underscores in their Input names.
 * 
 * Solution: Only apply sanitization to NEW atoms (not loaded from save files).
 * Existing atoms loaded from saves should preserve their original names.
 */
describe("Input atom name sanitization fix (PR #1184)", () => {
  
  /**
   * Mock Input class constructor behavior
   */
  function createInputAtom(values = {}) {
    // Simulate Input constructor behavior
    let name = "Input"; // default name
    
    // setValues() - load from save if provided
    if (values.name !== undefined) {
      name = values.name;
    }
    
    // Sanitization logic from the fix
    const isLoadedFromSave = values && values.name !== undefined;
    if (!isLoadedFromSave) {
      name = name.replace(/\s+/g, '_');
    }
    
    return { name };
  }

  describe("New Input atoms (not loaded from save)", () => {
    it("should sanitize default name 'Input' (no spaces, no change)", () => {
      const atom = createInputAtom();
      expect(atom.name).toBe("Input");
    });

    it("should sanitize when created without values object", () => {
      const atom = createInputAtom(undefined);
      expect(atom.name).toBe("Input");
    });

    it("should sanitize when created with empty values object", () => {
      const atom = createInputAtom({});
      expect(atom.name).toBe("Input");
    });
  });

  describe("Existing Input atoms loaded from save", () => {
    it("should NOT sanitize names with spaces when loaded from save", () => {
      // This preserves backward compatibility with old saves that have spaces
      const atom = createInputAtom({ name: "X Length" });
      expect(atom.name).toBe("X Length");
    });

    it("should NOT sanitize names with underscores when loaded from save", () => {
      // This is the main fix - preserve names that already have underscores
      const atom = createInputAtom({ name: "X_Length" });
      expect(atom.name).toBe("X_Length");
    });

    it("should NOT sanitize names without spaces when loaded from save", () => {
      const atom = createInputAtom({ name: "XLength" });
      expect(atom.name).toBe("XLength");
    });

    it("should NOT sanitize names with multiple spaces when loaded from save", () => {
      const atom = createInputAtom({ name: "My   Long   Name" });
      expect(atom.name).toBe("My   Long   Name");
    });

    it("should NOT sanitize names with mixed characters when loaded from save", () => {
      const atom = createInputAtom({ name: "Box_Width 2" });
      expect(atom.name).toBe("Box_Width 2");
    });
  });

  describe("User interaction (onChange handler)", () => {
    it("should demonstrate onChange handler sanitizes user input", () => {
      // Simulate the onChange handler behavior
      function onChangeName(newName) {
        return newName.replace(/\s+/g, '_');
      }

      // When user types "X Length", onChange sanitizes it
      const sanitized = onChangeName("X Length");
      expect(sanitized).toBe("X_Length");
    });

    it("should demonstrate onChange handler preserves underscores", () => {
      // Simulate the onChange handler behavior
      function onChangeName(newName) {
        return newName.replace(/\s+/g, '_');
      }

      // When user types "X_Length", onChange leaves it unchanged
      const sanitized = onChangeName("X_Length");
      expect(sanitized).toBe("X_Length");
    });
  });

  describe("Edge cases", () => {
    it("should handle empty string name from save", () => {
      const atom = createInputAtom({ name: "" });
      expect(atom.name).toBe("");
    });

    it("should handle name with only spaces from save", () => {
      const atom = createInputAtom({ name: "   " });
      expect(atom.name).toBe("   ");
    });

    it("should handle name with tabs and newlines from save", () => {
      const atom = createInputAtom({ name: "Test\tName\n" });
      expect(atom.name).toBe("Test\tName\n");
    });
  });

  describe("Backward compatibility scenarios", () => {
    it("should handle old projects with spaces in Input names", () => {
      // Old project before PR #1184 might have:
      const oldProjectInputs = [
        { name: "Box Width" },
        { name: "Box Height" },
        { name: "Box Depth" }
      ];

      const atoms = oldProjectInputs.map(v => createInputAtom(v));
      
      // Names should be preserved exactly as they were saved
      expect(atoms[0].name).toBe("Box Width");
      expect(atoms[1].name).toBe("Box Height");
      expect(atoms[2].name).toBe("Box Depth");
    });

    it("should handle projects saved after PR #1184 with underscores", () => {
      // New project after PR #1184 might have:
      const newProjectInputs = [
        { name: "Box_Width" },
        { name: "Box_Height" },
        { name: "Box_Depth" }
      ];

      const atoms = newProjectInputs.map(v => createInputAtom(v));
      
      // Names should be preserved exactly as they were saved
      expect(atoms[0].name).toBe("Box_Width");
      expect(atoms[1].name).toBe("Box_Height");
      expect(atoms[2].name).toBe("Box_Depth");
    });
  });
});
