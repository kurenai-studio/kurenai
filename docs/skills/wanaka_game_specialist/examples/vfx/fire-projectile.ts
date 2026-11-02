// intent: Game-driven fireball flight, muzzle and independently confirmed impact.
// variants: createFireProjectile (flight), createFireProjectileMuzzle, createFireProjectileImpact.
// inputs: Fixed launch point; update relative head, unit heading and elapsed time. Play impact only on confirmed contact.
// Copy dependencies: ./shared/projectile-motion.ts.
// Setup in an async scene: const effect = createFireProjectile('example.fire-projectile');
// const vfx = useVfx(context); await vfx.prepare(effect, {});
// const handle = vfx.play(effect, playOptions);
// Import useVfx from wanaka-studio-engine/vfx; supply game-owned motion and confirmed events.
import { cameraPosition,dot,mix,modelWorldMatrix,normalGeometry,normalize,select,vec2,vec3,vec4 } from 'three/tsl';
import { type Node } from 'three/webgpu';
import { RANDOM_YAW,type Vec3,type VfxDefinition,type VfxLayerLook,type VfxMaterialContext,curve,defineVfx,sampleVfxAtlas,vfxMesh,vfxTexture } from 'wanaka-studio-engine/vfx';
import { createProjectileSampler,projectileEmbers,projectileFrame } from './shared/projectile-motion.js';

