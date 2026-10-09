'use strict';
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
exports.JsonHandler = void 0;
const fs_extra_1 = require("fs-extra");
const JSON5 = __importStar(require("json5"));
const cc_1 = require("cc");
exports.JsonHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: 'json',
    // 引擎内对应的类型
    assetType: 'cc.JsonAsset',
    importer: {
        // 版本号如果变更，则会强制重新导入
        version: '2.0.1',
        /**
         * 实际导入流程
         * 需要自己控制是否生成、拷贝文件
         *
         * 返回是否导入成功的标记
         * 如果返回 false，则 imported 标记不会变成 true
         * 后续的一系列操作都不会执行
         * @param asset
         */
        async import(asset) {
            const json5Enabled = asset.userData.json5 ?? true;
            let json;
            if (json5Enabled) {
                const text = await (0, fs_extra_1.readFile)(asset.source, 'utf8');
                json = JSON5.parse(text);
            }
            else {
                json = await (0, fs_extra_1.readJSON)(asset.source);
            }
            const jsonAsset = new cc_1.JsonAsset();
            jsonAsset.name = asset.basename;
            jsonAsset.json = json;
            const serializeJSON = EditorExtends.serialize(jsonAsset);
            await asset.saveToLibrary('.json', serializeJSON);
            // 旧版本可能记录了错误的依赖数据，需要清空
            asset.setData('depends', []);
            return true;
        },
    },
};
exports.default = exports.JsonHandler;
