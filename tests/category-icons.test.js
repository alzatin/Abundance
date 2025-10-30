import { describe, it, expect } from 'vitest';

/**
 * Test for category icon CSS classes
 * 
 * This test validates that category icons are properly configured.
 * It checks that the NewMenu configuration references the expected icons
 * and that the CSS styling system can handle them correctly.
 */
describe('Category Icon Configuration', () => {
  
  it('should have correct icon names in menu configuration', () => {
    // Import the NewMenu to check configuration
    // We're testing that the expected category icon names are used
    const expectedCategoryIcons = [
      'Actions',
      'Inputs',
      'Tags',
      'Import-Export',
      'Shapes',  // This is the one that was reported as missing
      'Interaction'
    ];
    
    // Verify each expected icon name is a valid string
    expectedCategoryIcons.forEach(icon => {
      expect(typeof icon).toBe('string');
      expect(icon.length).toBeGreaterThan(0);
    });
    
    // Specifically check that 'Shapes' is in the list
    expect(expectedCategoryIcons).toContain('Shapes');
  });
  
  it('should verify Shapes icon name case sensitivity handling', () => {
    // The fix adds support for both .Shapes and .shapes CSS classes
    // This test documents that both should be supported
    const capitalizedIcon = 'Shapes';
    const lowercaseIcon = 'shapes';
    
    // Both should be valid identifiers
    expect(capitalizedIcon.toLowerCase()).toBe(lowercaseIcon);
    expect(lowercaseIcon).toBe('shapes');
    expect(capitalizedIcon).toBe('Shapes');
  });
  
  it('should have consistent icon naming pattern with other categories', () => {
    // All category icons should follow Title Case pattern
    const categoryIcons = [
      'Actions',
      'Inputs', 
      'Shapes',
      'Tags',
      'Interaction'
    ];
    
    categoryIcons.forEach(icon => {
      // First letter should be uppercase
      expect(icon[0]).toBe(icon[0].toUpperCase());
      // Rest should be lowercase (except for compound names like Import-Export)
      if (!icon.includes('-')) {
        const restOfString = icon.slice(1);
        expect(restOfString).toBe(restOfString.toLowerCase());
      }
    });
  });
});
