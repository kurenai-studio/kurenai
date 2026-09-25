System.register("q-bundled:///fs/cocos/gfx/webgpu/webgpu-swapchain.js", ["../base/define.js", "../base/swapchain.js", "./webgpu-texture.js", "../../core/index.js", "./define.js", "./webgpu-commands.js", "./webgpu-gpu-objects.js"], function (_export, _context) {
  "use strict";

  var BufferTextureCopy, Format, TextureFlagBit, TextureInfo, TextureType, TextureUsageBit, Swapchain, WebGPUTexture, debug, warn, warnID, WebGPUDeviceManager, GFXFormatToWGPUFormat, IWebGPUBlitManager, WebGPUSwapchain;
  _export("WebGPUSwapchain", void 0);
  return {
    setters: [function (_baseDefineJs) {
      BufferTextureCopy = _baseDefineJs.BufferTextureCopy;
      Format = _baseDefineJs.Format;
      TextureFlagBit = _baseDefineJs.TextureFlagBit;
      TextureInfo = _baseDefineJs.TextureInfo;
      TextureType = _baseDefineJs.TextureType;
      TextureUsageBit = _baseDefineJs.TextureUsageBit;
    }, function (_baseSwapchainJs) {
      Swapchain = _baseSwapchainJs.Swapchain;
    }, function (_webgpuTextureJs) {
      WebGPUTexture = _webgpuTextureJs.WebGPUTexture;
    }, function (_coreIndexJs) {
      debug = _coreIndexJs.debug;
      warn = _coreIndexJs.warn;
      warnID = _coreIndexJs.warnID;
    }, function (_defineJs) {
      WebGPUDeviceManager = _defineJs.WebGPUDeviceManager;
    }, function (_webgpuCommandsJs) {
      GFXFormatToWGPUFormat = _webgpuCommandsJs.GFXFormatToWGPUFormat;
    }, function (_webgpuGpuObjectsJs) {
      IWebGPUBlitManager = _webgpuGpuObjectsJs.IWebGPUBlitManager;
    }],
    execute: function () {
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
      /**
       * @en GFX Swapchain implementation based on WebGPU.
       * @zh 基于 WebGPU 的 GFX 交换链实现。
       */
      _export("WebGPUSwapchain", WebGPUSwapchain = class WebGPUSwapchain extends Swapchain {
        constructor(...args) {
          super(...args);
          this.nullTex2D = null;
          this.nullTexCube = null;
          this._canvas = null;
          this._blitManager = null;
          this._webGPUDeviceLostHandler = null;
        }
        get blitManager() {
          return this._blitManager;
        }
        initialize(info) {
          this._canvas = info.windowHandle;
          const {
            width,
            height
          } = info;
          this._canvas.width = width;
          this._canvas.height = height;
          this._webGPUDeviceLostHandler = this._onWebGPUDeviceLost.bind(this);
          const device = WebGPUDeviceManager.instance;
          const nativeDevice = device.nativeDevice;
          nativeDevice.lost.then(this._webGPUDeviceLostHandler).catch(reasons => {
            // noop
          });
          const capabilities = device.capabilities;
          device.stateCache.initialize(capabilities.maxTextureUnits, capabilities.maxUniformBufferBindings, capabilities.maxVertexAttributes);
          this._createTexture(width, height);
          this._depthStencilTexture = this._createDepthStencilTexture(width, height);
          this.nullTex2D = device.createTexture(new TextureInfo(TextureType.TEX2D, TextureUsageBit.SAMPLED | TextureUsageBit.TRANSFER_DST, Format.RGBA8, 2, 2, TextureFlagBit.NONE));
          this.nullTexCube = device.createTexture(new TextureInfo(TextureType.CUBE, TextureUsageBit.SAMPLED | TextureUsageBit.TRANSFER_DST, Format.RGBA8, 2, 2, TextureFlagBit.NONE, 6));
          const nullTexRegion = new BufferTextureCopy();
          nullTexRegion.texExtent.width = 2;
          nullTexRegion.texExtent.height = 2;
          const nullTexBuff = new Uint8Array(this.nullTex2D.size);
          nullTexBuff.fill(0);
          device.copyBuffersToTexture([nullTexBuff], this.nullTex2D, [nullTexRegion]);
          nullTexRegion.texSubres.layerCount = 6;
          device.copyBuffersToTexture([nullTexBuff, nullTexBuff, nullTexBuff, nullTexBuff, nullTexBuff, nullTexBuff], this.nullTexCube, [nullTexRegion]);
          this._blitManager = new IWebGPUBlitManager();
        }
        resize(width, height, surfaceTransform) {
          const device = WebGPUDeviceManager.instance.nativeDevice;
          // Make sure it's valid for WebGPU
          width = Math.max(1, Math.min(width, device.limits.maxTextureDimension2D));
          height = Math.max(1, Math.min(height, device.limits.maxTextureDimension2D));
          if (this._colorTexture.width !== width || this._colorTexture.height !== height) {
            debug(`Resizing swapchain: ${width}x${height}`);
            this._canvas.width = width;
            this._canvas.height = height;
            this._colorTexture.resize(width, height);
            this._depthStencilTexture.resize(width, height);
          }
        }
        destroy() {
          if (this._canvas && this._webGPUDeviceLostHandler) {
            this._webGPUDeviceLostHandler = null;
          }
          if (this.nullTex2D) {
            this.nullTex2D.destroy();
            this.nullTex2D = null;
          }
          if (this.nullTexCube) {
            this.nullTexCube.destroy();
            this.nullTexCube = null;
          }
          if (this._blitManager) {
            this._blitManager.destroy();
            this._blitManager = null;
          }
          this._canvas = null;
        }
        get colorTexture() {
          this._colorTexture.gpuTexture.gpuTexture = WebGPUDeviceManager.instance.context.getCurrentTexture();
          return this._colorTexture;
        }
        get colorGPUTexture() {
          this._colorTexture.gpuTexture.gpuTexture = WebGPUDeviceManager.instance.context.getCurrentTexture();
          return this._colorTexture.gpuTexture.gpuTexture;
        }
        get colorGPUTextureView() {
          this._colorTexture.gpuTexture.gpuTexture = WebGPUDeviceManager.instance.context.getCurrentTexture();
          return this._colorTexture.gpuTexture.gpuTexture.createView();
        }
        get depthStencilTexture() {
          return this._depthStencilTexture;
        }
        get gpuDepthStencilTexture() {
          return this._depthStencilTexture.gpuTexture.gpuTexture;
        }
        get gpuDepthStencilTextureView() {
          return this._depthStencilTexture.gpuTexture.gpuTexture.createView();
        }
        _createTexture(width, height) {
          const device = WebGPUDeviceManager.instance;
          const gfxSwapchainFormat = device.swapchainFormat;
          const swapchainFormat = GFXFormatToWGPUFormat(gfxSwapchainFormat); // navigator.gpu.getPreferredCanvasFormat();
          if (!this._colorTexture) {
            const nativeDevice = device.nativeDevice;
            const gpuConfig = {
              device: nativeDevice,
              format: swapchainFormat,
              alphaMode: 'opaque'
            };
            device.gpuConfig = gpuConfig;
            device.context.configure(gpuConfig);
          }
          this._colorTexture = new WebGPUTexture();
          this._colorTexture.initAsSwapchainTexture({
            swapchain: this,
            format: gfxSwapchainFormat,
            width,
            height
          });
          this._colorTexture.gpuTexture.gpuTexture = device.context.getCurrentTexture();
          return this._colorTexture;
        }
        _createDepthStencilTexture(width, height) {
          const device = WebGPUDeviceManager.instance;
          const depthInfo = new TextureInfo(TextureType.TEX2D, TextureUsageBit.DEPTH_STENCIL_ATTACHMENT | TextureUsageBit.SAMPLED, Format.DEPTH_STENCIL, width, height);
          const depthTexture = device.createTexture(depthInfo);
          return depthTexture;
        }
        _onWebGPUDeviceLost(info) {
          warnID(11000);
          warn('webgpu device lost');
        }
      });
    }
  };
});