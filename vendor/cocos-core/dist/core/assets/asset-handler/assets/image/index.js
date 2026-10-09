"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageHandler = void 0;
const fs_extra_1 = require("fs-extra");
const erp_texture_cube_1 = require("../erp-texture-cube");
const image_mics_1 = require("./image-mics");
const sharp_1 = __importDefault(require("sharp"));
const path_1 = require("path");
const utils_1 = require("./utils");
const utils_2 = __importDefault(require("../../../../base/utils"));
exports.ImageHandler = {
    displayName: 'i18n:ENGINE.assets.image.label',
    description: 'i18n:ENGINE.assets.image.description',
    // Handler 的名字，用于指定 Handler as 等
    name: 'image',
    // 引擎内对应的类型
    assetType: 'cc.ImageAsset',
    open: utils_1.openImageAsset,
    propertySchemaConfig: {
        type: {
            title: 'i18n:ENGINE.assets.image.type',
            description: 'i18n:ENGINE.assets.image.typeTip',
            type: 'string',
            default: 'sprite-frame',
            enum: ['raw', 'texture', 'normal map', 'sprite-frame', 'texture cube'],
            enumDescriptions: ['raw', 'texture', 'normal map', 'sprite-frame', 'texture cube'],
        },
        flipVertical: {
            title: 'i18n:ENGINE.assets.image.flipVertical',
            description: 'i18n:ENGINE.assets.image.flipVerticalTip',
            type: 'boolean',
        },
    },
    importer: {
        // 版本号如果变更，则会强制重新导入
        version: '1.0.27',
        /**
         * 是否强制刷新
         * @param asset
         */
        async force(asset) {
            return false;
        },
        /**
         * @param asset
         */
        async import(asset) {
            let extName = asset.extname.toLocaleLowerCase();
            // If it's a string, is a path to the image file.
            // Else it's the image data buffer.
            let imageDataBufferOrimagePath = asset.source;
            const userData = asset.meta.userData;
            // 这个流程会将不同类型的图片转成 png
            if (extName === '.bmp') {
                const converted = await (0, image_mics_1.convertHDR)(asset.source, asset.uuid, asset.temp);
                if (converted instanceof Error || !converted) {
                    console.error('Failed to convert bmp image.');
                    return false;
                }
                extName = converted.extName;
                imageDataBufferOrimagePath = converted.source;
                // bmp 导入的，默认钩上 isRGBE
                userData.isRGBE = true;
                // 对于 rgbe 类型图片默认关闭这个选项
                userData.fixAlphaTransparencyArtifacts ||= false;
            }
            else if (extName === '.znt') {
                const source = asset.source;
                const converted = await (0, image_mics_1.convertHDR)(source, asset.uuid, asset.temp);
                if (converted instanceof Error || !converted) {
                    console.error(`Failed to convert asset {asset(${asset.uuid})}.`);
                    return false;
                }
                extName = converted.extName;
                imageDataBufferOrimagePath = converted.source;
                // 对于 rgbe 类型图片默认关闭这个选项
                userData.fixAlphaTransparencyArtifacts = false;
                userData.isRGBE = true;
            }
            else if (extName === '.hdr' || extName === '.exr') {
                const source = asset.source;
                const converted = await (0, image_mics_1.convertHDROrEXR)(extName, source, asset.uuid, asset.temp);
                if (converted instanceof Error || !converted) {
                    console.error(`Failed to convert asset {asset(${asset.uuid})}.`);
                    return false;
                }
                extName = converted.extName;
                imageDataBufferOrimagePath = converted.source;
                // 对于 rgbe 类型图片默认关闭这个选项
                userData.fixAlphaTransparencyArtifacts = false;
                // hdr 导入的，默认钩上 isRGBE
                userData.isRGBE = true;
                const sharpResult = await (0, sharp_1.default)(imageDataBufferOrimagePath);
                const metaData = await sharpResult.metadata();
                // 长宽符合 cubemap 的导入规则时，默认导入成 texture cube
                if (!userData.type && (0, erp_texture_cube_1.checkSize)(metaData.width, metaData.height)) {
                    userData.type = 'texture cube';
                }
                const signFile = (0, path_1.join)(converted.source.replace('.png', '_sign.png'));
                if ((0, fs_extra_1.existsSync)(signFile)) {
                    userData.sign = utils_2.default.Path.resolveToUrl(signFile, 'project');
                }
                const alphaFile = (0, path_1.join)(converted.source.replace('.png', '_alpha.png'));
                if ((0, fs_extra_1.existsSync)(alphaFile)) {
                    userData.alpha = utils_2.default.Path.resolveToUrl(alphaFile, 'project');
                }
            }
            else if (extName === '.tga') {
                const converted = await (0, image_mics_1.convertTGA)(await (0, fs_extra_1.readFile)(asset.source));
                if (converted instanceof Error || !converted) {
                    console.error('Failed to convert tga image.');
                    return false;
                }
                extName = converted.extName;
                imageDataBufferOrimagePath = converted.data;
            }
            else if (extName === '.psd') {
                const converted = await (0, image_mics_1.convertPSD)(await (0, fs_extra_1.readFile)(asset.source));
                extName = converted.extName;
                imageDataBufferOrimagePath = converted.data;
            }
            else if (extName === '.tif' || extName === '.tiff') {
                const converted = await (0, image_mics_1.convertTIFF)(asset.source);
                if (converted instanceof Error || !converted) {
                    console.error(`Failed to convert ${extName} image.`);
                    return false;
                }
                extName = converted.extName;
                imageDataBufferOrimagePath = converted.data;
            }
            // 为不同导入类型的图片设置伪影的默认值
            if (userData.fixAlphaTransparencyArtifacts === undefined) {
                userData.fixAlphaTransparencyArtifacts = (0, utils_1.isCapableToFixAlphaTransparencyArtifacts)(asset, userData.type, asset.extname);
            }
            imageDataBufferOrimagePath = await (0, utils_1.handleImageUserData)(asset, imageDataBufferOrimagePath, extName);
            await (0, utils_1.saveImageAsset)(asset, imageDataBufferOrimagePath, extName, asset.basename);
            await (0, utils_1.importWithType)(asset, userData.type, asset.basename, asset.extname);
            if (userData.sign) {
                await asset.createSubAsset('sign', 'sign-image', {
                    displayName: 'sign',
                });
            }
            // if (userData.alpha) {
            //     // TODO 暂时先用着，后续可以更改更通用的名字
            //     await asset.createSubAsset('alpha', 'sign-image', {
            //         displayName: 'alpha',
            //     });
            // }
            // await this.importWithType(asset, userData.type, asset.basename);
            if (userData.alpha) {
                // TODO 暂时先用着，后续可以更改更通用的名字
                await asset.createSubAsset('alpha', 'alpha-image', {
                    displayName: 'alpha',
                });
            }
            return true;
        },
    },
    userDataConfig: {
        default: {
            type: {
                label: 'i18n:ENGINE.assets.image.type',
                description: 'i18n:ENGINE.assets.image.typeTip',
                default: 'sprite-frame',
                render: {
                    ui: 'ui-select',
                    items: [
                        {
                            label: 'i18n:importer.property_schema.image.type_raw',
                            value: 'raw',
                        },
                        {
                            label: 'i18n:importer.property_schema.image.type_texture',
                            value: 'texture',
                        },
                        {
                            label: 'i18n:importer.property_schema.image.type_normal_map',
                            value: 'normal map',
                        },
                        {
                            label: 'i18n:importer.property_schema.image.type_sprite_frame',
                            value: 'sprite-frame',
                        },
                        {
                            label: 'i18n:importer.property_schema.image.type_texture_cube',
                            value: 'texture cube',
                        },
                    ],
                },
            },
            flipVertical: {
                label: 'i18n:ENGINE.assets.image.flipVertical',
                description: 'i18n:ENGINE.assets.image.flipVerticalTip',
                render: {
                    ui: 'ui-checkbox',
                },
            },
        },
    },
    /**
     * 判断是否允许使用当前的 Handler 进行导入
     * @param asset
     */
    async validate(asset) {
        return !(await asset.isDirectory());
    },
};
exports.default = exports.ImageHandler;
