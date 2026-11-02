// Import from "wanaka-studio-engine/game".

import { type ProjectVisualPostSettings, type ProjectVisualShadingSettings, type ProjectVisualShadowMode } from "@wanaka/render-contracts";
import * as THREE from "three/webgpu";
import type { RenderSession } from "wanaka-studio-engine/render-session";
import { type ProjectShadowMapMode } from "@wanaka/render-contracts";
import type { LifetimeScope } from "wanaka-studio-engine";
import type { RuntimeSession } from "wanaka-studio-engine";
import type { PlatformBridge } from "wanaka-studio-engine/platform-bridge";
import type { WorldAtmosphereResolver, WorldEnvironmentInput } from "wanaka-studio-engine/world-environment";
import type { SceneCatalog, SceneContextForCatalog, SceneId } from "wanaka-studio-engine/scene";
import type { RenderPipelineFactory } from "wanaka-studio-engine/render-session";
import type { PhysicsWorld } from "wanaka-studio-engine/physics";
import type { WebGPURenderer } from "three/webgpu";
import type { ProjectRenderSettings } from "@wanaka/render-contracts";

/**
 * Rendering hooks owned by the project's `rendering.ts`. Edit hosts admit the
 * standard Visual Profile presentation only; project settings and custom
 * pipelines stay out of the authoring view so failures remain recoverable.
 * Play and Preview consume the complete project presentation.
 */
export interface GameRendering {
    readonly configureProjectRenderer: (renderer: WebGPURenderer) => void;
    readonly projectRenderSettings?: ProjectRenderSettings;
    readonly createProjectRenderPipeline?: RenderPipelineFactory;
    readonly applyProjectRenderSettings: (rendering: RenderSession, settings: unknown) => void;
    readonly applyProjectVisualPost?: ApplyProjectVisualPost;
}

/** Labs that do not author Inspector rendering can pass this through `defineGame`. */
export const DEFAULT_GAME_RENDERING: GameRendering;

/** A map of payload-only dispatchers, as `room.actions(...)` and
 * `collection.intents(...)` return them — the call surface a simulate
 * module's handles carry to play. Structural on purpose: this module is in
 * every Play entry's compile closure and must not import
 * `@wanaka/multiplayer-runtime` (see `play-host-room.ts`'s own doc); the
 * package's concrete dispatcher types satisfy this shape. */
export type SimActionDispatchers = Record<string, (payload: never) => void>;

/**
 * What a simulate module's `declareRoom` hands back after declaring its
 * room: the declared `room.state` tree and the payload-only dispatchers its
 * declarations returned. The boot chain passes these to play's
 * `activateGame` third parameter unwrapped; play types them through the
 * narrowed client projection (`SimClientHandles` in
 * `@wanaka/multiplayer-runtime`), which maps `state` to its read-only view
 * and passes every dispatcher member through unchanged — including any
 * `collection.intents(...)` dispatcher record returned as an extra member.
 */
export interface SimHandles<TState extends object = object, TActions extends SimActionDispatchers = SimActionDispatchers> {
    readonly state: TState;
    readonly actions: TActions;
}

/**
 * The scene facts a simulation module may rely on.
 *
 * Deliberately NOT the full `SceneContext`. A room's simulation runs on every
 * peer, and one of them is a headless authority process that never draws:
 * there `rendering`, `viewport` and `htmlUi` throw on access and `stack`
 * rejects navigation, while `managed` carries an EMPTY scene with no authored
 * nodes at all.
 *
 * That last one is why this is a type rather than a comment. The throwing
 * surfaces announce themselves the moment they are touched; `managed.nodes`
 * instead reads back `undefined` and fails a line later, inside code that
 * looked correct because a browser-hosted room really did have the nodes.
 * Dropping it here moves that class of failure to the compiler.
 *
 * `services` is absent for the same reason, one step further out: an
 * authority computes state and draws nothing, so it has no asset origin to
 * fetch from — a model URL that resolves against the page in a browser
 * resolves against nothing in a Node process. A simulate module therefore
 * declares the geometry it needs as data (a collider's own vertices) instead
 * of loading a model to derive it.
 *
 * Both boot paths hand this exact shape, so a simulate module can never do
 * more in a browser than it can on the authority.
 */
export interface SimulateSceneContext<TCatalog extends SceneCatalog = SceneCatalog> {
    /** The scene id this room opened in. */
    readonly id: SceneId<TCatalog>;
    /** Ownership scope for everything the simulation creates. */
    readonly scope: LifetimeScope;
    /** The session whose scheduler drives the simulation's fixed steps. */
    readonly session: RuntimeSession;
}

