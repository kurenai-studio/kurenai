// intent: Ground glyphs, rune seals, magic circles and animated rim patterns.
// variants: createGroundSigil(id, { variant: glyph / rune-wall, textureVariant, ringVariant })
// inputs: ground anchor and radius; texture/ring choices apply to glyph
// Copy dependencies: ./shared/special-pack.ts.
// Event binding: playOptions: actual ground position and recipe radius. This glyph is decorative; game code owns gameplay warning footprints.
// Setup in an async scene: const effect = createGroundSigil('game.sigil');
// const vfx = useVfx(context); await vfx.prepare(effect, {});
// const handle = vfx.play(effect, playOptions);
// Import useVfx (and createVfxPointSource when needed) from wanaka-studio-engine/vfx. Prepare once; construct playOptions from the game inputs above per event.
// Update the selected recipe's declared params from gameplay; await handle.finished for complete drain.
// Immediate cancellation: handle.stop({ immediate: true }). Persistent holds end on the game's state/event.
import { sampleVfxLookTexture as sample } from 'wanaka-studio-engine/vfx';
import { cos, mix, sin, vec2, vec3 } from 'three/tsl';
import { type Node } from 'three/webgpu';
import {
  curve,
  defineVfx,
  MOTE_SIZE,
  RANDOM_YAW,
  vfxMesh,
  vfxTexture,
  type VfxDefinition,
  type VfxLayerLook,
} from 'wanaka-studio-engine/vfx';
import { specialLook, specialTexture } from './shared/special-pack.js';

const SPECIAL_RING = [
  vfxTexture('special-ring-1'),
  vfxTexture('special-ring-2'),
  vfxTexture('special-ring-3'),
  vfxTexture('special-ring-4'),
  vfxTexture('special-ring-5'),
  vfxTexture('special-ring-6'),
  vfxTexture('special-ring-7'),
  vfxTexture('special-ring-8'),
] as const;
const SPECIAL_SIGIL = [
  vfxTexture('special-mask-sigil-1'),
  vfxTexture('special-mask-sigil-2'),
  vfxTexture('special-mask-sigil-3'),
  vfxTexture('special-mask-sigil-4'),
] as const;

