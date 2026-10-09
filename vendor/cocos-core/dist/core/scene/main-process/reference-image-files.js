"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.referenceImageFiles = exports.ReferenceImageFileService = void 0;
/** Node-side external-image reader used by Scene services without importing files into AssetDB. */
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const MIME_BY_EXTENSION = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
};
/** Node-only file boundary; it returns a JSON-safe data URL, never a Buffer. */
class ReferenceImageFileService {
    async readDataUrl(filePath) {
        if (typeof filePath !== 'string' || !path_1.default.isAbsolute(filePath)) {
            throw new Error('Reference image path must be absolute.');
        }
        const mime = MIME_BY_EXTENSION[path_1.default.extname(filePath).toLowerCase()];
        if (!mime) {
            throw new Error('Reference image format must be PNG, JPG, or JPEG.');
        }
        let data;
        try {
            data = await fs_1.promises.readFile(filePath);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Unable to read reference image: ${message}`);
        }
        return `data:${mime};base64,${data.toString('base64')}`;
    }
}
exports.ReferenceImageFileService = ReferenceImageFileService;
exports.referenceImageFiles = new ReferenceImageFileService();
