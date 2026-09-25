System.register("q-bundled:///fs/cocos/physics/framework/components/colliders/terrain-collider.js", ["../../../../core/data/decorators/index.js", "./collider.js", "../../../../terrain/terrain-asset.js", "../../physics-enum.js", "../rigid-body.js", "../../../../core/index.js"], function (_export, _context) {
  "use strict";

  var ccclass, help, executeInEditMode, menu, type, serializable, tooltip, Collider, TerrainAsset, EColliderType, ERigidBodyType, RigidBody, warnID, _dec, _dec2, _dec3, _dec4, _dec5, _class, _class2, _descriptor, TerrainCollider;
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
      serializable = _coreDataDecoratorsIndexJs.serializable;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
    }, function (_colliderJs) {
      Collider = _colliderJs.Collider;
    }, function (_terrainTerrainAssetJs) {
      TerrainAsset = _terrainTerrainAssetJs.TerrainAsset;
    }, function (_physicsEnumJs) {
      EColliderType = _physicsEnumJs.EColliderType;
      ERigidBodyType = _physicsEnumJs.ERigidBodyType;
    }, function (_rigidBodyJs) {
      RigidBody = _rigidBodyJs.RigidBody;
    }, function (_coreIndexJs) {
      warnID = _coreIndexJs.warnID;
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
       * Terrain collider component.
       * @zh
       * 地形碰撞器。
       */
      _export("TerrainCollider", TerrainCollider = (_dec = ccclass('cc.TerrainCollider'), _dec2 = help('i18n:cc.TerrainCollider'), _dec3 = menu('Physics/TerrainCollider'), _dec4 = type(TerrainAsset), _dec5 = tooltip('i18n:physics3d.collider.terrain_terrain'), _dec(_class = _dec2(_class = _dec3(_class = executeInEditMode(_class = (_class2 = class TerrainCollider extends Collider {
        /// PUBLIC PROPERTY GETTER\SETTER ///

        /**
         * @en
         * Gets or sets the terrain assets referenced by this collider.
         * @zh
         * 获取或设置此碰撞体引用的网格资源.
         */
        get terrain() {
          return this._terrain;
        }
        set terrain(value) {
          this._terrain = value;
          if (this._shape) this.shape.setTerrain(this._terrain);
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
          super(EColliderType.TERRAIN);
          _initializerDefineProperty(this, "_terrain", _descriptor, this);
        }
      }, _applyDecoratedDescriptor(_class2.prototype, "terrain", [_dec4, _dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "terrain"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_terrain", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _class2)) || _class) || _class) || _class) || _class));
    }
  };
});