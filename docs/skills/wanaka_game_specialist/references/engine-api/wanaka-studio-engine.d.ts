// Import from "wanaka-studio-engine".

import type { Object3D } from "three/webgpu";
import type { Light, Material, Scene } from "three/webgpu";

/** A value with an explicit teardown operation. */
export interface Disposable {
    dispose(): void | Promise<void>;
}

export type ScopeCleanup = () => unknown;

/** Error retaining every failure from one atomic lifecycle operation. */
export class LifetimeScopeError extends Error {
    readonly errors: readonly unknown[];
    constructor(message: string, errors: readonly unknown[]);
}

/**
 * Owns cancellation and deterministic teardown for one runtime instance.
 * Child scopes are disposed before cleanup registered earlier by the parent.
 */
export class LifetimeScope implements Disposable {
    readonly label: string;
    readonly signal: AbortSignal;
    constructor(label: string, detachFromParent?: ScopeCleanup);
    /** True after teardown has begun. */
    get isDisposed(): boolean;
    /** Number of registered teardowns that have not started. */
    get cleanupCount(): number;
    /** Registers teardown and returns it for convenient composition. */
    defer<T extends ScopeCleanup>(cleanup: T): T;
    /** Owns a disposable value until this scope ends. */
    own<T extends Disposable>(value: T): T;
    /** Creates a nested ownership boundary tied to this scope. */
    child(label: string): LifetimeScope;
    /** Cancels pending work and runs teardown once in reverse registration order. */
    dispose(): void;
    /** Starts teardown immediately and settles after every asynchronous cleanup. */
    disposeAsync(): Promise<void>;
}

/** Rolls back a failed scope without losing a teardown failure. */
export function rollbackScope(scope: LifetimeScope, error: unknown, message: string): never;

/**
 * Fixed-step sub-phases, executed in this order inside every fixed step.
 * Engine APIs contract to them: input snapshots are consumed in
 * `fixedInput`, gameplay fixed logic runs in `fixedUpdate`, kinematic poses
 * are pushed in `prePhysics`, the physics backend steps in `physics`, and
 * simulation-owned poses are published in `postPhysics`.
 */
export const FIXED_PHASES: readonly [
    'fixedInput',
    'fixedUpdate',
    'prePhysics',
    'physics',
    'postPhysics'
];

export type FixedPhase = (typeof FIXED_PHASES)[number];

/** Stable runtime phases. Hooks execute in registration order. */
export type RuntimePhase = 'frameBegin' | FixedPhase | 'update' | 'lateUpdate' | 'preRender';

/** Frame data passed directly to phase callbacks. */
export interface FrameStep {
    readonly deltaSeconds: number;
    /** For `frameBegin`/`update`/`lateUpdate`: the wall-clock delta as handed to
     * `step()`, before `timeScale` was applied. For `preRender`: the same, for
     * the delta handed to `render()` — a drawn frame's interval, which is paced
     * independently of the simulation clock. For a fixed-step
     * phase (`fixedInput`/`fixedUpdate`/`prePhysics`/`physics`/`postPhysics`):
     * `fixedDeltaSeconds`, same as `deltaSeconds` there — a fixed step's own
     * size never scales (only how MANY of them run does, via the accumulator),
     * so the two fields agree in that phase. A driver that must keep its own
     * pace regardless of the scene's time scale (e.g. a shared multiplayer
     * room's tick, which must not stall every remote peer just because this
     * peer paused) reads this instead of `deltaSeconds`. */
    readonly rawDeltaSeconds: number;
    readonly elapsedSeconds: number;
    readonly alpha: number;
}

export type PhaseHook = (step: FrameStep) => void;

/** Minimal deterministic phase loop shared by interactive runtime profiles. */
export class PhaseScheduler {
    readonly fixedDeltaSeconds: number;
    readonly maxFixedStepsPerFrame: number;
    /** Simulated fixed-step time accumulated by this scheduler. */
    get elapsed(): number;
    /** Multiplier applied to wall-clock frame deltas. 0 freezes simulation. */
    get timeScale(): number;
    /** Sets the simulation time scale. Must be a finite non-negative number. */
    setTimeScale(scale: number): void;
    constructor(fixedDeltaSeconds?: number, maxFixedStepsPerFrame?: number);
    /** Registers a callback and returns its unregister function. */
    on(phase: RuntimePhase, hook: PhaseHook): () => void;
    /**
     * Advances fixed simulation, variable update, then late update.
     *
     * Simulation and presentation are driven separately: this half is paced by
     * the simulation clock and must keep running while the page is not being
     * painted, so a multiplayer authority in a background tab keeps serving its
     * peers. `preRender` belongs to {@link render} instead.
     *
     * @param presentationTimeSeconds Optional monotonic host timestamp used to
     * align a later render alpha with time that elapsed after this step.
     */
    step(deltaSeconds: number, presentationTimeSeconds?: number): void;
    /**
     * Runs `preRender` against the fixed-step remainder plus elapsed host time
     * since the latest timestamped {@link step}, so presentation interpolates
     * towards the next simulated state at the moment the frame is drawn.
     * Advances no simulated time, and may run any number of times — including
     * none — between two {@link step} calls. Without a timestamp, alpha uses
     * only the accumulator remainder.
     *
     * @param presentationTimeSeconds Optional monotonic host timestamp paired
     * with the latest `step()` timestamp.
     */
    render(deltaSeconds: number, presentationTimeSeconds?: number): void;
    /** Clears all callbacks when the owning RuntimeSession stops. */
    dispose(): void;
}

