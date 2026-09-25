'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.TTFFontHandler = void 0;
const utils_1 = require("../utils");
exports.TTFFontHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: 'ttf-font',
    // 编辑器属性上定义的如果是资源的基类类型，此处也需要定义基类类型
    // 不会影响实际资源类型
    assetType: 'cc.TTFFont',
    importer: {
        // 版本号如果变更，则会强制重新导入
        version: '1.0.1',
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
            const filename = asset.basename + '.ttf';
            await asset.copyToLibrary(filename, asset.source);
            const ttf = createTTFFont(asset);
            const serializeJSON = EditorExtends.serialize(ttf);
            await asset.saveToLibrary('.json', serializeJSON);
            const depends = (0, utils_1.getDependUUIDList)(serializeJSON);
            asset.setData('depends', depends);
            return true;
        },
    },
};
exports.default = exports.TTFFontHandler;
function createTTFFont(asset) {
    const ttf = new cc.TTFFont();
    ttf.name = asset.basename;
    ttf._setRawAsset(ttf.name + '.ttf');
    return ttf;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHRmLWZvbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9hc3NldHMvYXNzZXQtaGFuZGxlci9hc3NldHMvdHRmLWZvbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7QUFNYixvQ0FBNkM7QUFHaEMsUUFBQSxjQUFjLEdBQWlCO0lBQ3hDLGdDQUFnQztJQUNoQyxJQUFJLEVBQUUsVUFBVTtJQUVoQixrQ0FBa0M7SUFDbEMsYUFBYTtJQUNiLFNBQVMsRUFBRSxZQUFZO0lBRXZCLFFBQVEsRUFBRTtRQUNOLG1CQUFtQjtRQUNuQixPQUFPLEVBQUUsT0FBTztRQUNoQjs7Ozs7Ozs7V0FRRztRQUNILEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBWTtZQUNyQixNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsUUFBUSxHQUFHLE1BQU0sQ0FBQztZQUN6QyxNQUFNLEtBQUssQ0FBQyxhQUFhLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNsRCxNQUFNLEdBQUcsR0FBRyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFakMsTUFBTSxhQUFhLEdBQUcsYUFBYSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNuRCxNQUFNLEtBQUssQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBRWxELE1BQU0sT0FBTyxHQUFHLElBQUEseUJBQWlCLEVBQUMsYUFBYSxDQUFDLENBQUM7WUFDakQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFFbEMsT0FBTyxJQUFJLENBQUM7UUFDaEIsQ0FBQztLQUNKO0NBQ0osQ0FBQztBQUVGLGtCQUFlLHNCQUFjLENBQUM7QUFFOUIsU0FBUyxhQUFhLENBQUMsS0FBWTtJQUMvQixNQUFNLEdBQUcsR0FBRyxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUM3QixHQUFHLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUM7SUFDMUIsR0FBRyxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxDQUFDO0lBQ3BDLE9BQU8sR0FBRyxDQUFDO0FBQ2YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgQXNzZXQgfSBmcm9tICdAY29jb3MvYXNzZXQtZGInO1xuaW1wb3J0IHsgQXNzZXRIYW5kbGVyIH0gZnJvbSAnLi4vLi4vQHR5cGVzL3Byb3RlY3RlZCc7XG5pbXBvcnQgeyBleHRuYW1lIH0gZnJvbSAncGF0aCc7XG5cbmltcG9ydCB7IGdldERlcGVuZFVVSURMaXN0IH0gZnJvbSAnLi4vdXRpbHMnO1xuZGVjbGFyZSBjb25zdCBjYzogYW55O1xuXG5leHBvcnQgY29uc3QgVFRGRm9udEhhbmRsZXI6IEFzc2V0SGFuZGxlciA9IHtcbiAgICAvLyBIYW5kbGVyIOeahOWQjeWtl++8jOeUqOS6juaMh+WumiBIYW5kbGVyIGFzIOetiVxuICAgIG5hbWU6ICd0dGYtZm9udCcsXG5cbiAgICAvLyDnvJbovpHlmajlsZ7mgKfkuIrlrprkuYnnmoTlpoLmnpzmmK/otYTmupDnmoTln7rnsbvnsbvlnovvvIzmraTlpITkuZ/pnIDopoHlrprkuYnln7rnsbvnsbvlnotcbiAgICAvLyDkuI3kvJrlvbHlk43lrp7pmYXotYTmupDnsbvlnotcbiAgICBhc3NldFR5cGU6ICdjYy5UVEZGb250JyxcblxuICAgIGltcG9ydGVyOiB7XG4gICAgICAgIC8vIOeJiOacrOWPt+WmguaenOWPmOabtO+8jOWImeS8muW8uuWItumHjeaWsOWvvOWFpVxuICAgICAgICB2ZXJzaW9uOiAnMS4wLjEnLFxuICAgICAgICAvKipcbiAgICAgICAgICog5a6e6ZmF5a+85YWl5rWB56iLXG4gICAgICAgICAqIOmcgOimgeiHquW3seaOp+WItuaYr+WQpueUn+aIkOOAgeaLt+i0neaWh+S7tlxuICAgICAgICAgKlxuICAgICAgICAgKiDov5Tlm57mmK/lkKblr7zlhaXmiJDlip/nmoTmoIforrBcbiAgICAgICAgICog5aaC5p6c6L+U5ZueIGZhbHNl77yM5YiZIGltcG9ydGVkIOagh+iusOS4jeS8muWPmOaIkCB0cnVlXG4gICAgICAgICAqIOWQjue7reeahOS4gOezu+WIl+aTjeS9nOmDveS4jeS8muaJp+ihjFxuICAgICAgICAgKiBAcGFyYW0gYXNzZXRcbiAgICAgICAgICovXG4gICAgICAgIGFzeW5jIGltcG9ydChhc3NldDogQXNzZXQpIHtcbiAgICAgICAgICAgIGNvbnN0IGZpbGVuYW1lID0gYXNzZXQuYmFzZW5hbWUgKyAnLnR0Zic7XG4gICAgICAgICAgICBhd2FpdCBhc3NldC5jb3B5VG9MaWJyYXJ5KGZpbGVuYW1lLCBhc3NldC5zb3VyY2UpO1xuICAgICAgICAgICAgY29uc3QgdHRmID0gY3JlYXRlVFRGRm9udChhc3NldCk7XG5cbiAgICAgICAgICAgIGNvbnN0IHNlcmlhbGl6ZUpTT04gPSBFZGl0b3JFeHRlbmRzLnNlcmlhbGl6ZSh0dGYpO1xuICAgICAgICAgICAgYXdhaXQgYXNzZXQuc2F2ZVRvTGlicmFyeSgnLmpzb24nLCBzZXJpYWxpemVKU09OKTtcblxuICAgICAgICAgICAgY29uc3QgZGVwZW5kcyA9IGdldERlcGVuZFVVSURMaXN0KHNlcmlhbGl6ZUpTT04pO1xuICAgICAgICAgICAgYXNzZXQuc2V0RGF0YSgnZGVwZW5kcycsIGRlcGVuZHMpO1xuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSxcbiAgICB9LFxufTtcblxuZXhwb3J0IGRlZmF1bHQgVFRGRm9udEhhbmRsZXI7XG5cbmZ1bmN0aW9uIGNyZWF0ZVRURkZvbnQoYXNzZXQ6IEFzc2V0KSB7XG4gICAgY29uc3QgdHRmID0gbmV3IGNjLlRURkZvbnQoKTtcbiAgICB0dGYubmFtZSA9IGFzc2V0LmJhc2VuYW1lO1xuICAgIHR0Zi5fc2V0UmF3QXNzZXQodHRmLm5hbWUgKyAnLnR0ZicpO1xuICAgIHJldHVybiB0dGY7XG59XG4iXX0=