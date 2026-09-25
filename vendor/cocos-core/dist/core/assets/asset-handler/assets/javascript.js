"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JavascriptHandler = void 0;
const asset_db_1 = require("@cocos/asset-db");
const fs_extra_1 = require("fs-extra");
const script_compiler_1 = require("./utils/script-compiler");
const plugin_script_globals_1 = require("./utils/plugin-script-globals");
const utils_1 = require("../utils");
const scripting_1 = __importDefault(require("../../../scripting"));
const asset_db_2 = require("@cocos/asset-db");
exports.JavascriptHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: 'javascript',
    // 引擎内对应的类型
    assetType: 'cc.Script',
    open: utils_1.openCode,
    importer: {
        // 版本号如果变更，则会强制重新导入
        version: '4.0.24',
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
            if (!(asset instanceof asset_db_1.Asset)) {
                console.error('Expect non-virtual asset');
                return false;
            }
            const userData = asset.userData;
            try {
                if (userData.isPlugin) {
                    return await _importPluginScript(asset);
                }
                else {
                    await scripting_1.default.compileScripts([{
                            type: asset.action,
                            uuid: asset.uuid,
                            filePath: asset.source,
                            importer: asset.meta.importer,
                            userData: asset.meta.userData,
                        }]);
                    return true;
                }
            }
            catch (error) {
                console.error(`Failed to import script ${asset.source}`);
                throw error;
            }
        },
    },
    async destroy(asset) {
        scripting_1.default.dispatchAssetChange({
            type: asset_db_2.AssetActionEnum.delete,
            uuid: asset.uuid,
            filePath: asset.source,
            importer: asset.meta.importer,
            userData: asset.meta.userData,
        });
        try {
            await scripting_1.default.compileScripts();
        }
        catch {
            //
        }
    },
};
exports.default = exports.JavascriptHandler;
async function _importPluginScript(asset) {
    // https://mathiasbynens.be/notes/globalthis
    const code = await (0, fs_extra_1.readFile)(asset.source, 'utf-8');
    // 填写默认的插件导入选项
    const { executionScope = 'enclosed', experimentalHideCommonJs, experimentalHideAmd, simulateGlobals, } = asset.userData;
    const defaultUserData = {
        isPlugin: true,
        loadPluginInEditor: false,
        loadPluginInWeb: true,
        loadPluginInMiniGame: true,
        loadPluginInNative: true,
    };
    asset.assignUserData(defaultUserData, false);
    if (executionScope === 'global') {
        await asset.saveToLibrary('.js', code);
        return true;
    }
    const simulateGlobalNames = (0, plugin_script_globals_1.resolveSimulatedGlobals)(simulateGlobals);
    const transformed = await (0, script_compiler_1.transformPluginScript)(code, {
        simulateGlobals: simulateGlobalNames,
        hideCommonJs: experimentalHideCommonJs ?? true,
        hideAmd: experimentalHideAmd ?? true,
    });
    await asset.saveToLibrary('.js', transformed.code);
    return true;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiamF2YXNjcmlwdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9jb3JlL2Fzc2V0cy9hc3NldC1oYW5kbGVyL2Fzc2V0cy9qYXZhc2NyaXB0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLDhDQUFzRDtBQUN0RCx1Q0FBb0M7QUFDcEMsNkRBQWdFO0FBQ2hFLHlFQUF3RTtBQUN4RSxvQ0FBb0M7QUFHcEMsbUVBQTJDO0FBQzNDLDhDQUFrRDtBQUVyQyxRQUFBLGlCQUFpQixHQUFxQjtJQUMvQyxnQ0FBZ0M7SUFDaEMsSUFBSSxFQUFFLFlBQVk7SUFFbEIsV0FBVztJQUNYLFNBQVMsRUFBRSxXQUFXO0lBRXRCLElBQUksRUFBRSxnQkFBUTtJQUVkLFFBQVEsRUFBRTtRQUNOLG1CQUFtQjtRQUNuQixPQUFPLEVBQUUsUUFBUTtRQUVqQjs7Ozs7Ozs7V0FRRztRQUNILEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBMkI7WUFDcEMsSUFBSSxDQUFDLENBQUMsS0FBSyxZQUFZLGdCQUFLLENBQUMsRUFBRSxDQUFDO2dCQUM1QixPQUFPLENBQUMsS0FBSyxDQUFDLDBCQUEwQixDQUFDLENBQUM7Z0JBQzFDLE9BQU8sS0FBSyxDQUFDO1lBQ2pCLENBQUM7WUFFRCxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsUUFBbUMsQ0FBQztZQUMzRCxJQUFJLENBQUM7Z0JBQ0QsSUFBSSxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUM7b0JBQ3BCLE9BQU8sTUFBTSxtQkFBbUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDNUMsQ0FBQztxQkFBTSxDQUFDO29CQUNKLE1BQU0sbUJBQVMsQ0FBQyxjQUFjLENBQUMsQ0FBQzs0QkFDNUIsSUFBSSxFQUFFLEtBQUssQ0FBQyxNQUFNOzRCQUNsQixJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUk7NEJBQ2hCLFFBQVEsRUFBRSxLQUFLLENBQUMsTUFBTTs0QkFDdEIsUUFBUSxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUTs0QkFDN0IsUUFBUSxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUTt5QkFDaEMsQ0FBQyxDQUFDLENBQUM7b0JBQ0osT0FBTyxJQUFJLENBQUM7Z0JBQ2hCLENBQUM7WUFDTCxDQUFDO1lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDYixPQUFPLENBQUMsS0FBSyxDQUFDLDJCQUEyQixLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztnQkFDekQsTUFBTSxLQUFLLENBQUM7WUFDaEIsQ0FBQztRQUNMLENBQUM7S0FDSjtJQUVELEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBMkI7UUFDckMsbUJBQVMsQ0FBQyxtQkFBbUIsQ0FBQztZQUMxQixJQUFJLEVBQUUsMEJBQWUsQ0FBQyxNQUFNO1lBQzVCLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSTtZQUNoQixRQUFRLEVBQUUsS0FBSyxDQUFDLE1BQU07WUFDdEIsUUFBUSxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUTtZQUM3QixRQUFRLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRO1NBQ2hDLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQztZQUNELE1BQU0sbUJBQVMsQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUNyQyxDQUFDO1FBQUMsTUFBTSxDQUFDO1lBQ0wsRUFBRTtRQUNOLENBQUM7SUFFTCxDQUFDO0NBQ0osQ0FBQztBQUVGLGtCQUFlLHlCQUFpQixDQUFDO0FBRWpDLEtBQUssVUFBVSxtQkFBbUIsQ0FBQyxLQUFZO0lBQzNDLDRDQUE0QztJQUM1QyxNQUFNLElBQUksR0FBRyxNQUFNLElBQUEsbUJBQVEsRUFBQyxLQUFLLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBRW5ELGNBQWM7SUFDZCxNQUFNLEVBQ0YsY0FBYyxHQUFHLFVBQVUsRUFDM0Isd0JBQXdCLEVBQ3hCLG1CQUFtQixFQUNuQixlQUFlLEdBQ2xCLEdBQUcsS0FBSyxDQUFDLFFBQWdDLENBQUM7SUFFM0MsTUFBTSxlQUFlLEdBQXlCO1FBQzFDLFFBQVEsRUFBRSxJQUFJO1FBQ2Qsa0JBQWtCLEVBQUUsS0FBSztRQUN6QixlQUFlLEVBQUUsSUFBSTtRQUNyQixvQkFBb0IsRUFBRSxJQUFJO1FBQzFCLGtCQUFrQixFQUFFLElBQUk7S0FDM0IsQ0FBQztJQUVGLEtBQUssQ0FBQyxjQUFjLENBQUMsZUFBZSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBRTdDLElBQUksY0FBYyxLQUFLLFFBQVEsRUFBRSxDQUFDO1FBQzlCLE1BQU0sS0FBSyxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDdkMsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUVELE1BQU0sbUJBQW1CLEdBQUcsSUFBQSwrQ0FBdUIsRUFBQyxlQUFlLENBQUMsQ0FBQztJQUVyRSxNQUFNLFdBQVcsR0FBRyxNQUFNLElBQUEsdUNBQXFCLEVBQUMsSUFBSSxFQUFFO1FBQ2xELGVBQWUsRUFBRSxtQkFBbUI7UUFDcEMsWUFBWSxFQUFFLHdCQUF3QixJQUFJLElBQUk7UUFDOUMsT0FBTyxFQUFFLG1CQUFtQixJQUFJLElBQUk7S0FDdkMsQ0FBQyxDQUFDO0lBRUgsTUFBTSxLQUFLLENBQUMsYUFBYSxDQUFDLEtBQUssRUFBRSxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDbkQsT0FBTyxJQUFJLENBQUM7QUFDaEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFzc2V0LCBWaXJ0dWFsQXNzZXQgfSBmcm9tICdAY29jb3MvYXNzZXQtZGInO1xuaW1wb3J0IHsgcmVhZEZpbGUgfSBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgeyB0cmFuc2Zvcm1QbHVnaW5TY3JpcHQgfSBmcm9tICcuL3V0aWxzL3NjcmlwdC1jb21waWxlcic7XG5pbXBvcnQgeyByZXNvbHZlU2ltdWxhdGVkR2xvYmFscyB9IGZyb20gJy4vdXRpbHMvcGx1Z2luLXNjcmlwdC1nbG9iYWxzJztcbmltcG9ydCB7IG9wZW5Db2RlIH0gZnJvbSAnLi4vdXRpbHMnO1xuaW1wb3J0IHsgQXNzZXRIYW5kbGVyQmFzZSB9IGZyb20gJy4uLy4uL0B0eXBlcy9wcm90ZWN0ZWQnO1xuaW1wb3J0IHsgSmF2YVNjcmlwdEFzc2V0VXNlckRhdGEsIFBsdWdpblNjcmlwdFVzZXJEYXRhIH0gZnJvbSAnLi4vLi4vQHR5cGVzL3VzZXJEYXRhcyc7XG5pbXBvcnQgc2NyaXB0aW5nIGZyb20gJy4uLy4uLy4uL3NjcmlwdGluZyc7XG5pbXBvcnQgeyBBc3NldEFjdGlvbkVudW0gfSBmcm9tICdAY29jb3MvYXNzZXQtZGInO1xuXG5leHBvcnQgY29uc3QgSmF2YXNjcmlwdEhhbmRsZXI6IEFzc2V0SGFuZGxlckJhc2UgPSB7XG4gICAgLy8gSGFuZGxlciDnmoTlkI3lrZfvvIznlKjkuo7mjIflrpogSGFuZGxlciBhcyDnrYlcbiAgICBuYW1lOiAnamF2YXNjcmlwdCcsXG5cbiAgICAvLyDlvJXmk47lhoXlr7nlupTnmoTnsbvlnotcbiAgICBhc3NldFR5cGU6ICdjYy5TY3JpcHQnLFxuXG4gICAgb3Blbjogb3BlbkNvZGUsXG5cbiAgICBpbXBvcnRlcjoge1xuICAgICAgICAvLyDniYjmnKzlj7flpoLmnpzlj5jmm7TvvIzliJnkvJrlvLrliLbph43mlrDlr7zlhaVcbiAgICAgICAgdmVyc2lvbjogJzQuMC4yNCcsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOWunumZheWvvOWFpea1geeoi1xuICAgICAgICAgKiDpnIDopoHoh6rlt7HmjqfliLbmmK/lkKbnlJ/miJDjgIHmi7fotJ3mlofku7ZcbiAgICAgICAgICpcbiAgICAgICAgICog6L+U5Zue5piv5ZCm5a+85YWl5oiQ5Yqf55qE5qCH6K6wXG4gICAgICAgICAqIOWmguaenOi/lOWbniBmYWxzZe+8jOWImSBpbXBvcnRlZCDmoIforrDkuI3kvJrlj5jmiJAgdHJ1ZVxuICAgICAgICAgKiDlkI7nu63nmoTkuIDns7vliJfmk43kvZzpg73kuI3kvJrmiafooYxcbiAgICAgICAgICogQHBhcmFtIGFzc2V0XG4gICAgICAgICAqL1xuICAgICAgICBhc3luYyBpbXBvcnQoYXNzZXQ6IEFzc2V0IHwgVmlydHVhbEFzc2V0KSB7XG4gICAgICAgICAgICBpZiAoIShhc3NldCBpbnN0YW5jZW9mIEFzc2V0KSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0V4cGVjdCBub24tdmlydHVhbCBhc3NldCcpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgdXNlckRhdGEgPSBhc3NldC51c2VyRGF0YSBhcyBKYXZhU2NyaXB0QXNzZXRVc2VyRGF0YTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaWYgKHVzZXJEYXRhLmlzUGx1Z2luKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCBfaW1wb3J0UGx1Z2luU2NyaXB0KGFzc2V0KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBzY3JpcHRpbmcuY29tcGlsZVNjcmlwdHMoW3tcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IGFzc2V0LmFjdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IGFzc2V0LnV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlUGF0aDogYXNzZXQuc291cmNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgaW1wb3J0ZXI6IGFzc2V0Lm1ldGEuaW1wb3J0ZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICB1c2VyRGF0YTogYXNzZXQubWV0YS51c2VyRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgfV0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEZhaWxlZCB0byBpbXBvcnQgc2NyaXB0ICR7YXNzZXQuc291cmNlfWApO1xuICAgICAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgIH0sXG5cbiAgICBhc3luYyBkZXN0cm95KGFzc2V0OiBBc3NldCB8IFZpcnR1YWxBc3NldCkge1xuICAgICAgICBzY3JpcHRpbmcuZGlzcGF0Y2hBc3NldENoYW5nZSh7XG4gICAgICAgICAgICB0eXBlOiBBc3NldEFjdGlvbkVudW0uZGVsZXRlLFxuICAgICAgICAgICAgdXVpZDogYXNzZXQudXVpZCxcbiAgICAgICAgICAgIGZpbGVQYXRoOiBhc3NldC5zb3VyY2UsXG4gICAgICAgICAgICBpbXBvcnRlcjogYXNzZXQubWV0YS5pbXBvcnRlcixcbiAgICAgICAgICAgIHVzZXJEYXRhOiBhc3NldC5tZXRhLnVzZXJEYXRhLFxuICAgICAgICB9KTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHNjcmlwdGluZy5jb21waWxlU2NyaXB0cygpO1xuICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgIC8vXG4gICAgICAgIH0gXG4gICAgICAgIFxuICAgIH0sXG59O1xuXG5leHBvcnQgZGVmYXVsdCBKYXZhc2NyaXB0SGFuZGxlcjtcblxuYXN5bmMgZnVuY3Rpb24gX2ltcG9ydFBsdWdpblNjcmlwdChhc3NldDogQXNzZXQpIHtcbiAgICAvLyBodHRwczovL21hdGhpYXNieW5lbnMuYmUvbm90ZXMvZ2xvYmFsdGhpc1xuICAgIGNvbnN0IGNvZGUgPSBhd2FpdCByZWFkRmlsZShhc3NldC5zb3VyY2UsICd1dGYtOCcpO1xuXG4gICAgLy8g5aGr5YaZ6buY6K6k55qE5o+S5Lu25a+85YWl6YCJ6aG5XG4gICAgY29uc3Qge1xuICAgICAgICBleGVjdXRpb25TY29wZSA9ICdlbmNsb3NlZCcsXG4gICAgICAgIGV4cGVyaW1lbnRhbEhpZGVDb21tb25KcyxcbiAgICAgICAgZXhwZXJpbWVudGFsSGlkZUFtZCxcbiAgICAgICAgc2ltdWxhdGVHbG9iYWxzLFxuICAgIH0gPSBhc3NldC51c2VyRGF0YSBhcyBQbHVnaW5TY3JpcHRVc2VyRGF0YTtcblxuICAgIGNvbnN0IGRlZmF1bHRVc2VyRGF0YTogUGx1Z2luU2NyaXB0VXNlckRhdGEgPSB7XG4gICAgICAgIGlzUGx1Z2luOiB0cnVlLFxuICAgICAgICBsb2FkUGx1Z2luSW5FZGl0b3I6IGZhbHNlLFxuICAgICAgICBsb2FkUGx1Z2luSW5XZWI6IHRydWUsXG4gICAgICAgIGxvYWRQbHVnaW5Jbk1pbmlHYW1lOiB0cnVlLFxuICAgICAgICBsb2FkUGx1Z2luSW5OYXRpdmU6IHRydWUsXG4gICAgfTtcblxuICAgIGFzc2V0LmFzc2lnblVzZXJEYXRhKGRlZmF1bHRVc2VyRGF0YSwgZmFsc2UpO1xuXG4gICAgaWYgKGV4ZWN1dGlvblNjb3BlID09PSAnZ2xvYmFsJykge1xuICAgICAgICBhd2FpdCBhc3NldC5zYXZlVG9MaWJyYXJ5KCcuanMnLCBjb2RlKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgY29uc3Qgc2ltdWxhdGVHbG9iYWxOYW1lcyA9IHJlc29sdmVTaW11bGF0ZWRHbG9iYWxzKHNpbXVsYXRlR2xvYmFscyk7XG5cbiAgICBjb25zdCB0cmFuc2Zvcm1lZCA9IGF3YWl0IHRyYW5zZm9ybVBsdWdpblNjcmlwdChjb2RlLCB7XG4gICAgICAgIHNpbXVsYXRlR2xvYmFsczogc2ltdWxhdGVHbG9iYWxOYW1lcyxcbiAgICAgICAgaGlkZUNvbW1vbkpzOiBleHBlcmltZW50YWxIaWRlQ29tbW9uSnMgPz8gdHJ1ZSxcbiAgICAgICAgaGlkZUFtZDogZXhwZXJpbWVudGFsSGlkZUFtZCA/PyB0cnVlLFxuICAgIH0pO1xuXG4gICAgYXdhaXQgYXNzZXQuc2F2ZVRvTGlicmFyeSgnLmpzJywgdHJhbnNmb3JtZWQuY29kZSk7XG4gICAgcmV0dXJuIHRydWU7XG59XG4iXX0=