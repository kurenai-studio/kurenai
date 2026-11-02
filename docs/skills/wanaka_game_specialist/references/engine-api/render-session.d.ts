// Import from "wanaka-studio-engine/render-session".

import { type Texture } from "three/webgpu";
import { WebGPURenderer, type Scene } from "three/webgpu";
import { type ProjectRenderSettings, type ProjectShadowMapMode } from "@wanaka/render-contracts";
import { type Node } from "three/webgpu";
import { type ProjectVisualLookPalette, type ProjectVisualCompatibilitySettings, type ProjectVisualRenderingSettings, type ProjectVisualShadingSettings, type ProjectVisualShadowMode, type ProjectVisualStylePostSettings } from "@wanaka/render-contracts";
import type { LifetimeScope } from "wanaka-studio-engine";
import type { Object3D } from "three/webgpu";
import { type Disposable } from "wanaka-studio-engine";
import type { RuntimeSession } from "wanaka-studio-engine";
import type { Camera } from "three/webgpu";
import { RenderPipeline } from "three/webgpu";
import { type ProjectDirectionalShadowSettings } from "@wanaka/render-contracts";
import { type CaptureFrameOptions, type CaptureOverlay, type CaptureOverlaySurface } from "wanaka-studio-engine/capture";

export type { ProjectDirectionalShadowSettings } from "@wanaka/render-contracts";

export { PROJECT_SHADOW_MAP_MODES } from "@wanaka/render-contracts";

export type { ProjectRenderSettings, ProjectVisualCompatibilitySettings, ProjectVisualPostSettings, ProjectVisualRenderingSettings, ProjectVisualShadingModel, ProjectVisualShadingSettings, ProjectVisualShadowMode, ProjectVisualStylePostSettings, } from "@wanaka/render-contracts";

/** Narrow ownership context for project-authored official Three pipelines. */
export interface RenderPipelineFactoryContext {
    readonly renderer: WebGPURenderer;
    readonly scene: Scene;
    readonly camera: Camera;
    readonly quality: RenderQualityTier;
    /** Complete profile, including Agent-authored custom overrides. */
    readonly profile?: RenderQualityProfile;
    /** Effective authored-scene density selected by the active quality tier. */
    readonly pixelRatio: number;
    /** Canvas drawing-buffer density that pipeline resolution scales are relative to. */
    readonly presentationPixelRatio: number;
    /** Optional mobile reconstruction pass applied after the lower-resolution scene. */
    readonly mobileUpscaling?: RenderUpscalingMode;
    /** Owns auxiliary nodes and textures; the returned pipeline is owned automatically. */
    own<T extends Disposable>(value: T): T;
    /** ProjectRendering reports the admitted standard graph; custom factories omit this. */
    recordProjectGraph?(receipt: ProjectRenderGraphReceipt): void;
}

export type RenderPipelineFactory = (context: RenderPipelineFactoryContext) => RenderPipeline;

/** The single main view rendered by a RenderSession (v1: exactly one). */
export interface RenderView {
    readonly scene: Scene;
    readonly camera: Camera;
    /** Official Three TSL pipeline constructed with this session's renderer. */
    readonly pipeline?: RenderPipeline;
    /** Rebuildable official Three pipeline for preset changes and view replacement. */
    readonly createPipeline?: RenderPipelineFactory;
    /** Precompiles this exact native presentation before it becomes active. */
    readonly prepare?: () => Promise<void>;
    /** Updates view-local viewport state such as native ArrayCamera subviews. */
    readonly resize?: (width: number, height: number) => void;
    /** Builds the same project-owned presentation for another native camera. */
    readonly forCamera?: (camera: Camera) => RenderView;
    /**
     * Optional monotonic scene-structure generation. When supplied, the render
     * session may reuse scene submission until the owner calls `invalidate` on
     * its generation contract.
     */
    readonly sceneSubmissionGeneration?: () => number;
}

export interface RenderSessionOptions {
    readonly renderer: WebGPURenderer;
    /** Current host viewport size; polled once per frame. */
    readonly getSize: () => {
        width: number;
        height: number;
    };
    /** Monotonic profiling clock. Defaults to the browser performance clock. */
    readonly now?: () => number;
    readonly pixelRatio?: number;
    /** Canvas drawing-buffer density. Play keeps this native host density while scene scale varies. */
    readonly presentationPixelRatio?: number;
    /** Optional mobile reconstruction pass for a lower-resolution scene presentation. */
    readonly mobileUpscaling?: RenderUpscalingMode;
    /** Fixed presets or measured Auto. Defaults to Medium. */
    readonly quality?: RenderQualitySelection | RenderQualityCustomSettings;
    /** Steady-window Auto bounds. Ultra and Cinematic remain opt-in unless explicitly allowed. */
    readonly adaptive?: {
        readonly frameBudgetMs?: number;
        readonly minimumTier?: RenderQualityTier;
        readonly maximumTier?: RenderQualityTier;
    };
    /** Frame delta clamp guarding against tab-suspend spikes. */
    readonly maxDeltaSeconds?: number;
    /** Simulation tick source. Defaults to a dedicated worker's timer, which a
     * backgrounded page does not throttle. */
    readonly simulationClock?: SimulationClockFactory;
    /** Lowest simulation rate; clamps frame delta to `1 / minFps` seconds. Minimum 1. */
    readonly minFps?: number;
    /** Presentation cap. Frames arriving sooner than `1 / maxFps` are skipped. Minimum 1. */
    readonly maxFps?: number;
    /** Host boundary that recreates the renderer/session after an unrecoverable loss. */
    readonly onDeviceLost?: (snapshot: RenderDeviceLossSnapshot) => void;
    /** Post-warm-up VFX compile policy. Defaults to report. */
    readonly compileGuard?: CompileGuardMode;
}

