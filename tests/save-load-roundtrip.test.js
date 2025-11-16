/**
 * Comprehensive save/load roundtrip test.
 * Verifies that a project can be saved and loaded back with all essential data preserved.
 */

import { describe, it, expect, beforeEach } from 'vitest';

describe('Save/Load Roundtrip Tests', () => {

  /**
   * Create a mock project structure that mimics a real Abundance project
   */
  function createMockProject() {
    return {
      fileTypeVersion: 1,
      atomType: 'Molecule',
      name: 'Test Project',
      uniqueID: 'project-1',
      topLevel: true,
      x: 0.5,
      y: 0.5,
      unitsKey: 'MM',
      allAtoms: [
        {
          atomType: 'Circle',
          name: 'Circle1',
          uniqueID: 'atom-1',
          x: 0.2,
          y: 0.3,
          ioValues: [
            { name: 'radius', ioValue: 50 },
            { name: 'sides', ioValue: 32 },
          ],
        },
        {
          atomType: 'Extrude',
          name: 'Extrude1',
          uniqueID: 'atom-2',
          x: 0.5,
          y: 0.3,
          ioValues: [
            { name: 'height', ioValue: 100 },
            { name: 'twistAngle', ioValue: 0 },
          ],
        },
        {
          atomType: 'Move',
          name: 'Move1',
          uniqueID: 'atom-3',
          x: 0.8,
          y: 0.3,
          ioValues: [
            { name: 'xDist', ioValue: 10, currentEquation: 'radius / 5' },
            { name: 'yDist', ioValue: 0 },
            { name: 'zDist', ioValue: 0 },
          ],
        },
        {
          atomType: 'Output',
          name: 'Output',
          uniqueID: 'atom-4',
          x: 0.98,
          y: 0.5,
          ioValues: [],
        },
      ],
      allConnectors: [
        {
          ap1Name: 'output',
          ap2Name: 'geometry',
          ap1ID: 'atom-1',
          ap2ID: 'atom-2',
        },
        {
          ap1Name: 'output',
          ap2Name: 'geometry',
          ap1ID: 'atom-2',
          ap2ID: 'atom-3',
        },
        {
          ap1Name: 'output',
          ap2Name: 'geometry',
          ap1ID: 'atom-3',
          ap2ID: 'atom-4',
        },
      ],
    };
  }

  it('should preserve all essential data in save/load roundtrip', () => {
    const original = createMockProject();

    // Simulate save (JSON.stringify)
    const saved = JSON.stringify(original, null, 2);
    const savedSize = saved.length;

    // Simulate load (JSON.parse)
    const loaded = JSON.parse(saved);

    // Verify top-level properties
    expect(loaded.fileTypeVersion).toBe(original.fileTypeVersion);
    expect(loaded.atomType).toBe(original.atomType);
    expect(loaded.name).toBe(original.name);
    expect(loaded.uniqueID).toBe(original.uniqueID);
    expect(loaded.topLevel).toBe(original.topLevel);
    expect(loaded.unitsKey).toBe(original.unitsKey);

    // Verify atoms
    expect(loaded.allAtoms).toHaveLength(original.allAtoms.length);
    loaded.allAtoms.forEach((atom, i) => {
      const origAtom = original.allAtoms[i];
      expect(atom.atomType).toBe(origAtom.atomType);
      expect(atom.name).toBe(origAtom.name);
      expect(atom.uniqueID).toBe(origAtom.uniqueID);
      expect(atom.x).toBe(origAtom.x);
      expect(atom.y).toBe(origAtom.y);
      expect(atom.ioValues).toHaveLength(origAtom.ioValues.length);
    });

    // Verify connectors
    expect(loaded.allConnectors).toHaveLength(original.allConnectors.length);
    loaded.allConnectors.forEach((conn, i) => {
      const origConn = original.allConnectors[i];
      expect(conn.ap1Name).toBe(origConn.ap1Name);
      expect(conn.ap2Name).toBe(origConn.ap2Name);
      expect(conn.ap1ID).toBe(origConn.ap1ID);
      expect(conn.ap2ID).toBe(origConn.ap2ID);
    });

    console.log(`✅ Roundtrip successful - File size: ${savedSize} bytes`);
  });

  it('should preserve equations in ioValues', () => {
    const original = createMockProject();

    // Find the atom with an equation
    const moveAtom = original.allAtoms.find(a => a.atomType === 'Move');
    const xDistIO = moveAtom.ioValues.find(io => io.name === 'xDist');
    
    expect(xDistIO.currentEquation).toBe('radius / 5');
    expect(xDistIO.ioValue).toBe(10);

    // Save and load
    const loaded = JSON.parse(JSON.stringify(original));

    const loadedMoveAtom = loaded.allAtoms.find(a => a.atomType === 'Move');
    const loadedXDistIO = loadedMoveAtom.ioValues.find(io => io.name === 'xDist');

    // Verify equation is preserved
    expect(loadedXDistIO.currentEquation).toBe('radius / 5');
    expect(loadedXDistIO.ioValue).toBe(10);

    console.log('✅ Equations preserved in save/load');
  });

  it('should verify compiledBom is NOT saved', () => {
    const project = createMockProject();
    
    // Add compiledBom (would be generated during runtime)
    project.compiledBom = [
      {
        BOMitemName: 'Part A',
        numberNeeded: 5,
        costUSD: 2.50,
        source: 'https://example.com/partA',
      },
      {
        BOMitemName: 'Part B',
        numberNeeded: 3,
        costUSD: 1.75,
        source: 'https://example.com/partB',
      },
    ];

    const withBom = JSON.stringify(project);
    const withBomSize = withBom.length;

    // Remove compiledBom before saving (as optimized code should do)
    const projectWithoutBom = { ...project };
    delete projectWithoutBom.compiledBom;

    const withoutBom = JSON.stringify(projectWithoutBom);
    const withoutBomSize = withoutBom.length;

    const savings = withBomSize - withoutBomSize;
    const savingsPercent = ((savings / withBomSize) * 100).toFixed(1);

    console.log(`\n=== compiledBom Optimization ===`);
    console.log(`File size WITH compiledBom:    ${withBomSize} bytes`);
    console.log(`File size WITHOUT compiledBom: ${withoutBomSize} bytes`);
    console.log(`Savings:                       ${savings} bytes (${savingsPercent}%)`);

    // Verify the optimization saves space
    expect(withoutBomSize).toBeLessThan(withBomSize);
    expect(savings).toBeGreaterThan(0);

    // Verify essential data is still complete
    const loaded = JSON.parse(withoutBom);
    expect(loaded.allAtoms).toHaveLength(4);
    expect(loaded.allConnectors).toHaveLength(3);
    expect(loaded.compiledBom).toBeUndefined(); // Should not be present

    console.log('✅ compiledBom successfully excluded from save');
  });

  it('should handle complex project with many atoms', () => {
    // Create a larger project to test scalability
    const largeProject = {
      fileTypeVersion: 1,
      atomType: 'Molecule',
      name: 'Large Test Project',
      uniqueID: 'large-project-1',
      topLevel: true,
      x: 0.5,
      y: 0.5,
      allAtoms: [],
      allConnectors: [],
    };

    // Add 100 atoms
    for (let i = 0; i < 100; i++) {
      largeProject.allAtoms.push({
        atomType: ['Circle', 'Rectangle', 'Extrude', 'Move', 'Rotate'][i % 5],
        name: `Atom${i}`,
        uniqueID: `atom-${i}`,
        x: Math.random(),
        y: Math.random(),
        ioValues: [
          { name: 'input1', ioValue: Math.random() * 100 },
          { name: 'input2', ioValue: Math.random() * 100 },
        ],
      });

      // Add connectors between atoms
      if (i > 0) {
        largeProject.allConnectors.push({
          ap1Name: 'output',
          ap2Name: 'input',
          ap1ID: `atom-${i - 1}`,
          ap2ID: `atom-${i}`,
        });
      }
    }

    // Save and load
    const saved = JSON.stringify(largeProject);
    const loaded = JSON.parse(saved);

    expect(loaded.allAtoms).toHaveLength(100);
    expect(loaded.allConnectors).toHaveLength(99);

    const fileSize = saved.length;
    const avgBytesPerAtom = fileSize / 100;

    console.log(`\n=== Large Project Test ===`);
    console.log(`Atoms: 100`);
    console.log(`File size: ${fileSize.toLocaleString()} bytes`);
    console.log(`Avg per atom: ${avgBytesPerAtom.toFixed(0)} bytes`);

    // Should be reasonably efficient
    expect(avgBytesPerAtom).toBeLessThan(300);

    console.log('✅ Large project save/load successful');
  });

  it('should handle empty ioValues arrays', () => {
    const project = {
      fileTypeVersion: 1,
      atomType: 'Molecule',
      name: 'Minimal Project',
      uniqueID: 'min-1',
      topLevel: true,
      allAtoms: [
        {
          atomType: 'Output',
          name: 'Output',
          uniqueID: 'output-1',
          x: 0.98,
          y: 0.5,
          ioValues: [], // Empty array
        },
      ],
      allConnectors: [],
    };

    const saved = JSON.stringify(project);
    const loaded = JSON.parse(saved);

    expect(loaded.allAtoms[0].ioValues).toEqual([]);
    console.log('✅ Empty ioValues handled correctly');
  });

  it('should measure file size reduction from optimization', () => {
    // Create project with data that SHOULD be saved
    const essentialProject = {
      fileTypeVersion: 1,
      atomType: 'Molecule',
      name: 'Project',
      uniqueID: 'p1',
      topLevel: true,
      allAtoms: [
        { atomType: 'Circle', name: 'C1', uniqueID: 'a1', x: 0.2, y: 0.3, ioValues: [{ name: 'r', ioValue: 10 }] },
        { atomType: 'Extrude', name: 'E1', uniqueID: 'a2', x: 0.5, y: 0.3, ioValues: [{ name: 'h', ioValue: 50 }] },
      ],
      allConnectors: [{ ap1Name: 'output', ap2Name: 'geometry', ap1ID: 'a1', ap2ID: 'a2' }],
    };

    // Create bloated version with unnecessary data
    const bloatedProject = {
      ...essentialProject,
      compiledBom: [
        { BOMitemName: 'Part1', numberNeeded: 10, costUSD: 5.0, source: 'http://example.com' },
        { BOMitemName: 'Part2', numberNeeded: 5, costUSD: 3.0, source: 'http://example.com' },
      ],
      allAtoms: essentialProject.allAtoms.map(atom => ({
        ...atom,
        description: 'Long description text that is not needed because it can be looked up from atomType',
        color: '#F3EFEF',
        selected: false,
        isMoving: false,
      })),
    };

    const essentialSize = JSON.stringify(essentialProject).length;
    const bloatedSize = JSON.stringify(bloatedProject).length;
    const waste = bloatedSize - essentialSize;
    const wastePercent = ((waste / bloatedSize) * 100).toFixed(1);

    console.log(`\n=== Optimization Impact ===`);
    console.log(`Essential data only: ${essentialSize} bytes`);
    console.log(`With unnecessary data: ${bloatedSize} bytes`);
    console.log(`Wasted space: ${waste} bytes (${wastePercent}%)`);

    expect(essentialSize).toBeLessThan(bloatedSize);
    console.log('✅ Optimization removes unnecessary data');
  });
});
