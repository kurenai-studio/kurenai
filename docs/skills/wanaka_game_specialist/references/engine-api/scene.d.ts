// Import from "wanaka-studio-engine/scene".

import type { PhaseScheduler } from "wanaka-studio-engine";
import type { LifetimeScope } from "wanaka-studio-engine";
import type { AnyManagedScene, RuntimeExecutionProfile } from "wanaka-studio-engine";
import type { WebGPURenderer } from "three/webgpu";
import type { Model3DLoader } from "wanaka-studio-engine/assets";
import { type RuntimeSession } from "wanaka-studio-engine";
import type { Camera } from "three/webgpu";
import type { WorldEnvironmentStateMachine } from "wanaka-studio-engine/world-environment";
import { type RenderSession, type RenderView } from "wanaka-studio-engine/render-session";

/**
 * Session-owned services shared by every scene, Play activation, and Prefab
 * factory. `SceneHost` fills `model3DLoader`, `profile`, and `scheduler`.
 * Prefab calls MAY spread scene-local `assets` / `physics` onto the same object.
 */
export interface SceneServices {
    readonly model3DLoader: Model3DLoader;
    readonly profile: RuntimeExecutionProfile;
    readonly scheduler: PhaseScheduler;
}

/** Scene-module factory with host-owned renderer and session services. */
export type SceneFactory<TScene extends AnyManagedScene = AnyManagedScene> = (scope: LifetimeScope, renderer: WebGPURenderer, services: SceneServices) => TScene | Promise<TScene>;

/** Ordinary ESM scene module loaded from a project's scene catalog. */
export interface SceneModule<TScene extends AnyManagedScene = AnyManagedScene> {
    readonly createScene: SceneFactory<TScene>;
}

/** Static project loader for one native scene module. */
export type SceneLoader<TScene extends AnyManagedScene = AnyManagedScene> = () => Promise<SceneModule<TScene>>;

/** Project-owned mapping from stable SceneId to ordinary ESM loaders. */
export type SceneCatalog = Readonly<Record<string, SceneLoader>>;

/** Exact SceneId union declared by one project scene catalog. */
export type SceneId<TCatalog extends SceneCatalog> = Extract<keyof TCatalog, string>;

/** Exact managed-scene result returned by one catalog loader. */
export type ManagedSceneFromLoader<TLoader extends SceneLoader> = Awaited<ReturnType<Awaited<ReturnType<TLoader>>['createScene']>>;

/** Returns the catalog's SceneIds in authored property order. */
export function listSceneIds<TCatalog extends SceneCatalog>(catalog: TCatalog): readonly SceneId<TCatalog>[];

/** Host-owned presentation surfaces for one active scene. */
export interface SceneViewport {
    /** Input capture and Pointer Lock target: the game presentation surface. */
    readonly surface: HTMLElement;
    /** Container for DOM overlays such as a `hudElement` HUD. */
    readonly overlayContainer: HTMLElement;
}

/** Navigation surface exposed to project activation modules. */
export interface SceneStack {
    readonly current: {
        readonly id: string;
    } | undefined;
    readonly depth: number;
    preload(id: string): Promise<void>;
    open(id: string): Promise<unknown>;
    push(id: string): Promise<unknown>;
    pop(): Promise<unknown>;
}

/** Context prepared inside the new scene's ownership scope before commit. */
export interface SceneContext<TId extends string = string, TScene extends AnyManagedScene = AnyManagedScene> {
    readonly id: TId;
    readonly scope: LifetimeScope;
    readonly session: RuntimeSession;
    readonly managed: TScene;
    readonly services: SceneServices;
    readonly viewport: SceneViewport;
    /** RenderSession used by the active scene; project code may configure its native renderer. */
    readonly rendering: RenderSession;
    readonly stack: SceneStack;
    /** Season, time, and weather from `defineGame({ worldEnvironment })`; undefined when omitted. */
    readonly worldEnvironment?: WorldEnvironmentStateMachine;
}

/** Exact context union produced by a project scene catalog. */
export type SceneContextForCatalog<TCatalog extends SceneCatalog, TId extends SceneId<TCatalog> = SceneId<TCatalog>> = {
    readonly [TSceneId in TId]: SceneContext<TSceneId, ManagedSceneFromLoader<TCatalog[TSceneId]>>;
}[TId];

/** Host composition hooks that stay project-owned rather than scene metadata. */
export interface SceneHostOptions<TCatalog extends SceneCatalog = SceneCatalog> {
    /** Project-owned loader; SceneHost adds session profile and scheduler. */
    readonly services: Pick<SceneServices, 'model3DLoader'>;
    /**
     * Applies project-owned scene decoration before Studio fallback lookdev.
     * Any resources created here must be registered with `context.scope`.
     */
    readonly prepare?: (context: SceneContextForCatalog<TCatalog>) => void | Promise<void>;
    readonly createView: (context: SceneContextForCatalog<TCatalog>) => RenderView;
    readonly activate?: (context: SceneContextForCatalog<TCatalog>) => void | Promise<void>;
}

/** Currently committed native scene and its rendering view. */
export interface ActiveScene<TId extends string = string, TScene extends AnyManagedScene = AnyManagedScene> {
    readonly id: TId;
    readonly managed: TScene;
    readonly camera: Camera;
}

/**
 * Loads and swaps complete native scene presentations while RuntimeSession
 * continues to own their child scopes.
 */
export class SceneHost<TCatalog extends SceneCatalog = SceneCatalog> {
    constructor(session: RuntimeSession, rendering: RenderSession, catalog: TCatalog, options: SceneHostOptions<TCatalog>);
    /** SceneIds available from the project-owned catalog. */
    get sceneIds(): readonly SceneId<TCatalog>[];
    /** Current committed scene, or undefined before the first open. */
    get current(): ActiveSceneForCatalog<TCatalog> | undefined;
    /** Context for the committed scene, available to session-level hosts after open(). */
    get currentContext(): SceneContextForCatalog<TCatalog> | undefined;
    /** Number of committed scenes in the active navigation stack. */
    get depth(): number;
    /** Loads and validates a catalog module without constructing its scene. */
    preload<TId extends SceneId<TCatalog>>(id: TId): Promise<void>;
    /**
     * Prepares a catalog scene in a new scope and commits it as the sole view.
     * Loader, construction, view, or activation failure leaves the old scene.
     * The first successful open warms textures and shaders after activation.
     */
    open<TId extends SceneId<TCatalog>>(id: TId): Promise<ActiveScene<TId, ManagedSceneFromLoader<TCatalog[TId]>>>;
    /** Pushes a catalog scene while retaining the current scene for pop(). */
    push<TId extends SceneId<TCatalog>>(id: TId): Promise<ActiveScene<TId, ManagedSceneFromLoader<TCatalog[TId]>>>;
    /** Disposes the top scene and restores the previous rendered view. */
    pop(): Promise<ActiveSceneForCatalog<TCatalog>>;
}

type ActiveSceneForCatalog<TCatalog extends SceneCatalog> = {
    readonly [TSceneId in SceneId<TCatalog>]: ActiveScene<TSceneId, ManagedSceneFromLoader<TCatalog[TSceneId]>>;
}[SceneId<TCatalog>];
