import { describe, it, expect } from 'vitest';
import { convertToGithubName, convertToDisplayName } from '../src/js/projectNameUtils.js';

describe('Project Name Validation Integration', () => {
  describe('End-to-end name conversion workflow', () => {
    it('should allow user to enter name with spaces and store with underscores', () => {
      // User types in "My Cool Project"
      const userInput = 'My Cool Project';
      
      // System converts to GitHub format
      const githubName = convertToGithubName(userInput);
      expect(githubName).toBe('My_Cool_Project');
      
      // System stores/uses this GitHub name for repo operations
      // (This would be the name sent to GitHub API)
      
      // When displaying back to user, convert back to readable format
      const displayName = convertToDisplayName(githubName);
      expect(displayName).toBe('My Cool Project');
    });

    it('should handle project names that already have underscores', () => {
      // User has an existing project "My_Existing_Project"
      const existingGithubName = 'My_Existing_Project';
      
      // Display to user with spaces
      const displayName = convertToDisplayName(existingGithubName);
      expect(displayName).toBe('My Existing Project');
      
      // If user doesn't change it, should stay the same
      const githubName = convertToGithubName(displayName);
      expect(githubName).toBe(existingGithubName);
    });

    it('should handle mixed format names', () => {
      // User types "My_Cool Project" (mixed underscores and spaces)
      const userInput = 'My_Cool Project';
      
      // Convert to GitHub format (all underscores)
      const githubName = convertToGithubName(userInput);
      expect(githubName).toBe('My_Cool_Project');
    });

    it('should handle multiple consecutive spaces gracefully', () => {
      // User accidentally types multiple spaces
      const userInput = 'My  Cool   Project';
      
      // Convert to GitHub format (single underscores)
      const githubName = convertToGithubName(userInput);
      expect(githubName).toBe('My_Cool_Project');
    });

    it('should validate that converted names are GitHub-compatible', () => {
      const testCases = [
        { input: 'Simple Project', expected: 'Simple_Project' },
        { input: 'Project With Numbers 123', expected: 'Project_With_Numbers_123' },
        { input: 'Project-With-Hyphens', expected: 'Project-With-Hyphens' },
        { input: 'Project.With.Dots', expected: 'Project.With.Dots' },
        { input: 'Mixed_Format Project', expected: 'Mixed_Format_Project' },
      ];

      testCases.forEach(({ input, expected }) => {
        const githubName = convertToGithubName(input);
        expect(githubName).toBe(expected);
        
        // Verify the result matches GitHub naming requirements
        // Must be alphanumeric with dots, underscores, and hyphens
        expect(githubName).toMatch(/^[a-zA-Z0-9._-]+$/);
      });
    });

    it('should preserve special characters that GitHub allows', () => {
      const userInput = 'Project-Name_v2.0';
      
      // Should preserve dots, underscores, and hyphens
      const githubName = convertToGithubName(userInput);
      expect(githubName).toBe('Project-Name_v2.0');
      
      // Display should preserve them too
      const displayName = convertToDisplayName(githubName);
      expect(displayName).toBe('Project-Name v2.0');
    });
  });

  describe('Validation scenarios that should pass', () => {
    it('should allow simple names with spaces', () => {
      const name = 'My Project';
      const githubName = convertToGithubName(name);
      
      // Should not be empty
      expect(githubName).toBeTruthy();
      
      // Should match GitHub requirements
      expect(githubName).toMatch(/^[a-zA-Z0-9._-]+$/);
    });

    it('should allow names with multiple words', () => {
      const name = 'My Amazing Project Name';
      const githubName = convertToGithubName(name);
      
      expect(githubName).toBe('My_Amazing_Project_Name');
      expect(githubName).toMatch(/^[a-zA-Z0-9._-]+$/);
    });

    it('should handle names up to 100 characters', () => {
      // Create a 95-character name with spaces (becomes 95 chars with underscores)
      const longName = 'A'.repeat(47) + ' ' + 'B'.repeat(47); // 95 total chars
      const githubName = convertToGithubName(longName);
      
      expect(githubName.length).toBe(95);
      expect(githubName).toMatch(/^[a-zA-Z0-9._-]+$/);
    });
  });

  describe('User experience improvements', () => {
    it('should make project names more readable in UI', () => {
      // Old behavior: User sees "My_Cool_Project" in the UI
      // New behavior: User sees "My Cool Project" in the UI
      
      const githubRepoName = 'Wall_Anchor_v2';
      const displayName = convertToDisplayName(githubRepoName);
      
      expect(displayName).toBe('Wall Anchor v2');
      expect(displayName).not.toContain('_');
    });

    it('should allow users to type natural project names', () => {
      // Users can now type with spaces, which is more natural
      const naturalInput = 'Kitchen Cabinet Design';
      const githubName = convertToGithubName(naturalInput);
      
      // System handles the conversion automatically
      expect(githubName).toBe('Kitchen_Cabinet_Design');
      expect(githubName).toMatch(/^[a-zA-Z0-9._-]+$/);
    });
  });
});
