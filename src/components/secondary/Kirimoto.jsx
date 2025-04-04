import React, { useState, useEffect, useMemo } from "react";

const KiriMotoIntegration = ({ activeAtom }) => {
  const [kiriEngine, setKiriEngine] = useState(null);
  console.log(activeAtom);

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

  return (
    <div style={{ display: "none" }}>
      <h1>Kiri:Moto Integration</h1>
      <button
        id="kirimoto-button"
        onClick={() => activeAtom.runKirimoto(kiriEngine)}
      >
        Run Kiri:Moto
      </button>
    </div>
  );
};

export default KiriMotoIntegration;
