System.register("q-bundled:///fs/cocos/rendering/custom/executor.js", ["../index.js", "../../core/index.js", "../../core/geometry/intersect.js", "../../core/geometry/sphere.js", "../../gfx/index.js", "../../core/global-exports.js", "../../core/math/vec3.js", "../../core/math/vec4.js", "../../render-scene/scene/shadows.js", "../define.js", "../render-types.js", "./layout-graph.js", "./render-graph.js", "./types.js", "./graph.js", "./effect.js", "./define.js", "./scene-culling.js", "./web-pipeline-types.js"], function (_export, _context) {
  "use strict";

  var getPhaseID, PipelineStateManager, cclegacy, RecyclePool, intersect, Sphere, AccessFlagBit, Attribute, BufferInfo, BufferUsageBit, BufferViewInfo, Color, ColorAttachment, DepthStencilAttachment, DescriptorSetInfo, deviceManager, DispatchInfo, Feature, Format, Framebuffer, FramebufferInfo, GeneralBarrierInfo, InputAssemblerInfo, LoadOp, MemoryUsageBit, Rect, RenderPassInfo, StoreOp, SurfaceTransform, Texture, TextureBlit, TextureInfo, TextureType, TextureUsageBit, Viewport, legacyCC, Vec3, Vec4, ShadowType, SetIndex, UBODeferredLight, UBOForwardLight, UBOLocal, UBOLocalEnum, PipelineInputAssemblerData, LayoutGraphDataValue, BlitType, RenderGraph, RenderGraphValue, RenderSwapchain, AccessType, AttachmentType, QueueHint, ResourceDimension, ResourceFlags, ResourceResidency, SceneFlags, UpdateFrequency, DefaultVisitor, depthFirstSearch, ReferenceGraphView, VectorGraphColorMap, bool, getDescriptorSetDataFromLayout, getRenderArea, rpMergeInfos, updateGlobalDescBinding, LightResource, SceneCulling, recordCommand, ResourceVisitor, DeviceResource, DeviceTexture, DeviceBuffer, BlitDesc, DeviceComputeQueue, DeviceRenderQueue, RenderPassLayoutInfo, DeviceRenderPass, ComputePassInfo, DeviceComputePass, DeviceRenderScene, ExecutorPools, BlitInfo, ExecutorContext, Executor, BaseRenderVisitor, PreRenderVisitor, PostRenderVisitor, RenderVisitor, context, _vec4Array, profilerViewport, renderPassArea, resourceVisitor, textureBlit, sceneViewport, vbData, quadRect, volLightAttrCount;
  function isShadowMap(scene) {
    const pSceneData = cclegacy.director.root.pipeline.pipelineSceneData;
    return !!(pSceneData.shadows.enabled && pSceneData.shadows.type === ShadowType.ShadowMap && scene && (scene.flags & SceneFlags.SHADOW_CASTER) !== 0);
  }
  _export({
    Executor: void 0,
    RenderVisitor: void 0
  });
  return {
    setters: [function (_indexJs) {
      getPhaseID = _indexJs.getPhaseID;
      PipelineStateManager = _indexJs.PipelineStateManager;
    }, function (_coreIndexJs) {
      cclegacy = _coreIndexJs.cclegacy;
      RecyclePool = _coreIndexJs.RecyclePool;
    }, function (_coreGeometryIntersectJs) {
      intersect = _coreGeometryIntersectJs.default;
    }, function (_coreGeometrySphereJs) {
      Sphere = _coreGeometrySphereJs.Sphere;
    }, function (_gfxIndexJs) {
      AccessFlagBit = _gfxIndexJs.AccessFlagBit;
      Attribute = _gfxIndexJs.Attribute;
      BufferInfo = _gfxIndexJs.BufferInfo;
      BufferUsageBit = _gfxIndexJs.BufferUsageBit;
      BufferViewInfo = _gfxIndexJs.BufferViewInfo;
      Color = _gfxIndexJs.Color;
      ColorAttachment = _gfxIndexJs.ColorAttachment;
      DepthStencilAttachment = _gfxIndexJs.DepthStencilAttachment;
      DescriptorSetInfo = _gfxIndexJs.DescriptorSetInfo;
      deviceManager = _gfxIndexJs.deviceManager;
      DispatchInfo = _gfxIndexJs.DispatchInfo;
      Feature = _gfxIndexJs.Feature;
      Format = _gfxIndexJs.Format;
      Framebuffer = _gfxIndexJs.Framebuffer;
      FramebufferInfo = _gfxIndexJs.FramebufferInfo;
      GeneralBarrierInfo = _gfxIndexJs.GeneralBarrierInfo;
      InputAssemblerInfo = _gfxIndexJs.InputAssemblerInfo;
      LoadOp = _gfxIndexJs.LoadOp;
      MemoryUsageBit = _gfxIndexJs.MemoryUsageBit;
      Rect = _gfxIndexJs.Rect;
      RenderPassInfo = _gfxIndexJs.RenderPassInfo;
      StoreOp = _gfxIndexJs.StoreOp;
      SurfaceTransform = _gfxIndexJs.SurfaceTransform;
      Texture = _gfxIndexJs.Texture;
      TextureBlit = _gfxIndexJs.TextureBlit;
      TextureInfo = _gfxIndexJs.TextureInfo;
      TextureType = _gfxIndexJs.TextureType;
      TextureUsageBit = _gfxIndexJs.TextureUsageBit;
      Viewport = _gfxIndexJs.Viewport;
    }, function (_coreGlobalExportsJs) {
      legacyCC = _coreGlobalExportsJs.legacyCC;
    }, function (_coreMathVec3Js) {
      Vec3 = _coreMathVec3Js.Vec3;
    }, function (_coreMathVec4Js) {
      Vec4 = _coreMathVec4Js.Vec4;
    }, function (_renderSceneSceneShadowsJs) {
      ShadowType = _renderSceneSceneShadowsJs.ShadowType;
    }, function (_defineJs) {
      SetIndex = _defineJs.SetIndex;
      UBODeferredLight = _defineJs.UBODeferredLight;
      UBOForwardLight = _defineJs.UBOForwardLight;
      UBOLocal = _defineJs.UBOLocal;
      UBOLocalEnum = _defineJs.UBOLocalEnum;
    }, function (_renderTypesJs) {
      PipelineInputAssemblerData = _renderTypesJs.PipelineInputAssemblerData;
    }, function (_layoutGraphJs) {
      LayoutGraphDataValue = _layoutGraphJs.LayoutGraphDataValue;
    }, function (_renderGraphJs) {
      BlitType = _renderGraphJs.BlitType;
      RenderGraph = _renderGraphJs.RenderGraph;
      RenderGraphValue = _renderGraphJs.RenderGraphValue;
      RenderSwapchain = _renderGraphJs.RenderSwapchain;
    }, function (_typesJs) {
      AccessType = _typesJs.AccessType;
      AttachmentType = _typesJs.AttachmentType;
      QueueHint = _typesJs.QueueHint;
      ResourceDimension = _typesJs.ResourceDimension;
      ResourceFlags = _typesJs.ResourceFlags;
      ResourceResidency = _typesJs.ResourceResidency;
      SceneFlags = _typesJs.SceneFlags;
      UpdateFrequency = _typesJs.UpdateFrequency;
    }, function (_graphJs) {
      DefaultVisitor = _graphJs.DefaultVisitor;
      depthFirstSearch = _graphJs.depthFirstSearch;
      ReferenceGraphView = _graphJs.ReferenceGraphView;
    }, function (_effectJs) {
      VectorGraphColorMap = _effectJs.VectorGraphColorMap;
    }, function (_defineJs2) {
      bool = _defineJs2.bool;
      getDescriptorSetDataFromLayout = _defineJs2.getDescriptorSetDataFromLayout;
      getRenderArea = _defineJs2.getRenderArea;
      rpMergeInfos = _defineJs2.rpMergeInfos;
      updateGlobalDescBinding = _defineJs2.updateGlobalDescBinding;
    }, function (_sceneCullingJs) {
      LightResource = _sceneCullingJs.LightResource;
      SceneCulling = _sceneCullingJs.SceneCulling;
    }, function (_webPipelineTypesJs) {
      recordCommand = _webPipelineTypesJs.recordCommand;
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
      /**
       * ========================= !DO NOT CHANGE THE FOLLOWING SECTION MANUALLY! =========================
       * The following section is auto-generated.
       * ========================= !DO NOT CHANGE THE FOLLOWING SECTION MANUALLY! =========================
       */
      /* eslint-disable max-len */
      ResourceVisitor = class ResourceVisitor {
        constructor(resName = '') {
          this.name = void 0;
          this.name = resName;
          if (context) {
            const ppl = context.pipeline;
            ppl.resourceUses.push(resName);
          }
        }
        set resName(value) {
          this.name = value;
        }
        checkTexture(name) {
          const dTex = context.deviceTextures.get(name);
          if (!dTex) return false;
          const {
            width: descWidth,
            height: descHeight
          } = context.resourceGraph.getDesc(context.resourceGraph.vertex(name));
          const checkDimensions = (actualWidth, actualHeight) => actualWidth === descWidth && actualHeight === descHeight;
          return dTex.texture ? checkDimensions(dTex.texture.width, dTex.texture.height) : dTex.swapchain ? checkDimensions(dTex.swapchain.width, dTex.swapchain.height) : false;
        }
        createDeviceTex(value) {
          let dTex = context.deviceTextures.get(this.name);
          if (!dTex || !this.checkTexture(this.name)) {
            var _dTex;
            if ((_dTex = dTex) != null && _dTex.texture) {
              dTex.texture.destroy();
            }
            dTex = new DeviceTexture(this.name, value);
            context.deviceTextures.set(this.name, dTex);
          }
        }
        checkBuffer(name) {
          const dBuf = context.deviceBuffers.get(name);
          const resID = context.resourceGraph.vertex(this.name);
          const desc = context.resourceGraph.getDesc(resID);
          return dBuf.buffer.size >= desc.width;
        }
        createDeviceBuf(value) {
          let dBuf = context.deviceBuffers.get(this.name);
          if (!dBuf || !this.checkBuffer(this.name)) {
            var _dBuf;
            if ((_dBuf = dBuf) != null && _dBuf.buffer) {
              dBuf.buffer.destroy();
            }
            dBuf = new DeviceBuffer(this.name, value);
            context.deviceBuffers.set(this.name, dBuf);
          }
        }
        managed(value) {
          this.createDeviceTex(value);
        }
        managedBuffer(value) {
          this.createDeviceBuf(value);
        }
        managedTexture(value) {
          // noop
        }
        persistentBuffer(value) {
          this.createDeviceBuf(value);
        }
        persistentTexture(value) {
          this.createDeviceTex(value);
        }
        framebuffer(value) {
          this.createDeviceTex(value);
        }
        swapchain(value) {
          this.createDeviceTex(value);
        }
        formatView(value) {
          // do nothing
        }
        subresourceView(value) {
          // do nothing
        }
      }; // Defining the recording interface
      DeviceResource = class DeviceResource {
        constructor(name) {
          this._name = void 0;
          this._name = name;
        }
        get name() {
          return this._name;
        }
      };
      DeviceTexture = class DeviceTexture extends DeviceResource {
        get texture() {
          return this._texture;
        }
        set framebuffer(val) {
          this._framebuffer = val;
        }
        get framebuffer() {
          return this._framebuffer;
        }
        get description() {
          return this._desc;
        }
        get trait() {
          return this._trait;
        }
        get swapchain() {
          return this._swapchain;
        }
        constructor(name, tex) {
          super(name);
          this._texture = null;
          this._swapchain = null;
          this._framebuffer = null;
          this._desc = null;
          this._trait = null;
          const resGraph = context.resourceGraph;
          const verID = resGraph.vertex(name);
          this._desc = resGraph.getDesc(verID);
          this._trait = resGraph.getTraits(verID);
          if (tex instanceof Texture) {
            this._texture = tex;
          } else if (tex instanceof Framebuffer) {
            this._framebuffer = tex;
          } else if (tex instanceof RenderSwapchain) {
            this._swapchain = tex.swapchain;
          } else {
            this.createTextureFromDesc(this._desc);
          }
        }
        createTextureFromDesc(desc) {
          let type = TextureType.TEX2D;
          switch (desc.dimension) {
            case ResourceDimension.TEXTURE1D:
              type = TextureType.TEX1D;
              break;
            case ResourceDimension.TEXTURE3D:
              type = TextureType.TEX3D;
              break;
            default:
          }
          const usageFlags = [[ResourceFlags.COLOR_ATTACHMENT, TextureUsageBit.COLOR_ATTACHMENT], [ResourceFlags.DEPTH_STENCIL_ATTACHMENT, TextureUsageBit.DEPTH_STENCIL_ATTACHMENT], [ResourceFlags.INPUT_ATTACHMENT, TextureUsageBit.INPUT_ATTACHMENT], [ResourceFlags.SAMPLED, TextureUsageBit.SAMPLED], [ResourceFlags.STORAGE, TextureUsageBit.STORAGE], [ResourceFlags.TRANSFER_SRC, TextureUsageBit.TRANSFER_SRC], [ResourceFlags.TRANSFER_DST, TextureUsageBit.TRANSFER_DST]].reduce((acc, [flag, bit]) => desc.flags & flag ? acc | bit : acc, TextureUsageBit.NONE);
          const texInfo = new TextureInfo(type, usageFlags, desc.format, desc.width, desc.height);
          texInfo.samples = desc.sampleCount;
          this._texture = context.device.createTexture(texInfo);
        }
        getGPUTexture() {
          let gpuTex = this._texture;
          if (this.framebuffer) {
            gpuTex = this.framebuffer.colorTextures[0];
          } else if (this.swapchain) {
            gpuTex = this.swapchain.colorTexture;
          }
          return gpuTex;
        }
        release() {
          var _this$framebuffer, _this$texture;
          (_this$framebuffer = this.framebuffer) == null || _this$framebuffer.destroy();
          this._framebuffer = null;
          (_this$texture = this.texture) == null || _this$texture.destroy();
          this._texture = null;
        }
      };
      DeviceBuffer = class DeviceBuffer extends DeviceResource {
        get buffer() {
          return this._buffer;
        }
        constructor(name, buffer) {
          super(name);
          this._buffer = null;
          const resGraph = context.resourceGraph;
          const verID = resGraph.vertex(name);
          const desc = resGraph.getDesc(verID);
          const bufferInfo = new BufferInfo(this.calculateBufferUsage(desc.flags), MemoryUsageBit.DEVICE, desc.width);
          this._buffer = context.device.createBuffer(bufferInfo);
        }
        calculateBufferUsage(flags) {
          const flagToUsageMap = [[ResourceFlags.INDIRECT, BufferUsageBit.INDIRECT], [ResourceFlags.UNIFORM, BufferUsageBit.UNIFORM], [ResourceFlags.STORAGE, BufferUsageBit.STORAGE], [ResourceFlags.TRANSFER_SRC, BufferUsageBit.TRANSFER_SRC], [ResourceFlags.TRANSFER_DST, BufferUsageBit.TRANSFER_DST]];
          return flagToUsageMap.reduce((acc, [flag, usage]) => flags & flag ? acc | usage : acc, BufferUsageBit.NONE);
        }
        release() {
          var _this$_buffer;
          (_this$_buffer = this._buffer) == null || _this$_buffer.destroy();
          this._buffer = null;
        }
      };
      _vec4Array = new Float32Array(4);
      BlitDesc = class BlitDesc {
        get screenQuad() {
          return this._screenQuad;
        }
        get blit() {
          return this._blit;
        }
        set blit(blit) {
          this._blit = blit;
        }
        get stageDesc() {
          return this._stageDesc;
        }
        constructor(blit) {
          this._isUpdate = false;
          this._isGatherLight = false;
          this._blit = void 0;
          this._screenQuad = null;
          this._stageDesc = void 0;
          // If VOLUMETRIC_LIGHTING is turned on, it needs to be assigned
          this._lightVolumeBuffer = null;
          this._lightMeterScale = 10000.0;
          this._lightBufferData = void 0;
          this._blit = blit;
        }
        /**
         * @zh
         * 创建四边形输入汇集器。
         */
        _createQuadInputAssembler() {
          return context.blit.pipelineIAData;
        }
        createScreenQuad() {
          if (!this._screenQuad) {
            this._screenQuad = this._createQuadInputAssembler();
          }
        }
        _gatherVolumeLights(camera) {
          if (!camera.scene) return;
          const pipeline = context.pipeline;
          const cmdBuff = context.commandBuffer;
          const sphereLights = camera.scene.sphereLights;
          const spotLights = camera.scene.spotLights;
          const exposure = camera.exposure;
          const maxLights = UBODeferredLight.LIGHTS_PER_PASS;
          const elementLen = Vec4.length; // sizeof(vec4) / sizeof(float32)
          const fieldLen = elementLen * maxLights;
          const _sphere = Sphere.create(0, 0, 0, 1);
          let idx = 0;
          const processLight = (light, isSpot) => {
            if (idx >= maxLights) return;
            Sphere.set(_sphere, light.position.x, light.position.y, light.position.z, light.range);
            if (intersect.sphereFrustum(_sphere, camera.frustum)) {
              // cc_lightPos
              Vec3.toArray(_vec4Array, light.position);
              _vec4Array[3] = isSpot ? 1 : 0;
              this._lightBufferData.set(_vec4Array, idx * elementLen + fieldLen * 0);

              // cc_lightColor
              Vec3.toArray(_vec4Array, light.color);
              if (light.useColorTemperature) {
                const tempRGB = light.colorTemperatureRGB;
                _vec4Array[0] *= tempRGB.x;
                _vec4Array[1] *= tempRGB.y;
                _vec4Array[2] *= tempRGB.z;
              }
              _vec4Array[3] = pipeline.pipelineSceneData.isHDR ? light.luminance * exposure * this._lightMeterScale : light.luminance;
              this._lightBufferData.set(_vec4Array, idx * elementLen + fieldLen * 1);

              // cc_lightSizeRangeAngle
              _vec4Array[0] = light.size;
              _vec4Array[1] = light.range;
              _vec4Array[2] = isSpot ? light.spotAngle : 0.0;
              this._lightBufferData.set(_vec4Array, idx * elementLen + fieldLen * 2);
              if (isSpot) {
                // cc_lightDir
                Vec3.toArray(_vec4Array, light.direction);
                this._lightBufferData.set(_vec4Array, idx * elementLen + fieldLen * 3);
              }
              idx++;
            }
          };
          for (const light of sphereLights) {
            processLight(light, false);
          }
          for (const light of spotLights) {
            processLight(light, true);
          }

          // Set the count of lights in cc_lightDir[0].w
          const offset = fieldLen * 3 + 3;
          this._lightBufferData.set([idx], offset);
          cmdBuff.updateBuffer(this._lightVolumeBuffer, this._lightBufferData);
        }
        update() {
          if (this.blit.sceneFlags & SceneFlags.VOLUMETRIC_LIGHTING && this.blit.camera && !this._isGatherLight) {
            this._gatherVolumeLights(this.blit.camera);
            this._isGatherLight = true;
            this._isUpdate = false;
          }
          if (!this._isUpdate) {
            this._stageDesc.update();
            this._isUpdate = true;
          }
        }
        reset() {
          this._isUpdate = false;
          this._isGatherLight = false;
        }
        createStageDescriptor() {
          const blit = this.blit;
          const pass = blit.material.passes[blit.passID];
          const device = context.device;
          this._stageDesc = context.blit.stageDescs.get(pass) || device.createDescriptorSet(new DescriptorSetInfo(pass.localSetLayout));
          context.blit.stageDescs.set(pass, this._stageDesc);
          if (this.blit.sceneFlags & SceneFlags.VOLUMETRIC_LIGHTING) {
            this._lightVolumeBuffer = context.blit.lightVolumeBuffer;
            const deferredLitsBufView = context.blit.deferredLitsBufView;
            this._lightBufferData = context.blit.lightBufferData;
            this._lightBufferData.fill(0);
            this._stageDesc.bindBuffer(UBOForwardLight.BINDING, deferredLitsBufView);
          }
          this._stageDesc.bindBuffer(UBOLocal.BINDING, context.blit.emptyLocalUBO);
        }
      };
      DeviceComputeQueue = class DeviceComputeQueue {
        constructor() {
          this._devicePass = void 0;
          this._hint = QueueHint.NONE;
          this._phaseID = getPhaseID('default');
          this._renderPhase = null;
          this._descSetData = null;
          this._layoutID = -1;
          this._isUpdateUBO = false;
          this._isUploadInstance = false;
          this._isUploadBatched = false;
          this._queueId = -1;
        }
        preRecord() {
          // nothing to do
        }
        postRecord() {
          // nothing to do
        }
        init(devicePass, renderQueue, id) {
          this.reset();
          this.queueHint = renderQueue.hint;
          this.queueId = id;
          this._devicePass = devicePass;
          this._phaseID = cclegacy.rendering.getPhaseID(devicePass.passID, context.renderGraph.getLayout(id));
        }
        get phaseID() {
          return this._phaseID;
        }
        set layoutID(value) {
          this._layoutID = value;
          const layoutGraph = context.layoutGraph;
          this._renderPhase = layoutGraph.h(LayoutGraphDataValue.RenderPhase, value) ? layoutGraph.j(value) : null;
          const layout = layoutGraph.getLayout(value);
          this._descSetData = layout.getSet(UpdateFrequency.PER_PHASE);
        }
        get layoutID() {
          return this._layoutID;
        }
        get descSetData() {
          return this._descSetData;
        }
        get renderPhase() {
          return this._renderPhase;
        }
        set queueId(val) {
          this._queueId = val;
        }
        get queueId() {
          return this._queueId;
        }
        set isUpdateUBO(update) {
          this._isUpdateUBO = update;
        }
        get isUpdateUBO() {
          return this._isUpdateUBO;
        }
        set isUploadInstance(value) {
          this._isUploadInstance = value;
        }
        get isUploadInstance() {
          return this._isUploadInstance;
        }
        set isUploadBatched(value) {
          this._isUploadBatched = value;
        }
        get isUploadBatched() {
          return this._isUploadBatched;
        }
        reset() {
          this._isUpdateUBO = false;
          this._isUploadInstance = false;
          this._isUploadBatched = false;
        }
        set queueHint(value) {
          this._hint = value;
        }
        get queueHint() {
          return this._hint;
        }
        get devicePass() {
          return this._devicePass;
        }
        record() {
          if (this._descSetData && this._descSetData.descriptorSet) {
            context.commandBuffer.bindDescriptorSet(SetIndex.COUNT, this._descSetData.descriptorSet);
          }
        }
      };
      DeviceRenderQueue = class DeviceRenderQueue {
        constructor() {
          this._renderScenes = [];
          this._devicePass = void 0;
          this._hint = QueueHint.NONE;
          this._graphQueue = void 0;
          this._phaseID = getPhaseID('default');
          this._renderPhase = null;
          this._descSetData = null;
          this._viewport = null;
          this._scissor = null;
          this._layoutID = -1;
          this._isUpdateUBO = false;
          this._isUploadInstance = false;
          this._isUploadBatched = false;
          this._blitDesc = null;
          this._queueId = -1;
        }
        get phaseID() {
          return this._phaseID;
        }
        set layoutID(value) {
          this._layoutID = value;
          const layoutGraph = context.layoutGraph;
          this._renderPhase = layoutGraph.h(LayoutGraphDataValue.RenderPhase, value) ? layoutGraph.j(value) : null;
          const layout = layoutGraph.getLayout(value);
          this._descSetData = layout.getSet(UpdateFrequency.PER_PHASE);
        }
        get layoutID() {
          return this._layoutID;
        }
        get descSetData() {
          return this._descSetData;
        }
        get renderPhase() {
          return this._renderPhase;
        }
        get viewport() {
          return this._viewport;
        }
        get scissor() {
          return this._scissor;
        }
        set queueId(val) {
          this._queueId = val;
        }
        get queueId() {
          return this._queueId;
        }
        set isUpdateUBO(update) {
          this._isUpdateUBO = update;
        }
        get isUpdateUBO() {
          return this._isUpdateUBO;
        }
        set isUploadInstance(value) {
          this._isUploadInstance = value;
        }
        get isUploadInstance() {
          return this._isUploadInstance;
        }
        set isUploadBatched(value) {
          this._isUploadBatched = value;
        }
        get isUploadBatched() {
          return this._isUploadBatched;
        }
        init(devicePass, renderQueue, id) {
          this.reset();
          this._graphQueue = renderQueue;
          this.queueHint = renderQueue.hint;
          const viewport = this._viewport = renderQueue.viewport;
          if (viewport) {
            this._scissor = new Rect(viewport.left, viewport.top, viewport.width, viewport.height);
          }
          this.queueId = id;
          this._devicePass = devicePass;
          this._phaseID = cclegacy.rendering.getPhaseID(devicePass.passID, context.renderGraph.getLayout(id));
        }

        /**
         * @en Creates a blit descriptor for the given blit operation.
         * @zh 为给定的 blit 操作创建一个 blit 描述符。
         * @param blit @en The blit operation to create a descriptor for. @zh 要为其创建描述符的 blit 操作。
         */
        createBlitDesc(blit) {
          if (!this._blitDesc) {
            this._blitDesc = new BlitDesc(blit);
          }
          this._blitDesc.blit = blit;
          this._blitDesc.createScreenQuad();
          this._blitDesc.createStageDescriptor();
        }
        setScene(sceneID, scene, blit) {
          const deviceScene = context.pools.addDeviceScene();
          deviceScene.init(this, sceneID, scene, blit);
          this._renderScenes.push(deviceScene);
          return deviceScene;
        }
        reset() {
          var _this$_blitDesc;
          this._renderScenes.length = 0;
          this._isUpdateUBO = false;
          this._isUploadInstance = false;
          this._isUploadBatched = false;
          (_this$_blitDesc = this._blitDesc) == null || _this$_blitDesc.reset();
        }
        get graphQueue() {
          return this._graphQueue;
        }
        get blitDesc() {
          return this._blitDesc;
        }
        get renderScenes() {
          return this._renderScenes;
        }
        set queueHint(value) {
          this._hint = value;
        }
        get queueHint() {
          return this._hint;
        }
        get devicePass() {
          return this._devicePass;
        }
        preRecord() {
          // nothing to do
        }
        record() {
          if (this._descSetData && this._descSetData.descriptorSet) {
            context.commandBuffer.bindDescriptorSet(SetIndex.COUNT, this._descSetData.descriptorSet);
          }
          this._renderScenes.forEach(scene => {
            scene.record();
          });
        }
        postRecord() {
          // nothing to do
        }
      };
      RenderPassLayoutInfo = class RenderPassLayoutInfo {
        constructor(layoutId, vertId, input) {
          this._layoutID = 0;
          this._vertID = -1;
          this._resID = -1;
          this._stage = null;
          this._layout = void 0;
          this._inputName = void 0;
          this._descriptorSet = null;
          this._inputName = input[0];
          this._layoutID = layoutId;
          this._vertID = vertId;
          const lg = context.layoutGraph;
          this._stage = lg.j(layoutId);
          this._layout = lg.getLayout(layoutId);
          const layoutData = this._layout.getSet(UpdateFrequency.PER_PASS);
          if (!layoutData) {
            return;
          }
          const layoutDesc = layoutData.descriptorSet;
          const deviceTex = context.deviceTextures.get(this._inputName);
          const gfxTex = deviceTex == null ? void 0 : deviceTex.texture;
          const deviceBuf = context.deviceBuffers.get(this._inputName);
          const gfxBuf = deviceBuf == null ? void 0 : deviceBuf.buffer;
          if (!gfxTex && !gfxBuf) {
            throw Error(`Could not find texture with resource name ${this._inputName}`);
          }
          this._resID = context.resourceGraph.vertex(this._inputName);
          const samplerInfo = context.resourceGraph.getSampler(this._resID);

          // bind descriptors
          for (const descriptor of input[1]) {
            const descriptorName = descriptor.name;
            const descriptorID = lg.attributeIndex.get(descriptorName);
            if (descriptorID === undefined) {
              continue;
            }
            this.bindDescriptor(layoutDesc, descriptorID, gfxTex, gfxBuf, samplerInfo, input[1][0].accessType);
          }
        }
        bindDescriptor(layoutDesc, descriptorID, gfxTex, gfxBuf, samplerInfo, accessType) {
          const layoutData = this._layout.getSet(UpdateFrequency.PER_PASS);
          const desc = context.resourceGraph.getDesc(this._resID);
          for (const block of layoutData.descriptorSetLayoutData.descriptorBlocks) {
            for (let i = 0; i < block.descriptors.length; ++i) {
              if (descriptorID === block.descriptors[i].descriptorID) {
                const offset = block.offset;
                if (gfxTex) {
                  layoutDesc.bindTexture(offset + i, gfxTex);
                  const renderData = context.renderGraph.getData(this._vertID);
                  const sampler = renderData.samplers.get(descriptorID) || context.device.getSampler(samplerInfo);
                  layoutDesc.bindSampler(offset + i, sampler);
                } else if (desc.flags & ResourceFlags.STORAGE) {
                  const access = accessType !== AccessType.READ ? AccessFlagBit.COMPUTE_SHADER_WRITE : AccessFlagBit.COMPUTE_SHADER_READ_OTHER;
                  layoutDesc.bindBuffer(block.offset + i, gfxBuf, 0, access);
                } else {
                  layoutDesc.bindBuffer(offset + i, gfxBuf);
                }
                if (!this._descriptorSet) {
                  this._descriptorSet = layoutDesc;
                }
                break;
              }
            }
          }
        }
        get descriptorSet() {
          return this._descriptorSet;
        }
        get layoutID() {
          return this._layoutID;
        }
        get vertID() {
          return this._vertID;
        }
        get stage() {
          return this._stage;
        }
        get layout() {
          return this._layout;
        }
      };
      profilerViewport = new Viewport();
      renderPassArea = new Rect();
      resourceVisitor = new ResourceVisitor();
      textureBlit = new TextureBlit();
      DeviceRenderPass = class DeviceRenderPass {
        _traversalResolves(callback) {
          const subpassGraph = this._rasterPass.subpassGraph;
          const subpasses = subpassGraph._subpasses;
          for (const subpass of subpasses) {
            const resolvePairs = subpass.resolvePairs;
            for (const resolve of resolvePairs) {
              callback(resolve);
            }
          }
        }
        _getOrCreateDeviceTex(resName) {
          let resTex = context.deviceTextures.get(resName);
          if (!resTex) {
            this.visitResource(resName);
            resTex = context.deviceTextures.get(resName);
          } else {
            const resGraph = context.resourceGraph;
            const resId = resGraph.vertex(resName);
            const resFbo = resGraph.object(resId);
            if (resTex.framebuffer && resFbo instanceof Framebuffer && resTex.framebuffer !== resFbo) {
              resTex.framebuffer = resFbo;
            } else if (resTex.texture) {
              const desc = resGraph.getDesc(resId);
              if (resTex.texture.width !== desc.width || resTex.texture.height !== desc.height) {
                resTex.texture.resize(desc.width, desc.height);
              }
            }
          }
          return resTex;
        }
        _applyResolve(srcName, srcTex) {
          if (!srcTex) {
            return;
          }
          const resolvedTexes = this._resolveTextures;
          // resolve msaa
          this._traversalResolves(resolvePair => {
            const resolvedTex = this._getOrCreateDeviceTex(resolvePair.target);
            resolvedTexes.set(resolvePair.source, resolvedTex);
          });
          const currResolved = resolvedTexes.get(srcName);
          if (currResolved) {
            const gpuTex = srcTex.gpuTexture;
            gpuTex.resolveTex = currResolved.getGPUTexture().gpuTexture;
          }
        }
        constructor(rasterID, rasterPass) {
          this._renderPass = void 0;
          this._framebuffer = void 0;
          this._clearColor = [];
          this._deviceQueues = new Map();
          this._resolveTextures = new Map();
          this._clearDepth = 1;
          this._clearStencil = 0;
          this._passID = void 0;
          this._rasterID = void 0;
          this._rasterPass = void 0;
          this._layoutName = void 0;
          this._viewport = null;
          this._layout = null;
          this._idxOfRenderData = 0;
          this._rasterID = rasterID;
          this._rasterPass = rasterPass;
          const device = context.device;
          this._layoutName = context.renderGraph.getLayout(rasterID);
          this._passID = cclegacy.rendering.getPassID(this._layoutName);
          const depAtt = new DepthStencilAttachment();
          depAtt.format = Format.DEPTH_STENCIL;
          const colors = [];
          const colorTexs = [];
          let depthTex = null;
          let swapchain = null;
          let framebuffer = null;
          for (const [resName, rasterV] of rasterPass.rasterViews) {
            const resTex = this._getOrCreateDeviceTex(resName);
            if (!swapchain) swapchain = resTex.swapchain;
            if (!framebuffer) framebuffer = resTex.framebuffer;
            const isLoadAttachment = rasterV.loadOp === LoadOp.LOAD;
            if (rasterV.attachmentType === AttachmentType.RENDER_TARGET) {
              if (!resTex.swapchain && !resTex.framebuffer) colorTexs.push(resTex.texture);
              const colAtt = new ColorAttachment();
              colAtt.format = resTex.description.format;
              colAtt.sampleCount = resTex.description.sampleCount;
              colAtt.loadOp = rasterV.loadOp;
              colAtt.storeOp = rasterV.storeOp;
              colAtt.barrier = device.getGeneralBarrier(new GeneralBarrierInfo(isLoadAttachment ? AccessFlagBit.COLOR_ATTACHMENT_WRITE : AccessFlagBit.NONE, rasterV.storeOp === StoreOp.STORE ? AccessFlagBit.COLOR_ATTACHMENT_WRITE : AccessFlagBit.NONE));
              const currCol = new Color();
              currCol.copy(rasterV.clearColor);
              this._clearColor.push(currCol);
              colors.push(colAtt);
            } else if (rasterV.attachmentType === AttachmentType.DEPTH_STENCIL) {
              depAtt.depthStoreOp = rasterV.storeOp;
              depAtt.stencilStoreOp = rasterV.storeOp;
              depAtt.depthLoadOp = rasterV.loadOp;
              depAtt.sampleCount = resTex.description.sampleCount;
              depAtt.stencilLoadOp = rasterV.loadOp;
              depAtt.barrier = device.getGeneralBarrier(new GeneralBarrierInfo(isLoadAttachment ? AccessFlagBit.DEPTH_STENCIL_ATTACHMENT_WRITE : AccessFlagBit.NONE, rasterV.storeOp === StoreOp.STORE ? AccessFlagBit.DEPTH_STENCIL_ATTACHMENT_WRITE : AccessFlagBit.NONE));
              if (!resTex.swapchain && !resTex.framebuffer) {
                depthTex = resTex.texture;
              } else if (resTex.swapchain) {
                depthTex = resTex.swapchain.depthStencilTexture;
              }
              this._clearDepth = rasterV.clearColor.x;
              this._clearStencil = rasterV.clearColor.y;
            }
            this._applyResolve(resName, resTex.texture);
          }
          if (colors.length === 0) {
            const colorAttachment = new ColorAttachment();
            colors.push(colorAttachment);
          }
          if (colorTexs.length === 0 && !swapchain && !framebuffer) {
            const currTex = device.createTexture(new TextureInfo());
            colorTexs.push(currTex);
          }
          const renderPassInfo = new RenderPassInfo();
          renderPassInfo.colorAttachments = colors;
          const depth = swapchain ? swapchain.depthStencilTexture : depthTex;
          if (depth) {
            renderPassInfo.depthStencilAttachment = depAtt;
          }
          this._renderPass = device.createRenderPass(renderPassInfo);
          this._createFramebuffer(framebuffer, swapchain ? [swapchain.colorTexture] : colorTexs, swapchain ? swapchain.depthStencilTexture : depthTex);
        }
        get passMergeInfo() {
          return rpMergeInfos.get(this._rasterPass);
        }
        get indexOfRD() {
          return this._idxOfRenderData;
        }
        get rasterID() {
          return this._rasterID;
        }
        get layoutName() {
          return this._layoutName;
        }
        get passID() {
          return this._passID;
        }
        get renderLayout() {
          return this._layout;
        }
        get renderPass() {
          return this._renderPass;
        }
        get framebuffer() {
          return this._framebuffer;
        }
        get clearColor() {
          return this._clearColor;
        }
        get clearDepth() {
          return this._clearDepth;
        }
        get clearStencil() {
          return this._clearStencil;
        }
        get deviceQueues() {
          return this._deviceQueues;
        }
        get viewport() {
          return this._viewport;
        }
        addIdxOfRD() {
          this._idxOfRenderData++;
        }
        visitResource(resName) {
          const resourceGraph = context.resourceGraph;
          const vertId = resourceGraph.vertex(resName);
          resourceVisitor.resName = resName;
          resourceGraph.visitVertex(resourceVisitor, vertId);
        }
        addQueue(queue) {
          this._deviceQueues.set(queue.queueId, queue);
        }
        preRecord() {
          context.passDescriptorSet = getDescriptorSetDataFromLayout(this.layoutName).descriptorSet;
        }
        _applyRenderLayout(input) {
          const stageName = context.renderGraph.getLayout(this._rasterID);
          if (stageName) {
            const layoutGraph = context.layoutGraph;
            const stageId = layoutGraph.locateChild(layoutGraph.N, stageName);
            if (stageId !== 0xFFFFFFFF) {
              this._layout = new RenderPassLayoutInfo(stageId, this._rasterID, input);
            }
          }
        }
        getGlobalDescData() {
          const stageId = context.layoutGraph.locateChild(context.layoutGraph.N, 'default');
          const layout = context.layoutGraph.getLayout(stageId);
          const layoutData = layout.getSet(UpdateFrequency.PER_PASS);
          return layoutData;
        }
        _applyViewport(frameTex) {
          this._viewport = null;
          const viewport = this._rasterPass.viewport;
          if (viewport.left !== 0 || viewport.top !== 0 || viewport.width !== 0 || viewport.height !== 0) {
            this._viewport = viewport;
          }
        }
        bindGlobalDesc() {
          const cmdBuff = context.commandBuffer;
          if (context.passDescriptorSet) {
            cmdBuff.bindDescriptorSet(SetIndex.GLOBAL, context.passDescriptorSet);
          }
        }
        beginPass() {
          if (!this.passMergeInfo.needBeginRP) {
            this.bindGlobalDesc();
            return;
          }
          const cmdBuff = context.commandBuffer;
          const tex = this.framebuffer.colorTextures[0];
          this._applyViewport(tex);
          if (this._viewport) {
            renderPassArea.x = this._viewport.left;
            renderPassArea.y = this._viewport.top;
            renderPassArea.width = this._viewport.width;
            renderPassArea.height = this._viewport.height;
          } else {
            renderPassArea.y = renderPassArea.x = 0;
            renderPassArea.width = tex.width;
            renderPassArea.height = tex.height;
          }
          cmdBuff.beginRenderPass(this.renderPass, this.framebuffer, renderPassArea, this.clearColor, this.clearDepth, this.clearStencil);
          this.bindGlobalDesc();
        }
        endPass() {
          if (!this.passMergeInfo.needEndRP) return;
          const cmdBuff = context.commandBuffer;
          cmdBuff.endRenderPass();
        }
        // record common buffer
        record() {
          this.beginPass();
          for (const queue of this._deviceQueues.values()) {
            queue.record();
          }
          this.endPass();
        }
        postRecord() {}
        _processRenderLayout(pass) {
          for (const cv of pass.computeViews) {
            this._applyRenderLayout(cv);
          }
          // update the layout descriptorSet
          if (this.renderLayout && this.renderLayout.descriptorSet) {
            this.renderLayout.descriptorSet.update();
          }
        }
        processRenderLayout() {
          this._processRenderLayout(this._rasterPass);
        }
        _createFramebuffer(fbo, cols, depthTex) {
          if (!fbo && !cols.length) return;
          if (this._framebuffer && fbo !== this._framebuffer) this._framebuffer.destroy();
          this._framebuffer = fbo || context.device.createFramebuffer(new FramebufferInfo(this._renderPass, cols, depthTex));
        }
        resetResource(id, pass) {
          var _currFramebuffer$dept, _currFramebuffer$widt, _currFramebuffer$heig, _currFramebuffer$need;
          this._rasterID = id;
          this._rasterPass = pass;
          this._layoutName = context.renderGraph.getLayout(id);
          this._passID = cclegacy.rendering.getPassID(this._layoutName);
          this._deviceQueues.clear();
          this._idxOfRenderData = 0;
          let framebuffer = null;
          const colTextures = [];
          const currFramebuffer = this._framebuffer;
          const currFBDepthTex = (_currFramebuffer$dept = currFramebuffer == null ? void 0 : currFramebuffer.depthStencilTexture) != null ? _currFramebuffer$dept : null;
          let depTexture = currFramebuffer ? currFBDepthTex : null;
          const currentWidth = (_currFramebuffer$widt = currFramebuffer == null ? void 0 : currFramebuffer.width) != null ? _currFramebuffer$widt : 0;
          const currentHeight = (_currFramebuffer$heig = currFramebuffer == null ? void 0 : currFramebuffer.height) != null ? _currFramebuffer$heig : 0;
          let [width, height] = [0, 0];
          for (const [resName, rasterV] of pass.rasterViews) {
            if (rasterV.attachmentType !== AttachmentType.SHADING_RATE) {
              const resDesc = context.resourceGraph.getDesc(context.resourceGraph.vertex(resName));
              width = resDesc.width;
              height = resDesc.height;
              break;
            }
          }
          // The texture inside the fbo was destroyed？
          const isInsideTexDestroy = (currFramebuffer == null ? void 0 : currFramebuffer.colorTextures.some(colTex => !colTex || colTex.getTextureHandle() === 0)) || currFBDepthTex && currFBDepthTex.getTextureHandle() === 0;
          const needRebuild = width !== currentWidth || height !== currentHeight || ((_currFramebuffer$need = currFramebuffer == null ? void 0 : currFramebuffer.needRebuild) != null ? _currFramebuffer$need : false) || isInsideTexDestroy;
          for (const [resName, rasterV] of pass.rasterViews) {
            let deviceTex = context.deviceTextures.get(resName);
            if (!deviceTex) {
              this.visitResource(resName);
              deviceTex = context.deviceTextures.get(resName);
            }
            const resGraph = context.resourceGraph;
            const resId = resGraph.vertex(resName);
            const resFbo = resGraph.object(resId);
            const resDesc = resGraph.getDesc(resId);
            if (deviceTex.framebuffer && resFbo instanceof Framebuffer && (deviceTex.framebuffer !== resFbo || resFbo !== this._framebuffer)) {
              framebuffer = this._framebuffer = deviceTex.framebuffer = resFbo;
            } else if (deviceTex.texture && needRebuild) {
              const gfxTex = deviceTex.texture;
              gfxTex.resize(resDesc.width, resDesc.height);
              if (rasterV.attachmentType === AttachmentType.RENDER_TARGET) {
                colTextures.push(gfxTex);
              } else if (rasterV.attachmentType === AttachmentType.DEPTH_STENCIL) {
                depTexture = gfxTex;
              }
            }
            this._applyResolve(resName, deviceTex.texture);
          }
          this._createFramebuffer(framebuffer, colTextures, depTexture);
        }
      };
      ComputePassInfo = class ComputePassInfo {
        constructor() {
          this._id = void 0;
          this._pass = void 0;
        }
        get id() {
          return this._id;
        }
        get pass() {
          return this._pass;
        }
        applyInfo(id, pass) {
          this._id = id;
          this._pass = pass;
        }
      };
      DeviceComputePass = class DeviceComputePass {
        constructor(passInfo) {
          this._deviceQueues = [];
          this._passID = void 0;
          this._layoutName = void 0;
          this._viewport = null;
          this._computeInfo = void 0;
          this._layout = null;
          this._computeInfo = passInfo;
          this._layoutName = context.renderGraph.getLayout(passInfo.id);
          this._passID = cclegacy.rendering.getPassID(this._layoutName);
          for (const cv of passInfo.pass.computeViews) {
            let resTex = context.deviceTextures.get(cv[0]);
            if (!resTex) {
              this.visitResource(cv[0]);
              resTex = context.deviceTextures.get(cv[0]);
            }
            this._applyRenderLayout(cv);
          }
          // update the layout descriptorSet
          if (this.renderLayout && this.renderLayout.descriptorSet) {
            this.renderLayout.descriptorSet.update();
          }
        }
        preRecord() {
          context.passDescriptorSet = getDescriptorSetDataFromLayout(this.layoutName).descriptorSet;
        }
        postRecord() {
          // nothing to do
        }
        get layoutName() {
          return this._layoutName;
        }
        get passID() {
          return this._passID;
        }
        get renderLayout() {
          return this._layout;
        }
        get deviceQueues() {
          return this._deviceQueues;
        }
        get computePassInfo() {
          return this._computeInfo;
        }
        visitResource(resName) {
          const resourceGraph = context.resourceGraph;
          const vertId = resourceGraph.vertex(resName);
          resourceVisitor.resName = resName;
          resourceGraph.visitVertex(resourceVisitor, vertId);
        }
        addQueue(queue) {
          this._deviceQueues.push(queue);
        }
        _applyRenderLayout(input) {
          const stageName = context.renderGraph.getLayout(this._computeInfo.id);
          if (stageName) {
            const layoutGraph = context.layoutGraph;
            const stageId = layoutGraph.locateChild(layoutGraph.N, stageName);
            if (stageId !== 0xFFFFFFFF) {
              this._layout = new RenderPassLayoutInfo(stageId, this._computeInfo.id, input);
            }
          }
        }
        getGlobalDescData() {
          const stageId = context.layoutGraph.locateChild(context.layoutGraph.N, 'default');
          const layout = context.layoutGraph.getLayout(stageId);
          const layoutData = layout.getSet(UpdateFrequency.PER_PASS);
          return layoutData;
        }

        // record common buffer
        record() {
          const cmdBuff = context.commandBuffer;
          if (context.passDescriptorSet) {
            cmdBuff.bindDescriptorSet(SetIndex.GLOBAL, context.passDescriptorSet);
          }
          for (const queue of this._deviceQueues) {
            queue.record();
          }
          const renderData = context.renderGraph.getData(this._computeInfo.id);
          updateGlobalDescBinding(renderData, -1, 0, context.renderGraph.getLayout(this._computeInfo.id));
        }
        resetResource(id, pass) {
          this._computeInfo.applyInfo(id, pass);
          this._layoutName = context.renderGraph.getLayout(id);
          this._passID = cclegacy.rendering.getPassID(this._layoutName);
          this._deviceQueues.length = 0;
          for (const cv of this._computeInfo.pass.computeViews) {
            this._applyRenderLayout(cv);
          }
          // update the layout descriptorSet
          if (this.renderLayout && this.renderLayout.descriptorSet) {
            this.renderLayout.descriptorSet.update();
          }
        }
      };
      sceneViewport = new Viewport();
      DeviceRenderScene = class DeviceRenderScene {
        constructor() {
          this._currentQueue = void 0;
          this._renderPass = void 0;
          this._scene = null;
          this._camera = null;
          this._sceneData = void 0;
          this._blit = void 0;
          this._sceneID = -1;
        }
        get blit() {
          return this._blit;
        }
        get sceneData() {
          return this._sceneData;
        }
        get sceneID() {
          return this._sceneID;
        }
        get camera() {
          return this._camera;
        }
        preRecord() {
          if (this._blit && this._blit.blitType === BlitType.FULLSCREEN_QUAD) {
            this._currentQueue.createBlitDesc(this._blit);
            this._currentQueue.blitDesc.update();
          }
        }
        postRecord() {
          // nothing to do
        }
        init(queue, sceneID, scene, blit) {
          this._currentQueue = queue;
          this._sceneData = scene;
          this._blit = blit;
          this._sceneID = sceneID;
          this._renderPass = queue.devicePass.renderPass;
          const camera = scene && scene.camera ? scene.camera : blit && blit.camera ? blit.camera : null;
          if (camera) {
            this._scene = camera.scene;
            this._camera = camera;
          }
        }
        _record3D() {
          const blit = this._blit;
          const device = context.device;
          const cmdBuff = context.commandBuffer;
          for (const model of blit.models) {
            for (const subModel of model.subModels) {
              const inputAssembler = subModel.inputAssembler;
              const passCount = subModel.passes.length;
              for (let passId = 0; passId < passCount; ++passId) {
                const pass = subModel.passes[passId];
                const shader = subModel.shaders[passId];
                const pso = PipelineStateManager.getOrCreatePipelineState(device, pass, shader, this._renderPass, inputAssembler);
                cmdBuff.bindPipelineState(pso);
                cmdBuff.bindDescriptorSet(SetIndex.MATERIAL, pass.descriptorSet);
                cmdBuff.bindDescriptorSet(SetIndex.LOCAL, subModel.descriptorSet);
                cmdBuff.bindInputAssembler(inputAssembler);
                cmdBuff.draw(inputAssembler);
              }
            }
          }
        }
        _recordUI() {
          const batches = this.camera.scene.batches;
          for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            let visible = false;
            if (this.camera.visibility & batch.visFlags) {
              visible = true;
            }
            if (!visible) continue;
            // shaders.length always equals actual used passes.length
            const count = batch.shaders.length;
            for (let j = 0; j < count; j++) {
              const pass = batch.passes[j];
              if (pass.phaseID !== this._currentQueue.phaseID) continue;
              const shader = batch.shaders[j];
              const ia = batch.inputAssembler;
              const ds = batch.descriptorSet;
              recordCommand(context.commandBuffer, this._renderPass, pass, ds, shader, ia);
            }
          }
        }
        _showProfiler() {
          const rect = renderPassArea;
          const profiler = context.pipeline.profiler;
          if (!profiler || !profiler.enabled || !context.passShowStatistics) {
            return;
          }
          const profilerDesc = context.profilerDescriptorSet;
          const renderPass = this._renderPass;
          const cmdBuff = context.commandBuffer;
          const submodel = profiler.subModels[0];
          const pass = submodel.passes[0];
          const ia = submodel.inputAssembler;
          profilerViewport.width = rect.width;
          profilerViewport.height = rect.height;
          cmdBuff.setViewport(profilerViewport);
          cmdBuff.setScissor(rect);
          cmdBuff.bindDescriptorSet(SetIndex.GLOBAL, profilerDesc);
          recordCommand(cmdBuff, renderPass, pass, submodel.descriptorSet, submodel.shaders[0], ia);
        }
        _recordBlit() {
          if (!this.blit) {
            return;
          }
          const blit = this.blit;
          const currMat = blit.material;
          const pass = currMat.passes[blit.passID];
          pass.update();
          const shader = pass.getShaderVariant();
          const blitDesc = this._currentQueue.blitDesc;
          const screenIa = blitDesc.screenQuad.quadIA;
          recordCommand(context.commandBuffer, this._renderPass, pass, blitDesc.stageDesc, shader, screenIa);
        }
        _updateGlobal(data, sceneId) {
          const devicePass = this._currentQueue.devicePass;
          devicePass.addIdxOfRD();
          updateGlobalDescBinding(data, sceneId, devicePass.indexOfRD, context.renderGraph.getLayout(devicePass.rasterID));
        }
        _updateRenderData() {
          var _context$passDescript;
          if (this._currentQueue.isUpdateUBO) return;
          const devicePass = this._currentQueue.devicePass;
          const rasterId = devicePass.rasterID;
          const passRenderData = context.renderGraph.getData(rasterId);
          const sceneId = this.sceneID;
          // global
          this._updateGlobal(context.renderGraph.globalRenderData, sceneId);
          // pass
          this._updateGlobal(passRenderData, sceneId);
          // queue
          const queueId = this._currentQueue.queueId;
          const queueRenderData = context.renderGraph.getData(queueId);
          this._updateGlobal(queueRenderData, sceneId);
          // scene
          const sceneRenderData = context.renderGraph.getData(sceneId);
          if (sceneRenderData) this._updateGlobal(sceneRenderData, sceneId);
          devicePass.processRenderLayout();
          (_context$passDescript = context.passDescriptorSet) == null || _context$passDescript.update();
          this._currentQueue.isUpdateUBO = true;
        }
        _applyViewport() {
          const queueViewport = this._currentQueue.viewport;
          if (queueViewport) {
            context.commandBuffer.setViewport(queueViewport);
            context.commandBuffer.setScissor(this._currentQueue.scissor);
          } else if (!this._currentQueue.devicePass.viewport) {
            const texture = this._currentQueue.devicePass.framebuffer.colorTextures[0];
            const lightInfo = this.sceneData ? this.sceneData.light : null;
            const area = isShadowMap(this.sceneData) && this.sceneData && lightInfo.light ? getRenderArea(this.camera, texture.width, texture.height, lightInfo.light, lightInfo.level) : getRenderArea(this.camera, texture.width, texture.height);
            sceneViewport.left = area.x;
            sceneViewport.top = area.y;
            sceneViewport.width = area.width;
            sceneViewport.height = area.height;
            context.commandBuffer.setViewport(sceneViewport);
            context.commandBuffer.setScissor(area);
          }
        }
        record() {
          const devicePass = this._currentQueue.devicePass;
          const sceneCulling = context.culling;
          this._updateRenderData();
          this._applyViewport();

          // Currently processing blit and camera first
          if (this.blit) {
            switch (this.blit.blitType) {
              case BlitType.FULLSCREEN_QUAD:
                this._recordBlit();
                break;
              case BlitType.DRAW_2D:
                this._recordUI();
                break;
              case BlitType.DRAW_PROFILE:
                this._showProfiler();
                break;
              case BlitType.DRAW_3D:
                this._record3D();
                break;
              default:
                break;
            }
            return;
          }
          const rqQuery = sceneCulling.renderQueueQueryIndex.get(this.sceneID);
          const rq = sceneCulling.renderQueues[rqQuery.renderQueueTarget];
          const graphSceneData = this.sceneData;
          const isProbe = bool(graphSceneData.flags & SceneFlags.REFLECTION_PROBE);
          if (isProbe) rq.probeQueue.applyMacro();
          rq.recordCommands(context.commandBuffer, this._renderPass, graphSceneData.flags);
          if (isProbe) rq.probeQueue.removeMacro();
          if (graphSceneData.flags & SceneFlags.GEOMETRY) {
            var _geometryRenderer;
            (_geometryRenderer = this.camera.geometryRenderer) == null || _geometryRenderer.render(devicePass.renderPass, context.commandBuffer, context.pipeline.pipelineSceneData);
          }
        }
      };
      ExecutorPools = class ExecutorPools {
        constructor() {
          this.deviceQueuePool = void 0;
          this.computeQueuePool = void 0;
          this.passPool = void 0;
          this.deviceScenePool = void 0;
          this.deviceQueuePool = new RecyclePool(() => new DeviceRenderQueue(), 16);
          this.deviceScenePool = new RecyclePool(() => new DeviceRenderScene(), 16);
          this.computeQueuePool = new RecyclePool(() => new DeviceComputeQueue(), 16);
          this.passPool = new RecyclePool(() => ({
            priority: 0,
            hash: 0,
            depth: 0,
            shaderId: 0,
            subModel: null,
            passIdx: 0
          }), 64);
        }
        addDeviceQueue() {
          return this.deviceQueuePool.add();
        }
        addComputeQueue() {
          return this.computeQueuePool.add();
        }
        addDeviceScene() {
          return this.deviceScenePool.add();
        }
        reset() {
          this.deviceQueuePool.reset();
          this.computeQueuePool.reset();
          this.deviceScenePool.reset();
        }
      };
      vbData = new Float32Array(4 * 4);
      quadRect = new Rect(); // The attribute length of the volume light
      volLightAttrCount = 5;
      BlitInfo = class BlitInfo {
        get pipelineIAData() {
          return this._pipelineIAData;
        }
        get deferredLitsBufView() {
          return this._deferredLitsBufView;
        }
        get lightVolumeBuffer() {
          return this._lightVolumeBuffer;
        }
        get lightBufferData() {
          return this._lightBufferData;
        }
        get stageDescs() {
          return this._stageDescs;
        }
        get emptyLocalUBO() {
          return this._localUBO;
        }
        constructor(context) {
          this._pipelineIAData = void 0;
          this._context = void 0;
          this._width = void 0;
          this._height = void 0;
          this._lightVolumeBuffer = void 0;
          this._lightBufferData = void 0;
          this._deferredLitsBufView = void 0;
          this._localUBO = void 0;
          this._stageDescs = new Map();
          this._context = context;
          this._width = context.width;
          this._height = context.height;
          this._pipelineIAData = this._createQuadInputAssembler();
          const vb = this._genQuadVertexData(SurfaceTransform.IDENTITY, new Rect(0, 0, context.width, context.height));
          this._pipelineIAData.quadVB.update(vb);
          this._createLightVolumes();
          const size = UBOLocalEnum.SIZE;
          this._localUBO = context.device.createBuffer(new BufferInfo(BufferUsageBit.UNIFORM | BufferUsageBit.TRANSFER_DST, MemoryUsageBit.DEVICE, size, size));
        }
        resize(width, height) {
          if (width !== this._width || height !== this._height) {
            quadRect.y = quadRect.x = 0;
            quadRect.width = width;
            quadRect.height = height;
            const vb = this._genQuadVertexData(SurfaceTransform.IDENTITY, quadRect);
            this._pipelineIAData.quadVB.update(vb);
          }
        }
        _createLightVolumes() {
          const device = this._context.root.device;
          let totalSize = Float32Array.BYTES_PER_ELEMENT * volLightAttrCount * 4 * UBODeferredLight.LIGHTS_PER_PASS;
          totalSize = Math.ceil(totalSize / device.capabilities.uboOffsetAlignment) * device.capabilities.uboOffsetAlignment;
          this._lightVolumeBuffer = device.createBuffer(new BufferInfo(BufferUsageBit.UNIFORM | BufferUsageBit.TRANSFER_DST, MemoryUsageBit.HOST | MemoryUsageBit.DEVICE, totalSize, device.capabilities.uboOffsetAlignment));
          this._deferredLitsBufView = device.createBuffer(new BufferViewInfo(this._lightVolumeBuffer, 0, totalSize));
          this._lightBufferData = new Float32Array(totalSize / Float32Array.BYTES_PER_ELEMENT);
        }
        _genQuadVertexData(surfaceTransform, renderArea) {
          const minX = renderArea.x / this._context.width;
          const maxX = (renderArea.x + renderArea.width) / this._context.width;
          let minY = renderArea.y / this._context.height;
          let maxY = (renderArea.y + renderArea.height) / this._context.height;

          // Flip the minimum maximum Y value according to the sign of the Y-axis of the screen space
          if (this._context.root.device.capabilities.screenSpaceSignY > 0) {
            [minY, maxY] = [maxY, minY];
          }
          const vbData = new Float32Array(16);
          const fillVertices = (x1, y1, u1, v1, x2, y2, u2, v2, x3, y3, u3, v3, x4, y4, u4, v4) => {
            vbData.set([x1, y1, u1, v1, x2, y2, u2, v2, x3, y3, u3, v3, x4, y4, u4, v4]);
          };
          switch (surfaceTransform) {
            case SurfaceTransform.IDENTITY:
              fillVertices(-1, -1, minX, maxY, 1, -1, maxX, maxY, -1, 1, minX, minY, 1, 1, maxX, minY);
              break;
            case SurfaceTransform.ROTATE_90:
              fillVertices(-1, -1, maxX, maxY, 1, -1, maxX, minY, -1, 1, minX, maxY, 1, 1, minX, minY);
              break;
            case SurfaceTransform.ROTATE_180:
              fillVertices(-1, -1, minX, minY, 1, -1, maxX, minY, -1, 1, minX, maxY, 1, 1, maxX, maxY);
              break;
            case SurfaceTransform.ROTATE_270:
              fillVertices(-1, -1, minX, minY, 1, -1, minX, maxY, -1, 1, maxX, minY, 1, 1, maxX, maxY);
              break;
            default:
          }
          return vbData;
        }
        _createQuadInputAssembler() {
          // create vertex buffer
          const inputAssemblerData = new PipelineInputAssemblerData();
          const vbStride = Float32Array.BYTES_PER_ELEMENT * 4;
          const vbSize = vbStride * 4;
          const device = cclegacy.director.root.device;
          const quadVB = device.createBuffer(new BufferInfo(BufferUsageBit.VERTEX | BufferUsageBit.TRANSFER_DST, MemoryUsageBit.DEVICE | MemoryUsageBit.HOST, vbSize, vbStride));
          if (!quadVB) {
            return inputAssemblerData;
          }

          // create index buffer
          const ibStride = Uint16Array.BYTES_PER_ELEMENT;
          const ibSize = ibStride * 6;
          const quadIB = device.createBuffer(new BufferInfo(BufferUsageBit.INDEX | BufferUsageBit.TRANSFER_DST, MemoryUsageBit.DEVICE, ibSize, ibStride));
          if (!quadIB) {
            return inputAssemblerData;
          }
          const indices = new Uint16Array(6);
          indices[0] = 0;
          indices[1] = 1;
          indices[2] = 2;
          indices[3] = 1;
          indices[4] = 3;
          indices[5] = 2;
          quadIB.update(indices.buffer);

          // create input assembler

          const attributes = new Array(2);
          attributes[0] = new Attribute('a_position', Format.RG32F);
          attributes[1] = new Attribute('a_texCoord', Format.RG32F);
          const quadIA = device.createInputAssembler(new InputAssemblerInfo(attributes, [quadVB], quadIB));
          inputAssemblerData.quadIB = quadIB;
          inputAssemblerData.quadVB = quadVB;
          inputAssemblerData.quadIA = quadIA;
          return inputAssemblerData;
        }
      };
      ExecutorContext = class ExecutorContext {
        constructor(pipeline, device, resourceGraph, renderGraph, layoutGraph, width, height, descriptorSet = null) {
          this.device = void 0;
          this.pipeline = void 0;
          this.commandBuffer = void 0;
          this.pipelineSceneData = void 0;
          this.resourceGraph = void 0;
          this.devicePasses = new Map();
          this.deviceTextures = new Map();
          this.deviceBuffers = new Map();
          this.layoutGraph = void 0;
          this.root = void 0;
          this.pools = void 0;
          this.culling = void 0;
          this._blit = null;
          this.lightResource = new LightResource();
          this.renderGraph = void 0;
          this.width = void 0;
          this.height = void 0;
          this.cullCamera = void 0;
          this.passDescriptorSet = void 0;
          this.profilerDescriptorSet = void 0;
          this.passShowStatistics = false;
          this.pipeline = pipeline;
          this.device = device;
          this.commandBuffer = device.commandBuffer;
          this.pipelineSceneData = pipeline.pipelineSceneData;
          this.resourceGraph = resourceGraph;
          this.renderGraph = renderGraph;
          this.root = legacyCC.director.root;
          this.layoutGraph = layoutGraph;
          this.width = width;
          this.height = height;
          this.pools = new ExecutorPools();
          this.culling = new SceneCulling();
          this.passDescriptorSet = descriptorSet;
          this.profilerDescriptorSet = getDescriptorSetDataFromLayout('default').descriptorSet;
        }
        reset() {
          this.culling.clear();
          this.pools.reset();
          this.cullCamera = null;
          this.lightResource.clear();
          this.passShowStatistics = false;
        }
        resize(width, height) {
          this.width = width;
          this.height = height;
          if (this._blit) this._blit.resize(width, height);
        }
        get blit() {
          if (!this._blit) this._blit = new BlitInfo(this);
          return this._blit;
        }
      };
      _export("Executor", Executor = class Executor {
        constructor(pipeline, device, resourceGraph, layoutGraph, width, height) {
          this._context = void 0;
          this._visitor = void 0;
          context = this._context = new ExecutorContext(pipeline, device, resourceGraph, new RenderGraph(), layoutGraph, width, height);
        }
        resize(width, height) {
          context.resize(width, height);
        }
        _removeDeviceResource() {
          const pipeline = context.pipeline;
          const resourceUses = pipeline.resourceUses;
          const deletes = [];
          const deviceTexs = context.deviceTextures;
          for (const [name, dTex] of deviceTexs) {
            const resId = context.resourceGraph.vertex(name);
            const trait = context.resourceGraph.getTraits(resId);
            if (!resourceUses.includes(name)) {
              switch (trait.residency) {
                case ResourceResidency.MANAGED:
                  deletes.push(name);
                  break;
                default:
              }
            }
          }
          for (const name of deletes) {
            deviceTexs.get(name).release();
            deviceTexs.delete(name);
          }
          const deletesBuff = [];
          const deviceBuffs = context.deviceBuffers;
          for (const [name, dBuff] of deviceBuffs) {
            const resId = context.resourceGraph.vertex(name);
            const trait = context.resourceGraph.getTraits(resId);
            if (!resourceUses.includes(name)) {
              switch (trait.residency) {
                case ResourceResidency.MANAGED:
                  deletesBuff.push(name);
                  break;
                default:
              }
            }
          }
          for (const name of deletesBuff) {
            deviceBuffs.get(name).release();
            deviceBuffs.delete(name);
          }
          resourceUses.length = 0;
        }
        execute(rg) {
          context.renderGraph = rg;
          context.reset();
          const cmdBuff = context.commandBuffer;
          const culling = context.culling;
          culling.buildRenderQueues(rg, context.layoutGraph, context.pipelineSceneData);
          context.lightResource.buildLights(culling, context.pipelineSceneData.isHDR, context.pipelineSceneData.shadows);
          this._removeDeviceResource();
          cmdBuff.begin();
          context.lightResource.buildLightBuffer(cmdBuff);
          context.lightResource.tryUpdateRenderSceneLocalDescriptorSet(context.culling);
          culling.uploadInstancing(cmdBuff);
          if (!this._visitor) this._visitor = new RenderVisitor();
          depthFirstSearch(this._visitor.graphView, this._visitor, this._visitor.colorMap);
          cmdBuff.end();
          context.device.queue.submit([cmdBuff]);
        }
        release() {
          context.devicePasses.clear();
          for (const [k, v] of context.deviceTextures) {
            v.release();
          }
          context.deviceTextures.clear();
          for (const [k, v] of context.deviceBuffers) {
            v.release();
          }
          context.deviceBuffers.clear();
        }
      });
      BaseRenderVisitor = class BaseRenderVisitor {
        constructor() {
          this.queueID = 0xFFFFFFFF;
          this.sceneID = 0xFFFFFFFF;
          this.passID = 0xFFFFFFFF;
          this.dispatchID = 0xFFFFFFFF;
          this.currPass = void 0;
          this.currQueue = void 0;
          this.rg = void 0;
          this.rg = context.renderGraph;
        }
        _isRasterPass(u) {
          return context.renderGraph.h(RenderGraphValue.RasterPass, u);
        }
        isComputePass(u) {
          return context.renderGraph.h(RenderGraphValue.Compute, u);
        }
        isDispatch(u) {
          return context.renderGraph.h(RenderGraphValue.Dispatch, u);
        }
        _isQueue(u) {
          return context.renderGraph.h(RenderGraphValue.Queue, u);
        }
        _isScene(u) {
          return context.renderGraph.h(RenderGraphValue.Scene, u);
        }
        _isBlit(u) {
          return context.renderGraph.h(RenderGraphValue.Blit, u);
        }
        applyID(id) {
          if (this._isRasterPass(id)) {
            this.passID = id;
          } else if (this._isQueue(id)) {
            this.queueID = id;
          } else if (this._isScene(id) || this._isBlit(id)) {
            this.sceneID = id;
          } else if (this.isComputePass(id)) {
            this.passID = id;
          } else if (this.isDispatch(id)) {
            this.dispatchID = id;
          }
        }
      };
      PreRenderVisitor = class PreRenderVisitor extends BaseRenderVisitor {
        constructor() {
          super();
        }
        clear(value) {
          // do nothing
        }
        viewport(value) {
          // do nothing
        }
        rasterPass(pass) {
          if (!this.rg.getValid(this.passID)) return;
          const devicePasses = context.devicePasses;
          const passHash = pass.hashValue;
          this.currPass = devicePasses.get(passHash);
          if (!this.currPass) {
            this.currPass = new DeviceRenderPass(this.passID, pass);
            devicePasses.set(passHash, this.currPass);
          } else {
            this.currPass.resetResource(this.passID, pass);
          }
          this.currPass.preRecord();
        }
        rasterSubpass(value) {
          // do nothing
        }
        computeSubpass(value) {
          // do nothing
        }
        resolve(value) {
          // do nothing
        }
        move(value) {
          // do nothing
        }
        raytrace(value) {
          // do nothing
        }
        compute(pass) {
          if (!this.rg.getValid(this.passID)) return;
          const devicePasses = context.devicePasses;
          const computeInfo = new ComputePassInfo();
          computeInfo.applyInfo(this.passID, pass);
          this.currPass = new DeviceComputePass(computeInfo);
          this.currPass.preRecord();
          this.currPass.record();
          this.currPass.postRecord();
        }
        copy(value) {
          if (value.uploadPairs.length) {
            for (const upload of value.uploadPairs) {
              const resBuffers = context.deviceBuffers;
              const resourceGraph = context.resourceGraph;
              const vertId = resourceGraph.vertex(upload.target);
              resourceVisitor.resName = upload.target;
              resourceGraph.visitVertex(resourceVisitor, vertId);
              const gfxBuffer = resBuffers.get(upload.target);
              context.device.commandBuffer.updateBuffer(gfxBuffer.buffer, upload.source, upload.source.byteLength);
            }
          }
        }
        queue(value) {
          if (!this.rg.getValid(this.queueID)) return;
          let deviceQueue;
          if (this.currPass instanceof DeviceRenderPass) {
            deviceQueue = context.pools.addDeviceQueue();
            deviceQueue.init(this.currPass, value, this.queueID);
            this.currQueue = deviceQueue;
            this.currPass.addQueue(deviceQueue);
          } else {
            deviceQueue = context.pools.addComputeQueue();
            deviceQueue.init(this.currPass, value, this.queueID);
            this.currQueue = deviceQueue;
            this.currPass.addQueue(deviceQueue);
          }
          const layoutName = this.rg.getLayout(this.queueID);
          if (layoutName) {
            const layoutGraph = context.layoutGraph;
            if (this.currPass.renderLayout) {
              const layoutId = layoutGraph.locateChild(this.currPass.renderLayout.layoutID, layoutName);
              this.currQueue.layoutID = layoutId;
            }
          }
          this.currQueue.preRecord();
        }
        scene(value) {
          if (!this.rg.getValid(this.sceneID)) return;
          const renderQueue = this.currQueue;
          const renderScene = renderQueue.setScene(this.sceneID, value);
          renderScene.preRecord();
        }
        blit(value) {
          if (!this.rg.getValid(this.sceneID)) return;
          const renderQueue = this.currQueue;
          const renderScene = renderQueue.setScene(this.sceneID, undefined, value);
          renderScene.preRecord();
        }
        dispatch(value) {
          var _value$material;
          if (!context.device.hasFeature(Feature.COMPUTE_SHADER)) return;
          let pso = null;
          const devicePass = this.currPass;
          const pass = (_value$material = value.material) == null ? void 0 : _value$material.passes[value.passID];
          pass == null || pass.update();
          const shader = pass == null ? void 0 : pass.getShaderVariant();
          if (pass && shader) {
            pso = PipelineStateManager.getOrCreateComputePipelineState(deviceManager.gfxDevice, pass, shader);
          }
          const cmdBuff = context.commandBuffer;
          if (pso && pass) {
            cmdBuff.bindPipelineState(pso);
            const layoutStage = devicePass.renderLayout;
            const layoutDesc = layoutStage.descriptorSet;
            cmdBuff.bindDescriptorSet(SetIndex.GLOBAL, layoutDesc);
            cmdBuff.bindDescriptorSet(SetIndex.MATERIAL, pass.descriptorSet);
          }
          const gx = value.threadGroupCountX;
          const gy = value.threadGroupCountY;
          const gz = value.threadGroupCountZ;
          cmdBuff.dispatch(new DispatchInfo(gx, gy, gz));
        }
      };
      PostRenderVisitor = class PostRenderVisitor extends BaseRenderVisitor {
        constructor() {
          super();
        }
        clear(value) {
          // do nothing
        }
        viewport(value) {
          // do nothing
        }
        rasterPass(pass) {
          const devicePasses = context.devicePasses;
          const passHash = pass.hashValue;
          const currPass = devicePasses.get(passHash);
          if (!currPass) return;
          this.currPass = currPass;
          context.passShowStatistics = pass.showStatistics;
          this.currPass.record();
          this.currPass.postRecord();
        }
        rasterSubpass(value) {
          // do nothing
        }
        computeSubpass(value) {
          // do nothing
        }
        compute(value) {
          if (!context.device.hasFeature(Feature.COMPUTE_SHADER)) return;
          const cmdBuff = context.commandBuffer;
          cmdBuff.submitComputePass();
        }
        resolve(value) {
          // do nothing
        }
        copy(value) {
          // do nothing
        }
        move(value) {
          // do nothing
        }
        raytrace(value) {
          // do nothing
        }
        queue(value) {
          // collect scene results
        }
        scene(value) {
          // scene command list finished
        }
        blit(value) {
          // do nothing
        }
        dispatch(value) {
          // do nothing
        }
      };
      _export("RenderVisitor", RenderVisitor = class RenderVisitor extends DefaultVisitor {
        constructor() {
          super();
          this._preVisitor = void 0;
          this._postVisitor = void 0;
          this._graphView = void 0;
          this._colorMap = void 0;
          this._preVisitor = new PreRenderVisitor();
          this._postVisitor = new PostRenderVisitor();
          this._graphView = new ReferenceGraphView(context.renderGraph);
          this._colorMap = new VectorGraphColorMap(context.renderGraph.nv());
        }
        get graphView() {
          return this._graphView;
        }
        get colorMap() {
          return this._colorMap;
        }
        discoverVertex(u, gv) {
          const g = gv.g;
          this._preVisitor.applyID(u);
          g.visitVertex(this._preVisitor, u);
        }
        finishVertex(v, gv) {
          const g = gv.g;
          g.visitVertex(this._postVisitor, v);
        }
      });
    }
  };
});