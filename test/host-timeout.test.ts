import { describe, expect, it } from "vitest";
import {
  DEFAULT_HOST_READY_TIMEOUT_MS,
  resolveHostReadyTimeoutMs,
} from "../src/preview/timeout.js";

describe("resolveHostReadyTimeoutMs", () => {
  it("defaults to 10 minutes", () => {
    expect(resolveHostReadyTimeoutMs({}, {})).toBe(DEFAULT_HOST_READY_TIMEOUT_MS);
    expect(DEFAULT_HOST_READY_TIMEOUT_MS).toBe(600_000);
  });

  it("prefers explicit ms, then --timeout seconds, then env", () => {
    expect(resolveHostReadyTimeoutMs({ readinessTimeoutMs: 12_000 }, {})).toBe(12_000);
    expect(resolveHostReadyTimeoutMs({ timeout: "90" }, {})).toBe(90_000);
    expect(
      resolveHostReadyTimeoutMs({}, { KURENAI_HOST_READY_TIMEOUT_MS: "45000" }),
    ).toBe(45_000);
  });
});
