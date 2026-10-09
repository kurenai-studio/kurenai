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