export interface CameraPreviewCapture {
    readonly width: number;
    readonly height: number;
    readonly pixels: Uint8Array;
}

/** Backend selected by Three after WebGPURenderer initialization. */
export type RenderBackendKind = 'webgpu' | 'webgl2' | 'unknown';

/** Immutable renderer-loss receipt; the current Three renderer cannot resume. */
export interface RenderDeviceLossSnapshot {
    readonly state: 'ready' | 'lost';
    readonly sequence: number;
    readonly backend: RenderBackendKind;
    readonly api: 'WebGPU' | 'WebGL' | 'unknown';
    readonly message: string | null;
    readonly reason: string | null;
    readonly recovery: 'recreate-render-session';
}

/** Stable diagnostic emitted when the current renderer can no longer submit frames. */
export const RENDER_DEVICE_LOST_DIAGNOSTIC_CODE: string;

/** Availability state for asynchronous GPU render timestamp samples. */
export type GpuTimestampStatus = 'unsupported' | 'tracking-disabled' | 'no-query' | 'pending' | 'available' | 'resolve-error';

/** How timestamp instrumentation is applied to renderer frames. */
export interface GpuTimestampSamplingSnapshot {
    readonly mode: 'disabled' | 'continuous' | 'sparse';
    readonly intervalFrames: number | null;
    readonly instrumentedFrames: number;
}

/** Renderer-owned GPU resource counters and byte estimates. */
export interface RenderMemorySnapshot {
    readonly totalBytes: number;
    readonly textureBytes: number;
    readonly bufferBytes: number;
    readonly programBytes: number;
    readonly unattributedBytes: number;
    readonly textures: number;
    readonly geometries: number;
    readonly programs: number;
    readonly renderTargets: number;
    readonly buffers: {
        readonly attributes: RenderMemoryBucketSnapshot;
        readonly indices: RenderMemoryBucketSnapshot;
        readonly indirectStorage: RenderMemoryBucketSnapshot;
        readonly storage: RenderMemoryBucketSnapshot;
        readonly uniforms: RenderMemoryBucketSnapshot;
        readonly readback: RenderMemoryBucketSnapshot;
    };
}

/** One renderer-owned allocation class reported by Three. */
export interface RenderMemoryBucketSnapshot {
    readonly count: number;
    readonly bytes: number;
}

/** Active and retained Auto-quality presentations that remain GPU-resident. */
export interface RenderPresentationResidencySnapshot {
    readonly total: number;
    readonly presentations: readonly {
        readonly state: 'active' | 'prewarmed';
        readonly tier: RenderQualityTier;
        readonly pixelRatio: number;
        readonly presentationPixelRatio: number;
        readonly presentation: RenderPresentationSnapshot;
    }[];
}

/** Main-thread work measured inside one RenderSession animation callback. */
export interface RenderCpuSnapshot {
    readonly frame: number;
    readonly frameMs: number;
    readonly resizeMs: number;
    readonly simulationMs: number;
    readonly renderSubmitMs: number;
    readonly renderSubmitBreakdown?: RenderSubmitCpuBreakdownSnapshot;
}

/** Non-overlapping CPU phases included in one main-view render submission. */
export interface RenderSubmitCpuBreakdownSnapshot {
    readonly syncBeforeRenderMs: number;
    readonly visibilityPreparationMs: number;
    readonly instancingPreparationMs: number;
    readonly computeDispatchMs: number;
    readonly pipelineRenderMs: number;
    readonly instancingRestoreMs: number;
    readonly visibilityRestoreMs: number;
    readonly shadowReuseOverheadMs: number;
    readonly shadowCleanupMs: number;
    readonly unattributedMs: number;
}

export type RenderWarmupStatus = 'not-run' | 'running' | 'complete' | 'failed';

/** One-shot load/transition work excluded from steady gameplay frames. */
export interface RenderWarmupSnapshot {
    readonly status: RenderWarmupStatus;
    readonly failureStage?: RenderWarmupFailureStage;
    readonly textureCount: number;
    readonly resourcePrepareMs: number;
    readonly textureUploadMs: number;
    readonly computePipelineCount: number;
    readonly computeCompileMs: number;
    readonly shaderCompileMs: number;
    readonly pipelineSubmitMs: number;
    readonly totalMs: number;
    readonly pipelineSubmitted: boolean;
    readonly completedAtRendererFrame: number;
}

/** Static backend feature receipt read after Three initializes its selected backend. */
export interface RenderFeatureSnapshot {
    readonly webgpuCompatibilityMode: boolean | null;
    readonly timestampQuery: boolean;
    readonly timestampGranularity: 'render-context' | 'outermost-render-context' | 'unavailable';
    readonly float32Filterable: boolean;
    readonly shaderF16: boolean;
    readonly subgroups: boolean;
    readonly clipDistances: boolean;
    readonly textureCompressionBC: boolean;
    readonly textureCompressionETC2: boolean;
    readonly textureCompressionASTC: boolean;
    readonly webglMultiDraw: boolean;
}

