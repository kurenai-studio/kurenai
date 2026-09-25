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
exports.WindowsPackTool = void 0;
const default_1 = require("../base/default");
const fs = __importStar(require("fs-extra"));
const ps = __importStar(require("path"));
const os = __importStar(require("os"));
const utils_1 = require("../utils");
const cocosConfig_1 = require("../cocosConfig");
class WindowsPackTool extends default_1.NativePackTool {
    async create() {
        await this.copyCommonTemplate();
        await this.copyPlatformTemplate();
        await this.generateCMakeConfig();
        await this.executeCocosTemplateTask();
        await this.encryptScripts();
        return true;
    }
    async generate() {
        const nativePrjDir = this.paths.nativePrjDir;
        const cmakePath = ps.join(this.paths.platformTemplateDirInPrj, 'CMakeLists.txt');
        if (!fs.existsSync(cmakePath)) {
            throw new Error(`CMakeLists.txt not found in ${cmakePath}`);
        }
        if (!fs.existsSync(nativePrjDir)) {
            utils_1.cchelper.makeDirectoryRecursive(nativePrjDir);
        }
        let generateArgs = [];
        if (!fs.existsSync(ps.join(nativePrjDir, 'CMakeCache.txt'))) {
            const vsVersion = this.getCmakeGenerator();
            // const g = '';
            if (vsVersion) {
                const optlist = cocosConfig_1.cocosConfig.cmake.windows.generators.filter((x) => x.V === vsVersion);
                if (optlist.length > 0) {
                    generateArgs.push(`-G"${optlist[0].G}"`);
                }
                if (Number.parseInt(vsVersion) <= 2017) {
                    generateArgs.push('-A', this.params.platformParams.targetPlatform);
                }
            }
            else {
                generateArgs = generateArgs.concat(await this.windowsSelectCmakeGeneratorArgs());
            }
        }
        this.appendCmakeCommonArgs(generateArgs);
        await utils_1.toolHelper.runCmake([`-S"${utils_1.cchelper.fixPath(this.paths.platformTemplateDirInPrj)}"`, `-B"${utils_1.cchelper.fixPath(this.paths.nativePrjDir)}"`].concat(generateArgs));
        return true;
    }
    async make() {
        const nativePrjDir = this.paths.nativePrjDir;
        await utils_1.toolHelper.runCmake(['--build', `"${utils_1.cchelper.fixPath(nativePrjDir)}"`, '--config', this.params.debug ? 'Debug' : 'Release', '--', '-verbosity:quiet']);
        return true;
    }
    static async openWithIDE(projPath) {
        await utils_1.toolHelper.runCmake(['--open', `"${utils_1.cchelper.fixPath(projPath)}"`]);
        return true;
    }
    async windowsSelectCmakeGeneratorArgs() {
        console.log(`selecting visual studio generator ...`);
        const visualstudioGenerators = cocosConfig_1.cocosConfig.cmake.windows.generators;
        const testProjDir = await fs.mkdtemp(ps.join(os.tmpdir(), 'cmakeTest_'));
        const testCmakeListsPath = ps.join(testProjDir, 'CMakeLists.txt');
        const testCppFile = ps.join(testProjDir, 'test.cpp');
        {
            const cmakeContent = `
            cmake_minimum_required(VERSION 3.8)
            set(APP_NAME test-cmake)
            project(\${APP_NAME} CXX)
            add_library(\${APP_NAME} test.cpp)
            `;
            const cppSrc = `
            #include<iostream>
            int main(int argc, char **argv)
            {
                std::cout << "Hello World" << std::endl;
                return 0;
            }
            `;
            await fs.writeFile(testCmakeListsPath, cmakeContent);
            await fs.writeFile(testCppFile, cppSrc);
        }
        const availableGenerators = [];
        for (const cfg of visualstudioGenerators) {
            const nativePrjDir = ps.join(testProjDir, `build_${cfg.G.replace(/ /g, '_')}`);
            const args = [`-S"${testProjDir}"`, `-G"${cfg.G}"`, `-B"${nativePrjDir}"`];
            args.push('-A', this.params.platformParams.targetPlatform);
            await fs.mkdir(nativePrjDir);
            try {
                await utils_1.toolHelper.runCmake(args, nativePrjDir);
                availableGenerators.push(cfg.G);
                break;
            }
            catch (error) {
                console.debug(error);
            }
            await utils_1.cchelper.removeDirectoryRecursive(nativePrjDir);
        }
        await utils_1.cchelper.removeDirectoryRecursive(testProjDir);
        const ret = [];
        if (availableGenerators.length === 0) {
            return []; // use cmake default option -G
        }
        const opt = visualstudioGenerators.filter((x) => x.G === availableGenerators[0])[0];
        ret.push('-A', this.params.platformParams.targetPlatform);
        console.log(` using ${opt.G}`);
        return ret;
    }
    getCmakeGenerator() {
        return this.params.platformParams.vsVersion || '';
    }
    async run() {
        const executableDir = ps.join(this.paths.nativePrjDir, this.params.debug ? 'Debug' : 'Release');
        const targetFile = this.getExecutableNameOrDefault();
        const executableFile = ps.join(executableDir, targetFile + '.exe');
        if (!executableFile || !fs.existsSync(executableFile)) {
            throw new Error(`[windows run] '${targetFile}' is not found within ' + ${executableDir}!`);
        }
        await utils_1.cchelper.runCmd(ps.basename(executableFile), [], false, executableDir);
        return true;
    }
}
exports.WindowsPackTool = WindowsPackTool;
//# sourceMappingURL=windows.js.map