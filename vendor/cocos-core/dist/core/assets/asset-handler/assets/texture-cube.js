"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextureCubeHandler = void 0;
exports.makeDefaultTextureCubeAssetUserData = makeDefaultTextureCubeAssetUserData;
const asset_db_1 = require("@cocos/asset-db");
const cc = __importStar(require("cc"));
const utils_1 = require("../utils");
const texture_base_1 = require("./texture-base");
const load_asset_sync_1 = require("./utils/load-asset-sync");
function makeDefaultTextureCubeAssetUserData() {
    const userData = (0, texture_base_1.makeDefaultTextureBaseAssetUserData)();
    userData.isRGBE = false;
    return userData;
}
exports.TextureCubeHandler = {
    name: 'texture-cube',
    assetType: 'cc.TextureCube',
    createInfo: {
        generateMenuInfo() {
            return [
                {
                    label: 'i18n:ENGINE.assets.newCubeMap',
                    fullFileName: 'cubemap.cubemap',
                    template: 'db://internal/default_file_content/texture-cube/default.cubemap',
                    name: 'default',
                },
            ];
        },
    },
    importer: {
        // 版本号如果变更，则会强制重新导入
        version: '1.0.4',
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
            if (Object.getOwnPropertyNames(asset.userData).length === 0) {
                asset.assignUserData(makeDefaultTextureCubeAssetUserData(), true);
                asset.userData.isRGBE = false;
            }
            const userData = asset.userData;
            const faceNames = ['front', 'back', 'left', 'right', 'top', 'bottom'];
            const faceAssets = {};
            for (const faceName of faceNames) {
                let faceImageUUID = userData[faceName];
                if (!faceImageUUID) {
                    const defaultFaceUrl = `db://internal/default_cubemap/${faceName}.jpg`;
                    const uuid = (0, asset_db_1.queryUUID)(defaultFaceUrl);
                    if (uuid) {
                        faceImageUUID = uuid;
                    }
                    else {
                        throw new Error(`[[internal-error]] Default face url ${defaultFaceUrl} doesn't exists.`);
                    }
                }
                const face = (0, load_asset_sync_1.loadAssetSync)(faceImageUUID, cc.ImageAsset);
                if (!face) {
                    throw new Error(`Failed to load ${faceName} face of ${asset.uuid}.`);
                }
                faceAssets[faceName] = face;
            }
            const texture = new cc.TextureCube();
            (0, texture_base_1.applyTextureBaseAssetUserData)(userData, texture);
            if (asset.parent instanceof asset_db_1.Asset) {
                texture.name = asset.parent.basename || '';
            }
            texture.isRGBE = userData.isRGBE;
            texture._mipmaps = [faceAssets];
            const serializeJSON = EditorExtends.serialize(texture);
            await asset.saveToLibrary('.json', serializeJSON);
            const depends = (0, utils_1.getDependUUIDList)(serializeJSON);
            asset.setData('depends', depends);
            return true;
        },
    },
};
exports.default = exports.TextureCubeHandler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dHVyZS1jdWJlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvYXNzZXRzL2Fzc2V0LWhhbmRsZXIvYXNzZXRzL3RleHR1cmUtY3ViZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFXQSxrRkFJQztBQWZELDhDQUFpRTtBQUNqRSx1Q0FBeUI7QUFJekIsb0NBQTZDO0FBQzdDLGlEQUFvRztBQUNwRyw2REFBd0Q7QUFJeEQsU0FBZ0IsbUNBQW1DO0lBQy9DLE1BQU0sUUFBUSxHQUFHLElBQUEsa0RBQW1DLEdBQUUsQ0FBQztJQUN0RCxRQUFnRCxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7SUFDakUsT0FBTyxRQUErQyxDQUFDO0FBQzNELENBQUM7QUFFWSxRQUFBLGtCQUFrQixHQUFpQjtJQUM1QyxJQUFJLEVBQUUsY0FBYztJQUVwQixTQUFTLEVBQUUsZ0JBQWdCO0lBRTNCLFVBQVUsRUFBRTtRQUNSLGdCQUFnQjtZQUNaLE9BQU87Z0JBQ0g7b0JBQ0ksS0FBSyxFQUFFLCtCQUErQjtvQkFDdEMsWUFBWSxFQUFFLGlCQUFpQjtvQkFDL0IsUUFBUSxFQUFFLGlFQUFpRTtvQkFDM0UsSUFBSSxFQUFFLFNBQVM7aUJBQ2xCO2FBQ0osQ0FBQztRQUNOLENBQUM7S0FDSjtJQUNELFFBQVEsRUFBRTtRQUNOLG1CQUFtQjtRQUNuQixPQUFPLEVBQUUsT0FBTztRQUVoQjs7Ozs7Ozs7V0FRRztRQUNILEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBbUI7WUFDNUIsSUFBSSxNQUFNLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDMUQsS0FBSyxDQUFDLGNBQWMsQ0FBQyxtQ0FBbUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUNsRSxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7WUFDbEMsQ0FBQztZQUVELE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxRQUFvQyxDQUFDO1lBRTVELE1BQU0sU0FBUyxHQUFlLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztZQUVsRixNQUFNLFVBQVUsR0FBRyxFQUFxQyxDQUFDO1lBQ3pELEtBQUssTUFBTSxRQUFRLElBQUksU0FBUyxFQUFFLENBQUM7Z0JBQy9CLElBQUksYUFBYSxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDdkMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO29CQUNqQixNQUFNLGNBQWMsR0FBRyxpQ0FBaUMsUUFBUSxNQUFNLENBQUM7b0JBQ3ZFLE1BQU0sSUFBSSxHQUFHLElBQUEsb0JBQVMsRUFBQyxjQUFjLENBQUMsQ0FBQztvQkFDdkMsSUFBSSxJQUFJLEVBQUUsQ0FBQzt3QkFDUCxhQUFhLEdBQUcsSUFBSSxDQUFDO29CQUN6QixDQUFDO3lCQUFNLENBQUM7d0JBQ0osTUFBTSxJQUFJLEtBQUssQ0FBQyx1Q0FBdUMsY0FBYyxrQkFBa0IsQ0FBQyxDQUFDO29CQUM3RixDQUFDO2dCQUNMLENBQUM7Z0JBQ0QsTUFBTSxJQUFJLEdBQUcsSUFBQSwrQkFBYSxFQUFDLGFBQWEsRUFBRSxFQUFFLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQ3pELElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztvQkFDUixNQUFNLElBQUksS0FBSyxDQUFDLGtCQUFrQixRQUFRLFlBQVksS0FBSyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUM7Z0JBQ3pFLENBQUM7Z0JBQ0QsVUFBVSxDQUFDLFFBQVEsQ0FBQyxHQUFHLElBQUksQ0FBQztZQUNoQyxDQUFDO1lBRUQsTUFBTSxPQUFPLEdBQUcsSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDckMsSUFBQSw0Q0FBNkIsRUFBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDakQsSUFBSSxLQUFLLENBQUMsTUFBTSxZQUFZLGdCQUFLLEVBQUUsQ0FBQztnQkFDaEMsT0FBTyxDQUFDLElBQUksR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLFFBQVEsSUFBSSxFQUFFLENBQUM7WUFDL0MsQ0FBQztZQUNELE9BQU8sQ0FBQyxNQUFNLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQztZQUNqQyxPQUFPLENBQUMsUUFBUSxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7WUFFaEMsTUFBTSxhQUFhLEdBQUcsYUFBYSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN2RCxNQUFNLEtBQUssQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBRWxELE1BQU0sT0FBTyxHQUFHLElBQUEseUJBQWlCLEVBQUMsYUFBYSxDQUFDLENBQUM7WUFDakQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFFbEMsT0FBTyxJQUFJLENBQUM7UUFDaEIsQ0FBQztLQUNKO0NBQ0osQ0FBQztBQUVGLGtCQUFlLDBCQUFrQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVmlydHVhbEFzc2V0LCBBc3NldCwgcXVlcnlVVUlEIH0gZnJvbSAnQGNvY29zL2Fzc2V0LWRiJztcbmltcG9ydCAqIGFzIGNjIGZyb20gJ2NjJztcblxuaW1wb3J0IHsgQXNzZXRIYW5kbGVyIH0gZnJvbSAnLi4vLi4vQHR5cGVzL3Byb3RlY3RlZCc7XG5pbXBvcnQgeyBUZXh0dXJlQ3ViZUFzc2V0VXNlckRhdGEgfSBmcm9tICcuLi8uLi9AdHlwZXMvdXNlckRhdGFzJztcbmltcG9ydCB7IGdldERlcGVuZFVVSURMaXN0IH0gZnJvbSAnLi4vdXRpbHMnO1xuaW1wb3J0IHsgbWFrZURlZmF1bHRUZXh0dXJlQmFzZUFzc2V0VXNlckRhdGEsIGFwcGx5VGV4dHVyZUJhc2VBc3NldFVzZXJEYXRhIH0gZnJvbSAnLi90ZXh0dXJlLWJhc2UnO1xuaW1wb3J0IHsgbG9hZEFzc2V0U3luYyB9IGZyb20gJy4vdXRpbHMvbG9hZC1hc3NldC1zeW5jJztcblxudHlwZSBGYWNlTmFtZSA9ICdmcm9udCcgfCAnYmFjaycgfCAnbGVmdCcgfCAncmlnaHQnIHwgJ3RvcCcgfCAnYm90dG9tJztcblxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VEZWZhdWx0VGV4dHVyZUN1YmVBc3NldFVzZXJEYXRhKCk6IFRleHR1cmVDdWJlQXNzZXRVc2VyRGF0YSB7XG4gICAgY29uc3QgdXNlckRhdGEgPSBtYWtlRGVmYXVsdFRleHR1cmVCYXNlQXNzZXRVc2VyRGF0YSgpO1xuICAgICh1c2VyRGF0YSBhcyB1bmtub3duIGFzIFRleHR1cmVDdWJlQXNzZXRVc2VyRGF0YSkuaXNSR0JFID0gZmFsc2U7XG4gICAgcmV0dXJuIHVzZXJEYXRhIGFzIHVua25vd24gYXMgVGV4dHVyZUN1YmVBc3NldFVzZXJEYXRhO1xufVxuXG5leHBvcnQgY29uc3QgVGV4dHVyZUN1YmVIYW5kbGVyOiBBc3NldEhhbmRsZXIgPSB7XG4gICAgbmFtZTogJ3RleHR1cmUtY3ViZScsXG5cbiAgICBhc3NldFR5cGU6ICdjYy5UZXh0dXJlQ3ViZScsXG5cbiAgICBjcmVhdGVJbmZvOiB7XG4gICAgICAgIGdlbmVyYXRlTWVudUluZm8oKSB7XG4gICAgICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdpMThuOkVOR0lORS5hc3NldHMubmV3Q3ViZU1hcCcsXG4gICAgICAgICAgICAgICAgICAgIGZ1bGxGaWxlTmFtZTogJ2N1YmVtYXAuY3ViZW1hcCcsXG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlOiAnZGI6Ly9pbnRlcm5hbC9kZWZhdWx0X2ZpbGVfY29udGVudC90ZXh0dXJlLWN1YmUvZGVmYXVsdC5jdWJlbWFwJyxcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogJ2RlZmF1bHQnLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdO1xuICAgICAgICB9LFxuICAgIH0sXG4gICAgaW1wb3J0ZXI6IHtcbiAgICAgICAgLy8g54mI5pys5Y+35aaC5p6c5Y+Y5pu077yM5YiZ5Lya5by65Yi26YeN5paw5a+85YWlXG4gICAgICAgIHZlcnNpb246ICcxLjAuNCcsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOWunumZheWvvOWFpea1geeoi1xuICAgICAgICAgKiDpnIDopoHoh6rlt7HmjqfliLbmmK/lkKbnlJ/miJDjgIHmi7fotJ3mlofku7ZcbiAgICAgICAgICpcbiAgICAgICAgICog6L+U5Zue5piv5ZCm5a+85YWl5oiQ5Yqf55qE5qCH6K6wXG4gICAgICAgICAqIOWmguaenOi/lOWbniBmYWxzZe+8jOWImSBpbXBvcnRlZCDmoIforrDkuI3kvJrlj5jmiJAgdHJ1ZVxuICAgICAgICAgKiDlkI7nu63nmoTkuIDns7vliJfmk43kvZzpg73kuI3kvJrmiafooYxcbiAgICAgICAgICogQHBhcmFtIGFzc2V0XG4gICAgICAgICAqL1xuICAgICAgICBhc3luYyBpbXBvcnQoYXNzZXQ6IFZpcnR1YWxBc3NldCkge1xuICAgICAgICAgICAgaWYgKE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGFzc2V0LnVzZXJEYXRhKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBhc3NldC5hc3NpZ25Vc2VyRGF0YShtYWtlRGVmYXVsdFRleHR1cmVDdWJlQXNzZXRVc2VyRGF0YSgpLCB0cnVlKTtcbiAgICAgICAgICAgICAgICBhc3NldC51c2VyRGF0YS5pc1JHQkUgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgdXNlckRhdGEgPSBhc3NldC51c2VyRGF0YSBhcyBUZXh0dXJlQ3ViZUFzc2V0VXNlckRhdGE7XG5cbiAgICAgICAgICAgIGNvbnN0IGZhY2VOYW1lczogRmFjZU5hbWVbXSA9IFsnZnJvbnQnLCAnYmFjaycsICdsZWZ0JywgJ3JpZ2h0JywgJ3RvcCcsICdib3R0b20nXTtcblxuICAgICAgICAgICAgY29uc3QgZmFjZUFzc2V0cyA9IHt9IGFzIFJlY29yZDxGYWNlTmFtZSwgY2MuSW1hZ2VBc3NldD47XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGZhY2VOYW1lIG9mIGZhY2VOYW1lcykge1xuICAgICAgICAgICAgICAgIGxldCBmYWNlSW1hZ2VVVUlEID0gdXNlckRhdGFbZmFjZU5hbWVdO1xuICAgICAgICAgICAgICAgIGlmICghZmFjZUltYWdlVVVJRCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkZWZhdWx0RmFjZVVybCA9IGBkYjovL2ludGVybmFsL2RlZmF1bHRfY3ViZW1hcC8ke2ZhY2VOYW1lfS5qcGdgO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB1dWlkID0gcXVlcnlVVUlEKGRlZmF1bHRGYWNlVXJsKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHV1aWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZhY2VJbWFnZVVVSUQgPSB1dWlkO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBbW2ludGVybmFsLWVycm9yXV0gRGVmYXVsdCBmYWNlIHVybCAke2RlZmF1bHRGYWNlVXJsfSBkb2Vzbid0IGV4aXN0cy5gKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBmYWNlID0gbG9hZEFzc2V0U3luYyhmYWNlSW1hZ2VVVUlELCBjYy5JbWFnZUFzc2V0KTtcbiAgICAgICAgICAgICAgICBpZiAoIWZhY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8gbG9hZCAke2ZhY2VOYW1lfSBmYWNlIG9mICR7YXNzZXQudXVpZH0uYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZhY2VBc3NldHNbZmFjZU5hbWVdID0gZmFjZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgdGV4dHVyZSA9IG5ldyBjYy5UZXh0dXJlQ3ViZSgpO1xuICAgICAgICAgICAgYXBwbHlUZXh0dXJlQmFzZUFzc2V0VXNlckRhdGEodXNlckRhdGEsIHRleHR1cmUpO1xuICAgICAgICAgICAgaWYgKGFzc2V0LnBhcmVudCBpbnN0YW5jZW9mIEFzc2V0KSB7XG4gICAgICAgICAgICAgICAgdGV4dHVyZS5uYW1lID0gYXNzZXQucGFyZW50LmJhc2VuYW1lIHx8ICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGV4dHVyZS5pc1JHQkUgPSB1c2VyRGF0YS5pc1JHQkU7XG4gICAgICAgICAgICB0ZXh0dXJlLl9taXBtYXBzID0gW2ZhY2VBc3NldHNdO1xuXG4gICAgICAgICAgICBjb25zdCBzZXJpYWxpemVKU09OID0gRWRpdG9yRXh0ZW5kcy5zZXJpYWxpemUodGV4dHVyZSk7XG4gICAgICAgICAgICBhd2FpdCBhc3NldC5zYXZlVG9MaWJyYXJ5KCcuanNvbicsIHNlcmlhbGl6ZUpTT04pO1xuXG4gICAgICAgICAgICBjb25zdCBkZXBlbmRzID0gZ2V0RGVwZW5kVVVJRExpc3Qoc2VyaWFsaXplSlNPTik7XG4gICAgICAgICAgICBhc3NldC5zZXREYXRhKCdkZXBlbmRzJywgZGVwZW5kcyk7XG5cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LFxuICAgIH0sXG59O1xuXG5leHBvcnQgZGVmYXVsdCBUZXh0dXJlQ3ViZUhhbmRsZXI7XG4iXX0=