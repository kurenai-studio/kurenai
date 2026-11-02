// Import from "wanaka-studio-engine/vfx".

import type { Node } from "three/webgpu";
import { type Object3D } from "three/webgpu";
import type { RuntimeDiagnostic } from "wanaka-studio-engine";
import type { Camera } from "three/webgpu";
import type { SceneContext } from "wanaka-studio-engine/scene";

export type { VfxHandle, VfxHandleState, VfxPlayOptions, VfxPrepareOptions, VfxSystem, VfxSystemOptions };

/** Returns the one VFX system owned by this scene context. */
export function useVfx(context: SceneContext, options?: VfxSystemOptions): VfxSystem;

/**
 * A surface can use a built-in look id or provide TSL hooks directly.
 * Hooks are compiled during preparation and are never evaluated on the CPU
 * simulation path.
 */
export interface VfxLayerLook {
    readonly id?: VfxLookId;
    /** External or generated textures sampled by this look's TSL hooks. */
    readonly textures?: Readonly<Record<string, VfxLookTexture>>;
    readonly colorNode?: VfxMaterialHook;
    readonly opacityNode?: VfxMaterialHook;
    /** Multiplies sampled texture coverage without replacing it. */
    readonly opacityMultiplierNode?: VfxMaterialHook;
    /** Scene-color sample. Refraction effects return the bent background here. */
    readonly backdropNode?: VfxMaterialHook;
    /** Mesh vertex replacement. `ctx.positionLocal` is the rest vertex. */
    readonly positionNode?: VfxMaterialHook;
}

/** Built-in look id or an inline look. */
export type VfxLayerLookRef = VfxLookId | VfxLayerLook;

/** Builtin id or a branded id from `registerScopedVfxLook`. */
type VfxLookId = VfxBuiltinLookId | VfxRegisteredLookId;

type VfxBuiltinLookId = (typeof VFX_LOOK_IDS)[number];

/** Branded id returned by `registerScopedVfxLook` / `defineScopedVfxLook`. */
type VfxRegisteredLookId = string & {
    readonly __vfxLook: unique symbol;
};

declare const VFX_LOOK_IDS: readonly [
    'project-mesh',
    'tint-cube',
    'thin-film-shield',
    'hex-shield',
    'heal-volume',
    'dissolve',
    'refract',
    'rim',
    'uv-scroll',
    'flow-map',
    'fresnel',
    'lit'
];

/** Named texture available to a graph-owned material look hook. */
interface VfxLookTexture {
    /** Public effect graphs use immutable asset identities, not direct URLs. */
    readonly texture: VfxManagedTextureSource;
    readonly colorSpace?: VfxTextureColorSpace;
    /** Repeat pans noise. Clamp holds a mask border when the sample leaves 0–1. */
    readonly wrap?: VfxTextureWrap;
}

type VfxTextureColorSpace = 'linear' | 'srgb';

type VfxManagedTextureSource = Exclude<VfxTextureSource, {
    readonly url: string;
}>;

type VfxTextureWrap = 'repeat' | 'clamp';

type VfxTextureSource = {
    readonly assetId: string;
    readonly identifier?: string;
} | {
    readonly url: string;
} | {
    readonly builtin: VfxBuiltinTexture;
} | {
    readonly generated: string;
};

/**
 * Deterministic baked particle textures. No files are fetched: every texel is
 * computed from an integer hash so GPU and CPU reference captures see the same
 * pixels on every platform.
 *
 * - `smoke`   128² FBM density puff with volumetric shading in RGB.
 * - `dust`    128² gaussian mote with a faint speckled halo.
 * - `glow`    128² hot core + wide soft falloff (additive-friendly).
 * - `flame`   128² tongue shaped by FBM; RGB carries a linear white→orange→red ramp.
 * - `sparkle` 256² 4×4 flipbook of a twinkling 4-lobe star (rotation + pulse).
 * - `flare`   128² Kenney Particle Pack silhouette: core + plus-shaped streaks.
 * - `puff`    128² Kenney Particle Pack silhouette: even circular smoke blob.
 * - `star`    128² Kenney Particle Pack silhouette: single-frame 4-point star.
 *
 * `flare` / `puff` / `star` are Kenney-shaped CC0 builtins so product effects
 * can use `{ texture: { builtin } }` without a fetch. Real Kenney sheets are
 * catalog rows (`kind=image`, tag `vfx-texture`) in `VFX_KENNEY_CATALOG`.
 *
 * Row 0 of the data is v = 0 (bottom of the quad), matching `DataTexture`
 * defaults (`flipY = false`).
 */
type VfxBuiltinTexture = 'smoke' | 'dust' | 'glow' | 'flame' | 'sparkle' | 'flare' | 'puff' | 'star';

export type VfxMaterialPreset = (typeof VFX_MATERIAL_PRESETS)[number];

/** Closed set of procedural material masks accepted by Graph sheets and runtime materials. */
declare const VFX_MATERIAL_PRESETS: readonly [
    'solid',
    'circle',
    'softCircle',
    'ring',
    'spark',
    'smokePuff',
    'streak'
];

export type Vec3 = readonly [
    number,
    number,
    number
];

export type Vec4 = readonly [
    number,
    number,
    number,
    number
];

export type VfxParameterValue = number | readonly number[];

/** One bounded semantic control exposed to game code and AI authoring. */
export interface VfxParameterSpec {
    readonly defaultValue: VfxParameterValue;
    readonly minimum?: number;
    readonly maximum?: number;
    readonly targets: readonly string[];
}

export interface VfxParticleContext {
    readonly progress: Node<'float'>;
    readonly lifetime: Node<'float'>;
    /** Seconds since the particle was born. */
    readonly age: Node<'float'>;
    /** Particle centre in its simulation frame. */
    readonly position: Node<'vec3'>;
    /** Particle centre transformed into world space when supplied by the renderer. */
    readonly positionWorld?: Node<'vec3'>;
    readonly velocity: Node<'vec3'>;
    readonly size: Node<'float'>;
    readonly rotation: Node<'float'>;
    readonly color: Node<'vec4'>;
    readonly index: Node<'float'> | Node<'uint'>;
    /** Local mesh/quad UV. Sprite hooks see the raw quad; mesh hooks see geometry UV. */
    readonly uv: Node<'vec2'>;
    /** Cumulative authored distance for path looks. */
    readonly pathDistance?: Node<'float'>;
    /** Mesh-local vertex before the look's own displacement; host layers follow the live pose. */
    readonly positionLocal?: Node<'vec3'>;
    /** Host layers: surface normal at `positionLocal`. */
    readonly normalLocal?: Node<'vec3'>;
    /** Host layers: `positionLocal` across the host bounds, 0 at the minimum and 1 at the maximum per axis. */
    readonly hostUnit?: Node<'vec3'>;
    /** Host layers: unskinned geometry in the frozen host frame, normalized by its rest bounds. Stable through pose changes; snapshot layers use the frozen posed geometry. */
    readonly hostRestUnit?: Node<'vec3'>;
    /** Samples a texture declared by the owning look; defaults to context UV. */
    readonly sampleTexture?: (name: string, uv?: Node) => Node;
}

/** Material hooks always receive a sampler for their declared look textures. */
export interface VfxMaterialContext extends VfxParticleContext {
    readonly sampleTexture: (name: string, uv?: Node) => Node<'vec4'>;
}

/** TSL hook. Return a color `vec3`/`vec4` or opacity `float` node. */
export type VfxMaterialHook = (ctx: VfxMaterialContext) => Node;

export type VfxPathPoint = readonly [
    number,
    number,
    number
];

export interface VfxPairedPathSection {
    readonly a: VfxPathPoint;
    readonly b: VfxPathPoint;
    readonly u?: number;
    readonly age?: number;
    readonly distance?: number;
    /** False starts a new disconnected strip at this section. Default true after the first section. */
    readonly connected?: boolean;
}

export interface VfxBillboardPathPoint {
    readonly position: VfxPathPoint;
    readonly width: number;
    readonly u?: number;
    readonly age?: number;
    readonly distance?: number;
    /** False starts a new disconnected strip at this point. Default true after the first point. */
    readonly connected?: boolean;
}

