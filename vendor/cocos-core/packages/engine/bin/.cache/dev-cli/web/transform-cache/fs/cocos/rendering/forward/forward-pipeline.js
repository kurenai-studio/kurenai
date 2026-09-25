System.register("q-bundled:///fs/cocos/rendering/forward/forward-pipeline.js", ["../../core/data/decorators/index.js", "../../../../virtual/internal%253Aconstants.js", "../render-pipeline.js", "./forward-flow.js", "../pipeline-serialization.js", "../shadow/shadow-flow.js", "../define.js", "../../core/platform/debug.js", "../pipeline-scene-data.js", "../reflection-probe/reflection-probe-flow.js"], function (_export, _context) {
  "use strict";

  var ccclass, displayOrder, type, serializable, EDITOR, RenderPipeline, ForwardFlow, RenderTextureConfig, ShadowFlow, UBOGlobal, UBOShadow, UBOCamera, UNIFORM_SHADOWMAP_BINDING, UNIFORM_SPOT_SHADOW_MAP_TEXTURE_BINDING, getDefaultShadowTexture, errorID, log, PipelineSceneData, ReflectionProbeFlow, _dec, _dec2, _dec3, _class, _class2, _descriptor, PIPELINE_TYPE, ForwardPipeline;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function createDefaultPipeline() {
    const rppl = new ForwardPipeline();
    rppl.initialize({
      flows: []
    });
    return rppl;
  }

  /**
   * @en The forward render pipeline
   * @zh 前向渲染管线。
   */
  _export("createDefaultPipeline", createDefaultPipeline);
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      displayOrder = _coreDataDecoratorsIndexJs.displayOrder;
      type = _coreDataDecoratorsIndexJs.type;
      serializable = _coreDataDecoratorsIndexJs.serializable;
    }, function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
    }, function (_renderPipelineJs) {
      RenderPipeline = _renderPipelineJs.RenderPipeline;
    }, function (_forwardFlowJs) {
      ForwardFlow = _forwardFlowJs.ForwardFlow;
    }, function (_pipelineSerializationJs) {
      RenderTextureConfig = _pipelineSerializationJs.RenderTextureConfig;
    }, function (_shadowShadowFlowJs) {
      ShadowFlow = _shadowShadowFlowJs.ShadowFlow;
    }, function (_defineJs) {
      UBOGlobal = _defineJs.UBOGlobal;
      UBOShadow = _defineJs.UBOShadow;
      UBOCamera = _defineJs.UBOCamera;
      UNIFORM_SHADOWMAP_BINDING = _defineJs.UNIFORM_SHADOWMAP_BINDING;
      UNIFORM_SPOT_SHADOW_MAP_TEXTURE_BINDING = _defineJs.UNIFORM_SPOT_SHADOW_MAP_TEXTURE_BINDING;
      getDefaultShadowTexture = _defineJs.getDefaultShadowTexture;
    }, function (_corePlatformDebugJs) {
      errorID = _corePlatformDebugJs.errorID;
      log = _corePlatformDebugJs.log;
    }, function (_pipelineSceneDataJs) {
      PipelineSceneData = _pipelineSceneDataJs.PipelineSceneData;
    }, function (_reflectionProbeReflectionProbeFlowJs) {
      ReflectionProbeFlow = _reflectionProbeReflectionProbeFlowJs.ReflectionProbeFlow;
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
      PIPELINE_TYPE = 0;
      _export("ForwardPipeline", ForwardPipeline = (_dec = ccclass('ForwardPipeline'), _dec2 = type([RenderTextureConfig]), _dec3 = displayOrder(2), _dec(_class = (_class2 = class ForwardPipeline extends RenderPipeline {
        constructor() {
          super();
          _initializerDefineProperty(this, "renderTextures", _descriptor, this);
          this._postRenderPass = null;
        }
        get postRenderPass() {
          return this._postRenderPass;
        }
        initialize(info) {
          super.initialize(info);
          if (this._flows.length === 0) {
            const shadowFlow = new ShadowFlow();
            shadowFlow.initialize(ShadowFlow.initInfo);
            this._flows.push(shadowFlow);
            const reflectionFlow = new ReflectionProbeFlow();
            reflectionFlow.initialize(ReflectionProbeFlow.initInfo);
            this._flows.push(reflectionFlow);
            const forwardFlow = new ForwardFlow();
            forwardFlow.initialize(ForwardFlow.initInfo);
            this._flows.push(forwardFlow);
          }
          return true;
        }
        activate(swapchain) {
          if (EDITOR) {
            log('Forward render pipeline initialized.');
          }
          this._macros = {
            CC_PIPELINE_TYPE: PIPELINE_TYPE
          };
          this._pipelineSceneData = new PipelineSceneData();
          if (!super.activate(swapchain)) {
            return false;
          }
          if (!this._activeRenderer(swapchain)) {
            errorID(2402);
            return false;
          }
          return true;
        }
        _ensureEnoughSize(cameras) {
          let newWidth = this._width;
          let newHeight = this._height;
          for (let i = 0; i < cameras.length; ++i) {
            const window = cameras[i].window;
            newWidth = Math.max(window.width, newWidth);
            newHeight = Math.max(window.height, newHeight);
          }
          if (newWidth !== this._width || newHeight !== this._height) {
            this._width = newWidth;
            this._height = newHeight;
          }
        }
        destroy() {
          this._destroyUBOs();
          this._destroyQuadInputAssembler();
          const rpIter = this._renderPasses.values();
          let rpRes = rpIter.next();
          while (!rpRes.done) {
            rpRes.value.destroy();
            rpRes = rpIter.next();
          }
          this._commandBuffers.length = 0;
          return super.destroy();
        }
        _activeRenderer(swapchain) {
          const device = this.device;
          this._commandBuffers.push(device.commandBuffer);
          const descriptorSet = this._descriptorSet;
          const shadowMapSampler = this.globalDSManager.pointSampler;
          descriptorSet.bindSampler(UNIFORM_SHADOWMAP_BINDING, shadowMapSampler);
          descriptorSet.bindTexture(UNIFORM_SHADOWMAP_BINDING, getDefaultShadowTexture(this.device));
          descriptorSet.bindSampler(UNIFORM_SPOT_SHADOW_MAP_TEXTURE_BINDING, shadowMapSampler);
          descriptorSet.bindTexture(UNIFORM_SPOT_SHADOW_MAP_TEXTURE_BINDING, getDefaultShadowTexture(this.device));
          descriptorSet.update();
          return true;
        }
        _destroyUBOs() {
          const descriptorSet = this._descriptorSet;
          if (descriptorSet) {
            descriptorSet.getBuffer(UBOGlobal.BINDING).destroy();
            descriptorSet.getBuffer(UBOShadow.BINDING).destroy();
            descriptorSet.getBuffer(UBOCamera.BINDING).destroy();
            descriptorSet.getTexture(UNIFORM_SHADOWMAP_BINDING).destroy();
            descriptorSet.getTexture(UNIFORM_SPOT_SHADOW_MAP_TEXTURE_BINDING).destroy();
          }
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "renderTextures", [_dec2, serializable, _dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _class2)) || _class));
    }
  };
});