// Test file to reproduce the linear pattern issue
import { init } from "../src/worker/util.js";
import { executeCode } from "../src/worker/code.js";
import { rectangle } from "../src/worker/shapes.js";
import { extrude } from "../src/worker/actions.js";

describe("Linear Pattern Issue", () => {
  beforeAll(async () => {
    await init();
  });

  it("should reproduce the linear pattern failure", async () => {
    // This is the code from the linear pattern that is failing
    const linearPatternCode = `
      //Inputs:[Shape, Number, Dist];

      let shapesArray = [];
      for (let i = 0; i < Number; i++) {
          let rotatedShape = await Move(Shape, Dist * i, 0, 0);
          shapesArray.push(rotatedShape);
      }

      let assembledShape = await Assembly(shapesArray)

      return assembledShape;
    `;

    // Create a library with a test shape
    const library = {
      test_shape: extrude(rectangle(10, 5), 3),
    };

    // Arguments for the linear pattern
    const args = {
      Shape: "test_shape",  // This is a library ID string, not a geometry object
      Number: 3,
      Dist: 15,
    };

    // This should reproduce the error: "TypeError: inputs.geometry is undefined"
    await expect(executeCode(linearPatternCode, args, library)).rejects.toThrow();
  });
});