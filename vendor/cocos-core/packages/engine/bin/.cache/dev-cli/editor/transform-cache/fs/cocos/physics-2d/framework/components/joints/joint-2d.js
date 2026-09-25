System.register("q-bundled:///fs/cocos/physics-2d/framework/components/joints/joint-2d.js", ["../../../../../../virtual/internal%253Aconstants.js", "../../../../core/index.js", "../rigid-body-2d.js", "../../physics-types.js", "../../physics-selector.js", "../../../../scene-graph/index.js"], function (_export, _context) {
  "use strict";

  var EDITOR_NOT_IN_PREVIEW, Vec2, _decorator, tooltip, serializable, RigidBody2D, EJoint2DType, createJoint, Component, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, ccclass, type, Joint2D;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      EDITOR_NOT_IN_PREVIEW = _virtualInternal253AconstantsJs.EDITOR_NOT_IN_PREVIEW;
    }, function (_coreIndexJs) {
      Vec2 = _coreIndexJs.Vec2;
      _decorator = _coreIndexJs._decorator;
      tooltip = _coreIndexJs.tooltip;
      serializable = _coreIndexJs.serializable;
    }, function (_rigidBody2dJs) {
      RigidBody2D = _rigidBody2dJs.RigidBody2D;
    }, function (_physicsTypesJs) {
      EJoint2DType = _physicsTypesJs.EJoint2DType;
    }, function (_physicsSelectorJs) {
      createJoint = _physicsSelectorJs.createJoint;
    }, function (_sceneGraphIndexJs) {
      Component = _sceneGraphIndexJs.Component;
    }],
    execute: function () {
      /*
       Copyright (c) 2022-2023 Xiamen Yaji Software Co., Ltd.
      
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
      ({
        ccclass,
        type
      } = _decorator);
      _export("Joint2D", Joint2D = (_dec = ccclass('cc.Joint2D'), _dec2 = tooltip('i18n:physics2d.joint.anchor'), _dec3 = tooltip('i18n:physics2d.joint.connectedAnchor'), _dec4 = tooltip('i18n:physics2d.joint.collideConnected'), _dec5 = type(RigidBody2D), _dec6 = tooltip('i18n:physics2d.joint.connectedBody'), _dec(_class = (_class2 = class Joint2D extends Component {
        constructor(...args) {
          super(...args);
          /**
           * @en
           * The position of Joint2D in the attached rigid body's local space.
           * @zh
           * 在自身刚体的本地空间中，Joint2D的位置。
           */
          _initializerDefineProperty(this, "anchor", _descriptor, this);
          /**
           * @en
           * The position of Joint2D in the connected rigid body's local space.
           * @zh
           * 在连接刚体的本地空间中，Joint2D的位置。
           */
          _initializerDefineProperty(this, "connectedAnchor", _descriptor2, this);
          /**
           * @en
           * whether collision is turned on between two rigid bodies connected by a joint.
           * @zh
           * 关节连接的两刚体之间是否开启碰撞。
           */
          _initializerDefineProperty(this, "collideConnected", _descriptor3, this);
          /**
           * @en
           * The jointed rigid body, null means link to a static rigid body at the world origin.
           * @zh
           * 关节连接的刚体，为空时表示连接到位于世界原点的静态刚体。
           */
          _initializerDefineProperty(this, "connectedBody", _descriptor4, this);
          /**
           * @en
           * the Joint2D attached rigid-body.
           * @zh
           * 关节所绑定的刚体组件。
           */
          this._body = null;
          this._joint = null;
          /**
           * @en
           * the type of this joint.
           * @zh
           * 此关节的类型。
           */
          this.TYPE = EJoint2DType.None;
        }
        get body() {
          return this._body;
        }
        get impl() {
          return this._joint;
        }
        onLoad() {
          if (!EDITOR_NOT_IN_PREVIEW) {
            this._joint = createJoint(this.TYPE);
            this._joint.initialize(this);
            this._body = this.getComponent(RigidBody2D);
          }
        }
        onEnable() {
          if (this._joint && this._joint.onEnable) {
            this._joint.onEnable();
          }
        }
        onDisable() {
          if (this._joint && this._joint.onDisable) {
            this._joint.onDisable();
          }
        }
        start() {
          if (this._joint && this._joint.start) {
            this._joint.start();
          }
        }
        onDestroy() {
          if (this._joint && this._joint.onDestroy) {
            this._joint.onDestroy();
          }
        }

        /**
         * @en
         * If the physics engine is box2d, need to call this function to apply current changes to joint, this will regenerate inner box2d joint.
         * @zh
         * 如果物理引擎是 box2d, 需要调用此函数来应用当前 joint 中的修改。
         */
        apply() {
          if (this._joint && this._joint.apply) {
            this._joint.apply();
          }
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "anchor", [serializable, _dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec2();
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "connectedAnchor", [serializable, _dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec2();
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "collideConnected", [serializable, _dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "connectedBody", [_dec5, serializable, _dec6], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _class2)) || _class));
    }
  };
});