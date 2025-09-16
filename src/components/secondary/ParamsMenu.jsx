import React from "react";
import { useEffect, useState, useMemo } from "react";
import { SimpleControlPanel } from "./SimpleControlPanel";
import { useControls } from "../../hooks/useControls";
import GlobalVariables from "../../js/globalvariables";
import { useAppState } from "../../contexts/index.js";

export default function ParamsMenu({
  position,
  id,
  contentCollapsed,
  setContentCollapsed,
  panelRef,
}) {
  const { activeAtom } = useAppState();
  const unusedDefault = {
    position: {
      type: "number",
      value: 5,
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
      value: "#733f70ff",
      label: "Color",
      order: 3,
    },
    speed: {
      type: "range",
      value: 30,
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
  const [inputChanged, setInputChanged] = useState("");
  const handleAddControl = (type, value, label) => {
    const newId = `custom_${Date.now()}`;
    registerControl(newId, {
      type: type,
      value: value,
      label: label,
      order: 99,
    });
  };

  const handleSetValue = (key, value) => {
    setControlValue(key, value);
  };

  let inputParams = {};

  if (activeAtom) {
    inputParams = activeAtom.createInputParams(setInputChanged);
    //inputParams = unusedDefault;
  }

  const inputParamsConfig = useMemo(() => {
    return { ...inputParams };
  }, [inputParams]);

  const [
    values,
    setControlValue,
    { controls, registerControl, removeControl },
  ] = useControls(inputParamsConfig, [activeAtom, inputChanged]);

  const screenHeight = window.innerHeight;

  return (
    <div>
      <SimpleControlPanel
        controls={controls}
        id={id}
        position={position || { top: screenHeight / 2 - 10, left: 55 }}
        title={activeAtom?.name || "Controls"}
        minWidth={280}
        maxHeight={screenHeight / 2}
        contentCollapsed={contentCollapsed}
        setContentCollapsed={setContentCollapsed}
        ref={panelRef}
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
