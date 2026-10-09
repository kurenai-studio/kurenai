"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EffectHandler = exports.autoGenEffectBinInfo = void 0;
exports.afterImport = afterImport;
exports.recompileAllEffects = recompileAllEffects;
const asset_db_1 = require("@cocos/asset-db");
const cc_1 = require("cc");
const custom_pipeline_1 = require("cc/editor/custom-pipeline");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const effect_compiler_1 = require("../../effect-compiler");
const utils_1 = require("../utils");
const zlib_1 = __importDefault(require("zlib"));
const asset_config_1 = __importDefault(require("../../asset-config"));
// 当某个头文件请求没找到，尝试把这个请求看成相对当前 effect 的路径，返回实际头文件路径再尝试找一下
const closure = { root: '', dir: '' };
effect_compiler_1.options.throwOnWarning = true; // be more strict on the user input for now
effect_compiler_1.options.skipParserTest = true; // we are guaranteed to have GL backend test here, so parser tests are not really that helpful anyways
effect_compiler_1.options.getAlternativeChunkPaths = (path) => {
    return [(0, path_1.relative)(closure.root, (0, path_1.resolve)(closure.dir, path)).replace(/\\/g, '/')];
};
// 依然没有找到时，可能是依赖头文件还没有注册，尝试去每个 DB 搜一遍
effect_compiler_1.options.chunkSearchFn = (names) => {
    const res = { name: undefined, content: undefined };
    (0, asset_db_1.forEach)((db) => {
        if (res.content !== undefined) {
            return;
        }
        for (let i = 0; i < names.length; i++) {
            // user input path first
            const name = names[i];
            const file = (0, path_1.resolve)(db.options.target, 'chunks', name + '.chunk');
            if (!(0, fs_extra_1.existsSync)(file)) {
                continue;
            }
            res.name = name;
            res.content = (0, fs_extra_1.readFileSync)(file, { encoding: 'utf-8' });
            break;
        }
    });
    return res;
};
exports.autoGenEffectBinInfo = {
    // 是否要在导入 effect 后自动重新生成 effect.bin
    autoGenEffectBin: false,
    waitingGenEffectBin: false,
    waitingGenEffectBinTimmer: null,
    effectBinPath: (0, path_1.join)(asset_config_1.default.data.tempRoot, 'effect/effect.bin'),
};
exports.EffectHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: 'effect',
    // 引擎内对应的类型
    assetType: 'cc.EffectAsset',
    createInfo: {
        generateMenuInfo() {
            return [
                {
                    label: 'i18n:ENGINE.assets.newEffect',
                    fullFileName: 'effect.effect',
                    template: `db://internal/default_file_content/${exports.EffectHandler.name}/default.effect`,
                    group: 'effect',
                    name: 'default',
                },
                {
                    label: 'i18n:ENGINE.assets.newSurfaceEffect',
                    fullFileName: 'surface-effect.effect',
                    template: `db://internal/default_file_content/${exports.EffectHandler.name}/effect-surface.effect`,
                    group: 'effect',
                    name: 'surface',
                },
            ];
        },
    },
    open: utils_1.openCode,
    customOperationMap: {
        /**
         * 编译 effect
         * @param name - 用于自定义 buildEffect 后 Effect 的名字
         * @param effectContent - 用于自定义 effect 内容
         * @return { IEffectInfo | null }
         */
        'build-effect': {
            async operator(name, effectContent) {
                try {
                    return (0, effect_compiler_1.buildEffect)(name, effectContent);
                }
                catch (e) {
                    console.error(e);
                    return null;
                }
            },
        },
        /**
         * 添加着色器片段
         * @param name - 着色器片段的名字
         * @param content - 着色器片段具体内容
         */
        'add-chunk': {
            async operator(name, content) {
                (0, effect_compiler_1.addChunk)(name, content);
            },
        },
    },
    importer: {
        // 版本号如果变更，则会强制重新导入
        version: '1.7.1',
        /**
         * 实际导入流程
         * 需要自己控制是否生成、拷贝文件
         * @param asset
         */
        async import(asset) {
            try {
                if (asset instanceof asset_db_1.Asset) {
                    await generateEffectAsset(asset, asset.source, asset.source);
                }
                else {
                    await generateEffectAsset(asset, asset.parent.source, asset.parent.getFilePath('.effect'));
                }
                return true;
            }
            catch (err) {
                console.error(err);
                return false;
            }
        },
    },
};
exports.default = exports.EffectHandler;
/**
 * 在 library 里生成对应的 effectAsset 对象
 * @param asset 资源数据
 * @param sourceFile
 */
