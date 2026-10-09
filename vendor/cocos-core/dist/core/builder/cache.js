"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearCache = clearCache;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const builder_config_1 = __importDefault(require("./share/builder-config"));
const global_1 = require("../../global");
const BUILD_ASSET_CACHE_VERSION = '1.0.1';
function getProjectBuilderCacheRoot() {
    const projectTempDir = builder_config_1.default.projectTempDir;
    return (0, path_1.basename)(projectTempDir) === 'builder' ? projectTempDir : (0, path_1.join)(projectTempDir, 'builder');
}
function getProjectAssetCacheRoot() {
    return (0, path_1.join)(builder_config_1.default.projectTempDir, 'asset-db');
}
function getLegacyProjectAssetCacheRoot() {
    return (0, path_1.join)(getProjectBuilderCacheRoot(), 'asset-db');
}
function getGlobalCacheRoots() {
    const engineBin = (0, path_1.join)(global_1.GlobalPaths.enginePath, 'bin');
    return [
        (0, path_1.join)(engineBin, 'temp'),
        (0, path_1.join)(engineBin, '.cache', 'editor-cache'),
        (0, path_1.join)(engineBin, '.cache', 'dev-cli'),
    ];
}
function uniquePaths(paths) {
    return Array.from(new Set(paths.map((path) => (0, path_1.resolve)(path))));
}
function assertSafeCachePath(path) {
    const resolved = (0, path_1.resolve)(path);
    const root = (0, path_1.parse)(resolved).root;
    if (!resolved || resolved === root) {
        throw new Error(`Unsafe cache path: ${path}`);
    }
    return resolved;
}
function containsPath(parent, child) {
    const resolvedParent = assertSafeCachePath(parent);
    const resolvedChild = (0, path_1.resolve)(child);
    return resolvedParent === resolvedChild || resolvedChild.startsWith(resolvedParent + '\\') || resolvedChild.startsWith(resolvedParent + '/');
}
async function clearProjectAssetBuildCache(assetCacheRoot, cleared) {
    const resolvedRoot = assertSafeCachePath(assetCacheRoot);
    if (!await (0, fs_extra_1.pathExists)(resolvedRoot)) {
        return;
    }
    async function walk(dir) {
        const entries = await (0, fs_extra_1.readdir)(dir);
        await Promise.all(entries.map(async (entry) => {
            const current = (0, path_1.join)(dir, entry);
            const stats = await (0, fs_extra_1.lstat)(current);
            if (!stats.isDirectory()) {
                return;
            }
            if (entry === `build${BUILD_ASSET_CACHE_VERSION}`) {
                await (0, fs_extra_1.emptyDir)(current);
                cleared.push(current);
                return;
            }
            await walk(current);
        }));
    }
    await walk(resolvedRoot);
}
async function clearProjectBuilderCache(builderCacheRoot, skipRoots, cleared) {
    const resolvedRoot = assertSafeCachePath(builderCacheRoot);
    if (!await (0, fs_extra_1.pathExists)(resolvedRoot)) {
        await (0, fs_extra_1.ensureDir)(resolvedRoot);
        return;
    }
    const resolvedSkipRoots = uniquePaths(skipRoots);
    async function clearDir(dir) {
        const entries = await (0, fs_extra_1.readdir)(dir);
        await Promise.all(entries.map(async (entry) => {
            const current = (0, path_1.join)(dir, entry);
            const resolvedCurrent = (0, path_1.resolve)(current);
            if (resolvedSkipRoots.some((skipRoot) => containsPath(skipRoot, resolvedCurrent))) {
                return;
            }
            const stats = await (0, fs_extra_1.lstat)(current);
            if (stats.isDirectory()) {
                await clearDir(current);
                return;
            }
            if ((0, path_1.extname)(current) === '.log') {
                return;
            }
            await (0, fs_extra_1.remove)(current);
            cleared.push(current);
        }));
    }
    await clearDir(resolvedRoot);
}
async function clearProjectCache() {
    const cleared = [];
    const assetCacheRoot = getProjectAssetCacheRoot();
    const legacyAssetCacheRoot = getLegacyProjectAssetCacheRoot();
    await clearProjectAssetBuildCache(assetCacheRoot, cleared);
    if ((0, path_1.resolve)(legacyAssetCacheRoot) !== (0, path_1.resolve)(assetCacheRoot)) {
        await clearProjectAssetBuildCache(legacyAssetCacheRoot, cleared);
    }
    await clearProjectBuilderCache(getProjectBuilderCacheRoot(), [assetCacheRoot, legacyAssetCacheRoot], cleared);
    return cleared;
}
async function clearGlobalCache() {
    const cleared = [];
    for (const cacheRoot of uniquePaths(getGlobalCacheRoots())) {
        const resolvedRoot = assertSafeCachePath(cacheRoot);
        await (0, fs_extra_1.emptyDir)(resolvedRoot);
        cleared.push(resolvedRoot);
    }
    return cleared;
}
async function clearCache(scope) {
    if (scope !== 'project' && scope !== 'global' && scope !== 'all') {
        throw new Error(`Invalid builder cache scope: ${scope}`);
    }
    const cleared = scope === 'project'
        ? await clearProjectCache()
        : scope === 'global'
            ? await clearGlobalCache()
            : [
                ...await clearProjectCache(),
                ...await clearGlobalCache(),
            ];
    return {
        scope,
        cleared,
    };
}
