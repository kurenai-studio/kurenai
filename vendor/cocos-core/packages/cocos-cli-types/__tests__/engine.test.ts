type EngineModule = typeof import('../engine');
import type { EngineInfo, IEngineConfig, IEngineModuleConfig, IDesignResolution, ModuleRenderConfig, IPhysicsConfig } from '../engine';

describe('cocos-cli-types: engine', () => {
    it('should be able to import api functions', () => {
        let _init: EngineModule['init'] | undefined = undefined;
        let _getConfig: EngineModule['getConfig'] | undefined = undefined;
        let _getInfo: EngineModule['getInfo'] | undefined = undefined;
        let _getRenderConfig: EngineModule['getRenderConfig'] | undefined = undefined;
        let _initEngine: EngineModule['initEngine'] | undefined = undefined;
        let _startEngineCompilation: EngineModule['startEngineCompilation'] | undefined = undefined;
        let _queryLayerBuiltin: EngineModule['queryLayerBuiltin'] | undefined = undefined;

        expect(_init).toBeUndefined();
        expect(_getConfig).toBeUndefined();
        expect(_getInfo).toBeUndefined();
        expect(_getRenderConfig).toBeUndefined();
        expect(_initEngine).toBeUndefined();
        expect(_startEngineCompilation).toBeUndefined();
        expect(_queryLayerBuiltin).toBeUndefined();
    });

    it('EngineInfo should have typescript and native fields', () => {
        const keys: (keyof EngineInfo)[] = ['typescript', 'native', 'tmpDir', 'version'];
        expect(keys).toHaveLength(4);
    });

    it('IEngineConfig should extend IEngineModuleConfig', () => {
        const moduleKeys: (keyof IEngineModuleConfig)[] = ['includeModules'];
        const configKeys: (keyof IEngineConfig)[] = [
            'includeModules', 'physicsConfig', 'designResolution',
            'splashScreen', 'highQuality', 'macroCustom',
        ];
        expect(moduleKeys.length).toBeGreaterThan(0);
        expect(configKeys.length).toBeGreaterThan(0);
    });

    it('IDesignResolution should have dimension fields', () => {
        let res: IDesignResolution = { height: 720, width: 1280 };
        expect(res.height).toBe(720);
        expect(res.width).toBe(1280);
    });

    it('ModuleRenderConfig should have features and categories', () => {
        const keys: (keyof ModuleRenderConfig)[] = ['features', 'categories', 'version'];
        expect(keys).toHaveLength(3);
    });

    it('IPhysicsConfig should have physics properties', () => {
        const keys: (keyof IPhysicsConfig)[] = [
            'gravity', 'allowSleep', 'sleepThreshold',
            'autoSimulation', 'fixedTimeStep', 'maxSubSteps',
            'useNodeChains', 'collisionMatrix', 'physicsEngine',
        ];
        expect(keys.length).toBeGreaterThan(0);
    });
});