/** Selects a decorative glyph or a seal with a metric boundary and low rune wall. */
// Copy this file once; select the named variant before prepare, then reuse the definition. Game code owns contacts, damage and cancellation.
// Texture variants: copy shared/special-pack.ts with this file. Select a source-file number before prepare; omission preserves the original composition.
export function createGroundSigil(
  id: string,
  options: {
    readonly variant?: 'glyph' | 'rune-wall';
    readonly radius?: number;
    readonly textureVariant?: number;
    readonly ringVariant?: number;
  } = {},
): VfxDefinition {
  if (
    options.variant === 'rune-wall' &&
    (options.textureVariant !== undefined || options.ringVariant !== undefined)
  )
    throw new Error('Purchased sigil and ring variants use the glyph composition.');
  if ((options.variant ?? 'glyph') === 'glyph')
    return createGallerySigil(id, options.radius, options.textureVariant, options.ringVariant);
  if (options.variant === 'rune-wall') return createMagicCircle(id, options.radius);
  throw new Error('Unknown ground sigil variant.');
}
const GROUND_SURFACE = {
  capacity: 1,
  bursts: [{ time: 0, count: 1 }],
  simulationSpace: 'local',
  blend: 'alpha',
  mode: 'horizontal',
  rotation: { enabled: false },
} as const;
// Copy this file; prepare createGallerySigil(uniqueId, radius). Play unparented at a static horizontal contact, identity rotation and unit scale. Radius is the outer texture card half-size; artwork margins are not a damage boundary.
// Game owns targets, damage and lifetime. Fade params.intensity for activation/release, then stop({ immediate: true }); normal stop retains long-lived surfaces. No slope projection or collision. No host model required.
const GLYPH = 'sigil-complete-geometric-4';
const RIM = 'aura-tintable-rim-4';
const MOTE = 'point-soft-5';
const CYCLE = 32;
/** Creates a static horizontal active sigil; radius is the outer card half-size, not collision geometry. */
export function createGallerySigil(
  id: string,
  radius = 2.2,
  textureVariant?: number,
  ringVariant?: number,
): VfxDefinition {
  if (!Number.isFinite(radius) || radius < 0.5 || radius > 8)
    throw new Error('Sigil radius must be between 0.5 and 8 metres.');
  const glyph = specialTexture(SPECIAL_SIGIL, textureVariant),
    ring = specialTexture(SPECIAL_RING, ringVariant);
  return defineVfx({
    id,
    duration: CYCLE,
    seed: 53,
    loop: true,
    maxInstances: 4,
    params: { intensity: { default: 1, min: 0, max: 1 } },
    build(fx) {
      const intensity = fx.param('intensity') as Node<'float'>;
      const look = { opacityMultiplierNode: () => intensity };
      fx.particles({
        capacity: 1,
        bursts: [{ time: 0, count: 1 }],
        startLife: CYCLE,
        opacityOverLife: [
          { t: 0, v: 1 },
          { t: 1, v: 1 },
        ],
        simulationSpace: 'local',
        look,
        startSize: (radius * 2) / 1.1,
        tint: [0.18, 0.5, 1, 0.92],
        emission: 1.25,
        map: glyph ? vfxTexture('solid') : vfxTexture(GLYPH),
        ...(glyph
          ? {
              look: {
                ...specialLook(glyph, [
                  [0.03, 0.12, 0.3],
                  [0.18, 0.5, 1],
                  [0.5, 0.8, 1.4],
                ]),
                ...look,
              },
            }
          : {}),
        blend: 'alpha',
        mode: 'horizontal',
        orderInLayer: 15,
        transform: { position: [0, 0.035, 0] },
        rotation: { spin: (Math.PI * 2) / CYCLE, enabled: false },
      });
      fx.particles({
        capacity: 1,
        bursts: [{ time: 0, count: 1 }],
        startLife: CYCLE,
        opacityOverLife: [
          { t: 0, v: 1 },
          { t: 1, v: 1 },
        ],
        simulationSpace: 'local',
        look,
        startSize: radius * 2,
        tint: [0.3, 0.72, 1, 0.5],
        emission: 0.85,
        map: ring ? vfxTexture('solid') : vfxTexture(RIM),
        ...(ring
          ? {
              look: {
                ...specialLook(
                  ring,
                  [
                    [0.02, 0.08, 0.2],
                    [0.18, 0.5, 1],
                    [0.5, 0.8, 1.2],
                  ],
                  false,
                  (ctx) => ctx.age.div(1.8).fract(),
                ),
                ...look,
              },
            }
          : {}),
        blend: 'alpha',
        mode: 'horizontal',
        orderInLayer: 15,
        transform: { position: [0, 0.035, 0] },
        rotation: { spin: (-Math.PI * 2) / CYCLE, enabled: false },
      });
      fx.particles({
        capacity: 20,
        simulationSpace: 'local',
        look,
        rateOverTime: 6,
        startLife: [1.2, 2],
        startSpeed: [0.18, 0.48],
        direction: [0, 1, 0],
        spread: 0,
        shape: {
          type: 'circle',
          radius: [radius * 0.55, radius * 0.86],
          burstCount: 1,
          even: false,
        },
        startSize: [0.035, 0.075],
        sizeOverLife: MOTE_SIZE,
        opacityOverLife: [
          { t: 0, v: 1 },
          { t: 1, v: 0 },
        ],
        tint: [0.35, 0.68, 1, 0.78],
        emission: 1.45,
        map: vfxTexture(MOTE),
        orderInLayer: 10,
        transform: { position: [0, 0.08, 0] },
        rotation: { start: RANDOM_YAW },
      });
    },
  });
}
// Copy this file; prepare createMagicCircle(id, gameRadius) once per radius variant. Play unparented at the game-selected horizontal ground contact, identity rotation and unit scale. The fine boundary is centred on gameRadius; the seal and wall remain inside it.
// Game code owns field lifetime, targets, damage and ground selection. Fade params.intensity (0–1) for activation/release, then stop({ immediate: true }); normal stop keeps existing particles through their authored cycle. Hard cancellation clears every layer immediately.
// This is a sustained active field, not a warning countdown or an impact scheduler. It does not project onto slopes, curved terrain or surface edges, or perform collision checks. No host model is required.
const RUNE_CYCLE = 8;
const CIRCLE = 'fx-variety-t-ky-magic-circle020';
const CHANT = 'fx-variety-t-ky-chant-deco-c';
const CYLINDER = 'fx-variety-sm-ky-cylinder-bend07';
// Measured from the pinned source mesh; dimensions are in metres.
const CYLINDER_RADIUS = 0.09751940518618404;
const CYLINDER_HEIGHT = 0.2163805365562439 - 0.0000007507811687901267;
const CYLINDER_BASE = 0.0000007507811687901267;

