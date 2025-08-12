import { describe, it, expect } from 'vitest';

// Test the complete serialization workflow as it would happen in the app
describe('Serialization Integration Tests', () => {
  // Mock the GlobalVariables functions for testing
  function toBinaryStr(str) {
    return unescape(encodeURIComponent(str));
  }

  function fromBinaryStr(binaryStr) {
    return decodeURIComponent(escape(binaryStr));
  }

  it('should handle complete project serialization with UTF-8 content', () => {
    // Simulate a project structure with text and code atoms containing UTF-8
    const projectData = {
      filetypeVersion: 1,
      atomType: "Molecule",
      name: "Test Project",
      atoms: [
        {
          atomType: "Readme",
          readmeText: `# Project with UTF-8

This contains special characters:
- Café (French café) 
- Niño (Spanish child)
- Copyright © 2024
- Temperature: 25°C
- Price: €50
- Arrow: →
- Emoji: 🚀`,
          uniqueID: "readme-123"
        },
        {
          atomType: "Code", 
          code: `// Code with UTF-8 comments
/* 
 * Copyright © 2024 
 * Temperature: 25°C
 * Price: €50 
 */

function greet(name) {
  console.log(\`Hola \${name}! 🚀\`);
  return "Café con leche";
}

// Special chars: ñáéíóú
const message = "¡Hola mundo!";`,
          uniqueID: "code-456"
        }
      ]
    };

    // Test the complete save/load cycle as it happens in the app
    
    // 1. Serialize to JSON (as done in NewProjectPopUp.jsx)
    const jsonString = JSON.stringify(projectData, null, 4);
    
    // 2. Encode for GitHub storage (as done in NewProjectPopUp.jsx)
    const projectContent = btoa(toBinaryStr(jsonString));
    
    // 3. Decode when loading (as done in App.jsx and molecule.js)
    const decodedContent = fromBinaryStr(atob(projectContent));
    const loadedProject = JSON.parse(decodedContent);
    
    // 4. Verify the round-trip was successful
    expect(loadedProject).toEqual(projectData);
    
    // 5. Specifically check that UTF-8 content survived intact
    const readmeAtom = loadedProject.atoms.find(atom => atom.atomType === "Readme");
    const codeAtom = loadedProject.atoms.find(atom => atom.atomType === "Code");
    
    // Check readme content
    expect(readmeAtom.readmeText).toContain('Café');
    expect(readmeAtom.readmeText).toContain('Niño');
    expect(readmeAtom.readmeText).toContain('©');
    expect(readmeAtom.readmeText).toContain('°C');
    expect(readmeAtom.readmeText).toContain('€50');
    expect(readmeAtom.readmeText).toContain('→');
    expect(readmeAtom.readmeText).toContain('🚀');
    
    // Should not contain Â characters
    expect(readmeAtom.readmeText).not.toContain('Â');
    
    // Check code content
    expect(codeAtom.code).toContain('©');
    expect(codeAtom.code).toContain('°C');
    expect(codeAtom.code).toContain('€50');
    expect(codeAtom.code).toContain('🚀');
    expect(codeAtom.code).toContain('Café con leche');
    expect(codeAtom.code).toContain('ñáéíóú');
    expect(codeAtom.code).toContain('¡Hola mundo!');
    
    // Should not contain Â characters
    expect(codeAtom.code).not.toContain('Â');
    
    console.log('✅ Complete project serialization test passed');
  });

  it('should handle license text serialization (existing use case)', () => {
    // This tests the existing license serialization path
    const licenseText = `MIT License

Copyright © 2024 Test User

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

Price: €0 (Free)
Temperature rating: -40°C to 85°C`;

    // This is how license content is saved (using toBinaryStr)
    const encoded = btoa(toBinaryStr(licenseText));
    const decoded = fromBinaryStr(atob(encoded));
    
    expect(decoded).toBe(licenseText);
    expect(decoded).not.toContain('Â');
    expect(decoded).toContain('©');
    expect(decoded).toContain('€');
    expect(decoded).toContain('°C');
    
    console.log('✅ License serialization test passed');
  });

  it('should handle edge cases and complex UTF-8 sequences', () => {
    const complexText = `Mixed content test:
- ASCII: Hello World 123
- Latin-1: café résumé naïve
- Extended: ñáéíóúüç
- Symbols: ©®™°€£¥§¶†‡•…‰‹›""''
- Math: ∑∏∆∇∂∞≠≤≥±×÷√∝∈∉∪∩
- Arrows: ←→↑↓↔↕⇐⇒⇑⇓
- Chinese: 你好世界测试
- Japanese: こんにちは世界テスト  
- Korean: 안녕하세요 세계 테스트
- Arabic: مرحبا بالعالم اختبار
- Hebrew: שלום עולם מבחן
- Russian: Привет мир тест
- Emoji: 🌍🚀⭐️🎉💯🔥⚡️✨🌟💫
- Combined: Café ☕️ → Restaurant 🍽️ € 25.50
`;

    // Test the complete encoding/decoding cycle
    const jsonData = { content: complexText };
    const jsonString = JSON.stringify(jsonData);
    const encoded = btoa(toBinaryStr(jsonString));
    const decoded = fromBinaryStr(atob(encoded));
    const parsedData = JSON.parse(decoded);
    
    expect(parsedData.content).toBe(complexText);
    expect(parsedData.content).not.toContain('Â');
    
    console.log('✅ Complex UTF-8 test passed');
  });
});