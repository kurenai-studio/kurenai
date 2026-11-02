// intent: Readable expanding pressure fronts with optional refraction-only presentation.
// variants: createShockwave
// inputs: Confirmed world centre and visual radius; grounded=true uses an upright local +Y ground frame. Gameplay owns forces and hit timing.
// Copy dependencies: ./shared/special-pack.ts.
// Setup in an async scene: const effect = createShockwave('example.shockwave');
// const vfx = useVfx(context); await vfx.prepare(effect, {});
// const handle = vfx.play(effect, playOptions);
// Import useVfx from wanaka-studio-engine/vfx; construct playOptions from the recipe notes and real game inputs.
import { dFdx, dFdy, mix, screenUV, vec2, vec3, viewportSize } from 'three/tsl';
import type { Node } from 'three/webgpu';
import {
  defineVfx,
  sampleVfxRefraction,
  vfxTexture,
  type VfxDefinition,
  type VfxParticleContext,
} from 'wanaka-studio-engine/vfx';
import { sampleVfxAtlas as sampleAtlas } from 'wanaka-studio-engine/vfx';
import { specialTexture } from './shared/special-pack.js';

const SPECIAL_NORMAL = [
  vfxTexture('special-normal-1'),
  vfxTexture('special-normal-2'),
  vfxTexture('special-normal-3'),
  vfxTexture('special-normal-4'),
  vfxTexture('special-normal-5'),
  vfxTexture('special-normal-6'),
  vfxTexture('special-normal-7'),
  vfxTexture('special-normal-8'),
  vfxTexture('special-normal-9'),
  vfxTexture('special-normal-10'),
  vfxTexture('special-normal-11'),
  vfxTexture('special-normal-12'),
  vfxTexture('special-normal-13'),
  vfxTexture('special-normal-14'),
  vfxTexture('special-normal-15'),
  vfxTexture('special-normal-16'),
  vfxTexture('special-normal-17'),
  vfxTexture('special-normal-18'),
  vfxTexture('special-normal-19'),
  vfxTexture('special-normal-20'),
  vfxTexture('special-normal-21'),
] as const;
const SPECIAL_SHOCKWAVE = [
  vfxTexture('special-shockwave-1'),
  vfxTexture('special-shockwave-2'),
  vfxTexture('special-shockwave-3'),
  vfxTexture('special-shockwave-4'),
  vfxTexture('special-shockwave-5'),
  vfxTexture('special-shockwave-6'),
  vfxTexture('special-shockwave-7'),
  vfxTexture('special-shockwave-fractured-8'),
  vfxTexture('special-shockwave-9'),
  vfxTexture('special-shockwave-contact-10'),
  vfxTexture('special-shockwave-11'),
  vfxTexture('special-shockwave-12'),
  vfxTexture('special-shockwave-13'),
  vfxTexture('special-shockwave-14'),
  vfxTexture('special-shockwave-15'),
] as const;

/** Prepare once, then play unparented at the confirmed centre. Radius is a visual extent,
 * not a damage query. Grounded mode assumes a flat receiving plane and local +Y up.
 * Texture choices are source suffixes; the atlas owns the wave silhouette and animation.
 * The wave height profile drives compression and rarefaction; optional normals
 * add bounded surface detail without replacing that pressure field.
 * Refraction uses the project Rendering pipeline. refractionOnly omits the visible wave.
 * Live intensity controls the visible front; strengthPixels controls distortion in render pixels.
 * Immediate stop clears both layers; await handle.finished for completion.
 */
