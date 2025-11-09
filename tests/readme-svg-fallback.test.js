/**
 * Test to verify that readme SVG is used as fallback when main output produces empty SVG
 */

import { describe, it, expect } from 'vitest';

describe('Readme SVG Fallback Logic', () => {
  // Helper function to check if an SVG is valid and has content
  const isValidSVG = (svg) => {
    if (!svg) return false;
    // Check if SVG is empty (has no paths or other content between svg tags)
    // An empty SVG looks like: <svg viewBox="..." xmlns="..."></svg>
    const hasContent = svg.includes('<path') || svg.includes('<circle') || 
                      svg.includes('<rect') || svg.includes('<line') ||
                      svg.includes('<polygon') || svg.includes('<polyline');
    return hasContent;
  };

  it('should detect empty SVG correctly', () => {
    const emptySVG = '<svg viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg"></svg>';
    expect(isValidSVG(emptySVG)).toBe(false);
  });

  it('should detect valid SVG with path correctly', () => {
    const validSVG = '<svg viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg"><path d="M100,100 L200,200" stroke="black"/></svg>';
    expect(isValidSVG(validSVG)).toBe(true);
  });

  it('should detect valid SVG with circle correctly', () => {
    const validSVG = '<svg viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="50"/></svg>';
    expect(isValidSVG(validSVG)).toBe(true);
  });

  it('should detect valid SVG with rect correctly', () => {
    const validSVG = '<svg viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="100" height="100"/></svg>';
    expect(isValidSVG(validSVG)).toBe(true);
  });

  it('should return false for null SVG', () => {
    expect(isValidSVG(null)).toBe(false);
  });

  it('should return false for undefined SVG', () => {
    expect(isValidSVG(undefined)).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isValidSVG('')).toBe(false);
  });

  describe('Thumbnail Selection Logic', () => {
    it('should use finalSVG when it has content', () => {
      const finalSVG = '<svg viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg"><path d="M100,100 L200,200" stroke="black"/></svg>';
      const backupProjectSVG = '<svg viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="50"/></svg>';
      
      const thumbnailToUse = (finalSVG && isValidSVG(finalSVG)) ? finalSVG : 
                             (backupProjectSVG && isValidSVG(backupProjectSVG)) ? backupProjectSVG : 
                             null;
      
      expect(thumbnailToUse).toBe(finalSVG);
    });

    it('should use backupProjectSVG when finalSVG is empty', () => {
      const finalSVG = '<svg viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg"></svg>';
      const backupProjectSVG = '<svg viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="50"/></svg>';
      
      const thumbnailToUse = (finalSVG && isValidSVG(finalSVG)) ? finalSVG : 
                             (backupProjectSVG && isValidSVG(backupProjectSVG)) ? backupProjectSVG : 
                             null;
      
      expect(thumbnailToUse).toBe(backupProjectSVG);
    });

    it('should use backupProjectSVG when finalSVG is null', () => {
      const finalSVG = null;
      const backupProjectSVG = '<svg viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg"><path d="M50,50 L150,150" stroke="red"/></svg>';
      
      const thumbnailToUse = (finalSVG && isValidSVG(finalSVG)) ? finalSVG : 
                             (backupProjectSVG && isValidSVG(backupProjectSVG)) ? backupProjectSVG : 
                             null;
      
      expect(thumbnailToUse).toBe(backupProjectSVG);
    });

    it('should use backupProjectSVG when finalSVG is undefined', () => {
      const finalSVG = undefined;
      const backupProjectSVG = '<svg viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="100" height="100"/></svg>';
      
      const thumbnailToUse = (finalSVG && isValidSVG(finalSVG)) ? finalSVG : 
                             (backupProjectSVG && isValidSVG(backupProjectSVG)) ? backupProjectSVG : 
                             null;
      
      expect(thumbnailToUse).toBe(backupProjectSVG);
    });

    it('should return null when both finalSVG and backupProjectSVG are empty', () => {
      const finalSVG = '<svg viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg"></svg>';
      const backupProjectSVG = '<svg viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg"></svg>';
      
      const thumbnailToUse = (finalSVG && isValidSVG(finalSVG)) ? finalSVG : 
                             (backupProjectSVG && isValidSVG(backupProjectSVG)) ? backupProjectSVG : 
                             null;
      
      expect(thumbnailToUse).toBeNull();
    });

    it('should return null when both finalSVG and backupProjectSVG are null', () => {
      const finalSVG = null;
      const backupProjectSVG = null;
      
      const thumbnailToUse = (finalSVG && isValidSVG(finalSVG)) ? finalSVG : 
                             (backupProjectSVG && isValidSVG(backupProjectSVG)) ? backupProjectSVG : 
                             null;
      
      expect(thumbnailToUse).toBeNull();
    });

    it('should return null when finalSVG is empty and backupProjectSVG is null', () => {
      const finalSVG = '<svg viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg"></svg>';
      const backupProjectSVG = null;
      
      const thumbnailToUse = (finalSVG && isValidSVG(finalSVG)) ? finalSVG : 
                             (backupProjectSVG && isValidSVG(backupProjectSVG)) ? backupProjectSVG : 
                             null;
      
      expect(thumbnailToUse).toBeNull();
    });

    it('should prioritize finalSVG when both have content', () => {
      const finalSVG = '<svg viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg"><path d="M100,100 L200,200" stroke="black"/></svg>';
      const backupProjectSVG = '<svg viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="50"/></svg>';
      
      const thumbnailToUse = (finalSVG && isValidSVG(finalSVG)) ? finalSVG : 
                             (backupProjectSVG && isValidSVG(backupProjectSVG)) ? backupProjectSVG : 
                             null;
      
      expect(thumbnailToUse).toBe(finalSVG);
      expect(thumbnailToUse).not.toBe(backupProjectSVG);
    });
  });
});
