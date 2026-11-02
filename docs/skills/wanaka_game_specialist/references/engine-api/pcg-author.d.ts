// Import from "wanaka-studio-engine/pcg-author".

import type { PbrTextureUrls } from "wanaka-studio-engine/external-assets";

/** Defines an Agent-authored world while keeping the preset's runtime graph opaque. */
export function definePcgWorld<const TPreset extends PcgWorldPreset<string, PcgAuthorRootDomain>>(input: PcgWorldBaseInput<TPreset> & {
    readonly seed: PcgWorldSeed;
    readonly overrides?: Readonly<PcgWorldPresetOverrides<TPreset> & {
        readonly layers?: PcgPresetLayerOverrides<TPreset['id']>;
    }>;
    readonly layers?: PcgWorldDefinition<TPreset>['layers'];
    readonly plans?: readonly PcgDefinedPlan[];
    readonly hydrology?: {
        readonly prefetchRegions: readonly {
            readonly level: number;
            readonly x: number;
            readonly z: number;
        }[];
    };
} & PcgSemanticCompositionInput<TPreset>): PcgWorldDefinition<TPreset>;

type PcgAuthorRootDomain = PcgBaseWorldDomain;

type PcgWorldBaseInput<TPreset extends PcgWorldPreset<string, PcgAuthorRootDomain>> = {
    readonly preset: TPreset;
    readonly base?: never;
} | {
    readonly base: PcgBaseDefinition<TPreset>;
    readonly preset?: never;
};

type PcgSemanticCompositionInput<TPreset extends PcgWorldPreset> = TPreset['domain'] extends PcgBaseWorldDomain ? {
    readonly regions?: TPreset['id'] extends 'off-world' ? never : readonly PcgSemanticSurfaceRegionDeclaration[];
    readonly sites?: readonly PcgSemanticSiteDeclaration[];
    readonly habitats?: readonly PcgSemanticHabitatDeclaration[];
} : {
    readonly regions?: never;
    readonly sites?: never;
    readonly habitats?: never;
};

/** Content-addressed model kit accepted by an authored layer. */
export interface PcgLayerKit extends PcgRoleKit {
    readonly roleContract?: PcgRoleGenerator;
}

export type PcgDefaultPropRole = PcgDefaultPropSlot | `prop.${PcgDefaultPropSlot}`;

export interface PcgLayerGridOptions {
    readonly spacing: number;
    readonly density?: number;
    readonly channel?: string;
    readonly minimumHeight?: number;
    readonly maximumHeight?: number;
    readonly maximumSlope?: number;
    /** Field evaluated against the parent surface sample. */
    readonly mask?: PcgField;
}

/** Read-only semantic view of the parent World cell. */
export interface PcgLayerWorld {
    readonly bounds: PcgBounds2;
    height(x: number, z: number): number | undefined;
    normal(x: number, z: number): readonly [
        number,
        number,
        number
    ] | undefined;
    slope(x: number, z: number): number | undefined;
    mask(name: string, x: number, z: number): number;
    biome(x: number, z: number): string | undefined;
    clearance(mask: string, x: number, z: number): number;
    volumes(output: string): PcgVolumeSet | undefined;
    splines(output: string): PcgSplineNetwork | undefined;
    navigation(output: string): PcgNavigationGraph | undefined;
    polygons(output: string): readonly PcgPolygon2D[] | undefined;
    tiles(output: string): PcgTileGrid | undefined;
    water(output: string): PcgWaterField | undefined;
    plan<TPlan extends PcgDefinedPlan, TOutput extends keyof TPlan['outputs'] & string>(plan: TPlan, output: TOutput | PcgPlanOutputReference): PcgPlanOutputValueForDefinition<TPlan['outputs'][TOutput]> | undefined;
    random(channel: string, x: number, z: number): number;
    sampleGrid(options: PcgLayerGridOptions): PcgPointData;
}

export type PcgLayerOutputDefinition<TRole extends string = string, TSurface extends string = string, TLight extends string = string> = PcgLayerPointOutput<TRole, TLight, TSurface> | PcgLayerHeightDeltaOutput | PcgLayerSurfaceOutput | PcgLayerMeshOutput<TSurface> | PcgLayerVolumesOutput<TSurface> | PcgLayerSplinesOutput<TRole, TSurface> | PcgLayerNavigationOutput | PcgLayerPolygonsOutput<TSurface> | PcgLayerTilesOutput;

export type PcgLayerOutputValue<TOutput extends PcgLayerOutputDefinition> = TOutput extends PcgLayerPointOutput ? PcgPointData : TOutput extends PcgLayerHeightDeltaOutput ? PcgLayerHeightDelta : TOutput extends PcgLayerSurfaceOutput ? PcgLayerSurfaceDefinition : TOutput extends PcgLayerMeshOutput ? PcgMeshBuffer : TOutput extends PcgLayerVolumesOutput ? PcgVolumeSet : TOutput extends PcgLayerSplinesOutput ? PcgSplineNetwork : TOutput extends PcgLayerNavigationOutput ? PcgNavigationGraph : TOutput extends PcgLayerPolygonsOutput ? readonly PcgPolygon2D[] : TOutput extends PcgLayerTilesOutput ? PcgTileGrid : never;

export type PcgLayerOutputValues<TOutputs extends Readonly<Record<string, PcgLayerOutputDefinition>>> = Readonly<{
    [TName in keyof TOutputs]: PcgLayerOutputValue<TOutputs[TName]>;
}>;

/** Semantic custom layer; Engine owns product assembly, hashing and presentation. */
export interface PcgLayerDefinition<TKit extends PcgLayerKit, TOutputs extends Readonly<Record<string, PcgLayerOutputDefinition<PcgLayerModelRole<TKit>, PcgLayerKitSurfaceRole<TKit>, PcgLayerKitLightRole<TKit>>>>, TParams> {
    readonly id: string;
    readonly version: number;
    /** Upstream semantic layers whose height and surface outputs this layer consumes. */
    readonly dependsOn?: readonly PcgDefinedLayer[];
    readonly kit?: TKit;
    readonly outputs: TOutputs;
    readonly params: TParams | ((world: PcgLayerWorldContext) => TParams);
    readonly generate: (context: PcgLayerContext, params: Readonly<TParams>) => PcgLayerOutputValues<TOutputs>;
}

/** Opaque authored layer handle collected into the project Worker by the compiler. */
export interface PcgDefinedLayer<TOutputs extends object = object> {
    readonly [pcgDefinedLayerBrand]: true;
    readonly id: string;
    readonly version: number;
    /** Phantom output contract so a replacement layer is checked against a preset slot. */
    readonly outputs?: TOutputs;
}

export function definePcgLayer<const TKit extends PcgLayerKit = PcgLayerKit, const TOutputs extends Readonly<Record<string, PcgLayerOutputDefinition<PcgLayerModelRole<TKit>, PcgLayerKitSurfaceRole<TKit>, PcgLayerKitLightRole<TKit>>>> = Readonly<Record<string, PcgLayerOutputDefinition<PcgLayerModelRole<TKit>, PcgLayerKitSurfaceRole<TKit>, PcgLayerKitLightRole<TKit>>>>, TParams = unknown>(definition: PcgLayerDefinition<TKit, TOutputs, TParams>): Readonly<PcgDefinedLayer<TOutputs>>;

/** World values available while resolving one layer's immutable generator parameters. */
interface PcgLayerWorldContext {
    readonly seed: string | number;
    readonly terrain?: PcgLayerTerrainProfile;
}

/** Published default-prop slot addressed as the slot name or `prop.<slot>`. */
type PcgDefaultPropSlot = 'tree' | 'bush' | 'flower' | 'grass' | 'crop' | 'house' | 'windmill' | 'car' | 'race-car' | 'barrel' | 'crate' | 'chest' | 'shipping-container' | 'door' | 'window' | 'wall' | 'table' | 'arch' | 'barn' | 'barrier' | 'bed' | 'bench' | 'bicycle' | 'bin' | 'boat' | 'cabinet' | 'chair' | 'desk' | 'fence' | 'hydrant' | 'mailbox' | 'pallet' | 'rock' | 'shelf' | 'shop' | 'sign' | 'sofa' | 'stairs' | 'streetlight' | 'tower' | 'traffic-light' | 'warehouse' | 'aircraft' | 'ammo' | 'animal' | 'ball' | 'billboard' | 'bridge' | 'coin' | 'cone' | 'creature' | 'flag' | 'goal' | 'grandstand' | 'gun' | 'health-pack' | 'key' | 'ladder' | 'lamp' | 'melee' | 'motorcycle' | 'rug' | 'spaceship' | 'target' | 'truck';

type PcgLayerModelRole<TKit extends PcgLayerKit> = PcgLayerKitRole<TKit> | PcgDefaultPropRole;

type PcgLayerKitSurfaceRole<_TKit extends PcgLayerKit> = PcgLayerSurfaceSlot;

type PcgLayerKitLightRole<TKit extends PcgLayerKit> = TKit extends {
    readonly roleContract: {
        readonly lights: infer TLights extends Readonly<Record<string, unknown>>;
    };
} ? Extract<keyof TLights, string> : never;

type PcgPlanOutputValueForDefinition<TDefinition> = TDefinition extends {
    readonly kind: 'points';
} ? PcgPointData : TDefinition extends {
    readonly kind: 'splines';
} ? PcgSplineNetwork : TDefinition extends {
    readonly kind: 'polygons';
} ? readonly PcgPolygon2D[] : TDefinition extends {
    readonly kind: 'volumes';
} ? PcgVolumeSet : never;

