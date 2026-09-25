"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RenderTextureHandler = void 0;
const fs_extra_1 = require("fs-extra");
const texture_base_1 = require("../texture-base");
const utils_1 = require("../../utils");
function fillUserdata(asset, name, value) {
    if (!(name in asset.userData)) {
        asset.userData[name] = value;
    }
}
exports.RenderTextureHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: 'render-texture',
    // 引擎内对应的类型
    assetType: 'cc.RenderTexture',
    createInfo: {
        generateMenuInfo() {
            return [
                {
                    label: 'i18n:ENGINE.assets.newRenderTexture',
                    fullFileName: 'render-texture.rt',
                    template: `db://internal/default_file_content/${exports.RenderTextureHandler.name}/default.rt`,
                    name: 'default',
                },
            ];
        },
    },
    importer: {
        // 版本号如果变更，则会强制重新导入
        version: '1.2.1',
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
            const json = await (0, fs_extra_1.readJSON)(asset.source);
            // @ts-ignore
            const renderTexture = cc.deserialize(json);
            renderTexture.name = asset.basename || '';
            fillUserdata(asset, 'width', renderTexture.width);
            fillUserdata(asset, 'height', renderTexture.height);
            // @ts-ignore renderTexture._anisotropy
            fillUserdata(asset, 'anisotropy', renderTexture._anisotropy);
            // @ts-ignore renderTexture._minFilter
            fillUserdata(asset, 'minfilter', (0, texture_base_1.getFilterString)(renderTexture._minFilter));
            // @ts-ignore renderTexture._magfilter
            fillUserdata(asset, 'magfilter', (0, texture_base_1.getFilterString)(renderTexture._magFilter));
            // @ts-ignore renderTexture._mipfilter
            fillUserdata(asset, 'mipfilter', (0, texture_base_1.getFilterString)(renderTexture._mipFilter));
            // @ts-ignore renderTexture._wrapS
            fillUserdata(asset, 'wrapModeS', (0, texture_base_1.getWrapModeString)(renderTexture._wrapS));
            // @ts-ignore renderTexture._wrapT
            fillUserdata(asset, 'wrapModeT', (0, texture_base_1.getWrapModeString)(renderTexture._wrapT));
            const userData = asset.userData;
            renderTexture.resize(userData.width, userData.height);
            (0, texture_base_1.applyTextureBaseAssetUserData)(userData, renderTexture);
            const serializeJSON = EditorExtends.serialize(renderTexture);
            await asset.saveToLibrary('.json', serializeJSON);
            const depends = (0, utils_1.getDependUUIDList)(serializeJSON);
            asset.setData('depends', depends);
            const textureSpriteFrameSubAsset = await asset.createSubAsset('spriteFrame', 'rt-sprite-frame', {
                displayName: asset.basename,
            });
            textureSpriteFrameSubAsset.userData.imageUuidOrDatabaseUri = asset.uuid;
            textureSpriteFrameSubAsset.userData.width = asset.userData.width;
            textureSpriteFrameSubAsset.userData.height = asset.userData.height;
            return true;
        },
    },
};
exports.default = exports.RenderTextureHandler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9hc3NldHMvYXNzZXQtaGFuZGxlci9hc3NldHMvcmVuZGVyLXRleHR1cmUvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsdUNBQW9DO0FBQ3BDLGtEQUFvRztBQUdwRyx1Q0FBZ0Q7QUFJaEQsU0FBUyxZQUFZLENBQUMsS0FBWSxFQUFFLElBQVksRUFBRSxLQUFVO0lBQ3hELElBQUksQ0FBQyxDQUFDLElBQUksSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztRQUM1QixLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQztJQUNqQyxDQUFDO0FBQ0wsQ0FBQztBQUVZLFFBQUEsb0JBQW9CLEdBQWlCO0lBQzlDLGdDQUFnQztJQUNoQyxJQUFJLEVBQUUsZ0JBQWdCO0lBRXRCLFdBQVc7SUFDWCxTQUFTLEVBQUUsa0JBQWtCO0lBRTdCLFVBQVUsRUFBRTtRQUNSLGdCQUFnQjtZQUNaLE9BQU87Z0JBQ0g7b0JBQ0ksS0FBSyxFQUFFLHFDQUFxQztvQkFDNUMsWUFBWSxFQUFFLG1CQUFtQjtvQkFDakMsUUFBUSxFQUFFLHNDQUFzQyw0QkFBb0IsQ0FBQyxJQUFJLGFBQWE7b0JBQ3RGLElBQUksRUFBRSxTQUFTO2lCQUNsQjthQUNKLENBQUM7UUFDTixDQUFDO0tBQ0o7SUFFRCxRQUFRLEVBQUU7UUFDTixtQkFBbUI7UUFDbkIsT0FBTyxFQUFFLE9BQU87UUFFaEI7Ozs7Ozs7O1dBUUc7UUFDSCxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQVk7WUFDckIsTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFBLG1CQUFRLEVBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzFDLGFBQWE7WUFDYixNQUFNLGFBQWEsR0FBRyxFQUFFLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBa0IsQ0FBQztZQUM1RCxhQUFhLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxRQUFRLElBQUksRUFBRSxDQUFDO1lBRTFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNsRCxZQUFZLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7WUFFcEQsdUNBQXVDO1lBQ3ZDLFlBQVksQ0FBQyxLQUFLLEVBQUUsWUFBWSxFQUFFLGFBQWEsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUM3RCxzQ0FBc0M7WUFDdEMsWUFBWSxDQUFDLEtBQUssRUFBRSxXQUFXLEVBQUUsSUFBQSw4QkFBZSxFQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1lBQzVFLHNDQUFzQztZQUN0QyxZQUFZLENBQUMsS0FBSyxFQUFFLFdBQVcsRUFBRSxJQUFBLDhCQUFlLEVBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7WUFDNUUsc0NBQXNDO1lBQ3RDLFlBQVksQ0FBQyxLQUFLLEVBQUUsV0FBVyxFQUFFLElBQUEsOEJBQWUsRUFBQyxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUM1RSxrQ0FBa0M7WUFDbEMsWUFBWSxDQUFDLEtBQUssRUFBRSxXQUFXLEVBQUUsSUFBQSxnQ0FBaUIsRUFBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUMxRSxrQ0FBa0M7WUFDbEMsWUFBWSxDQUFDLEtBQUssRUFBRSxXQUFXLEVBQUUsSUFBQSxnQ0FBaUIsRUFBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUUxRSxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsUUFBc0MsQ0FBQztZQUM5RCxhQUFhLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3RELElBQUEsNENBQTZCLEVBQUMsUUFBUSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBRXZELE1BQU0sYUFBYSxHQUFHLGFBQWEsQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDN0QsTUFBTSxLQUFLLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxhQUFhLENBQUMsQ0FBQztZQUVsRCxNQUFNLE9BQU8sR0FBRyxJQUFBLHlCQUFpQixFQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ2pELEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBRWxDLE1BQU0sMEJBQTBCLEdBQUcsTUFBTSxLQUFLLENBQUMsY0FBYyxDQUFDLGFBQWEsRUFBRSxpQkFBaUIsRUFBRTtnQkFDNUYsV0FBVyxFQUFFLEtBQUssQ0FBQyxRQUFRO2FBQzlCLENBQUMsQ0FBQztZQUNILDBCQUEwQixDQUFDLFFBQVEsQ0FBQyxzQkFBc0IsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDO1lBQ3hFLDBCQUEwQixDQUFDLFFBQVEsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUM7WUFDakUsMEJBQTBCLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQztZQUVuRSxPQUFPLElBQUksQ0FBQztRQUNoQixDQUFDO0tBQ0o7Q0FDSixDQUFDO0FBRUYsa0JBQWUsNEJBQW9CLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBc3NldCB9IGZyb20gJ0Bjb2Nvcy9hc3NldC1kYic7XG5pbXBvcnQgeyByZWFkSlNPTiB9IGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCB7IGFwcGx5VGV4dHVyZUJhc2VBc3NldFVzZXJEYXRhLCBnZXRXcmFwTW9kZVN0cmluZywgZ2V0RmlsdGVyU3RyaW5nIH0gZnJvbSAnLi4vdGV4dHVyZS1iYXNlJztcbmltcG9ydCB7IFJlbmRlclRleHR1cmUgfSBmcm9tICdjYyc7XG5cbmltcG9ydCB7IGdldERlcGVuZFVVSURMaXN0IH0gZnJvbSAnLi4vLi4vdXRpbHMnO1xuaW1wb3J0IHsgQXNzZXRIYW5kbGVyIH0gZnJvbSAnLi4vLi4vLi4vQHR5cGVzL3Byb3RlY3RlZCc7XG5pbXBvcnQgeyBSZW5kZXJUZXh0dXJlQXNzZXRVc2VyRGF0YSwgVGV4dHVyZUJhc2VBc3NldFVzZXJEYXRhIH0gZnJvbSAnLi4vLi4vLi4vQHR5cGVzL3VzZXJEYXRhcyc7XG5cbmZ1bmN0aW9uIGZpbGxVc2VyZGF0YShhc3NldDogQXNzZXQsIG5hbWU6IHN0cmluZywgdmFsdWU6IGFueSkge1xuICAgIGlmICghKG5hbWUgaW4gYXNzZXQudXNlckRhdGEpKSB7XG4gICAgICAgIGFzc2V0LnVzZXJEYXRhW25hbWVdID0gdmFsdWU7XG4gICAgfVxufVxuXG5leHBvcnQgY29uc3QgUmVuZGVyVGV4dHVyZUhhbmRsZXI6IEFzc2V0SGFuZGxlciA9IHtcbiAgICAvLyBIYW5kbGVyIOeahOWQjeWtl++8jOeUqOS6juaMh+WumiBIYW5kbGVyIGFzIOetiVxuICAgIG5hbWU6ICdyZW5kZXItdGV4dHVyZScsXG5cbiAgICAvLyDlvJXmk47lhoXlr7nlupTnmoTnsbvlnotcbiAgICBhc3NldFR5cGU6ICdjYy5SZW5kZXJUZXh0dXJlJyxcblxuICAgIGNyZWF0ZUluZm86IHtcbiAgICAgICAgZ2VuZXJhdGVNZW51SW5mbygpIHtcbiAgICAgICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ2kxOG46RU5HSU5FLmFzc2V0cy5uZXdSZW5kZXJUZXh0dXJlJyxcbiAgICAgICAgICAgICAgICAgICAgZnVsbEZpbGVOYW1lOiAncmVuZGVyLXRleHR1cmUucnQnLFxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogYGRiOi8vaW50ZXJuYWwvZGVmYXVsdF9maWxlX2NvbnRlbnQvJHtSZW5kZXJUZXh0dXJlSGFuZGxlci5uYW1lfS9kZWZhdWx0LnJ0YCxcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogJ2RlZmF1bHQnLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdO1xuICAgICAgICB9LFxuICAgIH0sXG5cbiAgICBpbXBvcnRlcjoge1xuICAgICAgICAvLyDniYjmnKzlj7flpoLmnpzlj5jmm7TvvIzliJnkvJrlvLrliLbph43mlrDlr7zlhaVcbiAgICAgICAgdmVyc2lvbjogJzEuMi4xJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICog5a6e6ZmF5a+85YWl5rWB56iLXG4gICAgICAgICAqIOmcgOimgeiHquW3seaOp+WItuaYr+WQpueUn+aIkOOAgeaLt+i0neaWh+S7tlxuICAgICAgICAgKlxuICAgICAgICAgKiDov5Tlm57mmK/lkKblr7zlhaXmiJDlip/nmoTmoIforrBcbiAgICAgICAgICog5aaC5p6c6L+U5ZueIGZhbHNl77yM5YiZIGltcG9ydGVkIOagh+iusOS4jeS8muWPmOaIkCB0cnVlXG4gICAgICAgICAqIOWQjue7reeahOS4gOezu+WIl+aTjeS9nOmDveS4jeS8muaJp+ihjFxuICAgICAgICAgKiBAcGFyYW0gYXNzZXRcbiAgICAgICAgICovXG4gICAgICAgIGFzeW5jIGltcG9ydChhc3NldDogQXNzZXQpIHtcbiAgICAgICAgICAgIGNvbnN0IGpzb24gPSBhd2FpdCByZWFkSlNPTihhc3NldC5zb3VyY2UpO1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgY29uc3QgcmVuZGVyVGV4dHVyZSA9IGNjLmRlc2VyaWFsaXplKGpzb24pIGFzIFJlbmRlclRleHR1cmU7XG4gICAgICAgICAgICByZW5kZXJUZXh0dXJlLm5hbWUgPSBhc3NldC5iYXNlbmFtZSB8fCAnJztcblxuICAgICAgICAgICAgZmlsbFVzZXJkYXRhKGFzc2V0LCAnd2lkdGgnLCByZW5kZXJUZXh0dXJlLndpZHRoKTtcbiAgICAgICAgICAgIGZpbGxVc2VyZGF0YShhc3NldCwgJ2hlaWdodCcsIHJlbmRlclRleHR1cmUuaGVpZ2h0KTtcblxuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSByZW5kZXJUZXh0dXJlLl9hbmlzb3Ryb3B5XG4gICAgICAgICAgICBmaWxsVXNlcmRhdGEoYXNzZXQsICdhbmlzb3Ryb3B5JywgcmVuZGVyVGV4dHVyZS5fYW5pc290cm9weSk7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlIHJlbmRlclRleHR1cmUuX21pbkZpbHRlclxuICAgICAgICAgICAgZmlsbFVzZXJkYXRhKGFzc2V0LCAnbWluZmlsdGVyJywgZ2V0RmlsdGVyU3RyaW5nKHJlbmRlclRleHR1cmUuX21pbkZpbHRlcikpO1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSByZW5kZXJUZXh0dXJlLl9tYWdmaWx0ZXJcbiAgICAgICAgICAgIGZpbGxVc2VyZGF0YShhc3NldCwgJ21hZ2ZpbHRlcicsIGdldEZpbHRlclN0cmluZyhyZW5kZXJUZXh0dXJlLl9tYWdGaWx0ZXIpKTtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmUgcmVuZGVyVGV4dHVyZS5fbWlwZmlsdGVyXG4gICAgICAgICAgICBmaWxsVXNlcmRhdGEoYXNzZXQsICdtaXBmaWx0ZXInLCBnZXRGaWx0ZXJTdHJpbmcocmVuZGVyVGV4dHVyZS5fbWlwRmlsdGVyKSk7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlIHJlbmRlclRleHR1cmUuX3dyYXBTXG4gICAgICAgICAgICBmaWxsVXNlcmRhdGEoYXNzZXQsICd3cmFwTW9kZVMnLCBnZXRXcmFwTW9kZVN0cmluZyhyZW5kZXJUZXh0dXJlLl93cmFwUykpO1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSByZW5kZXJUZXh0dXJlLl93cmFwVFxuICAgICAgICAgICAgZmlsbFVzZXJkYXRhKGFzc2V0LCAnd3JhcE1vZGVUJywgZ2V0V3JhcE1vZGVTdHJpbmcocmVuZGVyVGV4dHVyZS5fd3JhcFQpKTtcblxuICAgICAgICAgICAgY29uc3QgdXNlckRhdGEgPSBhc3NldC51c2VyRGF0YSBhcyBSZW5kZXJUZXh0dXJlQXNzZXRVc2VyRGF0YTtcbiAgICAgICAgICAgIHJlbmRlclRleHR1cmUucmVzaXplKHVzZXJEYXRhLndpZHRoLCB1c2VyRGF0YS5oZWlnaHQpO1xuICAgICAgICAgICAgYXBwbHlUZXh0dXJlQmFzZUFzc2V0VXNlckRhdGEodXNlckRhdGEsIHJlbmRlclRleHR1cmUpO1xuXG4gICAgICAgICAgICBjb25zdCBzZXJpYWxpemVKU09OID0gRWRpdG9yRXh0ZW5kcy5zZXJpYWxpemUocmVuZGVyVGV4dHVyZSk7XG4gICAgICAgICAgICBhd2FpdCBhc3NldC5zYXZlVG9MaWJyYXJ5KCcuanNvbicsIHNlcmlhbGl6ZUpTT04pO1xuXG4gICAgICAgICAgICBjb25zdCBkZXBlbmRzID0gZ2V0RGVwZW5kVVVJRExpc3Qoc2VyaWFsaXplSlNPTik7XG4gICAgICAgICAgICBhc3NldC5zZXREYXRhKCdkZXBlbmRzJywgZGVwZW5kcyk7XG5cbiAgICAgICAgICAgIGNvbnN0IHRleHR1cmVTcHJpdGVGcmFtZVN1YkFzc2V0ID0gYXdhaXQgYXNzZXQuY3JlYXRlU3ViQXNzZXQoJ3Nwcml0ZUZyYW1lJywgJ3J0LXNwcml0ZS1mcmFtZScsIHtcbiAgICAgICAgICAgICAgICBkaXNwbGF5TmFtZTogYXNzZXQuYmFzZW5hbWUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRleHR1cmVTcHJpdGVGcmFtZVN1YkFzc2V0LnVzZXJEYXRhLmltYWdlVXVpZE9yRGF0YWJhc2VVcmkgPSBhc3NldC51dWlkO1xuICAgICAgICAgICAgdGV4dHVyZVNwcml0ZUZyYW1lU3ViQXNzZXQudXNlckRhdGEud2lkdGggPSBhc3NldC51c2VyRGF0YS53aWR0aDtcbiAgICAgICAgICAgIHRleHR1cmVTcHJpdGVGcmFtZVN1YkFzc2V0LnVzZXJEYXRhLmhlaWdodCA9IGFzc2V0LnVzZXJEYXRhLmhlaWdodDtcblxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sXG4gICAgfSxcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFJlbmRlclRleHR1cmVIYW5kbGVyO1xuIl19