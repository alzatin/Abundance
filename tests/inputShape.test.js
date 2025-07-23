// Test to reproduce the inputShape is not defined error
import { init } from "../src/worker/util.js";
import { executeCode } from "../src/worker/code.js";
import { rectangle } from "../src/worker/shapes.js";
import { extrude } from "../src/worker/actions.js";

describe("inputShape issue", () => {
  beforeAll(async () => {
    await init();
  });

  describe("inputShape variable", () => {
    it("should be available in simple code execution", async () => {
      const codeString = `
        console.log("inputShape value:", inputShape);
        return inputShape;
      `;
      
      const library = {
        input_shape_id: extrude(rectangle(10, 5), 6),
      };
      
      const args = {
        inputShape: "input_shape_id",
      };

      const result = await executeCode(codeString, args, library);
      expect(result).toBe("input_shape_id");
    });

    it("should handle minimal default code atom template", async () => {
      const codeString = `
        //Inputs:[inputShape, dist, height]
        let importedShape = library[inputShape]
        return importedShape;
      `;
      
      const library = {
        input_shape_id: extrude(rectangle(10, 5), 6),
      };
      
      const args = {
        inputShape: "input_shape_id",
        dist: 5,
        height: 10,
      };

      const result = await executeCode(codeString, args, library);
      expect(result).toBeDefined();
      expect(result.geometry).toHaveLength(1);
    });
  });
});