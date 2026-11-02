// intent: Contact dust variants, water step and dash trail.
// variants: createContactDust(id, options); createWaterStep(id); createDashTrace(id)
// inputs: actual grounded events/receiving plane; dash live movement history
// Copy dependencies: none.
// Event binding: playOptions: unparented actual foot-contact pose, local +Z behind the mover. Trigger on grounded foot contact; continuous dust and dash require their own live input contracts below.
// Setup in an async scene: const effect = createContactDust('game.footstep');
// const vfx = useVfx(context); await vfx.prepare(effect, {});
// const handle = vfx.play(effect, playOptions);
// Import useVfx (and createVfxPointSource when needed) from wanaka-studio-engine/vfx. Prepare once; construct playOptions from the game inputs above per event.
// Update the selected recipe's declared params from gameplay; await handle.finished for complete drain.
// Immediate cancellation: handle.stop({ immediate: true }). Persistent holds end on the game's state/event.
// Dash integration: visible history length is approximately speed * dashTailSeconds;
// tune using real motion and game camera, including turns and occlusion. Keep the root
// in the committed launch frame; feed final head and recording=false, then drain the tail.
// Increment breakSerial for teleport/network corrections, not ordinary speed changes.
// Check concurrent actors, cancellation and prepared capacity after changing the tail.
import { createVfxPositionHistory, type VfxPositionHistory } from 'wanaka-studio-engine/vfx';
import { dot, float, mix, normalView, vec2, vec3, viewportSize } from 'three/tsl';
import { type Node } from 'three/webgpu';
import {
  RANDOM_YAW,
  curve,
  defineVfx,
  sampleVfxRefraction,
  vfxTexture,
  type Vec3,
  type VfxDefinition,
  type VfxLayerLook,
  type VfxKitBuilder,
  type VfxPairedPathSection,
  type VfxParticleContext,
  type VfxPathSampleContext,
} from 'wanaka-studio-engine/vfx';

