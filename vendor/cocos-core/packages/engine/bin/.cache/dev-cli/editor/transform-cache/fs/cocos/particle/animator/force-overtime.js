System.register("q-bundled:///fs/cocos/particle/animator/force-overtime.js", ["../../core/data/decorators/index.js", "../../core/index.js", "../enum.js", "../particle-general-function.js", "./curve-range.js", "../particle.js"], function (_export, _context) {
  "use strict";

  var ccclass, tooltip, displayOrder, type, serializable, pseudoRandom, Quat, Vec3, ParticleSpace, ParticleModuleRandSeed, calculateTransform, isCurveTwoValues, CurveRange, ParticleModuleBase, PARTICLE_MODULE_NAME, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _dec10, _dec11, _dec12, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, FORCE_OVERTIME_RAND_OFFSET, _temp_v3, ForceOvertimeModule;
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
    }, function (_coreIndexJs) {
      pseudoRandom = _coreIndexJs.pseudoRandom;
      Quat = _coreIndexJs.Quat;
      Vec3 = _coreIndexJs.Vec3;
    }, function (_enumJs) {
      ParticleSpace = _enumJs.ParticleSpace;
      ParticleModuleRandSeed = _enumJs.ParticleModuleRandSeed;
    }, function (_particleGeneralFunctionJs) {
      calculateTransform = _particleGeneralFunctionJs.calculateTransform;
      isCurveTwoValues = _particleGeneralFunctionJs.isCurveTwoValues;
    }, function (_curveRangeJs) {
      CurveRange = _curveRangeJs.default;
    }, function (_particleJs) {
      ParticleModuleBase = _particleJs.ParticleModuleBase;
      PARTICLE_MODULE_NAME = _particleJs.PARTICLE_MODULE_NAME;
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
      FORCE_OVERTIME_RAND_OFFSET = ParticleModuleRandSeed.FORCE;
      _temp_v3 = new Vec3();
      /**
       * @en
       * This module will apply force to particle over life time.
       * Force on every axis is curve so you can modify these curves to see how it animate.
       * @zh
       * 本模块用于在粒子生命周期内对粒子施加外力。
       * 每个轴上的受力大小都是可以用曲线来进行编辑，修改曲线就能够看到粒子受力变化的效果了。
       */
      _export("default", ForceOvertimeModule = (_dec = ccclass('cc.ForceOvertimeModule'), _dec2 = displayOrder(0), _dec3 = type(CurveRange), _dec4 = displayOrder(2), _dec5 = tooltip('i18n:forceOvertimeModule.x'), _dec6 = type(CurveRange), _dec7 = displayOrder(3), _dec8 = tooltip('i18n:forceOvertimeModule.y'), _dec9 = type(CurveRange), _dec0 = displayOrder(4), _dec1 = tooltip('i18n:forceOvertimeModule.z'), _dec10 = type(ParticleSpace), _dec11 = displayOrder(1), _dec12 = tooltip('i18n:forceOvertimeModule.space'), _dec(_class = (_class2 = class ForceOvertimeModule extends ParticleModuleBase {
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
         * @en Force on the X axis.
         * @zh X 轴方向上的加速度分量。
         */

        constructor() {
          super();
          _initializerDefineProperty(this, "_enable", _descriptor, this);
          _initializerDefineProperty(this, "x", _descriptor2, this);
          /**
           * @en Force on the Y axis.
           * @zh Y 轴方向上的加速度分量。
           */
          _initializerDefineProperty(this, "y", _descriptor3, this);
          /**
           * @en Force on the Z axis.
           * @zh Z 轴方向上的加速度分量。
           */
          _initializerDefineProperty(this, "z", _descriptor4, this);
          /**
           * @en Force calculation coordinate. See [[Space]].
           * @zh 加速度计算时采用的坐标系 [[Space]]。
           */
          _initializerDefineProperty(this, "space", _descriptor5, this);
          // TODO:currently not supported
          this.randomized = false;
          this.rotation = void 0;
          this.needTransform = void 0;
          this.name = PARTICLE_MODULE_NAME.FORCE;
          this.rotation = new Quat();
          this.needTransform = false;
          this.needUpdate = true;
        }

        /**
         * @en Update force module calculate transform.
         * @zh 更新模块，计算坐标变换。
         * @param space @en Force module update space. @zh 模块更新空间。
         * @param worldTransform @en Particle system world transform. @zh 粒子系统的世界变换矩阵。
         * @internal
         */
        update(space, worldTransform) {
          this.needTransform = calculateTransform(space, this.space, worldTransform, this.rotation);
        }

        /**
         * @en Apply force to particle.
         * @zh 作用力到粒子上。
         * @param p @en Particle to animate. @zh 模块需要更新的粒子。
         * @param dt @en Update interval time. @zh 粒子系统更新的间隔时间。
         * @internal
         */
        animate(p, dt) {
          const normalizedTime = 1 - p.remainingLifetime / p.startLifetime;
          const randX = isCurveTwoValues(this.x) ? pseudoRandom(p.randomSeed + FORCE_OVERTIME_RAND_OFFSET) : 0;
          const randY = isCurveTwoValues(this.y) ? pseudoRandom(p.randomSeed + FORCE_OVERTIME_RAND_OFFSET) : 0;
          const randZ = isCurveTwoValues(this.z) ? pseudoRandom(p.randomSeed + FORCE_OVERTIME_RAND_OFFSET) : 0;
          const force = Vec3.set(_temp_v3, this.x.evaluate(normalizedTime, randX), this.y.evaluate(normalizedTime, randY), this.z.evaluate(normalizedTime, randZ));
          if (this.needTransform) {
            Vec3.transformQuat(force, force, this.rotation);
          }
          Vec3.scaleAndAdd(p.velocity, p.velocity, force, dt);
          Vec3.copy(p.ultimateVelocity, p.velocity);
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_enable", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "enable", [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "enable"), _class2.prototype), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "x", [_dec3, serializable, _dec4, _dec5], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new CurveRange();
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "y", [_dec6, serializable, _dec7, _dec8], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new CurveRange();
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "z", [_dec9, serializable, _dec0, _dec1], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new CurveRange();
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "space", [_dec10, serializable, _dec11, _dec12], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return ParticleSpace.Local;
        }
      }), _class2)) || _class));
    }
  };
});