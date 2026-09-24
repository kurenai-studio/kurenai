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
      // Importing "cc" before the engine bundle has registered it makes
      // SystemJS cache a load failure that then breaks the game's own import.
      // Wait until the game has started the engine and loaded a scene.
      const legacy = (globalThis as { cc?: { director?: { getScene?(): unknown } } }).cc;
      if (!legacy?.director?.getScene?.()) {
        await new Promise((done) => setTimeout(done, 250));
        continue;
      }
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
