/**
 * Test to verify README SVG cache-busting with content hash
 */

import { describe, it, expect } from "vitest";

describe("README SVG Cache-Busting", () => {
  // Helper function to generate hash from SVG content (same as in molecule.js)
  const generateSvgHash = (svg) => {
    return svg
      .split('')
      .reduce((hash, char) => {
        const charCode = char.charCodeAt(0);
        return ((hash << 5) - hash + charCode) | 0;
      }, 0)
      .toString(36)
      .replace('-', 'n');
  };

  it("should generate different hashes for different SVG content", () => {
    const svg1 = '<svg><circle cx="50" cy="50" r="40"/></svg>';
    const svg2 = '<svg><rect x="10" y="10" width="100" height="100"/></svg>';
    
    const hash1 = generateSvgHash(svg1);
    const hash2 = generateSvgHash(svg2);
    
    expect(hash1).not.toBe(hash2);
    console.log(`SVG1 hash: ${hash1}, SVG2 hash: ${hash2}`);
  });

  it("should generate same hash for identical SVG content", () => {
    const svg = '<svg><path d="M10 10 L20 20"/></svg>';
    
    const hash1 = generateSvgHash(svg);
    const hash2 = generateSvgHash(svg);
    
    expect(hash1).toBe(hash2);
  });

  it("should generate different hash when SVG content changes slightly", () => {
    const svg1 = '<svg><circle cx="50" cy="50" r="40"/></svg>';
    const svg2 = '<svg><circle cx="50" cy="50" r="41"/></svg>'; // Only radius changed
    
    const hash1 = generateSvgHash(svg1);
    const hash2 = generateSvgHash(svg2);
    
    expect(hash1).not.toBe(hash2);
  });

  it("should handle negative hash values by replacing - with n", () => {
    // Test various SVG contents to ensure no minus signs in output
    const svgSamples = [
      '<svg></svg>',
      '<svg><path d="M0 0"/></svg>',
      '<svg><circle r="10"/></svg>',
      '<svg><rect width="100" height="100"/></svg>',
    ];
    
    svgSamples.forEach(svg => {
      const hash = generateSvgHash(svg);
      expect(hash).not.toContain('-');
    });
  });

  it("should demonstrate cache-busting URL format", () => {
    const uniqueID = "readme-123";
    const svg = '<svg><circle cx="50" cy="50" r="40"/></svg>';
    const hash = generateSvgHash(svg);
    
    const url = `/readme${uniqueID}.svg?v=${hash}`;
    
    expect(url).toContain('?v=');
    expect(url).toMatch(/\/readme.*\.svg\?v=.+/);
    console.log(`Generated URL: ${url}`);
  });

  it("should show that URL changes when geometry changes", () => {
    const uniqueID = "readme-123";
    
    // First geometry - box
    const svg1 = '<svg viewBox="0 0 800 800"><rect x="100" y="100" width="200" height="200" fill="#ccc"/></svg>';
    const hash1 = generateSvgHash(svg1);
    const url1 = `/readme${uniqueID}.svg?v=${hash1}`;
    
    // Second geometry - sphere (different SVG)
    const svg2 = '<svg viewBox="0 0 800 800"><circle cx="200" cy="200" r="100" fill="#ccc"/></svg>';
    const hash2 = generateSvgHash(svg2);
    const url2 = `/readme${uniqueID}.svg?v=${hash2}`;
    
    // URLs should be different even though uniqueID is the same
    expect(url1).not.toBe(url2);
    expect(url1.split('?v=')[0]).toBe(url2.split('?v=')[0]); // Same base filename
    expect(url1.split('?v=')[1]).not.toBe(url2.split('?v=')[1]); // Different hash
    
    console.log(`Box geometry URL: ${url1}`);
    console.log(`Sphere geometry URL: ${url2}`);
  });

  it("should generate consistent hash format for base36 strings", () => {
    const svg = '<svg><path d="M10 10 L20 20"/></svg>';
    const hash = generateSvgHash(svg);
    
    // Should be a base36 string (0-9, a-z, and n for negative)
    expect(hash).toMatch(/^[0-9a-zn]+$/);
  });
});
