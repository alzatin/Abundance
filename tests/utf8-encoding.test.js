import { describe, it, expect } from 'vitest';

// Create an improved version of toBinaryStr to test the fix
function toBinaryStrFixed(str) {
  // Use percent encoding to safely convert UTF-8 to binary for btoa
  return unescape(encodeURIComponent(str));
}

function fromBinaryStrFixed(binaryStr) {
  // Decode percent-encoded UTF-8 back to original string
  return decodeURIComponent(escape(binaryStr));
}

// Keep the old problematic version for comparison
function toBinaryStrOld(str) {
  const encoder = new TextEncoder();
  // 1: split the UTF-16 string into an array of bytes
  const charCodes = encoder.encode(str);
  // 2: concatenate byte data to create a binary string
  return String.fromCharCode(...charCodes);
}

describe('UTF-8 Encoding/Decoding', () => {
  it('should demonstrate the issue with the old encoding method', () => {
    // Test strings with various UTF-8 characters that commonly cause issues
    const testStrings = [
      'Copyright © 2024', // Copyright symbol
      'Temperature: 25°C', // Degree symbol
      'Price: €50', // Euro symbol
      'Café résumé naïve', // Accented characters
    ];

    testStrings.forEach(testString => {
      // Test the old problematic encoding method
      const binaryStr = toBinaryStrOld(testString);
      const encoded = btoa(binaryStr);
      const decoded = atob(encoded);
      
      // This should fail - demonstrating the issue
      if (decoded.includes('Â')) {
        console.log(`OLD METHOD - Issue found with string: "${testString}"`);
        console.log(`OLD METHOD - Decoded: "${decoded}"`);
      }
    });
  });

  it('should fix UTF-8 characters without adding Â using new method', () => {
    // Test strings with various UTF-8 characters that commonly cause issues
    const testStrings = [
      'Hello World', // Basic ASCII
      'Hello ñ test', // Latin-1 extended
      'Hello 你好 世界', // Chinese characters
      'Café résumé naïve', // Accented characters
      'Copyright © 2024', // Copyright symbol
      'Temperature: 25°C', // Degree symbol
      'Price: €50', // Euro symbol
      'Arrow: → ← ↑ ↓', // Arrow symbols
      '🚀 Rocket 🌟 Star', // Emoji
      'Multi\nline\ntext\nwith\nspecial\nchars: ñáéíóú'
    ];

    testStrings.forEach(testString => {
      // Test the new fixed encoding method
      const binaryStr = toBinaryStrFixed(testString);
      const encoded = btoa(binaryStr);
      const decoded = atob(encoded);
      const final = fromBinaryStrFixed(decoded);
      
      // The final decoded string should not contain Â characters
      expect(final).not.toContain('Â');
      
      // And it should equal the original
      expect(final).toBe(testString);
      
      console.log(`NEW METHOD - "${testString}" -> SUCCESS`);
    });
  });

  it('should properly round-trip encode and decode UTF-8 text with new method', () => {
    const originalText = 'Test with special chars: ñáéíóú, €50, 25°C, 🚀';
    
    // New method
    const binaryStr = toBinaryStrFixed(originalText);
    const encoded = btoa(binaryStr);
    const decoded = atob(encoded);
    const final = fromBinaryStrFixed(decoded);
    
    // The text should survive the round trip without corruption
    console.log('Original:', originalText);
    console.log('Final:', final);
    console.log('Are they equal?', originalText === final);
    
    // Should not contain Â characters and should be equal to original
    expect(final).not.toContain('Â');
    expect(final).toBe(originalText);
  });

  it('should handle readme text serialization correctly with new method', () => {
    const readmeText = `# My Project

This project contains special characters:
- Café (French)
- Niño (Spanish) 
- 你好 (Chinese)
- Copyright © 2024
- Temperature: 25°C
- Price: €50

## Features
→ Feature 1
→ Feature 2
→ Feature 3

🚀 Ready to launch!`;

    // Test the new serialization path for readme atoms
    const binaryStr = toBinaryStrFixed(readmeText);
    const encoded = btoa(binaryStr);
    const decoded = atob(encoded);
    const final = fromBinaryStrFixed(decoded);
    
    // Should not contain Â characters and should equal original
    expect(final).not.toContain('Â');
    expect(final).toBe(readmeText);
    
    console.log('README test with new method - Contains Â?', final.includes('Â'));
  });

  it('should handle code text serialization correctly with new method', () => {
    const codeText = `// Code with special characters
/* Multiline comment with UTF-8:
   - Copyright © 2024
   - Temperature: 25°C
   - Price: €50
*/

function greet(name) {
  console.log(\`Hello \${name}! 🚀\`);
  // More special chars: ñáéíóú
  return "Café résumé naïve";
}`;

    // Test the new serialization path for code atoms  
    const binaryStr = toBinaryStrFixed(codeText);
    const encoded = btoa(binaryStr);
    const decoded = atob(encoded);
    const final = fromBinaryStrFixed(decoded);
    
    // Should not contain Â characters and should equal original
    expect(final).not.toContain('Â');
    expect(final).toBe(codeText);
    
    console.log('CODE test with new method - Contains Â?', final.includes('Â'));
  });

  it('should handle JSON serialization with UTF-8 content', () => {
    // Simulate what happens when a project with UTF-8 content is serialized
    const projectData = {
      atoms: [
        {
          type: 'readme',
          content: 'Café © 2024 → 25°C'
        },
        {
          type: 'code', 
          content: 'console.log("Hello 🚀 ñáéíóú");'
        }
      ]
    };

    // This is how project content is currently saved (without toBinaryStr)
    const jsonString = JSON.stringify(projectData, null, 4);
    
    try {
      // Direct btoa (this might fail with UTF-8)
      const encoded = btoa(jsonString);
      const decoded = atob(encoded);
      
      // If this works, great! If not, we know we need a different approach
      expect(decoded).toBe(jsonString);
      console.log('Direct JSON + btoa works fine for this content');
    } catch (error) {
      console.log('Direct JSON + btoa fails, need UTF-8 handling:', error.message);
      
      // Try with our new encoding method
      const binaryStr = toBinaryStrFixed(jsonString);
      const encoded = btoa(binaryStr);
      const decoded = atob(encoded);
      const final = fromBinaryStrFixed(decoded);
      
      expect(final).toBe(jsonString);
      console.log('New encoding method works for JSON content');
    }
  });
});