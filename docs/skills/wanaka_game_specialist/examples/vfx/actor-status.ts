// intent: Model-surface actor coatings for burn, vulnerability, cleanse and frost/invulnerability.
// variants: createActorStatus(id, state, options)
// inputs: Actual model host and game-owned status strength/lifecycle.
// Copy dependencies: none.
// Setup in an async scene: const effect = createActorStatus('example.actor-status', 'burn');
// const vfx = useVfx(context); await vfx.prepare(effect, { host });
// const handle = vfx.play(effect, { host });
// Import useVfx from wanaka-studio-engine/vfx; bind each factory to its own game-owned state and lifecycle.
// Coating integration: strength is a per-play value in [0,1]; update with
// handle.setParam('strength', value) and stop when the actual game state ends.
// The frost-invulnerable grain/cracks use model-position triplanar sampling without UVs;
// edit shell inflate/textures/surface values here. This is a thin coat, not ice volume.
// Gameplay owns protection and movement restrictions; the visible model follows its pose.
import { abs, float, mix, normalize, oneMinus, pow, sin, smoothstep, vec2, vec3 } from 'three/tsl';
import { type Node } from 'three/webgpu';
import { curve, defineVfx, vfxTexture, viewFresnel, type Vec3, type VfxDefinition, type VfxKitBuilder, type VfxLayerLook, type VfxParticleContext, sampleVfxAtlas, getVfxTextureSampling } from 'wanaka-studio-engine/vfx';

/** Gameplay state to present; state application and removal stay in the game. */
export type ActorStatus = 'burn' | 'vulnerable' | 'cleanse' | 'frost-invulnerable';
const COLORS: Record<ActorStatus, Vec3> = {
  burn: [2.2, 0.28, 0.015],
  vulnerable: [1.5, 0.045, 0.1],
  cleanse: [0.55, 1.5, 1.1],
  'frost-invulnerable': [1.25, 1.05, 0.55],
};

