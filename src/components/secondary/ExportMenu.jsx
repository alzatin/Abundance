import React from "react";
import { useEffect, useState, useMemo } from "react";
import { SimpleControlPanel } from "./SimpleControlPanel";
import { useControls } from "../../hooks/useControls";
import GlobalVariables from "../../js/globalvariables";

export default function ExportMenu({
  activeAtom,
  position,
  contentCollapsed,
  setContentCollapsed,
}) {
  const [inputChanged, setInputChanged] = useState("");
  let exportParams = {};

  if (activeAtom !== null) {
    exportParams = activeAtom?.createExportMenuInputs();
  }

  const exportParamsConfig = useMemo(() => {
    return { ...exportParams };
  }, [exportParams]);
  const [
    values,
    setControlValue,
    { controls, registerControl, removeControl },
  ] = useControls(exportParamsConfig, [activeAtom]);

  // Export icon, same size and style as SettingsIcon
  const ExportIcon = ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle
        cx="10"
        cy="10"
        r="8"
        stroke="var(--control-text-muted)"
        strokeWidth="2"
      />
      <path
        d="M10 6v6"
        stroke="var(--control-text-muted)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <polyline
        points="7,11 10,14 13,11"
        fill="none"
        stroke="var(--control-text-muted)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <div>
      <SimpleControlPanel
        controls={controls}
        id="atom-render-panel"
        position={position}
        title={"Export"}
        initialCollapsed={true}
        minWidth={280}
        collapsedIcon={ExportIcon}
        collapsedOffset={[45, -45]} // shifts expanded panel by 45px right, 0px down
        contentCollapsed={contentCollapsed}
        setContentCollapsed={setContentCollapsed}
      />
    </div>
  );
}
