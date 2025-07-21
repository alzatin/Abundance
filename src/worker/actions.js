import * as util from "./util.js";

/**
 * Extrudes a 2D sketch to create a 3D geometry with the specified height and stores it in the library.
 * @param {string} toExtrude - An Assembly whose components will be extruded. Must contain only 2D sketches
 * @param {number} height - The height to extrude the sketch(es)
 * @returns {Promise<Object>} An Assembly containing the extruded geometries
 */
function extrude(toExtrude, height) {
  return util.actOnLeafs(toExtrude, (leaf) => {
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
}

/**
 * Moves a geometry by the specified x, y, and z distances. If the geometry is 2D, then it's plane
 * will be translated by the specified z distance.
 *
 * @param {Object} toMove - The assembly to be moved
 * @param {number} x - The distance to move along the x-axis
 * @param {number} y - The distance to move along the y-axis
 * @param {number} z - The distance to move along the z-axis
 * @returns {Promise<Object>} A promise that resolves to the moved geometry
 */
function move(toMove, x, y, z) {
  if (util.is3D(toMove)) {
    return util.actOnLeafs(
      toMove,
      (leaf) => {
        return {
          geometry: [leaf.geometry[0].clone().translate(x, y, z)],
          plane: leaf.plane,
          tags: leaf.tags,
          color: leaf.color,
          bom: leaf.bom,
        };
      },
      toMove.plane
    );
  } else {
    return util.actOnLeafs(
      toMove,
      (leaf) => {
        return {
          geometry: [leaf.geometry[0].clone().translate([x, y])],
          tags: leaf.tags,
          plane: leaf.plane.translate([0, 0, z]),
          color: leaf.color,
          bom: leaf.bom,
        };
      },
      toMove.plane.translate([0, 0, z])
    );
  }
}

/**
 * Function to rotate a geometry around the x, y, and z axis. If toRotate is 2D, it's plane will be
 * rotated based on the x and y inputs, while it will be rotated within the plane according to the z input.
 * @param {Object} toRotate - The geometry to rotate
 * @param {number} x - The angle to rotate around the x axis
 * @param {number} y - The angle to rotate around the y axis
 * @param {number} z - The angle to rotate around the z axis
 * @returns {Promise<Object>} A promise that resolves to the rotated geometry
 **/
async function rotate(toRotate, x, y, z) {
  if (util.is3D(toRotate)) {
    return util.actOnLeafs(toRotate, (leaf) => {
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
  } else {
    return util.actOnLeafs(toRotate, (leaf) => {
      return {
        geometry: [leaf.geometry[0].clone().rotate(z, [0, 0, 0], [0, 0, 1])],
        tags: leaf.tags,
        plane: leaf.plane.pivot(x, "X").pivot(y, "Y"),
        color: leaf.color,
        bom: leaf.bom,
      };
    });
  }
}

/**
 * Scales a geometry by the specified scale factor.
 * @param {Object} geom - The geometry to scale
 * @param {number} scaleFactor - The scale factor to apply (1.0 = no change, 2.0 = double size, 0.5 = half size)
 * @returns {Promise<Object>} A promise that resolves to the scaled geometry
 */
async function scale(geom, scaleFactor) {
  if (util.is3D(geom)) {
    return util.actOnLeafs(
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
  } else {
    return util.actOnLeafs(
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
  }
}

/**
 * Applies a fillet (rounded edge) to the input geometry.
 * @param {Object|string} geom - The geometry to fillet, or library ID for same
 * @param {number} radius - The radius of the fillet
 * @returns {Promise<Object>} A promise that resolves to the filleted geometry
 */
async function fillet(geom, radius) {
  if (util.is3D(geom)) {
    return util.actOnLeafs(
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
  } else {
    return util.actOnLeafs(
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
  }
}

/**
 * Applies a chamfer (beveled edge) to the input geometry.
 * @param {Object|string} geom - The geometry to chamfer, or library ID for same
 * @param {number} size - The size of the chamfer
 * @returns {Promise<Object>} A promise that resolves to the chamfered geometry
 */
async function chamfer(geom, size) {
  await started;

  geom = toGeometry(geom, "chamfer-geometry");
  if (util.is3D(geom)) {
    return util.actOnLeafs(
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
  } else {
    return util.actOnLeafs(
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
  }
}

export { extrude, move, rotate, scale, fillet, chamfer };
