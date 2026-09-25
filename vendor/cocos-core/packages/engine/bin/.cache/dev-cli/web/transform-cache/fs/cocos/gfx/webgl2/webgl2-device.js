System.register("q-bundled:///fs/cocos/gfx/webgl2/webgl2-device.js", ["pal/system-info", "../base/device.js", "../base/states/sampler.js", "./webgl2-descriptor-set.js", "./webgl2-buffer.js", "./webgl2-command-buffer.js", "./webgl2-framebuffer.js", "./webgl2-input-assembler.js", "./webgl2-descriptor-set-layout.js", "./webgl2-pipeline-layout.js", "./webgl2-pipeline-state.js", "./webgl2-primary-command-buffer.js", "./webgl2-queue.js", "./webgl2-render-pass.js", "./states/webgl2-sampler.js", "./webgl2-shader.js", "./webgl2-swapchain.js", "./webgl2-texture.js", "../base/define.js", "./webgl2-commands.js", "../base/states/general-barrier.js", "../base/states/texture-barrier.js", "../base/states/buffer-barrier.js", "../../core/platform/debug.js", "../../core/platform/sys.js", "./webgl2-define.js", "../../../pal/system-info/enum-type/index.js", "../gl-constants.js"], function (_export, _context) {
  "use strict";

  var systemInfo, Device, Sampler, WebGL2DescriptorSet, WebGL2Buffer, WebGL2CommandBuffer, WebGL2Framebuffer, WebGL2InputAssembler, WebGL2DescriptorSetLayout, WebGL2PipelineLayout, WebGL2PipelineState, WebGL2PrimaryCommandBuffer, WebGL2Queue, WebGL2RenderPass, WebGL2Sampler, WebGL2Shader, WebGL2Swapchain, getExtensions, getContext, WebGL2Texture, CommandBufferType, CommandBufferInfo, QueueInfo, QueueType, API, Feature, Format, FormatFeatureBit, WebGL2CmdFuncCopyTextureToBuffers, WebGL2CmdFuncCopyBuffersToTexture, WebGL2CmdFuncCopyTexImagesToTexture, GeneralBarrier, TextureBarrier, BufferBarrier, debug, errorID, sys, WebGL2DeviceManager, BrowserType, OS, WebGLConstants, WebGL2Device;
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

  function setFormatFeature(formatFeatures, indexArray, feature) {
    for (let i = 0; i < indexArray.length; ++i) {
      formatFeatures[indexArray[i]] = feature;
    }
  }
  function setTextureExclusive(textureExclusive, indexArray, isExclusive) {
    for (let i = 0; i < indexArray.length; ++i) {
      textureExclusive[indexArray[i]] = isExclusive;
    }
  }

  /** @mangle */
  _export("WebGL2Device", void 0);
  return {
    setters: [function (_palSystemInfo) {
      systemInfo = _palSystemInfo.systemInfo;
    }, function (_baseDeviceJs) {
      Device = _baseDeviceJs.Device;
    }, function (_baseStatesSamplerJs) {
      Sampler = _baseStatesSamplerJs.Sampler;
    }, function (_webgl2DescriptorSetJs) {
      WebGL2DescriptorSet = _webgl2DescriptorSetJs.WebGL2DescriptorSet;
    }, function (_webgl2BufferJs) {
      WebGL2Buffer = _webgl2BufferJs.WebGL2Buffer;
    }, function (_webgl2CommandBufferJs) {
      WebGL2CommandBuffer = _webgl2CommandBufferJs.WebGL2CommandBuffer;
    }, function (_webgl2FramebufferJs) {
      WebGL2Framebuffer = _webgl2FramebufferJs.WebGL2Framebuffer;
    }, function (_webgl2InputAssemblerJs) {
      WebGL2InputAssembler = _webgl2InputAssemblerJs.WebGL2InputAssembler;
    }, function (_webgl2DescriptorSetLayoutJs) {
      WebGL2DescriptorSetLayout = _webgl2DescriptorSetLayoutJs.WebGL2DescriptorSetLayout;
    }, function (_webgl2PipelineLayoutJs) {
      WebGL2PipelineLayout = _webgl2PipelineLayoutJs.WebGL2PipelineLayout;
    }, function (_webgl2PipelineStateJs) {
      WebGL2PipelineState = _webgl2PipelineStateJs.WebGL2PipelineState;
    }, function (_webgl2PrimaryCommandBufferJs) {
      WebGL2PrimaryCommandBuffer = _webgl2PrimaryCommandBufferJs.WebGL2PrimaryCommandBuffer;
    }, function (_webgl2QueueJs) {
      WebGL2Queue = _webgl2QueueJs.WebGL2Queue;
    }, function (_webgl2RenderPassJs) {
      WebGL2RenderPass = _webgl2RenderPassJs.WebGL2RenderPass;
    }, function (_statesWebgl2SamplerJs) {
      WebGL2Sampler = _statesWebgl2SamplerJs.WebGL2Sampler;
    }, function (_webgl2ShaderJs) {
      WebGL2Shader = _webgl2ShaderJs.WebGL2Shader;
    }, function (_webgl2SwapchainJs) {
      WebGL2Swapchain = _webgl2SwapchainJs.WebGL2Swapchain;
      getExtensions = _webgl2SwapchainJs.getExtensions;
      getContext = _webgl2SwapchainJs.getContext;
    }, function (_webgl2TextureJs) {
      WebGL2Texture = _webgl2TextureJs.WebGL2Texture;
    }, function (_baseDefineJs) {
      CommandBufferType = _baseDefineJs.CommandBufferType;
      CommandBufferInfo = _baseDefineJs.CommandBufferInfo;
      QueueInfo = _baseDefineJs.QueueInfo;
      QueueType = _baseDefineJs.QueueType;
      API = _baseDefineJs.API;
      Feature = _baseDefineJs.Feature;
      Format = _baseDefineJs.Format;
      FormatFeatureBit = _baseDefineJs.FormatFeatureBit;
    }, function (_webgl2CommandsJs) {
      WebGL2CmdFuncCopyTextureToBuffers = _webgl2CommandsJs.WebGL2CmdFuncCopyTextureToBuffers;
      WebGL2CmdFuncCopyBuffersToTexture = _webgl2CommandsJs.WebGL2CmdFuncCopyBuffersToTexture;
      WebGL2CmdFuncCopyTexImagesToTexture = _webgl2CommandsJs.WebGL2CmdFuncCopyTexImagesToTexture;
    }, function (_baseStatesGeneralBarrierJs) {
      GeneralBarrier = _baseStatesGeneralBarrierJs.GeneralBarrier;
    }, function (_baseStatesTextureBarrierJs) {
      TextureBarrier = _baseStatesTextureBarrierJs.TextureBarrier;
    }, function (_baseStatesBufferBarrierJs) {
      BufferBarrier = _baseStatesBufferBarrierJs.BufferBarrier;
    }, function (_corePlatformDebugJs) {
      debug = _corePlatformDebugJs.debug;
      errorID = _corePlatformDebugJs.errorID;
    }, function (_corePlatformSysJs) {
      sys = _corePlatformSysJs.sys;
    }, function (_webgl2DefineJs) {
      WebGL2DeviceManager = _webgl2DefineJs.WebGL2DeviceManager;
    }, function (_palSystemInfoEnumTypeIndexJs) {
      BrowserType = _palSystemInfoEnumTypeIndexJs.BrowserType;
      OS = _palSystemInfoEnumTypeIndexJs.OS;
    }, function (_glConstantsJs) {
      WebGLConstants = _glConstantsJs.WebGLConstants;
    }],
    execute: function () {
      _export("WebGL2Device", WebGL2Device = class WebGL2Device extends Device {
        constructor() {
          super();
          this._swapchain = null;
          this._context = null;
          this._bindingMappings = null;
          this._textureExclusive = new Array(Format.COUNT);
        }
        get gl() {
          return this._context;
        }
        get extensions() {
          return this._swapchain.extensions;
        }
        getStateCache() {
          return this._swapchain.stateCache;
        }
        get nullTex2D() {
          return this._swapchain.nullTex2D;
        }
        get nullTexCube() {
          return this._swapchain.nullTexCube;
        }
        get textureExclusive() {
          return this._textureExclusive;
        }
        get bindingMappings() {
          return this._bindingMappings;
        }
        get blitManager() {
          return this._swapchain.blitManager;
        }
        initialize(info) {
          WebGL2DeviceManager.setInstance(this);
          this._gfxAPI = API.WEBGL2;
          const mapping = this._bindingMappingInfo = info.bindingMappingInfo;
          const blockOffsets = [];
          const samplerTextureOffsets = [];
          const firstSet = mapping.setIndices[0];
          blockOffsets[firstSet] = 0;
          samplerTextureOffsets[firstSet] = 0;
          for (let i = 1; i < mapping.setIndices.length; ++i) {
            const curSet = mapping.setIndices[i];
            const prevSet = mapping.setIndices[i - 1];
            // accumulate the per set offset according to the specified capacity
            blockOffsets[curSet] = mapping.maxBlockCounts[prevSet] + blockOffsets[prevSet];
            samplerTextureOffsets[curSet] = mapping.maxSamplerTextureCounts[prevSet] + samplerTextureOffsets[prevSet];
          }
          for (let i = 0; i < mapping.setIndices.length; ++i) {
            const curSet = mapping.setIndices[i];
            // textures always come after UBOs
            samplerTextureOffsets[curSet] -= mapping.maxBlockCounts[curSet];
          }
          this._bindingMappings = {
            blockOffsets,
            samplerTextureOffsets,
            flexibleSet: mapping.setIndices[mapping.setIndices.length - 1]
          };
          const gl = this._context = getContext(Device.canvas);
          if (!gl) {
            errorID(16405);
            return false;
          }

          // create queue
          this._queue = this.createQueue(new QueueInfo(QueueType.GRAPHICS));
          this._cmdBuff = this.createCommandBuffer(new CommandBufferInfo(this._queue));
          const glGetParameter = gl.getParameter.bind(gl);
          const caps = this._caps;
          caps.maxVertexAttributes = glGetParameter(WebGLConstants.MAX_VERTEX_ATTRIBS);
          caps.maxVertexUniformVectors = glGetParameter(WebGLConstants.MAX_VERTEX_UNIFORM_VECTORS);
          // Implementation of WebGL2 in WECHAT browser and Safari in IOS exist bugs.
          // It seems to be related to Safari's experimental features 'WebGL via Metal'.
          // So limit using vertex uniform vectors no more than 256 in wechat browser,
          // and using vertex uniform vectors no more than 512 in safari.
          if (systemInfo.os === OS.IOS) {
            const maxVertexUniformVectors = caps.maxVertexUniformVectors;
            if (sys.browserType === BrowserType.WECHAT) {
              caps.maxVertexUniformVectors = maxVertexUniformVectors < 256 ? maxVertexUniformVectors : 256;
            } else if (sys.browserType === BrowserType.SAFARI) {
              caps.maxVertexUniformVectors = maxVertexUniformVectors < 512 ? maxVertexUniformVectors : 512;
            }
          }
          caps.maxFragmentUniformVectors = glGetParameter(WebGLConstants.MAX_FRAGMENT_UNIFORM_VECTORS);
          caps.maxTextureUnits = glGetParameter(WebGLConstants.MAX_TEXTURE_IMAGE_UNITS);
          caps.maxVertexTextureUnits = glGetParameter(WebGLConstants.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
          caps.maxUniformBufferBindings = glGetParameter(WebGLConstants.MAX_UNIFORM_BUFFER_BINDINGS);
          caps.maxUniformBlockSize = glGetParameter(WebGLConstants.MAX_UNIFORM_BLOCK_SIZE);
          caps.maxTextureSize = glGetParameter(WebGLConstants.MAX_TEXTURE_SIZE);
          caps.maxCubeMapTextureSize = glGetParameter(WebGLConstants.MAX_CUBE_MAP_TEXTURE_SIZE);
          caps.maxArrayTextureLayers = glGetParameter(WebGLConstants.MAX_ARRAY_TEXTURE_LAYERS);
          caps.max3DTextureSize = glGetParameter(WebGLConstants.MAX_3D_TEXTURE_SIZE);
          caps.uboOffsetAlignment = glGetParameter(WebGLConstants.UNIFORM_BUFFER_OFFSET_ALIGNMENT);
          const extensions = gl.getSupportedExtensions();
          let extStr = '';
          if (extensions) {
            extensions.forEach(ext => {
              extStr += `${ext} `;
            });
          }
          const exts = getExtensions(gl);
          if (exts.WEBGL_debug_renderer_info) {
            this._renderer = glGetParameter(exts.WEBGL_debug_renderer_info.UNMASKED_RENDERER_WEBGL);
            this._vendor = glGetParameter(exts.WEBGL_debug_renderer_info.UNMASKED_VENDOR_WEBGL);
          } else {
            this._renderer = glGetParameter(WebGLConstants.RENDERER);
            this._vendor = glGetParameter(WebGLConstants.VENDOR);
          }
          const version = glGetParameter(WebGLConstants.VERSION);
          const features = this._features;
          features.fill(false);
          this.initFormatFeatures(exts);
          features[Feature.ELEMENT_INDEX_UINT] = true;
          features[Feature.INSTANCED_ARRAYS] = true;
          features[Feature.MULTIPLE_RENDER_TARGETS] = true;
          features[Feature.BLEND_MINMAX] = true;
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
          debug('WebGL2 device initialized.');
          debug(`RENDERER: ${this._renderer}`);
          debug(`VENDOR: ${this._vendor}`);
          debug(`VERSION: ${version}`);
          debug(`COMPRESSED_FORMAT: ${compressedFormat}`);
          debug(`EXTENSIONS: ${extStr}`);
          return true;
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
        flushCommands(cmdBuffs) {
          // noop
        }
        acquire(swapchains) {
          // noop
        }
        present() {
          const queue = this._queue;
          this._numDrawCalls = queue.numDrawCalls;
          this._numInstances = queue.numInstances;
          this._numTris = queue.numTris;
          queue.clear();
        }
        initFormatFeatures(exts) {
          const formatFeatures = this._formatFeatures;
          const textureExclusive = this._textureExclusive;
          formatFeatures.fill(FormatFeatureBit.NONE);
          textureExclusive.fill(true);
          let tempFeature = FormatFeatureBit.RENDER_TARGET | FormatFeatureBit.SAMPLED_TEXTURE | FormatFeatureBit.STORAGE_TEXTURE | FormatFeatureBit.LINEAR_FILTER | FormatFeatureBit.VERTEX_ATTRIBUTE;
          setFormatFeature(formatFeatures, [Format.R8, Format.RG8, Format.RGB8, Format.RGBA8], tempFeature);
          tempFeature = FormatFeatureBit.RENDER_TARGET | FormatFeatureBit.SAMPLED_TEXTURE | FormatFeatureBit.STORAGE_TEXTURE | FormatFeatureBit.LINEAR_FILTER;
          setFormatFeature(formatFeatures, [Format.R8SN, Format.RG8SN, Format.RGB8SN, Format.RGBA8SN, Format.R5G6B5, Format.RGBA4, Format.RGB5A1, Format.RGB10A2, Format.SRGB8, Format.SRGB8_A8, Format.R11G11B10F, Format.RGB9E5, Format.DEPTH, Format.DEPTH_STENCIL], tempFeature);
          formatFeatures[Format.RGB10A2UI] = FormatFeatureBit.RENDER_TARGET | FormatFeatureBit.STORAGE_TEXTURE | FormatFeatureBit.SAMPLED_TEXTURE | FormatFeatureBit.LINEAR_FILTER;
          tempFeature = FormatFeatureBit.RENDER_TARGET | FormatFeatureBit.SAMPLED_TEXTURE | FormatFeatureBit.STORAGE_TEXTURE | FormatFeatureBit.VERTEX_ATTRIBUTE;
          setFormatFeature(formatFeatures, [Format.R16F, Format.RG16F, Format.RGB16F, Format.RGBA16F], tempFeature);
          tempFeature = FormatFeatureBit.STORAGE_TEXTURE | FormatFeatureBit.SAMPLED_TEXTURE | FormatFeatureBit.VERTEX_ATTRIBUTE;
          setFormatFeature(formatFeatures, [Format.R32F, Format.RG32F, Format.RGB32F, Format.RGBA32F], tempFeature);
          formatFeatures[Format.RGB10A2UI] = FormatFeatureBit.RENDER_TARGET | FormatFeatureBit.STORAGE_TEXTURE | FormatFeatureBit.SAMPLED_TEXTURE | FormatFeatureBit.LINEAR_FILTER;
          tempFeature = FormatFeatureBit.RENDER_TARGET | FormatFeatureBit.STORAGE_TEXTURE | FormatFeatureBit.SAMPLED_TEXTURE | FormatFeatureBit.LINEAR_FILTER | FormatFeatureBit.VERTEX_ATTRIBUTE;
          setFormatFeature(formatFeatures, [Format.R8I, Format.R8UI, Format.R16I, Format.R16UI, Format.R32I, Format.R32UI, Format.RG8I, Format.RG8UI, Format.RG16I, Format.RG16UI, Format.RG32I, Format.RG32UI, Format.RGB8I, Format.RGB8UI, Format.RGB16I, Format.RGB16UI, Format.RGB32I, Format.RGB32UI, Format.RGBA8I, Format.RGBA8UI, Format.RGBA16I, Format.RGBA16UI, Format.RGBA32I, Format.RGBA32UI], tempFeature);
          setTextureExclusive(textureExclusive, [Format.R8, Format.RG8, Format.RGB8, Format.R5G6B5, Format.RGBA4, Format.RGB5A1, Format.RGBA8, Format.RGB10A2, Format.RGB10A2UI, Format.SRGB8_A8, Format.R8I, Format.R8UI, Format.R16I, Format.R16UI, Format.R32I, Format.R32UI, Format.RG8I, Format.RG8UI, Format.RG16I, Format.RG16UI, Format.RG32I, Format.RG32UI, Format.RGBA8I, Format.RGBA8UI, Format.RGBA16I, Format.RGBA16UI, Format.RGBA32I, Format.RGBA32UI, Format.DEPTH, Format.DEPTH_STENCIL], false);
          if (exts.EXT_color_buffer_float) {
            formatFeatures[Format.R32F] |= FormatFeatureBit.RENDER_TARGET;
            formatFeatures[Format.RG32F] |= FormatFeatureBit.RENDER_TARGET;
            formatFeatures[Format.RGBA32F] |= FormatFeatureBit.RENDER_TARGET;
            setTextureExclusive(textureExclusive, [Format.R32F, Format.RG32F, Format.RGBA32F], false);
          }
          if (exts.EXT_color_buffer_half_float) {
            setTextureExclusive(textureExclusive, [Format.R16F, Format.RG16F, Format.RGBA16F], false);
          }
          if (exts.OES_texture_float_linear) {
            formatFeatures[Format.RGB32F] |= FormatFeatureBit.LINEAR_FILTER;
            formatFeatures[Format.RGBA32F] |= FormatFeatureBit.LINEAR_FILTER;
            formatFeatures[Format.R32F] |= FormatFeatureBit.LINEAR_FILTER;
            formatFeatures[Format.RG32F] |= FormatFeatureBit.LINEAR_FILTER;
          }
          if (exts.OES_texture_half_float_linear) {
            formatFeatures[Format.RGB16F] |= FormatFeatureBit.LINEAR_FILTER;
            formatFeatures[Format.RGBA16F] |= FormatFeatureBit.LINEAR_FILTER;
            formatFeatures[Format.R16F] |= FormatFeatureBit.LINEAR_FILTER;
            formatFeatures[Format.RG16F] |= FormatFeatureBit.LINEAR_FILTER;
          }
          const compressedFeature = FormatFeatureBit.SAMPLED_TEXTURE | FormatFeatureBit.LINEAR_FILTER;
          if (exts.WEBGL_compressed_texture_etc1) {
            formatFeatures[Format.ETC_RGB8] = compressedFeature;
          }
          if (exts.WEBGL_compressed_texture_etc) {
            setFormatFeature(formatFeatures, [Format.ETC2_RGB8, Format.ETC2_RGBA8, Format.ETC2_SRGB8, Format.ETC2_SRGB8_A8, Format.ETC2_RGB8_A1, Format.ETC2_SRGB8_A1], compressedFeature);
          }
          if (exts.WEBGL_compressed_texture_s3tc) {
            setFormatFeature(formatFeatures, [Format.BC1, Format.BC1_ALPHA, Format.BC1_SRGB, Format.BC1_SRGB_ALPHA, Format.BC2, Format.BC2_SRGB, Format.BC3, Format.BC3_SRGB], compressedFeature);
          }
          if (exts.WEBGL_compressed_texture_pvrtc) {
            setFormatFeature(formatFeatures, [Format.PVRTC_RGB2, Format.PVRTC_RGBA2, Format.PVRTC_RGB4, Format.PVRTC_RGBA4], compressedFeature);
          }
          if (exts.WEBGL_compressed_texture_astc) {
            setFormatFeature(formatFeatures, [Format.ASTC_RGBA_4X4, Format.ASTC_RGBA_5X4, Format.ASTC_RGBA_5X5, Format.ASTC_RGBA_6X5, Format.ASTC_RGBA_6X6, Format.ASTC_RGBA_8X5, Format.ASTC_RGBA_8X6, Format.ASTC_RGBA_8X8, Format.ASTC_RGBA_10X5, Format.ASTC_RGBA_10X6, Format.ASTC_RGBA_10X8, Format.ASTC_RGBA_10X10, Format.ASTC_RGBA_12X10, Format.ASTC_RGBA_12X12, Format.ASTC_SRGBA_4X4, Format.ASTC_SRGBA_5X4, Format.ASTC_SRGBA_5X5, Format.ASTC_SRGBA_6X5, Format.ASTC_SRGBA_6X6, Format.ASTC_SRGBA_8X5, Format.ASTC_SRGBA_8X6, Format.ASTC_SRGBA_8X8, Format.ASTC_SRGBA_10X5, Format.ASTC_SRGBA_10X6, Format.ASTC_SRGBA_10X8, Format.ASTC_SRGBA_10X10, Format.ASTC_SRGBA_12X10, Format.ASTC_SRGBA_12X12], compressedFeature);
          }
        }
        createCommandBuffer(info) {
          // const Ctor = WebGLCommandBuffer; // opt to instant invocation
          const Ctor = info.type === CommandBufferType.PRIMARY ? WebGL2PrimaryCommandBuffer : WebGL2CommandBuffer;
          const cmdBuff = new Ctor();
          cmdBuff.initialize(info);
          return cmdBuff;
        }
        createSwapchain(info) {
          const swapchain = new WebGL2Swapchain();
          this._swapchain = swapchain;
          swapchain.initialize(info);
          return swapchain;
        }
        createBuffer(info) {
          const buffer = new WebGL2Buffer();
          buffer.initialize(info);
          return buffer;
        }
        createTexture(info) {
          const texture = new WebGL2Texture();
          texture.initialize(info);
          return texture;
        }
        createDescriptorSet(info) {
          const descriptorSet = new WebGL2DescriptorSet();
          descriptorSet.initialize(info);
          return descriptorSet;
        }
        createShader(info) {
          const shader = new WebGL2Shader();
          shader.initialize(info);
          return shader;
        }
        createInputAssembler(info) {
          const inputAssembler = new WebGL2InputAssembler();
          inputAssembler.initialize(info);
          return inputAssembler;
        }
        createRenderPass(info) {
          const renderPass = new WebGL2RenderPass();
          renderPass.initialize(info);
          return renderPass;
        }
        createFramebuffer(info) {
          const framebuffer = new WebGL2Framebuffer();
          framebuffer.initialize(info);
          return framebuffer;
        }
        createDescriptorSetLayout(info) {
          const descriptorSetLayout = new WebGL2DescriptorSetLayout();
          descriptorSetLayout.initialize(info);
          return descriptorSetLayout;
        }
        createPipelineLayout(info) {
          const pipelineLayout = new WebGL2PipelineLayout();
          pipelineLayout.initialize(info);
          return pipelineLayout;
        }
        createPipelineState(info) {
          const pipelineState = new WebGL2PipelineState();
          pipelineState.initialize(info);
          return pipelineState;
        }
        createQueue(info) {
          const queue = new WebGL2Queue();
          queue.initialize(info);
          return queue;
        }
        getSampler(info) {
          const hash = Sampler.computeHash(info);
          if (!this._samplers.has(hash)) {
            this._samplers.set(hash, new WebGL2Sampler(info, hash));
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
        copyBuffersToTexture(buffers, texture, regions) {
          WebGL2CmdFuncCopyBuffersToTexture(this, buffers, texture.gpuTexture, regions);
        }
        copyTextureToBuffers(texture, buffers, regions) {
          WebGL2CmdFuncCopyTextureToBuffers(this, texture.gpuTexture, buffers, regions);
        }
        copyTexImagesToTexture(texImages, texture, regions) {
          WebGL2CmdFuncCopyTexImagesToTexture(this, texImages, texture.gpuTexture, regions);
        }
      });
    }
  };
});