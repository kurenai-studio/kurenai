import {normalize,cross,select,vec3} from 'three/tsl';
import type {Node} from 'three/webgpu';
import {createVfxPositionHistory,type Vec3,type VfxPositionHistory,type VfxPositionStamp,type VfxPathSampleContext,type VfxKitBuilder,type VfxBillboardPathPoint} from 'wanaka-studio-engine/vfx';
interface FlightState {
  age: number;
  history: VfxPositionHistory;
  stamps: readonly VfxPositionStamp[];
  head: Vec3;
  recording: boolean;
  heading: Vec3;
}
/** Per-playback history for a fixed, world-aligned launch frame. */
export function createProjectileSampler(maximumFlightSeconds:number,tailSeconds:number){
  if(!Number.isFinite(maximumFlightSeconds)||maximumFlightSeconds<=0||maximumFlightSeconds>30)
    throw new Error('Projectile flight duration must be within 0..30 seconds.');
  const states = new WeakMap<VfxPathSampleContext, FlightState>();
  function state(age: number, context?: VfxPathSampleContext): FlightState {
    if (!context) throw new Error('Projectile requires its playback context.');
    let result = states.get(context);
    if (!result || age < result.age) {
      result = {age: -1, history: createVfxPositionHistory({lifetime: tailSeconds, maxSamples: 64}), stamps: [], head: [0,0,0], heading: [1,0,0], recording: true};
      states.set(context, result);
    }
    if (result.age === age) return result;
    const head = context.param('head');
    if (!Array.isArray(head) || head.length !== 3 || !head.every(Number.isFinite))
      throw new Error('Projectile head must be a finite local 3D point.');
    const [x,y,z] = head;
    if (typeof x !== 'number' || typeof y !== 'number' || typeof z !== 'number') throw new Error('Projectile head coordinates are missing.');
    const heading=context.param('heading');
    if(!Array.isArray(heading)||heading.length!==3||!heading.every(Number.isFinite))
      throw new Error('Projectile heading must be a finite nonzero 3D direction.');
    const [hx,hy,hz]=heading;
    if(typeof hx!=='number'||typeof hy!=='number'||typeof hz!=='number'||Math.hypot(hx,hy,hz)<0.00001)
      throw new Error('Projectile heading must be a finite nonzero 3D direction.');
    const magnitude=Math.hypot(hx,hy,hz);result.heading=[hx/magnitude,hy/magnitude,hz/magnitude];
    result.head = [x,y,z];
    result.recording = context.param('recording') === true && age <= maximumFlightSeconds;
    const serial = context.param('breakSerial');
    result.stamps = result.history.sample(age, result.head, result.recording, typeof serial === 'number' ? serial : 0);
    result.age = age;
    return result;
  }
  return state;
}
/** Same flight basis for the CPU-driven head and GPU mesh shell. */
export function projectileFrame(fx:VfxKitBuilder){
  const head=fx.param('head') as Node<'vec3'>;
  const heading=normalize(fx.param('heading') as Node<'vec3'>);
  const referenceUp=select(heading.y.abs().greaterThan(0.98),vec3(0,0,1),vec3(0,1,0));
  const right=normalize(cross(heading,referenceUp));
  return {head,heading,right,up:normalize(cross(right,heading)),live:fx.param('recording') as Node<'bool'>};
}

/** Distance-seeded embers retain their identity while old history samples expire. */
export function projectileEmbers(s:FlightState,age:number):VfxBillboardPathPoint[]{
  const points:VfxBillboardPathPoint[]=[];
          // Niagara emits by distance (User.Trail_Embers_SpawnSpacing=5 cm), not by frame rate.
          for(let i=1;i<s.stamps.length&&points.length<512;i++){
            const previous=s.stamps[i-1],stamp=s.stamps[i];
            if(!previous||!stamp)continue;
            const delta:Vec3=[stamp.position[0]-previous.position[0],stamp.position[1]-previous.position[1],stamp.position[2]-previous.position[2]];
            const length=Math.hypot(...delta);
            if(!stamp.connected)continue;
            if(length<0.00001)continue;
            const first=Math.floor(previous.distance/0.05)+1,last=Math.floor(stamp.distance/0.05);
            for(let bucket=first;bucket<=last&&points.length<512;bucket++){
              const fraction=(bucket*0.05-previous.distance)/length;
              const t=age-(previous.time+(stamp.time-previous.time)*fraction);
              if(t<0.02||t>0.48)continue;
              const spread=Math.sin(bucket*127.1);
              const at:Vec3=[previous.position[0]+delta[0]*fraction-t*s.heading[0]*0.4,
                previous.position[1]+delta[1]*fraction+spread*t*0.65-t*t,
                previous.position[2]+delta[2]*fraction+Math.cos(bucket*74.7)*t*0.5];
              points.push({position:at,width:0.018,u:0,age:1-t/0.48,connected:false},
                {position:[at[0]+delta[0]/length*0.055,at[1]+delta[1]/length*0.055,at[2]+delta[2]/length*0.055],width:0.008,u:1,age:1-t/0.48});
            }
          }
  return points;
}
