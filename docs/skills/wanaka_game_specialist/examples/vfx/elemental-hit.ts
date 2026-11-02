// intent: Elemental, biological and confirmed parry contact feedback.
// variants: createIceImpact, createIceContact, createCrystalImpact, createElectricHit, createAcidImpact, createBloodImpact, createCombatFeedback
// inputs: Confirmed contact point and recipe-specific outward frame; these do not apply gameplay states.
// Copy dependencies: none.
// Setup in an async scene: const effect = createIceImpact('example.elemental-hit');
// const vfx = useVfx(context); await vfx.prepare(effect, {});
// const handle = vfx.play(effect, playOptions);
// Import useVfx from wanaka-studio-engine/vfx; construct playOptions from the chosen recipe notes and game inputs.
// Blood integration: prepare createBloodImpact separately from persistent stains. Play unparented
// at the wound; rotate local +X into the real spray direction and vary the play seed.
// For a known receiving plane, params.groundNormal is its normalized world normal and
// params.groundDistance is dot(normal, pointOnPlane); defaults disable clipping.
// This clips mist/streaks, without detecting collisions or spawning stains. Confirmed
// surface intersections independently trigger createBloodStain from surface-mark.ts.
import { vfxPlaneClip, type VfxBillboardPathPoint, type VfxDefinition, type VfxLayerLook, type VfxParticleContext, GLOW_COL, RANDOM_YAW, curve, defineVfx, sampleVfxRefraction, vfxTexture, type Vec3, type VfxKitBuilder, createVfxAtlasLook as atlasLook, getVfxTextureSampling } from 'wanaka-studio-engine/vfx';
import { mix, normalView, vec3, viewportSize, dot } from 'three/tsl';
import { type Node } from 'three/webgpu';

