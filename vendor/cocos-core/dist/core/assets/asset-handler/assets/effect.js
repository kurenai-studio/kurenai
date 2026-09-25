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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWZmZWN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvYXNzZXRzL2Fzc2V0LWhhbmRsZXIvYXNzZXRzL2VmZmVjdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUE2UUEsa0NBdUJDO0FBa0ZELGtEQXdDQztBQTVaRCw4Q0FBMEQ7QUFFMUQsMkJBQWlDO0FBQ2pDLCtEQVFtQztBQUNuQyx1Q0FBZ0g7QUFDaEgsK0JBQTJFO0FBQzNFLDJEQUF1RTtBQUV2RSxvQ0FBdUQ7QUFDdkQsZ0RBQXdCO0FBQ3hCLHNFQUE2QztBQU03Qyx1REFBdUQ7QUFDdkQsTUFBTSxPQUFPLEdBQUcsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsQ0FBQztBQUN0Qyx5QkFBTyxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUMsQ0FBQywyQ0FBMkM7QUFDMUUseUJBQU8sQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLENBQUMsc0dBQXNHO0FBQ3JJLHlCQUFPLENBQUMsd0JBQXdCLEdBQUcsQ0FBQyxJQUFZLEVBQUUsRUFBRTtJQUNoRCxPQUFPLENBQUMsSUFBQSxlQUFRLEVBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxJQUFBLGNBQU8sRUFBQyxPQUFPLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ3BGLENBQUMsQ0FBQztBQUNGLHFDQUFxQztBQUNyQyx5QkFBTyxDQUFDLGFBQWEsR0FBRyxDQUFDLEtBQWUsRUFBRSxFQUFFO0lBQ3hDLE1BQU0sR0FBRyxHQUFlLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFLENBQUM7SUFDaEUsSUFBQSxrQkFBTyxFQUFDLENBQUMsRUFBVyxFQUFFLEVBQUU7UUFDcEIsSUFBSSxHQUFHLENBQUMsT0FBTyxLQUFLLFNBQVMsRUFB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Q0wsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIiBcblxuaW1wb3J0IHsgQXNzZXQsIEFzc2V0REIsIGZvckVhY2ggfSBmcm9tICdAY29jb3MvYXNzZXQtZGInO1xuaW1wb3J0IHsgQXNzZXRIYW5kbGVyLCBJQXNzZXQgfSBmcm9tICcuLi8uLi9AdHlwZXMvcHJvdGVjdGVkJztcbmltcG9ydCB7IEVmZmVjdEFzc2V0IH0gZnJvbSAnY2MnO1xuaW1wb3J0IHtcbiAgICBCaW5hcnlPdXRwdXRBcmNoaXZlLFxuICAgIExheW91dEdyYXBoRGF0YSxcbiAgICBzYXZlTGF5b3V0R3JhcGhEYXRhLFxuICAgIFZpc2liaWxpdHlHcmFwaCxcbiAgICBMYXlvdXRHcmFwaEluZm8sXG4gICAgYnVpbGRMYXlvdXRHcmFwaERhdGEsXG4gICAgZ2V0TGF5b3V0R3JhcGhEYXRhVmVyc2lvbixcbn0gZnJvbSAnY2MvZWRpdG9yL2N1c3RvbS1waXBlbGluZSc7XG5pbXBvcnQgeyBleGlzdHNTeW5jLCByZWFkRmlsZVN5bmMsIHJlYWRkaXJTeW5jLCB3cml0ZUZpbGVTeW5jLCBlbnN1cmVEaXIsIHJlYWRKU09OLCB3cml0ZUZpbGUgfSBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgeyBiYXNlbmFtZSwgZGlybmFtZSwgZXh0bmFtZSwgam9pbiwgcmVsYXRpdmUsIHJlc29sdmUgfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IGJ1aWxkRWZmZWN0LCBvcHRpb25zLCBhZGRDaHVuayB9IGZyb20gJy4uLy4uL2VmZmVjdC1jb21waWxlcic7XG5cbmltcG9ydCB7IGdldERlcGVuZFVVSURMaXN0LCBvcGVuQ29kZSB9IGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCB6bGliIGZyb20gJ3psaWInO1xuaW1wb3J0IGFzc2V0Q29uZmlnIGZyb20gJy4uLy4uL2Fzc2V0LWNvbmZpZyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUNodW5rSW5mbyB7XG4gICAgbmFtZTogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICAgIGNvbnRlbnQ6IHN0cmluZyB8IHVuZGVmaW5lZDtcbn1cbi8vIOW9k+afkOS4quWktOaWh+S7tuivt+axguayoeaJvuWIsO+8jOWwneivleaKiui/meS4quivt+axgueci+aIkOebuOWvueW9k+WJjSBlZmZlY3Qg55qE6Lev5b6E77yM6L+U5Zue5a6e6ZmF5aS05paH5Lu26Lev5b6E5YaN5bCd6K+V5om+5LiA5LiLXG5jb25zdCBjbG9zdXJlID0geyByb290OiAnJywgZGlyOiAnJyB9O1xub3B0aW9ucy50aHJvd09uV2FybmluZyA9IHRydWU7IC8vIGJlIG1vcmUgc3RyaWN0IG9uIHRoZSB1c2VyIGlucHV0IGZvciBub3dcbm9wdGlvbnMuc2tpcFBhcnNlclRlc3QgPSB0cnVlOyAvLyB3ZSBhcmUgZ3VhcmFudGVlZCB0byBoYXZlIEdMIGJhY2tlbmQgdGVzdCBoZXJlLCBzbyBwYXJzZXIgdGVzdHMgYXJlIG5vdCByZWFsbHkgdGhhdCBoZWxwZnVsIGFueXdheXNcbm9wdGlvbnMuZ2V0QWx0ZXJuYXRpdmVDaHVua1BhdGhzID0gKHBhdGg6IHN0cmluZykgPT4ge1xuICAgIHJldHVybiBbcmVsYXRpdmUoY2xvc3VyZS5yb290LCByZXNvbHZlKGNsb3N1cmUuZGlyLCBwYXRoKSkucmVwbGFjZSgvXFxcXC9nLCAnLycpXTtcbn07XG4vLyDkvp3nhLbmsqHmnInmib7liLDml7bvvIzlj6/og73mmK/kvp3otZblpLTmlofku7bov5jmsqHmnInms6jlhozvvIzlsJ3or5Xljrvmr4/kuKogREIg5pCc5LiA6YGNXG5vcHRpb25zLmNodW5rU2VhcmNoRm4gPSAobmFtZXM6IHN0cmluZ1tdKSA9PiB7XG4gICAgY29uc3QgcmVzOiBJQ2h1bmtJbmZvID0geyBuYW1lOiB1bmRlZmluZWQsIGNvbnRlbnQ6IHVuZGVmaW5lZCB9O1xuICAgIGZvckVhY2goKGRiOiBBc3NldERCKSA9PiB7XG4gICAgICAgIGlmIChyZXMuY29udGVudCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgLy8gdXNlciBpbnB1dCBwYXRoIGZpcnN0XG4gICAgICAgICAgICBjb25zdCBuYW1lID0gbmFtZXNbaV07XG4gICAgICAgICAgICBjb25zdCBmaWxlID0gcmVzb2x2ZShkYi5vcHRpb25zLnRhcmdldCwgJ2NodW5rcycsIG5hbWUgKyAnLmNodW5rJyk7XG4gICAgICAgICAgICBpZiAoIWV4aXN0c1N5bmMoZmlsZSkpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlcy5uYW1lID0gbmFtZTtcbiAgICAgICAgICAgIHJlcy5jb250ZW50ID0gcmVhZEZpbGVTeW5jKGZpbGUsIHsgZW5jb2Rpbmc6ICd1dGYtOCcgfSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiByZXM7XG59O1xuXG5leHBvcnQgY29uc3QgYXV0b0dlbkVmZmVjdEJpbkluZm86IHtcbiAgICBhdXRvR2VuRWZmZWN0QmluOiBib29sZWFuO1xuICAgIHdhaXRpbmdHZW5FZmZlY3RCaW46IGJvb2xlYW47XG4gICAgd2FpdGluZ0dlbkVmZmVjdEJpblRpbW1lcjogTm9kZUpTLlRpbWVvdXQgfCBudWxsO1xuICAgIGVmZmVjdEJpblBhdGg6IHN0cmluZztcbn0gPSB7XG4gICAgLy8g5piv5ZCm6KaB5Zyo5a+85YWlIGVmZmVjdCDlkI7oh6rliqjph43mlrDnlJ/miJAgZWZmZWN0LmJpblxuICAgIGF1dG9HZW5FZmZlY3RCaW46IGZhbHNlLFxuICAgIHdhaXRpbmdHZW5FZmZlY3RCaW46IGZhbHNlLFxuICAgIHdhaXRpbmdHZW5FZmZlY3RCaW5UaW1tZXI6IG51bGwsXG4gICAgZWZmZWN0QmluUGF0aDogam9pbihhc3NldENvbmZpZy5kYXRhLnRlbXBSb290LCAnZWZmZWN0L2VmZmVjdC5iaW4nKSxcbn07XG5cbmV4cG9ydCBjb25zdCBFZmZlY3RIYW5kbGVyOiBBc3NldEhhbmRsZXIgPSB7XG4gICAgLy8gSGFuZGxlciDnmoTlkI3lrZfvvIznlKjkuo7mjIflrpogSGFuZGxlciBhcyDnrYlcbiAgICBuYW1lOiAnZWZmZWN0JyxcblxuICAgIC8vIOW8leaTjuWGheWvueW6lOeahOexu+Wei1xuICAgIGFzc2V0VHlwZTogJ2NjLkVmZmVjdEFzc2V0JyxcblxuICAgIGNyZWF0ZUluZm86IHtcbiAgICAgICAgZ2VuZXJhdGVNZW51SW5mbygpIHtcbiAgICAgICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ2kxOG46RU5HSU5FLmFzc2V0cy5uZXdFZmZlY3QnLFxuICAgICAgICAgICAgICAgICAgICBmdWxsRmlsZU5hbWU6ICdlZmZlY3QuZWZmZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGU6IGBkYjovL2ludGVybmFsL2RlZmF1bHRfZmlsZV9jb250ZW50LyR7RWZmZWN0SGFuZGxlci5uYW1lfS9kZWZhdWx0LmVmZmVjdGAsXG4gICAgICAgICAgICAgICAgICAgIGdyb3VwOiAnZWZmZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogJ2RlZmF1bHQnLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ2kxOG46RU5HSU5FLmFzc2V0cy5uZXdTdXJmYWNlRWZmZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgZnVsbEZpbGVOYW1lOiAnc3VyZmFjZS1lZmZlY3QuZWZmZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGU6IGBkYjovL2ludGVybmFsL2RlZmF1bHRfZmlsZV9jb250ZW50LyR7RWZmZWN0SGFuZGxlci5uYW1lfS9lZmZlY3Qtc3VyZmFjZS5lZmZlY3RgLFxuICAgICAgICAgICAgICAgICAgICBncm91cDogJ2VmZmVjdCcsXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICdzdXJmYWNlJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXTtcbiAgICAgICAgfSxcbiAgICB9LFxuXG4gICAgb3Blbjogb3BlbkNvZGUsXG5cbiAgICBjdXN0b21PcGVyYXRpb25NYXA6IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIOe8luivkSBlZmZlY3RcbiAgICAgICAgICogQHBhcmFtIG5hbWUgLSDnlKjkuo7oh6rlrprkuYkgYnVpbGRFZmZlY3Qg5ZCOIEVmZmVjdCDnmoTlkI3lrZdcbiAgICAgICAgICogQHBhcmFtIGVmZmVjdENvbnRlbnQgLSDnlKjkuo7oh6rlrprkuYkgZWZmZWN0IOWGheWuuVxuICAgICAgICAgKiBAcmV0dXJuIHsgSUVmZmVjdEluZm8gfCBudWxsIH1cbiAgICAgICAgICovXG4gICAgICAgICdidWlsZC1lZmZlY3QnOiB7XG4gICAgICAgICAgICBhc3luYyBvcGVyYXRvcihuYW1lOiBzdHJpbmcsIGVmZmVjdENvbnRlbnQ6IHN0cmluZykge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBidWlsZEVmZmVjdChuYW1lLCBlZmZlY3RDb250ZW50KTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOa3u+WKoOedgOiJsuWZqOeJh+autVxuICAgICAgICAgKiBAcGFyYW0gbmFtZSAtIOedgOiJsuWZqOeJh+auteeahOWQjeWtl1xuICAgICAgICAgKiBAcGFyYW0gY29udGVudCAtIOedgOiJsuWZqOeJh+auteWFt+S9k+WGheWuuVxuICAgICAgICAgKi9cbiAgICAgICAgJ2FkZC1jaHVuayc6IHtcbiAgICAgICAgICAgIGFzeW5jIG9wZXJhdG9yKG5hbWU6IHN0cmluZywgY29udGVudDogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgYWRkQ2h1bmsobmFtZSwgY29udGVudCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgIH0sXG5cbiAgICBpbXBvcnRlcjoge1xuICAgICAgICAvLyDniYjmnKzlj7flpoLmnpzlj5jmm7TvvIzliJnkvJrlvLrliLbph43mlrDlr7zlhaVcbiAgICAgICAgdmVyc2lvbjogJzEuNy4xJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICog5a6e6ZmF5a+85YWl5rWB56iLXG4gICAgICAgICAqIOmcgOimgeiHquW3seaOp+WItuaYr+WQpueUn+aIkOOAgeaLt+i0neaWh+S7tlxuICAgICAgICAgKiBAcGFyYW0gYXNzZXRcbiAgICAgICAgICovXG4gICAgICAgIGFzeW5jIGltcG9ydChhc3NldDogSUFzc2V0KSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGlmIChhc3NldCBpbnN0YW5jZW9mIEFzc2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGdlbmVyYXRlRWZmZWN0QXNzZXQoYXNzZXQsIGFzc2V0LnNvdXJjZSwgYXNzZXQuc291cmNlKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBnZW5lcmF0ZUVmZmVjdEFzc2V0KGFzc2V0LCBhc3NldC5wYXJlbnQhLnNvdXJjZSwgYXNzZXQucGFyZW50IS5nZXRGaWxlUGF0aCgnLmVmZmVjdCcpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgIH0sXG59O1xuXG5leHBvcnQgZGVmYXVsdCBFZmZlY3RIYW5kbGVyO1xuXG4vKipcbiAqIOWcqCBsaWJyYXJ5IOmHjOeUn+aIkOWvueW6lOeahCBlZmZlY3RBc3NldCDlr7nosaFcbiAqIEBwYXJhbSBhc3NldCDotYTmupDmlbDmja5cbiAqIEBwYXJhbSBzb3VyY2VGaWxlXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGdlbmVyYXRlRWZmZWN0QXNzZXQoYXNzZXQ6IElBc3NldCwgYXNzZXRTb3VyY2VGaWxlOiBzdHJpbmcsIGVmZmVjdFNvdXJjZUZpbGU6IHN0cmluZykge1xuICAgIGNvbnN0IHRhcmdldCA9IGFzc2V0Ll9hc3NldERCLm9wdGlvbnMudGFyZ2V0O1xuICAgIGNsb3N1cmUucm9vdCA9IGpvaW4odGFyZ2V0LCAnY2h1bmtzJyk7XG4gICAgY2xvc3VyZS5kaXIgPSBkaXJuYW1lKGFzc2V0U291cmNlRmlsZSk7XG4gICAgY29uc3QgcGF0aCA9IHJlbGF0aXZlKGpvaW4odGFyZ2V0LCAnZWZmZWN0cycpLCBjbG9zdXJlLmRpcikucmVwbGFjZSgvXFxcXC9nLCAnLycpO1xuICAgIGNvbnN0IG5hbWUgPSBwYXRoICsgKHBhdGgubGVuZ3RoID8gJy8nIDogJycpICsgYmFzZW5hbWUoZWZmZWN0U291cmNlRmlsZSwgZXh0bmFtZShlZmZlY3RTb3VyY2VGaWxlKSk7XG5cbiAgICBjb25zdCBjb250ZW50ID0gcmVhZEZpbGVTeW5jKGVmZmVjdFNvdXJjZUZpbGUsIHsgZW5jb2Rpbmc6ICd1dGYtOCcgfSk7XG4gICAgY29uc3QgZWZmZWN0ID0gYnVpbGRFZmZlY3QobmFtZSwgY29udGVudCk7XG5cbiAgICAvLyDorrDlvZUgZWZmZWN0IOeahOWktOaWh+S7tuS+nei1llxuICAgIGZvckVhY2goKGRiOiBBc3NldERCKSA9PiB7XG4gICAgICAgIGZvciAoY29uc3QgaGVhZGVyIG9mIGVmZmVjdC5kZXBlbmRlbmNpZXMpIHtcbiAgICAgICAgICAgIGFzc2V0LmRlcGVuZChyZXNvbHZlKGRiLm9wdGlvbnMudGFyZ2V0LCAnY2h1bmtzJywgaGVhZGVyICsgJy5jaHVuaycpKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29uc3QgcmVzdWx0ID0gbmV3IEVmZmVjdEFzc2V0KCk7XG4gICAgT2JqZWN0LmFzc2lnbihyZXN1bHQsIGVmZmVjdCk7XG5cbiAgICAvLyDlvJXmk47mlbDmja7nu5PmnoTkuI3lj5jvvIzkv53nlZkgaGlkZUluRWRpdG9yIOWxnuaAp1xuICAgIGlmIChlZmZlY3QuZWRpdG9yICYmIGVmZmVjdC5lZGl0b3IuaGlkZSkge1xuICAgICAgICByZXN1bHQuaGlkZUluRWRpdG9yID0gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyDmt7vliqAgbWV0YSDmlofku7bkuK3nmoQgY29tYmluYXRpb25zXG4gICAgaWYgKGFzc2V0LnVzZXJEYXRhKSB7XG4gICAgICAgIGlmIChhc3NldC51c2VyRGF0YS5jb21iaW5hdGlvbnMpIHtcbiAgICAgICAgICAgIHJlc3VsdC5jb21iaW5hdGlvbnMgPSBhc3NldC51c2VyRGF0YS5jb21iaW5hdGlvbnM7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZWZmZWN0LmVkaXRvcikge1xuICAgICAgICAgICAgYXNzZXQudXNlckRhdGEuZWRpdG9yID0gZWZmZWN0LmVkaXRvcjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIOW3suWtmOWcqOeahOmcgOimgea4heepulxuICAgICAgICAgICAgYXNzZXQudXNlckRhdGEuZWRpdG9yID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY29uc3Qgc2VyaWFsaXplSlNPTiA9IEVkaXRvckV4dGVuZHMuc2VyaWFsaXplKHJlc3VsdCk7XG4gICAgYXdhaXQgYXNzZXQuc2F2ZVRvTGlicmFyeSgnLmpzb24nLCBzZXJpYWxpemVKU09OKTtcblxuICAgIGNvbnN0IGRlcGVuZHMgPSBnZXREZXBlbmRVVUlETGlzdChzZXJpYWxpemVKU09OKTtcbiAgICBhc3NldC5zZXREYXRhKCdkZXBlbmRzJywgZGVwZW5kcyk7XG4gICAgYXV0b0dlbkVmZmVjdEJpbkluZm8ud2FpdGluZ0dlbkVmZmVjdEJpbiA9IHRydWU7XG5cbiAgICBpZiAoYXNzZXQuX2Fzc2V0REIuZmxhZy5zdGFydGVkICYmIGF1dG9HZW5FZmZlY3RCaW5JbmZvLmF1dG9HZW5FZmZlY3RCaW4pIHtcbiAgICAgICAgLy8g5a+85YWlIDUwMG1zIOWQjuiHquWKqOmHjeaWsOe8luivkeaJgOaciSBlZmZlY3RcbiAgICAgICAgYXV0b0dlbkVmZmVjdEJpbkluZm8ud2FpdGluZ0dlbkVmZmVjdEJpblRpbW1lciAmJiBjbGVhclRpbWVvdXQoYXV0b0dlbkVmZmVjdEJpbkluZm8ud2FpdGluZ0dlbkVmZmVjdEJpblRpbW1lcik7XG4gICAgICAgIGF1dG9HZW5FZmZlY3RCaW5JbmZvLndhaXRpbmdHZW5FZmZlY3RCaW5UaW1tZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIGFmdGVySW1wb3J0KCk7XG4gICAgICAgIH0sIDUwMCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBfcmVidWlsZERlc2NyaXB0b3JIaWVyYXJjaHkoZWZmZWN0QXJyYXk6IEFzc2V0W10pIHtcbiAgICBjb25zdCBlZmZlY3RzID0gW107XG4gICAgZm9yIChjb25zdCBlZmZlY3RBc3NldCBvZiBlZmZlY3RBcnJheSkge1xuICAgICAgICAvLyDkuLTml7bmlofku7bot6/lvoRcbiAgICAgICAgY29uc3QgdGVtcEZpbGUgPSBqb2luKGVmZmVjdEFzc2V0LnRlbXAsICdtYXRlcmlhbHh4eC5qc29uJyk7XG4gICAgICAgIC8vIOi/meS4qiB0ZW1wIOaWh+S7tuWkueWcqOi1hOa6kOmHjeaWsOWvvOWFpeeahOaXtuWAme+8jOS8muiiq+a4heepulxuICAgICAgICAvLyDmiYDku6XliKTmlq3miJHku6znmoTnvJPlrZjmmK/lkKblrZjlnKjvvIzlsLHlj6/ku6Xnn6XpgZPov5nkuKrotYTmupDmnInmsqHmnInooqvkv67mlLnvvIzpnIDkuI3pnIDopoHph43mlrDorqHnrpdcbiAgICAgICAgaWYgKGV4aXN0c1N5bmModGVtcEZpbGUpKSB7XG4gICAgICAgICAgICAvLyDot7Pov4fkuYvliY3lt7Lnu4/orqHnrpfnmoQgZWZmZWN0XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBlZmZlY3RzLnB1c2goZWZmZWN0QXNzZXQpO1xuICAgIH1cbiAgICByZXR1cm4gZWZmZWN0cztcbn1cblxuYXN5bmMgZnVuY3Rpb24gYnVpbGRDdXN0b21MYXlvdXQoY3VyckVmZmVjdEFycmF5OiBBc3NldFtdLCBsZ0RhdGE6IExheW91dEdyYXBoRGF0YSkge1xuICAgIC8vIOaUtumbhuaJgOaciSBEZXNjcmlwdG9yIOeahCBWaXNpYmlsaXR5IOS/oeaBr1xuICAgIGNvbnN0IHZpc2cgPSBuZXcgVmlzaWJpbGl0eUdyYXBoKCk7XG4gICAgZm9yIChjb25zdCBlZmZlY3RBc3NldCBvZiBjdXJyRWZmZWN0QXJyYXkpIHtcbiAgICAgICAgY29uc3QgbGlicmFyeUZpbGUgPSBlZmZlY3RBc3NldC5saWJyYXJ5ICsgJy5qc29uJztcbiAgICAgICAgY29uc3QganNvbiA9IGF3YWl0IHJlYWRKU09OKGxpYnJhcnlGaWxlKTtcbiAgICAgICAgLy8gQHRzLWlnbm9yZSBUUzIzMzlcbiAgICAgICAgY29uc3QgZWZmZWN0ID0gY2MuZGVzZXJpYWxpemUoanNvbikgYXMgRWZmZWN0QXNzZXQ7XG4gICAgICAgIC8vIOWQiOW5tuaJgOaciSBlZmZlY3Qg55qEIHZpc2liaWxpdHkg5L+h5oGvXG4gICAgICAgIHZpc2cubWVyZ2VFZmZlY3QoZWZmZWN0KTtcbiAgICB9XG5cbiAgICBjb25zdCBsZ0luZm8gPSBuZXcgTGF5b3V0R3JhcGhJbmZvKHZpc2cpO1xuICAgIGZvciAoY29uc3QgZWZmZWN0QXNzZXQgb2YgY3VyckVmZmVjdEFycmF5KSB7XG4gICAgICAgIC8vIOWvvOWFpeWQjueahCBlZmZlY3RBc3NldCBqc29u77yM5byV5pOO57G75Z6L5bqP5YiX5YyW5ZCO55qE5pWw5o2uXG4gICAgICAgIGNvbnN0IGxpYnJhcnlGaWxlID0gZWZmZWN0QXNzZXQubGlicmFyeSArICcuanNvbic7XG5cbiAgICAgICAgY29uc3QganNvbiA9IGF3YWl0IHJlYWRKU09OKGxpYnJhcnlGaWxlKTtcblxuICAgICAgICAvLyBAdHMtaWdub3JlIFRTMjMzOVxuICAgICAgICBjb25zdCBlZmZlY3QgPSBjYy5kZXNlcmlhbGl6ZShqc29uKSBhcyBFZmZlY3RBc3NldDtcblxuICAgICAgICAvLyDmt7vliqAgZWZmZWN0XG4gICAgICAgIGxnSW5mby5hZGRFZmZlY3QoZWZmZWN0KTtcbiAgICB9XG4gICAgaWYgKGxnSW5mby5idWlsZCgpKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ2J1aWxkIGZhaWxlZCcpO1xuICAgIH1cbiAgICBidWlsZExheW91dEdyYXBoRGF0YShsZ0luZm8ubGcsIGxnRGF0YSk7XG59XG5cbi8qKiBcbiAqIHNvdXJjZS9jb250cmlidXRpb25zL2Fzc2V0LWRiLWhvb2tcbiAqIGVmZmVjdCDlr7zlhaXlmajmr5TovoPnibnmrorvvIzljZXni6zlop7liqDkuobkuIDkuKrlnKjmiYDmnIkgZWZmZWN0IOWvvOWFpeWujOaIkOWQjueahOmSqeWtkFxuICog6L+Z5Liq5Ye95pWw5ZCN5a2X5piv5Zu65a6a55qE77yM5aaC5p6c6ZyA6KaB5L+u5pS577yM6ZyA6KaB5LiA5ZCM5L+u5pS5IGNvY29zLWVkaXRvciDku5PlupPph4znmoQgYXNzZXQtZGIg5o+S5Lu25Luj56CBXG4gKiBAcGFyYW0gZWZmZWN0QXJyYXlcbiAqIEBwYXJhbSBmb3JjZSDlvLrliLbph43nvJZcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGFmdGVySW1wb3J0KGZvcmNlPzogYm9vbGVhbikge1xuICAgIGNvbnN0IGVmZmVjdExpc3Q6IEFzc2V0W10gPSBbXTtcbiAgICBmb3JFYWNoKChkYXRhYmFzZTogQXNzZXREQikgPT4ge1xuICAgICAgICBkYXRhYmFzZS5wYXRoMmFzc2V0LmZvckVhY2goKGFzc2V0KSA9PiB7XG4gICAgICAgICAgICBpZiAoYXNzZXQubWV0YS5pbXBvcnRlciA9PT0gJ2VmZmVjdCcpIHtcbiAgICAgICAgICAgICAgICBlZmZlY3RMaXN0LnB1c2goYXNzZXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICBpZiAoZWZmZWN0TGlzdC5sZW5ndGgpIHtcbiAgICAgICAgYXdhaXQgcmVjb21waWxlQWxsRWZmZWN0cyhlZmZlY3RMaXN0LCBmb3JjZSk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gRmFsbGJhY2s6IHNjYW4gcHJlLWJ1aWx0IC5lZmZlY3QubWV0YSBmaWxlcyBmcm9tIGVhY2ggREIncyB0YXJnZXQgZGlyZWN0b3J5LlxuICAgIC8vIFRoZSBpbnRlcm5hbCBEQiBzaGlwcyB3aXRoIGEgcHJlLWJ1aWx0IGxpYnJhcnkgc28gZWZmZWN0LmJpbiBjYW4gYmUgZ2VuZXJhdGVkXG4gICAgLy8gZXZlbiB3aGVuIHRoZSBmdWxsIGltcG9ydCBwaXBlbGluZSBoYXNuJ3QgcHJvY2Vzc2VkIC5lZmZlY3QgZmlsZXMuXG4gICAgY29uc3QgZmFsbGJhY2tFZmZlY3RzID0gY29sbGVjdFByZWJ1aWx0RWZmZWN0cygpO1xuICAgIGlmIChmYWxsYmFja0VmZmVjdHMubGVuZ3RoKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFtlZmZlY3RdIFVzaW5nICR7ZmFsbGJhY2tFZmZlY3RzLmxlbmd0aH0gcHJlLWJ1aWx0IGVmZmVjdCBsaWJyYXJ5IGZpbGVzYCk7XG4gICAgICAgIGF3YWl0IHJlY29tcGlsZUFsbEVmZmVjdHMoZmFsbGJhY2tFZmZlY3RzIGFzIGFueSwgZm9yY2UpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnNvbGUuZGVidWcoJ25vIGVmZmVjdCB0byBjb21waWxlJyk7XG59XG5cbmZ1bmN0aW9uIGNvbGxlY3RQcmVidWlsdEVmZmVjdHMoKTogQXJyYXk8eyBpbXBvcnRlZDogYm9vbGVhbjsgbGlicmFyeTogc3RyaW5nIH0+IHtcbiAgICBjb25zdCBlZmZlY3RzOiBBcnJheTx7IGltcG9ydGVkOiBib29sZWFuOyBsaWJyYXJ5OiBzdHJpbmcgfT4gPSBbXTtcbiAgICBmb3IgKGNvbnN0IGRiSW5mbyBvZiBhc3NldENvbmZpZy5kYXRhLmFzc2V0REJMaXN0KSB7XG4gICAgICAgIGlmICghZGJJbmZvLmxpYnJhcnkpIGNvbnRpbnVlO1xuICAgICAgICBjb25zdCBlZmZlY3RzRGlyID0gam9pbihkYkluZm8udGFyZ2V0LCAnZWZmZWN0cycpO1xuICAgICAgICBpZiAoIWV4aXN0c1N5bmMoZWZmZWN0c0RpcikpIGNvbnRpbnVlO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgYWxsRmlsZXMgPSByZWFkZGlyU3luYyhlZmZlY3RzRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSwgZW5jb2Rpbmc6ICd1dGYtOCcgfSk7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHJlbEZpbGUgb2YgYWxsRmlsZXMpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXJlbEZpbGUuZW5kc1dpdGgoJy5lZmZlY3QubWV0YScpKSBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtZXRhID0gSlNPTi5wYXJzZShyZWFkRmlsZVN5bmMoam9pbihlZmZlY3RzRGlyLCByZWxGaWxlKSwgJ3V0Zi04JykpO1xuICAgICAgICAgICAgICAgICAgICBpZiAobWV0YS5pbXBvcnRlciAhPT0gJ2VmZmVjdCcgfHwgIW1ldGEuaW1wb3J0ZWQgfHwgIW1ldGEudXVpZCkgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxpYnJhcnlQYXRoID0gam9pbihkYkluZm8ubGlicmFyeSEsIG1ldGEudXVpZC5zdWJzdHJpbmcoMCwgMiksIG1ldGEudXVpZCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghZXhpc3RzU3luYyhsaWJyYXJ5UGF0aCArICcuanNvbicpKSBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgZWZmZWN0cy5wdXNoKHsgaW1wb3J0ZWQ6IHRydWUsIGxpYnJhcnk6IGxpYnJhcnlQYXRoIH0pO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggeyAvKiBza2lwIGludmFsaWQgbWV0YSAqLyB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggeyAvKiBza2lwIGluYWNjZXNzaWJsZSBkaXJzICovIH1cbiAgICB9XG4gICAgcmV0dXJuIGVmZmVjdHM7XG59XG5cbmZ1bmN0aW9uIGZvcmNlUmVjb21waWxlRWZmZWN0cyhmaWxlOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBjb25zdCBkYXRhID0gcmVhZEZpbGVTeW5jKGZpbGUsIHsgZW5jb2Rpbmc6ICdiaW5hcnknIH0pO1xuICAgIGNvbnN0IGVmZmVjdCA9IEJ1ZmZlci5mcm9tKGRhdGEsICdiaW5hcnknKTtcblxuICAgIGlmIChlZmZlY3QubGVuZ3RoIDwgOCkge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdlZmZlY3QuYmluIHNpemUgaXMgdG9vIHNtYWxsJyk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIC8vIFJlYWQgaGVhZGVyXG4gICAgY29uc3QgbnVtVmVydGljZXMgPSBlZmZlY3QucmVhZFVpbnQzMkxFKCk7XG5cbiAgICAvLyBDaGVjayBpZiBlbmdpbmUgc3VwcG9ydHMgY29tcHJlc3NlZCBlZmZlY3RcbiAgICBjb25zdCBpc0VuZ2luZVN1cHBvcnRDb21wcmVzc2VkRWZmZWN0ID0gISFnZXRMYXlvdXRHcmFwaERhdGFWZXJzaW9uO1xuICAgIGNvbnN0IGlzQmluYXJ5Q29tcHJlc3NlZCA9IG51bVZlcnRpY2VzID09PSAweGZmZmZmZmZmO1xuXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLyBFbmdpbmUgZG9lcyBub3Qgc3VwcG9ydCBjb21wcmVzc2VkIGVmZmVjdFxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgaWYgKCFpc0VuZ2luZVN1cHBvcnRDb21wcmVzc2VkRWZmZWN0KSB7XG4gICAgICAgIC8vIDEuIEJpbmFyeSBpcyBjb21wcmVzc2VkLCBuZWVkIHRvIHJlY29tcGlsZVxuICAgICAgICAvLyAyLiBCaW5hcnkgaXMgdW5jb21wcmVzc2VkLCBubyBuZWVkIHRvIHJlY29tcGlsZVxuICAgICAgICByZXR1cm4gaXNCaW5hcnlDb21wcmVzc2VkO1xuICAgIH1cblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gRW5naW5lIHN1cHBvcnRzIGNvbXByZXNzZWQgZWZmZWN0XG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLyAzLiBCaW5hcnkgaXMgdW5jb21wcmVzc2VkIChJbmNvbXBhdGlibGUpXG4gICAgaWYgKCFpc0JpbmFyeUNvbXByZXNzZWQpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgYmluYXJ5IHZlcnNpb25cbiAgICAvLyA0LiBFbmdpbmUgY29tcHJlc3NlZCwgQmluYXJ5IGNvbXByZXNzZWQgKENvbXBhdGlibGUpXG4gICAgY29uc3QgcmVxdWlyZWRWZXJzaW9uID0gZ2V0TGF5b3V0R3JhcGhEYXRhVmVyc2lvbigpO1xuICAgIGNvbnN0IGJpbmFyeVZlcnNpb24gPSBlZmZlY3QucmVhZFVpbnQzMkxFKDQpO1xuXG4gICAgLy8gYSkgVmVyc2lvbiBpcyBkaWZmZXJlbnRcbiAgICBpZiAoYmluYXJ5VmVyc2lvbiA8IHJlcXVpcmVkVmVyc2lvbikge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKGJpbmFyeVZlcnNpb24gPiByZXF1aXJlZFZlcnNpb24pIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgZWZmZWN0LmJpbiB2ZXJzaW9uICR7YmluYXJ5VmVyc2lvbn0gaXMgbmV3ZXIgdGhhbiByZXF1aXJlZCB2ZXJzaW9uICR7cmVxdWlyZWRWZXJzaW9ufWApO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBiKSBWZXJzaW9uIGlzIHRoZSBzYW1lXG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIOe8luivkeaJgOacieeahCBlZmZlY3RcbiAqIOiwg+eUqOWFpeWPo++8mnNvdXJjZS9jb250cmlidXRpb25zL2Fzc2V0LWRiLXNjcmlwdFxuICog6LCD55So5YWl5Y+j77yadGhpcy5hZnRlckltcG9ydFxuICogQHBhcmFtIGVmZmVjdEFycmF5XG4gKiBAcGFyYW0gZm9yY2Ug5by65Yi26YeN57yWXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZWNvbXBpbGVBbGxFZmZlY3RzKGVmZmVjdEFycmF5OiBBc3NldFtdLCBmb3JjZT86IGJvb2xlYW4pIHtcbiAgICBjb25zdCBmaWxlID0gYXV0b0dlbkVmZmVjdEJpbkluZm8uZWZmZWN0QmluUGF0aDtcbiAgICAvLyDlrZjlnKjnrYnlvoXliLfmlrDnmoTmjIfku6TmiJbogIUgZWZmZWN0LmJpbiDkuI3lrZjlnKjml7bvvIzlsLHph43mlrDnlJ/miJBcbiAgICBpZiAoZm9yY2UgfHwgYXV0b0dlbkVmZmVjdEJpbkluZm8ud2FpdGluZ0dlbkVmZmVjdEJpbiB8fCAhZXhpc3RzU3luYyhmaWxlKSB8fCBmb3JjZVJlY29tcGlsZUVmZmVjdHMoZmlsZSkpIHtcbiAgICAgICAgLy8g5LuF57yW6K+R5a+85YWl5q2j5bi455qEIGVmZmVjdFxuICAgICAgICBlZmZlY3RBcnJheSA9IGVmZmVjdEFycmF5LmZpbHRlcigoYXNzZXQpID0+IGFzc2V0LmltcG9ydGVkKTtcbiAgICAgICAgYXV0b0dlbkVmZmVjdEJpbkluZm8ud2FpdGluZ0dlbkVmZmVjdEJpbiA9IGZhbHNlO1xuICAgICAgICBhdXRvR2VuRWZmZWN0QmluSW5mby53YWl0aW5nR2VuRWZmZWN0QmluVGltbWVyICYmIGNsZWFyVGltZW91dChhdXRvR2VuRWZmZWN0QmluSW5mby53YWl0aW5nR2VuRWZmZWN0QmluVGltbWVyKTtcbiAgICAgICAgY29uc3QgbGdEYXRhID0gbmV3IExheW91dEdyYXBoRGF0YSgpO1xuICAgICAgICBhd2FpdCBidWlsZEN1c3RvbUxheW91dChlZmZlY3RBcnJheSwgbGdEYXRhKTtcbiAgICAgICAgLy8g5YaZ5YWl5LiA5Liq5LqM6L+b5Yi25paH5Lu2XG4gICAgICAgIC8vIOiusOW+l+WBmuWlvee8k+WtmOeuoeeQhu+8jOWmguaenOayoeacieWPmOWMluWwvemHj+WHj+WwkSBpb1xuICAgICAgICBhd2FpdCBlbnN1cmVEaXIoZGlybmFtZShmaWxlKSk7XG5cbiAgICAgICAgLy8gU2VyaWFsaXplIGRhdGFcbiAgICAgICAgY29uc3QgYmluYXJ5RGF0YSA9IG5ldyBCaW5hcnlPdXRwdXRBcmNoaXZlKCk7XG4gICAgICAgIHNhdmVMYXlvdXRHcmFwaERhdGEoYmluYXJ5RGF0YSwgbGdEYXRhKTtcblxuICAgICAgICBjb25zdCBpc0VuZ2luZVN1cHBvcnRDb21wcmVzc2VkRWZmZWN0ID0gISFnZXRMYXlvdXRHcmFwaERhdGFWZXJzaW9uO1xuICAgICAgICBpZiAoaXNFbmdpbmVTdXBwb3J0Q29tcHJlc3NlZEVmZmVjdCkge1xuICAgICAgICAgICAgLy8gQ29tcHJlc3MgZGF0YVxuICAgICAgICAgICAgY29uc3QgY29tcHJlc3NlZCA9IHpsaWIuZGVmbGF0ZVN5bmMoYmluYXJ5RGF0YS5idWZmZXIsIHtcbiAgICAgICAgICAgICAgICBsZXZlbDogemxpYi5jb25zdGFudHMuWl9CRVNUX0NPTVBSRVNTSU9OLFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIFBhY2sgZGF0YVxuICAgICAgICAgICAgY29uc3QgcGFja2VkRGF0YSA9IEJ1ZmZlci5hbGxvYyhjb21wcmVzc2VkLmxlbmd0aCArIDgpO1xuICAgICAgICAgICAgY29uc3QgdmVyc2lvbiA9IGdldExheW91dEdyYXBoRGF0YVZlcnNpb24oKTtcbiAgICAgICAgICAgIHBhY2tlZERhdGEud3JpdGVVaW50MzJMRSgweGZmZmZmZmZmLCAwKTsgLy8gZ3JhcGggbnVsbCB2ZXJ0ZXggZGVzY3JpcHRvclxuICAgICAgICAgICAgcGFja2VkRGF0YS53cml0ZVVpbnQzMkxFKHZlcnNpb24sIDQpOyAvLyB2ZXJzaW9uXG4gICAgICAgICAgICBwYWNrZWREYXRhLnNldChjb21wcmVzc2VkLCA4KTsgLy8gZGF0YVxuXG4gICAgICAgICAgICAvLyBXcml0ZSB0byBmaWxlXG4gICAgICAgICAgICBhd2FpdCB3cml0ZUZpbGUoZmlsZSwgcGFja2VkRGF0YSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhd2FpdCB3cml0ZUZpbGUoZmlsZSwgYmluYXJ5RGF0YS5idWZmZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc29sZS5kZWJ1ZygncmVjb21waWxlIGVmZmVjdC5iaW4gc3VjY2VzcycpO1xuICAgIH1cbn1cbiJdfQ==