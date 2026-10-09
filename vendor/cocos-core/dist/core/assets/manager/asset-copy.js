"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.copyAssetSource = copyAssetSource;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const utils_1 = __importDefault(require("../../base/utils"));
const filesystem_1 = require("./filesystem");
const JSON_ASSET_EXTENSIONS = new Set([
    '.json',
    '.scene',
    '.fire',
    '.prefab',
    '.mtl',
    '.pmtl',
    '.anim',
    '.animgraph',
    '.animgraphvari',
    '.animask',
    '.texture',
    '.cubemap',
    '.rt',
    '.gltf',
    '.pac',
    '.labelatlas',
    '.rpp',
    '.stg',
    '.flow',
]);
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function collectMetaUuidMap(meta, nextUuid, uuidMap) {
    if (typeof meta.uuid !== 'string' || !meta.uuid) {
        throw new Error('Asset meta is missing a valid uuid');
    }
    uuidMap.set(meta.uuid, nextUuid);
    if (!isRecord(meta.subMetas)) {
        return;
    }
    for (const [key, value] of Object.entries(meta.subMetas)) {
        if (!isRecord(value)) {
            continue;
        }
        const subId = typeof value.id === 'string' && value.id ? value.id : key;
        collectMetaUuidMap(value, `${nextUuid}@${subId}`, uuidMap);
    }
}
function replaceMappedUuids(value, uuidMap) {
    if (typeof value === 'string') {
        return uuidMap.get(value) ?? value;
    }
    if (Array.isArray(value)) {
        return value.map((item) => replaceMappedUuids(item, uuidMap));
    }
    if (!isRecord(value)) {
        return value;
    }
    const result = {};
    for (const [key, item] of Object.entries(value)) {
        const mappedKey = uuidMap.get(key) ?? key;
        result[mappedKey] = replaceMappedUuids(item, uuidMap);
    }
    return result;
}
function replaceMappedJsonStrings(content, uuidMap) {
    try {
        JSON.parse(content);
    }
    catch {
        return null;
    }
    let rewritten = content;
    let changed = false;
    for (const [sourceUuid, targetUuid] of uuidMap) {
        const sourceJsonString = JSON.stringify(sourceUuid);
        if (!rewritten.includes(sourceJsonString)) {
            continue;
        }
        rewritten = rewritten.split(sourceJsonString).join(JSON.stringify(targetUuid));
        changed = true;
    }
    return changed ? rewritten : null;
}
async function collectNestedMetaPaths(directory, paths) {
    for (const name of await (0, fs_extra_1.readdir)(directory)) {
        const path = (0, path_1.join)(directory, name);
        const pathStat = await (0, fs_extra_1.stat)(path);
        if (pathStat.isDirectory()) {
            await collectNestedMetaPaths(path, paths);
        }
        else if (name.endsWith('.meta')) {
            paths.push(path);
        }
    }
}
async function collectMetaCopyEntries(source) {
    const metaPaths = [];
    const sourceMeta = `${source}.meta`;
    if (!(0, fs_extra_1.existsSync)(sourceMeta)) {
        throw new Error(`Cannot copy asset because its meta file does not exist: ${sourceMeta}`);
    }
    metaPaths.push(sourceMeta);
    if ((await (0, fs_extra_1.stat)(source)).isDirectory()) {
        await collectNestedMetaPaths(source, metaPaths);
    }
    const entries = await Promise.all(metaPaths.map(async (metaPath) => {
        const content = await (0, filesystem_1.readPath)(metaPath, 'utf8');
        let meta;
        try {
            meta = JSON.parse(typeof content === 'string' ? content : content.toString('utf8'));
        }
        catch (error) {
            throw new Error(`Cannot copy asset because meta file is invalid: ${metaPath}`, { cause: error });
        }
        if (!isRecord(meta)) {
            throw new Error(`Cannot copy asset because meta file is invalid: ${metaPath}`);
        }
        return {
            relativePath: metaPath === sourceMeta ? null : (0, path_1.relative)(source, metaPath),
            meta,
        };
    }));
    return { entries, paths: metaPaths };
}
async function collectAssetContentCopyEntries(source, metaPaths, uuidMap) {
    const entries = [];
    for (const metaPath of metaPaths) {
        const assetPath = metaPath.slice(0, -'.meta'.length);
        if (!(0, fs_extra_1.existsSync)(assetPath) || (await (0, fs_extra_1.stat)(assetPath)).isDirectory()) {
            continue;
        }
        if (!JSON_ASSET_EXTENSIONS.has((0, path_1.extname)(assetPath).toLowerCase())) {
            continue;
        }
        const content = await (0, filesystem_1.readPath)(assetPath, 'utf8');
        const text = typeof content === 'string' ? content : content.toString('utf8');
        const rewritten = replaceMappedJsonStrings(text, uuidMap);
        if (rewritten === null) {
            continue;
        }
        entries.push({
            relativePath: assetPath === source ? null : (0, path_1.relative)(source, assetPath),
            content: rewritten,
        });
    }
    return entries;
}
function resolveMetaTarget(root, relativePath) {
    return relativePath === null ? `${root}.meta` : (0, path_1.join)(root, relativePath);
}
function resolveAssetTarget(root, relativePath) {
    return relativePath === null ? root : (0, path_1.join)(root, relativePath);
}
async function removePathIfExists(path) {
    if ((0, fs_extra_1.existsSync)(path)) {
        await (0, filesystem_1.deletePath)(path, { useTrash: false });
    }
}
async function runCleanupSteps(steps, message) {
    const errors = [];
    for (const step of steps) {
        try {
            await step();
        }
        catch (error) {
            errors.push(error);
        }
    }
    if (errors.length) {
        const details = errors.map((error) => error instanceof Error ? error.message : String(error)).join('; ');
        throw new Error(`${message}: ${details}`, { cause: errors[0] });
    }
}
/**
 * Copy an asset source into a hidden staging path, install it as one transaction,
 * and rebuild UUIDs in both metadata and supported serialized asset files.
 */