function rotatedUv(uv: Node<'vec2'>, clock: Node<'float'>, turns: number): Node<'vec2'> {
  const angle = clock.mul(turns * Math.PI * 2),
    p = uv.sub(vec2(0.5, 0.5));
  return vec2(
    p.x.mul(cos(angle)).sub(p.y.mul(sin(angle))),
    p.x.mul(sin(angle)).add(p.y.mul(cos(angle))),
  ).add(vec2(0.5, 0.5));
}
function runeStroke(
  p: Node<'vec2'>,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): Node<'float'> {
  const a = vec2(ax, ay),
    d = vec2(bx - ax, by - ay);
  const t = p.sub(a).dot(d).div(d.dot(d)).clamp(0, 1);
  return p
    .sub(a.add(d.mul(t)))
    .length()
    .smoothstep(0.025, 0.055)
    .oneMinus();
}
function runes(uv: Node<'vec2'>, age: Node<'float'>, count: number): Node<'float'> {
  const around = uv.x.mul(count).add(age.div(RUNE_CYCLE).mul(3)),
    kind = around.floor().mod(3);
  const p = vec2(around.fract(), uv.y.oneMinus());
  const stem = runeStroke(p, 0.5, 0.2, 0.5, 0.8);
  const left = runeStroke(p, 0.5, 0.6, 0.22, 0.8).mul(kind.lessThan(1).select(1, 0));
  const right = runeStroke(p, 0.5, 0.6, 0.78, 0.8).mul(kind.greaterThan(0.5).select(1, 0));
  const foot = runeStroke(p, 0.5, 0.4, 0.72, 0.22);
  const bar = runeStroke(p, 0.25, 0.45, 0.75, 0.6).mul(kind.greaterThan(1.5).select(1, 0));
  return stem.max(left).max(right).max(foot).max(bar);
}
/** Returns a flat field whose boundary radius matches the game's 0.5–8 metre radius input. */
export function createMagicCircle(id: string, radius = 2): VfxDefinition {
  if (!Number.isFinite(radius) || radius < 0.5 || radius > 8)
    throw new Error('Magic circle radius must be between 0.5 and 8 metres.');
  const wallHeight = Math.min(0.6, Math.max(0.4, radius * 0.3 + 0.1));
  // Complete three-glyph groups preserve the seam and keep glyph proportions across radii.
  const runeCount = Math.max(9, Math.round((2 * Math.PI * radius) / (wallHeight * 0.75) / 3) * 3);
  const radialScale = (radius * 0.94) / CYLINDER_RADIUS,
    verticalScale = wallHeight / CYLINDER_HEIGHT;
  const moteRate = Math.min(10, radius * 3);
  return defineVfx({
    id,
    duration: RUNE_CYCLE,
    loop: true,
    seed: 20,
    maxInstances: 4,
    params: { intensity: { default: 1, min: 0, max: 1 } },
    build(fx) {
      const intensity = fx.param('intensity') as Node<'float'>;
      const visibility: VfxLayerLook = { opacityMultiplierNode: () => intensity };
      fx.particles({
        ...GROUND_SURFACE,
        startLife: RUNE_CYCLE,
        startSize: radius * 2,
        map: vfxTexture('solid'),
        tint: [1, 1, 1, 1],
        emission: 1,
        transform: { position: [0, 0.025, 0] },
        orderInLayer: 5,
        look: {
          ...visibility,
          textures: { circle: { texture: vfxTexture(CIRCLE), colorSpace: 'linear' } },
          colorNode(ctx) {
            const uv = ctx.uv as Node<'vec2'>,
              age = ctx.age as Node<'float'>;
            const outer = sample(ctx, 'circle', rotatedUv(uv, age, 1 / RUNE_CYCLE)).y;
            const inner = sample(ctx, 'circle', rotatedUv(uv, age, -2 / RUNE_CYCLE)).x;
            return vec3(0.55, 0.13, 0.9)
              .mul(outer)
              .add(vec3(1.35, 0.68, 1.6).mul(inner));
          },
          opacityNode(ctx) {
            const uv = ctx.uv as Node<'vec2'>,
              age = ctx.age as Node<'float'>;
            const outer = sample(ctx, 'circle', rotatedUv(uv, age, 1 / RUNE_CYCLE)).y;
            const inner = sample(ctx, 'circle', rotatedUv(uv, age, -2 / RUNE_CYCLE)).x;
            const disc = uv.sub(vec2(0.5, 0.5)).length().mul(2).smoothstep(0.96, 1).oneMinus();
            return outer.pow(1.15).add(inner.pow(1.1)).clamp(0, 1).mul(disc).mul(0.85);
          },
        },
      });
      // This metric annulus gives the game radius a stable centre line, independent of the decorative texture margins.
      const boundaryScale = Math.max(1, radius / 2);
      const margin = 0.08 * boundaryScale;
      for (const shadow of [true, false]) {
        fx.particles({
          ...GROUND_SURFACE,
          startLife: RUNE_CYCLE,
          startSize: (radius + margin) * 2,
          map: vfxTexture('solid'),
          tint: [1, 1, 1, 1],
          emission: 1,
          transform: { position: [0, shadow ? 0.028 : 0.03, 0] },
          orderInLayer: shadow ? 7 : 8,
          look: {
            ...visibility,
            colorNode: () => (shadow ? vec3(0.015, 0.008, 0.025) : vec3(0.85, 0.55, 1.15)),
            opacityNode: (ctx) =>
              (ctx.uv as Node<'vec2'>)
                .sub(vec2(0.5, 0.5))
                .length()
                .mul((radius + margin) * 2)
                .sub(radius)
                .abs()
                .smoothstep(
                  (shadow ? 0.032 : 0.012) * boundaryScale,
                  (shadow ? 0.06 : 0.035) * boundaryScale,
                )
                .oneMinus()
                .mul(shadow ? 0.65 : 0.72),
          },
        });
      }
      fx.particles({
        capacity: 1,
        bursts: [{ time: 0, count: 1 }],
        startLife: RUNE_CYCLE,
        startSize: 1,
        mesh: {
          geometry: vfxMesh(CYLINDER),
          scale: [radialScale, verticalScale, radialScale],
          side: 'double',
        },
        map: vfxTexture('solid'),
        tint: [1, 1, 1, 1],
        emission: 1,
        blend: 'alpha',
        simulationSpace: 'local',
        transform: { position: [0, 0.035 - CYLINDER_BASE * verticalScale, 0] },
        rotation: { enabled: false },
        orderInLayer: 6,
        look: {
          ...visibility,
          textures: { chant: { texture: vfxTexture(CHANT), colorSpace: 'linear', wrap: 'repeat' } },
          colorNode: (ctx) =>
            mix(vec3(0.38, 0.11, 0.75), vec3(1, 0.65, 1.4), (ctx.uv as Node<'vec2'>).y.oneMinus()),
          opacityNode(ctx) {
            const uv = ctx.uv as Node<'vec2'>,
              age = ctx.age as Node<'float'>;
            const tex = sample(ctx, 'chant', uv.add(vec2(age.div(RUNE_CYCLE), 0)).fract());
            // The source decoration stores coverage in alpha; its RGB is solid white.
            const glyph = runes(uv, age, runeCount).max(tex.w.mul(0.12));
            const ends = uv.y.smoothstep(0, 0.1).mul(uv.y.smoothstep(0.65, 1).oneMinus());
            return glyph.mul(ends).mul(0.58);
          },
        },
      });
      fx.particles({
        simulationSpace: 'local',
        capacity: Math.ceil(moteRate * 0.8) + 2,
        rateOverTime: moteRate,
        duration: RUNE_CYCLE,
        startLife: [0.45, 0.8],
        startSpeed: [0.25, 0.55],
        direction: [0, 1, 0],
        shape: { type: 'circle', radius: [radius * 0.78, radius * 0.94], axis: [0, 1, 0] },
        drag: 0.4,
        startSize: [0.012, 0.035],
        sizeOverLife: curve([0, 0], [0.12, 1], [1, 0]),
        opacityOverLife: curve([0, 0], [0.1, 0.7], [0.65, 0.4], [1, 0]),
        map: vfxTexture('point-soft-4'),
        tint: [0.7, 0.35, 1, 0.65],
        emission: 1.3,
        look: visibility,
        blend: 'alpha',
        transform: { position: [0, 0.04, 0] },
        orderInLayer: 10,
      });
    },
  });
}

export default createGroundSigil('example.ground-sigil');