export function createShockwave(
  id: string,
  seconds = 0.8,
  options: {
    grounded?: boolean;
    refractionOnly?: boolean;
    textureVariant?: number;
    normalVariant?: number;
  } = {},
): VfxDefinition {
  if (!Number.isFinite(seconds) || seconds < 0.15 || seconds > 2)
    throw new Error('Shockwave duration must be between 0.15 and 2 seconds.');
  const atlas = specialTexture(SPECIAL_SHOCKWAVE, options.textureVariant ?? 15);
  const normal = specialTexture(SPECIAL_NORMAL, options.normalVariant);
  if (!atlas) throw new Error('Select a shockwave atlas before preparation.');
  return defineVfx({
    id,
    duration: seconds,
    maxInstances: 4,
    params: {
      radius: { default: 2.5, min: 0.25, max: 12 },
      strengthPixels: { default: 40, min: 0, max: 96 },
      normalStrength: { default: 0.25, min: 0, max: 0.4 },
      intensity: { default: 1, min: 0, max: 2 },
    },
    build(fx) {
      const radius = fx.param('radius') as Node<'float'>;
      const strength = fx.param('strengthPixels') as Node<'float'>;
      const intensity = fx.param('intensity') as Node<'float'>;
      const normalStrength = fx.param('normalStrength') as Node<'float'>;
      type WaveField = {
        density: Node<'float'>;
        detail: Node<'float'>;
        fade: Node<'float'>;
        offset: Node<'vec2'>;
      };
      const caches = [
        new WeakMap<VfxParticleContext, WaveField>(),
        new WeakMap<VfxParticleContext, WaveField>(),
      ] as const;
      const field = (ctx: VfxParticleContext, refracting = false): WaveField => {
        const cache = caches[refracting ? 1 : 0];
        const cached = cache.get(ctx);
        if (cached) return cached;
        const p = ctx.progress.clamp(0, 1);
        // The larger refraction quad provides space for a pressure fringe. Map
        // both layers into the SAME world footprint before sampling the atlas.
        const waveUv = refracting ? ctx.uv.sub(0.5).mul(1.18).add(0.5) : ctx.uv;
        const readHeight = (localUv: Node<'vec2'>): Node<'float'> => {
          const texel = sampleAtlas(ctx, { ...atlas, phase: p, localUv });
          const coverage = atlas.coverage === 'alpha' ? texel.a : texel.r.mul(texel.a);
          const edge = localUv.min(localUv.oneMinus());
          return coverage.clamp(0, 1).mul(edge.x.min(edge.y).smoothstep(0, 0.015));
        };
        const height = readHeight(waveUv);
        const fade = p.smoothstep(0, 0.025).mul(p.smoothstep(0.82, 1).oneMinus());
        let density = height.pow(0.75);
        const detail = vec2(dFdx(density), dFdy(density)).length().mul(28).clamp(0, 1);
        let offset: Node<'vec2'> = vec2(0);
        if (refracting) {
          const local = waveUv.sub(0.5);
          const radial = local.div(local.length().max(0.00001));
          const step = radius.reciprocal().mul(0.07).clamp(0.008, 0.08);
          const inside = readHeight(waveUv.sub(radial.mul(step)));
          const outside = readHeight(waveUv.add(radial.mul(step)));
          // The ANIMATED atlas supplies every pressure contour. The direction is
          // outward from the impact; no procedural circle supplies its shape.
          // Opposite height slopes make the leading compression and trailing pull.
          const pressure = height
            .sqrt()
            .mul(0.55)
            .add(inside.sub(outside).mul(1.8))
            .clamp(-1, 1)
            .mul(local.length().smoothstep(0, 0.01));
          density = height.max(inside.max(outside).mul(0.72)).pow(0.75);
          const dx = dFdx(waveUv);
          const dy = dFdy(waveUv);
          const ySign = dFdy(screenUV.y).sign();
          const projectedRadial = vec2(radial.dot(dx), radial.dot(dy).mul(ySign));
          const waveDirection = projectedRadial.div(projectedRadial.length().max(0.00001));
          let displacement = waveDirection.mul(pressure);
          if (normal) {
            const texel = ctx.sampleTexture?.('normal', waveUv.clamp(0, 1)) as
              | Node<'vec4'>
              | undefined;
            if (!texel) throw new Error('Shockwave normal texture is not bound.');
            const normalXY = texel.xy.mul(2).sub(1).mul(texel.a);
            const projected = vec2(
              normalXY.dot(dx.div(dx.length().max(0.00001))),
              normalXY.dot(dy.div(dy.length().max(0.00001))).mul(ySign),
            );
            // Detail is capped at 40% of the atlas-driven pressure. It cannot
            // create a separate field, reverse the pulse, or remove the wave.
            const bounded = projected.div(projected.length().max(1));
            displacement = displacement.add(bounded.mul(normalStrength).mul(pressure.abs()));
          }
          offset = displacement.mul(p.oneMinus().pow(0.35)).mul(strength).div(viewportSize);
        }
        const value = { density, detail, fade, offset };
        cache.set(ctx, value);
        return value;
      };
      const shared = {
        startLife: seconds,
        startSize: 2,
        startSpeed: 0,
        mode: options.grounded ? ('horizontal' as const) : ('billboard' as const),
        transform: { position: [0, options.grounded ? 0.03 : 0, 0] as const },
        map: vfxTexture('solid'),
        blend: 'alpha' as const,
        rotation: { enabled: false },
      };
      const textures = {
        atlas: { texture: atlas.texture, colorSpace: 'linear' as const },
        ...(normal ? { normal: { texture: normal.texture, colorSpace: 'linear' as const } } : {}),
      };
      const distortion = fx.particles({
        ...shared,
        orderInLayer: 35,
        look: {
          textures,
          colorNode: () => vec3(0),
          opacityNode: (ctx) => {
            const f = field(ctx, true);
            return f.density.sqrt().mul(f.fade).mul(0.95).clamp(0, 0.95);
          },
          backdropNode: (ctx) => sampleVfxRefraction(field(ctx, true).offset),
        },
      });
      distortion.material.sizeNode = radius.mul(1.18);
      if (!options.refractionOnly) {
        const visible = fx.particles({
          ...shared,
          orderInLayer: 36,
          look: {
            textures,
            colorNode: (ctx) => {
              const density = field(ctx).density;
              // Condensation has low scene-linear reflectance. Shade its authored
              // contours instead of lifting a whole white sheet into scene bloom.
              const relief = dFdx(density).mul(-16).add(dFdy(density).mul(24)).clamp(-1, 1);
              return mix(vec3(0.035, 0.048, 0.055), vec3(0.12, 0.145, 0.16), density.sqrt())
                .add(relief.mul(0.025))
                .clamp(0.015, 0.17);
            },
            opacityNode: (ctx) => {
              const f = field(ctx);
              return f.density
                .mul(f.detail.mul(0.85).add(0.15))
                .mul(f.fade)
                .mul(intensity)
                .mul(0.45)
                .clamp(0, 0.6);
            },
          },
        });
        visible.material.sizeNode = radius;
      }
    },
  });
}
export default createShockwave('example.shockwave');