/** Resolves a catalog sheet role without loading the art catalog. */
export function role(name: VfxSheetRole): {
    readonly role: VfxSheetRole;
};

/** One catalog sheet role. */
type VfxSheetRole = (typeof VFX_SHEET_ROLE_NAMES)[number];

/** Catalog sheet roles accepted by `vfxTexture` and role bindings. */
declare const VFX_SHEET_ROLE_NAMES: readonly [
    'flake',
    'flash',
    'smoke',
    'slash',
    'spark',
    'decal',
    'streak',
    'flame',
    'bolt'
];

export interface VfxPointSource {
    sample(deltaSeconds: number): VfxSourceSample;
}

/** Samples a moving Object3D point and derives velocity from the supplied sample delta. */
export function createVfxPointSource(object: Object3D, localOffset?: VfxSourceVec3): VfxPointSource;

type VfxSourceVec3 = readonly [
    number,
    number,
    number
];

interface VfxSourceSample {
    readonly position: VfxSourceVec3;
    readonly velocity: VfxSourceVec3;
}

/** Samples the shared scene color through a bounded screen-space offset. */
export function sampleVfxRefraction(offset: Node<'vec2'>, options?: VfxRefractionSampleOptions): Node<'vec3'>;

interface VfxRefractionSampleOptions {
    readonly chromaticAberration?: number;
    readonly tint?: VfxRefractionTint;
    readonly subtractSource?: boolean;
}

type VfxRefractionTint = readonly [
    number,
    number,
    number
];

/** Camera override for the one scene VFX system. */
interface VfxSystemOptions {
    readonly camera?: Camera;
}

/** Scene-bound VFX surface. Playback accepts a `defineVfx` definition. */
interface VfxSystem {
    onReady(callback: () => void | Promise<void>): void;
    /**
     * Prepares one definition. A failure rejects only this promise and leaves other effects
     * untouched. Await or catch it: a rejection nobody handles fails scene activation.
     */
    prepare(effect: VfxDefinition, options?: VfxPrepareOptions): Promise<void>;
    /**
     * Frees the CPU copy of textures already uploaded to the GPU, so the next effect can be
     * prepared within the decoded-texture byte budget. Prepared effects stay prepared and play
     * without loading or compiling anything. Call it after `await prepare(...)`.
     */
    releaseDecodedTextures(): void;
    play(effect: VfxDefinition, options?: VfxPlayOptions): VfxHandle;
}

/** Capacity reserved for one definition during scene activation. */
interface VfxPrepareOptions {
    readonly instances?: number;
    readonly frames?: number;
    /**
     * Model the effect will play on. A definition with `host` layers compiles them
     * against this model, so the first play compiles nothing. Pass one model that
     * shares the geometry and skeleton of the models you will play it on.
     */
    readonly host?: Object3D;
}

/** Transform, attachment, and param values for one playback. */
interface VfxPlayOptions {
    readonly position?: Vec3;
    readonly rotation?: Vec4;
    readonly parent?: Object3D;
    /** Model the effect plays on. Required when the definition declares `host`. */
    readonly host?: Object3D;
    readonly source?: VfxPointSource;
    readonly seed?: number;
    /** Scene-owned visibility class. It does not change the prepared materials. */
    readonly admissionClass?: VfxAdmissionClass;
    /** Initial named values, including Kit uniforms, arc endpoints, and effect-spec parameters. */
    readonly params?: VfxKitPlayOptions['params'];
    /** Effect-spec parameter values applied when playback starts. */
    readonly parameters?: Readonly<Record<string, VfxParameterValue>>;
}

/** Stable handle returned for one kit playback. */
interface VfxHandle {
    readonly id: string;
    readonly state: VfxHandleState;
    readonly ready: Promise<VfxHandle>;
    readonly finished: Promise<VfxHandle>;
    readonly diagnostics: readonly RuntimeDiagnostic[];
    setParam(name: string, value: VfxParameterValue | string | boolean): void;
    stop(options?: {
        readonly immediate?: boolean;
    }): void;
    dispose(): void;
}

type VfxHandleState = 'preparing' | 'playing' | 'stopping' | 'finished' | 'rejected' | 'disposed';

type VfxAdmissionClass = 'hero' | 'standard' | 'ambient';

export interface VfxDefinition {
    readonly id: string;
    /** Authored emission/presentation timeline. Particle tails may outlive it; use the playback handle's finished promise for completion. */
    readonly duration: number;
    readonly maxInstances: number;
    readonly loop: boolean;
    readonly params: Readonly<Record<string, VfxKitParamDeclaration>>;
    /** Set when every play must pass `host`. */
    readonly host?: VfxKitHostOptions;
}

export interface VfxKitBuilder {
    param(name: string): Node;
    particles(options: VfxKitParticlesOptions): VfxKitPart;
    ribbon(options?: VfxKitRibbonOptions): VfxKitPart;
    mesh(options: VfxKitMeshOptions): VfxKitPart;
    light(options?: VfxKitLightOptions): VfxKitPart;
    beam(options?: VfxKitBeamOptions): VfxKitPart;
    stroke(options?: VfxKitStrokeOptions): VfxKitPart;
    energyBlade(options?: VfxKitEnergyBladeOptions): VfxKitPart;
    flash(options?: VfxKitFlashOptions): VfxKitPart;
    burst(options?: VfxKitBurstOptions): VfxKitPart;
    streaks(options?: VfxKitStreaksOptions): VfxKitPart;
    shockwave(options?: VfxKitShockwaveOptions): VfxKitPart;
    groundSheet(options?: VfxKitShockwaveOptions): VfxKitPart;
    slashSheet(options?: VfxKitSlashOptions): VfxKitPart;
    plume(options?: VfxKitPlumeOptions): VfxKitPart;
    motes(options?: VfxKitMotesOptions): VfxKitPart;
    bolt(options?: VfxKitBoltOptions): VfxKitPart;
    /** Parent-local strip resampled from `sample` for the effect age. */
    path(layer: Omit<VfxPathLayer, 'kind'>): VfxKitPart;
    /** Jagged arc between `origin` and `target`. `originParam` and `targetParam` follow `setParam`. */
    arc(layer: Omit<VfxKitArcLayer, 'kind'> & {
        readonly originParam?: string;
        readonly targetParam?: string;
    }): VfxKitPart;
    /** Copy of the play host's meshes, shaded and deformed by the look. Needs `host` on the definition. */
    hostShell(options?: VfxKitHostShellOptions): VfxKitPart;
    /** Camera-facing dots on the play host's surface. Needs `host` on the definition. */
    hostPoints(options: VfxKitHostPointsOptions): VfxKitPart;
}

export function defineVfx(options: {
    readonly id: string;
    readonly duration: number;
    readonly maxInstances?: number;
    readonly seed?: number;
    readonly loop?: boolean;
    readonly params?: Readonly<Record<string, VfxKitParamDeclaration>>;
    /** Uniform paths such as `p0.velocity.direction`. `setParam` writes them after play. */
    readonly parameters?: Readonly<Record<string, VfxParameterSpec>>;
    /** The effect plays on a model passed as `play(effect, { host })`. */
    readonly host?: VfxKitHostOptions;
    readonly build: (fx: VfxKitBuilder) => void;
}): VfxDefinition;

