'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.TTFFontHandler = void 0;
const utils_1 = require("../utils");
exports.TTFFontHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: 'ttf-font',
    // 编辑器属性上定义的如果是资源的基类类型，此处也需要定义基类类型
    // 不会影响实际资源类型
    assetType: 'cc.TTFFont',
    importer: {
        // 版本号如果变更，则会强制重新导入
        version: '1.0.1',
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
            const filename = asset.basename + '.ttf';
            await asset.copyToLibrary(filename, asset.source);
            const ttf = createTTFFont(asset);
            const serializeJSON = EditorExtends.serialize(ttf);
            await asset.saveToLibrary('.json', serializeJSON);
            const depends = (0, utils_1.getDependUUIDList)(serializeJSON);
            asset.setData('depends', depends);
            return true;
        },
    },
};
exports.default = exports.TTFFontHandler;
function createTTFFont(asset) {
    const ttf = new cc.TTFFont();
    ttf.name = asset.basename;
    ttf._setRawAsset(ttf.name + '.ttf');
    return ttf;
}
