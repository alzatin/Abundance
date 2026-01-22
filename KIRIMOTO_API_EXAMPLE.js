//KIRIMOTO API EXAMPLE

const STOCK_MARGIN = 5;
const CUT_THROUGH = 0; // Default cut-through thickness if not provided
const passes = 2;
const speed = 1500;
new Engine()
  .setListener(display_message)
  .load(
    "https://raw.githubusercontent.com/alzatin/Test-dev-december-2/refs/heads/main/block_with_pocket.stl",
  )
  // should to call widget.setTopZ here ideally
  .then((eng) => {
    eng.widget.boundingBoxNeedsUpdate = true; // Ensure bounding box is updated
    //if (progressCallback) progressCallback(0.1); // 10% - STL loaded
    return eng.setMode("CAM");
  })
  .then((eng) => {
    //if (progressCallback) progressCallback(0.15); // 15% - Mode set
    const bounds = eng.widget.getBoundingBox();
    const z = bounds.max.z - bounds.min.z;
    return eng.setOrigin(0, 0, 0); // move part so top is at Z=0 (negate X to match coordinate systems)
  })
  .then((eng) =>
    eng.setStock({
      x: 3,
      y: 3,
      z: 0.1,
    }),
  )
  .then((eng) => {
    // Determine if project uses metric units
    const projectUnits = "MM";
    const isMetric = projectUnits === "MM";

    return eng.setTools([
      {
        id: 1000,
        number: 1,
        type: "endmill",
        name: "endmill",
        metric: isMetric,
        shaft_diam: 0.25,
        shaft_len: 1,
        flute_diam: 0.25,
        flute_len: 2,
        taper_tip: 0,
        order: 5,
      },
    ]);
  })
  .then((eng) => {
    const bounds = eng.widget.getBoundingBox();
    const z = bounds.max.z - bounds.min.z;
    const zBottom = z; // ensure cut through stock bottom

    // camCutthrough by pass for 1 pass, sets down to large value to avoid cutthrough extra pass/ extra pass is added for multi pass
    const down = passes > 1 ? (zBottom + CUT_THROUGH) / passes : 10000;
    // -1 to account for topZ -1 hack
    const camZBottom = -zBottom - CUT_THROUGH - 1;
    // single pass needs a cutthrough to generate correctly
    const camZThru = passes <= 1 ? 0.01 : CUT_THROUGH;
    const roughingStepOver = 0.6;

    return eng.setProcess({
      camOriginTop: true,
      camOriginCenter: false,
      camRoughAll: false,
      camZOffset: 0,
      camZTop: -1, //top of stock
      camRoughDown: 2,
      camRoughFlat: true,
      camRoughIn: true,
      camRoughOmitThru: false,
      camRoughOmitVoid: false,
      camRoughOn: true,
      camRoughTop: false,
      camRoughVoid: false,
      camStockZ: 0,
      camEaseAngle: 10,
      camEaseDown: true,
      camZAnchor: "bottom",
      camDepthFirst: true,
      camZThru: camZThru,
      camZClearance: 3,
      camStockOffset: true,
      camZBottom: camZBottom, //-zBottom, // temp hack to get around setTopZ bug
      camToolInit: true,
      camOutlineSpeed: speed,
      camRetractFeed: 300,
      camSpindleSpeed: speed,
      camFastFeed: 6000,
      camFastFeedZ: speed, // Match Z feed to speed to maintain feedrate during ramp down
      ops: [
        {
          type: "rough",
          tool: 1000,
          spindle: 1000,
          down: down,
          step: roughingStepOver,
          rate: speed,
          plunge: speed,
          leave: 0,
          leavez: 0,
          all: false,
          voids: false,
          flats: true,
          inside: true,
          omitthru: true,
          ov_topz: 0,
          ov_botz: 0,
          ov_conv: false,
        },
        {
          type: "outline",
          tool: 1000,
          spindle: 1000,
          step: 0.4,
          steps: 1,
          down: down, // https://forum.grid.space/t/cam-kirimoto-api-help/2511/22
          rate: speed,
          plunge: speed, // Match plunge rate to XY feedrate for consistent speed during ramp down
          dogbones: false,
          omitvoid: false,
          omitthru: false,
          outside: false,
          inside: true,
          wide: false,
          top: false,
          ov_topz: 0,
          ov_botz: 0,
          ov_conv: true,
        },
        {
          type: "outline",
          tool: 1000,
          spindle: 1000,
          step: 0.4,
          steps: 1,
          down: down, // https://forum.grid.space/t/cam-kirimoto-api-help/2511/22
          rate: speed,
          plunge: speed, // Match plunge rate to XY feedrate for consistent speed during ramp down
          dogbones: false,
          omitvoid: false,
          omitthru: true,
          outside: false,
          inside: false,
          wide: false,
          top: false,
          ov_topz: 0,
          ov_botz: 0,
          ov_conv: true,
        },
      ],
    });
  })
  .then((eng) => {
    // Determine G-code units command based on project units
    const projectUnits = "MM";
    const unitsCommand =
      projectUnits === "MM"
        ? "G21 ; set units to MM (required)"
        : "G20 ; set units to inches (required)";

    return eng.setDevice({
      mode: "CAM",
      internal: 0,
      bedHeight: 2.5,
      bedWidth: 678.18,
      bedDepth: 1524,
      maxHeight: 150,
      originCenter: false,
      spindleMax: 24000,
      gcodePre: [
        unitsCommand,
        "G90 ; absolute position mode (required)",
        "G0 F3000 ; set default rapid move feedrate",
        "G1 F1000 ; set default cutting feedrate",
      ],
      gcodePost: ["M05 ; spindle off", "M30 ; program end"],
      gcodeDwell: ["G4 P{time} ; dwell for {time}ms"],
      gcodeSpindle: ["M3 S{speed} ; spindle on at {spindle} rpm"],
      gcodeChange: [
        "M05 ; spindle off",
        "M6 T{tool} ; change tool to '{tool_name}'",
        "G37; get tool offset with ETS",
      ],
      gcodeFExt: "nc",
      gcodeSpace: true,
      gcodeStrip: false,
      deviceName: "Tormach.24R",
      useLaser: false,
    });
  })
  .then((eng) => {
    //if (progressCallback) progressCallback(0.5); // 50% - Process set
    // console.log(kiriEngine);
    //startSlicingProgress();
    return eng.slice();
  })
  .then((eng) => {
    // stopSlicingProgress();
    // if (progressCallback) progressCallback(0.9); // 80% - Slicing done
    return eng.prepare();
  })
  .then((eng) => eng.export())
  .then(display_gcode);

