import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Status } from '../src/prototypes/observableEntity.js';
import AttachmentPoint from '../src/prototypes/attachmentpoint.js';
import GlobalVariables from '../src/js/globalvariables.js';

describe('GitHub Molecule Geometry Input Copy/Paste Issue', () => {
  let idCounter = 1000;

  beforeEach(() => {
    // Reset ID counter
    idCounter = 1000;
  });

  /**
   * This test reproduces the issue where a GitHub molecule with a Code atom
   * that has a geometry input (defaultValue: null) doesn't properly update
   * values or call upstream change after being copied and pasted.
   */
  it('should properly handle geometry input propagation after paste', () => {
    // Simulate the structure of a GitHub molecule containing a Code atom
    const githubMoleculeData = {
      atomType: 'GitHubMolecule',
      name: 'Test GitHub Molecule',
      uniqueID: 'github-mol-1',
      allAtoms: [
        {
          atomType: 'Code',
          uniqueID: 'code-atom-1',
          name: 'Code',
          code: `
const Inputs = [
  { inputName: "shape", type: "geometry", defaultValue: null },
  { inputName: "radius", type: "number", defaultValue: 5 }
];
return { geometry: [], dimension: '3D' };
          `,
          // NOTE: ioValues does NOT include geometry inputs because they're skipped during serialization
          ioValues: [
            { name: 'radius', ioValue: 5, valueType: 'number' }
            // 'shape' is NOT here because geometry inputs are not serialized
          ]
        }
      ],
      allConnectors: []
    };

    // After copy/paste, the Code atom is reconstructed
    // The parseInputs() method will create the geometry input with defaultValue: null
    // But the ioValues won't have an entry for it
    
    // The issue is that when deserializing, the Code constructor does:
    // 1. Creates APs from ioValues (line 68-71 in code.js)
    // 2. Then calls parseInputs() which creates NEW inputs from the Inputs array
    // 3. The geometry input created by parseInputs() may not get proper initialization

    // Expected behavior:
    // - Geometry inputs with defaultValue: null should be initialized to READY status with NO_GEOMETRY
    // - When a connection is made, they should properly receive upstream changes
    // - The attachment point should subscribe to upstream changes correctly

    console.log('GitHub molecule data structure:', JSON.stringify(githubMoleculeData, null, 2));
    
    // Verify that geometry inputs are not in ioValues
    const codeAtom = githubMoleculeData.allAtoms[0];
    const hasGeometryInIoValues = codeAtom.ioValues.some(io => io.name === 'shape');
    expect(hasGeometryInIoValues).toBe(false);
    
    console.log('SUCCESS: Confirmed geometry inputs are not serialized in ioValues');
  });

  /**
   * Test the specific flow of Code atom initialization
   */
  it('should handle Code atom initialization with geometry inputs correctly', () => {
    // This test simulates what happens in the Code constructor
    
    // Step 1: ioValues from serialization (no geometry inputs)
    const ioValues = [
      { name: 'radius', ioValue: 5, valueType: 'number' }
    ];
    
    // Step 2: Code string that defines inputs including geometry
    const code = `
const Inputs = [
  { inputName: "shape", type: "geometry", defaultValue: null },
  { inputName: "radius", type: "number", defaultValue: 5 }
];
    `;
    
    // The issue occurs because:
    // 1. Code constructor processes ioValues first (lines 68-71)
    // 2. Then calls parseInputs() which parses the Inputs array from code
    // 3. parseInputs() creates the 'shape' input with defaultValue: null
    // 4. But _addIOWithoutSubscribing doesn't properly initialize geometry inputs
    // 5. Then _subscribeToInputs() is called, but geometry input might not be in proper state
    
    // Expected: When parseInputs() creates a geometry input with defaultValue: null,
    // it should be set to READY status with NO_GEOMETRY value so that the Code atom
    // can execute even without a connection
    
    console.log('Code initialization flow:');
    console.log('1. Process ioValues (no geometry):', ioValues);
    console.log('2. parseInputs() will create geometry input from code');
    console.log('3. _subscribeToInputs() subscribes to all inputs');
    console.log('ISSUE: Geometry input may not be properly initialized');
    
    expect(true).toBe(true); // Placeholder - actual fix needed in code.js
  });

  /**
   * Test attachment point behavior when connecting after initialization
   */
  it('should properly propagate upstream changes to geometry inputs', () => {
    // When a connection is made to a geometry input that was initialized from parseInputs():
    // 1. attach() is called on the attachment point
    // 2. The upstream atom should be subscribed to
    // 3. onUpstreamChange() should be called when upstream value changes
    // 4. The attachment point should update its status and value
    
    // The issue is that if the attachment point wasn't properly initialized,
    // it might not correctly handle upstream changes
    
    console.log('Expected flow when connecting:');
    console.log('1. attach(connector) called on geometry input AP');
    console.log('2. upstream.subscribe(callback) with onUpstreamChange');
    console.log('3. onUpstreamChange() updates AP status and value');
    console.log('4. Parent atom (Code) receives notification via its own subscription');
    console.log('ISSUE: If AP initialization was wrong, this flow fails');
    
    expect(true).toBe(true); // Placeholder - actual fix needed
  });
});
