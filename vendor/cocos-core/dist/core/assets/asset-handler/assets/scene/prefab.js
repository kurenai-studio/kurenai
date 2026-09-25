'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrefabHandler = void 0;
const index_1 = require("./index");
const fs_extra_1 = require("fs-extra");
const utils_1 = require("../../utils");
const filesystem_1 = require("../../../manager/filesystem");
exports.PrefabHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: 'prefab',
    // 引擎内对应的类型
    assetType: 'cc.Prefab',
    open(asset) {
        // TODO: 实现打开预制体资产
        return false;
    },
    createInfo: {
        generateMenuInfo() {
            return [
                {
                    label: 'i18n:ENGINE.assets.newPrefab',
                    fullFileName: 'Node.prefab',
                    template: `db://internal/default_file_content/${exports.PrefabHandler.name}/default.prefab`,
                    group: 'scene',
                    name: 'default',
                },
            ];
        },
    },
    importer: {
        version: index_1.version,
        versionCode: index_1.versionCode,
        /**
         * 实际导入流程
         * 需要自己控制是否生成、拷贝文件
         *
         * 返回是否导入成功的标记
         * 如果返回 false，则 imported 标记不会变成 true
         * 后续的一系列操作都不会执行
         * @param asset 资源
         */
        async import(asset) {
            /**
             * 为了保持生成的 prefab 根节点的 nodeName 与 prefab 资源 baseName 一致
             * 在 meta 文件 userData 中增加一个标记 syncNodeName
             * 当 prefab 资源的文件名称与 syncNodeName 不一致时，更新资源和 library 中的数据
             */
            const source = await (0, fs_extra_1.readJSON)(asset.source);
            const basename = asset.basename || '';
            let dirty = source[0]._name !== basename || source[1]._name !== basename || source[0].persistent !== !!asset.userData.persistent;
            if (dirty) {
                // 更新资源的 name
                source[0]._name = basename || '';
                source[1]._name = basename || '';
                source[0].persistent = !!asset.userData.persistent;
            }
            try {
                // HACK 过去版本场景 prefab 资源可能会出现节点组件数据为空的情况
                dirty = dirty || (0, utils_1.removeNull)(source, asset.uuid);
            }
            catch (error) {
                console.debug(error);
            }
            // 同步到存档文件
            if (dirty) {
                try {
                    const serializeJSON = JSON.stringify(source, undefined, 2);
                    await (0, filesystem_1.writePath)(asset.source, serializeJSON);
                }
                catch (error) {
                    // 有可能只读，只读的话就不管源文件了
                }
            }
            const serializeJSON = JSON.stringify(source, undefined, 2);
            await asset.saveToLibrary('.json', serializeJSON);
            const dependInfo = (0, utils_1.getDependList)(serializeJSON);
            asset.setData('depends', dependInfo.uuids);
            asset.setData('dependScripts', dependInfo.dependScriptUuids);
            // 最后更改标记
            asset.userData.syncNodeName = basename;
            return true;
        },
    },
};
exports.default = exports.PrefabHandler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZmFiLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvYXNzZXRzL2Fzc2V0LWhhbmRsZXIvYXNzZXRzL3NjZW5lL3ByZWZhYi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7OztBQUdiLG1DQUErQztBQUMvQyx1Q0FBb0M7QUFHcEMsdUNBQXdEO0FBQ3hELDREQUF3RDtBQUUzQyxRQUFBLGFBQWEsR0FBaUI7SUFDdkMsZ0NBQWdDO0lBQ2hDLElBQUksRUFBRSxRQUFRO0lBQ2QsV0FBVztJQUNYLFNBQVMsRUFBRSxXQUFXO0lBQ3RCLElBQUksQ0FBQyxLQUFLO1FBQ04sa0JBQWtCO1FBQ2xCLE9BQU8sS0FBSyxDQUFDO0lBQ2pCLENBQUM7SUFDRCxVQUFVLEVBQUU7UUFDUixnQkFBZ0I7WUFDWixPQUFPO2dCQUNIO29CQUNJLEtBQUssRUFBRSw4QkFBOEI7b0JBQ3JDLFlBQVksRUFBRSxhQUFhO29CQUMzQixRQUFRLEVBQUUsc0NBQXNDLHFCQUFhLENBQUMsSUFBSSxpQkFBaUI7b0JBQ25GLEtBQUssRUFBRSxPQUFPO29CQUNkLElBQUksRUFBRSxTQUFTO2lCQUNsQjthQUNKLENBQUM7UUFDTixDQUFDO0tBQ0o7SUFFRCxRQUFRLEVBQUU7UUFDTixPQUFPLEVBQVAsZUFBTztRQUNQLFdBQVcsRUFBWCxtQkFBVztRQUVYOzs7Ozs7OztXQVFHO1FBQ0gsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFZO1lBQ3JCOzs7O2VBSUc7WUFDSCxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEsbUJBQVEsRUFBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7WUFFNUMsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLFFBQVEsSUFBSSxFQUFFLENBQUM7WUFDdEMsSUFBSSxLQUFLLEdBQ0wsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssS0FBSyxRQUFRLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssS0FBSyxRQUFRLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsS0FBSyxDQUFDLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUM7WUFFekgsSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDUixhQUFhO2dCQUNiLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsUUFBUSxJQUFJLEVBQUUsQ0FBQztnQkFDakMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxRQUFRLElBQUksRUFBRSxDQUFDO2dCQUNqQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQztZQUN2RCxDQUFDO1lBQ0QsSUFBSSxDQUFDO2dCQUNELHdDQUF3QztnQkFDeEMsS0FBSyxHQUFHLEtBQUssSUFBSSxJQUFBLGtCQUFVLEVBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNwRCxDQUFDO1lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDYixPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3pCLENBQUM7WUFDRCxVQUFVO1lBQ1YsSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDUixJQUFJLENBQUM7b0JBQ0QsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUMzRCxNQUFNLElBQUEsc0JBQVMsRUFBQyxLQUFLLENBQUMsTUFBTSxFQUFFLGFBQWEsQ0FBQyxDQUFDO2dCQUNqRCxDQUFDO2dCQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7b0JBQ2Isb0JBQW9CO2dCQUN4QixDQUFDO1lBQ0wsQ0FBQztZQUVELE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMzRCxNQUFNLEtBQUssQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBQ2xELE1BQU0sVUFBVSxHQUFHLElBQUEscUJBQWEsRUFBQyxhQUFhLENBQUMsQ0FBQztZQUNoRCxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDM0MsS0FBSyxDQUFDLE9BQU8sQ0FBQyxlQUFlLEVBQUUsVUFBVSxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFFN0QsU0FBUztZQUNULEtBQUssQ0FBQyxRQUFRLENBQUMsWUFBWSxHQUFHLFFBQVEsQ0FBQztZQUV2QyxPQUFPLElBQUksQ0FBQztRQUNoQixDQUFDO0tBQ0o7Q0FDSixDQUFDO0FBRUYsa0JBQWUscUJBQWEsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgQXNzZXQgfSBmcm9tICdAY29jb3MvYXNzZXQtZGInO1xuaW1wb3J0IHsgdmVyc2lvbiwgdmVyc2lvbkNvZGUgfSBmcm9tICcuL2luZGV4JztcbmltcG9ydCB7IHJlYWRKU09OIH0gZnJvbSAnZnMtZXh0cmEnO1xuXG5pbXBvcnQgeyBBc3NldEhhbmRsZXIgfSBmcm9tICcuLi8uLi8uLi9AdHlwZXMvcHJvdGVjdGVkJztcbmltcG9ydCB7IGdldERlcGVuZExpc3QsIHJlbW92ZU51bGwgfSBmcm9tICcuLi8uLi91dGlscyc7XG5pbXBvcnQgeyB3cml0ZVBhdGggfSBmcm9tICcuLi8uLi8uLi9tYW5hZ2VyL2ZpbGVzeXN0ZW0nO1xuXG5leHBvcnQgY29uc3QgUHJlZmFiSGFuZGxlcjogQXNzZXRIYW5kbGVyID0ge1xuICAgIC8vIEhhbmRsZXIg55qE5ZCN5a2X77yM55So5LqO5oyH5a6aIEhhbmRsZXIgYXMg562JXG4gICAgbmFtZTogJ3ByZWZhYicsXG4gICAgLy8g5byV5pOO5YaF5a+55bqU55qE57G75Z6LXG4gICAgYXNzZXRUeXBlOiAnY2MuUHJlZmFiJyxcbiAgICBvcGVuKGFzc2V0KSB7XG4gICAgICAgIC8vIFRPRE86IOWunueOsOaJk+W8gOmihOWItuS9k+i1hOS6p1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcbiAgICBjcmVhdGVJbmZvOiB7XG4gICAgICAgIGdlbmVyYXRlTWVudUluZm8oKSB7XG4gICAgICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdpMThuOkVOR0lORS5hc3NldHMubmV3UHJlZmFiJyxcbiAgICAgICAgICAgICAgICAgICAgZnVsbEZpbGVOYW1lOiAnTm9kZS5wcmVmYWInLFxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogYGRiOi8vaW50ZXJuYWwvZGVmYXVsdF9maWxlX2NvbnRlbnQvJHtQcmVmYWJIYW5kbGVyLm5hbWV9L2RlZmF1bHQucHJlZmFiYCxcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXA6ICdzY2VuZScsXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICdkZWZhdWx0JyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXTtcbiAgICAgICAgfSxcbiAgICB9LFxuXG4gICAgaW1wb3J0ZXI6IHtcbiAgICAgICAgdmVyc2lvbixcbiAgICAgICAgdmVyc2lvbkNvZGUsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOWunumZheWvvOWFpea1geeoi1xuICAgICAgICAgKiDpnIDopoHoh6rlt7HmjqfliLbmmK/lkKbnlJ/miJDjgIHmi7fotJ3mlofku7ZcbiAgICAgICAgICpcbiAgICAgICAgICog6L+U5Zue5piv5ZCm5a+85YWl5oiQ5Yqf55qE5qCH6K6wXG4gICAgICAgICAqIOWmguaenOi/lOWbniBmYWxzZe+8jOWImSBpbXBvcnRlZCDmoIforrDkuI3kvJrlj5jmiJAgdHJ1ZVxuICAgICAgICAgKiDlkI7nu63nmoTkuIDns7vliJfmk43kvZzpg73kuI3kvJrmiafooYxcbiAgICAgICAgICogQHBhcmFtIGFzc2V0IOi1hOa6kFxuICAgICAgICAgKi9cbiAgICAgICAgYXN5bmMgaW1wb3J0KGFzc2V0OiBBc3NldCkge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDkuLrkuobkv53mjIHnlJ/miJDnmoQgcHJlZmFiIOagueiKgueCueeahCBub2RlTmFtZSDkuI4gcHJlZmFiIOi1hOa6kCBiYXNlTmFtZSDkuIDoh7RcbiAgICAgICAgICAgICAqIOWcqCBtZXRhIOaWh+S7tiB1c2VyRGF0YSDkuK3lop7liqDkuIDkuKrmoIforrAgc3luY05vZGVOYW1lXG4gICAgICAgICAgICAgKiDlvZMgcHJlZmFiIOi1hOa6kOeahOaWh+S7tuWQjeensOS4jiBzeW5jTm9kZU5hbWUg5LiN5LiA6Ie05pe277yM5pu05paw6LWE5rqQ5ZKMIGxpYnJhcnkg5Lit55qE5pWw5o2uXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGNvbnN0IHNvdXJjZSA9IGF3YWl0IHJlYWRKU09OKGFzc2V0LnNvdXJjZSk7XG5cbiAgICAgICAgICAgIGNvbnN0IGJhc2VuYW1lID0gYXNzZXQuYmFzZW5hbWUgfHwgJyc7XG4gICAgICAgICAgICBsZXQgZGlydHkgPVxuICAgICAgICAgICAgICAgIHNvdXJjZVswXS5fbmFtZSAhPT0gYmFzZW5hbWUgfHwgc291cmNlWzFdLl9uYW1lICE9PSBiYXNlbmFtZSB8fCBzb3VyY2VbMF0ucGVyc2lzdGVudCAhPT0gISFhc3NldC51c2VyRGF0YS5wZXJzaXN0ZW50O1xuXG4gICAgICAgICAgICBpZiAoZGlydHkpIHtcbiAgICAgICAgICAgICAgICAvLyDmm7TmlrDotYTmupDnmoQgbmFtZVxuICAgICAgICAgICAgICAgIHNvdXJjZVswXS5fbmFtZSA9IGJhc2VuYW1lIHx8ICcnO1xuICAgICAgICAgICAgICAgIHNvdXJjZVsxXS5fbmFtZSA9IGJhc2VuYW1lIHx8ICcnO1xuICAgICAgICAgICAgICAgIHNvdXJjZVswXS5wZXJzaXN0ZW50ID0gISFhc3NldC51c2VyRGF0YS5wZXJzaXN0ZW50O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAvLyBIQUNLIOi/h+WOu+eJiOacrOWcuuaZryBwcmVmYWIg6LWE5rqQ5Y+v6IO95Lya5Ye6546w6IqC54K557uE5Lu25pWw5o2u5Li656m655qE5oOF5Ya1XG4gICAgICAgICAgICAgICAgZGlydHkgPSBkaXJ0eSB8fCByZW1vdmVOdWxsKHNvdXJjZSwgYXNzZXQudXVpZCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8g5ZCM5q2l5Yiw5a2Y5qGj5paH5Lu2XG4gICAgICAgICAgICBpZiAoZGlydHkpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzZXJpYWxpemVKU09OID0gSlNPTi5zdHJpbmdpZnkoc291cmNlLCB1bmRlZmluZWQsIDIpO1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCB3cml0ZVBhdGgoYXNzZXQuc291cmNlLCBzZXJpYWxpemVKU09OKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAvLyDmnInlj6/og73lj6ror7vvvIzlj6ror7vnmoTor53lsLHkuI3nrqHmupDmlofku7bkuoZcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHNlcmlhbGl6ZUpTT04gPSBKU09OLnN0cmluZ2lmeShzb3VyY2UsIHVuZGVmaW5lZCwgMik7XG4gICAgICAgICAgICBhd2FpdCBhc3NldC5zYXZlVG9MaWJyYXJ5KCcuanNvbicsIHNlcmlhbGl6ZUpTT04pO1xuICAgICAgICAgICAgY29uc3QgZGVwZW5kSW5mbyA9IGdldERlcGVuZExpc3Qoc2VyaWFsaXplSlNPTik7XG4gICAgICAgICAgICBhc3NldC5zZXREYXRhKCdkZXBlbmRzJywgZGVwZW5kSW5mby51dWlkcyk7XG4gICAgICAgICAgICBhc3NldC5zZXREYXRhKCdkZXBlbmRTY3JpcHRzJywgZGVwZW5kSW5mby5kZXBlbmRTY3JpcHRVdWlkcyk7XG5cbiAgICAgICAgICAgIC8vIOacgOWQjuabtOaUueagh+iusFxuICAgICAgICAgICAgYXNzZXQudXNlckRhdGEuc3luY05vZGVOYW1lID0gYmFzZW5hbWU7XG5cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LFxuICAgIH0sXG59O1xuXG5leHBvcnQgZGVmYXVsdCBQcmVmYWJIYW5kbGVyO1xuIl19