System.register("q-bundled:///fs/cocos/physics/framework/components/colliders/mesh-collider.js", ["../../../../core/data/decorators/index.js", "./collider.js", "../../../../3d/assets/index.js", "../../physics-enum.js", "../../../../core/index.js", "../rigid-body.js"], function (_export, _context) {
  "use strict";

  var ccclass, help, executeInEditMode, menu, type, editable, serializable, tooltip, Collider, Mesh, EColliderType, ERigidBodyType, warnID, RigidBody, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _class, _class2, _descriptor, _descriptor2, MeshCollider;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      help = _coreDataDecoratorsIndexJs.help;
      executeInEditMode = _coreDataDecoratorsIndexJs.executeInEditMode;
      menu = _coreDataDecoratorsIndexJs.menu;
      type = _coreDataDecoratorsIndexJs.type;
      editable = _coreDataDecoratorsIndexJs.editable;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
    }, function (_colliderJs) {
      Collider = _colliderJs.Collider;
    }, function (_dAssetsIndexJs) {
      Mesh = _dAssetsIndexJs.Mesh;
    }, function (_physicsEnumJs) {
      EColliderType = _physicsEnumJs.EColliderType;
      ERigidBodyType = _physicsEnumJs.ERigidBodyType;
    }, function (_coreIndexJs) {
      warnID = _coreIndexJs.warnID;
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
       * Triangle mesh collider component.
       * @zh
       * 三角网格碰撞器。
       */
      _export("MeshCollider", MeshCollider = (_dec = ccclass('cc.MeshCollider'), _dec2 = help('i18n:cc.MeshCollider'), _dec3 = menu('Physics/MeshCollider'), _dec4 = type(Mesh), _dec5 = tooltip('i18n:physics3d.collider.mesh_mesh'), _dec6 = tooltip('i18n:physics3d.collider.mesh_convex'), _dec(_class = _dec2(_class = _dec3(_class = executeInEditMode(_class = (_class2 = class MeshCollider extends Collider {
        /// PUBLIC PROPERTY GETTER\SETTER ///

        /**
         * @en
         * Gets or sets the mesh assets referenced by this collider.
         * @zh
         * 获取或设置此碰撞体引用的网格资源.
         */
        get mesh() {
          return this._mesh;
        }
        set mesh(value) {
          if (this._mesh === value) return;
          this._mesh = value;
          if (this._shape) this.shape.setMesh(this._mesh);
        }

        /**
         * @en
         * Gets or sets whether the collider replaces the mesh with a convex shape.
         * @zh
         * 获取或设置此碰撞体是否用凸形状代替网格.
         */
        get convex() {
          return this._convex;
        }
        set convex(value) {
          if (this._convex === value) return;
          this._convex = value;
          if (this._shape && this._mesh) this.shape.setMesh(this._mesh);
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
            if (body && body.isValid && body.type === ERigidBodyType.DYNAMIC && !this.convex) {
              warnID(9630, this.node.name);
            }
          }
        }
        constructor() {
          super(EColliderType.MESH);
          _initializerDefineProperty(this, "_mesh", _descriptor, this);
          _initializerDefineProperty(this, "_convex", _descriptor2, this);
        }
      }, _applyDecoratedDescriptor(_class2.prototype, "mesh", [_dec4, _dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "mesh"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "convex", [editable, _dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "convex"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_mesh", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_convex", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _class2)) || _class) || _class) || _class) || _class));
    }
  };
});