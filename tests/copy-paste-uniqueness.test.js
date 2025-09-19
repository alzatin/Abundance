import { describe, it, expect } from 'vitest';

describe('Copy/Paste Uniqueness Issue Reproduction', () => {
  // Mock the generateUniqueID function for consistent testing
  let idCounter = 1000;
  function generateUniqueID() {
    return `id-${idCounter++}`;
  }

  // Implement the FIXED molecule remapIDs logic (mirroring our implementation)
  function fixedRemapIDs(json) {
    let idPairs = {};

    // Helper function to recursively process nested atoms
    const processNestedAtoms = (obj) => {
      if (obj.allAtoms) {
        obj.allAtoms.forEach((atom) => {
          let oldID = atom.uniqueID;
          let newID = generateUniqueID();
          idPairs[oldID] = newID;
          atom.uniqueID = newID;
          
          // Recursively process any nested atoms (e.g., within GitHubMolecules)
          processNestedAtoms(atom);
        });
      }
    };

    // Always ensure the main atom/molecule gets a new ID if it doesn't already have one assigned
    if (json.uniqueID && !json.uniqueID.toString().startsWith("temp-new-")) {
      let oldMainID = json.uniqueID;
      let newMainID = generateUniqueID();
      idPairs[oldMainID] = newMainID;
      json.uniqueID = newMainID;
    }

    // Process all nested atoms recursively
    processNestedAtoms(json);

    // Helper function to recursively process connectors
    const processConnectors = (obj) => {
      if (obj.allConnectors) {
        obj.allConnectors.forEach((connector) => {
          if (connector.ap1ID && idPairs[connector.ap1ID]) {
            connector.ap1ID = idPairs[connector.ap1ID];
          }
          if (connector.ap2ID && idPairs[connector.ap2ID]) {
            connector.ap2ID = idPairs[connector.ap2ID];
          }
          // Also remap connector's own uniqueID if it exists
          if (connector.uniqueID) {
            connector.uniqueID = generateUniqueID();
          }
        });
      }
      
      // Process connectors in nested atoms recursively
      if (obj.allAtoms) {
        obj.allAtoms.forEach(atom => processConnectors(atom));
      }
    };

    // Handle all connectors recursively
    processConnectors(json);

    return json;
  }

  // Implement the OLD molecule remapIDs logic (without recursive processing)
  function oldRemapIDs(json) {
    let idPairs = {};

    // Always ensure the main atom/molecule gets a new ID if it doesn't already have one assigned
    if (json.uniqueID && !json.uniqueID.toString().startsWith("temp-new-")) {
      let oldMainID = json.uniqueID;
      let newMainID = generateUniqueID();
      idPairs[oldMainID] = newMainID;
      json.uniqueID = newMainID;
    }

    // Handle nested atoms if they exist (NON-RECURSIVE - this is the bug)
    if (json.allAtoms) {
      json.allAtoms.forEach((atom) => {
        let oldID = atom.uniqueID;
        let newID = generateUniqueID();
        idPairs[oldID] = newID;
        atom.uniqueID = newID;
      });

      // Handle connectors if they exist (NON-RECURSIVE - this is also the bug)
      if (json.allConnectors) {
        json.allConnectors.forEach((connector) => {
          if (connector.ap1ID && idPairs[connector.ap1ID]) {
            connector.ap1ID = idPairs[connector.ap1ID];
          }
          if (connector.ap2ID && idPairs[connector.ap2ID]) {
            connector.ap2ID = idPairs[connector.ap2ID];
          }
          // Also remap connector's own uniqueID if it exists
          if (connector.uniqueID) {
            connector.uniqueID = generateUniqueID();
          }
        });
      }
    }

    return json;
  }

  it('should demonstrate the bug in the old remapIDs implementation', () => {
    // Simulate a molecule that contains a GitHubMolecule
    const originalMolecule = {
      atomType: 'Molecule',
      name: 'A Test Molecule',
      uniqueID: 'test-molecule-1',
      allAtoms: [
        {
          atomType: 'GitHubMolecule',
          name: '2x6 in MM',
          uniqueID: 'github-molecule-1',
          allAtoms: [
            {
              atomType: 'Rectangle',
              uniqueID: 'rect-internal-1',
              name: 'Rectangle'
            },
            {
              atomType: 'Extrude',
              uniqueID: 'extrude-internal-1',
              name: 'Extrude'
            }
          ],
          allConnectors: []
        }
      ],
      allConnectors: []
    };

    // Create a deep copy to simulate copy operation
    const copiedMolecule = JSON.parse(JSON.stringify(originalMolecule));
    
    // Apply old (buggy) remapIDs logic
    const remappedCopy = oldRemapIDs(copiedMolecule);

    console.log('BUG DEMONSTRATION - Old remapIDs:');
    console.log('Original internal rectangle ID:', originalMolecule.allAtoms[0].allAtoms[0].uniqueID);
    console.log('Remapped internal rectangle ID:', remappedCopy.allAtoms[0].allAtoms[0].uniqueID);

    // Check that main molecule gets new ID
    expect(remappedCopy.uniqueID).not.toBe(originalMolecule.uniqueID);
    
    // Check that the GitHubMolecule gets new ID
    expect(remappedCopy.allAtoms[0].uniqueID).not.toBe(originalMolecule.allAtoms[0].uniqueID);
    
    // BUG: Internal atoms within GitHubMolecule keep their old IDs
    const originalInternalRect = originalMolecule.allAtoms[0].allAtoms[0];
    const remappedInternalRect = remappedCopy.allAtoms[0].allAtoms[0];
    
    // This demonstrates the bug - internal atoms don't get new IDs
    expect(remappedInternalRect.uniqueID).toBe(originalInternalRect.uniqueID);
    console.log('BUG CONFIRMED: Internal atoms keep their old IDs');
  });

  it('should fix the GitHub molecule nested ID issue with recursive remapping', () => {
    // Reset counter for clean test
    idCounter = 2000;
    
    // Same test data
    const originalMolecule = {
      atomType: 'Molecule',
      name: 'A Test Molecule',
      uniqueID: 'test-molecule-1',
      allAtoms: [
        {
          atomType: 'GitHubMolecule',
          name: '2x6 in MM',
          uniqueID: 'github-molecule-1',
          allAtoms: [
            {
              atomType: 'Rectangle',
              uniqueID: 'rect-internal-1',
              name: 'Rectangle'
            },
            {
              atomType: 'Extrude',
              uniqueID: 'extrude-internal-1',
              name: 'Extrude'
            }
          ],
          allConnectors: []
        }
      ],
      allConnectors: []
    };

    // Create a deep copy to simulate copy operation
    const copiedMolecule = JSON.parse(JSON.stringify(originalMolecule));
    
    // Apply FIXED remapIDs logic
    const remappedCopy = fixedRemapIDs(copiedMolecule);

    console.log('FIX DEMONSTRATION - New recursive remapIDs:');
    console.log('Original internal rectangle ID:', originalMolecule.allAtoms[0].allAtoms[0].uniqueID);
    console.log('Remapped internal rectangle ID:', remappedCopy.allAtoms[0].allAtoms[0].uniqueID);

    // Check that main molecule gets new ID
    expect(remappedCopy.uniqueID).not.toBe(originalMolecule.uniqueID);
    
    // Check that the GitHubMolecule gets new ID
    expect(remappedCopy.allAtoms[0].uniqueID).not.toBe(originalMolecule.allAtoms[0].uniqueID);
    
    // FIX: Internal atoms within GitHubMolecule should now get new IDs
    const originalInternalRect = originalMolecule.allAtoms[0].allAtoms[0];
    const remappedInternalRect = remappedCopy.allAtoms[0].allAtoms[0];
    
    // This should now pass with the fix
    expect(remappedInternalRect.uniqueID).not.toBe(originalInternalRect.uniqueID);
    expect(remappedInternalRect.uniqueID).toBeDefined();
    
    // Check the extrude as well
    const originalInternalExtrude = originalMolecule.allAtoms[0].allAtoms[1];
    const remappedInternalExtrude = remappedCopy.allAtoms[0].allAtoms[1];
    
    expect(remappedInternalExtrude.uniqueID).not.toBe(originalInternalExtrude.uniqueID);
    expect(remappedInternalExtrude.uniqueID).toBeDefined();
    
    console.log('SUCCESS: All nested atoms now have unique IDs!');
  });

  it('should handle deeply nested structures', () => {
    // Reset counter for clean test
    idCounter = 3000;
    
    // Test a more complex nested structure
    const complexMolecule = {
      atomType: 'Molecule',
      uniqueID: 'root-molecule',
      allAtoms: [
        {
          atomType: 'Molecule',
          uniqueID: 'nested-molecule-1',
          allAtoms: [
            {
              atomType: 'GitHubMolecule',
              uniqueID: 'github-molecule-deep',
              allAtoms: [
                {
                  atomType: 'Rectangle',
                  uniqueID: 'deep-rect',
                  allAtoms: [] // Even deeper nesting (though empty)
                }
              ]
            }
          ]
        }
      ],
      allConnectors: []
    };

    const copy = JSON.parse(JSON.stringify(complexMolecule));
    const remapped = fixedRemapIDs(copy);

    // All levels should get new IDs
    expect(remapped.uniqueID).not.toBe(complexMolecule.uniqueID);
    expect(remapped.allAtoms[0].uniqueID).not.toBe(complexMolecule.allAtoms[0].uniqueID);
    expect(remapped.allAtoms[0].allAtoms[0].uniqueID).not.toBe(complexMolecule.allAtoms[0].allAtoms[0].uniqueID);
    expect(remapped.allAtoms[0].allAtoms[0].allAtoms[0].uniqueID).not.toBe(complexMolecule.allAtoms[0].allAtoms[0].allAtoms[0].uniqueID);
    
    console.log('SUCCESS: Deep nesting handled correctly!');
  });
});