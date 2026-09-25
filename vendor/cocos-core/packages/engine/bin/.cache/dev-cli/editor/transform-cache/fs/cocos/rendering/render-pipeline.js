System.register("q-bundled:///fs/cocos/rendering/render-pipeline.js", ["../core/data/decorators/index.js", "pal/system-info", "./scene-culling.js", "../asset/assets/asset.js", "../gfx/index.js", "../render-scene/scene/camera.js", "./global-descriptor-set-manager.js", "./pipeline-ubo.js", "./render-flow.js", "./pipeline-event.js", "./pipeline-funcs.js", "../../pal/system-info/enum-type/index.js", "../core/index.js", "./define.js", "./render-types.js"], function (_export, _context) {
  "use strict";

  var ccclass, displayOrder, serializable, type, systemInfo, sceneCulling, validPunctualLightsCulling, Asset, AccessFlagBit, Attribute, BufferInfo, BufferUsageBit, ClearFlagBit, ColorAttachment, DepthStencilAttachment, Feature, Format, FormatFeatureBit, FramebufferInfo, InputAssemblerInfo, LoadOp, MemoryUsageBit, Rect, RenderPassInfo, StoreOp, SurfaceTransform, TextureInfo, TextureType, TextureUsageBit, Viewport, GeneralBarrierInfo, deviceManager, SkyBoxFlagValue, GlobalDSManager, PipelineUBO, RenderFlow, PipelineEventProcessor, PipelineEventType, decideProfilerCamera, OS, macro, murmurhash2_32_gc, cclegacy, UBOSkinning, PipelineInputAssemblerData, BloomRenderData, PipelineRenderData, _dec, _dec2, _dec3, _dec4, _class, _class2, _descriptor, _descriptor2, MAX_BLOOM_FILTER_PASS_NUM, tmpRect, tmpViewport, RenderPipeline;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function hashFrameBuffer(fbo) {
    let hash = 666;
    for (const color of fbo.colorTextures) {
      const info = color == null ? void 0 : color.info;
      const hashStr = `${info.type}_${info.usage}_${info.format}_${info.width}_${info.height}_${info.flags}_
            ${info.layerCount}_${info.levelCount}_${info.samples}_${info.depth}_${info.externalRes}`;
      hash = murmurhash2_32_gc(hashStr, hash);
    }
    if (fbo.depthStencilTexture) {
      const info = fbo.depthStencilTexture.info;
      const hashStr = `${info.type}_${info.usage}_${info.format}_${info.width}_${info.height}_${info.flags}_
            ${info.layerCount}_${info.levelCount}_${info.samples}_${info.depth}_${info.externalRes}`;
      hash = murmurhash2_32_gc(hashStr, hash);
    }
    return hash;
  }

  /**
   * @en Render pipeline describes how we handle the rendering process for all render objects in the related render scene root.
   * It contains some general pipeline configurations, necessary rendering resources and some [[RenderFlow]]s.
   * The rendering process function [[render]] is invoked by [[Root]] for all [[Camera]]s.
   * @zh 渲染管线对象决定了引擎对相关渲染场景下的所有渲染对象实施的完整渲染流程。
   * 这个类主要包含一些通用的管线配置，必要的渲染资源和一些 [[RenderFlow]]。
   * 渲染流程函数 [[render]] 会由 [[Root]] 发起调用并对所有 [[Camera]] 执行预设的渲染流程。
   */
  _export({
    BloomRenderData: void 0,
    PipelineRenderData: void 0
  });
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      displayOrder = _coreDataDecoratorsIndexJs.displayOrder;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      type = _coreDataDecoratorsIndexJs.type;
    }, function (_palSystemInfo) {
      systemInfo = _palSystemInfo.systemInfo;
    }, function (_sceneCullingJs) {
      sceneCulling = _sceneCullingJs.sceneCulling;
      validPunctualLightsCulling = _sceneCullingJs.validPunctualLightsCulling;
    }, function (_assetAssetsAssetJs) {
      Asset = _assetAssetsAssetJs.Asset;
    }, function (_gfxIndexJs) {
      AccessFlagBit = _gfxIndexJs.AccessFlagBit;
      Attribute = _gfxIndexJs.Attribute;
      BufferInfo = _gfxIndexJs.BufferInfo;
      BufferUsageBit = _gfxIndexJs.BufferUsageBit;
      ClearFlagBit = _gfxIndexJs.ClearFlagBit;
      ColorAttachment = _gfxIndexJs.ColorAttachment;
      DepthStencilAttachment = _gfxIndexJs.DepthStencilAttachment;
      Feature = _gfxIndexJs.Feature;
      Format = _gfxIndexJs.Format;
      FormatFeatureBit = _gfxIndexJs.FormatFeatureBit;
      FramebufferInfo = _gfxIndexJs.FramebufferInfo;
      InputAssemblerInfo = _gfxIndexJs.InputAssemblerInfo;
      LoadOp = _gfxIndexJs.LoadOp;
      MemoryUsageBit = _gfxIndexJs.MemoryUsageBit;
      Rect = _gfxIndexJs.Rect;
      RenderPassInfo = _gfxIndexJs.RenderPassInfo;
      StoreOp = _gfxIndexJs.StoreOp;
      SurfaceTransform = _gfxIndexJs.SurfaceTransform;
      TextureInfo = _gfxIndexJs.TextureInfo;
      TextureType = _gfxIndexJs.TextureType;
      TextureUsageBit = _gfxIndexJs.TextureUsageBit;
      Viewport = _gfxIndexJs.Viewport;
      GeneralBarrierInfo = _gfxIndexJs.GeneralBarrierInfo;
      deviceManager = _gfxIndexJs.deviceManager;
    }, function (_renderSceneSceneCameraJs) {
      SkyBoxFlagValue = _renderSceneSceneCameraJs.SkyBoxFlagValue;
    }, function (_globalDescriptorSetManagerJs) {
      GlobalDSManager = _globalDescriptorSetManagerJs.GlobalDSManager;
    }, function (_pipelineUboJs) {
      PipelineUBO = _pipelineUboJs.PipelineUBO;
    }, function (_renderFlowJs) {
      RenderFlow = _renderFlowJs.RenderFlow;
    }, function (_pipelineEventJs) {
      PipelineEventProcessor = _pipelineEventJs.PipelineEventProcessor;
      PipelineEventType = _pipelineEventJs.PipelineEventType;
    }, function (_pipelineFuncsJs) {
      decideProfilerCamera = _pipelineFuncsJs.decideProfilerCamera;
    }, function (_palSystemInfoEnumTypeIndexJs) {
      OS = _palSystemInfoEnumTypeIndexJs.OS;
    }, function (_coreIndexJs) {
      macro = _coreIndexJs.macro;
      murmurhash2_32_gc = _coreIndexJs.murmurhash2_32_gc;
      cclegacy = _coreIndexJs.cclegacy;
    }, function (_defineJs) {
      UBOSkinning = _defineJs.UBOSkinning;
    }, function (_renderTypesJs) {
      PipelineInputAssemblerData = _renderTypesJs.PipelineInputAssemblerData;
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
      /**
       * @en Render pipeline information descriptor
       * @zh 渲染管线描述信息。
       */
      _export("MAX_BLOOM_FILTER_PASS_NUM", MAX_BLOOM_FILTER_PASS_NUM = 6);
      tmpRect = new Rect();
      tmpViewport = new Viewport();
      _export("BloomRenderData", BloomRenderData = class BloomRenderData {
        constructor() {
          this.renderPass = null;
          this.sampler = null;
          this.prefiterTex = null;
          this.downsampleTexs = [];
          this.upsampleTexs = [];
          this.combineTex = null;
          this.prefilterFramebuffer = null;
          this.downsampleFramebuffers = [];
          this.upsampleFramebuffers = [];
          this.combineFramebuffer = null;
        }
      });
      _export("PipelineRenderData", PipelineRenderData = class PipelineRenderData {
        constructor() {
          this.outputFrameBuffer = null;
          this.outputRenderTargets = [];
          this.outputDepth = null;
          this.sampler = null;
          this.bloom = null;
        }
      });
      _export("RenderPipeline", RenderPipeline = (_dec = ccclass('cc.RenderPipeline'), _dec2 = displayOrder(0), _dec3 = displayOrder(1), _dec4 = type([RenderFlow]), _dec(_class = (_class2 = class RenderPipeline extends Asset {
        /**
         * @en The tag of pipeline.
         * @zh 管线的标签。
         * @readonly
         */
        get tag() {
          return this._tag;
        }

        /**
         * @en The flows of pipeline.
         * @zh 管线的渲染流程列表。
         * @readonly
         */
        get flows() {
          return this._flows;
        }

        /**
         * @en Tag
         * @zh 标签
         * @readonly
         */

        constructor(name) {
          super(name);
          _initializerDefineProperty(this, "_tag", _descriptor, this);
          /**
           * @en Flows
           * @zh 渲染流程列表
           * @readonly
           */
          _initializerDefineProperty(this, "_flows", _descriptor2, this);
          this._quadIB = null;
          this._quadVBOnscreen = null;
          this._quadVBOffscreen = null;
          this._quadIAOnscreen = null;
          this._quadIAOffscreen = null;
          this._eventProcessor = new PipelineEventProcessor();
          this._device = void 0;
          this._globalDSManager = void 0;
          this._descriptorSet = void 0;
          this._commandBuffers = [];
          this._pipelineUBO = new PipelineUBO();
          this._macros = {};
          this._constantMacros = '';
          this._profiler = null;
          this._geometryRenderer = null;
          this._pipelineRenderData = null;
          this._renderPasses = new Map();
          this._width = 0;
          this._height = 0;
          this._lastUsedRenderArea = new Rect();
          this._clusterEnabled = false;
          this._bloomEnabled = false;
        }

        /**
         * @zh
         * 四边形输入汇集器。
         */
        get quadIAOnscreen() {
          return this._quadIAOnscreen;
        }
        get quadIAOffscreen() {
          return this._quadIAOffscreen;
        }
        getPipelineRenderData() {
          return this._pipelineRenderData;
        }

        /**
         * @en
         * Constant macro string, static throughout the whole runtime.
         * Used to pass device-specific parameters to shader.
         * @zh 常量宏定义字符串，运行时全程不会改变，用于给 shader 传一些只和平台相关的参数。
         * @readonly
         */
        get constantMacros() {
          return this._constantMacros;
        }

        /**
         * @en
         * The current global-scoped shader macros.
         * Used to control effects like IBL, fog, etc.
         * @zh 当前的全局宏定义，用于控制如 IBL、雾效等模块。
         * @readonly
         */
        get macros() {
          return this._macros;
        }
        get device() {
          return this._device;
        }
        get globalDSManager() {
          return this._globalDSManager;
        }
        get descriptorSetLayout() {
          return this._globalDSManager.descriptorSetLayout;
        }
        get descriptorSet() {
          return this._descriptorSet;
        }
        get commandBuffers() {
          return this._commandBuffers;
        }
        get pipelineUBO() {
          return this._pipelineUBO;
        }
        get pipelineSceneData() {
          return this._pipelineSceneData;
        }
        set profiler(value) {
          this._profiler = value;
        }
        get profiler() {
          return this._profiler;
        }

        /**
         * @deprecated since v3.6, please use camera.geometryRenderer instead.
         */
        get geometryRenderer() {
          return this._geometryRenderer;
        }
        set clusterEnabled(value) {
          this._clusterEnabled = value;
        }
        get clusterEnabled() {
          return this._clusterEnabled;
        }
        set bloomEnabled(value) {
          this._bloomEnabled = value;
        }
        get bloomEnabled() {
          return this._bloomEnabled;
        }
        /**
         * @en The initialization process, user shouldn't use it in most case, only useful when need to generate render pipeline programmatically.
         * @zh 初始化函数，正常情况下不会用到，仅用于程序化生成渲染管线的情况。
         * @param info The render pipeline information
         */
        initialize(info) {
          this._flows = info.flows;
          if (info.tag) {
            this._tag = info.tag;
          }
          return true;
        }
        createRenderPass(clearFlags, colorFmt, depthFmt) {
          const device = this._device;
          const colorAttachment = new ColorAttachment();
          const depthStencilAttachment = new DepthStencilAttachment();
          colorAttachment.format = colorFmt;
          depthStencilAttachment.format = depthFmt;
          depthStencilAttachment.stencilStoreOp = StoreOp.DISCARD;
          depthStencilAttachment.depthStoreOp = StoreOp.DISCARD;
          if (!(clearFlags & ClearFlagBit.COLOR)) {
            if (clearFlags & SkyBoxFlagValue.VALUE) {
              colorAttachment.loadOp = LoadOp.CLEAR;
            } else {
              colorAttachment.loadOp = LoadOp.LOAD;
              colorAttachment.barrier = device.getGeneralBarrier(new GeneralBarrierInfo(AccessFlagBit.COLOR_ATTACHMENT_WRITE, AccessFlagBit.COLOR_ATTACHMENT_WRITE));
            }
          }
          if ((clearFlags & ClearFlagBit.DEPTH_STENCIL) !== ClearFlagBit.DEPTH_STENCIL) {
            if (!(clearFlags & ClearFlagBit.DEPTH)) depthStencilAttachment.depthLoadOp = LoadOp.LOAD;
            if (!(clearFlags & ClearFlagBit.STENCIL)) depthStencilAttachment.stencilLoadOp = LoadOp.LOAD;
          }
          depthStencilAttachment.barrier = device.getGeneralBarrier(new GeneralBarrierInfo(AccessFlagBit.DEPTH_STENCIL_ATTACHMENT_WRITE, AccessFlagBit.DEPTH_STENCIL_ATTACHMENT_WRITE));
          const renderPassInfo = new RenderPassInfo([colorAttachment], depthStencilAttachment);
          return device.createRenderPass(renderPassInfo);
        }
        getRenderPass(clearFlags, fbo) {
          const fbHash = hashFrameBuffer(fbo);
          const hash = murmurhash2_32_gc(`${fbHash}_${clearFlags}`, 666);
          let renderPass = this._renderPasses.get(hash);
          if (renderPass) {
            return renderPass;
          }
          renderPass = this.createRenderPass(clearFlags, fbo.colorTextures[0].format, fbo.depthStencilTexture.format);
          this._renderPasses.set(hash, renderPass);
          return renderPass;
        }
        newFramebufferByRatio(dyingFramebuffer) {
          const sceneData = this.pipelineSceneData;
          const width = this._width * sceneData.shadingScale;
          const height = this._height * sceneData.shadingScale;
          const colorTexArr = dyingFramebuffer.colorTextures;
          for (let i = 0; i < colorTexArr.length; i++) {
            colorTexArr[i].resize(width, height);
          }
          if (dyingFramebuffer.depthStencilTexture) {
            dyingFramebuffer.depthStencilTexture.resize(width, height);
          }
          // move
          const newFramebuffer = this._device.createFramebuffer(new FramebufferInfo(dyingFramebuffer.renderPass, colorTexArr, dyingFramebuffer.depthStencilTexture));
          dyingFramebuffer.destroy();
          return newFramebuffer;
        }

        /**
         * @en generate renderArea by camera
         * @zh 生成renderArea
         * @param camera the camera
         * @returns
         */
        generateRenderArea(camera, out) {
          const vp = camera.viewport;
          const w = camera.window.width;
          const h = camera.window.height;
          out.x = vp.x * w;
          out.y = vp.y * h;
          out.width = vp.width * w;
          out.height = vp.height * h;
        }
        generateViewport(camera, out) {
          this.generateRenderArea(camera, tmpRect);
          if (!out) out = tmpViewport;
          const shadingScale = this.pipelineSceneData.shadingScale;
          out.left = tmpRect.x * shadingScale;
          out.top = tmpRect.y * shadingScale;
          out.width = tmpRect.width * shadingScale;
          out.height = tmpRect.height * shadingScale;
          return out;
        }
        generateScissor(camera, out) {
          if (!out) out = tmpRect;
          this.generateRenderArea(camera, out);
          const shadingScale = this.pipelineSceneData.shadingScale;
          out.x *= shadingScale;
          out.y *= shadingScale;
          out.width *= shadingScale;
          out.height *= shadingScale;
          return out;
        }
        get shadingScale() {
          return this._pipelineSceneData.shadingScale;
        }
        set shadingScale(val) {
          if (this._pipelineSceneData.shadingScale !== val) {
            this._pipelineSceneData.shadingScale = val;
            this.emit(PipelineEventType.ATTACHMENT_SCALE_CAHNGED, val);
          }
        }
        getMacroString(name) {
          const str = this._macros[name];
          if (str === undefined) {
            return '';
          }
          return str;
        }
        getMacroInt(name) {
          const value = this._macros[name];
          if (value === undefined) {
            return 0;
          }
          return value;
        }
        getMacroBool(name) {
          const value = this._macros[name];
          if (value === undefined) {
            return false;
          }
          return value;
        }
        setMacroString(name, value) {
          this._macros[name] = value;
        }
        setMacroInt(name, value) {
          this._macros[name] = value;
        }
        setMacroBool(name, value) {
          this._macros[name] = value;
        }

        /**
         * @en Activate the render pipeline after loaded, it mainly activate the flows
         * @zh 当渲染管线资源加载完成后，启用管线，主要是启用管线内的 flow
         * TODO: remove swapchain dependency at this stage
         * after deferred pipeline can handle multiple swapchains
         */
        activate(swapchain) {
          this._device = deviceManager.gfxDevice;
          this._generateConstantMacros();
          this._globalDSManager = new GlobalDSManager(this._device);
          this._descriptorSet = this._globalDSManager.globalDescriptorSet;
          this._pipelineUBO.activate(this._device, this);
          // update global defines in advance here for deferred pipeline may tryCompile shaders.
          this._macros.CC_USE_HDR = this._pipelineSceneData.isHDR;
          this._macros.CC_USE_DEBUG_VIEW = 0;
          this._generateConstantMacros();
          this._pipelineSceneData.activate(this._device);
          for (let i = 0; i < this._flows.length; i++) {
            this._flows[i].activate(this);
          }
          return true;
        }
        _ensureEnoughSize(cameras) {}

        /**
         * @en Render function, it basically run the render process of all flows in sequence for the given view.
         * @zh 渲染函数，对指定的渲染视图按顺序执行所有渲染流程。
         * @param view Render view。
         */
        render(cameras) {
          if (cameras.length === 0) {
            return;
          }
          this.updateGeometryRenderer(cameras); // for capability
          this._commandBuffers[0].begin();
          this.emit(PipelineEventType.RENDER_FRAME_BEGIN, cameras);
          this._ensureEnoughSize(cameras);
          decideProfilerCamera(cameras);
          for (let i = 0; i < cameras.length; i++) {
            const camera = cameras[i];
            if (camera.scene) {
              this.emit(PipelineEventType.RENDER_CAMERA_BEGIN, camera);
              validPunctualLightsCulling(this.pipelineSceneData, camera);
              sceneCulling(this.pipelineSceneData, this.pipelineUBO, camera);
              this._pipelineUBO.updateGlobalUBO(camera.window);
              this._pipelineUBO.updateCameraUBO(camera);
              for (let j = 0; j < this._flows.length; j++) {
                this._flows[j].render(camera);
              }
              this.emit(PipelineEventType.RENDER_CAMERA_END, camera);
            }
          }
          this.emit(PipelineEventType.RENDER_FRAME_END, cameras);
          this._commandBuffers[0].end();
          this._device.queue.submit(this._commandBuffers);
        }

        /**
         * @zh
         * 销毁四边形输入汇集器。
         */
        _destroyQuadInputAssembler() {
          if (this._quadIB) {
            this._quadIB.destroy();
            this._quadIB = null;
          }
          if (this._quadVBOnscreen) {
            this._quadVBOnscreen.destroy();
            this._quadVBOnscreen = null;
          }
          if (this._quadVBOffscreen) {
            this._quadVBOffscreen.destroy();
            this._quadVBOffscreen = null;
          }
          if (this._quadIAOnscreen) {
            this._quadIAOnscreen.destroy();
            this._quadIAOnscreen = null;
          }
          if (this._quadIAOffscreen) {
            this._quadIAOffscreen.destroy();
            this._quadIAOffscreen = null;
          }
        }
        _destroyBloomData() {
          var _bloom$renderPass;
          const bloom = this._pipelineRenderData.bloom;
          if (bloom === null) return;
          if (bloom.prefiterTex) bloom.prefiterTex.destroy();
          if (bloom.prefilterFramebuffer) bloom.prefilterFramebuffer.destroy();
          for (let i = 0; i < bloom.downsampleTexs.length; ++i) {
            bloom.downsampleTexs[i].destroy();
            bloom.downsampleFramebuffers[i].destroy();
          }
          bloom.downsampleTexs.length = 0;
          bloom.downsampleFramebuffers.length = 0;
          for (let i = 0; i < bloom.upsampleTexs.length; ++i) {
            bloom.upsampleTexs[i].destroy();
            bloom.upsampleFramebuffers[i].destroy();
          }
          bloom.upsampleTexs.length = 0;
          bloom.upsampleFramebuffers.length = 0;
          if (bloom.combineTex) bloom.combineTex.destroy();
          if (bloom.combineFramebuffer) bloom.combineFramebuffer.destroy();
          (_bloom$renderPass = bloom.renderPass) == null || _bloom$renderPass.destroy();
          this._pipelineRenderData.bloom = null;
        }
        _genQuadVertexData(surfaceTransform, renderArea) {
          const vbData = new Float32Array(4 * 4);
          const minX = renderArea.x / this._width;
          const maxX = (renderArea.x + renderArea.width) / this._width;
          let minY = renderArea.y / this._height;
          let maxY = (renderArea.y + renderArea.height) / this._height;
          if (this.device.capabilities.screenSpaceSignY > 0) {
            const temp = maxY;
            maxY = minY;
            minY = temp;
          }
          let n = 0;
          switch (surfaceTransform) {
            case SurfaceTransform.IDENTITY:
              n = 0;
              vbData[n++] = -1.0;
              vbData[n++] = -1.0;
              vbData[n++] = minX;
              vbData[n++] = maxY;
              vbData[n++] = 1.0;
              vbData[n++] = -1.0;
              vbData[n++] = maxX;
              vbData[n++] = maxY;
              vbData[n++] = -1.0;
              vbData[n++] = 1.0;
              vbData[n++] = minX;
              vbData[n++] = minY;
              vbData[n++] = 1.0;
              vbData[n++] = 1.0;
              vbData[n++] = maxX;
              vbData[n++] = minY;
              break;
            case SurfaceTransform.ROTATE_90:
              n = 0;
              vbData[n++] = -1.0;
              vbData[n++] = -1.0;
              vbData[n++] = maxX;
              vbData[n++] = maxY;
              vbData[n++] = 1.0;
              vbData[n++] = -1.0;
              vbData[n++] = maxX;
              vbData[n++] = minY;
              vbData[n++] = -1.0;
              vbData[n++] = 1.0;
              vbData[n++] = minX;
              vbData[n++] = maxY;
              vbData[n++] = 1.0;
              vbData[n++] = 1.0;
              vbData[n++] = minX;
              vbData[n++] = minY;
              break;
            case SurfaceTransform.ROTATE_180:
              n = 0;
              vbData[n++] = -1.0;
              vbData[n++] = -1.0;
              vbData[n++] = minX;
              vbData[n++] = minY;
              vbData[n++] = 1.0;
              vbData[n++] = -1.0;
              vbData[n++] = maxX;
              vbData[n++] = minY;
              vbData[n++] = -1.0;
              vbData[n++] = 1.0;
              vbData[n++] = minX;
              vbData[n++] = maxY;
              vbData[n++] = 1.0;
              vbData[n++] = 1.0;
              vbData[n++] = maxX;
              vbData[n++] = maxY;
              break;
            case SurfaceTransform.ROTATE_270:
              n = 0;
              vbData[n++] = -1.0;
              vbData[n++] = -1.0;
              vbData[n++] = minX;
              vbData[n++] = minY;
              vbData[n++] = 1.0;
              vbData[n++] = -1.0;
              vbData[n++] = minX;
              vbData[n++] = maxY;
              vbData[n++] = -1.0;
              vbData[n++] = 1.0;
              vbData[n++] = maxX;
              vbData[n++] = minY;
              vbData[n++] = 1.0;
              vbData[n++] = 1.0;
              vbData[n++] = maxX;
              vbData[n++] = maxY;
              break;
            default:
              break;
          }
          return vbData;
        }

        /**
         * @zh
         * 创建四边形输入汇集器。
         */
        _createQuadInputAssembler() {
          // create vertex buffer
          const inputAssemblerData = new PipelineInputAssemblerData();
          const vbStride = Float32Array.BYTES_PER_ELEMENT * 4;
          const vbSize = vbStride * 4;
          const quadVB = this._device.createBuffer(new BufferInfo(BufferUsageBit.VERTEX | BufferUsageBit.TRANSFER_DST, MemoryUsageBit.DEVICE | MemoryUsageBit.HOST, vbSize, vbStride));
          if (!quadVB) {
            return inputAssemblerData;
          }

          // create index buffer
          const ibStride = Uint8Array.BYTES_PER_ELEMENT;
          const ibSize = ibStride * 6;
          const quadIB = this._device.createBuffer(new BufferInfo(BufferUsageBit.INDEX | BufferUsageBit.TRANSFER_DST, MemoryUsageBit.DEVICE, ibSize, ibStride));
          if (!quadIB) {
            return inputAssemblerData;
          }
          const indices = new Uint8Array(6);
          indices[0] = 0;
          indices[1] = 1;
          indices[2] = 2;
          indices[3] = 1;
          indices[4] = 3;
          indices[5] = 2;
          quadIB.update(indices);

          // create input assembler

          const attributes = new Array(2);
          attributes[0] = new Attribute('a_position', Format.RG32F);
          attributes[1] = new Attribute('a_texCoord', Format.RG32F);
          const quadIA = this._device.createInputAssembler(new InputAssemblerInfo(attributes, [quadVB], quadIB));
          inputAssemblerData.quadIB = quadIB;
          inputAssemblerData.quadVB = quadVB;
          inputAssemblerData.quadIA = quadIA;
          return inputAssemblerData;
        }
        updateQuadVertexData(renderArea, window) {
          const cachedArea = this._lastUsedRenderArea;
          if (cachedArea.x === renderArea.x && cachedArea.y === renderArea.y && cachedArea.width === renderArea.width && cachedArea.height === renderArea.height) {
            return;
          }
          const offData = this._genQuadVertexData(SurfaceTransform.IDENTITY, renderArea);
          this._quadVBOffscreen.update(offData);
          const onData = this._genQuadVertexData(window.swapchain && window.swapchain.surfaceTransform || SurfaceTransform.IDENTITY, renderArea);
          this._quadVBOnscreen.update(onData);
          cachedArea.copy(renderArea);
        }

        /**
         * @en Internal destroy function
         * @zh 内部销毁函数。
         */
        destroy() {
          var _this$_globalDSManage, _this$_pipelineSceneD;
          for (let i = 0; i < this._flows.length; i++) {
            this._flows[i].destroy();
          }
          this._flows.length = 0;
          if (this._descriptorSet) {
            this._descriptorSet.destroy();
          }
          (_this$_globalDSManage = this._globalDSManager) == null || _this$_globalDSManage.destroy();
          for (let i = 0; i < this._commandBuffers.length; i++) {
            this._commandBuffers[i].destroy();
          }
          this._commandBuffers.length = 0;
          this._pipelineUBO.destroy();
          (_this$_pipelineSceneD = this._pipelineSceneData) == null || _this$_pipelineSceneD.destroy();
          return super.destroy();
        }
        onGlobalPipelineStateChanged() {
          // do nothing
        }
        _generateConstantMacros() {
          let str = '';
          str += `#define CC_DEVICE_SUPPORT_FLOAT_TEXTURE ${this.device.getFormatFeatures(Format.RGBA32F) & (FormatFeatureBit.RENDER_TARGET | FormatFeatureBit.SAMPLED_TEXTURE) ? 1 : 0}\n`;
          str += `#define CC_ENABLE_CLUSTERED_LIGHT_CULLING ${this._clusterEnabled ? 1 : 0}\n`;
          str += `#define CC_DEVICE_MAX_VERTEX_UNIFORM_VECTORS ${this.device.capabilities.maxVertexUniformVectors}\n`;
          str += `#define CC_DEVICE_MAX_FRAGMENT_UNIFORM_VECTORS ${this.device.capabilities.maxFragmentUniformVectors}\n`;
          str += `#define CC_DEVICE_CAN_BENEFIT_FROM_INPUT_ATTACHMENT ${this.device.hasFeature(Feature.INPUT_ATTACHMENT_BENEFIT) ? 1 : 0}\n`;
          str += `#define CC_PLATFORM_ANDROID_AND_WEBGL ${systemInfo.os === OS.ANDROID && systemInfo.isBrowser ? 1 : 0}\n`;
          str += `#define CC_ENABLE_WEBGL_HIGHP_STRUCT_VALUES ${macro.ENABLE_WEBGL_HIGHP_STRUCT_VALUES ? 1 : 0}\n`;
          const jointUniformCapacity = UBOSkinning.JOINT_UNIFORM_CAPACITY;
          str += `#define CC_JOINT_UNIFORM_CAPACITY ${jointUniformCapacity}\n`;
          this._constantMacros = str;
        }
        updateGeometryRenderer(cameras) {
          if (this._geometryRenderer) {
            return;
          }

          // Query the first camera rendering to swapchain.
          for (let i = 0; i < cameras.length; i++) {
            const camera = cameras[i];
            if (camera && camera.window && camera.window.swapchain) {
              camera.initGeometryRenderer();
              this._geometryRenderer = camera.geometryRenderer;
              return;
            }
          }
        }
        generateBloomRenderData() {
          if (this._pipelineRenderData.bloom != null) return;
          const bloom = this._pipelineRenderData.bloom = new BloomRenderData();
          const device = this.device;

          // create renderPass
          const colorAttachment = new ColorAttachment();
          colorAttachment.format = Format.RGBA8;
          colorAttachment.loadOp = LoadOp.CLEAR;
          colorAttachment.storeOp = StoreOp.STORE;
          colorAttachment.barrier = device.getGeneralBarrier(new GeneralBarrierInfo(AccessFlagBit.NONE, AccessFlagBit.COLOR_ATTACHMENT_WRITE));
          bloom.renderPass = device.createRenderPass(new RenderPassInfo([colorAttachment]));
          let curWidth = this._width;
          let curHeight = this._height;

          // prefilter
          bloom.prefiterTex = device.createTexture(new TextureInfo(TextureType.TEX2D, TextureUsageBit.COLOR_ATTACHMENT | TextureUsageBit.SAMPLED, Format.RGBA8, curWidth >> 1, curHeight >> 1));
          bloom.prefilterFramebuffer = device.createFramebuffer(new FramebufferInfo(bloom.renderPass, [bloom.prefiterTex]));

          // downsample & upsample
          curWidth >>= 1;
          curHeight >>= 1;
          for (let i = 0; i < MAX_BLOOM_FILTER_PASS_NUM; ++i) {
            bloom.downsampleTexs.push(device.createTexture(new TextureInfo(TextureType.TEX2D, TextureUsageBit.COLOR_ATTACHMENT | TextureUsageBit.SAMPLED, Format.RGBA8, curWidth >> 1, curHeight >> 1)));
            bloom.downsampleFramebuffers[i] = device.createFramebuffer(new FramebufferInfo(bloom.renderPass, [bloom.downsampleTexs[i]]));
            bloom.upsampleTexs.push(device.createTexture(new TextureInfo(TextureType.TEX2D, TextureUsageBit.COLOR_ATTACHMENT | TextureUsageBit.SAMPLED, Format.RGBA8, curWidth, curHeight)));
            bloom.upsampleFramebuffers[i] = device.createFramebuffer(new FramebufferInfo(bloom.renderPass, [bloom.upsampleTexs[i]]));
            curWidth >>= 1;
            curHeight >>= 1;
          }

          // combine
          bloom.combineTex = device.createTexture(new TextureInfo(TextureType.TEX2D, TextureUsageBit.COLOR_ATTACHMENT | TextureUsageBit.SAMPLED, Format.RGBA8, this._width, this._height));
          bloom.combineFramebuffer = device.createFramebuffer(new FramebufferInfo(bloom.renderPass, [bloom.combineTex]));

          // sampler
          bloom.sampler = this.globalDSManager.linearSampler;
        }

        /**
         * @en
         * Register an callback of the pipeline event type on the RenderPipeline.
         * @zh
         * 在渲染管线中注册管线事件类型的回调。
         */
        on(type, callback, target, once) {
          return this._eventProcessor.on(type, callback, target, once);
        }

        /**
         * @en
         * Register an callback of the pipeline event type on the RenderPipeline,
         * the callback will remove itself after the first time it is triggered.
         * @zh
         * 在渲染管线中注册管线事件类型的回调, 回调后会在第一时间删除自身。
         */
        once(type, callback, target) {
          return this._eventProcessor.once(type, callback, target);
        }

        /**
         * @en
         * Removes the listeners previously registered with the same type, callback, target and or useCapture,
         * if only type is passed as parameter, all listeners registered with that type will be removed.
         * @zh
         * 删除之前用同类型、回调、目标或 useCapture 注册的事件监听器，如果只传递 type，将会删除 type 类型的所有事件监听器。
         */
        off(type, callback, target) {
          this._eventProcessor.off(type, callback, target);
        }

        /**
         * @zh 派发一个指定事件，并传递需要的参数
         * @en Trigger an event directly with the event name and necessary arguments.
         * @param type - event type
         * @param args - Arguments when the event triggered
         */
        emit(type, arg0, arg1, arg2, arg3, arg4) {
          this._eventProcessor.emit(type, arg0, arg1, arg2, arg3, arg4);
        }

        /**
         * @en Removes all callbacks previously registered with the same target (passed as parameter).
         * This is not for removing all listeners in the current event target,
         * and this is not for removing all listeners the target parameter have registered.
         * It's only for removing all listeners (callback and target couple) registered on the current event target by the target parameter.
         * @zh 在当前 EventTarget 上删除指定目标（target 参数）注册的所有事件监听器。
         * 这个函数无法删除当前 EventTarget 的所有事件监听器，也无法删除 target 参数所注册的所有事件监听器。
         * 这个函数只能删除 target 参数在当前 EventTarget 上注册的所有事件监听器。
         * @param typeOrTarget - The target to be searched for all related listeners
         */
        targetOff(typeOrTarget) {
          this._eventProcessor.targetOff(typeOrTarget);
        }

        /**
         * @zh 移除在特定事件类型中注册的所有回调或在某个目标中注册的所有回调。
         * @en Removes all callbacks registered in a certain event type or all callbacks registered with a certain target
         * @param typeOrTarget - The event type or target with which the listeners will be removed
         */
        removeAll(typeOrTarget) {
          this._eventProcessor.removeAll(typeOrTarget);
        }

        /**
         * @zh 检查指定事件是否已注册回调。
         * @en Checks whether there is correspond event listener registered on the given event.
         * @param type - Event type.
         * @param callback - Callback function when event triggered.
         * @param target - Callback callee.
         */
        hasEventListener(type, callback, target) {
          return this._eventProcessor.hasEventListener(type, callback, target);
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_tag", [_dec2, serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_flows", [_dec3, _dec4, serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _class2)) || _class)); // Do not delete, for the class detection of editor
      cclegacy.RenderPipeline = RenderPipeline;
    }
  };
});