/** One immutable frame receipt read from Three's renderer info module. */
export interface RenderGpuSnapshot {
    readonly frameTimings?: FrameTelemetrySnapshot;
    readonly backend: RenderBackendKind;
    readonly frame: number;
    readonly renderPasses: number;
    readonly computeCalls: number;
    readonly drawCalls: number;
    readonly triangles: number;
    readonly points: number;
    readonly lines: number;
    readonly gpuRenderMs?: number;
    readonly gpuPasses?: readonly RenderGpuPassSnapshot[];
    readonly gpuTimestampFrame?: number;
    readonly gpuTimestampStatus: GpuTimestampStatus;
    readonly gpuTimestampSampling: GpuTimestampSamplingSnapshot;
    readonly memory: RenderMemorySnapshot;
    readonly cpu: RenderCpuSnapshot;
    readonly features: RenderFeatureSnapshot;
    readonly quality: RenderQualitySnapshot;
    readonly presentations: RenderPresentationResidencySnapshot;
    readonly sceneInventory: RenderSceneInventorySnapshot;
    readonly warmup: RenderWarmupSnapshot;
    /** Post-warm-up VFX pipeline compile counters. Present even when the guard is off. */
    readonly compileGuard: CompileGuardSnapshot;
    readonly desktopGltfInstancing?: DesktopGltfInstancingFrameSnapshot;
    readonly desktopGpuVisibility?: DesktopGpuVisibilityFrameSnapshot;
    readonly desktopShadowReuse?: DesktopShadowReuseFrameSnapshot;
}

/**
 * Frozen one-frame GPU pass tree. This is a ProfileGPU-style receipt, not a
 * shader or resource debugger, and it never invents GPU time from CPU work.
 */
export interface RenderGpuFrameCapture {
    readonly kind: 'gpu-frame';
    readonly backend: RenderBackendKind;
    readonly rendererFrame: number;
    readonly gpuTimestampStatus: GpuTimestampStatus;
    readonly gpuTimestampFresh: boolean;
    readonly gpuTimestampSampling: GpuTimestampSamplingSnapshot;
    readonly timestampGranularity: RenderFeatureSnapshot['timestampGranularity'];
    readonly gpuRenderMs?: number;
    readonly gpuTimestampFrame?: number;
    readonly gpuPasses: readonly RenderGpuPassSnapshot[];
    readonly drawCalls: number;
    readonly triangles: number;
    readonly computeCalls: number;
    readonly renderPasses: number;
    readonly quality: RenderQualitySnapshot;
}

/**
 * Owns the renderer, the main animation loop, and frame submission for one
 * RuntimeSession. Game code never touches the renderer lifecycle; Scene
 * Authored scene presentation remains native Three state.
 */
export class RenderSession implements CaptureOverlaySurface {
    private constructor();
    /** Creates a RenderSession whose renderer and loop end with the scope. */
    static create(session: RuntimeSession, options: RenderSessionOptions): Promise<RenderSession>;
    /** Latest renderer submission, timing, backend, and resource receipt. */
    get gpuSnapshot(): RenderGpuSnapshot;
    /** Enables bounded frame receipts and GPU timestamps only for an attached profiler. */
    setFrameTelemetryEnabled(enabled: boolean): void;
    /** Current device/context state and required host recovery action. */
    get deviceSnapshot(): RenderDeviceLossSnapshot;
    /** Immutable hardware envelope for the active preset. */
    get qualityProfile(): RenderQualityProfile;
    /** Active authored-scene pixel ratio selected by the quality profile. */
    get pixelRatio(): number;
    /** Serializable profile receipt forwarded with every renderer sample. */
    get qualitySnapshot(): RenderQualitySnapshot;
    /** Selects a fixed preset or resumes measured Auto from the current tier. */
    selectQuality(selection: RenderQualitySelection | RenderQualityCustomSettings): RenderQualitySnapshot;
    /** Excludes a known discontinuity from the Auto steady-state window. */
    excludeFromQualityObservation(reason: RenderQualityObservationExclusion, durationMs?: number): void;
    /**
     * Pre-uploads attached textures and compiles the exact main view before the
     * gameplay loop. A TSL pipeline receives one explicit pre-loop submission.
     */
    warmup(view: RenderView, options?: RenderWarmupOptions): Promise<RenderWarmupSnapshot>;
    /** Game renderer shared with the active scene factory. */
    get nativeRenderer(): WebGPURenderer;
    /** Applies the project-owned directional CSM controls before the next scene presentation. */
    setDirectionalShadowSettings(settings?: ProjectDirectionalShadowSettings): void;
    /** Current project directional-shadow controls, if the project authored them. */
    get directionalShadowSettings(): ProjectDirectionalShadowSettings | undefined;
    /**
     * Current source view, retained so editor sidecars can rebuild it after a
     * temporary camera replacement without reusing a disposed preset pipeline.
     */
    get mainView(): RenderView | undefined;
    /** Current host presentation size used by the active native view. */
    get presentationSize(): {
        readonly width: number;
        readonly height: number;
    };
    /**
     * Captures the current native scene through a selected native camera using
     * this session's renderer. The hooks keep editor-only helpers out of the
     * author-facing frame without changing authored visibility.
     */
    captureCameraPreview({ scene, camera, width, height, beforeRender, afterRender, }: {
        readonly scene: Scene;
        readonly camera: Camera;
        readonly width: number;
        readonly height: number;
        readonly beforeRender?: () => void;
        readonly afterRender?: () => void;
    }): Promise<CameraPreviewCapture | null>;
    /**
     * Host image of the last submitted frame from the native renderer canvas;
     * defaults to PNG and accepts capture output options.
     *
     * While the session is running the capture is answered inside the next
     * submitted frame, so it shows a whole frame rather than a partly drawn one.
     * Resolves `null` when there is no frame to hand back — including once the
     * render device has been lost, which never produces another one.
     */
    capturePng(options?: CaptureFrameOptions): Promise<string | null>;
    /**
     * Holds the latest submitted frame's GPU pass tree. Pending timestamp queries
     * are resolved first. Unavailable timestamps stay explicit; CPU time is never
     * reported as GPU time.
     */
    captureGpuFrame(): Promise<RenderGpuFrameCapture>;
    /** Registers a DOM HUD root in the host screenshot composite. */
    addCaptureOverlay(overlay: CaptureOverlay): () => void;
    /**
     * Suspends or resumes presentation without disposing the renderer or scene.
     * Retained on RenderSession as part of the published Engine host API contract.
     */
    setPresentationSuspended(suspended: boolean): void;
    /** Re-scans native scene structure and inventoried classification flags. */
    refreshSceneInventory(): RenderSceneInventorySnapshot;
    /**
     * Starts the main loop: advances the runtime session through its phases,
     * then submits exactly one main view.
     */
    start(session: RuntimeSession, view: RenderView): void;
    /** Verifies that a native view belongs to this renderer. */
    validateView(view: RenderView): void;
    /** Compiles a view through Three's asynchronous WebGPU pipeline path. */
    prepareView(view: RenderView): Promise<void>;
    /** Replaces the one native main view without restarting the renderer loop. */
    replaceMainView(view: RenderView): void;
}

