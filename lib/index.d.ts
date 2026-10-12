import { ChildProcessWithoutNullStreams, spawn } from "node:child_process";
//#region src/cocos/paths.d.ts
/** Default engine version for the bundled cocos runtime. */
declare const KURENAI_COCOS_CORE_VERSION = "4.0.0-alpha.33";
/**
 * @deprecated PinK path — maintainer pack source only. Runtime never resolves here.
 */
declare const LEGACY_PINK_COCOS_CLI_ROOT: string;
/** Absolute path to the kurenai package root (repo or installed package). */
declare function packageRoot(): string;
/** Trimmed cocos runtime source tree shipped inside the kurenai package. */
declare function bundledCocosCoreRoot(): string;
/**
 * @deprecated Application Support cache — no longer the default.
 */
declare function managedCocosCoreRoot(version?: string): string;
/** Default runtime = vendor/cocos-core source tree. */
declare const DEFAULT_COCOS_CLI_ROOT: string;
/**
 * Resolve the cocos runtime root used by project / assets / preview / build.
 *
 * Order:
 * 1. explicit `configured`
 * 2. `KURENAI_COCOS_CLI_ROOT` (tests / override)
 * 3. bundled `vendor/cocos-core` inside the kurenai package
 */
declare function resolveCocosCliRoot(configured?: string): string;
//#endregion
//#region src/cocos/addons.d.ts
/** An npm package kurenai installs on demand (e.g. a platform's publishing tools). */
type NpmAddon = {
  name: string;
  /** Env var that overrides the npm spec (version, tarball, or folder) for this addon. */
  specEnv?: string;
};
/** Outside the kurenai package so addons survive kurenai upgrades; override with KURENAI_ADDONS_DIR. */
declare function addonsDir(): string;
/** Install the addon unless the same spec is already installed; returns its entry file. */
declare function ensureAddon(addon: NpmAddon): Promise<{
  entry: string;
  installed: boolean;
}>;
declare function loadAddon<T>(addon: NpmAddon): Promise<T>;
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
 * Every build needs core + the core build pack; mini-game / native add their own packs.
 */
declare function packsForPlatform(platform: string): PackId[];
declare function inspectPack(id: PackId, configuredRoot?: string): PackPresence;
declare function packsStatus(configuredRoot?: string): PacksStatus;
/** The npm addon behind a build platform's pack, e.g. wechatgame → @kurenai-studio/wechat-minigame. */
declare function platformAddon(platform: string): NpmAddon | undefined;
type EnsurePacksOptions = {
  cocosCliRoot?: string;
  /** Attempt remote install for optional platform/native packs. Default true when base URL set. */
  fetch?: boolean;
  baseUrl?: string;
  version?: string;
};
/**
 * Ensure required packs under the kurenai runtime root (`vendor/cocos-core`).
 * Core is the in-tree source; optional platform packs may still fetch from a CDN.
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
  /**
   * When readiness wait expires, kill the host (legacy). Default false: leave it
   * running so slow first-time engine imports can finish; use host status to poll.
   */
  killOnReadyTimeout?: boolean;
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
//#region src/preview/timeout.d.ts
/** Default wait for first cocos host readiness (engine internal imports can be slow). */
declare const DEFAULT_HOST_READY_TIMEOUT_MS = 600000;
/**
 * Resolve host readiness timeout.
 * Priority: explicit ms → `--timeout` seconds → `KURENAI_HOST_READY_TIMEOUT_MS` → default 10m.
 */
declare function resolveHostReadyTimeoutMs(options?: {
  timeout?: string | true | undefined;
  readinessTimeoutMs?: number | undefined;
}, env?: NodeJS.ProcessEnv): number;
//#endregion
//#region src/project/control.d.ts
type ProjectTemplateId = "base-ai" | "base-ai-3d";
type PublishPlatform = "web-desktop" | "web-mobile" | "wechatgame" | "openpaas";
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
  runCommand?: (command: string, args: string[], cwd: string, env?: NodeJS.ProcessEnv) => Promise<CommandResult>;
  /** Loads a platform's npm addon (installing it on first use); injectable for tests. */
  loadAddon?: (addon: NpmAddon) => Promise<unknown>;
}
/** After a wechatgame build: preview (QR code) or upload through @kurenai-studio/wechat-minigame. */
type WechatPublishOptions = {
  preview?: boolean;
  upload?: boolean;
  version?: string;
  appid?: string;
  privateKeyPath?: string;
  qrcodeOutput?: string;
  desc?: string;
  robot?: number;
  virtualPayment?: boolean;
};
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
    release?: boolean;
    verbose?: boolean;
    wechat?: WechatPublishOptions;
  }): Promise<Record<string, unknown>>;
  private afterWechatBuild;
  /** Type-checks assets/ with the vendored TypeScript; preview itself only strips types. */
  typecheck(projectPath: string): Promise<Record<string, unknown>>;
  setSelection(projectPath: string, selection: SelectionContext | undefined): void;
  getSelection(projectPath: string): SelectionContext | undefined;
  /** `preview` overrides the in-process preview, e.g. a host started by the CLI. */
  contextText(projectPath: string, preview?: Pick<PreviewState, "phase" | "url">): string;
  private previewFor;
  private handle;
}
//#endregion
//#region src/project/engine-modules.d.ts
interface MissingEngineModule {
  module: string;
  file: string;
  match: string;
}
type EngineCutHint = {
  evidence?: string;
  bytes?: number;
};
type EngineCutProposal = {
  module: string;
  reason: "unused" | "artifact" | "minimal";
  evidence?: string;
  bytes?: number;
};
type ProposeEngineCutsResult = {
  file: string;
  included: string[];
  /** Minimal includeModules that still cover detected usage (+ deps + always). */
  minimal: string[];
  cuts: EngineCutProposal[];
  keep: string[];
  blocked: Array<{
    module: string;
    file: string;
    match: string;
    evidence?: string;
  }>;
  /** Modules pulled in because scripts/scenes referenced them. */
  detected: Array<{
    module: string;
    evidence: string;
  }>;
};
type ApplyEngineCutsResult = {
  file: string;
  removed: string[];
  included: string[];
};
declare function findMissingEngineModules(projectPath: string): Promise<{
  file: string;
  missing: MissingEngineModule[];
}>;
declare function modulesFromArtifacts(artifacts: Array<{
  path: string;
  bytes?: number;
}>): Map<string, EngineCutHint>;
/**
 * Propose a minimal includeModules list from project usage (scripts + scenes/prefabs).
 * Optional build artifacts only annotate cut reasons / ordering — they do not keep modules.
 */
