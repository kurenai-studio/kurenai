"use strict";
/**
 * 粒子系统服务接口，与 cocos-editor ParticleManager 对齐。
 * 负责管理粒子系统在编辑模式下的播放、停止、暂停、重启、
 * 播放速度与运行时信息查询等能力。
 *
 * 这些方法对应 cocos-editor 中 float-window / inspector
 * 通过 callSceneMethod 调用的 playParticle / pauseParticle /
 * stopParticle / restartParticle / setParticlePlaySpeed /
 * queryParticlePlayInfo 等场景方法。
 */
Object.defineProperty(exports, "__esModule", { value: true });
