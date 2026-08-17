import { useEffect, useRef, useState, type JSX } from "react";
import { KurenaiWorkspace } from "./KurenaiWorkspace.js";

const TOGGLE_EVENT = "kurenai:toggle-workspace";
const PANEL_WIDTH_KEY = "kurenai.panelWidth.v2";

interface SessionListState {
  current?: string;
  byId: Record<string, { cwd?: string }>;
}

export interface RootSlotProps {
  useSessions<T>(selector: (state: SessionListState) => T): T;
  ensureWorkspaceSession?(): Promise<{
    sessionId: string;
    projectPath: string;
  }>;
}

export interface SessionSlotProps extends RootSlotProps {
  sessionId: string;
}

export function KurenaiSidebarButton({
  useSessions,
  ensureWorkspaceSession,
}: RootSlotProps): JSX.Element {
  const [busy, setBusy] = useState(false);
  const sessionId = useSessions((state) => state.current);
  const projectPath = useSessions((state) =>
    state.current ? state.byId[state.current]?.cwd : undefined,
  );
  return (
    <button
      className="kurenai-launcher"
      disabled={busy}
      onClick={() => {
        void (async () => {
          setBusy(true);
          try {
            const target =
              sessionId && projectPath
                ? { sessionId, projectPath }
                : await ensureWorkspaceSession?.();
            window.dispatchEvent(
              new CustomEvent(TOGGLE_EVENT, { detail: target }),
            );
          } finally {
            setBusy(false);
          }
        })();
      }}
    >
      {busy ? "Opening…" : "Kurenai"}
    </button>
  );
}

export function KurenaiConversationButton({
  sessionId,
  useSessions,
}: SessionSlotProps): JSX.Element {
  const projectPath = useSessions((state) => state.byId[sessionId]?.cwd);
  return (
    <button
      className="kurenai-header-button"
      onClick={() =>
        window.dispatchEvent(
          new CustomEvent(TOGGLE_EVENT, {
            detail: { sessionId, projectPath },
          }),
        )
      }
    >
      Kurenai
    </button>
  );
}

export function KurenaiOverlay({
  useSessions,
}: RootSlotProps): JSX.Element | null {
  const [open, setOpen] = useState(false);
  const currentSessionId = useSessions((state) => state.current);
  const currentProjectPath = useSessions((state) =>
    state.current ? state.byId[state.current]?.cwd : undefined,
  );
  const [targetSessionId, setTargetSessionId] = useState<string>();
  const [targetProjectPath, setTargetProjectPath] = useState<string>();
  const [panelWidth, setPanelWidth] = useState(readPanelWidth);
  const frameRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const toggle = (
      event: Event,
    ): void => {
      const detail = (
        event as CustomEvent<{ sessionId?: string; projectPath?: string }>
      ).detail;
      setTargetSessionId(detail?.sessionId);
      setTargetProjectPath(detail?.projectPath);
      setOpen((value) => !value);
    };
    window.addEventListener(TOGGLE_EVENT, toggle);
    return () => window.removeEventListener(TOGGLE_EVENT, toggle);
  }, []);

  useEffect(() => {
    if (!open) return;
    const overlay = document.querySelector<HTMLElement>("[data-shell-overlay]");
    const frame = overlay?.parentElement;
    if (!overlay || !frame) return;
    frameRef.current = frame;

    const previous = {
      boxSizing: frame.style.boxSizing,
      paddingRight: frame.style.paddingRight,
      panelWidth: document.documentElement.style.getPropertyValue(
        "--kurenai-panel-width",
      ),
    };
    const resize = (): void => applyPanelWidth(frame, panelWidth);

    document.body.classList.add("kurenai-split-open");
    resize();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      frameRef.current = null;
      document.body.classList.remove("kurenai-split-open");
      frame.style.boxSizing = previous.boxSizing;
      frame.style.paddingRight = previous.paddingRight;
      if (previous.panelWidth) {
        document.documentElement.style.setProperty(
          "--kurenai-panel-width",
          previous.panelWidth,
        );
      } else {
        document.documentElement.style.removeProperty("--kurenai-panel-width");
      }
    };
  }, [open, panelWidth]);

  const startResize = (event: React.PointerEvent<HTMLDivElement>): void => {
    const frame = frameRef.current;
    if (!frame) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const move = (moveEvent: PointerEvent): void => {
      const sidebar =
        frame.firstElementChild?.getBoundingClientRect().width ?? 0;
      const available = window.innerWidth - sidebar;
      if (available < 680) return;
      const maxWidth = Math.min(1400, Math.max(360, available - 240));
      const next = Math.round(
        Math.min(
          maxWidth,
          Math.max(360, window.innerWidth - moveEvent.clientX),
        ),
      );
      setPanelWidth(next);
      localStorage.setItem(PANEL_WIDTH_KEY, String(next));
    };
    const up = (): void => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
  };

  if (!open) return null;
  return (
    <div className="kurenai-split-panel">
      <div
        className="kurenai-split-handle"
        role="separator"
        aria-orientation="vertical"
        onPointerDown={startResize}
      />
      <KurenaiWorkspace
        sessionId={targetSessionId ?? currentSessionId}
        projectPath={targetProjectPath ?? currentProjectPath}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}

function readPanelWidth(): number {
  const stored = Number(localStorage.getItem(PANEL_WIDTH_KEY));
  return Number.isFinite(stored) && stored >= 360
    ? stored
    : Math.round(Math.min(760, Math.max(520, window.innerWidth * 0.6)));
}

function applyPanelWidth(frame: HTMLElement, preferred: number): void {
  const viewport = window.innerWidth;
  const sidebar = frame.firstElementChild?.getBoundingClientRect().width ?? 0;
  const available = Math.max(0, viewport - sidebar);
  const split = available >= 680;
  const maxWidth = Math.min(1400, Math.max(360, available - 240));
  const width = split
    ? Math.min(maxWidth, Math.max(360, preferred))
    : viewport;
  document.documentElement.style.setProperty(
    "--kurenai-panel-width",
    `${width}px`,
  );
  frame.style.boxSizing = "border-box";
  frame.style.paddingRight = split ? `${width}px` : "0";
}
