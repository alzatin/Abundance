import { describe, it, expect, beforeEach } from 'vitest';

// Simple mock for testing Input atom overlap prevention
class MockAtom {
  constructor(values) {
    this.x = values.x || 0;
    this.y = values.y || 0;
    this.atomType = values.atomType || 'MockAtom';
    this.name = values.name || 'Mock';
    this.uniqueID = values.uniqueID || Math.random().toString(36).substr(2, 9);
  }
}

class MockMolecule extends MockAtom {
  constructor(values) {
    super(values);
    this.nodesOnTheScreen = [];
    this.inputs = [];
    this.atomType = 'Molecule';
  }
  
  addIO(name, type, value, ioType) {
    return { name, type, value, ioType };
  }
}

class MockInput extends MockAtom {
  constructor(values) {
    super(values);
    this.atomType = 'Input';
    this.parent = values.parent;
    
    // This is where we'll add the collision detection logic
    this.adjustYForCollision();
  }
  
  adjustYForCollision() {
    if (!this.parent || !this.parent.nodesOnTheScreen) return;
    
    const existingInputs = this.parent.nodesOnTheScreen.filter(
      atom => atom.atomType === 'Input' && atom !== this
    );
    
    const atomSpacing = 0.04; // Minimum spacing between atoms
    const tolerance = 0.01; // Tolerance for "same position"
    
    for (const existingInput of existingInputs) {
      const yDiff = Math.abs(this.y - existingInput.y);
      
      if (yDiff < tolerance) {
        // Found collision, offset this atom downward
        this.y = existingInput.y + atomSpacing;
        
        // Recursively check for more collisions with the new position
        this.adjustYForCollision();
        break;
      }
    }
  }
}

describe('Input Atom Overlap Prevention', () => {
  it('should prevent Input atoms from overlapping by applying Y-offset', () => {
    // Create a parent molecule
    const parentMolecule = new MockMolecule({
      name: 'TestMolecule',
      uniqueID: 'test-molecule-1',
      x: 0.5,
      y: 0.5
    });
    
    // Create first Input atom at Y coordinate 0.3
    const input1 = new MockInput({
      name: 'Input1',
      parent: parentMolecule,
      x: 0.1,
      y: 0.3,
      uniqueID: 'input-1'
    });
    
    // Add it to the molecule's nodes
    parentMolecule.nodesOnTheScreen.push(input1);
    
    // Create second Input atom at the same Y coordinate
    const input2 = new MockInput({
      name: 'Input2', 
      parent: parentMolecule,
      x: 0.1,
      y: 0.3, // Same Y as input1
      uniqueID: 'input-2'
    });
    
    // Add it to the molecule's nodes
    parentMolecule.nodesOnTheScreen.push(input2);
    
    // Check that input2's Y coordinate has been offset to avoid overlap
    expect(input2.y).not.toBe(input1.y);
    expect(input2.y).toBeGreaterThan(input1.y);
    
    // The offset should be sufficient to prevent visual overlap
    const minOffset = 0.039; // Expected minimum offset (adjusted for floating point precision)
    expect(Math.abs(input2.y - input1.y)).toBeGreaterThanOrEqual(minOffset);
    
    console.log(`✅ Input1 Y: ${input1.y}, Input2 Y: ${input2.y}, Offset: ${Math.abs(input2.y - input1.y)}`);
  });

  it('should handle multiple Input atoms and stack them vertically', () => {
    const parentMolecule = new MockMolecule({
      name: 'TestMolecule',
      uniqueID: 'test-molecule-2',
      x: 0.5,
      y: 0.5
    });
    
    const inputAtoms = [];
    const baseY = 0.4;
    
    // Create 3 Input atoms at the same Y coordinate
    for (let i = 0; i < 3; i++) {
      const input = new MockInput({
        name: `Input${i + 1}`,
        parent: parentMolecule,
        x: 0.1,
        y: baseY, // All start at same Y
        uniqueID: `input-${i + 1}`
      });
      
      parentMolecule.nodesOnTheScreen.push(input);
      inputAtoms.push(input);
    }
    
    // Verify all Input atoms have different Y coordinates
    const yCoordinates = inputAtoms.map(atom => atom.y);
    const uniqueYCoordinates = [...new Set(yCoordinates)];
    
    expect(uniqueYCoordinates.length).toBe(inputAtoms.length);
    
    // Verify they are properly spaced
    for (let i = 1; i < inputAtoms.length; i++) {
      expect(inputAtoms[i].y).toBeGreaterThan(inputAtoms[i - 1].y);
      const spacing = inputAtoms[i].y - inputAtoms[i - 1].y;
      expect(spacing).toBeGreaterThan(0);
    }
    
    console.log(`✅ Created ${inputAtoms.length} Input atoms with Y coordinates:`, yCoordinates);
  });

  it('should not affect Input atoms that are already well-spaced', () => {
    const parentMolecule = new MockMolecule({
      name: 'TestMolecule',
      uniqueID: 'test-molecule-3',
      x: 0.5,
      y: 0.5
    });
    
    // Create Input atoms with good spacing
    const input1 = new MockInput({
      name: 'Input1',
      parent: parentMolecule,
      x: 0.1,
      y: 0.2,
      uniqueID: 'input-1'
    });
    parentMolecule.nodesOnTheScreen.push(input1);
    
    const input2 = new MockInput({
      name: 'Input2',
      parent: parentMolecule,
      x: 0.1,
      y: 0.5, // Well spaced from input1
      uniqueID: 'input-2'
    });
    parentMolecule.nodesOnTheScreen.push(input2);
    
    // Both should keep their original Y coordinates
    expect(input1.y).toBe(0.2);
    expect(input2.y).toBe(0.5);
    
    console.log(`✅ Well-spaced Input atoms preserved: Y1=${input1.y}, Y2=${input2.y}`);
  });

  it('should handle edge case where Input atom is created at boundary', () => {
    const parentMolecule = new MockMolecule({
      name: 'TestMolecule',
      uniqueID: 'test-molecule-4',
      x: 0.5,
      y: 0.5
    });
    
    // Create Input atom near the bottom boundary
    const input1 = new MockInput({
      name: 'Input1',
      parent: parentMolecule,
      x: 0.1,
      y: 0.95, // Near bottom
      uniqueID: 'input-1'
    });
    parentMolecule.nodesOnTheScreen.push(input1);
    
    // Create second Input atom at same position
    const input2 = new MockInput({
      name: 'Input2',
      parent: parentMolecule,
      x: 0.1,
      y: 0.95, // Same Y as input1
      uniqueID: 'input-2'
    });
    parentMolecule.nodesOnTheScreen.push(input2);
    
    // Should still handle the collision properly
    expect(input2.y).not.toBe(input1.y);
    
    console.log(`✅ Boundary case handled: Y1=${input1.y}, Y2=${input2.y}`);
  });
});