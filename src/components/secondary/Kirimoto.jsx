import React, { useState, useEffect, useMemo } from "react";
import GlobalVariables from "../../js/globalvariables.js";
import { saveAs } from "file-saver";

const KiriMotoIntegration = ({ activeAtom }) => {
  const [kiriEngine, setKiriEngine] = useState(null);
  const [stlUrl, setStlUrl] = useState(null);

  useEffect(() => {
    // Dynamically load the Kiri:Moto script
    const script = document.createElement("script");
    script.src = "https://grid.space/code/engine.js"; // this comes from the grid.space Kiri:Moto API -- https://docs.grid.space/projects/kiri-moto/apis
    script.async = true;
    script.onload = () => {
      console.log("Kiri:Moto script loading");
      if (window.kiri) {
        console.log("Kiri:Moto API loaded");
        const engine = window.kiri.newEngine();
        setKiriEngine(engine);
      }
    };

    script.onerror = () => {
      console.error("Failed to load Kiri:Moto script");
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup script when component unmounts
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    const handleBlobUpdate = (event) => {
      const { uniqueID, blob } = event.detail;
      console.log("Blob updated:", uniqueID, blob);

      // Convert blob to a temporary file URL
      const url = URL.createObjectURL(blob);
      setStlUrl(url);
    };

    window.addEventListener("kirimotoBlobUpdated", handleBlobUpdate);

    return () => {
      window.removeEventListener("kirimotoBlobUpdated", handleBlobUpdate);
    };
  }, []);

  const runKirimoto = () => {
    console.log("kiriEngine");
    console.log(kiriEngine);
    if (!kiriEngine) {
      console.error("Kiri:Moto engine is not initialized yet.");
      return;
    }

    if (!stlUrl) {
      console.error("STL URL is not available.");
      return;
    }

    kiriEngine
      .setListener((message) => {
        console.log("Kiri:Moto Message:", message);
      })
      .load(stlUrl)
      .then((eng) => eng.setMode("CAM"))
      .then((eng) =>
        eng.setStock({
          x: 110.00001525878906,
          y: 60,
          z: 60,
          center: {
            x: 0,
            y: 0,
            z: 12.5,
          },
        })
      )
      .then((eng) =>
        eng.setTools([
          {
            id: 1722394350168,
            number: 11,
            name: "0.3 mm",
            type: "endmill",
            shaft_diam: 0.3,
            shaft_len: 5,
            flute_diam: 0.3,
            flute_len: 5,
            taper_tip: 0,
            metric: true,
            order: 0,
          },
        ])
      )
      .then((eng) =>
        eng.setProcess({
          ops: [
            {
              type: "outline",
              tool: 1722394350168,
              spindle: 15000,
              step: 0.4,
              steps: 1,
              down: 1,
              rate: 2500,
              plunge: 150,
              dogbones: false,
              omitvoid: false,
              omitthru: false,
              outside: false,
              inside: false,
              wide: false,
              top: false,
            },
          ],
        })
      )
      .then((eng) =>
        eng.setDevice({
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
            "G90 ; absolute position mode (required)",
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
          imageURL: "",
          useLaser: false,
        })
      )
      .then((eng) => eng.slice())
      .then((eng) => eng.prepare())
      .then((eng) => eng.export())
      .then((gcode) => {
        console.log("GCode generated:", gcode);
        const blob = new Blob([gcode], { type: "text/plain" });
        const fileName = "output.gcode";
        saveAs(blob, fileName); // Use FileSaver.js to save the GCode file
      })
      .catch((error) => {
        console.error("Kiri:Moto Error:", error);
      })
      .finally(() => {
        // Clean up the temporary URL after the file is saved
        setTimeout(() => URL.revokeObjectURL(stlUrl), 1000);
      });
  };

  return (
    <div style={{ display: "none" }}>
      <h1>Kiri:Moto Integration</h1>
      <button id="kirimoto-button" onClick={() => runKirimoto(kiriEngine)}>
        Run Kiri:Moto
      </button>
    </div>
  );
};

export default KiriMotoIntegration;
