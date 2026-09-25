System.register("q-bundled:///fs/cocos/physics/framework/components/colliders/plane-collider.js", ["../../../../core/data/decorators/index.js", "../../../../core/index.js", "./collider.js", "../../physics-enum.js", "../rigid-body.js"], function (_export, _context) {
  "use strict";

  var ccclass, help, executeInEditMode, menu, tooltip, type, editable, serializable, Vec3, warnID, Collider, EColliderType, ERigidBodyType, RigidBody, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _class, _class2, _descriptor, _descriptor2, PlaneCollider;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      help = _coreDataDecoratorsIndexJs.help;
      executeInEditMode = _coreDataDecoratorsIndexJs.executeInEditMode;
      menu = _coreDataDecoratorsIndexJs.menu;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
      type = _coreDataDecoratorsIndexJs.type;
      editable = _coreDataDecoratorsIndexJs.editable;
      serializable = _coreDataDecoratorsIndexJs.serializable;
    }, function (_coreIndexJs) {
      Vec3 = _coreIndexJs.Vec3;
      warnID = _coreIndexJs.warnID;
    }, function (_colliderJs) {
      Collider = _colliderJs.Collider;
    }, function (_physicsEnumJs) {
      EColliderType = _physicsEnumJs.EColliderType;
      ERigidBodyType = _physicsEnumJs.ERigidBodyType;
    }, function (_rigidBodyJs) {
      RigidBody = _rigidBodyJs.RigidBody;
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
       * Plane collider component.
       * @zh
       * 静态平面碰撞器。
       */
      _export("PlaneCollider", PlaneCollider = (_dec = ccclass('cc.PlaneCollider'), _dec2 = help('i18n:cc.PlaneCollider'), _dec3 = menu('Physics/PlaneCollider'), _dec4 = type(Vec3), _dec5 = tooltip('i18n:physics3d.collider.plane_normal'), _dec6 = tooltip('i18n:physics3d.collider.plane_constant'), _dec(_class = _dec2(_class = _dec3(_class = executeInEditMode(_class = (_class2 = class PlaneCollider extends Collider {
        /// PUBLIC PROPERTY GETTER\SETTER ///

        /**
         * @en
         * Gets or sets the normal of the plane, in local space.
         * @zh
         * 获取或设置平面在本地坐标系下的法线。
         */
        get normal() {
          return this._normal;
        }
        set normal(value) {
          if (Vec3.strictEquals(this._normal, value)) return;
          Vec3.copy(this._normal, value);
          if (this._shape) {
            this.shape.setNormal(this._normal);
          }
        }

        /**
         * @en
         * Gets or sets the value of the plane moving along the normal, in local space.
         * @zh
         * 获取或设置平面在本地坐标系下沿着法线移动的数值。
         */
        get constant() {
          return this._constant;
        }
        set constant(v) {
          if (this._constant === v) return;
          this._constant = v;
          if (this._shape) {
            this.shape.setConstant(this._constant);
          }
        }

        /**
         * @en
         * Gets the wrapper object, through which the lowLevel instance can be accessed.
         * @zh
         * 获取封装对象，通过此对象可以访问到底层实例。
         */
        get shape() {
          return this._shape;
        }
        onEnable() {
          super.onEnable();
          if (this.node) {
            const body = this.node.getComponent(RigidBody);
            if (body && body.isValid && body.type === ERigidBodyType.DYNAMIC) {
              warnID(9630, this.node.name);
            }
          }
        }

        /// PRIVATE PROPERTY ///

        constructor() {
          super(EColliderType.PLANE);
          _initializerDefineProperty(this, "_normal", _descriptor, this);
          _initializerDefineProperty(this, "_constant", _descriptor2, this);
        }
      }, _applyDecoratedDescriptor(_class2.prototype, "normal", [_dec4, _dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "normal"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "constant", [editable, _dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "constant"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_normal", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec3(0, 1, 0);
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_constant", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _class2)) || _class) || _class) || _class) || _class));
    }
  };
});