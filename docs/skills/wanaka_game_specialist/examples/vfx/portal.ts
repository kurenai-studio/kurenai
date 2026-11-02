// intent: Opening and closing dimensional portal or rift.
// variants: createHeldPortal(id, textureVariant) for gameplay; createDimensionalRift(id, repeat, textureVariant) for timed demonstrations
// inputs: local XY aperture; centre 1.2m above anchor; game owns traversal and open interval
// Copy dependencies: ./shared/special-pack.ts.
// Lifecycle: update time; close once with closingAt; stop after portalCloseSeconds. See examples/vfx-portal-lifecycle.ts.
// Event binding: playOptions: aperture anchor/rotation with local XY as the opening plane; centre is authored 1.2 m above anchor. Game owns traversal, active interval and cancellation.
// Setup in an async scene: const effect = createHeldPortal('game.portal');
// const vfx = useVfx(context); await vfx.prepare(effect, {});
// const handle = vfx.play(effect, playOptions);
// Import useVfx (and createVfxPointSource when needed) from wanaka-studio-engine/vfx. Prepare once; construct playOptions from the game inputs above per event.
// Update the selected recipe's declared params from gameplay; await handle.finished for complete drain.
// Immediate cancellation: handle.stop({ immediate: true }). Persistent holds end on the game's state/event.
// Held portal integration: copy examples/vfx-portal-lifecycle.ts; prepare once and retain
// one controller per cast. Keep the local XY aperture anchor unscaled, centre 1.2m above it.
// Update time in simulation seconds since cast; closingAt stays -1 until close, then is
// written once. After portalCloseSeconds, stop immediately. Repeated close/cancel is safe
// in the adapter; cancellation also interrupts closing. The material clock belongs to
// this play; looping storage does not replay opening. Gameplay owns traversal eligibility,
// obstruction and destination. createDimensionalRift is the finite/repeating alternative.
import { sampleVfxLookTexture as sample } from 'wanaka-studio-engine/vfx';
import { float, vec2, vec3 } from 'three/tsl';
import { type Node } from 'three/webgpu';
import {
  defineVfx,
  sampleVfxRefraction,
  vfxTexture,
  type VfxDefinition,
  type VfxLayerLook,
  type VfxParticleContext,
} from 'wanaka-studio-engine/vfx';
import { specialTexture } from './shared/special-pack.js';

const SPECIAL_NOISE_RGB = [
  vfxTexture('special-noise-rgb-1'),
  vfxTexture('special-noise-rgb-2'),
  vfxTexture('special-noise-rgb-3'),
  vfxTexture('special-noise-rgb-4'),
] as const;

const NOISE = 'noise-soft-alias-1';
const CRACK = 'crack-thin-network-1';
const SEALED = 45 / 60;
const OPEN = 0.85;
const CLOSE = 0.7;
const CLOSE_START = 210 / 60;
/** Seconds after play when the aperture is fully open; traversal remains game-owned. */
export const RIFT_READY_AT = SEALED + OPEN;
/** Seconds after play when the authored close begins. */
export const RIFT_CLOSE_AT = CLOSE_START;
const DURATION = CLOSE_START + CLOSE;
const SIZE = 4;
const SHARD_COUNT = 18;
const LIFT = 1.2;
const noiseMap = { noise: { texture: vfxTexture(NOISE), colorSpace: 'linear' as const } };