export interface RenderWarmupOptions {
    /** Textures not reachable from attached scene materials, such as variants. */
    readonly textures?: Iterable<Texture>;
}

/** Stages reported when renderer warm-up fails before the first gameplay frame. */
export type RenderWarmupFailureStage = 'texture-upload' | 'compute-compile' | 'shader-compile' | 'pipeline-submit';

/** Ordered production presets available to the automatic runtime controller. */
export const RENDER_QUALITY_TIERS: readonly [
    'low',
    'medium',
    'high',
    'ultra',
    'cinematic'
];

export type RenderQualityTier = (typeof RENDER_QUALITY_TIERS)[number] | (typeof RENDER_MOBILE_QUALITY_PRESETS)[number];

/** Reconstruction path applied after a lower-resolution scene presentation. */
export type RenderUpscalingMode = 'none' | 'fsr1';

/** Custom pipeline literals win; quality defaults apply only while that master is off. */
export function admitsQualityDefault(customPipelineEnabled: boolean, literal: boolean, qualityDefault: boolean): boolean;

/** Standard effect switches after project-master and quality-default admission. */
export const PROJECT_RENDER_EFFECT_KEYS: readonly [
    'ambientOcclusion',
    'ssgi',
    'vxgi',
    'orderIndependentTransparency',
    'ssr',
    'bloom',
    'depthOfField',
    'motionBlur',
    'godRays',
    'lensFlare',
    'afterimage',
    'contactShadows'
];

export type ProjectRenderEffectKey = (typeof PROJECT_RENDER_EFFECT_KEYS)[number];

export type ProjectRenderEffectSwitches = Readonly<Record<ProjectRenderEffectKey, boolean>>;

/** Resolves the effects that cannot be admitted with SSGI in the same render graph. */
export function resolveProjectRenderEffectExclusivity(effects: Pick<ProjectRenderSettings, 'ssgi' | 'depthOfField' | 'lensFlare'>): ProjectRenderEffectExclusivity;

/**
 * Resolves the shared switch policy before camera, backend, light, or AA
 * capability checks. Hosts may further narrow these admitted switches.
 */
export function resolveProjectRenderEffectSwitches(settings: Pick<ProjectRenderSettings, ProjectRenderEffectKey | 'enabled'>, qualityDefaults: Pick<RenderQualityProfile, 'defaultPresetAmbientOcclusion' | 'defaultPresetGlobalIllumination' | 'defaultPresetReflections'>): ProjectRenderEffectSwitches;

/**
 * Official Three reverse-Z. Always on for the product renderer; not a
 * quality tier or Visual Style control.
 */
export const RENDER_PRODUCT_REVERSED_DEPTH: boolean;

/** Constructs the product `WebGPURenderer` with reverse-Z and the product tone curve. */
export function createProductRenderer(parameters?: ConstructorParameters<typeof WebGPURenderer>[0]): WebGPURenderer;

/** User-selected automatic or fixed rendering tier. */
export type RenderQualitySelection = 'auto' | RenderQualityTier;

/** Labels used by Studio and telemetry when a project owns a custom profile. */
export type RenderQualityLabel = RenderQualitySelection | 'custom';

/**
 * Agent-authored quality overrides. Omitted leaves inherit from `baseTier`;
 * the runtime validates every override before constructing a presentation.
 */
export interface RenderQualityCustomSettings {
    readonly preset: 'custom';
    readonly baseTier?: RenderQualityTier;
    readonly antialiasing?: RenderQualityAntialiasing;
    readonly pixelRatioCap?: number;
    readonly sceneResolutionScale?: number;
    readonly temporalUpscale?: boolean;
    readonly defaultPresetAmbientOcclusion?: boolean;
    readonly defaultPresetGlobalIllumination?: boolean;
    readonly defaultPresetReflections?: boolean;
    readonly ambientOcclusion?: {
        readonly resolutionScale?: 0.5 | 1;
        readonly samples?: 4 | 8 | 16;
    };
    readonly globalIllumination?: {
        readonly sliceCount?: number;
        readonly stepCount?: number;
    };
    readonly reflections?: {
        readonly resolutionScale?: number;
        readonly quality?: number;
        readonly binaryRefine?: boolean;
    };
    readonly bloomResolutionScale?: number;
    readonly shadowMap?: Exclude<ProjectShadowMapMode, 'off'>;
    readonly shadowMapSize?: 512 | 1024 | 2048 | 4096;
}

/** Quality input accepted by game source and the RenderSession boundary. */
export type RenderQualityInput = RenderQualitySelection | RenderQualityCustomSettings;

export const RENDER_QUALITY_SELECTIONS: readonly RenderQualitySelection[];

export const RENDER_QUALITY_LABELS: readonly RenderQualityLabel[];