//TRYING TO DEBUG 4.6
// OUTLINE WORKING PROPERLY
/*new Engine()
.setListener(display_message)
.load("https://raw.githubusercontent.com/alzatin/A-Test-project-6/refs/heads/main/A-Test-project-6-STL.stl")
// should to call widget.setTopZ here ideally
.then(eng => eng.setMode("CAM"))
.then(eng => eng.setStock({
     x: 3,
      y: 3,
      z: 0.1,
}))
.then(eng => eng.moveTo(50, 0, 0))
.then(eng=> eng.setTools([{
    id: 1000,
    number: 1,
    type: "endmill",
    name: "end 1/4",
    metric: false,
    shaft_diam: 0.25,
    shaft_len: 1,
    flute_diam: 0.25,
    flute_len: 2,
    taper_tip: 0,
    order: 5
}]))
.then(eng => eng.setProcess({
    camEaseAngle:40,
    camEaseDown:true,
    camOffsetStock: true,
    camZAnchor: "bottom",
    camDepthFirst : false,
    camZThru: 1.524,
    camZBottom:-25, // temp hack to get around setTopZ bug
    camToolInit: true,
    ops: [{
        type: "outline",
        tool: 1000,
        spindle: 13000,
        step: 0.4,
        steps: 1,
        down: 5.08,
        rate: 635,
        plunge: 51,
        dogbones: false,
        omitvoid: false,
        omitthru: false,
        outside: false,
        inside: false,
        wide: false,
        top: false,
        ov_topz: 0,
        ov_botz: 0,
        ov_conv: true
    }
    ]
}))
.then(eng => eng.setDevice({
    mode: "CAM",
    internal: 0,
    bedHeight: 2.5,
    bedWidth: 678.18,
    bedDepth: 1524,
    maxHeight: 150,
    originCenter: false,
    spindleMax: 24000,
    gcodePre: [
        "G20 ; set units to inches (required)",
        "G90 ; absolute position mode (required)"
    ],
    gcodePost: [
        "M05 ; spindle off",
        "M30 ; program end"
    ],
    gcodeDwell: [
        "G4 P{time} ; dwell for {time}ms"
    ],
    gcodeSpindle: [
        "M3 S{speed} ; spindle on at {spindle} rpm"
    ],
    gcodeChange: [
        "M05 ; spindle off",
        "M6 T{tool} ; change tool to '{tool_name}'",
        "G37; get tool offset with ETS"
    ],
    gcodeFExt: "nc",
    gcodeSpace: true,
    gcodeStrip: false,
    deviceName: "Tormach.24R",
    useLaser: false
}))
.then(eng => eng.slice())
.then(eng => eng.prepare())
.then(eng => eng.export())
.then(display_gcode);
})*/

