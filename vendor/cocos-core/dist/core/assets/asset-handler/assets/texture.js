"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextureHandler = void 0;
const asset_db_1 = require("@cocos/asset-db");
const cc_1 = require("cc");
const utils_1 = require("../utils");
const utils_2 = require("./image/utils");
const texture_base_1 = require("./texture-base");
const utils_3 = require("../../utils");
exports.TextureHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: 'texture',
    // 引擎内对应的类型
    assetType: 'cc.Texture2D',
    propertySchemaConfig: {
        ...(0, texture_base_1.createTextureBasePropertySchema)(),
        imageUuidOrDatabaseUri: {
            title: 'i18n:ENGINE.assets.image.label',
            description: 'i18n:importer.property_schema.texture.image_uuid_or_database_uri_description',
            type: 'string',
            default: '',
        },
        isUuid: {
            title: 'i18n:importer.property_schema.texture.use_uuid',
            description: 'i18n:importer.property_schema.texture.use_uuid_description',
            type: 'boolean',
            default: true,
        },
    },
    importer: {
        // 版本号如果变更，则会强制重新导入
        version: '1.0.22',
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
            const userData = asset.userData;
            // @ts-ignore
            const texture = new cc.Texture2D();
            if (asset.parent instanceof asset_db_1.Asset) {
                texture.name = asset.parent.basename || '';
                // hdr exr 导入默认值需为 nearest 过滤模式
                if (!userData.mipfilter && ['.hdr', '.exr'].includes(asset.parent.extname)) {
                    userData.mipfilter = 'none';
                    userData.minfilter = 'nearest';
                    userData.magfilter = 'nearest';
                }
            }
            asset.assignUserData((0, utils_2.makeDefaultTexture2DAssetUserData)());
            (0, texture_base_1.applyTextureBaseAssetUserData)(userData, texture);
            const imageAsset = getImageAsset(asset);
            if (imageAsset) {
                texture._mipmaps = [imageAsset];
            }
            else {
                // 如果存在 imageUuidOrDatabaseUri 却无法获取到可能是资源尚未导入完成，需要做标记
                if (asset.userData.imageUuidOrDatabaseUri) {
                    asset.depend(asset.userData.imageUuidOrDatabaseUri);
                    return false;
                }
            }
            const serializeJSON = EditorExtends.serialize(texture);
            await asset.saveToLibrary('.json', serializeJSON);
            const depends = (0, utils_1.getDependUUIDList)(serializeJSON);
            asset.setData('depends', depends);
            return true;
        },
    },
};
exports.default = exports.TextureHandler;
function getImageUuid(asset) {
    const userData = asset.userData;
    const imageUuidOrDatabaseUri = userData.imageUuidOrDatabaseUri;
    if (!imageUuidOrDatabaseUri) {
        return null;
    }
    if (userData.isUuid) {
        return imageUuidOrDatabaseUri;
    }
    else {
        const imageUuid = (0, utils_3.url2uuid)(imageUuidOrDatabaseUri);
        if (imageUuid) {
            return imageUuid;
        }
    }
    return null;
}
function getImageAsset(asset) {
    const imageUuid = getImageUuid(asset);
    if (imageUuid !== null) {
        // @ts-ignore
        const image = EditorExtends.serialize.asAsset(imageUuid, cc_1.ImageAsset);
        return image;
    }
    return null;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dHVyZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9jb3JlL2Fzc2V0cy9hc3NldC1oYW5kbGVyL2Fzc2V0cy90ZXh0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDhDQUFzRDtBQUV0RCwyQkFBZ0M7QUFJaEMsb0NBQTZDO0FBQzdDLHlDQUFrRTtBQUNsRSxpREFBZ0c7QUFDaEcsdUNBQXVDO0FBRTFCLFFBQUEsY0FBYyxHQUFpQjtJQUN4QyxnQ0FBZ0M7SUFDaEMsSUFBSSxFQUFFLFNBQVM7SUFFZixXQUFXO0lBQ1gsU0FBUyxFQUFFLGNBQWM7SUFFekIsb0JBQW9CLEVBQUU7UUFDbEIsR0FBRyxJQUFBLDhDQUErQixHQUFFO1FBQ3BDLHNCQUFzQixFQUFFO1lBQ3BCLEtBQUssRUFBRSxnQ0FBZ0M7WUFDdkMsV0FBVyxFQUFFLDhFQUE4RTtZQUMzRixJQUFJLEVBQUUsUUFBUTtZQUNkLE9BQU8sRUFBRSxFQUFFO1NBQ2Q7UUFDRCxNQUFNLEVBQUU7WUFDSixLQUFLLEVBQUUsZ0RBQWdEO1lBQ3ZELFdBQVcsRUFBRSw0REFBNEQ7WUFDekUsSUFBSSxFQUFFLFNBQVM7WUFDZixPQUFPLEVBQUUsSUFBSTtTQUNoQjtLQUNKO0lBRUQsUUFBUSxFQUFFO1FBQ04sbUJBQW1CO1FBQ25CLE9BQU8sRUFBRSxRQUFRO1FBRWpCOzs7Ozs7OztXQVFHO1FBQ0gsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFtQjtZQUM1QixNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsUUFBa0MsQ0FBQztZQUMxRCxhQUFhO1lBQ2IsTUFBTSxPQUFPLEdBQUcsSUFBSSxFQUFFLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDbkMsSUFBSSxLQUFLLENBQUMsTUFBTSxZQUFZLGdCQUFLLEVBQUUsQ0FBQztnQkFDaEMsT0FBTyxDQUFDLElBQUksR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLFFBQVEsSUFBSSxFQUFFLENBQUM7Z0JBQzNDLCtCQUErQjtnQkFDL0IsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLElBQUksQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztvQkFDekUsUUFBUSxDQUFDLFNBQVMsR0FBRyxNQUFNLENBQUM7b0JBQzVCLFFBQVEsQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO29CQUMvQixRQUFRLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztnQkFDbkMsQ0FBQztZQUNMLENBQUM7WUFDRCxLQUFLLENBQUMsY0FBYyxDQUFDLElBQUEseUNBQWlDLEdBQUUsQ0FBQyxDQUFDO1lBQzFELElBQUEsNENBQTZCLEVBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBRWpELE1BQU0sVUFBVSxHQUFHLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN4QyxJQUFJLFVBQVUsRUFBRSxDQUFDO2dCQUNiLE9BQU8sQ0FBQyxRQUFRLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNwQyxDQUFDO2lCQUFNLENBQUM7Z0JBQ0osc0RBQXNEO2dCQUN0RCxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztvQkFDeEMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLHNCQUFzQixDQUFDLENBQUM7b0JBQ3BELE9BQU8sS0FBSyxDQUFDO2dCQUNqQixDQUFDO1lBQ0wsQ0FBQztZQUVELE1BQU0sYUFBYSxHQUFHLGFBQWEsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDdkQsTUFBTSxLQUFLLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxhQUFhLENBQUMsQ0FBQztZQUVsRCxNQUFNLE9BQU8sR0FBRyxJQUFBLHlCQUFpQixFQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ2pELEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBRWxDLE9BQU8sSUFBSSxDQUFDO1FBQ2hCLENBQUM7S0FDSjtDQUNKLENBQUM7QUFFRixrQkFBZSxzQkFBYyxDQUFDO0FBRTlCLFNBQVMsWUFBWSxDQUFDLEtBQW1CO0lBQ3JDLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxRQUFrQyxDQUFDO0lBQzFELE1BQU0sc0JBQXNCLEdBQUcsUUFBUSxDQUFDLHNCQUFzQixDQUFDO0lBQy9ELElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO1FBQzFCLE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFDRCxJQUFJLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNsQixPQUFPLHNCQUFzQixDQUFDO0lBQ2xDLENBQUM7U0FBTSxDQUFDO1FBQ0osTUFBTSxTQUFTLEdBQUcsSUFBQSxnQkFBUSxFQUFDLHNCQUFzQixDQUFDLENBQUM7UUFDbkQsSUFBSSxTQUFTLEVBQUUsQ0FBQztZQUNaLE9BQU8sU0FBUyxDQUFDO1FBQ3JCLENBQUM7SUFDTCxDQUFDO0lBQ0QsT0FBTyxJQUFJLENBQUM7QUFDaEIsQ0FBQztBQUVELFNBQVMsYUFBYSxDQUFDLEtBQW1CO0lBQ3RDLE1BQU0sU0FBUyxHQUFHLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUN0QyxJQUFJLFNBQVMsS0FBSyxJQUFJLEVBQUUsQ0FBQztRQUNyQixhQUFhO1FBQ2IsTUFBTSxLQUFLLEdBQUcsYUFBYSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLGVBQVUsQ0FBQyxDQUFDO1FBQ3JFLE9BQU8sS0FBSyxDQUFDO0lBQ2pCLENBQUM7SUFDRCxPQUFPLElBQUksQ0FBQztBQUNoQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVmlydHVhbEFzc2V0LCBBc3NldCB9IGZyb20gJ0Bjb2Nvcy9hc3NldC1kYic7XG5cbmltcG9ydCB7IEltYWdlQXNzZXQgfSBmcm9tICdjYyc7XG5cbmltcG9ydCB7IEFzc2V0SGFuZGxlciB9IGZyb20gJy4uLy4uL0B0eXBlcy9wcm90ZWN0ZWQnO1xuaW1wb3J0IHsgVGV4dHVyZTJEQXNzZXRVc2VyRGF0YSB9IGZyb20gJy4uLy4uL0B0eXBlcy91c2VyRGF0YXMnO1xuaW1wb3J0IHsgZ2V0RGVwZW5kVVVJRExpc3QgfSBmcm9tICcuLi91dGlscyc7XG5pbXBvcnQgeyBtYWtlRGVmYXVsdFRleHR1cmUyREFzc2V0VXNlckRhdGEgfSBmcm9tICcuL2ltYWdlL3V0aWxzJztcbmltcG9ydCB7IGFwcGx5VGV4dHVyZUJhc2VBc3NldFVzZXJEYXRhLCBjcmVhdGVUZXh0dXJlQmFzZVByb3BlcnR5U2NoZW1hIH0gZnJvbSAnLi90ZXh0dXJlLWJhc2UnO1xuaW1wb3J0IHsgdXJsMnV1aWQgfSBmcm9tICcuLi8uLi91dGlscyc7XG5cbmV4cG9ydCBjb25zdCBUZXh0dXJlSGFuZGxlcjogQXNzZXRIYW5kbGVyID0ge1xuICAgIC8vIEhhbmRsZXIg55qE5ZCN5a2X77yM55So5LqO5oyH5a6aIEhhbmRsZXIgYXMg562JXG4gICAgbmFtZTogJ3RleHR1cmUnLFxuXG4gICAgLy8g5byV5pOO5YaF5a+55bqU55qE57G75Z6LXG4gICAgYXNzZXRUeXBlOiAnY2MuVGV4dHVyZTJEJyxcblxuICAgIHByb3BlcnR5U2NoZW1hQ29uZmlnOiB7XG4gICAgICAgIC4uLmNyZWF0ZVRleHR1cmVCYXNlUHJvcGVydHlTY2hlbWEoKSxcbiAgICAgICAgaW1hZ2VVdWlkT3JEYXRhYmFzZVVyaToge1xuICAgICAgICAgICAgdGl0bGU6ICdpMThuOkVOR0lORS5hc3NldHMuaW1hZ2UubGFiZWwnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdpMThuOmltcG9ydGVyLnByb3BlcnR5X3NjaGVtYS50ZXh0dXJlLmltYWdlX3V1aWRfb3JfZGF0YWJhc2VfdXJpX2Rlc2NyaXB0aW9uJyxcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgZGVmYXVsdDogJycsXG4gICAgICAgIH0sXG4gICAgICAgIGlzVXVpZDoge1xuICAgICAgICAgICAgdGl0bGU6ICdpMThuOmltcG9ydGVyLnByb3BlcnR5X3NjaGVtYS50ZXh0dXJlLnVzZV91dWlkJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnaTE4bjppbXBvcnRlci5wcm9wZXJ0eV9zY2hlbWEudGV4dHVyZS51c2VfdXVpZF9kZXNjcmlwdGlvbicsXG4gICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgICAgICBkZWZhdWx0OiB0cnVlLFxuICAgICAgICB9LFxuICAgIH0sXG5cbiAgICBpbXBvcnRlcjoge1xuICAgICAgICAvLyDniYjmnKzlj7flpoLmnpzlj5jmm7TvvIzliJnkvJrlvLrliLbph43mlrDlr7zlhaVcbiAgICAgICAgdmVyc2lvbjogJzEuMC4yMicsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOWunumZheWvvOWFpea1geeoi1xuICAgICAgICAgKiDpnIDopoHoh6rlt7HmjqfliLbmmK/lkKbnlJ/miJDjgIHmi7fotJ3mlofku7ZcbiAgICAgICAgICpcbiAgICAgICAgICog6L+U5Zue5piv5ZCm5a+85YWl5oiQ5Yqf55qE5qCH6K6wXG4gICAgICAgICAqIOWmguaenOi/lOWbniBmYWxzZe+8jOWImSBpbXBvcnRlZCDmoIforrDkuI3kvJrlj5jmiJAgdHJ1ZVxuICAgICAgICAgKiDlkI7nu63nmoTkuIDns7vliJfmk43kvZzpg73kuI3kvJrmiafooYxcbiAgICAgICAgICogQHBhcmFtIGFzc2V0XG4gICAgICAgICAqL1xuICAgICAgICBhc3luYyBpbXBvcnQoYXNzZXQ6IFZpcnR1YWxBc3NldCkge1xuICAgICAgICAgICAgY29uc3QgdXNlckRhdGEgPSBhc3NldC51c2VyRGF0YSBhcyBUZXh0dXJlMkRBc3NldFVzZXJEYXRhO1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgY29uc3QgdGV4dHVyZSA9IG5ldyBjYy5UZXh0dXJlMkQoKTtcbiAgICAgICAgICAgIGlmIChhc3NldC5wYXJlbnQgaW5zdGFuY2VvZiBBc3NldCkge1xuICAgICAgICAgICAgICAgIHRleHR1cmUubmFtZSA9IGFzc2V0LnBhcmVudC5iYXNlbmFtZSB8fCAnJztcbiAgICAgICAgICAgICAgICAvLyBoZHIgZXhyIOWvvOWFpem7mOiupOWAvOmcgOS4uiBuZWFyZXN0IOi/h+a7pOaooeW8j1xuICAgICAgICAgICAgICAgIGlmICghdXNlckRhdGEubWlwZmlsdGVyICYmIFsnLmhkcicsICcuZXhyJ10uaW5jbHVkZXMoYXNzZXQucGFyZW50LmV4dG5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHVzZXJEYXRhLm1pcGZpbHRlciA9ICdub25lJztcbiAgICAgICAgICAgICAgICAgICAgdXNlckRhdGEubWluZmlsdGVyID0gJ25lYXJlc3QnO1xuICAgICAgICAgICAgICAgICAgICB1c2VyRGF0YS5tYWdmaWx0ZXIgPSAnbmVhcmVzdCc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYXNzZXQuYXNzaWduVXNlckRhdGEobWFrZURlZmF1bHRUZXh0dXJlMkRBc3NldFVzZXJEYXRhKCkpO1xuICAgICAgICAgICAgYXBwbHlUZXh0dXJlQmFzZUFzc2V0VXNlckRhdGEodXNlckRhdGEsIHRleHR1cmUpO1xuXG4gICAgICAgICAgICBjb25zdCBpbWFnZUFzc2V0ID0gZ2V0SW1hZ2VBc3NldChhc3NldCk7XG4gICAgICAgICAgICBpZiAoaW1hZ2VBc3NldCkge1xuICAgICAgICAgICAgICAgIHRleHR1cmUuX21pcG1hcHMgPSBbaW1hZ2VBc3NldF07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIOWmguaenOWtmOWcqCBpbWFnZVV1aWRPckRhdGFiYXNlVXJpIOWNtOaXoOazleiOt+WPluWIsOWPr+iDveaYr+i1hOa6kOWwmuacquWvvOWFpeWujOaIkO+8jOmcgOimgeWBmuagh+iusFxuICAgICAgICAgICAgICAgIGlmIChhc3NldC51c2VyRGF0YS5pbWFnZVV1aWRPckRhdGFiYXNlVXJpKSB7XG4gICAgICAgICAgICAgICAgICAgIGFzc2V0LmRlcGVuZChhc3NldC51c2VyRGF0YS5pbWFnZVV1aWRPckRhdGFiYXNlVXJpKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgc2VyaWFsaXplSlNPTiA9IEVkaXRvckV4dGVuZHMuc2VyaWFsaXplKHRleHR1cmUpO1xuICAgICAgICAgICAgYXdhaXQgYXNzZXQuc2F2ZVRvTGlicmFyeSgnLmpzb24nLCBzZXJpYWxpemVKU09OKTtcblxuICAgICAgICAgICAgY29uc3QgZGVwZW5kcyA9IGdldERlcGVuZFVVSURMaXN0KHNlcmlhbGl6ZUpTT04pO1xuICAgICAgICAgICAgYXNzZXQuc2V0RGF0YSgnZGVwZW5kcycsIGRlcGVuZHMpO1xuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSxcbiAgICB9LFxufTtcblxuZXhwb3J0IGRlZmF1bHQgVGV4dHVyZUhhbmRsZXI7XG5cbmZ1bmN0aW9uIGdldEltYWdlVXVpZChhc3NldDogVmlydHVhbEFzc2V0KTogc3RyaW5nIHwgbnVsbCB7XG4gICAgY29uc3QgdXNlckRhdGEgPSBhc3NldC51c2VyRGF0YSBhcyBUZXh0dXJlMkRBc3NldFVzZXJEYXRhO1xuICAgIGNvbnN0IGltYWdlVXVpZE9yRGF0YWJhc2VVcmkgPSB1c2VyRGF0YS5pbWFnZVV1aWRPckRhdGFiYXNlVXJpO1xuICAgIGlmICghaW1hZ2VVdWlkT3JEYXRhYmFzZVVyaSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgaWYgKHVzZXJEYXRhLmlzVXVpZCkge1xuICAgICAgICByZXR1cm4gaW1hZ2VVdWlkT3JEYXRhYmFzZVVyaTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBpbWFnZVV1aWQgPSB1cmwydXVpZChpbWFnZVV1aWRPckRhdGFiYXNlVXJpKTtcbiAgICAgICAgaWYgKGltYWdlVXVpZCkge1xuICAgICAgICAgICAgcmV0dXJuIGltYWdlVXVpZDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gZ2V0SW1hZ2VBc3NldChhc3NldDogVmlydHVhbEFzc2V0KSB7XG4gICAgY29uc3QgaW1hZ2VVdWlkID0gZ2V0SW1hZ2VVdWlkKGFzc2V0KTtcbiAgICBpZiAoaW1hZ2VVdWlkICE9PSBudWxsKSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY29uc3QgaW1hZ2UgPSBFZGl0b3JFeHRlbmRzLnNlcmlhbGl6ZS5hc0Fzc2V0KGltYWdlVXVpZCwgSW1hZ2VBc3NldCk7XG4gICAgICAgIHJldHVybiBpbWFnZTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG59XG4iXX0=