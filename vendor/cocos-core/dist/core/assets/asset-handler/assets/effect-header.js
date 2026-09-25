"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EffectHeaderHandler = void 0;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const effect_compiler_1 = require("../../effect-compiler");
const engine_1 = require("../../../engine");
// 添加所有 builtin 头文件
const builtinChunkDir = (0, path_1.join)(engine_1.Engine.getInfo().typescript.path, './editor/assets/chunks');
const builtinChunks = (() => {
    const arr = [];
    function step(dir) {
        const names = (0, fs_extra_1.readdirSync)(dir);
        names.forEach((name) => {
            const file = (0, path_1.join)(dir, name);
            if (/\.chunk$/.test(name)) {
                arr.push(file);
            }
            else if ((0, fs_extra_1.statSync)(file).isDirectory()) {
                step(file);
            }
        });
    }
    step(builtinChunkDir);
    return arr;
})();
for (let i = 0; i < builtinChunks.length; ++i) {
    const name = (0, path_1.basename)(builtinChunks[i], '.chunk');
    const content = (0, fs_extra_1.readFileSync)(builtinChunks[i], { encoding: 'utf8' });
    (0, effect_compiler_1.addChunk)(name, content);
}
exports.EffectHeaderHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: 'effect-header',
    // 引擎内对应的类型
    assetType: 'cce.EffectHeader',
    createInfo: {
        generateMenuInfo() {
            return [
                {
                    label: 'i18n:ENGINE.assets.newChunk',
                    fullFileName: 'chunk.chunk',
                    template: `db://internal/default_file_content/${exports.EffectHeaderHandler.name}/chunk`,
                    name: 'default',
                },
            ];
        },
    },
    importer: {
        // 版本号如果变更，则会强制重新导入
        version: '1.0.7',
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
                const target = asset._assetDB.options.target;
                const path = (0, path_1.relative)((0, path_1.join)(target, 'chunks'), (0, path_1.dirname)(asset.source)).replace(/\\/g, '/');
                const name = path + (path.length ? '/' : '') + (0, path_1.basename)(asset.source, (0, path_1.extname)(asset.source));
                const content = (0, fs_extra_1.readFileSync)(asset.source, { encoding: 'utf-8' });
                (0, effect_compiler_1.addChunk)(name, content);
                return true;
            }
            catch (err) {
                console.error(err);
                return false;
            }
        },
    },
};
exports.default = exports.EffectHeaderHandler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWZmZWN0LWhlYWRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9jb3JlL2Fzc2V0cy9hc3NldC1oYW5kbGVyL2Fzc2V0cy9lZmZlY3QtaGVhZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUVBLHVDQUErRDtBQUMvRCwrQkFBa0U7QUFDbEUsMkRBQWlEO0FBQ2pELDRDQUF5QztBQUV6QyxtQkFBbUI7QUFDbkIsTUFBTSxlQUFlLEdBQUcsSUFBQSxXQUFJLEVBQUMsZUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsd0JBQXdCLENBQUMsQ0FBQztBQUN6RixNQUFNLGFBQWEsR0FBRyxDQUFDLEdBQUcsRUFBRTtJQUN4QixNQUFNLEdBQUcsR0FBYSxFQUFFLENBQUM7SUFDekIsU0FBUyxJQUFJLENBQUMsR0FBVztRQUNyQixNQUFNLEtBQUssR0FBRyxJQUFBLHNCQUFXLEVBQUMsR0FBRyxDQUFDLENBQUM7UUFDL0IsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFO1lBQ25CLE1BQU0sSUFBSSxHQUFHLElBQUEsV0FBSSxFQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUM3QixJQUFJLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDeEIsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNuQixDQUFDO2lCQUFNLElBQUksSUFBQSxtQkFBUSxFQUFDLElBQUksQ0FBQyxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUM7Z0JBQ3RDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNmLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFDRCxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7SUFDdEIsT0FBTyxHQUFHLENBQUM7QUFDZixDQUFDLENBQUMsRUFBRSxDQUFDO0FBRUwsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGFBQWEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQztJQUM1QyxNQUFNLElBQUksR0FBRyxJQUFBLGVBQVEsRUFBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDbEQsTUFBTSxPQUFPLEdBQUcsSUFBQSx1QkFBWSxFQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO0lBQ3JFLElBQUEsMEJBQVEsRUFBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDNUIsQ0FBQztBQUVZLFFBQUEsbUJBQW1CLEdBQWlCO0lBQzdDLGdDQUFnQztJQUNoQyxJQUFJLEVBQUUsZUFBZTtJQUNyQixXQUFXO0lBQ1gsU0FBUyxFQUFFLGtCQUFrQjtJQUM3QixVQUFVLEVBQUU7UUFDUixnQkFBZ0I7WUFDWixPQUFPO2dCQUNIO29CQUNJLEtBQUssRUFBRSw2QkFBNkI7b0JBQ3BDLFlBQVksRUFBRSxhQUFhO29CQUMzQixRQUFRLEVBQUUsc0NBQXNDLDJCQUFtQixDQUFDLElBQUksUUFBUTtvQkFDaEYsSUFBSSxFQUFFLFNBQVM7aUJBQ2xCO2FBQ0osQ0FBQztRQUNOLENBQUM7S0FDSjtJQUVELFFBQVEsRUFBRTtRQUNOLG1CQUFtQjtRQUNuQixPQUFPLEVBQUUsT0FBTztRQUVoQjs7Ozs7Ozs7V0FRRztRQUNILEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBWTtZQUNyQixJQUFJLENBQUM7Z0JBQ0QsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDO2dCQUM3QyxNQUFNLElBQUksR0FBRyxJQUFBLGVBQVEsRUFBQyxJQUFBLFdBQUksRUFBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLEVBQUUsSUFBQSxjQUFPLEVBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDekYsTUFBTSxJQUFJLEdBQUcsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFBLGVBQVEsRUFBQyxLQUFLLENBQUMsTUFBTSxFQUFFLElBQUEsY0FBTyxFQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUU3RixNQUFNLE9BQU8sR0FBRyxJQUFBLHVCQUFZLEVBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO2dCQUNsRSxJQUFBLDBCQUFRLEVBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUV4QixPQUFPLElBQUksQ0FBQztZQUNoQixDQUFDO1lBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztnQkFDWCxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNuQixPQUFPLEtBQUssQ0FBQztZQUNqQixDQUFDO1FBQ0wsQ0FBQztLQUNKO0NBQ0osQ0FBQztBQUVGLGtCQUFlLDJCQUFtQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXNzZXQgfSBmcm9tICdAY29jb3MvYXNzZXQtZGInO1xuaW1wb3J0IHsgQXNzZXRIYW5kbGVyIH0gZnJvbSAnLi4vLi4vQHR5cGVzL3Byb3RlY3RlZCc7XG5pbXBvcnQgeyByZWFkRmlsZVN5bmMsIHJlYWRkaXJTeW5jLCBzdGF0U3luYyB9IGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCB7IGJhc2VuYW1lLCBkaXJuYW1lLCBleHRuYW1lLCBqb2luLCByZWxhdGl2ZSB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgYWRkQ2h1bmsgfSBmcm9tICcuLi8uLi9lZmZlY3QtY29tcGlsZXInO1xuaW1wb3J0IHsgRW5naW5lIH0gZnJvbSAnLi4vLi4vLi4vZW5naW5lJztcblxuLy8g5re75Yqg5omA5pyJIGJ1aWx0aW4g5aS05paH5Lu2XG5jb25zdCBidWlsdGluQ2h1bmtEaXIgPSBqb2luKEVuZ2luZS5nZXRJbmZvKCkudHlwZXNjcmlwdC5wYXRoLCAnLi9lZGl0b3IvYXNzZXRzL2NodW5rcycpO1xuY29uc3QgYnVpbHRpbkNodW5rcyA9ICgoKSA9PiB7XG4gICAgY29uc3QgYXJyOiBzdHJpbmdbXSA9IFtdO1xuICAgIGZ1bmN0aW9uIHN0ZXAoZGlyOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgbmFtZXMgPSByZWFkZGlyU3luYyhkaXIpO1xuICAgICAgICBuYW1lcy5mb3JFYWNoKChuYW1lKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBmaWxlID0gam9pbihkaXIsIG5hbWUpO1xuICAgICAgICAgICAgaWYgKC9cXC5jaHVuayQvLnRlc3QobmFtZSkpIHtcbiAgICAgICAgICAgICAgICBhcnIucHVzaChmaWxlKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc3RhdFN5bmMoZmlsZSkuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgICAgICAgIHN0ZXAoZmlsZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBzdGVwKGJ1aWx0aW5DaHVua0Rpcik7XG4gICAgcmV0dXJuIGFycjtcbn0pKCk7XG5cbmZvciAobGV0IGkgPSAwOyBpIDwgYnVpbHRpbkNodW5rcy5sZW5ndGg7ICsraSkge1xuICAgIGNvbnN0IG5hbWUgPSBiYXNlbmFtZShidWlsdGluQ2h1bmtzW2ldLCAnLmNodW5rJyk7XG4gICAgY29uc3QgY29udGVudCA9IHJlYWRGaWxlU3luYyhidWlsdGluQ2h1bmtzW2ldLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XG4gICAgYWRkQ2h1bmsobmFtZSwgY29udGVudCk7XG59XG5cbmV4cG9ydCBjb25zdCBFZmZlY3RIZWFkZXJIYW5kbGVyOiBBc3NldEhhbmRsZXIgPSB7XG4gICAgLy8gSGFuZGxlciDnmoTlkI3lrZfvvIznlKjkuo7mjIflrpogSGFuZGxlciBhcyDnrYlcbiAgICBuYW1lOiAnZWZmZWN0LWhlYWRlcicsXG4gICAgLy8g5byV5pOO5YaF5a+55bqU55qE57G75Z6LXG4gICAgYXNzZXRUeXBlOiAnY2NlLkVmZmVjdEhlYWRlcicsXG4gICAgY3JlYXRlSW5mbzoge1xuICAgICAgICBnZW5lcmF0ZU1lbnVJbmZvKCkge1xuICAgICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnaTE4bjpFTkdJTkUuYXNzZXRzLm5ld0NodW5rJyxcbiAgICAgICAgICAgICAgICAgICAgZnVsbEZpbGVOYW1lOiAnY2h1bmsuY2h1bmsnLFxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogYGRiOi8vaW50ZXJuYWwvZGVmYXVsdF9maWxlX2NvbnRlbnQvJHtFZmZlY3RIZWFkZXJIYW5kbGVyLm5hbWV9L2NodW5rYCxcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogJ2RlZmF1bHQnLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdO1xuICAgICAgICB9LFxuICAgIH0sXG5cbiAgICBpbXBvcnRlcjoge1xuICAgICAgICAvLyDniYjmnKzlj7flpoLmnpzlj5jmm7TvvIzliJnkvJrlvLrliLbph43mlrDlr7zlhaVcbiAgICAgICAgdmVyc2lvbjogJzEuMC43JyxcblxuICAgICAgICAvKipcbiAgICAgICAgICog5a6e6ZmF5a+85YWl5rWB56iLXG4gICAgICAgICAqIOmcgOimgeiHquW3seaOp+WItuaYr+WQpueUn+aIkOOAgeaLt+i0neaWh+S7tlxuICAgICAgICAgKlxuICAgICAgICAgKiDov5Tlm57mmK/lkKblr7zlhaXmiJDlip/nmoTmoIforrBcbiAgICAgICAgICog5aaC5p6c6L+U5ZueIGZhbHNl77yM5YiZIGltcG9ydGVkIOagh+iusOS4jeS8muWPmOaIkCB0cnVlXG4gICAgICAgICAqIOWQjue7reeahOS4gOezu+WIl+aTjeS9nOmDveS4jeS8muaJp+ihjFxuICAgICAgICAgKiBAcGFyYW0gYXNzZXRcbiAgICAgICAgICovXG4gICAgICAgIGFzeW5jIGltcG9ydChhc3NldDogQXNzZXQpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0ID0gYXNzZXQuX2Fzc2V0REIub3B0aW9ucy50YXJnZXQ7XG4gICAgICAgICAgICAgICAgY29uc3QgcGF0aCA9IHJlbGF0aXZlKGpvaW4odGFyZ2V0LCAnY2h1bmtzJyksIGRpcm5hbWUoYXNzZXQuc291cmNlKSkucmVwbGFjZSgvXFxcXC9nLCAnLycpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBwYXRoICsgKHBhdGgubGVuZ3RoID8gJy8nIDogJycpICsgYmFzZW5hbWUoYXNzZXQuc291cmNlLCBleHRuYW1lKGFzc2V0LnNvdXJjZSkpO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgY29udGVudCA9IHJlYWRGaWxlU3luYyhhc3NldC5zb3VyY2UsIHsgZW5jb2Rpbmc6ICd1dGYtOCcgfSk7XG4gICAgICAgICAgICAgICAgYWRkQ2h1bmsobmFtZSwgY29udGVudCk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgfSxcbn07XG5cbmV4cG9ydCBkZWZhdWx0IEVmZmVjdEhlYWRlckhhbmRsZXI7XG4iXX0=