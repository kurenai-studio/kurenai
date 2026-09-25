System.register("q-bundled:///fs/cocos/rendering/deferred/deferred-pipeline-scene-data.js", ["../render-pipeline.js", "../../asset/assets/index.js", "../pipeline-scene-data.js", "../../core/global-exports.js"], function (_export, _context) {
  "use strict";

  var MAX_BLOOM_FILTER_PASS_NUM, Material, PipelineSceneData, legacyCC, DeferredPipelineSceneData, DeferredAntiAliasing, BLOOM_PREFILTERPASS_INDEX, BLOOM_DOWNSAMPLEPASS_INDEX, BLOOM_UPSAMPLEPASS_INDEX, BLOOM_COMBINEPASS_INDEX;
  _export("DeferredPipelineSceneData", void 0);
  return {
    setters: [function (_renderPipelineJs) {
      MAX_BLOOM_FILTER_PASS_NUM = _renderPipelineJs.MAX_BLOOM_FILTER_PASS_NUM;
    }, function (_assetAssetsIndexJs) {
      Material = _assetAssetsIndexJs.Material;
    }, function (_pipelineSceneDataJs) {
      PipelineSceneData = _pipelineSceneDataJs.PipelineSceneData;
    }, function (_coreGlobalExportsJs) {
      legacyCC = _coreGlobalExportsJs.legacyCC;
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
      // Anti-aliasing type, other types will be gradually added in the future
      _export("DeferredAntiAliasing", DeferredAntiAliasing = /*#__PURE__*/function (DeferredAntiAliasing) {
        DeferredAntiAliasing[DeferredAntiAliasing["NONE"] = 0] = "NONE";
        DeferredAntiAliasing[DeferredAntiAliasing["FXAA"] = 1] = "FXAA";
        return DeferredAntiAliasing;
      }({}));
      _export("BLOOM_PREFILTERPASS_INDEX", BLOOM_PREFILTERPASS_INDEX = 0);
      _export("BLOOM_DOWNSAMPLEPASS_INDEX", BLOOM_DOWNSAMPLEPASS_INDEX = 1);
      _export("BLOOM_UPSAMPLEPASS_INDEX", BLOOM_UPSAMPLEPASS_INDEX = BLOOM_DOWNSAMPLEPASS_INDEX + MAX_BLOOM_FILTER_PASS_NUM);
      _export("BLOOM_COMBINEPASS_INDEX", BLOOM_COMBINEPASS_INDEX = BLOOM_UPSAMPLEPASS_INDEX + MAX_BLOOM_FILTER_PASS_NUM);
      _export("DeferredPipelineSceneData", DeferredPipelineSceneData = class DeferredPipelineSceneData extends PipelineSceneData {
        constructor() {
          super();
          this._antiAliasing = DeferredAntiAliasing.NONE;
        }
        set antiAliasing(value) {
          this._antiAliasing = value;
          if (this._postprocessMaterial) {
            const defines = this._postprocessMaterial.passes[0].defines;
            Object.assign(defines, {
              ANTIALIAS_TYPE: value
            });
            const renderMat = new Material();
            renderMat.initialize({
              effectAsset: this._postprocessMaterial.effectAsset,
              defines
            });
            for (let i = 0; i < renderMat.passes.length; ++i) {
              renderMat.passes[i].tryCompile();
            }
            this._postprocessMaterial = renderMat;
          }
        }
        get antiAliasing() {
          return this._antiAliasing;
        }
        get bloomMaterial() {
          return this._bloomMaterial;
        }
        set bloomMaterial(mat) {
          if (this._bloomMaterial === mat || !mat) return;
          this._bloomMaterial = mat;
          this.updatePipelinePassInfo();
        }
        get postprocessMaterial() {
          return this._postprocessMaterial;
        }
        set postprocessMaterial(mat) {
          if (this._postprocessMaterial === mat || !mat) return;
          this._postprocessMaterial = mat;
          this.updatePipelinePassInfo();
        }
        updatePipelineSceneData() {
          this.updatePipelinePassInfo();
        }
        updateBloomPass() {
          if (!this._bloomMaterial) return;
          const prefilterPass = this._bloomMaterial.passes[BLOOM_PREFILTERPASS_INDEX];
          prefilterPass.beginChangeStatesSilently();
          prefilterPass.tryCompile();
          prefilterPass.endChangeStatesSilently();
          for (let i = 0; i < MAX_BLOOM_FILTER_PASS_NUM; ++i) {
            const downsamplePass = this._bloomMaterial.passes[BLOOM_DOWNSAMPLEPASS_INDEX + i];
            downsamplePass.beginChangeStatesSilently();
            downsamplePass.tryCompile();
            downsamplePass.endChangeStatesSilently();
            const upsamplePass = this._bloomMaterial.passes[BLOOM_UPSAMPLEPASS_INDEX + i];
            upsamplePass.beginChangeStatesSilently();
            upsamplePass.tryCompile();
            upsamplePass.endChangeStatesSilently();
          }
          const combinePass = this._bloomMaterial.passes[BLOOM_COMBINEPASS_INDEX];
          combinePass.beginChangeStatesSilently();
          combinePass.tryCompile();
          combinePass.endChangeStatesSilently();
        }
        updatePostProcessPass() {
          if (!this.postprocessMaterial) return;
          const passPost = this.postprocessMaterial.passes[0];
          passPost.beginChangeStatesSilently();
          passPost.tryCompile();
          passPost.endChangeStatesSilently();
        }
        initPipelinePassInfo() {
          // builtin deferred material
          const deferredMat = new Material();
          deferredMat._uuid = 'builtin-deferred-material';
          deferredMat.initialize({
            effectName: 'pipeline/deferred-lighting'
          });
          for (let i = 0; i < deferredMat.passes.length; ++i) {
            deferredMat.passes[i].tryCompile();
          }
          this._deferredLightingMaterial = deferredMat;
          const bloomMat = new Material();
          bloomMat._uuid = 'builtin-bloom-material';
          bloomMat.initialize({
            effectName: 'pipeline/bloom'
          });
          for (let i = 0; i < bloomMat.passes.length; ++i) {
            bloomMat.passes[i].tryCompile();
          }
          this._bloomMaterial = bloomMat;
          const postMat = new Material();
          postMat._uuid = 'builtin-post-process-material';
          postMat.initialize({
            effectName: 'pipeline/post-process',
            defines: {
              // Anti-aliasing type, currently only fxaa, so 1 means fxaa
              ANTIALIAS_TYPE: this._antiAliasing
            }
          });
          for (let i = 0; i < postMat.passes.length; ++i) {
            postMat.passes[i].tryCompile();
          }
          this._postprocessMaterial = postMat;
          this.updatePipelinePassInfo();
        }
        get deferredLightingMaterial() {
          return this._deferredLightingMaterial;
        }
        set deferredLightingMaterial(mat) {
          if (this._deferredLightingMaterial === mat || !mat) return;
          this._deferredLightingMaterial = mat;
          this.updatePipelinePassInfo();
        }
        updatePipelinePassInfo() {
          this.updateBloomPass();
          this.updatePostProcessPass();
          this.updateDeferredPassInfo();
        }
        activate(device) {
          super.activate(device);
          this.initPipelinePassInfo();
          return true;
        }
        updateDeferredPassInfo() {
          this.updateDeferredLightPass();
        }
        updateDeferredLightPass() {
          if (!this._deferredLightingMaterial) return;

          // It's temporary solution for main light shadowmap
          legacyCC.director.root.pipeline.macros.CC_RECEIVE_SHADOW = 1;
          const passLit = this._deferredLightingMaterial.passes[0];
          passLit.beginChangeStatesSilently();
          passLit.tryCompile();
          passLit.endChangeStatesSilently();
        }
      });
    }
  };
});