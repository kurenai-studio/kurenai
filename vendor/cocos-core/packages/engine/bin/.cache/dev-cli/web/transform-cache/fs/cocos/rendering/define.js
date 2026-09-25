System.register("q-bundled:///fs/cocos/rendering/define.js", ["../scene-graph/layers.js", "../core/index.js", "../gfx/index.js"], function (_export, _context) {
  "use strict";

  var Layers, cclegacy, RecyclePool, BindingMappingInfo, DescriptorType, Type, ShaderStageFlagBit, DescriptorSetLayoutBinding, Uniform, UniformBlock, UniformSamplerTexture, FormatFeatureBit, Format, API, TextureInfo, TextureType, TextureUsageBit, TextureFlagBit, SampleCount, MemoryAccessBit, ViewDimension, UBOGlobal, UBOCamera, UBOShadow, UBOCSM, UBOLocal, UBOWorldBound, UBOLocalBatched, UBOForwardLight, UBODeferredLight, UBOSkinningTexture, UBOSkinningAnimation, UBOSkinning, UBOMorph, UBOUILocal, UBOSH, _UBOGlobal, _UBOCamera, _UBOShadow, _UBOCSM, _UBOLocal, _UBOWorldBound, _UBOLocalBatched, _UBOForwardLight, _UBOSkinningTexture, _UBOSkinningAnimation, _UBOSkinning, _UBOMorph, _UBOUILocal, _UBOSH, PIPELINE_FLOW_MAIN, PIPELINE_FLOW_FORWARD, PIPELINE_FLOW_SHADOW, PIPELINE_FLOW_SMAA, PIPELINE_FLOW_TONEMAP, RenderPassStage, RenderPriority, globalDescriptorSetLayout, localDescriptorSetLayout, PipelineGlobalBindings, GLOBAL_UBO_COUNT, GLOBAL_SAMPLER_COUNT, ModelLocalBindings, LOCAL_UBO_COUNT, LOCAL_SAMPLER_COUNT, LOCAL_STORAGE_IMAGE_COUNT, SetIndex, bindingMappingInfo, UBOGlobalEnum, UBOCameraEnum, UBOShadowEnum, UBOCSMEnum, UNIFORM_SHADOWMAP_NAME, UNIFORM_SHADOWMAP_BINDING, UNIFORM_SHADOWMAP_DESCRIPTOR, UNIFORM_SHADOWMAP_LAYOUT, UNIFORM_ENVIRONMENT_NAME, UNIFORM_ENVIRONMENT_BINDING, UNIFORM_ENVIRONMENT_DESCRIPTOR, UNIFORM_ENVIRONMENT_LAYOUT, UNIFORM_DIFFUSEMAP_NAME, UNIFORM_DIFFUSEMAP_BINDING, UNIFORM_DIFFUSEMAP_DESCRIPTOR, UNIFORM_DIFFUSEMAP_LAYOUT, UNIFORM_SPOT_SHADOW_MAP_TEXTURE_NAME, UNIFORM_SPOT_SHADOW_MAP_TEXTURE_BINDING, UNIFORM_SPOT_SHADOW_MAP_TEXTURE_DESCRIPTOR, UNIFORM_SPOT_SHADOW_MAP_TEXTURE_LAYOUT, UBOLocalEnum, INST_MAT_WORLD, INST_SH, UBOForwardLightEnum, JOINT_UNIFORM_CAPACITY, INST_JOINT_ANIM_INFO, UBOMorphEnum, UBOSHEnum, UNIFORM_JOINT_TEXTURE_NAME, UNIFORM_JOINT_TEXTURE_BINDING, UNIFORM_JOINT_TEXTURE_DESCRIPTOR, UNIFORM_JOINT_TEXTURE_LAYOUT, UNIFORM_REALTIME_JOINT_TEXTURE_NAME, UNIFORM_REALTIME_JOINT_TEXTURE_BINDING, UNIFORM_REALTIME_JOINT_TEXTURE_DESCRIPTOR, UNIFORM_REALTIME_JOINT_TEXTURE_LAYOUT, UNIFORM_POSITION_MORPH_TEXTURE_NAME, UNIFORM_POSITION_MORPH_TEXTURE_BINDING, UNIFORM_POSITION_MORPH_TEXTURE_DESCRIPTOR, UNIFORM_POSITION_MORPH_TEXTURE_LAYOUT, UNIFORM_NORMAL_MORPH_TEXTURE_NAME, UNIFORM_NORMAL_MORPH_TEXTURE_BINDING, UNIFORM_NORMAL_MORPH_TEXTURE_DESCRIPTOR, UNIFORM_NORMAL_MORPH_TEXTURE_LAYOUT, UNIFORM_TANGENT_MORPH_TEXTURE_NAME, UNIFORM_TANGENT_MORPH_TEXTURE_BINDING, UNIFORM_TANGENT_MORPH_TEXTURE_DESCRIPTOR, UNIFORM_TANGENT_MORPH_TEXTURE_LAYOUT, UNIFORM_LIGHTMAP_TEXTURE_NAME, UNIFORM_LIGHTMAP_TEXTURE_BINDING, UNIFORM_LIGHTMAP_TEXTURE_DESCRIPTOR, UNIFORM_LIGHTMAP_TEXTURE_LAYOUT, UNIFORM_SPRITE_TEXTURE_NAME, UNIFORM_SPRITE_TEXTURE_BINDING, UNIFORM_SPRITE_TEXTURE_DESCRIPTOR, UNIFORM_SPRITE_TEXTURE_LAYOUT, UNIFORM_REFLECTION_PROBE_CUBEMAP_NAME, UNIFORM_REFLECTION_PROBE_CUBEMAP_BINDING, UNIFORM_REFLECTION_PROBE_CUBEMAP_DESCRIPTOR, UNIFORM_REFLECTION_PROBE_CUBEMAP_LAYOUT, UNIFORM_REFLECTION_PROBE_TEXTURE_NAME, UNIFORM_REFLECTION_PROBE_TEXTURE_BINDING, UNIFORM_REFLECTION_PROBE_TEXTURE_DESCRIPTOR, UNIFORM_REFLECTION_PROBE_TEXTURE_LAYOUT, UNIFORM_REFLECTION_PROBE_DATA_MAP_NAME, UNIFORM_REFLECTION_PROBE_DATA_MAP_BINDING, UNIFORM_REFLECTION_PROBE_DATA_MAP_DESCRIPTOR, UNIFORM_REFLECTION_PROBE_DATA_MAP_LAYOUT, UNIFORM_REFLECTION_PROBE_BLEND_CUBEMAP_NAME, UNIFORM_REFLECTION_PROBE_BLEND_CUBEMAP_BINDING, UNIFORM_REFLECTION_PROBE_BLEND_CUBEMAP_DESCRIPTOR, UNIFORM_REFLECTION_PROBE_BLEND_CUBEMAP_LAYOUT, ENABLE_PROBE_BLEND, CAMERA_DEFAULT_MASK, CAMERA_EDITOR_MASK, MODEL_ALWAYS_MASK, dftShadowTexture;
  /**
   * @internal This method only used to init localDescriptorSetLayout.layouts[UBOSkinning.NAME]
   * @engineInternal
  */
  function localDescriptorSetLayout_ResizeMaxJoints(maxCount) {
    UBOSkinning.initLayout(maxCount);
    localDescriptorSetLayout.layouts[UBOSkinning.NAME] = UBOSkinning.LAYOUT;
    localDescriptorSetLayout.bindings[UBOSkinning.BINDING] = UBOSkinning.DESCRIPTOR;
  }
  /**
   * @en Does the device support single-channeled half float texture? (for both color attachment and sampling)
   * @zh 当前设备是否支持单通道半浮点贴图？（颜色输出和采样）
   */
  function supportsR16HalfFloatTexture(device) {
    return (device.getFormatFeatures(Format.R16F) & (FormatFeatureBit.RENDER_TARGET | FormatFeatureBit.SAMPLED_TEXTURE)) === (FormatFeatureBit.RENDER_TARGET | FormatFeatureBit.SAMPLED_TEXTURE);
  }
  function getDefaultShadowTexture(device) {
    if (dftShadowTexture) return dftShadowTexture;
    const texInfo = new TextureInfo(TextureType.TEX2D, TextureUsageBit.NONE, supportsR32FloatTexture(device) ? Format.R32F : Format.RGBA8, 16, 16, TextureFlagBit.NONE, 1, 1, SampleCount.X1, 1);
    dftShadowTexture = device.createTexture(texInfo);
    return dftShadowTexture;
  }

  /**
   * @en Does the device support single-channeled float texture? (for both color attachment and sampling)
   * @zh 当前设备是否支持单通道浮点贴图？（颜色输出和采样）
   */
  function supportsR32FloatTexture(device) {
    return (device.getFormatFeatures(Format.R32F) & (FormatFeatureBit.RENDER_TARGET | FormatFeatureBit.SAMPLED_TEXTURE)) === (FormatFeatureBit.RENDER_TARGET | FormatFeatureBit.SAMPLED_TEXTURE) && !(device.gfxAPI === API.WEBGL); // wegl 1  Single-channel float type is not supported under webgl1, so it is excluded
  }

  /**
   * @en Does the device support 4-channeled float texture? (for both color attachment and sampling)
   * @zh 当前设备是否支持4通道浮点贴图？（颜色输出和采样）
   */
  function supportsRGBA16HalfFloatTexture(device) {
    // WebGL: https://developer.mozilla.org/en-US/docs/Web/API/OES_texture_half_float#browser_compatibility
    // GLES2: https://registry.khronos.org/OpenGL/extensions/OES/OES_texture_float.txt
    return (device.getFormatFeatures(Format.RGBA16F) & (FormatFeatureBit.RENDER_TARGET | FormatFeatureBit.SAMPLED_TEXTURE)) === (FormatFeatureBit.RENDER_TARGET | FormatFeatureBit.SAMPLED_TEXTURE);
  }

  /**
   * @en Does the device support 4-channeled float texture? (for both color attachment and sampling)
   * @zh 当前设备是否支持4通道浮点贴图？（颜色输出和采样）
   */
  function supportsRGBA32FloatTexture(device) {
    // WebGL: https://developer.mozilla.org/en-US/docs/Web/API/OES_texture_float#browser_compatibility
    // GLES2: https://registry.khronos.org/OpenGL/extensions/OES/OES_texture_float.txt
    return (device.getFormatFeatures(Format.RGBA32F) & (FormatFeatureBit.RENDER_TARGET | FormatFeatureBit.SAMPLED_TEXTURE)) === (FormatFeatureBit.RENDER_TARGET | FormatFeatureBit.SAMPLED_TEXTURE);
  }
  function isEnableEffect() {
    return !!(cclegacy.rendering && cclegacy.rendering.enableEffectImport);
  }

  /* eslint-enable max-len */

  function getPassPool() {
    return new RecyclePool(() => ({
      priority: 0,
      hash: 0,
      depth: 0,
      shaderId: 0,
      subModel: null,
      passIdx: 0
    }), 64);
  }
  _export({
    UBOGlobal: void 0,
    UBOCamera: void 0,
    UBOShadow: void 0,
    UBOCSM: void 0,
    UBOLocal: void 0,
    UBOWorldBound: void 0,
    UBOLocalBatched: void 0,
    UBOForwardLight: void 0,
    UBODeferredLight: void 0,
    UBOSkinningTexture: void 0,
    UBOSkinningAnimation: void 0,
    UBOSkinning: void 0,
    localDescriptorSetLayout_ResizeMaxJoints: localDescriptorSetLayout_ResizeMaxJoints,
    UBOMorph: void 0,
    UBOUILocal: void 0,
    UBOSH: void 0,
    supportsR16HalfFloatTexture: supportsR16HalfFloatTexture,
    getDefaultShadowTexture: getDefaultShadowTexture,
    supportsR32FloatTexture: supportsR32FloatTexture,
    supportsRGBA16HalfFloatTexture: supportsRGBA16HalfFloatTexture,
    supportsRGBA32FloatTexture: supportsRGBA32FloatTexture,
    isEnableEffect: isEnableEffect,
    getPassPool: getPassPool
  });
  return {
    setters: [function (_sceneGraphLayersJs) {
      Layers = _sceneGraphLayersJs.Layers;
    }, function (_coreIndexJs) {
      cclegacy = _coreIndexJs.cclegacy;
      RecyclePool = _coreIndexJs.RecyclePool;
    }, function (_gfxIndexJs) {
      BindingMappingInfo = _gfxIndexJs.BindingMappingInfo;
      DescriptorType = _gfxIndexJs.DescriptorType;
      Type = _gfxIndexJs.Type;
      ShaderStageFlagBit = _gfxIndexJs.ShaderStageFlagBit;
      DescriptorSetLayoutBinding = _gfxIndexJs.DescriptorSetLayoutBinding;
      Uniform = _gfxIndexJs.Uniform;
      UniformBlock = _gfxIndexJs.UniformBlock;
      UniformSamplerTexture = _gfxIndexJs.UniformSamplerTexture;
      FormatFeatureBit = _gfxIndexJs.FormatFeatureBit;
      Format = _gfxIndexJs.Format;
      API = _gfxIndexJs.API;
      TextureInfo = _gfxIndexJs.TextureInfo;
      TextureType = _gfxIndexJs.TextureType;
      TextureUsageBit = _gfxIndexJs.TextureUsageBit;
      TextureFlagBit = _gfxIndexJs.TextureFlagBit;
      SampleCount = _gfxIndexJs.SampleCount;
      MemoryAccessBit = _gfxIndexJs.MemoryAccessBit;
      ViewDimension = _gfxIndexJs.ViewDimension;
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
      _export("PIPELINE_FLOW_MAIN", PIPELINE_FLOW_MAIN = 'MainFlow');
      _export("PIPELINE_FLOW_FORWARD", PIPELINE_FLOW_FORWARD = 'ForwardFlow');
      _export("PIPELINE_FLOW_SHADOW", PIPELINE_FLOW_SHADOW = 'ShadowFlow');
      _export("PIPELINE_FLOW_SMAA", PIPELINE_FLOW_SMAA = 'SMAAFlow');
      _export("PIPELINE_FLOW_TONEMAP", PIPELINE_FLOW_TONEMAP = 'ToneMapFlow');
      /**
       * @en The predefined render pass stage ids
       * @zh 预设的渲染阶段。
       */
      _export("RenderPassStage", RenderPassStage = /*#__PURE__*/function (RenderPassStage) {
        RenderPassStage[RenderPassStage["DEFAULT"] = 100] = "DEFAULT";
        RenderPassStage[RenderPassStage["UI"] = 200] = "UI";
        return RenderPassStage;
      }({}));
      cclegacy.RenderPassStage = RenderPassStage;

      /**
       * @en The predefined render priorities
       * @zh 预设的渲染优先级。
       */
      _export("RenderPriority", RenderPriority = /*#__PURE__*/function (RenderPriority) {
        RenderPriority[RenderPriority["MIN"] = 0] = "MIN";
        RenderPriority[RenderPriority["MAX"] = 255] = "MAX";
        RenderPriority[RenderPriority["DEFAULT"] = 128] = "DEFAULT";
        return RenderPriority;
      }({}));
      /**
       * @en Render object interface
       * @zh 渲染对象接口。
       */
      /*
       * @en The render pass interface
       * @zh 渲染过程接口。
       */
      /**
       * @en Render batch interface
       * @zh 渲染批次接口。
       */
      /**
       * @en Render queue descriptor
       * @zh 渲染队列描述。
       */
      _export("globalDescriptorSetLayout", globalDescriptorSetLayout = {
        bindings: [],
        layouts: {}
      });
      _export("localDescriptorSetLayout", localDescriptorSetLayout = {
        bindings: [],
        layouts: {}
      });
      /**
       * @en The uniform bindings
       * @zh Uniform 参数绑定。
       */
      _export("PipelineGlobalBindings", PipelineGlobalBindings = /*#__PURE__*/function (PipelineGlobalBindings) {
        PipelineGlobalBindings[PipelineGlobalBindings["UBO_GLOBAL"] = 0] = "UBO_GLOBAL";
        PipelineGlobalBindings[PipelineGlobalBindings["UBO_CAMERA"] = 1] = "UBO_CAMERA";
        PipelineGlobalBindings[PipelineGlobalBindings["UBO_SHADOW"] = 2] = "UBO_SHADOW";
        PipelineGlobalBindings[PipelineGlobalBindings["UBO_CSM"] = 3] = "UBO_CSM";
        // should reserve slot for this optional ubo
        PipelineGlobalBindings[PipelineGlobalBindings["SAMPLER_SHADOWMAP"] = 4] = "SAMPLER_SHADOWMAP";
        PipelineGlobalBindings[PipelineGlobalBindings["SAMPLER_ENVIRONMENT"] = 5] = "SAMPLER_ENVIRONMENT";
        // don't put this as the first sampler binding due to Mac GL driver issues: cubemap at texture unit 0 causes rendering issues
        PipelineGlobalBindings[PipelineGlobalBindings["SAMPLER_SPOT_SHADOW_MAP"] = 6] = "SAMPLER_SPOT_SHADOW_MAP";
        PipelineGlobalBindings[PipelineGlobalBindings["SAMPLER_DIFFUSEMAP"] = 7] = "SAMPLER_DIFFUSEMAP";
        PipelineGlobalBindings[PipelineGlobalBindings["COUNT"] = 8] = "COUNT";
        return PipelineGlobalBindings;
      }({}));
      GLOBAL_UBO_COUNT = PipelineGlobalBindings.SAMPLER_SHADOWMAP;
      GLOBAL_SAMPLER_COUNT = PipelineGlobalBindings.COUNT - GLOBAL_UBO_COUNT;
      _export("ModelLocalBindings", ModelLocalBindings = /*#__PURE__*/function (ModelLocalBindings) {
        ModelLocalBindings[ModelLocalBindings["UBO_LOCAL"] = 0] = "UBO_LOCAL";
        ModelLocalBindings[ModelLocalBindings["UBO_FORWARD_LIGHTS"] = 1] = "UBO_FORWARD_LIGHTS";
        ModelLocalBindings[ModelLocalBindings["UBO_SKINNING_ANIMATION"] = 2] = "UBO_SKINNING_ANIMATION";
        ModelLocalBindings[ModelLocalBindings["UBO_SKINNING_TEXTURE"] = 3] = "UBO_SKINNING_TEXTURE";
        ModelLocalBindings[ModelLocalBindings["UBO_MORPH"] = 4] = "UBO_MORPH";
        ModelLocalBindings[ModelLocalBindings["UBO_UI_LOCAL"] = 5] = "UBO_UI_LOCAL";
        ModelLocalBindings[ModelLocalBindings["UBO_SH"] = 6] = "UBO_SH";
        ModelLocalBindings[ModelLocalBindings["SAMPLER_JOINTS"] = 7] = "SAMPLER_JOINTS";
        ModelLocalBindings[ModelLocalBindings["SAMPLER_MORPH_POSITION"] = 8] = "SAMPLER_MORPH_POSITION";
        ModelLocalBindings[ModelLocalBindings["SAMPLER_MORPH_NORMAL"] = 9] = "SAMPLER_MORPH_NORMAL";
        ModelLocalBindings[ModelLocalBindings["SAMPLER_MORPH_TANGENT"] = 10] = "SAMPLER_MORPH_TANGENT";
        ModelLocalBindings[ModelLocalBindings["SAMPLER_LIGHTMAP"] = 11] = "SAMPLER_LIGHTMAP";
        ModelLocalBindings[ModelLocalBindings["SAMPLER_SPRITE"] = 12] = "SAMPLER_SPRITE";
        ModelLocalBindings[ModelLocalBindings["SAMPLER_REFLECTION_PROBE_CUBE"] = 13] = "SAMPLER_REFLECTION_PROBE_CUBE";
        ModelLocalBindings[ModelLocalBindings["SAMPLER_REFLECTION_PROBE_PLANAR"] = 14] = "SAMPLER_REFLECTION_PROBE_PLANAR";
        ModelLocalBindings[ModelLocalBindings["SAMPLER_REFLECTION_PROBE_DATA_MAP"] = 15] = "SAMPLER_REFLECTION_PROBE_DATA_MAP";
        // SAMPLER_REFLECTION_PROBE_BLEND_CUBE, // Disable for WebGPU
        ModelLocalBindings[ModelLocalBindings["COUNT"] = 16] = "COUNT";
        return ModelLocalBindings;
      }({}));
      LOCAL_UBO_COUNT = ModelLocalBindings.SAMPLER_JOINTS;
      LOCAL_SAMPLER_COUNT = ModelLocalBindings.COUNT - LOCAL_UBO_COUNT;
      LOCAL_STORAGE_IMAGE_COUNT = ModelLocalBindings.COUNT - LOCAL_UBO_COUNT - LOCAL_SAMPLER_COUNT;
      _export("SetIndex", SetIndex = /*#__PURE__*/function (SetIndex) {
        SetIndex[SetIndex["GLOBAL"] = 0] = "GLOBAL";
        SetIndex[SetIndex["MATERIAL"] = 1] = "MATERIAL";
        SetIndex[SetIndex["LOCAL"] = 2] = "LOCAL";
        SetIndex[SetIndex["COUNT"] = 3] = "COUNT";
        return SetIndex;
      }({})); // parameters passed to GFX Device
      _export("bindingMappingInfo", bindingMappingInfo = new BindingMappingInfo([GLOBAL_UBO_COUNT, 0, LOCAL_UBO_COUNT, 0],
      // Uniform Buffer Counts
      [GLOBAL_SAMPLER_COUNT, 0, LOCAL_SAMPLER_COUNT, 0],
      // Combined Sampler Texture Counts
      [0, 0, 0, 0],
      // Sampler Counts
      [0, 0, 0, 0],
      // Texture Counts
      [0, 0, 0, 0],
      // Storage Buffer Counts
      [0, 0, LOCAL_STORAGE_IMAGE_COUNT, 0],
      // Storage Image Counts
      [0, 0, 0, 0],
      // Subpass Input Counts
      [0, 2, 1, 3]) // Set Order Indices
      );
      _export("UBOGlobalEnum", UBOGlobalEnum = /*#__PURE__*/function (UBOGlobalEnum) {
        UBOGlobalEnum[UBOGlobalEnum["TIME_OFFSET"] = 0] = "TIME_OFFSET";
        UBOGlobalEnum[UBOGlobalEnum["SCREEN_SIZE_OFFSET"] = 4] = "SCREEN_SIZE_OFFSET";
        UBOGlobalEnum[UBOGlobalEnum["NATIVE_SIZE_OFFSET"] = 8] = "NATIVE_SIZE_OFFSET";
        UBOGlobalEnum[UBOGlobalEnum["PROBE_INFO_OFFSET"] = 12] = "PROBE_INFO_OFFSET";
        UBOGlobalEnum[UBOGlobalEnum["DEBUG_VIEW_MODE_OFFSET"] = 16] = "DEBUG_VIEW_MODE_OFFSET";
        UBOGlobalEnum[UBOGlobalEnum["COUNT"] = 20] = "COUNT";
        UBOGlobalEnum[UBOGlobalEnum["SIZE"] = 80] = "SIZE";
        return UBOGlobalEnum;
      }({}));
      /**
       * @en The global uniform buffer object
       * @zh 全局 UBO。
       */
      _export("UBOGlobal", UBOGlobal = class UBOGlobal {});
      _UBOGlobal = UBOGlobal;
      UBOGlobal.TIME_OFFSET = UBOGlobalEnum.TIME_OFFSET;
      UBOGlobal.SCREEN_SIZE_OFFSET = UBOGlobalEnum.SCREEN_SIZE_OFFSET;
      UBOGlobal.NATIVE_SIZE_OFFSET = UBOGlobalEnum.NATIVE_SIZE_OFFSET;
      UBOGlobal.PROBE_INFO_OFFSET = UBOGlobalEnum.PROBE_INFO_OFFSET;
      UBOGlobal.DEBUG_VIEW_MODE_OFFSET = UBOGlobalEnum.DEBUG_VIEW_MODE_OFFSET;
      UBOGlobal.COUNT = UBOGlobalEnum.COUNT;
      UBOGlobal.SIZE = UBOGlobalEnum.SIZE;
      UBOGlobal.NAME = 'CCGlobal';
      UBOGlobal.BINDING = PipelineGlobalBindings.UBO_GLOBAL;
      UBOGlobal.DESCRIPTOR = new DescriptorSetLayoutBinding(_UBOGlobal.BINDING, DescriptorType.UNIFORM_BUFFER, 1, ShaderStageFlagBit.ALL);
      UBOGlobal.LAYOUT = new UniformBlock(SetIndex.GLOBAL, _UBOGlobal.BINDING, _UBOGlobal.NAME, [new Uniform('cc_time', Type.FLOAT4, 1), new Uniform('cc_screenSize', Type.FLOAT4, 1), new Uniform('cc_nativeSize', Type.FLOAT4, 1), new Uniform('cc_probeInfo', Type.FLOAT4, 1), new Uniform('cc_debug_view_mode', Type.FLOAT4, 1)], 1);
      globalDescriptorSetLayout.layouts[UBOGlobal.NAME] = UBOGlobal.LAYOUT;
      globalDescriptorSetLayout.bindings[UBOGlobal.BINDING] = UBOGlobal.DESCRIPTOR;
      _export("UBOCameraEnum", UBOCameraEnum = /*#__PURE__*/function (UBOCameraEnum) {
        UBOCameraEnum[UBOCameraEnum["MAT_VIEW_OFFSET"] = 0] = "MAT_VIEW_OFFSET";
        UBOCameraEnum[UBOCameraEnum["MAT_VIEW_INV_OFFSET"] = 16] = "MAT_VIEW_INV_OFFSET";
        UBOCameraEnum[UBOCameraEnum["MAT_PROJ_OFFSET"] = 32] = "MAT_PROJ_OFFSET";
        UBOCameraEnum[UBOCameraEnum["MAT_PROJ_INV_OFFSET"] = 48] = "MAT_PROJ_INV_OFFSET";
        UBOCameraEnum[UBOCameraEnum["MAT_VIEW_PROJ_OFFSET"] = 64] = "MAT_VIEW_PROJ_OFFSET";
        UBOCameraEnum[UBOCameraEnum["MAT_VIEW_PROJ_INV_OFFSET"] = 80] = "MAT_VIEW_PROJ_INV_OFFSET";
        UBOCameraEnum[UBOCameraEnum["CAMERA_POS_OFFSET"] = 96] = "CAMERA_POS_OFFSET";
        UBOCameraEnum[UBOCameraEnum["SURFACE_TRANSFORM_OFFSET"] = 100] = "SURFACE_TRANSFORM_OFFSET";
        UBOCameraEnum[UBOCameraEnum["SCREEN_SCALE_OFFSET"] = 104] = "SCREEN_SCALE_OFFSET";
        UBOCameraEnum[UBOCameraEnum["EXPOSURE_OFFSET"] = 108] = "EXPOSURE_OFFSET";
        UBOCameraEnum[UBOCameraEnum["MAIN_LIT_DIR_OFFSET"] = 112] = "MAIN_LIT_DIR_OFFSET";
        UBOCameraEnum[UBOCameraEnum["MAIN_LIT_COLOR_OFFSET"] = 116] = "MAIN_LIT_COLOR_OFFSET";
        UBOCameraEnum[UBOCameraEnum["AMBIENT_SKY_OFFSET"] = 120] = "AMBIENT_SKY_OFFSET";
        UBOCameraEnum[UBOCameraEnum["AMBIENT_GROUND_OFFSET"] = 124] = "AMBIENT_GROUND_OFFSET";
        UBOCameraEnum[UBOCameraEnum["GLOBAL_FOG_COLOR_OFFSET"] = 128] = "GLOBAL_FOG_COLOR_OFFSET";
        UBOCameraEnum[UBOCameraEnum["GLOBAL_FOG_BASE_OFFSET"] = 132] = "GLOBAL_FOG_BASE_OFFSET";
        UBOCameraEnum[UBOCameraEnum["GLOBAL_FOG_ADD_OFFSET"] = 136] = "GLOBAL_FOG_ADD_OFFSET";
        UBOCameraEnum[UBOCameraEnum["NEAR_FAR_OFFSET"] = 140] = "NEAR_FAR_OFFSET";
        UBOCameraEnum[UBOCameraEnum["VIEW_PORT_OFFSET"] = 144] = "VIEW_PORT_OFFSET";
        UBOCameraEnum[UBOCameraEnum["COUNT"] = 148] = "COUNT";
        UBOCameraEnum[UBOCameraEnum["SIZE"] = 592] = "SIZE";
        return UBOCameraEnum;
      }({}));
      /**
       * @en The global camera uniform buffer object
       * @zh 全局相机 UBO。
       */
      _export("UBOCamera", UBOCamera = class UBOCamera {});
      _UBOCamera = UBOCamera;
      UBOCamera.MAT_VIEW_OFFSET = UBOCameraEnum.MAT_VIEW_OFFSET;
      UBOCamera.MAT_VIEW_INV_OFFSET = UBOCameraEnum.MAT_VIEW_INV_OFFSET;
      UBOCamera.MAT_PROJ_OFFSET = UBOCameraEnum.MAT_PROJ_OFFSET;
      UBOCamera.MAT_PROJ_INV_OFFSET = UBOCameraEnum.MAT_PROJ_INV_OFFSET;
      UBOCamera.MAT_VIEW_PROJ_OFFSET = UBOCameraEnum.MAT_VIEW_PROJ_OFFSET;
      UBOCamera.MAT_VIEW_PROJ_INV_OFFSET = UBOCameraEnum.MAT_VIEW_PROJ_INV_OFFSET;
      UBOCamera.CAMERA_POS_OFFSET = UBOCameraEnum.CAMERA_POS_OFFSET;
      UBOCamera.SURFACE_TRANSFORM_OFFSET = UBOCameraEnum.SURFACE_TRANSFORM_OFFSET;
      UBOCamera.SCREEN_SCALE_OFFSET = UBOCameraEnum.SCREEN_SCALE_OFFSET;
      UBOCamera.EXPOSURE_OFFSET = UBOCameraEnum.EXPOSURE_OFFSET;
      UBOCamera.MAIN_LIT_DIR_OFFSET = UBOCameraEnum.MAIN_LIT_DIR_OFFSET;
      UBOCamera.MAIN_LIT_COLOR_OFFSET = UBOCameraEnum.MAIN_LIT_COLOR_OFFSET;
      UBOCamera.AMBIENT_SKY_OFFSET = UBOCameraEnum.AMBIENT_SKY_OFFSET;
      UBOCamera.AMBIENT_GROUND_OFFSET = UBOCameraEnum.AMBIENT_GROUND_OFFSET;
      UBOCamera.GLOBAL_FOG_COLOR_OFFSET = UBOCameraEnum.GLOBAL_FOG_COLOR_OFFSET;
      UBOCamera.GLOBAL_FOG_BASE_OFFSET = UBOCameraEnum.GLOBAL_FOG_BASE_OFFSET;
      UBOCamera.GLOBAL_FOG_ADD_OFFSET = UBOCameraEnum.GLOBAL_FOG_ADD_OFFSET;
      UBOCamera.NEAR_FAR_OFFSET = UBOCameraEnum.NEAR_FAR_OFFSET;
      UBOCamera.VIEW_PORT_OFFSET = UBOCameraEnum.VIEW_PORT_OFFSET;
      UBOCamera.COUNT = UBOCameraEnum.COUNT;
      UBOCamera.SIZE = UBOCameraEnum.SIZE;
      UBOCamera.NAME = 'CCCamera';
      UBOCamera.BINDING = PipelineGlobalBindings.UBO_CAMERA;
      UBOCamera.DESCRIPTOR = new DescriptorSetLayoutBinding(_UBOCamera.BINDING, DescriptorType.UNIFORM_BUFFER, 1, ShaderStageFlagBit.ALL);
      UBOCamera.LAYOUT = new UniformBlock(SetIndex.GLOBAL, _UBOCamera.BINDING, _UBOCamera.NAME, [new Uniform('cc_matView', Type.MAT4, 1), new Uniform('cc_matViewInv', Type.MAT4, 1), new Uniform('cc_matProj', Type.MAT4, 1), new Uniform('cc_matProjInv', Type.MAT4, 1), new Uniform('cc_matViewProj', Type.MAT4, 1), new Uniform('cc_matViewProjInv', Type.MAT4, 1), new Uniform('cc_cameraPos', Type.FLOAT4, 1), new Uniform('cc_surfaceTransform', Type.FLOAT4, 1), new Uniform('cc_screenScale', Type.FLOAT4, 1), new Uniform('cc_exposure', Type.FLOAT4, 1), new Uniform('cc_mainLitDir', Type.FLOAT4, 1), new Uniform('cc_mainLitColor', Type.FLOAT4, 1), new Uniform('cc_ambientSky', Type.FLOAT4, 1), new Uniform('cc_ambientGround', Type.FLOAT4, 1), new Uniform('cc_fogColor', Type.FLOAT4, 1), new Uniform('cc_fogBase', Type.FLOAT4, 1), new Uniform('cc_fogAdd', Type.FLOAT4, 1), new Uniform('cc_nearFar', Type.FLOAT4, 1), new Uniform('cc_viewPort', Type.FLOAT4, 1)], 1);
      globalDescriptorSetLayout.layouts[UBOCamera.NAME] = UBOCamera.LAYOUT;
      globalDescriptorSetLayout.bindings[UBOCamera.BINDING] = UBOCamera.DESCRIPTOR;
      _export("UBOShadowEnum", UBOShadowEnum = /*#__PURE__*/function (UBOShadowEnum) {
        UBOShadowEnum[UBOShadowEnum["MAT_LIGHT_VIEW_OFFSET"] = 0] = "MAT_LIGHT_VIEW_OFFSET";
        UBOShadowEnum[UBOShadowEnum["MAT_LIGHT_VIEW_PROJ_OFFSET"] = 16] = "MAT_LIGHT_VIEW_PROJ_OFFSET";
        UBOShadowEnum[UBOShadowEnum["SHADOW_INV_PROJ_DEPTH_INFO_OFFSET"] = 32] = "SHADOW_INV_PROJ_DEPTH_INFO_OFFSET";
        UBOShadowEnum[UBOShadowEnum["SHADOW_PROJ_DEPTH_INFO_OFFSET"] = 36] = "SHADOW_PROJ_DEPTH_INFO_OFFSET";
        UBOShadowEnum[UBOShadowEnum["SHADOW_PROJ_INFO_OFFSET"] = 40] = "SHADOW_PROJ_INFO_OFFSET";
        UBOShadowEnum[UBOShadowEnum["SHADOW_NEAR_FAR_LINEAR_SATURATION_INFO_OFFSET"] = 44] = "SHADOW_NEAR_FAR_LINEAR_SATURATION_INFO_OFFSET";
        UBOShadowEnum[UBOShadowEnum["SHADOW_WIDTH_HEIGHT_PCF_BIAS_INFO_OFFSET"] = 48] = "SHADOW_WIDTH_HEIGHT_PCF_BIAS_INFO_OFFSET";
        UBOShadowEnum[UBOShadowEnum["SHADOW_LIGHT_PACKING_NBIAS_NULL_INFO_OFFSET"] = 52] = "SHADOW_LIGHT_PACKING_NBIAS_NULL_INFO_OFFSET";
        UBOShadowEnum[UBOShadowEnum["SHADOW_COLOR_OFFSET"] = 56] = "SHADOW_COLOR_OFFSET";
        UBOShadowEnum[UBOShadowEnum["PLANAR_NORMAL_DISTANCE_INFO_OFFSET"] = 60] = "PLANAR_NORMAL_DISTANCE_INFO_OFFSET";
        UBOShadowEnum[UBOShadowEnum["COUNT"] = 64] = "COUNT";
        UBOShadowEnum[UBOShadowEnum["SIZE"] = 256] = "SIZE";
        return UBOShadowEnum;
      }({}));
      /**
       * @en The uniform buffer object for 'cast shadow(fixed || csm)' && 'dir fixed area shadow' && 'spot shadow' && 'sphere shadow' && 'planar shadow'
       * @zh 这个 UBO 仅仅只给 'cast shadow(fixed || csm)' && 'dir fixed area shadow' && 'spot shadow' && 'sphere shadow' && 'planar shadow' 使用
       */
      _export("UBOShadow", UBOShadow = class UBOShadow {});
      _UBOShadow = UBOShadow;
      UBOShadow.MAT_LIGHT_VIEW_OFFSET = UBOShadowEnum.MAT_LIGHT_VIEW_OFFSET;
      UBOShadow.MAT_LIGHT_VIEW_PROJ_OFFSET = UBOShadowEnum.MAT_LIGHT_VIEW_PROJ_OFFSET;
      UBOShadow.SHADOW_INV_PROJ_DEPTH_INFO_OFFSET = UBOShadowEnum.SHADOW_INV_PROJ_DEPTH_INFO_OFFSET;
      UBOShadow.SHADOW_PROJ_DEPTH_INFO_OFFSET = UBOShadowEnum.SHADOW_PROJ_DEPTH_INFO_OFFSET;
      UBOShadow.SHADOW_PROJ_INFO_OFFSET = UBOShadowEnum.SHADOW_PROJ_INFO_OFFSET;
      UBOShadow.SHADOW_NEAR_FAR_LINEAR_SATURATION_INFO_OFFSET = UBOShadowEnum.SHADOW_NEAR_FAR_LINEAR_SATURATION_INFO_OFFSET;
      UBOShadow.SHADOW_WIDTH_HEIGHT_PCF_BIAS_INFO_OFFSET = UBOShadowEnum.SHADOW_WIDTH_HEIGHT_PCF_BIAS_INFO_OFFSET;
      UBOShadow.SHADOW_LIGHT_PACKING_NBIAS_NULL_INFO_OFFSET = UBOShadowEnum.SHADOW_LIGHT_PACKING_NBIAS_NULL_INFO_OFFSET;
      UBOShadow.SHADOW_COLOR_OFFSET = UBOShadowEnum.SHADOW_COLOR_OFFSET;
      UBOShadow.PLANAR_NORMAL_DISTANCE_INFO_OFFSET = UBOShadowEnum.PLANAR_NORMAL_DISTANCE_INFO_OFFSET;
      UBOShadow.COUNT = UBOShadowEnum.COUNT;
      UBOShadow.SIZE = UBOShadowEnum.SIZE;
      UBOShadow.NAME = 'CCShadow';
      UBOShadow.BINDING = PipelineGlobalBindings.UBO_SHADOW;
      UBOShadow.DESCRIPTOR = new DescriptorSetLayoutBinding(_UBOShadow.BINDING, DescriptorType.UNIFORM_BUFFER, 1, ShaderStageFlagBit.ALL);
      UBOShadow.LAYOUT = new UniformBlock(SetIndex.GLOBAL, _UBOShadow.BINDING, _UBOShadow.NAME, [new Uniform('cc_matLightView', Type.MAT4, 1), new Uniform('cc_matLightViewProj', Type.MAT4, 1), new Uniform('cc_shadowInvProjDepthInfo', Type.FLOAT4, 1), new Uniform('cc_shadowProjDepthInfo', Type.FLOAT4, 1), new Uniform('cc_shadowProjInfo', Type.FLOAT4, 1), new Uniform('cc_shadowNFLSInfo', Type.FLOAT4, 1), new Uniform('cc_shadowWHPBInfo', Type.FLOAT4, 1), new Uniform('cc_shadowLPNNInfo', Type.FLOAT4, 1), new Uniform('cc_shadowColor', Type.FLOAT4, 1), new Uniform('cc_planarNDInfo', Type.FLOAT4, 1)], 1);
      globalDescriptorSetLayout.layouts[UBOShadow.NAME] = UBOShadow.LAYOUT;
      globalDescriptorSetLayout.bindings[UBOShadow.BINDING] = UBOShadow.DESCRIPTOR;
      _export("UBOCSMEnum", UBOCSMEnum = /*#__PURE__*/function (UBOCSMEnum) {
        UBOCSMEnum[UBOCSMEnum["CSM_LEVEL_COUNT"] = 4] = "CSM_LEVEL_COUNT";
        UBOCSMEnum[UBOCSMEnum["CSM_VIEW_DIR_0_OFFSET"] = 0] = "CSM_VIEW_DIR_0_OFFSET";
        UBOCSMEnum[UBOCSMEnum["CSM_VIEW_DIR_1_OFFSET"] = 16] = "CSM_VIEW_DIR_1_OFFSET";
        UBOCSMEnum[UBOCSMEnum["CSM_VIEW_DIR_2_OFFSET"] = 32] = "CSM_VIEW_DIR_2_OFFSET";
        UBOCSMEnum[UBOCSMEnum["CSM_ATLAS_OFFSET"] = 48] = "CSM_ATLAS_OFFSET";
        UBOCSMEnum[UBOCSMEnum["MAT_CSM_VIEW_PROJ_OFFSET"] = 64] = "MAT_CSM_VIEW_PROJ_OFFSET";
        UBOCSMEnum[UBOCSMEnum["CSM_PROJ_DEPTH_INFO_OFFSET"] = 128] = "CSM_PROJ_DEPTH_INFO_OFFSET";
        UBOCSMEnum[UBOCSMEnum["CSM_PROJ_INFO_OFFSET"] = 144] = "CSM_PROJ_INFO_OFFSET";
        UBOCSMEnum[UBOCSMEnum["CSM_SPLITS_INFO_OFFSET"] = 160] = "CSM_SPLITS_INFO_OFFSET";
        UBOCSMEnum[UBOCSMEnum["COUNT"] = 164] = "COUNT";
        UBOCSMEnum[UBOCSMEnum["SIZE"] = 656] = "SIZE";
        return UBOCSMEnum;
      }({}));
      /**
       * @en The uniform buffer object only for dir csm shadow(level: 1 ~ 4)
       * @zh 级联阴影使用的UBO
       */
      _export("UBOCSM", UBOCSM = class UBOCSM {});
      _UBOCSM = UBOCSM;
      UBOCSM.CSM_LEVEL_COUNT = UBOCSMEnum.CSM_LEVEL_COUNT;
      UBOCSM.CSM_VIEW_DIR_0_OFFSET = UBOCSMEnum.CSM_VIEW_DIR_0_OFFSET;
      UBOCSM.CSM_VIEW_DIR_1_OFFSET = UBOCSMEnum.CSM_VIEW_DIR_1_OFFSET;
      UBOCSM.CSM_VIEW_DIR_2_OFFSET = UBOCSMEnum.CSM_VIEW_DIR_2_OFFSET;
      UBOCSM.CSM_ATLAS_OFFSET = UBOCSMEnum.CSM_ATLAS_OFFSET;
      UBOCSM.MAT_CSM_VIEW_PROJ_OFFSET = UBOCSMEnum.MAT_CSM_VIEW_PROJ_OFFSET;
      UBOCSM.CSM_PROJ_DEPTH_INFO_OFFSET = UBOCSMEnum.CSM_PROJ_DEPTH_INFO_OFFSET;
      UBOCSM.CSM_PROJ_INFO_OFFSET = UBOCSMEnum.CSM_PROJ_INFO_OFFSET;
      UBOCSM.CSM_SPLITS_INFO_OFFSET = UBOCSMEnum.CSM_SPLITS_INFO_OFFSET;
      UBOCSM.COUNT = UBOCSMEnum.COUNT;
      UBOCSM.SIZE = UBOCSMEnum.SIZE;
      UBOCSM.NAME = 'CCCSM';
      UBOCSM.BINDING = PipelineGlobalBindings.UBO_CSM;
      UBOCSM.DESCRIPTOR = new DescriptorSetLayoutBinding(_UBOCSM.BINDING, DescriptorType.UNIFORM_BUFFER, 1, ShaderStageFlagBit.FRAGMENT);
      UBOCSM.LAYOUT = new UniformBlock(SetIndex.GLOBAL, _UBOCSM.BINDING, _UBOCSM.NAME, [new Uniform('cc_csmViewDir0', Type.FLOAT4, _UBOCSM.CSM_LEVEL_COUNT), new Uniform('cc_csmViewDir1', Type.FLOAT4, _UBOCSM.CSM_LEVEL_COUNT), new Uniform('cc_csmViewDir2', Type.FLOAT4, _UBOCSM.CSM_LEVEL_COUNT), new Uniform('cc_csmAtlas', Type.FLOAT4, _UBOCSM.CSM_LEVEL_COUNT), new Uniform('cc_matCSMViewProj', Type.MAT4, _UBOCSM.CSM_LEVEL_COUNT), new Uniform('cc_csmProjDepthInfo', Type.FLOAT4, _UBOCSM.CSM_LEVEL_COUNT), new Uniform('cc_csmProjInfo', Type.FLOAT4, _UBOCSM.CSM_LEVEL_COUNT), new Uniform('cc_csmSplitsInfo', Type.FLOAT4, 1)], 1);
      globalDescriptorSetLayout.layouts[UBOCSM.NAME] = UBOCSM.LAYOUT;
      globalDescriptorSetLayout.bindings[UBOCSM.BINDING] = UBOCSM.DESCRIPTOR;

      /* eslint-disable max-len */

      /**
       * @en The sampler for Main light shadow map
       * @zh 主光源阴影纹理采样器
       */
      UNIFORM_SHADOWMAP_NAME = 'cc_shadowMap';
      _export("UNIFORM_SHADOWMAP_BINDING", UNIFORM_SHADOWMAP_BINDING = PipelineGlobalBindings.SAMPLER_SHADOWMAP);
      UNIFORM_SHADOWMAP_DESCRIPTOR = new DescriptorSetLayoutBinding(UNIFORM_SHADOWMAP_BINDING, DescriptorType.SAMPLER_TEXTURE, 1, ShaderStageFlagBit.FRAGMENT);
      UNIFORM_SHADOWMAP_LAYOUT = new UniformSamplerTexture(SetIndex.GLOBAL, UNIFORM_SHADOWMAP_BINDING, UNIFORM_SHADOWMAP_NAME, Type.SAMPLER2D, 1);
      globalDescriptorSetLayout.layouts[UNIFORM_SHADOWMAP_NAME] = UNIFORM_SHADOWMAP_LAYOUT;
      globalDescriptorSetLayout.bindings[UNIFORM_SHADOWMAP_BINDING] = UNIFORM_SHADOWMAP_DESCRIPTOR;
      UNIFORM_ENVIRONMENT_NAME = 'cc_environment';
      _export("UNIFORM_ENVIRONMENT_BINDING", UNIFORM_ENVIRONMENT_BINDING = PipelineGlobalBindings.SAMPLER_ENVIRONMENT);
      UNIFORM_ENVIRONMENT_DESCRIPTOR = new DescriptorSetLayoutBinding(UNIFORM_ENVIRONMENT_BINDING, DescriptorType.SAMPLER_TEXTURE, 1, ShaderStageFlagBit.FRAGMENT);
      UNIFORM_ENVIRONMENT_LAYOUT = new UniformSamplerTexture(SetIndex.GLOBAL, UNIFORM_ENVIRONMENT_BINDING, UNIFORM_ENVIRONMENT_NAME, Type.SAMPLER_CUBE, 1);
      globalDescriptorSetLayout.layouts[UNIFORM_ENVIRONMENT_NAME] = UNIFORM_ENVIRONMENT_LAYOUT;
      globalDescriptorSetLayout.bindings[UNIFORM_ENVIRONMENT_BINDING] = UNIFORM_ENVIRONMENT_DESCRIPTOR;
      UNIFORM_DIFFUSEMAP_NAME = 'cc_diffuseMap';
      _export("UNIFORM_DIFFUSEMAP_BINDING", UNIFORM_DIFFUSEMAP_BINDING = PipelineGlobalBindings.SAMPLER_DIFFUSEMAP);
      UNIFORM_DIFFUSEMAP_DESCRIPTOR = new DescriptorSetLayoutBinding(UNIFORM_DIFFUSEMAP_BINDING, DescriptorType.SAMPLER_TEXTURE, 1, ShaderStageFlagBit.FRAGMENT);
      UNIFORM_DIFFUSEMAP_LAYOUT = new UniformSamplerTexture(SetIndex.GLOBAL, UNIFORM_DIFFUSEMAP_BINDING, UNIFORM_DIFFUSEMAP_NAME, Type.SAMPLER_CUBE, 1);
      globalDescriptorSetLayout.layouts[UNIFORM_DIFFUSEMAP_NAME] = UNIFORM_DIFFUSEMAP_LAYOUT;
      globalDescriptorSetLayout.bindings[UNIFORM_DIFFUSEMAP_BINDING] = UNIFORM_DIFFUSEMAP_DESCRIPTOR;

      /**
       * @en The sampler for spot light shadow map
       * @zh 聚光灯阴影纹理采样器
       */
      UNIFORM_SPOT_SHADOW_MAP_TEXTURE_NAME = 'cc_spotShadowMap';
      _export("UNIFORM_SPOT_SHADOW_MAP_TEXTURE_BINDING", UNIFORM_SPOT_SHADOW_MAP_TEXTURE_BINDING = PipelineGlobalBindings.SAMPLER_SPOT_SHADOW_MAP);
      UNIFORM_SPOT_SHADOW_MAP_TEXTURE_DESCRIPTOR = new DescriptorSetLayoutBinding(UNIFORM_SPOT_SHADOW_MAP_TEXTURE_BINDING, DescriptorType.SAMPLER_TEXTURE, 1, ShaderStageFlagBit.FRAGMENT);
      UNIFORM_SPOT_SHADOW_MAP_TEXTURE_LAYOUT = new UniformSamplerTexture(SetIndex.GLOBAL, UNIFORM_SPOT_SHADOW_MAP_TEXTURE_BINDING, UNIFORM_SPOT_SHADOW_MAP_TEXTURE_NAME, Type.SAMPLER2D, 1);
      globalDescriptorSetLayout.layouts[UNIFORM_SPOT_SHADOW_MAP_TEXTURE_NAME] = UNIFORM_SPOT_SHADOW_MAP_TEXTURE_LAYOUT;
      globalDescriptorSetLayout.bindings[UNIFORM_SPOT_SHADOW_MAP_TEXTURE_BINDING] = UNIFORM_SPOT_SHADOW_MAP_TEXTURE_DESCRIPTOR;
      _export("UBOLocalEnum", UBOLocalEnum = /*#__PURE__*/function (UBOLocalEnum) {
        UBOLocalEnum[UBOLocalEnum["MAT_WORLD_OFFSET"] = 0] = "MAT_WORLD_OFFSET";
        UBOLocalEnum[UBOLocalEnum["MAT_WORLD_IT_OFFSET"] = 16] = "MAT_WORLD_IT_OFFSET";
        UBOLocalEnum[UBOLocalEnum["LIGHTINGMAP_UVPARAM"] = 32] = "LIGHTINGMAP_UVPARAM";
        UBOLocalEnum[UBOLocalEnum["LOCAL_SHADOW_BIAS"] = 36] = "LOCAL_SHADOW_BIAS";
        UBOLocalEnum[UBOLocalEnum["REFLECTION_PROBE_DATA1"] = 40] = "REFLECTION_PROBE_DATA1";
        UBOLocalEnum[UBOLocalEnum["REFLECTION_PROBE_DATA2"] = 44] = "REFLECTION_PROBE_DATA2";
        UBOLocalEnum[UBOLocalEnum["REFLECTION_PROBE_BLEND_DATA1"] = 48] = "REFLECTION_PROBE_BLEND_DATA1";
        UBOLocalEnum[UBOLocalEnum["REFLECTION_PROBE_BLEND_DATA2"] = 52] = "REFLECTION_PROBE_BLEND_DATA2";
        UBOLocalEnum[UBOLocalEnum["COUNT"] = 56] = "COUNT";
        UBOLocalEnum[UBOLocalEnum["SIZE"] = 224] = "SIZE";
        UBOLocalEnum[UBOLocalEnum["BINDING"] = 0] = "BINDING";
        return UBOLocalEnum;
      }({}));
      /**
       * @en The local uniform buffer object
       * @zh 本地 UBO。
       */
      _export("UBOLocal", UBOLocal = class UBOLocal {});
      _UBOLocal = UBOLocal;
      UBOLocal.MAT_WORLD_OFFSET = UBOLocalEnum.MAT_WORLD_OFFSET;
      UBOLocal.MAT_WORLD_IT_OFFSET = UBOLocalEnum.MAT_WORLD_IT_OFFSET;
      UBOLocal.LIGHTINGMAP_UVPARAM = UBOLocalEnum.LIGHTINGMAP_UVPARAM;
      UBOLocal.LOCAL_SHADOW_BIAS = UBOLocalEnum.LOCAL_SHADOW_BIAS;
      UBOLocal.REFLECTION_PROBE_DATA1 = UBOLocalEnum.REFLECTION_PROBE_DATA1;
      UBOLocal.REFLECTION_PROBE_DATA2 = UBOLocalEnum.REFLECTION_PROBE_DATA2;
      UBOLocal.REFLECTION_PROBE_BLEND_DATA1 = UBOLocalEnum.REFLECTION_PROBE_BLEND_DATA1;
      UBOLocal.REFLECTION_PROBE_BLEND_DATA2 = UBOLocalEnum.REFLECTION_PROBE_BLEND_DATA2;
      UBOLocal.COUNT = UBOLocalEnum.COUNT;
      UBOLocal.SIZE = UBOLocalEnum.SIZE;
      UBOLocal.NAME = 'CCLocal';
      UBOLocal.BINDING = UBOLocalEnum.BINDING;
      UBOLocal.DESCRIPTOR = new DescriptorSetLayoutBinding(UBOLocalEnum.BINDING, DescriptorType.UNIFORM_BUFFER, 1, ShaderStageFlagBit.VERTEX | ShaderStageFlagBit.FRAGMENT | ShaderStageFlagBit.COMPUTE, MemoryAccessBit.READ_ONLY, ViewDimension.BUFFER);
      UBOLocal.LAYOUT = new UniformBlock(SetIndex.LOCAL, UBOLocalEnum.BINDING, _UBOLocal.NAME, [new Uniform('cc_matWorld', Type.MAT4, 1), new Uniform('cc_matWorldIT', Type.MAT4, 1), new Uniform('cc_lightingMapUVParam', Type.FLOAT4, 1), new Uniform('cc_localShadowBias', Type.FLOAT4, 1), new Uniform('cc_reflectionProbeData1', Type.FLOAT4, 1), new Uniform('cc_reflectionProbeData2', Type.FLOAT4, 1), new Uniform('cc_reflectionProbeBlendData1', Type.FLOAT4, 1), new Uniform('cc_reflectionProbeBlendData2', Type.FLOAT4, 1)], 1);
      localDescriptorSetLayout.layouts[UBOLocal.NAME] = UBOLocal.LAYOUT;
      localDescriptorSetLayout.bindings[UBOLocalEnum.BINDING] = UBOLocal.DESCRIPTOR;

      /**
       * @en The world bound uniform buffer object
       * @zh 世界空间包围盒 UBO。
       */
      _export("UBOWorldBound", UBOWorldBound = class UBOWorldBound {});
      _UBOWorldBound = UBOWorldBound;
      UBOWorldBound.WORLD_BOUND_CENTER = 0;
      UBOWorldBound.WORLD_BOUND_HALF_EXTENTS = _UBOWorldBound.WORLD_BOUND_CENTER + 4;
      UBOWorldBound.COUNT = _UBOWorldBound.WORLD_BOUND_HALF_EXTENTS + 4;
      UBOWorldBound.SIZE = _UBOWorldBound.COUNT * 4;
      UBOWorldBound.NAME = 'CCWorldBound';
      UBOWorldBound.BINDING = ModelLocalBindings.UBO_LOCAL;
      UBOWorldBound.DESCRIPTOR = new DescriptorSetLayoutBinding(_UBOWorldBound.BINDING, DescriptorType.UNIFORM_BUFFER, 1, ShaderStageFlagBit.VERTEX | ShaderStageFlagBit.COMPUTE, MemoryAccessBit.READ_ONLY, ViewDimension.BUFFER);
      UBOWorldBound.LAYOUT = new UniformBlock(SetIndex.LOCAL, _UBOWorldBound.BINDING, _UBOWorldBound.NAME, [new Uniform('cc_worldBoundCenter', Type.FLOAT4, 1), new Uniform('cc_worldBoundHalfExtents', Type.FLOAT4, 1)], 1);
      localDescriptorSetLayout.layouts[UBOWorldBound.NAME] = UBOWorldBound.LAYOUT;
      localDescriptorSetLayout.bindings[UBOWorldBound.BINDING] = UBOWorldBound.DESCRIPTOR;
      _export("INST_MAT_WORLD", INST_MAT_WORLD = 'a_matWorld0');
      _export("INST_SH", INST_SH = 'a_sh_linear_const_r');
      _export("UBOLocalBatched", UBOLocalBatched = class UBOLocalBatched {});
      _UBOLocalBatched = UBOLocalBatched;
      UBOLocalBatched.BATCHING_COUNT = 10;
      UBOLocalBatched.MAT_WORLDS_OFFSET = 0;
      UBOLocalBatched.COUNT = 16 * _UBOLocalBatched.BATCHING_COUNT;
      UBOLocalBatched.SIZE = _UBOLocalBatched.COUNT * 4;
      UBOLocalBatched.NAME = 'CCLocalBatched';
      UBOLocalBatched.BINDING = ModelLocalBindings.UBO_LOCAL;
      UBOLocalBatched.DESCRIPTOR = new DescriptorSetLayoutBinding(_UBOLocalBatched.BINDING, DescriptorType.UNIFORM_BUFFER, 1, ShaderStageFlagBit.VERTEX | ShaderStageFlagBit.COMPUTE, MemoryAccessBit.READ_ONLY, ViewDimension.BUFFER);
      UBOLocalBatched.LAYOUT = new UniformBlock(SetIndex.LOCAL, _UBOLocalBatched.BINDING, _UBOLocalBatched.NAME, [new Uniform('cc_matWorlds', Type.MAT4, _UBOLocalBatched.BATCHING_COUNT)], 1);
      localDescriptorSetLayout.layouts[UBOLocalBatched.NAME] = UBOLocalBatched.LAYOUT;
      localDescriptorSetLayout.bindings[UBOLocalBatched.BINDING] = UBOLocalBatched.DESCRIPTOR;
      _export("UBOForwardLightEnum", UBOForwardLightEnum = /*#__PURE__*/function (UBOForwardLightEnum) {
        UBOForwardLightEnum[UBOForwardLightEnum["LIGHTS_PER_PASS"] = 1] = "LIGHTS_PER_PASS";
        UBOForwardLightEnum[UBOForwardLightEnum["LIGHT_POS_OFFSET"] = 0] = "LIGHT_POS_OFFSET";
        UBOForwardLightEnum[UBOForwardLightEnum["LIGHT_COLOR_OFFSET"] = 4] = "LIGHT_COLOR_OFFSET";
        UBOForwardLightEnum[UBOForwardLightEnum["LIGHT_SIZE_RANGE_ANGLE_OFFSET"] = 8] = "LIGHT_SIZE_RANGE_ANGLE_OFFSET";
        UBOForwardLightEnum[UBOForwardLightEnum["LIGHT_DIR_OFFSET"] = 12] = "LIGHT_DIR_OFFSET";
        UBOForwardLightEnum[UBOForwardLightEnum["LIGHT_BOUNDING_SIZE_VS_OFFSET"] = 16] = "LIGHT_BOUNDING_SIZE_VS_OFFSET";
        UBOForwardLightEnum[UBOForwardLightEnum["COUNT"] = 20] = "COUNT";
        UBOForwardLightEnum[UBOForwardLightEnum["SIZE"] = 80] = "SIZE";
        return UBOForwardLightEnum;
      }({}));
      /**
       * @en The uniform buffer object for forward lighting
       * @zh 前向灯光 UBO。
       */
      _export("UBOForwardLight", UBOForwardLight = class UBOForwardLight {});
      _UBOForwardLight = UBOForwardLight;
      UBOForwardLight.LIGHTS_PER_PASS = UBOForwardLightEnum.LIGHTS_PER_PASS;
      UBOForwardLight.LIGHT_POS_OFFSET = UBOForwardLightEnum.LIGHT_POS_OFFSET;
      UBOForwardLight.LIGHT_COLOR_OFFSET = UBOForwardLightEnum.LIGHT_COLOR_OFFSET;
      UBOForwardLight.LIGHT_SIZE_RANGE_ANGLE_OFFSET = UBOForwardLightEnum.LIGHT_SIZE_RANGE_ANGLE_OFFSET;
      UBOForwardLight.LIGHT_DIR_OFFSET = UBOForwardLightEnum.LIGHT_DIR_OFFSET;
      UBOForwardLight.LIGHT_BOUNDING_SIZE_VS_OFFSET = UBOForwardLightEnum.LIGHT_BOUNDING_SIZE_VS_OFFSET;
      UBOForwardLight.COUNT = UBOForwardLightEnum.COUNT;
      UBOForwardLight.SIZE = UBOForwardLightEnum.SIZE;
      UBOForwardLight.NAME = 'CCForwardLight';
      UBOForwardLight.BINDING = ModelLocalBindings.UBO_FORWARD_LIGHTS;
      UBOForwardLight.DESCRIPTOR = new DescriptorSetLayoutBinding(_UBOForwardLight.BINDING, DescriptorType.DYNAMIC_UNIFORM_BUFFER, 1, ShaderStageFlagBit.FRAGMENT, MemoryAccessBit.READ_ONLY, ViewDimension.BUFFER);
      UBOForwardLight.LAYOUT = new UniformBlock(SetIndex.LOCAL, _UBOForwardLight.BINDING, _UBOForwardLight.NAME, [new Uniform('cc_lightPos', Type.FLOAT4, UBOForwardLightEnum.LIGHTS_PER_PASS), new Uniform('cc_lightColor', Type.FLOAT4, UBOForwardLightEnum.LIGHTS_PER_PASS), new Uniform('cc_lightSizeRangeAngle', Type.FLOAT4, UBOForwardLightEnum.LIGHTS_PER_PASS), new Uniform('cc_lightDir', Type.FLOAT4, UBOForwardLightEnum.LIGHTS_PER_PASS), new Uniform('cc_lightBoundingSizeVS', Type.FLOAT4, UBOForwardLightEnum.LIGHTS_PER_PASS)], 1);
      localDescriptorSetLayout.layouts[UBOForwardLight.NAME] = UBOForwardLight.LAYOUT;
      localDescriptorSetLayout.bindings[UBOForwardLight.BINDING] = UBOForwardLight.DESCRIPTOR;
      _export("UBODeferredLight", UBODeferredLight = class UBODeferredLight {});
      UBODeferredLight.LIGHTS_PER_PASS = 10;
      _export("JOINT_UNIFORM_CAPACITY", JOINT_UNIFORM_CAPACITY = 30);
      /**
       * @en The uniform buffer object for skinning texture
       * @zh 骨骼贴图 UBO。
       */
      _export("UBOSkinningTexture", UBOSkinningTexture = class UBOSkinningTexture {});
      _UBOSkinningTexture = UBOSkinningTexture;
      UBOSkinningTexture.JOINTS_TEXTURE_INFO_OFFSET = 0;
      UBOSkinningTexture.COUNT = _UBOSkinningTexture.JOINTS_TEXTURE_INFO_OFFSET + 4;
      UBOSkinningTexture.SIZE = _UBOSkinningTexture.COUNT * 4;
      UBOSkinningTexture.NAME = 'CCSkinningTexture';
      UBOSkinningTexture.BINDING = ModelLocalBindings.UBO_SKINNING_TEXTURE;
      UBOSkinningTexture.DESCRIPTOR = new DescriptorSetLayoutBinding(_UBOSkinningTexture.BINDING, DescriptorType.UNIFORM_BUFFER, 1, ShaderStageFlagBit.VERTEX, MemoryAccessBit.READ_ONLY, ViewDimension.BUFFER);
      UBOSkinningTexture.LAYOUT = new UniformBlock(SetIndex.LOCAL, _UBOSkinningTexture.BINDING, _UBOSkinningTexture.NAME, [new Uniform('cc_jointTextureInfo', Type.FLOAT4, 1)], 1);
      localDescriptorSetLayout.layouts[UBOSkinningTexture.NAME] = UBOSkinningTexture.LAYOUT;
      localDescriptorSetLayout.bindings[UBOSkinningTexture.BINDING] = UBOSkinningTexture.DESCRIPTOR;
      _export("UBOSkinningAnimation", UBOSkinningAnimation = class UBOSkinningAnimation {});
      _UBOSkinningAnimation = UBOSkinningAnimation;
      UBOSkinningAnimation.JOINTS_ANIM_INFO_OFFSET = 0;
      UBOSkinningAnimation.COUNT = _UBOSkinningAnimation.JOINTS_ANIM_INFO_OFFSET + 4;
      UBOSkinningAnimation.SIZE = _UBOSkinningAnimation.COUNT * 4;
      UBOSkinningAnimation.NAME = 'CCSkinningAnimation';
      UBOSkinningAnimation.BINDING = ModelLocalBindings.UBO_SKINNING_ANIMATION;
      UBOSkinningAnimation.DESCRIPTOR = new DescriptorSetLayoutBinding(_UBOSkinningAnimation.BINDING, DescriptorType.UNIFORM_BUFFER, 1, ShaderStageFlagBit.VERTEX, MemoryAccessBit.READ_ONLY, ViewDimension.BUFFER);
      UBOSkinningAnimation.LAYOUT = new UniformBlock(SetIndex.LOCAL, _UBOSkinningAnimation.BINDING, _UBOSkinningAnimation.NAME, [new Uniform('cc_jointAnimInfo', Type.FLOAT4, 1)], 1);
      localDescriptorSetLayout.layouts[UBOSkinningAnimation.NAME] = UBOSkinningAnimation.LAYOUT;
      localDescriptorSetLayout.bindings[UBOSkinningAnimation.BINDING] = UBOSkinningAnimation.DESCRIPTOR;
      _export("INST_JOINT_ANIM_INFO", INST_JOINT_ANIM_INFO = 'a_jointAnimInfo');
      _export("UBOSkinning", UBOSkinning = class UBOSkinning {
        static get JOINT_UNIFORM_CAPACITY() {
          return UBOSkinning._jointUniformCapacity;
        }
        static get COUNT() {
          return UBOSkinning._count;
        }
        static get SIZE() {
          return UBOSkinning._size;
        }
        /**
         * @internal This method only used init UBOSkinning configure.
        */
        static initLayout(capacity) {
          UBOSkinning._jointUniformCapacity = capacity;
          UBOSkinning._count = capacity * 12;
          UBOSkinning._size = UBOSkinning._count * 4;
          UBOSkinning.LAYOUT.members[0].count = capacity * 3;
        }
      });
      _UBOSkinning = UBOSkinning;
      UBOSkinning._jointUniformCapacity = 0;
      UBOSkinning._count = 0;
      UBOSkinning._size = 0;
      UBOSkinning.NAME = 'CCSkinning';
      UBOSkinning.BINDING = ModelLocalBindings.UBO_SKINNING_TEXTURE;
      UBOSkinning.DESCRIPTOR = new DescriptorSetLayoutBinding(_UBOSkinning.BINDING, DescriptorType.UNIFORM_BUFFER, 1, ShaderStageFlagBit.VERTEX, MemoryAccessBit.READ_ONLY, ViewDimension.BUFFER);
      UBOSkinning.LAYOUT = new UniformBlock(SetIndex.LOCAL, _UBOSkinning.BINDING, _UBOSkinning.NAME, [new Uniform('cc_joints', Type.FLOAT4, 1)], 1);
      _export("UBOMorphEnum", UBOMorphEnum = /*#__PURE__*/function (UBOMorphEnum) {
        UBOMorphEnum[UBOMorphEnum["MAX_MORPH_TARGET_COUNT"] = 60] = "MAX_MORPH_TARGET_COUNT";
        UBOMorphEnum[UBOMorphEnum["OFFSET_OF_WEIGHTS"] = 0] = "OFFSET_OF_WEIGHTS";
        UBOMorphEnum[UBOMorphEnum["OFFSET_OF_DISPLACEMENT_TEXTURE_WIDTH"] = 240] = "OFFSET_OF_DISPLACEMENT_TEXTURE_WIDTH";
        UBOMorphEnum[UBOMorphEnum["OFFSET_OF_DISPLACEMENT_TEXTURE_HEIGHT"] = 244] = "OFFSET_OF_DISPLACEMENT_TEXTURE_HEIGHT";
        UBOMorphEnum[UBOMorphEnum["OFFSET_OF_VERTICES_COUNT"] = 248] = "OFFSET_OF_VERTICES_COUNT";
        UBOMorphEnum[UBOMorphEnum["COUNT_BASE_4_BYTES"] = 64] = "COUNT_BASE_4_BYTES";
        UBOMorphEnum[UBOMorphEnum["SIZE"] = 256] = "SIZE";
        return UBOMorphEnum;
      }({}));
      /**
       * @en The uniform buffer object for morph setting
       * @zh 形变配置的 UBO
       */
      _export("UBOMorph", UBOMorph = class UBOMorph {});
      _UBOMorph = UBOMorph;
      UBOMorph.MAX_MORPH_TARGET_COUNT = UBOMorphEnum.MAX_MORPH_TARGET_COUNT;
      UBOMorph.OFFSET_OF_WEIGHTS = UBOMorphEnum.OFFSET_OF_WEIGHTS;
      UBOMorph.OFFSET_OF_DISPLACEMENT_TEXTURE_WIDTH = UBOMorphEnum.OFFSET_OF_DISPLACEMENT_TEXTURE_WIDTH;
      UBOMorph.OFFSET_OF_DISPLACEMENT_TEXTURE_HEIGHT = UBOMorphEnum.OFFSET_OF_DISPLACEMENT_TEXTURE_HEIGHT;
      UBOMorph.OFFSET_OF_VERTICES_COUNT = UBOMorphEnum.OFFSET_OF_VERTICES_COUNT;
      UBOMorph.COUNT_BASE_4_BYTES = UBOMorphEnum.COUNT_BASE_4_BYTES;
      UBOMorph.SIZE = UBOMorphEnum.SIZE;
      UBOMorph.NAME = 'CCMorph';
      UBOMorph.BINDING = ModelLocalBindings.UBO_MORPH;
      UBOMorph.DESCRIPTOR = new DescriptorSetLayoutBinding(_UBOMorph.BINDING, DescriptorType.UNIFORM_BUFFER, 1, ShaderStageFlagBit.VERTEX, MemoryAccessBit.READ_ONLY, ViewDimension.BUFFER);
      UBOMorph.LAYOUT = new UniformBlock(SetIndex.LOCAL, _UBOMorph.BINDING, _UBOMorph.NAME, [new Uniform('cc_displacementWeights', Type.FLOAT4, UBOMorphEnum.MAX_MORPH_TARGET_COUNT / 4), new Uniform('cc_displacementTextureInfo', Type.FLOAT4, 1)], 1);
      localDescriptorSetLayout.layouts[UBOMorph.NAME] = UBOMorph.LAYOUT;
      localDescriptorSetLayout.bindings[UBOMorph.BINDING] = UBOMorph.DESCRIPTOR;

      // UI local uniform UBO
      _export("UBOUILocal", UBOUILocal = class UBOUILocal {
        // pre one vec4
        constructor() {}
      });
      _UBOUILocal = UBOUILocal;
      UBOUILocal.NAME = 'CCUILocal';
      UBOUILocal.BINDING = ModelLocalBindings.UBO_UI_LOCAL;
      UBOUILocal.DESCRIPTOR = new DescriptorSetLayoutBinding(_UBOUILocal.BINDING, DescriptorType.DYNAMIC_UNIFORM_BUFFER, 1, ShaderStageFlagBit.VERTEX, MemoryAccessBit.READ_ONLY, ViewDimension.BUFFER);
      UBOUILocal.LAYOUT = new UniformBlock(SetIndex.LOCAL, _UBOUILocal.BINDING, _UBOUILocal.NAME, [new Uniform('cc_local_data', Type.FLOAT4, 1)], 1);
      localDescriptorSetLayout.layouts[UBOUILocal.NAME] = UBOUILocal.LAYOUT;
      localDescriptorSetLayout.bindings[UBOUILocal.BINDING] = UBOUILocal.DESCRIPTOR;
      _export("UBOSHEnum", UBOSHEnum = /*#__PURE__*/function (UBOSHEnum) {
        UBOSHEnum[UBOSHEnum["SH_LINEAR_CONST_R_OFFSET"] = 0] = "SH_LINEAR_CONST_R_OFFSET";
        UBOSHEnum[UBOSHEnum["SH_LINEAR_CONST_G_OFFSET"] = 4] = "SH_LINEAR_CONST_G_OFFSET";
        UBOSHEnum[UBOSHEnum["SH_LINEAR_CONST_B_OFFSET"] = 8] = "SH_LINEAR_CONST_B_OFFSET";
        UBOSHEnum[UBOSHEnum["SH_QUADRATIC_R_OFFSET"] = 12] = "SH_QUADRATIC_R_OFFSET";
        UBOSHEnum[UBOSHEnum["SH_QUADRATIC_G_OFFSET"] = 16] = "SH_QUADRATIC_G_OFFSET";
        UBOSHEnum[UBOSHEnum["SH_QUADRATIC_B_OFFSET"] = 20] = "SH_QUADRATIC_B_OFFSET";
        UBOSHEnum[UBOSHEnum["SH_QUADRATIC_A_OFFSET"] = 24] = "SH_QUADRATIC_A_OFFSET";
        UBOSHEnum[UBOSHEnum["COUNT"] = 28] = "COUNT";
        UBOSHEnum[UBOSHEnum["SIZE"] = 112] = "SIZE";
        UBOSHEnum[UBOSHEnum["BINDING"] = 6] = "BINDING";
        return UBOSHEnum;
      }({}));
      /**
       * @en The SH uniform buffer object
       * @zh 球谐 UBO。
       */
      _export("UBOSH", UBOSH = class UBOSH {});
      _UBOSH = UBOSH;
      UBOSH.SH_LINEAR_CONST_R_OFFSET = UBOSHEnum.SH_LINEAR_CONST_R_OFFSET;
      UBOSH.SH_LINEAR_CONST_G_OFFSET = UBOSHEnum.SH_LINEAR_CONST_G_OFFSET;
      UBOSH.SH_LINEAR_CONST_B_OFFSET = UBOSHEnum.SH_LINEAR_CONST_B_OFFSET;
      UBOSH.SH_QUADRATIC_R_OFFSET = UBOSHEnum.SH_QUADRATIC_R_OFFSET;
      UBOSH.SH_QUADRATIC_G_OFFSET = UBOSHEnum.SH_QUADRATIC_G_OFFSET;
      UBOSH.SH_QUADRATIC_B_OFFSET = UBOSHEnum.SH_QUADRATIC_B_OFFSET;
      UBOSH.SH_QUADRATIC_A_OFFSET = UBOSHEnum.SH_QUADRATIC_A_OFFSET;
      UBOSH.COUNT = UBOSHEnum.COUNT;
      UBOSH.SIZE = UBOSHEnum.SIZE;
      UBOSH.NAME = 'CCSH';
      UBOSH.BINDING = UBOSHEnum.BINDING;
      UBOSH.DESCRIPTOR = new DescriptorSetLayoutBinding(UBOSHEnum.BINDING, DescriptorType.UNIFORM_BUFFER, 1, ShaderStageFlagBit.FRAGMENT, MemoryAccessBit.READ_ONLY, ViewDimension.BUFFER);
      UBOSH.LAYOUT = new UniformBlock(SetIndex.LOCAL, UBOSHEnum.BINDING, _UBOSH.NAME, [new Uniform('cc_sh_linear_const_r', Type.FLOAT4, 1), new Uniform('cc_sh_linear_const_g', Type.FLOAT4, 1), new Uniform('cc_sh_linear_const_b', Type.FLOAT4, 1), new Uniform('cc_sh_quadratic_r', Type.FLOAT4, 1), new Uniform('cc_sh_quadratic_g', Type.FLOAT4, 1), new Uniform('cc_sh_quadratic_b', Type.FLOAT4, 1), new Uniform('cc_sh_quadratic_a', Type.FLOAT4, 1)], 1);
      localDescriptorSetLayout.layouts[UBOSH.NAME] = UBOSH.LAYOUT;
      localDescriptorSetLayout.bindings[UBOSHEnum.BINDING] = UBOSH.DESCRIPTOR;

      /**
       * @en The sampler for joint texture
       * @zh 骨骼纹理采样器。
       */
      UNIFORM_JOINT_TEXTURE_NAME = 'cc_jointTexture';
      _export("UNIFORM_JOINT_TEXTURE_BINDING", UNIFORM_JOINT_TEXTURE_BINDING = ModelLocalBindings.SAMPLER_JOINTS);
      UNIFORM_JOINT_TEXTURE_DESCRIPTOR = new DescriptorSetLayoutBinding(UNIFORM_JOINT_TEXTURE_BINDING, DescriptorType.SAMPLER_TEXTURE, 1, ShaderStageFlagBit.VERTEX, MemoryAccessBit.READ_ONLY, ViewDimension.TEX2D);
      UNIFORM_JOINT_TEXTURE_LAYOUT = new UniformSamplerTexture(SetIndex.LOCAL, UNIFORM_JOINT_TEXTURE_BINDING, UNIFORM_JOINT_TEXTURE_NAME, Type.SAMPLER2D, 1);
      localDescriptorSetLayout.layouts[UNIFORM_JOINT_TEXTURE_NAME] = UNIFORM_JOINT_TEXTURE_LAYOUT;
      localDescriptorSetLayout.bindings[UNIFORM_JOINT_TEXTURE_BINDING] = UNIFORM_JOINT_TEXTURE_DESCRIPTOR;

      /**
       * @en The sampler for real-time joint texture
       * @zh 实时骨骼纹理采样器。
       */
      UNIFORM_REALTIME_JOINT_TEXTURE_NAME = 'cc_realtimeJoint';
      _export("UNIFORM_REALTIME_JOINT_TEXTURE_BINDING", UNIFORM_REALTIME_JOINT_TEXTURE_BINDING = ModelLocalBindings.SAMPLER_JOINTS);
      UNIFORM_REALTIME_JOINT_TEXTURE_DESCRIPTOR = new DescriptorSetLayoutBinding(UNIFORM_REALTIME_JOINT_TEXTURE_BINDING, DescriptorType.SAMPLER_TEXTURE, 1, ShaderStageFlagBit.VERTEX, MemoryAccessBit.READ_ONLY, ViewDimension.TEX2D);
      UNIFORM_REALTIME_JOINT_TEXTURE_LAYOUT = new UniformSamplerTexture(SetIndex.LOCAL, UNIFORM_REALTIME_JOINT_TEXTURE_BINDING, UNIFORM_REALTIME_JOINT_TEXTURE_NAME, Type.SAMPLER2D, 1);
      localDescriptorSetLayout.layouts[UNIFORM_REALTIME_JOINT_TEXTURE_NAME] = UNIFORM_REALTIME_JOINT_TEXTURE_LAYOUT;
      localDescriptorSetLayout.bindings[UNIFORM_REALTIME_JOINT_TEXTURE_BINDING] = UNIFORM_REALTIME_JOINT_TEXTURE_DESCRIPTOR;

      /**
       * @en The sampler for morph texture of position
       * @zh 位置形变纹理采样器。
       */
      UNIFORM_POSITION_MORPH_TEXTURE_NAME = 'cc_PositionDisplacements';
      _export("UNIFORM_POSITION_MORPH_TEXTURE_BINDING", UNIFORM_POSITION_MORPH_TEXTURE_BINDING = ModelLocalBindings.SAMPLER_MORPH_POSITION);
      UNIFORM_POSITION_MORPH_TEXTURE_DESCRIPTOR = new DescriptorSetLayoutBinding(UNIFORM_POSITION_MORPH_TEXTURE_BINDING, DescriptorType.SAMPLER_TEXTURE, 1, ShaderStageFlagBit.VERTEX, MemoryAccessBit.READ_ONLY, ViewDimension.TEX2D);
      UNIFORM_POSITION_MORPH_TEXTURE_LAYOUT = new UniformSamplerTexture(SetIndex.LOCAL, UNIFORM_POSITION_MORPH_TEXTURE_BINDING, UNIFORM_POSITION_MORPH_TEXTURE_NAME, Type.SAMPLER2D, 1);
      localDescriptorSetLayout.layouts[UNIFORM_POSITION_MORPH_TEXTURE_NAME] = UNIFORM_POSITION_MORPH_TEXTURE_LAYOUT;
      localDescriptorSetLayout.bindings[UNIFORM_POSITION_MORPH_TEXTURE_BINDING] = UNIFORM_POSITION_MORPH_TEXTURE_DESCRIPTOR;

      /**
       * @en The sampler for morph texture of normal
       * @zh 法线形变纹理采样器。
       */
      UNIFORM_NORMAL_MORPH_TEXTURE_NAME = 'cc_NormalDisplacements';
      _export("UNIFORM_NORMAL_MORPH_TEXTURE_BINDING", UNIFORM_NORMAL_MORPH_TEXTURE_BINDING = ModelLocalBindings.SAMPLER_MORPH_NORMAL);
      UNIFORM_NORMAL_MORPH_TEXTURE_DESCRIPTOR = new DescriptorSetLayoutBinding(UNIFORM_NORMAL_MORPH_TEXTURE_BINDING, DescriptorType.SAMPLER_TEXTURE, 1, ShaderStageFlagBit.VERTEX, MemoryAccessBit.READ_ONLY, ViewDimension.TEX2D);
      UNIFORM_NORMAL_MORPH_TEXTURE_LAYOUT = new UniformSamplerTexture(SetIndex.LOCAL, UNIFORM_NORMAL_MORPH_TEXTURE_BINDING, UNIFORM_NORMAL_MORPH_TEXTURE_NAME, Type.SAMPLER2D, 1);
      localDescriptorSetLayout.layouts[UNIFORM_NORMAL_MORPH_TEXTURE_NAME] = UNIFORM_NORMAL_MORPH_TEXTURE_LAYOUT;
      localDescriptorSetLayout.bindings[UNIFORM_NORMAL_MORPH_TEXTURE_BINDING] = UNIFORM_NORMAL_MORPH_TEXTURE_DESCRIPTOR;

      /**
       * @en The sampler for morph texture of tangent
       * @zh 切线形变纹理采样器。
       */
      UNIFORM_TANGENT_MORPH_TEXTURE_NAME = 'cc_TangentDisplacements';
      _export("UNIFORM_TANGENT_MORPH_TEXTURE_BINDING", UNIFORM_TANGENT_MORPH_TEXTURE_BINDING = ModelLocalBindings.SAMPLER_MORPH_TANGENT);
      UNIFORM_TANGENT_MORPH_TEXTURE_DESCRIPTOR = new DescriptorSetLayoutBinding(UNIFORM_TANGENT_MORPH_TEXTURE_BINDING, DescriptorType.SAMPLER_TEXTURE, 1, ShaderStageFlagBit.VERTEX, MemoryAccessBit.READ_ONLY, ViewDimension.TEX2D);
      UNIFORM_TANGENT_MORPH_TEXTURE_LAYOUT = new UniformSamplerTexture(SetIndex.LOCAL, UNIFORM_TANGENT_MORPH_TEXTURE_BINDING, UNIFORM_TANGENT_MORPH_TEXTURE_NAME, Type.SAMPLER2D, 1);
      localDescriptorSetLayout.layouts[UNIFORM_TANGENT_MORPH_TEXTURE_NAME] = UNIFORM_TANGENT_MORPH_TEXTURE_LAYOUT;
      localDescriptorSetLayout.bindings[UNIFORM_TANGENT_MORPH_TEXTURE_BINDING] = UNIFORM_TANGENT_MORPH_TEXTURE_DESCRIPTOR;

      /**
       * @en The sampler for light map texture
       * @zh 光照图纹理采样器。
       */
      UNIFORM_LIGHTMAP_TEXTURE_NAME = 'cc_lightingMap';
      _export("UNIFORM_LIGHTMAP_TEXTURE_BINDING", UNIFORM_LIGHTMAP_TEXTURE_BINDING = ModelLocalBindings.SAMPLER_LIGHTMAP);
      UNIFORM_LIGHTMAP_TEXTURE_DESCRIPTOR = new DescriptorSetLayoutBinding(UNIFORM_LIGHTMAP_TEXTURE_BINDING, DescriptorType.SAMPLER_TEXTURE, 1, ShaderStageFlagBit.FRAGMENT, MemoryAccessBit.READ_ONLY, ViewDimension.TEX2D);
      UNIFORM_LIGHTMAP_TEXTURE_LAYOUT = new UniformSamplerTexture(SetIndex.LOCAL, UNIFORM_LIGHTMAP_TEXTURE_BINDING, UNIFORM_LIGHTMAP_TEXTURE_NAME, Type.SAMPLER2D, 1);
      localDescriptorSetLayout.layouts[UNIFORM_LIGHTMAP_TEXTURE_NAME] = UNIFORM_LIGHTMAP_TEXTURE_LAYOUT;
      localDescriptorSetLayout.bindings[UNIFORM_LIGHTMAP_TEXTURE_BINDING] = UNIFORM_LIGHTMAP_TEXTURE_DESCRIPTOR;

      /**
       * @en The sampler for UI sprites.
       * @zh UI 精灵纹理采样器。
       */
      UNIFORM_SPRITE_TEXTURE_NAME = 'cc_spriteTexture';
      _export("UNIFORM_SPRITE_TEXTURE_BINDING", UNIFORM_SPRITE_TEXTURE_BINDING = ModelLocalBindings.SAMPLER_SPRITE);
      UNIFORM_SPRITE_TEXTURE_DESCRIPTOR = new DescriptorSetLayoutBinding(UNIFORM_SPRITE_TEXTURE_BINDING, DescriptorType.SAMPLER_TEXTURE, 1, ShaderStageFlagBit.FRAGMENT, MemoryAccessBit.READ_ONLY, ViewDimension.TEX2D);
      UNIFORM_SPRITE_TEXTURE_LAYOUT = new UniformSamplerTexture(SetIndex.LOCAL, UNIFORM_SPRITE_TEXTURE_BINDING, UNIFORM_SPRITE_TEXTURE_NAME, Type.SAMPLER2D, 1);
      localDescriptorSetLayout.layouts[UNIFORM_SPRITE_TEXTURE_NAME] = UNIFORM_SPRITE_TEXTURE_LAYOUT;
      localDescriptorSetLayout.bindings[UNIFORM_SPRITE_TEXTURE_BINDING] = UNIFORM_SPRITE_TEXTURE_DESCRIPTOR;

      /**
       * @en The sampler for reflection probe cubemap
       * @zh 反射探针立方体贴图纹理采样器。
       */
      UNIFORM_REFLECTION_PROBE_CUBEMAP_NAME = 'cc_reflectionProbeCubemap';
      _export("UNIFORM_REFLECTION_PROBE_CUBEMAP_BINDING", UNIFORM_REFLECTION_PROBE_CUBEMAP_BINDING = ModelLocalBindings.SAMPLER_REFLECTION_PROBE_CUBE);
      UNIFORM_REFLECTION_PROBE_CUBEMAP_DESCRIPTOR = new DescriptorSetLayoutBinding(UNIFORM_REFLECTION_PROBE_CUBEMAP_BINDING, DescriptorType.SAMPLER_TEXTURE, 1, ShaderStageFlagBit.FRAGMENT, MemoryAccessBit.READ_ONLY, ViewDimension.TEXCUBE);
      UNIFORM_REFLECTION_PROBE_CUBEMAP_LAYOUT = new UniformSamplerTexture(SetIndex.LOCAL, UNIFORM_REFLECTION_PROBE_CUBEMAP_BINDING, UNIFORM_REFLECTION_PROBE_CUBEMAP_NAME, Type.SAMPLER_CUBE, 1);
      localDescriptorSetLayout.layouts[UNIFORM_REFLECTION_PROBE_CUBEMAP_NAME] = UNIFORM_REFLECTION_PROBE_CUBEMAP_LAYOUT;
      localDescriptorSetLayout.bindings[UNIFORM_REFLECTION_PROBE_CUBEMAP_BINDING] = UNIFORM_REFLECTION_PROBE_CUBEMAP_DESCRIPTOR;

      /**
       * @en The sampler for reflection probe planar reflection
       * @zh 反射探针平面反射贴图纹理采样器。
       */
      UNIFORM_REFLECTION_PROBE_TEXTURE_NAME = 'cc_reflectionProbePlanarMap';
      _export("UNIFORM_REFLECTION_PROBE_TEXTURE_BINDING", UNIFORM_REFLECTION_PROBE_TEXTURE_BINDING = ModelLocalBindings.SAMPLER_REFLECTION_PROBE_PLANAR);
      UNIFORM_REFLECTION_PROBE_TEXTURE_DESCRIPTOR = new DescriptorSetLayoutBinding(UNIFORM_REFLECTION_PROBE_TEXTURE_BINDING, DescriptorType.SAMPLER_TEXTURE, 1, ShaderStageFlagBit.FRAGMENT, MemoryAccessBit.READ_ONLY, ViewDimension.TEX2D);
      UNIFORM_REFLECTION_PROBE_TEXTURE_LAYOUT = new UniformSamplerTexture(SetIndex.LOCAL, UNIFORM_REFLECTION_PROBE_TEXTURE_BINDING, UNIFORM_REFLECTION_PROBE_TEXTURE_NAME, Type.SAMPLER2D, 1);
      localDescriptorSetLayout.layouts[UNIFORM_REFLECTION_PROBE_TEXTURE_NAME] = UNIFORM_REFLECTION_PROBE_TEXTURE_LAYOUT;
      localDescriptorSetLayout.bindings[UNIFORM_REFLECTION_PROBE_TEXTURE_BINDING] = UNIFORM_REFLECTION_PROBE_TEXTURE_DESCRIPTOR;

      /**
       * @en The sampler for reflection probe data map
       * @zh 反射探针数据贴图采样器。
       */
      UNIFORM_REFLECTION_PROBE_DATA_MAP_NAME = 'cc_reflectionProbeDataMap';
      _export("UNIFORM_REFLECTION_PROBE_DATA_MAP_BINDING", UNIFORM_REFLECTION_PROBE_DATA_MAP_BINDING = ModelLocalBindings.SAMPLER_REFLECTION_PROBE_DATA_MAP);
      UNIFORM_REFLECTION_PROBE_DATA_MAP_DESCRIPTOR = new DescriptorSetLayoutBinding(UNIFORM_REFLECTION_PROBE_DATA_MAP_BINDING, DescriptorType.SAMPLER_TEXTURE, 1, ShaderStageFlagBit.FRAGMENT, MemoryAccessBit.READ_ONLY, ViewDimension.TEX2D);
      UNIFORM_REFLECTION_PROBE_DATA_MAP_LAYOUT = new UniformSamplerTexture(SetIndex.LOCAL, UNIFORM_REFLECTION_PROBE_DATA_MAP_BINDING, UNIFORM_REFLECTION_PROBE_DATA_MAP_NAME, Type.SAMPLER2D, 1);
      localDescriptorSetLayout.layouts[UNIFORM_REFLECTION_PROBE_DATA_MAP_NAME] = UNIFORM_REFLECTION_PROBE_DATA_MAP_LAYOUT;
      localDescriptorSetLayout.bindings[UNIFORM_REFLECTION_PROBE_DATA_MAP_BINDING] = UNIFORM_REFLECTION_PROBE_DATA_MAP_DESCRIPTOR;

      /**
       * @en The sampler for reflection probe cubemap for blend.
       * @zh 用于blend的反射探针立方体贴图纹理采样器。
       */
      UNIFORM_REFLECTION_PROBE_BLEND_CUBEMAP_NAME = 'cc_reflectionProbeBlendCubemap';
      _export("UNIFORM_REFLECTION_PROBE_BLEND_CUBEMAP_BINDING", UNIFORM_REFLECTION_PROBE_BLEND_CUBEMAP_BINDING = ModelLocalBindings.SAMPLER_REFLECTION_PROBE_DATA_MAP + 1); // SAMPLER_REFLECTION_PROBE_BLEND_CUBE
      UNIFORM_REFLECTION_PROBE_BLEND_CUBEMAP_DESCRIPTOR = new DescriptorSetLayoutBinding(UNIFORM_REFLECTION_PROBE_BLEND_CUBEMAP_BINDING, DescriptorType.SAMPLER_TEXTURE, 1, ShaderStageFlagBit.FRAGMENT, MemoryAccessBit.READ_ONLY, ViewDimension.TEXCUBE);
      UNIFORM_REFLECTION_PROBE_BLEND_CUBEMAP_LAYOUT = new UniformSamplerTexture(SetIndex.LOCAL, UNIFORM_REFLECTION_PROBE_BLEND_CUBEMAP_BINDING, UNIFORM_REFLECTION_PROBE_BLEND_CUBEMAP_NAME, Type.SAMPLER_CUBE, 1);
      /**
       * @engineInternal
       */
      _export("ENABLE_PROBE_BLEND", ENABLE_PROBE_BLEND = false);
      if (ENABLE_PROBE_BLEND) {
        localDescriptorSetLayout.layouts[UNIFORM_REFLECTION_PROBE_BLEND_CUBEMAP_NAME] = UNIFORM_REFLECTION_PROBE_BLEND_CUBEMAP_LAYOUT;
        localDescriptorSetLayout.bindings[UNIFORM_REFLECTION_PROBE_BLEND_CUBEMAP_BINDING] = UNIFORM_REFLECTION_PROBE_BLEND_CUBEMAP_DESCRIPTOR;
      }
      _export("CAMERA_DEFAULT_MASK", CAMERA_DEFAULT_MASK = Layers.makeMaskExclude([Layers.BitMask.UI_2D, Layers.BitMask.GIZMOS, Layers.BitMask.EDITOR, Layers.BitMask.SCENE_GIZMO, Layers.BitMask.PROFILER]));
      _export("CAMERA_EDITOR_MASK", CAMERA_EDITOR_MASK = Layers.makeMaskExclude([Layers.BitMask.UI_2D, Layers.BitMask.PROFILER]));
      _export("MODEL_ALWAYS_MASK", MODEL_ALWAYS_MASK = Layers.Enum.ALL);
    }
  };
});