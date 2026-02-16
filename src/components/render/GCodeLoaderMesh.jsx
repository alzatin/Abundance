import React, { useState, useEffect } from "react";
import { useRendering } from "../../contexts/RenderingContext.jsx";

import { GCodeLoader } from "three/addons/loaders/GCodeLoader.js";

export default function GCodeLoaderMesh({ authorizedUserOcto }) {
  const { gcodeString } = useRendering(); // Access mesh state from context
  const [object, setObject] = useState(null);

  useEffect(() => {
    const parseGcodeString = async () => {
      if (!gcodeString) {
        console.warn("No G-code string available for parsing.");
        return;
      }

      try {
        const loader = new GCodeLoader();
        const parseGcodeString = loader.parse(gcodeString);
        console.log("G-code loaded for visualization:", parseGcodeString);
        setObject(parseGcodeString);
      } catch (err) {
        console.error("Error parsing G-code:", err);
      }
    };
    parseGcodeString();
  }, [gcodeString]);

  if (object) {
    object.rotation.x = Math.PI * 2;
  }

  return object ? <primitive object={object} /> : null;
}
