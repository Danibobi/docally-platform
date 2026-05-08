import {describe, expect, it} from "vitest";
import {normalizeScanUrl, scanUrlError} from "./url";

describe("normalizeScanUrl", () => {
  it("adds https to bare domains", () => {
    expect(normalizeScanUrl("apple.com")).toEqual({ok: true, url: "https://apple.com/"});
  });

  it("adds https to www domains", () => {
    expect(normalizeScanUrl("www.apple.com")).toEqual({ok: true, url: "https://www.apple.com/"});
  });

  it("preserves http schemes", () => {
    expect(normalizeScanUrl("http://apple.com")).toEqual({ok: true, url: "http://apple.com/"});
  });

  it("preserves https schemes", () => {
    expect(normalizeScanUrl("https://apple.com")).toEqual({ok: true, url: "https://apple.com/"});
  });

  it("trims whitespace", () => {
    expect(normalizeScanUrl("  apple.com  ")).toEqual({ok: true, url: "https://apple.com/"});
  });

  it("rejects invalid input with a clear error", () => {
    expect(normalizeScanUrl("not a url")).toEqual({ok: false, error: scanUrlError});
  });
});
