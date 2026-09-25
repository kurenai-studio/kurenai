type ScriptingModule = typeof import('../scripting');
import type { ProgrammingFacet, AssetChangeInfo, SharedSettings, ImportMap, AssetActionEnum } from '../scripting';

describe('cocos-cli-types: scripting', () => {
    it('should be able to import api functions', () => {
        let _init: ScriptingModule['init'] | undefined = undefined;
        let _getProgrammingFacet: ScriptingModule['getProgrammingFacet'] | undefined = undefined;
        let _initProgrammingFacet: ScriptingModule['initProgrammingFacet'] | undefined = undefined;
        let _startCompileScript: ScriptingModule['startCompileScript'] | undefined = undefined;
        let _onCompiled: ScriptingModule['onCompiled'] | undefined = undefined;
        let _onCompileStart: ScriptingModule['onCompileStart'] | undefined = undefined;
        let _onPackBuildEnd: ScriptingModule['onPackBuildEnd'] | undefined = undefined;
        let _onPackBuildStart: ScriptingModule['onPackBuildStart'] | undefined = undefined;

        expect(_init).toBeUndefined();
        expect(_getProgrammingFacet).toBeUndefined();
        expect(_initProgrammingFacet).toBeUndefined();
        expect(_startCompileScript).toBeUndefined();
        expect(_onCompiled).toBeUndefined();
        expect(_onCompileStart).toBeUndefined();
        expect(_onPackBuildEnd).toBeUndefined();
        expect(_onPackBuildStart).toBeUndefined();
    });

    it('ProgrammingFacet should have key properties', () => {
        const keys: (keyof ProgrammingFacet)[] = [
            'engineRoot', 'engineDistRoot',
            'systemJsHomeDir', 'systemJsIndexFile',
            'engineImportMapURL', 'packImportMapURL',
            'loadPackResource', 'getGlobalImportMap',
        ];
        expect(keys.length).toBeGreaterThan(0);
    });

    it('AssetChangeInfo should have change fields', () => {
        const keys: (keyof AssetChangeInfo)[] = [
            'type', 'uuid', 'filePath', 'importer', 'userData',
        ];
        expect(keys).toHaveLength(5);
    });

    it('SharedSettings should be importable', () => {
        let _settings: Partial<SharedSettings> = {};
        expect(_settings).toBeDefined();
    });

    it('ImportMap should have imports field', () => {
        let map: ImportMap = { imports: { 'cc': './cc.js' } };
        expect(map.imports).toBeDefined();
    });

    it('AssetActionEnum should be importable', () => {
        let _action: AssetActionEnum | undefined = undefined;
        expect(_action).toBeUndefined();
    });
});
