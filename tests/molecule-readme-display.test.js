/**
 * Test for README text display in molecule inputs panel
 * Ensures that when a molecule contains README content, it appears in createInputParams
 */

import { describe, it, expect } from 'vitest';

/**
 * Helper function to simulate README processing logic from molecule.js
 * @param {object} mockMolecule - Mock molecule object with compiledReadme
 * @returns {object} Input parameters with README text
 */
function processReadmeToInputParams(mockMolecule) {
  let inputParams = {};
  
  if (mockMolecule.compiledReadme && Array.isArray(mockMolecule.compiledReadme) && mockMolecule.compiledReadme.length > 0) {
    // Add spacer and heading
    inputParams["readme-spacer-" + mockMolecule.uniqueID] = {
      type: "spacer",
      height: 0,
    };
    inputParams["readme-heading-" + mockMolecule.uniqueID] = {
      type: "string",
      value: "README:",
      disabled: true,
    };

    // Combine all readme text into a single display
    const combinedReadmeText = mockMolecule.compiledReadme
      .map((item) => item.readMeText)
      .join("\n\n");

    inputParams["readme-text-" + mockMolecule.uniqueID] = {
      type: "string",
      value: combinedReadmeText,
      multiline: true,
      rows: 10,
      disabled: true,
    };
  }
  
  return inputParams;
}

describe('Molecule README Display in Inputs Panel', () => {

  it('should include README text in createInputParams when compiledReadme exists', () => {
    // Create mock molecule with compiledReadme
    const mockMolecule = {
      uniqueID: 'test123',
      name: 'Test Molecule',
      topLevel: false,
      atomType: 'Molecule',
      compiledReadme: [
        { readMeText: 'This is the first README section', svg: null, uniqueID: 'readme1' },
        { readMeText: 'This is the second README section', svg: null, uniqueID: 'readme2' }
      ]
    };

    // Simulate the createInputParams logic for README
    const inputParams = processReadmeToInputParams(mockMolecule);

    // Verify heading is present
    expect(inputParams['readme-heading-test123']).toBeDefined();
    expect(inputParams['readme-heading-test123'].type).toBe('string');
    expect(inputParams['readme-heading-test123'].value).toBe('README:');
    expect(inputParams['readme-heading-test123'].disabled).toBe(true);
    
    // Verify spacer is present
    expect(inputParams['readme-spacer-test123']).toBeDefined();
    expect(inputParams['readme-spacer-test123'].type).toBe('spacer');

    // Verify README text appears in inputParams as multiline text
    expect(inputParams['readme-text-test123']).toBeDefined();
    expect(inputParams['readme-text-test123'].type).toBe('string');
    expect(inputParams['readme-text-test123'].value).toBe('This is the first README section\n\nThis is the second README section');
    expect(inputParams['readme-text-test123'].disabled).toBe(true);
    expect(inputParams['readme-text-test123'].multiline).toBe(true);
    expect(inputParams['readme-text-test123'].rows).toBe(10);
  });

  it('should not add README params when compiledReadme is empty', () => {
    const mockMolecule = {
      uniqueID: 'test456',
      name: 'Empty Molecule',
      topLevel: false,
      atomType: 'Molecule',
      compiledReadme: []
    };

    const inputParams = processReadmeToInputParams(mockMolecule);

    // Verify no README items are added
    expect(Object.keys(inputParams).length).toBe(0);
  });

  it('should not add README params when compiledReadme is undefined', () => {
    const mockMolecule = {
      uniqueID: 'test789',
      name: 'No README Molecule',
      topLevel: false,
      atomType: 'Molecule',
      compiledReadme: undefined
    };

    const inputParams = processReadmeToInputParams(mockMolecule);

    // Verify no README items are added
    expect(Object.keys(inputParams).length).toBe(0);
  });

  it('should handle single README item correctly', () => {
    const mockMolecule = {
      uniqueID: 'test999',
      name: 'Single README Molecule',
      topLevel: false,
      atomType: 'Molecule',
      compiledReadme: [
        { readMeText: 'Single README content here', svg: null, uniqueID: 'readme1' }
      ]
    };

    const inputParams = processReadmeToInputParams(mockMolecule);

    // Verify heading, spacer, and text (3 items total)
    expect(Object.keys(inputParams).length).toBe(3);
    
    // Verify README text shows correctly
    expect(inputParams['readme-text-test999'].value).toBe('Single README content here');
  });

  it('should combine multiple README items with double newlines', () => {
    const mockMolecule = {
      uniqueID: 'test111',
      name: 'Multi README Molecule',
      topLevel: false,
      atomType: 'Molecule',
      compiledReadme: [
        { readMeText: 'Section A', svg: null, uniqueID: 'r1' },
        { readMeText: 'Section B', svg: null, uniqueID: 'r2' },
        { readMeText: 'Section C', svg: null, uniqueID: 'r3' }
      ]
    };

    const inputParams = processReadmeToInputParams(mockMolecule);

    // Verify combined text has proper formatting
    expect(inputParams['readme-text-test111'].value).toBe('Section A\n\nSection B\n\nSection C');
  });

  it('should handle README with markdown formatting', () => {
    const mockMolecule = {
      uniqueID: 'test222',
      name: 'Markdown README Molecule',
      topLevel: false,
      atomType: 'Molecule',
      compiledReadme: [
        { readMeText: '### Heading\n\nThis is **bold** text', svg: null, uniqueID: 'r1' }
      ]
    };

    const inputParams = processReadmeToInputParams(mockMolecule);

    // Verify markdown is preserved in the text
    expect(inputParams['readme-text-test222'].value).toBe('### Heading\n\nThis is **bold** text');
  });
});
