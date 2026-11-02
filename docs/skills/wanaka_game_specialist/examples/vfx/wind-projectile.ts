// intent: Authored travelling wind attacks and independently confirmed ground impacts.
// variants: createSteelTempestTravel and createSteelTempestImpact; createSteelTempestPreview is staged only.
// inputs: Fixed ground cast pose (+X forward, +Y up); play impact at a confirmed horizontal ground contact.
// Copy dependencies: none.
// Setup in an async scene: const effect = createSteelTempestTravel('example.wind-projectile');
// const vfx = useVfx(context); await vfx.prepare(effect, {});
// const handle = vfx.play(effect, playOptions);
// Import useVfx from wanaka-studio-engine/vfx; supply game-owned motion and confirmed events.
import { float,mix,vec2,vec3 } from 'three/tsl';
import { type Node } from 'three/webgpu';
import { curve,defineVfx,sampleVfxLookTexture as texture,vfxTexture,type Vec3,type VfxDefinition,type VfxKitBuilder,type VfxLayerLook,type VfxPairedPathSection,type VfxParticleContext } from 'wanaka-studio-engine/vfx';

const DURATION = 2.1;
const START = 0.32;
const FLIGHT = 0.82;
const ARRIVAL = START + FLIGHT;
const RELEASE = 0.18;
const BODY_LIFE = FLIGHT + RELEASE;
const ORIGIN = 0;
const TARGET = 6.7;
const DISTANCE = TARGET - ORIGIN;
const STEPS = 48;
const SURFACE_RINGS = 12;
const FLOW_HEIGHT = 0.75;
const AXIAL_SCALE = 0.95;
const RADIAL_SCALE = 0.85;
const CROPS = [
  [32, 32, 512, 512],
  [528, 7, 1024, 506],
  [24, 560, 480, 1024],
  [576, 576, 1024, 976],
] as const;
function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
function center(age: number): number {
  return ORIGIN + clamp01((age - START) / FLIGHT) * DISTANCE;
}
function presence(age: number): number {
  return Math.max(0, Math.min(1, (age - START) / 0.075, (ARRIVAL + RELEASE - age) / RELEASE));
}