interface PcgLayerPointOutput<TRole extends string = string, TLight extends string = string, TSurface extends string = string> {
    /** Presented automatically through the bound semantic model role. */
    readonly kind: 'points';
    /** Overrides semantic-role defaults for avoiding Plan scatter reservations. */
    readonly avoidPlanOccupancy?: boolean;
    /** Optional planar radius in metres before instance scale; otherwise uses available kit bounds. */
    readonly planOccupancyRadius?: number;
    readonly role?: TRole;
    readonly asset?: string;
    readonly present?: PcgLayerPointPresent<TLight, TSurface>;
}

interface PcgLayerHeightDeltaOutput {
    /** Rebuilds the authoritative terrain height, mesh, queries, and collision. */
    readonly kind: 'heightDelta';
    readonly surfaceQueries?: readonly string[];
}

interface PcgLayerSurfaceOutput {
    /** Semantic weight field consumed by dependent layers; it has no direct visual presenter. */
    readonly kind: 'surface';
}

interface PcgLayerMeshOutput<TSurface extends string = string> {
    /** Presented automatically with an Engine-owned standard material. */
    readonly kind: 'mesh';
    readonly color?: number;
    readonly roughness?: number;
    readonly metalness?: number;
    readonly castShadow?: boolean;
    readonly receiveShadow?: boolean;
    readonly look?: PcgLayerLook<TSurface>;
}

interface PcgLayerVolumesOutput<TSurface extends string = string> {
    /** Semantic volume data. `present` adds cell-scoped collision; otherwise it stays data. */
    readonly kind: 'volumes';
    readonly present?: PcgLayerVolumePresent<TSurface>;
}

interface PcgLayerSplinesOutput<TRole extends string = string, TSurface extends string = string> {
    /** Semantic spline data. `present` adds a road or instanced role; otherwise it stays data. */
    readonly kind: 'splines';
    readonly present?: PcgLayerSplinePresent<TRole, TSurface>;
}

interface PcgLayerNavigationOutput {
    /** Semantic navigation data consumed by dependent layers; it has no direct visual presenter. */
    readonly kind: 'navigation';
}

interface PcgLayerPolygonsOutput<TSurface extends string = string> {
    /** Semantic polygon data. `present` paints a terrain surface; otherwise it stays data. */
    readonly kind: 'polygons';
    readonly present?: PcgLayerPolygonPresent<TSurface>;
}

interface PcgLayerTilesOutput {
    /** Semantic tile data consumed by dependent layers; it has no direct visual presenter. */
    readonly kind: 'tiles';
}

type PcgLayerHeightDelta = PcgHeightField;

interface PcgLayerSurfaceDefinition {
    readonly resolution?: number;
    readonly weights: Readonly<Record<string, PcgField>>;
}

interface PcgLayerContext {
    readonly world: PcgLayerWorld;
}

declare const pcgDefinedLayerBrand: unique symbol;

/** Stable vertical frame published by a terrain-owning World. */
interface PcgLayerTerrainProfile {
    readonly baseHeightMeters: number;
    readonly reliefMeters: number;
}

type PcgLayerKitRole<TKit extends PcgLayerKit> = TKit extends {
    readonly roleContract: {
        readonly modelRoles: infer TModelRoles extends readonly string[];
    };
} ? TModelRoles[number] : TKit extends {
    readonly roleContract: PcgRoleGenerator<infer TRoles>;
} ? TRoles[number] : string;

/** Restricted appearance shared by mesh outputs and present declarations. */
interface PcgLayerLook<TSurface extends string = string> {
    readonly surface?: TSurface;
    readonly emissive?: {
        readonly color: number;
        readonly intensity: number;
    };
    readonly opacity?: number;
    readonly tint?: number;
}

type PcgLayerSplinePresent<TRole extends string = string, TSurface extends string = string> = PcgLayerSplineRoadPresent<TSurface> | PcgLayerSplineAlongPresent<TRole, TSurface>;

interface PcgLayerPolygonPresent<TSurface extends string = string> {
    readonly as: 'paving' | 'field';
    readonly surface: TSurface;
    readonly look?: PcgLayerLook<TSurface>;
}

interface PcgLayerVolumePresent<TSurface extends string = string> {
    readonly as: 'blocker';
    readonly look?: PcgLayerLook<TSurface>;
}

type PcgLayerPointPresent<TLight extends string = string, TSurface extends string = string> = PcgLayerLightPresent<TLight, TSurface>;

interface PcgLayerSplineRoadPresent<TSurface extends string = string> {
    readonly as: 'road' | 'path';
    readonly surface: TSurface;
    readonly width: number;
    readonly look?: PcgLayerLook<TSurface>;
}

interface PcgLayerSplineAlongPresent<TRole extends string = string, TSurface extends string = string> {
    readonly as: 'along';
    readonly role: TRole;
    readonly spacing: number;
    readonly look?: PcgLayerLook<TSurface>;
}

interface PcgLayerLightPresent<TLight extends string = string, TSurface extends string = string> {
    readonly as: 'light';
    readonly light: TLight;
    readonly look?: PcgLayerLook<TSurface>;
}

interface PcgRoleGenerator<TRoles extends readonly string[] = readonly string[]> {
    readonly roles: TRoles;
    readonly modelRoles?: readonly TRoles[number][];
    readonly lights?: Readonly<Partial<Record<TRoles[number], PcgLightRoleDefinition>>>;
    /** Canonical world-space height for roles whose source assets use arbitrary units. */
    readonly modelHeightsMeters?: Readonly<Partial<Record<TRoles[number], number>>>;
    readonly defaultRoles?: PcgKitRoleBinding<TRoles>;
}

type PcgKitRoleBinding<TRoles extends readonly string[]> = Readonly<{
    [TRole in TRoles[number]]: string;
}>;

interface PcgLightRoleDefinition {
    readonly color: number;
    readonly intensity: number;
    readonly range: number;
    readonly height: number;
    readonly decay?: number;
}

interface PcgPointData {
    readonly kind: 'points';
    readonly count: number;
    readonly positions: Float32Array;
    readonly rotationsY: Float32Array;
    readonly scales: Float32Array;
    /** Optional xyz unit normals used by surface-bound populations. */
    readonly normals?: Float32Array;
    /** Per-instance canopy density written to the tree mesh `density` attribute. */
    readonly densities?: Float32Array;
    /**
     * Named per-point columns. Each array length is `count` (or `count * itemSize`
     * when the name is recorded with a packed `instanceMatrix` of 16 floats).
     */
    readonly attributes?: Readonly<Record<string, Float32Array>>;
    /**
     * Stable addresses so a world delta can suppress or move a point without
     * storing meshes. Scatter uses `channel:gridX:gridZ`; city furniture uses
     * `${districtId}:lamp|curb:…`.
     */
    readonly ids?: readonly string[];
}

/** Axis-aligned X/Z footprint used by terrain and road spatial queries. */
interface PcgBounds2 {
    readonly minX: number;
    readonly minZ: number;
    readonly maxX: number;
    readonly maxZ: number;
}

interface PcgWaterField {
    readonly kind: 'water';
    readonly sampleCount: number;
    readonly cellSize: number;
    readonly originX: number;
    readonly originZ: number;
    readonly surfaceY: Float32Array;
    readonly bedY: Float32Array;
    readonly shore: Float32Array;
    readonly flowX: Float32Array;
    readonly flowZ: Float32Array;
    readonly bodyIndex: Uint16Array;
}

interface PcgVolumeSet {
    readonly kind: 'volumes';
    readonly volumes: readonly PcgVolume[];
}

interface PcgMeshBuffer {
    readonly kind: 'mesh';
    /** Keeps authored terrain relief when its grid would otherwise be simplified for distance. */
    readonly preserveDetail?: boolean;
    readonly positions: Float32Array;
    readonly indices: Uint32Array;
    readonly normals?: Float32Array;
    readonly uvs?: Float32Array;
}

interface PcgNavigationGraph {
    readonly kind: 'navigation';
    readonly nodes: readonly PcgNavigationNode[];
    readonly edges: readonly PcgNavigationEdge[];
}

interface PcgTileGrid {
    readonly kind: 'tiles';
    readonly originX: number;
    readonly originY: number;
    readonly originZ: number;
    readonly tileSize: number;
    readonly floors: number;
    readonly tiles: readonly PcgTile[];
}

interface PcgPolygon2D {
    readonly kind: 'polygon';
    readonly ring: readonly {
        readonly x: number;
        readonly z: number;
    }[];
    readonly holes?: readonly (readonly {
        readonly x: number;
        readonly z: number;
    }[])[];
    readonly id?: string;
}

interface PcgVolume {
    readonly kind: 'box' | 'capsule' | 'convex';
    readonly minX: number;
    readonly minY: number;
    readonly minZ: number;
    readonly maxX: number;
    readonly maxY: number;
    readonly maxZ: number;
    readonly id?: string;
}

interface PcgNavigationNode {
    readonly id: string;
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly kind: string;
    /** Authoritative road id when this node lies on that road surface. */
    readonly roadId?: string;
}

interface PcgNavigationEdge {
    readonly id: string;
    readonly from: string;
    readonly to: string;
    readonly kind: string;
    readonly cost: number;
    readonly traversable: boolean;
    /** Whether this edge belongs to an accessibility-compliant route. */
    readonly accessible?: boolean;
}

interface PcgTile {
    readonly x: number;
    readonly z: number;
    readonly floor: number;
    readonly kind: 'floor' | 'wall' | 'door' | 'stair' | 'empty';
    readonly rotationY: number;
    readonly walkable: boolean;
    readonly id: string;
}

