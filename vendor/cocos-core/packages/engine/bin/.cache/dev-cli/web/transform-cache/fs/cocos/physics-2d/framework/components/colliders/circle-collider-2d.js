System.register("q-bundled:///fs/cocos/physics-2d/framework/components/colliders/circle-collider-2d.js", ["../../../../core/index.js", "./collider-2d.js", "../../physics-types.js", "../../../../core/data/decorators/index.js"], function (_export, _context) {
  "use strict";

  var CCFloat, Vec2, _decorator, Collider2D, ECollider2DType, help, serializable, tooltip, type, _dec, _dec2, _dec3, _dec4, _dec5, _class, _class2, _descriptor, ccclass, menu, CircleCollider2D;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreIndexJs) {
      CCFloat = _coreIndexJs.CCFloat;
      Vec2 = _coreIndexJs.Vec2;
      _decorator = _coreIndexJs._decorator;
    }, function (_collider2dJs) {
      Collider2D = _collider2dJs.Collider2D;
    }, function (_physicsTypesJs) {
      ECollider2DType = _physicsTypesJs.ECollider2DType;
    }, function (_coreDataDecoratorsIndexJs) {
      help = _coreDataDecoratorsIndexJs.help;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
      type = _coreDataDecoratorsIndexJs.type;
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
        menu
      } = _decorator);
      _export("CircleCollider2D", CircleCollider2D = (_dec = ccclass('cc.CircleCollider2D'), _dec2 = help('i18n:cc.CircleCollider2D'), _dec3 = menu('Physics2D/Colliders/CircleCollider2D'), _dec4 = type(CCFloat), _dec5 = tooltip('i18n:physics2d.collider.radius'), _dec(_class = _dec2(_class = _dec3(_class = (_class2 = class CircleCollider2D extends Collider2D {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "_radius", _descriptor, this);
          this.TYPE = ECollider2DType.CIRCLE;
        }
        /**
         * @en Circle radius.
         * @zh 圆形半径。
         */
        get radius() {
          return this._radius;
        }
        set radius(v) {
          this._radius = v < 0 ? 0 : v;
        }

        /**
         * @en Get world center of the circle collider.
         * @zh 世界坐标下圆形碰撞体的中心。
         */
        get worldPosition() {
          if (this._shape) {
            return this._shape.worldPosition;
          }
          return new Vec2();
        }
        /**
         * @en Get world radius of the circle collider.
         * @zh 世界坐标下圆形碰撞体的半径。
         */
        get worldRadius() {
          if (this._shape) {
            return this._shape.worldRadius;
          }
          return 0;
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_radius", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "radius", [_dec4, _dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "radius"), _class2.prototype), _class2)) || _class) || _class) || _class));
    }
  };
});