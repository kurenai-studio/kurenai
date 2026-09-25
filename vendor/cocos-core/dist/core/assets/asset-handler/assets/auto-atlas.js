"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const texture_base_1 = require("./texture-base");
const utils_1 = require("../utils");
const defaultAutoAtlasUserData = {
    maxWidth: 1024,
    maxHeight: 1024,
    // padding of image.
    padding: 2,
    allowRotation: true,
    forceSquared: false,
    powerOfTwo: false,
    algorithm: 'MaxRects',
    format: 'png',
    quality: 80,
    contourBleed: true,
    paddingBleed: true,
    filterUnused: true,
    removeTextureInBundle: true,
    removeImageInBundle: true,
    removeSpriteAtlasInBundle: true,
    compressSettings: {},
    textureSetting: (0, texture_base_1.makeDefaultTextureBaseAssetUserData)(),
};
const AutoAtlasHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: 'auto-atlas',
    // pac 文件实际上在编辑器下没用到，只有构建时会用。因此这里把类型设置为 cc.SpriteAtlas，方便构建时当成图集来处理。
    assetType: 'cc.SpriteAtlas',
    propertySchemaConfig: {
        maxWidth: {
            title: 'i18n:importer.property_schema.auto_atlas.max_width',
            description: 'i18n:importer.property_schema.auto_atlas.max_width_description',
            type: 'number',
            default: defaultAutoAtlasUserData.maxWidth,
            minimum: 1,
            step: 1,
        },
        maxHeight: {
            title: 'i18n:importer.property_schema.auto_atlas.max_height',
            description: 'i18n:importer.property_schema.auto_atlas.max_height_description',
            type: 'number',
            default: defaultAutoAtlasUserData.maxHeight,
            minimum: 1,
            step: 1,
        },
        padding: {
            title: 'i18n:importer.property_schema.auto_atlas.padding',
            description: 'i18n:importer.property_schema.auto_atlas.padding_description',
            type: 'number',
            default: defaultAutoAtlasUserData.padding,
            minimum: 0,
            step: 1,
        },
        allowRotation: {
            title: 'i18n:importer.property_schema.auto_atlas.allow_rotation',
            description: 'i18n:importer.property_schema.auto_atlas.allow_rotation_description',
            type: 'boolean',
            default: defaultAutoAtlasUserData.allowRotation,
        },
        forceSquared: {
            title: 'i18n:importer.property_schema.auto_atlas.force_squared',
            description: 'i18n:importer.property_schema.auto_atlas.force_squared_description',
            type: 'boolean',
            default: defaultAutoAtlasUserData.forceSquared,
        },
        powerOfTwo: {
            title: 'i18n:importer.property_schema.auto_atlas.power_of_two',
            description: 'i18n:importer.property_schema.auto_atlas.power_of_two_description',
            type: 'boolean',
            default: defaultAutoAtlasUserData.powerOfTwo,
        },
        algorithm: {
            title: 'i18n:importer.property_schema.auto_atlas.algorithm',
            description: 'i18n:importer.property_schema.auto_atlas.algorithm_description',
            type: 'string',
            default: defaultAutoAtlasUserData.algorithm,
            enum: ['MaxRects'],
            enumDescriptions: ['i18n:importer.property_schema.auto_atlas.max_rects'],
        },
        format: {
            title: 'i18n:importer.property_schema.auto_atlas.format',
            description: 'i18n:importer.property_schema.auto_atlas.format_description',
            type: 'string',
            default: defaultAutoAtlasUserData.format,
            enum: ['png', 'jpg'],
            enumDescriptions: [
                'i18n:importer.property_schema.auto_atlas.png',
                'i18n:importer.property_schema.auto_atlas.jpg',
            ],
        },
        quality: {
            title: 'i18n:importer.property_schema.auto_atlas.quality',
            description: 'i18n:importer.property_schema.auto_atlas.quality_description',
            type: 'number',
            default: defaultAutoAtlasUserData.quality,
            minimum: 0,
            maximum: 100,
            step: 1,
        },
        contourBleed: {
            title: 'i18n:importer.property_schema.auto_atlas.contour_bleed',
            description: 'i18n:importer.property_schema.auto_atlas.contour_bleed_description',
            type: 'boolean',
            default: defaultAutoAtlasUserData.contourBleed,
        },
        paddingBleed: {
            title: 'i18n:importer.property_schema.auto_atlas.padding_bleed',
            description: 'i18n:importer.property_schema.auto_atlas.padding_bleed_description',
            type: 'boolean',
            default: defaultAutoAtlasUserData.paddingBleed,
        },
        filterUnused: {
            title: 'i18n:importer.property_schema.auto_atlas.filter_unused',
            description: 'i18n:importer.property_schema.auto_atlas.filter_unused_description',
            type: 'boolean',
            default: defaultAutoAtlasUserData.filterUnused,
        },
        removeTextureInBundle: {
            title: 'i18n:importer.property_schema.auto_atlas.remove_texture_in_bundle',
            description: 'i18n:importer.property_schema.auto_atlas.remove_texture_in_bundle_description',
            type: 'boolean',
            default: defaultAutoAtlasUserData.removeTextureInBundle,
        },
        removeImageInBundle: {
            title: 'i18n:importer.property_schema.auto_atlas.remove_image_in_bundle',
            description: 'i18n:importer.property_schema.auto_atlas.remove_image_in_bundle_description',
            type: 'boolean',
            default: defaultAutoAtlasUserData.removeImageInBundle,
        },
        removeSpriteAtlasInBundle: {
            title: 'i18n:importer.property_schema.auto_atlas.remove_sprite_atlas_in_bundle',
            description: 'i18n:importer.property_schema.auto_atlas.remove_sprite_atlas_in_bundle_description',
            type: 'boolean',
            default: defaultAutoAtlasUserData.removeSpriteAtlasInBundle,
        },
        textureSetting: {
            title: 'i18n:importer.property_schema.auto_atlas.texture_setting',
            description: 'i18n:importer.property_schema.auto_atlas.texture_setting_description',
            type: 'object',
            default: defaultAutoAtlasUserData.textureSetting,
            properties: (0, texture_base_1.createTextureBasePropertySchema)(),
        },
    },
    createInfo: {
        generateMenuInfo() {
            return [
                {
                    label: 'i18n:ENGINE.assets.newPac',
                    fullFileName: 'auto-atlas.pac',
                    template: `db://internal/default_file_content/${AutoAtlasHandler.name}/default.pac`,
                    name: 'default',
                },
            ];
        },
    },
    importer: {
        version: '1.0.8',
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
            Object.keys(defaultAutoAtlasUserData).forEach((key) => {
                if (!(key in userData)) {
                    // @ts-ignore
                    userData[key] = defaultAutoAtlasUserData[key];
                }
            });
            // @ts-ignore
            const autoAtlas = new cc.SpriteAtlas();
            autoAtlas.name = asset.basename || '';
            const serializeJSON = EditorExtends.serialize(autoAtlas);
            await asset.saveToLibrary('.json', serializeJSON);
            const depends = (0, utils_1.getDependUUIDList)(serializeJSON);
            asset.setData('depends', depends);
            return true;
        },
    },
};
exports.default = AutoAtlasHandler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0by1hdGxhcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9jb3JlL2Fzc2V0cy9hc3NldC1oYW5kbGVyL2Fzc2V0cy9hdXRvLWF0bGFzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0EsaURBQXNHO0FBRXRHLG9DQUE2QztBQUk3QyxNQUFNLHdCQUF3QixHQUFHO0lBQzdCLFFBQVEsRUFBRSxJQUFJO0lBQ2QsU0FBUyxFQUFFLElBQUk7SUFFZixvQkFBb0I7SUFDcEIsT0FBTyxFQUFFLENBQUM7SUFFVixhQUFhLEVBQUUsSUFBSTtJQUNuQixZQUFZLEVBQUUsS0FBSztJQUNuQixVQUFVLEVBQUUsS0FBSztJQUNqQixTQUFTLEVBQUUsVUFBVTtJQUNyQixNQUFNLEVBQUUsS0FBSztJQUNiLE9BQU8sRUFBRSxFQUFFO0lBQ1gsWUFBWSxFQUFFLElBQUk7SUFDbEIsWUFBWSxFQUFFLElBQUk7SUFDbEIsWUFBWSxFQUFFLElBQUk7SUFDbEIscUJBQXFCLEVBQUUsSUFBSTtJQUMzQixtQkFBbUIsRUFBRSxJQUFJO0lBQ3pCLHlCQUF5QixFQUFFLElBQUk7SUFDL0IsZ0JBQWdCLEVBQUUsRUFBRTtJQUNwQixjQUFjLEVBQUUsSUFBQSxrREFBbUMsR0FBRTtDQUN4RCxDQUFDO0FBRUYsTUFBTSxnQkFBZ0IsR0FBaUI7SUFDbkMsZ0NBQWdDO0lBQ2hDLElBQUksRUFBRSxZQUFZO0lBRWxCLG9FQUFvRTtJQUNwRSxTQUFTLEVBQUUsZ0JBQWdCO0lBQzNCLG9CQUFvQixFQUFFO1FBQ2QsUUFBUSxFQUFFO1lBQ04sS0FBSyxFQUFFLG9EQUFvRDtZQUMzRCxXQUFXLEVBQUUsZ0VBQWdFO1lBQzdFLElBQUksRUFBRSxRQUFRO1lBQ2QsT0FBTyxFQUFFLHdCQUF3QixDQUFDLFFBQVE7WUFDMUMsT0FBTyxFQUFFLENBQUM7WUFDVixJQUFJLEVBQUUsQ0FBQztTQUNWO1FBQ0QsU0FBUyxFQUFFO1lBQ1AsS0FBSyxFQUFFLHFEQUFxRDtZQUM1RCxXQUFXLEVBQUUsaUVBQWlFO1lBQzlFLElBQUksRUFBRSxRQUFRO1lBQ2QsT0FBTyxFQUFFLHdCQUF3QixDQUFDLFNBQVM7WUFDM0MsT0FBTyxFQUFFLENBQUM7WUFDVixJQUFJLEVBQUUsQ0FBQztTQUNWO1FBQ0QsT0FBTyxFQUFFO1lBQ0wsS0FBSyxFQUFFLGtEQUFrRDtZQUN6RCxXQUFXLEVBQUUsOERBQThEO1lBQzNFLElBQUksRUFBRSxRQUFRO1lBQ2QsT0FBTyxFQUFFLHdCQUF3QixDQUFDLE9BQU87WUFDekMsT0FBTyxFQUFFLENBQUM7WUFDVixJQUFJLEVBQUUsQ0FBQztTQUNWO1FBQ0QsYUFBYSxFQUFFO1lBQ1gsS0FBSyxFQUFFLHlEQUF5RDtZQUNoRSxXQUFXLEVBQUUscUVBQXFFO1lBQ2xGLElBQUksRUFBRSxTQUFTO1lBQ2YsT0FBTyxFQUFFLHdCQUF3QixDQUFDLGFBQWE7U0FDbEQ7UUFDRCxZQUFZLEVBQUU7WUFDVixLQUFLLEVBQUUsd0RBQXdEO1lBQy9ELFdBQVcsRUFBRSxvRUFBb0U7WUFDakYsSUFBSSxFQUFFLFNBQVM7WUFDZixPQUFPLEVBQUUsd0JBQXdCLENBQUMsWUFBWTtTQUNqRDtRQUNELFVBQVUsRUFBRTtZQUNSLEtBQUssRUFBRSx1REFBdUQ7WUFDOUQsV0FBVyxFQUFFLG1FQUFtRTtZQUNoRixJQUFJLEVBQUUsU0FBUztZQUNmLE9BQU8sRUFBRSx3QkFBd0IsQ0FBQyxVQUFVO1NBQy9DO1FBQ0QsU0FBUyxFQUFFO1lBQ1AsS0FBSyxFQUFFLG9EQUFvRDtZQUMzRCxXQUFXLEVBQUUsZ0VBQWdFO1lBQzdFLElBQUksRUFBRSxRQUFRO1lBQ2QsT0FBTyxFQUFFLHdCQUF3QixDQUFDLFNBQVM7WUFDM0MsSUFBSSxFQUFFLENBQUMsVUFBVSxDQUFDO1lBQ2xCLGdCQUFnQixFQUFFLENBQUMsb0RBQW9ELENBQUM7U0FDM0U7UUFDRCxNQUFNLEVBQUU7WUFDSixLQUFLLEVBQUUsaURBQWlEO1lBQ3hELFdBQVcsRUFBRSw2REFBNkQ7WUFDMUUsSUFBSSxFQUFFLFFBQVE7WUFDZCxPQUFPLEVBQUUsd0JBQXdCLENBQUMsTUFBTTtZQUN4QyxJQUFJLEVBQUUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDO1lBQ3BCLGdCQUFnQixFQUFFO2dCQUNkLDhDQUE4QztnQkFDOUMsOENBQThDO2FBQ2pEO1NBQ0o7UUFDRCxPQUFPLEVBQUU7WUFDTCxLQUFLLEVBQUUsa0RBQWtEO1lBQ3pELFdBQVcsRUFBRSw4REFBOEQ7WUFDM0UsSUFBSSxFQUFFLFFBQVE7WUFDZCxPQUFPLEVBQUUsd0JBQXdCLENBQUMsT0FBTztZQUN6QyxPQUFPLEVBQUUsQ0FBQztZQUNWLE9BQU8sRUFBRSxHQUFHO1lBQ1osSUFBSSxFQUFFLENBQUM7U0FDVjtRQUNELFlBQVksRUFBRTtZQUNWLEtBQUssRUFBRSx3REFBd0Q7WUFDL0QsV0FBVyxFQUFFLG9FQUFvRTtZQUNqRixJQUFJLEVBQUUsU0FBUztZQUNmLE9BQU8sRUFBRSx3QkFBd0IsQ0FBQyxZQUFZO1NBQ2pEO1FBQ0QsWUFBWSxFQUFFO1lBQ1YsS0FBSyxFQUFFLHdEQUF3RDtZQUMvRCxXQUFXLEVBQUUsb0VBQW9FO1lBQ2pGLElBQUksRUFBRSxTQUFTO1lBQ2YsT0FBTyxFQUFFLHdCQUF3QixDQUFDLFlBQVk7U0FDakQ7UUFDRCxZQUFZLEVBQUU7WUFDVixLQUFLLEVBQUUsd0RBQXdEO1lBQy9ELFdBQVcsRUFBRSxvRUFBb0U7WUFDakYsSUFBSSxFQUFFLFNBQVM7WUFDZixPQUFPLEVBQUUsd0JBQXdCLENBQUMsWUFBWTtTQUNqRDtRQUNELHFCQUFxQixFQUFFO1lBQ25CLEtBQUssRUFBRSxtRUFBbUU7WUFDMUUsV0FBVyxFQUFFLCtFQUErRTtZQUM1RixJQUFJLEVBQUUsU0FBUztZQUNmLE9BQU8sRUFBRSx3QkFBd0IsQ0FBQyxxQkFBcUI7U0FDMUQ7UUFDRCxtQkFBbUIsRUFBRTtZQUNqQixLQUFLLEVBQUUsaUVBQWlFO1lBQ3hFLFdBQVcsRUFBRSw2RUFBNkU7WUFDMUYsSUFBSSxFQUFFLFNBQVM7WUFDZixPQUFPLEVBQUUsd0JBQXdCLENBQUMsbUJBQW1CO1NBQ3hEO1FBQ0QseUJBQXlCLEVBQUU7WUFDdkIsS0FBSyxFQUFFLHdFQUF3RTtZQUMvRSxXQUFXLEVBQUUsb0ZBQW9GO1lBQ2pHLElBQUksRUFBRSxTQUFTO1lBQ2YsT0FBTyxFQUFFLHdCQUF3QixDQUFDLHlCQUF5QjtTQUM5RDtRQUNELGNBQWMsRUFBRTtZQUNaLEtBQUssRUFBRSwwREFBMEQ7WUFDakUsV0FBVyxFQUFFLHNFQUFzRTtZQUNuRixJQUFJLEVBQUUsUUFBUTtZQUNkLE9BQU8sRUFBRSx3QkFBd0IsQ0FBQyxjQUFjO1lBQ2hELFVBQVUsRUFBRSxJQUFBLDhDQUErQixHQUFFO1NBQ2hEO0tBQ1I7SUFDRCxVQUFVLEVBQUU7UUFDUixnQkFBZ0I7WUFDWixPQUFPO2dCQUNIO29CQUNJLEtBQUssRUFBRSwyQkFBMkI7b0JBQ2xDLFlBQVksRUFBRSxnQkFBZ0I7b0JBQzlCLFFBQVEsRUFBRSxzQ0FBc0MsZ0JBQWdCLENBQUMsSUFBSSxjQUFjO29CQUNuRixJQUFJLEVBQUUsU0FBUztpQkFDbEI7YUFDSixDQUFDO1FBQ04sQ0FBQztLQUNKO0lBRUQsUUFBUSxFQUFFO1FBQ04sT0FBTyxFQUFFLE9BQU87UUFFaEI7Ozs7Ozs7O1dBUUc7UUFDSCxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQVk7WUFDckIsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLFFBQWtDLENBQUM7WUFDMUQsYUFBYTtZQUNiLE1BQU0sQ0FBQyxJQUFJLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFXLEVBQUUsRUFBRTtnQkFDMUQsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLFFBQVEsQ0FBQyxFQUFFLENBQUM7b0JBQ3JCLGFBQWE7b0JBQ2IsUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLHdCQUF3QixDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNsRCxDQUFDO1lBQ0wsQ0FBQyxDQUFDLENBQUM7WUFDSCxhQUFhO1lBQ2IsTUFBTSxTQUFTLEdBQUcsSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDdkMsU0FBUyxDQUFDLElBQUksR0FBRyxLQUFLLENBQUMsUUFBUSxJQUFJLEVBQUUsQ0FBQztZQUV0QyxNQUFNLGFBQWEsR0FBRyxhQUFhLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3pELE1BQU0sS0FBSyxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFFbEQsTUFBTSxPQUFPLEdBQUcsSUFBQSx5QkFBaUIsRUFBQyxhQUFhLENBQUMsQ0FBQztZQUNqRCxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUVsQyxPQUFPLElBQUksQ0FBQztRQUNoQixDQUFDO0tBQ0o7Q0FDSixDQUFDO0FBRUYsa0JBQWUsZ0JBQWdCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBc3NldCB9IGZyb20gJ0Bjb2Nvcy9hc3NldC1kYic7XG5pbXBvcnQgeyBjcmVhdGVUZXh0dXJlQmFzZVByb3BlcnR5U2NoZW1hLCBtYWtlRGVmYXVsdFRleHR1cmVCYXNlQXNzZXRVc2VyRGF0YSB9IGZyb20gJy4vdGV4dHVyZS1iYXNlJztcblxuaW1wb3J0IHsgZ2V0RGVwZW5kVVVJRExpc3QgfSBmcm9tICcuLi91dGlscyc7XG5pbXBvcnQgeyBBc3NldEhhbmRsZXIgfSBmcm9tICcuLi8uLi9AdHlwZXMvcHJvdGVjdGVkJztcbmltcG9ydCB7IEF1dG9BdGxhc0Fzc2V0VXNlckRhdGEgfSBmcm9tICcuLi8uLi9AdHlwZXMvdXNlckRhdGFzJztcblxuY29uc3QgZGVmYXVsdEF1dG9BdGxhc1VzZXJEYXRhID0ge1xuICAgIG1heFdpZHRoOiAxMDI0LFxuICAgIG1heEhlaWdodDogMTAyNCxcblxuICAgIC8vIHBhZGRpbmcgb2YgaW1hZ2UuXG4gICAgcGFkZGluZzogMixcblxuICAgIGFsbG93Um90YXRpb246IHRydWUsXG4gICAgZm9yY2VTcXVhcmVkOiBmYWxzZSxcbiAgICBwb3dlck9mVHdvOiBmYWxzZSxcbiAgICBhbGdvcml0aG06ICdNYXhSZWN0cycsXG4gICAgZm9ybWF0OiAncG5nJyxcbiAgICBxdWFsaXR5OiA4MCxcbiAgICBjb250b3VyQmxlZWQ6IHRydWUsXG4gICAgcGFkZGluZ0JsZWVkOiB0cnVlLFxuICAgIGZpbHRlclVudXNlZDogdHJ1ZSxcbiAgICByZW1vdmVUZXh0dXJlSW5CdW5kbGU6IHRydWUsXG4gICAgcmVtb3ZlSW1hZ2VJbkJ1bmRsZTogdHJ1ZSxcbiAgICByZW1vdmVTcHJpdGVBdGxhc0luQnVuZGxlOiB0cnVlLFxuICAgIGNvbXByZXNzU2V0dGluZ3M6IHt9LFxuICAgIHRleHR1cmVTZXR0aW5nOiBtYWtlRGVmYXVsdFRleHR1cmVCYXNlQXNzZXRVc2VyRGF0YSgpLFxufTtcblxuY29uc3QgQXV0b0F0bGFzSGFuZGxlcjogQXNzZXRIYW5kbGVyID0ge1xuICAgIC8vIEhhbmRsZXIg55qE5ZCN5a2X77yM55So5LqO5oyH5a6aIEhhbmRsZXIgYXMg562JXG4gICAgbmFtZTogJ2F1dG8tYXRsYXMnLFxuXG4gICAgLy8gcGFjIOaWh+S7tuWunumZheS4iuWcqOe8lui+keWZqOS4i+ayoeeUqOWIsO+8jOWPquacieaehOW7uuaXtuS8mueUqOOAguWboOatpOi/memHjOaKiuexu+Wei+iuvue9ruS4uiBjYy5TcHJpdGVBdGxhc++8jOaWueS+v+aehOW7uuaXtuW9k+aIkOWbvumbhuadpeWkhOeQhuOAglxuICAgIGFzc2V0VHlwZTogJ2NjLlNwcml0ZUF0bGFzJyxcbiAgICBwcm9wZXJ0eVNjaGVtYUNvbmZpZzoge1xuICAgICAgICAgICAgbWF4V2lkdGg6IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogJ2kxOG46aW1wb3J0ZXIucHJvcGVydHlfc2NoZW1hLmF1dG9fYXRsYXMubWF4X3dpZHRoJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2kxOG46aW1wb3J0ZXIucHJvcGVydHlfc2NoZW1hLmF1dG9fYXRsYXMubWF4X3dpZHRoX2Rlc2NyaXB0aW9uJyxcbiAgICAgICAgICAgICAgICB0eXBlOiAnbnVtYmVyJyxcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBkZWZhdWx0QXV0b0F0bGFzVXNlckRhdGEubWF4V2lkdGgsXG4gICAgICAgICAgICAgICAgbWluaW11bTogMSxcbiAgICAgICAgICAgICAgICBzdGVwOiAxLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1heEhlaWdodDoge1xuICAgICAgICAgICAgICAgIHRpdGxlOiAnaTE4bjppbXBvcnRlci5wcm9wZXJ0eV9zY2hlbWEuYXV0b19hdGxhcy5tYXhfaGVpZ2h0JyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2kxOG46aW1wb3J0ZXIucHJvcGVydHlfc2NoZW1hLmF1dG9fYXRsYXMubWF4X2hlaWdodF9kZXNjcmlwdGlvbicsXG4gICAgICAgICAgICAgICAgdHlwZTogJ251bWJlcicsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogZGVmYXVsdEF1dG9BdGxhc1VzZXJEYXRhLm1heEhlaWdodCxcbiAgICAgICAgICAgICAgICBtaW5pbXVtOiAxLFxuICAgICAgICAgICAgICAgIHN0ZXA6IDEsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcGFkZGluZzoge1xuICAgICAgICAgICAgICAgIHRpdGxlOiAnaTE4bjppbXBvcnRlci5wcm9wZXJ0eV9zY2hlbWEuYXV0b19hdGxhcy5wYWRkaW5nJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2kxOG46aW1wb3J0ZXIucHJvcGVydHlfc2NoZW1hLmF1dG9fYXRsYXMucGFkZGluZ19kZXNjcmlwdGlvbicsXG4gICAgICAgICAgICAgICAgdHlwZTogJ251bWJlcicsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogZGVmYXVsdEF1dG9BdGxhc1VzZXJEYXRhLnBhZGRpbmcsXG4gICAgICAgICAgICAgICAgbWluaW11bTogMCxcbiAgICAgICAgICAgICAgICBzdGVwOiAxLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGFsbG93Um90YXRpb246IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogJ2kxOG46aW1wb3J0ZXIucHJvcGVydHlfc2NoZW1hLmF1dG9fYXRsYXMuYWxsb3dfcm90YXRpb24nLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnaTE4bjppbXBvcnRlci5wcm9wZXJ0eV9zY2hlbWEuYXV0b19hdGxhcy5hbGxvd19yb3RhdGlvbl9kZXNjcmlwdGlvbicsXG4gICAgICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGRlZmF1bHRBdXRvQXRsYXNVc2VyRGF0YS5hbGxvd1JvdGF0aW9uLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZvcmNlU3F1YXJlZDoge1xuICAgICAgICAgICAgICAgIHRpdGxlOiAnaTE4bjppbXBvcnRlci5wcm9wZXJ0eV9zY2hlbWEuYXV0b19hdGxhcy5mb3JjZV9zcXVhcmVkJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2kxOG46aW1wb3J0ZXIucHJvcGVydHlfc2NoZW1hLmF1dG9fYXRsYXMuZm9yY2Vfc3F1YXJlZF9kZXNjcmlwdGlvbicsXG4gICAgICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGRlZmF1bHRBdXRvQXRsYXNVc2VyRGF0YS5mb3JjZVNxdWFyZWQsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcG93ZXJPZlR3bzoge1xuICAgICAgICAgICAgICAgIHRpdGxlOiAnaTE4bjppbXBvcnRlci5wcm9wZXJ0eV9zY2hlbWEuYXV0b19hdGxhcy5wb3dlcl9vZl90d28nLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnaTE4bjppbXBvcnRlci5wcm9wZXJ0eV9zY2hlbWEuYXV0b19hdGxhcy5wb3dlcl9vZl90d29fZGVzY3JpcHRpb24nLFxuICAgICAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBkZWZhdWx0QXV0b0F0bGFzVXNlckRhdGEucG93ZXJPZlR3byxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhbGdvcml0aG06IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogJ2kxOG46aW1wb3J0ZXIucHJvcGVydHlfc2NoZW1hLmF1dG9fYXRsYXMuYWxnb3JpdGhtJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2kxOG46aW1wb3J0ZXIucHJvcGVydHlfc2NoZW1hLmF1dG9fYXRsYXMuYWxnb3JpdGhtX2Rlc2NyaXB0aW9uJyxcbiAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBkZWZhdWx0QXV0b0F0bGFzVXNlckRhdGEuYWxnb3JpdGhtLFxuICAgICAgICAgICAgICAgIGVudW06IFsnTWF4UmVjdHMnXSxcbiAgICAgICAgICAgICAgICBlbnVtRGVzY3JpcHRpb25zOiBbJ2kxOG46aW1wb3J0ZXIucHJvcGVydHlfc2NoZW1hLmF1dG9fYXRsYXMubWF4X3JlY3RzJ10sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZm9ybWF0OiB7XG4gICAgICAgICAgICAgICAgdGl0bGU6ICdpMThuOmltcG9ydGVyLnByb3BlcnR5X3NjaGVtYS5hdXRvX2F0bGFzLmZvcm1hdCcsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdpMThuOmltcG9ydGVyLnByb3BlcnR5X3NjaGVtYS5hdXRvX2F0bGFzLmZvcm1hdF9kZXNjcmlwdGlvbicsXG4gICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogZGVmYXVsdEF1dG9BdGxhc1VzZXJEYXRhLmZvcm1hdCxcbiAgICAgICAgICAgICAgICBlbnVtOiBbJ3BuZycsICdqcGcnXSxcbiAgICAgICAgICAgICAgICBlbnVtRGVzY3JpcHRpb25zOiBbXG4gICAgICAgICAgICAgICAgICAgICdpMThuOmltcG9ydGVyLnByb3BlcnR5X3NjaGVtYS5hdXRvX2F0bGFzLnBuZycsXG4gICAgICAgICAgICAgICAgICAgICdpMThuOmltcG9ydGVyLnByb3BlcnR5X3NjaGVtYS5hdXRvX2F0bGFzLmpwZycsXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBxdWFsaXR5OiB7XG4gICAgICAgICAgICAgICAgdGl0bGU6ICdpMThuOmltcG9ydGVyLnByb3BlcnR5X3NjaGVtYS5hdXRvX2F0bGFzLnF1YWxpdHknLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnaTE4bjppbXBvcnRlci5wcm9wZXJ0eV9zY2hlbWEuYXV0b19hdGxhcy5xdWFsaXR5X2Rlc2NyaXB0aW9uJyxcbiAgICAgICAgICAgICAgICB0eXBlOiAnbnVtYmVyJyxcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBkZWZhdWx0QXV0b0F0bGFzVXNlckRhdGEucXVhbGl0eSxcbiAgICAgICAgICAgICAgICBtaW5pbXVtOiAwLFxuICAgICAgICAgICAgICAgIG1heGltdW06IDEwMCxcbiAgICAgICAgICAgICAgICBzdGVwOiAxLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNvbnRvdXJCbGVlZDoge1xuICAgICAgICAgICAgICAgIHRpdGxlOiAnaTE4bjppbXBvcnRlci5wcm9wZXJ0eV9zY2hlbWEuYXV0b19hdGxhcy5jb250b3VyX2JsZWVkJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2kxOG46aW1wb3J0ZXIucHJvcGVydHlfc2NoZW1hLmF1dG9fYXRsYXMuY29udG91cl9ibGVlZF9kZXNjcmlwdGlvbicsXG4gICAgICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGRlZmF1bHRBdXRvQXRsYXNVc2VyRGF0YS5jb250b3VyQmxlZWQsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcGFkZGluZ0JsZWVkOiB7XG4gICAgICAgICAgICAgICAgdGl0bGU6ICdpMThuOmltcG9ydGVyLnByb3BlcnR5X3NjaGVtYS5hdXRvX2F0bGFzLnBhZGRpbmdfYmxlZWQnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnaTE4bjppbXBvcnRlci5wcm9wZXJ0eV9zY2hlbWEuYXV0b19hdGxhcy5wYWRkaW5nX2JsZWVkX2Rlc2NyaXB0aW9uJyxcbiAgICAgICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogZGVmYXVsdEF1dG9BdGxhc1VzZXJEYXRhLnBhZGRpbmdCbGVlZCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmaWx0ZXJVbnVzZWQ6IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogJ2kxOG46aW1wb3J0ZXIucHJvcGVydHlfc2NoZW1hLmF1dG9fYXRsYXMuZmlsdGVyX3VudXNlZCcsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdpMThuOmltcG9ydGVyLnByb3BlcnR5X3NjaGVtYS5hdXRvX2F0bGFzLmZpbHRlcl91bnVzZWRfZGVzY3JpcHRpb24nLFxuICAgICAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBkZWZhdWx0QXV0b0F0bGFzVXNlckRhdGEuZmlsdGVyVW51c2VkLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlbW92ZVRleHR1cmVJbkJ1bmRsZToge1xuICAgICAgICAgICAgICAgIHRpdGxlOiAnaTE4bjppbXBvcnRlci5wcm9wZXJ0eV9zY2hlbWEuYXV0b19hdGxhcy5yZW1vdmVfdGV4dHVyZV9pbl9idW5kbGUnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnaTE4bjppbXBvcnRlci5wcm9wZXJ0eV9zY2hlbWEuYXV0b19hdGxhcy5yZW1vdmVfdGV4dHVyZV9pbl9idW5kbGVfZGVzY3JpcHRpb24nLFxuICAgICAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBkZWZhdWx0QXV0b0F0bGFzVXNlckRhdGEucmVtb3ZlVGV4dHVyZUluQnVuZGxlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlbW92ZUltYWdlSW5CdW5kbGU6IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogJ2kxOG46aW1wb3J0ZXIucHJvcGVydHlfc2NoZW1hLmF1dG9fYXRsYXMucmVtb3ZlX2ltYWdlX2luX2J1bmRsZScsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdpMThuOmltcG9ydGVyLnByb3BlcnR5X3NjaGVtYS5hdXRvX2F0bGFzLnJlbW92ZV9pbWFnZV9pbl9idW5kbGVfZGVzY3JpcHRpb24nLFxuICAgICAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBkZWZhdWx0QXV0b0F0bGFzVXNlckRhdGEucmVtb3ZlSW1hZ2VJbkJ1bmRsZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZW1vdmVTcHJpdGVBdGxhc0luQnVuZGxlOiB7XG4gICAgICAgICAgICAgICAgdGl0bGU6ICdpMThuOmltcG9ydGVyLnByb3BlcnR5X3NjaGVtYS5hdXRvX2F0bGFzLnJlbW92ZV9zcHJpdGVfYXRsYXNfaW5fYnVuZGxlJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2kxOG46aW1wb3J0ZXIucHJvcGVydHlfc2NoZW1hLmF1dG9fYXRsYXMucmVtb3ZlX3Nwcml0ZV9hdGxhc19pbl9idW5kbGVfZGVzY3JpcHRpb24nLFxuICAgICAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBkZWZhdWx0QXV0b0F0bGFzVXNlckRhdGEucmVtb3ZlU3ByaXRlQXRsYXNJbkJ1bmRsZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZXh0dXJlU2V0dGluZzoge1xuICAgICAgICAgICAgICAgIHRpdGxlOiAnaTE4bjppbXBvcnRlci5wcm9wZXJ0eV9zY2hlbWEuYXV0b19hdGxhcy50ZXh0dXJlX3NldHRpbmcnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnaTE4bjppbXBvcnRlci5wcm9wZXJ0eV9zY2hlbWEuYXV0b19hdGxhcy50ZXh0dXJlX3NldHRpbmdfZGVzY3JpcHRpb24nLFxuICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGRlZmF1bHRBdXRvQXRsYXNVc2VyRGF0YS50ZXh0dXJlU2V0dGluZyxcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiBjcmVhdGVUZXh0dXJlQmFzZVByb3BlcnR5U2NoZW1hKCksXG4gICAgICAgICAgICB9LFxuICAgIH0sXG4gICAgY3JlYXRlSW5mbzoge1xuICAgICAgICBnZW5lcmF0ZU1lbnVJbmZvKCkge1xuICAgICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnaTE4bjpFTkdJTkUuYXNzZXRzLm5ld1BhYycsXG4gICAgICAgICAgICAgICAgICAgIGZ1bGxGaWxlTmFtZTogJ2F1dG8tYXRsYXMucGFjJyxcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGU6IGBkYjovL2ludGVybmFsL2RlZmF1bHRfZmlsZV9jb250ZW50LyR7QXV0b0F0bGFzSGFuZGxlci5uYW1lfS9kZWZhdWx0LnBhY2AsXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICdkZWZhdWx0JyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXTtcbiAgICAgICAgfSxcbiAgICB9LFxuXG4gICAgaW1wb3J0ZXI6IHtcbiAgICAgICAgdmVyc2lvbjogJzEuMC44JyxcblxuICAgICAgICAvKipcbiAgICAgICAgICog5a6e6ZmF5a+85YWl5rWB56iLXG4gICAgICAgICAqIOmcgOimgeiHquW3seaOp+WItuaYr+WQpueUn+aIkOOAgeaLt+i0neaWh+S7tlxuICAgICAgICAgKlxuICAgICAgICAgKiDov5Tlm57mmK/lkKblr7zlhaXmiJDlip/nmoTmoIforrBcbiAgICAgICAgICog5aaC5p6c6L+U5ZueIGZhbHNl77yM5YiZIGltcG9ydGVkIOagh+iusOS4jeS8muWPmOaIkCB0cnVlXG4gICAgICAgICAqIOWQjue7reeahOS4gOezu+WIl+aTjeS9nOmDveS4jeS8muaJp+ihjFxuICAgICAgICAgKiBAcGFyYW0gYXNzZXRcbiAgICAgICAgICovXG4gICAgICAgIGFzeW5jIGltcG9ydChhc3NldDogQXNzZXQpIHtcbiAgICAgICAgICAgIGNvbnN0IHVzZXJEYXRhID0gYXNzZXQudXNlckRhdGEgYXMgQXV0b0F0bGFzQXNzZXRVc2VyRGF0YTtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKGRlZmF1bHRBdXRvQXRsYXNVc2VyRGF0YSkuZm9yRWFjaCgoa2V5OiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIShrZXkgaW4gdXNlckRhdGEpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICAgICAgdXNlckRhdGFba2V5XSA9IGRlZmF1bHRBdXRvQXRsYXNVc2VyRGF0YVtrZXldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgY29uc3QgYXV0b0F0bGFzID0gbmV3IGNjLlNwcml0ZUF0bGFzKCk7XG4gICAgICAgICAgICBhdXRvQXRsYXMubmFtZSA9IGFzc2V0LmJhc2VuYW1lIHx8ICcnO1xuXG4gICAgICAgICAgICBjb25zdCBzZXJpYWxpemVKU09OID0gRWRpdG9yRXh0ZW5kcy5zZXJpYWxpemUoYXV0b0F0bGFzKTtcbiAgICAgICAgICAgIGF3YWl0IGFzc2V0LnNhdmVUb0xpYnJhcnkoJy5qc29uJywgc2VyaWFsaXplSlNPTik7XG5cbiAgICAgICAgICAgIGNvbnN0IGRlcGVuZHMgPSBnZXREZXBlbmRVVUlETGlzdChzZXJpYWxpemVKU09OKTtcbiAgICAgICAgICAgIGFzc2V0LnNldERhdGEoJ2RlcGVuZHMnLCBkZXBlbmRzKTtcblxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sXG4gICAgfSxcbn07XG5cbmV4cG9ydCBkZWZhdWx0IEF1dG9BdGxhc0hhbmRsZXI7XG4iXX0=