// intent: Mesh reformation, hologram, dissolve departure and shadow smoke.
// variants: host reveal: createMeshReformation(id), createHologram(id, repeat); host departure: createTeleportDeparture(id), createShadowEnvelope(id, textureVariant, options)
// inputs: model variants and smoke dissolve prepare/play with host; optional smoke-only uses a committed feet pose
// Copy dependencies: ./shared/special-pack.ts.
// Event binding: Use the actual model as host for prepare/play. The game owns reveal/departure timing and visibility; smoke-only uses a feet pose instead.
// Setup in an async scene: const effect = createMeshReformation("game.appearance");
// const vfx = useVfx(context); await vfx.prepare(effect, { host });
// const handle = vfx.play(effect, { host });
// Import useVfx (and createVfxPointSource when needed) from wanaka-studio-engine/vfx. Prepare once; construct playOptions from the game inputs above per event.
// Update the selected recipe's declared params from gameplay; await handle.finished for complete drain.
// Immediate cancellation: handle.stop({ immediate: true }). Persistent holds end on the game's state/event.
// Departure integration: retain the original host for cancellation; an early stop restores
// mesh visibility, not scene membership or gameplay position. Natural conceal completion
// leaves original meshes hidden. Gameplay owns destination, relocation and arrival.
// createTeleportDeparture uses model-space position/normalized height, without host UVs;
// DISSOLVE, SHARD_LIFE and point count/size tune its cadence. Prepare/play on the actual host.
import {
  cos,
  float,
  fract,
  mix,
  sin,
  cos as tslCos,
  fract as tslFract,
  mix as tslMix,
  normalize as tslNormalize,
  oneMinus as tslOneMinus,
  sin as tslSin,
  smoothstep as tslSmoothstep,
  vec2 as tslVec2,
  vec2,
  vec3,
} from 'three/tsl';
import { type Node } from 'three/webgpu';
import {
  curve,
  defineVfx,
  MOTE_SIZE,
  vfxTexture,
  type VfxDefinition,
  type VfxKitBuilder,
  type VfxLayerLook,
  type VfxParticleContext,
} from 'wanaka-studio-engine/vfx';
import { specialLook, specialTexture } from './shared/special-pack.js';

const SPECIAL_SMOKE = [
  vfxTexture('special-smoke-1'),
  vfxTexture('special-smoke-2'),
  vfxTexture('special-smoke-3'),
  vfxTexture('special-smoke-4'),
  vfxTexture('special-smoke-5'),
  vfxTexture('special-smoke-6'),
  vfxTexture('special-smoke-7'),
  vfxTexture('special-smoke-8'),
  vfxTexture('special-smoke-9'),
  vfxTexture('special-smoke-10'),
  vfxTexture('special-smoke-11'),
  vfxTexture('special-smoke-12'),
  vfxTexture('special-smoke-13'),
  vfxTexture('special-smoke-14'),
  vfxTexture('special-smoke-15'),
  vfxTexture('special-smoke-16'),
] as const;

