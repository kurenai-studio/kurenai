'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnknownHandler = void 0;
const asset_db_1 = require("@cocos/asset-db");
const cc_1 = require("cc");
const utils_1 = require("../utils");
exports.UnknownHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: '*',
    // 引擎内对应的类型
    assetType: 'cc.Asset',
    async open() {
        return false;
    },
    /**
     * 检查文件是否适用于这个 Handler
     * @param asset
     */
    async validate(asset) {
        return !asset.isDirectory();
    },
    importer: {
        // 版本号如果变更，则会强制重新导入
        version: '1.0.0',
        /**
         * 实际导入流程
         *
         * 返回是否导入成功的标记
         * 如果返回 false，则 imported 标记不会变成 true
         * 后续的一系列操作都不会执行
         * @param asset
         */
        async import(asset) {
            // 虚拟的未知类型资源不做处理
            if (!(asset instanceof asset_db_1.Asset)) {
                return true;
            }
            // 如果当前资源没有导入，则开始导入当前资源
            await asset.copyToLibrary(asset.extname, asset.source);
            const unknowAsset = new cc_1.Asset();
            unknowAsset.name = asset.basename;
            // @ts-ignore
            unknowAsset._setRawAsset(asset.extname);
            const serializeJSON = EditorExtends.serialize(unknowAsset);
            await asset.saveToLibrary('.json', serializeJSON);
            const depends = (0, utils_1.getDependUUIDList)(serializeJSON);
            asset.setData('depends', depends);
            return true;
        },
    },
};
exports.default = exports.UnknownHandler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW5rbm93bi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9jb3JlL2Fzc2V0cy9hc3NldC1oYW5kbGVyL2Fzc2V0cy91bmtub3duLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7O0FBRWIsOENBQXNEO0FBQ3RELDJCQUFzQztBQUV0QyxvQ0FBNkM7QUFHaEMsUUFBQSxjQUFjLEdBQWlCO0lBQ3hDLGdDQUFnQztJQUNoQyxJQUFJLEVBQUUsR0FBRztJQUVULFdBQVc7SUFDWCxTQUFTLEVBQUUsVUFBVTtJQUVyQixLQUFLLENBQUMsSUFBSTtRQUVOLE9BQU8sS0FBSyxDQUFDO0lBQ2pCLENBQUM7SUFFRDs7O09BR0c7SUFDSCxLQUFLLENBQUMsUUFBUSxDQUFDLEtBQTJCO1FBQ3RDLE9BQU8sQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDaEMsQ0FBQztJQUVELFFBQVEsRUFBRTtRQUNOLG1CQUFtQjtRQUNuQixPQUFPLEVBQUUsT0FBTztRQUNoQjs7Ozs7OztXQU9HO1FBQ0gsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFZO1lBQ3JCLGdCQUFnQjtZQUNoQixJQUFJLENBQUMsQ0FBQyxLQUFLLFlBQVksZ0JBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQzVCLE9BQU8sSUFBSSxDQUFDO1lBQ2hCLENBQUM7WUFFRCx1QkFBdUI7WUFDdkIsTUFBTSxLQUFLLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBRXZELE1BQU0sV0FBVyxHQUFHLElBQUksVUFBTyxFQUFFLENBQUM7WUFDbEMsV0FBVyxDQUFDLElBQUksR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDO1lBQ2xDLGFBQWE7WUFDYixXQUFXLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUV4QyxNQUFNLGFBQWEsR0FBRyxhQUFhLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQzNELE1BQU0sS0FBSyxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFFbEQsTUFBTSxPQUFPLEdBQUcsSUFBQSx5QkFBaUIsRUFBQyxhQUFhLENBQUMsQ0FBQztZQUNqRCxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUVsQyxPQUFPLElBQUksQ0FBQztRQUNoQixDQUFDO0tBQ0o7Q0FDSixDQUFDO0FBRUYsa0JBQWUsc0JBQWMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgQXNzZXQsIFZpcnR1YWxBc3NldCB9IGZyb20gJ0Bjb2Nvcy9hc3NldC1kYic7XG5pbXBvcnQgeyBBc3NldCBhcyBjY0Fzc2V0IH0gZnJvbSAnY2MnO1xuXG5pbXBvcnQgeyBnZXREZXBlbmRVVUlETGlzdCB9IGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCB7IEFzc2V0SGFuZGxlciB9IGZyb20gJy4uLy4uL0B0eXBlcy9wcm90ZWN0ZWQnO1xuXG5leHBvcnQgY29uc3QgVW5rbm93bkhhbmRsZXI6IEFzc2V0SGFuZGxlciA9IHtcbiAgICAvLyBIYW5kbGVyIOeahOWQjeWtl++8jOeUqOS6juaMh+WumiBIYW5kbGVyIGFzIOetiVxuICAgIG5hbWU6ICcqJyxcblxuICAgIC8vIOW8leaTjuWGheWvueW6lOeahOexu+Wei1xuICAgIGFzc2V0VHlwZTogJ2NjLkFzc2V0JyxcblxuICAgIGFzeW5jIG9wZW4oKSB7XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDmo4Dmn6Xmlofku7bmmK/lkKbpgILnlKjkuo7ov5nkuKogSGFuZGxlclxuICAgICAqIEBwYXJhbSBhc3NldFxuICAgICAqL1xuICAgIGFzeW5jIHZhbGlkYXRlKGFzc2V0OiBWaXJ0dWFsQXNzZXQgfCBBc3NldCkge1xuICAgICAgICByZXR1cm4gIWFzc2V0LmlzRGlyZWN0b3J5KCk7XG4gICAgfSxcblxuICAgIGltcG9ydGVyOiB7XG4gICAgICAgIC8vIOeJiOacrOWPt+WmguaenOWPmOabtO+8jOWImeS8muW8uuWItumHjeaWsOWvvOWFpVxuICAgICAgICB2ZXJzaW9uOiAnMS4wLjAnLFxuICAgICAgICAvKipcbiAgICAgICAgICog5a6e6ZmF5a+85YWl5rWB56iLXG4gICAgICAgICAqXG4gICAgICAgICAqIOi/lOWbnuaYr+WQpuWvvOWFpeaIkOWKn+eahOagh+iusFxuICAgICAgICAgKiDlpoLmnpzov5Tlm54gZmFsc2XvvIzliJkgaW1wb3J0ZWQg5qCH6K6w5LiN5Lya5Y+Y5oiQIHRydWVcbiAgICAgICAgICog5ZCO57ut55qE5LiA57O75YiX5pON5L2c6YO95LiN5Lya5omn6KGMXG4gICAgICAgICAqIEBwYXJhbSBhc3NldFxuICAgICAgICAgKi9cbiAgICAgICAgYXN5bmMgaW1wb3J0KGFzc2V0OiBBc3NldCkge1xuICAgICAgICAgICAgLy8g6Jma5ouf55qE5pyq55+l57G75Z6L6LWE5rqQ5LiN5YGa5aSE55CGXG4gICAgICAgICAgICBpZiAoIShhc3NldCBpbnN0YW5jZW9mIEFzc2V0KSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDlpoLmnpzlvZPliY3otYTmupDmsqHmnInlr7zlhaXvvIzliJnlvIDlp4vlr7zlhaXlvZPliY3otYTmupBcbiAgICAgICAgICAgIGF3YWl0IGFzc2V0LmNvcHlUb0xpYnJhcnkoYXNzZXQuZXh0bmFtZSwgYXNzZXQuc291cmNlKTtcblxuICAgICAgICAgICAgY29uc3QgdW5rbm93QXNzZXQgPSBuZXcgY2NBc3NldCgpO1xuICAgICAgICAgICAgdW5rbm93QXNzZXQubmFtZSA9IGFzc2V0LmJhc2VuYW1lO1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgdW5rbm93QXNzZXQuX3NldFJhd0Fzc2V0KGFzc2V0LmV4dG5hbWUpO1xuXG4gICAgICAgICAgICBjb25zdCBzZXJpYWxpemVKU09OID0gRWRpdG9yRXh0ZW5kcy5zZXJpYWxpemUodW5rbm93QXNzZXQpO1xuICAgICAgICAgICAgYXdhaXQgYXNzZXQuc2F2ZVRvTGlicmFyeSgnLmpzb24nLCBzZXJpYWxpemVKU09OKTtcblxuICAgICAgICAgICAgY29uc3QgZGVwZW5kcyA9IGdldERlcGVuZFVVSURMaXN0KHNlcmlhbGl6ZUpTT04pO1xuICAgICAgICAgICAgYXNzZXQuc2V0RGF0YSgnZGVwZW5kcycsIGRlcGVuZHMpO1xuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSxcbiAgICB9LFxufTtcblxuZXhwb3J0IGRlZmF1bHQgVW5rbm93bkhhbmRsZXI7XG4iXX0=