/** Order-independent collection of world-space splines. */
interface PcgSplineNetwork {
    readonly kind: 'spline-network';
    readonly splines: readonly PcgSplineData[];
    /** Shared connectivity. Absent networks keep X/Z coincidence as the planner's junction rule. */
    readonly connections?: readonly {
        readonly id: string;
        readonly kind: 'at-grade' | 'unconnected';
        readonly arms: readonly {
            readonly roadId: string;
            readonly station: number;
        }[];
    }[];
}

/** World-space polyline product. Cells clip this; the streamer does not. */
interface PcgSplineData {
    readonly kind: 'spline';
    readonly id: string;
    readonly points: readonly PcgSplinePoint[];
    readonly closed?: boolean;
    /** City street half-width. Omitted paths use the caller half-width. */
    readonly halfWidth?: number;
    /** Terrain grading fade width beyond the carriageway, in metres. Omitted paths use the grading node's default. */
    readonly shoulderWidth?: number;
    /** City street wearing surface. Omitted streets stay asphalt. */
    readonly surface?: CityStreetSurface;
    /** Original road id when this spline is a clipped fragment. */
    readonly sourceId?: string;
    readonly zones?: readonly {
        readonly roadId: string;
        readonly fromStation: number;
        readonly toStation: number;
        readonly halfWidth?: number;
        readonly shoulderWidth?: number;
        readonly sidewalkWidth?: number;
        readonly surface?: CityStreetSurface;
    }[];
}

/** Planar authored spline vertex. */
interface PcgSplinePoint {
    readonly x: number;
    readonly z: number;
    readonly height: number;
    /** Original planar station when this vertex is a clipped fragment. */
    readonly station?: number;
    readonly surface?: CityStreetSurface;
    readonly halfWidth?: number;
    readonly depth?: number;
    readonly velocity?: number;
}

type CityStreetSurface = 'asphalt' | 'brick' | 'pavers';

/** Default surfaces a PCG layer surface can use. */
type PcgLayerSurfaceSlot = Exclude<WanakaDefaultSurfaceSlot, (typeof UNBAKED_DEFAULT_SURFACE_SLOTS)[number]>;

/**
 * Tileable surface vocabulary the platform answers with a published catalog PBR
 * material when the brief names what a place is made of but not how it looks.
 *
 * Roads, floors, ground, walls, and ramps stay project geometry; a surface only
 * dresses geometry that already exists. One slot carries several looks so a
 * repeated surface does not read as one texture stamped everywhere.
 * Authoring resolves a slot and placement into a concrete look. Runtime code
 * consumes the authored look without selecting from the slot catalog.
 */
type WanakaDefaultSurfaceSlot = "surface-grass" | "surface-dirt" | "surface-sand" | "surface-snow" | "surface-forest" | "surface-rock" | "surface-asphalt" | "surface-concrete" | "surface-cobble" | "surface-brick" | "surface-wood" | "surface-wood-floor" | "surface-metal" | "surface-tile" | "surface-carpet" | "surface-roof" | "surface-plaster" | "surface-wallpaper" | "surface-fabric" | "surface-ice";

/** Default surfaces PCG layers cannot render yet. */
declare const UNBAKED_DEFAULT_SURFACE_SLOTS: readonly [
    'surface-sand'
];

declare const WANAKA_DEFAULT_SURFACE_SLOTS: readonly [
    'surface-grass',
    'surface-dirt',
    'surface-sand',
    'surface-snow',
    'surface-forest',
    'surface-rock',
    'surface-asphalt',
    'surface-concrete',
    'surface-cobble',
    'surface-brick',
    'surface-wood',
    'surface-wood-floor',
    'surface-metal',
    'surface-tile',
    'surface-carpet',
    'surface-roof',
    'surface-plaster',
    'surface-wallpaper',
    'surface-fabric',
    'surface-ice'
];

export type PcgPlanOutputKind = 'points' | 'splines' | 'polygons' | 'volumes';

export interface PcgRaceCourseSemanticDefinition {
    readonly kind: 'raceCourse';
    readonly source: string;
    readonly closed: boolean;
    readonly checkpointSpacing: number;
    readonly startGrid?: {
        readonly rows: number;
        readonly columns: number;
        readonly rowSpacing: number;
        readonly columnSpacing: number;
    };
}

export interface PcgPlanSemanticDefinitions {
    readonly course?: PcgRaceCourseSemanticDefinition;
    /** Names of river spline and lake polygon outputs compiled as canonical water features. */
    readonly hydrology?: {
        readonly outputs: readonly string[];
    };
}

export interface PcgPlanPointOutput<TRole extends string = string> {
    readonly kind: 'points';
    readonly role?: TRole;
    readonly asset?: string;
    readonly present?: PcgLayerPointPresent;
}

export interface PcgPlanSplineOutput<TRole extends string = string> {
    readonly kind: 'splines';
    /** Overrides road/path defaults; false leaves ground scatter unreserved. */
    readonly scatterExclusion?: boolean | PcgPlanSplineScatterExclusion;
    readonly present?: PcgLayerSplinePresent<TRole> | PcgPlanRiverPresent;
}

export interface PcgPlanPolygonOutput {
    readonly kind: 'polygons';
    /** Overrides paving defaults; true or options reserve even an unrendered polygon. */
    readonly scatterExclusion?: boolean | PcgPlanScatterExclusion;
    readonly present?: PcgLayerPolygonPresent | PcgPlanLakePresent;
}

export interface PcgPlanVolumeOutput {
    readonly kind: 'volumes';
    readonly present?: PcgLayerVolumePresent;
}

export type PcgPlanOutputDefinition = PcgPlanPointOutput | PcgPlanSplineOutput | PcgPlanPolygonOutput | PcgPlanVolumeOutput;

export type PcgPlanOutputValue<TDefinition extends PcgPlanOutputDefinition> = TDefinition extends PcgPlanPointOutput ? PcgPointData : TDefinition extends PcgPlanSplineOutput ? PcgSplineNetwork : TDefinition extends PcgPlanPolygonOutput ? readonly PcgPolygon2D[] : TDefinition extends PcgPlanVolumeOutput ? PcgVolumeSet : never;

export type PcgPlanOutputValues<TOutputs extends Readonly<Record<string, PcgPlanOutputDefinition>>> = Readonly<{
    [TName in keyof TOutputs]: PcgPlanOutputValue<TOutputs[TName]>;
}>;

/** Region passed to one Plan invocation. */
export interface PcgPlanRegion {
    readonly id: string;
    readonly x: number;
    readonly z: number;
    readonly size: number;
    readonly bounds: PcgBounds2;
}

export interface PcgPlanContext<TParams> {
    readonly region: PcgPlanRegion;
    readonly seed: string | number;
    readonly params: Readonly<TParams>;
}

/** Hard limits applied before a Plan region is serialized or cached. */
export interface PcgPlanBudget {
    readonly maxBytes?: number;
    readonly maxPoints?: number;
    readonly maxSplineVertices?: number;
    readonly maxPolygonVertices?: number;
    readonly maxVolumes?: number;
    readonly maxCpuMs?: number;
}

export interface PcgPlanDefinition<TOutputs extends Readonly<Record<string, PcgPlanOutputDefinition>>, TParams> {
    readonly id: string;
    readonly version: number;
    readonly outputs: TOutputs;
    readonly semantics?: PcgPlanSemanticDefinitions;
    readonly params: TParams;
    readonly budget?: PcgPlanBudget;
    readonly plan: (context: PcgPlanContext<TParams>) => PcgPlanOutputValues<TOutputs>;
}

/** A serializable reference to one declared Plan output. */
export interface PcgPlanOutputReference<TKind extends PcgPlanOutputKind = PcgPlanOutputKind> {
    readonly [pcgPlanOutputReferenceBrand]: true;
    readonly planId: string;
    readonly planVersion: number;
    readonly output: string;
    readonly kind: TKind;
}

/** Opaque Plan handle collected into the project Worker by the compiler. */
export type PcgDefinedPlan<TOutputs extends Readonly<Record<string, PcgPlanOutputDefinition>> = Readonly<Record<string, PcgPlanOutputDefinition>>, TParams = unknown> = Readonly<{
    readonly [pcgDefinedPlanBrand]: true;
    readonly id: string;
    readonly version: number;
    readonly outputs: TOutputs;
    readonly semantics?: PcgPlanSemanticDefinitions;
    readonly params: TParams;
    readonly budget?: PcgPlanBudget;
}> & PcgPlanOutputReferences<TOutputs>;

/** Defines a pure, macro-region Plan whose outputs can be queried by layers. */
export function definePcgPlan<const TOutputs extends Readonly<Record<string, PcgPlanOutputDefinition>>, TParams>(definition: PcgPlanDefinition<TOutputs, TParams>): PcgDefinedPlan<TOutputs, TParams>;

/** River carved into the Base terrain along each spline, flowing from its first point to its last. */
interface PcgPlanRiverPresent {
    readonly as: 'river';
    /** Water width in metres. */
    readonly width: number;
    /** Water depth in metres below the river surface. */
    readonly depth: number;
    /** Flow speed in metres per second; defaults to 0.8. */
    readonly velocity?: number;
    /**
     * `'terrain'` settles the surface just below the terrain along the flow and ignores point
     * heights. Omitted, each point `height` is the water surface in world metres and must not rise
     * along the spline.
     */
    readonly surface?: 'terrain';
}

/** Ground scatter reservation independent of whether an output is rendered. */
interface PcgPlanScatterExclusion {
    /** Extra clearance in metres outside the geometry. Defaults to zero. */
    readonly margin?: number;
}

/** A spline corridor used to reserve ground scatter space. */
interface PcgPlanSplineScatterExclusion extends PcgPlanScatterExclusion {
    /** Fallback full width in metres when spline points declare no width. */
    readonly width?: number;
}

