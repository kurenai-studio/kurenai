"use strict";
module.exports = {
    messages: {
        description: {
            gameview_stop: 'Stop GameView',
            gameview_play_of_switch_scene: 'The GameView is currently in the playing state. To switch scenes, please stop GameView.',
            open_scene: 'Open scene',
            close_scene: 'Close scene',
            save_scene: 'Save scene',
            save_as_scene: 'Save scene to other place',
            query_is_ready: 'Query the ready state of current scene',
            query_dirty: 'Query dirty state of current scene',
            query_classes: 'Query all classes',
            query_components: 'Query all components',
            query_component_has_script: 'Whether a script is in the components list',
            query_node_tree: 'Query node tree information',
            query_node_by_asset_uuid: 'Query node by asset uuid',
            set_property: 'Set property of object',
            reset_property: 'reset a property of object with default value',
            // update_property_from_null: 'update a property value of object from null',
            // set_node_and_children_layer: 'Set the layer of node and it\'s children',
            move_array_element: 'Move the position of item in the property with Array type',
            remove_array_element: 'Remove the item of property with Array type',
            cut_node: 'Cut node',
            // select_all_nodes: 'Select all nodes',
            copy_node: 'Copy node, prepare data for paste or create node',
            duplicate_node: 'Duplicate node',
            paste_node: 'Paste node',
            set_parent: 'Set parent of node',
            create_node: 'Create node',
            query_node: 'Query dump data of node',
            reset_node: 'Reset node properties: position, rotation, scale.',
            remove_node: 'Remove node',
            create_component: 'Create component',
            reset_component: 'Reset component',
            execute_component_method: 'Execute method of component',
            execute_scene_script: 'Execute method of extension script',
            query_component: 'Query dump data of component',
            snapshot: 'Snapshot current scene state',
            snapshot_abort: 'Abort snapshot',
            // undo: 'Undo operation',
            // redo: 'Redo operation',
            soft_reload: 'Soft reload scene',
            change_gizmo_tool: 'Change gizmo tool',
            change_gizmo_pivot: 'Change gizmo pivot',
            change_gizmo_coordinate: 'Change gizmo coordinate',
            change_is2D: 'Change between 2D/3D view',
            set_grid_visible: 'Show or hide grid',
            query_is_grid_visible: 'Query visible state of grid',
            set_icon_gizmo_3d: 'Set the IconGizmo to 3D or 2D',
            query_is_icon_gizmo_3d: 'Query IconGizmo mode',
            set_icon_gizmo_size: 'Set the size of IconGizmo',
            query_icon_gizmo_size: 'Query size of IconGizmo',
            query_gizmo_tool_name: 'Query current gizmo tool name',
            query_gizmo_view_mode: 'Query view mode (view/select)',
            query_gizmo_pivot: 'Query current gizmo pivot name',
            query_gizmo_coordinate: 'Query current gizmo coordinate name',
            query_is2D: 'Query current view mode(2D/3D)',
            focus_camera: 'Focus editor camera to nodes',
            align_with_view: 'Apply the scene camera position and Angle to the selected node',
            align_view_with_node: 'Applies the selected node position and Angle to the current view',
            // broadcast
            scene_ready: 'Message when scene is opened',
            scene_close: 'Message when scene is closed',
            UITransform_lack: 'UI node is being added, but the cc.UITransform component is not found in any upper node',
            UITransform_add_to_root: 'Add cc.UITransform component to the root node',
            UITransform_within_canvas: 'Create the Canvas node as the parent node',
            UITransform_cancel: 'Cancel',
            animationComponentCollision: 'Animation controller component, animation component and skeleton animation component cannot coexist.',
            physicsDynamicBodyShape: 'A dynamic rigid body can not have the following collider shapes: Terrain, Plane and Non-Convex Mesh.',
            light_probe_edit_mode_changed: 'LightProbe edit mode changed notification',
            light_probe_bounding_box_edit_mode_changed: 'LightProbe component bounding box edit mode changed notification',
            light_probe_delete_when_editing_probe: 'Currently in probe editing mode The probe node being edited cannot be modified. Please exit probe editing mode and try again.',
            begin_recording: 'Begin node recording for undo',
            end_recording: 'End node recording for undo',
            cancel_recording: 'Cancel node recording for undo',
            // prefab
            create_prefab: 'Create prefab asset(record undo automatically)',
            apply_prefab: 'Apply modification to prefab asset(record undo automatically)',
            restore_prefab: 'Restore prefab node form asset(record undo automatically)',
            revert_removed_component: 'Revert removed component(record undo automatically)',
            apply_removed_component: 'Apply removed component to prefab asset(record undo automatically)',
        },
        doc: {
            open_scene: `
                - uuid {string} uuid of scene asset`,
            query_classes: `
                @returns {[Object]}
                - extends? {string} filter classes which extend from this class
                `,
            query_components: `
                @returns {[Object]}
                - name {string} name of component
                - path {string} path in menu
                `,
            query_component_has_script: `
                - name class name of script
                
                @returns {boolean} exist or not
                `,
            query_node_tree: `
                - uuid? {string} the uuid of root node, default is scene node
                
                @returns {Object}
                - name {string} name of node or 'scene'
                - active {boolean} active state of node
                - type {string} cc.Scene or cc.Node
                - uuid {string} uuid of node
                - children {[]} children of current node
                - prefab {number} state of prefab, 1: normal, 2: lost resource
                - isScene {boolean} whether it is a scene node
                - components {[Object]} array of component
                    - type {string} type of component
                    - value {string} uuid of component
                    - extends {[string]} array of component inheritance chain
                `,
            query_node_by_asset_uuid: `
                - Query node by asset uuid
                
                @returns {string[]}  uuid of node
                `,
            set_property: `
                - options {SetPropertyOptions}
                    - uuid {string} uuid of the object
                    - path {string} search path of the property
                    - dump {IProperty} the dump data of the property
                `,
            reset_property: `
                - options {SetPropertyOptions}
                    - uuid {string} uuid of the object
                    - path {string} search path of the property
                `,
            // update_property_from_null: `
            // - options {SetPropertyOptions}
            //     - uuid {string} uuid of the object
            //     - path {string} search path of the property
            // `,
            // set_node_and_children_layer: `
            // - options {SetPropertyOptions}
            //     - uuid {string} uuid of the object
            //     - path {string} search path of the property
            //     - dump {IProperty} the dump data of the property
            // `,
            move_array_element: `
                - options {MoveArrayOptions}
                    - uuid {string} uuid of node
                    - path {string} search path of array
                    - target {number} original index of the target item
                    - offset {number} move offset
                
                @returns {boolean} whether it is successful
                `,
            remove_array_element: `
                - options {MoveArrayOptions}
                    - uuid {string} uuid of node
                    - path {string} search path of array
                    - index {number} index of item
                
                @returns {boolean} whether it is successful
                `,
            // select_all_nodes: `
            // - Select all nodes. In different scene modes, the selected node types are different. For example, in Light Probe Editor mode, only Light Probe nodes are selected.
            // @returns {string[]} uuid of nodes
            // `,
            copy_node: `
                - uuids {string | string[]} uuid of node
                
                @returns {string | string[]} uuid of node
                `,
            cut_node: `
                - uuids {string | string[]} uuid of node
                
                @returns {string | string[]} uuid of node
                `,
            duplicate_node: `
                - uuids {string | string[]} uuid of node
                
                @returns {string | string[]} uuid of new node
                `,
            paste_node: `
                - options {PasteNodeOptions}
                    - target {string} uuid of target node
                    - uuids {string | string[]} uuid of node that is copied
                    - keepWorldTransform {boolean} whether to keep the world transform
                
                @returns {string | string[]} uuid of new node
                `,
            set_parent: `
                - options {CutNodeOptions}
                    - parent {string} uuid of parent
                    - uuids {string|string[]} uuid of the node that need to set
                    - keepWorldTransform {boolean} whether to keep the world transform
                
                @returns {string | string[]} uuid of node
                `,
            create_node: `
                - options {CreateNodeOptions}
                    - parent {string} uuid of parent
                    - components? {string[]} component names
                
                    - name? {string} name of node
                    - dump? {INode | IScene} dump data of node
                    - keepWorldTransform? {boolean} whether to keep the world transform
                    - type? {string} asset type
                    - canvasRequired? {boolean} need cc.Canvas or not
                    - unlinkPrefab? {boolean} to be a normal node
                    - assetUuid? {string} uuid of asset, if this value is set, create node from this asset
                
                @returns {string | string[]} uuid of node
                `,
            query_node: `
                - uuid {string} uuid of node

                @returns {Object} dump of node
                `,
            reset_node: `
                - uuid {string} uuid of node

                @returns {boolean} whether it is successful
                `,
            restore_prefab: `
                - uuid {string} uuid of node
                - assetUuid {string} uuid of asset

                @returns {boolean} whether it is successful
                `,
            remove_node: `
                - options {RemoveNodeOptions}
                    - uuid: {string | string[]} uuid of node
                `,
            create_component: `
                - options {CreateComponentOptions}
                    - uuid {string} uuid of node
                    - component {string} classId (cid) (is recommended) or className
                `,
            remove_component: `
                - options {CreateComponentOptions}
                    - uuid {string} uuid of node
                    - component {string} classId (cid) (is recommended) or className
                `,
            reset_component: `
                - options {ResetComponentOptions}
                    - uuid {string} uuid of component
                
                @returns {boolean} whether it is successful
                `,
            execute_component_method: `
                - options {ExecuteComponentMethodOptions}
                    - uuid {string} uuid of component
                    - name {string} name of method
                    - args {any[]} arguments
                `,
            execute_scene_script: `
                - options {ExecuteSceneScriptMethodsOptions}
                    - name {string} name of extension
                    - method {string} name of method
                    - args {any[]} arguments
                `,
            query_component: `
                - uuid {string} uuid of component

                @returns {Object} dump of component
                `,
            change_gizmo_tool: `
                - name {string} tool name 'position' | 'rotation' | 'scale' | 'rect'
                `,
            change_gizmo_pivot: `
                - name {string} pivot name 'pivot' | 'center'
                `,
            change_gizmo_coordinate: `
                - type {string} coordinate name 'local' | 'global'
                `,
            change_is2D: `
                - is2D {boolean} 2D/3D view
                `,
            set_grid_visible: `
                - visible {boolean} show/hide grid
                `,
            query_is_grid_visible: `
                @returns {boolean} true: visible, false: invisible
                `,
            set_icon_gizmo_3d: `
                - is3D {boolean} 3D/2D IconGizmo
                `,
            query_is_icon_gizmo_3d: `
                @returns {boolean} true: 3D, false: 2D
                `,
            set_icon_gizmo_size: `
                - size {number} size of IconGizmo
                `,
            query_icon_gizmo_size: `
                @returns {number} size of IconGizmo
                `,
            query_gizmo_tool_name: `
                @returns {string} 'position' | 'rotation' | 'scale' | 'rect'
                `,
            query_gizmo_view_mode: `
                @return {string} 'view' | 'select'
                `,
            query_gizmo_pivot: `
                @returns {string} 'pivot' | 'center'
                `,
            query_gizmo_coordinate: `
                @returns {string} 'local' | 'global'
                `,
            query_is2D: `
                @returns {boolean} true:2D, false:3D
                `,
            focus_camera: `
                - uuids {string[] | null} uuid of node
                `,
            align_with_view: `
                @returns {null}
                `,
            align_view_with_node: `
                @returns {null}
                `,
            // broadcast
            scene_ready: `
                - uuid {string} uuid of scene
                `,
            light_probe_edit_mode_changed: `
                - mode {boolean} light probe edit mode after changed
                `,
            light_probe_bounding_box_edit_mode_changed: `
                - mode {boolean} light probe component bounding box edit mode after changed
                `,
        },
        example: {
            // message
            open_scene: `
await Editor.Message.request('scene', 'open-scene', sceneUuid);
                `,
            save_scene: `
await Editor.Message.request('scene', 'save-scene');
                `,
            save_as_scene: `
await Editor.Message.request('scene', 'save-as-scene');
                `,
            close_scene: `
await Editor.Message.request('scene', 'close-scene');
                `,
            query_is_ready: `
await Editor.Message.request('scene', 'query-is-ready');
                `,
            query_dirty: `
await Editor.Message.request('scene', 'query-dirty');
                `,
            query_classes: `
await Editor.Message.request('scene', 'query-classes');
                `,
            query_components: `
await Editor.Message.request('scene', 'query-components');
                `,
            query_component_has_script: `
await Editor.Message.request('scene', 'query-component-has-script', 'cc.Sprite');
                `,
            query_node_tree: `
await Editor.Message.request('scene', 'query-node-tree', nodeUuid);
                `,
            query_node_by_asset_uuid: `
await Editor.Message.request('scene', 'query-nodes-by-asset-uuid', assetUuid);
                `,
            set_property: `
await Editor.Message.request('scene', 'set-property', {
    uuid: nodeUuid,
    path: '__comps__.1.defaultClip',
    dump: {
        type: 'cc.AnimationClip',
        value: {
            uuid: animClipUuid,
        },
    },
});
                `,
            reset_property: `
await Editor.Message.request('scene', 'reset-property', {
    uuid: nodeUuid,
    path: 'position',
});
                `,
            move_array_element: `
await Editor.Message.request('scene', 'move-array-element', {
    uuid: nodeUuid,
    path: '__comps__',
    target: 1,
    offset: -1,
});
                `,
            remove_array_element: `
await Editor.Message.request('scene', 'remove-array-element', {
    uuid: nodeUuid,
    path: '__comps__',
    index: 0,
});
                `,
            copy_node: `
await Editor.Message.request('scene', 'copy-node', uuids);
                `,
            cut_node: `
await Editor.Message.request('scene', 'cut-node', uuids);
                `,
            duplicate_node: `
await Editor.Message.request('scene', 'duplicate-node', uuids);
                `,
            paste_node: `
await Editor.Message.request('scene', 'paste-node', {
    target: nodeUuid,
    uuids: nodeUuids,
});
                `,
            set_parent: `
await Editor.Message.request('scene','set-parent', {
    parent: nodeUuid,
    uuids: nodeUuids,
});
                `,
            create_node: `
await Editor.Message.request('scene', 'create-node', {
    name: 'New Node'
    parent: nodeUuid,
});
                `,
            query_node: `
await Editor.Message.request('scene', 'query-node', nodeUuid);
                `,
            reset_node: `
await Editor.Message.request('scene', 'reset-node', {
    uuid: nodeUuid,
});
                `,
            restore_prefab: `
await Editor.Message.request('scene', 'restore-prefab', nodeUuid, assetUuid);
                `,
            remove_node: `
await Editor.Message.request('scene', 'remove-node', { 
    uuid: nodeUuid
});
                `,
            create_component: `
Editor.Message.request('scene', 'create-component', { 
    uuid: nodeUuid,
    component: 'cc.Sprite'
});
                `,
            remove_component: `
await Editor.Message.request('scene', 'remove-component', { 
    uuid: componentUuid,
});
                `,
            reset_component: `
await Editor.Message.request('scene', 'reset-component', {
    uuid: componentUuid,
});
                `,
            execute_component_method: `
await Editor.Message.request('scene', 'execute-component-method', {
    uuid: componentUuid,
    name: 'getNoisePreview',
    args: [100, 100],
});
                `,
            execute_scene_script: `
await Editor.Message.request('scene', 'execute-scene-script', {
    name: 'animation-graph',
    method: 'query',
    args: [],
});
                `,
            snapshot: `
await Editor.Message.request('scene', 'snapshot');
                `,
            snapshot_abort: `
await Editor.Message.request('scene', 'snapshot-abort');
                `,
            begin_recording: `
const undoID = await Editor.Message.request('scene', 'begin-recording', nodeUuid);
                `,
            end_recording: `
await Editor.Message.request('scene', 'end-recording', undoID);
                `,
            cancel_recording: `
await Editor.Message.request('scene', 'cancel-recording', undoID);
                `,
            soft_reload: `
await Editor.Message.request('scene', 'soft-reload');
                `,
            query_component: `
await Editor.Message.request('scene', 'query-component', nodeUuid);
                `,
            change_gizmo_tool: `
await Editor.Message.request('scene', 'change-gizmo-tool', 'position');
                `,
            change_gizmo_pivot: `
await Editor.Message.request('scene', 'change-gizmo-pivot');
                `,
            change_gizmo_coordinate: `
await Editor.Message.request('scene', 'change-gizmo-coordinate', 'global');
                `,
            change_is2D: `
await Editor.Message.request('scene', 'change-is2D', true);
                `,
            set_grid_visible: `
await Editor.Message.request('scene', 'set-grid-visible', false);
                `,
            query_is_grid_visible: `
await Editor.Message.request('scene', 'query-is-grid-visible');
                `,
            set_icon_gizmo_3d: `
await Editor.Message.request('scene', 'set-icon-gizmo-3d', false);
                `,
            query_is_icon_gizmo_3d: `
await Editor.Message.request('scene', 'query-is-icon-gizmo-3d');
                `,
            set_icon_gizmo_size: `
await Editor.Message.request('scene', 'set-icon-gizmo-size', 60);
                `,
            query_icon_gizmo_size: `
await Editor.Message.request('scene', 'query-icon-gizmo-size');
                `,
            query_gizmo_tool_name: `
await Editor.Message.request('scene', 'query-gizmo-tool-name');
                `,
            query_gizmo_view_mode: `
await Editor.Message.request('scene', 'query-gizmo-view-mode');
                `,
            query_gizmo_pivot: `
await Editor.Message.request('scene', 'query-gizmo-pivot');
                `,
            query_gizmo_coordinate: `
await Editor.Message.request('scene', 'query-gizmo-coordinate');
                `,
            query_is2D: `
await Editor.Message.request('scene', 'query-is2D');
                `,
            focus_camera: `
await Editor.Message.request('scene', 'focus-camera', nodeUuids);
                `,
            align_with_view: `
await Editor.Message.request('scene', 'align-with-view');
                `,
            align_view_with_node: `
await Editor.Message.request('scene', 'align-with-view-node');
                `,
            // broadcast
            scene_ready: `
Editor.Message.broadcast('scene:ready', assetUuid);
                `,
            scene_close: `
Editor.Message.broadcast('scene:close');
                `,
            light_probe_edit_mode_changed: `
Editor.Message.broadcast('scene:light-probe-edit-mode-changed', true);
                `,
            light_probe_bounding_box_edit_mode_changed: `
Editor.Message.broadcast('scene:light-probe-bounding-box-edit-mode-changed', true);
                `,
        },
    },
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVzc2FnZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9zY2VuZS9pMThuL2VuL2NvbnRyaWJ1dGlvbnMvbWVzc2FnZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE1BQU0sQ0FBQyxPQUFPLEdBQUc7SUFDYixRQUFRLEVBQUU7UUFDTixXQUFXLEVBQUU7WUFDVCxhQUFhLEVBQUUsZUFBZTtZQUM5Qiw2QkFBNkIsRUFBRSx5RkFBeUY7WUFDeEgsVUFBVSxFQUFFLFlBQVk7WUFDeEIsV0FBVyxFQUFFLGFBQWE7WUFDMUIsVUFBVSxFQUFFLFlBQVk7WUFDeEIsYUFBYSxFQUFFLDJCQUEyQjtZQUMxQyxjQUFjLEVBQUUsd0NBQXdDO1lBQ3hELFdBQVcsRUFBRSxvQ0FBb0M7WUFDakQsYUFBYSxFQUFFLG1CQUFtQjtZQUNsQyxnQkFBZ0IsRUFBRSxzQkFBc0I7WUFDeEMsMEJBQTBCLEVBQUUsNENBQTRDO1lBQ3hFLGVBQWUsRUFBRSw2QkFBNkI7WUFDOUMsd0JBQXdCLEVBQUUsMEJBQTBCO1lBQ3BELFlBQVksRUFBRSx3QkFBd0I7WUFDdEMsY0FBYyxFQUFFLCtDQUErQztZQUMvRCw0RUFBNEU7WUFDNUUsMkVBQTJFO1lBQzNFLGtCQUFrQixFQUFFLDJEQUEyRDtZQUMvRSxvQkFBb0IsRUFBRSw2Q0FBNkM7WUFDbkUsUUFBUSxFQUFFLFVBQVU7WUFDcEIsd0NBQXdDO1lBQ3hDLFNBQVMsRUFBRSxrREFBa0Q7WUFDN0QsY0FBYyxFQUFFLGdCQUFnQjtZQUNoQyxVQUFVLEVBQUUsWUFBWTtZQUN4QixVQUFVLEVBQUUsb0JBQW9CO1lBQ2hDLFdBQVcsRUFBRSxhQUFhO1lBQzFCLFVBQVUsRUFBRSx5QkFBeUI7WUFDckMsVUFBVSxFQUFFLG1EQUFtRDtZQUMvRCxXQUFXLEVBQUUsYUFBYTtZQUMxQixnQkFBZ0IsRUFBRSxrQkFBa0I7WUFDcEMsZUFBZSxFQUFFLGlCQUFpQjtZQUNsQyx3QkFB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LG1CQUFtQixFQUFFOztpQkFFaEI7WUFDTCxxQkFBcUIsRUFBRTs7aUJBRWxCO1lBQ0wscUJBQXFCLEVBQUU7O2lCQUVsQjtZQUNMLHFCQUFxQixFQUFFOztpQkFFbEI7WUFDTCxpQkFBaUIsRUFBRTs7aUJBRWQ7WUFDTCxzQkFBc0IsRUFBRTs7aUJBRW5CO1lBQ0wsVUFBVSxFQUFFOztpQkFFUDtZQUNMLFlBQVksRUFBRTs7aUJBRVQ7WUFDTCxlQUFlLEVBQUU7O2lCQUVaO1lBQ0wsb0JBQW9CLEVBQUU7O2lCQUVqQjtZQUNMLFlBQVk7WUFDWixXQUFXLEVBQUU7O2lCQUVSO1lBQ0wsV0FBVyxFQUFFOztpQkFFUjtZQUNMLDZCQUE2QixFQUFFOztpQkFFMUI7WUFDTCwwQ0FBMEMsRUFBRTs7aUJBRXZDO1NBQ1I7S0FDSjtDQUNKLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBtZXNzYWdlczoge1xuICAgICAgICBkZXNjcmlwdGlvbjoge1xuICAgICAgICAgICAgZ2FtZXZpZXdfc3RvcDogJ1N0b3AgR2FtZVZpZXcnLFxuICAgICAgICAgICAgZ2FtZXZpZXdfcGxheV9vZl9zd2l0Y2hfc2NlbmU6ICdUaGUgR2FtZVZpZXcgaXMgY3VycmVudGx5IGluIHRoZSBwbGF5aW5nIHN0YXRlLiBUbyBzd2l0Y2ggc2NlbmVzLCBwbGVhc2Ugc3RvcCBHYW1lVmlldy4nLFxuICAgICAgICAgICAgb3Blbl9zY2VuZTogJ09wZW4gc2NlbmUnLFxuICAgICAgICAgICAgY2xvc2Vfc2NlbmU6ICdDbG9zZSBzY2VuZScsXG4gICAgICAgICAgICBzYXZlX3NjZW5lOiAnU2F2ZSBzY2VuZScsXG4gICAgICAgICAgICBzYXZlX2FzX3NjZW5lOiAnU2F2ZSBzY2VuZSB0byBvdGhlciBwbGFjZScsXG4gICAgICAgICAgICBxdWVyeV9pc19yZWFkeTogJ1F1ZXJ5IHRoZSByZWFkeSBzdGF0ZSBvZiBjdXJyZW50IHNjZW5lJyxcbiAgICAgICAgICAgIHF1ZXJ5X2RpcnR5OiAnUXVlcnkgZGlydHkgc3RhdGUgb2YgY3VycmVudCBzY2VuZScsXG4gICAgICAgICAgICBxdWVyeV9jbGFzc2VzOiAnUXVlcnkgYWxsIGNsYXNzZXMnLFxuICAgICAgICAgICAgcXVlcnlfY29tcG9uZW50czogJ1F1ZXJ5IGFsbCBjb21wb25lbnRzJyxcbiAgICAgICAgICAgIHF1ZXJ5X2NvbXBvbmVudF9oYXNfc2NyaXB0OiAnV2hldGhlciBhIHNjcmlwdCBpcyBpbiB0aGUgY29tcG9uZW50cyBsaXN0JyxcbiAgICAgICAgICAgIHF1ZXJ5X25vZGVfdHJlZTogJ1F1ZXJ5IG5vZGUgdHJlZSBpbmZvcm1hdGlvbicsXG4gICAgICAgICAgICBxdWVyeV9ub2RlX2J5X2Fzc2V0X3V1aWQ6ICdRdWVyeSBub2RlIGJ5IGFzc2V0IHV1aWQnLFxuICAgICAgICAgICAgc2V0X3Byb3BlcnR5OiAnU2V0IHByb3BlcnR5IG9mIG9iamVjdCcsXG4gICAgICAgICAgICByZXNldF9wcm9wZXJ0eTogJ3Jlc2V0IGEgcHJvcGVydHkgb2Ygb2JqZWN0IHdpdGggZGVmYXVsdCB2YWx1ZScsXG4gICAgICAgICAgICAvLyB1cGRhdGVfcHJvcGVydHlfZnJvbV9udWxsOiAndXBkYXRlIGEgcHJvcGVydHkgdmFsdWUgb2Ygb2JqZWN0IGZyb20gbnVsbCcsXG4gICAgICAgICAgICAvLyBzZXRfbm9kZV9hbmRfY2hpbGRyZW5fbGF5ZXI6ICdTZXQgdGhlIGxheWVyIG9mIG5vZGUgYW5kIGl0XFwncyBjaGlsZHJlbicsXG4gICAgICAgICAgICBtb3ZlX2FycmF5X2VsZW1lbnQ6ICdNb3ZlIHRoZSBwb3NpdGlvbiBvZiBpdGVtIGluIHRoZSBwcm9wZXJ0eSB3aXRoIEFycmF5IHR5cGUnLFxuICAgICAgICAgICAgcmVtb3ZlX2FycmF5X2VsZW1lbnQ6ICdSZW1vdmUgdGhlIGl0ZW0gb2YgcHJvcGVydHkgd2l0aCBBcnJheSB0eXBlJyxcbiAgICAgICAgICAgIGN1dF9ub2RlOiAnQ3V0IG5vZGUnLFxuICAgICAgICAgICAgLy8gc2VsZWN0X2FsbF9ub2RlczogJ1NlbGVjdCBhbGwgbm9kZXMnLFxuICAgICAgICAgICAgY29weV9ub2RlOiAnQ29weSBub2RlLCBwcmVwYXJlIGRhdGEgZm9yIHBhc3RlIG9yIGNyZWF0ZSBub2RlJyxcbiAgICAgICAgICAgIGR1cGxpY2F0ZV9ub2RlOiAnRHVwbGljYXRlIG5vZGUnLFxuICAgICAgICAgICAgcGFzdGVfbm9kZTogJ1Bhc3RlIG5vZGUnLFxuICAgICAgICAgICAgc2V0X3BhcmVudDogJ1NldCBwYXJlbnQgb2Ygbm9kZScsXG4gICAgICAgICAgICBjcmVhdGVfbm9kZTogJ0NyZWF0ZSBub2RlJyxcbiAgICAgICAgICAgIHF1ZXJ5X25vZGU6ICdRdWVyeSBkdW1wIGRhdGEgb2Ygbm9kZScsXG4gICAgICAgICAgICByZXNldF9ub2RlOiAnUmVzZXQgbm9kZSBwcm9wZXJ0aWVzOiBwb3NpdGlvbiwgcm90YXRpb24sIHNjYWxlLicsXG4gICAgICAgICAgICByZW1vdmVfbm9kZTogJ1JlbW92ZSBub2RlJyxcbiAgICAgICAgICAgIGNyZWF0ZV9jb21wb25lbnQ6ICdDcmVhdGUgY29tcG9uZW50JyxcbiAgICAgICAgICAgIHJlc2V0X2NvbXBvbmVudDogJ1Jlc2V0IGNvbXBvbmVudCcsXG4gICAgICAgICAgICBleGVjdXRlX2NvbXBvbmVudF9tZXRob2Q6ICdFeGVjdXRlIG1ldGhvZCBvZiBjb21wb25lbnQnLFxuICAgICAgICAgICAgZXhlY3V0ZV9zY2VuZV9zY3JpcHQ6ICdFeGVjdXRlIG1ldGhvZCBvZiBleHRlbnNpb24gc2NyaXB0JyxcbiAgICAgICAgICAgIHF1ZXJ5X2NvbXBvbmVudDogJ1F1ZXJ5IGR1bXAgZGF0YSBvZiBjb21wb25lbnQnLFxuICAgICAgICAgICAgc25hcHNob3Q6ICdTbmFwc2hvdCBjdXJyZW50IHNjZW5lIHN0YXRlJyxcbiAgICAgICAgICAgIHNuYXBzaG90X2Fib3J0OiAnQWJvcnQgc25hcHNob3QnLFxuICAgICAgICAgICAgLy8gdW5kbzogJ1VuZG8gb3BlcmF0aW9uJyxcbiAgICAgICAgICAgIC8vIHJlZG86ICdSZWRvIG9wZXJhdGlvbicsXG4gICAgICAgICAgICBzb2Z0X3JlbG9hZDogJ1NvZnQgcmVsb2FkIHNjZW5lJyxcbiAgICAgICAgICAgIGNoYW5nZV9naXptb190b29sOiAnQ2hhbmdlIGdpem1vIHRvb2wnLFxuICAgICAgICAgICAgY2hhbmdlX2dpem1vX3Bpdm90OiAnQ2hhbmdlIGdpem1vIHBpdm90JyxcbiAgICAgICAgICAgIGNoYW5nZV9naXptb19jb29yZGluYXRlOiAnQ2hhbmdlIGdpem1vIGNvb3JkaW5hdGUnLFxuICAgICAgICAgICAgY2hhbmdlX2lzMkQ6ICdDaGFuZ2UgYmV0d2VlbiAyRC8zRCB2aWV3JyxcbiAgICAgICAgICAgIHNldF9ncmlkX3Zpc2libGU6ICdTaG93IG9yIGhpZGUgZ3JpZCcsXG4gICAgICAgICAgICBxdWVyeV9pc19ncmlkX3Zpc2libGU6ICdRdWVyeSB2aXNpYmxlIHN0YXRlIG9mIGdyaWQnLFxuICAgICAgICAgICAgc2V0X2ljb25fZ2l6bW9fM2Q6ICdTZXQgdGhlIEljb25HaXptbyB0byAzRCBvciAyRCcsXG4gICAgICAgICAgICBxdWVyeV9pc19pY29uX2dpem1vXzNkOiAnUXVlcnkgSWNvbkdpem1vIG1vZGUnLFxuICAgICAgICAgICAgc2V0X2ljb25fZ2l6bW9fc2l6ZTogJ1NldCB0aGUgc2l6ZSBvZiBJY29uR2l6bW8nLFxuICAgICAgICAgICAgcXVlcnlfaWNvbl9naXptb19zaXplOiAnUXVlcnkgc2l6ZSBvZiBJY29uR2l6bW8nLFxuICAgICAgICAgICAgcXVlcnlfZ2l6bW9fdG9vbF9uYW1lOiAnUXVlcnkgY3VycmVudCBnaXptbyB0b29sIG5hbWUnLFxuICAgICAgICAgICAgcXVlcnlfZ2l6bW9fdmlld19tb2RlOiAnUXVlcnkgdmlldyBtb2RlICh2aWV3L3NlbGVjdCknLFxuICAgICAgICAgICAgcXVlcnlfZ2l6bW9fcGl2b3Q6ICdRdWVyeSBjdXJyZW50IGdpem1vIHBpdm90IG5hbWUnLFxuICAgICAgICAgICAgcXVlcnlfZ2l6bW9fY29vcmRpbmF0ZTogJ1F1ZXJ5IGN1cnJlbnQgZ2l6bW8gY29vcmRpbmF0ZSBuYW1lJyxcbiAgICAgICAgICAgIHF1ZXJ5X2lzMkQ6ICdRdWVyeSBjdXJyZW50IHZpZXcgbW9kZSgyRC8zRCknLFxuICAgICAgICAgICAgZm9jdXNfY2FtZXJhOiAnRm9jdXMgZWRpdG9yIGNhbWVyYSB0byBub2RlcycsXG4gICAgICAgICAgICBhbGlnbl93aXRoX3ZpZXc6ICdBcHBseSB0aGUgc2NlbmUgY2FtZXJhIHBvc2l0aW9uIGFuZCBBbmdsZSB0byB0aGUgc2VsZWN0ZWQgbm9kZScsXG4gICAgICAgICAgICBhbGlnbl92aWV3X3dpdGhfbm9kZTogJ0FwcGxpZXMgdGhlIHNlbGVjdGVkIG5vZGUgcG9zaXRpb24gYW5kIEFuZ2xlIHRvIHRoZSBjdXJyZW50IHZpZXcnLFxuICAgICAgICAgICAgLy8gYnJvYWRjYXN0XG4gICAgICAgICAgICBzY2VuZV9yZWFkeTogJ01lc3NhZ2Ugd2hlbiBzY2VuZSBpcyBvcGVuZWQnLFxuICAgICAgICAgICAgc2NlbmVfY2xvc2U6ICdNZXNzYWdlIHdoZW4gc2NlbmUgaXMgY2xvc2VkJyxcblxuICAgICAgICAgICAgVUlUcmFuc2Zvcm1fbGFjazogJ1VJIG5vZGUgaXMgYmVpbmcgYWRkZWQsIGJ1dCB0aGUgY2MuVUlUcmFuc2Zvcm0gY29tcG9uZW50IGlzIG5vdCBmb3VuZCBpbiBhbnkgdXBwZXIgbm9kZScsXG4gICAgICAgICAgICBVSVRyYW5zZm9ybV9hZGRfdG9fcm9vdDogJ0FkZCBjYy5VSVRyYW5zZm9ybSBjb21wb25lbnQgdG8gdGhlIHJvb3Qgbm9kZScsXG4gICAgICAgICAgICBVSVRyYW5zZm9ybV93aXRoaW5fY2FudmFzOiAnQ3JlYXRlIHRoZSBDYW52YXMgbm9kZSBhcyB0aGUgcGFyZW50IG5vZGUnLFxuICAgICAgICAgICAgVUlUcmFuc2Zvcm1fY2FuY2VsOiAnQ2FuY2VsJyxcblxuICAgICAgICAgICAgYW5pbWF0aW9uQ29tcG9uZW50Q29sbGlzaW9uOlxuICAgICAgICAgICAgICAgICdBbmltYXRpb24gY29udHJvbGxlciBjb21wb25lbnQsIGFuaW1hdGlvbiBjb21wb25lbnQgYW5kIHNrZWxldG9uIGFuaW1hdGlvbiBjb21wb25lbnQgY2Fubm90IGNvZXhpc3QuJyxcblxuICAgICAgICAgICAgcGh5c2ljc0R5bmFtaWNCb2R5U2hhcGU6ICdBIGR5bmFtaWMgcmlnaWQgYm9keSBjYW4gbm90IGhhdmUgdGhlIGZvbGxvd2luZyBjb2xsaWRlciBzaGFwZXM6IFRlcnJhaW4sIFBsYW5lIGFuZCBOb24tQ29udmV4IE1lc2guJyxcblxuICAgICAgICAgICAgbGlnaHRfcHJvYmVfZWRpdF9tb2RlX2NoYW5nZWQ6ICdMaWdodFByb2JlIGVkaXQgbW9kZSBjaGFuZ2VkIG5vdGlmaWNhdGlvbicsXG4gICAgICAgICAgICBsaWdodF9wcm9iZV9ib3VuZGluZ19ib3hfZWRpdF9tb2RlX2NoYW5nZWQ6ICdMaWdodFByb2JlIGNvbXBvbmVudCBib3VuZGluZyBib3ggZWRpdCBtb2RlIGNoYW5nZWQgbm90aWZpY2F0aW9uJyxcbiAgICAgICAgICAgIGxpZ2h0X3Byb2JlX2RlbGV0ZV93aGVuX2VkaXRpbmdfcHJvYmU6ICdDdXJyZW50bHkgaW4gcHJvYmUgZWRpdGluZyBtb2RlIFRoZSBwcm9iZSBub2RlIGJlaW5nIGVkaXRlZCBjYW5ub3QgYmUgbW9kaWZpZWQuIFBsZWFzZSBleGl0IHByb2JlIGVkaXRpbmcgbW9kZSBhbmQgdHJ5IGFnYWluLicsXG5cbiAgICAgICAgICAgIGJlZ2luX3JlY29yZGluZzogJ0JlZ2luIG5vZGUgcmVjb3JkaW5nIGZvciB1bmRvJyxcbiAgICAgICAgICAgIGVuZF9yZWNvcmRpbmc6ICdFbmQgbm9kZSByZWNvcmRpbmcgZm9yIHVuZG8nLFxuICAgICAgICAgICAgY2FuY2VsX3JlY29yZGluZzogJ0NhbmNlbCBub2RlIHJlY29yZGluZyBmb3IgdW5kbycsXG5cbiAgICAgICAgICAgIC8vIHByZWZhYlxuICAgICAgICAgICAgY3JlYXRlX3ByZWZhYjogJ0NyZWF0ZSBwcmVmYWIgYXNzZXQocmVjb3JkIHVuZG8gYXV0b21hdGljYWxseSknLFxuICAgICAgICAgICAgYXBwbHlfcHJlZmFiOiAnQXBwbHkgbW9kaWZpY2F0aW9uIHRvIHByZWZhYiBhc3NldChyZWNvcmQgdW5kbyBhdXRvbWF0aWNhbGx5KScsXG4gICAgICAgICAgICByZXN0b3JlX3ByZWZhYjogJ1Jlc3RvcmUgcHJlZmFiIG5vZGUgZm9ybSBhc3NldChyZWNvcmQgdW5kbyBhdXRvbWF0aWNhbGx5KScsXG4gICAgICAgICAgICByZXZlcnRfcmVtb3ZlZF9jb21wb25lbnQ6ICdSZXZlcnQgcmVtb3ZlZCBjb21wb25lbnQocmVjb3JkIHVuZG8gYXV0b21hdGljYWxseSknLFxuICAgICAgICAgICAgYXBwbHlfcmVtb3ZlZF9jb21wb25lbnQ6ICdBcHBseSByZW1vdmVkIGNvbXBvbmVudCB0byBwcmVmYWIgYXNzZXQocmVjb3JkIHVuZG8gYXV0b21hdGljYWxseSknLFxuICAgICAgICB9LFxuICAgICAgICBkb2M6IHtcbiAgICAgICAgICAgIG9wZW5fc2NlbmU6IGBcbiAgICAgICAgICAgICAgICAtIHV1aWQge3N0cmluZ30gdXVpZCBvZiBzY2VuZSBhc3NldGAsXG4gICAgICAgICAgICBxdWVyeV9jbGFzc2VzOiBgXG4gICAgICAgICAgICAgICAgQHJldHVybnMge1tPYmplY3RdfVxuICAgICAgICAgICAgICAgIC0gZXh0ZW5kcz8ge3N0cmluZ30gZmlsdGVyIGNsYXNzZXMgd2hpY2ggZXh0ZW5kIGZyb20gdGhpcyBjbGFzc1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBxdWVyeV9jb21wb25lbnRzOiBgXG4gICAgICAgICAgICAgICAgQHJldHVybnMge1tPYmplY3RdfVxuICAgICAgICAgICAgICAgIC0gbmFtZSB7c3RyaW5nfSBuYW1lIG9mIGNvbXBvbmVudFxuICAgICAgICAgICAgICAgIC0gcGF0aCB7c3RyaW5nfSBwYXRoIGluIG1lbnVcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgcXVlcnlfY29tcG9uZW50X2hhc19zY3JpcHQ6IGBcbiAgICAgICAgICAgICAgICAtIG5hbWUgY2xhc3MgbmFtZSBvZiBzY3JpcHRcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBAcmV0dXJucyB7Ym9vbGVhbn0gZXhpc3Qgb3Igbm90XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIHF1ZXJ5X25vZGVfdHJlZTogYFxuICAgICAgICAgICAgICAgIC0gdXVpZD8ge3N0cmluZ30gdGhlIHV1aWQgb2Ygcm9vdCBub2RlLCBkZWZhdWx0IGlzIHNjZW5lIG5vZGVcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBAcmV0dXJucyB7T2JqZWN0fVxuICAgICAgICAgICAgICAgIC0gbmFtZSB7c3RyaW5nfSBuYW1lIG9mIG5vZGUgb3IgJ3NjZW5lJ1xuICAgICAgICAgICAgICAgIC0gYWN0aXZlIHtib29sZWFufSBhY3RpdmUgc3RhdGUgb2Ygbm9kZVxuICAgICAgICAgICAgICAgIC0gdHlwZSB7c3RyaW5nfSBjYy5TY2VuZSBvciBjYy5Ob2RlXG4gICAgICAgICAgICAgICAgLSB1dWlkIHtzdHJpbmd9IHV1aWQgb2Ygbm9kZVxuICAgICAgICAgICAgICAgIC0gY2hpbGRyZW4ge1tdfSBjaGlsZHJlbiBvZiBjdXJyZW50IG5vZGVcbiAgICAgICAgICAgICAgICAtIHByZWZhYiB7bnVtYmVyfSBzdGF0ZSBvZiBwcmVmYWIsIDE6IG5vcm1hbCwgMjogbG9zdCByZXNvdXJjZVxuICAgICAgICAgICAgICAgIC0gaXNTY2VuZSB7Ym9vbGVhbn0gd2hldGhlciBpdCBpcyBhIHNjZW5lIG5vZGVcbiAgICAgICAgICAgICAgICAtIGNvbXBvbmVudHMge1tPYmplY3RdfSBhcnJheSBvZiBjb21wb25lbnRcbiAgICAgICAgICAgICAgICAgICAgLSB0eXBlIHtzdHJpbmd9IHR5cGUgb2YgY29tcG9uZW50XG4gICAgICAgICAgICAgICAgICAgIC0gdmFsdWUge3N0cmluZ30gdXVpZCBvZiBjb21wb25lbnRcbiAgICAgICAgICAgICAgICAgICAgLSBleHRlbmRzIHtbc3RyaW5nXX0gYXJyYXkgb2YgY29tcG9uZW50IGluaGVyaXRhbmNlIGNoYWluXG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIHF1ZXJ5X25vZGVfYnlfYXNzZXRfdXVpZDogYFxuICAgICAgICAgICAgICAgIC0gUXVlcnkgbm9kZSBieSBhc3NldCB1dWlkXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgQHJldHVybnMge3N0cmluZ1tdfSAgdXVpZCBvZiBub2RlXG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIHNldF9wcm9wZXJ0eTogYFxuICAgICAgICAgICAgICAgIC0gb3B0aW9ucyB7U2V0UHJvcGVydHlPcHRpb25zfVxuICAgICAgICAgICAgICAgICAgICAtIHV1aWQge3N0cmluZ30gdXVpZCBvZiB0aGUgb2JqZWN0XG4gICAgICAgICAgICAgICAgICAgIC0gcGF0aCB7c3RyaW5nfSBzZWFyY2ggcGF0aCBvZiB0aGUgcHJvcGVydHlcbiAgICAgICAgICAgICAgICAgICAgLSBkdW1wIHtJUHJvcGVydHl9IHRoZSBkdW1wIGRhdGEgb2YgdGhlIHByb3BlcnR5XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIHJlc2V0X3Byb3BlcnR5OiBgXG4gICAgICAgICAgICAgICAgLSBvcHRpb25zIHtTZXRQcm9wZXJ0eU9wdGlvbnN9XG4gICAgICAgICAgICAgICAgICAgIC0gdXVpZCB7c3RyaW5nfSB1dWlkIG9mIHRoZSBvYmplY3RcbiAgICAgICAgICAgICAgICAgICAgLSBwYXRoIHtzdHJpbmd9IHNlYXJjaCBwYXRoIG9mIHRoZSBwcm9wZXJ0eVxuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICAvLyB1cGRhdGVfcHJvcGVydHlfZnJvbV9udWxsOiBgXG4gICAgICAgICAgICAvLyAtIG9wdGlvbnMge1NldFByb3BlcnR5T3B0aW9uc31cbiAgICAgICAgICAgIC8vICAgICAtIHV1aWQge3N0cmluZ30gdXVpZCBvZiB0aGUgb2JqZWN0XG4gICAgICAgICAgICAvLyAgICAgLSBwYXRoIHtzdHJpbmd9IHNlYXJjaCBwYXRoIG9mIHRoZSBwcm9wZXJ0eVxuICAgICAgICAgICAgLy8gYCxcbiAgICAgICAgICAgIC8vIHNldF9ub2RlX2FuZF9jaGlsZHJlbl9sYXllcjogYFxuICAgICAgICAgICAgLy8gLSBvcHRpb25zIHtTZXRQcm9wZXJ0eU9wdGlvbnN9XG4gICAgICAgICAgICAvLyAgICAgLSB1dWlkIHtzdHJpbmd9IHV1aWQgb2YgdGhlIG9iamVjdFxuICAgICAgICAgICAgLy8gICAgIC0gcGF0aCB7c3RyaW5nfSBzZWFyY2ggcGF0aCBvZiB0aGUgcHJvcGVydHlcbiAgICAgICAgICAgIC8vICAgICAtIGR1bXAge0lQcm9wZXJ0eX0gdGhlIGR1bXAgZGF0YSBvZiB0aGUgcHJvcGVydHlcbiAgICAgICAgICAgIC8vIGAsXG4gICAgICAgICAgICBtb3ZlX2FycmF5X2VsZW1lbnQ6IGBcbiAgICAgICAgICAgICAgICAtIG9wdGlvbnMge01vdmVBcnJheU9wdGlvbnN9XG4gICAgICAgICAgICAgICAgICAgIC0gdXVpZCB7c3RyaW5nfSB1dWlkIG9mIG5vZGVcbiAgICAgICAgICAgICAgICAgICAgLSBwYXRoIHtzdHJpbmd9IHNlYXJjaCBwYXRoIG9mIGFycmF5XG4gICAgICAgICAgICAgICAgICAgIC0gdGFyZ2V0IHtudW1iZXJ9IG9yaWdpbmFsIGluZGV4IG9mIHRoZSB0YXJnZXQgaXRlbVxuICAgICAgICAgICAgICAgICAgICAtIG9mZnNldCB7bnVtYmVyfSBtb3ZlIG9mZnNldFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIEByZXR1cm5zIHtib29sZWFufSB3aGV0aGVyIGl0IGlzIHN1Y2Nlc3NmdWxcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgcmVtb3ZlX2FycmF5X2VsZW1lbnQ6IGBcbiAgICAgICAgICAgICAgICAtIG9wdGlvbnMge01vdmVBcnJheU9wdGlvbnN9XG4gICAgICAgICAgICAgICAgICAgIC0gdXVpZCB7c3RyaW5nfSB1dWlkIG9mIG5vZGVcbiAgICAgICAgICAgICAgICAgICAgLSBwYXRoIHtzdHJpbmd9IHNlYXJjaCBwYXRoIG9mIGFycmF5XG4gICAgICAgICAgICAgICAgICAgIC0gaW5kZXgge251bWJlcn0gaW5kZXggb2YgaXRlbVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIEByZXR1cm5zIHtib29sZWFufSB3aGV0aGVyIGl0IGlzIHN1Y2Nlc3NmdWxcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgLy8gc2VsZWN0X2FsbF9ub2RlczogYFxuICAgICAgICAgICAgLy8gLSBTZWxlY3QgYWxsIG5vZGVzLiBJbiBkaWZmZXJlbnQgc2NlbmUgbW9kZXMsIHRoZSBzZWxlY3RlZCBub2RlIHR5cGVzIGFyZSBkaWZmZXJlbnQuIEZvciBleGFtcGxlLCBpbiBMaWdodCBQcm9iZSBFZGl0b3IgbW9kZSwgb25seSBMaWdodCBQcm9iZSBub2RlcyBhcmUgc2VsZWN0ZWQuXG5cbiAgICAgICAgICAgIC8vIEByZXR1cm5zIHtzdHJpbmdbXX0gdXVpZCBvZiBub2Rlc1xuICAgICAgICAgICAgLy8gYCxcbiAgICAgICAgICAgIGNvcHlfbm9kZTogYFxuICAgICAgICAgICAgICAgIC0gdXVpZHMge3N0cmluZyB8IHN0cmluZ1tdfSB1dWlkIG9mIG5vZGVcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBAcmV0dXJucyB7c3RyaW5nIHwgc3RyaW5nW119IHV1aWQgb2Ygbm9kZVxuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBjdXRfbm9kZTogYFxuICAgICAgICAgICAgICAgIC0gdXVpZHMge3N0cmluZyB8IHN0cmluZ1tdfSB1dWlkIG9mIG5vZGVcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBAcmV0dXJucyB7c3RyaW5nIHwgc3RyaW5nW119IHV1aWQgb2Ygbm9kZVxuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBkdXBsaWNhdGVfbm9kZTogYFxuICAgICAgICAgICAgICAgIC0gdXVpZHMge3N0cmluZyB8IHN0cmluZ1tdfSB1dWlkIG9mIG5vZGVcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBAcmV0dXJucyB7c3RyaW5nIHwgc3RyaW5nW119IHV1aWQgb2YgbmV3IG5vZGVcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgcGFzdGVfbm9kZTogYFxuICAgICAgICAgICAgICAgIC0gb3B0aW9ucyB7UGFzdGVOb2RlT3B0aW9uc31cbiAgICAgICAgICAgICAgICAgICAgLSB0YXJnZXQge3N0cmluZ30gdXVpZCBvZiB0YXJnZXQgbm9kZVxuICAgICAgICAgICAgICAgICAgICAtIHV1aWRzIHtzdHJpbmcgfCBzdHJpbmdbXX0gdXVpZCBvZiBub2RlIHRoYXQgaXMgY29waWVkXG4gICAgICAgICAgICAgICAgICAgIC0ga2VlcFdvcmxkVHJhbnNmb3JtIHtib29sZWFufSB3aGV0aGVyIHRvIGtlZXAgdGhlIHdvcmxkIHRyYW5zZm9ybVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIEByZXR1cm5zIHtzdHJpbmcgfCBzdHJpbmdbXX0gdXVpZCBvZiBuZXcgbm9kZVxuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBzZXRfcGFyZW50OiBgXG4gICAgICAgICAgICAgICAgLSBvcHRpb25zIHtDdXROb2RlT3B0aW9uc31cbiAgICAgICAgICAgICAgICAgICAgLSBwYXJlbnQge3N0cmluZ30gdXVpZCBvZiBwYXJlbnRcbiAgICAgICAgICAgICAgICAgICAgLSB1dWlkcyB7c3RyaW5nfHN0cmluZ1tdfSB1dWlkIG9mIHRoZSBub2RlIHRoYXQgbmVlZCB0byBzZXRcbiAgICAgICAgICAgICAgICAgICAgLSBrZWVwV29ybGRUcmFuc2Zvcm0ge2Jvb2xlYW59IHdoZXRoZXIgdG8ga2VlcCB0aGUgd29ybGQgdHJhbnNmb3JtXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgQHJldHVybnMge3N0cmluZyB8IHN0cmluZ1tdfSB1dWlkIG9mIG5vZGVcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgY3JlYXRlX25vZGU6IGBcbiAgICAgICAgICAgICAgICAtIG9wdGlvbnMge0NyZWF0ZU5vZGVPcHRpb25zfVxuICAgICAgICAgICAgICAgICAgICAtIHBhcmVudCB7c3RyaW5nfSB1dWlkIG9mIHBhcmVudFxuICAgICAgICAgICAgICAgICAgICAtIGNvbXBvbmVudHM/IHtzdHJpbmdbXX0gY29tcG9uZW50IG5hbWVzXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIC0gbmFtZT8ge3N0cmluZ30gbmFtZSBvZiBub2RlXG4gICAgICAgICAgICAgICAgICAgIC0gZHVtcD8ge0lOb2RlIHwgSVNjZW5lfSBkdW1wIGRhdGEgb2Ygbm9kZVxuICAgICAgICAgICAgICAgICAgICAtIGtlZXBXb3JsZFRyYW5zZm9ybT8ge2Jvb2xlYW59IHdoZXRoZXIgdG8ga2VlcCB0aGUgd29ybGQgdHJhbnNmb3JtXG4gICAgICAgICAgICAgICAgICAgIC0gdHlwZT8ge3N0cmluZ30gYXNzZXQgdHlwZVxuICAgICAgICAgICAgICAgICAgICAtIGNhbnZhc1JlcXVpcmVkPyB7Ym9vbGVhbn0gbmVlZCBjYy5DYW52YXMgb3Igbm90XG4gICAgICAgICAgICAgICAgICAgIC0gdW5saW5rUHJlZmFiPyB7Ym9vbGVhbn0gdG8gYmUgYSBub3JtYWwgbm9kZVxuICAgICAgICAgICAgICAgICAgICAtIGFzc2V0VXVpZD8ge3N0cmluZ30gdXVpZCBvZiBhc3NldCwgaWYgdGhpcyB2YWx1ZSBpcyBzZXQsIGNyZWF0ZSBub2RlIGZyb20gdGhpcyBhc3NldFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIEByZXR1cm5zIHtzdHJpbmcgfCBzdHJpbmdbXX0gdXVpZCBvZiBub2RlXG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIHF1ZXJ5X25vZGU6IGBcbiAgICAgICAgICAgICAgICAtIHV1aWQge3N0cmluZ30gdXVpZCBvZiBub2RlXG5cbiAgICAgICAgICAgICAgICBAcmV0dXJucyB7T2JqZWN0fSBkdW1wIG9mIG5vZGVcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgcmVzZXRfbm9kZTogYFxuICAgICAgICAgICAgICAgIC0gdXVpZCB7c3RyaW5nfSB1dWlkIG9mIG5vZGVcblxuICAgICAgICAgICAgICAgIEByZXR1cm5zIHtib29sZWFufSB3aGV0aGVyIGl0IGlzIHN1Y2Nlc3NmdWxcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgcmVzdG9yZV9wcmVmYWI6IGBcbiAgICAgICAgICAgICAgICAtIHV1aWQge3N0cmluZ30gdXVpZCBvZiBub2RlXG4gICAgICAgICAgICAgICAgLSBhc3NldFV1aWQge3N0cmluZ30gdXVpZCBvZiBhc3NldFxuXG4gICAgICAgICAgICAgICAgQHJldHVybnMge2Jvb2xlYW59IHdoZXRoZXIgaXQgaXMgc3VjY2Vzc2Z1bFxuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICByZW1vdmVfbm9kZTogYFxuICAgICAgICAgICAgICAgIC0gb3B0aW9ucyB7UmVtb3ZlTm9kZU9wdGlvbnN9XG4gICAgICAgICAgICAgICAgICAgIC0gdXVpZDoge3N0cmluZyB8IHN0cmluZ1tdfSB1dWlkIG9mIG5vZGVcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgY3JlYXRlX2NvbXBvbmVudDogYFxuICAgICAgICAgICAgICAgIC0gb3B0aW9ucyB7Q3JlYXRlQ29tcG9uZW50T3B0aW9uc31cbiAgICAgICAgICAgICAgICAgICAgLSB1dWlkIHtzdHJpbmd9IHV1aWQgb2Ygbm9kZVxuICAgICAgICAgICAgICAgICAgICAtIGNvbXBvbmVudCB7c3RyaW5nfSBjbGFzc0lkIChjaWQpIChpcyByZWNvbW1lbmRlZCkgb3IgY2xhc3NOYW1lXG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIHJlbW92ZV9jb21wb25lbnQ6IGBcbiAgICAgICAgICAgICAgICAtIG9wdGlvbnMge0NyZWF0ZUNvbXBvbmVudE9wdGlvbnN9XG4gICAgICAgICAgICAgICAgICAgIC0gdXVpZCB7c3RyaW5nfSB1dWlkIG9mIG5vZGVcbiAgICAgICAgICAgICAgICAgICAgLSBjb21wb25lbnQge3N0cmluZ30gY2xhc3NJZCAoY2lkKSAoaXMgcmVjb21tZW5kZWQpIG9yIGNsYXNzTmFtZVxuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICByZXNldF9jb21wb25lbnQ6IGBcbiAgICAgICAgICAgICAgICAtIG9wdGlvbnMge1Jlc2V0Q29tcG9uZW50T3B0aW9uc31cbiAgICAgICAgICAgICAgICAgICAgLSB1dWlkIHtzdHJpbmd9IHV1aWQgb2YgY29tcG9uZW50XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgQHJldHVybnMge2Jvb2xlYW59IHdoZXRoZXIgaXQgaXMgc3VjY2Vzc2Z1bFxuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBleGVjdXRlX2NvbXBvbmVudF9tZXRob2Q6IGBcbiAgICAgICAgICAgICAgICAtIG9wdGlvbnMge0V4ZWN1dGVDb21wb25lbnRNZXRob2RPcHRpb25zfVxuICAgICAgICAgICAgICAgICAgICAtIHV1aWQge3N0cmluZ30gdXVpZCBvZiBjb21wb25lbnRcbiAgICAgICAgICAgICAgICAgICAgLSBuYW1lIHtzdHJpbmd9IG5hbWUgb2YgbWV0aG9kXG4gICAgICAgICAgICAgICAgICAgIC0gYXJncyB7YW55W119IGFyZ3VtZW50c1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBleGVjdXRlX3NjZW5lX3NjcmlwdDogYFxuICAgICAgICAgICAgICAgIC0gb3B0aW9ucyB7RXhlY3V0ZVNjZW5lU2NyaXB0TWV0aG9kc09wdGlvbnN9XG4gICAgICAgICAgICAgICAgICAgIC0gbmFtZSB7c3RyaW5nfSBuYW1lIG9mIGV4dGVuc2lvblxuICAgICAgICAgICAgICAgICAgICAtIG1ldGhvZCB7c3RyaW5nfSBuYW1lIG9mIG1ldGhvZFxuICAgICAgICAgICAgICAgICAgICAtIGFyZ3Mge2FueVtdfSBhcmd1bWVudHNcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgcXVlcnlfY29tcG9uZW50OiBgXG4gICAgICAgICAgICAgICAgLSB1dWlkIHtzdHJpbmd9IHV1aWQgb2YgY29tcG9uZW50XG5cbiAgICAgICAgICAgICAgICBAcmV0dXJucyB7T2JqZWN0fSBkdW1wIG9mIGNvbXBvbmVudFxuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBjaGFuZ2VfZ2l6bW9fdG9vbDogYFxuICAgICAgICAgICAgICAgIC0gbmFtZSB7c3RyaW5nfSB0b29sIG5hbWUgJ3Bvc2l0aW9uJyB8ICdyb3RhdGlvbicgfCAnc2NhbGUnIHwgJ3JlY3QnXG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIGNoYW5nZV9naXptb19waXZvdDogYFxuICAgICAgICAgICAgICAgIC0gbmFtZSB7c3RyaW5nfSBwaXZvdCBuYW1lICdwaXZvdCcgfCAnY2VudGVyJ1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBjaGFuZ2VfZ2l6bW9fY29vcmRpbmF0ZTogYFxuICAgICAgICAgICAgICAgIC0gdHlwZSB7c3RyaW5nfSBjb29yZGluYXRlIG5hbWUgJ2xvY2FsJyB8ICdnbG9iYWwnXG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIGNoYW5nZV9pczJEOiBgXG4gICAgICAgICAgICAgICAgLSBpczJEIHtib29sZWFufSAyRC8zRCB2aWV3XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIHNldF9ncmlkX3Zpc2libGU6IGBcbiAgICAgICAgICAgICAgICAtIHZpc2libGUge2Jvb2xlYW59IHNob3cvaGlkZSBncmlkXG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIHF1ZXJ5X2lzX2dyaWRfdmlzaWJsZTogYFxuICAgICAgICAgICAgICAgIEByZXR1cm5zIHtib29sZWFufSB0cnVlOiB2aXNpYmxlLCBmYWxzZTogaW52aXNpYmxlXG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIHNldF9pY29uX2dpem1vXzNkOiBgXG4gICAgICAgICAgICAgICAgLSBpczNEIHtib29sZWFufSAzRC8yRCBJY29uR2l6bW9cbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgcXVlcnlfaXNfaWNvbl9naXptb18zZDogYFxuICAgICAgICAgICAgICAgIEByZXR1cm5zIHtib29sZWFufSB0cnVlOiAzRCwgZmFsc2U6IDJEXG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIHNldF9pY29uX2dpem1vX3NpemU6IGBcbiAgICAgICAgICAgICAgICAtIHNpemUge251bWJlcn0gc2l6ZSBvZiBJY29uR2l6bW9cbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgcXVlcnlfaWNvbl9naXptb19zaXplOiBgXG4gICAgICAgICAgICAgICAgQHJldHVybnMge251bWJlcn0gc2l6ZSBvZiBJY29uR2l6bW9cbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgcXVlcnlfZ2l6bW9fdG9vbF9uYW1lOiBgXG4gICAgICAgICAgICAgICAgQHJldHVybnMge3N0cmluZ30gJ3Bvc2l0aW9uJyB8ICdyb3RhdGlvbicgfCAnc2NhbGUnIHwgJ3JlY3QnXG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIHF1ZXJ5X2dpem1vX3ZpZXdfbW9kZTogYFxuICAgICAgICAgICAgICAgIEByZXR1cm4ge3N0cmluZ30gJ3ZpZXcnIHwgJ3NlbGVjdCdcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgcXVlcnlfZ2l6bW9fcGl2b3Q6IGBcbiAgICAgICAgICAgICAgICBAcmV0dXJucyB7c3RyaW5nfSAncGl2b3QnIHwgJ2NlbnRlcidcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgcXVlcnlfZ2l6bW9fY29vcmRpbmF0ZTogYFxuICAgICAgICAgICAgICAgIEByZXR1cm5zIHtzdHJpbmd9ICdsb2NhbCcgfCAnZ2xvYmFsJ1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBxdWVyeV9pczJEOiBgXG4gICAgICAgICAgICAgICAgQHJldHVybnMge2Jvb2xlYW59IHRydWU6MkQsIGZhbHNlOjNEXG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIGZvY3VzX2NhbWVyYTogYFxuICAgICAgICAgICAgICAgIC0gdXVpZHMge3N0cmluZ1tdIHwgbnVsbH0gdXVpZCBvZiBub2RlXG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIGFsaWduX3dpdGhfdmlldzogYFxuICAgICAgICAgICAgICAgIEByZXR1cm5zIHtudWxsfVxuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBhbGlnbl92aWV3X3dpdGhfbm9kZTogYFxuICAgICAgICAgICAgICAgIEByZXR1cm5zIHtudWxsfVxuICAgICAgICAgICAgICAgIGAsXG5cbiAgICAgICAgICAgIC8vIGJyb2FkY2FzdFxuICAgICAgICAgICAgc2NlbmVfcmVhZHk6IGBcbiAgICAgICAgICAgICAgICAtIHV1aWQge3N0cmluZ30gdXVpZCBvZiBzY2VuZVxuICAgICAgICAgICAgICAgIGAsXG5cbiAgICAgICAgICAgIGxpZ2h0X3Byb2JlX2VkaXRfbW9kZV9jaGFuZ2VkOiBgXG4gICAgICAgICAgICAgICAgLSBtb2RlIHtib29sZWFufSBsaWdodCBwcm9iZSBlZGl0IG1vZGUgYWZ0ZXIgY2hhbmdlZFxuICAgICAgICAgICAgICAgIGAsXG5cbiAgICAgICAgICAgIGxpZ2h0X3Byb2JlX2JvdW5kaW5nX2JveF9lZGl0X21vZGVfY2hhbmdlZDogYFxuICAgICAgICAgICAgICAgIC0gbW9kZSB7Ym9vbGVhbn0gbGlnaHQgcHJvYmUgY29tcG9uZW50IGJvdW5kaW5nIGJveCBlZGl0IG1vZGUgYWZ0ZXIgY2hhbmdlZFxuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgIH0sXG4gICAgICAgIGV4YW1wbGU6IHtcbiAgICAgICAgICAgIC8vIG1lc3NhZ2VcbiAgICAgICAgICAgIG9wZW5fc2NlbmU6IGBcbmF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ29wZW4tc2NlbmUnLCBzY2VuZVV1aWQpO1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBzYXZlX3NjZW5lOiBgXG5hd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdzYXZlLXNjZW5lJyk7XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIHNhdmVfYXNfc2NlbmU6IGBcbmF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3NhdmUtYXMtc2NlbmUnKTtcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgY2xvc2Vfc2NlbmU6IGBcbmF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ2Nsb3NlLXNjZW5lJyk7XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIHF1ZXJ5X2lzX3JlYWR5OiBgXG5hd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1pcy1yZWFkeScpO1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBxdWVyeV9kaXJ0eTogYFxuYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktZGlydHknKTtcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgcXVlcnlfY2xhc3NlczogYFxuYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktY2xhc3NlcycpO1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBxdWVyeV9jb21wb25lbnRzOiBgXG5hd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1jb21wb25lbnRzJyk7XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIHF1ZXJ5X2NvbXBvbmVudF9oYXNfc2NyaXB0OiBgXG5hd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1jb21wb25lbnQtaGFzLXNjcmlwdCcsICdjYy5TcHJpdGUnKTtcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgcXVlcnlfbm9kZV90cmVlOiBgXG5hd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1ub2RlLXRyZWUnLCBub2RlVXVpZCk7XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIHF1ZXJ5X25vZGVfYnlfYXNzZXRfdXVpZDogYFxuYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktbm9kZXMtYnktYXNzZXQtdXVpZCcsIGFzc2V0VXVpZCk7XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIHNldF9wcm9wZXJ0eTogYFxuYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnc2V0LXByb3BlcnR5Jywge1xuICAgIHV1aWQ6IG5vZGVVdWlkLFxuICAgIHBhdGg6ICdfX2NvbXBzX18uMS5kZWZhdWx0Q2xpcCcsXG4gICAgZHVtcDoge1xuICAgICAgICB0eXBlOiAnY2MuQW5pbWF0aW9uQ2xpcCcsXG4gICAgICAgIHZhbHVlOiB7XG4gICAgICAgICAgICB1dWlkOiBhbmltQ2xpcFV1aWQsXG4gICAgICAgIH0sXG4gICAgfSxcbn0pO1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICByZXNldF9wcm9wZXJ0eTogYFxuYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncmVzZXQtcHJvcGVydHknLCB7XG4gICAgdXVpZDogbm9kZVV1aWQsXG4gICAgcGF0aDogJ3Bvc2l0aW9uJyxcbn0pO1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBtb3ZlX2FycmF5X2VsZW1lbnQ6IGBcbmF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ21vdmUtYXJyYXktZWxlbWVudCcsIHtcbiAgICB1dWlkOiBub2RlVXVpZCxcbiAgICBwYXRoOiAnX19jb21wc19fJyxcbiAgICB0YXJnZXQ6IDEsXG4gICAgb2Zmc2V0OiAtMSxcbn0pO1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICByZW1vdmVfYXJyYXlfZWxlbWVudDogYFxuYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncmVtb3ZlLWFycmF5LWVsZW1lbnQnLCB7XG4gICAgdXVpZDogbm9kZVV1aWQsXG4gICAgcGF0aDogJ19fY29tcHNfXycsXG4gICAgaW5kZXg6IDAsXG59KTtcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgY29weV9ub2RlOiBgXG5hd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdjb3B5LW5vZGUnLCB1dWlkcyk7XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIGN1dF9ub2RlOiBgXG5hd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdjdXQtbm9kZScsIHV1aWRzKTtcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgZHVwbGljYXRlX25vZGU6IGBcbmF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ2R1cGxpY2F0ZS1ub2RlJywgdXVpZHMpO1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBwYXN0ZV9ub2RlOiBgXG5hd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdwYXN0ZS1ub2RlJywge1xuICAgIHRhcmdldDogbm9kZVV1aWQsXG4gICAgdXVpZHM6IG5vZGVVdWlkcyxcbn0pO1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBzZXRfcGFyZW50OiBgXG5hd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsJ3NldC1wYXJlbnQnLCB7XG4gICAgcGFyZW50OiBub2RlVXVpZCxcbiAgICB1dWlkczogbm9kZVV1aWRzLFxufSk7XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIGNyZWF0ZV9ub2RlOiBgXG5hd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdjcmVhdGUtbm9kZScsIHtcbiAgICBuYW1lOiAnTmV3IE5vZGUnXG4gICAgcGFyZW50OiBub2RlVXVpZCxcbn0pO1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBxdWVyeV9ub2RlOiBgXG5hd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1ub2RlJywgbm9kZVV1aWQpO1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICByZXNldF9ub2RlOiBgXG5hd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdyZXNldC1ub2RlJywge1xuICAgIHV1aWQ6IG5vZGVVdWlkLFxufSk7XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIHJlc3RvcmVfcHJlZmFiOiBgXG5hd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdyZXN0b3JlLXByZWZhYicsIG5vZGVVdWlkLCBhc3NldFV1aWQpO1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICByZW1vdmVfbm9kZTogYFxuYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncmVtb3ZlLW5vZGUnLCB7IFxuICAgIHV1aWQ6IG5vZGVVdWlkXG59KTtcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgY3JlYXRlX2NvbXBvbmVudDogYFxuRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnY3JlYXRlLWNvbXBvbmVudCcsIHsgXG4gICAgdXVpZDogbm9kZVV1aWQsXG4gICAgY29tcG9uZW50OiAnY2MuU3ByaXRlJ1xufSk7XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIHJlbW92ZV9jb21wb25lbnQ6IGBcbmF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3JlbW92ZS1jb21wb25lbnQnLCB7IFxuICAgIHV1aWQ6IGNvbXBvbmVudFV1aWQsXG59KTtcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgcmVzZXRfY29tcG9uZW50OiBgXG5hd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdyZXNldC1jb21wb25lbnQnLCB7XG4gICAgdXVpZDogY29tcG9uZW50VXVpZCxcbn0pO1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBleGVjdXRlX2NvbXBvbmVudF9tZXRob2Q6IGBcbmF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ2V4ZWN1dGUtY29tcG9uZW50LW1ldGhvZCcsIHtcbiAgICB1dWlkOiBjb21wb25lbnRVdWlkLFxuICAgIG5hbWU6ICdnZXROb2lzZVByZXZpZXcnLFxuICAgIGFyZ3M6IFsxMDAsIDEwMF0sXG59KTtcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgZXhlY3V0ZV9zY2VuZV9zY3JpcHQ6IGBcbmF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ2V4ZWN1dGUtc2NlbmUtc2NyaXB0Jywge1xuICAgIG5hbWU6ICdhbmltYXRpb24tZ3JhcGgnLFxuICAgIG1ldGhvZDogJ3F1ZXJ5JyxcbiAgICBhcmdzOiBbXSxcbn0pO1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBzbmFwc2hvdDogYFxuYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnc25hcHNob3QnKTtcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgc25hcHNob3RfYWJvcnQ6IGBcbmF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3NuYXBzaG90LWFib3J0Jyk7XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIGJlZ2luX3JlY29yZGluZzogYFxuY29uc3QgdW5kb0lEID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnYmVnaW4tcmVjb3JkaW5nJywgbm9kZVV1aWQpO1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBlbmRfcmVjb3JkaW5nOiBgXG5hd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdlbmQtcmVjb3JkaW5nJywgdW5kb0lEKTtcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgY2FuY2VsX3JlY29yZGluZzogYFxuYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnY2FuY2VsLXJlY29yZGluZycsIHVuZG9JRCk7XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIHNvZnRfcmVsb2FkOiBgXG5hd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdzb2Z0LXJlbG9hZCcpO1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBxdWVyeV9jb21wb25lbnQ6IGBcbmF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3F1ZXJ5LWNvbXBvbmVudCcsIG5vZGVVdWlkKTtcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgY2hhbmdlX2dpem1vX3Rvb2w6IGBcbmF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ2NoYW5nZS1naXptby10b29sJywgJ3Bvc2l0aW9uJyk7XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIGNoYW5nZV9naXptb19waXZvdDogYFxuYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnY2hhbmdlLWdpem1vLXBpdm90Jyk7XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIGNoYW5nZV9naXptb19jb29yZGluYXRlOiBgXG5hd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdjaGFuZ2UtZ2l6bW8tY29vcmRpbmF0ZScsICdnbG9iYWwnKTtcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgY2hhbmdlX2lzMkQ6IGBcbmF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ2NoYW5nZS1pczJEJywgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIHNldF9ncmlkX3Zpc2libGU6IGBcbmF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3NldC1ncmlkLXZpc2libGUnLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIHF1ZXJ5X2lzX2dyaWRfdmlzaWJsZTogYFxuYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktaXMtZ3JpZC12aXNpYmxlJyk7XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIHNldF9pY29uX2dpem1vXzNkOiBgXG5hd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdzZXQtaWNvbi1naXptby0zZCcsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgcXVlcnlfaXNfaWNvbl9naXptb18zZDogYFxuYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktaXMtaWNvbi1naXptby0zZCcpO1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBzZXRfaWNvbl9naXptb19zaXplOiBgXG5hd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdzZXQtaWNvbi1naXptby1zaXplJywgNjApO1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBxdWVyeV9pY29uX2dpem1vX3NpemU6IGBcbmF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3F1ZXJ5LWljb24tZ2l6bW8tc2l6ZScpO1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBxdWVyeV9naXptb190b29sX25hbWU6IGBcbmF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3F1ZXJ5LWdpem1vLXRvb2wtbmFtZScpO1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBxdWVyeV9naXptb192aWV3X21vZGU6IGBcbmF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3F1ZXJ5LWdpem1vLXZpZXctbW9kZScpO1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBxdWVyeV9naXptb19waXZvdDogYFxuYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktZ2l6bW8tcGl2b3QnKTtcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgcXVlcnlfZ2l6bW9fY29vcmRpbmF0ZTogYFxuYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktZ2l6bW8tY29vcmRpbmF0ZScpO1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBxdWVyeV9pczJEOiBgXG5hd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1pczJEJyk7XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIGZvY3VzX2NhbWVyYTogYFxuYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnZm9jdXMtY2FtZXJhJywgbm9kZVV1aWRzKTtcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgYWxpZ25fd2l0aF92aWV3OiBgXG5hd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdhbGlnbi13aXRoLXZpZXcnKTtcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgYWxpZ25fdmlld193aXRoX25vZGU6IGBcbmF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ2FsaWduLXdpdGgtdmlldy1ub2RlJyk7XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIC8vIGJyb2FkY2FzdFxuICAgICAgICAgICAgc2NlbmVfcmVhZHk6IGBcbkVkaXRvci5NZXNzYWdlLmJyb2FkY2FzdCgnc2NlbmU6cmVhZHknLCBhc3NldFV1aWQpO1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBzY2VuZV9jbG9zZTogYFxuRWRpdG9yLk1lc3NhZ2UuYnJvYWRjYXN0KCdzY2VuZTpjbG9zZScpO1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBsaWdodF9wcm9iZV9lZGl0X21vZGVfY2hhbmdlZDogYFxuRWRpdG9yLk1lc3NhZ2UuYnJvYWRjYXN0KCdzY2VuZTpsaWdodC1wcm9iZS1lZGl0LW1vZGUtY2hhbmdlZCcsIHRydWUpO1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBsaWdodF9wcm9iZV9ib3VuZGluZ19ib3hfZWRpdF9tb2RlX2NoYW5nZWQ6IGBcbkVkaXRvci5NZXNzYWdlLmJyb2FkY2FzdCgnc2NlbmU6bGlnaHQtcHJvYmUtYm91bmRpbmctYm94LWVkaXQtbW9kZS1jaGFuZ2VkJywgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgfSxcbiAgICB9LFxufSJdfQ==