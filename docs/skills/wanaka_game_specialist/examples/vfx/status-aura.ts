// intent: Persistent poison and electric actor-status auras.
// variants: createPoisonStatus, createLightningAura
// inputs: Poison actor anchor; electric requires the visible animated model as host. Game owns status duration and removal.
// Copy dependencies: none.
// Setup in an async scene: const effect = createPoisonStatus('example.poison-status');
// const vfx = useVfx(context); await vfx.prepare(effect);
// const handle = vfx.play(effect);
// Import useVfx from wanaka-studio-engine/vfx; game code owns status application and removal.
import { float, vec2, vec3 } from 'three/tsl';
import { type Node } from 'three/webgpu';
import { curve, defineVfx, vfxTexture, type VfxBillboardPathPoint, type VfxDefinition, type VfxParticleContext, sampleVfxAtlas, viewFresnel, createVfxAtlasLook as atlasLook, RANDOM_YAW } from 'wanaka-studio-engine/vfx';

export function createPoisonStatus(id: string): VfxDefinition {
  return defineVfx({
    id,
    duration: 8,
    maxInstances: 4,
    seed: 7,
    loop: true,
    build(fx) {
      for (let strand = 0; strand < 3; strand++) {
        fx.path({
          id: `poison-vapour-${strand}`,
          maxSegments: 24,
          blend: 'alpha',
          sample: (age) =>
            Array.from({ length: 25 }, (_, index): VfxBillboardPathPoint => {
              const t = index / 24,
                angle = (strand * Math.PI * 2) / 3 + t * 3.4 - (age * Math.PI) / 4;
              const radius = 0.3 + Math.sin(t * Math.PI) * 0.12;
              return {
                position: [Math.cos(angle) * radius, 0.12 + t * 1.25, Math.sin(angle) * radius],
                width:
                  Math.sin(t * Math.PI) *
                  0.16 *
                  (0.8 + Math.sin((age * Math.PI) / 2 + strand) * 0.2),
                u: t,
                age: 0.5,
              };
            }),
          look: {
            textures: {
              trail: {
                texture: vfxTexture('trail-s-bend-1'),
                colorSpace: 'linear',
                wrap: 'repeat',
              },
            },
            colorNode: () => vec3(0.24, 0.65, 0.025),
            opacityNode: (ctx) => {
              const sample = ctx.sampleTexture;
              if (!sample) throw new Error('Poison vapour trail is not bound.');
              return (sample('trail', ctx.uv) as Node<'vec4'>).r.mul(0.6);
            },
          },
        });
      }
      fx.particles({
        capacity: 24,
        rateOverTime: 16,
        startLife: [0.75, 1],
        startSpeed: [0.12, 0.25],
        direction: [0, 1, 0],
        spread: 0.25,
        shape: { type: 'box', size: [0.65, 0.95, 0.65] },
        transform: { position: [0, 0.7, 0] },
        startSize: [0.6, 0.85],
        drag: 0.4,
        noise: { strength: 0.18, frequency: 2 },
        map: vfxTexture('smoke-body-animation-1'),
        flipbook: { columns: 8, rows: 8, loop: false, mix: true },
        coverage: 'alpha',
        colorSource: 'texture',
        tint: [0.3, 0.8, 0.06, 0.7],
        emission: 0.8,
        blend: 'alpha',
        rotation: { start: RANDOM_YAW, spin: [-0.3, 0.3] },
        sizeOverLife: curve([0, 0.35], [0.3, 0.9], [1, 1.35]),
        opacityOverLife: curve([0, 0], [0.18, 0.65], [0.65, 0.5], [1, 0]),
      });
      fx.particles({
        capacity: 20,
        rateOverTime: 18,
        startLife: [0.5, 0.9],
        startSpeed: [0.25, 0.55],
        direction: [0, 1, 0],
        spread: 0.3,
        shape: { type: 'box', size: [0.7, 1, 0.7] },
        transform: { position: [0, 0.65, 0] },
        startSize: [0.18, 0.3],
        map: vfxTexture('acid-animation-2'),
        flipbook: { columns: 5, rows: 5, loop: false, mix: true },
        coverage: 'alpha',
        colorSource: 'texture',
        tint: [0.85, 0.95, 0.7, 0.75],
        emission: 0.95,
        blend: 'alpha',
        rotation: { start: RANDOM_YAW, spin: [-0.5, 0.5] },
        sizeOverLife: curve([0, 0.35], [0.35, 1], [1, 0.55]),
        opacityOverLife: curve([0, 0], [0.16, 0.9], [0.65, 0.7], [1, 0]),
      });
      fx.particles({
        capacity: 12,
        rateOverTime: 12,
        startLife: [0.4, 0.75],
        startSpeed: [0.25, 0.65],
        direction: [0, 1, 0],
        spread: 0.35,
        shape: { type: 'box', size: [0.65, 1.1, 0.65] },
        transform: { position: [0, 0.6, 0] },
        startSize: [0.012, 0.025],
        map: vfxTexture('point-soft-5'),
        tint: [0.6, 0.95, 0.12, 0.7],
        emission: 1.2,
        blend: 'alpha',
        opacityOverLife: curve([0, 0], [0.2, 1], [1, 0]),
      });
    },
  });
}
/**
 * Surface electricity follows the actual animated model; no visibility takeover.
 * Prepare with `await vfx.prepare(effect, { host: actorModel })`, then
 * `vfx.play(effect, { host: actorModel })`. Pass the visible model subtree,
 * excluding hitboxes and unrelated props. Ramp strength down on status exit;
 * stop immediately on despawn. Host fitting uses a 1.8-metre authoring frame.
 */