/** Lake filling each polygon; the surface sits at the lowest terrain point of its shore. */
interface PcgPlanLakePresent {
    readonly as: 'lake';
    /** Water depth in metres below the lake surface. */
    readonly depth: number;
}

declare const pcgDefinedPlanBrand: unique symbol;

declare const pcgPlanOutputReferenceBrand: unique symbol;

type PcgPlanOutputReferences<TOutputs extends Readonly<Record<string, PcgPlanOutputDefinition>>> = string extends keyof TOutputs ? Readonly<Record<never, never>> : Readonly<{
    [TName in keyof TOutputs & string]: PcgPlanOutputReference<TOutputs[TName]['kind']>;
}>;

/** Public, serializable shape of one node in a Field expression. */
export interface PcgFieldNode {
    readonly kind: string;
    readonly params: Readonly<Record<string, unknown>>;
    readonly children?: readonly PcgFieldNode[];
}

/** A scalar height expression evaluated in world X/Z space. */
export interface PcgHeightField extends PcgFieldEnvelope {
    readonly __wanakaPcgField: 'height';
}

/** A boolean expression evaluated against a world surface sample. */
export interface PcgPredicateField extends PcgFieldEnvelope {
    readonly __wanakaPcgField: 'predicate';
}

export type PcgField = PcgHeightField | PcgPredicateField;

/** Agent-facing scalar and predicate Field constructors. */
export const fields: PcgFields;

interface PcgFieldEnvelope {
    readonly kind: string;
    readonly serializable: boolean;
    readonly version?: string;
    readonly params: Readonly<Record<string, unknown>>;
    readonly children?: readonly PcgFieldNode[];
}

interface PcgFields {
    fbm(options: PcgFbmFieldOptions): PcgHeightField;
    ridged(options: PcgRidgedFieldOptions): PcgHeightField;
    constant(heightMeters: number): PcgHeightField;
    radial(options: PcgRadialFieldOptions): PcgHeightField;
    radial(source: PcgHeightField, options: PcgRadialFieldOptions): PcgHeightField;
    plateau(options: PcgPlateauFieldOptions): PcgHeightField;
    plateau(source: PcgHeightField, options: PcgPlateauFieldOptions): PcgHeightField;
    crater(options: PcgCraterFieldOptions): PcgHeightField;
    ravine(options: PcgRavineFieldOptions): PcgHeightField;
    add(...fields: readonly PcgHeightField[]): PcgHeightField;
    max(...fields: readonly PcgHeightField[]): PcgHeightField;
    scale(field: PcgHeightField, factor: number): PcgHeightField;
    clamp(field: PcgHeightField, minimumMeters: number, maximumMeters: number): PcgHeightField;
    translate(field: PcgHeightField, offset: {
        readonly x: number;
        readonly z: number;
    }): PcgHeightField;
    blend(base: PcgHeightField, overlay: PcgHeightField, weight: number): PcgHeightField;
    blend(base: PcgHeightField, overlay: PcgHeightField, options: PcgRegionBlendFieldOptions): PcgHeightField;
    slopeBelow(field: PcgHeightField, maximumNormalized: number): PcgPredicateField;
    above(field: PcgHeightField, minimumMeters: number): PcgPredicateField;
    below(field: PcgHeightField, maximumMeters: number): PcgPredicateField;
    and(...fields: readonly PcgPredicateField[]): PcgPredicateField;
    or(...fields: readonly PcgPredicateField[]): PcgPredicateField;
    not(field: PcgPredicateField): PcgPredicateField;
    custom(sample: (x: number, z: number) => number, options: {
        readonly version: string;
    }): PcgHeightField;
    customPredicate(test: (context: PcgPredicateContext) => boolean, options: {
        readonly version: string;
    }): PcgPredicateField;
    distanceTo(reference: PcgPlanOutputReference): PcgHeightField;
    insidePolygons(reference: PcgPlanOutputReference): PcgPredicateField;
}

interface PcgFbmFieldOptions {
    readonly seed?: string | number;
    readonly amplitudeMeters: number;
    readonly featureSizeMeters: number;
    readonly octaves?: number;
    readonly baseHeightMeters?: number;
}

type PcgRidgedFieldOptions = PcgFbmFieldOptions;

interface PcgRadialFieldOptions {
    readonly center: {
        readonly x: number;
        readonly z: number;
    };
    readonly radiusMeters: number;
    readonly heightMeters?: number;
    readonly power?: number;
}

interface PcgPlateauFieldOptions {
    readonly center: {
        readonly x: number;
        readonly z: number;
    };
    readonly radiusMeters: number;
    readonly heightMeters: number;
    readonly blendMeters?: number;
}

interface PcgCraterFieldOptions {
    readonly center: {
        readonly x: number;
        readonly z: number;
    };
    readonly radiusMeters: number;
    readonly depthMeters: number;
    readonly rimRadiusMeters?: number;
}

interface PcgRavineFieldOptions {
    readonly seed?: string | number;
    readonly axisDegrees?: number;
    readonly floorHeightMeters?: number;
    readonly floorHalfWidthMeters: number;
    readonly wallWidthMeters: number;
    readonly wallHeightMeters: number;
    readonly wanderAmplitudeMeters?: number;
    readonly wanderWavelengthMeters?: number;
    readonly detailAmplitudeMeters?: number;
    readonly detailWavelengthMeters?: number;
    readonly octaves?: number;
}

/** Region overlay with an outward transition into the base height field. */
interface PcgRegionBlendFieldOptions {
    readonly polygons: readonly PcgPolygon2D[];
    /**
     * Outward falloff in metres. The overlay has full weight inside each polygon;
     * outside, its weight smoothly falls to zero at this distance from an edge.
     * Zero makes a hard region boundary. This expands the affected area rather
     * than shrinking the fully applied region. Polygon holes also receive edge falloff.
     */
    readonly marginMeters: number;
}

interface PcgPredicateContext {
    readonly x: number;
    readonly z: number;
    readonly height: number;
    readonly slope: number;
}

export type PcgCustomSitePlanQuery = <TPlan extends PcgDefinedPlan, TOutput extends keyof TPlan['outputs'] & string>(plan: TPlan, output: TOutput | PcgPlanOutputReference) => PcgPlanOutputValue<TPlan['outputs'][TOutput]> | undefined;

/** Named output declarations accepted by a custom Site. */
export type PcgSiteOutputDefinitions = Readonly<Record<string, PcgLayerOutputDefinition>>;

export interface PcgSiteGeneratorOutput<TOutputs extends PcgSiteOutputDefinitions = PcgSiteOutputDefinitions> {
    readonly bounds: PcgBounds3;
    readonly enclosure: PcgBounds3;
    readonly entrances: readonly PcgCustomSiteEntrance[];
    readonly navigationPartition: {
        readonly id: string;
    };
    readonly surfaces: readonly PcgSiteSurfaceContract[];
    /** Typed values corresponding to the Site's declared output presenters. */
    readonly outputs?: PcgLayerOutputValues<TOutputs>;
}

export type PcgCustomSiteGenerator<TOutputs extends PcgSiteOutputDefinitions = PcgSiteOutputDefinitions> = (context: PcgCustomSiteGeneratorContext) => PcgSiteGeneratorOutput<TOutputs>;

interface PcgCustomSiteEntrance {
    readonly id: string;
    readonly aperture: PcgSiteLocalAperture;
    readonly traversal: PcgConnectionTraversal;
    /** Opens a terrain void on the Base when this entrance faces the Base. */
    readonly void?: boolean;
}

interface PcgSiteSurfaceContract {
    readonly id: string;
    readonly bounds: PcgBounds3;
    readonly height: number;
}

interface PcgCustomSiteGeneratorContext {
    readonly id: string;
    readonly seed: PcgWorldSeed;
    readonly placement: {
        readonly position: {
            readonly x: number;
            readonly y: number;
            readonly z: number;
        };
        readonly yaw?: number;
    };
    readonly bounds: PcgBounds3;
    readonly entrances: readonly PcgCustomSiteEntrance[];
    /** Reads a world-owned Plan in the Site's local coordinate frame. */
    readonly plan: PcgCustomSitePlanQuery;
}

interface PcgSiteLocalAperture {
    readonly center: {
        readonly x: number;
        readonly y: number;
        readonly z: number;
    };
    readonly halfExtents: {
        readonly x: number;
        readonly y: number;
        readonly z: number;
    };
    readonly yaw: number;
}

interface PcgBounds3 {
    readonly minX: number;
    readonly minY: number;
    readonly minZ: number;
    readonly maxX: number;
    readonly maxY: number;
    readonly maxZ: number;
}

type PcgConnectionTraversal = 'door' | 'passage' | 'stair' | 'slope' | 'shaft';

export type PcgKitRoleOverrides<TRoles extends readonly string[]> = Readonly<Partial<{
    [TRole in TRoles[number]]: string;
}>>;

/** Portable content-addressed catalog accepted by semantic role bindings. */
export interface PcgRoleKit extends PcgKitCatalog {
    readonly roleContract?: PcgRoleGenerator;
}

/** Immutable semantic role binding created by bindPcgKit. */
export interface PcgBoundKit<TGenerator extends PcgRoleGenerator = PcgRoleGenerator, TKit extends PcgRoleKit = PcgRoleKit> extends PcgBoundKitRecord<TGenerator, TKit> {
    readonly [pcgBoundKitBrand]: readonly [
        TGenerator,
        TKit
    ];
}

/** Binds semantic roles to assets and derives private aliases for their default implementations. */
export function bindPcgKit<const TGenerator extends PcgRoleGenerator, const TKit extends PcgRoleKit>(generator: TGenerator, kit: TKit, roles?: PcgKitRoleOverrides<TGenerator['roles']>): PcgBoundKit<TGenerator, TKit>;

