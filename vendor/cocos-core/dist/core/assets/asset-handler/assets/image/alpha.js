"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlphaImageHandler = void 0;
const utils_1 = require("./utils");
const utils_2 = __importDefault(require("../../../../base/utils"));
exports.AlphaImageHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: 'alpha-image',
    // 引擎内对应的类型
    assetType: 'cc.ImageAsset',
    importer: {
        // 版本号如果变更，则会强制重新导入
        version: '1.0.1',
        /**
         * 实际导入流程
         * 需要自己控制是否生成、拷贝文件
         *
         * 返回是否导入成功的 boolean
         * 如果返回 false，则下次启动还会重新导入
         * @param asset
         */
        async import(asset) {
            if (!asset.parent) {
                return false;
            }
            const parent = asset.parent;
            const source = utils_2.default.Path.resolveToRaw(parent.userData.alpha);
            Object.assign(asset.userData, parent.userData);
            delete asset.userData.type;
            delete asset.userData.alpha;
            asset.userData.isRGBE = false;
            // 为不同导入类型的图片设置伪影的默认值
            if (asset.userData.fixAlphaTransparencyArtifacts === undefined) {
                asset.userData.fixAlphaTransparencyArtifacts = (0, utils_1.isCapableToFixAlphaTransparencyArtifacts)(asset, parent.userData.type, parent.extname);
            }
            const imageDataBufferOrimagePath = await (0, utils_1.handleImageUserData)(asset, source, '.png');
            await (0, utils_1.saveImageAsset)(asset, imageDataBufferOrimagePath, '.png', 'alpha');
            await (0, utils_1.importWithType)(asset, parent.userData.type, 'alpha', parent.extname);
            return true;
        },
    },
};
exports.default = exports.AlphaImageHandler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWxwaGEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9hc3NldHMvYXNzZXQtaGFuZGxlci9hc3NldHMvaW1hZ2UvYWxwaGEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBRUEsbUNBQXdIO0FBQ3hILG1FQUEyQztBQUU5QixRQUFBLGlCQUFpQixHQUFpQjtJQUMzQyxnQ0FBZ0M7SUFDaEMsSUFBSSxFQUFFLGFBQWE7SUFFbkIsV0FBVztJQUNYLFNBQVMsRUFBRSxlQUFlO0lBRTFCLFFBQVEsRUFBRTtRQUNOLG1CQUFtQjtRQUNuQixPQUFPLEVBQUUsT0FBTztRQUNoQjs7Ozs7OztXQU9HO1FBQ0gsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFtQjtZQUM1QixJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNoQixPQUFPLEtBQUssQ0FBQztZQUNqQixDQUFDO1lBQ0QsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQWUsQ0FBQztZQUNyQyxNQUFNLE1BQU0sR0FBRyxlQUFLLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzlELE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDL0MsT0FBTyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQztZQUMzQixPQUFPLEtBQUssQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDO1lBQzVCLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztZQUU5QixxQkFBcUI7WUFDckIsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLDZCQUE2QixLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUM3RCxLQUFLLENBQUMsUUFBUSxDQUFDLDZCQUE2QixHQUFHLElBQUEsZ0RBQXdDLEVBQ25GLEtBQUssRUFDTCxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksRUFDcEIsTUFBTSxDQUFDLE9BQU8sQ0FDakIsQ0FBQztZQUNOLENBQUM7WUFFRCxNQUFNLDBCQUEwQixHQUFHLE1BQU0sSUFBQSwyQkFBbUIsRUFBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ3BGLE1BQU0sSUFBQSxzQkFBYyxFQUFDLEtBQUssRUFBRSwwQkFBMEIsRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDekUsTUFBTSxJQUFBLHNCQUFjLEVBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDM0UsT0FBTyxJQUFJLENBQUM7UUFDaEIsQ0FBQztLQUNKO0NBQ0osQ0FBQztBQUVGLGtCQUFlLHlCQUFpQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXNzZXQsIFZpcnR1YWxBc3NldCB9IGZyb20gJ0Bjb2Nvcy9hc3NldC1kYic7XG5pbXBvcnQgeyBBc3NldEhhbmRsZXIgfSBmcm9tICcuLi8uLi8uLi9AdHlwZXMvcHJvdGVjdGVkJztcbmltcG9ydCB7IGhhbmRsZUltYWdlVXNlckRhdGEsIGltcG9ydFdpdGhUeXBlLCBpc0NhcGFibGVUb0ZpeEFscGhhVHJhbnNwYXJlbmN5QXJ0aWZhY3RzLCBzYXZlSW1hZ2VBc3NldCB9IGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IHV0aWxzIGZyb20gJy4uLy4uLy4uLy4uL2Jhc2UvdXRpbHMnO1xuXG5leHBvcnQgY29uc3QgQWxwaGFJbWFnZUhhbmRsZXI6IEFzc2V0SGFuZGxlciA9IHtcbiAgICAvLyBIYW5kbGVyIOeahOWQjeWtl++8jOeUqOS6juaMh+WumiBIYW5kbGVyIGFzIOetiVxuICAgIG5hbWU6ICdhbHBoYS1pbWFnZScsXG5cbiAgICAvLyDlvJXmk47lhoXlr7nlupTnmoTnsbvlnotcbiAgICBhc3NldFR5cGU6ICdjYy5JbWFnZUFzc2V0JyxcblxuICAgIGltcG9ydGVyOiB7XG4gICAgICAgIC8vIOeJiOacrOWPt+WmguaenOWPmOabtO+8jOWImeS8muW8uuWItumHjeaWsOWvvOWFpVxuICAgICAgICB2ZXJzaW9uOiAnMS4wLjEnLFxuICAgICAgICAvKipcbiAgICAgICAgICog5a6e6ZmF5a+85YWl5rWB56iLXG4gICAgICAgICAqIOmcgOimgeiHquW3seaOp+WItuaYr+WQpueUn+aIkOOAgeaLt+i0neaWh+S7tlxuICAgICAgICAgKlxuICAgICAgICAgKiDov5Tlm57mmK/lkKblr7zlhaXmiJDlip/nmoQgYm9vbGVhblxuICAgICAgICAgKiDlpoLmnpzov5Tlm54gZmFsc2XvvIzliJnkuIvmrKHlkK/liqjov5jkvJrph43mlrDlr7zlhaVcbiAgICAgICAgICogQHBhcmFtIGFzc2V0XG4gICAgICAgICAqL1xuICAgICAgICBhc3luYyBpbXBvcnQoYXNzZXQ6IFZpcnR1YWxBc3NldCkge1xuICAgICAgICAgICAgaWYgKCFhc3NldC5wYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBwYXJlbnQgPSBhc3NldC5wYXJlbnQgYXMgQXNzZXQ7XG4gICAgICAgICAgICBjb25zdCBzb3VyY2UgPSB1dGlscy5QYXRoLnJlc29sdmVUb1JhdyhwYXJlbnQudXNlckRhdGEuYWxwaGEpO1xuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihhc3NldC51c2VyRGF0YSwgcGFyZW50LnVzZXJEYXRhKTtcbiAgICAgICAgICAgIGRlbGV0ZSBhc3NldC51c2VyRGF0YS50eXBlO1xuICAgICAgICAgICAgZGVsZXRlIGFzc2V0LnVzZXJEYXRhLmFscGhhO1xuICAgICAgICAgICAgYXNzZXQudXNlckRhdGEuaXNSR0JFID0gZmFsc2U7XG5cbiAgICAgICAgICAgIC8vIOS4uuS4jeWQjOWvvOWFpeexu+Wei+eahOWbvueJh+iuvue9ruS8quW9seeahOm7mOiupOWAvFxuICAgICAgICAgICAgaWYgKGFzc2V0LnVzZXJEYXRhLmZpeEFscGhhVHJhbnNwYXJlbmN5QXJ0aWZhY3RzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBhc3NldC51c2VyRGF0YS5maXhBbHBoYVRyYW5zcGFyZW5jeUFydGlmYWN0cyA9IGlzQ2FwYWJsZVRvRml4QWxwaGFUcmFuc3BhcmVuY3lBcnRpZmFjdHMoXG4gICAgICAgICAgICAgICAgICAgIGFzc2V0LFxuICAgICAgICAgICAgICAgICAgICBwYXJlbnQudXNlckRhdGEudHlwZSxcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50LmV4dG5hbWUsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgaW1hZ2VEYXRhQnVmZmVyT3JpbWFnZVBhdGggPSBhd2FpdCBoYW5kbGVJbWFnZVVzZXJEYXRhKGFzc2V0LCBzb3VyY2UsICcucG5nJyk7XG4gICAgICAgICAgICBhd2FpdCBzYXZlSW1hZ2VBc3NldChhc3NldCwgaW1hZ2VEYXRhQnVmZmVyT3JpbWFnZVBhdGgsICcucG5nJywgJ2FscGhhJyk7XG4gICAgICAgICAgICBhd2FpdCBpbXBvcnRXaXRoVHlwZShhc3NldCwgcGFyZW50LnVzZXJEYXRhLnR5cGUsICdhbHBoYScsIHBhcmVudC5leHRuYW1lKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LFxuICAgIH0sXG59O1xuXG5leHBvcnQgZGVmYXVsdCBBbHBoYUltYWdlSGFuZGxlcjtcbiJdfQ==