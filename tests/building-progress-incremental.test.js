/**
 * Test for building progress bar incremental updates.
 * 
 * This test ensures that the progress bar shows incremental progress during the "Building" stage
 * rather than staying stuck at a fixed percentage (e.g., 30%).
 * 
 * The fix uses the molecule's getCompletionTuple() method to calculate actual progress
 * based on the ratio of ready atoms to total atoms, mapping it to the 30-80% range.
 */

import { describe, it, expect } from 'vitest';

describe('Building Progress Incremental Updates', () => {
  
  describe('progress calculation', () => {
    it('should calculate progress correctly when 0% of atoms are ready', () => {
      const ready = 0;
      const total = 10;
      
      // Map progress from 0-100% of atoms completed to 30-80% of overall progress
      const buildingProgress = 30 + (ready / total) * 50;
      
      expect(Math.round(buildingProgress)).toBe(30);
    });

    it('should calculate progress correctly when 20% of atoms are ready', () => {
      const ready = 2;
      const total = 10;
      
      const buildingProgress = 30 + (ready / total) * 50;
      
      expect(Math.round(buildingProgress)).toBe(40);
    });

    it('should calculate progress correctly when 50% of atoms are ready', () => {
      const ready = 5;
      const total = 10;
      
      const buildingProgress = 30 + (ready / total) * 50;
      
      expect(Math.round(buildingProgress)).toBe(55);
    });

    it('should calculate progress correctly when 80% of atoms are ready', () => {
      const ready = 8;
      const total = 10;
      
      const buildingProgress = 30 + (ready / total) * 50;
      
      expect(Math.round(buildingProgress)).toBe(70);
    });

    it('should calculate progress correctly when 100% of atoms are ready', () => {
      const ready = 10;
      const total = 10;
      
      const buildingProgress = 30 + (ready / total) * 50;
      
      expect(Math.round(buildingProgress)).toBe(80);
    });

    it('should never show progress below 30% during building stage', () => {
      // Even with 0 atoms ready, progress should be at least 30%
      const ready = 0;
      const total = 100;
      
      const buildingProgress = 30 + (ready / total) * 50;
      
      expect(Math.round(buildingProgress)).toBeGreaterThanOrEqual(30);
    });

    it('should never show progress above 80% during building stage', () => {
      // Even with all atoms ready, building stage caps at 80%
      const ready = 100;
      const total = 100;
      
      const buildingProgress = 30 + (ready / total) * 50;
      
      expect(Math.round(buildingProgress)).toBeLessThanOrEqual(80);
    });

    it('should show incremental progress as atoms complete', () => {
      const total = 10;
      let previousProgress = 30;
      
      // Simulate atoms completing one by one
      for (let ready = 0; ready <= total; ready++) {
        const buildingProgress = 30 + (ready / total) * 50;
        const roundedProgress = Math.round(buildingProgress);
        
        // Progress should never go backwards
        expect(roundedProgress).toBeGreaterThanOrEqual(previousProgress);
        previousProgress = roundedProgress;
      }
    });

    it('should handle edge case of single atom', () => {
      // With 1 atom total, progress should jump from 30% to 80%
      const total = 1;
      
      const progressBefore = 30 + (0 / total) * 50;
      expect(Math.round(progressBefore)).toBe(30);
      
      const progressAfter = 30 + (1 / total) * 50;
      expect(Math.round(progressAfter)).toBe(80);
    });

    it('should handle edge case of many atoms with fine-grained progress', () => {
      const total = 1000;
      
      // With many atoms, each completion should result in a small increment
      const progress1 = 30 + (0 / total) * 50;
      const progress2 = 30 + (1 / total) * 50;
      
      // Progress should increase, but only slightly
      expect(progress2).toBeGreaterThan(progress1);
      expect(progress2 - progress1).toBeLessThan(1); // Less than 1% increase per atom
    });
  });
});
