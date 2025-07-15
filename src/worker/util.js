import opencascade from "replicad-opencascadejs/src/replicad_single.js";
import opencascadeWasm from "replicad-opencascadejs/src/replicad_single.wasm?url";
import * as replicad from "replicad";

let loaded = false;
const init = async () => {
  if (loaded) return Promise.resolve(true);

  const OC = await opencascade({
    locateFile: () => opencascadeWasm,
  });

  loaded = true;
  replicad.setOC(OC);
  console.log(replicad);

  return true;
};


/**
 * Recursively applies an action function to all leaf geometries in an assembly tree.
 * @param {Object} assembly - The assembly or leaf geometry to process
 * @param {Function} action - The function to apply to each leaf geometry. Should return the transformed leaf or undefined to remove it
 * @param {Object} plane - Optional plane to use for the resulting assembly
 * @returns {Object} The transformed assembly with the action applied to all leaves
 */
function actOnLeafs(assembly, action, plane) {
  plane = plane || assembly.plane;
  //This is a leaf
  if (assembly.geometry == undefined) {
    console.log("empty geometry found:");
    console.log(assembly);
  }

  if (
    assembly.geometry.length == 1 &&
    assembly.geometry[0].geometry == undefined
  ) {
    return action(assembly);
  }
  //This is a branch
  else {
    let transformedAssembly = [];
    assembly.geometry.forEach((subAssembly) => {
      const result = actOnLeafs(subAssembly, action);
      if (result != undefined) {
        transformedAssembly.push(result);
      }
    });
    return {
      geometry: transformedAssembly,
      tags: assembly.tags,
      bom: assembly.bom,
      plane: plane,
    };
  }
}

export { init, actOnLeafs, replicad };