/** Discontinuities that must not contribute to an automatic quality decision. */
export type RenderQualityObservationExclusion = 'warmup' | 'quality-transition' | 'resize' | 'camera-cut' | 'tab-resume' | 'resource-upload';

export const DEFAULT_RENDER_QUALITY_SELECTION: RenderQualitySelection;

/** Renderer output state recorded alongside the admitted presentation. */
export interface RenderOutputSnapshot {
    /** Three tone-mapping operator admitted by the renderer. */
    readonly toneMapping: number;
    /** Live renderer exposure consumed by Three's output node. */
    readonly toneMappingExposure: number;
    /** Renderer display color space used by the output node. */
    readonly outputColorSpace: string;
}

/** What a project-owned pipeline actually admitted, or that it replaced the standard graph. */
export interface ProjectRenderGraphReceipt {
    readonly kind: 'controller' | 'custom';
    readonly antiAliasing: string;
    readonly effects: readonly string[];
    readonly fallbacks?: readonly string[];
    /** Whether temporal consumers require instanceIndex to retain object identity across frames. */
    readonly requiresStableInstanceIdentity?: boolean;
    /**
     * Official god-ray node light captured on this rebuild. Present while the
     * switch is on, including `null` when the scene has no directional/point light.
     */
    readonly boundGodRaysLight?: object | null;
    /**
     * Official contact-shadow node light captured on this rebuild. Present while
     * the switch is on, including `null` when the scene has no directional light.
     */
    readonly boundContactShadowLight?: object | null;
    /** Optional generic invalidation seam for scene-dependent project presentations. */
    readonly presentationIsCurrent?: (scene: Scene) => boolean;
}

/** What the built-in Three pipeline actually admitted for the active view. */
export interface RenderPresentationSnapshot {
    readonly owner: 'wanaka-preset' | 'project-pipeline';
    readonly antialiasing: RenderQualityAntialiasing | 'none' | 'project';
    readonly authoringOverlayAntialiasing: 'off' | 'msaa4' | 'project';
    readonly ambientOcclusion: 'off' | 'gtao' | 'project';
    /** Scene-pass resolution relative to the Canvas drawing buffer. */
    readonly sceneResolutionScale: number | null;
    readonly estimatedTransientBytes: number;
    /** Estimated resources retained across frames by the admitted graph. */
    readonly estimatedPersistentBytes: number;
    /** Estimated temporal history resources that survive the current frame. */
    readonly estimatedHistoryBytes: number;
    /** Per-effect admission estimates; unknown effects are marked unaccounted. */
    readonly effectBudgets?: readonly RenderEffectBudgetReceipt[];
    readonly fallbacks: readonly string[];
    readonly antialiasingReceipt?: RenderAntialiasingReceipt;
    /** Present when the scene is reconstructed to the native presentation density. */
    readonly upscaling?: Exclude<RenderUpscalingMode, 'none'>;
    readonly output: RenderOutputSnapshot;
    /** Present on project pipelines; omitted from the built-in preset. */
    readonly projectGraph?: ProjectRenderGraphReceipt;
    /** Effective directional-shadow policy installed for this presentation. */
    readonly directionalShadow?: {
        readonly mode: 'single' | 'csm';
        readonly shadowDistance: number;
        readonly cascades: 2 | 3 | 4;
        readonly splitLambda: number;
        readonly texelAlignment: boolean;
        readonly fade: boolean;
    };
}

/** Serializable active-quality receipt forwarded with renderer telemetry. */
export interface RenderQualitySnapshot {
    readonly mode: RenderQualityControlMode;
    readonly requestedTier: RenderQualityTier | null;
    readonly activeTier: RenderQualityTier;
    /** Present when the source selected an Agent-authored custom profile. */
    readonly selection?: RenderQualityLabel;
    readonly pixelRatio: number;
    /** Drawing-buffer density currently applied to the renderer Canvas. */
    readonly presentationPixelRatio: number;
    readonly transitionSequence: number;
    readonly presentation: RenderPresentationSnapshot | null;
    readonly lastDecision: RenderQualityDecisionSummary | null;
}

/** Canonical quality-tier profile shared by built-in and project feature pipelines. */
export interface RenderQualityProfile {
    readonly tier: RenderQualityTier;
    readonly antialiasing: RenderQualityAntialiasing;
    readonly pixelRatioCap: number;
    /**
     * Internal scene/effect resolution relative to the presentation buffer.
     * Temporal upscaling may reconstruct this into the full presentation size.
     */
    readonly sceneResolutionScale: number;
    /** Uses the low-resolution temporal reconstruction path when the tier allows it. */
    readonly temporalUpscale: boolean;
    readonly defaultPresetAmbientOcclusion: boolean;
    /** Admitted while the custom pipeline is off. Same rule as default GTAO. */
    readonly defaultPresetGlobalIllumination: boolean;
    /** Admitted while the custom pipeline is off. Same rule as default GTAO. */
    readonly defaultPresetReflections: boolean;
    readonly ambientOcclusion: {
        readonly resolutionScale: 0.5 | 1;
        readonly samples: 4 | 8 | 16;
    };
    readonly globalIllumination: {
        readonly sliceCount: number;
        readonly stepCount: number;
    };
    readonly reflections: {
        readonly resolutionScale: number;
        readonly quality: number;
        /** Official SSR binary-search hit refinement. Compile-time; cinematic only. */
        readonly binaryRefine: boolean;
    };
    readonly bloomResolutionScale: number;
    /** Renderer shadow-map mode. Always on. Low uses PCF; every higher tier uses PCF Soft. */
    readonly shadowMap: Exclude<ProjectShadowMapMode, 'off'>;
    /** Power-of-two shadow map extent. High and Ultra share 2048; Cinematic uses 4096. */
    readonly shadowMapSize: 512 | 1024 | 2048 | 4096;
}

