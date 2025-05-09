import Atom from "../prototypes/atom.js";
import GlobalVariables from "../js/globalvariables.js";
//import GlobalVariables from '../js/globalvariables.js'
import { proxy } from "comlink";
import { button, LevaInputs } from "leva";


/**
 * Rearrange all input geometries to fit on a sheet of material. Parts are packed
 * as densely as possible while still respecting part padding. In general, all parts
 * will be arranged to be as thin as possible, however there are some exceptions in
 * order to fit into a sheet of stock with some uniform thickness.
 * 
 * Params:
 * - geometry: The geometry or assembly to be arranged
 * - width: The width of the sheet
 * - height: The height of the sheet
 * - partPadding: The padding between parts
 */
export default class CutLayout extends Atom {
  /**
   * The constructor function.
   * @param {object} values An array of values passed in which will be assigned to the class as this.x
   */
  constructor(values) {
    super(values);

    /**
     * This atom's type
     * @type {string}
     */
    this.atomType = "Cut Layout";
    /**
     * This atom's type
     * @type {string}
     */
    this.type = "cutLayout";
    /**
     * This atom's name
     * @type {string}
     */
    this.name = "Cut Layout";
    /**
     * A description of this atom
     * @type {string}
     */
    this.description =
      "Extracts all parts tagged for cutting and lays them out on a sheet to cut.";
    /**
     * The array of placements returned by the layout function
     * @type {array}
     */
    this.placements = [];

    this.progress = 0.0;

    this.cancelationHandle = undefined;

    this.addIO("input", "geometry", this, "geometry", null);

    this.addIO(
      "input",
      "Sheet Width",
      this,
      "number",
      GlobalVariables.topLevelMolecule.unitsKey == "MM" ? 2438 : 96
    );
    this.addIO(
      "input",
      "Sheet Height",
      this,
      "number",
      GlobalVariables.topLevelMolecule.unitsKey == "MM" ? 1219 : 48
    );
    this.addIO(
      "input",
      "Part Padding",
      this,
      "number",
      GlobalVariables.topLevelMolecule.unitsKey == "MM" ? 6 : .25
    );

    this.addIO("output", "geometry", this, "geometry", "");

    this.setValues(values);
  }

  /**
   * Draw the cutlayout icon
   */
  draw() {
    super.draw(); //Super call to draw the rest

    const xInPixels = GlobalVariables.widthToPixels(this.x);
    const yInPixels = GlobalVariables.heightToPixels(this.y);
    const radiusInPixels = GlobalVariables.widthToPixels(this.radius);

    GlobalVariables.c.beginPath();
    GlobalVariables.c.fillStyle = "#949294";
    GlobalVariables.c.moveTo(
      xInPixels - radiusInPixels / 2,
      yInPixels + radiusInPixels / 2
    );
    GlobalVariables.c.lineTo(
      xInPixels + radiusInPixels / 2,
      yInPixels + radiusInPixels / 2
    );
    GlobalVariables.c.lineTo(xInPixels + radiusInPixels / 2, yInPixels);
    GlobalVariables.c.lineTo(xInPixels - radiusInPixels / 2, yInPixels);
    GlobalVariables.c.lineTo(
      xInPixels - radiusInPixels / 2,
      yInPixels + radiusInPixels / 2
    );
    //GlobalVariables.c.fill()
    GlobalVariables.c.setLineDash([3, 3]);
    GlobalVariables.c.stroke();
    GlobalVariables.c.closePath();
    GlobalVariables.c.beginPath();
    GlobalVariables.c.lineTo(
      xInPixels + radiusInPixels / 4,
      yInPixels - radiusInPixels / 1.7
    );
    GlobalVariables.c.lineTo(
      xInPixels - radiusInPixels / 4,
      yInPixels - radiusInPixels / 2
    );
    GlobalVariables.c.lineTo(xInPixels - radiusInPixels / 4, yInPixels);
    GlobalVariables.c.lineTo(xInPixels + radiusInPixels / 2, yInPixels);
    GlobalVariables.c.lineTo(
      xInPixels + radiusInPixels / 4,
      yInPixels - radiusInPixels / 1.7
    );

    //GlobalVariables.c.fill()
    GlobalVariables.c.lineWidth = 1;
    GlobalVariables.c.lineJoin = "round";
    GlobalVariables.c.stroke();
    GlobalVariables.c.setLineDash([]);
    GlobalVariables.c.closePath();


    //draw progress circle in the middle
    if (this.progress < 1.0) {
      GlobalVariables.c.beginPath();
      GlobalVariables.c.fillStyle = this.centerColor;
      GlobalVariables.c.moveTo(
        GlobalVariables.widthToPixels(this.x),
        GlobalVariables.heightToPixels(this.y)
      );
      GlobalVariables.c.arc(
        GlobalVariables.widthToPixels(this.x),
        GlobalVariables.heightToPixels(this.y),
        GlobalVariables.widthToPixels(this.radius) / 1.5,
        0,
        this.progress * Math.PI * 2,
        false
      );
      GlobalVariables.c.closePath();
      GlobalVariables.c.fill();
    }
  }
  /**
   * We only want the layout to update when the button is pressed not when the inputs update so we block the regular update value behavior
   */
  updateValue() {

    super.updateValue();

    if (this.inputs.every((x) => x.ready)) {
      this.processing = true;
      var inputID = this.findIOValue("geometry");
      var sheetWidth = this.findIOValue("Sheet Width");
      var sheetHeight = this.findIOValue("Sheet Height");
      var partPadding = this.findIOValue("Part Padding");

      if (!inputID) {
        this.setAlert('"geometry" input is missing');
        return;
      }
      
     /* GlobalVariables.cad
        .displayLayout(
          this.uniqueID,
          inputID,
          [this.placements],
          {
            width: sheetWidth,
            height: sheetHeight,
            partPadding: partPadding,
            units: GlobalVariables.topLevelMolecule.units[GlobalVariables.topLevelMolecule.unitsKey],
          })
        .then((warning) => {
          this.basicThreadValueProcessing();
          if (warning != undefined) {
            this.setAlert(warning);
          }
          this.progress = 1.0;
          this.cancelationHandle = undefined;
          this.processing = false;
        })
        .catch(this.alertingErrorHandler());
      */
    }
  }

