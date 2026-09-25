/**
 * Public AI/MCP facade for particle-system operations.
 *
 * 对照 https://docs.cocos.com/creator/4.0/manual/en/particle-system/
 * 与 cocos-editor ParticleManager 暴露给 float-window / inspector 的能力：
 *   - play / pause / stop / restart
 *   - setPlaySpeed
 *   - queryPlayInfo
 */
import { CommonResultType } from '../base/schema-base';
import { TParticleIdentifier, TParticleSpeed, TParticlePlayInfo, TParticleAction, TParticleActionResult } from './particle-schema';
export declare class ParticleApi {
    /**
     * Query runtime info of a particle system.
     */
    queryPlayInfo(options: TParticleIdentifier): Promise<CommonResultType<TParticlePlayInfo>>;
    /**
     * Set the simulation speed of a particle system.
     */
    setPlaySpeed(options: TParticleSpeed): Promise<CommonResultType<TParticlePlayInfo>>;
    /**
     * Play the selected particle systems.
     */
    play(options: TParticleAction): Promise<CommonResultType<TParticleActionResult>>;
    /**
     * Pause the selected particle systems.
     */
    pause(options: TParticleAction): Promise<CommonResultType<TParticleActionResult>>;
    /**
     * Stop the selected particle systems.
     */
    stop(options: TParticleAction): Promise<CommonResultType<TParticleActionResult>>;
    /**
     * Restart the selected particle systems.
     */
    restart(options: TParticleAction): Promise<CommonResultType<TParticleActionResult>>;
    private _runAction;
    /**
     * 解析粒子组件所在节点的路径。优先使用调用方传入的 nodePath；
     * 若仅提供 uuid，则通过组件 uuid 反查节点，再由节点 uuid 取节点路径。
     */
    private _resolveNodePath;
    /**
     * 将 nodePath/uuid 标识解析为粒子组件 uuid。优先使用 uuid。
     */
    private _resolveUuid;
}
