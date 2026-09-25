System.register("q-bundled:///fs/cocos/rendering/custom/types.js", ["../../gfx/index.js", "../../core/memop/index.js"], function (_export, _context) {
  "use strict";

  var ResolveMode, RecyclePool, LightInfo, ResolvePair, CopyPair, UploadPair, MovePair, PipelineStatistics, RenderCommonObjectPool, UpdateFrequency, ParameterType, ResourceResidency, QueueHint, ResourceDimension, ResourceFlags, TaskType, SceneFlags, LightingMode, AttachmentType, AccessType, ClearValueType, ResolveFlags;
  function createPool(Constructor) {
    return new RecyclePool(() => new Constructor(), 16);
  }
  function saveLightInfo(a, v) {
    // skip, v.light: Light
    // skip, v.probe: ReflectionProbe
    a.n(v.level);
    a.b(v.culledByLight);
  }
  function loadLightInfo(a, v) {
    // skip, v.light: Light
    // skip, v.probe: ReflectionProbe
    v.level = a.n();
    v.culledByLight = a.b();
  }
  function saveResolvePair(a, v) {
    a.s(v.source);
    a.s(v.target);
    a.n(v.resolveFlags);
    a.n(v.mode);
    a.n(v.mode1);
  }
  function loadResolvePair(a, v) {
    v.source = a.s();
    v.target = a.s();
    v.resolveFlags = a.n();
    v.mode = a.n();
    v.mode1 = a.n();
  }
  function saveCopyPair(a, v) {
    a.s(v.source);
    a.s(v.target);
    a.n(v.mipLevels);
    a.n(v.numSlices);
    a.n(v.sourceMostDetailedMip);
    a.n(v.sourceFirstSlice);
    a.n(v.sourcePlaneSlice);
    a.n(v.targetMostDetailedMip);
    a.n(v.targetFirstSlice);
    a.n(v.targetPlaneSlice);
  }
  function loadCopyPair(a, v) {
    v.source = a.s();
    v.target = a.s();
    v.mipLevels = a.n();
    v.numSlices = a.n();
    v.sourceMostDetailedMip = a.n();
    v.sourceFirstSlice = a.n();
    v.sourcePlaneSlice = a.n();
    v.targetMostDetailedMip = a.n();
    v.targetFirstSlice = a.n();
    v.targetPlaneSlice = a.n();
  }
  function saveMovePair(a, v) {
    a.s(v.source);
    a.s(v.target);
    a.n(v.mipLevels);
    a.n(v.numSlices);
    a.n(v.targetMostDetailedMip);
    a.n(v.targetFirstSlice);
    a.n(v.targetPlaneSlice);
  }
  function loadMovePair(a, v) {
    v.source = a.s();
    v.target = a.s();
    v.mipLevels = a.n();
    v.numSlices = a.n();
    v.targetMostDetailedMip = a.n();
    v.targetFirstSlice = a.n();
    v.targetPlaneSlice = a.n();
  }
  function savePipelineStatistics(a, v) {
    a.n(v.numRenderPasses);
    a.n(v.numManagedTextures);
    a.n(v.totalManagedTextures);
    a.n(v.numUploadBuffers);
    a.n(v.numUploadBufferViews);
    a.n(v.numFreeUploadBuffers);
    a.n(v.numFreeUploadBufferViews);
    a.n(v.numDescriptorSets);
    a.n(v.numFreeDescriptorSets);
    a.n(v.numInstancingBuffers);
    a.n(v.numInstancingUniformBlocks);
  }
  function loadPipelineStatistics(a, v) {
    v.numRenderPasses = a.n();
    v.numManagedTextures = a.n();
    v.totalManagedTextures = a.n();
    v.numUploadBuffers = a.n();
    v.numUploadBufferViews = a.n();
    v.numFreeUploadBuffers = a.n();
    v.numFreeUploadBufferViews = a.n();
    v.numDescriptorSets = a.n();
    v.numFreeDescriptorSets = a.n();
    v.numInstancingBuffers = a.n();
    v.numInstancingUniformBlocks = a.n();
  }
  _export({
    LightInfo: void 0,
    ResolvePair: void 0,
    CopyPair: void 0,
    UploadPair: void 0,
    MovePair: void 0,
    PipelineStatistics: void 0,
    RenderCommonObjectPool: void 0,
    saveLightInfo: saveLightInfo,
    loadLightInfo: loadLightInfo,
    saveResolvePair: saveResolvePair,
    loadResolvePair: loadResolvePair,
    saveCopyPair: saveCopyPair,
    loadCopyPair: loadCopyPair,
    saveMovePair: saveMovePair,
    loadMovePair: loadMovePair,
    savePipelineStatistics: savePipelineStatistics,
    loadPipelineStatistics: loadPipelineStatistics
  });
  return {
    setters: [function (_gfxIndexJs) {
      ResolveMode = _gfxIndexJs.ResolveMode;
    }, function (_coreMemopIndexJs) {
      RecyclePool = _coreMemopIndexJs.RecyclePool;
    }],
    execute: function () {
      /*
       Copyright (c) 2021-2024 Xiamen Yaji Software Co., Ltd.
      
       https://www.cocos.com
      
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
       * ========================= !DO NOT CHANGE THE FOLLOWING SECTION MANUALLY! =========================
       * The following section is auto-generated.
       * ========================= !DO NOT CHANGE THE FOLLOWING SECTION MANUALLY! =========================
       */
      /* eslint-disable max-len */
      _export("UpdateFrequency", UpdateFrequency = /*#__PURE__*/function (UpdateFrequency) {
        UpdateFrequency[UpdateFrequency["PER_INSTANCE"] = 0] = "PER_INSTANCE";
        UpdateFrequency[UpdateFrequency["PER_BATCH"] = 1] = "PER_BATCH";
        UpdateFrequency[UpdateFrequency["PER_PHASE"] = 2] = "PER_PHASE";
        UpdateFrequency[UpdateFrequency["PER_PASS"] = 3] = "PER_PASS";
        UpdateFrequency[UpdateFrequency["COUNT"] = 4] = "COUNT";
        return UpdateFrequency;
      }({}));
      _export("ParameterType", ParameterType = {
        CONSTANTS: 0,
        CBV: 1,
        UAV: 2,
        SRV: 3,
        TABLE: 4,
        SSV: 5
      });
      _export("ResourceResidency", ResourceResidency = /*#__PURE__*/function (ResourceResidency) {
        ResourceResidency[ResourceResidency["MANAGED"] = 0] = "MANAGED";
        ResourceResidency[ResourceResidency["MEMORYLESS"] = 1] = "MEMORYLESS";
        ResourceResidency[ResourceResidency["PERSISTENT"] = 2] = "PERSISTENT";
        ResourceResidency[ResourceResidency["EXTERNAL"] = 3] = "EXTERNAL";
        ResourceResidency[ResourceResidency["BACKBUFFER"] = 4] = "BACKBUFFER";
        return ResourceResidency;
      }({}));
      _export("QueueHint", QueueHint = /*#__PURE__*/function (QueueHint) {
        QueueHint[QueueHint["NONE"] = 0] = "NONE";
        QueueHint[QueueHint["OPAQUE"] = 1] = "OPAQUE";
        QueueHint[QueueHint["MASK"] = 2] = "MASK";
        QueueHint[QueueHint["BLEND"] = 3] = "BLEND";
        QueueHint[QueueHint["RENDER_OPAQUE"] = 1] = "RENDER_OPAQUE";
        QueueHint[QueueHint["RENDER_CUTOUT"] = 2] = "RENDER_CUTOUT";
        QueueHint[QueueHint["RENDER_TRANSPARENT"] = 3] = "RENDER_TRANSPARENT";
        return QueueHint;
      }({}));
      _export("ResourceDimension", ResourceDimension = /*#__PURE__*/function (ResourceDimension) {
        ResourceDimension[ResourceDimension["BUFFER"] = 0] = "BUFFER";
        ResourceDimension[ResourceDimension["TEXTURE1D"] = 1] = "TEXTURE1D";
        ResourceDimension[ResourceDimension["TEXTURE2D"] = 2] = "TEXTURE2D";
        ResourceDimension[ResourceDimension["TEXTURE3D"] = 3] = "TEXTURE3D";
        return ResourceDimension;
      }({}));
      _export("ResourceFlags", ResourceFlags = /*#__PURE__*/function (ResourceFlags) {
        ResourceFlags[ResourceFlags["NONE"] = 0] = "NONE";
        ResourceFlags[ResourceFlags["UNIFORM"] = 1] = "UNIFORM";
        ResourceFlags[ResourceFlags["INDIRECT"] = 2] = "INDIRECT";
        ResourceFlags[ResourceFlags["STORAGE"] = 4] = "STORAGE";
        ResourceFlags[ResourceFlags["SAMPLED"] = 8] = "SAMPLED";
        ResourceFlags[ResourceFlags["COLOR_ATTACHMENT"] = 16] = "COLOR_ATTACHMENT";
        ResourceFlags[ResourceFlags["DEPTH_STENCIL_ATTACHMENT"] = 32] = "DEPTH_STENCIL_ATTACHMENT";
        ResourceFlags[ResourceFlags["INPUT_ATTACHMENT"] = 64] = "INPUT_ATTACHMENT";
        ResourceFlags[ResourceFlags["SHADING_RATE"] = 128] = "SHADING_RATE";
        ResourceFlags[ResourceFlags["TRANSFER_SRC"] = 256] = "TRANSFER_SRC";
        ResourceFlags[ResourceFlags["TRANSFER_DST"] = 512] = "TRANSFER_DST";
        return ResourceFlags;
      }({}));
      _export("TaskType", TaskType = {
        SYNC: 0,
        ASYNC: 1
      });
      _export("SceneFlags", SceneFlags = /*#__PURE__*/function (SceneFlags) {
        SceneFlags[SceneFlags["NONE"] = 0] = "NONE";
        SceneFlags[SceneFlags["OPAQUE"] = 1] = "OPAQUE";
        SceneFlags[SceneFlags["MASK"] = 2] = "MASK";
        SceneFlags[SceneFlags["BLEND"] = 4] = "BLEND";
        /**
         * @deprecated Please use OPAQUE.
         */
        SceneFlags[SceneFlags["OPAQUE_OBJECT"] = 1] = "OPAQUE_OBJECT";
        /**
         * @deprecated Please use MASK.
         */
        SceneFlags[SceneFlags["CUTOUT_OBJECT"] = 2] = "CUTOUT_OBJECT";
        /**
         * @deprecated Please use BLEND.
         */
        SceneFlags[SceneFlags["TRANSPARENT_OBJECT"] = 4] = "TRANSPARENT_OBJECT";
        SceneFlags[SceneFlags["SHADOW_CASTER"] = 8] = "SHADOW_CASTER";
        /**
         * @deprecated Please add 2D node in the render graph.
         */
        SceneFlags[SceneFlags["UI"] = 16] = "UI";
        SceneFlags[SceneFlags["DEFAULT_LIGHTING"] = 32] = "DEFAULT_LIGHTING";
        SceneFlags[SceneFlags["VOLUMETRIC_LIGHTING"] = 64] = "VOLUMETRIC_LIGHTING";
        SceneFlags[SceneFlags["CLUSTERED_LIGHTING"] = 128] = "CLUSTERED_LIGHTING";
        SceneFlags[SceneFlags["PLANAR_SHADOW"] = 256] = "PLANAR_SHADOW";
        SceneFlags[SceneFlags["GEOMETRY"] = 512] = "GEOMETRY";
        /**
         * @deprecated Please add profiler node in the render graph.
         */
        SceneFlags[SceneFlags["PROFILER"] = 1024] = "PROFILER";
        SceneFlags[SceneFlags["DRAW_INSTANCING"] = 2048] = "DRAW_INSTANCING";
        SceneFlags[SceneFlags["DRAW_NON_INSTANCING"] = 4096] = "DRAW_NON_INSTANCING";
        SceneFlags[SceneFlags["REFLECTION_PROBE"] = 8192] = "REFLECTION_PROBE";
        SceneFlags[SceneFlags["GPU_DRIVEN"] = 16384] = "GPU_DRIVEN";
        SceneFlags[SceneFlags["NON_BUILTIN"] = 32768] = "NON_BUILTIN";
        SceneFlags[SceneFlags["ALL"] = 4294967295] = "ALL";
        return SceneFlags;
      }({}));
      _export("LightingMode", LightingMode = {
        NONE: 0,
        DEFAULT: 1,
        CLUSTERED: 2
      });
      _export("AttachmentType", AttachmentType = {
        RENDER_TARGET: 0,
        DEPTH_STENCIL: 1,
        SHADING_RATE: 2
      });
      _export("AccessType", AccessType = /*#__PURE__*/function (AccessType) {
        AccessType[AccessType["READ"] = 0] = "READ";
        AccessType[AccessType["READ_WRITE"] = 1] = "READ_WRITE";
        AccessType[AccessType["WRITE"] = 2] = "WRITE";
        return AccessType;
      }({}));
      _export("ClearValueType", ClearValueType = {
        NONE: 0,
        FLOAT_TYPE: 1,
        INT_TYPE: 2
      });
      _export("LightInfo", LightInfo = class LightInfo {
        constructor(light = null, level = 0, culledByLight = false, probe = null) {
          this.light = light;
          this.probe = probe;
          this.level = level;
          this.culledByLight = culledByLight;
        }
        reset(light, level, culledByLight, probe) {
          this.light = light;
          this.probe = probe;
          this.level = level;
          this.culledByLight = culledByLight;
        }
      });
      _export("ResolveFlags", ResolveFlags = {
        NONE: 0,
        COLOR: 1,
        DEPTH: 2,
        STENCIL: 4
      });
      _export("ResolvePair", ResolvePair = class ResolvePair {
        constructor(source = '', target = '', resolveFlags = ResolveFlags.NONE, mode = ResolveMode.SAMPLE_ZERO, mode1 = ResolveMode.SAMPLE_ZERO) {
          this.source = source;
          this.target = target;
          this.resolveFlags = resolveFlags;
          this.mode = mode;
          this.mode1 = mode1;
        }
        reset(source, target, resolveFlags, mode, mode1) {
          this.source = source;
          this.target = target;
          this.resolveFlags = resolveFlags;
          this.mode = mode;
          this.mode1 = mode1;
        }
      });
      _export("CopyPair", CopyPair = class CopyPair {
        constructor(source = '', target = '', mipLevels = 0xFFFFFFFF, numSlices = 0xFFFFFFFF, sourceMostDetailedMip = 0, sourceFirstSlice = 0, sourcePlaneSlice = 0, targetMostDetailedMip = 0, targetFirstSlice = 0, targetPlaneSlice = 0) {
          this.source = source;
          this.target = target;
          this.mipLevels = mipLevels;
          this.numSlices = numSlices;
          this.sourceMostDetailedMip = sourceMostDetailedMip;
          this.sourceFirstSlice = sourceFirstSlice;
          this.sourcePlaneSlice = sourcePlaneSlice;
          this.targetMostDetailedMip = targetMostDetailedMip;
          this.targetFirstSlice = targetFirstSlice;
          this.targetPlaneSlice = targetPlaneSlice;
        }
        reset(source, target, mipLevels, numSlices, sourceMostDetailedMip, sourceFirstSlice, sourcePlaneSlice, targetMostDetailedMip, targetFirstSlice, targetPlaneSlice) {
          this.source = source;
          this.target = target;
          this.mipLevels = mipLevels;
          this.numSlices = numSlices;
          this.sourceMostDetailedMip = sourceMostDetailedMip;
          this.sourceFirstSlice = sourceFirstSlice;
          this.sourcePlaneSlice = sourcePlaneSlice;
          this.targetMostDetailedMip = targetMostDetailedMip;
          this.targetFirstSlice = targetFirstSlice;
          this.targetPlaneSlice = targetPlaneSlice;
        }
      });
      _export("UploadPair", UploadPair = class UploadPair {
        constructor(source = new Uint8Array(0), target = '', mipLevels = 0xFFFFFFFF, numSlices = 0xFFFFFFFF, targetMostDetailedMip = 0, targetFirstSlice = 0, targetPlaneSlice = 0) {
          this.source = source;
          this.target = target;
          this.mipLevels = mipLevels;
          this.numSlices = numSlices;
          this.targetMostDetailedMip = targetMostDetailedMip;
          this.targetFirstSlice = targetFirstSlice;
          this.targetPlaneSlice = targetPlaneSlice;
        }
        reset(target, mipLevels, numSlices, targetMostDetailedMip, targetFirstSlice, targetPlaneSlice) {
          // source: Uint8Array size unchanged
          this.target = target;
          this.mipLevels = mipLevels;
          this.numSlices = numSlices;
          this.targetMostDetailedMip = targetMostDetailedMip;
          this.targetFirstSlice = targetFirstSlice;
          this.targetPlaneSlice = targetPlaneSlice;
        }
      });
      _export("MovePair", MovePair = class MovePair {
        constructor(source = '', target = '', mipLevels = 0xFFFFFFFF, numSlices = 0xFFFFFFFF, targetMostDetailedMip = 0, targetFirstSlice = 0, targetPlaneSlice = 0) {
          this.source = source;
          this.target = target;
          this.mipLevels = mipLevels;
          this.numSlices = numSlices;
          this.targetMostDetailedMip = targetMostDetailedMip;
          this.targetFirstSlice = targetFirstSlice;
          this.targetPlaneSlice = targetPlaneSlice;
        }
        reset(source, target, mipLevels, numSlices, targetMostDetailedMip, targetFirstSlice, targetPlaneSlice) {
          this.source = source;
          this.target = target;
          this.mipLevels = mipLevels;
          this.numSlices = numSlices;
          this.targetMostDetailedMip = targetMostDetailedMip;
          this.targetFirstSlice = targetFirstSlice;
          this.targetPlaneSlice = targetPlaneSlice;
        }
      });
      _export("PipelineStatistics", PipelineStatistics = class PipelineStatistics {
        constructor() {
          this.numRenderPasses = 0;
          this.numManagedTextures = 0;
          this.totalManagedTextures = 0;
          this.numUploadBuffers = 0;
          this.numUploadBufferViews = 0;
          this.numFreeUploadBuffers = 0;
          this.numFreeUploadBufferViews = 0;
          this.numDescriptorSets = 0;
          this.numFreeDescriptorSets = 0;
          this.numInstancingBuffers = 0;
          this.numInstancingUniformBlocks = 0;
        }
        reset() {
          this.numRenderPasses = 0;
          this.numManagedTextures = 0;
          this.totalManagedTextures = 0;
          this.numUploadBuffers = 0;
          this.numUploadBufferViews = 0;
          this.numFreeUploadBuffers = 0;
          this.numFreeUploadBufferViews = 0;
          this.numDescriptorSets = 0;
          this.numFreeDescriptorSets = 0;
          this.numInstancingBuffers = 0;
          this.numInstancingUniformBlocks = 0;
        }
      });
      _export("RenderCommonObjectPool", RenderCommonObjectPool = class RenderCommonObjectPool {
        constructor() {
          this.li = createPool(LightInfo);
          this.rp = createPool(ResolvePair);
          this.cp = createPool(CopyPair);
          this.up = createPool(UploadPair);
          this.mp = createPool(MovePair);
          this.ps = createPool(PipelineStatistics);
        }
        reset() {
          this.li.reset(); // LightInfo
          this.rp.reset(); // ResolvePair
          this.cp.reset(); // CopyPair
          this.up.reset(); // UploadPair
          this.mp.reset(); // MovePair
          this.ps.reset(); // PipelineStatistics
        }
        createLightInfo(light = null, level = 0, culledByLight = false, probe = null) {
          const v = this.li.add(); // LightInfo
          v.reset(light, level, culledByLight, probe);
          return v;
        }
        createResolvePair(source = '', target = '', resolveFlags = ResolveFlags.NONE, mode = ResolveMode.SAMPLE_ZERO, mode1 = ResolveMode.SAMPLE_ZERO) {
          const v = this.rp.add(); // ResolvePair
          v.reset(source, target, resolveFlags, mode, mode1);
          return v;
        }
        createCopyPair(source = '', target = '', mipLevels = 0xFFFFFFFF, numSlices = 0xFFFFFFFF, sourceMostDetailedMip = 0, sourceFirstSlice = 0, sourcePlaneSlice = 0, targetMostDetailedMip = 0, targetFirstSlice = 0, targetPlaneSlice = 0) {
          const v = this.cp.add(); // CopyPair
          v.reset(source, target, mipLevels, numSlices, sourceMostDetailedMip, sourceFirstSlice, sourcePlaneSlice, targetMostDetailedMip, targetFirstSlice, targetPlaneSlice);
          return v;
        }
        createUploadPair(target = '', mipLevels = 0xFFFFFFFF, numSlices = 0xFFFFFFFF, targetMostDetailedMip = 0, targetFirstSlice = 0, targetPlaneSlice = 0) {
          const v = this.up.add(); // UploadPair
          v.reset(target, mipLevels, numSlices, targetMostDetailedMip, targetFirstSlice, targetPlaneSlice);
          return v;
        }
        createMovePair(source = '', target = '', mipLevels = 0xFFFFFFFF, numSlices = 0xFFFFFFFF, targetMostDetailedMip = 0, targetFirstSlice = 0, targetPlaneSlice = 0) {
          const v = this.mp.add(); // MovePair
          v.reset(source, target, mipLevels, numSlices, targetMostDetailedMip, targetFirstSlice, targetPlaneSlice);
          return v;
        }
        createPipelineStatistics() {
          const v = this.ps.add(); // PipelineStatistics
          v.reset();
          return v;
        }
      });
    }
  };
});