export interface VfxKitParticlesOptions extends VfxKitSurfaceOptions {
    /** Defaults to the largest burst, or 1 when bursts are also omitted. */
    readonly capacity?: number;
    readonly rateOverTime?: number;
    readonly duration?: number;
    readonly delay?: number;
    readonly bursts?: readonly {
        readonly time: number;
        readonly count: number;
    }[];
    readonly startLife: VfxKitRange;
    readonly startSpeed?: VfxKitRange;
    readonly direction?: Vec3;
    /** Local point each particle initially travels toward. Omit `direction` and `radial` when this is set. */
    readonly target?: Vec3;
    /** Launch along the spawn offset. Omit `direction` when this is set. */
    readonly radial?: 'inward' | 'outward';
    readonly spread?: number;
    readonly shape?: VfxKitShape;
    /** Baked spawn points. Particle i uses point i and, when set, that point's velocity. */
    readonly samples?: {
        readonly points: readonly Vec3[];
        readonly velocities?: readonly Vec3[];
    };
    readonly gravity?: number;
    readonly drag?: number;
    readonly noise?: {
        readonly strength: number;
        readonly frequency: number;
        readonly scrollSpeed?: number;
    };
    readonly collision?: {
        readonly bounce: number;
        readonly friction?: number;
        readonly normal?: Vec3;
        readonly distance?: number;
        readonly killOnHit?: boolean;
    };
    /** Sphere or box signed-distance collision, in addition to `collision`. */
    readonly sdfCollision?: {
        readonly shape: 'sphere' | 'box';
        readonly center: Vec3;
        readonly radius?: number;
        readonly halfExtents?: Vec3;
        readonly bounce: number;
        readonly friction: number;
        readonly killOnHit?: boolean;
    };
    readonly dampen?: number;
    readonly startSize?: VfxKitRange;
    readonly sizeOverLife?: VfxKitCurve;
    readonly colorOverLife?: Gradient;
    /** Alpha over life. White RGB stays in `colorOverLife` when the color itself changes. */
    readonly opacityOverLife?: VfxKitCurve;
    /** Fade in, then out, in seconds of this part's life. Not combined with `opacityOverLife`. */
    readonly fade?: readonly [
        number,
        number
    ];
    readonly startRotation?: VfxKitRange;
    /** Radians per second. A range is per-particle. `rotate: false` holds the initial angle. */
    readonly spin?: VfxKitRange;
    /** When true, a numeric `spin` eases to 0 over the particle life. */
    readonly spinDecay?: boolean;
    /** Radians per second over life. Replaces `spin` and `spinDecay`. */
    readonly spinOverLife?: VfxKitCurve;
    readonly rotate?: boolean;
    readonly rotation?: VfxKitRotation;
    readonly lit?: boolean;
    /** Soft-particle fade distance. Semantic flashes use 1. */
    readonly soft?: number;
    readonly stretch?: VfxStretchFactors;
    /** Sprite width/height. Omitted sprites stay square. */
    readonly aspect?: number;
    /** Non-uniform sprite scale over the particle life. */
    readonly scaleOverLife?: VfxSpriteScaleOverLife;
    /** Sprite UV anchor. `[0.5, 0.5]` is center. */
    readonly pivot?: readonly [
        number,
        number
    ];
    /** Each frame sets velocity to `linear * curve(progress)`, or adds it when `apply` is `force`. */
    readonly velocityOverLife?: {
        readonly linear: Vec3;
        readonly curve?: Curve;
        readonly apply?: 'velocity' | 'force';
    };
    /** Spin around an axis with optional inward or outward drift. */
    readonly orbit?: {
        readonly speed: number;
        readonly axis?: Vec3;
        readonly radialDrift?: number;
    };
    /** Horizontal sprite tilt that grows with speed. */
    readonly flutter?: VfxFlutter;
    /** Lambert lighting on the sprite. Omitted sprites stay unlit. */
    readonly sceneLighting?: boolean;
    /** Ribbon drawn behind each live particle. */
    readonly trail?: VfxTrail;
    readonly polygonOffset?: {
        readonly factor: number;
        readonly units: number;
    };
    readonly map?: VfxKitMap;
    /** When set, the emitter renders meshes instead of sprites. */
    readonly mesh?: VfxMeshGeometry | VfxKitMeshSettings;
    readonly meshSide?: 'front' | 'double';
    readonly meshOrient?: 'velocity' | 'random';
    readonly meshOrientAxis?: VfxMeshOrientAxis;
    readonly metalness?: number;
    readonly roughness?: number;
    /** Clearcoat weight in 0..1. Applied on a lit mesh. */
    readonly clearcoat?: number;
    /** Clearcoat roughness in 0..1. Applied when `clearcoat` is set. */
    readonly clearcoatRoughness?: number;
    /** Dielectric specular weight in 0..1 on lit meshes. */
    readonly specularIntensity?: number;
    /** Motion-vector contribution for temporal rendering. */
    readonly temporal?: VfxTemporalContribution;
    readonly opaque?: boolean;
    /** Local-axis scale on top of particle size. */
    readonly meshScale?: VfxAxisScale;
    readonly meshScaleOverLife?: VfxMeshScaleOverLife;
    /** Tip-following chain. `samples` are time, x, y, z. */
    readonly chainReel?: {
        readonly role: 'link' | 'hook';
        readonly phase: number;
        readonly pitch: number;
        readonly samples: readonly (readonly [
            number,
            number,
            number,
            number
        ])[];
    };
    readonly blend?: VfxBlendMode;
    readonly mode?: 'billboard' | 'stretched' | 'horizontal' | 'vertical' | 'decal';
    /** Scene-depth projection controls, used only with mode decal. */
    readonly decal?: Extract<RendererSpec, {
        type: 'sprite';
    }>['decal'];
    readonly simulationSpace?: 'local' | 'world';
    readonly orderInLayer?: number;
    readonly transform?: VfxKitTransform;
}

/** Writable TSL slots. Assign them inside `build`, before prepare compiles the material. */
export interface VfxKitMaterialSlots {
    colorNode: Node | null;
    opacityNode: Node | null;
    positionNode: Node | null;
    sizeNode: Node | null;
}

export interface VfxKitPart {
    readonly id: string;
    /** Particle color rgb, bound when the material is compiled. */
    readonly color: Node;
    /** Particle size, bound when the material is compiled. */
    readonly size: Node;
    readonly material: VfxKitMaterialSlots;
}

export interface VfxKitPlayOptions {
    readonly position?: Vec3;
    readonly rotation?: Vec4;
    readonly parent?: Object3D;
    /**
     * Model the effect plays on, required when the definition declares `host`.
     * `position` and `rotation` then offset the effect from the bottom centre of the host.
     */
    readonly host?: Object3D;
    /** Initial named values, including Kit uniforms, arc endpoints, and effect-spec parameters. */
    readonly params?: Readonly<Record<string, number | string | boolean | Vec3>>;
}

export interface VfxKitHandle {
    stop(options?: {
        readonly immediate?: boolean;
    }): void;
    release(): void;
    /** Writes a param uniform, or moves an arc endpoint when the name targets one. */
    setParam(name: string, value: number | string | boolean | readonly number[]): void;
}

/** Unity TrailRenderer-style settings compiled onto a ribbon output. */
interface VfxTrail {
    readonly sheet?: VfxSheetRef;
    readonly lifetime?: number;
    readonly width?: number | Curve;
    /** `world` keeps dump centimetres; default `particle` multiplies by particle size. */
    readonly widthSpace?: 'particle' | 'world';
    readonly minVertexDistance?: number;
    readonly sampleRate?: number;
    readonly segments?: number;
    readonly align?: 'y-up' | 'camera';
    readonly uv?: 'path' | 'unity';
    readonly textureAxis?: 'u' | 'v';
    readonly polarity?: VfxStripPolarity;
    readonly anchor?: number;
    readonly tint?: Vec4;
    readonly blend?: VfxBlendMode;
    readonly emission?: number;
    /** Look for the ribbon surface. Omit to reuse the parent layer's look. */
    readonly look?: VfxLayerLookRef;
}

type VfxKitRange = number | readonly [
    number,
    number
];

/** One rotation description. Flat `startRotation` / `spin` fields still work when this is omitted. */
interface VfxKitRotation {
    readonly start?: VfxKitRange;
    /** Radians per second. A range is per-particle. */
    readonly spin?: VfxKitRange;
    /** A numeric `spin` eases to 0 over the particle life. */
    readonly decay?: boolean;
    /** Radians per second over life. Replaces `spin` and `decay`. */
    readonly overLife?: VfxKitCurve;
    /** When false, a spin starts upright unless `start` is applied. */
    readonly enabled?: boolean;
}

