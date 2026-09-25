System.register("q-bundled:///fs/cocos/physics/framework/components/constraints/constraint.js", ["../../../../core/data/decorators/index.js", "../../../../../../virtual/internal%253Aconstants.js", "../../../../scene-graph/index.js", "../rigid-body.js", "../../../../core/index.js", "../../physics-selector.js", "../../physics-enum.js"], function (_export, _context) {
  "use strict";

  var ccclass, requireComponent, displayOrder, type, readOnly, serializable, tooltip, EDITOR_NOT_IN_PREVIEW, Component, RigidBody, Eventify, selector, createConstraint, EConstraintType, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _class, _class2, _descriptor, _descriptor2, _Constraint, Constraint;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      requireComponent = _coreDataDecoratorsIndexJs.requireComponent;
      displayOrder = _coreDataDecoratorsIndexJs.displayOrder;
      type = _coreDataDecoratorsIndexJs.type;
      readOnly = _coreDataDecoratorsIndexJs.readOnly;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
    }, function (_virtualInternal253AconstantsJs) {
      EDITOR_NOT_IN_PREVIEW = _virtualInternal253AconstantsJs.EDITOR_NOT_IN_PREVIEW;
    }, function (_sceneGraphIndexJs) {
      Component = _sceneGraphIndexJs.Component;
    }, function (_rigidBodyJs) {
      RigidBody = _rigidBodyJs.RigidBody;
    }, function (_coreIndexJs) {
      Eventify = _coreIndexJs.Eventify;
    }, function (_physicsSelectorJs) {
      selector = _physicsSelectorJs.selector;
      createConstraint = _physicsSelectorJs.createConstraint;
    }, function (_physicsEnumJs) {
      EConstraintType = _physicsEnumJs.EConstraintType;
    }],
    execute: function () {
      /* eslint-disable @typescript-eslint/no-namespace */
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
       * @en
       * Base class for joint constraints, which depends on rigid body components.
       * @zh
       * 关节约束的基类，它依赖于刚体组件。
       */
      _export("Constraint", Constraint = (_dec = ccclass('cc.Constraint'), _dec2 = requireComponent(RigidBody), _dec3 = type(RigidBody), _dec4 = displayOrder(-2), _dec5 = tooltip('i18n:physics3d.constraint.attachedBody'), _dec6 = type(RigidBody), _dec7 = displayOrder(-1), _dec8 = tooltip('i18n:physics3d.constraint.connectedBody'), _dec9 = displayOrder(0), _dec0 = tooltip('i18n:physics3d.constraint.enableCollision'), _dec1 = type(RigidBody), _dec(_class = _dec2(_class = (_class2 = (_Constraint = class Constraint extends Eventify(Component) {
        /**
         * @en
         * Gets the collider attached rigid-body.
         * @zh
         * 获取碰撞器所绑定的刚体组件。
         */
        get attachedBody() {
          return this.getComponent(RigidBody);
        }

        /**
         * @en
         * Get or set the jointed rigid body, null means link to a static rigid body at the world origin.
         * @zh
         * 获取或设置关节连接的刚体，为空时表示链接到位于世界原点的静态刚体。
         */
        get connectedBody() {
          return this._connectedBody;
        }
        set connectedBody(v) {
          this._connectedBody = v;
          if (!EDITOR_NOT_IN_PREVIEW) {
            if (this._constraint) this._constraint.setConnectedBody(v);
          }
        }

        /**
         * @en
         * Get or set whether collision is turned on between two rigid bodies connected by a joint.
         * @zh
         * 获取或设置关节连接的两刚体之间是否开启碰撞。
         */
        get enableCollision() {
          return this._enableCollision;
        }
        set enableCollision(v) {
          this._enableCollision = v;
          if (!EDITOR_NOT_IN_PREVIEW) {
            if (this._constraint) this._constraint.setEnableCollision(v);
          }
        }

        /**
         * @en
         * Gets the type of this joint.
         * @zh
         * 获取此关节的类型。
         */

        constructor(type) {
          super();
          this.TYPE = void 0;
          /// PROTECTED PROPERTY ///
          _initializerDefineProperty(this, "_enableCollision", _descriptor, this);
          _initializerDefineProperty(this, "_connectedBody", _descriptor2, this);
          this._constraint = null;
          this.TYPE = type;
        }

        /// COMPONENT LIFECYCLE ///

        onLoad() {
          if (!selector.runInEditor) return;
          this._constraint = createConstraint(this.TYPE);
          this._constraint.initialize(this);
        }
        onEnable() {
          if (this._constraint) {
            this._constraint.onEnable();
          }
        }
        onDisable() {
          if (this._constraint) {
            this._constraint.onDisable();
          }
        }
        onDestroy() {
          if (this._constraint) {
            this._constraint.onDestroy();
          }
        }
      }, _Constraint.Type = EConstraintType, _Constraint), _applyDecoratedDescriptor(_class2.prototype, "attachedBody", [_dec3, readOnly, _dec4, _dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "attachedBody"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "connectedBody", [_dec6, _dec7, _dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "connectedBody"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "enableCollision", [_dec9, _dec0], Object.getOwnPropertyDescriptor(_class2.prototype, "enableCollision"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_enableCollision", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_connectedBody", [_dec1], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _class2)) || _class) || _class));
    }
  };
});