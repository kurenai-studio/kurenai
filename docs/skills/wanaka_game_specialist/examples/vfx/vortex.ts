// intent: Projected spirals, debris intake and upright wind funnels.
// variants: ground intake: createVortex(id, options); upright funnel: createWindFunnel(id, airy / dark)
// inputs: ground intake or upright anchor; explicit authored radius/height; no gameplay force
// Copy dependencies: none.
// Event binding: playOptions: actual ground pose for projection. Upright funnel has its own radius/height. Start/end with the world effect; pulling objects remains gameplay-owned.
// Setup in an async scene: const effect = createVortex("game.vortex", {"variant": "projection"});
// const vfx = useVfx(context); await vfx.prepare(effect, {});
// const handle = vfx.play(effect, playOptions);
// Import useVfx (and createVfxPointSource when needed) from wanaka-studio-engine/vfx. Prepare once; construct playOptions from the game inputs above per event.
// Update the selected recipe's declared params from gameplay; await handle.finished for complete drain.
// Immediate cancellation: handle.stop({ immediate: true }). Persistent holds end on the game's state/event.
import { float, mx_atan2, mx_noise_float, normalView, vec2, vec3 } from 'three/tsl';
import { type Node } from 'three/webgpu';
import {
  curve,
  defineVfx,
  RANDOM_YAW,
  vfxTexture,
  type VfxBillboardPathPoint,
  type VfxDefinition,
  type VfxLayerLook,
  type VfxPairedPathSection,
  type VfxParticleContext,
} from 'wanaka-studio-engine/vfx';

/** Projection retains its 2.5-metre artwork; the debris intake accepts a calibrated radius. */
export type GroundVortexOptions =
  | {
      readonly variant: 'projection';
    }
  | {
      readonly variant?: 'debris';
      readonly radius?: number;
    };
