"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignImageHandler = void 0;
const utils_1 = require("./utils");
const utils_2 = __importDefault(require("../../../../base/utils"));
exports.SignImageHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: 'sign-image',
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
            const source = utils_2.default.Path.resolveToRaw(parent.userData.sign);
            Object.assign(asset.userData, parent.userData);
            delete asset.userData.type;
            delete asset.userData.sign;
            asset.userData.isRGBE = false;
            // 为不同导入类型的图片设置伪影的默认值
            if (asset.userData.fixAlphaTransparencyArtifacts === undefined) {
                asset.userData.fixAlphaTransparencyArtifacts = (0, utils_1.isCapableToFixAlphaTransparencyArtifacts)(asset, parent.userData.type, parent.extname);
            }
            const imageDataBufferOrimagePath = await (0, utils_1.handleImageUserData)(asset, source, '.png');
            await (0, utils_1.saveImageAsset)(asset, imageDataBufferOrimagePath, '.png', 'sign');
            await (0, utils_1.importWithType)(asset, parent.userData.type, 'sign', parent.extname);
            return true;
        },
    },
};
exports.default = exports.SignImageHandler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lnbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jb3JlL2Fzc2V0cy9hc3NldC1oYW5kbGVyL2Fzc2V0cy9pbWFnZS9zaWduLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUVBLG1DQUF3SDtBQUN4SCxtRUFBMkM7QUFFOUIsUUFBQSxnQkFBZ0IsR0FBaUI7SUFDMUMsZ0NBQWdDO0lBQ2hDLElBQUksRUFBRSxZQUFZO0lBRWxCLFdBQVc7SUFDWCxTQUFTLEVBQUUsZUFBZTtJQUUxQixRQUFRLEVBQUU7UUFDTixtQkFBbUI7UUFDbkIsT0FBTyxFQUFFLE9BQU87UUFDaEI7Ozs7Ozs7V0FPRztRQUNILEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBbUI7WUFDNUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDaEIsT0FBTyxLQUFLLENBQUM7WUFDakIsQ0FBQztZQUNELE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxNQUFlLENBQUM7WUFDckMsTUFBTSxNQUFNLEdBQUcsZUFBSyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM3RCxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQy9DLE9BQU8sS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUM7WUFDM0IsT0FBTyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQztZQUMzQixLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7WUFFOUIscUJBQXFCO1lBQ3JCLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyw2QkFBNkIsS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDN0QsS0FBSyxDQUFDLFFBQVEsQ0FBQyw2QkFBNkIsR0FBRyxJQUFBLGdEQUF3QyxFQUNuRixLQUFLLEVBQ0wsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQ3BCLE1BQU0sQ0FBQyxPQUFPLENBQ2pCLENBQUM7WUFDTixDQUFDO1lBRUQsTUFBTSwwQkFBMEIsR0FBRyxNQUFNLElBQUEsMkJBQW1CLEVBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztZQUNwRixNQUFNLElBQUEsc0JBQWMsRUFBQyxLQUFLLEVBQUUsMEJBQTBCLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ3hFLE1BQU0sSUFBQSxzQkFBYyxFQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzFFLE9BQU8sSUFBSSxDQUFDO1FBQ2hCLENBQUM7S0FDSjtDQUNKLENBQUM7QUFDRixrQkFBZSx3QkFBZ0IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFzc2V0LCBWaXJ0dWFsQXNzZXQgfSBmcm9tICdAY29jb3MvYXNzZXQtZGInO1xuaW1wb3J0IHsgQXNzZXRIYW5kbGVyIH0gZnJvbSAnLi4vLi4vLi4vQHR5cGVzL3Byb3RlY3RlZCc7XG5pbXBvcnQgeyBoYW5kbGVJbWFnZVVzZXJEYXRhLCBpbXBvcnRXaXRoVHlwZSwgaXNDYXBhYmxlVG9GaXhBbHBoYVRyYW5zcGFyZW5jeUFydGlmYWN0cywgc2F2ZUltYWdlQXNzZXQgfSBmcm9tICcuL3V0aWxzJztcbmltcG9ydCB1dGlscyBmcm9tICcuLi8uLi8uLi8uLi9iYXNlL3V0aWxzJztcblxuZXhwb3J0IGNvbnN0IFNpZ25JbWFnZUhhbmRsZXI6IEFzc2V0SGFuZGxlciA9IHtcbiAgICAvLyBIYW5kbGVyIOeahOWQjeWtl++8jOeUqOS6juaMh+WumiBIYW5kbGVyIGFzIOetiVxuICAgIG5hbWU6ICdzaWduLWltYWdlJyxcblxuICAgIC8vIOW8leaTjuWGheWvueW6lOeahOexu+Wei1xuICAgIGFzc2V0VHlwZTogJ2NjLkltYWdlQXNzZXQnLFxuXG4gICAgaW1wb3J0ZXI6IHtcbiAgICAgICAgLy8g54mI5pys5Y+35aaC5p6c5Y+Y5pu077yM5YiZ5Lya5by65Yi26YeN5paw5a+85YWlXG4gICAgICAgIHZlcnNpb246ICcxLjAuMScsXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDlrp7pmYXlr7zlhaXmtYHnqItcbiAgICAgICAgICog6ZyA6KaB6Ieq5bex5o6n5Yi25piv5ZCm55Sf5oiQ44CB5ou36LSd5paH5Lu2XG4gICAgICAgICAqXG4gICAgICAgICAqIOi/lOWbnuaYr+WQpuWvvOWFpeaIkOWKn+eahCBib29sZWFuXG4gICAgICAgICAqIOWmguaenOi/lOWbniBmYWxzZe+8jOWImeS4i+asoeWQr+WKqOi/mOS8mumHjeaWsOWvvOWFpVxuICAgICAgICAgKiBAcGFyYW0gYXNzZXRcbiAgICAgICAgICovXG4gICAgICAgIGFzeW5jIGltcG9ydChhc3NldDogVmlydHVhbEFzc2V0KSB7XG4gICAgICAgICAgICBpZiAoIWFzc2V0LnBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHBhcmVudCA9IGFzc2V0LnBhcmVudCBhcyBBc3NldDtcbiAgICAgICAgICAgIGNvbnN0IHNvdXJjZSA9IHV0aWxzLlBhdGgucmVzb2x2ZVRvUmF3KHBhcmVudC51c2VyRGF0YS5zaWduKTtcbiAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oYXNzZXQudXNlckRhdGEsIHBhcmVudC51c2VyRGF0YSk7XG4gICAgICAgICAgICBkZWxldGUgYXNzZXQudXNlckRhdGEudHlwZTtcbiAgICAgICAgICAgIGRlbGV0ZSBhc3NldC51c2VyRGF0YS5zaWduO1xuICAgICAgICAgICAgYXNzZXQudXNlckRhdGEuaXNSR0JFID0gZmFsc2U7XG5cbiAgICAgICAgICAgIC8vIOS4uuS4jeWQjOWvvOWFpeexu+Wei+eahOWbvueJh+iuvue9ruS8quW9seeahOm7mOiupOWAvFxuICAgICAgICAgICAgaWYgKGFzc2V0LnVzZXJEYXRhLmZpeEFscGhhVHJhbnNwYXJlbmN5QXJ0aWZhY3RzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBhc3NldC51c2VyRGF0YS5maXhBbHBoYVRyYW5zcGFyZW5jeUFydGlmYWN0cyA9IGlzQ2FwYWJsZVRvRml4QWxwaGFUcmFuc3BhcmVuY3lBcnRpZmFjdHMoXG4gICAgICAgICAgICAgICAgICAgIGFzc2V0LFxuICAgICAgICAgICAgICAgICAgICBwYXJlbnQudXNlckRhdGEudHlwZSxcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50LmV4dG5hbWUsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgaW1hZ2VEYXRhQnVmZmVyT3JpbWFnZVBhdGggPSBhd2FpdCBoYW5kbGVJbWFnZVVzZXJEYXRhKGFzc2V0LCBzb3VyY2UsICcucG5nJyk7XG4gICAgICAgICAgICBhd2FpdCBzYXZlSW1hZ2VBc3NldChhc3NldCwgaW1hZ2VEYXRhQnVmZmVyT3JpbWFnZVBhdGgsICcucG5nJywgJ3NpZ24nKTtcbiAgICAgICAgICAgIGF3YWl0IGltcG9ydFdpdGhUeXBlKGFzc2V0LCBwYXJlbnQudXNlckRhdGEudHlwZSwgJ3NpZ24nLCBwYXJlbnQuZXh0bmFtZSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSxcbiAgICB9LFxufTtcbmV4cG9ydCBkZWZhdWx0IFNpZ25JbWFnZUhhbmRsZXI7XG4iXX0=