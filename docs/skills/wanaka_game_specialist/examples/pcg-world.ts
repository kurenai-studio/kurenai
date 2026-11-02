import type { Object3D } from 'three/webgpu';

import type { SceneContext } from 'wanaka-studio-engine/scene';
import { bases, definePcgWorld } from 'wanaka-studio-engine/pcg-author';
import 'wanaka-studio-engine/pcg-kit-city';
import {
  attachPcgWorld,
  type PcgWorldAttachment,
  type PcgWorldInterest,
} from 'wanaka-studio-engine/pcg-three';
import type { PhysicsWorld } from 'wanaka-studio-engine/physics';

export const cityWorld = definePcgWorld({
  base: bases.flat({
    environment: 'temperate',
    streaming: 'far',
    urbanization: { mode: 'constant', class: 'commercial', intensity: 0.9 },
  }),
  seed: 'endless-city',
});

export function attachCityWorld(
  context: SceneContext,
  parent: Object3D,
  interest: () => PcgWorldInterest,
  physics?: PhysicsWorld,
): Promise<PcgWorldAttachment> {
  return attachPcgWorld(context, cityWorld, {
    parent,
    interest,
    ...(physics ? { physics } : {}),
  });
}
