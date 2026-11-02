// intent: Acid pools, poison clouds, flowing energy and spherical time fields.
// variants: ground pool: createCorrosionPool(id, textureVariant); haze: createPoisonCloud(id, radius); flow: createFlowField(id, radius, seconds, textureVariant); sphere: createTimeDistortion(id)
// inputs: pool/haze ground anchor; time field actual 3D centre; game owns affected range
// Copy dependencies: ./shared/special-pack.ts.
// Event binding: playOptions: unscaled ground pose for this corrosion pool. Match the copied footprint to the gameplay area; end with the hazard. Time distortion instead uses a 3D centre.
// Setup in an async scene: const effect = createCorrosionPool("game.field");
// const vfx = useVfx(context); await vfx.prepare(effect, {});
// const handle = vfx.play(effect, playOptions);
// Import useVfx (and createVfxPointSource when needed) from wanaka-studio-engine/vfx. Prepare once; construct playOptions from the game inputs above per event.
// Update the selected recipe's declared params from gameplay; await handle.finished for complete drain.
// Immediate cancellation: handle.stop({ immediate: true }). Persistent holds end on the game's state/event.
import {
  clamp,
  float,
  fract,
  length,
  mix,
  normalLocal,
  normalView,
  oneMinus,
  sin,
  smoothstep,
  vec2,
  vec3,
  viewportSize,
} from 'three/tsl';
import { type Node } from 'three/webgpu';
import {
  curve,
  defineVfx,
  RANDOM_YAW,
  sampleVfxRefraction,
  vfxMesh,
  vfxTexture,
  type VfxDefinition,
  type VfxKitBuilder,
  type VfxLayerLook,
  type VfxMaterialContext,
  type VfxPairedPathSection,
  type VfxParticleContext,
} from 'wanaka-studio-engine/vfx';
import { sampleVfxAtlas as sampleAtlas } from 'wanaka-studio-engine/vfx';
import { specialTexture, type SpecialTexture } from './shared/special-pack.js';

const SPECIAL_LIQUID_FLOW = [
  vfxTexture('special-liquid-5'),
  vfxTexture('special-liquid-6'),
] as const;
const SPECIAL_NOISE = [
  vfxTexture('special-noise-1'),
  vfxTexture('special-noise-2'),
  vfxTexture('special-noise-3'),
  vfxTexture('special-noise-4'),
  vfxTexture('special-noise-5'),
  vfxTexture('special-noise-6'),
  vfxTexture('special-noise-7'),
  vfxTexture('special-noise-8'),
  vfxTexture('special-noise-9'),
  vfxTexture('special-noise-10'),
  vfxTexture('special-noise-11'),
  vfxTexture('special-noise-12'),
  vfxTexture('special-noise-13'),
  vfxTexture('special-noise-14'),
  vfxTexture('special-noise-15'),
  vfxTexture('special-noise-16'),
  vfxTexture('special-noise-17'),
] as const;

