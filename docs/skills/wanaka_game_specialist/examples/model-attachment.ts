import * as THREE from 'three/webgpu';
import type { LifetimeScope } from 'wanaka-studio-engine';
import type { Model3DLoadOptions, Model3DLoader } from 'wanaka-studio-engine/assets';

/** Host authored `_LOD*` branches arrive as exclusive `THREE.LOD` levels after load. */

type Vector3Values = readonly [x: number, y: number, z: number];

export interface ModelAttachmentOptions {
  readonly anchorName: string;
  readonly anchorKind: 'bone' | 'node';
  readonly mountName: string;
  readonly model: Model3DLoadOptions;
  readonly position?: Vector3Values;
  readonly rotationDegrees?: Vector3Values;
  readonly uniformScale?: number;
}

function findLodLevel(
  host: THREE.Object3D,
  target: THREE.Object3D,
): { lod: THREE.LOD; level: number } | undefined {
  let result: { lod: THREE.LOD; level: number } | undefined;
  host.traverse((node) => {
    if (result || !(node instanceof THREE.LOD)) return;
    const level = node.levels.findIndex(({ object }) => {
      for (let cursor: THREE.Object3D | null = target; cursor; cursor = cursor.parent) {
        if (cursor === object) return true;
      }
      return false;
    });
    if (level >= 0) result = { lod: node, level };
  });
  return result;
}

function findAnchors(
  host: THREE.Object3D,
  rawName: string,
  kind: ModelAttachmentOptions['anchorKind'],
): THREE.Object3D[] {
  const runtimeName = THREE.PropertyBinding.sanitizeNodeName(rawName);
  const matches: THREE.Object3D[] = [];
  host.traverse((node) => {
    const isBone = 'isBone' in node && node.isBone === true;
    const suffix = node.name.startsWith(`${runtimeName}_`)
      ? node.name.slice(runtimeName.length + 1)
      : '';
    const nameMatches = node.name === runtimeName || /^\d+$/.test(suffix);
    if (nameMatches && (kind === 'node' || isBone)) matches.push(node);
  });
  if (matches.length === 1) return matches;

  const levels: Array<{ anchor: THREE.Object3D; lod: THREE.LOD; level: number }> = [];
  for (const anchor of matches) {
    const placement = findLodLevel(host, anchor);
    if (placement) levels.push({ anchor, ...placement });
  }
  const lod = levels[0]?.lod;
  const levelNumbers = levels.map(({ level }) => level);
  if (
    matches.length === 0 ||
    !lod ||
    levels.length !== matches.length ||
    matches.length !== lod.levels.length ||
    levels.some(({ lod: candidate }) => candidate !== lod) ||
    new Set(levelNumbers).size !== lod.levels.length
  ) {
    throw new Error(`Expected one ${kind} named "${rawName}" per LOD level.`);
  }
  return levels
    .sort((left, right) => left.level - right.level)
    .map(({ anchor }) => anchor);
}

export async function attachModelAtNode(
  scope: LifetimeScope,
  model3DLoader: Model3DLoader,
  host: THREE.Object3D,
  options: ModelAttachmentOptions,
) {
  const anchors = findAnchors(host, options.anchorName, options.anchorKind);
  return Promise.all(
    anchors.map(async (anchor, index) => {
      const attachedModel = await model3DLoader.load(scope, options.model);
      const mount = new THREE.Group();
      mount.name = anchors.length === 1 ? options.mountName : `${options.mountName}_LOD${index}`;

      const [px, py, pz] = options.position ?? [0, 0, 0];
      const [rx, ry, rz] = options.rotationDegrees ?? [0, 0, 0];
      mount.position.set(px, py, pz);
      mount.rotation.set(
        THREE.MathUtils.degToRad(rx),
        THREE.MathUtils.degToRad(ry),
        THREE.MathUtils.degToRad(rz),
        'YXZ',
      );
      mount.scale.setScalar(options.uniformScale ?? 1);

      anchor.add(mount);
      mount.add(attachedModel);
      scope.defer(() => mount.removeFromParent());

      return { anchor, mount, attachedModel };
    }),
  );
}
