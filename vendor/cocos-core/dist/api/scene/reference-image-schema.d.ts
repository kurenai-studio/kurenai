/** Runtime schemas for the public AI/MCP reference-image operations. */
import { z } from 'zod';
export declare const SchemaReferenceImageParameters: z.ZodEffects<z.ZodObject<{
    x: z.ZodOptional<z.ZodNumber>;
    y: z.ZodOptional<z.ZodNumber>;
    scaleX: z.ZodOptional<z.ZodNumber>;
    scaleY: z.ZodOptional<z.ZodNumber>;
    opacity: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    x?: number | undefined;
    y?: number | undefined;
    opacity?: number | undefined;
    scaleX?: number | undefined;
    scaleY?: number | undefined;
}, {
    x?: number | undefined;
    y?: number | undefined;
    opacity?: number | undefined;
    scaleX?: number | undefined;
    scaleY?: number | undefined;
}>, {
    x?: number | undefined;
    y?: number | undefined;
    opacity?: number | undefined;
    scaleX?: number | undefined;
    scaleY?: number | undefined;
}, {
    x?: number | undefined;
    y?: number | undefined;
    opacity?: number | undefined;
    scaleX?: number | undefined;
    scaleY?: number | undefined;
}>;
export declare const SchemaReferenceImagePath: z.ZodObject<{
    path: z.ZodString;
}, "strip", z.ZodTypeAny, {
    path: string;
}, {
    path: string;
}>;
export declare const SchemaReferenceImageVisibility: z.ZodObject<{
    desiredVisible: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    desiredVisible: boolean;
}, {
    desiredVisible: boolean;
}>;
export declare const SchemaReferenceImageState: z.ZodObject<{
    images: z.ZodArray<z.ZodObject<{
        path: z.ZodString;
        x: z.ZodNumber;
        y: z.ZodNumber;
        scaleX: z.ZodNumber;
        scaleY: z.ZodNumber;
        opacity: z.ZodNumber;
        missing: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        path: string;
        x: number;
        y: number;
        opacity: number;
        missing: boolean;
        scaleX: number;
        scaleY: number;
    }, {
        path: string;
        x: number;
        y: number;
        opacity: number;
        missing: boolean;
        scaleX: number;
        scaleY: number;
    }>, "many">;
    current: z.ZodObject<{
        sceneUuid: z.ZodNullable<z.ZodString>;
        imagePath: z.ZodNullable<z.ZodString>;
        image: z.ZodNullable<z.ZodObject<{
            path: z.ZodString;
            x: z.ZodNumber;
            y: z.ZodNumber;
            scaleX: z.ZodNumber;
            scaleY: z.ZodNumber;
            opacity: z.ZodNumber;
            missing: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            path: string;
            x: number;
            y: number;
            opacity: number;
            missing: boolean;
            scaleX: number;
            scaleY: number;
        }, {
            path: string;
            x: number;
            y: number;
            opacity: number;
            missing: boolean;
            scaleX: number;
            scaleY: number;
        }>>;
    }, "strip", z.ZodTypeAny, {
        image: {
            path: string;
            x: number;
            y: number;
            opacity: number;
            missing: boolean;
            scaleX: number;
            scaleY: number;
        } | null;
        sceneUuid: string | null;
        imagePath: string | null;
    }, {
        image: {
            path: string;
            x: number;
            y: number;
            opacity: number;
            missing: boolean;
            scaleX: number;
            scaleY: number;
        } | null;
        sceneUuid: string | null;
        imagePath: string | null;
    }>;
    desiredVisible: z.ZodBoolean;
    effectiveVisible: z.ZodBoolean;
    visibilityReason: z.ZodEnum<["visible", "disabled", "no-editor", "not-2d", "unbound", "missing", "load-error"]>;
    is2D: z.ZodBoolean;
    hasOpenEditor: z.ZodBoolean;
    error: z.ZodNullable<z.ZodObject<{
        stage: z.ZodEnum<["config", "file", "decode"]>;
        message: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        message: string;
        stage: "file" | "config" | "decode";
    }, {
        message: string;
        stage: "file" | "config" | "decode";
    }>>;
}, "strip", z.ZodTypeAny, {
    error: {
        message: string;
        stage: "file" | "config" | "decode";
    } | null;
    images: {
        path: string;
        x: number;
        y: number;
        opacity: number;
        missing: boolean;
        scaleX: number;
        scaleY: number;
    }[];
    is2D: boolean;
    desiredVisible: boolean;
    current: {
        image: {
            path: string;
            x: number;
            y: number;
            opacity: number;
            missing: boolean;
            scaleX: number;
            scaleY: number;
        } | null;
        sceneUuid: string | null;
        imagePath: string | null;
    };
    effectiveVisible: boolean;
    visibilityReason: "visible" | "disabled" | "no-editor" | "not-2d" | "unbound" | "missing" | "load-error";
    hasOpenEditor: boolean;
}, {
    error: {
        message: string;
        stage: "file" | "config" | "decode";
    } | null;
    images: {
        path: string;
        x: number;
        y: number;
        opacity: number;
        missing: boolean;
        scaleX: number;
        scaleY: number;
    }[];
    is2D: boolean;
    desiredVisible: boolean;
    current: {
        image: {
            path: string;
            x: number;
            y: number;
            opacity: number;
            missing: boolean;
            scaleX: number;
            scaleY: number;
        } | null;
        sceneUuid: string | null;
        imagePath: string | null;
    };
    effectiveVisible: boolean;
    visibilityReason: "visible" | "disabled" | "no-editor" | "not-2d" | "unbound" | "missing" | "load-error";
    hasOpenEditor: boolean;
}>;
export type TReferenceImageParameters = z.infer<typeof SchemaReferenceImageParameters>;
export type TReferenceImagePath = z.infer<typeof SchemaReferenceImagePath>;
export type TReferenceImageVisibility = z.infer<typeof SchemaReferenceImageVisibility>;
export type TReferenceImageState = z.infer<typeof SchemaReferenceImageState>;
