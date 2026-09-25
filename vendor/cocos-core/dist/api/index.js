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
exports.CocosAPI = void 0;
const schema_1 = require("./schema");
const decorator_1 = require("./decorator/decorator");
const schema_2 = require("./builder/schema");
class CocosAPI {
    scene;
    engine;
    project;
    assets;
    builder;
    configuration;
    system;
    static async create() {
        const api = new CocosAPI();
        await api._init();
        return api;
    }
    constructor() {
    }
    /**
     * 初始化 API 实例，主要是为了实现按需加载
     */
    async _init() {
        const { SceneApi } = await Promise.resolve().then(() => __importStar(require('../api/scene/scene')));
        this.scene = new SceneApi();
        const { EngineApi } = await Promise.resolve().then(() => __importStar(require('../api/engine/engine')));
        this.engine = new EngineApi();
        const { ProjectApi } = await Promise.resolve().then(() => __importStar(require('../api/project/project')));
        this.project = new ProjectApi();
        const { AssetsApi } = await Promise.resolve().then(() => __importStar(require('../api/assets/assets')));
        this.assets = new AssetsApi();
        const { BuilderApi } = await Promise.resolve().then(() => __importStar(require('../api/builder/builder')));
        this.builder = new BuilderApi();
        const { ConfigurationApi } = await Promise.resolve().then(() => __importStar(require('../api/configuration/configuration')));
        this.configuration = new ConfigurationApi();
        const { SystemApi } = await Promise.resolve().then(() => __importStar(require('../api/system/system')));
        this.system = new SystemApi();
    }
    /**
     * 启动 MCP 服务器
     * @param projectPath
     * @param port
     */
    startupMcpServer(projectPath, port) {
        this.startup(projectPath, port);
    }
    /**
     * 启动工程
     */
    async startup(projectPath, port) {
        const { default: Launcher } = await Promise.resolve().then(() => __importStar(require('../core/launcher')));
        const launcher = new Launcher(projectPath);
        await launcher.startup(port);
    }
    /**
     * 命令行创建入口
     * 创建一个项目
     * @param projectPath
     * @param type
     */
    static async createProject(projectPath, type) {
        const { projectManager } = await Promise.resolve().then(() => __importStar(require('../core/project-manager')));
        return await projectManager.create(projectPath, type);
    }
    /**
     * 命令行构建入口
     * @param platform
     * @param options
     */
    static async buildProject(projectPath, platform, options) {
        const { default: Launcher } = await Promise.resolve().then(() => __importStar(require('../core/launcher')));
        const launcher = new Launcher(projectPath);
        return await launcher.build(platform, options);
    }
    /**
     * 命令行打包入口
     * @param platform
     * @param dest
     */
    static async makeProject(platform, dest) {
        const { default: Launcher } = await Promise.resolve().then(() => __importStar(require('../core/launcher')));
        return await Launcher.make(platform, dest);
    }
    /**
     * 命令行运行入口
     * @param platform
     * @param dest
     */
    static async runProject(platform, dest) {
        const { default: Launcher } = await Promise.resolve().then(() => __importStar(require('../core/launcher')));
        return await Launcher.run(platform, dest);
    }
    /**
     * 命令行上传入口
     * @param platform
     * @param dest
     */
    static async uploadProject(platform, dest, accessToken) {
        const { default: Launcher } = await Promise.resolve().then(() => __importStar(require('../core/launcher')));
        return await Launcher.upload(platform, dest, accessToken);
    }
    /**
     * 命令行发布入口
     * @param platform
     * @param dest
     */
    static async publishProject(platform, dest) {
        const { default: Launcher } = await Promise.resolve().then(() => __importStar(require('../core/launcher')));
        return await Launcher.publish(platform, dest);
    }
}
exports.CocosAPI = CocosAPI;
__decorate([
    __param(0, (0, decorator_1.param)(schema_1.SchemaProjectPath)),
    __param(1, (0, decorator_1.param)(schema_1.SchemaPort)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CocosAPI.prototype, "startupMcpServer", null);
__decorate([
    __param(0, (0, decorator_1.param)(schema_1.SchemaProjectPath)),
    __param(1, (0, decorator_1.param)(schema_1.SchemaPort)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CocosAPI.prototype, "startup", null);
__decorate([
    __param(0, (0, decorator_1.param)(schema_1.SchemaProjectPath)),
    __param(1, (0, decorator_1.param)(schema_1.SchemaProjectType)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CocosAPI, "createProject", null);
__decorate([
    __param(1, (0, decorator_1.param)(schema_2.SchemaPlatform)),
    __param(2, (0, decorator_1.param)(schema_2.SchemaBuildOption)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], CocosAPI, "buildProject", null);
__decorate([
    __param(0, (0, decorator_1.param)(schema_2.SchemaPlatformCanMake)),
    __param(1, (0, decorator_1.param)(schema_2.SchemaBuildDest)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CocosAPI, "makeProject", null);
__decorate([
    __param(0, (0, decorator_1.param)(schema_2.SchemaPlatform)),
    __param(1, (0, decorator_1.param)(schema_2.SchemaBuildDest)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CocosAPI, "runProject", null);
__decorate([
    __param(0, (0, decorator_1.param)(schema_2.SchemaPlatform)),
    __param(1, (0, decorator_1.param)(schema_2.SchemaBuildDest)),
    __param(2, (0, decorator_1.param)(schema_2.SchemaUploadAccessToken)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], CocosAPI, "uploadProject", null);
__decorate([
    __param(0, (0, decorator_1.param)(schema_2.SchemaPlatform)),
    __param(1, (0, decorator_1.param)(schema_2.SchemaBuildDest)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CocosAPI, "publishProject", null);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvYXBpL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQU9BLHFDQUErRztBQUMvRyxxREFBOEM7QUFDOUMsNkNBQWlOO0FBRWpOLE1BQWEsUUFBUTtJQUNWLEtBQUssQ0FBWTtJQUNqQixNQUFNLENBQWE7SUFDbkIsT0FBTyxDQUFjO0lBQ3JCLE1BQU0sQ0FBYTtJQUNuQixPQUFPLENBQWM7SUFDckIsYUFBYSxDQUFvQjtJQUNqQyxNQUFNLENBQWE7SUFFMUIsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNO1FBQ2YsTUFBTSxHQUFHLEdBQUcsSUFBSSxRQUFRLEVBQUUsQ0FBQztRQUMzQixNQUFNLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNsQixPQUFPLEdBQUcsQ0FBQztJQUNmLENBQUM7SUFFRDtJQUVBLENBQUM7SUFFRDs7T0FFRztJQUNLLEtBQUssQ0FBQyxLQUFLO1FBQ2YsTUFBTSxFQUFFLFFBQVEsRUFBRSxHQUFHLHdEQUFhLG9CQUFvQixHQUFDLENBQUM7UUFDeEQsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLFFBQVEsRUFBRSxDQUFDO1FBQzVCLE1BQU0sRUFBRSxTQUFTLEVBQUUsR0FBRyx3REFBYSxzQkFBc0IsR0FBQyxDQUFDO1FBQzNELElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxTQUFTLEVBQUUsQ0FBQztRQUM5QixNQUFNLEVBQUUsVUFBVSxFQUFFLEdBQUcsd0RBQWEsd0JBQXdCLEdBQUMsQ0FBQztRQUM5RCxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksVUFBVSxFQUFFLENBQUM7UUFDaEMsTUFBTSxFQUFFLFNBQVMsRUFBRSxHQUFHLHdEQUFhLHNCQUFzQixHQUFDLENBQUM7UUFDM0QsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLFNBQVMsRUFBRSxDQUFDO1FBQzlCLE1BQU0sRUFBRSxVQUFVLEVBQUUsR0FBRyx3REFBYSx3QkFBd0IsR0FBQyxDQUFDO1FBQzlELElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxVQUFVLEVBQUUsQ0FBQztRQUNoQyxNQUFNLEVBQUUsZ0JBQWdCLEVBQUUsR0FBRyx3REFBYSxvQ0FBb0MsR0FBQyxDQUFDO1FBQ2hGLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxnQkFBZ0IsRUFBRSxDQUFDO1FBQzVDLE1BQU0sRUFBRSxTQUFTLEVBQUUsR0FBRyx3REFBYSxzQkFBc0IsR0FBQyxDQUFDO1FBQzNELElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxTQUFTLEVBQUUsQ0FBQztJQUNsQyxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNJLGdCQUFnQixDQUEyQixXQUF5QixFQUFxQixJQUFZO1FBQ3hHLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3BDLENBQUM7SUFFRDs7T0FFRztJQUNVLEFBQU4sS0FBSyxDQUFDLE9BQU8sQ0FBMkIsV0FBeUIsRUFBcUIsSUFBWTtRQUNyRyxNQUFNLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxHQUFHLHdEQUFhLGtCQUFrQixHQUFDLENBQUM7UUFDL0QsTUFBTSxRQUFRLEdBQUcsSUFBSSxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDM0MsTUFBTSxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2pDLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNpQixBQUFiLE1BQU0sQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUEyQixXQUF5QixFQUE0QixJQUFrQjtRQUMvSCxNQUFNLEVBQUUsY0FBYyxFQUFFLEdBQUcsd0RBQWEseUJBQXlCLEdBQUMsQ0FBQztRQUNuRSxPQUFPLE1BQU0sY0FBYyxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDMUQsQ0FBQztJQUVEOzs7O09BSUc7SUFDaUIsQUFBYixNQUFNLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxXQUFtQixFQUF5QixRQUFtQixFQUE0QixPQUFxQjtRQUM3SSxNQUFNLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxHQUFHLHdEQUFhLGtCQUFrQixHQUFDLENBQUM7UUFDL0QsTUFBTSxRQUFRLEdBQUcsSUFBSSxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDM0MsT0FBTyxNQUFNLFFBQVEsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLE9BQWMsQ0FBQyxDQUFDO0lBQzFELENBQUM7SUFFRDs7OztPQUlHO0lBQ2lCLEFBQWIsTUFBTSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQStCLFFBQTBCLEVBQTBCLElBQWdCO1FBQzlILE1BQU0sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLEdBQUcsd0RBQWEsa0JBQWtCLEdBQUMsQ0FBQztRQUMvRCxPQUFPLE1BQU0sUUFBUSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDL0MsQ0FBQztJQUVEOzs7O09BSUc7SUFDaUIsQUFBYixNQUFNLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBd0IsUUFBbUIsRUFBMEIsSUFBZ0I7UUFDL0csTUFBTSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsR0FBRyx3REFBYSxrQkFBa0IsR0FBQyxDQUFDO1FBQy9ELE9BQU8sTUFBTSxRQUFRLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUM5QyxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNpQixBQUFiLE1BQU0sQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUF3QixRQUFtQixFQUEwQixJQUFnQixFQUFrQyxXQUFnQztRQUNwTCxNQUFNLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxHQUFHLHdEQUFhLGtCQUFrQixHQUFDLENBQUM7UUFDL0QsT0FBTyxNQUFNLFFBQVEsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxXQUFXLENBQUMsQ0FBQztJQUM5RCxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNpQixBQUFiLE1BQU0sQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUF3QixRQUFtQixFQUEwQixJQUFnQjtRQUNuSCxNQUFNLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxHQUFHLHdEQUFhLGtCQUFrQixHQUFDLENBQUM7UUFDL0QsT0FBTyxNQUFNLFFBQVEsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ2xELENBQUM7Q0FDSjtBQXRIRCw0QkFzSEM7QUExRVU7SUFBa0IsV0FBQSxJQUFBLGlCQUFLLEVBQUMsMEJBQWlCLENBQUMsQ0FBQTtJQUE2QixXQUFBLElBQUEsaUJBQUssRUFBQyxtQkFBVSxDQUFDLENBQUE7Ozs7Z0RBRTlGO0FBS1k7SUFBUyxXQUFBLElBQUEsaUJBQUssRUFBQywwQkFBaUIsQ0FBQyxDQUFBO0lBQTZCLFdBQUEsSUFBQSxpQkFBSyxFQUFDLG1CQUFVLENBQUMsQ0FBQTs7Ozt1Q0FJM0Y7QUFRbUI7SUFBZSxXQUFBLElBQUEsaUJBQUssRUFBQywwQkFBaUIsQ0FBQyxDQUFBO0lBQTZCLFdBQUEsSUFBQSxpQkFBSyxFQUFDLDBCQUFpQixDQUFDLENBQUE7Ozs7bUNBRy9HO0FBT21CO0lBQW1DLFdBQUEsSUFBQSxpQkFBSyxFQUFDLHVCQUFjLENBQUMsQ0FBQTtJQUF1QixXQUFBLElBQUEsaUJBQUssRUFBQywwQkFBaUIsQ0FBQyxDQUFBOzs7O2tDQUkxSDtBQU9tQjtJQUFhLFdBQUEsSUFBQSxpQkFBSyxFQUFDLDhCQUFxQixDQUFDLENBQUE7SUFBOEIsV0FBQSxJQUFBLGlCQUFLLEVBQUMsd0JBQWUsQ0FBQyxDQUFBOzs7O2lDQUdoSDtBQU9tQjtJQUFZLFdBQUEsSUFBQSxpQkFBSyxFQUFDLHVCQUFjLENBQUMsQ0FBQTtJQUF1QixXQUFBLElBQUEsaUJBQUssRUFBQyx3QkFBZSxDQUFDLENBQUE7Ozs7Z0NBR2pHO0FBT21CO0lBQWUsV0FBQSxJQUFBLGlCQUFLLEVBQUMsdUJBQWMsQ0FBQyxDQUFBO0lBQXVCLFdBQUEsSUFBQSxpQkFBSyxFQUFDLHdCQUFlLENBQUMsQ0FBQTtJQUFvQixXQUFBLElBQUEsaUJBQUssRUFBQyxnQ0FBdUIsQ0FBQyxDQUFBOzs7O21DQUd0SjtBQU9tQjtJQUFnQixXQUFBLElBQUEsaUJBQUssRUFBQyx1QkFBYyxDQUFDLENBQUE7SUFBdUIsV0FBQSxJQUFBLGlCQUFLLEVBQUMsd0JBQWUsQ0FBQyxDQUFBOzs7O29DQUdyRyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgRW5naW5lQXBpIH0gZnJvbSAnLi4vYXBpL2VuZ2luZS9lbmdpbmUnO1xuaW1wb3J0IHR5cGUgeyBQcm9qZWN0QXBpIH0gZnJvbSAnLi4vYXBpL3Byb2plY3QvcHJvamVjdCc7XG5pbXBvcnQgdHlwZSB7IEFzc2V0c0FwaSB9IGZyb20gJy4uL2FwaS9hc3NldHMvYXNzZXRzJztcbmltcG9ydCB0eXBlIHsgQnVpbGRlckFwaSB9IGZyb20gJy4uL2FwaS9idWlsZGVyL2J1aWxkZXInO1xuaW1wb3J0IHR5cGUgeyBDb25maWd1cmF0aW9uQXBpIH0gZnJvbSAnLi4vYXBpL2NvbmZpZ3VyYXRpb24vY29uZmlndXJhdGlvbic7XG5pbXBvcnQgdHlwZSB7IFNjZW5lQXBpIH0gZnJvbSAnLi4vYXBpL3NjZW5lL3NjZW5lJztcbmltcG9ydCB0eXBlIHsgU3lzdGVtQXBpIH0gZnJvbSAnLi4vYXBpL3N5c3RlbS9zeXN0ZW0nO1xuaW1wb3J0IHsgU2NoZW1hUHJvamVjdFBhdGgsIFNjaGVtYVBvcnQsIFNjaGVtYVByb2plY3RUeXBlLCBUUHJvamVjdFBhdGgsIFRQb3J0LCBUUHJvamVjdFR5cGUgfSBmcm9tICcuL3NjaGVtYSc7XG5pbXBvcnQgeyBwYXJhbSB9IGZyb20gJy4vZGVjb3JhdG9yL2RlY29yYXRvcic7XG5pbXBvcnQgeyBTY2hlbWFQbGF0Zm9ybSwgVFBsYXRmb3JtLCBTY2hlbWFCdWlsZE9wdGlvbiwgVEJ1aWxkT3B0aW9uLCBTY2hlbWFQbGF0Zm9ybUNhbk1ha2UsIFRQbGF0Zm9ybUNhbk1ha2UsIFNjaGVtYUJ1aWxkRGVzdCwgVEJ1aWxkRGVzdCwgU2NoZW1hVXBsb2FkQWNjZXNzVG9rZW4sIFRVcGxvYWRBY2Nlc3NUb2tlbiB9IGZyb20gJy4vYnVpbGRlci9zY2hlbWEnO1xuXG5leHBvcnQgY2xhc3MgQ29jb3NBUEkge1xuICAgIHB1YmxpYyBzY2VuZSE6IFNjZW5lQXBpO1xuICAgIHB1YmxpYyBlbmdpbmUhOiBFbmdpbmVBcGk7XG4gICAgcHVibGljIHByb2plY3QhOiBQcm9qZWN0QXBpO1xuICAgIHB1YmxpYyBhc3NldHMhOiBBc3NldHNBcGk7XG4gICAgcHVibGljIGJ1aWxkZXIhOiBCdWlsZGVyQXBpO1xuICAgIHB1YmxpYyBjb25maWd1cmF0aW9uITogQ29uZmlndXJhdGlvbkFwaTtcbiAgICBwdWJsaWMgc3lzdGVtITogU3lzdGVtQXBpO1xuXG4gICAgc3RhdGljIGFzeW5jIGNyZWF0ZSgpIHtcbiAgICAgICAgY29uc3QgYXBpID0gbmV3IENvY29zQVBJKCk7XG4gICAgICAgIGF3YWl0IGFwaS5faW5pdCgpO1xuICAgICAgICByZXR1cm4gYXBpO1xuICAgIH1cblxuICAgIHByaXZhdGUgY29uc3RydWN0b3IoKSB7XG5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDliJ3lp4vljJYgQVBJIOWunuS+i++8jOS4u+imgeaYr+S4uuS6huWunueOsOaMiemcgOWKoOi9vVxuICAgICAqL1xuICAgIHByaXZhdGUgYXN5bmMgX2luaXQoKSB7XG4gICAgICAgIGNvbnN0IHsgU2NlbmVBcGkgfSA9IGF3YWl0IGltcG9ydCgnLi4vYXBpL3NjZW5lL3NjZW5lJyk7XG4gICAgICAgIHRoaXMuc2NlbmUgPSBuZXcgU2NlbmVBcGkoKTtcbiAgICAgICAgY29uc3QgeyBFbmdpbmVBcGkgfSA9IGF3YWl0IGltcG9ydCgnLi4vYXBpL2VuZ2luZS9lbmdpbmUnKTtcbiAgICAgICAgdGhpcy5lbmdpbmUgPSBuZXcgRW5naW5lQXBpKCk7XG4gICAgICAgIGNvbnN0IHsgUHJvamVjdEFwaSB9ID0gYXdhaXQgaW1wb3J0KCcuLi9hcGkvcHJvamVjdC9wcm9qZWN0Jyk7XG4gICAgICAgIHRoaXMucHJvamVjdCA9IG5ldyBQcm9qZWN0QXBpKCk7XG4gICAgICAgIGNvbnN0IHsgQXNzZXRzQXBpIH0gPSBhd2FpdCBpbXBvcnQoJy4uL2FwaS9hc3NldHMvYXNzZXRzJyk7XG4gICAgICAgIHRoaXMuYXNzZXRzID0gbmV3IEFzc2V0c0FwaSgpO1xuICAgICAgICBjb25zdCB7IEJ1aWxkZXJBcGkgfSA9IGF3YWl0IGltcG9ydCgnLi4vYXBpL2J1aWxkZXIvYnVpbGRlcicpO1xuICAgICAgICB0aGlzLmJ1aWxkZXIgPSBuZXcgQnVpbGRlckFwaSgpO1xuICAgICAgICBjb25zdCB7IENvbmZpZ3VyYXRpb25BcGkgfSA9IGF3YWl0IGltcG9ydCgnLi4vYXBpL2NvbmZpZ3VyYXRpb24vY29uZmlndXJhdGlvbicpO1xuICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24gPSBuZXcgQ29uZmlndXJhdGlvbkFwaSgpO1xuICAgICAgICBjb25zdCB7IFN5c3RlbUFwaSB9ID0gYXdhaXQgaW1wb3J0KCcuLi9hcGkvc3lzdGVtL3N5c3RlbScpO1xuICAgICAgICB0aGlzLnN5c3RlbSA9IG5ldyBTeXN0ZW1BcGkoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlkK/liqggTUNQIOacjeWKoeWZqFxuICAgICAqIEBwYXJhbSBwcm9qZWN0UGF0aCBcbiAgICAgKiBAcGFyYW0gcG9ydCBcbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhcnR1cE1jcFNlcnZlcihAcGFyYW0oU2NoZW1hUHJvamVjdFBhdGgpIHByb2plY3RQYXRoOiBUUHJvamVjdFBhdGgsIEBwYXJhbShTY2hlbWFQb3J0KSBwb3J0PzogVFBvcnQpIHtcbiAgICAgICAgdGhpcy5zdGFydHVwKHByb2plY3RQYXRoLCBwb3J0KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlkK/liqjlt6XnqItcbiAgICAgKi9cbiAgICBwdWJsaWMgYXN5bmMgc3RhcnR1cChAcGFyYW0oU2NoZW1hUHJvamVjdFBhdGgpIHByb2plY3RQYXRoOiBUUHJvamVjdFBhdGgsIEBwYXJhbShTY2hlbWFQb3J0KSBwb3J0PzogVFBvcnQpIHtcbiAgICAgICAgY29uc3QgeyBkZWZhdWx0OiBMYXVuY2hlciB9ID0gYXdhaXQgaW1wb3J0KCcuLi9jb3JlL2xhdW5jaGVyJyk7XG4gICAgICAgIGNvbnN0IGxhdW5jaGVyID0gbmV3IExhdW5jaGVyKHByb2plY3RQYXRoKTtcbiAgICAgICAgYXdhaXQgbGF1bmNoZXIuc3RhcnR1cChwb3J0KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlkb3ku6TooYzliJvlu7rlhaXlj6NcbiAgICAgKiDliJvlu7rkuIDkuKrpobnnm65cbiAgICAgKiBAcGFyYW0gcHJvamVjdFBhdGggXG4gICAgICogQHBhcmFtIHR5cGUgXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBhc3luYyBjcmVhdGVQcm9qZWN0KEBwYXJhbShTY2hlbWFQcm9qZWN0UGF0aCkgcHJvamVjdFBhdGg6IFRQcm9qZWN0UGF0aCwgQHBhcmFtKFNjaGVtYVByb2plY3RUeXBlKSB0eXBlOiBUUHJvamVjdFR5cGUpIHtcbiAgICAgICAgY29uc3QgeyBwcm9qZWN0TWFuYWdlciB9ID0gYXdhaXQgaW1wb3J0KCcuLi9jb3JlL3Byb2plY3QtbWFuYWdlcicpO1xuICAgICAgICByZXR1cm4gYXdhaXQgcHJvamVjdE1hbmFnZXIuY3JlYXRlKHByb2plY3RQYXRoLCB0eXBlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlkb3ku6TooYzmnoTlu7rlhaXlj6NcbiAgICAgKiBAcGFyYW0gcGxhdGZvcm0gXG4gICAgICogQHBhcmFtIG9wdGlvbnMgXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBhc3luYyBidWlsZFByb2plY3QocHJvamVjdFBhdGg6IHN0cmluZywgQHBhcmFtKFNjaGVtYVBsYXRmb3JtKSBwbGF0Zm9ybTogVFBsYXRmb3JtLCBAcGFyYW0oU2NoZW1hQnVpbGRPcHRpb24pIG9wdGlvbnM6IFRCdWlsZE9wdGlvbikge1xuICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IExhdW5jaGVyIH0gPSBhd2FpdCBpbXBvcnQoJy4uL2NvcmUvbGF1bmNoZXInKTtcbiAgICAgICAgY29uc3QgbGF1bmNoZXIgPSBuZXcgTGF1bmNoZXIocHJvamVjdFBhdGgpO1xuICAgICAgICByZXR1cm4gYXdhaXQgbGF1bmNoZXIuYnVpbGQocGxhdGZvcm0sIG9wdGlvbnMgYXMgYW55KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlkb3ku6TooYzmiZPljIXlhaXlj6NcbiAgICAgKiBAcGFyYW0gcGxhdGZvcm0gXG4gICAgICogQHBhcmFtIGRlc3QgXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBhc3luYyBtYWtlUHJvamVjdChAcGFyYW0oU2NoZW1hUGxhdGZvcm1DYW5NYWtlKSBwbGF0Zm9ybTogVFBsYXRmb3JtQ2FuTWFrZSwgQHBhcmFtKFNjaGVtYUJ1aWxkRGVzdCkgZGVzdDogVEJ1aWxkRGVzdCkge1xuICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IExhdW5jaGVyIH0gPSBhd2FpdCBpbXBvcnQoJy4uL2NvcmUvbGF1bmNoZXInKTtcbiAgICAgICAgcmV0dXJuIGF3YWl0IExhdW5jaGVyLm1ha2UocGxhdGZvcm0sIGRlc3QpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWRveS7pOihjOi/kOihjOWFpeWPo1xuICAgICAqIEBwYXJhbSBwbGF0Zm9ybSBcbiAgICAgKiBAcGFyYW0gZGVzdCBcbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIGFzeW5jIHJ1blByb2plY3QoQHBhcmFtKFNjaGVtYVBsYXRmb3JtKSBwbGF0Zm9ybTogVFBsYXRmb3JtLCBAcGFyYW0oU2NoZW1hQnVpbGREZXN0KSBkZXN0OiBUQnVpbGREZXN0KSB7XG4gICAgICAgIGNvbnN0IHsgZGVmYXVsdDogTGF1bmNoZXIgfSA9IGF3YWl0IGltcG9ydCgnLi4vY29yZS9sYXVuY2hlcicpO1xuICAgICAgICByZXR1cm4gYXdhaXQgTGF1bmNoZXIucnVuKHBsYXRmb3JtLCBkZXN0KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlkb3ku6TooYzkuIrkvKDlhaXlj6NcbiAgICAgKiBAcGFyYW0gcGxhdGZvcm1cbiAgICAgKiBAcGFyYW0gZGVzdFxuICAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgYXN5bmMgdXBsb2FkUHJvamVjdChAcGFyYW0oU2NoZW1hUGxhdGZvcm0pIHBsYXRmb3JtOiBUUGxhdGZvcm0sIEBwYXJhbShTY2hlbWFCdWlsZERlc3QpIGRlc3Q6IFRCdWlsZERlc3QsIEBwYXJhbShTY2hlbWFVcGxvYWRBY2Nlc3NUb2tlbikgYWNjZXNzVG9rZW4/OiBUVXBsb2FkQWNjZXNzVG9rZW4pIHtcbiAgICAgICAgY29uc3QgeyBkZWZhdWx0OiBMYXVuY2hlciB9ID0gYXdhaXQgaW1wb3J0KCcuLi9jb3JlL2xhdW5jaGVyJyk7XG4gICAgICAgIHJldHVybiBhd2FpdCBMYXVuY2hlci51cGxvYWQocGxhdGZvcm0sIGRlc3QsIGFjY2Vzc1Rva2VuKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlkb3ku6TooYzlj5HluIPlhaXlj6NcbiAgICAgKiBAcGFyYW0gcGxhdGZvcm1cbiAgICAgKiBAcGFyYW0gZGVzdFxuICAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgYXN5bmMgcHVibGlzaFByb2plY3QoQHBhcmFtKFNjaGVtYVBsYXRmb3JtKSBwbGF0Zm9ybTogVFBsYXRmb3JtLCBAcGFyYW0oU2NoZW1hQnVpbGREZXN0KSBkZXN0OiBUQnVpbGREZXN0KSB7XG4gICAgICAgIGNvbnN0IHsgZGVmYXVsdDogTGF1bmNoZXIgfSA9IGF3YWl0IGltcG9ydCgnLi4vY29yZS9sYXVuY2hlcicpO1xuICAgICAgICByZXR1cm4gYXdhaXQgTGF1bmNoZXIucHVibGlzaChwbGF0Zm9ybSwgZGVzdCk7XG4gICAgfVxufVxuIl19