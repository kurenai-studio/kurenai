"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RenderPipelineAssetHandler = void 0;
const fs_extra_1 = require("fs-extra");
const utils_1 = require("../utils");
exports.RenderPipelineAssetHandler = {
    name: 'render-pipeline',
    // 引擎内对应的类型
    assetType: 'cc.RenderPipeline',
    importer: {
        version: '1.0.0',
        /**
         * 返回是否导入成功的标记
         * 如果返回 false，则 imported 标记不会变成 true
         * 后续的一系列操作都不会执行
         * @param asset
         */
        async import(asset) {
            const serializeJSON = await (0, fs_extra_1.readFile)(asset.source, 'utf8');
            await asset.saveToLibrary('.json', serializeJSON);
            const depends = (0, utils_1.getDependUUIDList)(serializeJSON);
            asset.setData('depends', depends);
            return true;
        },
    },
};
exports.default = exports.RenderPipelineAssetHandler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyLXBpcGVsaW5lLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvYXNzZXRzL2Fzc2V0LWhhbmRsZXIvYXNzZXRzL3JlbmRlci1waXBlbGluZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSx1Q0FBb0M7QUFFcEMsb0NBQTZDO0FBRWhDLFFBQUEsMEJBQTBCLEdBQWlCO0lBQ3BELElBQUksRUFBRSxpQkFBaUI7SUFFdkIsV0FBVztJQUNYLFNBQVMsRUFBRSxtQkFBbUI7SUFDOUIsUUFBUSxFQUFFO1FBQ04sT0FBTyxFQUFFLE9BQU87UUFFaEI7Ozs7O1dBS0c7UUFDSCxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQVk7WUFDckIsTUFBTSxhQUFhLEdBQUcsTUFBTSxJQUFBLG1CQUFRLEVBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztZQUMzRCxNQUFNLEtBQUssQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBRWxELE1BQU0sT0FBTyxHQUFHLElBQUEseUJBQWlCLEVBQUMsYUFBYSxDQUFDLENBQUM7WUFDakQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFFbEMsT0FBTyxJQUFJLENBQUM7UUFDaEIsQ0FBQztLQUNKO0NBQ0osQ0FBQztBQUVGLGtCQUFlLGtDQUEwQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXNzZXQgfSBmcm9tICdAY29jb3MvYXNzZXQtZGInO1xuaW1wb3J0IHsgQXNzZXRIYW5kbGVyIH0gZnJvbSAnLi4vLi4vQHR5cGVzL3Byb3RlY3RlZCc7XG5pbXBvcnQgeyByZWFkRmlsZSB9IGZyb20gJ2ZzLWV4dHJhJztcblxuaW1wb3J0IHsgZ2V0RGVwZW5kVVVJRExpc3QgfSBmcm9tICcuLi91dGlscyc7XG5cbmV4cG9ydCBjb25zdCBSZW5kZXJQaXBlbGluZUFzc2V0SGFuZGxlcjogQXNzZXRIYW5kbGVyID0ge1xuICAgIG5hbWU6ICdyZW5kZXItcGlwZWxpbmUnLFxuXG4gICAgLy8g5byV5pOO5YaF5a+55bqU55qE57G75Z6LXG4gICAgYXNzZXRUeXBlOiAnY2MuUmVuZGVyUGlwZWxpbmUnLFxuICAgIGltcG9ydGVyOiB7XG4gICAgICAgIHZlcnNpb246ICcxLjAuMCcsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOi/lOWbnuaYr+WQpuWvvOWFpeaIkOWKn+eahOagh+iusFxuICAgICAgICAgKiDlpoLmnpzov5Tlm54gZmFsc2XvvIzliJkgaW1wb3J0ZWQg5qCH6K6w5LiN5Lya5Y+Y5oiQIHRydWVcbiAgICAgICAgICog5ZCO57ut55qE5LiA57O75YiX5pON5L2c6YO95LiN5Lya5omn6KGMXG4gICAgICAgICAqIEBwYXJhbSBhc3NldFxuICAgICAgICAgKi9cbiAgICAgICAgYXN5bmMgaW1wb3J0KGFzc2V0OiBBc3NldCkge1xuICAgICAgICAgICAgY29uc3Qgc2VyaWFsaXplSlNPTiA9IGF3YWl0IHJlYWRGaWxlKGFzc2V0LnNvdXJjZSwgJ3V0ZjgnKTtcbiAgICAgICAgICAgIGF3YWl0IGFzc2V0LnNhdmVUb0xpYnJhcnkoJy5qc29uJywgc2VyaWFsaXplSlNPTik7XG5cbiAgICAgICAgICAgIGNvbnN0IGRlcGVuZHMgPSBnZXREZXBlbmRVVUlETGlzdChzZXJpYWxpemVKU09OKTtcbiAgICAgICAgICAgIGFzc2V0LnNldERhdGEoJ2RlcGVuZHMnLCBkZXBlbmRzKTtcblxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sXG4gICAgfSxcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFJlbmRlclBpcGVsaW5lQXNzZXRIYW5kbGVyO1xuIl19