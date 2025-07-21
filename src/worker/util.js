import opencascade from "replicad-opencascadejs/src/replicad_single.js";
import opencascadeWasm from "replicad-opencascadejs/src/replicad_single.wasm?url";
import * as replicad from "replicad";
import { v4 as uuidv4 } from "uuid";

let defaultColor = "#aad7f2";
let loaded = false;
const init = async () => {
  if (loaded) return Promise.resolve(true);

  const OC = await opencascade({
    locateFile: () => opencascadeWasm,
  });

  loaded = true;
  replicad.setOC(OC);
  console.log("loaded replicad");
  console.log(replicad);

  return true;
};

/**
 * Checks if the input geometry is 3D (has a mesh) or 2D (sketch).
 * @param {Object} inputs - The geometry object to check
 * @returns {boolean} True if the geometry is 3D, false if it's a 2D sketch
 */
function is3D(inputs) {
  // if it's an assembly assume it's 3d since our assemblies don't work for drawings right now
  if (isAssembly(inputs)) {
    return inputs.geometry.some((input) => is3D(input));
  } else if (
    inputs.geometry[0].mesh !== undefined ||
    inputs.geometry[0] instanceof replicad.Wire
  ) {
    return true;
  } else {
    return false;
  }
}

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

/**
 * A function to generate a unique ID value.
 */
function generateUniqueID() {
  return uuidv4();
}

/**
 * Checks if the input geometry is wire geometry (like from G-code).
 * @param {Object} inputs - The geometry object to check
 * @returns {boolean} True if the geometry is wire geometry, false otherwise
 */
function isWireGeometry(inputs) {
  if (isAssembly(inputs)) {
    return inputs.geometry.some((input) => isWireGeometry(input));
  } else if (inputs.geometry && inputs.geometry[0] instanceof Wire) {
    return true;
  } else {
    return false;
  }
}

/**
 * Checks if a part is an assembly (contains sub-geometries) or a single part.
 * @param {Object} part - The part object to check
 * @returns {boolean} True if the part is an assembly, false if it's a single part
 */
function isAssembly(part) {
  if (part == undefined || part.geometry == undefined) {
    return false;
  }
  if (part.geometry.length > 0) {
    if (part.geometry[0].geometry) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}

export { init, actOnLeafs, replicad, is3D, isWireGeometry, isAssembly };