namespace ElementalHitRecipes {
/** Selects a compact contact or larger crystal burst; both use local +Y as the contact normal. */
// Copy this file once; select the named variant before prepare, then reuse the definition. Game code owns contacts, damage and cancellation.
export function createIceImpact(
  id: string,
  variant: 'contact' | 'crystals' = 'contact',
): VfxDefinition {
  if (variant === 'contact') return createIceContact(id);
  if (variant === 'crystals') return createCrystalImpact(id);
  throw new Error('Unknown ice impact variant.');
}
const WORLD_ICE_CONTACT = {
  direction: [0, 1, 0],
  simulationSpace: 'world',
  blend: 'alpha',
} as const;
// Play once at the game-confirmed contact, offset slightly along the surface normal. Rotate local +Y outward; use an unparented play so fragments keep world gravity.
// Refraction uses the project Rendering pipeline. Game code owns hit confirmation, damage and freeze status. This effect does not leave an area marker or simulate fragment collisions. Immediate stop cancels remaining visuals.
/** Returns the grand-ice-impact composition at a game-owned pose. */
export function createIceContact(id: string): VfxDefinition {
  return defineVfx({
    id,
    duration: 0.85,
    maxInstances: 12,
    seed: 7,
    build(fx) {
      fx.particles({
        startLife: 0.1,
        startSize: 0.85,
        sizeOverLife: curve([0, 0.8], [0.18, 1], [1, 0]),
        opacityOverLife: curve([0, 1], [0.25, 0.9], [1, 0]),
        transform: { position: [0, 0.035, 0] },
        map: vfxTexture('ice-star-core-1'),
        tint: [0.65, 0.88, 1, 1],
        blend: 'alpha',
        emission: 2.4,
        orderInLayer: 20,
        rotation: { start: RANDOM_YAW },
      });
      fx.particles({
        ...WORLD_ICE_CONTACT,
        capacity: 12,
        startLife: [0.25, 0.6],
        startSpeed: [1.4, 3.2],
        startSize: [0.12, 0.26],
        sizeOverLife: curve([0, 1], [0.55, 1], [1, 0]),
        spread: 0.95,
        gravity: -9.8,
        drag: 0.6,
        transform: { position: [0, 0.035, 0] },
        mesh: {
          geometry: 'diamond',
          orient: 'random',
          scale: { min: [0.45, 0.7, 0.3], max: [0.9, 1.5, 0.65] },
          roughness: 0.12,
          clearcoat: 0.8,
          clearcoatRoughness: 0.08,
          specularIntensity: 0.65,
        },
        map: vfxTexture('solid'),
        lit: true,
        tint: [0.75, 0.9, 1, 0.85],
        emission: 0.08,
        look: {
          opacityNode: () => normalView.z.abs().oneMinus().pow(3).mul(0.2).add(0.75),
          backdropNode: () =>
            sampleVfxRefraction(normalView.xy.div(viewportSize).mul(3))
              .mul(vec3(0.45, 0.7, 0.85))
              .add(vec3(0.02, 0.06, 0.1))
              .add(vec3(0.25, 0.42, 0.5).mul(normalView.z.abs().oneMinus().pow(3))),
        },
        rotation: { start: RANDOM_YAW, spin: [-6, 6] },
      });
      fx.particles({
        ...WORLD_ICE_CONTACT,
        capacity: 14,
        startLife: [0.1, 0.24],
        startSpeed: [1.8, 3.8],
        startSize: [0.008, 0.018],
        sizeOverLife: curve([0, 1], [1, 0]),
        spread: 1.1,
        gravity: -6,
        drag: 1.2,
        mode: 'stretched',
        stretch: { speedFactor: 0, lengthFactor: 4 },
        map: vfxTexture('point-soft-5'),
        tint: [0.65, 0.9, 1, 0.9],
        emission: 1.2,
        transform: { position: [0, 0.02, 0] },
      });
      fx.particles({
        ...WORLD_ICE_CONTACT,
        capacity: 3,
        startLife: [0.3, 0.55],
        startSpeed: [0.15, 0.5],
        spread: 1,
        drag: 2,
        startSize: [0.45, 0.7],
        sizeOverLife: curve([0, 0.2], [0.2, 1], [1, 1.6]),
        opacityOverLife: curve([0, 0], [0.1, 1], [0.4, 0.6], [1, 0]),
        map: vfxTexture('smoke-textured-puff-8'),
        tint: [0.55, 0.8, 1, 0.2],
        emission: 0.3,
        transform: { position: [0, 0.04, 0] },
        rotation: { start: RANDOM_YAW },
      });
    },
  });
}
// Copy this file. Play at a confirmed surface contact, with local +Y aligned to its normal and an unscaled world pose. Game code owns impact timing, damage and surface selection.
// Optional surfaceNormal / surfaceDistance are a unit world normal toward free space and dot(normal, contact). They fade fragment/mist centres behind that plane. Zero normal disables clipping; this is not collision or a fixed world floor.
// World-space pieces use world gravity. No overhead projectile, delayed secondary impact, persistent crystal growth or terrain deformation is authored. Immediate stop clears an interrupted impact.
function crystalPiece() {
  const positions = [0, -0.12, 0],
    indices: number[] = [];
  for (const [radius, y] of [
    [0.2, 0.12],
    [0.14, 0.65],
  ] as const)
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      positions.push(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    }
  positions.push(0.055, 1.05, 0.025);
  for (let i = 0; i < 6; i++) {
    const a = 1 + i,
      b = 1 + ((i + 1) % 6),
      c = 7 + i,
      d = 7 + ((i + 1) % 6);
    indices.push(0, a, b, a, c, b, b, c, d, c, 13, d);
  }
  return { positions, indices };
}
const PIECE = crystalPiece();
/** Returns the crystals composition at a game-owned pose. */
export function createCrystalImpact(id: string): VfxDefinition {
  return defineVfx({
    id,
    duration: 1.1,
    seed: 7,
    maxInstances: 4,
    params: { surfaceNormal: { default: [0, 0, 0] }, surfaceDistance: { default: 0 } },
    build(fx) {
      const clip = vfxPlaneClip(
        fx.param('surfaceNormal') as Node<'vec3'>,
        fx.param('surfaceDistance') as Node<'float'>,
        [-0.02, 0.035],
      );
      const debris = {
        ...WORLD_ICE_CONTACT,
        look: clip,
      };
      const iceLook: VfxLayerLook = {
        ...clip,
        opacityNode: () => normalView.z.abs().oneMinus().pow(2).mul(0.18).add(0.77),
        backdropNode: () =>
          sampleVfxRefraction(normalView.xy.div(viewportSize).mul(2))
            .mul(vec3(0.35, 0.55, 0.7))
            .add(vec3(0.025, 0.1, 0.15))
            .add(vec3(0.15, 0.3, 0.35).mul(normalView.z.abs().oneMinus().pow(3))),
      };
      const ice = {
        geometry: PIECE,
        side: 'double' as const,
        orient: 'random' as const,
        roughness: 0.1,
        metalness: 0,
        clearcoat: 0.8,
        clearcoatRoughness: 0.08,
        specularIntensity: 0.9,
        scale: { min: [0.7, 0.8, 0.5] as const, max: [1.1, 1.4, 0.8] as const },
      };
      fx.particles({
        ...debris,
        capacity: 7,
        bursts: [{ time: 0, count: 7 }],
        startLife: [0.65, 0.9],
        startSpeed: [1.6, 3.2],
        spread: 0.65,
        shape: { type: 'circle', radius: [0.1, 0.35], axis: [0, 1, 0] },
        startSize: [0.35, 0.6],
        sizeOverLife: curve([0, 0.15], [0.12, 1], [0.7, 1], [1, 0.6]),
        opacityOverLife: curve([0, 0], [0.05, 1], [0.75, 1], [1, 0]),
        mesh: ice,
        look: iceLook,
        map: vfxTexture('solid'),
        lit: true,
        emission: 0.15,
        tint: [0.6, 0.85, 0.96, 0.95],
        gravity: -9.8,
        drag: 0.15,
        rotation: { spin: [-4, 4] },
        transform: { position: [0, 0.12, 0] },
        orderInLayer: 18,
      });
      fx.particles({
        ...debris,
        capacity: 16,
        bursts: [{ time: 0, count: 16 }],
        startLife: [0.35, 0.65],
        startSpeed: [1.2, 3.4],
        spread: 1.2,
        shape: { type: 'hemisphere', radius: [0.05, 0.3] },
        startSize: [0.06, 0.16],
        sizeOverLife: curve([0, 0.4], [0.1, 1], [0.7, 0.8], [1, 0]),
        mesh: ice,
        look: iceLook,
        map: vfxTexture('solid'),
        lit: true,
        emission: 0.1,
        tint: [0.7, 0.9, 1, 0.9],
        gravity: -9.8,
        drag: 0.4,
        rotation: { spin: [-10, 10] },
        transform: { position: [0, 0.12, 0] },
        orderInLayer: 19,
      });
      fx.particles({
        ...debris,
        capacity: 10,
        bursts: [{ time: 0, count: 10 }],
        startLife: [0.45, 0.85],
        startSpeed: [0.35, 0.9],
        spread: 1.2,
        shape: { type: 'circle', radius: [0.1, 0.65], axis: [0, 1, 0] },
        startSize: [0.55, 0.85],
        sizeOverLife: curve([0, 0.25], [0.2, 0.8], [1, 1.7]),
        opacityOverLife: curve([0, 0], [0.1, 0.5], [0.5, 0.3], [1, 0]),
        map: vfxTexture('smoke-textured-puff-7'),
        colorSource: 'tint',
        tint: [0.42, 0.65, 0.75, 0.35],
        emission: 0,
        lit: true,
        drag: 1.3,
        rotation: { start: [-Math.PI, Math.PI] },
        transform: { position: [0, 0.15, 0] },
        orderInLayer: 8,
      });
      fx.particles({
        startLife: 0.65,
        startSize: 2.2,
        map: vfxTexture('hovl-aoe-crater'),
        mode: 'horizontal',
        colorSource: 'tint',
        tint: [0.1, 0.35, 0.55, 0.55],
        emission: 0.2,
        blend: 'alpha',
        sizeOverLife: curve([0, 0.3], [0.2, 1], [1, 1]),
        opacityOverLife: curve([0, 0], [0.12, 0.7], [1, 0]),
        rotation: { enabled: false },
        transform: { position: [0, 0.02, 0] },
        orderInLayer: 5,
      });
      fx.flash({
        life: 0.1,
        size: 0.7,
        map: vfxTexture('hovl-crystals-flash-core'),
        emission: 1.4,
        tint: [0.55, 0.85, 1, 0.8],
        transform: { position: [0, 0.12, 0] },
      });
      fx.light({
        life: 0.12,
        intensity: 2.5,
        range: 4,
        color: [0.3, 0.65, 1],
        curve: curve([0, 1], [1, 0]),
      });
    },
  });
}
const ARMS = 7;
const SEGMENTS = 6;
const RESTRIKE = 0.145;
function hash(value: number): number {
  const n = Math.sin(value * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
}
function discharge(age: number, halo: boolean, variation = 0): readonly VfxBillboardPathPoint[] {
  const cycle = age >= RESTRIKE ? 1 : 0;
  const points: VfxBillboardPathPoint[] = [];
  for (let arm = 0; arm < ARMS; arm += 1) {
    const elapsed = age - cycle * RESTRIKE - (arm % 3) * 0.006;
    const life = cycle === 0 ? 0.105 : 0.1;
    if (elapsed <= 0 || elapsed >= life) continue;
    const pulse = Math.sin((Math.PI * elapsed) / life);
    const tick = Math.floor(elapsed * 36);
    // A few long conductors carry the silhouette; shorter, thinner tributaries break radial symmetry.
    const major = arm % 3 === 0 || arm === 5;
    const energy = major
      ? 0.8 + hash(arm + variation * 3) * 0.2
      : 0.3 + hash(arm + variation * 3) * 0.3;
    const angle =
      (arm * Math.PI * 2) / ARMS +
      (hash(arm + variation * 7) - 0.5) * 0.6 +
      hash(variation + 7) * Math.PI * 2 +
      cycle * 0.27;
    const reach =
      ((major ? 0.7 : 0.28) + hash(arm * 13.7 + variation) * (major ? 0.35 : 0.24)) *
      (cycle === 0 ? 1 : 0.8);
    const first = points.length;
    for (let i = 0; i <= SEGMENTS; i += 1) {
      const t = i / SEGMENTS;
      const value = hash(arm * 127.1 + i * 311.7 + tick * 74.7 + cycle * 19.3 + variation * 11);
      const jag = (value - 0.5) * 0.22 * Math.sin(t * Math.PI);
      points.push({
        position: [
          Math.cos(angle) * reach * t - Math.sin(angle) * jag,
          Math.sin(angle) * reach * t + Math.cos(angle) * jag,
          0.025 + Math.sin(t * Math.PI) * 0.025,
        ],
        width: (halo ? 0.08 : 0.03) * pulse * energy * Math.pow(1 - t, 0.65),
        u: t,
        age: elapsed / life,
        ...(i === 0 ? { connected: false } : {}),
      });
    }
    const branch = points[first + 3];
    if (!branch) continue;
    const forkAngle = angle + (arm % 2 === 0 ? 0.7 : -0.7);
    points.push({ ...branch, width: branch.width * 0.65, connected: false });
    points.push({
      position: [
        branch.position[0] + Math.cos(forkAngle) * 0.2,
        branch.position[1] + Math.sin(forkAngle) * 0.2,
        0.07,
      ],
      width: branch.width * 0.3,
      u: 0.5,
      age: elapsed / life,
    });
    points.push({
      position: [
        branch.position[0] + Math.cos(forkAngle) * 0.34,
        branch.position[1] + Math.sin(forkAngle) * 0.34,
        0.035,
      ],
      width: 0,
      u: 1,
      age: elapsed / life,
    });
  }
  return points;
}
function boltProfile(ctx: VfxParticleContext): Node<'float'> {
  return (ctx.uv as Node<'vec2'>).y.mul(Math.PI).sin().max(0);
}
function boltLook(halo: boolean): VfxLayerLook {
  return {
    colorNode: (ctx) =>
      halo
        ? mix(vec3(0.01, 0.04, 0.25), vec3(0.04, 0.3, 1.3), boltProfile(ctx).pow(2))
        : vec3(0.85, 1.7, 2.5),
    opacityNode: (ctx) =>
      boltProfile(ctx)
        .pow(halo ? 0.6 : 1)
        .mul(halo ? 0.85 : 0.95),
  };
}
/** Creates the grand electric hit composition; game code owns placement and events. */
// Choose params.variation once per hit (0..65535) to vary the branch pattern; do not animate it during playback.
export function createElectricHit(id: string): VfxDefinition {
  return defineVfx({
    id,
    duration: 0.6,
    maxInstances: 4,
    seed: 7,
    params: { variation: { default: 0, min: 0, max: 65535 } },
    build(fx) {
      for (const halo of [true, false]) {
        fx.path({
          id: halo ? 'discharge-halo' : 'discharge-core',
          maxSegments: ARMS * (SEGMENTS + 4),
          sample: (age, context) => {
            const variation = context?.param('variation') ?? 0;
            return discharge(age, halo, typeof variation === 'number' ? variation : 0);
          },
          look: boltLook(halo),
          blend: 'alpha',
          orderInLayer: halo ? 10 : 11,
        });
      }
      fx.particles({
        startLife: 0.09,
        startSize: 0.45,
        sizeOverLife: curve([0, 0.5], [0.15, 1], [1, 0]),
        opacityOverLife: curve([0, 1], [1, 0]),
        map: vfxTexture('flash-radial-spikes-6'),
        colorSource: 'tint',
        tint: [0.75, 0.9, 1, 0.9],
        emission: 1.6,
        blend: 'alpha',
        orderInLayer: 12,
        rotation: { start: RANDOM_YAW },
        transform: { position: [0, 0, 0.04] },
      });
      fx.particles({
        capacity: 16,
        startLife: [0.2, 0.43],
        startSpeed: [1.5, 3],
        direction: [0, 0, 1],
        spread: 1,
        shape: { type: 'sphere', radius: [0, 0.025] },
        drag: 2.5,
        startSize: [0.015, 0.028],
        sizeOverLife: curve([0, 1], [0.7, 0.65], [1, 0]),
        opacityOverLife: curve([0, 1], [0.7, 0.6], [1, 0]),
        map: vfxTexture('point-vortex-1'),
        colorSource: 'tint',
        tint: [0.16, 0.5, 1, 1],
        emission: 1.6,
        blend: 'alpha',
        mode: 'stretched',
        stretch: { speedFactor: 0.035, lengthFactor: 1.5 },
        transform: { position: [0, 0, 0.06] },
      });
      fx.light({
        color: [0.2, 0.5, 1],
        intensity: 1.3,
        range: 2,
        life: 0.16,
        curve: curve([0, 1], [0.15, 0.6], [1, 0]),
        position: [0, 0, 0.12],
      });
    },
  });
}
const ACID_COL = [
  { t: 0, rgba: [1, 1, 0.7, 0] },
  { t: 0.15, rgba: [0.8, 1, 0.45, 1] },
  { t: 0.6, rgba: [0.55, 0.7, 0.35, 0.7] },
  { t: 1, rgba: [0.3, 0.4, 0.18, 0] },
] as const;
/** Creates the caustic rupture composition; game code owns placement and events. */
// Copy this for a confirmed horizontal-surface hit; local +Y is the surface normal. Residue is cosmetic: game code owns damage and hazard expiry.
// Droplet collision uses local Y=0. Place the play at the receiving plane; this preset does not conform to slopes or walls.
export function createAcidImpact(id: string): VfxDefinition {
  return defineVfx({
    id,
    duration: 4.8,
    maxInstances: 4,
    seed: 31,
    build(fx) {
      fx.particles({
        startLife: 0.65,
        startSize: 2.8,
        opacityOverLife: curve([0, 0], [0.04, 1], [0.8, 1], [1, 0]),
        map: vfxTexture('acid-animation-1'),
        blend: 'alpha',
        orderInLayer: 10,
        emission: 1.05,
        transform: { position: [0, 0.3, 0] },
        rotation: { enabled: false },
      });
      fx.particles({
        delay: 0.08,
        startLife: 4.3,
        startSize: 1.5 * 2.6,
        sizeOverLife: curve([0, 0.25], [0.15, 1], [1, 1]),
        colorOverLife: [
          { t: 0, rgba: [1, 1, 1, 0] },
          { t: 0.1, rgba: [1, 1, 1, 1] },
          { t: 0.6, rgba: [0.7, 0.75, 0.5, 0.85] },
          { t: 1, rgba: [0.3, 0.4, 0.1, 0] },
        ],
        map: vfxTexture('noise-colored-cell-1'),
        mask: {
          texture: vfxTexture('mask-oil-footprint-2'),
          channel: 'red',
          space: 'footprint',
          range: [0.2, 0.8],
        },
        distortion: {
          texture: vfxTexture('flow-direction-input-1'),
          mode: 'flow-dual',
          amount: 0.025,
          scroll: [0.09, 0.04],
        },
        blend: 'alpha',
        mode: 'horizontal',
        orderInLayer: 15,
        emission: 0.65,
        tint: [0.65, 0.85, 0.25, 0.9],
        transform: { position: [0, 0.025, 0] },
        rotation: { enabled: false },
      });
      fx.particles({
        delay: 0.18,
        startLife: 2.7,
        startSize: 4.5,
        sizeOverLife: curve([0, 0.65], [0.12, 1], [1, 1]),
        colorOverLife: GLOW_COL,
        map: vfxTexture('splat-filled-1'),
        blend: 'alpha',
        mode: 'horizontal',
        orderInLayer: 15,
        emission: 0.7,
        tint: [0.3, 0.4, 0.03, 0.6],
        transform: { position: [0, 0.03, 0] },
      });
      fx.particles({
        capacity: 18,
        delay: 0.06,
        startLife: 1.5,
        startSpeed: [1.7, 3.5],
        spread: 1,
        direction: [0, 1, 0],
        shape: { type: 'cone', radius: 0.15, angle: 0.9 },
        gravity: -5,
        startSize: [0.045, 0.12],
        sizeOverLife: curve([0, 1], [1, 0.7]),
        map: vfxTexture('bubble-shaded-1'),
        blend: 'alpha',
        orderInLayer: 20,
        emission: 0.85,
        tint: [0.55, 0.85, 0.15, 0.9],
        collision: { bounce: 0, friction: 1, normal: [0, 1, 0], distance: 0, killOnHit: true },
        transform: { position: [0, 0.15, 0] },
        rotation: { enabled: false },
      });
      fx.particles({
        capacity: 12,
        rateOverTime: 6,
        duration: 2.3,
        delay: 0.45,
        startLife: [0.4, 0.8],
        startSpeed: 0.06,
        direction: [0, 1, 0],
        spread: 0,
        shape: { type: 'box', size: [1.5, 0.01, 1.5] },
        startSize: [0.12, 0.3],
        sizeOverLife: curve([0, 0], [0.75, 1], [0.9, 1.15], [1, 0]),
        colorOverLife: ACID_COL,
        map: vfxTexture('bubble-shaded-1'),
        blend: 'alpha',
        orderInLayer: 10,
        emission: 0.8,
        tint: [0.65, 0.9, 0.12, 0.85],
        transform: { position: [0, 0.07, 0] },
        rotation: { enabled: false },
      });
      fx.particles({
        capacity: 12,
        rateOverTime: 4,
        duration: 1.8,
        delay: 0.65,
        startLife: 1,
        startSpeed: 0.16,
        direction: [0, 1, 0],
        spread: 0.15,
        shape: { type: 'box', size: [1.5, 0.04, 1.5] },
        startSize: [0.6, 1],
        aspect: 1.6,
        colorOverLife: ACID_COL,
        map: vfxTexture('smoke-body-animation-1'),
        blend: 'alpha',
        orderInLayer: 10,
        emission: 0.85,
        tint: [0.65, 0.8, 0.3, 0.28],
        transform: { position: [0, 0.18, 0] },
        rotation: { enabled: false },
      });
    },
  });
}
}

namespace CombatFeedbackRecipe {
function addMetalContact(fx: VfxKitBuilder): void {
  // Contact core, irregular flash and airborne metal separate in time and scale.
  fx.particles({
    startLife: 0.055,
    startSize: 0.65,
    map: vfxTexture('flash-radial-spikes-6'),
    coverage: 'red',
    colorSource: 'tint',
    blend: 'additive',
    tint: [1, 0.8, 0.45, 1],
    emission: 5.5,
    sizeOverLife: curve([0, 0.6], [0.12, 1], [1, 0]),
    rotation: { start: -0.3 },
  });
  fx.particles({
    startLife: 0.26,
    startSize: 2.15,
    map: vfxTexture('solid'),
    blend: 'additive',
    emission: 0.9,
    aspect: 1,
    tint: [1, 1, 1, 0.85],
    look: atlasLook({
      thresholds: [0.04, 0.45, 0.45, 0.95],
      densityPower: 0.8,
      densityCoverage: [0.005, 0.12],
      ...getVfxTextureSampling('special-shockwave-fractured-8'),
      texture: vfxTexture('special-shockwave-fractured-8'),
      dark: [0.2, 0.08, 0.015],
      mid: [1, 0.62, 0.18],
      hot: [1.8, 1.7, 1.1],
      coverage: 'rgb',
    }),
    sizeOverLife: curve([0, 0.7], [0.35, 1], [1, 1.12]),
    opacityOverLife: curve([0, 0], [0.025, 1], [0.7, 0.65], [1, 0]),
    rotation: { start: -0.3 },
  });
  for (const fine of [false, true]) {
    const count = fine ? 64 : 23;
    const velocities: Vec3[] = Array.from({ length: count }, (_, i) => {
      const hash = ((i + 1) * 0.61803398875) % 1;
      const angle = i % 4 === 0 ? hash * Math.PI * 2 : hash * 1.65 - 0.55;
      const speed = 7.5 * (0.35 + (((i + 1) * 0.754877666) % 1));
      return [Math.cos(angle) * speed, Math.sin(angle) * speed * 0.8, 0.3 + hash * 1.1];
    });
    if (!fine) {
      fx.path({
        id: 'metal-flights',
        maxSegments: count * 8 - 1,
        blend: 'additive',
        sample(age) {
          if (age <= 0) return [];
          return velocities.flatMap((velocity, spark) => {
            const life = 0.25 + (spark % 5) * 0.035;
            if (age >= life) return [];
            const drag = 1.8 + (spark % 3) * 0.5;
            const tail = Math.max(0, age - (0.05 + (spark % 3) * 0.014));
            const presence = (1 - age / life) ** 0.55;
            return Array.from({ length: 8 }, (_, j): VfxBillboardPathPoint => {
              const u = j / 7,
                t = tail + (age - tail) * u;
              const travel = (1 - Math.exp(-drag * t)) / drag;
              return {
                position: [
                  velocity[0] * travel,
                  velocity[1] * travel - 7 * t * t,
                  velocity[2] * travel + 0.015,
                ],
                width: (0.012 + (spark % 3) * 0.004) * presence * Math.sin(Math.PI * u) ** 0.45,
                u,
                age: presence,
                connected: j !== 0,
              };
            });
          });
        },
        look: {
          textures: {
            streak: { texture: vfxTexture('trail-taper-right-1'), colorSpace: 'linear' },
          },
          colorNode: (ctx) => mix(vec3(1.5, 0.12, 0.008), vec3(6, 3.8, 1.6), ctx.uv.x),
          opacityNode: (ctx) => {
            const texel = ctx.sampleTexture?.('streak', ctx.uv) as Node<'vec4'> | undefined;
            if (!texel) throw new Error('Metal streak texture is missing.');
            return texel.r.mul(ctx.progress);
          },
        },
      });
      continue;
    }
    fx.particles({
      capacity: count,
      startLife: [0.08, 0.25],
      startSize: [0.007, 0.015],
      mode: 'stretched',
      stretch: { speedFactor: 0, lengthFactor: 2 },
      samples: { points: velocities.map(() => [0, 0, 0.015]), velocities },
      simulationSpace: 'world',
      gravity: -7,
      drag: 3.8,
      map: vfxTexture('trail-taper-right-1'),
      coverage: 'red',
      colorSource: 'tint',
      blend: 'additive',
      emission: 4,
      colorOverLife: [
        { t: 0, rgba: [1, 0.9, 0.6, 1] },
        { t: 0.25, rgba: [1, 0.52, 0.12, 1] },
        { t: 1, rgba: [0.4, 0.035, 0.002, 0] },
      ],
      sizeOverLife: curve([0, 1], [0.3, 0.8], [1, 0.1]),
      rotation: { enabled: false },
    });
  }
  fx.light({
    color: [1, 0.42, 0.08],
    intensity: 4,
    range: 2,
    life: 0.1,
    curve: curve([0, 1], [0.2, 0.7], [1, 0]),
  });
}
/** Plays only after gameplay confirms a parry; attack resolution and hit-stop remain game-owned. */
export function createCombatFeedback(id: string): VfxDefinition {
  return defineVfx({
    id,
    duration: 0.7,
    maxInstances: 12,
    seed: 73,
    build(fx) {
      addMetalContact(fx);
    },
  });
}
}

namespace BloodHitRecipe {
const SPRAY = {
  positions: [0, -0.5, 0, 1, -0.5, 0, 1, 0.5, 0, 0, 0.5, 0],
  uvs: [0, 0, 1, 0, 1, 1, 0, 1],
  indices: [0, 1, 2, 0, 2, 3],
};
/** Short gameplay hit: no scheduled stain, global floor assumption or demo contact. */
// Copy this file. Local +X points out of the wound. Prepare the impact and stain separately so long-lived stains do not occupy wound-spray slots.
// Play the impact unparented at the hit with a quaternion from +X to the spray direction. Its groundNormal and groundDistance params describe a normalized world plane, dot(normal, point)=distance; zero normal with distance=-1 disables clipping.
// Use bloodStainPlacement from surface-mark.ts only with an actual game-owned surface intersection; it offsets along the normal and faces local +Z out of that surface. The quad does not project over edges or onto curved geometry.
export function createBloodImpact(id: string): VfxDefinition {
  return defineVfx({
    id,
    duration: 0.65,
    maxInstances: 12,
    seed: 61,
    params: { groundNormal: { default: [0, 0, 0] }, groundDistance: { default: -1 } },
    build(fx) {
      const normal = fx.param('groundNormal') as Node<'vec3'>,
        distance = fx.param('groundDistance') as Node<'float'>;
      const clip = {
        opacityNode: (ctx: { readonly position: Node<'vec3'>; readonly uv: Node<'vec2'> }) => {
          const edge = ctx.uv.sub(0.5).mul(2).length().smoothstep(0.65, 1).oneMinus();
          return dot(ctx.position, normal).sub(distance).greaterThanEqual(0).select(1, 0).mul(edge);
        },
      };
      for (const angle of [0, Math.PI / 2])
        fx.particles({
          startLife: 0.24,
          startSize: [0.85, 1.15],
          rotation: { enabled: false },
          sizeOverLife: curve([0, 0.7], [0.45, 1], [1, 1.08]),
          opacityOverLife: curve([0, 1], [0.65, 0.8], [1, 0]),
          transform: {
            position: [0.01, 0, 0],
            rotation: [Math.sin(angle / 2), 0, 0, Math.cos(angle / 2)],
          },
          mesh: { geometry: SPRAY, side: 'double', scale: [1, 0.7, 1] },
          map: vfxTexture('blood-spray-animation-1'),
          blend: 'alpha',
          tint: [0.3, 0.25, 0.25, 0.9],
          emission: 1,
          orderInLayer: 10,
        });
      fx.particles({
        capacity: 24,
        startLife: [0.32, 0.55],
        startSpeed: [2.6, 5.2],
        startSize: [0.012, 0.035],
        sizeOverLife: curve([0, 0.5], [0.08, 1], [0.7, 0.65], [1, 0]),
        direction: [1, 0.18, 0],
        spread: 0.35,
        shape: { type: 'sphere', radius: 0.035 },
        gravity: -8,
        drag: 0.25,
        simulationSpace: 'world',
        mode: 'stretched',
        stretch: { speedFactor: 0, lengthFactor: 2.4 },
        map: vfxTexture('point-solid-2'),
        look: clip,
        blend: 'alpha',
        tint: [0.18, 0.004, 0.002, 0.9],
        emission: 1,
        orderInLayer: 20,
      });
      fx.particles({
        capacity: 2,
        startLife: 0.28,
        startSpeed: [0.5, 1.2],
        startSize: [0.22, 0.4],
        sizeOverLife: curve([0, 0.6], [1, 1.3]),
        opacityOverLife: curve([0, 0.4], [0.3, 0.2], [1, 0]),
        direction: [1, 0.05, 0],
        spread: 0.5,
        shape: { type: 'sphere', radius: 0.04 },
        simulationSpace: 'world',
        look: clip,
        map: vfxTexture('smoke-irregular-wisp-7'),
        blend: 'alpha',
        tint: [0.12, 0.005, 0.003, 0.25],
        emission: 1,
        orderInLayer: 15,
      });
    },
  });
}
}

export const createIceImpact = ElementalHitRecipes.createIceImpact;
export const createIceContact = ElementalHitRecipes.createIceContact;
export const createCrystalImpact = ElementalHitRecipes.createCrystalImpact;
export const createElectricHit = ElementalHitRecipes.createElectricHit;
export const createAcidImpact = ElementalHitRecipes.createAcidImpact;
export const createCombatFeedback = CombatFeedbackRecipe.createCombatFeedback;
export const createBloodImpact = BloodHitRecipe.createBloodImpact;

export default createIceImpact('example.elemental-hit');
