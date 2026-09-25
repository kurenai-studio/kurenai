"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationService = void 0;
const core_1 = require("./core");
const decorator_1 = require("./core/decorator");
const operation_manager_1 = require("./operation/operation-manager");
let OperationService = class OperationService extends core_1.BaseService {
    _manager = new operation_manager_1.OperationManager();
    addListener(type, listener, priority) {
        this._manager.addListener(type, listener, priority);
    }
    removeListener(type, listener) {
        this._manager.removeListener(type, listener);
    }
    dispatch(type, ...args) {
        this._manager.emit(type, ...args);
    }
    emitMouseEvent(type, event, dpr = 1) {
        this._manager.emitMouseEvent(type, event, dpr);
    }
    requestPointerLock() {
        this.broadcast('pointer-lock', true);
        try {
            const canvas = cc.game?.canvas;
            if (canvas && canvas.requestPointerLock) {
                canvas.requestPointerLock();
            }
        }
        catch (e) {
            // canvas may not be ready
        }
    }
    exitPointerLock() {
        this.broadcast('pointer-lock', false);
        try {
            if (document.pointerLockElement) {
                document.exitPointerLock();
            }
        }
        catch (e) {
            // ignore
        }
    }
    changePointer(type) {
        this.broadcast('pointer-change', type);
    }
};
exports.OperationService = OperationService;
exports.OperationService = OperationService = __decorate([
    (0, decorator_1.register)('Operation')
], OperationService);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3BlcmF0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvc2NlbmUvc2NlbmUtcHJvY2Vzcy9zZXJ2aWNlL29wZXJhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSxpQ0FBcUM7QUFDckMsZ0RBQTRDO0FBQzVDLHFFQUFpRTtBQVMxRCxJQUFNLGdCQUFnQixHQUF0QixNQUFNLGdCQUFpQixTQUFRLGtCQUE2QjtJQUN2RCxRQUFRLEdBQUcsSUFBSSxvQ0FBZ0IsRUFBRSxDQUFDO0lBRTFDLFdBQVcsQ0FBQyxJQUFvQixFQUFFLFFBQWtCLEVBQUUsUUFBaUI7UUFDbkUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUN4RCxDQUFDO0lBRUQsY0FBYyxDQUFDLElBQW9CLEVBQUUsUUFBa0I7UUFDbkQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ2pELENBQUM7SUFFRCxRQUFRLENBQUMsSUFBb0IsRUFBRSxHQUFHLElBQVc7UUFDekMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUM7SUFDdEMsQ0FBQztJQUVELGNBQWMsQ0FBQyxJQUFZLEVBQUUsS0FBdUIsRUFBRSxNQUFjLENBQUM7UUFDakUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNuRCxDQUFDO0lBRUQsa0JBQWtCO1FBQ2QsSUFBSSxDQUFDLFNBQVMsQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDckMsSUFBSSxDQUFDO1lBQ0QsTUFBTSxNQUFNLEdBQUksRUFBVSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUM7WUFDeEMsSUFBSSxNQUFNLElBQUksTUFBTSxDQUFDLGtCQUFrQixFQUFFLENBQUM7Z0JBQ3RDLE1BQU0sQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1lBQ2hDLENBQUM7UUFDTCxDQUFDO1FBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUNULDBCQUEwQjtRQUM5QixDQUFDO0lBQ0wsQ0FBQztJQUVELGVBQWU7UUFDWCxJQUFJLENBQUMsU0FBUyxDQUFDLGNBQWMsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN0QyxJQUFJLENBQUM7WUFDRCxJQUFJLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO2dCQUM5QixRQUFRLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDL0IsQ0FBQztRQUNMLENBQUM7UUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ1QsU0FBUztRQUNiLENBQUM7SUFDTCxDQUFDO0lBRUQsYUFBYSxDQUFDLElBQVk7UUFDdEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUMzQyxDQUFDO0NBQ0osQ0FBQTtBQTdDWSw0Q0FBZ0I7MkJBQWhCLGdCQUFnQjtJQUQ1QixJQUFBLG9CQUFRLEVBQUMsV0FBVyxDQUFDO0dBQ1QsZ0JBQWdCLENBNkM1QiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEJhc2VTZXJ2aWNlIH0gZnJvbSAnLi9jb3JlJztcbmltcG9ydCB7IHJlZ2lzdGVyIH0gZnJvbSAnLi9jb3JlL2RlY29yYXRvcic7XG5pbXBvcnQgeyBPcGVyYXRpb25NYW5hZ2VyIH0gZnJvbSAnLi9vcGVyYXRpb24vb3BlcmF0aW9uLW1hbmFnZXInO1xuaW1wb3J0IHR5cGUgeyBJU2NlbmVNb3VzZUV2ZW50LCBJU2NlbmVLZXlib2FyZEV2ZW50LCBPcGVyYXRpb25FdmVudCB9IGZyb20gJy4vb3BlcmF0aW9uL3R5cGVzJztcblxuZXhwb3J0IGludGVyZmFjZSBJT3BlcmF0aW9uRXZlbnRzIHtcbiAgICAncG9pbnRlci1sb2NrJzogW2xvY2tlZDogYm9vbGVhbl07XG4gICAgJ3BvaW50ZXItY2hhbmdlJzogW3R5cGU6IHN0cmluZ107XG59XG5cbkByZWdpc3RlcignT3BlcmF0aW9uJylcbmV4cG9ydCBjbGFzcyBPcGVyYXRpb25TZXJ2aWNlIGV4dGVuZHMgQmFzZVNlcnZpY2U8SU9wZXJhdGlvbkV2ZW50cz4ge1xuICAgIHByaXZhdGUgX21hbmFnZXIgPSBuZXcgT3BlcmF0aW9uTWFuYWdlcigpO1xuXG4gICAgYWRkTGlzdGVuZXIodHlwZTogT3BlcmF0aW9uRXZlbnQsIGxpc3RlbmVyOiBGdW5jdGlvbiwgcHJpb3JpdHk/OiBudW1iZXIpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5fbWFuYWdlci5hZGRMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lciwgcHJpb3JpdHkpO1xuICAgIH1cblxuICAgIHJlbW92ZUxpc3RlbmVyKHR5cGU6IE9wZXJhdGlvbkV2ZW50LCBsaXN0ZW5lcjogRnVuY3Rpb24pOiB2b2lkIHtcbiAgICAgICAgdGhpcy5fbWFuYWdlci5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcik7XG4gICAgfVxuXG4gICAgZGlzcGF0Y2godHlwZTogT3BlcmF0aW9uRXZlbnQsIC4uLmFyZ3M6IGFueVtdKTogdm9pZCB7XG4gICAgICAgIHRoaXMuX21hbmFnZXIuZW1pdCh0eXBlLCAuLi5hcmdzKTtcbiAgICB9XG5cbiAgICBlbWl0TW91c2VFdmVudCh0eXBlOiBzdHJpbmcsIGV2ZW50OiBJU2NlbmVNb3VzZUV2ZW50LCBkcHI6IG51bWJlciA9IDEpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5fbWFuYWdlci5lbWl0TW91c2VFdmVudCh0eXBlLCBldmVudCwgZHByKTtcbiAgICB9XG5cbiAgICByZXF1ZXN0UG9pbnRlckxvY2soKTogdm9pZCB7XG4gICAgICAgIHRoaXMuYnJvYWRjYXN0KCdwb2ludGVyLWxvY2snLCB0cnVlKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNhbnZhcyA9IChjYyBhcyBhbnkpLmdhbWU/LmNhbnZhcztcbiAgICAgICAgICAgIGlmIChjYW52YXMgJiYgY2FudmFzLnJlcXVlc3RQb2ludGVyTG9jaykge1xuICAgICAgICAgICAgICAgIGNhbnZhcy5yZXF1ZXN0UG9pbnRlckxvY2soKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgLy8gY2FudmFzIG1heSBub3QgYmUgcmVhZHlcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGV4aXRQb2ludGVyTG9jaygpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5icm9hZGNhc3QoJ3BvaW50ZXItbG9jaycsIGZhbHNlKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmIChkb2N1bWVudC5wb2ludGVyTG9ja0VsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5leGl0UG9pbnRlckxvY2soKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgLy8gaWdub3JlXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjaGFuZ2VQb2ludGVyKHR5cGU6IHN0cmluZyk6IHZvaWQge1xuICAgICAgICB0aGlzLmJyb2FkY2FzdCgncG9pbnRlci1jaGFuZ2UnLCB0eXBlKTtcbiAgICB9XG59XG4iXX0=