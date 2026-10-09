"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fbxToGlTf = fbxToGlTf;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = require("path");
const fbx2glTf_1 = require("../utils/fbx2glTf");
const tmp_1 = __importDefault(require("tmp"));
const utils_1 = require("../../utils");
async function fbxToGlTf(asset, assetDB, version) {
    const tmpDirDir = assetDB.options.temp;
    const tmpDir = (0, path_1.join)(tmpDirDir, `fbx2gltf-${asset.uuid}`);
    await fs_extra_1.default.ensureDir(tmpDir);
    const destPath = (0, path_1.join)(tmpDir, 'out', 'out.gltf');
    const statusFilePath = (0, path_1.join)(tmpDir, 'status.json');
    const expectedStatus = {
        mtimeMs: (await fs_extra_1.default.stat(asset.source)).mtimeMs,
        version,
    };
    try {
        if (await fs_extra_1.default.pathExists(statusFilePath)) {
            const conversionStatus = JSON.parse((await fs_extra_1.default.readFile(statusFilePath)).toString());
            if (isSameConversionStatus(conversionStatus, expectedStatus) && (await fs_extra_1.default.pathExists(destPath))) {
                return destPath;
            }
        }
    }
    catch {
        console.debug(`Failed to get conversion status file ${statusFilePath}`);
    }
    if (await fs_extra_1.default.pathExists(tmpDir)) {
        await fs_extra_1.default.emptyDir(tmpDir);
    }
    const tempDirGenerators = [
        () => (0, path_1.join)(tmpDir, 'fbm'),
        () => {
            const tmpDirResult = tmp_1.default.dirSync({
                mode: 777,
                prefix: 'fbm',
            });
            return tmpDirResult.name;
        },
    ];
    let fbxTempDir = null;
    for (const tempDirGenerator of tempDirGenerators) {
        const str = tempDirGenerator();
        // eslint-disable-next-line no-control-regex
        if (/^[\x00-\x7F]*$/.test(str)) {
            fbxTempDir = str;
            break;
        }
    }
    if (!fbxTempDir) {
        throw new Error((0, utils_1.i18nTranslate)('importer.fbx.no_available_fbx_temp_dir'));
    }
    await fs_extra_1.default.ensureDir(fbxTempDir);
    const extraOptions = ['--fbx-temp-dir', fbxTempDir];
    await fs_extra_1.default.ensureDir((0, path_1.dirname)(destPath));
    await (0, fbx2glTf_1.convert)(asset.source, destPath, extraOptions);
    if (fs_extra_1.default.existsSync(destPath)) {
        console.debug(`${asset.source} is converted to: ${destPath}`);
        await fs_extra_1.default.writeFile(statusFilePath, JSON.stringify(expectedStatus, undefined, 2));
        return destPath;
    }
    throw new Error((0, utils_1.i18nTranslate)('importer.fbx.failed_to_convert_fbx_file', {
        path: asset.source,
    }));
}
function isSameConversionStatus(lhs, rhs) {
    return lhs.mtimeMs === rhs.mtimeMs && lhs.version === rhs.version;
}
