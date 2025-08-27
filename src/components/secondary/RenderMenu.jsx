import React from "react";
import { useEffect, useState, useMemo } from "react";
import { SimpleControlPanel } from "./SimpleControlPanel";
import { useControls } from "../../hooks/useControls";
import GlobalVariables from "../../js/globalvariables";

export default function ParamsMenu({ activeAtom }) {
  const [inputChanged, setInputChanged] = useState("");
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
  ] = useControls(inputParamsConfig, [inputChanged]);

  const screenHeight = window.innerHeight;

  return (
    <div>
      <SimpleControlPanel
        controls={controls}
        id="atom-render-panel"
        position={{ top: screenHeight / 2 - 30, left: 10 }}
        title={"Render Controls" || "Controls"}
        initialCollapsed={true}
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
