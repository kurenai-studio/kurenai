const CONTROL_URL_KEY = "kurenai.controlUrl";
const DEFAULT_CONTROL_URL = "http://127.0.0.1:7459";

export interface ClientProject {
  name: string;
  projectPath: string;
  creatorVersion: string;
  dimension: "2d" | "3d";
}

export interface ClientPreviewState {
  phase: "idle" | "starting" | "ready" | "failed" | "stopped";
  url: string;
  lastError?: string;
}

export interface ClientProjectState {
  sessionId: string;
  projectPath: string;
  project?: ClientProject;
  preview?: ClientPreviewState;
}

interface MutationResult {
  ok: boolean;
  error?: string;
  project?: ClientProject;
  preview: ClientPreviewState;
  state?: ClientProjectState;
}

export const projectApi = {
  async defaultPath(): Promise<string> {
    const result = await request<{ projectPath: string }>("/api/project/default");
    return result.projectPath;
  },
  state(sessionId: string, projectPath: string): Promise<ClientProjectState> {
    return request<ClientProjectState>(
      `/api/project?sessionId=${encodeURIComponent(
        sessionId,
      )}&projectPath=${encodeURIComponent(projectPath)}`,
    );
  },
  initialize(
    sessionId: string,
    projectPath: string,
    template: "base-ai" | "base-ai-3d",
  ): Promise<MutationResult> {
    return post("/api/project/initialize", {
      sessionId,
      projectPath,
      template,
    });
  },
  startPreview(
    sessionId: string,
    projectPath: string,
  ): Promise<MutationResult> {
    return post("/api/preview/start", { sessionId, projectPath });
  },
  stopPreview(
    sessionId: string,
    projectPath: string,
  ): Promise<MutationResult> {
    return post("/api/preview/stop", { sessionId, projectPath });
  },
  setSelection(
    sessionId: string,
    projectPath: string,
    selection:
      | {
          id: string;
          name: string;
          path: string;
          active: boolean;
          componentTypes: string[];
        }
      | null,
  ): Promise<{ ok: boolean }> {
    return request("/api/context/selection", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId, projectPath, selection }),
    });
  },
};

async function post(
  path: string,
  body: Record<string, unknown>,
): Promise<MutationResult> {
  return request<MutationResult>(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const base =
    localStorage.getItem(CONTROL_URL_KEY)?.replace(/\/+$/u, "") ??
    DEFAULT_CONTROL_URL;
  const response = await fetch(`${base}${path}`, init);
  const value = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(value.error ?? `Kurenai control failed: HTTP ${response.status}`);
  }
  return value;
}
