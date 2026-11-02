// Import from "wanaka-studio-engine/pcg-three".

import type { LifetimeScope } from "wanaka-studio-engine";
import type { PhaseScheduler } from "wanaka-studio-engine";
import type { PhysicsWorld, RigidBody } from "wanaka-studio-engine/physics";
import type { Group } from "three/webgpu";
import { Texture } from "three/webgpu";
import type { PbrTextureUrls } from "wanaka-studio-engine/external-assets";
import type { Object3D, PerspectiveCamera } from "three/webgpu";
import type { PersistenceSession } from "wanaka-studio-engine/persistence";
import type { SceneContext } from "wanaka-studio-engine/scene";
import type { PcgWorldDefinition, PcgWorldPreset } from "wanaka-studio-engine/pcg-author";

/** Attaches an opaque preset definition through the Engine-owned runtime pipeline. */
export function attachPcgWorld<TPreset extends PcgWorldPreset>(context: SceneContext, world: PcgWorldDefinition<TPreset>, options: PcgWorldAttachOptions): Promise<PcgWorldAttachment>;

export interface PcgWaterPointBinding {
    readonly current: PcgWaterMediumSample | undefined;
}

export interface PcgWaterActorPoints {
    readonly head: PcgWorldPoint;
    readonly center: PcgWorldPoint;
    readonly feet: PcgWorldPoint;
}

export interface PcgWaterActorBinding {
    readonly head: PcgWaterMediumSample | undefined;
    readonly center: PcgWaterMediumSample | undefined;
    readonly feet: PcgWaterMediumSample | undefined;
    readonly submergedFraction: number;
}

/** Samples camera medium during rendering without changing scene or pipeline ownership. */
export function bindPcgWaterCamera(scope: LifetimeScope, scheduler: PhaseScheduler, water: Pick<PcgWaterQueryRuntime, 'samplePoint'>, readPosition: () => PcgWorldPoint): PcgWaterPointBinding;

/** Samples actor head, center, and feet independently on the fixed gameplay timeline. */
export function bindPcgWaterActor(scope: LifetimeScope, scheduler: PhaseScheduler, water: Pick<PcgWaterQueryRuntime, 'samplePoint'>, readPoints: () => PcgWaterActorPoints): PcgWaterActorBinding;

/**
 * Explicitly binds one dynamic body to canonical water; no world-wide rigid-body scan occurs.
 * The buoyancy plane follows the wave surface above the body while it is airborne, and the
 * dry→wet transition emits one surface disturbance scaled by entry speed and collider footprint.
 */
export function bindPcgWaterBuoyancy(scope: LifetimeScope, scheduler: PhaseScheduler, water: Pick<PcgWaterQueryRuntime, 'samplePoint' | 'sampleSurface' | 'disturb'>, physics: Pick<PhysicsWorld, 'applyBuoyancy'>, body: RigidBody, options?: {
    readonly buoyancy?: number;
    readonly linearDrag?: number;
    readonly angularDrag?: number;
}): void;

interface PcgWaterMediumSample extends PcgWaterSurfaceSample {
    readonly submersionDepth: number;
}

/** World-facing facade; Site composition alone owns volume registration. */
interface PcgWaterQueryRuntime {
    /** Current multiplier applied to canonical ocean waves; 1 preserves the default sea. */
    readonly seaStateScale: number;
    /** Sets the shared wave-amplitude multiplier between 0 and 2.5. */
    setSeaStateScale(value: number): void;
    sampleSurface(x: number, z: number, referenceY?: number): PcgWaterSurfaceSample | undefined;
    samplePoint(point: PcgWorldPoint): PcgWaterMediumSample | undefined;
    disturb(disturbance: PcgWaterDisturbanceInput): number;
    disturbances(): readonly PcgWaterDisturbance[];
    /**
     * Nearest waterline of the Base sea to a World-space column, from either side.
     * Read from the generated terrain, so it answers before any cell streams in; use
     * it to place a spawn on the beach or to find which way the sea lies. One query
     * costs up to a few thousand height samples: call it on setup or on demand, not
     * every frame. Undefined when the World has no sea or no waterline lies in range.
     */
    nearestShore(x: number, z: number, options?: PcgWaterShoreQueryOptions): PcgWaterShore | undefined;
}

interface PcgWaterSurfaceSample {
    readonly bodyId: string;
    readonly kind: 'ocean' | 'lake' | 'river';
    readonly position: PcgWorldPoint;
    readonly normal: PcgWorldPoint;
    readonly velocity: PcgWorldPoint;
    readonly bedY: number;
    readonly depth: number;
    readonly shore: number;
    readonly flow: {
        readonly x: number;
        readonly z: number;
    };
    readonly opticalProfileId: string;
}