declare const pcgBoundKitBrand: unique symbol;

interface PcgBoundKitRecord<TGenerator extends PcgRoleGenerator = PcgRoleGenerator, TKit extends PcgRoleKit = PcgRoleKit> {
    readonly generator: TGenerator;
    readonly kit: TKit;
    readonly kitIdentity: string;
    readonly roles: PcgKitRoleBinding<TGenerator['roles']>;
    readonly assetBindings: Readonly<Record<string, string>>;
    /** Default prop looks resolved while the authored kit is bound. */
    readonly defaultPropLooks: Readonly<Record<string, PcgDefaultPropLook>>;
    readonly defaultSurfaceCatalog: PcgLayerSurfaceCatalog;
}

interface PcgDefaultPropLook {
    readonly id: string;
    readonly assetUrl: string;
    readonly rotationDegrees: Readonly<{
        x: number;
        y: number;
        z: number;
    }>;
    readonly scale: number;
}

/** Portable kit contract. Domain-specific provenance fields may remain beside these fields. */
interface PcgKitCatalog {
    readonly id: string;
    readonly styleFamily: string;
    /** S3-backed Engine asset set used by Preview and Export materialization. */
    readonly assetSet?: string;
    readonly assets: readonly PcgKitAsset[];
    readonly surfaces?: Readonly<Record<string, Readonly<Record<string, unknown>>>>;
    readonly notice: string;
}

type PcgKitAsset = PcgModelKitAsset | PcgKitResourceAsset;

interface PcgModelKitAsset extends PcgKitAssetBase {
    readonly bounds: PcgKitBounds;
    readonly anchor: PcgKitAnchor;
    readonly lods?: readonly PcgModelKitLod[];
}

interface PcgKitResourceAsset extends PcgKitAssetBase {
    readonly bounds?: never;
    readonly anchor?: never;
    readonly lods?: never;
}

type PcgKitAnchor = 'base-center' | 'outer-corner' | 'authored';

interface PcgKitBounds {
    readonly min: readonly [
        number,
        number,
        number
    ];
    readonly max: readonly [
        number,
        number,
        number
    ];
}

interface PcgModelKitLod {
    readonly level: number;
    readonly filename: string;
    readonly sha256: string;
}

/** Pack-local model metadata shared by Preview, Export and ingest checks. */
interface PcgKitAssetBase {
    readonly [key: string]: unknown;
    readonly id: string;
    readonly name?: string;
    readonly kind?: string;
    readonly filename: string;
    readonly sha256: string;
    readonly tags?: readonly string[];
    readonly weight?: number;
    readonly materialRoles?: Readonly<Record<string, string>>;
}

type PcgLayerSurfaceCatalog = Readonly<Record<PcgLayerSurfaceSlot, WanakaDefaultSurface>>;

type WanakaDefaultSurface = {
    readonly slot: WanakaDefaultSurfaceSlot;
    readonly variants: readonly WanakaDefaultSurfaceVariant[];
};

type WanakaDefaultSurfaceVariant = {
    readonly assetId: string;
    /**
     * World-space edge length one texture tile covers, in the metre-scale units
     * the rest of the scene is built in: 2 spreads a single tile across two
     * metres of the mesh. This is the material's real-world size, taken from the
     * dimensions the source publishes for it, and it is not a density knob to
     * tune by eye. Where the source publishes no dimensions, use the size its
     * slot's other variants published: placement picks a variant by hashing
     * position, so two neighbouring meshes on the same slot land on different
     * variants, and a variant that disagrees on scale reads as a different
     * material rather than as variety.
     */
    readonly tileSizeUnits: number;
    readonly maps: WanakaDefaultSurfaceMaps;
};

/**
 * Resolved map URLs for one look. Base colour, normal, and roughness are the
 * floor every catalog material meets; metalness is bound only when the source
 * material ships it.
 *
 * Ambient occlusion and opacity are deliberately absent. `aoMap` and `alphaMap`
 * read a second UV channel that tiled project geometry does not carry, so
 * binding them costs a download per surface for no visible change.
 */
type WanakaDefaultSurfaceMaps = Pick<PbrTextureUrls, 'metalness'> & Required<Pick<PbrTextureUrls, 'baseColor' | 'normal' | 'roughness'>>;

/** Orthogonal point recipes shared by project layers and built-in presets. */
export const points: PcgPointPrimitives;

/** Constructors that remove raw spline product boilerplate from authored layers. */
export const splines: PcgSplinePrimitives;

/** Polygon constructors and derived paths. */
export const polygons: PcgPolygonPrimitives;

/** Typed mesh recipes; callers never author index or vertex buffers by hand. */
export const mesh: PcgMeshPrimitives;

interface PcgPointPrimitives {
    jitteredGrid(bounds: PcgBounds2, options: PcgJitteredGridOptions): PcgPointData;
    poisson(bounds: PcgBounds2, options: PcgPoissonOptions): PcgPointData;
    along(spline: PcgSplineData, options: PcgAlongOptions): PcgPointData;
    inside(source: PcgPointData, region: PcgPolygon2D | readonly PcgPolygon2D[]): PcgPointData;
    outside(source: PcgPointData, regions: readonly PcgPolygon2D[]): PcgPointData;
    near(source: PcgPointData, network: PcgSplineNetwork, distance: number): PcgPointData;
    within(source: PcgPointData, center: {
        readonly x: number;
        readonly z: number;
    }, radius: number): PcgPointData;
    filter(source: PcgPointData, keep: (point: PcgAuthorPoint, index: number) => boolean): PcgPointData;
    concat(...sets: readonly PcgPointData[]): PcgPointData;
    project(source: PcgPointData, world: PcgLayerWorld, options?: PcgProjectPointsOptions): PcgPointData;
}

interface PcgSplinePrimitives {
    create(id: string, vertices: readonly PcgSplinePoint[], options?: {
        readonly closed?: boolean;
        readonly sourceId?: string;
    }): PcgSplineData;
    network(...items: readonly PcgSplineData[]): PcgSplineNetwork;
    /** Nearest planar point, interpolated height and stable spline identity; null for an empty network. */
    nearest(source: PcgSplineNetwork, position: {
        readonly x: number;
        readonly z: number;
    }): PcgSplineNetworkSample | null;
    resample(source: PcgSplineData, options: PcgSplineTransformOptions): PcgSplineData;
    offset(source: PcgSplineData, distance: number, options: PcgSplineTransformOptions): PcgSplineData;
}

interface PcgPolygonPrimitives {
    /** Boundary and interior samples in metres; features smaller than spacing can be missed. */
    samples(polygon: PcgPolygon2D, spacing: number): readonly {
        readonly x: number;
        readonly z: number;
    }[];
    create(id: string, ring: PcgPolygon2D['ring'], holes?: PcgPolygon2D['holes']): PcgPolygon2D;
    boundary(polygon: PcgPolygon2D, id?: string): PcgSplineData;
    corridor(source: PcgSplineData, options: PcgCorridorOptions): PcgPolygon2D;
}

interface PcgMeshPrimitives {
    extrude(polygon: PcgPolygon2D, options?: PcgExtrudeOptions): PcgMeshBuffer;
    sweep(spline: PcgSplineData, options: PcgSweepOptions): PcgMeshBuffer;
}

interface PcgAuthorPoint {
    readonly x: number;
    readonly y: number;
    readonly z: number;
}

interface PcgProjectPointsOptions {
    readonly heightOffset?: number;
    readonly maximumSlope?: number;
    readonly mask?: PcgField;
}

interface PcgJitteredGridOptions {
    readonly seed: string | number;
    readonly channel: string;
    readonly spacing: number;
    readonly probability?: number;
    readonly keep?: (x: number, z: number) => boolean;
}

interface PcgPoissonOptions {
    readonly seed: string | number;
    readonly channel: string;
    readonly radius: number;
}

interface PcgSplineTransformOptions {
    readonly spacing: number;
    readonly id?: string;
}

interface PcgAlongOptions extends PcgSplineTransformOptions {
    readonly phase?: number;
    readonly heightOffset?: number;
    readonly includeStart?: boolean;
    readonly includeEnd?: boolean;
}

interface PcgCorridorOptions extends PcgSplineTransformOptions {
    readonly width: number;
}

/** Solid extruded from a polygon. `height` is vertical size, not the top elevation. */
interface PcgExtrudeOptions {
    /** Vertical size in metres. 0 (default) is a flat cap on `base`. */
    readonly height?: number;
    /** World Y of the bottom face. Default 0. */
    readonly base?: number;
    readonly uvOriginX?: number;
    readonly uvOriginZ?: number;
    readonly clipBounds?: PcgBounds2;
}

/** Closed cross-sections standing in the sweep frame. */
export const profiles: PcgProfilePrimitives;

/** Built-in closed cross-sections for `mesh.sweep`. */
interface PcgProfilePrimitives {
    wall(options: {
        readonly height: number;
        readonly thickness: number;
    }): PcgProfile;
    rail(options: {
        readonly width: number;
        readonly height: number;
        readonly centerHeight?: number;
    }): PcgProfile;
    pipe(options: {
        readonly radius: number;
        readonly segments?: number;
    }): PcgProfile;
}

/** Cross-section swept along a spline. Closed profiles join the last point to the first. */
interface PcgProfile {
    readonly points: readonly PcgProfilePoint[];
    readonly closed?: boolean;
}

/** Cross-section point in the sweep frame. */
interface PcgProfilePoint {
    /** Metres to the right of travel. */
    readonly x: number;
    /** Metres up from the path. */
    readonly y: number;
}

