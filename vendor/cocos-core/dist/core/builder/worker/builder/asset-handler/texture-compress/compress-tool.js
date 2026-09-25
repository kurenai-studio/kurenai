"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compressJpgAndPng = compressJpgAndPng;
exports.compressWebp = compressWebp;
exports.compressPVR = compressPVR;
exports.compressEtc = compressEtc;
exports.compressAstc = compressAstc;
exports.getCompressFunc = getCompressFunc;
exports.compressCustomFormat = compressCustomFormat;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const Path = __importStar(require("path"));
const utils_1 = require("./utils");
const utils_2 = require("../../utils");
const i18n_1 = __importDefault(require("../../../../../base/i18n"));
const global_1 = require("../../../../../../global");
const utils_3 = __importDefault(require("../../../../../base/utils"));
const builder_config_1 = __importDefault(require("../../../../share/builder-config"));
const Sharp = require('sharp');
/**
 * 压缩 jpg png
 * @param {string} option 参数
 * @param {object} format 图片格式类型以及对应质量
 */
async function compressJpgAndPng(option) {
    return new Promise((resolve, reject) => {
        let img = Sharp(option.src);
        if (option.format === 'png') {
            img = img.png({
                quality: option.compressOptions.quality || 100,
            });
        }
        else {
            img = img.jpeg({
                quality: option.compressOptions.quality || 100,
            });
        }
        // 工具可能不会自动生成输出目录文件夹
        (0, fs_extra_1.ensureDirSync)((0, path_1.dirname)(option.dest));
        img.toFile(option.dest)
            .then(() => {
            resolve();
        })
            .catch((err) => {
            reject(err);
        });
    });
}
/**
 * 压缩 webp 格式图片
 * @param {string} option
 * @param {object} format
 */
async function compressWebp(option) {
    const { src, dest, format, compressOptions } = option;
    // 工具可能不会自动生成输出目录文件夹
    (0, fs_extra_1.ensureDirSync)((0, path_1.dirname)(dest));
    console.debug('start compress webp', src, dest, format);
    let webpTool = Path.join(global_1.GlobalPaths.staticDir, 'tools/libwebp_darwin/bin/cwebp');
    if (process.platform === 'win32') {
        webpTool = Path.join(global_1.GlobalPaths.staticDir, 'tools/libwebp_win32/bin/cwebp.exe');
    }
    const args = [src, '-o', dest, '-q', String(compressOptions.quality), '-quiet', '-exact'];
    console.debug(`webp compress command : ${webpTool} ${args.join(' ')}`);
    await (0, utils_2.quickSpawn)(webpTool, args, {
        prefix: '[compress webp]',
    });
    console.log('compress webp success ' + `{link(${dest})}`);
}
/**
 * 压缩 pvr 类型图片
 * @param {*} option
 * @param {*} format
 */
async function compressPVR(option) {
    console.debug('start compress pvr', option);
    let src = option.src;
    if (option.format.endsWith('rgb_a')) {
        const tempDest = Path.join(builder_config_1.default.projectTempDir, 'builder', 'CompressTexture', 'pvr_alpha', option.uuid + Path.extname(src));
        await createAlphaAtlas(src, tempDest);
        src = tempDest;
    }
    const { dest, format, compressOptions } = option;
    // 工具可能不会自动生成输出目录文件夹
    (0, fs_extra_1.ensureDirSync)((0, path_1.dirname)(dest));
    // https://github.com/cocos/cocos-editor/pull/1046
    // PVR 升级的已知问题：ios 上似乎会出现渲染效果异常？？暂不确定
    // https://docs.imgtec.com/tools-manuals/pvrtextool-manual/html/topics/cli/command-line-options.html#encode-format-desc
    let pvrTool = Path.join(global_1.GlobalPaths.staticDir, 'tools/PVRTexTool_darwin/PVRTexToolCLI');
    if (process.platform === 'win32') {
        pvrTool = Path.join(global_1.GlobalPaths.staticDir, 'tools/PVRTexTool_win32/PVRTexToolCLI.exe');
    }
    const compressFormatMap = {
        pvrtc_4bits_rgba: 'PVRTC1_4',
        pvrtc_4bits_rgb: 'PVRTC1_4_RGB',
        pvrtc_4bits_rgb_a: 'PVRTC1_4_RGB',
        pvrtc_2bits_rgba: 'PVRTC1_2',
        pvrtc_2bits_rgb: 'PVRTC1_2_RGB',
        pvrtc_2bits_rgb_a: 'PVRTC1_2_RGB',
    };
    // 根据 option.format 转换格式
    const compressFormat = compressFormatMap[format];
    if (!compressFormat) {
        console.error(`Invalid pvr compress format ${format}`);
        return;
    }
    const quality = 'pvrtc' + compressOptions.quality;
    const pvrOpts = [
        '-i',
        src,
        '-o',
        dest,
        // xx 的扩张方式是采用拉伸的方式对图片进行重置的
        // '-square', '+',
        // '-pot', '+',
        // xxcanvas 的扩张方式是采用留白的方式对图片进行重置的
        // 因为 sprite frame 的 rect 也是按照像素来存储的，所以用留白的方式更友好
        '-squarecanvas',
        '+',
        '-potcanvas',
        '+',
        '-q',
        quality,
        '-f',
        `${compressFormat},UBN,lRGB`,
    ];
    console.debug(`pvrtc compress command :  ${pvrTool} ${pvrOpts.join(' ')}`);
    // 目前 pvrtc 生成图片会默认输出到 stderr 内，需要使用 debug 输出 stderr
    await (0, utils_2.quickSpawn)(pvrTool, pvrOpts, {
        downGradeWaring: true,
        downGradeLog: true,
        // 这个工具的默认输出都在 stderr 里
        ignoreError: true,
        downGradeError: true,
        prefix: '[compress pvrtc]',
    });
    if ((0, fs_extra_1.existsSync)(dest)) {
        console.log('compress pvrtc success ' + `{link(${dest})}`);
    }
    else {
        console.error(i18n_1.default.t('builder.error.texture_compress_failed', {
            type: format,
            asset: `{asset(${option.uuid})}`,
            toolsPath: `{file(${pvrTool})}`,
            toolHomePage: 'https://developer.imaginationtech.com/pvrtextool/',
        }));
    }
}
/**
 * 压缩 etc 类型图片
 * @param option
 * @param format
 */
