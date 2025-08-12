import { describe, it, expect, beforeEach } from 'vitest';
import GlobalVariables from '../src/js/globalvariables.js';
import Molecule from '../src/molecules/molecule.js';
import Circle from '../src/molecules/circle.js';

import { describe, it, expect, beforeEach } from 'vitest';
import GlobalVariables from '../src/js/globalvariables.js';

describe('GitHub Molecule Copy/Paste ID Remapping', () => {
  beforeEach(() => {
    // Reset any global state
    GlobalVariables.atomsSelected = [];
    GlobalVariables.connectorsSelected = [];
  });

  it('should remap IDs correctly for molecules with nested atoms', () => {
    // Create a mock molecule structure with nested atoms
    const mockMoleculeData = {
      atomType: 'GitHubMolecule',
      name: 'TestGitHubMolecule',
      uniqueID: 'molecule-123',
      x: 0.3,
      y: 0.3,
      allAtoms: [
        {
          atomType: 'Circle',
          name: 'InternalCircle1',
          uniqueID: 'atom-456',
          x: 0.2,
          y: 0.2
        },
        {
          atomType: 'Rectangle',
          name: 'InternalRectangle',
          uniqueID: 'atom-789',
          x: 0.4,
          y: 0.4
        }
      ],
      allConnectors: [
        {
          ap1ID: 'atom-456',
          ap2ID: 'atom-789',
          uniqueID: 'connector-101'
        }
      ],
      fileTypeVersion: 1
    };

    console.log('Original data:', JSON.stringify(mockMoleculeData, null, 2));

    // Use GlobalVariables.remapIDsForPaste which should handle this properly
    const remappedArray = GlobalVariables.remapIDsForPaste([mockMoleculeData]);
    
    expect(remappedArray).toHaveLength(1);
    const remappedMolecule = remappedArray[0];

    console.log('Remapped data:', JSON.stringify(remappedMolecule, null, 2));

    // Main molecule should have new ID
    expect(remappedMolecule.uniqueID).not.toBe('molecule-123');
    expect(remappedMolecule.uniqueID).toBeDefined();

    // Nested atoms should have new IDs
    expect(remappedMolecule.allAtoms).toHaveLength(2);
    expect(remappedMolecule.allAtoms[0].uniqueID).not.toBe('atom-456');
    expect(remappedMolecule.allAtoms[1].uniqueID).not.toBe('atom-789');

    // Connectors should reference the new IDs
    expect(remappedMolecule.allConnectors).toHaveLength(1);
    const connector = remappedMolecule.allConnectors[0];
    expect(connector.ap1ID).toBe(remappedMolecule.allAtoms[0].uniqueID);
    expect(connector.ap2ID).toBe(remappedMolecule.allAtoms[1].uniqueID);
  });

  it('should demonstrate the current behavior and identify the issue', () => {
    // Create mock data that simulates how the current code path works
    const mockAtomData = {
      atomType: 'GitHubMolecule',
      name: 'TestGitHubMolecule',
      uniqueID: 'molecule-123',
      x: 0.3,
      y: 0.3,
      // This is how molecule.serialize() structures nested atoms
      allAtoms: [
        {
          atomType: 'Circle',
          name: 'InternalCircle1',
          uniqueID: 'atom-456',
          x: 0.2,
          y: 0.2
        }
      ],
      allConnectors: []
    };

    // Simulate the regular paste case from flowCanvas.jsx (lines 256-268)
    let newAtomID = GlobalVariables.generateUniqueID();
    const originalMainID = mockAtomData.uniqueID;
    const originalInternalID = mockAtomData.allAtoms[0].uniqueID;
    
    mockAtomData.uniqueID = newAtomID;
    
    console.log(`Changed main atom ID from ${originalMainID} to ${newAtomID}`);
    console.log('Original internal atom ID:', originalInternalID);

    // This is the issue - we need to call the correct remapping function
    // But the current code doesn't handle this properly for all cases
    
    // The main molecule gets a new ID, but what about internal atoms?
    expect(mockAtomData.uniqueID).not.toBe(originalMainID);
    
    // The internal atoms still have old IDs - this is the bug!
    expect(mockAtomData.allAtoms[0].uniqueID).toBe(originalInternalID);
    
    console.log('After simple ID change - internal atom still has old ID:', mockAtomData.allAtoms[0].uniqueID);
  });
});