/** Waterline of the Base sea: where the ground meets the sea surface. */
interface PcgWaterShore {
    /** Waterline point; `y` is the sea surface height. */
    readonly position: PcgWorldPoint;
    /** Unit horizontal direction from the waterline toward open sea. Land lies opposite. */
    readonly seaward: {
        readonly x: number;
        readonly z: number;
    };
    /** Horizontal distance from the queried column to `position`, in metres. */
    readonly distance: number;
}

interface PcgWaterShoreQueryOptions {
    /** Search radius in metres around the queried column. Defaults to 512. */
    readonly maxDistance?: number;
}

interface PcgWaterDisturbance {
    readonly id: number;
    readonly position: PcgWorldPoint;
    readonly radius: number;
    readonly strength: number;
    readonly startedAt: number;
    readonly duration: number;
}

interface PcgWaterDisturbanceInput {
    readonly position: PcgWorldPoint;
    readonly radius: number;
    readonly strength: number;
    readonly duration: number;
    readonly startedAt?: number;
}

interface PcgWorldPoint {
    readonly x: number;
    readonly y: number;
    readonly z: number;
}

/**
 * Per-metre absorption and scattering of one water body (m⁻¹, linear RGB).
 * These two vectors are the whole optical identity of a body: the surface
 * material, the Water Medium, and caustics derive everything else from them.
 */
export interface PcgWaterOpticalCoefficients {
    readonly absorption: readonly [
        number,
        number,
        number
    ];
    readonly scattering: readonly [
        number,
        number,
        number
    ];
}

/**
 * Declares (or redefines) a water optical profile. The id is then usable as
 * `PcgWaterBody.opticalProfileId` (or a composite `waterBodies` override); both
 * the surface and the Water Medium pick the new coefficients up on their next frame.
 */
export function registerPcgWaterOpticalProfile(profileId: string, coefficients: PcgWaterOpticalCoefficients): void;

/** Owns an independent custom profile until scope disposal. Concurrent equal profiles share a slot.
 * Bind before attaching a World whose waterBodies refer to this id; dispose the World first.
 */
export function bindPcgWaterOpticalProfile(scope: LifetimeScope, profileId: string, coefficients: PcgWaterOpticalCoefficients): void;

export interface PcgWorldInterest {
    readonly x: number;
    /** Optional World-space elevation used by vertical streaming domains. */
    readonly y?: number;
    readonly z: number;
}

/** Attachment progress; cell totals may change and attachment completion is not gameplay readiness. */
export interface PcgWorldLoadProgress {
    readonly phase: 'planning' | 'generating' | 'attached';
    readonly completedCells?: number;
    readonly totalCells?: number;
}

export interface PcgWorldAttachment {
    readonly presetId: string;
    readonly root: Group;
    readonly experience: PcgWorldExperience;
    /** World-space water query truth for gameplay: pass to `bindPcgWaterBuoyancy` / `bindPcgWaterActor` / `bindPcgWaterCamera`, or `disturb` the surface directly. */
    readonly water?: PcgWaterQueryRuntime;
    /** World-space enclosure and surface-stack queries. Nearest-surface selection is `sampleSurface`. */
    readonly spatial: Omit<PcgWorldSpatialQueries, 'nearestSurface'>;
    /** Resident semantic navigation and cross-Site route queries. */
    readonly navigation?: PcgWorldNavigationQueries;
    /** Composite-owned dynamic entity state, independent from generated presentation residency. */
    readonly gameplayState?: PcgGameplayStateStore;
    /** Immutable Plan-derived gameplay semantics; independent from visual cell residency. */
    readonly semantic?: PcgSemanticCatalog;
    dispose(): void;
    settle(): Promise<void>;
    snapshot(): PcgWorldAttachmentSnapshot;
    /** Reads fail-closed presentation and collision residency at one World-space location. */
    readinessAt(x: number, z: number, y?: number): PcgWorldLocationReadiness;
    /** Samples authoritative height at World-space coordinates. */
    sampleHeight(x: number, z: number): number | undefined;
    /** Samples every generated layer at World-space coordinates, including water when present. */
    sampleSurface(x: number, z: number, referenceY?: number): PcgSampledSurface;
    /** Samples a semantic exclusion field at World-space coordinates. */
    sampleClearance(role: string, x: number, z: number): number | undefined;
}

