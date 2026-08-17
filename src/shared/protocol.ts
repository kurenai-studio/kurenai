export const KURENAI_PROTOCOL_VERSION = 1;

export interface SceneNodeSummary {
  id: string;
  name: string;
  path: string;
  active: boolean;
  componentTypes: string[];
  children: SceneNodeSummary[];
}

export interface SelectedNodeSummary {
  id: string;
  name: string;
  path: string;
  active: boolean;
  componentTypes: string[];
  source?: {
    assetUuid?: string;
    prefabFileId?: string;
    componentIndex?: number;
  };
}

export type InspectorToHostMessage =
  | {
      type: "kurenai:ready";
      version: number;
      sceneName?: string;
    }
  | {
      type: "kurenai:scene-tree";
      version: number;
      root: SceneNodeSummary | null;
    }
  | {
      type: "kurenai:selection";
      version: number;
      node: SelectedNodeSummary | null;
    }
  | {
      type: "kurenai:error";
      version: number;
      message: string;
    };

export type HostToInspectorMessage =
  | {
      type: "kurenai:request-scene-tree";
      version: number;
    }
  | {
      type: "kurenai:select-node";
      version: number;
      nodeId: string;
    }
  | {
      type: "kurenai:set-pick-mode";
      version: number;
      enabled: boolean;
    };

export function isInspectorMessage(value: unknown): value is InspectorToHostMessage {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { type?: unknown; version?: unknown };
  return (
    typeof candidate.type === "string" &&
    candidate.type.startsWith("kurenai:") &&
    candidate.version === KURENAI_PROTOCOL_VERSION
  );
}

export function formatSelectionContext(node: SelectedNodeSummary): string {
  const lines = [
    "[Kurenai selected Cocos node]",
    `name: ${node.name}`,
    `path: ${node.path}`,
    `runtimeId: ${node.id}`,
    `active: ${node.active}`,
    `components: ${node.componentTypes.join(", ") || "(none)"}`,
  ];
  if (node.source?.assetUuid) lines.push(`assetUuid: ${node.source.assetUuid}`);
  if (node.source?.prefabFileId) {
    lines.push(`prefabFileId: ${node.source.prefabFileId}`);
  }
  if (node.source?.componentIndex !== undefined) {
    lines.push(`componentIndex: ${node.source.componentIndex}`);
  }
  return lines.join("\n");
}
