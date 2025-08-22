import React from "react";
import { useEffect } from "react";
import { SimpleControlPanel } from "./SimpleControlPanel";
import { useControls } from "../../hooks/useControls";
import on from "../../js/circular-menu/src/on";

export default function ParamsMenu({ activeAtom }) {
  const unusedDefault = {
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
      onChange: (value) => {
        console.log("Mode changed to:", value);
      },
    },
    buttonControl: {
      type: "button",
      label: "Click Me",
      order: 7,
      onClick: () => {
        handleAddControl("button", "New Control", "Custom Control");
      },
    },
  };
  const handleAddControl = (type, value, label) => {
    const newId = `custom_${Date.now()}`;
    registerControl(newId, {
      type: type,
      value: value,
      label: label,
      order: 99,
    });
  };

  const inputParams =
    activeAtom !== null
      ? activeAtom.createInputParams(activeAtom, handleAddControl)
      : {};

  const [values, setControlValue, { controls, registerControl }] = useControls(
    inputParams,
    [activeAtom]
  );
  return (
    <div>
      <SimpleControlPanel
        controls={controls}
        id="atom-inputs-panel"
        position={{ top: 32, left: 32 }}
        title={activeAtom?.name || "Controls"}
      />
      {/* <button onClick={handleAddControl} style={{ marginTop: 16 }}>
        Add Custom Control
      </button>
      <div style={{ marginTop: 40 }}>
        <strong>Current Values:</strong>
        <pre>{JSON.stringify(values, null, 2)}</pre>
      </div>*/}
    </div>
  );
}