function clamp01Node(value: Node<'float'>): Node<'float'> {
  return value.clamp(float(0), float(1));
}
function presenceNode(clock: Node<'float'>): Node<'float'> {
  const closeAmount = clock.sub(float(CLOSE_START)).div(float(CLOSE));
  return clamp01Node(closeAmount).oneMinus();
}
function opennessNode(clock: Node<'float'>, openingScale: Node<'float'> = float(1)): Node<'float'> {
  const closeAmount = clock.sub(float(CLOSE_START)).div(float(CLOSE));
  const opening = clock.sub(float(SEALED)).div(float(OPEN)).smoothstep(float(0), float(1));
  const closing = closeAmount.smoothstep(float(0), float(1));
  return opening.mul(closing.oneMinus()).mul(openingScale);
}
function pulseNode(clock: Node<'float'>): Node<'float'> {
  return clock.mul(float(3.2)).sin().mul(float(0.12)).add(float(0.88));
}
function noiseR(ctx: VfxParticleContext, at: Node<'vec2'>): Node<'float'> {
  return sample(ctx, 'noise', at.fract()).x;
}
function radialNode(ctx: VfxParticleContext): Node<'float'> {
  const localUv = ctx.uv as Node<'vec2'>;
  const distance = localUv.sub(vec2(0.5, 0.5)).length();
  const noise = noiseR(ctx, localUv.mul(vec2(0.8, 0.8)))
    .sub(float(0.5))
    .mul(float(0.06));
  return distance.add(noise);
}
function apertureNode(clock: Node<'float'>, openingScale?: Node<'float'>): Node<'float'> {
  return opennessNode(clock, openingScale).mul(float(0.29));
}
function gapNode(radial: Node<'float'>, aperture: Node<'float'>): Node<'float'> {
  return radial.sub(aperture).abs();
}
function openGateNode(openness: Node<'float'>): Node<'float'> {
  return openness.greaterThan(float(0.001)).select(float(1), float(0));
}
function insideNode(
  radial: Node<'float'>,
  aperture: Node<'float'>,
  openGate: Node<'float'>,
): Node<'float'> {
  const band = radial.smoothstep(aperture.sub(float(0.004)), aperture.add(float(0.004))).oneMinus();
  return band.mul(openGate);
}
function crackNode(ctx: VfxParticleContext): Node<'float'> {
  return sample(ctx, 'crack', ctx.uv).x;
}
function seamNode(
  crack: Node<'float'>,
  gap: Node<'float'>,
  openGate: Node<'float'>,
): Node<'float'> {
  const seamWidth = crack.mul(float(0.025)).add(float(0.006));
  const edge = gap.smoothstep(seamWidth.mul(float(0.25)), seamWidth).oneMinus();
  return edge.mul(openGate);
}
function haloNode(
  crack: Node<'float'>,
  gap: Node<'float'>,
  openGate: Node<'float'>,
): Node<'float'> {
  const edge = gap.smoothstep(float(0.004), float(0.045)).oneMinus();
  return edge.mul(crack.mul(float(1.2)).add(float(0.08))).mul(openGate);
}
function fractureSeamNode(ctx: VfxParticleContext, clock = ctx.age, openingScale?: Node<'float'>): Node<'float'> {
  const gap = gapNode(radialNode(ctx), apertureNode(clock, openingScale));
  return seamNode(crackNode(ctx), gap, openGateNode(opennessNode(clock, openingScale)));
}
function fractureOpacityNode(ctx: VfxParticleContext, clock = ctx.age, openingScale?: Node<'float'>): Node<'float'> {
  const presence = presenceNode(clock);
  const pulse = pulseNode(clock);
  const radial = radialNode(ctx);
  const aperture = apertureNode(clock, openingScale);
  const gap = gapNode(radial, aperture);
  const openGate = openGateNode(opennessNode(clock, openingScale));
  const inside = insideNode(radial, aperture, openGate);
  const crack = crackNode(ctx);
  const seam = seamNode(crack, gap, openGate);
  const halo = haloNode(crack, gap, openGate);
  const body = crack
    .mul(inside.oneMinus())
    .mul(float(1.8))
    .add(seam.mul(crack.mul(float(2.5)).add(float(0.65))))
    .add(halo);
  return presence.mul(pulse).mul(body);
}
function noiseOffsetNode(ctx: VfxParticleContext): Node<'vec2'> {
  const localUv = ctx.uv as Node<'vec2'>;
  const scroll = (ctx.age as Node<'float'>).mul(float(0.025));
  const coordinates = localUv
    .mul(vec2(1.7, 1.7))
    .add(scroll.mul(vec2(1, 0)).add(scroll.mul(vec2(0, 1))))
    .fract();
  return sample(ctx, 'noise', coordinates).xy.sub(vec2(0.5, 0.5)).mul(float(0.025));
}
function triangleBaryNode(ctx: VfxParticleContext): Node<'float'> {
  const localUv = ctx.uv as Node<'vec2'>;
  const x = localUv.x;
  const y = localUv.y;
  return x.min(y).min(float(1).sub(x).sub(y));
}
function shardEdgeNode(ctx: VfxParticleContext): Node<'float'> {
  return triangleBaryNode(ctx).smoothstep(float(0.005), float(0.035)).oneMinus();
}
function apertureLook(clock?: Node<'float'>, elapsed?: Node<'float'>, openingScale?: Node<'float'>): VfxLayerLook { return {
  textures: noiseMap,
  colorNode: () => vec3(0.015, 0.002, 0.035),
  opacityNode(ctx) {
    const time = clock ?? ctx.age;
    const inside = insideNode(
      radialNode(ctx),
      apertureNode(time, openingScale),
      openGateNode(opennessNode(time, openingScale)),
    );
    return inside.mul(presenceNode(time));
  },
  backdropNode: (ctx) => sampleVfxRefraction(noiseOffsetNode(elapsed ? { ...ctx, age: elapsed } : ctx), { tint: [0.72, 0.48, 1.12] }),
}; }
function fractureLook(clock?: Node<'float'>, openingScale?: Node<'float'>): VfxLayerLook { return {
  textures: {
    ...noiseMap,
    crack: { texture: vfxTexture(CRACK), colorSpace: 'linear' },
  },
  colorNode: (ctx) => vec3(1.6, 0.04, 2.4).add(vec3(1, 0.18, 0.6).mul(fractureSeamNode(ctx, clock, openingScale))),
  opacityNode: (ctx) => fractureOpacityNode(ctx, clock, openingScale),
}; }
function portalShardLook(clock?: Node<'float'>, elapsed?: Node<'float'>, openingScale?: Node<'float'>): VfxLayerLook { return {
  textures: noiseMap,
  colorNode(ctx) {
    return sampleVfxRefraction(noiseOffsetNode(elapsed ? { ...ctx, age: elapsed } : ctx), { tint: [0.55, 0.3, 0.9] }).add(
      vec3(0.8, 0.08, 1.3).mul(shardEdgeNode(ctx)),
    );
  },
  opacityNode(ctx) {
    const time = clock ?? ctx.age;
    return opennessNode(time, openingScale)
      .mul(presenceNode(time))
      .mul(shardEdgeNode(ctx).mul(float(0.12)).add(float(0.16)));
  },
}; }
function smooth01(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}
function lightAt(age: number): number {
  const opening = smooth01((age - SEALED) / OPEN);
  const closeT = (age - CLOSE_START) / CLOSE;
  const openAmount = opening * (1 - smooth01(closeT));
  const fade = 1 - Math.min(1, Math.max(0, closeT));
  return (0.7 + openAmount * 9) * fade;
}
const LIGHT_CURVE = [
  0,
  SEALED,
  SEALED + OPEN * 0.5,
  SEALED + OPEN,
  CLOSE_START,
  CLOSE_START + CLOSE * 0.25,
  CLOSE_START + CLOSE * 0.5,
  CLOSE_START + CLOSE * 0.75,
  DURATION,
].map((age) => ({ t: age / DURATION, v: lightAt(age) }));
const SHARD_GEOMETRY = {
  positions: [-0.18, -0.15, 0, 0.22, -0.1, 0, 0.02, 0.3, 0],
  uvs: [0, 0, 1, 0, 0, 1],
};
function shardPlacement(index: number): {
  readonly cos: number;
  readonly sin: number;
  readonly position: readonly [number, number, number];
  readonly rotation: number;
} {
  const angle = index * 2.399963;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    cos,
    sin,
    position: [cos * 1.15, LIFT + sin * 1.15, 0],
    rotation: 0.9 * Math.cos(index * 2.1),
  };
}
/** Returns the approved open/close cycle; repeat is intended for decorative playback. */
// Copy this file and prepare createDimensionalRift(uniqueId). Each play opens and closes once; pass repeat=true only for a repeating decorative cycle.
// Requires Rendering for scene refraction. Play unparented at a committed foot pose: local XY is the portal plane, +Z its normal, and the aperture center is 1.2 units above the origin. Rotate the play pose to face the desired direction.
// The fully open interval is RIFT_READY_AT through RIFT_CLOSE_AT. Game code owns traversal eligibility and destinations; the refracted image shows this scene, not another location.
// Await handle.finished for a single cycle; stop({ immediate: true }) cancels immediately (no authored close animation). No host model is required.
// Texture variants: copy shared/special-pack.ts with this file. Select a source-file number before prepare; omission preserves the original composition.
export function createDimensionalRift(
  id: string,
  repeat = false,
  textureVariant?: number,
  held = false,
): VfxDefinition {
  const noise = specialTexture(SPECIAL_NOISE_RGB, textureVariant);
  const withNoise = (look: VfxLayerLook): VfxLayerLook =>
    noise
      ? {
          ...look,
          textures: { ...look.textures, noise: { texture: noise.texture, colorSpace: 'linear' } },
        }
      : look;
  return defineVfx({
    id,
    maxInstances: 4,
    duration: DURATION,
    seed: 83,
    loop: repeat || held,
    params: held ? { time: { default: 0, min: 0 }, closingAt: { default: -1 } } : {},
    build(fx) {
      const elapsed = held ? fx.param('time') as Node<'float'> : undefined;
      const closingAt = held ? fx.param('closingAt') as Node<'float'> : undefined;
      const clock = elapsed && closingAt ? closingAt.greaterThanEqual(0).and(elapsed.greaterThanEqual(closingAt)).select(elapsed.sub(closingAt).add(CLOSE_START), elapsed.min(RIFT_READY_AT)) : undefined;
      const openingScale = elapsed && closingAt ? closingAt.greaterThanEqual(0).and(elapsed.greaterThanEqual(closingAt)).select(closingAt.sub(SEALED).div(OPEN).smoothstep(0, 1), float(1)) : undefined;
      const surface = {
        startLife: DURATION,
        map: vfxTexture('solid'),
        tint: [1, 1, 1, 1],
        emission: 1,
        meshSide: 'double',
        simulationSpace: 'local',
      } as const;
      fx.particles({
        ...surface,
        startSize: SIZE,
        look: withNoise(apertureLook(clock, elapsed, openingScale)),
        mesh: 'quad',
        blend: 'alpha',
        orderInLayer: 1,
        transform: { position: [0, LIFT, 0] },
      });
      fx.particles({
        ...surface,
        startSpeed: 0,
        direction: [0, 1, 0],
        startSize: SIZE,
        look: withNoise(fractureLook(clock, openingScale)),
        mesh: 'quad',
        orderInLayer: 4,
        transform: { position: [0, LIFT, 0.006] },
      });
      for (let index = 0; index < SHARD_COUNT; index += 1) {
        const { position, rotation } = shardPlacement(index);
        fx.particles({
          ...surface,
          startSize: 1,
          look: withNoise(portalShardLook(clock, elapsed, openingScale)),
          mesh: SHARD_GEOMETRY,
          blend: 'alpha',
          orderInLayer: 6,
          transform: { position },
          rotation: { start: rotation },
        });
      }
      if (!held) fx.light({
        color: [194 / 255, 58 / 255, 1],
        intensity: 1,
        range: 5,
        curve: LIGHT_CURVE,
        life: DURATION,
      });
    },
  });
}

/** Event-owned doorway. Update time from game seconds; set closingAt once, then stop after portalCloseSeconds. */
export function createHeldPortal(id: string, textureVariant?: number): VfxDefinition {
  return createDimensionalRift(id, false, textureVariant, true);
}
/** Duration of the close after the game's committed close event. */
export const portalCloseSeconds = CLOSE;

export default createDimensionalRift('example.dimensional-rift');
