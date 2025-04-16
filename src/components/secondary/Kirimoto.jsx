import React, { useState, useEffect, useMemo } from "react";

const KiriMotoIntegration = ({ activeAtom }) => {
  const [kiriEngine, setKiriEngine] = useState(null);

  useEffect(() => {
    // Dynamically load the Kiri:Moto script
    const script = document.createElement("script");
    script.src = "https://grid.space/code/engine.js"; // Kiri:Moto CDN
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

  const runKirimoto = (kiriEngine) => {
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
      .load("../../Simple_cube.stl") // Replace with your STL file path
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
