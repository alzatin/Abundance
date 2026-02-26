import React, { useState, useEffect, use } from "react";
import { useRendering } from "../../contexts/RenderingContext.jsx";
import * as THREE from "three";

export default function NonReplicadMesh({}) {
  const { nonReplicadGeometry } = useRendering();
  const [object, setObject] = useState([]);
  const defaultMaterial = new THREE.MeshBasicMaterial({
    color: "lightgray",
    side: THREE.DoubleSide,
  });
  console.log("rendering NonReplicadMesh with geometry:", nonReplicadGeometry);
  useEffect(() => {
    if (nonReplicadGeometry && nonReplicadGeometry.geometry?.length > 0) {
      setObject(nonReplicadGeometry.geometry);
    } else {
      setObject([]);
    }
  }, [nonReplicadGeometry]);

  return (
    <group>
      {object?.map((geom, index) => (
        <mesh
          key={index}
          material={nonReplicadGeometry?.material || defaultMaterial}
        >
          <primitive object={geom} />
        </mesh>
      ))}
    </group>
  );
}
