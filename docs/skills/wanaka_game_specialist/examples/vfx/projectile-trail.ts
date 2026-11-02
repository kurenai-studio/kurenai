// intent: Recorded live projectile trails and independently confirmed contacts.
// variants: createProjectileTrail (flight), createProjectileTrailContact (confirmed impact).
// inputs: Fixed launch point and per-frame head position in its frame; contact is a separate confirmed event.
// Copy dependencies: none.
// Setup in an async scene: const effect = createProjectileTrail('example.projectile-trail');
// const vfx = useVfx(context); await vfx.prepare(effect, {});
// const handle = vfx.play(effect, playOptions);
// Import useVfx from wanaka-studio-engine/vfx; supply game-owned motion and confirmed events.
import { float,vec3 } from 'three/tsl';
import { type Node } from 'three/webgpu';
import { createVfxPositionHistory,curve,defineVfx,vfxTexture,type Vec3,type VfxBillboardPathPoint,type VfxDefinition,type VfxLayerLook,type VfxParticleContext,type VfxPathSampleContext,type VfxPositionHistory } from 'wanaka-studio-engine/vfx';

export const projectileTrailTailSeconds = 0.28;
const LIMIT = 48;
const STAR_MAP = 'flare-four-point-6';
interface FlightSample {
  readonly trail: readonly VfxBillboardPathPoint[];
  readonly head?: Vec3;
}
/** Records one missile per playback; no target position or collision is inferred by the effect. */
export function createProjectileTrailSampler(
  flightSeconds: number,
  previewIndex?: number,
): (age: number, context?: VfxPathSampleContext) => FlightSample {
  const histories = new WeakMap<
    VfxPathSampleContext,
    {
      age: number;
      history: VfxPositionHistory;
      sample: FlightSample;
    }
  >();
  return (age, context) => {
    if (!context) throw new Error('Projectile trail needs its playback parameter context.');
    let history = histories.get(context);
    if (!history || age < history.age) {
      history = { age: -1, history: createVfxPositionHistory({ lifetime: projectileTrailTailSeconds, maxSamples: LIMIT }), sample: { trail: [] } };
      histories.set(context, history);
    }
    if (age === history.age) return history.sample;
    let recording = context.param('recording') === true;
    let head = context.param('head');
    if (previewIndex !== undefined) {
      const launch = previewIndex * 0.055;
      const t = Math.max(0, Math.min(1, (age - launch) / 1.6));
      const angle = previewIndex * 2.399963;
      head = [
        -2.5 + 5 * t,
        1.2 + Math.sin(Math.PI * t) * (0.8 + Math.cos(angle) * 0.6),
        Math.sin(Math.PI * t) * Math.sin(angle) * 1.8,
      ];
      recording = age >= launch && age <= launch + 1.6;
    }
    if (!Array.isArray(head) || head.length !== 3 || !head.every(Number.isFinite))
      throw new Error('Projectile trail head must be a finite local 3D point.');
    const [x, y, z] = head;
    if (x === undefined || y === undefined || z === undefined)
      throw new Error('Projectile trail head coordinates are missing.');
    const position: Vec3 = [x, y, z];
    const serial = context.param('breakSerial');
    const stamps = history.history.sample(age, position, recording && age <= flightSeconds, typeof serial === 'number' ? serial : 0);
    history.age = age;
    history.sample = {
      head: recording && age <= flightSeconds ? position : undefined,
      trail: stamps.map((stamp, index) => {
        const freshness = Math.max(0, 1 - (age - stamp.time) / projectileTrailTailSeconds);
        return {
          position: stamp.position,
          width: 0.125 * Math.pow(freshness, 0.75),
          u: freshness,
          age: freshness,
          connected: index > 0 && stamp.connected,
        };
      }),
    };
    return history.sample;
  };
}
function sampleRed(ctx: VfxParticleContext, name: string): Node<'float'> {
  const sample = ctx.sampleTexture;
  if (sample === undefined) throw new Error(`VFX look texture "${name}" is not bound.`);
  return (sample(name, ctx.uv) as Node<'vec4'>).x;
}
function trailCore(ctx: VfxParticleContext): Node<'float'> {
  return (ctx.uv as Node<'vec2'>).y.sub(0.5).abs().mul(2).smoothstep(0, 0.22).oneMinus();
}
const trailLook: VfxLayerLook = {
  colorNode: (ctx) => vec3(0.2, 0.55, 2).add(vec3(2.2, 2.5, 3).mul(trailCore(ctx))),
  opacityNode: (ctx) => {
    const fringe = float(1)
      .sub((ctx.uv as Node<'vec2'>).y.sub(0.5).abs().mul(2))
      .max(0)
      .pow(2);
    return trailCore(ctx)
      .mul(0.75)
      .add(fringe.mul(0.25))
      .mul(ctx.progress as Node<'float'>);
  },
};
const headLook: VfxLayerLook = {
  textures: { star: { texture: vfxTexture(STAR_MAP), colorSpace: 'linear' } },
  colorNode: () => vec3(2.5, 3, 5),
  opacityNode: (ctx) => sampleRed(ctx, 'star'),
};
/** One game-driven member of a volley. Keep its effect root fixed in the launch frame. */
// Copy this file. Prepare createProjectileTrail(id, maximumFlightSeconds) once, then play one handle per missile at its launch point, unparented and without source.
// Increment breakSerial on teleports or network corrections; continuous high-speed motion stays connected.
// Each frame setParam('head', missileWorldMinusLaunch) in that fixed local frame. SetParam('recording', false) at the final contact, expiry or target loss; the short tail drains. Immediate stop cancels it.
// After projectileTrailTailSeconds of game time, stop({ immediate: true }) releases the drained handle; otherwise it occupies its slot until the maximum flight duration ends.
// Prepare createProjectileTrailContact(id) separately and play only on confirmed collision, slightly outside the surface with local +Y outward. Game code owns volley timing, homing, collision and damage.
// createProjectileTrail(id, flightSeconds, true) previews twelve curved routes; leave preview=false for game-owned motion and hits.
export function createProjectileTrail(
  id: string,
  flightSeconds = 3,
  preview = false,
): VfxDefinition {
  if (!Number.isFinite(flightSeconds) || flightSeconds < 0.05 || flightSeconds > 30)
    throw new Error('Projectile trail duration must be between 0.05 and 30 seconds.');
  const samples = Array.from({ length: preview ? 12 : 1 }, (_, i) =>
    createProjectileTrailSampler(flightSeconds, preview ? i : undefined),
  );
  return defineVfx({
    id,
    duration: flightSeconds + projectileTrailTailSeconds,
    maxInstances: preview ? 1 : 16,
    seed: 27,
    params: { head: { default: [0, 0, 0] }, recording: { default: true }, breakSerial: { default: 0 } },
    build(fx) {
      samples.forEach((sample, i) => {
        fx.path({
          id: `trail-${i}`,
          maxSegments: LIMIT,
          sample: (age, ctx) => sample(age, ctx).trail,
          look: trailLook,
          blend: 'alpha',
          orderInLayer: 0,
        });
        fx.path({
          id: `head-${i}`,
          maxSegments: 1,
          sample: (age, ctx) => {
            const p = sample(age, ctx).head;
            if (!p) return [];
            return [
              { position: [p[0], p[1] - 0.1, p[2]], width: 0.2, u: 0 },
              { position: [p[0], p[1] + 0.1, p[2]], width: 0.2, u: 1 },
            ];
          },
          look: headLook,
          blend: 'alpha',
          orderInLayer: 1,
        });
      });
    },
  });
}
/** A game-confirmed surface contact, independent of flight expiry or lost targeting. */
export function createProjectileTrailContact(id: string): VfxDefinition {
  return defineVfx({
    id,
    duration: 0.45,
    maxInstances: 32,
    seed: 29,
    build(fx) {
      fx.particles({
        startLife: 0.09,
        startSize: 0.38,
        map: vfxTexture(STAR_MAP),
        mode: 'horizontal',
        tint: [0.7, 0.85, 1, 1],
        emission: 4,
        blend: 'alpha',
        sizeOverLife: curve([0, 0.5], [0.15, 1], [1, 0]),
        opacityOverLife: curve([0, 1], [0.3, 1], [1, 0]),
      });
      fx.particles({
        capacity: 10,
        startLife: [0.18, 0.35],
        startSpeed: [0.5, 1.8],
        direction: [0, 1, 0],
        spread: 1.1,
        drag: 3,
        gravity: -1.5,
        startSize: [0.025, 0.055],
        map: vfxTexture('point-soft-5'),
        tint: [0.25, 0.55, 1, 1],
        emission: 2,
        blend: 'alpha',
        simulationSpace: 'world',
        opacityOverLife: curve([0, 1], [1, 0]),
        sizeOverLife: curve([0, 1], [1, 0]),
      });
    },
  });
}

export default createProjectileTrail('example.projectile-trail');