  /**
   * Pass the input geometry to a worker function to compute the translation.
   */
  updateValueButton() {
    super.updateValue();
/*    const config = {
      curveTolerance: 0.3,
      spacing: 0.25,
      rotations: 4, // TODO: this should be higher, like at least 8? idk
      populationSize: 5,
      mutationRate: 50,
      useHoles: true,
    };
    const polygons = [Float64Array.from([0.0,0.0,0.0,1.0,1.0,1.0,1.0,0.0,0.0,0.0])]
    const bin = Float64Array.from([0.0,0.0,0.0,10.0,10.0,10.0,10.0,0.0,0.0,0.0])
    const packer = new PolygonPacker();
    packer.start(
      config,
      polygons,
      bin,
      (p) => {console.log("progress", p)},
      (placements) => {
        console.log("placements", placements);
        this.placements = placements;
      });
*/


    if (this.inputs.every((x) => x.ready)) {
      if (this.cancelationHandle) {
        // There's an in-progress nesting worker. Cancel it and start another nesting
        // computation with the new inputs.
        this.cancelationHandle();
      }
      this.processing = true;
      var inputID = this.findIOValue("geometry");
      var sheetWidth = this.findIOValue("Sheet Width");
      var sheetHeight = this.findIOValue("Sheet Height");
      var partPadding = this.findIOValue("Part Padding");

      if (!inputID) {
        this.setAlert('"geometry" input is missing');
        return;
      }

      GlobalVariables.cad
        .layout(
          this.uniqueID,
          inputID,
          proxy((progress, cancelationHandle) => {
            this.progress = progress;
            console.log("progress", progress);
            this.cancelationHandle = cancelationHandle;
          }),
          proxy((placements) => {
            console.log("placements", placements);
            this.placements = placements;
          }),
          {
            width: sheetWidth,
            height: sheetHeight,
            partPadding: partPadding,
            units: GlobalVariables.topLevelMolecule.units[GlobalVariables.topLevelMolecule.unitsKey],
          })
        .then((positions) => {
          console.log("layout future has resolved with:");
          console.log(positions);
          this.positions = positions;
          this.basicThreadValueProcessing();
          this.progress = 1.0;
          this.cancelationHandle = undefined;
          this.processing = false;
        })
        .catch(this.alertingErrorHandler());
    }
  }

  /**
   * Add the "Compute Layout" button to the leva inputs.
   */
  createLevaInputs() {
      let inputParams = super.createLevaInputs();
  
      inputParams["Compute Layout"] = button(() => {
          this.updateValueButton();
      });

      const sheetWidth = this.findIOValue("Sheet Width");


      let prepare_label = (sheet, index, totalsheets) => {
        if (totalsheets > 1) {
          return " " + sheet + "." + index;
        }
        else {
          return " " + index
        }
      };

      let parse_label = (label) => {
        if (label.includes('.')) {
          const parts = label.split('.');
          return {
            sheet: parseInt(parts[0], 10),
            index: parseInt(parts[1], 10)
          };
        } else {
          return {
            sheet: 0,
            index: parseInt(label, 10)
          };
        }
      };

      /*
      //Expose the stored positions
      this.placements.forEach((sheet, index) => {
        sheet.forEach((placement, part_num) => {
          inputParams[this.uniqueID + "position" + index] = {
            value: { x: placement.translate.x, y: placement.translate.y + sheetWidth * index, z: placement.rotate },
            label: prepare_label(index, part_num, sheet.length),
            onChange: (value, index) => {
                const match = index.match(/position(\d+)/);
                const indexNumber = match ? parseInt(match[1], 10) : null;

                if (indexNumber != null) {
                  const placement = this.placements[indexNumber / this.placements.length][indexNumber % this.placements.length];
                  //Update the placement with the new value];
                  //If anything has changed we need to update the value and recompute
                  if (placement.translate.x !== value.x || placement.translate.y !== value.y || placement.rotate !== value.z) {
                      placement.translate.x = value.x;
                      placement.translate.y = value.y;
                      placement.rotate = value.z;
          
                      this.updateValue();
                  }
                }
            },
          }
        });
      });*/


      return inputParams;
  }

  /**
   * Save the placements to be loaded next time
   */
  serialize(values) {
    //Save the readme text to the serial stream
    var valuesObj = super.serialize(values);
    valuesObj.placements = this.placements;

    return valuesObj;
  }

}