/*ROUGH AND OUTLINE WORKING PROPERLY 4.6

new Engine()
.setListener(display_message)
.load("https://raw.githubusercontent.com/alzatin/A-Test-project-6/refs/heads/main/A-Test-project-6-STL.stl")
// should to call widget.setTopZ here ideally
.then(eng => eng.setMode("CAM"))
.then(eng => eng.setStock({
     x: 3,
      y: 3,
      z: 0.1,
}))
.then(eng => eng.moveTo(50, 0, 0))
.then(eng=> eng.setTools([{
    id: 1000,
    number: 1,
    type: "endmill",
    name: "end 1/4",
    metric: false,
    shaft_diam: 0.25,
    shaft_len: 1,
    flute_diam: 0.25,
    flute_len: 2,
    taper_tip: 0,
    order: 5
}]))
.then(eng => eng.setProcess({
    camEaseAngle:40,
    camEaseDown:true,
    camOffsetStock: true,
    camZAnchor: "bottom",
    camDepthFirst : true,
    camZThru: 1.524,
    camZBottom:-25, // temp hack to get around setTopZ bug
    camToolInit: true,
    ops: [{
        type: "outline",
        tool: 1000,
        spindle: 13000,
        step: 0.4,
        steps: 1,
        down: 5.08,
        rate: 635,
        plunge: 51,
        dogbones: false,
        omitvoid: false,
        omitthru: false,
        outside: true,
        inside: false,
        wide: false,
        top: false,
        ov_topz: 0,
        ov_botz: 0,
        ov_conv: true
    },
    {
          type: "rough",
          tool: 1000,
          spindle: 13000,
          down: 5.08,
          step: .4,
          rate: 635,
          plunge: 1500,
          leave: 0,
          leavez: 0,
          all: false,
          voids: false,
          flats: true,
          inside: true,
          omitthru: true,
          ov_topz: 0,
          ov_botz: 0,
          ov_conv: false,
        },
    ]
}))
.then(eng => eng.setDevice({
    mode: "CAM",
    internal: 0,
    bedHeight: 2.5,
    bedWidth: 678.18,
    bedDepth: 1524,
    maxHeight: 150,
    originCenter: false,
    spindleMax: 24000,
    gcodePre: [
        "G20 ; set units to inches (required)",
        "G90 ; absolute position mode (required)"
    ],
    gcodePost: [
        "M05 ; spindle off",
        "M30 ; program end"
    ],
    gcodeDwell: [
        "G4 P{time} ; dwell for {time}ms"
    ],
    gcodeSpindle: [
        "M3 S{speed} ; spindle on at {spindle} rpm"
    ],
    gcodeChange: [
        "M05 ; spindle off",
        "M6 T{tool} ; change tool to '{tool_name}'",
        "G37; get tool offset with ETS"
    ],
    gcodeFExt: "nc",
    gcodeSpace: true,
    gcodeStrip: false,
    deviceName: "Tormach.24R",
    useLaser: false
}))
.then(eng => eng.slice())
.then(eng => eng.prepare())
.then(eng => eng.export())
.then(display_gcode);
*/

