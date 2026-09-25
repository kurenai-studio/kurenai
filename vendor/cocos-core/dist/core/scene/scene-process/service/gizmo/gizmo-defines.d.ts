import { Component } from 'cc';
import GizmoBase from './base/gizmo-base';
declare const GizmoDefines: {
    components: Map<string, new (target: Component | null) => GizmoBase>;
    iconGizmo: Map<string, new (target: Component | null) => GizmoBase>;
    persistentGizmo: Map<string, new (target: Component | null) => GizmoBase>;
    methods: Map<string, {
        [name: string]: (...args: any[]) => void;
    }>;
};
export declare function registerGizmo(name: string, options: {
    SelectGizmo?: any;
    IconGizmo?: any;
    PersistentGizmo?: any;
    methods?: any;
}): void;
export default GizmoDefines;
