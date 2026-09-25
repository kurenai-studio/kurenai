import type { Component, Node } from 'cc';
export interface DumpComponentAccess {
    query(uuid: string): Component | null;
    queryRecycle(uuid: string): Component | null;
    removeComponent(component: Component): boolean;
    getPathFromUuid(uuid: string): string | undefined;
}
export interface DumpNodeAccess {
    query(uuid: string | undefined): Node | null;
    addComponentAt(node: Node, comp: Component, index: number): boolean;
}
export declare function registerDumpComponentAccess(access: DumpComponentAccess): void;
export declare function registerDumpNodeAccess(access: DumpNodeAccess): void;
export declare function getDumpComponentAccess(): DumpComponentAccess;
export declare function getDumpNodeAccess(): DumpNodeAccess;