const FORM = 2.1;
const DURATION = 2.7;
const EROSION_TEXTURES = {
  noise: {
    texture: vfxTexture('noise-cloud-contrasty-1'),
    colorSpace: 'linear' as const,
    wrap: 'repeat' as const,
  },
};
const erosionFields = new WeakMap<VfxParticleContext, Node<'float'>>();
/** Rest-pose sampling keeps the holes attached while the model animates. */
function erosionField(ctx: VfxParticleContext): Node<'float'> {
  const cached = erosionFields.get(ctx);
  if (cached) return cached;
  const sample = ctx.sampleTexture;
  if (!sample) throw new Error('Surface erosion noise is not bound.');
  const p = ctx.hostRestUnit as Node<'vec3'>;
  const broad = (sample('noise', p.xy.mul(vec2(1.8, 2.4)).add(p.z.mul(0.73))) as Node<'vec4'>).r;
  const side = (sample('noise', p.zy.mul(vec2(2.2, 2.7)).add(0.37)) as Node<'vec4'>).r;
  const fine = (sample('noise', p.xy.mul(vec2(8, 9)).add(p.z.mul(2.1))) as Node<'vec4'>).r;
  const field = broad.mul(0.55).add(side.mul(0.29)).add(fine.mul(0.06)).add(p.y.mul(0.1));
  erosionFields.set(ctx, field);
  return field;
}
function hotEdge(distance: Node<'float'>): Node<'vec3'> {
  const d = distance.abs();
  const rim = d.smoothstep(0.006, 0.055).oneMinus();
  const core = d.smoothstep(0.002, 0.017).oneMinus();
  return mix(vec3(5, 0.32, 0.003), vec3(12, 5, 0.08), core).mul(rim);
}
/** Include heat in the surface color so unlit character materials show the same rim. */
function erodedColor(ctx: VfxParticleContext, distance: Node<'float'>): Node<'vec3'> {
  const scorched = distance.abs().smoothstep(0.035, 0.095).oneMinus();
  return mix((ctx.color as Node<'vec4'>).rgb, vec3(0.018, 0.003, 0.001), scorched)
    .add(hotEdge(distance));
}
function front(ctx: VfxParticleContext): Node<'float'> {
  return ctx.age.div(FORM).mul(1.36).sub(0.3);
}
function arrival(ctx: VfxParticleContext): Node<'float'> {
  const lead = hash(ctx.index as Node<'float'>, 23.7)
    .mul(0.14)
    .add(0.22);
  return front(ctx).sub(erosionField(ctx)).add(lead).div(lead).clamp(0, 1).smoothstep(0, 1);
}
/** Reconstructs a live host and restores its original materials and visibility after 2.7 seconds. */
// Copy this file; prepare createMeshReformation(uniqueId) with the same host passed to play. Keep that host in the scene; live skinning is followed. Play at a committed horizontal foot contact with an unscaled root; fit.height=1.8 normalizes authored sizes.
// The effect hides the original meshes during takeover and restores their prior visibility on completion or immediate cancellation. Do not change mesh visibility while it plays. Game code owns actor activation, animation, collisions and interruption; restoration does not authorize gameplay.
// Surface, rim and converging dust share one rest-pose noise field. Dust reaches its attachment before fading into the original surface; this uses cutout and fine particles rather than rigid model chunks. It does not change topology, create an actor, collide fragments with terrain or project onto slopes. Avoid root travel during the ground-arrival phase.
export function createMeshReformation(id: string): VfxDefinition {
  return defineVfx({
    id,
    duration: DURATION,
    maxInstances: 4,
    seed: 23,
    host: { takeover: 'reveal', pose: 'follow', fit: { height: 1.8 } },
    build(fx) {
      fx.hostShell({
        blend: 'cutout',
        orderInLayer: 4,
        look: {
          textures: EROSION_TEXTURES,
          colorNode: (ctx) => erodedColor(ctx, front(ctx).sub(erosionField(ctx))),
          opacityNode: (ctx) => front(ctx).sub(erosionField(ctx)).smoothstep(-0.008, 0.008),
        },
        emissive(ctx) {
          return hotEdge(front(ctx).sub(erosionField(ctx)))
            .mul(ctx.age.sub(FORM).div(0.3).clamp(0, 1).oneMinus());
        },
      });
      fx.hostPoints({
        count: 320,
        size: [0.006, 0.018],
        blend: 'alpha',
        look: {
          textures: {
            ...EROSION_TEXTURES,
            dust: { texture: vfxTexture('point-soft-5'), colorSpace: 'linear' },
          },
          colorNode(ctx) {
            const t = arrival(ctx);
            return mix(vec3(4, 0.25, 0.01), vec3(10, 3.5, 0.25), t);
          },
          opacityNode(ctx) {
            const sample = ctx.sampleTexture;
            if (!sample) throw new Error('Reformation dust texture is missing.');
            const texel = sample('dust', ctx.uv) as Node<'vec4'>;
            const density = texel.r
              .mul(texel.a)
              .mul(ctx.uv.sub(0.5).length().smoothstep(0.22, 0.49).oneMinus());
            const distance = front(ctx).sub(erosionField(ctx));
            return density
              .mul(arrival(ctx).smoothstep(0, 0.16))
              .mul(distance.smoothstep(0.015, 0.1).oneMinus())
              .mul(0.85);
          },
          positionNode(ctx) {
            const rest = ctx.positionLocal as Node<'vec3'>,
              t = arrival(ctx);
            const index = ctx.index as Node<'float'>;
            const angle = hash(index, 17.3).mul(Math.PI * 2);
            const radius = hash(index, 41.9).mul(0.65).add(0.2);
            const start = vec3(
              rest.x.add(cos(angle).mul(radius)),
              rest.y.mul(hash(index, 71.2).mul(0.7).add(0.15)).add(0.06),
              rest.z.add(sin(angle).mul(radius)),
            );
            const curl = vec3(sin(angle.add(t.mul(2))), float(0.6), cos(angle.add(t.mul(2))));
            return mix(start, rest, t)
              .add(curl.mul(t.mul(Math.PI).sin()).mul(radius.mul(0.18)))
              .add((ctx.normalLocal as Node<'vec3'>).mul(t.mul(0.003)));
          },
        },
      });
      fx.particles({
        capacity: 10,
        rateOverTime: 8,
        duration: 1.2,
        startLife: [0.35, 0.7],
        startSpeed: [0.1, 0.3],
        direction: [0, 1, 0],
        spread: 0.25,
        shape: { type: 'circle', radius: [0.15, 0.45] },
        startSize: [0.25, 0.5],
        sizeOverLife: curve([0, 0.3], [1, 1]),
        opacityOverLife: [
          { t: 0, v: 0 },
          { t: 0.2, v: 1 },
          { t: 1, v: 0 },
        ],
        tint: [0.25, 0.2, 0.15, 0.18],
        emission: 0.2,
        lit: true,
        soft: 0.15,
        coverage: 'alpha',
        colorSource: 'texture',
        textureColorSpace: 'linear',
        flipbook: { columns: 8, rows: 8, loop: false, mix: true },
        map: vfxTexture('smoke-body-animation-1'),
        blend: 'alpha',
        simulationSpace: 'local',
        transform: { position: [0, 0.06, 0] },
      });
    },
  });
}
export const reformationTiming = { formed: FORM, finish: DURATION } as const;

