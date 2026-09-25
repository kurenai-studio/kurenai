'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BitmapHandler = void 0;
const asset_db_1 = require("@cocos/asset-db");
const cc_1 = require("cc");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const image_utils_1 = require("./utils/image-utils");
const utils_1 = require("../utils");
const fnt_parser_1 = __importDefault(require("./utils/fnt-parser"));
/**
 * 获取实际的纹理文件位置
 * @param name
 * @param path
 */
function getRealFntTexturePath(name, asset) {
    // const isWin32Path = name.indexOf(':') !== -1;
    const textureBaseName = (0, path_1.basename)(name);
    // if (isWin32Path) {
    //     textureBaseName = Path.win32.basename(textureName);
    // }
    const texturePath = (0, path_1.join)((0, path_1.dirname)(asset.source), textureBaseName);
    if (!(0, fs_extra_1.existsSync)(texturePath)) {
        console.warn('Parse Error: Unable to find file Texture, the path: ' + texturePath);
    }
    return texturePath;
}
const UserFlags = {
    DoNotNotify: false,
};
exports.BitmapHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: 'bitmap-font',
    // 编辑器属性上定义的如果是资源的基类类型，此处也需要定义基类类型
    // 不会影响实际资源类型
    assetType: 'cc.BitmapFont',
    importer: {
        // 版本号如果变更，则会强制重新导入
        version: '1.0.6',
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
            // 解析文字文件
            const fntData = await (0, fs_extra_1.readFile)(asset.source, 'utf8');
            let fntConfig;
            try {
                fntConfig = fnt_parser_1.default.parseFnt(fntData);
            }
            catch (error) {
                console.error(error);
                throw new Error(`BitmapFont import failed: ${asset.uuid} file parsing failed`);
            }
            // 缓存 fnt 配置
            asset.userData._fntConfig = fntConfig;
            // 如果文字尺寸不存在的话，不需要导入
            if (!fntConfig.fontSize) {
                console.error(`BitmapFont import failed: ${asset.uuid} file parsing failed, There is no 'fontSize' in the configuration.`);
                return false;
            }
            asset.userData.fontSize = fntConfig.fontSize;
            // 标记依赖资源
            const texturePath = getRealFntTexturePath(fntConfig.atlasName, asset);
            asset.depend(texturePath);
            const textureUuid = asset._assetDB.pathToUuid(texturePath);
            if (!textureUuid) {
                return false;
            }
            // 挂载 textureUuid
            asset.userData.textureUuid = textureUuid;
            // 如果依赖的资源已经导入完成了，则生成对应的数据，并且
            if (asset.userData.textureUuid) {
                const textureAsset = (0, asset_db_1.queryAsset)(asset.userData.textureUuid);
                if (!textureAsset) {
                    return false;
                }
                (0, image_utils_1.changeImageDefaultType)(textureAsset, 'sprite-frame');
                const bitmap = createBitmapFnt(asset);
                bitmap.spriteFrame = EditorExtends.serialize.asAsset(textureAsset.uuid + '@f9941', cc_1.SpriteFrame);
                const serializeJSON = EditorExtends.serialize(bitmap);
                await asset.saveToLibrary('.json', serializeJSON);
                const depends = (0, utils_1.getDependUUIDList)(serializeJSON);
                asset.setData('depends', depends);
            }
            return true;
        },
    },
    /**
     * 判断是否允许使用当前的 Handler 进行导入
     * @param asset
     */
    async validate(asset) {
        return true;
    },
};
exports.default = exports.BitmapHandler;
/**
 * 创建一个 Bitmap 实例对象
 * @param asset
 */
