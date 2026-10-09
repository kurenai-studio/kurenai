'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const asset_db_1 = require("@cocos/asset-db");
const fs_extra_1 = require("fs-extra");
const InternalBundleName = ['internal', 'resources', 'main'];
const DirectoryHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: 'directory',
    importer: {
        // 版本号如果变更，则会强制重新导入
        version: '1.2.0',
        /**
         * 实际导入流程
         * @param asset
         */
        async import(asset) {
            const userData = asset.userData;
            const url = (0, asset_db_1.queryUrl)(asset.uuid);
            if (url === 'db://assets/resources') {
                userData.isBundle = true;
                userData.bundleConfigID = userData.bundleConfigID ?? 'default';
                userData.bundleName = 'resources';
                userData.priority = 8;
            }
            return true;
        },
    },
    createInfo: {
        generateMenuInfo() {
            return [
                {
                    label: 'i18n:ENGINE.assets.newFolder',
                    fullFileName: 'folder',
                    name: 'default',
                },
            ];
        },
        async create(option) {
            (0, fs_extra_1.ensureDirSync)(option.target);
            return option.target;
        },
    },
    async validate(asset) {
        return asset.isDirectory();
    },
};
exports.default = DirectoryHandler;
