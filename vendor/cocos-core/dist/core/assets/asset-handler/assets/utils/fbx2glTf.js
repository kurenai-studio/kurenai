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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmJ4MmdsVGYuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9hc3NldHMvYXNzZXQtaGFuZGxlci9hc3NldHMvdXRpbHMvZmJ4MmdsVGYudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7Ozs7QUFrQkgsMEJBaUZDO0FBakdELGtFQUF5QztBQUN6Qyx3REFBMEI7QUFDMUIsNENBQW9CO0FBQ3BCLGdEQUF3QjtBQUN4QixvREFBNEI7QUFDNUIsdUNBQTRDO0FBRTVDOzs7Ozs7OztHQVFHO0FBQ0gsU0FBZ0IsT0FBTyxDQUFDLE9BQWUsRUFBRSxRQUFnQixFQUFFLE9BQWlCLEVBQUU7SUFDMUUsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtRQUNuQyxJQUFJLENBQUM7WUFDRCxNQUFNLFlBQVksR0FBRyxjQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO1lBRXRFLE1BQU0sTUFBTSxHQUFHLFlBQUUsQ0FBQyxJQUFJLEVBQUUsS0FBSyxZQUFZLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1lBQ3hELElBQUksSUFBSSxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLEtBQUssRUFBRSxZQUFFLENBQUMsSUFBSSxFQUFFLEVBQUUsVUFBVSxHQUFHLE1BQU0sQ0FBQyxDQUFDO1lBRTFFLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLG1CQUFtQixDQUFDLENBQUM7WUFDM0QsSUFBSSxrQkFBRSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUN0QixJQUFJLEdBQUcsSUFBSSxDQUFDO1lBQ2hCLENBQUM7WUFFRCxJQUFJLENBQUMsa0JBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxD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O29CQUNiLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDbkIsQ0FBQztnQkFFRCxnQ0FBZ0M7Z0JBQ2hDLElBQUksSUFBSSxLQUFLLENBQUMsRUFBRSxDQUFDO29CQUNiLCtDQUErQztvQkFDL0MsOEVBQThFO29CQUM5RSxNQUFNLENBQ0YsSUFBSSxLQUFLLENBQ0wsSUFBQSxxQkFBYSxFQUFDLGlEQUFpRCxFQUFFO3dCQUM3RCxJQUFJO3dCQUNKLE1BQU0sRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFFBQVE7cUJBQzVDLENBQUMsQ0FDTCxDQUNKLENBQUM7Z0JBQ04sQ0FBQztxQkFBTSxDQUFDO29CQUNKLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDdEIsQ0FBQztZQUNMLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQztRQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7WUFDYixNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDbEIsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE0LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICovXG5cbmltcG9ydCBjaGlsZFByb2Nlc3MgZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5pbXBvcnQgZnMgZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0IG9zIGZyb20gJ29zJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHJpbXJhZiBmcm9tICdyaW1yYWYnO1xuaW1wb3J0IHsgaTE4blRyYW5zbGF0ZSB9IGZyb20gJy4uLy4uL3V0aWxzJztcblxuLyoqXG4gKiBDb252ZXJ0cyBhbiBGQlggdG8gYSBHVExGIG9yIEdMQiBmaWxlLlxuICogQHBhcmFtIHN0cmluZyBzcmNGaWxlIHBhdGggdG8gdGhlIHNvdXJjZSBmaWxlLlxuICogQHBhcmFtIHN0cmluZyBkZXN0RmlsZSBwYXRoIHRvIHRoZSBkZXN0aW5hdGlvbiBmaWxlLlxuICogVGhpcyBtdXN0IGVuZCBpbiBgLmdsYmAgb3IgYC5nbHRmYCAoY2FzZSBtYXR0ZXJzKS5cbiAqIEBwYXJhbSBzdHJpbmdbXSBbb3B0c10gb3B0aW9ucyB0byBwYXNzIHRvIHRoZSBjb252ZXJ0ZXIgdG9vbC5cbiAqIEByZXR1cm4gUHJvbWlzZTxzdHJpbmc+IGEgcHJvbWlzZSB0aGF0IHlpZWxkcyB0aGUgZnVsbCBwYXRoIHRvIHRoZSBjb252ZXJ0ZWRcbiAqIGZpbGUsIGFuIGVycm9yIG9uIGNvbnZlcnNpb24gZmFpbHVyZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbnZlcnQoc3JjRmlsZTogc3RyaW5nLCBkZXN0RmlsZTogc3RyaW5nLCBvcHRzOiBzdHJpbmdbXSA9IFtdKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGZieDJnbHRmUm9vdCA9IHBhdGguZGlybmFtZShyZXF1aXJlLnJlc29sdmUoJ0Bjb2Nvcy9mYngyZ2x0ZicpKTtcblxuICAgICAgICAgICAgY29uc3QgYmluRXh0ID0gb3MudHlwZSgpID09PSAnV2luZG93c19OVCcgPyAnLmV4ZScgOiAnJztcbiAgICAgICAgICAgIGxldCB0b29sID0gcGF0aC5qb2luKGZieDJnbHRmUm9vdCwgJ2JpbicsIG9zLnR5cGUoKSwgJ0ZCWDJnbFRGJyArIGJpbkV4dCk7XG5cbiAgICAgICAgICAgIGNvbnN0IHRlbXAgPSB0b29sLnJlcGxhY2UoJ2FwcC5hc2FyJywgJ2FwcC5hc2FyLnVucGFja2VkJyk7XG4gICAgICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyh0ZW1wKSkge1xuICAgICAgICAgICAgICAgIHRvb2wgPSB0ZW1wO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmModG9vbCkpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVuc3VwcG9ydGVkIE9TOiAke29zLnR5cGUoKX1gKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IGRlc3RFeHQgPSAnJztcbiAgICAgICAgICAgIGlmIChkZXN0RmlsZS5lbmRzV2l0aCgnLmdsYicpKSB7XG4gICAgICAgICAgICAgICAgZGVzdEV4dCA9ICcuZ2xiJztcbiAgICAgICAgICAgICAgICBvcHRzLmluY2x1ZGVzKCctLWJpbmFyeScpIHx8IG9wdHMucHVzaCgnLS1iaW5hcnknKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZGVzdEZpbGUuZW5kc1dpdGgoJy5nbHRmJykpIHtcbiAgICAgICAgICAgICAgICBkZXN0RXh0ID0gJy5nbHRmJztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbnN1cHBvcnRlZCBmaWxlIGV4dGVuc2lvbjogJHtkZXN0RmlsZX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChkZXN0RXh0Lmxlbmd0aCAhPT0gMCkge1xuICAgICAgICAgICAgICAgIGZzLmVuc3VyZURpclN5bmMocGF0aC5kaXJuYW1lKGRlc3RGaWxlKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHNyY1BhdGggPSBmcy5yZWFscGF0aFN5bmMoc3JjRmlsZSk7XG4gICAgICAgICAgICBjb25zdCBzcmNEaXIgPSBwYXRoLmRpcm5hbWUoc3JjUGF0aCk7XG4gICAgICAgICAgICBjb25zdCBkZXN0UGF0aCA9IGRlc3RGaWxlO1xuXG4gICAgICAgICAgICBjb25zdCBzcmNOYW1lID0gcGF0aC5iYXNlbmFtZShzcmNQYXRoKTtcblxuICAgICAgICAgICAgY29uc3QgYXJncyA9IG9wdHMuc2xpY2UoMCk7XG4gICAgICAgICAgICBhcmdzLnB1c2goJy0taW5wdXQnLCBzcmNOYW1lLCAnLS1vdXRwdXQnLCBkZXN0UGF0aCk7XG4gICAgICAgICAgICBjb25zdCBjaGlsZCA9IGNoaWxkUHJvY2Vzcy5zcGF3bih0b29sLCBhcmdzLCB7XG4gICAgICAgICAgICAgICAgY3dkOiBzcmNEaXIsXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgbGV0IG91dHB1dCA9ICcnO1xuICAgICAgICAgICAgaWYgKGNoaWxkLnN0ZG91dCkge1xuICAgICAgICAgICAgICAgIGNoaWxkLnN0ZG91dC5vbignZGF0YScsIChkYXRhKSA9PiAob3V0cHV0ICs9IGRhdGEpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjaGlsZC5zdGRlcnIpIHtcbiAgICAgICAgICAgICAgICBjaGlsZC5zdGRlcnIub24oJ2RhdGEnLCAoZGF0YSkgPT4gKG91dHB1dCArPSBkYXRhKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjaGlsZC5vbignZXJyb3InLCByZWplY3QpO1xuICAgICAgICAgICAgY2hpbGQub24oJ2Nsb3NlJywgKGNvZGUpID0+IHtcbiAgICAgICAgICAgICAgICAvLyB0aGUgRkJYIFNESyBtYXkgY3JlYXRlIGFuIC5mYm0gZGlyIGR1cmluZyBjb252ZXJzaW9uOyBkZWxldGUhXG4gICAgICAgICAgICAgICAgY29uc3QgZmJtQ3J1ZnQgPSBzcmNQYXRoLnJlcGxhY2UoLy5mYngkL2ksICcuZmJtJyk7XG4gICAgICAgICAgICAgICAgLy8gZG9uJ3Qgc3RpY2sgYSBmb3JrIGluIHRoaW5ncyBpZiB0aGlzIGZhaWxzLCBqdXN0IGxvZyBhIHdhcm5pbmdcbiAgICAgICAgICAgICAgICBjb25zdCBvbkVycm9yID0gKGVycm9yOiBhbnkpID0+IGVycm9yICYmIGNvbnNvbGUud2FybihgRmFpbGVkIHRvIGRlbGV0ZSAke2ZibUNydWZ0fTogJHtlcnJvcn1gKTtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBmcy5leGlzdHNTeW5jKGZibUNydWZ0KSAmJiByaW1yYWYoZmJtQ3J1ZnQsIHt9LCBvbkVycm9yKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBvbkVycm9yKGVycm9yKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBub24temVybyBleGl0IGNvZGUgaXMgZmFpbHVyZVxuICAgICAgICAgICAgICAgIGlmIChjb2RlICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIElmIGNvZGUgaXMgMywgdGhlIG91dHB1dCBtYXkgbm90IGJlIGZsdXNoZWQuXG4gICAgICAgICAgICAgICAgICAgIC8vIFNlZSBodHRwczovL2RvY3MubWljcm9zb2Z0LmNvbS9lbi11cy9wcmV2aW91cy12ZXJzaW9ucy9rMDg5eXloMCh2JTNEdnMuMTQwKVxuICAgICAgICAgICAgICAgICAgICByZWplY3QoXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaTE4blRyYW5zbGF0ZSgnaW1wb3J0ZXIuZmJ4LmZieDJnbHRmX2V4aXN0c193aXRoX25vbl96ZXJvX2NvZGUnLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dDogb3V0cHV0Lmxlbmd0aCA/IG91dHB1dCA6ICc8bm9uZT4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGRlc3RQYXRoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cbiJdfQ==