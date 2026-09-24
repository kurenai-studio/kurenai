import { describe, expect, it } from "vitest";
import { injectInspector, routeServerUrlThroughBridge } from "../src/preview/bridge.js";

describe("PreviewBridge html rewriting", () => {
  it("points the cocos-cli server url at the bridge origin", () => {
    const html = "<script>window.WebEnv = { serverURL: 'http://127.0.0.1:7470' };</script>";
    expect(routeServerUrlThroughBridge(html)).toBe(
      "<script>window.WebEnv = { serverURL: location.origin };</script>",
    );
  });

  it("injects the inspector once before </body>", () => {
    const once = injectInspector("<body><canvas></canvas></body>");
    expect(once).toBe(
      '<body><canvas></canvas><script src="/__kurenai/inspector.js"></script></body>',
    );
    expect(injectInspector(once)).toBe(once);
  });
});
