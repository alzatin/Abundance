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
     * Default x coordinate value
     * @type {number}
     */
    this.xValue = 0;
    
    /**
     * Default y coordinate value
     * @type {number}
     */
    this.yValue = 0;
    
    /**
     * Default z coordinate value
     * @type {number}
     */
    this.zValue = 0;

    // Add inputs for x, y, z coordinates
    this.addIO("input", "x", this, "number", this.xValue);
    this.addIO("input", "y", this, "number", this.yValue);
    this.addIO("input", "z", this, "number", this.zValue);
    
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
   * Create Leva Menu Inputs
   */
  createLevaInputs() {
    // Create the Leva inputs for x, y, z coordinates
    let outputParams = {};
    
    outputParams["x"] = {
      value: this.xValue,
      label: "X Coordinate",
      onChange: (value) => {
        this.xValue = value;
        this.inputs.find(input => input.name === "x").setValue(value);
        this.updateValue();
      },
    };
    
    outputParams["y"] = {
      value: this.yValue,
      label: "Y Coordinate",
      onChange: (value) => {
        this.yValue = value;
        this.inputs.find(input => input.name === "y").setValue(value);
        this.updateValue();
      },
    };
    
    outputParams["z"] = {
      value: this.zValue,
      label: "Z Coordinate",
      onChange: (value) => {
        this.zValue = value;
        this.inputs.find(input => input.name === "z").setValue(value);
        this.updateValue();
      },
    };
    
    return outputParams;
  }

  /**
   * Create a new point in a worker thread.
   */
  updateValue() {
    super.updateValue();
    
    // Get the x, y, z coordinates from inputs
    const xVal = this.findIOValue("x");
    const yVal = this.findIOValue("y");
    const zVal = this.findIOValue("z");
    
    // Update the menu values to match the inputs
    this.xValue = xVal;
    this.yValue = yVal;
    this.zValue = zVal;
    
    GlobalVariables.cad
      .point(this.uniqueID, xVal, yVal, zVal)
      .then(() => {
        this.basicThreadValueProcessing();
      })
      .catch(this.alertingErrorHandler());
  }
  
  /**
   * Serialize this atom's properties
   */
  serialize(values) {
    //Save the atom's properties to the serial stream
    var valuesObj = super.serialize(values);
    valuesObj.xValue = this.xValue;
    valuesObj.yValue = this.yValue;
    valuesObj.zValue = this.zValue;
    
    return valuesObj;
  }
}