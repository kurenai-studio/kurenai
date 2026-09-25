import { IPublicParticleService } from '../../common';
/**
 * 粒子系统服务代理：主进程通过 RPC 调用场景进程的 ParticleService。
 * 与 cocos-editor ParticleManager 对齐，覆盖 float-window / inspector
 * 需要的 play / pause / stop / restart / setPlaySpeed / queryPlayInfo 能力。
 */
export declare const ParticleProxy: IPublicParticleService;
