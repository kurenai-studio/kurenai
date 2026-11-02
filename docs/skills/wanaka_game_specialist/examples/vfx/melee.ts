// intent: Authored melee arcs and recorded weapon blade trails.
// variants: createMeleeSlash(id, { variant: ice / warm / water }); createWeaponTrail(id)
// inputs: arc committed attack plane; trail bladeBase/bladeTip history and emitting flag
// Copy dependencies: ./shared/special-pack.ts.
// Event binding: playOptions: committed attack position/rotation in the authored slash plane. Trigger on the swing event. createWeaponTrail instead consumes live bladeBase/bladeTip and emitting.
// Setup in an async scene: const effect = createMeleeSlash('game.slash');
// const vfx = useVfx(context); await vfx.prepare(effect, {});
// const handle = vfx.play(effect, playOptions);
// Import useVfx (and createVfxPointSource when needed) from wanaka-studio-engine/vfx. Prepare once; construct playOptions from the game inputs above per event.
// Update the selected recipe's declared params from gameplay; await handle.finished for complete drain.
// Immediate cancellation: handle.stop({ immediate: true }). Persistent holds end on the game's state/event.
import { sampleVfxLookTexture as sample } from 'wanaka-studio-engine/vfx';
import { atan, dot, float, mix, normalView, vec2, vec3, viewportSize } from 'three/tsl';
import { type Node } from 'three/webgpu';
import {
  curve,
  defineVfx,
  sampleVfxRefraction,
  vfxTexture,
  type Vec3,
  type VfxDefinition,
  type VfxLayerLook,
  type VfxPairedPathSection,
  type VfxParticleContext,
} from 'wanaka-studio-engine/vfx';
import { specialLook, specialTexture, type SpecialTexture } from './shared/special-pack.js';
import { sampleVfxAtlas as sampleAtlas } from 'wanaka-studio-engine/vfx';

const SPECIAL_SLASH = [
  vfxTexture('special-slash-1'),
  vfxTexture('special-slash-2'),
  vfxTexture('special-slash-3'),
  vfxTexture('special-slash-4'),
  vfxTexture('special-slash-5'),
  vfxTexture('special-slash-6'),
  vfxTexture('special-slash-7'),
  vfxTexture('special-slash-8'),
  vfxTexture('special-slash-9'),
  vfxTexture('special-slash-10'),
] as const;

