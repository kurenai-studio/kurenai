System.register("q-bundled:///fs/cocos/physics/framework/components/constant-force.js", ["../../../core/data/decorators/index.js", "../../../../../virtual/internal%253Aconstants.js", "../../../scene-graph/component.js", "./rigid-body.js", "../../../core/index.js"], function (_export, _context) {
  "use strict";

  var ccclass, help, executeInEditMode, menu, requireComponent, disallowMultiple, tooltip, displayOrder, serializable, EDITOR_NOT_IN_PREVIEW, Component, RigidBody, Vec3, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _dec10, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, ConstantForce;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      help = _coreDataDecoratorsIndexJs.help;
      executeInEditMode = _coreDataDecoratorsIndexJs.executeInEditMode;
      menu = _coreDataDecoratorsIndexJs.menu;
      requireComponent = _coreDataDecoratorsIndexJs.requireComponent;
      disallowMultiple = _coreDataDecoratorsIndexJs.disallowMultiple;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
      displayOrder = _coreDataDecoratorsIndexJs.displayOrder;
      serializable = _coreDataDecoratorsIndexJs.serializable;
    }, function (_virtualInternal253AconstantsJs) {
      EDITOR_NOT_IN_PREVIEW = _virtualInternal253AconstantsJs.EDITOR_NOT_IN_PREVIEW;
    }, function (_sceneGraphComponentJs) {
      Component = _sceneGraphComponentJs.Component;
    }, function (_rigidBodyJs) {
      RigidBody = _rigidBodyJs.RigidBody;
    }, function (_coreIndexJs) {
      Vec3 = _coreIndexJs.Vec3;
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
       * @en
       * A tool component to help apply force to the rigid body at each frame.
       * @zh
       * 在每帧对一个刚体施加持续的力，依赖 RigidBody 组件。
       */
      _export("ConstantForce", ConstantForce = (_dec = ccclass('cc.ConstantForce'), _dec2 = help('i18n:cc.ConstantForce'), _dec3 = requireComponent(RigidBody), _dec4 = menu('Physics/ConstantForce'), _dec5 = displayOrder(0), _dec6 = tooltip('i18n:physics3d.constant_force.force'), _dec7 = displayOrder(1), _dec8 = tooltip('i18n:physics3d.constant_force.localForce'), _dec9 = displayOrder(2), _dec0 = tooltip('i18n:physics3d.constant_force.torque'), _dec1 = displayOrder(3), _dec10 = tooltip('i18n:physics3d.constant_force.localTorque'), _dec(_class = _dec2(_class = _dec3(_class = _dec4(_class = disallowMultiple(_class = executeInEditMode(_class = (_class2 = class ConstantForce extends Component {
        constructor(...args) {
          super(...args);
          this._rigidBody = null;
          _initializerDefineProperty(this, "_force", _descriptor, this);
          _initializerDefineProperty(this, "_localForce", _descriptor2, this);
          _initializerDefineProperty(this, "_torque", _descriptor3, this);
          _initializerDefineProperty(this, "_localTorque", _descriptor4, this);
          this._mask = 0;
        }
        /**
         * @en
         * Gets or sets forces in world coordinates.
         * @zh
         * 获取或设置世界坐标系下的力。
         */
        get force() {
          return this._force;
        }
        set force(value) {
          Vec3.copy(this._force, value);
          this._maskUpdate(this._force, 1);
        }

        /**
         * @en
         * Gets or sets the forces in the local coordinate system.
         * @zh
         * 获取或设置本地坐标系下的力。
         */
        get localForce() {
          return this._localForce;
        }
        set localForce(value) {
          Vec3.copy(this._localForce, value);
          this._maskUpdate(this.localForce, 2);
        }

        /**
         * @en
         * Gets or sets the torsional force in world coordinates.
         * @zh
         * 获取或设置世界坐标系下的扭转力。
         */
        get torque() {
          return this._torque;
        }
        set torque(value) {
          Vec3.copy(this._torque, value);
          this._maskUpdate(this._torque, 4);
        }

        /**
         * @en
         * Gets or sets the torsional force in the local coordinate system.
         * @zh
         * 获取或设置本地坐标系下的扭转力。
         */
        get localTorque() {
          return this._localTorque;
        }
        set localTorque(value) {
          Vec3.copy(this._localTorque, value);
          this._maskUpdate(this._localTorque, 8);
        }
        onLoad() {
          this._rigidBody = this.node.getComponent(RigidBody);
          this._maskUpdate(this._force, 1);
          this._maskUpdate(this._localForce, 2);
          this._maskUpdate(this._torque, 4);
          this._maskUpdate(this._localTorque, 8);
        }
        lateUpdate(dt) {
          if (!EDITOR_NOT_IN_PREVIEW) {
            if (this._rigidBody != null && this._mask !== 0) {
              if (this._mask & 1) this._rigidBody.applyForce(this._force);
              if (this._mask & 2) this._rigidBody.applyLocalForce(this.localForce);
              if (this._mask & 4) this._rigidBody.applyTorque(this._torque);
              if (this._mask & 8) this._rigidBody.applyLocalTorque(this._localTorque);
            }
          }
        }
        _maskUpdate(t, m) {
          if (t.strictEquals(Vec3.ZERO)) {
            this._mask &= ~m;
          } else {
            this._mask |= m;
          }
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_force", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec3();
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_localForce", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec3();
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_torque", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec3();
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "_localTorque", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec3();
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "force", [_dec5, _dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "force"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "localForce", [_dec7, _dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "localForce"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "torque", [_dec9, _dec0], Object.getOwnPropertyDescriptor(_class2.prototype, "torque"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "localTorque", [_dec1, _dec10], Object.getOwnPropertyDescriptor(_class2.prototype, "localTorque"), _class2.prototype), _class2)) || _class) || _class) || _class) || _class) || _class) || _class));
    }
  };
});