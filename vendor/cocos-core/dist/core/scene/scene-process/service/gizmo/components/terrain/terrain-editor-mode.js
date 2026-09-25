"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerrainEditorMode = exports.eTerrainEditorMode = void 0;
var eTerrainEditorMode;
(function (eTerrainEditorMode) {
    eTerrainEditorMode[eTerrainEditorMode["MANAGE"] = 0] = "MANAGE";
    eTerrainEditorMode[eTerrainEditorMode["SCULPT"] = 1] = "SCULPT";
    eTerrainEditorMode[eTerrainEditorMode["PAINT"] = 2] = "PAINT";
    eTerrainEditorMode[eTerrainEditorMode["SELECT"] = 3] = "SELECT";
})(eTerrainEditorMode || (exports.eTerrainEditorMode = eTerrainEditorMode = {}));
class TerrainEditorMode {
    _gizmo;
    constructor(gizmo) { this._gizmo = gizmo; }
    get gizmo() { return this._gizmo; }
    onUpdate(_terrain, _dTime, _isShiftDown) { }
    onActivate() { }
    onDeactivate() { }
    forceUpdate() { }
}
exports.TerrainEditorMode = TerrainEditorMode;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVycmFpbi1lZGl0b3ItbW9kZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jb3JlL3NjZW5lL3NjZW5lLXByb2Nlc3Mvc2VydmljZS9naXptby9jb21wb25lbnRzL3RlcnJhaW4vdGVycmFpbi1lZGl0b3ItbW9kZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSxJQUFZLGtCQUFvRDtBQUFoRSxXQUFZLGtCQUFrQjtJQUFHLCtEQUFNLENBQUE7SUFBRSwrREFBTSxDQUFBO0lBQUUsNkRBQUssQ0FBQTtJQUFFLCtEQUFNLENBQUE7QUFBQyxDQUFDLEVBQXBELGtCQUFrQixrQ0FBbEIsa0JBQWtCLFFBQWtDO0FBRWhFLE1BQWEsaUJBQWlCO0lBQ2hCLE1BQU0sQ0FBTTtJQUN0QixZQUFZLEtBQVUsSUFBSSxJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDaEQsSUFBSSxLQUFLLEtBQUssT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUM1QixRQUFRLENBQUMsUUFBaUIsRUFBRSxNQUFjLEVBQUUsWUFBcUIsSUFBRyxDQUFDO0lBQ3JFLFVBQVUsS0FBSSxDQUFDO0lBQ2YsWUFBWSxLQUFJLENBQUM7SUFDakIsV0FBVyxLQUFJLENBQUM7Q0FDMUI7QUFSRCw4Q0FRQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgVGVycmFpbiB9IGZyb20gJ2NjJztcblxuZXhwb3J0IGVudW0gZVRlcnJhaW5FZGl0b3JNb2RlIHsgTUFOQUdFLCBTQ1VMUFQsIFBBSU5ULCBTRUxFQ1QgfVxuXG5leHBvcnQgY2xhc3MgVGVycmFpbkVkaXRvck1vZGUge1xuICAgIHByb3RlY3RlZCBfZ2l6bW86IGFueTtcbiAgICBjb25zdHJ1Y3RvcihnaXptbzogYW55KSB7IHRoaXMuX2dpem1vID0gZ2l6bW87IH1cbiAgICBnZXQgZ2l6bW8oKSB7IHJldHVybiB0aGlzLl9naXptbzsgfVxuICAgIHB1YmxpYyBvblVwZGF0ZShfdGVycmFpbjogVGVycmFpbiwgX2RUaW1lOiBudW1iZXIsIF9pc1NoaWZ0RG93bjogYm9vbGVhbikge31cbiAgICBwdWJsaWMgb25BY3RpdmF0ZSgpIHt9XG4gICAgcHVibGljIG9uRGVhY3RpdmF0ZSgpIHt9XG4gICAgcHVibGljIGZvcmNlVXBkYXRlKCkge31cbn1cbiJdfQ==