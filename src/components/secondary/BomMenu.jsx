import React from "react";
import { useEffect, useState, useMemo } from "react";
import { SimpleControlPanel } from "./SimpleControlPanel";
import { useControls } from "../../hooks/useControls";
import GlobalVariables from "../../js/globalvariables";

export default function BomMenu({ activeAtom, id }) {
  const [inputChanged, setInputChanged] = useState("");
  let compiledBom = {};

  if (activeAtom !== null && activeAtom.atomType == "Molecule") {
    compiledBom = activeAtom.createLevaBom();
  }
  const [
    values,
    setControlValue,
    { controls, registerControl, removeControl },
  ] = useControls(compiledBom, [activeAtom]);

  const screenHeight = window.innerHeight;

  // Dollar sign icon, same size and style as SettingsIcon
  const DollarIcon = ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle
        cx="10"
        cy="10"
        r="8"
        stroke="var(--control-text-muted)"
        strokeWidth="2"
      />
      <path
        d="M10 5v10"
        stroke="var(--control-text-muted)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12.5 7.5c0-1-1-1.5-2.5-1.5s-2.5.5-2.5 1.5c0 1 1 1.5 2.5 1.5s2.5.5 2.5 1.5c0 1-1 1.5-2.5 1.5s-2.5-.5-2.5-1.5"
        stroke="var(--control-text-muted)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );

  return (
    <div>
      <SimpleControlPanel
        controls={controls}
        id={id}
        position={{ top: screenHeight / 2 + 35, left: 10 }}
        title={"Bill of Materials"}
        initialCollapsed={true}
        minWidth={280}
        collapsedIcon={DollarIcon}
        collapsedOffset={[45, -45]} // shifts expanded panel by 45px right, 45px down
      />
    </div>
  );
}
