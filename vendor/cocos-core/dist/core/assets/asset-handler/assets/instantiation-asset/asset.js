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