export function createLightningAura(id: string): VfxDefinition {
  return defineVfx({
    id,
    duration: 8,
    maxInstances: 4,
    seed: 7,
    loop: true,
    host: { takeover: 'none', pose: 'follow', fit: { height: 1.8 } },
    params: { strength: { default: 1, min: 0, max: 1 } },
    build(fx) {
      const strength = (fx.param('strength') as Node<'float'>).clamp(0, 1);
      const arc = vfxTexture('lightning-held-arcs-5');
      const fields = new WeakMap<VfxParticleContext, Node<'float'>>();
      const surfaceField = (ctx: VfxParticleContext): Node<'float'> => {
        const cached = fields.get(ctx);
        if (cached) return cached;
        const p = ctx.hostRestUnit as Node<'vec3'>;
        // A discharge holds its branching topology until it has faded completely.
        // The travelling pulse reaches different parts of the skin at different times.
        const clock = ctx.age.mul(2).sub(p.y.mul(0.8));
        const pulse = clock.fract();
        const phase = clock.floor().mod(4).div(3);
        const jitter = ctx.age.mul(45).sin().mul(0.002);
        const sample = (uv: Node<'vec2'>): Node<'float'> =>
          sampleVfxAtlas(ctx, {
            textureKey: 'arc', columns: 2, rows: 2, width: 512,
            phase, localUv: uv.add(vec2(jitter, 0)).fract(), mix: false,
          }).r;
        // Keep two complementary projections; omit the third crossing network.
        const line = sample(vec2(p.x.mul(1.6), p.y.mul(1.8)))
          .max(sample(vec2(p.z.mul(1.6).add(0.37), p.y.mul(1.8))));
        const gate = pulse.smoothstep(0, 0.055)
          .mul(pulse.smoothstep(0.5, 0.98).oneMinus());
        const result = line.pow(0.65).smoothstep(0.025, 0.5).mul(gate)
          .mul(p.y.smoothstep(0.76, 0.92).oneMinus().mul(0.85).add(0.15))
          .mul(strength);
        fields.set(ctx, result);
        return result;
      };
      fx.hostShell({
        id: 'surface-current', inflate: 0.003, blend: 'additive',
        look: {
          textures: { arc: { texture: arc, colorSpace: 'linear', wrap: 'clamp' } },
          colorNode: (ctx) => vec3(0.025, 0.28, 1.25)
            .add(vec3(1.3, 2.1, 2.5).mul(surfaceField(ctx).pow(3))),
          opacityNode: (ctx) => surfaceField(ctx),
        },
      });
      fx.hostShell({
        id: 'charged-contour', inflate: 0.006, blend: 'additive',
        look: {
          colorNode: () => vec3(0.015, 0.12, 0.65),
          opacityNode: (ctx) => viewFresnel(4).mul(0.12)
            .mul(ctx.age.mul(6.28318530718).sin().mul(0.15).add(0.85)).mul(strength),
        },
      });
      // Short branching flashes are sampled on the live skin, rather than in a cylinder.
      // Larger, sparser arcs escape the silhouette; the fine layer stays close to skin.
      for (const outer of [false, true]) {
        const cycle = (ctx: VfxParticleContext): Node<'float'> =>
          ctx.age.mul(outer ? 1 : 2).add(float(ctx.index).mul(outer ? 0.25 : 0.618034)).fract();
        fx.hostPoints({
          id: outer ? 'escaping-arcs' : 'skin-arcs',
          count: outer ? 4 : 16,
          size: outer ? [0.5, 0.8] : [0.18, 0.32],
          seed: outer ? 83 : 37,
          blend: 'additive',
          look: {
            ...atlasLook({
              texture: vfxTexture('lightning-held-arcs-1'), columns: 2, rows: 2, width: 512,
              coverage: 'rgb', thresholds: [0.025, 0.25, 0.25, 0.7],
              densityPower: 0.7, densityCoverage: [0.015, 0.12],
              dark: [0.002, 0.015, 0.12], mid: [0.03, 0.4, 1.5], hot: [1.4, 2.2, 2.6],
              phase: (ctx) => ctx.age.mul(outer ? 1 : 2)
                .add(float(ctx.index).mul(outer ? 0.25 : 0.618034)).floor().add(float(ctx.index)).mod(4).div(3),
              opacityMask: (ctx) => cycle(ctx).smoothstep(0, 0.045)
                .mul(cycle(ctx).smoothstep(outer ? 0.09 : 0.35, outer ? 0.23 : 0.75).oneMinus())
                .mul((ctx.hostRestUnit as Node<'vec3'>).y.smoothstep(0.75, 0.9).oneMinus())
                .mul(strength),
            }),
            positionNode: (ctx) => (ctx.positionLocal as Node<'vec3'>)
              .add((ctx.normalLocal as Node<'vec3'>).mul(outer ? 0.04 : 0.008)),
          },
        });
      }
    },
  });
}

export default createPoisonStatus('example.poison-status');
