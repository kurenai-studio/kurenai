'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneHandler = exports.versionCode = exports.version = void 0;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const utils_1 = require("../../utils");
const filesystem_1 = require("../../../manager/filesystem");
exports.version = '1.1.50';
exports.versionCode = 2;
exports.SceneHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: 'scene',
    // 引擎内对应的类型
    assetType: 'cc.SceneAsset',
    createInfo: {
        async generateMenuInfo() {
            const templateDir = 'db://internal/default_file_content/scene';
            return ['3d', '2d', 'quality'].map((name) => {
                return {
                    group: 'scene',
                    label: `i18n:ENGINE.assets.newScene.${name}`,
                    name,
                    fullFileName: name === '3d' ? 'scene.scene' : `scene-${name}.scene`,
                    template: `${templateDir}/${name}.scene`,
                };
            });
        },
    },
    importer: {
        // 版本号如果变更，则会强制重新导入
        version: exports.version,
        versionCode: exports.versionCode,
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
            const source = await (0, fs_extra_1.readJSON)(asset.source);
            const name = (0, path_1.basename)(asset.source, (0, path_1.extname)(asset.source));
            let dirty = source[0]._name !== name;
            if (dirty) {
                source[0]._name = name;
                // rename scene node
                const index = findSceneNodeIndex(source);
                if (index !== -1) {
                    source[index]._name = name;
                }
            }
            try {
                // HACK 过去版本场景 prefab 资源可能会出现节点组件数据为空的情况
                dirty = dirty || (0, utils_1.removeNull)(source, asset.uuid);
            }
            catch (error) {
                console.debug(error);
            }
            // 场景文件内存了一份 uuid 上它需要与资源本身的保持一致
            dirty = changeSceneUuid(source, asset.uuid) || dirty;
            // 同步到存档文件
            if (dirty) {
                const content = JSON.stringify(source, undefined, 2);
                await (0, filesystem_1.writePath)(asset.source, content);
            }
            const serializeJSON = JSON.stringify(source, undefined, 2);
            await asset.saveToLibrary('.json', serializeJSON);
            const dependInfo = (0, utils_1.getDependList)(serializeJSON);
            const sceneIndex = dependInfo.uuids.indexOf(asset.uuid);
            if (sceneIndex !== -1) {
                dependInfo.uuids.splice(sceneIndex, 1);
            }
            asset.setData('depends', dependInfo.uuids);
            asset.setData('dependScripts', dependInfo.dependScriptUuids);
            return true;
        },
    },
};
exports.default = exports.SceneHandler;
function changeSceneUuid(scene, uuid) {
    // 场景文件内存了一份 uuid 上它需要与资源本身的保持一致
    if (scene[1]._id !== uuid) {
        scene[1]._id = uuid;
        return true;
    }
    return false;
}
function findSceneNodeIndex(scene) {
    for (let i = 0; i < scene.length; i++) {
        const item = scene[i];
        if (item.__type__ === 'cc.Scene') {
            return i;
        }
    }
    return -1;
}
