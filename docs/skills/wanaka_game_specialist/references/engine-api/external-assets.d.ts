// Import from "wanaka-studio-engine/external-assets".

import { type LifetimeScope } from "wanaka-studio-engine";
import { type Texture } from "three/webgpu";
import { type Scene } from "three/webgpu";

export interface PbrTextureUrls {
    readonly baseColor?: string;
    readonly normal?: string;
    readonly roughness?: string;
    readonly metalness?: string;
    readonly ambientOcclusion?: string;
    readonly opacity?: string;
    readonly displacement?: string;
}

export interface PbrTextureSet {
    readonly baseColor: Texture | null;
    readonly normal: Texture | null;
    readonly roughness: Texture | null;
    readonly metalness: Texture | null;
    readonly ambientOcclusion: Texture | null;
    readonly opacity: Texture | null;
    readonly displacement: Texture | null;
}

export interface ExrEnvironmentOptions {
    /** Also display the EXR as the scene background. Defaults to false. */
    readonly background?: boolean;
}

/** Loaded `.cube` 3D texture owned by the requesting scope. */
export interface CubeLut {
    readonly texture: Texture;
    readonly size: number;
}

export interface ProjectFontOptions {
    readonly family: string;
    readonly url: string;
    readonly descriptors?: FontFaceDescriptors;
}

/** Loads an ambientCG-style PBR map set with correct color/data texture spaces. */
export function loadPbrTextureSet(scope: LifetimeScope, urls: PbrTextureUrls): Promise<PbrTextureSet>;

/**
 * Loads an EXR, installs it as scene environment, and restores prior scene state on teardown.
 */
export function loadExrEnvironment(scope: LifetimeScope, scene: Scene, url: string, options?: ExrEnvironmentOptions): Promise<Texture>;

/** Loads a `.cube` LUT and owns its 3D texture in the scope. */
export function loadCubeLut(scope: LifetimeScope, url: string): Promise<CubeLut>;

/** Registers one self-hosted WOFF2 face and removes only that face when the scope ends. */
export function loadProjectFont(scope: LifetimeScope, options: ProjectFontOptions): Promise<FontFace>;

export type ExternalTextureColor = 'color' | 'data';

/** Loads one ordinary image/icon texture and owns its GPU resource in the scope. */
export function loadExternalTexture(scope: LifetimeScope, url: string, color?: ExternalTextureColor): Promise<Texture>;
