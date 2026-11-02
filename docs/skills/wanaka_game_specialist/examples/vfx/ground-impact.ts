// intent: Ground slams, configurable ground propagation and warned cinder eruptions.
// variants: createGroundSlam, createSeismicFront, createCinderWarning, createCinderEruption
// inputs: Committed ground attack pose; game owns warning/attack deadlines, propagation queries and cancellation.
// Copy dependencies: none.
// Setup in an async scene: const effect = createGroundSlam('example.ground-impact');
// const vfx = useVfx(context); await vfx.prepare(effect, {});
// const handle = vfx.play(effect, playOptions);
// Import useVfx from wanaka-studio-engine/vfx; construct playOptions from the recipe notes and real game inputs.
import { vfxPlaneClip } from 'wanaka-studio-engine/vfx';
import {
  float,
  vec3,
  mix,
  abs as tslAbs,
  exp as tslExp,
  fract as tslFract,
  floor as tslFloor,
  sin as tslSin,
  cos as tslCos,
  max as tslMax,
  min as tslMin,
  normalize as tslNormalize,
  oneMinus as tslOneMinus,
  smoothstep as tslSmoothstep,
  uv as tslUv,
  vec2 as tslVec2,
} from 'three/tsl';
import { type Node } from 'three/webgpu';
import {
  type VfxDefinition,
  type VfxParticleContext,
  curve,
  defineVfx,
  vfxTexture,
  GLOW_COL,
  MOTE_SIZE,
  secondsCurve,
  vfxMesh,
  type VfxLayerLook,
} from 'wanaka-studio-engine/vfx';
export const GROUND_AOE_RADIUS = 2;
function rockFragment() {
  const positions = [0.08, 0.48, -0.04, -0.12, -0.38, 0.06];
  const indices: number[] = [];
  for (let i = 0; i < 7; i++) {
    const angle = (i / 7) * Math.PI * 2;
    const radius = 0.4 + 0.1 * Math.sin(i * 2.3);
    positions.push(
      Math.cos(angle) * radius,
      Math.sin(i * 3.1) * 0.08,
      Math.sin(angle) * radius * 0.8,
    );
    const next = 2 + ((i + 1) % 7),
      current = 2 + i;
    indices.push(0, current, next, 1, next, current);
  }
  return { positions, indices };
}
const FRAGMENT = rockFragment();
function dustDensity(ctx: VfxParticleContext): Node<'float'> {
  const sample = ctx.sampleTexture;
  if (!sample) throw new Error('Ground dust density texture is not bound.');
  return (sample('density', ctx.uv) as Node<'vec4'>).x;
}
const DUST_LOOK: VfxLayerLook = {
  textures: { density: { texture: vfxTexture('smoke-textured-puff-7'), colorSpace: 'linear' } },
  colorNode: (ctx) =>
    mix(vec3(0.55, 0.48, 0.38), vec3(0.12, 0.095, 0.065), dustDensity(ctx).smoothstep(0.015, 0.25)),
  opacityNode: (ctx) => dustDensity(ctx).smoothstep(0.025, 0.28),
};
/** Creates the ground aoe composition; game code owns placement and events. */
// Copy this file. Play at a confirmed surface contact, with local +Y aligned to its normal. Use an unscaled world pose; GROUND_AOE_RADIUS is the visual pressure-ring radius, not an automatic damage query.
// Game code owns warning deadlines, impact timing, damage and surface selection. Cancelling a warning never triggers this effect.
// Optional surfaceNormal / surfaceDistance describe a unit world-space normal toward free space and dot(normal, contact). They fade fragment/dust centres behind that plane; zero normal disables clipping. No fixed floor, bounces or surrounding-geometry collision are authored.
// World-space fragments use world gravity. Immediate stop clears an interrupted impact; the scuff is a transient visual, not persistent terrain deformation.
export function createGroundSlam(id: string): VfxDefinition {
  return defineVfx({
    id,
    duration: 1.15,
    seed: 7,
    maxInstances: 4,
    params: { surfaceNormal: { default: [0, 0, 0] }, surfaceDistance: { default: 0 } },
    build(fx) {
      const clip = vfxPlaneClip(
        fx.param('surfaceNormal') as Node<'vec3'>,
        fx.param('surfaceDistance') as Node<'float'>,
        [-0.02, 0.04],
      );
      const debris = {
        direction: [0, 1, 0] as const,
        simulationSpace: 'world' as const,
        blend: 'alpha' as const,
        look: clip,
      };
      fx.particles({
        startLife: 0.28,
        startSize: GROUND_AOE_RADIUS * 2,
        startSpeed: 0,
        sizeOverLife: curve([0, 0.15], [0.4, 0.8], [1, 1]),
        opacityOverLife: curve([0, 0], [0.12, 1], [0.5, 0.5], [1, 0]),
        map: vfxTexture('solid'),
        mode: 'horizontal',
        blend: 'alpha',
        tint: [0.8, 0.65, 0.42, 0.55],
        emission: 0.4,
        rotation: { enabled: false },
        look: {
          textures: {
            noise: {
              texture: vfxTexture('noise-soft-alias-1'),
              colorSpace: 'linear',
              wrap: 'repeat',
            },
          },
          opacityNode: (ctx) => {
            const sample = ctx.sampleTexture;
            if (!sample) throw new Error('Ground impact noise texture is not bound.');
            const noise = (sample('noise', ctx.uv.mul(4)) as Node<'vec4'>).x;
            const d = ctx.uv.sub(0.5).length().mul(2).add(noise.sub(0.5).mul(0.06));
            return d
              .smoothstep(0.85, 0.91)
              .mul(d.smoothstep(0.96, 1).oneMinus())
              .mul(noise.smoothstep(0.15, 0.6));
          },
        },
        transform: { position: [0, 0.035, 0] },
        orderInLayer: 8,
      });
      fx.particles({
        ...debris,
        capacity: 12,
        startLife: [0.55, 0.85],
        startSpeed: [2.8, 4.8],
        spread: 0.9,
        shape: { type: 'sphere', radius: [0.1, 0.55] },
        startSize: [0.12, 0.24],
        sizeOverLife: curve([0, 0.8], [0.15, 1], [0.75, 1], [1, 0]),
        gravity: -9.8,
        drag: 0.3,
        mesh: { geometry: FRAGMENT, side: 'double' },
        map: vfxTexture('solid'),
        lit: true,
        roughness: 0.95,
        emission: 0,
        tint: [0.45, 0.4, 0.32, 1],
        rotation: { start: [-Math.PI, Math.PI], spin: [-8, 8] },
        transform: { position: [0, 0.12, 0] },
        orderInLayer: 18,
      });
      fx.particles({
        ...debris,
        capacity: 16,
        startLife: [0.55, 0.95],
        startSpeed: [0.8, 1.7],
        spread: 1.25,
        shape: { type: 'circle', radius: [0.2, 0.85], axis: [0, 1, 0] },
        startSize: [0.65, 1.05],
        sizeOverLife: curve([0, 0.3], [0.2, 0.9], [1, 1.8]),
        opacityOverLife: curve([0, 0], [0.12, 0.85], [0.55, 0.5], [1, 0]),
        map: vfxTexture('solid'),
        look: { ...DUST_LOOK, ...clip },
        colorSource: 'tint',
        tint: [1, 1, 1, 0.55],
        emission: 0,
        lit: true,
        drag: 1.8,
        noise: { strength: 0.15, frequency: 1.2 },
        rotation: { start: [-Math.PI, Math.PI], spin: [-0.3, 0.3] },
        transform: { position: [0, 0.15, 0] },
        orderInLayer: 12,
      });
      fx.particles({
        startLife: 1.1,
        startSize: GROUND_AOE_RADIUS * 1.4,
        startSpeed: 0,
        map: vfxTexture('crater-fine-white-impact-2'),
        colorSource: 'tint',
        tint: [0.12, 0.09, 0.06, 0.65],
        emission: 0,
        blend: 'alpha',
        mode: 'horizontal',
        sizeOverLife: curve([0, 0.7], [0.1, 1], [1, 1]),
        opacityOverLife: curve([0, 0], [0.08, 0.8], [0.5, 0.55], [1, 0]),
        rotation: { start: [-Math.PI, Math.PI] },
        transform: { position: [0, 0.02, 0] },
        orderInLayer: 5,
      });
      fx.flash({
        life: 0.1,
        size: 0.65,
        map: vfxTexture('flash-hard-star-2'),
        emission: 1.5,
        tint: [1, 0.85, 0.6, 0.8],
        transform: { position: [0, 0.15, 0] },
      });
      fx.light({
        life: 0.12,
        intensity: 3,
        range: 5,
        color: [1, 0.65, 0.35],
        curve: curve([0, 1], [0.2, 0.8], [1, 0]),
      });
    },
  });
}
const CRACK = 'crack-thin-network-1';
const RANGE = 6;
const SPEED = 10;
const WIDTH = RANGE * 0.8;
/** Default propagation dimensions in metres and speed in metres/second. */
export const seismicTravel = { range: RANGE, speed: SPEED, width: WIDTH } as const;
/** Configure a flat-ground travelling front; width is the full footprint width. */
export interface GroundPropagationOptions {
  readonly range?: number;
  readonly speed?: number;
  readonly width?: number;
  readonly shape?: 'fan' | 'line';
  readonly cracks?: boolean;
  readonly rocks?: boolean;
}
const ROCK_ALBEDO = 'rock-uv-color-1';
const ROCK_HEIGHT = 'rock-height-1';
const ROCK_NORMAL = 'rock-normal-1';
const COOL = [0.1, 0.035, 0.01] as const;
const HOT = [5, 1.3, 0.03] as const;
const CHIP_COUNT = 72;
const CHIP_LIFE = 2.4;
const CHIP_GRAVITY = 9.8;
const CHIP_MIN_UP = 1.1;
const CHIP_SPIN = 4;
const BANDS = 8;
const groundImpactSMOKE = 'smoke-irregular-wisp-7';
const GRIT = 'point-vortex-1';
const DUST_STRENGTH = 1.4;
interface SeismicPiece {
  readonly index: number;
  readonly x: number;
  readonly z: number;
  readonly scale: number;
  readonly velocity: readonly [number, number, number];
  readonly birth: number;
}
function hashUnit(index: number): number {
  const random = Math.sin(index * 127.1 + 13) * 43758.5453;
  return random - Math.floor(random);
}
function seismicPieces(
  range: number,
  speed: number,
  width: number,
  shape: 'fan' | 'line',
): readonly SeismicPiece[] {
  return Array.from({ length: CHIP_COUNT }, (_, index) => {
    const z =
      ((index + 0.5 + (index === 0 ? 0 : (hashUnit(index + 211) - 0.5) * 0.85)) / CHIP_COUNT) *
      range;
    const u = hashUnit(index);
    const halfWidth = width * 0.5 * (shape === 'fan' ? z / range : 1);
    const x = (u * 2 - 1) * halfWidth;
    const scale = 0.045 + hashUnit(index + 41) * 0.11;
    const upwardSpeed = 1.1 + hashUnit(index + 97) * 1.5;
    return {
      index,
      x,
      z,
      scale,
      velocity: [Math.sign(x) * 0.25, upwardSpeed, 0.3] as const,
      birth: z / speed,
    };
  });
}
const CHIP_SPIN_CURVE = secondsCurve(
  [0, CHIP_SPIN],
  [(2 * CHIP_MIN_UP) / CHIP_GRAVITY, CHIP_SPIN],
  [(2 * CHIP_MIN_UP) / CHIP_GRAVITY + 0.08, 0],
  [CHIP_LIFE, 0],
);
function lookSample(ctx: VfxParticleContext, name: string, at: Node): Node<'vec4'> {
  const sample = ctx.sampleTexture;
  if (sample === undefined) throw new Error(`VFX look texture "${name}" is not bound.`);
  return sample(name, at) as Node<'vec4'>;
}
function chipHash(index: Node<'float'>, salt: number): Node<'float'> {
  const scrambled = tslFract(index.add(salt).mul(0.1031));
  const folded = scrambled.mul(scrambled.add(33.33));
  return tslFract(folded.mul(folded.add(scrambled)));
}
/** Rock grain in mesh space, so a flat dodecahedron face is not one solid color. */
function triplanarSample(ctx: VfxParticleContext, name: string): Node<'vec4'> {
  const shift = chipHash(float(ctx.index as Node<'float'>), 17.2);
  const point = (ctx.positionLocal as Node<'vec3'>).mul(1.8).add(shift);
  const weight = tslAbs(tslNormalize(ctx.positionLocal as Node<'vec3'>));
  const sum = weight.x.add(weight.y).add(weight.z);
  const sampleX = lookSample(ctx, name, tslFract(tslVec2(point.y, point.z)));
  const sampleY = lookSample(ctx, name, tslFract(tslVec2(point.x, point.z)));
  const sampleZ = lookSample(ctx, name, tslFract(tslVec2(point.x, point.y)));
  return sampleX
    .mul(weight.x)
    .add(sampleY.mul(weight.y))
    .add(sampleZ.mul(weight.z))
    .div(sum) as Node<'vec4'>;
}
function rockLook(): VfxLayerLook {
  return {
    textures: {
      albedo: { texture: vfxTexture(ROCK_ALBEDO), colorSpace: 'srgb', wrap: 'repeat' },
      height: { texture: vfxTexture(ROCK_HEIGHT), colorSpace: 'linear', wrap: 'repeat' },
    },
    colorNode(ctx) {
      const index = float(ctx.index as Node<'float'>);
      const albedo = triplanarSample(ctx, 'albedo');
      const height = triplanarSample(ctx, 'height').x;
      const stain = mix(vec3(0.35, 0.3, 0.23), vec3(0.65, 0.5, 0.34), chipHash(index, 29.4));
      const shade = chipHash(index, 61.8).mul(0.3).add(0.65);
      const cavity = tslSmoothstep(float(0.12), float(0.72), height).mul(0.58).add(0.42);
      return albedo.xyz.mul(stain).mul(shade).mul(cavity);
    },
  };
}
const ROCK_LOOK = rockLook();
function rockMaterial(scale: readonly [number, number, number]) {
  return {
    look: ROCK_LOOK,
    normal: { texture: vfxTexture(ROCK_NORMAL), strength: 1.25 },
    roughness: 0.9,
    metalness: 0,
    lit: true as const,
    emission: 1,
    blend: 'alpha' as const,
    mesh: {
      geometry: vfxMesh('dodecahedron'),
      scale,
      side: 'front' as const,
      opaque: true,
    },
  };
}
function crackFront(
  ctx: VfxParticleContext,
  range: number,
  speed: number,
  width: number,
  shape: 'fan' | 'line',
  fractureSeed: Node<'float'>,
): {
  readonly heatAge: Node<'float'>;
  readonly mask: Node<'float'>;
} {
  const surface = tslUv();
  const clock = ctx.age as Node<'float'>;
  const travel = surface.y.mul(range);
  const heatAge = clock.sub(travel.div(speed));
  const across = surface.x.sub(0.5).mul(width);
  const reached = tslMin(clock.mul(speed), float(range));
  const fanEdge = shape === 'fan' ? travel.div(range).mul(width * 0.5) : float(width * 0.5);
  const feather = Math.min(0.12, width * 0.1);
  const fan = tslOneMinus(tslSmoothstep(fanEdge.sub(feather), fanEdge, tslAbs(across)));
  const front = tslSmoothstep(float(-0.12), float(0.06), reached.sub(travel));
  // Sample overlapping square patches in metres, preserving branch proportions on long footprints.
  // Each patch has a stable random rotation and offset so repeats do not form rows.
  const irregular = (coordinate: Node<'float'>): Node<'float'> => {
    const cell = tslFloor(coordinate);
    const fraction = tslFract(coordinate);
    const random = (at: Node<'float'>): Node<'float'> =>
      tslFract(tslSin(at.mul(127.1).add(19.7).add(fractureSeed.mul(17.31))).mul(43758.5453));
    return mix(random(cell), random(cell.add(1)), fraction).sub(0.5);
  };
  const centre = irregular(travel.mul(0.73).add(211))
    .mul(0.32)
    .add(irregular(travel.mul(2.7)).mul(0.25))
    .add(irregular(travel.mul(9.3).add(41)).mul(0.055));
  const lateral = surface.x.sub(0.5).sub(centre);
  const patchSpacing = 1.2;
  const patchSize = 2.4;
  const patchIndex = tslFloor(travel.div(patchSpacing));
  const samplePatch = (index: Node<'float'>): Node<'float'> => {
    const random = tslFract(
      tslSin(index.mul(127.1).add(37.4).add(fractureSeed.mul(23.17))).mul(43758.5453),
    );
    const angle = random.mul(6.283185);
    const secondary = tslFract(
      tslSin(index.mul(93.7).add(fractureSeed.mul(11.73)).add(71)).mul(23421.631),
    );
    const x = across.sub(random.sub(0.5).mul(width * 0.42));
    const z = travel.sub(index.mul(patchSpacing).add(secondary.sub(0.5).mul(0.36)));
    const cosine = tslCos(angle);
    const sine = tslSin(angle);
    const patchUv = tslVec2(x.mul(cosine).sub(z.mul(sine)), x.mul(sine).add(z.mul(cosine)))
      .div(secondary.mul(0.7).add(0.8).mul(patchSize))
      .add(0.5);
    const edge = tslMax(tslAbs(patchUv.x.sub(0.5)), tslAbs(patchUv.y.sub(0.5)));
    const weight = tslOneMinus(tslSmoothstep(float(0.36), float(0.49), edge));
    return lookSample(ctx, 'crack', patchUv.clamp(0.001, 0.999))
      .x.mul(weight)
      .mul(secondary.mul(0.65).add(0.35));
  };
  const branches = tslMax(samplePatch(patchIndex), samplePatch(patchIndex.add(1)));
  const fractureWidth = irregular(travel.mul(6.1).add(137)).add(0.5).mul(0.012).add(0.006);
  const spine = tslOneMinus(
    tslSmoothstep(fractureWidth, fractureWidth.add(0.009), tslAbs(lateral).mul(width)),
  );
  const reach = irregular(travel.mul(1.1).add(271)).add(0.5).mul(0.2).add(0.26);
  const branchEnvelope = tslOneMinus(tslSmoothstep(reach.mul(0.2), reach, tslAbs(lateral)));
  const mask = tslMax(spine, branches.mul(branchEnvelope).mul(0.8));
  const fade = tslOneMinus(tslSmoothstep(float(1.4), float(2.3), heatAge));
  return { heatAge, mask: mask.mul(fan).mul(front).mul(fade) };
}
function crackSurface(
  range: number,
  speed: number,
  width: number,
  shape: 'fan' | 'line',
  fractureSeed: Node<'float'>,
): VfxLayerLook {
  return {
    textures: { crack: { texture: vfxTexture(CRACK), colorSpace: 'linear' } },
    colorNode(ctx) {
      const { heatAge } = crackFront(ctx, range, speed, width, shape, fractureSeed);
      const heat = tslExp(tslMax(heatAge, float(0)).mul(-4));
      return mix(vec3(COOL[0], COOL[1], COOL[2]), vec3(HOT[0], HOT[1], HOT[2]), heat);
    },
    opacityNode(ctx) {
      return crackFront(ctx, range, speed, width, shape, fractureSeed).mask;
    },
  };
}
// Copy this file. Pass the same range, speed and width to this recipe and game-owned propagation queries.
// Windup defaults to zero; match any nonzero value to the game-owned attack windup.
// Local +Z is forward and local +Y is the flat receiving-plane normal. Place/rotate the play from actual contact data. Distances are metres and speed is metres/second; arrival at local z is windupSeconds + z / speed; this file does not apply damage or sample terrain.
/**
 * Returns a flat-ground propagation recipe; windupSeconds delays the entire release.
 * Options control metres, metres/second, footprint shape and independent crack/rock layers.
 * Example: createSeismicFront(id, 0, { range: 8, speed: 12, width: 1.5, shape: 'line', rocks: false }).
 * Pass params.fractureSeed (integer 0..1023) and a play seed once per cast for varied, stable patterns.
 * seismicTravel contains defaults only; use your supplied options for game-owned hit timing.
 */
