'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrefabHandler = void 0;
const index_1 = require("./index");
const fs_extra_1 = require("fs-extra");
const utils_1 = require("../../utils");
const filesystem_1 = require("../../../manager/filesystem");
exports.PrefabHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: 'prefab',
    // 引擎内对应的类型
    assetType: 'cc.Prefab',
    open(asset) {
        // TODO: 实现打开预制体资产
        return false;
    },
    createInfo: {
        generateMenuInfo() {
            return [
                {
                    label: 'i18n:ENGINE.assets.newPrefab',
                    fullFileName: 'Node.prefab',
                    template: `db://internal/default_file_content/${exports.PrefabHandler.name}/default.prefab`,
                    group: 'scene',
                    name: 'default',
                },
            ];
        },
    },
    importer: {
        version: index_1.version,
        versionCode: index_1.versionCode,
        /**
         * 实际导入流程
         * 需要自己控制是否生成、拷贝文件
         *
         * 返回是否导入成功的标记
         * 如果返回 false，则 imported 标记不会变成 true
         * 后续的一系列操作都不会执行
         * @param asset 资源
         */
        async import(asset) {
            /**
             * 为了保持生成的 prefab 根节点的 nodeName 与 prefab 资源 baseName 一致
             * 在 meta 文件 userData 中增加一个标记 syncNodeName
             * 当 prefab 资源的文件名称与 syncNodeName 不一致时，更新资源和 library 中的数据
             */
            const source = await (0, fs_extra_1.readJSON)(asset.source);
            const basename = asset.basename || '';
            let dirty = source[0]._name !== basename || source[1]._name !== basename || source[0].persistent !== !!asset.userData.persistent;
            if (dirty) {
                // 更新资源的 name
                source[0]._name = basename || '';
                source[1]._name = basename || '';
                source[0].persistent = !!asset.userData.persistent;
            }
            try {
                // HACK 过去版本场景 prefab 资源可能会出现节点组件数据为空的情况
                dirty = dirty || (0, utils_1.removeNull)(source, asset.uuid);
            }
            catch (error) {
                console.debug(error);
            }
            // 同步到存档文件
            if (dirty) {
                try {
                    const serializeJSON = JSON.stringify(source, undefined, 2);
                    await (0, filesystem_1.writePath)(asset.source, serializeJSON);
                }
                catch (error) {
                    // 有可能只读，只读的话就不管源文件了
                }
            }
            const serializeJSON = JSON.stringify(source, undefined, 2);
            await asset.saveToLibrary('.json', serializeJSON);
            const dependInfo = (0, utils_1.getDependList)(serializeJSON);
            asset.setData('depends', dependInfo.uuids);
            asset.setData('dependScripts', dependInfo.dependScriptUuids);
            // 最后更改标记
            asset.userData.syncNodeName = basename;
            return true;
        },
    },
};
exports.default = exports.PrefabHandler;
