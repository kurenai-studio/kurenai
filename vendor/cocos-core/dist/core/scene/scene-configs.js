"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sceneConfigInstance = void 0;
const configuration_1 = require("../configuration");
const metadata_1 = require("./metadata");
class SceneConfig {
    defaultConfig = {
        tick: false,
        camera: {
            color: [48, 48, 48, 255],
            fov: 45,
            far: 10000,
            near: 0.01,
            wheelSpeed: 0.01,
            wanderSpeed: 10,
            enableAcceleration: true,
            aperture: 19,
            shutter: 7,
            iso: 0,
        },
        gizmo: {
            is2D: false,
            is3DIcon: false,
            iconSize: 2,
            transformToolName: 'position',
            viewMode: 'select',
            pivot: 'pivot',
            coordinate: 'local',
            toolsVisibility3d: true,
            gridVisible: true,
            gridColor: [166, 166, 166, 255],
            originAxis2D: {
                x: true,
                y: true,
                z: false,
            },
            originAxis3D: {
                x: true,
                y: false,
                z: true,
            },
            rectSnapConfig: {
                enableSnapping: true,
                snapThreshold: 4,
            },
        },
        sceneView: {
            sceneLightOn: true,
        },
        // 运行期由 Camera 服务写入；提供空默认值，避免首次 get 时配置层抛错并被 RPC 中间件记为错误日志
        'camera-infos': {},
        'camera-uuids': [],
        referenceImage: {
            images: [],
            sceneBindings: {},
            desiredVisible: true,
        },
    };
    configInstance;
    // 个人/本机键：存 local(profiles/)，不进版本库
    static PERSONAL_KEYS = ['camera', 'gizmo', 'sceneView', 'camera-infos', 'camera-uuids', 'referenceImage'];
    async init() {
        this.configInstance = await configuration_1.configurationRegistry.register('scene', {
            defaults: this.defaultConfig,
            nodes: () => (0, metadata_1.createSceneMetadataNodes)(this.defaultConfig),
        });
        await this._migratePersonalKeysToLocal();
    }
    /**
     * 一次性迁移：把历史上写在 project(committed) 里的个人键搬到 local(profiles/)，并从 project 删除，
     * 避免个人配置继续被提交。仅在 local 尚无该键时迁移，避免覆盖已有 local 值。
     */
    async _migratePersonalKeysToLocal() {
        const projectAll = this.configInstance.getAll('project') || {};
        const localAll = this.configInstance.getAll('local') || {};
        for (const key of SceneConfig.PERSONAL_KEYS) {
            if (!Object.prototype.hasOwnProperty.call(projectAll, key)) {
                continue;
            }
            if (!Object.prototype.hasOwnProperty.call(localAll, key)) {
                await this.configInstance.set(key, projectAll[key], 'local');
            }
            await this.configInstance.remove(key, 'project');
        }
    }
    resolveSetScope(path, scope) {
        if (scope) {
            return scope;
        }
        return SceneConfig.PERSONAL_KEYS.some((key) => path === key || path.startsWith(`${key}.`))
            ? 'local'
            : undefined;
    }
    get(path, scope) {
        return this.configInstance.get(path, scope);
    }
    set(path, value, scope) {
        return this.configInstance.set(path, value, this.resolveSetScope(path, scope));
    }
}
exports.sceneConfigInstance = new SceneConfig();
