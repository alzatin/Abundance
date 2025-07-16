import * as replicad from "replicad";
import { expose, proxy } from "comlink";
import { Plane, Solid, Wire } from "replicad";
import shrinkWrap from "replicad-shrink-wrap";
import { drawSVG } from "replicad-decorate";
import { v4 as uuidv4 } from "uuid";
import Fonts from "../js/fonts.js";
import * as cutlayout from "./cutlayout.js";
import * as util from "./util.js";

var library = {};
let defaultColor = "#aad7f2";

const started = util.init();

function assertInLibrary(id) {
  if (!library[id]) {
    throw new Error(`Library ID ${id} does not exist.`);
  }
}

// Wrap layout and manage library accesses
async function layout(
  targetID,
  inputID,
  progressCallback,
  warningCallback,
  placementCallback,
  layoutConfig,
  priorPlacements
) {
  await started;
  assertInLibrary(inputID);

  return cutlayout
    .layout(
      library[inputID],
      progressCallback,
      warningCallback,
      placementCallback,
      layoutConfig,
      priorPlacements
    )
    .then((resultArray) => {
      const [layedOutAssembly, positions] = resultArray;
      library[targetID] = layedOutAssembly;
      return positions;
    });
}

// Wrap displayLayout and manage library accesses
async function displayLayout(
  targetID,
  inputID,
  placements,
  warningCallback,
  layoutConfig
) {
  await started;
  assertInLibrary(inputID);

  library[targetID] = cutlayout.displayLayout(
    library[inputID],
    placements,
    warningCallback,
    layoutConfig
  );
}

/**
 * A function which converts any input into Abundance style geometry. Input can be a library ID, an abundance object, or a single geometry object.
 * This is useful for allowing our functions to work within the Code atom or within the flow canvas.
 */
function toGeometry(input, name = "geometry") {
  //If the input is a library ID we look it up
  if (typeof input === "string" || typeof input === "number") {
    return library[input];
  }
  //If the input is already an abundance object we return it
  else if (input.geometry) {
    return input;
  }

  // else check if it's a raw geometry object
  const raw_type = input?._wrapped?.$$?.ptrType?.name;
  if (raw_type && raw_type instanceof String && raw_type.startsWith("TopoDS")) {
    // If it's a raw geometry object, we wrap it in an abundance object
    return {
      geometry: [input],
      tags: [],
      color: defaultColor,
      bom: [],
    };
  } else {
    // If it's something else, we throw an error
    throw new Error(name + " value cannot be interpreted as geometry.");
  }
}

/**
 * A function to generate a unique ID value.
 */
function generateUniqueID() {
  return uuidv4();
}

/**
 * A function that deletes a geometry from the library.
 */
function deleteFromLibrary(inputID) {
  return started.then(() => {
    delete library[inputID];
  });
}

/**
 * Creates a mesh with the specified thickness.
 * @param {number} thickness - The thickness value for the mesh
 * @returns {Promise<Array>} A promise that resolves to an empty array representing mesh data structure
 */
function createMesh(thickness) {
  return started.then(() => {
    // This is how you get the data structure that the replica-three-helper
    // can synchronize with three BufferGeometry
    return [];
  });
}

/**
 * Creates a circle geometry with the specified diameter and stores it in the library.
 * @param {string} id - The unique identifier to store the circle geometry in the library
 * @param {number} diameter - The diameter of the circle
 * @returns {Promise<boolean>} A promise that resolves to true when the circle is created successfully
 */
function circle(id, diameter) {
  return started.then(() => {
    const newPlane = new Plane().pivot(0, "Y");
    library[id] = {
      geometry: [util.replicad.drawCircle(diameter / 2)],
      tags: [],
      plane: newPlane,
      color: defaultColor,
      bom: [],
    };
    return true;
  });
}

/**
 * Creates a rectangle geometry with the specified dimensions and stores it in the library.
 * @param {string} id - The unique identifier to store the rectangle geometry in the library
 * @param {number} x - The width of the rectangle
 * @param {number} y - The height of the rectangle
 * @returns {Promise<boolean>} A promise that resolves to true when the rectangle is created successfully
 */
function rectangle(id, x, y) {
  return started.then(() => {
    const newPlane = new Plane().pivot(0, "Y");
    library[id] = {
      geometry: [util.replicad.drawRectangle(x, y)],
      tags: [],
      plane: newPlane,
      color: defaultColor,
      bom: [],
    };
    return true;
  });
}

/**
 * Creates a regular polygon geometry with the specified radius and number of sides, and stores it in the library.
 * @param {string} id - The unique identifier to store the polygon geometry in the library
 * @param {number} radius - The radius of the polygon (distance from center to vertex)
 * @param {number} numberOfSides - The number of sides of the polygon
 * @returns {Promise<boolean>} A promise that resolves to true when the polygon is created successfully
 */
function regularPolygon(id, radius, numberOfSides) {
  return started.then(() => {
    const newPlane = new Plane().pivot(0, "Y");
    library[id] = {
      geometry: [util.replicad.drawPolysides(radius, numberOfSides)],
      tags: [],
      plane: newPlane,
      color: defaultColor,
      bom: [],
    };
    return true;
  });
}
/**
 * Creates text geometry with the specified text, font size, and font family, and stores it in the library.
 * @param {string} id - The unique identifier to store the text geometry in the library
 * @param {string} text - The text content to be rendered
 * @param {number} fontSize - The size of the font
 * @param {string} fontFamily - The font family to use for rendering the text
 * @returns {Promise<boolean>} A promise that resolves to true when the text is created successfully
 * @throws {Error} Throws an error if the font fails to load
 */
async function text(id, text, fontSize, fontFamily) {
  await util.replicad
    .loadFont(Fonts[fontFamily])
    .then(() => {
      console.log("Font loaded");
      return started.then(() => {
        const newPlane = new Plane().pivot(0, "Y");

        const textGeometry = util.replicad.drawText(text, {
          startX: 0,
          startY: 0,
          fontSize: fontSize,
          font: fontFamily,
        });
        library[id] = {
          geometry: [textGeometry],
          tags: [],
          plane: newPlane,
          color: defaultColor,
          bom: [],
        };
        return true;
      });
    })
    .catch((err) => {
      throw new Error("Error loading font: ", err);
    });
}

/**
 * Creates a loft shape by blending between multiple 2D sketches and stores it in the library.
 * @param {string} targetID - The unique identifier to store the lofted geometry in the library
 * @param {string[]} inputsIDs - Array of library IDs containing 2D sketches to be lofted
 * @returns {Promise<boolean>} A promise that resolves to true when the loft is created successfully
 * @throws {Error} Throws an error if input parts are not sketches or contain interior geometries
 */
function loftShapes(targetID, inputsIDs) {
  return started.then(() => {
    let arrayOfSketchedGeometry = [];

    inputsIDs.forEach((inputID) => {
      if (is3D(library[inputID])) {
        throw new Error("Parts to be lofted must be sketches");
      }
      let partToLoft = digFuse(library[inputID]);
      let sketchedpart = partToLoft.sketchOnPlane(library[inputID].plane);
      if (!sketchedpart.sketches) {
        arrayOfSketchedGeometry.push(sketchedpart);
      } else {
        throw new Error("Sketches to be lofted can't have interior geometries");
      }
    });
    let startGeometry = arrayOfSketchedGeometry.shift();
    const newPlane = new Plane().pivot(0, "Y");

    library[targetID] = {
      geometry: [startGeometry.loftWith([...arrayOfSketchedGeometry])],
      tags: [],
      plane: newPlane,
      color: defaultColor,
      bom: [],
    };
    return true;
  });
}

/**
 * Extrudes a 2D sketch to create a 3D geometry with the specified height and stores it in the library.
 * @param {string} targetID - The unique identifier to store the extruded geometry in the library
 * @param {string} inputID - The library ID of the 2D sketch to be extruded
 * @param {number} height - The height to extrude the sketch
 * @returns {Promise<boolean>} A promise that resolves to true when the extrusion is completed successfully
 */