interface PcgWorldAttachmentSnapshot {
    readonly active: readonly string[];
    readonly requested: readonly string[];
    readonly generatedCount: number;
    readonly retiredCount: number;
    readonly failedCount: number;
    readonly ready: boolean;
    readonly readiness: {
        readonly coverage: boolean;
        readonly generation: boolean;
        readonly presentation: boolean;
        readonly collision: boolean;
        readonly assets: boolean;
        readonly layers: boolean;
    };
    readonly presentMs: number;
    readonly instances: number;
    readonly kit: {
        readonly ready: boolean;
        readonly loaded: number;
        readonly failed: number;
        readonly failures?: readonly string[];
        readonly identity?: string;
    };
    /** Project-authored Plan request and cache state, when the World declares Plans. */
    readonly plans?: readonly PcgWorldPlanSnapshot[];
    /** Composite plan identity and live Site/Connection residency, when this is a Composite World. */
    readonly composite?: PcgCompositeWorldSnapshot;
}

/** Stacked surfaces at one column, plus the water surface and medium sample when water is present. */
interface PcgSampledSurface {
    readonly layers: readonly PcgSampledSurfaceLayer[];
    /** Highest layer at or below `referenceY`, otherwise the nearest layer above it. */
    readonly surface?: PcgSampledSurfaceLayer;
    readonly water?: PcgWaterSurfaceSample;
    readonly medium?: PcgWaterMediumSample;
}

/** Local presentation and collision residency at one World-space location. */
interface PcgWorldLocationReadiness {
    readonly visual: boolean;
    readonly physics: boolean;
}

/** Stable authored landmarks that let gameplay start in the generated content without knowing its layout. */
interface PcgWorldExperience {
    readonly spawn?: PcgWorldViewpoint;
    readonly viewpoints: readonly PcgWorldViewpoint[];
    readonly landmarks?: Readonly<Record<string, PcgWorldPoint>>;
    readonly heightSamples?: Readonly<Record<string, number>>;
    readonly roleCounts: Readonly<Record<string, number>>;
    readonly residentCellKeys: Readonly<Record<string, readonly string[]>>;
    readonly traversability: Readonly<Record<string, boolean | number>>;
}

/** Request/cache state for a project-authored Plan attached to a World. */
interface PcgWorldPlanSnapshot {
    readonly id: string;
    readonly requested: readonly string[];
    readonly cached: readonly string[];
    readonly pending: readonly string[];
    readonly failed: readonly string[];
    readonly generatedCount: number;
    readonly ready: boolean;
}

interface PcgCompositeWorldSnapshot {
    readonly id: string;
    readonly version: number;
    readonly planHash: string;
    readonly interests: PcgCompositeInterestSnapshot;
    readonly streaming: PcgSessionBudgetSnapshot;
    readonly pendingMacroRegionIds: readonly string[];
    readonly macroRegionFailures: Readonly<Record<string, string>>;
    readonly base: PcgCompositePartitionSnapshot;
    readonly habitats: readonly PcgCompositeHabitatSnapshot[];
    readonly macroRegions: readonly PcgCompositeMacroRegionSnapshot[];
    readonly sites: readonly PcgCompositeSiteSnapshot[];
    readonly connections: readonly PcgCompositeConnectionSnapshot[];
    readonly modifiers: readonly PcgSurfaceModifier[];
    readonly water?: PcgCompositeWaterSnapshot;
}

interface PcgWorldViewpoint {
    readonly id: string;
    readonly position: PcgWorldPoint;
    readonly target: PcgWorldPoint;
}

/** One layer returned by the public multi-surface query. */
interface PcgSampledSurfaceLayer {
    readonly role: string;
    readonly height: number;
    readonly bridge: boolean;
    readonly position: PcgWorldPoint;
    readonly normal: PcgWorldPoint;
    readonly spaceId: string;
    readonly ownerId: string;
    readonly availability: 'planned' | 'resident';
}

interface PcgCompositeSiteSnapshot {
    readonly id: string;
    readonly generator: PcgWorldGeneratorRef;
    readonly bounds: PcgBounds3;
    readonly ownerRegionId: string;
    readonly seed: number;
    readonly definitionHash?: string;
    readonly planHash: string;
    readonly persistenceNamespace: string;
    readonly water?: PcgSiteWaterConnectivity;
    readonly cave?: PcgCaveSiteSnapshot;
    readonly state: 'planned' | 'loading' | 'resident' | 'failed';
    readonly runtime?: PcgCompositePartitionSnapshot;
    readonly failure?: string;
}

