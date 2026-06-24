import { describe, expect, it } from "vitest";

import { getOAuthRedirectUri } from "../src/js/authRedirect.js";

describe("getOAuthRedirectUri", () => {
  it("uses the configured callback URI when it is already exact", () => {
    expect(
      getOAuthRedirectUri(
        "https://abundance.maslowcnc.com/callback",
        "http://localhost:4444",
      ),
    ).toBe("https://abundance.maslowcnc.com/callback");
  });

  it("normalizes a configured site URL to the callback route", () => {
    expect(
      getOAuthRedirectUri(
        "http://localhost:4444/",
        "https://abundance.maslowcnc.com",
      ),
    ).toBe("http://localhost:4444/callback");
  });

  it("falls back to the current origin when no redirect URI is configured", () => {
    expect(getOAuthRedirectUri(undefined, "https://abundance.maslowcnc.com")).toBe(
      "https://abundance.maslowcnc.com/callback",
    );
  });
});