export function resolveRenderQualityProfile(tier: RenderQualityTier): RenderQualityProfile;

/** Runtime guard for an Agent-authored custom quality object. */
export function isRenderQualityCustomSettings(value: unknown): value is RenderQualityCustomSettings;

/** Resolves a custom quality object into the complete immutable runtime profile. */
export function resolveRenderQualityCustomProfile(settings: RenderQualityCustomSettings): RenderQualityProfile;

/** Resolves either a named selection or a custom source object. */
export function resolveRenderQualityProfileForInput(input: RenderQualityInput): RenderQualityProfile;

export function isRenderQualityTier(value: string): value is RenderQualityTier;

export function isRenderQualitySelection(value: string): value is RenderQualitySelection;

declare const RENDER_MOBILE_QUALITY_PRESETS: readonly [
    'mobile',
    'mobile+',
    'mobile++',
    'mobile+++'
];

/** Three-native anti-aliasing path fixed to one quality tier. */
type RenderQualityAntialiasing = 'fxaa' | 'smaa' | 'msaa4-fxaa' | 'traa' | 'taau' | 'ssaa';

type ProjectRenderEffectExclusivity = Readonly<{
    ssgi: boolean;
    depthOfField: boolean;
    lensFlare: boolean;
}>;

type RenderQualityControlMode = 'auto' | 'manual';

interface RenderQualityDecisionSummary {
    readonly action: RenderQualityDecisionAction;
    readonly reason: RenderQualityDecisionReason;
    readonly bottleneck: RenderQualityBottleneck;
}

/** Native antialiasing target topology actually admitted for the active view. */
interface RenderAntialiasingReceipt {
    readonly sceneSamples: 0 | 4;
    readonly separateGbuffer: boolean;
    /** Whether the temporal AA node reconstructs a lower-resolution scene into the display buffer. */
    readonly temporalUpscale: boolean;
    readonly resolvedMsaa: {
        readonly resolveDepthBuffer: boolean;
        readonly storeMultisampledColorBuffer: boolean;
        readonly storeMultisampledDepthBuffer: boolean;
        readonly storeMultisampledStencilBuffer: boolean;
    } | null;
    /** Present when a mobile reconstruction pass replaced the native AA tail. */
    readonly upscaling?: Exclude<RenderUpscalingMode, 'none'>;
}

/** Admission estimate for one named effect in a render presentation. */
interface RenderEffectBudgetReceipt {
    readonly effect: string;
    readonly estimatedTransientBytes: number;
    readonly estimatedPersistentBytes: number;
    readonly estimatedHistoryBytes: number;
    readonly estimatedTotalBytes: number;
    /** False when the effect has no estimator in this admission model. */
    readonly accounted: boolean;
}

type RenderQualityBottleneck = 'cpu' | 'gpu' | 'balanced' | 'frame';

type RenderQualityDecisionAction = 'hold' | 'upgrade' | 'downgrade' | 'ignored';

type RenderQualityDecisionReason = 'manual-lock' | 'excluded-window' | 'invalid-window' | 'runtime-ceiling' | 'cooldown' | 'over-budget' | 'under-budget' | 'neutral' | 'minimum-tier' | 'maximum-tier';

/** One resolved GPU duration, grouped by a stable render-pass label. */
export interface RenderGpuPassSnapshot {
    readonly label: string;
    readonly gpuMs: number;
    readonly calls: number;
}

export type ProjectRenderCompose = (color: Node<'vec4'>, context: RenderPipelineFactoryContext) => Node<'vec4'>;

/** Extra official nodes on the standard graph. Do not replace the whole pipeline. */
export interface ProjectRenderGraphExtensions {
    readonly composeLinear?: ProjectRenderCompose;
    readonly composeDisplay?: ProjectRenderCompose;
}

/**
 * Named Visual Profile values accepted by the rendering facade.
 * `targetScene` is optional so older positional callers can keep their exact ABI.
 */
export interface ProjectVisualSettingsOptions {
    readonly post: ProjectVisualStylePostSettings;
    /** Legacy positional-equivalent field; prefer `compatibility.shadowMode`. */
    readonly shadowMode?: ProjectVisualShadowMode;
    readonly targetScene?: Scene | null;
    readonly shading?: ProjectVisualShadingSettings;
    readonly palette?: ProjectVisualLookPalette;
    /** Groups fields retained only for source compatibility with Visual Profile v1. */
    readonly compatibility?: ProjectVisualCompatibilitySettings;
}

/**
 * Hides the standard Wanaka effect graph behind one mutable project switch object.
 * Pipelines and their Three nodes remain owned by the receiving RenderSession view.
 */
