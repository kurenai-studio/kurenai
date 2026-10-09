"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EffectHeaderHandler = void 0;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const effect_compiler_1 = require("../../effect-compiler");
const engine_1 = require("../../../engine");
// 添加所有 builtin 头文件
const builtinChunkDir = (0, path_1.join)(engine_1.Engine.getInfo().typescript.path, './editor/assets/chunks');
const builtinChunks = (() => {
    const arr = [];
    function step(dir) {
        const names = (0, fs_extra_1.readdirSync)(dir);
        names.forEach((name) => {
            const file = (0, path_1.join)(dir, name);
            if (/\.chunk$/.test(name)) {
                arr.push(file);
            }
            else if ((0, fs_extra_1.statSync)(file).isDirectory()) {
                step(file);
            }
        });
    }
    step(builtinChunkDir);
    return arr;
})();
for (let i = 0; i < builtinChunks.length; ++i) {
    const name = (0, path_1.basename)(builtinChunks[i], '.chunk');
    const content = (0, fs_extra_1.readFileSync)(builtinChunks[i], { encoding: 'utf8' });
    (0, effect_compiler_1.addChunk)(name, content);
}
exports.EffectHeaderHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: 'effect-header',
    // 引擎内对应的类型
    assetType: 'cce.EffectHeader',
    createInfo: {
        generateMenuInfo() {
            return [
                {
                    label: 'i18n:ENGINE.assets.newChunk',
                    fullFileName: 'chunk.chunk',
                    template: `db://internal/default_file_content/${exports.EffectHeaderHandler.name}/chunk`,
                    name: 'default',
                },
            ];
        },
    },
    importer: {
        // 版本号如果变更，则会强制重新导入
        version: '1.0.7',
        /**
         * 实际导入流程
         * 需要自己控制是否生成、拷贝文件
         *
         * 返回是否导入成功的标记
         * 如果返回 false，则 imported 标记不会变成 true
         * 后续的一系列操作都不会执行
         * @param asset
         */
        async import(asset) {
            try {
                const target = asset._assetDB.options.target;
                const path = (0, path_1.relative)((0, path_1.join)(target, 'chunks'), (0, path_1.dirname)(asset.source)).replace(/\\/g, '/');
                const name = path + (path.length ? '/' : '') + (0, path_1.basename)(asset.source, (0, path_1.extname)(asset.source));
                const content = (0, fs_extra_1.readFileSync)(asset.source, { encoding: 'utf-8' });
                (0, effect_compiler_1.addChunk)(name, content);
                return true;
            }
            catch (err) {
                console.error(err);
                return false;
            }
        },
    },
};
exports.default = exports.EffectHeaderHandler;
