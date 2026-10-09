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
exports.buildScriptCommand = buildScriptCommand;
exports.buildSystemJsCommand = buildSystemJsCommand;
exports.buildPolyfillsCommand = buildPolyfillsCommand;
const fs_extra_1 = __importStar(require("fs-extra"));
const mod_lo_1 = require("@cocos/creator-programming-mod-lo/lib/mod-lo");
const creator_programming_rollup_plugin_mod_lo_1 = __importDefault(require("@cocos/creator-programming-rollup-plugin-mod-lo"));
const to_named_register_1 = __importDefault(require("../../utils/to-named-register"));
const url_1 = require("url");
const babel = __importStar(require("@babel/core"));
const rollup = __importStar(require("rollup"));
// @ts-ignore
const rollup_plugin_sourcemaps_1 = __importDefault(require("rollup-plugin-sourcemaps"));
const rollup_plugin_terser_1 = require("rollup-plugin-terser");
const path_1 = __importStar(require("path"));
const pack_mods_1 = require("../../utils/pack-mods");
const creator_programming_common_1 = require("@cocos/creator-programming-common");
const module_system_1 = require("@cocos/module-system");
const build_polyfills_1 = __importDefault(require("@cocos/build-polyfills"));
const minimatch_1 = __importDefault(require("minimatch"));
function relativeUrl(from, to) {
    return (0, path_1.relative)(from, to).replace(/\\/g, '/');
}
let bundleIdToNameChunk;
function matchPattern(path, pattern) {
    return (0, minimatch_1.default)(path.replace(/\\/g, '/'), pattern.replace(/\\/g, '/'));
}
const useEditorFolderFeature = false; // TODO: 之后正式接入编辑器 Editor 目录后移除这个开关
function getExternalEditorModules(cceModuleMap) {
    return Object.keys(cceModuleMap).filter(name => name !== 'mapLocation');
}
async function genImportRestrictions(dbInfos, externalEditorModules) {
    if (!useEditorFolderFeature) {
        return undefined;
    }
    const restrictions = [];
    restrictions.length = 0;
    const banSourcePatterns = [...externalEditorModules];
    for (const info of dbInfos) {
        const dbPath = info.target;
        if (dbPath) {
            const dbEditorPattern = path_1.default.join(dbPath, '**', 'editor', '**/*');
            banSourcePatterns.push(dbEditorPattern);
        }
    }
    for (let i = 0; i < dbInfos.length; ++i) {
        const info = dbInfos[i];
        const dbPath = info.target;
        if (dbPath) {
            const dbPattern = path_1.default.join(dbPath, '**/*');
            const dbEditorPattern = path_1.default.join(dbPath, '**', 'editor', '**/*');
            restrictions[i] = {
                importerPatterns: [dbPattern, '!' + dbEditorPattern], // TODO: 如果需要兼容就项目，则路径不能这么配置，等编辑器提供查询接口
                banSourcePatterns,
            };
        }
    }
    return restrictions;
}
/**
 * 编译项目脚本，执行环境为标准 node 环境，请不要使用 Editor 或者 Electron 接口，所以需要使用的字段都需要在外部整理好传入
 * @param options 编译引擎参数
 * @returns
 */
