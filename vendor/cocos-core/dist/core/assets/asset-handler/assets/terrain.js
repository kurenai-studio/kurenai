'use strict';
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
exports.TerrainHandler = void 0;
const fs = __importStar(require("fs-extra"));
const index_1 = require("./scene/index");
const cc_1 = require("cc");
const utils_1 = require("../utils");
exports.TerrainHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: 'terrain',
    // 引擎内对应的类型
    assetType: 'cc.TerrainAsset',
    createInfo: {
        generateMenuInfo() {
            return [
                {
                    label: 'i18n:ENGINE.assets.newTerrain',
                    fullFileName: 'terrain.terrain',
                    template: `db://internal/default_file_content/${exports.TerrainHandler.name}/default.terrain`,
                    name: 'default',
                },
            ];
        },
    },
    importer: {
        version: index_1.version,
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
            await asset.copyToLibrary('.bin', asset.source);
            const terrainAsset = new cc_1.TerrainAsset();
            if (terrainAsset._loadNativeData(new Uint8Array(fs.readFileSync(asset.source)))) {
                terrainAsset.layerInfos.length = terrainAsset.layerBinaryInfos.length;
                for (let i = 0; i < terrainAsset.layerInfos.length; ++i) {
                    const binaryLayer = terrainAsset.layerBinaryInfos[i];
                    const layer = new cc_1.TerrainLayerInfo();
                    layer.slot = binaryLayer.slot;
                    layer.tileSize = binaryLayer.tileSize;
                    if (binaryLayer.detailMapId && binaryLayer.detailMapId != '') {
                        // @ts-ignore
                        layer.detailMap = EditorExtends.serialize.asAsset(binaryLayer.detailMapId, cc_1.Texture2D);
                    }
                    if (binaryLayer.normalMapId && binaryLayer.normalMapId != '') {
                        // @ts-ignore
                        layer.normalMap = EditorExtends.serialize.asAsset(binaryLayer.normalMapId, cc_1.Texture2D);
                    }
                    layer.metallic = binaryLayer.metallic;
                    layer.roughness = binaryLayer.roughness;
                    terrainAsset.layerInfos[i] = layer;
                }
            }
            terrainAsset.name = asset.basename;
            terrainAsset._setRawAsset('.bin');
            const serializeJSON = EditorExtends.serialize(terrainAsset);
            await asset.saveToLibrary('.json', serializeJSON);
            const depends = (0, utils_1.getDependUUIDList)(serializeJSON);
            asset.setData('depends', depends);
            return true;
        },
    },
};
exports.default = exports.TerrainHandler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVycmFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9jb3JlL2Fzc2V0cy9hc3NldC1oYW5kbGVyL2Fzc2V0cy90ZXJyYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRWIsNkNBQStCO0FBRS9CLHlDQUF3QztBQUN4QywyQkFBK0Q7QUFFL0Qsb0NBQTZDO0FBR2hDLFFBQUEsY0FBYyxHQUFpQjtJQUN4QyxnQ0FBZ0M7SUFDaEMsSUFBSSxFQUFFLFNBQVM7SUFDZixXQUFXO0lBQ1gsU0FBUyxFQUFFLGlCQUFpQjtJQUM1QixVQUFVLEVBQUU7UUFDUixnQkFBZ0I7WUFDWixPQUFPO2dCQUNIO29CQUNJLEtBQUssRUFBRSwrQkFBK0I7b0JBQ3RDLFlBQVksRUFBRSxpQkFBaUI7b0JBQy9CLFFBQVEsRUFBRSxzQ0FBc0Msc0JBQWMsQ0FBQyxJQUFJLGtCQUFrQjtvQkFDckYsSUFBSSxFQUFFLFNBQVM7aUJBQ2xCO2FBQ0osQ0FBQztRQUNOLENBQUM7S0FDSjtJQUVELFFBQVEsRUFBRTtRQUNOLE9BQU8sRUFBUCxlQUFPO1FBRVA7Ozs7Ozs7O1dBUUc7UUFDSCxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQVk7WUFDckIsTUFBTSxLQUFLLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7WUFFaEQsTUFBTSxZQUFZLEdBQUcsSUFBSSxpQkFBWSxFQUFFLENBQUM7WUFDeEMsSUFBSSxZQUFZLENBQUMsZUFBZSxDQUFDLElBQUksVUFBVSxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUM5RSxZQUFZLENBQUMsVUFBVSxDQUFDLE1BQU0sR0FBRyxZQUFZLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDO2dCQUN0RSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsWUFBWSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQztvQkFDdEQsTUFBTSxXQUFXLEdBQUcsWUFBWSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNyRCxNQUFNLEtBQUssR0FBRyxJQUFJLHFCQUFnQixFQUFFLENBQUM7b0JBQ3JDLEtBQUssQ0FBQyxJQUFJLEdBQUcsV0FBVyxDQUFDLElBQUksQ0FBQztvQkFDOUIsS0FBSyxDQUFDLFFBQVEsR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDO29CQUN0QyxJQUFJLFdBQVcsQ0FBQyxXQUFXLElBQUksV0FBVyxDQUFDLFdBQVcsSUFBSSxFQUFFLEVBQUUsQ0FBQzt3QkFDM0QsYUFBYTt3QkFDYixLQUFLLENBQUMsU0FBUyxHQUFHLGFBQWEsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxXQUFXLEVBQUUsY0FBUyxDQUFDLENBQUM7b0JBQzFGLENBQUM7b0JBQ0QsSUFBSSxXQUFXLENBQUMsV0FBVyxJQUFJLFdBQVcsQ0FBQyxXQUFXLElBQUksRUFBRSxFQUFFLENBQUM7d0JBQzNELGFBQWE7d0JBQ2IsS0FBSyxDQUFDLFNBQVMsR0FBRyxhQUFhLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsV0FBVyxFQUFFLGNBQVMsQ0FBQyxDQUFDO29CQUMxRixDQUFDO29CQUNELEtBQUssQ0FBQyxRQUFRLEdBQUcsV0FBVyxDQUFDLFFBQVEsQ0FBQztvQkFDdEMsS0FBSyxDQUFDLFNBQVMsR0FBRyxXQUFXLENBQUMsU0FBUyxDQUFDO29CQUN4QyxZQUFZLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQztnQkFDdkMsQ0FBQztZQUNMLENBQUM7WUFFRCxZQUFZLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUM7WUFDbkMsWUFBWSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUVsQyxNQUFNLGFBQWEsR0FBRyxhQUFhLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQzVELE1BQU0sS0FBSyxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFFbEQsTUFBTSxPQUFPLEdBQUcsSUFBQSx5QkFBaUIsRUFBQyxhQUFhLENBQUMsQ0FBQztZQUNqRCxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUVsQyxPQUFPLElBQUksQ0FBQztRQUNoQixDQUFDO0tBQ0o7Q0FDSixDQUFDO0FBRUYsa0JBQWUsc0JBQWMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0IHsgQXNzZXQgfSBmcm9tICdAY29jb3MvYXNzZXQtZGInO1xuaW1wb3J0IHsgdmVyc2lvbiB9IGZyb20gJy4vc2NlbmUvaW5kZXgnO1xuaW1wb3J0IHsgVGVycmFpbkFzc2V0LCBUZXJyYWluTGF5ZXJJbmZvLCBUZXh0dXJlMkQgfSBmcm9tICdjYyc7XG5cbmltcG9ydCB7IGdldERlcGVuZFVVSURMaXN0IH0gZnJvbSAnLi4vdXRpbHMnO1xuaW1wb3J0IHsgQXNzZXRIYW5kbGVyIH0gZnJvbSAnLi4vLi4vQHR5cGVzL3Byb3RlY3RlZCc7XG5cbmV4cG9ydCBjb25zdCBUZXJyYWluSGFuZGxlcjogQXNzZXRIYW5kbGVyID0ge1xuICAgIC8vIEhhbmRsZXIg55qE5ZCN5a2X77yM55So5LqO5oyH5a6aIEhhbmRsZXIgYXMg562JXG4gICAgbmFtZTogJ3RlcnJhaW4nLFxuICAgIC8vIOW8leaTjuWGheWvueW6lOeahOexu+Wei1xuICAgIGFzc2V0VHlwZTogJ2NjLlRlcnJhaW5Bc3NldCcsXG4gICAgY3JlYXRlSW5mbzoge1xuICAgICAgICBnZW5lcmF0ZU1lbnVJbmZvKCkge1xuICAgICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnaTE4bjpFTkdJTkUuYXNzZXRzLm5ld1RlcnJhaW4nLFxuICAgICAgICAgICAgICAgICAgICBmdWxsRmlsZU5hbWU6ICd0ZXJyYWluLnRlcnJhaW4nLFxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogYGRiOi8vaW50ZXJuYWwvZGVmYXVsdF9maWxlX2NvbnRlbnQvJHtUZXJyYWluSGFuZGxlci5uYW1lfS9kZWZhdWx0LnRlcnJhaW5gLFxuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnZGVmYXVsdCcsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF07XG4gICAgICAgIH0sXG4gICAgfSxcblxuICAgIGltcG9ydGVyOiB7XG4gICAgICAgIHZlcnNpb24sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOWunumZheWvvOWFpea1geeoi1xuICAgICAgICAgKiDpnIDopoHoh6rlt7HmjqfliLbmmK/lkKbnlJ/miJDjgIHmi7fotJ3mlofku7ZcbiAgICAgICAgICpcbiAgICAgICAgICog6L+U5Zue5piv5ZCm5a+85YWl5oiQ5Yqf55qE5qCH6K6wXG4gICAgICAgICAqIOWmguaenOi/lOWbniBmYWxzZe+8jOWImSBpbXBvcnRlZCDmoIforrDkuI3kvJrlj5jmiJAgdHJ1ZVxuICAgICAgICAgKiDlkI7nu63nmoTkuIDns7vliJfmk43kvZzpg73kuI3kvJrmiafooYxcbiAgICAgICAgICogQHBhcmFtIGFzc2V0XG4gICAgICAgICAqL1xuICAgICAgICBhc3luYyBpbXBvcnQoYXNzZXQ6IEFzc2V0KSB7XG4gICAgICAgICAgICBhd2FpdCBhc3NldC5jb3B5VG9MaWJyYXJ5KCcuYmluJywgYXNzZXQuc291cmNlKTtcblxuICAgICAgICAgICAgY29uc3QgdGVycmFpbkFzc2V0ID0gbmV3IFRlcnJhaW5Bc3NldCgpO1xuICAgICAgICAgICAgaWYgKHRlcnJhaW5Bc3NldC5fbG9hZE5hdGl2ZURhdGEobmV3IFVpbnQ4QXJyYXkoZnMucmVhZEZpbGVTeW5jKGFzc2V0LnNvdXJjZSkpKSkge1xuICAgICAgICAgICAgICAgIHRlcnJhaW5Bc3NldC5sYXllckluZm9zLmxlbmd0aCA9IHRlcnJhaW5Bc3NldC5sYXllckJpbmFyeUluZm9zLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRlcnJhaW5Bc3NldC5sYXllckluZm9zLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGJpbmFyeUxheWVyID0gdGVycmFpbkFzc2V0LmxheWVyQmluYXJ5SW5mb3NbaV07XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxheWVyID0gbmV3IFRlcnJhaW5MYXllckluZm8oKTtcbiAgICAgICAgICAgICAgICAgICAgbGF5ZXIuc2xvdCA9IGJpbmFyeUxheWVyLnNsb3Q7XG4gICAgICAgICAgICAgICAgICAgIGxheWVyLnRpbGVTaXplID0gYmluYXJ5TGF5ZXIudGlsZVNpemU7XG4gICAgICAgICAgICAgICAgICAgIGlmIChiaW5hcnlMYXllci5kZXRhaWxNYXBJZCAmJiBiaW5hcnlMYXllci5kZXRhaWxNYXBJZCAhPSAnJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgICAgICAgICAgbGF5ZXIuZGV0YWlsTWFwID0gRWRpdG9yRXh0ZW5kcy5zZXJpYWxpemUuYXNBc3NldChiaW5hcnlMYXllci5kZXRhaWxNYXBJZCwgVGV4dHVyZTJEKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoYmluYXJ5TGF5ZXIubm9ybWFsTWFwSWQgJiYgYmluYXJ5TGF5ZXIubm9ybWFsTWFwSWQgIT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICAgICAgICAgIGxheWVyLm5vcm1hbE1hcCA9IEVkaXRvckV4dGVuZHMuc2VyaWFsaXplLmFzQXNzZXQoYmluYXJ5TGF5ZXIubm9ybWFsTWFwSWQsIFRleHR1cmUyRCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgbGF5ZXIubWV0YWxsaWMgPSBiaW5hcnlMYXllci5tZXRhbGxpYztcbiAgICAgICAgICAgICAgICAgICAgbGF5ZXIucm91Z2huZXNzID0gYmluYXJ5TGF5ZXIucm91Z2huZXNzO1xuICAgICAgICAgICAgICAgICAgICB0ZXJyYWluQXNzZXQubGF5ZXJJbmZvc1tpXSA9IGxheWVyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGVycmFpbkFzc2V0Lm5hbWUgPSBhc3NldC5iYXNlbmFtZTtcbiAgICAgICAgICAgIHRlcnJhaW5Bc3NldC5fc2V0UmF3QXNzZXQoJy5iaW4nKTtcblxuICAgICAgICAgICAgY29uc3Qgc2VyaWFsaXplSlNPTiA9IEVkaXRvckV4dGVuZHMuc2VyaWFsaXplKHRlcnJhaW5Bc3NldCk7XG4gICAgICAgICAgICBhd2FpdCBhc3NldC5zYXZlVG9MaWJyYXJ5KCcuanNvbicsIHNlcmlhbGl6ZUpTT04pO1xuXG4gICAgICAgICAgICBjb25zdCBkZXBlbmRzID0gZ2V0RGVwZW5kVVVJRExpc3Qoc2VyaWFsaXplSlNPTik7XG4gICAgICAgICAgICBhc3NldC5zZXREYXRhKCdkZXBlbmRzJywgZGVwZW5kcyk7XG5cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LFxuICAgIH0sXG59O1xuXG5leHBvcnQgZGVmYXVsdCBUZXJyYWluSGFuZGxlcjtcbiJdfQ==