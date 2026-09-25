"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParticleApi = void 0;
/**
 * Public AI/MCP facade for particle-system operations.
 *
 * 对照 https://docs.cocos.com/creator/4.0/manual/en/particle-system/
 * 与 cocos-editor ParticleManager 暴露给 float-window / inspector 的能力：
 *   - play / pause / stop / restart
 *   - setPlaySpeed
 *   - queryPlayInfo
 */
const schema_base_1 = require("../base/schema-base");
const decorator_js_1 = require("../decorator/decorator.js");
const scene_1 = require("../../core/scene");
const particle_schema_1 = require("./particle-schema");
class ParticleApi {
    /**
     * Query runtime info of a particle system.
     */
    async queryPlayInfo(options) {
        try {
            const uuid = await this._resolveUuid(options);
            if (!uuid) {
                return { code: schema_base_1.COMMON_STATUS.NOT_FOUND, reason: `Particle component not found for: ${options.uuid || options.nodePath}` };
            }
            const info = await scene_1.Scene.Particle.queryPlayInfo(uuid);
            if (!info) {
                return { code: schema_base_1.COMMON_STATUS.NOT_FOUND, reason: `Particle component not found: ${options.uuid || options.nodePath}` };
            }
            return { code: schema_base_1.COMMON_STATUS.SUCCESS, data: { ...info, found: true } };
        }
        catch (e) {
            return { code: (0, schema_base_1.getCommonErrorStatus)(e), reason: e instanceof Error ? e.message : String(e) };
        }
    }
    /**
     * Set the simulation speed of a particle system.
     */
    async setPlaySpeed(options) {
        try {
            const uuid = await this._resolveUuid(options);
            if (!uuid) {
                return { code: schema_base_1.COMMON_STATUS.NOT_FOUND, reason: `Particle component not found for: ${options.uuid || options.nodePath}` };
            }
            await scene_1.Scene.Particle.setPlaySpeed(uuid, options.speed);
            const info = await scene_1.Scene.Particle.queryPlayInfo(uuid);
            if (!info) {
                return { code: schema_base_1.COMMON_STATUS.NOT_FOUND, reason: `Particle component not found: ${options.uuid || options.nodePath}` };
            }
            return { code: schema_base_1.COMMON_STATUS.SUCCESS, data: { ...info, found: true } };
        }
        catch (e) {
            return { code: (0, schema_base_1.getCommonErrorStatus)(e), reason: e instanceof Error ? e.message : String(e) };
        }
    }
    /**
     * Play the selected particle systems.
     */
    async play(options) {
        return this._runAction('play', options, async () => { await scene_1.Scene.Particle.play(); });
    }
    /**
     * Pause the selected particle systems.
     */
    async pause(options) {
        return this._runAction('pause', options, async () => { await scene_1.Scene.Particle.pause(); });
    }
    /**
     * Stop the selected particle systems.
     */
    async stop(options) {
        return this._runAction('stop', options, async () => { await scene_1.Scene.Particle.stop(); });
    }
    /**
     * Restart the selected particle systems.
     */
    async restart(options) {
        return this._runAction('restart', options, async () => { await scene_1.Scene.Particle.restart(); });
    }
    async _runAction(action, options, fn) {
        try {
            // 行为作用于当前选中的粒子组件集合。若调用方指定了具体组件，
            // 先选中它的节点，再执行 play/pause/stop/restart，
            // 与 cocos-editor float-window 按钮行为一致。
            if (options.nodePath || options.uuid) {
                const nodePath = await this._resolveNodePath(options);
                if (!nodePath) {
                    return { code: schema_base_1.COMMON_STATUS.NOT_FOUND, reason: `Particle component not found for: ${options.uuid || options.nodePath}` };
                }
                // Selection 服务以节点 path 进行选择。直接通过 RPC 调用，
                // 因为 Scene 代理未聚合 Selection 模块。
                try {
                    const { Rpc } = await Promise.resolve().then(() => __importStar(require('../../core/scene/main-process/rpc')));
                    await Rpc.getInstance().request('Selection', 'select', [nodePath]);
                }
                catch (selectErr) {
                    // 选中失败不阻断播放行为，仅记录
                    console.warn('[ParticleApi] select before action failed:', selectErr);
                }
            }
            await fn();
            return { code: schema_base_1.COMMON_STATUS.SUCCESS, data: { action, applied: true } };
        }
        catch (e) {
            return { code: (0, schema_base_1.getCommonErrorStatus)(e), reason: e instanceof Error ? e.message : String(e) };
        }
    }
    /**
     * 解析粒子组件所在节点的路径。优先使用调用方传入的 nodePath；
     * 若仅提供 uuid，则通过组件 uuid 反查节点，再由节点 uuid 取节点路径。
     */
    async _resolveNodePath(options) {
        if (options.nodePath) {
            return options.nodePath;
        }
        if (options.uuid) {
            // 组件 uuid 与节点 uuid 相同（cc 引擎约定：组件继承自 CCObject，其 uuid 即节点 uuid）。
            // Selection 服务以节点 path 进行选择，故需要把 uuid 转为 path。
            // NodeProxy 未暴露 getPathByUuid，直接通过 RPC 调用。
            try {
                const { Rpc } = await Promise.resolve().then(() => __importStar(require('../../core/scene/main-process/rpc')));
                const path = await Rpc.getInstance().request('Node', 'getPathByUuid', [options.uuid]);
                if (typeof path === 'string' && path.length > 0) {
                    return path;
                }
            }
            catch (e) {
                return null;
            }
        }
        return null;
    }
    /**
     * 将 nodePath/uuid 标识解析为粒子组件 uuid。优先使用 uuid。
     */
    async _resolveUuid(options) {
        if (options.uuid) {
            return options.uuid;
        }
        if (options.nodePath) {
            // 组件路径 = 节点路径 + 组件类型，与 scene-query-component 约定一致
            const componentPath = `${options.nodePath}/cc.ParticleSystem`;
            const componentInfo = await scene_1.Scene.Component.query({ path: componentPath });
            if (componentInfo && typeof componentInfo === 'object') {
                // IComponentInfo.value.uuid.value 或直接 uuid 字段，兼容两种 dump 结构
                const anyInfo = componentInfo;
                return anyInfo?.value?.uuid?.value ?? anyInfo?.uuid ?? null;
            }
        }
        return null;
    }
}
exports.ParticleApi = ParticleApi;
__decorate([
    (0, decorator_js_1.tool)('particle-query-play-info'),
    (0, decorator_js_1.title)('Query particle system runtime info'),
    (0, decorator_js_1.description)('Get the current simulation speed, elapsed time, alive particle count and playing state of a cc.ParticleSystem component identified by nodePath or uuid.'),
    (0, decorator_js_1.result)(particle_schema_1.SchemaParticlePlayInfo),
    __param(0, (0, decorator_js_1.param)(particle_schema_1.SchemaParticleIdentifier)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ParticleApi.prototype, "queryPlayInfo", null);
__decorate([
    (0, decorator_js_1.tool)('particle-set-play-speed'),
    (0, decorator_js_1.title)('Set particle system simulation speed'),
    (0, decorator_js_1.description)('Set the simulation speed multiplier (1 = normal speed) of a cc.ParticleSystem component identified by nodePath or uuid.'),
    (0, decorator_js_1.result)(particle_schema_1.SchemaParticlePlayInfo),
    __param(0, (0, decorator_js_1.param)(particle_schema_1.SchemaParticleSpeed)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ParticleApi.prototype, "setPlaySpeed", null);
__decorate([
    (0, decorator_js_1.tool)('particle-play'),
    (0, decorator_js_1.title)('Play particle systems'),
    (0, decorator_js_1.description)('Play the currently selected cc.ParticleSystem components. When a nodePath or uuid is provided, ensure that component is selected first.'),
    (0, decorator_js_1.result)(particle_schema_1.SchemaParticleActionResult),
    __param(0, (0, decorator_js_1.param)(particle_schema_1.SchemaParticleAction)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ParticleApi.prototype, "play", null);
__decorate([
    (0, decorator_js_1.tool)('particle-pause'),
    (0, decorator_js_1.title)('Pause particle systems'),
    (0, decorator_js_1.description)('Pause the currently selected cc.ParticleSystem components. When a nodePath or uuid is provided, ensure that component is selected first.'),
    (0, decorator_js_1.result)(particle_schema_1.SchemaParticleActionResult),
    __param(0, (0, decorator_js_1.param)(particle_schema_1.SchemaParticleAction)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ParticleApi.prototype, "pause", null);
__decorate([
    (0, decorator_js_1.tool)('particle-stop'),
    (0, decorator_js_1.title)('Stop particle systems'),
    (0, decorator_js_1.description)('Stop the currently selected cc.ParticleSystem components. When a nodePath or uuid is provided, ensure that component is selected first.'),
    (0, decorator_js_1.result)(particle_schema_1.SchemaParticleActionResult),
    __param(0, (0, decorator_js_1.param)(particle_schema_1.SchemaParticleAction)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ParticleApi.prototype, "stop", null);
__decorate([
    (0, decorator_js_1.tool)('particle-restart'),
    (0, decorator_js_1.title)('Restart particle systems'),
    (0, decorator_js_1.description)('Restart the currently selected cc.ParticleSystem components (stop then play). When a nodePath or uuid is provided, ensure that component is selected first.'),
    (0, decorator_js_1.result)(particle_schema_1.SchemaParticleActionResult),
    __param(0, (0, decorator_js_1.param)(particle_schema_1.SchemaParticleAction)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ParticleApi.prototype, "restart", null);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFydGljbGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvYXBpL3NjZW5lL3BhcnRpY2xlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7Ozs7OztHQVFHO0FBQ0gscURBQTRGO0FBQzVGLDREQUFvRjtBQUNwRiw0Q0FBeUM7QUFDekMsdURBVzJCO0FBRTNCLE1BQWEsV0FBVztJQUNwQjs7T0FFRztJQUtHLEFBQU4sS0FBSyxDQUFDLGFBQWEsQ0FBa0MsT0FBNEI7UUFDN0UsSUFBSSxDQUFDO1lBQ0QsTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzlDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDUixPQUFPLEVBQUUsSUFBSSxFQUFFLDJCQUFhLENBQUMsU0FBUyxFQUFFLE1BQU0sRUFBRSxxQ0FBcUMsT0FBTyxDQUFDLElBQUksSUFBSSxPQUFPLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQztZQUM5SCxDQUFDO1lBQ0QsTUFBTSxJQUFJLEdBQUcsTUFBTSxhQUFLLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN0RCxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ1IsT0FBTyxFQUFFLElBQUksRUFBRSwyQkFBYSxDQUFDLFNBQVMsRUFBRSxNQUFNLEVBQUUsaUNBQWlDLE9BQU8sQ0FBQyxJQUFJLElBQUksT0FBTyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUM7WUFDMUgsQ0FBQztZQUNELE9BQU8sRUFBRSxJQUFJLEVBQUUsMkJBQWEsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLEVBQUUsR0FBRyxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxFQUFFLENBQUM7UUFDM0UsQ0FBQztRQUFDLE9BQU8sQ0FBQyxFQUFFLENB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QztJQUM5QixJQUFBLDBCQUFXLEVBQUMseUlBQXlJLENBQUM7SUFDdEosSUFBQSxxQkFBTSxFQUFDLDRDQUEwQixDQUFDO0lBQ3ZCLFdBQUEsSUFBQSxvQkFBSyxFQUFDLHNDQUFvQixDQUFDLENBQUE7Ozs7dUNBRXRDO0FBU0s7SUFKTCxJQUFBLG1CQUFJLEVBQUMsZ0JBQWdCLENBQUM7SUFDdEIsSUFBQSxvQkFBSyxFQUFDLHdCQUF3QixDQUFDO0lBQy9CLElBQUEsMEJBQVcsRUFBQywwSUFBMEksQ0FBQztJQUN2SixJQUFBLHFCQUFNLEVBQUMsNENBQTBCLENBQUM7SUFDdEIsV0FBQSxJQUFBLG9CQUFLLEVBQUMsc0NBQW9CLENBQUMsQ0FBQTs7Ozt3Q0FFdkM7QUFTSztJQUpMLElBQUEsbUJBQUksRUFBQyxlQUFlLENBQUM7SUFDckIsSUFBQSxvQkFBSyxFQUFDLHVCQUF1QixDQUFDO0lBQzlCLElBQUEsMEJBQVcsRUFBQyx5SUFBeUksQ0FBQztJQUN0SixJQUFBLHFCQUFNLEVBQUMsNENBQTBCLENBQUM7SUFDdkIsV0FBQSxJQUFBLG9CQUFLLEVBQUMsc0NBQW9CLENBQUMsQ0FBQTs7Ozt1Q0FFdEM7QUFTSztJQUpMLElBQUEsbUJBQUksRUFBQyxrQkFBa0IsQ0FBQztJQUN4QixJQUFBLG9CQUFLLEVBQUMsMEJBQTBCLENBQUM7SUFDakMsSUFBQSwwQkFBVyxFQUFDLDZKQUE2SixDQUFDO0lBQzFLLElBQUEscUJBQU0sRUFBQyw0Q0FBMEIsQ0FBQztJQUNwQixXQUFBLElBQUEsb0JBQUssRUFBQyxzQ0FBb0IsQ0FBQyxDQUFBOzs7OzBDQUV6QyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogUHVibGljIEFJL01DUCBmYWNhZGUgZm9yIHBhcnRpY2xlLXN5c3RlbSBvcGVyYXRpb25zLlxuICpcbiAqIOWvueeFpyBodHRwczovL2RvY3MuY29jb3MuY29tL2NyZWF0b3IvNC4wL21hbnVhbC9lbi9wYXJ0aWNsZS1zeXN0ZW0vXG4gKiDkuI4gY29jb3MtZWRpdG9yIFBhcnRpY2xlTWFuYWdlciDmmrTpnLLnu5kgZmxvYXQtd2luZG93IC8gaW5zcGVjdG9yIOeahOiDveWKm++8mlxuICogICAtIHBsYXkgLyBwYXVzZSAvIHN0b3AgLyByZXN0YXJ0XG4gKiAgIC0gc2V0UGxheVNwZWVkXG4gKiAgIC0gcXVlcnlQbGF5SW5mb1xuICovXG5pbXBvcnQgeyBDT01NT05fU1RBVFVTLCBDb21tb25SZXN1bHRUeXBlLCBnZXRDb21tb25FcnJvclN0YXR1cyB9IGZyb20gJy4uL2Jhc2Uvc2NoZW1hLWJhc2UnO1xuaW1wb3J0IHsgZGVzY3JpcHRpb24sIHBhcmFtLCByZXN1bHQsIHRpdGxlLCB0b29sIH0gZnJvbSAnLi4vZGVjb3JhdG9yL2RlY29yYXRvci5qcyc7XG5pbXBvcnQgeyBTY2VuZSB9IGZyb20gJy4uLy4uL2NvcmUvc2NlbmUnO1xuaW1wb3J0IHtcbiAgICBTY2hlbWFQYXJ0aWNsZUlkZW50aWZpZXIsXG4gICAgU2NoZW1hUGFydGljbGVTcGVlZCxcbiAgICBTY2hlbWFQYXJ0aWNsZVBsYXlJbmZvLFxuICAgIFNjaGVtYVBhcnRpY2xlQWN0aW9uLFxuICAgIFNjaGVtYVBhcnRpY2xlQWN0aW9uUmVzdWx0LFxuICAgIFRQYXJ0aWNsZUlkZW50aWZpZXIsXG4gICAgVFBhcnRpY2xlU3BlZWQsXG4gICAgVFBhcnRpY2xlUGxheUluZm8sXG4gICAgVFBhcnRpY2xlQWN0aW9uLFxuICAgIFRQYXJ0aWNsZUFjdGlvblJlc3VsdCxcbn0gZnJvbSAnLi9wYXJ0aWNsZS1zY2hlbWEnO1xuXG5leHBvcnQgY2xhc3MgUGFydGljbGVBcGkge1xuICAgIC8qKlxuICAgICAqIFF1ZXJ5IHJ1bnRpbWUgaW5mbyBvZiBhIHBhcnRpY2xlIHN5c3RlbS5cbiAgICAgKi9cbiAgICBAdG9vbCgncGFydGljbGUtcXVlcnktcGxheS1pbmZvJylcbiAgICBAdGl0bGUoJ1F1ZXJ5IHBhcnRpY2xlIHN5c3RlbSBydW50aW1lIGluZm8nKVxuICAgIEBkZXNjcmlwdGlvbignR2V0IHRoZSBjdXJyZW50IHNpbXVsYXRpb24gc3BlZWQsIGVsYXBzZWQgdGltZSwgYWxpdmUgcGFydGljbGUgY291bnQgYW5kIHBsYXlpbmcgc3RhdGUgb2YgYSBjYy5QYXJ0aWNsZVN5c3RlbSBjb21wb25lbnQgaWRlbnRpZmllZCBieSBub2RlUGF0aCBvciB1dWlkLicpXG4gICAgQHJlc3VsdChTY2hlbWFQYXJ0aWNsZVBsYXlJbmZvKVxuICAgIGFzeW5jIHF1ZXJ5UGxheUluZm8oQHBhcmFtKFNjaGVtYVBhcnRpY2xlSWRlbnRpZmllcikgb3B0aW9uczogVFBhcnRpY2xlSWRlbnRpZmllcik6IFByb21pc2U8Q29tbW9uUmVzdWx0VHlwZTxUUGFydGljbGVQbGF5SW5mbz4+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHV1aWQgPSBhd2FpdCB0aGlzLl9yZXNvbHZlVXVpZChvcHRpb25zKTtcbiAgICAgICAgICAgIGlmICghdXVpZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IGNvZGU6IENPTU1PTl9TVEFUVVMuTk9UX0ZPVU5ELCByZWFzb246IGBQYXJ0aWNsZSBjb21wb25lbnQgbm90IGZvdW5kIGZvcjogJHtvcHRpb25zLnV1aWQgfHwgb3B0aW9ucy5ub2RlUGF0aH1gIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBpbmZvID0gYXdhaXQgU2NlbmUuUGFydGljbGUucXVlcnlQbGF5SW5mbyh1dWlkKTtcbiAgICAgICAgICAgIGlmICghaW5mbykge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IGNvZGU6IENPTU1PTl9TVEFUVVMuTk9UX0ZPVU5ELCByZWFzb246IGBQYXJ0aWNsZSBjb21wb25lbnQgbm90IGZvdW5kOiAke29wdGlvbnMudXVpZCB8fCBvcHRpb25zLm5vZGVQYXRofWAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7IGNvZGU6IENPTU1PTl9TVEFUVVMuU1VDQ0VTUywgZGF0YTogeyAuLi5pbmZvLCBmb3VuZDogdHJ1ZSB9IH07XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHJldHVybiB7IGNvZGU6IGdldENvbW1vbkVycm9yU3RhdHVzKGUpLCByZWFzb246IGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKSB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0IHRoZSBzaW11bGF0aW9uIHNwZWVkIG9mIGEgcGFydGljbGUgc3lzdGVtLlxuICAgICAqL1xuICAgIEB0b29sKCdwYXJ0aWNsZS1zZXQtcGxheS1zcGVlZCcpXG4gICAgQHRpdGxlKCdTZXQgcGFydGljbGUgc3lzdGVtIHNpbXVsYXRpb24gc3BlZWQnKVxuICAgIEBkZXNjcmlwdGlvbignU2V0IHRoZSBzaW11bGF0aW9uIHNwZWVkIG11bHRpcGxpZXIgKDEgPSBub3JtYWwgc3BlZWQpIG9mIGEgY2MuUGFydGljbGVTeXN0ZW0gY29tcG9uZW50IGlkZW50aWZpZWQgYnkgbm9kZVBhdGggb3IgdXVpZC4nKVxuICAgIEByZXN1bHQoU2NoZW1hUGFydGljbGVQbGF5SW5mbylcbiAgICBhc3luYyBzZXRQbGF5U3BlZWQoQHBhcmFtKFNjaGVtYVBhcnRpY2xlU3BlZWQpIG9wdGlvbnM6IFRQYXJ0aWNsZVNwZWVkKTogUHJvbWlzZTxDb21tb25SZXN1bHRUeXBlPFRQYXJ0aWNsZVBsYXlJbmZvPj4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgdXVpZCA9IGF3YWl0IHRoaXMuX3Jlc29sdmVVdWlkKG9wdGlvbnMpO1xuICAgICAgICAgICAgaWYgKCF1dWlkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgY29kZTogQ09NTU9OX1NUQVRVUy5OT1RfRk9VTkQsIHJlYXNvbjogYFBhcnRpY2xlIGNvbXBvbmVudCBub3QgZm91bmQgZm9yOiAke29wdGlvbnMudXVpZCB8fCBvcHRpb25zLm5vZGVQYXRofWAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGF3YWl0IFNjZW5lLlBhcnRpY2xlLnNldFBsYXlTcGVlZCh1dWlkLCBvcHRpb25zLnNwZWVkKTtcbiAgICAgICAgICAgIGNvbnN0IGluZm8gPSBhd2FpdCBTY2VuZS5QYXJ0aWNsZS5xdWVyeVBsYXlJbmZvKHV1aWQpO1xuICAgICAgICAgICAgaWYgKCFpbmZvKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgY29kZTogQ09NTU9OX1NUQVRVUy5OT1RfRk9VTkQsIHJlYXNvbjogYFBhcnRpY2xlIGNvbXBvbmVudCBub3QgZm91bmQ6ICR7b3B0aW9ucy51dWlkIHx8IG9wdGlvbnMubm9kZVBhdGh9YCB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHsgY29kZTogQ09NTU9OX1NUQVRVUy5TVUNDRVNTLCBkYXRhOiB7IC4uLmluZm8sIGZvdW5kOiB0cnVlIH0gfTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0dXJuIHsgY29kZTogZ2V0Q29tbW9uRXJyb3JTdGF0dXMoZSksIHJlYXNvbjogZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogU3RyaW5nKGUpIH07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQbGF5IHRoZSBzZWxlY3RlZCBwYXJ0aWNsZSBzeXN0ZW1zLlxuICAgICAqL1xuICAgIEB0b29sKCdwYXJ0aWNsZS1wbGF5JylcbiAgICBAdGl0bGUoJ1BsYXkgcGFydGljbGUgc3lzdGVtcycpXG4gICAgQGRlc2NyaXB0aW9uKCdQbGF5IHRoZSBjdXJyZW50bHkgc2VsZWN0ZWQgY2MuUGFydGljbGVTeXN0ZW0gY29tcG9uZW50cy4gV2hlbiBhIG5vZGVQYXRoIG9yIHV1aWQgaXMgcHJvdmlkZWQsIGVuc3VyZSB0aGF0IGNvbXBvbmVudCBpcyBzZWxlY3RlZCBmaXJzdC4nKVxuICAgIEByZXN1bHQoU2NoZW1hUGFydGljbGVBY3Rpb25SZXN1bHQpXG4gICAgYXN5bmMgcGxheShAcGFyYW0oU2NoZW1hUGFydGljbGVBY3Rpb24pIG9wdGlvbnM6IFRQYXJ0aWNsZUFjdGlvbik6IFByb21pc2U8Q29tbW9uUmVzdWx0VHlwZTxUUGFydGljbGVBY3Rpb25SZXN1bHQ+PiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9ydW5BY3Rpb24oJ3BsYXknLCBvcHRpb25zLCBhc3luYyAoKSA9PiB7IGF3YWl0IFNjZW5lLlBhcnRpY2xlLnBsYXkoKTsgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUGF1c2UgdGhlIHNlbGVjdGVkIHBhcnRpY2xlIHN5c3RlbXMuXG4gICAgICovXG4gICAgQHRvb2woJ3BhcnRpY2xlLXBhdXNlJylcbiAgICBAdGl0bGUoJ1BhdXNlIHBhcnRpY2xlIHN5c3RlbXMnKVxuICAgIEBkZXNjcmlwdGlvbignUGF1c2UgdGhlIGN1cnJlbnRseSBzZWxlY3RlZCBjYy5QYXJ0aWNsZVN5c3RlbSBjb21wb25lbnRzLiBXaGVuIGEgbm9kZVBhdGggb3IgdXVpZCBpcyBwcm92aWRlZCwgZW5zdXJlIHRoYXQgY29tcG9uZW50IGlzIHNlbGVjdGVkIGZpcnN0LicpXG4gICAgQHJlc3VsdChTY2hlbWFQYXJ0aWNsZUFjdGlvblJlc3VsdClcbiAgICBhc3luYyBwYXVzZShAcGFyYW0oU2NoZW1hUGFydGljbGVBY3Rpb24pIG9wdGlvbnM6IFRQYXJ0aWNsZUFjdGlvbik6IFByb21pc2U8Q29tbW9uUmVzdWx0VHlwZTxUUGFydGljbGVBY3Rpb25SZXN1bHQ+PiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9ydW5BY3Rpb24oJ3BhdXNlJywgb3B0aW9ucywgYXN5bmMgKCkgPT4geyBhd2FpdCBTY2VuZS5QYXJ0aWNsZS5wYXVzZSgpOyB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTdG9wIHRoZSBzZWxlY3RlZCBwYXJ0aWNsZSBzeXN0ZW1zLlxuICAgICAqL1xuICAgIEB0b29sKCdwYXJ0aWNsZS1zdG9wJylcbiAgICBAdGl0bGUoJ1N0b3AgcGFydGljbGUgc3lzdGVtcycpXG4gICAgQGRlc2NyaXB0aW9uKCdTdG9wIHRoZSBjdXJyZW50bHkgc2VsZWN0ZWQgY2MuUGFydGljbGVTeXN0ZW0gY29tcG9uZW50cy4gV2hlbiBhIG5vZGVQYXRoIG9yIHV1aWQgaXMgcHJvdmlkZWQsIGVuc3VyZSB0aGF0IGNvbXBvbmVudCBpcyBzZWxlY3RlZCBmaXJzdC4nKVxuICAgIEByZXN1bHQoU2NoZW1hUGFydGljbGVBY3Rpb25SZXN1bHQpXG4gICAgYXN5bmMgc3RvcChAcGFyYW0oU2NoZW1hUGFydGljbGVBY3Rpb24pIG9wdGlvbnM6IFRQYXJ0aWNsZUFjdGlvbik6IFByb21pc2U8Q29tbW9uUmVzdWx0VHlwZTxUUGFydGljbGVBY3Rpb25SZXN1bHQ+PiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9ydW5BY3Rpb24oJ3N0b3AnLCBvcHRpb25zLCBhc3luYyAoKSA9PiB7IGF3YWl0IFNjZW5lLlBhcnRpY2xlLnN0b3AoKTsgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVzdGFydCB0aGUgc2VsZWN0ZWQgcGFydGljbGUgc3lzdGVtcy5cbiAgICAgKi9cbiAgICBAdG9vbCgncGFydGljbGUtcmVzdGFydCcpXG4gICAgQHRpdGxlKCdSZXN0YXJ0IHBhcnRpY2xlIHN5c3RlbXMnKVxuICAgIEBkZXNjcmlwdGlvbignUmVzdGFydCB0aGUgY3VycmVudGx5IHNlbGVjdGVkIGNjLlBhcnRpY2xlU3lzdGVtIGNvbXBvbmVudHMgKHN0b3AgdGhlbiBwbGF5KS4gV2hlbiBhIG5vZGVQYXRoIG9yIHV1aWQgaXMgcHJvdmlkZWQsIGVuc3VyZSB0aGF0IGNvbXBvbmVudCBpcyBzZWxlY3RlZCBmaXJzdC4nKVxuICAgIEByZXN1bHQoU2NoZW1hUGFydGljbGVBY3Rpb25SZXN1bHQpXG4gICAgYXN5bmMgcmVzdGFydChAcGFyYW0oU2NoZW1hUGFydGljbGVBY3Rpb24pIG9wdGlvbnM6IFRQYXJ0aWNsZUFjdGlvbik6IFByb21pc2U8Q29tbW9uUmVzdWx0VHlwZTxUUGFydGljbGVBY3Rpb25SZXN1bHQ+PiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9ydW5BY3Rpb24oJ3Jlc3RhcnQnLCBvcHRpb25zLCBhc3luYyAoKSA9PiB7IGF3YWl0IFNjZW5lLlBhcnRpY2xlLnJlc3RhcnQoKTsgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBfcnVuQWN0aW9uKFxuICAgICAgICBhY3Rpb246IHN0cmluZyxcbiAgICAgICAgb3B0aW9uczogVFBhcnRpY2xlQWN0aW9uLFxuICAgICAgICBmbjogKCkgPT4gUHJvbWlzZTx2b2lkPixcbiAgICApOiBQcm9taXNlPENvbW1vblJlc3VsdFR5cGU8VFBhcnRpY2xlQWN0aW9uUmVzdWx0Pj4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8g6KGM5Li65L2c55So5LqO5b2T5YmN6YCJ5Lit55qE57KS5a2Q57uE5Lu26ZuG5ZCI44CC6Iul6LCD55So5pa55oyH5a6a5LqG5YW35L2T57uE5Lu277yMXG4gICAgICAgICAgICAvLyDlhYjpgInkuK3lroPnmoToioLngrnvvIzlho3miafooYwgcGxheS9wYXVzZS9zdG9wL3Jlc3RhcnTvvIxcbiAgICAgICAgICAgIC8vIOS4jiBjb2Nvcy1lZGl0b3IgZmxvYXQtd2luZG93IOaMiemSruihjOS4uuS4gOiHtOOAglxuICAgICAgICAgICAgaWYgKG9wdGlvbnMubm9kZVBhdGggfHwgb3B0aW9ucy51dWlkKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgbm9kZVBhdGggPSBhd2FpdCB0aGlzLl9yZXNvbHZlTm9kZVBhdGgob3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgaWYgKCFub2RlUGF0aCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBjb2RlOiBDT01NT05fU1RBVFVTLk5PVF9GT1VORCwgcmVhc29uOiBgUGFydGljbGUgY29tcG9uZW50IG5vdCBmb3VuZCBmb3I6ICR7b3B0aW9ucy51dWlkIHx8IG9wdGlvbnMubm9kZVBhdGh9YCB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBTZWxlY3Rpb24g5pyN5Yqh5Lul6IqC54K5IHBhdGgg6L+b6KGM6YCJ5oup44CC55u05o6l6YCa6L+HIFJQQyDosIPnlKjvvIxcbiAgICAgICAgICAgICAgICAvLyDlm6DkuLogU2NlbmUg5Luj55CG5pyq6IGa5ZCIIFNlbGVjdGlvbiDmqKHlnZfjgIJcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB7IFJwYyB9ID0gYXdhaXQgaW1wb3J0KCcuLi8uLi9jb3JlL3NjZW5lL21haW4tcHJvY2Vzcy9ycGMnKTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgUnBjLmdldEluc3RhbmNlKCkucmVxdWVzdCgnU2VsZWN0aW9uJywgJ3NlbGVjdCcsIFtub2RlUGF0aF0pO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKHNlbGVjdEVycikge1xuICAgICAgICAgICAgICAgICAgICAvLyDpgInkuK3lpLHotKXkuI3pmLvmlq3mkq3mlL7ooYzkuLrvvIzku4XorrDlvZVcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdbUGFydGljbGVBcGldIHNlbGVjdCBiZWZvcmUgYWN0aW9uIGZhaWxlZDonLCBzZWxlY3RFcnIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGF3YWl0IGZuKCk7XG4gICAgICAgICAgICByZXR1cm4geyBjb2RlOiBDT01NT05fU1RBVFVTLlNVQ0NFU1MsIGRhdGE6IHsgYWN0aW9uLCBhcHBsaWVkOiB0cnVlIH0gfTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0dXJuIHsgY29kZTogZ2V0Q29tbW9uRXJyb3JTdGF0dXMoZSksIHJlYXNvbjogZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogU3RyaW5nKGUpIH07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDop6PmnpDnspLlrZDnu4Tku7bmiYDlnKjoioLngrnnmoTot6/lvoTjgILkvJjlhYjkvb/nlKjosIPnlKjmlrnkvKDlhaXnmoQgbm9kZVBhdGjvvJtcbiAgICAgKiDoi6Xku4Xmj5DkvpsgdXVpZO+8jOWImemAmui/h+e7hOS7tiB1dWlkIOWPjeafpeiKgueCue+8jOWGjeeUseiKgueCuSB1dWlkIOWPluiKgueCuei3r+W+hOOAglxuICAgICAqL1xuICAgIHByaXZhdGUgYXN5bmMgX3Jlc29sdmVOb2RlUGF0aChvcHRpb25zOiB7IHV1aWQ/OiBzdHJpbmc7IG5vZGVQYXRoPzogc3RyaW5nIH0pOiBQcm9taXNlPHN0cmluZyB8IG51bGw+IHtcbiAgICAgICAgaWYgKG9wdGlvbnMubm9kZVBhdGgpIHtcbiAgICAgICAgICAgIHJldHVybiBvcHRpb25zLm5vZGVQYXRoO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvcHRpb25zLnV1aWQpIHtcbiAgICAgICAgICAgIC8vIOe7hOS7tiB1dWlkIOS4juiKgueCuSB1dWlkIOebuOWQjO+8iGNjIOW8leaTjue6puWumu+8mue7hOS7tue7p+aJv+iHqiBDQ09iamVjdO+8jOWFtiB1dWlkIOWNs+iKgueCuSB1dWlk77yJ44CCXG4gICAgICAgICAgICAvLyBTZWxlY3Rpb24g5pyN5Yqh5Lul6IqC54K5IHBhdGgg6L+b6KGM6YCJ5oup77yM5pWF6ZyA6KaB5oqKIHV1aWQg6L2s5Li6IHBhdGjjgIJcbiAgICAgICAgICAgIC8vIE5vZGVQcm94eSDmnKrmmrTpnLIgZ2V0UGF0aEJ5VXVpZO+8jOebtOaOpemAmui/hyBSUEMg6LCD55So44CCXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgUnBjIH0gPSBhd2FpdCBpbXBvcnQoJy4uLy4uL2NvcmUvc2NlbmUvbWFpbi1wcm9jZXNzL3JwYycpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhdGggPSBhd2FpdCBScGMuZ2V0SW5zdGFuY2UoKS5yZXF1ZXN0KCdOb2RlJywgJ2dldFBhdGhCeVV1aWQnLCBbb3B0aW9ucy51dWlkXSk7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBwYXRoID09PSAnc3RyaW5nJyAmJiBwYXRoLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBhdGg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWwhiBub2RlUGF0aC91dWlkIOagh+ivhuino+aekOS4uueykuWtkOe7hOS7tiB1dWlk44CC5LyY5YWI5L2/55SoIHV1aWTjgIJcbiAgICAgKi9cbiAgICBwcml2YXRlIGFzeW5jIF9yZXNvbHZlVXVpZChvcHRpb25zOiB7IHV1aWQ/OiBzdHJpbmc7IG5vZGVQYXRoPzogc3RyaW5nIH0pOiBQcm9taXNlPHN0cmluZyB8IG51bGw+IHtcbiAgICAgICAgaWYgKG9wdGlvbnMudXVpZCkge1xuICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnMudXVpZDtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3B0aW9ucy5ub2RlUGF0aCkge1xuICAgICAgICAgICAgLy8g57uE5Lu26Lev5b6EID0g6IqC54K56Lev5b6EICsg57uE5Lu257G75Z6L77yM5LiOIHNjZW5lLXF1ZXJ5LWNvbXBvbmVudCDnuqblrprkuIDoh7RcbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudFBhdGggPSBgJHtvcHRpb25zLm5vZGVQYXRofS9jYy5QYXJ0aWNsZVN5c3RlbWA7XG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnRJbmZvID0gYXdhaXQgU2NlbmUuQ29tcG9uZW50LnF1ZXJ5KHsgcGF0aDogY29tcG9uZW50UGF0aCB9KTtcbiAgICAgICAgICAgIGlmIChjb21wb25lbnRJbmZvICYmIHR5cGVvZiBjb21wb25lbnRJbmZvID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgIC8vIElDb21wb25lbnRJbmZvLnZhbHVlLnV1aWQudmFsdWUg5oiW55u05o6lIHV1aWQg5a2X5q6177yM5YW85a655Lik56eNIGR1bXAg57uT5p6EXG4gICAgICAgICAgICAgICAgY29uc3QgYW55SW5mbyA9IGNvbXBvbmVudEluZm8gYXMgYW55O1xuICAgICAgICAgICAgICAgIHJldHVybiBhbnlJbmZvPy52YWx1ZT8udXVpZD8udmFsdWUgPz8gYW55SW5mbz8udXVpZCA/PyBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn1cbiJdfQ==