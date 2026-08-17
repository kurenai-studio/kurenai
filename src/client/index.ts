import type { ComponentType } from "react";
import {
  KurenaiConversationButton,
  KurenaiOverlay,
  KurenaiSidebarButton,
} from "./KurenaiShell.js";
import { injectStyles } from "./style.js";
import { projectApi } from "./workspace-api.js";

interface SlotRegistration {
  name: string;
  id: string;
  order: number;
  inject(): Record<string, unknown>;
}

interface ClientContext {
  slots: {
    inject(name: string, register: () => unknown): unknown;
    register(
      registration: SlotRegistration,
      component: ComponentType<any>,
    ): unknown;
  };
  workspaces: {
    create(input: { path: string }): Promise<{ id: string }>;
    connectWorkspace(workspaceId: string): Promise<string>;
  };
  sessions: {
    open(sessionId: string): void;
  };
}

export const inject = ["slots", "workspaces", "sessions"];

export function apply(ctx: ClientContext): void {
  injectStyles();
  ctx.slots.inject("sidebar.footer.action", () =>
    ctx.slots.register(
      {
        name: "sidebar.footer.action",
        id: "kurenai-open",
        order: 20,
        inject: () => ({
          ensureWorkspaceSession: async () => {
            const projectPath = await projectApi.defaultPath();
            const workspace = await ctx.workspaces.create({
              path: projectPath,
            });
            const sessionId = await ctx.workspaces.connectWorkspace(
              workspace.id,
            );
            ctx.sessions.open(sessionId);
            return { sessionId, projectPath };
          },
        }),
      },
      KurenaiSidebarButton,
    ),
  );
  ctx.slots.inject("shell.overlay", () =>
    ctx.slots.register(
      {
        name: "shell.overlay",
        id: "kurenai-workspace",
        order: 20,
        inject: () => ({}),
      },
      KurenaiOverlay,
    ),
  );
  ctx.slots.inject("conversation.session.header.actions", () =>
    ctx.slots.register(
      {
        name: "conversation.session.header.actions",
        id: "kurenai-conversation",
        order: 80,
        inject: () => ({}),
      },
      KurenaiConversationButton,
    ),
  );
}
