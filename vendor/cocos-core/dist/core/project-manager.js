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
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectManager = void 0;
/**
 * 项目管理器，提供打开项目、创建项目的入口
 */
class ProjectManager {
    _currentLauncher = null;
    /**
     * 查询所有项目模板，用于创建的命令行选项显示
     * @returns
     */
    queryTemplates() {
        // TODO
    }
    /**
     * 创建一个项目
     * @param projectPath
     * @param type
     * @returns
     */
    async create(projectPath, type = '3d', template) {
        const { Project } = await Promise.resolve().then(() => __importStar(require('./project/script')));
        // TODO 支持模板后，Project 模块，无需支持空项目的创建了，都由管理器拷贝模板
        return await Project.create(projectPath, type);
    }
    /**
     * 打开某个项目
     * @param path
     */
    async open(path) {
        const { default: Launcher } = await Promise.resolve().then(() => __importStar(require('./launcher')));
        const projectLauncher = new Launcher(path);
        await projectLauncher.startup();
        this._currentLauncher = projectLauncher;
    }
    async close() {
        if (!this._currentLauncher) {
            throw new Error('No project is open');
        }
        await this._currentLauncher.close();
        this._currentLauncher = null;
    }
}
exports.projectManager = new ProjectManager();
