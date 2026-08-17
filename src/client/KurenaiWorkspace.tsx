import {
  useCallback,
  useEffect,
  useState,
  type JSX,
  type ReactNode,
} from "react";
import { KurenaiLauncher } from "./KurenaiLauncher.js";
import type { SelectedNodeSummary } from "../shared/protocol.js";
import {
  projectApi,
  type ClientPreviewState,
  type ClientProjectState,
} from "./workspace-api.js";

export interface KurenaiWorkspaceProps {
  sessionId?: string | undefined;
  projectPath?: string | undefined;
  onClose(): void;
}

export function KurenaiWorkspace({
  sessionId,
  projectPath,
  onClose,
}: KurenaiWorkspaceProps): JSX.Element {
  const [state, setState] = useState<ClientProjectState | null>(null);
  const [preview, setPreview] = useState<ClientPreviewState>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!sessionId || !projectPath) {
      setState(null);
      setPreview(undefined);
      return;
    }
    try {
      setError(undefined);
      const next = await projectApi.state(sessionId, projectPath);
      setState(next);
      setPreview(next.preview);
      if (next.project && next.preview?.phase !== "ready") {
        const started = await projectApi.startPreview(sessionId, projectPath);
        setPreview(started.preview);
      }
    } catch (loadError) {
      setError(messageOf(loadError));
    }
  }, [projectPath, sessionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const initialize = async (
    template: "base-ai" | "base-ai-3d",
  ): Promise<void> => {
    if (!sessionId || !projectPath) return;
    setBusy(true);
    setError(undefined);
    try {
      const result = await projectApi.initialize(
        sessionId,
        projectPath,
        template,
      );
      if (result.state) setState(result.state);
      setPreview(result.preview);
    } catch (initializationError) {
      setError(messageOf(initializationError));
    } finally {
      setBusy(false);
    }
  };

  const stopAndClose = useCallback(async (): Promise<void> => {
    if (sessionId && projectPath) {
      try {
        await projectApi.stopPreview(sessionId, projectPath);
      } catch (stopError) {
        console.warn("[kurenai] failed to stop preview", stopError);
      }
    }
    onClose();
  }, [onClose, projectPath, sessionId]);

  const syncSelection = useCallback(
    async (selection: SelectedNodeSummary | null): Promise<void> => {
      if (!sessionId || !projectPath) return;
      try {
        await projectApi.setSelection(sessionId, projectPath, selection);
      } catch (selectionError) {
        console.warn("[kurenai] failed to sync selection", selectionError);
      }
    },
    [projectPath, sessionId],
  );

  if (!sessionId || !projectPath) {
    return (
      <SetupShell title="Kurenai Studio" onClose={onClose}>
        <p className="kurenai-setup-lead">
          Open a DSH workspace and conversation before starting Kurenai.
        </p>
      </SetupShell>
    );
  }

  if (state?.project && preview?.url) {
    return (
      <KurenaiLauncher
        sessionId={sessionId}
        workspaceName={state.project.name}
        initialPreviewUrl={preview.url}
        onClose={onClose}
        onStopAndClose={() => void stopAndClose()}
        onSelectionChange={syncSelection}
      />
    );
  }

  return (
    <SetupShell title="Initialize Cocos" onClose={onClose}>
      <p className="kurenai-setup-lead">
        Kurenai directly uses the current DSH workspace directory.
      </p>
      <dl className="kurenai-project-facts">
        <dt>DSH workspace</dt>
        <dd>{projectPath}</dd>
        <dt>Session</dt>
        <dd>{sessionId}</dd>
      </dl>
      {error ? <p className="kurenai-error">{error}</p> : null}
      <div className="kurenai-template-options">
        <button
          className="kurenai-template-option"
          disabled={busy}
          onClick={() => void initialize("base-ai")}
        >
          <strong>2D</strong>
          <span>Canvas, UI, 2D physics and playable-oriented modules</span>
        </button>
        <button
          className="kurenai-template-option"
          disabled={busy}
          onClick={() => void initialize("base-ai-3d")}
        >
          <strong>3D</strong>
          <span>Perspective camera, light, primitive and 3D modules</span>
        </button>
      </div>
      {busy ? <p className="kurenai-muted">Initializing template…</p> : null}
      <p className="kurenai-muted">
        For an existing project, open its directory as a DSH workspace; Kurenai
        will detect it automatically.
      </p>
    </SetupShell>
  );
}

function SetupShell({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose(): void;
}): JSX.Element {
  return (
    <section className="kurenai-workspace kurenai-workspace-setup">
      <header className="kurenai-toolbar">
        <span className="kurenai-title">{title}</span>
        <button className="kurenai-button" onClick={onClose}>
          Hide
        </button>
      </header>
      <div className="kurenai-setup-body">{children}</div>
    </section>
  );
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