/** One-shot timer owned by a LifetimeScope and driven by scheduler `update` deltas. */
export class ScopeTimer {
    private constructor();
    /** Fires `callback` once after `delaySeconds` of simulated update time. */
    static after(scope: LifetimeScope, scheduler: PhaseScheduler, delaySeconds: number, callback: () => void): void;
}

export type DiagnosticSeverity = 'info' | 'warning' | 'error';

/**
 * One repairable feedback entry emitted by the kernel or an Engine API.
 * `code` is a stable machine-readable identifier (`<subsystem>.<problem>`);
 * `hint` states how to fix the problem, not just what happened.
 */
export interface RuntimeDiagnostic {
    readonly code: string;
    readonly severity: DiagnosticSeverity;
    readonly message: string;
    readonly hint?: string;
    readonly source?: string;
}

export type DiagnosticListener = (diagnostic: RuntimeDiagnostic) => void;

/**
 * Kernel port collecting structured diagnostics for the IDE, agents, logs,
 * and tests. Keeps a bounded in-memory buffer so late subscribers (e.g. a
 * debug overlay attached after Play starts) can read recent history.
 */
export class DiagnosticsPort {
    constructor(bufferLimit?: number);
    /** Publishes one diagnostic to the buffer and every listener. */
    report(diagnostic: RuntimeDiagnostic): void;
    /** Subscribes to future diagnostics and returns the unsubscribe function. */
    onReport(listener: DiagnosticListener): () => void;
    /** Buffered diagnostics, oldest first. */
    entries(): readonly RuntimeDiagnostic[];
    /**
     * Replays the buffer then forwards live reports until `scope` tears down.
     * Edit and Play hosts share this so Studio sees one diagnostic stream.
     */
    bindHost(listener: DiagnosticListener, scope: {
        defer(cleanup: () => void): unknown;
    }): void;
    /** Reports owned teardowns that have not run yet. */
    reportPendingCleanups(scope: {
        readonly isDisposed: boolean;
        readonly cleanupCount: number;
        readonly label: string;
    }): void;
}

/**
 * Lazy identity sidecar: NetworkId and SaveKey stay separate namespaces. The
 * native host object is the local runtime identity, AuthoringId remains source
 * metadata, and pure visual Object3D hosts do not need a record.
 */
export interface IdentityRecord {
    readonly networkId?: string;
    readonly saveKey?: string;
}

export interface IdentityBinding {
    readonly networkId?: string;
    readonly saveKey?: string;
}

/** Binds stable network/save namespaces onto a native host object. */
export class IdentityRegistry {
    /** Binds identities until the supplied lifetime scope is disposed. */
    bindScoped(scope: LifetimeScope, host: object, ids: IdentityBinding): IdentityRecord;
    /** Returns the bound record when the host has one. */
    get(host: object): IdentityRecord | undefined;
    /** Releases this RuntimeSession-local identity namespace. */
    dispose(): void;
}

/** A factory whose side effects are owned by the supplied scope. */
export type ScopedFactory<T> = (scope: LifetimeScope) => T | Promise<T>;

/** A committed factory result and its single lifetime owner. */
export interface ScopedInstance<T> {
    readonly value: T;
    readonly scope: LifetimeScope;
    destroy(): void;
}

/**
 * Executes a factory atomically. A throw or abort rolls back everything the
 * factory registered before the error.
 */
export function instantiateScoped<T>(owner: LifetimeScope, label: string, factory: ScopedFactory<T>): Promise<ScopedInstance<T>>;

/** Binds a native Three object without assigning its resource ownership. */
export function bindObject3D<TChild extends Object3D>(scope: LifetimeScope, parent: Object3D, child: TChild): TChild;

/** Public scene-source name for bindObject3D. */
export { bindObject3D as attachObject3D };

/** Stable native objects exposed by one managed scene module. */
export type ManagedSceneNodes = Readonly<Record<string, Object3D>>;

/** Scene-owned resources and presentation factories exposed to activation. */
export type ManagedSceneResources = Readonly<Record<string, unknown>>;

