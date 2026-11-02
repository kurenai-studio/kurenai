// intent: Muzzle flash and confirmed ricochet feedback.
// variants: components: createMuzzleFlash(id), createRicochet(id)
// inputs: muzzle socket; confirmed reflected direction
// Copy dependencies: none.
// Event binding: playOptions: { parent: unscaledMuzzleAnchor, params: { variation: shotVariation } }. Trigger on the real shot and retain the socket until finished.
// Setup in an async scene: const effect = createMuzzleFlash("game.muzzle");
// const vfx = useVfx(context); await vfx.prepare(effect, {});
// const handle = vfx.play(effect, playOptions);
// Import useVfx (and createVfxPointSource when needed) from wanaka-studio-engine/vfx. Prepare once; construct playOptions from the game inputs above per event.
// Update the selected recipe's declared params from gameplay; await handle.finished for complete drain.
// Immediate cancellation: handle.stop({ immediate: true }). Persistent holds end on the game's state/event.
import { sampleVfxLookTexture as sample } from 'wanaka-studio-engine/vfx';
import { vec2, vec3 } from 'three/tsl';
import { type Node } from 'three/webgpu';
import {
  vfxPlaneClip,
  BURST_SIZE,
  type Vec3,
  RANDOM_YAW,
  curve,
  defineVfx,
  vfxTexture,
  type VfxDefinition,
  type VfxLayerLook,
} from 'wanaka-studio-engine/vfx';

