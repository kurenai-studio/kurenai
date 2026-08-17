//#region src/shared/protocol.ts
const KURENAI_PROTOCOL_VERSION = 1;
function isInspectorMessage(value) {
	if (!value || typeof value !== "object") return false;
	const candidate = value;
	return typeof candidate.type === "string" && candidate.type.startsWith("kurenai:") && candidate.version === 1;
}
function formatSelectionContext(node) {
	const lines = [
		"[Kurenai selected Cocos node]",
		`name: ${node.name}`,
		`path: ${node.path}`,
		`runtimeId: ${node.id}`,
		`active: ${node.active}`,
		`components: ${node.componentTypes.join(", ") || "(none)"}`
	];
	if (node.source?.assetUuid) lines.push(`assetUuid: ${node.source.assetUuid}`);
	if (node.source?.prefabFileId) lines.push(`prefabFileId: ${node.source.prefabFileId}`);
	if (node.source?.componentIndex !== void 0) lines.push(`componentIndex: ${node.source.componentIndex}`);
	return lines.join("\n");
}
//#endregion
export { formatSelectionContext as n, isInspectorMessage as r, KURENAI_PROTOCOL_VERSION as t };

//# sourceMappingURL=protocol-3dNTvjX9.js.map