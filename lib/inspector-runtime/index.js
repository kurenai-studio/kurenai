import "../protocol-3dNTvjX9.js";
//#region src/inspector-runtime/index.ts
function installInspectorRuntime(options = {}) {
	const cc = options.cocos ?? globalThis.cc;
	if (!cc?.director) throw new Error("Kurenai Inspector Runtime requires the Cocos `cc` runtime");
	const targetWindow = options.targetWindow ?? window.parent;
	const canvas = resolveCanvas(cc);
	const highlight = createHighlight();
	let pickMode = false;
	const post = (message) => {
		targetWindow.postMessage({
			...message,
			version: 1
		}, "*");
	};
	const scene = () => cc.director.getScene?.() ?? null;
	const refresh = () => {
		const root = scene();
		post({
			type: "kurenai:scene-tree",
			root: root ? summarizeNode(root, root.name || "Scene") : null
		});
	};
	const select = (nodeId) => {
		const root = scene();
		const node = root ? findNode(root, nodeId) : void 0;
		node?.uuid ?? node?._id;
		renderHighlight(cc, canvas, highlight, node);
		post({
			type: "kurenai:selection",
			node: node ? selectedNode(node) : null
		});
	};
	const setPickMode = (enabled) => {
		pickMode = enabled;
		canvas.style.cursor = enabled ? "crosshair" : "";
	};
	const onMessage = (event) => {
		if (event.source !== targetWindow) return;
		const message = event.data;
		if (!message || message.version !== 1) return;
		if (message.type === "kurenai:request-scene-tree") refresh();
		if (message.type === "kurenai:select-node") select(message.nodeId);
		if (message.type === "kurenai:set-pick-mode") setPickMode(message.enabled);
	};
	const onPointerDown = (event) => {
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
		sceneName: scene()?.name
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
		}
	};
}
function summarizeNode(node, path) {
	return {
		id: String(node.uuid ?? node._id ?? path),
		name: String(node.name ?? "Node"),
		path,
		active: node.active !== false,
		componentTypes: componentTypes(node),
		children: (node.children ?? []).map((child) => summarizeNode(child, `${path}/${String(child.name ?? "Node")}`))
	};
}
function selectedNode(node) {
	const prefab = node._prefab;
	const asset = prefab?.asset;
	const source = {};
	if (asset?._uuid) source.assetUuid = String(asset._uuid);
	if (prefab?.fileId) source.prefabFileId = String(prefab.fileId);
	const result = {
		id: String(node.uuid ?? node._id),
		name: String(node.name ?? "Node"),
		path: nodePath(node),
		active: node.active !== false,
		componentTypes: componentTypes(node)
	};
	if (Object.keys(source).length) result.source = source;
	return result;
}
function componentTypes(node) {
	return (node.components ?? []).map((component) => String(component.constructor?.__classname__ ?? component.__classname__ ?? component.constructor?.name ?? "Component"));
}
function nodePath(node) {
	const parts = [];
	let current = node;
	while (current) {
		parts.push(String(current.name ?? "Node"));
		current = current.parent ?? null;
	}
	return parts.reverse().join("/");
}
function findNode(root, id) {
	if (String(root.uuid ?? root._id) === id) return root;
	for (const child of root.children ?? []) {
		const match = findNode(child, id);
		if (match) return match;
	}
}
function resolveCanvas(cc) {
	const candidate = cc.game?.canvas ?? document.querySelector("#GameCanvas") ?? document.querySelector("canvas");
	if (!(candidate instanceof HTMLCanvasElement)) throw new Error("Kurenai Inspector Runtime could not find the Cocos canvas");
	return candidate;
}
function createHighlight() {
	const element = document.createElement("div");
	element.dataset.kurenaiHighlight = "true";
	Object.assign(element.style, {
		position: "fixed",
		zIndex: "2147483646",
		pointerEvents: "none",
		border: "2px solid #d33b4f",
		background: "rgba(211, 59, 79, .12)",
		display: "none"
	});
	document.body.appendChild(element);
	return element;
}
function pickUiNode(cc, canvas, root, clientX, clientY) {
	if (!root) return void 0;
	const point = clientToCocosPoint(cc, canvas, clientX, clientY);
	const candidates = [];
	walk(root, 0, (node, depth) => {
		if (node.activeInHierarchy === false) return;
		const rect = getUiTransform(cc, node)?.getBoundingBoxToWorld?.();
		if (!rect || !contains(rect, point.x, point.y)) return;
		candidates.push({
			node,
			area: Math.abs(Number(rect.width) * Number(rect.height)),
			depth
		});
	});
	candidates.sort((left, right) => right.depth - left.depth || left.area - right.area);
	return candidates[0]?.node;
}
function renderHighlight(cc, canvas, element, node) {
	const rect = (node ? getUiTransform(cc, node) : void 0)?.getBoundingBoxToWorld?.();
	if (!rect) {
		element.style.display = "none";
		return;
	}
	const canvasRect = canvas.getBoundingClientRect();
	const visible = visibleRect(cc, canvas);
	const left = canvasRect.left + (rect.x - visible.x) / visible.width * canvasRect.width;
	const top = canvasRect.top + (1 - (rect.y + rect.height - visible.y) / visible.height) * canvasRect.height;
	const width = rect.width / visible.width * canvasRect.width;
	const height = rect.height / visible.height * canvasRect.height;
	Object.assign(element.style, {
		display: "block",
		left: `${left}px`,
		top: `${top}px`,
		width: `${width}px`,
		height: `${height}px`
	});
}
function getUiTransform(cc, node) {
	const ctor = cc.UITransform;
	return ctor ? node.getComponent?.(ctor) : void 0;
}
function clientToCocosPoint(cc, canvas, clientX, clientY) {
	const bounds = canvas.getBoundingClientRect();
	const visible = visibleRect(cc, canvas);
	return {
		x: visible.x + (clientX - bounds.left) / bounds.width * visible.width,
		y: visible.y + (1 - (clientY - bounds.top) / bounds.height) * visible.height
	};
}
function visibleRect(cc, canvas) {
	const size = cc.view?.getVisibleSize?.();
	const origin = cc.view?.getVisibleOrigin?.();
	return {
		x: Number(origin?.x ?? 0),
		y: Number(origin?.y ?? 0),
		width: Number(size?.width ?? canvas.width),
		height: Number(size?.height ?? canvas.height)
	};
}
function contains(rect, x, y) {
	return x >= Number(rect.x) && x <= Number(rect.x) + Number(rect.width) && y >= Number(rect.y) && y <= Number(rect.y) + Number(rect.height);
}
function walk(node, depth, visit) {
	visit(node, depth);
	for (const child of node.children ?? []) walk(child, depth + 1, visit);
}
//#endregion
export { installInspectorRuntime };

//# sourceMappingURL=index.js.map