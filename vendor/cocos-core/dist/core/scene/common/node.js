"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventSourceType = exports.NodeEventType = exports.MobilityMode = exports.NodeType = void 0;
var NodeType;
(function (NodeType) {
    NodeType["EMPTY"] = "Empty";
    NodeType["TERRAIN"] = "Terrain";
    NodeType["CAMERA"] = "Camera";
    NodeType["SPRITE"] = "Sprite";
    NodeType["SPRITE_SPLASH"] = "SpriteSplash";
    NodeType["GRAPHICS"] = "Graphics";
    NodeType["LABEL"] = "Label";
    NodeType["MASK"] = "Mask";
    NodeType["PARTICLE"] = "Particle";
    NodeType["TILED_MAP"] = "TiledMap";
    NodeType["CAPSULE"] = "Capsule";
    NodeType["CONE"] = "Cone";
    NodeType["CUBE"] = "Cube";
    NodeType["CYLINDER"] = "Cylinder";
    NodeType["PLANE"] = "Plane";
    NodeType["QUAD"] = "Quad";
    NodeType["SPHERE"] = "Sphere";
    NodeType["TORUS"] = "Torus";
    NodeType["BUTTON"] = "Button";
    NodeType["CANVAS"] = "Canvas";
    NodeType["EDIT_BOX"] = "EditBox";
    NodeType["LAYOUT"] = "Layout";
    NodeType["PAGE_VIEW"] = "PageView";
    NodeType["PROGRESS_BAR"] = "ProgressBar";
    NodeType["RICH_TEXT"] = "RichText";
    NodeType["SCROLL_VIEW"] = "ScrollView";
    NodeType["SLIDER"] = "Slider";
    NodeType["TOGGLE"] = "Toggle";
    NodeType["TOGGLE_GROUP"] = "ToggleGroup";
    NodeType["VIDEO_PLAYER"] = "VideoPlayer";
    NodeType["WEB_VIEW"] = "WebView";
    NodeType["WIDGET"] = "Widget";
    NodeType["DIRECTIONAL_LIGHT"] = "Light-Directional";
    NodeType["SPHERE_LIGHT"] = "Light-Sphere";
    NodeType["SPOT_LIGHT"] = "Light-Spot";
    NodeType["PROBE_LIGHT"] = "Light-Probe-Group";
    NodeType["REFLECTION_LIGHT"] = "Light-Reflection-Probe";
})(NodeType || (exports.NodeType = NodeType = {}));
var MobilityMode;
(function (MobilityMode) {
    /**
    * @en Static node
    * @zh 静态节点
    */
    MobilityMode[MobilityMode["Static"] = 0] = "Static";
    /**
     * @en Stationary node
     * @zh 固定节点
     */
    MobilityMode[MobilityMode["Stationary"] = 1] = "Stationary";
    /**
     * @en Movable node
     * @zh 可移动节点
     */
    MobilityMode[MobilityMode["Movable"] = 2] = "Movable";
})(MobilityMode || (exports.MobilityMode = MobilityMode = {}));
///
var NodeEventType;
(function (NodeEventType) {
    NodeEventType["TRANSFORM_CHANGED"] = "transform-changed";
    NodeEventType["SIZE_CHANGED"] = "size-changed";
    NodeEventType["ANCHOR_CHANGED"] = "anchor-changed";
    NodeEventType["CHILD_ADDED"] = "child-added";
    NodeEventType["CHILD_REMOVED"] = "child-removed";
    NodeEventType["PARENT_CHANGED"] = "parent-changed";
    NodeEventType["CHILD_CHANGED"] = "child-changed";
    NodeEventType["COMPONENT_CHANGED"] = "component-changed";
    NodeEventType["ACTIVE_IN_HIERARCHY_CHANGE"] = "active-in-hierarchy-changed";
    NodeEventType["NOTIFY_NODE_CHANGED"] = "notify-node-changed";
    NodeEventType["PREFAB_INFO_CHANGED"] = "prefab-info-changed";
    NodeEventType["LIGHT_PROBE_CHANGED"] = "light-probe-changed";
    NodeEventType["LIGHT_PROBE_BAKING_CHANGED"] = "light-probe-baking-changed";
    //
    NodeEventType["SET_PROPERTY"] = "set-property";
    NodeEventType["MOVE_ARRAY_ELEMENT"] = "move-array-element";
    NodeEventType["REMOVE_ARRAY_ELEMENT"] = "remove-array-element";
    NodeEventType["CREATE_COMPONENT"] = "create-component";
    NodeEventType["RESET_COMPONENT"] = "reset-component";
})(NodeEventType || (exports.NodeEventType = NodeEventType = {}));
var EventSourceType;
(function (EventSourceType) {
    EventSourceType["EDITOR"] = "editor";
    EventSourceType["UNDO"] = "undo";
    EventSourceType["ENGINE"] = "engine";
})(EventSourceType || (exports.EventSourceType = EventSourceType = {}));
