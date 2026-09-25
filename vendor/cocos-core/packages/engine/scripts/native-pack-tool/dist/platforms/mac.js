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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MacPackTool = void 0;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs-extra"));
const ps = __importStar(require("path"));
const utils_1 = require("../utils");
const mac_os_1 = require("./mac-os");
class MacPackTool extends mac_os_1.MacOSPackTool {
    async create() {
        await super.create();
        await this.encryptScripts();
        return true;
    }
    async generate() {
        if (!await this.checkIfXcodeInstalled()) {
            console.error(`Please check if Xcode is installed.`);
        }
        if (this.shouldSkipGenerate()) {
            return false;
        }
        const nativePrjDir = this.paths.nativePrjDir;
        if (!fs.existsSync(nativePrjDir)) {
            utils_1.cchelper.makeDirectoryRecursive(nativePrjDir);
        }
        const ver = utils_1.toolHelper.getXcodeMajorVerion() >= 12 ? "12" : "1";
        const cmakeArgs = ['-S', `"${this.paths.platformTemplateDirInPrj}"`, '-GXcode', '-T', `buildsystem=${ver}`,
            `-B"${nativePrjDir}"`, '-DCMAKE_SYSTEM_NAME=Darwin'];
        this.appendCmakeCommonArgs(cmakeArgs);
        await utils_1.toolHelper.runCmake(cmakeArgs);
        await this.modifyXcodeProject();
        return true;
    }
    async make() {
        const nativePrjDir = this.paths.nativePrjDir;
        const platform = this.isAppleSilicon() ? `-arch arm64` : `-arch x86_64`;
        await utils_1.toolHelper.runCmake(["--build", `"${nativePrjDir}"`, "--config", this.params.debug ? 'Debug' : 'Release', "--", "-quiet", platform]);
        return true;
    }
    async run() {
        await this.macRun(this.params.projectName);
        return true;
    }
    macOpen(app) {
        return new Promise((resolve, reject) => {
            console.log(`open ${app}`);
            const cp = (0, child_process_1.spawn)(`open`, [`"${app}"`], {
                shell: true,
                env: process.env,
            });
            cp.stdout.on('data', (data) => {
                console.log(`[open app] ${data}`);
            });
            cp.stderr.on('data', (data) => {
                console.error(`[open app error] ${data}`);
            });
            cp.on('close', (code, sig) => {
                console.log(`${app} exit with ${code}, sig: ${sig}`);
                if (code !== 0) {
                    reject(`[open app error] Child process exit width code ${code}`);
                }
                else {
                    resolve();
                }
            });
            cp.on('exit', (code, sig) => {
                resolve();
            });
            cp.on('error', (err) => {
                console.log(`${app} exit with error: ${err.message}`);
                reject(err);
            });
        });
    }
    async macRun(projectName) {
        const debugDir = ps.join(this.paths.nativePrjDir, this.params.debug ? 'Debug' : 'Release');
        if (!fs.existsSync(debugDir)) {
            throw new Error(`[mac run] ${debugDir} is not exist!`);
        }
        let appPath;
        if (projectName) {
            appPath = ps.join(debugDir, `${projectName}-desktop.app`);
            if (fs.existsSync(appPath)) {
                await this.macOpen(appPath);
                return;
            }
        }
        const appList = fs.readdirSync(debugDir).filter((x) => x.endsWith('.app'));
        if (appList.length === 1) {
            await this.macOpen(ps.join(debugDir, appList[0]));
            return;
        }
        throw new Error(`found ${appList.length} apps, failed to open.`);
    }
}
exports.MacPackTool = MacPackTool;
//# sourceMappingURL=mac.js.map