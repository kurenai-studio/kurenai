import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type JSX,
} from "react";
import {
  KURENAI_PROTOCOL_VERSION,
  formatSelectionContext,
  isInspectorMessage,
  type HostToInspectorMessage,
  type SelectedNodeSummary,
} from "../shared/protocol.js";

const URL_KEY = "kurenai.previewUrl";
const VIEWPORT_KEY = "kurenai.viewport";
const DEFAULT_PREVIEW_URL = "http://127.0.0.1:7461/";
const VIEWPORT_PRESETS = [
  ["fit", "Fit"],
  ["1280x720", "1280 × 720"],
  ["720x1280", "720 × 1280"],
  ["393x852", "iPhone 14 Pro"],
  ["360x800", "Android 360 × 800"],
] as const;

interface ViewportConfig {
  preset: string;
  width: number;
  height: number;
}

export interface KurenaiLauncherProps {
  sessionId?: string;
  workspaceName?: string;
  initialPreviewUrl?: string;
  onClose?: () => void;
  onStopAndClose?: () => void;
  onSelectionChange?: (
    selection: SelectedNodeSummary | null,
  ) => void | Promise<void>;
}

export function KurenaiLauncher({
  workspaceName,
  initialPreviewUrl,
  onClose,
  onStopAndClose,
  onSelectionChange,
}: KurenaiLauncherProps): JSX.Element {
  const [previewUrl, setPreviewUrl] = useState(
    () => initialPreviewUrl ?? readPreviewUrl(),
  );
  const [draftUrl, setDraftUrl] = useState(previewUrl);
  const [selection, setSelection] = useState<SelectedNodeSummary | null>(null);
  const [pickMode, setPickMode] = useState(false);
  const [runtimeReady, setRuntimeReady] = useState(false);
  const [viewport, setViewport] = useState(readViewport);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const send = useCallback((message: HostToInspectorMessage) => {
    iframeRef.current?.contentWindow?.postMessage(message, "*");
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent<unknown>): void => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (!isInspectorMessage(event.data)) return;
      const message = event.data;
      if (message.type === "kurenai:ready") {
        setRuntimeReady(true);
      } else if (message.type === "kurenai:selection") {
        setSelection(message.node);
        void onSelectionChange?.(message.node);
        window.dispatchEvent(
          new CustomEvent("kurenai:selection", { detail: message.node }),
        );
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onSelectionChange, send]);

  useEffect(() => {
    if (!onClose) return;
    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  useEffect(() => {
    if (!initialPreviewUrl) return;
    setPreviewUrl(initialPreviewUrl);
    setDraftUrl(initialPreviewUrl);
  }, [initialPreviewUrl]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      setStageSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  const selectionText = useMemo(
    () => (selection ? formatSelectionContext(selection) : ""),
    [selection],
  );

  const applyUrl = (): void => {
    const normalized = normalizeUrl(draftUrl);
    localStorage.setItem(URL_KEY, normalized);
    setPreviewUrl(normalized);
    setRuntimeReady(false);
    setSelection(null);
  };

  const togglePick = (): void => {
    const enabled = !pickMode;
    setPickMode(enabled);
    send({
      type: "kurenai:set-pick-mode",
      version: KURENAI_PROTOCOL_VERSION,
      enabled,
    });
  };

  const copySelection = async (): Promise<void> => {
    if (!selectionText) return;
    await navigator.clipboard.writeText(selectionText);
  };

  const setViewportConfig = (next: ViewportConfig): void => {
    setViewport(next);
    localStorage.setItem(VIEWPORT_KEY, JSON.stringify(next));
  };

  const scale =
    viewport.preset === "fit"
      ? 1
      : Math.min(
          1,
          Math.max(0.1, (stageSize.width - 16) / viewport.width),
          Math.max(0.1, (stageSize.height - 16) / viewport.height),
        );

  return (
    <section className="kurenai-workspace" aria-label="Kurenai Studio">
      <header className="kurenai-toolbar">
        <span className="kurenai-title">
          {workspaceName ? `Kurenai · ${workspaceName}` : "Kurenai Studio"}
        </span>
        <select
          className="kurenai-select"
          value={viewport.preset}
          onChange={(event) => {
            const preset = event.currentTarget.value;
            if (preset === "fit") {
              setViewportConfig({ ...viewport, preset });
              return;
            }
            const [width, height] = preset.split("x").map(Number);
            if (width && height) setViewportConfig({ preset, width, height });
          }}
          aria-label="Preview resolution"
        >
          {VIEWPORT_PRESETS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
          <option value="custom">Custom</option>
        </select>
        {viewport.preset !== "fit" ? (
          <>
            <input
              className="kurenai-size-input"
              type="number"
              min={240}
              max={4096}
              value={viewport.width}
              onChange={(event) =>
                setViewportConfig({
                  ...viewport,
                  preset: "custom",
                  width: clampDimension(event.currentTarget.value),
                })
              }
              aria-label="Preview width"
            />
            <span className="kurenai-size-times">×</span>
            <input
              className="kurenai-size-input"
              type="number"
              min={240}
              max={4096}
              value={viewport.height}
              onChange={(event) =>
                setViewportConfig({
                  ...viewport,
                  preset: "custom",
                  height: clampDimension(event.currentTarget.value),
                })
              }
              aria-label="Preview height"
            />
            <button
              className="kurenai-button"
              onClick={() =>
                setViewportConfig({
                  preset: "custom",
                  width: viewport.height,
                  height: viewport.width,
                })
              }
            >
              Rotate
            </button>
          </>
        ) : null}
        <button
          className="kurenai-button"
          data-active={pickMode}
          disabled={!runtimeReady}
          onClick={togglePick}
        >
          Pick
        </button>
        {selection ? (
          <button
            className="kurenai-button kurenai-selection-chip"
            title={selection.path}
            onClick={() => void copySelection()}
          >
            {selection.name}
          </button>
        ) : null}
        {onClose ? (
          <button className="kurenai-button" onClick={onClose}>
            Hide
          </button>
        ) : null}
        {onStopAndClose ? (
          <button
            className="kurenai-button kurenai-stop-button"
            onClick={onStopAndClose}
          >
            Stop
          </button>
        ) : null}
        <div className="kurenai-url-row">
          <input
            className="kurenai-input"
            value={draftUrl}
            onChange={(event) => setDraftUrl(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") applyUrl();
            }}
            aria-label="Headless Cocos preview URL"
          />
          <button className="kurenai-button" onClick={applyUrl}>
            Open
          </button>
        </div>
      </header>
      <div className="kurenai-main">
        <div ref={stageRef} className="kurenai-preview-stage">
          <div
            className="kurenai-preview-viewport"
            data-fit={viewport.preset === "fit"}
            style={
              viewport.preset === "fit"
                ? undefined
                : {
                    width: `${viewport.width}px`,
                    height: `${viewport.height}px`,
                    transform: `translate(-50%, -50%) scale(${scale})`,
                  }
            }
          >
            <iframe
              ref={iframeRef}
              className="kurenai-preview"
              title="Headless Cocos preview"
              src={previewUrl}
              onLoad={() => {
                setRuntimeReady(false);
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function readPreviewUrl(): string {
  return localStorage.getItem(URL_KEY) || DEFAULT_PREVIEW_URL;
}

function readViewport(): ViewportConfig {
  try {
    const stored = JSON.parse(
      localStorage.getItem(VIEWPORT_KEY) ?? "",
    ) as Partial<ViewportConfig>;
    if (
      typeof stored.preset === "string" &&
      typeof stored.width === "number" &&
      typeof stored.height === "number"
    ) {
      return {
        preset: stored.preset,
        width: clampDimension(stored.width),
        height: clampDimension(stored.height),
      };
    }
  } catch {
    // Use the default viewport.
  }
  return { preset: "fit", width: 1280, height: 720 };
}

function clampDimension(value: string | number): number {
  const number = Number(value);
  return Math.min(4096, Math.max(240, Number.isFinite(number) ? number : 240));
}

function normalizeUrl(value: string): string {
  const url = new URL(value.trim() || DEFAULT_PREVIEW_URL);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Preview URL must use http or https");
  }
  return url.toString();
}
