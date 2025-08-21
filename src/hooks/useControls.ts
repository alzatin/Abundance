import { useEffect, useRef, useState } from "react";

// Define the control config types
export type NumberControlConfig = {
  type: "number";
  value: number;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  order?: number;
};
export type BooleanControlConfig = {
  type: "boolean";
  value: boolean;
  label?: string;
  order?: number;
};
export type StringControlConfig = {
  type: "string";
  value: string;
  label?: string;
  order?: number;
};
export type SelectControlConfig = {
  type: "select";
  value: string;
  options: string[] | Record<string, string>;
  label?: string;
  order?: number;
};
export type ColorControlConfig = {
  type: "color";
  value: string;
  label?: string;
  order?: number;
};
export type RangeControlConfig = {
  type: "range";
  value: number;
  min: number;
  max: number;
  step?: number;
  label?: string;
  order?: number;
};

export type ControlConfig =
  | NumberControlConfig
  | BooleanControlConfig
  | StringControlConfig
  | SelectControlConfig
  | ColorControlConfig
  | RangeControlConfig;

type ControlsState<T extends Record<string, ControlConfig>> = {
  [K in keyof T]: T[K]["value"];
};

type SetControlValue<T extends Record<string, ControlConfig>> = <
  K extends keyof T
>(
  key: K,
  value: T[K]["value"]
) => void;

/**
 * useControls
 * Registers and manages a set of controls.
 * Returns current values and a setter for values.
 */
export function useControls<T extends Record<string, ControlConfig>>(
  initialControls: T
): [ControlsState<T>, SetControlValue<T>] {
  // Store the controls config in a ref so it doesn't change on every re-render
  const controlsRef = useRef<T>(initialControls);

  // State for control values
  const [values, setValues] = useState<ControlsState<T>>(() => {
    const initial: Partial<ControlsState<T>> = {};
    for (const key in initialControls) {
      initial[key] = initialControls[key].value;
    }
    return initial as ControlsState<T>;
  });

  // Effect to update values when initialControls changes
  useEffect(() => {
    controlsRef.current = initialControls;
    setValues(() => {
      const initial: Partial<ControlsState<T>> = {};
      for (const key in initialControls) {
        initial[key] = initialControls[key].value;
      }
      return initial as ControlsState<T>;
    });
  }, [JSON.stringify(initialControls)]);

  // Set a value for a control
  const setControlValue: SetControlValue<T> = (key, value) => {
    setValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return [values, setControlValue];
}