/**
 * Builds the context a simulate module receives, from the facts a host can
 * state headlessly.
 *
 * The one place the narrowing happens, so the browser host and the authority
 * host cannot drift into handing different shapes — pass a browser's full
 * `SceneContext` or the authority's three assembled facts and the result is
 * the same either way.
 *
 * @param context the scene id, scope and session this host owns.
 * @returns those facts, with every surface an authority cannot answer refused.
 */
export function toSimulateSceneContext<TCatalog extends SceneCatalog>(context: SimulateSceneContext<TCatalog>): SimulateSceneContext<TCatalog>;

/**
 * Simulation module of a `defineGame({ simulate })` game: room declarations,
 * rules, and the physics world — everything the room's authority must be
 * able to run without input, camera, or HUD. Loaded by BOTH the authority
 * and every client, before the play module: declarations must be identical
 * on every peer, and only the authority additionally runs the declared
 * rules.
 */
export interface SimulateModule<TCatalog extends SceneCatalog = SceneCatalog> {
    /** Creates the scope-owned physics world used by multiplayer room
     * entities. Owned here for a simulate game; `PlayModule.createPhysicsWorld`
     * remains as the compatibility slot for games without a simulate module —
     * that slot keeps the full context, since a game with no simulate module
     * has no headless peer to satisfy. */
    readonly createPhysicsWorld?: (context: SimulateSceneContext<TCatalog>) => Promise<PhysicsWorld>;
    /** Declares the room — state, entities, actions, rules — against the
     * formed room platform, and returns the handles play will receive. Runs
     * once per formed room, before room-bound play initialization. Authored modules
     * narrow `platform` to `RoomPlatformBridge` (method bivariance), exactly
     * as `activateGame` implementations already do. */
    declareRoom(context: SimulateSceneContext<TCatalog>, platform: PlatformBridge): SimHandles | Promise<SimHandles>;
}

/** Play module loaded only into the Play graph. */
export interface PlayModule<TCatalog extends SceneCatalog = SceneCatalog> {
    /** `sim` is present exactly when the game declares a simulate module: the
     * handles its `declareRoom` returned, which play types through the
     * narrowed `SimClientHandles` projection.
     * Before room formation: called with platform only (roomSession create UI
     * when available; explicit browser Solo exposes local session facts only).
     * After Membership, when `activateWaiting` is absent, called again with
     * room + sim (back-compat). Prefer `activateWaiting` / `activatePlaying`. */
    activateGame(context: SceneContextForCatalog<TCatalog>, platform?: PlatformBridge, sim?: SimHandles): void | Promise<void>;
    /** Membership-formed waiting phase (`waiting` ∪ `starting`). Runs once for
     * every formed Room, including a replacement Membership in the same game
     * document. Optional; falls back to `activateGame(..., sim)`. */
    readonly activateWaiting?: (context: SceneContextForCatalog<TCatalog>, platform: PlatformBridge, sim?: SimHandles) => void | Promise<void>;
    /** Match play — runs after room initialization when control lifecycle is
     * `playing`, or immediately after initialization in explicit browser Solo. */
    readonly activatePlaying?: (context: SceneContextForCatalog<TCatalog>, platform: PlatformBridge, sim?: SimHandles) => void | Promise<void>;
    /** Creates the scope-owned physics world used by multiplayer room
     * entities. Compatibility slot: when the game also declares a simulate
     * module, that module's own `createPhysicsWorld` is used instead. */
    readonly createPhysicsWorld?: (context: SceneContextForCatalog<TCatalog>) => Promise<PhysicsWorld>;
}

/** Editor module loaded only into the Edit graph. */
export interface EditorModule<TCatalog extends SceneCatalog = SceneCatalog> {
    readonly activateEditor: (context: SceneContextForCatalog<TCatalog>) => void | Promise<void>;
}

/** Cloud persistence mode selected in the project's static game definition. */
export type PersistenceMode = 'none' | 'room' | 'player';

/** Authority module for one room-wide opaque snapshot. */
export interface RoomPersistenceAuthorityModule {
    readonly mode: 'room';
    readonly restore: (snapshot: Uint8Array | null) => void | Promise<void>;
    readonly capture: () => Uint8Array | Promise<Uint8Array>;
}

/** Authority module for one opaque snapshot per authenticated Player. */
export interface PlayerPersistenceAuthorityModule {
    readonly mode: 'player';
    readonly restore: (playerId: string, snapshot: Uint8Array | null) => void | Promise<void>;
    readonly capture: (playerId: string) => Uint8Array | Promise<Uint8Array>;
}

