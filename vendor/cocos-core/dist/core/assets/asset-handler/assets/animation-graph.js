"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
const utils_1 = require("../utils");
const AnimationGraphHandler = {
    name: 'animation-graph',
    // 引擎内对应的类型
    assetType: 'cc.AnimationGraph',
    open(asset) {
        // TODO: 实现打开动画图资产
        return false;
    },
    createInfo: {
        generateMenuInfo() {
            return [
                {
                    label: 'i18n:ENGINE.assets.newAnimationGraph',
                    fullFileName: 'Animation Graph.animgraph',
                    template: `db://internal/default_file_content/${AnimationGraphHandler.name}/default.animgraph`,
                    group: 'animation',
                    name: 'default',
                },
                {
                    label: 'i18n:ENGINE.assets.newAnimationGraphTS',
                    fullFileName: 'AnimationGraphComponent.ts',
                    template: `db://internal/default_file_content/${AnimationGraphHandler.name}/ts-animation-graph`,
                    handler: 'typescript',
                    group: 'animation',
                    name: 'ts-animation-graph',
                },
            ];
        },
    },
    importer: {
        // 版本号如果变更，则会强制重新导入
        version: '1.2.0',
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
exports.default = AnimationGraphHandler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5pbWF0aW9uLWdyYXBoLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvYXNzZXRzL2Fzc2V0LWhhbmRsZXIvYXNzZXRzL2FuaW1hdGlvbi1ncmFwaC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUdBLHVDQUFvQztBQUVwQyxvQ0FBNkM7QUFHN0MsTUFBTSxxQkFBcUIsR0FBaUI7SUFDeEMsSUFBSSxFQUFFLGlCQUFpQjtJQUN2QixXQUFXO0lBQ1gsU0FBUyxFQUFFLG1CQUFtQjtJQUM5QixJQUFJLENBQUMsS0FBSztRQUNOLGtCQUFrQjtRQUNsQixPQUFPLEtBQUssQ0FBQztJQUNqQixDQUFDO0lBQ0QsVUFBVSxFQUFFO1FBQ1IsZ0JBQWdCO1lBQ1osT0FBTztnQkFDSDtvQkFDSSxLQUFLLEVBQUUsc0NBQXNDO29CQUM3QyxZQUFZLEVBQUUsMkJBQTJCO29CQUN6QyxRQUFRLEVBQUUsc0NBQXNDLHFCQUFxQixDQUFDLElBQUksb0JBQW9CO29CQUM5RixLQUFLLEVBQUUsV0FBVztvQkFDbEIsSUFBSSxFQUFFLFNBQVM7aUJBQ2xCO2dCQUNEO29CQUNJLEtBQUssRUFBRSx3Q0FBd0M7b0JBQy9DLFlBQVksRUFBRSw0QkFBNEI7b0JBQzFDLFFBQVEsRUFBRSxzQ0FBc0MscUJBQXFCLENBQUMsSUFBSSxxQkFBcUI7b0JBQy9GLE9BQU8sRUFBRSxZQUFZO29CQUNyQixLQUFLLEVBQUUsV0FBVztvQkFDbEIsSUFBSSxFQUFFLG9CQUFvQjtpQkFDN0I7YUFDSixDQUFDO1FBQ04sQ0FBQztLQUNKO0lBQ0QsUUFBUSxFQUFFO1FBQ04sbUJBQW1CO1FBQ25CLE9BQU8sRUFBRSxPQUFPO1FBQ2hCOzs7OztXQUtHO1FBQ0gsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFZO1lBQ3JCLE1BQU0sYUFBYSxHQUFHLE1BQU0sSUFBQSxtQkFBUSxFQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDM0QsTUFBTSxLQUFLLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxhQUFhLENBQUMsQ0FBQztZQUVsRCxNQUFNLE9BQU8sR0FBRyxJQUFBLHlCQUFpQixFQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ2pELEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBRWxDLE9BQU8sSUFBSSxDQUFDO1FBQ2hCLENBQUM7S0FDSjtDQUNKLENBQUM7QUFFRixrQkFBZSxxQkFBcUIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFzc2V0IH0gZnJvbSAnQGNvY29zL2Fzc2V0LWRiJztcbmltcG9ydCB7IGpzIH0gZnJvbSAnY2MnO1xuaW1wb3J0IHsgQW5pbWF0aW9uR3JhcGggfSBmcm9tICdjYy9lZGl0b3IvbmV3LWdlbi1hbmltJztcbmltcG9ydCB7IHJlYWRGaWxlIH0gZnJvbSAnZnMtZXh0cmEnO1xuXG5pbXBvcnQgeyBnZXREZXBlbmRVVUlETGlzdCB9IGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCB7IEFzc2V0SGFuZGxlciB9IGZyb20gJy4uLy4uL0B0eXBlcy9wcm90ZWN0ZWQnO1xuXG5jb25zdCBBbmltYXRpb25HcmFwaEhhbmRsZXI6IEFzc2V0SGFuZGxlciA9IHtcbiAgICBuYW1lOiAnYW5pbWF0aW9uLWdyYXBoJyxcbiAgICAvLyDlvJXmk47lhoXlr7nlupTnmoTnsbvlnotcbiAgICBhc3NldFR5cGU6ICdjYy5BbmltYXRpb25HcmFwaCcsXG4gICAgb3Blbihhc3NldCkge1xuICAgICAgICAvLyBUT0RPOiDlrp7njrDmiZPlvIDliqjnlLvlm77otYTkuqdcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0sXG4gICAgY3JlYXRlSW5mbzoge1xuICAgICAgICBnZW5lcmF0ZU1lbnVJbmZvKCkge1xuICAgICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnaTE4bjpFTkdJTkUuYXNzZXRzLm5ld0FuaW1hdGlvbkdyYXBoJyxcbiAgICAgICAgICAgICAgICAgICAgZnVsbEZpbGVOYW1lOiAnQW5pbWF0aW9uIEdyYXBoLmFuaW1ncmFwaCcsXG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlOiBgZGI6Ly9pbnRlcm5hbC9kZWZhdWx0X2ZpbGVfY29udGVudC8ke0FuaW1hdGlvbkdyYXBoSGFuZGxlci5uYW1lfS9kZWZhdWx0LmFuaW1ncmFwaGAsXG4gICAgICAgICAgICAgICAgICAgIGdyb3VwOiAnYW5pbWF0aW9uJyxcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogJ2RlZmF1bHQnLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ2kxOG46RU5HSU5FLmFzc2V0cy5uZXdBbmltYXRpb25HcmFwaFRTJyxcbiAgICAgICAgICAgICAgICAgICAgZnVsbEZpbGVOYW1lOiAnQW5pbWF0aW9uR3JhcGhDb21wb25lbnQudHMnLFxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogYGRiOi8vaW50ZXJuYWwvZGVmYXVsdF9maWxlX2NvbnRlbnQvJHtBbmltYXRpb25HcmFwaEhhbmRsZXIubmFtZX0vdHMtYW5pbWF0aW9uLWdyYXBoYCxcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlcjogJ3R5cGVzY3JpcHQnLFxuICAgICAgICAgICAgICAgICAgICBncm91cDogJ2FuaW1hdGlvbicsXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICd0cy1hbmltYXRpb24tZ3JhcGgnLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdO1xuICAgICAgICB9LFxuICAgIH0sXG4gICAgaW1wb3J0ZXI6IHtcbiAgICAgICAgLy8g54mI5pys5Y+35aaC5p6c5Y+Y5pu077yM5YiZ5Lya5by65Yi26YeN5paw5a+85YWlXG4gICAgICAgIHZlcnNpb246ICcxLjIuMCcsXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDov5Tlm57mmK/lkKblr7zlhaXmiJDlip/nmoTmoIforrBcbiAgICAgICAgICog5aaC5p6c6L+U5ZueIGZhbHNl77yM5YiZIGltcG9ydGVkIOagh+iusOS4jeS8muWPmOaIkCB0cnVlXG4gICAgICAgICAqIOWQjue7reeahOS4gOezu+WIl+aTjeS9nOmDveS4jeS8muaJp+ihjFxuICAgICAgICAgKiBAcGFyYW0gYXNzZXRcbiAgICAgICAgICovXG4gICAgICAgIGFzeW5jIGltcG9ydChhc3NldDogQXNzZXQpIHtcbiAgICAgICAgICAgIGNvbnN0IHNlcmlhbGl6ZUpTT04gPSBhd2FpdCByZWFkRmlsZShhc3NldC5zb3VyY2UsICd1dGY4Jyk7XG4gICAgICAgICAgICBhd2FpdCBhc3NldC5zYXZlVG9MaWJyYXJ5KCcuanNvbicsIHNlcmlhbGl6ZUpTT04pO1xuXG4gICAgICAgICAgICBjb25zdCBkZXBlbmRzID0gZ2V0RGVwZW5kVVVJRExpc3Qoc2VyaWFsaXplSlNPTik7XG4gICAgICAgICAgICBhc3NldC5zZXREYXRhKCdkZXBlbmRzJywgZGVwZW5kcyk7XG5cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LFxuICAgIH0sXG59O1xuXG5leHBvcnQgZGVmYXVsdCBBbmltYXRpb25HcmFwaEhhbmRsZXI7XG4iXX0=