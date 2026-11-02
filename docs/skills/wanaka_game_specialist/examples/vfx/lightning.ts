// intent: Chain lightning, independent chain contacts and sky strikes.
// variants: createChainContact, createChainLightning, createVarietyLightning
// inputs: Actual chain endpoints or confirmed sky-strike point/height; contacts and damage remain game-owned.
// Copy dependencies: none.
// Setup in an async scene: const effect = createChainLightning('example.lightning');
// const vfx = useVfx(context); await vfx.prepare(effect, {});
// const handle = vfx.play(effect, playOptions);
// Import useVfx from wanaka-studio-engine/vfx; construct playOptions from the recipe notes and real game inputs.
// Moving chain integration: prepare createChainLightning(id, { points: initialPoints })
// and createChainContact(id + '.contact') before combat. Use 2-9 actual socket positions;
// keep point count fixed per play and prepare another definition when it changes.
// Play unparented at the world origin with params: chainEndpointParams(worldPoints).
// After animation, update declared endpoints from the same helper:
// for (const [name, value] of Object.entries(chainEndpointParams(worldPoints)))
//   handle.setParam(name, value);
// With a transformed effect frame, convert every endpoint into that frame first.
// Only confirmed gameplay hops play contact at the real hit position with a distinct seed;
// chainTiming is visual cadence, not damage timing. Retain contact handles per cast and
// stop them with the chain on cancellation; natural completion can leave contact tails.
// Skip parameter writes after the chain leaves playing; gameplay owns valid targets.
import {
  curve,
  defineVfx,
  vfxTexture,
  type Vec3,
  type VfxDefinition,
  BURST_SIZE,
  RANDOM_YAW,
  type VfxKitBuilder,
} from 'wanaka-studio-engine/vfx';
import type { Node } from 'three/webgpu';
import { vfxPlaneClip } from 'wanaka-studio-engine/vfx';
export const chainTiming = {
  hopInterval: 0.12,
  travel: 0.04,
  arcLife: 0.28,
  contactLife: 0.32,
} as const;
const PREVIEW_POINTS: readonly Vec3[] = [
  [-2.6, 0.9, 0.82],
  [-1, 0.9, -0.28],
  [0.7, 0.9, 1.12],
  [2.3, 0.9, -0.48],
  [2.8, 0.9, 1.72],
];
const BLUE = [0.12, 0.5, 1, 1] as const;
function copyPoints(points: readonly Vec3[]): Vec3[] {
  if (
    points.length < 2 ||
    points.length > 9 ||
    points.some((p) => p.length !== 3 || !p.every(Number.isFinite))
  )
    throw new Error('Chain lightning needs 2 to 9 finite 3D points.');
  return points.map((p) => [...p] as Vec3);
}
/** Initial play.params and later setParam updates use the same copied endpoint names. */
export function chainEndpointParams(input: readonly Vec3[]): Readonly<Record<string, Vec3>> {
  const points = copyPoints(input),
    parameters: Record<string, Vec3> = {};
  for (let hop = 0; hop < points.length - 1; hop++) {
    const origin = points[hop],
      target = points[hop + 1];
    if (!origin || !target) throw new Error('Chain lightning endpoint is missing.');
    parameters[`hop${hop}Origin`] = origin;
    parameters[`hop${hop}Target`] = target;
  }
  return parameters;
}
function addContact(fx: VfxKitBuilder, position: Vec3, delay = 0): void {
  const transform = { position };
  fx.particles({
    delay,
    transform,
    startLife: 0.065,
    startSize: 0.42,
    sizeOverLife: curve([0, 0.85], [0.12, 1], [1, 0]),
    colorOverLife: [
      { t: 0, rgba: [1, 1, 1, 1] },
      { t: 0.25, rgba: [1, 1, 1, 1] },
      { t: 1, rgba: [0.2, 0.5, 1, 0] },
    ],
    map: vfxTexture('flash-radial-spikes-6'),
    tint: [0.8, 0.95, 1.2, 1],
    emission: 1.4,
    orderInLayer: 20,
    rotation: { start: RANDOM_YAW },
  });
  fx.particles({
    delay,
    transform,
    capacity: 2,
    startLife: 0.18,
    startSize: [0.42, 0.7],
    sizeOverLife: BURST_SIZE,
    map: vfxTexture('lightning-held-arcs-5'),
    tint: BLUE,
    emission: 1.2,
    orderInLayer: 10,
    rotation: { start: RANDOM_YAW },
  });
  fx.particles({
    delay,
    transform,
    capacity: 12,
    startLife: [0.16, 0.3],
    startSpeed: [1.2, 2.4],
    startSize: [0.012, 0.025],
    sizeOverLife: BURST_SIZE,
    spread: 1,
    radial: 'outward',
    shape: { type: 'sphere', radius: [0.015, 0.035] },
    simulationSpace: 'world',
    mode: 'stretched',
    stretch: { speedFactor: 1.2, lengthFactor: 3 },
    map: vfxTexture('point-solid-2'),
    tint: BLUE,
    emission: 1.5,
    orderInLayer: 15,
  });
}
/** Contact is a game event; the arc itself does not resolve damage or choose targets. */
export function createChainContact(id: string): VfxDefinition {
  return defineVfx({
    id,
    duration: chainTiming.contactLife,
    maxInstances: 16,
    seed: 97,
    build(fx) {
      addContact(fx, [0, 0, 0]);
    },
  });
}
/** Prepare one copy for each hop count you use, then supply real endpoint positions per play. */
// Copy this file. createChainLightning(id, { points }) starts with no staged impacts; its endpoint parameters are hop0Origin/hop0Target, hop1Origin/hop1Target, and so on.
// Play at the scene origin with initial endpoints in play.params, then update them through handle.setParam from real target sockets. Convert world points to effect-local coordinates if you use a transformed parent.
// Prepare createChainContact separately and play it at each actual game-confirmed contact. Stop the chain and any owned contact handles on cancellation. Supply actual points and leave previewContacts off; preview contacts are never gameplay hits.
export function createChainLightning(
  id: string,
  options: {
    readonly points?: readonly Vec3[];
    readonly previewContacts?: boolean;
  } = {},
): VfxDefinition {
  const points = copyPoints(options.points ?? PREVIEW_POINTS);
  const lastDelay = (points.length - 2) * chainTiming.hopInterval;
  return defineVfx({
    id,
    seed: 31,
    maxInstances: 4,
    duration:
      lastDelay +
      Math.max(
        chainTiming.arcLife,
        options.previewContacts ? chainTiming.travel + chainTiming.contactLife : 0,
      ),
    build(fx) {
      for (let index = 0; index < points.length - 1; index++) {
        const origin = points[index],
          target = points[index + 1];
        if (!origin || !target) throw new Error('Chain lightning endpoint is missing.');
        const delay = index * chainTiming.hopInterval;
        const shared = {
          origin,
          target,
          delay,
          originParam: `hop${index}Origin`,
          targetParam: `hop${index}Target`,
          forks: 2,
          generations: 2,
          jitterHz: 20,
          seed: 31 + index * 97,
          life: chainTiming.arcLife,
          travel: chainTiming.travel,
          orderInLayer: 42,
        };
        fx.arc({
          ...shared,
          id: `hop-${index}-underlay`,
          blend: 'alpha',
          orderInLayer: 40,
          size: 0.18,
          tint: [0.003, 0.012, 0.03, 1],
        });
        fx.arc({ ...shared, id: `hop-${index}-halo`, size: 0.115, tint: [0.04, 0.25, 1.2, 1] });
        fx.arc({ ...shared, id: `hop-${index}-core`, size: 0.042, tint: [2.2, 2.7, 3.4, 1] });
        if (options.previewContacts) addContact(fx, target, delay + chainTiming.travel);
      }
    },
  });
}
/** Visual electrical pulse times in seconds; gameplay owns the actual hit event. */
export const varietyLightningTiming = { first: 0.13, restrike: 0.15, second: 0.085 } as const;
const ATLAS = { columns: 4, rows: 4, loop: false } as const;
/** Returns an upright strike of 2–12 metres; grounded variants add compact flat-contact feedback. */
// Copy this file; prepare createVarietyLightning(id, height, grounded) once. Play unparented at the confirmed impact with identity rotation and unit scale; world +Y points toward the authored sky source. Height is visual extent, not damage range.
// Trigger on the game-confirmed strike event; no charge or damage schedule is authored. grounded=false omits floor dust and smoke for airborne targets. Grounded mode requires a horizontal receiving contact.
// Optional params.surfaceNormal and surfaceDistance are a unit world receiving-plane normal and dot(normal, contact); zero normal disables particle-centre clipping. No scene collision or bounce is implied.
// Game code owns target selection, damage, audio and camera response. stop({ immediate: true }) cancels all layers; await handle.finished for completion. Play seed varies particles; the paired arc layers share prepared pulse seeds.
export function createVarietyLightning(id: string, height = 4.5, grounded = true): VfxDefinition {
  if (!Number.isFinite(height) || height < 2 || height > 12)
    throw new Error('Lightning height must be between 2 and 12 metres.');
  return defineVfx({
    id,
    duration: 0.85,
    maxInstances: 4,
    seed: 113,
    params: { surfaceNormal: { default: [0, 0, 0] }, surfaceDistance: { default: 0 } },
    build(fx) {
      const clip = vfxPlaneClip(
        fx.param('surfaceNormal') as Node<'vec3'>,
        fx.param('surfaceDistance') as Node<'float'>,
        [-0.015, 0.025],
      );
      for (const pulse of [
        { delay: 0, life: varietyLightningTiming.first, seed: 113, gain: 1 },
        {
          delay: varietyLightningTiming.restrike,
          life: varietyLightningTiming.second,
          seed: 137,
          gain: 0.7,
        },
      ]) {
        const common = {
          origin: [0, height, 0] as const,
          target: [0, 0, 0] as const,
          delay: pulse.delay,
          life: pulse.life,
          travel: 0,
          forks: 2,
          generations: 2,
          jitterHz: 45,
          seed: pulse.seed,
        };
        fx.arc({
          ...common,
          id: `corona-${pulse.seed}`,
          size: 0.14,
          tint: [0.06, 0.28, 1.1, 0.3 * pulse.gain],
          blend: 'alpha',
          orderInLayer: 15,
        });
        fx.arc({
          ...common,
          id: `core-${pulse.seed}`,
          size: 0.05,
          tint: [2, 2.7, 3.2, pulse.gain],
          blend: 'alpha',
          orderInLayer: 16,
        });
        fx.light({
          delay: pulse.delay,
          life: pulse.life,
          intensity: 2 * pulse.gain,
          range: 3,
          color: [0.45, 0.65, 1],
          position: [0, grounded ? 0.15 : 0, 0],
          curve: curve([0, 1], [0.3, 0.5], [1, 0]),
        });
      }
      // A low-opacity atlas fringe supports the thin, endpoint-pinned procedural spine.
      fx.particles({
        capacity: 1,
        bursts: [{ time: 0, count: 1 }],
        startLife: varietyLightningTiming.restrike + varietyLightningTiming.second,
        startSize: height,
        aspect: 0.35,
        map: vfxTexture('fx-variety-t-ky-lightning02-4x4'),
        flipbook: ATLAS,
        coverage: 'luminance',
        colorSource: 'tint',
        tint: [0.45, 0.7, 1, 0.4],
        emission: 1.4,
        blend: 'alpha',
        mode: 'vertical',
        transform: { position: [0, height * 0.5, 0] },
        rotation: { enabled: false },
        orderInLayer: 12,
        opacityOverLife: curve([0, 1], [0.65, 0.65], [1, 0]),
      });
      fx.particles({
        capacity: 1,
        bursts: [{ time: 0, count: 1 }],
        startLife: 0.07,
        startSize: 0.65,
        sizeOverLife: curve([0, 0.25], [0.2, 1], [1, 0.4]),
        opacityOverLife: curve([0, 0.8], [0.2, 1], [1, 0]),
        map: vfxTexture('fx-variety-t-ky-flare-a'),
        tint: [0.65, 0.82, 1, 0.8],
        emission: 1.8,
        blend: 'additive',
        transform: { position: [0, grounded ? 0.08 : 0, 0] },
        orderInLayer: 20,
      });
      fx.particles({
        capacity: 12,
        bursts: [{ time: 0, count: 12 }],
        startLife: [0.16, 0.38],
        startSpeed: [1.2, 3.8],
        radial: 'outward',
        shape: { type: grounded ? 'hemisphere' : 'sphere', radius: [0.05, 0.18] },
        startSize: [0.012, 0.035],
        gravity: -6.5,
        drag: 1.3,
        sizeOverLife: curve([0, 0.7], [0.12, 1], [1, 0]),
        opacityOverLife: curve([0, 1], [0.45, 0.8], [1, 0]),
        map: vfxTexture('fx-variety-t-ky-dust-long-star'),
        coverage: 'luminance',
        colorSource: 'tint',
        tint: [0.32, 0.6, 1, 0.85],
        emission: 1.8,
        mode: 'stretched',
        stretch: { speedFactor: 0.045, lengthFactor: 0.25 },
        aspect: 0.2,
        simulationSpace: 'world',
        look: clip,
        transform: { position: [0, grounded ? 0.08 : 0, 0] },
        orderInLayer: 18,
      });
      if (grounded) {
        for (let arm = 0; arm < 6; arm++) {
          const angle = (arm * Math.PI) / 3,
            reach = 0.42 + (arm % 3) * 0.09;
          fx.arc({
            id: `contact-${arm}`,
            origin: [0, 0.03, 0],
            target: [Math.cos(angle) * reach, 0.03, Math.sin(angle) * reach],
            size: 0.035,
            life: 0.11,
            travel: 0,
            forks: 1,
            generations: 1,
            jitterHz: 35,
            seed: 211 + arm * 7,
            tint: [0.3, 0.7, 1.5, 0.85],
            blend: 'alpha',
            orderInLayer: 14,
          });
        }
        fx.particles({
          capacity: 1,
          bursts: [{ time: 0, count: 1 }],
          startLife: 0.32,
          startSize: 1.6,
          sizeOverLife: curve([0, 0.35], [0.3, 1], [1, 1.12]),
          opacityOverLife: curve([0, 0], [0.07, 0.4], [0.5, 0.3], [1, 0]),
          map: vfxTexture('fx-variety-t-ky-lightning-dust01-4x4'),
          flipbook: ATLAS,
          coverage: 'luminance',
          colorSource: 'tint',
          tint: [0.15, 0.4, 0.75, 0.65],
          emission: 0.6,
          blend: 'alpha',
          mode: 'horizontal',
          transform: { position: [0, 0.025, 0] },
          rotation: { start: [0, Math.PI * 2] },
          orderInLayer: 5,
        });
        fx.particles({
          capacity: 4,
          bursts: [{ time: 0, count: 4 }],
          delay: 0.04,
          startLife: [0.4, 0.65],
          startSpeed: [0.3, 0.7],
          direction: [0, 1, 0],
          spread: 0.5,
          shape: { type: 'circle', radius: [0.05, 0.2] },
          startSize: [0.6, 0.95],
          sizeOverLife: curve([0, 0.3], [0.25, 0.75], [1, 1.2]),
          opacityOverLife: curve([0, 0], [0.15, 0.35], [0.6, 0.25], [1, 0]),
          map: vfxTexture('fx-variety-t-ky-smoke1'),
          coverage: 'luminance',
          colorSource: 'tint',
          tint: [0.09, 0.105, 0.13, 0.45],
          emission: 0,
          blend: 'alpha',
          simulationSpace: 'world',
          look: clip,
          transform: { position: [0, 0.15, 0] },
          rotation: { start: [0, Math.PI * 2] },
          orderInLayer: 3,
        });
      }
    },
  });
}
export default createChainLightning('example.lightning');