type PcgCompositePartitionSnapshot = Omit<PcgWorldAttachmentSnapshot, 'composite'>;

interface PcgCompositeHabitatSnapshot {
    readonly id: string;
    readonly runtime: PcgCompositePartitionSnapshot;
}

interface PcgCompositeConnectionSnapshot {
    readonly id: string;
    readonly from: PcgConnectionEndpoint;
    readonly to: PcgConnectionEndpoint;
    readonly fromSpaceId: string;
    readonly toSpaceId: string;
    readonly aperture: PcgOrientedBounds;
    readonly traversal: PcgConnectionTraversal;
    readonly contract: PcgTraversalContract;
    readonly approachVolumes: readonly PcgConnectionApproachVolume[];
    readonly readiness: {
        readonly from: PcgCompositeEndpointReadinessSnapshot;
        readonly to: PcgCompositeEndpointReadinessSnapshot;
    };
    readonly blockerEnabled: boolean;
    readonly traversable: boolean;
    readonly failure?: string;
}

interface PcgCompositeMacroRegionSnapshot {
    readonly id: string;
    readonly key: {
        readonly x: number;
        readonly z: number;
    };
    readonly bounds: {
        readonly minX: number;
        readonly minZ: number;
        readonly maxX: number;
        readonly maxZ: number;
    };
    readonly planHash: string;
    readonly cacheIdentity: {
        readonly generator: PcgWorldGeneratorRef;
        readonly worldPlanHash: string;
        readonly regionId: string;
        readonly regionSize: number;
    };
    readonly state: 'interested' | 'cached';
    readonly ownedSurfaceRegionIds: readonly string[];
    readonly referencedSurfaceRegionIds: readonly string[];
    readonly ownedTransportEdgeIds: readonly string[];
    readonly referencedTransportEdgeIds: readonly string[];
    readonly ownedSiteIds: readonly string[];
    readonly referencedSiteIds: readonly string[];
    readonly connectionIds: readonly string[];
    readonly modifierIds: readonly string[];
    readonly hydrologyReferences: readonly string[];
    /** Project-authored Plan outputs retained in this MacroRegion, by Plan id. */
    readonly authoredPlanIds: readonly string[];
    readonly authoredPlanHashes: Readonly<Record<string, string>>;
    readonly diagnostics: readonly {
        readonly code: string;
        readonly subjectIds: readonly string[];
        readonly message: string;
    }[];
}

interface PcgCompositeInterestSnapshot {
    readonly world: readonly PcgWorldInterest[];
    readonly local: readonly PcgWorldInterest[];
    readonly routedLocal: readonly {
        readonly x: number;
        readonly y: number;
        readonly z: number;
        readonly connectionId: string;
        readonly destinationSpaceId: string;
    }[];
}

interface PcgCompositeWaterSnapshot extends Omit<PcgWaterRuntimeSnapshot, 'floodedVolumes'> {
    readonly floodedVolumes: readonly (PcgFloodedVolume & {
        readonly siteId?: string;
    })[];
    readonly mediumCost?: {
        readonly enabled: boolean;
        readonly bindingUpdates: number;
        readonly cpuMs: number;
    };
}

interface PcgCaveSiteSnapshot {
    readonly chambers: readonly PcgCaveChamberSnapshot[];
    readonly passages: readonly PcgCavePassageSnapshot[];
}

interface PcgCompositeEndpointReadinessSnapshot {
    readonly visual: boolean;
    readonly physics: boolean;
    readonly navigation: boolean;
}

interface PcgCaveChamberSnapshot {
    readonly id: string;
    readonly center: PcgWorldPoint;
    readonly size: {
        readonly width: number;
        readonly depth: number;
        readonly height: number;
    };
}

interface PcgCavePassageSnapshot {
    readonly points: readonly PcgWorldPoint[];
}

interface PcgWorldGeneratorRef {
    readonly id: string;
    readonly version: number;
}

interface PcgWorldSpatialQueries {
    locate(point: PcgWorldPoint): PcgSpatialContext;
    querySurfaces(query: PcgSurfaceQuery): readonly PcgSurfaceHit[];
    nearestSurface(query: PcgSurfaceQuery): PcgSurfaceHit | undefined;
}

interface PcgSurfaceQuery {
    readonly x: number;
    readonly z: number;
    readonly referenceY: number;
    readonly direction: 'up' | 'down' | 'nearest';
    readonly roles?: readonly string[];
    /** Defaults to both states; gameplay may require resident geometry explicitly. */
    readonly availability?: PcgSurfaceAvailability | 'any';
}

