import React, { useState } from "react";
import { useControls } from "../../hooks/useControls";

// SVG icons (Settings, X, CaretDown)
const SettingsIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="8" stroke="#8ea9ff" strokeWidth="2" />
    <path
      d="M10 7v3l2 2"
      stroke="#8ea9ff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const XIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <line x1="6" y1="6" x2="14" y2="14" stroke="#8ea9ff" strokeWidth="2" />
    <line x1="14" y1="6" x2="6" y2="14" stroke="#8ea9ff" strokeWidth="2" />
  </svg>
);

const CaretDownIcon = ({ size = 12, collapsed }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    style={{
      transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)",
      transition: "transform 0.2s",
    }}
  >
    <polyline
      points="7 9 10 12 13 9"
      fill="none"
      stroke="#8ea9ff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// CSS variable-driven styles
const panelVars = {
  "--panel-background": "#232832",
  "--panel-foreground": "#e0e5ef",
  "--panel-border": "#272a31",
  "--panel-separator": "#31343b",
  "--control-background-hover": "#292e3b",
  "--control-text": "#e0e5ef",
  "--control-text-muted": "#8ea9ff",
  "--control-accent": "#3e7aff",
};

const panelStyle = {
  position: "absolute",
  background: "var(--panel-background)",
  border: "1px solid var(--panel-border)",
  boxShadow: "0 4px 16px rgba(20,24,31,0.16)",
  borderRadius: 8,
  minWidth: 280,
  padding: 0,
  zIndex: 1000,
  fontFamily: "JetBrains Mono, monospace",
  color: "var(--panel-foreground)",
  userSelect: "none",
  transition: "box-shadow 0.2s",
};

const collapsedStyle = {
  ...panelStyle,
  width: 38,
  height: 38,
  minWidth: 0,
  minHeight: 0,
  padding: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 4,
  cursor: "pointer",
};

const headerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "7px 12px 7px 38px",
  borderBottom: "1px solid var(--panel-separator)",
  background: "var(--panel-background)",
  borderTopLeftRadius: 8,
  borderTopRightRadius: 8,
};

const controlListStyle = {
  padding: "12px",
  background: "var(--panel-background)",
};

const labelStyle = {
  display: "flex",
  alignItems: "center",
  fontSize: 14,
  fontWeight: 500,
  marginBottom: 8,
  gap: 10,
};

const inputStyle = {
  padding: "4px 8px",
  fontSize: 14,
  borderRadius: 4,
  border: "1px solid #333741",
  background: "#242834",
  color: "#e0e5ef",
  outline: "none",
  transition: "border 0.2s, box-shadow 0.2s",
  flex: "1 1 0",
};

const checkboxStyle = {
  width: 18,
  height: 18,
  accentColor: "#3e7aff",
  marginLeft: 3,
  marginRight: 4,
};

const selectStyle = {
  ...inputStyle,
  minWidth: 70,
};

const colorStyle = {
  width: 32,
  height: 32,
  borderRadius: 6,
  border: "1px solid #3e7aff",
  padding: 0,
  background: "#181c23",
  marginLeft: 6,
  marginRight: 6,
  cursor: "pointer",
};

const footerStyle = {
  padding: "7px 12px",
  borderTop: "1px solid var(--panel-separator)",
  background: "var(--panel-background)",
  fontSize: 12,
  color: "var(--control-text-muted)",
  borderBottomLeftRadius: 8,
  borderBottomRightRadius: 8,
  opacity: 0.7,
};

const arrowButtonStyle = {
  position: "absolute",
  top: 8,
  left: 8,
  width: 22,
  height: 22,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 4,
  background: "var(--panel-background)",
  cursor: "pointer",
  border: "none",
  padding: 0,
  transition: "background 0.2s",
};

const closeButtonStyle = {
  width: 22,
  height: 22,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 4,
  background: "transparent",
  cursor: "pointer",
  border: "none",
  padding: 0,
  transition: "background 0.2s",
};

/**
 * @param {{
 *   controls: Record<string, any>,
 *   id?: string,
 *   position?: React.CSSProperties,
 *   panelId?: string
 * }} props
 */
