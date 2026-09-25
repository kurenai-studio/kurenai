import { z } from 'zod';
import { INodeInfo } from '../../core/scene';
import { SchemaNodeIdentifier } from '../base/schema-identifier';
export declare const SchemaNodeProperty: z.ZodObject<{
    position: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        z: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        z: number;
    }, {
        x: number;
        y: number;
        z: number;
    }>;
    rotation: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        z: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        z: number;
    }, {
        x: number;
        y: number;
        z: number;
    }>;
    scale: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        z: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        z: number;
    }, {
        x: number;
        y: number;
        z: number;
    }>;
    mobility: z.ZodNumber;
    layer: z.ZodNumber;
    active: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    layer: number;
    rotation: {
        x: number;
        y: number;
        z: number;
    };
    scale: {
        x: number;
        y: number;
        z: number;
    };
    position: {
        x: number;
        y: number;
        z: number;
    };
    active: boolean;
    mobility: number;
}, {
    layer: number;
    rotation: {
        x: number;
        y: number;
        z: number;
    };
    scale: {
        x: number;
        y: number;
        z: number;
    };
    position: {
        x: number;
        y: number;
        z: number;
    };
    active: boolean;
    mobility: number;
}>;
export declare const SchemaComponentOrDetail: z.ZodUnion<[z.ZodType<import("../../core/scene").IComponentInfo, z.ZodTypeDef, import("../../core/scene").IComponentInfo>, z.ZodObject<{
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
}>]>;
export declare const SchemaNode: z.ZodType<INodeInfo>;
export declare const SchemaNodeSearch: z.ZodObject<{
    nodeId: z.ZodString;
    path: z.ZodString;
    name: z.ZodString;
} & {
    deeps: z.ZodDefault<z.ZodNumber>;
    includeChildren: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    path: string;
    nodeId: string;
    deeps: number;
    includeChildren: boolean;
}, {
    name: string;
    path: string;
    nodeId: string;
    deeps?: number | undefined;
    includeChildren?: boolean | undefined;
}>;
export declare const SchemaNodeQuery: z.ZodObject<{
    path: z.ZodString;
    includeChildren: z.ZodDefault<z.ZodBoolean>;
    includeComponents: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    path: string;
    includeChildren: boolean;
    includeComponents: boolean;
}, {
    path: string;
    includeChildren?: boolean | undefined;
    includeComponents?: boolean | undefined;
}>;
export declare const SchemaNodeQueryResult: z.ZodType<INodeInfo>;
export declare const SchemaNodeUpdate: z.ZodObject<{
    path: z.ZodString;
    name: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    properties: z.ZodOptional<z.ZodObject<{
        position: z.ZodOptional<z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
            z: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            x: number;
            y: number;
            z: number;
        }, {
            x: number;
            y: number;
            z: number;
        }>>;
        rotation: z.ZodOptional<z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
            z: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            x: number;
            y: number;
            z: number;
        }, {
            x: number;
            y: number;
            z: number;
        }>>;
        scale: z.ZodOptional<z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
            z: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            x: number;
            y: number;
            z: number;
        }, {
            x: number;
            y: number;
            z: number;
        }>>;
        mobility: z.ZodOptional<z.ZodNumber>;
        layer: z.ZodOptional<z.ZodNumber>;
        active: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        layer?: number | undefined;
        rotation?: {
            x: number;
            y: number;
            z: number;
        } | undefined;
        scale?: {
            x: number;
            y: number;
            z: number;
        } | undefined;
        position?: {
            x: number;
            y: number;
            z: number;
        } | undefined;
        active?: boolean | undefined;
        mobility?: number | undefined;
    }, {
        layer?: number | undefined;
        rotation?: {
            x: number;
            y: number;
            z: number;
        } | undefined;
        scale?: {
            x: number;
            y: number;
            z: number;
        } | undefined;
        position?: {
            x: number;
            y: number;
            z: number;
        } | undefined;
        active?: boolean | undefined;
        mobility?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    path: string;
    name?: string | undefined;
    properties?: {
        layer?: number | undefined;
        rotation?: {
            x: number;
            y: number;
            z: number;
        } | undefined;
        scale?: {
            x: number;
            y: number;
            z: number;
        } | undefined;
        position?: {
            x: number;
            y: number;
            z: number;
        } | undefined;
        active?: boolean | undefined;
        mobility?: number | undefined;
    } | undefined;
}, {
    path: string;
    name?: string | undefined;
    properties?: {
        layer?: number | undefined;
        rotation?: {
            x: number;
            y: number;
            z: number;
        } | undefined;
        scale?: {
            x: number;
            y: number;
            z: number;
        } | undefined;
        position?: {
            x: number;
            y: number;
            z: number;
        } | undefined;
        active?: boolean | undefined;
        mobility?: number | undefined;
    } | undefined;
}>;
export declare const SchemaNodeUpdateResult: z.ZodObject<{
    path: z.ZodString;
}, "strip", z.ZodTypeAny, {
    path: string;
}, {
    path: string;
}>;
export declare const SchemaNodeDeleteResult: z.ZodObject<{
    path: z.ZodString;
}, "strip", z.ZodTypeAny, {
    path: string;
}, {
    path: string;
}>;
export declare const SchemaNodeDelete: z.ZodObject<{
    path: z.ZodString;
    keepWorldTransform: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    path: string;
    keepWorldTransform?: boolean | undefined;
}, {
    path: string;
    keepWorldTransform?: boolean | undefined;
}>;
export declare const SchemaNodeCreateByAsset: z.ZodObject<{
    path: z.ZodString;
    name: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    workMode: z.ZodOptional<z.ZodEnum<["2d", "3d"]>>;
    keepWorldTransform: z.ZodOptional<z.ZodBoolean>;
    position: z.ZodOptional<z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        z: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        z: number;
    }, {
        x: number;
        y: number;
        z: number;
    }>>;
    canvasRequired: z.ZodOptional<z.ZodBoolean>;
    prefabCanvasHandling: z.ZodOptional<z.ZodEnum<["add-root-ui-transform", "create-canvas"]>>;
} & {
    preflightToken: z.ZodOptional<z.ZodString>;
} & {
    dbURL: z.ZodEffects<z.ZodString, string, string>;
}, "strip", z.ZodTypeAny, {
    path: string;
    dbURL: string;
    name?: string | undefined;
    position?: {
        x: number;
        y: number;
        z: number;
    } | undefined;
    canvasRequired?: boolean | undefined;
    keepWorldTransform?: boolean | undefined;
    workMode?: "3d" | "2d" | undefined;
    prefabCanvasHandling?: "add-root-ui-transform" | "create-canvas" | undefined;
    preflightToken?: string | undefined;
}, {
    path: string;
    dbURL: string;
    name?: string | undefined;
    position?: {
        x: number;
        y: number;
        z: number;
    } | undefined;
    canvasRequired?: boolean | undefined;
    keepWorldTransform?: boolean | undefined;
    workMode?: "3d" | "2d" | undefined;
    prefabCanvasHandling?: "add-root-ui-transform" | "create-canvas" | undefined;
    preflightToken?: string | undefined;
}>;
export declare const SchemaNodeCreateByType: z.ZodObject<{
    path: z.ZodString;
    name: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    workMode: z.ZodOptional<z.ZodEnum<["2d", "3d"]>>;
    keepWorldTransform: z.ZodOptional<z.ZodBoolean>;
    position: z.ZodOptional<z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        z: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        z: number;
    }, {
        x: number;
        y: number;
        z: number;
    }>>;
    canvasRequired: z.ZodOptional<z.ZodBoolean>;
    prefabCanvasHandling: z.ZodOptional<z.ZodEnum<["add-root-ui-transform", "create-canvas"]>>;
} & {
    preflightToken: z.ZodOptional<z.ZodString>;
} & {
    nodeType: z.ZodEnum<[string, ...string[]]>;
}, "strip", z.ZodTypeAny, {
    path: string;
    nodeType: string;
    name?: string | undefined;
    position?: {
        x: number;
        y: number;
        z: number;
    } | undefined;
    canvasRequired?: boolean | undefined;
    keepWorldTransform?: boolean | undefined;
    workMode?: "3d" | "2d" | undefined;
    prefabCanvasHandling?: "add-root-ui-transform" | "create-canvas" | undefined;
    preflightToken?: string | undefined;
}, {
    path: string;
    nodeType: string;
    name?: string | undefined;
    position?: {
        x: number;
        y: number;
        z: number;
    } | undefined;
    canvasRequired?: boolean | undefined;
    keepWorldTransform?: boolean | undefined;
    workMode?: "3d" | "2d" | undefined;
    prefabCanvasHandling?: "add-root-ui-transform" | "create-canvas" | undefined;
    preflightToken?: string | undefined;
}>;
export type TDeleteNodeOptions = z.infer<typeof SchemaNodeDelete>;
export type TUpdateNodeOptions = z.infer<typeof SchemaNodeUpdate>;
export type TCreateNodeByAssetOptions = z.infer<typeof SchemaNodeCreateByAsset>;
export type TCreateNodeByTypeOptions = z.infer<typeof SchemaNodeCreateByType>;
export type TQueryNodeOptions = z.infer<typeof SchemaNodeQuery>;
export type TNodeDetail = z.infer<typeof SchemaNodeQueryResult>;
export type TNodeUpdateResult = z.infer<typeof SchemaNodeUpdateResult>;
export type TNodeDeleteResult = z.infer<typeof SchemaNodeDeleteResult>;
export type TNode = z.infer<typeof SchemaNode>;
export type TNodeIdentifier = z.infer<typeof SchemaNodeIdentifier>;
