System.register("q-bundled:///fs/cocos/particle/renderer/particle-system-renderer-data.js", ["../../core/data/decorators/index.js", "../../3d/index.js", "../../asset/assets/index.js", "../enum.js", "./particle-system-renderer-cpu.js", "./particle-system-renderer-gpu.js", "../../game/director.js", "../../gfx/index.js", "../../core/index.js"], function (_export, _context) {
  "use strict";

  var ccclass, tooltip, displayOrder, type, serializable, disallowAnimation, visible, Mesh, Material, ParticleAlignmentSpace, ParticleRenderMode, ParticleSystemRendererCPU, ParticleSystemRendererGPU, director, Format, FormatFeatureBit, errorID, warnID, cclegacy, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _dec23, _dec24, _dec25, _dec26, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _ParticleSystemRenderer, ParticleSystemRenderer;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
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

  function isSupportGPUParticle() {
    const device = director.root.device;
    if (device.capabilities.maxVertexTextureUnits >= 8 && device.getFormatFeatures(Format.RGBA32F) & (FormatFeatureBit.RENDER_TARGET | FormatFeatureBit.SAMPLED_TEXTURE)) {
      return true;
    }
    cclegacy.warn('Maybe the device has restrictions on vertex textures or does not support float textures.');
    return false;
  }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
      displayOrder = _coreDataDecoratorsIndexJs.displayOrder;
      type = _coreDataDecoratorsIndexJs.type;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      disallowAnimation = _coreDataDecoratorsIndexJs.disallowAnimation;
      visible = _coreDataDecoratorsIndexJs.visible;
    }, function (_dIndexJs) {
      Mesh = _dIndexJs.Mesh;
    }, function (_assetAssetsIndexJs) {
      Material = _assetAssetsIndexJs.Material;
    }, function (_enumJs) {
      ParticleAlignmentSpace = _enumJs.ParticleAlignmentSpace;
      ParticleRenderMode = _enumJs.ParticleRenderMode;
    }, function (_particleSystemRendererCpuJs) {
      ParticleSystemRendererCPU = _particleSystemRendererCpuJs.default;
    }, function (_particleSystemRendererGpuJs) {
      ParticleSystemRendererGPU = _particleSystemRendererGpuJs.default;
    }, function (_gameDirectorJs) {
      director = _gameDirectorJs.director;
    }, function (_gfxIndexJs) {
      Format = _gfxIndexJs.Format;
      FormatFeatureBit = _gfxIndexJs.FormatFeatureBit;
    }, function (_coreIndexJs) {
      errorID = _coreIndexJs.errorID;
      warnID = _coreIndexJs.warnID;
      cclegacy = _coreIndexJs.cclegacy;
    }],
    execute: function () {
      _export("default", ParticleSystemRenderer = (_dec = ccclass('cc.ParticleSystemRenderer'), _dec2 = type(ParticleRenderMode), _dec3 = displayOrder(0), _dec4 = tooltip('i18n:particleSystemRenderer.renderMode'), _dec5 = displayOrder(1), _dec6 = tooltip('i18n:particleSystemRenderer.velocityScale'), _dec7 = displayOrder(2), _dec8 = tooltip('i18n:particleSystemRenderer.lengthScale'), _dec9 = type(ParticleRenderMode), _dec0 = type(Mesh), _dec1 = displayOrder(7), _dec10 = tooltip('i18n:particleSystemRenderer.mesh'), _dec11 = type(Material), _dec12 = displayOrder(8), _dec13 = visible(false), _dec14 = tooltip('i18n:particleSystemRenderer.particleMaterial'), _dec15 = type(Material), _dec16 = displayOrder(8), _dec17 = type(Material), _dec18 = displayOrder(8), _dec19 = type(Material), _dec20 = displayOrder(9), _dec21 = tooltip('i18n:particleSystemRenderer.trailMaterial'), _dec22 = displayOrder(10), _dec23 = tooltip('i18n:particleSystemRenderer.useGPU'), _dec24 = type(ParticleAlignmentSpace), _dec25 = displayOrder(10), _dec26 = tooltip('i18n:particle_system.alignSpace'), _dec(_class = (_class2 = (_ParticleSystemRenderer = class ParticleSystemRenderer {
        constructor() {
          _initializerDefineProperty(this, "_renderMode", _descriptor, this);
          _initializerDefineProperty(this, "_velocityScale", _descriptor2, this);
          _initializerDefineProperty(this, "_lengthScale", _descriptor3, this);
          _initializerDefineProperty(this, "_mesh", _descriptor4, this);
          _initializerDefineProperty(this, "_cpuMaterial", _descriptor5, this);
          _initializerDefineProperty(this, "_gpuMaterial", _descriptor6, this);
          _initializerDefineProperty(this, "_mainTexture", _descriptor7, this);
          _initializerDefineProperty(this, "_useGPU", _descriptor8, this);
          _initializerDefineProperty(this, "_alignSpace", _descriptor9, this);
          this._particleSystem = null;
        }
        /**
         * @zh 设定粒子生成模式。
         */
        get renderMode() {
          return this._renderMode;
        }
        set renderMode(val) {
          if (this._renderMode === val) {
            return;
          }
          this._renderMode = val;
          if (this._particleSystem) {
            this._particleSystem.processor.updateRenderMode();
          }
        }

        /**
         * @zh 在粒子生成方式为 StrecthedBillboard 时,对粒子在运动方向上按速度大小进行拉伸。
         */
        get velocityScale() {
          return this._velocityScale;
        }
        set velocityScale(val) {
          this._velocityScale = val;
          if (this._particleSystem) {
            this._particleSystem.processor.updateMaterialParams();
          }
          // this._updateModel();
        }

        /**
         * @zh 在粒子生成方式为 StrecthedBillboard 时,对粒子在运动方向上按粒子大小进行拉伸。
         */
        get lengthScale() {
          return this._lengthScale;
        }
        set lengthScale(val) {
          this._lengthScale = val;
          if (this._particleSystem) {
            this._particleSystem.processor.updateMaterialParams();
          }
          // this._updateModel();
        }
        /**
         * @zh 粒子发射的模型。
         */
        get mesh() {
          return this._mesh;
        }
        set mesh(val) {
          this._mesh = val;
          if (this._particleSystem) {
            this._particleSystem.processor.setVertexAttributes();
          }
        }

        /**
         * @zh 粒子使用的材质。
         */
        get particleMaterial() {
          if (!this._particleSystem) {
            return null;
          }
          return this._particleSystem.getSharedMaterial(0);
        }
        set particleMaterial(val) {
          if (this._particleSystem) {
            this._particleSystem.setSharedMaterial(val, 0);
          }
        }

        /**
         * @en particle cpu material
         * @zh 粒子使用的cpu材质。
         */
        get cpuMaterial() {
          return this._cpuMaterial;
        }
        set cpuMaterial(val) {
          if (val) {
            const effectName = val.effectName;
            if (effectName.indexOf('particle') === -1 || effectName.indexOf('particle-gpu') !== -1) {
              warnID(6035);
              return;
            }
          }
          this._cpuMaterial = val;
          this.particleMaterial = this._cpuMaterial;
        }
        /**
         * @en particle gpu material
         * @zh 粒子使用的gpu材质。
         */
        get gpuMaterial() {
          return this._gpuMaterial;
        }
        set gpuMaterial(val) {
          if (val) {
            const effectName = val.effectName;
            if (effectName.indexOf('particle-gpu') === -1) {
              warnID(6035);
              return;
            }
          }
          this._gpuMaterial = val;
          this.particleMaterial = this._gpuMaterial;
        }
        /**
         * @en particle trail material
         * @zh 拖尾使用的材质。
         */
        get trailMaterial() {
          if (!this._particleSystem) {
            return null;
          }
          return this._particleSystem.getSharedMaterial(1);
        }
        set trailMaterial(val) {
          if (this._particleSystem) {
            this._particleSystem.setSharedMaterial(val, 1);
          }
        }
        get mainTexture() {
          return this._mainTexture;
        }
        set mainTexture(val) {
          this._mainTexture = val;
        }
        get useGPU() {
          return this._useGPU;
        }
        set useGPU(val) {
          if (this._useGPU === val) {
            return;
          }
          if (!isSupportGPUParticle()) {
            this._useGPU = false;
          } else {
            this._useGPU = val;
          }
          this._switchProcessor();
        }

        /**
         * @en Particle alignment space option. Includes world, local and view.
         * @zh 粒子对齐空间选择。包括世界空间，局部空间和视角空间。
         */
        get alignSpace() {
          return this._alignSpace;
        }
        set alignSpace(val) {
          this._alignSpace = val;
          this._particleSystem.processor.updateAlignSpace(this._alignSpace);
        }
        create(ps) {
          // if particle system is null we run the old routine
          // else if particle system is not null we do nothing
          if (this._particleSystem === null) {
            this._particleSystem = ps;
          } else if (this._particleSystem !== ps) {
            errorID(6033);
          }
        }
        onInit(ps) {
          this.create(ps);
          const useGPU = this._useGPU && isSupportGPUParticle();
          if (!this._particleSystem.processor) {
            this._particleSystem.processor = useGPU ? new ParticleSystemRendererGPU(this) : new ParticleSystemRendererCPU(this);
            this._particleSystem.processor.updateAlignSpace(this.alignSpace);
            this._particleSystem.processor.onInit(ps);
          } else {
            errorID(6034);
          }
          if (!useGPU) {
            if (this.particleMaterial && this.particleMaterial.effectName.indexOf('particle-gpu') !== -1) {
              this.particleMaterial = null;
              warnID(6035);
            }
            this.cpuMaterial = this.particleMaterial;
          } else {
            this.gpuMaterial = this.particleMaterial;
          }
        }
        _switchProcessor() {
          if (!this._particleSystem) {
            return;
          }
          if (this._particleSystem.processor) {
            this._particleSystem.processor.detachFromScene();
            this._particleSystem.processor.clear();
            this._particleSystem.processor = null;
          }
          const useGPU = this._useGPU && isSupportGPUParticle();
          this.particleMaterial = useGPU ? this.gpuMaterial : this.cpuMaterial;
          this._particleSystem.processor = useGPU ? new ParticleSystemRendererGPU(this) : new ParticleSystemRendererCPU(this);
          this._particleSystem.processor.updateAlignSpace(this.alignSpace);
          this._particleSystem.processor.onInit(this._particleSystem);
          this._particleSystem.processor.onEnable();
          this._particleSystem.bindModule();
        }
      }, _ParticleSystemRenderer.AlignmentSpace = ParticleAlignmentSpace, _ParticleSystemRenderer), _applyDecoratedDescriptor(_class2.prototype, "renderMode", [_dec2, _dec3, _dec4], Object.getOwnPropertyDescriptor(_class2.prototype, "renderMode"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "velocityScale", [_dec5, _dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "velocityScale"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "lengthScale", [_dec7, _dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "lengthScale"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_renderMode", [_dec9, serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return ParticleRenderMode.Billboard;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_velocityScale", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_lengthScale", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "_mesh", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "mesh", [_dec0, _dec1, _dec10], Object.getOwnPropertyDescriptor(_class2.prototype, "mesh"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "particleMaterial", [_dec11, _dec12, disallowAnimation, _dec13, _dec14], Object.getOwnPropertyDescriptor(_class2.prototype, "particleMaterial"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "cpuMaterial", [_dec15, _dec16, disallowAnimation], Object.getOwnPropertyDescriptor(_class2.prototype, "cpuMaterial"), _class2.prototype), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "_cpuMaterial", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "gpuMaterial", [_dec17, _dec18, disallowAnimation], Object.getOwnPropertyDescriptor(_class2.prototype, "gpuMaterial"), _class2.prototype), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "_gpuMaterial", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "trailMaterial", [_dec19, _dec20, disallowAnimation, _dec21], Object.getOwnPropertyDescriptor(_class2.prototype, "trailMaterial"), _class2.prototype), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "_mainTexture", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "_useGPU", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "useGPU", [_dec22, _dec23], Object.getOwnPropertyDescriptor(_class2.prototype, "useGPU"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "alignSpace", [_dec24, _dec25, _dec26], Object.getOwnPropertyDescriptor(_class2.prototype, "alignSpace"), _class2.prototype), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "_alignSpace", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return ParticleAlignmentSpace.View;
        }
      }), _class2)) || _class));
    }
  };
});