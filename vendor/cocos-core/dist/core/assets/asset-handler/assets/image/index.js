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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9hc3NldHMvYXNzZXQtaGFuZGxlci9hc3NldHMvaW1hZ2UvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQ0EsdUNBQWdEO0FBQ2hELDBEQUFnRDtBQUNoRCw2Q0FBZ0c7QUFDaEcsa0RBQTBCO0FBRzFCLCtCQUE0QjtBQUM1QixtQ0FNaUI7QUFFakIsbUVBQTJDO0FBRTlCLFFBQUEsWUFBWSxHQUFpQjtJQUN0QyxXQUFXLEVBQUUsZ0NBQWdDO0lBQzdDLFdBQVcsRUFBRSxzQ0FBc0M7SUFDbkQsZ0NBQWdDO0lBQ2hDLElBQUksRUFBRSxPQUFPO0lBRWIsV0FBVztJQUNYLFNBQVMsRUFBRSxlQUFlO0lBQzFCLElBQUksRUFBRSxzQkFBYztJQUNwQixvQkFBb0IsRUFBRTtRQUNsQixJQUFJLEVBQUU7WUFDRixLQUFLLEVBQUUsK0JBQStCO1lBQ3RDLFdBQVcsRUFBRSxrQ0FBa0M7WUFDL0MsSUFBSSxFQUFFLFFBQVE7WUFDZCxPQUFPLEVBQUUsY0FBYztZQUN2QixJQUFJLEVBQUUsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLFlBQVksRUFBRSxjQUFjLEVBQUUsY0FBYyxDQUFDO1lBQ3RFLGdCQUFnQixFQUFFLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRSxZQUFZLEVBQUUsY0FBYyxFQUFFLGNBQWMsQ0FBQztTQUNyRjtRQUNELFlBQVksRUFBRTtZQUNWLEtBQUssRUFBRSx1Q0FBdUM7WUFDOUMsV0FBVyxFQUFFLDBDQUEwQztZQUN2RCxJQUFJLEVBQUUsU0FBUztTQUNsQjtLQUNKO0lBQ0QsUUFBUSxFQUFFO1FBQ04sbUJBQW1CO1FBQ25CLE9BQU8sRUFBRSxRQUFRO1FBQ2pCOzs7V0FHRztRQUNILEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBWTtZQUNwQixPQUFPLEtBQUssQ0FBQztRQUNqQixDQUFDO1FBQ0Q7O1dBRUc7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ekQsS0FBSyxFQUFFLFNBQVM7eUJBQ25CO3dCQUNEOzRCQUNJLEtBQUssRUFBRSxxREFBcUQ7NEJBQzVELEtBQUssRUFBRSxZQUFZO3lCQUN0Qjt3QkFDRDs0QkFDSSxLQUFLLEVBQUUsdURBQXVEOzRCQUM5RCxLQUFLLEVBQUUsY0FBYzt5QkFDeEI7d0JBQ0Q7NEJBQ0ksS0FBSyxFQUFFLHVEQUF1RDs0QkFDOUQsS0FBSyxFQUFFLGNBQWM7eUJBQ3hCO3FCQUNKO2lCQUNKO2FBQ0o7WUFDRCxZQUFZLEVBQUU7Z0JBQ1YsS0FBSyxFQUFFLHVDQUF1QztnQkFDOUMsV0FBVyxFQUFFLDBDQUEwQztnQkFDdkQsTUFBTSxFQUFFO29CQUNKLEVBQUUsRUFBRSxhQUFhO2lCQUNwQjthQUNKO1NBQ0o7S0FDSjtJQUVEOzs7T0FHRztJQUNILEtBQUssQ0FBQyxRQUFRLENBQUMsS0FBWTtRQUN2QixPQUFPLENBQUMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO0lBQ3hDLENBQUM7Q0FDSixDQUFDO0FBRUYsa0JBQWUsb0JBQVksQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFzc2V0IH0gZnJvbSAnQGNvY29zL2Fzc2V0LWRiJztcbmltcG9ydCB7IGV4aXN0c1N5bmMsIHJlYWRGaWxlIH0gZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0IHsgY2hlY2tTaXplIH0gZnJvbSAnLi4vZXJwLXRleHR1cmUtY3ViZSc7XG5pbXBvcnQgeyBjb252ZXJ0VEdBLCBjb252ZXJ0UFNELCBjb252ZXJ0VElGRiwgY29udmVydEhEUk9yRVhSLCBjb252ZXJ0SERSIH0gZnJvbSAnLi9pbWFnZS1taWNzJztcbmltcG9ydCBTaGFycCBmcm9tICdzaGFycCc7XG5pbXBvcnQgeyBJbWFnZUFzc2V0VXNlckRhdGEgfSBmcm9tICcuLi8uLi8uLi9AdHlwZXMvdXNlckRhdGFzJztcblxuaW1wb3J0IHsgam9pbiB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHtcbiAgICBoYW5kbGVJbWFnZVVzZXJEYXRhLFxuICAgIGltcG9ydFdpdGhUeXBlLFxuICAgIGlzQ2FwYWJsZVRvRml4QWxwaGFUcmFuc3BhcmVuY3lBcnRpZmFjdHMsXG4gICAgb3BlbkltYWdlQXNzZXQsXG4gICAgc2F2ZUltYWdlQXNzZXQsXG59IGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IHsgQXNzZXRIYW5kbGVyIH0gZnJvbSAnLi4vLi4vLi4vQHR5cGVzL3Byb3RlY3RlZCc7XG5pbXBvcnQgdXRpbHMgZnJvbSAnLi4vLi4vLi4vLi4vYmFzZS91dGlscyc7XG5cbmV4cG9ydCBjb25zdCBJbWFnZUhhbmRsZXI6IEFzc2V0SGFuZGxlciA9IHtcbiAgICBkaXNwbGF5TmFtZTogJ2kxOG46RU5HSU5FLmFzc2V0cy5pbWFnZS5sYWJlbCcsXG4gICAgZGVzY3JpcHRpb246ICdpMThuOkVOR0lORS5hc3NldHMuaW1hZ2UuZGVzY3JpcHRpb24nLFxuICAgIC8vIEhhbmRsZXIg55qE5ZCN5a2X77yM55So5LqO5oyH5a6aIEhhbmRsZXIgYXMg562JXG4gICAgbmFtZTogJ2ltYWdlJyxcblxuICAgIC8vIOW8leaTjuWGheWvueW6lOeahOexu+Wei1xuICAgIGFzc2V0VHlwZTogJ2NjLkltYWdlQXNzZXQnLFxuICAgIG9wZW46IG9wZW5JbWFnZUFzc2V0LFxuICAgIHByb3BlcnR5U2NoZW1hQ29uZmlnOiB7XG4gICAgICAgIHR5cGU6IHtcbiAgICAgICAgICAgIHRpdGxlOiAnaTE4bjpFTkdJTkUuYXNzZXRzLmltYWdlLnR5cGUnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdpMThuOkVOR0lORS5hc3NldHMuaW1hZ2UudHlwZVRpcCcsXG4gICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIGRlZmF1bHQ6ICdzcHJpdGUtZnJhbWUnLFxuICAgICAgICAgICAgZW51bTogWydyYXcnLCAndGV4dHVyZScsICdub3JtYWwgbWFwJywgJ3Nwcml0ZS1mcmFtZScsICd0ZXh0dXJlIGN1YmUnXSxcbiAgICAgICAgICAgIGVudW1EZXNjcmlwdGlvbnM6IFsncmF3JywgJ3RleHR1cmUnLCAnbm9ybWFsIG1hcCcsICdzcHJpdGUtZnJhbWUnLCAndGV4dHVyZSBjdWJlJ10sXG4gICAgICAgIH0sXG4gICAgICAgIGZsaXBWZXJ0aWNhbDoge1xuICAgICAgICAgICAgdGl0bGU6ICdpMThuOkVOR0lORS5hc3NldHMuaW1hZ2UuZmxpcFZlcnRpY2FsJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnaTE4bjpFTkdJTkUuYXNzZXRzLmltYWdlLmZsaXBWZXJ0aWNhbFRpcCcsXG4gICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgIH0sXG4gICAgfSxcbiAgICBpbXBvcnRlcjoge1xuICAgICAgICAvLyDniYjmnKzlj7flpoLmnpzlj5jmm7TvvIzliJnkvJrlvLrliLbph43mlrDlr7zlhaVcbiAgICAgICAgdmVyc2lvbjogJzEuMC4yNycsXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDmmK/lkKblvLrliLbliLfmlrBcbiAgICAgICAgICogQHBhcmFtIGFzc2V0XG4gICAgICAgICAqL1xuICAgICAgICBhc3luYyBmb3JjZShhc3NldDogQXNzZXQpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBwYXJhbSBhc3NldFxuICAgICAgICAgKi9cbiAgICAgICAgYXN5bmMgaW1wb3J0KGFzc2V0OiBBc3NldCkge1xuICAgICAgICAgICAgbGV0IGV4dE5hbWUgPSBhc3NldC5leHRuYW1lLnRvTG9jYWxlTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAvLyBJZiBpdCdzIGEgc3RyaW5nLCBpcyBhIHBhdGggdG8gdGhlIGltYWdlIGZpbGUuXG4gICAgICAgICAgICAvLyBFbHNlIGl0J3MgdGhlIGltYWdlIGRhdGEgYnVmZmVyLlxuICAgICAgICAgICAgbGV0IGltYWdlRGF0YUJ1ZmZlck9yaW1hZ2VQYXRoOiBzdHJpbmcgfCBCdWZmZXIgPSBhc3NldC5zb3VyY2U7XG4gICAgICAgICAgICBjb25zdCB1c2VyRGF0YSA9IGFzc2V0Lm1ldGEudXNlckRhdGEgYXMgSW1hZ2VBc3NldFVzZXJEYXRhO1xuXG4gICAgICAgICAgICAvLyDov5nkuKrmtYHnqIvkvJrlsIbkuI3lkIznsbvlnovnmoTlm77niYfovazmiJAgcG5nXG4gICAgICAgICAgICBpZiAoZXh0TmFtZSA9PT0gJy5ibXAnKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29udmVydGVkID0gYXdhaXQgY29udmVydEhEUihhc3NldC5zb3VyY2UsIGFzc2V0LnV1aWQsIGFzc2V0LnRlbXApO1xuICAgICAgICAgICAgICAgIGlmIChjb252ZXJ0ZWQgaW5zdGFuY2VvZiBFcnJvciB8fCAhY29udmVydGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBjb252ZXJ0IGJtcCBpbWFnZS4nKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBleHROYW1lID0gY29udmVydGVkLmV4dE5hbWU7XG4gICAgICAgICAgICAgICAgaW1hZ2VEYXRhQnVmZmVyT3JpbWFnZVBhdGggPSBjb252ZXJ0ZWQuc291cmNlO1xuXG4gICAgICAgICAgICAgICAgLy8gYm1wIOWvvOWFpeeahO+8jOm7mOiupOmSqeS4iiBpc1JHQkVcbiAgICAgICAgICAgICAgICB1c2VyRGF0YS5pc1JHQkUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIC8vIOWvueS6jiByZ2JlIOexu+Wei+WbvueJh+m7mOiupOWFs+mXrei/meS4qumAiemhuVxuICAgICAgICAgICAgICAgIHVzZXJEYXRhLmZpeEFscGhhVHJhbnNwYXJlbmN5QXJ0aWZhY3RzIHx8PSBmYWxzZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZXh0TmFtZSA9PT0gJy56bnQnKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc291cmNlID0gYXNzZXQuc291cmNlO1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbnZlcnRlZCA9IGF3YWl0IGNvbnZlcnRIRFIoc291cmNlLCBhc3NldC51dWlkLCBhc3NldC50ZW1wKTtcbiAgICAgICAgICAgICAgICBpZiAoY29udmVydGVkIGluc3RhbmNlb2YgRXJyb3IgfHwgIWNvbnZlcnRlZCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBGYWlsZWQgdG8gY29udmVydCBhc3NldCB7YXNzZXQoJHthc3NldC51dWlkfSl9LmApO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGV4dE5hbWUgPSBjb252ZXJ0ZWQuZXh0TmFtZTtcbiAgICAgICAgICAgICAgICBpbWFnZURhdGFCdWZmZXJPcmltYWdlUGF0aCA9IGNvbnZlcnRlZC5zb3VyY2U7XG4gICAgICAgICAgICAgICAgLy8g5a+55LqOIHJnYmUg57G75Z6L5Zu+54mH6buY6K6k5YWz6Zet6L+Z5Liq6YCJ6aG5XG4gICAgICAgICAgICAgICAgdXNlckRhdGEuZml4QWxwaGFUcmFuc3BhcmVuY3lBcnRpZmFjdHMgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB1c2VyRGF0YS5pc1JHQkUgPSB0cnVlO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChleHROYW1lID09PSAnLmhkcicgfHwgZXh0TmFtZSA9PT0gJy5leHInKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc291cmNlID0gYXNzZXQuc291cmNlO1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbnZlcnRlZCA9IGF3YWl0IGNvbnZlcnRIRFJPckVYUihleHROYW1lLCBzb3VyY2UsIGFzc2V0LnV1aWQsIGFzc2V0LnRlbXApO1xuICAgICAgICAgICAgICAgIGlmIChjb252ZXJ0ZWQgaW5zdGFuY2VvZiBFcnJvciB8fCAhY29udmVydGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEZhaWxlZCB0byBjb252ZXJ0IGFzc2V0IHthc3NldCgke2Fzc2V0LnV1aWR9KX0uYCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZXh0TmFtZSA9IGNvbnZlcnRlZC5leHROYW1lO1xuICAgICAgICAgICAgICAgIGltYWdlRGF0YUJ1ZmZlck9yaW1hZ2VQYXRoID0gY29udmVydGVkLnNvdXJjZTtcbiAgICAgICAgICAgICAgICAvLyDlr7nkuo4gcmdiZSDnsbvlnovlm77niYfpu5jorqTlhbPpl63ov5nkuKrpgInpoblcbiAgICAgICAgICAgICAgICB1c2VyRGF0YS5maXhBbHBoYVRyYW5zcGFyZW5jeUFydGlmYWN0cyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIC8vIGhkciDlr7zlhaXnmoTvvIzpu5jorqTpkqnkuIogaXNSR0JFXG4gICAgICAgICAgICAgICAgdXNlckRhdGEuaXNSR0JFID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBjb25zdCBzaGFycFJlc3VsdCA9IGF3YWl0IFNoYXJwKGltYWdlRGF0YUJ1ZmZlck9yaW1hZ2VQYXRoKTtcbiAgICAgICAgICAgICAgICBjb25zdCBtZXRhRGF0YSA9IGF3YWl0IHNoYXJwUmVzdWx0Lm1ldGFkYXRhKCk7XG4gICAgICAgICAgICAgICAgLy8g6ZW/5a6956ym5ZCIIGN1YmVtYXAg55qE5a+85YWl6KeE5YiZ5pe277yM6buY6K6k5a+85YWl5oiQIHRleHR1cmUgY3ViZVxuICAgICAgICAgICAgICAgIGlmICghdXNlckRhdGEudHlwZSAmJiBjaGVja1NpemUobWV0YURhdGEud2lkdGghLCBtZXRhRGF0YS5oZWlnaHQhKSkge1xuICAgICAgICAgICAgICAgICAgICB1c2VyRGF0YS50eXBlID0gJ3RleHR1cmUgY3ViZSc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IHNpZ25GaWxlID0gam9pbihjb252ZXJ0ZWQuc291cmNlLnJlcGxhY2UoJy5wbmcnLCAnX3NpZ24ucG5nJykpO1xuICAgICAgICAgICAgICAgIGlmIChleGlzdHNTeW5jKHNpZ25GaWxlKSkge1xuICAgICAgICAgICAgICAgICAgICB1c2VyRGF0YS5zaWduID0gdXRpbHMuUGF0aC5yZXNvbHZlVG9Vcmwoc2lnbkZpbGUsICdwcm9qZWN0Jyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IGFscGhhRmlsZSA9IGpvaW4oY29udmVydGVkLnNvdXJjZS5yZXBsYWNlKCcucG5nJywgJ19hbHBoYS5wbmcnKSk7XG4gICAgICAgICAgICAgICAgaWYgKGV4aXN0c1N5bmMoYWxwaGFGaWxlKSkge1xuICAgICAgICAgICAgICAgICAgICB1c2VyRGF0YS5hbHBoYSA9IHV0aWxzLlBhdGgucmVzb2x2ZVRvVXJsKGFscGhhRmlsZSwgJ3Byb2plY3QnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGV4dE5hbWUgPT09ICcudGdhJykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbnZlcnRlZCA9IGF3YWl0IGNvbnZlcnRUR0EoYXdhaXQgcmVhZEZpbGUoYXNzZXQuc291cmNlKSk7XG4gICAgICAgICAgICAgICAgaWYgKGNvbnZlcnRlZCBpbnN0YW5jZW9mIEVycm9yIHx8ICFjb252ZXJ0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIGNvbnZlcnQgdGdhIGltYWdlLicpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGV4dE5hbWUgPSBjb252ZXJ0ZWQuZXh0TmFtZTtcbiAgICAgICAgICAgICAgICBpbWFnZURhdGFCdWZmZXJPcmltYWdlUGF0aCA9IGNvbnZlcnRlZC5kYXRhO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChleHROYW1lID09PSAnLnBzZCcpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb252ZXJ0ZWQgPSBhd2FpdCBjb252ZXJ0UFNEKGF3YWl0IHJlYWRGaWxlKGFzc2V0LnNvdXJjZSkpO1xuICAgICAgICAgICAgICAgIGV4dE5hbWUgPSBjb252ZXJ0ZWQuZXh0TmFtZTtcbiAgICAgICAgICAgICAgICBpbWFnZURhdGFCdWZmZXJPcmltYWdlUGF0aCA9IGNvbnZlcnRlZC5kYXRhO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChleHROYW1lID09PSAnLnRpZicgfHwgZXh0TmFtZSA9PT0gJy50aWZmJykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbnZlcnRlZCA9IGF3YWl0IGNvbnZlcnRUSUZGKGFzc2V0LnNvdXJjZSk7XG4gICAgICAgICAgICAgICAgaWYgKGNvbnZlcnRlZCBpbnN0YW5jZW9mIEVycm9yIHx8ICFjb252ZXJ0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgRmFpbGVkIHRvIGNvbnZlcnQgJHtleHROYW1lfSBpbWFnZS5gKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBleHROYW1lID0gY29udmVydGVkLmV4dE5hbWU7XG4gICAgICAgICAgICAgICAgaW1hZ2VEYXRhQnVmZmVyT3JpbWFnZVBhdGggPSBjb252ZXJ0ZWQuZGF0YTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIOS4uuS4jeWQjOWvvOWFpeexu+Wei+eahOWbvueJh+iuvue9ruS8quW9seeahOm7mOiupOWAvFxuICAgICAgICAgICAgaWYgKHVzZXJEYXRhLmZpeEFscGhhVHJhbnNwYXJlbmN5QXJ0aWZhY3RzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICB1c2VyRGF0YS5maXhBbHBoYVRyYW5zcGFyZW5jeUFydGlmYWN0cyA9IGlzQ2FwYWJsZVRvRml4QWxwaGFUcmFuc3BhcmVuY3lBcnRpZmFjdHMoYXNzZXQsIHVzZXJEYXRhLnR5cGUsIGFzc2V0LmV4dG5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaW1hZ2VEYXRhQnVmZmVyT3JpbWFnZVBhdGggPSBhd2FpdCBoYW5kbGVJbWFnZVVzZXJEYXRhKGFzc2V0LCBpbWFnZURhdGFCdWZmZXJPcmltYWdlUGF0aCwgZXh0TmFtZSk7XG5cbiAgICAgICAgICAgIGF3YWl0IHNhdmVJbWFnZUFzc2V0KGFzc2V0LCBpbWFnZURhdGFCdWZmZXJPcmltYWdlUGF0aCwgZXh0TmFtZSwgYXNzZXQuYmFzZW5hbWUpO1xuICAgICAgICAgICAgYXdhaXQgaW1wb3J0V2l0aFR5cGUoYXNzZXQsIHVzZXJEYXRhLnR5cGUsIGFzc2V0LmJhc2VuYW1lLCBhc3NldC5leHRuYW1lKTtcbiAgICAgICAgICAgIGlmICh1c2VyRGF0YS5zaWduKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgYXNzZXQuY3JlYXRlU3ViQXNzZXQoJ3NpZ24nLCAnc2lnbi1pbWFnZScsIHtcbiAgICAgICAgICAgICAgICAgICAgZGlzcGxheU5hbWU6ICdzaWduJyxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gaWYgKHVzZXJEYXRhLmFscGhhKSB7XG4gICAgICAgICAgICAvLyAgICAgLy8gVE9ETyDmmoLml7blhYjnlKjnnYDvvIzlkI7nu63lj6/ku6Xmm7TmlLnmm7TpgJrnlKjnmoTlkI3lrZdcbiAgICAgICAgICAgIC8vICAgICBhd2FpdCBhc3NldC5jcmVhdGVTdWJBc3NldCgnYWxwaGEnLCAnc2lnbi1pbWFnZScsIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgZGlzcGxheU5hbWU6ICdhbHBoYScsXG4gICAgICAgICAgICAvLyAgICAgfSk7XG4gICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICAvLyBhd2FpdCB0aGlzLmltcG9ydFdpdGhUeXBlKGFzc2V0LCB1c2VyRGF0YS50eXBlLCBhc3NldC5iYXNlbmFtZSk7XG5cbiAgICAgICAgICAgIGlmICh1c2VyRGF0YS5hbHBoYSkge1xuICAgICAgICAgICAgICAgIC8vIFRPRE8g5pqC5pe25YWI55So552A77yM5ZCO57ut5Y+v5Lul5pu05pS55pu06YCa55So55qE5ZCN5a2XXG4gICAgICAgICAgICAgICAgYXdhaXQgYXNzZXQuY3JlYXRlU3ViQXNzZXQoJ2FscGhhJywgJ2FscGhhLWltYWdlJywge1xuICAgICAgICAgICAgICAgICAgICBkaXNwbGF5TmFtZTogJ2FscGhhJyxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LFxuICAgIH0sXG5cbiAgICB1c2VyRGF0YUNvbmZpZzoge1xuICAgICAgICBkZWZhdWx0OiB7XG4gICAgICAgICAgICB0eXBlOiB7XG4gICAgICAgICAgICAgICAgbGFiZWw6ICdpMThuOkVOR0lORS5hc3NldHMuaW1hZ2UudHlwZScsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdpMThuOkVOR0lORS5hc3NldHMuaW1hZ2UudHlwZVRpcCcsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogJ3Nwcml0ZS1mcmFtZScsXG4gICAgICAgICAgICAgICAgcmVuZGVyOiB7XG4gICAgICAgICAgICAgICAgICAgIHVpOiAndWktc2VsZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgaXRlbXM6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ2kxOG46aW1wb3J0ZXIucHJvcGVydHlfc2NoZW1hLmltYWdlLnR5cGVfcmF3JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogJ3JhdycsXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnaTE4bjppbXBvcnRlci5wcm9wZXJ0eV9zY2hlbWEuaW1hZ2UudHlwZV90ZXh0dXJlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogJ3RleHR1cmUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ2kxOG46aW1wb3J0ZXIucHJvcGVydHlfc2NoZW1hLmltYWdlLnR5cGVfbm9ybWFsX21hcCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6ICdub3JtYWwgbWFwJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdpMThuOmltcG9ydGVyLnByb3BlcnR5X3NjaGVtYS5pbWFnZS50eXBlX3Nwcml0ZV9mcmFtZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6ICdzcHJpdGUtZnJhbWUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ2kxOG46aW1wb3J0ZXIucHJvcGVydHlfc2NoZW1hLmltYWdlLnR5cGVfdGV4dHVyZV9jdWJlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogJ3RleHR1cmUgY3ViZScsXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmxpcFZlcnRpY2FsOiB7XG4gICAgICAgICAgICAgICAgbGFiZWw6ICdpMThuOkVOR0lORS5hc3NldHMuaW1hZ2UuZmxpcFZlcnRpY2FsJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2kxOG46RU5HSU5FLmFzc2V0cy5pbWFnZS5mbGlwVmVydGljYWxUaXAnLFxuICAgICAgICAgICAgICAgIHJlbmRlcjoge1xuICAgICAgICAgICAgICAgICAgICB1aTogJ3VpLWNoZWNrYm94JyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog5Yik5pat5piv5ZCm5YWB6K645L2/55So5b2T5YmN55qEIEhhbmRsZXIg6L+b6KGM5a+85YWlXG4gICAgICogQHBhcmFtIGFzc2V0XG4gICAgICovXG4gICAgYXN5bmMgdmFsaWRhdGUoYXNzZXQ6IEFzc2V0KSB7XG4gICAgICAgIHJldHVybiAhKGF3YWl0IGFzc2V0LmlzRGlyZWN0b3J5KCkpO1xuICAgIH0sXG59O1xuXG5leHBvcnQgZGVmYXVsdCBJbWFnZUhhbmRsZXI7XG4iXX0=