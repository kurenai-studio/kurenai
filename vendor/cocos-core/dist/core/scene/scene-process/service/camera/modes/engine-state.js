"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NeedAnimState = void 0;
exports.enterCameraState = enterCameraState;
exports.exitCameraState = exitCameraState;
const decorator_1 = require("../../core/decorator");
const engine_1 = require("../../engine");
Object.defineProperty(exports, "NeedAnimState", { enumerable: true, get: function () { return engine_1.NeedAnimState; } });
function enterCameraState(state) {
    try {
        decorator_1.Service.Engine?.enterState?.(state);
    }
    catch (e) {
        // Engine may not be ready
    }
}
function exitCameraState(state) {
    try {
        decorator_1.Service.Engine?.exitState?.(state);
    }
    catch (e) {
        // Engine may not be ready
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5naW5lLXN0YXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvc2NlbmUvc2NlbmUtcHJvY2Vzcy9zZXJ2aWNlL2NhbWVyYS9tb2Rlcy9lbmdpbmUtc3RhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBR0EsNENBTUM7QUFFRCwwQ0FNQztBQWpCRCxvREFBK0M7QUFDL0MseUNBQTZDO0FBa0JwQyw4RkFsQkEsc0JBQWEsT0FrQkE7QUFoQnRCLFNBQWdCLGdCQUFnQixDQUFDLEtBQW9CO0lBQ2pELElBQUksQ0FBQztRQUNBLG1CQUFPLENBQUMsTUFBYyxFQUFFLFVBQVUsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2pELENBQUM7SUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1FBQ1QsMEJBQTBCO0lBQzlCLENBQUM7QUFDTCxDQUFDO0FBRUQsU0FBZ0IsZUFBZSxDQUFDLEtBQW9CO0lBQ2hELElBQUksQ0FBQztRQUNBLG1CQUFPLENBQUMsTUFBYyxFQUFFLFNBQVMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2hELENBQUM7SUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1FBQ1QsMEJBQTBCO0lBQzlCLENBQUM7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgU2VydmljZSB9IGZyb20gJy4uLy4uL2NvcmUvZGVjb3JhdG9yJztcbmltcG9ydCB7IE5lZWRBbmltU3RhdGUgfSBmcm9tICcuLi8uLi9lbmdpbmUnO1xuXG5leHBvcnQgZnVuY3Rpb24gZW50ZXJDYW1lcmFTdGF0ZShzdGF0ZTogTmVlZEFuaW1TdGF0ZSkge1xuICAgIHRyeSB7XG4gICAgICAgIChTZXJ2aWNlLkVuZ2luZSBhcyBhbnkpPy5lbnRlclN0YXRlPy4oc3RhdGUpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgLy8gRW5naW5lIG1heSBub3QgYmUgcmVhZHlcbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBleGl0Q2FtZXJhU3RhdGUoc3RhdGU6IE5lZWRBbmltU3RhdGUpIHtcbiAgICB0cnkge1xuICAgICAgICAoU2VydmljZS5FbmdpbmUgYXMgYW55KT8uZXhpdFN0YXRlPy4oc3RhdGUpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgLy8gRW5naW5lIG1heSBub3QgYmUgcmVhZHlcbiAgICB9XG59XG5cbmV4cG9ydCB7IE5lZWRBbmltU3RhdGUgfTtcbiJdfQ==