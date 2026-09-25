import type { ParticleSystem } from 'cc';
import type { IProperty } from '../../../@types/public';
type RestoreProperty = (target: object, path: string, dump: IProperty) => Promise<unknown>;
/**
 * Restore particle materials as one mode-aware operation. Replaying the hidden and public
 * aliases independently can destroy the CPU material when the unused GPU material is null.
 * Asset decoding finishes before mutating the live renderer; normal fields still use decodePatch.
 */
export declare function restoreParticleSystemSnapshot(component: ParticleSystem, dump: IProperty, restore: RestoreProperty): Promise<void>;
export {};
