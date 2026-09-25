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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbGQtc2NyaXB0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvYnVpbGRlci93b3JrZXIvYnVpbGRlci9hc3NldC1oYW5kbGVyL3NjcmlwdC9idWlsZC1zY3JpcHQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFxRkEsZ0RBNFpDO0FBNERELG9EQVNDO0FBRUQsc0RBb0NDO0FBNWxCRCxxREFBMEM7QUFDMUMseUVBQWdGO0FBQ2hGLCtIQUFzRTtBQUN0RSxzRkFBNEQ7QUFDNUQsNkJBQXdEO0FBQ3hELG1EQUFxQztBQUNyQywrQ0FBaUM7QUFDakMsYUFBYTtBQUNiLHdGQUFvRDtBQUNwRCwrREFBOEM7QUFDOUMsNkNBQW9DO0FBQ3BDLHFEQUFpRDtBQUVqRCxrRkFBeUY7QUFDekYsd0RBQThEO0FBQzlELDZFQUFvRDtBQUdwRCwwREFBa0M7QUFnQmxDLFNBQVMsV0FBVyxDQUFDLElBQVksRUFBRSxFQUFVO0lBQ3pDLE9BQU8sSUFBQSxlQUFRLEVBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDbEQsQ0FBQztBQUVELElBQUksbUJBQWtDLENBQUM7QUFFdkMsU0FBUyxZQUFZLENBQUMsSUFBWSxFQUFFLE9BQWU7SUFDL0MsT0FBTyxJQUFBLG1CQUFTLEVBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLEVBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUM1RSxDQUFDO0FBRUQsTUFBTSxzQkFBc0IsR0FBRyxLQUFLLENBQUMsQ0FBQyxtQ0FBbUM7QUFFekUsU0FBUyx3QkFBd0IsQ0FBQyxZQUFpQztJQUMvRCxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFD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RSxJQUFJLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3ZFLENBQUM7Q0FDSjtBQUVELFNBQVMsWUFBWTtJQUNqQixPQUFPO1FBQ0gsSUFBSSxFQUFFLGFBQWE7UUFDbkIsV0FBVyxFQUFFLEtBQUssV0FBaUIsSUFBSSxFQUFFLEtBQUssRUFBRSxPQUFPO1lBRW5ELE1BQU0sT0FBTyxHQUFHLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNuQyxNQUFNLGVBQWUsR0FBRyxNQUFNLEtBQUssQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFO2dCQUNyRCxVQUFVLEVBQUUsSUFBSTtnQkFDaEIsT0FBTyxFQUFFLEtBQUs7Z0JBQ2QsT0FBTyxFQUFFLENBQUMsQ0FBQywyQkFBZSxFQUFFLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUM7YUFDbEQsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO2dCQUNuQixJQUFJLENBQUMsSUFBSSxDQUFDLHlCQUF5QixDQUFDLENBQUM7Z0JBQ3JDLE9BQU8sSUFBSSxDQUFDO1lBQ2hCLENBQUM7WUFDRCxPQUFPO2dCQUNILElBQUksRUFBRSxlQUFlLENBQUMsSUFBSztnQkFDM0IsR0FBRyxFQUFFLGVBQWUsQ0FBQyxHQUFHO2FBQzNCLENBQUM7UUFDTixDQUFDO0tBQ0osQ0FBQztBQUNOLENBQUM7QUFFRCxTQUFTLFdBQVcsQ0FBQyxLQUEyQjtJQUM1QyxJQUFJLG1CQUFtQixFQUFFLENBQUM7UUFDdEIsMEJBQTBCO1FBQzFCLE9BQU8sWUFBWSxtQkFBbUIsSUFBSSxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDL0QsQ0FBQztTQUFNLENBQUM7UUFDSixPQUFPLGFBQWEsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQ3pDLENBQUM7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGZzLCB7IHBhdGhFeGlzdHMgfSBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgeyBNb2RMbywgSW1wb3J0TWFwIH0gZnJvbSAnQGNvY29zL2NyZWF0b3ItcHJvZ3JhbW1pbmctbW9kLWxvL2xpYi9tb2QtbG8nO1xuaW1wb3J0IHJwTW9kTG8gZnJvbSAnQGNvY29zL2NyZWF0b3ItcHJvZ3JhbW1pbmctcm9sbHVwLXBsdWdpbi1tb2QtbG8nO1xuaW1wb3J0IHRvTmFtZWRSZWdpc3RlciBmcm9tICcuLi8uLi91dGlscy90by1uYW1lZC1yZWdpc3Rlcic7XG5pbXBvcnQgeyBVUkwsIHBhdGhUb0ZpbGVVUkwsIGZpbGVVUkxUb1BhdGggfSBmcm9tICd1cmwnO1xuaW1wb3J0ICogYXMgYmFiZWwgZnJvbSAnQGJhYmVsL2NvcmUnO1xuaW1wb3J0ICogYXMgcm9sbHVwIGZyb20gJ3JvbGx1cCc7XG4vLyBAdHMtaWdub3JlXG5pbXBvcnQgcnBTb3VyY2VtYXBzIGZyb20gJ3JvbGx1cC1wbHVnaW4tc291cmNlbWFwcyc7XG5pbXBvcnQgeyB0ZXJzZXIgfSBmcm9tICdyb2xsdXAtcGx1Z2luLXRlcnNlcic7XG5pbXBvcnQgcHMsIHsgcmVsYXRpdmUgfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IHBhY2tNb2RzIH0gZnJvbSAnLi4vLi4vdXRpbHMvcGFjay1tb2RzJztcbmltcG9ydCB7IENDRW52Q29uc3RhbnRzIH0gZnJvbSAnLi9idWlsZC10aW1lLWNvbnN0YW50cyc7XG5pbXBvcnQgeyBpc0Nqc0ludGVyb3BVcmwsIGdldENqc0ludGVyb3BUYXJnZXQgfSBmcm9tICdAY29jb3MvY3JlYXRvci1wcm9ncmFtbWluZy1jb21tb24nO1xuaW1wb3J0IHsgYnVpbGQgYXMgYnVpbGRTeXN0ZW1KcyB9IGZyb20gJ0Bjb2Nvcy9tb2R1bGUtc3lzdGVtJztcbmltcG9ydCBidWlsZFBvbHlmaWxscyBmcm9tICdAY29jb3MvYnVpbGQtcG9seWZpbGxzJztcbmltcG9ydCB7IElCdWlsZFN5c3RlbUpzT3B0aW9uLCBJUG9seUZpbGxzIH0gZnJvbSAnLi4vLi4vLi4vLi4vQHR5cGVzJztcbmltcG9ydCB7IElBc3NldEluZm8sIE1vZHVsZVByZXNlcnZhdGlvbiwgSVRyYW5zZm9ybVRhcmdldCB9IGZyb20gJy4uLy4uLy4uLy4uL0B0eXBlcy9wcm90ZWN0ZWQnO1xuaW1wb3J0IG1pbmltYXRjaCBmcm9tICdtaW5pbWF0Y2gnO1xuaW1wb3J0IHsgU2hhcmVkU2V0dGluZ3MgfSBmcm9tICcuLi8uLi8uLi8uLi8uLi9zY3JpcHRpbmcvaW50ZXJmYWNlJztcbmltcG9ydCB7IE1hY3JvSXRlbSB9IGZyb20gJy4uLy4uLy4uLy4uLy4uL2VuZ2luZS9AdHlwZXMvY29uZmlnJztcbmltcG9ydCB7IERCSW5mbyB9IGZyb20gJy4uLy4uLy4uLy4uLy4uL3NjcmlwdGluZy9AdHlwZXMvY29uZmlnLWV4cG9ydCc7XG5cbmludGVyZmFjZSBidWlsZFJlcyB7XG4gICAgc2NyaXB0UGFja2FnZXM6IHN0cmluZ1tdO1xuICAgIGltcG9ydE1hcHBpbmdzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xufVxuXG5pbnRlcmZhY2UgQnVuZGxlIHtcbiAgICBpZDogc3RyaW5nIHwgbnVsbDtcbiAgICBzY3JpcHRzOiBJQXNzZXRJbmZvW107XG4gICAgb3V0RmlsZTogc3RyaW5nO1xufVxuXG5mdW5jdGlvbiByZWxhdGl2ZVVybChmcm9tOiBzdHJpbmcsIHRvOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gcmVsYXRpdmUoZnJvbSwgdG8pLnJlcGxhY2UoL1xcXFwvZywgJy8nKTtcbn1cblxubGV0IGJ1bmRsZUlkVG9OYW1lQ2h1bms6IG51bGwgfCBzdHJpbmc7XG5cbmZ1bmN0aW9uIG1hdGNoUGF0dGVybihwYXRoOiBzdHJpbmcsIHBhdHRlcm46IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBtaW5pbWF0Y2gocGF0aC5yZXBsYWNlKC9cXFxcL2csICcvJyksIHBhdHRlcm4ucmVwbGFjZSgvXFxcXC9nLCAnLycpKTtcbn1cblxuY29uc3QgdXNlRWRpdG9yRm9sZGVyRmVhdHVyZSA9IGZhbHNlOyAvLyBUT0RPOiDkuYvlkI7mraPlvI/mjqXlhaXnvJbovpHlmaggRWRpdG9yIOebruW9leWQjuenu+mZpOi/meS4quW8gOWFs1xuXG5mdW5jdGlvbiBnZXRFeHRlcm5hbEVkaXRvck1vZHVsZXMoY2NlTW9kdWxlTWFwOiBSZWNvcmQ8c3RyaW5nLCBhbnk+KSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKGNjZU1vZHVsZU1hcCkuZmlsdGVyKG5hbWUgPT4gbmFtZSAhPT0gJ21hcExvY2F0aW9uJyk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdlbkltcG9ydFJlc3RyaWN0aW9ucyhkYkluZm9zOiBEQkluZm9bXSwgZXh0ZXJuYWxFZGl0b3JNb2R1bGVzOiBzdHJpbmdbXSkge1xuICAgIGlmICghdXNlRWRpdG9yRm9sZGVyRmVhdHVyZSkge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBjb25zdCByZXN0cmljdGlvbnMgPSBbXTtcbiAgICByZXN0cmljdGlvbnMubGVuZ3RoID0gMDtcbiAgICBjb25zdCBiYW5Tb3VyY2VQYXR0ZXJucyA9IFsuLi5leHRlcm5hbEVkaXRvck1vZHVsZXNdO1xuICAgIGZvciAoY29uc3QgaW5mbyBvZiBkYkluZm9zKSB7XG4gICAgICAgIGNvbnN0IGRiUGF0aCA9IGluZm8udGFyZ2V0O1xuICAgICAgICBpZiAoZGJQYXRoKSB7XG4gICAgICAgICAgICBjb25zdCBkYkVkaXRvclBhdHRlcm4gPSBwcy5qb2luKGRiUGF0aCwgJyoqJywgJ2VkaXRvcicsICcqKi8qJyk7XG4gICAgICAgICAgICBiYW5Tb3VyY2VQYXR0ZXJucy5wdXNoKGRiRWRpdG9yUGF0dGVybik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRiSW5mb3MubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgY29uc3QgaW5mbyA9IGRiSW5mb3NbaV07XG4gICAgICAgIGNvbnN0IGRiUGF0aCA9IGluZm8udGFyZ2V0O1xuICAgICAgICBpZiAoZGJQYXRoKSB7XG4gICAgICAgICAgICBjb25zdCBkYlBhdHRlcm4gPSBwcy5qb2luKGRiUGF0aCwgJyoqLyonKTtcbiAgICAgICAgICAgIGNvbnN0IGRiRWRpdG9yUGF0dGVybiA9IHBzLmpvaW4oZGJQYXRoLCAnKionLCAnZWRpdG9yJywgJyoqLyonKTtcbiAgICAgICAgICAgIHJlc3RyaWN0aW9uc1tpXSA9IHtcbiAgICAgICAgICAgICAgICBpbXBvcnRlclBhdHRlcm5zOiBbZGJQYXR0ZXJuLCAnIScgKyBkYkVkaXRvclBhdHRlcm5dLCAvLyBUT0RPOiDlpoLmnpzpnIDopoHlhbzlrrnlsLHpobnnm67vvIzliJnot6/lvoTkuI3og73ov5nkuYjphY3nva7vvIznrYnnvJbovpHlmajmj5Dkvpvmn6Xor6LmjqXlj6NcbiAgICAgICAgICAgICAgICBiYW5Tb3VyY2VQYXR0ZXJucyxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3RyaWN0aW9ucztcbn1cblxuLyoqXG4gKiDnvJbor5Hpobnnm67ohJrmnKzvvIzmiafooYznjq/looPkuLrmoIflh4Ygbm9kZSDnjq/looPvvIzor7fkuI3opoHkvb/nlKggRWRpdG9yIOaIluiAhSBFbGVjdHJvbiDmjqXlj6PvvIzmiYDku6XpnIDopoHkvb/nlKjnmoTlrZfmrrXpg73pnIDopoHlnKjlpJbpg6jmlbTnkIblpb3kvKDlhaVcbiAqIEBwYXJhbSBvcHRpb25zIOe8luivkeW8leaTjuWPguaVsFxuICogQHJldHVybnMgXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBidWlsZFNjcmlwdENvbW1hbmQoXG4gICAgb3B0aW9uczogSUJ1aWxkU2NyaXB0RnVuY3Rpb25PcHRpb24gJiBTaGFyZWRTZXR0aW5ncyxcbik6IFByb21pc2U8YnVpbGRSZXM+IHtcbiAgICBjb25zdCByZXM6IGJ1aWxkUmVzID0ge1xuICAgICAgICBzY3JpcHRQYWNrYWdlczogW10sXG4gICAgICAgIGltcG9ydE1hcHBpbmdzOiB7fSxcbiAgICB9O1xuICAgIGlmIChvcHRpb25zLmJ1bmRsZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfVxuXG4gICAgY29uc3Qgc291cmNlTWFwcyA9IG9wdGlvbnMuc291cmNlTWFwcztcbiAgICBjb25zdCBjY0Vudk1vZCA9IE9iamVjdC5lbnRyaWVzKG9wdGlvbnMuY2NFbnZDb25zdGFudHMpLm1hcCgoW2ssIHZdKSA9PiBgZXhwb3J0IGNvbnN0ICR7a30gPSAke3Z9O2ApLmpvaW4oJ1xcbicpO1xuXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3JvbGx1cC9yb2xsdXAvaXNzdWVzLzI5NTJcbiAgICAvLyA+IEN1cnJlbnRseSwgdGhlIGFzc3VtcHRpb24gaXMgdGhhdCBhIHJlc29sdmVkIGlkIGlzIHRoZSBhYnNvbHV0ZSBwYXRoIG9mIGEgZmlsZSBvbiB0aGUgaG9zdCBzeXN0ZW0gKGluY2x1ZGluZyB0aGUgY29ycmVjdCBzbGFzaGVzKS5cblxuICAgIGNvbnN0IHsgYnVuZGxlcywgbW9kdWxlUHJlc2VydmF0aW9uIH0gPSBvcHRpb25zO1xuICAgIGNvbnN0IGJ1bmRsZUNvbW1vbkNodW5rID0gb3B0aW9ucy5idW5kbGVDb21tb25DaHVuayA9IG9wdGlvbnMuYnVuZGxlQ29tbW9uQ2h1bmsgPz8gZmFsc2U7XG5cbiAgICBjb25zdCBtZW1vcnlNb2RzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG4gICAgY29uc3QgdXVpZE1hcDogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9OyAvLyBzY3JpcHQgdXVpZCB0byB1cmxcbiAgICBjb25zdCBmaWxlQnVuZGxlTWFwOiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+ID0ge307IC8vIHNjcmlwdCBmaWxlIHBhdGggLyBwcmVyZXF1aXNpdGUgdXJsIHRvIGJ1bmRsZSBpbmRleFxuICAgIGNvbnN0IHByZXJlcXVpc2l0ZU1vZHVsZVVSTHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICBjb25zdCBleHBvc2VkRmlsZU1vZHVsZVVSTHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICBjb25zdCBleHBvc2VFYWNoQXNzZXRNb2R1bGUgPSBvcHRpb25zLm1vZHVsZVByZXNlcnZhdGlvbiA9PT0gJ3ByZXNlcnZlJztcblxuICAgIGNvbnN0IGdldEJ1bmRsZUluZGV4T2ZDaHVuayA9IChjaHVuazogcm9sbHVwLk91dHB1dENodW5rKSA9PiB7XG4gICAgICAgIGxldCB7IGZhY2FkZU1vZHVsZUlkIH0gPSBjaHVuaztcblxuICAgICAgICBpZiAoIWZhY2FkZU1vZHVsZUlkKSB7XG4gICAgICAgICAgICAvLyBUaGlzIGNodW5rIGRvZXMgbm90IGNvcnJlc3BvbmRzIHRvIGEgbW9kdWxlLlxuICAgICAgICAgICAgLy8gTWF5YmUgaGFwcGVuIGlmIGl0J3MgYSB2aXJ0dWFsIG1vZHVsZSBvciBpdCBjb3JyZXNwb25kIHRvIG11bHRpcGxlIG1vZHVsZXMuXG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB0aGUgbW9kdWxlIElEIGlzIGZpbGUgVVJMIGxpa2UsIHdlIGNvbnZlcnQgaXQgdG8gcGF0aC5cbiAgICAgICAgLy8gSWYgY29udmVyc2lvbiBmYWlsZWQsIGl0J3Mgbm90IGEgZmlsZSBtb2R1bGUgYW5kIGNhbiBuZXZlciBiZSBidW5kbGUgZmlsZS5cbiAgICAgICAgbGV0IGZhY2FkZU1vZHVsZVBhdGggPSAnJztcblxuICAgICAgICAvLyBOT1RFOiDovazljJYgQ0pTIGludGVyb3AgbW9kdWxlIGlkIOS4uuWOn+Wni+eahCBtb2R1bGUgaWRcbiAgICAgICAgbGV0IGZhY2FkZU1vZHVsZVVSTFN0cmluZyA9IGZhY2FkZU1vZHVsZUlkO1xuICAgICAgICBpZiAoIWZhY2FkZU1vZHVsZVVSTFN0cmluZy5zdGFydHNXaXRoKCdmaWxlOi8vLycpKSB7XG4gICAgICAgICAgICBmYWNhZGVNb2R1bGVVUkxTdHJpbmcgPSBwYXRoVG9GaWxlVVJMKGZhY2FkZU1vZHVsZUlkKS5ocmVmO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGZhY2FkZU1vZHVsZVVSTCA9IG5ldyBVUkwoZmFjYWRlTW9kdWxlVVJMU3RyaW5nKTtcbiAgICAgICAgaWYgKGlzQ2pzSW50ZXJvcFVybChmYWNhZGVNb2R1bGVVUkwpKSB7XG4gICAgICAgICAgICBjb25zdCBjanNJbnRlcm9wVGFyZ2V0VVJMID0gZ2V0Q2pzSW50ZXJvcFRhcmdldChmYWNhZGVNb2R1bGVVUkwpO1xuICAgICAgICAgICAgZmFjYWRlTW9kdWxlSWQgPSBmaWxlVVJMVG9QYXRoKGNqc0ludGVyb3BUYXJnZXRVUkwuaHJlZik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWZhY2FkZU1vZHVsZUlkLnN0YXJ0c1dpdGgoJ2ZpbGU6Ly8vJykpIHtcbiAgICAgICAgICAgIGZhY2FkZU1vZHVsZVBhdGggPSBmYWNhZGVNb2R1bGVJZDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgZmFjYWRlTW9kdWxlUGF0aCA9IGZpbGVVUkxUb1BhdGgoZmFjYWRlTW9kdWxlSWQpO1xuICAgICAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZpbGVCdW5kbGVNYXBbZmFjYWRlTW9kdWxlUGF0aF0gPz8gLTE7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIElkZW50aWZ5IGlmIHRoZSBzcGVjaWZpZWQgY2h1bmsgY29ycmVzcG9uZHMgdG8gYSBtb2R1bGUgdGhhdCBzaG91bGQgYmUgZXhwb3NlZCxcbiAgICAgKiBpZiBzbywgcmV0dXJuIHRoZSBleHBvc2VkIFVSTCBvZiB0aGUgY29ycmVzcG9uZGluZyBtb2R1bGUuXG4gICAgICovXG4gICAgY29uc3QgaWRlbnRpZnlFeHBvc2VkTW9kdWxlID0gKGNodW5rOiByb2xsdXAuT3V0cHV0Q2h1bmspID0+IHtcbiAgICAgICAgY29uc3QgeyBmYWNhZGVNb2R1bGVJZCB9ID0gY2h1bms7XG5cbiAgICAgICAgaWYgKCFmYWNhZGVNb2R1bGVJZCkge1xuICAgICAgICAgICAgLy8gVGhpcyBjaHVuayBkb2VzIG5vdCBjb3JyZXNwb25kcyB0byBhIG1vZHVsZS5cbiAgICAgICAgICAgIC8vIE1heWJlIGhhcHBlbiBpZiBpdCdzIGEgdmlydHVhbCBtb2R1bGUgb3IgaXQgY29ycmVzcG9uZCB0byBtdWx0aXBsZSBtb2R1bGVzLlxuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQWxsIHByZXJlcXVpc2l0ZSBpbXBvcnQgbW9kdWxlcyBzaG91bGQgYmUgZXhwb3NlZC5cbiAgICAgICAgaWYgKHByZXJlcXVpc2l0ZU1vZHVsZVVSTHMuaGFzKGZhY2FkZU1vZHVsZUlkKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhY2FkZU1vZHVsZUlkO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSXQgY2FuIGJlIGEgdG8tYmUtZXhwb3NlZCBmaWxlLlxuICAgICAgICBpZiAoZXhwb3NlZEZpbGVNb2R1bGVVUkxzLmhhcyhmYWNhZGVNb2R1bGVJZCkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWNhZGVNb2R1bGVJZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAnJztcbiAgICB9O1xuXG4gICAgLy8gR3JvdXBzIG9mIGVudHJpZXMgdG8gcm9sbHVwIHdpdGggbXVsdGlwbGUgcGFzc1xuICAgIGNvbnN0IGVudHJ5R3JvdXBzOiBBcnJheTxBcnJheTxzdHJpbmc+PiA9IFtdO1xuICAgIGNvbnN0IGVkaXRvclBhdHRlcnMgPSBvcHRpb25zLmRiSW5mb3MubWFwKGluZm8gPT4gcHMuam9pbihpbmZvLnRhcmdldCwgJyoqL2VkaXRvci8qKi8qJykpO1xuICAgIGZvciAobGV0IGlCdW5kbGUgPSAwOyBpQnVuZGxlIDwgYnVuZGxlcy5sZW5ndGg7ICsraUJ1bmRsZSkge1xuICAgICAgICBjb25zdCBidW5kbGUgPSBidW5kbGVzW2lCdW5kbGVdO1xuICAgICAgICBjb25zdCBlbnRyaWVzID0gW107XG4gICAgICAgIGZvciAoY29uc3Qgc2NyaXB0IG9mIGJ1bmRsZS5zY3JpcHRzKSB7XG4gICAgICAgICAgICBjb25zdCB1cmwgPSBwYXRoVG9GaWxlVVJMKHNjcmlwdC5maWxlKS5ocmVmO1xuICAgICAgICAgICAgdXVpZE1hcFt1cmxdID0gc2NyaXB0LnV1aWQ7XG4gICAgICAgICAgICBpZiAobW9kdWxlUHJlc2VydmF0aW9uID09PSAnZmFjYWRlJyB8fFxuICAgICAgICAgICAgICAgIG1vZHVsZVByZXNlcnZhdGlvbiA9PT0gJ3ByZXNlcnZlJykge1xuICAgICAgICAgICAgICAgIC8vIElmIGZhY2FkZSBtb2RlbCBpcyB1c2VkLFxuICAgICAgICAgICAgICAgIC8vIHdlIHByZXNlcnZlIHRoZSBtb2R1bGUgc3RydWN0dXJlLlxuICAgICAgICAgICAgICAgIGlmICh1c2VFZGl0b3JGb2xkZXJGZWF0dXJlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghZWRpdG9yUGF0dGVycy5zb21lKHBhdHRlcm4gPT4gbWF0Y2hQYXR0ZXJuKGZpbGVVUkxUb1BhdGgodXJsKSwgcGF0dGVybikpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDmjpLpmaQgRWRpdG9yIOebruW9leS4i+eahOiEmuacrFxuICAgICAgICAgICAgICAgICAgICAgICAgZW50cmllcy5wdXNoKHVybCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBlbnRyaWVzLnB1c2godXJsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmaWxlQnVuZGxlTWFwW3NjcmlwdC5maWxlXSA9IGlCdW5kbGU7XG5cbiAgICAgICAgICAgIGlmIChleHBvc2VFYWNoQXNzZXRNb2R1bGUpIHtcbiAgICAgICAgICAgICAgICBleHBvc2VkRmlsZU1vZHVsZVVSTHMuYWRkKHVybCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwcmVJbXBvcnRzTW9kdWxlID0gYHZpcnR1YWw6Ly8vcHJlcmVxdWlzaXRlLWltcG9ydHMvJHtidW5kbGUuaWR9YDtcbiAgICAgICAgbGV0IGJ1bmRsZVNjcmlwdEZpbGVzID0gYnVuZGxlLnNjcmlwdHMubWFwKChzY3JpcHQpID0+IHNjcmlwdC5maWxlKTtcbiAgICAgICAgaWYgKHVzZUVkaXRvckZvbGRlckZlYXR1cmUpIHtcbiAgICAgICAgICAgIGJ1bmRsZVNjcmlwdEZpbGVzID0gYnVuZGxlU2NyaXB0RmlsZXMuZmlsdGVyKGZpbGUgPT4gIWVkaXRvclBhdHRlcnMuc29tZShwYXR0ZXJuID0+IG1hdGNoUGF0dGVybihmaWxlLCBwYXR0ZXJuKSkpO1xuICAgICAgICB9XG4gICAgICAgIG1lbW9yeU1vZHNbcHJlSW1wb3J0c01vZHVsZV0gPSBtYWtlUHJlcmVxdWlzaXRlSW1wb3J0cyhidW5kbGVTY3JpcHRGaWxlcyk7XG4gICAgICAgIGZpbGVCdW5kbGVNYXBbcHJlSW1wb3J0c01vZHVsZV0gPSBpQnVuZGxlO1xuICAgICAgICBlbnRyaWVzLnB1c2gocHJlSW1wb3J0c01vZHVsZSk7XG4gICAgICAgIGVudHJ5R3JvdXBzLnB1c2goZW50cmllcyk7XG4gICAgICAgIHByZXJlcXVpc2l0ZU1vZHVsZVVSTHMuYWRkKHByZUltcG9ydHNNb2R1bGUpO1xuICAgIH1cblxuICAgIGlmICghYnVuZGxlQ29tbW9uQ2h1bmspIHtcbiAgICAgICAgLy8gbWVyZ2UgaW50byBvbmUgdGltZSByb2xsdXBcbiAgICAgICAgY29uc3QgbWVyZ2VkRW50cmllczogQXJyYXk8c3RyaW5nPiA9IFtdO1xuICAgICAgICBlbnRyeUdyb3Vwcy5mb3JFYWNoKGVudHJpZXMgPT4ge1xuICAgICAgICAgICAgbWVyZ2VkRW50cmllcy5wdXNoKC4uLmVudHJpZXMpO1xuICAgICAgICB9KTtcbiAgICAgICAgZW50cnlHcm91cHMubGVuZ3RoID0gMDtcbiAgICAgICAgZW50cnlHcm91cHMucHVzaChtZXJnZWRFbnRyaWVzKTtcbiAgICB9XG5cbiAgICBjb25zdCBleHRlcm5hbEVkaXRvck1vZHVsZXMgPSBnZXRFeHRlcm5hbEVkaXRvck1vZHVsZXMob3B0aW9ucy5jY2VNb2R1bGVNYXApO1xuICAgIGNvbnN0IGltcG9ydFJlc3RyaWN0aW9ucyA9IGF3YWl0IGdlbkltcG9ydFJlc3RyaWN0aW9ucyhvcHRpb25zLmRiSW5mb3MsIGV4dGVybmFsRWRpdG9yTW9kdWxlcyk7XG4gICAgY29uc3QgbW9kTG8gPSBuZXcgTW9kTG8oe1xuICAgICAgICB0YXJnZXRzOiBvcHRpb25zLnRyYW5zZm9ybS50YXJnZXRzLFxuICAgICAgICBsb29zZTogb3B0aW9ucy5sb29zZSxcbiAgICAgICAgZXhwb3J0c0NvbmRpdGlvbnM6IG9wdGlvbnMuZXhwb3J0c0NvbmRpdGlvbnMsXG4gICAgICAgIGd1ZXNzQ29tbW9uSnNFeHBvcnRzOiBvcHRpb25zLmd1ZXNzQ29tbW9uSnNFeHBvcnRzLFxuICAgICAgICB1c2VEZWZpbmVGb3JDbGFzc0ZpZWxkczogb3B0aW9ucy51c2VEZWZpbmVGb3JDbGFzc0ZpZWxkcyxcbiAgICAgICAgYWxsb3dEZWNsYXJlRmllbGRzOiBvcHRpb25zLmFsbG93RGVjbGFyZUZpZWxkcyxcbiAgICAgICAgX2ludGVybmFsVHJhbnNmb3JtOiB7XG4gICAgICAgICAgICBleGNsdWRlczogb3B0aW9ucy50cmFuc2Zvcm0/LmV4Y2x1ZGVzID8/IFtdLFxuICAgICAgICAgICAgaW5jbHVkZXM6IG9wdGlvbnMudHJhbnNmb3JtPy5pbmNsdWRlcyA/PyBbXSxcbiAgICAgICAgfSxcbiAgICAgICAgX2NvbXByZXNzVVVJRDogKHV1aWQ6IHN0cmluZykgPT4gb3B0aW9ucy51dWlkQ29tcHJlc3NNYXBbdXVpZF0sXG4gICAgICAgIF9oZWxwZXJNb2R1bGU6IHJwTW9kTG8uaGVscGVyTW9kdWxlLFxuICAgICAgICBob3Q6IG9wdGlvbnMuaG90TW9kdWxlUmVsb2FkLFxuICAgICAgICBpbXBvcnRSZXN0cmljdGlvbnMsXG4gICAgICAgIHByZXNlcnZlU3ltbGlua3M6IG9wdGlvbnMucHJlc2VydmVTeW1saW5rcyxcbiAgICB9KTtcblxuICAgIGNvbnN0IHVzZXJJbXBvcnRNYXAgPSBvcHRpb25zLmltcG9ydE1hcDtcblxuICAgIGNvbnN0IGltcG9ydE1hcDogSW1wb3J0TWFwID0ge307XG4gICAgY29uc3QgaW1wb3J0TWFwVVJMID0gdXNlckltcG9ydE1hcCA/IG5ldyBVUkwodXNlckltcG9ydE1hcC51cmwpIDogbmV3IFVSTCgnZm9vOi9iYXInKTtcblxuICAgIGltcG9ydE1hcC5pbXBvcnRzID0ge1xuICAgICAgICAnY2MvZW52JzogJ3ZpcnR1YWw6L2NjL2VudicsXG4gICAgICAgICdjYy91c2VybGFuZC9tYWNybyc6ICd2aXJ0dWFsOi9jYy91c2VybGFuZC9tYWNybycsXG4gICAgfTtcblxuICAgIGNvbnN0IGFzc2V0UHJlZml4ZXM6IHN0cmluZ1tdID0gW107XG4gICAgZm9yIChjb25zdCBkYkluZm8gb2Ygb3B0aW9ucy5kYkluZm9zKSB7XG4gICAgICAgIGNvbnN0IGRiVVJMID0gYGRiOi8vJHtkYkluZm8uZGJJRH0vYDtcbiAgICAgICAgY29uc3QgYXNzZXREaXJVUkwgPSBwYXRoVG9GaWxlVVJMKHBzLmpvaW4oZGJJbmZvLnRhcmdldCwgcHMuam9pbihwcy5zZXApKSkuaHJlZjtcbiAgICAgICAgaW1wb3J0TWFwLmltcG9ydHNbZGJVUkxdID0gYXNzZXREaXJVUkw7XG4gICAgICAgIGFzc2V0UHJlZml4ZXMucHVzaChhc3NldERpclVSTCk7XG4gICAgfVxuXG4gICAgaWYgKHVzZXJJbXBvcnRNYXApIHtcbiAgICAgICAgaWYgKHVzZXJJbXBvcnRNYXAuanNvbi5pbXBvcnRzKSB7XG4gICAgICAgICAgICBpbXBvcnRNYXAuaW1wb3J0cyA9IHtcbiAgICAgICAgICAgICAgICAuLi5pbXBvcnRNYXAuaW1wb3J0cyxcbiAgICAgICAgICAgICAgICAuLi51c2VySW1wb3J0TWFwLmpzb24uaW1wb3J0cyxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHVzZXJJbXBvcnRNYXAuanNvbi5zY29wZXMpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgW3Njb3BlUmVwLCBzcGVjaWZpZXJNYXBdIG9mIE9iamVjdC5lbnRyaWVzKHVzZXJJbXBvcnRNYXAuanNvbi5zY29wZXMpKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2NvcGVzID0gaW1wb3J0TWFwLnNjb3BlcyA/Pz0ge307XG4gICAgICAgICAgICAgICAgc2NvcGVzW3Njb3BlUmVwXSA9IHtcbiAgICAgICAgICAgICAgICAgICAgLi4uKHNjb3Blc1tzY29wZVJlcF0gPz8ge30pLFxuICAgICAgICAgICAgICAgICAgICAuLi5zcGVjaWZpZXJNYXAsXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIG1vZExvLnNldEltcG9ydE1hcChpbXBvcnRNYXAsIGltcG9ydE1hcFVSTCk7XG4gICAgbW9kTG8uc2V0QXNzZXRQcmVmaXhlcyhhc3NldFByZWZpeGVzKTtcblxuICAgIG1vZExvLmFkZE1lbW9yeU1vZHVsZSgndmlydHVhbDovY2MvZW52JywgY2NFbnZNb2QpO1xuXG4gICAgLy8g5aSE55CG6Ieq5a6a5LmJ5a6P5qih5Z2XXG4gICAgbW9kTG8uYWRkTWVtb3J5TW9kdWxlKCd2aXJ0dWFsOi9jYy91c2VybGFuZC9tYWNybycsXG4gICAgICAgIG9wdGlvbnMuY3VzdG9tTWFjcm9MaXN0Lm1hcCgoaXRlbTogYW55KSA9PiBgZXhwb3J0IGNvbnN0ICR7aXRlbS5rZXl9ID0gJHtpdGVtLnZhbHVlfTtgKS5qb2luKCdcXG4nKSk7XG5cbiAgICBmb3IgKGNvbnN0IFt1cmwsIGNvZGVdIG9mIE9iamVjdC5lbnRyaWVzKG1lbW9yeU1vZHMpKSB7XG4gICAgICAgIG1vZExvLmFkZE1lbW9yeU1vZHVsZSh1cmwsIGNvZGUpO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgW3VybCwgdXVpZF0gb2YgT2JqZWN0LmVudHJpZXModXVpZE1hcCkpIHtcbiAgICAgICAgbW9kTG8uc2V0VVVJRCh1cmwsIHV1aWQpO1xuICAgIH1cblxuICAgIGNvbnN0IHJvbGx1cFBsdWdpbnM6IHJvbGx1cC5QbHVnaW5bXSA9IFtcbiAgICAgICAgcnBNb2RMbyh7IG1vZExvIH0pLFxuICAgIF07XG4gICAgaWYgKG1vZHVsZVByZXNlcnZhdGlvbiA9PT0gJ2ZhY2FkZScgfHwgbW9kdWxlUHJlc2VydmF0aW9uID09PSAnZXJhc2UnKSB7XG4gICAgICAgIHJvbGx1cFBsdWdpbnMucHVzaChycE5hbWVkQ2h1bmsoKSk7XG4gICAgfVxuICAgIGlmIChvcHRpb25zLnNvdXJjZU1hcHMpIHtcbiAgICAgICAgcm9sbHVwUGx1Z2lucy5wdXNoKHJwU291cmNlbWFwcygpKTtcbiAgICB9XG4gICAgaWYgKCFvcHRpb25zLmRlYnVnKSB7XG4gICAgICAgIHJvbGx1cFBsdWdpbnMucHVzaChcbiAgICAgICAgICAgIHRlcnNlcigpLFxuICAgICAgICAgICAgLy8gVE9ET1xuICAgICAgICApO1xuICAgIH1cblxuICAgIGlmIChtb2R1bGVQcmVzZXJ2YXRpb24gPT09ICdlcmFzZScpIHtcbiAgICAgICAgcm9sbHVwUGx1Z2lucy5wdXNoKHtcbiAgICAgICAgICAgIG5hbWU6ICdjb2Nvcy1jcmVhdG9yL3Jlc29sdmUtaW1wb3J0LW1ldGEnLFxuICAgICAgICAgICAgcmVzb2x2ZUltcG9ydE1ldGEocHJvcGVydHksIHsgbW9kdWxlSWQgfSkge1xuICAgICAgICAgICAgICAgIHN3aXRjaCAocHJvcGVydHkpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3VybCc6XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHVybCA9IG5ldyBVUkwobW9kdWxlSWQpLmhyZWY7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGAnJHt1cmx9J2A7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBDYW4gbm90IGFjY2VzcyBpbXBvcnQubWV0YS51cmwgb2YgbW9kdWxlICcke21vZHVsZUlkfScuICcke21vZHVsZUlkfScgaXMgbm90IGEgdmFsaWQgVVJMLmApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgaWdub3JlRW1wdHlCdW5kbGVXYXJuaW5nID0gb3B0aW9ucy5tb2R1bGVQcmVzZXJ2YXRpb24gIT09ICdwcmVzZXJ2ZSc7XG5cbiAgICBjb25zdCByb2xsdXBXYXJuaW5nSGFuZGxlcjogcm9sbHVwLldhcm5pbmdIYW5kbGVyV2l0aERlZmF1bHQgPSAod2FybmluZywgZGVmYXVsdEhhbmRsZXIpID0+IHtcbiAgICAgICAgaWYgKGlnbm9yZUVtcHR5QnVuZGxlV2FybmluZyAmJiAodHlwZW9mIHdhcm5pbmcgPT09ICdvYmplY3QnKSAmJiB3YXJuaW5nLmNvZGUgPT09ICdFTVBUWV9CVU5ETEUnKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIHdhcm5pbmcgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBpZiAod2FybmluZy5jb2RlID09PSAnQ0lSQ1VMQVJfREVQRU5ERU5DWScpIHtcbiAgICAgICAgICAgICAgICBpZiAod2FybmluZy5pbXBvcnRlcj8uaW5jbHVkZXMoJ25vZGVfbW9kdWxlcycpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBkZWZhdWx0SGFuZGxlcih3YXJuaW5nKTtcbiAgICAgICAgY29uc3QgbWVzc2FnZSA9IHR5cGVvZiB3YXJuaW5nID09PSAnb2JqZWN0JyA/ICh3YXJuaW5nLm1lc3NhZ2UgfHwgd2FybmluZykgOiB3YXJuaW5nO1xuICAgICAgICBjb25zb2xlLndhcm4oYFtbQnVpbGRHbG9iYWxJbmZvLlNjcmlwdC5Sb2xsdXBdXSAke21lc3NhZ2V9YCk7XG4gICAgfTtcblxuICAgIGNvbnN0IGltcG9ydE1hcHBpbmdzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG4gICAgLy8g5aaC5p6c5byA5ZCv5LqGIGJ1bmRsZUNvbW1vbkNodW5r77yM5YiZIGlCdW5kbGUg5pivIGJ1bmRsZUluZGV4XG4gICAgZm9yIChsZXQgaUJ1bmRsZSA9IDA7IGlCdW5kbGUgPCBlbnRyeUdyb3Vwcy5sZW5ndGg7ICsraUJ1bmRsZSkge1xuICAgICAgICBjb25zdCBlbnRyaWVzID0gZW50cnlHcm91cHNbaUJ1bmRsZV07XG5cbiAgICAgICAgaWYgKGJ1bmRsZUNvbW1vbkNodW5rKSB7XG4gICAgICAgICAgICBidW5kbGVJZFRvTmFtZUNodW5rID0gYnVuZGxlc1tpQnVuZGxlXS5pZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJvbGx1cE9wdGlvbnM6IHJvbGx1cC5Sb2xsdXBPcHRpb25zID0ge1xuICAgICAgICAgICAgaW5wdXQ6IGVudHJpZXMsXG4gICAgICAgICAgICBwbHVnaW5zOiByb2xsdXBQbHVnaW5zLFxuICAgICAgICAgICAgcHJlc2VydmVNb2R1bGVzOiBtb2R1bGVQcmVzZXJ2YXRpb24gIT09ICdlcmFzZScsXG4gICAgICAgICAgICBleHRlcm5hbDogWydjYyddLFxuICAgICAgICAgICAgb253YXJuOiByb2xsdXBXYXJuaW5nSGFuZGxlcixcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCByb2xsdXBCdWlsZCA9IGF3YWl0IHJvbGx1cC5yb2xsdXAocm9sbHVwT3B0aW9ucyk7XG5cbiAgICAgICAgY29uc3Qgcm9sbHVwT3V0cHV0T3B0aW9uczogcm9sbHVwLk91dHB1dE9wdGlvbnMgPSB7XG4gICAgICAgICAgICBzb3VyY2VtYXA6IG9wdGlvbnMuc291cmNlTWFwcyxcbiAgICAgICAgICAgIGV4cG9ydHM6ICduYW1lZCcsIC8vIEV4cGxpY2l0bHkgc2V0IHRoaXMgdG8gZGlzYWJsZSB3YXJuaW5nXG4gICAgICAgICAgICAvLyBhYm91dCBjb2V4aXN0ZW5jZSBvZiBkZWZhdWx0IGFuZCBuYW1lZCBleHBvcnRzXG4gICAgICAgIH07XG4gICAgICAgIGlmIChvcHRpb25zLm1vZHVsZVByZXNlcnZhdGlvbiA9PT0gJ3ByZXNlcnZlJykge1xuICAgICAgICAgICAgcm9sbHVwT3V0cHV0T3B0aW9ucy5mb3JtYXQgPSBvcHRpb25zLm1vZHVsZUZvcm1hdDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIEZhY2FkZSBvciBlcmFzZVxuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihyb2xsdXBPdXRwdXRPcHRpb25zLCB7XG4gICAgICAgICAgICAgICAgZm9ybWF0OiAnc3lzdGVtJyxcbiAgICAgICAgICAgICAgICBzdHJpY3Q6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHN5c3RlbU51bGxTZXR0ZXJzOiB0cnVlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByb2xsdXBPdXRwdXQgPSBhd2FpdCByb2xsdXBCdWlsZC5nZW5lcmF0ZShyb2xsdXBPdXRwdXRPcHRpb25zKTtcblxuICAgICAgICBpZiAob3B0aW9ucy5tb2R1bGVQcmVzZXJ2YXRpb24gPT09ICdwcmVzZXJ2ZScpIHtcbiAgICAgICAgICAgIGNvbnN0IGNodW5rSG9tZURpciA9IG9wdGlvbnMuY29tbW9uRGlyO1xuXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGNodW5rT3JBc3NldCBvZiByb2xsdXBPdXRwdXQub3V0cHV0KSB7XG4gICAgICAgICAgICAgICAgaWYgKGNodW5rT3JBc3NldC50eXBlICE9PSAnY2h1bmsnKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlbGF0aXZlUGF0aCA9IGNodW5rT3JBc3NldC5maWxlTmFtZS5tYXRjaCgvXFwuKGpzfHRzfG1qcykkLylcbiAgICAgICAgICAgICAgICAgICAgICAgID8gY2h1bmtPckFzc2V0LmZpbGVOYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICA6IGAke2NodW5rT3JBc3NldC5maWxlTmFtZX0uanNgO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhdGggPSBwcy5qb2luKGNodW5rSG9tZURpciwgcmVsYXRpdmVQYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgZnMub3V0cHV0RmlsZShcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBjaHVua09yQXNzZXQuY29kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICd1dGY4JyxcbiAgICAgICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAgICAgICBjb25zdCBleHBvc2VkVVJMID0gaWRlbnRpZnlFeHBvc2VkTW9kdWxlKGNodW5rT3JBc3NldCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChleHBvc2VkVVJMKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBiZXR0ZXIgY2FsY3VsYXRpb25cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNodW5rUGF0aEJhc2VkT25JbXBvcnRNYXAgPSBgLi9jaHVua3MvJHtyZWxhdGl2ZVBhdGh9YC5yZXBsYWNlKC9cXFxcL2csICcvJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbXBvcnRNYXBwaW5nc1tleHBvc2VkVVJMXSA9IGNodW5rUGF0aEJhc2VkT25JbXBvcnRNYXA7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoYnVuZGxlQ29tbW9uQ2h1bmspIHtcbiAgICAgICAgICAgIGNvbnN0IGJ1bmRsZSA9IGJ1bmRsZXNbaUJ1bmRsZV07XG4gICAgICAgICAgICBjb25zdCBlbnRyeUNodW5rQnVuZGxlcjogQ2h1bmtCdW5kbGVyID0gbmV3IENodW5rQnVuZGxlcihidW5kbGUub3V0RmlsZSk7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGNodW5rT3JBc3NldCBvZiByb2xsdXBPdXRwdXQub3V0cHV0KSB7XG4gICAgICAgICAgICAgICAgaWYgKGNodW5rT3JBc3NldC50eXBlICE9PSAnY2h1bmsnKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbnRyeUNodW5rQnVuZGxlci5hZGQoY2h1bmtPckFzc2V0KTtcbiAgICAgICAgICAgICAgICBjb25zdCBleHBvc2VkVVJMID0gaWRlbnRpZnlFeHBvc2VkTW9kdWxlKGNodW5rT3JBc3NldCk7XG4gICAgICAgICAgICAgICAgLy8g5qih5Z2X5pig5bCE6ZyA6KaB5Zyo5qih5Z2X5YaF6YOo5YGa5aW977yM5LiN5L6d6LWW5aSW6YOo55qEIGltcG9ydC1tYXDvvIzlkKbliJkgYnVuZGxlIOWwhuS4jeiDvei3qOmhueebruWkjeeUqFxuICAgICAgICAgICAgICAgIGlmIChleHBvc2VkVVJMKSB7XG4gICAgICAgICAgICAgICAgICAgIGVudHJ5Q2h1bmtCdW5kbGVyLmFkZE1vZHVsZU1hcHBpbmcoZXhwb3NlZFVSTCwgZ2V0Q2h1bmtVcmwoY2h1bmtPckFzc2V0KSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYXdhaXQgZW50cnlDaHVua0J1bmRsZXIud3JpdGUoe1xuICAgICAgICAgICAgICAgIHNvdXJjZU1hcHMsXG4gICAgICAgICAgICAgICAgd3JhcDogZmFsc2UsIC8vIOS4u+WMheaKiuaJgOaciSBTeXN0ZW0ucmVnaXN0ZXIoKSDljIXotbfmnaXvvIzlrZDljIXkuI3ljIXjgIJcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3Qgbm9uRW50cnlDaHVua3NCdW5kbGVPdXRGaWxlID0gcHMuam9pbihvcHRpb25zLmNvbW1vbkRpciwgJ2J1bmRsZS5qcycpO1xuICAgICAgICAgICAgY29uc3Qgbm9uRW50cnlDaHVua0J1bmRsZXIgPSBuZXcgQ2h1bmtCdW5kbGVyKG5vbkVudHJ5Q2h1bmtzQnVuZGxlT3V0RmlsZSk7XG4gICAgICAgICAgICBsZXQgbk5vbkVudHJ5Q2h1bmtzID0gMDtcbiAgICAgICAgICAgIGNvbnN0IGVudHJ5Q2h1bmtCdW5kbGVyczogQ2h1bmtCdW5kbGVyW10gPSBidW5kbGVzLm1hcCgoYnVuZGxlKSA9PiBuZXcgQ2h1bmtCdW5kbGVyKGJ1bmRsZS5vdXRGaWxlKSk7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGNodW5rT3JBc3NldCBvZiByb2xsdXBPdXRwdXQub3V0cHV0KSB7XG4gICAgICAgICAgICAgICAgaWYgKGNodW5rT3JBc3NldC50eXBlICE9PSAnY2h1bmsnKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBOT1RFOiDkuIDkupvpnIDopoEgQ0pTIGludGVyb3Ag55qE5qih5Z2X5Zug5Li65o+S5YWl5LqGIGludGVyb3Ag5qih5Z2X77yM6KKrIHJvbGx1cCDop6PmnpDkuLrpnZ7lhaXlj6MgY2h1bmtcbiAgICAgICAgICAgICAgICBjb25zdCBpc0VudHJ5ID0gISFjaHVua09yQXNzZXQuZmFjYWRlTW9kdWxlSWQgJiYgZW50cmllcy5pbmNsdWRlcyhjaHVua09yQXNzZXQuZmFjYWRlTW9kdWxlSWQpO1xuICAgICAgICAgICAgICAgIGlmICghY2h1bmtPckFzc2V0LmlzRW50cnkgJiYgIWlzRW50cnkpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9uRW50cnlDaHVua0J1bmRsZXIuYWRkKGNodW5rT3JBc3NldCk7XG4gICAgICAgICAgICAgICAgICAgICsrbk5vbkVudHJ5Q2h1bmtzO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGJ1bmRsZUluZGV4ID0gZ2V0QnVuZGxlSW5kZXhPZkNodW5rKGNodW5rT3JBc3NldCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChidW5kbGVJbmRleCA8IDAgfHwgZW50cnlDaHVua0J1bmRsZXJzW2J1bmRsZUluZGV4XSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYFVuZXhwZWN0ZWQ6IGVudHJ5IGNodW5rIG5hbWUgJHtjaHVua09yQXNzZXQubmFtZX0gaXMgbm90IGluIGxpc3QuYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBub25FbnRyeUNodW5rQnVuZGxlci5hZGQoY2h1bmtPckFzc2V0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICsrbk5vbkVudHJ5Q2h1bmtzO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgZW50cnlDaHVua0J1bmRsZXJzW2J1bmRsZUluZGV4XS5hZGQoY2h1bmtPckFzc2V0KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZXhwb3NlZFVSTCA9IGlkZW50aWZ5RXhwb3NlZE1vZHVsZShjaHVua09yQXNzZXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5qih5Z2X5pig5bCE6ZyA6KaB5Zyo5qih5Z2X5YaF6YOo5YGa5aW977yM5LiN5L6d6LWW5aSW6YOo55qEIGltcG9ydC1tYXDvvIzlkKbliJkgYnVuZGxlIOWwhuS4jeiDvei3qOmhueebruWkjeeUqFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV4cG9zZWRVUkwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnRyeUNodW5rQnVuZGxlcnNbYnVuZGxlSW5kZXhdLmFkZE1vZHVsZU1hcHBpbmcoZXhwb3NlZFVSTCwgZ2V0Q2h1bmtVcmwoY2h1bmtPckFzc2V0KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYE51bWJlciBvZiBub24tZW50cnkgY2h1bmtzOiAke2VudHJ5Q2h1bmtCdW5kbGVycy5sZW5ndGh9YCk7XG4gICAgICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChlbnRyeUNodW5rQnVuZGxlcnMubWFwKGFzeW5jIChlbnRyeUNodW5rQnVuZGxlciwgaUVudHJ5KSA9PiB7XG4gICAgICAgICAgICAgICAgYXdhaXQgZW50cnlDaHVua0J1bmRsZXIud3JpdGUoe1xuICAgICAgICAgICAgICAgICAgICBzb3VyY2VNYXBzLFxuICAgICAgICAgICAgICAgICAgICB3cmFwOiBmYWxzZSwgLy8g5Li75YyF5oqK5omA5pyJIFN5c3RlbS5yZWdpc3RlcigpIOWMhei1t+adpe+8jOWtkOWMheS4jeWMheOAglxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgaWYgKG5Ob25FbnRyeUNodW5rcykge1xuICAgICAgICAgICAgICAgIGF3YWl0IG5vbkVudHJ5Q2h1bmtCdW5kbGVyLndyaXRlKHtcbiAgICAgICAgICAgICAgICAgICAgc291cmNlTWFwcyxcbiAgICAgICAgICAgICAgICAgICAgd3JhcDogdHJ1ZSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCB1cmwgPSBub25FbnRyeUNodW5rc0J1bmRsZU91dEZpbGU7XG4gICAgICAgICAgICAgICAgcmVzLnNjcmlwdFBhY2thZ2VzLnB1c2godXJsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGJ1bmRsZUlkVG9OYW1lQ2h1bmsgPSBudWxsO1xuICAgIHJlcy5pbXBvcnRNYXBwaW5ncyA9IGltcG9ydE1hcHBpbmdzO1xuXG4gICAgZnVuY3Rpb24gbWFrZVByZXJlcXVpc2l0ZUltcG9ydHMobW9kdWxlczogc3RyaW5nW10pIHtcbiAgICAgICAgcmV0dXJuIG1vZHVsZXMuc29ydCgpXG4gICAgICAgICAgICAubWFwKChtKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGBpbXBvcnQgXCIke3BhdGhUb0ZpbGVVUkwobSkuaHJlZn1cIjtgO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5qb2luKCdcXG4nKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJQnVpbGRTY3JpcHRGdW5jdGlvbk9wdGlvbiB7XG4gICAgLyoqXG4gICAgICogQXJlIHdlIGluIGRlYnVnIG1vZGU/XG4gICAgICovXG4gICAgZGVidWc6IGJvb2xlYW47XG5cbiAgICAvKipcbiAgICAgKiBXaGV0aGVyIHRvIGdlbmVyYXRlIHNvdXJjZSBtYXBzIG9yIG5vdC5cbiAgICAgKi9cbiAgICBzb3VyY2VNYXBzOiBib29sZWFuIHwgJ2lubGluZSc7XG5cbiAgICAvKipcbiAgICAgKiBNb2R1bGUgZm9ybWF0LlxuICAgICAqL1xuICAgIG1vZHVsZUZvcm1hdDogcm9sbHVwLk1vZHVsZUZvcm1hdDtcblxuICAgIC8qKlxuICAgICAqIE1vZHVsZSBwcmVzZXJ2YXRpb24uXG4gICAgICovXG4gICAgbW9kdWxlUHJlc2VydmF0aW9uOiBNb2R1bGVQcmVzZXJ2YXRpb247XG5cbiAgICAvKipcbiAgICAgKiAhIUV4cGVyaW1lbnRhbC5cbiAgICAgKi9cbiAgICB0cmFuc2Zvcm06IFRyYW5zZm9ybU9wdGlvbnM7XG5cbiAgICAvKipcbiAgICAgKiBBbGwgc3ViLXBhY2thZ2VzLlxuICAgICAqL1xuICAgIGJ1bmRsZXM6IEFycmF5PEJ1bmRsZT47XG5cbiAgICAvKipcbiAgICAgKiBSb290IG91dHB1dCBkaXJlY3RvcnkuXG4gICAgICovXG4gICAgY29tbW9uRGlyOiBzdHJpbmc7XG5cbiAgICBob3RNb2R1bGVSZWxvYWQ6IGJvb2xlYW47XG5cbiAgICBhcHBsaWNhdGlvbkpTOiBzdHJpbmc7XG5cbiAgICBkYkluZm9zOiBEQkluZm9bXTtcblxuICAgIHV1aWRDb21wcmVzc01hcDogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcblxuICAgIGN1c3RvbU1hY3JvTGlzdDogTWFjcm9JdGVtW107XG5cbiAgICBjY0VudkNvbnN0YW50czogQ0NFbnZDb25zdGFudHM7XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIG9wdGlvbiB3aWxsIGJ1bmRsZSBleHRlcm5hbCBjaHVuayBpbnRvIGVhY2ggYnVuZGxlJ3MgY2h1bmsgaW4gb3JkZXIgdG8gYWNoaWV2ZSB0aGUgcHVycG9zZSBvZiBjcm9zcy1wcm9qZWN0IHJldXNlIG9mIHRoZSBidW5kbGUuXG4gICAgICogVGhpcyB3aWxsIGluY3JlYXNlIHRoZSBzaXplIG9mIHRoZSBidW5kbGUgYW5kIGludHJvZHVjZSB0aGUgaXNzdWUgb2YgY2h1bmsgZG9wcGVsZ2FuZ2VyLCBzbyB1c2UgaXQgd2l0aCBjYXV0aW9uLlxuICAgICAqIEBkZWZhdWx0IGZhbHNlXG4gICAgICovXG4gICAgYnVuZGxlQ29tbW9uQ2h1bms/OiBib29sZWFuO1xuXG4gICAgY2NlTW9kdWxlTWFwOiBSZWNvcmQ8c3RyaW5nLCBhbnk+O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYnVpbGRTeXN0ZW1Kc0NvbW1hbmQob3B0aW9uczogSUJ1aWxkU3lzdGVtSnNPcHRpb24pIHtcbiAgICByZXR1cm4gYXdhaXQgYnVpbGRTeXN0ZW1Kcyh7XG4gICAgICAgIG91dDogb3B0aW9ucy5kZXN0LFxuICAgICAgICAvLyBAdHMtaWdub3JlIFRPRE8gYnVpbGRTeXN0ZW1KcyDnm67liY3nmoQgc291cmNlTWFwIOaOpeWPo+WumuS5ieaciee8uuWkse+8jOmcgOimgeWPkeeJiOacrFxuICAgICAgICBzb3VyY2VNYXA6IG9wdGlvbnMuc291cmNlTWFwcyxcbiAgICAgICAgbWluaWZ5OiAhb3B0aW9ucy5kZWJ1ZyxcbiAgICAgICAgcGxhdGZvcm06IG9wdGlvbnMucGxhdGZvcm0sXG4gICAgICAgIGhtcjogb3B0aW9ucy5ob3RNb2R1bGVSZWxvYWQsXG4gICAgfSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBidWlsZFBvbHlmaWxsc0NvbW1hbmQob3B0aW9uczogSVBvbHlGaWxscyA9IHt9LCBkZXN0OiBzdHJpbmcpIHtcblxuICAgIGNvbnN0IGxlYXN0UmVxdWlyZWRDb3JlSnNNb2R1bGVzOiBzdHJpbmdbXSA9IFtcbiAgICAgICAgJ2VzLmdsb2JhbC10aGlzJywgLy8gZ2xvYmFsVGhpc1xuICAgIF07XG4gICAgLy8g5p6E5bu6IFBvbHlmaWxsc1xuICAgIGNvbnN0IGJ1aWxkUG9seWZpbGxzT3B0aW9uczogYnVpbGRQb2x5ZmlsbHMuT3B0aW9ucyA9IHtcbiAgICAgICAgZGVidWc6IGZhbHNlLFxuICAgICAgICBzb3VyY2VNYXA6IGZhbHNlLFxuICAgICAgICAvLyBmaWxlOiBwcy5qb2luKHJlc3VsdC5wYXRocy5kaXIsICdzcmMnLCAncG9seWZpbGxzLmJ1bmRsZS5qcycpLFxuICAgICAgICBmaWxlOiBkZXN0LFxuICAgIH07XG4gICAgLy8gQXN5bmMgZnVuY3Rpb25zIHBvbHlmaWxsc1xuICAgIGlmIChvcHRpb25zLmFzeW5jRnVuY3Rpb25zKSB7XG4gICAgICAgIGJ1aWxkUG9seWZpbGxzT3B0aW9ucy5hc3luY0Z1bmN0aW9ucyA9IHRydWU7XG4gICAgfVxuICAgIC8vIENvcmVKcyBwb2x5ZmlsbHNcbiAgICBpZiAob3B0aW9ucy5jb3JlSnMpIHtcbiAgICAgICAgYnVpbGRQb2x5ZmlsbHNPcHRpb25zLmNvcmVKcyA9IHtcbiAgICAgICAgICAgIG1vZHVsZXM6IFsnZXMnXSxcbiAgICAgICAgICAgIGJsYWNrbGlzdDogW10sXG4gICAgICAgICAgICB0YXJnZXRzOiBvcHRpb25zLnRhcmdldHMsXG4gICAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgYnVpbGRQb2x5ZmlsbHNPcHRpb25zLmNvcmVKcyA9IHtcbiAgICAgICAgICAgIG1vZHVsZXM6IGxlYXN0UmVxdWlyZWRDb3JlSnNNb2R1bGVzLFxuICAgICAgICAgICAgYmxhY2tsaXN0OiBbXSxcbiAgICAgICAgICAgIHRhcmdldHM6IG9wdGlvbnMudGFyZ2V0cyxcbiAgICAgICAgfTtcbiAgICB9XG4gICAgY29uc3QgaGFzUG9seWZpbGwgPSBhd2FpdCBidWlsZFBvbHlmaWxscyhidWlsZFBvbHlmaWxsc09wdGlvbnMpO1xuICAgIC8vIEhBQ0sgYnVpbGRQb2x5ZmlsbHMg6L+U5Zue5YC85LiN5a+5XG4gICAgaWYgKGhhc1BvbHlmaWxsICYmIGF3YWl0IHBhdGhFeGlzdHMoYnVpbGRQb2x5ZmlsbHNPcHRpb25zLmZpbGUpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG5leHBvcnQgaW50ZXJmYWNlIFRyYW5zZm9ybU9wdGlvbnMge1xuICAgIC8qKlxuICAgICAqIEJhYmVsIHBsdWdpbnMgdG8gZXhjbHVkZWQuIFdpbGwgYmUgcGFzc2VkIHRvIGFzIHBhcnRpYWwgYGV4Y2x1ZGVgIG9wdGlvbnMgb2YgYEBiYWJlbC9wcmVzZXQtZW52YC5cbiAgICAgKi9cbiAgICBleGNsdWRlcz86IEFycmF5PHN0cmluZyB8IFJlZ0V4cD47XG5cbiAgICAvKipcbiAgICAgKiBCYWJlbCBwbHVnaW5zIHRvIGluY2x1ZGVkLiBXaWxsIGJlIHBhc3NlZCB0byBhcyBwYXJ0aWFsIGBpbmNsdWRlYCBvcHRpb25zIG9mIGBAYmFiZWwvcHJlc2V0LWVudmAuXG4gICAgICovXG4gICAgaW5jbHVkZXM/OiBBcnJheTxzdHJpbmcgfCBSZWdFeHA+O1xuXG4gICAgdGFyZ2V0cz86IElUcmFuc2Zvcm1UYXJnZXQ7XG59XG5cbmNsYXNzIENodW5rQnVuZGxlciB7XG4gICAgcHJpdmF0ZSBfb3V0OiBzdHJpbmc7XG4gICAgcHJpdmF0ZSBfcGFydHM6IEFycmF5PFtzdHJpbmcgLyogZm9yIHNvcnQgb25seSwgdG8gZW5zdXJlIHRoZSBvcmRlciAqLywge1xuICAgICAgICBjb2RlOiBzdHJpbmc7XG4gICAgICAgIG1hcD86IHN0cmluZztcbiAgICB9XT4gPSBbXTtcbiAgICBwcml2YXRlIF9jaHVua01hcHBpbmdzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG5cbiAgICBjb25zdHJ1Y3RvcihvdXQ6IHN0cmluZykge1xuICAgICAgICB0aGlzLl9vdXQgPSBvdXQ7XG4gICAgfVxuXG4gICAgYWRkKGNodW5rOiByb2xsdXAuT3V0cHV0Q2h1bmspIHtcbiAgICAgICAgdGhpcy5fcGFydHMucHVzaChbY2h1bmsuZmlsZU5hbWUsIHtcbiAgICAgICAgICAgIGNvZGU6IGNodW5rLmNvZGUsXG4gICAgICAgICAgICBtYXA6IGNodW5rLm1hcD8udG9TdHJpbmcoKSxcbiAgICAgICAgfV0pO1xuICAgIH1cblxuICAgIGFkZE1vZHVsZU1hcHBpbmcobWFwcGluZzogc3RyaW5nLCBjaHVuazogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMuX2NodW5rTWFwcGluZ3NbbWFwcGluZ10gPSBjaHVuaztcbiAgICB9XG5cbiAgICBhc3luYyB3cml0ZShvcHRpb25zOiB7IHNvdXJjZU1hcHM6IGJvb2xlYW4gfCAnaW5saW5lJywgd3JhcD86IGJvb2xlYW4gfSkge1xuICAgICAgICByZXR1cm4gYXdhaXQgcGFja01vZHMoXG4gICAgICAgICAgICB0aGlzLl9wYXJ0cy5zb3J0KFxuICAgICAgICAgICAgICAgIChbYV0sIFtiXSkgPT4gYS5sb2NhbGVDb21wYXJlKGIpLFxuICAgICAgICAgICAgKS5tYXAoKFtfLCBwXSkgPT4gcCksIHRoaXMuX2NodW5rTWFwcGluZ3MsIHRoaXMuX291dCwgb3B0aW9ucyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBycE5hbWVkQ2h1bmsoKTogcm9sbHVwLlBsdWdpbiB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgbmFtZTogJ25hbWVkLWNodW5rJyxcbiAgICAgICAgcmVuZGVyQ2h1bms6IGFzeW5jIGZ1bmN0aW9uICh0aGlzLCBjb2RlLCBjaHVuaywgb3B0aW9ucykge1xuXG4gICAgICAgICAgICBjb25zdCBjaHVua0lkID0gZ2V0Q2h1bmtVcmwoY2h1bmspO1xuICAgICAgICAgICAgY29uc3QgdHJhbnNmb3JtUmVzdWx0ID0gYXdhaXQgYmFiZWwudHJhbnNmb3JtQXN5bmMoY29kZSwge1xuICAgICAgICAgICAgICAgIHNvdXJjZU1hcHM6IHRydWUsXG4gICAgICAgICAgICAgICAgY29tcGFjdDogZmFsc2UsXG4gICAgICAgICAgICAgICAgcGx1Z2luczogW1t0b05hbWVkUmVnaXN0ZXIsIHsgbmFtZTogY2h1bmtJZCB9XV0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmICghdHJhbnNmb3JtUmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy53YXJuKCdGYWlsZWQgdG8gcmVuZGVyIGNodW5rLicpO1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBjb2RlOiB0cmFuc2Zvcm1SZXN1bHQuY29kZSEsXG4gICAgICAgICAgICAgICAgbWFwOiB0cmFuc2Zvcm1SZXN1bHQubWFwLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBnZXRDaHVua1VybChjaHVuazogcm9sbHVwLlJlbmRlcmVkQ2h1bmspIHtcbiAgICBpZiAoYnVuZGxlSWRUb05hbWVDaHVuaykge1xuICAgICAgICAvLyDop6PlhrMgYnVuZGxlIOi3qOmhueebruaXtuaooeWdl+WRveWQjeWGsueqgeeahOmXrumimFxuICAgICAgICByZXR1cm4gYGJ1bmRsZTovLyR7YnVuZGxlSWRUb05hbWVDaHVua30vJHtjaHVuay5maWxlTmFtZX1gO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBgY2h1bmtzOi8vLyR7Y2h1bmsuZmlsZU5hbWV9YDtcbiAgICB9XG59XG4iXX0=