/** Reveal 0.9 s, hold until 3 s, then each dot leaves on its own arc. */
const hologramDURATION = 4.8;
const REVEAL = 0.9;
const DISPERSE_AT = 3;
const CYAN = [67 / 255, 239 / 255, 1] as const;
const HOT = [0.82, 1, 1] as const;
function smooth01(value: Node<'float'>): Node<'float'> {
  return tslSmoothstep(float(0), float(1), value);
}
/** Independent 0..1 values for sequential dot indices. */
function hash(index: Node<'float'>, salt: number): Node<'float'> {
  const p = tslFract(index.add(salt).mul(0.1031));
  const q = p.mul(p.add(33.33));
  return tslFract(q.mul(q.add(p)));
}
type Burst = {
  readonly elapsed: Node<'float'>;
  readonly a: Node<'float'>;
  readonly v: Node<'float'>;
  readonly c: Node<'float'>;
  readonly kick: Node<'float'>;
  readonly life: Node<'float'>;
  readonly launch: Node<'float'>;
};
function burst(ctx: VfxParticleContext): Burst {
  const index = float(ctx.index as Node<'float'>);
  const elapsed = ctx.age as Node<'float'>;
  const a = hash(index, 17.13);
  const v = hash(index, 43.71);
  const c = hash(index, 91.07);
  const launch = float(DISPERSE_AT).add(a.mul(0.36));
  const life = float(0.35).add(v.mul(0.65));
  const remain = tslOneMinus(smooth01(elapsed.sub(launch).div(life)));
  return {
    elapsed,
    a,
    v,
    c,
    launch,
    life,
    kick: tslOneMinus(remain.mul(remain).mul(remain)),
  };
}
function hologramLook(): VfxLayerLook {
  return {
    colorNode(ctx) {
      const { v, c, kick } = burst(ctx);
      const base = vec3(CYAN[0], CYAN[1], CYAN[2]).mul(v.mul(0.7).add(0.45));
      const flash = kick.mul(tslOneMinus(kick)).mul(4);
      const spark = smooth01(c.sub(0.8).div(0.2)).mul(kick);
      return tslMix(base, vec3(HOT[0], HOT[1], HOT[2]), flash.add(spark));
    },
    opacityNode(ctx) {
      const { elapsed, a, kick, launch, life } = burst(ctx);
      const reveal = elapsed
        .div(REVEAL)
        .sub((ctx.hostUnit as Node<'vec3'>).y)
        .smoothstep(-0.025, 0.025);
      const alive = tslOneMinus(smooth01(elapsed.sub(launch).div(life)));
      const flicker = tslSin(elapsed.mul(3).add(a.mul(30)))
        .mul(0.15)
        .add(0.85);
      const quad = tslVec2(
        (ctx.uv as Node<'vec2'>).x.sub(0.5),
        (ctx.uv as Node<'vec2'>).y.sub(0.5),
      );
      const disc = tslOneMinus(tslSmoothstep(float(0.25), float(0.5), quad.length()));
      const pop = float(1).add(kick.mul(tslOneMinus(kick)).mul(1.6));
      return alive.mul(reveal).mul(flicker).mul(disc).mul(0.48).mul(pop);
    },
    positionNode(ctx) {
      const rest = ctx.positionLocal as Node<'vec3'>;
      const { a, v, c, kick } = burst(ctx);
      const normal = ctx.normalLocal as Node<'vec3'>;
      const fromCore = (ctx.hostUnit as Node<'vec3'>).sub(vec3(0.5, 0.42, 0.5));
      const jitter = vec3(a.sub(0.5), v.sub(0.28), c.sub(0.5)).mul(3.2);
      const heading = tslNormalize(normal.mul(0.55).add(fromCore.mul(2.4)).add(jitter));
      const reach = float(0.2).add(v.mul(0.25)).add(c.mul(c).mul(0.4));
      const travel = heading.mul(reach).mul(kick);
      const spin = kick.mul(float(0.45).add(a.mul(1.7)));
      const cs = tslCos(spin);
      const sn = tslSin(spin);
      const lift = kick.mul(kick).mul(float(-0.12).add(c.mul(0.35)));
      return rest.add(
        vec3(
          travel.x.mul(cs).sub(travel.z.mul(sn)),
          travel.y.add(lift),
          travel.x.mul(sn).add(travel.z.mul(cs)),
        ),
      );
    },
  };
}
/** Creates one model reconstruction and restoration; repeat is intended only for a decorative cycle. */
// Copy this file; prepare createHologram(uniqueId) with the same host used at play. Keep that host in the scene: live skinning is followed. The host is hidden during playback and restored on finish or cancellation; do not change its mesh visibility while playing.
// Position/rotation offset the host foot anchor. fit.height=1.8 normalizes authored sizes. Game code owns actor activation, collisions, interaction and animation; restoration does not spawn or authorize the actor. Default is one cycle; repeat=true is decorative and postpones restoration until stopped.
export function createHologram(id: string, repeat = false): VfxDefinition {
  return defineVfx({
    id,
    duration: hologramDURATION,
    seed: 47,
    loop: repeat,
    maxInstances: 4,
    host: { takeover: 'reveal', pose: 'follow', fit: { height: 1.8 } },
    build(fx) {
      fx.hostShell({
        blend: 'alpha',
        orderInLayer: 8,
        look: {
          colorNode: () => vec3(0.025, 0.28, 0.36),
          opacityNode(ctx) {
            const age = ctx.age as Node<'float'>,
              y = (ctx.hostUnit as Node<'vec3'>).y;
            const reveal = age.div(REVEAL).sub(y).smoothstep(-0.025, 0.025);
            const release = tslOneMinus(smooth01(age.sub(DISPERSE_AT).div(0.5)));
            const line = tslFract(y.mul(64).sub(age.mul(1.2))).smoothstep(0.82, 0.94);
            const band = tslFract(age.mul(0.35)).sub(y).abs().smoothstep(0.015, 0.055).oneMinus();
            return line.mul(0.2).add(band.mul(0.25)).add(0.07).mul(reveal).mul(release);
          },
        },
      });
      fx.hostPoints({
        count: 1800,
        size: [0.01, 0.018],
        look: hologramLook(),
        blend: 'alpha',
        orderInLayer: 12,
      });
    },
  });
}
export const hologramTiming = {
  revealEnd: REVEAL,
  disperseAt: DISPERSE_AT,
  finish: hologramDURATION,
} as const;

