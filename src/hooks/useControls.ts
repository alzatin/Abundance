import React, { useState, useCallback } from "react";

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

  // Set control value
  const setControlValue = useCallback((key, value) => {
    setValues((v) => ({ ...v, [key]: value }));
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
