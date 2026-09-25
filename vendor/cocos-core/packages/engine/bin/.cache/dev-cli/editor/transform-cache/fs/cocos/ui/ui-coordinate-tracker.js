System.register("q-bundled:///fs/cocos/ui/ui-coordinate-tracker.js", ["../core/data/decorators/index.js", "../scene-graph/component.js", "../scene-graph/component-event-handler.js", "../scene-graph/node.js", "../misc/camera-component.js", "../core/math/index.js"], function (_export, _context) {
  "use strict";

  var ccclass, help, menu, executionOrder, tooltip, type, serializable, Component, EventHandler, Node, Camera, v3, Vec3, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _dec10, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, UICoordinateTracker;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      help = _coreDataDecoratorsIndexJs.help;
      menu = _coreDataDecoratorsIndexJs.menu;
      executionOrder = _coreDataDecoratorsIndexJs.executionOrder;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
      type = _coreDataDecoratorsIndexJs.type;
      serializable = _coreDataDecoratorsIndexJs.serializable;
    }, function (_sceneGraphComponentJs) {
      Component = _sceneGraphComponentJs.Component;
    }, function (_sceneGraphComponentEventHandlerJs) {
      EventHandler = _sceneGraphComponentEventHandlerJs.EventHandler;
    }, function (_sceneGraphNodeJs) {
      Node = _sceneGraphNodeJs.Node;
    }, function (_miscCameraComponentJs) {
      Camera = _miscCameraComponentJs.Camera;
    }, function (_coreMathIndexJs) {
      v3 = _coreMathIndexJs.v3;
      Vec3 = _coreMathIndexJs.Vec3;
    }],
    execute: function () {
      /*
       Copyright (c) 2013-2016 Chukong Technologies Inc.
       Copyright (c) 2017-2023 Xiamen Yaji Software Co., Ltd.
      
       http://www.cocos.com
      
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
       * @en The component that converts 3D node coordinates to UI node coordinates.
       * It mainly provides the converted world coordinates after mapping and the perspective ratio of the simulated perspective camera.
       * @zh 3D 节点坐标转换到 UI 节点坐标组件
       * 主要提供映射后的转换世界坐标以及模拟透视相机远近比。
       */
      _export("UICoordinateTracker", UICoordinateTracker = (_dec = ccclass('cc.UICoordinateTracker'), _dec2 = help('i18n:cc.UICoordinateTracker'), _dec3 = menu('UI/UICoordinateTracker'), _dec4 = executionOrder(110), _dec5 = type(Node), _dec6 = tooltip('i18n:UICoordinateTracker.target'), _dec7 = type(Camera), _dec8 = tooltip('i18n:UICoordinateTracker.camera'), _dec9 = tooltip('i18n:UICoordinateTracker.use_scale'), _dec0 = tooltip('i18n:UICoordinateTracker.distance'), _dec1 = type([EventHandler]), _dec10 = tooltip('i18n:UICoordinateTracker.sync_events'), _dec(_class = _dec2(_class = _dec3(_class = _dec4(_class = (_class2 = class UICoordinateTracker extends Component {
        /**
         * @en
         * Target node.
         *
         * @zh
         * 目标对象。
         */
        get target() {
          return this._target;
        }
        set target(value) {
          if (this._target === value) {
            return;
          }
          this._target = value;
          this._checkCanMove();
        }

        /**
         * @en
         * The 3D camera representing the original coordinate system.
         *
         * @zh
         * 照射相机。
         */
        get camera() {
          return this._camera;
        }
        set camera(value) {
          if (this._camera === value) {
            return;
          }
          this._camera = value;
          this._checkCanMove();
        }

        /**
         * @en
         * Whether to scale the converted 2d node's size according to the distance between the camera and the 3d node.
         *
         * @zh
         * 是否是缩放映射。
         */
        get useScale() {
          return this._useScale;
        }
        set useScale(value) {
          if (this._useScale === value) {
            return;
          }
          this._useScale = value;
        }

        /**
         * @en
         * The distance from the camera for displaying the 2d node in normal size.
         *
         * @zh
         * 距相机多少距离为正常显示计算大小。
         */
        get distance() {
          return this._distance;
        }
        set distance(value) {
          if (this._distance === value) {
            return;
          }
          this._distance = value;
        }

        /**
         * @en
         * Event callback after coordinates synchronization.
         * The first parameter of the callback is the mapped local coordinate in UI camera.
         * The second parameter is the distance scale of the 3d node from the 3d camera viewport.
         *
         * @zh
         * 映射数据事件。回调的第一个参数是映射后的本地坐标，第二个是距相机距离比。
         */

        constructor() {
          super();
          _initializerDefineProperty(this, "syncEvents", _descriptor, this);
          _initializerDefineProperty(this, "_target", _descriptor2, this);
          _initializerDefineProperty(this, "_camera", _descriptor3, this);
          _initializerDefineProperty(this, "_useScale", _descriptor4, this);
          _initializerDefineProperty(this, "_distance", _descriptor5, this);
          this._transformPos = v3();
          this._viewPos = v3();
          this._canMove = true;
          this._lastWPos = v3();
          this._lastCameraPos = v3();
        }
        onEnable() {
          this._checkCanMove();
        }
        update() {
          const wPos = this.node.worldPosition;
          const camera = this._camera;
          if (!this._canMove || !camera || !camera.camera || this._lastWPos.equals(wPos) && this._lastCameraPos.equals(camera.node.worldPosition)) {
            return;
          }
          this._lastWPos.set(wPos);
          this._lastCameraPos.set(camera.node.worldPosition);
          // [HACK]
          camera.camera.update();
          camera.convertToUINode(wPos, this._target, this._transformPos);
          if (this._useScale) {
            Vec3.transformMat4(this._viewPos, this.node.worldPosition, camera.camera.matView);
          }
          if (this.syncEvents.length > 0) {
            const data = this._distance / Math.abs(this._viewPos.z);
            EventHandler.emitEvents(this.syncEvents, this._transformPos, data);
          }
        }
        _checkCanMove() {
          this._canMove = !!(this._camera && this._target);
        }
      }, _applyDecoratedDescriptor(_class2.prototype, "target", [_dec5, _dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "target"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "camera", [_dec7, _dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "camera"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "useScale", [_dec9], Object.getOwnPropertyDescriptor(_class2.prototype, "useScale"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "distance", [_dec0], Object.getOwnPropertyDescriptor(_class2.prototype, "distance"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "syncEvents", [_dec1, serializable, _dec10], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_target", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_camera", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "_useScale", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "_distance", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1;
        }
      }), _class2)) || _class) || _class) || _class) || _class));
    }
  };
});