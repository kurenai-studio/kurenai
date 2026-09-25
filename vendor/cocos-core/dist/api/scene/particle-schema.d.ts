/**
 * Runtime schemas for the public AI/MCP particle-system operations.
 *
 * 对应 https://docs.cocos.com/creator/4.0/manual/en/particle-system/
 * 与 cocos-editor ParticleManager 暴露给 float-window / inspector 的能力。
 */
import { z } from 'zod';
/** 粒子组件标识：节点路径或组件 uuid 二选一 */
export declare const SchemaParticleIdentifier: z.ZodEffects<z.ZodObject<{
    /** 粒子组件所在节点的路径，如 'Canvas/Particles' */
    nodePath: z.ZodOptional<z.ZodString>;
    /** 粒子组件的 uuid（优先于 nodePath） */
    uuid: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    uuid?: string | undefined;
    nodePath?: string | undefined;
}, {
    uuid?: string | undefined;
    nodePath?: string | undefined;
}>, {
    uuid?: string | undefined;
    nodePath?: string | undefined;
}, {
    uuid?: string | undefined;
    nodePath?: string | undefined;
}>;
/** queryPlayInfo / setPlaySpeed 需要指定粒子组件 */
export declare const SchemaParticleSpeed: z.ZodEffects<z.ZodObject<{
    nodePath: z.ZodOptional<z.ZodString>;
    uuid: z.ZodOptional<z.ZodString>;
    /** 播放速度倍率，1 为正常速度 */
    speed: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    speed: number;
    uuid?: string | undefined;
    nodePath?: string | undefined;
}, {
    speed: number;
    uuid?: string | undefined;
    nodePath?: string | undefined;
}>, {
    speed: number;
    uuid?: string | undefined;
    nodePath?: string | undefined;
}, {
    speed: number;
    uuid?: string | undefined;
    nodePath?: string | undefined;
}>;
/** 粒子运行时信息 */
export declare const SchemaParticlePlayInfo: z.ZodObject<{
    speed: z.ZodNumber;
    time: z.ZodNumber;
    particle: z.ZodNumber;
    isPlaying: z.ZodBoolean;
    /** 找不到组件时返回 null */
    found: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    particle: number;
    time: number;
    speed: number;
    isPlaying: boolean;
    found?: boolean | undefined;
}, {
    particle: number;
    time: number;
    speed: number;
    isPlaying: boolean;
    found?: boolean | undefined;
}>;
/** play/pause/stop/restart 这类操作作用于当前选中的粒子组件 */
export declare const SchemaParticleAction: z.ZodObject<{
    /**
     * 是否仅作用于指定的粒子组件。未提供时，作用于当前选中的所有粒子组件。
     */
    nodePath: z.ZodOptional<z.ZodString>;
    uuid: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    uuid?: string | undefined;
    nodePath?: string | undefined;
}, {
    uuid?: string | undefined;
    nodePath?: string | undefined;
}>;
export declare const SchemaParticleActionResult: z.ZodObject<{
    action: z.ZodString;
    applied: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    action: string;
    applied: boolean;
}, {
    action: string;
    applied: boolean;
}>;
export type TParticleIdentifier = z.infer<typeof SchemaParticleIdentifier>;
export type TParticleSpeed = z.infer<typeof SchemaParticleSpeed>;
export type TParticlePlayInfo = z.infer<typeof SchemaParticlePlayInfo>;
export type TParticleAction = z.infer<typeof SchemaParticleAction>;
export type TParticleActionResult = z.infer<typeof SchemaParticleActionResult>;