async function generateEffectAsset(asset, assetSourceFile, effectSourceFile) {
    const target = asset._assetDB.options.target;
    closure.root = (0, path_1.join)(target, 'chunks');
    closure.dir = (0, path_1.dirname)(assetSourceFile);
    const path = (0, path_1.relative)((0, path_1.join)(target, 'effects'), closure.dir).replace(/\\/g, '/');
    const name = path + (path.length ? '/' : '') + (0, path_1.basename)(effectSourceFile, (0, path_1.extname)(effectSourceFile));
    const content = (0, fs_extra_1.readFileSync)(effectSourceFile, { encoding: 'utf-8' });
    const effect = (0, effect_compiler_1.buildEffect)(name, content);
    // 记录 effect 的头文件依赖
    (0, asset_db_1.forEach)((db) => {
        for (const header of effect.dependencies) {
            asset.depend((0, path_1.resolve)(db.options.target, 'chunks', header + '.chunk'));
        }
    });
    const result = new cc_1.EffectAsset();
    Object.assign(result, effect);
    // 引擎数据结构不变，保留 hideInEditor 属性
    if (effect.editor && effect.editor.hide) {
        result.hideInEditor = true;
    }
    // 添加 meta 文件中的 combinations
    if (asset.userData) {
        if (asset.userData.combinations) {
            result.combinations = asset.userData.combinations;
        }
        if (effect.editor) {
            asset.userData.editor = effect.editor;
        }
        else {
            // 已存在的需要清空
            asset.userData.editor = undefined;
        }
    }
    const serializeJSON = EditorExtends.serialize(result);
    await asset.saveToLibrary('.json', serializeJSON);
    const depends = (0, utils_1.getDependUUIDList)(serializeJSON);
    asset.setData('depends', depends);
    exports.autoGenEffectBinInfo.waitingGenEffectBin = true;
    if (asset._assetDB.flag.started && exports.autoGenEffectBinInfo.autoGenEffectBin) {
        // 导入 500ms 后自动重新编译所有 effect
        exports.autoGenEffectBinInfo.waitingGenEffectBinTimmer && clearTimeout(exports.autoGenEffectBinInfo.waitingGenEffectBinTimmer);
        exports.autoGenEffectBinInfo.waitingGenEffectBinTimmer = setTimeout(() => {
            afterImport();
        }, 500);
    }
}
function _rebuildDescriptorHierarchy(effectArray) {
    const effects = [];
    for (const effectAsset of effectArray) {
        // 临时文件路径
        const tempFile = (0, path_1.join)(effectAsset.temp, 'materialxxx.json');
        // 这个 temp 文件夹在资源重新导入的时候，会被清空
        // 所以判断我们的缓存是否存在，就可以知道这个资源有没有被修改，需不需要重新计算
        if ((0, fs_extra_1.existsSync)(tempFile)) {
            // 跳过之前已经计算的 effect
            continue;
        }
        effects.push(effectAsset);
    }
    return effects;
}
async function buildCustomLayout(currEffectArray, lgData) {
    // 收集所有 Descriptor 的 Visibility 信息
    const visg = new custom_pipeline_1.VisibilityGraph();
    for (const effectAsset of currEffectArray) {
        const libraryFile = effectAsset.library + '.json';
        const json = await (0, fs_extra_1.readJSON)(libraryFile);
        // @ts-ignore TS2339
        const effect = cc.deserialize(json);
        // 合并所有 effect 的 visibility 信息
        visg.mergeEffect(effect);
    }
    const lgInfo = new custom_pipeline_1.LayoutGraphInfo(visg);
    for (const effectAsset of currEffectArray) {
        // 导入后的 effectAsset json，引擎类型序列化后的数据
        const libraryFile = effectAsset.library + '.json';
        const json = await (0, fs_extra_1.readJSON)(libraryFile);
        // @ts-ignore TS2339
        const effect = cc.deserialize(json);
        // 添加 effect
        lgInfo.addEffect(effect);
    }
    if (lgInfo.build()) {
        console.error('build failed');
    }
    (0, custom_pipeline_1.buildLayoutGraphData)(lgInfo.lg, lgData);
}
/**
 * source/contributions/asset-db-hook
 * effect 导入器比较特殊，单独增加了一个在所有 effect 导入完成后的钩子
 * 这个函数名字是固定的，如果需要修改，需要一同修改 cocos-editor 仓库里的 asset-db 插件代码
 * @param effectArray
 * @param force 强制重编
 */
