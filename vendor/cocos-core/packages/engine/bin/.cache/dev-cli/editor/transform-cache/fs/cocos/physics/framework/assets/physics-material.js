System.register("q-bundled:///fs/cocos/physics/framework/assets/physics-material.js", ["../../../core/data/decorators/index.js", "../../../asset/assets/asset.js", "../../../core/index.js"], function (_export, _context) {
  "use strict";

  var ccclass, editable, range, serializable, type, Asset, CCFloat, math, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _PhysicsMaterial, PhysicsMaterial;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      editable = _coreDataDecoratorsIndexJs.editable;
      range = _coreDataDecoratorsIndexJs.range;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      type = _coreDataDecoratorsIndexJs.type;
    }, function (_assetAssetsAssetJs) {
      Asset = _assetAssetsAssetJs.Asset;
    }, function (_coreIndexJs) {
      CCFloat = _coreIndexJs.CCFloat;
      math = _coreIndexJs.math;
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
      // @ts-check
      /**
       * @en
       * Physics materials.
       * @zh
       * 物理材质。
       */
      _export("PhysicsMaterial", PhysicsMaterial = (_dec = ccclass('cc.PhysicsMaterial'), _dec2 = type(CCFloat), _dec3 = type(CCFloat), _dec4 = type(CCFloat), _dec5 = type(CCFloat), _dec6 = range([0, 1, 0.01]), _dec(_class = (_class2 = (_PhysicsMaterial = class PhysicsMaterial extends Asset {
        /**
         * @en
         * Friction for this material.
         * @zh
         * 此材质的摩擦系数。
         */
        get friction() {
          return this._friction;
        }
        set friction(value) {
          if (!math.equals(this._friction, value)) {
            this._friction = value;
            this.emit(PhysicsMaterial.EVENT_UPDATE);
          }
        }

        /**
         * @en
         * Rolling friction for this material.
         * @zh
         * 此材质的滚动摩擦系数。
         */
        get rollingFriction() {
          return this._rollingFriction;
        }
        set rollingFriction(value) {
          if (!math.equals(this._rollingFriction, value)) {
            this._rollingFriction = value;
            this.emit(PhysicsMaterial.EVENT_UPDATE);
          }
        }

        /**
         * @en
         * Spinning friction for this material.
         * @zh
         * 此材质的自旋摩擦系数。
         */
        get spinningFriction() {
          return this._spinningFriction;
        }
        set spinningFriction(value) {
          if (!math.equals(this._spinningFriction, value)) {
            this._spinningFriction = value;
            this.emit(PhysicsMaterial.EVENT_UPDATE);
          }
        }

        /**
         * @en
         * Restitution for this material.
         * @zh
         * 此材质的回弹系数。
         */
        get restitution() {
          return this._restitution;
        }
        set restitution(value) {
          if (!math.equals(this._restitution, value)) {
            this._restitution = value;
            this.emit(PhysicsMaterial.EVENT_UPDATE);
          }
        }
        constructor() {
          super();
          this.id = void 0;
          _initializerDefineProperty(this, "_friction", _descriptor, this);
          _initializerDefineProperty(this, "_rollingFriction", _descriptor2, this);
          _initializerDefineProperty(this, "_spinningFriction", _descriptor3, this);
          _initializerDefineProperty(this, "_restitution", _descriptor4, this);
          PhysicsMaterial.allMaterials.push(this);
          this.id = PhysicsMaterial._idCounter++;
          if (!this._uuid) this._uuid = `pm_${this.id}`;
        }

        /**
         * @en
         * clone.
         * @zh
         * 克隆。
         */
        clone() {
          const c = new PhysicsMaterial();
          c._friction = this._friction;
          c._restitution = this._restitution;
          c._rollingFriction = this._rollingFriction;
          c._spinningFriction = this._spinningFriction;
          return c;
        }

        /**
         * @en
         * destroy.
         * @zh
         * 销毁。
         * @return 是否成功
         */
        destroy() {
          if (super.destroy()) {
            const idx = PhysicsMaterial.allMaterials.indexOf(this);
            if (idx >= 0) {
              PhysicsMaterial.allMaterials.splice(idx, 1);
            }
            return true;
          }
          return false;
        }

        /**
         * @en
         * Sets the coefficients values.
         * @zh
         * 设置材质相关的系数。
         * @param friction
         * @param rollingFriction
         * @param spinningFriction
         * @param restitution
         */
        setValues(friction, rollingFriction, spinningFriction, restitution) {
          const emitUpdate = this._friction !== friction || this._rollingFriction !== rollingFriction || this._spinningFriction !== spinningFriction || this._restitution !== restitution;
          this._friction = friction;
          this._rollingFriction = rollingFriction;
          this._spinningFriction = spinningFriction;
          this._restitution = restitution;
          if (emitUpdate) this.emit(PhysicsMaterial.EVENT_UPDATE);
        }
      }, _PhysicsMaterial.allMaterials = [], _PhysicsMaterial.EVENT_UPDATE = 'event_update', _PhysicsMaterial._idCounter = 0, _PhysicsMaterial), _applyDecoratedDescriptor(_class2.prototype, "friction", [editable, _dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "friction"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "rollingFriction", [editable, _dec3], Object.getOwnPropertyDescriptor(_class2.prototype, "rollingFriction"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "spinningFriction", [editable, _dec4], Object.getOwnPropertyDescriptor(_class2.prototype, "spinningFriction"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "restitution", [editable, _dec5, _dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "restitution"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_friction", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.6;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_rollingFriction", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.0;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_spinningFriction", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.0;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "_restitution", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.0;
        }
      }), _class2)) || _class));
    }
  };
});