import Atom from "../prototypes/atom.js";
import GlobalVariables from "../js/globalvariables.js";
import { button } from "leva";
//import saveAs from '../lib/FileSaver.js'

/**
 * This class creates the circle atom.
 */
export default class Gcode extends Atom {
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
    this.name = "Gcode";
    /**
     * This atom's type
     * @type {string}
     */
    this.atomType = "Gcode";
    /**
     * This atom's height as drawn on the screen
     */

    this.height = 16;
    /**
     * A description of this atom
     * @type {string}
     */
    this.description = "Generates Maslow gcode from the input geometry.";

    this.blob = null;
    /**
     * The generated gcode string
     * @type {string}
     */
    this.gcodeString = "";

    this.addIO("input", "geometry", this, "geometry", null);
    this.addIO("input", "tool size", this, "number", 6.35);
    this.addIO("input", "passes", this, "number", 6);
    this.addIO("input", "speed", this, "number", 500);
    this.addIO("input", "tabs", this, "string", "true");
    this.addIO("input", "safe height", this, "number", 6);

    this.addIO("output", "gcode", this, "geometry", "");

    this.setValues(values);
  }

  /**
   * Draw the circle atom & icon.
   */
  draw() {
    super.draw(); //Super call to draw the rest

    GlobalVariables.c.beginPath();
    GlobalVariables.c.fillStyle = "#484848";
    GlobalVariables.c.font = `${GlobalVariables.widthToPixels(
      this.radius
    )}px Work Sans Bold`;
    GlobalVariables.c.fillText(
      "G",
      GlobalVariables.widthToPixels(this.x - this.radius / 3),
      GlobalVariables.heightToPixels(this.y) + this.height / 3
    );
    GlobalVariables.c.fill();
    GlobalVariables.c.closePath();
  }

  /**
   * Generate a layered outline of the part where the tool will cut
   */
  updateValue() {
    super.updateValue();
    try {
      var toolSize = this.findIOValue("tool size");
      var passes = this.findIOValue("passes");
      var speed = this.findIOValue("speed");
      var tabs = this.findIOValue("tabs");
      var safeHeight = this.findIOValue("safe height");
      /* We have to make an STL file to pass to the Kiri:Moto engine */

      let inputID = this.findIOValue("geometry");
      let fileType = this.findIOValue("STL");

      GlobalVariables.cad
        .visExport(this.uniqueID, inputID, fileType)
        .then((result) => {
          GlobalVariables.cad
            .downExport(this.uniqueID, "STL")
            .then((result) => {
              console.log(result);
              if (!this.kirimotoBlobs) {
                this.kirimotoBlobs = {};
              }
              this.kirimotoBlobs[this.uniqueID] = result; // Store the blob with a unique ID to avoid overriding

              // Dispatch a custom event to notify React components
              const event = new CustomEvent("kirimotoBlobUpdated", {
                detail: { uniqueID: this.uniqueID, blob: result },
              });
              window.dispatchEvent(event);
            });
        });
    } catch (err) {
      this.setAlert(err);
    }
  }

  createLevaInputs() {
    let inputParams = {};

    /** Runs through active atom inputs and adds IO parameters to default param*/
    if (this.inputs) {
      this.inputs.map((input) => {
        const checkConnector = () => {
          return input.connectors.length > 0;
        };

        /* Some input parameters (inlcuding equation and result) live in the parameter editor file so they can use the set, get functions */

        /* Makes inputs for Io's other than geometry */
        if (input.valueType !== "geometry") {
          inputParams[input.name] = {
            value: input.value,
            disabled: checkConnector(),
            onChange: (value) => {
              input.setValue(value);
            },
            order: -2,
          };
        }
      });
    }

    inputParams["Download Gcode"] = button(() => this.clickKiriButton());

    return inputParams;
  }

  clickKiriButton() {
    let kirimotoButton = document.getElementById("kirimoto-button");
    console.log(kirimotoButton);
    kirimotoButton.click();
  }
  /**
   * The function which is called when you press the download button.
   */
  downloadGCode() {
    try {
      var geometry = this.findIOValue("geometry");
      var toolSize = this.findIOValue("tool size");
      var passes = this.findIOValue("passes");
      var speed = this.findIOValue("speed");
      var tabs = this.findIOValue("tabs");
      var safeHeight = this.findIOValue("safe height");
    } catch (err) {
      this.setAlert(err);
    }
  }
}
