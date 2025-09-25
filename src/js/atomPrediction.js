// Simple hardcoded map of likely next atoms for each main atom type
const ATOM_PREDICTIONS = {
  Box: ["Move", "Color", "Extrude"],
  Intersection: ["Difference", "Fusion"],
  Difference: ["Intersection", "Fusion"],
  Assembly: ["Move", "Fusion"],
  Fusion: ["Move", "Assembly"],
  Loft: ["Extrude", "Move"],
  ShrinkWrap: ["Move", "Fusion"],
  Readme: ["Tag", "Add-BOM-Tag"],
  "Add-BOM-Tag": ["Tag", "Readme"],
  Color: ["Box", "Circle", "Rectangle"],
  Tag: ["ExtractTag", "Readme"],
  ExtractTag: ["Tag", "Readme"],
  CutLayout: ["Rectangle", "Box"],
  RegularPolygon: ["Extrude", "Move"],
  Constant: ["Equation", "Input"],
  Circle: ["Extrude", "Move"],
  Text: ["Move", "Color"],
  Rectangle: ["Extrude", "Move"],
  Molecule: ["Move", "Assembly"],
  Input: ["Equation", "Constant"],
  Equation: ["Input", "Constant"],
  Code: ["Input", "Equation"],
  Rotate: ["Move", "Extrude"],
  Extrude: ["Fillet", "Hole", "Move"],
  Move: ["Rotate", "Extrude"],
  Gcode: ["Export", "Import"],
  Import: ["Gcode", "Export"],
  Export: ["Gcode", "Import"],
  GitHubMolecule: ["Assembly", "Move"],
  Output: ["Input", "Code"],
  Fillet: ["Hole", "Extrude"],
  Hole: ["Bolt", "Nut"],
  Bolt: ["Nut", "Washer"],
  Nut: ["Bolt", "Washer"],
  Washer: ["Bolt", "Nut"],
  Group: ["Move", "Color"],
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