async function compressEtc(option) {
    const { dest, format, compressOptions, uuid } = option;
    console.debug('start compress etc', option.src, dest, format);
    let src = option.src;
    // 工具可能不会自动生成输出目录文件夹
    (0, fs_extra_1.ensureDirSync)((0, path_1.dirname)(dest));
    if (format.endsWith('rgb_a')) {
        // 理论上同一资源的 alpha 贴图可以复用，且应该走 getAssetTempDirByUuid 使用缓存即可，但由于这个工具需要单独可以走测试例试，所以暂时先不走通用地址
        // 理论上 etc 和 pvr 的 alpha 贴图也可以复用，但由于可能存在并发的权限问题，暂不复用
        // NOTE: 注意，这里的图片名称必须和 dest 保持一致，因为此压缩工具压缩出来的结果无法改变图片名称
        const tempDest = Path.join(builder_config_1.default.projectTempDir, 'builder', 'CompressTexture', 'etc_alpha', uuid, Path.basename(dest, Path.extname(dest)) + Path.extname(src));
        await createAlphaAtlas(src, tempDest);
        src = tempDest;
    }
    let etcTool = Path.join(global_1.GlobalPaths.staticDir, 'tools/mali_darwin/etcpack');
    if (process.platform === 'win32') {
        etcTool = Path.join(global_1.GlobalPaths.staticDir, 'tools/mali_win32/etcpack.exe');
    }
    const toolDir = Path.dirname(etcTool);
    etcTool = '.' + Path.sep + Path.basename(etcTool);
    const compressFormatMap = {
        etc1_rgb: {
            etcFormat: 'etc1',
            compressFormat: 'RGB',
        },
        etc1_rgb_a: {
            etcFormat: 'etc1',
            compressFormat: 'RGB',
        },
        etc2_rgba: {
            etcFormat: 'etc2',
            compressFormat: 'RGBA',
        },
        etc2_rgb: {
            etcFormat: 'etc2',
            compressFormat: 'RGB',
        },
    };
    const { etcFormat, compressFormat } = compressFormatMap[format];
    const args = [Path.normalize(src), Path.dirname(dest), '-c', etcFormat, '-s', compressOptions.quality];
    // windows 中需要进入到 toolDir 去执行命令才能成功
    const cwd = toolDir;
    const env = Object.assign({}, process.env);
    // convert 是 imagemagick 中的一个工具
    // etcpack 中应该是以 'convert' 而不是 './convert' 来调用工具的，所以需要将 toolDir 加到环境变量中
    // toolDir 需要放在前面，以防止系统找到用户自己安装的 imagemagick 版本
    env.PATH = toolDir + ':' + env.PATH;
    const opts = {
        cwd: cwd,
        env: env,
        prefix: '[compress etc]',
    };
    if (etcFormat === 'etc2') {
        args.push('-f', compressFormat);
    }
    console.debug(`etc compress command :  ${etcTool} ${args.join(' ')}`);
    await (0, utils_2.quickSpawn)(etcTool, args, opts);
    if ((0, fs_extra_1.existsSync)(dest)) {
        console.log('compress etc success ' + `{link(${dest})}`);
    }
    else {
        console.error(i18n_1.default.t('builder.error.texture_compress_failed', {
            type: format,
            asset: `{asset(${uuid})}`,
            toolsPath: `{file(${etcTool})}`,
            toolHomePage: 'https://imagemagick.org/script/command-line-processing.php',
        }));
    }
}
/**
 * 压缩 astc 类型图片
 * @param format
 */
async function compressAstc(option) {
    const { src, dest, format, compressOptions } = option;
    console.debug('start compress astc', src, dest, format);
    // 工具可能不会自动生成输出目录文件夹
    (0, fs_extra_1.ensureDirSync)((0, path_1.dirname)(dest));
    // 参考：https://github.com/cocos-creator/3d-tasks/issues/6855
    // https://github.com/ARM-software/astc-encoder
    let astcTool = Path.join(global_1.GlobalPaths.staticDir, 'tools/astc-encoder/astcenc');
    if (process.platform === 'win32') {
        astcTool = Path.join(global_1.GlobalPaths.staticDir, 'tools/astc-encoder/astcenc.exe');
    }
    const compressFormatMap = {
        astc_4x4: '4x4',
        astc_5x5: '5x5',
        astc_6x6: '6x6',
        astc_8x8: '8x8',
        astc_10x5: '10x5',
        astc_10x10: '10x10',
        astc_12x12: '12x12',
    };
    const compressFormat = compressFormatMap[format];
    if (compressOptions.quality === 'veryfast') {
        compressOptions.quality = 'fastest';
    }
    const astcOpts = ['-cl', src, dest, compressFormat, `-${compressOptions.quality}`];
    console.debug(`astc compressed command: ${Path.basename(astcTool)} ${astcOpts.join(' ')}`);
    await (0, utils_2.quickSpawn)(astcTool, astcOpts, {
        prefix: '[compress astc]',
    });
    // 目前有遇到偶现的在机子上生成 astc 失败，但是没有错误输出的情况，需要做一次检查错误提示
    if ((0, fs_extra_1.existsSync)(dest)) {
        console.log('Compress astc success ' + `{link(${dest})}`);
    }
    else {
        console.error(i18n_1.default.t('builder.error.texture_compress_failed', {
            type: format,
            asset: `{asset(${option.uuid})}`,
            toolsPath: `{file(${astcTool})}`,
            toolHomePage: 'https://github.com/ARM-software/astc-encoder',
        }));
    }
}
/**
 * 根据图片类型获取压缩函数
 * @param format
 */