async function copyAssetSource(source, target, options) {
    const { entries: metaEntries, paths: metaPaths } = await collectMetaCopyEntries(source);
    const uuidMap = new Map();
    for (const entry of metaEntries) {
        collectMetaUuidMap(entry.meta, utils_1.default.UUID.generate(false), uuidMap);
    }
    const rewrittenMetas = metaEntries.map((entry) => ({
        relativePath: entry.relativePath,
        content: `${JSON.stringify(replaceMappedUuids(entry.meta, uuidMap), null, 2)}\n`,
    }));
    const rewrittenAssets = await collectAssetContentCopyEntries(source, metaPaths, uuidMap);
    const transactionId = utils_1.default.UUID.generate(false);
    const targetDirectory = (0, path_1.dirname)(target);
    const targetName = (0, path_1.basename)(target);
    const staging = (0, path_1.join)(targetDirectory, `.${targetName}.copy-asset-${transactionId}`);
    const backup = (0, path_1.join)(targetDirectory, `.${targetName}.copy-backup-${transactionId}`);
    const targetMeta = `${target}.meta`;
    const stagingMeta = `${staging}.meta`;
    const backupMeta = `${backup}.meta`;
    const targetExists = (0, fs_extra_1.existsSync)(target);
    const targetMetaExists = (0, fs_extra_1.existsSync)(targetMeta);
    if ((targetExists || targetMetaExists) && !options?.overwrite) {
        throw new Error(`file ${target} already exists, please use overwrite option to overwrite it.`);
    }
    try {
        await (0, filesystem_1.copyPath)(source, staging, { overwrite: false });
        for (const entry of rewrittenMetas) {
            await (0, filesystem_1.writePath)(resolveMetaTarget(staging, entry.relativePath), entry.content);
        }
        for (const entry of rewrittenAssets) {
            await (0, filesystem_1.writePath)(resolveAssetTarget(staging, entry.relativePath), entry.content);
        }
    }
    catch (error) {
        try {
            await runCleanupSteps([
                () => removePathIfExists(staging),
                () => removePathIfExists(stagingMeta),
            ], `Failed to clean staging copy ${staging} for ${target}`);
        }
        catch (cleanupError) {
            const cleanupMessage = cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
            throw new Error(`Copy asset to ${target} failed and staging cleanup also failed: ${cleanupMessage}`, { cause: error });
        }
        throw error;
    }
    let backupMoved = false;
    let backupMetaMoved = false;
    let targetInstalled = false;
    let targetMetaInstalled = false;
    const restoreFailedCommit = async () => {
        await runCleanupSteps([
            async () => {
                if (targetInstalled) {
                    await removePathIfExists(target);
                }
            },
            async () => {
                if (targetMetaInstalled) {
                    await removePathIfExists(targetMeta);
                }
            },
            async () => {
                if (backupMetaMoved && (0, fs_extra_1.existsSync)(backupMeta)) {
                    await (0, filesystem_1.renamePath)(backupMeta, targetMeta, { overwrite: true });
                }
            },
            async () => {
                if (backupMoved && (0, fs_extra_1.existsSync)(backup)) {
                    await (0, filesystem_1.renamePath)(backup, target, { overwrite: true });
                }
            },
            () => removePathIfExists(staging),
            () => removePathIfExists(stagingMeta),
        ], `Failed to roll back copy to ${target}`);
    };
    try {
        if (targetMetaExists) {
            await (0, filesystem_1.renamePath)(targetMeta, backupMeta, { overwrite: false });
            backupMetaMoved = true;
        }
        if (targetExists) {
            await (0, filesystem_1.renamePath)(target, backup, { overwrite: false });
            backupMoved = true;
        }
        await (0, filesystem_1.renamePath)(stagingMeta, targetMeta, { overwrite: false });
        targetMetaInstalled = true;
        await (0, filesystem_1.renamePath)(staging, target, { overwrite: false });
        targetInstalled = true;
    }
    catch (error) {
        try {
            await restoreFailedCommit();
        }
        catch (rollbackError) {
            const rollbackMessage = rollbackError instanceof Error ? rollbackError.message : String(rollbackError);
            throw new Error(`Copy asset to ${target} failed and rollback also failed: ${rollbackMessage}`, { cause: error });
        }
        throw error;
    }
    let active = true;
    return {
        async finalize() {
            if (!active) {
                return;
            }
            await runCleanupSteps([
                () => removePathIfExists(backup),
                () => removePathIfExists(backupMeta),
            ], `Failed to clean copy backup ${backup} for ${target}`);
            active = false;
        },
        async rollback() {
            if (!active) {
                return;
            }
            await runCleanupSteps([
                () => removePathIfExists(target),
                () => removePathIfExists(targetMeta),
                async () => {
                    if (backupMetaMoved && (0, fs_extra_1.existsSync)(backupMeta)) {
                        await (0, filesystem_1.renamePath)(backupMeta, targetMeta, { overwrite: true });
                    }
                },
                async () => {
                    if (backupMoved && (0, fs_extra_1.existsSync)(backup)) {
                        await (0, filesystem_1.renamePath)(backup, target, { overwrite: true });
                    }
                },
                () => removePathIfExists(staging),
                () => removePathIfExists(stagingMeta),
            ], `Failed to roll back copy to ${target}`);
            active = false;
        },
    };
}