/** Places the authored cross-sections in the forward flow frame. */
function flowFrame(point: Vec3, travel = 0): Vec3 {
  return [
    travel + point[1] * AXIAL_SCALE,
    FLOW_HEIGHT - point[0] * RADIAL_SCALE,
    point[2] * RADIAL_SCALE,
  ];
}
/** One billowing envelope shared by the body mesh and its surface wisps. */
function flowSurface(t: number, angle: number, age = 0): Vec3 {
  const along = clamp01(t);
  const swell = 0.9 + Math.sin(along * Math.PI * 3) * 0.1;
  const radius =
    (0.18 + along * 0.6) *
    swell *
    (1 +
      Math.sin(angle * 3 + along * 7 - age * 4) * 0.17 +
      Math.cos(angle * 5 - along * 9 + age * 3) * 0.08);
  return [Math.cos(angle) * radius - along * 0.25, (along - 0.5) * 1.95, Math.sin(angle) * radius];
}
function windStrands(age: number): readonly VfxPairedPathSection[] {
  const shown = presence(age);
  if (shown <= 0) return [];
  const sections: VfxPairedPathSection[] = [];
  const travel = center(age);
  for (let arm = 0; arm < 3; arm += 1) {
    let previousGap = false;
    for (let i = 0; i <= STEPS; i += 1) {
      const t = i / STEPS;
      const gap = (t > 0.26 + arm * 0.025 && t < 0.32 + arm * 0.025) || (t > 0.65 && t < 0.7);
      const angle = (arm * Math.PI * 2) / 3 + t * Math.PI * 2.1 - age * 10.5;
      const breadth = arm === 0 ? 0.045 : arm === 1 ? 0.028 : 0.014;
      const width =
        breadth *
        Math.sin(Math.PI * t) *
        shown *
        (0.65 + Math.sin(t * 11 - age * 8 + arm) ** 2 * 0.35);
      const point = flowSurface(t, angle, age);
      const before = flowSurface(t - 0.001, angle - Math.PI * 2.1 * 0.001, age);
      const after = flowSurface(t + 0.001, angle + Math.PI * 2.1 * 0.001, age);
      const tx = after[0] - before[0],
        ty = after[1] - before[1],
        tz = after[2] - before[2];
      const nx = Math.cos(angle),
        nz = Math.sin(angle);
      const wx = -nz * ty,
        wy = nz * tx - nx * tz,
        wz = nx * ty;
      const scale = width / Math.hypot(wx, wy, wz);
      sections.push({
        a: flowFrame([point[0] - wx * scale, point[1] - wy * scale, point[2] - wz * scale], travel),
        b: flowFrame([point[0] + wx * scale, point[1] + wy * scale, point[2] + wz * scale], travel),
        u: t,
        age: 1 - shown,
        ...(i === 0 || gap || previousGap ? { connected: false } : {}),
      });
      previousGap = gap;
    }
  }
  return sections;
}
function groundWake(age: number): readonly VfxPairedPathSection[] {
  if (age < START || age > ARRIVAL + 0.22) return [];
  const sections: VfxPairedPathSection[] = [];
  for (let i = 0; i <= 20; i += 1) {
    const t = i / 20;
    const past = age - (1 - t) * 0.22;
    if (past < START || past > ARRIVAL) continue;
    const width = (0.06 + (1 - t) * 0.2) * presence(past);
    sections.push({
      a: [center(past), 0.045, -width],
      b: [center(past), 0.045, width],
      u: t,
      age: 1 - t,
    });
  }
  return sections;
}
function arrivalGust(age: number, at = ARRIVAL, target = TARGET): readonly VfxPairedPathSection[] {
  const t = (age - at) / 0.4;
  if (t <= 0 || t >= 1) return [];
  const sections: VfxPairedPathSection[] = [];
  const radius = 0.3 + Math.sqrt(t) * 1.3;
  const width = (1 - t) * 0.065;
  let previousGap = false;
  for (let i = 0; i <= STEPS; i += 1) {
    const angle = (i / STEPS) * Math.PI * 2 + t * 0.8;
    const gap = i % 16 > 11;
    const r = radius + Math.sin(angle * 5) * 0.035;
    sections.push({
      a: [target + Math.cos(angle) * (r - width), 0.045, Math.sin(angle) * (r - width)],
      b: [target + Math.cos(angle) * (r + width), 0.045, Math.sin(angle) * (r + width)],
      u: i / STEPS,
      age: t,
      ...(i === 0 || gap || previousGap ? { connected: false } : {}),
    });
    previousGap = gap;
  }
  return sections;
}
const STRIP_LOOK: VfxLayerLook = {
  colorNode: (ctx) =>
    mix(
      vec3(0.035, 0.19, 0.27),
      vec3(0.5, 0.98, 1.1),
      (ctx.uv as Node<'vec2'>).y.mul(Math.PI).sin().max(0).pow(8),
    ),
  opacityNode(ctx) {
    const v = (ctx.uv as Node<'vec2'>).y;
    const edge = v.smoothstep(0, 0.18).mul(v.smoothstep(0.82, 1).oneMinus());
    return edge.mul(float(1).sub(ctx.progress as Node<'float'>)).mul(0.65);
  },
};
function windDensity(ctx: VfxParticleContext): Node<'float'> {
  const uv = ctx.uv as Node<'vec2'>;
  const at = uv
    .mul(vec2(3, 0.7))
    .add(vec2((ctx.age as Node<'float'>).mul(-0.6), 0))
    .fract();
  return texture(ctx, 'noise', at).x;
}
const WIND_LOOK: VfxLayerLook = {
  textures: { noise: { texture: vfxTexture('noise-soft-alias-1'), colorSpace: 'linear' } },
  colorNode(ctx) {
    const density = windDensity(ctx);
    return mix(vec3(0.12, 0.25, 0.29), vec3(0.65, 0.79, 0.8), density.smoothstep(0.25, 0.75));
  },
  opacityNode(ctx) {
    const uv = ctx.uv as Node<'vec2'>;
    const density = windDensity(ctx);
    const rim = density.sub(0.5).mul(0.2);
    const edge = uv.y.add(rim).smoothstep(0, 0.2).mul(uv.y.sub(rim).smoothstep(0.65, 1).oneMinus());
    const ends = uv.x.smoothstep(0, 0.08).mul(uv.x.smoothstep(0.9, 1).oneMinus());
    return edge
      .mul(ends)
      .mul(density.smoothstep(0.15, 0.65))
      .mul(float(1).sub(ctx.progress as Node<'float'>))
      .mul(0.85);
  },
};
function funnel(): {
  readonly positions: number[];
  readonly uvs: number[];
  readonly indices: number[];
  readonly shading: 'smooth';
} {
  const positions: number[] = [],
    uvs: number[] = [],
    indices: number[] = [];
  for (let y = 0; y <= SURFACE_RINGS; y += 1) {
    const t = y / SURFACE_RINGS;
    for (let i = 0; i <= STEPS; i += 1) {
      const angle = (i / STEPS) * Math.PI * 2;
      const point = flowFrame(flowSurface(t, angle));
      positions.push(point[0], point[1] - FLOW_HEIGHT, point[2]);
      uvs.push(i / STEPS, t);
    }
  }
  for (let y = 0; y < SURFACE_RINGS; y += 1)
    for (let i = 0; i < STEPS; i += 1) {
      const a = y * (STEPS + 1) + i,
        b = a + STEPS + 1;
      indices.push(a, a + 1, b, a + 1, b + 1, b);
    }
  return { positions, uvs, indices, shading: 'smooth' };
}
function bodyDensity(ctx: VfxParticleContext): Node<'float'> {
  const uv = ctx.uv as Node<'vec2'>;
  const clock = ctx.age as Node<'float'>;
  const at = uv
    .mul(vec2(7, 0.7))
    .add(vec2(clock.mul(0.55), clock.mul(-0.8)))
    .fract();
  return texture(ctx, 'noise', at).x;
}
const BODY_LOOK: VfxLayerLook = {
  textures: {
    wind: { texture: vfxTexture('trail-tornado-source-1'), colorSpace: 'linear' },
    noise: { texture: vfxTexture('noise-soft-alias-1'), colorSpace: 'linear' },
  },
  colorNode(ctx) {
    return mix(vec3(0.025, 0.07, 0.085), vec3(0.16, 0.29, 0.31), bodyDensity(ctx));
  },
  opacityNode(ctx) {
    const uv = ctx.uv as Node<'vec2'>;
    const clock = ctx.age as Node<'float'>;
    const at = uv
      .add(vec2(clock.mul(0.12), 0))
      .fract()
      .mul(vec2(1, 238 / 512))
      .add(vec2(0, 274 / 512));
    const density = texture(ctx, 'wind', at).x.smoothstep(0.15, 0.68);
    const sides = uv.x.smoothstep(0, 0.1).mul(uv.x.smoothstep(0.9, 1).oneMinus());
    const ends = uv.y.smoothstep(0, 0.1).mul(uv.y.smoothstep(0.82, 1).oneMinus());
    const erosion = bodyDensity(ctx).smoothstep(0.12, 0.62);
    return density.mul(erosion).mul(sides).mul(ends).mul(0.82);
  },
  positionNode(ctx) {
    const p = ctx.positionLocal as Node<'vec3'>;
    const uv = ctx.uv as Node<'vec2'>;
    const angle = uv.x.mul(Math.PI * 2),
      along = uv.y;
    const clock = (ctx.age as Node<'float'>).add(START);
    const rest = angle
      .mul(3)
      .add(along.mul(7))
      .sin()
      .mul(0.17)
      .add(angle.mul(5).sub(along.mul(9)).cos().mul(0.08))
      .add(1);
    const live = angle
      .mul(3)
      .add(along.mul(7))
      .sub(clock.mul(4))
      .sin()
      .mul(0.17)
      .add(angle.mul(5).sub(along.mul(9)).add(clock.mul(3)).cos().mul(0.08))
      .add(1);
    const gain = live.div(rest);
    const offset = along.mul(0.25 * RADIAL_SCALE);
    // Particle age starts after charge; surface wisps use the full effect age.
    return vec3(p.x, p.y.sub(offset).mul(gain).add(offset), p.z.mul(gain));
  },
};
function dustLook(rect: readonly [number, number, number, number]): VfxLayerLook {
  const at = (ctx: VfxParticleContext): Node<'vec2'> =>
    (ctx.uv as Node<'vec2'>)
      .mul(vec2((rect[2] - rect[0]) / 1024, (rect[3] - rect[1]) / 1024))
      .add(vec2(rect[0] / 1024, 1 - rect[3] / 1024));
  return {
    textures: { dust: { texture: vfxTexture('paint-four-blobs-1'), colorSpace: 'srgb' } },
    colorNode: (ctx) =>
      mix(vec3(0.12, 0.105, 0.09), vec3(0.64, 0.55, 0.4), texture(ctx, 'dust', at(ctx)).x),
    opacityNode: (ctx) => texture(ctx, 'dust', at(ctx)).w.pow(0.6).mul(0.62),
  };
}
const STOP = FLIGHT / BODY_LIFE;
const BODY_ALPHA = curve([0, 0], [0.075 / BODY_LIFE, 1], [STOP, 1], [1, 0]);
export const steelTempestTiming = { chargeEndsAt: START, arrivalAt: ARRIVAL } as const;
/** Returns the local ground-level path sample for a finite effect age; the game owns collision queries. */
export function sampleSteelTempestTravel(age: number): Vec3 {
  if (!Number.isFinite(age)) throw new Error('Steel Tempest age must be finite.');
  return [center(age), 0, 0];
}
function buildArrivalGust(fx: VfxKitBuilder, at: number, target: number): void {
  fx.path({
    id: 'arrival-gust',
    sample: (age) => arrivalGust(age, at, target),
    maxSegments: STEPS,
    look: STRIP_LOOK,
    blend: 'alpha',
    orderInLayer: 4,
  });
}
function buildArrivalParticles(fx: VfxKitBuilder, at: number, target: number): void {
  fx.particles({
    delay: at,
    startLife: 0.3,
    startSize: 0.7,
    sizeOverLife: curve([0, 0.45], [0.3, 1.45], [1, 1.9]),
    opacityOverLife: curve([0, 0], [0.12, 0.85], [0.45, 0.65], [1, 0]),
    map: vfxTexture('solid'),
    look: BODY_LOOK,
    mesh: { geometry: funnel(), side: 'double' },
    blend: 'alpha',
    transform: { position: [target, FLOW_HEIGHT, 0] },
    rotation: { enabled: false },
  });
  fx.particles({
    delay: at,
    startLife: 0.18,
    startSize: 1.2,
    sizeOverLife: curve([0, 0.3], [0.25, 1.25], [1, 1.8]),
    opacityOverLife: curve([0, 0], [0.08, 0.95], [0.3, 0.75], [1, 0]),
    map: vfxTexture('solid'),
    look: {
      textures: { noise: { texture: vfxTexture('noise-soft-alias-1'), colorSpace: 'linear' } },
      colorNode: () => vec3(0.65, 0.9, 0.95),
      opacityNode(ctx) {
        const uv = ctx.uv as Node<'vec2'>;
        const at = uv
          .mul(3)
          .add(vec2((ctx.age as Node<'float'>).mul(0.8), 0))
          .fract();
        const grain = texture(ctx, 'noise', at).x;
        const radius = uv.sub(0.5).length().mul(2).add(grain.sub(0.5).mul(0.08));
        return radius
          .smoothstep(0.55, 0.7)
          .mul(radius.smoothstep(0.85, 1).oneMinus())
          .mul(grain.smoothstep(0.25, 0.5));
      },
    },
    emission: 0.9,
    blend: 'alpha',
    transform: { position: [target, 0.65, 0] },
    rotation: { enabled: false },
  });
  for (const [i, rect] of CROPS.entries()) {
    const aspect = (rect[2] - rect[0]) / (rect[3] - rect[1]);
    const side = i % 2 === 0 ? -1 : 1;
    fx.particles({
      delay: at + i * 0.025,
      startLife: 0.45 + (i % 2) * 0.1,
      startSpeed: 0.65,
      direction: [0.3 + i * 0.12, 1, side * 0.6],
      spread: 0.2,
      startSize: 1.1 * Math.max(1, aspect),
      sizeOverLife: curve([0, 0.7], [1, 2.2]),
      opacityOverLife: curve([0, 0], [0.12, 1], [1, 0]),
      map: vfxTexture('solid'),
      look: dustLook(rect),
      aspect,
      blend: 'alpha',
      transform: {
        position: [target + side * (0.12 + i * 0.08), 0.13 + i * 0.08, Math.sin(i * 2.2) * 0.2],
      },
      rotation: { start: side * 0.4, spin: side * 0.5 },
    });
  }
  fx.particles({
    capacity: 12,
    delay: at,
    startLife: [0.35, 0.6],
    startSpeed: [1, 2.3],
    radial: 'outward',
    shape: { type: 'hemisphere', radius: [0.04, 0.12], axis: [0, 1, 0] },
    gravity: 4.5,
    drag: 0.6,
    collision: { bounce: 0.15, friction: 0.6, distance: 0.03 },
    startSize: [0.018, 0.035],
    sizeOverLife: curve([0, 1], [0.7, 1], [1, 0]),
    opacityOverLife: curve([0, 1], [1, 0]),
    map: vfxTexture('solid'),
    tint: [0.28, 0.24, 0.18, 0.8],
    colorSource: 'tint',
    emission: 0.3,
    mesh: 'cube',
    blend: 'alpha',
    transform: { position: [target, 0.08, 0] },
    rotation: { spin: [-6, 6] },
  });
}
function buildTravel(fx: VfxKitBuilder, includeArrival: boolean): void {
  fx.particles({
    startLife: START,
    startSize: 0.95,
    sizeOverLife: curve([0, 0.6], [1, 1.5]),
    opacityOverLife: curve([0, 0], [0.3, 0.4], [1, 0]),
    map: vfxTexture('circle-wispy-outline-1'),
    tint: [0.22, 0.55, 0.65, 0.6],
    colorSource: 'tint',
    emission: 0.6,
    blend: 'alpha',
    mode: 'horizontal',
    transform: { position: [ORIGIN, 0.025, 0] },
    rotation: { spin: -5 },
  });
  for (const [id, sample, maxSegments] of [
    ['wind-strands', windStrands, STEPS * 3],
    ['ground-wake', groundWake, 20],
  ] as const)
    fx.path({
      id,
      sample,
      maxSegments,
      look: id === 'wind-strands' ? WIND_LOOK : STRIP_LOOK,
      blend: 'alpha',
      orderInLayer: 4,
    });
  if (includeArrival) buildArrivalGust(fx, ARRIVAL, TARGET);
  fx.particles({
    delay: START,
    startLife: BODY_LIFE,
    startSize: 1,
    opacityOverLife: BODY_ALPHA,
    velocityOverLife: {
      linear: [DISTANCE / FLIGHT, 0, 0],
      curve: curve([0, 1], [STOP - 1e-4, 1], [STOP, 0], [1, 0]),
    },
    map: vfxTexture('solid'),
    look: BODY_LOOK,
    mesh: { geometry: funnel(), side: 'double' },
    blend: 'alpha',
    transform: { position: [ORIGIN, FLOW_HEIGHT, 0] },
    rotation: { enabled: false },
  });
  if (includeArrival) buildArrivalParticles(fx, ARRIVAL, TARGET);
  fx.light({
    color: [0.3, 0.7, 0.85],
    intensity: 0.7,
    range: 3,
    curve: BODY_ALPHA,
    life: BODY_LIFE,
    delay: START,
    follow: { sample: (age) => [center(age), 0.9, 0] },
  });
}
/** Prepare once per copied id. The fixed-range flight has no scheduled dust, grit or arrival gust. */
export function createSteelTempestTravel(id: string): VfxDefinition {
  return defineVfx({
    id,
    duration: START + BODY_LIFE,
    seed: 131,
    maxInstances: 4,
    build: (fx) => buildTravel(fx, false),
  });
}
/** Prepare once per copied id and play only at a game-confirmed horizontal ground contact. */
export function createSteelTempestImpact(id: string): VfxDefinition {
  return defineVfx({
    id,
    duration: DURATION - ARRIVAL,
    seed: 131,
    maxInstances: 4,
    build(fx) {
      buildArrivalGust(fx, 0, 0);
      buildArrivalParticles(fx, 0, 0);
    },
  });
}
/** Creates the steel tempest composition; game code owns placement and events. */
// createSteelTempestPreview is the staged reference. For real hits, prepare the travel and impact factories once.
// Play travel unparented at a committed ground cast pose, unit scale, +X forward and +Y up. Transform sampleSteelTempestTravel(age) through that same pose for game collision queries.
// The low airflow body faces +X. The trajectory helper returns its ground center, not the leading edge; game code chooses the projectile collision volume.
// On confirmed contact, stop travel immediately and play impact at the selected horizontal ground contact. A miss or cancellation never implies an impact. No collision, damage or live target tracking is authored.
export function createSteelTempestPreview(id: string): VfxDefinition {
  return defineVfx({
    id,
    duration: DURATION,
    seed: 131,
    build: (fx) => buildTravel(fx, true),
  });
}

export default createSteelTempestTravel('example.wind-projectile');
