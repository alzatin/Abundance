import { describe, it, expect } from 'vitest';
import { convertToGithubName, convertToDisplayName } from '../src/js/projectNameUtils.js';

describe('projectNameUtils', () => {
  describe('convertToGithubName', () => {
    it('should replace single space with underscore', () => {
      expect(convertToGithubName('My Project')).toBe('My_Project');
    });

    it('should replace multiple spaces with underscores', () => {
      expect(convertToGithubName('My Cool Project')).toBe('My_Cool_Project');
    });

    it('should replace multiple consecutive spaces with single underscore', () => {
      expect(convertToGithubName('My  Project')).toBe('My_Project');
    });

    it('should leave names without spaces unchanged', () => {
      expect(convertToGithubName('MyProject')).toBe('MyProject');
    });

    it('should leave names with underscores unchanged', () => {
      expect(convertToGithubName('My_Project')).toBe('My_Project');
    });

    it('should handle mixed spaces and underscores', () => {
      expect(convertToGithubName('My_Cool Project')).toBe('My_Cool_Project');
    });

    it('should handle leading and trailing spaces', () => {
      expect(convertToGithubName(' My Project ')).toBe('_My_Project_');
    });

    it('should return unchanged if input is empty string', () => {
      expect(convertToGithubName('')).toBe('');
    });

    it('should return unchanged if input is null', () => {
      expect(convertToGithubName(null)).toBe(null);
    });

    it('should return unchanged if input is undefined', () => {
      expect(convertToGithubName(undefined)).toBe(undefined);
    });
  });

  describe('convertToDisplayName', () => {
    it('should replace single underscore with space', () => {
      expect(convertToDisplayName('My_Project')).toBe('My Project');
    });

    it('should replace multiple underscores with spaces', () => {
      expect(convertToDisplayName('My_Cool_Project')).toBe('My Cool Project');
    });

    it('should leave names without underscores unchanged', () => {
      expect(convertToDisplayName('MyProject')).toBe('MyProject');
    });

    it('should leave names with spaces unchanged', () => {
      expect(convertToDisplayName('My Project')).toBe('My Project');
    });

    it('should handle mixed underscores and spaces', () => {
      expect(convertToDisplayName('My_Cool Project')).toBe('My Cool Project');
    });

    it('should handle leading and trailing underscores', () => {
      expect(convertToDisplayName('_My_Project_')).toBe(' My Project ');
    });

    it('should return unchanged if input is empty string', () => {
      expect(convertToDisplayName('')).toBe('');
    });

    it('should return unchanged if input is null', () => {
      expect(convertToDisplayName(null)).toBe(null);
    });

    it('should return unchanged if input is undefined', () => {
      expect(convertToDisplayName(undefined)).toBe(undefined);
    });
  });

  describe('round-trip conversion', () => {
    it('should maintain consistency when converting back and forth', () => {
      const original = 'My Cool Project';
      const github = convertToGithubName(original);
      const display = convertToDisplayName(github);
      expect(display).toBe(original);
    });

    it('should handle already underscore-formatted names', () => {
      const original = 'My_Cool_Project';
      const github = convertToGithubName(original);
      const display = convertToDisplayName(github);
      expect(github).toBe(original); // No change for github conversion
      expect(display).toBe('My Cool Project'); // Converts to spaces
    });
  });
});
