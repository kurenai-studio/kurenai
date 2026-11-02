// Import from "wanaka-studio-engine/capture".

/** DOM layer registered for inclusion in host screenshots. */
export interface CaptureOverlay {
    readonly nodeType: number;
    cloneNode(deep?: boolean): Node;
    readonly childNodes: NodeListOf<ChildNode>;
    readonly shadowRoot?: ShadowRoot | null;
    readonly parentElement?: HTMLElement | null;
    getBoundingClientRect(): {
        readonly left: number;
        readonly top: number;
        readonly width: number;
        readonly height: number;
    };
}

/** Explicit capture ownership port implemented by RenderSession. */
export interface CaptureOverlaySurface {
    addCaptureOverlay(overlay: CaptureOverlay): () => void;
}

/** Output controls for a host-captured frame. */
export interface CaptureFrameOptions {
    readonly maxEdge?: number;
    readonly format?: 'png' | 'jpeg';
    readonly quality?: number;
}
