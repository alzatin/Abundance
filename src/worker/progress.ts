/**
 * Lightweight worker -> main-thread progress channel.
 *
 * Long-running CAD operations (e.g. `assembly`, which internally cuts many
 * parts) appear as a single opaque comlink call from the UI's perspective. To
 * surface what is happening *inside* such an operation, the worker posts a
 * custom message which CadWorkerManager forwards to the UI as a
 * `cad-worker-task-progress` CustomEvent.
 *
 * The message shape (`{ type: "cad-worker-progress", label }`) does not match
 * comlink's request/response protocol, so comlink ignores it and only our
 * dedicated listener in CadWorkerManager reacts to it.
 */

export const CAD_PROGRESS_MESSAGE_TYPE = "cad-worker-progress";

/**
 * Report intra-operation progress from inside the CAD worker.
 *
 * Safe to call from any context: it is a no-op when not running inside a
 * DedicatedWorkerGlobalScope (e.g. unit tests on the main thread).
 *
 * @param label Short human-readable description of the current sub-step,
 *   e.g. "cutting part 3/5".
 */
export function reportCadProgress(label: string): void {
  if (
    typeof self !== "undefined" &&
    typeof (self as any).postMessage === "function" &&
    typeof (self as any).document === "undefined"
  ) {
    try {
      (self as any).postMessage({ type: CAD_PROGRESS_MESSAGE_TYPE, label });
    } catch {
      // Posting progress is best-effort; never let it break the operation.
    }
  }
}