export function SimpleControlPanel({
  controls,
  id = "simple-control-panel",
  position = { top: 40, left: 40 },
  panelId,
  title = "CONTROLS",
}) {
  const [controlValues, setControlValue] = useControls(controls);
  const [collapsed, setCollapsed] = useState(false);
  const [contentCollapsed, setContentCollapsed] = useState(false);

  // Close panel: just collapse for demo
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;

  return (
    <div
      id={id}
      style={{
        ...panelVars,
        ...(collapsed
          ? { ...collapsedStyle, ...position }
          : { ...panelStyle, ...position }),
      }}
    >
      {/* Collapsed panel */}
      {collapsed && (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setCollapsed(false)}
          title="Open Panel"
        >
          <SettingsIcon size={18} />
        </div>
      )}
      {/* Expanded panel */}
      {!collapsed && (
        <>
          {/* Collapse/expand arrow */}
          <button
            style={arrowButtonStyle}
            onClick={() => setCollapsed(true)}
            title="Collapse Panel"
          >
            <SettingsIcon size={15} />
          </button>
          {/* Panel header */}
          <div style={headerStyle}>
            <div
              style={{ fontWeight: 700, fontSize: 15, letterSpacing: "0.5px" }}
            >
              {title}
            </div>
            <div style={{ display: "flex", gap: 5 }}>
              <button
                style={arrowButtonStyle}
                onClick={() => setContentCollapsed((c) => !c)}
                title={
                  contentCollapsed ? "Expand controls" : "Collapse controls"
                }
              >
                <CaretDownIcon size={14} collapsed={contentCollapsed} />
              </button>
              <button
                style={closeButtonStyle}
                onClick={() => setHidden(true)}
                title="Close panel"
              >
                <XIcon size={14} />
              </button>
            </div>
          </div>
          {/* Controls */}
          {!contentCollapsed && (
            <div style={controlListStyle}>
              {Object.entries(controls).map(([key, config]) => {
                const label = config.label || key;
                const handleChange = (value) => {
                  setControlValue(key, value);
                  if (typeof config.onChange === "function") {
                    config.onChange(value, key);
                  }
                };
                switch (config.type) {
                  case "number":
                  case "range":
                    return (
                      <div key={key} style={labelStyle}>
                        <span style={{ width: 90 }}>{label}:</span>
                        <input
                          type="number"
                          style={inputStyle}
                          value={controlValues[key]}
                          min={config.min}
                          max={config.max}
                          step={config.step}
                          onChange={(e) => handleChange(Number(e.target.value))}
                        />
                      </div>
                    );
                  case "boolean":
                    return (
                      <div key={key} style={labelStyle}>
                        <span style={{ width: 90 }}>{label}:</span>
                        <input
                          type="checkbox"
                          style={checkboxStyle}
                          checked={!!controlValues[key]}
                          onChange={(e) => handleChange(e.target.checked)}
                        />
                      </div>
                    );
                  case "string":
                    return (
                      <div key={key} style={labelStyle}>
                        <span style={{ width: 90 }}>{label}:</span>
                        <input
                          type="text"
                          style={inputStyle}
                          value={controlValues[key]}
                          onChange={(e) => handleChange(e.target.value)}
                        />
                      </div>
                    );
                  case "color":
                    return (
                      <div key={key} style={labelStyle}>
                        <span style={{ width: 90 }}>{label}:</span>
                        <input
                          type="color"
                          style={colorStyle}
                          value={controlValues[key]}
                          onChange={(e) => handleChange(e.target.value)}
                        />
                      </div>
                    );
                  case "select":
                    return (
                      <div key={key} style={labelStyle}>
                        <span style={{ width: 90 }}>{label}:</span>
                        <select
                          style={selectStyle}
                          value={controlValues[key]}
                          onChange={(e) => handleChange(e.target.value)}
                        >
                          {Array.isArray(config.options)
                            ? config.options.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))
                            : Object.entries(config.options).map(
                                ([val, label]) => (
                                  <option key={val} value={val}>
                                    {label}
                                  </option>
                                )
                              )}
                        </select>
                      </div>
                    );
                  case "button":
                    return (
                      <div key={key} style={labelStyle}>
                        <button
                          style={{
                            ...inputStyle,
                            cursor: "pointer",
                            fontWeight: 600,
                            background: "#3e7aff",
                            color: "#fff",
                            border: "none",
                            padding: "6px 16px",
                          }}
                          onClick={() => {
                            if (typeof config.onClick === "function") {
                              config.onClick(key);
                            }
                          }}
                        >
                          {label || "Button"}
                        </button>
                      </div>
                    );
                  default:
                    return null;
                }
              })}
              {/* Debug values */}
              <div
                style={{
                  marginTop: 18,
                  background: "#202428",
                  padding: "10px 8px",
                  borderRadius: 6,
                  fontSize: 13,
                  color: "#b8bfd1",
                  wordBreak: "break-all",
                  opacity: 0.8,
                }}
              >
                <strong style={{ color: "#6c8cff", fontWeight: 600 }}>
                  Values:
                </strong>
                <pre
                  style={{
                    fontFamily: "Fira Mono, Menlo, monospace",
                    margin: 0,
                  }}
                >
                  {JSON.stringify(controlValues, null, 2)}
                </pre>
              </div>
            </div>
          )}
          {/* Panel footer */}
          {!contentCollapsed && (
            <div style={footerStyle}>
              <span>Ctrl+; to toggle</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