function extrude(targetID, inputID, height) {
  return started.then(() => {
    library[targetID] = util.actOnLeafs(library[inputID], (leaf) => {
      return {
        geometry: [
          leaf.geometry[0].clone().sketchOnPlane(leaf.plane).extrude(height),
        ],
        tags: leaf.tags,
        plane: leaf.plane,
        color: leaf.color,
        bom: leaf.bom,
      };
    });
    return true;
  });
}

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
    inputs.geometry[0] instanceof Wire
  ) {
    return true;
  } else {
    return false;
  }
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
 * Moves a geometry by the specified x, y, and z distances.
 * @param {Object|string} geom - The geometry to move, or library ID for same
 * @param {number} x - The distance to move along the x-axis
 * @param {number} y - The distance to move along the y-axis
 * @param {number} z - The distance to move along the z-axis
 * @param {string|null} targetID - The ID to store the result in the library. If null, the result is returned
 * @returns {Promise<Object>} A promise that resolves to the moved geometry
 */
async function move(geom, x, y, z, targetID = null) {
  await started;

  geom = toGeometry(geom, "move-geometry");
  if (is3D(geom)) {
    let result = util.actOnLeafs(
      geom,
      (leaf) => {
        return {
          geometry: [leaf.geometry[0].clone().translate(x, y, z)],
          plane: leaf.plane,
          tags: leaf.tags,
          color: leaf.color,
          bom: leaf.bom,
        };
      },
      geom.plane
    );
    if (targetID) {
      library[targetID] = result;
    } else {
      return result;
    }
  } else {
    let result = util.actOnLeafs(
      geom,
      (leaf) => {
        return {
          geometry: [leaf.geometry[0].clone().translate([x, y])],
          tags: leaf.tags,
          plane: leaf.plane.translate([0, 0, z]),
          color: leaf.color,
          bom: leaf.bom,
        };
      },
      geom.plane.translate([0, 0, z])
    );
    if (targetID) {
      library[targetID] = result;
    } else {
      return result;
    }
  }
  return true;
}

/**
 * Function to rotate a geometry around the x, y, and z axis
 * @param {Object|string} geom - The geometry to rotate or id for same
 * @param {number} x - The angle to rotate around the x axis
 * @param {number} y - The angle to rotate around the y axis
 * @param {number} z - The angle to rotate around the z axis
 * @param {string} targetID - The ID to store the result in. If it undefined the result will be returned instead
 * @returns {Promise<Object>} A promise that resolves to the rotated geometry
 **/
async function rotate(geom, x, y, z, targetID = null) {
  let input = toGeometry(geom, "rotate-geometry");
  await started;

  if (is3D(input)) {
    let result = util.actOnLeafs(input, (leaf) => {
      return {
        geometry: [
          leaf.geometry[0]
            .clone()
            .rotate(x, [0, 0, 0], [1, 0, 0])
            .rotate(y, [0, 0, 0], [0, 1, 0])
            .rotate(z, [0, 0, 0], [0, 0, 1]),
        ],
        tags: leaf.tags,
        plane: leaf.plane,
        color: leaf.color,
        bom: leaf.bom,
      };
    });
    if (targetID) {
      library[targetID] = result;
    } else {
      return result;
    }
  } else {
    let result = util.actOnLeafs(input, (leaf) => {
      return {
        geometry: [leaf.geometry[0].clone().rotate(z, [0, 0, 0], [0, 0, 1])],
        tags: leaf.tags,
        plane: leaf.plane.pivot(x, "X").pivot(y, "Y"),
        color: leaf.color,
        bom: leaf.bom,
      };
    });
    if (targetID) {
      library[targetID] = result;
      //library[inputID].plane.pivot(x, "X").pivot(y, "Y"); //@Alzatin what is this line for?
    } else {
      return result;
    }
  }
  return true;
}

/**
 * Scales a geometry by the specified scale factor.
 * @param {Object|string} geom - The geometry to scale, or library ID for same
 * @param {number} scaleFactor - The scale factor to apply (1.0 = no change, 2.0 = double size, 0.5 = half size)
 * @param {string|null} targetID - The ID to store the result in the library. If null, the result is returned
 * @returns {Promise<Object>} A promise that resolves to the scaled geometry
 */
async function scale(geom, scaleFactor, targetID = null) {
  await started;

  geom = toGeometry(geom, "scale-geometry");
  if (is3D(geom)) {
    let result = util.actOnLeafs(
      geom,
      (leaf) => {
        return {
          geometry: [leaf.geometry[0].clone().scale(scaleFactor)],
          plane: leaf.plane,
          tags: leaf.tags,
          color: leaf.color,
          bom: leaf.bom,
        };
      },
      geom.plane
    );
    if (targetID) {
      library[targetID] = result;
    } else {
      return result;
    }
  } else {
    let result = util.actOnLeafs(
      geom,
      (leaf) => {
        return {
          geometry: [leaf.geometry[0].clone().scale(scaleFactor)],
          tags: leaf.tags,
          plane: leaf.plane,
          color: leaf.color,
          bom: leaf.bom,
        };
      },
      geom.plane
    );
    if (targetID) {
      library[targetID] = result;
    } else {
      return result;
    }
  }
  return true;
}

/**
 * Applies a fillet (rounded edge) to the input geometry.
 * @param {Object|string} geom - The geometry to fillet, or library ID for same
 * @param {number} radius - The radius of the fillet
 * @param {string|null} targetID - The ID to store the result in the library. If null, the result is returned
 * @returns {Promise<Object>} A promise that resolves to the filleted geometry
 */
async function fillet(geom, radius, targetID = null) {
  await started;

  geom = toGeometry(geom, "fillet-geometry");
  if (is3D(geom)) {
    let result = util.actOnLeafs(
      geom,
      (leaf) => {
        return {
          geometry: [leaf.geometry[0].clone().fillet(radius)],
          plane: leaf.plane,
          tags: leaf.tags,
          color: leaf.color,
          bom: leaf.bom,
        };
      },
      geom.plane
    );
    if (targetID) {
      library[targetID] = result;
    } else {
      return result;
    }
  } else {
    let result = util.actOnLeafs(
      geom,
      (leaf) => {
        return {
          geometry: [leaf.geometry[0].clone().fillet(radius)],
          tags: leaf.tags,
          plane: leaf.plane,
          color: leaf.color,
          bom: leaf.bom,
        };
      },
      geom.plane
    );
    if (targetID) {
      library[targetID] = result;
    } else {
      return result;
    }
  }
  return true;
}

/**
 * Applies a chamfer (beveled edge) to the input geometry.
 * @param {Object|string} geom - The geometry to chamfer, or library ID for same
 * @param {number} size - The size of the chamfer
 * @param {string|null} targetID - The ID to store the result in the library. If null, the result is returned
 * @returns {Promise<Object>} A promise that resolves to the chamfered geometry
 */
async function chamfer(geom, size, targetID = null) {
  await started;

  geom = toGeometry(geom, "chamfer-geometry");
  if (is3D(geom)) {
    let result = util.actOnLeafs(
      geom,
      (leaf) => {
        return {
          geometry: [leaf.geometry[0].clone().chamfer(size)],
          plane: leaf.plane,
          tags: leaf.tags,
          color: leaf.color,
          bom: leaf.bom,
        };
      },
      geom.plane
    );
    if (targetID) {
      library[targetID] = result;
    } else {
      return result;
    }
  } else {
    let result = util.actOnLeafs(
      geom,
      (leaf) => {
        return {
          geometry: [leaf.geometry[0].clone().chamfer(size)],
          tags: leaf.tags,
          plane: leaf.plane,
          color: leaf.color,
          bom: leaf.bom,
        };
      },
      geom.plane
    );
    if (targetID) {
      library[targetID] = result;
    } else {
      return result;
    }
  }
  return true;
}

