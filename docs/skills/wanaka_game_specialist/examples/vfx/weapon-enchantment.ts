// intent: Fire, poison, frost and electric weapon surface enchantments.
// variants: createWeaponEnchantment(id, element, axis, fireTexture)
// inputs: selected blade/head mesh as host; metric detail size; actual weapon animation
// Copy dependencies: none.
// Fire: pass vfxTexture('fire-vol5-flame-N') as the fourth argument for N=1–30 before prepare.
// Event binding: Use only the selected blade/head mesh as host for prepare/play, with its actual animation and local axis. Stop on enchantment removal or weapon destruction.
// Setup in an async scene: const effect = createWeaponEnchantment('game.enchantment', 'fire');
// const vfx = useVfx(context); await vfx.prepare(effect, { host });
// const handle = vfx.play(effect, { host });
// Import useVfx (and createVfxPointSource when needed) from wanaka-studio-engine/vfx. Prepare once; construct playOptions from the game inputs above per event.
// Update the selected recipe's declared params from gameplay; await handle.finished for complete drain.
// Immediate cancellation: handle.stop({ immediate: true }). Persistent holds end on the game's state/event.
import { float, mix, vec2, vec3 } from 'three/tsl';
import { type Node } from 'three/webgpu';
import {
  curve,
  defineVfx,
  sampleVfxRefraction,
  sampleVfxAtlas,
  vfxTexture,
  viewFresnel,
  type Vec3,
  type VfxDefinition,
  type VfxLayerLook,
  type VfxParticleContext,
} from 'wanaka-studio-engine/vfx';
import { createVfxAtlasLook as atlasLook, getVfxTextureSampling } from 'wanaka-studio-engine/vfx';

const FIRE_FPS = 60;