/** Mesh geometry plus the fields that only apply to a mesh renderer. Flat fields still work. */
interface VfxKitMeshSettings {
    readonly geometry: VfxMeshGeometry;
    /** Euler radians baked into a library model. Applies only to `vfxMesh` with a model name. */
    readonly basis?: VfxMeshBasis;
    readonly side?: 'front' | 'double';
    readonly orient?: 'velocity' | 'random';
    readonly orientAxis?: VfxMeshOrientAxis;
    readonly scale?: VfxAxisScale;
    readonly scaleOverLife?: VfxMeshScaleOverLife;
    readonly metalness?: number;
    readonly roughness?: number;
    readonly clearcoat?: number;
    readonly clearcoatRoughness?: number;
    /** Dielectric specular weight in 0..1 on lit meshes. */
    readonly specularIntensity?: number;
    readonly opaque?: boolean;
    readonly polygonOffset?: {
        readonly factor: number;
        readonly units: number;
    };
}

/** Emitter placement. Rotation is a quaternion, xyzw. */
interface VfxKitTransform {
    readonly position?: Vec3;
    readonly rotation?: Vec4;
}

/** Sheet fields the particle presets forward onto `particles`. */
interface VfxKitSurfaceOptions {
    readonly tint?: Vec4;
    readonly emission?: number;
    readonly coverage?: VfxCoverageChannel;
    readonly coverageRange?: readonly [
        number,
        number
    ];
    readonly colorSource?: VfxColorSource;
    readonly textureColorSpace?: VfxTextureColorSpace;
    readonly flipbook?: VfxFlipbook;
    readonly dissolve?: {
        readonly texture: {
            readonly assetId: string;
        } | {
            readonly url: string;
        } | {
            readonly builtin: VfxBuiltinTexture;
        };
        readonly softness?: number;
    };
    readonly normal?: VfxMaterialNormalSlot;
    readonly motion?: VfxMaterialMotionSlot;
    readonly ramp?: VfxMaterialRampSlot;
    readonly mask?: VfxMaterialMaskSlot;
    readonly distortion?: VfxMaterialDistortionSlot;
    readonly reveal?: VfxMaterialRevealSlot;
    readonly look?: VfxLayerLookRef;
    /** Vortex force field. `position` defaults to the origin. */
    readonly vortex?: {
        readonly position?: Vec3;
        readonly strength: number;
        readonly radius: number;
        readonly falloff?: 'linear' | 'none';
    };
}

interface VfxKitShape {
    readonly type: 'point' | 'sphere' | 'hemisphere' | 'cone' | 'box' | 'circle' | 'cylinder' | 'host';
    readonly radius?: VfxKitRange;
    readonly angle?: number;
    readonly length?: number;
    readonly height?: VfxKitRange;
    readonly shell?: boolean;
    readonly size?: Vec3;
    readonly axis?: Vec3;
    readonly burstCount?: number;
    /** Circle only. Omitted circles space spawns evenly. `false` scatters them. */
    readonly even?: boolean;
}

/** Sheet reference resolved before a material is built. */
type VfxSheetRef = {
    readonly role: VfxSheetRole;
} | {
    readonly element: VfxElement;
    readonly role: VfxSheetRole;
} | {
    readonly assetId: string;
    readonly identifier?: string;
    readonly coverage?: VfxCoverageChannel;
    readonly colorSource?: VfxColorSource;
    readonly textureColorSpace?: VfxTextureColorSpace;
    readonly flipbook?: VfxFlipbook;
} | {
    readonly builtin: VfxBuiltinTexture;
} | {
    readonly preset: VfxMaterialPreset;
} | {
    readonly generated: string;
};

type VfxElement = (typeof VFX_ELEMENTS)[number];

declare const VFX_ELEMENTS: readonly [
    'fire',
    'ice',
    'lightning',
    'holy',
    'poison',
    'arcane',
    'blood',
    'water',
    'wind',
    'earth',
    'shadow'
];

type VfxColorSource = 'texture' | 'tint';

/** Atlas layout and playback shared by effect graph nodes and render modules. */
interface VfxFlipbook {
    readonly columns: number;
    readonly rows: number;
    readonly fps?: number;
    readonly loop?: boolean;
    /** Offset the first cell. 'random' selects a stable cell per particle. */
    readonly startFrame?: 'random' | number;
    readonly mix?: boolean;
    /** Hold a single cell when the atlas contains independent shapes. */
    readonly playback?: 'animate' | 'hold';
}

type VfxCoverageChannel = 'alpha' | 'luminance' | 'red';

type Curve = readonly {
    readonly t: number;
    readonly v: number;
}[] | {
    readonly bezier: readonly [
        number,
        number,
        number,
        number
    ][];
};

type Gradient = readonly {
    readonly t: number;
    readonly rgba: Vec4;
}[];

interface VfxSpriteScaleOverLife {
    readonly x: Curve;
    readonly y: Curve;
}

interface VfxMeshScaleOverLife extends VfxSpriteScaleOverLife {
    readonly z: Curve;
}

type VfxBlendMode = 'additive' | 'alpha' | 'premultiplied' | 'additive-soft';

/** Three-VFX `orientToDirection` local axis. Default `z`. */
type VfxMeshOrientAxis = 'x' | 'y' | 'z' | '-x' | '-y' | '-z';

/** Optional Euler radians baked into the loaded mesh (UE Z-up → glTF Y-up, etc.). */
type VfxMeshBasis = readonly [
    number,
    number,
    number
];

/** Uniform axis scale, or a per-particle hash between `min` and `max`. */
type VfxAxisScale = Vec3 | {
    readonly min: Vec3;
    readonly max: Vec3;
};

type VfxMeshGeometry = VfxNamedMeshGeometry | VfxExternalMeshGeometry | VfxInlineMeshGeometry;

interface VfxTemporalContribution {
    readonly motion: 'none' | 'camera' | 'particle';
    readonly response: 'normal' | 'responsive' | 'exclude';
    readonly alphaThreshold?: number;
}

interface VfxStretchFactors {
    /** Unity `velocityScale` / Quarks `speedFactor`. */
    readonly speedFactor: number;
    /** Unity `lengthScale` / Quarks `lengthFactor`. Stretch = speed × speedFactor + lengthFactor. */
    readonly lengthFactor: number;
}

/** Motion-weighted horizontal-quad tilt. This is presentation, not angular physics. */
interface VfxFlutter {
    /** Maximum tilt in radians. */
    readonly amplitude: number;
    /** Oscillations per second. */
    readonly frequency: number;
    /** Particle speed in metres/second at which flutter reaches full amplitude. */
    readonly fullSpeed: number;
}