function getCompressFunc(format) {
    const start = format.slice(0, 3);
    switch (start) {
        case 'jpg':
        case 'png':
            return compressJpgAndPng;
        case 'pvr':
            return compressPVR;
        case 'etc':
            return compressEtc;
        case 'web':
            return compressWebp;
        case 'ast':
            return compressAstc;
    }
}
function patchCommand(command, options) {
    return new Function('options', 'with(options){ return String.raw`' + command + '`}')(options);
}
async function compressCustomFormat(config) {
    const { src, dest, compressOptions } = config;
    const { command, path } = config.customConfig;
    const rawPath = utils_3.default.Path.resolveToRaw(path);
    const toolDir = Path.dirname(rawPath);
    const opts = {
        cwd: toolDir,
        prefix: '[custom compress]',
    };
    const newCommand = patchCommand(command, {
        ...compressOptions,
        src,
        dest,
    });
    const params = newCommand.split(' ').filter((val) => !!val);
    console.debug(`custom compress command : ${rawPath} ${newCommand}`);
    await (0, utils_2.quickSpawn)(rawPath, params, opts);
}
// 为 pvr 创建一张 rgb atlas 贴图
// 贴图的上半部分存原图的 rgb 值，下半部存原图的 alpha 值
async function createAlphaAtlas(src, dest) {
    const image = new Sharp(src);
    const metaData = await image.metadata();
    const width = metaData.width;
    const height = metaData.height;
    // pvr 格式需要长宽为 2 的次幂，并且需要为正方形
    // 要正确计算出下半部分的起始值需要提前算好正方形 2 次幂的值
    const resizedWidth = (0, utils_1.roundToPowerOfTwo)(width);
    let resizedHeight = (0, utils_1.roundToPowerOfTwo)(height);
    if (resizedHeight < resizedWidth / 2) {
        resizedHeight = resizedWidth / 2;
    }
    const inputData = await image.raw().toBuffer();
    const channels = 3;
    const rgbPixel = 0x000000;
    const outputSize = width * 2 * resizedHeight * channels;
    const outputData = Buffer.alloc(outputSize, rgbPixel);
    let outputIndex;
    let outputAlphaIndex;
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            // 设置 rgb 值到上半部分
            const index = row * width + col;
            const inputIndex = index * 4;
            outputIndex = index * 3;
            outputData[outputIndex] = inputData[inputIndex];
            outputData[outputIndex + 1] = inputData[inputIndex + 1];
            outputData[outputIndex + 2] = inputData[inputIndex + 2];
            // 设置 alpha 值到下半部分
            outputAlphaIndex = ((row + resizedHeight) * width + col) * 3;
            const alpha = inputIndex + 3;
            outputData[outputAlphaIndex] = inputData[alpha];
            outputData[outputAlphaIndex + 1] = inputData[alpha];
            outputData[outputAlphaIndex + 2] = inputData[alpha];
        }
    }
    const opts = { raw: { width, height: resizedHeight * 2, channels } };
    (0, fs_extra_1.ensureDirSync)(Path.dirname(dest));
    await Sharp(outputData, opts).toFile(dest);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcHJlc3MtdG9vbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jb3JlL2J1aWxkZXIvd29ya2VyL2J1aWxkZXIvYXNzZXQtaGFuZGxlci90ZXh0dXJlLWNvbXByZXNzL2NvbXByZXNzLXRvb2wudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFpQkEsOENBc0JDO0FBT0Qsb0NBZUM7QUFPRCxrQ0FnRkM7QUFPRCxrQ0E2RUM7QUFNRCxvQ0ErQ0M7QUFNRCwwQ0FlQztBQU1ELG9EQWtCQztBQTFVRCx1Q0FBcUQ7QUFDckQsK0JBQStCO0FBQy9CLDJDQUE2QjtBQUM3QixtQ0FBNEM7QUFDNUMsdUNBQXlDO0FBQ3pDLG9FQUE0QztBQUU1QyxxREFBdUQ7QUFDdkQsc0VBQThDO0FBQzlDLHNGQUE2RDtBQUM3RCxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7QUFFL0I7Ozs7R0FJRztBQUNJLEtBQUssVUFBVSxpQkFBaUIsQ0FBQyxNQUF1QjtJQUMzRCxPQUFPLElBQUksT0FBTyxDQUFPLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1FBQ3pDLElBQUksR0FBRyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDNUIsSUFBSSxNQUFNLENBQUMsTUFBTSxLQUFLLEtBQUssRUFBRSxDQUFDO1lBQzFCLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDO2dCQUNWLE9BQU8sRUFBRSxNQUFNLENBQUMsZUFBZSxDQUFDLE9BQU8sSUFBSSxHQUFHO2FBQ2pELENBQUMsQ0FBQztRQUNQLENBQUM7YUFBTSxDQUFDO1lBQ0osR0FBRyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUM7Z0JBQ1gsT0FBTyxFQUFFLE1BQU0sQ0FBQyxlQUFlLENBQUMsT0FBTyxJQUFJLEdBQUc7YUFDakQsQ0FB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LENBQUMsQ0FBQztRQUN4RCxDQUFDO0lBQ0wsQ0FBQztJQUNELE1BQU0sSUFBSSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxhQUFhLEdBQUcsQ0FBQyxFQUFFLFFBQVEsRUFBRSxFQUFFLENBQUM7SUFDckUsSUFBQSx3QkFBYSxFQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUNsQyxNQUFNLEtBQUssQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQy9DLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBleGlzdHNTeW5jLCBlbnN1cmVEaXJTeW5jIH0gZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0IHsgZGlybmFtZSB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgUGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IHJvdW5kVG9Qb3dlck9mVHdvIH0gZnJvbSAnLi91dGlscyc7XG5pbXBvcnQgeyBxdWlja1NwYXduIH0gZnJvbSAnLi4vLi4vdXRpbHMnO1xuaW1wb3J0IGkxOG4gZnJvbSAnLi4vLi4vLi4vLi4vLi4vYmFzZS9pMThuJztcbmltcG9ydCB7IElDb21wcmVzc0NvbmZpZywgSVRleHR1cmVDb21wcmVzc1R5cGUgfSBmcm9tICcuLi8uLi8uLi8uLi9AdHlwZXMnO1xuaW1wb3J0IHsgR2xvYmFsUGF0aHMgfSBmcm9tICcuLi8uLi8uLi8uLi8uLi8uLi9nbG9iYWwnO1xuaW1wb3J0IHV0aWxzIGZyb20gJy4uLy4uLy4uLy4uLy4uL2Jhc2UvdXRpbHMnO1xuaW1wb3J0IGJ1aWxkZXJDb25maWcgZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmUvYnVpbGRlci1jb25maWcnO1xuY29uc3QgU2hhcnAgPSByZXF1aXJlKCdzaGFycCcpO1xuXG4vKipcbiAqIOWOi+e8qSBqcGcgcG5nXG4gKiBAcGFyYW0ge3N0cmluZ30gb3B0aW9uIOWPguaVsFxuICogQHBhcmFtIHtvYmplY3R9IGZvcm1hdCDlm77niYfmoLzlvI/nsbvlnovku6Xlj4rlr7nlupTotKjph49cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNvbXByZXNzSnBnQW5kUG5nKG9wdGlvbjogSUNvbXByZXNzQ29uZmlnKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgbGV0IGltZyA9IFNoYXJwKG9wdGlvbi5zcmMpO1xuICAgICAgICBpZiAob3B0aW9uLmZvcm1hdCA9PT0gJ3BuZycpIHtcbiAgICAgICAgICAgIGltZyA9IGltZy5wbmcoe1xuICAgICAgICAgICAgICAgIHF1YWxpdHk6IG9wdGlvbi5jb21wcmVzc09wdGlvbnMucXVhbGl0eSB8fCAxMDAsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGltZyA9IGltZy5qcGVnKHtcbiAgICAgICAgICAgICAgICBxdWFsaXR5OiBvcHRpb24uY29tcHJlc3NPcHRpb25zLnF1YWxpdHkgfHwgMTAwLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8g5bel5YW35Y+v6IO95LiN5Lya6Ieq5Yqo55Sf5oiQ6L6T5Ye655uu5b2V5paH5Lu25aS5XG4gICAgICAgIGVuc3VyZURpclN5bmMoZGlybmFtZShvcHRpb24uZGVzdCkpO1xuICAgICAgICBpbWcudG9GaWxlKG9wdGlvbi5kZXN0KVxuICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG4vKipcbiAqIOWOi+e8qSB3ZWJwIOagvOW8j+WbvueJh1xuICogQHBhcmFtIHtzdHJpbmd9IG9wdGlvblxuICogQHBhcmFtIHtvYmplY3R9IGZvcm1hdFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29tcHJlc3NXZWJwKG9wdGlvbjogSUNvbXByZXNzQ29uZmlnKSB7XG4gICAgY29uc3QgeyBzcmMsIGRlc3QsIGZvcm1hdCwgY29tcHJlc3NPcHRpb25zIH0gPSBvcHRpb247XG4gICAgLy8g5bel5YW35Y+v6IO95LiN5Lya6Ieq5Yqo55Sf5oiQ6L6T5Ye655uu5b2V5paH5Lu25aS5XG4gICAgZW5zdXJlRGlyU3luYyhkaXJuYW1lKGRlc3QpKTtcbiAgICBjb25zb2xlLmRlYnVnKCdzdGFydCBjb21wcmVzcyB3ZWJwJywgc3JjLCBkZXN0LCBmb3JtYXQpO1xuICAgIGxldCB3ZWJwVG9vbCA9IFBhdGguam9pbihHbG9iYWxQYXRocy5zdGF0aWNEaXIsICd0b29scy9saWJ3ZWJwX2Rhcndpbi9iaW4vY3dlYnAnKTtcbiAgICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ3dpbjMyJykge1xuICAgICAgICB3ZWJwVG9vbCA9IFBhdGguam9pbihHbG9iYWxQYXRocy5zdGF0aWNEaXIsICd0b29scy9saWJ3ZWJwX3dpbjMyL2Jpbi9jd2VicC5leGUnKTtcbiAgICB9XG4gICAgY29uc3QgYXJncyA9IFtzcmMsICctbycsIGRlc3QsICctcScsIFN0cmluZyhjb21wcmVzc09wdGlvbnMucXVhbGl0eSksICctcXVpZXQnLCAnLWV4YWN0J107XG4gICAgY29uc29sZS5kZWJ1Zyhgd2VicCBjb21wcmVzcyBjb21tYW5kIDogJHt3ZWJwVG9vbH0gJHthcmdzLmpvaW4oJyAnKX1gKTtcbiAgICBhd2FpdCBxdWlja1NwYXduKHdlYnBUb29sLCBhcmdzLCB7XG4gICAgICAgIHByZWZpeDogJ1tjb21wcmVzcyB3ZWJwXScsXG4gICAgfSk7XG4gICAgY29uc29sZS5sb2coJ2NvbXByZXNzIHdlYnAgc3VjY2VzcyAnICsgYHtsaW5rKCR7ZGVzdH0pfWApO1xufVxuXG4vKipcbiAqIOWOi+e8qSBwdnIg57G75Z6L5Zu+54mHXG4gKiBAcGFyYW0geyp9IG9wdGlvblxuICogQHBhcmFtIHsqfSBmb3JtYXRcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNvbXByZXNzUFZSKG9wdGlvbjogSUNvbXByZXNzQ29uZmlnKSB7XG4gICAgY29uc29sZS5kZWJ1Zygnc3RhcnQgY29tcHJlc3MgcHZyJywgb3B0aW9uKTtcbiAgICBsZXQgc3JjID0gb3B0aW9uLnNyYztcbiAgICBpZiAob3B0aW9uLmZvcm1hdC5lbmRzV2l0aCgncmdiX2EnKSkge1xuICAgICAgICBjb25zdCB0ZW1wRGVzdCA9IFBhdGguam9pbihidWlsZGVyQ29uZmlnLnByb2plY3RUZW1wRGlyLCAnYnVpbGRlcicsICdDb21wcmVzc1RleHR1cmUnLCAncHZyX2FscGhhJywgb3B0aW9uLnV1aWQgKyBQYXRoLmV4dG5hbWUoc3JjKSk7XG4gICAgICAgIGF3YWl0IGNyZWF0ZUFscGhhQXRsYXMoc3JjLCB0ZW1wRGVzdCk7XG4gICAgICAgIHNyYyA9IHRlbXBEZXN0O1xuICAgIH1cbiAgICBjb25zdCB7IGRlc3QsIGZvcm1hdCwgY29tcHJlc3NPcHRpb25zIH0gPSBvcHRpb247XG4gICAgLy8g5bel5YW35Y+v6IO95LiN5Lya6Ieq5Yqo55Sf5oiQ6L6T5Ye655uu5b2V5paH5Lu25aS5XG4gICAgZW5zdXJlRGlyU3luYyhkaXJuYW1lKGRlc3QpKTtcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vY29jb3MvY29jb3MtZWRpdG9yL3B1bGwvMTA0NlxuICAgIC8vIFBWUiDljYfnuqfnmoTlt7Lnn6Xpl67popjvvJppb3Mg5LiK5Ly85LmO5Lya5Ye6546w5riy5p+T5pWI5p6c5byC5bi477yf77yf5pqC5LiN56Gu5a6aXG4gICAgLy8gaHR0cHM6Ly9kb2NzLmltZ3RlYy5jb20vdG9vbHMtbWFudWFscy9wdnJ0ZXh0b29sLW1hbnVhbC9odG1sL3RvcGljcy9jbGkvY29tbWFuZC1saW5lLW9wdGlvbnMuaHRtbCNlbmNvZGUtZm9ybWF0LWRlc2NcbiAgICBsZXQgcHZyVG9vbCA9IFBhdGguam9pbihHbG9iYWxQYXRocy5zdGF0aWNEaXIsICd0b29scy9QVlJUZXhUb29sX2Rhcndpbi9QVlJUZXhUb29sQ0xJJyk7XG4gICAgaWYgKHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMicpIHtcbiAgICAgICAgcHZyVG9vbCA9IFBhdGguam9pbihHbG9iYWxQYXRocy5zdGF0aWNEaXIsICd0b29scy9QVlJUZXhUb29sX3dpbjMyL1BWUlRleFRvb2xDTEkuZXhlJyk7XG4gICAgfVxuXG4gICAgY29uc3QgY29tcHJlc3NGb3JtYXRNYXA6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gICAgICAgIHB2cnRjXzRiaXRzX3JnYmE6ICdQVlJUQzFfNCcsXG4gICAgICAgIHB2cnRjXzRiaXRzX3JnYjogJ1BWUlRDMV80X1JHQicsXG4gICAgICAgIHB2cnRjXzRiaXRzX3JnYl9hOiAnUFZSVEMxXzRfUkdCJyxcbiAgICAgICAgcHZydGNfMmJpdHNfcmdiYTogJ1BWUlRDMV8yJyxcbiAgICAgICAgcHZydGNfMmJpdHNfcmdiOiAnUFZSVEMxXzJfUkdCJyxcbiAgICAgICAgcHZydGNfMmJpdHNfcmdiX2E6ICdQVlJUQzFfMl9SR0InLFxuICAgIH07XG5cbiAgICAvLyDmoLnmja4gb3B0aW9uLmZvcm1hdCDovazmjaLmoLzlvI9cbiAgICBjb25zdCBjb21wcmVzc0Zvcm1hdCA9IGNvbXByZXNzRm9ybWF0TWFwW2Zvcm1hdF07XG4gICAgaWYgKCFjb21wcmVzc0Zvcm1hdCkge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBJbnZhbGlkIHB2ciBjb21wcmVzcyBmb3JtYXQgJHtmb3JtYXR9YCk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBxdWFsaXR5ID0gJ3B2cnRjJyArIGNvbXByZXNzT3B0aW9ucy5xdWFsaXR5O1xuICAgIGNvbnN0IHB2ck9wdHMgPSBbXG4gICAgICAgICctaScsXG4gICAgICAgIHNyYyxcbiAgICAgICAgJy1vJyxcbiAgICAgICAgZGVzdCxcblxuICAgICAgICAvLyB4eCDnmoTmianlvKDmlrnlvI/mmK/ph4fnlKjmi4nkvLjnmoTmlrnlvI/lr7nlm77niYfov5vooYzph43nva7nmoRcbiAgICAgICAgLy8gJy1zcXVhcmUnLCAnKycsXG4gICAgICAgIC8vICctcG90JywgJysnLFxuXG4gICAgICAgIC8vIHh4Y2FudmFzIOeahOaJqeW8oOaWueW8j+aYr+mHh+eUqOeVmeeZveeahOaWueW8j+WvueWbvueJh+i/m+ihjOmHjee9rueahFxuICAgICAgICAvLyDlm6DkuLogc3ByaXRlIGZyYW1lIOeahCByZWN0IOS5n+aYr+aMieeFp+WDj+e0oOadpeWtmOWCqOeahO+8jOaJgOS7peeUqOeVmeeZveeahOaWueW8j+abtOWPi+WlvVxuICAgICAgICAnLXNxdWFyZWNhbnZhcycsXG4gICAgICAgICcrJyxcbiAgICAgICAgJy1wb3RjYW52YXMnLFxuICAgICAgICAnKycsXG5cbiAgICAgICAgJy1xJyxcbiAgICAgICAgcXVhbGl0eSxcbiAgICAgICAgJy1mJyxcbiAgICAgICAgYCR7Y29tcHJlc3NGb3JtYXR9LFVCTixsUkdCYCxcbiAgICBdO1xuXG4gICAgY29uc29sZS5kZWJ1ZyhgcHZydGMgY29tcHJlc3MgY29tbWFuZCA6ICAke3B2clRvb2x9ICR7cHZyT3B0cy5qb2luKCcgJyl9YCk7XG5cbiAgICAvLyDnm67liY0gcHZydGMg55Sf5oiQ5Zu+54mH5Lya6buY6K6k6L6T5Ye65YiwIHN0ZGVyciDlhoXvvIzpnIDopoHkvb/nlKggZGVidWcg6L6T5Ye6IHN0ZGVyclxuICAgIGF3YWl0IHF1aWNrU3Bhd24ocHZyVG9vbCwgcHZyT3B0cywge1xuICAgICAgICBkb3duR3JhZGVXYXJpbmc6IHRydWUsXG4gICAgICAgIGRvd25HcmFkZUxvZzogdHJ1ZSxcbiAgICAgICAgLy8g6L+Z5Liq5bel5YW355qE6buY6K6k6L6T5Ye66YO95ZyoIHN0ZGVyciDph4xcbiAgICAgICAgaWdub3JlRXJyb3I6IHRydWUsXG4gICAgICAgIGRvd25HcmFkZUVycm9yOiB0cnVlLFxuICAgICAgICBwcmVmaXg6ICdbY29tcHJlc3MgcHZydGNdJyxcbiAgICB9KTtcbiAgICBpZiAoZXhpc3RzU3luYyhkZXN0KSkge1xuICAgICAgICBjb25zb2xlLmxvZygnY29tcHJlc3MgcHZydGMgc3VjY2VzcyAnICsgYHtsaW5rKCR7ZGVzdH0pfWApO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoaTE4bi50KCdidWlsZGVyLmVycm9yLnRleHR1cmVfY29tcHJlc3NfZmFpbGVkJywge1xuICAgICAgICAgICAgdHlwZTogZm9ybWF0LFxuICAgICAgICAgICAgYXNzZXQ6IGB7YXNzZXQoJHtvcHRpb24udXVpZH0pfWAsXG4gICAgICAgICAgICB0b29sc1BhdGg6IGB7ZmlsZSgke3B2clRvb2x9KX1gLFxuICAgICAgICAgICAgdG9vbEhvbWVQYWdlOiAnaHR0cHM6Ly9kZXZlbG9wZXIuaW1hZ2luYXRpb250ZWNoLmNvbS9wdnJ0ZXh0b29sLycsXG4gICAgICAgIH0pKTtcbiAgICB9XG59XG5cbi8qKlxuICog5Y6L57ypIGV0YyDnsbvlnovlm77niYdcbiAqIEBwYXJhbSBvcHRpb25cbiAqIEBwYXJhbSBmb3JtYXRcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNvbXByZXNzRXRjKG9wdGlvbjogSUNvbXByZXNzQ29uZmlnKSB7XG4gICAgY29uc3QgeyBkZXN0LCBmb3JtYXQsIGNvbXByZXNzT3B0aW9ucywgdXVpZCB9ID0gb3B0aW9uO1xuICAgIGNvbnNvbGUuZGVidWcoJ3N0YXJ0IGNvbXByZXNzIGV0YycsIG9wdGlvbi5zcmMsIGRlc3QsIGZvcm1hdCk7XG4gICAgbGV0IHNyYyA9IG9wdGlvbi5zcmM7XG4gICAgLy8g5bel5YW35Y+v6IO95LiN5Lya6Ieq5Yqo55Sf5oiQ6L6T5Ye655uu5b2V5paH5Lu25aS5XG4gICAgZW5zdXJlRGlyU3luYyhkaXJuYW1lKGRlc3QpKTtcbiAgICBpZiAoZm9ybWF0LmVuZHNXaXRoKCdyZ2JfYScpKSB7XG4gICAgICAgIC8vIOeQhuiuuuS4iuWQjOS4gOi1hOa6kOeahCBhbHBoYSDotLTlm77lj6/ku6XlpI3nlKjvvIzkuJTlupTor6XotbAgZ2V0QXNzZXRUZW1wRGlyQnlVdWlkIOS9v+eUqOe8k+WtmOWNs+WPr++8jOS9hueUseS6jui/meS4quW3peWFt+mcgOimgeWNleeLrOWPr+S7pei1sOa1i+ivleS+i+ivle+8jOaJgOS7peaaguaXtuWFiOS4jei1sOmAmueUqOWcsOWdgFxuICAgICAgICAvLyDnkIborrrkuIogZXRjIOWSjCBwdnIg55qEIGFscGhhIOi0tOWbvuS5n+WPr+S7peWkjeeUqO+8jOS9hueUseS6juWPr+iDveWtmOWcqOW5tuWPkeeahOadg+mZkOmXrumimO+8jOaaguS4jeWkjeeUqFxuICAgICAgICAvLyBOT1RFOiDms6jmhI/vvIzov5nph4znmoTlm77niYflkI3np7Dlv4XpobvlkowgZGVzdCDkv53mjIHkuIDoh7TvvIzlm6DkuLrmraTljovnvKnlt6XlhbfljovnvKnlh7rmnaXnmoTnu5Pmnpzml6Dms5XmlLnlj5jlm77niYflkI3np7BcbiAgICAgICAgY29uc3QgdGVtcERlc3QgPSBQYXRoLmpvaW4oYnVpbGRlckNvbmZpZy5wcm9qZWN0VGVtcERpciwgJ2J1aWxkZXInLCAnQ29tcHJlc3NUZXh0dXJlJywgJ2V0Y19hbHBoYScsIHV1aWQsIFBhdGguYmFzZW5hbWUoZGVzdCwgUGF0aC5leHRuYW1lKGRlc3QpKSArIFBhdGguZXh0bmFtZShzcmMpKTtcbiAgICAgICAgYXdhaXQgY3JlYXRlQWxwaGFBdGxhcyhzcmMsIHRlbXBEZXN0KTtcbiAgICAgICAgc3JjID0gdGVtcERlc3Q7XG4gICAgfVxuXG4gICAgbGV0IGV0Y1Rvb2wgPSBQYXRoLmpvaW4oR2xvYmFsUGF0aHMuc3RhdGljRGlyLCAndG9vbHMvbWFsaV9kYXJ3aW4vZXRjcGFjaycpO1xuICAgIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInKSB7XG4gICAgICAgIGV0Y1Rvb2wgPSBQYXRoLmpvaW4oR2xvYmFsUGF0aHMuc3RhdGljRGlyLCAndG9vbHMvbWFsaV93aW4zMi9ldGNwYWNrLmV4ZScpO1xuICAgIH1cblxuICAgIGNvbnN0IHRvb2xEaXIgPSBQYXRoLmRpcm5hbWUoZXRjVG9vbCk7XG4gICAgZXRjVG9vbCA9ICcuJyArIFBhdGguc2VwICsgUGF0aC5iYXNlbmFtZShldGNUb29sKTtcblxuICAgIGNvbnN0IGNvbXByZXNzRm9ybWF0TWFwOiBSZWNvcmQ8c3RyaW5nLCBhbnk+ID0ge1xuICAgICAgICBldGMxX3JnYjoge1xuICAgICAgICAgICAgZXRjRm9ybWF0OiAnZXRjMScsXG4gICAgICAgICAgICBjb21wcmVzc0Zvcm1hdDogJ1JHQicsXG4gICAgICAgIH0sXG4gICAgICAgIGV0YzFfcmdiX2E6IHtcbiAgICAgICAgICAgIGV0Y0Zvcm1hdDogJ2V0YzEnLFxuICAgICAgICAgICAgY29tcHJlc3NGb3JtYXQ6ICdSR0InLFxuICAgICAgICB9LFxuICAgICAgICBldGMyX3JnYmE6IHtcbiAgICAgICAgICAgIGV0Y0Zvcm1hdDogJ2V0YzInLFxuICAgICAgICAgICAgY29tcHJlc3NGb3JtYXQ6ICdSR0JBJyxcbiAgICAgICAgfSxcbiAgICAgICAgZXRjMl9yZ2I6IHtcbiAgICAgICAgICAgIGV0Y0Zvcm1hdDogJ2V0YzInLFxuICAgICAgICAgICAgY29tcHJlc3NGb3JtYXQ6ICdSR0InLFxuICAgICAgICB9LFxuICAgIH07XG5cbiAgICBjb25zdCB7IGV0Y0Zvcm1hdCwgY29tcHJlc3NGb3JtYXQgfSA9IGNvbXByZXNzRm9ybWF0TWFwW2Zvcm1hdF07XG5cbiAgICBjb25zdCBhcmdzID0gW1BhdGgubm9ybWFsaXplKHNyYyksIFBhdGguZGlybmFtZShkZXN0KSwgJy1jJywgZXRjRm9ybWF0LCAnLXMnLCBjb21wcmVzc09wdGlvbnMucXVhbGl0eV07XG5cbiAgICAvLyB3aW5kb3dzIOS4remcgOimgei/m+WFpeWIsCB0b29sRGlyIOWOu+aJp+ihjOWRveS7pOaJjeiDveaIkOWKn1xuICAgIGNvbnN0IGN3ZCA9IHRvb2xEaXI7XG5cbiAgICBjb25zdCBlbnYgPSBPYmplY3QuYXNzaWduKHt9LCBwcm9jZXNzLmVudik7XG4gICAgLy8gY29udmVydCDmmK8gaW1hZ2VtYWdpY2sg5Lit55qE5LiA5Liq5bel5YW3XG4gICAgLy8gZXRjcGFjayDkuK3lupTor6XmmK/ku6UgJ2NvbnZlcnQnIOiAjOS4jeaYryAnLi9jb252ZXJ0JyDmnaXosIPnlKjlt6XlhbfnmoTvvIzmiYDku6XpnIDopoHlsIYgdG9vbERpciDliqDliLDnjq/looPlj5jph4/kuK1cbiAgICAvLyB0b29sRGlyIOmcgOimgeaUvuWcqOWJjemdou+8jOS7pemYsuatouezu+e7n+aJvuWIsOeUqOaIt+iHquW3seWuieijheeahCBpbWFnZW1hZ2ljayDniYjmnKxcbiAgICBlbnYuUEFUSCA9IHRvb2xEaXIgKyAnOicgKyBlbnYuUEFUSDtcblxuICAgIGNvbnN0IG9wdHMgPSB7XG4gICAgICAgIGN3ZDogY3dkLFxuICAgICAgICBlbnY6IGVudixcbiAgICAgICAgcHJlZml4OiAnW2NvbXByZXNzIGV0Y10nLFxuICAgIH07XG5cbiAgICBpZiAoZXRjRm9ybWF0ID09PSAnZXRjMicpIHtcbiAgICAgICAgYXJncy5wdXNoKCctZicsIGNvbXByZXNzRm9ybWF0KTtcbiAgICB9XG5cbiAgICBjb25zb2xlLmRlYnVnKGBldGMgY29tcHJlc3MgY29tbWFuZCA6ICAke2V0Y1Rvb2x9ICR7YXJncy5qb2luKCcgJyl9YCk7XG4gICAgYXdhaXQgcXVpY2tTcGF3bihldGNUb29sLCBhcmdzLCBvcHRzKTtcbiAgICBpZiAoZXhpc3RzU3luYyhkZXN0KSkge1xuICAgICAgICBjb25zb2xlLmxvZygnY29tcHJlc3MgZXRjIHN1Y2Nlc3MgJyArIGB7bGluaygke2Rlc3R9KX1gKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKGkxOG4udCgnYnVpbGRlci5lcnJvci50ZXh0dXJlX2NvbXByZXNzX2ZhaWxlZCcsIHtcbiAgICAgICAgICAgIHR5cGU6IGZvcm1hdCxcbiAgICAgICAgICAgIGFzc2V0OiBge2Fzc2V0KCR7dXVpZH0pfWAsXG4gICAgICAgICAgICB0b29sc1BhdGg6IGB7ZmlsZSgke2V0Y1Rvb2x9KX1gLFxuICAgICAgICAgICAgdG9vbEhvbWVQYWdlOiAnaHR0cHM6Ly9pbWFnZW1hZ2ljay5vcmcvc2NyaXB0L2NvbW1hbmQtbGluZS1wcm9jZXNzaW5nLnBocCcsXG4gICAgICAgIH0pKTtcbiAgICB9XG59XG5cbi8qKlxuICog5Y6L57ypIGFzdGMg57G75Z6L5Zu+54mHXG4gKiBAcGFyYW0gZm9ybWF0XG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjb21wcmVzc0FzdGMob3B0aW9uOiBJQ29tcHJlc3NDb25maWcpIHtcblxuICAgIGNvbnN0IHsgc3JjLCBkZXN0LCBmb3JtYXQsIGNvbXByZXNzT3B0aW9ucyB9ID0gb3B0aW9uO1xuICAgIGNvbnNvbGUuZGVidWcoJ3N0YXJ0IGNvbXByZXNzIGFzdGMnLCBzcmMsIGRlc3QsIGZvcm1hdCk7XG4gICAgLy8g5bel5YW35Y+v6IO95LiN5Lya6Ieq5Yqo55Sf5oiQ6L6T5Ye655uu5b2V5paH5Lu25aS5XG4gICAgZW5zdXJlRGlyU3luYyhkaXJuYW1lKGRlc3QpKTtcbiAgICAvLyDlj4LogIPvvJpodHRwczovL2dpdGh1Yi5jb20vY29jb3MtY3JlYXRvci8zZC10YXNrcy9pc3N1ZXMvNjg1NVxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9BUk0tc29mdHdhcmUvYXN0Yy1lbmNvZGVyXG4gICAgbGV0IGFzdGNUb29sID0gUGF0aC5qb2luKEdsb2JhbFBhdGhzLnN0YXRpY0RpciwgJ3Rvb2xzL2FzdGMtZW5jb2Rlci9hc3RjZW5jJyk7XG4gICAgaWYgKHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMicpIHtcbiAgICAgICAgYXN0Y1Rvb2wgPSBQYXRoLmpvaW4oR2xvYmFsUGF0aHMuc3RhdGljRGlyLCAndG9vbHMvYXN0Yy1lbmNvZGVyL2FzdGNlbmMuZXhlJyk7XG4gICAgfVxuXG4gICAgY29uc3QgY29tcHJlc3NGb3JtYXRNYXA6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gICAgICAgIGFzdGNfNHg0OiAnNHg0JyxcbiAgICAgICAgYXN0Y181eDU6ICc1eDUnLFxuICAgICAgICBhc3RjXzZ4NjogJzZ4NicsXG4gICAgICAgIGFzdGNfOHg4OiAnOHg4JyxcbiAgICAgICAgYXN0Y18xMHg1OiAnMTB4NScsXG4gICAgICAgIGFzdGNfMTB4MTA6ICcxMHgxMCcsXG4gICAgICAgIGFzdGNfMTJ4MTI6ICcxMngxMicsXG4gICAgfTtcblxuICAgIGNvbnN0IGNvbXByZXNzRm9ybWF0ID0gY29tcHJlc3NGb3JtYXRNYXBbZm9ybWF0XTtcblxuICAgIGlmIChjb21wcmVzc09wdGlvbnMucXVhbGl0eSA9PT0gJ3ZlcnlmYXN0Jykge1xuICAgICAgICBjb21wcmVzc09wdGlvbnMucXVhbGl0eSA9ICdmYXN0ZXN0JztcbiAgICB9XG5cbiAgICBjb25zdCBhc3RjT3B0cyA9IFsnLWNsJywgc3JjLCBkZXN0LCBjb21wcmVzc0Zvcm1hdCwgYC0ke2NvbXByZXNzT3B0aW9ucy5xdWFsaXR5fWBdO1xuXG4gICAgY29uc29sZS5kZWJ1ZyhgYXN0YyBjb21wcmVzc2VkIGNvbW1hbmQ6ICR7UGF0aC5iYXNlbmFtZShhc3RjVG9vbCl9ICR7YXN0Y09wdHMuam9pbignICcpfWApO1xuXG4gICAgYXdhaXQgcXVpY2tTcGF3bihhc3RjVG9vbCwgYXN0Y09wdHMsIHtcbiAgICAgICAgcHJlZml4OiAnW2NvbXByZXNzIGFzdGNdJyxcbiAgICB9KTtcbiAgICAvLyDnm67liY3mnInpgYfliLDlgbbnjrDnmoTlnKjmnLrlrZDkuIrnlJ/miJAgYXN0YyDlpLHotKXvvIzkvYbmmK/msqHmnInplJnor6/ovpPlh7rnmoTmg4XlhrXvvIzpnIDopoHlgZrkuIDmrKHmo4Dmn6XplJnor6/mj5DnpLpcbiAgICBpZiAoZXhpc3RzU3luYyhkZXN0KSkge1xuICAgICAgICBjb25zb2xlLmxvZygnQ29tcHJlc3MgYXN0YyBzdWNjZXNzICcgKyBge2xpbmsoJHtkZXN0fSl9YCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihpMThuLnQoJ2J1aWxkZXIuZXJyb3IudGV4dHVyZV9jb21wcmVzc19mYWlsZWQnLCB7XG4gICAgICAgICAgICB0eXBlOiBmb3JtYXQsXG4gICAgICAgICAgICBhc3NldDogYHthc3NldCgke29wdGlvbi51dWlkfSl9YCxcbiAgICAgICAgICAgIHRvb2xzUGF0aDogYHtmaWxlKCR7YXN0Y1Rvb2x9KX1gLFxuICAgICAgICAgICAgdG9vbEhvbWVQYWdlOiAnaHR0cHM6Ly9naXRodWIuY29tL0FSTS1zb2Z0d2FyZS9hc3RjLWVuY29kZXInLFxuICAgICAgICB9KSk7XG4gICAgfVxufVxuXG4vKipcbiAqIOagueaNruWbvueJh+exu+Wei+iOt+WPluWOi+e8qeWHveaVsFxuICogQHBhcmFtIGZvcm1hdFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29tcHJlc3NGdW5jKGZvcm1hdDogSVRleHR1cmVDb21wcmVzc1R5cGUpIHtcbiAgICBjb25zdCBzdGFydCA9IGZvcm1hdC5zbGljZSgwLCAzKTtcbiAgICBzd2l0Y2ggKHN0YXJ0KSB7XG4gICAgICAgIGNhc2UgJ2pwZyc6XG4gICAgICAgIGNhc2UgJ3BuZyc6XG4gICAgICAgICAgICByZXR1cm4gY29tcHJlc3NKcGdBbmRQbmc7XG4gICAgICAgIGNhc2UgJ3B2cic6XG4gICAgICAgICAgICByZXR1cm4gY29tcHJlc3NQVlI7XG4gICAgICAgIGNhc2UgJ2V0Yyc6XG4gICAgICAgICAgICByZXR1cm4gY29tcHJlc3NFdGM7XG4gICAgICAgIGNhc2UgJ3dlYic6XG4gICAgICAgICAgICByZXR1cm4gY29tcHJlc3NXZWJwO1xuICAgICAgICBjYXNlICdhc3QnOlxuICAgICAgICAgICAgcmV0dXJuIGNvbXByZXNzQXN0YztcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHBhdGNoQ29tbWFuZChjb21tYW5kOiBzdHJpbmcsIG9wdGlvbnM6IGFueSk6IHN0cmluZyB7XG4gICAgcmV0dXJuIG5ldyBGdW5jdGlvbignb3B0aW9ucycsICd3aXRoKG9wdGlvbnMpeyByZXR1cm4gU3RyaW5nLnJhd2AnICsgY29tbWFuZCArICdgfScpKG9wdGlvbnMpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29tcHJlc3NDdXN0b21Gb3JtYXQoY29uZmlnOiBJQ29tcHJlc3NDb25maWcpIHtcbiAgICBjb25zdCB7IHNyYywgZGVzdCwgY29tcHJlc3NPcHRpb25zIH0gPSBjb25maWc7XG4gICAgY29uc3QgeyBjb21tYW5kLCBwYXRoIH0gPSBjb25maWcuY3VzdG9tQ29uZmlnITtcbiAgICBjb25zdCByYXdQYXRoID0gdXRpbHMuUGF0aC5yZXNvbHZlVG9SYXcocGF0aCk7XG4gICAgY29uc3QgdG9vbERpciA9IFBhdGguZGlybmFtZShyYXdQYXRoKTtcbiAgICBjb25zdCBvcHRzID0ge1xuICAgICAgICBjd2Q6IHRvb2xEaXIsXG4gICAgICAgIHByZWZpeDogJ1tjdXN0b20gY29tcHJlc3NdJyxcbiAgICB9O1xuICAgIGNvbnN0IG5ld0NvbW1hbmQgPSBwYXRjaENvbW1hbmQoY29tbWFuZCwge1xuICAgICAgICAuLi5jb21wcmVzc09wdGlvbnMsXG4gICAgICAgIHNyYyxcbiAgICAgICAgZGVzdCxcbiAgICB9KTtcbiAgICBjb25zdCBwYXJhbXMgPSBuZXdDb21tYW5kLnNwbGl0KCcgJykuZmlsdGVyKCh2YWwpID0+ICEhdmFsKTtcbiAgICBjb25zb2xlLmRlYnVnKGBjdXN0b20gY29tcHJlc3MgY29tbWFuZCA6ICR7cmF3UGF0aH0gJHtuZXdDb21tYW5kfWApO1xuICAgIGF3YWl0IHF1aWNrU3Bhd24ocmF3UGF0aCwgcGFyYW1zLCBvcHRzKTtcblxufVxuXG4vLyDkuLogcHZyIOWIm+W7uuS4gOW8oCByZ2IgYXRsYXMg6LS05Zu+XG4vLyDotLTlm77nmoTkuIrljYrpg6jliIblrZjljp/lm77nmoQgcmdiIOWAvO+8jOS4i+WNiumDqOWtmOWOn+WbvueahCBhbHBoYSDlgLxcbmFzeW5jIGZ1bmN0aW9uIGNyZWF0ZUFscGhhQXRsYXMoc3JjOiBzdHJpbmcsIGRlc3Q6IHN0cmluZykge1xuICAgIGNvbnN0IGltYWdlID0gbmV3IFNoYXJwKHNyYyk7XG4gICAgY29uc3QgbWV0YURhdGEgPSBhd2FpdCBpbWFnZS5tZXRhZGF0YSgpO1xuICAgIGNvbnN0IHdpZHRoID0gbWV0YURhdGEud2lkdGg7XG4gICAgY29uc3QgaGVpZ2h0ID0gbWV0YURhdGEuaGVpZ2h0O1xuXG4gICAgLy8gcHZyIOagvOW8j+mcgOimgemVv+WuveS4uiAyIOeahOasoeW5gu+8jOW5tuS4lOmcgOimgeS4uuato+aWueW9olxuICAgIC8vIOimgeato+ehruiuoeeul+WHuuS4i+WNiumDqOWIhueahOi1t+Wni+WAvOmcgOimgeaPkOWJjeeul+Wlveato+aWueW9oiAyIOasoeW5gueahOWAvFxuICAgIGNvbnN0IHJlc2l6ZWRXaWR0aCA9IHJvdW5kVG9Qb3dlck9mVHdvKHdpZHRoKTtcbiAgICBsZXQgcmVzaXplZEhlaWdodCA9IHJvdW5kVG9Qb3dlck9mVHdvKGhlaWdodCk7XG5cbiAgICBpZiAocmVzaXplZEhlaWdodCA8IHJlc2l6ZWRXaWR0aCAvIDIpIHtcbiAgICAgICAgcmVzaXplZEhlaWdodCA9IHJlc2l6ZWRXaWR0aCAvIDI7XG4gICAgfVxuXG4gICAgY29uc3QgaW5wdXREYXRhID0gYXdhaXQgaW1hZ2UucmF3KCkudG9CdWZmZXIoKTtcbiAgICBjb25zdCBjaGFubmVscyA9IDM7XG4gICAgY29uc3QgcmdiUGl4ZWwgPSAweDAwMDAwMDtcbiAgICBjb25zdCBvdXRwdXRTaXplID0gd2lkdGggKiAyICogcmVzaXplZEhlaWdodCAqIGNoYW5uZWxzO1xuICAgIGNvbnN0IG91dHB1dERhdGEgPSBCdWZmZXIuYWxsb2Mob3V0cHV0U2l6ZSwgcmdiUGl4ZWwpO1xuXG4gICAgbGV0IG91dHB1dEluZGV4O1xuICAgIGxldCBvdXRwdXRBbHBoYUluZGV4O1xuICAgIGZvciAobGV0IHJvdyA9IDA7IHJvdyA8IGhlaWdodDsgcm93KyspIHtcbiAgICAgICAgZm9yIChsZXQgY29sID0gMDsgY29sIDwgd2lkdGg7IGNvbCsrKSB7XG4gICAgICAgICAgICAvLyDorr7nva4gcmdiIOWAvOWIsOS4iuWNiumDqOWIhlxuICAgICAgICAgICAgY29uc3QgaW5kZXggPSByb3cgKiB3aWR0aCArIGNvbDtcbiAgICAgICAgICAgIGNvbnN0IGlucHV0SW5kZXggPSBpbmRleCAqIDQ7XG4gICAgICAgICAgICBvdXRwdXRJbmRleCA9IGluZGV4ICogMztcbiAgICAgICAgICAgIG91dHB1dERhdGFbb3V0cHV0SW5kZXhdID0gaW5wdXREYXRhW2lucHV0SW5kZXhdO1xuICAgICAgICAgICAgb3V0cHV0RGF0YVtvdXRwdXRJbmRleCArIDFdID0gaW5wdXREYXRhW2lucHV0SW5kZXggKyAxXTtcbiAgICAgICAgICAgIG91dHB1dERhdGFbb3V0cHV0SW5kZXggKyAyXSA9IGlucHV0RGF0YVtpbnB1dEluZGV4ICsgMl07XG5cbiAgICAgICAgICAgIC8vIOiuvue9riBhbHBoYSDlgLzliLDkuIvljYrpg6jliIZcbiAgICAgICAgICAgIG91dHB1dEFscGhhSW5kZXggPSAoKHJvdyArIHJlc2l6ZWRIZWlnaHQpICogd2lkdGggKyBjb2wpICogMztcbiAgICAgICAgICAgIGNvbnN0IGFscGhhID0gaW5wdXRJbmRleCArIDM7XG4gICAgICAgICAgICBvdXRwdXREYXRhW291dHB1dEFscGhhSW5kZXhdID0gaW5wdXREYXRhW2FscGhhXTtcbiAgICAgICAgICAgIG91dHB1dERhdGFbb3V0cHV0QWxwaGFJbmRleCArIDFdID0gaW5wdXREYXRhW2FscGhhXTtcbiAgICAgICAgICAgIG91dHB1dERhdGFbb3V0cHV0QWxwaGFJbmRleCArIDJdID0gaW5wdXREYXRhW2FscGhhXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBvcHRzID0geyByYXc6IHsgd2lkdGgsIGhlaWdodDogcmVzaXplZEhlaWdodCAqIDIsIGNoYW5uZWxzIH0gfTtcbiAgICBlbnN1cmVEaXJTeW5jKFBhdGguZGlybmFtZShkZXN0KSk7XG4gICAgYXdhaXQgU2hhcnAob3V0cHV0RGF0YSwgb3B0cykudG9GaWxlKGRlc3QpO1xufVxuIl19