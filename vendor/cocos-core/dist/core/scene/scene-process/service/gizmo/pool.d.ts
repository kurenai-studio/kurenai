import type { TGizmoType } from './types';
export { TGizmoType };
/**
 * Gizmo 注册表 — 其他模块将 Gizmo 类注册到此对象中
 */
export declare const GizmoDefines: {
    components: Record<string, new (...args: any[]) => any>;
    iconGizmo: Record<string, new (...args: any[]) => any>;
    persistentGizmo: Record<string, new (...args: any[]) => any>;
    methods: Record<string, {
        [name: string]: (...args: any[]) => void;
    }>;
};
export declare class GizmoPool {
    private _transformPool;
    private _componentsPool;
    private _iconPool;
    private _persistentPool;
    private _getPool;
    private unmountGizmo;
    forEachInstanceList(type: TGizmoType, name: string, handle: (gizmo: any) => void): void;
    createGizmo(type: TGizmoType, name: string): any | null;
    destroyGizmo(gizmo: any): void;
    clearAllGizmos(): void;
}