/** Persistence module loaded only by the server Authority. */
export type AuthorityPersistenceModule = RoomPersistenceAuthorityModule | PlayerPersistenceAuthorityModule;

/** Static cloud persistence declaration authored in `defineGame`. */
export type GamePersistenceDeclaration = {
    readonly mode: 'none';
} | {
    readonly mode: 'room';
    readonly authority: () => Promise<RoomPersistenceAuthorityModule>;
} | {
    readonly mode: 'player';
    readonly authority: () => Promise<PlayerPersistenceAuthorityModule>;
};

export type GameDisplaySize = {
    readonly width: number;
    readonly height: number;
};

/** Responsive canvas, or a fixed presentation size authored in `defineGame`. */
export type GameDisplay = 'responsive' | GameDisplaySize;

/** Resolves `defineGame.display` against the host canvas. */
export function resolveGamePresentationSize(display: GameDisplay | undefined, canvas: Pick<HTMLCanvasElement, 'clientWidth' | 'clientHeight'>): GameDisplaySize;

export interface GameDefinition<TCatalog extends SceneCatalog = SceneCatalog> {
    readonly scenes: TCatalog;
    readonly visualProfile?: ProjectVisualProfile;
    readonly rendering: GameRendering;
    readonly play: () => Promise<PlayModule<TCatalog>>;
    /** Optional simulation module — see `SimulateModule`. When present, the
     * multiplayer boot chain loads it before play, uses its
     * `createPhysicsWorld`, and completes its `declareRoom` before play's
     * `activateGame` runs. Games without it behave exactly as before. */
    readonly simulate?: () => Promise<SimulateModule<TCatalog>>;
    readonly editor?: () => Promise<EditorModule<TCatalog>>;
    /** Omitted means `none`. Persistent modes load their handlers on the server Authority. */
    readonly persistence?: GamePersistenceDeclaration;
    readonly quality?: RenderQualitySelection | RenderQualityCustomSettings;
    /** Opt-in device limits, checked before renderer initialization in Edit and Play. */
    readonly gpuRequirements?: GameGpuRequirements;
    readonly display?: GameDisplay;
    readonly minFps?: number;
    readonly maxFps?: number;
    /** Visual Profile rain and snow particle cap; `worldEnvironment` has its own. */
    readonly weatherParticleBudget?: number;
    /**
     * Season, time, and weather shared by every scene as `context.worldEnvironment`.
     * When set, the host draws sky, fog, sun and fill light, and rain or snow in
     * place of the Visual Profile's.
     */
    readonly worldEnvironment?: {
        readonly initial?: WorldEnvironmentInput;
        readonly resolve?: WorldAtmosphereResolver;
        readonly fog?: boolean;
        readonly weatherParticleBudget?: number;
        readonly windDirectionDegrees?: number;
    };
    readonly multiplayer?: {
        readonly minPlayers: number;
        readonly maxPlayers: number;
        /**
         * Opt-in to server authority: the room's authoritative simulation runs as
         * a non-player peer beside the relay instead of in the host's browser.
         * Absent means host authority. This declaration is the single opt-in
         * source — it flows through export into the relay credential unchanged.
         */
        readonly authority?: 'server';
    };
    /**
     * Engine behavior level this project was written against, as a literal
     * `YYYY-MM` so it stays pinned across recompiles. Omitted means the oldest
     * level, so an existing project keeps its behavior when the Engine moves on.
     */
    readonly compat?: GameCompat;
}

/** Identity helper so a project composition root stays typed. */
export function defineGame<TCatalog extends SceneCatalog>(game: GameDefinition<TCatalog>): GameDefinition<TCatalog>;

export type ProjectVisualProfile = AuthoringVisualProfile;

export type ApplyProjectVisualPost = (rendering: RenderSession, post: ProjectVisualProfile['post'], shadowMode: ProjectVisualProfile['lighting']['shadowMode'], targetScene?: THREE.Scene | null, shading?: ProjectVisualProfile['shading'], palette?: ProjectVisualProfile['palette']) => void;

