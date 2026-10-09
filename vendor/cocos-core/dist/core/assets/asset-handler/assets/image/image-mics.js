'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertTGA = convertTGA;
exports.convertImageToHDR = convertImageToHDR;
exports.convertPSD = convertPSD;
exports.convertTIFF = convertTIFF;
exports.convertHDROrEXR = convertHDROrEXR;
exports.convertHDR = convertHDR;
exports.convertWithCmft = convertWithCmft;
const path_1 = require("path");
const pngjs_1 = require("pngjs");
const tga_js_1 = __importDefault(require("tga-js"));
const fs_extra_1 = require("fs-extra");
const psd_js_1 = __importDefault(require("psd.js"));
const sharp_1 = __importDefault(require("sharp"));
const global_1 = require("../../../../../global");
const utils_1 = __importDefault(require("../../../../base/utils"));
async function convertTGA(data) {
    const tga = new tga_js_1.default();
    tga.load(data);
    const imageData = tga.getImageData();
    const png = new pngjs_1.PNG({ width: imageData.width, height: imageData.height });
    png.data = Buffer.from(imageData.data);
    return await savePNGObject(png);
}
async function convertImageToHDR(file, uuid, temp) {
    // const output = join(temp, uuid + '.hdr');
    const output = (0, path_1.join)(temp, uuid + '.hdr');
    (0, fs_extra_1.ensureDirSync)((0, path_1.dirname)(output));
    // https://github.com/ImageMagick/ImageMagick
    let convertTool = (0, path_1.join)(global_1.GlobalPaths.staticDir, 'tools/mali_darwin/convert');
    if (process.platform === 'win32') {
        convertTool = (0, path_1.join)(global_1.GlobalPaths.staticDir, 'tools/mali_win32/convert.exe');
    }
    const toolDir = (0, path_1.dirname)(convertTool);
    convertTool = '.' + path_1.sep + (0, path_1.basename)(convertTool);
    const env = Object.assign({}, process.env);
    // convert 是 imagemagick 中的一个工具
    // etcpack 中应该是以 'convert' 而不是 './convert' 来调用工具的，所以需要将 toolDir 加到环境变量中
    // toolDir 需要放在前面，以防止系统找到用户自己安装的 imagemagick 版本
    env.PATH = toolDir + ':' + env.PATH;
    await utils_1.default.Process.quickSpawn(convertTool, [(0, path_1.normalize)(file), (0, path_1.normalize)(output)], {
        // windows 中需要进入到 toolDir 去执行命令才能成功
        cwd: toolDir,
        env: env,
    });
    return {
        extName: '.hdr',
        source: output,
    };
}
async function convertPSD(data) {
    const psd = new psd_js_1.default(data);
    psd.parse();
    const png = psd.image.toPng();
    return savePNGObject(png);
}
async function convertTIFF(file) {
    return new Promise((resolve, reject) => {
        (0, sharp_1.default)(file)
            .png()
            .toBuffer()
            .then((data) => {
            resolve({
                extName: '.png',
                data,
            });
        })
            .catch((err) => reject(err));
    });
}
async function savePNGObject(png) {
    return new Promise((resolve, reject) => {
        const buffer = [];
        png.on('data', (data) => {
            buffer.push(data);
        });
        png.on('end', () => {
            resolve({
                extName: '.png',
                data: Buffer.concat(buffer),
            });
        });
        png.on('error', (err) => {
            reject(err);
        });
        png.pack();
    });
}
async function convertHDROrEXR(extName, source, uuid, temp) {
    console.debug(`Start to convert asset {asset[${uuid}](${uuid})}`);
    const dist = (0, path_1.join)(temp, uuid);
    (0, fs_extra_1.ensureDirSync)(temp);
    if (extName === '.hdr') {
        return await convertWithCmft(source, dist);
    }
    else if (extName === '.exr') {
        // 先尝试使用 cmft
        try {
            return await convertWithCmft(source, dist, '_withexr');
        }
        catch (ignored) {
            // 如果使用 cmft 直接转失败，则先转 hdr 再使用 cmft 处理
            const res = await convertImageToHDR(source, uuid, temp);
            return await convertWithCmft(res.source, dist);
        }
    }
}
// 兼容旧接口
async function convertHDR(source, uuid, temp) {
    console.debug(`Start to convert asset {asset[${uuid}](${uuid})}`);
    const dist = (0, path_1.join)(temp, uuid);
    (0, fs_extra_1.ensureDirSync)(temp);
    return await convertWithCmft(source, dist);
}
async function convertWithCmft(file, dist, version = '') {
    // https://github.com/dariomanesku/cmft
    let tools = (0, path_1.join)(global_1.GlobalPaths.staticDir, `tools/cmft/cmftRelease64${version}${process.platform === 'win32' ? '.exe' : ''}`);
    if (!(0, fs_extra_1.existsSync)(tools)) {
        tools = (0, path_1.join)(global_1.GlobalPaths.staticDir, `tools/cmft/cmft${version}${process.platform === 'win32' ? '.exe' : ''}`);
    }
    if (!(0, fs_extra_1.existsSync)(tools)) {
        tools = (0, path_1.join)(global_1.GlobalPaths.staticDir, `tools/cmft/cmftRelease64${process.platform === 'win32' ? '.exe' : ''}`);
    }
    await utils_1.default.Process.quickSpawn(tools, [
        '--bypassoutputtype',
        '--output0params',
        'png,rgbm,latlong',
        '--input',
        file,
        '--output0',
        dist,
    ]);
    console.debug(`Convert asset${file} -> PNG success.`);
    return {
        extName: '.png',
        source: dist + '.png',
    };
}
