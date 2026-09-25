import { Terrain } from 'cc';
import GizmoBase from '../../base/gizmo-base';
import type { GizmoMouseEvent } from '../../utils/defines';
/** Persistent gizmo receiving mouse input over the non-raycast Terrain component. */
export default class TerrainPersistentGizmo extends GizmoBase<Terrain> {
    private _controller;
    private get selectGizmo();
    protected init(): void;
    private updateController;
    onTargetUpdate(): void;
    onNodeChanged(): void;
    onControllerMouseDown(event: GizmoMouseEvent): void;
    onControllerMouseMove(event: GizmoMouseEvent): void;
    onControllerMouseUp(event: GizmoMouseEvent): void;
    onControllerHoverOut(): void;
}