/**
 * Performs a boolean difference operation between two geometries.
 * This function subtracts the second geometry (cutter) from the first geometry (target).
 *
 * @param {string} targetID - The ID where the resulting geometry will be stored in the library
 * @param {string} input1ID - The ID of the base geometry from which material will be removed
 * @param {string} input2ID - The ID of the cutting geometry that will be subtracted
 * @returns {Promise<boolean>} - A promise that resolves to true when the operation completes
 * @throws {Error} - If the input geometries are not of the same type (both must be either 3D or 2D)
 *
 * The function maintains all metadata from the base geometry including tags, color, plane, and BOM.
 * If the base geometry is an assembly, the cut operation is applied to each leaf independently.
 * Uses bounding box checks to avoid processing cuts for non-overlapping geometries.
 */
function difference(targetID, input1ID, input2ID) {
  return started.then(() => {
    if (
      (is3D(library[input1ID]) && is3D(library[input2ID])) ||
      (!is3D(library[input1ID]) && !is3D(library[input2ID]))
    ) {
      // Process each leaf of input1ID independently
      library[targetID] = util.actOnLeafs(library[input1ID], (leaf) => {
        // Start with a clone of the original geometry
        let resultGeometry = leaf.geometry[0].clone();

        // Apply cuts recursively from input2ID, checking bounding boxes
        resultGeometry = recursiveCut(resultGeometry, library[input2ID]);

        return {
          geometry: [resultGeometry],
          tags: leaf.tags,
          color: leaf.color,
          plane: leaf.plane,
          bom: leaf.bom,
        };
      });
    } else {
      throw new Error("Both inputs must be either 3D or 2D");
    }
    return true;
  });
}

/**
 * Creates a shrink-wrapped boundary around multiple 2D sketches and stores it in the library.
 * @param {string} targetID - The unique identifier to store the shrink-wrapped geometry in the library
 * @param {string[]} inputIDs - Array of library IDs containing 2D sketches to be shrink-wrapped
 * @returns {Promise<boolean>} A promise that resolves to true when the shrink wrapping is completed successfully
 * @throws {Error} Throws an error if inputs are not all sketches or if sketches have interior geometries
 */
function shrinkWrapSketches(targetID, inputIDs) {
  return started.then(() => {
    let BOM = [];
    if (inputIDs.every((inputID) => !is3D(library[inputID]))) {
      let inputsToFuse = [];
      inputIDs.forEach((inputID) => {
        let fusedInput = digFuse(library[inputID]);
        inputsToFuse.push(fusedInput);
        if (fusedInput.innerShape.blueprints) {
          throw new Error(
            "Sketches to be lofted can't have interior geometries"
          );
        }
        BOM.push(library[inputID].bom);
      });
      let geometryToWrap = chainFuse(inputsToFuse);
      const newPlane = new Plane().pivot(0, "Y");
      library[targetID] = {
        geometry: [shrinkWrap(geometryToWrap, 50)],
        tags: [],
        color: defaultColor,
        plane: newPlane,
        bom: BOM,
      };
      return true;
    } else {
      throw new Error("All inputs must be sketches");
    }
  });
}

/**
 * Performs a boolean intersection operation between two geometries.
 * @param {string|Object} input1ID - The ID of the first geometry or the geometry object itself
 * @param {string|Object} input2ID - The ID of the second geometry or the geometry object itself
 * @param {string|null} targetID - The ID to store the result in the library. If null, the result is returned
 * @returns {Promise<boolean|Object>} A promise that resolves to true if targetID is provided, or the intersected geometry if targetID is null
 */
function intersect(input1ID, input2ID, targetID = null) {
  let inputGeometry1 = toGeometry(input1ID, "geometry1");
  let inputGeometry2 = toGeometry(input2ID, "geometry2");
  return started.then(() => {
    let generatedAssembly = util.actOnLeafs(inputGeometry1, (leaf) => {
      const shapeToIntersectWith = digFuse(inputGeometry2);
      const newGeom = leaf.geometry[0].clone().intersect(shapeToIntersectWith);
      return {
        geometry: [newGeom],
        tags: leaf.tags,
        color: leaf.color,
        plane: leaf.plane,
        bom: leaf.bom,
      };
    });
    if (targetID != null) {
      library[targetID] = generatedAssembly;
      return true;
    } else {
      return generatedAssembly;
    }
  });
}

/**
 * Adds tags to a geometry and stores the tagged geometry in the library.
 * @param {string} targetID - The unique identifier to store the tagged geometry in the library
 * @param {string} inputID - The library ID of the geometry to tag
 * @param {string[]} TAG - Array of tags to add to the geometry
 * @returns {Promise<boolean>} A promise that resolves to true when the tagging is completed successfully
 */
function tag(targetID, inputID, TAG) {
  return started.then(() => {
    library[targetID] = {
      geometry: library[inputID].geometry,
      bom: library[inputID].bom,
      tags: [...TAG, ...library[inputID].tags],
      color: library[inputID].color,
      plane: library[inputID].plane,
    };
    return true;
  });
}

/**
 * Extracts and returns all tags from a geometry and its subassemblies.
 * @param {string} inputID - The library ID of the geometry to extract tags from
 * @param {string} tag - Currently unused parameter (kept for compatibility)
 * @returns {Promise<string[]>} A promise that resolves to an array of all unique tags, with "Select Tag" as the first element
 * @throws {Error} Throws an error if the geometry with the specified ID is not found in the library
 */
function extractAllTags(inputID, tag) {
  return started.then(() => {
    // Recursive helper function to collect tags
    function collectTags(geometry) {
      let tags = new Set(geometry.tags || []); // Use a Set to ensure uniqueness

      // If the geometry is an assembly, recursively collect tags from subassemblies
      if (isAssembly(geometry)) {
        geometry.geometry.forEach((subAssembly) => {
          const subTags = collectTags(subAssembly);
          subTags.forEach((tag) => tags.add(tag)); // Add tags from subassemblies
        });
      }

      return tags;
    }

    // Start collecting tags from the input geometry
    const inputGeometry = library[inputID];
    if (!inputGeometry) {
      throw new Error(`Geometry with ID ${inputID} not found in library`);
    }

    const allTags = collectTags(inputGeometry);
    let returningArray = Array.from(allTags); // Convert the Set to an array

    returningArray = ["Select Tag", ...new Set(returningArray)];
    return returningArray;
  });
}

//---------------------Functions for the code atom---------------------

/**
 * AssemblyMap
 *
 * Maps the given callbackFn to each leaf in the specified assembly. And returns
 * a new assembly of the same structure and metadata, but with transformed leafs.
 * If the provided assembly is a single entity, returns a transformed singular entity.
 *
 * @param {*} assemblyId
 * @param {*} callbackFn - A function that takes a leaf and returns a new leaf.
 * @returns a new assembly with the same structure and metadata as assemblyId,
 * but where each leaf is the result of applying callbackFn to the
 * corresponding leaf in the input assembly.
 */
async function assemblyMap(assemblyId, callbackFn) {
  try {
    const assembly = toGeometry(assemblyId);

    // Helper function to process nodes recursively
    async function processNode(node, depth) {
      // If this is a leaf node
      if (
        node.geometry.length === 1 &&
        node.geometry[0].geometry === undefined
      ) {
        // Apply callback and return result
        let result = await callbackFn(node, depth);
        return result;
      }
      // This is a branch node (an assembly)
      else {
        const newGeometry = await Promise.all(
          node.geometry.map(async (child) => {
            return await processNode(child, depth + 1);
          })
        );

        // Filter out any undefined results (in case callbackFn filters some nodes)
        const filteredGeometry = newGeometry.filter(
          (item) => item !== undefined
        );

        // Return a new node with the same metadata but transformed children
        return {
          geometry: filteredGeometry,
          tags: node.tags || [],
          color: node.color,
          plane: node.plane,
          bom: node.bom || [],
        };
      }
    }

    // Start processing from the root
    const result = await processNode(assembly, 0);
    return result;
  } catch (error) {
    logError(error, "AssemblyMap");
    throw error;
  }
}

