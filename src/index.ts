import type {
  DshContext,
  DshToolDefinition,
  DshToolExecution,
} from "./dsh.js";
import { PreviewController, type PreviewState } from "./preview/controller.js";
import {
  ProjectControl,
  type ProjectControlConfig,
  type ProjectTemplateId,
} from "./project/control.js";

export const name = "kurenai";
export const inject = ["tools", "systemPrompt"];

type Json = Record<string, unknown>;

function tool(
  name: string,
  description: string,
  parameters: Record<string, unknown>,
  execute: (args: Json, execution?: DshToolExecution) => Promise<unknown>,
): DshToolDefinition {
  return {
    name,
    description,
    parameters,
    output: {
      schema: { type: "object", additionalProperties: true },
      render(_args, value) {
        return [{ type: "text", text: JSON.stringify(value, null, 2) }];
      },
    },
    execute: (args, execution) => execute((args ?? {}) as Json, execution),
  };
}

function stateResult(state: PreviewState): Json {
  return { ok: state.phase !== "failed", ...state };
}

export function apply(ctx: DshContext, config: ProjectControlConfig = {}): void {
  const control = new ProjectControl(config);
  const logger = ctx.logger?.("kurenai");

  ctx.tools.register(
    tool(
      "kurenai_project_initialize",
      "Initialize the current DSH workspace as a Cocos project from the Kurenai base template.",
      {
        type: "object",
        additionalProperties: false,
        required: ["template"],
        properties: {
          template: {
            type: "string",
            enum: ["base-ai", "base-ai-3d"],
            description: "2D or 3D headless-cocos project template",
          },
        },
      },
      async (args, execution) => {
        try {
          const current = requireProjectContext(execution);
          const project = await control.initialize(
            current.projectPath,
            requireTemplate(args.template),
          );
          const preview = await control.startPreview(current.projectPath);
          return { ok: true, project, preview };
        } catch (error) {
          return errorResult(error);
        }
      },
    ),
  );

  ctx.tools.register(
    tool(
      "kurenai_project_current",
      "Inspect the current DSH workspace and return its Cocos project and preview state.",
      { type: "object", additionalProperties: false, properties: {} },
      async (_args, execution) => {
        try {
          const current = requireProjectContext(execution);
          return {
            ok: true,
            ...(await control.state(current.sessionId, current.projectPath)),
          };
        } catch (error) {
          return errorResult(error);
        }
      },
    ),
  );

  ctx.tools.register(
    tool(
      "kurenai_preview_start",
      "Start the Headless Cocos preview for the current project. Call before asking the user to open Kurenai Studio.",
      {
        type: "object",
        additionalProperties: false,
        properties: {},
      },
      async (_args, execution) => {
        try {
          const current = requireProjectContext(execution);
          const project = await control.inspect(current.projectPath);
          if (!project) throw new Error("Current DSH workspace is not a Cocos project");
          const state = await control.startPreview(current.projectPath);
          logger?.info?.("Headless Cocos preview ready", state.url);
          return { ...stateResult(state), project };
        } catch (error) {
          logger?.error?.("Failed to start Headless Cocos preview", error);
          return errorResult(error);
        }
      },
    ),
  );

  ctx.tools.register(
    tool(
      "kurenai_preview_status",
      "Return the current Kurenai Headless Cocos preview state and URL.",
      { type: "object", additionalProperties: false, properties: {} },
      async (_args, execution) => {
        try {
          const current = requireProjectContext(execution);
          return {
            ok: true,
            ...(await control.state(current.sessionId, current.projectPath)),
          };
        } catch (error) {
          return errorResult(error);
        }
      },
    ),
  );

  ctx.tools.register(
    tool(
      "kurenai_preview_stop",
      "Stop the current Kurenai Headless Cocos preview process.",
      { type: "object", additionalProperties: false, properties: {} },
      async (_args, execution) => {
        try {
          const current = requireProjectContext(execution);
          return {
            ...stateResult(await control.stopPreview(current.projectPath)),
          };
        } catch (error) {
          return errorResult(error);
        }
      },
    ),
  );

  ctx.tools.register(
    tool(
      "kurenai_publish",
      "Headless publish: freeze the project into a static dist (default platform=web). No Cocos Creator install required.",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          platform: {
            type: "string",
            enum: ["web"],
            description: "Platform plugin id (extensible; MVP: web)",
          },
          outDir: {
            type: "string",
            description: "Optional output directory (default: <project>/dist/<platform>)",
          },
          skipPacker: {
            type: "boolean",
            description: "Reuse existing packer output instead of rebuilding scripts",
          },
        },
      },
      async (args, execution) => {
        try {
          const current = requireProjectContext(execution);
          return await control.publish(current.projectPath, {
            platform:
              typeof args.platform === "string" ? args.platform : "web",
            ...(typeof args.outDir === "string" ? { outDir: args.outDir } : {}),
            skipPacker: args.skipPacker === true,
          });
        } catch (error) {
          return errorResult(error);
        }
      },
    ),
  );

  ctx.systemPrompt?.section({
    name: "kurenai:selected-node",
    order: 120,
    text: [
      "Kurenai Studio provides a Headless Cocos preview and runtime node inspector.",
      "The current DSH session cwd is the Cocos project root; do not maintain a separate Kurenai workspace path.",
      "When the user includes a '[Kurenai selected Cocos node]' block, treat its path and source ids as the target of phrases such as 'this node' or 'this button'.",
      "Edit project source files on disk; do not mutate only the browser runtime because changes must survive reload.",
    ].join(" "),
  });
  ctx.systemPrompt?.context({
    name: "kurenai:current-project",
    order: 120,
    text: (assembly) => {
      const sessionId = assembly.agent?.id;
      const projectPath = assembly.agent?.session.header.cwd;
      return sessionId && projectPath
        ? control.contextText(sessionId, projectPath)
        : "";
    },
  });

  ctx.effect?.(() => {
    void control.startServer().then(
      (url) => logger?.info?.("Kurenai project control ready", url),
      (error) => logger?.error?.("Kurenai project control failed", error),
    );
    return async () => {
      await control.stopServer();
    };
  });
}

function requireProjectContext(
  execution: DshToolExecution | undefined,
): { sessionId: string; projectPath: string } {
  const sessionId = execution?.agent?.id;
  if (!sessionId) throw new Error("Kurenai tool requires an active DSH conversation");
  const projectPath = execution.agent?.session?.header?.cwd;
  if (!projectPath) {
    throw new Error("Current DSH conversation does not have a workspace directory");
  }
  return { sessionId, projectPath };
}

function errorResult(error: unknown): Json {
  return {
    ok: false,
    error: error instanceof Error ? error.message : String(error),
  };
}

function requireTemplate(value: unknown): ProjectTemplateId {
  if (value === "base-ai" || value === "base-ai-3d") return value;
  throw new Error("template must be base-ai or base-ai-3d");
}

export { PreviewController } from "./preview/controller.js";
export type {
  PreviewControllerOptions,
  PreviewPhase,
  PreviewState,
} from "./preview/controller.js";
export { ProjectControl } from "./project/control.js";
export type {
  CocosProject,
  ProjectControlConfig,
  ProjectTemplateId,
} from "./project/control.js";
export * from "./shared/protocol.js";