/** Nearest spline in a network plus that spline's X/Z projection. */
interface PcgSplineNetworkSample {
    readonly spline: PcgSplineData;
    readonly sample: PcgSplineSample;
}

/** Nearest X/Z projection onto a spline. `t` is the parameter of that segment. */
interface PcgSplineSample {
    readonly segmentIndex: number;
    readonly t: number;
    readonly distance: number;
    readonly signedDistance: number;
    readonly height: number;
}

/** Options for `mesh.sweep`. */
interface PcgSweepOptions {
    readonly profile: PcgProfile;
    readonly spacing: number;
    readonly id?: string;
    /** Cap the open ends. Default true for a closed profile on an open spline. */
    readonly caps?: boolean;
}

export interface PcgStructureOptions {
    readonly id: string;
    readonly seed: string | number;
    readonly bounds: PcgBounds2;
    readonly tileSize?: number;
    readonly rooms?: number;
    readonly floors?: number;
    readonly kit?: string;
}

export interface PcgStructureProduct {
    readonly tiles: PcgTileGrid;
    readonly collision: PcgVolumeSet;
    readonly rooms: number;
}

/** The contract fragment shared by a generated custom Site and its presenter. */
export interface PcgStructureContractFragment {
    readonly bounds: PcgBounds3;
    readonly enclosure: PcgBounds3;
    readonly entrances: readonly PcgCustomSiteEntrance[];
    readonly navigationPartition: {
        readonly id: string;
    };
    readonly surfaces: readonly PcgSiteSurfaceContract[];
}

export type PcgStructureOutputValue = PcgMeshBuffer | PcgPointData | readonly PcgPolygon2D[] | PcgTileGrid | PcgVolumeSet;

export type PcgStructureOutputValues = Readonly<Record<string, PcgStructureOutputValue>>;

/** A pure, typed result that can be spread into a custom Site generator output. */
export interface PcgStructurePrimitiveProduct<TOutputs extends PcgStructureOutputValues = PcgStructureOutputValues> {
    readonly contract: PcgStructureContractFragment;
    readonly outputs: TOutputs;
}

export interface PcgStructureShapeOptions {
    readonly id: string;
    readonly bounds?: PcgBounds2;
    readonly polygon?: PcgPolygon2D;
    readonly shape?: PcgBounds2 | PcgPolygon2D;
    readonly base?: number;
    readonly baseY?: number;
    readonly height?: number;
    readonly heightMeters?: number;
}

export interface PcgStructureSplitOptions extends PcgStructureShapeOptions {
    readonly axis?: 'x' | 'z';
    readonly count?: number;
    readonly parts?: number;
    readonly gapMeters?: number;
}

export interface PcgStructureRepeatOptions extends PcgStructureShapeOptions {
    readonly axis?: 'x' | 'z';
    readonly count?: number;
    readonly repeats?: number;
    readonly spacingMeters?: number;
    readonly gapMeters?: number;
}

export interface PcgStructureExtrudeOptions extends PcgStructureShapeOptions {
    readonly clipBounds?: PcgBounds2;
}

export type PcgStructureFacadeSide = 'north' | 'south' | 'east' | 'west';

export interface PcgStructureFacadeEntranceOptions {
    readonly id?: string;
    readonly side?: PcgStructureFacadeSide;
    readonly floor?: number;
    readonly bay?: number;
    readonly widthMeters?: number;
    readonly width?: number;
    readonly heightMeters?: number;
    readonly height?: number;
    readonly depthMeters?: number;
    readonly traversal?: PcgCustomSiteEntrance['traversal'];
    readonly void?: boolean;
}

export interface PcgStructureFacadeOptions extends PcgStructureShapeOptions {
    readonly floorCount?: number;
    readonly floors?: number;
    readonly floorHeightMeters?: number;
    readonly bayCount?: number;
    readonly bays?: number;
    readonly bayWidthMeters?: number;
    readonly wallDepthMeters?: number;
    readonly entrance?: false | PcgStructureFacadeEntranceOptions;
}

export interface PcgStructureSplitProduct extends PcgStructurePrimitiveProduct<{
    readonly parts: readonly PcgPolygon2D[];
    readonly floorPolygons: readonly PcgPolygon2D[];
    readonly dividers: PcgVolumeSet;
}> {
    readonly parts: readonly PcgPolygon2D[];
    readonly partitions: readonly PcgPolygon2D[];
}

export interface PcgStructureRepeatProduct extends PcgStructurePrimitiveProduct<{
    readonly instances: readonly PcgPolygon2D[];
    readonly polygons: readonly PcgPolygon2D[];
    readonly centers: PcgPointData;
}> {
    readonly instances: readonly PcgPolygon2D[];
    readonly polygons: readonly PcgPolygon2D[];
    readonly centers: PcgPointData;
}

export interface PcgStructureExtrudeProduct extends PcgStructurePrimitiveProduct<{
    readonly mesh: PcgMeshBuffer;
    readonly collision: PcgVolumeSet;
    readonly volumes: PcgVolumeSet;
}> {
    readonly mesh: PcgMeshBuffer;
    readonly collision: PcgVolumeSet;
}

export interface PcgStructureFacadePanel {
    readonly id: string;
    readonly side: PcgStructureFacadeSide;
    readonly floor: number;
    readonly bay: number;
    readonly bounds: PcgBounds3;
}

export interface PcgStructureFacadeProduct extends PcgStructurePrimitiveProduct<{
    readonly walls: PcgMeshBuffer;
    readonly collision: PcgVolumeSet;
    readonly openings: readonly PcgPolygon2D[];
}> {
    readonly walls: PcgMeshBuffer;
    readonly collision: PcgVolumeSet;
    readonly panels: readonly PcgStructureFacadePanel[];
    readonly openings: readonly PcgPolygon2D[];
}

export const structures: {
    readonly dungeonRooms: (options: PcgStructureOptions) => PcgStructureProduct;
    readonly arena: (options: PcgStructureOptions) => PcgStructureProduct;
    readonly warehouseInterior: (options: PcgStructureOptions) => PcgStructureProduct;
    readonly groundFloor: (options: Omit<PcgStructureOptions, 'floors'>) => PcgStructureProduct;
    readonly split: (options: PcgStructureSplitOptions) => PcgStructureSplitProduct;
    readonly repeat: (options: PcgStructureRepeatOptions) => PcgStructureRepeatProduct;
    readonly extrude: (options: PcgStructureExtrudeOptions) => PcgStructureExtrudeProduct;
    readonly facade: (options: PcgStructureFacadeOptions) => PcgStructureFacadeProduct;
};

/** Named environment choices consumed by the shared scene lease host. */
export type PcgEnvironment = 'none' | 'temperate' | 'arid' | 'arctic';

/** Default material slots that can be used by a composable Terrain Base. */
export type PcgSurfaceSlot = WanakaDefaultSurfaceSlot;

export interface PcgSurfacePalette {
    readonly base: PcgSurfaceSlot;
    readonly steep?: PcgSurfaceSlot;
    readonly high?: PcgSurfaceSlot;
    readonly snowLineMeters?: number;
}

/** Named environment choices exposed to the authoring surface. */
export interface PcgEnvironmentCatalog {
    readonly none: PcgEnvironment;
    readonly temperate: PcgEnvironment;
    readonly arid: PcgEnvironment;
    readonly arctic: PcgEnvironment;
}

export interface PcgTerrainBaseWaterOptions {
    /** Independent optical profile; bind it before World attachment. Defaults to water/ocean. */
    readonly opticalProfileId?: string;
    readonly seaLevelMeters: number;
    readonly seabedReliefMeters?: number;
    readonly seed?: string | number;
}

export interface PcgTerrainBaseOptions {
    readonly urbanization?: PcgUrbanization;
    readonly height: PcgHeightField;
    readonly surface?: PcgSurfacePalette | PcgSurfaceSlot;
    readonly environment?: PcgEnvironment;
    readonly water?: PcgTerrainBaseWaterOptions;
    readonly cellSizeMeters?: number;
    readonly resolution?: number;
    readonly featureSizeMeters?: number;
    readonly streaming?: 'near' | 'standard' | 'far';
}

export interface PcgFlatBaseOptions extends Omit<PcgTerrainBaseOptions, 'height'> {
    readonly y?: number;
}

export interface PcgBasePresetOptions<TPreset extends PcgWorldPreset<string, PcgBaseWorldDomain>> {
    readonly urbanization?: PcgUrbanization;
    readonly overrides?: Readonly<PcgWorldPresetOverrides<TPreset> & {
        readonly layers?: PcgPresetLayerOverrides<TPreset['id']>;
    }>;
}

/** A Base value passed to `definePcgWorld`; the runtime preset remains opaque. */
export interface PcgBaseDefinition<TPreset extends PcgWorldPreset<string, PcgBaseWorldDomain> = PcgWorldPreset<string, PcgBaseWorldDomain>> {
    readonly preset: TPreset;
    readonly urbanization?: PcgUrbanization;
    readonly overrides?: PcgBasePresetOptions<TPreset>['overrides'];
}

/** Surface helpers exposed to Agent-authored Terrain Bases. */
export interface PcgSurfaceCatalog {
    readonly palette: (input: PcgSurfacePalette) => PcgSurfacePalette;
}

/** Base constructors exposed to the ordinary PCG authoring surface. */
export interface PcgBaseCatalog {
    readonly preset: <TPreset extends PcgWorldPreset<string, PcgBaseWorldDomain>>(preset: TPreset, options?: PcgBasePresetOptions<TPreset>) => PcgBaseDefinition<TPreset>;
    readonly terrain: (options: PcgTerrainBaseOptions) => PcgBaseDefinition<PcgWorldPreset<string, 'terrain', PcgTerrainWorldOverrides>>;
    readonly flat: (options?: PcgFlatBaseOptions) => PcgBaseDefinition<PcgWorldPreset<string, 'terrain', PcgTerrainWorldOverrides>>;
}

