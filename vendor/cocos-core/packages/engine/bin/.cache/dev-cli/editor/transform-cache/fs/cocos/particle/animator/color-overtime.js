System.register("q-bundled:///fs/cocos/particle/animator/color-overtime.js", ["../../core/data/decorators/index.js", "../../core/index.js", "../particle.js", "./gradient-range.js", "../enum.js", "../particle-general-function.js"], function (_export, _context) {
  "use strict";

  var ccclass, displayOrder, type, serializable, pseudoRandom, PARTICLE_MODULE_NAME, ParticleModuleBase, GradientRange, ParticleModuleRandSeed, isGradientTwoValues, _dec, _dec2, _dec3, _dec4, _class, _class2, _descriptor, _descriptor2, COLOR_OVERTIME_RAND_OFFSET, ColorOvertimeModule;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      displayOrder = _coreDataDecoratorsIndexJs.displayOrder;
      type = _coreDataDecoratorsIndexJs.type;
      serializable = _coreDataDecoratorsIndexJs.serializable;
    }, function (_coreIndexJs) {
      pseudoRandom = _coreIndexJs.pseudoRandom;
    }, function (_particleJs) {
      PARTICLE_MODULE_NAME = _particleJs.PARTICLE_MODULE_NAME;
      ParticleModuleBase = _particleJs.ParticleModuleBase;
    }, function (_gradientRangeJs) {
      GradientRange = _gradientRangeJs.default;
    }, function (_enumJs) {
      ParticleModuleRandSeed = _enumJs.ParticleModuleRandSeed;
    }, function (_particleGeneralFunctionJs) {
      isGradientTwoValues = _particleGeneralFunctionJs.isGradientTwoValues;
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
      COLOR_OVERTIME_RAND_OFFSET = ParticleModuleRandSeed.COLOR;
      /**
       * @en
       * This module will modify particle color over life time. You can set the color gradient to see how it changes.
       * @zh
       * 本模块用于在粒子生命周期内对颜色进行改变，可以修改模块下的颜色渐变条来查看粒子颜色渐变效果。
       */
      _export("default", ColorOvertimeModule = (_dec = ccclass('cc.ColorOvertimeModule'), _dec2 = displayOrder(0), _dec3 = type(GradientRange), _dec4 = displayOrder(1), _dec(_class = (_class2 = class ColorOvertimeModule extends ParticleModuleBase {
        constructor() {
          super();
          _initializerDefineProperty(this, "_enable", _descriptor, this);
          /**
           * @en Change color over life time. Evaluate by key interpolation.
           * @zh 颜色随时间变化的参数，各个 key 之间线性插值变化。
           */
          _initializerDefineProperty(this, "color", _descriptor2, this);
          this.name = PARTICLE_MODULE_NAME.COLOR;
        }
        /**
         * @en Enable or disable this module.
         * @zh 是否启用。
         */
        get enable() {
          return this._enable;
        }
        set enable(val) {
          if (this._enable === val) return;
          this._enable = val;
          if (!this.target) return;
          this.target.enableModule(this.name, val, this);
        }
        /**
         * @en Apply color animation to particle.
         * @zh 作用颜色变换到粒子上。
         * @param particle @en Particle to animate. @zh 模块需要更新的粒子。
         * @internal
         */
        animate(particle) {
          particle.color.set(particle.startColor);
          const rand = isGradientTwoValues(this.color) ? pseudoRandom(particle.randomSeed + COLOR_OVERTIME_RAND_OFFSET) : 0;
          particle.color.multiply(this.color.evaluate(1.0 - particle.remainingLifetime / particle.startLifetime, rand));
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_enable", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "enable", [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "enable"), _class2.prototype), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "color", [_dec3, serializable, _dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new GradientRange();
        }
      }), _class2)) || _class));
    }
  };
});