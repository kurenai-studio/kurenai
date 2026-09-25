import type { ICLI, IServiceManager, GlobalEventManager } from '../cli';

describe('cocos-cli-types: cli', () => {
    it('should export ICLI interface with Scene and SceneEvents', () => {
        const cli: Partial<ICLI> = {};
        expect(cli).toBeDefined();
    });

    it('IServiceManager should have all 15 service modules', () => {
        const scene: Partial<IServiceManager> = {};

        const serviceKeys: (keyof IServiceManager)[] = [
            'Editor', 'Node', 'Component', 'Script',
            'Asset', 'Engine', 'Prefab', 'Selection',
            'Operation', 'Undo', 'Camera', 'Gizmo',
            'SceneView', 'Preview', 'UI',
        ];

        for (const key of serviceKeys) {
            expect(key).toBeDefined();
        }
        expect(serviceKeys).toHaveLength(15);
        expect(scene).toBeDefined();
    });

    it('IServiceManager.Editor should have core methods', () => {
        type EditorKeys = keyof IServiceManager['Editor'];
        const editorMethods: EditorKeys[] = ['open', 'close', 'save', 'reload', 'create', 'queryCurrent', 'hasOpen'];
        expect(editorMethods.length).toBeGreaterThan(0);
    });

    it('IServiceManager.Node should have CRUD methods', () => {
        type NodeKeys = keyof IServiceManager['Node'];
        const nodeMethods: NodeKeys[] = [
            'createByType', 'createByAsset', 'delete', 'query', 'queryNodeTree',
            'setProperty', 'previewSetProperty', 'cancelPreviewSetProperty',
            'reset', 'resetProperty', 'getPathByUuid',
        ];
        expect(nodeMethods.length).toBeGreaterThan(0);
    });

    it('IServiceManager.Component should have component methods', () => {
        type CompKeys = keyof IServiceManager['Component'];
        const compMethods: CompKeys[] = [
            'add', 'remove', 'setProperty', 'query', 'queryAll',
            'reset', 'queryClasses', 'queryComponents', 'hasScript',
        ];
        expect(compMethods.length).toBeGreaterThan(0);
    });

    it('IServiceManager.Prefab should have prefab methods', () => {
        type PrefabKeys = keyof IServiceManager['Prefab'];
        const prefabMethods: PrefabKeys[] = [
            'createPrefabFromNode', 'applyPrefabChanges', 'revertToPrefab',
            'unpackPrefabInstance', 'isPrefabInstance', 'getPrefabInfo',
        ];
        expect(prefabMethods).toHaveLength(6);
    });

    it('IServiceManager.Camera should have camera methods', () => {
        type CameraKeys = keyof IServiceManager['Camera'];
        const cameraMethods: CameraKeys[] = [
            'init', 'focus', 'changeProjection', 'queryConfig',
            'zoomUp', 'zoomDown', 'zoomReset',
        ];
        expect(cameraMethods.length).toBeGreaterThan(0);
    });

    it('IServiceManager.Selection should have selection methods', () => {
        type SelectionKeys = keyof IServiceManager['Selection'];
        const selectionMethods: SelectionKeys[] = [
            'select', 'unselect', 'clear', 'query', 'isSelect', 'reset',
        ];
        expect(selectionMethods).toHaveLength(6);
    });

    it('IServiceManager.Undo should have undo methods', () => {
        type UndoKeys = keyof IServiceManager['Undo'];
        const undoMethods: UndoKeys[] = [
            'beginRecording', 'endRecording', 'cancelRecording',
            'undo', 'redo', 'canUndo', 'reset', 'isDirty',
        ];
        expect(undoMethods).toHaveLength(8);
    });

    it('GlobalEventManager should have event methods', () => {
        type EventKeys = keyof GlobalEventManager;
        const eventMethods: EventKeys[] = ['on', 'once', 'off', 'emit', 'broadcast', 'clear'];
        expect(eventMethods).toHaveLength(6);
    });

    it('ICLI should compose Scene and SceneEvents correctly', () => {
        type SceneType = ICLI['Scene'];
        type EventsType = ICLI['SceneEvents'];

        const hasEditor: keyof SceneType = 'Editor';
        const hasOn: keyof EventsType = 'on';

        expect(hasEditor).toBe('Editor');
        expect(hasOn).toBe('on');
    });
});