type RendererSpec = ({
    readonly type: 'sprite';
    readonly mode: 'billboard' | 'stretched' | 'horizontal' | 'vertical' | 'decal';
    readonly material: MaterialSpec;
    /** Intersection fade distance in world units; independent of camera clipping range. */
    readonly soft?: number;
    readonly blend: VfxBlendMode;
    /** Unity stretched-billboard remap. Omit to keep legacy `max(1, speed)` stretch. */
    readonly stretch?: VfxStretchFactors;
    /** Motion-weighted two-axis flutter for horizontal sprites; rests flat at zero speed. */
    readonly flutter?: VfxFlutter;
    /** UV anchor. `[0.5, 0.5]` is the quad center; `[0.5, 0]` grows from the bottom. */
    readonly pivot?: readonly [
        number,
        number
    ];
    /** Quad width / height. Size remains the longer side; default 1. */
    readonly aspect?: number;
    /** Independent X/Y size curves over normalized age. Default 1. */
    readonly scaleOverLife?: VfxSpriteScaleOverLife;
    /** Lambert scene lighting and received shadows on the actual sprite surface. Default unlit. */
    readonly sceneLighting?: boolean;
    /** Packed Unity RLU + DBF 6-way lightmaps. Smoke / dust read as volumes. */
    readonly lit?: boolean;
    /** Shared-depth particle decal controls. Only used by `mode: 'decal'`. */
    readonly decal?: {
        /** Minimum view-facing receiver alignment in 0..1. */
        readonly angleFade?: number;
        /** Reject visible receiver faces pointing away from projector local +Y. Default allows both sides. */
        readonly backface?: 'allow' | 'clip';
        /** View-space lift used to avoid z-fighting. */
        readonly depthBias?: number;
        /** Full local-Y projector thickness in metres. Omit for size-derived thickness. */
        readonly depth?: number;
        /** Receiver-normal contribution written into Rendering's normal attachment. */
        readonly normalStrength?: number;
        /** Material roughness written by the projected particle decal. */
        readonly roughness?: number;
    };
} & VfxLayering) | ({
    readonly type: 'mesh';
    readonly geometry: VfxMeshGeometry;
    readonly material: MaterialSpec;
    readonly lit?: boolean;
    /** PBR metalness in 0..1. Applied when `lit` is true. */
    readonly metalness?: number;
    /** PBR roughness in 0..1. Applied when `lit` is true. */
    readonly roughness?: number;
    /** Clearcoat weight in 0..1. Applied when `lit` is true. */
    readonly clearcoat?: number;
    /** Clearcoat roughness in 0..1. Applied when `clearcoat` is set. */
    readonly clearcoatRoughness?: number;
    /** Dielectric specular weight in 0..1 on lit meshes. */
    readonly specularIntensity?: number;
    /** Depth-writing opaque mesh. Default false for particle materials. */
    readonly opaque?: boolean;
    readonly side?: VfxMeshSide;
    readonly blend?: VfxBlendMode;
    /** Depth bias for a transparent overlay that shares a receiver's surface. */
    readonly polygonOffset?: {
        readonly factor: number;
        readonly units: number;
    };
    /** Align to velocity, or start each particle at a fixed random 3D orientation. */
    readonly orient?: 'velocity' | 'random';
    readonly orientAxis?: VfxMeshOrientAxis;
    /** Extra local-axis scale on top of particle size. Default `[1,1,1]`. */
    readonly scale?: VfxAxisScale;
    /** Independent local-axis scale curves evaluated in the vertex shader. */
    readonly scaleOverLife?: VfxMeshScaleOverLife;
} & VfxLayering) | ({
    readonly type: 'ribbon';
    readonly segments: number;
    readonly width: Curve;
    /**
     * `particle` multiplies width by particle size (legacy).
     * `world` is metres on the ribbon, ignoring particle size.
     */
    readonly widthSpace?: 'particle' | 'world';
    readonly material: MaterialSpec;
    readonly blend?: VfxBlendMode;
    /** Default `y-up`. `camera` faces the viewer like a Unity TrailRenderer. */
    readonly align?: 'y-up' | 'camera';
    /**
     * Vertex expire time in seconds. Omit to keep the whole ring.
     * Sample age is stored in trailHistory.w.
     */
    readonly lifetime?: number;
    /** Commit a new vertex only after this travel distance. Default 0. */
    readonly minVertexDistance?: number;
    /** Max commits per second. Omit to commit every update (legacy ring). */
    readonly sampleRate?: number;
    /** `unity` is U across width, V along the path. Default `path`. */
    readonly uv?: 'path' | 'unity';
    readonly textureAxis?: 'u' | 'v';
    readonly polarity?: VfxStripPolarity;
    readonly anchor?: number;
} & VfxLayering) | ({
    readonly type: 'beam';
    /** Texture axis along beam length. Default u; v preserves upright light-column sheets. */
    readonly textureAxis?: 'u' | 'v';
    readonly polarity?: VfxStripPolarity;
    readonly anchor?: number;
    readonly width: number;
    readonly length: number;
    /** World stretch axis when particle speed is ~0. Default `[0, 1, 0]`. */
    readonly axis?: Vec3;
    readonly material: MaterialSpec;
    readonly blend?: VfxBlendMode;
} & VfxLayering) | ({
    /** Emitter-level tip stroke. CPU tube, not a per-particle ribbon. */
    readonly type: 'stroke';
    readonly material: MaterialSpec;
    readonly look?: string;
    readonly intensity?: number;
    readonly radius?: number;
    readonly blend?: VfxBlendMode;
} & VfxLayering) | ({
    /** Point light on the emitter attach. No particle kernel. */
    readonly type: 'light';
    readonly intensity?: number;
    readonly range?: number;
    readonly color?: Vec3;
    readonly curve?: Curve;
} & VfxLayering);

type VfxStripPolarity = 'head' | 'tail' | 'center';

interface VfxMaterialNormalSlot extends VfxMaterialMapSlot {
    readonly strength?: number;
}

interface VfxMaterialMotionSlot extends VfxMaterialMapSlot {
    readonly pixels?: number;
    /** Atlas-UV displacement per unit motion. Compile fills this from `pixels` / image width. */
    readonly atlasScale?: number;
}

interface VfxMaterialRampSlot extends VfxMaterialMapSlot {
    readonly axis?: VfxRampAxis;
    readonly polarity?: VfxRampPolarity;
    readonly mode?: VfxRampMode;
    readonly source?: VfxRampSource;
    /** Multiplies the lookup coordinate before `offset`. */
    readonly scale?: number;
    readonly offset?: number;
}

interface VfxMaterialMaskSlot extends VfxMaterialMapSlot {
    readonly channel?: VfxCoverageChannel;
    readonly space?: VfxMaskSpace;
    readonly range?: readonly [
        number,
        number
    ];
}

interface VfxMaterialDistortionSlot extends VfxMaterialMapSlot {
    readonly amount?: number;
    /** UV offset per second when the renderer supplies lifetime; otherwise per progress. */
    readonly scroll?: readonly [
        number,
        number
    ];
    /** Tiles the distortion map. `flow-dual` keeps the color sheet at its authored scale. */
    readonly scale?: readonly [
        number,
        number
    ];
    readonly mode?: VfxDistortionMode;
}

interface VfxMaterialRevealSlot {
    readonly texture?: VfxTextureSource;
    readonly softness?: number;
    /** Progress at which the sweep finishes. Default 1. */
    readonly until?: number;
}

type VfxMeshSide = 'front' | 'double';

type VfxExternalMeshGeometry = {
    readonly assetId: string;
    readonly basis?: VfxMeshBasis;
    readonly scale?: VfxAxisScale;
} | {
    readonly url: string;
    readonly basis?: VfxMeshBasis;
    readonly scale?: VfxAxisScale;
};

/** Triangle list in local space. Indexed meshes split by default so each face keeps its own normal. */
type VfxInlineMeshGeometry = {
    readonly positions: readonly number[];
    readonly uvs?: readonly number[];
    readonly indices?: readonly number[];
    /** `smooth` keeps shared vertices and averages their normals. Default is flat. */
    readonly shading?: 'flat' | 'smooth';
};

interface VfxLayering {
    /** Overrides `EffectSpec.sortingLayer` for this emitter. */
    readonly sortingLayer?: number;
    /** Unity order-in-layer. Defaults to the emitter index. */
    readonly orderInLayer?: number;
    /** Keeps a previous simulation position so Rendering can write stable motion vectors. */
    readonly motionVectors?: boolean;
    /** Semantic temporal contribution consumed by Rendering; VFX never configures TAA attachments. */
    readonly temporal?: VfxTemporalContribution;
}

/** Runtime material surface; code-native TSL hooks stay outside recipe data. */
type MaterialSpec = VfxDataMaterialSpec & VfxMaterialHooks;

type VfxRampAxis = 'u' | 'v';

type VfxRampPolarity = 'positive' | 'negative' | 'signed';

type VfxRampMode = 'color' | 'scalar';

type VfxRampSource = 'luma' | 'progress';

type VfxMaskSpace = 'footprint' | 'angle';

type VfxDistortionMode = 'warp' | 'modulate' | 'flow-dual';

interface VfxMaterialMapSlot {
    readonly texture: VfxTextureSource;
}

/** Serializable material surface accepted by recipes and quality overrides. */
type VfxDataMaterialSpec = VfxDataMaterialBase & VfxMaterialSource;

interface VfxMaterialHooks {
    /** Replaces the default RGB node. `ctx` is the live particle TSL record. */
    readonly colorNode?: VfxMaterialHook;
    /** Replaces the default opacity node. */
    readonly opacityNode?: VfxMaterialHook;
    /** Multiplies sampled coverage without replacing the texture or preset opacity. */
    readonly opacityMultiplierNode?: VfxMaterialHook;
    /**
     * Optional scene-color refraction / glass hook (`viewportSharedTexture`).
     * Assigned to the node material `backdropNode` when the renderer supports it.
     */
    readonly backdropNode?: VfxMaterialHook;
    /** Replaces the mesh vertex in local space. `ctx.positionLocal` is the rest vertex. */
    readonly positionNode?: VfxMaterialHook;
    /** Added to the rendered position. Kit TSL offset; not serialized shader IR. */
    readonly positionOffsetNode?: VfxMaterialHook;
    /** Multiplies sprite scale, mesh particle size, beam scale, or ribbon width. */
    readonly sizeNode?: VfxMaterialHook;
    /** Runtime-only texture declarations consumed by look hooks. */
    readonly lookTextures?: Readonly<Record<string, VfxRuntimeLookTexture>>;
}

