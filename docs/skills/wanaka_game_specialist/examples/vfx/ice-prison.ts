// intent: Frozen-pose ice enclosure, held freeze timing and synchronized fracture release.
// variants: createCryoHold + createCryoRelease for gameplay; createCryoFreeze for a timed freeze; cryoReleaseParams for matching the handoff
// Lifecycle: update heldSeconds; release with cryoReleaseParams; cancel pending handoff on interruption. See examples/vfx-cryo-lifecycle.ts.
// inputs: Cast origin, frozen pose duration and game-owned release timing.
// Copy dependencies: none.
// Setup in an async scene: const effect = createCryoHold('example.ice-prison');
// const vfx = useVfx(context); await vfx.prepare(effect);
// const handle = vfx.play(effect);
// Import useVfx from wanaka-studio-engine/vfx; gameplay owns freeze duration and release events.
// Freeze integration: freeze the actual skeleton through its animation owner, not only
// translation. Fit PROFILE to that frozen pose; wide limbs may exceed the default shell.
// Prepare createCryoHold and createCryoRelease together. Copy examples/vfx-cryo-lifecycle.ts
// for elapsed-time updates, cryoReleaseParams matching, positive-step handoff and cancellation.
// Keep the cast anchor stationary while the freed actor moves; debris has its own tail.
// Unlock gameplay from the adapter's onBreak/onCancel even if cosmetic admission fails.
// ready is startup, not proof a burst rendered. Cancellation cuts pending handoff/debris.
// createCryoFreeze(id, { holdSeconds }) is the timed alternative, not an event-owned hold.
// FRACTURE_COUNT changes shard grouping/draw count; yawSpeed changes rotation. Preserve
// fragment collision offsets when moving the cast floor; gameplay owns locks and collision.
import { abs, dot, float, mix, normalize, oneMinus, pow, smoothstep, vec2, vec3, length, min, normalView, positionView } from 'three/tsl';
import { Vector3, type Node, Euler } from 'three/webgpu';
import { defineVfx, vfxTexture, type VfxDefinition, type VfxKitBuilder, type VfxLayerLook, type VfxParticleContext, sampleVfxLookTexture as lookSample } from 'wanaka-studio-engine/vfx';

