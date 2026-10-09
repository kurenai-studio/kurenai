"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractImagePixelsFromFile = extractImagePixelsFromFile;
const sharp_1 = __importDefault(require("sharp"));
/**
 * 在 Node 进程中读取图片像素。
 *
 * Scene Runtime 可能运行在浏览器中，不能直接加载 Sharp 原生模块，因此只通过 RPC
 * 调用此方法并接收可 JSON 序列化的 Base64 数据。
 */
async function extractImagePixelsFromFile(file, options) {
    if (!file) {
        throw new Error('Image file path is required.');
    }
    validateExtractionOptions(options);
    const { data, info } = await (0, sharp_1.default)(file)
        .extract(options.rect)
        .rotate(options.rotation ?? 0)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
    if (info.channels !== 4) {
        throw new Error(`Expected RGBA image data, but Sharp returned ${info.channels} channels.`);
    }
    return {
        dataBase64: data.toString('base64'),
        width: info.width,
        height: info.height,
        channels: info.channels,
    };
}
function validateExtractionOptions(options) {
    if (!options || !options.rect) {
        throw new Error('Image extraction rect is required.');
    }
    const { left, top, width, height } = options.rect;
    assertInteger(left, 'rect.left', 0);
    assertInteger(top, 'rect.top', 0);
    assertInteger(width, 'rect.width', 1);
    assertInteger(height, 'rect.height', 1);
    const rotation = options.rotation ?? 0;
    if (rotation !== 0 && rotation !== 90) {
        throw new Error(`Image extraction rotation must be 0 or 90, but received ${rotation}.`);
    }
}
function assertInteger(value, name, minimum) {
    if (!Number.isInteger(value) || value < minimum) {
        throw new Error(`${name} must be an integer greater than or equal to ${minimum}.`);
    }
}
