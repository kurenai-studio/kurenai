'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstantiationAssetHandler = void 0;
exports.zip = zip;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const utils_1 = __importDefault(require("../../../../base/utils"));
const global_1 = require("../../../../../global");
exports.InstantiationAssetHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: 'instantiation-asset',
    // 引擎内对应的类型
    assetType: 'cc.Asset',
    importer: {
        // 版本号如果变更，则会强制重新导入
        version: '1.0.0',
        /**
         * 实际导入流程
         * 需要自己控制是否生成、拷贝文件
         * @param asset
         */
        async import(asset) {
            const temp = (0, path_1.join)(asset._assetDB.options.temp, asset.uuid);
            const uzipTool = process.platform === 'darwin' ? 'unzip' : (0, path_1.join)(global_1.GlobalPaths.staticDir, 'tools/unzip.exe');
            await utils_1.default.Process.quickSpawn(uzipTool, [asset.source, '-d', temp]);
            const list = (0, fs_extra_1.readdirSync)(temp);
            for (let i = 0; i < list.length; i++) {
                const name = list[i];
                const file = (0, path_1.join)(temp, name);
                await asset.copyToLibrary('.' + name, file);
            }
            if ((0, fs_extra_1.existsSync)(temp)) {
                (0, fs_extra_1.removeSync)(temp);
            }
            return true;
        },
    },
};
exports.default = exports.InstantiationAssetHandler;
/**
 * 创建指定的实例化资源
 * @param target 生成到哪个位置
 * @param files 打包的文件数组
 */
