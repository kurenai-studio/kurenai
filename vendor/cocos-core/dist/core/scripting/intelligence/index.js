"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeScriptConfigBuilder = void 0;
const typescript_1 = __importDefault(require("typescript"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const db_module_url_1 = require("../utils/db-module-url");
const ccbuild_1 = require("@cocos/ccbuild");
const engine_1 = require("../../engine");
class TypeScriptConfigBuilder {
    _realTsConfigPath;
    _tempDirPath;
    _configFilePath;
    _declarationHomePath;
    _engineTsPath;
    _projectPath;
    _dbInfos = [];
    internalTsConfig = {};
    internalDbURLInfos = [];
    constructor(projectPath, engineTsPath) {
        this._engineTsPath = engineTsPath;
        this._projectPath = projectPath;
        this._realTsConfigPath = path_1.default.join(projectPath, 'tsconfig.json');
        this._tempDirPath = path_1.default.join(projectPath, 'temp');
        this._configFilePath = path_1.default.join(this._tempDirPath, 'tsconfig.cocos.json');
        this._declarationHomePath = path_1.default.join(this._tempDirPath, 'declarations');
    }
    setDbURLInfos(dbInfos) {
        this._dbInfos = dbInfos;
    }
    getTempPath() {
        return this._tempDirPath;
    }
    getProjectPath() {
        return this._projectPath;
    }
    getRealTsConfigPath() {
        return this._realTsConfigPath;
    }
    async getInternalDbURLInfos() {
        if (this.internalDbURLInfos.length === 0) {
            const infos = await this.getDbURLInfos();
            this.internalDbURLInfos.length = 0;
            this.internalDbURLInfos.push(...infos);
        }
        return this.internalDbURLInfos;
    }
    async getCompilerOptions() {
        if (Object.keys(this.internalTsConfig).length === 0) {
            await this.buildCommonConfig();
        }
        return this.internalTsConfig;
    }
    async generateDeclarations(types) {
        await Promise.all([
            this.addEngineDeclarations(types),
            this.addEnvDeclarations(types),
            this.addCustomMacroDeclarations(types),
            this.addJsbDeclarations(types),
        ]);
    }
    async buildCommonConfig() {
        const types = [];
        const libs = buildLibs();
        const paths = {};
        await this.generateDeclarations(types);
        await this.addDbPathMappings(paths);
        await this.updateCustomMacroJS();
        const compilerOptions = {
            // Based on ES2015, but may be extended.
            target: 'ES2015',
            module: 'ES2015',
            // True by default.
            strict: true,
            strictNullChecks: false,
            noImplicitAny: false,
            strictPropertyInitialization: false,
            types,
            libs,
            paths,
            // We support legacy decorator proposal.
            experimentalDecorators: true,
            // Most of transpilers are in "isolated modules" mode since they
            // do not analyze type info. So our babel does.
            isolatedModules: true,
            // Our module resolution is close to Node.js one.
            moduleResolution: 'node',
            // Creator do take over the compilation.
            noEmit: true,
            // To avoid case problem on Windows.
            forceConsistentCasingInFileNames: true,
            // kurenai: the generated engine declarations do not type-check on their own.
            skipLibCheck: true,
        };
        const tsConfig = {
            // Considering Visual Studio Code identifies tsconfig from schema.
            $schema: 'https://json.schemastore.org/tsconfig',
            compilerOptions,
            include: [
                '../assets/**/*',
                '../extensions/**/*'
            ],
            exclude: [
                '../node_modules',
                '../library',
                '../local',
                '../build',
                '../profiles'
            ]
        };
        for (const key in compilerOptions) {
            this.internalTsConfig[key] = compilerOptions[key];
        }
        this.internalTsConfig.target = typescript_1.default.ScriptTarget.ES2015;
        this.internalTsConfig.module = typescript_1.default.ModuleKind.ES2015;
        this.internalTsConfig.moduleResolution = typescript_1.default.ModuleResolutionKind.NodeJs;
        await fs_extra_1.default.outputJson(this._configFilePath, tsConfig, {
            spaces: 2,
        });
        function buildLibs() {
            const libs = [];
            // TODO: add libs
            return libs.length === 0 ? undefined : libs;
        }
    }
    async addEngineDeclarations(types) {
        const engineDeclarationFilePath = path_1.default.join(this._declarationHomePath, 'cc.d.ts');
        await fs_extra_1.default.outputFile(engineDeclarationFilePath, generateEngineDeclarationFile(this._engineTsPath), { encoding: 'utf8' });
        types.push(this.tsConfigTypePath(engineDeclarationFilePath));
    }
    async addJsbDeclarations(types) {
        const jsbDeclarationFilePath = path_1.default.join(this._declarationHomePath, 'jsb.d.ts');
        await fs_extra_1.default.outputFile(jsbDeclarationFilePath, generateJsbDeclarationFile(this._engineTsPath), { encoding: 'utf8' });
        types.push(this.tsConfigTypePath(jsbDeclarationFilePath));
    }
    async addEnvDeclarations(types) {
        const envDeclarationFilePath = path_1.default.join(this._declarationHomePath, 'cc.env.d.ts');
        await fs_extra_1.default.outputFile(envDeclarationFilePath, await generateEnvDeclarationFile(this._engineTsPath), { encoding: 'utf8' });
        types.push(this.tsConfigTypePath(envDeclarationFilePath));
    }
    async addCustomMacroDeclarations(types) {
        const customMacroDeclarationFilePath = path_1.default.join(this._declarationHomePath, 'cc.custom-macro.d.ts');
        await fs_extra_1.default.outputFile(customMacroDeclarationFilePath, await generateCustomMacroDeclarationFile(), { encoding: 'utf8' });
        types.push(this.tsConfigTypePath(customMacroDeclarationFilePath));
    }
    async addDbPathMappings(paths) {
        const infos = await this.getDbURLInfos();
        this.internalDbURLInfos.length = 0;
        this.internalDbURLInfos.push(...infos);
        for (const { dbURL, target } of infos) {
            paths[`${dbURL}*`] = [path_1.default.join(target, '*')];
        }
    }
    tsConfigTypePath(path) {
        // Path should be relative to the directory of this config file itself
        // kurenai: the types live in temp/tsconfig.cocos.json, not the project tsconfig.json.
        const rel = path_1.default.relative(path_1.default.dirname(this._configFilePath), path);
        // No `.d.ts` is allowed
        const extensionLess = rel.endsWith('.d.ts') ? rel.substr(0, rel.length - 5) : rel;
        // Let's convert it to slash for generic
        const unix = extensionLess.replace(/\\/g, '/');
        // "./" is needed for type field, at least for TS 4.2.3
        return unix.startsWith('./') || unix.startsWith('../') ? unix : `./${unix}`;
    }
    /**
     * 在收到 custom-macro-changed 消息后，更新相关自定义宏配置
     * 包括 cc.custom-macro.d.ts 和 custom-macro.js
     */
    async updateCustomMacro() {
        // 更新 cc.custom-macro.d.ts
        const customMacroDeclarationFilePath = path_1.default.join(this._declarationHomePath, 'cc.custom-macro.d.ts');
        await fs_extra_1.default.outputFile(customMacroDeclarationFilePath, await generateCustomMacroDeclarationFile(), { encoding: 'utf8' });
        // 更新 custom-macro.js
        await this.updateCustomMacroJS();
    }
    /**
     * 更新 custom-macro.js 文件，用于 Web 运行时判断
     */
    async updateCustomMacroJS() {
        const customMacroJSFilePath = path_1.default.join(this._tempDirPath, 'programming/custom-macro.js');
        await fs_extra_1.default.outputFile(customMacroJSFilePath, await generateCustomMacroJSFile(), { encoding: 'utf8' });
    }
    async getDbURLInfos() {
        const infos = [];
        for (const dbInfo of this._dbInfos) {
            const dbURL = (0, db_module_url_1.getDatabaseModuleRootURL)(dbInfo.dbID);
            infos.push({
                dbURL,
                target: dbInfo.target,
            });
        }
        return infos;
    }
}
exports.TypeScriptConfigBuilder = TypeScriptConfigBuilder;
function generateEngineDeclarationFile(engineRoot) {
    const editorExportDir = path_1.default.join(__dirname, '../../editor-export/');
    const dtsFiles = fs_extra_1.default.existsSync(editorExportDir) ? fs_extra_1.default.readdirSync(editorExportDir) : [];
    const dtsReferences = dtsFiles.map(file => `/// <reference path="${path_1.default.join(editorExportDir, file)}"/>`).join('\n');
    const code = `
    /// <reference path="${path_1.default.join(engineRoot, 'bin/.declarations/cc.d.ts')}"/>
    ${dtsReferences}
    /**
     * @deprecated Global variable \`cc\` was dropped since 3.0. Use ES6 module syntax to import Cocos Creator APIs.
     */
    declare const cc: never;
    `;
    return code;
}
function generateJsbDeclarationFile(engineRoot) {
    const code = `/// <reference path="${path_1.default.join(engineRoot, './@types/jsb.d.ts')}"/>\n`;
    return code;
}
async function generateEnvDeclarationFile(engineRoot) {
    const statsQuery = await ccbuild_1.StatsQuery.create(engineRoot);
    return statsQuery.constantManager.genCCEnv();
}
async function generateCustomMacroDeclarationFile() {
    const customMacroList = engine_1.Engine.getConfig().macroCustom;
    const code = `\
declare module "cc/userland/macro" {
${customMacroList.map((item) => `\texport const ${item.key}: boolean;`).join('\n')}
}
`;
    return code;
}
async function generateCustomMacroJSFile() {
    const customMacroList = engine_1.Engine.getConfig().macroCustom;
    const code = `\
System.register([], function (_export, _context) {      
    return {
        setters: [],
        execute: function () {
${customMacroList.map((item) => `_export("${item.key}", ${item.value});`).join('\n')}
        }
    };
});
`;
    return code;
}
