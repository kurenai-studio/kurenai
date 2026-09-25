System.register("q-bundled:///fs/cocos/physics/framework/components/colliders/simplex-collider.js", ["../../../../core/data/decorators/index.js", "../../../../core/index.js", "./collider.js", "../../physics-enum.js"], function (_export, _context) {
  "use strict";

  var ccclass, help, executeInEditMode, menu, visible, type, editable, serializable, tooltip, Vec3, Collider, ESimplexType, EColliderType, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _dec10, _class, _class2, _descriptor, _descriptor2, _SimplexCollider, SimplexCollider;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      help = _coreDataDecoratorsIndexJs.help;
      executeInEditMode = _coreDataDecoratorsIndexJs.executeInEditMode;
      menu = _coreDataDecoratorsIndexJs.menu;
      visible = _coreDataDecoratorsIndexJs.visible;
      type = _coreDataDecoratorsIndexJs.type;
      editable = _coreDataDecoratorsIndexJs.editable;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
    }, function (_coreIndexJs) {
      Vec3 = _coreIndexJs.Vec3;
    }, function (_colliderJs) {
      Collider = _colliderJs.Collider;
    }, function (_physicsEnumJs) {
      ESimplexType = _physicsEnumJs.ESimplexType;
      EColliderType = _physicsEnumJs.EColliderType;
    }],
    execute: function () {
      /* eslint-disable @typescript-eslint/no-namespace */
      /* eslint-disable func-names */
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
       * Simplex collider, support point, line, triangle, tetrahedron.
       * @zh
       * 单纯形碰撞器，支持点、线、三角形、四面体。
       */
      _export("SimplexCollider", SimplexCollider = (_dec = ccclass('cc.SimplexCollider'), _dec2 = help('i18n:cc.SimplexCollider'), _dec3 = menu('Physics/SimplexCollider'), _dec4 = type(ESimplexType), _dec5 = tooltip('i18n:physics3d.collider.simplex_shapeType'), _dec6 = tooltip('i18n:physics3d.collider.simplex_vertex0'), _dec7 = visible(function () {
        return this._shapeType > 1;
      }), _dec8 = tooltip('i18n:physics3d.collider.simplex_vertex1'), _dec9 = visible(function () {
        return this._shapeType > 2;
      }), _dec0 = tooltip('i18n:physics3d.collider.simplex_vertex2'), _dec1 = visible(function () {
        return this._shapeType > 3;
      }), _dec10 = tooltip('i18n:physics3d.collider.simplex_vertex3'), _dec(_class = _dec2(_class = _dec3(_class = executeInEditMode(_class = (_class2 = (_SimplexCollider = class SimplexCollider extends Collider {
        /// PUBLIC PROPERTY GETTER\SETTER ///

        get shapeType() {
          return this._shapeType;
        }
        set shapeType(v) {
          this._shapeType = v;
          if (this._shape) {
            this.shape.setShapeType(v);
          }
        }
        get vertex0() {
          return this._vertices[0];
        }
        set vertex0(v) {
          Vec3.copy(this._vertices[0], v);
          this.updateVertices();
        }
        get vertex1() {
          return this._vertices[1];
        }
        set vertex1(v) {
          Vec3.copy(this._vertices[1], v);
          this.updateVertices();
        }
        get vertex2() {
          return this._vertices[2];
        }
        set vertex2(v) {
          Vec3.copy(this._vertices[2], v);
          this.updateVertices();
        }
        get vertex3() {
          return this._vertices[3];
        }
        set vertex3(v) {
          Vec3.copy(this._vertices[3], v);
          this.updateVertices();
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
        get vertices() {
          return this._vertices;
        }

        /// PRIVATE PROPERTY ///

        constructor() {
          super(EColliderType.SIMPLEX);
          _initializerDefineProperty(this, "_shapeType", _descriptor, this);
          _initializerDefineProperty(this, "_vertices", _descriptor2, this);
        }
        updateVertices() {
          if (this._shape) {
            this.shape.setVertices(this._vertices);
          }
        }
      }, _SimplexCollider.ESimplexType = ESimplexType, _SimplexCollider), _applyDecoratedDescriptor(_class2.prototype, "shapeType", [_dec4, _dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "shapeType"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "vertex0", [editable, _dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "vertex0"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "vertex1", [_dec7, _dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "vertex1"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "vertex2", [_dec9, _dec0], Object.getOwnPropertyDescriptor(_class2.prototype, "vertex2"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "vertex3", [_dec1, _dec10], Object.getOwnPropertyDescriptor(_class2.prototype, "vertex3"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_shapeType", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return ESimplexType.TETRAHEDRON;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_vertices", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [new Vec3(0, 0, 0), new Vec3(0, 0, 1), new Vec3(1, 0, 0), new Vec3(0, 1, 0)];
        }
      }), _class2)) || _class) || _class) || _class) || _class));
    }
  };
});