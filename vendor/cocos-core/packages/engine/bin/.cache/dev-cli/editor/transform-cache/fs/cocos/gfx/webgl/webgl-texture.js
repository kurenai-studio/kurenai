System.register("q-bundled:///fs/cocos/gfx/webgl/webgl-texture.js", ["../base/define.js", "../base/texture.js", "./webgl-commands.js", "./webgl-define.js"], function (_export, _context) {
  "use strict";

  var FormatSurfaceSize, TextureInfo, IsPowerOf2, TextureUsageBit, FormatInfos, Texture, WebGLCmdFuncCreateTexture, WebGLCmdFuncDestroyTexture, WebGLCmdFuncResizeTexture, WebGLDeviceManager, WebGLTexture;
  _export("WebGLTexture", void 0);
  return {
    setters: [function (_baseDefineJs) {
      FormatSurfaceSize = _baseDefineJs.FormatSurfaceSize;
      TextureInfo = _baseDefineJs.TextureInfo;
      IsPowerOf2 = _baseDefineJs.IsPowerOf2;
      TextureUsageBit = _baseDefineJs.TextureUsageBit;
      FormatInfos = _baseDefineJs.FormatInfos;
    }, function (_baseTextureJs) {
      Texture = _baseTextureJs.Texture;
    }, function (_webglCommandsJs) {
      WebGLCmdFuncCreateTexture = _webglCommandsJs.WebGLCmdFuncCreateTexture;
      WebGLCmdFuncDestroyTexture = _webglCommandsJs.WebGLCmdFuncDestroyTexture;
      WebGLCmdFuncResizeTexture = _webglCommandsJs.WebGLCmdFuncResizeTexture;
    }, function (_webglDefineJs) {
      WebGLDeviceManager = _webglDefineJs.WebGLDeviceManager;
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
      /** @mangle */
      _export("WebGLTexture", WebGLTexture = class WebGLTexture extends Texture {
        get gpuTexture() {
          return this._gpuTexture;
        }
        get lodLevel() {
          return this._lodLevel;
        }
        constructor() {
          super();
          this._gpuTexture = null;
          this._lodLevel = 0;
        }
        initialize(info, isSwapchainTexture) {
          const self = this;
          const {
            instance
          } = WebGLDeviceManager;
          let texInfo = info;
          const viewInfo = info;
          if ('texture' in info) {
            texInfo = viewInfo.texture.info;
            self._isTextureView = true;
          }
          const thisTextureInfo = self._info;
          thisTextureInfo.copy(texInfo);
          const thisViewInfo = self._viewInfo;
          self._isPowerOf2 = IsPowerOf2(thisTextureInfo.width) && IsPowerOf2(thisTextureInfo.height);
          self._size = FormatSurfaceSize(thisTextureInfo.format, self.width, self.height, self.depth, thisTextureInfo.levelCount) * thisTextureInfo.layerCount;
          if (!self._isTextureView) {
            self._gpuTexture = {
              type: texInfo.type,
              format: texInfo.format,
              usage: texInfo.usage,
              width: texInfo.width,
              height: texInfo.height,
              depth: texInfo.depth,
              size: self._size,
              arrayLayer: texInfo.layerCount,
              mipLevel: texInfo.levelCount,
              samples: texInfo.samples,
              flags: texInfo.flags,
              isPowerOf2: self._isPowerOf2,
              glTarget: 0,
              glInternalFmt: 0,
              glFormat: 0,
              glType: 0,
              glUsage: 0,
              glTexture: null,
              glRenderbuffer: null,
              glWrapS: 0,
              glWrapT: 0,
              glMinFilter: 0,
              glMagFilter: 0,
              isSwapchainTexture: isSwapchainTexture || false
            };
            if (!self._gpuTexture.isSwapchainTexture) {
              WebGLCmdFuncCreateTexture(instance, self._gpuTexture);
              instance.memoryStatus.textureSize += self._size;
            }
            thisViewInfo.texture = self;
            thisViewInfo.type = info.type;
            thisViewInfo.format = info.format;
            thisViewInfo.baseLevel = 0;
            thisViewInfo.levelCount = info.levelCount;
            thisViewInfo.baseLayer = 0;
            thisViewInfo.layerCount = info.layerCount;
          } else {
            thisViewInfo.copy(viewInfo);
            self._lodLevel = viewInfo.baseLevel;
            self._gpuTexture = viewInfo.texture._gpuTexture;
          }
        }
        destroy() {
          const self = this;
          const {
            instance
          } = WebGLDeviceManager;
          if (!self._isTextureView && self._gpuTexture) {
            WebGLCmdFuncDestroyTexture(instance, self._gpuTexture);
            instance.memoryStatus.textureSize -= self._size;
            self._gpuTexture = null;
          }
        }
        getTextureHandle() {
          const gpuTexture = this._gpuTexture;
          if (!gpuTexture) {
            return 0;
          }
          if (gpuTexture.glTexture) {
            return gpuTexture.glTexture;
          } else if (gpuTexture.glRenderbuffer) {
            return gpuTexture.glRenderbuffer;
          }
          return 0;
        }
        resize(width, height) {
          const self = this;
          const {
            instance
          } = WebGLDeviceManager;
          const thisTextureInfo = self._info;
          if (thisTextureInfo.width === width && thisTextureInfo.height === height) {
            return;
          }
          if (thisTextureInfo.levelCount === WebGLTexture.getLevelCount(thisTextureInfo.width, thisTextureInfo.height)) {
            thisTextureInfo.levelCount = WebGLTexture.getLevelCount(width, height);
          } else if (thisTextureInfo.levelCount > 1) {
            thisTextureInfo.levelCount = Math.min(thisTextureInfo.levelCount, WebGLTexture.getLevelCount(width, height));
          }
          const oldSize = self._size;
          thisTextureInfo.width = width;
          thisTextureInfo.height = height;
          self._size = FormatSurfaceSize(thisTextureInfo.format, self.width, self.height, self.depth, thisTextureInfo.levelCount) * thisTextureInfo.layerCount;
          const thisGpuTexture = self._gpuTexture;
          if (!self._isTextureView && thisGpuTexture) {
            thisGpuTexture.width = width;
            thisGpuTexture.height = height;
            thisGpuTexture.size = self._size;
            if (!thisGpuTexture.isSwapchainTexture) {
              WebGLCmdFuncResizeTexture(instance, thisGpuTexture);
              instance.memoryStatus.textureSize -= oldSize;
              instance.memoryStatus.textureSize += self._size;
            }
          }
        }

        // ======================= Swapchain Specific ======================= //

        /**
         * @engineInternal
         */
        initAsSwapchainTexture(info) {
          const texInfo = new TextureInfo();
          texInfo.format = info.format;
          texInfo.usage = FormatInfos[info.format].hasDepth ? TextureUsageBit.DEPTH_STENCIL_ATTACHMENT : TextureUsageBit.COLOR_ATTACHMENT;
          texInfo.width = info.width;
          texInfo.height = info.height;
          this.initialize(texInfo, true);
        }
      });
    }
  };
});