function createBitmapFnt(asset) {
    // @ts-ignore
    const bitmap = new cc.BitmapFont();
    bitmap.name = (0, path_1.basename)(asset.source, asset.extname);
    // 3.5 再改
    bitmap.name = asset.basename || '';
    bitmap.fontSize = asset.userData.fontSize;
    bitmap.fntConfig = asset.userData._fntConfig;
    return bitmap;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYml0bWFwLWZvbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9hc3NldHMvYXNzZXQtaGFuZGxlci9hc3NldHMvYml0bWFwLWZvbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7Ozs7QUFFYiw4Q0FBb0Q7QUFDcEQsMkJBQWlDO0FBQ2pDLHVDQUFnRDtBQUNoRCwrQkFBK0M7QUFDL0MscURBQTZEO0FBRTdELG9DQUE2QztBQUc3QyxvRUFBMkM7QUFFM0M7Ozs7R0FJRztBQUNILFNBQVMscUJBQXFCLENBQUMsSUFBWSxFQUFFLEtBQVk7SUFDckQsZ0RBQWdEO0lBQ2hELE1BQU0sZUFBZSxHQUFHLElBQUEsZUFBUSxFQUFDLElBQUksQ0FBQyxDQUFDO0lBRXZDLHFCQUFxQjtJQUNyQiwwREFBMEQ7SUFDMUQsSUFBSTtJQUNKLE1BQU0sV0FBVyxHQUFHLElBQUEsV0FBSSxFQUFDLElBQUEsY0FBTyxFQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxlQUFlLENBQUMsQ0FBQztJQUVqRSxJQUFJLENBQUMsSUFBQSxxQkFBVSxFQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUM7UUFDM0IsT0FBTyxDQUFDLElBQUksQ0FBQyxzREFBc0QsR0FBRyxXQUFXLENBQUMsQ0FBQztJQUN2RixDQUFDO0lBQ0QsT0FBTyxXQUFXLENBQUM7QUFDdkIsQ0FBQztBQUVELE1BQU0sU0FBUyxHQUFHO0lBQ2QsV0FBVyxFQUFFLEtBQUs7Q0FDckIsQ0FBQztBQUVXLFFBQUEsYUFBYSxHQUFpQjtJQUN2QyxnQ0FBZ0M7SUFDaEMsSUFBSSxFQUFFLGFBQWE7SUFFbkIsa0NBQWtDO0lBQ2xDLGFBQWE7SUFDYixTQUFTLEVBQUUsZUFBZTtJQUUxQixRQUFRLEVBQUU7UUFDTixtQkFBbUI7UUFDbkIsT0FBTyxFQUFFLE9BQU87UUFDaEI7Ozs7Ozs7O1dBUUc7UUFDSCxLQUFLLENBQUMsTUFBTSxDQUFDLEtB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LGVBQVEsRUFBQyxLQUFLLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNwRCxTQUFTO0lBQ1QsTUFBTSxDQUFDLElBQUksR0FBRyxLQUFLLENBQUMsUUFBUSxJQUFJLEVBQUUsQ0FBQztJQUVuQyxNQUFNLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDO0lBQzFDLE1BQU0sQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUM7SUFFN0MsT0FBTyxNQUFNLENBQUM7QUFDbEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgQXNzZXQsIHF1ZXJ5QXNzZXQgfSBmcm9tICdAY29jb3MvYXNzZXQtZGInO1xuaW1wb3J0IHsgU3ByaXRlRnJhbWUgfSBmcm9tICdjYyc7XG5pbXBvcnQgeyBleGlzdHNTeW5jLCByZWFkRmlsZSB9IGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCB7IGJhc2VuYW1lLCBkaXJuYW1lLCBqb2luIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBjaGFuZ2VJbWFnZURlZmF1bHRUeXBlIH0gZnJvbSAnLi91dGlscy9pbWFnZS11dGlscyc7XG5cbmltcG9ydCB7IGdldERlcGVuZFVVSURMaXN0IH0gZnJvbSAnLi4vdXRpbHMnO1xuaW1wb3J0IHsgQXNzZXRIYW5kbGVyIH0gZnJvbSAnLi4vLi4vQHR5cGVzL3Byb3RlY3RlZCc7XG5cbmltcG9ydCBmbnRQYXJzZXIgZnJvbSAnLi91dGlscy9mbnQtcGFyc2VyJztcblxuLyoqXG4gKiDojrflj5blrp7pmYXnmoTnurnnkIbmlofku7bkvY3nva5cbiAqIEBwYXJhbSBuYW1lXG4gKiBAcGFyYW0gcGF0aFxuICovXG5mdW5jdGlvbiBnZXRSZWFsRm50VGV4dHVyZVBhdGgobmFtZTogc3RyaW5nLCBhc3NldDogQXNzZXQpIHtcbiAgICAvLyBjb25zdCBpc1dpbjMyUGF0aCA9IG5hbWUuaW5kZXhPZignOicpICE9PSAtMTtcbiAgICBjb25zdCB0ZXh0dXJlQmFzZU5hbWUgPSBiYXNlbmFtZShuYW1lKTtcblxuICAgIC8vIGlmIChpc1dpbjMyUGF0aCkge1xuICAgIC8vICAgICB0ZXh0dXJlQmFzZU5hbWUgPSBQYXRoLndpbjMyLmJhc2VuYW1lKHRleHR1cmVOYW1lKTtcbiAgICAvLyB9XG4gICAgY29uc3QgdGV4dHVyZVBhdGggPSBqb2luKGRpcm5hbWUoYXNzZXQuc291cmNlKSwgdGV4dHVyZUJhc2VOYW1lKTtcblxuICAgIGlmICghZXhpc3RzU3luYyh0ZXh0dXJlUGF0aCkpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdQYXJzZSBFcnJvcjogVW5hYmxlIHRvIGZpbmQgZmlsZSBUZXh0dXJlLCB0aGUgcGF0aDogJyArIHRleHR1cmVQYXRoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRleHR1cmVQYXRoO1xufVxuXG5jb25zdCBVc2VyRmxhZ3MgPSB7XG4gICAgRG9Ob3ROb3RpZnk6IGZhbHNlLFxufTtcblxuZXhwb3J0IGNvbnN0IEJpdG1hcEhhbmRsZXI6IEFzc2V0SGFuZGxlciA9IHtcbiAgICAvLyBIYW5kbGVyIOeahOWQjeWtl++8jOeUqOS6juaMh+WumiBIYW5kbGVyIGFzIOetiVxuICAgIG5hbWU6ICdiaXRtYXAtZm9udCcsXG5cbiAgICAvLyDnvJbovpHlmajlsZ7mgKfkuIrlrprkuYnnmoTlpoLmnpzmmK/otYTmupDnmoTln7rnsbvnsbvlnovvvIzmraTlpITkuZ/pnIDopoHlrprkuYnln7rnsbvnsbvlnotcbiAgICAvLyDkuI3kvJrlvbHlk43lrp7pmYXotYTmupDnsbvlnotcbiAgICBhc3NldFR5cGU6ICdjYy5CaXRtYXBGb250JyxcblxuICAgIGltcG9ydGVyOiB7XG4gICAgICAgIC8vIOeJiOacrOWPt+WmguaenOWPmOabtO+8jOWImeS8muW8uuWItumHjeaWsOWvvOWFpVxuICAgICAgICB2ZXJzaW9uOiAnMS4wLjYnLFxuICAgICAgICAvKipcbiAgICAgICAgICog5a6e6ZmF5a+85YWl5rWB56iLXG4gICAgICAgICAqIOmcgOimgeiHquW3seaOp+WItuaYr+WQpueUn+aIkOOAgeaLt+i0neaWh+S7tlxuICAgICAgICAgKlxuICAgICAgICAgKiDov5Tlm57mmK/lkKblr7zlhaXmiJDlip/nmoTmoIforrBcbiAgICAgICAgICog5aaC5p6c6L+U5ZueIGZhbHNl77yM5YiZIGltcG9ydGVkIOagh+iusOS4jeS8muWPmOaIkCB0cnVlXG4gICAgICAgICAqIOWQjue7reeahOS4gOezu+WIl+aTjeS9nOmDveS4jeS8muaJp+ihjFxuICAgICAgICAgKiBAcGFyYW0gYXNzZXRcbiAgICAgICAgICovXG4gICAgICAgIGFzeW5jIGltcG9ydChhc3NldDogQXNzZXQpIHtcbiAgICAgICAgICAgIC8vIOino+aekOaWh+Wtl+aWh+S7tlxuICAgICAgICAgICAgY29uc3QgZm50RGF0YSA9IGF3YWl0IHJlYWRGaWxlKGFzc2V0LnNvdXJjZSwgJ3V0ZjgnKTtcbiAgICAgICAgICAgIGxldCBmbnRDb25maWc7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGZudENvbmZpZyA9IGZudFBhcnNlci5wYXJzZUZudChmbnREYXRhKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBCaXRtYXBGb250IGltcG9ydCBmYWlsZWQ6ICR7YXNzZXQudXVpZH0gZmlsZSBwYXJzaW5nIGZhaWxlZGApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDnvJPlrZggZm50IOmFjee9rlxuICAgICAgICAgICAgYXNzZXQudXNlckRhdGEuX2ZudENvbmZpZyA9IGZudENvbmZpZztcblxuICAgICAgICAgICAgLy8g5aaC5p6c5paH5a2X5bC65a+45LiN5a2Y5Zyo55qE6K+d77yM5LiN6ZyA6KaB5a+85YWlXG4gICAgICAgICAgICBpZiAoIWZudENvbmZpZy5mb250U2l6ZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEJpdG1hcEZvbnQgaW1wb3J0IGZhaWxlZDogJHthc3NldC51dWlkfSBmaWxlIHBhcnNpbmcgZmFpbGVkLCBUaGVyZSBpcyBubyAnZm9udFNpemUnIGluIHRoZSBjb25maWd1cmF0aW9uLmApO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYXNzZXQudXNlckRhdGEuZm9udFNpemUgPSBmbnRDb25maWcuZm9udFNpemU7XG5cbiAgICAgICAgICAgIC8vIOagh+iusOS+nei1lui1hOa6kFxuICAgICAgICAgICAgY29uc3QgdGV4dHVyZVBhdGggPSBnZXRSZWFsRm50VGV4dHVyZVBhdGgoZm50Q29uZmlnLmF0bGFzTmFtZSBhcyBzdHJpbmcsIGFzc2V0KTtcbiAgICAgICAgICAgIGFzc2V0LmRlcGVuZCh0ZXh0dXJlUGF0aCk7XG4gICAgICAgICAgICBjb25zdCB0ZXh0dXJlVXVpZCA9IGFzc2V0Ll9hc3NldERCLnBhdGhUb1V1aWQodGV4dHVyZVBhdGgpO1xuICAgICAgICAgICAgaWYgKCF0ZXh0dXJlVXVpZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g5oyC6L29IHRleHR1cmVVdWlkXG4gICAgICAgICAgICBhc3NldC51c2VyRGF0YS50ZXh0dXJlVXVpZCA9IHRleHR1cmVVdWlkO1xuXG4gICAgICAgICAgICAvLyDlpoLmnpzkvp3otZbnmoTotYTmupDlt7Lnu4/lr7zlhaXlrozmiJDkuobvvIzliJnnlJ/miJDlr7nlupTnmoTmlbDmja7vvIzlubbkuJRcbiAgICAgICAgICAgIGlmIChhc3NldC51c2VyRGF0YS50ZXh0dXJlVXVpZCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRleHR1cmVBc3NldCA9IHF1ZXJ5QXNzZXQoYXNzZXQudXNlckRhdGEudGV4dHVyZVV1aWQpO1xuXG4gICAgICAgICAgICAgICAgaWYgKCF0ZXh0dXJlQXNzZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNoYW5nZUltYWdlRGVmYXVsdFR5cGUodGV4dHVyZUFzc2V0LCAnc3ByaXRlLWZyYW1lJyk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBiaXRtYXAgPSBjcmVhdGVCaXRtYXBGbnQoYXNzZXQpO1xuXG4gICAgICAgICAgICAgICAgYml0bWFwLnNwcml0ZUZyYW1lID0gRWRpdG9yRXh0ZW5kcy5zZXJpYWxpemUuYXNBc3NldCh0ZXh0dXJlQXNzZXQudXVpZCArICdAZjk5NDEnLCBTcHJpdGVGcmFtZSk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBzZXJpYWxpemVKU09OID0gRWRpdG9yRXh0ZW5kcy5zZXJpYWxpemUoYml0bWFwKTtcbiAgICAgICAgICAgICAgICBhd2FpdCBhc3NldC5zYXZlVG9MaWJyYXJ5KCcuanNvbicsIHNlcmlhbGl6ZUpTT04pO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgZGVwZW5kcyA9IGdldERlcGVuZFVVSURMaXN0KHNlcmlhbGl6ZUpTT04pO1xuICAgICAgICAgICAgICAgIGFzc2V0LnNldERhdGEoJ2RlcGVuZHMnLCBkZXBlbmRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LFxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDliKTmlq3mmK/lkKblhYHorrjkvb/nlKjlvZPliY3nmoQgSGFuZGxlciDov5vooYzlr7zlhaVcbiAgICAgKiBAcGFyYW0gYXNzZXRcbiAgICAgKi9cbiAgICBhc3luYyB2YWxpZGF0ZShhc3NldDogQXNzZXQpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcbn07XG5cbmV4cG9ydCBkZWZhdWx0IEJpdG1hcEhhbmRsZXI7XG5cbi8qKlxuICog5Yib5bu65LiA5LiqIEJpdG1hcCDlrp7kvovlr7nosaFcbiAqIEBwYXJhbSBhc3NldFxuICovXG5mdW5jdGlvbiBjcmVhdGVCaXRtYXBGbnQoYXNzZXQ6IEFzc2V0KSB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGNvbnN0IGJpdG1hcCA9IG5ldyBjYy5CaXRtYXBGb250KCk7XG4gICAgYml0bWFwLm5hbWUgPSBiYXNlbmFtZShhc3NldC5zb3VyY2UsIGFzc2V0LmV4dG5hbWUpO1xuICAgIC8vIDMuNSDlho3mlLlcbiAgICBiaXRtYXAubmFtZSA9IGFzc2V0LmJhc2VuYW1lIHx8ICcnO1xuXG4gICAgYml0bWFwLmZvbnRTaXplID0gYXNzZXQudXNlckRhdGEuZm9udFNpemU7XG4gICAgYml0bWFwLmZudENvbmZpZyA9IGFzc2V0LnVzZXJEYXRhLl9mbnRDb25maWc7XG5cbiAgICByZXR1cm4gYml0bWFwO1xufVxuIl19