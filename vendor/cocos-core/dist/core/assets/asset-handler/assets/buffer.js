'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.BufferHandler = void 0;
const path_1 = require("path");
const utils_1 = require("../utils");
exports.BufferHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: 'buffer',
    // 对应的引擎内的类型
    assetType: 'cc.BufferAsset',
    importer: {
        // 版本号如果变更，则会强制重新导入
        version: '1.0.3',
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
            const ext = (0, path_1.extname)(asset.source);
            await asset.copyToLibrary(ext, asset.source);
            try {
                // 如果当前资源没有导入，则开始导入当前资源
                const bufferAsset = new cc.BufferAsset();
                bufferAsset.name = asset.basename || '';
                bufferAsset._setRawAsset('.bin');
                const serializeJSON = EditorExtends.serialize(bufferAsset);
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
exports.default = exports.BufferHandler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVmZmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvYXNzZXRzL2Fzc2V0LWhhbmRsZXIvYXNzZXRzL2J1ZmZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7OztBQUliLCtCQUErQjtBQUUvQixvQ0FBNkM7QUFFaEMsUUFBQSxhQUFhLEdBQWlCO0lBQ3ZDLGdDQUFnQztJQUNoQyxJQUFJLEVBQUUsUUFBUTtJQUVkLFlBQVk7SUFDWixTQUFTLEVBQUUsZ0JBQWdCO0lBRTNCLFFBQVEsRUFBRTtRQUNOLG1CQUFtQjtRQUNuQixPQUFPLEVBQUUsT0FBTztRQUVoQjs7Ozs7Ozs7V0FRRztRQUNILEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBWTtZQUNyQixNQUFNLEdBQUcsR0FBRyxJQUFBLGNBQU8sRUFBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDbEMsTUFBTSxLQUFLLENBQUMsYUFBYSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7WUFFN0MsSUFBSSxDQUFDO2dCQUNELHVCQUF1QjtnQkFDdkIsTUFBTSxXQUFXLEdBQUcsSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3pDLFdBQVcsQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDLFFBQVEsSUFBSSxFQUFFLENBQUM7Z0JBQ3hDLFdBQVcsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBRWpDLE1BQU0sYUFBYSxHQUFHLGFBQWEsQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLENBQUM7Z0JBQzNELE1BQU0sS0FBSyxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsYUFBYSxDQUFDLENBQUM7Z0JBRWxELE1BQU0sT0FBTyxHQUFHLElBQUEseUJBQWlCLEVBQUMsYUFBYSxDQUFDLENBQUM7Z0JBQ2pELEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUVsQyxPQUFPLElBQUksQ0FBQztZQUNoQixDQUFDO1lBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztnQkFDWCxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNuQixPQUFPLEtBQUssQ0FBQztZQUNqQixDQUFDO1FBQ0wsQ0FBQztLQUNKO0NBQ0osQ0FBQztBQUVGLGtCQUFlLHFCQUFhLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7IEFzc2V0IH0gZnJvbSAnQGNvY29zL2Fzc2V0LWRiJztcbmltcG9ydCB7IEFzc2V0SGFuZGxlciB9IGZyb20gJy4uLy4uL0B0eXBlcy9wcm90ZWN0ZWQnO1xuaW1wb3J0IHsgZXh0bmFtZSB9IGZyb20gJ3BhdGgnO1xuXG5pbXBvcnQgeyBnZXREZXBlbmRVVUlETGlzdCB9IGZyb20gJy4uL3V0aWxzJztcblxuZXhwb3J0IGNvbnN0IEJ1ZmZlckhhbmRsZXI6IEFzc2V0SGFuZGxlciA9IHtcbiAgICAvLyBIYW5kbGVyIOeahOWQjeWtl++8jOeUqOS6juaMh+WumiBIYW5kbGVyIGFzIOetiVxuICAgIG5hbWU6ICdidWZmZXInLFxuXG4gICAgLy8g5a+55bqU55qE5byV5pOO5YaF55qE57G75Z6LXG4gICAgYXNzZXRUeXBlOiAnY2MuQnVmZmVyQXNzZXQnLFxuXG4gICAgaW1wb3J0ZXI6IHtcbiAgICAgICAgLy8g54mI5pys5Y+35aaC5p6c5Y+Y5pu077yM5YiZ5Lya5by65Yi26YeN5paw5a+85YWlXG4gICAgICAgIHZlcnNpb246ICcxLjAuMycsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOWunumZheWvvOWFpea1geeoi1xuICAgICAgICAgKiDpnIDopoHoh6rlt7HmjqfliLbmmK/lkKbnlJ/miJDjgIHmi7fotJ3mlofku7ZcbiAgICAgICAgICpcbiAgICAgICAgICog6L+U5Zue5piv5ZCm5a+85YWl5oiQ5Yqf55qE5qCH6K6wXG4gICAgICAgICAqIOWmguaenOi/lOWbniBmYWxzZe+8jOWImSBpbXBvcnRlZCDmoIforrDkuI3kvJrlj5jmiJAgdHJ1ZVxuICAgICAgICAgKiDlkI7nu63nmoTkuIDns7vliJfmk43kvZzpg73kuI3kvJrmiafooYxcbiAgICAgICAgICogQHBhcmFtIGFzc2V0XG4gICAgICAgICAqL1xuICAgICAgICBhc3luYyBpbXBvcnQoYXNzZXQ6IEFzc2V0KSB7XG4gICAgICAgICAgICBjb25zdCBleHQgPSBleHRuYW1lKGFzc2V0LnNvdXJjZSk7XG4gICAgICAgICAgICBhd2FpdCBhc3NldC5jb3B5VG9MaWJyYXJ5KGV4dCwgYXNzZXQuc291cmNlKTtcblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAvLyDlpoLmnpzlvZPliY3otYTmupDmsqHmnInlr7zlhaXvvIzliJnlvIDlp4vlr7zlhaXlvZPliY3otYTmupBcbiAgICAgICAgICAgICAgICBjb25zdCBidWZmZXJBc3NldCA9IG5ldyBjYy5CdWZmZXJBc3NldCgpO1xuICAgICAgICAgICAgICAgIGJ1ZmZlckFzc2V0Lm5hbWUgPSBhc3NldC5iYXNlbmFtZSB8fCAnJztcbiAgICAgICAgICAgICAgICBidWZmZXJBc3NldC5fc2V0UmF3QXNzZXQoJy5iaW4nKTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHNlcmlhbGl6ZUpTT04gPSBFZGl0b3JFeHRlbmRzLnNlcmlhbGl6ZShidWZmZXJBc3NldCk7XG4gICAgICAgICAgICAgICAgYXdhaXQgYXNzZXQuc2F2ZVRvTGlicmFyeSgnLmpzb24nLCBzZXJpYWxpemVKU09OKTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IGRlcGVuZHMgPSBnZXREZXBlbmRVVUlETGlzdChzZXJpYWxpemVKU09OKTtcbiAgICAgICAgICAgICAgICBhc3NldC5zZXREYXRhKCdkZXBlbmRzJywgZGVwZW5kcyk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgfSxcbn07XG5cbmV4cG9ydCBkZWZhdWx0IEJ1ZmZlckhhbmRsZXI7XG4iXX0=