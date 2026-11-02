// intent: Interactive wall/dome protection with confirmed hits and collapse.
// variants: createEnergyShield, createBarrierBreak, createBarrierField, createBarrierProjector
// inputs: Unscaled anchor; wall hit UVs or dome-local contacts; game owns protection and active interval.
// Copy dependencies: none.
// Gameplay adapter: examples/vfx-barrier-contact.ts supplies matching raycasts, repair, collapse and cancellation; leave previewHits off.
// Setup in an async scene: const effect = createEnergyShield('example.shield');
// const vfx = useVfx(context); await vfx.prepare(effect, {});
// const handle = vfx.play(effect, playOptions);
// Import useVfx from wanaka-studio-engine/vfx; construct playOptions from the recipe notes and real game inputs.
// Wall integration: createBarrierField(id, { duration }) has no preview shots/hits.
// Copy examples/vfx-barrier-contact.ts for matching raycasts, health and cancellation.
// barrierFieldGeometry/barrierFieldOrigin match the deployed visual; gate queries by
// actual protection, select the nearest receiver, then feed actual UV and cast seconds.
// barrierHitParams rejects rounded corners and cycles three slots. Cosmetic rejection
// must not disable protection. Update health through the adapter's setIntegrity;
// full repair clears wall contacts. collapse(uv, castSeconds) is terminal for that cast:
// release protection at that event, while its independently owned fragments drain.
// Cancel both field and fragments; recast to reset. Visual fade is not a protection window.
// Dome integration: createBarrierProjector(id, { duration }) with previews off; raycast
// projectorGeometry under the same anchor. Convert intersection using anchor.worldToLocal.
// projectorHitParams(serial, localPoint, castSeconds) validates the surface/floor and
// returns three cycling slots. Increment serial only on accepted contact; apply returned
// entries with handle.setParam only while playing. Set integrity to health/maxHealth
// in [0,1]; stop on depletion/cancel. Dome has no automatic destruction sequence.
// Use projectorTiming for visual deploy/expiry, independently gate gameplay protection.
// Unscaled anchors preserve local metres; scaling must match both visual and raycast.
import { sampleVfxLookTexture as lookSample } from 'wanaka-studio-engine/vfx';
import {
  abs,
  acos,
  clamp,
  cos,
  cross,
  dot,
  float,
  fwidth,
  min,
  mix,
  normalize,
  normalView,
  oneMinus,
  positionView,
  pow,
  sin,
  smoothstep,
  abs as tslAbs,
  clamp as tslClamp,
  dot as tslDot,
  fract as tslFract,
  length as tslLength,
  min as tslMin,
  mix as tslMix,
  normalize as tslNormalize,
  oneMinus as tslOneMinus,
  pow as tslPow,
  sin as tslSin,
  smoothstep as tslSmoothstep,
  uv as tslUv,
  vec2 as tslVec2,
  uv,
  vec2,
  vec3,
} from 'three/tsl';
import {
  type BufferGeometry,
  type Node,
  Color,
  PlaneGeometry,
  SphereGeometry,
  Vector3,
} from 'three/webgpu';
import {
  type Vec3,
  type VfxDefinition,
  type VfxKitBuilder,
  type VfxLayerLook,
  type VfxParticleContext,
  curve,
  defineVfx,
  vfxTexture,
} from 'wanaka-studio-engine/vfx';
/** Selects a bowed wall or hemisphere. Game code owns health, contacts and shield release. */
// Copy this file once; select the named variant before prepare, then reuse the definition. Game code owns contacts, damage and cancellation.
export function createEnergyShield(
  id: string,
  options: {
    readonly shape?: 'wall' | 'dome';
    readonly duration?: number;
    readonly previewHits?: boolean;
  } = {},
): VfxDefinition {
  if ((options.shape ?? 'wall') === 'wall') return createBarrierField(id, options);
  if (options.shape === 'dome') return createBarrierProjector(id, options);
  throw new Error('Unknown energy shield shape.');
}
const WIDTH = 5.2;
const HEIGHT = 3.2;
/** Shared placement for the copied visual and gameplay raycast surface. */
export const barrierFieldOrigin = [0, 1.75, 0.45] as const;
const CRACKS = vfxTexture('crack-thin-network-4');
const HEX = vfxTexture('noise-hex-outline-2');
/** On full repair, set each hitAt slot to -10 before setting integrity=1. */
export const barrierHitSlots = 3;
const IMPACTS = [
  { time: 1.15, point: [0.76, 0.72] as const },
  { time: 2.2, point: [0.3, 0.56] as const },
  { time: 3.25, point: [0.64, 0.35] as const },
] as const;
interface BarrierState {
  readonly hits: readonly BarrierHit[];
  readonly integrity: Node<'float'>;
  readonly rupture: Node<'vec3'>;
  readonly preview: boolean;
}
interface BarrierHit {
  readonly time: Node<'float'>;
  readonly point: readonly [number | Node<'float'>, number | Node<'float'>];
}
/** Local UV contacts from a raycast; outside the visible rounded screen is not blocked. */
export function barrierHitParams(
  slot: number,
  point: readonly [number, number],
  elapsedSeconds: number,
): Readonly<Record<string, number>> | undefined {
  if (
    !Number.isInteger(slot) ||
    slot < 0 ||
    !Number.isFinite(elapsedSeconds) ||
    elapsedSeconds < 0 ||
    !point.every(Number.isFinite)
  ) {
    throw new Error('Barrier hit needs a nonnegative slot and time, and finite UV coordinates.');
  }
  const [u, v] = point;
  if (
    u < 0 ||
    u > 1 ||
    v < 0 ||
    v > 1 ||
    Math.pow(Math.abs(u - 0.5) * 2, 8) + Math.pow(Math.abs(v - 0.5) * 2, 8) >= 0.995
  )
    return undefined;
  const index = slot % barrierHitSlots;
  return { [`hitU${index}`]: u, [`hitV${index}`]: v, [`hitAt${index}`]: elapsedSeconds };
}
/** End the intact surface at a real contact; the copied game releases protection at the same event. */
export function barrierCollapseParams(
  point: readonly [number, number],
  elapsedSeconds: number,
): Readonly<Record<string, number | readonly [number, number, number]>> | undefined {
  return barrierHitParams(0, point, elapsedSeconds) === undefined
    ? undefined
    : { integrity: 0, rupture: [point[0], point[1], elapsedSeconds] };
}
/** Bowed, tapered screen in the unscaled plane's local space. Deploy scales X and Y only. */
export function barrierFieldGeometry(): {
  readonly shading: 'smooth';
  readonly positions: number[];
  readonly uvs: number[];
  readonly indices: number[];
} {
  const geometry = new PlaneGeometry(WIDTH, HEIGHT, 64, 32);
  const position = geometry.getAttribute('position');
  for (let index = 0; index < position.count; index += 1) {
    const y = position.getY(index);
    const x = position.getX(index) * (1 - 0.08 * (y / (HEIGHT / 2)) ** 2);
    position.setXYZ(index, x, y, 0.28 * (1 - (x / (WIDTH / 2)) ** 2));
  }
  const result = {
    shading: 'smooth' as const,
    positions: Array.from(position.array),
    uvs: Array.from(geometry.getAttribute('uv').array),
    indices: Array.from(geometry.index?.array ?? []),
  };
  geometry.dispose();
  return result;
}
/** Maps UV coordinates, including off-screen aim points, into local metres on the deployed surface. */
export function barrierFieldSurfacePoint(
  point: readonly [number, number],
): readonly [number, number, number] {
  if (!point.every(Number.isFinite)) throw new Error('Barrier surface UVs must be finite.');
  const sourceX = (point[0] - 0.5) * WIDTH;
  const sourceY = (point[1] - 0.5) * HEIGHT;
  const vertical = sourceY / (HEIGHT / 2);
  const taper = 1 - 0.08 * vertical * vertical;
  const x = sourceX * taper;
  const normalizedX = x / (WIDTH / 2);
  const bow = 0.28 * (1 - normalizedX * normalizedX);
  return [x, barrierFieldOrigin[1] + sourceY, barrierFieldOrigin[2] + bow];
}
/** Ease the screen deployment in its authored local space. */
function screenPlacement(ctx: VfxParticleContext): Node<'vec3'> {
  const local = ctx.positionLocal as Node<'vec3'>;
  const deploy = tslClamp((ctx.age as Node<'float'>).sub(0.12).div(0.18), 0, 1);
  const ease = tslOneMinus(tslPow(tslOneMinus(deploy), float(3)));
  return vec3(
    local.x.mul(ease.mul(0.88).add(0.12)),
    local.y.mul(ease.mul(0.92).add(0.08)),
    local.z.mul(float(1)),
  );
}
function band(value: Node<'float'>, edge0: number, edge1: number): Node<'float'> {
  return tslSmoothstep(float(edge0), float(edge1), value);
}
function viewRim(exponent: number): Node<'float'> {
  const facing = tslNormalize(positionView.mul(-1));
  return tslPow(tslOneMinus(tslAbs(tslDot(normalView, facing))), float(exponent));
}
function screenLook(state: BarrierState, duration: number): VfxLayerLook {
  return {
    textures: {
      hex: { texture: HEX, colorSpace: 'linear' },
      cracks: { texture: CRACKS, colorSpace: 'linear' },
    },
    colorNode(ctx) {
      const shade = screenShade(ctx, state, duration);
      const body = tslMix(vec3(0.025, 0.3, 0.75), vec3(0.008, 0.07, 0.16), shade.border.mul(0.8))
        .add(vec3(0.04, 0.4, 0.9).mul(shade.edgeGlow))
        .add(vec3(0.03, 0.28, 0.85).mul(tslMin(shade.hitRing, 1)));
      const warning = tslMix(
        body,
        vec3(0.12, 0.025, 0.006).add(vec3(0.9, 0.24, 0.015).mul(shade.edgeGlow)),
        shade.warning.mul(shade.border),
      );
      return tslMix(warning, vec3(0.008, 0.012, 0.018), shade.crackEdge)
        .add(tslMix(vec3(0.08, 0.35, 0.7), vec3(0.65, 0.2, 0.025), shade.warning).mul(shade.cracks))
        .add(vec3(1.5, 2, 2.5).mul(shade.hitFlash));
    },
    opacityNode: (ctx) => screenShade(ctx, state, duration).alpha,
  };
}
function screenShade(ctx: VfxParticleContext, state: BarrierState, duration: number) {
  const surface = tslUv();
  const uvX = surface.x as Node<'float'>;
  const uvY = surface.y as Node<'float'>;
  const clock = ctx.age as Node<'float'>;
  const edge = (axis: Node<'float'>): Node<'float'> =>
    tslPow(tslAbs(axis.sub(0.5)).mul(2), float(8));
  const shape = edge(uvX).add(edge(uvY));
  const silhouette = tslOneMinus(band(shape, 0.9, 0.995));
  const border = band(shape, 0.56, 0.9).mul(silhouette);
  const cells = lookSample(ctx, 'hex', tslFract(surface.mul(tslVec2(WIDTH, HEIGHT)))).x;
  const fresnel = viewRim(2.5);
  let hitRing = float(0) as Node<'float'>;
  let hitFlash = float(0) as Node<'float'>;
  let hitCells = float(0) as Node<'float'>;
  let scars = float(0) as Node<'float'>;
  for (const impact of state.hits) {
    const dx = uvX.sub(impact.point[0]).mul(WIDTH);
    const dy = uvY.sub(impact.point[1]).mul(HEIGHT);
    const distance = tslLength(tslVec2(dx, dy));
    const age = clock.sub(impact.time);
    const active = band(age, 0, 0.012);
    scars = scars.max(
      tslOneMinus(band(distance, 0.15, 0.9)).mul(impact.time.greaterThanEqual(0).select(active, 0)),
    );
    const life = active.mul(tslOneMinus(band(age, 0.16, 0.62)));
    const radius = tslClamp(age, 0, 1).mul(2.6).add(0.04);
    hitRing = hitRing.add(tslOneMinus(band(tslAbs(distance.sub(radius)), 0.025, 0.09)).mul(life));
    hitCells = hitCells.add(
      tslOneMinus(band(distance, 0.12, 0.7))
        .mul(active)
        .mul(tslOneMinus(band(age, 0.08, 0.42))),
    );
    const flashLife = active.mul(tslOneMinus(band(age, 0.035, 0.16)));
    hitFlash = hitFlash.add(tslOneMinus(band(distance, 0.015, 0.28)).mul(flashLife));
  }
  const health = state.preview
    ? tslMin(state.integrity, tslOneMinus(band(clock, 2.1, 2.2).mul(0.82)))
    : state.integrity;
  const strain = tslOneMinus(health);
  const warning = band(strain, 0.65, 0.85).mul(tslSin(clock.mul(11)).mul(0.15).add(0.85));
  const deathAge = clock.sub(state.rupture.z);
  const fracture = lookSample(ctx, 'cracks', surface.mul(tslVec2(1.5, 1))).x;
  const damage = band(strain, 0.15, 0.8).mul(scars.mul(0.8).add(0.2));
  let crackEdge = band(fracture.add(fwidth(fracture)), 0.4, 0.72).mul(damage);
  const cracks = band(fracture, 0.68, 0.92).mul(damage).mul(deathAge.lessThan(0).select(1, 0));
  const phase = tslClamp(deathAge.div(0.32), 0, 1);
  const radius = tslLength(surface.sub(state.rupture.xy).mul(tslVec2(WIDTH, HEIGHT)));
  const waveDistance = tslAbs(radius.sub(phase.mul(7)).add(fracture.mul(0.09)));
  const releaseLife = tslOneMinus(phase).mul(deathAge.greaterThanEqual(0).select(1, 0));
  const releaseEdge = tslOneMinus(band(waveDistance, 0.06, 0.2)).mul(releaseLife);
  const breakFront = tslOneMinus(band(waveDistance, 0.015, 0.055))
    .mul(cells.mul(0.75).add(0.25))
    .add(tslOneMinus(band(radius, 0.04, 0.4)).mul(tslOneMinus(band(deathAge, 0.025, 0.09))))
    .mul(releaseLife);
  hitFlash = hitFlash.add(breakFront);
  crackEdge = deathAge.greaterThanEqual(0).select(releaseEdge, crackEdge);
  const remaining = tslSmoothstep(phase.mul(7).sub(0.15), phase.mul(7).add(0.15), radius);
  const coverage = float(0.018)
    .add(fresnel.mul(0.06))
    .add(border.mul(0.88))
    .add(cells.mul(float(0.025).add(hitCells.mul(0.55))))
    .add(hitRing.mul(cells.mul(0.4).add(0.6)).mul(0.85))
    .add(hitFlash.mul(0.55))
    .add(crackEdge.mul(0.9));
  const visibility = band(clock, 0.12, 0.165).mul(
    tslOneMinus(band(clock, duration - 0.75, duration - 0.45)),
  );
  const edgeGlow = band(shape, 0.82, 0.92).mul(silhouette);
  const brokenCoverage = cells
    .mul(0.38)
    .add(border.mul(0.08))
    .mul(remaining)
    .mul(tslOneMinus(phase))
    .add(releaseEdge.mul(0.9))
    .add(breakFront.mul(0.55));
  const alpha = tslClamp(deathAge.greaterThanEqual(0).select(brokenCoverage, coverage), 0, 0.96)
    .mul(silhouette)
    .mul(visibility);
  return { hitRing, hitFlash, border, edgeGlow, alpha, warning, cracks, crackEdge };
}
/** Forward energy chips; the caller supplies the committed pose at emission. */
function emitBarrierFragments(fx: VfxKitBuilder, position: Vec3, delay = 0): void {
  fx.particles({
    capacity: 18,
    bursts: [{ time: 0, count: 18 }],
    delay,
    startLife: [0.24, 0.42],
    startSize: [0.1, 0.18],
    startSpeed: [3, 5.2],
    direction: [0, 0, 1],
    spread: 0.45,
    drag: 2,
    simulationSpace: 'world',
    mesh: { geometry: 'diamond', side: 'front', orient: 'random', scale: [0.55, 1, 0.2] },
    map: vfxTexture('solid'),
    blend: 'alpha',
    tint: [0.08, 0.45, 1, 1],
    emission: 1.6,
    sizeOverLife: curve([0, 1], [0.6, 1], [1, 0]),
    opacityOverLife: [
      { t: 0, v: 1 },
      { t: 0.3, v: 0.9 },
      { t: 1, v: 0 },
    ],
    rotation: { start: [0, Math.PI * 2], spin: [-8, 8] },
    transform: { position },
  });
}
/** A separate committed world burst. Play unparented at the contact; local +Z points outward. No collision. */
export function createBarrierBreak(id: string): VfxDefinition {
  return defineVfx({
    id,
    duration: 0.48,
    maxInstances: 8,
    seed: 83,
    build(fx) {
      emitBarrierFragments(fx, [0, 0, 0]);
    },
  });
}
/** Create once from this copied file. Preview hits are optional; gameplay supplies actual contact UVs and local elapsed time. */
export function createBarrierField(
  id: string,
  options: {
    readonly duration?: number;
    readonly previewHits?: boolean;
  } = {},
): VfxDefinition {
  const duration = options.duration ?? 5;
  if (!Number.isFinite(duration) || duration < 1.2)
    throw new Error('Barrier duration must be at least 1.2 seconds.');
  const params: Record<
    string,
    {
      default: number | readonly [number, number, number];
      min?: number;
      max?: number;
    }
  > = {
    integrity: { default: 1, min: 0, max: 1 },
    rupture: {
      default: options.previewHits
        ? [IMPACTS[2].point[0], IMPACTS[2].point[1], IMPACTS[2].time]
        : [0.5, 0.5, duration + 1],
    },
  };
  for (let index = 0; index < barrierHitSlots; index += 1) {
    const preview = options.previewHits ? IMPACTS[index] : undefined;
    params[`hitAt${index}`] = { default: preview?.time ?? -10, min: -10, max: duration };
    params[`hitU${index}`] = { default: preview?.point[0] ?? 0.5, min: 0, max: 1 };
    params[`hitV${index}`] = { default: preview?.point[1] ?? 0.5, min: 0, max: 1 };
  }
  return defineVfx({
    id,
    duration,
    seed: 71,
    maxInstances: 4,
    params,
    build(fx) {
      const state: BarrierState = {
        hits: Array.from({ length: barrierHitSlots }, (_, index) => ({
          time: fx.param(`hitAt${index}`) as Node<'float'>,
          point: [
            fx.param(`hitU${index}`) as Node<'float'>,
            fx.param(`hitV${index}`) as Node<'float'>,
          ],
        })),
        integrity: fx.param('integrity') as Node<'float'>,
        rupture: fx.param('rupture') as Node<'vec3'>,
        preview: options.previewHits === true,
      };
      fx.particles({
        blend: 'alpha',
        startLife: duration,
        startSize: 1,
        tint: [1, 1, 1, 1],
        emission: 1,
        colorSource: 'tint',
        map: vfxTexture('solid'),
        mesh: { geometry: barrierFieldGeometry(), side: 'double' },
        look: { ...screenLook(state, duration), positionNode: screenPlacement },
        transform: { position: barrierFieldOrigin },
        rotation: { start: 0 },
      });
      if (options.previewHits)
        emitBarrierFragments(fx, barrierFieldSurfacePoint(IMPACTS[2].point), IMPACTS[2].time);
    },
  });
}
/** Radius in authored local metres; the open ring is grounded at local y=0. */
export const projectorRadius = 2.8;
/** Local centre of the sphere clipped by the floor. */
export const projectorCenter = [0, -0.2, 0] as const;
/** Shared visual timing for a copied game's deployment and expiry windows. */
export const projectorTiming = {
  deployStart: 0.45,
  deployed: 0.65,
  fadeDuration: 0.35,
  expiryTail: 0.5,
} as const;
const THETA_LENGTH = Math.acos(-projectorCenter[1] / projectorRadius);
const HIT_SLOTS = 3;
const OUTLINE = vfxTexture('noise-hex-outline-1');
const CELLS = vfxTexture('noise-hex-filled-2');
const DOME_CRACKS = vfxTexture('crack-fullfield-1');
const STRIKES = (
  [
    [0.4, 0.45, 0.8],
    [-0.6, 0.35, 0.7],
    [0.15, 0.8, 0.5],
  ] as const
).map((raw, index) => ({
  time: 1.2 + index * 1.1,
  point: new Vector3(...raw).normalize().toArray(),
}));
function geometryData(geometry: BufferGeometry) {
  const data = {
    shading: 'smooth' as const,
    positions: Array.from(geometry.getAttribute('position').array),
    uvs: Array.from(geometry.getAttribute('uv').array),
    indices: Array.from(geometry.index?.array ?? []),
  };
  geometry.dispose();
  return data;
}
/** Copy this same clipped mesh for game-owned raycasts; the visual scales during deployment. */
export function projectorGeometry(): {
  readonly shading: 'smooth';
  readonly positions: number[];
  readonly uvs: number[];
  readonly indices: number[];
} {
  const width = 72,
    height = 36;
  const geometry = new SphereGeometry(
    projectorRadius,
    width,
    height,
    0,
    Math.PI * 2,
    0,
    THETA_LENGTH,
  );
  const positions = geometry.getAttribute('position');
  // Keep the UV seam's duplicate vertices coincident for segment raycasts.
  for (let row = 0; row <= height; row++) {
    const first = row * (width + 1),
      last = first + width;
    positions.setXYZ(last, positions.getX(first), positions.getY(first), positions.getZ(first));
  }
  return geometryData(geometry.translate(...projectorCenter));
}
/** A local point on the deployed dome and seconds since cast update one of three recent contact slots. */
export function projectorHitParams(
  slot: number,
  point: readonly [number, number, number],
  elapsedSeconds: number,
): Readonly<Record<string, number | readonly [number, number, number]>> | undefined {
  if (
    !Number.isInteger(slot) ||
    slot < 0 ||
    !Number.isFinite(elapsedSeconds) ||
    elapsedSeconds < 0 ||
    !point.every(Number.isFinite)
  )
    throw new Error(
      'Projector hit needs a nonnegative slot and time, and finite local coordinates.',
    );
  const direction = new Vector3(...point).sub(new Vector3(...projectorCenter));
  if (point[1] < -0.005 || Math.abs(direction.length() - projectorRadius) > 0.02) return undefined;
  return {
    [`hitDirection${slot % HIT_SLOTS}`]: direction.normalize().toArray(),
    [`hitAt${slot % HIT_SLOTS}`]: elapsedSeconds,
  };
}
interface ProjectorHit {
  readonly point: Node<'vec3'>;
  readonly time: Node<'float'>;
}
const BOLT_WINDOW = 0.4;
const BOLT_SPEED = 10;
const BOLT_MESH = geometryData(new SphereGeometry(0.055, 12, 8));
const boltColor = new Color(0xffb650);
const BOLT_TINT = [boltColor.r, boltColor.g, boltColor.b, 1] as const;
function directionNode(): Node<'vec3'> {
  const surface = uv();
  const theta = oneMinus(surface.y).mul(THETA_LENGTH),
    phi = surface.x.mul(Math.PI * 2);
  return normalize(vec3(sin(theta).mul(-1).mul(cos(phi)), cos(theta), sin(theta).mul(sin(phi))));
}
function domePlacement(ctx: VfxParticleContext): Node<'vec3'> {
  const deploy = clamp(
    (ctx.age as Node<'float'>)
      .sub(projectorTiming.deployStart)
      .div(projectorTiming.deployed - projectorTiming.deployStart),
    0,
    1,
  );
  return (ctx.positionLocal as Node<'vec3'>).mul(
    clamp(oneMinus(pow(oneMinus(deploy), 3)), 0.001, 1),
  );
}
function domeShade(
  ctx: VfxParticleContext,
  hits: readonly ProjectorHit[],
  duration: number,
  integrity: Node<'float'>,
  preview: boolean,
) {
  const surface = uv(),
    direction = directionNode(),
    clock = ctx.age as Node<'float'>;
  const latitude = direction.y as Node<'float'>;
  const height = latitude.mul(projectorRadius).add(projectorCenter[1]);
  const groundDistance = abs(height);
  const groundEdge = oneMinus(band(groundDistance, 0.015, 0.065));
  const groundHalo = oneMinus(band(groundDistance, 0.04, 0.14));
  const polarFade = oneMinus(band(latitude, 0.78, 0.98));
  const tiled = surface.mul(vec2(4, 2));
  const lines = lookSample(ctx, 'outline', tiled).x,
    cells = lookSample(ctx, 'cells', tiled).x;
  const fresnel = pow(oneMinus(abs(dot(normalView, normalize(positionView.mul(-1))))), 3);
  const rim = band(fresnel, 0.2, 0.75),
    rimCore = band(fresnel, 0.8, 0.98);
  const health = preview ? min(integrity, oneMinus(band(clock, 2.1, 2.3).mul(0.82))) : integrity;
  const strain = oneMinus(clamp(health, 0, 1));
  const warning = band(strain, 0.65, 0.85).mul(sin(clock.mul(9)).mul(0.12).add(0.88));
  const strainCracks = band(
    lookSample(ctx, 'cracks', vec2(surface.x.mul(2).mod(1), surface.y)).x,
    0.12,
    0.45,
  )
    .mul(band(strain, 0.15, 0.85))
    .mul(polarFade);
  let rings = float(0) as Node<'float'>,
    flashes = float(0) as Node<'float'>;
  let litCells = float(0) as Node<'float'>,
    fracture = float(0) as Node<'float'>;
  for (const hit of hits) {
    const age = clock.sub(hit.time),
      active = band(age, 0, 0.012).mul(hit.time.greaterThanEqual(0).select(1, 0));
    const distance = acos(clamp(dot(direction, hit.point), -1, 1)).mul(projectorRadius);
    const life = active.mul(oneMinus(band(age, 0.12, 0.65)));
    rings = rings.add(
      oneMinus(band(abs(distance.sub(clamp(age, 0, 1).mul(2.8))), 0.035, 0.12)).mul(life),
    );
    flashes = flashes.add(
      oneMinus(band(distance, 0.035, 0.35))
        .mul(active)
        .mul(oneMinus(band(age, 0.035, 0.15))),
    );
    litCells = litCells.add(
      oneMinus(band(distance, 0.2, 0.8))
        .mul(active)
        .mul(oneMinus(band(age, 0.08, 0.4))),
    );
    const helper = mix(vec3(0, 1, 0), vec3(1, 0, 0), band(abs(hit.point.y), 0.94, 0.98));
    const right = normalize(cross(helper, hit.point)),
      up = cross(hit.point, right);
    const patchUv = vec2(dot(direction, right), dot(direction, up))
      .mul(projectorRadius / 1.5)
      .add(0.5);
    const reach = band(age, 0, 0.3).mul(0.8).add(0.15);
    const patch = oneMinus(smoothstep(reach.sub(0.12), reach, distance)).mul(active);
    fracture = fracture.add(band(lookSample(ctx, 'cracks', patchUv).x, 0.12, 0.45).mul(patch));
  }
  const coverage = float(0.012)
    .add(fresnel.mul(0.28))
    .add(rim.mul(0.45))
    .add(groundHalo.mul(0.65))
    .add(lines.mul(polarFade).mul(litCells.mul(0.5).add(0.008)))
    .add(rings.mul(cells.mul(0.4).add(0.6)).mul(0.7))
    .add(flashes.mul(0.7))
    .add(fracture.mul(0.65))
    .add(strainCracks.mul(0.7));
  const visibility = band(
    clock,
    projectorTiming.deployStart,
    projectorTiming.deployStart + 0.04,
  ).mul(
    oneMinus(
      band(
        clock,
        duration - projectorTiming.expiryTail - projectorTiming.fadeDuration,
        duration - projectorTiming.expiryTail,
      ),
    ),
  );
  return {
    groundEdge,
    groundHalo,
    rings,
    flashes,
    fracture,
    rim,
    rimCore,
    warning,
    strainCracks,
    alpha: clamp(coverage, 0, 0.92).mul(visibility),
  };
}
function domeSurface(
  hits: readonly ProjectorHit[],
  duration: number,
  integrity: Node<'float'>,
  preview: boolean,
): VfxLayerLook {
  return {
    textures: {
      outline: { texture: OUTLINE, colorSpace: 'linear', wrap: 'repeat' },
      cells: { texture: CELLS, colorSpace: 'linear', wrap: 'repeat' },
      cracks: { texture: DOME_CRACKS, colorSpace: 'linear', wrap: 'clamp' },
    },
    colorNode(ctx) {
      const shade = domeShade(ctx, hits, duration, integrity, preview);
      const edgeColor = mix(vec3(0.06, 0.55, 1.1), vec3(1.4, 0.43, 0.025), shade.warning);
      const base = mix(
        mix(vec3(0.025, 0.18, 0.5), vec3(0.006, 0.035, 0.09), shade.groundHalo.mul(0.8)),
        vec3(0.004, 0.018, 0.04),
        shade.rim,
      )
        .add(edgeColor.mul(shade.rimCore.mul(0.85).add(shade.groundEdge)))
        .add(vec3(0.05, 0.4, 1).mul(shade.rings));
      return mix(base, vec3(0.008, 0.02, 0.045), shade.fracture.add(shade.strainCracks).clamp(0, 1))
        .add(vec3(0.15, 0.6, 1.2).mul(pow(shade.fracture, 3)))
        .add(edgeColor.mul(pow(shade.strainCracks, 3)))
        .add(vec3(1.2, 1.8, 2.4).mul(shade.flashes));
    },
    opacityNode: (ctx) => domeShade(ctx, hits, duration, integrity, preview).alpha,
    positionNode: domePlacement,
  };
}
/** Prepare once from this copied file; gameplay supplies real local contact points and cast-relative times. */
export function createBarrierProjector(
  id: string,
  options: {
    readonly duration?: number;
    readonly previewHits?: boolean;
  } = {},
): VfxDefinition {
  const duration = options.duration ?? 6;
  if (!Number.isFinite(duration) || duration < 1.6)
    throw new Error('Projector duration must be at least 1.6 seconds.');
  const strikes = options.previewHits
    ? STRIKES.filter((strike) => strike.time < duration - projectorTiming.expiryTail)
    : [];
  const params: Record<
    string,
    {
      default: number | readonly [number, number, number];
      min?: number;
      max?: number;
    }
  > = { integrity: { default: 1, min: 0, max: 1 } };
  for (let index = 0; index < HIT_SLOTS; index++) {
    const preview = strikes[index];
    params[`hitAt${index}`] = { default: preview?.time ?? -10, min: -10, max: duration };
    params[`hitDirection${index}`] = { default: preview?.point ?? [0, 1, 0] };
  }
  return defineVfx({
    id,
    duration,
    maxInstances: 4,
    seed: 73,
    params,
    build(fx) {
      const hits = Array.from({ length: HIT_SLOTS }, (_, index) => ({
        point: fx.param(`hitDirection${index}`) as Node<'vec3'>,
        time: fx.param(`hitAt${index}`) as Node<'float'>,
      }));
      fx.particles({
        blend: 'alpha',
        startLife: duration,
        startSize: 1,
        tint: [1, 1, 1, 1],
        emission: 1,
        colorSource: 'tint',
        map: vfxTexture('solid'),
        mesh: { geometry: projectorGeometry(), side: 'double' },
        look: domeSurface(
          hits,
          duration,
          fx.param('integrity') as Node<'float'>,
          options.previewHits === true,
        ),
      });
      for (const strike of strikes) {
        const point = new Vector3(...strike.point)
          .multiplyScalar(projectorRadius + BOLT_WINDOW * BOLT_SPEED)
          .add(new Vector3(...projectorCenter));
        fx.particles({
          delay: strike.time - BOLT_WINDOW,
          startLife: BOLT_WINDOW,
          startSpeed: BOLT_SPEED,
          direction: [-strike.point[0], -strike.point[1], -strike.point[2]],
          startSize: 1,
          tint: BOLT_TINT,
          emission: 1,
          colorSource: 'tint',
          map: vfxTexture('solid'),
          mesh: {
            geometry: BOLT_MESH,
            side: 'front',
            orient: 'velocity',
            orientAxis: 'z',
            opaque: true,
            scale: [1, 1, 5],
          },
          blend: 'alpha',
          transform: { position: point.toArray() },
        });
      }
    },
  });
}
export default createEnergyShield('example.shield');