/** Named environment choices. Values are immutable and safe to share between worlds. */
export const environments: PcgEnvironmentCatalog;

/** Creates a validated, serializable surface palette. */
export const surfaces: PcgSurfaceCatalog;

export const bases: PcgBaseCatalog;

/** Domains that may be the root of a Composite World. Sites and Habitats nest inside one. */
type PcgBaseWorldDomain = 'nature' | 'terrain';

type PcgPresetLayerOverrides<TPresetId extends string> = TPresetId extends keyof PcgPresetLayerOverrideMap ? PcgPresetLayerOverrideMap[TPresetId] : {
    readonly [key: string]: never;
};

interface PcgPresetLayerOverrideMap {
    readonly 'temperate-nature': {
        readonly roads?: false | PcgRoadLayer;
        readonly broadleafTrees?: false | PcgTreeLayer;
        readonly groundCover?: false | PcgCoverLayer;
        readonly fieldTrees?: false | PcgTreeLayer;
    };
    readonly 'rock-forest': {
        readonly roads?: false | PcgRoadLayer;
        readonly broadleafTrees?: false | PcgTreeLayer;
        readonly groundCover?: false | PcgCoverLayer;
        readonly rocks?: false | PcgRockLayer;
    };
    readonly 'off-world': {
        readonly roads?: false | PcgRoadLayer;
        readonly rocks?: false | PcgRockLayer;
    };
    readonly 'temperate-village': {
        readonly roads?: false | PcgRoadLayer;
        readonly broadleafTrees?: false | PcgTreeLayer;
        readonly groundCover?: false | PcgCoverLayer;
        readonly buildings?: false | PcgBuildingLayer;
    };
    readonly 'nature-city': {
        readonly roads?: false | PcgRoadLayer;
        readonly broadleafTrees?: false | PcgTreeLayer;
        readonly groundCover?: false | PcgCoverLayer;
        readonly buildings?: false | PcgBuildingLayer;
    };
}

type PcgTreeLayer = PcgDefinedLayer<{
    readonly instances: PcgLayerPointOutput;
}>;

type PcgRoadLayer = PcgDefinedLayer<{
    readonly road: PcgLayerMeshOutput;
}>;

type PcgCoverLayer = PcgDefinedLayer<{
    readonly cover: PcgLayerPointOutput;
}>;

type PcgRockLayer = PcgDefinedLayer<{
    readonly rocks: PcgLayerPointOutput;
}>;

type PcgBuildingLayer = PcgDefinedLayer<{
    readonly buildings: PcgLayerPointOutput;
}>;

export type PcgWorldSeed = string | number;

export type PcgWorldDomain = 'nature' | 'terrain' | 'village' | 'city' | 'building' | 'dungeon' | 'cave' | 'underwater';

/** Agent-facing preset identity. Runtime pipeline and presentation policy stay opaque. */
export interface PcgWorldPreset<TId extends string = string, TDomain extends PcgWorldDomain = PcgWorldDomain, TOverrides extends object = PcgWorldOverridesForDomain<TDomain>> extends PcgWorldPresetOverrideCarrier<TOverrides> {
    readonly id: TId;
    readonly domain: TDomain;
    readonly styleFamily: string;
}

export type PcgWorldPresetOverrides<TPreset extends PcgWorldPreset> = NonNullable<TPreset[typeof pcgWorldPresetOverrides]>;

export type { PcgTerrainWorldOverrides };

export interface PcgWorldDefinition<TPreset extends PcgWorldPreset = PcgWorldPreset> {
    readonly urbanization?: PcgUrbanization;
    readonly schema: 'wanaka-pcg-world@1';
    readonly preset: TPreset;
    readonly seed: PcgWorldSeed;
    readonly overrides: Readonly<PcgWorldPresetOverrides<TPreset>>;
    readonly layers: readonly PcgDefinedLayer[];
    readonly hydrology?: {
        readonly prefetchRegions: readonly {
            readonly level: number;
            readonly x: number;
            readonly z: number;
        }[];
    };
}

/** Opaque type carrier; it adds no runtime data or author-visible property name. */
interface PcgWorldPresetOverrideCarrier<TOverrides extends object> {
    readonly [pcgWorldPresetOverrides]?: TOverrides;
}

declare const pcgWorldPresetOverrides: unique symbol;

type PcgWorldOverridesForDomain<TDomain extends PcgWorldDomain> = TDomain extends 'nature' ? PcgNatureWorldOverrides | PcgOffWorldWorldOverrides : TDomain extends 'terrain' ? PcgTerrainWorldOverrides : TDomain extends 'village' ? PcgVillageWorldOverrides : TDomain extends 'city' ? PcgCityWorldOverrides : TDomain extends 'building' ? PcgBuildingWorldOverrides : TDomain extends 'dungeon' ? PcgDungeonWorldOverrides : TDomain extends 'cave' ? PcgCaveWorldOverrides : PcgUnderwaterWorldOverrides;

interface PcgNatureWorldOverrides {
    readonly terrain?: PcgNatureTerrainOverrides;
    readonly nature?: PcgNatureOverrides;
}

interface PcgOffWorldWorldOverrides {
    readonly terrain?: PcgTerrainOverrides;
    readonly nature?: Pick<PcgNatureOverrides, 'density' | 'spacing'>;
    readonly offWorld?: PcgOffWorldOverrides;
}

interface PcgVillageWorldOverrides extends PcgNatureWorldOverrides {
    readonly village?: PcgVillageOverrides;
}

interface PcgCityWorldOverrides {
    readonly city?: PcgCityOverrides;
}

interface PcgBuildingWorldOverrides {
    readonly building?: PcgBuildingOverrides;
}

interface PcgDungeonWorldOverrides {
    readonly dungeon?: PcgDungeonOverrides;
}

interface PcgCaveWorldOverrides {
    readonly cave?: PcgCaveOverrides;
}

interface PcgUnderwaterWorldOverrides {
    readonly underwater?: PcgUnderwaterOverrides;
}

/** Public override group for a composable Terrain Base. */
interface PcgTerrainWorldOverrides {
    readonly terrain?: PcgTerrainOverrides;
}

interface PcgTerrainOverrides {
    /** Vertical terrain relief scale in world metres; presets retain their elevation datum. */
    readonly reliefMeters?: number;
    /** Horizontal size of the dominant terrain features in world metres. */
    readonly featureSizeMeters?: number;
}

interface PcgNatureTerrainOverrides extends PcgTerrainOverrides {
    /**
     * Turns the Base into a coast: sea beyond the shoreline, the preset terrain inland.
     * Supported by `presets.temperateNature`. The sea surface sits at 2 m at the
     * preset relief and moves with `reliefMeters`; read it from the water queries
     * instead of hard-coding it.
     */
    readonly coast?: PcgTerrainCoastOverride;
}

interface PcgNatureOverrides {
    /**
     * Vegetation density from 0 to 1; values above 1 are rejected. Preset defaults:
     * `temperateNature` 0.72, `rockForest` 0.48. It scales the preset's density
     * field, so clearings where that field is zero stay open at any value.
     */
    readonly density?: number;
    /**
     * Tree pitch in metres. Preset defaults: `temperateNature` 8, `rockForest` 10.
     * Tree count grows with (default / spacing)²: 4 m on `temperateNature` draws
     * four times the trees, and generation and draw time grow with it.
     */
    readonly spacing?: number;
}

interface PcgOffWorldOverrides {
    readonly time?: 'day' | 'night';
    /** Width of the authored off-world road in world metres. */
    readonly roadWidthMeters?: number;
    /** Fraction of the off-world roadside rubble density in the range 0..1. */
    readonly rubbleDensityNormalized?: number;
}

interface PcgVillageOverrides {
    readonly density?: number;
    readonly targetBuildings?: number;
    readonly regionSize?: number;
}

interface PcgCityOverrides {
    readonly blockSize?: number;
    readonly streetHalfWidth?: number;
}

interface PcgBuildingOverrides {
    readonly storeys?: number;
    readonly width?: number;
    readonly depth?: number;
    readonly archetype?: 'residence' | 'apartment' | 'hotel' | 'office' | 'hospital' | 'mall' | 'school';
}

interface PcgDungeonOverrides {
    /** Number of rooms generated in the bounded dungeon. */
    readonly roomCount?: number;
    readonly theme?: 'fortress' | 'crypt' | 'cistern' | 'ruins';
}

interface PcgCaveOverrides {
    /** Horizontal cave radius in world metres. */
    readonly radiusMeters?: number;
    /** Number of authored chambers in a bounded cave plan. */
    readonly chamberCount?: number;
    /** Passage width in world metres. */
    readonly passageWidthMeters?: number;
}

interface PcgUnderwaterOverrides {
    /** Seabed relief in metres, applied to the Base ocean body under this Habitat. */
    readonly reliefMeters?: number;
    readonly coralDensity?: number;
    readonly kelpDensity?: number;
    readonly detailDensity?: number;
    readonly faunaDensity?: number;
    readonly wreckFrequency?: number;
    readonly waterClarity?: number;
    readonly currentHeading?: number;
    readonly currentStrength?: number;
    readonly baseDepth?: number;
    readonly abyssDepth?: number;
}

/**
 * Shoreline of the Base sea. Land stays on the opposite side of `seaward`.
 * The generated waterline meanders up to 140 m to either side of the straight
 * line through `through` (perpendicular to `seaward`), and inland ground below
 * sea level floods too. Find the actual waterline with
 * `attachment.water.nearestShore` rather than assuming it.
 */