function zip(target, files) {
    const archiver = require('archiver');
    const output = (0, fs_extra_1.createWriteStream)(target);
    const archive = archiver('zip');
    archive.on('error', (error) => {
        throw error;
    });
    archive.pipe(output);
    files.forEach((file) => {
        const nameItem = (0, path_1.parse)(file);
        archive.append((0, fs_extra_1.createReadStream)(file), { name: nameItem.ext.substr(1) });
    });
    archive.finalize();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzZXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9hc3NldHMvYXNzZXQtaGFuZGxlci9hc3NldHMvaW5zdGFudGlhdGlvbi1hc3NldC9hc3NldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7Ozs7OztBQXVEYixrQkFpQkM7QUFwRUQsdUNBQW1IO0FBQ25ILCtCQUE0QztBQUM1QyxtRUFBMkM7QUFDM0Msa0RBQW9EO0FBRXZDLFFBQUEseUJBQXlCLEdBQXFCO0lBQ3ZELGdDQUFnQztJQUNoQyxJQUFJLEVBQUUscUJBQXFCO0lBRTNCLFdBQVc7SUFDWCxTQUFTLEVBQUUsVUFBVTtJQUVyQixRQUFRLEVBQUU7UUFDTixtQkFBbUI7UUFDbkIsT0FBTyxFQUFFLE9BQU87UUFDaEI7Ozs7V0FJRztRQUNILEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBWTtZQUNyQixNQUFNLElBQUksR0FBRyxJQUFBLFdBQUksRUFBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRTNELE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxRQUFRLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUEsV0FBSSxFQUFDLG9CQUFXLENBQUMsU0FBUyxFQUFFLGlCQUFpQixDQUFDLENBQUM7WUFFMUcsTUFBTSxlQUFLLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBRXJFLE1BQU0sSUFBSSxHQUFHLElBQUEsc0JBQVcsRUFBQyxJQUFJLENBQUMsQ0FBQztZQUUvQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNuQyxNQUFNLElBQUksR0FBVyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzdCLE1BQU0sSUFBSSxHQUFHLElBQUEsV0FBSSxFQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDOUIsTUFBTSxLQUFLLENBQUMsYUFBYSxDQUFDLEdBQUcsR0FBRyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDaEQsQ0FBQztZQUVELElBQUksSUFBQSxxQkFBVSxFQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQ25CLElBQUEscUJBQVUsRUFBQyxJQUFJLENBQUMsQ0FBQztZQUNyQixDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUM7UUFDaEIsQ0FBQztLQUNKO0NBQ0osQ0FBQztBQUVGLGtCQUFlLGlDQUF5QixDQUFDO0FBRXpDOzs7O0dBSUc7QUFDSCxTQUFnQixHQUFHLENBQUMsTUFBYyxFQUFFLEtBQWU7SUFDL0MsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQ3JDLE1BQU0sTUFBTSxHQUFHLElBQUEsNEJBQWlCLEVBQUMsTUFBTSxDQUFDLENBQUM7SUFDekMsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBRWhDLE9BQU8sQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUMsS0FBWSxFQUFFLEVBQUU7UUFDakMsTUFBTSxLQUFLLENBQUM7SUFDaEIsQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBRXJCLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFZLEVBQUUsRUFBRTtRQUMzQixNQUFNLFFBQVEsR0FBRyxJQUFBLFlBQUssRUFBQyxJQUFJLENBQUMsQ0FBQztRQUM3QixPQUFPLENBQUMsTUFBTSxDQUFDLElBQUEsMkJBQWdCLEVBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQzdFLENBQUMsQ0FBQyxDQUFDO0lBRUgsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQ3ZCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7IEFzc2V0IH0gZnJvbSAnQGNvY29zL2Fzc2V0LWRiJztcbmltcG9ydCB7IEFzc2V0SGFuZGxlckJhc2UgfSBmcm9tICcuLi8uLi8uLi9AdHlwZXMvcHJvdGVjdGVkJztcbmltcG9ydCB7IGNyZWF0ZVJlYWRTdHJlYW0sIGNyZWF0ZVdyaXRlU3RyZWFtLCBlbnN1cmVEaXJTeW5jLCBleGlzdHNTeW5jLCByZWFkZGlyU3luYywgcmVtb3ZlU3luYyB9IGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCB7IGRpcm5hbWUsIGpvaW4sIHBhcnNlIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgdXRpbHMgZnJvbSAnLi4vLi4vLi4vLi4vYmFzZS91dGlscyc7XG5pbXBvcnQgeyBHbG9iYWxQYXRocyB9IGZyb20gJy4uLy4uLy4uLy4uLy4uL2dsb2JhbCc7XG5cbmV4cG9ydCBjb25zdCBJbnN0YW50aWF0aW9uQXNzZXRIYW5kbGVyOiBBc3NldEhhbmRsZXJCYXNlID0ge1xuICAgIC8vIEhhbmRsZXIg55qE5ZCN5a2X77yM55So5LqO5oyH5a6aIEhhbmRsZXIgYXMg562JXG4gICAgbmFtZTogJ2luc3RhbnRpYXRpb24tYXNzZXQnLFxuXG4gICAgLy8g5byV5pOO5YaF5a+55bqU55qE57G75Z6LXG4gICAgYXNzZXRUeXBlOiAnY2MuQXNzZXQnLFxuXG4gICAgaW1wb3J0ZXI6IHtcbiAgICAgICAgLy8g54mI5pys5Y+35aaC5p6c5Y+Y5pu077yM5YiZ5Lya5by65Yi26YeN5paw5a+85YWlXG4gICAgICAgIHZlcnNpb246ICcxLjAuMCcsXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDlrp7pmYXlr7zlhaXmtYHnqItcbiAgICAgICAgICog6ZyA6KaB6Ieq5bex5o6n5Yi25piv5ZCm55Sf5oiQ44CB5ou36LSd5paH5Lu2XG4gICAgICAgICAqIEBwYXJhbSBhc3NldFxuICAgICAgICAgKi9cbiAgICAgICAgYXN5bmMgaW1wb3J0KGFzc2V0OiBBc3NldCkge1xuICAgICAgICAgICAgY29uc3QgdGVtcCA9IGpvaW4oYXNzZXQuX2Fzc2V0REIub3B0aW9ucy50ZW1wLCBhc3NldC51dWlkKTtcblxuICAgICAgICAgICAgY29uc3QgdXppcFRvb2wgPSBwcm9jZXNzLnBsYXRmb3JtID09PSAnZGFyd2luJyA/ICd1bnppcCcgOiBqb2luKEdsb2JhbFBhdGhzLnN0YXRpY0RpciwgJ3Rvb2xzL3VuemlwLmV4ZScpO1xuXG4gICAgICAgICAgICBhd2FpdCB1dGlscy5Qcm9jZXNzLnF1aWNrU3Bhd24odXppcFRvb2wsIFthc3NldC5zb3VyY2UsICctZCcsIHRlbXBdKTtcblxuICAgICAgICAgICAgY29uc3QgbGlzdCA9IHJlYWRkaXJTeW5jKHRlbXApO1xuXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCBuYW1lOiBzdHJpbmcgPSBsaXN0W2ldO1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpbGUgPSBqb2luKHRlbXAsIG5hbWUpO1xuICAgICAgICAgICAgICAgIGF3YWl0IGFzc2V0LmNvcHlUb0xpYnJhcnkoJy4nICsgbmFtZSwgZmlsZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChleGlzdHNTeW5jKHRlbXApKSB7XG4gICAgICAgICAgICAgICAgcmVtb3ZlU3luYyh0ZW1wKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sXG4gICAgfSxcbn07XG5cbmV4cG9ydCBkZWZhdWx0IEluc3RhbnRpYXRpb25Bc3NldEhhbmRsZXI7XG5cbi8qKlxuICog5Yib5bu65oyH5a6a55qE5a6e5L6L5YyW6LWE5rqQXG4gKiBAcGFyYW0gdGFyZ2V0IOeUn+aIkOWIsOWTquS4quS9jee9rlxuICogQHBhcmFtIGZpbGVzIOaJk+WMheeahOaWh+S7tuaVsOe7hFxuICovXG5leHBvcnQgZnVuY3Rpb24gemlwKHRhcmdldDogc3RyaW5nLCBmaWxlczogc3RyaW5nW10pIHtcbiAgICBjb25zdCBhcmNoaXZlciA9IHJlcXVpcmUoJ2FyY2hpdmVyJyk7XG4gICAgY29uc3Qgb3V0cHV0ID0gY3JlYXRlV3JpdGVTdHJlYW0odGFyZ2V0KTtcbiAgICBjb25zdCBhcmNoaXZlID0gYXJjaGl2ZXIoJ3ppcCcpO1xuXG4gICAgYXJjaGl2ZS5vbignZXJyb3InLCAoZXJyb3I6IEVycm9yKSA9PiB7XG4gICAgICAgIHRocm93IGVycm9yO1xuICAgIH0pO1xuXG4gICAgYXJjaGl2ZS5waXBlKG91dHB1dCk7XG5cbiAgICBmaWxlcy5mb3JFYWNoKChmaWxlOiBzdHJpbmcpID0+IHtcbiAgICAgICAgY29uc3QgbmFtZUl0ZW0gPSBwYXJzZShmaWxlKTtcbiAgICAgICAgYXJjaGl2ZS5hcHBlbmQoY3JlYXRlUmVhZFN0cmVhbShmaWxlKSwgeyBuYW1lOiBuYW1lSXRlbS5leHQuc3Vic3RyKDEpIH0pO1xuICAgIH0pO1xuXG4gICAgYXJjaGl2ZS5maW5hbGl6ZSgpO1xufVxuIl19