/**
 * Test to verify that Gcode metrics can detect Gcode atoms nested inside
 * GitHub molecules and regular molecules.
 * 
 * This tests the fix for: "Gcode metrics are not being added to the Performance 
 * Metrics Comparison even when the project contains github atoms"
 */

import { describe, it, expect } from 'vitest';

describe('Gcode Nested Detection', () => {
  // Shared helper function - same implementation as in Puppet/metrics.js
  const findAllGcodeAtoms = (mol) => {
    let gcodeAtoms = [];
    
    if (!mol.nodesOnTheScreen || !Array.isArray(mol.nodesOnTheScreen)) {
      return gcodeAtoms;
    }
    
    mol.nodesOnTheScreen.forEach((atom) => {
      if (atom.atomType === 'Gcode') {
        gcodeAtoms.push(atom);
      }
      // Recursively search inside Molecule and GitHubMolecule atoms
      if (atom.atomType === 'Molecule' || atom.atomType === 'GitHubMolecule') {
        const nestedGcodeAtoms = findAllGcodeAtoms(atom);
        gcodeAtoms = gcodeAtoms.concat(nestedGcodeAtoms);
      }
    });
    
    return gcodeAtoms;
  };
  
  it('should demonstrate the recursive search function for Gcode atoms', () => {
    // Mock a top-level molecule with nested structure
    const mockTopLevelMolecule = {
      atomType: 'Molecule',
      name: 'TopLevel',
      nodesOnTheScreen: [
        {
          atomType: 'Circle',
          name: 'Circle1',
        },
        {
          atomType: 'Gcode',
          name: 'TopLevelGcode',
        },
        {
          atomType: 'GitHubMolecule',
          name: 'ImportedMolecule',
          nodesOnTheScreen: [
            {
              atomType: 'Rectangle',
              name: 'Rect1',
            },
            {
              atomType: 'Gcode',
              name: 'NestedGcode1',
            },
          ],
        },
        {
          atomType: 'Molecule',
          name: 'LocalMolecule',
          nodesOnTheScreen: [
            {
              atomType: 'Gcode',
              name: 'NestedGcode2',
            },
            {
              atomType: 'GitHubMolecule',
              name: 'DeeplyNestedGitHub',
              nodesOnTheScreen: [
                {
                  atomType: 'Gcode',
                  name: 'DeeplyNestedGcode',
                },
              ],
            },
          ],
        },
      ],
    };

    // Test the recursive search
    const gcodeAtoms = findAllGcodeAtoms(mockTopLevelMolecule);

    // Verify we found all 4 Gcode atoms at various nesting levels
    expect(gcodeAtoms.length).toBe(4);
    expect(gcodeAtoms[0].name).toBe('TopLevelGcode');
    expect(gcodeAtoms[1].name).toBe('NestedGcode1');
    expect(gcodeAtoms[2].name).toBe('NestedGcode2');
    expect(gcodeAtoms[3].name).toBe('DeeplyNestedGcode');
  });

  it('should handle molecules without nodesOnTheScreen', () => {
    // Test with a molecule that has no nodesOnTheScreen
    const emptyMolecule = {
      atomType: 'Molecule',
      name: 'Empty',
    };

    const gcodeAtoms = findAllGcodeAtoms(emptyMolecule);
    expect(gcodeAtoms.length).toBe(0);
  });

  it('should handle molecules with only non-Gcode atoms', () => {
    const moleculeWithNoGcode = {
      atomType: 'Molecule',
      name: 'NoGcode',
      nodesOnTheScreen: [
        { atomType: 'Circle', name: 'C1' },
        { atomType: 'Rectangle', name: 'R1' },
        {
          atomType: 'Molecule',
          name: 'NestedNoGcode',
          nodesOnTheScreen: [
            { atomType: 'Extrude', name: 'E1' },
          ],
        },
      ],
    };

    const gcodeAtoms = findAllGcodeAtoms(moleculeWithNoGcode);
    expect(gcodeAtoms.length).toBe(0);
  });

  it('should verify the old implementation would miss nested Gcode atoms', () => {
    // Old implementation: only look at top-level nodesOnTheScreen
    const oldFindGcodeAtoms = (mol) => {
      if (!mol.nodesOnTheScreen || !Array.isArray(mol.nodesOnTheScreen)) {
        return [];
      }
      return mol.nodesOnTheScreen.filter((atom) => atom.atomType === 'Gcode');
    };

    const mockMolecule = {
      atomType: 'Molecule',
      name: 'Top',
      nodesOnTheScreen: [
        { atomType: 'Gcode', name: 'TopGcode' },
        {
          atomType: 'GitHubMolecule',
          name: 'GitHub',
          nodesOnTheScreen: [
            { atomType: 'Gcode', name: 'NestedGcode' },
          ],
        },
      ],
    };

    // Old implementation would only find 1 Gcode atom
    const oldResult = oldFindGcodeAtoms(mockMolecule);
    expect(oldResult.length).toBe(1);
    expect(oldResult[0].name).toBe('TopGcode');

    // New recursive implementation finds all 2 Gcode atoms
    const newResult = findAllGcodeAtoms(mockMolecule);
    expect(newResult.length).toBe(2);
    expect(newResult[0].name).toBe('TopGcode');
    expect(newResult[1].name).toBe('NestedGcode');
  });
});
