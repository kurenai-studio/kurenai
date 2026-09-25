"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
const utils_1 = require("../utils");
const AnimationGraphVariantHandler = {
    name: 'animation-graph-variant',
    // 引擎内对应的类型
    assetType: 'cc.AnimationGraphVariant',
    createInfo: {
        generateMenuInfo() {
            return [
                {
                    label: 'i18n:ENGINE.assets.newAnimationGraphVariant',
                    fullFileName: 'Animation Graph Varint.animgraphvari',
                    template: `db://internal/default_file_content/${AnimationGraphVariantHandler.name}/default.animgraphvari`,
                    group: 'animation',
                    name: 'default',
                },
            ];
        },
    },
    importer: {
        // 版本号如果变更，则会强制重新导入
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
exports.default = AnimationGraphVariantHandler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5pbWF0aW9uLWdyYXBoLXZhcmlhbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9hc3NldHMvYXNzZXQtaGFuZGxlci9hc3NldHMvYW5pbWF0aW9uLWdyYXBoLXZhcmlhbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSx1Q0FBb0M7QUFFcEMsb0NBQTZDO0FBRzdDLE1BQU0sNEJBQTRCLEdBQWlCO0lBQy9DLElBQUksRUFBRSx5QkFBeUI7SUFDL0IsV0FBVztJQUNYLFNBQVMsRUFBRSwwQkFBMEI7SUFDckMsVUFBVSxFQUFFO1FBQ1IsZ0JBQWdCO1lBQ1osT0FBTztnQkFDSDtvQkFDSSxLQUFLLEVBQUUsNkNBQTZDO29CQUNwRCxZQUFZLEVBQUUsc0NBQXNDO29CQUNwRCxRQUFRLEVBQUUsc0NBQXNDLDRCQUE0QixDQUFDLElBQUksd0JBQXdCO29CQUN6RyxLQUFLLEVBQUUsV0FBVztvQkFDbEIsSUFBSSxFQUFFLFNBQVM7aUJBQ2xCO2FBQ0osQ0FBQztRQUNOLENBQUM7S0FDSjtJQUNELFFBQVEsRUFBRTtRQUNOLG1CQUFtQjtRQUNuQixPQUFPLEVBQUUsT0FBTztRQUNoQjs7Ozs7V0FLRztRQUNILEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBWTtZQUNyQixNQUFNLGFBQWEsR0FBRyxNQUFNLElBQUEsbUJBQVEsRUFBQyxLQUFLLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQzNELE1BQU0sS0FBSyxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFFbEQsTUFBTSxPQUFPLEdBQUcsSUFBQSx5QkFBaUIsRUFBQyxhQUFhLENBQUMsQ0FBQztZQUNqRCxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUVsQyxPQUFPLElBQUksQ0FBQztRQUNoQixDQUFDO0tBQ0o7Q0FDSixDQUFDO0FBRUYsa0JBQWUsNEJBQTRCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBc3NldCB9IGZyb20gJ0Bjb2Nvcy9hc3NldC1kYic7XG5pbXBvcnQgeyByZWFkRmlsZSB9IGZyb20gJ2ZzLWV4dHJhJztcblxuaW1wb3J0IHsgZ2V0RGVwZW5kVVVJRExpc3QgfSBmcm9tICcuLi91dGlscyc7XG5pbXBvcnQgeyBBc3NldEhhbmRsZXIgfSBmcm9tICcuLi8uLi9AdHlwZXMvcHJvdGVjdGVkJztcblxuY29uc3QgQW5pbWF0aW9uR3JhcGhWYXJpYW50SGFuZGxlcjogQXNzZXRIYW5kbGVyID0ge1xuICAgIG5hbWU6ICdhbmltYXRpb24tZ3JhcGgtdmFyaWFudCcsXG4gICAgLy8g5byV5pOO5YaF5a+55bqU55qE57G75Z6LXG4gICAgYXNzZXRUeXBlOiAnY2MuQW5pbWF0aW9uR3JhcGhWYXJpYW50JyxcbiAgICBjcmVhdGVJbmZvOiB7XG4gICAgICAgIGdlbmVyYXRlTWVudUluZm8oKSB7XG4gICAgICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdpMThuOkVOR0lORS5hc3NldHMubmV3QW5pbWF0aW9uR3JhcGhWYXJpYW50JyxcbiAgICAgICAgICAgICAgICAgICAgZnVsbEZpbGVOYW1lOiAnQW5pbWF0aW9uIEdyYXBoIFZhcmludC5hbmltZ3JhcGh2YXJpJyxcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGU6IGBkYjovL2ludGVybmFsL2RlZmF1bHRfZmlsZV9jb250ZW50LyR7QW5pbWF0aW9uR3JhcGhWYXJpYW50SGFuZGxlci5uYW1lfS9kZWZhdWx0LmFuaW1ncmFwaHZhcmlgLFxuICAgICAgICAgICAgICAgICAgICBncm91cDogJ2FuaW1hdGlvbicsXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICdkZWZhdWx0JyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXTtcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIGltcG9ydGVyOiB7XG4gICAgICAgIC8vIOeJiOacrOWPt+WmguaenOWPmOabtO+8jOWImeS8muW8uuWItumHjeaWsOWvvOWFpVxuICAgICAgICB2ZXJzaW9uOiAnMS4wLjAnLFxuICAgICAgICAvKipcbiAgICAgICAgICog6L+U5Zue5piv5ZCm5a+85YWl5oiQ5Yqf55qE5qCH6K6wXG4gICAgICAgICAqIOWmguaenOi/lOWbniBmYWxzZe+8jOWImSBpbXBvcnRlZCDmoIforrDkuI3kvJrlj5jmiJAgdHJ1ZVxuICAgICAgICAgKiDlkI7nu63nmoTkuIDns7vliJfmk43kvZzpg73kuI3kvJrmiafooYxcbiAgICAgICAgICogQHBhcmFtIGFzc2V0XG4gICAgICAgICAqL1xuICAgICAgICBhc3luYyBpbXBvcnQoYXNzZXQ6IEFzc2V0KSB7XG4gICAgICAgICAgICBjb25zdCBzZXJpYWxpemVKU09OID0gYXdhaXQgcmVhZEZpbGUoYXNzZXQuc291cmNlLCAndXRmOCcpO1xuICAgICAgICAgICAgYXdhaXQgYXNzZXQuc2F2ZVRvTGlicmFyeSgnLmpzb24nLCBzZXJpYWxpemVKU09OKTtcblxuICAgICAgICAgICAgY29uc3QgZGVwZW5kcyA9IGdldERlcGVuZFVVSURMaXN0KHNlcmlhbGl6ZUpTT04pO1xuICAgICAgICAgICAgYXNzZXQuc2V0RGF0YSgnZGVwZW5kcycsIGRlcGVuZHMpO1xuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSxcbiAgICB9LFxufTtcblxuZXhwb3J0IGRlZmF1bHQgQW5pbWF0aW9uR3JhcGhWYXJpYW50SGFuZGxlcjtcbiJdfQ==