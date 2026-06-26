import { wrap } from "comlink";

/**
 * Wraps a comlink-based Web Worker with a per-call timeout watchdog.
 *
 * If any call to the CAD worker takes longer than `timeoutMs`, the worker is
 * considered hung: the call (and every other in-flight call) is rejected with a
 * descriptive error, the underlying Worker is terminated, and a fresh Worker is
 * spawned so subsequent calls continue to work.
 *
 * Usage:
 *   const cad = new CadWorkerManager(cadWorker, 120_000);
 *   // Then use `cad` exactly like the plain comlink proxy.
 *
 * The constructor returns a JS Proxy, so every property access that is not an
 * internal manager method is transparently forwarded to the live comlink proxy
 * with a timeout guard.
 */
export class CadWorkerManager {
  /**
   * @param {new () => Worker} WorkerFactory - The Vite `?worker` import (a constructor).
   * @param {number} [timeoutMs=120000] - Milliseconds before a call is considered hung.
   */
  constructor(WorkerFactory, timeoutMs = 120_000) {
    this._WorkerFactory = WorkerFactory;
    this._timeoutMs = timeoutMs;
    /** @type {Array<{reject: Function, timeoutId: ReturnType<typeof setTimeout>}>} */
    this._pendingCalls = [];
    /**
     * Optional callback invoked when the worker is restarted due to a timeout.
     * Assign this from outside (e.g. from AppContent) to show a UI notification.
     * Signature: (message: string) => void
     * @type {((message: string) => void) | null}
     */
    this.onRestartCallback = null;

    this._createWorker();

    // Return a Proxy so that `cad.anyMethod(args)` transparently goes through
    // `_call`.  Internal properties (prefixed with `_` or defined on this class)
    // are returned directly.
    return new Proxy(this, {
      get(target, prop) {
        if (typeof prop === "symbol" || prop in target) {
          return Reflect.get(target, prop);
        }
        // Every unknown property is treated as a remote CAD method.
        return (...args) => target._call(prop, args);
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Internal helpers (these are enumerable on `this`, so the Proxy passes them
  // through rather than routing them to the worker).
  // ---------------------------------------------------------------------------

  _createWorker() {
    this._rawWorker = new this._WorkerFactory();
    this._proxy = wrap(this._rawWorker);
  }

  _emitCadWorkerEvent(type, detail) {
    if (typeof window === "undefined") {
      return;
    }
    window.dispatchEvent(new CustomEvent(type, { detail }));
  }

  _stripTaskMeta(args) {
    if (!Array.isArray(args) || args.length === 0) {
      return { callArgs: args, taskMeta: null };
    }

    const lastArg = args[args.length - 1];
    if (
      lastArg &&
      typeof lastArg === "object" &&
      !Array.isArray(lastArg) &&
      Object.prototype.hasOwnProperty.call(lastArg, "__cadTaskMeta")
    ) {
      const callArgs = args.slice(0, -1);
      return { callArgs, taskMeta: lastArg.__cadTaskMeta || null };
    }

    return { callArgs: args, taskMeta: null };
  }

  _formatTaskLabel(method, taskMeta) {
    if (taskMeta?.displayLabel) {
      return taskMeta.displayLabel;
    }

    const atomType = taskMeta?.atomType || String(method);
    const moleculeName = taskMeta?.moleculeName;
    return moleculeName ? `${moleculeName}/${atomType}` : atomType;
  }

  /**
   * Start timeout and progress-logging timers for an entry that is now
   * actively being processed by the worker.
   */
  _startTimers(entry) {
    entry.startTime = Date.now();
    this._emitCadWorkerEvent("cad-worker-task-start", {
      taskId: entry.taskId,
      method: String(entry.method),
      queuedAt: entry.queuedAt,
      startedAt: entry.startTime,
      queueWaitMs: entry.startTime - entry.queuedAt,
      queueDepth: Math.max(this._pendingCalls.indexOf(entry), 0),
      atomId: entry.taskMeta?.atomId || null,
      atomType: entry.taskMeta?.atomType || null,
      moleculeName: entry.taskMeta?.moleculeName || null,
      displayLabel: this._formatTaskLabel(entry.method, entry.taskMeta),
    });

    // Log progress every 5 seconds so it's visible in the console.
    entry.progressIntervalId = setInterval(() => {
      const elapsed = Math.round((Date.now() - entry.startTime) / 1000);
      const remaining = Math.round(
        (this._timeoutMs - (Date.now() - entry.startTime)) / 1000,
      );

    }, 5000);

    entry.timeoutId = setTimeout(() => {
      clearInterval(entry.progressIntervalId);
      entry.progressIntervalId = null;
      const elapsed = Math.round((Date.now() - entry.startTime) / 1000);

      this._pendingCalls = this._pendingCalls.filter((c) => c !== entry);
      this._emitCadWorkerEvent("cad-worker-task-error", {
        taskId: entry.taskId,
        method: String(entry.method),
        queuedAt: entry.queuedAt,
        startedAt: entry.startTime,
        failedAt: Date.now(),
        durationMs: entry.startTime ? Date.now() - entry.startTime : null,
        queueWaitMs: entry.startTime ? entry.startTime - entry.queuedAt : null,
        queueDepth: this._pendingCalls.length,
        atomId: entry.taskMeta?.atomId || null,
        atomType: entry.taskMeta?.atomType || null,
        moleculeName: entry.taskMeta?.moleculeName || null,
        displayLabel: this._formatTaskLabel(entry.method, entry.taskMeta),
        error: `CAD worker timed out on "${String(entry.method)}" after ${this._timeoutMs}ms`,
      });
      entry.reject(
        new Error(
          `CAD worker timed out on "${String(entry.method)}" after ${this._timeoutMs}ms`,
        ),
      );
      this._restartWorker();
    }, this._timeoutMs);
  }

  /**
   * If there are queued calls waiting, start timers for the next one
   * (which is now the actively processing call).
   */
  _activateNextCall() {
    if (this._pendingCalls.length > 0) {
      const next = this._pendingCalls[0];
      if (next.startTime === null) {
        this._startTimers(next);
      }
    }
  }

  /**
   * Dispatch a call to the live comlink proxy, racing against the timeout.
   * The timeout and progress timers only start when this call is the one
   * actively being processed by the worker (i.e. first in the queue).
   * @param {string|symbol} method
   * @param {unknown[]} args
   * @returns {Promise<unknown>}
   */
  _call(method, args) {
    return new Promise((resolve, reject) => {
      const taskId = `cad-task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const queuedAt = Date.now();
      const { callArgs, taskMeta } = this._stripTaskMeta(args);

      const entry = {
        reject,
        timeoutId: null,
        progressIntervalId: null,
        method,
        startTime: null,
        taskId,
        queuedAt,
        taskMeta,
      };

      this._pendingCalls.push(entry);
      this._emitCadWorkerEvent("cad-worker-task-queued", {
        taskId,
        method: String(method),
        queuedAt,
        queueDepth: Math.max(this._pendingCalls.length - 1, 0),
        atomId: taskMeta?.atomId || null,
        atomType: taskMeta?.atomType || null,
        moleculeName: taskMeta?.moleculeName || null,
        displayLabel: this._formatTaskLabel(method, taskMeta),
      });

      // Only start timers if this is the currently processing call
      // (no other call ahead of it in the queue).
      if (this._pendingCalls[0] === entry) {
        this._startTimers(entry);
      }

      const cleanup = () => {
        clearInterval(entry.progressIntervalId);
        entry.progressIntervalId = null;
        clearTimeout(entry.timeoutId);
        entry.timeoutId = null;
      };

      this._proxy[method](...callArgs).then(
        (result) => {
          cleanup();
          this._pendingCalls = this._pendingCalls.filter((c) => c !== entry);
          const finishedAt = Date.now();
          this._emitCadWorkerEvent("cad-worker-task-finish", {
            taskId: entry.taskId,
            method: String(entry.method),
            queuedAt: entry.queuedAt,
            startedAt: entry.startTime,
            finishedAt,
            durationMs: entry.startTime ? finishedAt - entry.startTime : null,
            queueWaitMs: entry.startTime ? entry.startTime - entry.queuedAt : null,
            queueDepth: this._pendingCalls.length,
            atomId: entry.taskMeta?.atomId || null,
            atomType: entry.taskMeta?.atomType || null,
            moleculeName: entry.taskMeta?.moleculeName || null,
            displayLabel: this._formatTaskLabel(entry.method, entry.taskMeta),
          });
          this._activateNextCall();
          resolve(result);
        },
        (err) => {
          cleanup();
          this._pendingCalls = this._pendingCalls.filter((c) => c !== entry);
          const failedAt = Date.now();
          this._emitCadWorkerEvent("cad-worker-task-error", {
            taskId: entry.taskId,
            method: String(entry.method),
            queuedAt: entry.queuedAt,
            startedAt: entry.startTime,
            failedAt,
            durationMs: entry.startTime ? failedAt - entry.startTime : null,
            queueWaitMs: entry.startTime ? entry.startTime - entry.queuedAt : null,
            queueDepth: this._pendingCalls.length,
            atomId: entry.taskMeta?.atomId || null,
            atomType: entry.taskMeta?.atomType || null,
            moleculeName: entry.taskMeta?.moleculeName || null,
            displayLabel: this._formatTaskLabel(entry.method, entry.taskMeta),
            error: err?.message || String(err),
          });
          this._activateNextCall();
          reject(err);
        },
      );
    });
  }

  /**
   * Cancel all in-flight calls immediately (e.g. on project switch).
   * Clears progress logs, timeouts, and rejects all pending promises.
   */
  cancelAll() {
    if (this._pendingCalls.length === 0) return;
    const pending = [...this._pendingCalls];
    this._pendingCalls = [];
    pending.forEach((entry) => {
      clearInterval(entry.progressIntervalId);
      clearTimeout(entry.timeoutId);
      this._emitCadWorkerEvent("cad-worker-task-cancelled", {
        taskId: entry.taskId,
        method: String(entry.method),
        queuedAt: entry.queuedAt,
        cancelledAt: Date.now(),
        atomId: entry.taskMeta?.atomId || null,
        atomType: entry.taskMeta?.atomType || null,
        moleculeName: entry.taskMeta?.moleculeName || null,
        displayLabel: this._formatTaskLabel(entry.method, entry.taskMeta),
      });
      // Suppress the rejection — callers are expected to add .catch() for this
      // case. Using Promise.resolve().then() to defer so any existing .then()
      // handlers have a chance to attach a .catch() before the rejection fires.
      Promise.resolve().then(() =>
        entry.reject(
          Object.assign(new Error("CAD call cancelled due to project switch"), {
            cancelled: true,
          }),
        ),
      );
    });
  }

  /**
   * Terminate the hung worker, reject all in-flight calls, and create a fresh
   * worker so the app can continue without a page reload.
   */
  _restartWorker() {
    console.warn(
      "[CadWorkerManager] CAD worker appears hung — terminating and restarting.",
    );

    try {
      this._rawWorker.terminate();
    } catch (e) {
      console.error("[CadWorkerManager] Error while terminating worker:", e);
    }

    // Reject every other pending call so callers get a clear error instead of
    // hanging forever.
    const pending = [...this._pendingCalls];
    this._pendingCalls = [];
    pending.forEach((entry) => {
      clearInterval(entry.progressIntervalId);
      clearTimeout(entry.timeoutId);
      this._emitCadWorkerEvent("cad-worker-task-error", {
        taskId: entry.taskId,
        method: String(entry.method),
        queuedAt: entry.queuedAt,
        failedAt: Date.now(),
        atomId: entry.taskMeta?.atomId || null,
        atomType: entry.taskMeta?.atomType || null,
        moleculeName: entry.taskMeta?.moleculeName || null,
        displayLabel: this._formatTaskLabel(entry.method, entry.taskMeta),
        error: "CAD worker restarted because another call timed out",
      });
      entry.reject(
        new Error("CAD worker was restarted because another call timed out"),
      );
    });

    this._createWorker();
    this._emitCadWorkerEvent("cad-worker-restarted", {
      restartedAt: Date.now(),
      reason: "timeout",
    });

    if (this.onRestartCallback) {
      this.onRestartCallback(
        "The geometry worker timed out and was restarted. Please re-run any affected atoms.",
      );
    }
  }
}
