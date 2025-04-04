import React, { useState, useEffect, useMemo } from "react";

const KiriMotoIntegration = () => {
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

  const runKiriMoto = () => {
    if (!kiriEngine) {
      console.error("Kiri:Moto engine is not initialized yet.");
      return;
    }

    kiriEngine
      .setListener((message) => console.log("Kiri:Moto Message:", message))
      .load("/obj/cube.stl") // Replace with your STL file path
      .then((eng) =>
        eng.setProcess({
          sliceShells: 1,
          sliceFillSparse: 0.25,
          sliceTopLayers: 2,
          sliceBottomLayers: 2,
        })
      )
      .then((eng) =>
        eng.setDevice({
          gcodePre: ["M82", "M104 S220"],
          gcodePost: ["M107"],
        })
      )
      .then((eng) => eng.slice())
      .then((eng) => eng.prepare())
      .then((eng) => eng.export())
      .then((gcode) => console.log("Generated GCode:", gcode))
      .catch((error) => console.error("Kiri:Moto Error:", error));
  };

  return (
    <div style={{ display: "none" }}>
      <h1>Kiri:Moto Integration</h1>
      <button id="kirimoto-button" onClick={runKiriMoto}>
        Run Kiri:Moto
      </button>
    </div>
  );
};

export default KiriMotoIntegration;