interface PcgSurfaceHit {
    readonly ownerId: string;
    readonly spaceId: string;
    readonly role: string;
    readonly position: PcgWorldPoint;
    readonly normal: PcgWorldPoint;
    readonly availability: PcgSurfaceAvailability;
    readonly bridge: boolean;
}

interface PcgSpatialContext {
    readonly enclosure?: PcgEnclosureSample;
    readonly water?: PcgWaterMediumSample;
}

type PcgSurfaceAvailability = 'planned' | 'resident';

interface PcgEnclosureSample {
    readonly ownerId: string;
    readonly spaceId: string;
    readonly profileId: string;
    readonly bounds: PcgBounds3;
}

interface PcgBounds3 {
    readonly minX: number;
    readonly minY: number;
    readonly minZ: number;
    readonly maxX: number;
    readonly maxY: number;
    readonly maxZ: number;
}

interface PcgFloodedVolume {
    readonly id: string;
    readonly volume: PcgWaterVolume;
    readonly bodyId: string;
}

interface PcgWaterRuntimeSnapshot {
    readonly bodies: readonly {
        readonly id: string;
        readonly kind: PcgWaterBody['kind'];
        readonly opticalProfileId: string;
    }[];
    readonly exclusions: readonly PcgWaterExclusion[];
    readonly floodedVolumes: readonly PcgFloodedVolume[];
    readonly disturbanceCapacity: number;
    readonly disturbances: readonly PcgWaterDisturbance[];
    readonly seaStateScale: number;
}

type PcgWaterVolume = (Omit<PcgVolume, 'kind'> & {
    readonly kind: 'box';
}) | {
    readonly kind: 'oriented-box';
    readonly center: PcgWorldPoint;
    readonly halfExtents: PcgWorldPoint;
    readonly yaw: number;
};

interface PcgWaterExclusion {
    readonly id: string;
    readonly volume: PcgWaterVolume;
    readonly bodyIds?: readonly string[];
}

type PcgWaterBody = PcgOceanWaterBody | PcgLakeWaterBody | PcgRiverWaterBody;

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

interface PcgOceanWaterBody extends PcgWaterBodyIdentity {
    readonly kind: 'ocean';
    readonly level: number;
    readonly seabed?: PcgOceanSeabed;
}

interface PcgLakeWaterBody extends PcgWaterBodyIdentity {
    readonly kind: 'lake';
    readonly ring: PcgPolygon2D;
    readonly level?: number;
    readonly depth?: number;
    readonly shoulderWidth?: number;
    readonly bankWidth?: number;
    readonly bankHeight?: number;
}

interface PcgRiverWaterBody extends PcgWaterBodyIdentity {
    readonly kind: 'river';
    readonly spline: PcgSplineData;
    readonly halfWidth: number;
    readonly depth: number;
    readonly velocity: number;
    readonly shoulderWidth?: number;
    readonly bankWidth?: number;
    readonly bankHeight?: number;
    /** Unresolved: point heights are derived from the pre-water terrain when the Base resolves bodies. */
    readonly surface?: 'terrain';
}

interface PcgWaterBodyIdentity {
    readonly id: string;
    /** Stable feature identity shared by cell-local presentation fragments. */
    readonly logicalId?: string;
    readonly opticalProfileId?: string;
}

