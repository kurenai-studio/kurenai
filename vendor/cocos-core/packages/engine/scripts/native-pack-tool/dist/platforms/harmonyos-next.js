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
exports.HarmonyOSNextPackTool = void 0;
const default_1 = require("../base/default");
const ps = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const utils_1 = require("../utils");
const crypto_1 = require("crypto");
const fs_extra_1 = require("fs-extra");
const JSON5 = __importStar(require("json5"));
const fs_1 = require("fs");
class HarmonyOSNextPackTool extends default_1.NativePackTool {
    initEnv() {
        this.setEnv('OHOS_SDK_HOME', this.params.platformParams.sdkPath);
    }
    get projectDistPath() {
        return this.paths.platformTemplateDirInPrj;
    }
    async create() {
        await this.copyCommonTemplate();
        await this.copyPlatformTemplate();
        await this.generateCMakeConfig();
        const ohosProjDir = this.projectDistPath;
        const platformParams = this.params.platformParams;
        const assetsDir = this.paths.buildAssetsDir;
        // local.properties
        await utils_1.cchelper.replaceInFile([
            { reg: '^sdk\\.dir.*', text: `sdk.dir=${platformParams.sdkPath}` },
        ], ps.join(ohosProjDir, 'local.properties'));
        // entry/build-profile.json5
        const buildCfgFile = ps.join(ohosProjDir, 'entry/build-profile.json5');
        await utils_1.cchelper.replaceInFile([
            { reg: 'DRES_DIR=[^ ]*', text: `DRES_DIR=${utils_1.cchelper.fixPath(this.paths.buildDir)}` },
            { reg: 'DCOMMON_DIR=[^ ]*', text: `DCOMMON_DIR=${utils_1.cchelper.fixPath(process.env.COMMON_DIR || '')}` },
            { reg: /"compileSdkVersion": *,/, text: `"compileSdkVersion": ${platformParams.apiLevel},}` },
        ], buildCfgFile);
        //write abi
        try {
            const abiFilters = (platformParams.appABIs && platformParams.appABIs.length > 0) ? platformParams.appABIs : ['armeabi-v7a'];
            let buildCfgContent = fs.readFileSync(buildCfgFile);
            let buildCfgJson = JSON5.parse(buildCfgContent.toString());
            buildCfgJson.buildOption.externalNativeOptions.abiFilters = abiFilters;
            fs.writeFileSync(buildCfgFile, JSON5.stringify(buildCfgJson, null, 2));
        }
        catch (e) {
            console.log(`rewrite buildCfgJson err: ${e}`);
        }
        const moduleFile = ps.join(ohosProjDir, 'entry/src/main/module.json5');
        let moduleJSON = this.readJSON5Sync(moduleFile);
        const orientationCfg = platformParams.orientation;
        if (orientationCfg.landscapeLeft && orientationCfg.landscapeRight && orientationCfg.portrait) {
            moduleJSON.module.abilities[0].orientation = 'auto_rotation';
        }
        else if (orientationCfg.landscapeRight && !orientationCfg.landscapeLeft) {
            moduleJSON.module.abilities[0].orientation = 'landscape';
        }
        else if (!orientationCfg.landscapeRight && orientationCfg.landscapeLeft) {
            moduleJSON.module.abilities[0].orientation = 'landscape_inverted';
        }
        else if (orientationCfg.landscapeRight && orientationCfg.landscapeLeft) {
            moduleJSON.module.abilities[0].orientation = 'auto_rotation_landscape';
        }
        else if (orientationCfg.portrait) {
            moduleJSON.module.abilities[0].orientation = 'portrait';
        }
        const deviceTypeCfg = platformParams.deviceTypes;
        // 删除模板中的 deviceTypes 配置，重新生成
        moduleJSON.module.deviceTypes = [];
        if (deviceTypeCfg.phone) {
            moduleJSON.module.deviceTypes.push('phone');
        }
        if (deviceTypeCfg.tablet) {
            moduleJSON.module.deviceTypes.push('tablet');
        }
        if (deviceTypeCfg.pc_2in1) {
            moduleJSON.module.deviceTypes.push('2in1');
        }
        if (deviceTypeCfg.tv) {
            moduleJSON.module.deviceTypes.push('tv');
        }
        if (deviceTypeCfg.wearable) {
            moduleJSON.module.deviceTypes.push('wearable');
        }
        if (deviceTypeCfg.car) {
            moduleJSON.module.deviceTypes.push('car');
        }
        if (deviceTypeCfg.default) {
            moduleJSON.module.deviceTypes.push('default');
        }
        (0, fs_extra_1.outputJSONSync)(moduleFile, moduleJSON, { spaces: 2 });
        // copy jsb-adapter to entry/src/main/ets/cocos/jsb-adapter
        const mainDir = ps.join(ohosProjDir, 'entry/src/main');
        await utils_1.cchelper.copyFileSync("", ps.join(assetsDir, 'jsb-adapter/engine-adapter.js'), "", ps.join(mainDir, 'ets/cocos/jsb-adapter/engine-adapter.js'));
        await utils_1.cchelper.copyFileSync("", ps.join(assetsDir, 'jsb-adapter/web-adapter.js'), "", ps.join(mainDir, 'ets/cocos/jsb-adapter/web-adapter.js'));
        const cfgFile = ps.join(ohosProjDir, 'AppScope/app.json5');
        let configJSON = this.readJSON5Sync(cfgFile);
        configJSON.app.bundleName = platformParams.packageName;
        (0, fs_extra_1.outputJSONSync)(cfgFile, configJSON, { spaces: 2 });
        const appScopeStringJSONPath = ps.join(ohosProjDir, 'AppScope/resources/base/element/string.json');
        const appScopeStringJSON = fs.readJSONSync(appScopeStringJSONPath);
        appScopeStringJSON.string.find((item) => item.name === 'app_name').value = this.params.projectName;
        (0, fs_extra_1.outputJSONSync)(appScopeStringJSONPath, appScopeStringJSON, { spaces: 2 });
        const stringJSONPath = ps.join(ohosProjDir, 'entry/src/main/resources/base/element/string.json');
        const stringJSON = fs.readJSONSync(stringJSONPath);
        stringJSON.string.find((item) => item.name === 'MainAbility_label').value = this.params.projectName;
        (0, fs_extra_1.outputJSONSync)(stringJSONPath, stringJSON, { spaces: 2 });
        const packageJsonPath = ps.join(ohosProjDir, 'oh-package.json5');
        const packageJson = this.readJSON5Sync(packageJsonPath);
        packageJson.name = this.params.projectName;
        (0, fs_1.writeFileSync)(packageJsonPath, JSON5.stringify(packageJson, null, 4));
        await this.encryptScripts();
        return true;
    }
    async make() {
        this.initEnv();
        const ohosProjDir = this.paths.platformTemplateDirInPrj;
        if (!fs.existsSync(ps.join(ohosProjDir, 'node_modules'))) {
            console.debug(`Start install project ${ohosProjDir}`);
            //set OpenHarmony npm repo
            await utils_1.cchelper.runCmd('npm', ['config', 'set', '@ohos:registry=https://repo.harmonyos.com/npm/'], false, ohosProjDir);
            // install
            await utils_1.cchelper.runCmd('npm', ['i'], false, ohosProjDir);
        }
        console.debug(`Start buildOhosHap in ${ohosProjDir}`);
        // npm run buildOhosHap
        await utils_1.cchelper.runCmd('npm', ['run', 'build'], false, ohosProjDir);
        return true;
    }
    static async openWithIDE(projPath, DevEcoDir) {
        let DevEcoFile = "./devecostudio";
        if (!DevEcoDir || !fs.existsSync(DevEcoDir)) {
            throw new Error(`deveco's runnable file Dir not set or not exist`);
        }
        if (process.platform === 'win32') {
            DevEcoFile = "devecostudio.bat";
            projPath = projPath.replace(/\\/g, '/');
            DevEcoDir = DevEcoDir.replace(/\\/g, '/');
        }
        utils_1.cchelper.runCmd(DevEcoFile, [projPath], false, DevEcoDir);
        return true;
    }
    // --------------- run ------------------//
    async run() {
        this.initEnv();
        const sdkPath = process.env['OHOS_SDK_HOME'];
        if (!sdkPath) {
            return false;
        }
        const hdc = this.findHDCTool(sdkPath);
        const hdcCwd = ps.dirname(hdc);
        const hdcExe = "hdc_std";
        const projectDir = this.paths.platformTemplateDirInPrj;
        const packageName = this.params.platformParams.packageName;
        let configJson = this.readJSON5Sync(ps.join(projectDir, 'entry/src/main/module.json5'));
        //const moduleId = configJson.module.package + configJson.module.abilities[0].name;
        const ability = configJson.module.abilities[0].name;
        const moduleName = configJson.module.name;
        const hapFile = this.selectHapFile(projectDir);
        console.debug(`Start run hap ${hapFile} ...`);
        console.debug(`${hdc} uninstall ${packageName}`);
        await utils_1.cchelper.runCmd(hdcExe, ['uninstall', packageName], false, hdcCwd);
        console.debug(`${hdc} install -r ${hapFile}`);
        await utils_1.cchelper.runCmd(hdcExe, ['install', '-r', hapFile], false, hdcCwd);
        console.debug(`${hdc} shell aa start -a ${ability} -b ${packageName}`);
        await utils_1.cchelper.runCmd(hdcExe, ['shell', 'aa', 'start', '-a', ability, '-b', packageName, '-m', moduleName], false, hdcCwd);
        return true;
    }
    findHDCTool(sdkPath) {
        const versionList = fs.readdirSync(ps.join(sdkPath, 'toolchains'));
        if (!versionList.length) {
            throw new Error('Please install hdc_std tool fist, doc: https://gitee.com/openharmony/docs/blob/master/zh-cn/device-dev/subsystems/subsys-toolchain-hdc-guide.md');
        }
        return ps.join(sdkPath, 'toolchains', versionList[0], 'hdc_std');
    }
    readJSON5Sync(json5FilePath) {
        let json5FileContent = fs.readFileSync(json5FilePath);
        return JSON5.parse(json5FileContent.toString());
    }
    selectHapFile(projectDir) {
        const outputDir = ps.join(projectDir, 'entry/build/default/outputs/default');
        if (!fs.existsSync(outputDir)) {
            throw new Error(`directory ${outputDir} does not exist!`);
        }
        const hapFiles = fs.readdirSync(outputDir).filter(x => x.endsWith(`.hap`));
        if (hapFiles.length === 0) {
            throw new Error(`no hap found in ${outputDir}`);
        }
        else if (hapFiles.length === 1) {
            return ps.join(outputDir, hapFiles[0]);
        }
        // first use signed hap
        const opt1 = hapFiles.filter(x => x.endsWith('-signed.hap'));
        const opt2 = hapFiles.filter(x => x.endsWith('-unsigned.hap'));
        const hapName = opt1.length > 0 ? opt1[0] :
            (opt2.length > 0 ? opt2[0] : hapFiles[0]);
        return ps.join(outputDir, hapName);
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
exports.HarmonyOSNextPackTool = HarmonyOSNextPackTool;
//# sourceMappingURL=harmonyos-next.js.map