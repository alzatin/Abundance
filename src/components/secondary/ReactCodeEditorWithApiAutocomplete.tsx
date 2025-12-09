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

import { andromeda, andromedaInit } from "@uiw/codemirror-theme-andromeda";

import ReactCodeEditor from "@uiw/react-codemirror";
// Uses linter.mjs
import * as eslint from "eslint-linter-browserify";
// NOTE: adjust imports to match your project structure & packages

type ApiDef = {
  type?: string;
  requiredParams?: string[];
  optionalParams?: string[];
  usage?: string;
  returns?: string;
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
  activeAtom?: { saveCode: () => void } | null;
}) {
  const { value, onChange, apiJson, activeAtom } = props;

  // Provide a tiny set of common js completions
  const commonJsCompletions = useMemo(
    () => [
      { label: "console.log", type: "function", detail: "Console log" },
      { label: "Math.max", type: "function", detail: "Math.max(...values)" },
      { label: "Math.min", type: "function", detail: "Math.min(...values)" },
      { label: "Array.prototype.map", type: "method", detail: "Array map" },
      {
        label: "Array.prototype.filter",
        type: "method",
        detail: "Array filter",
      },
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

  /**
   * Build a completion source. If api is null/undefined, return a no-op source that returns null.
   * This prevents Object.keys(undefined) errors.
   */
  function apiCompletionSource(api?: ApiJson) {
    if (!api) {
      // no API available: return a source that never provides completions
      return (_context: any): CompletionResult | null => null;
    }

    const keys = Object.keys(api);
    const methodsByBase: Record<string, string[]> = {};
    for (const k of keys) {
      if (!k.includes(".")) continue;
      const [base] = k.split(".");
      methodsByBase[base] = methodsByBase[base] || [];
      methodsByBase[base].push(k);
    }

    return (context: any): CompletionResult | null => {
      const word = context.matchBefore(/[$\w.]+/);
      if (!word && !context.explicit) return null;

      const text = word ? word.text : "";
      const lastDot = text.lastIndexOf(".");
      let from = word ? word.from : context.pos;

      const options: Completion[] = [];

      if (lastDot >= 0) {
        const base = text.slice(0, lastDot);
        const candidates = methodsByBase[base] || [];
        for (const fullKey of candidates) {
          const def = (api as ApiJson)[fullKey];
          if (def) options.push(makeCompletion(fullKey, def, true));
        }
        from = (word ? word.from : context.pos) + lastDot + 1;
      } else {
        for (const k of keys) {
          if (k.includes(".")) continue;
          const def = (api as ApiJson)[k];
          if (def) options.push(makeCompletion(k, def, false));
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
    return autocompletion({
      override: [apiSource, completeFromList(commonJsCompletions)],
      activateOnTyping: true,
    });
  }, [apiJson, commonJsCompletions]);

  // Find an ESLint Linter constructor safely and only enable linting if we have it.
  const lintCtor = useMemo(() => findEslintLinterCtor(), []);
  const lintExtension = useMemo(() => {
    if (!lintCtor) return null;
    try {
      const linterInstance = new lintCtor();
      return linter(
        esLint(linterInstance, {
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
      keymap.of({
        key: "Mod-s",
        run: () => {
          console.log("mod-s pressed, attempting to save code");
          if (activeAtom != null) {
            activeAtom.saveCode();
          }
          return true;
        },
        preventDefault: true,
      }),
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
