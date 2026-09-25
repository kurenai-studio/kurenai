System.register("q-bundled:///fs/cocos/particle/particle-system.js", ["../core/data/decorators/index.js", "../../../virtual/internal%253Aconstants.js", "../misc/renderer.js", "../misc/model-renderer.js", "../core/index.js", "./animator/color-overtime.js", "./animator/curve-range.js", "./animator/force-overtime.js", "./animator/gradient-range.js", "./animator/limit-velocity-overtime.js", "./animator/rotation-overtime.js", "./animator/size-overtime.js", "./animator/texture-animation.js", "./animator/velocity-overtime.js", "./burst.js", "./emitter/shape-module.js", "./enum.js", "./particle-general-function.js", "./renderer/particle-system-renderer-data.js", "./renderer/trail.js", "./particle.js", "../scene-graph/node-enum.js", "./particle-culler.js", "./animator/noise-module.js", "../game/director.js"], function (_export, _context) {
  "use strict";

  var ccclass, help, executeInEditMode, executionOrder, menu, tooltip, displayOrder, type, range, displayName, formerlySerializedAs, override, radian, serializable, visible, EDITOR, EDITOR_NOT_IN_PREVIEW, Renderer, ModelRenderer, Mat4, pseudoRandom, Quat, randomRangeInt, Vec2, Vec3, CCBoolean, CCFloat, bits, geometry, warn, ColorOverLifetimeModule, CurveRange, Mode, ForceOvertimeModule, GradientRange, LimitVelocityOvertimeModule, RotationOvertimeModule, SizeOvertimeModule, TextureAnimationModule, VelocityOvertimeModule, Burst, ShapeModule, ParticleCullingMode, ParticleSpace, particleEmitZAxis, ParticleSystemRenderer, TrailModule, PARTICLE_MODULE_PROPERTY, TransformBit, ParticleCuller, NoiseModule, director, DirectorEvent, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _dec23, _dec24, _dec25, _dec26, _dec27, _dec28, _dec29, _dec30, _dec31, _dec32, _dec33, _dec34, _dec35, _dec36, _dec37, _dec38, _dec39, _dec40, _dec41, _dec42, _dec43, _dec44, _dec45, _dec46, _dec47, _dec48, _dec49, _dec50, _dec51, _dec52, _dec53, _dec54, _dec55, _dec56, _dec57, _dec58, _dec59, _dec60, _dec61, _dec62, _dec63, _dec64, _dec65, _dec66, _dec67, _dec68, _dec69, _dec70, _dec71, _dec72, _dec73, _dec74, _dec75, _dec76, _dec77, _dec78, _dec79, _dec80, _dec81, _dec82, _dec83, _dec84, _dec85, _dec86, _dec87, _dec88, _dec89, _dec90, _dec91, _dec92, _dec93, _dec94, _dec95, _dec96, _dec97, _dec98, _dec99, _dec100, _dec101, _dec102, _dec103, _dec104, _dec105, _dec106, _dec107, _dec108, _dec109, _dec110, _dec111, _dec112, _dec113, _dec114, _dec115, _dec116, _dec117, _dec118, _dec119, _dec120, _dec121, _dec122, _dec123, _dec124, _dec125, _dec126, _dec127, _dec128, _dec129, _dec130, _dec131, _dec132, _dec133, _dec134, _dec135, _dec136, _dec137, _dec138, _dec139, _dec140, _dec141, _dec142, _dec143, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor0, _descriptor1, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15, _descriptor16, _descriptor17, _descriptor18, _descriptor19, _descriptor20, _descriptor21, _descriptor22, _descriptor23, _descriptor24, _descriptor25, _descriptor26, _descriptor27, _descriptor28, _descriptor29, _descriptor30, _descriptor31, _descriptor32, _descriptor33, _descriptor34, _descriptor35, _descriptor36, _descriptor37, _descriptor38, _descriptor39, _ParticleSystem, _world_mat, _world_rol, superMaterials, ParticleSystem;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      help = _coreDataDecoratorsIndexJs.help;
      executeInEditMode = _coreDataDecoratorsIndexJs.executeInEditMode;
      executionOrder = _coreDataDecoratorsIndexJs.executionOrder;
      menu = _coreDataDecoratorsIndexJs.menu;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
      displayOrder = _coreDataDecoratorsIndexJs.displayOrder;
      type = _coreDataDecoratorsIndexJs.type;
      range = _coreDataDecoratorsIndexJs.range;
      displayName = _coreDataDecoratorsIndexJs.displayName;
      formerlySerializedAs = _coreDataDecoratorsIndexJs.formerlySerializedAs;
      override = _coreDataDecoratorsIndexJs.override;
      radian = _coreDataDecoratorsIndexJs.radian;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      visible = _coreDataDecoratorsIndexJs.visible;
    }, function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
      EDITOR_NOT_IN_PREVIEW = _virtualInternal253AconstantsJs.EDITOR_NOT_IN_PREVIEW;
    }, function (_miscRendererJs) {
      Renderer = _miscRendererJs.Renderer;
    }, function (_miscModelRendererJs) {
      ModelRenderer = _miscModelRendererJs.ModelRenderer;
    }, function (_coreIndexJs) {
      Mat4 = _coreIndexJs.Mat4;
      pseudoRandom = _coreIndexJs.pseudoRandom;
      Quat = _coreIndexJs.Quat;
      randomRangeInt = _coreIndexJs.randomRangeInt;
      Vec2 = _coreIndexJs.Vec2;
      Vec3 = _coreIndexJs.Vec3;
      CCBoolean = _coreIndexJs.CCBoolean;
      CCFloat = _coreIndexJs.CCFloat;
      bits = _coreIndexJs.bits;
      geometry = _coreIndexJs.geometry;
      warn = _coreIndexJs.warn;
    }, function (_animatorColorOvertimeJs) {
      ColorOverLifetimeModule = _animatorColorOvertimeJs.default;
    }, function (_animatorCurveRangeJs) {
      CurveRange = _animatorCurveRangeJs.default;
      Mode = _animatorCurveRangeJs.Mode;
    }, function (_animatorForceOvertimeJs) {
      ForceOvertimeModule = _animatorForceOvertimeJs.default;
    }, function (_animatorGradientRangeJs) {
      GradientRange = _animatorGradientRangeJs.default;
    }, function (_animatorLimitVelocityOvertimeJs) {
      LimitVelocityOvertimeModule = _animatorLimitVelocityOvertimeJs.default;
    }, function (_animatorRotationOvertimeJs) {
      RotationOvertimeModule = _animatorRotationOvertimeJs.default;
    }, function (_animatorSizeOvertimeJs) {
      SizeOvertimeModule = _animatorSizeOvertimeJs.default;
    }, function (_animatorTextureAnimationJs) {
      TextureAnimationModule = _animatorTextureAnimationJs.default;
    }, function (_animatorVelocityOvertimeJs) {
      VelocityOvertimeModule = _animatorVelocityOvertimeJs.default;
    }, function (_burstJs) {
      Burst = _burstJs.default;
    }, function (_emitterShapeModuleJs) {
      ShapeModule = _emitterShapeModuleJs.default;
    }, function (_enumJs) {
      ParticleCullingMode = _enumJs.ParticleCullingMode;
      ParticleSpace = _enumJs.ParticleSpace;
    }, function (_particleGeneralFunctionJs) {
      particleEmitZAxis = _particleGeneralFunctionJs.particleEmitZAxis;
    }, function (_rendererParticleSystemRendererDataJs) {
      ParticleSystemRenderer = _rendererParticleSystemRendererDataJs.default;
    }, function (_rendererTrailJs) {
      TrailModule = _rendererTrailJs.default;
    }, function (_particleJs) {
      PARTICLE_MODULE_PROPERTY = _particleJs.PARTICLE_MODULE_PROPERTY;
    }, function (_sceneGraphNodeEnumJs) {
      TransformBit = _sceneGraphNodeEnumJs.TransformBit;
    }, function (_particleCullerJs) {
      ParticleCuller = _particleCullerJs.ParticleCuller;
    }, function (_animatorNoiseModuleJs) {
      NoiseModule = _animatorNoiseModuleJs.NoiseModule;
    }, function (_gameDirectorJs) {
      director = _gameDirectorJs.director;
      DirectorEvent = _gameDirectorJs.DirectorEvent;
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
      // eslint-disable-next-line max-len
      _world_mat = new Mat4();
      _world_rol = new Quat();
      superMaterials = Object.getOwnPropertyDescriptor(Renderer.prototype, 'sharedMaterials');
      /**
       * @en
       * Particle system component, which can make many effects such as smoke and fire.
       * Include some interesting modules and components such as Velocity Overtime, Force Overtime, Trail and Noise.
       * You can open these modules to see how the particles animate.
       * @zh
       * 粒子系统能够用来制作许多特效，例如 烟雾和火焰。
       * 包含一些有趣的模块，例如 速度模块，受力模块，拖尾模块和噪声模块。
       * 打开这些模块可以看到粒子如何进行变化。
       */
      _export("ParticleSystem", ParticleSystem = (_dec = ccclass('cc.ParticleSystem'), _dec2 = help('i18n:cc.ParticleSystem'), _dec3 = menu('Effects/ParticleSystem'), _dec4 = executionOrder(99), _dec5 = range([0, Number.POSITIVE_INFINITY, 1]), _dec6 = displayOrder(1), _dec7 = tooltip('i18n:particle_system.capacity'), _dec8 = type(GradientRange), _dec9 = displayOrder(8), _dec0 = tooltip('i18n:particle_system.startColor'), _dec1 = type(ParticleSpace), _dec10 = displayOrder(9), _dec11 = tooltip('i18n:particle_system.scaleSpace'), _dec12 = displayOrder(10), _dec13 = tooltip('i18n:particle_system.startSize3D'), _dec14 = formerlySerializedAs('startSize'), _dec15 = range([0, Number.POSITIVE_INFINITY]), _dec16 = type(CurveRange), _dec17 = displayOrder(10), _dec18 = tooltip('i18n:particle_system.startSizeX'), _dec19 = type(CurveRange), _dec20 = range([0, Number.POSITIVE_INFINITY]), _dec21 = displayOrder(10), _dec22 = tooltip('i18n:particle_system.startSizeY'), _dec23 = visible(function () {
        return this.startSize3D;
      }), _dec24 = type(CurveRange), _dec25 = range([0, Number.POSITIVE_INFINITY]), _dec26 = displayOrder(10), _dec27 = tooltip('i18n:particle_system.startSizeZ'), _dec28 = visible(function () {
        return this.startSize3D;
      }), _dec29 = type(CurveRange), _dec30 = displayOrder(11), _dec31 = tooltip('i18n:particle_system.startSpeed'), _dec32 = displayOrder(12), _dec33 = tooltip('i18n:particle_system.startRotation3D'), _dec34 = type(CurveRange), _dec35 = displayOrder(12), _dec36 = tooltip('i18n:particle_system.startRotationX'), _dec37 = visible(function () {
        return this.startRotation3D;
      }), _dec38 = type(CurveRange), _dec39 = displayOrder(12), _dec40 = tooltip('i18n:particle_system.startRotationY'), _dec41 = visible(function () {
        return this.startRotation3D;
      }), _dec42 = type(CurveRange), _dec43 = formerlySerializedAs('startRotation'), _dec44 = displayOrder(12), _dec45 = tooltip('i18n:particle_system.startRotationZ'), _dec46 = type(CurveRange), _dec47 = range([0, Number.POSITIVE_INFINITY]), _dec48 = displayOrder(6), _dec49 = tooltip('i18n:particle_system.startDelay'), _dec50 = type(CurveRange), _dec51 = range([0, Number.POSITIVE_INFINITY]), _dec52 = displayOrder(7), _dec53 = tooltip('i18n:particle_system.startLifetime'), _dec54 = displayOrder(0), _dec55 = tooltip('i18n:particle_system.duration'), _dec56 = displayOrder(2), _dec57 = tooltip('i18n:particle_system.loop'), _dec58 = displayOrder(3), _dec59 = tooltip('i18n:particle_system.prewarm'), _dec60 = type(ParticleSpace), _dec61 = displayOrder(4), _dec62 = tooltip('i18n:particle_system.simulationSpace'), _dec63 = displayOrder(5), _dec64 = tooltip('i18n:particle_system.simulationSpeed'), _dec65 = displayOrder(2), _dec66 = tooltip('i18n:particle_system.playOnAwake'), _dec67 = type(CurveRange), _dec68 = displayOrder(13), _dec69 = tooltip('i18n:particle_system.gravityModifier'), _dec70 = type(CurveRange), _dec71 = range([0, Number.POSITIVE_INFINITY]), _dec72 = displayOrder(14), _dec73 = tooltip('i18n:particle_system.rateOverTime'), _dec74 = type(CurveRange), _dec75 = range([0, Number.POSITIVE_INFINITY]), _dec76 = displayOrder(15), _dec77 = tooltip('i18n:particle_system.rateOverDistance'), _dec78 = type([Burst]), _dec79 = displayOrder(16), _dec80 = tooltip('i18n:particle_system.bursts'), _dec81 = type(CCBoolean), _dec82 = displayOrder(27), _dec83 = tooltip('i18n:particle_system.renderCulling'), _dec84 = type(ParticleCullingMode), _dec85 = displayOrder(17), _dec86 = tooltip('i18n:particle_system.cullingMode'), _dec87 = type(CCFloat), _dec88 = displayOrder(17), _dec89 = tooltip('i18n:particle_system.aabbHalfX'), _dec90 = type(CCFloat), _dec91 = displayOrder(17), _dec92 = tooltip('i18n:particle_system.aabbHalfY'), _dec93 = type(CCFloat), _dec94 = displayOrder(17), _dec95 = tooltip('i18n:particle_system.aabbHalfZ'), _dec96 = displayOrder(28), _dec97 = tooltip('i18n:particle_system.dataCulling'), _dec98 = formerlySerializedAs('enableCulling'), _dec99 = visible(false), _dec100 = displayName('Materials'), _dec101 = type(ColorOverLifetimeModule), _dec102 = type(ColorOverLifetimeModule), _dec103 = displayOrder(23), _dec104 = tooltip('i18n:particle_system.colorOverLifetimeModule'), _dec105 = type(ShapeModule), _dec106 = type(ShapeModule), _dec107 = displayOrder(17), _dec108 = tooltip('i18n:particle_system.shapeModule'), _dec109 = type(SizeOvertimeModule), _dec110 = type(SizeOvertimeModule), _dec111 = displayOrder(21), _dec112 = tooltip('i18n:particle_system.sizeOvertimeModule'), _dec113 = type(VelocityOvertimeModule), _dec114 = type(VelocityOvertimeModule), _dec115 = displayOrder(18), _dec116 = tooltip('i18n:particle_system.velocityOvertimeModule'), _dec117 = type(ForceOvertimeModule), _dec118 = type(ForceOvertimeModule), _dec119 = displayOrder(19), _dec120 = tooltip('i18n:particle_system.forceOvertimeModule'), _dec121 = type(LimitVelocityOvertimeModule), _dec122 = type(LimitVelocityOvertimeModule), _dec123 = displayOrder(20), _dec124 = tooltip('i18n:particle_system.limitVelocityOvertimeModule'), _dec125 = type(RotationOvertimeModule), _dec126 = type(RotationOvertimeModule), _dec127 = displayOrder(22), _dec128 = tooltip('i18n:particle_system.rotationOvertimeModule'), _dec129 = type(TextureAnimationModule), _dec130 = type(TextureAnimationModule), _dec131 = displayOrder(24), _dec132 = tooltip('i18n:particle_system.textureAnimationModule'), _dec133 = type(NoiseModule), _dec134 = type(NoiseModule), _dec135 = displayOrder(24), _dec136 = tooltip('i18n:particle_system.noiseModule'), _dec137 = type(TrailModule), _dec138 = type(TrailModule), _dec139 = displayOrder(25), _dec140 = tooltip('i18n:particle_system.trailModule'), _dec141 = type(ParticleSystemRenderer), _dec142 = displayOrder(26), _dec143 = tooltip('i18n:particle_system.renderer'), _dec(_class = _dec2(_class = _dec3(_class = _dec4(_class = executeInEditMode(_class = (_class2 = (_ParticleSystem = class ParticleSystem extends ModelRenderer {
        /**
         * @en Maximum particle capacity to generate.
         * @zh 粒子系统能生成的最大粒子数量。
         */
        get capacity() {
          return this._capacity;
        }
        set capacity(val) {
          this._capacity = Math.floor(val > 0 ? val : 0);
          if (this.processor && this.processor.model) {
            this.processor.model.setCapacity(this._capacity);
          }
        }

        /**
         * @en The initial color of the particle.
         * @zh 粒子初始颜色。
         */

        /**
         * @en Play one round before start this particle system.
         * @zh 选中之后，粒子系统会以已播放完一轮之后的状态开始播放（仅当循环播放启用时有效）。
         */
        get prewarm() {
          return this._prewarm;
        }
        set prewarm(val) {
          if (val === true && this.loop === false) {
            // console.warn('prewarm only works if loop is also enabled.');
          }
          this._prewarm = val;
        }

        /**
         * @en The simulation space of the particle system, it could be world, local or custom.
         * @zh 选择粒子系统所在的坐标系[[Space]]。<br>
         */
        get simulationSpace() {
          return this._simulationSpace;
        }
        set simulationSpace(val) {
          if (val !== this._simulationSpace) {
            this._simulationSpace = val;
            if (this.processor) {
              this.processor.updateMaterialParams();
              this.processor.updateTrailMaterial();
            }
          }
        }

        /**
         * @en The simulation speed of the particle system.
         * @zh 控制整个粒子系统的更新速度。
         */

        /**
         * @en Enable particle culling switch. Open it to enable particle culling.
         * If enabled will generate emitter bounding box and emitters outside the frustum will be culled.
         * @zh 粒子剔除开关，如果打开将会生成一个发射器包围盒，包围盒在相机外发射器将被剔除。
         */
        set renderCulling(value) {
          this._renderCulling = value;
          if (value) {
            if (!this._boundingBox) {
              this._boundingBox = new geometry.AABB();
              this._calculateBounding(false);
            }
          }
        }
        get renderCulling() {
          return this._renderCulling;
        }
        /**
         * @en Particle culling mode option. Includes pause, pause and catchup, always simulate.
         * @zh 粒子剔除模式选择。包括暂停模拟，暂停以后快进继续以及不间断模拟。
         */
        get cullingMode() {
          return this._cullingMode;
        }
        set cullingMode(value) {
          this._cullingMode = value;
        }
        /**
         * @en Particle bounding box half width.
         * @zh 粒子包围盒半宽。
         */
        get aabbHalfX() {
          const res = this.getBoundingX();
          if (res) {
            return res;
          } else {
            return 0;
          }
        }
        set aabbHalfX(value) {
          this.setBoundingX(value);
        }
        /**
         * @en Particle bounding box half height.
         * @zh 粒子包围盒半高。
         */
        get aabbHalfY() {
          const res = this.getBoundingY();
          if (res) {
            return res;
          } else {
            return 0;
          }
        }
        set aabbHalfY(value) {
          this.setBoundingY(value);
        }
        /**
         * @en Particle bounding box half depth.
         * @zh 粒子包围盒半深。
         */
        get aabbHalfZ() {
          const res = this.getBoundingZ();
          if (res) {
            return res;
          } else {
            return 0;
          }
        }
        set aabbHalfZ(value) {
          this.setBoundingZ(value);
        }
        /**
         * @en Culling module data before serialize.
         * @zh 序列化之前剔除不需要的模块数据。
         */
        get dataCulling() {
          return this._dataCulling;
        }
        set dataCulling(value) {
          this._dataCulling = value;
        }
        get sharedMaterials() {
          // if we don't create an array copy, the editor will modify the original array directly.
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return superMaterials.get.call(this);
        }
        set sharedMaterials(val) {
          // TODO: can we assert that superMaterials.set is defined ?
          superMaterials.set.call(this, val);
        }

        // color over lifetime module

        /**
         * @en The module controlling particle's color over life time.
         * @zh 颜色控制模块。
         */
        get colorOverLifetimeModule() {
          if (EDITOR_NOT_IN_PREVIEW) {
            if (!this._colorOverLifetimeModule) {
              this._colorOverLifetimeModule = new ColorOverLifetimeModule();
              this._colorOverLifetimeModule.bindTarget(this.processor);
            }
          }
          return this._colorOverLifetimeModule;
        }
        set colorOverLifetimeModule(val) {
          if (!val) return;
          this._colorOverLifetimeModule = val;
        }

        // shape module

        /**
         * @en The module controlling emitter's shape.
         * @zh 粒子发射器模块。
         */
        get shapeModule() {
          if (EDITOR_NOT_IN_PREVIEW) {
            if (!this._shapeModule) {
              this._shapeModule = new ShapeModule();
              this._shapeModule.onInit(this);
            }
          }
          return this._shapeModule;
        }
        set shapeModule(val) {
          if (!val) return;
          this._shapeModule = val;
        }

        // size over lifetime module

        /**
         * @en The module controlling particle's size over time.
         * @zh 粒子大小模块。
         */
        get sizeOvertimeModule() {
          if (EDITOR_NOT_IN_PREVIEW) {
            if (!this._sizeOvertimeModule) {
              this._sizeOvertimeModule = new SizeOvertimeModule();
              this._sizeOvertimeModule.bindTarget(this.processor);
            }
          }
          return this._sizeOvertimeModule;
        }
        set sizeOvertimeModule(val) {
          if (!val) return;
          this._sizeOvertimeModule = val;
        }

        // velocity overtime module

        /**
         * @en The module controlling particle's velocity over time.
         * @zh 粒子速度模块。
         */
        get velocityOvertimeModule() {
          if (EDITOR_NOT_IN_PREVIEW) {
            if (!this._velocityOvertimeModule) {
              this._velocityOvertimeModule = new VelocityOvertimeModule();
              this._velocityOvertimeModule.bindTarget(this.processor);
            }
          }
          return this._velocityOvertimeModule;
        }
        set velocityOvertimeModule(val) {
          if (!val) return;
          this._velocityOvertimeModule = val;
        }

        // force overTime module

        /**
         * @en The module controlling the force applied to particles over time.
         * @zh 粒子加速度模块。
         */
        get forceOvertimeModule() {
          if (EDITOR_NOT_IN_PREVIEW) {
            if (!this._forceOvertimeModule) {
              this._forceOvertimeModule = new ForceOvertimeModule();
              this._forceOvertimeModule.bindTarget(this.processor);
            }
          }
          return this._forceOvertimeModule;
        }
        set forceOvertimeModule(val) {
          if (!val) return;
          this._forceOvertimeModule = val;
        }

        // limit velocity overtime module

        /**
         * @en The module which limits the velocity applied to particles over time, only supported in CPU particle system.
         * @zh 粒子限制速度模块（只支持 CPU 粒子）。
         */
        get limitVelocityOvertimeModule() {
          if (EDITOR_NOT_IN_PREVIEW) {
            if (!this._limitVelocityOvertimeModule) {
              this._limitVelocityOvertimeModule = new LimitVelocityOvertimeModule();
              this._limitVelocityOvertimeModule.bindTarget(this.processor);
            }
          }
          return this._limitVelocityOvertimeModule;
        }
        set limitVelocityOvertimeModule(val) {
          if (!val) return;
          this._limitVelocityOvertimeModule = val;
        }

        // rotation overtime module

        /**
         * @en The module controlling the rotation of particles over time.
         * @zh 粒子旋转模块。
         */
        get rotationOvertimeModule() {
          if (EDITOR_NOT_IN_PREVIEW) {
            if (!this._rotationOvertimeModule) {
              this._rotationOvertimeModule = new RotationOvertimeModule();
              this._rotationOvertimeModule.bindTarget(this.processor);
            }
          }
          return this._rotationOvertimeModule;
        }
        set rotationOvertimeModule(val) {
          if (!val) return;
          this._rotationOvertimeModule = val;
        }

        // texture animation module

        /**
         * @en The module controlling the texture animation of particles.
         * @zh 贴图动画模块。
         */
        get textureAnimationModule() {
          if (EDITOR_NOT_IN_PREVIEW) {
            if (!this._textureAnimationModule) {
              this._textureAnimationModule = new TextureAnimationModule();
              this._textureAnimationModule.bindTarget(this.processor);
            }
          }
          return this._textureAnimationModule;
        }
        set textureAnimationModule(val) {
          if (!val) return;
          this._textureAnimationModule = val;
        }

        // noise module
        /**
         * @en Noise module which can add some interesting effects.
         * @zh 噪声模块能够增加许多有趣的特效。
         */

        /**
         * @en The module controlling noise map applied to the particles, only supported in CPU particle system.
         * @zh 噪声动画模块，仅支持 CPU 粒子。
         */
        get noiseModule() {
          if (EDITOR) {
            if (!this._noiseModule) {
              this._noiseModule = new NoiseModule();
              this._noiseModule.bindTarget(this.processor);
            }
          }
          return this._noiseModule;
        }
        set noiseModule(val) {
          if (!val) return;
          this._noiseModule = val;
        }

        // trail module

        /**
         * @en The module controlling the trail module.
         * @zh 粒子轨迹模块。
         */
        get trailModule() {
          if (EDITOR_NOT_IN_PREVIEW) {
            if (!this._trailModule) {
              this._trailModule = new TrailModule();
            }
          }
          return this._trailModule;
        }
        set trailModule(val) {
          if (!val) return;
          this._trailModule = val;
        }

        // particle system renderer
        /**
         * @en Particle system renderer (CPU or GPU).
         * @zh 粒子系统渲染器（CPU 还是 GPU）。
         */

        constructor() {
          super();
          _initializerDefineProperty(this, "startColor", _descriptor, this);
          /**
           * @en The space of particle scaling.
           * @zh 计算粒子缩放的空间。
           */
          _initializerDefineProperty(this, "scaleSpace", _descriptor2, this);
          /**
           * @en Whether to modify particle size on XYZ axis.
           * @zh 是否需要修改粒子在三个轴上的大小。
           */
          _initializerDefineProperty(this, "startSize3D", _descriptor3, this);
          /**
           * @en The initial X size of the particle.
           * @zh 粒子初始x轴方向大小。
           */
          _initializerDefineProperty(this, "startSizeX", _descriptor4, this);
          /**
           * @en The initial Y size of the particle.
           * @zh 粒子初始y轴方向大小。
           */
          _initializerDefineProperty(this, "startSizeY", _descriptor5, this);
          /**
           * @en The initial Z size of the particle.
           * @zh 粒子初始z轴方向大小。
           */
          _initializerDefineProperty(this, "startSizeZ", _descriptor6, this);
          /**
           * @en The initial velocity of the particle.
           * @zh 粒子初始速度。
           */
          _initializerDefineProperty(this, "startSpeed", _descriptor7, this);
          /**
           * @en Whether to modify particle rotation on XYZ axis.
           * @zh 是否需要修改粒子在三个轴上的旋转。
           */
          _initializerDefineProperty(this, "startRotation3D", _descriptor8, this);
          /**
           * @en The initial rotation angle of the particle on X axis.
           * @zh 粒子初始x轴旋转角度。
           */
          _initializerDefineProperty(this, "startRotationX", _descriptor9, this);
          /**
           * @en The initial rotation angle of the particle on Y axis.
           * @zh 粒子初始y轴旋转角度。
           */
          _initializerDefineProperty(this, "startRotationY", _descriptor0, this);
          /**
           * @en The initial rotation angle of the particle on Z axis.
           * @zh 粒子初始z轴旋转角度。
           */
          _initializerDefineProperty(this, "startRotationZ", _descriptor1, this);
          /**
           * @en The time delay to start emission after the particle system starts running.
           * @zh 粒子系统开始运行后，延迟粒子发射的时间。
           */
          _initializerDefineProperty(this, "startDelay", _descriptor10, this);
          /**
           * @en Particle life time.
           * @zh 粒子生命周期。
           */
          _initializerDefineProperty(this, "startLifetime", _descriptor11, this);
          /**
           * @en Particle system emitter duration time.
           * @zh 粒子系统发射器运行时间。
           */
          _initializerDefineProperty(this, "duration", _descriptor12, this);
          /**
           * @en Whether the particle system is looping.
           * @zh 粒子系统是否循环播放。
           */
          _initializerDefineProperty(this, "loop", _descriptor13, this);
          _initializerDefineProperty(this, "simulationSpeed", _descriptor14, this);
          /**
           * @en Automatically start playing after particle system initialized.
           * @zh 粒子系统加载后是否自动开始播放。
           */
          _initializerDefineProperty(this, "playOnAwake", _descriptor15, this);
          /**
           * @en The gravity of the particle system.
           * @zh 粒子受重力影响的重力系数。
           */
          _initializerDefineProperty(this, "gravityModifier", _descriptor16, this);
          // emission module
          /**
           * @en The value curve of emission rate over time.
           * @zh 随时间推移发射的粒子数的变化曲线。
           */
          _initializerDefineProperty(this, "rateOverTime", _descriptor17, this);
          /**
           * @en The value curve of emission rate over distance.
           * @zh 每移动单位距离发射的粒子数的变化曲线。
           */
          _initializerDefineProperty(this, "rateOverDistance", _descriptor18, this);
          /**
           * @en Burst triggers of the particle system.
           * @zh 设定在指定时间发射指定数量的粒子的 burst 的数量。
           */
          _initializerDefineProperty(this, "bursts", _descriptor19, this);
          _initializerDefineProperty(this, "_renderCulling", _descriptor20, this);
          _initializerDefineProperty(this, "_cullingMode", _descriptor21, this);
          _initializerDefineProperty(this, "_aabbHalfX", _descriptor22, this);
          _initializerDefineProperty(this, "_aabbHalfY", _descriptor23, this);
          _initializerDefineProperty(this, "_aabbHalfZ", _descriptor24, this);
          _initializerDefineProperty(this, "_dataCulling", _descriptor25, this);
          _initializerDefineProperty(this, "_colorOverLifetimeModule", _descriptor26, this);
          _initializerDefineProperty(this, "_shapeModule", _descriptor27, this);
          _initializerDefineProperty(this, "_sizeOvertimeModule", _descriptor28, this);
          _initializerDefineProperty(this, "_velocityOvertimeModule", _descriptor29, this);
          _initializerDefineProperty(this, "_forceOvertimeModule", _descriptor30, this);
          _initializerDefineProperty(this, "_limitVelocityOvertimeModule", _descriptor31, this);
          _initializerDefineProperty(this, "_rotationOvertimeModule", _descriptor32, this);
          _initializerDefineProperty(this, "_textureAnimationModule", _descriptor33, this);
          _initializerDefineProperty(this, "_noiseModule", _descriptor34, this);
          _initializerDefineProperty(this, "_trailModule", _descriptor35, this);
          _initializerDefineProperty(this, "renderer", _descriptor36, this);
          _initializerDefineProperty(this, "_prewarm", _descriptor37, this);
          _initializerDefineProperty(this, "_capacity", _descriptor38, this);
          _initializerDefineProperty(this, "_simulationSpace", _descriptor39, this);
          /**
           * @en Particle update processor (update every particle).
           * @zh 粒子更新器（负责更新每个粒子）。
           */
          this.processor = null;
          const self = this;
          self.rateOverTime.constant = 10;
          self.startLifetime.constant = 5;
          self.startSizeX.constant = 1;
          self.startSpeed.constant = 5;

          // internal status
          self._isPlaying = false;
          self._isPaused = false;
          self._isStopped = true;
          self._isEmitting = false;
          self._needToRestart = false;
          self._needRefresh = true;
          self._needAttach = false;
          self._time = 0.0; // playback position in seconds.
          self._emitRateTimeCounter = 0.0;
          self._emitRateDistanceCounter = 0.0;
          self._oldWPos = new Vec3();
          self._curWPos = new Vec3();
          self._boundingBox = null;
          self._culler = null;
          self._oldPos = null;
          self._curPos = null;
          self._isCulled = false;
          self._isSimulating = true;
          self._customData1 = new Vec2();
          self._customData2 = new Vec2();
          self._subEmitters = []; // array of { emitter: ParticleSystem, type: 'birth', 'collision' or 'death'}
        }
        onFocusInEditor() {
          this.renderer.create(this);
        }
        onLoad() {
          // HACK, TODO
          this.renderer.onInit(this);
          if (this._shapeModule) this._shapeModule.onInit(this);
          if (this._trailModule && !this.renderer.useGPU && this._trailModule.enable) {
            this._trailModule.onInit(this);
          }
          this.bindModule();
          this._resetPosition();

          // this._system.add(this);
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        _onMaterialModified(index, material) {
          if (this.processor !== null) {
            this.processor.onMaterialModified(index, material);
          }
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        _onRebuildPSO(index, material) {
          this.processor.onRebuildPSO(index, material);
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        _collectModels() {
          this._models.length = 0;
          this._models.push(this.processor.model);
          if (this._trailModule && this._trailModule.enable && this._trailModule.getModel()) {
            this._models.push(this._trailModule.getModel());
          }
          return this._models;
        }
        _attachToScene() {
          this.processor.attachToScene();
          if (this._trailModule && this._trailModule.enable) {
            this._trailModule._attachToScene();
          }
        }

        /**
         * @engineInternal
         * @mangle
         */
        _detachFromScene() {
          this.processor.detachFromScene();
          if (this._trailModule && this._trailModule.enable) {
            this._trailModule._detachFromScene();
          }
          if (this._boundingBox) {
            this._boundingBox = null;
          }
          if (this._culler) {
            this._culler.clear();
            this._culler.destroy();
            this._culler = null;
          }
        }

        /**
         * @en Bind module to particle processor.
         * @zh 把模块绑定到粒子更新函数上。
         */
        bindModule() {
          if (this._colorOverLifetimeModule) this._colorOverLifetimeModule.bindTarget(this.processor);
          if (this._sizeOvertimeModule) this._sizeOvertimeModule.bindTarget(this.processor);
          if (this._rotationOvertimeModule) this._rotationOvertimeModule.bindTarget(this.processor);
          if (this._forceOvertimeModule) this._forceOvertimeModule.bindTarget(this.processor);
          if (this._limitVelocityOvertimeModule) this._limitVelocityOvertimeModule.bindTarget(this.processor);
          if (this._velocityOvertimeModule) this._velocityOvertimeModule.bindTarget(this.processor);
          if (this._textureAnimationModule) this._textureAnimationModule.bindTarget(this.processor);
          if (this._noiseModule) this._noiseModule.bindTarget(this.processor);
        }

        // TODO: Fast forward current particle system by simulating particles over given period of time, then pause it.
        // simulate(time, withChildren, restart, fixedTimeStep) {

        // }

        /**
         * @en Play particle system.
         * @zh 播放粒子效果。
         */
        play() {
          if (this._needToRestart) {
            this.reset();
            this._needToRestart = false;
          }
          if (this._isPaused) {
            this._isPaused = false;
          }
          if (this._isStopped) {
            this._isStopped = false;
          }
          this._isPlaying = true;
          this._isEmitting = true;
          this._resetPosition();

          // prewarm
          if (this._prewarm) {
            this._prewarmSystem();
          }
          if (this._trailModule) {
            this._trailModule.play();
          }
          if (this.processor) {
            const model = this.processor.getModel();
            if (model) {
              model.enabled = this.enabledInHierarchy;
            }
          }
        }

        /**
         * @en Pause particle system.
         * @zh 暂停播放粒子效果。
         */
        pause() {
          if (this._isStopped) {
            warn('pause(): particle system is already stopped.');
            return;
          }
          if (this._isPlaying) {
            this._isPlaying = false;
          }
          this._isPaused = true;
        }

        /**
         * @zh 停止发射粒子。
         * @en Stop emitting particles.
         */
        stopEmitting() {
          this._isEmitting = false;
          this._needToRestart = true;
        }

        /**
         * @en Stop particle system.
         * @zh 停止播放粒子。
         */
        stop() {
          if (this._isPlaying || this._isPaused) {
            this.clear();
          }
          if (this._isPlaying) {
            this._isPlaying = false;
          }
          if (this._isPaused) {
            this._isPaused = false;
          }
          if (this._isEmitting) {
            this._isEmitting = false;
          }
          this._isStopped = true;

          // if stop emit modify the refresh flag to true
          this._needRefresh = true;
          this.reset();
        }
        reset() {
          this._time = 0.0;
          this._emitRateTimeCounter = 0.0;
          this._emitRateDistanceCounter = 0.0;
          this._resetPosition();
          this.bursts.forEach(burst => {
            burst.reset();
          });
        }

        /**
         * @en remove all particles from current particle system.
         * @zh 将所有粒子从粒子系统中清除。
         */
        clear() {
          if (this.enabledInHierarchy) {
            this.processor.clear();
            if (this._trailModule) this._trailModule.clear();
          }
          this._calculateBounding(false);
        }

        /**
         * @en Get current particle capacity.
         * @zh 获取当前粒子数量。
         */
        getParticleCount() {
          if (this.processor) {
            return this.processor.getParticleCount();
          } else {
            return 0;
          }
        }

        /**
         * @ignore
         */
        setCustomData1(x, y) {
          Vec2.set(this._customData1, x, y);
        }

        /**
         * @ignore
         */
        setCustomData2(x, y) {
          Vec2.set(this._customData2, x, y);
        }
        onDestroy() {
          var _this$processor$getMo;
          this.stop();
          if ((_this$processor$getMo = this.processor.getModel()) != null && _this$processor$getMo.scene) {
            this.processor.detachFromScene();
            if (this._trailModule && this._trailModule.enable) {
              this._trailModule._detachFromScene();
            }
          }
          director.off(DirectorEvent.BEFORE_COMMIT, this.beforeRender, this);
          // this._system.remove(this);
          this.processor.onDestroy();
          if (this._trailModule) this._trailModule.destroy();
          if (this._culler) {
            this._culler.clear();
            this._culler.destroy();
            this._culler = null;
          }
        }
        onEnable() {
          super.onEnable();
          director.on(DirectorEvent.BEFORE_COMMIT, this.beforeRender, this);
          if (this.playOnAwake && !EDITOR_NOT_IN_PREVIEW) {
            this.play();
          }
          this.processor.onEnable();
          if (this._trailModule) this._trailModule.onEnable();
        }
        onDisable() {
          director.off(DirectorEvent.BEFORE_COMMIT, this.beforeRender, this);
          this.processor.onDisable();
          if (this._trailModule) this._trailModule.onDisable();
          if (this._boundingBox) {
            this._boundingBox = null;
          }
          this._oldPos = null;
          if (this._culler) {
            this._culler.clear();
            this._culler.destroy();
            this._culler = null;
          }
        }
        _calculateBounding(forceRefresh) {
          const self = this;
          if (self._boundingBox) {
            if (!self._culler) {
              self._culler = new ParticleCuller(self);
            }
            self._culler.calculatePositions();
            geometry.AABB.fromPoints(self._boundingBox, self._culler.minPos, self._culler.maxPos);
            if (forceRefresh) {
              self.aabbHalfX = self._boundingBox.halfExtents.x;
              self.aabbHalfY = self._boundingBox.halfExtents.y;
              self.aabbHalfZ = self._boundingBox.halfExtents.z;
            } else {
              if (self.aabbHalfX) {
                self.setBoundingX(self.aabbHalfX);
              } else {
                self.aabbHalfX = self._boundingBox.halfExtents.x;
              }
              if (self.aabbHalfY) {
                self.setBoundingY(self.aabbHalfY);
              } else {
                self.aabbHalfY = self._boundingBox.halfExtents.y;
              }
              if (self.aabbHalfZ) {
                self.setBoundingZ(self.aabbHalfZ);
              } else {
                self.aabbHalfZ = self._boundingBox.halfExtents.z;
              }
            }
            self._culler.clear();
          }
        }
        update(dt) {
          const self = this;
          const thisProcessor = self.processor;
          const thisTrailModule = self.trailModule;
          const scaledDeltaTime = dt * self.simulationSpeed;
          if (!self.renderCulling) {
            if (self._boundingBox) {
              self._boundingBox = null;
            }
            if (self._culler) {
              self._culler.clear();
              self._culler.destroy();
              self._culler = null;
            }
            self._isSimulating = true;
          } else {
            if (!self._boundingBox) {
              self._boundingBox = new geometry.AABB();
              self._calculateBounding(false);
            }
            if (!self._curPos) {
              self._curPos = new Vec3();
            }
            self.node.getWorldPosition(self._curPos);
            if (!self._oldPos) {
              self._oldPos = new Vec3();
              self._oldPos.set(self._curPos);
            }
            const thisCurPos = self._curPos;
            const thisOldPos = self._oldPos;
            if (!thisCurPos.equals(thisOldPos) && self._boundingBox && self._culler) {
              const dx = thisCurPos.x - thisOldPos.x;
              const dy = thisCurPos.y - thisOldPos.y;
              const dz = thisCurPos.z - thisOldPos.z;
              const center = self._boundingBox.center;
              center.x += dx;
              center.y += dy;
              center.z += dz;
              self._culler.setBoundingBoxCenter(center.x, center.y, center.z);
              thisOldPos.set(thisCurPos);
            }
            const renderScene = self.node.scene.renderScene;
            const cameraLst = renderScene ? renderScene.cameras : undefined;
            let culled = true;
            if (cameraLst !== undefined && self._boundingBox) {
              for (let i = 0; i < cameraLst.length; ++i) {
                const camera = cameraLst[i];
                const visibility = camera.visibility;
                if ((visibility & self.node.layer) === self.node.layer) {
                  if (EDITOR_NOT_IN_PREVIEW) {
                    if (camera.name === 'Editor Camera' && geometry.intersect.aabbFrustum(self._boundingBox, camera.frustum)) {
                      culled = false;
                      break;
                    }
                  } else if (geometry.intersect.aabbFrustum(self._boundingBox, camera.frustum)) {
                    culled = false;
                    break;
                  }
                }
              }
            }
            if (culled) {
              if (self._cullingMode !== ParticleCullingMode.AlwaysSimulate) {
                self._isSimulating = false;
              }
              if (!self._isCulled) {
                thisProcessor.detachFromScene();
                self._isCulled = true;
              }
              if (thisTrailModule && thisTrailModule.enable) {
                thisTrailModule._detachFromScene();
              }
              if (self._cullingMode === ParticleCullingMode.PauseAndCatchup) {
                self._time += scaledDeltaTime;
              }
              if (self._cullingMode !== ParticleCullingMode.AlwaysSimulate) {
                return;
              }
            } else {
              if (self._isCulled) {
                self._attachToScene();
                self._isCulled = false;
              }
              if (!self._isSimulating) {
                self._isSimulating = true;
              }
            }
            if (!self._isSimulating) {
              return;
            }
          }
          if (self._isPlaying) {
            self._time += scaledDeltaTime;

            // Execute emission
            self._emit(scaledDeltaTime);

            // simulation, update particles.
            if (thisProcessor.updateParticles(scaledDeltaTime) === 0 && !self._isEmitting) {
              self.stop();
            }
          } else {
            const mat = self.getMaterialInstance(0) || thisProcessor.getDefaultMaterial();
            const pass = mat.passes[0];
            thisProcessor.updateRotation(pass);
            thisProcessor.updateScale(pass);
          }
          if (self._needAttach) {
            // Check whether this particle model should be reattached
            if (self.getParticleCount() > 0) {
              if (!self._isCulled) {
                var _thisProcessor$getMod;
                if (!((_thisProcessor$getMod = thisProcessor.getModel()) != null && _thisProcessor$getMod.scene)) {
                  thisProcessor.attachToScene();
                }
                if (thisTrailModule && thisTrailModule.enable) {
                  var _thisTrailModule$getM;
                  if (!((_thisTrailModule$getM = thisTrailModule.getModel()) != null && _thisTrailModule$getM.scene)) {
                    thisTrailModule._attachToScene();
                  }
                }
                self._needAttach = false;
              }
            }
          }
          if (!self.renderer.useGPU && thisTrailModule && thisTrailModule.enable) {
            if (!thisTrailModule.inited) {
              thisTrailModule.clear();
              thisTrailModule.destroy();
              thisTrailModule.onInit(this);
              // Rebuild trail buffer
              thisTrailModule.enable = false;
              thisTrailModule.enable = true;
            }
          }
        }
        beforeRender() {
          var _thisProcessor$getMod3;
          const self = this;
          const thisProcessor = self.processor;
          const thisTrailModule = self.trailModule;
          if (self.getParticleCount() <= 0) {
            var _thisProcessor$getMod2;
            if ((_thisProcessor$getMod2 = thisProcessor.getModel()) != null && _thisProcessor$getMod2.scene) {
              thisProcessor.detachFromScene();
              if (thisTrailModule && thisTrailModule.enable) {
                thisTrailModule._detachFromScene();
              }
              self._needAttach = false;
            }
          } else if (!((_thisProcessor$getMod3 = thisProcessor.getModel()) != null && _thisProcessor$getMod3.scene)) {
            self._needAttach = true;
          }
          if (!self._isPlaying) return;

          // update render data
          thisProcessor.updateRenderData();
          thisProcessor.beforeRender();
          // update trail
          if (thisTrailModule && thisTrailModule.enable) {
            thisTrailModule.updateRenderData();
            thisTrailModule.beforeRender();
          }
        }
        _onVisibilityChange(val) {
          if (this.processor.model) {
            this.processor.model.visFlags = val;
          }
        }

        /**
         * @engineInternal
         * emit is used in burst.ts, so it should be public and marked as engine internal.
         */
        emit(count, dt) {
          const self = this;
          const node = self.node;
          const loopDelta = self._time % self.duration / self.duration; // loop delta value

          // refresh particle node position to update emit position
          if (self._needRefresh) {
            // this.node.setPosition(this.node.getPosition());
            node.invalidateChildren(TransformBit.POSITION);
            self._needRefresh = false;
          }
          if (self._simulationSpace === ParticleSpace.World) {
            node.getWorldMatrix(_world_mat);
            node.getWorldRotation(_world_rol);
          }
          for (let i = 0; i < count; ++i) {
            const particle = self.processor.getFreeParticle();
            if (particle === null) {
              return;
            }
            particle.particleSystem = self;
            particle.reset();
            const rand = pseudoRandom(randomRangeInt(0, bits.INT_MAX));
            if (self._shapeModule && self._shapeModule.enable) {
              self._shapeModule.emit(particle);
            } else {
              Vec3.set(particle.position, 0, 0, 0);
              Vec3.copy(particle.velocity, particleEmitZAxis);
            }
            if (self._textureAnimationModule && self._textureAnimationModule.enable) {
              self._textureAnimationModule.init(particle);
            }
            const curveStartSpeed = self.startSpeed.evaluate(loopDelta, rand);
            Vec3.multiplyScalar(particle.velocity, particle.velocity, curveStartSpeed);
            if (self._simulationSpace === ParticleSpace.World) {
              Vec3.transformMat4(particle.position, particle.position, _world_mat);
              Vec3.transformQuat(particle.velocity, particle.velocity, _world_rol);
            }
            Vec3.copy(particle.ultimateVelocity, particle.velocity);
            // apply startRotation.
            if (self.startRotation3D) {
              // eslint-disable-next-line max-len
              particle.startEuler.set(self.startRotationX.evaluate(loopDelta, rand), self.startRotationY.evaluate(loopDelta, rand), self.startRotationZ.evaluate(loopDelta, rand));
            } else {
              particle.startEuler.set(0, 0, self.startRotationZ.evaluate(loopDelta, rand));
            }
            particle.rotation.set(particle.startEuler);

            // apply startSize.
            if (self.startSize3D) {
              Vec3.set(particle.startSize, self.startSizeX.evaluate(loopDelta, rand), self.startSizeY.evaluate(loopDelta, rand), self.startSizeZ.evaluate(loopDelta, rand));
            } else {
              Vec3.set(particle.startSize, self.startSizeX.evaluate(loopDelta, rand), 1, 1);
              particle.startSize.y = particle.startSize.x;
            }
            Vec3.copy(particle.size, particle.startSize);

            // apply startColor.
            particle.startColor.set(self.startColor.evaluate(loopDelta, rand));
            particle.color.set(particle.startColor);

            // apply startLifetime.
            particle.startLifetime = self.startLifetime.evaluate(loopDelta, rand) + dt;
            particle.remainingLifetime = particle.startLifetime;
            particle.randomSeed = randomRangeInt(0, 233280);
            particle.loopCount++;
            self.processor.setNewParticle(particle);
          } // end of particles forLoop.
        }

        // initialize particle system as though it had already completed a full cycle.
        _prewarmSystem() {
          this.startDelay.mode = Mode.Constant; // clear startDelay.
          this.startDelay.constant = 0;
          const dt = 1.0; // should use varying value?
          const cnt = this.duration / dt;
          for (let i = 0; i < cnt; ++i) {
            this._time += dt;
            this._emit(dt);
            this.processor.updateParticles(dt);
          }
        }

        // internal function
        _emit(dt) {
          const self = this;
          // emit particles.
          const startDelay = self.startDelay.evaluate(0, 1);
          if (self._time > startDelay) {
            const timeLeft = self._time - (self.duration + startDelay);
            if (timeLeft > dt) {
              // self._time = startDelay; // delay will not be applied from the second loop.(Unity)
              // self._emitRateTimeCounter = 0.0;
              // self._emitRateDistanceCounter = 0.0;
              if (!self.loop) {
                self._isEmitting = false;
              }
            }
            if (!self._isEmitting) return;

            // emit by rateOverTime
            self._emitRateTimeCounter += self.rateOverTime.evaluate(self._time / self.duration, 1) * dt;
            if (self._emitRateTimeCounter > 1) {
              const emitNum = Math.floor(self._emitRateTimeCounter);
              self._emitRateTimeCounter -= emitNum;
              self.emit(emitNum, dt);
            }

            // emit by rateOverDistance
            const rateOverDistance = self.rateOverDistance.evaluate(self._time / self.duration, 1);
            if (rateOverDistance > 0) {
              Vec3.copy(self._oldWPos, self._curWPos);
              self.node.getWorldPosition(self._curWPos);
              const distance = Vec3.distance(self._curWPos, self._oldWPos);
              self._emitRateDistanceCounter += distance * rateOverDistance;
            }
            if (self._emitRateDistanceCounter > 1) {
              const emitNum = Math.floor(self._emitRateDistanceCounter);
              self._emitRateDistanceCounter -= emitNum;
              self.emit(emitNum, dt);
            }

            // bursts
            if (timeLeft <= 0 || self.loop) {
              for (const burst of self.bursts) {
                burst.update(self, dt);
              }
            }
          }
        }
        _resetPosition() {
          this.node.getWorldPosition(this._oldWPos);
          Vec3.copy(this._curWPos, this._oldWPos);
        }
        addSubEmitter(subEmitter) {
          this._subEmitters.push(subEmitter);
        }
        removeSubEmitter(idx) {
          this._subEmitters.splice(this._subEmitters.indexOf(idx), 1);
        }
        addBurst(burst) {
          this.bursts.push(burst);
        }
        removeBurst(burst) {
          const i = this.bursts.indexOf(burst);
          if (i > -1) {
            this.bursts.splice(i, 1);
          }
        }
        getBoundingX() {
          return this._aabbHalfX;
        }
        getBoundingY() {
          return this._aabbHalfY;
        }
        getBoundingZ() {
          return this._aabbHalfZ;
        }
        setBoundingX(value) {
          if (this._boundingBox && this._culler) {
            this._boundingBox.halfExtents.x = value;
            this._culler.setBoundingBoxSize(this._boundingBox.halfExtents);
            this._aabbHalfX = value;
          }
        }
        setBoundingY(value) {
          if (this._boundingBox && this._culler) {
            this._boundingBox.halfExtents.y = value;
            this._culler.setBoundingBoxSize(this._boundingBox.halfExtents);
            this._aabbHalfY = value;
          }
        }
        setBoundingZ(value) {
          if (this._boundingBox && this._culler) {
            this._boundingBox.halfExtents.z = value;
            this._culler.setBoundingBoxSize(this._boundingBox.halfExtents);
            this._aabbHalfZ = value;
          }
        }

        /**
         * @ignore
         */
        get isPlaying() {
          return this._isPlaying;
        }

        /**
         * @en Query particle system is paused or not.
         * @zh 获取粒子系统当前是否已经暂停运行。
         */
        get isPaused() {
          return this._isPaused;
        }

        /**
         * @en Query particle system is stopped or not.
         * @zh 获取粒子系统当前是否已经停止。
         */
        get isStopped() {
          return this._isStopped;
        }

        /**
         * @en Query particle system is emitting or not.
         * @zh 获取粒子系统当前是否还在发射。
         */
        get isEmitting() {
          return this._isEmitting;
        }

        /**
         * @en Query particle system simulation time.
         * @zh 获取粒子系统运行时间。
         */
        get time() {
          return this._time;
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        _onBeforeSerialize(props) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return this.dataCulling ? props.filter(p => !PARTICLE_MODULE_PROPERTY.includes(p) || this[p] && this[p].enable) : props;
        }

        /**
         * @en Gets the preview of noise texture.
         * @zh 获取噪声图预览。
         * @param width @en Noise texture width @zh 噪声图宽度
         * @param height @en Noise texture height @zh 噪声图高度
         * @returns @en Noise texture RGB pixel array @zh 噪声图 RGB 纹理数组
         */
        getNoisePreview(width, height) {
          const out = [];
          if (this.processor) {
            this.processor.getNoisePreview(out, width, height);
          }
          return out;
        }
      }, _ParticleSystem.CullingMode = ParticleCullingMode, _ParticleSystem), _applyDecoratedDescriptor(_class2.prototype, "capacity", [_dec5, _dec6, _dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "capacity"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "startColor", [_dec8, serializable, _dec9, _dec0], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new GradientRange();
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "scaleSpace", [_dec1, serializable, _dec10, _dec11], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return ParticleSpace.Local;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "startSize3D", [serializable, _dec12, _dec13], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "startSizeX", [_dec14, _dec15, _dec16, _dec17, _dec18], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new CurveRange();
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "startSizeY", [_dec19, serializable, _dec20, _dec21, _dec22, _dec23], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new CurveRange();
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "startSizeZ", [_dec24, serializable, _dec25, _dec26, _dec27, _dec28], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new CurveRange();
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "startSpeed", [_dec29, serializable, _dec30, _dec31], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new CurveRange();
        }
      }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "startRotation3D", [serializable, _dec32, _dec33], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "startRotationX", [_dec34, serializable, radian, _dec35, _dec36, _dec37], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new CurveRange();
        }
      }), _descriptor0 = _applyDecoratedDescriptor(_class2.prototype, "startRotationY", [_dec38, serializable, radian, _dec39, _dec40, _dec41], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new CurveRange();
        }
      }), _descriptor1 = _applyDecoratedDescriptor(_class2.prototype, "startRotationZ", [_dec42, _dec43, radian, _dec44, _dec45], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new CurveRange();
        }
      }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "startDelay", [_dec46, serializable, _dec47, _dec48, _dec49], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new CurveRange();
        }
      }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "startLifetime", [_dec50, serializable, _dec51, _dec52, _dec53], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new CurveRange();
        }
      }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "duration", [serializable, _dec54, _dec55], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 5.0;
        }
      }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "loop", [serializable, _dec56, _dec57], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "prewarm", [_dec58, _dec59], Object.getOwnPropertyDescriptor(_class2.prototype, "prewarm"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "simulationSpace", [_dec60, serializable, _dec61, _dec62], Object.getOwnPropertyDescriptor(_class2.prototype, "simulationSpace"), _class2.prototype), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "simulationSpeed", [serializable, _dec63, _dec64], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1.0;
        }
      }), _descriptor15 = _applyDecoratedDescriptor(_class2.prototype, "playOnAwake", [serializable, _dec65, _dec66], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _descriptor16 = _applyDecoratedDescriptor(_class2.prototype, "gravityModifier", [_dec67, serializable, _dec68, _dec69], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new CurveRange();
        }
      }), _descriptor17 = _applyDecoratedDescriptor(_class2.prototype, "rateOverTime", [_dec70, serializable, _dec71, _dec72, _dec73], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new CurveRange();
        }
      }), _descriptor18 = _applyDecoratedDescriptor(_class2.prototype, "rateOverDistance", [_dec74, serializable, _dec75, _dec76, _dec77], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new CurveRange();
        }
      }), _descriptor19 = _applyDecoratedDescriptor(_class2.prototype, "bursts", [_dec78, serializable, _dec79, _dec80], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "renderCulling", [_dec81, _dec82, _dec83], Object.getOwnPropertyDescriptor(_class2.prototype, "renderCulling"), _class2.prototype), _descriptor20 = _applyDecoratedDescriptor(_class2.prototype, "_renderCulling", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "cullingMode", [_dec84, _dec85, _dec86], Object.getOwnPropertyDescriptor(_class2.prototype, "cullingMode"), _class2.prototype), _descriptor21 = _applyDecoratedDescriptor(_class2.prototype, "_cullingMode", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return ParticleCullingMode.Pause;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "aabbHalfX", [_dec87, _dec88, _dec89], Object.getOwnPropertyDescriptor(_class2.prototype, "aabbHalfX"), _class2.prototype), _descriptor22 = _applyDecoratedDescriptor(_class2.prototype, "_aabbHalfX", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "aabbHalfY", [_dec90, _dec91, _dec92], Object.getOwnPropertyDescriptor(_class2.prototype, "aabbHalfY"), _class2.prototype), _descriptor23 = _applyDecoratedDescriptor(_class2.prototype, "_aabbHalfY", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "aabbHalfZ", [_dec93, _dec94, _dec95], Object.getOwnPropertyDescriptor(_class2.prototype, "aabbHalfZ"), _class2.prototype), _descriptor24 = _applyDecoratedDescriptor(_class2.prototype, "_aabbHalfZ", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "dataCulling", [_dec96, _dec97], Object.getOwnPropertyDescriptor(_class2.prototype, "dataCulling"), _class2.prototype), _descriptor25 = _applyDecoratedDescriptor(_class2.prototype, "_dataCulling", [serializable, _dec98], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "sharedMaterials", [override, _dec99, serializable, _dec100], Object.getOwnPropertyDescriptor(_class2.prototype, "sharedMaterials"), _class2.prototype), _descriptor26 = _applyDecoratedDescriptor(_class2.prototype, "_colorOverLifetimeModule", [_dec101], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "colorOverLifetimeModule", [_dec102, _dec103, _dec104], Object.getOwnPropertyDescriptor(_class2.prototype, "colorOverLifetimeModule"), _class2.prototype), _descriptor27 = _applyDecoratedDescriptor(_class2.prototype, "_shapeModule", [_dec105], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "shapeModule", [_dec106, _dec107, _dec108], Object.getOwnPropertyDescriptor(_class2.prototype, "shapeModule"), _class2.prototype), _descriptor28 = _applyDecoratedDescriptor(_class2.prototype, "_sizeOvertimeModule", [_dec109], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "sizeOvertimeModule", [_dec110, _dec111, _dec112], Object.getOwnPropertyDescriptor(_class2.prototype, "sizeOvertimeModule"), _class2.prototype), _descriptor29 = _applyDecoratedDescriptor(_class2.prototype, "_velocityOvertimeModule", [_dec113], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "velocityOvertimeModule", [_dec114, _dec115, _dec116], Object.getOwnPropertyDescriptor(_class2.prototype, "velocityOvertimeModule"), _class2.prototype), _descriptor30 = _applyDecoratedDescriptor(_class2.prototype, "_forceOvertimeModule", [_dec117], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "forceOvertimeModule", [_dec118, _dec119, _dec120], Object.getOwnPropertyDescriptor(_class2.prototype, "forceOvertimeModule"), _class2.prototype), _descriptor31 = _applyDecoratedDescriptor(_class2.prototype, "_limitVelocityOvertimeModule", [_dec121], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "limitVelocityOvertimeModule", [_dec122, _dec123, _dec124], Object.getOwnPropertyDescriptor(_class2.prototype, "limitVelocityOvertimeModule"), _class2.prototype), _descriptor32 = _applyDecoratedDescriptor(_class2.prototype, "_rotationOvertimeModule", [_dec125], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "rotationOvertimeModule", [_dec126, _dec127, _dec128], Object.getOwnPropertyDescriptor(_class2.prototype, "rotationOvertimeModule"), _class2.prototype), _descriptor33 = _applyDecoratedDescriptor(_class2.prototype, "_textureAnimationModule", [_dec129], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "textureAnimationModule", [_dec130, _dec131, _dec132], Object.getOwnPropertyDescriptor(_class2.prototype, "textureAnimationModule"), _class2.prototype), _descriptor34 = _applyDecoratedDescriptor(_class2.prototype, "_noiseModule", [_dec133], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "noiseModule", [_dec134, _dec135, _dec136], Object.getOwnPropertyDescriptor(_class2.prototype, "noiseModule"), _class2.prototype), _descriptor35 = _applyDecoratedDescriptor(_class2.prototype, "_trailModule", [_dec137], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "trailModule", [_dec138, _dec139, _dec140], Object.getOwnPropertyDescriptor(_class2.prototype, "trailModule"), _class2.prototype), _descriptor36 = _applyDecoratedDescriptor(_class2.prototype, "renderer", [_dec141, serializable, _dec142, _dec143], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new ParticleSystemRenderer();
        }
      }), _descriptor37 = _applyDecoratedDescriptor(_class2.prototype, "_prewarm", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor38 = _applyDecoratedDescriptor(_class2.prototype, "_capacity", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 100;
        }
      }), _descriptor39 = _applyDecoratedDescriptor(_class2.prototype, "_simulationSpace", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return ParticleSpace.Local;
        }
      }), _class2)) || _class) || _class) || _class) || _class) || _class));
    }
  };
});