/** Canonical continental shelf with seeded ridges, channels and bed ripples below ocean level. */
interface PcgOceanSeabed {
    /** Peak vertical relief in metres. */
    readonly relief: number;
    readonly seed?: string | number;
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

type PcgSurfaceModifier = {
    readonly kind: 'foundation';
    readonly id: string;
    readonly ownerId: string;
    readonly footprint: PcgPolygon2D;
    readonly height: number;
} | {
    readonly kind: 'grade';
    /** False for shared terrain grading that does not reserve a building footprint. */
    readonly reservesFootprint?: false;
    readonly id: string;
    readonly ownerId: string;
    readonly footprint: PcgPolygon2D;
    readonly height: number;
    readonly margin: number;
} | {
    /** Lifts terrain below `height` up to it inside the footprint, blending out over `margin`; never lowers. */
    readonly kind: 'raise';
    readonly id: string;
    readonly ownerId: string;
    readonly footprint: PcgPolygon2D;
    readonly height: number;
    readonly margin: number;
} | {
    readonly kind: 'void';
    readonly id: string;
    readonly ownerId: string;
    readonly footprint: PcgPolygon2D;
} | {
    readonly kind: 'scatter-exclusion';
    /** False when the exclusion clears natural scenery without reserving a building footprint. */
    readonly reservesFootprint?: false;
    readonly id: string;
    readonly ownerId: string;
    readonly footprint: PcgPolygon2D;
};

interface PcgOrientedBounds {
    readonly center: PcgWorldPoint;
    readonly halfExtents: PcgWorldPoint;
    readonly yaw: number;
}

interface PcgConnectionEndpoint {
    readonly spaceId: string;
    readonly entranceId: string;
}

type PcgConnectionTraversal = 'door' | 'passage' | 'stair' | 'slope' | 'shaft';

interface PcgTraversalContract {
    readonly modes: readonly ('walk' | 'swim' | 'climb')[];
    readonly minimumClearance?: number;
    readonly maximumSlope?: number;
    readonly accessible?: boolean;
}

interface PcgConnectionApproachVolume extends PcgBounds3 {
    readonly endpoint: 'from' | 'to';
}

type PcgSiteWaterConnectivity = {
    readonly kind: 'dry';
    readonly bodyIds?: readonly string[];
} | {
    readonly kind: 'flooded';
    readonly bodyId: string;
};

interface PcgWorldNavigationQueries {
    readyAt(x: number, z: number, y?: number, nodeId?: string): boolean;
    findPath(from: PcgWorldPoint, to: PcgWorldPoint, options?: PcgNavigationPathOptions): PcgNavigationPath;
    snapshot(): PcgNavigationSnapshot;
}

interface PcgNavigationPath {
    readonly status: 'complete' | 'unreachable';
    readonly points: readonly PcgWorldPoint[];
    readonly cost: number;
}

interface PcgNavigationPathOptions {
    /** Composite space identity used to disambiguate overlapping start geometry. */
    readonly fromSpaceId?: string;
    /** Composite space identity used to disambiguate overlapping target geometry. */
    readonly toSpaceId?: string;
    /** Required movement mode for cross-space links. Omitted accepts any supported mode. */
    readonly mode?: PcgTraversalContract['modes'][number];
    /** Agent clearance in metres. Links without declared clearance fail closed when provided. */
    readonly clearance?: number;
    /** Steepest slope the agent accepts. Links without declared slope fail closed when provided. */
    readonly maximumSlope?: number;
    /** Rejects inaccessible graph edges and requires accessible cross-space links. */
    readonly accessibleOnly?: boolean;
}

interface PcgNavigationSnapshot {
    readonly partitions: readonly string[];
    readonly nodes: number;
    readonly edges: number;
    readonly links: readonly string[];
}

interface PcgSessionBudgetSnapshot {
    readonly qualityTier: RenderQualityTier;
    readonly pressure: PcgStreamingFramePressure;
    readonly smoothedWorkMs: number;
    readonly remainingQueueMs: number;
    readonly remainingEvaluations: number;
}

type PcgStreamingFramePressure = 'normal' | 'constrained' | 'critical';

type RenderQualityTier = (typeof RENDER_QUALITY_TIERS)[number] | (typeof RENDER_MOBILE_QUALITY_PRESETS)[number];

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

export interface PcgRaceCourseSample extends PcgWorldPoint {
    readonly distance: number;
    readonly tangent: {
        readonly x: number;
        readonly z: number;
    };
}

export interface PcgRaceCheckpoint {
    readonly index: number;
    readonly distance: number;
    readonly position: PcgWorldPoint;
    readonly tangent: {
        readonly x: number;
        readonly z: number;
    };
}

export interface PcgRaceGridSlot {
    readonly index: number;
    readonly position: PcgWorldPoint;
    readonly heading: number;
    readonly distance: number;
}

export interface PcgRaceProgressSample {
    readonly distance: number;
    readonly lateral: number;
    readonly position: PcgWorldPoint;
    readonly tangent: {
        readonly x: number;
        readonly z: number;
    };
}

export interface PcgRaceCourseQuery {
    readonly state: 'ready';
    readonly planHash: string;
    readonly totalLength: number;
    readonly checkpoints: readonly PcgRaceCheckpoint[];
    readonly startGrid: readonly PcgRaceGridSlot[];
    sampleAtDistance(distance: number): PcgRaceCourseSample;
    nearest(x: number, z: number, hintDistance?: number): PcgRaceProgressSample;
}

export interface PcgSemanticCatalog {
    prepareCourse(plan: PcgDefinedPlan, bounds: {
        readonly minX: number;
        readonly minZ: number;
        readonly maxX: number;
        readonly maxZ: number;
    }): Promise<PcgRaceCourseQuery>;
    course(planId: string): PcgRaceCourseQuery | undefined;
}

/** Opaque Plan handle collected into the project Worker by the compiler. */
type PcgDefinedPlan<TOutputs extends Readonly<Record<string, PcgPlanOutputDefinition>> = Readonly<Record<string, PcgPlanOutputDefinition>>, TParams = unknown> = Readonly<{
    readonly [pcgDefinedPlanBrand]: true;
    readonly id: string;
    readonly version: number;
    readonly outputs: TOutputs;
    readonly semantics?: PcgPlanSemanticDefinitions;
    readonly params: TParams;
    readonly budget?: PcgPlanBudget;
}> & PcgPlanOutputReferences<TOutputs>;

interface PcgPlanSemanticDefinitions {
    readonly course?: PcgRaceCourseSemanticDefinition;
    /** Names of river spline and lake polygon outputs compiled as canonical water features. */
    readonly hydrology?: {
        readonly outputs: readonly string[];
    };
}

type PcgPlanOutputDefinition = PcgPlanPointOutput | PcgPlanSplineOutput | PcgPlanPolygonOutput | PcgPlanVolumeOutput;

/** Hard limits applied before a Plan region is serialized or cached. */
interface PcgPlanBudget {
    readonly maxBytes?: number;
    readonly maxPoints?: number;
    readonly maxSplineVertices?: number;
    readonly maxPolygonVertices?: number;
    readonly maxVolumes?: number;
    readonly maxCpuMs?: number;
}

declare const pcgDefinedPlanBrand: unique symbol;

type PcgPlanOutputReferences<TOutputs extends Readonly<Record<string, PcgPlanOutputDefinition>>> = string extends keyof TOutputs ? Readonly<Record<never, never>> : Readonly<{
    [TName in keyof TOutputs & string]: PcgPlanOutputReference<TOutputs[TName]['kind']>;
}>;

interface PcgRaceCourseSemanticDefinition {
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

interface PcgPlanPointOutput<TRole extends string = string> {
    readonly kind: 'points';
    readonly role?: TRole;
    readonly asset?: string;
    readonly present?: PcgLayerPointPresent;
}

interface PcgPlanSplineOutput<TRole extends string = string> {
    readonly kind: 'splines';
    /** Overrides road/path defaults; false leaves ground scatter unreserved. */
    readonly scatterExclusion?: boolean | PcgPlanSplineScatterExclusion;
    readonly present?: PcgLayerSplinePresent<TRole> | PcgPlanRiverPresent;
}

interface PcgPlanPolygonOutput {
    readonly kind: 'polygons';
    /** Overrides paving defaults; true or options reserve even an unrendered polygon. */
    readonly scatterExclusion?: boolean | PcgPlanScatterExclusion;
    readonly present?: PcgLayerPolygonPresent | PcgPlanLakePresent;
}

interface PcgPlanVolumeOutput {
    readonly kind: 'volumes';
    readonly present?: PcgLayerVolumePresent;
}

/** A serializable reference to one declared Plan output. */
interface PcgPlanOutputReference<TKind extends PcgPlanOutputKind = PcgPlanOutputKind> {
    readonly [pcgPlanOutputReferenceBrand]: true;
    readonly planId: string;
    readonly planVersion: number;
    readonly output: string;
    readonly kind: TKind;
}

type PcgPlanOutputKind = 'points' | 'splines' | 'polygons' | 'volumes';

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

declare const pcgPlanOutputReferenceBrand: unique symbol;

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

export interface PcgGameplayStateStore {
    readonly worldId: string;
    readonly worldVersion: number;
    get(siteId: string, entityId: string): unknown;
    set(siteId: string, entityId: string, state: unknown): void;
    clear(siteId: string, entityId: string): void;
    snapshot(): PcgGameplayStateDocument;
    replace(value: unknown): void;
}

interface PcgGameplayStateDocument {
    readonly schema: typeof PCG_GAMEPLAY_STATE_SCHEMA;
    readonly worldId: string;
    readonly worldVersion: number;
    readonly sites: Readonly<Record<string, PcgGameplaySiteStateDocument>>;
}

declare const PCG_GAMEPLAY_STATE_SCHEMA: string;

interface PcgGameplaySiteStateDocument {
    readonly planHash: string;
    readonly entities: Readonly<Record<string, unknown>>;
}

/** Project-owned maps and world-space tiling for one Terrain Base palette slot. */
export interface PcgTerrainSurfaceMaterial {
    /** Colour texture; use sRGB colour space and repeat wrapping for image albedo. */
    readonly map: Texture;
    /** World-space edge length of one texture tile, in metres. */
    readonly metersPerRepeat: number;
    /** Optional data maps. Shared palette budget prioritizes albedo, normal, roughness, then metalness. */
    readonly normal?: Texture;
    readonly roughnessMap?: Texture;
    readonly metalnessMap?: Texture;
    readonly tint?: number;
    readonly roughness?: number;
}

/** Overrides declared Terrain Base slots; omitted slots retain their default look. */
export type PcgTerrainSurfaceMaterials = Readonly<Partial<Record<WanakaDefaultSurfaceSlot, PcgTerrainSurfaceMaterial>>>;

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

/** Sampling resolution and admissible height/slope for a planned footprint. */
export interface PcgSurfaceFootprintOptions {
    readonly spacing: number;
    readonly minimumHeight?: number;
    readonly maximumHeight?: number;
    /** Rise/run, not degrees. Slopes use probes half a metre apart by default. */
    readonly maximumSlope?: number;
    readonly slopeProbeMeters?: number;
}

/** First failing sample, or a successful bounded-resolution check. */
export type PcgSurfaceFootprintResult = {
    readonly ok: true;
    readonly sampleCount: number;
} | {
    readonly ok: false;
    readonly reason: 'unavailable' | 'height' | 'slope';
    readonly position: {
        readonly x: number;
        readonly z: number;
    };
    readonly height?: number;
    readonly slope?: number;
};

/** Checks boundaries and interior against the supplied authoritative surface, independent of residency.
 * Unknown/non-finite heights fail closed. Features below spacing/probe resolution may be missed.
 * This does not test obstacles, headroom, or exact mesh intersections.
 */
export function checkPcgSurfaceFootprint(polygon: PcgPolygon2D, sampleHeight: (x: number, z: number) => number | undefined, options: PcgSurfaceFootprintOptions): PcgSurfaceFootprintResult;

interface PcgWorldAttachOptions {
    /** Initial attachment phases and terrain-backed startup cell counts; no fixed global percentage. */
    readonly onProgress?: (progress: PcgWorldLoadProgress) => void;
    /** World-space streaming anchors such as the player or active camera. */
    readonly interest: () => readonly PcgWorldInterest[] | PcgWorldInterest;
    readonly parent?: Object3D;
    /** Optional static placement root. Translation and Y-axis rotation apply to visuals, queries, experience, and physics. */
    readonly root?: Group;
    readonly physics?: PhysicsWorld;
    readonly camera?: PerspectiveCamera;
    /** Role-bound presentation kits that replace a preset's shipped art without changing its world plan. */
    readonly kitBindings?: readonly PcgBoundKit[];
    /** Project-owned world-mapped textures for declared Terrain Base palette slots. */
    readonly terrainSurfaces?: PcgTerrainSurfaceMaterials;
    /** Optional save session for Composite gameplay entity state. */
    readonly persistence?: PersistenceSession;
    /** SaveKey override for Composite gameplay entity state. */
    readonly gameplayStateSaveKey?: string;
}

/** Immutable semantic role binding created by bindPcgKit. */
interface PcgBoundKit<TGenerator extends PcgRoleGenerator = PcgRoleGenerator, TKit extends PcgRoleKit = PcgRoleKit> extends PcgBoundKitRecord<TGenerator, TKit> {
    readonly [pcgBoundKitBrand]: readonly [
        TGenerator,
        TKit
    ];
}

interface PcgRoleGenerator<TRoles extends readonly string[] = readonly string[]> {
    readonly roles: TRoles;
    readonly modelRoles?: readonly TRoles[number][];
    readonly lights?: Readonly<Partial<Record<TRoles[number], PcgLightRoleDefinition>>>;
    /** Canonical world-space height for roles whose source assets use arbitrary units. */
    readonly modelHeightsMeters?: Readonly<Partial<Record<TRoles[number], number>>>;
    readonly defaultRoles?: PcgKitRoleBinding<TRoles>;
}

/** Portable content-addressed catalog accepted by semantic role bindings. */
interface PcgRoleKit extends PcgKitCatalog {
    readonly roleContract?: PcgRoleGenerator;
}

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

/** Default surfaces a PCG layer surface can use. */
type PcgLayerSurfaceSlot = Exclude<WanakaDefaultSurfaceSlot, (typeof UNBAKED_DEFAULT_SURFACE_SLOTS)[number]>;

/** Default surfaces PCG layers cannot render yet. */
declare const UNBAKED_DEFAULT_SURFACE_SLOTS: readonly [
    'surface-sand'
];
