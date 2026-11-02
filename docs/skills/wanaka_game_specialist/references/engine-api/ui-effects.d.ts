// Import from "wanaka-studio-engine/ui-effects".

import type { LifetimeScope } from "wanaka-studio-engine";
import type { PhaseScheduler } from "wanaka-studio-engine";
import type { DiagnosticsPort } from "wanaka-studio-engine";
import type { CaptureOverlaySurface } from "wanaka-studio-engine/capture";

/** A reviewed subset of the open-source Shaders components, not hosted presets. */
export type ShaderEffectLayer = {
    readonly id: string;
    readonly type: 'SolidColor';
    readonly props?: {
        color?: string;
        opacity?: number;
    };
} | {
    readonly id: string;
    readonly type: 'LinearGradient';
    readonly props?: {
        colorA?: string;
        colorB?: string;
        angle?: number;
        opacity?: number;
    };
} | {
    readonly id: string;
    readonly type: 'Swirl';
    readonly props?: {
        colorA?: string;
        colorB?: string;
        speed?: number;
        detail?: number;
        blend?: number;
        opacity?: number;
    };
} | {
    readonly id: string;
    readonly type: 'SimplexNoise';
    readonly props?: {
        colorA?: string;
        colorB?: string;
        speed?: number;
        scale?: number;
        seed?: number;
        opacity?: number;
    };
} | {
    readonly id: string;
    readonly type: 'Stripes';
    readonly props?: {
        colorA?: string;
        colorB?: string;
        angle?: number;
        density?: number;
        speed?: number;
        opacity?: number;
    };
} | {
    readonly id: string;
    readonly type: 'LinearWipe';
    readonly props?: {
        progress?: number;
        angle?: number;
        feather?: number;
        invert?: boolean;
    };
} | {
    readonly id: string;
    readonly type: 'NoiseDissolve';
    readonly props?: {
        progress?: number;
        scale?: number;
        softness?: number;
        seed?: number;
        invert?: boolean;
    };
};

/** Project-owned composition. Effects do not read the game framebuffer or DOM behind them. */
export interface ShaderEffectOptions {
    readonly layers: readonly ShaderEffectLayer[];
    /** CSS background used before GPU readiness, on failure, and with reduced motion. */
    readonly fallbackBackground?: string;
    readonly opacity?: number;
    /** Defaults to 0 for UI decorations. Parent must establish a positioned containing block. */
    readonly zIndex?: number;
    /** Pauses decoration animation when the simulation is paused. */
    readonly scheduler?: PhaseScheduler;
    readonly diagnostics?: DiagnosticsPort;
    /** Register only when the containing HUD is not already registered for capture. */
    readonly captureSurface?: CaptureOverlaySurface;
}

/** Scope-owned non-interactive UI decoration. The caller owns layout and foreground controls. */
export interface ShaderEffect {
    readonly element: HTMLDivElement;
    readonly canvas: HTMLCanvasElement;
    /** Settles to GPU readiness; false means the static fallback is active or ownership ended. */
    readonly ready: Promise<boolean>;
    updateLayer(layer: ShaderEffectLayer): void;
    setOpacity(opacity: number): void;
    setVisible(visible: boolean): void;
    pause(): void;
    resume(): void;
    dispose(): void;
}

/** Adds a decorative canvas to an existing positioned UI slot without replacing controls. */
export function createUiEffect(scope: LifetimeScope, parent: HTMLElement, options: ShaderEffectOptions): ShaderEffect;
