'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialHandler = void 0;
const fs_extra_1 = require("fs-extra");
const material_upgrader_1 = require("./utils/material-upgrader");
const utils_1 = require("../utils");
exports.MaterialHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: 'material',
    // 引擎内对应的类型
    assetType: 'cc.Material',
    async validate(asset) {
        try {
            const json = (0, fs_extra_1.readJSONSync)(asset.source);
            return json.__type__ === 'cc.Material';
        }
        catch (error) {
            return false;
        }
    },
    createInfo: {
        generateMenuInfo() {
            return [
                {
                    label: 'i18n:ENGINE.assets.newMaterial',
                    fullFileName: 'material.mtl',
                    template: `db://internal/default_file_content/${exports.MaterialHandler.name}/default.mtl`,
                    group: 'material',
                    name: 'default',
                },
            ];
        },
    },
    importer: {
        // 版本号如果变更，则会强制重新导入
        version: '1.0.21',
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
            try {
                const material = (0, fs_extra_1.readJSONSync)(asset.source);
                // uuid dependency
                const uuid = material._effectAsset && material._effectAsset.__uuid__;
                asset.depend(uuid);
                // upgrade properties
                if (await (0, material_upgrader_1.upgradeProperties)(material, asset)) {
                    (0, fs_extra_1.writeJSONSync)(asset.source, material, { spaces: 2 });
                }
                material._name = asset.basename || '';
                const serializeJSON = JSON.stringify(material, undefined, 2);
                await asset.saveToLibrary('.json', serializeJSON);
                const depends = (0, utils_1.getDependUUIDList)(serializeJSON);
                asset.setData('depends', depends);
                return true;
            }
            catch (err) {
                console.error(err);
                return false;
            }
        },
    },
};
exports.default = exports.MaterialHandler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWF0ZXJpYWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9hc3NldHMvYXNzZXQtaGFuZGxlci9hc3NldHMvbWF0ZXJpYWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7QUFHYix1Q0FBNkY7QUFDN0YsaUVBQThEO0FBRTlELG9DQUE2QztBQUdoQyxRQUFBLGVBQWUsR0FBaUI7SUFDekMsZ0NBQWdDO0lBQ2hDLElBQUksRUFBRSxVQUFVO0lBRWhCLFdBQVc7SUFDWCxTQUFTLEVBQUUsYUFBYTtJQUV4QixLQUFLLENBQUMsUUFBUSxDQUFDLEtBQVk7UUFDdkIsSUFBSSxDQUFDO1lBQ0QsTUFBTSxJQUFJLEdBQUcsSUFBQSx1QkFBWSxFQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN4QyxPQUFPLElBQUksQ0FBQyxRQUFRLEtBQUssYUFBYSxDQUFDO1FBQzNDLENBQUM7UUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1lBQ2IsT0FBTyxLQUFLLENBQUM7UUFDakIsQ0FBQztJQUNMLENBQUM7SUFFRCxVQUFVLEVBQUU7UUFDUixnQkFBZ0I7WUFDWixPQUFPO2dCQUNIO29CQUNJLEtBQUssRUFBRSxnQ0FBZ0M7b0JBQ3ZDLFlBQVksRUFBRSxjQUFjO29CQUM1QixRQUFRLEVBQUUsc0NBQXNDLHVCQUFlLENBQUMsSUFBSSxjQUFjO29CQUNsRixLQUFLLEVBQUUsVUFBVTtvQkFDakIsSUFBSSxFQUFFLFNBQVM7aUJBQ2xCO2FBQ0osQ0FBQztRQUNOLENBQUM7S0FDSjtJQUVELFFBQVEsRUFBRTtRQUNOLG1CQUFtQjtRQUNuQixPQUFPLEVBQUUsUUFBUTtRQUVqQjs7Ozs7Ozs7V0FRRztRQUNILEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBWTtZQUNyQixJQUFJLENBQUM7Z0JBQ0QsTUFBTSxRQUFRLEdBQUcsSUFBQSx1QkFBWSxFQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFFNUMsa0JBQWtCO2dCQUNsQixNQUFNLElBQUksR0FBRyxRQUFRLENBQUMsWUFBWSxJQUFJLFFBQVEsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDO2dCQUNyRSxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUVuQixxQkFBcUI7Z0JBQ3JCLElBQUksTUFBTSxJQUFBLHFDQUFpQixFQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsRUFBRSxDQUFDO29CQUMzQyxJQUFBLHdCQUFhLEVBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDekQsQ0FBQztnQkFDRCxRQUFRLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxRQUFRLElBQUksRUFBRSxDQUFDO2dCQUN0QyxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzdELE1BQU0sS0FBSyxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsYUFBYSxDQUFDLENBQUM7Z0JBRWxELE1BQU0sT0FBTyxHQUFHLElBQUEseUJBQWlCLEVBQUMsYUFBYSxDQUFDLENBQUM7Z0JBQ2pELEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUVsQyxPQUFPLElBQUksQ0FBQztZQUNoQixDQUFDO1lBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztnQkFDWCxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNuQixPQUFPLEtBQUssQ0FBQztZQUNqQixDQUFDO1FBQ0wsQ0FBQztLQUNKO0NBQ0osQ0FBQztBQUVGLGtCQUFlLHVCQUFlLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7IEFzc2V0LCBxdWVyeUFzc2V0LCBxdWVyeVBhdGgsIFZpcnR1YWxBc3NldCB9IGZyb20gJ0Bjb2Nvcy9hc3NldC1kYic7XG5pbXBvcnQgeyBvdXRwdXRKU09OLCBvdXRwdXRKU09OU3luYywgcmVhZEpTT04sIHJlYWRKU09OU3luYywgd3JpdGVKU09OU3luYyB9IGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCB7IHVwZ3JhZGVQcm9wZXJ0aWVzIH0gZnJvbSAnLi91dGlscy9tYXRlcmlhbC11cGdyYWRlcic7XG5cbmltcG9ydCB7IGdldERlcGVuZFVVSURMaXN0IH0gZnJvbSAnLi4vdXRpbHMnO1xuaW1wb3J0IHsgQXNzZXRIYW5kbGVyLCBJQXNzZXQsIElDcmVhdGVNZW51SW5mbyB9IGZyb20gJy4uLy4uL0B0eXBlcy9wcm90ZWN0ZWQnO1xuXG5leHBvcnQgY29uc3QgTWF0ZXJpYWxIYW5kbGVyOiBBc3NldEhhbmRsZXIgPSB7XG4gICAgLy8gSGFuZGxlciDnmoTlkI3lrZfvvIznlKjkuo7mjIflrpogSGFuZGxlciBhcyDnrYlcbiAgICBuYW1lOiAnbWF0ZXJpYWwnLFxuXG4gICAgLy8g5byV5pOO5YaF5a+55bqU55qE57G75Z6LXG4gICAgYXNzZXRUeXBlOiAnY2MuTWF0ZXJpYWwnLFxuXG4gICAgYXN5bmMgdmFsaWRhdGUoYXNzZXQ6IEFzc2V0KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBqc29uID0gcmVhZEpTT05TeW5jKGFzc2V0LnNvdXJjZSk7XG4gICAgICAgICAgICByZXR1cm4ganNvbi5fX3R5cGVfXyA9PT0gJ2NjLk1hdGVyaWFsJztcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBjcmVhdGVJbmZvOiB7XG4gICAgICAgIGdlbmVyYXRlTWVudUluZm8oKSB7XG4gICAgICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdpMThuOkVOR0lORS5hc3NldHMubmV3TWF0ZXJpYWwnLFxuICAgICAgICAgICAgICAgICAgICBmdWxsRmlsZU5hbWU6ICdtYXRlcmlhbC5tdGwnLFxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogYGRiOi8vaW50ZXJuYWwvZGVmYXVsdF9maWxlX2NvbnRlbnQvJHtNYXRlcmlhbEhhbmRsZXIubmFtZX0vZGVmYXVsdC5tdGxgLFxuICAgICAgICAgICAgICAgICAgICBncm91cDogJ21hdGVyaWFsJyxcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogJ2RlZmF1bHQnLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdO1xuICAgICAgICB9LFxuICAgIH0sXG5cbiAgICBpbXBvcnRlcjoge1xuICAgICAgICAvLyDniYjmnKzlj7flpoLmnpzlj5jmm7TvvIzliJnkvJrlvLrliLbph43mlrDlr7zlhaVcbiAgICAgICAgdmVyc2lvbjogJzEuMC4yMScsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOWunumZheWvvOWFpea1geeoi1xuICAgICAgICAgKiDpnIDopoHoh6rlt7HmjqfliLbmmK/lkKbnlJ/miJDjgIHmi7fotJ3mlofku7ZcbiAgICAgICAgICpcbiAgICAgICAgICog6L+U5Zue5piv5ZCm5a+85YWl5oiQ5Yqf55qE5qCH6K6wXG4gICAgICAgICAqIOWmguaenOi/lOWbniBmYWxzZe+8jOWImSBpbXBvcnRlZCDmoIforrDkuI3kvJrlj5jmiJAgdHJ1ZVxuICAgICAgICAgKiDlkI7nu63nmoTkuIDns7vliJfmk43kvZzpg73kuI3kvJrmiafooYxcbiAgICAgICAgICogQHBhcmFtIGFzc2V0XG4gICAgICAgICAqL1xuICAgICAgICBhc3luYyBpbXBvcnQoYXNzZXQ6IEFzc2V0KSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG1hdGVyaWFsID0gcmVhZEpTT05TeW5jKGFzc2V0LnNvdXJjZSk7XG5cbiAgICAgICAgICAgICAgICAvLyB1dWlkIGRlcGVuZGVuY3lcbiAgICAgICAgICAgICAgICBjb25zdCB1dWlkID0gbWF0ZXJpYWwuX2VmZmVjdEFzc2V0ICYmIG1hdGVyaWFsLl9lZmZlY3RBc3NldC5fX3V1aWRfXztcbiAgICAgICAgICAgICAgICBhc3NldC5kZXBlbmQodXVpZCk7XG5cbiAgICAgICAgICAgICAgICAvLyB1cGdyYWRlIHByb3BlcnRpZXNcbiAgICAgICAgICAgICAgICBpZiAoYXdhaXQgdXBncmFkZVByb3BlcnRpZXMobWF0ZXJpYWwsIGFzc2V0KSkge1xuICAgICAgICAgICAgICAgICAgICB3cml0ZUpTT05TeW5jKGFzc2V0LnNvdXJjZSwgbWF0ZXJpYWwsIHsgc3BhY2VzOiAyIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBtYXRlcmlhbC5fbmFtZSA9IGFzc2V0LmJhc2VuYW1lIHx8ICcnO1xuICAgICAgICAgICAgICAgIGNvbnN0IHNlcmlhbGl6ZUpTT04gPSBKU09OLnN0cmluZ2lmeShtYXRlcmlhbCwgdW5kZWZpbmVkLCAyKTtcbiAgICAgICAgICAgICAgICBhd2FpdCBhc3NldC5zYXZlVG9MaWJyYXJ5KCcuanNvbicsIHNlcmlhbGl6ZUpTT04pO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgZGVwZW5kcyA9IGdldERlcGVuZFVVSURMaXN0KHNlcmlhbGl6ZUpTT04pO1xuICAgICAgICAgICAgICAgIGFzc2V0LnNldERhdGEoJ2RlcGVuZHMnLCBkZXBlbmRzKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICB9LFxufTtcblxuZXhwb3J0IGRlZmF1bHQgTWF0ZXJpYWxIYW5kbGVyO1xuIl19