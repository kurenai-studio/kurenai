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
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const serialize_library_1 = require("./utils/serialize-library");
const cc = __importStar(require("cc"));
const utils_1 = require("../utils");
const AnimationHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: 'animation-clip',
    // 引擎内对应的类型
    assetType: 'cc.AnimationClip',
    createInfo: {
        generateMenuInfo() {
            return [
                {
                    label: 'i18n:ENGINE.assets.newAnimation',
                    fullFileName: 'animation.anim',
                    template: `db://internal/default_file_content/${AnimationHandler.name}/default.anim`,
                    group: 'animation',
                    name: 'default',
                },
            ];
        },
    },
    importer: {
        // 版本号如果变更，则会强制重新导入
        version: '2.0.4',
        versionCode: 2,
        /**
         * 如果改名就强制刷新
         * @param asset
         */
        async force(asset) {
            const userData = asset.userData;
            return userData.name !== asset.basename;
        },
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
            try {
                const fileContent = await (0, fs_extra_1.readFile)(asset.source, 'utf8');
                const json = JSON.parse(fileContent);
                const details = cc.deserialize.Details.pool.get();
                const clip = cc.deserialize(json, details, undefined);
                const nUUIDRefs = details.uuidList.length;
                for (let i = 0; i < nUUIDRefs; ++i) {
                    const uuid = details.uuidList[i];
                    const uuidObj = details.uuidObjList[i];
                    const uuidProp = details.uuidPropList[i];
                    const uuidType = details.uuidTypeList[i];
                    const Type = cc.js.getClassById(uuidType) ?? cc.Asset;
                    const asset = new Type();
                    asset._uuid = uuid + '';
                    uuidObj[uuidProp] = asset;
                }
                clip.name = (0, path_1.basename)(asset.source, '.anim');
                userData.name = clip.name;
                // Compute hash
                void clip.hash;
                const { extension, data } = (0, serialize_library_1.serializeForLibrary)(clip);
                await asset.saveToLibrary(extension, data);
                const depends = (0, utils_1.getDependUUIDList)(fileContent);
                asset.setData('depends', depends);
            }
            catch (error) {
                console.error(error);
                return false;
            }
            return true;
        },
    },
};
exports.default = AnimationHandler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5pbWF0aW9uLWNsaXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9hc3NldHMvYXNzZXQtaGFuZGxlci9hc3NldHMvYW5pbWF0aW9uLWNsaXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUliLHVDQUFvQztBQUNwQywrQkFBZ0M7QUFDaEMsaUVBQWdFO0FBQ2hFLHVDQUF5QjtBQUV6QixvQ0FBNkM7QUFJN0MsTUFBTSxnQkFBZ0IsR0FBaUI7SUFDbkMsZ0NBQWdDO0lBQ2hDLElBQUksRUFBRSxnQkFBZ0I7SUFDdEIsV0FBVztJQUNYLFNBQVMsRUFBRSxrQkFBa0I7SUFDN0IsVUFBVSxFQUFFO1FBQ1IsZ0JBQWdCO1lBQ1osT0FBTztnQkFDSDtvQkFDSSxLQUFLLEVBQUUsaUNBQWlDO29CQUN4QyxZQUFZLEVBQUUsZ0JBQWdCO29CQUM5QixRQUFRLEVBQUUsc0NBQXNDLGdCQUFnQixDQUFDLElBQUksZUFBZTtvQkFDcEYsS0FBSyxFQUFFLFdBQVc7b0JBQ2xCLElBQUksRUFBRSxTQUFTO2lCQUNsQjthQUNKLENBQUM7UUFDTixDQUFDO0tBQ0o7SUFDRCxRQUFRLEVBQUU7UUFDTixtQkFBbUI7UUFDbkIsT0FBTyxFQUFFLE9BQU87UUFDaEIsV0FBVyxFQUFFLENBQUM7UUFFZDs7O1dBR0c7UUFDSCxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQVk7WUFDcEIsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLFFBQXNDLENBQUM7WUFDOUQsT0FBTyxRQUFRLENBQUMsSUFBSSxLQUFLLEtBQUssQ0FBQyxRQUFRLENBQUM7UUFDNUMsQ0FBQztRQUVEOzs7Ozs7OztXQVFHO1FBQ0gsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFZO1lBQ3JCLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxRQUFzQyxDQUFDO1lBQzlELElBQUksQ0FBQztnQkFDRCxNQUFNLFdBQVcsR0FBRyxNQUFNLElBQUEsbUJBQVEsRUFBQyxLQUFLLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUN6RCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUVyQyxNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFHLENBQUM7Z0JBQ25ELE1BQU0sSUFBSSxHQUFHLEVBQUUsQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxTQUFTLENBQWtCLENBQUM7Z0JBQ3ZFLE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxRQUFTLENBQUMsTUFBTSxDQUFDO2dCQUMzQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsU0FBUyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7b0JBQ2pDLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxRQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ2xDLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxXQUFZLENBQUMsQ0FBQyxDQUFRLENBQUM7b0JBQy9DLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxZQUFhLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzFDLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ3pDLE1BQU0sSUFBSSxHQUF3QixFQUFFLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQVMsSUFBSSxFQUFFLENBQUMsS0FBSyxDQUFDO29CQUNuRixNQUFNLEtBQUssR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDO29CQUN6QixLQUFLLENBQUMsS0FBSyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7b0JBQ3hCLE9BQU8sQ0FBQyxRQUFRLENBQUMsR0FBRyxLQUFLLENBQUM7Z0JBQzlCLENBQUM7Z0JBRUQsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFBLGVBQVEsRUFBQyxLQUFLLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUM1QyxRQUFRLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7Z0JBRTFCLGVBQWU7Z0JBQ2YsS0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDO2dCQUVmLE1BQU0sRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLEdBQUcsSUFBQSx1Q0FBbUIsRUFBQyxJQUFJLENBQUMsQ0FBQztnQkFFdEQsTUFBTSxLQUFLLENBQUMsYUFBYSxDQUFDLFNBQVMsRUFBRSxJQUFXLENBQUMsQ0FBQztnQkFFbEQsTUFBTSxPQUFPLEdBQUcsSUFBQSx5QkFBaUIsRUFBQyxXQUFXLENBQUMsQ0FBQztnQkFDL0MsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDdEMsQ0FBQztZQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7Z0JBQ2IsT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDckIsT0FBTyxLQUFLLENBQUM7WUFDakIsQ0FBQztZQUVELE9BQU8sSUFBSSxDQUFDO1FBQ2hCLENBQUM7S0FDSjtDQUNKLENBQUM7QUFFRixrQkFBZSxnQkFBZ0IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgQXNzZXQgfSBmcm9tICdAY29jb3MvYXNzZXQtZGInO1xuaW1wb3J0IHsgQW5pbWF0aW9uQ2xpcCB9IGZyb20gJ2NjJztcbmltcG9ydCB7IHJlYWRGaWxlIH0gZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0IHsgYmFzZW5hbWUgfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IHNlcmlhbGl6ZUZvckxpYnJhcnkgfSBmcm9tICcuL3V0aWxzL3NlcmlhbGl6ZS1saWJyYXJ5JztcbmltcG9ydCAqIGFzIGNjIGZyb20gJ2NjJztcblxuaW1wb3J0IHsgZ2V0RGVwZW5kVVVJRExpc3QgfSBmcm9tICcuLi91dGlscyc7XG5pbXBvcnQgeyBBc3NldEhhbmRsZXIgfSBmcm9tICcuLi8uLi9AdHlwZXMvcHJvdGVjdGVkJztcbmltcG9ydCB7IEFuaW1hdGlvbkNsaXBBc3NldFVzZXJEYXRhIH0gZnJvbSAnLi4vLi4vQHR5cGVzL3VzZXJEYXRhcyc7XG5cbmNvbnN0IEFuaW1hdGlvbkhhbmRsZXI6IEFzc2V0SGFuZGxlciA9IHtcbiAgICAvLyBIYW5kbGVyIOeahOWQjeWtl++8jOeUqOS6juaMh+WumiBIYW5kbGVyIGFzIOetiVxuICAgIG5hbWU6ICdhbmltYXRpb24tY2xpcCcsXG4gICAgLy8g5byV5pOO5YaF5a+55bqU55qE57G75Z6LXG4gICAgYXNzZXRUeXBlOiAnY2MuQW5pbWF0aW9uQ2xpcCcsXG4gICAgY3JlYXRlSW5mbzoge1xuICAgICAgICBnZW5lcmF0ZU1lbnVJbmZvKCkge1xuICAgICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnaTE4bjpFTkdJTkUuYXNzZXRzLm5ld0FuaW1hdGlvbicsXG4gICAgICAgICAgICAgICAgICAgIGZ1bGxGaWxlTmFtZTogJ2FuaW1hdGlvbi5hbmltJyxcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGU6IGBkYjovL2ludGVybmFsL2RlZmF1bHRfZmlsZV9jb250ZW50LyR7QW5pbWF0aW9uSGFuZGxlci5uYW1lfS9kZWZhdWx0LmFuaW1gLFxuICAgICAgICAgICAgICAgICAgICBncm91cDogJ2FuaW1hdGlvbicsXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICdkZWZhdWx0JyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXTtcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIGltcG9ydGVyOiB7XG4gICAgICAgIC8vIOeJiOacrOWPt+WmguaenOWPmOabtO+8jOWImeS8muW8uuWItumHjeaWsOWvvOWFpVxuICAgICAgICB2ZXJzaW9uOiAnMi4wLjQnLFxuICAgICAgICB2ZXJzaW9uQ29kZTogMixcblxuICAgICAgICAvKipcbiAgICAgICAgICog5aaC5p6c5pS55ZCN5bCx5by65Yi25Yi35pawXG4gICAgICAgICAqIEBwYXJhbSBhc3NldFxuICAgICAgICAgKi9cbiAgICAgICAgYXN5bmMgZm9yY2UoYXNzZXQ6IEFzc2V0KSB7XG4gICAgICAgICAgICBjb25zdCB1c2VyRGF0YSA9IGFzc2V0LnVzZXJEYXRhIGFzIEFuaW1hdGlvbkNsaXBBc3NldFVzZXJEYXRhO1xuICAgICAgICAgICAgcmV0dXJuIHVzZXJEYXRhLm5hbWUgIT09IGFzc2V0LmJhc2VuYW1lO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDlrp7pmYXlr7zlhaXmtYHnqItcbiAgICAgICAgICog6ZyA6KaB6Ieq5bex5o6n5Yi25piv5ZCm55Sf5oiQ44CB5ou36LSd5paH5Lu2XG4gICAgICAgICAqXG4gICAgICAgICAqIOi/lOWbnuaYr+WQpuWvvOWFpeaIkOWKn+eahOagh+iusFxuICAgICAgICAgKiDlpoLmnpzov5Tlm54gZmFsc2XvvIzliJkgaW1wb3J0ZWQg5qCH6K6w5LiN5Lya5Y+Y5oiQIHRydWVcbiAgICAgICAgICog5ZCO57ut55qE5LiA57O75YiX5pON5L2c6YO95LiN5Lya5omn6KGMXG4gICAgICAgICAqIEBwYXJhbSBhc3NldFxuICAgICAgICAgKi9cbiAgICAgICAgYXN5bmMgaW1wb3J0KGFzc2V0OiBBc3NldCkge1xuICAgICAgICAgICAgY29uc3QgdXNlckRhdGEgPSBhc3NldC51c2VyRGF0YSBhcyBBbmltYXRpb25DbGlwQXNzZXRVc2VyRGF0YTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsZUNvbnRlbnQgPSBhd2FpdCByZWFkRmlsZShhc3NldC5zb3VyY2UsICd1dGY4Jyk7XG4gICAgICAgICAgICAgICAgY29uc3QganNvbiA9IEpTT04ucGFyc2UoZmlsZUNvbnRlbnQpO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgZGV0YWlscyA9IGNjLmRlc2VyaWFsaXplLkRldGFpbHMucG9vbC5nZXQoKSE7XG4gICAgICAgICAgICAgICAgY29uc3QgY2xpcCA9IGNjLmRlc2VyaWFsaXplKGpzb24sIGRldGFpbHMsIHVuZGVmaW5lZCkgYXMgQW5pbWF0aW9uQ2xpcDtcbiAgICAgICAgICAgICAgICBjb25zdCBuVVVJRFJlZnMgPSBkZXRhaWxzLnV1aWRMaXN0IS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuVVVJRFJlZnM7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB1dWlkID0gZGV0YWlscy51dWlkTGlzdCFbaV07XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHV1aWRPYmogPSBkZXRhaWxzLnV1aWRPYmpMaXN0IVtpXSBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHV1aWRQcm9wID0gZGV0YWlscy51dWlkUHJvcExpc3QhW2ldO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB1dWlkVHlwZSA9IGRldGFpbHMudXVpZFR5cGVMaXN0W2ldO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBUeXBlOiBuZXcgKCkgPT4gY2MuQXNzZXQgPSAoY2MuanMuZ2V0Q2xhc3NCeUlkKHV1aWRUeXBlKSBhcyBhbnkpID8/IGNjLkFzc2V0O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhc3NldCA9IG5ldyBUeXBlKCk7XG4gICAgICAgICAgICAgICAgICAgIGFzc2V0Ll91dWlkID0gdXVpZCArICcnO1xuICAgICAgICAgICAgICAgICAgICB1dWlkT2JqW3V1aWRQcm9wXSA9IGFzc2V0O1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNsaXAubmFtZSA9IGJhc2VuYW1lKGFzc2V0LnNvdXJjZSwgJy5hbmltJyk7XG4gICAgICAgICAgICAgICAgdXNlckRhdGEubmFtZSA9IGNsaXAubmFtZTtcblxuICAgICAgICAgICAgICAgIC8vIENvbXB1dGUgaGFzaFxuICAgICAgICAgICAgICAgIHZvaWQgY2xpcC5oYXNoO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgeyBleHRlbnNpb24sIGRhdGEgfSA9IHNlcmlhbGl6ZUZvckxpYnJhcnkoY2xpcCk7XG5cbiAgICAgICAgICAgICAgICBhd2FpdCBhc3NldC5zYXZlVG9MaWJyYXJ5KGV4dGVuc2lvbiwgZGF0YSBhcyBhbnkpO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgZGVwZW5kcyA9IGdldERlcGVuZFVVSURMaXN0KGZpbGVDb250ZW50KTtcbiAgICAgICAgICAgICAgICBhc3NldC5zZXREYXRhKCdkZXBlbmRzJywgZGVwZW5kcyk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sXG4gICAgfSxcbn07XG5cbmV4cG9ydCBkZWZhdWx0IEFuaW1hdGlvbkhhbmRsZXI7XG4iXX0=