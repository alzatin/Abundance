import Atom from "../prototypes/atom";
import GlobalVariables from "../js/globalvariables.js";

/**
 * This class creates the point atom.
 */
export default class Point extends Atom {
  /**
   * The constructor function.
   * @param {object} values An array of values passed in which will be assigned to the class as this.x
   */
  constructor(values) {
    super(values);

    /**
     * This atom's name
     * @type {string}
     */
    this.name = "Point";
    /**
     * This atom's type
     * @type {string}
     */
    this.atomType = "Point";
    /**
     * A description of this atom
     * @type {string}
     */
    this.description = "Creates a point in 3D space.";

    /**
     * The default value for the point
     * @type {array}
     */
    this.value = [0, 0, 0];

    this.addIO("input", "xDist", this, "number", 0.0);
    this.addIO("input", "yDist", this, "number", 0.0);
    this.addIO("input", "zDist", this, "number", 0.0);

    // Add output
    this.addIO("output", "geometry", this, "geometry", this.value);

    this.setValues(values);
  }

  /**
   * Draw the point atom & icon.
   */
  draw() {
    super.draw(); //Super call to draw the rest

    GlobalVariables.c.beginPath();
    GlobalVariables.c.fillStyle = "#949294";
    GlobalVariables.c.arc(
      GlobalVariables.widthToPixels(this.x),
      GlobalVariables.heightToPixels(this.y),
      GlobalVariables.widthToPixels(this.radius / 4),
      0,
      Math.PI * 2,
      false
    );
    GlobalVariables.c.fill();
    GlobalVariables.c.stroke();
    GlobalVariables.c.closePath();
  }

  createLevaInputs() {
    let inputParams = {};

    inputParams[this.uniqueID + "point"] = {
      value: { x: this.inputs[0].value, y: this.inputs[1].value },
      label: "Point",
      step: 1,
      disabled: false,
      onChange: (value) => {
        if (
          this.inputs[0].value !== value.x ||
          this.inputs[1].value !== value.y
        ) {
          this.inputs[0].setValue(value.x);
          this.inputs[1].setValue(value.y);
        }
      },
    };

    return inputParams;
  }

  /**
   * Create a new point in a worker thread.
   */
  updateValue() {
    super.updateValue();

    this.processing = true;

    var x = this.findIOValue("xDist");
    var y = this.findIOValue("yDist");
    var z = this.findIOValue("zDist");

    this.value = [x, y, z];

    this.decreaseToProcessCountByOne();
    if (this.output) {
      this.output.setValue(this.value);
      this.output.ready = true;
    }
    this.processing = false;
  }

  /**
   * Send the value of this atom to the 3D display. Used to display the number
   */
  sendToRender() {
    //Send code to jotcad to render
    console.log("point has nothing to render");
  }

  /**
   * Serialize this atom's properties
   */
  serialize(values) {
    //Save the atom's properties to the serial stream
    var valuesObj = super.serialize(values);
    valuesObj.x = this.x;
    valuesObj.y = this.y;
    valuesObj.z = this.z;

    return valuesObj;
  }
}
