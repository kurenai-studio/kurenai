System.register("q-bundled:///fs/cocos/gfx/base/device.js", ["./define.js"], function (_export, _context) {
  "use strict";

  var API, Feature, MemoryStatus, TextureInfo, BufferTextureCopy, DeviceCaps, BindingMappingInfo, Format, TextureType, TextureUsageBit, TextureFlagBit, Offset, Extent, SampleCount, TextureSubresLayers, Device, DefaultResource;
  _export({
    Device: void 0,
    DefaultResource: void 0
  });
  return {
    setters: [function (_defineJs) {
      API = _defineJs.API;
      Feature = _defineJs.Feature;
      MemoryStatus = _defineJs.MemoryStatus;
      TextureInfo = _defineJs.TextureInfo;
      BufferTextureCopy = _defineJs.BufferTextureCopy;
      DeviceCaps = _defineJs.DeviceCaps;
      BindingMappingInfo = _defineJs.BindingMappingInfo;
      Format = _defineJs.Format;
      TextureType = _defineJs.TextureType;
      TextureUsageBit = _defineJs.TextureUsageBit;
      TextureFlagBit = _defineJs.TextureFlagBit;
      Offset = _defineJs.Offset;
      Extent = _defineJs.Extent;
      SampleCount = _defineJs.SampleCount;
      TextureSubresLayers = _defineJs.TextureSubresLayers;
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
       * @en GFX Device.
       * @zh GFX 设备。
       */
      _export("Device", Device = class Device {
        constructor() {
          /** @mangle */
          this._gfxAPI = API.UNKNOWN;
          /** @mangle */
          this._renderer = '';
          /** @mangle */
          this._vendor = '';
          /** @mangle */
          this._features = new Array(Feature.COUNT);
          /** @mangle */
          this._formatFeatures = new Array(Format.COUNT);
          /** @mangle */
          this._queue = null;
          /** @mangle */
          this._cmdBuff = null;
          /** @mangle */
          this._numDrawCalls = 0;
          /** @mangle */
          this._numDispatches = 0;
          /** @mangle */
          this._numInstances = 0;
          /** @mangle */
          this._numTris = 0;
          /** @mangle */
          this._memoryStatus = new MemoryStatus();
          /** @mangle */
          this._caps = new DeviceCaps();
          /** @mangle */
          this._bindingMappingInfo = new BindingMappingInfo();
          /** @mangle */
          this._samplers = new Map();
          /** @mangle */
          this._generalBarrierss = new Map();
          /** @mangle */
          this._textureBarriers = new Map();
          /** @mangle */
          this._bufferBarriers = new Map();
          /** @mangle */
          this._swapchainFormat = Format.RGBA8;
        }

        /**
         * @en Current rendering API.
         * @zh 当前 GFX 使用的渲染 API。
         */
        get gfxAPI() {
          return this._gfxAPI;
        }

        /**
         * @en GFX default queue.
         * @zh GFX 默认队列。
         */
        get queue() {
          return this._queue;
        }

        /**
         * @en GFX default command buffer.
         * @zh GFX 默认命令缓冲。
         */
        get commandBuffer() {
          return this._cmdBuff;
        }

        /**
         * @en The current format of the swapchain being used.
         * @zh 当前使用的swapchain的格式。
         */
        get swapchainFormat() {
          return this._swapchainFormat;
        }

        /**
         * @en Renderer description.
         * @zh 渲染器描述。
         */
        get renderer() {
          return this._renderer;
        }

        /**
         * @en Vendor description.
         * @zh 厂商描述。
         */
        get vendor() {
          return this._vendor;
        }

        /**
         * @en Number of draw calls currently recorded.
         * @zh 绘制调用次数。
         */
        get numDrawCalls() {
          return this._numDrawCalls;
        }

        /**
         * @en Number of instances currently recorded.
         * @zh 绘制 Instance 数量。
         */
        get numInstances() {
          return this._numInstances;
        }

        /**
         * @en Number of triangles currently recorded.
         * @zh 渲染三角形数量。
         */
        get numTris() {
          return this._numTris;
        }

        /**
         * @en Number of compute dispatches currently recorded.
         * @zh 计算调度（dispatch）次数。
         */
        get numDispatches() {
          return this._numDispatches;
        }

        /**
         * @en Total memory size currently allocated.
         * @zh 内存状态。
         */
        get memoryStatus() {
          return this._memoryStatus;
        }

        /**
         * @en Current device capabilities.
         * @zh 当前设备能力数据。
         */
        get capabilities() {
          return this._caps;
        }

        /**
         * @en Current device binding mappings.
         * @zh 当前设备的绑定槽位映射关系。
         */
        get bindingMappingInfo() {
          return this._bindingMappingInfo;
        } // Hack for WebGL device initialization process
        /**
         * @en Acquire next swapchain image.
         * @zh 获取下一个交换链缓冲。
         */
        /**
         * @en Present current swapchain image.
         * @zh 上屏当前交换链缓冲。
         */
        /**
         * @en Flush the specified command buffers.
         * @zh 实际录制指定的命令缓冲。
         */
        /**
         * @en Create command buffer.
         * @zh 创建命令缓冲。
         * @param info GFX command buffer description info.
         */
        /**
         * @en Create swapchain.
         * @zh 创建交换链。
         * @param info GFX swapchain description info.
         */
        /**
         * @en Create buffer.
         * @zh 创建缓冲。
         * @param info GFX buffer description info.
         */
        /**
         * @en Create texture.
         * @zh 创建纹理。
         * @param info GFX texture description info.
         */
        /**
         * @en Create descriptor sets.
         * @zh 创建描述符集组。
         * @param info GFX descriptor sets description info.
         */
        /**
         * @en Create shader.
         * @zh 创建着色器。
         * @param info GFX shader description info.
         */
        /**
         * @en Create input assembler.
         * @zh 创建纹理。
         * @param info GFX input assembler description info.
         */
        /**
         * @en Create render pass.
         * @zh 创建渲染过程。
         * @param info GFX render pass description info.
         */
        /**
         * @en Create frame buffer.
         * @zh 创建帧缓冲。
         * @param info GFX frame buffer description info.
         */
        /**
         * @en Create descriptor set layout.
         * @zh 创建描述符集布局。
         * @param info GFX descriptor set layout description info.
         */
        /**
         * @en Create pipeline layout.
         * @zh 创建管线布局。
         * @param info GFX pipeline layout description info.
         */
        /**
         * @en Create pipeline state.
         * @zh 创建管线状态。
         * @param info GFX pipeline state description info.
         */
        /**
         * @en Create queue.
         * @zh 创建队列。
         * @param info GFX queue description info.
         */
        /**
         * @en Create sampler.
         * @zh 创建采样器。
         * @param info GFX sampler description info.
         */
        /**
         * @en Get swapchains.
         * @zh 获取交换链列表。
         */
        /**
         * @en Create global barrier.
         * @zh 创建全局内存屏障。
         * @param info GFX global barrier description info.
         */
        /**
         * @en Create texture barrier.
         * @zh 创建贴图内存屏障。
         * @param info GFX texture barrier description info.
         */
        /**
         * @en Create buffer barrier.
         * @zh 创建buffer内存屏障。
         * @param info GFX buffer barrier description info.
         */
        /**
         * @en Copy buffers to texture.
         * @zh 拷贝缓冲到纹理。
         * @param buffers The buffers to be copied.
         * @param texture The texture to copy to.
         * @param regions The region descriptions.
         */
        /**
         * @en Copy texture to buffers
         * @zh 拷贝纹理到缓冲
         * @param texture The texture to be copied.
         * @param buffers The buffer to copy to.
         * @param regions The region descriptions
         */
        /**
         * @en Copy texture images to texture.
         * @zh 拷贝图像到纹理。
         * @param texImages The texture to be copied.
         * @param texture The texture to copy to.
         * @param regions The region descriptions.
         */
        /**
         * @en Whether the device has specific feature.
         * @zh 是否具备特性。
         * @param feature The GFX feature to be queried.
         */
        hasFeature(feature) {
          return this._features[feature];
        }

        /**
         * @en The extent a specific format is supported by the backend.
         * @zh 后端对特定格式的支持程度。
         * @param format The GFX format to be queried.
         */
        getFormatFeatures(format) {
          return this._formatFeatures[format];
        }

        /**
         * @en Enable automatically barrier deduction GFX inside, no effect on web.
         * @zh 是否开启自动GFX内部barrier推导，web无影响。
         * @param format The GFX format to be queried.
         */
        enableAutoBarrier(en) {
          // noop
        }

        /**
         * @en Get maximum supported sample count.
         * @zh 获取最大可支持的 Samples 参数
         * @param format The GFX texture format.
         * @param usage The GFX texture usage.
         * @param flags The GFX texture create flags.
         */
        getMaxSampleCount(format, usage, flags) {
          return SampleCount.X1;
        }
      });
      /** @mangle */
      /** @mangle */
      Device.canvas = void 0;
      _export("DefaultResource", DefaultResource = class DefaultResource {
        constructor(device) {
          this._texture2D = null;
          this._texture3D = null;
          this._textureCube = null;
          this._texture2DArray = null;
          const capabilities = device.capabilities;
          const bufferSize = 64;
          // create a new buffer and fill it with a white pixel
          const buffer = new Uint8Array(bufferSize);
          buffer.fill(255);
          if (capabilities.maxTextureSize >= 2) {
            this._texture2D = device.createTexture(new TextureInfo(TextureType.TEX2D, TextureUsageBit.STORAGE | TextureUsageBit.SAMPLED, Format.RGBA8, 2, 2, TextureFlagBit.NONE));
            const copyRegion = new BufferTextureCopy(0, 0, 0, new Offset(0, 0, 0), new Extent(2, 2, 1));
            device.copyBuffersToTexture([buffer], this._texture2D, [copyRegion]);
          }
          if (capabilities.maxTextureSize >= 2) {
            this._textureCube = device.createTexture(new TextureInfo(TextureType.CUBE, TextureUsageBit.STORAGE | TextureUsageBit.SAMPLED, Format.RGBA8, 2, 2, TextureFlagBit.NONE, 6));
            const copyRegion = new BufferTextureCopy(0, 0, 0, new Offset(0, 0, 0), new Extent(2, 2, 1));
            device.copyBuffersToTexture([buffer], this._textureCube, [copyRegion]);
            copyRegion.texSubres.baseArrayLayer = 1;
            device.copyBuffersToTexture([buffer], this._textureCube, [copyRegion]);
            copyRegion.texSubres.baseArrayLayer = 2;
            device.copyBuffersToTexture([buffer], this._textureCube, [copyRegion]);
            copyRegion.texSubres.baseArrayLayer = 3;
            device.copyBuffersToTexture([buffer], this._textureCube, [copyRegion]);
            copyRegion.texSubres.baseArrayLayer = 4;
            device.copyBuffersToTexture([buffer], this._textureCube, [copyRegion]);
            copyRegion.texSubres.baseArrayLayer = 5;
            device.copyBuffersToTexture([buffer], this._textureCube, [copyRegion]);
          }
          if (capabilities.max3DTextureSize >= 2) {
            this._texture3D = device.createTexture(new TextureInfo(TextureType.TEX3D, TextureUsageBit.STORAGE | TextureUsageBit.SAMPLED, Format.RGBA8, 2, 2, TextureFlagBit.NONE, 1, 1, SampleCount.X1, 2));
            const copyRegion = new BufferTextureCopy(0, 0, 0, new Offset(0, 0, 0), new Extent(2, 2, 2), new TextureSubresLayers(0, 0, 1));
            device.copyBuffersToTexture([buffer], this._texture3D, [copyRegion]);
          }
          if (capabilities.maxArrayTextureLayers >= 2) {
            this._texture2DArray = device.createTexture(new TextureInfo(TextureType.TEX2D_ARRAY, TextureUsageBit.STORAGE | TextureUsageBit.SAMPLED, Format.RGBA8, 2, 2, TextureFlagBit.NONE, 2));
            const copyRegion = new BufferTextureCopy(0, 0, 0, new Offset(0, 0, 0), new Extent(2, 2, 1), new TextureSubresLayers(0, 0, 1));
            device.copyBuffersToTexture([buffer], this._texture2DArray, [copyRegion]);
            copyRegion.texSubres.baseArrayLayer = 1;
            device.copyBuffersToTexture([buffer], this._texture2DArray, [copyRegion]);
          }
        }
        getTexture(type) {
          switch (type) {
            case TextureType.TEX2D:
              return this._texture2D;
            case TextureType.TEX3D:
              return this._texture3D;
            case TextureType.CUBE:
              return this._textureCube;
            case TextureType.TEX2D_ARRAY:
              return this._texture2DArray;
            default:
              return null;
          }
        }
      });
    }
  };
});