// Flight is unparented, world-aligned, and unit scale at the fixed launch position.
// Each tick set head (projectileWorld minus launchWorld), heading (unit direction), and elapsed (seconds).
// On hit/expiry set recording=false and continue updating elapsed while the tail drains.
// After FIRE_PROJECTILE_TAIL_SECONDS call handle.stop({ immediate: true }).
// Increment breakSerial on teleport/correction. Cancel immediately on scene teardown/despawn.
// Play muzzle on the firing socket; play impact only on confirmed collision with local +Y
// along its normal. Game owns trajectory, collision, damage and status application.
export const FIRE_PROJECTILE_TAIL_SECONDS = 0.65;
function atlasLook(texture: ReturnType<typeof vfxTexture>, kind: 'head' | 'smoke' | 'flame' = 'flame'): VfxLayerLook {
  const samples = new WeakMap<VfxMaterialContext, Node<'vec4'>>();
  const read = (ctx: VfxMaterialContext): Node<'vec4'> => {
    const cached = samples.get(ctx);
    if (cached) return cached;
    const value = sampleVfxAtlas(ctx, {textureKey: 'density', columns: 8, rows: 8,
      width: 2048, phase: ctx.progress, mix: true});
    samples.set(ctx, value);
    return value;
  };
  return {
    textures: {density: {texture, colorSpace: 'srgb'}},
    colorNode: ctx => {
      const density=read(ctx).r;
      if(kind==='head')return vec3(3.5,1.45,0.12);
      // MF_ColorInput uses Lerp_3Color, with the middle color at density 0.5.
      const lower=mix(vec3(0.3),vec3(kind==='smoke'?1:0.5),density.mul(2).clamp(0,1));
      const upper=mix(vec3(kind==='smoke'?1:0.5),vec3(kind==='smoke'?2:1),density.mul(2).sub(1).clamp(0,1));
      const ramp=select(density.lessThan(0.5),lower,upper);
      const energy=mix(vec3(10.5,1.408588,0),vec3(1.5,0.201227,0),ctx.progress.sub(0.00756).div(0.478163).clamp(0,1));
      return kind==='smoke'?ramp.mul(0.270833):ramp.mul(energy);
    },
    opacityNode: ctx => (kind === 'flame' ? read(ctx).a : read(ctx).r)
      .pow(kind === 'flame' ? 1.5 : 1)
      .mul(kind==='head'?1:ctx.progress.oneMinus().mul(kind==='smoke'?20:2)).clamp(0,1),
  };
}
const headLook = atlasLook(vfxTexture('projectile-fx-fireball-01-ra'), 'head');
const smokeLook = atlasLook(vfxTexture('projectile-fx-smoke-04-ra'), 'smoke');
const flameBurstLook = atlasLook(vfxTexture('projectile-fx-smoke-swirl-01-ra'));
// Samples of the source cubic ScaleSpriteSize curve: 1 -> 1.625 -> 2.
const burstGrowth=curve([0,1.000000],[0.05,1.197956],[0.1,1.369170],[0.217378,1.625000],[0.4,1.795991],[0.65,1.936415],[1,2.000000]);
/** One fireball per play, with history isolated by playback context. */
export function createFireProjectile(id: string, maximumFlightSeconds = 5): VfxDefinition {
  const state=createProjectileSampler(maximumFlightSeconds,FIRE_PROJECTILE_TAIL_SECONDS);
  function trailLook(kind: 'fire' | 'contrast' | 'smoke', elapsed:Node<'float'>): VfxLayerLook {
    const smoke = kind === 'smoke', fire = kind === 'fire';
    const fields = new WeakMap<VfxMaterialContext,Node<'float'>>();
    const field=(ctx:VfxMaterialContext):Node<'float'>=>{
      const cached=fields.get(ctx);if(cached)return cached;
      const firstUv=ctx.uv.mul(vec2(fire?2:1,1)).add(vec2(!fire&&!smoke?elapsed.mul(0.6):0,0));
      const secondUv=ctx.uv.mul(vec2(fire?1:0.6,1)).add(vec2(smoke?elapsed.mul(0.1):0,0));
      const density=ctx.sampleTexture('first',firstUv).r
        .mul(ctx.sampleTexture('second',secondUv).r).pow(fire?1.5:smoke?0.5:0.8).mul(fire?30:1);
      // M_Trail_01: head/tail UV fades are multiplied by Trail_Hardness, then saturated.
      const fade=ctx.uv.x.oneMinus().clamp(0,1).pow(fire?1.5:1)
        .mul(ctx.uv.x.clamp(0,1).pow(fire?0.6:1)).mul(fire?3:smoke?1:6).clamp(0,1);
      const value=density.mul(fade);fields.set(ctx,value);return value;
    };
    return {
      textures: {
        first: {texture: smoke ? vfxTexture('projectile-fx-trail-smoke-01') : fire ? vfxTexture('projectile-fx-noise-01') : vfxTexture('projectile-fx-noise-02'), colorSpace:'linear',wrap:'repeat'},
        second: {texture: fire ? vfxTexture('projectile-fx-trail-04') : vfxTexture('projectile-fx-trail-05'), colorSpace:'linear',wrap:'repeat'},
      },
      colorNode: ctx => {
        if(!fire){
          const density=field(ctx);
          const low=mix(smoke?vec3(1.5):vec3(1.5,0,0),vec3(5),density.mul(2).clamp(0,1));
          const high=mix(vec3(5),vec3(10),density.mul(2).sub(1).clamp(0,1));
          return select(density.lessThan(0.5),low,high).mul(smoke?vec3(0.05):vec3(0.6,0.106,0.03));
        }
        const age=ctx.progress.oneMinus();
        // Trail_Core's actual Color curve replaces its unused InitializeParticle color.
        const hot=mix(vec3(15,3.974998,0.299997),vec3(8,0.666667,0),age.div(0.189451).clamp(0,1));
        const cool=mix(vec3(8,0.666667,0),vec3(0.1,0.008333,0),age.sub(0.189451).div(0.319556).clamp(0,1));
        const energy=select(age.lessThan(0.189451),hot,cool);
        return energy.mul(field(ctx)).mul(0.32);
      },
      opacityNode: ctx => field(ctx).mul(smoke?ctx.progress.mul(5):1).clamp(0,1),
    };
  }
  return defineVfx({
    id, duration: maximumFlightSeconds + FIRE_PROJECTILE_TAIL_SECONDS, maxInstances: 12,
    params: {head: {default: [0,0,0]}, heading: {default: [1,0,0]}, recording: {default: true}, breakSerial: {default: 0}, elapsed:{default:0}},
    build(fx) {
      for (const kind of ['smoke','contrast','fire'] as const) fx.path({
        id: kind+'-trail', maxSegments:64, blend:'alpha', orderInLayer:kind==='fire'?1:0,look:trailLook(kind,fx.param('elapsed') as Node<'float'>),
        sample:(age,ctx)=>state(age,ctx).stamps.map((stamp,index)=>{
          const lifetime=kind==='fire'?0.25:kind==='contrast'?0.2:0.5;
          const freshness=Math.max(0,1-(age-stamp.time)/lifetime);
          return {position:stamp.position,width:kind==='smoke'?0.9:0.8,
            u:1-freshness,age:freshness,connected:index>0&&stamp.connected};
        }),
      });
      const {head,heading,right,up,live}=projectileFrame(fx);
      const volumeFields = new WeakMap<VfxMaterialContext,Node<'float'>>();
      const volumeField = (ctx:VfxMaterialContext):Node<'float'> => {
        const cached=volumeFields.get(ctx);if(cached)return cached;
            const t=ctx.age.mul(-2);
            const distort=ctx.sampleTexture('distortion',ctx.uv.mul(vec2(5,0.2)).add(vec2(0,ctx.age.mul(0.5)))).r.mul(0.1);
            const first=ctx.sampleTexture('first',ctx.uv.mul(vec2(3,0.5)).add(vec2(0,t.mul(-1.25))).add(distort)).r;
            const second=ctx.sampleTexture('second',ctx.uv.mul(vec2(2,0.5)).add(vec2(0,t.negate())).add(distort)).r;
            // Mask_Both_Sides=false and InvertMask=false select V^Grad_Pow; top/bottom controls are bypassed.
            const mask=ctx.uv.y.clamp(0,1).pow(2);
            const n=normalize(right.mul(normalGeometry.x.div(0.6)).add(heading.mul(normalGeometry.y.div(-3))).add(up.mul(normalGeometry.z.div(0.6))));
            const worldNormal=normalize(modelWorldMatrix.mul(vec4(n,0)).xyz);
            const worldHead=modelWorldMatrix.mul(vec4(head,1)).xyz;
            // MF_InverseFresnel: two-sided mode, Feather_Exp=2, Feather_Hardness=1.5.
            const facing=dot(worldNormal,normalize(cameraPosition.sub(worldHead))).abs().clamp(0,1)
              .oneMinus().pow(0.5).mul(1.5).clamp(0,1).oneMinus();
            const value=first.mul(second).add(second.mul(0.1)).pow(1.2).mul(6).mul(mask).mul(facing).mul(2);
            volumeFields.set(ctx,value);
            return value;
      };
      // Original Head_Contrast_Trails renderer: half sphere, UE scale (.6,.6,3).
      // OBJ export is Y-up; restore that axis along the game-owned flight heading.
      fx.particles({capacity:1,bursts:[{time:0,count:1}],startLife:maximumFlightSeconds,
        startSize:1,startSpeed:0,rotation:{enabled:false},mesh:vfxMesh('projectile-fx-half-sphere-vertical-01'),
        meshSide:'double',blend:'alpha',orderInLayer:2,
        look:{
          textures:{
            first:{texture:vfxTexture('projectile-fx-noise-02'),colorSpace:'linear',wrap:'repeat'},
            second:{texture:vfxTexture('projectile-fx-noise-01'),colorSpace:'linear',wrap:'repeat'},
            distortion:{texture:vfxTexture('projectile-fx-noise-cloud-01'),colorSpace:'linear',wrap:'repeat'},
          },
          positionNode:ctx=>{
            const p=ctx.positionLocal as Node<'vec3'>;
            // Original FloatFromCurve: seconds, cubic tangents 18.34655 -> 0 over 0.15s.
            const phase=ctx.age.div(0.15).clamp(0,1);
            const growth=phase.pow(3).sub(phase.pow(2).mul(2)).add(phase).mul(2.7519825)
              .add(phase.pow(2).mul(3).sub(phase.pow(3).mul(2)));
            return right.mul(p.x.mul(0.6)).add(up.mul(p.z.mul(0.6)))
              .add(heading.mul(p.y.mul(-3))).mul(growth).add(head).add(heading.mul(0.8));
          },
          // Calibrated for the runtime highlight shoulder; native HDR values wash out the texture.
          colorNode:ctx=>vec3(4.2,1.55,0.035).mul(volumeField(ctx)),
          opacityNode:ctx=>select(live,volumeField(ctx).clamp(0,1),0),
        },
      });
      fx.path({id: 'fireball-core', maxSegments: 1, look: headLook, orderInLayer: 3,
        sample: (age, ctx) => {
          const s=state(age,ctx);if(!s.recording)return [];
          const back:Vec3=[s.head[0]-s.heading[0]*1.3,s.head[1]-s.heading[1]*1.3,s.head[2]-s.heading[2]*1.3];
          return [{position:back,width:0.8,u:0,age:age%1},{position:s.head,width:0.8,u:1,age:age%1}];
        }});
      fx.path({id: 'flight-embers', maxSegments: 256, blend: 'additive', orderInLayer: 4,
        look: {
          textures: {spark: {texture: vfxTexture('projectile-fx-embers-stretched-01'), colorSpace: 'linear'}},
          colorNode: () => vec3(3, 0.65, 0.025),
          opacityNode: ctx => ctx.sampleTexture('spark', ctx.uv).r.mul(ctx.progress),
        },
        sample: (age, ctx) => {
          return projectileEmbers(state(age,ctx),age);
        },
      });

    },
  });
}
/** Oriented ignition burst; local +Y points out of the firing socket. */
export function createFireProjectileMuzzle(id: string): VfxDefinition {
  return defineVfx({id, duration: 0.22, maxInstances: 12, build(fx) {
    fx.particles({capacity: 1, bursts: [{time: 0, count: 1}], startLife: [0.4, 0.6],
      startSpeed: 0.9, direction: [0,1,0], spread: 0.2, startSize: [1.7, 1.8],
      blend: 'alpha',orderInLayer:2, look: flameBurstLook, rotation: {start: RANDOM_YAW},
      sizeOverLife:burstGrowth});
    fx.particles({capacity: 14, bursts: [{time: 0, count: 14}], startLife: [0.12,0.3],
      startSpeed: [1.5,4], direction: [0,1,0], spread: 0.4, startSize: [0.012,0.025],
      map: vfxTexture('projectile-fx-embers-stretched-01'), coverage: 'red',
      mode: 'stretched', stretch: {speedFactor: 0.05,lengthFactor: 1},
      tint: [1,0.3,0.035,1], emission: 2, blend: 'additive',
      opacityOverLife: curve([0,1],[0.5,0.8],[1,0])});
    fx.particles({capacity:1,bursts:[{time:0,count:1}],startLife:[0.7,0.8],
      startSize:[1.7,1.8],startSpeed:0.25,direction:[0,1,0],look:smokeLook,blend:'alpha',orderInLayer:1,
      rotation:{start:RANDOM_YAW},sizeOverLife:burstGrowth});
    fx.light({color: [1,0.2,0.02],intensity: 1.3,range: 2,life: 0.18,curve: curve([0,1],[1,0])});
  }});
}
/** Confirmed fire impact; local +Y is the collision normal. No collision or damage is inferred. */
export function createFireProjectileImpact(id: string): VfxDefinition {
  return defineVfx({id, duration: 0.3, maxInstances: 12, build(fx) {
    fx.particles({capacity: 1, bursts: [{time: 0,count: 1}], startLife: [0.4,0.6],
      startSpeed: [0.8,1.8], direction: [0,1,0], spread: 0.75, drag: 2,
      startSize: [1.7,1.8], look: flameBurstLook, blend: 'alpha',orderInLayer:2, rotation: {start: RANDOM_YAW},
      sizeOverLife:burstGrowth});
    fx.particles({capacity: 1, bursts: [{time: 0,count: 1}], startLife: [0.9,1],
      startSpeed: [0.35,0.8], direction: [0,1,0], spread: 0.7, drag: 1.5,
      startSize: [1.6,1.7], look: smokeLook, blend: 'alpha',orderInLayer:1, rotation: {start: RANDOM_YAW,spin: [-0.3,0.3]},
      sizeOverLife:burstGrowth});
    fx.particles({capacity: 26, bursts: [{time: 0,count: 26}], startLife: [0.3,0.85],
      startSpeed: [1.5,4.5], direction: [0,1,0], spread: 1.1, gravity: 3.2,drag: 1,
      startSize: [0.009,0.022], map: vfxTexture('projectile-fx-embers-stretched-01'), coverage: 'red',
      mode: 'stretched',stretch: {speedFactor: 0.055,lengthFactor: 1},
      tint: [1,0.26,0.025,1],emission: 2.2,blend: 'additive',opacityOverLife: curve([0,1],[0.6,0.8],[1,0])});
    fx.light({color: [1,0.22,0.025],intensity: 2.4,range: 3.2,life: 0.28,curve: curve([0,1],[0.2,0.75],[1,0])});
  }});
}

export default createFireProjectile('example.fire-projectile');
