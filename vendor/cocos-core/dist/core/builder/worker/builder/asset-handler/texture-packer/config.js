"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.versionDev = exports.buildTempDir = exports.previewTempDir = exports.texturePackerTempDir = exports.version = void 0;
const path_1 = require("path");
const builder_config_1 = __importDefault(require("../../../../share/builder-config"));
// 记录整个自动图集的版本号，涉及到自动图集的算法策略等等
exports.version = '1.0.1';
exports.texturePackerTempDir = (0, path_1.join)(builder_config_1.default.projectRoot, `temp/builder/TexturePacker${exports.version}`);
exports.previewTempDir = (0, path_1.join)(exports.texturePackerTempDir, 'preview');
exports.buildTempDir = (0, path_1.join)(exports.texturePackerTempDir, 'build');
// 一些内部调整而需要重新生成自动图集的版本号记录
exports.versionDev = '1.0.2';
