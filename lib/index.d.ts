import { ChildProcessWithoutNullStreams, spawn } from "node:child_process";
//#region src/dsh.d.ts
interface DshToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  output: {
    schema: Record<string, unknown>;
    render(args: unknown, value: unknown): Array<{
      type: "text";
      text: string;
    }>;
  };
  execute(args: unknown, execution?: DshToolExecution): Promise<unknown>;
}
interface DshToolExecution {
  agent?: {
    id: string;
    session?: {
      header?: {
        cwd?: string;
      };
    };
  };
}
interface DshContext {
  tools: {
    register(definition: DshToolDefinition): unknown;
  };
  effect?(setup: () => void | (() => void | Promise<void>)): unknown;
  systemPrompt?: {
    section(section: {
      name: string;
      order: number;
      text: string;
    }): unknown;
    context(context: {
      name: string;
      order: number;
      text: string | ((assembly: {
        agent?: {
          id: string;
          session: {
            header: {
              cwd?: string;
            };
          };
        };
      }) => string);
    }): unknown;
  };
  logger?(name: string): {
    info?(...args: unknown[]): void;
    warn?(...args: unknown[]): void;
    error?(...args: unknown[]): void;
  };
}
//#endregion
//#region src/preview/controller.d.ts
interface PreviewConfig {
  project?: string;
  headlessRoot?: string;
  previewEntry?: string;
  port?: number;
  bridgePort?: number;
  inspectorScriptPath?: string;
  packer?: "mini" | "creator";
  autoStart?: boolean;
  readinessTimeoutMs?: number;
}
type PreviewPhase = "idle" | "starting" | "ready" | "failed" | "stopped";
interface PreviewState {
  phase: PreviewPhase;
  url: string;
  project?: string;
  pid?: number;
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
  private state;
  private readonly spawnProcess;
  private readonly fetchImpl;
  private readonly killProcessTree;
  constructor(config: PreviewConfig, options?: PreviewControllerOptions);
  snapshot(): PreviewState;
  start(overrides?: Partial<PreviewConfig>): Promise<PreviewState>;
  stop(): Promise<PreviewState>;
  private recordLog;
  private waitUntilReady;
}
//#endregion
//#region src/project/control.d.ts
type ProjectTemplateId = "base-ai" | "base-ai-3d";
interface ProjectControlConfig extends PreviewConfig {
  controlPort?: number;
  controlHost?: string;
  templateRoot?: string;
  template3dRoot?: string;
  runCommand?: (command: string, args: string[], cwd: string) => Promise<void>;
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
  state(sessionId: string, projectPath: string): Promise<{
    sessionId: string;
    projectPath: string;
    project?: CocosProject;
    preview?: PreviewState;
  }>;
  startPreview(projectPath: string): Promise<PreviewState>;
  stopPreview(projectPath: string): Promise<PreviewState>;
  publish(projectPath: string, options?: {
    platform?: string;
    outDir?: string;
    skipPacker?: boolean;
  }): Promise<Record<string, unknown>>;
  setSelection(sessionId: string, selection: SelectionContext | undefined): void;
  contextText(sessionId: string, projectPath: string): string;
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
//#region src/index.d.ts
declare const name = "kurenai";
declare const inject: string[];
declare function apply(ctx: DshContext, config?: ProjectControlConfig): void;
//#endregion
export { type CocosProject, HostToInspectorMessage, InspectorToHostMessage, KURENAI_PROTOCOL_VERSION, PreviewController, type PreviewControllerOptions, type PreviewPhase, type PreviewState, ProjectControl, type ProjectControlConfig, type ProjectTemplateId, SceneNodeSummary, SelectedNodeSummary, apply, formatSelectionContext, inject, isInspectorMessage, name };
//# sourceMappingURL=index.d.ts.map