/** Returns projected arms or three-dimensional intake; game code applies forces separately. */
// Copy this file once; select the named variant before prepare, then reuse the definition. Game code owns contacts, damage and cancellation.
export function createVortex(id: string, options: GroundVortexOptions = {}): VfxDefinition {
  if (options.variant === 'projection') return createProjectedVortex(id);
  if (options.variant === undefined || options.variant === 'debris')
    return createGroundVortex(id, options.radius);
  throw new Error('Unknown ground vortex variant.');
}
const GROUND_PROJECTION = {
  blend: 'alpha',
  mode: 'horizontal',
  rotation: { enabled: false },
} as const;
const LOOP = 5;
const RADIUS = 2.5;
function projection(ctx: VfxParticleContext, fine: boolean): Node<'float'> {
  const local = (ctx.uv as Node<'vec2'>).sub(vec2(0.5, 0.5)).mul(2);
  const radius = local.length();
  const angle = mx_atan2(local.y, local.x) as Node<'float'>;
  const clock = ctx.age as Node<'float'>;
  const sample = ctx.sampleTexture;
  if (!sample) throw new Error('Vortex noise texture is not bound.');
  const cycle = clock.mul((Math.PI * 2) / LOOP);
  // Polar advection follows the arms inward; fine filaments share the same rotation.
  const phase = angle.mul(3).add(radius.max(0.04).log().mul(5.5)).sub(cycle.mul(2));
  const flow = vec2(phase.div(Math.PI * 2), radius.mul(3).add(clock.mul(0.4)));
  const noise = (sample('noise', flow) as Node<'vec4'>).x;
  const grain = (sample('noise', flow.mul(vec2(2.3, 1.7)).add(0.37)) as Node<'vec4'>).x;
  const arms = phase.add(noise.sub(0.5).mul(2.2)).sin().mul(0.5).add(0.5);
  const broken = noise.mul(0.65).add(grain.mul(0.35)).smoothstep(0.22, 0.75);
  const edge = radius.smoothstep(0.63, 0.98).oneMinus();
  const core = radius.smoothstep(0.06, 0.22);
  return arms
    .pow(fine ? 12 : 2.5)
    .mul(broken)
    .mul(edge)
    .mul(core);
}
function projectedLook(fine: boolean): VfxLayerLook {
  return {
    textures: {
      noise: {
        texture: vfxTexture('light-vortex-t-noise-lc-30'),
        colorSpace: 'linear',
        wrap: 'repeat',
      },
    },
    colorNode: () => (fine ? vec3(0.9, 0.67, 0.32) : vec3(0.34, 0.24, 0.12)),
    opacityNode: (ctx) => projection(ctx, fine).mul(fine ? 0.5 : 0.68),
  };
}
/** Returns the light-vortex composition at a game-owned pose. */
export function createProjectedVortex(id: string): VfxDefinition {
  return defineVfx({
    id,
    duration: LOOP,
    seed: 73,
    loop: true,
    build(fx) {
      fx.particles({
        ...GROUND_PROJECTION,
        startLife: LOOP,
        startSize: RADIUS * 2,
        map: vfxTexture('circle-soft-boundary-8'),
        tint: [0.035, 0.012, 0.004, 0.45],
        emission: 0,
        transform: { position: [0, 0.015, 0] },
        orderInLayer: 1,
      });
      for (const fine of [false, true]) {
        fx.particles({
          ...GROUND_PROJECTION,
          startLife: LOOP,
          startSize: RADIUS * 2,
          map: vfxTexture('solid'),
          colorSource: 'tint',
          look: projectedLook(fine),
          transform: { position: [0, fine ? 0.035 : 0.025, 0] },
          orderInLayer: fine ? 3 : 2,
        });
      }
      fx.particles({
        capacity: 28,
        rateOverTime: 8,
        startLife: [1.1, 1.8],
        startSpeed: [0.45, 0.8],
        shape: { type: 'circle', radius: [0.9, 2.2] },
        radial: 'inward',
        orbit: { speed: 3.8, axis: [0, 1, 0] },
        startSize: [0.018, 0.045],
        sizeOverLife: curve([0, 0], [0.15, 1], [0.75, 0.65], [1, 0]),
        map: vfxTexture('point-soft-4'),
        tint: [1, 0.47, 0.12, 0.7],
        emission: 0.15,
        blend: 'alpha',
        transform: { position: [0, 0.08, 0] },
        orderInLayer: 4,
      });
      fx.particles({
        capacity: 12,
        rateOverTime: 6,
        startLife: [1.2, 1.8],
        startSpeed: 0.65,
        radial: 'inward',
        orbit: { speed: 3.8, axis: [0, 1, 0] },
        shape: { type: 'circle', radius: [1.1, 2.2] },
        startSize: [0.3, 0.65],
        opacityOverLife: curve([0, 0], [0.2, 0.2], [0.7, 0.13], [1, 0]),
        map: vfxTexture('smoke-irregular-wisp-7'),
        tint: [0.36, 0.25, 0.12, 0.35],
        emission: 0.5,
        blend: 'alpha',
        transform: { position: [0, 0.06, 0] },
      });
    },
  });
}
// Copy and prepare createGroundVortex(uniqueId, radius). Play unparented at the actual flat-ground contact, identity rotation and unit scale, +Y up. This is a stationary field; radius controls the visual intake, not collision, damage or an exact warning boundary.
// Game owns pulling, targets and duration. Fade params.intensity before stop({ immediate: true }); normal stop retains authored particle lives up to four seconds. No terrain projection, receiving-plane collision or physical hole is implied.
const INTAKE_LOOP = 4;
const FLIGHT = 2;
const TAIL = 0.55;
const STREAMS = 6;
const SEGMENTS = 24;
function inwardTrail(
  age: number,
  stream: number,
  fieldRadius: number,
): readonly VfxBillboardPathPoint[] {
  const points: VfxBillboardPathPoint[] = [];
  let previous = -1;
  for (let index = 0; index <= SEGMENTS; index += 1) {
    const lag = TAIL * (1 - index / SEGMENTS);
    const clock = (age - lag) / FLIGHT + stream / STREAMS;
    const progress = clock - Math.floor(clock);
    const angle = stream * Math.PI * (3 - Math.sqrt(5)) + progress * Math.PI * 3.5;
    const radius = fieldRadius * (0.048 + 0.952 * Math.pow(1 - progress, 0.85));
    const headTail = Math.sin((Math.PI * index) / SEGMENTS);
    points.push({
      position: [
        Math.cos(angle) * radius,
        fieldRadius * (0.024 + Math.sin(progress * Math.PI) * 0.056),
        Math.sin(angle) * radius,
      ],
      width: fieldRadius * (0.11 + progress * 0.055) * headTail * Math.sin(Math.PI * progress),
      u: index / SEGMENTS,
      age: lag / TAIL,
      connected: previous >= 0 && progress >= previous,
    });
    previous = progress;
  }
  return points;
}
const STREAM_LOOK: VfxLayerLook = {
  textures: {
    grain: { texture: vfxTexture('noise-soft-alias-1'), colorSpace: 'linear', wrap: 'repeat' },
  },
  colorNode(ctx) {
    const across = (ctx.uv as Node<'vec2'>).y.mul(Math.PI).sin().max(0);
    return vec3(0.19, 0.17, 0.24).add(vec3(0.14, 0.11, 0.2).mul(across.pow(3)));
  },
  opacityNode(ctx) {
    const uv = ctx.uv as Node<'vec2'>;
    const sample = ctx.sampleTexture;
    if (!sample) throw new Error('Infall grain texture is not bound.');
    const grain = (
      sample('grain', uv.mul(vec2(5, 2)).add(vec2(ctx.age.mul(-0.3), 0))) as Node<'vec4'>
    ).x;
    const across = uv.y.mul(Math.PI).sin().max(0);
    const fade = (ctx.progress as Node<'float'>).oneMinus().max(0).pow(0.5);
    return across.pow(1.6).mul(grain.smoothstep(0.25, 0.75)).mul(fade).mul(0.55);
  },
};
const MIST_LOOK: VfxLayerLook = {
  textures: {
    mist: {
      texture: vfxTexture('smoke-textured-puff-7'),
      colorSpace: 'linear',
    },
  },
  colorNode: () => vec3(0.16, 0.14, 0.19),
  opacityNode(ctx) {
    const sample = ctx.sampleTexture;
    if (!sample) throw new Error('Infall mist texture is not bound.');
    return (sample('mist', ctx.uv) as Node<'vec4'>).x
      .smoothstep(0.15, 0.85)
      .mul(ctx.uv.sub(0.5).length().smoothstep(0.22, 0.5).oneMinus())
      .mul(0.75);
  },
};
/** Stationary flat-ground intake; radius sets the visual intake, not a damage or pull query. */
export function createGroundVortex(id: string, radius = 2.5): VfxDefinition {
  if (!Number.isFinite(radius) || radius < 0.75 || radius > 6)
    throw new Error('Ground vortex radius must be between 0.75 and 6 metres.');
  return defineVfx({
    id,
    duration: INTAKE_LOOP,
    seed: 7,
    loop: true,
    maxInstances: 4,
    params: { intensity: { default: 1, min: 0, max: 1 } },
    build(fx) {
      const intensity = fx.param('intensity') as Node<'float'>;
      const visibility = { opacityMultiplierNode: () => intensity };
      fx.particles({
        ...GROUND_PROJECTION,
        startLife: INTAKE_LOOP,
        startSize: radius * 0.64,
        map: vfxTexture('solid'),
        colorSource: 'tint',
        look: {
          ...visibility,
          textures: {
            grain: {
              texture: vfxTexture('noise-soft-alias-1'),
              colorSpace: 'linear',
              wrap: 'repeat',
            },
          },
          colorNode(ctx) {
            const uv = (ctx.uv as Node<'vec2'>).sub(0.5).mul(2);
            const r = uv.length(),
              clock = (ctx.age as Node<'float'>).mul((Math.PI * 2) / INTAKE_LOOP);
            const at = vec2(
              uv.x.mul(clock.cos()).sub(uv.y.mul(clock.sin())),
              uv.x.mul(clock.sin()).add(uv.y.mul(clock.cos())),
            );
            const sample = ctx.sampleTexture;
            if (!sample) throw new Error('Vortex core grain is not bound.');
            const grain = (sample('grain', at.mul(2).add(0.5)) as Node<'vec4'>).x;
            const rim = r
              .sub(0.74)
              .abs()
              .smoothstep(0.015, 0.1)
              .oneMinus()
              .mul(grain.smoothstep(0.25, 0.7));
            return vec3(0.006, 0.004, 0.018).add(vec3(0.11, 0.075, 0.18).mul(rim));
          },
          opacityNode: (ctx) =>
            (ctx.uv as Node<'vec2'>)
              .sub(0.5)
              .length()
              .mul(2)
              .smoothstep(0.35, 0.95)
              .oneMinus()
              .mul(0.9),
        },
        transform: { position: [0, 0.025, 0] },
        orderInLayer: 5,
      });
      for (let stream = 0; stream < STREAMS; stream += 1) {
        fx.path({
          id: `infall-${stream}`,
          maxSegments: SEGMENTS,
          sample: (age) => inwardTrail(age, stream, radius),
          look: { ...STREAM_LOOK, ...visibility },
          blend: 'alpha',
          orderInLayer: 10,
        });
      }
      fx.particles({
        capacity: 22,
        rateOverTime: 9,
        startLife: [1.7, 1.9],
        startSpeed: radius * 0.45,
        radial: 'inward',
        orbit: { speed: 3.8, axis: [0, 1, 0] },
        shape: { type: 'circle', radius: [radius * 0.85, radius * 0.98] },
        startSize: [radius * 0.24, radius * 0.44],
        sizeOverLife: curve([0, 0.4], [0.5, 1], [1, 0.2]),
        opacityOverLife: curve([0, 0], [0.2, 0.65], [0.8, 0.4], [1, 0]),
        map: vfxTexture('smoke-textured-puff-7'),
        look: { ...MIST_LOOK, ...visibility },
        colorSource: 'tint',
        tint: [0.2, 0.12, 0.35, 0.7],
        emission: 0.7,
        blend: 'alpha',
        transform: { position: [0, radius * 0.036, 0] },
        rotation: { start: RANDOM_YAW },
      });
      fx.particles({
        capacity: 12,
        rateOverTime: 5,
        startLife: [1.7, 1.9],
        startSpeed: radius * 0.45,
        radial: 'inward',
        orbit: { speed: 3.8, axis: [0, 1, 0] },
        shape: { type: 'circle', radius: [radius * 0.85, radius * 0.98] },
        transform: { position: [0, radius * 0.064, 0] },
        mesh: {
          geometry: {
            positions: [
              -0.45, 0, 0, 0.4, 0, 0.1, 0, 0.55, 0, 0.05, -0.4, 0, 0, 0.05, 0.45, -0.05, 0.1, -0.35,
            ],
            indices: [0, 4, 2, 4, 1, 2, 1, 5, 2, 5, 0, 2, 4, 0, 3, 1, 4, 3, 5, 1, 3, 0, 5, 3],
          },
          side: 'front',
        },
        look: { ...visibility },
        meshOrient: 'random',
        startSize: [radius * 0.014, radius * 0.036],
        sizeOverLife: curve([0, 0.5], [0.12, 1], [0.8, 0.8], [1, 0]),
        opacityOverLife: curve([0, 0], [0.1, 1], [0.85, 1], [1, 0]),
        map: vfxTexture('solid'),
        colorSource: 'tint',
        tint: [0.3, 0.27, 0.38, 0.9],
        lit: true,
        roughness: 0.9,
        emission: 1,
        blend: 'alpha',
      });
    },
  });
}

