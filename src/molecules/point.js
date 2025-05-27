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

    this.addIO("input", "xDist", this, "number", 0.0);
    this.addIO("input", "yDist", this, "number", 0.0);
    this.addIO("input", "zDist", this, "number", 0.0);

    // Add output
    this.addIO("output", "geometry", this, "geometry", "");

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

  /**
   * Starts propagation from this atom if it is not waiting for anything up stream.
   */
  beginPropagation() {
    //Check to see if a value already exists. Generate it if it doesn't. Only do this for circles and rectangles

    //Triggers inputs with nothing connected to begin propagation
    this.inputs.forEach((input) => {
      input.beginPropagation();
    });
  }

  /**
   * Create a new point in a worker thread.
   */
  updateValue() {
    super.updateValue();
    console.log("Updating Point Value");

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
    valuesObj.xDist = this.findIOValue("xDist");
    valuesObj.yDist = this.findIOValue("yDist");
    valuesObj.zDist = this.findIOValue("zDist");

    return valuesObj;
  }
}
