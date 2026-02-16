import React, { useState, useEffect } from "react";
import { useRendering } from "../../contexts/RenderingContext.jsx";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Group } from "three";
//Loading a local version of the three gcode loader for color and other mods
import { GCodeLoader } from "../../js/GCodeAbundanceLoader.js";

export default function GCodeLoaderMesh({ authorizedUserOcto }) {
  const { gcodeParts } = useRendering(); // Access mesh state from context
  const [object, setObject] = useState(null);

  useEffect(() => {
    const parseGcodeString = async () => {
      if (!gcodeParts) {
        console.warn("No G-code string available for parsing.");
        setObject(null);
        return;
      }

      try {
        const loader = new GCodeLoader();
        const parsedObjects = [];
        for (const part of gcodeParts) {
          const parseGcodeString = loader.parse(part);
          parsedObjects.push(parseGcodeString);
        }

        const allGcodeObjects = new Group();
        parsedObjects.forEach((obj) => {
          //obj.children[1].material.color.set(0x0000ff); // blue
          allGcodeObjects.add(obj);
        });
        setObject(allGcodeObjects);
      } catch (err) {
        console.error("Error parsing G-code:", err);
      }
    };
    parseGcodeString();
  }, [gcodeParts]);
  if (object) {
    object.rotation.x = Math.PI / 2; // Rotate to lay flat on XY plane
  }
  /*const myMesh = React.useRef();
  useFrame(({ clock }) => {
    myMesh.current.rotation.x = clock.elapsedTime;
  });
  return (
    <mesh ref={myMesh}>
      <boxGeometry />
      <meshBasicMaterial color="royalblue" />
    </mesh>
  );*/
  return object ? <primitive object={object} /> : null;
}