const DISSOLVE = 0.95;
const SHARD_LIFE = 0.6;
const galleryTeleportDURATION = DISSOLVE + SHARD_LIFE;
function galleryTeleportFront(ctx: VfxParticleContext): Node<'float'> {
  return (ctx.age as Node<'float'>).div(DISSOLVE).mul(1.2).sub(0.1);
}
const surface: VfxLayerLook = {
  textures: EROSION_TEXTURES,
  colorNode: (ctx) => erodedColor(ctx, erosionField(ctx).sub(galleryTeleportFront(ctx))),
  opacityNode: (ctx) => erosionField(ctx).sub(galleryTeleportFront(ctx)).smoothstep(-0.006, 0.006),
};
function released(ctx: VfxParticleContext): Node<'float'> {
  const born = erosionField(ctx).add(0.1).div(1.2).mul(DISSOLVE);
  return (ctx.age as Node<'float'>).sub(born).div(SHARD_LIFE);
}
const departureDust: VfxLayerLook = {
  textures: {
    ...EROSION_TEXTURES,
    dust: { texture: vfxTexture('point-soft-5'), colorSpace: 'linear' },
  },
  colorNode(ctx) {
    const t = released(ctx).clamp(0, 1);
    return mix(vec3(12, 4.5, 0.45), vec3(2.4, 0.075, 0.002), t);
  },
  opacityNode(ctx) {
    const t = released(ctx),
      phase = t.clamp(0, 1);
    const shrink = phase.mul(-0.72).add(1);
    const q = ctx.uv.sub(0.5).div(shrink);
    const sample = ctx.sampleTexture;
    if (!sample) throw new Error('Departure dust texture is missing.');
    const density = (sample('dust', q.add(0.5).clamp(0, 1)) as Node<'vec4'>).r;
    return density
      .mul(q.length().smoothstep(0.3, 0.5).oneMinus())
      .mul(t.smoothstep(0, 0.06))
      .mul(t.smoothstep(0.3, 1).oneMinus())
      .mul(0.7);
  },
  positionNode(ctx) {
    const rest = ctx.positionLocal as Node<'vec3'>,
      normal = ctx.normalLocal as Node<'vec3'>;
    const t = released(ctx).clamp(0, 1),
      phase = (ctx.index as Node<'float'>).mul(2.399963);
    const spread = fract(sin(phase.mul(1.7)).mul(43758.5453))
      .mul(0.1)
      .add(0.06);
    const curl = vec3(sin(phase.add(t.mul(2.4))), float(0.7), cos(phase.add(t.mul(1.8))));
    return rest
      .add(normal.mul(t.mul(spread)))
      .add(curl.mul(t.mul(0.22)))
      .add(vec3(0, t.mul(t).mul(0.12), 0));
  },
};
function addDepartureDissolve(fx: VfxKitBuilder): void {
  fx.hostShell({
    look: surface,
    life: DISSOLVE,
    blend: 'cutout',
    emissive: (ctx) => hotEdge(erosionField(ctx).sub(galleryTeleportFront(ctx))),
    orderInLayer: 4,
  });
  fx.hostPoints({
    count: 220,
    size: [0.006, 0.02],
    seed: 7,
    look: departureDust,
    blend: 'alpha',
  });
  fx.light({
    intensity: 0.35,
    range: 2,
    color: [1, 0.25, 0.025],
    curve: [
      { t: 0, v: 0 },
      { t: 0.15, v: 1 },
      { t: 0.65, v: 0.5 },
      { t: 1, v: 0 },
    ],
  });
}
/** Creates the gallery teleport composition; game code owns placement and events. */
export function createTeleportDeparture(id: string): VfxDefinition {
  return defineVfx({
    id,
    duration: galleryTeleportDURATION,
    seed: 7,
    maxInstances: 4,
    host: { takeover: 'conceal', pose: 'snapshot', fit: { height: 1.8 } },
    build(fx) {
      addDepartureDissolve(fx);
    },
  });
}

