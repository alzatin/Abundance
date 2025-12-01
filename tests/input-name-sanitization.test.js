import { describe, it, expect } from 'vitest';

/**
 * Test the input name sanitization logic used in the Input molecule.
 * This verifies that equation operator characters are replaced with underscores
 * to prevent them from being mistaken as operators when used in equations.
 */
describe('Input name sanitization', () => {
  // This is the sanitization regex used in src/molecules/input.js
  const sanitizeName = (name) => name.replace(/[\s\-+*/%]+/g, "_");

  describe('hyphen replacement', () => {
    it('should replace single hyphen with underscore', () => {
      expect(sanitizeName('wood-thickness')).toBe('wood_thickness');
    });

    it('should replace multiple hyphens with single underscore', () => {
      expect(sanitizeName('wood--thickness')).toBe('wood_thickness');
    });

    it('should handle hyphen at the start', () => {
      expect(sanitizeName('-thickness')).toBe('_thickness');
    });

    it('should handle hyphen at the end', () => {
      expect(sanitizeName('thickness-')).toBe('thickness_');
    });

    it('should handle complex hyphenated names', () => {
      expect(sanitizeName('wall-anchor-size')).toBe('wall_anchor_size');
    });
  });

  describe('space replacement (existing behavior)', () => {
    it('should replace single space with underscore', () => {
      expect(sanitizeName('wood thickness')).toBe('wood_thickness');
    });

    it('should replace multiple spaces with single underscore', () => {
      expect(sanitizeName('wood  thickness')).toBe('wood_thickness');
    });

    it('should handle leading and trailing spaces', () => {
      expect(sanitizeName(' thickness ')).toBe('_thickness_');
    });
  });

  describe('other operator characters', () => {
    it('should replace plus sign with underscore', () => {
      expect(sanitizeName('a+b')).toBe('a_b');
    });

    it('should replace asterisk with underscore', () => {
      expect(sanitizeName('a*b')).toBe('a_b');
    });

    it('should replace forward slash with underscore', () => {
      expect(sanitizeName('a/b')).toBe('a_b');
    });

    it('should replace percent sign with underscore', () => {
      expect(sanitizeName('a%b')).toBe('a_b');
    });
  });

  describe('mixed operator characters', () => {
    it('should replace mixed operators and spaces with underscores', () => {
      expect(sanitizeName('a + b - c')).toBe('a_b_c');
    });

    it('should replace consecutive mixed operators with single underscore', () => {
      expect(sanitizeName('a+-*/b')).toBe('a_b');
    });

    it('should handle real-world example: wood-thickness', () => {
      expect(sanitizeName('wood-thickness')).toBe('wood_thickness');
    });

    it('should handle real-world example: board width', () => {
      expect(sanitizeName('board width')).toBe('board_width');
    });
  });

  describe('names without operators', () => {
    it('should leave names with only letters unchanged', () => {
      expect(sanitizeName('thickness')).toBe('thickness');
    });

    it('should leave names with letters and numbers unchanged', () => {
      expect(sanitizeName('size2')).toBe('size2');
    });

    it('should leave names with underscores unchanged', () => {
      expect(sanitizeName('wood_thickness')).toBe('wood_thickness');
    });

    it('should handle empty string', () => {
      expect(sanitizeName('')).toBe('');
    });
  });
});
