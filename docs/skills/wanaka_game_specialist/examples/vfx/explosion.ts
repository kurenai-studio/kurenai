// intent: Grounded and airborne explosions with paired atlas bursts.
// variants: createFireExplosion, createGrandExplosion, createDebrisExplosion, createPairedFlipbook
// inputs: Confirmed blast centre; select grounded/airborne recipe and visual extent before preparation.
// Copy dependencies: ./shared/special-pack.ts.
// Setup in an async scene: const effect = createFireExplosion('example.explosion');
// const vfx = useVfx(context); await vfx.prepare(effect, {});
// const handle = vfx.play(effect, playOptions);
// Import useVfx from wanaka-studio-engine/vfx; construct playOptions from the recipe notes and real game inputs.
import { mix, vec2, vec3 } from 'three/tsl';
import { type Node } from 'three/webgpu';
import {
  BURST_SIZE,
  RANDOM_YAW,
  type VfxDefinition,
  type VfxLayerLook,
  type VfxParticleContext,
  curve,
  defineVfx,
  vfxTexture,
} from 'wanaka-studio-engine/vfx';
import { sampleVfxAtlas as sampleAtlas } from 'wanaka-studio-engine/vfx';
import { specialTexture, type SpecialTexture } from './shared/special-pack.js';

const SPECIAL_EXPLOSION = [
  vfxTexture('special-explosion-3'),
  vfxTexture('special-explosion-4'),
  vfxTexture('special-explosion-5'),
  vfxTexture('special-explosion-6'),
  vfxTexture('special-explosion-7'),
  vfxTexture('special-explosion-8'),
  vfxTexture('special-explosion-9'),
  vfxTexture('special-explosion-10'),
  vfxTexture('special-explosion-11'),
  vfxTexture('special-explosion-12'),
  vfxTexture('special-explosion-13'),
  vfxTexture('special-explosion-14'),
  vfxTexture('special-explosion-15'),
  vfxTexture('special-explosion-16'),
  vfxTexture('special-explosion-17'),
  vfxTexture('special-explosion-18'),
  vfxTexture('special-explosion-19'),
  vfxTexture('special-explosion-20'),
  vfxTexture('special-explosion-21'),
  vfxTexture('special-explosion-22'),
  vfxTexture('special-explosion-23'),
  vfxTexture('special-explosion-24'),
  vfxTexture('special-explosion-25'),
  vfxTexture('special-explosion-26'),
  vfxTexture('special-explosion-27'),
  vfxTexture('special-explosion-28'),
  vfxTexture('special-explosion-29'),
  vfxTexture('special-explosion-30'),
] as const;
/** Atlas blasts support ground contacts or an airborne centre; debris blasts use a ground contact. */
export type FireExplosionOptions =
  | {
      readonly variant?: 'atlas';
      readonly grounded?: boolean;
      readonly groundHeight?: number;
      readonly textureVariant?: number;
    }
  | {
      readonly variant: 'debris';
    };