/** Plays an authored attack-plane accent. Use weapon-trail for recorded blade motion. */
// Copy this file once; select the named variant before prepare, then reuse the definition. Game code owns contacts, damage and cancellation.
// Copy shared/special-pack.ts with this file. The ice variant accepts textureVariant 1–10; it retains the committed attack plane and never records arbitrary blade movement.
export function createMeleeSlash(
  id: string,
  options: {
    readonly variant?: 'ice' | 'warm' | 'water';
    readonly radius?: number;
    readonly textureVariant?: number;
  } = {},
): VfxDefinition {
  if (options.textureVariant !== undefined && (options.variant ?? 'ice') !== 'ice')
    throw new Error('Purchased slash texture variants use the ice attack-plane composition.');
  switch (options.variant ?? 'ice') {
    case 'ice':
      return createIceSlash(id, options.radius, options.textureVariant);
    case 'warm':
      return createSwordTrail(id, options.radius);
    case 'water':
      return createWaterSlash(id, options.radius);
    default:
      throw new Error('Unknown melee slash variant.');
  }
}
// Copy this file. Play at the swing pivot with the committed attack quaternion. Local XY is the slash plane; +X is forward, sweeping from -Y toward +Y. Use an unscaled world pose, not a moving blade parent.
// Start playback on the animation's active swing event. SLASH_SWEEP_SECONDS is the blade travel window; remaining particle life is the fading tail. The exported radius and angle describe the authored arc.
// Set the play pose to the actual weapon's swing plane. This authored arc is an attack accent, not a recording of an arbitrary blade trajectory; use a weapon trail for exact blade motion.
// This swing has no automatic hit flash, ground collision, damage or delayed follow-up. Play a material impact separately only after the game confirms contact. Immediate stop clears an interrupted attack.
export const SLASH_RADIUS = 1.35;
export const SLASH_ANGLE = 2.7;
export const SLASH_SWEEP_SECONDS = 0.14;
const LIFE = SLASH_SWEEP_SECONDS + 0.16;
function sweepRibbon(sweepRadius: number) {
  const positions: number[] = [],
    uvs: number[] = [],
    indices: number[] = [];
  const segments = 40;
  for (let i = 0; i <= segments; i++) {
    const u = i / segments,
      angle = (u - 0.5) * SLASH_ANGLE;
    const width = Math.sin(Math.PI * u) * 0.52 * (sweepRadius / SLASH_RADIUS);
    for (const v of [0, 1]) {
      const radius = sweepRadius - width * (1 - v);
      positions.push(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
      uvs.push(u, v);
    }
    if (i < segments) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  return { positions, uvs, indices };
}
/** Returns the grand-slash composition at a game-owned pose. */
export function createIceSlash(
  id: string,
  radius: number = SLASH_RADIUS,
  textureVariant?: number,
): VfxDefinition {
  if (!Number.isFinite(radius) || radius < 0.3 || radius > 4)
    throw new Error('Ice slash radius must be between 0.3 and 4 metres.');
  const atlas = specialTexture(SPECIAL_SLASH, textureVariant);
  const calibration =
    textureVariant === undefined ? undefined : SLASH_ATLAS_FIT[textureVariant - 1];
  if (atlas && !calibration) throw new Error('Slash atlas calibration is missing.');
  const ribbon = calibration
    ? {
        positions: [0, 0, 1, 0, 1, 1, 0, 1].flatMap((_, index, values) => {
          if (index % 2) return [];
          const u = values[index] ?? 0;
          const v = values[index + 1] ?? 0;
          return [
            ((calibration.cy - v) * radius) / calibration.radius,
            ((u - calibration.cx) * radius) / calibration.radius,
            0,
          ];
        }),
        uvs: [0, 0, 1, 0, 1, 1, 0, 1],
        indices: [0, 1, 2, 0, 2, 3],
      }
    : sweepRibbon(radius);
  return defineVfx({
    id,
    duration: SLASH_SWEEP_SECONDS + 0.32,
    maxInstances: 8,
    seed: 7,
    build(fx) {
      fx.particles({
        capacity: 1,
        bursts: [{ time: 0, count: 1 }],
        startLife: LIFE,
        startSize: 1,
        startSpeed: 0,
        startRotation: 0,
        rotate: false,
        map: vfxTexture('solid'),
        mesh: { geometry: ribbon, side: 'double' },
        blend: 'alpha',
        tint: [1, 1, 1, 1],
        emission: 1,
        opacityOverLife: curve([0, 0], [0.06, 1], [0.55, 1], [1, 0]),
        look: bladeLook('ice', SLASH_SWEEP_SECONDS),
        ...(atlas
          ? {
              look: atlasSlashLook(atlas, calibration),
            }
          : {}),
        orderInLayer: 20,
      });
      const mist = specialTexture([vfxTexture('special-smoke-6')], 6);
      if (!mist) throw new Error('Ice slash mist atlas is missing.');
      for (let step = 0; step < 4; step += 1) {
        const u = (step + 0.65) / 4;
        const angle = (u - 0.5) * SLASH_ANGLE;
        const position: Vec3 = [
          Math.cos(angle) * radius * 0.94,
          Math.sin(angle) * radius * 0.94,
          0,
        ];
        const direction: Vec3 = [-Math.sin(angle), Math.cos(angle), 0];
        fx.particles({
          capacity: 4,
          bursts: [{ time: 0, count: 4 }],
          delay: u * SLASH_SWEEP_SECONDS,
          simulationSpace: 'world',
          transform: { position },
          direction,
          spread: 0.55,
          startLife: [0.2, 0.32],
          startSpeed: [1.1, 2.8],
          startSize: [0.035, 0.095],
          gravity: -3.2,
          drag: 1.1,
          mesh: { geometry: ICE_SHARD, side: 'double', orient: 'random' },
          map: vfxTexture('solid'),
          blend: 'alpha',
          tint: [0.3, 0.65, 0.82, 1],
          emission: 0.35,
          lit: true,
          roughness: 0.18,
          rotation: { start: [-Math.PI, Math.PI], spin: [-9, 9] },
          sizeOverLife: curve([0, 0.75], [0.12, 1], [0.75, 0.8], [1, 0]),
          opacityOverLife: curve([0, 1], [0.65, 0.85], [1, 0]),
          orderInLayer: 22,
        });
        fx.particles({
          capacity: 2,
          bursts: [{ time: 0, count: 2 }],
          delay: u * SLASH_SWEEP_SECONDS,
          simulationSpace: 'world',
          transform: { position },
          direction,
          spread: 0.65,
          startLife: [0.22, 0.3],
          startSpeed: [0.3, 0.7],
          startSize: [0.26, 0.44],
          drag: 2,
          map: vfxTexture('solid'),
          blend: 'alpha',
          tint: [1, 1, 1, 0.38],
          rotation: { start: [-Math.PI, Math.PI], spin: [-0.5, 0.5] },
          sizeOverLife: curve([0, 0.45], [0.4, 1], [1, 1.45]),
          opacityOverLife: curve([0, 0], [0.15, 0.6], [0.5, 0.4], [1, 0]),
          look: specialLook(mist, [
            [0.04, 0.12, 0.18],
            [0.16, 0.34, 0.42],
            [0.44, 0.66, 0.74],
          ]),
          orderInLayer: 18,
        });
      }
    },
  });
}
// Elongated closed crystal: asymmetric facets catch light without a camera-facing card.
const ICE_SHARD = (() => {
  const points = [
    [0, 1.5, 0],
    [-0.36, 0, 0],
    [0, 0, 0.26],
    [0.29, 0, 0],
    [0, 0, -0.22],
    [0, -0.7, 0],
  ];
  const faces = [0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 1, 5, 2, 1, 5, 3, 2, 5, 4, 3, 5, 1, 4];
  return {
    positions: faces.flatMap((index) => {
      const point = points[index];
      if (!point) throw new Error('Ice shard face references a missing point.');
      return point;
    }),
  };
})();

// Measured UV circle centres, bright outer radii and full-arc frames in the purchased sheets.
// Atlas motion is texture breakup; the shared attack clock owns angular reveal.
const SLASH_ATLAS_FIT = [
  { cx: 0.4896, cy: 0.4338, radius: 0.2826, peak: 29 / 63 },
  { cx: 0.4765, cy: 0.3527, radius: 0.2382, peak: 0 },
  { cx: 0.4786, cy: 0.4411, radius: 0.3585, peak: 33 / 99 },
  { cx: 0.4694, cy: 0.4307, radius: 0.3577, peak: 33 / 99 },
  { cx: 0.4856, cy: 0.471, radius: 0.3545, peak: 33 / 99 },
  { cx: 0.4796, cy: 0.4225, radius: 0.3497, peak: 33 / 99 },
  { cx: 0.4664, cy: 0.4376, radius: 0.3382, peak: 27 / 99 },
  { cx: 0.516, cy: 0.4242, radius: 0.2155, peak: 18 / 99 },
  { cx: 0.5195, cy: 0.4905, radius: 0.2883, peak: 12 / 63 },
  { cx: 0.5038, cy: 0.4657, radius: 0.2401, peak: 18 / 99 },
] as const;
type SlashAtlasFit = (typeof SLASH_ATLAS_FIT)[number];
function atlasSlashLook(atlas: SpecialTexture, fit?: SlashAtlasFit): VfxLayerLook {
  if (!fit) throw new Error('Slash atlas calibration is missing.');
  const look = specialLook(
    atlas,
    [
      [0.006, 0.025, 0.07],
      [0.045, 0.3, 0.58],
      [0.32, 0.65, 0.95],
    ],
    false,
    (ctx) =>
      ctx.age
        .sub(SLASH_SWEEP_SECONDS)
        .div(0.16)
        .clamp(0, 1)
        .mul(1 - fit.peak)
        .add(fit.peak),
  );
  const color = look.colorNode;
  const opacity = look.opacityNode;
  if (!color || !opacity) throw new Error('Slash atlas palette is missing.');
  const detail = (ctx: VfxParticleContext) =>
    sample(
      ctx,
      'slashDetail',
      ctx.uv
        .mul(vec2(12, 8))
        .add(vec2(ctx.progress.mul(-0.2), 0))
        .fract(),
    ).r;
  return {
    ...look,
    textures: {
      ...look.textures,
      slashDetail: {
        texture: vfxTexture('noise-soft-alias-1'),
        colorSpace: 'linear',
        wrap: 'repeat',
      },
    },
    colorNode: (ctx) => (color(ctx) as Node<'vec3'>).mul(detail(ctx).mul(0.2).add(0.8)),
    opacityNode: (ctx) => {
      const angle = atan(ctx.uv.x.sub(fit.cx), float(fit.cy).sub(ctx.uv.y));
      const u = angle.div(SLASH_ANGLE).add(0.5);
      const age = ctx.age.sub(u.mul(SLASH_SWEEP_SECONDS));
      const reveal = age.smoothstep(0, 0.006);
      const tail = age.div(0.16).clamp(0, 1).oneMinus();
      const arc = u.smoothstep(0, 0.12).mul(u.smoothstep(0.94, 1).oneMinus());
      const radial = ctx.uv.sub(vec2(fit.cx, fit.cy)).length().div(fit.radius);
      return (opacity(ctx) as Float)
        .mul(reveal)
        .mul(tail)
        .mul(arc)
        .mul(radial.smoothstep(1, 1.04).oneMinus());
    },
  };
}
// Copy and prepare createSwordTrail(uniqueId, radius). Play at the actual swing pivot with its committed quaternion and unit scale; local XY is the attack plane, +X forward, -Y to +Y. No hidden lift.
// Trigger on the active swing event. SWORD_SWING_SECONDS is the 0.22-second travel window; the ribbon drains for SWORD_TRAIL_SECONDS. sampleSwordTrailBlade exposes the authored local pose for matching procedural weapon motion.
// This warm variant is a broad fire-laced power swing, not a recording of arbitrary animation; use weapon-trail for exact blade history. Game owns contacts and damage. Sparks are blade embers, not automatic hit feedback. Immediate stop cancels. Rendering supplies heat refraction.
type Section = {
  readonly a: Vec3;
  readonly b: Vec3;
  readonly u: number;
  readonly age: number;
  readonly distance: number;
  readonly connected: boolean;
};
type Sample = {
  readonly base: Vec3;
  readonly tip: Vec3;
  readonly born: number;
  readonly link: boolean;
};
type Float = Node<'float'>;
export const SWORD_SWING_SECONDS = 0.22;
export const SWORD_SWEEP_ANGLE = Math.PI * 1.2;
export const SWORD_RADIUS = 1.35;
const SWING = SWORD_SWING_SECONDS;
const SPARK_LIFE_MAX = 0.32;
export const SWORD_TRAIL_SECONDS = 0.24;
const RIBBON_LIFE = SWORD_TRAIL_SECONDS;
const FRAME = 1 / 120;
const LIMIT = 48;
const MAX_SEGMENTS = LIMIT * 2;
const TRAIL = {
  id: 'trail-taper-right-1',
  colorSpace: 'linear',
} as const;
const NOISE = {
  id: 'noise-soft-alias-1',
  colorSpace: 'linear',
} as const;
const DISTORTION = {
  id: 'trail-wave-ribbons-3',
  colorSpace: 'linear',
} as const;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
function lengthOf(a: Vec3): number {
  return Math.hypot(a[0], a[1], a[2]);
}
/** Local XY authored blade pose: +X forward, sweeping from -Y to +Y. Not arbitrary animation history. */
export function sampleSwordTrailBlade(
  time: number,
  radius = SWORD_RADIUS,
): {
  readonly base: Vec3;
  readonly tip: Vec3;
} {
  const t = clamp01(time / SWING),
    travel = t * t * (3 - 2 * t);
  const angle = (travel - 0.5) * SWORD_SWEEP_ANGLE;
  const tip: Vec3 = [Math.cos(angle) * radius, Math.sin(angle) * radius, 0];
  return { base: [tip[0] * 0.25, tip[1] * 0.25, 0], tip };
}
function bladePose(
  time: number,
  width: number,
  radius: number,
): {
  readonly base: Vec3;
  readonly tip: Vec3;
} {
  const pose = sampleSwordTrailBlade(time, radius);
  return {
    base: [
      pose.tip[0] + (pose.base[0] - pose.tip[0]) * width,
      pose.tip[1] + (pose.base[1] - pose.tip[1]) * width,
      0,
    ],
    tip: pose.tip,
  };
}
function livingSamples(
  age: number,
  life: number,
  width: number,
  radius: number,
): readonly Sample[] {
  const samples: Sample[] = [];
  const end = Math.max(0, age);
  const recordUntil = Math.min(end, SWING);
  const push = (born: number): void => {
    if (born > SWING || end - born >= life) return;
    const previous = samples[samples.length - 1];
    const normalizedAge = clamp01((end - born) / life);
    const taper = 1 - Math.pow(normalizedAge, 1.4) * 0.85;
    const pose = bladePose(born, width * taper, radius);
    const link =
      previous !== undefined &&
      born - previous.born <= 0.1 &&
      lengthOf(sub(pose.base, previous.base)) <= 2 &&
      lengthOf(sub(pose.tip, previous.tip)) <= 2;
    samples.push({ base: pose.base, tip: pose.tip, born, link });
    if (samples.length > LIMIT) samples.shift();
  };
  const steps = Math.floor(recordUntil / FRAME + 1e-8);
  for (let step = 0; step <= steps; step += 1) push(step * FRAME);
  const last = samples[samples.length - 1];
  if (last === undefined || recordUntil - last.born > 1e-8) push(recordUntil);
  return samples;
}
/** Each analytic blade pose supplies one strip section. `age` is the effect clock. */
function sectionsAt(age: number, life: number, width: number, radius: number): readonly Section[] {
  const samples = livingSamples(age, life, width, radius);
  const sections: Section[] = [];
  for (let index = 1; index < samples.length; index += 1) {
    const older = samples[index - 1];
    const newer = samples[index];
    if (older === undefined || newer === undefined || !newer.link) continue;
    sections.push({
      a: older.base,
      b: older.tip,
      u: older.born / SWING,
      age: (age - older.born) / life,
      distance: age,
      connected: false,
    });
    sections.push({
      a: newer.base,
      b: newer.tip,
      u: newer.born / SWING,
      age: (age - newer.born) / life,
      distance: age,
      connected: true,
    });
  }
  return sections;
}
type BladeStyle = 'warm' | 'ice' | 'neutral';
const BLADE_COLORS = {
  warm: { body: [2.3, 0.4, 0.018], edge: [5, 3.2, 0.65] },
  ice: { body: [0.045, 0.3, 0.48], edge: [1.15, 1.9, 2.15] },
  neutral: { body: [0.12, 0.19, 0.23], edge: [0.95, 1.1, 1.2] },
} as const;
/** Authored arcs convert angular position to birth time; recorded paths already carry section age. */
function bladeLook(style: BladeStyle, sweepSeconds?: number): VfxLayerLook {
  const fire = style === 'warm' ? specialTexture([vfxTexture('special-fire-turbulent-2')], 2) : undefined;
  const fields = new WeakMap<VfxParticleContext, { color: Node<'vec3'>; opacity: Float }>();
  const read = (ctx: VfxParticleContext): { color: Node<'vec3'>; opacity: Float } => {
    const cached = fields.get(ctx);
    if (cached) return cached;
    const uv = ctx.uv as Node<'vec2'>;
    const age =
      sweepSeconds === undefined
        ? (ctx.progress as Float)
        : ctx.age.sub(uv.x.mul(sweepSeconds)).div(0.16);
    const t = age.clamp(0, 1);
    const flow = sample(ctx, 'distortion', vec2(uv.x.mul(1.8).sub(t.mul(0.15)).fract(), uv.y)).r;
    const grain = sample(
      ctx,
      'noise',
      uv
        .mul(vec2(5, 2))
        .add(vec2(t.mul(0.2), 0))
        .fract(),
    ).r;
    const flame = fire
      ? sampleAtlas(ctx, {
          textureKey: 'fireAtlas',
          columns: fire.columns,
          rows: fire.rows,
          width: fire.width,
          phase: (ctx.pathDistance as Float).mul(1.65).add(0.06),
          localUv: vec2(uv.x.mul(0.9).add(0.05), uv.y),
        })
      : undefined;
    const fireDensity = flame ? flame.r.mul(flame.a) : float(0);
    const frost =
      style === 'ice'
        ? sample(ctx, 'frost', vec2(uv.x.mul(2.4), uv.y.mul(0.9))).r.smoothstep(0.25, 0.72)
        : float(0);
    const taper = sample(ctx, 'trail', vec2(t.mul(0.85), uv.y)).r;
    const across = uv.y.smoothstep(0.08, 0.3).mul(uv.y.smoothstep(0.985, 1).oneMinus());
    const body = (
      style === 'warm'
        ? flow.mul(0.3).add(fireDensity.mul(0.65)).add(grain.mul(0.1)).add(0.14)
        : flow.smoothstep(0.045, 0.6)
    )
      .mul(taper)
      .mul(across);
    const edge = uv.y
      .smoothstep(0.88, 0.965)
      .mul(uv.y.smoothstep(0.985, 1).oneMinus())
      .mul(t.oneMinus().pow(style === 'warm' ? 1.8 : 3))
      .mul(grain.mul(0.3).add(0.7));
    const erosion = flow.mul(0.6).add(grain.mul(0.4)).sub(t.mul(0.55)).smoothstep(0.015, 0.22);
    const fade = t.smoothstep(0.05, 1).oneMinus();
    const colors = BLADE_COLORS[style];
    const value = {
      color:
        style === 'warm'
          ? mix(
              vec3(0.65, 0.045, 0.004),
              vec3(...colors.body),
              fireDensity.smoothstep(0.02, 0.55).mul(0.65).add(uv.y.pow(1.3).mul(0.35)),
            )
              .add(
                vec3(2.8, 1.6, 0.12)
                  .mul(fireDensity.smoothstep(0.35, 0.8))
                  .mul(uv.y.smoothstep(0.3, 0.8)),
              )
              .add(vec3(...colors.edge).mul(edge))
          : mix(vec3(...colors.body).mul(flow.mul(0.65).add(0.35)), vec3(...colors.edge), edge).add(
              vec3(0.22, 0.48, 0.58).mul(frost).mul(across).mul(t.oneMinus()),
            ),
      opacity: body
        .mul(style === 'warm' ? 0.95 : style === 'ice' ? 0.88 : 0.58)
        .add(edge.mul(style === 'warm' ? 0.9 : 0.72))
        .add(frost.mul(across).mul(0.22))
        .clamp(0, style === 'warm' ? 0.98 : 0.85)
        .mul(fade)
        .mul(mix(1, erosion, t.mul(t)))
        .mul(sweepSeconds === undefined ? float(1) : age.smoothstep(0, 0.06)),
    };
    fields.set(ctx, value);
    return value;
  };
  return {
    textures: {
      ...(style === 'ice'
        ? {
            frost: {
              texture: vfxTexture('crack-thin-network-4'),
              colorSpace: 'linear' as const,
              wrap: 'repeat' as const,
            },
          }
        : {}),
      ...(fire ? { fireAtlas: { texture: fire.texture, colorSpace: 'linear' as const } } : {}),
      trail: { texture: vfxTexture(TRAIL.id), colorSpace: TRAIL.colorSpace, wrap: 'clamp' },
      noise: { texture: vfxTexture(NOISE.id), colorSpace: NOISE.colorSpace, wrap: 'repeat' },
      distortion: {
        texture: vfxTexture(DISTORTION.id),
        colorSpace: DISTORTION.colorSpace,
        wrap: 'repeat',
      },
    },
    colorNode: (ctx) => read(ctx).color,
    opacityNode: (ctx) => read(ctx).opacity,
  };
}
function refractionCoverage(ctx: VfxParticleContext): Float {
  const uv = ctx.uv as Node<'vec2'>;
  const age = ctx.progress as Float;
  return sample(ctx, 'mask', uv)
    .x.clamp(0, 1)
    .mul(uv.y.mul(Math.PI).sin().max(0))
    .mul(age.clamp(0, 1).oneMinus());
}
function refractionLook(): VfxLayerLook {
  return {
    textures: {
      mask: {
        texture: vfxTexture(TRAIL.id),
        colorSpace: TRAIL.colorSpace,
        wrap: 'clamp',
      },
    },
    colorNode: () => vec3(0, 0, 0),
    opacityNode: (ctx) => refractionCoverage(ctx),
    backdropNode: (ctx) =>
      sampleVfxRefraction(
        normalView.xy.mul(vec2(1, -1)).mul(refractionCoverage(ctx).mul(2)).div(viewportSize),
      ),
  };
}
/** Creates one warm authored swing; radius is the local pivot-to-tip distance in metres. */
export function createSwordTrail(id: string, radius = SWORD_RADIUS): VfxDefinition {
  if (!Number.isFinite(radius) || radius < 0.4 || radius > 3)
    throw new Error('Sword trail radius must be between 0.4 and 3 metres.');
  return defineVfx({
    id,
    duration: SWING + SPARK_LIFE_MAX,
    seed: 63,
    maxInstances: 4,
    build(fx) {
      fx.path({
        id: 'refraction',
        maxSegments: MAX_SEGMENTS,
        position: [0, 0, 0],
        yaw: 0,
        blend: 'alpha',
        orderInLayer: -1,
        look: refractionLook(),
        sample: (age) => sectionsAt(age, RIBBON_LIFE, 0.8, radius),
      });
      fx.path({
        id: 'blade-afterimage',
        maxSegments: MAX_SEGMENTS,
        position: [0, 0, 0],
        yaw: 0,
        blend: 'alpha',
        orderInLayer: 0,
        look: bladeLook('warm'),
        sample: (age) => sectionsAt(age, RIBBON_LIFE, 1, radius),
      });
      fx.path({
        id: 'blade-edge',
        maxSegments: MAX_SEGMENTS,
        blend: 'alpha',
        orderInLayer: 1,
        look: {
          colorNode: () => vec3(5.5, 3.4, 0.7),
          opacityNode: (ctx) => (ctx.progress as Float).clamp(0, 1).oneMinus().pow(1.6).mul(0.85),
        },
        sample: (age) => sectionsAt(age, 0.1, 0.04, radius),
      });
      const fire = specialTexture([vfxTexture('special-fire-turbulent-2')], 2);
      if (!fire) throw new Error('Warm slash fire atlas is missing.');
      for (let step = 0; step < 6; step += 1) {
        const born = ((step + 1) * SWING) / 6;
        const tip = sampleSwordTrailBlade(born, radius).tip;
        fx.particles({
          capacity: 5,
          simulationSpace: 'world',
          delay: born,
          startLife: [0.18, SPARK_LIFE_MAX],
          startSpeed: [1.2, 2.8],
          direction: [-tip[1], tip[0], 0],
          spread: 0.3,
          transform: { position: tip },
          gravity: -2.5,
          drag: 0.7,
          startSize: [0.012, 0.03],
          opacityOverLife: [
            { t: 0, v: 0.8 },
            { t: 1, v: 0 },
          ],
          tint: [1, 0.5, 0.16, 1],
          emission: 2.8,
          mode: 'stretched',
          stretch: { speedFactor: 0.025, lengthFactor: 1.5 },
          blend: 'alpha',
          map: vfxTexture('point-soft-4'),
        });
        fx.particles({
          capacity: 3,
          bursts: [{ time: 0, count: 3 }],
          delay: born,
          simulationSpace: 'world',
          startLife: [0.18, 0.28],
          startSize: [0.24, 0.44],
          startSpeed: [0.7, 1.4],
          direction: [-tip[1], tip[0], 0],
          spread: 0.45,
          transform: { position: tip },
          gravity: 0.8,
          drag: 2.2,
          noise: { strength: 0.16, frequency: 3, scrollSpeed: 1.2 },
          map: vfxTexture('solid'),
          tint: [1, 1, 1, 0.85],
          blend: 'alpha',
          rotation: { start: [-0.6, 0.6], enabled: false },
          sizeOverLife: curve([0, 0.55], [0.16, 1], [0.65, 1.15], [1, 0.4]),
          opacityOverLife: curve([0, 0], [0.06, 1], [0.55, 0.8], [1, 0]),
          look: specialLook(
            fire,
            [
              [0.08, 0.003, 0.0005],
              [1.6, 0.23, 0.006],
              [4, 1.8, 0.15],
            ],
            false,
            (ctx) => ctx.progress.mul(0.65).add(ctx.lifetime.mul(19.17).fract().mul(0.1)).add(0.06),
          ),
        });
      }
    },
  });
}
// Copy this file; prepare createWaterSlash(id, radius) once. Play at the swing pivot with a committed unscaled world pose: local XY is the attack plane, +X forward, sweeping from -Y to +Y. No moving weapon parent.
// Start on the animation swing event. waterSlashTiming describes the authored accent, not collision or damage. Use a weapon trail for arbitrary recorded blade motion; game code owns hits and material-specific impact feedback.
// Requires Rendering for subtle water refraction. Optional params.surfaceNormal and surfaceDistance are a unit world receiving-plane normal and dot(normal, contact); zero normal disables clipping. Droplet centres fade behind that plane, without bounce or scene collision.
// Immediate stop cancels every layer; await handle.finished for completion. Droplets have world gravity and do not track the actor after release.
/** Visual arc and travel; gameplay independently decides the active hit window. */
export const waterSlashTiming = { radius: 1.45, angle: 2.5, sweep: 0.18, sheetLife: 0.46 } as const;
const WATER_NOISE = {
  noise: { texture: vfxTexture('noise-soft-alias-1'), colorSpace: 'linear' as const },
  atlas: { texture: vfxTexture('water-splash-animation-2'), colorSpace: 'linear' as const },
};
function waterRibbon(radius: number) {
  const positions: number[] = [],
    uvs: number[] = [],
    indices: number[] = [];
  const along = 48,
    across = 6,
    verticesPerFace = (along + 1) * (across + 1);
  // Opposite outward faces enclose a rounded water lens; backface culling avoids stacking two tinted sheets.
  for (let face = 0; face < 2; face++) {
    for (let i = 0; i <= along; i++) {
      const u = i / along,
        angle = (u - 0.5) * waterSlashTiming.angle;
      const width = radius * 0.32 * Math.pow(Math.max(0, Math.sin(Math.PI * u)), 0.7);
      for (let j = 0; j <= across; j++) {
        const v = j / across,
          r = radius - width * (1 - v);
        const bulge =
          radius * 0.12 * Math.sin(Math.PI * u) * Math.sin(Math.PI * v) * (face === 0 ? 1 : -1);
        positions.push(Math.cos(angle) * r, Math.sin(angle) * r, bulge);
        uvs.push(u, v);
        if (i < along && j < across) {
          const a = face * verticesPerFace + i * (across + 1) + j,
            b = a + across + 1;
          if (face === 0) indices.push(a, a + 1, b, a + 1, b + 1, b);
          else indices.push(a, b, a + 1, a + 1, b, b + 1);
        }
      }
    }
  }
  return { positions, uvs, indices };
}
function field(ctx: VfxParticleContext): Node<'float'> {
  const sample = ctx.sampleTexture;
  if (sample === undefined) throw new Error('Water slash noise texture is not bound.');
  const uv = ctx.uv as Node<'vec2'>,
    age = ctx.age as Node<'float'>;
  return (
    sample('noise', uv.mul(vec2(4.2, 1.4)).sub(vec2(2.1, 0.3).mul(age)).fract()) as Node<'vec4'>
  ).x;
}
function waterFoam(ctx: VfxParticleContext): Float {
  return sampleAtlas(ctx, {
    columns: 7,
    rows: 7,
    width: 2048,
    phase: ctx.age.div(waterSlashTiming.sheetLife),
    localUv: ctx.uv,
  }).r;
}
function visibleSheet(ctx: VfxParticleContext): Node<'float'> {
  const uv = ctx.uv as Node<'vec2'>,
    age = ctx.age as Node<'float'>;
  const head = age.div(waterSlashTiming.sweep).clamp(0, 1.15);
  const front = uv.x.sub(head).smoothstep(-0.045, 0).oneMinus();
  const tail = uv.x.sub(head.sub(0.62)).smoothstep(-0.04, 0.12);
  const ends = uv.x.smoothstep(0, 0.04).mul(uv.x.smoothstep(0.92, 1).oneMinus());
  const fade = age
    .smoothstep(0, 0.018)
    .mul(age.smoothstep(0.25, waterSlashTiming.sheetLife).oneMinus());
  const body = uv.y.sub(field(ctx).mul(0.24)).smoothstep(0, 0.25);
  const density = field(ctx).mul(0.3).add(0.25).add(waterFoam(ctx).mul(0.35));
  const crest = uv.y.smoothstep(0.86, 0.98);
  return front.mul(tail).mul(ends).mul(fade).mul(body).mul(density.max(crest));
}
/** Returns a water swing accent of the given radius in metres; prepare once per radius variant. */
export function createWaterSlash(
  id: string,
  radius: number = waterSlashTiming.radius,
): VfxDefinition {
  if (!Number.isFinite(radius) || radius < 0.3 || radius > 4)
    throw new Error('Water slash radius must be between 0.3 and 4 metres.');
  const ribbon = waterRibbon(radius);
  return defineVfx({
    id,
    duration: 0.86,
    maxInstances: 8,
    seed: 7,
    params: { surfaceNormal: { default: [0, 0, 0] }, surfaceDistance: { default: 0 } },
    build(fx) {
      const normal = fx.param('surfaceNormal') as Node<'vec3'>,
        distance = fx.param('surfaceDistance') as Node<'float'>;
      const clip: VfxLayerLook = {
        opacityMultiplierNode: (ctx) =>
          normal
            .length()
            .greaterThan(0.5)
            .select(dot(ctx.position, normal).sub(distance).smoothstep(-0.015, 0.025), 1),
      };
      fx.particles({
        capacity: 1,
        bursts: [{ time: 0, count: 1 }],
        startLife: waterSlashTiming.sheetLife,
        startSize: 1,
        mesh: { geometry: ribbon, side: 'front' },
        simulationSpace: 'local',
        map: vfxTexture('solid'),
        tint: [1, 1, 1, 1],
        emission: 1,
        blend: 'alpha',
        rotation: { enabled: false },
        orderInLayer: 18,
        look: {
          textures: WATER_NOISE,
          opacityNode: visibleSheet,
          backdropNode(ctx) {
            const v = (ctx.uv as Node<'vec2'>).y,
              noise = field(ctx);
            const foam = v
              .smoothstep(0.65, 0.96)
              .mul(
                noise
                  .smoothstep(0.25, 0.7)
                  .mul(0.35)
                  .add(waterFoam(ctx).smoothstep(0.04, 0.45).mul(0.65)),
              );
            const water = sampleVfxRefraction(
              normalView.xy.mul(noise.mul(2).sub(1)).mul(1.5).div(viewportSize),
            );
            return mix(
              water.mul(vec3(0.48, 0.8, 0.9)).add(vec3(0.008, 0.07, 0.09)),
              vec3(0.55, 0.8, 0.85),
              foam.mul(0.8),
            );
          },
        },
      });
      // These are shed water, not contact events. Release each group at the authored crest.
      for (let i = 0; i < 7; i++) {
        const u = (i + 0.5) / 7,
          angle = (u - 0.5) * waterSlashTiming.angle;
        fx.particles({
          capacity: 4,
          bursts: [{ time: 0, count: 4 }],
          delay: u * waterSlashTiming.sweep,
          startLife: [0.22, 0.58],
          startSize: [0.022 * radius, 0.052 * radius],
          startSpeed: [0.7, 1.65],
          direction: [-Math.sin(angle), Math.cos(angle), 0.16],
          spread: 0.32,
          transform: { position: [Math.cos(angle) * radius, Math.sin(angle) * radius, 0] },
          simulationSpace: 'world',
          gravity: -9.8,
          drag: 0.5,
          sizeOverLife: curve([0, 0.7], [0.16, 1], [1, 0.2]),
          opacityOverLife: curve([0, 0], [0.06, 0.8], [0.7, 0.65], [1, 0]),
          map: vfxTexture('point-soft-4'),
          blend: 'alpha',
          tint: [0.38, 0.72, 0.82, 0.8],
          emission: 0.35,
          look: clip,
          orderInLayer: 20,
        });
      }
    },
  });
}

export const TRAIL_LIFETIME = 0.16;
type BladeSample = {
  travel: number;
  speed: number;
  base: Vec3;
  tip: Vec3;
  born: number;
  connected: boolean;
};
function point(value: number | boolean | Vec3): Vec3 | undefined {
  return Array.isArray(value) && value.length === 3 && value.every(Number.isFinite)
    ? [value[0], value[1], value[2]]
    : undefined;
}
function distance(a: Vec3, b: Vec3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}
function taperBase(sample: BladeSample, age: number): Vec3 {
  const width = Math.max(0.18, Math.min(1, sample.speed / 8));
  const t = 1 - width * (1 - Math.pow(Math.max(0, Math.min(1, age)), 1.5) * 0.85);
  return [
    sample.base[0] + (sample.tip[0] - sample.base[0]) * t,
    sample.base[1] + (sample.tip[1] - sample.base[1]) * t,
    sample.base[2] + (sample.tip[2] - sample.base[2]) * t,
  ];
}
const histories = new WeakMap<
  object,
  {
    samples: BladeSample[];
    lastAge: number;
    recording: boolean;
  }
>();
/** Creates the weapon trail composition; game code owns placement and events. */
// Copy this file. Prepare once, then play unparented at world origin with params { bladeBase, bladeTip, emitting: true } in world coordinates. Update both points after weapon animation each frame, before VFX update. Do not also parent or transform the effect.
// At swing end set emitting=false, let TRAIL_LIFETIME elapse, then stop. Immediate stop clears an interrupted attack. Stationary poses add no ribbon; long frame gaps and large position jumps disconnect it.
// Strip width responds to measured blade speed; distance-based UVs keep Trail5/Trail42 detail stable as frame timing changes. This is visual history, not swept collision or damage. Game code owns animation, contacts and hit feedback. The default has emitting=false and intentionally shows nothing without blade input.
export function createWeaponTrail(id: string): VfxDefinition {
  return defineVfx({
    id,
    duration: 2,
    maxInstances: 4,
    seed: 7,
    params: {
      bladeBase: { default: [0, 0, 0] },
      bladeTip: { default: [0, 0, 0] },
      emitting: { default: false },
    },
    build(fx) {
      fx.path({
        id: 'blade-history',
        maxSegments: 48,
        blend: 'alpha',
        orderInLayer: 20,
        sample(age, context) {
          if (!context) return [];
          let history = histories.get(context);
          if (!history || age < history.lastAge) {
            history = { samples: [], lastAge: age, recording: false };
            histories.set(context, history);
          }
          const gap = age - history.lastAge;
          history.lastAge = age;
          history.samples = history.samples.filter((s) => age - s.born < TRAIL_LIFETIME);
          const base = point(context.param('bladeBase')),
            tip = point(context.param('bladeTip'));
          const wasRecording = history.recording;
          history.recording = false;
          if (
            context.param('emitting') === true &&
            base &&
            tip &&
            distance(base, tip) > 0.02 &&
            distance(base, tip) < 4
          ) {
            history.recording = true;
            const previous = history.samples[history.samples.length - 1];
            const movement = previous
              ? Math.max(distance(base, previous.base), distance(tip, previous.tip))
              : Infinity;
            if (!previous || movement > 0.002) {
              history.samples.push({
                travel:
                  (previous?.travel ?? 0) +
                  (previous
                    ? (distance(base, previous.base) + distance(tip, previous.tip)) * 0.5
                    : 0),
                speed: previous && age > previous.born ? movement / (age - previous.born) : 0,
                base,
                tip,
                born: age,
                connected:
                  wasRecording &&
                  !!previous &&
                  gap <= 0.1 &&
                  age - previous.born <= 0.1 &&
                  movement < 1.5,
              });
              if (history.samples.length > 48) history.samples.shift();
            }
          }
          return history.samples.map(
            (s, i): VfxPairedPathSection => ({
              a: taperBase(s, (age - s.born) / TRAIL_LIFETIME),
              b: s.tip,
              u: s.travel * 1.25,
              age: (age - s.born) / TRAIL_LIFETIME,
              connected: i > 0 && s.connected,
            }),
          );
        },
        look: bladeLook('neutral'),
      });
    },
  });
}

export default createMeleeSlash('example.melee-slash');