const shadowEnvelopeDURATION = 2.6;
function addShadowDepartureLayers(fx: VfxKitBuilder, textureVariant?: number): void {
  const atlas = specialTexture(SPECIAL_SMOKE, textureVariant);
  // Separate volumes overlap in depth; the native atlas retains its authored smoke shading.
  for (const layer of [0, 1, 2]) {
    const core = layer === 0,
      upper = layer === 1;
    fx.particles({
      capacity: core ? 28 : 18,
      bursts: [{ time: 0, count: core ? 12 : 7 }],
      rateOverTime: core ? 18 : 10,
      duration: core ? 0.48 : 0.6,
      delay: layer * 0.075,
      startLife: core ? [1.2, 1.65] : [1.1, 1.6],
      startSpeed: upper ? [0.25, 0.5] : [0.1, 0.3],
      direction: [0, 1, 0],
      spread: upper ? 0.4 : 1.1,
      shape: {
        type: 'box',
        size: core ? [0.65, 1.15, 0.6] : upper ? [0.55, 0.45, 0.55] : [0.85, 0.16, 0.75],
      },
      transform: { position: [0, core ? 0.9 : upper ? 1.45 : 0.25, 0] },
      startSize: core ? [0.65, 1] : [0.5, 0.8],
      sizeOverLife: curve([0, 0.65], [0.2, 1], [0.65, 1.25], [1, 1.6]),
      opacityOverLife: curve([0, 0], [0.1, 0.8], [0.32, 0.85], [0.65, 0.4], [1, 0]),
      orbit: { axis: [0, 1, 0], speed: upper ? -0.35 : 0.45, radialDrift: 0.08 },
      noise: { strength: 0.12, frequency: 2, scrollSpeed: 0.5 },
      drag: 1.1,
      map: atlas ? vfxTexture('solid') : vfxTexture('smoke-body-animation-1'),
      flipbook: atlas ? undefined : { columns: 8, rows: 8, loop: false, mix: true },
      coverage: atlas ? undefined : 'alpha',
      textureColorSpace: 'linear',
      colorSource: atlas ? 'tint' : 'texture',
      ...(atlas
        ? {
            look: specialLook(
              atlas,
              [
                [0.025, 0.018, 0.035],
                [0.13, 0.1, 0.17],
                [0.38, 0.3, 0.43],
              ],
              true,
            ),
          }
        : {}),
      tint: atlas ? [1, 1, 1, 0.7] : [0.6, 0.51, 0.68, core ? 0.72 : 0.5],
      emission: 0.35,
      lit: true,
      soft: 0.22,
      blend: 'alpha',
      simulationSpace: 'world',
      rotation: { start: [-Math.PI, Math.PI], spin: [-0.18, 0.18] },
    });
  }
  fx.particles({
    capacity: 14,
    bursts: [{ time: 0, count: 14 }],
    delay: 0.12,
    startLife: [0.5, 1.1],
    startSpeed: [0.15, 0.45],
    direction: [0, 1, 0],
    spread: 0.8,
    shape: { type: 'box', size: [0.6, 1.3, 0.55] },
    transform: { position: [0, 0.9, 0] },
    startSize: [0.006, 0.015],
    sizeOverLife: MOTE_SIZE,
    opacityOverLife: curve([0, 0], [0.08, 1], [0.4, 0.6], [1, 0]),
    map: vfxTexture('point-soft-5'),
    tint: [0.24, 0.08, 0.5, 0.5],
    emission: 1.2,
    simulationSpace: 'world',
    blend: 'additive',
  });
}
/** Dissolve the supplied model inside rolling smoke; select dissolveHost:false for independent smoke. */
// Copy this file and prepare createShadowEnvelope(uniqueId) with the actual model host. Snapshot conceal leaves the original hidden on natural completion; immediate cancellation restores its previous visibility. Gameplay owns relocation/despawn and must retain the host until finished.
// For independent smoke, createShadowEnvelope(id, textureVariant, {dissolveHost:false}) needs no host: play unparented at the committed upright foot pose. All emitted smoke/flecks remain in world space.
// Texture variants: copy shared/special-pack.ts. Select a source-file number before prepare; omission uses shaded SmokeAnim2. Dissolve and smoke start together and drain within 2.6 seconds.
export function createShadowEnvelope(
  id: string,
  textureVariant?: number,
  options: { dissolveHost?: boolean } = {},
): VfxDefinition {
  const dissolveHost = options.dissolveHost ?? true;
  return defineVfx({
    id,
    maxInstances: 4,
    duration: shadowEnvelopeDURATION,
    seed: 61,
    ...(dissolveHost
      ? { host: { takeover: 'conceal' as const, pose: 'snapshot' as const, fit: { height: 1.8 } } }
      : {}),
    build(fx) {
      if (dissolveHost) addDepartureDissolve(fx);
      addShadowDepartureLayers(fx, textureVariant);
    },
  });
}

export default createMeshReformation('example.mesh-reformation');