type VfxMaterialSource = {
    readonly preset: VfxMaterialPreset;
    readonly tint?: Vec4;
} | {
    /**
     * `assetId` / `url` load an external image; `builtin` is baked at runtime
     * (see vfx-textures.ts) so no fetch is needed and captures stay
     * deterministic. Flipbook modules index into this texture as an atlas.
     */
    readonly texture: {
        readonly assetId: string;
    } | {
        readonly url: string;
    } | {
        readonly builtin: VfxBuiltinTexture;
    } | {
        readonly generated: string;
    };
    readonly tint?: Vec4;
};

/** Runtime-only form used after a material has crossed the graph boundary. */
interface VfxRuntimeLookTexture {
    readonly texture: VfxTextureSource;
    readonly colorSpace?: VfxTextureColorSpace;
    readonly wrap?: VfxTextureWrap;
}

interface VfxDataMaterialBase {
    /** Which sampled channel becomes coverage. Default `alpha`. */
    readonly coverage?: VfxCoverageChannel;
    /** Smoothstep the sampled coverage before mask / reveal. */
    readonly coverageRange?: readonly [
        number,
        number
    ];
    /**
     * RGB source. `texture` (default) multiplies sampled RGB. `tint` without a
     * `ramp` uses particle color × material tint only — Unity alpha-mask /
     * black-RGB sheets. A bound `ramp` still multiplies sampled RGB so the
     * lookup is not discarded.
     */
    readonly colorSource?: VfxColorSource;
    /** Decode sampled RGB only. Coverage channels remain raw; default linear. */
    readonly textureColorSpace?: VfxTextureColorSpace;
    /**
     * Linear HDR gain on RGB after tint. `1` (default) is authored color; `>1`
     * writes values that scene bloom can pick up when project bloom is on.
     */
    readonly emission?: number;
    /**
     * Named look (`dissolve` / `refract` / `rim` / `uv-scroll` or a registered
     * id). Agents pick an id — they do not author `colorNode`.
     */
    readonly look?: {
        readonly id: string;
        readonly intensity?: number;
        readonly backdrop?: boolean;
    };
    /** Second texture burned away by particle progress. */
    readonly dissolve?: {
        readonly texture: {
            readonly assetId: string;
        } | {
            readonly url: string;
        } | {
            readonly builtin: VfxBuiltinTexture;
        };
        readonly softness?: number;
    };
    readonly normal?: VfxMaterialNormalSlot;
    readonly motion?: VfxMaterialMotionSlot;
    readonly ramp?: VfxMaterialRampSlot;
    readonly mask?: VfxMaterialMaskSlot;
    readonly distortion?: VfxMaterialDistortionSlot;
    readonly reveal?: VfxMaterialRevealSlot;
    readonly strip?: VfxMaterialStripSlot;
}

interface VfxMaterialStripSlot {
    readonly textureAxis?: 'u' | 'v';
    readonly polarity?: VfxStripPolarity;
    readonly anchor?: number;
    /** Soften unswapped quad edges. `source` is U=0; `sides` is both V edges. */
    readonly edge?: {
        readonly source?: number;
        readonly sides?: number;
    };
    /** Procedural hot spine on unswapped quad V. */
    readonly core?: {
        readonly tint: readonly [
            number,
            number,
            number
        ];
        readonly tightness?: number;
        readonly add?: number;
    };
}

type VfxNamedMeshGeometry = (typeof VFX_NAMED_MESH_GEOMETRIES)[number];

declare const VFX_NAMED_MESH_GEOMETRIES: readonly [
    'cube',
    'quad',
    'slash-arc',
    'ring',
    'sphere',
    'hex-sphere',
    'cylinder',
    'cone',
    'shaft',
    'shaft-glow',
    'disc',
    'flat-ring',
    'diamond',
    'capsule',
    'torus-knot',
    'crystal',
    'dodecahedron'
];

/** Builtin preset, builtin texture, sheet role, or VFX library texture. String literals stay collectable. */
type VfxKitMap = {
    readonly preset: VfxMaterialPreset;
} | {
    readonly builtin: VfxBuiltinTexture;
} | {
    readonly assetId: string;
};

type VfxKitCurve = Curve | VfxSecondsCurve | ((lifeSeconds: number) => Curve);

/** Curve whose keys are seconds. `resolveKitCurve` divides them by the part life. */
interface VfxSecondsCurve {
    readonly unit: 'seconds';
    readonly points: VfxPointCurve;
}

type VfxPointCurve = Extract<Curve, readonly {
    readonly t: number;
    readonly v: number;
}[]>;

/** Resolves a preset name, builtin name, sheet role, or VFX library texture name to a material map. */
export function vfxTexture(name: VfxMaterialPreset): {
    readonly preset: VfxMaterialPreset;
};

export function vfxTexture(name: VfxBuiltinTexture): {
    readonly builtin: VfxBuiltinTexture;
};

export function vfxTexture(name: string): {
    readonly assetId: string;
};

/**
 * Resolves a built-in procedural mesh name or a VFX library model name to a mesh geometry.
 * Place `scale`, `basis`, and `side` on the sibling `mesh` object, not on the geometry.
 */
export function vfxMesh(name: VfxNamedMeshGeometry): VfxNamedMeshGeometry;

export function vfxMesh(name: string): {
    readonly assetId: string;
};

/** Piecewise-linear curve. Each point is `[t, value]` with t in 0..1. */
export function curve(...points: readonly (readonly [
    number,
    number
])[]): Curve;

/** Color gradient. Hex stops spread from 0 to 1. `[t, hex]` sets the time explicitly. */
export function gradient(...stops: readonly (string | readonly [
    number,
    string
])[]): Gradient;

/** Keys are seconds, not a 0..1 life fraction. */
export function secondsCurve(...points: readonly (readonly [
    number,
    number
])[]): VfxSecondsCurve;

export const GROW_FADE: readonly {
    readonly t: number;
    readonly v: number;
}[];

export const BURST_SIZE: readonly {
    readonly t: number;
    readonly v: number;
}[];

export const STREAK_SIZE: readonly {
    readonly t: number;
    readonly v: number;
}[];

export const GROW: readonly {
    readonly t: number;
    readonly v: number;
}[];

export const MOTE_SIZE: readonly {
    readonly t: number;
    readonly v: number;
}[];

export const HOLD: readonly {
    readonly t: number;
    readonly v: number;
}[];

/** Random yaw over a full turn. Sprite layers use this unless they set `rotation`. */
export const RANDOM_YAW: readonly [
    number,
    number
];

export const FLASH_SIZE: readonly {
    readonly t: number;
    readonly v: number;
}[];

export const GLOW_COL: [
    {
        t: number;
        rgba: [
            1,
            1,
            1,
            0
        ];
    },
    {
        t: number;
        rgba: [
            1,
            1,
            1,
            1
        ];
    },
    {
        t: number;
        rgba: [
            1,
            1,
            1,
            1
        ];
    },
    {
        t: number;
        rgba: [
            1,
            1,
            1,
            0
        ];
    }
];

/** View-facing rim. `power` is the fresnel exponent. Call this inside a material hook. */
export function viewFresnel(power: number): Node<'float'>;

interface VfxKitFlashOptions extends VfxKitSurfaceOptions {
    readonly delay?: number;
    readonly transform?: VfxKitParticlesOptions['transform'];
    readonly size?: number;
    readonly count?: number;
    readonly life?: number;
    readonly map?: VfxKitMap;
    readonly blend?: VfxBlendMode;
    /** Soft-particle fade distance. Semantic flashes use 1. */
    readonly soft?: number;
    /** When false, the flash stays upright instead of drawing a random yaw. */
    readonly rotate?: boolean;
}

