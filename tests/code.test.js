// Test file for code.js - code execution functionality
import { init } from "../src/worker/util.js";
import { executeCode } from "../src/worker/code.js";
import { rectangle } from "../src/worker/shapes.js";
import { extrude } from "../src/worker/actions.js";

describe("code.js", () => {
  beforeAll(async () => {
    await init();
  });

  describe("code execution", () => {
    it("should allow calling of all provided helper methods", async () => {
      const codeString = `
        //Inputs:[inputShape, dist, height]
        let shape = library[inputShape]

        const rotated = await Rotate(shape, 5, 10, dist)
        const moved = await Move(shape, 0, 9, height)
        const scaled = await Scale(shape, 0.7)
        const assembled = await Assembly([shape, moved])
        const inter = await Intersect(shape, moved)
        const cut = await CutAssembly(shape, [scaled, moved])
        const modifiedAssembly = await AssemblyMap(assembled, async (s) => {return await Rotate(s, 0, 10, 90)})
        console.log(await AssemblyAsIterable(assembled))
        console.log(GetBounds(shape))
        const filleted = await Fillet(shape, 0.3)
        const chamfered = await Chamfer(shape, 1)

        return Assembly([modifiedAssembly, inter, cut, filleted, chamfered])
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
      expect(result.geometry).toHaveLength(5);
    });
  });
});
