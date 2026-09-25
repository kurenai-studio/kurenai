System.register("q-bundled:///fs/cocos/particle/animator/rotation-overtime.js", ["../../core/data/decorators/index.js", "../../core/index.js", "../particle.js", "./curve-range.js", "../enum.js", "../particle-general-function.js"], function (_export, _context) {
  "use strict";

  var ccclass, tooltip, displayOrder, type, radian, serializable, visible, Mat4, pseudoRandom, Quat, Vec3, Particle, ParticleModuleBase, PARTICLE_MODULE_NAME, CurveRange, ParticleModuleRandSeed, ParticleRenderMode, isCurveTwoValues, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _dec10, _dec11, _dec12, _dec13, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, ROTATION_OVERTIME_RAND_OFFSET, RotationOvertimeModule;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
      displayOrder = _coreDataDecoratorsIndexJs.displayOrder;
      type = _coreDataDecoratorsIndexJs.type;
      radian = _coreDataDecoratorsIndexJs.radian;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      visible = _coreDataDecoratorsIndexJs.visible;
    }, function (_coreIndexJs) {
      Mat4 = _coreIndexJs.Mat4;
      pseudoRandom = _coreIndexJs.pseudoRandom;
      Quat = _coreIndexJs.Quat;
      Vec3 = _coreIndexJs.Vec3;
    }, function (_particleJs) {
      Particle = _particleJs.Particle;
      ParticleModuleBase = _particleJs.ParticleModuleBase;
      PARTICLE_MODULE_NAME = _particleJs.PARTICLE_MODULE_NAME;
    }, function (_curveRangeJs) {
      CurveRange = _curveRangeJs.default;
    }, function (_enumJs) {
      ParticleModuleRandSeed = _enumJs.ParticleModuleRandSeed;
      ParticleRenderMode = _enumJs.ParticleRenderMode;
    }, function (_particleGeneralFunctionJs) {
      isCurveTwoValues = _particleGeneralFunctionJs.isCurveTwoValues;
    }],
    execute: function () {
      /* eslint-disable max-len */
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
      ROTATION_OVERTIME_RAND_OFFSET = ParticleModuleRandSeed.ROTATION;
      /**
       * @en
       * This module will apply rotation to particle over life time.
       * Open the separateAxes option you can change the rotation on XYZ axis
       * Rotation on every axis is curve so you can modify these curves to see how it animate.
       * @zh
       * 本模块用于在粒子生命周期内对粒子施加旋转角速度。
       * 打开 separateAxes 就能够修改粒子在三个轴方向的旋转角速度大小。
       * 每个轴上的旋转角速度都是可以用曲线来进行编辑，修改曲线就能够看到粒子受力变化的效果了。
       */
      _export("default", RotationOvertimeModule = (_dec = ccclass('cc.RotationOvertimeModule'), _dec2 = displayOrder(0), _dec3 = displayOrder(1), _dec4 = tooltip('i18n:rotationOvertimeModule.separateAxes'), _dec5 = type(CurveRange), _dec6 = displayOrder(2), _dec7 = tooltip('i18n:rotationOvertimeModule.x'), _dec8 = visible(function () {
        return this.separateAxes;
      }), _dec9 = type(CurveRange), _dec0 = displayOrder(3), _dec1 = tooltip('i18n:rotationOvertimeModule.y'), _dec10 = visible(function () {
        return this.separateAxes;
      }), _dec11 = type(CurveRange), _dec12 = displayOrder(4), _dec13 = tooltip('i18n:rotationOvertimeModule.z'), _dec(_class = (_class2 = class RotationOvertimeModule extends ParticleModuleBase {
        constructor() {
          super();
          _initializerDefineProperty(this, "_enable", _descriptor, this);
          _initializerDefineProperty(this, "_separateAxes", _descriptor2, this);
          /**
           * @en Angle around X axis.
           * @zh 绕 X 轴设定旋转。
           */
          _initializerDefineProperty(this, "x", _descriptor3, this);
          /**
           * @en Angle around Y axis.
           * @zh 绕 Y 轴设定旋转。
           */
          _initializerDefineProperty(this, "y", _descriptor4, this);
          /**
           * @en Angle around Z axis.
           * @zh 绕 Z 轴设定旋转。
           */
          _initializerDefineProperty(this, "z", _descriptor5, this);
          this.name = PARTICLE_MODULE_NAME.ROTATION;
          this._startMat = new Mat4();
          this._matRot = new Mat4();
          this._quatRot = new Quat();
          this._otherEuler = new Vec3();
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
         * @en Rotation around separate axis.
         * @zh 是否三个轴分开设定旋转。
         */
        get separateAxes() {
          return this._separateAxes;
        }
        set separateAxes(val) {
          this._separateAxes = val;
        }
        _processRotation(p, r2d) {
          // Same as the particle-vs-legacy.chunk glsl statemants
          const renderMode = p.particleSystem.processor.getInfo().renderMode;
          if (renderMode !== ParticleRenderMode.Mesh) {
            if (renderMode === ParticleRenderMode.StrecthedBillboard) {
              this._quatRot.set(0, 0, 0, 1);
            }
          }
          Quat.normalize(this._quatRot, this._quatRot);
          if (this._quatRot.w < 0.0) {
            // Use vec3 to save quat so we need identify negative w
            this._quatRot.x += Particle.INDENTIFY_NEG_QUAT; // Indentify negative w & revert the quat in shader
          }
        }

        /**
         * @en Apply rotation to particle.
         * @zh 作用旋转到粒子上。
         * @param p @en Particle to animate @zh 模块需要更新的粒子
         * @param dt @en Update interval time @zh 粒子系统更新的间隔时间
         * @internal
         */
        animate(p, dt) {
          const normalizedTime = 1 - p.remainingLifetime / p.startLifetime;
          const randZ = isCurveTwoValues(this.z) ? pseudoRandom(p.randomSeed + ROTATION_OVERTIME_RAND_OFFSET) : 0;
          const renderMode = p.particleSystem.processor.getInfo().renderMode;
          if (!this._separateAxes || renderMode === ParticleRenderMode.VerticalBillboard || renderMode === ParticleRenderMode.HorizontalBillboard) {
            Quat.fromEuler(p.deltaQuat, 0, 0, this.z.evaluate(normalizedTime, randZ) * dt * Particle.R2D);
          } else {
            const randX = isCurveTwoValues(this.x) ? pseudoRandom(p.randomSeed + ROTATION_OVERTIME_RAND_OFFSET) : 0;
            const randY = isCurveTwoValues(this.y) ? pseudoRandom(p.randomSeed + ROTATION_OVERTIME_RAND_OFFSET) : 0;
            Quat.fromEuler(p.deltaQuat, this.x.evaluate(normalizedTime, randX) * dt * Particle.R2D, this.y.evaluate(normalizedTime, randY) * dt * Particle.R2D, this.z.evaluate(normalizedTime, randZ) * dt * Particle.R2D);
          }

          // Rotation-overtime combine with start rotation, after that we get quat from the mat
          p.deltaMat = Mat4.fromQuat(p.deltaMat, p.deltaQuat);
          p.localMat = p.localMat.multiply(p.deltaMat); // accumulate rotation

          if (!p.startRotated) {
            if (renderMode !== ParticleRenderMode.Mesh) {
              if (renderMode === ParticleRenderMode.StrecthedBillboard) {
                p.startEuler.set(0, 0, 0);
              } else if (renderMode !== ParticleRenderMode.Billboard) {
                p.startEuler.set(0, 0, p.startEuler.z);
              }
            }
            Quat.fromEuler(p.startRotation, p.startEuler.x * Particle.R2D, p.startEuler.y * Particle.R2D, p.startEuler.z * Particle.R2D);
            p.startRotated = true;
          }
          this._startMat = Mat4.fromQuat(this._startMat, p.startRotation);
          this._matRot = this._startMat.multiply(p.localMat);
          Mat4.getRotation(this._quatRot, this._matRot);
          this._processRotation(p, Particle.R2D);
          p.rotation.set(this._quatRot.x, this._quatRot.y, this._quatRot.z);
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_enable", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "enable", [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "enable"), _class2.prototype), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_separateAxes", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "separateAxes", [_dec3, _dec4], Object.getOwnPropertyDescriptor(_class2.prototype, "separateAxes"), _class2.prototype), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "x", [_dec5, serializable, radian, _dec6, _dec7, _dec8], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new CurveRange();
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "y", [_dec9, serializable, radian, _dec0, _dec1, _dec10], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new CurveRange();
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "z", [_dec11, serializable, radian, _dec12, _dec13], {
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