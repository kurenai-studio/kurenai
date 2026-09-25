"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nativePackToolMg = exports.NativePackToolManager = void 0;
const platformPackToolMap = {
    ios: () => {
        return require('../platforms/ios').IOSPackTool;
    },
    mac: () => {
        return require('../platforms/mac').MacPackTool;
    },
    windows: () => {
        return require('../platforms/windows').WindowsPackTool;
    },
    android: () => {
        return require('../platforms/android').AndroidPackTool;
    },
    'google-play': () => {
        return require('../platforms/google-play').GooglePlayPackTool;
    },
    'harmonyos-next': () => {
        return require('../platforms/harmonyos-next').HarmonyOSNextPackTool;
    },
    ohos: () => {
        return require('../platforms/ohos').OHOSPackTool;
    },
    'huawei-agc': () => {
        return require('../platforms/huawei-agc').HuaweiAGCPackTool;
    },
};
class NativePackToolManager {
    constructor() {
        this.PackToolMap = {};
    }
    static register(platform, tool) {
        NativePackToolManager.platformToPackTool[platform] = tool;
    }
    getTool(platform) {
        const handler = this.PackToolMap[platform];
        if (handler) {
            return handler;
        }
        const PackTool = NativePackToolManager.getPackTool(platform);
        this.PackToolMap[platform] = new PackTool();
        return this.PackToolMap[platform];
    }
    static getPackTool(platform) {
        if (NativePackToolManager.platformToPackTool[platform]) {
            return NativePackToolManager.platformToPackTool[platform];
        }
        if (!platformPackToolMap[platform]) {
            throw new Error(`No pack tool for platform ${platform}}`);
        }
        const PackTool = platformPackToolMap[platform]();
        NativePackToolManager.platformToPackTool[platform] = PackTool;
        return PackTool;
    }
    async openWithIDE(platform, projectPath, IDEDir) {
        const tool = NativePackToolManager.getPackTool(platform);
        if (!tool.openWithIDE) {
            return false;
        }
        await tool.openWithIDE(projectPath, IDEDir);
        return true;
    }
    init(params) {
        const tool = this.getTool(params.platform);
        tool.init(params);
        return tool;
    }
    async create(platform) {
        const tool = this.getTool(platform);
        if (!tool) {
            throw new Error(`No pack tool for platform ${platform}}`);
        }
        await tool.create();
        return tool;
    }
    async generate(platform) {
        const tool = this.getTool(platform);
        if (!tool) {
            throw new Error(`No pack tool for platform ${platform}}`);
        }
        if (!tool.generate) {
            return false;
        }
        return await tool.generate();
    }
    async make(platform) {
        const tool = this.getTool(platform);
        if (!tool.make) {
            return false;
        }
        await tool.make();
        return true;
    }
    async run(platform) {
        const tool = this.getTool(platform);
        if (!tool.run) {
            return false;
        }
        await tool.run();
        return true;
    }
}
exports.NativePackToolManager = NativePackToolManager;
NativePackToolManager.platformToPackTool = {};
exports.nativePackToolMg = new NativePackToolManager();
//# sourceMappingURL=manager.js.map