declare function proposeEngineCuts(projectPath: string, options?: {
  artifacts?: Array<{
    path: string;
    bytes?: number;
  }>;
}): Promise<ProposeEngineCutsResult>;
/** Write an exact includeModules list into every engine settings file that has one. */
declare function applyEngineModules(projectPath: string, modules: string[]): Promise<ApplyEngineCutsResult>;
/** Compute minimal set and write it. */
declare function applyMinimalEngineModules(projectPath: string): Promise<ApplyEngineCutsResult & {
  minimal: string[];
}>;
/** Remove the given modules from includeModules. Idempotent. */
declare function applyEngineCuts(projectPath: string, modules: string[]): Promise<ApplyEngineCutsResult>;
//#endregion
//#region src/project/kit.d.ts
interface KitAddResult {
  ok: true;
  kit: string;
  resources: string;
  models: string[];
  audio: string[];
  readme?: string;
  skipped: number;
}
/**
 * Copies a kit's web assets into assets/resources/kits/<kit>/{models,audio}/ so that
 * `loadModel('kits/<kit>/models/<Name>')` works. Accepts a folder, a .zip, or a Kura
 * studio pack id (e.g. `ks-survivor-kit`).
 */
declare function addKit(projectPath: string, source: string, name?: string): Promise<KitAddResult>;
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
//#region src/meta/asset-info.d.ts
interface MetaSubAsset {
  uuid: string;
  name?: string;
  importer?: string;
}
interface MetaAssetInfo {
  path: string;
  url: string;
  uuid: string;
  importer: string;
  imported: boolean;
  subAssets: MetaSubAsset[];
}
/** Absolute path of `file` if it lies inside `<project>/assets`, else undefined. */
declare function assetPathInProject(project: string, file: string): string | undefined;
/**
 * Reads uuid / importer / sub-assets from an existing `.meta` without starting the
 * host. Throws when the file has not been imported yet.
 */
declare function readAssetInfo(project: string, file: string): Promise<MetaAssetInfo>;
/** Files under `path` (or `path` itself), skipping `.meta` and dotfiles. */
declare function listImportTargets(path: string): string[];
//#endregion
export { type ApplyEngineCutsResult, type CocosProject, type CommandResult, DEFAULT_COCOS_CLI_ROOT, DEFAULT_HOST_READY_TIMEOUT_MS, type EngineCutProposal, type EnsurePacksOptions, type EnsurePacksResult, HostToInspectorMessage, InspectorToHostMessage, KURENAI_COCOS_CORE_VERSION, KURENAI_PROTOCOL_VERSION, type KitAddResult, LEGACY_PINK_COCOS_CLI_ROOT, type MetaAssetInfo, type MetaSubAsset, type MissingEngineModule, type NpmAddon, type PackId, type PackPresence, type PacksStatus, PreviewBridge, type PreviewBridgeConfig, type PreviewConfig, PreviewController, type PreviewControllerOptions, type PreviewPhase, type PreviewState, ProjectControl, type ProjectControlConfig, type ProjectTemplateId, type ProposeEngineCutsResult, type PublishPlatform, SceneNodeSummary, SelectedNodeSummary, type SelectionContext, addKit, addonsDir, applyEngineCuts, applyEngineModules, applyMinimalEngineModules, assetPathInProject, bundledCocosCoreRoot, ensureAddon, ensureCorePack, ensurePacks, findMissingEngineModules, formatSelectionContext, injectInspector, inspectPack, isInspectorMessage, listImportTargets, listKnownPackIds, loadAddon, managedCocosCoreRoot, modulesFromArtifacts, packageRoot, packsForPlatform, packsStatus, platformAddon, proposeEngineCuts, readAssetInfo, resolveCocosCliRoot, resolveHostReadyTimeoutMs };
//# sourceMappingURL=index.d.ts.map