interface PcgTerrainCoastOverride {
    /** World point on the coast's centre line. */
    readonly through: {
        readonly x: number;
        readonly z: number;
    };
    /** Horizontal direction from the shoreline toward open sea; need not be normalized. */
    readonly seaward: {
        readonly x: number;
        readonly z: number;
    };
    /** Opts into a deterministic, streamed two-lane coastal road. */
    readonly road?: boolean;
}

/** Base-owned development source. Constant creates an endless settlement; procedural follows terrain. */
export type PcgUrbanization = {
    readonly mode: 'constant';
    readonly class: PcgSettlementClass;
    readonly intensity: number;
} | {
    readonly mode: 'procedural';
    readonly frequency?: number;
    readonly bias?: number;
    readonly maxIntensity?: number;
};

type PcgSettlementClass = (typeof PCG_SETTLEMENT_CLASSES)[number];

declare const PCG_SETTLEMENT_CLASSES: readonly [
    'residential',
    'commercial',
    'industrial',
    'park',
    'rural'
];

/** Bounded surface generators composed into the Base terrain DAG. */
export const regions: PcgSemanticSurfaceRegionFactories;

/** Immutable semantic Site declarations. They allocate no runtime resources. */
export const sites: PcgSemanticSiteFactories;

/** Immutable aquatic Habitat declarations. They inherit Base cell residency at attachment time. */
export const habitats: PcgSemanticHabitatFactories;

interface PcgSemanticSurfaceRegionFactories {
    rockMountain<const TPreset extends PcgWorldPreset<'rock-forest', 'nature', PcgNatureWorldOverrides>>(input: Omit<PcgRockMountainRegionDeclaration<TPreset>, 'kind'>): PcgRockMountainRegionDeclaration<TPreset>;
    village<const TPreset extends PcgWorldPreset<string, 'village', PcgVillageWorldOverrides>>(input: Omit<PcgVillageRegionDeclaration<TPreset>, 'kind'>): PcgVillageRegionDeclaration<TPreset>;
    city<const TPreset extends PcgWorldPreset<string, 'city', PcgCityWorldOverrides>>(input: Omit<PcgCityRegionDeclaration<TPreset>, 'kind'>): PcgCityRegionDeclaration<TPreset>;
}

interface PcgSemanticSiteFactories {
    building<const TPreset extends PcgWorldPreset<string, 'building', PcgBuildingWorldOverrides>>(input: Omit<PcgBuildingSiteDeclaration<TPreset>, 'kind'>): PcgBuildingSiteDeclaration<TPreset>;
    cave<const TPreset extends PcgWorldPreset<string, 'cave', PcgCaveWorldOverrides>>(input: Omit<PcgCaveSiteDeclaration<TPreset>, 'kind'>): PcgCaveSiteDeclaration<TPreset>;
    dungeon<const TPreset extends PcgWorldPreset<string, 'dungeon', PcgDungeonWorldOverrides>>(input: PcgSemanticSiteInput<PcgDungeonSiteDeclaration<TPreset>>): PcgDungeonSiteDeclaration<TPreset>;
    custom<const TOutputs extends PcgSiteOutputDefinitions>(input: Omit<PcgCustomSiteDeclaration<TOutputs>, 'kind'>): PcgCustomSiteDeclaration<TOutputs>;
}

interface PcgSemanticHabitatFactories {
    coralReef(input: Omit<PcgCoralReefHabitatDeclaration, 'kind' | 'id'> & {
        readonly id?: string;
    }): PcgCoralReefHabitatDeclaration;
}

interface PcgBuildingSiteDeclaration<TPreset extends PcgWorldPreset<string, 'building', PcgBuildingWorldOverrides> = PcgWorldPreset<string, 'building', PcgBuildingWorldOverrides>> extends PcgSemanticSiteBase<TPreset> {
    readonly kind: 'building';
    readonly placement: PcgBuiltInSitePlacement | 'automatic';
}

interface PcgCaveSiteDeclaration<TPreset extends PcgWorldPreset<string, 'cave', PcgCaveWorldOverrides> = PcgWorldPreset<string, 'cave', PcgCaveWorldOverrides>> extends PcgSemanticSiteBase<TPreset> {
    readonly kind: 'cave';
    readonly placement: PcgBuiltInSitePlacement | 'automatic';
}

type PcgDungeonSiteDeclaration<TPreset extends PcgWorldPreset<string, 'dungeon', PcgDungeonWorldOverrides> = PcgWorldPreset<string, 'dungeon', PcgDungeonWorldOverrides>> = PcgSemanticSiteBase<TPreset> & ({
    readonly kind: 'dungeon';
    readonly placement: PcgBuiltInSitePlacement | 'automatic';
    readonly entrance?: never;
} | {
    readonly kind: 'dungeon';
    /** Semantic endpoint in the form `<building-id>/basement`. */
    readonly entrance: `${string}/basement`;
    readonly placement?: never;
});

interface PcgCustomSiteDeclaration<TOutputs extends PcgSiteOutputDefinitions = PcgSiteOutputDefinitions> {
    readonly kind: 'custom';
    readonly id: string;
    readonly placement: PcgExplicitSitePlacement | 'automatic';
    readonly bounds: PcgBounds3;
    readonly entrances: readonly PcgCustomSiteEntranceDeclaration[];
    /** Optional content-addressed kit used by custom spline/model presentations. */
    readonly kitBinding?: PcgBoundKit;
    readonly outputs?: TOutputs;
    readonly generator: PcgCustomSiteGenerator<TOutputs>;
    readonly seed?: PcgWorldSeed;
    readonly water?: PcgWorldSiteWaterDefinition;
}

type PcgSemanticSiteInput<TDeclaration> = TDeclaration extends unknown ? Omit<TDeclaration, 'kind'> : never;

interface PcgCoralReefHabitatDeclaration {
    readonly kind: 'coralReef';
    readonly id: string;
    readonly waterBody: string;
    readonly seed?: PcgWorldSeed;
    readonly overrides?: Readonly<PcgUnderwaterWorldOverrides>;
}

interface PcgRockMountainRegionDeclaration<TPreset extends PcgWorldPreset<'rock-forest', 'nature', PcgNatureWorldOverrides> = PcgWorldPreset<'rock-forest', 'nature', PcgNatureWorldOverrides>> extends PcgSemanticSurfaceRegionBase<TPreset> {
    readonly kind: 'rockMountain';
}

interface PcgVillageRegionDeclaration<TPreset extends PcgWorldPreset<string, 'village', PcgVillageWorldOverrides> = PcgWorldPreset<string, 'village', PcgVillageWorldOverrides>> extends PcgSemanticSurfaceRegionBase<TPreset> {
    readonly kind: 'village';
}

interface PcgCityRegionDeclaration<TPreset extends PcgWorldPreset<string, 'city', PcgCityWorldOverrides> = PcgWorldPreset<string, 'city', PcgCityWorldOverrides>> extends PcgSemanticSurfaceRegionBase<TPreset> {
    readonly kind: 'city';
}

interface PcgExplicitSitePlacement {
    readonly position: {
        readonly x: number;
        readonly y: number;
        readonly z: number;
    };
    readonly yaw?: number;
}

interface PcgBuiltInSitePlacement {
    readonly position: {
        readonly x: number;
        readonly y?: number;
        readonly z: number;
    };
    readonly yaw?: number;
}

interface PcgSemanticSiteBase<TPreset extends PcgWorldPreset> {
    readonly id: string;
    readonly preset: TPreset;
    readonly seed?: PcgWorldSeed;
    readonly overrides?: Readonly<PcgWorldPresetOverrides<TPreset>>;
    readonly water?: PcgWorldSiteWaterDefinition;
}

interface PcgCustomSiteEntranceDeclaration {
    readonly id: string;
    readonly aperture: {
        readonly center: {
            readonly x: number;
            readonly y: number;
            readonly z: number;
        };
        readonly halfExtents: {
            readonly x: number;
            readonly y: number;
            readonly z: number;
        };
        readonly yaw: number;
    };
    readonly traversal: PcgConnectionTraversal;
    readonly void?: boolean;
}

interface PcgSemanticSurfaceRegionBase<TPreset extends PcgWorldPreset> {
    readonly id: string;
    readonly preset: TPreset;
    readonly position: {
        readonly x: number;
        readonly z: number;
    };
    readonly seed?: PcgWorldSeed;
    readonly overrides?: Readonly<PcgWorldPresetOverrides<TPreset> & {
        readonly layers?: PcgPresetLayerDisables<TPreset['id']>;
    }>;
}

type PcgWorldSiteWaterDefinition = PcgSiteWaterConnectivity;

type PcgSiteWaterConnectivity = {
    readonly kind: 'dry';
    readonly bodyIds?: readonly string[];
} | {
    readonly kind: 'flooded';
    readonly bodyId: string;
};

/** Surface Region custom layers belong on the Base, where their spatial mask is explicit. */
type PcgPresetLayerDisables<TPresetId extends string> = {
    readonly [TKey in keyof PcgPresetLayerOverrides<TPresetId>]?: false;
};

type PcgSemanticSiteDeclaration = PcgBuildingSiteDeclaration | PcgCaveSiteDeclaration | PcgDungeonSiteDeclaration | PcgCustomSiteDeclaration;

type PcgSemanticHabitatDeclaration = PcgCoralReefHabitatDeclaration;

type PcgSemanticSurfaceRegionDeclaration = PcgRockMountainRegionDeclaration | PcgVillageRegionDeclaration | PcgCityRegionDeclaration;