export class ProjectRendering {
    constructor(settings: ProjectRenderSettings, visual?: ProjectVisualRenderingSettings, compose?: ProjectRenderGraphExtensions);
    /** Current pipeline factory, or undefined while the project switch is disabled. */
    get createPipeline(): RenderPipelineFactory | undefined;
    /**
     * Applies Visual Style exposure and the cel material library.
     * Visual Style must not replace Rendering switches. Renderer
     * shadow-map mode stays with the active quality tier.
     * Pass `scene` so cached RenderObjects rebuild after a shading-model change.
     * Omitting it only updates the renderer library and exposure.
     */
    configureRenderer(renderer: WebGPURenderer, scene?: Scene): void;
    /** Changes the live DOF mix without replacing the active pipeline. */
    setDepthOfFieldAmount(amount: number): void;
    /** Changes the live Bloom strength without replacing the active pipeline. */
    setBloomStrength(strength: number): void;
    /** Changes the live linear Bloom extraction threshold without replacing the active pipeline. */
    setBloomThreshold(threshold: number): void;
    /** Changes the live motion-blur amount without replacing the active pipeline. */
    setMotionBlurAmount(amount: number): void;
    /** Changes the live god-ray density without replacing the active pipeline. */
    setGodRaysDensity(density: number): void;
    /** Changes the live lens-flare amount without replacing the active pipeline. */
    setLensFlareAmount(amount: number): void;
    /** Changes the live afterimage damp without replacing the active pipeline. */
    setAfterimageDamp(damp: number): void;
    /** Changes the live contact-shadow intensity without replacing the active pipeline. */
    setContactShadowsIntensity(intensity: number): void;
    /** Validates new switches and replaces only the active RenderSession presentation. */
    applySettings(rendering: RenderSession, settings: unknown): void;
    /**
     * Applies Visual Profile post/shadow/shading values without leaking preview state to another scene.
     * Legacy Bloom and shadow fields are validated for source compatibility, but
     * Rendering settings remain their runtime owner. `shading` is the fifth
     * argument and `palette` is the sixth; do not pass either in the `targetScene` position.
     * A previously bound `.cube` LUT is consumed on this call; otherwise the last
     * applied LUT stays.
     */
    applyVisualSettings(rendering: RenderSession, options: ProjectVisualSettingsOptions): void;
    applyVisualSettings(rendering: RenderSession, post: unknown, shadowMode: unknown, targetScene?: Scene | null, shading?: unknown, palette?: unknown): void;
    applyVisualSettings(rendering: RenderSession, postOrOptions: unknown, shadowMode?: unknown, targetScene?: Scene | null, shading?: unknown, palette?: unknown): void;
    /** Releases renderer-local Visual Style state when its final scene owner is disposed. */
    releaseVisualRenderer(renderer: WebGPURenderer): void;
}

/**
 * Bakes every official WebGPU LightProbeGrid already in the opened scene.
 * Project source adds the grid; this only runs the GPU bake after the renderer is ready.
 */
export function bakeSceneLightProbeGrids(renderer: WebGPURenderer, scene: Scene): number;

export const VISUAL_WEATHER_OBJECT_NAME: string;

/**
 * Official TSL soft particles for Visual Profile weather. WebGPU point primitives
 * are 1px, so sized flakes use an instanced Sprite plus PointsNodeMaterial.
 */
export function installVisualWeather(scope: LifetimeScope, host: VisualWeatherHost, weather: VisualWeatherSettings, particleBudget: number): void;

interface VisualWeatherSettings {
    readonly kind: string;
    readonly amount: number;
    readonly wind: number;
}

interface VisualWeatherHost {
    readonly scene: Scene;
    readonly scheduler: {
        on(event: 'update', listener: (frame: {
            readonly deltaSeconds: number;
        }) => void): () => void;
    };
}

/** One traversal of native Three scene structure used for cost attribution. */
export interface RenderSceneInventorySnapshot {
    /** Descendant Object3D count; the supplied root is excluded. */
    readonly objects: number;
    /** Mesh, line, points, and sprite nodes submitted as renderable objects. */
    readonly renderables: number;
    /** Unique renderer geometry identities reachable from renderables. */
    readonly geometries: number;
    /** Unique renderer material identities reachable from renderables. */
    readonly materials: number;
    /** Renderables using Three's official immutable-object fast path. */
    readonly staticRenderables: number;
    /** Renderables which still require normal dynamic state observation. */
    readonly dynamicRenderables: number;
    readonly lights: number;
    readonly shadowCastingLights: number;
    readonly shadowAutoUpdateLights: number;
    readonly shadowManualUpdateLights: number;
    readonly shadowCasters: number;
    readonly shadowReceivers: number;
    readonly lods: number;
    readonly frustumCullingDisabled: number;
    readonly instancedMeshes: number;
    readonly instancedInstances: number;
    readonly gpuIndirectCulledInstancedMeshes: number;
    readonly gpuIndirectCulledInstances: number;
    readonly boundedInstancedMeshes: number;
    readonly unboundedInstancedMeshes: number;
    readonly batchedMeshes: number;
    readonly batchedInstances: number;
    readonly boundedBatchedMeshes: number;
    readonly unboundedBatchedMeshes: number;
}

/**
 * Captures native Three classification once. Callers explicitly refresh after
 * structural or inventoried classification changes so renderer telemetry never
 * adds a per-frame walk.
 */
export function captureRenderSceneInventory(root: Object3D): RenderSceneInventorySnapshot;

/** Bounded rolling receipts; sequence gaps reveal sampling loss. */
interface FrameTelemetrySnapshot {
    readonly generation: number;
    readonly frames: readonly FrameTelemetryRow[];
}

/** Sequence, animation interval, CPU callback, submission, and completed-warmup flag. */
type FrameTelemetryRow = readonly [
    number,
    number | null,
    number,
    number,
    boolean
];