/** Structural placement of vulnerability fractures in normalized rest-pose bounds; adapt for nonhumanoid silhouettes. */
export interface ActorStatusOptions {
  burnTexture?: ReturnType<typeof vfxTexture>;
  vulnerableBand?: readonly [number, number];
}
/** Prepare a distinct host presentation. Burn loops over complete 60 fps atlas cycles; other holds loop at eight seconds; cleanse finishes after 1.2 seconds. */
// Copy this file. Coatings: prepare(effect, { host: actorModel }), then play with that host; follow preserves pose, materials and visibility in a fitted 1.8-metre frame.
// Burn holds persistent flame cards on the animated surface; smoke and embers leave the pose in world space.
// Pass the visible model subtree as host, not a gameplay entity root that also contains shields, hit boxes or unrelated props.
// Keep anchor transforms current after animation. A position-only source can follow a world socket with fixed orientation; it does not inherit bone rotation. Ramp strength to zero before stopping; stop immediately when the actor is despawned to release held meshes. Cancel on despawn. Game code owns state duration, damage, movement restrictions and cure decisions; cleanse completion does not cure anything.
// Vulnerability defaults to the central body band, sparing high head geometry and outer held equipment. Adjust vulnerableBand for the chosen silhouette and choose the body host intentionally; this uses stable rest-pose coordinates, not semantic body-part detection. Vulnerability uses Crack1 with dark fracture beds and red cores pinned to the rest pose. Invulnerability combines the icy shell and contour coating into one protective visual.
export function createActorStatus(
  id: string,
  state: ActorStatus,
  options: ActorStatusOptions = {},
): VfxDefinition {
  const band: readonly [number, number] = options.vulnerableBand ?? [0.14, 0.74];
  if (!band.every(Number.isFinite) || band[0] < 0 || band[1] > 1 || band[0] >= band[1])
    throw new Error('Vulnerability band must be an increasing pair within 0..1.');
  if (!['burn', 'vulnerable', 'cleanse', 'frost-invulnerable'].includes(state))
    throw new Error('Unknown actor coating.');
  const cleanse = state === 'cleanse';
  const burnTexture = options.burnTexture ?? vfxTexture('fire-vol5-flame-29');
  const burnAtlas = getVfxTextureSampling(burnTexture.assetId);
  const burnCycleSeconds = (burnAtlas.columns * burnAtlas.rows) / 60;
  return defineVfx({
    id,
    duration: cleanse ? 1.2 : state === 'burn' ? burnCycleSeconds * 2 : 8,
    loop: !cleanse,
    maxInstances: 8,
    host: { takeover: 'none', pose: 'follow', fit: { height: 1.8 } },
    params: { strength: { default: 1, min: 0, max: 1 } },
    build(fx) {
      const strength = (fx.param('strength') as Node<'float'>).clamp(0, 1);
      if (state === 'burn') {
        addBurnSurface(fx, strength, burnCycleSeconds);
        addBurnFlames(fx, strength, burnTexture, burnAtlas, burnCycleSeconds);
        return;
      }
      const vulnerabilityRegion = (ctx: VfxParticleContext): Node<'float'> => {
        const p = ctx.hostRestUnit as Node<'vec3'>;
        return p.y
          .smoothstep(band[0] - 0.035, band[0] + 0.035)
          .mul(p.y.smoothstep(band[1] - 0.035, band[1] + 0.035).oneMinus())
          .mul(p.x.sub(0.5).abs().smoothstep(0.18, 0.34).oneMinus());
      };
      const textures = {
        ...(state === 'vulnerable'
          ? {
              fracture: {
                texture: vfxTexture('crack-thin-network-1'),
                colorSpace: 'linear' as const,
                wrap: 'clamp' as const,
              },
            }
          : {}),
        grain: {
          texture: vfxTexture('noise-soft-alias-1'),
          colorSpace: 'linear' as const,
          wrap: 'repeat' as const,
        },
      };
      const samples = new WeakMap<
        VfxParticleContext,
        {
          mask: Node<'float'>;
          grain: Node<'float'>;
          fracture: Node<'float'>;
        }
      >();
      const field = (
        ctx: VfxParticleContext,
      ): {
        mask: Node<'float'>;
        grain: Node<'float'>;
        fracture: Node<'float'>;
      } => {
        const cached = samples.get(ctx);
        if (cached) return cached;
        const p = (
            state === 'vulnerable' ? ctx.hostRestUnit : ctx.hostUnit
          ) as Node<'vec3'>,
          clock = ctx.age as Node<'float'>;
        const uv = p.xy
          .mul(vec2(4, 3))

          .fract();
        const texture = ctx.sampleTexture?.('grain', uv) as Node<'vec4'> | undefined;
        if (!texture) throw new Error('Actor status grain texture is missing.');
        const grain = texture.r,
          fracture =
            state === 'vulnerable'
              ? (
                  ctx.sampleTexture?.(
                    'fracture',
                    p.xy.mul(vec2(0.8, 0.9)).add(vec2(0.1, 0.05)),
                  ) as Node<'vec4'>
                ).r
              : float(0),
          rim = viewFresnel(state === 'frost-invulnerable' ? 2.25 : 2);
        let mask: Node<'float'>;
        if (state === 'vulnerable')
          mask = fracture
            .smoothstep(0.025, 0.35)
            .mul(
              clock
                .mul(Math.PI * 2)
                .sin()
                .mul(0.18)
                .add(0.82),
            )
            .add(rim.mul(0.5))
            .mul(vulnerabilityRegion(ctx));
        else if (cleanse) {
          const front = clock.div(0.75);
          mask = p.y
            .sub(front)
            .abs()
            .smoothstep(0.015, 0.12)
            .oneMinus()
            .mul(clock.smoothstep(0, 0.08))
            .mul(clock.smoothstep(0.7, 1.2).oneMinus());
        } else
          mask = rim
            .mul(0.58)
            .add(0.25)
            .mul(clock.mul(Math.PI).sin().mul(0.04).add(0.92))
            .add(p.y.mul(12).sub(clock.mul(Math.PI)).sin().smoothstep(0.7, 1).mul(rim).mul(0.2));
        const value = { grain, fracture, mask: mask.mul(strength) };
        samples.set(ctx, value);
        return value;
      };
      if (state === 'vulnerable')
        fx.hostShell({
          id: 'vulnerable-fracture-beds',
          inflate: 0.004,
          blend: 'alpha',
          roughness: 0.9,
          vertexColors: false,
          orderInLayer: 10,
          look: {
            textures,
            colorNode: () => vec3(0.04, 0.001, 0.005),
            opacityNode: (ctx) =>
              field(ctx)
                .fracture.smoothstep(0.005, 0.055)
                .mul(0.75)
                .add(0.22)
                .mul(vulnerabilityRegion(ctx))
                .mul(strength),
          },
        });
      if (state === 'frost-invulnerable')
        fx.hostShell({
          id: 'protective-frost-shell',
          look: frostLook(strength),
          vertexColors: false,
          roughness: 0.28,
          metalness: 0,
          inflate: 0.026,
          blend: 'alpha',
          orderInLayer: 6,
        });
      if (state === 'frost-invulnerable')
        fx.hostShell({
          id: 'frost-invulnerable-contrast',
          inflate: 0.005,
          blend: 'alpha',
          roughness: 0.8,
          metalness: 0,
          vertexColors: false,
          orderInLayer: 10,
          look: {
            colorNode: () => vec3(0.018, 0.015, 0.008),
            opacityNode: () => viewFresnel(1.25).mul(0.65).mul(strength),
          },
        });
      fx.hostShell({
        orderInLayer: 11,
        inflate: state === 'frost-invulnerable' ? 0.009 : state === 'vulnerable' ? 0.018 : 0.007,
        blend: state === 'frost-invulnerable' ? 'alpha' : 'additive',
        roughness: state === 'frost-invulnerable' ? 0.24 : 0.45,
        metalness: state === 'frost-invulnerable' ? 0.65 : 0,
        vertexColors: false,
        look: {
          textures,
          colorNode: (ctx) =>
            state === 'frost-invulnerable'
                ? vec3(1, 0.6, 0.1)
                : state === 'vulnerable'
                  ? mix(
                      vec3(0.5, 0.003, 0.018),
                      vec3(3, 0.18, 0.12),
                      field(ctx).fracture.smoothstep(0.2, 0.9),
                    )
                  : mix(vec3(...COLORS[state]).mul(0.2), vec3(...COLORS[state]), field(ctx).grain),
          opacityNode: (ctx) => field(ctx).mask,
        },
        emissive: (ctx) =>
          vec3(...COLORS[state]).mul(
            field(ctx).mask.mul(state === 'frost-invulnerable' ? 0.3 : 0.7),
          ),
      });
      if (state === 'frost-invulnerable')
        fx.hostShell({
          id: 'protective-frost-shell',
          look: frostLook(strength),
          vertexColors: false,
          roughness: 0.28,
          metalness: 0,
          inflate: 0.026,
          blend: 'alpha',
          orderInLayer: 6,
        });
      if (state === 'frost-invulnerable')
        fx.hostShell({
          id: 'frost-invulnerable-edge',
          inflate: 0.024,
          blend: 'additive',
          vertexColors: false,
          orderInLayer: 12,
          look: {
            colorNode: () => vec3(1.8, 1.1, 0.3),
            opacityNode: () => viewFresnel(3.5).mul(strength.mul(0.9)),
          },
        });
      if (cleanse) {
        fx.particles({
          capacity: 2,
          bursts: [
            { time: 0.02, count: 1 },
            { time: 0.16, count: 1 },
          ],
          startLife: 0.75,
          startSpeed: 2.25,
          direction: [0, 1, 0],
          transform: { position: [0, 0.025, 0] },
          startSize: 1.35,
          mode: 'horizontal',
          map: vfxTexture('aura-tintable-rim-1'),
          coverage: 'red',
          colorSource: 'tint',
          tint: [0.16, 0.8, 0.53, 0.75],
          emission: 1.3,
          blend: 'alpha',
          sizeOverLife: curve([0, 0.7], [0.4, 1], [1, 1.25]),
          opacityOverLife: curve([0, 0], [0.1, 0.8], [0.65, 0.6], [1, 0]),
          look: { opacityMultiplierNode: () => strength },
        });
        fx.particles({
          capacity: 20,
          bursts: [{ time: 0.08, count: 20 }],
          shape: { type: 'host' },
          simulationSpace: 'world',
          startLife: [0.35, 0.7],
          startSpeed: [0.6, 1.1],
          direction: [0, 1, 0],
          spread: 0.85,
          startSize: [0.045, 0.08],
          map: vfxTexture('trail-soft-droplet-1'),
          mode: 'stretched',
          stretch: { lengthFactor: 2.5, speedFactor: 0.04 },
          colorSource: 'tint',
          tint: [0.38, 1, 0.78, 0.8],
          emission: 1.2,
          blend: 'alpha',
          sizeOverLife: curve([0, 0.3], [0.2, 1], [1, 0.2]),
          opacityOverLife: curve([0, 0], [0.12, 1], [0.6, 0.7], [1, 0]),
          look: { opacityMultiplierNode: () => strength },
        });
        fx.particles({
          capacity: 12,
          bursts: [{ time: 0.05, count: 12 }],
          shape: { type: 'host' },
          simulationSpace: 'world',
          startLife: [0.45, 0.8],
          startSpeed: [0.15, 0.3],
          direction: [0, 1, 0],
          spread: 0.5,
          startSize: [0.25, 0.4],
          map: vfxTexture('smoke-body-animation-1'),
          flipbook: { columns: 8, rows: 8, loop: false, mix: true },
          coverage: 'alpha',
          colorSource: 'tint',
          tint: [0.08, 0.38, 0.27, 0.35],
          emission: 0.8,
          blend: 'alpha',
          sizeOverLife: curve([0, 0.3], [0.25, 1], [1, 1.25]),
          opacityOverLife: curve([0, 0], [0.15, 0.6], [1, 0]),
          look: { opacityMultiplierNode: () => strength },
        });
      }
      fx.hostPoints({
        count: state === 'vulnerable' ? 32 : cleanse ? 64 : 96,
        size: state === 'vulnerable' ? [0.008, 0.016] : cleanse ? [0.025, 0.055] : [0.012, 0.028],
        seed: 59,
        blend: 'additive',
        look: {
          positionNode: (ctx) =>
            (ctx.positionLocal as Node<'vec3'>).add(
              (ctx.normalLocal as Node<'vec3'>).mul(cleanse ? ctx.age.mul(0.25) : 0.015),
            ),
          colorNode: () => vec3(...COLORS[state]),
          opacityNode: (ctx) => {
            const disc = ctx.uv.sub(0.5).mul(2).length().smoothstep(0.05, 1).oneMinus();
            const phase = ctx.age.mul(0.5).add(float(ctx.index).mul(0.618)).fract();
            const presence = cleanse
              ? ctx.age.smoothstep(0, 0.15).mul(ctx.age.smoothstep(0.4, 1.2).oneMinus())
              : phase.mul(Math.PI).sin();
            return disc
              .mul(presence)
              .mul(state === 'vulnerable' ? vulnerabilityRegion(ctx) : 1)
              .mul(strength.mul(state === 'frost-invulnerable' ? 0.15 : 0.6));
          },
        },
      });
    },
  });
}
/** Molten islands and fissures stay pinned to the rest pose; only their heat breathes. */
function addBurnSurface(fx: VfxKitBuilder, strength: Node<'float'>, cycleSeconds: number): void {
  const textures = {
    heat: { texture: vfxTexture('noise-cloud-contrasty-1'), colorSpace: 'linear' as const, wrap: 'repeat' as const },
    cracks: { texture: vfxTexture('crack-thin-network-1'), colorSpace: 'linear' as const, wrap: 'repeat' as const },
  };
  const fields = new WeakMap<VfxParticleContext, { heat: Node<'float'>; fissure: Node<'float'>; rim: Node<'float'> }>();
  const field = (ctx: VfxParticleContext) => {
    const cached = fields.get(ctx);
    if (cached) return cached;
    const p = ctx.hostRestUnit as Node<'vec3'>;
    const read = (key: string, uv: Node<'vec2'>): Node<'float'> => {
      const texel = ctx.sampleTexture?.(key, uv) as Node<'vec4'> | undefined;
      if (!texel) throw new Error('Actor burn surface texture is missing.');
      return texel.r;
    };
    const broad = read('heat', p.xy.mul(vec2(3, 4)).add(p.z.mul(0.71)))
      .mul(0.65).add(read('heat', p.zy.mul(vec2(3.7, 4.5)).add(0.27)).mul(0.35));
    const heat = broad.smoothstep(0.24, 0.64);
    const fissure = read('cracks', p.xy.mul(vec2(2.4, 3)).add(p.z.mul(0.43)))
      .max(read('cracks', p.zy.mul(vec2(2.2, 2.8)).add(0.19)).mul(0.7))
      .smoothstep(0.055, 0.48).mul(heat.mul(0.75).add(0.25));
    const rim = viewFresnel(3).mul(broad.smoothstep(0.24, 0.6));
    const value = { heat, fissure, rim };
    fields.set(ctx, value);
    return value;
  };
  fx.hostShell({
    id: 'burn-charred-surface',
    inflate: 0.004,
    blend: 'alpha',
    roughness: 0.85,
    metalness: 0,
    vertexColors: false,
    orderInLayer: 10,
    look: {
      textures,
      colorNode: (ctx) => mix(vec3(0.012, 0.006, 0.003), vec3(0.18, 0.024, 0.002), field(ctx).heat),
      opacityNode: (ctx) => field(ctx).heat.mul(0.2).add(0.65).mul(strength),
    },
  });
  fx.hostShell({
    id: 'burn-molten-fissures',
    inflate: 0.007,
    blend: 'additive',
    vertexColors: false,
    orderInLayer: 11,
    look: {
      textures,
      colorNode: (ctx) => {
        const { heat, fissure, rim } = field(ctx);
        return vec3(3.2, 0.38, 0.003).mul(heat.pow(2).mul(0.7))
          .add(mix(vec3(4, 0.8, 0.005), vec3(7, 3.8, 0.08), fissure).mul(fissure))
          .add(vec3(3.5, 1.25, 0.015).mul(rim.mul(0.55)));
      },
      opacityNode: (ctx) => ctx.age.div(cycleSeconds).mul(Math.PI * 2).sin()
        .mul(0.06).add(0.94).mul(strength),
    },
  });
}
/** Stable cards follow the live pose; only smoke and embers detach into world space. */
function addBurnFlames(
  fx: VfxKitBuilder,
  strength: Node<'float'>,
  texture: ReturnType<typeof vfxTexture>,
  atlas: ReturnType<typeof getVfxTextureSampling>,
  cycleSeconds: number,
): void {
  const surface = {
    bursts: [],
    duration: cycleSeconds * 2,
    shape: { type: 'host' as const },
    simulationSpace: 'world' as const,
    blend: 'alpha' as const,
    direction: [0, 1, 0] as Vec3,
    look: { opacityMultiplierNode: () => strength },
  };
  const samples = new WeakMap<VfxParticleContext, Node<'vec4'>>();
  const flame = (ctx: VfxParticleContext): Node<'vec4'> => {
    const cached = samples.get(ctx);
    if (cached) return cached;
    const sample = sampleVfxAtlas(ctx, {
      ...atlas,
      textureKey: 'fire',
      mix: true,
      loop: true,
      phase: ctx.age.div(cycleSeconds).add(float(ctx.index).mul(0.618034)),
    });
    samples.set(ctx, sample);
    return sample;
  };
  fx.hostPoints({
    id: 'burn-surface-flames',
    count: 36,
    size: [0.34, 0.52],
    seed: 163,
    mode: 'vertical',
    pivot: [0.5, 0.2],
    blend: 'alpha',
    depthTest: true,
    orderInLayer: 100,
    look: {
      textures: { fire: { texture, colorSpace: 'srgb', wrap: 'clamp' } },
      positionNode: (ctx) => (ctx.positionLocal as Node<'vec3'>).add((ctx.normalLocal as Node<'vec3'>).mul(0.025)),
      colorNode: (ctx) => flame(ctx).rgb.mul(1.8),
      opacityNode: (ctx) => {
        const y = (ctx.hostRestUnit as Node<'vec3'>).y;
        return flame(ctx).r.mul(strength).mul(y.smoothstep(0.02, 0.1)).mul(0.95);
      },
    },
  });
  fx.particles({
    ...surface,
    capacity: 8,
    rateOverTime: 5,
    startLife: [0.65, 1],
    startSpeed: [0.35, 0.65],
    spread: 0.25,
    startSize: [0.25, 0.4],
    drag: 0.5,
    map: vfxTexture('smoke-body-animation-1'),
    flipbook: { columns: 8, rows: 8, mix: true, loop: false },
    coverage: 'alpha',
    colorSource: 'tint',
    emission: 0,
    tint: [0.12, 0.09, 0.065, 0.16],
    orderInLayer: -2,
    sizeOverLife: curve([0, 0.4], [0.3, 1], [1, 1.7]),
    opacityOverLife: curve([0, 0], [0.18, 0.7], [0.6, 0.45], [1, 0]),
    rotation: { start: [-Math.PI, Math.PI], spin: [-0.2, 0.2] },
  });
  fx.particles({
    ...surface,
    capacity: 16,
    rateOverTime: 11,
    startLife: [0.45, 0.9],
    startSpeed: [0.3, 0.9],
    spread: 0.4,
    startSize: [0.006, 0.016],
    gravity: 0.3,
    drag: 1,
    noise: { strength: 0.15, frequency: 2, scrollSpeed: 1 },
    map: vfxTexture('point-soft-5'),
    blend: 'additive',
    emission: 3,
    colorOverLife: [
      { t: 0, rgba: [1, 0.6, 0.08, 0] },
      { t: 0.15, rgba: [1, 0.4, 0.025, 1] },
      { t: 1, rgba: [0.4, 0.02, 0.001, 0] },
    ],
    sizeOverLife: curve([0, 0.7], [0.2, 1], [1, 0]),
  });
}
const ICE = 'ice-full-surface-2';
const CRACKS = 'crack-thin-network-4';
interface FrostSample {
  readonly grain: Node<'float'>;
  readonly cracks: Node<'float'>;
  readonly coverage: Node<'float'>;
  readonly edge: Node<'float'>;
  readonly rim: Node<'float'>;
}
const samples = new WeakMap<VfxParticleContext, FrostSample>();
function triplanar(ctx: VfxParticleContext, name: string, scale: number): Node<'vec3'> {
  const sample = ctx.sampleTexture;
  if (sample === undefined) throw new Error('Frost look texture is not bound.');
  const p = (ctx.positionLocal as Node<'vec3'>).mul(scale);
  const n = pow(abs(normalize(ctx.normalLocal as Node<'vec3'>)), vec3(4, 4, 4));
  const w = n.div(n.x.add(n.y).add(n.z).max(0.0001));
  const x = (sample(name, p.yz) as Node<'vec4'>).xyz;
  const y = (sample(name, p.xz) as Node<'vec4'>).xyz;
  const z = (sample(name, p.xy) as Node<'vec4'>).xyz;
  return x.mul(w.x).add(y.mul(w.y)).add(z.mul(w.z));
}
function frostSample(ctx: VfxParticleContext): FrostSample {
  const cached = samples.get(ctx);
  if (cached !== undefined) return cached;
  const p = ctx.positionLocal as Node<'vec3'>;
  const height = (ctx.hostUnit as Node<'vec3'>).y;
  const noise = sin(p.x.mul(11).add(p.y.mul(7)).add(p.z.mul(13)))
    .mul(0.5)
    .add(0.5);
  const field = height.mul(0.82).add(noise.mul(0.18));
  const coverage = float(1);
  const edge = oneMinus(smoothstep(float(0), float(0.055), field));
  const ice = triplanar(ctx, 'ice', 0.9);
  const cracks = triplanar(ctx, 'cracks', 0.9).x;
  const sample = {
    grain: ice.dot(vec3(0.2126, 0.7152, 0.0722)),
    cracks: smoothstep(float(0.4), float(0.82), cracks),
    coverage,
    edge,
    rim: viewFresnel(3),
  };
  samples.set(ctx, sample);
  return sample;
}
function frostLook(strength: Node<'float'>): VfxLayerLook {
  return {
    textures: {
      ice: { texture: vfxTexture(ICE), colorSpace: 'srgb', wrap: 'repeat' },
      cracks: { texture: vfxTexture(CRACKS), colorSpace: 'linear', wrap: 'repeat' },
    },
    colorNode(ctx) {
      const { grain, cracks, rim } = frostSample(ctx);
      const body = mix(vec3(0.025, 0.14, 0.22), vec3(0.24, 0.5, 0.61), grain);
      return mix(body, vec3(0.66, 0.83, 0.9), cracks.mul(0.7)).add(rim.mul(vec3(0.04, 0.14, 0.19)));
    },
    opacityNode(ctx) {
      const { grain, cracks, coverage, rim } = frostSample(ctx);
      return coverage
        .mul(float(0.5).add(grain.mul(0.14)).add(cracks.mul(0.18)).add(rim.mul(0.1)))
        .clamp(0, 0.88)
        .mul(strength);
    },
  };
}

export default createActorStatus('example.actor-status', 'burn');
