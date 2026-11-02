// intent: Bullet holes, scorch, scratch, wet patches, footprints and blood stains.
// variants: createSurfaceMark(id, kind, options); createBloodStain(id) and bloodStainPlacement(point, normal)
// inputs: actual receiver; local +Z outward; depth projection or explicit planar fallback; blood is planar
// Copy dependencies: ./shared/special-pack.ts.
// Event binding: playOptions: receiver contact pose with local +Z outward. Select depth projection or planar receiver mode in the recipe; keep marks tied to actual contacts and a game-owned lifetime budget.
// Setup in an async scene: const effect = createSurfaceMark('game.mark', 'bullet-hole');
// const vfx = useVfx(context); await vfx.prepare(effect, {});
// const handle = vfx.play(effect, playOptions);
// Import useVfx (and createVfxPointSource when needed) from wanaka-studio-engine/vfx. Prepare once; construct playOptions from the game inputs above per event.
// Update the selected recipe's declared params from gameplay; await handle.finished for complete drain.
// Immediate cancellation: handle.stop({ immediate: true }). Persistent holds end on the game's state/event.
// Blood integration: vfx.play(stain, bloodStainPlacement(worldPoint, worldNormal, twistRadians)).
// Convert receiver face normals to world space first. The helper offsets the quad 4 mm
// outward; twist varies around that normal. This is a planar mark: keep it within the
// receiving face; it does not wrap curved geometry. Bound active stain handles against
// prepared capacity (default 16), stop old marks, and manage their lifetime independently
// of the transient blood impact. Other mark kinds use their selected receiver mode.
import { float, mix, vec2, vec3 } from 'three/tsl';
import { Quaternion, Vector3, type Node } from 'three/webgpu';
import {
  curve,
  defineVfx,
  sampleVfxRefraction,
  vfxTexture,
  type Vec3,
  type VfxDefinition,
  type VfxParticleContext,
  type VfxPlayOptions,
} from 'wanaka-studio-engine/vfx';
import { specialTexture } from './shared/special-pack.js';

const SPECIAL_CRACK = [
  vfxTexture('special-mask-crack-1'),
  vfxTexture('special-mask-crack-2'),
  vfxTexture('special-mask-crack-3'),
  vfxTexture('special-mask-crack-4'),
] as const;

