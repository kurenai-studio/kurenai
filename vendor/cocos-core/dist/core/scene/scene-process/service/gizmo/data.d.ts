import { Component } from 'cc';
import { TGizmoType } from './types';
declare module 'cc' {
    interface Node {
        gizmo: any | null;
        iconGizmo: any | null;
        persistentGizmo: any | null;
        noNeedCommitChanges?: boolean;
    }
    interface Component {
        gizmo: any | null;
        iconGizmo: any | null;
        persistentGizmo: any | null;
    }
}
export declare function setGizmoProperty(type: TGizmoType, obj: Component, gizmo: any | null): void;
export declare function getGizmoProperty(type: TGizmoType, obj: Component): any | null | undefined;
