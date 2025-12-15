import React, { useMemo } from "react";
import {
  Completion,
  CompletionResult,
  completeFromList,
  autocompletion,
} from "@codemirror/autocomplete";
import { javascript } from "@codemirror/lang-javascript";
import { keymap } from "@codemirror/view";
import { linter } from "@codemirror/lint";
import { lintGutter } from "@codemirror/lint";
import type { EditorView } from "@codemirror/view";

import { andromeda, andromedaInit } from "@uiw/codemirror-theme-andromeda";

import ReactCodeEditor from "@uiw/react-codemirror";
// Uses linter.mjs
import * as esLint from "eslint-linter-browserify";
import { is } from "@react-three/fiber/dist/declarations/src/core/utils";
// NOTE: adjust imports to match your project structure & packages

type ApiDef = {
  type?: string;
  requiredParams?: string[];
  optionalParams?: string[];
  usage?: string;
  returns?: string;
  detail?: string;
  properties?: string[];
};

type ApiJson = Record<string, ApiDef> | null | undefined;

/** Helper: try to locate an ESLint Linter constructor in a safe way. */
function findEslintLinterCtor(): any | null {
  try {
    if (typeof window !== "undefined") {
      const w = window as any;
      if (w && w.eslint && typeof w.eslint.Linter === "function") {
        return w.eslint.Linter;
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const maybe = require("eslint");
    if (maybe && typeof maybe.Linter === "function") return maybe.Linter;
  } catch {
    // not available; that's fine
  }
  return null;
}

/**
 * Component that wires an API JSON into a CodeMirror completion source.
 * Fix: guards against null/undefined apiJson to avoid Object.keys(undefined) errors.
 */
export default function ReactCodeEditorWithApiAutocomplete(props: {
  value: string;
  onChange: (v: string) => void;
  apiJson?: ApiJson;
  abundanceJson?: ApiJson;
  activeAtom?: { saveCode: () => void } | null;
}) {
  const { value, onChange, apiJson, abundanceJson, activeAtom } = props;

  const commonJsCompletions = useMemo(
    () => [
      { label: "console.log", type: "function", detail: "Console log" },
      // Math methods
      { label: "Math.max", type: "function", detail: "Math.max(...values)" },
      { label: "Math.min", type: "function", detail: "Math.min(...values)" },
      { label: "Math.abs", type: "function", detail: "Math.abs(x)" },
      { label: "Math.round", type: "function", detail: "Math.round(x)" },
      { label: "Math.floor", type: "function", detail: "Math.floor(x)" },
      { label: "Math.ceil", type: "function", detail: "Math.ceil(x)" },
      { label: "Math.pow", type: "function", detail: "Math.pow(base, exp)" },
      { label: "Math.sqrt", type: "function", detail: "Math.sqrt(x)" },
      { label: "Math.random", type: "function", detail: "Math.random()" },
      { label: "Math.PI", type: "constant", detail: "Math.PI (π)" },
      { label: "Math.sin", type: "function", detail: "Math.sin(x)" },
      { label: "Math.cos", type: "function", detail: "Math.cos(x)" },
      { label: "Math.tan", type: "function", detail: "Math.tan(x)" },
      // Array methods with custom apply for callback
      {
        label: "Array.prototype.map",
        type: "method",
        detail: "Array map",
        apply(
          view: EditorView,
          completion: Completion,
          from: number,
          to: number
        ) {
          const insert = "map((item) => item)";
          const anchor = from + insert.indexOf("item)");
          view.dispatch({
            changes: { from, to, insert },
            selection: { anchor },
          });
          view.focus();
        },
      },
      {
        label: "Array.prototype.filter",
        type: "method",
        detail: "Array filter",
        apply(
          view: EditorView,
          completion: Completion,
          from: number,
          to: number
        ) {
          const insert = "filter((item) => true)";
          const anchor = from + insert.indexOf("true");
          view.dispatch({
            changes: { from, to, insert },
            selection: { anchor },
          });
          view.focus();
        },
      },
      {
        label: "Array.prototype.reduce",
        type: "method",
        detail: "Array reduce",
        apply(
          view: EditorView,
          completion: Completion,
          from: number,
          to: number
        ) {
          const insert = "reduce((acc, item) => acc, initialValue)";
          const anchor = from + insert.indexOf("acc, initialValue");
          view.dispatch({
            changes: { from, to, insert },
            selection: { anchor },
          });
          view.focus();
        },
      },
      {
        label: "Array.prototype.forEach",
        type: "method",
        detail: "Array forEach",
        apply(
          view: EditorView,
          completion: Completion,
          from: number,
          to: number
        ) {
          const insert = "forEach((item) => {})";
          const anchor = from + insert.indexOf("item");
          view.dispatch({
            changes: { from, to, insert },
            selection: { anchor },
          });
          view.focus();
        },
      },
      { label: "Array.prototype.find", type: "method", detail: "Array find" },
      { label: "Array.prototype.some", type: "method", detail: "Array some" },
      { label: "Array.prototype.every", type: "method", detail: "Array every" },
      {
        label: "Array.prototype.includes",
        type: "method",
        detail: "Array includes",
      },
      { label: "Array.prototype.slice", type: "method", detail: "Array slice" },
      {
        label: "Array.prototype.concat",
        type: "method",
        detail: "Array concat",
      },
      // Object/utility
      { label: "Object.keys", type: "function", detail: "Object.keys(obj)" },
      {
        label: "Object.values",
        type: "function",
        detail: "Object.values(obj)",
      },
      {
        label: "JSON.stringify",
        type: "function",
        detail: "JSON.stringify(obj)",
      },
      { label: "JSON.parse", type: "function", detail: "JSON.parse(str)" },
    ],
    []
  );

  function makeCompletion(
    fullKey: string,
    def: ApiDef,
    isDottedContext = false
  ): Completion {
    const parts = fullKey.split(".");
    const label = isDottedContext ? parts[parts.length - 1] : fullKey;
    const params = (def.requiredParams || []).concat(def.optionalParams || []);
    const paramsPreview = params.join(", ");
    const detail = def.usage
      ? `${def.usage} → ${def.returns || ""}`
      : def.returns || "";

    const info = () => {
      const el = document.createElement("div");
      el.style.maxWidth = "40ch";
      const title = document.createElement("div");
      title.style.fontWeight = "600";
      title.textContent = fullKey;
      el.appendChild(title);
      const sig = document.createElement("div");
      sig.style.fontFamily = "monospace";
      sig.style.margin = "4px 0";
      sig.textContent = `${label}(${paramsPreview})`;
      el.appendChild(sig);
      if (def.usage) {
        const u = document.createElement("div");
        u.textContent = `Usage: ${def.usage}`;
        el.appendChild(u);
      }
      if (params.length) {
        const p = document.createElement("div");
        p.textContent = `Parameters: ${params.join(", ")}`;
        el.appendChild(p);
      }
      if (def.returns) {
        const r = document.createElement("div");
        r.textContent = `Returns: ${def.returns}`;
        el.appendChild(r);
      }
      return el;
    };

    const insertText = `${label}(${paramsPreview ? paramsPreview : ""})`;

    return {
      label,
      type: def.type === "class_constructor" ? "class" : def.type || "function",
      detail,
      info,
      apply(view, completion, from, to) {
        const insert = insertText;
        const anchor = from + label.length + 1; // position inside parentheses
        view.dispatch({
          changes: { from, to, insert },
          selection: { anchor },
        });
        view.focus();
      },
      boost: 80,
    };
  }

  // Enhanced variable type inference for method chains
  function inferVariableTypes(
    code: string,
    api: ApiJson
  ): Record<string, string> {
    const variableTypes: Record<string, string> = {};
    // Find direct replicad assignments
    const replicadAssignRegex =
      /\b(?:let|const|var)\s+([a-zA-Z_$][\w$]*)\s*=\s*replicad\.([a-zA-Z_$][\w$]*)\s*\(/g;
    let match;
    while ((match = replicadAssignRegex.exec(code))) {
      const varName = match[1];
      const method = match[2];
      if (api && api[method] && api[method].returns) {
        variableTypes[varName] = api[method].returns!;
      }
    }
    // Find assignments from other variables and method calls
    const methodAssignRegex =
      /\b(?:let|const|var)\s+([a-zA-Z_$][\w$]*)\s*=\s*([a-zA-Z_$][\w$]*)\.([a-zA-Z_$][\w$]*)\s*\(/g;
    while ((match = methodAssignRegex.exec(code))) {
      const varName = match[1];
      const sourceVar = match[2];
      const method = match[3];
      const sourceType = variableTypes[sourceVar];
      if (
        sourceType &&
        api &&
        api[`${sourceType}.${method}`] &&
        api[`${sourceType}.${method}`].returns
      ) {
        variableTypes[varName] = api[`${sourceType}.${method}`].returns!;
      }
    }
    // Infer arrays: let arr = [] or let arr = [1,2,3]
    const arrayAssignRegex =
      /\b(?:let|const|var)\s+([a-zA-Z_$][\w$]*)\s*=\s*\[.*?\]/g;
    while ((match = arrayAssignRegex.exec(code))) {
      const varName = match[1];
      variableTypes[varName] = "Array";
    }
    // Infer objects: let obj = {}
    const objectAssignRegex =
      /\b(?:let|const|var)\s+([a-zA-Z_$][\w$]*)\s*=\s*\{.*?\}/g;
    while ((match = objectAssignRegex.exec(code))) {
      const varName = match[1];
      variableTypes[varName] = "Object";
    }
    // Infer strings: let str = "..." or '...'
    const stringAssignRegex =
      /\b(?:let|const|var)\s+([a-zA-Z_$][\w$]*)\s*=\s*(["']).*?\2/g;
    while ((match = stringAssignRegex.exec(code))) {
      const varName = match[1];
      variableTypes[varName] = "String";
    }
    const abundanceMethodNames = [
      "Move",
      "Rotate",
      "Scale",
      "Assembly",
      "Intersect",
      "GetBounds",
      "Fillet",
      "Chamfer",
    ];
    const abundanceAssignRegex = new RegExp(
      `\\b(?:let|const|var)\\s+([a-zA-Z_$][\\w$]*)\\s*=\\s*(?:await\\s*)?(${abundanceMethodNames.join(
        "|"
      )})\\s*\\(`,
      "g"
    );
    while ((match = abundanceAssignRegex.exec(code))) {
      const varName = match[1];
      variableTypes[varName] = "AbundanceObject";
    }
    return variableTypes;
  }

  /**
   * Build a completion source. If api is null/undefined, return a no-op source that returns null.
   * This prevents Object.keys(undefined) errors.
   */
  function apiCompletionSource(api?: ApiJson, opts?: { isReplicad?: boolean }) {
    const isReplicad = opts?.isReplicad ?? true;
    if (!api) {
      return (_context: any): CompletionResult | null => null;
    }
    const keys = Object.keys(api);
    const topLevelKeys = keys.filter((k) => !k.includes("."));
    const instancePrefixes = Array.from(
      new Set(keys.filter((k) => k.includes(".")).map((k) => k.split(".")[0]))
    );

    // Map replicad method to return type (from API JSON)
    const methodToType: Record<string, string> = {};
    for (const key of Object.keys(api)) {
      if (api[key].returns) {
        methodToType[key] = api[key].returns!;
      }
    }

    return (context: any): CompletionResult | null => {
      const word = context.matchBefore(/[$\w.]+/);
      if (!word && !context.explicit) return null;

      const text = word ? word.text : "";
      let from = word ? word.from : context.pos;
      let options: Completion[] = [];

      // --- Local variable extraction and type inference ---
      const code = context.state.doc.toString();
      // Find all variable declarations and their assigned types (if replicad)
      const variableTypes = inferVariableTypes(code, api);
      console.log("Inferred variable types:", variableTypes);
      // Collect all variable names for completion
      const allVarRegex = /\b(?:let|const|var)\s+([a-zA-Z_$][\w$]*)/g;
      const variableNames: string[] = [];
      let allVarMatch;
      while ((allVarMatch = allVarRegex.exec(code))) {
        variableNames.push(allVarMatch[1]);
      }

      // Replicad top-level completions
      if (isReplicad && /^replicad\.?[\w]*$/.test(text)) {
        for (const k of topLevelKeys) {
          const def = api[k];
          if (def) {
            options.push({
              ...makeCompletion(k, def, false),
              label: k,
              apply: (view, completion, fromPos, toPos) => {
                const params = (def.requiredParams || []).concat(
                  def.optionalParams || []
                );
                const paramsPreview = params.join(", ");
                let insertText;
                if (/^replicad\.$/.test(text)) {
                  insertText = `${k}(${paramsPreview ? paramsPreview : ""})`;
                } else {
                  insertText = `replicad.${k}(${
                    paramsPreview ? paramsPreview : ""
                  })`;
                }
                const anchor = fromPos + insertText.indexOf("(") + 1;
                view.dispatch({
                  changes: { from: fromPos, to: toPos, insert: insertText },
                  selection: { anchor },
                });
                view.focus();
              },
            });
          }
        }
        const dotIdx = text.indexOf(".");
        from =
          dotIdx >= 0
            ? (word ? word.from : context.pos) + dotIdx + 1
            : word
            ? word.from
            : context.pos;
      }
      // Instance method completions for known prefixes
      else if (
        instancePrefixes.some((prefix) => text.startsWith(prefix + "."))
      ) {
        const prefix = instancePrefixes.find((p) => text.startsWith(p + "."));
        if (prefix) {
          const instanceMethods = keys.filter((k) =>
            k.startsWith(prefix + ".")
          );
          for (const k of instanceMethods) {
            const def = api[k];
            if (def) {
              options.push({
                ...makeCompletion(k, def, true),
                label: k.split(".")[1],
                apply: (view, completion, fromPos, toPos) => {
                  const params = (def.requiredParams || []).concat(
                    def.optionalParams || []
                  );
                  const paramsPreview = params.join(", ");
                  const insertText = `${k.split(".")[1]}(${
                    paramsPreview ? paramsPreview : ""
                  })`;
                  const anchor = fromPos + insertText.indexOf("(") + 1;
                  view.dispatch({
                    changes: { from: fromPos, to: toPos, insert: insertText },
                    selection: { anchor },
                  });
                  view.focus();
                },
              });
            }
          }
          const dotIdx = text.indexOf(".");
          from =
            dotIdx >= 0
              ? (word ? word.from : context.pos) + dotIdx + 1
              : word
              ? word.from
              : context.pos;
        }
      }
      // Instance method completions for inferred replicad variables
      else if (/^[a-zA-Z_$][\w$]*\.$/.test(text)) {
        const varName = text.slice(0, -1);
        let type = variableTypes[varName];
        if (type) {
          // If type is AnyShape, treat as union of all shape types
          let typeList: string[];
          if (type.includes("AnyShape")) {
            // Collect all unique type prefixes for instance methods
            const shapeTypes = Array.from(
              new Set(
                keys
                  .filter(
                    (k) =>
                      k.includes(".") &&
                      (k.startsWith("Shape.") ||
                        k.startsWith("Shape3D.") ||
                        k.startsWith("Sketch.") ||
                        k.startsWith("Sketches.") ||
                        k.startsWith("Wire.") ||
                        k.startsWith("Face.") ||
                        k.startsWith("Solid."))
                  )
                  .map((k) => k.split(".")[0])
              )
            );
            typeList = shapeTypes;
          } else {
            typeList = type.split("|").map((t) => t.trim());
          }
          const seen = new Set();
          for (const t of typeList) {
            const instanceMethods = keys.filter((k) => k.startsWith(t + "."));
            for (const k of instanceMethods) {
              if (seen.has(k)) continue;
              seen.add(k);
              const def = api[k];
              if (def) {
                options.push({
                  ...makeCompletion(k, def, true),
                  label: k.split(".")[1],
                  apply: (view, completion, fromPos, toPos) => {
                    const params = (def.requiredParams || []).concat(
                      def.optionalParams || []
                    );
                    const paramsPreview = params.join(", ");
                    const insertText = `${k.split(".")[1]}(${
                      paramsPreview ? paramsPreview : ""
                    })`;
                    const anchor = fromPos + insertText.indexOf("(") + 1;
                    view.dispatch({
                      changes: { from: fromPos, to: toPos, insert: insertText },
                      selection: { anchor },
                    });
                    view.focus();
                  },
                });
              }
            }
          }
          // Add JS built-in completions for Array, Object, String
          if (typeList.includes("Array")) {
            for (const c of commonJsCompletions) {
              if (c.label.startsWith("Array.prototype.")) {
                options.push({
                  ...c,
                  label: c.label.replace("Array.prototype.", ""),
                });
              }
            }
          }
          if (typeList.includes("Object")) {
            for (const c of commonJsCompletions) {
              if (c.label.startsWith("Object.")) {
                options.push({ ...c });
              }
            }
          }
          if (typeList.includes("String")) {
            // You can add String.prototype methods to commonJsCompletions and handle here if desired
          }
          const dotIdx = text.indexOf(".");
          from =
            dotIdx >= 0
              ? (word ? word.from : context.pos) + dotIdx + 1
              : word
              ? word.from
              : context.pos;
        }
      }
      // Fallback: top-level completions with replicad. prefix and variable name completions
      else {
        for (const k of topLevelKeys) {
          const def = api[k];

          if (def) {
            if (
              k === "AbundanceObject" &&
              def.type === "object" &&
              Array.isArray(def.properties)
            ) {
              options.push({
                label: k,
                type: "object",
                detail: def.detail || "AbundanceObject structure",
                info: () => {
                  const el = document.createElement("div");
                  el.textContent = def.detail || "AbundanceObject structure";
                  return el;
                },
                apply: (view, completion, fromPos, toPos) => {
                  // Build the object template
                  const propLines = def.properties.map((prop: string) => {
                    const [propName, propType] = prop
                      .split(":")
                      .map((s: string) => s.trim());
                    let example = "";
                    if (propName === "geometry") example = "[createdShape]";
                    else if (propName === "dimension") example = '"3D"';
                    else if (propName === "tags") example = '["createdShape"]';
                    else if (propName === "color") example = "'#A3CE5B'";
                    else if (propName === "plane") example = "newPlane";
                    else if (propName === "bom") example = "[]";
                    else
                      example =
                        propType === "String"
                          ? '""'
                          : propType === "Array"
                          ? "[]"
                          : "null";
                    return `  ${propName}: ${example},`;
                  });
                  const objectText = `{\n${propLines.join("\n")}\n}`;
                  view.dispatch({
                    changes: { from: fromPos, to: toPos, insert: objectText },
                    selection: { anchor: fromPos + objectText.length },
                  });
                  view.focus();
                },
                boost: 100,
              });
              continue;
            }
            options.push({
              ...makeCompletion(k, def, false),
              label: k,
              apply: (view, completion, fromPos, toPos) => {
                const params = (def.requiredParams || []).concat(
                  def.optionalParams || []
                );
                const paramsPreview = params.join(", ");
                let insertText;

                if (isReplicad) {
                  // add replicad. prefix
                  insertText = `replicad.${k}(${
                    paramsPreview ? paramsPreview : ""
                  })`;
                } else {
                  // add await for abundance functions
                  if (def.type === "function") {
                    insertText = `await ${k}(${
                      paramsPreview ? paramsPreview : ""
                    })`;
                  } else {
                    insertText = `${k}(${paramsPreview ? paramsPreview : ""})`;
                  }
                }
                const anchor = fromPos + insertText.indexOf("(") + 1;
                view.dispatch({
                  changes: { from: fromPos, to: toPos, insert: insertText },
                  selection: { anchor },
                });
                view.focus();
              },
            });
          }
        }
        // Add variable name completions if user is typing a variable
        if (/^[a-zA-Z_$][\w$]*$/.test(text)) {
          for (const v of variableNames) {
            if (v.startsWith(text)) {
              options.push({
                label: v,
                type: "variable",
                detail: "Local variable",
                apply: (view, completion, fromPos, toPos) => {
                  view.dispatch({
                    changes: { from: fromPos, to: toPos, insert: v },
                    selection: { anchor: fromPos + v.length },
                  });
                  view.focus();
                },
                boost: 100,
              });
            }
          }
        }
      }

      if (!options.length) return null;

      return {
        from,
        options,
        validFor: /^[$\w]*$/,
      };
    };
  }

  const completionExtension = useMemo(() => {
    const apiSource = apiCompletionSource(apiJson);
    const abundanceSource = apiCompletionSource(abundanceJson);
    return autocompletion({
      override: [
        apiCompletionSource(apiJson, { isReplicad: true }),
        apiCompletionSource(abundanceJson, { isReplicad: false }),
        completeFromList(commonJsCompletions),
      ],
      activateOnTyping: true,
    });
  }, [apiJson, commonJsCompletions, abundanceJson]);

  // Find an ESLint Linter constructor safely and only enable linting if we have it.
  const lintCtor = useMemo(() => findEslintLinterCtor(), []);
  const lintExtension = useMemo(() => {
    if (!lintCtor) return null;
    try {
      const linterInstance = new lintCtor();
      // esLint is imported as * as esLint, so use esLint.default if available
      const esLintFn =
        typeof esLint === "function" ? esLint : (esLint as any).default;
      if (!esLintFn) return null;
      return linter(
        esLintFn(linterInstance, {
          rules: {
            semi: ["error", "never"],
            "no-undef": ["warn"],
          },
        })
      );
    } catch {
      return null;
    }
  }, [lintCtor]);

  const extensions = useMemo(() => {
    const exts: any[] = [
      keymap.of([
        {
          key: "Mod-s",
          run: () => {
            console.log("mod-s pressed, attempting to save code");
            if (activeAtom != null) {
              activeAtom.saveCode();
            }
            return true;
          },
          preventDefault: true,
        },
      ]),
      javascript(),
      completionExtension,
    ];

    if (lintExtension) {
      exts.push(lintExtension);
      exts.push(lintGutter());
    }

    return exts;
  }, [completionExtension, lintExtension, activeAtom]);

  return (
    <ReactCodeEditor
      width="100%"
      height="500px"
      extensions={extensions}
      value={value}
      onChange={onChange}
      theme={andromeda}
    />
  );
}
