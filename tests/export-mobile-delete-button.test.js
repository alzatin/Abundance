import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

let Export;
let GlobalVariables;

describe("Export atom mobile delete button", () => {
  beforeEach(async () => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
    vi.stubGlobal("navigator", { userAgent: "Desktop" });
    vi.stubGlobal("window", { innerWidth: 1024 });

    const flowCanvas = {
      style: { display: "block" },
      focus: vi.fn(),
      dispatchEvent: vi.fn(),
    };

    vi.stubGlobal("document", {
      getElementById: vi.fn((id) => (id === "flow-canvas" ? flowCanvas : null)),
    });

    if (!GlobalVariables) {
      GlobalVariables = (await import("../src/js/globalvariables.js")).default;
    }
    if (!Export) {
      Export = (await import("../src/molecules/export.js")).default;
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("adds Delete Selected control on mobile create mode", () => {
    vi.spyOn(GlobalVariables, "isMobile").mockReturnValue(true);

    const atom = new Export({
      x: 0.5,
      y: 0.5,
      uniqueID: GlobalVariables.generateUniqueID(),
    });

    const params = atom.createInputParams(vi.fn());

    expect(params[atom.uniqueID + "delete"]).toBeDefined();
    expect(params[atom.uniqueID + "delete"].label).toBe("Delete Selected");
  });
});
