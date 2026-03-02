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
      { name: "startX", valueType: "number", defaultValue: 0 },
      { name: "startY", valueType: "number", defaultValue: 0 },
      { name: "startZ", valueType: "number", defaultValue: 0 },
      { name: "endX", valueType: "number", defaultValue: 10 },
      { name: "endY", valueType: "number", defaultValue: 0 },
      { name: "endZ", valueType: "number", defaultValue: 0 },
      { name: "color", valueType: "string", defaultValue: "#333333" },
      { name: "geometry", valueType: "geometry", type: "output" },
    ]);

    this.setValues(values);
  }

  /**
   * Build a ThreeJS texture/sprite from a text string and return a Sprite object.
   * @param {string} text - The text to render
   * @param {string} color - The hex color string for the text
   * @returns {THREE.Sprite}
   */
  createTextSprite(text, color) {
    const canvas = document.createElement("canvas");
    const size = 256;
    canvas.width = size;
    canvas.height = size / 2;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "rgba(0,0,0,0)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = "Bold 40px Arial";
    ctx.fillStyle = color;
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
   * @param {THREE.Vector3} start - Start point of the line
   * @param {THREE.Vector3} end - End point of the line
   * @param {string} labelText - The text to display
   * @param {string} color - The hex color string for the line and text
   */
  buildLabelGeometry(start, end, labelText, color) {
    const geometryArray = [];

    // --- Line (complete Three.js object with geometry + material) ---
    const lineGeo = new THREE.BufferGeometry().setFromPoints([start, end]);
    const lineMat = new THREE.LineBasicMaterial({ color });
    const line = new THREE.Line(lineGeo, lineMat);
    line.name = "label-line";
    geometryArray.push(line);

    // --- Text sprite (positioned just past the end of the line) ---
    const TEXT_OFFSET_DISTANCE = 3;
    const direction = new THREE.Vector3().subVectors(end, start).normalize();
    const textOffset = direction.multiplyScalar(TEXT_OFFSET_DISTANCE);
    const sprite = this.createTextSprite(String(labelText), color);
    sprite.position.set(
      end.x + textOffset.x,
      end.y + textOffset.y,
      end.z + textOffset.z,
    );
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
    const start = new THREE.Vector3(
      Number(inputs.startX) || 0,
      Number(inputs.startY) || 0,
      Number(inputs.startZ) || 0,
    );
    const end = new THREE.Vector3(
      Number(inputs.endX) || 10,
      Number(inputs.endY) || 0,
      Number(inputs.endZ) || 0,
    );
    const labelText = String(inputs.text || "label");
    const color = String(inputs.color || "#333333");

    this.buildLabelGeometry(start, end, labelText, color);

    return inputs.geometry;
  }

  /**
   * Create the input parameters panel for this atom.
   */
  createInputParams() {
    const inputParams = {};

    if (this.inputs.every((x) => x.ready)) {
      this.inputs.forEach((input) => {
        const checkConnector = () => input.connectors.length > 0;

        if (input.valueType !== "geometry") {
          inputParams[this.uniqueID + input.name] = {
            type: input.valueType === "string" ? "text" : "number",
            value: input.value,
            label: input.name,
            disabled: checkConnector(),
            step: input.valueType === "number" ? 0.1 : undefined,
            onChange: (value) => {
              if (input.value !== value) {
                input.setValue(value);
              }
            },
          };
        }
      });
    }

    // Add mobile delete button for touchscreen devices
    const flowCanvas = document.getElementById("flow-canvas");
    if (
      GlobalVariables.isMobile() &&
      flowCanvas &&
      flowCanvas.style.display !== "none"
    ) {
      inputParams[this.uniqueID + "delete"] = {
        type: "button",
        label: "Delete Selected",
        onClick: () => {
          flowCanvas.focus();
          const event = new KeyboardEvent("keydown", {
            bubbles: true,
            cancelable: true,
            key: "Delete",
            code: "Delete",
            keyCode: 46,
          });
          flowCanvas.dispatchEvent(event);
        },
      };
    }

    return inputParams;
  }

  /**
   * Serialize the atom's state. Uses the default implementation since all
   * label properties are stored as IO values.
   */
  serialize(offset = { x: 0, y: 0 }) {
    return super.serialize(offset);
  }
}