function flameMesh(): {
  readonly positions: number[];
  readonly uvs: number[];
  readonly indices: number[];
} {
  const positions: number[] = [],
    uvs: number[] = [],
    indices: number[] = [];
  const profile = [
    [0, 0.018],
    [0.18, 0.085],
    [0.55, 0.055],
    [1, 0],
  ] as const;
  for (let fin = 0; fin < 3; fin += 1) {
    const angle = (fin * Math.PI) / 3;
    const base = positions.length / 3;
    for (const [u, width] of profile) {
      for (const side of [-1, 1]) {
        positions.push(
          u * (0.44 + fin * 0.025) - 0.025,
          Math.cos(angle) * width * side,
          Math.sin(angle) * width * side,
        );
        uvs.push(u, (side + 1) / 2);
      }
    }
    for (let i = 0; i < profile.length - 1; i += 1) {
      const a = base + i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  return { positions, uvs, indices };
}
function flameLook(core: boolean, variation: Node<'float'>): VfxLayerLook {
  return {
    textures: core ? {} : { flame: { texture: vfxTexture('muzzle-held-1'), colorSpace: 'linear' } },
    colorNode: () => (core ? vec3(2.4, 1.65, 0.7) : vec3(1.5, 0.47, 0.065)),
    opacityNode(ctx) {
      const uv = ctx.uv as Node<'vec2'>;
      const sides = uv.y
        .sub(0.5)
        .abs()
        .mul(2)
        .smoothstep(core ? 0.25 : 0.55, 1)
        .oneMinus();
      const tip = uv.x.smoothstep(0.7, 1).oneMinus();
      // This is a held 2x2 variant atlas. Alpha carries coverage; RGB stays white even in transparent texels.
      const frame = variation.floor().clamp(0, 3);
      // A one-texel inset prevents bilinear sampling from an adjacent variant.
      const atlasUv = uv
        .mul(0.5 - 2 / 1024)
        .add(vec2(frame.mod(2), frame.div(2).floor()).mul(0.5))
        .add(1 / 1024);
      const density = core
        ? 0.85
        : sample(ctx, 'flame', atlasUv)
            .a.mul(0.8)
            .max(uv.x.smoothstep(0.05, 0.25).oneMinus().mul(0.45));
      return sides.mul(tip).mul(density);
    },
  };
}
const FLAME = flameMesh();
const SMOKE: VfxLayerLook = {
  textures: { smoke: { texture: vfxTexture('smoke-irregular-wisp-7'), colorSpace: 'linear' } },
  colorNode: (ctx) =>
    vec3(0.1, 0.115, 0.13).add(sample(ctx, 'smoke').x.mul(vec3(0.12, 0.13, 0.14))),
  opacityNode(ctx) {
    const edge = (ctx.uv as Node<'vec2'>)
      .sub(vec2(0.5, 0.5))
      .mul(2)
      .length()
      .smoothstep(0.55, 1)
      .oneMinus();
    // RGB shades the interior; alpha owns the wisp silhouette.
    return sample(ctx, 'smoke').a.mul(edge).mul(0.65);
  },
};
/** Creates the grand muzzle composition; game code owns placement and events. */
// Use an unscaled socket root. For a scaled model bone, copy its muzzle world pose to an unscaled sibling after animation.
// Choose params.variation (integer 0..3) once per shot. Keep the socket until handle.finished; cancel with stop({ immediate: true }). Gameplay owns firing and hits.
export function createMuzzleFlash(id: string): VfxDefinition {
  return defineVfx({
    id,
    duration: 0.85,
    seed: 7,
    maxInstances: 12,
    params: { variation: { default: 0, min: 0, max: 3 } },
    build(fx) {
      const variation = fx.param('variation') as Node<'float'>;
      for (const core of [false, true]) {
        fx.particles({
          startLife: core ? 0.055 : 0.07,
          startSize: 1,
          sizeOverLife: curve([0, 0.7], [0.15, 1], [1, 0.8]),
          opacityOverLife: curve([0, 1], [0.25, 0.85], [1, 0]),
          map: vfxTexture('solid'),
          mesh: { geometry: FLAME, side: 'double', scale: core ? [0.72, 0.45, 0.45] : [1, 1, 1] },
          look: flameLook(core, variation),
          blend: 'alpha',
          simulationSpace: 'local',
          rotate: false,
          orderInLayer: core ? 12 : 11,
        });
      }
      fx.particles({
        startLife: 0.055,
        startSize: 0.12,
        sizeOverLife: curve([0, 1], [1, 0.5]),
        opacityOverLife: curve([0, 1], [1, 0]),
        map: vfxTexture('flash-radial-spikes-6'),
        colorSource: 'tint',
        tint: [1, 0.84, 0.5, 0.8],
        emission: 1.8,
        blend: 'alpha',
        transform: { position: [0.015, 0, 0] },
        rotation: { start: RANDOM_YAW },
      });
      fx.particles({
        capacity: 5,
        startLife: [0.09, 0.19],
        startSpeed: [2.5, 4.5],
        direction: [1, 0, 0],
        spread: 0.18,
        shape: { type: 'sphere', radius: [0, 0.012] },
        drag: 3,
        startSize: [0.009, 0.017],
        sizeOverLife: curve([0, 1], [1, 0]),
        opacityOverLife: curve([0, 1], [1, 0]),
        map: vfxTexture('point-vortex-1'),
        colorSource: 'tint',
        tint: [1, 0.46, 0.08, 1],
        emission: 1.5,
        blend: 'alpha',
        mode: 'stretched',
        stretch: { speedFactor: 0.035, lengthFactor: 1.5 },
        simulationSpace: 'world',
        transform: { position: [0.025, 0, 0] },
      });
      fx.particles({
        capacity: 4,
        delay: 0.025,
        startLife: [0.4, 0.65],
        startSpeed: [0.3, 0.6],
        direction: [1, 0.45, 0],
        spread: 0.2,
        shape: { type: 'sphere', radius: [0, 0.012] },
        drag: 1.2,
        noise: { strength: 0.12, frequency: 2, scrollSpeed: 0.5 },
        startSize: [0.09, 0.15],
        sizeOverLife: curve([0, 0.7], [0.2, 1.4], [1, 3.2]),
        opacityOverLife: curve([0, 0], [0.15, 1], [1, 0]),
        map: vfxTexture('solid'),
        look: SMOKE,
        blend: 'alpha',
        simulationSpace: 'world',
        transform: { position: [0.025, 0, 0] },
        rotation: { start: RANDOM_YAW, spin: [-0.3, 0.3] },
      });
      fx.light({
        color: [1, 0.6, 0.24],
        intensity: 1.1,
        range: 1.2,
        life: 0.07,
        curve: curve([0, 1], [1, 0]),
        position: [0.06, 0, 0],
      });
    },
  });
}

/** Reuses the material-impact steel fan at a game-confirmed outgoing reflection. */
export function createRicochet(id: string): VfxDefinition {
  return createSteelImpact(id);
}
export default createMuzzleFlash('example.grand-muzzle');

const WORLD_CONTACT = { blend: 'alpha', simulationSpace: 'world', direction: [0, 1, 0] } as const;
// steel-deflection
// Play once at the game-confirmed metal contact, slightly outside the receiving surface. Rotate local +Y toward the game-selected outgoing spark fan; use an unparented play so old sparks stay in world space.
// Game code owns hit confirmation, damage and deflection. Immediate stop cancels the flash, light and remaining sparks; no debris bounce is simulated.
const FINE_SPEEDS = [0.55, 1.5, 3.6] as const;
const FINE_SIZE = curve([0, 1], [0.35, 1], [0.7, 0.5], [1, 0]);
const SPARK_SIZE = curve([0, 1], [0.2, 0.85], [0.65, 0.4], [1, 0]);
const FINE_COLOR = [
  { t: 0, rgba: [1, 0.9, 0.58, 1] as const },
  { t: 0.35, rgba: [1, 0.8, 0.38, 1] as const },
  { t: 0.7, rgba: [1, 0.32, 0.045, 0.85] as const },
  { t: 1, rgba: [0.45, 0.055, 0.005, 0] as const },
];
const FLASH_COLOR = [
  { t: 0, rgba: [1, 0.92, 0.65, 1] as const },
  { t: 0.25, rgba: [1, 0.7, 0.25, 1] as const },
  { t: 1, rgba: [1, 0.22, 0.025, 0] as const },
];
const SPARK_COLOR = [
  { t: 0, rgba: [1, 0.76, 0.32, 1] as const },
  { t: 0.35, rgba: [1, 0.4, 0.075, 1] as const },
  { t: 1, rgba: [0.7, 0.08, 0.005, 0] as const },
];
/** Returns the steel-deflection composition at a game-owned pose. */
function createSteelImpact(id: string): VfxDefinition {
  return defineVfx({
    id,
    duration: 0.65,
    maxInstances: 12,
    seed: 43,
    params: { surfaceNormal: { default: [0, 0, 0] as Vec3 }, surfaceDistance: { default: -1 } },
    build(fx) {
      const clip = vfxPlaneClip(
        fx.param('surfaceNormal') as Node<'vec3'>,
        fx.param('surfaceDistance') as Node<'float'>,
      );
      fx.particles({
        startLife: 0.045,
        startSize: 0.28,
        sizeOverLife: curve([0, 1], [0.3, 0.85], [1, 0]),
        colorOverLife: FLASH_COLOR,
        map: vfxTexture('flare-four-point-1'),
        blend: 'alpha',
        tint: [1, 1, 1, 1],
        emission: 3.2,
        orderInLayer: 10,
        rotation: { enabled: false },
      });
      for (const [index, speed] of FINE_SPEEDS.entries()) {
        const count = 24 - index * 8;
        fx.particles({
          ...WORLD_CONTACT,
          look: clip,
          capacity: count,
          bursts: [{ time: 0, count }],
          startLife: [0.07, 0.11 + index * 0.065],
          startSpeed: [speed * 0.4, speed],
          startSize: [0.006, 0.015],
          sizeOverLife: FINE_SIZE,
          colorOverLife: FINE_COLOR,
          spread: 0.85,
          shape: { type: 'sphere', radius: [0, 0.008] },
          gravity: -9.8,
          drag: 2,
          mode: 'stretched',
          stretch: { speedFactor: 0, lengthFactor: 3 },
          map: vfxTexture('point-soft-5'),
          tint: [1, 1, 1, 1],
          emission: 4,
          orderInLayer: 20,
        });
      }
      fx.particles({
        ...WORLD_CONTACT,
        look: clip,
        capacity: 14,
        startLife: [0.15, 0.36],
        startSpeed: [3.5, 7],
        startSize: [0.006, 0.013],
        sizeOverLife: SPARK_SIZE,
        colorOverLife: SPARK_COLOR,
        spread: 0.75,
        shape: { type: 'sphere', radius: [0, 0.008] },
        gravity: -9.8,
        drag: 0.5,
        mode: 'stretched',
        stretch: { speedFactor: 0, lengthFactor: 9 },
        map: vfxTexture('point-soft-5'),
        tint: [1, 1, 1, 1],
        emission: 5,
        orderInLayer: 20,
      });
      fx.particles({
        ...WORLD_CONTACT,
        look: clip,
        capacity: 6,
        startLife: [0.18, 0.42],
        startSpeed: [1.1, 3.2],
        startSize: [0.005, 0.011],
        sizeOverLife: BURST_SIZE,
        spread: 0.9,
        shape: { type: 'sphere', radius: [0, 0.012] },
        gravity: -9.8,
        colorOverLife: SPARK_COLOR,
        drag: 0.4,
        map: vfxTexture('point-soft-5'),
        tint: [1, 1, 1, 1],
        emission: 2.5,
        orderInLayer: 20,
      });
      fx.light({
        color: [1, 0.45, 0.12],
        intensity: 4,
        range: 0.7,
        life: 0.035,
      });
    },
  });
}
