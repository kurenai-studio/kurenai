import { z } from 'zod';
export declare const SchemaUrl: z.ZodEffects<z.ZodString, string, string>;
export declare const SchemaUUID: z.ZodEffects<z.ZodString, string, string>;
export declare const SchemaSubAssetUUID: z.ZodEffects<z.ZodString, string, string>;
export declare const SchemaPath: z.ZodEffects<z.ZodString, string, string>;
export declare const SchemaUrlOrUUIDOrPath: z.ZodEffects<z.ZodString, string, string>;
export declare const SchemaUUIDOrPath: z.ZodEffects<z.ZodString, string, string>;
export declare const SchemaUrlOrPath: z.ZodEffects<z.ZodString, string, string>;
export declare const SchemaUrlOrUUID: z.ZodEffects<z.ZodString, string, string>;
export declare const SchemaSceneIdentifier: z.ZodObject<{
    assetName: z.ZodString;
    assetUuid: z.ZodString;
    assetUrl: z.ZodString;
    assetType: z.ZodString;
}, "strip", z.ZodTypeAny, {
    assetType: string;
    assetUuid: string;
    assetName: string;
    assetUrl: string;
}, {
    assetType: string;
    assetUuid: string;
    assetName: string;
    assetUrl: string;
}>;
export declare const SchemaComponentIdentifier: z.ZodObject<{
    cid: z.ZodString;
    path: z.ZodString;
    uuid: z.ZodString;
    name: z.ZodString;
    type: z.ZodString;
    enabled: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    name: string;
    type: string;
    path: string;
    uuid: string;
    cid: string;
}, {
    enabled: boolean;
    name: string;
    type: string;
    path: string;
    uuid: string;
    cid: string;
}>;
export declare const SchemaNodeIdentifier: z.ZodObject<{
    nodeId: z.ZodString;
    path: z.ZodString;
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    path: string;
    nodeId: string;
}, {
    name: string;
    path: string;
    nodeId: string;
}>;
