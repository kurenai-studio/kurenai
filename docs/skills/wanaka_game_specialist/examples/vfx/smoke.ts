// intent: Animated smoke plume from a world outlet.
// variants: createLargeSmoke
// inputs: Real outlet pose and active interval; texture variants preserve the plume composition.
// Copy dependencies: ./shared/special-pack.ts.
// Setup in an async scene: const effect = createLargeSmoke('example.smoke');
// const vfx = useVfx(context); await vfx.prepare(effect, {});
// const handle = vfx.play(effect, playOptions);
// Import useVfx from wanaka-studio-engine/vfx; construct playOptions from the recipe notes and real game inputs.
import { mix, vec2, vec3 } from 'three/tsl';
import { type Node } from 'three/webgpu';
import {
  curve,
  defineVfx,
  vfxTexture,
  type VfxDefinition,
  type VfxLayerLook,
  type VfxParticleContext,
  RANDOM_YAW,
} from 'wanaka-studio-engine/vfx';
import { specialTexture } from './shared/special-pack.js';

const SPECIAL_SMOKE_MASK = [
  vfxTexture('special-mask-smoke-1'),
  vfxTexture('special-mask-smoke-2'),
  vfxTexture('special-mask-smoke-3'),
  vfxTexture('special-mask-smoke-4'),
  vfxTexture('special-mask-smoke-5'),
  vfxTexture('special-mask-smoke-6'),
] as const;
const SOFT_DISTANCE = 0.18;
const SMOKE_TEMPORAL = {
  motion: 'particle' as const,
  response: 'responsive' as const,
  alphaThreshold: 0.12,
};
const GROWTH = curve([0, 0.45], [0.18, 0.75], [0.65, 1.25], [1, 1.65]);
const FADE = curve([0, 0], [0.04, 0.8], [0.18, 1], [0.65, 0.75], [1, 0]);
function smokeLook(
  texture: { readonly assetId: string },
  alpha: boolean,
  softSource: boolean,
  gain: number,
  detailedSource: boolean,
): VfxLayerLook {
  const fields = new WeakMap<
    VfxParticleContext,
    { density: Node<'float'>; light: Node<'float'> }
  >();
  const field = (ctx: VfxParticleContext) => {
    const cached = fields.get(ctx);
    if (cached) return cached;
    const sample = ctx.sampleTexture;
    if (!sample) throw new Error('Smoke density textures are not bound.');
    // Display indices change during alpha sorting; lifetime stays with the particle.
    const seed = ctx.lifetime.mul(17.31).fract();
    const clock = ctx.age.mul(0.55).add(seed.mul(Math.PI * 2));
    const at = ctx.uv
      .mul(0.62)
      .add(0.18)
      .add(vec2(clock.sin(), clock.mul(0.73).cos()).mul(0.075));
    const broad = (sample('billow', at) as Node<'vec4'>).r;
    const detail = (sample('billow', at.mul(0.8).add(vec2(0.13, 0.07))) as Node<'vec4'>).r;
    const edge = ctx.uv.mul(Math.PI).sin();
    const warp = vec2(broad.sub(0.4), detail.sub(0.4)).mul(0.095).mul(edge.x.mul(edge.y));
    const densityUv = ctx.uv.add(warp).clamp(0.001, 0.999);
    const texel = sample('density', densityUv) as Node<'vec4'>;
    let coverage = (alpha ? texel.a : texel.r).max(0);
    if (detailedSource) {
      // Smoke05 stores internal density in RGB; alpha alone produces solid cutouts.
      const densityAt = (offset: Node<'vec2'>) => {
        const tap = sample('density', densityUv.add(offset).clamp(0.001, 0.999)) as Node<'vec4'>;
        return tap.a.mul(tap.r);
      };
      coverage = texel.a
        .mul(texel.r)
        .mul(0.4)
        .add(densityAt(vec2(0.012, 0)).mul(0.15))
        .add(densityAt(vec2(-0.012, 0)).mul(0.15))
        .add(densityAt(vec2(0, 0.012)).mul(0.15))
        .add(densityAt(vec2(0, -0.012)).mul(0.15));
    }
    // Alpha remains soft coverage. Independent billow detail breaks up smooth sources
    // without turning a coverage contour into a bright lighting contour.
    const modulation = broad.mul(softSource ? 1.35 : 0.55).add(softSource ? 0.35 : 0.7);
    const density = coverage.mul(modulation).mul(gain);
    const light = broad.mul(0.28).add(detail.mul(0.12)).add(ctx.uv.y.mul(0.15)).add(0.62);
    const value = { density, light };
    fields.set(ctx, value);
    return value;
  };
  return {
    textures: {
      density: { texture, colorSpace: 'linear' },
      billow: { texture: vfxTexture('noise-cloud-contrasty-1'), colorSpace: 'linear' },
    },
    colorNode(ctx) {
      const { light } = field(ctx);
      return mix(vec3(0.035, 0.045, 0.055), vec3(0.085, 0.1, 0.115), light.clamp(0, 1));
    },
    // Beer-Lambert-style transmittance keeps low-density fringes gradual.
    opacityNode: (ctx) => field(ctx).density.mul(-1).exp().oneMinus(),
  };
}
/** Continuous cosmetic outlet smoke; no fire or gameplay concealment is implied. */
// Copy and prepare createLargeSmoke(uniqueId). Play at the actual outlet, or use createVfxPointSource on an unscaled emitter root; +Y supplies initial rise; keep the effect upright. New particles follow the outlet; old particles remain in world space.
// Game owns fire, damage, visibility and emission timing. Normal stop ends emission and drains lives up to 5.2 seconds; retain the source until finished. Immediate stop cancels. params.intensity fades all smoke. No hidden height, light or floor collision is authored.
// Texture variants: copy shared/special-pack.ts with this file. Select a source-file number before prepare; omission preserves the original composition.
export function createLargeSmoke(id: string, textureVariant?: number): VfxDefinition {
  const billow = specialTexture(SPECIAL_SMOKE_MASK, textureVariant);
  return defineVfx({
    id,
    duration: 6,
    seed: 7,
    loop: true,
    maxInstances: 4,
    params: { intensity: { default: 1, min: 0, max: 1 } },
    build(fx) {
      const intensity = fx.param('intensity') as Node<'float'>;
      const visibility = { opacityMultiplierNode: () => intensity };
      fx.particles({
        capacity: textureVariant === 5 ? 60 : 40,
        rateOverTime: textureVariant === 5 ? 10 : 7,
        simulationSpace: 'world',
        startLife: [4, 5.2],
        startSpeed: [0.75, 1.1],
        direction: [0.08, 1, 0],
        spread: 0.15,
        shape: { type: 'box', size: [0.4, 0.1, 0.4] },
        noise: { strength: 0.28, frequency: 0.55 },
        startSize: textureVariant === 5 ? [1.4, 2] : [1.15, 1.8],
        sizeOverLife: GROWTH,
        opacityOverLife: FADE,
        map: billow?.texture ?? vfxTexture('smoke-textured-puff-7'),
        look: {
          ...smokeLook(
            billow?.texture ?? vfxTexture('smoke-textured-puff-7'),
            billow?.coverage === 'alpha',
            textureVariant === 3 || textureVariant === 4,
            billow === undefined
              ? 1.6
              : textureVariant === 6
                ? 1.8
                : textureVariant === 5
                  ? 1.5
                  : 0.95,
            textureVariant === 5,
          ),
          ...visibility,
        },
        colorSource: 'tint',
        blend: 'alpha',
        soft: SOFT_DISTANCE,
        emission: 1,
        temporal: SMOKE_TEMPORAL,
        tint: [1, 1, 1, 0.62],
        rotation: { start: RANDOM_YAW },
      });
      fx.particles({
        capacity: 20,
        rateOverTime: 4,
        simulationSpace: 'world',
        look: visibility,
        startLife: [1.8, 2.6],
        startSpeed: [0.65, 0.95],
        direction: [-0.12, 1, 0.08],
        spread: 0.2,
        shape: { type: 'box', size: [1.1, 0.2, 1.1] },
        noise: { strength: 0.38, frequency: 0.45 },
        startSize: [0.65, 1.1],
        sizeOverLife: GROWTH,
        opacityOverLife: FADE,
        map: vfxTexture('smoke-irregular-wisp-7'),
        colorSource: 'tint',
        blend: 'alpha',
        soft: SOFT_DISTANCE,
        lit: true,
        emission: 0.18,
        temporal: SMOKE_TEMPORAL,
        tint: [0.32, 0.37, 0.44, 0.32],
        rotation: { start: RANDOM_YAW },
      });
    },
  });
}
export default createLargeSmoke('example.smoke');
