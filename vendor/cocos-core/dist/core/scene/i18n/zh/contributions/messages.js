"use strict";
module.exports = {
    messages: {
        description: {
            gameview_stop: '退出播放',
            gameview_play_of_switch_scene: '当前 Game View 处于播放状态,要切换场景请退出播放。',
            open_scene: '打开场景',
            close_scene: '关闭场景',
            save_scene: '保存场景',
            save_as_scene: '场景另存为',
            query_is_ready: '查询当前场景是否准备就绪',
            query_dirty: '查询当前场景是否有修改',
            query_classes: '查询所有在引擎中注册的类',
            query_components: '查询当前场景的所有组件',
            query_component_has_script: '查询引擎组件列表是否含有指定类名的脚本',
            query_node_tree: '查询节点树的信息',
            query_node_by_asset_uuid: '查询使用了资源 UUID 的节点',
            set_property: '设置某个元素内的属性',
            reset_property: '重置元素属性到默认值',
            // update_property_from_null: '属性值从 null 变为一个可编辑的值',
            // set_node_and_children_layer: '置某个节点连同它的子集的 Layer 属性值',
            move_array_element: '移动数组内某个元素的位置',
            remove_array_element: '删除数组内某个元素的位置',
            cut_node: '剪切节点',
            // select_all_nodes: '选择所有节点',
            copy_node: '拷贝节点，给下一步粘贴（创建）节点准备数据',
            duplicate_node: '复制节点',
            paste_node: '粘贴节点',
            set_parent: '设置节点父级',
            create_node: '创建节点',
            query_node: '查询一个节点的数据',
            reset_node: '重置节点的位置, 角度和缩放',
            remove_node: '删除节点',
            create_component: '创建组件',
            reset_component: '重置组件',
            execute_component_method: '执行组件上的方法',
            execute_scene_script: '执行某个插件注册的方法',
            remove_component: '删除组件',
            query_component: '查询一个组件的数据',
            snapshot: '快照当前场景状态',
            snapshot_abort: '中止快照',
            // undo: '撤销一次操作记录',
            // redo: '重做一次操作记录',
            soft_reload: '软刷新场景',
            change_gizmo_tool: '更改 Gizmo 工具',
            change_gizmo_pivot: '更改变换基准点',
            change_gizmo_coordinate: '更改坐标系',
            change_is2D: '更改2D/3D视图模式',
            set_grid_visible: '显示/隐藏网格',
            query_is_grid_visible: '查询网格显示状态',
            set_icon_gizmo_3d: '设置 IconGizmo 为 3D 或 2D 模式',
            query_is_icon_gizmo_3d: '查询 IconGizmo 模式',
            set_icon_gizmo_size: '设置 IconGizmo 的大小',
            query_icon_gizmo_size: '查询 IconGizmo 的大小',
            query_gizmo_tool_name: '获取当前 Gizmo 工具的名字',
            query_gizmo_view_mode: '查询视图模式（查看/选择）',
            query_gizmo_pivot: '获取当前 Gizmo 基准点名字',
            query_gizmo_coordinate: '获取当前坐标系名字',
            query_is2D: '获取当前视图模式',
            focus_camera: '聚焦场景相机到节点上',
            align_with_view: '将场景相机位置与角度应用到选中节点上',
            align_view_with_node: '将选中节点位置与角度应用到当前视角',
            // broadcast
            scene_ready: '场景打开通知',
            scene_close: '场景关闭通知',
            UITransform_lack: '正在添加 UI 节点，但所有上层节点都没有 cc.UITransform 组件',
            UITransform_add_to_root: '给根节点添加 cc.UITransform 组件',
            UITransform_within_canvas: '创建 Canvas 节点作为父节点',
            UITransform_cancel: '取消',
            animationComponentCollision: '动画控制器组件和动画组件、骨骼动画组件不能共存。',
            physicsDynamicBodyShape: '动力学刚体不能设置为以下碰撞体：Terrain, Plane, Non-Convex Mesh。',
            light_probe_edit_mode_changed: '光照探针编辑模式切换通知',
            light_probe_bounding_box_edit_mode_changed: '光照探针组件包围盒编辑模式切换通知',
            light_probe_delete_when_editing_probe: '当前正在探针编辑模式 无法修改正在编辑的探针节点。请先退出探针编辑模式并再次尝试。',
            begin_recording: '开始记录节点 Undo 数据',
            end_recording: '结束记录节点 Undo 数据',
            cancel_recording: '取消记录节点 Undo 数据',
            // prefab
            create_prefab: '创建预制体资源(内置撤销记录)',
            apply_prefab: '应用预制体节点修改到对应资源(内置撤销记录)',
            restore_prefab: '使用预制体资源还原对应预制件节点(内置撤销记录)',
            revert_removed_component: '还原预制体节点被移除的组件(内置撤销记录)',
            apply_removed_component: '应用预制体删除组件的修改到对应资源(内置撤销记录)',
        },
        doc: {
            // message
            open_scene: `
                - uuid {string} 场景资源的 UUID`,
            query_classes: `
                @returns {[Object]}
                - extends? {string} 过滤出基于此类名扩展而来的类
                `,
            query_components: `
                @returns {[Object]}
                - name {string} 组件名字
                - path {string} 菜单路径
                `,
            query_component_has_script: `
                - name 脚本的类名 Class
                
                @returns {boolean} 存在 true, 不存在 false
                `,
            query_node_tree: `
                - uuid? {string} 根节点 uuid，不传入则以场景节点为根节点
                
                @returns {Object}
                - name {string} 节点名字或者 'scene'
                - active {boolean} 节点激活状态 
                - type {string} cc.Scene or cc.Node
                - uuid {string} 节点的 uuid
                - children {[]} 子节点数组
                - prefab {number} prefab状态, 1 表示是 prefab, 2 表示是 prefab 但丢失资源
                - isScene {boolean} 是否是场景节点
                - components {[Object]} 组件数组
                    - type {string} 组件类型
                    - value {string} 组件的 uuid 
                    - extends {[string]} 组件的继承链数组
                `,
            query_node_by_asset_uuid: `
                - 查询使用了资源 UUID 的节点
                
                @returns {string[]}  节点的 uuid
                `,
            set_property: `
                - options {SetPropertyOptions}
                    - uuid {string} 修改属性的对象的 uuid
                    - path {string} 属性挂载对象的搜索路径
                    - dump {IProperty} 属性 dump 出来的数据
                `,
            reset_property: `
                - options {SetPropertyOptions}
                    - uuid {string} 修改属性的对象的 uuid
                    - path {string} 属性挂载对象的搜索路径
                `,
            // update_property_from_null: `
            // - options {SetPropertyOptions}
            //     - uuid {string} 修改属性的对象的 uuid
            //     - path {string} 属性挂载对象的搜索路径
            // `,
            // set_node_and_children_layer: `
            // - options {SetPropertyOptions}
            //     - uuid {string} 修改属性的对象的 uuid
            //     - path {string} 属性挂载对象的搜索路径
            //     - dump {IProperty} 属性 dump 出来的数据
            // `,
            move_array_element: `
                - options {MoveArrayOptions}
                    - uuid {string} 节点的 uuid
                    - path {string} 数组的搜索路径
                    - target {number} 目标 item 原来的索引
                    - offset {number} 偏移量
                
                @returns {boolean} 操作是否成功
                `,
            remove_array_element: `
                - options {MoveArrayOptions}
                    - uuid {string} 节点的 uuid
                    - path {string} 数组的搜索路径
                    - index {number} 目标 item 的索引
                
                @returns {boolean} 操作是否成功
                `,
            // select_all_nodes: `
            // - 选择所有节点，在不同的场景模式下，选到的节点类型有所区别，比如Light Probe Editor模式下，只会选到Light Probe节点
            // @returns {string[]}  节点的 uuid
            // `,
            copy_node: `
                - uuids {string | string[]} 节点的 uuid
    
                @returns {string | string[]} 返回节点的 uuid
                `,
            cut_node: `
                - uuids {string | string[]} 节点的 uuid
    
                @returns {string | string[]} 返回节点的 uuid
                `,
            duplicate_node: `
                - uuids {string | string[]} 节点的 uuid
    
                @returns {string | string[]} 返回新节点的 uuid
                `,
            paste_node: `
                - options {PasteNodeOptions}
                    - target {string} 目标节点 uuid
                    - uuids {string | string[]} 被复制的节点 uuid
                    - keepWorldTransform {boolean} 是否保持新节点的世界坐标不变
                
                @returns {string | string[]} 返回新节点的 uuid
                `,
            set_parent: `
                - options {CutNodeOptions}
                    - parent {string} 父节点 uuid
                    - uuids {string|string[]} 需要设置的子节点 uuid
                    - keepWorldTransform {boolean} 是否保持新节点的世界坐标不变
                
                @returns {string | string[]} 返回节点的 uuid
                `,
            create_node: `
                - options {CreateNodeOptions}
                    - parent {string} 父节点 uuid
                    - components? {string[]} 组件名字
                
                    - name? {string} 节点名字
                    - dump? {INode | IScene} node 初始化应用的 dump 数据
                    - keepWorldTransform? {boolean} 是否保持新节点的世界坐标不变
                    - type? {string} 资源类型
                    - canvasRequired? {boolean} 是否需要有 cc.Canvas
                    - unlinkPrefab? {boolean} 是否要解绑为普通节点
                    - assetUuid? {string} asset uuid，从资源实例化节点
                
                @returns {string | string[]} 返回新节点的 uuid
                `,
            query_node: `
                - uuid {string} 节点的 uuid
    
                @returns {Object} 节点的 dump 数据
                `,
            reset_node: `
                - uuid {string} 节点的 uuid
    
                @returns {boolean} 操作是否成功
                `,
            restore_prefab: `
                - uuid {string} 节点的 uuid
                - assetUuid {string} 资源的 uuid
    
                @returns {boolean} 操作是否成功
                `,
            remove_node: `
                - options {RemoveNodeOptions}
                    - uuid: {string | string[]} 节点的 uuid
                `,
            create_component: `
                - options {CreateComponentOptions}
                    - uuid {string} 节点的 uuid
                    - component {string} 组件 classId （cid）（推荐方式） 或者 className 类名
                `,
            remove_component: `
                - options {CreateComponentOptions}
                    - uuid {string} 节点的 uuid
                    - component {string} 组件 classId （cid）（推荐方式） 或者 className 类名
                `,
            reset_component: `
                - options {ResetComponentOptions}
                    - uuid {string} 组件的 uuid
                
                @returns {boolean} 操作是否成功
                `,
            execute_component_method: `
                - options {ExecuteComponentMethodOptions}
                    - uuid {string} 组件的 uuid
                    - name {string} 方法名
                    - args {any[]} 参数
                `,
            execute_scene_script: `
                - options {ExecuteSceneScriptMethodsOptions}
                    - name {string} 注册进来的插件名字
                    - method {string} 执行的方法名字
                    - args {any[]} 参数数组
                `,
            query_component: `
                - uuid {string} 组件的 uuid
    
                @returns {Object} 组件的 dump 数据
                `,
            change_gizmo_tool: `
                - name {string} 工具名字 'position' | 'rotation' | 'scale'| 'rect'
                `,
            change_gizmo_pivot: `
                - name {string} 变换基准点 'pivot' | 'center'
                `,
            change_gizmo_coordinate: `
                - type {string} 坐标系 'local' | 'global'
                `,
            change_is2D: `
                - is2D {boolean} 2D/3D视图
                `,
            set_grid_visible: `
                - visible {boolean} 显示/隐藏网格
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
                - size {number} IconGizmo 的大小
                `,
            query_icon_gizmo_size: `
                @returns {number} IconGizmo 的大小
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
                - uuids {string[] | null} 节点 uuid
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
                - mode {boolean} 切换后的探针编辑模式
                `,
            light_probe_bounding_box_edit_mode_changed: `
                - mode {boolean} 切换后的探针组件包围盒编辑模式
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
await Editor.Message.request('scene', 'query-gizmo-pivot');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVzc2FnZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9zY2VuZS9pMThuL3poL2NvbnRyaWJ1dGlvbnMvbWVzc2FnZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE1BQU0sQ0FBQyxPQUFPLEdBQUc7SUFDYixRQUFRLEVBQUU7UUFDTixXQUFXLEVBQUU7WUFDVCxhQUFhLEVBQUUsTUFBTTtZQUNyQiw2QkFBNkIsRUFBRSxpQ0FBaUM7WUFDaEUsVUFBVSxFQUFFLE1BQU07WUFDbEIsV0FBVyxFQUFFLE1BQU07WUFDbkIsVUFBVSxFQUFFLE1BQU07WUFDbEIsYUFBYSxFQUFFLE9BQU87WUFDdEIsY0FBYyxFQUFFLGNBQWM7WUFDOUIsV0FBVyxFQUFFLGFBQWE7WUFDMUIsYUFBYSxFQUFFLGNBQWM7WUFDN0IsZ0JBQWdCLEVBQUUsYUFBYTtZQUMvQiwwQkFBMEIsRUFBRSxxQkFBcUI7WUFDakQsZUFBZSxFQUFFLFVBQVU7WUFDM0Isd0JBQXdCLEVBQUUsa0JBQWtCO1lBQzVDLFlBQVksRUFBRSxZQUFZO1lBQzFCLGNBQWMsRUFBRSxZQUFZO1lBQzVCLG9EQUFvRDtZQUNwRCx5REFBeUQ7WUFDekQsa0JBQWtCLEVBQUUsY0FBYztZQUNsQyxvQkFBb0IsRUFBRSxjQUFjO1lBQ3BDLFFBQVEsRUFBRSxNQUFNO1lBQ2hCLDhCQUE4QjtZQUM5QixTQUFTLEVBQUUsdUJBQXVCO1lBQ2xDLGNBQWMsRUFBRSxNQUFNO1lBQ3RCLFVBQVUsRUFBRSxNQUFNO1lBQ2xCLFVBQVUsRUFBRSxRQUFRO1lBQ3BCLFdBQVcsRUFBRSxNQUFNO1lBQ25CLFVBQVUsRUFBRSxXQUFXO1lBQ3ZCLFVBQVUsRUFBRSxnQkFBZ0I7WUFDNUIsV0FBVyxFQUFFLE1BQU07WUFDbkIsZ0JBQWdCLEVBQUUsTUFBTTtZQUN4QixlQUFlLEVBQUUsTUFBTTtZQUN2Qix3QkFBd0IsRUFBRSxVQUFVO1lBQ3BDLG9CQUFvQixFQUFF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RTs7aUJBRWxCO1lBQ0wscUJBQXFCLEVBQUU7O2lCQUVsQjtZQUNMLHFCQUFxQixFQUFFOztpQkFFbEI7WUFDTCxpQkFBaUIsRUFBRTs7aUJBRWQ7WUFDTCxzQkFBc0IsRUFBRTs7aUJBRW5CO1lBQ0wsVUFBVSxFQUFFOztpQkFFUDtZQUNMLFlBQVksRUFBRTs7aUJBRVQ7WUFDTCxlQUFlLEVBQUU7O2lCQUVaO1lBQ0wsb0JBQW9CLEVBQUU7O2lCQUVqQjtZQUNMLFlBQVk7WUFDWixXQUFXLEVBQUU7O2lCQUVSO1lBQ0wsV0FBVyxFQUFFOztpQkFFUjtZQUNMLDZCQUE2QixFQUFFOztpQkFFMUI7WUFDTCwwQ0FBMEMsRUFBRTs7aUJBRXZDO1NBQ1I7S0FDSjtDQUNKLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBtZXNzYWdlczoge1xuICAgICAgICBkZXNjcmlwdGlvbjoge1xuICAgICAgICAgICAgZ2FtZXZpZXdfc3RvcDogJ+mAgOWHuuaSreaUvicsXG4gICAgICAgICAgICBnYW1ldmlld19wbGF5X29mX3N3aXRjaF9zY2VuZTogJ+W9k+WJjSBHYW1lIFZpZXcg5aSE5LqO5pKt5pS+54q25oCBLOimgeWIh+aNouWcuuaZr+ivt+mAgOWHuuaSreaUvuOAgicsXG4gICAgICAgICAgICBvcGVuX3NjZW5lOiAn5omT5byA5Zy65pmvJyxcbiAgICAgICAgICAgIGNsb3NlX3NjZW5lOiAn5YWz6Zet5Zy65pmvJyxcbiAgICAgICAgICAgIHNhdmVfc2NlbmU6ICfkv53lrZjlnLrmma8nLFxuICAgICAgICAgICAgc2F2ZV9hc19zY2VuZTogJ+WcuuaZr+WPpuWtmOS4uicsXG4gICAgICAgICAgICBxdWVyeV9pc19yZWFkeTogJ+afpeivouW9k+WJjeWcuuaZr+aYr+WQpuWHhuWkh+Wwsee7qicsXG4gICAgICAgICAgICBxdWVyeV9kaXJ0eTogJ+afpeivouW9k+WJjeWcuuaZr+aYr+WQpuacieS/ruaUuScsXG4gICAgICAgICAgICBxdWVyeV9jbGFzc2VzOiAn5p+l6K+i5omA5pyJ5Zyo5byV5pOO5Lit5rOo5YaM55qE57G7JyxcbiAgICAgICAgICAgIHF1ZXJ5X2NvbXBvbmVudHM6ICfmn6Xor6LlvZPliY3lnLrmma/nmoTmiYDmnInnu4Tku7YnLFxuICAgICAgICAgICAgcXVlcnlfY29tcG9uZW50X2hhc19zY3JpcHQ6ICfmn6Xor6LlvJXmk47nu4Tku7bliJfooajmmK/lkKblkKvmnInmjIflrprnsbvlkI3nmoTohJrmnKwnLFxuICAgICAgICAgICAgcXVlcnlfbm9kZV90cmVlOiAn5p+l6K+i6IqC54K55qCR55qE5L+h5oGvJyxcbiAgICAgICAgICAgIHF1ZXJ5X25vZGVfYnlfYXNzZXRfdXVpZDogJ+afpeivouS9v+eUqOS6hui1hOa6kCBVVUlEIOeahOiKgueCuScsXG4gICAgICAgICAgICBzZXRfcHJvcGVydHk6ICforr7nva7mn5DkuKrlhYPntKDlhoXnmoTlsZ7mgKcnLFxuICAgICAgICAgICAgcmVzZXRfcHJvcGVydHk6ICfph43nva7lhYPntKDlsZ7mgKfliLDpu5jorqTlgLwnLFxuICAgICAgICAgICAgLy8gdXBkYXRlX3Byb3BlcnR5X2Zyb21fbnVsbDogJ+WxnuaAp+WAvOS7jiBudWxsIOWPmOS4uuS4gOS4quWPr+e8lui+keeahOWAvCcsXG4gICAgICAgICAgICAvLyBzZXRfbm9kZV9hbmRfY2hpbGRyZW5fbGF5ZXI6ICfnva7mn5DkuKroioLngrnov57lkIzlroPnmoTlrZDpm4bnmoQgTGF5ZXIg5bGe5oCn5YC8JyxcbiAgICAgICAgICAgIG1vdmVfYXJyYXlfZWxlbWVudDogJ+enu+WKqOaVsOe7hOWGheafkOS4quWFg+e0oOeahOS9jee9ricsXG4gICAgICAgICAgICByZW1vdmVfYXJyYXlfZWxlbWVudDogJ+WIoOmZpOaVsOe7hOWGheafkOS4quWFg+e0oOeahOS9jee9ricsXG4gICAgICAgICAgICBjdXRfbm9kZTogJ+WJquWIh+iKgueCuScsXG4gICAgICAgICAgICAvLyBzZWxlY3RfYWxsX25vZGVzOiAn6YCJ5oup5omA5pyJ6IqC54K5JyxcbiAgICAgICAgICAgIGNvcHlfbm9kZTogJ+aLt+i0neiKgueCue+8jOe7meS4i+S4gOatpeeymOi0tO+8iOWIm+W7uu+8ieiKgueCueWHhuWkh+aVsOaNricsXG4gICAgICAgICAgICBkdXBsaWNhdGVfbm9kZTogJ+WkjeWItuiKgueCuScsXG4gICAgICAgICAgICBwYXN0ZV9ub2RlOiAn57KY6LS06IqC54K5JyxcbiAgICAgICAgICAgIHNldF9wYXJlbnQ6ICforr7nva7oioLngrnniLbnuqcnLFxuICAgICAgICAgICAgY3JlYXRlX25vZGU6ICfliJvlu7roioLngrknLFxuICAgICAgICAgICAgcXVlcnlfbm9kZTogJ+afpeivouS4gOS4quiKgueCueeahOaVsOaNricsXG4gICAgICAgICAgICByZXNldF9ub2RlOiAn6YeN572u6IqC54K555qE5L2N572uLCDop5LluqblkoznvKnmlL4nLFxuICAgICAgICAgICAgcmVtb3ZlX25vZGU6ICfliKDpmaToioLngrknLFxuICAgICAgICAgICAgY3JlYXRlX2NvbXBvbmVudDogJ+WIm+W7uue7hOS7ticsXG4gICAgICAgICAgICByZXNldF9jb21wb25lbnQ6ICfph43nva7nu4Tku7YnLFxuICAgICAgICAgICAgZXhlY3V0ZV9jb21wb25lbnRfbWV0aG9kOiAn5omn6KGM57uE5Lu25LiK55qE5pa55rOVJyxcbiAgICAgICAgICAgIGV4ZWN1dGVfc2NlbmVfc2NyaXB0OiAn5omn6KGM5p+Q5Liq5o+S5Lu25rOo5YaM55qE5pa55rOVJyxcbiAgICAgICAgICAgIHJlbW92ZV9jb21wb25lbnQ6ICfliKDpmaTnu4Tku7YnLFxuICAgICAgICAgICAgcXVlcnlfY29tcG9uZW50OiAn5p+l6K+i5LiA5Liq57uE5Lu255qE5pWw5o2uJyxcbiAgICAgICAgICAgIHNuYXBzaG90OiAn5b+r54Wn5b2T5YmN5Zy65pmv54q25oCBJyxcbiAgICAgICAgICAgIHNuYXBzaG90X2Fib3J0OiAn5Lit5q2i5b+r54WnJyxcbiAgICAgICAgICAgIC8vIHVuZG86ICfmkqTplIDkuIDmrKHmk43kvZzorrDlvZUnLFxuICAgICAgICAgICAgLy8gcmVkbzogJ+mHjeWBmuS4gOasoeaTjeS9nOiusOW9lScsXG4gICAgICAgICAgICBzb2Z0X3JlbG9hZDogJ+i9r+WIt+aWsOWcuuaZrycsXG4gICAgICAgICAgICBjaGFuZ2VfZ2l6bW9fdG9vbDogJ+abtOaUuSBHaXptbyDlt6XlhbcnLFxuICAgICAgICAgICAgY2hhbmdlX2dpem1vX3Bpdm90OiAn5pu05pS55Y+Y5o2i5Z+65YeG54K5JyxcbiAgICAgICAgICAgIGNoYW5nZV9naXptb19jb29yZGluYXRlOiAn5pu05pS55Z2Q5qCH57O7JyxcbiAgICAgICAgICAgIGNoYW5nZV9pczJEOiAn5pu05pS5MkQvM0Top4blm77mqKHlvI8nLFxuICAgICAgICAgICAgc2V0X2dyaWRfdmlzaWJsZTogJ+aYvuekui/pmpDol4/nvZHmoLwnLFxuICAgICAgICAgICAgcXVlcnlfaXNfZ3JpZF92aXNpYmxlOiAn5p+l6K+i572R5qC85pi+56S654q25oCBJyxcbiAgICAgICAgICAgIHNldF9pY29uX2dpem1vXzNkOiAn6K6+572uIEljb25HaXptbyDkuLogM0Qg5oiWIDJEIOaooeW8jycsXG4gICAgICAgICAgICBxdWVyeV9pc19pY29uX2dpem1vXzNkOiAn5p+l6K+iIEljb25HaXptbyDmqKHlvI8nLFxuICAgICAgICAgICAgc2V0X2ljb25fZ2l6bW9fc2l6ZTogJ+iuvue9riBJY29uR2l6bW8g55qE5aSn5bCPJyxcbiAgICAgICAgICAgIHF1ZXJ5X2ljb25fZ2l6bW9fc2l6ZTogJ+afpeivoiBJY29uR2l6bW8g55qE5aSn5bCPJyxcbiAgICAgICAgICAgIHF1ZXJ5X2dpem1vX3Rvb2xfbmFtZTogJ+iOt+WPluW9k+WJjSBHaXptbyDlt6XlhbfnmoTlkI3lrZcnLFxuICAgICAgICAgICAgcXVlcnlfZ2l6bW9fdmlld19tb2RlOiAn5p+l6K+i6KeG5Zu+5qih5byP77yI5p+l55yLL+mAieaLqe+8iScsXG4gICAgICAgICAgICBxdWVyeV9naXptb19waXZvdDogJ+iOt+WPluW9k+WJjSBHaXptbyDln7rlh4bngrnlkI3lrZcnLFxuICAgICAgICAgICAgcXVlcnlfZ2l6bW9fY29vcmRpbmF0ZTogJ+iOt+WPluW9k+WJjeWdkOagh+ezu+WQjeWtlycsXG4gICAgICAgICAgICBxdWVyeV9pczJEOiAn6I635Y+W5b2T5YmN6KeG5Zu+5qih5byPJyxcbiAgICAgICAgICAgIGZvY3VzX2NhbWVyYTogJ+iBmueEpuWcuuaZr+ebuOacuuWIsOiKgueCueS4iicsXG4gICAgICAgICAgICBhbGlnbl93aXRoX3ZpZXc6ICflsIblnLrmma/nm7jmnLrkvY3nva7kuI7op5LluqblupTnlKjliLDpgInkuK3oioLngrnkuIonLFxuICAgICAgICAgICAgYWxpZ25fdmlld193aXRoX25vZGU6ICflsIbpgInkuK3oioLngrnkvY3nva7kuI7op5LluqblupTnlKjliLDlvZPliY3op4bop5InLFxuICAgICAgICAgICAgLy8gYnJvYWRjYXN0XG4gICAgICAgICAgICBzY2VuZV9yZWFkeTogJ+WcuuaZr+aJk+W8gOmAmuefpScsXG4gICAgICAgICAgICBzY2VuZV9jbG9zZTogJ+WcuuaZr+WFs+mXremAmuefpScsXG5cbiAgICAgICAgICAgIFVJVHJhbnNmb3JtX2xhY2s6ICfmraPlnKjmt7vliqAgVUkg6IqC54K577yM5L2G5omA5pyJ5LiK5bGC6IqC54K56YO95rKh5pyJIGNjLlVJVHJhbnNmb3JtIOe7hOS7ticsXG4gICAgICAgICAgICBVSVRyYW5zZm9ybV9hZGRfdG9fcm9vdDogJ+e7meagueiKgueCuea3u+WKoCBjYy5VSVRyYW5zZm9ybSDnu4Tku7YnLFxuICAgICAgICAgICAgVUlUcmFuc2Zvcm1fd2l0aGluX2NhbnZhczogJ+WIm+W7uiBDYW52YXMg6IqC54K55L2c5Li654i26IqC54K5JyxcbiAgICAgICAgICAgIFVJVHJhbnNmb3JtX2NhbmNlbDogJ+WPlua2iCcsXG5cbiAgICAgICAgICAgIGFuaW1hdGlvbkNvbXBvbmVudENvbGxpc2lvbjogJ+WKqOeUu+aOp+WItuWZqOe7hOS7tuWSjOWKqOeUu+e7hOS7tuOAgemqqOmqvOWKqOeUu+e7hOS7tuS4jeiDveWFseWtmOOAgicsXG5cbiAgICAgICAgICAgIHBoeXNpY3NEeW5hbWljQm9keVNoYXBlOiAn5Yqo5Yqb5a2m5Yia5L2T5LiN6IO96K6+572u5Li65Lul5LiL56Kw5pKe5L2T77yaVGVycmFpbiwgUGxhbmUsIE5vbi1Db252ZXggTWVzaOOAgicsXG5cbiAgICAgICAgICAgIGxpZ2h0X3Byb2JlX2VkaXRfbW9kZV9jaGFuZ2VkOiAn5YWJ54Wn5o6i6ZKI57yW6L6R5qih5byP5YiH5o2i6YCa55+lJyxcbiAgICAgICAgICAgIGxpZ2h0X3Byb2JlX2JvdW5kaW5nX2JveF9lZGl0X21vZGVfY2hhbmdlZDogJ+WFieeFp+aOoumSiOe7hOS7tuWMheWbtOebkue8lui+keaooeW8j+WIh+aNoumAmuefpScsXG4gICAgICAgICAgICBsaWdodF9wcm9iZV9kZWxldGVfd2hlbl9lZGl0aW5nX3Byb2JlOiAn5b2T5YmN5q2j5Zyo5o6i6ZKI57yW6L6R5qih5byPIOaXoOazleS/ruaUueato+WcqOe8lui+keeahOaOoumSiOiKgueCueOAguivt+WFiOmAgOWHuuaOoumSiOe8lui+keaooeW8j+W5tuWGjeasoeWwneivleOAgicsXG5cbiAgICAgICAgICAgIGJlZ2luX3JlY29yZGluZzogJ+W8gOWni+iusOW9leiKgueCuSBVbmRvIOaVsOaNricsXG4gICAgICAgICAgICBlbmRfcmVjb3JkaW5nOiAn57uT5p2f6K6w5b2V6IqC54K5IFVuZG8g5pWw5o2uJyxcbiAgICAgICAgICAgIGNhbmNlbF9yZWNvcmRpbmc6ICflj5bmtojorrDlvZXoioLngrkgVW5kbyDmlbDmja4nLFxuXG4gICAgICAgICAgICAvLyBwcmVmYWJcbiAgICAgICAgICAgIGNyZWF0ZV9wcmVmYWI6ICfliJvlu7rpooTliLbkvZPotYTmupAo5YaF572u5pKk6ZSA6K6w5b2VKScsXG4gICAgICAgICAgICBhcHBseV9wcmVmYWI6ICflupTnlKjpooTliLbkvZPoioLngrnkv67mlLnliLDlr7nlupTotYTmupAo5YaF572u5pKk6ZSA6K6w5b2VKScsXG4gICAgICAgICAgICByZXN0b3JlX3ByZWZhYjogJ+S9v+eUqOmihOWItuS9k+i1hOa6kOi/mOWOn+WvueW6lOmihOWItuS7tuiKgueCuSjlhoXnva7mkqTplIDorrDlvZUpJyxcbiAgICAgICAgICAgIHJldmVydF9yZW1vdmVkX2NvbXBvbmVudDogJ+i/mOWOn+mihOWItuS9k+iKgueCueiiq+enu+mZpOeahOe7hOS7tijlhoXnva7mkqTplIDorrDlvZUpJyxcbiAgICAgICAgICAgIGFwcGx5X3JlbW92ZWRfY29tcG9uZW50OiAn5bqU55So6aKE5Yi25L2T5Yig6Zmk57uE5Lu255qE5L+u5pS55Yiw5a+55bqU6LWE5rqQKOWGhee9ruaSpOmUgOiusOW9lSknLFxuICAgICAgICB9LFxuICAgICAgICBkb2M6IHtcbiAgICAgICAgICAgIC8vIG1lc3NhZ2VcbiAgICAgICAgICAgIG9wZW5fc2NlbmU6IGBcbiAgICAgICAgICAgICAgICAtIHV1aWQge3N0cmluZ30g5Zy65pmv6LWE5rqQ55qEIFVVSURgLFxuICAgICAgICAgICAgcXVlcnlfY2xhc3NlczogYFxuICAgICAgICAgICAgICAgIEByZXR1cm5zIHtbT2JqZWN0XX1cbiAgICAgICAgICAgICAgICAtIGV4dGVuZHM/IHtzdHJpbmd9IOi/h+a7pOWHuuWfuuS6juatpOexu+WQjeaJqeWxleiAjOadpeeahOexu1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBxdWVyeV9jb21wb25lbnRzOiBgXG4gICAgICAgICAgICAgICAgQHJldHVybnMge1tPYmplY3RdfVxuICAgICAgICAgICAgICAgIC0gbmFtZSB7c3RyaW5nfSDnu4Tku7blkI3lrZdcbiAgICAgICAgICAgICAgICAtIHBhdGgge3N0cmluZ30g6I+c5Y2V6Lev5b6EXG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIHF1ZXJ5X2NvbXBvbmVudF9oYXNfc2NyaXB0OiBgXG4gICAgICAgICAgICAgICAgLSBuYW1lIOiEmuacrOeahOexu+WQjSBDbGFzc1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIEByZXR1cm5zIHtib29sZWFufSDlrZjlnKggdHJ1ZSwg5LiN5a2Y5ZyoIGZhbHNlXG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIHF1ZXJ5X25vZGVfdHJlZTogYFxuICAgICAgICAgICAgICAgIC0gdXVpZD8ge3N0cmluZ30g5qC56IqC54K5IHV1aWTvvIzkuI3kvKDlhaXliJnku6XlnLrmma/oioLngrnkuLrmoLnoioLngrlcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBAcmV0dXJucyB7T2JqZWN0fVxuICAgICAgICAgICAgICAgIC0gbmFtZSB7c3RyaW5nfSDoioLngrnlkI3lrZfmiJbogIUgJ3NjZW5lJ1xuICAgICAgICAgICAgICAgIC0gYWN0aXZlIHtib29sZWFufSDoioLngrnmv4DmtLvnirbmgIEgXG4gICAgICAgICAgICAgICAgLSB0eXBlIHtzdHJpbmd9IGNjLlNjZW5lIG9yIGNjLk5vZGVcbiAgICAgICAgICAgICAgICAtIHV1aWQge3N0cmluZ30g6IqC54K555qEIHV1aWRcbiAgICAgICAgICAgICAgICAtIGNoaWxkcmVuIHtbXX0g5a2Q6IqC54K55pWw57uEXG4gICAgICAgICAgICAgICAgLSBwcmVmYWIge251bWJlcn0gcHJlZmFi54q25oCBLCAxIOihqOekuuaYryBwcmVmYWIsIDIg6KGo56S65pivIHByZWZhYiDkvYbkuKLlpLHotYTmupBcbiAgICAgICAgICAgICAgICAtIGlzU2NlbmUge2Jvb2xlYW59IOaYr+WQpuaYr+WcuuaZr+iKgueCuVxuICAgICAgICAgICAgICAgIC0gY29tcG9uZW50cyB7W09iamVjdF19IOe7hOS7tuaVsOe7hFxuICAgICAgICAgICAgICAgICAgICAtIHR5cGUge3N0cmluZ30g57uE5Lu257G75Z6LXG4gICAgICAgICAgICAgICAgICAgIC0gdmFsdWUge3N0cmluZ30g57uE5Lu255qEIHV1aWQgXG4gICAgICAgICAgICAgICAgICAgIC0gZXh0ZW5kcyB7W3N0cmluZ119IOe7hOS7tueahOe7p+aJv+mTvuaVsOe7hFxuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBxdWVyeV9ub2RlX2J5X2Fzc2V0X3V1aWQ6IGBcbiAgICAgICAgICAgICAgICAtIOafpeivouS9v+eUqOS6hui1hOa6kCBVVUlEIOeahOiKgueCuVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIEByZXR1cm5zIHtzdHJpbmdbXX0gIOiKgueCueeahCB1dWlkXG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIHNldF9wcm9wZXJ0eTogYFxuICAgICAgICAgICAgICAgIC0gb3B0aW9ucyB7U2V0UHJvcGVydHlPcHRpb25zfVxuICAgICAgICAgICAgICAgICAgICAtIHV1aWQge3N0cmluZ30g5L+u5pS55bGe5oCn55qE5a+56LGh55qEIHV1aWRcbiAgICAgICAgICAgICAgICAgICAgLSBwYXRoIHtzdHJpbmd9IOWxnuaAp+aMgui9veWvueixoeeahOaQnOe0oui3r+W+hFxuICAgICAgICAgICAgICAgICAgICAtIGR1bXAge0lQcm9wZXJ0eX0g5bGe5oCnIGR1bXAg5Ye65p2l55qE5pWw5o2uXG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIHJlc2V0X3Byb3BlcnR5OiBgXG4gICAgICAgICAgICAgICAgLSBvcHRpb25zIHtTZXRQcm9wZXJ0eU9wdGlvbnN9XG4gICAgICAgICAgICAgICAgICAgIC0gdXVpZCB7c3RyaW5nfSDkv67mlLnlsZ7mgKfnmoTlr7nosaHnmoQgdXVpZFxuICAgICAgICAgICAgICAgICAgICAtIHBhdGgge3N0cmluZ30g5bGe5oCn5oyC6L295a+56LGh55qE5pCc57Si6Lev5b6EXG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIC8vIHVwZGF0ZV9wcm9wZXJ0eV9mcm9tX251bGw6IGBcbiAgICAgICAgICAgIC8vIC0gb3B0aW9ucyB7U2V0UHJvcGVydHlPcHRpb25zfVxuICAgICAgICAgICAgLy8gICAgIC0gdXVpZCB7c3RyaW5nfSDkv67mlLnlsZ7mgKfnmoTlr7nosaHnmoQgdXVpZFxuICAgICAgICAgICAgLy8gICAgIC0gcGF0aCB7c3RyaW5nfSDlsZ7mgKfmjILovb3lr7nosaHnmoTmkJzntKLot6/lvoRcbiAgICAgICAgICAgIC8vIGAsXG4gICAgICAgICAgICAvLyBzZXRfbm9kZV9hbmRfY2hpbGRyZW5fbGF5ZXI6IGBcbiAgICAgICAgICAgIC8vIC0gb3B0aW9ucyB7U2V0UHJvcGVydHlPcHRpb25zfVxuICAgICAgICAgICAgLy8gICAgIC0gdXVpZCB7c3RyaW5nfSDkv67mlLnlsZ7mgKfnmoTlr7nosaHnmoQgdXVpZFxuICAgICAgICAgICAgLy8gICAgIC0gcGF0aCB7c3RyaW5nfSDlsZ7mgKfmjILovb3lr7nosaHnmoTmkJzntKLot6/lvoRcbiAgICAgICAgICAgIC8vICAgICAtIGR1bXAge0lQcm9wZXJ0eX0g5bGe5oCnIGR1bXAg5Ye65p2l55qE5pWw5o2uXG4gICAgICAgICAgICAvLyBgLFxuICAgICAgICAgICAgbW92ZV9hcnJheV9lbGVtZW50OiBgXG4gICAgICAgICAgICAgICAgLSBvcHRpb25zIHtNb3ZlQXJyYXlPcHRpb25zfVxuICAgICAgICAgICAgICAgICAgICAtIHV1aWQge3N0cmluZ30g6IqC54K555qEIHV1aWRcbiAgICAgICAgICAgICAgICAgICAgLSBwYXRoIHtzdHJpbmd9IOaVsOe7hOeahOaQnOe0oui3r+W+hFxuICAgICAgICAgICAgICAgICAgICAtIHRhcmdldCB7bnVtYmVyfSDnm67moIcgaXRlbSDljp/mnaXnmoTntKLlvJVcbiAgICAgICAgICAgICAgICAgICAgLSBvZmZzZXQge251bWJlcn0g5YGP56e76YePXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgQHJldHVybnMge2Jvb2xlYW59IOaTjeS9nOaYr+WQpuaIkOWKn1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICByZW1vdmVfYXJyYXlfZWxlbWVudDogYFxuICAgICAgICAgICAgICAgIC0gb3B0aW9ucyB7TW92ZUFycmF5T3B0aW9uc31cbiAgICAgICAgICAgICAgICAgICAgLSB1dWlkIHtzdHJpbmd9IOiKgueCueeahCB1dWlkXG4gICAgICAgICAgICAgICAgICAgIC0gcGF0aCB7c3RyaW5nfSDmlbDnu4TnmoTmkJzntKLot6/lvoRcbiAgICAgICAgICAgICAgICAgICAgLSBpbmRleCB7bnVtYmVyfSDnm67moIcgaXRlbSDnmoTntKLlvJVcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBAcmV0dXJucyB7Ym9vbGVhbn0g5pON5L2c5piv5ZCm5oiQ5YqfXG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIC8vIHNlbGVjdF9hbGxfbm9kZXM6IGBcbiAgICAgICAgICAgIC8vIC0g6YCJ5oup5omA5pyJ6IqC54K577yM5Zyo5LiN5ZCM55qE5Zy65pmv5qih5byP5LiL77yM6YCJ5Yiw55qE6IqC54K557G75Z6L5pyJ5omA5Yy65Yir77yM5q+U5aaCTGlnaHQgUHJvYmUgRWRpdG9y5qih5byP5LiL77yM5Y+q5Lya6YCJ5YiwTGlnaHQgUHJvYmXoioLngrlcblxuICAgICAgICAgICAgLy8gQHJldHVybnMge3N0cmluZ1tdfSAg6IqC54K555qEIHV1aWRcbiAgICAgICAgICAgIC8vIGAsXG4gICAgICAgICAgICBjb3B5X25vZGU6IGBcbiAgICAgICAgICAgICAgICAtIHV1aWRzIHtzdHJpbmcgfCBzdHJpbmdbXX0g6IqC54K555qEIHV1aWRcbiAgICBcbiAgICAgICAgICAgICAgICBAcmV0dXJucyB7c3RyaW5nIHwgc3RyaW5nW119IOi/lOWbnuiKgueCueeahCB1dWlkXG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIGN1dF9ub2RlOiBgXG4gICAgICAgICAgICAgICAgLSB1dWlkcyB7c3RyaW5nIHwgc3RyaW5nW119IOiKgueCueeahCB1dWlkXG4gICAgXG4gICAgICAgICAgICAgICAgQHJldHVybnMge3N0cmluZyB8IHN0cmluZ1tdfSDov5Tlm57oioLngrnnmoQgdXVpZFxuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBkdXBsaWNhdGVfbm9kZTogYFxuICAgICAgICAgICAgICAgIC0gdXVpZHMge3N0cmluZyB8IHN0cmluZ1tdfSDoioLngrnnmoQgdXVpZFxuICAgIFxuICAgICAgICAgICAgICAgIEByZXR1cm5zIHtzdHJpbmcgfCBzdHJpbmdbXX0g6L+U5Zue5paw6IqC54K555qEIHV1aWRcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgcGFzdGVfbm9kZTogYFxuICAgICAgICAgICAgICAgIC0gb3B0aW9ucyB7UGFzdGVOb2RlT3B0aW9uc31cbiAgICAgICAgICAgICAgICAgICAgLSB0YXJnZXQge3N0cmluZ30g55uu5qCH6IqC54K5IHV1aWRcbiAgICAgICAgICAgICAgICAgICAgLSB1dWlkcyB7c3RyaW5nIHwgc3RyaW5nW119IOiiq+WkjeWItueahOiKgueCuSB1dWlkXG4gICAgICAgICAgICAgICAgICAgIC0ga2VlcFdvcmxkVHJhbnNmb3JtIHtib29sZWFufSDmmK/lkKbkv53mjIHmlrDoioLngrnnmoTkuJbnlYzlnZDmoIfkuI3lj5hcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBAcmV0dXJucyB7c3RyaW5nIHwgc3RyaW5nW119IOi/lOWbnuaWsOiKgueCueeahCB1dWlkXG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIHNldF9wYXJlbnQ6IGBcbiAgICAgICAgICAgICAgICAtIG9wdGlvbnMge0N1dE5vZGVPcHRpb25zfVxuICAgICAgICAgICAgICAgICAgICAtIHBhcmVudCB7c3RyaW5nfSDniLboioLngrkgdXVpZFxuICAgICAgICAgICAgICAgICAgICAtIHV1aWRzIHtzdHJpbmd8c3RyaW5nW119IOmcgOimgeiuvue9rueahOWtkOiKgueCuSB1dWlkXG4gICAgICAgICAgICAgICAgICAgIC0ga2VlcFdvcmxkVHJhbnNmb3JtIHtib29sZWFufSDmmK/lkKbkv53mjIHmlrDoioLngrnnmoTkuJbnlYzlnZDmoIfkuI3lj5hcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBAcmV0dXJucyB7c3RyaW5nIHwgc3RyaW5nW119IOi/lOWbnuiKgueCueeahCB1dWlkXG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIGNyZWF0ZV9ub2RlOiBgXG4gICAgICAgICAgICAgICAgLSBvcHRpb25zIHtDcmVhdGVOb2RlT3B0aW9uc31cbiAgICAgICAgICAgICAgICAgICAgLSBwYXJlbnQge3N0cmluZ30g54i26IqC54K5IHV1aWRcbiAgICAgICAgICAgICAgICAgICAgLSBjb21wb25lbnRzPyB7c3RyaW5nW119IOe7hOS7tuWQjeWtl1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAtIG5hbWU/IHtzdHJpbmd9IOiKgueCueWQjeWtl1xuICAgICAgICAgICAgICAgICAgICAtIGR1bXA/IHtJTm9kZSB8IElTY2VuZX0gbm9kZSDliJ3lp4vljJblupTnlKjnmoQgZHVtcCDmlbDmja5cbiAgICAgICAgICAgICAgICAgICAgLSBrZWVwV29ybGRUcmFuc2Zvcm0/IHtib29sZWFufSDmmK/lkKbkv53mjIHmlrDoioLngrnnmoTkuJbnlYzlnZDmoIfkuI3lj5hcbiAgICAgICAgICAgICAgICAgICAgLSB0eXBlPyB7c3RyaW5nfSDotYTmupDnsbvlnotcbiAgICAgICAgICAgICAgICAgICAgLSBjYW52YXNSZXF1aXJlZD8ge2Jvb2xlYW59IOaYr+WQpumcgOimgeaciSBjYy5DYW52YXNcbiAgICAgICAgICAgICAgICAgICAgLSB1bmxpbmtQcmVmYWI/IHtib29sZWFufSDmmK/lkKbopoHop6Pnu5HkuLrmma7pgJroioLngrlcbiAgICAgICAgICAgICAgICAgICAgLSBhc3NldFV1aWQ/IHtzdHJpbmd9IGFzc2V0IHV1aWTvvIzku47otYTmupDlrp7kvovljJboioLngrlcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBAcmV0dXJucyB7c3RyaW5nIHwgc3RyaW5nW119IOi/lOWbnuaWsOiKgueCueeahCB1dWlkXG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIHF1ZXJ5X25vZGU6IGBcbiAgICAgICAgICAgICAgICAtIHV1aWQge3N0cmluZ30g6IqC54K555qEIHV1aWRcbiAgICBcbiAgICAgICAgICAgICAgICBAcmV0dXJucyB7T2JqZWN0fSDoioLngrnnmoQgZHVtcCDmlbDmja5cbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgcmVzZXRfbm9kZTogYFxuICAgICAgICAgICAgICAgIC0gdXVpZCB7c3RyaW5nfSDoioLngrnnmoQgdXVpZFxuICAgIFxuICAgICAgICAgICAgICAgIEByZXR1cm5zIHtib29sZWFufSDmk43kvZzmmK/lkKbmiJDlip9cbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgcmVzdG9yZV9wcmVmYWI6IGBcbiAgICAgICAgICAgICAgICAtIHV1aWQge3N0cmluZ30g6IqC54K555qEIHV1aWRcbiAgICAgICAgICAgICAgICAtIGFzc2V0VXVpZCB7c3RyaW5nfSDotYTmupDnmoQgdXVpZFxuICAgIFxuICAgICAgICAgICAgICAgIEByZXR1cm5zIHtib29sZWFufSDmk43kvZzmmK/lkKbmiJDlip9cbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgcmVtb3ZlX25vZGU6IGBcbiAgICAgICAgICAgICAgICAtIG9wdGlvbnMge1JlbW92ZU5vZGVPcHRpb25zfVxuICAgICAgICAgICAgICAgICAgICAtIHV1aWQ6IHtzdHJpbmcgfCBzdHJpbmdbXX0g6IqC54K555qEIHV1aWRcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgY3JlYXRlX2NvbXBvbmVudDogYFxuICAgICAgICAgICAgICAgIC0gb3B0aW9ucyB7Q3JlYXRlQ29tcG9uZW50T3B0aW9uc31cbiAgICAgICAgICAgICAgICAgICAgLSB1dWlkIHtzdHJpbmd9IOiKgueCueeahCB1dWlkXG4gICAgICAgICAgICAgICAgICAgIC0gY29tcG9uZW50IHtzdHJpbmd9IOe7hOS7tiBjbGFzc0lkIO+8iGNpZO+8ie+8iOaOqOiNkOaWueW8j++8iSDmiJbogIUgY2xhc3NOYW1lIOexu+WQjVxuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICByZW1vdmVfY29tcG9uZW50OiBgXG4gICAgICAgICAgICAgICAgLSBvcHRpb25zIHtDcmVhdGVDb21wb25lbnRPcHRpb25zfVxuICAgICAgICAgICAgICAgICAgICAtIHV1aWQge3N0cmluZ30g6IqC54K555qEIHV1aWRcbiAgICAgICAgICAgICAgICAgICAgLSBjb21wb25lbnQge3N0cmluZ30g57uE5Lu2IGNsYXNzSWQg77yIY2lk77yJ77yI5o6o6I2Q5pa55byP77yJIOaIluiAhSBjbGFzc05hbWUg57G75ZCNXG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIHJlc2V0X2NvbXBvbmVudDogYFxuICAgICAgICAgICAgICAgIC0gb3B0aW9ucyB7UmVzZXRDb21wb25lbnRPcHRpb25zfVxuICAgICAgICAgICAgICAgICAgICAtIHV1aWQge3N0cmluZ30g57uE5Lu255qEIHV1aWRcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBAcmV0dXJucyB7Ym9vbGVhbn0g5pON5L2c5piv5ZCm5oiQ5YqfXG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIGV4ZWN1dGVfY29tcG9uZW50X21ldGhvZDogYFxuICAgICAgICAgICAgICAgIC0gb3B0aW9ucyB7RXhlY3V0ZUNvbXBvbmVudE1ldGhvZE9wdGlvbnN9XG4gICAgICAgICAgICAgICAgICAgIC0gdXVpZCB7c3RyaW5nfSDnu4Tku7bnmoQgdXVpZFxuICAgICAgICAgICAgICAgICAgICAtIG5hbWUge3N0cmluZ30g5pa55rOV5ZCNXG4gICAgICAgICAgICAgICAgICAgIC0gYXJncyB7YW55W119IOWPguaVsFxuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBleGVjdXRlX3NjZW5lX3NjcmlwdDogYFxuICAgICAgICAgICAgICAgIC0gb3B0aW9ucyB7RXhlY3V0ZVNjZW5lU2NyaXB0TWV0aG9kc09wdGlvbnN9XG4gICAgICAgICAgICAgICAgICAgIC0gbmFtZSB7c3RyaW5nfSDms6jlhozov5vmnaXnmoTmj5Lku7blkI3lrZdcbiAgICAgICAgICAgICAgICAgICAgLSBtZXRob2Qge3N0cmluZ30g5omn6KGM55qE5pa55rOV5ZCN5a2XXG4gICAgICAgICAgICAgICAgICAgIC0gYXJncyB7YW55W119IOWPguaVsOaVsOe7hFxuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBxdWVyeV9jb21wb25lbnQ6IGBcbiAgICAgICAgICAgICAgICAtIHV1aWQge3N0cmluZ30g57uE5Lu255qEIHV1aWRcbiAgICBcbiAgICAgICAgICAgICAgICBAcmV0dXJucyB7T2JqZWN0fSDnu4Tku7bnmoQgZHVtcCDmlbDmja5cbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgY2hhbmdlX2dpem1vX3Rvb2w6IGBcbiAgICAgICAgICAgICAgICAtIG5hbWUge3N0cmluZ30g5bel5YW35ZCN5a2XICdwb3NpdGlvbicgfCAncm90YXRpb24nIHwgJ3NjYWxlJ3wgJ3JlY3QnXG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIGNoYW5nZV9naXptb19waXZvdDogYFxuICAgICAgICAgICAgICAgIC0gbmFtZSB7c3RyaW5nfSDlj5jmjaLln7rlh4bngrkgJ3Bpdm90JyB8ICdjZW50ZXInXG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIGNoYW5nZV9naXptb19jb29yZGluYXRlOiBgXG4gICAgICAgICAgICAgICAgLSB0eXBlIHtzdHJpbmd9IOWdkOagh+ezuyAnbG9jYWwnIHwgJ2dsb2JhbCdcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgY2hhbmdlX2lzMkQ6IGBcbiAgICAgICAgICAgICAgICAtIGlzMkQge2Jvb2xlYW59IDJELzNE6KeG5Zu+XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIHNldF9ncmlkX3Zpc2libGU6IGBcbiAgICAgICAgICAgICAgICAtIHZpc2libGUge2Jvb2xlYW59IOaYvuekui/pmpDol4/nvZHmoLxcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgcXVlcnlfaXNfZ3JpZF92aXNpYmxlOiBgXG4gICAgICAgICAgICAgICAgQHJldHVybnMge2Jvb2xlYW59IHRydWU6IHZpc2libGUsIGZhbHNlOiBpbnZpc2libGVcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgc2V0X2ljb25fZ2l6bW9fM2Q6IGBcbiAgICAgICAgICAgICAgICAtIGlzM0Qge2Jvb2xlYW59IDNELzJEIEljb25HaXptb1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBxdWVyeV9pc19pY29uX2dpem1vXzNkOiBgXG4gICAgICAgICAgICAgICAgQHJldHVybnMge2Jvb2xlYW59IHRydWU6IDNELCBmYWxzZTogMkRcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgc2V0X2ljb25fZ2l6bW9fc2l6ZTogYFxuICAgICAgICAgICAgICAgIC0gc2l6ZSB7bnVtYmVyfSBJY29uR2l6bW8g55qE5aSn5bCPXG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIHF1ZXJ5X2ljb25fZ2l6bW9fc2l6ZTogYFxuICAgICAgICAgICAgICAgIEByZXR1cm5zIHtudW1iZXJ9IEljb25HaXptbyDnmoTlpKflsI9cbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgcXVlcnlfZ2l6bW9fdG9vbF9uYW1lOiBgXG4gICAgICAgICAgICAgICAgQHJldHVybnMge3N0cmluZ30gJ3Bvc2l0aW9uJyB8ICdyb3RhdGlvbicgfCAnc2NhbGUnIHwgJ3JlY3QnXG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIHF1ZXJ5X2dpem1vX3ZpZXdfbW9kZTogYFxuICAgICAgICAgICAgICAgIEByZXR1cm4ge3N0cmluZ30gJ3ZpZXcnIHwgJ3NlbGVjdCdcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgcXVlcnlfZ2l6bW9fcGl2b3Q6IGBcbiAgICAgICAgICAgICAgICBAcmV0dXJucyB7c3RyaW5nfSAncGl2b3QnIHwgJ2NlbnRlcidcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgcXVlcnlfZ2l6bW9fY29vcmRpbmF0ZTogYFxuICAgICAgICAgICAgICAgIEByZXR1cm5zIHtzdHJpbmd9ICdsb2NhbCcgfCAnZ2xvYmFsJ1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBxdWVyeV9pczJEOiBgXG4gICAgICAgICAgICAgICAgQHJldHVybnMge2Jvb2xlYW59IHRydWU6MkQsIGZhbHNlOjNEXG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIGZvY3VzX2NhbWVyYTogYFxuICAgICAgICAgICAgICAgIC0gdXVpZHMge3N0cmluZ1tdIHwgbnVsbH0g6IqC54K5IHV1aWRcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgYWxpZ25fd2l0aF92aWV3OiBgXG4gICAgICAgICAgICAgICAgQHJldHVybnMge251bGx9XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIGFsaWduX3ZpZXdfd2l0aF9ub2RlOiBgXG4gICAgICAgICAgICAgICAgQHJldHVybnMge251bGx9XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIC8vIGJyb2FkY2FzdFxuICAgICAgICAgICAgc2NlbmVfcmVhZHk6IGBcbiAgICAgICAgICAgICAgICAtIHV1aWQge3N0cmluZ30gdXVpZCBvZiBzY2VuZVxuICAgICAgICAgICAgICAgIGAsXG5cbiAgICAgICAgICAgIGxpZ2h0X3Byb2JlX2VkaXRfbW9kZV9jaGFuZ2VkOiBgXG4gICAgICAgICAgICAgICAgLSBtb2RlIHtib29sZWFufSDliIfmjaLlkI7nmoTmjqLpkojnvJbovpHmqKHlvI9cbiAgICAgICAgICAgICAgICBgLFxuXG4gICAgICAgICAgICBsaWdodF9wcm9iZV9ib3VuZGluZ19ib3hfZWRpdF9tb2RlX2NoYW5nZWQ6IGBcbiAgICAgICAgICAgICAgICAtIG1vZGUge2Jvb2xlYW59IOWIh+aNouWQjueahOaOoumSiOe7hOS7tuWMheWbtOebkue8lui+keaooeW8j1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgIH0sXG4gICAgICAgIGV4YW1wbGU6IHtcbiAgICAgICAgICAgIC8vIG1lc3NhZ2VcbiAgICAgICAgICAgIG9wZW5fc2NlbmU6IGBcbmF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ29wZW4tc2NlbmUnLCBzY2VuZVV1aWQpO1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBzYXZlX3NjZW5lOiBgXG5hd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdzYXZlLXNjZW5lJyk7XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIHNhdmVfYXNfc2NlbmU6IGBcbmF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3NhdmUtYXMtc2NlbmUnKTtcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgY2xvc2Vfc2NlbmU6IGBcbmF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ2Nsb3NlLXNjZW5lJyk7XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIHF1ZXJ5X2lzX3JlYWR5OiBgXG5hd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1pcy1yZWFkeScpO1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBxdWVyeV9kaXJ0eTogYFxuYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktZGlydHknKTtcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgcXVlcnlfY2xhc3NlczogYFxuYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktY2xhc3NlcycpO1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBxdWVyeV9jb21wb25lbnRzOiBgXG5hd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1jb21wb25lbnRzJyk7XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIHF1ZXJ5X2NvbXBvbmVudF9oYXNfc2NyaXB0OiBgXG5hd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1jb21wb25lbnQtaGFzLXNjcmlwdCcsICdjYy5TcHJpdGUnKTtcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgcXVlcnlfbm9kZV90cmVlOiBgXG5hd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1ub2RlLXRyZWUnLCBub2RlVXVpZCk7XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIHF1ZXJ5X25vZGVfYnlfYXNzZXRfdXVpZDogYFxuYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktbm9kZXMtYnktYXNzZXQtdXVpZCcsIGFzc2V0VXVpZCk7XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIHNldF9wcm9wZXJ0eTogYFxuYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnc2V0LXByb3BlcnR5Jywge1xuICAgIHV1aWQ6IG5vZGVVdWlkLFxuICAgIHBhdGg6ICdfX2NvbXBzX18uMS5kZWZhdWx0Q2xpcCcsXG4gICAgZHVtcDoge1xuICAgICAgICB0eXBlOiAnY2MuQW5pbWF0aW9uQ2xpcCcsXG4gICAgICAgIHZhbHVlOiB7XG4gICAgICAgICAgICB1dWlkOiBhbmltQ2xpcFV1aWQsXG4gICAgICAgIH0sXG4gICAgfSxcbn0pO1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICByZXNldF9wcm9wZXJ0eTogYFxuYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncmVzZXQtcHJvcGVydHknLCB7XG4gICAgdXVpZDogbm9kZVV1aWQsXG4gICAgcGF0aDogJ3Bvc2l0aW9uJyxcbn0pO1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBtb3ZlX2FycmF5X2VsZW1lbnQ6IGBcbmF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ21vdmUtYXJyYXktZWxlbWVudCcsIHtcbiAgICB1dWlkOiBub2RlVXVpZCxcbiAgICBwYXRoOiAnX19jb21wc19fJyxcbiAgICB0YXJnZXQ6IDEsXG4gICAgb2Zmc2V0OiAtMSxcbn0pO1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICByZW1vdmVfYXJyYXlfZWxlbWVudDogYFxuYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncmVtb3ZlLWFycmF5LWVsZW1lbnQnLCB7XG4gICAgdXVpZDogbm9kZVV1aWQsXG4gICAgcGF0aDogJ19fY29tcHNfXycsXG4gICAgaW5kZXg6IDAsXG59KTtcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgY29weV9ub2RlOiBgXG5hd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdjb3B5LW5vZGUnLCB1dWlkcyk7XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIGN1dF9ub2RlOiBgXG5hd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdjdXQtbm9kZScsIHV1aWRzKTtcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgZHVwbGljYXRlX25vZGU6IGBcbmF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ2R1cGxpY2F0ZS1ub2RlJywgdXVpZHMpO1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBwYXN0ZV9ub2RlOiBgXG5hd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdwYXN0ZS1ub2RlJywge1xuICAgIHRhcmdldDogbm9kZVV1aWQsXG4gICAgdXVpZHM6IG5vZGVVdWlkcyxcbn0pO1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBzZXRfcGFyZW50OiBgXG5hd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsJ3NldC1wYXJlbnQnLCB7XG4gICAgcGFyZW50OiBub2RlVXVpZCxcbiAgICB1dWlkczogbm9kZVV1aWRzLFxufSk7XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIGNyZWF0ZV9ub2RlOiBgXG5hd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdjcmVhdGUtbm9kZScsIHtcbiAgICBuYW1lOiAnTmV3IE5vZGUnXG4gICAgcGFyZW50OiBub2RlVXVpZCxcbn0pO1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBxdWVyeV9ub2RlOiBgXG5hd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1ub2RlJywgbm9kZVV1aWQpO1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICByZXNldF9ub2RlOiBgXG5hd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdyZXNldC1ub2RlJywge1xuICAgIHV1aWQ6IG5vZGVVdWlkLFxufSk7XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIHJlc3RvcmVfcHJlZmFiOiBgXG5hd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdyZXN0b3JlLXByZWZhYicsIG5vZGVVdWlkLCBhc3NldFV1aWQpO1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICByZW1vdmVfbm9kZTogYFxuYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncmVtb3ZlLW5vZGUnLCB7IFxuICAgIHV1aWQ6IG5vZGVVdWlkXG59KTtcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgY3JlYXRlX2NvbXBvbmVudDogYFxuRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnY3JlYXRlLWNvbXBvbmVudCcsIHsgXG4gICAgdXVpZDogbm9kZVV1aWQsXG4gICAgY29tcG9uZW50OiAnY2MuU3ByaXRlJ1xufSk7XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIHJlbW92ZV9jb21wb25lbnQ6IGBcbmF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3JlbW92ZS1jb21wb25lbnQnLCB7IFxuICAgIHV1aWQ6IGNvbXBvbmVudFV1aWQsXG59KTtcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgcmVzZXRfY29tcG9uZW50OiBgXG5hd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdyZXNldC1jb21wb25lbnQnLCB7XG4gICAgdXVpZDogY29tcG9uZW50VXVpZCxcbn0pO1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBleGVjdXRlX2NvbXBvbmVudF9tZXRob2Q6IGBcbmF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ2V4ZWN1dGUtY29tcG9uZW50LW1ldGhvZCcsIHtcbiAgICB1dWlkOiBjb21wb25lbnRVdWlkLFxuICAgIG5hbWU6ICdnZXROb2lzZVByZXZpZXcnLFxuICAgIGFyZ3M6IFsxMDAsIDEwMF0sXG59KTtcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgZXhlY3V0ZV9zY2VuZV9zY3JpcHQ6IGBcbmF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ2V4ZWN1dGUtc2NlbmUtc2NyaXB0Jywge1xuICAgIG5hbWU6ICdhbmltYXRpb24tZ3JhcGgnLFxuICAgIG1ldGhvZDogJ3F1ZXJ5JyxcbiAgICBhcmdzOiBbXSxcbn0pO1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBzbmFwc2hvdDogYFxuYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnc25hcHNob3QnKTtcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgc25hcHNob3RfYWJvcnQ6IGBcbmF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3NuYXBzaG90LWFib3J0Jyk7XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIGJlZ2luX3JlY29yZGluZzogYFxuY29uc3QgdW5kb0lEID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnYmVnaW4tcmVjb3JkaW5nJywgbm9kZVV1aWQpO1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBlbmRfcmVjb3JkaW5nOiBgXG5hd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdlbmQtcmVjb3JkaW5nJywgdW5kb0lEKTtcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgY2FuY2VsX3JlY29yZGluZzogYFxuYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnY2FuY2VsLXJlY29yZGluZycsIHVuZG9JRCk7XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIHNvZnRfcmVsb2FkOiBgXG5hd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdzb2Z0LXJlbG9hZCcpO1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBxdWVyeV9jb21wb25lbnQ6IGBcbmF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3F1ZXJ5LWNvbXBvbmVudCcsIG5vZGVVdWlkKTtcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgY2hhbmdlX2dpem1vX3Rvb2w6IGBcbmF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ2NoYW5nZS1naXptby10b29sJywgJ3Bvc2l0aW9uJyk7XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIGNoYW5nZV9naXptb19waXZvdDogYFxuYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktZ2l6bW8tcGl2b3QnKTtcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgY2hhbmdlX2dpem1vX2Nvb3JkaW5hdGU6IGBcbmF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ2NoYW5nZS1naXptby1jb29yZGluYXRlJywgJ2dsb2JhbCcpO1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBjaGFuZ2VfaXMyRDogYFxuYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnY2hhbmdlLWlzMkQnLCB0cnVlKTtcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgc2V0X2dyaWRfdmlzaWJsZTogYFxuYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnc2V0LWdyaWQtdmlzaWJsZScsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgcXVlcnlfaXNfZ3JpZF92aXNpYmxlOiBgXG5hd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1pcy1ncmlkLXZpc2libGUnKTtcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgc2V0X2ljb25fZ2l6bW9fM2Q6IGBcbmF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3NldC1pY29uLWdpem1vLTNkJywgZmFsc2UpO1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBxdWVyeV9pc19pY29uX2dpem1vXzNkOiBgXG5hd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1pcy1pY29uLWdpem1vLTNkJyk7XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIHNldF9pY29uX2dpem1vX3NpemU6IGBcbmF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3NldC1pY29uLWdpem1vLXNpemUnLCA2MCk7XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIHF1ZXJ5X2ljb25fZ2l6bW9fc2l6ZTogYFxuYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktaWNvbi1naXptby1zaXplJyk7XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIHF1ZXJ5X2dpem1vX3Rvb2xfbmFtZTogYFxuYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktZ2l6bW8tdG9vbC1uYW1lJyk7XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIHF1ZXJ5X2dpem1vX3ZpZXdfbW9kZTogYFxuYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktZ2l6bW8tdmlldy1tb2RlJyk7XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIHF1ZXJ5X2dpem1vX3Bpdm90OiBgXG5hd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1naXptby1waXZvdCcpO1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBxdWVyeV9naXptb19jb29yZGluYXRlOiBgXG5hd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1naXptby1jb29yZGluYXRlJyk7XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIHF1ZXJ5X2lzMkQ6IGBcbmF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3F1ZXJ5LWlzMkQnKTtcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgZm9jdXNfY2FtZXJhOiBgXG5hd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdmb2N1cy1jYW1lcmEnLCBub2RlVXVpZHMpO1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBhbGlnbl93aXRoX3ZpZXc6IGBcbmF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ2FsaWduLXdpdGgtdmlldycpO1xuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBhbGlnbl92aWV3X3dpdGhfbm9kZTogYFxuYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnYWxpZ24td2l0aC12aWV3LW5vZGUnKTtcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgLy8gYnJvYWRjYXN0XG4gICAgICAgICAgICBzY2VuZV9yZWFkeTogYFxuRWRpdG9yLk1lc3NhZ2UuYnJvYWRjYXN0KCdzY2VuZTpyZWFkeScsIGFzc2V0VXVpZCk7XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIHNjZW5lX2Nsb3NlOiBgXG5FZGl0b3IuTWVzc2FnZS5icm9hZGNhc3QoJ3NjZW5lOmNsb3NlJyk7XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIGxpZ2h0X3Byb2JlX2VkaXRfbW9kZV9jaGFuZ2VkOiBgXG5FZGl0b3IuTWVzc2FnZS5icm9hZGNhc3QoJ3NjZW5lOmxpZ2h0LXByb2JlLWVkaXQtbW9kZS1jaGFuZ2VkJywgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIGxpZ2h0X3Byb2JlX2JvdW5kaW5nX2JveF9lZGl0X21vZGVfY2hhbmdlZDogYFxuRWRpdG9yLk1lc3NhZ2UuYnJvYWRjYXN0KCdzY2VuZTpsaWdodC1wcm9iZS1ib3VuZGluZy1ib3gtZWRpdC1tb2RlLWNoYW5nZWQnLCB0cnVlKTtcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICB9LFxuICAgIH0sXG59Il19