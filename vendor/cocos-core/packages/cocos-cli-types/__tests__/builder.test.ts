type BuilderModule = typeof import('../builder');
import type { IBuildTaskOption, IBuildResultData, IBuildResult, IBuildCommonOptions, IBuilder, BuildConfiguration, StatsQuery } from '../builder';

describe('cocos-cli-types: builder', () => {
    it('should be able to import build task api functions', () => {
        let _build: BuilderModule['build'] | undefined = undefined;
        let _buildBundleOnly: BuilderModule['buildBundleOnly'] | undefined = undefined;
        let _make: BuilderModule['make'] | undefined = undefined;
        let _run: BuilderModule['run'] | undefined = undefined;
        let _queryBuildConfig: BuilderModule['queryBuildConfig'] | undefined = undefined;
        let _init: BuilderModule['init'] | undefined = undefined;
        let _createBuildTask: BuilderModule['createBuildTask'] | undefined = undefined;
        let _getPreviewSettings: BuilderModule['getPreviewSettings'] | undefined = undefined;
        let _getRegisteredPlatforms: BuilderModule['getRegisteredPlatforms'] | undefined = undefined;
        let _executeBuildStageTask: BuilderModule['executeBuildStageTask'] | undefined = undefined;

        expect(_build).toBeUndefined();
        expect(_buildBundleOnly).toBeUndefined();
        expect(_make).toBeUndefined();
        expect(_run).toBeUndefined();
        expect(_queryBuildConfig).toBeUndefined();
        expect(_init).toBeUndefined();
        expect(_createBuildTask).toBeUndefined();
        expect(_getPreviewSettings).toBeUndefined();
        expect(_getRegisteredPlatforms).toBeUndefined();
        expect(_executeBuildStageTask).toBeUndefined();
    });

    it('should be able to import IBuildTaskOption', () => {
        let options: Partial<IBuildTaskOption> = {
            buildPath: 'build',
        };
        expect(options.buildPath).toBe('build');
    });

    it('should be able to import IBuildResultData', () => {
        let result: IBuildResultData | undefined = undefined;
        expect(result).toBeUndefined();
    });

    it('IBuildCommonOptions should have key properties', () => {
        const keys: (keyof IBuildCommonOptions)[] = [
            'name', 'outputName', 'buildPath', 'platform',
            'skipCompressTexture', 'packAutoAtlas', 'sourceMaps',
            'debug', 'md5Cache', 'startScene', 'packages',
        ];
        expect(keys.length).toBeGreaterThan(0);
    });

    it('IBuildResult should have result methods', () => {
        const keys: (keyof IBuildResult)[] = [
            'dest', 'paths', 'containsAsset',
            'getRawAssetPaths', 'getJsonPathInfo',
            'getImportAssetPaths', 'getAssetPathInfo',
        ];
        expect(keys.length).toBeGreaterThan(0);
    });

    it('IBuilder should have builder properties', () => {
        const keys: (keyof IBuilder)[] = [
            'cache', 'result', 'options', 'bundleManager',
            'hooksInfo', 'buildTemplate', 'id', 'utils',
            'updateProcess', 'break',
        ];
        expect(keys.length).toBeGreaterThan(0);
    });

    it('BuildConfiguration should have config sections', () => {
        const keys: (keyof BuildConfiguration)[] = [
            'common', 'platforms', 'bundleConfig', 'textureCompressConfig',
        ];
        expect(keys.length).toBeGreaterThan(0);
    });

    it('StatsQuery should be importable as a class', () => {
        let _query: StatsQuery | undefined = undefined;
        expect(_query).toBeUndefined();
    });

    it('StatsQuery.ConstantManager namespace types should be accessible', () => {
        let _platformType: StatsQuery.ConstantManager.PlatformType = 'WEB_MOBILE';
        let _valueType: StatsQuery.ConstantManager.ValueType = true;
        expect(_platformType).toBe('WEB_MOBILE');
        expect(_valueType).toBe(true);
    });
});
