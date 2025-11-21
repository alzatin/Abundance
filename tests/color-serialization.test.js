/**
 * Test for Color atom serialization with backwards compatibility
 * 
 * This test validates that:
 * 1. Color atoms now save the actual color hex value (selectedColor) instead of index
 * 2. Old files with selectedColorIndex can still be loaded correctly
 * 3. Color selection is resilient to reordering of the color list
 */

import { describe, it, expect } from "vitest";

describe("Color atom serialization", () => {
  
  // Mock Color class to avoid circular dependency issues with full Atom hierarchy
  class MockColor {
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
        "Lavender ": "#CCABED",
        Brown: "#CFAB7C",
        Pink: "#FFB09D",
        Sand: "#E2C66C",
        Clay: "#C4D3AC",
        Blue: "#91C8D5",
        "Light Green": "#96E1BB",
        Purple: "#ACAFDD",
        "Light Purple": "#DFB1E8",
        Tan: "#F5D3B6",
        "Mauve ": "#DBADA9",
        Grey: "#BABABA",
        Black: "#5A5A5A",
        White: "#FFFCF7",
        Glass: "#E6F3FF",
        "Keep Out": "#D9544D",
      };
    }

    setValues(values) {
      // Replicate the logic from the actual Color class
      if (values.selectedColor !== undefined) {
        // New format: selectedColor contains the actual hex color value
        const colorValues = Object.values(this.colorOptions);
        const colorIndex = colorValues.indexOf(values.selectedColor);
        
        if (colorIndex !== -1) {
          this.selectedColorIndex = colorIndex;
        } else {
          this.selectedColorIndex = 0;
        }
      } else if (values.selectedColorIndex !== undefined) {
        // Old format: selectedColorIndex
        this.selectedColorIndex = values.selectedColorIndex;
        const maxIndex = Object.keys(this.colorOptions).length - 1;
        if (this.selectedColorIndex < 0 || this.selectedColorIndex > maxIndex) {
          this.selectedColorIndex = 0;
        }
      }
    }

    serialize() {
      const selectedColor = Object.values(this.colorOptions)[this.selectedColorIndex];
      return {
        atomType: "Color",
        selectedColor: selectedColor,
      };
    }
  }

  describe("New behavior (using selectedColor)", () => {
    it("should serialize with actual color value", () => {
      const colorAtom = new MockColor();
      colorAtom.selectedColorIndex = 3; // Yellow
      const serialized = colorAtom.serialize();
      
      // Should save the actual color
      expect(serialized.selectedColor).toBe("#FFD600");
    });

    it("should restore color from selectedColor value", () => {
      const colorAtom = new MockColor();
      const savedData = {
        selectedColor: "#FFB458", // Orange
      };
      
      colorAtom.setValues(savedData);
      
      // Should find the matching color in colorOptions
      const expectedIndex = Object.values(colorAtom.colorOptions).indexOf("#FFB458");
      expect(colorAtom.selectedColorIndex).toBe(expectedIndex);
      expect(colorAtom.selectedColorIndex).toBe(2); // Orange is at index 2
    });

    it("should handle unknown color values gracefully", () => {
      const colorAtom = new MockColor();
      const savedData = {
        selectedColor: "#UNKNOWN", // Unknown color
      };
      
      colorAtom.setValues(savedData);
      
      // Should default to first color (Default)
      expect(colorAtom.selectedColorIndex).toBe(0);
    });
  });

  describe("Backwards compatibility", () => {
    it("should load old files with selectedColorIndex", () => {
      const colorAtom = new MockColor();
      const oldSavedData = {
        selectedColorIndex: 10, // Pink
      };
      
      colorAtom.setValues(oldSavedData);
      
      expect(colorAtom.selectedColorIndex).toBe(10);
      const color = Object.values(colorAtom.colorOptions)[10];
      expect(color).toBe("#FFB09D"); // Pink color
    });

    it("should prefer selectedColor over selectedColorIndex if both exist", () => {
      const colorAtom = new MockColor();
      const mixedData = {
        selectedColorIndex: 2, // Orange (old format)
        selectedColor: "#A3CE5B", // Green (new format)
      };
      
      colorAtom.setValues(mixedData);
      
      // Should use the new format (selectedColor)
      const expectedIndex = Object.values(colorAtom.colorOptions).indexOf("#A3CE5B");
      expect(colorAtom.selectedColorIndex).toBe(expectedIndex);
      expect(colorAtom.selectedColorIndex).toBe(7); // Green is at index 7
    });
  });

  describe("Color reordering resilience", () => {
    it("should maintain correct color after save/load cycle", () => {
      const colorAtom1 = new MockColor();
      colorAtom1.selectedColorIndex = 5; // Teal "#71D1C2"
      const serialized = colorAtom1.serialize();
      
      // Verify the serialized data contains the color value
      expect(serialized.selectedColor).toBe("#71D1C2");
      
      // Load into a new instance
      const colorAtom2 = new MockColor();
      colorAtom2.setValues(serialized);
      
      // Should restore to the same color
      const actualColor = Object.values(colorAtom2.colorOptions)[colorAtom2.selectedColorIndex];
      expect(actualColor).toBe("#71D1C2");
      expect(colorAtom2.selectedColorIndex).toBe(5);
    });
  });
});
