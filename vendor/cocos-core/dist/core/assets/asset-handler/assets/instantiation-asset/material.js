'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialHandler = void 0;
const asset_1 = __importDefault(require("./asset"));
exports.MaterialHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: 'instantiation-material',
    // 引擎内对应的类型
    assetType: 'cc.Material',
    importer: {
        // 版本号如果变更，则会强制重新导入
        ...asset_1.default.importer,
        version: '1.0.0',
    },
};
exports.default = exports.MaterialHandler;
