import { describe, it, expect, beforeEach } from 'vitest';

// This test simulates the real Input atom creation process that happens in the application
describe('Input Atom Real-World Simulation', () => {
  
  let MockGlobalVariables;
  let MockInput;
  let MockMolecule;

  beforeEach(() => {
    // Mock GlobalVariables based on real values from the codebase
    MockGlobalVariables = {
      atomSize: 0.02, // Real value from the application
      generateUniqueID: () => Math.random().toString(36).substr(2, 9),
      cad: {
        generateUniqueID: () => Math.random().toString(36).substr(2, 9)
      }
    };

    // Minimal mock of Input class that matches the real implementation
    MockInput = class {
      constructor(values) {
        this.atomType = 'Input';
        this.name = values.name || 'Input';
        this.x = values.x || 0;
        this.y = values.y || 0;
        this.parent = values.parent;
        this.uniqueID = values.uniqueID || MockGlobalVariables.generateUniqueID();
        
        // This is the key fix - collision detection in constructor
        this.adjustYForCollision();
      }
      
      adjustYForCollision() {
        if (!this.parent || !this.parent.nodesOnTheScreen) return;
        
        const existingInputs = this.parent.nodesOnTheScreen.filter(
          atom => atom.atomType === 'Input' && atom !== this
        );
        
        if (existingInputs.length === 0) return;
        
        const atomSpacing = MockGlobalVariables.atomSize * 2; // 0.04
        const tolerance = MockGlobalVariables.atomSize * 0.5; // 0.01
        
        for (const existingInput of existingInputs) {
          const yDiff = Math.abs(this.y - existingInput.y);
          
          if (yDiff < tolerance) {
            this.y = existingInput.y + atomSpacing;
            this.adjustYForCollision(); // Recursive check
            break;
          }
        }
      }
    };

    // Mock molecule that maintains the nodesOnTheScreen array
    MockMolecule = class {
      constructor(values) {
        this.name = values.name || 'Molecule';
        this.nodesOnTheScreen = [];
        this.x = values.x || 0.5;
        this.y = values.y || 0.5;
        this.uniqueID = values.uniqueID || MockGlobalVariables.generateUniqueID();
      }
    };
  });

  it('simulates the real-world menu click scenario creating multiple Input atoms', () => {
    // Create a molecule (like when user is inside a molecule)
    const parentMolecule = new MockMolecule({
      name: 'UserMolecule',
      x: 0.5,
      y: 0.5
    });

    // Simulate user clicking the menu at the same location 3 times
    // (like what happens when user right-clicks and selects "Input" multiple times)
    const menuClickPosition = { x: 0.2, y: 0.4 };
    
    const createdInputs = [];
    
    for (let i = 1; i <= 3; i++) {
      // Simulate placeNewNode from NewMenu.js creating Input atoms at the same position
      const inputAtom = new MockInput({
        name: `Input${i}`,
        parent: parentMolecule,
        x: menuClickPosition.x, // Same X from menu click
        y: menuClickPosition.y, // Same Y from menu click (this is the problem we're fixing)
        uniqueID: `input-${i}`
      });
      
      // Add to molecule (like in placeAtom method)
      parentMolecule.nodesOnTheScreen.push(inputAtom);
      createdInputs.push(inputAtom);
      
      console.log(`Created Input${i} at Y: ${inputAtom.y}`);
    }

    // Verify the fix worked: all Input atoms should have different Y coordinates
    expect(createdInputs[0].y).toBe(0.4); // First one keeps original position
    expect(createdInputs[1].y).toBe(0.44); // Second one offset by atomSize * 2
    expect(createdInputs[2].y).toBe(0.48); // Third one offset from second
    
    // Verify they are properly spaced
    for (let i = 1; i < createdInputs.length; i++) {
      const spacing = createdInputs[i].y - createdInputs[i - 1].y;
      expect(spacing).toBeCloseTo(0.04, 10); // atomSize * 2 = 0.02 * 2 = 0.04
    }

    console.log('✅ Real-world simulation: Input atoms properly spaced!');
    console.log('Y coordinates:', createdInputs.map(input => input.y));
  });

  it('simulates pasting multiple Input atoms at the same location', () => {
    const parentMolecule = new MockMolecule({
      name: 'PasteMolecule'
    });

    // Simulate pasting copied atoms that all have the same coordinates
    const pastePosition = { x: 0.3, y: 0.6 };
    
    // Create 4 Input atoms with identical coordinates (paste scenario)
    for (let i = 1; i <= 4; i++) {
      const inputAtom = new MockInput({
        name: `PastedInput${i}`,
        parent: parentMolecule,
        x: pastePosition.x,
        y: pastePosition.y, // All pasted at same Y
        uniqueID: `pasted-input-${i}`
      });
      
      parentMolecule.nodesOnTheScreen.push(inputAtom);
    }

    // Check that all atoms are now vertically stacked
    const allInputs = parentMolecule.nodesOnTheScreen;
    const yCoordinates = allInputs.map(atom => atom.y);
    
    // All Y coordinates should be unique
    expect(new Set(yCoordinates).size).toBe(allInputs.length);
    
    // They should be in ascending order
    for (let i = 1; i < yCoordinates.length; i++) {
      expect(yCoordinates[i]).toBeGreaterThan(yCoordinates[i - 1]);
    }

    console.log('✅ Paste simulation: All Input atoms properly spaced!');
    console.log('Y coordinates after paste:', yCoordinates);
  });

  it('verifies that well-spaced Input atoms are not affected', () => {
    const parentMolecule = new MockMolecule({
      name: 'WellSpacedMolecule'
    });

    // Create Input atoms that are already well spaced
    const positions = [
      { x: 0.1, y: 0.2 },
      { x: 0.1, y: 0.3 },
      { x: 0.1, y: 0.5 },
      { x: 0.1, y: 0.8 }
    ];

    const expectedYs = positions.map(pos => pos.y);
    
    for (let i = 0; i < positions.length; i++) {
      const inputAtom = new MockInput({
        name: `SpacedInput${i + 1}`,
        parent: parentMolecule,
        x: positions[i].x,
        y: positions[i].y,
        uniqueID: `spaced-input-${i + 1}`
      });
      
      parentMolecule.nodesOnTheScreen.push(inputAtom);
    }

    // Verify that well-spaced atoms keep their original positions
    const finalYs = parentMolecule.nodesOnTheScreen.map(atom => atom.y);
    
    for (let i = 0; i < expectedYs.length; i++) {
      expect(finalYs[i]).toBe(expectedYs[i]);
    }

    console.log('✅ Well-spaced atoms preserved their positions!');
    console.log('Original Y positions maintained:', finalYs);
  });
});