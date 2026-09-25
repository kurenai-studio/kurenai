System.register("q-bundled:///fs/cocos/rendering/custom/web-pipeline.js", ["pal/system-info", "../../../../virtual/internal%253Aconstants.js", "../../gfx/index.js", "../../core/index.js", "./types.js", "./render-graph.js", "./pipeline.js", "../pipeline-scene-data.js", "../../render-scene/scene/index.js", "../../render-scene/scene/light.js", "./layout-graph.js", "./executor.js", "../define.js", "../../../pal/system-info/enum-type/index.js", "./compiler.js", "../../asset/assets/index.js", "../pipeline-funcs.js", "../debug-view.js", "./define.js", "./layout-graph-utils.js", "../../core/global-exports.js", "./web-pipeline-types.js"], function (_export, _context) {
  "use strict";

  var systemInfo, DEBUG, EDITOR, Feature, Format, FormatFeatureBit, ClearFlagBit, deviceManager, Viewport, API, SamplerInfo, Filter, Address, LoadOp, StoreOp, TextureType, ResolveMode, SampleCount, Color, ComparisonFunc, Vec4, macro, cclegacy, RecyclePool, assert, ResolveFlags, AccessType, AttachmentType, LightingMode, QueueHint, RenderCommonObjectPool, ResolvePair, ResourceDimension, ResourceFlags, ResourceResidency, SceneFlags, UpdateFrequency, ComputePass, RasterPass, RasterSubpass, RenderData, RenderGraph, RenderGraphValue, RenderQueue, RenderSwapchain, ResourceDesc, ResourceGraph, ResourceGraphValue, ResourceStates, ResourceTraits, SceneData, PersistentBuffer, RenderGraphObjectPool, CullingFlags, ManagedResource, ManagedBuffer, BlitType, PipelineType, PipelineCapabilities, PipelineSceneData, PCFType, ProbeType, LightType, LayoutGraphData, Executor, getDefaultShadowTexture, supportsR32FloatTexture, supportsRGBA16HalfFloatTexture, UBOSkinning, OS, Compiler, Material, decideProfilerCamera, DebugViewCompositeType, buildReflectionProbePass, genHashValue, resetPassMGState, createGfxDescriptorSetsAndPipelines, legacyCC, WebSetter, setCameraUBOValues, setShadowUBOLightView, setShadowUBOView, setTextureUBOView, PipelinePool, WebSceneBuilder, WebRenderQueueBuilder, WebRenderSubpassBuilder, WebRenderPassBuilder, WebComputeQueueBuilder, WebComputePassBuilder, WebMovePassBuilder, WebCopyPassBuilder, WebPipeline, _uboVec, _samplerPointInfo, pipelinePool, renderGraphPool, emptyMaterial, emptyRenderData;
  function setComputeConstants(setter, layoutName) {
    const director = cclegacy.director;
    const root = director.root;
    const pipeline = root.pipeline;
    // setter.addConstant('CCConst', layoutName);
  }
  function getTextureType(dimension, arraySize) {
    switch (dimension) {
      case ResourceDimension.TEXTURE1D:
        return arraySize > 1 ? TextureType.TEX1D_ARRAY : TextureType.TEX1D;
      case ResourceDimension.TEXTURE2D:
        return arraySize > 1 ? TextureType.TEX2D_ARRAY : TextureType.TEX2D;
      case ResourceDimension.TEXTURE3D:
        return TextureType.TEX3D;
      case ResourceDimension.BUFFER:
        return TextureType.TEX2D;
      default:
        break;
    }
    return TextureType.TEX2D;
  }
  function getResourceDimension(type) {
    switch (type) {
      case TextureType.TEX1D:
      case TextureType.TEX1D_ARRAY:
        return ResourceDimension.TEXTURE1D;
      case TextureType.TEX2D:
      case TextureType.TEX2D_ARRAY:
      case TextureType.CUBE:
        return ResourceDimension.TEXTURE2D;
      case TextureType.TEX3D:
        return ResourceDimension.TEXTURE3D;
      default:
        break;
    }
    return ResourceDimension.TEXTURE2D;
  }
  function isManaged(residency) {
    return residency === ResourceResidency.MANAGED || residency === ResourceResidency.MEMORYLESS;
  }
  _export({
    WebSceneBuilder: void 0,
    WebRenderQueueBuilder: void 0,
    WebRenderSubpassBuilder: void 0,
    WebRenderPassBuilder: void 0,
    WebComputeQueueBuilder: void 0,
    WebComputePassBuilder: void 0,
    WebMovePassBuilder: void 0,
    WebCopyPassBuilder: void 0,
    WebPipeline: void 0
  });
  return {
    setters: [function (_palSystemInfo) {
      systemInfo = _palSystemInfo.systemInfo;
    }, function (_virtualInternal253AconstantsJs) {
      DEBUG = _virtualInternal253AconstantsJs.DEBUG;
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
    }, function (_gfxIndexJs) {
      Feature = _gfxIndexJs.Feature;
      Format = _gfxIndexJs.Format;
      FormatFeatureBit = _gfxIndexJs.FormatFeatureBit;
      ClearFlagBit = _gfxIndexJs.ClearFlagBit;
      deviceManager = _gfxIndexJs.deviceManager;
      Viewport = _gfxIndexJs.Viewport;
      API = _gfxIndexJs.API;
      SamplerInfo = _gfxIndexJs.SamplerInfo;
      Filter = _gfxIndexJs.Filter;
      Address = _gfxIndexJs.Address;
      LoadOp = _gfxIndexJs.LoadOp;
      StoreOp = _gfxIndexJs.StoreOp;
      TextureType = _gfxIndexJs.TextureType;
      ResolveMode = _gfxIndexJs.ResolveMode;
      SampleCount = _gfxIndexJs.SampleCount;
      Color = _gfxIndexJs.Color;
      ComparisonFunc = _gfxIndexJs.ComparisonFunc;
    }, function (_coreIndexJs) {
      Vec4 = _coreIndexJs.Vec4;
      macro = _coreIndexJs.macro;
      cclegacy = _coreIndexJs.cclegacy;
      RecyclePool = _coreIndexJs.RecyclePool;
      assert = _coreIndexJs.assert;
    }, function (_typesJs) {
      ResolveFlags = _typesJs.ResolveFlags;
      AccessType = _typesJs.AccessType;
      AttachmentType = _typesJs.AttachmentType;
      LightingMode = _typesJs.LightingMode;
      QueueHint = _typesJs.QueueHint;
      RenderCommonObjectPool = _typesJs.RenderCommonObjectPool;
      ResolvePair = _typesJs.ResolvePair;
      ResourceDimension = _typesJs.ResourceDimension;
      ResourceFlags = _typesJs.ResourceFlags;
      ResourceResidency = _typesJs.ResourceResidency;
      SceneFlags = _typesJs.SceneFlags;
      UpdateFrequency = _typesJs.UpdateFrequency;
    }, function (_renderGraphJs) {
      ComputePass = _renderGraphJs.ComputePass;
      RasterPass = _renderGraphJs.RasterPass;
      RasterSubpass = _renderGraphJs.RasterSubpass;
      RenderData = _renderGraphJs.RenderData;
      RenderGraph = _renderGraphJs.RenderGraph;
      RenderGraphValue = _renderGraphJs.RenderGraphValue;
      RenderQueue = _renderGraphJs.RenderQueue;
      RenderSwapchain = _renderGraphJs.RenderSwapchain;
      ResourceDesc = _renderGraphJs.ResourceDesc;
      ResourceGraph = _renderGraphJs.ResourceGraph;
      ResourceGraphValue = _renderGraphJs.ResourceGraphValue;
      ResourceStates = _renderGraphJs.ResourceStates;
      ResourceTraits = _renderGraphJs.ResourceTraits;
      SceneData = _renderGraphJs.SceneData;
      PersistentBuffer = _renderGraphJs.PersistentBuffer;
      RenderGraphObjectPool = _renderGraphJs.RenderGraphObjectPool;
      CullingFlags = _renderGraphJs.CullingFlags;
      ManagedResource = _renderGraphJs.ManagedResource;
      ManagedBuffer = _renderGraphJs.ManagedBuffer;
      BlitType = _renderGraphJs.BlitType;
    }, function (_pipelineJs) {
      PipelineType = _pipelineJs.PipelineType;
      PipelineCapabilities = _pipelineJs.PipelineCapabilities;
    }, function (_pipelineSceneDataJs) {
      PipelineSceneData = _pipelineSceneDataJs.PipelineSceneData;
    }, function (_renderSceneSceneIndexJs) {
      PCFType = _renderSceneSceneIndexJs.PCFType;
      ProbeType = _renderSceneSceneIndexJs.ProbeType;
    }, function (_renderSceneSceneLightJs) {
      LightType = _renderSceneSceneLightJs.LightType;
    }, function (_layoutGraphJs) {
      LayoutGraphData = _layoutGraphJs.LayoutGraphData;
    }, function (_executorJs) {
      Executor = _executorJs.Executor;
    }, function (_defineJs) {
      getDefaultShadowTexture = _defineJs.getDefaultShadowTexture;
      supportsR32FloatTexture = _defineJs.supportsR32FloatTexture;
      supportsRGBA16HalfFloatTexture = _defineJs.supportsRGBA16HalfFloatTexture;
      UBOSkinning = _defineJs.UBOSkinning;
    }, function (_palSystemInfoEnumTypeIndexJs) {
      OS = _palSystemInfoEnumTypeIndexJs.OS;
    }, function (_compilerJs) {
      Compiler = _compilerJs.Compiler;
    }, function (_assetAssetsIndexJs) {
      Material = _assetAssetsIndexJs.Material;
    }, function (_pipelineFuncsJs) {
      decideProfilerCamera = _pipelineFuncsJs.decideProfilerCamera;
    }, function (_debugViewJs) {
      DebugViewCompositeType = _debugViewJs.DebugViewCompositeType;
    }, function (_defineJs2) {
      buildReflectionProbePass = _defineJs2.buildReflectionProbePass;
      genHashValue = _defineJs2.genHashValue;
      resetPassMGState = _defineJs2.resetPassMGState;
    }, function (_layoutGraphUtilsJs) {
      createGfxDescriptorSetsAndPipelines = _layoutGraphUtilsJs.createGfxDescriptorSetsAndPipelines;
    }, function (_coreGlobalExportsJs) {
      legacyCC = _coreGlobalExportsJs.legacyCC;
    }, function (_webPipelineTypesJs) {
      WebSetter = _webPipelineTypesJs.WebSetter;
      setCameraUBOValues = _webPipelineTypesJs.setCameraUBOValues;
      setShadowUBOLightView = _webPipelineTypesJs.setShadowUBOLightView;
      setShadowUBOView = _webPipelineTypesJs.setShadowUBOView;
      setTextureUBOView = _webPipelineTypesJs.setTextureUBOView;
    }],
    execute: function () {
      /****************************************************************************
       Copyright (c) 2021-2023 Xiamen Yaji Software Co., Ltd.
      
       http://www.cocos.com
      
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
       ****************************************************************************/
      /* eslint-disable max-len */
      _uboVec = new Vec4();
      _samplerPointInfo = new SamplerInfo(Filter.POINT, Filter.POINT, Filter.NONE, Address.CLAMP, Address.CLAMP, Address.CLAMP);
      PipelinePool = class PipelinePool {
        constructor() {
          this.renderData = new RenderData();
          this.layoutGraph = new LayoutGraphData();
          this.rg = new RenderGraph();
          this.vertId = -1;
          this.sceneData = new SceneData();
          this.resourceGraph = new ResourceGraph();
          this.computePass = new ComputePass();
          this.rasterPass = new RasterPass();
          this.rasterSubpass = new RasterSubpass();
          this.renderQueue = new RenderQueue();
          this.resolvePair = new RecyclePool(() => new ResolvePair(), 16);
          this.sceneBuilder = new RecyclePool(() => new WebSceneBuilder(this.renderData, this.layoutGraph, this.rg, this.vertId, this.sceneData), 16);
          this.renderPassBuilder = new RecyclePool(() => new WebRenderPassBuilder(this.renderData, this.rg, this.layoutGraph, this.resourceGraph, this.vertId, this.rasterPass, this.getPipelineSceneData()), 16);
          this.computeQueueBuilder = new RecyclePool(() => new WebComputeQueueBuilder(this.renderData, this.rg, this.layoutGraph, this.vertId, this.renderQueue, this.getPipelineSceneData()), 16);
          this.renderQueueBuilder = new RecyclePool(() => new WebRenderQueueBuilder(this.renderData, this.rg, this.layoutGraph, this.vertId, this.renderQueue, this.getPipelineSceneData()), 16);
          this.renderSubpassBuilder = new RecyclePool(() => new WebRenderSubpassBuilder(this.renderData, this.rg, this.layoutGraph, this.vertId, this.rasterSubpass, this.getPipelineSceneData()), 16);
          this.computePassBuilder = new RecyclePool(() => new WebComputePassBuilder(this.renderData, this.rg, this.layoutGraph, this.resourceGraph, this.vertId, this.computePass, this.getPipelineSceneData()), 16);
          this.samplerInfo = new RecyclePool(() => new SamplerInfo(), 16);
          this.color = new RecyclePool(() => new Color(), 16);
          this.renderCommonObjectPool = new RenderCommonObjectPool();
          this.renderGraphPool = new RenderGraphObjectPool(this.renderCommonObjectPool);
          this.viewport = new RecyclePool(() => new Viewport(), 16);
        }
        getPipelineSceneData() {
          return legacyCC.director.root.pipeline.pipelineSceneData;
        }
        createColor(x = 0, y = 0, z = 0, w = 0) {
          const color = this.color.add();
          color.set(x, y, z, w);
          return color;
        }
        createSamplerInfo(minFilter = Filter.LINEAR, magFilter = Filter.LINEAR, mipFilter = Filter.NONE, addressU = Address.WRAP, addressV = Address.WRAP, addressW = Address.WRAP, maxAnisotropy = 0, cmpFunc = ComparisonFunc.ALWAYS) {
          const samplerInfo = this.samplerInfo.add();
          samplerInfo.minFilter = minFilter;
          samplerInfo.magFilter = magFilter;
          samplerInfo.mipFilter = mipFilter;
          samplerInfo.addressU = addressU;
          samplerInfo.addressV = addressV;
          samplerInfo.addressW = addressW;
          samplerInfo.maxAnisotropy = maxAnisotropy;
          samplerInfo.cmpFunc = cmpFunc;
          return samplerInfo;
        }
        reset() {
          this.sceneBuilder.reset();
          this.renderPassBuilder.reset();
          this.computePassBuilder.reset();
          this.computeQueueBuilder.reset();
          this.renderCommonObjectPool.reset();
          this.renderGraphPool.reset();
          this.viewport.reset();
          this.resolvePair.reset();
          this.samplerInfo.reset();
          this.color.reset();
          this.renderQueueBuilder.reset();
          this.renderSubpassBuilder.reset();
        }
      };
      emptyMaterial = new Material();
      emptyRenderData = new RenderData();
      _export("WebSceneBuilder", WebSceneBuilder = class WebSceneBuilder extends WebSetter {
        constructor(data, layoutGraph, rg, sceneId, scene) {
          super(data, layoutGraph);
          this._renderGraph = void 0;
          this._scene = void 0;
          this._renderGraph = rg;
          this._scene = scene;
          this._vertID = sceneId;
        }
        update(data, layoutGraph, rg, sceneId, scene) {
          this._data = data;
          this._lg = layoutGraph;
          this._renderGraph = rg;
          this._scene = scene;
          this._vertID = sceneId;
        }
        useLightFrustum(light, csmLevel = 0, optCamera = undefined) {
          this._scene.light.light = light;
          this._scene.light.level = csmLevel;
          this._scene.light.culledByLight = true;
          if (optCamera) {
            this._scene.camera = optCamera;
          }
          if (this._scene.flags & SceneFlags.NON_BUILTIN) {
            return;
          }
          const queueId = this._renderGraph.getParent(this._vertID);
          const passId = this._renderGraph.getParent(queueId);
          const layoutName = this._renderGraph.getLayout(passId);
          setShadowUBOLightView(this, this._scene.camera, light, csmLevel, layoutName);
        }
      });
      _export("WebRenderQueueBuilder", WebRenderQueueBuilder = class WebRenderQueueBuilder extends WebSetter {
        constructor(data, renderGraph, layoutGraph, vertID, queue, pipeline) {
          super(data, layoutGraph);
          this._renderGraph = void 0;
          this._queue = void 0;
          this._pipeline = void 0;
          this._renderGraph = renderGraph;
          this._vertID = vertID;
          this._queue = queue;
          this._pipeline = pipeline;
        }
        update(data, renderGraph, layoutGraph, vertID, queue, pipeline) {
          this._data = data;
          this._lg = layoutGraph;
          this._renderGraph = renderGraph;
          this._vertID = vertID;
          this._queue = queue;
          this._pipeline = pipeline;
        }
        setArrayBuffer(name, arrayBuffer) {
          throw new Error('Method not implemented.');
        }
        get name() {
          return this._renderGraph.getName(this._vertID);
        }
        set name(name) {
          this._renderGraph.setName(this._vertID, name);
        }
        addSceneOfCamera(camera, light, sceneFlags = SceneFlags.NONE, name = 'Camera') {
          var _light$probe;
          const lightTarget = light.light;
          const scene = ((_light$probe = light.probe) == null || (_light$probe = _light$probe.node) == null || (_light$probe = _light$probe.scene) == null ? void 0 : _light$probe.renderScene) || undefined;
          this._addScene(camera, sceneFlags, lightTarget, scene, light);
        }
        addScene(camera, sceneFlags = SceneFlags.NONE, light = null, scene = undefined) {
          return this._addScene(camera, sceneFlags, light, scene);
        }
        _addScene(camera, sceneFlags, light, scene, lightInfo = null) {
          const sceneData = renderGraphPool.createSceneData(scene || camera.scene, camera, sceneFlags, light && !(sceneFlags & SceneFlags.SHADOW_CASTER) ? CullingFlags.CAMERA_FRUSTUM | CullingFlags.LIGHT_BOUNDS : CullingFlags.CAMERA_FRUSTUM, light);
          if (lightInfo) {
            sceneData.light.reset(lightInfo.light, lightInfo.level, lightInfo.culledByLight, lightInfo.probe);
          }
          const renderData = renderGraphPool.createRenderData();
          const sceneId = this._renderGraph.addVertex(RenderGraphValue.Scene, sceneData, 'Scene', '', renderData, !DEBUG, this._vertID);
          if (!(sceneFlags & SceneFlags.NON_BUILTIN)) {
            const layoutName = this.getParentLayout();
            setCameraUBOValues(this, camera, this._pipeline, scene || camera.scene, layoutName);
            if (light && light.type !== LightType.DIRECTIONAL) setShadowUBOLightView(this, camera, light, 0, layoutName);else if (!(sceneFlags & SceneFlags.SHADOW_CASTER)) setShadowUBOView(this, camera, layoutName);
          }
          const passOrSubpassId = this._renderGraph.getParent(this._vertID);
          if (sceneFlags & SceneFlags.UI) {
            const queueId = this._renderGraph.addVertex(RenderGraphValue.Queue, this._queue, 'UI Queue', 'default', this._data, !DEBUG, passOrSubpassId);
            this._renderGraph.addVertex(RenderGraphValue.Blit, renderGraphPool.createBlit(emptyMaterial, this._renderGraph.N, SceneFlags.NONE, camera, BlitType.DRAW_2D), 'UI', '', emptyRenderData, !DEBUG, queueId);
          }
          if (sceneFlags & SceneFlags.PROFILER) {
            this.addProfiler(camera);
          }
          const sceneBuilder = pipelinePool.sceneBuilder.add();
          sceneBuilder.update(renderData, this._lg, this._renderGraph, sceneId, sceneData);
          return sceneBuilder;
        }
        addFullscreenQuad(material, passID, sceneFlags = SceneFlags.NONE, name = 'Quad') {
          this._renderGraph.addVertex(RenderGraphValue.Blit, renderGraphPool.createBlit(material, passID, sceneFlags, null), name, '', renderGraphPool.createRenderData(), !DEBUG, this._vertID);
          const layoutName = this.getParentLayout();
          const scene = cclegacy.director.getScene();
          setCameraUBOValues(this, null, this._pipeline, scene ? scene.renderScene : null, layoutName);
          if (sceneFlags & SceneFlags.SHADOW_CASTER) {
            // setShadowUBOLightView(this, light.light!, light.level);
          } else {
            setShadowUBOView(this, null, layoutName);
          }
        }
        addCameraQuad(camera, material, passID, sceneFlags = SceneFlags.NONE) {
          this._renderGraph.addVertex(RenderGraphValue.Blit, renderGraphPool.createBlit(material, passID, sceneFlags, camera), 'CameraQuad', '', renderGraphPool.createRenderData(), !DEBUG, this._vertID);
          const layoutName = this.getParentLayout();
          const scene = cclegacy.director.getScene();
          setCameraUBOValues(this, camera, this._pipeline, camera.scene || (scene ? scene.renderScene : null), layoutName);
          if (sceneFlags & SceneFlags.SHADOW_CASTER) {
            // setShadowUBOLightView(this, light.light!, light.level);
          } else {
            setShadowUBOView(this, camera, layoutName);
          }
        }
        addDraw3D(camera, models, sceneFlags = SceneFlags.NON_BUILTIN) {
          const blit = renderGraphPool.createBlit(emptyMaterial, this._renderGraph.N, SceneFlags.NONE, camera, BlitType.DRAW_3D);
          for (const model of models) {
            blit.models.push(model);
          }
          this._renderGraph.addVertex(RenderGraphValue.Blit, blit, 'Draw3D', '', renderGraphPool.createRenderData(), !DEBUG, this._vertID);
          if (!(sceneFlags & SceneFlags.NON_BUILTIN)) {
            const layoutName = this.getParentLayout();
            setCameraUBOValues(this, camera, this._pipeline, camera.scene, layoutName);
            if (!(sceneFlags & SceneFlags.SHADOW_CASTER)) setShadowUBOView(this, camera, layoutName);
          }
        }
        addDraw2D(camera) {
          const layoutName = this.getParentLayout();
          setCameraUBOValues(this, camera, this._pipeline, camera.scene, layoutName);
          this._renderGraph.addVertex(RenderGraphValue.Blit, renderGraphPool.createBlit(emptyMaterial, this._renderGraph.N, SceneFlags.NONE, camera, BlitType.DRAW_2D), 'Draw2D', '', emptyRenderData, !DEBUG, this._vertID);
        }
        addProfiler(camera) {
          const passOrSubpassId = this._renderGraph.getParent(this._vertID);
          const queueId = this._renderGraph.addVertex(RenderGraphValue.Queue, this._queue, 'UI Queue', 'default', this._data, !DEBUG, passOrSubpassId);
          const blitID = this._renderGraph.addVertex(RenderGraphValue.Blit, renderGraphPool.createBlit(emptyMaterial, this._renderGraph.N, SceneFlags.NONE, camera, BlitType.DRAW_PROFILE), 'Profiler', '', emptyRenderData, !DEBUG, queueId);
          const data = this._renderGraph.getData(blitID);
          WebSetter.setMat4(this._lg, data, 'cc_matProj', camera.matProj);
        }
        clearRenderTarget(name, color = new Color()) {
          const clearView = renderGraphPool.createClearView(name, ClearFlagBit.COLOR);
          clearView.clearColor.copy(color);
          this._renderGraph.addVertex(RenderGraphValue.Clear, [clearView], 'ClearRenderTarget', '', renderGraphPool.createRenderData(), !DEBUG, this._vertID);
        }
        setViewport(viewport) {
          const currViewport = pipelinePool.viewport.add();
          this._queue.viewport = currViewport.copy(viewport);
        }
        addCustomCommand(customBehavior) {
          throw new Error('Method not implemented.');
        }
      });
      _export("WebRenderSubpassBuilder", WebRenderSubpassBuilder = class WebRenderSubpassBuilder extends WebSetter {
        constructor(data, renderGraph, layoutGraph, vertID, subpass, pipeline) {
          super(data, layoutGraph);
          this._renderGraph = void 0;
          this._layoutID = void 0;
          this._subpass = void 0;
          this._pipeline = void 0;
          this._renderGraph = renderGraph;
          this._vertID = vertID;
          this._subpass = subpass;
          this._pipeline = pipeline;
          const layoutName = this._renderGraph.getLayout(this._vertID);
          this._layoutID = layoutGraph.locateChild(layoutGraph.N, layoutName);
        }
        update(data, renderGraph, layoutGraph, vertID, subpass, pipeline) {
          this._data = data;
          this._lg = layoutGraph;
          this._renderGraph = renderGraph;
          this._vertID = vertID;
          this._subpass = subpass;
          this._pipeline = pipeline;
          const layoutName = this._renderGraph.getLayout(this._vertID);
          this._layoutID = layoutGraph.locateChild(layoutGraph.N, layoutName);
        }
        addRenderTarget(name, accessType, slotName, loadOp, storeOp, color) {
          throw new Error('Method not implemented.');
        }
        setCustomShaderStages(name, stageFlags) {
          throw new Error('Method not implemented.');
        }
        setArrayBuffer(name, arrayBuffer) {
          throw new Error('Method not implemented.');
        }
        get name() {
          return this._renderGraph.getName(this._vertID);
        }
        set name(name) {
          this._renderGraph.setName(this._vertID, name);
        }
        addDepthStencil(name, accessType, depthSlotName = '', stencilSlotName = '', loadOp = LoadOp.CLEAR, storeOp = StoreOp.STORE, depth = 1, stencil = 0, clearFlag = ClearFlagBit.DEPTH_STENCIL) {
          throw new Error('Method not implemented.');
        }
        addTexture(name, slotName, sampler = null) {
          throw new Error('Method not implemented.');
        }
        addStorageBuffer(name, accessType, slotName) {
          throw new Error('Method not implemented.');
        }
        addStorageImage(name, accessType, slotName) {
          throw new Error('Method not implemented.');
        }
        setViewport(viewport) {
          throw new Error('Method not implemented.');
        }
        addQueue(hint = QueueHint.RENDER_OPAQUE, layoutName = 'default', passName = '') {
          const layoutId = this._lg.locateChild(this._layoutID, layoutName);
          const queue = renderGraphPool.createRenderQueue(hint, layoutId);
          const data = renderGraphPool.createRenderData();
          const queueID = this._renderGraph.addVertex(RenderGraphValue.Queue, queue, '', layoutName, data, !DEBUG, this._vertID);
          const queueBuilder = pipelinePool.renderQueueBuilder.add();
          queueBuilder.update(data, this._renderGraph, this._lg, queueID, queue, this._pipeline);
          return queueBuilder;
        }
        get showStatistics() {
          return this._subpass.showStatistics;
        }
        set showStatistics(enable) {
          this._subpass.showStatistics = enable;
        }
        get subpassID() {
          return this._vertID;
        }
        get subpassLayoutID() {
          return this._layoutID;
        }
      });
      _export("WebRenderPassBuilder", WebRenderPassBuilder = class WebRenderPassBuilder extends WebSetter {
        constructor(data, renderGraph, layoutGraph, resourceGraph, vertID, pass, pipeline) {
          super(data, layoutGraph);
          this._renderGraph = void 0;
          this._layoutID = void 0;
          this._subpassID = void 0;
          this._pass = void 0;
          this._pipeline = void 0;
          this._resourceGraph = void 0;
          this._renderGraph = renderGraph;
          this._resourceGraph = resourceGraph;
          this._vertID = vertID;
          this._subpassID = -1;
          this._pass = pass;
          this._pipeline = pipeline;
          const layoutName = this._renderGraph.getLayout(this._vertID);
          this._layoutID = layoutGraph.locateChild(layoutGraph.N, layoutName);
        }
        update(data, renderGraph, layoutGraph, resourceGraph, vertID, pass, pipeline) {
          this._renderGraph = renderGraph;
          this._lg = layoutGraph;
          this._resourceGraph = resourceGraph;
          this._vertID = vertID;
          this._pass = pass;
          this._pipeline = pipeline;
          this._data = data;
          const layoutName = this._renderGraph.getLayout(this._vertID);
          this._layoutID = layoutGraph.locateChild(layoutGraph.N, layoutName);
        }
        setCustomShaderStages(name, stageFlags) {
          throw new Error('Method not implemented.');
        }
        setArrayBuffer(name, arrayBuffer) {
          throw new Error('Method not implemented.');
        }
        setVersion(name, version) {
          this._pass.versionName = name;
          this._pass.version = version;
        }
        get name() {
          return this._renderGraph.getName(this._vertID);
        }
        set name(name) {
          this._renderGraph.setName(this._vertID, name);
        }
        get passID() {
          return this._vertID;
        }
        get passLayoutID() {
          return this._layoutID;
        }
        addRenderTarget(name, loadOp = LoadOp.CLEAR, storeOp = StoreOp.STORE, clearColor = new Color()) {
          let clearFlag = ClearFlagBit.COLOR;
          if (loadOp === LoadOp.LOAD) {
            clearFlag = ClearFlagBit.NONE;
          }
          const view = renderGraphPool.createRasterView('', AccessType.WRITE, AttachmentType.RENDER_TARGET, loadOp, storeOp, clearFlag);
          view.clearColor.copy(clearColor);
          this._pass.rasterViews.set(name, view);
        }
        addDepthStencil(name, loadOp = LoadOp.CLEAR, storeOp = StoreOp.STORE, depth = 1, stencil = 0, clearFlag = ClearFlagBit.DEPTH_STENCIL) {
          const view = renderGraphPool.createRasterView('', AccessType.WRITE, AttachmentType.DEPTH_STENCIL, loadOp, storeOp, clearFlag);
          view.clearColor.set(depth, stencil, 0, 0);
          this._pass.rasterViews.set(name, view);
        }
        resolveRenderTarget(source, target) {
          assert(this._subpassID !== -1);
          const nodeId = this._vertID;
          const rasterPass = this._renderGraph.object(nodeId);
          const subpass = this._renderGraph.object(this._subpassID);
          const subpassData = rasterPass.subpassGraph.getSubpass(subpass.subpassID);
          const resolve = pipelinePool.resolvePair.add();
          resolve.reset(source, target, ResolveFlags.COLOR, ResolveMode.AVERAGE, ResolveMode.NONE);
          subpass.resolvePairs.push(resolve);
          subpassData.resolvePairs.push(resolve);
        }
        resolveDepthStencil(source, target, depthMode, stencilMode) {
          assert(this._subpassID !== -1);
          const subpass = this._renderGraph.object(this._subpassID);
          let flags = ResolveFlags.NONE;
          if (depthMode !== ResolveMode.NONE) {
            flags |= ResolveFlags.DEPTH;
          }
          if (stencilMode !== ResolveMode.NONE) {
            flags |= ResolveFlags.STENCIL;
          }
          const pass = this._renderGraph.object(this._vertID);
          const subpassData = pass.subpassGraph.getSubpass(subpass.subpassID);
          const resolve = pipelinePool.resolvePair.add();
          resolve.reset(source, target, flags, depthMode, stencilMode);
          subpass.resolvePairs.push(resolve);
          subpassData.resolvePairs.push(resolve);
        }
        _addComputeResource(name, accessType, slotName) {
          const view = renderGraphPool.createComputeView(slotName);
          view.accessType = accessType;
          if (this._pass.computeViews.has(name)) {
            var _this$_pass$computeVi;
            (_this$_pass$computeVi = this._pass.computeViews.get(name)) == null || _this$_pass$computeVi.push(view);
          } else {
            this._pass.computeViews.set(name, [view]);
          }
        }
        addTexture(name, slotName, sampler = null) {
          this._addComputeResource(name, AccessType.READ, slotName);
          if (sampler) {
            const descriptorID = this._lg.attributeIndex.get(slotName);
            this._data.samplers.set(descriptorID, sampler);
          }
        }
        addStorageBuffer(name, accessType, slotName) {
          this._addComputeResource(name, accessType, slotName);
        }
        addStorageImage(name, accessType, slotName) {
          this._addComputeResource(name, accessType, slotName);
        }
        addRenderSubpass(layoutName = '') {
          const name = 'Raster';
          const subpassID = this._pass.subpassGraph.nv();
          this._pass.subpassGraph.addVertex(name, renderGraphPool.createSubpass());
          const subpass = renderGraphPool.createRasterSubpass(subpassID, 1, 0);
          const data = renderGraphPool.createRenderData();
          const vertID = this._renderGraph.addVertex(RenderGraphValue.RasterSubpass, subpass, name, layoutName, data, !DEBUG);
          this._subpassID = vertID;
          const result = pipelinePool.renderSubpassBuilder.add();
          result.update(data, this._renderGraph, this._lg, vertID, subpass, this._pipeline);
          return result;
        }
        addQueue(hint = QueueHint.RENDER_OPAQUE, layoutName = 'default', passName = '') {
          const layoutId = this._lg.locateChild(this._layoutID, layoutName);
          const queue = renderGraphPool.createRenderQueue(hint, layoutId);
          const data = renderGraphPool.createRenderData();
          const queueID = this._renderGraph.addVertex(RenderGraphValue.Queue, queue, '', layoutName, data, !DEBUG, this._vertID);
          const result = pipelinePool.renderQueueBuilder.add();
          result.update(data, this._renderGraph, this._lg, queueID, queue, this._pipeline);
          return result;
        }
        addFullscreenQuad(material, passID, sceneFlags = SceneFlags.NONE, name = 'FullscreenQuad') {
          const queue = renderGraphPool.createRenderQueue(QueueHint.RENDER_TRANSPARENT);
          const queueId = this._renderGraph.addVertex(RenderGraphValue.Queue, queue, 'Queue', '', renderGraphPool.createRenderData(), !DEBUG, this._vertID);
          this._renderGraph.addVertex(RenderGraphValue.Blit, renderGraphPool.createBlit(material, passID, sceneFlags, null), name, '', renderGraphPool.createRenderData(), !DEBUG, queueId);
        }
        addCameraQuad(camera, material, passID, sceneFlags, name = 'CameraQuad') {
          const queue = renderGraphPool.createRenderQueue(QueueHint.RENDER_TRANSPARENT);
          const queueId = this._renderGraph.addVertex(RenderGraphValue.Queue, queue, 'Queue', '', renderGraphPool.createRenderData(), !DEBUG, this._vertID);
          this._renderGraph.addVertex(RenderGraphValue.Blit, renderGraphPool.createBlit(material, passID, sceneFlags, camera), name, '', renderGraphPool.createRenderData(), !DEBUG, queueId);
        }
        setViewport(viewport) {
          this._pass.viewport.copy(viewport);
        }
        get showStatistics() {
          return this._pass.showStatistics;
        }
        set showStatistics(enable) {
          this._pass.showStatistics = enable;
        }
      });
      _export("WebComputeQueueBuilder", WebComputeQueueBuilder = class WebComputeQueueBuilder extends WebSetter {
        constructor(data, renderGraph, layoutGraph, vertID, queue, pipeline) {
          super(data, layoutGraph);
          this._renderGraph = void 0;
          this._queue = void 0;
          this._pipeline = void 0;
          this._renderGraph = renderGraph;
          this._vertID = vertID;
          this._queue = queue;
          this._pipeline = pipeline;
        }
        update(data, renderGraph, layoutGraph, vertID, queue, pipeline) {
          this._data = data;
          this._lg = layoutGraph;
          this._renderGraph = renderGraph;
          this._vertID = vertID;
          this._queue = queue;
          this._pipeline = pipeline;
        }
        setArrayBuffer(name, arrayBuffer) {
          throw new Error('Method not implemented.');
        }
        get name() {
          return this._renderGraph.getName(this._vertID);
        }
        set name(name) {
          this._renderGraph.setName(this._vertID, name);
        }
        addDispatch(threadGroupCountX, threadGroupCountY, threadGroupCountZ, material = null, passID = 0, name = 'Dispatch') {
          this._renderGraph.addVertex(RenderGraphValue.Dispatch, renderGraphPool.createDispatch(material, passID, threadGroupCountX, threadGroupCountY, threadGroupCountZ), name, '', renderGraphPool.createRenderData(), !DEBUG, this._vertID);
        }
      });
      _export("WebComputePassBuilder", WebComputePassBuilder = class WebComputePassBuilder extends WebSetter {
        constructor(data, renderGraph, layoutGraph, resourceGraph, vertID, pass, pipeline) {
          super(data, layoutGraph);
          this._renderGraph = void 0;
          this._resourceGraph = void 0;
          this._layoutID = void 0;
          this._pass = void 0;
          this._pipeline = void 0;
          this._renderGraph = renderGraph;
          this._resourceGraph = resourceGraph;
          this._vertID = vertID;
          this._pass = pass;
          this._pipeline = pipeline;
          const layoutName = this._renderGraph.getLayout(this._vertID);
          this._layoutID = layoutGraph.locateChild(layoutGraph.N, layoutName);
        }
        update(data, renderGraph, layoutGraph, resourceGraph, vertID, pass, pipeline) {
          this._data = data;
          this._renderGraph = renderGraph;
          this._lg = layoutGraph;
          this._resourceGraph = resourceGraph;
          this._vertID = vertID;
          this._pass = pass;
          this._pipeline = pipeline;
          const layoutName = this._renderGraph.getLayout(this._vertID);
          this._layoutID = layoutGraph.locateChild(layoutGraph.N, layoutName);
        }
        setCustomShaderStages(name, stageFlags) {
          throw new Error('Method not implemented.');
        }
        setArrayBuffer(name, arrayBuffer) {
          throw new Error('Method not implemented.');
        }
        get name() {
          return this._renderGraph.getName(this._vertID);
        }
        set name(name) {
          this._renderGraph.setName(this._vertID, name);
        }
        addTexture(name, slotName, sampler = null) {
          this._addComputeResource(name, AccessType.READ, slotName);
          if (sampler) {
            const descriptorID = this._lg.attributeIndex.get(slotName);
            this._data.samplers.set(descriptorID, sampler);
          }
        }
        addStorageBuffer(name, accessType, slotName) {
          this._addComputeResource(name, accessType, slotName);
        }
        addStorageImage(name, accessType, slotName) {
          this._addComputeResource(name, accessType, slotName);
        }
        addMaterialTexture(resourceName, flags) {
          throw new Error('Method not implemented.');
        }
        addQueue(layoutName = 'default', passName = '') {
          const layoutId = this._lg.locateChild(this._layoutID, layoutName);
          const queue = renderGraphPool.createRenderQueue(QueueHint.RENDER_OPAQUE, layoutId);
          const data = renderGraphPool.createRenderData();
          const queueID = this._renderGraph.addVertex(RenderGraphValue.Queue, queue, '', layoutName, data, !DEBUG, this._vertID);
          const computeQueueBuilder = pipelinePool.computeQueueBuilder.add();
          computeQueueBuilder.update(data, this._renderGraph, this._lg, queueID, queue, this._pipeline);
          return computeQueueBuilder;
        }
        _addComputeResource(name, accessType, slotName) {
          const view = renderGraphPool.createComputeView(slotName);
          view.accessType = accessType;
          if (this._pass.computeViews.has(name)) {
            var _this$_pass$computeVi2;
            (_this$_pass$computeVi2 = this._pass.computeViews.get(name)) == null || _this$_pass$computeVi2.push(view);
          } else {
            this._pass.computeViews.set(name, [view]);
          }
        }
      });
      _export("WebMovePassBuilder", WebMovePassBuilder = class WebMovePassBuilder {
        constructor(renderGraph, vertID, pass) {
          this._renderGraph = void 0;
          this._vertID = void 0;
          this._pass = void 0;
          this._renderGraph = renderGraph;
          this._vertID = vertID;
          this._pass = pass;
        }
        setCustomBehavior(name) {
          throw new Error('Method not implemented.');
        }
        get name() {
          return this._renderGraph.getName(this._vertID);
        }
        set name(name) {
          this._renderGraph.setName(this._vertID, name);
        }
        addPair(pair) {
          this._pass.movePairs.push(pair);
        }
      });
      _export("WebCopyPassBuilder", WebCopyPassBuilder = class WebCopyPassBuilder {
        constructor(renderGraph, vertID, pass) {
          this._renderGraph = void 0;
          this._vertID = void 0;
          this._pass = void 0;
          this._renderGraph = renderGraph;
          this._vertID = vertID;
          this._pass = pass;
        }
        addPair(pair) {
          throw new Error('Method not implemented.');
        }
        setCustomBehavior(name) {
          throw new Error('Method not implemented.');
        }
        get name() {
          return this._renderGraph.getName(this._vertID);
        }
        set name(name) {
          this._renderGraph.setName(this._vertID, name);
        }
      });
      _export("WebPipeline", WebPipeline = class WebPipeline extends WebSetter {
        constructor(layoutGraph) {
          super(new RenderData(), layoutGraph);
          this.globalDSManager = void 0;
          this.descriptorSetLayout = void 0;
          this.descriptorSet = void 0;
          this._width = 0;
          this._height = 0;
          this._usesDeferredPipeline = false;
          this._copyPassMat = new Material();
          this._device = void 0;
          this._defaultSampler = void 0;
          this._profilerDescriptorSet = null;
          this._macros = {};
          this._pipelineSceneData = new PipelineSceneData();
          this._constantMacros = '';
          this._lightingMode = LightingMode.DEFAULT;
          this._profiler = null;
          this._cameras = [];
          this._resourceUses = [];
          this._resourceGraph = new ResourceGraph();
          this._renderGraph = null;
          this._compiler = null;
          this._executor = null;
          this._customPipelineName = '';
          this._globalDescSetData = void 0;
          this._combineSignY = 0;
          this._renderGraph = new RenderGraph();
          this._data = this._renderGraph.globalRenderData;
        }
        get type() {
          return PipelineType.BASIC;
        }
        get capabilities() {
          return new PipelineCapabilities();
        }
        get enableCpuLightCulling() {
          if (!this._executor) {
            return true;
          }
          return this._executor._context.culling.enableLightCulling;
        }
        set enableCpuLightCulling(enable) {
          if (!this._executor) {
            return;
          }
          this._executor._context.culling.enableLightCulling = enable;
        }
        addCustomBuffer(name, info, type) {
          throw new Error('Method not implemented.');
        }
        addCustomTexture(name, info, type) {
          throw new Error('Method not implemented.');
        }
        tryAddRenderWindowDepthStencil(width, height, depthStencilName, swapchain) {
          if (!depthStencilName) {
            return;
          }
          if (swapchain) {
            this.addDepthStencilImpl(depthStencilName, swapchain.depthStencilTexture.format, width, height, ResourceResidency.BACKBUFFER, swapchain);
          } else {
            this.addDepthStencilImpl(depthStencilName, Format.DEPTH_STENCIL, width, height, ResourceResidency.MANAGED);
          }
        }
        addRenderWindow(name, format, width, height, renderWindow, depthStencilName) {
          const resID = this._resourceGraph.find(name);
          if (resID !== 0xFFFFFFFF) {
            this.updateRenderWindow(name, renderWindow, depthStencilName);
            return resID;
          }
          this.tryAddRenderWindowDepthStencil(width, height, depthStencilName, renderWindow.swapchain);

          // Objects need to be held for a long time, so there is no need to use pool management
          const desc = new ResourceDesc();
          desc.dimension = ResourceDimension.TEXTURE2D;
          desc.width = width;
          desc.height = height;
          desc.depthOrArraySize = 1;
          desc.mipLevels = 1;
          desc.format = renderWindow.framebuffer.colorTextures[0].format;
          desc.flags = ResourceFlags.COLOR_ATTACHMENT;
          if (!renderWindow.swapchain) {
            desc.sampleCount = renderWindow.framebuffer.colorTextures[0].info.samples;
            return this._resourceGraph.addVertex(ResourceGraphValue.Framebuffer, renderWindow.framebuffer, name, desc, new ResourceTraits(ResourceResidency.EXTERNAL), new ResourceStates(), new SamplerInfo());
          } else {
            return this._resourceGraph.addVertex(ResourceGraphValue.Swapchain, new RenderSwapchain(renderWindow.swapchain), name, desc, new ResourceTraits(ResourceResidency.BACKBUFFER), new ResourceStates(), new SamplerInfo());
          }
        }
        updateRenderWindow(name, renderWindow, depthStencilName) {
          const resId = this.resourceGraph.vertex(name);
          const desc = this.resourceGraph.getDesc(resId);
          desc.width = renderWindow.width;
          desc.height = renderWindow.height;
          const currFbo = this.resourceGraph.object(resId);
          if (currFbo !== renderWindow.framebuffer) {
            this.resourceGraph.x[resId].j = renderWindow.framebuffer;
          }
          this.tryAddRenderWindowDepthStencil(renderWindow.width, renderWindow.height, depthStencilName, renderWindow.swapchain);
        }
        updateStorageBuffer(name, size, format = Format.UNKNOWN) {
          const resId = this.resourceGraph.vertex(name);
          const desc = this.resourceGraph.getDesc(resId);
          desc.width = size;
          if (format !== Format.UNKNOWN) {
            desc.format = format;
          }
        }
        updateRenderTarget(name, width, height, format = Format.UNKNOWN) {
          const resId = this.resourceGraph.vertex(name);
          const desc = this.resourceGraph.getDesc(resId);
          desc.width = width;
          desc.height = height;
          if (format !== Format.UNKNOWN) desc.format = format;
        }
        updateDepthStencil(name, width, height, format = Format.UNKNOWN) {
          const resId = this.resourceGraph.find(name);
          if (resId === 0xFFFFFFFF) {
            return;
          }
          this.updateDepthStencilImpl(resId, width, height, format);
        }
        updateStorageTexture(name, width, height, format = Format.UNKNOWN) {
          const resId = this.resourceGraph.vertex(name);
          const desc = this.resourceGraph.getDesc(resId);
          desc.width = width;
          desc.height = height;
          if (format !== Format.UNKNOWN) {
            desc.format = format;
          }
        }
        updateShadingRateTexture(name, width, height) {
          const resId = this.resourceGraph.vertex(name);
          const desc = this.resourceGraph.getDesc(resId);
          desc.width = width;
          desc.height = height;
        }
        addBuffer(name, size, flags, residency) {
          const resID = this._resourceGraph.find(name);
          if (resID !== 0xFFFFFFFF) {
            this.updateBuffer(name, size);
            return resID;
          }
          const desc = new ResourceDesc();
          desc.dimension = ResourceDimension.BUFFER;
          desc.width = size;
          desc.flags = flags;
          return this._resourceGraph.addVertex(ResourceGraphValue.Managed, new ManagedResource(), name, desc, new ResourceTraits(residency), new ResourceStates(), new SamplerInfo(Filter.LINEAR, Filter.LINEAR, Filter.NONE, Address.CLAMP, Address.CLAMP, Address.CLAMP));
        }
        updateBuffer(name, size) {
          this.updateResource(name, Format.UNKNOWN, size, 0, 0, 0, 0, SampleCount.X1);
        }
        addExternalTexture(name, texture, flags) {
          throw new Error('Method not implemented.');
        }
        updateExternalTexture(name, texture) {
          throw new Error('Method not implemented.');
        }
        addTexture(name, textureType, format, width, height, depth, arraySize, mipLevels, sampleCount, flags, residency) {
          const resID = this._resourceGraph.find(name);
          if (resID !== 0xFFFFFFFF) {
            this.updateTexture(name, format, width, height, depth, arraySize, mipLevels, sampleCount);
            return resID;
          }
          const desc = new ResourceDesc();
          desc.dimension = getResourceDimension(textureType);
          desc.width = width;
          desc.height = height;
          desc.depthOrArraySize = desc.dimension === ResourceDimension.TEXTURE3D ? depth : arraySize;
          desc.mipLevels = mipLevels;
          desc.format = format;
          desc.sampleCount = sampleCount;
          desc.flags = flags;
          desc.viewType = textureType;
          return this._resourceGraph.addVertex(ResourceGraphValue.Managed, new ManagedResource(), name, desc, new ResourceTraits(residency), new ResourceStates(), new SamplerInfo(Filter.LINEAR, Filter.LINEAR, Filter.NONE, Address.CLAMP, Address.CLAMP, Address.CLAMP));
        }
        updateTexture(name, format, width, height, depth, arraySize, mipLevels, sampleCount) {
          this.updateResource(name, format, width, height, depth, arraySize, mipLevels, sampleCount);
        }
        addResource(name, dimension, format, width, height, depth, arraySize, mipLevels, sampleCount, flags, residency) {
          const resID = this._resourceGraph.find(name);
          if (resID !== 0xFFFFFFFF) {
            this.updateResource(name, format, width, height, depth, arraySize, mipLevels, sampleCount);
            return resID;
          }
          if (dimension === ResourceDimension.BUFFER) {
            return this.addBuffer(name, width, flags, residency);
          } else {
            return this.addTexture(name, getTextureType(dimension, arraySize), format, width, height, depth, arraySize, mipLevels, sampleCount, flags, residency);
          }
        }
        updateResource(name, format, width, height, depth, arraySize, mipLevels, sampleCount) {
          const resId = this.resourceGraph.vertex(name);
          const desc = this.resourceGraph.getDesc(resId);
          desc.width = width;
          desc.height = height;
          desc.depthOrArraySize = desc.dimension === ResourceDimension.TEXTURE3D ? depth : arraySize;
          desc.mipLevels = mipLevels;
          if (format !== Format.UNKNOWN) {
            desc.format = format;
          }
          desc.sampleCount = sampleCount;
        }
        containsResource(name) {
          return this._resourceGraph.contains(name);
        }
        addResolvePass(resolvePairs) {
          // TODO: implement resolve pass
          throw new Error('Method not implemented.');
        }
        addComputePass(passName) {
          const name = 'Compute';
          const pass = renderGraphPool.createComputePass();
          const data = renderGraphPool.createRenderData();
          const vertID = this._renderGraph.addVertex(RenderGraphValue.Compute, pass, name, passName, data, !DEBUG);
          const result = pipelinePool.computePassBuilder.add();
          result.update(data, this._renderGraph, this._lg, this._resourceGraph, vertID, pass, this._pipelineSceneData);
          setComputeConstants(result, passName);
          return result;
        }
        addUploadPass(uploadPairs) {
          const name = 'UploadPass';
          const pass = renderGraphPool.createCopyPass();
          for (const up of uploadPairs) {
            pass.uploadPairs.push(up);
          }
          const vertID = this._renderGraph.addVertex(RenderGraphValue.Copy, pass, name, '', renderGraphPool.createRenderData(), !DEBUG);
          // const result = new WebCopyPassBuilder(this._renderGraph!, vertID, pass);
        }
        addCopyPass(copyPairs) {
          for (const pair of copyPairs) {
            const targetName = pair.target;
            const tarVerId = this.resourceGraph.find(targetName);
            const resDesc = this.resourceGraph.getDesc(tarVerId);
            const currRaster = this.addRenderPass(resDesc.width, resDesc.height, 'copy-pass');
            currRaster.addRenderTarget(targetName, LoadOp.CLEAR, StoreOp.STORE, pipelinePool.createColor());
            currRaster.setFloat('flip', this.getCombineSignY());
            currRaster.addTexture(pair.source, 'outputResultMap');
            currRaster.addQueue(QueueHint.NONE).addFullscreenQuad(this._copyPassMat, 0, SceneFlags.NONE);
          }
        }
        // ------------------------------------------------------
        // Setter interface
        // ------------------------------------------------------
        get name() {
          return 'WebPipeline';
        }
        // ------------------------------------------------------
        // Setter interface end
        // ------------------------------------------------------
        _generateConstantMacros(clusterEnabled) {
          let str = '';
          str += `#define CC_DEVICE_SUPPORT_FLOAT_TEXTURE ${this._device.getFormatFeatures(Format.RGBA32F) & (FormatFeatureBit.RENDER_TARGET | FormatFeatureBit.SAMPLED_TEXTURE) ? 1 : 0}\n`;
          // str += `#define CC_ENABLE_CLUSTERED_LIGHT_CULLING ${clusterEnabled ? 1 : 0}\n`; // defined in material
          str += `#define CC_DEVICE_MAX_VERTEX_UNIFORM_VECTORS ${this._device.capabilities.maxVertexUniformVectors}\n`;
          str += `#define CC_DEVICE_MAX_FRAGMENT_UNIFORM_VECTORS ${this._device.capabilities.maxFragmentUniformVectors}\n`;
          str += `#define CC_DEVICE_CAN_BENEFIT_FROM_INPUT_ATTACHMENT ${this._device.hasFeature(Feature.INPUT_ATTACHMENT_BENEFIT) ? 1 : 0}\n`;
          str += `#define CC_PLATFORM_ANDROID_AND_WEBGL ${systemInfo.os === OS.ANDROID && systemInfo.isBrowser ? 1 : 0}\n`;
          str += `#define CC_ENABLE_WEBGL_HIGHP_STRUCT_VALUES ${macro.ENABLE_WEBGL_HIGHP_STRUCT_VALUES ? 1 : 0}\n`;
          const jointUniformCapacity = UBOSkinning.JOINT_UNIFORM_CAPACITY;
          str += `#define CC_JOINT_UNIFORM_CAPACITY ${jointUniformCapacity}\n`;
          this._constantMacros = str;
          this._lg.constantMacros = this._constantMacros;
        }
        setCustomPipelineName(name) {
          this._customPipelineName = name;
          if (this._customPipelineName === 'Deferred') {
            this._usesDeferredPipeline = true;
          }
        }
        getGlobalDescriptorSetData() {
          const stageId = this.layoutGraph.locateChild(this.layoutGraph.N, 'default');
          const layout = this.layoutGraph.getLayout(stageId);
          const layoutData = layout.getSet(UpdateFrequency.PER_PASS);
          return layoutData;
        }
        _initCombineSignY() {
          const device = this._device;
          this._combineSignY = device.capabilities.screenSpaceSignY * 0.5 + 0.5 << 1 | device.capabilities.clipSpaceSignY * 0.5 + 0.5;
        }
        getCombineSignY() {
          return this._combineSignY;
        }
        get globalDescriptorSetData() {
          return this._globalDescSetData;
        }
        get defaultSampler() {
          return this._defaultSampler;
        }
        get defaultShadowTexture() {
          return getDefaultShadowTexture(this.device);
        }
        _compileMaterial() {
          this._copyPassMat.initialize({
            effectName: 'pipeline/copy-pass'
          });
          for (let i = 0; i < this._copyPassMat.passes.length; ++i) {
            this._copyPassMat.passes[i].tryCompile();
          }
        }
        activate(swapchain) {
          this._device = deviceManager.gfxDevice;
          pipelinePool = new PipelinePool();
          renderGraphPool = pipelinePool.renderGraphPool;
          createGfxDescriptorSetsAndPipelines(this._device, this._lg);
          this._compileMaterial();
          this.setMacroBool('CC_USE_HDR', this._pipelineSceneData.isHDR);
          this.setMacroBool('CC_USE_FLOAT_OUTPUT', macro.ENABLE_FLOAT_OUTPUT && supportsRGBA16HalfFloatTexture(this._device));
          this._generateConstantMacros(false);
          this._pipelineSceneData.activate(this._device);
          this._initCombineSignY();
          const isFloat = supportsR32FloatTexture(this._device) ? 0 : 1;
          this.setMacroInt('CC_SHADOWMAP_FORMAT', isFloat);
          // 0: SHADOWMAP_LINER_DEPTH_OFF, 1: SHADOWMAP_LINER_DEPTH_ON.
          const isLinear = this._device.gfxAPI === API.WEBGL ? 1 : 0;
          this.setMacroInt('CC_SHADOWMAP_USE_LINEAR_DEPTH', isLinear);
          const director = cclegacy.director;
          const root = director.root;
          this._defaultSampler = root.device.getSampler(_samplerPointInfo);
          // 0: UNIFORM_VECTORS_LESS_EQUAL_64, 1: UNIFORM_VECTORS_GREATER_EQUAL_125.
          this.pipelineSceneData.csmSupported = this.device.capabilities.maxFragmentUniformVectors >= WebPipeline.CSM_UNIFORM_VECTORS + WebPipeline.GLOBAL_UNIFORM_VECTORS;
          this.setMacroBool('CC_SUPPORT_CASCADED_SHADOW_MAP', this.pipelineSceneData.csmSupported);

          // 0: CC_SHADOW_NONE, 1: CC_SHADOW_PLANAR, 2: CC_SHADOW_MAP
          this.setMacroInt('CC_SHADOW_TYPE', 0);

          // 0: PCFType.HARD, 1: PCFType.SOFT, 2: PCFType.SOFT_2X, 3: PCFType.SOFT_4X
          this.setMacroInt('CC_DIR_SHADOW_PCF_TYPE', PCFType.HARD);

          // 0: CC_DIR_LIGHT_SHADOW_NONE, 1: CC_DIR_LIGHT_SHADOW_UNIFORM, 2: CC_DIR_LIGHT_SHADOW_CASCADED, 3: CC_DIR_LIGHT_SHADOW_VARIANCE
          this.setMacroInt('CC_DIR_LIGHT_SHADOW_TYPE', 0);

          // 0: CC_CASCADED_LAYERS_TRANSITION_OFF, 1: CC_CASCADED_LAYERS_TRANSITION_ON
          this.setMacroBool('CC_CASCADED_LAYERS_TRANSITION', false);

          // enable the deferred pipeline
          if (this.usesDeferredPipeline) {
            this.setMacroInt('CC_PIPELINE_TYPE', 1);
          }
          return true;
        }
        destroy() {
          var _this$_pipelineSceneD;
          (_this$_pipelineSceneD = this._pipelineSceneData) == null || _this$_pipelineSceneD.destroy();
          return true;
        }
        get device() {
          return this._device;
        }
        get lightingMode() {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return this._lightingMode;
        }
        set lightingMode(mode) {
          this._lightingMode = mode;
        }
        get usesDeferredPipeline() {
          return this._usesDeferredPipeline;
        }
        get macros() {
          return this._macros;
        }
        get profilerDescriptorSet() {
          return this._profilerDescriptorSet;
        }
        // public get globalDescriptorSet (): DescriptorSet {
        //     return this._globalDescriptorSet!;
        // }
        // public get globalDescriptorSetInfo (): DescriptorSetInfo {
        //     return this._globalDescriptorSetInfo!;
        // }
        get commandBuffers() {
          return [this._device.commandBuffer];
        }
        get pipelineSceneData() {
          return this._pipelineSceneData;
        }
        get constantMacros() {
          return this._constantMacros;
        }
        get profiler() {
          return this._profiler;
        }
        set profiler(profiler) {
          this._profiler = profiler;
        }
        get geometryRenderer() {
          throw new Error('Method not implemented.');
        }
        get shadingScale() {
          return this._pipelineSceneData.shadingScale;
        }
        set shadingScale(scale) {
          this._pipelineSceneData.shadingScale = scale;
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
        getSamplerInfo(name) {
          if (this.containsResource(name)) {
            const verId = this._resourceGraph.vertex(name);
            return this._resourceGraph.getSampler(verId);
          }
          return null;
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
        onGlobalPipelineStateChanged() {
          const builder = cclegacy.rendering.getCustomPipeline(macro.CUSTOM_PIPELINE_NAME);
          if (builder) {
            if (typeof builder.onGlobalPipelineStateChanged === 'function') {
              builder.onGlobalPipelineStateChanged();
            }
            cclegacy.rendering.forceResizeAllWindows();
          }
        }
        beginSetup() {
          if (!this._renderGraph) {
            this._renderGraph = new RenderGraph();
            this._data = this._renderGraph.globalRenderData;
          }
          pipelinePool.reset();
        }
        endSetup() {
          this.compile();
        }
        addStorageBuffer(name, format, size, residency = ResourceResidency.MANAGED) {
          const resID = this._resourceGraph.find(name);
          if (resID !== 0xFFFFFFFF) {
            this.updateStorageBuffer(name, size, format);
            return resID;
          }
          const desc = new ResourceDesc();
          desc.dimension = ResourceDimension.BUFFER;
          desc.width = size;
          desc.height = 1;
          desc.depthOrArraySize = 1;
          desc.mipLevels = 1;
          desc.format = format;
          desc.flags = ResourceFlags.STORAGE;
          if (residency === ResourceResidency.PERSISTENT) {
            return this._resourceGraph.addVertex(ResourceGraphValue.PersistentBuffer, new PersistentBuffer(), name, desc, new ResourceTraits(ResourceResidency.PERSISTENT), new ResourceStates(), new SamplerInfo());
          }
          return this._resourceGraph.addVertex(ResourceGraphValue.ManagedBuffer, new ManagedBuffer(), name, desc, new ResourceTraits(residency), new ResourceStates(), new SamplerInfo());
        }
        addRenderTarget(name, format, width, height, residency = ResourceResidency.MANAGED) {
          const resID = this._resourceGraph.find(name);
          if (resID !== 0xFFFFFFFF) {
            this.updateRenderTarget(name, width, height, format);
            return resID;
          }
          const desc = new ResourceDesc();
          desc.dimension = ResourceDimension.TEXTURE2D;
          desc.width = width;
          desc.height = height;
          desc.depthOrArraySize = 1;
          desc.mipLevels = 1;
          desc.format = format;
          desc.sampleCount = SampleCount.X1;
          desc.flags = ResourceFlags.COLOR_ATTACHMENT | ResourceFlags.SAMPLED;
          return this._resourceGraph.addVertex(ResourceGraphValue.Managed, new ManagedResource(), name, desc, new ResourceTraits(residency), new ResourceStates(), new SamplerInfo(Filter.LINEAR, Filter.LINEAR, Filter.NONE, Address.CLAMP, Address.CLAMP, Address.CLAMP));
        }
        updateDepthStencilImpl(resId, width, height, format, swapchain) {
          const desc = this.resourceGraph.getDesc(resId);
          desc.width = width;
          desc.height = height;
          if (swapchain) {
            const sc = this.resourceGraph.j(resId);
            sc.swapchain = swapchain;
            desc.format = sc.swapchain.depthStencilTexture.format;
          } else if (format !== Format.UNKNOWN) {
            desc.format = format;
          }
        }
        addDepthStencilImpl(name, format, width, height, residency, swapchain) {
          const resID = this._resourceGraph.find(name);
          if (resID !== 0xFFFFFFFF) {
            this.updateDepthStencilImpl(resID, width, height, format, swapchain);
            return resID;
          }
          const desc = new ResourceDesc();
          desc.dimension = ResourceDimension.TEXTURE2D;
          desc.width = width;
          desc.height = height;
          desc.depthOrArraySize = 1;
          desc.mipLevels = 1;
          desc.format = format;
          desc.sampleCount = SampleCount.X1;
          desc.flags = ResourceFlags.DEPTH_STENCIL_ATTACHMENT | ResourceFlags.SAMPLED;
          if (swapchain) {
            return this._resourceGraph.addVertex(ResourceGraphValue.Swapchain, new RenderSwapchain(swapchain, true), name, desc, new ResourceTraits(residency), new ResourceStates(), new SamplerInfo(Filter.POINT, Filter.POINT, Filter.NONE));
          } else {
            return this._resourceGraph.addVertex(ResourceGraphValue.Managed, new ManagedResource(), name, desc, new ResourceTraits(residency), new ResourceStates(), new SamplerInfo(Filter.POINT, Filter.POINT, Filter.NONE));
          }
        }
        addDepthStencil(name, format, width, height, residency = ResourceResidency.MANAGED) {
          return this.addDepthStencilImpl(name, format, width, height, residency);
        }
        addStorageTexture(name, format, width, height, residency = ResourceResidency.MANAGED) {
          const resID = this._resourceGraph.find(name);
          if (resID !== 0xFFFFFFFF) {
            this.updateStorageTexture(name, width, height, format);
            return resID;
          }
          const desc = new ResourceDesc();
          desc.dimension = ResourceDimension.TEXTURE2D;
          desc.width = width;
          desc.height = height;
          desc.depthOrArraySize = 1;
          desc.mipLevels = 1;
          desc.format = format;
          desc.flags = ResourceFlags.STORAGE | ResourceFlags.SAMPLED;
          return this._resourceGraph.addVertex(ResourceGraphValue.Managed, new ManagedResource(), name, desc, new ResourceTraits(residency), new ResourceStates(), new SamplerInfo(Filter.POINT, Filter.POINT, Filter.NONE));
        }
        addShadingRateTexture(name, width, height, residency = ResourceResidency.MANAGED) {
          const resID = this._resourceGraph.find(name);
          if (resID !== 0xFFFFFFFF) {
            this.addShadingRateTexture(name, width, height);
            return resID;
          }
          const desc = new ResourceDesc();
          desc.dimension = ResourceDimension.TEXTURE2D;
          desc.width = width;
          desc.height = height;
          desc.depthOrArraySize = 1;
          desc.mipLevels = 1;
          desc.format = Format.R8UI;
          desc.flags = ResourceFlags.SHADING_RATE | ResourceFlags.STORAGE | ResourceFlags.SAMPLED;
          return this._resourceGraph.addVertex(ResourceGraphValue.Managed, new ManagedResource(), name, desc, new ResourceTraits(residency), new ResourceStates(), new SamplerInfo(Filter.LINEAR, Filter.LINEAR, Filter.NONE, Address.CLAMP, Address.CLAMP, Address.CLAMP));
        }
        beginFrame() {
          const director = cclegacy.director;
          director.buildRenderPipeline();
        }
        update(camera) {
          // noop
        }
        endFrame() {
          var _this$renderGraph;
          (_this$renderGraph = this.renderGraph) == null || _this$renderGraph.clear();
        }
        compile() {
          if (!this._renderGraph) {
            throw new Error('RenderGraph cannot be built without being created');
          }
          resetPassMGState();
          if (DEBUG) {
            if (!this._compiler) {
              this._compiler = new Compiler(this, this._renderGraph, this._resourceGraph, this._lg);
            }
            this._compiler.compile(this._renderGraph);
          }
          this._renderGraph.x.forEach((vert, v) => {
            if (vert.t !== RenderGraphValue.RasterPass) {
              return;
            }
            if (DEBUG && !this._renderGraph.getValid(v)) {
              return;
            }
            genHashValue(vert.j);
          });
        }
        execute() {
          if (!this._renderGraph) {
            throw new Error('Cannot run without creating rendergraph');
          }
          if (!this._executor) {
            this._executor = new Executor(this, this._device, this._resourceGraph, this.layoutGraph, this.width, this.height);
          }
          this._executor.resize(this.width, this.height);
          this._executor.execute(this._renderGraph);
        }
        _applySize(cameras) {
          let newWidth = this._width;
          let newHeight = this._height;
          cameras.forEach(camera => {
            const window = camera.window;
            newWidth = Math.max(window.width, newWidth);
            newHeight = Math.max(window.height, newHeight);
            if (!this._cameras.includes(camera)) {
              this._cameras.push(camera);
            }
          });
          if (newWidth !== this._width || newHeight !== this._height) {
            this._width = newWidth;
            this._height = newHeight;
          }
        }
        get width() {
          return this._width;
        }
        get height() {
          return this._height;
        }
        render(cameras) {
          if (cameras.length === 0) {
            return;
          }
          this._applySize(cameras);
          decideProfilerCamera(cameras);
          // build graph
          this.beginFrame();
          this.execute();
          this.endFrame();
        }
        addBuiltinReflectionProbePass(camera) {
          const reflectionProbeManager = cclegacy.internal.reflectionProbeManager;
          if (!reflectionProbeManager) return;
          const probes = reflectionProbeManager.getProbes();
          if (probes.length === 0) return;
          for (let i = 0; i < probes.length; i++) {
            const probe = probes[i];
            if (probe.needRender) {
              if (probes[i].probeType === ProbeType.PLANAR) {
                buildReflectionProbePass(camera, this, probe, probe.realtimePlanarTexture.window, 0);
              } else if (EDITOR) {
                for (let faceIdx = 0; faceIdx < probe.bakedCubeTextures.length; faceIdx++) {
                  probe.updateCameraDir(faceIdx);
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                  buildReflectionProbePass(camera, this, probe, probe.bakedCubeTextures[faceIdx].window, faceIdx);
                }
                probe.needRender = false;
              }
            }
          }
        }
        addRenderPassImpl(width, height, layoutName, count = 1, quality = 0) {
          const name = 'Raster';
          const pass = renderGraphPool.createRasterPass();
          pass.viewport.width = width;
          pass.viewport.height = height;
          pass.count = count;
          pass.quality = quality;
          const data = renderGraphPool.createRenderData();
          const vertID = this._renderGraph.addVertex(RenderGraphValue.RasterPass, pass, name, layoutName, data, !DEBUG);
          const result = pipelinePool.renderPassBuilder.add();
          result.update(data, this._renderGraph, this._lg, this._resourceGraph, vertID, pass, this._pipelineSceneData);
          this._updateRasterPassConstants(result, width, height, layoutName);
          setTextureUBOView(result, this._pipelineSceneData);
          return result;
        }
        addRenderPass(width, height, layoutName = 'default') {
          return this.addRenderPassImpl(width, height, layoutName);
        }
        addMultisampleRenderPass(width, height, count, quality, layoutName = 'default') {
          const rasterPassBuilder = this.addRenderPassImpl(width, height, layoutName, count, quality);
          rasterPassBuilder.addRenderSubpass();
          return rasterPassBuilder;
        }
        getDescriptorSetLayout(shaderName, freq) {
          const lg = this._lg;
          const phaseID = lg.shaderLayoutIndex.get(shaderName);
          const pplLayout = lg.getLayout(phaseID);
          const setLayout = pplLayout.getSet(freq);
          return setLayout.descriptorSetLayout;
        }
        get renderGraph() {
          return this._renderGraph;
        }
        get resourceGraph() {
          return this._resourceGraph;
        }
        get layoutGraph() {
          return this._lg;
        }
        get resourceUses() {
          return this._resourceUses;
        }
        _updateRasterPassConstants(setter, width, height, layoutName = 'default') {
          const director = cclegacy.director;
          const root = director.root;
          const shadingWidth = width;
          const shadingHeight = height;
          const pipeline = root.pipeline;
          const layoutGraph = pipeline.layoutGraph;
          // Global
          _uboVec.set(root.cumulativeTime, root.frameTime, director.getTotalFrames());
          setter.setVec4('cc_time', _uboVec);
          _uboVec.set(shadingWidth, shadingHeight, 1.0 / shadingWidth, 1.0 / shadingHeight);
          setter.setVec4('cc_screenSize', _uboVec);
          _uboVec.set(shadingWidth, shadingHeight, 1.0 / shadingWidth, 1.0 / shadingHeight);
          setter.setVec4('cc_nativeSize', _uboVec);
          const debugView = root.debugView;
          _uboVec.set(0.0, 0.0, 0.0, 0.0);
          if (debugView) {
            const debugPackVec = [debugView.singleMode, 0.0, 0.0, 0.0];
            for (let i = DebugViewCompositeType.DIRECT_DIFFUSE; i < DebugViewCompositeType.MAX_BIT_COUNT; i++) {
              const idx = i >> 3;
              const bit = i % 8;
              debugPackVec[idx + 1] += (debugView.isCompositeModeEnabled(i) ? 1.0 : 0.0) * 10.0 ** bit;
            }
            debugPackVec[3] += (debugView.lightingWithAlbedo ? 1.0 : 0.0) * 10.0 ** 6.0;
            debugPackVec[3] += (debugView.csmLayerColoration ? 1.0 : 0.0) * 10.0 ** 7.0;
            _uboVec.set(debugPackVec[0], debugPackVec[1], debugPackVec[2], debugPackVec[3]);
          }
          setter.setVec4('cc_debug_view_mode', _uboVec);
        }
      });
      WebPipeline.MAX_BLOOM_FILTER_PASS_NUM = 6;
      // csm uniform used vectors count
      WebPipeline.CSM_UNIFORM_VECTORS = 61;
      // all global uniform used vectors count
      WebPipeline.GLOBAL_UNIFORM_VECTORS = 64;
    }
  };
});