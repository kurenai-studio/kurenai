System.register("q-bundled:///fs/cocos/particle/animator/size-overtime.js", ["../../core/data/decorators/index.js", "../../core/index.js", "../particle.js", "./curve-range.js", "../enum.js", "../particle-general-function.js"], function (_export, _context) {
  "use strict";

  var ccclass, tooltip, displayOrder, type, serializable, range, visible, pseudoRandom, Vec3, ParticleModuleBase, PARTICLE_MODULE_NAME, CurveRange, ParticleModuleRandSeed, isCurveTwoValues, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, SIZE_OVERTIME_RAND_OFFSET, SizeOvertimeModule;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
      displayOrder = _coreDataDecoratorsIndexJs.displayOrder;
      type = _coreDataDecoratorsIndexJs.type;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      range = _coreDataDecoratorsIndexJs.range;
      visible = _coreDataDecoratorsIndexJs.visible;
    }, function (_coreIndexJs) {
      pseudoRandom = _coreIndexJs.pseudoRandom;
      Vec3 = _coreIndexJs.Vec3;
    }, function (_particleJs) {
      ParticleModuleBase = _particleJs.ParticleModuleBase;
      PARTICLE_MODULE_NAME = _particleJs.PARTICLE_MODULE_NAME;
    }, function (_curveRangeJs) {
      CurveRange = _curveRangeJs.default;
    }, function (_enumJs) {
      ParticleModuleRandSeed = _enumJs.ParticleModuleRandSeed;
    }, function (_particleGeneralFunctionJs) {
      isCurveTwoValues = _particleGeneralFunctionJs.isCurveTwoValues;
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
      SIZE_OVERTIME_RAND_OFFSET = ParticleModuleRandSeed.SIZE;
      /**
       * @en
       * This module will modify particle size over life time.
       * Open the separateAxes option you can change the particle size on XYZ axis (Size on Z axis is invalid for billboard particle)
       * Size on every axis is curve so you can modify these curves to see how it animate.
       * @zh
       * 本模块用于在粒子生命周期内对大小进行改变。
       * 打开 separateAxes 就能够修改粒子在三个轴方向的大小（z轴大小对公告板粒子无效）
       * 每个轴上的粒子大小都是可以用曲线来进行编辑，修改曲线就能够看到粒子大小变化的效果了。
       */
      _export("default", SizeOvertimeModule = (_dec = ccclass('cc.SizeOvertimeModule'), _dec2 = displayOrder(0), _dec3 = displayOrder(1), _dec4 = tooltip('i18n:sizeOvertimeModule.separateAxes'), _dec5 = type(CurveRange), _dec6 = range([0, Number.POSITIVE_INFINITY]), _dec7 = displayOrder(2), _dec8 = tooltip('i18n:sizeOvertimeModule.size'), _dec9 = visible(function () {
        return !this.separateAxes;
      }), _dec0 = type(CurveRange), _dec1 = range([0, Number.POSITIVE_INFINITY]), _dec10 = displayOrder(3), _dec11 = tooltip('i18n:sizeOvertimeModule.x'), _dec12 = visible(function () {
        return this.separateAxes;
      }), _dec13 = type(CurveRange), _dec14 = range([0, Number.POSITIVE_INFINITY]), _dec15 = displayOrder(4), _dec16 = tooltip('i18n:sizeOvertimeModule.y'), _dec17 = visible(function () {
        return this.separateAxes;
      }), _dec18 = type(CurveRange), _dec19 = range([0, Number.POSITIVE_INFINITY]), _dec20 = displayOrder(5), _dec21 = tooltip('i18n:sizeOvertimeModule.z'), _dec22 = visible(function () {
        return this.separateAxes;
      }), _dec(_class = (_class2 = class SizeOvertimeModule extends ParticleModuleBase {
        constructor() {
          super();
          _initializerDefineProperty(this, "_enable", _descriptor, this);
          /**
           * @en Different size on separate axis.
           * @zh 决定是否在每个轴上独立控制粒子大小。
           */
          _initializerDefineProperty(this, "separateAxes", _descriptor2, this);
          /**
           * @en Curve to modify particle size.
           * @zh 定义一条曲线来决定粒子在其生命周期中的大小变化。
           */
          _initializerDefineProperty(this, "size", _descriptor3, this);
          /**
           * @en Curve to modify particle size on X axis.
           * @zh 定义一条曲线来决定粒子在其生命周期中 X 轴方向上的大小变化。
           */
          _initializerDefineProperty(this, "x", _descriptor4, this);
          /**
           * @en Curve to modify particle size on Y axis.
           * @zh 定义一条曲线来决定粒子在其生命周期中 Y 轴方向上的大小变化。
           */
          _initializerDefineProperty(this, "y", _descriptor5, this);
          /**
           * @en Curve to modify particle size on Z axis.
           * @zh 定义一条曲线来决定粒子在其生命周期中 Z 轴方向上的大小变化。
           */
          _initializerDefineProperty(this, "z", _descriptor6, this);
          this.name = PARTICLE_MODULE_NAME.SIZE;
        }
        /**
         * @en Enable this module or not.
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
         * @en Apply size animation to particle.
         * @zh 应用大小变换到粒子上。
         * @param particle @en Particle to animate @zh 模块需要更新的粒子
         * @param dt @en Update interval time @zh 粒子系统更新的间隔时间
         * @internal
         */
        animate(particle, dt) {
          if (!this.separateAxes) {
            const rand = isCurveTwoValues(this.size) ? pseudoRandom(particle.randomSeed + SIZE_OVERTIME_RAND_OFFSET) : 0;
            Vec3.multiplyScalar(particle.size, particle.startSize, this.size.evaluate(1 - particle.remainingLifetime / particle.startLifetime, rand));
          } else {
            const currLifetime = 1 - particle.remainingLifetime / particle.startLifetime;
            const randX = isCurveTwoValues(this.x) ? pseudoRandom(particle.randomSeed + SIZE_OVERTIME_RAND_OFFSET) : 0;
            const randY = isCurveTwoValues(this.y) ? pseudoRandom(particle.randomSeed + SIZE_OVERTIME_RAND_OFFSET) : 0;
            const randZ = isCurveTwoValues(this.z) ? pseudoRandom(particle.randomSeed + SIZE_OVERTIME_RAND_OFFSET) : 0;
            particle.size.x = particle.startSize.x * this.x.evaluate(currLifetime, randX);
            particle.size.y = particle.startSize.y * this.y.evaluate(currLifetime, randY);
            particle.size.z = particle.startSize.z * this.z.evaluate(currLifetime, randZ);
          }
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_enable", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "enable", [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "enable"), _class2.prototype), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "separateAxes", [serializable, _dec3, _dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "size", [_dec5, serializable, _dec6, _dec7, _dec8, _dec9], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new CurveRange();
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "x", [_dec0, serializable, _dec1, _dec10, _dec11, _dec12], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new CurveRange();
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "y", [_dec13, serializable, _dec14, _dec15, _dec16, _dec17], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new CurveRange();
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "z", [_dec18, serializable, _dec19, _dec20, _dec21, _dec22], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new CurveRange();
        }
      }), _class2)) || _class));
    }
  };
});