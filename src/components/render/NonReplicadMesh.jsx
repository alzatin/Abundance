import React, { useState, useEffect, use } from "react";
import { useRendering } from "../../contexts/RenderingContext.jsx";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Group, ShapeGeometry } from "three";
import { useLayoutEffect } from "react";

import { useThree } from "@react-three/fiber";
import { invalidate } from "@react-three/fiber";

//Loading a local version of the three gcode loader for color and other mods

export default function NonReplicadMesh({}) {
  const { nonReplicadGeometry } = useRendering();
  const [object, setObject] = useState([]);

  console.log("rendering NonReplicadMesh with geometry:", nonReplicadGeometry);
  useEffect(() => {
    if (nonReplicadGeometry && nonReplicadGeometry.length > 0) {
      setObject(nonReplicadGeometry[0]);
    } else {
      setObject([]);
    }
  }, [nonReplicadGeometry]);

  return (
    <mesh>
      <primitive object={object} />
      <meshBasicMaterial color="royalblue" />
    </mesh>
  );
}