const NOISE = 'noise-soft-alias-1';
const SMOKE = 'smoke-irregular-wisp-7';
/** Poison element spark sheet. */
const POISON_SPARK = 'point-vortex-6';
const RADIUS = 2;
const ACTIVE = 210 / 60;
const FADE_IN = 0.5;
const RELEASE = 1.2;
const VAPOR_LIFE = 1.6;
const DURATION = ACTIVE + VAPOR_LIFE;
export const corrosionTiming = { radius: RADIUS, activeStart: FADE_IN, activeEnd: ACTIVE } as const;
const LIQUID = [12 / 255, 17 / 255, 2 / 255] as const;
const FOAM = [62 / 255, 84 / 255, 12 / 255] as const;
const BUBBLE_COUNT = 12;
const GOLDEN_ANGLE = 2.399963229728653;
function smooth01(value: number): number {
  const t = Math.min(1, Math.max(0, value));
  return t * t * (3 - 2 * t);
}
/** Scheduled fade-in, hold and residue release; early cancellation is game-owned. */
function presenceAt(elapsed: number): number {
  const fadeIn = smooth01(elapsed / FADE_IN);
  if (elapsed < ACTIVE) return fadeIn;
  return fadeIn * (1 - smooth01((elapsed - ACTIVE) / RELEASE));
}
function surfaceShade(ctx: VfxMaterialContext): {
  readonly foamAmount: Node<'float'>;
  readonly edge: Node<'float'>;
  readonly presence: Node<'float'>;
} {
  const uv = ctx.uv as Node<'vec2'>;
  const clock = ctx.age as Node<'float'>;
  const q = uv.sub(vec2(0.5, 0.5)).mul(vec2(2, -2));
  const sample = (coordinates: Node<'vec2'>): Node<'float'> =>
    ctx.sampleTexture('noise', fract(coordinates)).x;
  const shore = sample(q.mul(vec2(0.85, 0.85)).add(vec2(0.17, 0.41)));
  const distance = length(q).add(shore.mul(float(0.04)));
  const bodyEdge = oneMinus(smoothstep(float(0.84), float(0.98), distance));
  const radial = length(q);
  const hazardRim = radial
    .smoothstep(0.975, 0.99)
    .mul(radial.smoothstep(0.995, 1).oneMinus())
    .mul(clock.lessThan(ACTIVE).select(1, 0));
  const edge = bodyEdge.max(hazardRim);
  const first = sample(q.mul(vec2(0.7, 0.7)).add(clock.mul(vec2(0.07, -0.04))));
  const second = sample(q.mul(vec2(2, 2)).add(clock.mul(vec2(-0.1, 0)).add(vec2(0, 0.37))));
  const veins = smoothstep(
    float(0.25),
    float(0.85),
    first.mul(float(0.7)).add(second.mul(float(0.3))),
  );
  const rim = smoothstep(float(0.7), float(0.85), distance).mul(edge);
  const foamAmount = clamp(
    veins.mul(0.22).add(rim.mul(0.4)).add(hazardRim.mul(0.6)),
    float(0),
    float(1),
  );
  const fadeIn = smoothstep(
    float(0),
    float(1),
    clamp(clock.div(float(FADE_IN)), float(0), float(1)),
  );
  const release = smoothstep(
    float(0),
    float(1),
    clamp(clock.sub(float(ACTIVE)).div(float(RELEASE)), float(0), float(1)),
  );
  return { foamAmount, edge, presence: fadeIn.mul(oneMinus(release)) };
}
function surfaceLook(
  noise: {
    readonly assetId: string;
  },
  liquid?: SpecialTexture,
): VfxLayerLook {
  return {
    textures: {
      noise: { texture: noise, colorSpace: 'linear' },
      ...(liquid ? { atlas: { texture: liquid.texture, colorSpace: 'linear' as const } } : {}),
    },
    colorNode(ctx) {
      const { foamAmount } = surfaceShade(ctx);
      const film = liquid
        ? sampleAtlas(ctx as VfxParticleContext, {
            columns: liquid.columns,
            rows: liquid.rows,
            width: liquid.width,
            phase: ctx.age.div(DURATION).clamp(0, 1),
          }).r
        : float(0);
      const wet = mix(
        vec3(LIQUID[0], LIQUID[1], LIQUID[2]),
        vec3(FOAM[0], FOAM[1], FOAM[2]),
        liquid ? foamAmount.add(film.mul(0.55)).min(1) : foamAmount,
      ).mul(float(1.18));
      return mix(wet, vec3(0.03, 0.04, 0.006), ctx.age.sub(ACTIVE).smoothstep(0, 0.25));
    },
    opacityNode(ctx) {
      const { edge, presence } = surfaceShade(ctx);
      return edge.mul(presence).mul(float(0.92));
    },
  };
}
function bubbleHemisphere(): {
  readonly positions: number[];
  readonly uvs: number[];
  readonly indices: number[];
} {
  const widthSegments = 12;
  const heightSegments = 8;
  const thetaLength = Math.PI / 2;
  const positions: number[] = [];
  const uvs: number[] = [];
  const columns = widthSegments + 1;
  for (let iy = 0; iy <= heightSegments; iy += 1) {
    const v = iy / heightSegments;
    const theta = v * thetaLength;
    const y = Math.cos(theta);
    const ringRadius = Math.sqrt(1 - y * y);
    const uOffset = iy === 0 ? 0.5 / widthSegments : 0;
    for (let ix = 0; ix <= widthSegments; ix += 1) {
      const u = ix / widthSegments;
      const phi = u * Math.PI * 2;
      positions.push(-ringRadius * Math.cos(phi), y, ringRadius * Math.sin(phi));
      uvs.push(u + uOffset, 1 - v);
    }
  }
  const indices: number[] = [];
  for (let iy = 0; iy < heightSegments; iy += 1) {
    for (let ix = 0; ix < widthSegments; ix += 1) {
      const b = iy * columns + ix;
      const a = b + 1;
      const c = (iy + 1) * columns + ix;
      const d = c + 1;
      if (iy !== 0) indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }
  return { positions, uvs, indices };
}
const BUBBLE_MESH = bubbleHemisphere();
const VAPOR_FADE = curve([0, 0], [0.2, 1], [1, 0]);
// Copy this finite flat-ground presentation at a real surface contact. corrosionTiming gives radius and the active window for caller-owned damage.
// The late fade is residue. Cancel with stop({ immediate: true }); graceful stop does not shorten already-authored surface/bubble lives.
// Copy shared/special-pack.ts with this file. createCorrosionPool(id, 5 / 6) changes only the liquid density texture.
export function createCorrosionPool(id: string, textureVariant?: number): VfxDefinition {
  const liquid = specialTexture(SPECIAL_LIQUID_FLOW, textureVariant);
  return defineVfx({
    id,
    seed: 19,
    duration: DURATION,
    build(fx) {
      const look = surfaceLook(vfxTexture(NOISE), liquid);
      fx.particles({
        startLife: DURATION,
        startSize: RADIUS * 2,
        map: vfxTexture('solid'),
        blend: 'alpha',
        mesh: { geometry: vfxMesh('quad'), side: 'front' },
        lit: true,
        roughness: 0.38,
        specularIntensity: 0.15,
        clearcoat: 0.08,
        clearcoatRoughness: 0.4,
        orderInLayer: 15,
        colorSource: 'tint',
        transform: { position: [0, 0.04, 0], rotation: [-Math.SQRT1_2, 0, 0, Math.SQRT1_2] },
        look,
      });
      fx.particles({
        capacity: 28,
        rateOverTime: 8,
        duration: ACTIVE,
        startLife: [0.8, 1.6],
        startSpeed: [0.08, 0.2],
        direction: [0, 1, 0],
        spread: 0.4,
        shape: { type: 'box', size: [RADIUS, 0.05, RADIUS] },
        // Low vapour leaves the standing actor silhouette readable.
        transform: { position: [0, 0.17, 0] },
        startSize: [0.5, 1.1],
        aspect: 2,
        sizeOverLife: [
          { t: 0, v: 0.6 },
          { t: 1, v: 1.3 },
        ],
        opacityOverLife: VAPOR_FADE,
        map: vfxTexture(SMOKE),
        blend: 'alpha',
        orderInLayer: 10,
        tint: [0.45, 0.52, 0.07, 0.22],
        emission: 0.8,
        textureColorSpace: 'srgb',
      });
      fx.particles({
        capacity: 16,
        rateOverTime: 5,
        duration: ACTIVE,
        startLife: [0.8, 1.5],
        startSpeed: [0.12, 0.32],
        direction: [0, 1, 0],
        spread: 0.6,
        shape: { type: 'box', size: [RADIUS * 0.8, 0.08, RADIUS * 0.8] },
        transform: { position: [0, 0.2, 0] },
        startSize: [0.025, 0.055],
        sizeOverLife: [
          { t: 0, v: 0.5 },
          { t: 1, v: 1 },
        ],
        opacityOverLife: VAPOR_FADE,
        map: vfxTexture(POISON_SPARK),
        orderInLayer: 10,
        tint: [0.65, 0.9, 0.12, 0.7],
        emission: 1.2,
      });
      for (let index = 0; index < BUBBLE_COUNT; index += 1) bubbleLayer(fx, index);
    },
  });
}
function bubbleGrow(phase: number): number {
  if (phase < 0.7) return phase / 0.7;
  return Math.max(0, (0.82 - phase) / 0.12);
}
function bubbleMarks(index: number): {
  elapsed: number;
  grow: number;
}[] {
  const period = 1.4 + (index % 4) * 0.23;
  const phase0 = (index * 0.371) % 1;
  const marks = new Set<number>([0, FADE_IN, ACTIVE, ACTIVE + RELEASE, DURATION]);
  const cycles = Math.ceil(DURATION / period) + 1;
  for (let cycle = 0; cycle < cycles; cycle += 1) {
    for (const phase of [0, 0.7, 0.82, 1]) {
      const elapsed = (cycle + phase - phase0) * period;
      if (elapsed >= 0 && elapsed <= DURATION) marks.add(elapsed);
    }
  }
  for (let step = 0; step <= 5; step += 1) marks.add((step / 5) * FADE_IN);
  for (let step = 0; step <= 6; step += 1) marks.add(ACTIVE + (step / 6) * RELEASE);
  return [...marks]
    .filter((elapsed) => elapsed >= 0 && elapsed <= DURATION)
    .sort((left, right) => left - right)
    .map((elapsed) => ({
      elapsed,
      grow: bubbleGrow((elapsed / period + phase0) % 1) * presenceAt(elapsed),
    }));
}
function bubbleLayer(fx: VfxKitBuilder, index: number): void {
  const angle = index * GOLDEN_ANGLE;
  const radius = Math.sqrt((index + 0.5) / BUBBLE_COUNT) * RADIUS * 0.65;
  const factor = 0.06 + (index % 3) * 0.022;
  const marks = bubbleMarks(index);
  fx.particles({
    startLife: DURATION,
    startSize: factor * RADIUS,
    sizeOverLife: marks.map(({ elapsed, grow }) => ({
      t: elapsed / DURATION,
      v: grow,
    })),
    opacityOverLife: marks.map(({ elapsed }) => ({
      t: elapsed / DURATION,
      v: presenceAt(elapsed),
    })),
    transform: {
      position: [Math.cos(angle) * radius, 0.046, Math.sin(angle) * radius],
    },
    mesh: { geometry: BUBBLE_MESH, scale: [1, 0.75, 1], side: 'front' },
    lit: true,
    roughness: 0.14,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    blend: 'alpha',
    map: vfxTexture('solid'),
    colorSource: 'tint',
    tint: [0.32, 0.4, 0.055, 0.75],
    emission: 1,
    look: { opacityNode: () => float(1) },
  });
}

// Copy this file. Prepare createPoisonCloud(id, radius) once per fixed game radius, in metres; play on a game-owned flat surface contact.
// Stop emission when the hazard ends: the edge drains within .16s and haze within 1.2s. Damage, expiry and terrain placement belong to game code; this is not an attached status.
export function createPoisonCloud(id: string, radius = 1.5): VfxDefinition {
  if (!Number.isFinite(radius) || radius < 0.5 || radius > 8)
    throw new Error('Poison field radius must be between 0.5 and 8 metres.');
  return defineVfx({
    id,
    duration: 3,
    maxInstances: 4,
    seed: 7,
    loop: true,
    build(fx) {
      fx.particles({
        capacity: 4,
        rateOverTime: 20,
        startLife: 0.16,
        startSize: radius * 2,
        mode: 'horizontal',
        blend: 'alpha',
        orderInLayer: 5,
        transform: { position: [0, 0.025, 0] },
        rotation: { enabled: false },
        look: {
          colorNode: () => vec3(0.22, 0.55, 0.035),
          opacityNode: (ctx) => {
            const d = ctx.uv.sub(0.5).length().mul(2);
            const edge = d.smoothstep(0.92, 0.97).mul(d.smoothstep(0.99, 1).oneMinus());
            return edge.mul(0.6).add(d.smoothstep(0.6, 1).oneMinus().mul(0.045));
          },
        },
      });
      for (const mote of [false, true])
        fx.particles({
          capacity: mote ? 12 : 16,
          rateOverTime: mote ? 10 : 8,
          startLife: mote ? 0.8 : [0.8, 1.2],
          startSpeed: mote ? [0.12, 0.25] : [0.06, 0.12],
          direction: [0, 1, 0],
          shape: { type: 'circle', radius: [0, radius * 0.65], even: false },
          startSize: mote ? [0.025, 0.06] : [radius * 0.25, radius * 0.4],
          sizeOverLife: curve([0, 0.6], [1, 1]),
          opacityOverLife: curve([0, 0], [0.18, mote ? 1 : 0.7], [1, 0]),
          map: mote ? vfxTexture('acid-animation-2') : vfxTexture('acid-animation-1'),
          aspect: mote ? 1 : Math.max(1.5, radius * 1.1),
          blend: mote ? 'additive' : 'alpha',
          emission: mote ? 1 : 1.1,
          orderInLayer: mote ? 10 : 8,
          transform: { position: [0, 0.08, 0] },
          tint: mote ? [0.55, 1, 0.3, 0.65] : [0.45, 0.8, 0.18, 0.48],
          rotation: { start: RANDOM_YAW },
        });
    },
  });
}

const grandFlowFieldFADE_IN = 0.25;
const FADE_OUT = 0.65;
function radial(ctx: VfxParticleContext): Node<'float'> {
  return (ctx.uv as Node<'vec2'>).sub(vec2(0.5, 0.5)).length().mul(2);
}
/** A finite horizontal field; seconds includes activation and release, not a game damage deadline. */
// Copy this file; prepare createFlowField(uniqueId, radius, seconds). Play at a confirmed static horizontal contact, identity rotation and unit scale. Radius is the outer cosmetic disc edge; collision is game-owned.
// This is a finite active-field presentation, not a warning or impact scheduler. Activation takes 0.25 seconds, release occupies the final 0.65 seconds. Game code owns damage timing; cancellation uses stop({ immediate: true }). Normal stop retains authored surface lives.
// params.intensity fades all layers together. No terrain projection, slope support, scene collision or host model is required.
// Texture variants: copy shared/special-pack.ts with this file. Select a source-file number before prepare; omission preserves the original composition.
export function createFlowField(
  id: string,
  radius = 1.8,
  seconds = 4.65,
  textureVariant?: number,
): VfxDefinition {
  if (
    !Number.isFinite(radius) ||
    radius < 0.5 ||
    radius > 8 ||
    !Number.isFinite(seconds) ||
    seconds < 1.2 ||
    seconds > 30
  )
    throw new Error('Flow field radius must be 0.5–8 metres and duration 1.2–30 seconds.');
  const noise = specialTexture(SPECIAL_NOISE, textureVariant);
  return defineVfx({
    id,
    duration: seconds,
    maxInstances: 4,
    seed: 7,
    params: { intensity: { default: 1, min: 0, max: 1 } },
    build(fx) {
      const intensity = fx.param('intensity') as Node<'float'>;
      const presence = (ctx: VfxParticleContext): Node<'float'> => {
        const age = ctx.age as Node<'float'>;
        return age
          .div(grandFlowFieldFADE_IN)
          .clamp(0, 1)
          .mul(float(seconds).sub(age).div(FADE_OUT).clamp(0, 1))
          .mul(intensity);
      };
      fx.particles({
        capacity: 1,
        bursts: [{ time: 0, count: 1 }],
        startLife: seconds,
        startSize: radius * 2,
        map: vfxTexture('solid'),
        mode: 'horizontal',
        simulationSpace: 'local',
        rotation: { enabled: false },
        transform: { position: [0, 0.014, 0] },
        blend: 'alpha',
        orderInLayer: 10,
        look: {
          textures: {
            noise: {
              texture: noise?.texture ?? vfxTexture('noise-cloud-contrasty-1'),
              colorSpace: 'linear',
              wrap: 'repeat',
            },
          },
          colorNode(ctx) {
            const bind = ctx.sampleTexture;
            if (bind === undefined) throw new Error('Flow field noise is not bound.');
            const uv = ctx.uv as Node<'vec2'>,
              age = ctx.age as Node<'float'>;
            const cloud = (
              bind('noise', uv.mul(2).add(vec2(age.mul(-0.045), age.mul(0.015)))) as Node<'vec4'>
            ).x;
            return mix(vec3(0.045, 0.009, 0.003), vec3(0.45, 0.055, 0.005), cloud.pow(3));
          },
          opacityNode: (ctx) =>
            radial(ctx).smoothstep(0.95, 1).oneMinus().mul(presence(ctx)).mul(0.88),
        },
      });
      fx.particles({
        capacity: 1,
        bursts: [{ time: 0, count: 1 }],
        startLife: seconds,
        startSize: radius * 2,
        opacityOverLife: [
          { t: 0, v: 0 },
          { t: grandFlowFieldFADE_IN / seconds, v: 0.65 },
          { t: 1 - FADE_OUT / seconds, v: 0.65 },
          { t: 1, v: 0 },
        ],
        map: noise?.texture ?? vfxTexture('noise-cloud-contrasty-1'),
        coverageRange: [0.08, 0.55],
        distortion: {
          texture: vfxTexture('flow-direction-input-1'),
          mode: 'flow-dual',
          amount: 0.35,
          scroll: [0.45, 0],
          scale: [2.2, 2.2],
        },
        ramp: {
          texture: vfxTexture('ramp-fire-color-1'),
          axis: 'v',
          source: 'luma',
          mode: 'color',
          scale: 1.25,
          offset: -0.12,
        },
        blend: 'alpha',
        mode: 'horizontal',
        simulationSpace: 'local',
        orderInLayer: 12,
        emission: 1.4,
        transform: { position: [0, 0.02, 0] },
        rotation: { enabled: false },
        look: {
          opacityMultiplierNode: (ctx) =>
            radial(ctx).smoothstep(0.88, 0.98).oneMinus().mul(intensity),
        },
      });
      fx.particles({
        capacity: 1,
        bursts: [{ time: 0, count: 1 }],
        startLife: seconds,
        startSize: radius * 2,
        map: vfxTexture('solid'),
        mode: 'horizontal',
        simulationSpace: 'local',
        rotation: { enabled: false },
        transform: { position: [0, 0.026, 0] },
        blend: 'alpha',
        orderInLayer: 14,
        look: {
          colorNode: () => vec3(1.4, 0.38, 0.045),
          opacityNode: (ctx) =>
            radial(ctx)
              .smoothstep(0.965, 0.982)
              .mul(radial(ctx).smoothstep(0.99, 1).oneMinus())
              .mul(presence(ctx))
              .mul(0.85),
        },
      });
    },
  });
}

const FORM = 0.35;
const timeDistortionRELEASE = 0.6;
function presence(ctx: VfxParticleContext, seconds: number): Node<'float'> {
  const age = ctx.age as Node<'float'>;
  return age
    .div(FORM)
    .clamp(0, 1)
    .smoothstep(0, 1)
    .mul(float(seconds).sub(age).div(timeDistortionRELEASE).clamp(0, 1));
}
function ticks(age: number, radius: number, seconds: number): readonly VfxPairedPathSection[] {
  const t = Math.min(1, age / FORM),
    visibility =
      t * t * (3 - 2 * t) * Math.max(0, Math.min(1, (seconds - age) / timeDistortionRELEASE));
  return Array.from({ length: 97 }, (_, i) => {
    const a = (i / 96) * Math.PI * 2 + age * 0.1;
    const halfWidth = radius * 0.006 * visibility;
    const inner = radius * 0.99 - halfWidth,
      outer = radius * 0.99 + halfWidth;
    return {
      a: [Math.cos(a) * inner, 0, Math.sin(a) * inner],
      b: [Math.cos(a) * outer, 0, Math.sin(a) * outer],
      u: i / 96,
      age: visibility,
      connected: i > 0 && i % 8 < 6 && i % 8 > 0,
    };
  });
}
/** Creates a finite cosmetic sphere; radius and seconds do not change gameplay time or collision. */
// Copy this file; prepare createTimeDistortion(uniqueId, radius, seconds). Play unparented at the actual sphere centre with identity rotation and unit scale. Radius describes the sphere, not an automatically selected gameplay area. Requires Rendering for refraction.
// Game code owns time scaling, targets, damage and the active window. params.intensity fades all presentation; params.distortion adjusts refraction only (0 disables it). No game clock, collision, point light or automatic floor placement is authored.
// This finite presentation forms over 0.35 seconds and releases over its final 0.6 seconds. Immediate stop cancels; normal stop retains authored surfaces. Front faces are intentional: a camera inside the sphere does not receive a full-screen shell overlay.
export function createTimeDistortion(id: string, radius = 1.5, seconds = 3.6): VfxDefinition {
  if (
    !Number.isFinite(radius) ||
    radius < 0.5 ||
    radius > 8 ||
    !Number.isFinite(seconds) ||
    seconds < 1.2 ||
    seconds > 20
  )
    throw new Error('Time field radius must be 0.5–8 metres and duration 1.2–20 seconds.');
  return defineVfx({
    id,
    duration: seconds,
    maxInstances: 4,
    seed: 97,
    params: {
      intensity: { default: 1, min: 0, max: 1 },
      distortion: { default: 1, min: 0, max: 1 },
    },
    build(fx) {
      const intensity = fx.param('intensity') as Node<'float'>,
        distortion = fx.param('distortion') as Node<'float'>;
      fx.particles({
        capacity: 1,
        bursts: [{ time: 0, count: 1 }],
        startLife: seconds,
        startSize: radius * 2,
        map: vfxTexture('solid'),
        mesh: { geometry: 'sphere', side: 'front' },
        simulationSpace: 'local',
        rotation: { enabled: false },
        blend: 'alpha',
        tint: [1, 1, 1, 1],
        emission: 1,
        orderInLayer: 8,
        look: {
          colorNode: () => vec3(0, 0, 0),
          opacityNode: (ctx) => presence(ctx, seconds).mul(intensity),
          backdropNode(ctx) {
            const age = ctx.age as Node<'float'>;
            const facing = normalView.z.abs();
            const flow = vec2(
              sin(normalLocal.y.mul(8).add(age.mul(0.9))),
              sin(normalLocal.x.mul(7).sub(age.mul(0.7))),
            );
            const pixels = normalView.xy.mul(2.5).add(flow.mul(0.7));
            const offset = pixels
              .div(viewportSize)
              .mul(facing.mul(facing))
              .mul(presence(ctx, seconds))
              .mul(intensity)
              .mul(distortion);
            const rim = normalView.z.abs().oneMinus().pow(4);
            const band = sin(normalLocal.y.mul(36).sub(age.mul(1.7))).smoothstep(0.985, 1);
            return sampleVfxRefraction(offset, { chromaticAberration: 0.025 })
              .add(vec3(0.18, 0.55, 0.8).mul(rim).mul(0.65))
              .add(vec3(0.06, 0.16, 0.22).mul(band).mul(0.06));
          },
        },
      });
      fx.path({
        id: 'equatorial-ticks',
        maxSegments: 96,
        sample: (age) => ticks(age, radius, seconds),
        blend: 'alpha',
        orderInLayer: 10,
        look: { colorNode: () => vec3(0.45, 0.9, 1.3), opacityNode: () => intensity.mul(0.6) },
      });
    },
  });
}

export default createCorrosionPool('example.corrosion-pool');
