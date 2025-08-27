import React, { useState } from "react";
import { useControls } from "../../hooks/useControls";
import { color } from "@uiw/react-codemirror";

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
      stroke="#c4a3d5"
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
  "--control-text-muted": "#c4a3d5",
  "--control-accent": "#c4a3d5",
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

const panelTitleStyle = {
  fontWeight: 700,
  fontSize: 15,
  letterSpacing: "0.5px",
  color: "var(--abundance-color-mainPurple)",
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
  maxHeight: "340px", // You can adjust this value as needed
  overflowY: "auto",
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

const inputDisabledStyle = {
  color: "var(--control-text-muted)",
  background: "#232832",
  cursor: "not-allowed",
  opacity: 0.7,
};

const inputFocusedStyle = {
  border: "2px solid var(--abundance-color-brightPurple)",
  boxShadow: "0 0 0 2px var(--abundance-color-transparentHighlight)",
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
  border: "1px solid var(--abundance-color-brightPurple)",
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
  const [controlValues, setControlValue, { controls: registeredControls }] =
    useControls(controls);

  // Focus management
  const controlKeys = Object.keys(controls);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputRefs = React.useRef([]);

  // Collapsed panel state
  const [collapsed, setCollapsed] = useState(false);
  const [contentCollapsed, setContentCollapsed] = useState(false);

  // Ensure initial values are set when controls prop changes
  React.useEffect(() => {
    Object.entries(controls).forEach(([key, config]) => {
      if (config.value !== undefined) {
        setControlValue(key, config.value);
      }
    });
    setFocusedIndex(0); // Default focus to first control on controls change
  }, [controls]);

  // Focus the current control when focusedIndex changes
  React.useEffect(() => {
    if (inputRefs.current[focusedIndex]) {
      inputRefs.current[focusedIndex].focus();
    }
  }, [focusedIndex, controlKeys.length]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      setFocusedIndex((i) => Math.min(i + 1, controlKeys.length - 1));
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      setFocusedIndex((i) => Math.max(i - 1, 0));
      e.preventDefault();
    }
  };

  // Programmatic focus setter
  const focusControl = (key) => {
    const idx = controlKeys.indexOf(key);
    if (idx !== -1) setFocusedIndex(idx);
  };

  // Only show values for existing controls
  const filteredControlValues = Object.fromEntries(
    Object.entries(controlValues).filter(([key]) => key in controls)
  );

  return (
    <div
      id={id}
      style={{
        ...panelVars,
        ...(collapsed
          ? { ...collapsedStyle, ...position }
          : { ...panelStyle, ...position }),
      }}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
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
            <div style={panelTitleStyle}>{title}</div>
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
              {/*<button
                style={closeButtonStyle}
                onClick={() => setHidden(true)}
                title="Close panel"
              >
                <XIcon size={14} />
              </button>*/}
            </div>
          </div>
          {/* Controls */}
          {!contentCollapsed && (
            <div style={controlListStyle}>
              {controlKeys.map((key, idx) => {
                const config = controls[key];
                const label = config.label || key;
                const handleChange = (value) => {
                  setControlValue(key, value);
                  if (typeof config.onChange === "function") {
                    config.onChange(value, key);
                  }
                };
                const isFocused = focusedIndex === idx && !config.disable;
                const isDisabled = config.disabled;
                const commonProps = {
                  ref: (el) => (inputRefs.current[idx] = el),
                  tabIndex: isDisabled ? -1 : 0,
                  onFocus: isDisabled ? undefined : () => setFocusedIndex(idx),
                  onBlur: () => {},
                  style: isDisabled
                    ? { ...inputStyle, ...inputDisabledStyle }
                    : isFocused
                    ? { ...inputStyle, ...inputFocusedStyle }
                    : inputStyle,
                  disabled: isDisabled,
                };
                switch (config.type) {
                  case "point":
                    return (
                      <div key={key} style={labelStyle}>
                        <span
                          style={{
                            width: 90,
                            color: isDisabled
                              ? inputDisabledStyle.color
                              : undefined,
                          }}
                        >
                          {label}:
                        </span>
                        {["X", "Y", "Z"].map((axis, axisIdx) => (
                          <input
                            key={axis}
                            type="number"
                            value={
                              Array.isArray(controlValues[key])
                                ? controlValues[key][axisIdx] ?? 0
                                : 0
                            }
                            onChange={(e) => {
                              if (!isDisabled) {
                                const val = Number(e.target.value);
                                const arr = Array.isArray(controlValues[key])
                                  ? [...controlValues[key]]
                                  : [0, 0, 0];
                                arr[axisIdx] = val;
                                handleChange(arr);
                              }
                            }}
                            style={
                              isDisabled
                                ? {
                                    ...inputStyle,
                                    ...inputDisabledStyle,
                                    width: 50,
                                    marginRight: 4,
                                  }
                                : isFocused
                                ? {
                                    ...inputStyle,
                                    ...inputFocusedStyle,
                                    width: 50,
                                    marginRight: 4,
                                  }
                                : { ...inputStyle, width: 50, marginRight: 4 }
                            }
                            ref={
                              axisIdx === 0
                                ? (el) => (inputRefs.current[idx] = el)
                                : undefined
                            }
                            tabIndex={isDisabled ? -1 : 0}
                            disabled={isDisabled}
                            aria-label={axis}
                          />
                        ))}
                      </div>
                    );
                  case "number":
                  case "range":
                    return (
                      <div key={key} style={labelStyle}>
                        <span
                          style={{
                            width: 90,
                            color: isDisabled
                              ? inputDisabledStyle.color
                              : undefined,
                          }}
                        >
                          {label}:
                        </span>
                        <input
                          type="number"
                          value={controlValues[key] ?? 0}
                          min={config.min}
                          max={config.max}
                          step={config.step}
                          onChange={(e) => handleChange(Number(e.target.value))}
                          {...commonProps}
                        />
                      </div>
                    );
                  case "boolean":
                    return (
                      <div key={key} style={labelStyle}>
                        <span
                          style={{
                            width: 90,
                            color: isDisabled
                              ? inputDisabledStyle.color
                              : undefined,
                          }}
                        >
                          {label}:
                        </span>
                        <input
                          type="checkbox"
                          checked={!!controlValues[key]}
                          onChange={(e) => handleChange(e.target.checked)}
                          {...commonProps}
                        />
                      </div>
                    );
                  case "string":
                    return (
                      <div key={key} style={labelStyle}>
                        <span
                          style={{
                            width: 90,
                            color: isDisabled
                              ? inputDisabledStyle.color
                              : undefined,
                          }}
                        >
                          {label}:
                        </span>
                        <input
                          type="text"
                          value={controlValues[key] ?? ""}
                          onChange={(e) => handleChange(e.target.value)}
                          {...commonProps}
                        />
                      </div>
                    );
                  case "color":
                    return (
                      <div key={key} style={labelStyle}>
                        <span
                          style={{
                            width: 90,
                            color: isDisabled
                              ? inputDisabledStyle.color
                              : undefined,
                          }}
                        >
                          {label}:
                        </span>
                        <input
                          type="color"
                          value={controlValues[key] ?? "#000000"}
                          onChange={(e) => handleChange(e.target.value)}
                          style={
                            isDisabled
                              ? { ...colorStyle, ...inputDisabledStyle }
                              : isFocused
                              ? { ...colorStyle, ...inputFocusedStyle }
                              : colorStyle
                          }
                          ref={(el) => (inputRefs.current[idx] = el)}
                          tabIndex={isDisabled ? -1 : 0}
                          onFocus={
                            isDisabled ? undefined : () => setFocusedIndex(idx)
                          }
                          onBlur={() => {}}
                          disabled={isDisabled}
                        />
                      </div>
                    );
                  case "select":
                    return (
                      <div key={key} style={labelStyle}>
                        <span
                          style={{
                            width: 90,
                            color: isDisabled
                              ? inputDisabledStyle.color
                              : undefined,
                          }}
                        >
                          {label}:
                        </span>
                        <select
                          value={
                            controlValues[key] ??
                            (Array.isArray(config.options)
                              ? config.options[0]
                              : Object.keys(config.options)[0])
                          }
                          onChange={(e) => handleChange(e.target.value)}
                          {...commonProps}
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
                          style={
                            isDisabled
                              ? {
                                  ...inputStyle,
                                  ...inputDisabledStyle,
                                  cursor: "not-allowed",
                                  fontWeight: 600,
                                  background: "#3e7aff",
                                  color: "#fff",
                                  border: "none",
                                  padding: "6px 16px",
                                }
                              : isFocused
                              ? {
                                  ...inputStyle,
                                  ...inputFocusedStyle,
                                  cursor: "pointer",
                                  fontWeight: 600,
                                  background: "#3e7aff",
                                  color: "#fff",
                                  border: "none",
                                  padding: "6px 16px",
                                }
                              : {
                                  ...inputStyle,
                                  cursor: "pointer",
                                  fontWeight: 600,
                                  background: "#3e7aff",
                                  color: "#fff",
                                  border: "none",
                                  padding: "6px 16px",
                                }
                          }
                          onClick={() => {
                            if (typeof config.onClick === "function") {
                              config.onClick(key);
                            }
                          }}
                          ref={(el) => (inputRefs.current[idx] = el)}
                          tabIndex={isDisabled ? -1 : 0}
                          onFocus={
                            isDisabled ? undefined : () => setFocusedIndex(idx)
                          }
                          onBlur={() => {}}
                          disabled={isDisabled}
                        >
                          {label || "Button"}
                        </button>
                      </div>
                    );
                  default:
                    return null;
                }
              })}
              {/* Debug values 
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
                  {JSON.stringify(filteredControlValues, null, 2)}
                </pre>
              </div>*/}
            </div>
          )}
        </>
      )}
    </div>
  );
}
