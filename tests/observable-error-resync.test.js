import { describe, it, expect, vi } from "vitest";
import { ObservableEntity, Status } from "../src/prototypes/observableEntity.js";

/**
 * Regression tests for the terminal-error re-sync in ObservableEntity.setStatus.
 *
 * Bug: under concurrent load a subscriber (e.g. a molecule deriving its status
 * from its output atom) could latch a transient non-terminal state while the
 * source was mid-recompute, and then the source re-settled to the SAME error it
 * already held. The equality guard coalesced that re-settle, so the subscriber
 * was never re-notified and stayed stuck forever (worker idle, atom stuck
 * "processing"/"waiting").
 *
 * Fix: a no-op re-assertion of ERROR / UPSTREAM_ERROR still propagates to
 * subscribers, so a diverged subscriber re-evaluates and converges. READY /
 * PROCESSING / WAITING keep coalescing (re-propagating READY would retrigger
 * async worker recomputes).
 */
describe("ObservableEntity terminal-error re-sync", () => {
  it("re-propagates a no-op UPSTREAM_ERROR re-assertion to subscribers", () => {
    const source = new ObservableEntity();
    const cb = vi.fn();
    source.subscribe(cb, "sub", false);

    source.setUpstreamError(); // first transition DISABLED -> UPSTREAM_ERROR
    expect(source.status).toBe(Status.UPSTREAM_ERROR);
    expect(cb).toHaveBeenCalledTimes(1);

    source.setUpstreamError(); // re-assertion (no net change)
    expect(cb).toHaveBeenCalledTimes(2); // still delivered
  });

  it("re-propagates a no-op ERROR re-assertion to subscribers", () => {
    const source = new ObservableEntity();
    const cb = vi.fn();
    source.subscribe(cb, "sub", false);

    source.setError();
    source.setError();
    expect(source.status).toBe(Status.ERROR);
    expect(cb).toHaveBeenCalledTimes(2);
  });

  it("does NOT re-propagate a no-op READY re-assertion (avoids recompute storms)", () => {
    const source = new ObservableEntity();
    const cb = vi.fn();
    source.subscribe(cb, "sub", false);

    const value = { geometry: 1 };
    source.setReady(value);
    expect(cb).toHaveBeenCalledTimes(1);

    source.setReady(value); // same reference, same status
    expect(cb).toHaveBeenCalledTimes(1); // coalesced
  });

  it("does NOT re-propagate a no-op WAITING or PROCESSING re-assertion", () => {
    const source = new ObservableEntity();
    const cb = vi.fn();
    source.subscribe(cb, "sub", false);

    source.setWaiting();
    source.setWaiting();
    expect(cb).toHaveBeenCalledTimes(1);

    const cb2 = vi.fn();
    const source2 = new ObservableEntity();
    source2.subscribe(cb2, "sub", false);
    source2.setProcessing();
    source2.setProcessing();
    expect(cb2).toHaveBeenCalledTimes(1);
  });

  it("lets a diverged subscriber converge to error on the source's error re-assertion", () => {
    // Model an output atom (source) and a molecule-like subscriber that derives
    // its own status from the source whenever notified.
    const output = new ObservableEntity();
    const molecule = new ObservableEntity();

    // The molecule re-derives its status from the output atom on every edge,
    // exactly like Molecule.onUpstreamChange reading getOutputAtom().getState().
    const deriveFromOutput = () => {
      const s = output.getState().status;
      if (s === Status.UPSTREAM_ERROR || s === Status.ERROR) {
        molecule.setUpstreamError();
      } else if (s === Status.READY) {
        molecule.setReady(output.getState().value);
      } else {
        molecule.setProcessing();
      }
    };
    output.subscribe(deriveFromOutput, molecule /* id */, false);

    // 1) Output errors while, due to churn ordering, the molecule happens to
    //    have latched PROCESSING (simulate the transient divergence directly).
    output.setUpstreamError();
    molecule.setProcessing(); // molecule diverges: stuck non-terminal

    expect(output.status).toBe(Status.UPSTREAM_ERROR);
    expect(molecule.status).toBe(Status.PROCESSING); // diverged

    // 2) During ongoing load churn the output's errored input re-asserts, so the
    //    output re-asserts the SAME error. Pre-fix this was coalesced and the
    //    molecule stayed stuck; post-fix it is delivered and the molecule
    //    converges to the error.
    output.setUpstreamError();

    expect(molecule.status).toBe(Status.UPSTREAM_ERROR);
  });
});
