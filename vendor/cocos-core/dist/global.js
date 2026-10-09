"use strict";
/**
 * 一些全局路径配置记录
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalConfig = exports.GlobalPaths = void 0;
const path_1 = require("path");
exports.GlobalPaths = {
    staticDir: (0, path_1.join)(__dirname, '../static'),
    workspace: (0, path_1.join)(__dirname, '..'),
    enginePath: (0, path_1.join)(__dirname, '..', 'packages', 'engine'),
};
exports.GlobalConfig = {
    mode: 'hold',
};
