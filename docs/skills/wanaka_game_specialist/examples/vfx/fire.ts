// intent: Campfire and nozzle flame jets.
// variants: createCampfire, createFlameJet
// inputs: Fuel surface or unscaled nozzle anchor; each recipe declares world/local emission and extinguish behaviour.
// Campfire: pass a literal vfxTexture('fire-vol5-flame-N') for N=1–30 before prepare; default is 6.
// Copy dependencies: ./shared/special-pack.ts.
// Setup in an async scene: const effect = createCampfire('example.fire');
// const vfx = useVfx(context); await vfx.prepare(effect, {});
// const handle = vfx.play(effect, playOptions);
// Import useVfx from wanaka-studio-engine/vfx; construct playOptions from the recipe notes and real game inputs.
import {
  abs,
  dot,
  fract,
  mix,
  mx_noise_float,
  oneMinus,
  sin,
  smoothstep,
  time,
  vec2,
  vec3,
  viewportSize,
} from 'three/tsl';
import { type Node } from 'three/webgpu';
import {
  curve,
  defineVfx,
  getVfxTextureSampling,
  sampleVfxRefraction,
  vfxTexture,
  type Vec3,
  type VfxDefinition,
  type VfxLayerLook,
  type VfxParticleContext,
} from 'wanaka-studio-engine/vfx';
import { sampleVfxAtlas as sampleAtlas } from 'wanaka-studio-engine/vfx';
import { specialLook, specialTexture } from './shared/special-pack.js';
const CAMPFIRE_FPS = 60;
const WORLD_COMBUSTION = {
  direction: [0, 1, 0],
  simulationSpace: 'world',
  blend: 'alpha',
} as const;
// Copy this file and play at the fuel surface in world space with an unscaled pose. Local +Y rises. Game code owns fuel geometry, ignition, damage and environmental lighting.
// Stop normally when fuel is extinguished; all layers drain within 2.5 seconds. Stop immediately before removing the scene or for an instant visual cut. No fixed floor collision or persistent heat card is authored.
const HEAT_STRENGTH = 2.5;
const HEAT_FLOW = 1.15;
function heatLocal(ctx: VfxParticleContext): Node<'vec2'> {
  return ctx.uv as Node<'vec2'>;
}
function heatMask(ctx: VfxParticleContext): Node<'float'> {
  const localUv = heatLocal(ctx);
  const horizontal = abs(localUv.x.sub(0.5)).div(localUv.y.mul(0.12).add(0.28));
  const silhouette = oneMinus(smoothstep(0.72, 1, horizontal));
  const vertical = smoothstep(0, 0.06, localUv.y).mul(oneMinus(smoothstep(0.82, 1, localUv.y)));
  return silhouette.mul(vertical);
}
function heatOffset(ctx: VfxParticleContext): Node<'vec2'> {
  const localUv = heatLocal(ctx);
  const rise = time.mul(HEAT_FLOW);
  const flow = fract(localUv.mul(vec2(1.4, 2.6)).sub(vec2(0, rise)));
  const secondary = fract(flow.mul(1.73).add(vec2(rise.mul(0.17), 0.67)));
  const first = mx_noise_float(flow);
  const second = mx_noise_float(secondary);
  const wave = sin(localUv.y.mul(16).sub(rise.mul(6))).mul(0.35);
  return vec2(first.add(second.mul(0.35)).add(wave), second.mul(0.55))
    .mul(HEAT_STRENGTH)
    .div(viewportSize);
}
function heatLook(): VfxLayerLook {
  return {
    colorNode: (ctx) => sampleVfxRefraction(heatOffset(ctx)),
    opacityNode: (ctx) => heatMask(ctx),
  };
}
/** Returns rooted flames and embers. Pass a literal Fire Vol. 5 texture (1–30); default 6 stays the only default asset reference. */
export function createCampfire(
  id: string,
  texture = vfxTexture('fire-vol5-flame-6'),
): VfxDefinition {
  const atlas = getVfxTextureSampling(texture.assetId);
  const cycleSeconds = (atlas.columns * atlas.rows) / CAMPFIRE_FPS;
  return defineVfx({
    id,
    duration: cycleSeconds,
    maxInstances: 4,
    seed: 7,
    loop: true,
    build(fx) {
      const placement = {
        ...WORLD_COMBUSTION,
        shape: { type: 'sphere' as const, radius: [0, 0.12] as const },
      };
      // Rebirth is aligned to the complete atlas cycle. One frame of lifetime overlap prevents a gap at the boundary.
      fx.particles({
        ...placement,
        shape: { type: 'point' },
        capacity: 1,
        bursts: [{ time: 0, count: 1 }],
        startLife: cycleSeconds + 1 / CAMPFIRE_FPS,
        startSpeed: 0,
        startSize: 1.35,
        map: texture,
        flipbook: {
          columns: atlas.columns,
          rows: atlas.rows,
          fps: CAMPFIRE_FPS,
          loop: true,
          mix: false,
        },
        coverage: 'red',
        colorSource: 'texture',
        textureColorSpace: 'srgb',
        mode: 'vertical',
        pivot: [0.5, 0],
        rotation: { enabled: false },
        tint: [1, 1, 1, 0.95],
        emission: 1.25,
        transform: { position: [0, 0.02, 0] },
        orderInLayer: 10,
      });
      fx.particles({
        ...placement,
        capacity: 6,
        rateOverTime: 3,
        startLife: [0.8, 1.4],
        startSpeed: [0.9, 1.5],
        spread: 0.3,
        drag: 0.6,
        startSize: [0.008, 0.018],
        map: vfxTexture('point-solid-2'),
        tint: [1, 0.36, 0.035, 0.8],
        emission: 1.6,
        sizeOverLife: curve([0, 0.5], [0.2, 1], [1, 0]),
        opacityOverLife: curve([0, 0], [0.1, 1], [0.5, 0.6], [1, 0]),
        noise: { strength: 0.15, frequency: 1.8 },
        orderInLayer: 12,
      });
      fx.particles({
        capacity: 3,
        rateOverTime: 5,
        startLife: 0.4,
        startSpeed: 0,
        startSize: 1.1,
        aspect: 1.1 / 1.3,
        map: vfxTexture('solid'),
        colorSource: 'tint',
        blend: 'alpha',
        emission: 0,
        look: heatLook(),
        opacityOverLife: curve([0, 0], [0.4, 0.35], [0.6, 0.35], [1, 0]),
        orderInLayer: -8,
        transform: { position: [0, 1.05, 0] },
        rotation: { enabled: false },
      });
    },
  });
}
/** Continuous jet with game-owned nozzle orientation and receiving-plane input. */
// Copy this file. Prepare createFlameJet(id) and play with parent set to an unscaled nozzle anchor; local +X points out of the barrel. Move and rotate that anchor from the actual weapon each frame.
// Stop normally when firing ends; world-space fire and smoke drain within .75 seconds. Stop immediately before destroying the anchor or for an instant cancellation.
// Optional surfaceNormal / surfaceDistance describe the current receiving plane in world space (unit normal points toward the nozzle, distance = dot(normal, contact)). Fire and smoke fade at particle centres. Zero normal disables both; scene depth handles visible intersections.
// The plane fade is not scene collision or multi-surface clipping. Game code owns raycasts, reach, damage and fuel ignition; this definition never creates ground fires. Freeze plane params while the stopped jet drains.
// When previewing createFlameJet, place its nozzle anchor above the floor.
export function createFlameJet(id: string): VfxDefinition {
  return defineVfx({
    id,
    duration: 2,
    loop: true,
    maxInstances: 4,
    seed: 29,
    params: { surfaceNormal: { default: [0, 0, 0] }, surfaceDistance: { default: 0 } },
    build(fx) {
      const normal = fx.param('surfaceNormal') as Node<'vec3'>,
        distance = fx.param('surfaceDistance') as Node<'float'>;
      const look = {
        opacityMultiplierNode: (ctx: { readonly position: Node<'vec3'> }) =>
          normal
            .length()
            .greaterThan(0.5)
            .select(dot(ctx.position, normal).sub(distance).smoothstep(-0.05, 0.12), 1),
      };
      const placement = {
        transform: { position: [0, 0, 0] as Vec3 },
        direction: [1, 0, 0] as Vec3,
        simulationSpace: 'world' as const,
        blend: 'alpha' as const,
        look,
      };
      // Short ignition core; the animated billows carry the visible stream.
      fx.particles({
        ...placement,
        capacity: 10,
        rateOverTime: 65,
        startLife: [0.06, 0.1],
        startSpeed: [7, 8],
        spread: 0.035,
        startSize: [0.09, 0.14],
        map: vfxTexture('trail-soft-droplet-1'),
        mode: 'stretched',
        stretch: { lengthFactor: 1.8, speedFactor: 0.015 },
        tint: [1, 0.52, 0.13, 0.5],
        emission: 0.8,
        sizeOverLife: curve([0, 0.4], [0.2, 1], [1, 0]),
        opacityOverLife: curve([0, 0], [0.1, 1], [0.7, 0.7], [1, 0]),
        orderInLayer: 12,
      });
      const fire = specialTexture([vfxTexture('special-fire-turbulent-2')], 2);
      if (!fire) throw new Error('Jet flame atlas is missing.');
      const samples = new WeakMap<VfxParticleContext, Node<'vec4'>>();
      const readFlame = (ctx: VfxParticleContext) => {
        const cached = samples.get(ctx);
        if (cached) return cached;
        const value = sampleAtlas(ctx, {
          columns: fire.columns,
          rows: fire.rows,
          width: fire.width,
          phase: (ctx.progress as Node<'float'>).mul(0.75).add(0.1),
        });
        samples.set(ctx, value);
        return value;
      };
      const billow: VfxLayerLook = {
        textures: { atlas: { texture: fire.texture, colorSpace: 'linear' } },
        colorNode: (ctx) => {
          const density = readFlame(ctx).r.pow(1.8);
          const heat = density.mul((ctx.progress as Node<'float'>).mul(-0.45).add(1));
          return mix(
            mix(vec3(0.045, 0.002, 0.0003), vec3(0.85, 0.09, 0.002), heat.smoothstep(0.06, 0.5)),
            vec3(2.2, 1.1, 0.23),
            heat.smoothstep(0.65, 0.95),
          );
        },
        opacityNode: (ctx) => {
          const uv = ctx.uv as Node<'vec2'>;
          // Discard the atlas cell border even when the source contains residual density.
          const edge = uv.sub(0.5).length().smoothstep(0.32, 0.49).oneMinus();
          return readFlame(ctx).a.mul(readFlame(ctx).r.smoothstep(0.05, 0.28)).mul(edge);
        },
      };
      fx.particles({
        ...placement,
        capacity: 70,
        rateOverTime: 100,
        startLife: [0.42, 0.62],
        startSpeed: [7, 9],
        spread: 0.075,
        shape: { type: 'sphere', radius: [0, 0.035] },
        drag: 1.3,
        gravity: 0.65,
        startSize: [0.6, 0.9],
        map: fire.texture,
        look: { ...billow, ...look },
        rotation: { start: [-Math.PI, Math.PI], spin: [-0.8, 0.8] },
        sizeOverLife: curve([0, 0.25], [0.2, 0.65], [0.55, 1], [1, 1.15]),
        opacityOverLife: curve([0, 0], [0.06, 0.7], [0.4, 0.65], [0.75, 0.3], [1, 0]),
        noise: { strength: 0.9, frequency: 3.5 },
        orderInLayer: 10,
      });
      fx.particles({
        ...placement,
        capacity: 38,
        rateOverTime: 85,
        startLife: [0.22, 0.36],
        startSpeed: [7.5, 9],
        spread: 0.07,
        drag: 0.9,
        gravity: 0.4,
        startSize: [0.28, 0.42],
        mode: 'stretched',
        stretch: { lengthFactor: 2.2, speedFactor: 0.02 },
        map: vfxTexture('fire-animation-core-2'),
        flipbook: { columns: 4, rows: 4, loop: false, mix: true },
        coverage: 'alpha',
        colorSource: 'texture',
        tint: [1, 0.65, 0.3, 0.5],
        emission: 0.85,
        sizeOverLife: curve([0, 0.6], [0.3, 1], [1, 1.15]),
        opacityOverLife: curve([0, 0], [0.12, 0.8], [0.65, 0.6], [1, 0]),
        noise: { strength: 0.6, frequency: 3 },
        orderInLayer: 11,
      });
      const smoke = specialTexture([vfxTexture('special-smoke-7')], 7);
      if (!smoke) throw new Error('Jet smoke atlas is missing.');
      fx.particles({
        ...placement,
        capacity: 20,
        rateOverTime: 12,
        startLife: [0.6, 0.75],
        startSpeed: [6, 8],
        spread: 0.16,
        gravity: 1.1,
        drag: 1.4,
        startSize: [0.7, 1],
        map: smoke.texture,
        look: {
          ...specialLook(
            smoke,
            [
              [0.045, 0.035, 0.03],
              [0.12, 0.105, 0.09],
              [0.23, 0.21, 0.18],
            ],
            true,
          ),
          ...look,
        },
        rotation: { start: [-Math.PI, Math.PI], spin: [-0.4, 0.4] },
        sizeOverLife: curve([0, 0.1], [0.35, 0.65], [1, 1.7]),
        opacityOverLife: curve([0, 0], [0.3, 0], [0.6, 0.18], [0.85, 0.12], [1, 0]),
        orderInLayer: 8,
      });
      fx.particles({
        ...placement,
        capacity: 8,
        rateOverTime: 12,
        startLife: [0.2, 0.4],
        startSpeed: [4, 6],
        spread: 0.23,
        drag: 1,
        gravity: 0.4,
        startSize: [0.01, 0.02],
        map: vfxTexture('point-vortex-1'),
        tint: [1, 0.3, 0.035, 0.9],
        emission: 1.5,
        sizeOverLife: curve([0, 1], [1, 0]),
        opacityOverLife: curve([0, 1], [1, 0]),
        orderInLayer: 11,
      });
    },
  });
}
export default createCampfire('example.fire');
