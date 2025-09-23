import { describe, it, expect, beforeEach } from "vitest";

// Mock the required dependencies
class MockAtom {
  constructor() {
    this.inputs = [];
  }
  
  _addIOWithoutSubscribing(name, type, defaultValue, inputType) {
    const input = { name, valueType: type, defaultValue, type: inputType };
    this.inputs.push(input);
    return input;
  }
  
  removeIO(type, name, atom) {
    this.inputs = this.inputs.filter(input => input.name !== name);
  }
}

// Mock Code class with just the parseInputs method
class MockCode extends MockAtom {
  constructor(code) {
    super();
    this.code = code;
  }
  
  parseInputs() {
    // Match Inputs = [{inputName: ..., type: ..., defaultValue: ...}, ...]
    // Try to extract a const Inputs = [...] block
    // Only parse the first Inputs declaration (const Inputs = [...] or Inputs = [...])
    // Remove all block comments and line comments before matching Inputs array
    let codeNoComments = this.code.replace(/\/\*[\s\S]*?\*\//g, ""); // Remove block comments
    codeNoComments = codeNoComments.replace(/\/\/.*$/gm, ""); // Remove line comments
    const allInputsMatches = [
      ...codeNoComments.matchAll(/(?:const\s+)?Inputs\s*=\s*\[(.*?)]\s*;?/gs),
    ];
    if (allInputsMatches.length > 0) {
      const firstMatch = allInputsMatches[0];
      // If it's a const declaration, use safe eval
      if (/const\s+Inputs\s*=/.test(firstMatch[0])) {
        try {
          const sandboxFn = new Function(firstMatch[0] + "; return Inputs;");
          const inputsArray = sandboxFn();
          const variableNames = [];
          inputsArray.forEach(({ inputName, type, defaultValue }) => {
            variableNames.push(inputName);
            const existingInput = this.inputs.find(
              (input) => input.name === inputName
            );

            if (!existingInput) {
              this._addIOWithoutSubscribing(
                inputName,
                type,
                defaultValue,
                "input"
              );
            } else {
              existingInput.valueType = type;
              existingInput.defaultValue = defaultValue;
            }
          });
          // Remove any inputs not in the new array
          const inputList = [...this.inputs];
          inputList.forEach((input) => {
            if (!variableNames.includes(input.name)) {
              this.removeIO(input.type, input.name, this);
            }
          });
          return;
        } catch (e) {
          console.warn("Failed to eval const Inputs array from code:", e);
        }
      } else {
        // Otherwise, parse as JSON
        let arrStr = firstMatch[1];
        arrStr = arrStr.replace(/\n/g, ""); // Remove newlines
        arrStr = arrStr.replace(/\r/g, ""); // Remove carriage returns
        arrStr = arrStr.replace(/,\s*$/, ""); // Remove trailing comma at end
        arrStr = arrStr.replace(/(\w+)\s*:/g, '"$1":');
        arrStr = arrStr.replace(/'/g, '"');
        try {
          const inputsArray = JSON.parse(`[${arrStr}]`);
          const variableNames = [];
          inputsArray.forEach(({ inputName, type, defaultValue }) => {
            variableNames.push(inputName);
            const existingInput = this.inputs.find(
              (input) => input.name === inputName
            );
            if (!existingInput) {
              this._addIOWithoutSubscribing(
                inputName,
                type,
                defaultValue,
                "input"
              );
            } else {
              existingInput.valueType = type;
              existingInput.defaultValue = defaultValue;
            }
          });
          // Remove any inputs not in the new array
          const inputList = [...this.inputs];
          inputList.forEach((input) => {
            if (!variableNames.includes(input.name)) {
              this.removeIO(input.type, input.name, this);
            }
          });
          return;
        } catch (e) {
          console.warn("Failed to parse Inputs array from code:", e);
        }
      }
    }
    // Fallback: legacy string parsing
    const variables = /Inputs:\[\s*([^)]+?)\s*\]/.exec(this.code);
    if (variables) {
      const variableNames = [];
      const parsedVariables =
        variables[1]?.split(/\s*,\s*/).map((v) => v.split(/\s*=\s*/)) || [];
      parsedVariables.forEach(([name, defaultVal]) => {
        const value = defaultVal || 10;
        variableNames.push(name);
        const existingInput = this.inputs.find((input) => input.name === name);
        if (!existingInput) {
          this._addIOWithoutSubscribing(name, "geometry", value, "input");
        }
      });
      const inputList = [...this.inputs];
      inputList.forEach((input) => {
        if (!variableNames.includes(input.name)) {
          this.removeIO(input.type, input.name, this);
        }
      });
    }
  }
}

describe("Code atom input parsing", () => {
  describe("parseInputs method", () => {
    it("should parse inputs with trailing comma correctly", () => {
      const codeWithTrailingComma = `      Inputs = [
       {inputName: "A", type: "geometry", defaultValue: null},
       {inputName: "B", type: "geometry", defaultValue: null},
      ]
      //This defines the molecules inputs and creates variables with the same names which can be referenced in the code

      //Takes the address and gets the shape from the library
      let importedShapeA = library[A]`;

      const codeAtom = new MockCode(codeWithTrailingComma);
      codeAtom.parseInputs();

      expect(codeAtom.inputs).toHaveLength(2);
      expect(codeAtom.inputs[0]).toEqual({
        name: "A",
        valueType: "geometry",
        defaultValue: null,
        type: "input"
      });
      expect(codeAtom.inputs[1]).toEqual({
        name: "B",
        valueType: "geometry",
        defaultValue: null,
        type: "input"
      });
    });

    it("should parse const Inputs declaration correctly", () => {
      const constCode = `const Inputs = [
        {inputName: "shape", type: "geometry", defaultValue: null},
        {inputName: "dist", type: "number", defaultValue: 5},
        {inputName: "height", type: "number", defaultValue: 10}
      ];
      
      let importedShape = library[shape]`;

      const codeAtom = new MockCode(constCode);
      codeAtom.parseInputs();

      expect(codeAtom.inputs).toHaveLength(3);
      expect(codeAtom.inputs.map(i => i.name)).toEqual(["shape", "dist", "height"]);
      expect(codeAtom.inputs.map(i => i.valueType)).toEqual(["geometry", "number", "number"]);
      expect(codeAtom.inputs.map(i => i.defaultValue)).toEqual([null, 5, 10]);
    });

    it("should handle inputs without trailing comma", () => {
      const codeWithoutTrailingComma = `Inputs = [
        {inputName: "x", type: "number", defaultValue: 10},
        {inputName: "y", type: "number", defaultValue: 20}
      ]`;

      const codeAtom = new MockCode(codeWithoutTrailingComma);
      codeAtom.parseInputs();

      expect(codeAtom.inputs).toHaveLength(2);
      expect(codeAtom.inputs[0].name).toBe("x");
      expect(codeAtom.inputs[1].name).toBe("y");
    });

    it("should ignore comments when parsing inputs", () => {
      const codeWithComments = `/* Block comment */
      Inputs = [
        {inputName: "test", type: "geometry", defaultValue: null}, // Line comment
        {inputName: "value", type: "number", defaultValue: 5}, // Another comment
      ]
      // This defines the molecules inputs`;

      const codeAtom = new MockCode(codeWithComments);
      codeAtom.parseInputs();

      expect(codeAtom.inputs).toHaveLength(2);
      expect(codeAtom.inputs[0].name).toBe("test");
      expect(codeAtom.inputs[1].name).toBe("value");
    });

    it("should handle empty inputs array", () => {
      const emptyInputsCode = `Inputs = []
      
      let someCode = true;`;

      const codeAtom = new MockCode(emptyInputsCode);
      codeAtom.parseInputs();

      expect(codeAtom.inputs).toHaveLength(0);
    });

    it("should handle malformed inputs gracefully", () => {
      const malformedCode = `Inputs = [
        {inputName: "broken" type: "geometry", defaultValue: null},
      ]`;

      const codeAtom = new MockCode(malformedCode);
      
      // Should not throw an error, should handle gracefully
      expect(() => codeAtom.parseInputs()).not.toThrow();
      // Should not create any inputs due to malformed JSON
      expect(codeAtom.inputs).toHaveLength(0);
    });

    it("should update existing inputs when parseInputs is called again", () => {
      const initialCode = `Inputs = [
        {inputName: "A", type: "geometry", defaultValue: null}
      ]`;

      const codeAtom = new MockCode(initialCode);
      codeAtom.parseInputs();

      expect(codeAtom.inputs).toHaveLength(1);
      expect(codeAtom.inputs[0].name).toBe("A");

      // Update the code
      codeAtom.code = `Inputs = [
        {inputName: "A", type: "number", defaultValue: 10},
        {inputName: "B", type: "geometry", defaultValue: null}
      ]`;
      
      codeAtom.parseInputs();

      expect(codeAtom.inputs).toHaveLength(2);
      expect(codeAtom.inputs[0].name).toBe("A");
      expect(codeAtom.inputs[0].valueType).toBe("number");
      expect(codeAtom.inputs[0].defaultValue).toBe(10);
      expect(codeAtom.inputs[1].name).toBe("B");
    });
  });
});