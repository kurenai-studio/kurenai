System.register("q-bundled:///fs/cocos/particle/animator/texture-animation.js", ["../../core/data/decorators/index.js", "../../core/index.js", "../particle.js", "./curve-range.js", "../enum.js", "../particle-general-function.js"], function (_export, _context) {
  "use strict";

  var ccclass, tooltip, displayOrder, type, formerlySerializedAs, serializable, range, lerp, pseudoRandom, repeat, Enum, random, error, ParticleModuleBase, PARTICLE_MODULE_NAME, CurveRange, ParticleModuleRandSeed, isCurveTwoValues, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _dec23, _dec24, _dec25, _dec26, _dec27, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor0, _descriptor1, _descriptor10, _descriptor11, TEXTURE_ANIMATION_RAND_OFFSET, Mode, Animation, TextureAnimationModule;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
      displayOrder = _coreDataDecoratorsIndexJs.displayOrder;
      type = _coreDataDecoratorsIndexJs.type;
      formerlySerializedAs = _coreDataDecoratorsIndexJs.formerlySerializedAs;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      range = _coreDataDecoratorsIndexJs.range;
    }, function (_coreIndexJs) {
      lerp = _coreIndexJs.lerp;
      pseudoRandom = _coreIndexJs.pseudoRandom;
      repeat = _coreIndexJs.repeat;
      Enum = _coreIndexJs.Enum;
      random = _coreIndexJs.random;
      error = _coreIndexJs.error;
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
      TEXTURE_ANIMATION_RAND_OFFSET = ParticleModuleRandSeed.TEXTURE;
      /**
       * @en Texture animation type.
       * @zh 粒子贴图动画类型。
       * @enum textureAnimationModule.Mode
       */
      Mode = Enum({
        /**
         * 网格类型。
         */
        Grid: 0

        /**
         * 精灵类型（暂未支持）。
         */
        // Sprites: 1,
      });
      /**
       * @en Mode to play texture animation.
       * @zh 贴图动画的播放方式。
       * @enum textureAnimationModule.Animation
       */
      Animation = Enum({
        /**
         * @en Play whole sheet of texture.
         * @zh 播放贴图中的所有帧。
         */
        WholeSheet: 0,
        /**
         * @en Play just one row of texture.
         * @zh 播放贴图中的其中一行动画。
         */
        SingleRow: 1
      });
      /**
       * @en
       * Use this module to play frame animation of the particle texture.
       * @zh
       * 这个模块用于播放粒子纹理带的纹理帧动画。
       */
      _export("default", TextureAnimationModule = (_dec = ccclass('cc.TextureAnimationModule'), _dec2 = formerlySerializedAs('numTilesX'), _dec3 = formerlySerializedAs('numTilesY'), _dec4 = displayOrder(0), _dec5 = type(Mode), _dec6 = type(Mode), _dec7 = displayOrder(1), _dec8 = tooltip('i18n:textureAnimationModule.mode'), _dec9 = displayOrder(2), _dec0 = tooltip('i18n:textureAnimationModule.numTilesX'), _dec1 = displayOrder(3), _dec10 = tooltip('i18n:textureAnimationModule.numTilesY'), _dec11 = type(Animation), _dec12 = displayOrder(4), _dec13 = tooltip('i18n:textureAnimationModule.animation'), _dec14 = type(CurveRange), _dec15 = range([0, Number.POSITIVE_INFINITY]), _dec16 = displayOrder(7), _dec17 = tooltip('i18n:textureAnimationModule.frameOverTime'), _dec18 = type(CurveRange), _dec19 = range([0, Number.POSITIVE_INFINITY]), _dec20 = displayOrder(8), _dec21 = tooltip('i18n:textureAnimationModule.startFrame'), _dec22 = displayOrder(9), _dec23 = tooltip('i18n:textureAnimationModule.cycleCount'), _dec24 = displayOrder(5), _dec25 = tooltip('i18n:textureAnimationModule.randomRow'), _dec26 = displayOrder(6), _dec27 = tooltip('i18n:textureAnimationModule.rowIndex'), _dec(_class = (_class2 = class TextureAnimationModule extends ParticleModuleBase {
        constructor() {
          super();
          _initializerDefineProperty(this, "_enable", _descriptor, this);
          _initializerDefineProperty(this, "_numTilesX", _descriptor2, this);
          _initializerDefineProperty(this, "_numTilesY", _descriptor3, this);
          _initializerDefineProperty(this, "_mode", _descriptor4, this);
          /**
           * @en Texture animation type. See [[Animation]].
           * @zh 动画播放方式 [[Animation]]。
           */
          _initializerDefineProperty(this, "animation", _descriptor5, this);
          /**
           * @en Curve to control texture animation speed.
           * @zh 一个周期内动画播放的帧与时间变化曲线。
           */
          _initializerDefineProperty(this, "frameOverTime", _descriptor6, this);
          /**
           * @en Texture animation frame start to play.
           * @zh 从第几帧开始播放，时间为整个粒子系统的生命周期。
           */
          _initializerDefineProperty(this, "startFrame", _descriptor7, this);
          /**
           * @en Animation cycle count per particle life.
           * @zh 一个生命周期内播放循环的次数。
           */
          _initializerDefineProperty(this, "cycleCount", _descriptor8, this);
          _initializerDefineProperty(this, "_flipU", _descriptor9, this);
          _initializerDefineProperty(this, "_flipV", _descriptor0, this);
          _initializerDefineProperty(this, "_uvChannelMask", _descriptor1, this);
          /**
           * @en Get random row from texture to generate animation.<br>
           * This option is available when [[Animation]] type is SingleRow.
           * @zh 随机从动画贴图中选择一行以生成动画。<br>
           * 此选项仅在动画播放方式为 SingleRow 时生效。
           */
          _initializerDefineProperty(this, "randomRow", _descriptor10, this);
          /**
           * @en Generate animation from specific row in texture.<br>
           * This option is available when [[Animation]] type is SingleRow and randomRow option is disabled.
           * @zh 从动画贴图中选择特定行以生成动画。<br>
           * 此选项仅在动画播放方式为 SingleRow 时且禁用 randomRow 时可用。
           */
          _initializerDefineProperty(this, "rowIndex", _descriptor11, this);
          this.name = PARTICLE_MODULE_NAME.TEXTURE;
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
          this.target.updateMaterialParams();
          this.target.enableModule(this.name, val, this);
        }
        /**
         * @en Set texture animation [[Mode]] (only support Grid mode).
         * @zh 设定粒子贴图动画的类型（暂只支持 Grid 模式）[[Mode]]。
         */
        get mode() {
          return this._mode;
        }
        set mode(val) {
          if (val !== Mode.Grid) {
            error('particle texture animation\'s sprites is not supported!');
          }
        }

        /**
         * @en Tile count on X axis.
         * @zh X 方向动画帧数。
         */
        get numTilesX() {
          return this._numTilesX;
        }
        set numTilesX(val) {
          if (this._numTilesX !== val) {
            this._numTilesX = val;
            this.target.updateMaterialParams();
          }
        }

        /**
         * @en Tile count on Y axis.
         * @zh Y 方向动画帧数。
         */
        get numTilesY() {
          return this._numTilesY;
        }
        set numTilesY(val) {
          if (this._numTilesY !== val) {
            this._numTilesY = val;
            this.target.updateMaterialParams();
          }
        }
        /**
         * @ignore
         */
        get flipU() {
          return this._flipU;
        }
        set flipU(val) {
          error('particle texture animation\'s flipU is not supported!');
        }
        get flipV() {
          return this._flipV;
        }
        set flipV(val) {
          error('particle texture animation\'s flipV is not supported!');
        }
        get uvChannelMask() {
          return this._uvChannelMask;
        }
        set uvChannelMask(val) {
          error('particle texture animation\'s uvChannelMask is not supported!');
        }
        /**
         * @en Init start row to particle.
         * @zh 给粒子创建初始行属性。
         * @param p @en Particle to set start row. @zh 设置初始行属性的粒子。
         * @internal
         */
        init(p) {
          p.startRow = Math.floor(random() * this.numTilesY);
        }

        /**
         * @en Apply texture animation to particle.
         * @zh 应用贴图动画到粒子。
         * @param p @en Particle to animate. @zh 模块需要更新的粒子。
         * @param dt @en Update interval time. @zh 粒子系统更新的间隔时间。
         * @internal
         */
        animate(p, dt) {
          const normalizedTime = 1 - p.remainingLifetime / p.startLifetime;
          const randStart = isCurveTwoValues(this.startFrame) ? pseudoRandom(p.randomSeed + TEXTURE_ANIMATION_RAND_OFFSET) : 0;
          const randFrame = isCurveTwoValues(this.frameOverTime) ? pseudoRandom(p.randomSeed + TEXTURE_ANIMATION_RAND_OFFSET) : 0;
          const startFrame = this.startFrame.evaluate(normalizedTime, randStart) / (this.numTilesX * this.numTilesY);
          if (this.animation === Animation.WholeSheet) {
            p.frameIndex = repeat(this.cycleCount * (this.frameOverTime.evaluate(normalizedTime, randFrame) + startFrame), 1);
          } else if (this.animation === Animation.SingleRow) {
            const rowLength = 1 / this.numTilesY;
            if (this.randomRow) {
              const f = repeat(this.cycleCount * (this.frameOverTime.evaluate(normalizedTime, randFrame) + startFrame), 1);
              const from = p.startRow * rowLength;
              const to = from + rowLength;
              p.frameIndex = lerp(from, to, f);
            } else {
              const from = this.rowIndex * rowLength;
              const to = from + rowLength;
              p.frameIndex = lerp(from, to, repeat(this.cycleCount * (this.frameOverTime.evaluate(normalizedTime, randFrame) + startFrame), 1));
            }
          }
        }

        /**
         * @engineInternal
         * @mangle
         */
        scaleNumTilesXY(scale) {
          this._numTilesX *= scale;
          this._numTilesY *= scale;
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_enable", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_numTilesX", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_numTilesY", [_dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "enable", [_dec4], Object.getOwnPropertyDescriptor(_class2.prototype, "enable"), _class2.prototype), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "_mode", [_dec5], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return Mode.Grid;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "mode", [_dec6, _dec7, _dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "mode"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "numTilesX", [_dec9, _dec0], Object.getOwnPropertyDescriptor(_class2.prototype, "numTilesX"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "numTilesY", [_dec1, _dec10], Object.getOwnPropertyDescriptor(_class2.prototype, "numTilesY"), _class2.prototype), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "animation", [_dec11, serializable, _dec12, _dec13], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return Animation.WholeSheet;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "frameOverTime", [_dec14, serializable, _dec15, _dec16, _dec17], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new CurveRange();
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "startFrame", [_dec18, serializable, _dec19, _dec20, _dec21], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new CurveRange();
        }
      }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "cycleCount", [serializable, _dec22, _dec23], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "_flipU", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor0 = _applyDecoratedDescriptor(_class2.prototype, "_flipV", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor1 = _applyDecoratedDescriptor(_class2.prototype, "_uvChannelMask", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return -1;
        }
      }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "randomRow", [serializable, _dec24, _dec25], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "rowIndex", [serializable, _dec26, _dec27], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _class2)) || _class));
    }
  };
});