async function buildScriptCommand(options) {
    const res = {
        scriptPackages: [],
        importMappings: {},
    };
    if (options.bundles.length === 0) {
        return res;
    }
    const sourceMaps = options.sourceMaps;
    const ccEnvMod = Object.entries(options.ccEnvConstants).map(([k, v]) => `export const ${k} = ${v};`).join('\n');
    // https://github.com/rollup/rollup/issues/2952
    // > Currently, the assumption is that a resolved id is the absolute path of a file on the host system (including the correct slashes).
    const { bundles, modulePreservation } = options;
    const bundleCommonChunk = options.bundleCommonChunk = options.bundleCommonChunk ?? false;
    const memoryMods = {};
    const uuidMap = {}; // script uuid to url
    const fileBundleMap = {}; // script file path / prerequisite url to bundle index
    const prerequisiteModuleURLs = new Set();
    const exposedFileModuleURLs = new Set();
    const exposeEachAssetModule = options.modulePreservation === 'preserve';
    const getBundleIndexOfChunk = (chunk) => {
        let { facadeModuleId } = chunk;
        if (!facadeModuleId) {
            // This chunk does not corresponds to a module.
            // Maybe happen if it's a virtual module or it correspond to multiple modules.
            return -1;
        }
        // If the module ID is file URL like, we convert it to path.
        // If conversion failed, it's not a file module and can never be bundle file.
        let facadeModulePath = '';
        // NOTE: 转化 CJS interop module id 为原始的 module id
        let facadeModuleURLString = facadeModuleId;
        if (!facadeModuleURLString.startsWith('file:///')) {
            facadeModuleURLString = (0, url_1.pathToFileURL)(facadeModuleId).href;
        }
        const facadeModuleURL = new url_1.URL(facadeModuleURLString);
        if ((0, creator_programming_common_1.isCjsInteropUrl)(facadeModuleURL)) {
            const cjsInteropTargetURL = (0, creator_programming_common_1.getCjsInteropTarget)(facadeModuleURL);
            facadeModuleId = (0, url_1.fileURLToPath)(cjsInteropTargetURL.href);
        }
        if (!facadeModuleId.startsWith('file:///')) {
            facadeModulePath = facadeModuleId;
        }
        else {
            try {
                facadeModulePath = (0, url_1.fileURLToPath)(facadeModuleId);
            }
            catch {
                return -1;
            }
        }
        return fileBundleMap[facadeModulePath] ?? -1;
    };
    /**
     * Identify if the specified chunk corresponds to a module that should be exposed,
     * if so, return the exposed URL of the corresponding module.
     */
    const identifyExposedModule = (chunk) => {
        const { facadeModuleId } = chunk;
        if (!facadeModuleId) {
            // This chunk does not corresponds to a module.
            // Maybe happen if it's a virtual module or it correspond to multiple modules.
            return '';
        }
        // All prerequisite import modules should be exposed.
        if (prerequisiteModuleURLs.has(facadeModuleId)) {
            return facadeModuleId;
        }
        // It can be a to-be-exposed file.
        if (exposedFileModuleURLs.has(facadeModuleId)) {
            return facadeModuleId;
        }
        return '';
    };
    // Groups of entries to rollup with multiple pass
    const entryGroups = [];
    const editorPatters = options.dbInfos.map(info => path_1.default.join(info.target, '**/editor/**/*'));
    for (let iBundle = 0; iBundle < bundles.length; ++iBundle) {
        const bundle = bundles[iBundle];
        const entries = [];
        for (const script of bundle.scripts) {
            const url = (0, url_1.pathToFileURL)(script.file).href;
            uuidMap[url] = script.uuid;
            if (modulePreservation === 'facade' ||
                modulePreservation === 'preserve') {
                // If facade model is used,
                // we preserve the module structure.
                if (useEditorFolderFeature) {
                    if (!editorPatters.some(pattern => matchPattern((0, url_1.fileURLToPath)(url), pattern))) {
                        // 排除 Editor 目录下的脚本
                        entries.push(url);
                    }
                }
                else {
                    entries.push(url);
                }
            }
            fileBundleMap[script.file] = iBundle;
            if (exposeEachAssetModule) {
                exposedFileModuleURLs.add(url);
            }
        }
        const preImportsModule = `virtual:///prerequisite-imports/${bundle.id}`;
        let bundleScriptFiles = bundle.scripts.map((script) => script.file);
        if (useEditorFolderFeature) {
            bundleScriptFiles = bundleScriptFiles.filter(file => !editorPatters.some(pattern => matchPattern(file, pattern)));
        }
        memoryMods[preImportsModule] = makePrerequisiteImports(bundleScriptFiles);
        fileBundleMap[preImportsModule] = iBundle;
        entries.push(preImportsModule);
        entryGroups.push(entries);
        prerequisiteModuleURLs.add(preImportsModule);
    }
    if (!bundleCommonChunk) {
        // merge into one time rollup
        const mergedEntries = [];
        entryGroups.forEach(entries => {
            mergedEntries.push(...entries);
        });
        entryGroups.length = 0;
        entryGroups.push(mergedEntries);
    }
    const externalEditorModules = getExternalEditorModules(options.cceModuleMap);
    const importRestrictions = await genImportRestrictions(options.dbInfos, externalEditorModules);
    const modLo = new mod_lo_1.ModLo({
        targets: options.transform.targets,
        loose: options.loose,
        exportsConditions: options.exportsConditions,
        guessCommonJsExports: options.guessCommonJsExports,
        useDefineForClassFields: options.useDefineForClassFields,
        allowDeclareFields: options.allowDeclareFields,
        _internalTransform: {
            excludes: options.transform?.excludes ?? [],
            includes: options.transform?.includes ?? [],
        },
        _compressUUID: (uuid) => options.uuidCompressMap[uuid],
        _helperModule: creator_programming_rollup_plugin_mod_lo_1.default.helperModule,
        hot: options.hotModuleReload,
        importRestrictions,
        preserveSymlinks: options.preserveSymlinks,
    });
    const userImportMap = options.importMap;
    const importMap = {};
    const importMapURL = userImportMap ? new url_1.URL(userImportMap.url) : new url_1.URL('foo:/bar');
    importMap.imports = {
        'cc/env': 'virtual:/cc/env',
        'cc/userland/macro': 'virtual:/cc/userland/macro',
    };
    const assetPrefixes = [];
    for (const dbInfo of options.dbInfos) {
        const dbURL = `db://${dbInfo.dbID}/`;
        const assetDirURL = (0, url_1.pathToFileURL)(path_1.default.join(dbInfo.target, path_1.default.join(path_1.default.sep))).href;
        importMap.imports[dbURL] = assetDirURL;
        assetPrefixes.push(assetDirURL);
    }
    if (userImportMap) {
        if (userImportMap.json.imports) {
            importMap.imports = {
                ...importMap.imports,
                ...userImportMap.json.imports,
            };
        }
        if (userImportMap.json.scopes) {
            for (const [scopeRep, specifierMap] of Object.entries(userImportMap.json.scopes)) {
                const scopes = importMap.scopes ??= {};
                scopes[scopeRep] = {
                    ...(scopes[scopeRep] ?? {}),
                    ...specifierMap,
                };
            }
        }
    }
    modLo.setImportMap(importMap, importMapURL);
    modLo.setAssetPrefixes(assetPrefixes);
    modLo.addMemoryModule('virtual:/cc/env', ccEnvMod);
    // 处理自定义宏模块
    modLo.addMemoryModule('virtual:/cc/userland/macro', options.customMacroList.map((item) => `export const ${item.key} = ${item.value};`).join('\n'));
    for (const [url, code] of Object.entries(memoryMods)) {
        modLo.addMemoryModule(url, code);
    }
    for (const [url, uuid] of Object.entries(uuidMap)) {
        modLo.setUUID(url, uuid);
    }
    const rollupPlugins = [
        (0, creator_programming_rollup_plugin_mod_lo_1.default)({ modLo }),
    ];
    if (modulePreservation === 'facade' || modulePreservation === 'erase') {
        rollupPlugins.push(rpNamedChunk());
    }
    if (options.sourceMaps) {
        rollupPlugins.push((0, rollup_plugin_sourcemaps_1.default)());
    }
    if (!options.debug) {
        rollupPlugins.push((0, rollup_plugin_terser_1.terser)());
    }
    if (modulePreservation === 'erase') {
        rollupPlugins.push({
            name: 'cocos-creator/resolve-import-meta',
            resolveImportMeta(property, { moduleId }) {
                switch (property) {
                    default:
                        return undefined;
                    case 'url':
                        try {
                            const url = new url_1.URL(moduleId).href;
                            return `'${url}'`;
                        }
                        catch {
                            console.error(`Can not access import.meta.url of module '${moduleId}'. '${moduleId}' is not a valid URL.`);
                            return undefined;
                        }
                }
            },
        });
    }
    const ignoreEmptyBundleWarning = options.modulePreservation !== 'preserve';
    const rollupWarningHandler = (warning, defaultHandler) => {
        if (ignoreEmptyBundleWarning && (typeof warning === 'object') && warning.code === 'EMPTY_BUNDLE') {
            return;
        }
        if (typeof warning !== 'string') {
            if (warning.code === 'CIRCULAR_DEPENDENCY') {
                if (warning.importer?.includes('node_modules')) {
                    return;
                }
            }
        }
        // defaultHandler(warning);
        const message = typeof warning === 'object' ? (warning.message || warning) : warning;
        console.warn(`[[BuildGlobalInfo.Script.Rollup]] ${message}`);
    };
    const importMappings = {};
    // 如果开启了 bundleCommonChunk，则 iBundle 是 bundleIndex
    for (let iBundle = 0; iBundle < entryGroups.length; ++iBundle) {
        const entries = entryGroups[iBundle];
        if (bundleCommonChunk) {
            bundleIdToNameChunk = bundles[iBundle].id;
        }
        const rollupOptions = {
            input: entries,
            plugins: rollupPlugins,
            preserveModules: modulePreservation !== 'erase',
            external: ['cc'],
            onwarn: rollupWarningHandler,
        };
        const rollupBuild = await rollup.rollup(rollupOptions);
        const rollupOutputOptions = {
            sourcemap: options.sourceMaps,
            exports: 'named', // Explicitly set this to disable warning
            // about coexistence of default and named exports
        };
        if (options.modulePreservation === 'preserve') {
            rollupOutputOptions.format = options.moduleFormat;
        }
        else {
            // Facade or erase
            Object.assign(rollupOutputOptions, {
                format: 'system',
                strict: false,
                systemNullSetters: true,
            });
        }
        const rollupOutput = await rollupBuild.generate(rollupOutputOptions);
        if (options.modulePreservation === 'preserve') {
            const chunkHomeDir = options.commonDir;
            for (const chunkOrAsset of rollupOutput.output) {
                if (chunkOrAsset.type !== 'chunk') {
                    continue;
                }
                else {
                    const relativePath = chunkOrAsset.fileName.match(/\.(js|ts|mjs)$/)
                        ? chunkOrAsset.fileName
                        : `${chunkOrAsset.fileName}.js`;
                    const path = path_1.default.join(chunkHomeDir, relativePath);
                    await fs_extra_1.default.outputFile(path, chunkOrAsset.code, 'utf8');
                    const exposedURL = identifyExposedModule(chunkOrAsset);
                    if (exposedURL) {
                        // TODO: better calculation
                        const chunkPathBasedOnImportMap = `./chunks/${relativePath}`.replace(/\\/g, '/');
                        importMappings[exposedURL] = chunkPathBasedOnImportMap;
                    }
                }
            }
        }
        else if (bundleCommonChunk) {
            const bundle = bundles[iBundle];
            const entryChunkBundler = new ChunkBundler(bundle.outFile);
            for (const chunkOrAsset of rollupOutput.output) {
                if (chunkOrAsset.type !== 'chunk') {
                    continue;
                }
                entryChunkBundler.add(chunkOrAsset);
                const exposedURL = identifyExposedModule(chunkOrAsset);
                // 模块映射需要在模块内部做好，不依赖外部的 import-map，否则 bundle 将不能跨项目复用
                if (exposedURL) {
                    entryChunkBundler.addModuleMapping(exposedURL, getChunkUrl(chunkOrAsset));
                }
            }
            await entryChunkBundler.write({
                sourceMaps,
                wrap: false, // 主包把所有 System.register() 包起来，子包不包。
            });
        }
        else {
            const nonEntryChunksBundleOutFile = path_1.default.join(options.commonDir, 'bundle.js');
            const nonEntryChunkBundler = new ChunkBundler(nonEntryChunksBundleOutFile);
            let nNonEntryChunks = 0;
            const entryChunkBundlers = bundles.map((bundle) => new ChunkBundler(bundle.outFile));
            for (const chunkOrAsset of rollupOutput.output) {
                if (chunkOrAsset.type !== 'chunk') {
                    continue;
                }
                // NOTE: 一些需要 CJS interop 的模块因为插入了 interop 模块，被 rollup 解析为非入口 chunk
                const isEntry = !!chunkOrAsset.facadeModuleId && entries.includes(chunkOrAsset.facadeModuleId);
                if (!chunkOrAsset.isEntry && !isEntry) {
                    nonEntryChunkBundler.add(chunkOrAsset);
                    ++nNonEntryChunks;
                }
                else {
                    const bundleIndex = getBundleIndexOfChunk(chunkOrAsset);
                    if (bundleIndex < 0 || entryChunkBundlers[bundleIndex] === undefined) {
                        console.warn(`Unexpected: entry chunk name ${chunkOrAsset.name} is not in list.`);
                        nonEntryChunkBundler.add(chunkOrAsset);
                        ++nNonEntryChunks;
                    }
                    else {
                        entryChunkBundlers[bundleIndex].add(chunkOrAsset);
                        const exposedURL = identifyExposedModule(chunkOrAsset);
                        // 模块映射需要在模块内部做好，不依赖外部的 import-map，否则 bundle 将不能跨项目复用
                        if (exposedURL) {
                            entryChunkBundlers[bundleIndex].addModuleMapping(exposedURL, getChunkUrl(chunkOrAsset));
                        }
                    }
                }
            }
            console.debug(`Number of non-entry chunks: ${entryChunkBundlers.length}`);
            await Promise.all(entryChunkBundlers.map(async (entryChunkBundler, iEntry) => {
                await entryChunkBundler.write({
                    sourceMaps,
                    wrap: false, // 主包把所有 System.register() 包起来，子包不包。
                });
            }));
            if (nNonEntryChunks) {
                await nonEntryChunkBundler.write({
                    sourceMaps,
                    wrap: true,
                });
                const url = nonEntryChunksBundleOutFile;
                res.scriptPackages.push(url);
            }
        }
    }
    bundleIdToNameChunk = null;
    res.importMappings = importMappings;
    function makePrerequisiteImports(modules) {
        return modules.sort()
            .map((m) => {
            return `import "${(0, url_1.pathToFileURL)(m).href}";`;
        })
            .join('\n');
    }
    return res;
}
async function buildSystemJsCommand(options) {
    return await (0, module_system_1.build)({
        out: options.dest,
        // @ts-ignore TODO buildSystemJs 目前的 sourceMap 接口定义有缺失，需要发版本
        sourceMap: options.sourceMaps,
        minify: !options.debug,
        platform: options.platform,
        hmr: options.hotModuleReload,
    });
}
async function buildPolyfillsCommand(options = {}, dest) {
    const leastRequiredCoreJsModules = [
        'es.global-this', // globalThis
    ];
    // 构建 Polyfills
    const buildPolyfillsOptions = {
        debug: false,
        sourceMap: false,
        // file: ps.join(result.paths.dir, 'src', 'polyfills.bundle.js'),
        file: dest,
    };
    // Async functions polyfills
    if (options.asyncFunctions) {
        buildPolyfillsOptions.asyncFunctions = true;
    }
    // CoreJs polyfills
    if (options.coreJs) {
        buildPolyfillsOptions.coreJs = {
            modules: ['es'],
            blacklist: [],
            targets: options.targets,
        };
    }
    else {
        buildPolyfillsOptions.coreJs = {
            modules: leastRequiredCoreJsModules,
            blacklist: [],
            targets: options.targets,
        };
    }
    const hasPolyfill = await (0, build_polyfills_1.default)(buildPolyfillsOptions);
    // HACK buildPolyfills 返回值不对
    if (hasPolyfill && await (0, fs_extra_1.pathExists)(buildPolyfillsOptions.file)) {
        return true;
    }
    return false;
}
class ChunkBundler {
    _out;
    _parts = [];
    _chunkMappings = {};
    constructor(out) {
        this._out = out;
    }
    add(chunk) {
        this._parts.push([chunk.fileName, {
                code: chunk.code,
                map: chunk.map?.toString(),
            }]);
    }
    addModuleMapping(mapping, chunk) {
        this._chunkMappings[mapping] = chunk;
    }
    async write(options) {
        return await (0, pack_mods_1.packMods)(this._parts.sort(([a], [b]) => a.localeCompare(b)).map(([_, p]) => p), this._chunkMappings, this._out, options);
    }
}
function rpNamedChunk() {
    return {
        name: 'named-chunk',
        renderChunk: async function (code, chunk, options) {
            const chunkId = getChunkUrl(chunk);
            const transformResult = await babel.transformAsync(code, {
                sourceMaps: true,
                compact: false,
                plugins: [[to_named_register_1.default, { name: chunkId }]],
            });
            if (!transformResult) {
                this.warn('Failed to render chunk.');
                return null;
            }
            return {
                code: transformResult.code,
                map: transformResult.map,
            };
        },
    };
}
function getChunkUrl(chunk) {
    if (bundleIdToNameChunk) {
        // 解决 bundle 跨项目时模块命名冲突的问题
        return `bundle://${bundleIdToNameChunk}/${chunk.fileName}`;
    }
    else {
        return `chunks:///${chunk.fileName}`;
    }
}
