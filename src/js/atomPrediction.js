// Simple hardcoded map of likely next atoms for each main atom type
const ATOM_PREDICTIONS = {
  Intersection: ["Move", "Fusion", "Tag"],
  Difference: ["Move", "Fusion", "Tag"],
  Assembly: ["ExtractTag", "Export", "Tag"],
  Fusion: ["Move", "Assembly", "Tag"],
  Loft: ["Extrude", "Move", "Tag"],
  ShrinkWrap: ["Move", "Fusion", "Tag"],
  Readme: [],
  "Add-BOM-Tag": ["Tag", "Readme", "Tag"],
  Color: ["Assembly", "Move", "Export"],
  Tag: ["Assembly", "Fusion", "Move"],
  ExtractTag: ["Tag", "Readme", "Tag"],
  CutLayout: ["Export", "Gcode", "Tag"],
  RegularPolygon: ["Extrude", "Move", "Tag"],
  Constant: ["Equation", "Input", "Tag"],
  Circle: ["Extrude", "Move", "Tag"],
  Text: ["Move", "Color", "Tag"],
  Rectangle: ["Extrude", "Move", "Tag"],
  //Molecule: ["Move", "Assembly"],
  Input: ["Equation", "Constant", "Tag"],
  Equation: ["Input", "Constant", "Tag"],
  //Code: ["Input", "Equation"],
  Rotate: ["Move", "Extrude", "Tag"],
  Extrude: ["Move", "Rotate", "Tag"],
  Move: ["Rotate", "Extrude", "Tag"],
  Gcode: ["Export", "Tag"],
  Import: ["Gcode", "Move", "Tag"],
  //Export: ["Gcode", "Import"],
  GitHubMolecule: ["Assembly", "Move", "Tag"],
  Output: ["Input", "Code", "Tag"],
  // Add more as needed
};

/**
 * Returns an array of likely next atom types for a given atom type.
 * @param {string} currentAtomType - The type of the atom just placed.
 * @returns {string[]} - Array of suggested next atom types.
 */
export function getPredictedAtoms(currentAtomType) {
  return ATOM_PREDICTIONS[currentAtomType] || [];
}

// Example usage:
// getPredictedAtoms("hole") // returns ["bolt", "nut"]