/** Stamps differ in coverage, edge treatment and material response. */
export type SurfaceMark = 'bullet-hole' | 'scorch' | 'scratch' | 'wet' | 'footprint';
/** Dimensions are metres; surfaceColor estimates dry-mark albedo. Wet marks sample the receiver's rendered color. */
export interface SurfaceMarkOptions {
  /** Purchased crack pattern 1–4 on a bullet-hole mark. */
  textureVariant?: number;
  dimensions?: readonly [number, number];
  seconds?: number;
  /** Depth projects onto visible opaque receivers; planar is an explicit flat-surface fallback. */
  projection?: 'depth' | 'planar';
  /** Full projection-box thickness in metres; keep it short near thin walls. */
  projectionDepth?: number;
  surfaceColor?: Vec3;
}
/** Finite receiver-local stamp; never schedules an impact or invents a surface contact. */
// Copy this file. Prepare once per material/size. Play unparented at the actual intersection plus 3 mm along its normalized outward normal; rotate local +Z to that normal. Local +Y is footprint forward or scratch length. Game code owns the raycast, surface selection and foot-contact events.
// For a rigid moving receiver, use an unscaled receiver-local parent anchor. Depth projection follows visible depth but is not skin-bound: a moving/deforming character can leave the projector unless game code maintains its contact frame. Local +Z remains the outward contact normal in both modes.
// Depth projection is the default: it clips to visible opaque scene depth in a shallow box and rejects oppositely facing receiver surfaces while fading steep normals. It can affect any visible surface inside that box; transparent receivers and per-object receiver masks are not supported. Facing rejection prevents the usual opposite side of a thin wall, but nearby surfaces with matching normals can still receive the mark. Keep the projector shallow near other objects. Set projection to planar only for a contained flat receiver. Neither mode cuts geometry or alters shared materials. Stop old handles to bound accumulation; defaults reserve at most 24 live marks.
// Wet marks use the shared scene-color refraction buffer at zero offset, preserving receiver detail with a darker water film; they need the normal game render pipeline and share its scene-color capture. They are not puddle meshes or planar reflections.
// Texture variants: copy shared/special-pack.ts with this file. Select a source-file number before prepare; omission preserves the original composition.
export function createSurfaceMark(
  id: string,
  kind: SurfaceMark,
  options: SurfaceMarkOptions = {},
): VfxDefinition {
  if (!['bullet-hole', 'scorch', 'scratch', 'wet', 'footprint'].includes(kind))
    throw new Error('Unknown surface mark.');
  if (options.textureVariant !== undefined && kind !== 'bullet-hole')
    throw new Error('Crack texture variants require a bullet-hole surface mark.');
  const detail = specialTexture(SPECIAL_CRACK, options.textureVariant);
  const size: readonly [number, number] =
    options.dimensions ??
    (kind === 'footprint'
      ? [0.18, 0.32]
      : kind === 'scratch'
        ? [0.09, 0.4]
        : kind === 'bullet-hole'
          ? [0.13, 0.13]
          : [0.65, 0.65]);
  const seconds = options.seconds ?? 8;
  const projected = (options.projection ?? 'depth') === 'depth';
  if (options.projection !== undefined && !['depth', 'planar'].includes(options.projection))
    throw new Error('Surface mark projection must be depth or planar.');
  const extent = Math.max(...size);
  const projectionDepth = options.projectionDepth ?? Math.max(0.04, extent * 0.5);
  if (!Number.isFinite(projectionDepth) || projectionDepth < 0.005 || projectionDepth > 3)
    throw new Error('Surface mark projection depth must be 0.005–3 metres.');
  const color: Vec3 = options.surfaceColor ?? [0.35, 0.3, 0.24];
  if (
    !size.every((v) => Number.isFinite(v) && v >= 0.01 && v <= 3) ||
    !Number.isFinite(seconds) ||
    seconds < 0.2 ||
    seconds > 30 ||
    !color.every((v) => Number.isFinite(v) && v >= 0 && v <= 1)
  )
    throw new Error(
      'Surface mark dimensions must be 0.01–3 metres, lifetime 0.2–30 seconds and color channels 0–1.',
    );
  return defineVfx({
    id,
    duration: seconds,
    maxInstances: 24,
    seed: 31,
    build(fx) {
      const cache = new WeakMap<
        VfxParticleContext,
        {
          coverage: Node<'float'>;
          pit: Node<'float'>;
          lip: Node<'float'>;
          grain: Node<'float'>;
        }
      >();
      const field = (
        ctx: VfxParticleContext,
      ): {
        coverage: Node<'float'>;
        pit: Node<'float'>;
        lip: Node<'float'>;
        grain: Node<'float'>;
      } => {
        const old = cache.get(ctx);
        if (old) return old;
        const markUv = projected
          ? vec2(ctx.uv.x, ctx.uv.y.oneMinus())
              .sub(0.5)
              .mul(vec2(extent / size[0], extent / size[1]))
              .add(0.5)
          : ctx.uv;
        const q = markUv.sub(0.5).mul(2),
          sample = ctx.sampleTexture?.('grain', markUv.mul(1.7).fract()) as
            | Node<'vec4'>
            | undefined;
        if (!sample) throw new Error('Surface mark grain texture is missing.');
        const grain = sample.r,
          d = q.length().add(grain.sub(0.5).mul(kind === 'wet' ? 0.22 : 0.15));
        let coverage: Node<'float'>,
          pit = d.smoothstep(0.15, 0.24).oneMinus(),
          lip: Node<'float'> = float(0);
        if (kind === 'bullet-hole') {
          const crack = (ctx.sampleTexture?.('detail', markUv) as Node<'vec4'>).r
            .smoothstep(0.025, 0.35)
            .mul(d.smoothstep(0.25, 0.4));
          lip = d.sub(0.42).abs().smoothstep(0.025, 0.12).oneMinus().mul(grain.mul(0.45).add(0.55));
          coverage = d
            .smoothstep(0.38, 0.58)
            .oneMinus()
            .mul(0.8)
            .add(crack.mul(0.5))
            .max(pit)
            .clamp(0, 1);
        } else if (kind === 'scratch') {
          const x = q.x.add(q.y.mul(9).sin().mul(0.025)).add(grain.sub(0.5).mul(0.06)),
            taper = q.y.abs().smoothstep(0.55, 0.98).oneMinus();
          pit = x.abs().smoothstep(0.022, 0.065).oneMinus().mul(taper);
          lip = x
            .sub(0.075)
            .abs()
            .smoothstep(0.012, 0.04)
            .oneMinus()
            .mul(taper)
            .mul(grain.mul(0.35).add(0.65));
          const fine = x
            .add(0.19)
            .abs()
            .smoothstep(0.008, 0.03)
            .oneMinus()
            .mul(q.y.add(0.12).abs().smoothstep(0.4, 0.75).oneMinus())
            .mul(grain.smoothstep(0.25, 0.65));
          const abrasion = x.abs().smoothstep(0.12, 0.3).oneMinus().mul(taper).mul(0.12);
          coverage = pit.max(lip.mul(0.8)).max(fine.mul(0.55)).max(abrasion);
        } else if (kind === 'footprint') {
          const toe = vec2(q.x.div(0.9), q.y.sub(0.35).div(0.6))
            .length()
            .smoothstep(0.9, 1)
            .oneMinus();
          const heel = vec2(q.x.div(0.65), q.y.add(0.62).div(0.32))
            .length()
            .smoothstep(0.85, 1)
            .oneMinus();
          const sole = toe.max(heel);
          const tread = q.y
            .mul(9)
            .add(q.x.abs().mul(2.2))
            .fract()
            .smoothstep(0.12, 0.25)
            .mul(q.y.mul(9).add(q.x.abs().mul(2.2)).fract().smoothstep(0.65, 0.82).oneMinus());
          const wear = grain.smoothstep(0.18, 0.65);
          coverage = sole.mul(tread.mul(0.75).add(0.12)).mul(wear);
        } else if (kind === 'wet') {
          const puddle = (ctx.sampleTexture?.('detail', markUv) as Node<'vec4'>).r;
          coverage = puddle.smoothstep(0.18, 0.7).mul(0.82);
        } else coverage = d.smoothstep(0.25, 0.95).oneMinus().mul(grain.mul(0.5).add(0.5));
        coverage = coverage
          .mul(q.x.abs().smoothstep(0.98, 1).oneMinus())
          .mul(q.y.abs().smoothstep(0.98, 1).oneMinus());
        const value = { coverage, pit, lip, grain };
        cache.set(ctx, value);
        return value;
      };
      fx.particles({
        startLife: seconds,
        startSize: projected ? extent : 1,
        ...(projected
          ? {
              mode: 'decal' as const,
              decal: {
                angleFade: 0.35,
                backface: 'clip' as const,
                depth: projectionDepth,
                roughness: kind === 'wet' ? 0.12 : 0.95,
              },
              transform: { rotation: [Math.SQRT1_2, 0, 0, Math.SQRT1_2] as const },
            }
          : {}),
        map: vfxTexture('solid'),
        rotation: { enabled: false },
        blend: 'alpha',
        ...(projected
          ? {}
          : {
              mesh: {
                geometry: {
                  positions: [
                    -size[0] / 2,
                    -size[1] / 2,
                    0,
                    size[0] / 2,
                    -size[1] / 2,
                    0,
                    size[0] / 2,
                    size[1] / 2,
                    0,
                    -size[0] / 2,
                    size[1] / 2,
                    0,
                  ],
                  uvs: [0, 0, 1, 0, 1, 1, 0, 1],
                  indices: [0, 1, 2, 0, 2, 3],
                },
                side: 'front',
                polygonOffset: { factor: -1, units: -1 },
              },
            }),
        tint: [1, 1, 1, 1],
        lit: kind === 'wet',
        roughness: kind === 'wet' ? 0.12 : 0.95,
        metalness: 0,
        emission: 0,
        opacityOverLife: curve([0, 1], [0.8, 1], [1, 0]),
        look: {
          textures: {
            grain: {
              texture: vfxTexture('noise-soft-alias-1'),
              colorSpace: 'linear',
              wrap: 'repeat',
            },
            detail: {
              texture:
                kind === 'wet'
                  ? vfxTexture('mask-oil-footprint-2')
                  : (detail?.texture ?? vfxTexture('crack-thin-network-4')),
              colorSpace: 'linear',
            },
          },
          ...(kind === 'wet'
            ? {
                // Preserve receiver detail instead of painting an estimated albedo over it.
                backdropNode: () =>
                  sampleVfxRefraction(vec2(0), {
                    tint: [0.62, 0.64, 0.66],
                    chromaticAberration: 0,
                  }),
              }
            : {
                colorNode: (ctx: VfxParticleContext) => {
                  const { pit, lip, grain } = field(ctx);
                  if (kind === 'scratch' || kind === 'bullet-hole')
                    return mix(
                      mix(
                        vec3(...color).mul(grain.mul(0.4).add(0.45)),
                        vec3(...color)
                          .mul(kind === 'bullet-hole' ? 0.9 : 1.15)
                          .add(vec3(kind === 'bullet-hole' ? 0.025 : 0.16)),
                        lip.mul(0.8),
                      ),
                      vec3(0.008, 0.006, 0.004),
                      pit,
                    );
                  return vec3(...color).mul(kind === 'scorch' ? 0.12 : 0.35);
                },
              }),
          opacityNode: (ctx) => field(ctx).coverage,
        },
      });
    },
  });
}