async function assemblyAsIterable(assemblyId) {
  const result = [];
  util.actOnLeafs(toGeometry(assemblyId), (leaf) => {
    result.push(leaf);
  });
  // TODO: when we typescriptify things, this should be a read-only list.
  return result;
}

function logError(error, context) {
  console.warn("error from context: ", context);
  if (error instanceof SyntaxError) {
    console.error("SyntaxError encountered:", error.message);
  } else if (error instanceof ReferenceError) {
    console.error("ReferenceError encountered:", error.message);
  } else {
    console.error("An error occurred:", error.message);
  }

  // Log additional error details if available
  if (error.stack) {
    console.error("Stack trace:", error.stack);
  }
  if (error.lineNumber) {
    console.error("Line number:", error.lineNumber);
  }
  if (error.columnNumber) {
    console.error("Column number:", error.columnNumber);
  }
  console.log("full error:");
  console.log(error);
}

/**
 * Validates that user-provided code doesn't contain dangerous patterns
 * @param {string} code - The JavaScript code string to validate
 * @returns {boolean} True if code appears safe, throws error if dangerous patterns detected
 */
function validateUserCode(code) {
  const dangerousPatterns = [
    /eval\s*\(/,
    /import\s*\(/,
    /require\s*\(/,
    /process\s*\./,
    /global\s*\./,
    /window\s*\./,
    /document\s*\./,
    /XMLHttpRequest/,
    /fetch\s*\(/,
    /localStorage/,
    /sessionStorage/,
    /IndexedDB/,
    /WebSocket/,
    /Worker\s*\(/,
    /setTimeout\s*\(/,
    /setInterval\s*\(/,
    /__proto__/,
    /constructor/,
    /prototype/,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(code)) {
      throw new Error(
        `Code contains potentially dangerous pattern: ${pattern.source}`
      );
    }
  }

  return true;
}

/**
 * Executes user-provided code in the worker thread with access to predefined geometry functions.
 * @param {string} targetID - The unique identifier to store the code execution result in the library
 * @param {string} code - The JavaScript code string to execute
 * @param {Object} argumentsArray - Object containing key-value pairs of additional variables to make available to the code
 * @returns {Promise<boolean|number>} A promise that resolves to the result value if it's a number, or true otherwise
 * @note Uses eval() for code execution - consider security implications in production environments
 */
async function code(targetID, code, argumentsArray) {
  await started;
  try {
    // Validate input parameters
    if (typeof code !== "string") {
      throw new Error("Code must be a string");
    }
    if (code.length > 50000) {
      throw new Error("Code too long (maximum 50,000 characters)");
    }

    // Validate code for dangerous patterns
    // TODO: we probably want to allow some of these but still need to warn about them before executing
    // the code molecule.
    validateUserCode(code);

    let keys1 = [
      "Rotate",
      "Move",
      "Scale",
      "Assembly",
      "Intersect",
      "CutAssembly",
      "AssemblyMap",
      "AssemblyAsIterable",
      "GetBounds",
      "Fillet",
      "Chamfer",
      "library",
      "replicad",
    ];
    let inputValues = [
      rotate,
      move,
      scale,
      assembly,
      intersect,
      cutAssembly,
      assemblyMap,
      assemblyAsIterable,
      getBounds,
      fillet,
      chamfer,
      library,
      util.replicad,
    ];
    for (const [key, value] of Object.entries(argumentsArray)) {
      // Sanitize parameter names to prevent injection
      if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) {
        throw new Error(`Invalid parameter name: ${key}`);
      }
      keys1.push(key);
      inputValues.push(value);
    }

    // Use Function constructor instead of eval - still allows code execution but safer than eval
    const userFunction = new Function(
      ...keys1,
      `return (async () => { ${code} })();`
    );

    // Execute with timeout protection
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Code execution timed out")), 60000); // 1 min timeout
    });

    const result = await Promise.race([
      userFunction(...inputValues),
      timeoutPromise,
    ]);

    library[targetID] = result;
    // If the type of the result is a number return the number so it can be passed to the next atom
    if (typeof result === "number") {
      return result;
    } else {
      return true;
    }
  } catch (error) {
    console.error("Code execution error:", error);
    throw new Error(`Code execution failed: ${error.message}`);
  }
}

/**
 * Applies a color to a geometry and stores the colored geometry in the library.
 * @param {string} targetID - The unique identifier to store the colored geometry in the library
 * @param {string} inputID - The library ID of the geometry to color
 * @param {string} color - The color to apply to the geometry (hex color code)
 * @returns {Promise} A promise that resolves when the coloring operation is completed
 * @note If the color is "#D9544D", a "keepout" tag is automatically added to the geometry
 */
function color(targetID, inputID, color) {
  return started.then(() => {
    library[targetID] = util.actOnLeafs(library[inputID], (leaf) => {
      // keep out color add tag
      if (color == "#D9544D") {
        leaf.tags.push("keepout");
      }
      return {
        geometry: leaf.geometry,
        tags: [...leaf.tags],
        color: color,
        bom: leaf.bom,
        plane: leaf.plane,
      };
    });
  });
}

/**
 * Adds a Bill of Materials (BOM) entry to a geometry and stores it in the library.
 * @param {string} targetID - The unique identifier to store the geometry with BOM in the library
 * @param {string} inputID - The library ID of the geometry to add BOM entry to
 * @param {Object} BOM - The BOM entry to add to the geometry
 * @returns {Promise<boolean>} A promise that resolves to true when the BOM addition is completed successfully
 */
function bom(targetID, inputID, BOM) {
  return started.then(() => {
    if (library[inputID].bom != []) {
      BOM = [...library[inputID].bom, BOM];
    }
    library[targetID] = {
      geometry: library[inputID].geometry,
      tags: [...library[inputID].tags],
      bom: BOM,
      color: library[inputID].color,
    };
    return true;
  });
}

/**
 * Extracts geometry with a specific tag and stores it in the library.
 * @param {string} targetID - The unique identifier to store the extracted geometry in the library
 * @param {string} inputID - The library ID of the geometry to extract from
 * @param {string} TAG - The specific tag to search for and extract
 * @returns {Promise<boolean>} A promise that resolves to true when the extraction is completed successfully
 * @throws {Error} Throws an error if the specified tag is not found in the geometry
 */
function extractTag(targetID, inputID, TAG) {
  return started.then(() => {
    let taggedGeometry = extractTags(library[inputID], TAG);
    if (taggedGeometry != false) {
      library[targetID] = {
        bom: taggedGeometry.bom,
        geometry: taggedGeometry.geometry,
        tags: taggedGeometry.tags,
        color: taggedGeometry.color,
      };
    } else {
      throw new Error("Tag not found");
    }
    return true;
  });
}

/**
 * Copies a geometry from one library location to another, typically used for output connections.
 * @param {string} targetID - The unique identifier to store the output geometry in the library
 * @param {string} inputID - The library ID of the geometry to output
 * @returns {Promise<boolean>} A promise that resolves to true when the output operation is completed successfully
 * @throws {Error} Throws an error if nothing is connected to the output (inputID is undefined)
 */
function output(targetID, inputID) {
  return started.then(() => {
    if (library[inputID] != undefined) {
      library[targetID] = library[inputID];
    } else {
      throw new Error("Nothing is connected to the output");
    }

    return true;
  });
}

/**
 * Copies a geometry from one library location to another, typically used for molecule connections.
 * @param {string} targetID - The unique identifier to store the molecule geometry in the library
 * @param {string} inputID - The library ID of the geometry to copy for the molecule
 * @returns {Promise<boolean>} A promise that resolves to true when the molecule operation is completed successfully
 * @throws {Error} Throws an error if the output ID is undefined
 */
function molecule(targetID, inputID) {
  return started.then(() => {
    if (library[inputID] != undefined) {
      library[targetID] = library[inputID];
    } else {
      throw new Error("output ID is undefined");
    }
    return true;
  });
}

/**
 * Extracts the Bill of Materials (BOM) list from a geometry.
 * @param {string} inputID - The library ID of the geometry to extract BOM from
 * @returns {Array|boolean} The BOM array if it exists, or false if BOM is undefined
 */
function extractBomList(inputID) {
  if (library[inputID].bom !== undefined) {
    return library[inputID].bom;
  } else {
    return false;
  }
}

/**
 * Prepares geometry for visualization export in various file formats (STL, STEP, SVG).
 * @param {string} targetID - The unique identifier to store the prepared export geometry in the library
 * @param {string} inputID - The library ID of the geometry to prepare for export
 * @param {string} fileType - The file type for export ("STL", "STEP", or "SVG")
 * @returns {Promise<boolean>} A promise that resolves to true when the export preparation is completed successfully
 */
function visExport(targetID, inputID, fileType) {
  return started.then(() => {
    let geometryToExport = extractKeepOut(library[inputID]);
    let fusedGeometry = digFuse(geometryToExport);
    let displayColor =
      fileType == "STL"
        ? "#91C8D5"
        : fileType == "STEP"
        ? "#ACAFDD"
        : "#3C3C3C";
    let finalGeometry;
    if (fileType == "SVG") {
      /** Fuses input geometry, draws a top view projection*/
      if (is3D(library[inputID])) {
        finalGeometry = [
          util.replicad.drawProjection(fusedGeometry, "top").visible,
        ];
      } else {
        finalGeometry = [fusedGeometry];
      }
    } else {
      finalGeometry = [fusedGeometry];
    }
    if (targetID) {
      library[targetID] = {
        geometry: finalGeometry,
        color: displayColor,
        plane: library[inputID].plane,
      };
    }
    return true;
  });
}

/**
 * Exports geometry to downloadable file formats (STL, STEP, SVG).
 * @param {string} ID - The library ID of the geometry to export
 * @param {string} fileType - The file type for export ("STL", "STEP", or "SVG")
 * @param {number} svgResolution - The resolution for SVG export
 * @param {string} units - The units for scaling ("Inches", "MM", or other)
 * @returns {Promise<Blob>} A promise that resolves to a Blob containing the exported file data
 */
function downExport(ID, fileType, svgResolution, units) {
  return started.then(() => {
    let scaleUnit = units == "Inches" ? 1 : units == "MM" ? 25.4 : 1;
    let scaling = svgResolution / scaleUnit;
    if (fileType == "SVG") {
      let svg = library[ID].geometry[0].clone().scale(scaling).toSVG(scaling);
      var blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });

      return blob;
    } else if (fileType == "STL") {
      return library[ID].geometry[0].clone().blobSTL();
    } else {
      return library[ID].geometry[0].clone().blobSTEP();
    }
  });
}

/**
 * Imports a STEP file and stores the resulting geometry in the library.
 * @param {string} targetID - The unique identifier to store the imported geometry in the library
 * @param {File} file - The STEP file to import
 * @returns {Promise<boolean>} A promise that resolves to true when the import is completed successfully
 */
async function importingSTEP(targetID, file) {
  let STEPresult = await util.replicad.importSTEP(file);

  library[targetID] = {
    geometry: [STEPresult],
    tags: [],
    color: defaultColor,
    bom: [],
  };
  return true;
}

/**
 * Imports an STL file and stores the resulting geometry in the library.
 * @param {string} targetID - The unique identifier to store the imported geometry in the library
 * @param {File} file - The STL file to import
 * @returns {Promise<boolean>} A promise that resolves to true when the import is completed successfully
 */
async function importingSTL(targetID, file) {
  let STLresult = await util.replicad.importSTL(file);

  library[targetID] = {
    geometry: [STLresult],
    tags: [],
    color: defaultColor,
    bom: [],
  };
  return true;
}

/**
 * Imports an SVG file and creates 2D geometry, then stores it in the library.
 * @param {string} targetID - The unique identifier to store the imported SVG geometry in the library
 * @param {string} svg - The SVG content as a string
 * @param {number} width - The width to scale the SVG to
 * @returns {Promise<boolean>} A promise that resolves to true when the import is completed successfully
 * @throws {Error} Throws an error if the SVG import fails
 */
async function importingSVG(targetID, svg, width) {
  const baseWidth = width + width * 0.05;
  const baseShape = util.replicad
    .drawRectangle(baseWidth, baseWidth)
    .sketchOnPlane()
    .extrude(1);
  const svgString = svg;

  /* Add svg to face, consider bringing back if we are ever able to choose faces or want to add pattern to face
  addSVG(baseShape, {
    faceIndex: 5,
    depth: depth,
    svgString: svgString,
    width: width,
  })*/
  try {
    let drawnSVG = await drawSVG(svgString, { width: width });
    let center = drawnSVG.boundingBox.center;

    library[targetID] = {
      geometry: [drawnSVG.clone().translate(-center[0], -center[1])],
      tags: [],
      plane: new Plane().pivot(0, "Y"),
      color: defaultColor,
      bom: [],
    };
    console.log("SVG imported successfully");

    return true;
  } catch (error) {
    //add alert  ----> Try tweaking your file here https://iconly.io/tools/svg-convert-stroke-to-fill "

    console.error("Error importing SVG:", error);
    throw error;
  }
}

/**
 * Visualizes G-code by parsing movement commands and creating 3D wire geometry.
 * @param {string} targetID - The unique identifier to store the visualized G-code geometry in the library
 * @param {string} gcode - The G-code string to visualize
 * @returns {void} This function does not return a value, it directly stores the result in the library
 */
function visualizeGcode(targetID, gcode) {
  let currentPosition = [0, 0, 0];
  let edges = [];

  // Split the gcode into lines
  const lines = gcode.split("\n");
  lines.forEach((line) => {
    // Only process lines that start with G0 or G1
    if (line.startsWith("G0") || line.startsWith("G1")) {
      // Parse the line for X, Y, Z values
      const xMatch = line.match(/X([\d.-]+)/);
      const yMatch = line.match(/Y([\d.-]+)/);
      const zMatch = line.match(/Z([\d.-]+)/);

      // Update coordinates if found, otherwise keep the previous value
      let x = xMatch ? Number(xMatch[1]) : currentPosition[0];
      let y = yMatch ? Number(yMatch[1]) : currentPosition[1];
      let z = zMatch ? Number(zMatch[1]) : currentPosition[2];

      edges.push(util.replicad.makeLine(currentPosition, [x, y, z]));
      currentPosition = [x, y, z];
    }
  });

  // Create a wire from the edges
  const wire = util.replicad.assembleWire(edges);
  library[targetID] = {
    geometry: [wire],
    tags: [],
    plane: new Plane().pivot(0, "Y"),
    color: defaultColor,
    bom: [],
  };
}

/**
 * Creates a pretty projection of a 3D shape for thumbnail generation.
 * @param {Object} shape - The 3D shape to create a projection from
 * @returns {Object} An object containing visible and hidden projection lines
 */
const prettyProjection = (shape) => {
  const bbox = shape.boundingBox;
  const center = bbox.center;
  const corner = [
    bbox.center[0] + bbox.width,
    bbox.center[1] - bbox.height,
    bbox.center[2] + bbox.depth,
  ];
  const camera = new util.replicad.ProjectionCamera(corner).lookAt(center);
  const { visible, hidden } = util.replicad.drawProjection(shape, camera);

  return { visible, hidden };
};

/**
 * Generates an SVG thumbnail representation of a geometry.
 * @param {string} inputID - The library ID of the geometry to generate a thumbnail for
 * @returns {Promise<string>} A promise that resolves to an SVG string representing the thumbnail
 * @throws {Error} Throws an error if the geometry is undefined or thumbnail generation fails
 */
function generateThumbnail(inputID) {
  return started.then(() => {
    if (library[inputID] != undefined) {
      let fusedGeometry;
      let projectionShape;
      let svg;
      if (is3D(library[inputID])) {
        fusedGeometry = digFuse(library[inputID]);
        projectionShape = prettyProjection(fusedGeometry);
        svg = projectionShape.visible.toSVG();
      } else {
        fusedGeometry = digFuse(library[inputID])
          .sketchOnPlane("XY")
          .extrude(0.0001);
        projectionShape = util.replicad.drawProjection(
          fusedGeometry,
          "top"
        ).visible;
        svg = projectionShape.toSVG();
      }
      //let hiddenSvg = projectionShape.hidden.toSVGPaths();
      return svg;
    } else {
      throw new Error("can't generate thumbnail for undefined geometry");
    }
  });
}

/**
 * Recursively extracts geometry with a specific tag from an assembly or single geometry.
 * @param {Object} inputGeometry - The geometry object to search for the tag
 * @param {string} TAG - The tag to search for and extract
 * @returns {Object|boolean} The geometry containing the tag, or false if the tag is not found
 */
function extractTags(inputGeometry, TAG) {
  if (inputGeometry.tags.includes(TAG)) {
    return inputGeometry;
  } else if (isAssembly(inputGeometry)) {
    let geometryWithTags = [];
    inputGeometry.geometry.forEach((subAssembly) => {
      let extractedGeometry = extractTags(subAssembly, TAG);

      if (extractedGeometry != false) {
        geometryWithTags.push(extractedGeometry);
      }
    });
    if (geometryWithTags.length > 0) {
      let thethingtoreturn = {
        geometry: geometryWithTags,
        tags: inputGeometry.tags,
        color: inputGeometry.color,
        bom: inputGeometry.bom,
      };
      return thethingtoreturn;
    } else {
      return false;
    }
  } else {
    return false;
  }
}

/**
 * Recursively extracts geometry that does NOT have "keepout" tags from an assembly or single geometry.
 * @param {Object} inputGeometry - The geometry object to filter keepout tags from
 * @returns {Object|boolean} The geometry without keepout tags, or false if all geometry has keepout tags
 */
function extractKeepOut(inputGeometry) {
  if (inputGeometry.tags.includes("keepout")) {
    return false;
  } else if (isAssembly(inputGeometry)) {
    let geometryNoKeepOut = [];
    inputGeometry.geometry.forEach((subAssembly) => {
      let extractedGeometry = extractKeepOut(subAssembly, "keepout");

      if (extractedGeometry != false) {
        geometryNoKeepOut.push(extractedGeometry);
      }
    });
    if (geometryNoKeepOut.length > 0) {
      let thethingtoreturn = {
        geometry: geometryNoKeepOut,
        tags: inputGeometry.tags,
        color: inputGeometry.color,
        bom: inputGeometry.bom,
      };
      return thethingtoreturn;
    } else {
      return false;
    }
  } else {
    return inputGeometry;
  }
}

/**
 * Calculate the bounding box of the input geometry by walking through it and finding the min/max of
 * the bounding box of each leaf.
 */

function getBoundingBox(inputID) {
  let minX = Infinity,
    minY = Infinity,
    minZ = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity,
    maxZ = -Infinity;

  util.actOnLeafs(library[inputID], (leaf) => {
    const bbox = leaf.geometry[0].boundingBox.bounds;
    minX = Math.min(minX, bbox[0][0]);
    minY = Math.min(minY, bbox[0][1]);
    minZ = Math.min(minZ, bbox[0][2]);
    maxX = Math.max(maxX, bbox[1][0]);
    maxY = Math.max(maxY, bbox[1][1]);
    maxZ = Math.max(maxZ, bbox[1][2]);
  });

  return {
    min: [minX, minY, minZ],
    max: [maxX, maxY, maxZ],
  };
}

/**
 * Gets the bounds of the input geometry or assembly.
 * @param {*} input - Can be a library ID, util.replicad geometry, or assembly
 * @returns {Object} The bounds object with min and max arrays
 */
function getBounds(input) {
  try {
    const geometry = toGeometry(input);

    let minX = Infinity,
      minY = Infinity,
      minZ = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity,
      maxZ = -Infinity;

    if (isAssembly(geometry)) {
      // Handle assembly by iterating through all parts
      util.actOnLeafs(geometry, (leaf) => {
        if (leaf.geometry && leaf.geometry[0] && leaf.geometry[0].boundingBox) {
          const bbox = leaf.geometry[0].boundingBox.bounds;
          minX = Math.min(minX, bbox[0][0]);
          minY = Math.min(minY, bbox[0][1]);
          minZ = Math.min(minZ, bbox[0][2]);
          maxX = Math.max(maxX, bbox[1][0]);
          maxY = Math.max(maxY, bbox[1][1]);
          maxZ = Math.max(maxZ, bbox[1][2]);
        }
      });
    } else {
      // Handle single geometry
      if (
        geometry.geometry &&
        geometry.geometry[0] &&
        geometry.geometry[0].boundingBox
      ) {
        const bbox = geometry.geometry[0].boundingBox.bounds;
        minX = bbox[0][0];
        minY = bbox[0][1];
        minZ = bbox[0][2];
        maxX = bbox[1][0];
        maxY = bbox[1][1];
        maxZ = bbox[1][2];
      } else {
        throw new Error("Invalid geometry: missing boundingBox");
      }
    }

    return {
      min: [minX, minY, minZ],
      max: [maxX, maxY, maxZ],
    };
  } catch (error) {
    console.error("GetBounds error:", error);
    throw new Error(`GetBounds failed: ${error.message}`);
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

/**
 * Performs a boolean cut operation on an assembly or part with one or more cutting geometries.
 *
 * @param {Object} partToCut - The library object (part or assembly) that will be cut
 * @param {Object[]} cuttingParts - Array of geometries that will cut the part
 * @returns {Object} - A new object containing either a single cut part or an assembly of cut parts
 *
 * This function handles cutting operations on complex hierarchical structures:
 * - If partToCut is a simple part, it applies all cutting geometries to it sequentially
 * - If partToCut is an assembly, it recursively processes each leaf in the assembly tree
 * - Maintains the original hierarchy, tags, colors, and metadata
 * - Avoids unnecessary operations by checking bounding box intersections
 * - Preserves the original assembly structure while applying cuts
 */
function cutAssembly(partToCut, cuttingParts) {
  try {
    //If the partToCut is an assembly pass each part back into cutAssembly function to be cut separately
    if (isAssembly(partToCut)) {
      let assemblyToCut = partToCut.geometry;
      let assemblyCut = [];
      assemblyToCut.forEach((part) => {
        // make new assembly from cut parts
        assemblyCut.push(cutAssembly(part, cuttingParts));
      });

      let subID = generateUniqueID();
      //returns new assembly that has been cut
      library[subID] = {
        //This feels like a hack, we shouldn't be using the library internally like this
        geometry: assemblyCut,
        tags: partToCut.tags,
        bom: partToCut.bom,
      };
      return library[subID];
    } else {
      // if part to cut is wire geometry, return it unchanged (wires should pass through assemblies)
      if (isWireGeometry(partToCut)) {
        return partToCut;
      }

      // if part to cut is a single part send to cutting function with cutting parts
      var partCutCopy = partToCut.geometry[0];
      cuttingParts.forEach((cuttingPart) => {
        // for each cutting part cut the part
        partCutCopy = recursiveCut(partCutCopy, cuttingPart);
      });
      /*   if the part is a compound return each solid as a new assembly */
      function getSolids(compound) {
        return Array.from(
          util.replicad.iterTopo(compound.wrapped, "solid"),
          (s) => new Solid(s)
        );
      }
      if (partCutCopy.wrapped) {
        let solids = getSolids(partCutCopy);
        if (solids.length > 1) {
          let newAssembly = [];
          solids.forEach((solid) => {
            newAssembly.push({
              geometry: [solid],
              tags: partToCut.tags,
              color: partToCut.color,
              bom: partToCut.bom,
              plane: partToCut.plane,
            });
          });
          // return new cut part
          let newID = generateUniqueID();
          library[newID] = {
            geometry: newAssembly,
            tags: partToCut.tags,
            color: partToCut.color,
            bom: partToCut.bom,
            plane: partToCut.plane,
          };

          return library[newID];
        }
      }
      // return new cut part
      let newID = generateUniqueID();
      library[newID] = {
        geometry: [partCutCopy],
        tags: partToCut.tags,
        color: partToCut.color,
        bom: partToCut.bom,
        plane: partToCut.plane,
      };

      return library[newID];
    }
  } catch (e) {
    console.log(e);
    throw new Error("Cut Assembly failed", e);
  }
}

/**
 * Recursively applies boolean cutting operations between geometries with optimization.
 *
 * @param {Object} partToCut - The geometry object to be cut
 * @param {Object} cuttingPart - The library object (may be assembly) used to cut the part
 * @returns {Object} - The resulting geometry after all applicable cuts have been performed
 *
 * This function:
 * - Recursively processes assemblies, applying cuts only when necessary
 * - Performs bounding box intersection checks to skip non-intersecting geometries
 * - Handles nested assemblies by traversing the entire tree of cutting geometries
 * - Optimizes performance by avoiding cuts with geometries that cannot intersect
 * - Preserves the structure of both the target and cutting geometries
 *
 * The function is a core part of the boolean difference system and is designed
 * to efficiently handle complex hierarchical structures.
 */
function recursiveCut(partToCut, cuttingPart) {
  try {
    let cutGeometry = partToCut;

    // Wire geometry should not participate in cutting operations
    if (isWireGeometry({ geometry: [partToCut] })) {
      return partToCut; // Wire parts should pass through unchanged
    }

    // if cutting part is an assembly pass back into the function to be cut by each part in that assembly
    if (isAssembly(cuttingPart)) {
      for (let i = 0; i < cuttingPart.geometry.length; i++) {
        // Skip cutting with wire geometry
        if (!isWireGeometry(cuttingPart.geometry[i])) {
          cutGeometry = recursiveCut(cutGeometry, cuttingPart.geometry[i]);
        }
      }
      return cutGeometry;
    } else {
      // Skip cutting if the cutting part is wire geometry
      if (isWireGeometry(cuttingPart)) {
        return partToCut;
      }

      //If the shapes don't overlap, we don't need to cut them
      if (partToCut.boundingBox.isOut(cuttingPart.geometry[0].boundingBox)) {
        return partToCut;
      }
      // cut and return part
      else {
        let cutPart;
        cutPart = partToCut.cut(cuttingPart.geometry[0]);
        return cutPart;
      }
    }
  } catch (e) {
    console.log(e);
    throw new Error("Recursive Cut failed", e);
  }
}

/**
 * A function which takes in an array of target geometries and forms them into an assembly
 * Geometries will cut all geometries below them in the list to make sure that no parts intersect
 * If the targetID is defined, the assembly will be stored in the library under that ID, otherwise it will be returned
 */
async function assembly(geometries, targetID = null) {
  if (!Array.isArray(geometries) || geometries.length === 0) {
    throw new Error("inputIDs must be a non-empty array");
  }

  await started;

  let assembly = [];
  let bomAssembly = [];

  if (geometries.length > 1) {
    const all3D = geometries.every((inputID) => is3D(toGeometry(inputID)));
    const all2D = geometries.every((inputID) => !is3D(toGeometry(inputID)));

    if (all3D || all2D) {
      for (let i = 0; i < geometries.length; i++) {
        const geometry = toGeometry(geometries[i]);
        assembly.push(
          cutAssembly(
            geometry,
            geometries.slice(i + 1).map(toGeometry),
            targetID
          )
        );
        if (geometry.bom.length > 0) {
          bomAssembly.push(...geometry.bom);
        }
      }
    } else {
      console.trace("assembly error. inputs: " + geometries);
      throw new Error(
        "Assemblies must be composed from only sketches OR only solids"
      );
    }
  } else {
    const geometry = toGeometry(geometries[0]);
    assembly.push(geometry);
    if (geometry.bom.length > 0) {
      bomAssembly.push(...geometry.bom);
    }
  }

  const newPlane = new Plane().pivot(0, "Y");
  let generatedAssembly = {
    geometry: assembly,
    plane: newPlane,
    tags: [],
    bom: bomAssembly,
  };

  if (targetID != null) {
    library[targetID] = generatedAssembly;
  } else {
    return generatedAssembly;
  }

  return true;
}

/**
 * Performs a boolean fusion (union) operation on multiple geometries and stores the result in the library.
 * @param {string} targetID - The unique identifier to store the fused geometry in the library
 * @param {string[]} inputIDs - Array of library IDs containing geometries to be fused together
 * @returns {Promise<boolean>} A promise that resolves to true when the fusion is completed successfully
 * @throws {Error} Throws an error if inputs are mixed between 2D and 3D geometries
 */
function fusion(targetID, inputIDs) {
  return started.then(() => {
    let fusedGeometry = [];
    let bomAssembly = [];
    inputIDs.forEach((inputID) => {
      if (inputIDs.every((inputID) => is3D(library[inputID]))) {
        fusedGeometry.push(digFuse(library[inputID]));
      } else if (inputIDs.every((inputID) => !is3D(library[inputID]))) {
        fusedGeometry.push(digFuse(library[inputID]));
      } else {
        throw new Error(
          "Fusion must be composed from only sketches OR only solids"
        );
      }
      if (library[inputID].bom.length > 0) {
        bomAssembly.push(...library[inputID].bom);
      }
    });
    const newPlane = new Plane().pivot(0, "Y");
    library[targetID] = {
      geometry: [chainFuse(fusedGeometry)],
      tags: [],
      bom: bomAssembly,
      plane: newPlane,
      color: defaultColor,
    };
    return true;
  });
}

/**
 * Recursively flattens an assembly tree into a flat array of geometry objects with colors.
 * @param {Object} assembly - The assembly to flatten
 * @returns {Array} An array of objects containing geometry and color properties
 */
function flattenAssembly(assembly) {
  var flattened = [];
  //This is a leaf
  if (
    assembly.geometry.length == 1 &&
    assembly.geometry[0].geometry == undefined
  ) {
    flattened.push({ geometry: assembly.geometry[0], color: assembly.color });
    return flattened;
  }
  //This is a branch
  else {
    assembly.geometry.forEach((subAssembly) => {
      flattened.push(...flattenAssembly(subAssembly));
    });
    return flattened;
  }
}

/**
 * Performs a chain fusion operation on an array of geometries.
 * @param {Array} chain - Array of geometry objects to fuse together sequentially
 * @returns {Object} The resulting fused geometry
 * @throws {Error} Throws an error if the fusion operation fails
 */
function chainFuse(chain) {
  try {
    let fused = chain[0].clone();
    for (let i = 1; i < chain.length; i++) {
      fused = fused.fuse(chain[i]);
    }
    return fused;
  } catch (e) {
    throw new Error("Fusion failed");
  }
}

/**
 * Recursively digs through an assembly and fuses all leaf geometries into a single geometry.
 * @param {Object} assembly - The assembly or leaf geometry to process
 * @returns {Object} A single fused geometry combining all leaves in the assembly
 */
function digFuse(assembly) {
  var flattened = [];

  if (isAssembly(assembly)) {
    assembly.geometry.forEach((subAssembly) => {
      if (!isAssembly(subAssembly)) {
        //if it's not an assembly hold on add it to the fusion list
        flattened.push(subAssembly.geometry[0]);
      } else {
        // if it is an assembly keep digging
        // add the fused things in
        flattened.push(digFuse(subAssembly));
      }
    });
    return chainFuse(flattened);
  } else {
    return assembly.geometry[0];
  }
}

let colorOptions = {
  Default: defaultColor,
  Red: "#FF9065",
  Orange: "#FFB458",
  Yellow: "#FFD600",
  Olive: "#C7DF66",
  Teal: "#71D1C2",
  "Light Blue": "#75DBF2",
  Green: "#A3CE5B",
  "Lavender ": "#CCABED",
  Brown: "#CFAB7C",
  Pink: "#FFB09D",
  Sand: "#E2C66C",
  Clay: "#C4D3AC",
  Blue: "#91C8D5",
  "Light Green": "#96E1BB",
  Purple: "#ACAFDD",
  "Light Purple": "#DFB1E8",
  Tan: "#F5D3B6",
  "Mauve ": "#DBADA9",
  Grey: "#BABABA",
  Black: "#3C3C3C",
  White: "#FFFCF7",
  "Keep Out": "#E0E0E0",
};
/**
 * Generates a default mesh for display when no output is available.
 * @param {string} id - The unique identifier to store the default mesh in the library
 * @returns {Promise} A promise that resolves to the default text mesh
 */
async function generateDefaultMesh(id) {
  let defaultMesh = await text(id, "No output to display", 28, "ROBOTO");
  return defaultMesh;
}

/**
 * Resets the view by returning an empty array.
 * @returns {Promise<Array>} A promise that resolves to an empty array
 */
function resetView() {
  return started.then(() => {
    return [];
  });
}

function getLargestBoundingBox(meshArray) {
  let overallMin = [Infinity, Infinity, Infinity];
  let overallMax = [-Infinity, -Infinity, -Infinity];

  if (!Array.isArray(meshArray)) {
    throw new Error("meshArray is not defined or not an array");
  }

  meshArray.forEach((mesh) => {
    if (
      !mesh.geometry ||
      !mesh.geometry.boundingBox ||
      !Array.isArray(mesh.geometry.boundingBox.bounds)
    ) {
      throw new Error("Invalid mesh geometry or boundingBox structure");
    }

    let boundingBox = mesh.geometry.boundingBox.bounds;
    if (
      boundingBox.length < 2 ||
      !Array.isArray(boundingBox[0]) ||
      !Array.isArray(boundingBox[1])
    ) {
      throw new Error("boundingBox bounds are not properly defined");
    }

    let min = boundingBox[0];
    let max = boundingBox[1];

    // Update overall minimum coordinates
    overallMin[0] = Math.min(overallMin[0], min[0]);
    overallMin[1] = Math.min(overallMin[1], min[1]);
    overallMin[2] = Math.min(overallMin[2], min[2]);

    // Update overall maximum coordinates
    overallMax[0] = Math.max(overallMax[0], max[0]);
    overallMax[1] = Math.max(overallMax[1], max[1]);
    overallMax[2] = Math.max(overallMax[2], max[2]);
  });

  // Create a new bounding box with the overall min and max coordinates
  let newBoundingBox = [overallMin, overallMax];

  // Calculate the width, height, and depth
  let width = overallMax[0] - overallMin[0];
  let height = overallMax[1] - overallMin[1];
  let depth = overallMax[2] - overallMin[2];

  // Return the dimensions as a 3-point vector
  return { width, height, depth };

  //return newBoundingBox;
}

function calculateZoom(boundingBox) {
  try {
    // Given example bounding box and zoom level
    const exampleBoundingBox = {
      width: 312.0005000624958,
      height: 312.00074999364347,
      depth: 432.0009977339615,
    };
    const exampleZoom = 0.5;

    // Calculate the diagonal length of the given example bounding box
    const exampleDiagonal = Math.sqrt(
      Math.pow(exampleBoundingBox.width, 2) +
        Math.pow(exampleBoundingBox.height, 2) +
        Math.pow(exampleBoundingBox.depth, 2)
    );

    // Calculate the diagonal length of the input bounding box
    const diagonal = Math.sqrt(
      Math.pow(boundingBox.width, 2) +
        Math.pow(boundingBox.height, 2) +
        Math.pow(boundingBox.depth, 2)
    );

    // Calculate the zoom level based on the proportional relationship
    const zoom = (exampleZoom * exampleDiagonal) / diagonal;
    return zoom;
  } catch (e) {
    throw new Error("Error calculating zoom level");
  }
}

function generateCameraPosition(meshArray) {
  try {
    // Get the largest bounding box from the mesh array
    let largestBoundingBox = getLargestBoundingBox(meshArray);
    let zoom = calculateZoom(largestBoundingBox);

    return zoom;
  } catch (e) {
    throw new Error(e);
  }
}

function generateDisplayMesh(id) {
  return started.then(() => {
    console.log("Generating display mesh for " + id);
    if (library[id] == undefined || id == undefined) {
      console.log("ID undefined or not found in library");
      //throw new Error("ID not found in library");
      generateDefaultMesh(id).then((result) => {
        console.log(result);
      });
    }
    let meshArray = [];

    //Flatten the assembly to remove hierarchy
    const flattened = flattenAssembly(library[id]);

    flattened.forEach((displayObject) => {
      var cleanedGeometry = [];
      if (displayObject.geometry.mesh == undefined) {
        let sketchPlane = library[id].plane;
        let sketches = displayObject.geometry.clone();
        cleanedGeometry = sketches.sketchOnPlane(sketchPlane).extrude(0.0001);
      } else {
        cleanedGeometry = displayObject.geometry;
      }
      meshArray.push({
        color: displayObject.color,
        geometry: cleanedGeometry,
      });
    });
    let cameraZoom;
    try {
      cameraZoom = generateCameraPosition(meshArray);
    } catch (e) {
      console.log("Error generating camera position");
      cameraZoom = 1;
    }
    let finalMeshes = [];
    //Iterate through the meshArray and create final meshes with faces, edges and color to pass to display
    meshArray.forEach((meshgeometry) => {
      try {
        //Try extruding if there is no 3d shape
        if (meshgeometry.geometry.mesh == undefined) {
          const threeDShape = meshgeometry
            .sketchOnPlane(sketchPlane)
            .clone()
            .extrude(0.0001);
          return {
            faces: threeDShape.mesh({ tolerance: 0.1, angularTolerance: 0.5 }),
            edges: threeDShape.meshEdges({
              tolerance: 0.1,
              angularTolerance: 0.5,
            }),
          };
        } else {
          finalMeshes.push({
            cameraZoom: cameraZoom,
            faces: meshgeometry.geometry.mesh({
              tolerance: 0.1,
              angularTolerance: 0.5,
            }),
            edges: meshgeometry.geometry.meshEdges({
              tolerance: 0.1,
              angularTolerance: 0.5,
            }),
            color: meshgeometry.color,
          });
        }
      } catch (e) {
        throw new Error("Error generating display mesh" + e);
      }
    });

    return finalMeshes;
  });
}

if (
  typeof self !== "undefined" &&
  typeof self.addEventListener === "function" &&
  process.env.NODE_ENV !== "test"
) {
  expose({
    deleteFromLibrary,
    importingSTEP,
    importingSTL,
    importingSVG,
    createMesh,
    circle,
    color,
    code,
    regularPolygon,
    rectangle,
    generateDisplayMesh,
    extrude,
    fusion,
    extractBomList,
    generateThumbnail,
    visExport,
    downExport,
    shrinkWrapSketches,
    move,
    rotate,
    scale,
    fillet,
    chamfer,
    difference,
    tag,
    extractAllTags,
    layout,
    displayLayout,
    output,
    molecule,
    bom,
    extractTag,
    intersect,
    assembly,
    loftShapes,
    text,
    resetView,
    visualizeGcode,
    getBoundingBox,
    getBounds,
  });
}

// Export functions for testing and ES module environments
export {
  library,
  started,
  deleteFromLibrary,
  importingSTEP,
  importingSTL,
  importingSVG,
  createMesh,
  circle,
  color,
  code,
  regularPolygon,
  rectangle,
  extrude,
  move,
  rotate,
  scale,
  fillet,
  chamfer,
  difference,
  tag,
  extractAllTags,
  layout,
  displayLayout,
  output,
  molecule,
  bom,
  extractTag,
  intersect,
  assembly,
  loftShapes,
  text,
  visualizeGcode,
  getBoundingBox,
  getBounds,
  is3D,
  generateThumbnail,
  visExport,
  downExport,
  shrinkWrapSketches,
};
