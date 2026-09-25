System.register("q-bundled:///fs/cocos/particle/animator/noise-module.js", ["../../core/index.js", "../noise.js", "../particle.js"], function (_export, _context) {
  "use strict";

  var CCFloat, CCInteger, _decorator, Vec3, random, ParticleNoise, PARTICLE_MODULE_NAME, ParticleModuleBase, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _dec23, _dec24, _dec25, _dec26, _dec27, _dec28, _dec29, _dec30, _dec31, _dec32, _dec33, _dec34, _dec35, _dec36, _dec37, _dec38, _dec39, _dec40, _dec41, _dec42, _dec43, _dec44, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor0, _descriptor1, _descriptor10, _descriptor11, _descriptor12, ccclass, serializable, displayOrder, type, range, slide, visible, NoiseModule;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreIndexJs) {
      CCFloat = _coreIndexJs.CCFloat;
      CCInteger = _coreIndexJs.CCInteger;
      _decorator = _coreIndexJs._decorator;
      Vec3 = _coreIndexJs.Vec3;
      random = _coreIndexJs.random;
    }, function (_noiseJs) {
      ParticleNoise = _noiseJs.ParticleNoise;
    }, function (_particleJs) {
      PARTICLE_MODULE_NAME = _particleJs.PARTICLE_MODULE_NAME;
      ParticleModuleBase = _particleJs.ParticleModuleBase;
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
        serializable,
        displayOrder,
        type,
        range,
        slide,
        visible
      } = _decorator);
      /**
       * @en
       * Adding noise to your particles is a simple and effective way to create interesting patterns and effects.
       * @zh
       * 为粒子添加噪声是创建有趣方案和效果的简单有效方法。
       */
      _export("NoiseModule", NoiseModule = (_dec = ccclass('cc.NoiseModule'), _dec2 = displayOrder(0), _dec3 = type(CCFloat), _dec4 = range([0, 100]), _dec5 = displayOrder(16), _dec6 = type(CCFloat), _dec7 = range([0, 100]), _dec8 = displayOrder(16), _dec9 = type(CCFloat), _dec0 = range([0, 100]), _dec1 = displayOrder(16), _dec10 = type(CCFloat), _dec11 = range([0, 100]), _dec12 = displayOrder(16), _dec13 = type(CCFloat), _dec14 = range([0, 100]), _dec15 = displayOrder(16), _dec16 = type(CCFloat), _dec17 = range([0, 100]), _dec18 = displayOrder(16), _dec19 = type(CCFloat), _dec20 = range([0, 100, 0.1]), _dec21 = displayOrder(16), _dec22 = visible(false), _dec23 = type(CCFloat), _dec24 = range([0, 1, 0.1]), _dec25 = displayOrder(16), _dec26 = visible(false), _dec27 = type(CCFloat), _dec28 = range([0, 1, 0.1]), _dec29 = displayOrder(16), _dec30 = visible(false), _dec31 = type(CCFloat), _dec32 = range([0, 1, 0.1]), _dec33 = displayOrder(16), _dec34 = type(CCInteger), _dec35 = range([1, 4, 1]), _dec36 = displayOrder(16), _dec37 = visible(function () {
        return this._octaves > 1;
      }), _dec38 = type(CCFloat), _dec39 = range([0, 1, 0.1]), _dec40 = displayOrder(16), _dec41 = visible(function () {
        return this._octaves > 1;
      }), _dec42 = type(CCFloat), _dec43 = range([1, 4, 0.1]), _dec44 = displayOrder(16), _dec(_class = (_class2 = class NoiseModule extends ParticleModuleBase {
        constructor() {
          super();
          _initializerDefineProperty(this, "_enable", _descriptor, this);
          _initializerDefineProperty(this, "_strengthX", _descriptor2, this);
          _initializerDefineProperty(this, "_strengthY", _descriptor3, this);
          _initializerDefineProperty(this, "_strengthZ", _descriptor4, this);
          _initializerDefineProperty(this, "_noiseSpeedX", _descriptor5, this);
          _initializerDefineProperty(this, "_noiseSpeedY", _descriptor6, this);
          _initializerDefineProperty(this, "_noiseSpeedZ", _descriptor7, this);
          _initializerDefineProperty(this, "_noiseFrequency", _descriptor8, this);
          _initializerDefineProperty(this, "_remapX", _descriptor9, this);
          _initializerDefineProperty(this, "_remapY", _descriptor0, this);
          _initializerDefineProperty(this, "_remapZ", _descriptor1, this);
          _initializerDefineProperty(this, "_octaves", _descriptor10, this);
          _initializerDefineProperty(this, "_octaveMultiplier", _descriptor11, this);
          _initializerDefineProperty(this, "_octaveScale", _descriptor12, this);
          this.name = PARTICLE_MODULE_NAME.NOISE;
          this.noise = new ParticleNoise();
          this.samplePosition = new Vec3();
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
         * @en Strength on X axis.
         * @zh X 轴上的强度大小。
         */
        get strengthX() {
          return this._strengthX;
        }
        set strengthX(value) {
          this._strengthX = value;
        }
        /**
         * @en Strength on Y axis.
         * @zh Y 轴上的强度大小。
         */
        get strengthY() {
          return this._strengthY;
        }
        set strengthY(value) {
          this._strengthY = value;
        }
        /**
         * @en Strength on Z axis.
         * @zh Z 轴上的强度大小。
         */
        get strengthZ() {
          return this._strengthZ;
        }
        set strengthZ(value) {
          this._strengthZ = value;
        }
        /**
         * @en Noise texture roll speed on X axis.
         * @zh X 轴上的噪声图滚动速度。
         */
        get noiseSpeedX() {
          return this._noiseSpeedX;
        }
        set noiseSpeedX(value) {
          this._noiseSpeedX = value;
        }
        /**
         * @en Noise texture roll speed on Y axis.
         * @zh Y 轴上的噪声图滚动速度。
         */
        get noiseSpeedY() {
          return this._noiseSpeedY;
        }
        set noiseSpeedY(value) {
          this._noiseSpeedY = value;
        }
        /**
         * @en Noise texture roll speed on Z axis.
         * @zh Z 轴上的噪声图滚动速度。
         */
        get noiseSpeedZ() {
          return this._noiseSpeedZ;
        }
        set noiseSpeedZ(value) {
          this._noiseSpeedZ = value;
        }
        /**
         * @en Noise frequency.
         * @zh 噪声图频率。
         */
        get noiseFrequency() {
          return this._noiseFrequency;
        }
        set noiseFrequency(value) {
          this._noiseFrequency = value;
        }
        /**
         * @en Remap the final noise X axis values into a different range.
         * @zh 噪声值映射到 X 轴的不同范围。
         */
        get remapX() {
          return this._remapX;
        }
        set remapX(value) {
          this._remapX = value;
        }
        /**
         * @en Remap the final noise Y axis values into a different range.
         * @zh 噪声值映射到 Y 轴的不同范围。
         */
        get remapY() {
          return this._remapY;
        }
        set remapY(value) {
          this._remapY = value;
        }
        /**
         * @en Remap the final noise Z axis values into a different range.
         * @zh 噪声值映射到 Z 轴的不同范围。
         */
        get remapZ() {
          return this._remapZ;
        }
        set remapZ(value) {
          this._remapZ = value;
        }
        /**
         * @en Specify how many layers of overlapping noise are combined to produce the final noise values.
         * @zh 指定组合多少层重叠噪声来产生最终噪声值。
         */
        get octaves() {
          return this._octaves;
        }
        set octaves(value) {
          this._octaves = value;
        }
        /**
         * @en For each additional noise layer, reduce the strength by this proportion.
         * @zh 对于每个附加的噪声层，按此比例降低强度。
         */
        // eslint-disable-next-line func-names
        get octaveMultiplier() {
          return this._octaveMultiplier;
        }
        set octaveMultiplier(value) {
          this._octaveMultiplier = value;
        }
        /**
         * @en For each additional noise layer, adjust the frequency by this multiplier.
         * @zh 对于每个附加的噪声层，按此乘数调整频率。
         */
        // eslint-disable-next-line func-names
        get octaveScale() {
          return this._octaveScale;
        }
        set octaveScale(value) {
          this._octaveScale = value;
        }
        /**
         * @en Apply noise effect to particle.
         * @zh 作用噪声效果到粒子上。
         * @param particle @en Particle to animate @zh 模块需要更新的粒子
         * @param dt @en Update interval time @zh 粒子系统更新的间隔时间
         * @internal
         */
        animate(particle, dt) {
          this.noise.setTime(particle.particleSystem.time);
          this.noise.setSpeed(this.noiseSpeedX, this.noiseSpeedY, this.noiseSpeedZ);
          this.noise.setFrequency(this.noiseFrequency);
          this.noise.setAbs(this.remapX, this.remapY, this.remapZ);
          this.noise.setAmplititude(this.strengthX, this.strengthY, this.strengthZ);
          this.noise.setOctaves(this.octaves, this.octaveMultiplier, this.octaveScale);
          this.samplePosition.set(particle.position);
          this.samplePosition.add3f(random() * 1.0, random() * 1.0, random() * 1.0);
          this.noise.setSamplePoint(this.samplePosition);
          this.noise.getNoiseParticle();
          const noisePosition = this.noise.getResult();
          noisePosition.multiply3f(random(), random(), random());
          Vec3.add(particle.position, particle.position, noisePosition.multiplyScalar(dt));
        }

        /**
         * @en Gets the preview of noise texture.
         * @zh 获取噪声图预览。
         * @param out @en Noise texture pixels array @zh 噪声图像素数组
         * @param ps @en Particle system @zh 噪声图作用的粒子系统
         * @param width @en Texture width @zh 噪声图宽度
         * @param height @en Texture height @zh 噪声图高度
         */
        getNoisePreview(out, ps, width, height) {
          this.noise.setTime(ps.time);
          this.noise.setSpeed(this.noiseSpeedX, this.noiseSpeedY, this.noiseSpeedZ);
          this.noise.setFrequency(this.noiseFrequency);
          this.noise.setAbs(this.remapX, this.remapY, this.remapZ);
          this.noise.setAmplititude(this.strengthX, this.strengthY, this.strengthZ);
          this.noise.setOctaves(this.octaves, this.octaveMultiplier, this.octaveScale);
          this.noise.getNoiseParticle();
          this.noise.getPreview(out, width, height);
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_enable", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "enable", [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "enable"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "strengthX", [_dec3, _dec4, _dec5, slide], Object.getOwnPropertyDescriptor(_class2.prototype, "strengthX"), _class2.prototype), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_strengthX", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 10;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "strengthY", [_dec6, _dec7, _dec8, slide], Object.getOwnPropertyDescriptor(_class2.prototype, "strengthY"), _class2.prototype), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_strengthY", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 10;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "strengthZ", [_dec9, _dec0, _dec1, slide], Object.getOwnPropertyDescriptor(_class2.prototype, "strengthZ"), _class2.prototype), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "_strengthZ", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 10;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "noiseSpeedX", [_dec10, _dec11, slide, _dec12], Object.getOwnPropertyDescriptor(_class2.prototype, "noiseSpeedX"), _class2.prototype), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "_noiseSpeedX", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "noiseSpeedY", [_dec13, _dec14, _dec15, slide], Object.getOwnPropertyDescriptor(_class2.prototype, "noiseSpeedY"), _class2.prototype), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "_noiseSpeedY", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "noiseSpeedZ", [_dec16, _dec17, _dec18, slide], Object.getOwnPropertyDescriptor(_class2.prototype, "noiseSpeedZ"), _class2.prototype), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "_noiseSpeedZ", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "noiseFrequency", [_dec19, _dec20, _dec21, slide], Object.getOwnPropertyDescriptor(_class2.prototype, "noiseFrequency"), _class2.prototype), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "_noiseFrequency", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "remapX", [_dec22, _dec23, _dec24, _dec25, slide], Object.getOwnPropertyDescriptor(_class2.prototype, "remapX"), _class2.prototype), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "_remapX", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "remapY", [_dec26, _dec27, _dec28, _dec29, slide], Object.getOwnPropertyDescriptor(_class2.prototype, "remapY"), _class2.prototype), _descriptor0 = _applyDecoratedDescriptor(_class2.prototype, "_remapY", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "remapZ", [_dec30, _dec31, _dec32, _dec33, slide], Object.getOwnPropertyDescriptor(_class2.prototype, "remapZ"), _class2.prototype), _descriptor1 = _applyDecoratedDescriptor(_class2.prototype, "_remapZ", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "octaves", [_dec34, _dec35, _dec36, slide], Object.getOwnPropertyDescriptor(_class2.prototype, "octaves"), _class2.prototype), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "_octaves", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "octaveMultiplier", [_dec37, _dec38, _dec39, _dec40], Object.getOwnPropertyDescriptor(_class2.prototype, "octaveMultiplier"), _class2.prototype), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "_octaveMultiplier", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.5;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "octaveScale", [_dec41, _dec42, _dec43, _dec44], Object.getOwnPropertyDescriptor(_class2.prototype, "octaveScale"), _class2.prototype), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "_octaveScale", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 2;
        }
      }), _class2)) || _class));
    }
  };
});