export function createSeismicFront(
  id: string,
  windupSeconds = 0,
  options: GroundPropagationOptions = {},
): VfxDefinition {
  const {
    range = RANGE,
    speed = SPEED,
    width = WIDTH,
    shape = 'fan',
    cracks = true,
    rocks = true,
  } = options;
  for (const [name, value, maximum] of [
    ['range', range, 40],
    ['speed', speed, 60],
    ['width', width, 20],
  ] as const) {
    if (!Number.isFinite(value) || value < 0.1 || value > maximum)
      throw new Error(`Ground propagation ${name} must be between 0.1 and ${maximum}.`);
  }
  if (shape !== 'fan' && shape !== 'line')
    throw new Error('Ground propagation shape must be fan or line.');
  if (!Number.isFinite(windupSeconds) || windupSeconds < 0 || windupSeconds > 10)
    throw new Error('Seismic windup must be between 0 and 10 seconds.');
  const duration = windupSeconds + range / speed + CHIP_LIFE;
  return defineVfx({
    id,
    duration,
    seed: 131,
    params: { fractureSeed: { default: 0, min: 0, max: 1023, step: 1 } },
    maxInstances: 4,
    build(fx) {
      if (cracks)
        fx.particles({
          delay: windupSeconds,
          startLife: duration - windupSeconds,
          startSize: range,
          emission: 1,
          map: vfxTexture('solid'),
          look: crackSurface(range, speed, width, shape, fx.param('fractureSeed') as Node<'float'>),
          blend: 'alpha',
          mode: 'horizontal',
          aspect: width / range,
          orderInLayer: 15,
          transform: { position: [0, 0.018, range / 2] },
          rotation: { enabled: false },
        });
      if (rocks) {
        const pieces = seismicPieces(range, speed, width, shape);
        fx.particles({
          capacity: pieces.length,
          bursts: pieces.map((piece) => ({ time: windupSeconds + piece.birth, count: 1 })),
          startLife: CHIP_LIFE,
          samples: {
            points: pieces.map((piece) => [piece.x, piece.scale * 0.4, piece.z] as const),
            velocities: pieces.map((piece) => piece.velocity),
          },
          gravity: -CHIP_GRAVITY,
          collision: { bounce: 0, friction: 1, normal: [0, 1, 0], distance: 0, killOnHit: false },
          startSize: [0.045, 0.155],
          sizeOverLife: curve([0, 1], [1.6 / CHIP_LIFE, 1], [2.1 / CHIP_LIFE, 0], [1, 0]),
          ...rockMaterial([1, 0.6, 1.3]),
          simulationSpace: 'local',
          rotation: { start: [0, 7], overLife: CHIP_SPIN_CURVE },
        });
        const plateSites = pieces.filter((piece) => piece.index % 3 === 1);
        fx.particles({
          capacity: plateSites.length,
          bursts: plateSites.map((piece) => ({ time: windupSeconds + piece.birth, count: 1 })),
          startLife: 0.8,
          samples: {
            points: plateSites.map((piece) => [piece.x, -0.12, piece.z] as const),
          },
          velocityOverLife: {
            linear: [0, 1, 0],
            curve: curve(
              [0, 0],
              [0.125, 1.055],
              [0.25, 1.492],
              [0.375, 1.055],
              [0.5, 0],
              [0.625, -1.055],
              [0.75, -1.492],
              [0.875, -1.055],
              [1, 0],
            ),
          },
          startSize: [0.31, 0.45],
          ...rockMaterial([1, 0.17, 1.25]),
          simulationSpace: 'local',
        });
      }
      fx.flash({
        delay: windupSeconds,
        life: 0.12,
        size: 1.8,
        rotate: false,
        map: vfxTexture('flash'),
        emission: 4,
        tint: [1, 0.5, 0.05, 1],
        transform: { position: [0, 0.12, 0] },
      });
      fx.particles({
        capacity: 14,
        delay: windupSeconds,
        startLife: 0.4,
        startSpeed: [2, 4],
        direction: [0, 1, 0],
        spread: 0.35,
        gravity: -9.8,
        startSize: [0.025, 0.06],
        map: vfxTexture('spark'),
        mode: 'stretched',
        stretch: { speedFactor: 0, lengthFactor: 3 },
        emission: 3,
        tint: [1, 0.6, 0.04, 1],
        transform: { position: [0, 0.08, 0] },
      });
      fx.light({
        delay: windupSeconds,
        color: [1, 0.55, 0.08],
        intensity: 8,
        range: 3,
        life: 0.12,
        position: [0, 0.12, 0],
      });
      for (let index = 0; index < BANDS; index += 1) {
        const z = ((index + 0.15 + hashUnit(index + 301) * 0.7) / BANDS) * range;
        const delay = windupSeconds + z / speed;
        fx.burst({
          delay,
          count: 3,
          life: 0.7,
          speed: 0.7 * DUST_STRENGTH,
          direction: [0, 0.3, 1],
          spread: 0.55,
          size: [0.25 * DUST_STRENGTH, 0.5 * DUST_STRENGTH],
          sizeOverLife: curve([0, 0.5], [1, 2]),
          colorOverLife: GLOW_COL,
          map: vfxTexture(groundImpactSMOKE),
          blend: 'alpha',
          emission: 1,
          tint: [0.75, 0.6, 0.4, 0.6],
          transform: {
            position: [
              (hashUnit(index + 80) * 2 - 1) * width * 0.4 * (shape === 'fan' ? z / range : 1),
              0.08,
              z,
            ],
          },
        });
        fx.burst({
          delay,
          count: 5,
          life: 0.4,
          speed: 1.2 * DUST_STRENGTH,
          direction: [0, 0.7, 1],
          spread: 0.65,
          size: [0.012, 0.025],
          gravity: -5,
          dampen: false,
          map: vfxTexture(GRIT),
          blend: 'alpha',
          emission: 1,
          tint: [0.3, 0.22, 0.14, 0.8],
          transform: {
            position: [
              (hashUnit(index + 80) * 2 - 1) * width * 0.4 * (shape === 'fan' ? z / range : 1),
              0.06,
              z,
            ],
          },
        });
      }
    },
  });
}
const FIRE_COL = [
  { t: 0, rgba: [1, 0.25, 0, 1] as const },
  { t: 0.25, rgba: [1, 0.6666667, 0, 1] as const },
  { t: 0.5, rgba: [1, 0.50615257, 0, 1] as const },
  { t: 1, rgba: [1, 0.16666669, 0, 0.07843137] as const },
];
const CONTACT_SPACE = { simulationSpace: 'local' as const };
const ORIGINAL_WARMUP = 0.48;
const CRACK_LIFE = 4.6;
const CRACK_TAIL = CRACK_LIFE - ORIGINAL_WARMUP;
// Sample the original crack curve at the split so impact does not restart its fade-in.
const phase = (ORIGINAL_WARMUP / CRACK_LIFE - 0.1) / 0.2;
const CRACK_AT_IMPACT = [
  1,
  0.35 + (0.16 - 0.35) * phase,
  0.04 + (0.01 - 0.04) * phase,
  1 - 0.2 * phase,
] as const;
const CRACK_SURFACE = {
  ...CONTACT_SPACE,
  startSize: 4,
  map: vfxTexture('crack-thin-network-3'),
  blend: 'alpha',
  emission: 2.4,
  tint: [1, 0.18, 0.015, 1],
  colorSource: 'tint',
  mode: 'horizontal',
  orderInLayer: 15,
  transform: { position: [0, 0.025, 0] },
  rotation: { enabled: false },
} as const;
/** Returns a decorative warmup; the game separately decides whether and when to erupt. */
export function createCinderWarning(id: string, seconds = 0.48): VfxDefinition {
  if (!Number.isFinite(seconds) || seconds < 0.15 || seconds > 30)
    throw new Error('Cinder warning duration must be between 0.15 and 30 seconds.');
  return defineVfx({
    id,
    duration: seconds,
    maxInstances: 4,
    seed: 19,
    build(fx) {
      fx.particles({
        ...CRACK_SURFACE,
        startLife: seconds,
        sizeOverLife: curve([0, 0.65], [(0.1 * CRACK_LIFE) / ORIGINAL_WARMUP, 1], [1, 1]),
        colorOverLife: [
          { t: 0, rgba: [1, 0.12, 0.01, 0] },
          { t: (0.1 * CRACK_LIFE) / ORIGINAL_WARMUP, rgba: [1, 0.35, 0.04, 1] },
          { t: 1, rgba: CRACK_AT_IMPACT },
        ],
      });
    },
  });
}
/** Returns the approved eruption composition starting at impact, without an automatic warmup. */
// Copy this file. Prepare createCinderWarning(id, seconds) and createCinderEruption(id). Game code starts the warning, then plays the eruption at its own confirmed impact deadline. Cancelling a warning never triggers an eruption.
// Play unparented at a static horizontal contact with an unscaled pose, local +Y upright. Cinders and their bounce plane are effect-local (y=0), not world-floor or scene collision. These examples do not conform to slopes.
// Game code owns targets, damage and interruption. Stop the warning immediately on cancellation; stop the eruption immediately for a hard visual cut. The crack pattern is decorative and is not an exact danger boundary.
export function createCinderEruption(id: string): VfxDefinition {
  return defineVfx({
    id,
    duration: 4.8 - ORIGINAL_WARMUP,
    seed: 19,
    maxInstances: 4,
    build(fx) {
      fx.particles({
        ...CRACK_SURFACE,
        startLife: CRACK_TAIL,
        sizeOverLife: curve([0, 1], [1, 1]),
        colorOverLife: [
          { t: 0, rgba: CRACK_AT_IMPACT },
          { t: (0.3 * CRACK_LIFE - ORIGINAL_WARMUP) / CRACK_TAIL, rgba: [1, 0.16, 0.01, 0.8] },
          {
            t: (0.75 * CRACK_LIFE - ORIGINAL_WARMUP) / CRACK_TAIL,
            rgba: [0.25, 0.015, 0.002, 0.6],
          },
          { t: 1, rgba: [0.1, 0.005, 0, 0] },
        ],
      });
      fx.particles({
        ...CONTACT_SPACE,
        delay: 0,
        startLife: 1.1,
        startSize: 4.1,
        opacityOverLife: [
          { t: 0, v: 0 },
          { t: 0.025, v: 1 },
          { t: 0.82, v: 1 },
          { t: 1, v: 0 },
        ],
        map: vfxTexture('lava-animation-2'),
        blend: 'alpha',
        emission: 1.15,
        orderInLayer: 10,
        transform: { position: [0, 0.35, 0] },
        rotation: { enabled: false },
      });
      fx.particles({
        ...CONTACT_SPACE,
        delay: 0.01,
        startLife: 0.5,
        startSize: 5.8,
        sizeOverLife: curve([0, 0.15], [0.5, 0.8], [1, 1]),
        colorOverLife: GLOW_COL,
        map: vfxTexture('circle-animation-1'),
        blend: 'alpha',
        emission: 1,
        tint: [1, 0.43, 0.12, 0.55],
        mode: 'horizontal',
        orderInLayer: 15,
        transform: { position: [0, 0.035, 0] },
        rotation: { enabled: false },
      });
      fx.particles({
        ...CONTACT_SPACE,
        capacity: 22,
        delay: 0.02,
        startLife: [1.3, 2.1],
        startSpeed: [3.2, 6.2],
        direction: [0, 1, 0],
        spread: 1,
        startSize: [0.12, 0.32],
        sizeOverLife: curve([0, 1], [0.8, 1], [1, 0.1]),
        colorOverLife: [
          { t: 0, rgba: [1, 1, 1, 1] },
          { t: 0.6, rgba: [0.6, 0.45, 0.35, 1] },
          { t: 1, rgba: [0.22, 0.16, 0.12, 0] },
        ],
        shape: { type: 'cone', radius: 0.32, angle: 0.62 },
        gravity: -7,
        collision: { bounce: 0.14, friction: 0.4 },
        map: vfxTexture('stone-variant-debris-2'),
        blend: 'alpha',
        emission: 0.9,
        orderInLayer: 20,
        transform: { position: [0, 0.12, 0] },
        rotation: { spin: [-4, 4] },
      });
      fx.particles({
        ...CONTACT_SPACE,
        capacity: 40,
        rateOverTime: 36,
        duration: 0.65,
        delay: 0.04,
        startLife: [0.6, 1.5],
        startSpeed: [1.3, 3.2],
        direction: [0, 1, 0],
        spread: 0.65,
        shape: { type: 'box', size: [0.65, 0.1, 0.65] },
        gravity: -1.3,
        noise: { strength: 0.35, frequency: 0.7 },
        startSize: [0.025, 0.065],
        sizeOverLife: MOTE_SIZE,
        colorOverLife: FIRE_COL,
        map: vfxTexture('point-soft-4'),
        emission: 2.3,
        tint: [1, 0.3, 0.025, 1],
        orderInLayer: 10,
        transform: { position: [0, 0.2, 0] },
      });
      fx.particles({
        ...CONTACT_SPACE,
        delay: 0.22,
        startLife: 2.2,
        startSize: 4.8,
        opacityOverLife: [
          { t: 0, v: 0 },
          { t: 0.1, v: 0.7 },
          { t: 0.55, v: 0.6 },
          { t: 1, v: 0 },
        ],
        map: vfxTexture('ground-smoke-set-1-1'),
        blend: 'alpha',
        emission: 0.7,
        tint: [0.65, 0.52, 0.42, 0.65],
        orderInLayer: 10,
        transform: { position: [0, 0.55, 0] },
        rotation: { enabled: false },
      });
      fx.light({
        delay: 0,
        life: 0.75,
        intensity: 2.5,
        range: 6,
        color: [1, 0.25, 0.035],
      });
    },
  });
}
export default createGroundSlam('example.ground-impact');