// Share breakAt with gameplay; the debris tail does not extend the protection window.
export const cryoTiming = { grow: 0.6, breakAt: 4.8, breakLife: 1.6, groundTail: 0.6 } as const;
const CRYO_DURATION = cryoTiming.breakAt + cryoTiming.breakLife + cryoTiming.groundTail;
const RELEASE_LIFE = cryoTiming.breakLife;
const cryoICE = 'ice-full-surface-2';
const CRYO_CRACKS = 'crack-thin-network-4';
const GRAIN = 'ice-speckles-1';
const SHELL_YAW = 0.19;
const SHELL_SEGMENTS = 7;
const FRACTURE_COUNT = 28;
const PANEL_THICKNESS = 0.18;
const GRAVITY = 5.6;
const GROUND_Y = 0.06;
const CHIP_CENTER_Y = 0.9;
const REVEAL_HEIGHT = 2.5;
const SHELL_FADE_IN = 0.15;
const GROUND_FADE_IN = 0.5;
const RELEASE_DURATION = RELEASE_LIFE + cryoTiming.groundTail;
// Local metres around the cast origin; fit this outline to the actor's frozen pose.
const PROFILE = [
  [0, 0],
  [0.86, 0],
  [0.83, 0.45],
  [0.76, 0.85],
  [0.66, 1.25],
  [0.56, 1.65],
  [0.4, 2.02],
  [0.14, 2.25],
  [0, 2.2],
] as const;
type cryoFreezeVec3 = readonly [number, number, number];
const YAW = new Euler(0, SHELL_YAW, 0);
interface ShellMesh {
  readonly positions: Vector3[];
  readonly uvs: readonly (readonly [number, number])[];
  readonly indices: number[];
}
interface ReleaseCoverage {
  readonly height: Node<'float'>;
  readonly strength: Node<'float'>;
}
interface CryoPanel {
  readonly center: cryoFreezeVec3;
  readonly positions: number[];
  readonly uvs: number[];
  readonly indices: number[];
}
function yawed(x: number, y: number, z: number): Vector3 {
  return new Vector3(x, y, z).applyEuler(YAW);
}
function latheShell(): ShellMesh {
  const rows = PROFILE.length;
  const positions: Vector3[] = [];
  const uvs: (readonly [number, number])[] = [];
  for (let column = 0; column <= SHELL_SEGMENTS; column += 1) {
    const phi = (column / SHELL_SEGMENTS) * Math.PI * 2;
    const sin = Math.sin(phi);
    const cos = Math.cos(phi);
    for (let row = 0; row < rows; row += 1) {
      const sample = PROFILE[row];
      if (sample === undefined) throw new Error('Cryo shell profile is missing a row.');
      const [radius, y] = sample;
      const facetRadius =
        radius * (1 + 0.08 * Math.sin(phi * 3 + 0.4) + 0.05 * Math.sin(phi * 2 + row * 0.8));
      const facetY = y + radius * 0.08 * Math.sin(phi * 2 + 0.65) * Math.min(1, y / 0.45);
      positions.push(yawed(facetRadius * sin + y * 0.045, facetY, facetRadius * cos));
      uvs.push([column / SHELL_SEGMENTS, row / (rows - 1)]);
    }
  }
  const indices: number[] = [];
  for (let column = 0; column < SHELL_SEGMENTS; column += 1) {
    for (let row = 0; row < rows - 1; row += 1) {
      const base = row + column * rows;
      indices.push(base, base + rows, base + 1, base + rows + 1, base + 1, base + rows);
    }
  }
  return { positions, uvs, indices };
}
function shellCorner(
  shell: ShellMesh,
  index: number | undefined,
): {
  readonly position: Vector3;
  readonly uv: readonly [number, number];
} {
  const position = index === undefined ? undefined : shell.positions[index];
  const uv = index === undefined ? undefined : shell.uvs[index];
  if (position === undefined || uv === undefined) {
    throw new Error('Cryo panel is missing a shell corner.');
  }
  return { position, uv };
}
function cryoPanels(shell: ShellMesh): CryoPanel[] {
  const panels: CryoPanel[] = [];
  for (let offset = 0; offset < shell.indices.length; offset += 3) {
    const corners = [0, 1, 2].map((index) => shellCorner(shell, shell.indices[offset + index]));
    const [first, second, third] = corners;
    if (first === undefined || second === undefined || third === undefined) {
      throw new Error('Cryo fracture is missing a triangle corner.');
    }
    const normal = second.position
      .clone()
      .sub(first.position)
      .cross(third.position.clone().sub(first.position));
    if (normal.lengthSq() < 1e-12) continue;
    normal.normalize();
    const center = first.position.clone().add(second.position).add(third.position).divideScalar(3);
    const outer = corners.map((corner) => corner.position.clone().sub(center));
    const inner = outer.map((point) => point.clone().addScaledVector(normal, -PANEL_THICKNESS));
    const faces = [0, 1, 2, 5, 4, 3];
    for (const [edgeA, edgeB] of [
      [0, 1],
      [1, 2],
      [2, 0],
    ] as const) {
      faces.push(edgeB, edgeA, edgeA + 3, edgeB, edgeA + 3, edgeB + 3);
    }
    panels.push({
      center: [center.x, center.y, center.z],
      positions: [...outer, ...inner].flatMap((point) => [point.x, point.y, point.z]),
      uvs: [...corners, ...corners].flatMap((corner) => [...corner.uv]),
      indices: faces,
    });
  }
  return panels;
}
function panelDistance(left: CryoPanel, right: CryoPanel): number {
  const x = left.center[0] - right.center[0];
  const y = left.center[1] - right.center[1];
  const z = left.center[2] - right.center[2];
  return x * x + y * y + z * z;
}
function clusterPanels(parts: readonly CryoPanel[]): CryoPanel[] {
  const first = parts[0];
  if (first === undefined) return [];
  const seeds = [first];
  while (seeds.length < Math.min(FRACTURE_COUNT, parts.length)) {
    let next: CryoPanel | undefined;
    let largestGap = 0;
    for (const part of parts) {
      const gap = Math.min(...seeds.map((seed) => panelDistance(part, seed)));
      if (gap > largestGap) {
        largestGap = gap;
        next = part;
      }
    }
    if (next === undefined) break;
    seeds.push(next);
  }
  const groups = seeds.map((seed) => ({ seed, parts: [] as CryoPanel[] }));
  for (const part of parts) {
    const nearest = groups.reduce((best, group) =>
      panelDistance(part, group.seed) < panelDistance(part, best.seed) ? group : best,
    );
    nearest.parts.push(part);
  }
  return groups.map(({ parts }) => {
    const center = new Vector3();
    for (const part of parts) center.add(new Vector3(...part.center));
    center.divideScalar(parts.length);
    const positions: number[] = [],
      uvs: number[] = [],
      indices: number[] = [];
    for (const part of parts) {
      const shift = new Vector3(...part.center).sub(center);
      const offset = positions.length / 3;
      positions.push(
        ...part.positions.map(
          (v, i) => v + (i % 3 === 0 ? shift.x : i % 3 === 1 ? shift.y : shift.z),
        ),
      );
      uvs.push(...part.uvs);
      indices.push(...part.indices.map((index) => index + offset));
    }
    return { center: [center.x, center.y, center.z] as const, positions, uvs, indices };
  });
}
const SHELL = latheShell();
const PANELS = clusterPanels(cryoPanels(SHELL));
const LUMA = [0.2126, 0.7152, 0.0722] as const;
const releaseFade = [
  { t: 0, v: 1 },
  { t: 0.55, v: 1 },
  { t: 1, v: 0 },
];
const shrink = [
  { t: 0, v: 1 },
  { t: 0.4, v: 0.55 },
  { t: 0.8, v: 0.2 },
  { t: 1, v: 0.05 },
];
const iceMaps = {
  ice: { texture: vfxTexture(cryoICE), colorSpace: 'srgb', wrap: 'repeat' },
  cracks: { texture: vfxTexture(CRYO_CRACKS), colorSpace: 'linear', wrap: 'repeat' },
} as const;
function iceLuminance(rgb: Node<'vec3'>): Node<'float'> {
  return dot(rgb, vec3(LUMA[0], LUMA[1], LUMA[2]));
}
function rimNode(): Node<'float'> {
  const facing = abs(dot(normalView, normalize(positionView.mul(float(-1)))));
  return pow(oneMinus(facing), float(2));
}
function iceColorNode(ctx: VfxParticleContext): Node<'vec3'> {
  const uv = ctx.uv as Node<'vec2'>;
  const iceRgb = lookSample(ctx, 'ice', uv.mul(vec2(2.2, 1.8))).xyz;
  const fracture = smoothstep(
    float(0.38),
    float(0.8),
    lookSample(ctx, 'cracks', uv.mul(vec2(1.5, 1.25))).x,
  );
  const cloud = iceLuminance(iceRgb);
  const body = mix(vec3(0.01, 0.055, 0.11), vec3(0.045, 0.21, 0.34), cloud);
  return mix(body, vec3(0.45, 0.78, 0.86), fracture.mul(0.65)).add(
    rimNode().mul(vec3(0.05, 0.23, 0.3)),
  );
}
function groundLook(
  duration = CRYO_DURATION,
  growing = true,
  strength?: Node<'float'>,
  heldClock?: Node<'float'>,
): VfxLayerLook {
  return {
    textures: {
      ...iceMaps,
      grain: { texture: vfxTexture(GRAIN), colorSpace: 'srgb' },
    },
    colorNode(ctx) {
      const grain = lookSample(ctx, 'grain', ctx.uv as Node<'vec2'>).xyz;
      return grain.mul(float(0.3)).add(vec3(0.65, 0.85, 1));
    },
    opacityNode(ctx) {
      const localUv = ctx.uv as Node<'vec2'>;
      const clock = heldClock ?? ctx.age as Node<'float'>;
      const radius = length(localUv.sub(vec2(0.5, 0.5)).mul(vec2(2, 2)));
      const fracture = lookSample(ctx, 'cracks', localUv).x;
      const grain = lookSample(ctx, 'grain', localUv).xyz;
      const groundMask = oneMinus(smoothstep(float(0.35), float(1), radius));
      const groundAlpha = min(
        growing ? min(clock.div(float(GROUND_FADE_IN)), float(1)) : float(1),
        heldClock ? float(1) : float(duration).sub(clock).div(float(1.2)),
      );
      const groundMix = fracture.mul(float(0.22)).add(iceLuminance(grain).mul(float(0.25)));
      return groundMask
        .mul(groundMix)
        .mul(groundAlpha)
        .mul(strength ?? float(1));
    },
  };
}
function shellLook(clock?: Node<'float'>): VfxLayerLook {
  return {
    textures: iceMaps,
    colorNode: iceColorNode,
    opacityNode(ctx) {
      const elapsed = clock ?? ctx.age as Node<'float'>;
      const reveal = min(elapsed.mul(float(REVEAL_HEIGHT / cryoTiming.grow)), float(REVEAL_HEIGHT));
      const height = (ctx.positionLocal as Node<'vec3'>).y;
      const bodyAlpha = float(0.74).add(rimNode().mul(0.2));
      return min(elapsed.div(float(SHELL_FADE_IN)), float(1))
        .mul(oneMinus(smoothstep(reveal.sub(float(0.12)), reveal, height)))
        .mul(bodyAlpha);
    },
  };
}
function shardLook(coverage?: ReleaseCoverage, centerY = 0): VfxLayerLook {
  return {
    textures: iceMaps,
    colorNode: iceColorNode,
    opacityNode(ctx) {
      const fracture = lookSample(ctx, 'cracks', ctx.uv as Node<'vec2'>).x;
      const opacity = rimNode()
        .mul(float(0.2))
        .add(fracture.mul(float(0.2)))
        .add(float(0.75));
      if (coverage === undefined) return opacity;
      const restHeight = (ctx.positionLocal as Node<'vec3'>).y.add(centerY);
      return opacity
        .mul(oneMinus(smoothstep(coverage.height.sub(0.12), coverage.height, restHeight)))
        .mul(coverage.strength);
    },
  };
}
function releaseLift(index: number): number {
  return 0.6 + (index % 3) * 0.4;
}
function floorHeight(height: number): number {
  return Math.min(height, GROUND_Y);
}
function yawSpeed(
  center: cryoFreezeVec3,
  index: number,
): {
  t: number;
  v: number;
}[] {
  const spin = (index % 2 === 0 ? -1 : 1) * (1.5 + (index % 5) * 0.65);
  const height = center[1];
  const floor = floorHeight(height);
  const lift = releaseLift(index);
  const landed = (lift + Math.sqrt(lift * lift + 2 * GRAVITY * (height - floor))) / GRAVITY;
  const stop = Math.min(1, Math.max(0, landed / RELEASE_LIFE));
  if (stop <= 0)
    return [
      { t: 0, v: 0 },
      { t: 1, v: 0 },
    ];
  if (stop >= 1)
    return [
      { t: 0, v: spin },
      { t: 1, v: spin },
    ];
  const after = Math.min(1, stop + 0.0001);
  if (after >= 1)
    return [
      { t: 0, v: spin },
      { t: stop, v: spin },
      { t: 1, v: 0 },
    ];
  return [
    { t: 0, v: spin },
    { t: stop, v: spin },
    { t: after, v: 0 },
    { t: 1, v: 0 },
  ];
}
const GROUND_LOOK = groundLook();
const SHELL_LOOK = shellLook();
const SHARD_LOOK = shardLook();
function addGround(fx: VfxKitBuilder, duration: number, look = GROUND_LOOK): void {
  fx.particles({
    startLife: duration,
    startSize: 3.5,
    mode: 'horizontal',
    blend: 'alpha',
    emission: 1,
    orderInLayer: 15,
    map: vfxTexture('solid'),
    look,
    transform: { position: [0, 0.015, 0] },
    rotation: { enabled: false },
  });
}
function addBreak(fx: VfxKitBuilder, at: number, coverage?: ReleaseCoverage): void {
  for (const [index, panel] of PANELS.entries()) {
    const lift = releaseLift(index);
    const planar = 1.2 + (index % 7) * 0.2;
    const angle = Math.atan2(panel.center[2], panel.center[0]);
    const velocity: cryoFreezeVec3 = [Math.cos(angle) * planar, lift, Math.sin(angle) * planar];
    const speed = Math.hypot(velocity[0], velocity[1], velocity[2]);
    const floor = floorHeight(panel.center[1]);
    fx.particles({
      bursts: [{ time: at, count: 1 }],
      startLife: RELEASE_LIFE,
      startSpeed: speed,
      direction: [velocity[0] / speed, velocity[1] / speed, velocity[2] / speed],
      gravity: -GRAVITY,
      collision: { bounce: 0, friction: 1, normal: [0, 1, 0], distance: floor - panel.center[1] },
      startSize: 1,
      sizeOverLife: shrink,
      opacityOverLife: releaseFade,
      emission: 1,
      lit: true,
      mesh: {
        geometry: {
          positions: panel.positions,
          uvs: panel.uvs,
          indices: panel.indices,
        },
        side: 'front',
        roughness: 0.2,
        metalness: 0,
        clearcoat: 0.45,
        clearcoatRoughness: 0.12,
      },
      map: vfxTexture('solid'),
      blend: 'alpha',
      look: coverage === undefined ? SHARD_LOOK : shardLook(coverage, panel.center[1]),
      simulationSpace: 'local',
      transform: { position: panel.center },
      rotation: { overLife: yawSpeed(panel.center, index) },
    });
  }
  fx.particles({
    bursts: [{ time: at, count: 36 }],
    startLife: [0.55, 1.1],
    startSpeed: [0.8, 1.8],
    direction: [0, 1, 0],
    spread: 1,
    shape: { type: 'box', size: [1.3, 1.6, 1.3] },
    gravity: -GRAVITY,
    collision: {
      bounce: 0,
      friction: 1,
      normal: [0, 1, 0],
      distance: GROUND_Y - CHIP_CENTER_Y,
      killOnHit: true,
    },
    startSize: [0.045, 0.11],
    sizeOverLife: [
      { t: 0, v: 1 },
      { t: 1, v: 0.25 },
    ],
    opacityOverLife: [
      { t: 0, v: 1 },
      { t: 0.6, v: 1 },
      { t: 1, v: 0 },
    ],
    emission: 0.7,
    lit: true,
    tint: [0.25, 0.65, 0.9, 1],
    mesh: {
      geometry: {
        positions: [0, 1, 0, -0.5, -0.5, 0.35, 0.55, -0.4, 0.2, 0, -0.3, -0.6],
        indices: [0, 1, 2, 0, 2, 3, 0, 3, 1, 1, 3, 2],
      },
      orient: 'random',
      side: 'front',
      roughness: 0.25,
      metalness: 0,
    },
    ...(coverage === undefined
      ? {}
      : {
          look: {
            opacityNode: () =>
              coverage.height
                .greaterThan(float(REVEAL_HEIGHT - 0.1))
                .select(coverage.strength, float(0)),
          },
        }),
    map: vfxTexture('solid'),
    blend: 'alpha',
    simulationSpace: 'local',
    transform: { position: [0, CHIP_CENTER_Y, 0] },
    rotation: { spin: [-4, 4] },
  });
}
/** Create once during initialization with a unique project id; prepare alongside the full effect. */
export function createCryoRelease(id: string): VfxDefinition {
  return defineVfx({
    id,
    duration: RELEASE_DURATION,
    maxInstances: 4,
    seed: 73,
    params: {
      height: { default: REVEAL_HEIGHT, min: 0, max: REVEAL_HEIGHT },
      strength: { default: 1, min: 0, max: 1 },
      groundStrength: { default: 1, min: 0, max: 1 },
    },
    build(fx) {
      const height = fx.param('height') as Node<'float'>;
      const strength = fx.param('strength') as Node<'float'>;
      addGround(
        fx,
        RELEASE_DURATION,
        groundLook(RELEASE_DURATION, false, fx.param('groundStrength') as Node<'float'>),
      );
      addBreak(fx, 0, { height, strength });
    },
  });
}
/** Match an interrupted growth front for a handoff to the prepared release. */
export function cryoReleaseParams(heldSeconds: number): {
  height: number;
  strength: number;
  groundStrength: number;
} {
  if (!Number.isFinite(heldSeconds)) throw new Error('Cryo held time must be finite.');
  const age = Math.max(0, heldSeconds);
  return {
    height: Math.min((age * REVEAL_HEIGHT) / cryoTiming.grow, REVEAL_HEIGHT),
    strength: Math.min(age / SHELL_FADE_IN, 1),
    groundStrength: Math.min(age / GROUND_FADE_IN, 1),
  };
}
/** Creates the cryo freeze composition; game code owns placement and events. */
export function createCryoFreeze(id: string, options: { readonly holdSeconds?: number; readonly held?: boolean } = {}): VfxDefinition {
  const held = options.held === true;
  const holdSeconds = options.holdSeconds ?? cryoTiming.breakAt;
  if (!Number.isFinite(holdSeconds) || holdSeconds < cryoTiming.grow || holdSeconds > 120)
    throw new Error('Cryo hold must be between its growth time and 120 seconds; use createCryoHold for an event-owned hold.');
  const duration = held ? 8 : holdSeconds + RELEASE_DURATION;
  return defineVfx({
    id,
    duration,
    loop: held,
    params: held ? { heldSeconds: { default: 0, min: 0 } } : {},
    seed: 73,
    maxInstances: 4,
    build(fx) {
      const heldClock = held ? fx.param('heldSeconds') as Node<'float'> : undefined;
      addGround(fx, duration, groundLook(duration, true, undefined, heldClock));
      fx.particles({
        startLife: held ? duration : holdSeconds,
        startSpeed: 0,
        direction: [0, 1, 0],
        startSize: 1,
        mesh: {
          geometry: {
            positions: SHELL.positions.flatMap((point) => [point.x, point.y, point.z]),
            uvs: SHELL.uvs.flatMap((point) => [...point]),
            indices: SHELL.indices,
          },
          side: 'front',
          roughness: 0.2,
          metalness: 0,
          clearcoat: 0.45,
          clearcoatRoughness: 0.12,
        },
        lit: true,
        blend: 'alpha',
        emission: 1,
        map: vfxTexture('solid'),
        look: held ? shellLook(heldClock) : SHELL_LOOK,
        simulationSpace: 'local',
      });
      if (!held) addBreak(fx, holdSeconds);
    },
  });
}

/** Holds a shell until gameplay plays createCryoRelease and stops this handle. Update heldSeconds from game time. */
export function createCryoHold(id: string): VfxDefinition {
  return createCryoFreeze(id, { held: true });
}

export default createCryoFreeze('example.ice-prison');
