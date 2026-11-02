import { createVfxAtlasLook as atlasLook, getVfxTextureSampling } from 'wanaka-studio-engine/vfx';
import type { Node } from 'three/webgpu';
import {
  type Vec3,
  type VfxTextureSampling,
  type VfxLayerLook,
  type VfxParticleContext,
} from 'wanaka-studio-engine/vfx';

/** One prepared texture choice; keep layout, coverage and image identity together. */
export interface SpecialTexture extends VfxTextureSampling {
  texture: { readonly assetId: string };
}
/** Select a source-file number from the caller's literal texture references before prepare. */
export function specialTexture(
  choices: readonly { readonly assetId: string }[],
  variant?: number,
): SpecialTexture | undefined {
  if (variant === undefined) return undefined;
  const texture = choices.find((choice) => Number(choice.assetId.match(/-(\d+)$/)?.[1]) === variant);
  if (!Number.isInteger(variant) || texture === undefined)
    throw new Error(`Texture variant ${String(variant)} is not among the copied texture choices.`);
  return { texture, ...getVfxTextureSampling(texture.assetId) };
}
/** Shared atlas look: preserve authored alpha for smoke volumes, use density coverage for luminous sheets. */
export function specialLook(
  asset: SpecialTexture,
  colors: readonly [Vec3, Vec3, Vec3],
  preserveSmoke = false,
  phase?: (ctx: VfxParticleContext) => Node<'float'>,
): VfxLayerLook {
  return atlasLook({
    thresholds: [0.04, 0.45, 0.45, 0.95],
    densityPower: 0.8,
    densityCoverage: [0.005, 0.12],
    texture: asset.texture,
    columns: asset.columns,
    rows: asset.rows,
    width: asset.width,
    phase,
    coverage: asset.coverage === 'rgb' ? 'rgb' : preserveSmoke ? 'alpha' : 'alpha-density',
    dark: colors[0],
    mid: colors[1],
    hot: colors[2],
  });
}
