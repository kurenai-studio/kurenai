/**
 * Head look and weapon aim share the ik lateUpdate phase. LookAt clamps one
 * bone; AimIk drives one CCD chain whose target bone follows a live position.
 * Resolve bones from `mesh.skeleton.bones` — do not invent indices.
 */
import { Bone, type SkinnedMesh } from 'three/webgpu';
import type { LifetimeScope, PhaseScheduler } from 'wanaka-studio-engine';
import { AimIk, LookAt, type CcdIkChain, type PositionLike } from 'wanaka-studio-engine/ik';

export function attachLookAndAim(
  scope: LifetimeScope,
  scheduler: PhaseScheduler,
  mesh: SkinnedMesh,
  target: PositionLike,
): { readonly look: LookAt; readonly aim: AimIk | null } {
  const bones = mesh.skeleton.bones;
  const available = bones.map((bone) => bone.name).join(', ') || 'none';
  const head = bones.find((bone) => bone.name.toLowerCase().includes('head'));
  if (!(head instanceof Bone)) {
    throw new Error(`LookAt needs a bone whose name includes "head". Available: ${available}.`);
  }
  const look = LookAt.create(scope, scheduler, {
    mesh,
    bone: head,
    target,
    limitYaw: 1.1,
    limitPitch: 0.6,
    blend: 0.35,
  });
  const chain = findAimChain(mesh);
  const aim = chain
    ? AimIk.create(scope, scheduler, { mesh, chain, target, blend: 1 })
    : null;
  return { look, aim };
}

function findAimChain(mesh: SkinnedMesh): CcdIkChain | null {
  const bones = mesh.skeleton.bones;
  const effector = bones.findIndex((bone) => /hand|wrist/i.test(bone.name));
  const target = bones.findIndex((bone) => bone.name.toLowerCase().includes('ik'));
  if (effector < 0 || target < 0) return null;
  const parent = bones[effector]?.parent;
  const link = parent instanceof Bone ? bones.indexOf(parent) : -1;
  if (link < 0) return null;
  return { target, effector, links: [{ index: link }] };
}
