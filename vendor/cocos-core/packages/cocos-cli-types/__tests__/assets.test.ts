type AssetsModule = typeof import('../assets');
import type { AssetHandlerType, AssetDBOptions, IAssetInfo, IAssetType, IAssetMeta, AssetUserDataMap, CreateAssetOptions, DeleteAssetOptions, QueryAssetsOption } from '../assets';

describe('cocos-cli-types: assets', () => {
    it('should be able to import api functions', () => {
        let _init: AssetsModule['init'] | undefined = undefined;
        let _createAsset: AssetsModule['createAsset'] | undefined = undefined;
        let _createAssetByType: AssetsModule['createAssetByType'] | undefined = undefined;
        let _deleteAsset: AssetsModule['deleteAsset'] | undefined = undefined;
        let _importAsset: AssetsModule['importAsset'] | undefined = undefined;
        let _queryAssetInfo: AssetsModule['queryAssetInfo'] | undefined = undefined;
        let _queryAssetInfos: AssetsModule['queryAssetInfos'] | undefined = undefined;
        let _queryAssetMeta: AssetsModule['queryAssetMeta'] | undefined = undefined;
        let _saveAsset: AssetsModule['saveAsset'] | undefined = undefined;
        let _moveAsset: AssetsModule['moveAsset'] | undefined = undefined;
        let _renameAsset: AssetsModule['renameAsset'] | undefined = undefined;
        let _refresh: AssetsModule['refresh'] | undefined = undefined;
        let _reimportAsset: AssetsModule['reimportAsset'] | undefined = undefined;
        let _queryUUID: AssetsModule['queryUUID'] | undefined = undefined;
        let _queryPath: AssetsModule['queryPath'] | undefined = undefined;
        let _queryUrl: AssetsModule['queryUrl'] | undefined = undefined;
        let _generateThumbnail: AssetsModule['generateThumbnail'] | undefined = undefined;
        let _onAssetAdded: AssetsModule['onAssetAdded'] | undefined = undefined;
        let _onAssetChanged: AssetsModule['onAssetChanged'] | undefined = undefined;
        let _onAssetRemoved: AssetsModule['onAssetRemoved'] | undefined = undefined;
        let _onReady: AssetsModule['onReady'] | undefined = undefined;
        let _onDBReady: AssetsModule['onDBReady'] | undefined = undefined;

        expect(_init).toBeUndefined();
        expect(_createAsset).toBeUndefined();
        expect(_createAssetByType).toBeUndefined();
        expect(_deleteAsset).toBeUndefined();
        expect(_importAsset).toBeUndefined();
        expect(_queryAssetInfo).toBeUndefined();
        expect(_queryAssetInfos).toBeUndefined();
        expect(_queryAssetMeta).toBeUndefined();
        expect(_saveAsset).toBeUndefined();
        expect(_moveAsset).toBeUndefined();
        expect(_renameAsset).toBeUndefined();
        expect(_refresh).toBeUndefined();
        expect(_reimportAsset).toBeUndefined();
        expect(_queryUUID).toBeUndefined();
        expect(_queryPath).toBeUndefined();
        expect(_queryUrl).toBeUndefined();
        expect(_generateThumbnail).toBeUndefined();
        expect(_onAssetAdded).toBeUndefined();
        expect(_onAssetChanged).toBeUndefined();
        expect(_onAssetRemoved).toBeUndefined();
        expect(_onReady).toBeUndefined();
        expect(_onDBReady).toBeUndefined();
    });

    it('should be able to import AssetHandlerType', () => {
        let type: AssetHandlerType = 'database';
        expect(type).toBe('database');
    });

    it('should be able to import AssetDBOptions', () => {
        let options: Partial<AssetDBOptions> = {
            name: 'test-db',
            target: 'path/to/target',
            level: 3,
        };
        expect(options.name).toBe('test-db');
    });

    it('IAssetInfo should have core properties', () => {
        const keys: (keyof IAssetInfo)[] = [
            'name', 'source', 'url', 'file', 'uuid',
            'importer', 'imported', 'invalid', 'type',
            'isDirectory', 'library',
        ];
        expect(keys.length).toBeGreaterThan(0);

        let info: Partial<IAssetInfo> = {
            name: 'test-asset',
            uuid: 'test-uuid',
            type: 'cc.Texture2D',
        };
        expect(info.name).toBe('test-asset');
    });

    it('should be able to import IAssetType', () => {
        let type: IAssetType = 'cc.Texture2D';
        expect(type).toBe('cc.Texture2D');
    });

    it('IAssetMeta should have meta properties', () => {
        const keys: (keyof IAssetMeta)[] = [
            'ver', 'importer', 'imported', 'uuid', 'files', 'subMetas', 'userData',
        ];
        expect(keys.length).toBeGreaterThan(0);
    });

    it('CreateAssetOptions should have target', () => {
        let options: CreateAssetOptions = {
            target: 'db://assets/test.png',
            uuid: 'test-uuid',
        };
        expect(options.target).toBe('db://assets/test.png');
    });

    it('AssetUserDataMap should support known asset types', () => {
        type ImageUserData = AssetUserDataMap['image'];
        let _data: Partial<ImageUserData> = { type: 'texture' };
        expect(_data.type).toBe('texture');
    });

    it('DeleteAssetOptions should be importable', () => {
        let options: DeleteAssetOptions = { useTrash: true };
        expect(options.useTrash).toBe(true);
    });

    it('QueryAssetsOption should be importable', () => {
        let _options: Partial<QueryAssetsOption> = {};
        expect(_options).toBeDefined();
    });
});