export type WeaponEnchantment = 'fire' | 'poison' | 'frost' | 'electric';
type CoatingField = {
  noise: Node<'float'>;
  mask: Node<'float'>;
  heat: Node<'vec3'>;
};
const COLORS: Record<WeaponEnchantment, Vec3> = {
  fire: [2.5, 0.4, 0.025],
  poison: [0.12, 0.9, 0.025],
  frost: [0.18, 0.7, 1.1],
  electric: [0.28, 0.5, 2.5],
};
// Copy this file together. Call await vfx.prepare(effect, { host: weaponMesh }) during activation, then play with that host: the actual blade/head mesh or selected weapon group, not the whole actor. No height fitting or visibility takeover is applied. Axis selects the length direction in the host bounds, before preparation.
// Supply strength (0..1), ramp it down before stopping for a soft release, or stop immediately on cancellation/despawn. Keep the host alive until finished. Game code owns buff duration, element, damage and animation; this coating neither records a trail nor schedules impacts. Fire stays attached to the blade with world-upright quads; embers escape into world space. Poison beads, frost and electric motes remain attached to the weapon.
export function createWeaponEnchantment(
  id: string,
  element: WeaponEnchantment,
  axis: 'x' | 'y' | 'z' = 'y',
  fireTexture = vfxTexture('fire-vol5-flame-29'),
): VfxDefinition {
  if (!['fire', 'poison', 'frost', 'electric'].includes(element) || !['x', 'y', 'z'].includes(axis))
    throw new Error('Weapon enchantment requires a supported element and length axis.');
  const fireAtlas = getVfxTextureSampling(fireTexture.assetId);
  const fireCycleSeconds = fireAtlas.columns * fireAtlas.rows / FIRE_FPS;
  return defineVfx({
    id,
    duration: element === 'fire' ? fireCycleSeconds * 2 : 8,
    loop: true,
    maxInstances: 8,
    host: { takeover: 'none', pose: 'follow' },
    params: { strength: { default: 1, min: 0, max: 1 } },
    build(fx) {
      const strength = (fx.param('strength') as Node<'float'>).clamp(0, 1);
      const fields = new WeakMap<VfxParticleContext, CoatingField>();
      const field = (ctx: VfxParticleContext): CoatingField => {
        const cached = fields.get(ctx);
        if (cached) return cached;
        const p = (
            element === 'fire' || element === 'electric' ? ctx.hostRestUnit : ctx.hostUnit
          ) as Node<'vec3'>,
          clock = ctx.age as Node<'float'>;
        const along = p[axis],
          across = axis === 'x' ? p.y : p.x;
        const physical = ctx.positionLocal as Node<'vec3'>,
          tiling = element === 'poison' ? vec2(3.5, 2.5) : vec2(3);
        const uv = element === 'fire'
          ? vec2(across.mul(1.5), along.mul(5))
          : vec2(physical[axis === 'x' ? 'y' : 'x'], physical[axis]).mul(tiling)
              .sub(vec2(0, clock.mul(element === 'poison' ? -0.125 : 0))).fract();
        const bind = ctx.sampleTexture;
        if (!bind) throw new Error('Weapon enchantment textures are missing.');
        const noise = bind('grain', uv) as Node<'vec4'>;
        let n = noise.r;
        let heat = noise.rgb;
        if (element === 'fire') {
          // The flow field's noise, vector map and fire ramp, fitted to the blade.
          // Two offset phases crossfade so the liquid never snaps on a wrap.
          const flowClock = clock.div(fireCycleSeconds);
          const phase = flowClock.fract();
          const flowUv = uv.mul(2.2).add(vec2(flowClock.mul(0.5), 0)).fract();
          const flow = (bind('flow', flowUv) as Node<'vec4'>).xy.mul(2).sub(1).mul(0.35);
          // Scroll from guard to tip; whole-tile travel also closes the effect loop.
          const scrollUv = uv.sub(vec2(0, flowClock.mul(2)));
          const a = (bind('grain', scrollUv.sub(flow.mul(phase)).fract()) as Node<'vec4'>).r;
          const b = (bind('grain', scrollUv.sub(flow.mul(phase.add(0.5).fract())).fract()) as Node<'vec4'>).r;
          n = mix(a, b, phase.sub(0.5).abs().mul(2));
          heat = (bind('heat-ramp', vec2(0.5, n.mul(2).add(0.08).clamp(0, 1))) as Node<'vec4'>).rgb.mul(vec3(1, 0.8, 0.08));
        }
        let conductor: Node<'float'> = float(0);
        if (element === 'electric') {
          const frame = clock.mul(7).add(along.mul(2).floor()).floor().mod(4);
          const bolt = ctx.sampleTexture?.(
            'arc',
            vec2(
              along.clamp(0.002, 0.998),
              across.sub(0.5).mul(0.75).add(0.5).clamp(0.01, 0.99).add(float(3).sub(frame)).div(4),
            ),
          ) as Node<'vec4'> | undefined;
          if (!bolt) throw new Error('Weapon electrical arc texture is missing.');
          conductor = bolt.r.smoothstep(0.12, 0.8);
        }
        const discharge = clock.mul(2.5).sub(along.mul(0.7)).add(across.mul(0.23)).fract();
        const pulse = discharge
          .smoothstep(0, 0.025)
          .mul(discharge.smoothstep(0.08, 0.27).oneMinus())
          .mul(0.85)
          .add(0.15);
        const mask =
          element === 'fire'
            ? float(1)
            : element === 'poison'
              ? n.pow(2).mul(0.22).add(0.48).add(viewFresnel(3).mul(0.15))
              : element === 'frost'
                ? n
                    .smoothstep(0.35, 0.8)
                    .mul(0.55)
                    .add(across.sub(0.5).abs().mul(2).smoothstep(0.45, 0.9).mul(0.35))
                    .add(viewFresnel(3).mul(0.15))
                    .mul(strength.mul(1.3).sub(along).smoothstep(0, 0.2))
                : conductor.mul(pulse);
        const value = { noise: n, mask: mask.mul(strength), heat };
        fields.set(ctx, value);
        return value;
      };
      const look: VfxLayerLook = {
        backdropNode:
          element === 'poison'
            ? (ctx) =>
                sampleVfxRefraction(vec2(field(ctx).noise.sub(0.5).mul(0.0015), 0)).mul(
                  vec3(0.38, 0.85, 0.18).mul(field(ctx).noise.mul(-0.45).add(1)),
                )
            : undefined,
        textures: {
          ...(element === 'fire' ? {
            flow: { texture: vfxTexture('flow-direction-input-1'), colorSpace: 'linear' as const, wrap: 'repeat' as const },
            'heat-ramp': { texture: vfxTexture('ramp-fire-color-1'), colorSpace: 'srgb' as const, wrap: 'clamp' as const },
          } : {}),
          ...(element === 'electric'
            ? {
                arc: { texture: vfxTexture('lightning-animated-3'), colorSpace: 'linear' as const },
              }
            : {}),
          grain: {
            texture:
              element === 'fire'
                ? vfxTexture('noise-cloud-contrasty-1')
                : element === 'frost'
                ? vfxTexture('ice-full-surface-1')
                : vfxTexture('noise-soft-alias-1'),
            colorSpace: 'linear',
            wrap: 'repeat',
          },
        },
        colorNode(ctx) {
          const { noise } = field(ctx);
          if (element === 'fire')
            return field(ctx).heat.mul(0.35).add(vec3(0.08, 0.001, 0));
          if (element === 'poison')
            return mix(vec3(0.002, 0.012, 0.001), vec3(0.04, 0.22, 0.004), noise);
          if (element === 'frost')
            return mix(
              vec3(0.015, 0.055, 0.1),
              vec3(0.28, 0.55, 0.7),
              noise.smoothstep(0.4, 0.85).add(viewFresnel(2).mul(0.3)).clamp(0, 1),
            );
          return mix(
            vec3(0.025, 0.25, 1.1),
            vec3(1.1, 2, 2.8),
            field(ctx).mask.smoothstep(0.45, 0.9),
          );
        },
        positionNode:
          element === 'frost'
            ? (ctx) => {
                if (!ctx.positionLocal || !ctx.normalLocal)
                  throw new Error('Frost coating needs host surface coordinates.');
                return ctx.positionLocal.add(
                  ctx.normalLocal.mul(field(ctx).noise.pow(4).mul(0.006)),
                );
              }
            : undefined,
        opacityNode: (ctx) =>
          field(ctx).mask.mul(element === 'fire' ? 0.98 : element === 'electric' ? 0.9 : element === 'frost' ? 0.92 : 0.65),
      };
      fx.hostShell({
        look,
        inflate: element === 'frost' ? 0.006 : 0.003,
        roughness: element === 'poison' ? 0.07 : element === 'frost' ? 0.16 : 0.6,
        metalness: 0,
        blend: element === 'electric' ? 'additive' : 'alpha',
        vertexColors: false,
        emissive: (ctx) => element === 'fire'
          ? field(ctx).heat.mul(strength).mul(1.2)
          : vec3(...COLORS[element])
            .mul(field(ctx).mask)
            .mul(
              element === 'poison' || element === 'frost' ? 0.12 : 0.7,
            ),
      });
      if (element === 'fire') {
        const flame = fireTexture;
        const atlas = fireAtlas;
        const samples = new WeakMap<VfxParticleContext, Node<'vec4'>>();
        const readFlame = (ctx: VfxParticleContext): Node<'vec4'> => {
          const cached = samples.get(ctx);
          if (cached) return cached;
          const value = sampleVfxAtlas(ctx, {
            ...atlas, textureKey: 'fire', mix: true, loop: true,
            phase: ctx.age.div(fireCycleSeconds)
              .add(float(ctx.index).mul(0.618034)),
          });
          samples.set(ctx, value);
          return value;
        };
        // Stable surface cards never die, relocate or reroll an animation frame.
        // Pivoted world-up quads retain fire.ts's rooted flame silhouette.
        fx.hostPoints({
          id: 'blade-flames', count: 8, size: [0.55, 0.8], seed: 163,
          mode: 'vertical', pivot: [0.5, 0.2], blend: 'alpha', depthTest: true, orderInLayer: 100,
          look: {
            textures: { fire: { texture: flame, colorSpace: 'srgb', wrap: 'clamp' } },
      positionNode: (ctx) => (ctx.positionLocal as Node<'vec3'>).add((ctx.normalLocal as Node<'vec3'>).mul(0.025)),
            colorNode: (ctx) => readFlame(ctx).rgb.mul(1.8),
            opacityNode: (ctx) => readFlame(ctx).r.mul(strength).mul(0.95),
          },
        });
        fx.particles({
          shape: { type: 'host' }, simulationSpace: 'world',
          capacity: 20, rateOverTime: 12, bursts: [], duration: 8,
          startLife: [0.35, 0.7], startSize: [0.006, 0.013], startSpeed: [0.08, 0.22],
          direction: [0, 1, 0], spread: 0.6, gravity: 0.35, drag: 1.6,
          noise: { strength: 0.12, frequency: 3, scrollSpeed: 1 },
          map: vfxTexture('point-soft-5'), blend: 'additive', emission: 3,
          tint: [1, 0.3, 0.025, 1],
          sizeOverLife: curve([0, 0.65], [0.2, 1], [1, 0]),
          opacityOverLife: curve([0, 0], [0.15, 1], [0.55, 1], [1, 0]),
          rotation: { enabled: false },
          look: { opacityMultiplierNode: () => strength },
        });
        return;
      }
      const moteCycle = (ctx: VfxParticleContext, rate = 0.25): Node<'float'> =>
        ctx.age.mul(rate).add(float(ctx.index).mul(0.618)).fract();
      if (element === 'electric' || element === 'poison') {
        const poison = element === 'poison',
          rate = poison ? 0.375 : 2.3;
        fx.hostPoints({
          count: poison ? 28 : 36,
          size: poison ? [0.09, 0.16] : [0.32, 0.62],
          blend: poison ? 'alpha' : 'additive',
          seed: 71,
          look: {
            ...atlasLook({
              thresholds: [0.04, 0.45, 0.45, 0.95],
              densityPower: 0.8,
              densityCoverage: [0.005, 0.12],
              texture: poison
                ? vfxTexture('acid-animation-1')
                : vfxTexture('lightning-held-arcs-5'),
              columns: poison ? 6 : 2,
              rows: poison ? 6 : 2,
              width: poison ? 2000 : 512,
              coverage: poison ? 'alpha' : 'rgb',
              dark: poison ? [0.003, 0.018, 0.001] : [0.005, 0.025, 0.2],
              mid: poison ? [0.07, 0.4, 0.008] : [0.025, 0.35, 1.4],
              hot: poison ? [0.5, 0.95, 0.06] : [1.2, 2, 2.8],
              phase: (ctx) =>
                poison
                  ? moteCycle(ctx, rate).mul(0.65).add(0.08)
                  : ctx.age
                      .mul(rate)
                      .add(float(ctx.index).mul(0.618))
                      .floor()
                      .add(float(ctx.index))
                      .mod(4)
                      .div(3),
              opacityMask: (ctx) =>
                (poison
                  ? moteCycle(ctx, rate).mul(Math.PI).sin()
                  : moteCycle(ctx, rate)
                      .smoothstep(0, 0.035)
                      .mul(moteCycle(ctx, rate).smoothstep(0.1, 0.32).oneMinus())
                ).mul(strength.mul(0.85)),
            }),
            positionNode: (ctx) => {
              const p = ctx.positionLocal as Node<'vec3'>,
                n = ctx.normalLocal as Node<'vec3'>;
              const coated = p.add(n.mul(poison ? 0.006 : 0.008));
              if (!poison) return coated;
              const slide = moteCycle(ctx, rate)
                .pow(2)
                .mul(-0.025)
                .mul((ctx.hostUnit as Node<'vec3'>)[axis].smoothstep(0, 0.12));
              return coated.add(
                vec3(axis === 'x' ? 1 : 0, axis === 'y' ? 1 : 0, axis === 'z' ? 1 : 0).mul(slide),
              );
            },
          },
        });
        return;
      }
      fx.hostPoints({
        count: 24,
        size: [0.09, 0.18],
        blend: 'alpha',
        seed: 43,
        look: {
          ...atlasLook({
            thresholds: [0.04, 0.45, 0.45, 0.95],
            densityPower: 0.8,
            densityCoverage: [0.005, 0.12],
            width: 2000,
            texture: vfxTexture('ice-speckles-2'),
            columns: 1,
            rows: 1,
            coverage: 'rgb',
            dark: [0.05, 0.2, 0.3],
            mid: [0.4, 0.7, 0.85],
            hot: [0.85, 1, 1.1],
            phase: () => float(0),
            opacityMask: (ctx) =>
              strength
                .mul(1.3)
                .sub((ctx.hostUnit as Node<'vec3'>)[axis])
                .smoothstep(0, 0.2)
                .mul(strength),
          }),
          positionNode: (ctx) =>
            (ctx.positionLocal as Node<'vec3'>).add((ctx.normalLocal as Node<'vec3'>).mul(0.007)),
        },
      });
    },
  });
}

export default createWeaponEnchantment('example.weapon-enchantment', 'fire');
