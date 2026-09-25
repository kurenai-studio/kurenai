import { ChildProcessWithoutNullStreams, spawn } from "node:child_process";
//#region src/cocos/paths.d.ts
/** Historical PinK full install (transitional fallback only). */
declare const LEGACY_PINK_COCOS_CLI_ROOT: string;
/** Default engine version for the trimmed kurenai-managed core pack. */
declare const KURENAI_COCOS_CORE_VERSION = "4.0.0-alpha.33";
/** Kurenai-owned trimmed core install root (preferred). */
declare function managedCocosCoreRoot(version?: string): string;
/**
 * @deprecated Use resolveCocosCliRoot(); kept as the legacy PinK path name for
 * older call sites / docs that still mention DEFAULT_COCOS_CLI_ROOT.
 */
declare const DEFAULT_COCOS_CLI_ROOT: string;
/**
 * Resolve the cocos runtime root used by host / publish.
 *
 * Order:
 * 1. explicit `configured` or `KURENAI_COCOS_CLI_ROOT`
 * 2. kurenai-managed trimmed core (`…/kurenai/cocos-core/<version>`)
 * 3. legacy PinK full install (temporary bridge)
 */
declare function resolveCocosCliRoot(configured?: string): string;
//#endregion
//#region src/cocos/packs.d.ts
type PackId = string;
type PackPresence = {
  id: PackId;
  present: boolean;
  paths: string[];
  missingPaths: string[];
};
type PacksStatus = {
  root: string;
  layout: "missing" | "core-or-full" | "unknown";
  packs: PackPresence[];
  hasNative: boolean;
  platformPacksPresent: string[];
};
type EnsurePacksResult = {
  root: string;
  required: PackId[];
  alreadyPresent: PackId[];
  installed: PackId[];
  missing: PackId[];
};
declare function listKnownPackIds(root?: string): PackId[];
/**
 * Map a cocos/kurenai build platform to the packs that must be present.
 * Web stays on core only; mini-game / native pull optional packs.
 */
declare function packsForPlatform(platform: string): PackId[];
declare function inspectPack(id: PackId, configuredRoot?: string): PackPresence;
declare function packsStatus(configuredRoot?: string): PacksStatus;
type EnsurePacksOptions = {
  cocosCliRoot?: string;
  /** Attempt HTTP install when packs are missing (needs KURENAI_COCOS_PACK_BASE_URL). */
  fetch?: boolean;
  baseUrl?: string;
  version?: string;
};
/**
 * Make sure the given packs exist under the cocos-cli root.
 * Missing packs are downloaded when `fetch` is true and a base URL is configured;
 * otherwise throws with an actionable error.
 */
