"use strict";
/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convert = convert;
const child_process_1 = __importDefault(require("child_process"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const rimraf_1 = __importDefault(require("rimraf"));
const utils_1 = require("../../utils");
/**
 * Converts an FBX to a GTLF or GLB file.
 * @param string srcFile path to the source file.
 * @param string destFile path to the destination file.
 * This must end in `.glb` or `.gltf` (case matters).
 * @param string[] [opts] options to pass to the converter tool.
 * @return Promise<string> a promise that yields the full path to the converted
 * file, an error on conversion failure.
 */
function convert(srcFile, destFile, opts = []) {
    return new Promise((resolve, reject) => {
        try {
            const fbx2gltfRoot = path_1.default.dirname(require.resolve('@cocos/fbx2gltf'));
            const binExt = os_1.default.type() === 'Windows_NT' ? '.exe' : '';
            let tool = path_1.default.join(fbx2gltfRoot, 'bin', os_1.default.type(), 'FBX2glTF' + binExt);
            const temp = tool.replace('app.asar', 'app.asar.unpacked');
            if (fs_extra_1.default.existsSync(temp)) {
                tool = temp;
            }
            if (!fs_extra_1.default.existsSync(tool)) {
                throw new Error(`Unsupported OS: ${os_1.default.type()}`);
            }
            let destExt = '';
            if (destFile.endsWith('.glb')) {
                destExt = '.glb';
                opts.includes('--binary') || opts.push('--binary');
            }
            else if (destFile.endsWith('.gltf')) {
                destExt = '.gltf';
            }
            else {
                throw new Error(`Unsupported file extension: ${destFile}`);
            }
            if (destExt.length !== 0) {
                fs_extra_1.default.ensureDirSync(path_1.default.dirname(destFile));
            }
            const srcPath = fs_extra_1.default.realpathSync(srcFile);
            const srcDir = path_1.default.dirname(srcPath);
            const destPath = destFile;
            const srcName = path_1.default.basename(srcPath);
            const args = opts.slice(0);
            args.push('--input', srcName, '--output', destPath);
            const child = child_process_1.default.spawn(tool, args, {
                cwd: srcDir,
            });
            let output = '';
            if (child.stdout) {
                child.stdout.on('data', (data) => (output += data));
            }
            if (child.stderr) {
                child.stderr.on('data', (data) => (output += data));
            }
            child.on('error', reject);
            child.on('close', (code) => {
                // the FBX SDK may create an .fbm dir during conversion; delete!
                const fbmCruft = srcPath.replace(/.fbx$/i, '.fbm');
                // don't stick a fork in things if this fails, just log a warning
                const onError = (error) => error && console.warn(`Failed to delete ${fbmCruft}: ${error}`);
                try {
                    fs_extra_1.default.existsSync(fbmCruft) && (0, rimraf_1.default)(fbmCruft, {}, onError);
                }
                catch (error) {
                    onError(error);
                }
                // non-zero exit code is failure
                if (code !== 0) {
                    // If code is 3, the output may not be flushed.
                    // See https://docs.microsoft.com/en-us/previous-versions/k089yyh0(v%3Dvs.140)
                    reject(new Error((0, utils_1.i18nTranslate)('importer.fbx.fbx2gltf_exists_with_non_zero_code', {
                        code,
                        output: output.length ? output : '<none>',
                    })));
                }
                else {
                    resolve(destPath);
                }
            });
        }
        catch (error) {
            reject(error);
        }
    });
}