async function afterImport(force) {
    const effectList = [];
    (0, asset_db_1.forEach)((database) => {
        database.path2asset.forEach((asset) => {
            if (asset.meta.importer === 'effect') {
                effectList.push(asset);
            }
        });
    });
    if (effectList.length) {
        await recompileAllEffects(effectList, force);
        return;
    }
    // Fallback: scan pre-built .effect.meta files from each DB's target directory.
    // The internal DB ships with a pre-built library so effect.bin can be generated
    // even when the full import pipeline hasn't processed .effect files.
    const fallbackEffects = collectPrebuiltEffects();
    if (fallbackEffects.length) {
        console.debug(`[effect] Using ${fallbackEffects.length} pre-built effect library files`);
        await recompileAllEffects(fallbackEffects, force);
        return;
    }
    console.debug('no effect to compile');
}
function collectPrebuiltEffects() {
    const effects = [];
    for (const dbInfo of asset_config_1.default.data.assetDBList) {
        if (!dbInfo.library)
            continue;
        const effectsDir = (0, path_1.join)(dbInfo.target, 'effects');
        if (!(0, fs_extra_1.existsSync)(effectsDir))
            continue;
        try {
            const allFiles = (0, fs_extra_1.readdirSync)(effectsDir, { recursive: true, encoding: 'utf-8' });
            for (const relFile of allFiles) {
                if (!relFile.endsWith('.effect.meta'))
                    continue;
                try {
                    const meta = JSON.parse((0, fs_extra_1.readFileSync)((0, path_1.join)(effectsDir, relFile), 'utf-8'));
                    if (meta.importer !== 'effect' || !meta.imported || !meta.uuid)
                        continue;
                    const libraryPath = (0, path_1.join)(dbInfo.library, meta.uuid.substring(0, 2), meta.uuid);
                    if (!(0, fs_extra_1.existsSync)(libraryPath + '.json'))
                        continue;
                    effects.push({ imported: true, library: libraryPath });
                }
                catch { /* skip invalid meta */ }
            }
        }
        catch { /* skip inaccessible dirs */ }
    }
    return effects;
}
function forceRecompileEffects(file) {
    const data = (0, fs_extra_1.readFileSync)(file, { encoding: 'binary' });
    const effect = Buffer.from(data, 'binary');
    if (effect.length < 8) {
        console.error('effect.bin size is too small');
        return true;
    }
    // Read header
    const numVertices = effect.readUint32LE();
    // Check if engine supports compressed effect
    const isEngineSupportCompressedEffect = !!custom_pipeline_1.getLayoutGraphDataVersion;
    const isBinaryCompressed = numVertices === 0xffffffff;
    //------------------------------------------------------------------
    // Engine does not support compressed effect
    //------------------------------------------------------------------
    if (!isEngineSupportCompressedEffect) {
        // 1. Binary is compressed, need to recompile
        // 2. Binary is uncompressed, no need to recompile
        return isBinaryCompressed;
    }
    //------------------------------------------------------------------
    // Engine supports compressed effect
    //------------------------------------------------------------------
    // 3. Binary is uncompressed (Incompatible)
    if (!isBinaryCompressed) {
        return true;
    }
    // Check binary version
    // 4. Engine compressed, Binary compressed (Compatible)
    const requiredVersion = (0, custom_pipeline_1.getLayoutGraphDataVersion)();
    const binaryVersion = effect.readUint32LE(4);
    // a) Version is different
    if (binaryVersion < requiredVersion) {
        return true;
    }
    else if (binaryVersion > requiredVersion) {
        console.debug(`effect.bin version ${binaryVersion} is newer than required version ${requiredVersion}`);
        return true;
    }
    // b) Version is the same
    return false;
}
/**
 * 编译所有的 effect
 * 调用入口：source/contributions/asset-db-script
 * 调用入口：this.afterImport
 * @param effectArray
 * @param force 强制重编
 */
async function recompileAllEffects(effectArray, force) {
    const file = exports.autoGenEffectBinInfo.effectBinPath;
    // 存在等待刷新的指令或者 effect.bin 不存在时，就重新生成
    if (force || exports.autoGenEffectBinInfo.waitingGenEffectBin || !(0, fs_extra_1.existsSync)(file) || forceRecompileEffects(file)) {
        // 仅编译导入正常的 effect
        effectArray = effectArray.filter((asset) => asset.imported);
        exports.autoGenEffectBinInfo.waitingGenEffectBin = false;
        exports.autoGenEffectBinInfo.waitingGenEffectBinTimmer && clearTimeout(exports.autoGenEffectBinInfo.waitingGenEffectBinTimmer);
        const lgData = new custom_pipeline_1.LayoutGraphData();
        await buildCustomLayout(effectArray, lgData);
        // 写入一个二进制文件
        // 记得做好缓存管理，如果没有变化尽量减少 io
        await (0, fs_extra_1.ensureDir)((0, path_1.dirname)(file));
        // Serialize data
        const binaryData = new custom_pipeline_1.BinaryOutputArchive();
        (0, custom_pipeline_1.saveLayoutGraphData)(binaryData, lgData);
        const isEngineSupportCompressedEffect = !!custom_pipeline_1.getLayoutGraphDataVersion;
        if (isEngineSupportCompressedEffect) {
            // Compress data
            const compressed = zlib_1.default.deflateSync(binaryData.buffer, {
                level: zlib_1.default.constants.Z_BEST_COMPRESSION,
            });
            // Pack data
            const packedData = Buffer.alloc(compressed.length + 8);
            const version = (0, custom_pipeline_1.getLayoutGraphDataVersion)();
            packedData.writeUint32LE(0xffffffff, 0); // graph null vertex descriptor
            packedData.writeUint32LE(version, 4); // version
            packedData.set(compressed, 8); // data
            // Write to file
            await (0, fs_extra_1.writeFile)(file, packedData);
        }
        else {
            await (0, fs_extra_1.writeFile)(file, binaryData.buffer);
        }
        console.debug('recompile effect.bin success');
    }
}
