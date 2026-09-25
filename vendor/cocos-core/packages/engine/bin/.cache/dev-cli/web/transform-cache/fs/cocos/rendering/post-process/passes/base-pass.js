System.register("q-bundled:///fs/cocos/rendering/post-process/passes/base-pass.js", ["../../../../../virtual/internal%253Aconstants.js", "../../../asset/assets/index.js", "../../custom/define.js", "../utils/pass-context.js", "../../../gfx/index.js", "../../define.js", "../../../core/index.js"], function (_export, _context) {
  "use strict";

  var EDITOR, Material, getCameraUniqueID, passContext, Address, Filter, Format, SamplerInfo, supportsRGBA16HalfFloatTexture, cclegacy, macro, BasePass, _BasePassID, _pointSampler, _samplerPointInfo;
  function getRTFormatBeforeToneMapping(ppl) {
    const useFloatOutput = ppl.getMacroBool('CC_USE_FLOAT_OUTPUT');
    return ppl.pipelineSceneData.isHDR && useFloatOutput && supportsRGBA16HalfFloatTexture(ppl.device) ? Format.RGBA16F : Format.RGBA8;
  }
  function forceEnableFloatOutput(ppl) {
    let enabled = ppl.getMacroBool('CC_USE_FLOAT_OUTPUT');
    if (ppl.pipelineSceneData.isHDR && !enabled) {
      const supportFloatOutput = supportsRGBA16HalfFloatTexture(ppl.device);
      ppl.setMacroBool('CC_USE_FLOAT_OUTPUT', supportFloatOutput);
      macro.ENABLE_FLOAT_OUTPUT = supportFloatOutput;
      enabled = supportFloatOutput;
    }
    return enabled;
  }
  function disablePostProcessForDebugView() {
    const debugView = cclegacy.director.root.debugView;
    return debugView.singleMode > 0;
  }
  function getShadowMapSampler() {
    if (!_pointSampler) {
      const director = cclegacy.director;
      const pipeline = director.root.pipeline;
      const device = pipeline.device;
      _pointSampler = device.getSampler(_samplerPointInfo);
    }
    return _pointSampler || undefined;
  }
  _export({
    getRTFormatBeforeToneMapping: getRTFormatBeforeToneMapping,
    forceEnableFloatOutput: forceEnableFloatOutput,
    disablePostProcessForDebugView: disablePostProcessForDebugView,
    getShadowMapSampler: getShadowMapSampler,
    BasePass: void 0
  });
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
    }, function (_assetAssetsIndexJs) {
      Material = _assetAssetsIndexJs.Material;
    }, function (_customDefineJs) {
      getCameraUniqueID = _customDefineJs.getCameraUniqueID;
    }, function (_utilsPassContextJs) {
      passContext = _utilsPassContextJs.passContext;
    }, function (_gfxIndexJs) {
      Address = _gfxIndexJs.Address;
      Filter = _gfxIndexJs.Filter;
      Format = _gfxIndexJs.Format;
      SamplerInfo = _gfxIndexJs.SamplerInfo;
    }, function (_defineJs) {
      supportsRGBA16HalfFloatTexture = _defineJs.supportsRGBA16HalfFloatTexture;
    }, function (_coreIndexJs) {
      cclegacy = _coreIndexJs.cclegacy;
      macro = _coreIndexJs.macro;
    }],
    execute: function () {
      _BasePassID = 0;
      _pointSampler = null;
      _samplerPointInfo = new SamplerInfo(Filter.POINT, Filter.POINT, Filter.NONE, Address.CLAMP, Address.CLAMP, Address.CLAMP);
      _export("BasePass", BasePass = class BasePass {
        constructor() {
          this.effectName = 'pipeline/post-process/blit-screen';
          this._id = 0;
          this.context = passContext;
          this.getCameraUniqueID = getCameraUniqueID;
          // private _materialMap: Map<Camera, Material> = new Map()
          this._material = void 0;
          this.enable = true;
          this.outputNames = [];
          this.lastPass = void 0;
          this.enableInAllEditorCamera = false;
          this._id = _BasePassID++;
        }
        get material() {
          const effectReloaded = false;
          // if (EDITOR && this._material) {
          //     const effect = builtinResMgr.get(this.effectName);
          //     effectReloaded = effect && this._material.effectAsset !== effect;
          // }

          if (!this._material || effectReloaded) {
            const mat = new Material();
            mat._uuid = `${this.name}-${this.effectName}-material`;
            mat.initialize({
              effectName: this.effectName
            });
            this._material = mat;
          }
          let material;
          // if (EDITOR) {
          //     if (passUtils.camera) {
          //         material = this._materialMap.get(passUtils.camera);
          //         if (!material || material.parent !== this._material) {
          //             material = new MaterialInstance({
          //                 parent: this._material,
          //             });
          //             this._materialMap.set(passUtils.camera, material);
          //         }
          //     }
          // }

          return material || this._material;
        }
        slotName(camera, index = 0) {
          const name = this.outputNames[index] + this.name;
          return `${name}_${this._id}_${getCameraUniqueID(camera)}`;
        }
        checkEnable(camera) {
          return this.enable;
        }
        renderProfiler(camera) {
          if (passContext.isFinalCamera && !EDITOR) {
            passContext.pass.showStatistics = true;
          }
        }
      });
    }
  };
});