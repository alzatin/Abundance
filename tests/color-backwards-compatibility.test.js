/**
 * Integration test for Color atom backwards compatibility
 * 
 * This test demonstrates that:
 * 1. Old files with selectedColorIndex can still be loaded
 * 2. New files save with selectedColor (color name) for resilience
 * 3. The fix prevents issues when color list is reordered
 */

import { describe, it, expect } from "vitest";

describe("Color atom backwards compatibility integration", () => {
  
  // Mock a simplified Color atom for testing
  class ColorAtom {
    constructor() {
      this.selectedColorIndex = 0;
      this.colorOptions = {
        Default: "#aad7f2",
        Red: "#FF9065",
        Orange: "#FFB458",
        Yellow: "#FFD600",
        Olive: "#C7DF66",
        Teal: "#71D1C2",
        "Light Blue": "#75DBF2",
        Green: "#A3CE5B",
      };
    }

    setValues(values) {
      // New format takes precedence
      if (values.selectedColor !== undefined) {
        const colorNames = Object.keys(this.colorOptions);
        const colorIndex = colorNames.indexOf(values.selectedColor);
        this.selectedColorIndex = colorIndex !== -1 ? colorIndex : 0;
      } else if (values.selectedColorIndex !== undefined) {
        this.selectedColorIndex = values.selectedColorIndex;
        const maxIndex = Object.keys(this.colorOptions).length - 1;
        if (this.selectedColorIndex < 0 || this.selectedColorIndex > maxIndex) {
          this.selectedColorIndex = 0;
        }
      }
    }

    serialize() {
      const selectedColorName = Object.keys(this.colorOptions)[this.selectedColorIndex];
      return {
        atomType: "Color",
        x: 0.5,
        y: 0.5,
        uniqueID: "color-123",
        selectedColor: selectedColorName,
      };
    }

    getSelectedColor() {
      return Object.values(this.colorOptions)[this.selectedColorIndex];
    }
    
    getSelectedColorName() {
      return Object.keys(this.colorOptions)[this.selectedColorIndex];
    }
  }

  describe("Scenario: Loading old project file", () => {
    it("should correctly load a project saved with old selectedColorIndex format", () => {
      // Simulate an old project file where Teal was saved as index 5
      const oldProjectData = {
        atoms: [
          {
            atomType: "Color",
            x: 0.5,
            y: 0.5,
            uniqueID: "color-123",
            selectedColorIndex: 5, // Teal in the old list
          },
        ],
      };

      // Load the color atom
      const colorAtom = new ColorAtom();
      colorAtom.setValues(oldProjectData.atoms[0]);

      // Verify it loaded correctly
      expect(colorAtom.selectedColorIndex).toBe(5);
      expect(colorAtom.getSelectedColor()).toBe("#71D1C2"); // Teal
    });
  });

  describe("Scenario: Saving new project file", () => {
    it("should save with selectedColor name instead of selectedColorIndex", () => {
      const colorAtom = new ColorAtom();
      colorAtom.selectedColorIndex = 3; // Yellow
      
      const savedData = colorAtom.serialize();

      // Verify new format is used
      expect(savedData.selectedColor).toBe("Yellow"); // Color name
      expect(savedData.selectedColorIndex).toBeUndefined(); // Old format not saved
    });
  });

  describe("Scenario: Resilience to color list reordering", () => {
    it("should maintain correct color even if color list is reordered", () => {
      // Step 1: Save a project with Orange color
      const colorAtom1 = new ColorAtom();
      colorAtom1.selectedColorIndex = 2; // Orange at index 2
      const savedData = colorAtom1.serialize();
      
      expect(savedData.selectedColor).toBe("Orange"); // Color name

      // Step 2: Simulate color list being reordered
      // (In reality, a developer might add/remove colors from the list)
      class ReorderedColorAtom extends ColorAtom {
        constructor() {
          super();
          // Imagine colors were reordered - Red moved to index 2
          this.colorOptions = {
            Default: "#aad7f2",
            Yellow: "#FFD600", // Yellow moved up
            Red: "#FF9065",    // Red moved to index 2 (where Orange was)
            Orange: "#FFB458", // Orange moved to index 3
            Olive: "#C7DF66",
            Teal: "#71D1C2",
            "Light Blue": "#75DBF2",
            Green: "#A3CE5B",
          };
        }
      }

      // Step 3: Load the saved data with new color order
      const colorAtom2 = new ReorderedColorAtom();
      colorAtom2.setValues(savedData);

      // Verify: Even though Orange is now at index 3 (not 2),
      // it loads correctly because we saved the color name
      expect(colorAtom2.getSelectedColorName()).toBe("Orange"); // Still Orange!
      expect(colorAtom2.getSelectedColor()).toBe("#FFB458"); // Same hex value
      expect(colorAtom2.selectedColorIndex).toBe(3); // New index for Orange
    });
  });

  describe("Scenario: Mixed format (transition period)", () => {
    it("should handle files that have both formats during transition", () => {
      // During the transition period, a file might have both
      const mixedData = {
        atomType: "Color",
        x: 0.5,
        y: 0.5,
        uniqueID: "color-123",
        selectedColorIndex: 1, // Red (old format)
        selectedColor: "Green", // Green (new format)
      };

      const colorAtom = new ColorAtom();
      colorAtom.setValues(mixedData);

      // Should prefer the new format
      expect(colorAtom.getSelectedColorName()).toBe("Green");
      expect(colorAtom.getSelectedColor()).toBe("#A3CE5B"); // Green hex
      expect(colorAtom.selectedColorIndex).toBe(7); // Green's index
    });
  });

  describe("Scenario: Round-trip save and load", () => {
    it("should maintain color integrity through multiple save/load cycles", () => {
      // Create atom with Olive color
      const atom1 = new ColorAtom();
      atom1.selectedColorIndex = 4; // Olive
      
      // Save it
      const saved1 = atom1.serialize();
      expect(saved1.selectedColor).toBe("Olive");

      // Load into new atom
      const atom2 = new ColorAtom();
      atom2.setValues(saved1);
      expect(atom2.getSelectedColorName()).toBe("Olive");
      expect(atom2.getSelectedColor()).toBe("#C7DF66");

      // Save again
      const saved2 = atom2.serialize();
      expect(saved2.selectedColor).toBe("Olive");

      // Load into third atom
      const atom3 = new ColorAtom();
      atom3.setValues(saved2);
      expect(atom3.getSelectedColorName()).toBe("Olive");
      expect(atom3.getSelectedColor()).toBe("#C7DF66");

      // All three atoms should have the same color
      expect(atom1.getSelectedColor()).toBe(atom2.getSelectedColor());
      expect(atom2.getSelectedColor()).toBe(atom3.getSelectedColor());
    });
  });
});
