import { z } from 'zod';
export declare function normalizeAssetDbUrlInput(value: string): string;
export declare const SchemaAssetDbUrl: z.ZodEffects<z.ZodString, string, string>;
export declare const SchemaAssetDbUrlOrUUID: z.ZodEffects<z.ZodString, string, string>;
