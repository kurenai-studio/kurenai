System.register("q-bundled:///fs/cocos/input/types/event-enum.js", ["../../core/index.js"], function (_export, _context) {
  "use strict";

  var cclegacy, SystemEventType, InputEventType;
  return {
    setters: [function (_coreIndexJs) {
      cclegacy = _coreIndexJs.cclegacy;
    }],
    execute: function () {
      /*
       Copyright (c) 2020-2023 Xiamen Yaji Software Co., Ltd.
      
       https://www.cocos.com/
      
       Permission is hereby granted, free of charge, to any person obtaining a copy
       of this software and associated documentation files (the "Software"), to deal
       in the Software without restriction, including without limitation the rights to
       use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
       of the Software, and to permit persons to whom the Software is furnished to do so,
       subject to the following conditions:
      
       The above copyright notice and this permission notice shall be included in
       all copies or substantial portions of the Software.
      
       THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
       IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
       FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
       AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
       LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
       OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
       THE SOFTWARE.
      */
      /**
       * @en The event type supported by SystemEvent and Node events
       * @zh SystemEvent 支持的事件类型以及节点事件类型
       *
       * @deprecated since v3.3.0, please use Input.EventType instead
       */
      _export("SystemEventType", SystemEventType = /*#__PURE__*/function (SystemEventType) {
        /**
         * @en
         * The event type for touch start event
         *
         * @zh
         * 手指开始触摸事件。
         */
        SystemEventType["TOUCH_START"] = "touch-start";
        /**
         * @en
         * The event type for touch move event
         *
         * @zh
         * 当手指在屏幕上移动时。
         */
        SystemEventType["TOUCH_MOVE"] = "touch-move";
        /**
         * @en
         * The event type for touch end event
         *
         * @zh
         * 手指结束触摸事件。
         */
        SystemEventType["TOUCH_END"] = "touch-end";
        /**
         * @en
         * The event type for touch end event
         *
         * @zh
         * 当手指在目标节点区域外离开屏幕时。
         */
        SystemEventType["TOUCH_CANCEL"] = "touch-cancel";
        /**
         * @en
         * The event type for mouse down events
         *
         * @zh
         * 当鼠标按下时触发一次。
         */
        SystemEventType["MOUSE_DOWN"] = "mouse-down";
        /**
         * @en
         * The event type for mouse move events
         *
         * @zh
         * 当鼠标在目标节点在目标节点区域中移动时，不论是否按下。
         */
        SystemEventType["MOUSE_MOVE"] = "mouse-move";
        /**
         * @en
         * The event type for mouse up events
         *
         * @zh
         * 当鼠标从按下状态松开时触发一次。
         */
        SystemEventType["MOUSE_UP"] = "mouse-up";
        /**
         * @en
         * The event type for mouse wheel events
         *
         * @zh 当滚动鼠标滚轮或操作其它类似输入设备时会触发滚轮事件。
         */
        SystemEventType["MOUSE_WHEEL"] = "mouse-wheel";
        /**
         * @en
         * The event type for mouse leave target events
         *
         * @zh
         * 当鼠标移入目标节点区域时，不论是否按下.
         *
         * @deprecated since v3.3, please use Node.EventType.MOUSE_ENTER instead.
         */
        SystemEventType["MOUSE_ENTER"] = "mouse-enter";
        /**
         * @en
         * The event type for mouse leave target events
         *
         * @zh
         * 当鼠标移出目标节点区域时，不论是否按下。
         *
         * @deprecated since v3.3, please use Node.EventType.MOUSE_LEAVE instead.
         */
        SystemEventType["MOUSE_LEAVE"] = "mouse-leave";
        /**
         * @en The event type for the key down event, the event will be continuously dispatched in the key pressed state
         * @zh 当按下按键时触发的事件, 该事件在按下状态会持续派发
         */
        SystemEventType["KEY_DOWN"] = "keydown";
        /**
         * @en The event type for the key up event
         * @zh 当松开按键时触发的事件
         */
        SystemEventType["KEY_UP"] = "keyup";
        /**
         * @en
         * The event type for the devicemotion event
         *
         * @zh
         * 重力感应
         */
        SystemEventType["DEVICEMOTION"] = "devicemotion";
        /**
         * @en
         * The event type for position, rotation, scale changed.Use the type parameter as [[Node.TransformBit]] to check which part is changed
         *
         * @zh
         * 节点改变位置、旋转或缩放事件。如果具体需要判断是哪一个事件，可通过判断回调的第一个参数类型是 [[Node.TransformBit]] 中的哪一个来获取
         * @example
         * ```
         * this.node.on(Node.EventType.TRANSFORM_CHANGED, (type)=>{
         *  if (type & Node.TransformBit.POSITION) {
         *       //...
         *   }
         * }, this);
         * ```
         *
         * @deprecated since v3.3, please use Node.EventType.TRANSFORM_CHANGED instead
         */
        SystemEventType["TRANSFORM_CHANGED"] = "transform-changed";
        /**
         * @en The event type for notifying the host scene has been changed for a persist node.
         * @zh 当场景常驻节点的场景发生改变时触发的事件，一般在切换场景过程中触发。
         *
         * @deprecated since v3.3, please use Node.EventType.SCENE_CHANGED_FOR_PERSISTS instead
         */
        SystemEventType["SCENE_CHANGED_FOR_PERSISTS"] = "scene-changed-for-persists";
        /**
         * @en
         * The event type for size change events.
         * Performance note, this event will be triggered every time corresponding properties being changed,
         * if the event callback have heavy logic it may have great performance impact, try to avoid such scenario.
         *
         * @zh
         * 当节点尺寸改变时触发的事件。
         * 性能警告：这个事件会在每次对应的属性被修改时触发，如果事件回调损耗较高，有可能对性能有很大的负面影响，请尽量避免这种情况。
         *
         * @deprecated since v3.3, please use Node.EventType.SIZE_CHANGED instead
         */
        SystemEventType["SIZE_CHANGED"] = "size-changed";
        /**
         * @en
         * The event type for anchor point change events.
         * Performance note, this event will be triggered every time corresponding properties being changed,
         * if the event callback have heavy logic it may have great performance impact, try to avoid such scenario.
         *
         * @zh
         * 当节点的 UITransform 锚点改变时触发的事件。
         * 性能警告：这个事件会在每次对应的属性被修改时触发，如果事件回调损耗较高，有可能对性能有很大的负面影响，请尽量避免这种情况。
         *
         * @deprecated since v3.3, please use Node.EventType.ANCHOR_CHANGED instead
         */
        SystemEventType["ANCHOR_CHANGED"] = "anchor-changed";
        /**
         * @en
         * The event type for color change events.
         * Performance note, this event will be triggered every time corresponding properties being changed,
         * if the event callback have heavy logic it may have great performance impact, try to avoid such scenario.
         *
         * @zh
         * 当节点的 UI 渲染组件颜色属性改变时触发的事件。
         * 性能警告：这个事件会在每次对应的属性被修改时触发，如果事件回调损耗较高，有可能对性能有很大的负面影响，请尽量避免这种情况。
         *
         * @deprecated since v3.3, please use Node.EventType.COLOR_CHANGED instead
         */
        SystemEventType["COLOR_CHANGED"] = "color-changed";
        /**
         * @en
         * The event type for adding a new child node to the target node.
         *
         * @zh
         * 给目标节点添加子节点时触发的事件。
         *
         * @deprecated since v3.3, please use Node.EventType.CHILD_ADDED instead
         */
        SystemEventType["CHILD_ADDED"] = "child-added";
        /**
         * @en
         * The event type for removing a child node from the target node.
         *
         * @zh
         * 给目标节点移除子节点时触发的事件。
         *
         * @deprecated since v3.3, please use Node.EventType.CHILD_REMOVED instead
         */
        SystemEventType["CHILD_REMOVED"] = "child-removed";
        /**
         * @en The event type for changing the parent of the target node
         * @zh 目标节点的父节点改变时触发的事件。
         *
         * @deprecated since v3.3, please use Node.EventType.PARENT_CHANGED instead
         */
        SystemEventType["PARENT_CHANGED"] = "parent-changed";
        /**
         * @en The event type for destroying the target node
         * @zh 目标节点被销毁时触发的事件。
         *
         * @deprecated since v3.3, please use Node.EventType.NODE_DESTROYED instead
         */
        SystemEventType["NODE_DESTROYED"] = "node-destroyed";
        /**
         * @en The event type for node layer change events.
         * @zh 节点 layer 改变时触发的事件。
         *
         * @deprecated since v3.3, please use Node.EventType.LAYER_CHANGED instead
         */
        SystemEventType["LAYER_CHANGED"] = "layer-changed";
        /**
         * @en The event type for node's sibling order changed.
         * @zh 当节点在兄弟节点中的顺序发生变化时触发的事件。
         *
         * @deprecated since v3.3, please use Node.EventType.CHILDREN_ORDER_CHANGED instead
         */
        SystemEventType["SIBLING_ORDER_CHANGED"] = "sibling-order-changed";
        return SystemEventType;
      }({}));
      /**
       * @en The input event type
       * @zh 输入事件类型
       */
      _export("InputEventType", InputEventType = /*#__PURE__*/function (InputEventType) {
        /**
         * @en
         * The event type for touch start event
         *
         * @zh
         * 手指开始触摸事件。
         */
        InputEventType["TOUCH_START"] = "touch-start";
        /**
         * @en
         * The event type for touch move event
         *
         * @zh
         * 当手指在屏幕上移动时。
         */
        InputEventType["TOUCH_MOVE"] = "touch-move";
        /**
         * @en
         * The event type for touch end event
         *
         * @zh
         * 手指结束触摸事件。
         */
        InputEventType["TOUCH_END"] = "touch-end";
        /**
         * @en
         * The event type for touch end event
         *
         * @zh
         * 当手指在目标节点区域外离开屏幕时。
         */
        InputEventType["TOUCH_CANCEL"] = "touch-cancel";
        /**
         * @en
         * The event type for mouse down events
         *
         * @zh
         * 当鼠标按下时触发一次。
         */
        InputEventType["MOUSE_DOWN"] = "mouse-down";
        /**
         * @en
         * The event type for mouse move events
         *
         * @zh
         * 当鼠标在目标节点在目标节点区域中移动时，不论是否按下。
         */
        InputEventType["MOUSE_MOVE"] = "mouse-move";
        /**
         * @en
         * The event type for mouse up events
         *
         * @zh
         * 当鼠标从按下状态松开时触发一次。
         */
        InputEventType["MOUSE_UP"] = "mouse-up";
        /**
         * @en The event type indicates mouse leaves the window or canvas. Only Windows, macOS or web PC can
         * trigger this event.
         * @zh 当鼠标离开窗口或者 canvas 时发出该消息。只有 Windows、macOS 或者 PC web 会触发该事件。
         */
        InputEventType["MOUSE_LEAVE"] = "mouse-leave-window";
        /**
         * @en The event type indicates mouse enters the window or canvas. Only Windows, macOS or web PC can
         * trigger this event.
         * @zh 当鼠标进入窗口或者 canvas 时发出该消息。只有 Windows、macOS 或者 PC web 会触发该事件。
         */
        InputEventType["MOUSE_ENTER"] = "mouse-enter-window";
        /**
         * @en
         * The event type for mouse wheel events
         *
         * @zh 手指开始触摸事件
         */
        InputEventType["MOUSE_WHEEL"] = "mouse-wheel";
        /**
         * @en The event type for the key down event
         * @zh 当按下按键时触发的事件
         */
        InputEventType["KEY_DOWN"] = "keydown";
        /**
         * @en The event type for the key pressing event, the event will be continuously dispatched in the key pressed state
         * @zh 当按着按键时触发的事件, 该事件在按下状态会持续派发
         */
        InputEventType["KEY_PRESSING"] = "key-pressing";
        /**
         * @en The event type for the key up event
         * @zh 当松开按键时触发的事件
         */
        InputEventType["KEY_UP"] = "keyup";
        /**
         * @en
         * The event type for the devicemotion event
         *
         * @zh
         * 重力感应
         */
        InputEventType["DEVICEMOTION"] = "devicemotion";
        /**
         * @en The event type for gamepad input
         * @zh 手柄输入事件
         */
        InputEventType["GAMEPAD_INPUT"] = "gamepad-input";
        /**
         * @en The event type for gamepad device change, including gamepad connecting and disconnecting
         * @zh 手柄设备改变时触发的事件，包括手柄连接，手柄断开连接
         */
        InputEventType["GAMEPAD_CHANGE"] = "gamepad-change";
        /**
         * @en The event type for 6DOF handle input
         * @zh 6DOF手柄输入事件
         */
        InputEventType["HANDLE_INPUT"] = "handle-input";
        /**
         * @en The event type for handle pose input
         * @zh 手柄姿态输入事件
         */
        InputEventType["HANDLE_POSE_INPUT"] = "handle-pose-input";
        /**
         * @en The event type for hmd pose input
         * @zh 头戴显示器姿态输入事件
         */
        InputEventType["HMD_POSE_INPUT"] = "hmd-pose-input";
        /**
         * @en The event type for handheld pose input
         * @zh 手持设备相机姿态输入事件
         */
        InputEventType["HANDHELD_POSE_INPUT"] = "handheld-pose-input";
        return InputEventType;
      }({}));
      cclegacy.SystemEventType = SystemEventType;
    }
  };
});