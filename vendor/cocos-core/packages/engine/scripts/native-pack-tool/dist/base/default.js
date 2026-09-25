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
exports.CocosParams = exports.NativePackTool = void 0;
const ps = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const utils_1 = require("../utils");
const zlib_1 = require("zlib");
const globby = require('globby');
const xxtea = require('xxtea-node');
const PackageNewConfig = 'cocos-project-template.json';
const ErrorCodeIncompatible = 15004;
class NativePackTool {
    constructor() {
        // 存储调用 cmake 的命令行参数
        this.cmakeArgs = [];
        this._debugInfo = null;
        this._versionParser = null;
        this.skipVersionCheck = false;
    }
    // 设置命令行调用时的环境参数
    setEnv(key, value) {
        process.env[key] = value;
    }
    init(params) {
        this.params = new CocosParams(params);
        this.paths = new utils_1.Paths(params);
        this.setEnv('NATIVE_DIR', this.paths.platformTemplateDirInPrj);
        this.setEnv('COMMON_DIR', this.paths.commonDirInPrj);
        this.setEnv('PROJECT_NAME', this.params.projectName);
    }
    parseVersion(content, key, def) {
        const regexp = new RegExp(`${key}=(.*)`);
        const r = content.match(regexp);
        if (!r) {
            return def;
        }
        const v = Number.parseInt(r[1], 10);
        return Number.isNaN(v) ? def : v;
    }
    async copyCommonTemplate() {
        if (!fs.existsSync(ps.join(this.paths.commonDirInPrj, 'CMakeLists.txt'))) {
            await fs.copy(this.paths.commonDirInCocos, this.paths.commonDirInPrj, { overwrite: false });
        }
    }
    get projEngineVersionPath() {
        return ps.join(this.paths.commonDirInPrj, 'cocos-version.json');
    }
    get DebugInfos() {
        if (!this._debugInfo) {
            this._debugInfo = require(ps.join(utils_1.Paths.enginePath, 'DebugInfos.json'));
            if (!this._debugInfo) {
                console.error(`Failed to load DebugInfos.json`);
            }
        }
        return this._debugInfo;
    }
    get versionParser() {
        if (!this._versionParser) {
            const scriptPath = ps.join(utils_1.Paths.enginePath, 'native/cmake/scripts/plugin_support/plugin_cfg.js');
            this._versionParser = require(scriptPath);
        }
        return this._versionParser;
    }
    /**
     * Debug / Release
     */
    get buildType() {
        return this.params.debug ? "Debug" : "Release";
    }
    /**
     * Read version number from cocos-version.json
     */
    tryReadProjectTemplateVersion() {
        const versionJsonPath = this.projEngineVersionPath;
        if (!fs.existsSync(versionJsonPath)) {
            console.log(`warning: ${versionJsonPath} not exists`);
            return null;
        }
        try {
            const content = fs.readJsonSync(versionJsonPath);
            if (content.version === undefined) {
                console.error(`Field 'version' missing in ${versionJsonPath}`);
                return null;
            }
            return content;
        }
        catch (e) {
            console.error(`Failed to read json file ${versionJsonPath}`);
            console.error(e);
        }
        return null;
    }
    /**
     * Read package.json file in the root folder and return the version field.
     */
    tryGetEngineVersion() {
        const pkgJSON = ps.join(utils_1.Paths.enginePath, 'package.json');
        if (!fs.existsSync(pkgJSON)) {
            console.error(`Failed to read file ${pkgJSON}`);
            return null;
        }
        return fs.readJsonSync(pkgJSON).version || "3.6.0";
    }
    /**
     * Version condition from compatibility-info.json for current platform.
     */
    tryGetCompatibilityInfo() {
        const compInfo = ps.join(utils_1.Paths.enginePath, 'templates/compatibility-info.json');
        if (!fs.existsSync(compInfo)) {
            console.error(`${compInfo} does not exist`);
            return null;
        }
        const json = fs.readJsonSync(compInfo);
        if (!json.native) {
            console.error(`${compInfo} does not contain "native" field`);
            return null;
        }
        const native = json.native;
        const defaultCfg = native.default;
        if (!defaultCfg) {
            console.error(`${compInfo} does not contain "native.default" field`);
            return null;
        }
        const plt = this.params.platform;
        if (!native[plt]) {
            return defaultCfg;
        }
        return native[plt];
    }
    commonDirAreIdentical() {
        let commonSrc = this.paths.commonDirInCocos;
        let commonDst = this.paths.commonDirInPrj;
        const compFile = (src, dst) => {
            const linesSrc = fs.readFileSync(src).toString("utf8").split("\n").map((line) => line.trim());
            const linesDst = fs.readFileSync(dst).toString("utf8").split("\n").map((line) => line.trim());
            return linesSrc.length === linesDst.length && linesSrc.every((line, index) => line === linesDst[index]);
        };
        let compFiles = ["Classes/Game.h", "Classes/Game.cpp"];
        for (let f of compFiles) {
            const srcFile = ps.join(commonSrc, f);
            const dstFile = ps.join(commonDst, f);
            if (!fs.existsSync(dstFile)) {
                return false;
            }
            if (!fs.existsSync(srcFile)) {
                console.warn(`${f} not exists in ${commonSrc}`);
                return false;
            }
            if (!compFile(srcFile, dstFile)) {
                console.log(`File ${dstFile} differs from ${srcFile}`);
                return false;
            }
        }
        return true;
    }
    /**
     * The engine version used to generate the 'native/' folder should match the
     * condition written in the 'compatibility-info.json' file.
     */
    validateTemplateVersion() {
        console.log(`Checking template version...`);
        const engineVersion = this.tryGetEngineVersion();
        const projEngineVersionObj = this.tryReadProjectTemplateVersion();
        if (projEngineVersionObj === null) {
            if (this.commonDirAreIdentical()) {
                console.log(`The files under common/Classes directory are identical with the ones in the template. Append version file to the project.`);
                this.writeEngineVersion();
                return true;
            }
            console.error(`Error code ${ErrorCodeIncompatible}, ${this.DebugInfos[ErrorCodeIncompatible]}`);
            return false;
        }
        let versionRange = this.tryGetCompatibilityInfo();
        const projEngineVersion = projEngineVersionObj === null || projEngineVersionObj === void 0 ? void 0 : projEngineVersionObj.version;
        if (!versionRange) {
            console.warn(`Ignore version range check`);
            return true;
        }
        if (projEngineVersionObj.skipCheck === true) {
            console.log(`Skip version range check by project`);
            this.skipVersionCheck = true;
            return true;
        }
        let cond = this.versionParser.parse(versionRange);
        if (!cond) {
            return true;
        }
        if (cond.match(projEngineVersion)) {
            const newerThanEngineVersion = this.versionParser.parse(`>${engineVersion}`);
            if (newerThanEngineVersion.match(projEngineVersion)) {
                console.log(`warning: ${projEngineVersion} is newer than engine version ${engineVersion}`);
            }
            return true;
        }
        console.error(`'native/' folder was generated by ${projEngineVersion} which is incompatible with ${engineVersion}, condition: '${versionRange}'`);
        console.error(`${this.DebugInfos[ErrorCodeIncompatible]}`);
        return false;
    }
    /**
     * Utility function to check if a file exists dst as in src.
     */
    validateDirectory(src, dst, missingDirs) {
        if (!fs.existsSync(dst)) {
            missingDirs.push(dst);
            return;
        }
        const st = fs.statSync(src);
        if (!st.isDirectory()) {
            return;
        }
        let list = fs.readdirSync(src);
        for (let f of list) {
            if (f.startsWith('.'))
                continue;
            this.validateDirectory(ps.join(src, f), ps.join(dst, f), missingDirs);
        }
    }
    /**
     *  Check files under `native/engine/platform` folder
     */
    validatePlatformDirectory(missing) {
        console.log(`Validating platform source code directories...`);
        const srcDir = ps.join(this.paths.nativeTemplateDirInCocos, this.params.platform);
        const dstDir = this.paths.platformTemplateDirInPrj;
        this.validateDirectory(srcDir, dstDir, missing);
    }
    /**
     * Check if any file removed from the 'native/' folder
     */
    validateTemplateConsistency() {
        console.log(`Validating template consistency...`);
        let commonSrc = this.paths.commonDirInCocos;
        let commonDst = this.paths.commonDirInPrj;
        let missingDirs = [];
        // validate common directory
        this.validateDirectory(commonSrc, commonDst, missingDirs);
        this.validatePlatformDirectory(missingDirs);
        if (missingDirs.length > 0) {
            console.log(`Following files are missing`);
            for (let f of missingDirs) {
                console.log(`  ${f}`);
            }
            console.log(`Consider fix the problem or remove the directory`);
            console.log(`To avoid this warning, set field \'skipCheck\' in cocos-version.json to true.`);
            return false;
        }
        return true;
    }
    /**
     * - Ensure the engine version used to generete 'native/' folder is compatible
     *   with the current engine version.
     * - Check if any file under the 'native/' folder is removed.
     */
    validateNativeDir() {
        try {
            if (this.validateTemplateVersion()) {
                if (!this.skipVersionCheck && !this.validateTemplateConsistency()) {
                    console.log(`Failed to validate "native" directory`);
                }
            }
        }
        catch (e) {
            console.warn(`Failed to validate native directory`);
            console.warn(e);
        }
    }
    /**
     * Write cocos-version.json into native/common/cocos-version.json
     */
    writeEngineVersion() {
        if (!fs.existsSync(this.projEngineVersionPath)) {
            fs.writeJSON(this.projEngineVersionPath, {
                version: this.tryGetEngineVersion(),
                skipCheck: false,
            });
        }
    }
    async copyPlatformTemplate() {
        if (!fs.existsSync(this.paths.platformTemplateDirInPrj)) {
            // 拷贝 templates/平台/ 文件到 "native" 目录
            await fs.copy(ps.join(this.paths.nativeTemplateDirInCocos, this.params.platform), this.paths.platformTemplateDirInPrj, { overwrite: false });
            this.writeEngineVersion();
        }
        else {
            this.validateNativeDir();
        }
    }
    projectNameASCII() {
        return /^[0-9a-zA-Z_-]+$/.test(this.params.projectName) ? this.params.projectName : 'CocosGame';
    }
    getExecutableNameOrDefault() {
        const en = this.params.executableName;
        return en ? en : this.projectNameASCII();
    }
    async executeTemplateTask(tasks) {
        if (tasks.appendFile) {
            await Promise.all(tasks.appendFile.map((task) => {
                const dest = utils_1.cchelper.replaceEnvVariables(task.to);
                fs.ensureDirSync(ps.dirname(dest));
                return fs.copy(ps.join(utils_1.Paths.nativeRoot, task.from), dest);
            }));
            delete tasks.appendFile;
        }
        const replaceFilesDelay = {};
        if (tasks.projectReplaceProjectName) {
            const cmd = tasks.projectReplaceProjectName;
            cmd.files.forEach((file) => {
                const fp = utils_1.cchelper.join(this.paths.buildDir, file);
                replaceFilesDelay[fp] = replaceFilesDelay[fp] || [];
                replaceFilesDelay[fp].push({
                    reg: cmd.srcProjectName,
                    content: this.params.projectName,
                });
            });
            delete tasks.projectReplaceProjectName;
        }
        if (tasks.projectReplaceProjectNameASCII) {
            const cmd = tasks.projectReplaceProjectNameASCII;
            if (cmd.srcProjectName !== this.projectNameASCII()) {
                cmd.files.forEach((file) => {
                    const fp = utils_1.cchelper.join(this.paths.buildDir, file);
                    replaceFilesDelay[fp] = replaceFilesDelay[fp] || [];
                    replaceFilesDelay[fp].push({
                        reg: cmd.srcProjectName,
                        content: this.projectNameASCII(),
                    });
                });
            }
            delete tasks.projectReplaceProjectNameASCII;
        }
        if (tasks.projectReplacePackageName) {
            const cmd = tasks.projectReplacePackageName;
            const name = cmd.srcPackageName.replace(/\./g, '\\.');
            cmd.files.forEach((file) => {
                const fp = utils_1.cchelper.join(this.paths.buildDir, file);
                replaceFilesDelay[fp] = replaceFilesDelay[fp] || [];
                replaceFilesDelay[fp].push({
                    reg: name,
                    content: this.params.platformParams.packageName,
                });
            });
            delete tasks.projectReplacePackageName;
        }
        for (const fullpath in replaceFilesDelay) {
            const cfg = replaceFilesDelay[fullpath];
            await utils_1.cchelper.replaceInFile(cfg.map((x) => {
                return { reg: x.reg, text: x.content };
            }), fullpath);
        }
        if (Object.keys(tasks).length > 0) {
            for (const f in tasks) {
                console.error(`command "${f}" is not parsed in ${PackageNewConfig}`);
            }
        }
    }
    async generateCMakeConfig() {
        // 添加一些 cmake 配置到 cfg.cmake
        const file = ps.join(this.paths.nativePrjDir, 'cfg.cmake');
        let content = '';
        const config = this.params.cMakeConfig;
        Object.keys(config).forEach((key) => {
            // convert boolean to CMake option.
            if (typeof config[key] === 'boolean') {
                config[key] = `set(${key} ${config[key] ? 'ON' : 'OFF'})`;
            }
        });
        Object.keys(config).forEach((key) => {
            if (typeof config[key] !== 'string') {
                console.error(`cMakeConfig.${key} is not a string, "${config[key]}"`);
            }
            else {
                content += config[key] + '\n';
            }
        });
        console.debug(`generateCMakeConfig, ${JSON.stringify(config)}`);
        await fs.outputFile(file, content);
    }
    appendCmakeCommonArgs(args) {
        args.push(`-DRES_DIR="${utils_1.cchelper.fixPath(this.paths.buildDir)}"`);
        args.push(`-DAPP_NAME="${this.params.projectName}"`);
        args.push(`-DLAUNCH_TYPE="${this.buildType}"`);
        if (this.params.platformParams.skipUpdateXcodeProject) {
            args.push(`-DCMAKE_SUPPRESS_REGENERATION=ON`);
        }
    }
    /**
     * 加密脚本，加密后，会修改 cmake 参数，因而需要再次执行 cmake 配置文件的生成
     * @returns
     */
    async encryptScripts() {
        if (!this.params.encrypted) {
            return;
        }
        if (!this.params.xxteaKey) {
            throw new Error('Encryption Key can not be empty');
        }
        console.debug('Start encrypte scripts...');
        // native 加密步骤(1/3)：生成完工程所有文件添加 cmake 配置
        if (this.params.encrypted) {
            this.params.cMakeConfig.XXTEAKEY = `set(XXTEAKEY "${this.params.xxteaKey}")`;
        }
        const backupPath = ps.join(this.paths.buildDir, 'script-backup');
        fs.ensureDirSync(backupPath);
        fs.emptyDirSync(backupPath);
        const allBundleConfigs = await globby([
            ps.join(this.paths.buildAssetsDir, 'assets/*/cc.config*.json'),
            ps.join(this.paths.buildAssetsDir, 'remote/*/cc.config*.json'),
        ]);
        for (const configPath of allBundleConfigs) {
            const config = await fs.readJSON(configPath);
            // native 加密步骤(2/3)：加密的标志位，需要写入到 bundle 的 config.json 内运行时需要
            const version = configPath.match(/\/cc.config(.*).json/)[1];
            const scriptDest = ps.join(ps.dirname(configPath), `index${version}.js`);
            let content = fs.readFileSync(scriptDest, 'utf8');
            if (this.params.compressZip) {
                content = (0, zlib_1.gzipSync)(content);
                content = xxtea.encrypt(content, xxtea.toBytes(this.params.xxteaKey));
            }
            else {
                content = xxtea.encrypt(xxtea.toBytes(content), xxtea.toBytes(this.params.xxteaKey));
            }
            const newScriptDest = ps.join(ps.dirname(scriptDest), ps.basename(scriptDest, ps.extname(scriptDest)) + '.jsc');
            fs.writeFileSync(newScriptDest, content);
            config.encrypted = true;
            fs.writeJSONSync(configPath, config);
            fs.copySync(scriptDest, ps.join(backupPath, ps.relative(this.paths.buildAssetsDir, scriptDest)));
            fs.removeSync(scriptDest);
        }
        await this.generateCMakeConfig();
        console.debug('Encrypt scripts success');
    }
    /**
     * 解析、执行 cocos-template.json 模板任务
     */
    async executeCocosTemplateTask() {
        const templateTaskMap = await fs.readJSON(ps.join(this.paths.nativeTemplateDirInCocos, PackageNewConfig));
        for (const templateTask of Object.values(templateTaskMap)) {
            await this.executeTemplateTask(templateTask);
        }
    }
    get projectDistPath() {
        return this.paths.nativePrjDir;
    }
    ;
}
exports.NativePackTool = NativePackTool;
// cocos.compile.json 
class CocosParams {
    constructor(params) {
        this.cMakeConfig = {
            CC_USE_GLES3: false,
            CC_USE_GLES2: true,
            USE_SERVER_MODE: 'set(USE_SERVER_MODE OFF)',
            NET_MODE: 'set(NET_MODE 0)',
            XXTEAKEY: '',
            CC_ENABLE_SWAPPY: false,
        };
        this.buildAssetsDir = params.buildAssetsDir;
        this.projectName = params.projectName;
        this.debug = params.debug;
        this.cmakePath = params.cmakePath;
        this.platform = params.platform;
        this.platformName = params.platformName;
        this.enginePath = params.enginePath;
        this.nativeEnginePath = params.nativeEnginePath;
        this.projDir = params.projDir;
        this.buildDir = params.buildDir;
        this.xxteaKey = params.xxteaKey;
        this.encrypted = params.encrypted;
        this.compressZip = params.compressZip;
        this.executableName = params.executableName;
        Object.assign(this.cMakeConfig, params.cMakeConfig);
        this.platformParams = params.platformParams;
    }
}
exports.CocosParams = CocosParams;
//# sourceMappingURL=default.js.map