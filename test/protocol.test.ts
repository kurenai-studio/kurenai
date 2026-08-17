import { describe, expect, it } from "vitest";
import {
  KURENAI_PROTOCOL_VERSION,
  formatSelectionContext,
  isInspectorMessage,
} from "../src/shared/protocol.js";

describe("Inspector protocol", () => {
  it("accepts only the current version", () => {
    expect(
      isInspectorMessage({
        type: "kurenai:ready",
        version: KURENAI_PROTOCOL_VERSION,
      }),
    ).toBe(true);
    expect(
      isInspectorMessage({ type: "kurenai:ready", version: 999 }),
    ).toBe(false);
    expect(isInspectorMessage({ type: "other", version: 1 })).toBe(false);
  });

  it("formats deterministic chat context", () => {
    expect(
      formatSelectionContext({
        id: "runtime-1",
        name: "CTA",
        path: "Scene/Canvas/CTA",
        active: true,
        componentTypes: ["UITransform", "Button"],
        source: {
          assetUuid: "asset-1",
          prefabFileId: "file-7",
        },
      }),
    ).toContain("path: Scene/Canvas/CTA");
  });
});
