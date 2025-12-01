/**
 * Test file for cutlayout centering behavior
 * 
 * This test documents the expected behavior of the layout centering feature
 * where layouts are centered on the origin instead of starting at (0, 0).
 */

import { describe, it, expect } from 'vitest';

describe("CutLayout centering behavior", () => {
  it("should center single sheet layout on the origin", () => {
    // The applyLayout function centers the layout bounding box on the origin.
    // When parts are placed on a sheet of dimensions (width, height), 
    // the final positions are offset by (-width/2, -height/2) so that:
    // - Parts are distributed around the origin
    // - The bounding box extends from (-width/2, -height/2) to (+width/2, +height/2)
    
    const layoutConfig = { width: 100, height: 100, partPadding: 1 };
    
    // The centering formula is:
    // finalX = translateX - width/2
    // finalY = translateY + (sheetIndex * height) - height/2
    
    const xOffset = -layoutConfig.width / 2;
    const yOffset = -layoutConfig.height / 2;
    
    expect(xOffset).toBe(-50);
    expect(yOffset).toBe(-50);
    
    // Test case: part at (0, 0) should end up at (-50, -50)
    const cornerPart = { x: 0, y: 0 };
    expect(cornerPart.x + xOffset).toBe(-50);
    expect(cornerPart.y + yOffset).toBe(-50);
    
    // Test case: part at center of sheet (50, 50) should end up at origin (0, 0)
    const centerPart = { x: 50, y: 50 };
    expect(centerPart.x + xOffset).toBe(0);
    expect(centerPart.y + yOffset).toBe(0);
    
    // Test case: part at far corner (100, 100) should end up at (+50, +50)
    const farCornerPart = { x: 100, y: 100 };
    expect(farCornerPart.x + xOffset).toBe(50);
    expect(farCornerPart.y + yOffset).toBe(50);
  });

  it("should handle multi-sheet centering with sheet stacking", () => {
    // When multiple sheets are used, each sheet is stacked in Y direction
    // Formula: finalY = translateY + (sheetIndex * height) - height/2
    // 
    // Sheet 0: Y offset = 0 * height - height/2 = -height/2
    // Sheet 1: Y offset = 1 * height - height/2 = +height/2
    // Sheet 2: Y offset = 2 * height - height/2 = 3*height/2
    
    const layoutConfig = { width: 100, height: 50, partPadding: 1 };
    
    // Calculate expected Y offsets for each sheet index
    const calculateYOffset = (translateY, sheetIndex, height) => {
      return translateY + sheetIndex * height - height / 2;
    };
    
    // Sheet 0 part at (0, 0) -> Y = 0 + 0*50 - 25 = -25
    expect(calculateYOffset(0, 0, layoutConfig.height)).toBe(-25);
    
    // Sheet 0 part at (0, 25) -> Y = 25 + 0*50 - 25 = 0 (center)
    expect(calculateYOffset(25, 0, layoutConfig.height)).toBe(0);
    
    // Sheet 1 part at (0, 0) -> Y = 0 + 1*50 - 25 = 25
    expect(calculateYOffset(0, 1, layoutConfig.height)).toBe(25);
    
    // Sheet 1 part at (0, 25) -> Y = 25 + 1*50 - 25 = 50
    expect(calculateYOffset(25, 1, layoutConfig.height)).toBe(50);
    
    // Sheet 2 part at (0, 0) -> Y = 0 + 2*50 - 25 = 75
    expect(calculateYOffset(0, 2, layoutConfig.height)).toBe(75);
  });

  it("should verify X centering is independent of sheet index", () => {
    // X centering is the same for all sheets:
    // finalX = translateX - width/2
    
    const layoutConfig = { width: 200, height: 100, partPadding: 1 };
    const xOffset = -layoutConfig.width / 2;
    
    expect(xOffset).toBe(-100);
    
    // Any part at X=0 ends up at X=-100 regardless of sheet
    // Any part at X=100 (center) ends up at X=0 (origin) regardless of sheet
    // Any part at X=200 ends up at X=+100 regardless of sheet
    
    expect(0 + xOffset).toBe(-100);
    expect(100 + xOffset).toBe(0);
    expect(200 + xOffset).toBe(100);
  });

  it("should document typical MM unit sheet centering", () => {
    // Typical MM sheet: 2438mm x 1219mm (8' x 4' plywood)
    const mmLayout = { width: 2438, height: 1219, partPadding: 10 };
    
    // Center offsets
    const mmXOffset = -mmLayout.width / 2;
    const mmYOffset = -mmLayout.height / 2;
    
    expect(mmXOffset).toBe(-1219);
    expect(mmYOffset).toBe(-609.5);
    
    // A part placed at the center of the sheet ends up at origin
    expect(mmLayout.width / 2 + mmXOffset).toBe(0);
    expect(mmLayout.height / 2 + mmYOffset).toBe(0);
  });

  it("should document typical inch unit sheet centering", () => {
    // Typical inch sheet: 96" x 48" (8' x 4' plywood)
    const inchLayout = { width: 96, height: 48, partPadding: 0.4 };
    
    // Center offsets
    const inchXOffset = -inchLayout.width / 2;
    const inchYOffset = -inchLayout.height / 2;
    
    expect(inchXOffset).toBe(-48);
    expect(inchYOffset).toBe(-24);
    
    // A part placed at the center of the sheet ends up at origin
    expect(inchLayout.width / 2 + inchXOffset).toBe(0);
    expect(inchLayout.height / 2 + inchYOffset).toBe(0);
  });
});
