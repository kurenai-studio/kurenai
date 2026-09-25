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
exports.OHOSPackTool = void 0;
const default_1 = require("../base/default");
const ps = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const utils_1 = require("../utils");
const crypto_1 = require("crypto");
class OHOSPackTool extends default_1.NativePackTool {
    get projectDistPath() {
        return this.paths.platformTemplateDirInPrj;
    }
    async create() {
        var _a;
        await this.copyCommonTemplate();
        await this.copyPlatformTemplate();
        await this.generateCMakeConfig();
        await this.executeCocosTemplateTask();
        const ohosProjDir = this.projectDistPath;
        const cocosXRoot = ps.normalize(utils_1.Paths.nativeRoot);
        const platformParams = this.params.platformParams;
        // check directories
        if (!fs.existsSync(platformParams.sdkPath)) {
            throw new Error(`Directory hwsdk.dir ${platformParams.sdkPath} not exists`);
        }
        if (!fs.existsSync(platformParams.ndkPath)) {
            throw new Error(`Directory native.dir ${platformParams.ndkPath} not exists`);
        }
        // local.properties
        await utils_1.cchelper.replaceInFile([
            { reg: '^hwsdk\\.dir.*', text: `hwsdk.dir=${utils_1.cchelper.fixPath(platformParams.sdkPath)}` },
            { reg: '^native\\.dir.*', text: `native.dir=${utils_1.cchelper.fixPath(platformParams.ndkPath)}` },
        ], ps.join(ohosProjDir, 'local.properties'));
        // settings.gradle
        await utils_1.cchelper.replaceInFile([
            { reg: '\\$\\{ENGINE_ROOT\\}', text: utils_1.cchelper.fixPath(cocosXRoot) },
            { reg: '^rootProject\\.name.*', text: `rootProject.name = "${this.params.projectName}"` },
        ], ps.join(ohosProjDir, 'settings.gradle'));
        // gradle.properties
        await utils_1.cchelper.replaceInFile([
            { reg: '^RES_PATH.*', text: `RES_PATH=${utils_1.cchelper.fixPath(this.paths.buildDir)}` },
            { reg: '^ENGINE_ROOT.*', text: `ENGINE_ROOT=${utils_1.cchelper.fixPath(cocosXRoot)}` },
            { reg: '^COMMON_DIR.*', text: `COMMON_DIR=${utils_1.cchelper.fixPath(process.env.COMMON_DIR || '')}` },
        ], ps.join(ohosProjDir, 'gradle.properties'));
        try {
            // try update orientation, failures allowed
            const cfgFile = ps.join(ohosProjDir, 'entry/src/main/config.json');
            const configJSON = await fs.readJSON(cfgFile);
            const abilities = (_a = configJSON.module) === null || _a === void 0 ? void 0 : _a.abilities;
            if ((abilities === null || abilities === void 0 ? void 0 : abilities.length) > 0) {
                const setting = platformParams.orientation;
                let orientation = 'landscape';
                if (setting.portrait && (setting.landscapeRight || setting.landscapeLeft)) {
                    orientation = 'unspecified';
                }
                else if (setting.portrait && !(setting.landscapeLeft || setting.landscapeRight)) {
                    orientation = 'portrait';
                }
                else if (setting.landscapeLeft || setting.landscapeRight) {
                    orientation = 'landscape';
                }
                else {
                    orientation = 'unspecified';
                }
                // TODO 接口定义？
                abilities.forEach((ability) => {
                    ability.orientation = orientation;
                });
            }
            configJSON.app.bundleName = platformParams.packageName;
            await fs.outputJSON(cfgFile, configJSON, { spaces: 2 });
        }
        catch (e) {
            console.error(e);
        }
        try {
            // try update app name, failures allowed
            const stringJson = ps.join(ohosProjDir, 'entry/src/main/resources/base/element/string.json');
            const stringJsonObj = JSON.parse(await fs.readFile(stringJson, 'utf8'));
            const stringList = stringJsonObj['string'] = stringJsonObj['string'] || [];
            let appNameItem = stringList.find((x) => x.name === 'app_name');
            if (!appNameItem) {
                appNameItem = { name: 'app_name', value: 'CocosGame' };
                stringList.push(appNameItem);
            }
            appNameItem.value = this.params.projectName || 'CocosGame';
            await fs.outputJSON(stringJson, stringJsonObj, { spaces: 2 });
        }
        catch (e) {
            console.error(e);
        }
        await this.encryptScripts();
        return true;
    }
    async make() {
        utils_1.cchelper.checkJavaHome();
        const projectDir = this.paths.platformTemplateDirInPrj;
        let gradle = 'gradlew';
        if (process.platform === 'win32') {
            gradle += '.bat';
        }
        gradle = ps.join(projectDir, gradle);
        try {
            fs.accessSync(gradle, fs.constants.X_OK);
        }
        catch (e) {
            fs.chmodSync(gradle, 0o774);
        }
        let buildMode = '';
        const outputMode = this.params.debug ? 'Debug' : 'Release';
        // compile android
        buildMode = `assemble${outputMode}`;
        // await cchelper.runCmd(gradle, [buildMode /*"--quiet",*/ /*"--build-cache", "--project-cache-dir", nativePrjDir*/], false, projectDir);
        await utils_1.cchelper.runCmd(gradle, [buildMode], false, projectDir);
        return true;
    }
    // --------------- run ------------------//
    async run() {
        // $ hdc shell am force-stop com.cocos.ohos.demo1
        // $ hdc shell bm uninstall com.cocos.ohos.demo1
        // $ hdc file send ohos/entry/build/outputs/hap/debug/entry-debug-signed.hap
        //      /sdcard/cb347818fd9e4de2b63eab4af150e0fa/entry-debug-signed.hap
        // $ hdc shell bm install -p /sdcard/cb347818fd9e4de2b63eab4af150e0fa/
        // $ hdc shell rm -rf /sdcard/cb347818fd9e4de2b63eab4af150e0fa
        // $ hdc shell am start -n
        // "com.cocos.ohos.demo1/com.example.cocosdemo.MainAbilityShellActivity"
        const packageName = this.params.platformParams.packageName;
        const projectDir = this.paths.platformTemplateDirInPrj;
        const outputMode = this.params.debug ? 'debug' : 'release';
        // const hapFile = ps.join(projectDir,
        // `entry/build/outputs/hap/${outputMode}/entry-${outputMode}-signed.hap`);
        const hapFile = this.selectHap(projectDir, outputMode);
        if (!fs.existsSync(hapFile)) {
            throw new Error(`[ohos run] File ${hapFile} does not exist!`);
        }
        const hdc = this.hdcPath;
        if (!hdc) {
            throw new Error(`[ohos run] Failed to locate hdc!`);
        }
        const tmpdir = `/sdcard/${this.randString(32)}`;
        try {
            await utils_1.cchelper.runCmd(hdc, ['shell', 'am', 'force-stop', packageName], true);
            await utils_1.cchelper.runCmd(hdc, ['shell', 'bm', 'uninstall', packageName], true);
            await utils_1.cchelper.runCmd(hdc, [
                'file', 'send', utils_1.cchelper.fixPath(hapFile),
                utils_1.cchelper.fixPath(ps.join(tmpdir, 'entry-debug-signed.hap')),
            ], false);
            await utils_1.cchelper.runCmd(hdc, ['shell', 'bm', 'install', '-p', tmpdir], false);
            // TODO: Ability path should be configurable.
            await utils_1.cchelper.runCmd(hdc, [
                'shell', 'am', 'start', '-n',
                `"${packageName}/com.example.cocosdemo.MainAbilityShellActivity"`,
            ], false);
        }
        finally {
            await utils_1.cchelper.runCmd(hdc, ['shell', 'rm', '-rf', tmpdir], true);
        }
        return true;
    }
    selectHap(projectDir, outputMode) {
        const outputDir = ps.join(projectDir, `entry/build/outputs/hap/${outputMode}`);
        return ps.join(outputDir, this.selectHapFile(outputDir, outputMode));
    }
    selectHapFile(outputDir, outputMode) {
        if (!fs.existsSync(outputDir)) {
            throw new Error(`directory ${outputDir} does not exist!`);
        }
        const hapFiles = fs.readdirSync(outputDir).filter(x => x.endsWith(`.hap`));
        if (hapFiles.length === 0) {
            throw new Error(`no hap found in ${outputDir}`);
        }
        else if (hapFiles.length === 1) {
            return hapFiles[0];
        }
        const opt1 = hapFiles.filter(x => x.endsWith('-signed.hap') && x.startsWith(`entry-${outputMode}-`));
        const opt2 = hapFiles.filter(x => x.startsWith(`entry-${outputMode}`));
        return opt1.length > 0 ? opt1[0] :
            (opt2.length > 0 ? opt2[0] : hapFiles[0]);
    }
    get hdcPath() {
        if (this.params.platformParams.sdkPath) {
            return ps.join(this.params.platformParams.sdkPath, 'toolchains/hdc');
        }
        return null;
    }
    randString(n) {
        if (n <= 0) {
            return '';
        }
        let rs = '';
        try {
            rs = (0, crypto_1.randomBytes)(Math.ceil(n / 2)).toString('hex').slice(0, n);
        }
        catch (ex) {
            rs = '';
            const r = n % 8;
            const q = (n - r) / 8;
            let i = 0;
            for (; i < q; i++) {
                rs += Math.random().toString(16).slice(2);
            }
            if (r > 0) {
                rs += Math.random().toString(16).slice(2, i);
            }
        }
        return rs;
    }
}
exports.OHOSPackTool = OHOSPackTool;
//# sourceMappingURL=ohos.js.map