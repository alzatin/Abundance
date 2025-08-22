import React, { useState, useCallback } from "react";
// Supported control config types
export interface ButtonControlConfig {
  type: "button";
  label?: string;
  order?: number;
  onClick: () => void;
}
export interface NumberControlConfig {
  type: "number";
  value: number;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  order?: number;
}

export interface BooleanControlConfig {
  type: "boolean";
  value: boolean;
  label?: string;
  order?: number;
}

export interface StringControlConfig {
  type: "string";
  value: string;
  label?: string;
  order?: number;
}

export interface SelectControlConfig {
  type: "select";
  value: string;
  options: string[] | Record<string, string>;
  label?: string;
  order?: number;
}

export interface ColorControlConfig {
  type: "color";
  value: string;
  label?: string;
  order?: number;
}

export interface RangeControlConfig {
  type: "range";
  value: number;
  min: number;
  max: number;
  step?: number;
  label?: string;
  order?: number;
}

// Union type for all admitted controls
export type ControlConfig =
  | NumberControlConfig
  | BooleanControlConfig
  | StringControlConfig
  | SelectControlConfig
  | ColorControlConfig
  | RangeControlConfig
  | ButtonControlConfig;

/**
 * Controls API:
 * - Initial controls are passed as an object.
 * - You can register new controls at runtime with registerControl(key, config).
 * - You can remove controls at runtime with removeControl(key).
 * - setControlValue(key, value) updates a control's value.
 *
 * Usage:
 *   const [values, setControlValue, { registerControl, removeControl }] = useControls(initialConfig);
 */
export function useControls(initialConfig = {}) {
  // Accept dependency array as second argument
  const args = arguments;
  const deps = args.length > 1 ? args[1] : [];

  // Store controls object: { key: config }
  const [controls, setControls] = useState(() => ({ ...initialConfig }));
  // Store values separately: { key: value }
  const [values, setValues] = useState(() => {
    const vals = {};
    for (const key in initialConfig) {
      vals[key] = initialConfig[key].value;
    }
    return vals;
  });

  // Reset controls and values when dependencies change
  React.useEffect(() => {
    setControls({ ...initialConfig });
    const vals = {};
    for (const key in initialConfig) {
      vals[key] = initialConfig[key].value;
    }
    setValues(vals);
  }, deps);

  // Set control value only if different
  const setControlValue = useCallback((key, value) => {
    setValues((v) => {
      if (v[key] === value) return v;
      return { ...v, [key]: value };
    });
  }, []);

  // Register a new control
  const registerControl = useCallback((key, config) => {
    setControls((c) => ({ ...c, [key]: config }));
    setValues((v) => ({ ...v, [key]: config.value }));
  }, []);

  // Remove a control
  const removeControl = useCallback((key) => {
    setControls((c) => {
      const next = { ...c };
      delete next[key];
      return next;
    });
    setValues((v) => {
      const next = { ...v };
      delete next[key];
      return next;
    });
  }, []);

  // Optionally, update config for an existing control
  const updateControl = useCallback((key, config) => {
    setControls((c) => ({ ...c, [key]: config }));
    // Optionally update value if a new value is passed
    if (config.value !== undefined) {
      setValues((v) => ({ ...v, [key]: config.value }));
    }
  }, []);

  return [
    values,
    setControlValue,
    { controls, registerControl, removeControl, updateControl },
  ];
}
