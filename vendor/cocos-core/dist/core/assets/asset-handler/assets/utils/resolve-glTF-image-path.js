"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveGlTfImagePath = resolveGlTfImagePath;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
/**
 * 解析 glTF 图像的真实路径。
 * @param imageName 图像资源名。
 * @param expectedPath 图像期望的绝对路径。
 * @param glTFDir glTF 文件所在路径。
 * @param extras glTF 图像的 extras。
 * @param jail Locks the search within specified path.
 */
async function resolveGlTfImagePath(imageName, expectedPath, glTFDir, extras, jail) {
    if (expectedPath && (await fs_extra_1.default.pathExists(expectedPath))) {
        // 如果原始路径本身就存在，就直接使用该路径。
        return expectedPath;
    }
    let fbxGlTfConvImageExtrasFileName = '';
    let fbxGlTfConvImageExtrasRelativeFileName = '';
    if (typeof extras === 'object' && keyFbxGlTfConvImageExtras in extras) {
        console.debug(`Found FBX-glTF-conv specified extras: ${JSON.stringify(extras[keyFbxGlTfConvImageExtras], undefined, 2)}`);
        const { fileName, relativeFileName } = extras[keyFbxGlTfConvImageExtras];
        if (relativeFileName) {
            fbxGlTfConvImageExtrasRelativeFileName = normalizePathInFbx(relativeFileName);
        }
        if (fileName) {
            fbxGlTfConvImageExtrasFileName = normalizePathInFbx(fileName);
        }
    }
    if (fbxGlTfConvImageExtrasRelativeFileName) {
        const path = path_1.default.join(glTFDir, fbxGlTfConvImageExtrasRelativeFileName);
        if (await fs_extra_1.default.pathExists(path)) {
            return path;
        }
    }
    if (fbxGlTfConvImageExtrasFileName && (await fs_extra_1.default.pathExists(fbxGlTfConvImageExtrasFileName))) {
        return fbxGlTfConvImageExtrasFileName;
    }
    // Try find texture.
    console.debug('Image' + `(Name: ${imageName}, Expected path: ${expectedPath})` + ' is not found, fuzzy search starts.');
    const expectedExtName = expectedPath ? path_1.default.extname(expectedPath) : '';
    const expectedExtNameLower = expectedExtName.toLowerCase();
    const expectedBaseName = expectedPath ? path_1.default.basename(expectedPath, expectedExtName) : '';
    // 查找的 baseName。
    const searchBaseNames = new Set();
    if (expectedBaseName.length !== 0) {
        searchBaseNames.add(expectedBaseName);
    }
    if (imageName) {
        searchBaseNames.add(imageName);
    }
    if (fbxGlTfConvImageExtrasFileName) {
        searchBaseNames.add(path_1.default.basename(fbxGlTfConvImageExtrasFileName, path_1.default.extname(fbxGlTfConvImageExtrasFileName)));
    }
    if (fbxGlTfConvImageExtrasRelativeFileName) {
        searchBaseNames.add(path_1.default.basename(fbxGlTfConvImageExtrasRelativeFileName, path_1.default.extname(fbxGlTfConvImageExtrasRelativeFileName)));
    }
    if (searchBaseNames.size === 0) {
        return null;
    }
    // 查找的扩展名。
    const searchExtensions = ['.jpg', '.jpeg', '.png', '.tga', '.webp'];
    if (expectedExtName.length !== 0 && !searchExtensions.includes(expectedExtNameLower)) {
        searchExtensions.unshift(expectedExtNameLower);
    }
    // 查找的文件夹。
    const searchDirectories = ['textures', 'materials'];
    // 查找的深度。
    const maxDepth = 2;
    const normalizedJail = toNormalizedAbsolute(jail);
    const isInJail = (p) => {
        return p.startsWith(normalizedJail);
    };
    const searchBaseNamesArray = Array.from(searchBaseNames);
    let baseDir = toNormalizedAbsolute(glTFDir);
    for (let i = 0; i < maxDepth && isInJail(baseDir); ++i) {
        const result = await fuzzySearchTexture(baseDir, searchBaseNamesArray, searchExtensions);
        if (result) {
            console.debug(`Found ${result}, use it.`);
            return result;
        }
        const items = await fs_extra_1.default.readdir(baseDir);
        for (const item of items) {
            if (!searchDirectories.some((searchDir) => caseInsensitiveStringEqual(item, searchDir))) {
                continue;
            }
            const dir = path_1.default.join(baseDir, item);
            try {
                const stat = await fs_extra_1.default.stat(dir);
                if (!stat.isDirectory()) {
                    continue;
                }
            }
            catch { }
            const result = await fuzzySearchTexture(dir, searchBaseNamesArray, searchExtensions);
            if (result) {
                console.debug(`Found ${result}, use it.`);
                return result;
            }
        }
        baseDir = path_1.default.dirname(baseDir);
    }
    const expectedFileNames = [];
    for (const ext of searchExtensions) {
        for (const baseName of searchBaseNamesArray) {
            expectedFileNames.push(`${baseName}${ext}`.toLowerCase());
        }
    }
    for (const path of listFile(glTFDir)) {
        const baseName = path_1.default.basename(path).toLowerCase();
        if (expectedFileNames.includes(baseName)) {
            return path;
        }
    }
    console.debug('Fuzzy search failed.');
    return null;
}
function* listFile(directory) {
    const dirItems = fs_extra_1.default.readdirSync(directory);
    for (const dirItem of dirItems) {
        const fullPath = path_1.default.join(directory, dirItem);
        const stats = fs_extra_1.default.statSync(fullPath);
        if (stats.isFile()) {
            yield fullPath;
        }
        else if (stats.isDirectory()) {
            yield* listFile(fullPath);
        }
    }
}
function toNormalizedAbsolute(p) {
    const np = path_1.default.isAbsolute(p) ? p : path_1.default.join(process.cwd(), p);
    return path_1.default.normalize(np);
}
async function fuzzySearchTexture(directory, baseNames, extensions) {
    if (!(await fs_extra_1.default.pathExists(directory))) {
        return null;
    }
    const dirItems = await fs_extra_1.default.readdir(directory);
    for (const dirItem of dirItems) {
        const extName = path_1.default.extname(dirItem);
        const baseName = path_1.default.basename(dirItem, extName);
        if (!baseNames.some((item) => caseInsensitiveStringEqual(baseName, item))) {
            continue;
        }
        const fullName = path_1.default.join(directory, dirItem);
        const stat = await fs_extra_1.default.stat(fullName);
        if (!stat.isFile()) {
            continue;
        }
        if (extensions.indexOf(extName.toLowerCase()) >= 0) {
            return fullName;
        }
    }
    return null;
}
function caseInsensitiveStringEqual(a, b) {
    return a.length === b.length && a.toLowerCase() === b.toLowerCase();
}
const keyFbxGlTfConvImageExtras = 'FBX-glTF-conv';
function normalizePathInFbx(path) {
    return path.split(/[\\/]/g).join(path_1.default.sep);
}
