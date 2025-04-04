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

  runKirimoto(kiriEngine) {
    console.log("kiriEngine");
    console.log(kiriEngine);
    if (!kiriEngine) {
      console.error("Kiri:Moto engine is not initialized yet.");
      return;
    }

    kiriEngine
      .setListener((message) => {
        console.log("Kiri:Moto Message:", message);
        if (message.type === "progress") {
          console.log(`Progress: ${message.progress * 100}%`);
        }
      })
      .load("/Simple_cube.stl") // Replace with your STL file path
      .then((eng) => {
        console.log("STL file loaded");
        return eng.setProcess({
          sliceShells: 1,
          sliceFillSparse: 0.1,
          sliceTopLayers: 1,
          sliceBottomLayers: 1,
        });
      })
      .catch((error) => {
        console.error("Error loading STL file:", error);
      })
      .then((eng) => {
        console.log("Process parameters set");
        return eng.setDevice({
          gcodePre: ["M82", "M104 S220"],
          gcodePost: ["M107"],
        });
      })
      .then((eng) => {
        console.log("Device parameters set");
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject("Slicing timed out"), 600000); //5min timeout
          console.log(eng);
          eng.slice().then(() => {
            clearTimeout(timeout);
            resolve(eng);
          });
        });
      })
      .then((eng) => {
        console.log("Slicing completed");
        return eng.prepare();
      })
      .then((eng) => {
        console.log("Preparation completed");
        return eng.export();
      })
      .then((gcode) => {
        console.log("GCode generated:", gcode);
      })
      .catch((error) => {
        console.error("Kiri:Moto Error:", error);
      });
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
