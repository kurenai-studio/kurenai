"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParticleProxy = void 0;
const rpc_1 = require("../rpc");
/**
 * 粒子系统服务代理：主进程通过 RPC 调用场景进程的 ParticleService。
 * 与 cocos-editor ParticleManager 对齐，覆盖 float-window / inspector
 * 需要的 play / pause / stop / restart / setPlaySpeed / queryPlayInfo 能力。
 */
exports.ParticleProxy = {
    queryPlayInfo(uuid) {
        return rpc_1.Rpc.getInstance().request('Particle', 'queryPlayInfo', [uuid]);
    },
    setPlaySpeed(uuid, speed) {
        return rpc_1.Rpc.getInstance().request('Particle', 'setPlaySpeed', [uuid, speed]);
    },
    play() {
        return rpc_1.Rpc.getInstance().request('Particle', 'play');
    },
    stop() {
        return rpc_1.Rpc.getInstance().request('Particle', 'stop');
    },
    pause() {
        return rpc_1.Rpc.getInstance().request('Particle', 'pause');
    },
    restart() {
        return rpc_1.Rpc.getInstance().request('Particle', 'restart');
    },
};
