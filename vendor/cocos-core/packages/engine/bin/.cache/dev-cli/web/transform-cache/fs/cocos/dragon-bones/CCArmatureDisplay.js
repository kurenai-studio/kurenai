System.register("q-bundled:///fs/cocos/dragon-bones/CCArmatureDisplay.js", ["@cocos/dragonbones-js", "../core/index.js"], function (_export, _context) {
  "use strict";

  var DisplayData, Vec3, EventTarget, _decorator, warn, _dec, _class, ccclass, CCArmatureDisplay;
  return {
    setters: [function (_cocosDragonbonesJs) {
      DisplayData = _cocosDragonbonesJs.DisplayData;
    }, function (_coreIndexJs) {
      Vec3 = _coreIndexJs.Vec3;
      EventTarget = _coreIndexJs.EventTarget;
      _decorator = _coreIndexJs._decorator;
      warn = _coreIndexJs.warn;
    }],
    execute: function () {
      /* eslint-disable @typescript-eslint/no-unsafe-return */
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
      // eslint-disable-next-line import/named
      ({
        ccclass
      } = _decorator);
      /**
       * @en CCArmatureDisplay contains function about data showing and sending events.
       * @zh CCArmatureDisplay 封装了数据显示和事件派发的功能。
       */
      _export("CCArmatureDisplay", CCArmatureDisplay = (_dec = ccclass('dragonBones.CCArmatureDisplay'), _dec(_class = class CCArmatureDisplay extends DisplayData {
        /**
         * @en Return this.
         * @zh 返回自身。
         */
        get node() {
          return this;
        }
        /**
         * @deprecated This variable will be removed in the future.
         */

        constructor() {
          super();
          this.shouldAdvanced = false;
          /**
           * @en The node contains ArmatureDisplay component.
           * @zh ArmatureDisplay 组件所在的 node。
           */
          this._ccNode = null;
          /**
           * @en ArmatureDisplay component.
           * @zh ArmatureDisplay 组件。
           */
          this._ccComponent = null;
          /**
           * @en EventTarget is an object to which an event is dispatched when something has occurred.
           * @zh 事件目标是具有注册监听器、派发事件能力的对象。
           */
          this._eventTarget = void 0;
          /**
           * @en The core Armature object.
           * @zh 核心骨架对象。
           */
          this._armature = null;
          this._eventTarget = new EventTarget();
        }
        /**
         * @en The funciton is empty and always return false.
         * @zh 方法未实现总返回 false。
         */
        hasEvent(type) {
          warn('Method not implemented.');
          return false;
        }
        /**
         * @en The funciton has no realization.
         * @zh 方法未实现。
         */
        addEvent(type, listener, thisObject) {
          warn('Method not implemented.');
        }
        /**
         * @en The funciton has no realization.
         * @zh 方法未实现。
         */
        removeEvent(type, listener, thisObject) {
          warn('Method not implemented.');
        }
        /**
         * @en Sets EventTarget object.
         * @zh 设置事件目标。
         */
        setEventTarget(eventTarget) {
          this._eventTarget = eventTarget;
        }
        /**
         * @en Gets the root display object.
         * @zh 获取顶层的显示容器实例。
         */
        getRootDisplay() {
          let parentSlot = this._armature._parent;
          if (!parentSlot) {
            return this;
          }
          let slot;
          while (parentSlot) {
            slot = parentSlot;
            parentSlot = parentSlot._armature._parent;
          }
          return slot._armature.display;
        }
        /**
         * @en Convert pos to parent slot coordination.
         * @zh 将坐标转换到父插槽的坐标系下。
         */
        convertToRootSpace(pos) {
          const slot = this._armature._parent;
          if (!slot) {
            return pos;
          }
          slot.updateWorldMatrix();
          const worldMatrix = slot._worldMatrix;
          const newPos = new Vec3(0, 0);
          newPos.x = pos.x * worldMatrix.m00 + pos.y * worldMatrix.m04 + worldMatrix.m12;
          newPos.y = pos.x * worldMatrix.m01 + pos.y * worldMatrix.m05 + worldMatrix.m13;
          return newPos;
        }
        /**
         * @en Convert pos to world coordination.
         * @zh 将坐标转换到世界坐标系下。
         */
        convertToWorldSpace(point) {
          var _ccNode$_getUITransfo;
          const newPos = this.convertToRootSpace(point);
          const ccNode = this.getRootNode();
          return ccNode == null || (_ccNode$_getUITransfo = ccNode._getUITransformComp()) == null ? void 0 : _ccNode$_getUITransfo.convertToWorldSpaceAR(newPos);
        }
        /**
         * @en Get the node of root ArmatureDisplay component in.
         * @zh 获取顶层 ArmatureDisplay 组件所在的 node。
         */
        getRootNode() {
          const rootDisplay = this.getRootDisplay();
          return rootDisplay && rootDisplay._ccNode;
        }

        /**
         * @en Initialize _armature at start.
         * @zh 初始时设置骨架。
         */
        // dragonbones api
        dbInit(armature) {
          this._armature = armature;
        }
        /**
         * @en Clears Armature object.
         * @zh 清除骨架对象。
         */
        dbClear() {
          this._armature = null;
        }
        /**
         * @en Trigger ArmatureDisplay component to update render data.
         * @zh 触发 ArmatureDisplay 组件更新渲染数据。
         */
        dbUpdate() {
          if (this._ccComponent) {
            this._ccComponent._markForUpdateRenderData();
          }
        }
        /**
         * @engineInternal Since v3.7.2.
         * @deprecated This variable will be removed in the future.
         */
        advanceTimeBySelf(on) {
          this.shouldAdvanced = !!on;
        }
        hasDBEventListener(type) {
          return this._eventTarget.hasEventListener(type);
        }
        addDBEventListener(type, listener, target) {
          this._eventTarget.on(type, listener, target);
        }
        removeDBEventListener(type, listener, target) {
          this._eventTarget.off(type, listener, target);
        }
        dispatchDBEvent(type, eventObject) {
          this._eventTarget.emit(type, eventObject);
        }
      }) || _class));
    }
  };
});