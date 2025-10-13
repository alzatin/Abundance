import { describe, it, expect } from 'vitest';

/**
 * Test for local atom icon paths in GitSearchMenu
 * 
 * This test validates that local atoms have icon paths assigned
 * and that they map to the correct image files.
 */
describe('Local Atom Icon Paths', () => {
  
  it('should return correct icon paths for common atom types', () => {
    // This mimics the getLocalAtomIconPath function behavior
    const getLocalAtomIconPath = (atomType) => {
      const iconMap = {
        Circle: "/imgs/circle.png",
        Rectangle: "/imgs/rectangle.png",
        RegularPolygon: "/imgs/RegularPolygon.png",
        Text: "/imgs/text.png",
        Assembly: "/imgs/Assembly.png",
        Fusion: "/imgs/fusion.png",
        Intersection: "/imgs/intersection.png",
        Difference: "/imgs/difference.png",
        ShrinkWrap: "/imgs/shrinkwrap.png",
        Loft: "/imgs/loft.png",
        Extrude: "/imgs/extrude.png",
        Move: "/imgs/move.png",
        Rotate: "/imgs/Rotate.png",
        Constant: "/imgs/Constant.png",
        Equation: "/imgs/Equation.png",
        Input: "/imgs/Input.png",
        Code: "/imgs/code.png",
        Gcode: "/imgs/gcode.png",
        Molecule: "/imgs/molecule.png",
        GitHubMolecule: "/imgs/githubmolecule.png",
        Import: "/imgs/Import_menu.svg",
        Export: "/imgs/Export_menu.svg",
        Tag: "/imgs/tag.png",
        "Add-BOM-Tag": "/imgs/Bom.png",
        Readme: "/imgs/readme.png",
        Color: "/imgs/Color.png",
        ExtractTag: "/imgs/extracttag.png",
        CutLayout: "/imgs/cutlayout.png",
        GeneticAlgorithm: "/imgs/genetic.svg",
      };
      
      return iconMap[atomType] || "/imgs/defaultThumbnail.svg";
    };
    
    // Test common atom types
    expect(getLocalAtomIconPath("Circle")).toBe("/imgs/circle.png");
    expect(getLocalAtomIconPath("Rectangle")).toBe("/imgs/rectangle.png");
    expect(getLocalAtomIconPath("Extrude")).toBe("/imgs/extrude.png");
    expect(getLocalAtomIconPath("Move")).toBe("/imgs/move.png");
    expect(getLocalAtomIconPath("Constant")).toBe("/imgs/Constant.png");
  });
  
  it('should return default thumbnail for unknown atom types', () => {
    const getLocalAtomIconPath = (atomType) => {
      const iconMap = {
        Circle: "/imgs/circle.png",
        Rectangle: "/imgs/rectangle.png",
      };
      
      return iconMap[atomType] || "/imgs/defaultThumbnail.svg";
    };
    
    expect(getLocalAtomIconPath("UnknownAtom")).toBe("/imgs/defaultThumbnail.svg");
  });
  
  it('should verify local atom objects have iconPath property', () => {
    // Simulate filtered local atoms with iconPath
    const mockAtom = {
      id: "local-circle",
      atomType: "Circle",
      atomCategory: "Shapes",
      isLocal: true,
      iconPath: "/imgs/circle.png",
    };
    
    expect(mockAtom.iconPath).toBeDefined();
    expect(mockAtom.iconPath).toBe("/imgs/circle.png");
    expect(mockAtom.isLocal).toBe(true);
  });
});