// Copy this file once. Footstep, jump and light landing share light burst dust; do not create separate recipes for those events.
// Heavy is radial; directional points along local +Z behind the mover. Continuous emission follows a game-owned foot-level point source and stops on idle/airborne/slide end. Burst contacts play unparented at the confirmed pose.
// Local +Y is the receiving normal. Set the actual normalized world surfaceNormal and dot(normal, contact) as surfaceDistance for clipping. The default clips to world Y=0; update both parameters for slopes or moving contact planes. Clipping hides particles behind the plane; it does not simulate collision or bounce. Gravity remains world-down.
const CONTACT_PLANE_PARAMS = {
  surfaceNormal: { default: [0, 1, 0] as Vec3 },
  surfaceDistance: { default: 0 },
};
function contactClip(fx: VfxKitBuilder): VfxLayerLook {
  const normal = fx.param('surfaceNormal') as Node<'vec3'>,
    distance = fx.param('surfaceDistance') as Node<'float'>;
  return {
    opacityMultiplierNode: (ctx) =>
      dot(ctx.position, normal).sub(distance).greaterThanEqual(0).select(1, 0),
  };
}
const DUST = vfxTexture('smoke-textured-puff-7');
function readDensity(ctx: VfxParticleContext, key: string, uv = ctx.uv): Node<'vec4'> {
  const texel = ctx.sampleTexture?.(key, uv) as Node<'vec4'> | undefined;
  if (!texel) throw new Error('Contact density texture is missing.');
  return texel;
}
const DUST_LOOK: VfxLayerLook = {
  textures: { density: { texture: DUST, colorSpace: 'linear' } },
  colorNode: (ctx) => vec3(0.24, 0.19, 0.13).mul(readDensity(ctx, 'density').r.mul(-0.28).add(1)),
  opacityNode: (ctx) => readDensity(ctx, 'density').r.smoothstep(0.035, 0.38),
};
const DUST_FADE = curve([0, 0], [0.08, 1], [0.35, 0.75], [1, 0]);
export function createContactDust(
  id: string,
  options: { shape?: 'light' | 'heavy' | 'directional'; emission?: 'burst' | 'continuous' } = {},
): VfxDefinition {
  const shape = options.shape ?? 'light',
    continuous = (options.emission ?? 'burst') === 'continuous';
  if (
    !['light', 'heavy', 'directional'].includes(shape) ||
    !['burst', 'continuous'].includes(options.emission ?? 'burst')
  )
    throw new Error('Contact dust requires a supported shape and emission mode.');
  const heavy = shape === 'heavy',
    directional = shape === 'directional';
  const mass = heavy ? 1 : directional ? 0.65 : 0.3;
  return defineVfx({
    id,
    duration: 1.25,
    loop: continuous,
    maxInstances: continuous ? 4 : 12,
    seed: 37,
    params: CONTACT_PLANE_PARAMS,
    build(fx) {
      const clip = contactClip(fx);
      for (const ground of [true, false]) {
        const count = Math.max(2, Math.round((ground ? 7 : 5) * mass));
        fx.particles({
          capacity: continuous ? count * 4 : count,
          ...(continuous ? { rateOverTime: count * 3, bursts: [] } : {}),
          delay: ground ? 0 : 0.035,
          startLife: [0.45, 0.95],
          startSize: [mass * 0.65, mass * 1.1],
          startSpeed: [mass * (ground ? 1.5 : 0.65), mass * (ground ? 2.4 : 1.1)],
          direction: heavy ? undefined : [0, 0.16, 1],
          radial: heavy ? 'outward' : undefined,
          spread: heavy ? (ground ? 0 : 0.16) : directional ? 0.25 : 0.65,
          shape: { type: 'circle', radius: [0.025, mass * 0.18] },
          transform: { position: [0, ground ? 0.028 : mass * 0.2, 0] },
          mode: ground ? 'horizontal' : 'billboard',
          soft: 0.12,
          map: ground ? DUST : vfxTexture('smoke-body-animation-1'),
          flipbook: ground ? undefined : { columns: 8, rows: 8, loop: false, mix: true },
          coverage: ground ? 'red' : 'alpha',
          textureColorSpace: 'linear',
          colorSource: ground ? 'tint' : 'texture',
          tint: [0.7, 0.52, 0.33, ground ? 0.28 : 0.5],
          lit: true,
          emission: ground ? 0.04 : 1.4,
          blend: 'alpha',
          simulationSpace: 'world',
          drag: ground ? 2.8 : 1.7,
          sizeOverLife: curve([0, 0.35], [0.2, 1], [1, ground ? 1.75 : 1.3]),
          opacityOverLife: DUST_FADE,
          rotation: { start: RANDOM_YAW },
          look: { ...(ground ? DUST_LOOK : {}), ...clip },
        });
      }
      const grit = heavy ? 18 : 8;
      fx.particles({
        capacity: continuous ? grit * 2 : grit,
        ...(continuous ? { rateOverTime: grit * 2, bursts: [] } : {}),
        startLife: [0.2, 0.5],
        startSpeed: heavy ? [1.5, 3] : [0.6, 1.4],
        direction: directional ? [0, 0.25, 1] : [0, 0.6, 0],
        spread: directional ? 0.35 : 1.2,
        transform: { position: [0, 0.035, 0] },
        startSize: heavy ? [0.015, 0.035] : [0.008, 0.02],
        gravity: -9.8,
        simulationSpace: 'world',
        drag: 1,
        mesh: { geometry: 'diamond', roughness: 0.95 },
        lit: true,
        map: vfxTexture('solid'),
        tint: [0.22, 0.15, 0.075, 1],
        emission: 0,
        blend: 'alpha',
        opacityOverLife: curve([0, 1], [0.55, 1], [1, 0]),
        sizeOverLife: curve([0, 1], [0.7, 0.8], [1, 0]),
        look: clip,
      });
    },
  });
}
function waterStepSheet(): {
  positions: number[];
  uvs: number[];
  indices: number[];
} {
  const positions: number[] = [],
    uvs: number[] = [],
    indices: number[] = [];
  const segments = 96,
    rows = 4;
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const lip = 0.11 + 0.045 * Math.sin(angle * 5 + 0.4) + 0.028 * Math.cos(angle * 9);
    for (let j = 0; j <= rows; j++) {
      const t = j / rows,
        radius = 0.075 + t * (0.14 + 0.018 * Math.sin(angle * 7));
      positions.push(Math.cos(angle) * radius, t * lip, Math.sin(angle) * radius * 1.2);
      uvs.push(i / segments, t);
      if (i < segments && j < rows) {
        const a = i * (rows + 1) + j,
          b = a + rows + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }
  return { positions, uvs, indices };
}
/** Local +Y is the flat receiving normal; +Z points backward along the movement tangent. */
export function createWaterStep(id: string): VfxDefinition {
  return defineVfx({
    id,
    duration: 1.1,
    loop: false,
    maxInstances: 16,
    seed: 37,
    params: CONTACT_PLANE_PARAMS,
    build(fx) {
      const clip = contactClip(fx);
      fx.particles({
        startLife: 0.32,
        startSize: 1,
        startSpeed: 0,
        mesh: {
          geometry: waterStepSheet(),
          side: 'double',
          roughness: 0.12,
          scaleOverLife: {
            x: curve([0, 0.65], [0.35, 1], [1, 1.8]),
            y: curve([0, 0.05], [0.25, 1], [0.6, 0.65], [1, 0.04]),
            z: curve([0, 0.65], [0.35, 1], [1, 1.8]),
          },
        },
        transform: { position: [0, 0.008, 0] },
        rotation: { enabled: false },
        lit: true,
        blend: 'alpha',
        tint: [0.5, 0.72, 0.8, 0.75],
        opacityOverLife: curve([0, 0], [0.1, 1], [0.65, 0.7], [1, 0]),
        look: {
          textures: {
            liquid: { texture: vfxTexture('water-splash-animation-2'), colorSpace: 'linear' },
          },
          backdropNode: (ctx) =>
            mix(
              sampleVfxRefraction(normalView.xy.div(viewportSize).mul(1.5)).mul(
                vec3(0.62, 0.86, 0.94),
              ),
              vec3(0.65, 0.85, 0.92),
              ctx.uv.y.smoothstep(0.7, 0.98).mul(0.7),
            ),
          opacityNode: (ctx) => {
            const frame = ctx.progress.mul(49).min(48).floor();
            const uv = vec2(ctx.uv.x.mul(2).fract(), ctx.uv.y.mul(0.8).add(0.1))
              .add(vec2(frame.mod(7), float(6).sub(frame.div(7).floor())))
              .div(7);
            const density = readDensity(ctx, 'liquid', uv);
            return density.r
              .smoothstep(0.008, 0.25)
              .mul(0.65)
              .add(0.12)
              .mul(ctx.uv.y.smoothstep(0, 0.1))
              .mul(ctx.uv.y.smoothstep(0.85, 1).oneMinus());
          },
        },
      });
      for (const delay of [0, 0.08])
        fx.particles({
          startLife: 0.65,
          startSize: 0.7,
          delay,
          mesh: {
            geometry: {
              positions: [-0.5, 0, -0.5, 0.5, 0, -0.5, 0.5, 0, 0.5, -0.5, 0, 0.5],
              uvs: [0, 0, 1, 0, 1, 1, 0, 1],
              indices: [0, 2, 1, 0, 3, 2],
            },
            side: 'double',
          },
          transform: { position: [0, 0.008, 0] },
          rotation: { enabled: false },
          blend: 'alpha',
          sizeOverLife: curve([0, 0.2], [1, 1.7]),
          opacityOverLife: curve([0, 0], [0.08, 0.45], [1, 0]),
          look: {
            textures: {
              ripple: { texture: vfxTexture('noise-soft-alias-1'), colorSpace: 'linear' },
            },
            colorNode: () => vec3(0.3, 0.52, 0.6),
            opacityNode: (ctx) => {
              const density = readDensity(ctx, 'ripple', ctx.uv.mul(3).fract());
              return ctx.uv
                .sub(0.5)
                .length()
                .mul(2)
                .sub(0.87)
                .add(density.r.sub(0.5).mul(0.022))
                .abs()
                .smoothstep(0.012, 0.05)
                .oneMinus()
                .mul(density.r.mul(0.7).add(0.3));
            },
          },
        });
      fx.particles({
        capacity: 18,
        startLife: [0.16, 0.38],
        startSpeed: [0.7, 1.5],
        startSize: [0.012, 0.025],
        direction: [0, 1, 0],
        spread: 1.1,
        shape: { type: 'circle', radius: [0.03, 0.1] },
        gravity: -9.8,
        simulationSpace: 'world',
        drag: 0.4,
        tint: [0.58, 0.78, 0.86, 0.8],
        map: vfxTexture('trail-soft-droplet-1'),
        coverage: 'red',
        colorSource: 'tint',
        mode: 'stretched',
        stretch: { speedFactor: 0, lengthFactor: 3 },
        sizeOverLife: curve([0, 1], [0.65, 0.7], [1, 0]),
        look: clip,
      });
    },
  });
}

const NOISE_MAP = 'noise-soft-alias-1';
const WIDTH = 0.7;
export const dashTailSeconds = 0.32;
const LIMIT = 64;
/** One bounded history per playback context; pooled replay and simultaneous actors never share stamps. */
export function createDashSampler(
  motionSeconds: number,
  preview = false,
): (age: number, context?: VfxPathSampleContext) => readonly VfxPairedPathSection[] {
  const histories = new WeakMap<VfxPathSampleContext, VfxPositionHistory>();
  return (age, context) => {
    if (!context) throw new Error('Dash trail needs its playback parameter context.');
    let history = histories.get(context);
    if (!history) {
      history = createVfxPositionHistory({ lifetime: dashTailSeconds, maxSamples: LIMIT, minDistance: 0.025 });
      histories.set(context, history);
    }
    const progress = Math.min(1, age / motionSeconds);
    const head = preview ? [progress * 6, 0, Math.sin(progress * Math.PI) * 1.4] : context.param('head');
    if (!Array.isArray(head) || head.length !== 3 || !head.every(Number.isFinite))
      throw new Error('Dash head must be a finite local 3D point.');
    const [x, y, z] = head;
    if (x === undefined || y === undefined || z === undefined) throw new Error('Dash head coordinates are missing.');
    const serial = context.param('breakSerial');
    const stamps = history.sample(age, [x, y, z], context.param('recording') === true && age <= motionSeconds, typeof serial === 'number' ? serial : 0);
    return stamps.map((stamp, index, stamps) => {
      const previous = stamp.connected ? stamps[index - 1] : undefined;
      const next = stamps[index + 1]?.connected ? stamps[index + 1] : undefined;
      const from = previous?.position ?? stamp.position,
        to = next?.position ?? stamp.position;
      const dx = to[0] - from[0],
        dz = to[2] - from[2],
        length = Math.hypot(dx, dz);
      const progress = Math.max(0, (age - stamp.time) / dashTailSeconds);
      const taper = Math.sin(Math.PI * Math.min(1, progress + 0.06));
      const half = length > 0 ? (WIDTH * 0.5 * taper) / length : 0;
      const x = -dz * half,
        z = dx * half,
        p = stamp.position;
      return {
        a: [p[0] - x, p[1] + 0.035, p[2] - z],
        b: [p[0] + x, p[1] + 0.035, p[2] + z],
        u: stamp.distance * 1.5,
        distance: age,
        age: progress,
        connected: index > 0 && stamp.connected,
      };
    });
  };
}
function sampleNoise(ctx: VfxParticleContext, at: Node<'vec2'>): Node<'float'> {
  return (
    (() => {
      const bind = ctx.sampleTexture;
      if (bind === undefined) throw new Error('VFX look texture is not bound.');
      return bind;
    })()('noise', at) as Node<'vec4'>
  ).x;
}
function noiseField(ctx: VfxParticleContext): {
  readonly fade: Node<'float'>;
  readonly shape: Node<'float'>;
  readonly offset: Node<'vec2'>;
} {
  const fade = (ctx.progress as Node<'float'>).smoothstep(0, 1).oneMinus();
  const clock = ctx.pathDistance as Node<'float'>;
  const flow = (ctx.uv as Node<'vec2'>)
    .mul(vec2(0.45, 5))
    .add(vec2(clock.mul(-0.7), clock.mul(0.12)));
  const broad = sampleNoise(ctx, flow.fract());
  const detail = sampleNoise(ctx, flow.mul(vec2(2.4, 0.65)).add(vec2(0.31, 0.67)).fract());
  const shape = broad.mul(0.65).add(detail.mul(0.35)).smoothstep(0.25, 0.7);
  const offset = vec2(broad.sub(0.5), detail.sub(0.5)).div(viewportSize).mul(float(3).mul(fade));
  return { fade, shape, offset };
}
function trailLook(): VfxLayerLook {
  return {
    textures: {
      noise: { texture: vfxTexture(NOISE_MAP), colorSpace: 'linear' },
    },
    colorNode: () => vec3(0, 0, 0),
    opacityNode(ctx) {
      const across = (ctx.uv as Node<'vec2'>).y;
      const edge = across.smoothstep(0, 0.2).mul(across.smoothstep(0.8, 1).oneMinus());
      const field = noiseField(ctx);
      return edge.mul(field.fade).mul(field.shape);
    },
    backdropNode(ctx) {
      const field = noiseField(ctx);
      return sampleVfxRefraction(field.offset).add(vec3(0.015, 0.24, 0.42).mul(field.shape));
    },
  };
}
// Copy this file. Prepare createDashTrace(id, maximumDashSeconds). Play at the actor's starting foot point, unparented and without source.
// Increment breakSerial after a teleport or network correction to disconnect the history.
// Each frame, setParam('head', currentFootMinusStart) in that fixed local frame. SetParam('recording', false) on collision or dash end; let the finite tail drain. Immediate stop cancels all visuals.
// Game code owns movement, collision and damage. Do not move the effect root with the actor. createDashTrace(id, motionSeconds, true) previews a curved route; leave preview=false for live history.
export function createDashTrace(id: string, motionSeconds = 0.65, preview = false): VfxDefinition {
  if (!Number.isFinite(motionSeconds) || motionSeconds < 0.05 || motionSeconds > 3)
    throw new Error('Dash motion duration must be between 0.05 and 3 seconds.');
  const sample = createDashSampler(motionSeconds, preview);
  return defineVfx({
    id,
    duration: motionSeconds + dashTailSeconds,
    seed: 7,
    maxInstances: 4,
    params: { head: { default: [0, 0, 0] }, recording: { default: true }, breakSerial: { default: 0 } },
    build(fx) {
      fx.path({
        id: 'dash-ribbon',
        maxSegments: LIMIT,
        sample,
        look: trailLook(),
        blend: 'alpha',
        orderInLayer: 36,
      });
      fx.flash({
        life: 0.07,
        size: 0.8,
        tint: [0.65, 0.9, 1, 0.8],
        emission: 1.3,
        map: vfxTexture('flash'),
        transform: { position: [0, 0.35, 0] },
      });
      fx.burst({
        count: 5,
        life: [0.18, 0.35],
        speed: [0.2, 0.6],
        size: [0.15, 0.28],
        direction: [0, 1, 0],
        spread: 0.8,
        tint: [0.3, 0.4, 0.44, 0.25],
        blend: 'alpha',
        map: vfxTexture('smoke'),
        transform: { position: [0, 0.06, 0] },
      });
    },
  });
}

export default createContactDust('example.contact-dust');