/** Per-submission receipt for Desktop's transient GLTF instance substitution. */
interface DesktopGltfInstancingFrameSnapshot {
    readonly sourceDraws: number;
    readonly admittedBatches: number;
    readonly admittedInstances: number;
    readonly fallbackBatches: number;
    readonly fallbackSources: number;
    readonly estimatedDrawSavings: number;
    readonly admittedMatrixCapacitySlots: number;
    readonly admittedCapacityVariants: number;
    readonly admittedCapacityHistogram: Readonly<Record<InstanceMatrixCapacity, number>>;
    /** Spatial proxy draws recorded into static bundles for this submission. */
    readonly bundledProxyDraws: number;
    /** Source-space triangle count represented by bundled proxies before pass multiplication. */
    readonly bundledLogicalTriangles: number;
    readonly submittedBundleGroups: number;
    readonly bundleInvalidations: number;
    /** Parent-space batch bounds computed while creating new batches in this submission. */
    readonly batchBoundsRebuilds: number;
    /** Full batch compatibility checks run for mutable or assertion-enabled sources. */
    readonly sourceCompatibilityAudits: number;
    /** Source meshes covered by full compatibility checks in this submission. */
    readonly auditedSources: number;
    /** Cached batches discarded after an explicit source-generation change. */
    readonly invalidatedBatches: number;
    /** Whole-owner batch rebuilds caused by an explicit source-generation change. */
    readonly batchRebuilds: number;
    /** Source visible-property writes performed by render-representation activation. */
    readonly sourceVisibilityWrites: number;
    /** Source visible properties restored after the submission. */
    readonly restoredSources: number;
    readonly fallbackReasons: {
        readonly missingSource: number;
        readonly hierarchy: number;
        readonly visibility: number;
        readonly transform: number;
        readonly geometry: number;
        readonly material: number;
        readonly renderState: number;
        readonly hooks: number;
    };
}

type InstanceMatrixCapacity = (typeof INSTANCE_MATRIX_CAPACITIES)[number];

declare const INSTANCE_MATRIX_CAPACITIES: readonly [
    4,
    8,
    16,
    32,
    64,
    128
];

/** Per-submission counters that do not require a synchronous GPU readback. */
interface DesktopGpuVisibilityFrameSnapshot {
    readonly engineSceneTraversals: number;
    readonly visitedSceneObjects: number;
    readonly renderLayerVisibleObjects: number;
    readonly instancingOwners: number;
    readonly clusterControllerOwners: number;
    readonly shadowCastingLights: number;
    readonly candidateBatches: number;
    readonly candidateInstances: number;
    readonly admittedBatches: number;
    readonly admittedInstances: number;
    readonly fallbackBatches: number;
    readonly computeDispatches: number;
    /** Static batches whose parent-space bounds sit entirely inside the main frustum. */
    readonly wholeBatchInside: number;
    /** Static batches whose parent-space bounds sit entirely outside the main frustum. */
    readonly wholeBatchOutside: number;
    /** Static batches whose parent-space bounds cross the main frustum. */
    readonly wholeBatchIntersecting: number;
    readonly fixedIndirectCommands: number;
    readonly estimatedGpuBufferBytes: number;
    readonly logicalTriangles: number;
    readonly modelClusters: DesktopModelClusterFrameSnapshot;
    readonly renderLayers: DesktopRenderLayerPlanSnapshot;
    readonly fallbackReasons: Readonly<Record<DesktopGpuVisibilityFallbackReason, number>>;
}

/** Aggregate evidence for compiler-prepared model cluster proxies in the active scene. */
interface DesktopModelClusterFrameSnapshot {
    readonly algorithm: string;
    readonly targetTrianglesPerCluster: number;
    readonly registeredPrimitives: number;
    readonly registeredClusters: number;
    readonly registeredLogicalTriangles: number;
    readonly registeredGpuBufferBytes: number;
    readonly admittedPrimitives: number;
    readonly admittedClusters: number;
}

type DesktopGpuVisibilityFallbackReason = 'notDesktop' | 'notWebGpu' | 'unsupportedGraph' | 'unsupportedCamera' | 'temporalInstanceIdentity' | 'shadowCaster' | 'renderLayerCapacity' | 'renderLayerRouting' | 'nonIndexed' | 'drawRange' | 'instanceCount' | 'matrixLayout' | 'resourceCreation' | 'computeSubmission';

/** Per-submission evidence for Engine-owned main/shadow render routing. */
interface DesktopRenderLayerPlanSnapshot {
    readonly status: DesktopRenderLayerPlanStatus;
    readonly fallbackReason: DesktopRenderLayerFallbackReason;
    readonly originalMainCameraMask: number;
    readonly usedProjectLayers: number;
    readonly freeProjectLayers: number;
    readonly leasedLayers: readonly number[];
    readonly shadowLights: number;
    readonly shadowRoutes: number;
    readonly separatedClusterPrimitives: number;
    readonly separatedInstanceBatches: number;
    readonly separatedInstances: number;
}

type DesktopRenderLayerPlanStatus = 'inactive' | 'available' | 'active' | 'fallback';

type DesktopRenderLayerFallbackReason = 'none' | 'insufficientFreeLayers';

/** Per-submission receipt for conservative Desktop directional-shadow reuse. */
interface DesktopShadowReuseFrameSnapshot {
    readonly signatureScanMs: number;
    readonly cacheHits: number;
    readonly cacheMisses: number;
    readonly bypasses: number;
    readonly shadowUpdates: number;
    readonly shadowReuses: number;
}

/** What a session does when a VFX pipeline is created after warm-up. */
type CompileGuardMode = 'off' | 'report' | 'throw';

/**
 * Creations since the guard was installed. Violations are the armed,
 * unsuspended, VFX-owned subset. Allowed creates still increment the counters.
 */
interface CompileGuardSnapshot {
    readonly mode: CompileGuardMode;
    readonly armed: boolean;
    readonly programsCreated: number;
    readonly renderPipelinesCreated: number;
    readonly computePipelinesCreated: number;
    readonly vfxViolations: number;
    readonly lastViolation: string | null;
}

/**
 * Starts a clock that invokes `onTick` with the seconds elapsed since the
 * previous tick. Injected so a test can drive simulation by hand.
 */
type SimulationClockFactory = (onTick: (deltaSeconds: number) => void) => SimulationClock;

/**
 * Tick source for the simulation half of a frame.
 *
 * `stop()` is idempotent and releases whatever the clock holds.
 */
interface SimulationClock {
    stop(): void;
}
