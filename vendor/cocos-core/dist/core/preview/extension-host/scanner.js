"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanPreviewExtensions = scanPreviewExtensions;
const path_1 = require("path");
const fs_1 = require("fs");
function resolveContribPath(dir, p) {
    if (!p) {
        return undefined;
    }
    const abs = (0, path_1.isAbsolute)(p) ? p : (0, path_1.join)(dir, p);
    return (0, fs_1.existsSync)(abs) ? abs : undefined;
}
/**
 * 扫描 `<project>/extensions/*` 下声明了 server / messages 贡献的扩展。
 * 与 asset-config.ts 中扫描 asset-db mount 的做法一致，只读 package.json，不加载代码。
 */
function scanPreviewExtensions(projectPath) {
    const result = [];
    const extensionsDir = (0, path_1.join)(projectPath, 'extensions');
    if (!(0, fs_1.existsSync)(extensionsDir)) {
        return result;
    }
    let entries;
    try {
        entries = (0, fs_1.readdirSync)(extensionsDir, { withFileTypes: true });
    }
    catch {
        return result;
    }
    for (const entry of entries) {
        if (!entry.isDirectory()) {
            continue;
        }
        const dir = (0, path_1.join)(extensionsDir, entry.name);
        const pkgPath = (0, path_1.join)(dir, 'package.json');
        if (!(0, fs_1.existsSync)(pkgPath)) {
            continue;
        }
        let manifest;
        try {
            manifest = JSON.parse((0, fs_1.readFileSync)(pkgPath, 'utf8'));
        }
        catch {
            continue;
        }
        const contributions = manifest?.contributions || {};
        const serverPath = resolveContribPath(dir, contributions.server);
        const messages = (contributions.messages || {});
        // 只关心提供了预览接口（server）或消息处理（messages）的扩展
        if (!serverPath && Object.keys(messages).length === 0) {
            continue;
        }
        const mainPath = resolveContribPath(dir, manifest.main);
        result.push({
            name: manifest.name || entry.name,
            dir,
            mainPath,
            serverPath,
            messages,
            manifest,
        });
    }
    return result;
}
