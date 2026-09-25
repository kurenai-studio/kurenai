import type { ISceneMouseEvent, ISceneKeyboardEvent } from '../operation/types';
declare class GizmoOperation {
    private _regionSelecting;
    private _gizmoMoved;
    private _hoverInNodeMap;
    private _curMouseDownInfos;
    private _gizmoMouseDownEvent;
    private _noGizmoMouseDownEvent;
    private _mouseDownRaycastGizmos;
    private _anyKeyDown;
    /**
     * Raycast against gizmo nodes
     * 与编辑器一致：优先检测右上角 SceneGizmo，再检测 gizmo root
     */
    private raycastGizmos;
    private _emitEventToNode;
    private _onNotGizmoMouseDown;
    private _onNotGizmoMouseUp;
    private _onNotGizmoMouseMove;
    private _onGizmoMouseDown;
    private _onGizmoMouseUp;
    private _onGizmoMouseMove;
    onMouseDown(event: ISceneMouseEvent): boolean | void;
    onMouseUp(event: ISceneMouseEvent): boolean | void;
    onMouseMove(event: ISceneMouseEvent): boolean | void;
    onMouseWheel(): void;
    private _changeMouseHover;
    private _selectNode;
    private _regionSelectNode;
    private _showSelectionRegion;
    private _hideSelectionRegion;
    onKeyDown(event: ISceneKeyboardEvent): boolean | void;
    onKeyUp(event: ISceneKeyboardEvent): boolean | void;
    init(): void;
    clear(): void;
}
export default GizmoOperation;
