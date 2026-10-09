'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialHandler = void 0;
const fs_extra_1 = require("fs-extra");
const material_upgrader_1 = require("./utils/material-upgrader");
const utils_1 = require("../utils");
exports.MaterialHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: 'material',
    // 引擎内对应的类型
    assetType: 'cc.Material',
    async validate(asset) {
        try {
            const json = (0, fs_extra_1.readJSONSync)(asset.source);
            return json.__type__ === 'cc.Material';
        }
        catch (error) {
            return false;
        }
    },
    createInfo: {
        generateMenuInfo() {
            return [
                {
                    label: 'i18n:ENGINE.assets.newMaterial',
                    fullFileName: 'material.mtl',
                    template: `db://internal/default_file_content/${exports.MaterialHandler.name}/default.mtl`,
                    group: 'material',
                    name: 'default',
                },
            ];
        },
    },
    importer: {
        // 版本号如果变更，则会强制重新导入
        version: '1.0.21',
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
                const material = (0, fs_extra_1.readJSONSync)(asset.source);
                // uuid dependency
                const uuid = material._effectAsset && material._effectAsset.__uuid__;
                asset.depend(uuid);
                // upgrade properties
                if (await (0, material_upgrader_1.upgradeProperties)(material, asset)) {
                    (0, fs_extra_1.writeJSONSync)(asset.source, material, { spaces: 2 });
                }
                material._name = asset.basename || '';
                const serializeJSON = JSON.stringify(material, undefined, 2);
                await asset.saveToLibrary('.json', serializeJSON);
                const depends = (0, utils_1.getDependUUIDList)(serializeJSON);
                asset.setData('depends', depends);
                return true;
            }
            catch (err) {
                console.error(err);
                return false;
            }
        },
    },
};
exports.default = exports.MaterialHandler;
