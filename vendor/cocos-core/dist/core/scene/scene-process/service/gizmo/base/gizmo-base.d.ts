import { Node, Component } from 'cc';
declare class GizmoBase<T extends Component = Component> {
    private _hidden;
    private _target;
    protected _isInitialized: boolean;
    /**
     * Synchronous control lifecycle state shared with derived gizmos during teardown.
     * Keep resets of these flags before any asynchronous Undo finalization so hide,
     * destroy, target replacement, and mouse-up cannot finish the same drag twice.
     */
    protected _isControlBegin: boolean;
    protected _recorded: boolean;
    protected _nodeSelected: boolean;
    protected init?(): void;
    protected onShow?(): void;
    protected onHide?(): void;
    protected onTargetUpdate?(): void;
    onUpdate?(deltaTime: number): void;
    onDestroy?(): void;
    onNodeChanged?(event: any): void;
    onKeyDown?(event: any): boolean | void;
    onKeyUp?(event: any): boolean | void;
    onCameraControlModeChanged?(mode: number): void;
    shouldRegisterGizmoOperationEvent: boolean;
    undoID: string;
    constructor(target: T | null);
    get target(): T | null;
    set target(value: T | null);
    get nodes(): Node[];
    layer(): string;
    protected getGizmoRoot(): any;
    onControlBegin(propPath: string | null): void;
    onControlUpdate(propPath: string | null): void;
    onControlEnd(propPath: string | null): Promise<void>;
    recordChanges(propPath?: string | null): void;
    commitChanges(): Promise<void>;
    private createRecordingScope;
    checkVisible(): boolean;
    visible(): boolean;
    initialize(): void;
    destroy(): void;
    show(): void;
    hide(): void;
    update(deltaTime: number): void;
    getCompPropPath(propName: string): string | null;
    private collectAnimationPropertyCommitNodePaths;
    private broadcastAnimationPropertyCommitted;
    protected onComponentChanged(node: Node): void;
    onEditorCameraMoved(): void;
    registerCameraMovedEvent(): void;
    unregisterCameraMoveEvent(): void;
    onNodeSelectionChanged(selection: boolean): void;
}
export default GizmoBase;
