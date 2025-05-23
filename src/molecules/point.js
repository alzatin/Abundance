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
    this.description = "Creates a sketch point in 3D space.";

    // A point has only an output, no inputs to adjust as per requirements
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
   * Create a new sketch point in a worker thread.
   */
  updateValue() {
    super.updateValue();
    // Create a point at the origin (0,0,0)
    GlobalVariables.cad
      .point(this.uniqueID, 0, 0, 0)
      .then(() => {
        this.basicThreadValueProcessing();
      })
      .catch(this.alertingErrorHandler());
  }
}