interface VfxKitBurstOptions extends VfxKitSurfaceOptions {
    readonly delay?: number;
    readonly count?: number;
    readonly life?: number | readonly [
        number,
        number
    ];
    readonly speed?: number | readonly [
        number,
        number
    ];
    readonly size?: number | readonly [
        number,
        number
    ];
    readonly spread?: number;
    readonly map?: VfxKitMap;
    readonly blend?: VfxBlendMode;
    readonly shape?: VfxKitParticlesOptions['shape'];
    readonly gravity?: number;
    readonly direction?: VfxKitParticlesOptions['direction'];
    readonly sizeOverLife?: VfxKitParticlesOptions['sizeOverLife'];
    readonly colorOverLife?: VfxKitParticlesOptions['colorOverLife'];
    /** `false` leaves the burst undamped. A number replaces the default 0.2. */
    readonly dampen?: number | false;
    readonly transform?: VfxKitParticlesOptions['transform'];
}

interface VfxKitStreaksOptions extends VfxKitSurfaceOptions {
    readonly delay?: number;
    readonly transform?: VfxKitParticlesOptions['transform'];
    readonly count?: number;
    readonly life?: number | readonly [
        number,
        number
    ];
    readonly speed?: number | readonly [
        number,
        number
    ];
    readonly size?: number | readonly [
        number,
        number
    ];
    readonly map?: VfxKitMap;
    readonly blend?: VfxBlendMode;
    readonly direction?: Vec3;
    readonly dampen?: number;
    readonly stretch?: VfxKitParticlesOptions['stretch'];
}

interface VfxKitShockwaveOptions extends VfxKitSurfaceOptions {
    readonly delay?: number;
    readonly count?: number;
    readonly life?: number | readonly [
        number,
        number
    ];
    readonly size?: number;
    readonly map?: VfxKitMap;
    readonly blend?: VfxBlendMode;
    readonly ground?: boolean;
}

interface VfxKitSlashOptions extends VfxKitSurfaceOptions {
    readonly delay?: number;
    readonly life?: number;
    readonly size?: number;
    readonly map?: VfxKitMap;
    readonly blend?: VfxBlendMode;
}

interface VfxKitPlumeOptions extends VfxKitSurfaceOptions {
    readonly rate?: number;
    readonly capacity?: number;
    readonly map?: VfxKitMap;
    readonly blend?: VfxBlendMode;
}

interface VfxKitMotesOptions extends VfxKitSurfaceOptions {
    readonly rate?: number;
    readonly capacity?: number;
    readonly map?: VfxKitMap;
    readonly blend?: VfxBlendMode;
}

interface VfxKitBoltOptions extends VfxKitSurfaceOptions {
    readonly delay?: number;
    readonly life?: number;
    readonly speed?: number;
    readonly size?: number;
    readonly direction?: Vec3;
    readonly map?: VfxKitMap;
    readonly blend?: VfxBlendMode;
}

interface VfxKitRibbonOptions extends VfxKitSurfaceOptions {
    readonly capacity?: number;
    readonly segments?: number;
    readonly width?: Curve;
    readonly startLife?: VfxKitRange;
    readonly startSpeed?: VfxKitRange;
    readonly direction?: Vec3;
    readonly spread?: number;
    readonly map?: VfxKitMap;
    readonly blend?: VfxBlendMode;
    readonly orderInLayer?: number;
    readonly delay?: number;
    readonly transform?: VfxKitTransform;
    readonly temporal?: VfxTemporalContribution;
}

interface VfxKitMeshOptions extends VfxKitSurfaceOptions {
    readonly geometry: VfxMeshGeometry;
    readonly capacity?: number;
    readonly startLife?: VfxKitRange;
    readonly startSize?: VfxKitRange;
    readonly bursts?: readonly {
        readonly time: number;
        readonly count: number;
    }[];
    readonly map?: VfxKitMap;
    readonly blend?: VfxBlendMode;
    readonly lit?: boolean;
    readonly tint?: Vec4;
    readonly emission?: number;
    readonly textureColorSpace?: VfxTextureColorSpace;
    readonly colorSource?: VfxColorSource;
    readonly orderInLayer?: number;
    readonly delay?: number;
    readonly transform?: VfxKitTransform;
    readonly polygonOffset?: {
        readonly factor: number;
        readonly units: number;
    };
    readonly meshScale?: VfxAxisScale;
    /** Omitted meshes draw both sides. */
    readonly meshSide?: 'front' | 'double';
    /** Constant radians per second. Omitted meshes do not spin. */
    readonly spin?: number;
}

interface VfxKitLightOptions {
    readonly color?: string | Vec3;
    readonly intensity?: number;
    readonly range?: number;
    readonly curve?: Curve;
    readonly life?: number;
    readonly delay?: number;
    /** World position. Omitted lights stay at the effect origin. */
    readonly position?: Vec3;
    /** Object world position, emitter attachment, path head, or authored motion path to follow. */
    readonly follow?: Object3D | VfxKitPart | VfxKitLightPath;
    /** Alias for following a kit part. Paths follow their sampled head. */
    readonly followPart?: VfxKitPart;
}

interface VfxKitBeamOptions {
    readonly width?: number;
    readonly length?: number;
    readonly life?: number;
    readonly delay?: number;
    readonly position?: Vec3;
    readonly axis?: Vec3;
    readonly map?: VfxKitMap;
    readonly blend?: VfxBlendMode;
    readonly coverage?: VfxCoverageChannel;
    readonly look?: VfxLayerLookRef;
    readonly emission?: number;
    readonly orderInLayer?: number;
}

interface VfxKitStrokeOptions {
    readonly life?: number;
    readonly radius?: number;
    readonly intensity?: number;
    readonly map?: VfxKitMap;
    readonly blend?: VfxBlendMode;
}

interface VfxKitEnergyBladeOptions {
    readonly life?: number;
    readonly size?: number;
    readonly geometry?: VfxNamedMeshGeometry;
    readonly map?: VfxKitMap;
    readonly blend?: VfxBlendMode;
    readonly delay?: number;
    readonly position?: Vec3;
    readonly tint?: Vec4;
    readonly look?: VfxLayerLookRef;
}

interface VfxKitParamDeclaration {
    readonly default: number | string | boolean | Vec3;
    readonly min?: number;
    readonly max?: number;
    readonly step?: number;
}

/** A moving light source in effect-local space, sampled at effect age in seconds. */
interface VfxKitLightPath {
    readonly sample: (age: number) => Vec3;
}

/** Bolt fields the arc renderer reads. */
interface VfxKitArcLayer {
    readonly id: string;
    readonly kind: string;
    readonly origin?: Vec3;
    readonly target?: Vec3;
    readonly size?: number | {
        readonly min: number;
        readonly max: number;
    };
    readonly tint?: readonly [
        number,
        number,
        number,
        number
    ];
    readonly blend?: VfxBoltBlend;
    readonly forks?: number;
    readonly generations?: number;
    readonly jitterHz?: number;
    readonly seed?: number;
    readonly delay?: number;
    readonly life?: number | {
        readonly min: number;
        readonly max: number;
    };
    readonly travel?: number;
    readonly orderInLayer?: number;
}

type VfxBoltBlend = 'additive' | 'alpha';

/**
 * Parent-local strip rebuilt every frame from `sample`.
 * The centerline stays a function of effect age.
 */
interface VfxPathLayer {
    readonly kind: 'path';
    readonly id: string;
    readonly maxSegments: number;
    /** Centerline at the effect age, in parent-local space. */
    readonly sample: (age: number, context?: VfxPathSampleContext) => VfxPathSample;
    readonly look?: VfxLayerLookRef;
    readonly blend?: VfxBlendMode;
    readonly orderInLayer?: number;
    readonly position?: Vec3;
    readonly yaw?: number;
}

/** One sampled centerline, either paired sections or billboard points. */
type VfxPathSample = readonly VfxPairedPathSection[] | readonly VfxBillboardPathPoint[];

/** Read-only values for one playback. Color tuples use linear RGB, as in material params. */
interface VfxPathSampleContext {
    /** Reads a declared Kit param after play overrides and setParam updates. Unknown names throw. */
    param(name: string): number | boolean | Vec3;
}

