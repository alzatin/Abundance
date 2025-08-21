import React from "react";
import { useEffect } from "react";
import { SimpleControlPanel } from "./SimpleControlPanel";
import { useControls } from "../../hooks/useControls";

export default function ParamsMenu(activeAtom) {
  let initialControls = {
    position: {
      type: "number",
      value: 0,
      min: -100,
      max: 100,
      step: 1,
      label: "Position",
      order: 1,
    },
    enabled: {
      type: "boolean",
      value: true,
      label: "Enabled",
      order: 2,
    },
    color: {
      type: "color",
      value: "#3b82f6",
      label: "Color",
      order: 3,
    },
    speed: {
      type: "range",
      value: 50,
      min: 0,
      max: 100,
      step: 1,
      label: "Speed",
      order: 4,
    },
    name: {
      type: "string",
      value: "Default Name",
      label: "Name",
      order: 5,
    },
    mode: {
      type: "select",
      value: "auto",
      options: ["auto", "manual", "off"],
      label: "Mode",
      order: 6,
    },
  };

  const [values, setControlValue, { controls, registerControl }] =
    useControls(initialControls);

  useEffect(() => {
    console.log(activeAtom);
    registerControl(activeAtom.uniqueID, {
      type: "number",
      value: 5,
      min: 0,
      max: 10,
      label: activeAtom.uniqueID,
    });
  }, [activeAtom]); // Only runs once (or if registerControl ref changes)

  return (
    <div>
      <h1>Demo: SimpleControlPanel (with lifted state)</h1>
      <SimpleControlPanel
        controls={controls}
        id="demo-panel"
        position={{ top: 32, left: 32 }}
      />
      <div style={{ marginTop: 40 }}>
        <strong>Current Values:</strong>
        <pre>{JSON.stringify(values, null, 2)}</pre>
      </div>
    </div>
  );
}