/** Returns the selected explosion composition, preserving its authored space and timing. */
// Copy this file once; select the named variant before prepare, then reuse the definition. Game code owns contacts, damage and cancellation.
// Texture variants: copy shared/special-pack.ts with this file. Select a source-file number before prepare; omission preserves the original composition.
export function createFireExplosion(id: string, options: FireExplosionOptions = {}): VfxDefinition {
  switch (options.variant) {
    case undefined:
    case 'atlas':
      return createGrandExplosion(
        id,
        options.groundHeight,
        options.textureVariant,
        options.grounded,
      );
    case 'debris':
      return createDebrisExplosion(id);
    default:
      throw new Error('Unknown fire explosion variant.');
  }
}
const WORLD_SMOKE = { simulationSpace: 'world', blend: 'alpha' } as const;
function explosionAtlasLook(atlas: SpecialTexture, textureVariant?: number): VfxLayerLook {
  const smokeLed = textureVariant !== undefined && textureVariant >= 3 && textureVariant <= 7;
  const sample = (ctx: VfxParticleContext): Node<'vec4'> =>
    sampleAtlas(ctx, {
      ...atlas,
      phase: ctx.progress.oneMinus().pow(2.2).oneMinus(),
    });
  return {
    textures: {
      atlas: { texture: atlas.texture, colorSpace: 'linear' },
      heatNoise: { texture: vfxTexture('noise-soft-alias-1'), colorSpace: 'linear' },
    },
    colorNode: (ctx) => {
      const density = sample(ctx).r.clamp(0, 1);
      // Shaded density is not temperature. A broken-up interior heat region keeps
      // the smoke's bright surface lobes from becoming an incandescent crust.
      const noise = ctx.sampleTexture?.(
        'heatNoise',
        ctx.uv
          .mul(1.2)
          .add(vec2(0, ctx.progress.mul(0.4)))
          .fract(),
      ) as Node<'vec4'>;
      const heat = ctx.uv
        .sub(0.5)
        .length()
        .mul(-2.2)
        .add(1.15)
        .add(noise.r.mul(0.35))
        .sub(ctx.progress.mul(smokeLed ? 8 : 3.1))
        .smoothstep(0.05, 0.55);
      const fire = mix(vec3(0.15, 0.012, 0.001), vec3(1, 0.16, 0.006), density.pow(1.5));
      const hot = mix(fire, vec3(1.3, 0.65, 0.18), density.pow(8));
      const smoke = mix(vec3(0.009, 0.01, 0.012), vec3(0.08, 0.075, 0.07), density);
      return mix(smoke, hot, heat);
    },
    opacityNode: (ctx) => sample(ctx).a,
  };
}
// Prepare createFireExplosion(id, { grounded: false }) for an air burst centred on the confirmed blast point; its default atlas is Explosion15.
// Ground blasts default to grounded=true; groundHeight is the horizontal receiving floor. Select textureVariant 3–30 before preparation.
// groundHeight is a world-space plane, shared by clipping and debris bounce. This example does not resolve terrain intersections, damage or sloped surfaces.
export function createGrandExplosion(
  id: string,
  groundHeight = 0,
  textureVariant?: number,
  grounded = true,
): VfxDefinition {
  if (!Number.isFinite(groundHeight)) throw new Error('Explosion ground height must be finite.');
  const atlas = specialTexture(SPECIAL_EXPLOSION, textureVariant ?? (grounded ? undefined : 15));
  return defineVfx({
    id,
    duration: atlas ? 2.8 : 2,
    seed: 7,
    maxInstances: 4,
    build(fx) {
      const shared = {
        ...WORLD_SMOKE,
        direction: [0, 1, 0] as const,
        orderInLayer: 10,
        transform: { position: [0, grounded ? 1 : 0, 0] as const },
        look: grounded
          ? {
              opacityMultiplierNode: (ctx: { readonly position: Node<'vec3'> }) =>
                ctx.position.y.greaterThanEqual(groundHeight).select(1, 0),
            }
          : {},
      };
      fx.particles({
        startLife: 1.8,
        startSize: 5,
        map: vfxTexture('ember-explosion-set-1-1'),
        flipbook: { columns: 8, rows: 8, loop: false, mix: true },
        soft: 1,
        normal: {
          texture: vfxTexture('ember-explosion-set-1-3'),
          strength: 1,
        },
        motion: {
          texture: vfxTexture('ember-explosion-set-1-2'),
          pixels: 8,
        },
        ...shared,
        ...(atlas
          ? {
              map: vfxTexture('solid'),
              flipbook: undefined,
              opacityOverLife: curve([0, 1], [0.65, 0.95], [1, 0]),
              normal: undefined,
              motion: undefined,
              startSpeed: 0.3,
              drag: 0.5,
              look: {
                ...shared.look,
                ...explosionAtlasLook(atlas, textureVariant),
              },
            }
          : {}),
        emission: 1.4,
        transform: { position: [0, grounded ? 0.7 : 0, 0] },
        rotation: { enabled: false },
      });
      fx.particles({
        startLife: atlas ? 0.045 : 0.08,
        startSize: 2.1,
        sizeOverLife: curve([0, 0.85], [0.12, 1], [1, 0]),
        opacityOverLife: curve([0, 1], [0.3, 0.8], [1, 0]),
        map: atlas ? vfxTexture('glow') : vfxTexture('flash-radial-spikes-6'),
        soft: 1,
        ...shared,
        emission: atlas ? 1.2 : 3,
        blend: atlas ? 'additive' : shared.blend,
        tint: [1, 0.64, 0.2, 1],
      });
      if (atlas)
        fx.particles({
          ...shared,
          capacity: 3,
          delay: 0.18,
          startLife: [1.8, 2.5],
          startSize: [1.4, 2],
          startSpeed: [0.25, 0.65],
          spread: 0.5,
          drag: 0.4,
          shape: { type: 'sphere', radius: [0.05, 0.2] },
          map: vfxTexture('smoke-body-animation-1'),
          flipbook: { columns: 8, rows: 8, loop: false, mix: true },
          colorSource: 'texture',
          tint: [0.12, 0.115, 0.11, 0.35],
          emission: 1,
          soft: 0.2,
          transform: { position: [0, grounded ? 0.7 : 0, 0] },
          sizeOverLife: curve([0, 0.65], [0.35, 1.15], [1, 1.6]),
          opacityOverLife: curve([0, 0], [0.18, 1], [0.6, 0.8], [1, 0]),
          rotation: { start: RANDOM_YAW, spin: [-0.1, 0.1] },
          orderInLayer: 8,
        });
      if (grounded && atlas)
        fx.particles({
          ...shared,
          capacity: 8,
          delay: 0.025,
          startLife: [0.5, 0.85],
          startSize: [0.6, 1.1],
          startSpeed: [2, 4],
          direction: undefined,
          radial: 'outward',
          shape: { type: 'circle', radius: [0.08, 0.25] },
          drag: 3,
          map: vfxTexture('smoke-textured-puff-1'),
          coverage: 'luminance',
          colorSource: 'texture',
          tint: [0.3, 0.25, 0.2, 0.4],
          emission: 1,
          soft: 0.15,
          transform: { position: [0, 0.12, 0] },
          sizeOverLife: curve([0, 0.3], [0.18, 0.85], [1, 1.6]),
          opacityOverLife: curve([0, 0], [0.08, 1], [0.5, 0.65], [1, 0]),
          rotation: { start: RANDOM_YAW, spin: [-0.15, 0.15] },
        });
      else if (grounded)
        fx.particles({
          startLife: 0.38,
          startSize: 8,
          sizeOverLife: curve([0, 0], [1, 1]),
          opacityOverLife: curve([0, 0], [0.08, 0.35], [0.45, 0.15], [1, 0]),
          map: vfxTexture('circle-wispy-outline-1'),
          ...shared,
          emission: 0.45,
          tint: [0.6, 0.5, 0.38, 0.65],
          mode: 'horizontal',
          orderInLayer: 15,
          transform: { position: [0, 0.04, 0] },
        });
      fx.particles({
        capacity: 14,
        startLife: [0.65, 1.2],
        startSpeed: [3, 6],
        spread: 1.3,
        startSize: atlas ? [0.018, 0.07] : [0.055, 0.16],
        sizeOverLife: curve([0, 0.8], [0.1, 1], [1, 0]),
        gravity: -8,
        collision: grounded ? { bounce: 0.18, friction: 0.65, distance: groundHeight } : undefined,
        map: vfxTexture('stone-variant-debris-2'),
        flipbook: { columns: 4, rows: 4, loop: false, playback: 'hold', startFrame: 'random' },
        ...shared,
        ...(atlas
          ? {
              direction: undefined,
              radial: 'outward' as const,
              shape: {
                type: grounded ? ('hemisphere' as const) : ('sphere' as const),
                radius: [0.05, 0.15] as const,
              },
              drag: 0.35,
            }
          : {}),
        orderInLayer: 20,
        rotation: { spin: 2 },
      });
      fx.particles({
        capacity: 24,
        startLife: atlas ? [0.15, 0.6] : 0.55,
        startSpeed: 6,
        spread: 1.2,
        dampen: 0.1,
        startSize: atlas ? [0.008, 0.02] : 0.04,
        sizeOverLife: curve([0, 1], [0.7, 0.5], [1, 0]),
        map: atlas ? vfxTexture('point-soft-5') : vfxTexture('point-solid-2'),
        ...shared,
        ...(atlas
          ? {
              direction: undefined,
              radial: 'outward' as const,
              shape: {
                type: grounded ? ('hemisphere' as const) : ('sphere' as const),
                radius: [0.04, 0.1] as const,
              },
              gravity: -9.8,
              drag: 0.9,
              colorSource: 'tint' as const,
              blend: 'additive' as const,
              colorOverLife: [
                { t: 0, rgba: [1, 0.7, 0.3, 1] as const },
                { t: 0.3, rgba: [1, 0.25, 0.03, 0.8] as const },
                { t: 1, rgba: [0.3, 0.025, 0.002, 0] as const },
              ],
            }
          : {}),
        mode: 'stretched',
        stretch: atlas
          ? { speedFactor: 0.02, lengthFactor: 0.6 }
          : { speedFactor: 0.35, lengthFactor: 3 },
        emission: atlas ? 1.6 : 4,
        tint: [1, 0.45, 0.08, 1],
        orderInLayer: 30,
      });
      fx.light({
        intensity: atlas ? 4 : 7,
        range: 7,
        color: [1, 0.35, 0.08],
        life: atlas ? 0.16 : 0.35,
        ...(atlas ? { curve: curve([0, 1], [0.15, 0.7], [1, 0]) } : {}),
      });
    },
  });
}
// Copy this file for a ground blast; local +Y is up. Game code owns the confirmed contact, damage, cancellation and surface placement.
const PLUME_SIZE = curve([0, 0.68], [1, 1]);
const SMOKE_COL = [
  { t: 0, rgba: [1, 0.5, 0.2, 0] as const },
  { t: 0.12, rgba: [0.6, 0.48, 0.38, 0.8] as const },
  { t: 0.65, rgba: [0.38, 0.36, 0.34, 0.45] as const },
  { t: 1, rgba: [0.3, 0.3, 0.3, 0] as const },
];
/** Returns the explosion-big composition at a game-owned pose. */
export function createDebrisExplosion(id: string): VfxDefinition {
  return defineVfx({
    id,
    duration: 2.4,
    seed: 7,
    maxInstances: 4,
    build(fx) {
      fx.particles({
        startLife: 0.075,
        startSize: 3.8,
        sizeOverLife: curve([0, 0.8], [0.12, 1], [1, 0]),
        opacityOverLife: curve([0, 1], [0.3, 0.75], [1, 0]),
        map: vfxTexture('glow'),
        blend: 'additive-soft',
        emission: 2.2,
        tint: [1, 0.31, 0.08, 1],
        colorSource: 'tint',
        orderInLayer: 10,
        transform: { position: [0, 1, 0] },
        rotation: { start: RANDOM_YAW },
      });
      fx.particles({
        capacity: 3,
        startLife: [1.6, 1.9],
        startSpeed: [0.3, 1],
        direction: [0, 1, 0],
        spread: 1,
        startSize: [3, 4],
        tint: [1, 0.8, 0.6, 0.9],
        sizeOverLife: BURST_SIZE,
        shape: { type: 'sphere', radius: [0.2, 0.46] },
        dampen: 0.2,
        map: vfxTexture('ember-explosion-set-1-1'),
        blend: 'alpha',
        orderInLayer: 20,
        transform: { position: [0, 1, 0] },
      });
      fx.particles({
        capacity: 8,
        delay: 0.2,
        startLife: 0.55,
        startSpeed: [0.4, 1.2],
        spread: 1,
        startSize: [0.35, 0.5],
        sizeOverLife: BURST_SIZE,
        shape: { type: 'sphere', radius: [0.2, 0.46] },
        dampen: 0.2,
        map: vfxTexture('smoke-irregular-wisp-7'),
        blend: 'alpha',
        emission: 1,
        orderInLayer: 20,
        transform: { position: [0, 1, 0] },
      });
      fx.light({ intensity: 8, range: 10, color: [1, 0.55, 0.18], life: 0.4 });
      fx.particles({
        startLife: 0.4,
        startSize: 5.5,
        opacityOverLife: curve([0, 0.45], [0.3, 0.2], [1, 0]),
        map: vfxTexture('circle-radial-burst-12'),
        blend: 'alpha',
        emission: 0.5,
        tint: [0.55, 0.45, 0.35, 0.5],
        mode: 'horizontal',
        transform: { position: [0, 0.035, 0] },
        orderInLayer: 15,
      });
      fx.particles({
        capacity: 28,
        rateOverTime: 18,
        duration: 0.65,
        delay: 0.16,
        startLife: [0.9, 1.45],
        startSpeed: [0.7, 1.4],
        direction: [0, 1, 0],
        shape: { type: 'box', size: [1.2, 0.25, 1.2] },
        startSize: [1.5, 2.7],
        sizeOverLife: PLUME_SIZE,
        colorOverLife: SMOKE_COL,
        map: vfxTexture('smoke-irregular-wisp-7'),
        blend: 'alpha',
        tint: [0.65, 0.6, 0.55, 0.75],
        lit: true,
        orderInLayer: -2,
        transform: { position: [0, 0.25, 0] },
        rotation: { start: [-Math.PI, Math.PI] },
      });
      fx.particles({
        capacity: 30,
        delay: 0.12,
        startLife: [0.55, 1.1],
        startSpeed: [2.5, 5.5],
        direction: [0, 1, 0],
        spread: 0.9,
        startSize: [0.012, 0.04],
        sizeOverLife: curve([0, 1], [0.65, 0.6], [1, 0]),
        gravity: -4,
        dampen: 0.45,
        map: vfxTexture('point-solid-2'),
        blend: 'alpha',
        mode: 'stretched',
        stretch: { speedFactor: 0.4, lengthFactor: 3 },
        emission: 3,
        tint: [1, 0.34, 0.04, 0.9],
        orderInLayer: 30,
        transform: { position: [0, 0.5, 0] },
      });
    },
  });
}
/** Returns one synchronized atlas playback; seconds >= 0.2 keeps the authored fades ordered. */
// Copy this file and prepare createPairedFlipbook(uniqueId, size, seconds, centerHeight). Defaults preserve the original five-unit card, 3.2-second playback and one-unit lift above the supplied origin.
// To place the card center at a confirmed impact, pass centerHeight=0 and play unparented at that position. The billboard faces the camera; its size is not an explosion damage radius.
// Color, normal and motion atlases share one particle clock; keep their 8x8 layout and non-looping playback together when replacing assets. Game code owns damage and audio.
// Await handle.finished, or stop({ immediate: true }) on cancellation. This example does not repeat automatically.
export function createPairedFlipbook(
  id: string,
  size = 5,
  seconds = 3.2,
  centerHeight = 1,
): VfxDefinition {
  if (
    !Number.isFinite(size) ||
    size <= 0 ||
    !Number.isFinite(seconds) ||
    seconds < 0.2 ||
    !Number.isFinite(centerHeight)
  )
    throw new Error(
      'Flipbook size must be positive, duration at least 0.2 seconds, and center height finite.',
    );
  return defineVfx({
    id,
    duration: seconds,
    seed: 7,
    maxInstances: 4,
    build(fx) {
      fx.particles({
        startLife: seconds,
        startSize: size,
        simulationSpace: 'local',
        opacityOverLife: [
          { t: 0, v: 0 },
          { t: 0.04 / seconds, v: 1 },
          { t: 1 - 0.15 / seconds, v: 1 },
          { t: 1, v: 0 },
        ],
        map: vfxTexture('ember-explosion-set-1-1'),
        flipbook: { columns: 8, rows: 8, mix: true, loop: false },
        soft: 1,
        normal: {
          texture: vfxTexture('ember-explosion-set-1-3'),
          strength: 1,
        },
        motion: {
          texture: vfxTexture('ember-explosion-set-1-2'),
          pixels: 8,
        },
        blend: 'alpha',
        emission: 0.35,
        orderInLayer: 10,
        transform: { position: [0, centerHeight, 0] },
        rotation: { enabled: false },
      });
    },
  });
}
export default createFireExplosion('example.explosion');
