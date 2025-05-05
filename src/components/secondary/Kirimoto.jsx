import React, { useState, useEffect, useMemo } from "react";
import GlobalVariables from "../../js/globalvariables.js";
import { saveAs } from "file-saver";

const KiriMotoIntegration = ({ activeAtom }) => {
  const [kiriEngine, setKiriEngine] = useState(null);
  const [kiriBlob, setKiriBlob] = useState(null);
  const [blobPath, setBlobPath] = useState(null);
  const [stlUrl, setStlUrl] = useState(null);

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

  const runKirimoto = (kiriEngine) => {
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
        if (message.type === "progress") {
          console.log(`Progress: ${message.progress * 100}%`);
        }
      })
      .load(stlUrl) // Use the temporary file URL here // or stlUrl
      .then((eng) => {
        console.log("STL file loaded");
        console.log(eng);
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
        return eng.setMode("FDM");
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
        return eng.slice();
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
        const blob = new Blob([gcode], { type: "text/plain" });
        const fileName = "output.gcode";
        saveAs(blob, fileName); // Use FileSaver.js to save the GCode file
      })
      .catch((error) => {
        console.error("Kiri:Moto Error:", error);
      })
      .finally(() => {
        // Clean up the temporary URL
        URL.revokeObjectURL(stlUrl);
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
