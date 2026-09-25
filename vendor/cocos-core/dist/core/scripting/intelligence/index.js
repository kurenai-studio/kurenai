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
        const rel = path_1.default.relative(path_1.default.dirname(this._realTsConfigPath), path);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvY29yZS9zY3JpcHRpbmcvaW50ZWxsaWdlbmNlL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLDREQUE0QjtBQUM1QixnREFBc0I7QUFDdEIsd0RBQTBCO0FBQzFCLDBEQUFrRTtBQUNsRSw0Q0FBNEM7QUFDNUMseUNBQXNDO0FBTXRDLE1BQWEsdUJBQXVCO0lBQ3hCLGlCQUFpQixDQUFTO0lBQzFCLFlBQVksQ0FBUztJQUNyQixlQUFlLENBQVM7SUFDeEIsb0JBQW9CLENBQVM7SUFDN0IsYUFBYSxDQUFTO0lBQ3RCLFlBQVksQ0FBUztJQUNyQixRQUFRLEdBQWEsRUFBRSxDQUFDO0lBRXhCLGdCQUFnQixHQUF1QixFQUFFLENBQUM7SUFDMUMsa0JBQWtCLEdBQWdCLEVBQUUsQ0FBQztJQUU3QyxZQUFZLFdBQW1CLEVBQUUsWUFBb0I7UUFDakQsSUFBSSxDQUFDLGFBQWEsR0FBRyxZQUFZLENBQUM7UUFDbEMsSUFBSSxDQUFDLFlBQVksR0FBRyxXQUFXLENBQUM7UUFDaEMsSUFBSSxDQUFDLGlCQUFpQixHQUFHLGNBQUUsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLGVBQWUsQ0FBQyxDQUFDO1FBQy9ELElBQUksQ0FBQyxZQUFZLEdBQUcsY0FBRSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDakQsSUFBSSxDQUFDLGVBQWUsR0FBRyxjQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUscUJBQXFCLENBQUMsQ0FBQztRQUN6RSxJQUFJLENBQUMsb0JBQW9CLEdBQUcsY0FBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLGNBQWMsQ0FBQyxDQUFDO0lBQzNFLENBQUM7SUFFRCxhQUFhLENBQUMsT0FBaUI7UUFDM0IsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUM7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SSxDQUFDOztDQUV0RixDQUFDO0lBQ0UsT0FBTyxJQUFJLENBQUM7QUFDaEIsQ0FBQztBQUVELEtBQUssVUFBVSx5QkFBeUI7SUFDcEMsTUFBTSxlQUFlLEdBQUcsZUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDLFdBQVcsQ0FBQztJQUN2RCxNQUFNLElBQUksR0FBRzs7Ozs7RUFLZixlQUFlLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBUyxFQUFFLEVBQUUsQ0FBQyxZQUFZLElBQUksQ0FBQyxHQUFHLE1BQU0sSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQzs7OztDQUl4RixDQUFDO0lBQ0UsT0FBTyxJQUFJLENBQUM7QUFDaEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCBwcyBmcm9tICdwYXRoJztcbmltcG9ydCBmcyBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgeyBnZXREYXRhYmFzZU1vZHVsZVJvb3RVUkwgfSBmcm9tICcuLi91dGlscy9kYi1tb2R1bGUtdXJsJztcbmltcG9ydCB7IFN0YXRzUXVlcnkgfSBmcm9tICdAY29jb3MvY2NidWlsZCc7XG5pbXBvcnQgeyBFbmdpbmUgfSBmcm9tICcuLi8uLi9lbmdpbmUnO1xuaW1wb3J0IHsgREJJbmZvIH0gZnJvbSAnLi4vQHR5cGVzL2NvbmZpZy1leHBvcnQnO1xuXG5leHBvcnQgaW50ZXJmYWNlIERiVVJMSW5mbyB7IGRiVVJMOiBzdHJpbmcsIHRhcmdldDogc3RyaW5nIH1cblxudHlwZSBUc0NvbmZpZ1BhdGhzID0gUmVjb3JkPHN0cmluZywgc3RyaW5nW10+O1xuZXhwb3J0IGNsYXNzIFR5cGVTY3JpcHRDb25maWdCdWlsZGVyIHtcbiAgICBwcml2YXRlIF9yZWFsVHNDb25maWdQYXRoOiBzdHJpbmc7XG4gICAgcHJpdmF0ZSBfdGVtcERpclBhdGg6IHN0cmluZztcbiAgICBwcml2YXRlIF9jb25maWdGaWxlUGF0aDogc3RyaW5nO1xuICAgIHByaXZhdGUgX2RlY2xhcmF0aW9uSG9tZVBhdGg6IHN0cmluZztcbiAgICBwcml2YXRlIF9lbmdpbmVUc1BhdGg6IHN0cmluZztcbiAgICBwcml2YXRlIF9wcm9qZWN0UGF0aDogc3RyaW5nO1xuICAgIHByaXZhdGUgX2RiSW5mb3M6IERCSW5mb1tdID0gW107XG5cbiAgICBwcml2YXRlIGludGVybmFsVHNDb25maWc6IHRzLkNvbXBpbGVyT3B0aW9ucyA9IHt9O1xuICAgIHByaXZhdGUgaW50ZXJuYWxEYlVSTEluZm9zOiBEYlVSTEluZm9bXSA9IFtdO1xuXG4gICAgY29uc3RydWN0b3IocHJvamVjdFBhdGg6IHN0cmluZywgZW5naW5lVHNQYXRoOiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy5fZW5naW5lVHNQYXRoID0gZW5naW5lVHNQYXRoO1xuICAgICAgICB0aGlzLl9wcm9qZWN0UGF0aCA9IHByb2plY3RQYXRoO1xuICAgICAgICB0aGlzLl9yZWFsVHNDb25maWdQYXRoID0gcHMuam9pbihwcm9qZWN0UGF0aCwgJ3RzY29uZmlnLmpzb24nKTtcbiAgICAgICAgdGhpcy5fdGVtcERpclBhdGggPSBwcy5qb2luKHByb2plY3RQYXRoLCAndGVtcCcpO1xuICAgICAgICB0aGlzLl9jb25maWdGaWxlUGF0aCA9IHBzLmpvaW4odGhpcy5fdGVtcERpclBhdGgsICd0c2NvbmZpZy5jb2Nvcy5qc29uJyk7XG4gICAgICAgIHRoaXMuX2RlY2xhcmF0aW9uSG9tZVBhdGggPSBwcy5qb2luKHRoaXMuX3RlbXBEaXJQYXRoLCAnZGVjbGFyYXRpb25zJyk7XG4gICAgfVxuXG4gICAgc2V0RGJVUkxJbmZvcyhkYkluZm9zOiBEQkluZm9bXSkge1xuICAgICAgICB0aGlzLl9kYkluZm9zID0gZGJJbmZvcztcbiAgICB9XG5cbiAgICBnZXRUZW1wUGF0aCgpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gdGhpcy5fdGVtcERpclBhdGg7XG4gICAgfVxuXG4gICAgZ2V0UHJvamVjdFBhdGgoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3Byb2plY3RQYXRoO1xuICAgIH1cblxuICAgIGdldFJlYWxUc0NvbmZpZ1BhdGgoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3JlYWxUc0NvbmZpZ1BhdGg7XG4gICAgfVxuXG4gICAgYXN5bmMgZ2V0SW50ZXJuYWxEYlVSTEluZm9zKCk6IFByb21pc2U8UmVhZG9ubHk8RGJVUkxJbmZvPltdPiB7XG4gICAgICAgIGlmICh0aGlzLmludGVybmFsRGJVUkxJbmZvcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGNvbnN0IGluZm9zID0gYXdhaXQgdGhpcy5nZXREYlVSTEluZm9zKCk7XG4gICAgICAgICAgICB0aGlzLmludGVybmFsRGJVUkxJbmZvcy5sZW5ndGggPSAwO1xuICAgICAgICAgICAgdGhpcy5pbnRlcm5hbERiVVJMSW5mb3MucHVzaCguLi5pbmZvcyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuaW50ZXJuYWxEYlVSTEluZm9zO1xuICAgIH1cblxuICAgIGFzeW5jIGdldENvbXBpbGVyT3B0aW9ucygpOiBQcm9taXNlPFJlYWRvbmx5PHRzLkNvbXBpbGVyT3B0aW9ucz4+IHtcbiAgICAgICAgaWYgKE9iamVjdC5rZXlzKHRoaXMuaW50ZXJuYWxUc0NvbmZpZykubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmJ1aWxkQ29tbW9uQ29uZmlnKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuaW50ZXJuYWxUc0NvbmZpZztcbiAgICB9XG5cbiAgICBhc3luYyBnZW5lcmF0ZURlY2xhcmF0aW9ucyh0eXBlczogc3RyaW5nW10pIHtcbiAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoW1xuICAgICAgICAgICAgdGhpcy5hZGRFbmdpbmVEZWNsYXJhdGlvbnModHlwZXMpLFxuICAgICAgICAgICAgdGhpcy5hZGRFbnZEZWNsYXJhdGlvbnModHlwZXMpLFxuICAgICAgICAgICAgdGhpcy5hZGRDdXN0b21NYWNyb0RlY2xhcmF0aW9ucyh0eXBlcyksXG4gICAgICAgICAgICB0aGlzLmFkZEpzYkRlY2xhcmF0aW9ucyh0eXBlcyksXG4gICAgICAgIF0pO1xuICAgIH1cblxuICAgIGFzeW5jIGJ1aWxkQ29tbW9uQ29uZmlnKCkge1xuICAgICAgICBjb25zdCB0eXBlczogc3RyaW5nW10gPSBbXTtcblxuICAgICAgICBjb25zdCBsaWJzID0gYnVpbGRMaWJzKCk7XG5cbiAgICAgICAgY29uc3QgcGF0aHM6IFRzQ29uZmlnUGF0aHMgPSB7fTtcblxuICAgICAgICBhd2FpdCB0aGlzLmdlbmVyYXRlRGVjbGFyYXRpb25zKHR5cGVzKTtcbiAgICAgICAgYXdhaXQgdGhpcy5hZGREYlBhdGhNYXBwaW5ncyhwYXRocyk7XG4gICAgICAgIGF3YWl0IHRoaXMudXBkYXRlQ3VzdG9tTWFjcm9KUygpO1xuXG4gICAgICAgIGNvbnN0IGNvbXBpbGVyT3B0aW9uczogUmVjb3JkPHN0cmluZywgdHMuQ29tcGlsZXJPcHRpb25zVmFsdWU+ID0ge1xuICAgICAgICAgICAgLy8gQmFzZWQgb24gRVMyMDE1LCBidXQgbWF5IGJlIGV4dGVuZGVkLlxuICAgICAgICAgICAgdGFyZ2V0OiAnRVMyMDE1JyxcbiAgICAgICAgICAgIG1vZHVsZTogJ0VTMjAxNScsXG5cbiAgICAgICAgICAgIC8vIFRydWUgYnkgZGVmYXVsdC5cbiAgICAgICAgICAgIHN0cmljdDogdHJ1ZSxcbiAgICAgICAgICAgIHN0cmljdE51bGxDaGVja3M6IGZhbHNlLFxuICAgICAgICAgICAgbm9JbXBsaWNpdEFueTogZmFsc2UsXG4gICAgICAgICAgICBzdHJpY3RQcm9wZXJ0eUluaXRpYWxpemF0aW9uOiBmYWxzZSxcblxuICAgICAgICAgICAgdHlwZXMsXG5cbiAgICAgICAgICAgIGxpYnMsXG5cbiAgICAgICAgICAgIHBhdGhzLFxuXG4gICAgICAgICAgICAvLyBXZSBzdXBwb3J0IGxlZ2FjeSBkZWNvcmF0b3IgcHJvcG9zYWwuXG4gICAgICAgICAgICBleHBlcmltZW50YWxEZWNvcmF0b3JzOiB0cnVlLFxuXG4gICAgICAgICAgICAvLyBNb3N0IG9mIHRyYW5zcGlsZXJzIGFyZSBpbiBcImlzb2xhdGVkIG1vZHVsZXNcIiBtb2RlIHNpbmNlIHRoZXlcbiAgICAgICAgICAgIC8vIGRvIG5vdCBhbmFseXplIHR5cGUgaW5mby4gU28gb3VyIGJhYmVsIGRvZXMuXG4gICAgICAgICAgICBpc29sYXRlZE1vZHVsZXM6IHRydWUsXG5cbiAgICAgICAgICAgIC8vIE91ciBtb2R1bGUgcmVzb2x1dGlvbiBpcyBjbG9zZSB0byBOb2RlLmpzIG9uZS5cbiAgICAgICAgICAgIG1vZHVsZVJlc29sdXRpb246ICdub2RlJyxcblxuICAgICAgICAgICAgLy8gQ3JlYXRvciBkbyB0YWtlIG92ZXIgdGhlIGNvbXBpbGF0aW9uLlxuICAgICAgICAgICAgbm9FbWl0OiB0cnVlLFxuXG4gICAgICAgICAgICAvLyBUbyBhdm9pZCBjYXNlIHByb2JsZW0gb24gV2luZG93cy5cbiAgICAgICAgICAgIGZvcmNlQ29uc2lzdGVudENhc2luZ0luRmlsZU5hbWVzOiB0cnVlLFxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IHRzQ29uZmlnID0ge1xuICAgICAgICAgICAgLy8gQ29uc2lkZXJpbmcgVmlzdWFsIFN0dWRpbyBDb2RlIGlkZW50aWZpZXMgdHNjb25maWcgZnJvbSBzY2hlbWEuXG4gICAgICAgICAgICAkc2NoZW1hOiAnaHR0cHM6Ly9qc29uLnNjaGVtYXN0b3JlLm9yZy90c2NvbmZpZycsXG5cbiAgICAgICAgICAgIGNvbXBpbGVyT3B0aW9ucyxcblxuICAgICAgICAgICAgaW5jbHVkZTogW1xuICAgICAgICAgICAgICAgICcuLi9hc3NldHMvKiovKicsXG4gICAgICAgICAgICAgICAgJy4uL2V4dGVuc2lvbnMvKiovKidcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBleGNsdWRlOiBbXG4gICAgICAgICAgICAgICAgJy4uL25vZGVfbW9kdWxlcycsXG4gICAgICAgICAgICAgICAgJy4uL2xpYnJhcnknLFxuICAgICAgICAgICAgICAgICcuLi9sb2NhbCcsXG4gICAgICAgICAgICAgICAgJy4uL2J1aWxkJyxcbiAgICAgICAgICAgICAgICAnLi4vcHJvZmlsZXMnXG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG5cbiAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gY29tcGlsZXJPcHRpb25zKSB7XG4gICAgICAgICAgICB0aGlzLmludGVybmFsVHNDb25maWdba2V5XSA9IGNvbXBpbGVyT3B0aW9uc1trZXldO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaW50ZXJuYWxUc0NvbmZpZy50YXJnZXQgPSB0cy5TY3JpcHRUYXJnZXQuRVMyMDE1O1xuICAgICAgICB0aGlzLmludGVybmFsVHNDb25maWcubW9kdWxlID0gdHMuTW9kdWxlS2luZC5FUzIwMTU7XG4gICAgICAgIHRoaXMuaW50ZXJuYWxUc0NvbmZpZy5tb2R1bGVSZXNvbHV0aW9uID0gdHMuTW9kdWxlUmVzb2x1dGlvbktpbmQuTm9kZUpzO1xuXG4gICAgICAgIGF3YWl0IGZzLm91dHB1dEpzb24odGhpcy5fY29uZmlnRmlsZVBhdGgsIHRzQ29uZmlnLCB7XG4gICAgICAgICAgICBzcGFjZXM6IDIsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGZ1bmN0aW9uIGJ1aWxkTGlicygpOiBzdHJpbmdbXSB8IHVuZGVmaW5lZCB7XG4gICAgICAgICAgICBjb25zdCBsaWJzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICAgICAgLy8gVE9ETzogYWRkIGxpYnNcbiAgICAgICAgICAgIHJldHVybiBsaWJzLmxlbmd0aCA9PT0gMCA/IHVuZGVmaW5lZCA6IGxpYnM7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIHByaXZhdGUgYXN5bmMgYWRkRW5naW5lRGVjbGFyYXRpb25zKHR5cGVzOiBzdHJpbmdbXSkge1xuICAgICAgICBjb25zdCBlbmdpbmVEZWNsYXJhdGlvbkZpbGVQYXRoID0gcHMuam9pbih0aGlzLl9kZWNsYXJhdGlvbkhvbWVQYXRoLCAnY2MuZC50cycpO1xuICAgICAgICBhd2FpdCBmcy5vdXRwdXRGaWxlKFxuICAgICAgICAgICAgZW5naW5lRGVjbGFyYXRpb25GaWxlUGF0aCxcbiAgICAgICAgICAgIGdlbmVyYXRlRW5naW5lRGVjbGFyYXRpb25GaWxlKHRoaXMuX2VuZ2luZVRzUGF0aCksXG4gICAgICAgICAgICB7IGVuY29kaW5nOiAndXRmOCcgfSxcbiAgICAgICAgKTtcbiAgICAgICAgdHlwZXMucHVzaCh0aGlzLnRzQ29uZmlnVHlwZVBhdGgoZW5naW5lRGVjbGFyYXRpb25GaWxlUGF0aCkpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgYWRkSnNiRGVjbGFyYXRpb25zKHR5cGVzOiBzdHJpbmdbXSkge1xuICAgICAgICBjb25zdCBqc2JEZWNsYXJhdGlvbkZpbGVQYXRoID0gcHMuam9pbih0aGlzLl9kZWNsYXJhdGlvbkhvbWVQYXRoLCAnanNiLmQudHMnKTtcbiAgICAgICAgYXdhaXQgZnMub3V0cHV0RmlsZShcbiAgICAgICAgICAgIGpzYkRlY2xhcmF0aW9uRmlsZVBhdGgsXG4gICAgICAgICAgICBnZW5lcmF0ZUpzYkRlY2xhcmF0aW9uRmlsZSh0aGlzLl9lbmdpbmVUc1BhdGgpLFxuICAgICAgICAgICAgeyBlbmNvZGluZzogJ3V0ZjgnIH0sXG4gICAgICAgICk7XG4gICAgICAgIHR5cGVzLnB1c2godGhpcy50c0NvbmZpZ1R5cGVQYXRoKGpzYkRlY2xhcmF0aW9uRmlsZVBhdGgpKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGFkZEVudkRlY2xhcmF0aW9ucyh0eXBlczogc3RyaW5nW10pIHtcbiAgICAgICAgY29uc3QgZW52RGVjbGFyYXRpb25GaWxlUGF0aCA9IHBzLmpvaW4odGhpcy5fZGVjbGFyYXRpb25Ib21lUGF0aCwgJ2NjLmVudi5kLnRzJyk7XG4gICAgICAgIGF3YWl0IGZzLm91dHB1dEZpbGUoXG4gICAgICAgICAgICBlbnZEZWNsYXJhdGlvbkZpbGVQYXRoLFxuICAgICAgICAgICAgYXdhaXQgZ2VuZXJhdGVFbnZEZWNsYXJhdGlvbkZpbGUodGhpcy5fZW5naW5lVHNQYXRoKSxcbiAgICAgICAgICAgIHsgZW5jb2Rpbmc6ICd1dGY4JyB9LFxuICAgICAgICApO1xuICAgICAgICB0eXBlcy5wdXNoKHRoaXMudHNDb25maWdUeXBlUGF0aChlbnZEZWNsYXJhdGlvbkZpbGVQYXRoKSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBhZGRDdXN0b21NYWNyb0RlY2xhcmF0aW9ucyh0eXBlczogc3RyaW5nW10pIHtcbiAgICAgICAgY29uc3QgY3VzdG9tTWFjcm9EZWNsYXJhdGlvbkZpbGVQYXRoID0gcHMuam9pbih0aGlzLl9kZWNsYXJhdGlvbkhvbWVQYXRoLCAnY2MuY3VzdG9tLW1hY3JvLmQudHMnKTtcbiAgICAgICAgYXdhaXQgZnMub3V0cHV0RmlsZShcbiAgICAgICAgICAgIGN1c3RvbU1hY3JvRGVjbGFyYXRpb25GaWxlUGF0aCxcbiAgICAgICAgICAgIGF3YWl0IGdlbmVyYXRlQ3VzdG9tTWFjcm9EZWNsYXJhdGlvbkZpbGUoKSxcbiAgICAgICAgICAgIHsgZW5jb2Rpbmc6ICd1dGY4JyB9LFxuICAgICAgICApO1xuICAgICAgICB0eXBlcy5wdXNoKHRoaXMudHNDb25maWdUeXBlUGF0aChjdXN0b21NYWNyb0RlY2xhcmF0aW9uRmlsZVBhdGgpKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGFkZERiUGF0aE1hcHBpbmdzKHBhdGhzOiBUc0NvbmZpZ1BhdGhzKSB7XG4gICAgICAgIGNvbnN0IGluZm9zID0gYXdhaXQgdGhpcy5nZXREYlVSTEluZm9zKCk7XG4gICAgICAgIHRoaXMuaW50ZXJuYWxEYlVSTEluZm9zLmxlbmd0aCA9IDA7XG4gICAgICAgIHRoaXMuaW50ZXJuYWxEYlVSTEluZm9zLnB1c2goLi4uaW5mb3MpO1xuICAgICAgICBmb3IgKGNvbnN0IHsgZGJVUkwsIHRhcmdldCB9IG9mIGluZm9zKSB7XG4gICAgICAgICAgICBwYXRoc1tgJHtkYlVSTH0qYF0gPSBbcHMuam9pbih0YXJnZXQsICcqJyldO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSB0c0NvbmZpZ1R5cGVQYXRoKHBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIC8vIFBhdGggc2hvdWxkIGJlIHJlbGF0aXZlIHRvIHRoZSBkaXJlY3Rvcnkgb2YgdGhpcyBjb25maWcgZmlsZSBpdHNlbGZcbiAgICAgICAgY29uc3QgcmVsID0gcHMucmVsYXRpdmUocHMuZGlybmFtZSh0aGlzLl9yZWFsVHNDb25maWdQYXRoKSwgcGF0aCk7XG4gICAgICAgIC8vIE5vIGAuZC50c2AgaXMgYWxsb3dlZFxuICAgICAgICBjb25zdCBleHRlbnNpb25MZXNzID0gcmVsLmVuZHNXaXRoKCcuZC50cycpID8gcmVsLnN1YnN0cigwLCByZWwubGVuZ3RoIC0gNSkgOiByZWw7XG4gICAgICAgIC8vIExldCdzIGNvbnZlcnQgaXQgdG8gc2xhc2ggZm9yIGdlbmVyaWNcbiAgICAgICAgY29uc3QgdW5peCA9IGV4dGVuc2lvbkxlc3MucmVwbGFjZSgvXFxcXC9nLCAnLycpO1xuICAgICAgICAvLyBcIi4vXCIgaXMgbmVlZGVkIGZvciB0eXBlIGZpZWxkLCBhdCBsZWFzdCBmb3IgVFMgNC4yLjNcbiAgICAgICAgcmV0dXJuIHVuaXguc3RhcnRzV2l0aCgnLi8nKSB8fCB1bml4LnN0YXJ0c1dpdGgoJy4uLycpID8gdW5peCA6IGAuLyR7dW5peH1gO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWcqOaUtuWIsCBjdXN0b20tbWFjcm8tY2hhbmdlZCDmtojmga/lkI7vvIzmm7TmlrDnm7jlhbPoh6rlrprkuYnlro/phY3nva5cbiAgICAgKiDljIXmi6wgY2MuY3VzdG9tLW1hY3JvLmQudHMg5ZKMIGN1c3RvbS1tYWNyby5qc1xuICAgICAqL1xuICAgIGFzeW5jIHVwZGF0ZUN1c3RvbU1hY3JvKCkge1xuICAgICAgICAvLyDmm7TmlrAgY2MuY3VzdG9tLW1hY3JvLmQudHNcbiAgICAgICAgY29uc3QgY3VzdG9tTWFjcm9EZWNsYXJhdGlvbkZpbGVQYXRoID0gcHMuam9pbih0aGlzLl9kZWNsYXJhdGlvbkhvbWVQYXRoLCAnY2MuY3VzdG9tLW1hY3JvLmQudHMnKTtcbiAgICAgICAgYXdhaXQgZnMub3V0cHV0RmlsZShcbiAgICAgICAgICAgIGN1c3RvbU1hY3JvRGVjbGFyYXRpb25GaWxlUGF0aCxcbiAgICAgICAgICAgIGF3YWl0IGdlbmVyYXRlQ3VzdG9tTWFjcm9EZWNsYXJhdGlvbkZpbGUoKSxcbiAgICAgICAgICAgIHsgZW5jb2Rpbmc6ICd1dGY4JyB9LFxuICAgICAgICApO1xuXG4gICAgICAgIC8vIOabtOaWsCBjdXN0b20tbWFjcm8uanNcbiAgICAgICAgYXdhaXQgdGhpcy51cGRhdGVDdXN0b21NYWNyb0pTKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5pu05pawIGN1c3RvbS1tYWNyby5qcyDmlofku7bvvIznlKjkuo4gV2ViIOi/kOihjOaXtuWIpOaWrVxuICAgICAqL1xuICAgIGFzeW5jIHVwZGF0ZUN1c3RvbU1hY3JvSlMoKSB7XG4gICAgICAgIGNvbnN0IGN1c3RvbU1hY3JvSlNGaWxlUGF0aCA9IHBzLmpvaW4odGhpcy5fdGVtcERpclBhdGgsICdwcm9ncmFtbWluZy9jdXN0b20tbWFjcm8uanMnKTtcbiAgICAgICAgYXdhaXQgZnMub3V0cHV0RmlsZShcbiAgICAgICAgICAgIGN1c3RvbU1hY3JvSlNGaWxlUGF0aCxcbiAgICAgICAgICAgIGF3YWl0IGdlbmVyYXRlQ3VzdG9tTWFjcm9KU0ZpbGUoKSxcbiAgICAgICAgICAgIHsgZW5jb2Rpbmc6ICd1dGY4JyB9LFxuICAgICAgICApO1xuICAgIH1cblxuXG4gICAgYXN5bmMgZ2V0RGJVUkxJbmZvcygpOiBQcm9taXNlPERiVVJMSW5mb1tdPiB7XG4gICAgICAgIGNvbnN0IGluZm9zOiBEYlVSTEluZm9bXSA9IFtdO1xuICAgICAgICBmb3IgKGNvbnN0IGRiSW5mbyBvZiB0aGlzLl9kYkluZm9zKSB7XG4gICAgICAgICAgICBjb25zdCBkYlVSTCA9IGdldERhdGFiYXNlTW9kdWxlUm9vdFVSTChkYkluZm8uZGJJRCk7XG4gICAgICAgICAgICBpbmZvcy5wdXNoKHtcbiAgICAgICAgICAgICAgICBkYlVSTCxcbiAgICAgICAgICAgICAgICB0YXJnZXQ6IGRiSW5mby50YXJnZXQsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaW5mb3M7XG4gICAgfVxufVxuXG5cbmZ1bmN0aW9uIGdlbmVyYXRlRW5naW5lRGVjbGFyYXRpb25GaWxlKGVuZ2luZVJvb3Q6IHN0cmluZykge1xuICAgIGNvbnN0IGVkaXRvckV4cG9ydERpciA9IHBzLmpvaW4oX19kaXJuYW1lLCAnLi4vLi4vZWRpdG9yLWV4cG9ydC8nKTtcbiAgICBjb25zdCBkdHNGaWxlcyA9IGZzLmV4aXN0c1N5bmMoZWRpdG9yRXhwb3J0RGlyKSA/IGZzLnJlYWRkaXJTeW5jKGVkaXRvckV4cG9ydERpcikgOiBbXTtcbiAgICBjb25zdCBkdHNSZWZlcmVuY2VzID0gZHRzRmlsZXMubWFwKGZpbGUgPT4gYC8vLyA8cmVmZXJlbmNlIHBhdGg9XCIke3BzLmpvaW4oZWRpdG9yRXhwb3J0RGlyLCBmaWxlKX1cIi8+YCkuam9pbignXFxuJyk7XG5cbiAgICBjb25zdCBjb2RlID0gYFxuICAgIC8vLyA8cmVmZXJlbmNlIHBhdGg9XCIke3BzLmpvaW4oZW5naW5lUm9vdCwgJ2Jpbi8uZGVjbGFyYXRpb25zL2NjLmQudHMnKX1cIi8+XG4gICAgJHtkdHNSZWZlcmVuY2VzfVxuICAgIC8qKlxuICAgICAqIEBkZXByZWNhdGVkIEdsb2JhbCB2YXJpYWJsZSBcXGBjY1xcYCB3YXMgZHJvcHBlZCBzaW5jZSAzLjAuIFVzZSBFUzYgbW9kdWxlIHN5bnRheCB0byBpbXBvcnQgQ29jb3MgQ3JlYXRvciBBUElzLlxuICAgICAqL1xuICAgIGRlY2xhcmUgY29uc3QgY2M6IG5ldmVyO1xuICAgIGA7XG5cbiAgICByZXR1cm4gY29kZTtcbn1cblxuZnVuY3Rpb24gZ2VuZXJhdGVKc2JEZWNsYXJhdGlvbkZpbGUoZW5naW5lUm9vdDogc3RyaW5nKSB7XG4gICAgY29uc3QgY29kZSA9IGAvLy8gPHJlZmVyZW5jZSBwYXRoPVwiJHtwcy5qb2luKGVuZ2luZVJvb3QsICcuL0B0eXBlcy9qc2IuZC50cycpfVwiLz5cXG5gO1xuXG4gICAgcmV0dXJuIGNvZGU7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdlbmVyYXRlRW52RGVjbGFyYXRpb25GaWxlKGVuZ2luZVJvb3Q6IHN0cmluZykge1xuICAgIGNvbnN0IHN0YXRzUXVlcnkgPSBhd2FpdCBTdGF0c1F1ZXJ5LmNyZWF0ZShlbmdpbmVSb290KTtcbiAgICByZXR1cm4gc3RhdHNRdWVyeS5jb25zdGFudE1hbmFnZXIuZ2VuQ0NFbnYoKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2VuZXJhdGVDdXN0b21NYWNyb0RlY2xhcmF0aW9uRmlsZSgpIHtcblxuICAgIGNvbnN0IGN1c3RvbU1hY3JvTGlzdCA9IEVuZ2luZS5nZXRDb25maWcoKS5tYWNyb0N1c3RvbTtcbiAgICBjb25zdCBjb2RlID0gYFxcXG5kZWNsYXJlIG1vZHVsZSBcImNjL3VzZXJsYW5kL21hY3JvXCIge1xuJHtjdXN0b21NYWNyb0xpc3QubWFwKChpdGVtOiBhbnkpID0+IGBcXHRleHBvcnQgY29uc3QgJHtpdGVtLmtleX06IGJvb2xlYW47YCkuam9pbignXFxuJyl9XG59XG5gO1xuICAgIHJldHVybiBjb2RlO1xufVxuXG5hc3luYyBmdW5jdGlvbiBnZW5lcmF0ZUN1c3RvbU1hY3JvSlNGaWxlKCkge1xuICAgIGNvbnN0IGN1c3RvbU1hY3JvTGlzdCA9IEVuZ2luZS5nZXRDb25maWcoKS5tYWNyb0N1c3RvbTtcbiAgICBjb25zdCBjb2RlID0gYFxcXG5TeXN0ZW0ucmVnaXN0ZXIoW10sIGZ1bmN0aW9uIChfZXhwb3J0LCBfY29udGV4dCkgeyAgICAgIFxuICAgIHJldHVybiB7XG4gICAgICAgIHNldHRlcnM6IFtdLFxuICAgICAgICBleGVjdXRlOiBmdW5jdGlvbiAoKSB7XG4ke2N1c3RvbU1hY3JvTGlzdC5tYXAoKGl0ZW06IGFueSkgPT4gYF9leHBvcnQoXCIke2l0ZW0ua2V5fVwiLCAke2l0ZW0udmFsdWV9KTtgKS5qb2luKCdcXG4nKX1cbiAgICAgICAgfVxuICAgIH07XG59KTtcbmA7XG4gICAgcmV0dXJuIGNvZGU7XG59Il19