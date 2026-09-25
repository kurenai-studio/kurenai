System.register("q-bundled:///fs/cocos/particle/animator/limit-velocity-overtime.js", ["../../core/data/decorators/index.js", "../../core/index.js", "../enum.js", "../particle.js", "./curve-range.js", "../particle-general-function.js"], function (_export, _context) {
  "use strict";

  var ccclass, tooltip, displayOrder, type, serializable, visible, pseudoRandom, Vec3, Quat, ParticleSpace, ParticleModuleRandSeed, ParticleModuleBase, PARTICLE_MODULE_NAME, CurveRange, calculateTransform, isCurveTwoValues, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _dec23, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, LIMIT_VELOCITY_RAND_OFFSET, _temp_v3, _temp_v3_1, LimitVelocityOvertimeModule;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function dampenBeyondLimit(vel, limit, dampen) {
    const sgn = Math.sign(vel);
    let abs = Math.abs(vel);
    if (abs > limit) {
      const absToGive = abs - abs * dampen;
      if (absToGive > limit) {
        abs = absToGive;
      } else {
        abs = limit;
      }
    }
    return abs * sgn;
  }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
      displayOrder = _coreDataDecoratorsIndexJs.displayOrder;
      type = _coreDataDecoratorsIndexJs.type;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      visible = _coreDataDecoratorsIndexJs.visible;
    }, function (_coreIndexJs) {
      pseudoRandom = _coreIndexJs.pseudoRandom;
      Vec3 = _coreIndexJs.Vec3;
      Quat = _coreIndexJs.Quat;
    }, function (_enumJs) {
      ParticleSpace = _enumJs.ParticleSpace;
      ParticleModuleRandSeed = _enumJs.ParticleModuleRandSeed;
    }, function (_particleJs) {
      ParticleModuleBase = _particleJs.ParticleModuleBase;
      PARTICLE_MODULE_NAME = _particleJs.PARTICLE_MODULE_NAME;
    }, function (_curveRangeJs) {
      CurveRange = _curveRangeJs.default;
    }, function (_particleGeneralFunctionJs) {
      calculateTransform = _particleGeneralFunctionJs.calculateTransform;
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
      LIMIT_VELOCITY_RAND_OFFSET = ParticleModuleRandSeed.LIMIT;
      _temp_v3 = new Vec3();
      _temp_v3_1 = new Vec3();
      /**
       * @en
       * This module will damping particle velocity to the limit value over life time.
       * Open the separateAxes option you can damping the particle velocity on XYZ axis
       * Limit value on every axis is curve so you can modify these curves to see how it animate.
       * @zh
       * 本模块用于在粒子生命周期内对速度进行衰减，速度每次衰减比例为 dampen 持续衰减到极限速度。
       * 打开 separateAxes 就能够修改粒子在三个轴方向的极限速度大小。
       * 每个轴上的粒子极限速度大小都是可以用曲线来进行编辑，修改曲线就能够看到粒子大小变化的效果了。
       */
      _export("default", LimitVelocityOvertimeModule = (_dec = ccclass('cc.LimitVelocityOvertimeModule'), _dec2 = displayOrder(0), _dec3 = type(CurveRange), _dec4 = displayOrder(4), _dec5 = tooltip('i18n:limitVelocityOvertimeModule.limitX'), _dec6 = visible(function () {
        return this.separateAxes;
      }), _dec7 = type(CurveRange), _dec8 = displayOrder(5), _dec9 = tooltip('i18n:limitVelocityOvertimeModule.limitY'), _dec0 = visible(function () {
        return this.separateAxes;
      }), _dec1 = type(CurveRange), _dec10 = displayOrder(6), _dec11 = tooltip('i18n:limitVelocityOvertimeModule.limitZ'), _dec12 = visible(function () {
        return this.separateAxes;
      }), _dec13 = type(CurveRange), _dec14 = displayOrder(3), _dec15 = tooltip('i18n:limitVelocityOvertimeModule.limit'), _dec16 = visible(function () {
        return !this.separateAxes;
      }), _dec17 = displayOrder(7), _dec18 = tooltip('i18n:limitVelocityOvertimeModule.dampen'), _dec19 = displayOrder(2), _dec20 = tooltip('i18n:limitVelocityOvertimeModule.separateAxes'), _dec21 = type(ParticleSpace), _dec22 = displayOrder(1), _dec23 = tooltip('i18n:limitVelocityOvertimeModule.space'), _dec(_class = (_class2 = class LimitVelocityOvertimeModule extends ParticleModuleBase {
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
         * @en Limit velocity on X axis.
         * @zh X 轴方向上的速度下限。
         */

        constructor() {
          super();
          _initializerDefineProperty(this, "_enable", _descriptor, this);
          _initializerDefineProperty(this, "limitX", _descriptor2, this);
          /**
           * @en Limit velocity on Y axis.
           * @zh Y 轴方向上的速度下限。
           */
          _initializerDefineProperty(this, "limitY", _descriptor3, this);
          /**
           * @en Limit velocity on Z axis.
           * @zh Z 轴方向上的速度下限。
           */
          _initializerDefineProperty(this, "limitZ", _descriptor4, this);
          /**
           * @en Velocity limit.
           * @zh 速度下限。
           */
          _initializerDefineProperty(this, "limit", _descriptor5, this);
          /**
           * @en Dampen velocity percent every time.
           * @zh 速度每次衰减的比例。
           */
          _initializerDefineProperty(this, "dampen", _descriptor6, this);
          /**
           * @en Limit velocity on separate axis.
           * @zh 是否三个轴分开限制。
           */
          _initializerDefineProperty(this, "separateAxes", _descriptor7, this);
          /**
           * @en Space used to calculate limit velocity.
           * @zh 计算速度下限时采用的坐标系 [[Space]]。
           */
          _initializerDefineProperty(this, "space", _descriptor8, this);
          // TODO:functions related to drag are temporarily not supported
          this.drag = null;
          this.multiplyDragByParticleSize = false;
          this.multiplyDragByParticleVelocity = false;
          this.name = PARTICLE_MODULE_NAME.LIMIT;
          this.rotation = void 0;
          this.needTransform = void 0;
          this.rotation = new Quat();
          this.needTransform = false;
          this.needUpdate = true;
        }

        /**
         * @en Update limit velocity module calculate transform.
         * @zh 更新模块，计算坐标变换。
         * @param space @en Limit velocity module update space @zh 模块更新空间
         * @param worldTransform @en Particle system world transform @zh 粒子系统的世界变换矩阵
         * @internal
         */
        update(space, worldTransform) {
          this.needTransform = calculateTransform(space, this.space, worldTransform, this.rotation);
        }

        /**
         * @en Apply limit velocity to particle.
         * @zh 作用速度衰减到粒子上。
         * @param p @en Particle to animate @zh 模块需要更新的粒子
         * @param dt @en Update interval time @zh 粒子系统更新的间隔时间
         * @internal
         */
        animate(p, dt) {
          const normalizedTime = 1 - p.remainingLifetime / p.startLifetime;
          const dampedVel = _temp_v3;
          if (this.separateAxes) {
            const randX = isCurveTwoValues(this.limitX) ? pseudoRandom(p.randomSeed + LIMIT_VELOCITY_RAND_OFFSET) : 0;
            const randY = isCurveTwoValues(this.limitY) ? pseudoRandom(p.randomSeed + LIMIT_VELOCITY_RAND_OFFSET) : 0;
            const randZ = isCurveTwoValues(this.limitZ) ? pseudoRandom(p.randomSeed + LIMIT_VELOCITY_RAND_OFFSET) : 0;
            Vec3.set(_temp_v3_1, this.limitX.evaluate(normalizedTime, randX), this.limitY.evaluate(normalizedTime, randY), this.limitZ.evaluate(normalizedTime, randZ));
            if (this.needTransform) {
              Vec3.transformQuat(_temp_v3_1, _temp_v3_1, this.rotation);
            }
            Vec3.set(dampedVel, dampenBeyondLimit(p.ultimateVelocity.x, _temp_v3_1.x, this.dampen), dampenBeyondLimit(p.ultimateVelocity.y, _temp_v3_1.y, this.dampen), dampenBeyondLimit(p.ultimateVelocity.z, _temp_v3_1.z, this.dampen));
          } else {
            Vec3.normalize(dampedVel, p.ultimateVelocity);
            const rand = isCurveTwoValues(this.limit) ? pseudoRandom(p.randomSeed + LIMIT_VELOCITY_RAND_OFFSET) : 0;
            Vec3.multiplyScalar(dampedVel, dampedVel, dampenBeyondLimit(p.ultimateVelocity.length(), this.limit.evaluate(normalizedTime, rand), this.dampen));
          }
          Vec3.copy(p.ultimateVelocity, dampedVel);
          Vec3.copy(p.velocity, p.ultimateVelocity);
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_enable", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "enable", [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "enable"), _class2.prototype), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "limitX", [_dec3, serializable, _dec4, _dec5, _dec6], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new CurveRange();
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "limitY", [_dec7, serializable, _dec8, _dec9, _dec0], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new CurveRange();
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "limitZ", [_dec1, serializable, _dec10, _dec11, _dec12], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new CurveRange();
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "limit", [_dec13, serializable, _dec14, _dec15, _dec16], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new CurveRange();
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "dampen", [serializable, _dec17, _dec18], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 3;
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "separateAxes", [serializable, _dec19, _dec20], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "space", [_dec21, serializable, _dec22, _dec23], {
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