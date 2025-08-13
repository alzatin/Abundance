import { Engine } from "./engine.js";
import GlobalVariables from "./src/js/globalvariables.js";

const display_message = (message) => {
  console.log(message);
};

const kiriEngine = new Engine({ workURL: "./worker.js" });
console.log(kiriEngine);

const generateGcode = (
  stlUrl,
  centerPos,
  toolSize,
  passes,
  speed,
  extra,
  gcodeCallback,
  progressCallback
) => {
  // === COMPREHENSIVE DEBUG LOGGING START ===
  console.log("🚀 GCODE GENERATION STARTED");
  console.log("📥 INPUT PARAMETERS:");
  console.log("  - stlUrl:", stlUrl ? "✓ Available" : "❌ Missing");
  console.log("  - centerPos:", centerPos);
  console.log("  - toolSize:", toolSize);
  console.log("  - passes:", passes, "(TYPE:", typeof passes, ")");
  console.log("  - speed:", speed);
  console.log("  - extra:", extra, "(TYPE:", typeof extra, ")");
  console.log("  - gcodeCallback:", gcodeCallback ? "✓ Available" : "❌ Missing");
  console.log("  - progressCallback:", progressCallback ? "✓ Available" : "❌ Missing");
  console.log("=".repeat(60));
  // === COMPREHENSIVE DEBUG LOGGING END ===

  if (!stlUrl) {
    console.error("STL URL is not available.");
    return;
  }

  // Track slicing progress with a timer
  let slicingTimer = null;
  let slicingStartTime = null;
  let slicingProgressStart = 0.6;
  let slicingProgressEnd = 0.8;

  const startSlicingProgress = () => {
    slicingStartTime = Date.now();
    let currentProgress = slicingProgressStart;

    slicingTimer = setInterval(() => {
      const elapsed = Date.now() - slicingStartTime;
      // Gradually increase progress over time, with diminishing returns
      // This creates a more realistic progress feel during slicing
      const timeBasedProgress = Math.min(
        0.18,
        0.18 * (1 - Math.exp(-elapsed / 10000))
      ); // Exponential approach to 0.18 (80%-60%)
      currentProgress = slicingProgressStart + timeBasedProgress;

      if (progressCallback && currentProgress < slicingProgressEnd) {
        progressCallback(currentProgress);
      }
    }, 500); // Update every 500ms during slicing
  };

  const stopSlicingProgress = () => {
    if (slicingTimer) {
      clearInterval(slicingTimer);
      slicingTimer = null;
    }
  };
  kiriEngine
    .setListener((message) => {
      console.log("🎧 KIRI:MOTO MESSAGE:", message);
      
      // Check if message contains slicing progress information
      if (message && typeof message === "object") {
        if (message.progress !== undefined && slicingStartTime) {
          // If Kiri:Moto provides progress during slicing, use it
          const slicingProgress =
            slicingProgressStart +
            (slicingProgressEnd - slicingProgressStart) * message.progress;
          if (progressCallback) progressCallback(slicingProgress);
        }
        
        // Log any interesting message properties
        if (message.type) console.log("  - Message type:", message.type);
        if (message.data) console.log("  - Message data:", message.data);
        if (message.error) console.log("  - Message error:", message.error);
      }
    })
    .load(stlUrl)
    .then((eng) => {
      if (progressCallback) progressCallback(0.1); // 10% - STL loaded
      return eng.moveTo(centerPos[0], centerPos[1], 0); //Move the model to line up with where the parts were before
    })
    .then((eng) => {
      if (progressCallback) progressCallback(0.15); // 15% - Model moved
      return eng.setMode("CAM");
    })
    .then((eng) => {
      const bounds = eng.widget.getBoundingBox();

      if (progressCallback) progressCallback(0.2); // 20% - Mode set
      const x = bounds.max.x - bounds.min.x;
      const y = bounds.max.y - bounds.min.y;
      const z = bounds.max.z - bounds.min.z;
      eng.setStock({
        x: x + 10,
        y: y + 10,
        z: z,
        center: {
          x: x / 2,
          y: y / 2,
          z: z,
        },
      });
      return eng;
    })
    .then((eng) =>
      eng.setTools([
        {
          id: 1000,
          number: 1,
          type: "endmill",
          name: "end 1/4",
          metric: GlobalVariables.topLevelMolecule.unitsKey === "MM",
          shaft_diam: toolSize,
          shaft_len: 1,
          flute_diam: toolSize,
          flute_len: 2,
          taper_tip: 0,
        },
      ])
    )
    .then((eng) => {
      if (progressCallback) progressCallback(0.3); // 30% - Tools set
      const bounds = eng.widget.getBoundingBox();
      const z = bounds.max.z - bounds.min.z;
      
      // === BOUNDS AND CALCULATION LOGGING ===
      console.log("📏 GEOMETRY ANALYSIS:");
      console.log("  - bounds.min:", bounds.min);
      console.log("  - bounds.max:", bounds.max);
      console.log("  - calculated z (height):", z);
      console.log("  - extra cut depth:", extra);
      console.log("  - total depth (z + extra):", (z + extra));
      console.log("  - requested passes:", passes);
      console.log("=".repeat(60));
      
      // === CALCULATED VALUES FOR KIRI:MOTO ===
      console.log("🧮 CALCULATED VALUES:");
      console.log("  STRATEGY: Use single operation with steps parameter to control passes");
      console.log("  - Total depth:", (z + extra));
      console.log("  - Passes requested:", passes);
      console.log("  - Step per pass:", (z + extra) / passes);
      console.log("  OPERATION DEFINITION:");
      console.log("    - steps:", passes, "(number of passes)");
      console.log("    - step:", (z + extra) / passes, "(depth per pass)");
      console.log("    - down:", (z + extra), "(total depth)");
      console.log("  GLOBAL SETTINGS:");
      console.log("    - camOutlineOverCount: 1 (no global multiplier)");
      console.log("    - camRoughOn: false (no roughing)");
      console.log("    - camContourXOn/YOn: false (no contour operations)");
      console.log("=".repeat(60));
      
      eng.setProcess({
        processName: "default",
        // Disable ALL automatic operation generation
        camRoughOn: false,         // No roughing operations
        camContourXOn: false,      // No X contour operations
        camContourYOn: false,      // No Y contour operations
        camDrillingOn: false,      // No drilling operations
        camDepthFirst: false,      // No depth-first processing
        
        // Basic tool settings
        camOutlineTool: 1000,
        camOutlineSpindle: 1000,
        camOutlineSpeed: speed,
        camOutlinePlunge: 250,
        camOutlineOver: 0.4,
        
        // CRITICAL: Disable global outline multiplier
        camOutlineOverCount: 1,    // Only process operations in ops array, don't multiply
        camOutlineDown: 1,         // Minimal global setting, real control is in ops array
        camOutlineTop: true,
        camOutlineDogbone: true,
        camOutlineOmitThru: false,
        camOutlineOmitVoid: false,
        camOutlineOut: true,
        camOutlineIn: false,
        camOutlineWide: false,
        camOutlineOn: true,        // Enable outline processing
        
        // Minimal required settings
        camOriginTop: true,
        camZAnchor: "middle",
        camZOffset: 0,
        camZTop: 0,
        camZBottom: -1 * extra,
        camZClearance: 1,
        camZThru: 0,
        camFastFeed: 6000,
        camFastFeedZ: 300,
        camOriginCenter: false,
        camOriginOffX: 0,
        camOriginOffY: 0,
        camOriginOffZ: 0,
        camToolInit: true,
        
        // Operation definitions - Create one operation per pass for explicit control
        ops: (() => {
          const operations = [];
          const totalDepth = z + extra;
          const depthPerPass = totalDepth / passes;
          
          console.log("🎯 CREATING EXPLICIT OPERATIONS FOR PASSES:");
          console.log("  - Total depth:", totalDepth);
          console.log("  - Depth per pass:", depthPerPass);
          console.log("  - Number of passes:", passes);
          
          // Create one operation for each pass
          for (let i = 1; i <= passes; i++) {
            const currentDepth = depthPerPass * i;
            console.log(`  - Pass ${i}: cutting to depth -${currentDepth.toFixed(3)}`);
            
            operations.push({
              type: "outline",
              tool: 1000,
              spindle: 1000,
              step: depthPerPass,           // Depth for this specific pass
              steps: 1,                     // Single step per operation
              down: currentDepth,           // Depth for this pass
              rate: speed,
              plunge: 250,
              dogbones: true,
              omitvoid: false,
              omitthru: false,
              outside: true,
              inside: false,
              wide: false,
              top: true,
              ov_topz: 0,
              ov_botz: 0,
              ov_conv: false,
            });
          }
          
          // Add separator
          operations.push({
            type: "|",
          });
          
          console.log("  - Total operations created:", operations.length - 1); // -1 for separator
          console.log("=".repeat(60));
          
          return operations;
        })(),
        op2: [],
      });
      
      console.log("⚙️ PROCESS CONFIGURATION SET SUCCESSFULLY");
      console.log("=".repeat(60));
      
      return eng;
    })
    .then((eng) =>
      eng.setDevice({
        mode: "CAM",
        internal: 0,
        bedHeight: 2.5,
        bedWidth: 10000,
        bedDepth: 10000,
        maxHeight: 150,
        originCenter: false,
        spindleMax: 0,
        gcodePre: [
          "G21 ; set units to MM (required)",
          "G90 ; absolute position mode (required)",
        ],
        gcodePost: ["M30 ; program end"],
        gcodeDwell: ["G4 P{time} ; dwell for {time}ms"],
        gcodeSpindle: [],
        gcodeChange: ["M6 T{tool} ; change tool to '{tool_name}'"],
        gcodeFExt: "nc",
        gcodeSpace: true,
        gcodeStrip: true,
        new: false,
        deviceName: "Any.Generic.Grbl",
        imageURL: "",
        useLaser: false,
      })
    )
    .then((eng) => {
      if (progressCallback) progressCallback(0.5); // 50% - Process set
      startSlicingProgress();
      return eng;
    })
    .then((eng) => eng.slice())
    .then((eng) => {
      if (progressCallback) progressCallback(0.8); // 80% - Slicing done
      stopSlicingProgress(); // Stop the slicing progress timer
      
      console.log("🔧 SLICING COMPLETED - ANALYZING RESULTS");
      
      // Try to inspect what Kiri:Moto generated
      try {
        if (eng.widget && eng.widget.slices) {
          console.log("  - Number of slices generated:", eng.widget.slices.length);
        }
        if (eng.print && eng.print.output) {
          console.log("  - Print output available:", !!eng.print.output);
        }
        // Try to access internal state
        console.log("  - Widget state:", eng.widget ? "Available" : "Not available");
        console.log("  - Print state:", eng.print ? "Available" : "Not available");
      } catch (e) {
        console.log("  - Could not inspect Kiri:Moto internal state:", e.message);
      }
      console.log("=".repeat(60));
      
      return eng;
    })
    .then((eng) => eng.prepare())
    .then((eng) => {
      if (progressCallback) progressCallback(0.9); // 90% - Preparation done
      return eng;
    })
    .then((eng) => eng.export())
    .then((gcode) => {
      console.log("📄 G-CODE ANALYSIS:");
      console.log("  - Total G-code length:", gcode ? gcode.length : "No G-code generated");
      
      if (gcode) {
        // Analyze the G-code for movement patterns
        const lines = gcode.split('\n');
        const zMovements = lines.filter(line => line.includes('Z') && (line.includes('G1') || line.includes('G0')));
        const uniqueZValues = new Set();
        
        zMovements.forEach(line => {
          const zMatch = line.match(/Z([-\d\.]+)/);
          if (zMatch) {
            uniqueZValues.add(parseFloat(zMatch[1]));
          }
        });
        
        const sortedZValues = Array.from(uniqueZValues).sort((a, b) => b - a); // Sort descending
        
        console.log("  - Total lines:", lines.length);
        console.log("  - Z-movement lines:", zMovements.length);
        console.log("  - Unique Z depths:", sortedZValues.length);
        console.log("  - Z depths found:", sortedZValues);
        
        // Count passes by looking for cutting operations at different depths
        const cuttingDepths = sortedZValues.filter(z => z < 0); // Negative Z values are cuts
        console.log("  - Cutting depths (negative Z):", cuttingDepths);
        console.log("  - Estimated number of cutting passes:", cuttingDepths.length);
        
        // Look for specific patterns
        const toolDownMovements = lines.filter(line => 
          line.includes('Z') && line.includes('G1') && line.match(/Z-[\d\.]+/)
        );
        console.log("  - Tool down movements (G1 Z-*):", toolDownMovements.length);
        
        if (toolDownMovements.length > 0) {
          console.log("  - First few tool down movements:");
          toolDownMovements.slice(0, 5).forEach((line, i) => {
            console.log(`    ${i + 1}: ${line.trim()}`);
          });
        }
      }
      console.log("=".repeat(60));
      
      gcodeCallback(gcode); // Only call the callback, don't download
      if (progressCallback) progressCallback(1.0); // 100% - Export complete
    })
    .catch((error) => {
      stopSlicingProgress(); // Ensure timer is cleaned up on error
      console.error("Kiri:Moto Error:", error);
    })
    .finally(() => {
      // Clean up the temporary URL after generation
      setTimeout(() => URL.revokeObjectURL(stlUrl), 1000);
    });
};

Object.assign(window, {
  generateGcode,
});
