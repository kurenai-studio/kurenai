import {
  KURENAI_PROTOCOL_VERSION,
  type HostToInspectorMessage,
  type SceneNodeSummary,
  type SelectedNodeSummary,
} from "../shared/protocol.js";

type AnyRecord = Record<string, any>;

export interface InspectorRuntime {
  refresh(): void;
  select(nodeId: string): void;
  setPickMode(enabled: boolean): void;
  dispose(): void;
}

export interface InspectorRuntimeOptions {
  cocos?: AnyRecord;
  targetWindow?: Window;
}

export function installInspectorRuntime(
  options: InspectorRuntimeOptions = {},
): InspectorRuntime {
  const cc = options.cocos ?? (globalThis as AnyRecord).cc;
  if (!cc?.director) {
    throw new Error("Kurenai Inspector Runtime requires the Cocos `cc` runtime");
  }

  const targetWindow = options.targetWindow ?? window.parent;
  const canvas = resolveCanvas(cc);
  const highlight = createHighlight();
  let pickMode = false;
  let selectedId: string | undefined;

  const post = (message: Record<string, unknown>): void => {
    targetWindow.postMessage(
      { ...message, version: KURENAI_PROTOCOL_VERSION },
      "*",
    );
  };

  const scene = (): AnyRecord | null => cc.director.getScene?.() ?? null;

  const refresh = (): void => {
    const root = scene();
    post({
      type: "kurenai:scene-tree",
      root: root ? summarizeNode(root, root.name || "Scene") : null,
    });
  };

  const select = (nodeId: string): void => {
    const root = scene();
    const node = root ? findNode(root, nodeId) : undefined;
    selectedId = node?.uuid ?? node?._id;
    renderHighlight(cc, canvas, highlight, node);
    post({
      type: "kurenai:selection",
      node: node ? selectedNode(node) : null,
    });
  };

  const setPickMode = (enabled: boolean): void => {
    pickMode = enabled;
    canvas.style.cursor = enabled ? "crosshair" : "";
  };

  const onMessage = (event: MessageEvent<HostToInspectorMessage>): void => {
    if (event.source !== targetWindow) return;
    const message = event.data;
    if (!message || message.version !== KURENAI_PROTOCOL_VERSION) return;
    if (message.type === "kurenai:request-scene-tree") refresh();
    if (message.type === "kurenai:select-node") select(message.nodeId);
    if (message.type === "kurenai:set-pick-mode") setPickMode(message.enabled);
  };

  const onPointerDown = (event: PointerEvent): void => {
    if (!pickMode) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const node = pickUiNode(cc, canvas, scene(), event.clientX, event.clientY);
    if (node) select(node.uuid ?? node._id);
  };

  window.addEventListener("message", onMessage);
  canvas.addEventListener("pointerdown", onPointerDown, true);

  post({
    type: "kurenai:ready",
    sceneName: scene()?.name,
  });
  refresh();

  return {
    refresh,
    select,
    setPickMode,
    dispose() {
      window.removeEventListener("message", onMessage);
      canvas.removeEventListener("pointerdown", onPointerDown, true);
      highlight.remove();
      canvas.style.cursor = "";
      selectedId = undefined;
    },
  };
}

function summarizeNode(node: AnyRecord, path: string): SceneNodeSummary {
  return {
    id: String(node.uuid ?? node._id ?? path),
    name: String(node.name ?? "Node"),
    path,
    active: node.active !== false,
    componentTypes: componentTypes(node),
    children: (node.children ?? []).map((child: AnyRecord) =>
      summarizeNode(child, `${path}/${String(child.name ?? "Node")}`),
    ),
  };
}

function selectedNode(node: AnyRecord): SelectedNodeSummary {
  const prefab = node._prefab as AnyRecord | undefined;
  const asset = prefab?.asset as AnyRecord | undefined;
  const source: NonNullable<SelectedNodeSummary["source"]> = {};
  if (asset?._uuid) source.assetUuid = String(asset._uuid);
  if (prefab?.fileId) source.prefabFileId = String(prefab.fileId);

  const result: SelectedNodeSummary = {
    id: String(node.uuid ?? node._id),
    name: String(node.name ?? "Node"),
    path: nodePath(node),
    active: node.active !== false,
    componentTypes: componentTypes(node),
  };
  if (Object.keys(source).length) result.source = source;
  return result;
}

function componentTypes(node: AnyRecord): string[] {
  return (node.components ?? []).map((component: AnyRecord) =>
    String(
      (component.constructor as AnyRecord | undefined)?.__classname__ ??
        component.__classname__ ??
        component.constructor?.name ??
        "Component",
    ),
  );
}

