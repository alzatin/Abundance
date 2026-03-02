import Atom from "../prototypes/atom.js";
import GlobalVariables from "../js/globalvariables.js";
import * as THREE from "three";

/**
 * This class creates the label atom which adds a dimension label (a line with
 * accompanying text) to the 3D view. The label is rendered as non-replicad
 * ThreeJS geometry and the input geometry is passed through unchanged.
 */
export default class Label extends Atom {
  /**
   * The constructor function.
   * @param {object} values An object of values passed in which will be assigned to the class as this.x
   */
  constructor(values) {
    super(values);

    /**
     * This atom's name
     * @type {string}
     */
    this.name = "Label";
    /**
     * This atom's type
     * @type {string}
     */
    this.atomType = "Label";
    /**
     * A description of this atom
     * @type {string}
     */
    this.description =
      "Adds a dimension label with a line and text to the 3D view. The geometry is passed through unchanged.";

    this.addAllIOs([
      { name: "geometry", valueType: "geometry", type: "input" },
      { name: "text", valueType: "string", defaultValue: "label" },
      { name: "lineLength", valueType: "number", defaultValue: 10 },
      { name: "geometry", valueType: "geometry", type: "output" },
    ]);

    this.setValues(values);
  }

  /**
   * Build a ThreeJS texture/sprite from a text string and return a Sprite object.
   * @param {string} text - The text to render
   * @returns {THREE.Sprite}
   */
  createTextSprite(text) {
    const canvas = document.createElement("canvas");
    const size = 256;
    canvas.width = size;
    canvas.height = size / 2;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "rgba(0,0,0,0)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = "Bold 40px Arial";
    ctx.fillStyle = "#333333";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      depthTest: false, // Render label text on top so it remains visible regardless of depth
    });
    const sprite = new THREE.Sprite(material);
    // Scale so text appears at a reasonable size relative to the line
    sprite.scale.set(10, 5, 1);
    return sprite;
  }

  /**
   * Build the ThreeJS geometries (line + text sprite) and store them in
   * this.nonReplicadGeom so they get sent to the renderer.
   * @param {number} lineLength - The length of the dimension line
   * @param {string} labelText - The text to display
   */
  buildLabelGeometry(lineLength, labelText) {
    const geometryArray = [];

    // --- Line (complete Three.js object with geometry + material) ---
    const points = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(lineLength, 0, 0),
    ];
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const lineMat = new THREE.LineBasicMaterial({ color: "#333333" });
    const line = new THREE.Line(lineGeo, lineMat);
    line.name = "label-line";
    geometryArray.push(line);

    // --- Text sprite (positioned at the end of the line) ---
    const sprite = this.createTextSprite(String(labelText));
    sprite.position.set(lineLength + 6, 0, 0);
    sprite.name = "label-text";
    geometryArray.push(sprite);

    this.nonReplicadGeom = {
      geometry: geometryArray,
      material: null,
      hideMainMesh: false,
    };
  }

  /**
   * Compute the label atom: build label geometry and pass through the input geometry.
   * @param {object} inputs - The resolved input values
   * @returns {Promise} The input geometry unchanged
   */
  async compute(inputs) {
    const lineLength = Number(inputs.lineLength) || 10;
    const labelText = String(inputs.text || "label");

    this.buildLabelGeometry(lineLength, labelText);

    return inputs.geometry;
  }

  /**
   * Serialize the atom's state. Uses the default implementation since all
   * label properties (text, lineLength) are stored as IO values.
   */
  serialize(offset = { x: 0, y: 0 }) {
    return super.serialize(offset);
  }
}
