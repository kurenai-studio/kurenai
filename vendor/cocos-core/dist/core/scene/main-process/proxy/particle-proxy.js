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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFydGljbGUtcHJveHkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9zY2VuZS9tYWluLXByb2Nlc3MvcHJveHkvcGFydGljbGUtcHJveHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsZ0NBQTZCO0FBRTdCOzs7O0dBSUc7QUFDVSxRQUFBLGFBQWEsR0FBMkI7SUFDakQsYUFBYSxDQUFDLElBQVk7UUFDdEIsT0FBTyxTQUFHLENBQUMsV0FBVyxFQUFFLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxlQUFlLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQzFFLENBQUM7SUFDRCxZQUFZLENBQUMsSUFBWSxFQUFFLEtBQWE7UUFDcEMsT0FBTyxTQUFHLENBQUMsV0FBVyxFQUFFLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxjQUFjLEVBQUUsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUNoRixDQUFDO0lBQ0QsSUFBSTtRQUNBLE9BQU8sU0FBRyxDQUFDLFdBQVcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDekQsQ0FBQztJQUNELElBQUk7UUFDQSxPQUFPLFNBQUcsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ3pELENBQUM7SUFDRCxLQUFLO1FBQ0QsT0FBTyxTQUFHLENBQUMsV0FBVyxFQUFFLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUMxRCxDQUFDO0lBQ0QsT0FBTztRQUNILE9BQU8sU0FBRyxDQUFDLFdBQVcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDNUQsQ0FBQztDQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJUHVibGljUGFydGljbGVTZXJ2aWNlLCBJUGFydGljbGVQbGF5SW5mbyB9IGZyb20gJy4uLy4uL2NvbW1vbic7XG5pbXBvcnQgeyBScGMgfSBmcm9tICcuLi9ycGMnO1xuXG4vKipcbiAqIOeykuWtkOezu+e7n+acjeWKoeS7o+eQhu+8muS4u+i/m+eoi+mAmui/hyBSUEMg6LCD55So5Zy65pmv6L+b56iL55qEIFBhcnRpY2xlU2VydmljZeOAglxuICog5LiOIGNvY29zLWVkaXRvciBQYXJ0aWNsZU1hbmFnZXIg5a+56b2Q77yM6KaG55uWIGZsb2F0LXdpbmRvdyAvIGluc3BlY3RvclxuICog6ZyA6KaB55qEIHBsYXkgLyBwYXVzZSAvIHN0b3AgLyByZXN0YXJ0IC8gc2V0UGxheVNwZWVkIC8gcXVlcnlQbGF5SW5mbyDog73lipvjgIJcbiAqL1xuZXhwb3J0IGNvbnN0IFBhcnRpY2xlUHJveHk6IElQdWJsaWNQYXJ0aWNsZVNlcnZpY2UgPSB7XG4gICAgcXVlcnlQbGF5SW5mbyh1dWlkOiBzdHJpbmcpOiBQcm9taXNlPElQYXJ0aWNsZVBsYXlJbmZvIHwgbnVsbD4ge1xuICAgICAgICByZXR1cm4gUnBjLmdldEluc3RhbmNlKCkucmVxdWVzdCgnUGFydGljbGUnLCAncXVlcnlQbGF5SW5mbycsIFt1dWlkXSk7XG4gICAgfSxcbiAgICBzZXRQbGF5U3BlZWQodXVpZDogc3RyaW5nLCBzcGVlZDogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHJldHVybiBScGMuZ2V0SW5zdGFuY2UoKS5yZXF1ZXN0KCdQYXJ0aWNsZScsICdzZXRQbGF5U3BlZWQnLCBbdXVpZCwgc3BlZWRdKTtcbiAgICB9LFxuICAgIHBsYXkoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHJldHVybiBScGMuZ2V0SW5zdGFuY2UoKS5yZXF1ZXN0KCdQYXJ0aWNsZScsICdwbGF5Jyk7XG4gICAgfSxcbiAgICBzdG9wKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICByZXR1cm4gUnBjLmdldEluc3RhbmNlKCkucmVxdWVzdCgnUGFydGljbGUnLCAnc3RvcCcpO1xuICAgIH0sXG4gICAgcGF1c2UoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHJldHVybiBScGMuZ2V0SW5zdGFuY2UoKS5yZXF1ZXN0KCdQYXJ0aWNsZScsICdwYXVzZScpO1xuICAgIH0sXG4gICAgcmVzdGFydCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgcmV0dXJuIFJwYy5nZXRJbnN0YW5jZSgpLnJlcXVlc3QoJ1BhcnRpY2xlJywgJ3Jlc3RhcnQnKTtcbiAgICB9LFxufTtcbiJdfQ==