/** A real surface intersection, in world metres; use an unparented play. */
export function bloodStainPlacement(point: Vec3, normal: Vec3, twist = 0): VfxPlayOptions {
  const n = new Vector3(...normal);
  if (![...point, ...normal, twist].every(Number.isFinite) || n.lengthSq() < 1e-12)
    throw new Error('Blood stain needs a finite surface point, finite twist and a nonzero normal.');
  n.normalize();
  const rotation = new Quaternion()
    .setFromUnitVectors(new Vector3(0, 0, 1), n)
    .multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), twist));
  return {
    position: new Vector3(...point).addScaledVector(n, 0.004).toArray(),
    rotation: rotation.toArray(),
  };
}
const STAIN = {
  positions: [-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0],
  uvs: [0, 0, 1, 0, 1, 1, 0, 1],
  indices: [0, 1, 2, 0, 2, 3],
};
/** Spawn independently at actual surface contacts; stop or replace old stains to bound accumulation. */
export function createBloodStain(id: string): VfxDefinition {
  return defineVfx({
    id,
    duration: 6,
    maxInstances: 16,
    seed: 62,
    build(fx) {
      fx.particles({
        startLife: 6,
        rotation: { enabled: false },
        startSize: [0.55, 0.85],
        sizeOverLife: curve([0, 0.8], [0.04, 1], [1, 1.04]),
        opacityOverLife: curve([0, 0.8], [0.8, 0.8], [1, 0]),
        mesh: { geometry: STAIN, side: 'front', polygonOffset: { factor: -1, units: -1 } },
        map: vfxTexture('blood-stain-5'),
        blend: 'alpha',
        tint: [0.3, 0.15, 0.15, 1],
        emission: 1,
        orderInLayer: 5,
      });
    },
  });
}

export default createSurfaceMark('example.surface-mark', 'bullet-hole');
