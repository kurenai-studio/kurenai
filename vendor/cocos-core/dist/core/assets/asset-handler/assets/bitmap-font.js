'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BitmapHandler = void 0;
const asset_db_1 = require("@cocos/asset-db");
const cc_1 = require("cc");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const image_utils_1 = require("./utils/image-utils");
const utils_1 = require("../utils");
const fnt_parser_1 = __importDefault(require("./utils/fnt-parser"));
/**
 * 获取实际的纹理文件位置
 * @param name
 * @param path
 */
function getRealFntTexturePath(name, asset) {
    // const isWin32Path = name.indexOf(':') !== -1;
    const textureBaseName = (0, path_1.basename)(name);
    // if (isWin32Path) {
    //     textureBaseName = Path.win32.basename(textureName);
    // }
    const texturePath = (0, path_1.join)((0, path_1.dirname)(asset.source), textureBaseName);
    if (!(0, fs_extra_1.existsSync)(texturePath)) {
        console.warn('Parse Error: Unable to find file Texture, the path: ' + texturePath);
    }
    return texturePath;
}
const UserFlags = {
    DoNotNotify: false,
};
exports.BitmapHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: 'bitmap-font',
    // 编辑器属性上定义的如果是资源的基类类型，此处也需要定义基类类型
    // 不会影响实际资源类型
    assetType: 'cc.BitmapFont',
    importer: {
        // 版本号如果变更，则会强制重新导入
        version: '1.0.6',
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
            // 解析文字文件
            const fntData = await (0, fs_extra_1.readFile)(asset.source, 'utf8');
            let fntConfig;
            try {
                fntConfig = fnt_parser_1.default.parseFnt(fntData);
            }
            catch (error) {
                console.error(error);
                throw new Error(`BitmapFont import failed: ${asset.uuid} file parsing failed`);
            }
            // 缓存 fnt 配置
            asset.userData._fntConfig = fntConfig;
            // 如果文字尺寸不存在的话，不需要导入
            if (!fntConfig.fontSize) {
                console.error(`BitmapFont import failed: ${asset.uuid} file parsing failed, There is no 'fontSize' in the configuration.`);
                return false;
            }
            asset.userData.fontSize = fntConfig.fontSize;
            // 标记依赖资源
            const texturePath = getRealFntTexturePath(fntConfig.atlasName, asset);
            asset.depend(texturePath);
            const textureUuid = asset._assetDB.pathToUuid(texturePath);
            if (!textureUuid) {
                return false;
            }
            // 挂载 textureUuid
            asset.userData.textureUuid = textureUuid;
            // 如果依赖的资源已经导入完成了，则生成对应的数据，并且
            if (asset.userData.textureUuid) {
                const textureAsset = (0, asset_db_1.queryAsset)(asset.userData.textureUuid);
                if (!textureAsset) {
                    return false;
                }
                (0, image_utils_1.changeImageDefaultType)(textureAsset, 'sprite-frame');
                const bitmap = createBitmapFnt(asset);
                bitmap.spriteFrame = EditorExtends.serialize.asAsset(textureAsset.uuid + '@f9941', cc_1.SpriteFrame);
                const serializeJSON = EditorExtends.serialize(bitmap);
                await asset.saveToLibrary('.json', serializeJSON);
                const depends = (0, utils_1.getDependUUIDList)(serializeJSON);
                asset.setData('depends', depends);
            }
            return true;
        },
    },
    /**
     * 判断是否允许使用当前的 Handler 进行导入
     * @param asset
     */
    async validate(asset) {
        return true;
    },
};
exports.default = exports.BitmapHandler;
/**
 * 创建一个 Bitmap 实例对象
 * @param asset
 */
function createBitmapFnt(asset) {
    // @ts-ignore
    const bitmap = new cc.BitmapFont();
    bitmap.name = (0, path_1.basename)(asset.source, asset.extname);
    // 3.5 再改
    bitmap.name = asset.basename || '';
    bitmap.fontSize = asset.userData.fontSize;
    bitmap.fntConfig = asset.userData._fntConfig;
    return bitmap;
}
