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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HuaweiAGCPackTool = void 0;
const fs = __importStar(require("fs-extra"));
const ps = __importStar(require("path"));
const android_1 = require("./android");
class HuaweiAGCPackTool extends android_1.AndroidPackTool {
    constructor() {
        super(...arguments);
        // 模板复用 android 平台的
        this._platform = 'android';
    }
    /**
     * 拷贝 android 平台模板到 project/native/engine/huawei-agc 目录下
     */
    async copyPlatformTemplate() {
        // 原生工程不重复拷贝 TODO 复用前需要做版本检测
        if (!fs.existsSync(this.paths.nativePrjDir)) {
            // 拷贝 lite 仓库的 templates/android/build 文件到构建输出目录
            await fs.copy(ps.join(this.paths.nativeTemplateDirInCocos, this._platform, 'build'), this.paths.nativePrjDir, { overwrite: false });
            this.firstTimeBuild = true;
        }
        else {
            this.firstTimeBuild = false;
        }
        // 原生工程不重复拷贝 TODO 复用前需要做版本检测
        if (!fs.existsSync(this.paths.platformTemplateDirInPrj)) {
            // 拷贝 lite 仓库的 templates/android/template 文件到构建输出目录
            await fs.copy(ps.join(this.paths.nativeTemplateDirInCocos, this._platform, 'template'), this.paths.platformTemplateDirInPrj, { overwrite: false });
            this.writeEngineVersion();
        }
        else {
            this.validateNativeDir();
        }
    }
    /**
     * 校验 engine/template/android 和 project/native/engine/huawei-agc 下的模板文件
     */
    validatePlatformDirectory(missing) {
        const srcDir = ps.join(this.paths.nativeTemplateDirInCocos, this._platform, 'template');
        const dstDir = this.paths.platformTemplateDirInPrj;
        this.validateDirectory(srcDir, dstDir, missing);
    }
}
exports.HuaweiAGCPackTool = HuaweiAGCPackTool;
//# sourceMappingURL=huawei-agc.js.map