import { installInspectorRuntime } from "./index.js";

declare global {
  interface Window {
    System?: {
      import(id: string): Promise<Record<string, unknown>>;
    };
    __kurenaiInspector?: ReturnType<typeof installInspectorRuntime>;
  }
}

void boot();

async function boot(): Promise<void> {
  const deadline = Date.now() + 60_000;
  let cocos: Record<string, unknown> | undefined;

  while (Date.now() < deadline) {
    try {
      cocos ??= await window.System?.import("cc");
      const director = cocos?.director as
        | { getScene?(): unknown }
        | undefined;
      if (cocos && director?.getScene?.() && document.querySelector("canvas")) {
        window.__kurenaiInspector?.dispose();
        window.__kurenaiInspector = installInspectorRuntime({ cocos });
        return;
      }
    } catch {
      // Cocos and the launch scene become available asynchronously.
    }
    await new Promise((done) => setTimeout(done, 250));
  }

  window.parent.postMessage(
    {
      type: "kurenai:error",
      version: 1,
      message: "Inspector Runtime timed out waiting for the Cocos scene",
    },
    "*",
  );
}
