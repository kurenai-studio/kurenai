"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onAfterUpload = exports.onBeforeUpload = void 0;
exports.onBeforeInit = onBeforeInit;
exports.fetchPackageContext = fetchPackageContext;
exports.onAfterInit = onAfterInit;
exports.onBeforeBundleInit = onBeforeBundleInit;
exports.onAfterBundleDataTask = onAfterBundleDataTask;
exports.onBeforeCopyBuildTemplate = onBeforeCopyBuildTemplate;
exports.make = make;
exports.upload = upload;
exports.resolveAppId = resolveAppId;
exports.resolveAccessToken = resolveAccessToken;
exports.normalizeCodeVersion = normalizeCodeVersion;
exports.resolveUploadBaseUrl = resolveUploadBaseUrl;
exports.computeFileMd5 = computeFileMd5;
exports.getContextGameInfo = getContextGameInfo;
exports.publish = publish;
const path_1 = require("path");
const child_process_1 = __importDefault(require("child_process"));
const crypto_1 = require("crypto");
const fs_extra_1 = __importStar(require("fs-extra"));
const ejs_1 = __importDefault(require("ejs"));
const share_1 = require("./share");
const config_1 = require("./config");
const upload_1 = require("./upload");
// Upload-stage hooks live in ./upload; re-export them so the builder can still
// resolve them from this hooks module. See src/upload.ts for the implementation.
var upload_2 = require("./upload");
Object.defineProperty(exports, "onBeforeUpload", { enumerable: true, get: function () { return upload_2.onBeforeUpload; } });
Object.defineProperty(exports, "onAfterUpload", { enumerable: true, get: function () { return upload_2.onAfterUpload; } });
Object.defineProperty(exports, "run", { enumerable: true, get: function () { return upload_2.run; } });
const PRIVATE_KEY_CACHE_DIR = 'package-private-keys';
// 构建流程相关钩子函数参阅 https://github.com/cocos-creator/3d-tasks/blob/master/editor-docs/package/builder/index/build-process.jpg
// creator 构建初始化之前调用，将这些设置注入到 options 中
/**
 * Runs before Creator initializes the build and prepares OpenPaaS game/package context.
 */
async function onBeforeInit(options) {
    await ensureGameAndPackageContext(options);
}
/**
 * Fetches package context from OpenPaaS v2 and writes signing context fields back to package options.
 */
async function fetchPackageContext(options) {
    const packageOptions = options.packages[share_1.PLATFORM_NAME];
    const gameId = resolveAppId(packageOptions);
    const accessToken = resolveAccessToken(packageOptions);
    const uploadEnv = normalizeUploadEnv(packageOptions.uploadEnv) || 'prod';
    if (!gameId) {
        throw new Error('Missing appid, cannot fetch OpenPaaS package context');
    }
    if (!accessToken) {
        throw new Error('Missing OpenPaaS access token. Pass accessToken in build options.');
    }
    packageOptions.accessToken = accessToken;
    packageOptions.uploadEnv = uploadEnv;
    const baseUrl = resolveUploadBaseUrl(packageOptions);
    const packagesInfo = resolvePackageContextPackagesInfo(options);
    const subPackageNames = packagesInfo.subPackages.map((subpackage) => subpackage.name);
    console.log(`[openpaas-context] Fetch package context: game_id=${gameId}, env=${uploadEnv}`);
    const result = await postOpenPaasJson(baseUrl, accessToken, uploadEnv, '/api/game/package/context', {
        game_id: gameId,
        include_sp_package: packagesInfo.subPackages.length > 0,
        include_web_package: !!packageOptions.enableWebBuild,
        sub_package_names: subPackageNames,
        generate_new_package_key: true,
    });
    const data = result.data || {};
    if (!data.context || !data.context_signature || !data.public_key) {
        throw new Error('OpenPaaS package context response is incomplete');
    }
    const privatePemPath = savePackagePrivateKeyFile(options, data);
    packageOptions.context = data.context;
    packageOptions.context_ordered_json = data.context_ordered_json || JSON.stringify(sortJsonKeys(data.context)).replace(/\\/g, '/');
    packageOptions.context_signature = data.context_signature;
    packageOptions.context_signature_version = data.context_signature_version === undefined ? '' : String(data.context_signature_version);
    packageOptions.public_key = data.public_key;
    packageOptions.privatePemPath = privatePemPath;
    if (data.package_id) {
        packageOptions.package_id = String(data.package_id);
    }
    const codeVersion = normalizeCodeVersion(getContextGameInfo(data.context).code_version);
    if (codeVersion) {
        packageOptions.codeVersion = codeVersion;
    }
    console.log(`[openpaas-context] Package context updated: game_id=${gameId}, code_version=${codeVersion || '(empty)'}`);
}
/**
 * Ensures a game id exists first, then ensures the package context required by make/upload exists.
 */
async function ensureGameAndPackageContext(options) {
    const packageOptions = options.packages[share_1.PLATFORM_NAME];
    if (!resolveAppId(packageOptions)) {
        await createOpenPaasGame(options);
    }
    await fetchPackageContext(options);
}
/**
 * Creates an OpenPaaS game through the service and saves the returned appid into package options.
 */
async function createOpenPaasGame(options) {
    const packageOptions = options.packages[share_1.PLATFORM_NAME];
    const accessToken = resolveAccessToken(packageOptions);
    const uploadEnv = normalizeUploadEnv(packageOptions.uploadEnv) || 'prod';
    if (!accessToken) {
        throw new Error('Missing OpenPaaS access token. Pass accessToken in build options.');
    }
    packageOptions.accessToken = accessToken;
    packageOptions.uploadEnv = uploadEnv;
    const baseUrl = resolveUploadBaseUrl(packageOptions);
    // 与 build-config-host.ts 中 normalizeGameName 逻辑保持一致:仅取 name,空则回退 'Cocos Game'
    const gameName = String(options.name || '').trim() || 'Cocos Game';
    console.log(`[openpaas-create-game] Create game: name=${gameName}, env=${uploadEnv} accessToken=${accessToken}`);
    const result = await postOpenPaasJson(baseUrl, accessToken, uploadEnv, '/api/game/create', {
        name: gameName,
        engine: 'pink',
    });
    const gameId = String(result.data?.game_id || '').trim();
    if (!gameId) {
        throw new Error('OpenPaaS create game response is incomplete');
    }
    packageOptions.appid = gameId;
    saveLastCreatedAppId(gameId);
    console.log(`[openpaas-create-game] Create game success: game_id=${gameId}`);
}
// 构建流程相关钩子函数参阅 https://github.com/cocos-creator/3d-tasks/blob/master/editor-docs/package/builder/index/build-process.jpg
// creator 构建初始化之后调用，存在平台设置会影响到 creator 构建的参数，将这些设置注入到
/**
 * Runs after build initialization and injects OpenPaaS-specific build flags.
 */
async function onAfterInit(options, result, cache) {
    options.generateCompileConfig = true;
    options.moveRemoteBundleScript = true;
    if (options.server && !options.server.endsWith('/')) {
        options.server += '/';
    }
    // 添加统计信息
    const packageOptions = options.packages[share_1.PLATFORM_NAME];
    options.buildScriptParam.flags.WASM_SUBPACKAGE = packageOptions.wasmSubpackage && !packageOptions.separateEngine;
    // 注入一些改变引擎编译的参数
    if (packageOptions.separateEngine) {
        options.buildEngineParam.separateEngineOptions = {
            pluginFeatures: 'all',
            outputLocalPlugin: true,
            pluginName: share_1.ENGINE_PLUGIN_NAME,
        };
        options.buildEngineParam.nativeCodeBundleMode = 'asmjs';
    }
    // 解析后续构建阶段：未传递 nextStages 或为空数组时，回退到 config.ts 中配置的默认值
    if (!Array.isArray(options.nextStages) || (options.nextStages && options.nextStages.length === 0)) {
        const defaultBuildStages = config_1.config.commonOptions?.buildStageGroup?.default?.build;
        options.nextStages = Array.isArray(defaultBuildStages) && defaultBuildStages.length > 0 ? defaultBuildStages : ['make', 'upload'];
    }
}
/**
 * Normalizes bundle build options before bundle initialization for the OpenPaaS runtime.
 */
function onBeforeBundleInit(options) {
    if (options.polyfills) {
        options.polyfills.asyncFunctions = false;
    }
    options.moveRemoteBundleScript = true;
    options.buildScriptParam.system = { preset: 'commonjs-like' };
}
/**
 * Rewrites subpackage bundle output paths and records OpenPaaS subpackage metadata.
 */