/**
 * Declares that the definition plays on a model passed as `play(effect, { host })`.
 * The effect never changes host materials. Its own layers copy the host meshes.
 */
interface VfxKitHostOptions {
    /**
     * `none` keeps the host visible under the effect. `reveal` hides the host meshes
     * while the effect plays and shows them when it ends. `conceal` leaves them hidden
     * at the end so the game can remove the host. Stopping early always shows them again.
     * Do not change host mesh visibility while the effect plays.
     */
    readonly takeover?: VfxKitHostTakeover;
    /**
     * `follow` tracks the live pose; keep the host in the scene until the effect finishes.
     * `snapshot` freezes the pose at play, so the game may remove the host right away.
     */
    readonly pose?: 'follow' | 'snapshot';
    /**
     * Scales the whole effect so the host's height maps to `height`. Author positions,
     * sizes, and speeds for a host of that height.
     */
    readonly fit?: {
        readonly height: number;
    };
}

/** Effect-owned copy of every host mesh. Optional PBR values override lit copies only. */
interface VfxKitHostShellOptions extends Pick<VfxKitMeshSettings, 'roughness' | 'metalness'> {
    readonly id?: string;
    /**
     * `ctx.positionLocal` is the host vertex, `ctx.normalLocal` its normal, `ctx.hostUnit`
     * its 0..1 place in the host bounds, and `ctx.color` the host base color. `ctx.age`
     * and `ctx.progress` follow the effect clock.
     */
    readonly look?: VfxLayerLookRef;
    /** Multiplies a named look. `dissolve` uses this the same way a mesh layer does. */
    readonly tint?: readonly [
        number,
        number,
        number,
        number
    ];
    /**
     * Seconds for `ctx.progress` to reach 1. After that, progress keeps climbing so a
     * dissolve stays gone. Defaults to the effect duration.
     */
    readonly life?: number;
    /** Added light, such as a glowing dissolve edge. Same context as `look`. */
    readonly emissive?: VfxMaterialHook;
    /** Pushes the copy out along the host normals, in metres at the fit height. */
    readonly inflate?: number;
    /** Overrides vertex-color modulation. Omitted keeps the copy's existing material setting. */
    readonly vertexColors?: boolean;
    /**
     * `cutout` discards where opacity is below 0.5 and keeps depth and shadows.
     * Defaults to `cutout` with a takeover and `alpha` without one.
     */
    readonly blend?: 'cutout' | 'alpha' | 'additive';
    readonly orderInLayer?: number;
}

/** Camera-facing dots scattered over the host surface by area. */
interface VfxKitHostPointsOptions {
    readonly id?: string;
    /** Dots across all host meshes, 1..65536. */
    readonly count: number;
    /** Dot diameter, or a per-dot range, in metres at the fit height. */
    readonly size?: number | readonly [
        number,
        number
    ];
    /** Vertical cards face the camera around world Y; billboard cards follow camera up. */
    readonly mode?: 'billboard' | 'vertical';
    /** Quad UV anchored to the sampled surface point. Defaults to the centre. */
    readonly pivot?: readonly [
        number,
        number
    ];
    /** Set false for cards that must draw over scene depth. Defaults to true. */
    readonly depthTest?: boolean;
    /**
     * `ctx.positionLocal` is the dot on the host surface; `positionNode` moves it.
     * `ctx.uv` is the dot quad, `ctx.index` the dot number, `ctx.size` its diameter.
     */
    readonly look?: VfxLayerLookRef;
    readonly blend?: 'alpha' | 'additive';
    readonly orderInLayer?: number;
    readonly seed?: number;
}

/** What the effect does with the host's own meshes while it plays. */
type VfxKitHostTakeover = 'none' | 'reveal' | 'conceal';

/** Pixel dimensions and cell layout of a top-row-first atlas. */
export interface VfxAtlasLayout extends Pick<VfxFlipbook, 'columns' | 'rows'> {
    readonly width: number;
    readonly height?: number;
}

/** Explicit phase and UV overrides. Phase clamps by default, or wraps with loop enabled. */
export interface VfxAtlasSampleOptions extends VfxAtlasLayout {
    readonly textureKey?: string;
    readonly phase?: Node<'float'>;
    readonly localUv?: Node<'vec2'>;
    readonly mix?: boolean;
    /** Wraps phase and interpolates the final cell into the first. Defaults to false. */
    readonly loop?: boolean;
}

/** Samples a prepared look texture, failing during material construction if no binding exists. */
export function sampleVfxLookTexture(ctx: VfxParticleContext, name: string, at?: Node): Node<'vec4'>;

/** Samples a top-row-first atlas with optional frame interpolation and half-texel cell insets. */
export function sampleVfxAtlas(ctx: VfxParticleContext, options: VfxAtlasSampleOptions): Node<'vec4'>;

/** Atlas material composition; palette and density remapping are explicitly authored by the caller. */
export interface VfxAtlasLookOptions extends VfxAtlasLayout {
    readonly texture: VfxLookTexture['texture'];
    readonly dark: Vec3;
    readonly mid: Vec3;
    readonly hot: Vec3;
    readonly thresholds: readonly [
        number,
        number,
        number,
        number
    ];
    readonly coverage: 'rgb' | 'alpha' | 'alpha-density';
    readonly densityPower?: number;
    readonly densityCoverage?: readonly [
        number,
        number
    ];
    readonly phase?: (ctx: VfxParticleContext) => Node<'float'>;
    readonly localUv?: (ctx: VfxParticleContext) => Node<'vec2'>;
    readonly opacityMask?: (ctx: VfxParticleContext) => Node<'float'>;
}

/** Builds an atlas look while sharing the sampled node between its color and opacity hooks. */
export function createVfxAtlasLook(options: VfxAtlasLookOptions): VfxLayerLook;

/** Maps density through three authored colors; thresholds belong to the caller. */
export function vfxDensityPalette(density: Node<'float'>, colors: readonly [
    Vec3,
    Vec3,
    Vec3
], thresholds: readonly [
    number,
    number,
    number,
    number
]): Node<'vec3'>;

/** Returns normalized tint and peak-channel emission for a nonnegative HDR color. */
export function vfxHdrTint(r: number, g: number, b: number, a?: number): {
    readonly tint: Vec4;
    readonly emission: number;
};

/** Deterministic [0,1) variation from a particle slot index; independent of age and position. */
export function vfxParticleRandom(ctx: VfxParticleContext): Node<'float'>;

/** Clips particle centres against dot(worldPosition, normal) = distance. A zero normal disables clipping.
 * Supply both fade bounds for a soft transition; omission gives a hard cut. This is not per-pixel or scene-depth clipping.
 */
export function vfxPlaneClip(normal: Node<'vec3'>, distance: Node<'float'>, fade?: readonly [
    number,
    number
]): VfxLayerLook;

/** Samples the Engine curve inside a custom material hook; uses the same evaluator as particle curves. */
export function sampleVfxCurve(curve: Curve, progress: Node<'float'>): Node<'float'>;

/** Authored layout and coverage interpretation of a catalog texture. */
export interface VfxTextureSampling extends VfxAtlasLayout {
    readonly coverage: 'alpha' | 'rgb';
}

/** Returns sampling metadata for an explicitly referenced catalog texture; does not select or load assets. */
export function getVfxTextureSampling(name: string): VfxTextureSampling;

/** One bounded, immutable trail sample in the caller's coordinate frame. */
export interface VfxPositionStamp {
    readonly time: number;
    readonly position: Vec3;
    readonly distance: number;
    readonly connected: boolean;
}

/** Sampling and discontinuity policy; large continuous motion is allowed by default. */
export interface VfxPositionHistoryOptions {
    readonly lifetime: number;
    readonly maxSamples: number;
    readonly minDistance?: number;
    readonly maxGap?: number;
    readonly maxSegmentDistance?: number;
}

/** Per-playback position history. A changed breakSerial explicitly disconnects a teleport or correction. */
export interface VfxPositionHistory {
    sample(age: number, position: Vec3, recording: boolean, breakSerial?: number): readonly VfxPositionStamp[];
}

/** Create once per playback; omitting samples during a pause does not invent movement. */
export function createVfxPositionHistory(options: VfxPositionHistoryOptions): VfxPositionHistory;
