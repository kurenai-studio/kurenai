import { type Node } from 'cc';
export declare function getEditorNodeByPath(path: string): Node | null;
export declare function getEditorNodeByUuid(uuid: string): Node | null;
export declare function getEditorNodeUuidByPath(path: string): string;
export declare function getEditorNodePath(node: Node): string;