/*rough and outline working properly with passes and cutthrough 4.6 
new Engine()
.setListener(display_message)
.load("https://raw.githubusercontent.com/alzatin/A-Test-project-6/refs/heads/main/A-Test-project-6-STL.stl")
// should to call widget.setTopZ here ideally
.then(eng => eng.setMode("CAM"))
.then(eng => eng.setStock({
     x: 3,
      y: 3,
      z: 0.1,
}))
.then(eng => eng.moveTo(50, 0, 0))
.then(eng=> eng.setTools([{
    id: 1000,
    number: 1,
    type: "endmill",
    name: "end 1/4",
    metric: false,
    shaft_diam: 0.25,
    shaft_len: 1,
    flute_diam: 0.25,
    flute_len: 2,
    taper_tip: 0,
    order: 5
}]))
.then((eng) => {
    const CUT_THROUGH = 1; // Default cut-through thickness if not provided
    const passes = 4;
    const speed = 1500;
    
    const bounds = eng.widget.getBoundingBox();
    const z = bounds.max.z - bounds.min.z;
    const zBottom = z; // ensure cut through stock bottom

    // camCutthrough by pass for 1 pass, sets down to large value to avoid cutthrough extra pass/ extra pass is added for multi pass
    const down = passes > 1 ? (zBottom + CUT_THROUGH) / passes : 10000;
    // -1 to account for topZ -1 hack
    const camZBottom = -zBottom - CUT_THROUGH - 1;
    // single pass needs a cutthrough to generate correctly
    const camZThru = passes <= 1 ? 0.01 : CUT_THROUGH;
    const roughingStepOver = 0.6;
    
    
    return eng.setProcess({
    camEaseAngle:40,
    camEaseDown:true,
    camOffsetStock: true,
    camZAnchor: "bottom",
    camDepthFirst : true,
    camZThru: 1.524,
    camZBottom:camZBottom, // temp hack to get around setTopZ bug
    camToolInit: true,
    ops: [{
        type: "outline",
        tool: 1000,
        spindle: 13000,
        step: 0.4,
        steps: 1,
        down: down,
        rate: 635,
        plunge: 51,
        dogbones: false,
        omitvoid: false,
        omitthru: false,
        outside: true,
        inside: false,
        wide: false,
        top: false,
        ov_topz: 0,
        ov_botz: 0,
        ov_conv: true
    },
    {
          type: "rough",
          tool: 1000,
          spindle: 13000,
          down: down,
          step: .4,
          rate: 635,
          plunge: 1500,
          leave: 0,
          leavez: 0,
          all: false,
          voids: false,
          flats: true,
          inside: true,
          omitthru: true,
          ov_topz: 0,
          ov_botz: 0,
          ov_conv: false,
        },
    ]
})})
.then(eng => eng.setDevice({
    mode: "CAM",
    internal: 0,
    bedHeight: 2.5,
    bedWidth: 678.18,
    bedDepth: 1524,
    maxHeight: 150,
    originCenter: false,
    spindleMax: 24000,
    gcodePre: [
        "G20 ; set units to inches (required)",
        "G90 ; absolute position mode (required)"
    ],
    gcodePost: [
        "M05 ; spindle off",
        "M30 ; program end"
    ],
    gcodeDwell: [
        "G4 P{time} ; dwell for {time}ms"
    ],
    gcodeSpindle: [
        "M3 S{speed} ; spindle on at {spindle} rpm"
    ],
    gcodeChange: [
        "M05 ; spindle off",
        "M6 T{tool} ; change tool to '{tool_name}'",
        "G37; get tool offset with ETS"
    ],
    gcodeFExt: "nc",
    gcodeSpace: true,
    gcodeStrip: false,
    deviceName: "Tormach.24R",
    useLaser: false
}))
.then(eng => eng.slice())
.then(eng => eng.prepare())
.then(eng => eng.export())
.then(display_gcode); */