/** Complete schema-v1 profile transported only inside the Edit World. */
interface AuthoringVisualProfile {
    readonly sky?: 'solid' | 'gradient';
    readonly schemaVersion: 1;
    readonly presetId: AuthoringVisualProfilePresetId;
    readonly palette: {
        readonly sky: string;
        readonly ground: string;
        readonly road: string;
        readonly accent: string;
    };
    readonly lighting: {
        readonly key: {
            readonly color: string;
            readonly intensity: number;
            readonly azimuth: number;
            readonly elevation: number;
        };
        readonly fill: {
            readonly color: string;
            readonly intensity: number;
        };
        readonly rim: {
            readonly color: string;
            readonly intensity: number;
        };
        readonly shadowMode: AuthoringVisualShadowMode;
    };
    readonly atmosphere: {
        readonly fog: {
            readonly enabled: boolean;
            readonly color: string;
            readonly near: number;
            readonly far: number;
        };
        readonly weather: {
            readonly kind: AuthoringVisualWeatherKind;
            readonly amount: number;
            readonly wind: number;
        };
    };
    readonly environment: {
        readonly kind: AuthoringVisualEnvironmentKind;
        readonly assetId: string | null;
        readonly intensity: number;
        readonly rotation: number;
    };
    readonly post: ProjectVisualPostSettings;
    readonly materialTheme: {
        readonly tintableRoles: readonly AuthoringVisualMaterialRole[];
    };
    readonly shading: ProjectVisualShadingSettings;
}

type AuthoringVisualProfilePresetId = (typeof AUTHORING_VISUAL_PROFILE_PRESET_IDS)[number];

type AuthoringVisualWeatherKind = 'clear' | 'rain' | 'snow';

type AuthoringVisualEnvironmentKind = 'color' | 'exr';

type AuthoringVisualShadowMode = ProjectVisualShadowMode;

type AuthoringVisualMaterialRole = 'road' | 'ground' | 'accent';

declare const AUTHORING_VISUAL_PROFILE_PRESET_IDS: readonly [
    'neutral',
    'realistic',
    'stylized-toon',
    'graphic-ink',
    'ink-wash',
    'pixel-screen',
    'crosshatch',
    'one-bit',
    'phosphor',
    'retro-warm',
    'horror',
    'custom'
];

export type EngineCompatLevel = (typeof ENGINE_COMPAT_LEVELS)[number];

export type EngineBehaviorKey = keyof typeof ENGINE_BEHAVIORS;

/** Per-project compatibility declaration carried by `defineGame({ compat })`. */
export interface GameCompat {
    /** Behavior level this project was written against. */
    readonly level: EngineCompatLevel;
    /** Per-behavior opt-in or opt-out on top of `level`. */
    readonly overrides?: Partial<Readonly<Record<EngineBehaviorKey, boolean>>>;
}

/**
 * Engine behavior compatibility levels, oldest first. A level is the month in
 * which a behavior change shipped; a project pinned to a level gets every
 * behavior introduced at or before it and none introduced after it.
 */
declare const ENGINE_COMPAT_LEVELS: readonly [
    '2026-08',
    '2026-09',
    '2026-10',
    '2026-11'
];

/**
 * Every behavior change that is gated by a compat level. `since` is the first
 * level in which the new behavior is on. A removed key keeps a `removed`
 * entry in `registry.json` naming what a project that overrode it does instead.
 */
declare const ENGINE_BEHAVIORS: {
    readonly directionalLightCsm: {
        readonly since: '2026-09';
    };
    readonly characterVsCharacterCollision: {
        readonly since: '2026-09';
    };
    readonly raySkipsUnmanagedBodies: {
        readonly since: '2026-10';
    };
    readonly motionCommandDebt: {
        readonly since: '2026-11';
    };
};

/** Minimum device resources required by every scene in this game. */
export interface GameGpuRequirements {
    readonly requiredLimits: Readonly<Partial<Record<keyof GPUSupportedLimits, number>>>;
}

/** User-selected automatic or fixed rendering tier. */
type RenderQualitySelection = 'auto' | RenderQualityTier;

/**
 * Agent-authored quality overrides. Omitted leaves inherit from `baseTier`;
 * the runtime validates every override before constructing a presentation.
 */
interface RenderQualityCustomSettings {
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

type RenderQualityTier = (typeof RENDER_QUALITY_TIERS)[number] | (typeof RENDER_MOBILE_QUALITY_PRESETS)[number];

/** Three-native anti-aliasing path fixed to one quality tier. */
type RenderQualityAntialiasing = 'fxaa' | 'smaa' | 'msaa4-fxaa' | 'traa' | 'taau' | 'ssaa';

/** Ordered production presets available to the automatic runtime controller. */
declare const RENDER_QUALITY_TIERS: readonly [
    'low',
    'medium',
    'high',
    'ultra',
    'cinematic'
];

declare const RENDER_MOBILE_QUALITY_PRESETS: readonly [
    'mobile',
    'mobile+',
    'mobile++',
    'mobile+++'
];
