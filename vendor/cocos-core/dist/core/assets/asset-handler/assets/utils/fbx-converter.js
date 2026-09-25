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
exports.createFbxConverter = createFbxConverter;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importStar(require("fs-extra"));
const child_process_1 = __importDefault(require("child_process"));
const utils_1 = require("../../utils");
function createFbxConverter(options) {
    const outFileName = 'out.gltf';
    let { tool: toolPath } = require('@cocos/fbx-gltf-conv');
    const temp = toolPath.replace('app.asar', 'app.asar.unpacked');
    if (fs_extra_1.default.existsSync(temp)) {
        toolPath = temp;
    }
    return {
        get options() {
            return options;
        },
        get(asset, outputDir) {
            return path_1.default.join(outputDir, outFileName);
        },
        async convert(asset, outputDir) {
            const cliArgs = [];
            // <input file>
            cliArgs.push(quotPathArg(asset.source));
            // --unit-conversion
            cliArgs.push('--unit-conversion', options.unitConversion ?? 'geometry-level');
            // --animation-bake-rate
            cliArgs.push('--animation-bake-rate', `${options.animationBakeRate ?? 0}`);
            // --prefer-local-time-span
            // Note for boolean parameters, `--o false` does not work.
            cliArgs.push(`--prefer-local-time-span=${options.preferLocalTimeSpan ?? true}`);
            cliArgs.push(`--match-mesh-names=${options.matchMeshNames ?? true}`);
            if (options.smartMaterialEnabled ?? false) {
                cliArgs.push('--export-fbx-file-header-info');
                cliArgs.push('--export-raw-materials');
            }
            // --out
            const outFile = path_1.default.join(outputDir, outFileName);
            await fs_extra_1.default.ensureDir(path_1.default.dirname(outFile));
            cliArgs.push('--out', quotPathArg(outFile));
            // --fbm-dir
            const fbmDir = path_1.default.join(outputDir, '.fbm');
            await fs_extra_1.default.ensureDir(fbmDir);
            cliArgs.push('--fbm-dir', quotPathArg(fbmDir));
            // --log-file
            const logFile = getLogFile(outputDir);
            await fs_extra_1.default.ensureDir(path_1.default.dirname(logFile));
            cliArgs.push('--log-file', quotPathArg(logFile));
            let callOk = await callFbxGLTFConv(toolPath, cliArgs, outputDir);
            if (callOk && !(await (0, fs_extra_1.pathExists)(outFile))) {
                callOk = false;
                console.error(`Tool FBX-glTF-conv ends abnormally(spawn ${toolPath} ${cliArgs.join(' ')}).`);
            }
            return callOk;
        },
        async printLogs(asset, outputDir) {
            const logFile = getLogFile(outputDir);
            if (await (0, fs_extra_1.pathExists)(logFile)) {
                let logs;
                try {
                    logs = await fs_extra_1.default.readJson(logFile);
                }
                catch {
                    console.debug('No logs are generated, it should not happen indeed.');
                }
                if (Array.isArray(logs)) {
                    // We are lazy here.
                    // If any exception happen due to log printing.
                    // We simply ignore.
                    try {
                        printConverterLogs(logs, asset);
                    }
                    catch (err) {
                        console.error(err);
                    }
                }
            }
        },
    };
    function quotPathArg(p) {
        return `"${p}"`;
    }
    function callFbxGLTFConv(tool, args, cwd) {
        return new Promise((resolve, reject) => {
            const child = child_process_1.default.spawn(quotPathArg(tool), args, {
                cwd,
                shell: true,
            });
            let output = '';
            if (child.stdout) {
                child.stdout.on('data', (data) => (output += data));
            }
            let errOutput = '';
            if (child.stderr) {
                child.stderr.on('data', (data) => (errOutput += data));
            }
            child.on('error', reject);
            child.on('close', (code) => {
                if (output) {
                    console.log(output);
                }
                if (errOutput) {
                    console.error(errOutput);
                }
                // non-zero exit code is failure
                if (code === 0) {
                    resolve(true);
                }
                else {
                    if (code === 1) {
                        // Defined by FBX-glTF-conv:
                        // Error happened, the convert result may not complete.
                        // But errors are logged.
                    }
                    else if (code === 3221225781) {
                        console.error((0, utils_1.i18nTranslate)('importer.fbx.fbx_gltf_conv.missing_dll'));
                    }
                    else if (code === 126 && process.platform === 'darwin') {
                        console.error((0, utils_1.i18nTranslate)('importer.fbx.fbx_gltf_conv.bad_cpu'));
                    }
                    else {
                        console.error(`FBX-glTF-conv existed with unexpected non-zero code ${code}`);
                    }
                    resolve(false);
                }
            });
        });
    }
    function getLogFile(outputDir) {
        return path_1.default.join(outputDir, 'log.json');
    }
    function printConverterLogs(logs, asset) {
        const getLogger = (level) => {
            let logger;
            switch (level) {
                case FbxGlTfConvLogLevel.verbose:
                    logger = console.debug;
                    break;
                case FbxGlTfConvLogLevel.info:
                    logger = console.log;
                    break;
                case FbxGlTfConvLogLevel.warning:
                    logger = console.warn;
                    break;
                case FbxGlTfConvLogLevel.error:
                case FbxGlTfConvLogLevel.fatal:
                default:
                    logger = console.error;
                    break;
            }
            return (text) => {
                logger.call(console, addAssetMark(text, asset));
            };
        };
        const inheritTypeMessageCode = 'unsupported_inherit_type';
        const mergedInheritTypeMessages = {};
        for (const { level, message } of logs) {
            const logger = getLogger(level);
            if (typeof message === 'string') {
                logger(message);
            }
            else {
                const code = message.code;
                if (code === inheritTypeMessageCode) {
                    const type = message.type;
                    const node = message.node;
                    if (!(type in mergedInheritTypeMessages)) {
                        mergedInheritTypeMessages[type] = [];
                    }
                    mergedInheritTypeMessages[type].push(node);
                }
                else if (typeof code === 'string') {
                    logger(getI18nMessage(code, message));
                }
                else {
                    logger(JSON.stringify(message, undefined, 2));
                }
            }
        }
        for (const [type, nodes] of Object.entries(mergedInheritTypeMessages)) {
            getLogger(FbxGlTfConvLogLevel.verbose)(getI18nMessage(inheritTypeMessageCode, {
                type,
                nodes,
            }));
        }
    }
    function getI18nMessage(code, message) {
        return (0, utils_1.i18nTranslate)(`importer.fbx.fbxGlTfConv.${code}`, message);
    }
    function addAssetMark(text, asset) {
        return `${text} [${(0, utils_1.linkToAssetTarget)(asset.uuid)}]`;
    }
}
var FbxGlTfConvLogLevel;
(function (FbxGlTfConvLogLevel) {
    FbxGlTfConvLogLevel[FbxGlTfConvLogLevel["verbose"] = 0] = "verbose";
    FbxGlTfConvLogLevel[FbxGlTfConvLogLevel["info"] = 1] = "info";
    FbxGlTfConvLogLevel[FbxGlTfConvLogLevel["warning"] = 2] = "warning";
    FbxGlTfConvLogLevel[FbxGlTfConvLogLevel["error"] = 3] = "error";
    FbxGlTfConvLogLevel[FbxGlTfConvLogLevel["fatal"] = 4] = "fatal";
})(FbxGlTfConvLogLevel || (FbxGlTfConvLogLevel = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmJ4LWNvbnZlcnRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jb3JlL2Fzc2V0cy9hc3NldC1oYW5kbGVyL2Fzc2V0cy91dGlscy9mYngtY29udmVydGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBUUEsZ0RBaU5DO0FBdk5ELGdEQUFzQjtBQUN0QixxREFBMEM7QUFDMUMsa0VBQStCO0FBQy9CLHVDQUErRDtBQUcvRCxTQUFnQixrQkFBa0IsQ0FBQyxPQU1sQztJQUNHLE1BQU0sV0FBVyxHQUFHLFVBQVUsQ0FBQztJQUMvQixJQUFJLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxHQUFHLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO0lBRXpELE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLG1CQUFtQixDQUFDLENBQUM7SUFDL0QsSUFBSSxrQkFBRSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1FBQ3RCLFFBQVEsR0FBRyxJQUFJLENBQUM7SUFDcEIsQ0FBQztJQUVELE9BQU87UUFDSCxJQUFJLE9BQU87WUFDUCxPQUFPLE9BQU8sQ0FBQztRQUNuQixDQUFDO1FBRUQsR0FBRyxDQUFDLEtBQVksRUFBRSxTQUFpQjtZQUMvQixPQUFPLGNBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQzNDLENBQUM7UUFFRCxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQVksRUFBRSxTQUFpQjtZQUN6QyxNQUFNLE9BQU8sR0FBYSxFQUFFLENBQUM7WUFFN0IsZUFBZTtZQUNmLE9BQU8sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBRXhDLG9CQUFvQjtZQUNwQixPQUFPLENBQUMsSUFBSSxDQUFDLG1C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QztJQUVELFNBQVMsWUFBWSxDQUFDLElBQVksRUFBRSxLQUFZO1FBQzVDLE9BQU8sR0FBRyxJQUFJLEtBQUssSUFBQSx5QkFBaUIsRUFBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQztJQUN4RCxDQUFDO0FBQ0wsQ0FBQztBQU9ELElBQUssbUJBTUo7QUFORCxXQUFLLG1CQUFtQjtJQUNwQixtRUFBTyxDQUFBO0lBQ1AsNkRBQUksQ0FBQTtJQUNKLG1FQUFPLENBQUE7SUFDUCwrREFBSyxDQUFBO0lBQ0wsK0RBQUssQ0FBQTtBQUNULENBQUMsRUFOSSxtQkFBbUIsS0FBbkIsbUJBQW1CLFFBTXZCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXNzZXQgfSBmcm9tICdAY29jb3MvYXNzZXQtZGInO1xuaW1wb3J0IHsgSUFic3RyYWN0Q29udmVydGVyIH0gZnJvbSAnLi9tb2RlbC1jb252ZXJ0LXJvdXRpbmUnO1xuaW1wb3J0IHBzIGZyb20gJ3BhdGgnO1xuaW1wb3J0IGZzLCB7IHBhdGhFeGlzdHMgfSBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgY3AgZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5pbXBvcnQgeyBpMThuVHJhbnNsYXRlLCBsaW5rVG9Bc3NldFRhcmdldCB9IGZyb20gJy4uLy4uL3V0aWxzJztcbmltcG9ydCB7IEkxOG5LZXlzIH0gZnJvbSAnLi4vLi4vLi4vLi4vLi4vaTE4bi90eXBlcy9nZW5lcmF0ZWQnO1xuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRmJ4Q29udmVydGVyKG9wdGlvbnM6IHtcbiAgICB1bml0Q29udmVyc2lvbj86ICdnZW9tZXRyeS1sZXZlbCcgfCAnaGllcmFyY2h5LWxldmVsJyB8ICdkaXNhYmxlZCc7XG4gICAgYW5pbWF0aW9uQmFrZVJhdGU/OiBudW1iZXI7XG4gICAgcHJlZmVyTG9jYWxUaW1lU3Bhbj86IGJvb2xlYW47XG4gICAgc21hcnRNYXRlcmlhbEVuYWJsZWQ/OiBib29sZWFuO1xuICAgIG1hdGNoTWVzaE5hbWVzPzogYm9vbGVhbjtcbn0pOiBJQWJzdHJhY3RDb252ZXJ0ZXI8c3RyaW5nPiB7XG4gICAgY29uc3Qgb3V0RmlsZU5hbWUgPSAnb3V0LmdsdGYnO1xuICAgIGxldCB7IHRvb2w6IHRvb2xQYXRoIH0gPSByZXF1aXJlKCdAY29jb3MvZmJ4LWdsdGYtY29udicpO1xuXG4gICAgY29uc3QgdGVtcCA9IHRvb2xQYXRoLnJlcGxhY2UoJ2FwcC5hc2FyJywgJ2FwcC5hc2FyLnVucGFja2VkJyk7XG4gICAgaWYgKGZzLmV4aXN0c1N5bmModGVtcCkpIHtcbiAgICAgICAgdG9vbFBhdGggPSB0ZW1wO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGdldCBvcHRpb25zKCkge1xuICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0KGFzc2V0OiBBc3NldCwgb3V0cHV0RGlyOiBzdHJpbmcpIHtcbiAgICAgICAgICAgIHJldHVybiBwcy5qb2luKG91dHB1dERpciwgb3V0RmlsZU5hbWUpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGFzeW5jIGNvbnZlcnQoYXNzZXQ6IEFzc2V0LCBvdXRwdXREaXI6IHN0cmluZykge1xuICAgICAgICAgICAgY29uc3QgY2xpQXJnczogc3RyaW5nW10gPSBbXTtcblxuICAgICAgICAgICAgLy8gPGlucHV0IGZpbGU+XG4gICAgICAgICAgICBjbGlBcmdzLnB1c2gocXVvdFBhdGhBcmcoYXNzZXQuc291cmNlKSk7XG5cbiAgICAgICAgICAgIC8vIC0tdW5pdC1jb252ZXJzaW9uXG4gICAgICAgICAgICBjbGlBcmdzLnB1c2goJy0tdW5pdC1jb252ZXJzaW9uJywgb3B0aW9ucy51bml0Q29udmVyc2lvbiA/PyAnZ2VvbWV0cnktbGV2ZWwnKTtcblxuICAgICAgICAgICAgLy8gLS1hbmltYXRpb24tYmFrZS1yYXRlXG4gICAgICAgICAgICBjbGlBcmdzLnB1c2goJy0tYW5pbWF0aW9uLWJha2UtcmF0ZScsIGAke29wdGlvbnMuYW5pbWF0aW9uQmFrZVJhdGUgPz8gMH1gKTtcblxuICAgICAgICAgICAgLy8gLS1wcmVmZXItbG9jYWwtdGltZS1zcGFuXG4gICAgICAgICAgICAvLyBOb3RlIGZvciBib29sZWFuIHBhcmFtZXRlcnMsIGAtLW8gZmFsc2VgIGRvZXMgbm90IHdvcmsuXG4gICAgICAgICAgICBjbGlBcmdzLnB1c2goYC0tcHJlZmVyLWxvY2FsLXRpbWUtc3Bhbj0ke29wdGlvbnMucHJlZmVyTG9jYWxUaW1lU3BhbiA/PyB0cnVlfWApO1xuXG4gICAgICAgICAgICBjbGlBcmdzLnB1c2goYC0tbWF0Y2gtbWVzaC1uYW1lcz0ke29wdGlvbnMubWF0Y2hNZXNoTmFtZXMgPz8gdHJ1ZX1gKTtcblxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuc21hcnRNYXRlcmlhbEVuYWJsZWQgPz8gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICBjbGlBcmdzLnB1c2goJy0tZXhwb3J0LWZieC1maWxlLWhlYWRlci1pbmZvJyk7XG4gICAgICAgICAgICAgICAgY2xpQXJncy5wdXNoKCctLWV4cG9ydC1yYXctbWF0ZXJpYWxzJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIC0tb3V0XG4gICAgICAgICAgICBjb25zdCBvdXRGaWxlID0gcHMuam9pbihvdXRwdXREaXIsIG91dEZpbGVOYW1lKTtcbiAgICAgICAgICAgIGF3YWl0IGZzLmVuc3VyZURpcihwcy5kaXJuYW1lKG91dEZpbGUpKTtcbiAgICAgICAgICAgIGNsaUFyZ3MucHVzaCgnLS1vdXQnLCBxdW90UGF0aEFyZyhvdXRGaWxlKSk7XG5cbiAgICAgICAgICAgIC8vIC0tZmJtLWRpclxuICAgICAgICAgICAgY29uc3QgZmJtRGlyID0gcHMuam9pbihvdXRwdXREaXIsICcuZmJtJyk7XG4gICAgICAgICAgICBhd2FpdCBmcy5lbnN1cmVEaXIoZmJtRGlyKTtcbiAgICAgICAgICAgIGNsaUFyZ3MucHVzaCgnLS1mYm0tZGlyJywgcXVvdFBhdGhBcmcoZmJtRGlyKSk7XG5cbiAgICAgICAgICAgIC8vIC0tbG9nLWZpbGVcbiAgICAgICAgICAgIGNvbnN0IGxvZ0ZpbGUgPSBnZXRMb2dGaWxlKG91dHB1dERpcik7XG4gICAgICAgICAgICBhd2FpdCBmcy5lbnN1cmVEaXIocHMuZGlybmFtZShsb2dGaWxlKSk7XG4gICAgICAgICAgICBjbGlBcmdzLnB1c2goJy0tbG9nLWZpbGUnLCBxdW90UGF0aEFyZyhsb2dGaWxlKSk7XG5cbiAgICAgICAgICAgIGxldCBjYWxsT2sgPSBhd2FpdCBjYWxsRmJ4R0xURkNvbnYodG9vbFBhdGgsIGNsaUFyZ3MsIG91dHB1dERpcik7XG4gICAgICAgICAgICBpZiAoY2FsbE9rICYmICEoYXdhaXQgcGF0aEV4aXN0cyhvdXRGaWxlKSkpIHtcbiAgICAgICAgICAgICAgICBjYWxsT2sgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBUb29sIEZCWC1nbFRGLWNvbnYgZW5kcyBhYm5vcm1hbGx5KHNwYXduICR7dG9vbFBhdGh9ICR7Y2xpQXJncy5qb2luKCcgJyl9KS5gKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGNhbGxPaztcbiAgICAgICAgfSxcblxuICAgICAgICBhc3luYyBwcmludExvZ3MoYXNzZXQsIG91dHB1dERpcikge1xuICAgICAgICAgICAgY29uc3QgbG9nRmlsZSA9IGdldExvZ0ZpbGUob3V0cHV0RGlyKTtcblxuICAgICAgICAgICAgaWYgKGF3YWl0IHBhdGhFeGlzdHMobG9nRmlsZSkpIHtcbiAgICAgICAgICAgICAgICBsZXQgbG9nczogSUZieEdsVGZDb252TG9nIHwgdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGxvZ3MgPSBhd2FpdCBmcy5yZWFkSnNvbihsb2dGaWxlKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnTm8gbG9ncyBhcmUgZ2VuZXJhdGVkLCBpdCBzaG91bGQgbm90IGhhcHBlbiBpbmRlZWQuJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGxvZ3MpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFdlIGFyZSBsYXp5IGhlcmUuXG4gICAgICAgICAgICAgICAgICAgIC8vIElmIGFueSBleGNlcHRpb24gaGFwcGVuIGR1ZSB0byBsb2cgcHJpbnRpbmcuXG4gICAgICAgICAgICAgICAgICAgIC8vIFdlIHNpbXBseSBpZ25vcmUuXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmludENvbnZlcnRlckxvZ3MobG9ncywgYXNzZXQpO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gcXVvdFBhdGhBcmcocDogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiBgXCIke3B9XCJgO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNhbGxGYnhHTFRGQ29udih0b29sOiBzdHJpbmcsIGFyZ3M6IHN0cmluZ1tdLCBjd2Q6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8Ym9vbGVhbj4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY2hpbGQgPSBjcC5zcGF3bihxdW90UGF0aEFyZyh0b29sKSwgYXJncywge1xuICAgICAgICAgICAgICAgIGN3ZCxcbiAgICAgICAgICAgICAgICBzaGVsbDogdHJ1ZSxcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBsZXQgb3V0cHV0ID0gJyc7XG4gICAgICAgICAgICBpZiAoY2hpbGQuc3Rkb3V0KSB7XG4gICAgICAgICAgICAgICAgY2hpbGQuc3Rkb3V0Lm9uKCdkYXRhJywgKGRhdGEpID0+IChvdXRwdXQgKz0gZGF0YSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IGVyck91dHB1dCA9ICcnO1xuICAgICAgICAgICAgaWYgKGNoaWxkLnN0ZGVycikge1xuICAgICAgICAgICAgICAgIGNoaWxkLnN0ZGVyci5vbignZGF0YScsIChkYXRhKSA9PiAoZXJyT3V0cHV0ICs9IGRhdGEpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNoaWxkLm9uKCdlcnJvcicsIHJlamVjdCk7XG4gICAgICAgICAgICBjaGlsZC5vbignY2xvc2UnLCAoY29kZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChvdXRwdXQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cob3V0cHV0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGVyck91dHB1dCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVyck91dHB1dCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIG5vbi16ZXJvIGV4aXQgY29kZSBpcyBmYWlsdXJlXG4gICAgICAgICAgICAgICAgaWYgKGNvZGUgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0cnVlKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY29kZSA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRGVmaW5lZCBieSBGQlgtZ2xURi1jb252OlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRXJyb3IgaGFwcGVuZWQsIHRoZSBjb252ZXJ0IHJlc3VsdCBtYXkgbm90IGNvbXBsZXRlLlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQnV0IGVycm9ycyBhcmUgbG9nZ2VkLlxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNvZGUgPT09IDMyMjEyMjU3ODEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoaTE4blRyYW5zbGF0ZSgnaW1wb3J0ZXIuZmJ4LmZieF9nbHRmX2NvbnYubWlzc2luZ19kbGwnKSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY29kZSA9PT0gMTI2ICYmIHByb2Nlc3MucGxhdGZvcm0gPT09ICdkYXJ3aW4nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGkxOG5UcmFuc2xhdGUoJ2ltcG9ydGVyLmZieC5mYnhfZ2x0Zl9jb252LmJhZF9jcHUnKSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBGQlgtZ2xURi1jb252IGV4aXN0ZWQgd2l0aCB1bmV4cGVjdGVkIG5vbi16ZXJvIGNvZGUgJHtjb2RlfWApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZmFsc2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRMb2dGaWxlKG91dHB1dERpcjogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiBwcy5qb2luKG91dHB1dERpciwgJ2xvZy5qc29uJyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcHJpbnRDb252ZXJ0ZXJMb2dzKGxvZ3M6IElGYnhHbFRmQ29udkxvZywgYXNzZXQ6IEFzc2V0KSB7XG4gICAgICAgIGNvbnN0IGdldExvZ2dlciA9IChsZXZlbDogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICBsZXQgbG9nZ2VyOiAodGV4dDogc3RyaW5nKSA9PiB2b2lkO1xuICAgICAgICAgICAgc3dpdGNoIChsZXZlbCkge1xuICAgICAgICAgICAgICAgIGNhc2UgRmJ4R2xUZkNvbnZMb2dMZXZlbC52ZXJib3NlOlxuICAgICAgICAgICAgICAgICAgICBsb2dnZXIgPSBjb25zb2xlLmRlYnVnO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIEZieEdsVGZDb252TG9nTGV2ZWwuaW5mbzpcbiAgICAgICAgICAgICAgICAgICAgbG9nZ2VyID0gY29uc29sZS5sb2c7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgRmJ4R2xUZkNvbnZMb2dMZXZlbC53YXJuaW5nOlxuICAgICAgICAgICAgICAgICAgICBsb2dnZXIgPSBjb25zb2xlLndhcm47XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgRmJ4R2xUZkNvbnZMb2dMZXZlbC5lcnJvcjpcbiAgICAgICAgICAgICAgICBjYXNlIEZieEdsVGZDb252TG9nTGV2ZWwuZmF0YWw6XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgbG9nZ2VyID0gY29uc29sZS5lcnJvcjtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gKHRleHQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgIGxvZ2dlci5jYWxsKGNvbnNvbGUsIGFkZEFzc2V0TWFyayh0ZXh0LCBhc3NldCkpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgaW5oZXJpdFR5cGVNZXNzYWdlQ29kZSA9ICd1bnN1cHBvcnRlZF9pbmhlcml0X3R5cGUnO1xuICAgICAgICBjb25zdCBtZXJnZWRJbmhlcml0VHlwZU1lc3NhZ2VzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmdbXT4gPSB7fTtcbiAgICAgICAgZm9yIChjb25zdCB7IGxldmVsLCBtZXNzYWdlIH0gb2YgbG9ncykge1xuICAgICAgICAgICAgY29uc3QgbG9nZ2VyID0gZ2V0TG9nZ2VyKGxldmVsKTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgbWVzc2FnZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBsb2dnZXIobWVzc2FnZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvZGUgPSBtZXNzYWdlLmNvZGU7XG4gICAgICAgICAgICAgICAgaWYgKGNvZGUgPT09IGluaGVyaXRUeXBlTWVzc2FnZUNvZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdHlwZSA9IG1lc3NhZ2UudHlwZTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgbm9kZSA9IG1lc3NhZ2Uubm9kZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEodHlwZSBpbiBtZXJnZWRJbmhlcml0VHlwZU1lc3NhZ2VzKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWVyZ2VkSW5oZXJpdFR5cGVNZXNzYWdlc1t0eXBlXSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIG1lcmdlZEluaGVyaXRUeXBlTWVzc2FnZXNbdHlwZV0ucHVzaChub2RlKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBjb2RlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICBsb2dnZXIoZ2V0STE4bk1lc3NhZ2UoY29kZSwgbWVzc2FnZSkpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGxvZ2dlcihKU09OLnN0cmluZ2lmeShtZXNzYWdlLCB1bmRlZmluZWQsIDIpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChjb25zdCBbdHlwZSwgbm9kZXNdIG9mIE9iamVjdC5lbnRyaWVzKG1lcmdlZEluaGVyaXRUeXBlTWVzc2FnZXMpKSB7XG4gICAgICAgICAgICBnZXRMb2dnZXIoRmJ4R2xUZkNvbnZMb2dMZXZlbC52ZXJib3NlKShcbiAgICAgICAgICAgICAgICBnZXRJMThuTWVzc2FnZShpbmhlcml0VHlwZU1lc3NhZ2VDb2RlLCB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGUsXG4gICAgICAgICAgICAgICAgICAgIG5vZGVzLFxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldEkxOG5NZXNzYWdlKGNvZGU6IHN0cmluZywgbWVzc2FnZT86IGFueSkge1xuICAgICAgICByZXR1cm4gaTE4blRyYW5zbGF0ZShgaW1wb3J0ZXIuZmJ4LmZieEdsVGZDb252LiR7Y29kZX1gIGFzIEkxOG5LZXlzLCBtZXNzYWdlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhZGRBc3NldE1hcmsodGV4dDogc3RyaW5nLCBhc3NldDogQXNzZXQpIHtcbiAgICAgICAgcmV0dXJuIGAke3RleHR9IFske2xpbmtUb0Fzc2V0VGFyZ2V0KGFzc2V0LnV1aWQpfV1gO1xuICAgIH1cbn1cblxudHlwZSBJRmJ4R2xUZkNvbnZMb2cgPSBBcnJheTx7XG4gICAgbGV2ZWw6IG51bWJlcjtcbiAgICBtZXNzYWdlOiBzdHJpbmcgfCAoUmVjb3JkPHN0cmluZywgc3RyaW5nPiAmIHsgY29kZT86IHN0cmluZyB9KTtcbn0+O1xuXG5lbnVtIEZieEdsVGZDb252TG9nTGV2ZWwge1xuICAgIHZlcmJvc2UsXG4gICAgaW5mbyxcbiAgICB3YXJuaW5nLFxuICAgIGVycm9yLFxuICAgIGZhdGFsLFxufVxuIl19