/** Airy height is in metres; the dark funnel retains its authored 3.2-metre height. */
export type WindFunnelOptions =
  | {
      readonly variant?: 'airy';
      readonly height?: number;
    }
  | {
      readonly variant: 'dark';
    };
/** Returns an upright airy or dark funnel, with its original release behavior. */
export function createWindFunnel(id: string, options: WindFunnelOptions = {}): VfxDefinition {
  if (options.variant === 'dark') return createGalleryTornado(id);
  if (options.variant === undefined || options.variant === 'airy')
    return createStorm(id, options.height);
  throw new Error('Unknown wind funnel variant.');
}
const LOCAL_WIND = { simulationSpace: 'local', blend: 'alpha' } as const;
// Copy this file. Prepare createStorm(id, height) once, then play at the game-owned field contact with an unscaled pose. Local +Y is the field axis; the footprint does not conform to uneven terrain.
// Game code owns wind forces, targets and damage. Stop normally when the field ends; all layers drain within 1.2 seconds. Immediate stop clears an interruption. The meshes and dust stay local to the field anchor.
const windFunnelLOOP = 1;
const LIFE = 1.2;
const FADE = curve([0, 0], [1 / 6, 1], [5 / 6, 1], [1, 0]);
// A winding ribbon carries directional detail; the shell supplies only a faint body.
function airyWind(age: number, arm: number, scale: number): readonly VfxPairedPathSection[] {
  const points: VfxPairedPathSection[] = [];
  for (let index = 0; index <= 64; index += 1) {
    const u = index / 64;
    const along = 0.015 + (arm % 4) * 0.17 + u * (arm < 4 ? 0.43 : 0.29);
    const angle =
      along * Math.PI * 4.3 +
      age * (4.2 - arm * 0.22) +
      arm * 2.399963 +
      Math.sin(along * 19 - age * 2.3 + arm) * 0.22;
    const radius = 0.2 + along ** 1.2 * 1.1 + Math.sin(along * 21 + age * 2 + arm) * 0.045;
    const lean = Math.sin(along * 3 + age * Math.PI) * along ** 1.5 * 0.24;
    const width = (0.12 + along * 0.58) * Math.sin(Math.PI * u) ** 0.65;
    const x = (Math.cos(angle) * radius + lean) * scale;
    const z = Math.sin(angle) * radius * scale;
    const y = (0.08 + along * HEIGHT) * scale;
    points.push({ a: [x, y - (width * scale) / 2, z], b: [x, y + (width * scale) / 2, z], u, age });
  }
  return points;
}
const AIR_BAND: VfxLayerLook = {
  textures: {
    ribbon: { texture: vfxTexture('trail-wave-ribbons-6'), colorSpace: 'linear' },
    grain: { texture: vfxTexture('noise-cloud-contrasty-1'), colorSpace: 'linear', wrap: 'repeat' },
  },
  colorNode(ctx) {
    const width = ctx.uv.y.mul(Math.PI).sin().max(0);
    return vec3(0.24, 0.31, 0.29).add(vec3(0.16, 0.17, 0.13).mul(width.pow(3)));
  },
  opacityNode(ctx) {
    const sample = ctx.sampleTexture;
    if (!sample) throw new Error('Air funnel ribbon textures are not bound.');
    const uv = ctx.uv;
    const ribbon = (sample('ribbon', vec2(uv.x, uv.y.mul(0.76).add(0.12))) as Node<'vec4'>).x;
    const grain = (sample('grain', vec2(uv.x.mul(2).sub(ctx.age.mul(0.4)), uv.y)) as Node<'vec4'>)
      .x;
    const edges = uv.y.mul(Math.PI).sin().max(0).pow(1.3);
    const ends = uv.x.smoothstep(0, 0.1).mul(uv.x.smoothstep(0.78, 1).oneMinus());
    return ribbon
      .smoothstep(0.08, 0.62)
      .mul(grain.smoothstep(0.18, 0.7).mul(0.8).add(0.2))
      .mul(edges)
      .mul(ends)
      .mul(0.64);
  },
};
function airyBody(outer: boolean): VfxLayerLook {
  const density = (ctx: VfxParticleContext): Node<'float'> => {
    const sample = ctx.sampleTexture;
    if (!sample) throw new Error('Air funnel density textures are not bound.');
    const age = ctx.age.add(float(ctx.index).mod(2));
    const angle = ctx.uv.x
      .mul(Math.PI * 2)
      .sub(age.mul(Math.PI))
      .sub(ctx.uv.y.mul(8));
    // A circular sample stays within the image and closes the mesh seam without assuming tileability.
    const at = vec2(angle.cos(), angle.sin()).mul(0.32).add(0.5);
    const cloud = (sample('cloud', at) as Node<'vec4'>).x;
    const detail = (sample('detail', at.mul(0.8).add(ctx.uv.y.mul(0.12))) as Node<'vec4'>).x;
    return cloud.mul(0.75).add(detail.mul(0.25));
  };
  return {
    ...funnelSurface(false, 2, outer),
    textures: {
      cloud: { texture: vfxTexture('noise-cloud-contrasty-1'), colorSpace: 'linear' },
      detail: { texture: vfxTexture('noise-soft-alias-1'), colorSpace: 'linear' },
    },
    colorNode(ctx) {
      const d = density(ctx);
      return vec3(0.095, 0.13, 0.12).add(vec3(0.09, 0.11, 0.09).mul(d));
    },
    opacityNode(ctx) {
      const d = density(ctx);
      const ends = ctx.uv.y.smoothstep(0, 0.08).mul(ctx.uv.y.smoothstep(0.68, 1).oneMinus());
      return d
        .smoothstep(outer ? 0.43 : 0.26, 0.76)
        .mul(ends)
        .mul(normalView.z.abs().smoothstep(0.03, 0.4))
        .mul(outer ? 0.11 : 0.24);
    },
  };
}
export function createStorm(id: string, height = 3.2): VfxDefinition {
  if (!Number.isFinite(height) || height < 1 || height > 8)
    throw new Error('Storm height must be between 1 and 8 metres.');
  const scale = height / 3.2;
  return defineVfx({
    id,
    duration: windFunnelLOOP,
    seed: 71,
    loop: true,
    maxInstances: 4,
    build(fx) {
      const shell = {
        ...LOCAL_WIND,
        capacity: 2,
        bursts: [{ time: 0, count: 1 }],
        startLife: LIFE,
        startSpeed: 0,
        sizeOverLife: curve([0, 1], [1, 1]),
        opacityOverLife: FADE,
        coverage: 'red' as const,
        colorSource: 'tint' as const,
      };
      fx.particles({
        ...shell,
        startSize: 3.6 * scale,
        map: vfxTexture('solid'),
        coverage: 'alpha',
        look: groundWindLook(false),
        mode: 'horizontal',
        transform: { position: [0, 0.035 * scale, 0] },
        rotation: { enabled: false },
        orderInLayer: 0,
      });
      for (const outer of [false, true]) {
        fx.particles({
          ...shell,
          startSize: scale,
          map: vfxTexture('solid'),
          coverage: 'alpha',
          look: airyBody(outer),
          mesh: {
            geometry: funnelBodyGeometry(),
            side: 'double',
            scale: outer ? [1.12, 1, 1.12] : [1, 1, 1],
          },
          rotation: { enabled: false },
          emission: 0,
          orderInLayer: outer ? 2 : 1,
        });
      }
      for (let arm = 0; arm < 7; arm += 1) {
        fx.path({
          id: `air-swipe-${arm}`,
          maxSegments: 64,
          sample: (age) => airyWind(age, arm, scale),
          look: AIR_BAND,
          blend: 'alpha',
          orderInLayer: 5,
        });
      }
      fx.particles({
        ...LOCAL_WIND,
        capacity: 24,
        rateOverTime: 22,
        startLife: [0.8, 1.1],
        startSpeed: [1.5 * scale, 3 * scale],
        direction: [0, 1, 0],
        spread: 0.25,
        shape: { type: 'circle', radius: [0.3 * scale, 0.8 * scale], axis: [0, 1, 0] },
        drag: 1.2,
        startSize: [0.4 * scale, 0.8 * scale],
        sizeOverLife: curve([0, 0.3], [0.25, 1], [1, 1.2]),
        opacityOverLife: curve([0, 0], [0.15, 0.6], [0.6, 0.35], [1, 0]),
        orbit: { speed: 4.5, axis: [0, 1, 0], radialDrift: 0.28 },
        map: vfxTexture('smoke-irregular-wisp-7'),
        coverage: 'alpha',
        colorSource: 'tint',
        tint: [0.39, 0.36, 0.27, 0.42],
        emission: 0.65,
        rotation: { start: [-Math.PI, Math.PI] },
        orderInLayer: 3,
      });
      fx.particles({
        ...LOCAL_WIND,
        capacity: 12,
        rateOverTime: 12,
        startLife: [0.5, 0.9],
        startSpeed: [1.2 * scale, 2.2 * scale],
        direction: [0, 1, 0],
        spread: 0.2,
        shape: { type: 'circle', radius: [0.4 * scale, 1.1 * scale], axis: [0, 1, 0] },
        drag: 0.8,
        startSize: [0.02 * scale, 0.04 * scale],
        sizeOverLife: curve([0, 0.2], [0.15, 1], [1, 0]),
        opacityOverLife: curve([0, 0], [0.15, 0.8], [1, 0]),
        orbit: { speed: 5, axis: [0, 1, 0], radialDrift: 0.22 },
        map: vfxTexture('point-soft-4'),
        coverage: 'red',
        colorSource: 'tint',
        tint: [0.36, 0.42, 0.35, 0.55],
        emission: 0.6,
        aspect: 0.4,
        orderInLayer: 4,
      });
    },
  });
}
// Copy and prepare createGalleryTornado(uniqueId). Play at the ground contact with unit scale, local +Y upright; parent to an unscaled field anchor to move it.
// Game owns collision, pulling and damage. Fade params.intensity then stop({ immediate: true }); normal stop retains authored particle lives up to 8 seconds. No terrain projection or light is implied.
const DARK_LOOP = 8;
const HEIGHT = 3.2;
const windFunnelSEGMENTS = 64;
function funnel(age: number, arm: number): readonly VfxPairedPathSection[] {
  const phase = (age / DARK_LOOP) * Math.PI * 6;
  const sections: VfxPairedPathSection[] = [];
  for (let index = 0; index <= windFunnelSEGMENTS; index += 1) {
    const along = index / windFunnelSEGMENTS;
    const angle =
      Math.pow(along, 0.8) * Math.PI * 5.4 +
      phase +
      (arm * Math.PI * 2) / 3 +
      Math.sin(along * 17 + phase) * 0.28;
    const radius = 0.2 + Math.pow(along, 1.2) * 1.1 + Math.sin(angle * 2 + along * 20) * 0.035;
    const width = (0.28 + along * 0.55) * Math.sin(Math.PI * (0.04 + along * 0.92));
    const x = Math.cos(angle) * radius + Math.sin(along * 2.5 + phase) * along * 0.12;
    const z = Math.sin(angle) * radius;
    const y = 0.08 + along * HEIGHT;
    sections.push({ a: [x, y - width / 2, z], b: [x, y + width / 2, z], u: along, age });
  }
  return sections;
}
const WIND_LOOK: VfxLayerLook = {
  textures: {
    wind: { texture: vfxTexture('noise-soft-alias-1'), colorSpace: 'linear', wrap: 'repeat' },
  },
  colorNode: () => vec3(0.29, 0.31, 0.39),
  opacityNode(ctx) {
    const uv = ctx.uv as Node<'vec2'>;
    const clock = (ctx.age as Node<'float'>).mul((Math.PI * 2) / DARK_LOOP);
    const sample = ctx.sampleTexture;
    if (!sample) throw new Error('Funnel wind texture is not bound.');
    const drift = vec2(clock.sin(), clock.cos()).mul(0.15);
    const noise = (sample('wind', uv.mul(vec2(3, 1)).add(drift)) as Node<'vec4'>).x;
    const edge = uv.y.mul(Math.PI).sin().max(0).pow(0.7);
    const ends = uv.x.smoothstep(0, 0.12).mul(uv.x.smoothstep(0.65, 0.97).oneMinus());
    return edge.mul(ends).mul(noise.smoothstep(0.35, 0.75)).mul(0.22);
  },
};
const FUNNEL_BODY: VfxLayerLook = {
  textures: { billow: { texture: vfxTexture('smoke-textured-puff-7'), colorSpace: 'linear' } },
  colorNode: () => vec3(0.13, 0.145, 0.17),
  opacityNode(ctx) {
    const sample = ctx.sampleTexture;
    if (!sample) throw new Error('Funnel billow texture is not bound.');
    return (sample('billow', ctx.uv) as Node<'vec4'>).x
      .smoothstep(0.15, 0.85)
      .mul(ctx.uv.sub(0.5).length().smoothstep(0.22, 0.5).oneMinus())
      .mul(0.7);
  },
};
function funnelBodyGeometry(): {
  shading: 'smooth';
  positions: number[];
  uvs: number[];
  indices: number[];
} {
  const slices = 48;
  const rings = 32;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let row = 0; row <= rings; row += 1) {
    const along = row / rings;
    for (let column = 0; column <= slices; column += 1) {
      const angle = (column / slices) * Math.PI * 2;
      const radius = 0.2 + Math.pow(along, 1.2) * 1.1;
      const ripple = Math.sin(angle * 3 + along * 11) * 0.045;
      positions.push(
        Math.cos(angle) * (radius + ripple),
        0.08 + along * HEIGHT,
        Math.sin(angle) * (radius + ripple),
      );
      uvs.push(column / slices, along);
      if (row < rings && column < slices) {
        const start = row * (slices + 1) + column;
        indices.push(
          start,
          start + slices + 1,
          start + 1,
          start + 1,
          start + slices + 1,
          start + slices + 2,
        );
      }
    }
  }
  return { shading: 'smooth', positions, uvs, indices };
}
function groundWindLook(dark: boolean): VfxLayerLook {
  return {
    colorNode: () => (dark ? vec3(0.15, 0.14, 0.18) : vec3(0.17, 0.21, 0.18)),
    opacityNode(ctx) {
      const p = ctx.uv.sub(0.5).mul(2);
      const r = p.length();
      const angle = mx_atan2(p.y, p.x) as Node<'float'>;
      const phase = angle.mul(3).add(r.mul(4)).sub(ctx.age.mul(5));
      const grain = mx_noise_float(
        vec3(phase.cos().mul(3), phase.sin().mul(3), r.mul(6).sub(ctx.age)),
      )
        .mul(0.5)
        .add(0.5);
      return r
        .smoothstep(0.1, 0.35)
        .mul(r.smoothstep(0.55, 1).oneMinus())
        .mul(grain.smoothstep(0.28, 0.8))
        .mul(dark ? 0.28 : 0.14);
    },
  };
}
function funnelSurface(dark: boolean, period: number, outer = false): VfxLayerLook {
  const fields = (ctx: VfxParticleContext) => {
    const uv = ctx.uv;
    const clock = ctx.age
      .add(dark ? float(0) : float(ctx.index).mod(2))
      .mul((Math.PI * 2) / period);
    const angle = uv.x
      .mul(Math.PI * 2)
      .sub(clock)
      .sub(uv.y.mul(7));
    // Circular coordinates keep the UV seam closed; height advection carries billows upward.
    const rise = uv.y.mul(5).sub(clock);
    const p = vec3(
      angle.cos().mul(2).add(rise.sin().mul(0.7)),
      uv.y.mul(2),
      angle.sin().mul(2).add(rise.cos().mul(0.7)),
    );
    const broad = mx_noise_float(p).mul(0.5).add(0.5);
    const fine = mx_noise_float(p.mul(3.3).add(11)).mul(0.5).add(0.5);
    const bands = angle.mul(3).add(uv.y.mul(23)).add(broad.mul(4)).sin().mul(0.5).add(0.5);
    return { broad, density: broad.mul(0.6).add(fine.mul(0.2)).add(bands.mul(0.2)) };
  };
  return {
    positionNode(ctx) {
      const local = ctx.positionLocal as Node<'vec3'>;
      const uv = ctx.uv;
      const angle = uv.x.mul(Math.PI * 2);
      const clock = ctx.age
        .add(dark ? float(0) : float(ctx.index).mod(2))
        .mul((Math.PI * 2) / period);
      const billow = angle
        .mul(3)
        .add(uv.y.mul(15))
        .sub(clock.mul(2))
        .sin()
        .mul(0.09)
        .add(angle.mul(7).sub(uv.y.mul(9)).add(clock).sin().mul(0.035))
        .add(1);
      const lean = uv.y.pow(1.5).mul(uv.y.mul(3).add(clock).sin()).mul(0.24);
      return vec3(local.x.mul(billow).add(lean), local.y, local.z.mul(billow));
    },
    colorNode(ctx) {
      const { broad } = fields(ctx);
      const light = normalView.dot(vec3(-0.4, 0.65, 0.6).normalize()).max(0);
      return (dark ? vec3(0.018, 0.022, 0.03) : vec3(0.09, 0.13, 0.12)).add(
        (dark ? vec3(0.075, 0.085, 0.11) : vec3(0.1, 0.12, 0.1))
          .mul(broad)
          .mul(light.mul(0.6).add(0.4)),
      );
    },
    opacityNode(ctx) {
      const { broad, density } = fields(ctx);
      const uv = ctx.uv;
      const ends = uv.y
        .smoothstep(0, 0.08)
        .mul(uv.y.add(broad.mul(0.18)).smoothstep(0.68, 1.07).oneMinus());
      const edge = normalView.z.abs().smoothstep(0.02, 0.35);
      return density
        .smoothstep(outer ? 0.5 : dark ? 0.14 : 0.28, outer ? 0.8 : dark ? 0.56 : 0.76)
        .mul(ends)
        .mul(edge)
        .mul(dark ? 0.92 : outer ? 0.2 : 0.4);
    },
  };
}
/** Upright local +Y funnel; height is visual height, not a collision bound. */
export function createGalleryTornado(id: string): VfxDefinition {
  return defineVfx({
    id,
    duration: DARK_LOOP,
    seed: 7,
    loop: true,
    maxInstances: 4,
    params: { intensity: { default: 1, min: 0, max: 1 } },
    build(fx) {
      const intensity = fx.param('intensity') as Node<'float'>;
      const visibility = { opacityMultiplierNode: () => intensity };
      fx.particles({
        startLife: DARK_LOOP,
        startSize: 1,
        map: vfxTexture('solid'),
        colorSource: 'tint',
        mesh: { geometry: funnelBodyGeometry(), side: 'front' },
        opacityOverLife: [
          { t: 0, v: 1 },
          { t: 1, v: 1 },
        ],
        look: { ...funnelSurface(true, DARK_LOOP), ...visibility },
        rotation: { enabled: false },
        blend: 'alpha',
        orderInLayer: 8,
      });
      for (let arm = 0; arm < 3; arm += 1) {
        fx.path({
          id: `wind-${arm}`,
          maxSegments: windFunnelSEGMENTS,
          sample: (age) => funnel(age, arm),
          look: { ...WIND_LOOK, ...visibility },
          blend: 'alpha',
          orderInLayer: 10,
        });
      }
      fx.particles({
        capacity: 32,
        rateOverTime: 12,
        startLife: [1.8, 2.5],
        startSpeed: [1.1, 1.35],
        direction: [0, 1, 0],
        shape: { type: 'circle', radius: [0.12, 0.25] },
        orbit: { speed: 4.7, axis: [0, 1, 0], radialDrift: 0.32 },
        startSize: [0.35, 0.6],
        sizeOverLife: curve([0, 0.4], [0.7, 1.4], [1, 1.8]),
        opacityOverLife: curve([0, 0], [0.18, 0.6], [0.7, 0.5], [1, 0]),
        map: vfxTexture('smoke-textured-puff-7'),
        look: { ...FUNNEL_BODY, ...visibility },
        colorSource: 'tint',
        tint: [0.22, 0.24, 0.28, 0.65],
        emission: 0,
        blend: 'alpha',
        rotation: { start: RANDOM_YAW },
      });
      fx.particles({
        capacity: 18,
        rateOverTime: 7,
        startLife: [1.1, 1.7],
        startSpeed: [1.2, 1.9],
        direction: [0, 1, 0],
        shape: { type: 'circle', radius: [0.2, 0.35] },
        orbit: { speed: 4.7, axis: [0, 1, 0], radialDrift: 0.3 },
        startSize: [0.035, 0.075],
        sizeOverLife: curve([0, 0], [0.15, 1], [1, 0]),
        map: vfxTexture('solid'),
        mesh: { geometry: 'diamond', side: 'front', orient: 'random' },
        look: { ...visibility },
        colorSource: 'tint',
        tint: [0.3, 0.28, 0.25, 0.85],
        emission: 0,
        blend: 'alpha',
        rotation: { start: RANDOM_YAW },
      });
      fx.particles({
        startLife: DARK_LOOP,
        startSize: 2.5,
        mode: 'horizontal',
        map: vfxTexture('solid'),
        look: { ...groundWindLook(true), ...visibility },
        opacityOverLife: [
          { t: 0, v: 1 },
          { t: 1, v: 1 },
        ],
        colorSource: 'tint',
        tint: [0.3, 0.2, 0.65, 0.25],
        emission: 0,
        transform: { position: [0, 0.025, 0] },
        rotation: { enabled: false },
        blend: 'alpha',
      });
    },
  });
}

export default createVortex('example.ground-vortex');
