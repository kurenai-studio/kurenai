System.register("q-bundled:///fs/cocos/gfx/webgpu/webgpu-device.js", ["../base/device.js", "../base/states/sampler.js", "./webgpu-descriptor-set.js", "./webgpu-buffer.js", "./webgpu-command-buffer.js", "./webgpu-framebuffer.js", "./webgpu-input-assembler.js", "./webgpu-descriptor-set-layout.js", "./webgpu-pipeline-layout.js", "./webgpu-pipeline-state.js", "./webgpu-queue.js", "./webgpu-render-pass.js", "./webgpu-sampler.js", "./webgpu-shader.js", "./webgpu-state-cache.js", "./webgpu-texture.js", "./define.js", "../base/define.js", "./webgpu-command-allocator.js", "../base/states/general-barrier.js", "../base/states/texture-barrier.js", "../base/states/buffer-barrier.js", "./webgpu-swapchain.js", "../../core/index.js", "./webgpu-commands.js", "./instantiated.js"], function (_export, _context) {
  "use strict";

  var Device, Sampler, WebGPUDescriptorSet, WebGPUBuffer, WebGPUCommandBuffer, WebGPUFramebuffer, WebGPUInputAssembler, WebGPUDescriptorSetLayout, WebGPUPipelineLayout, WebGPUPipelineState, WebGPUQueue, WebGPURenderPass, WebGPUSampler, WebGPUShader, WebGPUStateCache, WebGPUTexture, DefaultResources, hashCombineNum, hashCombineStr, webGPU, WebGPUDeviceManager, Format, QueueType, Feature, Size, DescriptorSetInfo, BufferInfo, CommandBufferInfo, QueueInfo, SamplerInfo, DescriptorSetLayoutInfo, TextureInfo, API, FormatFeatureBit, TextureType, TextureUsageBit, TextureFlagBit, SampleCount, BufferUsageBit, MemoryUsageBit, BufferFlagBit, DescriptorSetLayoutBinding, DescriptorType, ShaderStageFlagBit, WebGPUCommandAllocator, GeneralBarrier, TextureBarrier, BufferBarrier, WebGPUSwapchain, debug, warn, WebGPUCmdFuncCopyBuffersToTexture, WebGPUCmdFuncCopyTexImagesToTexture, WebGPUCmdFuncCopyTextureToBuffer, WGPUFormatToGFXFormat, waitForWebGPUWasmInstantiation, WebGPUDevice, loadWebGPUPromise;
  /*
   Copyright (c) 2024 Xiamen Yaji Software Co., Ltd.
  
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

  function loadWebGPUWasmModule() {
    if (loadWebGPUPromise) return loadWebGPUPromise;
    loadWebGPUPromise = Promise.resolve().then(() => waitForWebGPUWasmInstantiation());
    return loadWebGPUPromise;
  }
  _export({
    loadWebGPUWasmModule: loadWebGPUWasmModule,
    WebGPUDevice: void 0
  });
  return {
    setters: [function (_baseDeviceJs) {
      Device = _baseDeviceJs.Device;
    }, function (_baseStatesSamplerJs) {
      Sampler = _baseStatesSamplerJs.Sampler;
    }, function (_webgpuDescriptorSetJs) {
      WebGPUDescriptorSet = _webgpuDescriptorSetJs.WebGPUDescriptorSet;
    }, function (_webgpuBufferJs) {
      WebGPUBuffer = _webgpuBufferJs.WebGPUBuffer;
    }, function (_webgpuCommandBufferJs) {
      WebGPUCommandBuffer = _webgpuCommandBufferJs.WebGPUCommandBuffer;
    }, function (_webgpuFramebufferJs) {
      WebGPUFramebuffer = _webgpuFramebufferJs.WebGPUFramebuffer;
    }, function (_webgpuInputAssemblerJs) {
      WebGPUInputAssembler = _webgpuInputAssemblerJs.WebGPUInputAssembler;
    }, function (_webgpuDescriptorSetLayoutJs) {
      WebGPUDescriptorSetLayout = _webgpuDescriptorSetLayoutJs.WebGPUDescriptorSetLayout;
    }, function (_webgpuPipelineLayoutJs) {
      WebGPUPipelineLayout = _webgpuPipelineLayoutJs.WebGPUPipelineLayout;
    }, function (_webgpuPipelineStateJs) {
      WebGPUPipelineState = _webgpuPipelineStateJs.WebGPUPipelineState;
    }, function (_webgpuQueueJs) {
      WebGPUQueue = _webgpuQueueJs.WebGPUQueue;
    }, function (_webgpuRenderPassJs) {
      WebGPURenderPass = _webgpuRenderPassJs.WebGPURenderPass;
    }, function (_webgpuSamplerJs) {
      WebGPUSampler = _webgpuSamplerJs.WebGPUSampler;
    }, function (_webgpuShaderJs) {
      WebGPUShader = _webgpuShaderJs.WebGPUShader;
    }, function (_webgpuStateCacheJs) {
      WebGPUStateCache = _webgpuStateCacheJs.WebGPUStateCache;
    }, function (_webgpuTextureJs) {
      WebGPUTexture = _webgpuTextureJs.WebGPUTexture;
    }, function (_defineJs) {
      DefaultResources = _defineJs.DefaultResources;
      hashCombineNum = _defineJs.hashCombineNum;
      hashCombineStr = _defineJs.hashCombineStr;
      webGPU = _defineJs.webGPU;
      WebGPUDeviceManager = _defineJs.WebGPUDeviceManager;
    }, function (_baseDefineJs) {
      Format = _baseDefineJs.Format;
      QueueType = _baseDefineJs.QueueType;
      Feature = _baseDefineJs.Feature;
      Size = _baseDefineJs.Size;
      DescriptorSetInfo = _baseDefineJs.DescriptorSetInfo;
      BufferInfo = _baseDefineJs.BufferInfo;
      CommandBufferInfo = _baseDefineJs.CommandBufferInfo;
      QueueInfo = _baseDefineJs.QueueInfo;
      SamplerInfo = _baseDefineJs.SamplerInfo;
      DescriptorSetLayoutInfo = _baseDefineJs.DescriptorSetLayoutInfo;
      TextureInfo = _baseDefineJs.TextureInfo;
      API = _baseDefineJs.API;
      FormatFeatureBit = _baseDefineJs.FormatFeatureBit;
      TextureType = _baseDefineJs.TextureType;
      TextureUsageBit = _baseDefineJs.TextureUsageBit;
      TextureFlagBit = _baseDefineJs.TextureFlagBit;
      SampleCount = _baseDefineJs.SampleCount;
      BufferUsageBit = _baseDefineJs.BufferUsageBit;
      MemoryUsageBit = _baseDefineJs.MemoryUsageBit;
      BufferFlagBit = _baseDefineJs.BufferFlagBit;
      DescriptorSetLayoutBinding = _baseDefineJs.DescriptorSetLayoutBinding;
      DescriptorType = _baseDefineJs.DescriptorType;
      ShaderStageFlagBit = _baseDefineJs.ShaderStageFlagBit;
    }, function (_webgpuCommandAllocatorJs) {
      WebGPUCommandAllocator = _webgpuCommandAllocatorJs.WebGPUCommandAllocator;
    }, function (_baseStatesGeneralBarrierJs) {
      GeneralBarrier = _baseStatesGeneralBarrierJs.GeneralBarrier;
    }, function (_baseStatesTextureBarrierJs) {
      TextureBarrier = _baseStatesTextureBarrierJs.TextureBarrier;
    }, function (_baseStatesBufferBarrierJs) {
      BufferBarrier = _baseStatesBufferBarrierJs.BufferBarrier;
    }, function (_webgpuSwapchainJs) {
      WebGPUSwapchain = _webgpuSwapchainJs.WebGPUSwapchain;
    }, function (_coreIndexJs) {
      debug = _coreIndexJs.debug;
      warn = _coreIndexJs.warn;
    }, function (_webgpuCommandsJs) {
      WebGPUCmdFuncCopyBuffersToTexture = _webgpuCommandsJs.WebGPUCmdFuncCopyBuffersToTexture;
      WebGPUCmdFuncCopyTexImagesToTexture = _webgpuCommandsJs.WebGPUCmdFuncCopyTexImagesToTexture;
      WebGPUCmdFuncCopyTextureToBuffer = _webgpuCommandsJs.WebGPUCmdFuncCopyTextureToBuffer;
      WGPUFormatToGFXFormat = _webgpuCommandsJs.WGPUFormatToGFXFormat;
    }, function (_instantiatedJs) {
      waitForWebGPUWasmInstantiation = _instantiatedJs.waitForWebGPUWasmInstantiation;
    }],
    execute: function () {
      _export("WebGPUDevice", WebGPUDevice = class WebGPUDevice extends Device {
        constructor(...args) {
          super(...args);
          this.stateCache = new WebGPUStateCache();
          this.cmdAllocator = new WebGPUCommandAllocator();
          this.nullTex2D = null;
          this.nullTexCube = null;
          this.defaultResource = new DefaultResources();
          this._adapter = null;
          this._device = null;
          this._context = null;
          this._swapchain = null;
          this._glslang = void 0;
          this._twgsl = void 0;
          this._bindingMappings = null;
          this._multiDrawIndirect = false;
          this._gpuConfig = null;
          this._textureExclusive = new Array(Format.COUNT);
        }
        createSwapchain(info) {
          const swapchain = new WebGPUSwapchain();
          this._swapchain = swapchain;
          swapchain.initialize(info);
          return swapchain;
        }
        getSampler(info) {
          const hash = Sampler.computeHash(info);
          if (!this._samplers.has(hash)) {
            this._samplers.set(hash, new WebGPUSampler(info, hash));
          }
          return this._samplers.get(hash);
        }
        getSwapchains() {
          return [this._swapchain];
        }
        getGeneralBarrier(info) {
          const hash = GeneralBarrier.computeHash(info);
          if (!this._generalBarrierss.has(hash)) {
            this._generalBarrierss.set(hash, new GeneralBarrier(info, hash));
          }
          return this._generalBarrierss.get(hash);
        }
        getTextureBarrier(info) {
          const hash = TextureBarrier.computeHash(info);
          if (!this._textureBarriers.has(hash)) {
            this._textureBarriers.set(hash, new TextureBarrier(info, hash));
          }
          return this._textureBarriers.get(hash);
        }
        getBufferBarrier(info) {
          const hash = BufferBarrier.computeHash(info);
          if (!this._bufferBarriers.has(hash)) {
            this._bufferBarriers.set(hash, new BufferBarrier(info, hash));
          }
          return this._bufferBarriers.get(hash);
        }
        async copyTextureToBuffers(texture, buffers, regions) {
          await WebGPUCmdFuncCopyTextureToBuffer(this, texture.gpuTexture, buffers, regions);
        }
        flushCommands(cmdBuffs) {
          // noop
        }
        get isPremultipliedAlpha() {
          if (!this._gpuConfig) {
            return false;
          }
          return this._gpuConfig.alphaMode === 'premultiplied';
        }
        get multiDrawIndirectSupport() {
          return this._multiDrawIndirect;
        }
        get bindingMappings() {
          return this._bindingMappings;
        }
        get context() {
          return this._context;
        }
        async initialize(info) {
          WebGPUDeviceManager.setInstance(this);
          return this.initDevice(info);
        }
        set gpuConfig(config) {
          this._gpuConfig = config;
        }
        get gpuConfig() {
          return this._gpuConfig;
        }
        initFormatFeatures(exts) {
          this._formatFeatures.fill(FormatFeatureBit.NONE);
          this._textureExclusive.fill(true);
          let tempFeature = FormatFeatureBit.RENDER_TARGET | FormatFeatureBit.SAMPLED_TEXTURE | FormatFeatureBit.STORAGE_TEXTURE | FormatFeatureBit.LINEAR_FILTER | FormatFeatureBit.VERTEX_ATTRIBUTE;
          this._formatFeatures[Format.R8] = tempFeature;
          this._formatFeatures[Format.RG8] = tempFeature;
          this._formatFeatures[Format.RGB8] = tempFeature;
          this._formatFeatures[Format.RGBA8] = tempFeature;
          tempFeature = FormatFeatureBit.RENDER_TARGET | FormatFeatureBit.SAMPLED_TEXTURE | FormatFeatureBit.STORAGE_TEXTURE | FormatFeatureBit.LINEAR_FILTER;
          this._formatFeatures[Format.R8SN] = tempFeature;
          this._formatFeatures[Format.RG8SN] = tempFeature;
          this._formatFeatures[Format.RGB8SN] = tempFeature;
          this._formatFeatures[Format.RGBA8SN] = tempFeature;
          this._formatFeatures[Format.R5G6B5] = tempFeature;
          this._formatFeatures[Format.RGBA4] = tempFeature;
          this._formatFeatures[Format.RGB5A1] = tempFeature;
          this._formatFeatures[Format.RGB10A2] = tempFeature;
          this._formatFeatures[Format.SRGB8] = tempFeature;
          this._formatFeatures[Format.SRGB8_A8] = tempFeature;
          this._formatFeatures[Format.R11G11B10F] = tempFeature;
          this._formatFeatures[Format.RGB9E5] = tempFeature;
          this._formatFeatures[Format.DEPTH] = tempFeature;
          this._formatFeatures[Format.DEPTH_STENCIL] = tempFeature;
          this._formatFeatures[Format.RGB10A2UI] = FormatFeatureBit.RENDER_TARGET | FormatFeatureBit.STORAGE_TEXTURE | FormatFeatureBit.SAMPLED_TEXTURE | FormatFeatureBit.LINEAR_FILTER;
          tempFeature = FormatFeatureBit.RENDER_TARGET | FormatFeatureBit.SAMPLED_TEXTURE | FormatFeatureBit.STORAGE_TEXTURE | FormatFeatureBit.VERTEX_ATTRIBUTE;
          this._formatFeatures[Format.R16F] = tempFeature;
          this._formatFeatures[Format.RG16F] = tempFeature;
          this._formatFeatures[Format.RGB16F] = tempFeature;
          this._formatFeatures[Format.RGBA16F] = tempFeature;
          tempFeature = FormatFeatureBit.STORAGE_TEXTURE | FormatFeatureBit.RENDER_TARGET | FormatFeatureBit.SAMPLED_TEXTURE | FormatFeatureBit.VERTEX_ATTRIBUTE;
          this._formatFeatures[Format.R32F] = tempFeature;
          this._formatFeatures[Format.RG32F] = tempFeature;
          this._formatFeatures[Format.RGB32F] = tempFeature;
          this._formatFeatures[Format.RGBA32F] = tempFeature;
          this._formatFeatures[Format.RGB10A2UI] = FormatFeatureBit.RENDER_TARGET | FormatFeatureBit.STORAGE_TEXTURE | FormatFeatureBit.SAMPLED_TEXTURE | FormatFeatureBit.LINEAR_FILTER;
          tempFeature = FormatFeatureBit.RENDER_TARGET | FormatFeatureBit.STORAGE_TEXTURE | FormatFeatureBit.SAMPLED_TEXTURE | FormatFeatureBit.LINEAR_FILTER | FormatFeatureBit.VERTEX_ATTRIBUTE;
          this._formatFeatures[Format.R8I] = tempFeature;
          this._formatFeatures[Format.R8UI] = tempFeature;
          this._formatFeatures[Format.R16I] = tempFeature;
          this._formatFeatures[Format.R16UI] = tempFeature;
          this._formatFeatures[Format.R32I] = tempFeature;
          this._formatFeatures[Format.R32UI] = tempFeature;
          this._formatFeatures[Format.RG8I] = tempFeature;
          this._formatFeatures[Format.RG8UI] = tempFeature;
          this._formatFeatures[Format.RG16I] = tempFeature;
          this._formatFeatures[Format.RG16UI] = tempFeature;
          this._formatFeatures[Format.RG32I] = tempFeature;
          this._formatFeatures[Format.RG32UI] = tempFeature;
          this._formatFeatures[Format.RGB8I] = tempFeature;
          this._formatFeatures[Format.RGB8UI] = tempFeature;
          this._formatFeatures[Format.RGB16I] = tempFeature;
          this._formatFeatures[Format.RGB16UI] = tempFeature;
          this._formatFeatures[Format.RGB32I] = tempFeature;
          this._formatFeatures[Format.RGB32UI] = tempFeature;
          this._formatFeatures[Format.RGBA8I] = tempFeature;
          this._formatFeatures[Format.RGBA8UI] = tempFeature;
          this._formatFeatures[Format.RGBA16I] = tempFeature;
          this._formatFeatures[Format.RGBA16UI] = tempFeature;
          this._formatFeatures[Format.RGBA32I] = tempFeature;
          this._formatFeatures[Format.RGBA32UI] = tempFeature;
          this._textureExclusive[Format.R8] = false;
          this._textureExclusive[Format.RG8] = false;
          this._textureExclusive[Format.RGB8] = false;
          this._textureExclusive[Format.R5G6B5] = false;
          this._textureExclusive[Format.RGBA4] = false;
          this._textureExclusive[Format.RGB5A1] = false;
          this._textureExclusive[Format.RGBA8] = false;
          this._textureExclusive[Format.RGB10A2] = false;
          this._textureExclusive[Format.RGB10A2UI] = false;
          this._textureExclusive[Format.SRGB8_A8] = false;
          this._textureExclusive[Format.R8I] = false;
          this._textureExclusive[Format.R8UI] = false;
          this._textureExclusive[Format.R16I] = false;
          this._textureExclusive[Format.R16UI] = false;
          this._textureExclusive[Format.R32I] = false;
          this._textureExclusive[Format.R32UI] = false;
          this._textureExclusive[Format.RG8I] = false;
          this._textureExclusive[Format.RG8UI] = false;
          this._textureExclusive[Format.RG16I] = false;
          this._textureExclusive[Format.RG16UI] = false;
          this._textureExclusive[Format.RG32I] = false;
          this._textureExclusive[Format.RG32UI] = false;
          this._textureExclusive[Format.RGBA8I] = false;
          this._textureExclusive[Format.RGBA8UI] = false;
          this._textureExclusive[Format.RGBA16I] = false;
          this._textureExclusive[Format.RGBA16UI] = false;
          this._textureExclusive[Format.RGBA32I] = false;
          this._textureExclusive[Format.RGBA32UI] = false;
          this._textureExclusive[Format.DEPTH] = false;
          this._textureExclusive[Format.DEPTH_STENCIL] = false;
          if (exts.has('float32-filterable')) {
            this._formatFeatures[Format.R32F] |= FormatFeatureBit.RENDER_TARGET;
            this._formatFeatures[Format.RG32F] |= FormatFeatureBit.RENDER_TARGET;
            this._formatFeatures[Format.RGBA32F] |= FormatFeatureBit.RENDER_TARGET;
            this._textureExclusive[Format.R32F] = false;
            this._textureExclusive[Format.RG32F] = false;
            this._textureExclusive[Format.RGBA32F] = false;
            this._formatFeatures[Format.RGB32F] |= FormatFeatureBit.LINEAR_FILTER;
            this._formatFeatures[Format.RGBA32F] |= FormatFeatureBit.LINEAR_FILTER;
            this._formatFeatures[Format.R32F] |= FormatFeatureBit.LINEAR_FILTER;
            this._formatFeatures[Format.RG32F] |= FormatFeatureBit.LINEAR_FILTER;
          }
          if (exts.has('shader-f16')) {
            this._textureExclusive[Format.R16F] = false;
            this._textureExclusive[Format.RG16F] = false;
            this._textureExclusive[Format.RGBA16F] = false;
            this._formatFeatures[Format.RGB16F] |= FormatFeatureBit.LINEAR_FILTER;
            this._formatFeatures[Format.RGBA16F] |= FormatFeatureBit.LINEAR_FILTER;
            this._formatFeatures[Format.R16F] |= FormatFeatureBit.LINEAR_FILTER;
            this._formatFeatures[Format.RG16F] |= FormatFeatureBit.LINEAR_FILTER;
          }
          const compressedFeature = FormatFeatureBit.SAMPLED_TEXTURE | FormatFeatureBit.LINEAR_FILTER;
          if (exts.has('texture-compression-etc2')) {
            this._formatFeatures[Format.ETC2_RGB8] = compressedFeature;
            this._formatFeatures[Format.ETC2_RGBA8] = compressedFeature;
            this._formatFeatures[Format.ETC2_SRGB8] = compressedFeature;
            this._formatFeatures[Format.ETC2_SRGB8_A8] = compressedFeature;
            this._formatFeatures[Format.ETC2_RGB8_A1] = compressedFeature;
            this._formatFeatures[Format.ETC2_SRGB8_A1] = compressedFeature;
          }
          if (exts.has('texture-compression-bc')) {
            this._formatFeatures[Format.BC1] = compressedFeature;
            this._formatFeatures[Format.BC1_ALPHA] = compressedFeature;
            this._formatFeatures[Format.BC1_SRGB] = compressedFeature;
            this._formatFeatures[Format.BC1_SRGB_ALPHA] = compressedFeature;
            this._formatFeatures[Format.BC2] = compressedFeature;
            this._formatFeatures[Format.BC2_SRGB] = compressedFeature;
            this._formatFeatures[Format.BC3] = compressedFeature;
            this._formatFeatures[Format.BC3_SRGB] = compressedFeature;
          }
          if (exts.has('texture-compression-astc')) {
            this._formatFeatures[Format.ASTC_RGBA_4X4] = compressedFeature;
            this._formatFeatures[Format.ASTC_RGBA_5X4] = compressedFeature;
            this._formatFeatures[Format.ASTC_RGBA_5X5] = compressedFeature;
            this._formatFeatures[Format.ASTC_RGBA_6X5] = compressedFeature;
            this._formatFeatures[Format.ASTC_RGBA_6X6] = compressedFeature;
            this._formatFeatures[Format.ASTC_RGBA_8X5] = compressedFeature;
            this._formatFeatures[Format.ASTC_RGBA_8X6] = compressedFeature;
            this._formatFeatures[Format.ASTC_RGBA_8X8] = compressedFeature;
            this._formatFeatures[Format.ASTC_RGBA_10X5] = compressedFeature;
            this._formatFeatures[Format.ASTC_RGBA_10X6] = compressedFeature;
            this._formatFeatures[Format.ASTC_RGBA_10X8] = compressedFeature;
            this._formatFeatures[Format.ASTC_RGBA_10X10] = compressedFeature;
            this._formatFeatures[Format.ASTC_RGBA_12X10] = compressedFeature;
            this._formatFeatures[Format.ASTC_RGBA_12X12] = compressedFeature;
            this._formatFeatures[Format.ASTC_SRGBA_4X4] = compressedFeature;
            this._formatFeatures[Format.ASTC_SRGBA_5X4] = compressedFeature;
            this._formatFeatures[Format.ASTC_SRGBA_5X5] = compressedFeature;
            this._formatFeatures[Format.ASTC_SRGBA_6X5] = compressedFeature;
            this._formatFeatures[Format.ASTC_SRGBA_6X6] = compressedFeature;
            this._formatFeatures[Format.ASTC_SRGBA_8X5] = compressedFeature;
            this._formatFeatures[Format.ASTC_SRGBA_8X6] = compressedFeature;
            this._formatFeatures[Format.ASTC_SRGBA_8X8] = compressedFeature;
            this._formatFeatures[Format.ASTC_SRGBA_10X5] = compressedFeature;
            this._formatFeatures[Format.ASTC_SRGBA_10X6] = compressedFeature;
            this._formatFeatures[Format.ASTC_SRGBA_10X8] = compressedFeature;
            this._formatFeatures[Format.ASTC_SRGBA_10X10] = compressedFeature;
            this._formatFeatures[Format.ASTC_SRGBA_12X10] = compressedFeature;
            this._formatFeatures[Format.ASTC_SRGBA_12X12] = compressedFeature;
          }
        }
        getDefaultDescResources(entry, resourceInfo) {
          let currHash = hashCombineNum(entry.visibility, 0);
          const defaultRes = this.defaultResource;
          if (entry.buffer) {
            currHash = hashCombineStr(entry.buffer.type, currHash);
            if (entry.buffer.hasDynamicOffset) currHash = hashCombineNum(entry.buffer.hasDynamicOffset ? 1 : 0, currHash);
            if (entry.buffer.minBindingSize !== undefined) currHash = hashCombineNum(entry.buffer.minBindingSize, currHash);
            if (defaultRes.buffersDescLayout.has(currHash)) {
              return defaultRes.buffersDescLayout.get(currHash);
            }
            resourceInfo = resourceInfo;
            const bufferInfo = new BufferInfo();
            bufferInfo.usage = resourceInfo.usage;
            bufferInfo.size = bufferInfo.stride = 16;
            bufferInfo.memUsage = resourceInfo.memUsage;
            bufferInfo.flags = resourceInfo.flags;
            defaultRes.buffersDescLayout.set(currHash, this.createBuffer(bufferInfo));
            return defaultRes.buffersDescLayout.get(currHash);
          } else if (entry.texture) {
            resourceInfo = resourceInfo;
            currHash = hashCombineStr(entry.texture.sampleType, currHash);
            currHash = hashCombineStr(entry.texture.viewDimension, currHash);
            currHash = hashCombineNum(entry.texture.multisampled ? 1 : 0, currHash);
            currHash = hashCombineNum(resourceInfo.mipLevel, currHash);
            currHash = hashCombineNum(resourceInfo.arrayLayer, currHash);
            if (defaultRes.texturesDescLayout.has(currHash)) {
              return defaultRes.texturesDescLayout.get(currHash);
            }
            const texInfo = new TextureInfo(resourceInfo.type, resourceInfo.usage, resourceInfo.format, 2 ** (resourceInfo.mipLevel - 1), 2 ** (resourceInfo.mipLevel - 1), resourceInfo.flags, resourceInfo.arrayLayer, resourceInfo.mipLevel, resourceInfo.samples, 1);
            defaultRes.texturesDescLayout.set(currHash, this.createTexture(texInfo));
            return defaultRes.texturesDescLayout.get(currHash);
          } else if (entry.sampler) {
            resourceInfo = resourceInfo;
            currHash = hashCombineStr(entry.sampler.type, currHash);
            if (defaultRes.samplersDescLayout.has(currHash)) {
              return defaultRes.samplersDescLayout.get(currHash);
            }
            const samplerInfo = new SamplerInfo();
            samplerInfo.minFilter = resourceInfo.minFilter;
            samplerInfo.magFilter = resourceInfo.magFilter;
            samplerInfo.mipFilter = resourceInfo.mipFilter;
            samplerInfo.addressU = resourceInfo.addressU;
            samplerInfo.addressV = resourceInfo.addressV;
            samplerInfo.addressW = resourceInfo.addressW;
            defaultRes.samplersDescLayout.set(currHash, this.getSampler(samplerInfo));
            return defaultRes.samplersDescLayout.get(currHash);
          }
          return undefined;
        }
        _createDefaultDescSet() {
          const defaultResource = this.defaultResource;
          // default set layout
          const layoutInfo = new DescriptorSetLayoutInfo();
          const layoutBinding = new DescriptorSetLayoutBinding();
          layoutBinding.binding = 0;
          layoutBinding.count = 1;
          layoutBinding.descriptorType = DescriptorType.UNIFORM_BUFFER;
          layoutBinding.stageFlags = ShaderStageFlagBit.VERTEX;
          layoutInfo.bindings.push(layoutBinding);
          defaultResource.setLayout = this.createDescriptorSetLayout(layoutInfo);
          // default set
          const descInfo = new DescriptorSetInfo();
          descInfo.layout = defaultResource.setLayout;
          defaultResource.descSet = this.createDescriptorSet(descInfo);
          defaultResource.descSet.bindBuffer(0, defaultResource.buffer);
          defaultResource.descSet.update();
        }
        get floatFilterable() {
          return this._adapter.features.has('float32-filterable');
        }
        async initDevice(info) {
          var _this$_adapter;
          const gpu = navigator.gpu;
          this._adapter = await (gpu == null ? void 0 : gpu.requestAdapter());
          const maxVertAttrs = this._adapter.limits.maxVertexAttributes;
          const maxSampledTexPerShaderStage = this._adapter.limits.maxSampledTexturesPerShaderStage;
          const submitFeatures = [];
          if (this._adapter.features.has('float32-filterable')) {
            submitFeatures.push('float32-filterable');
          } else {
            warn('Filterable 32-bit float textures support is not available');
          }
          this._device = await ((_this$_adapter = this._adapter) == null ? void 0 : _this$_adapter.requestDevice({
            requiredLimits: {
              // Must be changed, default support for 16 is not enough
              maxVertexAttributes: maxVertAttrs,
              maxSampledTexturesPerShaderStage: maxSampledTexPerShaderStage
            },
            requiredFeatures: submitFeatures
          }));
          await loadWebGPUWasmModule();
          this._glslang = webGPU.glslang;
          this._twgsl = webGPU.twgsl;
          this._gfxAPI = API.WEBGPU;
          this._swapchainFormat = WGPUFormatToGFXFormat(navigator.gpu.getPreferredCanvasFormat());
          const mapping = this._bindingMappingInfo = info.bindingMappingInfo;
          const blockOffsets = [];
          const samplerTextureOffsets = [];
          const firstSet = mapping.setIndices[0];
          blockOffsets[firstSet] = 0;
          samplerTextureOffsets[firstSet] = 0;
          const mappingIdxSize = mapping.setIndices.length;
          for (let i = 1; i < mappingIdxSize; ++i) {
            const curSet = mapping.setIndices[i];
            const prevSet = mapping.setIndices[i - 1];
            // accumulate the per set offset according to the specified capacity
            blockOffsets[curSet] = mapping.maxBlockCounts[prevSet] + blockOffsets[prevSet];
            samplerTextureOffsets[curSet] = mapping.maxSamplerTextureCounts[prevSet] + samplerTextureOffsets[prevSet];
          }
          for (let i = 0; i < mappingIdxSize; ++i) {
            const curSet = mapping.setIndices[i];
            // textures always come after UBOs
            samplerTextureOffsets[curSet] -= mapping.maxBlockCounts[curSet];
          }
          this._bindingMappings = {
            blockOffsets,
            samplerTextureOffsets,
            flexibleSet: mapping.setIndices[mappingIdxSize - 1]
          };
          const canvas = Device.canvas;
          this._context = canvas.getContext('webgpu');
          const device = this._device;
          const adapterInfo = this._adapter.info;
          this._vendor = adapterInfo.vendor;
          this._renderer = adapterInfo.device;
          const description = adapterInfo.description;
          const limits = this._adapter.limits;
          this._caps.clipSpaceMinZ = 0.0;
          this._caps.screenSpaceSignY = -1.0;
          this._caps.uboOffsetAlignment = 256;
          this._caps.maxUniformBufferBindings = 12;
          this._caps.maxVertexAttributes = limits.maxVertexAttributes;
          this._caps.maxUniformBufferBindings = limits.maxUniformBufferBindingSize;
          this._caps.maxTextureSize = limits.maxTextureDimension2D;
          this._caps.maxArrayTextureLayers = limits.maxTextureArrayLayers;
          this._caps.max3DTextureSize = limits.maxTextureDimension3D;
          this._caps.uboOffsetAlignment = limits.minUniformBufferOffsetAlignment;

          // Compute limits are read from the device (not the adapter): no elevated
          // compute limits are requested, so these are the values validation enforces.
          const deviceLimits = device.limits;
          this._caps.maxComputeSharedMemorySize = deviceLimits.maxComputeWorkgroupStorageSize;
          this._caps.maxComputeWorkGroupInvocations = deviceLimits.maxComputeInvocationsPerWorkgroup;
          this._caps.maxComputeWorkGroupSize = new Size(deviceLimits.maxComputeWorkgroupSizeX, deviceLimits.maxComputeWorkgroupSizeY, deviceLimits.maxComputeWorkgroupSizeZ);
          this._caps.maxComputeWorkGroupCount = new Size(deviceLimits.maxComputeWorkgroupsPerDimension, deviceLimits.maxComputeWorkgroupsPerDimension, deviceLimits.maxComputeWorkgroupsPerDimension);
          const features = this._adapter.features;
          // FIXME: require by query
          this._multiDrawIndirect = false;
          this._features.fill(false);
          this._features[Feature.ELEMENT_INDEX_UINT] = true;
          this._features[Feature.INSTANCED_ARRAYS] = true;
          this._features[Feature.MULTIPLE_RENDER_TARGETS] = true;
          this._features[Feature.COMPUTE_SHADER] = true;
          this.initFormatFeatures(features);
          this._queue = this.createQueue(new QueueInfo(QueueType.GRAPHICS));
          this._cmdBuff = this.createCommandBuffer(new CommandBufferInfo(this._queue));
          const texInfo = new TextureInfo(TextureType.TEX2D, TextureUsageBit.STORAGE | TextureUsageBit.SAMPLED | TextureUsageBit.TRANSFER_DST, Format.RGBA8, 16, 16, TextureFlagBit.NONE, 1, 1, SampleCount.X1, 1);
          const defaultDescTexResc = this.createTexture(texInfo);
          const cubeTexInfo = new TextureInfo(TextureType.CUBE, TextureUsageBit.STORAGE | TextureUsageBit.SAMPLED | TextureUsageBit.TRANSFER_DST, Format.RGBA8, 16, 16, TextureFlagBit.NONE, 6);
          const defaultDescCubeTexResc = this.createTexture(cubeTexInfo);
          const bufferInfo = new BufferInfo(BufferUsageBit.UNIFORM, MemoryUsageBit.DEVICE, 16, 16,
          // in bytes
          BufferFlagBit.NONE);
          const defaultDescBuffResc = this.createBuffer(bufferInfo);
          const samplerInfo = new SamplerInfo();
          const defaultDescSmplResc = this.getSampler(samplerInfo);
          const defaultResource = this.defaultResource;
          defaultResource.buffer = defaultDescBuffResc;
          defaultResource.texture = defaultDescTexResc;
          defaultResource.sampler = defaultDescSmplResc;
          defaultResource.cubeTexture = defaultDescCubeTexResc;
          this._createDefaultDescSet();
          let compressedFormat = '';
          if (this.getFormatFeatures(Format.ETC_RGB8)) {
            compressedFormat += 'etc1 ';
          }
          if (this.getFormatFeatures(Format.ETC2_RGB8)) {
            compressedFormat += 'etc2 ';
          }
          if (this.getFormatFeatures(Format.BC1)) {
            compressedFormat += 'dxt ';
          }
          if (this.getFormatFeatures(Format.PVRTC_RGB2)) {
            compressedFormat += 'pvrtc ';
          }
          if (this.getFormatFeatures(Format.ASTC_RGBA_4X4)) {
            compressedFormat += 'astc ';
          }
          debug('WebGPU device initialized.');
          debug(`RENDERER: ${this._renderer}`);
          debug(`VENDOR: ${this._vendor}`);
          debug(`DESCRIPTION: ${description}`);
          debug(`COMPRESSED_FORMAT: ${compressedFormat}`);
          return Promise.resolve(true);
        }
        destroy() {
          if (this._queue) {
            this._queue.destroy();
            this._queue = null;
          }
          if (this._cmdBuff) {
            this._cmdBuff.destroy();
            this._cmdBuff = null;
          }
          const it = this._samplers.values();
          let res = it.next();
          while (!res.done) {
            res.value.destroy();
            res = it.next();
          }
          this._swapchain = null;
        }
        resize(width, height) {
          // noop
        }
        acquire() {
          // noop
        }
        get nativeDevice() {
          return this._device;
        }

        // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
        get glslang() {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return this._glslang;
        }

        // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
        get twgsl() {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return this._twgsl;
        }
        present() {
          const queue = this._queue;
          this._numDrawCalls = queue.numDrawCalls;
          this._numDispatches = queue.numDispatches;
          this._numInstances = queue.numInstances;
          this._numTris = queue.numTris;
          queue.clear();
        }
        createCommandBuffer(info) {
          const cmdBuff = new WebGPUCommandBuffer();
          if (cmdBuff.initialize(info)) {
            return cmdBuff;
          }
          return null;
        }
        createBuffer(info) {
          const buffer = new WebGPUBuffer();
          buffer.initialize(info);
          return buffer;
        }
        createTexture(info) {
          const texture = new WebGPUTexture();
          texture.initialize(info);
          return texture;
        }
        createDescriptorSet(info) {
          const descriptorSet = new WebGPUDescriptorSet();
          descriptorSet.initialize(info);
          return descriptorSet;
        }
        createShader(info) {
          const shader = new WebGPUShader();
          shader.initialize(info);
          return shader;
        }
        createInputAssembler(info) {
          const inputAssembler = new WebGPUInputAssembler();
          inputAssembler.initialize(info);
          return inputAssembler;
        }
        createRenderPass(info) {
          const renderPass = new WebGPURenderPass();
          renderPass.initialize(info);
          return renderPass;
        }
        createFramebuffer(info) {
          const framebuffer = new WebGPUFramebuffer();
          framebuffer.initialize(info);
          return framebuffer;
        }
        createDescriptorSetLayout(info) {
          const descriptorSetLayout = new WebGPUDescriptorSetLayout();
          descriptorSetLayout.initialize(info);
          return descriptorSetLayout;
        }
        createPipelineLayout(info) {
          const pipelineLayout = new WebGPUPipelineLayout();
          if (pipelineLayout.initialize(info)) {
            return pipelineLayout;
          }
          return null;
        }
        createPipelineState(info) {
          const pipelineState = new WebGPUPipelineState();
          pipelineState.initialize(info);
          return pipelineState;
        }
        createQueue(info) {
          const queue = new WebGPUQueue();
          if (queue.initialize(info)) {
            return queue;
          }
          return null;
        }
        copyBuffersToTexture(buffers, texture, regions) {
          WebGPUCmdFuncCopyBuffersToTexture(this, buffers, texture.gpuTexture, regions);
        }
        copyTexImagesToTexture(texImages, texture, regions) {
          WebGPUCmdFuncCopyTexImagesToTexture(this, texImages, texture.gpuTexture, regions);
        }
        copyFramebufferToBuffer(srcFramebuffer, dstBuffer, regions) {
          // noop
        }
        blitFramebuffer(src, dst, srcRect, dstRect, filter) {
          // noop
        }
      });
    }
  };
});