/*WORKING WITH ALL OUR PARAMS 4.6.  01/22/26 in dev server 

    const projectUnits = "MM";
    const isMetric = projectUnits === "MM";
    const toolSize = 6.35;
    const CUT_THROUGH = 0; // Default cut-through thickness if not provided
    const passes = 2;
    const speed = 1500;
    const plunge = 635;
    

new Engine()
.setListener(display_message)
.load("https://raw.githubusercontent.com/alzatin/A-Test-project-6/refs/heads/main/A-Test-project-6-STL.stl")
// should to call widget.setTopZ here ideally
.then(eng => eng.setMode("CAM"))
.then(eng => eng.setStock({
     x: 3,
      y: 3,
      z: 0.1,
}))
.then(eng => eng.moveTo(50, 0, 0))
.then((eng) =>{
    return eng.setTools([ {
          id: 1000,
          number: 1,
          type: "endmill",
          name: "endmill",
          metric: isMetric,
          shaft_diam: toolSize,
          shaft_len: 1,
          flute_diam: toolSize,
          flute_len: 2,
          taper_tip: 0,
          order: 5,
        }])})
.then((eng) => {
    const bounds = eng.widget.getBoundingBox();
    const z = bounds.max.z - bounds.min.z;
    const zBottom = z; // ensure cut through stock bottom
    
    const down = (zBottom + CUT_THROUGH) / passes;
    const camZBottom = -zBottom - CUT_THROUGH ;
    const roughingStepOver = .6;
    console.log(down)
    
    return eng.setProcess({
    camEaseAngle:40,
    camEaseDown:true,
    camOffsetStock: true,
    camZAnchor: "bottom",
    camDepthFirst : true,
    camZThru: CUT_THROUGH,
    camZBottom:camZBottom, // temp hack to get around setTopZ bug
    camToolInit: true,
    ops: [{
        type: "outline",
        tool: 1000,
        spindle: 13000,
        step: roughingStepOver,
        steps: 1,
        down: down,
        rate: speed,
        plunge: plunge,
        dogbones: false,
        omitvoid: false,
        omitthru: false,
        outside: true,
        inside: false,
        wide: false,
        top: false,
        ov_topz: 0,
        ov_botz: 0,
        ov_conv: true
    },
    {
          type: "rough",
          tool: 1000,
          spindle: 13000,
          down: down,
          step: roughingStepOver,
          rate: speed,
          plunge: plunge,
          leave: 0,
          leavez: 0,
          all: false,
          voids: false,
          flats: true,
          inside: true,
          omitthru: true,
          ov_topz: 0,
          ov_botz: 0,
          ov_conv: false,
        },
    ]
})})
.then((eng) => {
    const unitsCommand =
        projectUnits === "MM"
          ? "G21 ; set units to MM (required)"
          : "G20 ; set units to inches (required)";

    return eng.setDevice({
    mode: "CAM",
    internal: 0,
    bedHeight: 2.5,
    bedWidth: 678.18,
    bedDepth: 1524,
    maxHeight: 150,
    originCenter: false,
    spindleMax: 24000,
    gcodePre: [
        unitsCommand,
        "G90 ; absolute position mode (required)"
    ],
    gcodePost: [
        "M05 ; spindle off",
        "M30 ; program end"
    ],
    gcodeDwell: [
        "G4 P{time} ; dwell for {time}ms"
    ],
    gcodeSpindle: [
        "M3 S{speed} ; spindle on at {spindle} rpm"
    ],
    gcodeChange: [
        "M05 ; spindle off",
        "M6 T{tool} ; change tool to '{tool_name}'",
        "G37; get tool offset with ETS"
    ],
    gcodeFExt: "nc",
    gcodeSpace: true,
    gcodeStrip: false,
    deviceName: "Tormach.24R",
    useLaser: false
})})
.then(eng => eng.slice())
.then(eng => eng.prepare())
.then(eng => eng.export())
.then(display_gcode); */