function nodePath(node: AnyRecord): string {
  const parts: string[] = [];
  let current: AnyRecord | null = node;
  while (current) {
    parts.push(String(current.name ?? "Node"));
    current = current.parent ?? null;
  }
  return parts.reverse().join("/");
}

function findNode(root: AnyRecord, id: string): AnyRecord | undefined {
  if (String(root.uuid ?? root._id) === id) return root;
  for (const child of root.children ?? []) {
    const match = findNode(child, id);
    if (match) return match;
  }
  return undefined;
}

function resolveCanvas(cc: AnyRecord): HTMLCanvasElement {
  const candidate =
    cc.game?.canvas ??
    document.querySelector<HTMLCanvasElement>("#GameCanvas") ??
    document.querySelector<HTMLCanvasElement>("canvas");
  if (!(candidate instanceof HTMLCanvasElement)) {
    throw new Error("Kurenai Inspector Runtime could not find the Cocos canvas");
  }
  return candidate;
}

function createHighlight(): HTMLDivElement {
  const element = document.createElement("div");
  element.dataset.kurenaiHighlight = "true";
  Object.assign(element.style, {
    position: "fixed",
    zIndex: "2147483646",
    pointerEvents: "none",
    border: "2px solid #d33b4f",
    background: "rgba(211, 59, 79, .12)",
    display: "none",
  });
  document.body.appendChild(element);
  return element;
}

function pickUiNode(
  cc: AnyRecord,
  canvas: HTMLCanvasElement,
  root: AnyRecord | null,
  clientX: number,
  clientY: number,
): AnyRecord | undefined {
  if (!root) return undefined;
  const point = clientToCocosPoint(cc, canvas, clientX, clientY);
  const candidates: Array<{ node: AnyRecord; area: number; depth: number }> = [];

  walk(root, 0, (node, depth) => {
    if (node.activeInHierarchy === false) return;
    const transform = getUiTransform(cc, node);
    const rect = transform?.getBoundingBoxToWorld?.();
    if (!rect || !contains(rect, point.x, point.y)) return;
    candidates.push({
      node,
      area: Math.abs(Number(rect.width) * Number(rect.height)),
      depth,
    });
  });

  candidates.sort((left, right) => right.depth - left.depth || left.area - right.area);
  return candidates[0]?.node;
}

function renderHighlight(
  cc: AnyRecord,
  canvas: HTMLCanvasElement,
  element: HTMLDivElement,
  node: AnyRecord | undefined,
): void {
  const transform = node ? getUiTransform(cc, node) : undefined;
  const rect = transform?.getBoundingBoxToWorld?.();
  if (!rect) {
    element.style.display = "none";
    return;
  }
  const canvasRect = canvas.getBoundingClientRect();
  const visible = visibleRect(cc, canvas);
  const left = canvasRect.left + ((rect.x - visible.x) / visible.width) * canvasRect.width;
  const top =
    canvasRect.top +
    (1 - (rect.y + rect.height - visible.y) / visible.height) * canvasRect.height;
  const width = (rect.width / visible.width) * canvasRect.width;
  const height = (rect.height / visible.height) * canvasRect.height;
  Object.assign(element.style, {
    display: "block",
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
  });
}

function getUiTransform(cc: AnyRecord, node: AnyRecord): AnyRecord | undefined {
  const ctor = cc.UITransform;
  return ctor ? node.getComponent?.(ctor) : undefined;
}

function clientToCocosPoint(
  cc: AnyRecord,
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  const bounds = canvas.getBoundingClientRect();
  const visible = visibleRect(cc, canvas);
  return {
    x: visible.x + ((clientX - bounds.left) / bounds.width) * visible.width,
    y:
      visible.y +
      (1 - (clientY - bounds.top) / bounds.height) * visible.height,
  };
}

function visibleRect(
  cc: AnyRecord,
  canvas: HTMLCanvasElement,
): { x: number; y: number; width: number; height: number } {
  const size = cc.view?.getVisibleSize?.();
  const origin = cc.view?.getVisibleOrigin?.();
  return {
    x: Number(origin?.x ?? 0),
    y: Number(origin?.y ?? 0),
    width: Number(size?.width ?? canvas.width),
    height: Number(size?.height ?? canvas.height),
  };
}

function contains(rect: AnyRecord, x: number, y: number): boolean {
  return (
    x >= Number(rect.x) &&
    x <= Number(rect.x) + Number(rect.width) &&
    y >= Number(rect.y) &&
    y <= Number(rect.y) + Number(rect.height)
  );
}

function walk(
  node: AnyRecord,
  depth: number,
  visit: (node: AnyRecord, depth: number) => void,
): void {
  visit(node, depth);
  for (const child of node.children ?? []) walk(child, depth + 1, visit);
}
