// Import from "wanaka-studio-engine/assets".

import { type LifetimeScope } from "wanaka-studio-engine";
import { Group, type AnimationClip, type WebGPURenderer } from "three/webgpu";

/** Official Three GLTFLoader decode worker directory (DRACO wasm/js live here). */
export const DEFAULT_DRACO_DECODER_DIRECTORY: string;

export interface GltfAssetCacheOptions {
    /** Extra attempts after a thrown load. Aborted loads are not retried. */
    readonly retries?: number;
    /** Maximum distinct GLTF fetch/decode attempts running concurrently. */
    readonly maxConcurrentLoads?: number;
    /** Maximum parsed zero-reference generations retained for reuse. */
    readonly maxCachedAssets?: number;
    /**
     * Maximum logical GPU bytes across live and cached parsed generations.
     * Only zero-reference LRU entries are eligible for eviction.
     */
    readonly maxEstimatedGpuBytes?: number;
}

export interface GltfAssetsOptions extends GltfAssetCacheOptions {
    readonly decoderDirectory?: string;
    readonly ktx2TranscoderDirectory?: string;
    readonly ktx2Profile?: RendererKtx2LoaderProfile;
    readonly renderer?: WebGPURenderer;
}

/** Asset-space visual correction in degrees that establishes local +Z as model forward. */
export interface ModelRotationDegrees {
    readonly x: number;
    readonly y: number;
    readonly z: number;
}

/** Legacy desired post-correction model bounds in centimeters. */
export interface ModelTargetSizeCm {
    readonly width: number;
    readonly height: number;
    readonly depth: number;
}

/** Inputs for one independently owned and normalized GLB model instance. */
export interface Model3DLoadOptions {
    readonly assetUrl: string | GltfAssetReference;
    readonly rotationDegrees: ModelRotationDegrees;
    /** Uniform model scale recommended by asset post-processing. */
    readonly scale?: number;
    /** Legacy per-axis target bounds retained for existing projects. */
    readonly targetSizeCm?: ModelTargetSizeCm | null;
}

/** Renderer-aware session loader configuration. */
export interface Model3DLoaderOptions extends GltfAssetCacheOptions {
    readonly renderer: WebGPURenderer;
    readonly decoderDirectory?: string;
    readonly ktx2TranscoderDirectory?: string;
}

/** Configured project asset identity; the cache still returns native GLTF. */
export interface GltfAssetReference {
    readonly url: string;
    /** Content identity shared by aliases that resolve to identical self-contained bytes. */
    readonly contentHash?: string;
    /** Hot-reload generation when the URL and content identity stay stable. */
    readonly generation?: string | number;
}

export interface GltfAssetRequestOptions {
    /** Higher values leave the bounded load queue first. */
    readonly priority?: number;
    /**
     * Static asset-internal render sources skip per-frame compatibility audits.
     * Call invalidateRendering() after changing descendants of the returned scene.
     */
    readonly renderSourceMutability?: 'mutable' | 'static';
    /** Test/development guard that audits a static source for missed invalidation. */
    readonly verifyStaticRenderSource?: boolean;
}

/** Game configured GLTF instance returned to game code. */
export interface GltfInstance {
    readonly scene: Group;
    readonly animations: readonly AnimationClip[];
    /** Rebuilds Desktop render batches after mutating the asset-internal scene. */
    readonly invalidateRendering: () => void;
}

export interface GltfAssetCacheSnapshot {
    readonly urls: number;
    readonly pendingLoads: number;
    readonly liveInstances: number;
    readonly estimatedGpuBytes: number;
    readonly cachedEstimatedGpuBytes: number;
    readonly maxEstimatedGpuBytes: number | null;
    readonly overBudgetBytes: number;
}

/**
 * Shares GLTF parse/GPU resources while creating independent native scene and
 * skeleton instances. Importing this module provides the complete GLTF API.
 */
export interface GltfAssetCache {
    instantiate(scope: LifetimeScope, reference: string | GltfAssetReference, configure?: (scene: Group) => void, request?: GltfAssetRequestOptions): Promise<GltfInstance>;
    preload(scope: LifetimeScope, reference: string | GltfAssetReference, request?: GltfAssetRequestOptions): Promise<void>;
    snapshot(): GltfAssetCacheSnapshot;
    invalidate(reference: string | GltfAssetReference): void;
    dispose(): void;
}

/** Session-shared GLB loader that creates independently scoped model instances. */
export interface Model3DLoader {
    /**
     * Applies the supplied asset correction beneath a local +Z semantic root.
     * Authored `_LOD*` branches with a positive integer become exclusive
     * `THREE.LOD` levels. Do not hide those nodes; distance selection is the
     * loader's.
     */
    load(scope: LifetimeScope, options: Model3DLoadOptions): Promise<Group>;
    preload(scope: LifetimeScope, reference: string | GltfAssetReference, request?: GltfAssetRequestOptions): Promise<void>;
    /** Read-only cache metrics for host diagnostics. */
    snapshot(): GltfAssetCacheSnapshot;
}

/**
 * Creates the complete official Three GLTF profile and its shared parse cache
 * as one scope-owned asset service.
 */
export function createGltfAssets(scope: LifetimeScope, options?: GltfAssetsOptions): GltfAssetCache;

/** Public scene-source name for createGltfAssets. */
export { createGltfAssets as attachGltfAssets };

/** Attaches one renderer-aware Model3D loader and shared GLTF cache to a runtime session. */
export function attachModel3DLoader(owner: LifetimeScope, options: Model3DLoaderOptions): Model3DLoader;

/** Official Three KTX2/Basis transcoder directory. */
export const DEFAULT_KTX2_TRANSCODER_DIRECTORY: string;

/** Renderer-local Basis target policy for asset families with a known BPTC issue. */
type RendererKtx2LoaderProfile = 'default' | 'avoid-bptc';
