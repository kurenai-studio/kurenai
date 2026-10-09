"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSeparateEngine = void 0;
exports.buildEngineCommand = buildEngineCommand;
/**
 * 执行环境为标准 node 环境，请不要使用 Editor 或者 Electron 接口
 */
const ccbuild_1 = require("@cocos/ccbuild");
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
const fs_1 = require("fs");
const defaultOptions = {
    engine: '', // 内置引擎模块地址
    out: '',
    platform: 'INVALID_PLATFORM', // v3.8.6 开始 ccbuild 支持 'INVALID_PLATFORM' 表示无效平台，防止之前初始化为 'HTML5' 后，平台插件忘记覆盖 platform 参数导致走 'HTML5' 的引擎打包流程导致的较难排查的问题
    moduleFormat: 'system',
    compress: true,
    split: false,
    nativeCodeBundleMode: 'both',
    assetURLFormat: 'runtime-resolved',
    noDeprecatedFeatures: false,
    sourceMap: false,
    // 需要从引擎地址整理默认模块地址
    features: [],
    loose: false,
    mode: 'BUILD',
    flags: {
        DEBUG: false,
    },
    metaFile: '',
    mangleProperties: false, // 3.8.5 先默认关闭此功能
    inlineEnum: true,
};
/**
 * 编译引擎代码，执行环境为标准 node 环境，请不要使用 Editor 或者 Electron 接口，所以需要使用的字段都需要在外部整理好传入
 * @param options 编译引擎参数
 */
async function buildEngineCommand(options) {
    const buildOptions = Object.assign({}, defaultOptions, options || {});
    // 将引擎路径归一化为文件系统实际的大小写
    // rollup-plugin-node-resolve 的 jail 检查使用 fs.realpath.native 获取真实路径，
    // 再与 path.resolve 得到的路径做大小写敏感的 indexOf 比较。
    // 当宿主进程（如 pink.exe）传入的路径大小写与文件系统不一致时，该检查会静默失败，
    // 导致 DebugInfos.json 等相对路径模块无法解析。
    if (buildOptions.engine) {
        try {
            let realEngine = fs_1.realpathSync.native(buildOptions.engine);
            if (realEngine.startsWith('\\\\?\\')) {
                realEngine = realEngine.slice(4);
            }
            buildOptions.engine = realEngine;
        }
        catch (e) {
            console.warn('Failed to normalize engine path:', e);
        }
    }
    // TODO features 的校验与默认值
    const { features, out } = buildOptions;
    await (0, fs_extra_1.remove)(out);
    await (0, fs_extra_1.ensureDir)((0, path_1.dirname)(out));
    console.debug(`start build engine with options: ${JSON.stringify(buildOptions)}`);
    const buildResult = await (0, ccbuild_1.buildEngine)(buildOptions);
    if (buildOptions.split) {
        const statsQuery = await ccbuild_1.StatsQuery.create(buildOptions.engine);
        const ccModuleSource = await ccbuild_1.buildEngine.transform(statsQuery.evaluateIndexModuleSource(statsQuery.getUnitsOfFeatures(features)), 'system');
        const ccModuleFile = (0, path_1.join)(options.out, 'cc.js');
        await (0, fs_extra_1.ensureDir)((0, path_1.dirname)(ccModuleFile));
        await (0, fs_extra_1.writeFile)(ccModuleFile, ccModuleSource.code, 'utf8');
        buildResult.exports['cc'] = 'cc.js';
    }
    const metaContent = buildResult;
    if (options.mangleConfigJsonMtime !== 0) {
        metaContent['mangleConfigJsonMtime'] = options.mangleConfigJsonMtime;
    }
    // 写入一些编译引擎的元信息
    await (0, fs_extra_1.ensureDir)((0, path_1.dirname)(buildOptions.metaFile));
    // 缓存一下引擎提供的模块映射
    await (0, fs_extra_1.writeJSON)(buildOptions.metaFile, metaContent, { spaces: 2 });
}
var separate_engine_1 = require("./separate-engine");
Object.defineProperty(exports, "buildSeparateEngine", { enumerable: true, get: function () { return separate_engine_1.buildSeparateEngine; } });