async function onAfterBundleDataTask(options, bundles, cache) {
    const subpackages = [];
    bundles.forEach((bundle) => {
        if (bundle.isSubpackage) {
            // 修改构建配置
            bundle.dest = (0, path_1.join)((0, path_1.dirname)(options.dest), share_1.subpackagePrefix + bundle.name, bundle.name);
            bundle.scriptDest = (0, path_1.join)(bundle.dest, share_1.MAIN_JS_NAME);
            const name = `${share_1.subpackagePrefix}${bundle.name}`;
            subpackages.push({
                name,
                root: `${bundle.name}/`,
            });
        }
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    subpackages.length && (options.packages[share_1.PLATFORM_NAME].subpackages = subpackages);
}
/**
 * Copies the configured platform icon into the build output and excludes it from md5 replacement.
 */
async function handleIconName(options, result, realRoot) {
    const packagesOptions = options.packages[share_1.PLATFORM_NAME];
    const imagePath = (0, path_1.join)(realRoot, share_1.ICON_NAME + (0, path_1.extname)(packagesOptions.icon));
    // 判断游戏过程里 image 目录是否存在
    (0, fs_extra_1.ensureDirSync)((0, path_1.dirname)(imagePath));
    // 添加应用图标
    (0, fs_extra_1.copyFileSync)((0, path_1.join)(__dirname, packagesOptions.icon), imagePath);
    options.md5CacheOptions.excludes.push(share_1.ICON_NAME + (0, path_1.extname)(packagesOptions.icon));
}
/**
 * Generates runtime adapter files, main.js, icon, and game.config.json before template copy finishes.
 */
async function onBeforeCopyBuildTemplate(options, result, cache) {
    const buildDestDir = result.paths.dir;
    // gulp runtime adapter
    await _generate_adapter(options, buildDestDir);
    const gameEjsTemplate = this.buildTemplate.initUrl('main.ejs') || (0, path_1.join)(__dirname, '../static/build-template/main.ejs');
    // generate main.js
    await _render_main_js(this, gameEjsTemplate, options, result);
    // 添加应用图标
    await handleIconName(options, result, buildDestDir);
    // game.config.json 配置信息写入（做了数据融合需要在模板拷贝之后处理）
    _generate_game_config_json(buildDestDir, options, result);
}
/**
 * Reads the web child-platform list supported by OpenPaaS from registered plugin config.
 */
function getOpenPaasSupportPlatforms() {
    const platforms = config_1.config.supportPlatforms?.platforms;
    return Array.isArray(platforms) ? platforms : [];
}
/**
 * Temporarily moves child web build directories out of the OpenPaaS root before signing the main package.
 */
function moveOpenPaasMainPackageExcludedDirs(root) {
    const temporaryRoot = (0, path_1.join)((0, path_1.dirname)(root), `__OpenPaaS_main_package_excludes_${process.pid}_${Date.now()}`);
    const movedDirs = [];
    for (const name of getOpenPaasSupportPlatforms()) {
        const source = (0, path_1.join)(root, name);
        if (!fs_extra_1.default.existsSync(source) || !fs_extra_1.default.statSync(source).isDirectory()) {
            continue;
        }
        if (!movedDirs.length) {
            (0, fs_extra_1.emptyDirSync)(temporaryRoot);
        }
        const temporary = (0, path_1.join)(temporaryRoot, name);
        fs_extra_1.default.moveSync(source, temporary, { overwrite: true });
        movedDirs.push({ name, source, temporary });
        console.log(`[openpaas-make] Exclude ${name} from main package`);
    }
    return movedDirs;
}
/**
 * Moves temporarily excluded child web build directories back to their original locations.
 */
function restoreOpenPaasMainPackageExcludedDirs(movedDirs) {
    for (let index = movedDirs.length - 1; index >= 0; index--) {
        const item = movedDirs[index];
        if (!fs_extra_1.default.existsSync(item.temporary)) {
            continue;
        }
        fs_extra_1.default.moveSync(item.temporary, item.source, { overwrite: true });
    }
    if (movedDirs.length) {
        const temporaryRoot = (0, path_1.dirname)(movedDirs[0].temporary);
        if (fs_extra_1.default.existsSync(temporaryRoot)) {
            (0, fs_extra_1.removeSync)(temporaryRoot);
        }
    }
}
/**
 * Signs and encrypts OpenPaaS main package and subpackages, then stores package paths/md5 in build output.
 */
async function make(root, options) {
    const toolPath = (0, path_1.join)(__dirname, '../' + share_1.TOOLS_NAME);
    const { useDebugKey, privatePemPath, subpackages, appid, versionName, encryptKey, context, context_signature, public_key } = options.packages[share_1.PLATFORM_NAME];
    // 签名处理
    const distPath = (0, path_1.join)(root, 'dist');
    (0, fs_extra_1.mkdirsSync)(distPath);
    const destPath = (0, path_1.join)(distPath, options.name + '.sp');
    const context_ordered_json = JSON.stringify(sortJsonKeys(context)).replace(/\\/g, '/');
    const publicKeyHash = normalizeString(getContextGameInfo(context).public_key_hash);
    const packagesJson = { mainPackage: '', md5: '', subPackages: [] };
    // 验证 context 和 context_signature 是否有效
    await handleVerify(toolPath, context_ordered_json, context_signature, public_key);
    // 签名加密子包
    console.log(`[openpaas-make] Sign sub-packages: ${subpackages?.length || 0}`);
    if (subpackages) {
        for (let index = 0; index < subpackages.length; index++) {
            const subpackage = subpackages[index];
            const subpackagePath = (0, path_1.join)(distPath, subpackage.name + '.sp');
            const folderPath = (0, path_1.join)(root, subpackage.name);
            await handleSign(toolPath, folderPath, useDebugKey, privatePemPath, subpackagePath, 3, appid, versionName, encryptKey, publicKeyHash);
            await (0, fs_extra_1.removeSync)(folderPath);
            packagesJson.subPackages.push({
                name: subpackage.name,
                path: subpackagePath,
                md5: computeFileMd5(subpackagePath),
                size: fs_extra_1.default.statSync(subpackagePath).size,
            });
        }
    }
    // 签名加密主包
    let subpackagesTmpDir = '';
    if (subpackages && packagesJson.subPackages.length > 0) {
        subpackagesTmpDir = (0, path_1.join)((0, path_1.dirname)(root), `__OpenPaaS_subpackages_sp_tmp_${process.pid}_${options.name}`);
        (0, fs_extra_1.emptyDirSync)(subpackagesTmpDir);
        for (const pkg of packagesJson.subPackages) {
            const spPath = pkg.path;
            if (typeof spPath !== 'string') {
                continue;
            }
            fs_extra_1.default.moveSync(spPath, (0, path_1.join)(subpackagesTmpDir, (0, path_1.basename)(spPath)), { overwrite: true });
        }
    }
    const excludedDirs = moveOpenPaasMainPackageExcludedDirs(root);
    try {
        await handleSign(toolPath, root, useDebugKey, privatePemPath, destPath, 2, appid, versionName, encryptKey, publicKeyHash);
    }
    finally {
        restoreOpenPaasMainPackageExcludedDirs(excludedDirs);
    }
    if (subpackagesTmpDir) {
        for (const pkg of packagesJson.subPackages) {
            const spPath = pkg.path;
            if (typeof spPath !== 'string') {
                continue;
            }
            const movedFrom = (0, path_1.join)(subpackagesTmpDir, (0, path_1.basename)(spPath));
            if (fs_extra_1.default.existsSync(movedFrom)) {
                fs_extra_1.default.moveSync(movedFrom, spPath, { overwrite: true });
            }
        }
        (0, fs_extra_1.removeSync)(subpackagesTmpDir);
    }
    packagesJson.mainPackage = destPath;
    packagesJson.md5 = computeFileMd5(destPath);
    this.buildExitRes.custom.packagesJson = packagesJson;
}
const UPLOAD_BASE_URLS = {
    dev: 'https://dev-agent-api.s00.tech',
    fat: 'https://fat-agent-api.s00.tech',
    prod: 'https://cn-000-agent-api.s01.tech',
};
/**
 * Uploads the signed OpenPaaS packages. Delegates the two-phase direct-upload
 * flow (presigned URLs → object-storage PUT → service confirm, plus retry /
 * progress / abort handling) to src/upload.ts.
 */
async function upload(root, options) {
    await (0, upload_1.runUpload)(this, root, options);
}
/**
 * Normalizes the OpenPaaS appid value from platform options.
 */
function resolveAppId(options) {
    return String(options.appid || '').trim();
}
/**
 * Resolves the OpenPaaS access token from options first, then environment variables.
 */
function resolveAccessToken(options) {
    return String(options.accessToken || process.env.OPENPAAS_ACCESS_TOKEN || process.env.SUD_ACCESS_TOKEN || '').trim();
}
/**
 * Converts an unknown value to a trimmed non-empty string.
 */
function normalizeString(value) {
    if (value === undefined || value === null) {
        return undefined;
    }
    const normalized = String(value).trim();
    return normalized || undefined;
}
/**
 * Extracts normalized OpenPaaS subpackage names from package options.
 */
function getSubPackageNames(options) {
    return Array.isArray(options.subpackages)
        ? options.subpackages.map((subpackage) => String(subpackage.name || '').trim()).filter(Boolean)
        : [];
}
/**
 * Builds lightweight package context metadata before package files exist.
 */
function resolvePackageContextPackagesInfo(options) {
    return {
        subPackages: getSubPackageNames(options.packages[share_1.PLATFORM_NAME]).map((name) => ({ name })),
    };
}
/**
 * Sends a JSON POST request to OpenPaaS and normalizes transport/API errors.
 */
async function postOpenPaasJson(baseUrl, accessToken, uploadEnv, apiPath, body) {
    const response = await fetch(`${baseUrl}${apiPath}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-sud-at': accessToken,
            'x-sud-encrypt-request': 'true',
        },
        body: JSON.stringify(body),
    });
    const responseBody = await response.text();
    if (!response.ok) {
        throw new Error(`OpenPaaS request failed: ${apiPath}, env=${uploadEnv}, HTTP ${response.status}${responseBody ? `, body=${responseBody.slice(0, 1000)}` : ''}`);
    }
    let result;
    try {
        result = JSON.parse(responseBody);
    }
    catch (error) {
        throw new Error(`OpenPaaS response is not valid JSON: ${apiPath}, env=${uploadEnv}, reason=${error instanceof Error ? error.message : String(error)}`);
    }
    if (result.ret_code !== 0) {
        throw new Error(`OpenPaaS API error: ${apiPath}, env=${uploadEnv}, code=${result.ret_code}, message=${result.ret_msg}`);
    }
    return result;
}
/**
 * Converts a code version value to a trimmed string when present.
 */
function normalizeCodeVersion(value) {
    if (value === undefined || value === null) {
        return undefined;
    }
    const normalized = String(value).trim();
    return normalized || undefined;
}
/**
 * Resolves the OpenPaaS API base URL from explicit config, environment variables, or upload environment.
 */
function resolveUploadBaseUrl(options) {
    const customBaseUrl = String(options.uploadBaseUrl || process.env.OPENPAAS_UPLOAD_BASE_URL || '').trim();
    if (customBaseUrl) {
        return customBaseUrl.replace(/\/$/, '');
    }
    const env = normalizeUploadEnv(options.uploadEnv)
        ?? normalizeUploadEnv(process.env.OPENPAAS_UPLOAD_ENV)
        ?? normalizeUploadEnv(process.env.SUD_UPLOAD_ENV)
        ?? 'prod';
    return UPLOAD_BASE_URLS[env];
}
/**
 * Validates and normalizes an upload environment value.
 */
function normalizeUploadEnv(value) {
    return value === 'dev' || value === 'fat' || value === 'prod' ? value : undefined;
}
/**
 * Computes the md5 digest (hex) for a package file.
 * Corresponds to Java `MessageDigest.getInstance("MD5")` and is used for the
 * internal confirm APIs (`/api/game/package/direct/upload`,
 * `/api/game/package/direct/sub/upload`) which expect an md5 hex string.
 * For the PUT `Content-MD5` header (base64), see `calculateFileMd5Base64`.
 */
function computeFileMd5(filePath) {
    const buffer = (0, fs_extra_1.readFileSync)(filePath);
    return (0, crypto_1.createHash)('md5').update(buffer).digest('hex');
}
/**
 * Safely reads the game_info object from OpenPaaS package context.
 */
function getContextGameInfo(context) {
    const gameInfo = context?.game_info;
    return gameInfo && typeof gameInfo === 'object' && !Array.isArray(gameInfo) ? gameInfo : {};
}
/**
 * Extracts the per-package private key returned by the v2 package context API.
 */
function resolvePackagePrivateKey(data) {
    return normalizeString(data.package_private_key)
        ?? normalizeString(getContextGameInfo(data.context).package_private_key);
}
/**
 * Saves the v2 package private key to a temp file and returns the file path used by --private-key.
 */
function savePackagePrivateKeyFile(options, data) {
    const packagePrivateKey = resolvePackagePrivateKey(data);
    if (!packagePrivateKey) {
        throw new Error('OpenPaaS package context response is missing package_private_key');
    }
    const packageOptions = options.packages[share_1.PLATFORM_NAME];
    const keyPath = resolvePackagePrivateKeyFilePath(options, data, packagePrivateKey);
    (0, fs_extra_1.outputFileSync)(keyPath, packagePrivateKey.replace(/^\uFEFF/, ''), 'utf8');
    try {
        fs_extra_1.default.chmodSync(keyPath, 0o600);
    }
    catch {
        // chmod may be unsupported on some Windows file systems; the key path is still usable.
    }
    packageOptions.privatePemPath = keyPath;
    return keyPath;
}
/**
 * Builds a deterministic temp file path for the package private key without leaking key content.
 */
function resolvePackagePrivateKeyFilePath(options, data, packagePrivateKey) {
    const packageOptions = options.packages[share_1.PLATFORM_NAME];
    const gameId = sanitizeFileNameSegment(resolveAppId(packageOptions), 'game');
    const packageId = sanitizeFileNameSegment(data.package_id, 'package');
    const codeVersion = sanitizeFileNameSegment(normalizeCodeVersion(getContextGameInfo(data.context).code_version), 'version');
    const keyHash = (0, crypto_1.createHash)('sha256').update(packagePrivateKey).digest('hex').slice(0, 12);
    return (0, path_1.join)(__dirname, '..', share_1.TOOLS_NAME, PRIVATE_KEY_CACHE_DIR, gameId, `${packageId}_${codeVersion}_${keyHash}.key`);
}
const LAST_APPID_FILE = (0, path_1.join)(__dirname, '..', share_1.TOOLS_NAME, PRIVATE_KEY_CACHE_DIR, 'last-appid.json');
/**
 * Persists the most recently created OpenPaaS appid so the build view can
 * restore it as the default selection. Reuses the same tools/ cache dir as
 * the package private keys.
 */
function saveLastCreatedAppId(gameId) {
    const normalized = String(gameId || '').trim();
    if (!normalized) {
        return;
    }
    (0, fs_extra_1.ensureDirSync)((0, path_1.dirname)(LAST_APPID_FILE));
    (0, fs_extra_1.outputFileSync)(LAST_APPID_FILE, JSON.stringify({ appid: normalized, savedAt: new Date().toISOString() }, null, 2), 'utf8');
    try {
        fs_extra_1.default.chmodSync(LAST_APPID_FILE, 0o600);
    }
    catch {
        // chmod may be unsupported on some Windows file systems; the file is still usable.
    }
}
/**
 * Normalizes a value into a filesystem-safe filename segment.
 */
function sanitizeFileNameSegment(value, fallback) {
    return (normalizeString(value) || fallback)
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
        .slice(0, 80) || fallback;
}
/**
 * Recursively sorts JSON object keys to produce stable signing payload text.
 */
function sortJsonKeys(obj) {
    // 1. 如果是 null 或 undefined，直接返回
    if (obj === null || typeof obj === 'undefined') {
        return obj;
    }
    // 2. 如果是数组，递归排序每个元素
    if (Array.isArray(obj)) {
        return obj.map(item => sortJsonKeys(item));
    }
    // 3. 如果是对象，按 key 字母顺序排序，再递归值
    if (typeof obj === 'object') {
        return Object.keys(obj)
            .sort() // 🔥 核心：按字母顺序排序 key
            .reduce((sortedObj, key) => {
            sortedObj[key] = sortJsonKeys(obj[key]);
            return sortedObj;
        }, {});
    }
    // 4. 字符串/数字/布尔，直接返回
    return obj;
}
/**
 * Verifies package context signature by invoking the SUD package sign tool.
 */
async function handleVerify(root, context, context_signature, public_key) {
    const args = [];
    if (context && context_signature && public_key) {
        args.push('--verify-payload', context);
        args.push('--verify-signature', context_signature);
        args.push('--verify-public-key', public_key);
    }
    await runSudSignTool(root, args);
    return 'verify success';
}
/**
 * Signs and optionally encrypts one OpenPaaS package directory with the SUD package sign tool.
 */
async function handleSign(root, inputPath, useDebugKey, privateKeyPath, outputName, type = 2, appId, appver, encryptKey, publicKeyHash) {
    const args = [];
    args.push('--compress', 'deflate');
    if (encryptKey) {
        args.push('--encrypt');
        args.push('--global-key', encryptKey);
    }
    if (publicKeyHash) {
        args.push('--public-key-hash', publicKeyHash);
    }
    if (!useDebugKey) {
        args.push('--private-key', privateKeyPath);
    }
    if (type === 3) {
        args.push('--input', inputPath, '--output', outputName, '--type', type.toString(), '--game-id', appId, '--app-version', appver);
    }
    else if (type === 2) {
        args.push('--input', inputPath, '--output', outputName);
    }
    await runSudSignTool(root, args);
    return outputName;
}
/**
 * Spawns the platform-specific SUD package sign tool and returns its combined output.
 */
async function runSudSignTool(root, args) {
    return new Promise((resolve, reject) => {
        try {
            const toolsPath = process.platform === 'win32' ? (0, path_1.join)(root, 'sud-package-sign-tool.exe') : (0, path_1.join)(root, 'sud-package-sign-tool');
            console.log(`[openpaas-make] Run sud package sign tool: ${toolsPath}`);
            const child = child_process_1.default.spawn(toolsPath, args, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
            let output = '';
            if (child.stdout) {
                child.stdout.on('data', (data) => (output += data));
            }
            if (child.stderr) {
                child.stderr.on('data', (data) => (output += data));
            }
            child.on('error', reject);
            child.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`sud-tool exit code: ${code} errMsg: ${output}`));
                }
                else {
                    resolve(output);
                }
            });
        }
        catch (error) {
            reject(error);
        }
    });
}
/**
 * gulp runtime adapter
 * @param options
 * @param BuildDest
 */
/**
 * Copies OpenPaaS runtime adapter scripts into the build output.
 */
async function _generate_adapter(options, BuildDest) {
    const adapterRootSrc = (0, path_1.join)(__dirname, 'adapter/');
    const adapterRootDest = (0, path_1.join)(BuildDest, 'runtime-adapter');
    //engine-adapter.js
    const engineAdapterSrc = (0, path_1.join)(adapterRootSrc, `engine-adapter${options.debug ? '' : '.min'}.js`);
    const engineAdapterDest = (0, path_1.join)(adapterRootDest, `engine-adapter.js`);
    fs_extra_1.default.copySync(engineAdapterSrc, engineAdapterDest);
    //web-adapter.js
    const webAdapterSrc = (0, path_1.join)(adapterRootSrc, `web-adapter${options.debug ? '' : '.min'}.js`);
    const webAdapterDest = (0, path_1.join)(adapterRootDest, `web-adapter.js`);
    fs_extra_1.default.copySync(webAdapterSrc, webAdapterDest);
    // ral.js
    const jsbSrc = (0, path_1.join)(adapterRootSrc, `ral${options.debug ? '' : '.min'}.js`);
    const jsbDest = (0, path_1.join)(adapterRootDest, `ral.js`);
    fs_extra_1.default.copySync(jsbSrc, jsbDest);
    options.md5CacheOptions.includes.push('runtime-adapter/*.js');
}
/**
 * Renders the OpenPaaS main.js launcher from the configured EJS template.
 */
async function _render_main_js(builder, gameEjsTemplate, options, result) {
    const paths = result.paths;
    const buildDestDir = paths.dir;
    const mainRenderData = {
        optionDebug: options.debug,
        polyfillsBundleFile: (paths.polyfillsJs && builder.utils.relativeUrl(buildDestDir, paths.polyfillsJs)) || false,
        systemJsBundleFile: builder.utils.relativeUrl(buildDestDir, paths.systemJs),
        importMapFile: builder.utils.relativeUrl(buildDestDir, paths.importMap),
        // 横屏为 0 竖屏为 1 number
        orientationNum: options.packages[share_1.PLATFORM_NAME].deviceOrientation === 'landscape' ? 0 : 1,
        applicationJs: './' + builder.utils.relativeUrl(buildDestDir, paths.applicationJS),
    };
    const contents = await ejs_1.default.renderFile(gameEjsTemplate, mainRenderData);
    fs_extra_1.default.writeFileSync((0, path_1.join)(buildDestDir, 'main.js'), String(contents));
    options.md5CacheOptions.replaceOnly.push('main.js');
}
/**
 * Writes game.config.json consumed by the OpenPaaS runtime.
 */
function _generate_game_config_json(destDir, options, result) {
    const platformSetting = options.packages[share_1.PLATFORM_NAME];
    const jsonObj = {
        gameId: platformSetting.appid,
        networkTimeout: platformSetting.networkTimeout,
        version: platformSetting.versionName,
        deviceOrientation: platformSetting.deviceOrientation,
        permissions: platformSetting.permissions,
        minRuntimeVersion: platformSetting.minRuntimeVersion,
        keyPath: platformSetting.privatePemPath,
        plugins: platformSetting.plugins,
        workers: platformSetting.workers,
        context: platformSetting.context,
        context_signature: platformSetting.context_signature,
        extensions: {
            versionCode: platformSetting.versionCode,
            icon: platformSetting.icon,
            minPlatformVersion: platformSetting.minPlatformVersion,
            fullScreen: platformSetting.fullScreen,
            backgroundColor: platformSetting.backgroundColor,
        },
    };
    // subpackages
    if (options.packages[share_1.PLATFORM_NAME].subpackages) {
        jsonObj.subpackages = options.packages[share_1.PLATFORM_NAME].subpackages;
    }
    const dest = (0, path_1.join)(destDir, share_1.CONFIG_NAME);
    fs_extra_1.default.writeJSONSync(dest, jsonObj);
    options.md5CacheOptions.excludes.push(share_1.CONFIG_NAME);
}
async function publish(task, platform, root, options) {
    console.log(`[web-publish] Publish start: platform=${platform}, root=${root}`);
    // TODO: call the real publish/release API with packageId
    // console.log(`[web-publish] Publish success: packageId=${packageId}`);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG9va3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaG9va3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBa0dBLG9DQUVDO0FBS0Qsa0RBZ0RDO0FBZ0RELGtDQTJCQztBQUtELGdEQU9DO0FBS0Qsc0RBZ0JDO0FBa0JELDhEQWFDO0FBc0RELG9CQWlFQztBQWFELHdCQUVDO0FBS0Qsb0NBRUM7QUFLRCxnREFFQztBQXNFRCxvREFNQztBQUtELG9EQVVDO0FBZ0JELHdDQUdDO0FBS0QsZ0RBR0M7QUE0UEQsMEJBS0M7QUEveUJELCtCQUF3RDtBQUN4RCxrRUFBeUM7QUFDekMsbUNBQW9DO0FBQ3BDLHFEQVFrQjtBQUVsQiw4Q0FBdUI7QUFrQnZCLG1DQVFpQjtBQUNqQixxQ0FBb0Q7QUFDcEQscUNBQXFDO0FBRXJDLCtFQUErRTtBQUMvRSxpRkFBaUY7QUFDakYsbUNBQThEO0FBQXJELHdHQUFBLGNBQWMsT0FBQTtBQUFFLHVHQUFBLGFBQWEsT0FBQTtBQUFFLDZGQUFBLEdBQUcsT0FBQTtBQWdCM0MsTUFBTSxxQkFBcUIsR0FBRyxzQkFBc0IsQ0FBQztBQWdDckQseUhBQXlIO0FBQ3pILHVDQUF1QztBQUN2Qzs7R0FFRztBQUNJLEtBQUssVUFBVSxZQUFZLENBQUMsT0FBb0I7SUFDbkQsTUFBTSwyQkFBMkIsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUMvQyxDQUFDO0FBRUQ7O0dBRUc7QUFDSSxLQUFLLFVBQVUsbUJBQW1CLENBQUMsT0FBb0I7SUFDMUQsTUFBTSxjQUFjLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxxQkFBYSxDQUFDLENBQUM7SUFFdkQsTUFBTSxNQUFNLEdBQUcsWUFBWSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0lBQzVDLE1BQU0sV0FBVyxHQUFHLGtCQUFrQixDQUFDLGNBQWMsQ0FBQyxDQUFDO0lBQ3ZELE1BQU0sU0FBUyxHQUFHLGtCQUFr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O0lBQ2QsSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDLHFCQUFhLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUM5QyxPQUFPLENBQUMsV0FBVyxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMscUJBQWEsQ0FBQyxDQUFDLFdBQVcsQ0FBQztJQUN0RSxDQUFDO0lBQ0QsTUFBTSxJQUFJLEdBQUcsSUFBQSxXQUFJLEVBQUMsT0FBTyxFQUFFLG1CQUFXLENBQUMsQ0FBQztJQUN4QyxrQkFBRyxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDakMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLG1CQUFXLENBQUMsQ0FBQztBQUN2RCxDQUFDO0FBRU0sS0FBSyxVQUFVLE9BQU8sQ0FBQyxJQUFxQixFQUFFLFFBQWdCLEVBQUUsSUFBWSxFQUFFLE9BQW9CO0lBQ3JHLE9BQU8sQ0FBQyxHQUFHLENBQUMseUNBQXlDLFFBQVEsVUFBVSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQzNFLHlEQUF5RDtJQUV6RCx3RUFBd0U7QUFDaEYsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGJhc2VuYW1lLCBkaXJuYW1lLCBleHRuYW1lLCBqb2luIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgY2hpbGRQcm9jZXNzIGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuaW1wb3J0IHsgY3JlYXRlSGFzaCB9IGZyb20gJ2NyeXB0byc7XG5pbXBvcnQgX0ZTLCB7XG4gICAgZW1wdHlEaXJTeW5jLFxuICAgIGVuc3VyZURpclN5bmMsXG4gICAgY29weUZpbGVTeW5jLFxuICAgIG1rZGlyc1N5bmMsXG4gICAgcmVtb3ZlU3luYyxcbiAgICByZWFkRmlsZVN5bmMsXG4gICAgb3V0cHV0RmlsZVN5bmMsXG59IGZyb20gJ2ZzLWV4dHJhJztcblxuaW1wb3J0IF9FSlMgZnJvbSAnZWpzJztcblxuaW1wb3J0IHR5cGUge1xuICAgIEJ1aWxkZXJDYWNoZSxcbiAgICBJbnRlcm5hbEJ1aWxkUmVzdWx0LFxuICAgIElCdW5kbGUsXG4gICAgSUJ1aWxkZXIsXG4gICAgSUJ1aWxkU3RhZ2VUYXNrLFxufSBmcm9tICdAY29jb3MvY29jb3MtY2xpLXR5cGVzL2J1aWxkZXInO1xuaW1wb3J0IHtcbiAgICBJVGFza09wdGlvbixcbiAgICBJT3B0aW9ucyxcbiAgICBVcGxvYWRFbnYsXG4gICAgT3BlblBhYXNSZXNwb25zZSxcbiAgICBVcGxvYWRQYWNrYWdlSW5mbyxcbiAgICBNYWtlUGFja2FnZXNJbmZvLFxuICAgIEpzb25PYmplY3QsXG59IGZyb20gJy4vdHlwZSc7XG5pbXBvcnQge1xuICAgIFBMQVRGT1JNX05BTUUsXG4gICAgSUNPTl9OQU1FLFxuICAgIENPTkZJR19OQU1FLFxuICAgIEVOR0lORV9QTFVHSU5fTkFNRSxcbiAgICBNQUlOX0pTX05BTUUsXG4gICAgc3VicGFja2FnZVByZWZpeCxcbiAgICBUT09MU19OQU1FLFxufSBmcm9tICcuL3NoYXJlJztcbmltcG9ydCB7IGNvbmZpZyBhcyBvcGVuUGFhc0NvbmZpZyB9IGZyb20gJy4vY29uZmlnJztcbmltcG9ydCB7IHJ1blVwbG9hZCB9IGZyb20gJy4vdXBsb2FkJztcblxuLy8gVXBsb2FkLXN0YWdlIGhvb2tzIGxpdmUgaW4gLi91cGxvYWQ7IHJlLWV4cG9ydCB0aGVtIHNvIHRoZSBidWlsZGVyIGNhbiBzdGlsbFxuLy8gcmVzb2x2ZSB0aGVtIGZyb20gdGhpcyBob29rcyBtb2R1bGUuIFNlZSBzcmMvdXBsb2FkLnRzIGZvciB0aGUgaW1wbGVtZW50YXRpb24uXG5leHBvcnQgeyBvbkJlZm9yZVVwbG9hZCwgb25BZnRlclVwbG9hZCwgcnVuIH0gZnJvbSAnLi91cGxvYWQnO1xuXG5pbnRlcmZhY2UgR2FtZVBhY2thZ2VDb250ZXh0UmVzcG9uc2Uge1xuICAgIHBhY2thZ2VfaWQ/OiBzdHJpbmc7XG4gICAgcGFja2FnZV9wcml2YXRlX2tleT86IHN0cmluZztcbiAgICBwdWJsaWNfa2V5Pzogc3RyaW5nO1xuICAgIGNvbnRleHQ/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcbiAgICBjb250ZXh0X29yZGVyZWRfanNvbj86IHN0cmluZztcbiAgICBjb250ZXh0X3NpZ25hdHVyZT86IHN0cmluZztcbiAgICBjb250ZXh0X3NpZ25hdHVyZV92ZXJzaW9uPzogc3RyaW5nIHwgbnVtYmVyO1xufVxuXG5pbnRlcmZhY2UgQ3JlYXRlR2FtZVJlc3BvbnNlIHtcbiAgICBnYW1lX2lkPzogc3RyaW5nO1xufVxuXG5jb25zdCBQUklWQVRFX0tFWV9DQUNIRV9ESVIgPSAncGFja2FnZS1wcml2YXRlLWtleXMnO1xuaW50ZXJmYWNlIFRlbXBvcmFyaWx5TW92ZWREaXIge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBzb3VyY2U6IHN0cmluZztcbiAgICB0ZW1wb3Jhcnk6IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIFBhY2thZ2VDb250ZXh0UGFja2FnZXNJbmZvIHtcbiAgICBzdWJQYWNrYWdlczogQXJyYXk8UGljazxVcGxvYWRQYWNrYWdlSW5mbywgJ25hbWUnPj47XG59XG5cbmludGVyZmFjZSBPcGVuUGFhc0dhbWVDb25maWcge1xuICAgIGdhbWVJZDogc3RyaW5nO1xuICAgIG5ldHdvcmtUaW1lb3V0OiBKc29uT2JqZWN0O1xuICAgIHZlcnNpb246IHN0cmluZztcbiAgICBkZXZpY2VPcmllbnRhdGlvbjogc3RyaW5nO1xuICAgIHBlcm1pc3Npb25zOiBzdHJpbmdbXTtcbiAgICBtaW5SdW50aW1lVmVyc2lvbjogc3RyaW5nO1xuICAgIGtleVBhdGg6IHN0cmluZztcbiAgICBwbHVnaW5zOiBzdHJpbmdbXTtcbiAgICB3b3JrZXJzOiBzdHJpbmc7XG4gICAgY29udGV4dDogSnNvbk9iamVjdDtcbiAgICBjb250ZXh0X3NpZ25hdHVyZTogc3RyaW5nO1xuICAgIGV4dGVuc2lvbnM6IHtcbiAgICAgICAgdmVyc2lvbkNvZGU6IHN0cmluZztcbiAgICAgICAgaWNvbjogc3RyaW5nO1xuICAgICAgICBtaW5QbGF0Zm9ybVZlcnNpb246IHN0cmluZztcbiAgICAgICAgZnVsbFNjcmVlbjogYm9vbGVhbjtcbiAgICAgICAgYmFja2dyb3VuZENvbG9yOiBzdHJpbmc7XG4gICAgfTtcbiAgICBzdWJwYWNrYWdlcz86IHsgbmFtZTogc3RyaW5nOyByb290OiBzdHJpbmcgfVtdO1xufVxuLy8g5p6E5bu65rWB56iL55u45YWz6ZKp5a2Q5Ye95pWw5Y+C6ZiFIGh0dHBzOi8vZ2l0aHViLmNvbS9jb2Nvcy1jcmVhdG9yLzNkLXRhc2tzL2Jsb2IvbWFzdGVyL2VkaXRvci1kb2NzL3BhY2thZ2UvYnVpbGRlci9pbmRleC9idWlsZC1wcm9jZXNzLmpwZ1xuLy8gY3JlYXRvciDmnoTlu7rliJ3lp4vljJbkuYvliY3osIPnlKjvvIzlsIbov5nkupvorr7nva7ms6jlhaXliLAgb3B0aW9ucyDkuK1cbi8qKlxuICogUnVucyBiZWZvcmUgQ3JlYXRvciBpbml0aWFsaXplcyB0aGUgYnVpbGQgYW5kIHByZXBhcmVzIE9wZW5QYWFTIGdhbWUvcGFja2FnZSBjb250ZXh0LlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gb25CZWZvcmVJbml0KG9wdGlvbnM6IElUYXNrT3B0aW9uKSB7XG4gICAgYXdhaXQgZW5zdXJlR2FtZUFuZFBhY2thZ2VDb250ZXh0KG9wdGlvbnMpO1xufVxuXG4vKipcbiAqIEZldGNoZXMgcGFja2FnZSBjb250ZXh0IGZyb20gT3BlblBhYVMgdjIgYW5kIHdyaXRlcyBzaWduaW5nIGNvbnRleHQgZmllbGRzIGJhY2sgdG8gcGFja2FnZSBvcHRpb25zLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZmV0Y2hQYWNrYWdlQ29udGV4dChvcHRpb25zOiBJVGFza09wdGlvbikge1xuICAgIGNvbnN0IHBhY2thZ2VPcHRpb25zID0gb3B0aW9ucy5wYWNrYWdlc1tQTEFURk9STV9OQU1FXTtcbiAgICBcbiAgICBjb25zdCBnYW1lSWQgPSByZXNvbHZlQXBwSWQocGFja2FnZU9wdGlvbnMpO1xuICAgIGNvbnN0IGFjY2Vzc1Rva2VuID0gcmVzb2x2ZUFjY2Vzc1Rva2VuKHBhY2thZ2VPcHRpb25zKTtcbiAgICBjb25zdCB1cGxvYWRFbnYgPSBub3JtYWxpemVVcGxvYWRFbnYocGFja2FnZU9wdGlvbnMudXBsb2FkRW52KSB8fCAncHJvZCc7XG4gICAgaWYgKCFnYW1lSWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNaXNzaW5nIGFwcGlkLCBjYW5ub3QgZmV0Y2ggT3BlblBhYVMgcGFja2FnZSBjb250ZXh0Jyk7XG4gICAgfVxuICAgIGlmICghYWNjZXNzVG9rZW4pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNaXNzaW5nIE9wZW5QYWFTIGFjY2VzcyB0b2tlbi4gUGFzcyBhY2Nlc3NUb2tlbiBpbiBidWlsZCBvcHRpb25zLicpO1xuICAgIH1cblxuICAgIHBhY2thZ2VPcHRpb25zLmFjY2Vzc1Rva2VuID0gYWNjZXNzVG9rZW47XG4gICAgcGFja2FnZU9wdGlvbnMudXBsb2FkRW52ID0gdXBsb2FkRW52O1xuICAgIGNvbnN0IGJhc2VVcmwgPSByZXNvbHZlVXBsb2FkQmFzZVVybChwYWNrYWdlT3B0aW9ucyk7XG4gICAgY29uc3QgcGFja2FnZXNJbmZvID0gcmVzb2x2ZVBhY2thZ2VDb250ZXh0UGFja2FnZXNJbmZvKG9wdGlvbnMpO1xuICAgIGNvbnN0IHN1YlBhY2thZ2VOYW1lcyA9IHBhY2thZ2VzSW5mby5zdWJQYWNrYWdlcy5tYXAoKHN1YnBhY2thZ2UpID0+IHN1YnBhY2thZ2UubmFtZSk7XG4gICAgY29uc29sZS5sb2coYFtvcGVucGFhcy1jb250ZXh0XSBGZXRjaCBwYWNrYWdlIGNvbnRleHQ6IGdhbWVfaWQ9JHtnYW1lSWR9LCBlbnY9JHt1cGxvYWRFbnZ9YCk7XG5cbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBwb3N0T3BlblBhYXNKc29uPEdhbWVQYWNrYWdlQ29udGV4dFJlc3BvbnNlPihiYXNlVXJsLCBhY2Nlc3NUb2tlbiwgdXBsb2FkRW52LCAnL2FwaS9nYW1lL3BhY2thZ2UvY29udGV4dCcsIHtcbiAgICAgICAgZ2FtZV9pZDogZ2FtZUlkLFxuICAgICAgICBpbmNsdWRlX3NwX3BhY2thZ2U6IHBhY2thZ2VzSW5mby5zdWJQYWNrYWdlcy5sZW5ndGggPiAwLFxuICAgICAgICBpbmNsdWRlX3dlYl9wYWNrYWdlOiAhIXBhY2thZ2VPcHRpb25zLmVuYWJsZVdlYkJ1aWxkLFxuICAgICAgICBzdWJfcGFja2FnZV9uYW1lczogc3ViUGFja2FnZU5hbWVzLFxuICAgICAgICBnZW5lcmF0ZV9uZXdfcGFja2FnZV9rZXk6IHRydWUsXG4gICAgfSk7XG5cbiAgICBjb25zdCBkYXRhID0gcmVzdWx0LmRhdGEgfHwge307XG4gICAgaWYgKCFkYXRhLmNvbnRleHQgfHwgIWRhdGEuY29udGV4dF9zaWduYXR1cmUgfHwgIWRhdGEucHVibGljX2tleSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ09wZW5QYWFTIHBhY2thZ2UgY29udGV4dCByZXNwb25zZSBpcyBpbmNvbXBsZXRlJyk7XG4gICAgfVxuICAgIGNvbnN0IHByaXZhdGVQZW1QYXRoID0gc2F2ZVBhY2thZ2VQcml2YXRlS2V5RmlsZShvcHRpb25zLCBkYXRhKTtcblxuICAgIHBhY2thZ2VPcHRpb25zLmNvbnRleHQgPSBkYXRhLmNvbnRleHQ7XG4gICAgcGFja2FnZU9wdGlvbnMuY29udGV4dF9vcmRlcmVkX2pzb24gPSBkYXRhLmNvbnRleHRfb3JkZXJlZF9qc29uIHx8IEpTT04uc3RyaW5naWZ5KHNvcnRKc29uS2V5cyhkYXRhLmNvbnRleHQpKS5yZXBsYWNlKC9cXFxcL2csICcvJyk7XG4gICAgcGFja2FnZU9wdGlvbnMuY29udGV4dF9zaWduYXR1cmUgPSBkYXRhLmNvbnRleHRfc2lnbmF0dXJlO1xuICAgIHBhY2thZ2VPcHRpb25zLmNvbnRleHRfc2lnbmF0dXJlX3ZlcnNpb24gPSBkYXRhLmNvbnRleHRfc2lnbmF0dXJlX3ZlcnNpb24gPT09IHVuZGVmaW5lZCA/ICcnIDogU3RyaW5nKGRhdGEuY29udGV4dF9zaWduYXR1cmVfdmVyc2lvbik7XG4gICAgcGFja2FnZU9wdGlvbnMucHVibGljX2tleSA9IGRhdGEucHVibGljX2tleTtcbiAgICBwYWNrYWdlT3B0aW9ucy5wcml2YXRlUGVtUGF0aCA9IHByaXZhdGVQZW1QYXRoO1xuICAgIGlmIChkYXRhLnBhY2thZ2VfaWQpIHtcbiAgICAgICAgcGFja2FnZU9wdGlvbnMucGFja2FnZV9pZCA9IFN0cmluZyhkYXRhLnBhY2thZ2VfaWQpO1xuICAgIH1cbiAgICBjb25zdCBjb2RlVmVyc2lvbiA9IG5vcm1hbGl6ZUNvZGVWZXJzaW9uKGdldENvbnRleHRHYW1lSW5mbyhkYXRhLmNvbnRleHQpLmNvZGVfdmVyc2lvbik7XG4gICAgaWYgKGNvZGVWZXJzaW9uKSB7XG4gICAgICAgIHBhY2thZ2VPcHRpb25zLmNvZGVWZXJzaW9uID0gY29kZVZlcnNpb247XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKGBbb3BlbnBhYXMtY29udGV4dF0gUGFja2FnZSBjb250ZXh0IHVwZGF0ZWQ6IGdhbWVfaWQ9JHtnYW1lSWR9LCBjb2RlX3ZlcnNpb249JHtjb2RlVmVyc2lvbiB8fCAnKGVtcHR5KSd9YCk7XG59XG5cbi8qKlxuICogRW5zdXJlcyBhIGdhbWUgaWQgZXhpc3RzIGZpcnN0LCB0aGVuIGVuc3VyZXMgdGhlIHBhY2thZ2UgY29udGV4dCByZXF1aXJlZCBieSBtYWtlL3VwbG9hZCBleGlzdHMuXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGVuc3VyZUdhbWVBbmRQYWNrYWdlQ29udGV4dChvcHRpb25zOiBJVGFza09wdGlvbikge1xuICAgIGNvbnN0IHBhY2thZ2VPcHRpb25zID0gb3B0aW9ucy5wYWNrYWdlc1tQTEFURk9STV9OQU1FXTtcbiAgICBpZiAoIXJlc29sdmVBcHBJZChwYWNrYWdlT3B0aW9ucykpIHtcbiAgICAgICAgYXdhaXQgY3JlYXRlT3BlblBhYXNHYW1lKG9wdGlvbnMpO1xuICAgIH1cbiAgICBhd2FpdCBmZXRjaFBhY2thZ2VDb250ZXh0KG9wdGlvbnMpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gT3BlblBhYVMgZ2FtZSB0aHJvdWdoIHRoZSBzZXJ2aWNlIGFuZCBzYXZlcyB0aGUgcmV0dXJuZWQgYXBwaWQgaW50byBwYWNrYWdlIG9wdGlvbnMuXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGNyZWF0ZU9wZW5QYWFzR2FtZShvcHRpb25zOiBJVGFza09wdGlvbikge1xuICAgIGNvbnN0IHBhY2thZ2VPcHRpb25zID0gb3B0aW9ucy5wYWNrYWdlc1tQTEFURk9STV9OQU1FXTtcbiAgICBjb25zdCBhY2Nlc3NUb2tlbiA9IHJlc29sdmVBY2Nlc3NUb2tlbihwYWNrYWdlT3B0aW9ucyk7XG4gICAgY29uc3QgdXBsb2FkRW52ID0gbm9ybWFsaXplVXBsb2FkRW52KHBhY2thZ2VPcHRpb25zLnVwbG9hZEVudikgfHwgJ3Byb2QnO1xuICAgIGlmICghYWNjZXNzVG9rZW4pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNaXNzaW5nIE9wZW5QYWFTIGFjY2VzcyB0b2tlbi4gUGFzcyBhY2Nlc3NUb2tlbiBpbiBidWlsZCBvcHRpb25zLicpO1xuICAgIH1cblxuICAgIHBhY2thZ2VPcHRpb25zLmFjY2Vzc1Rva2VuID0gYWNjZXNzVG9rZW47XG4gICAgcGFja2FnZU9wdGlvbnMudXBsb2FkRW52ID0gdXBsb2FkRW52O1xuICAgIGNvbnN0IGJhc2VVcmwgPSByZXNvbHZlVXBsb2FkQmFzZVVybChwYWNrYWdlT3B0aW9ucyk7XG4gICAgLy8g5LiOIGJ1aWxkLWNvbmZpZy1ob3N0LnRzIOS4rSBub3JtYWxpemVHYW1lTmFtZSDpgLvovpHkv53mjIHkuIDoh7Q65LuF5Y+WIG5hbWUs56m65YiZ5Zue6YCAICdDb2NvcyBHYW1lJ1xuICAgIGNvbnN0IGdhbWVOYW1lID0gU3RyaW5nKG9wdGlvbnMubmFtZSB8fCAnJykudHJpbSgpIHx8ICdDb2NvcyBHYW1lJztcbiAgICBjb25zb2xlLmxvZyhgW29wZW5wYWFzLWNyZWF0ZS1nYW1lXSBDcmVhdGUgZ2FtZTogbmFtZT0ke2dhbWVOYW1lfSwgZW52PSR7dXBsb2FkRW52fSBhY2Nlc3NUb2tlbj0ke2FjY2Vzc1Rva2VufWApO1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHBvc3RPcGVuUGFhc0pzb248Q3JlYXRlR2FtZVJlc3BvbnNlPihiYXNlVXJsLCBhY2Nlc3NUb2tlbiwgdXBsb2FkRW52LCAnL2FwaS9nYW1lL2NyZWF0ZScsIHtcbiAgICAgICAgbmFtZTogZ2FtZU5hbWUsXG4gICAgICAgIGVuZ2luZTogJ3BpbmsnLFxuICAgIH0pO1xuICAgIGNvbnN0IGdhbWVJZCA9IFN0cmluZyhyZXN1bHQuZGF0YT8uZ2FtZV9pZCB8fCAnJykudHJpbSgpO1xuICAgIGlmICghZ2FtZUlkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignT3BlblBhYVMgY3JlYXRlIGdhbWUgcmVzcG9uc2UgaXMgaW5jb21wbGV0ZScpO1xuICAgIH1cbiAgICBwYWNrYWdlT3B0aW9ucy5hcHBpZCA9IGdhbWVJZDtcbiAgICBzYXZlTGFzdENyZWF0ZWRBcHBJZChnYW1lSWQpO1xuICAgIGNvbnNvbGUubG9nKGBbb3BlbnBhYXMtY3JlYXRlLWdhbWVdIENyZWF0ZSBnYW1lIHN1Y2Nlc3M6IGdhbWVfaWQ9JHtnYW1lSWR9YCk7XG59XG5cbi8vIOaehOW7uua1geeoi+ebuOWFs+mSqeWtkOWHveaVsOWPgumYhSBodHRwczovL2dpdGh1Yi5jb20vY29jb3MtY3JlYXRvci8zZC10YXNrcy9ibG9iL21hc3Rlci9lZGl0b3ItZG9jcy9wYWNrYWdlL2J1aWxkZXIvaW5kZXgvYnVpbGQtcHJvY2Vzcy5qcGdcbi8vIGNyZWF0b3Ig5p6E5bu65Yid5aeL5YyW5LmL5ZCO6LCD55So77yM5a2Y5Zyo5bmz5Y+w6K6+572u5Lya5b2x5ZON5YiwIGNyZWF0b3Ig5p6E5bu655qE5Y+C5pWw77yM5bCG6L+Z5Lqb6K6+572u5rOo5YWl5YiwXG4vKipcbiAqIFJ1bnMgYWZ0ZXIgYnVpbGQgaW5pdGlhbGl6YXRpb24gYW5kIGluamVjdHMgT3BlblBhYVMtc3BlY2lmaWMgYnVpbGQgZmxhZ3MuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBvbkFmdGVySW5pdChvcHRpb25zOiBJVGFza09wdGlvbiwgcmVzdWx0OiBJbnRlcm5hbEJ1aWxkUmVzdWx0LCBjYWNoZTogQnVpbGRlckNhY2hlKSB7XG5cbiAgICBvcHRpb25zLmdlbmVyYXRlQ29tcGlsZUNvbmZpZyA9IHRydWU7XG4gICAgb3B0aW9ucy5tb3ZlUmVtb3RlQnVuZGxlU2NyaXB0ID0gdHJ1ZTtcblxuICAgIGlmIChvcHRpb25zLnNlcnZlciAmJiAhb3B0aW9ucy5zZXJ2ZXIuZW5kc1dpdGgoJy8nKSkge1xuICAgICAgICBvcHRpb25zLnNlcnZlciArPSAnLyc7XG4gICAgfVxuXG4gICAgLy8g5re75Yqg57uf6K6h5L+h5oGvXG4gICAgY29uc3QgcGFja2FnZU9wdGlvbnMgPSBvcHRpb25zLnBhY2thZ2VzW1BMQVRGT1JNX05BTUVdO1xuICAgIG9wdGlvbnMuYnVpbGRTY3JpcHRQYXJhbS5mbGFncy5XQVNNX1NVQlBBQ0tBR0UgPSBwYWNrYWdlT3B0aW9ucy53YXNtU3VicGFja2FnZSAmJiAhcGFja2FnZU9wdGlvbnMuc2VwYXJhdGVFbmdpbmU7XG4gICAgLy8g5rOo5YWl5LiA5Lqb5pS55Y+Y5byV5pOO57yW6K+R55qE5Y+C5pWwXG4gICAgaWYgKHBhY2thZ2VPcHRpb25zLnNlcGFyYXRlRW5naW5lKSB7XG4gICAgICAgIG9wdGlvbnMuYnVpbGRFbmdpbmVQYXJhbS5zZXBhcmF0ZUVuZ2luZU9wdGlvbnMgPSB7XG4gICAgICAgICAgICBwbHVnaW5GZWF0dXJlczogJ2FsbCcsXG4gICAgICAgICAgICBvdXRwdXRMb2NhbFBsdWdpbjogdHJ1ZSxcbiAgICAgICAgICAgIHBsdWdpbk5hbWU6IEVOR0lORV9QTFVHSU5fTkFNRSxcbiAgICAgICAgfTtcbiAgICAgICAgb3B0aW9ucy5idWlsZEVuZ2luZVBhcmFtLm5hdGl2ZUNvZGVCdW5kbGVNb2RlID0gJ2FzbWpzJztcbiAgICB9XG5cbiAgICAvLyDop6PmnpDlkI7nu63mnoTlu7rpmLbmrrXvvJrmnKrkvKDpgJIgbmV4dFN0YWdlcyDmiJbkuLrnqbrmlbDnu4Tml7bvvIzlm57pgIDliLAgY29uZmlnLnRzIOS4remFjee9rueahOm7mOiupOWAvFxuICAgIGlmICghQXJyYXkuaXNBcnJheShvcHRpb25zLm5leHRTdGFnZXMpIHx8IChvcHRpb25zLm5leHRTdGFnZXMgJiYgb3B0aW9ucy5uZXh0U3RhZ2VzLmxlbmd0aCA9PT0gMCkpIHtcbiAgICAgICAgY29uc3QgZGVmYXVsdEJ1aWxkU3RhZ2VzID0gKG9wZW5QYWFzQ29uZmlnLmNvbW1vbk9wdGlvbnM/LmJ1aWxkU3RhZ2VHcm91cD8uZGVmYXVsdCBhcyB7IGJ1aWxkPzogc3RyaW5nW10gfSB8IHVuZGVmaW5lZCk/LmJ1aWxkO1xuICAgICAgICBvcHRpb25zLm5leHRTdGFnZXMgPSBBcnJheS5pc0FycmF5KGRlZmF1bHRCdWlsZFN0YWdlcykgJiYgZGVmYXVsdEJ1aWxkU3RhZ2VzLmxlbmd0aCA+IDAgPyBkZWZhdWx0QnVpbGRTdGFnZXMgOiBbJ21ha2UnLCAndXBsb2FkJ107XG4gICAgfVxufVxuXG4vKipcbiAqIE5vcm1hbGl6ZXMgYnVuZGxlIGJ1aWxkIG9wdGlvbnMgYmVmb3JlIGJ1bmRsZSBpbml0aWFsaXphdGlvbiBmb3IgdGhlIE9wZW5QYWFTIHJ1bnRpbWUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBvbkJlZm9yZUJ1bmRsZUluaXQob3B0aW9uczogSVRhc2tPcHRpb24pIHtcbiAgICBpZiAob3B0aW9ucy5wb2x5ZmlsbHMpIHtcbiAgICAgICAgb3B0aW9ucy5wb2x5ZmlsbHMuYXN5bmNGdW5jdGlvbnMgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBvcHRpb25zLm1vdmVSZW1vdGVCdW5kbGVTY3JpcHQgPSB0cnVlO1xuICAgIG9wdGlvbnMuYnVpbGRTY3JpcHRQYXJhbS5zeXN0ZW0gPSB7IHByZXNldDogJ2NvbW1vbmpzLWxpa2UnIH07XG59XG5cbi8qKlxuICogUmV3cml0ZXMgc3VicGFja2FnZSBidW5kbGUgb3V0cHV0IHBhdGhzIGFuZCByZWNvcmRzIE9wZW5QYWFTIHN1YnBhY2thZ2UgbWV0YWRhdGEuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBvbkFmdGVyQnVuZGxlRGF0YVRhc2sob3B0aW9uczogSVRhc2tPcHRpb24sIGJ1bmRsZXM6IElCdW5kbGVbXSwgY2FjaGU6IEJ1aWxkZXJDYWNoZSkge1xuICAgIGNvbnN0IHN1YnBhY2thZ2VzOiB7IG5hbWU6IHN0cmluZywgcm9vdDogc3RyaW5nIH1bXSA9IFtdO1xuICAgIGJ1bmRsZXMuZm9yRWFjaCgoYnVuZGxlKSA9PiB7XG4gICAgICAgIGlmIChidW5kbGUuaXNTdWJwYWNrYWdlKSB7XG4gICAgICAgICAgICAvLyDkv67mlLnmnoTlu7rphY3nva5cbiAgICAgICAgICAgIGJ1bmRsZS5kZXN0ID0gam9pbihkaXJuYW1lKG9wdGlvbnMuZGVzdCksIHN1YnBhY2thZ2VQcmVmaXggKyBidW5kbGUubmFtZSwgYnVuZGxlLm5hbWUpO1xuICAgICAgICAgICAgYnVuZGxlLnNjcmlwdERlc3QgPSBqb2luKGJ1bmRsZS5kZXN0LCBNQUlOX0pTX05BTUUpO1xuICAgICAgICAgICAgY29uc3QgbmFtZSA9IGAke3N1YnBhY2thZ2VQcmVmaXh9JHtidW5kbGUubmFtZX1gO1xuICAgICAgICAgICAgc3VicGFja2FnZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICByb290OiBgJHtidW5kbGUubmFtZX0vYCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby11bnVzZWQtZXhwcmVzc2lvbnNcbiAgICBzdWJwYWNrYWdlcy5sZW5ndGggJiYgKG9wdGlvbnMucGFja2FnZXNbUExBVEZPUk1fTkFNRV0uc3VicGFja2FnZXMgPSBzdWJwYWNrYWdlcyk7XG59XG5cbi8qKlxuICogQ29waWVzIHRoZSBjb25maWd1cmVkIHBsYXRmb3JtIGljb24gaW50byB0aGUgYnVpbGQgb3V0cHV0IGFuZCBleGNsdWRlcyBpdCBmcm9tIG1kNSByZXBsYWNlbWVudC5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gaGFuZGxlSWNvbk5hbWUob3B0aW9uczogSVRhc2tPcHRpb24sIHJlc3VsdDogSW50ZXJuYWxCdWlsZFJlc3VsdCwgcmVhbFJvb3Q6IHN0cmluZykge1xuICAgIGNvbnN0IHBhY2thZ2VzT3B0aW9ucyA9IG9wdGlvbnMucGFja2FnZXNbUExBVEZPUk1fTkFNRV07XG4gICAgY29uc3QgaW1hZ2VQYXRoID0gam9pbihyZWFsUm9vdCwgSUNPTl9OQU1FICsgZXh0bmFtZShwYWNrYWdlc09wdGlvbnMuaWNvbikpO1xuICAgIC8vIOWIpOaWrea4uOaIj+i/h+eoi+mHjCBpbWFnZSDnm67lvZXmmK/lkKblrZjlnKhcbiAgICBlbnN1cmVEaXJTeW5jKGRpcm5hbWUoaW1hZ2VQYXRoKSk7XG4gICAgLy8g5re75Yqg5bqU55So5Zu+5qCHXG4gICAgY29weUZpbGVTeW5jKGpvaW4oX19kaXJuYW1lLCBwYWNrYWdlc09wdGlvbnMuaWNvbiksIGltYWdlUGF0aCk7XG4gICAgb3B0aW9ucy5tZDVDYWNoZU9wdGlvbnMuZXhjbHVkZXMucHVzaChJQ09OX05BTUUgKyBleHRuYW1lKHBhY2thZ2VzT3B0aW9ucy5pY29uKSk7XG59XG5cbi8qKlxuICogR2VuZXJhdGVzIHJ1bnRpbWUgYWRhcHRlciBmaWxlcywgbWFpbi5qcywgaWNvbiwgYW5kIGdhbWUuY29uZmlnLmpzb24gYmVmb3JlIHRlbXBsYXRlIGNvcHkgZmluaXNoZXMuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBvbkJlZm9yZUNvcHlCdWlsZFRlbXBsYXRlKHRoaXM6IElCdWlsZGVyLCBvcHRpb25zOiBJVGFza09wdGlvbiwgcmVzdWx0OiBJbnRlcm5hbEJ1aWxkUmVzdWx0LCBjYWNoZTogQnVpbGRlckNhY2hlKSB7XG4gICAgY29uc3QgYnVpbGREZXN0RGlyOiBzdHJpbmcgPSByZXN1bHQucGF0aHMuZGlyO1xuICAgIC8vIGd1bHAgcnVudGltZSBhZGFwdGVyXG4gICAgYXdhaXQgX2dlbmVyYXRlX2FkYXB0ZXIob3B0aW9ucywgYnVpbGREZXN0RGlyKTtcblxuICAgIGNvbnN0IGdhbWVFanNUZW1wbGF0ZSA9IHRoaXMuYnVpbGRUZW1wbGF0ZS5pbml0VXJsKCdtYWluLmVqcycpIHx8IGpvaW4oX19kaXJuYW1lLCAnLi4vc3RhdGljL2J1aWxkLXRlbXBsYXRlL21haW4uZWpzJyk7XG4gICAgLy8gZ2VuZXJhdGUgbWFpbi5qc1xuICAgIGF3YWl0IF9yZW5kZXJfbWFpbl9qcyh0aGlzLCBnYW1lRWpzVGVtcGxhdGUsIG9wdGlvbnMsIHJlc3VsdCk7XG4gICAgLy8g5re75Yqg5bqU55So5Zu+5qCHXG4gICAgYXdhaXQgaGFuZGxlSWNvbk5hbWUob3B0aW9ucywgcmVzdWx0LCBidWlsZERlc3REaXIpO1xuXG4gICAgLy8gZ2FtZS5jb25maWcuanNvbiDphY3nva7kv6Hmga/lhpnlhaXvvIjlgZrkuobmlbDmja7ono3lkIjpnIDopoHlnKjmqKHmnb/mi7fotJ3kuYvlkI7lpITnkIbvvIlcbiAgICBfZ2VuZXJhdGVfZ2FtZV9jb25maWdfanNvbihidWlsZERlc3REaXIsIG9wdGlvbnMsIHJlc3VsdCk7XG59XG5cbi8qKlxuICogUmVhZHMgdGhlIHdlYiBjaGlsZC1wbGF0Zm9ybSBsaXN0IHN1cHBvcnRlZCBieSBPcGVuUGFhUyBmcm9tIHJlZ2lzdGVyZWQgcGx1Z2luIGNvbmZpZy5cbiAqL1xuZnVuY3Rpb24gZ2V0T3BlblBhYXNTdXBwb3J0UGxhdGZvcm1zKCk6IHN0cmluZ1tdIHtcbiAgICBjb25zdCBwbGF0Zm9ybXMgPSBvcGVuUGFhc0NvbmZpZy5zdXBwb3J0UGxhdGZvcm1zPy5wbGF0Zm9ybXM7XG4gICAgcmV0dXJuIEFycmF5LmlzQXJyYXkocGxhdGZvcm1zKSA/IHBsYXRmb3JtcyA6IFtdO1xufVxuXG4vKipcbiAqIFRlbXBvcmFyaWx5IG1vdmVzIGNoaWxkIHdlYiBidWlsZCBkaXJlY3RvcmllcyBvdXQgb2YgdGhlIE9wZW5QYWFTIHJvb3QgYmVmb3JlIHNpZ25pbmcgdGhlIG1haW4gcGFja2FnZS5cbiAqL1xuZnVuY3Rpb24gbW92ZU9wZW5QYWFzTWFpblBhY2thZ2VFeGNsdWRlZERpcnMocm9vdDogc3RyaW5nKTogVGVtcG9yYXJpbHlNb3ZlZERpcltdIHtcbiAgICBjb25zdCB0ZW1wb3JhcnlSb290ID0gam9pbihkaXJuYW1lKHJvb3QpLCBgX19PcGVuUGFhU19tYWluX3BhY2thZ2VfZXhjbHVkZXNfJHtwcm9jZXNzLnBpZH1fJHtEYXRlLm5vdygpfWApO1xuICAgIGNvbnN0IG1vdmVkRGlyczogVGVtcG9yYXJpbHlNb3ZlZERpcltdID0gW107XG4gICAgZm9yIChjb25zdCBuYW1lIG9mIGdldE9wZW5QYWFzU3VwcG9ydFBsYXRmb3JtcygpKSB7XG4gICAgICAgIGNvbnN0IHNvdXJjZSA9IGpvaW4ocm9vdCwgbmFtZSk7XG4gICAgICAgIGlmICghX0ZTLmV4aXN0c1N5bmMoc291cmNlKSB8fCAhX0ZTLnN0YXRTeW5jKHNvdXJjZSkuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFtb3ZlZERpcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICBlbXB0eURpclN5bmModGVtcG9yYXJ5Um9vdCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdGVtcG9yYXJ5ID0gam9pbih0ZW1wb3JhcnlSb290LCBuYW1lKTtcbiAgICAgICAgX0ZTLm1vdmVTeW5jKHNvdXJjZSwgdGVtcG9yYXJ5LCB7IG92ZXJ3cml0ZTogdHJ1ZSB9KTtcbiAgICAgICAgbW92ZWREaXJzLnB1c2goeyBuYW1lLCBzb3VyY2UsIHRlbXBvcmFyeSB9KTtcbiAgICAgICAgY29uc29sZS5sb2coYFtvcGVucGFhcy1tYWtlXSBFeGNsdWRlICR7bmFtZX0gZnJvbSBtYWluIHBhY2thZ2VgKTtcbiAgICB9XG4gICAgcmV0dXJuIG1vdmVkRGlycztcbn1cblxuLyoqXG4gKiBNb3ZlcyB0ZW1wb3JhcmlseSBleGNsdWRlZCBjaGlsZCB3ZWIgYnVpbGQgZGlyZWN0b3JpZXMgYmFjayB0byB0aGVpciBvcmlnaW5hbCBsb2NhdGlvbnMuXG4gKi9cbmZ1bmN0aW9uIHJlc3RvcmVPcGVuUGFhc01haW5QYWNrYWdlRXhjbHVkZWREaXJzKG1vdmVkRGlyczogVGVtcG9yYXJpbHlNb3ZlZERpcltdKSB7XG4gICAgZm9yIChsZXQgaW5kZXggPSBtb3ZlZERpcnMubGVuZ3RoIC0gMTsgaW5kZXggPj0gMDsgaW5kZXgtLSkge1xuICAgICAgICBjb25zdCBpdGVtID0gbW92ZWREaXJzW2luZGV4XTtcbiAgICAgICAgaWYgKCFfRlMuZXhpc3RzU3luYyhpdGVtLnRlbXBvcmFyeSkpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIF9GUy5tb3ZlU3luYyhpdGVtLnRlbXBvcmFyeSwgaXRlbS5zb3VyY2UsIHsgb3ZlcndyaXRlOiB0cnVlIH0pO1xuICAgIH1cbiAgICBpZiAobW92ZWREaXJzLmxlbmd0aCkge1xuICAgICAgICBjb25zdCB0ZW1wb3JhcnlSb290ID0gZGlybmFtZShtb3ZlZERpcnNbMF0udGVtcG9yYXJ5KTtcbiAgICAgICAgaWYgKF9GUy5leGlzdHNTeW5jKHRlbXBvcmFyeVJvb3QpKSB7XG4gICAgICAgICAgICByZW1vdmVTeW5jKHRlbXBvcmFyeVJvb3QpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vKipcbiAqIFNpZ25zIGFuZCBlbmNyeXB0cyBPcGVuUGFhUyBtYWluIHBhY2thZ2UgYW5kIHN1YnBhY2thZ2VzLCB0aGVuIHN0b3JlcyBwYWNrYWdlIHBhdGhzL21kNSBpbiBidWlsZCBvdXRwdXQuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBtYWtlKHRoaXM6IElCdWlsZGVyLCByb290OiBzdHJpbmcsIG9wdGlvbnM6IElUYXNrT3B0aW9uKSB7XG4gICAgY29uc3QgdG9vbFBhdGggPSBqb2luKF9fZGlybmFtZSwnLi4vJyArIFRPT0xTX05BTUUpO1xuICAgIGNvbnN0IHsgdXNlRGVidWdLZXksIHByaXZhdGVQZW1QYXRoLCBzdWJwYWNrYWdlcywgYXBwaWQsIHZlcnNpb25OYW1lLCBlbmNyeXB0S2V5LCBjb250ZXh0LCBjb250ZXh0X3NpZ25hdHVyZSwgcHVibGljX2tleSB9ID0gb3B0aW9ucy5wYWNrYWdlc1tQTEFURk9STV9OQU1FXTtcbiAgICAvLyDnrb7lkI3lpITnkIZcbiAgICBjb25zdCBkaXN0UGF0aCA9IGpvaW4ocm9vdCwgJ2Rpc3QnKTtcbiAgICBta2RpcnNTeW5jKGRpc3RQYXRoKTtcbiAgICBcbiAgICBjb25zdCBkZXN0UGF0aCA9IGpvaW4oZGlzdFBhdGgsIG9wdGlvbnMubmFtZSArICcuc3AnKTtcbiAgICBjb25zdCBjb250ZXh0X29yZGVyZWRfanNvbiA9IEpTT04uc3RyaW5naWZ5KHNvcnRKc29uS2V5cyhjb250ZXh0KSkucmVwbGFjZSgvXFxcXC9nLCAnLycpO1xuICAgIGNvbnN0IHB1YmxpY0tleUhhc2ggPSBub3JtYWxpemVTdHJpbmcoZ2V0Q29udGV4dEdhbWVJbmZvKGNvbnRleHQpLnB1YmxpY19rZXlfaGFzaCk7XG4gICAgY29uc3QgcGFja2FnZXNKc29uOiBNYWtlUGFja2FnZXNJbmZvID0geyBtYWluUGFja2FnZTogJycsIG1kNTogJycsIHN1YlBhY2thZ2VzOiBbXSB9O1xuICAgIC8vIOmqjOivgSBjb250ZXh0IOWSjCBjb250ZXh0X3NpZ25hdHVyZSDmmK/lkKbmnInmlYhcbiAgICBhd2FpdCBoYW5kbGVWZXJpZnkodG9vbFBhdGgsIGNvbnRleHRfb3JkZXJlZF9qc29uLCBjb250ZXh0X3NpZ25hdHVyZSwgcHVibGljX2tleSk7XG4gICAgLy8g562+5ZCN5Yqg5a+G5a2Q5YyFXG4gICAgY29uc29sZS5sb2coYFtvcGVucGFhcy1tYWtlXSBTaWduIHN1Yi1wYWNrYWdlczogJHtzdWJwYWNrYWdlcz8ubGVuZ3RoIHx8IDB9YCk7XG4gICAgaWYgKHN1YnBhY2thZ2VzKSB7XG4gICAgICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBzdWJwYWNrYWdlcy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgICAgIGNvbnN0IHN1YnBhY2thZ2UgPSBzdWJwYWNrYWdlc1tpbmRleF07XG4gICAgICAgICAgICBjb25zdCBzdWJwYWNrYWdlUGF0aCA9IGpvaW4oZGlzdFBhdGgsIHN1YnBhY2thZ2UubmFtZSArICcuc3AnKTtcbiAgICAgICAgICAgIGNvbnN0IGZvbGRlclBhdGggPSBqb2luKHJvb3QsIHN1YnBhY2thZ2UubmFtZSk7XG4gICAgICAgICAgICBhd2FpdCBoYW5kbGVTaWduKHRvb2xQYXRoLCBmb2xkZXJQYXRoLCB1c2VEZWJ1Z0tleSwgcHJpdmF0ZVBlbVBhdGgsIHN1YnBhY2thZ2VQYXRoLCAzLCBhcHBpZCwgdmVyc2lvbk5hbWUsIGVuY3J5cHRLZXksIHB1YmxpY0tleUhhc2gpO1xuICAgICAgICAgICAgYXdhaXQgcmVtb3ZlU3luYyhmb2xkZXJQYXRoKTtcbiAgICAgICAgICAgIHBhY2thZ2VzSnNvbi5zdWJQYWNrYWdlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICBuYW1lOiBzdWJwYWNrYWdlLm5hbWUsXG4gICAgICAgICAgICAgICAgcGF0aDogc3VicGFja2FnZVBhdGgsXG4gICAgICAgICAgICAgICAgbWQ1OiBjb21wdXRlRmlsZU1kNShzdWJwYWNrYWdlUGF0aCksXG4gICAgICAgICAgICAgICAgc2l6ZTogX0ZTLnN0YXRTeW5jKHN1YnBhY2thZ2VQYXRoKS5zaXplLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8g562+5ZCN5Yqg5a+G5Li75YyFXG4gICAgbGV0IHN1YnBhY2thZ2VzVG1wRGlyID0gJyc7XG4gICAgaWYgKHN1YnBhY2thZ2VzICYmIHBhY2thZ2VzSnNvbi5zdWJQYWNrYWdlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHN1YnBhY2thZ2VzVG1wRGlyID0gam9pbihkaXJuYW1lKHJvb3QpLCBgX19PcGVuUGFhU19zdWJwYWNrYWdlc19zcF90bXBfJHtwcm9jZXNzLnBpZH1fJHtvcHRpb25zLm5hbWV9YCk7XG4gICAgICAgIGVtcHR5RGlyU3luYyhzdWJwYWNrYWdlc1RtcERpcik7XG4gICAgICAgIGZvciAoY29uc3QgcGtnIG9mIHBhY2thZ2VzSnNvbi5zdWJQYWNrYWdlcykge1xuICAgICAgICAgICAgY29uc3Qgc3BQYXRoID0gcGtnLnBhdGg7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHNwUGF0aCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF9GUy5tb3ZlU3luYyhzcFBhdGgsIGpvaW4oc3VicGFja2FnZXNUbXBEaXIsIGJhc2VuYW1lKHNwUGF0aCkpLCB7IG92ZXJ3cml0ZTogdHJ1ZSB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBleGNsdWRlZERpcnMgPSBtb3ZlT3BlblBhYXNNYWluUGFja2FnZUV4Y2x1ZGVkRGlycyhyb290KTtcbiAgICB0cnkge1xuICAgICAgICBhd2FpdCBoYW5kbGVTaWduKHRvb2xQYXRoLCByb290LCB1c2VEZWJ1Z0tleSwgcHJpdmF0ZVBlbVBhdGgsIGRlc3RQYXRoLCAyLCBhcHBpZCwgdmVyc2lvbk5hbWUsIGVuY3J5cHRLZXksIHB1YmxpY0tleUhhc2gpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICAgIHJlc3RvcmVPcGVuUGFhc01haW5QYWNrYWdlRXhjbHVkZWREaXJzKGV4Y2x1ZGVkRGlycyk7XG4gICAgfVxuICAgIGlmIChzdWJwYWNrYWdlc1RtcERpcikge1xuICAgICAgICBmb3IgKGNvbnN0IHBrZyBvZiBwYWNrYWdlc0pzb24uc3ViUGFja2FnZXMpIHtcbiAgICAgICAgICAgIGNvbnN0IHNwUGF0aCA9IHBrZy5wYXRoO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBzcFBhdGggIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBtb3ZlZEZyb20gPSBqb2luKHN1YnBhY2thZ2VzVG1wRGlyLCBiYXNlbmFtZShzcFBhdGgpKTtcbiAgICAgICAgICAgIGlmIChfRlMuZXhpc3RzU3luYyhtb3ZlZEZyb20pKSB7XG4gICAgICAgICAgICAgICAgX0ZTLm1vdmVTeW5jKG1vdmVkRnJvbSwgc3BQYXRoLCB7IG92ZXJ3cml0ZTogdHJ1ZSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZW1vdmVTeW5jKHN1YnBhY2thZ2VzVG1wRGlyKTtcbiAgICB9XG4gICAgcGFja2FnZXNKc29uLm1haW5QYWNrYWdlID0gZGVzdFBhdGg7XG4gICAgcGFja2FnZXNKc29uLm1kNSA9IGNvbXB1dGVGaWxlTWQ1KGRlc3RQYXRoKTtcbiAgICB0aGlzLmJ1aWxkRXhpdFJlcy5jdXN0b20ucGFja2FnZXNKc29uID0gcGFja2FnZXNKc29uO1xufVxuXG5jb25zdCBVUExPQURfQkFTRV9VUkxTOiBSZWNvcmQ8VXBsb2FkRW52LCBzdHJpbmc+ID0ge1xuICAgIGRldjogJ2h0dHBzOi8vZGV2LWFnZW50LWFwaS5zMDAudGVjaCcsXG4gICAgZmF0OiAnaHR0cHM6Ly9mYXQtYWdlbnQtYXBpLnMwMC50ZWNoJyxcbiAgICBwcm9kOiAnaHR0cHM6Ly9jbi0wMDAtYWdlbnQtYXBpLnMwMS50ZWNoJyxcbn07XG5cbi8qKlxuICogVXBsb2FkcyB0aGUgc2lnbmVkIE9wZW5QYWFTIHBhY2thZ2VzLiBEZWxlZ2F0ZXMgdGhlIHR3by1waGFzZSBkaXJlY3QtdXBsb2FkXG4gKiBmbG93IChwcmVzaWduZWQgVVJMcyDihpIgb2JqZWN0LXN0b3JhZ2UgUFVUIOKGkiBzZXJ2aWNlIGNvbmZpcm0sIHBsdXMgcmV0cnkgL1xuICogcHJvZ3Jlc3MgLyBhYm9ydCBoYW5kbGluZykgdG8gc3JjL3VwbG9hZC50cy5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHVwbG9hZCh0aGlzOiBJQnVpbGRTdGFnZVRhc2ssIHJvb3Q6IHN0cmluZywgb3B0aW9uczogSVRhc2tPcHRpb24pIHtcbiAgICBhd2FpdCBydW5VcGxvYWQodGhpcywgcm9vdCwgb3B0aW9ucyk7XG59XG5cbi8qKlxuICogTm9ybWFsaXplcyB0aGUgT3BlblBhYVMgYXBwaWQgdmFsdWUgZnJvbSBwbGF0Zm9ybSBvcHRpb25zLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZUFwcElkKG9wdGlvbnM6IElPcHRpb25zKTogc3RyaW5nIHtcbiAgICByZXR1cm4gU3RyaW5nKG9wdGlvbnMuYXBwaWQgfHwgJycpLnRyaW0oKTtcbn1cblxuLyoqXG4gKiBSZXNvbHZlcyB0aGUgT3BlblBhYVMgYWNjZXNzIHRva2VuIGZyb20gb3B0aW9ucyBmaXJzdCwgdGhlbiBlbnZpcm9ubWVudCB2YXJpYWJsZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlQWNjZXNzVG9rZW4ob3B0aW9uczogSU9wdGlvbnMpOiBzdHJpbmcge1xuICAgIHJldHVybiBTdHJpbmcob3B0aW9ucy5hY2Nlc3NUb2tlbiB8fCBwcm9jZXNzLmVudi5PUEVOUEFBU19BQ0NFU1NfVE9LRU4gfHwgcHJvY2Vzcy5lbnYuU1VEX0FDQ0VTU19UT0tFTiB8fCAnJykudHJpbSgpO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIGFuIHVua25vd24gdmFsdWUgdG8gYSB0cmltbWVkIG5vbi1lbXB0eSBzdHJpbmcuXG4gKi9cbmZ1bmN0aW9uIG5vcm1hbGl6ZVN0cmluZyh2YWx1ZTogdW5rbm93bik6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IFN0cmluZyh2YWx1ZSkudHJpbSgpO1xuICAgIHJldHVybiBub3JtYWxpemVkIHx8IHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBFeHRyYWN0cyBub3JtYWxpemVkIE9wZW5QYWFTIHN1YnBhY2thZ2UgbmFtZXMgZnJvbSBwYWNrYWdlIG9wdGlvbnMuXG4gKi9cbmZ1bmN0aW9uIGdldFN1YlBhY2thZ2VOYW1lcyhvcHRpb25zOiBJT3B0aW9ucyk6IHN0cmluZ1tdIHtcbiAgICByZXR1cm4gQXJyYXkuaXNBcnJheShvcHRpb25zLnN1YnBhY2thZ2VzKVxuICAgICAgICA/IG9wdGlvbnMuc3VicGFja2FnZXMubWFwKChzdWJwYWNrYWdlKSA9PiBTdHJpbmcoc3VicGFja2FnZS5uYW1lIHx8ICcnKS50cmltKCkpLmZpbHRlcihCb29sZWFuKVxuICAgICAgICA6IFtdO1xufVxuXG4vKipcbiAqIEJ1aWxkcyBsaWdodHdlaWdodCBwYWNrYWdlIGNvbnRleHQgbWV0YWRhdGEgYmVmb3JlIHBhY2thZ2UgZmlsZXMgZXhpc3QuXG4gKi9cbmZ1bmN0aW9uIHJlc29sdmVQYWNrYWdlQ29udGV4dFBhY2thZ2VzSW5mbyhvcHRpb25zOiBJVGFza09wdGlvbik6IFBhY2thZ2VDb250ZXh0UGFja2FnZXNJbmZvIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBzdWJQYWNrYWdlczogZ2V0U3ViUGFja2FnZU5hbWVzKG9wdGlvbnMucGFja2FnZXNbUExBVEZPUk1fTkFNRV0pLm1hcCgobmFtZSkgPT4gKHsgbmFtZSB9KSksXG4gICAgfTtcbn1cblxuLyoqXG4gKiBTZW5kcyBhIEpTT04gUE9TVCByZXF1ZXN0IHRvIE9wZW5QYWFTIGFuZCBub3JtYWxpemVzIHRyYW5zcG9ydC9BUEkgZXJyb3JzLlxuICovXG5hc3luYyBmdW5jdGlvbiBwb3N0T3BlblBhYXNKc29uPFQ+KFxuICAgIGJhc2VVcmw6IHN0cmluZyxcbiAgICBhY2Nlc3NUb2tlbjogc3RyaW5nLFxuICAgIHVwbG9hZEVudjogVXBsb2FkRW52LFxuICAgIGFwaVBhdGg6IHN0cmluZyxcbiAgICBib2R5OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbik6IFByb21pc2U8T3BlblBhYXNSZXNwb25zZTxUPj4ge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goYCR7YmFzZVVybH0ke2FwaVBhdGh9YCwge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgICd4LXN1ZC1hdCc6IGFjY2Vzc1Rva2VuLFxuICAgICAgICAgICAgJ3gtc3VkLWVuY3J5cHQtcmVxdWVzdCc6ICd0cnVlJyxcbiAgICAgICAgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoYm9keSksXG4gICAgfSk7XG4gICAgY29uc3QgcmVzcG9uc2VCb2R5ID0gYXdhaXQgcmVzcG9uc2UudGV4dCgpO1xuICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBPcGVuUGFhUyByZXF1ZXN0IGZhaWxlZDogJHthcGlQYXRofSwgZW52PSR7dXBsb2FkRW52fSwgSFRUUCAke3Jlc3BvbnNlLnN0YXR1c30ke3Jlc3BvbnNlQm9keSA/IGAsIGJvZHk9JHtyZXNwb25zZUJvZHkuc2xpY2UoMCwgMTAwMCl9YCA6ICcnfWApO1xuICAgIH1cblxuICAgIGxldCByZXN1bHQ6IE9wZW5QYWFzUmVzcG9uc2U8VD47XG4gICAgdHJ5IHtcbiAgICAgICAgcmVzdWx0ID0gSlNPTi5wYXJzZShyZXNwb25zZUJvZHkpIGFzIE9wZW5QYWFzUmVzcG9uc2U8VD47XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBPcGVuUGFhUyByZXNwb25zZSBpcyBub3QgdmFsaWQgSlNPTjogJHthcGlQYXRofSwgZW52PSR7dXBsb2FkRW52fSwgcmVhc29uPSR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpfWApO1xuICAgIH1cbiAgICBpZiAocmVzdWx0LnJldF9jb2RlICE9PSAwKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgT3BlblBhYVMgQVBJIGVycm9yOiAke2FwaVBhdGh9LCBlbnY9JHt1cGxvYWRFbnZ9LCBjb2RlPSR7cmVzdWx0LnJldF9jb2RlfSwgbWVzc2FnZT0ke3Jlc3VsdC5yZXRfbXNnfWApO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG4vKipcbiAqIENvbnZlcnRzIGEgY29kZSB2ZXJzaW9uIHZhbHVlIHRvIGEgdHJpbW1lZCBzdHJpbmcgd2hlbiBwcmVzZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplQ29kZVZlcnNpb24odmFsdWU6IHVua25vd24pOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBTdHJpbmcodmFsdWUpLnRyaW0oKTtcbiAgICByZXR1cm4gbm9ybWFsaXplZCB8fCB1bmRlZmluZWQ7XG59XG5cbi8qKlxuICogUmVzb2x2ZXMgdGhlIE9wZW5QYWFTIEFQSSBiYXNlIFVSTCBmcm9tIGV4cGxpY2l0IGNvbmZpZywgZW52aXJvbm1lbnQgdmFyaWFibGVzLCBvciB1cGxvYWQgZW52aXJvbm1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlVXBsb2FkQmFzZVVybChvcHRpb25zOiBJT3B0aW9ucyk6IHN0cmluZyB7XG4gICAgY29uc3QgY3VzdG9tQmFzZVVybCA9IFN0cmluZyhvcHRpb25zLnVwbG9hZEJhc2VVcmwgfHwgcHJvY2Vzcy5lbnYuT1BFTlBBQVNfVVBMT0FEX0JBU0VfVVJMIHx8ICcnKS50cmltKCk7XG4gICAgaWYgKGN1c3RvbUJhc2VVcmwpIHtcbiAgICAgICAgcmV0dXJuIGN1c3RvbUJhc2VVcmwucmVwbGFjZSgvXFwvJC8sICcnKTtcbiAgICB9XG4gICAgY29uc3QgZW52ID0gbm9ybWFsaXplVXBsb2FkRW52KG9wdGlvbnMudXBsb2FkRW52KVxuICAgICAgICA/PyBub3JtYWxpemVVcGxvYWRFbnYocHJvY2Vzcy5lbnYuT1BFTlBBQVNfVVBMT0FEX0VOVilcbiAgICAgICAgPz8gbm9ybWFsaXplVXBsb2FkRW52KHByb2Nlc3MuZW52LlNVRF9VUExPQURfRU5WKVxuICAgICAgICA/PyAncHJvZCc7XG4gICAgcmV0dXJuIFVQTE9BRF9CQVNFX1VSTFNbZW52XTtcbn1cblxuLyoqXG4gKiBWYWxpZGF0ZXMgYW5kIG5vcm1hbGl6ZXMgYW4gdXBsb2FkIGVudmlyb25tZW50IHZhbHVlLlxuICovXG5mdW5jdGlvbiBub3JtYWxpemVVcGxvYWRFbnYodmFsdWU6IHVua25vd24pOiBVcGxvYWRFbnYgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB2YWx1ZSA9PT0gJ2RldicgfHwgdmFsdWUgPT09ICdmYXQnIHx8IHZhbHVlID09PSAncHJvZCcgPyB2YWx1ZSA6IHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBDb21wdXRlcyB0aGUgbWQ1IGRpZ2VzdCAoaGV4KSBmb3IgYSBwYWNrYWdlIGZpbGUuXG4gKiBDb3JyZXNwb25kcyB0byBKYXZhIGBNZXNzYWdlRGlnZXN0LmdldEluc3RhbmNlKFwiTUQ1XCIpYCBhbmQgaXMgdXNlZCBmb3IgdGhlXG4gKiBpbnRlcm5hbCBjb25maXJtIEFQSXMgKGAvYXBpL2dhbWUvcGFja2FnZS9kaXJlY3QvdXBsb2FkYCxcbiAqIGAvYXBpL2dhbWUvcGFja2FnZS9kaXJlY3Qvc3ViL3VwbG9hZGApIHdoaWNoIGV4cGVjdCBhbiBtZDUgaGV4IHN0cmluZy5cbiAqIEZvciB0aGUgUFVUIGBDb250ZW50LU1ENWAgaGVhZGVyIChiYXNlNjQpLCBzZWUgYGNhbGN1bGF0ZUZpbGVNZDVCYXNlNjRgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZUZpbGVNZDUoZmlsZVBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgY29uc3QgYnVmZmVyID0gcmVhZEZpbGVTeW5jKGZpbGVQYXRoKTtcbiAgICByZXR1cm4gY3JlYXRlSGFzaCgnbWQ1JykudXBkYXRlKGJ1ZmZlcikuZGlnZXN0KCdoZXgnKTtcbn1cblxuLyoqXG4gKiBTYWZlbHkgcmVhZHMgdGhlIGdhbWVfaW5mbyBvYmplY3QgZnJvbSBPcGVuUGFhUyBwYWNrYWdlIGNvbnRleHQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb250ZXh0R2FtZUluZm8oY29udGV4dDogSnNvbk9iamVjdCB8IHVuZGVmaW5lZCk6IEpzb25PYmplY3Qge1xuICAgIGNvbnN0IGdhbWVJbmZvID0gY29udGV4dD8uZ2FtZV9pbmZvO1xuICAgIHJldHVybiBnYW1lSW5mbyAmJiB0eXBlb2YgZ2FtZUluZm8gPT09ICdvYmplY3QnICYmICFBcnJheS5pc0FycmF5KGdhbWVJbmZvKSA/IGdhbWVJbmZvIGFzIEpzb25PYmplY3QgOiB7fTtcbn1cblxuLyoqXG4gKiBFeHRyYWN0cyB0aGUgcGVyLXBhY2thZ2UgcHJpdmF0ZSBrZXkgcmV0dXJuZWQgYnkgdGhlIHYyIHBhY2thZ2UgY29udGV4dCBBUEkuXG4gKi9cbmZ1bmN0aW9uIHJlc29sdmVQYWNrYWdlUHJpdmF0ZUtleShkYXRhOiBHYW1lUGFja2FnZUNvbnRleHRSZXNwb25zZSk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIG5vcm1hbGl6ZVN0cmluZyhkYXRhLnBhY2thZ2VfcHJpdmF0ZV9rZXkpXG4gICAgICAgID8/IG5vcm1hbGl6ZVN0cmluZyhnZXRDb250ZXh0R2FtZUluZm8oZGF0YS5jb250ZXh0KS5wYWNrYWdlX3ByaXZhdGVfa2V5KTtcbn1cblxuLyoqXG4gKiBTYXZlcyB0aGUgdjIgcGFja2FnZSBwcml2YXRlIGtleSB0byBhIHRlbXAgZmlsZSBhbmQgcmV0dXJucyB0aGUgZmlsZSBwYXRoIHVzZWQgYnkgLS1wcml2YXRlLWtleS5cbiAqL1xuZnVuY3Rpb24gc2F2ZVBhY2thZ2VQcml2YXRlS2V5RmlsZShvcHRpb25zOiBJVGFza09wdGlvbiwgZGF0YTogR2FtZVBhY2thZ2VDb250ZXh0UmVzcG9uc2UpOiBzdHJpbmcge1xuICAgIGNvbnN0IHBhY2thZ2VQcml2YXRlS2V5ID0gcmVzb2x2ZVBhY2thZ2VQcml2YXRlS2V5KGRhdGEpO1xuICAgIGlmICghcGFja2FnZVByaXZhdGVLZXkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdPcGVuUGFhUyBwYWNrYWdlIGNvbnRleHQgcmVzcG9uc2UgaXMgbWlzc2luZyBwYWNrYWdlX3ByaXZhdGVfa2V5Jyk7XG4gICAgfVxuXG4gICAgY29uc3QgcGFja2FnZU9wdGlvbnMgPSBvcHRpb25zLnBhY2thZ2VzW1BMQVRGT1JNX05BTUVdO1xuICAgIGNvbnN0IGtleVBhdGggPSByZXNvbHZlUGFja2FnZVByaXZhdGVLZXlGaWxlUGF0aChvcHRpb25zLCBkYXRhLCBwYWNrYWdlUHJpdmF0ZUtleSk7XG4gICAgb3V0cHV0RmlsZVN5bmMoa2V5UGF0aCwgcGFja2FnZVByaXZhdGVLZXkucmVwbGFjZSgvXlxcdUZFRkYvLCAnJyksICd1dGY4Jyk7XG4gICAgdHJ5IHtcbiAgICAgICAgX0ZTLmNobW9kU3luYyhrZXlQYXRoLCAwbzYwMCk7XG4gICAgfSBjYXRjaCB7XG4gICAgICAgIC8vIGNobW9kIG1heSBiZSB1bnN1cHBvcnRlZCBvbiBzb21lIFdpbmRvd3MgZmlsZSBzeXN0ZW1zOyB0aGUga2V5IHBhdGggaXMgc3RpbGwgdXNhYmxlLlxuICAgIH1cbiAgICBwYWNrYWdlT3B0aW9ucy5wcml2YXRlUGVtUGF0aCA9IGtleVBhdGg7XG4gICAgcmV0dXJuIGtleVBhdGg7XG59XG5cbi8qKlxuICogQnVpbGRzIGEgZGV0ZXJtaW5pc3RpYyB0ZW1wIGZpbGUgcGF0aCBmb3IgdGhlIHBhY2thZ2UgcHJpdmF0ZSBrZXkgd2l0aG91dCBsZWFraW5nIGtleSBjb250ZW50LlxuICovXG5mdW5jdGlvbiByZXNvbHZlUGFja2FnZVByaXZhdGVLZXlGaWxlUGF0aChvcHRpb25zOiBJVGFza09wdGlvbiwgZGF0YTogR2FtZVBhY2thZ2VDb250ZXh0UmVzcG9uc2UsIHBhY2thZ2VQcml2YXRlS2V5OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IHBhY2thZ2VPcHRpb25zID0gb3B0aW9ucy5wYWNrYWdlc1tQTEFURk9STV9OQU1FXTtcbiAgICBjb25zdCBnYW1lSWQgPSBzYW5pdGl6ZUZpbGVOYW1lU2VnbWVudChyZXNvbHZlQXBwSWQocGFja2FnZU9wdGlvbnMpLCAnZ2FtZScpO1xuICAgIGNvbnN0IHBhY2thZ2VJZCA9IHNhbml0aXplRmlsZU5hbWVTZWdtZW50KGRhdGEucGFja2FnZV9pZCwgJ3BhY2thZ2UnKTtcbiAgICBjb25zdCBjb2RlVmVyc2lvbiA9IHNhbml0aXplRmlsZU5hbWVTZWdtZW50KG5vcm1hbGl6ZUNvZGVWZXJzaW9uKGdldENvbnRleHRHYW1lSW5mbyhkYXRhLmNvbnRleHQpLmNvZGVfdmVyc2lvbiksICd2ZXJzaW9uJyk7XG4gICAgY29uc3Qga2V5SGFzaCA9IGNyZWF0ZUhhc2goJ3NoYTI1NicpLnVwZGF0ZShwYWNrYWdlUHJpdmF0ZUtleSkuZGlnZXN0KCdoZXgnKS5zbGljZSgwLCAxMik7XG4gICAgcmV0dXJuIGpvaW4oX19kaXJuYW1lLCAnLi4nLCBUT09MU19OQU1FLCBQUklWQVRFX0tFWV9DQUNIRV9ESVIsIGdhbWVJZCwgYCR7cGFja2FnZUlkfV8ke2NvZGVWZXJzaW9ufV8ke2tleUhhc2h9LmtleWApO1xufVxuXG5jb25zdCBMQVNUX0FQUElEX0ZJTEUgPSBqb2luKF9fZGlybmFtZSwgJy4uJywgVE9PTFNfTkFNRSwgUFJJVkFURV9LRVlfQ0FDSEVfRElSLCAnbGFzdC1hcHBpZC5qc29uJyk7XG5cbi8qKlxuICogUGVyc2lzdHMgdGhlIG1vc3QgcmVjZW50bHkgY3JlYXRlZCBPcGVuUGFhUyBhcHBpZCBzbyB0aGUgYnVpbGQgdmlldyBjYW5cbiAqIHJlc3RvcmUgaXQgYXMgdGhlIGRlZmF1bHQgc2VsZWN0aW9uLiBSZXVzZXMgdGhlIHNhbWUgdG9vbHMvIGNhY2hlIGRpciBhc1xuICogdGhlIHBhY2thZ2UgcHJpdmF0ZSBrZXlzLlxuICovXG5mdW5jdGlvbiBzYXZlTGFzdENyZWF0ZWRBcHBJZChnYW1lSWQ6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBTdHJpbmcoZ2FtZUlkIHx8ICcnKS50cmltKCk7XG4gICAgaWYgKCFub3JtYWxpemVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZW5zdXJlRGlyU3luYyhkaXJuYW1lKExBU1RfQVBQSURfRklMRSkpO1xuICAgIG91dHB1dEZpbGVTeW5jKExBU1RfQVBQSURfRklMRSwgSlNPTi5zdHJpbmdpZnkoeyBhcHBpZDogbm9ybWFsaXplZCwgc2F2ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpIH0sIG51bGwsIDIpLCAndXRmOCcpO1xuICAgIHRyeSB7XG4gICAgICAgIF9GUy5jaG1vZFN5bmMoTEFTVF9BUFBJRF9GSUxFLCAwbzYwMCk7XG4gICAgfSBjYXRjaCB7XG4gICAgICAgIC8vIGNobW9kIG1heSBiZSB1bnN1cHBvcnRlZCBvbiBzb21lIFdpbmRvd3MgZmlsZSBzeXN0ZW1zOyB0aGUgZmlsZSBpcyBzdGlsbCB1c2FibGUuXG4gICAgfVxufVxuXG4vKipcbiAqIE5vcm1hbGl6ZXMgYSB2YWx1ZSBpbnRvIGEgZmlsZXN5c3RlbS1zYWZlIGZpbGVuYW1lIHNlZ21lbnQuXG4gKi9cbmZ1bmN0aW9uIHNhbml0aXplRmlsZU5hbWVTZWdtZW50KHZhbHVlOiB1bmtub3duLCBmYWxsYmFjazogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gKG5vcm1hbGl6ZVN0cmluZyh2YWx1ZSkgfHwgZmFsbGJhY2spXG4gICAgICAgIC5yZXBsYWNlKC9bPD46XCIvXFxcXHw/KlxceDAwLVxceDFGXS9nLCAnXycpXG4gICAgICAgIC5zbGljZSgwLCA4MCkgfHwgZmFsbGJhY2s7XG59XG5cbi8qKlxuICogUmVjdXJzaXZlbHkgc29ydHMgSlNPTiBvYmplY3Qga2V5cyB0byBwcm9kdWNlIHN0YWJsZSBzaWduaW5nIHBheWxvYWQgdGV4dC5cbiAqL1xuZnVuY3Rpb24gc29ydEpzb25LZXlzKG9iajogdW5rbm93bik6IHVua25vd24ge1xuICAvLyAxLiDlpoLmnpzmmK8gbnVsbCDmiJYgdW5kZWZpbmVk77yM55u05o6l6L+U5ZueXG4gIGlmIChvYmogPT09IG51bGwgfHwgdHlwZW9mIG9iaiA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICByZXR1cm4gb2JqO1xuICB9XG5cbiAgLy8gMi4g5aaC5p6c5piv5pWw57uE77yM6YCS5b2S5o6S5bqP5q+P5Liq5YWD57SgXG4gIGlmIChBcnJheS5pc0FycmF5KG9iaikpIHtcbiAgICByZXR1cm4gb2JqLm1hcChpdGVtID0+IHNvcnRKc29uS2V5cyhpdGVtKSk7XG4gIH1cblxuICAvLyAzLiDlpoLmnpzmmK/lr7nosaHvvIzmjIkga2V5IOWtl+avjemhuuW6j+aOkuW6j++8jOWGjemAkuW9kuWAvFxuICBpZiAodHlwZW9mIG9iaiA9PT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXMob2JqKVxuICAgICAgLnNvcnQoKSAvLyDwn5SlIOaguOW/g++8muaMieWtl+avjemhuuW6j+aOkuW6jyBrZXlcbiAgICAgIC5yZWR1Y2UoKHNvcnRlZE9iaiwga2V5KSA9PiB7XG4gICAgICAgIHNvcnRlZE9ialtrZXldID0gc29ydEpzb25LZXlzKChvYmogYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4pW2tleV0pO1xuICAgICAgICByZXR1cm4gc29ydGVkT2JqO1xuICAgICAgfSwge30gYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4pO1xuICB9XG5cbiAgLy8gNC4g5a2X56ym5LiyL+aVsOWtly/luIPlsJTvvIznm7TmjqXov5Tlm55cbiAgcmV0dXJuIG9iajtcbn1cblxuLyoqXG4gKiBWZXJpZmllcyBwYWNrYWdlIGNvbnRleHQgc2lnbmF0dXJlIGJ5IGludm9raW5nIHRoZSBTVUQgcGFja2FnZSBzaWduIHRvb2wuXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGhhbmRsZVZlcmlmeShyb290OiBzdHJpbmcsIGNvbnRleHQ/OiBzdHJpbmcsIGNvbnRleHRfc2lnbmF0dXJlPzogc3RyaW5nLCBwdWJsaWNfa2V5Pzogc3RyaW5nKSB7XG4gICAgY29uc3QgYXJnczogc3RyaW5nW10gPSBbXTtcbiAgICBpZiAoY29udGV4dCAmJiBjb250ZXh0X3NpZ25hdHVyZSAmJiBwdWJsaWNfa2V5KSB7XG4gICAgICAgIGFyZ3MucHVzaCgnLS12ZXJpZnktcGF5bG9hZCcsIGNvbnRleHQpO1xuICAgICAgICBhcmdzLnB1c2goJy0tdmVyaWZ5LXNpZ25hdHVyZScsIGNvbnRleHRfc2lnbmF0dXJlKTtcbiAgICAgICAgYXJncy5wdXNoKCctLXZlcmlmeS1wdWJsaWMta2V5JywgcHVibGljX2tleSk7XG4gICAgfVxuICAgIGF3YWl0IHJ1blN1ZFNpZ25Ub29sKHJvb3QsIGFyZ3MpO1xuICAgIHJldHVybiAndmVyaWZ5IHN1Y2Nlc3MnO1xufVxuXG4vKipcbiAqIFNpZ25zIGFuZCBvcHRpb25hbGx5IGVuY3J5cHRzIG9uZSBPcGVuUGFhUyBwYWNrYWdlIGRpcmVjdG9yeSB3aXRoIHRoZSBTVUQgcGFja2FnZSBzaWduIHRvb2wuXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGhhbmRsZVNpZ24ocm9vdDogc3RyaW5nLCBpbnB1dFBhdGg6IHN0cmluZywgdXNlRGVidWdLZXk6IGJvb2xlYW4sIHByaXZhdGVLZXlQYXRoOiBzdHJpbmcsIG91dHB1dE5hbWU6IHN0cmluZywgdHlwZTogbnVtYmVyID0gMiwgYXBwSWQ6IHN0cmluZywgYXBwdmVyOiBzdHJpbmcsIGVuY3J5cHRLZXk/OiBzdHJpbmcsIHB1YmxpY0tleUhhc2g/OiBzdHJpbmcpIHtcbiAgICBjb25zdCBhcmdzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGFyZ3MucHVzaCgnLS1jb21wcmVzcycsICdkZWZsYXRlJyk7XG4gICAgaWYgKGVuY3J5cHRLZXkpIHtcbiAgICAgICAgYXJncy5wdXNoKCctLWVuY3J5cHQnKTtcbiAgICAgICAgYXJncy5wdXNoKCctLWdsb2JhbC1rZXknLCBlbmNyeXB0S2V5KTtcbiAgICB9XG4gICAgaWYgKHB1YmxpY0tleUhhc2gpIHtcbiAgICAgICAgYXJncy5wdXNoKCctLXB1YmxpYy1rZXktaGFzaCcsIHB1YmxpY0tleUhhc2gpO1xuICAgIH1cbiAgICBpZiAoIXVzZURlYnVnS2V5KSB7XG4gICAgICAgIGFyZ3MucHVzaCgnLS1wcml2YXRlLWtleScsIHByaXZhdGVLZXlQYXRoKTtcbiAgICB9XG4gICAgaWYgKHR5cGUgPT09IDMpIHtcbiAgICAgICAgYXJncy5wdXNoKCctLWlucHV0JywgaW5wdXRQYXRoLCAnLS1vdXRwdXQnLCBvdXRwdXROYW1lLCAnLS10eXBlJywgdHlwZS50b1N0cmluZygpLCAnLS1nYW1lLWlkJywgYXBwSWQsICctLWFwcC12ZXJzaW9uJywgYXBwdmVyKTtcbiAgICB9IGVsc2UgaWYgKHR5cGUgPT09IDIpIHtcbiAgICAgICAgYXJncy5wdXNoKCctLWlucHV0JywgaW5wdXRQYXRoLCAnLS1vdXRwdXQnLCBvdXRwdXROYW1lKTtcbiAgICB9XG4gICAgYXdhaXQgcnVuU3VkU2lnblRvb2wocm9vdCwgYXJncyk7XG4gICAgcmV0dXJuIG91dHB1dE5hbWU7XG59XG5cbi8qKlxuICogU3Bhd25zIHRoZSBwbGF0Zm9ybS1zcGVjaWZpYyBTVUQgcGFja2FnZSBzaWduIHRvb2wgYW5kIHJldHVybnMgaXRzIGNvbWJpbmVkIG91dHB1dC5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gcnVuU3VkU2lnblRvb2wocm9vdDogc3RyaW5nLCBhcmdzOiBzdHJpbmdbXSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHRvb2xzUGF0aCA9IHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMicgPyBqb2luKHJvb3QsICdzdWQtcGFja2FnZS1zaWduLXRvb2wuZXhlJykgOiBqb2luKHJvb3QsICdzdWQtcGFja2FnZS1zaWduLXRvb2wnKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbb3BlbnBhYXMtbWFrZV0gUnVuIHN1ZCBwYWNrYWdlIHNpZ24gdG9vbDogJHt0b29sc1BhdGh9YCk7XG4gICAgICAgICAgICBjb25zdCBjaGlsZCA9IGNoaWxkUHJvY2Vzcy5zcGF3bih0b29sc1BhdGgsIGFyZ3MsIHsgY3dkOiByb290LCBzdGRpbzogWydpZ25vcmUnLCAncGlwZScsICdwaXBlJ10gfSk7XG4gICAgICAgICAgICBsZXQgb3V0cHV0ID0gJyc7XG4gICAgICAgICAgICBpZiAoY2hpbGQuc3Rkb3V0KSB7XG4gICAgICAgICAgICAgICAgY2hpbGQuc3Rkb3V0Lm9uKCdkYXRhJywgKGRhdGEpID0+IChvdXRwdXQgKz0gZGF0YSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNoaWxkLnN0ZGVycikge1xuICAgICAgICAgICAgICAgIGNoaWxkLnN0ZGVyci5vbignZGF0YScsIChkYXRhKSA9PiAob3V0cHV0ICs9IGRhdGEpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNoaWxkLm9uKCdlcnJvcicsIHJlamVjdCk7XG4gICAgICAgICAgICBjaGlsZC5vbignY2xvc2UnLCAoY29kZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChjb2RlICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoYHN1ZC10b29sIGV4aXQgY29kZTogJHtjb2RlfSBlcnJNc2c6ICR7b3V0cHV0fWApKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKG91dHB1dCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbi8qKlxuICogZ3VscCBydW50aW1lIGFkYXB0ZXJcbiAqIEBwYXJhbSBvcHRpb25zXG4gKiBAcGFyYW0gQnVpbGREZXN0XG4gKi9cbi8qKlxuICogQ29waWVzIE9wZW5QYWFTIHJ1bnRpbWUgYWRhcHRlciBzY3JpcHRzIGludG8gdGhlIGJ1aWxkIG91dHB1dC5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gX2dlbmVyYXRlX2FkYXB0ZXIob3B0aW9uczogSVRhc2tPcHRpb24sIEJ1aWxkRGVzdDogc3RyaW5nKSB7XG4gICAgY29uc3QgYWRhcHRlclJvb3RTcmMgPSBqb2luKF9fZGlybmFtZSwgJ2FkYXB0ZXIvJyk7XG4gICAgY29uc3QgYWRhcHRlclJvb3REZXN0ID0gam9pbihCdWlsZERlc3QsICdydW50aW1lLWFkYXB0ZXInKTtcbiAgICAvL2VuZ2luZS1hZGFwdGVyLmpzXG4gICAgY29uc3QgZW5naW5lQWRhcHRlclNyYyA9IGpvaW4oYWRhcHRlclJvb3RTcmMsIGBlbmdpbmUtYWRhcHRlciR7b3B0aW9ucy5kZWJ1ZyA/ICcnIDogJy5taW4nfS5qc2ApO1xuICAgIGNvbnN0IGVuZ2luZUFkYXB0ZXJEZXN0ID0gam9pbihhZGFwdGVyUm9vdERlc3QsIGBlbmdpbmUtYWRhcHRlci5qc2ApO1xuICAgIF9GUy5jb3B5U3luYyhlbmdpbmVBZGFwdGVyU3JjLCBlbmdpbmVBZGFwdGVyRGVzdCk7XG4gICAgLy93ZWItYWRhcHRlci5qc1xuICAgIGNvbnN0IHdlYkFkYXB0ZXJTcmMgPSBqb2luKGFkYXB0ZXJSb290U3JjLCBgd2ViLWFkYXB0ZXIke29wdGlvbnMuZGVidWcgPyAnJyA6ICcubWluJ30uanNgKTtcbiAgICBjb25zdCB3ZWJBZGFwdGVyRGVzdCA9IGpvaW4oYWRhcHRlclJvb3REZXN0LCBgd2ViLWFkYXB0ZXIuanNgKTtcbiAgICBfRlMuY29weVN5bmMod2ViQWRhcHRlclNyYywgd2ViQWRhcHRlckRlc3QpO1xuICAgIC8vIHJhbC5qc1xuICAgIGNvbnN0IGpzYlNyYyA9IGpvaW4oYWRhcHRlclJvb3RTcmMsIGByYWwke29wdGlvbnMuZGVidWcgPyAnJyA6ICcubWluJ30uanNgKTtcbiAgICBjb25zdCBqc2JEZXN0ID0gam9pbihhZGFwdGVyUm9vdERlc3QsIGByYWwuanNgKTtcbiAgICBfRlMuY29weVN5bmMoanNiU3JjLCBqc2JEZXN0KTtcbiAgICBvcHRpb25zLm1kNUNhY2hlT3B0aW9ucy5pbmNsdWRlcy5wdXNoKCdydW50aW1lLWFkYXB0ZXIvKi5qcycpO1xufVxuXG4vKipcbiAqIFJlbmRlcnMgdGhlIE9wZW5QYWFTIG1haW4uanMgbGF1bmNoZXIgZnJvbSB0aGUgY29uZmlndXJlZCBFSlMgdGVtcGxhdGUuXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIF9yZW5kZXJfbWFpbl9qcyhidWlsZGVyOiBJQnVpbGRlciwgZ2FtZUVqc1RlbXBsYXRlOiBzdHJpbmcsIG9wdGlvbnM6IElUYXNrT3B0aW9uLCByZXN1bHQ6IEludGVybmFsQnVpbGRSZXN1bHQpIHtcbiAgICBjb25zdCBwYXRocyA9IHJlc3VsdC5wYXRocztcbiAgICBjb25zdCBidWlsZERlc3REaXI6IHN0cmluZyA9IHBhdGhzLmRpcjtcblxuICAgIGNvbnN0IG1haW5SZW5kZXJEYXRhID0ge1xuICAgICAgICBvcHRpb25EZWJ1Zzogb3B0aW9ucy5kZWJ1ZyxcbiAgICAgICAgcG9seWZpbGxzQnVuZGxlRmlsZTogKHBhdGhzLnBvbHlmaWxsc0pzICYmIGJ1aWxkZXIudXRpbHMucmVsYXRpdmVVcmwoYnVpbGREZXN0RGlyLCBwYXRocy5wb2x5ZmlsbHNKcykpIHx8IGZhbHNlLFxuICAgICAgICBzeXN0ZW1Kc0J1bmRsZUZpbGU6IGJ1aWxkZXIudXRpbHMucmVsYXRpdmVVcmwoYnVpbGREZXN0RGlyLCBwYXRocy5zeXN0ZW1KcyEpLFxuICAgICAgICBpbXBvcnRNYXBGaWxlOiBidWlsZGVyLnV0aWxzLnJlbGF0aXZlVXJsKGJ1aWxkRGVzdERpciwgcGF0aHMuaW1wb3J0TWFwKSxcbiAgICAgICAgLy8g5qiq5bGP5Li6IDAg56uW5bGP5Li6IDEgbnVtYmVyXG4gICAgICAgIG9yaWVudGF0aW9uTnVtOiBvcHRpb25zLnBhY2thZ2VzW1BMQVRGT1JNX05BTUVdLmRldmljZU9yaWVudGF0aW9uID09PSAnbGFuZHNjYXBlJyA/IDAgOiAxLFxuICAgICAgICBhcHBsaWNhdGlvbkpzOiAnLi8nICsgYnVpbGRlci51dGlscy5yZWxhdGl2ZVVybChidWlsZERlc3REaXIsIHBhdGhzLmFwcGxpY2F0aW9uSlMpLFxuICAgIH07XG4gICAgY29uc3QgY29udGVudHMgPSBhd2FpdCBfRUpTLnJlbmRlckZpbGUoZ2FtZUVqc1RlbXBsYXRlLCBtYWluUmVuZGVyRGF0YSk7XG4gICAgX0ZTLndyaXRlRmlsZVN5bmMoam9pbihidWlsZERlc3REaXIsICdtYWluLmpzJyksIFN0cmluZyhjb250ZW50cykpO1xuICAgIG9wdGlvbnMubWQ1Q2FjaGVPcHRpb25zLnJlcGxhY2VPbmx5LnB1c2goJ21haW4uanMnKTtcbn1cblxuLyoqXG4gKiBXcml0ZXMgZ2FtZS5jb25maWcuanNvbiBjb25zdW1lZCBieSB0aGUgT3BlblBhYVMgcnVudGltZS5cbiAqL1xuZnVuY3Rpb24gX2dlbmVyYXRlX2dhbWVfY29uZmlnX2pzb24oZGVzdERpcjogc3RyaW5nLCBvcHRpb25zOiBJVGFza09wdGlvbiwgcmVzdWx0OiBJbnRlcm5hbEJ1aWxkUmVzdWx0KSB7XG4gICAgY29uc3QgcGxhdGZvcm1TZXR0aW5nOiBJT3B0aW9ucyA9IG9wdGlvbnMucGFja2FnZXNbUExBVEZPUk1fTkFNRV07XG4gICAgY29uc3QganNvbk9iajogT3BlblBhYXNHYW1lQ29uZmlnID0ge1xuICAgICAgICBnYW1lSWQ6IHBsYXRmb3JtU2V0dGluZy5hcHBpZCxcbiAgICAgICAgbmV0d29ya1RpbWVvdXQ6IHBsYXRmb3JtU2V0dGluZy5uZXR3b3JrVGltZW91dCxcbiAgICAgICAgdmVyc2lvbjogcGxhdGZvcm1TZXR0aW5nLnZlcnNpb25OYW1lLFxuICAgICAgICBkZXZpY2VPcmllbnRhdGlvbjogcGxhdGZvcm1TZXR0aW5nLmRldmljZU9yaWVudGF0aW9uLFxuICAgICAgICBwZXJtaXNzaW9uczogcGxhdGZvcm1TZXR0aW5nLnBlcm1pc3Npb25zLFxuICAgICAgICBtaW5SdW50aW1lVmVyc2lvbjogcGxhdGZvcm1TZXR0aW5nLm1pblJ1bnRpbWVWZXJzaW9uLFxuICAgICAgICBrZXlQYXRoOiBwbGF0Zm9ybVNldHRpbmcucHJpdmF0ZVBlbVBhdGgsXG4gICAgICAgIHBsdWdpbnM6IHBsYXRmb3JtU2V0dGluZy5wbHVnaW5zLFxuICAgICAgICB3b3JrZXJzOiBwbGF0Zm9ybVNldHRpbmcud29ya2VycyxcbiAgICAgICAgY29udGV4dDogcGxhdGZvcm1TZXR0aW5nLmNvbnRleHQsXG4gICAgICAgIGNvbnRleHRfc2lnbmF0dXJlOiBwbGF0Zm9ybVNldHRpbmcuY29udGV4dF9zaWduYXR1cmUsXG4gICAgICAgIGV4dGVuc2lvbnM6IHtcbiAgICAgICAgICAgIHZlcnNpb25Db2RlOiBwbGF0Zm9ybVNldHRpbmcudmVyc2lvbkNvZGUsXG4gICAgICAgICAgICBpY29uOiBwbGF0Zm9ybVNldHRpbmcuaWNvbixcbiAgICAgICAgICAgIG1pblBsYXRmb3JtVmVyc2lvbjogcGxhdGZvcm1TZXR0aW5nLm1pblBsYXRmb3JtVmVyc2lvbixcbiAgICAgICAgICAgIGZ1bGxTY3JlZW46IHBsYXRmb3JtU2V0dGluZy5mdWxsU2NyZWVuLFxuICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiBwbGF0Zm9ybVNldHRpbmcuYmFja2dyb3VuZENvbG9yLFxuICAgICAgICB9LFxuICAgIH07XG5cbiAgICAvLyBzdWJwYWNrYWdlc1xuICAgIGlmIChvcHRpb25zLnBhY2thZ2VzW1BMQVRGT1JNX05BTUVdLnN1YnBhY2thZ2VzKSB7XG4gICAgICAgIGpzb25PYmouc3VicGFja2FnZXMgPSBvcHRpb25zLnBhY2thZ2VzW1BMQVRGT1JNX05BTUVdLnN1YnBhY2thZ2VzO1xuICAgIH1cbiAgICBjb25zdCBkZXN0ID0gam9pbihkZXN0RGlyLCBDT05GSUdfTkFNRSk7XG4gICAgX0ZTLndyaXRlSlNPTlN5bmMoZGVzdCwganNvbk9iaik7XG4gICAgb3B0aW9ucy5tZDVDYWNoZU9wdGlvbnMuZXhjbHVkZXMucHVzaChDT05GSUdfTkFNRSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwdWJsaXNoKHRhc2s6IElCdWlsZFN0YWdlVGFzaywgcGxhdGZvcm06IHN0cmluZywgcm9vdDogc3RyaW5nLCBvcHRpb25zOiBJVGFza09wdGlvbikge1xuICAgIGNvbnNvbGUubG9nKGBbd2ViLXB1Ymxpc2hdIFB1Ymxpc2ggc3RhcnQ6IHBsYXRmb3JtPSR7cGxhdGZvcm19LCByb290PSR7cm9vdH1gKTtcbiAgICAgICAgLy8gVE9ETzogY2FsbCB0aGUgcmVhbCBwdWJsaXNoL3JlbGVhc2UgQVBJIHdpdGggcGFja2FnZUlkXG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYFt3ZWItcHVibGlzaF0gUHVibGlzaCBzdWNjZXNzOiBwYWNrYWdlSWQ9JHtwYWNrYWdlSWR9YCk7XG59Il19