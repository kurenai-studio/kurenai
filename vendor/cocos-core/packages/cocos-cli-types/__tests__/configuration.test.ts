type ConfigurationModule = typeof import('../configuration');
import type { IConfiguration, IBaseConfiguration, ConfigurationScope, ICocosConfigurationNode, ICocosConfigurationPropertySchema } from '../configuration';

describe('cocos-cli-types: configuration', () => {
    it('should be able to import api functions', () => {
        let _init: ConfigurationModule['init'] | undefined = undefined;
        let _migrateFromProject: ConfigurationModule['migrateFromProject'] | undefined = undefined;
        let _reload: ConfigurationModule['reload'] | undefined = undefined;
        let _get: ConfigurationModule['get'] | undefined = undefined;
        let _set: ConfigurationModule['set'] | undefined = undefined;
        let _remove: ConfigurationModule['remove'] | undefined = undefined;
        let _save: ConfigurationModule['save'] | undefined = undefined;
        let _migrate: ConfigurationModule['migrate'] | undefined = undefined;
        let _getConfigPath: ConfigurationModule['getConfigPath'] | undefined = undefined;
        let _onDidSave: ConfigurationModule['onDidSave'] | undefined = undefined;
        let _getMetadata: ConfigurationModule['getMetadata'] | undefined = undefined;

        expect(_init).toBeUndefined();
        expect(_migrateFromProject).toBeUndefined();
        expect(_reload).toBeUndefined();
        expect(_get).toBeUndefined();
        expect(_set).toBeUndefined();
        expect(_remove).toBeUndefined();
        expect(_save).toBeUndefined();
        expect(_migrate).toBeUndefined();
        expect(_getConfigPath).toBeUndefined();
        expect(_onDidSave).toBeUndefined();
        expect(_getMetadata).toBeUndefined();
    });

    it('should be able to import IConfiguration', () => {
        let options: Partial<IConfiguration> = {
            name: 'test-config',
        };
        expect(options.name).toBe('test-config');
    });

    it('IBaseConfiguration should have core methods', () => {
        const keys: (keyof IBaseConfiguration)[] = [
            'moduleName', 'getDefaultConfig', 'mergeDefaultConfig',
            'get', 'getAll', 'set', 'remove', 'save',
            'on', 'off', 'once', 'emit',
        ];
        expect(keys.length).toBeGreaterThan(0);
    });

    it('ConfigurationScope should be a string union', () => {
        let scope: ConfigurationScope = 'default';
        expect(scope).toBe('default');
        scope = 'project';
        expect(scope).toBe('project');
    });

    it('ICocosConfigurationNode should have schema structure', () => {
        const keys: (keyof ICocosConfigurationNode)[] = ['id', 'title', 'group', 'properties'];
        expect(keys).toHaveLength(4);
    });

    it('ICocosConfigurationPropertySchema should have type field', () => {
        const keys: (keyof ICocosConfigurationPropertySchema)[] = ['type', 'default', 'title', 'description'];
        expect(keys.length).toBeGreaterThan(0);
    });
});