/** Game result of a managed scene module. */
export interface ManagedScene<TNodes extends ManagedSceneNodes = ManagedSceneNodes> {
    readonly scene: Scene;
    readonly nodes: TNodes;
    readonly resources?: ManagedSceneResources;
    readonly visual?: ManagedSceneVisualBindings;
}

/** Widened managed-scene shape for contracts that accept any managed node map. */
export type AnyManagedScene = ManagedScene<ManagedSceneNodes>;

/** Managed source entry used by Edit, Play, Preview, and Export composition. */
export type ManagedSceneFactory<TScene extends AnyManagedScene = AnyManagedScene> = ScopedFactory<TScene>;

/** Runtime execution profile; hosting concerns stay outside the kernel. */
export type RuntimeExecutionProfile = 'edit' | 'play' | 'headless';

/** One isolated execution of a managed Three scene. */
export class RuntimeSession {
    readonly profile: RuntimeExecutionProfile;
    readonly scope: LifetimeScope;
    readonly scheduler: PhaseScheduler;
    readonly diagnostics: DiagnosticsPort;
    /** Behavior switches resolved from the game's `compat` declaration. */
    readonly behaviors: ResolvedEngineBehaviors;
    constructor(profile: RuntimeExecutionProfile, label?: string, compat?: GameCompat);
    /** Current native scene, if a managed scene is loaded. */
    get scene(): Scene | undefined;
    /** Lazily creates the one gameplay identity registry shared by sidecars. */
    get identity(): IdentityRegistry;
    /** Builds the managed scene once and atomically commits it to this session. */
    load<TScene extends AnyManagedScene>(factory: ManagedSceneFactory<TScene>): Promise<TScene>;
    /** Disposes every stacked scene and loads `factory` as the sole scene. */
    replace<TScene extends AnyManagedScene>(factory: ManagedSceneFactory<TScene>): Promise<TScene>;
    /** Pushes a new scoped scene. The previous scene stays owned until pop. */
    push<TScene extends AnyManagedScene>(factory: ManagedSceneFactory<TScene>): Promise<TScene>;
    /** Disposes the top scene and restores the previous one. */
    pop(): AnyManagedScene;
    /** Advances this session's simulation through the shared phase order. */
    step(deltaSeconds: number, presentationTimeSeconds?: number): void;
    /**
     * Draws one frame from the simulation state this session currently holds.
     * Runs while paused too, so a paused scene keeps repainting — pausing
     * suspends simulated time, not the picture of it. The optional timestamp
     * keeps render alpha aligned with the separate simulation clock.
     */
    render(deltaSeconds: number, presentationTimeSeconds?: number): void;
    /**
     * Advances one frame even while paused. Play Step uses this so paused
     * chrome still drives the scheduler without copying leftover runtime state.
     */
    stepOnce(deltaSeconds: number): void;
    /** Suspends phase advancement without changing the native scene or source. */
    pause(): void;
    /** Continues phase advancement after a pause. */
    resume(): void;
    /** True while phase advancement is suspended. */
    get isPaused(): boolean;
    /** Simulation time scale owned by this session's scheduler. */
    get timeScale(): number;
    /** Sets simulation time scale without pausing host chrome. */
    setTimeScale(scale: number): void;
    /** Stops this execution without mutating any other session or source file. */
    dispose(): void;
    /** Stops immediately and settles after every asynchronous owned teardown. */
    disposeAsync(): Promise<void>;
}

/** Optional Visual Profile targets exposed by a managed scene factory. */
interface ManagedSceneVisualBindings {
    readonly lights?: {
        readonly key?: Light;
        readonly fill?: Light;
        readonly rim?: Light;
    };
    readonly materials?: {
        readonly road?: readonly Material[];
        readonly ground?: readonly Material[];
        readonly accent?: readonly Material[];
    };
}

/** Per-project compatibility declaration carried by `defineGame({ compat })`. */
interface GameCompat {
    /** Behavior level this project was written against. */
    readonly level: EngineCompatLevel;
    /** Per-behavior opt-in or opt-out on top of `level`. */
    readonly overrides?: Partial<Readonly<Record<EngineBehaviorKey, boolean>>>;
}

/** Behavior switches resolved for one runtime session. */
type ResolvedEngineBehaviors = Readonly<Record<EngineBehaviorKey, boolean>>;

type EngineCompatLevel = (typeof ENGINE_COMPAT_LEVELS)[number];

type EngineBehaviorKey = keyof typeof ENGINE_BEHAVIORS;

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

/** Returns the primary URL, or the URL for an exact file kind from an asset result. */
export function assetId2Url(assetId: string, identifier?: string): string;

export { VISUAL_COLOR_ENVIRONMENT_INTENSITY_SCALE, visualEnvironmentIntensity } from "@wanaka/render-contracts";
