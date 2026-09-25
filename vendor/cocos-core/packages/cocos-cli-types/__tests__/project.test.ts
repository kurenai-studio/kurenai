type ProjectModule = typeof import('../project');
import type { IProject, ProjectInfo, ProjectType } from '../project';

describe('cocos-cli-types: project', () => {
    it('should be able to import api functions', () => {
        let _init: ProjectModule['init'] | undefined = undefined;
        let _open: ProjectModule['open'] | undefined = undefined;
        let _close: ProjectModule['close'] | undefined = undefined;
        let _get: ProjectModule['get'] | undefined = undefined;
        let _getInfo: ProjectModule['getInfo'] | undefined = undefined;

        expect(_init).toBeUndefined();
        expect(_open).toBeUndefined();
        expect(_close).toBeUndefined();
        expect(_get).toBeUndefined();
        expect(_getInfo).toBeUndefined();
    });

    it('IProject should have core properties and methods', () => {
        const keys: (keyof IProject)[] = [
            'path', 'type', 'pkgPath', 'tmpDir', 'libraryDir',
            'open', 'close', 'getInfo', 'updateInfo',
        ];
        expect(keys.length).toBeGreaterThan(0);
    });

    it('ProjectInfo should be importable', () => {
        let info: Partial<ProjectInfo> = {};
        expect(info).toBeDefined();
    });

    it('ProjectType should be a union of 2d and 3d', () => {
        let type: ProjectType = '2d';
        expect(type).toBe('2d');
        type = '3d';
        expect(type).toBe('3d');
    });
});