declare function ensurePacks(packIds: PackId[], options?: EnsurePacksOptions): Promise<EnsurePacksResult>;
/** Convenience for preview / web publish. */
declare function ensureCorePack(options?: EnsurePacksOptions): Promise<EnsurePacksResult>;
//#endregion
//#region src/preview/bridge.d.ts
interface PreviewBridgeConfig {
  upstreamUrl: string;
  port: number;
  host?: string;
  inspectorScriptPath?: string;
}
declare class PreviewBridge {
  private readonly config;
  private server;
  private inspectorScript;
  constructor(config: PreviewBridgeConfig);
  get url(): string;
  start(): Promise<string>;
  stop(): Promise<void>;
  private handleHttp;
}
declare function injectInspector(html: string): string;
//#endregion
//#region src/preview/controller.d.ts
interface PreviewConfig {
  project?: string;
  cocosCliRoot?: string;
  hostEntry?: string;
  scene?: string;
  port?: number;
  bridgePort?: number;
  inspectorScriptPath?: string;
  maxOldSpaceSizeMb?: number;
  watch?: boolean;
  /** Poll assets/ instead of fs.watch; needed on Docker bind mounts. */
  watchPoll?: boolean;
  autoStart?: boolean;
  readinessTimeoutMs?: number;
}
type PreviewPhase = "idle" | "starting" | "ready" | "failed" | "stopped";
interface PreviewState {
  phase: PreviewPhase;
  url: string;
  project?: string;
  pid?: number;
  /** The host was already running and is not owned (or stopped) by this controller. */
  attached?: boolean;
  startedAt?: string;
  lastError?: string;
  recentLogs: string[];
}
interface PreviewControllerOptions {
  spawnProcess?: typeof spawn;
  fetchImpl?: typeof fetch;
  killProcessTree?: (child: ChildProcessWithoutNullStreams) => Promise<void>;
}
declare class PreviewController {
  private readonly config;
  private child;
  private bridge;
  private upstreamUrl;
  private hostPageUrl;
  private state;
  private readonly spawnProcess;
  private readonly fetchImpl;
  private readonly killProcessTree;
  constructor(config: PreviewConfig, options?: PreviewControllerOptions);
  snapshot(): PreviewState;
  start(overrides?: Partial<PreviewConfig>): Promise<PreviewState>;
  stop(): Promise<PreviewState>;
  private startBridge;
  /** A ready host started elsewhere (e.g. by the kurenai CLI), advertised in temp/kurenai-host.json. */
  private findRunningHost;
  private recordLog;
  private adoptHostUrl;
  private waitUntilReady;
}
//#endregion
//#region src/project/control.d.ts
type ProjectTemplateId = "base-ai" | "base-ai-3d";
type PublishPlatform = "web-desktop" | "web-mobile";
interface CommandResult {
  stdout: string;
  stderr: string;
  code: number;
}
interface ProjectControlConfig extends PreviewConfig {
  controlPort?: number;
  controlHost?: string;
  templateRoot?: string;
  template3dRoot?: string;
  runCommand?: (command: string, args: string[], cwd: string) => Promise<CommandResult>;
}
interface CocosProject {
  name: string;
  projectPath: string;
  creatorVersion: string;
  dimension: "2d" | "3d";
}
interface SelectionContext {
  id: string;
  name: string;
  path: string;
  active: boolean;
  componentTypes: string[];
}
declare class ProjectControl {
  private readonly config;
  private server;
  private readonly previews;
  private readonly projects;
  private readonly selections;
  private readonly runCommand;
  constructor(config: ProjectControlConfig);
  get url(): string;
  startServer(): Promise<string>;
  stopServer(): Promise<void>;
  inspect(projectPath: string): Promise<CocosProject | undefined>;
  initialize(projectPath: string, template: ProjectTemplateId): Promise<CocosProject>;
  state(projectPath: string): Promise<{
    projectPath: string;
    project?: CocosProject;
    preview?: PreviewState;
    selection?: SelectionContext;
  }>;
  startPreview(projectPath: string): Promise<PreviewState>;
  stopPreview(projectPath: string): Promise<PreviewState>;
  publish(projectPath: string, options?: {
    platform?: PublishPlatform;
    outDir?: string;
    verbose?: boolean;
  }): Promise<Record<string, unknown>>;
  setSelection(projectPath: string, selection: SelectionContext | undefined): void;
  getSelection(projectPath: string): SelectionContext | undefined;
  /** `preview` overrides the in-process preview, e.g. a host started by the CLI. */
  contextText(projectPath: string, preview?: Pick<PreviewState, "phase" | "url">): string;
  private previewFor;
  private handle;
}
//#endregion
//#region src/shared/protocol.d.ts
declare const KURENAI_PROTOCOL_VERSION = 1;
interface SceneNodeSummary {
  id: string;
  name: string;
  path: string;
  active: boolean;
  componentTypes: string[];
  children: SceneNodeSummary[];
}
interface SelectedNodeSummary {
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
type InspectorToHostMessage = {
  type: "kurenai:ready";
  version: number;
  sceneName?: string;
} | {
  type: "kurenai:scene-tree";
  version: number;
  root: SceneNodeSummary | null;
} | {
  type: "kurenai:selection";
  version: number;
  node: SelectedNodeSummary | null;
} | {
  type: "kurenai:error";
  version: number;
  message: string;
};
type HostToInspectorMessage = {
  type: "kurenai:request-scene-tree";
  version: number;
} | {
  type: "kurenai:select-node";
  version: number;
  nodeId: string;
} | {
  type: "kurenai:set-pick-mode";
  version: number;
  enabled: boolean;
};
declare function isInspectorMessage(value: unknown): value is InspectorToHostMessage;
declare function formatSelectionContext(node: SelectedNodeSummary): string;
//#endregion
export { type CocosProject, type CommandResult, DEFAULT_COCOS_CLI_ROOT, type EnsurePacksOptions, type EnsurePacksResult, HostToInspectorMessage, InspectorToHostMessage, KURENAI_COCOS_CORE_VERSION, KURENAI_PROTOCOL_VERSION, LEGACY_PINK_COCOS_CLI_ROOT, type PackId, type PackPresence, type PacksStatus, PreviewBridge, type PreviewBridgeConfig, type PreviewConfig, PreviewController, type PreviewControllerOptions, type PreviewPhase, type PreviewState, ProjectControl, type ProjectControlConfig, type ProjectTemplateId, type PublishPlatform, SceneNodeSummary, SelectedNodeSummary, type SelectionContext, ensureCorePack, ensurePacks, formatSelectionContext, injectInspector, inspectPack, isInspectorMessage, listKnownPackIds, managedCocosCoreRoot, packsForPlatform, packsStatus, resolveCocosCliRoot };
//# sourceMappingURL=index.d.ts.map