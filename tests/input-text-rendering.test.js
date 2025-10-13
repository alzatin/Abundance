import { describe, it, expect } from "vitest";

/**
 * Tests for Input atom text rendering and width calculation logic.
 * These tests verify the algorithm without instantiating the full Input class
 * to avoid complex dependency chains.
 */
describe("Input atom width calculation logic", () => {
  /**
   * Simulates the width calculation algorithm used in Input.draw()
   */
  function calculateInputWidth(nameLength, atomSize = 1/65, canvasMeasureTextMock) {
    const radiusInPixels = atomSize * 1.3 * 1000; // widthToPixels simulation
    
    // Simulate measureText if provided
    const textWidth = canvasMeasureTextMock ? 
      canvasMeasureTextMock(nameLength) : 
      nameLength * 8; // Default: ~8 pixels per character
    
    const padding = 15; // Left padding (5) + right padding (10)
    const minWidth = radiusInPixels * 2.5; // Minimum width
    const maxWidth = radiusInPixels * 6; // Maximum width
    
    return Math.max(minWidth, Math.min(maxWidth, textWidth + padding));
  }

  it("should return minimum width for very short names", () => {
    const atomSize = 1/65;
    const radiusInPixels = atomSize * 1.3 * 1000;
    const minWidth = radiusInPixels * 2.5;
    
    // Test with 1-character name
    const width = calculateInputWidth(1, atomSize);
    
    expect(width).toBe(minWidth);
  });

  it("should expand width for medium-length names", () => {
    const atomSize = 1/65;
    const radiusInPixels = atomSize * 1.3 * 1000;
    const minWidth = radiusInPixels * 2.5;
    
    // Test with 10-character name (should be wider than minimum)
    const shortWidth = calculateInputWidth(3, atomSize);
    const mediumWidth = calculateInputWidth(10, atomSize);
    
    expect(mediumWidth).toBeGreaterThan(shortWidth);
    expect(mediumWidth).toBeGreaterThan(minWidth);
  });

  it("should cap width at maximum for very long names", () => {
    const atomSize = 1/65;
    const radiusInPixels = atomSize * 1.3 * 1000;
    const maxWidth = radiusInPixels * 6;
    
    // Test with very long name (100+ characters)
    const veryLongWidth = calculateInputWidth(100, atomSize);
    
    expect(veryLongWidth).toBe(maxWidth);
  });

  it("should scale properly with different atom sizes", () => {
    const desktopAtomSize = 1/65;
    const mobileAtomSize = 1/30;
    
    // Same name length, different atom sizes
    const desktopWidth = calculateInputWidth(10, desktopAtomSize);
    const mobileWidth = calculateInputWidth(10, mobileAtomSize);
    
    // Mobile atoms are larger, so width should be larger
    expect(mobileWidth).toBeGreaterThan(desktopWidth);
  });

  it("should add padding to text width for medium names", () => {
    const atomSize = 1/65;
    const textLength = 10; // 10 characters (not too long)
    const mockTextWidth = textLength * 8; // 80 pixels
    const padding = 15;
    
    const width = calculateInputWidth(textLength, atomSize, (len) => len * 8);
    
    const radiusInPixels = atomSize * 1.3 * 1000;
    const minWidth = radiusInPixels * 2.5;
    const maxWidth = radiusInPixels * 6;
    
    // Width should be either min, text+padding, or max (whichever fits)
    const expectedWidth = Math.max(minWidth, Math.min(maxWidth, mockTextWidth + padding));
    expect(width).toBe(expectedWidth);
  });
});

/**
 * Tests for the fittingString method logic (text truncation with ellipsis)
 */
describe("Input atom text truncation logic", () => {
  /**
   * Simulates the fittingString method
   */
  function simulateFittingString(str, maxWidth, charWidth = 8) {
    if (!str) return { text: "", truncated: false };
    
    const width = str.length * charWidth;
    const ellipsis = "…";
    const ellipsisWidth = charWidth; // Approximate
    
    if (width <= maxWidth || width <= ellipsisWidth) {
      return { text: str, truncated: false };
    } else {
      let len = str.length;
      let testWidth = width;
      
      while (testWidth >= maxWidth - ellipsisWidth && len-- > 0) {
        testWidth = len * charWidth;
      }
      
      return { text: str.substring(0, len) + ellipsis, truncated: true };
    }
  }

  it("should not truncate text that fits within maxWidth", () => {
    const result = simulateFittingString("Short", 100);
    
    expect(result.truncated).toBe(false);
    expect(result.text).toBe("Short");
  });

  it("should truncate text that exceeds maxWidth", () => {
    const result = simulateFittingString("VeryLongInputName", 80);
    
    expect(result.truncated).toBe(true);
    expect(result.text).toContain("…");
    expect(result.text.length).toBeLessThan("VeryLongInputName".length);
  });

  it("should use actual atom width for truncation calculation", () => {
    const atomSize = 1/65;
    const radiusInPixels = atomSize * 1.3 * 1000;
    const atomWidth = radiusInPixels * 4; // Example width
    const maxTextWidth = atomWidth - 10; // Subtract padding
    
    const longName = "ThisIsAVeryLongInputName";
    const result = simulateFittingString(longName, maxTextWidth);
    
    // Text should be truncated to fit
    const finalWidth = result.text.length * 8; // Mock measurement
    expect(finalWidth).toBeLessThanOrEqual(maxTextWidth);
  });

  it("should handle empty strings gracefully", () => {
    const result = simulateFittingString("", 100);
    
    expect(result.truncated).toBe(false);
    expect(result.text).toBe("");
  });
});
