"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.modelConvertRoutine = modelConvertRoutine;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
/**
 * @param converterId
 * @param asset
 * @param assetDB
 * @param version
 * @param converter
 */
async function modelConvertRoutine(converterId, asset, assetDB, version, converter) {
    const workspace = path_1.default.join(assetDB.options.temp, converterId, asset.uuid);
    await fs_extra_1.default.ensureDir(workspace);
    const sourceTimeStamp = (await fs_extra_1.default.stat(asset.source)).mtimeMs;
    const statusFile = path_1.default.join(workspace, 'status.json');
    let oldStatus;
    try {
        oldStatus = await fs_extra_1.default.readJson(statusFile);
    }
    catch (err) {
        console.debug(`Status file ${statusFile}: ${err}`);
    }
    const outputDir = path_1.default.join(workspace, 'output');
    await fs_extra_1.default.ensureDir(outputDir);
    const converterOptions = converter.options;
    const isCacheAvailable = oldStatus !== undefined &&
        oldStatus.version === version &&
        oldStatus.sourceTimeStamp === sourceTimeStamp &&
        validateOptions(converterOptions, oldStatus.options) &&
        (await isOutputTimeStampsAvailable(outputDir, oldStatus.outputTimeStamps));
    if (!isCacheAvailable) {
        await fs_extra_1.default.emptyDir(outputDir);
        const ok = await converter.convert(asset, outputDir);
        if (!ok) {
            return;
        }
        const outputTimeStamps = {};
        await getMtimeTree(outputDir, outputTimeStamps);
        const status = {
            version,
            sourceTimeStamp,
            outputTimeStamps,
            options: converterOptions,
        };
        await fs_extra_1.default.ensureDir(path_1.default.dirname(statusFile));
        await fs_extra_1.default.writeJson(statusFile, status, { spaces: 2 });
    }
    await converter.printLogs?.(asset, outputDir);
    return await converter.get(asset, outputDir);
}
async function getMtimeTree(baseDir, record, prefix = undefined) {
    const items = await fs_extra_1.default.readdir(baseDir);
    await Promise.all(items.map(async (item) => {
        const file = path_1.default.join(baseDir, item);
        const stat = await fs_extra_1.default.stat(file);
        const key = prefix ? `${prefix}/${item}` : item;
        if (stat.isFile()) {
            record[key] = stat.mtimeMs;
        }
        else if (stat.isDirectory()) {
            await getMtimeTree(file, record, key);
        }
    }));
}
async function isOutputTimeStampsAvailable(baseDir, record) {
    return (await Promise.all(Object.entries(record).map(async ([key, mTimeMs]) => {
        const file = path_1.default.join(baseDir, path_1.default.join(...key.split('/')));
        try {
            const stat = await fs_extra_1.default.stat(file);
            return stat.mtimeMs === mTimeMs;
        }
        catch {
            return false;
        }
    }))).every((b) => b);
}
function validateOptions(newOptions, oldOptions) {
    return matchObject(newOptions, oldOptions);
}
function matchObject(lhs, rhs) {
    return matchLhs(lhs, rhs);
    function matchLhs(lhs, rhs) {
        if (Array.isArray(lhs)) {
            return Array.isArray(rhs) && lhs.length === rhs.length && lhs.every((v, i) => matchLhs(v, rhs[i]));
        }
        else if (typeof lhs === 'object' && lhs !== null) {
            return (typeof rhs === 'object' && rhs !== null && Object.keys(lhs).every((key) => matchLhs(lhs[key], rhs[key])));
        }
        else if (lhs === null) {
            return rhs === null;
        }
        else {
            return lhs === rhs;
        }
    }
}
