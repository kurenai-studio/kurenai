// intent: Game-driven shadow projectile flight, muzzle and independently confirmed impact.
// variants: createShadowProjectile (flight), createShadowProjectileMuzzle, createShadowProjectileImpact.
// inputs: Fixed launch point; update relative head, unit heading and elapsed time. Play impact only on confirmed contact.
// Copy dependencies: ./shared/projectile-motion.ts.
// Setup in an async scene: const effect = createShadowProjectile('example.shadow-projectile');
// const vfx = useVfx(context); await vfx.prepare(effect, {});
// const handle = vfx.play(effect, playOptions);
// Import useVfx from wanaka-studio-engine/vfx; supply game-owned motion and confirmed events.
import { cameraPosition,cross,dot,mix,modelWorldMatrix,normalGeometry,normalWorld,normalize,select,vec2,vec3,vec4 } from 'three/tsl';
import { type Node } from 'three/webgpu';
import { RANDOM_YAW,type VfxDefinition,type VfxLayerLook,type VfxMaterialContext,curve,defineVfx,sampleVfxAtlas,vfxMesh,vfxTexture } from 'wanaka-studio-engine/vfx';
import { createProjectileSampler,projectileEmbers,projectileFrame } from './shared/projectile-motion.js';

// Also prepare the muzzle and impact definitions before combat.
// Play flight unparented at launchWorld with head=[0,0,0], heading=unit world direction, elapsed=0.
// Each tick update head=projectileWorld-launchWorld, heading and elapsed (seconds).
// On confirmed hit/expiry set recording=false; keep elapsed running for SHADOW_PROJECTILE_TAIL_SECONDS,
// then stop immediately. Increment breakSerial on teleport and cancel immediately on despawn.
// Muzzle and impact use local +Y along the socket/contact normal. Gameplay owns motion, hits and damage.
export const SHADOW_PROJECTILE_TAIL_SECONDS=0.65;
/** Seven original flight layers share game-owned motion, with one history per playback. */
export function createShadowProjectile(id:string,maximumFlightSeconds=5):VfxDefinition{
  const sample=createProjectileSampler(maximumFlightSeconds,SHADOW_PROJECTILE_TAIL_SECONDS);
  return defineVfx({id,duration:maximumFlightSeconds+SHADOW_PROJECTILE_TAIL_SECONDS,maxInstances:12,
    params:{head:{default:[0,0,0]},heading:{default:[1,0,0]},elapsed:{default:0},recording:{default:true},breakSerial:{default:0}},
    build(fx){
      const {head,heading,right,up,live}=projectileFrame(fx);
      const elapsed=fx.param('elapsed') as Node<'float'>;
      // Original ribbons: smoke 1.5m/.3s, violet .9m/.3s, mint 1.25m/.15s.
      for(const kind of ['smoke','violet','mint'] as const){
        const smoke=kind==='smoke',mint=kind==='mint',life=mint?0.15:0.3;
        const fields=new WeakMap<VfxMaterialContext,Node<'float'>>();
        const field=(ctx:VfxMaterialContext):Node<'float'>=>{
          const old=fields.get(ctx);if(old)return old;
          const first=ctx.sampleTexture('first',ctx.uv).r;
          const second=ctx.sampleTexture('second',ctx.uv.mul(vec2(smoke?0.5:1,1))).r;
          const u=ctx.uv.x.clamp(0,1);
          const fade=u.pow(smoke?1:0.4).mul(u.oneMinus().pow(smoke?1:1.5)).mul(smoke?3:1).clamp(0,1);
          const age=ctx.progress.oneMinus();
          const alpha=smoke?select(age.lessThan(0.716692),mix(4,2,age.div(0.716692)),mix(2,0,age.sub(0.716692).div(0.283308)))
            :mint?select(age.lessThan(0.105341),age.div(0.105341),age.oneMinus().div(0.894659))
            :select(age.lessThan(0.105341),age.div(0.105341).mul(1.25),select(age.lessThan(0.524822),mix(1.25,1.5,age.sub(0.105341).div(0.419481)),age.oneMinus().div(0.475178).mul(1.5)));
          const value=first.mul(second).pow(smoke?1:mint?2:1.5).mul(smoke?2:5).mul(fade).mul(alpha.clamp(0,4));
          fields.set(ctx,value);return value;
        };
        fx.path({id:kind+'-ribbon',maxSegments:64,orderInLayer:smoke?0:mint?4:3,blend:'alpha',
          look:{textures:{
            first:{texture:smoke?vfxTexture('projectile-fx-trailvolume-01'):mint?vfxTexture('projectile-fx-trail-02'):vfxTexture('projectile-fx-trail-shadow-01'),colorSpace:'linear',wrap:'repeat'},
            second:{texture:smoke?vfxTexture('projectile-fx-trail-01'):vfxTexture('projectile-fx-noise-cloud-01'),colorSpace:'linear',wrap:'repeat'},
          },colorNode:ctx=>smoke?vec3(0.001,0,0.003):vec3(...(mint?[0,2,0.950174] as const:[0.428792,0,2] as const)).mul(field(ctx)),
          opacityNode:ctx=>field(ctx).clamp(0,1)},
          sample:(age,ctx)=>sample(age,ctx).stamps.map((stamp,index)=>{
            const freshness=Math.max(0,1-(age-stamp.time)/life);
            return {position:stamp.position,width:smoke?1.5:mint?1.25:0.9,u:1-freshness,age:freshness,connected:index>0&&stamp.connected};
          })});
      }
      const shellFields=new WeakMap<VfxMaterialContext,Node<'float'>>();
      const shell=(ctx:VfxMaterialContext):Node<'float'>=>{
        const old=shellFields.get(ctx);if(old)return old;
        const distort=ctx.sampleTexture('distort',ctx.uv.mul(vec2(1,0.4)).add(vec2(0,elapsed))).r.mul(0.2);
        const uv=ctx.uv.mul(vec2(1,0.5)).add(vec2(0,elapsed.mul(2))).add(distort);
        const noise=ctx.sampleTexture('caustic',uv).r.mul(ctx.sampleTexture('noise',uv).r).mul(10);
        const normal=normalize(right.mul(normalGeometry.x.div(0.5)).add(heading.mul(normalGeometry.y.div(-3))).add(up.mul(normalGeometry.z.div(0.5))));
        const worldNormal=normalize(modelWorldMatrix.mul(vec4(normal,0)).xyz);
        const worldHead=modelWorldMatrix.mul(vec4(head,1)).xyz;
        const facing=dot(worldNormal,normalize(cameraPosition.sub(worldHead))).abs().clamp(0,1).oneMinus().pow(1/3).oneMinus();
        const value=noise.mul(ctx.uv.y.clamp(0,1).pow(4)).mul(facing).mul(25).clamp(0,1);
        shellFields.set(ctx,value);return value;
      };
      fx.particles({capacity:1,bursts:[{time:0,count:1}],startLife:maximumFlightSeconds,startSpeed:0,startSize:1,
        rotation:{enabled:false},mesh:vfxMesh('projectile-fx-half-sphere-vertical-01'),meshSide:'double',blend:'alpha',orderInLayer:2,
        look:{textures:{
          caustic:{texture:vfxTexture('projectile-fx-noisecaustics-02'),colorSpace:'linear',wrap:'repeat'},
          noise:{texture:vfxTexture('projectile-fx-noise-04'),colorSpace:'linear',wrap:'repeat'},
          distort:{texture:vfxTexture('projectile-fx-perlin-01'),colorSpace:'linear',wrap:'repeat'},
        },positionNode:ctx=>{const p=ctx.positionLocal as Node<'vec3'>;
          return right.mul(p.x.mul(0.5)).add(up.mul(p.z.mul(0.5))).add(heading.mul(p.y.mul(-3))).add(head).add(heading.mul(0.15));},
        colorNode:()=>vec3(0,0,0),opacityNode:ctx=>select(live,shell(ctx),0)}});
      // MI_ProjectileCore_01 is a static head texture, not a flipbook or a fireball atlas.
      fx.particles({capacity:1,bursts:[{time:0,count:1}],startLife:maximumFlightSeconds,startSpeed:0,startSize:1,
        mesh:'quad',meshSide:'double',rotation:{enabled:false},blend:'alpha',orderInLayer:5,
        look:{textures:{head:{texture:vfxTexture('projectile-fx-projectile-head-01'),colorSpace:'linear'}},
          positionNode:ctx=>{
            const p=ctx.positionLocal as Node<'vec3'>;
            const worldHead=modelWorldMatrix.mul(vec4(head,1)).xyz;
            const view=normalize(cameraPosition.sub(worldHead));
            const side=select(dot(view,heading).abs().greaterThan(0.98),up,normalize(cross(heading,view)));
            return head.add(heading.mul(p.y.mul(0.8).sub(0.1))).add(side.mul(p.x.mul(0.4)));
          },colorNode:()=>vec3(0.1355622,2,1.4334454),
          opacityNode:ctx=>select(live,ctx.sampleTexture('head',ctx.uv).r,0)}});
      for(const black of [true,false])fx.path({id:black?'black-motes':'mint-motes',maxSegments:256,blend:black?'alpha':'additive',orderInLayer:6,
        look:{textures:{spark:{texture:vfxTexture('projectile-fx-embers-stretched-01'),colorSpace:'linear'}},
          colorNode:()=>black?vec3(0):vec3(0.134,2,1.42),
          opacityNode:ctx=>ctx.sampleTexture('spark',ctx.uv).r.mul(ctx.progress)},
        sample:(age,ctx)=>projectileEmbers(sample(age,ctx),age)});
    }});
}
function shadowSmokeLook(texture:ReturnType<typeof vfxTexture>,wispy:boolean):VfxLayerLook{
  const fields=new WeakMap<VfxMaterialContext,Node<'vec4'>>();
  const read=(ctx:VfxMaterialContext):Node<'vec4'>=>{const old=fields.get(ctx);if(old)return old;
    const t=ctx.progress,t2=t.pow(2),t3=t.pow(3);
    const phase=t3.sub(t2.mul(2)).add(t).mul(wispy?1.683019:2.286921)
      .add(t2.mul(3).sub(t3.mul(2)).mul(0.95)).add(t3.sub(t2).mul(0.660078));
    const value=sampleVfxAtlas(ctx,{textureKey:'smoke',columns:8,rows:8,width:2048,phase,mix:true});fields.set(ctx,value);return value;};
  return {textures:{smoke:{texture,colorSpace:'srgb'}},colorNode:ctx=>{
    const d=read(ctx).r,mid=wispy?0.421875:0.151042;
    const ramp=select(d.lessThan(0.5),mix(vec3(0),vec3(mid),d.mul(2)),mix(vec3(mid),vec3(1),d.mul(2).sub(1)));
    return ramp.mul(vec3(0.05,0,0.22));
  },opacityNode:ctx=>read(ctx).r.pow(wispy?0.75:0.95).clamp(0,1)};
}
const smoke=shadowSmokeLook(vfxTexture('projectile-fx-smoke-03-ra'),false);
const wisps=shadowSmokeLook(vfxTexture('projectile-fx-smoke-02-ra'),true);
function smokeGrowth(from:number,to:number,startTangent:number,endTangent:number){
  return curve(...[0,0.1,0.25,0.5,0.75,1].map(t=>[t,1.5*((2*t*t*t-3*t*t+1)*from+(t*t*t-2*t*t+t)*startTangent+(-2*t*t*t+3*t*t)*to+(t*t*t-t*t)*endTangent)] as const));
}
function shadowBurst(id:string,impact:boolean):VfxDefinition{
  return defineVfx({id,duration:0.25,maxInstances:12,build(fx){
    // Dense smoke and wispy smoke have different original atlases and opacity powers.
    const profiles=impact?[
      {look:smoke,life:[0.6,0.8] as const,size:[2,2.25] as const,growth:smokeGrowth(0.75,1.2,1.323825,0.046626)},
      {look:wisps,life:[0.4,0.5] as const,size:[2.2,2.5] as const,growth:smokeGrowth(1,1.175,0.550045,0.039291)},
      {look:wisps,life:[0.6,0.8] as const,size:[1.5,1.75] as const,growth:smokeGrowth(0.65,1.45,2.764494,0.022386)},
    ]:[
      {look:smoke,life:[0.65,0.85] as const,size:[2,2.5] as const,growth:curve([0,0],[0.1,0.55],[0.20422,0.9342315],[0.5,1.28],[1,1.5])},
      {look:wisps,life:[0.65,0.85] as const,size:[2,2.5] as const,growth:curve([0,0],[0.1,0.55],[0.20422,0.9342315],[0.5,1.28],[1,1.5])},
    ];
    for(const profile of profiles)fx.particles({capacity:1,bursts:[{time:0,count:1}],
      startLife:profile.life,startSize:profile.size,startSpeed:[0.15,0.65],
      direction:[0,1,0],spread:0.7,drag:2,look:profile.look,blend:'alpha',orderInLayer:2,
      rotation:{start:RANDOM_YAW,spin:[-0.2,0.2]},sizeOverLife:profile.growth,
      opacityOverLife:curve([0,1],[0.7,1],[1,0])});
    // Source contrast flashes sit behind the smoke rather than raising smoke opacity.
    fx.particles({capacity:1,bursts:[{time:0,count:1}],startLife:0.35,startSpeed:0,startSize:impact?2.8:2.1,
      map:vfxTexture('projectile-fx-flash-bloom-02'),coverage:'red',tint:[0,0,0,1],blend:'alpha',orderInLayer:1,
      rotation:{start:RANDOM_YAW},sizeOverLife:curve([0,0.4],[0.3,1],[1,1.2]),opacityOverLife:curve([0,1],[0.5,0.6],[1,0])});
    if(impact)fx.particles({capacity:1,bursts:[{time:0,count:1}],startLife:0.5,startSpeed:0,startSize:1,
      mesh:vfxMesh('projectile-fx-half-sphere-vertical-01'),meshScale:[0.7,1.4,0.7],meshSide:'double',
      rotation:{enabled:false},blend:'alpha',orderInLayer:1,
      look:{textures:{noise:{texture:vfxTexture('projectile-fx-noise-03'),colorSpace:'linear',wrap:'repeat'},
        distort:{texture:vfxTexture('projectile-fx-perlin-01'),colorSpace:'linear',wrap:'repeat'}},
        colorNode:()=>vec3(0.488637,0,2),opacityNode:ctx=>{
          const offset=ctx.sampleTexture('distort',ctx.uv.mul(vec2(1,0.5)).add(vec2(0,ctx.age.mul(0.5)))).r.mul(0.15);
          const facing=dot(normalWorld,normalize(cameraPosition.sub(ctx.positionWorld??modelWorldMatrix.mul(vec4(ctx.position,1)).xyz))).abs().clamp(0,1)
            .oneMinus().pow(0.8).mul(1.4).clamp(0,1).oneMinus();
          return ctx.sampleTexture('noise',ctx.uv.mul(vec2(5,0.5)).add(offset)).r.pow(1.5)
            .mul(ctx.uv.y.clamp(0,1)).mul(facing).mul(ctx.progress.oneMinus()).mul(5).clamp(0,1);}},
      sizeOverLife:curve([0,0.2],[0.2,0.9],[1,1.5]),opacityOverLife:curve([0,1],[0.4,0.8],[1,0])});
    fx.particles({capacity:1,bursts:[{time:0,count:1}],startLife:0.18,startSpeed:0,startSize:impact?1.1:0.65,
      map:vfxTexture('projectile-fx-glow-01'),coverage:'red',tint:[0.0677,1,0.7167,1],emission:2,blend:'additive',orderInLayer:4,
      sizeOverLife:curve([0,0.35],[0.1,1],[1,0.3]),opacityOverLife:curve([0,1],[0.3,0.5],[1,0])});
    fx.particles({capacity:impact?35:18,bursts:[{time:0,count:impact?35:18}],startLife:[0.3,0.85],startSpeed:impact?[0.8,3]:[0.5,2],
      direction:[0,1,0],spread:0.8,drag:1,startSize:[0.008,0.018],map:vfxTexture('projectile-fx-embers-stretched-01'),coverage:'red',
      tint:[0.067,1,0.71,1],emission:2,blend:'additive',mode:'stretched',stretch:{speedFactor:0.03,lengthFactor:1},
      opacityOverLife:curve([0,1],[0.6,0.6],[1,0])});
    fx.light({color:[0.03,1,0.72],intensity:impact?1.2:0.6,range:2,life:0.2,curve:curve([0,1],[1,0])});
  }});
}
/** Local +Y points out of the firing socket. */
export function createShadowProjectileMuzzle(id:string):VfxDefinition{return shadowBurst(id,false);}
/** Local +Y follows the confirmed contact normal. */
export function createShadowProjectileImpact(id:string):VfxDefinition{return shadowBurst(id,true);}

export default createShadowProjectile('example.shadow-projectile');
