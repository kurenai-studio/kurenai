"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compressDirs = compressDirs;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const jszip_1 = __importDefault(require("jszip"));
const global_1 = require("../../../share/global");
async function compressDirs(dirnames, basepath, outputPath) {
    await new Promise(resolve => {
        const jsZip = new jszip_1.default();
        const filesToCompress = [];
        const dir = (0, path_1.parse)(global_1.BuildGlobalInfo.BUNDLE_ZIP_NAME).name;
        dirnames.forEach(dirname => {
            getFilesInDirectory(filesToCompress, dirname);
        });
        // https://stackoverflow.com/questions/57175871/how-to-make-jszip-generate-same-buffer/57177371#57177371?newreg=b690df5d033d4576bb3be28f6bb010ab
        // https://adoyle.me/blog/why-zip-file-checksum-changed.html
        const options = {
            date: new Date('2021.06.21 06:00:00Z'),
            createFolders: false,
        };
        filesToCompress.forEach(filepath => {
            const relativePath = (0, path_1.relative)(basepath, filepath);
            let targetPath = (0, path_1.join)(dir, relativePath);
            targetPath = targetPath.replace(/\\/g, '/');
            jsZip.file(targetPath, (0, fs_extra_1.readFileSync)(filepath), options);
        });
        jsZip.generateAsync({
            type: 'nodebuffer',
            compression: 'DEFLATE',
            compressionOptions: {
                level: 9,
            },
        }).then((content) => {
            (0, fs_extra_1.writeFileSync)(outputPath, content);
            dirnames.forEach((dirname) => {
                (0, fs_extra_1.removeSync)(dirname);
            });
            resolve();
        });
    });
}
function getFilesInDirectory(output, dirname) {
    const dirlist = (0, fs_extra_1.readdirSync)(dirname);
    dirlist.forEach(item => {
        const absolutePath = (0, path_1.join)(dirname, item);
        const statInfo = (0, fs_extra_1.statSync)(absolutePath);
        if (statInfo.isDirectory()) {
            getFilesInDirectory(output, absolutePath);
        }
        else {
            output.push(absolutePath);
        }
    });
}
