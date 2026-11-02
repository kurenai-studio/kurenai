// Import from "wanaka-studio-engine/dom".

/** Type-only contract for the project-owned UI look source file. */
export interface HudLookSource {
    readonly schemaVersion: 1;
    readonly presetId: string;
    readonly tokens: Readonly<Record<string, string>>;
    readonly fontImports: readonly string[];
    readonly css: string;
}

/** Options for a DOM element attached to the Engine-owned HUD overlay. */
export interface HudElementOptions {
    readonly parent: HTMLElement;
    readonly text?: string;
    readonly className?: string;
    readonly authoringId?: string;
}

/** Creates a HUD element under the caller-provided overlay parent. */
export function hudElement<K extends keyof HTMLElementTagNameMap>(tag: K, options: HudElementOptions): HTMLElementTagNameMap[K];
