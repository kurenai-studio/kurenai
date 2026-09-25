System.register("q-bundled:///fs/cocos/gfx/webgl/webgl-framebuffer.js", ["../base/framebuffer.js", "./webgl-commands.js", "./webgl-define.js"], function (_export, _context) {
  "use strict";

  var Framebuffer, WebGLCmdFuncCreateFramebuffer, WebGLCmdFuncDestroyFramebuffer, WebGLDeviceManager, WebGLFramebuffer;
  _export("WebGLFramebuffer", void 0);
  return {
    setters: [function (_baseFramebufferJs) {
      Framebuffer = _baseFramebufferJs.Framebuffer;
    }, function (_webglCommandsJs) {
      WebGLCmdFuncCreateFramebuffer = _webglCommandsJs.WebGLCmdFuncCreateFramebuffer;
      WebGLCmdFuncDestroyFramebuffer = _webglCommandsJs.WebGLCmdFuncDestroyFramebuffer;
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
      _export("WebGLFramebuffer", WebGLFramebuffer = class WebGLFramebuffer extends Framebuffer {
        getGpuFramebuffer() {
          return this._gpuFramebuffer;
        }
        constructor() {
          super();
          this._gpuFramebuffer = null;
          this._gpuColorTextures = [];
          this._gpuDepthStencilTexture = void 0;
        }
        get needRebuild() {
          const gpuFramebuffer = this._gpuFramebuffer;
          if (gpuFramebuffer) {
            var _gpuFramebuffer$gpuDe;
            for (let i = 0; i < gpuFramebuffer.gpuColorTextures.length; i++) {
              if (gpuFramebuffer.gpuColorTextures[i].glTexture !== this._gpuColorTextures[i]) {
                return true;
              }
            }
            if (((_gpuFramebuffer$gpuDe = gpuFramebuffer.gpuDepthStencilTexture) == null ? void 0 : _gpuFramebuffer$gpuDe.glTexture) !== this._gpuDepthStencilTexture) {
              return true;
            }
          }
          return false;
        }
        initialize(info) {
          var _this$_gpuFramebuffer;
          this._renderPass = info.renderPass;
          this._colorTextures = info.colorTextures || [];
          const depthStencilTexture = this._depthStencilTexture = info.depthStencilTexture || null;
          let lodLevel = 0;
          const gpuColorTextures = [];
          for (let i = 0; i < info.colorTextures.length; ++i) {
            const colorTexture = info.colorTextures[i];
            if (colorTexture) {
              gpuColorTextures.push(colorTexture.gpuTexture);
              lodLevel = colorTexture.lodLevel;
            }
          }
          let gpuDepthStencilTexture = null;
          if (depthStencilTexture) {
            gpuDepthStencilTexture = depthStencilTexture.gpuTexture;
            lodLevel = depthStencilTexture.lodLevel;
          }
          let width = Number.MAX_SAFE_INTEGER;
          let height = Number.MAX_SAFE_INTEGER;
          this._gpuFramebuffer = {
            gpuRenderPass: info.renderPass.gpuRenderPass,
            gpuColorTextures,
            gpuDepthStencilTexture,
            glFramebuffer: null,
            isOffscreen: true,
            get width() {
              if (this.gpuColorTextures.length > 0) {
                return this.gpuColorTextures[0].width;
              } else if (this.gpuDepthStencilTexture) {
                return this.gpuDepthStencilTexture.width;
              }
              return width;
            },
            set width(val) {
              width = val;
            },
            get height() {
              if (this.gpuColorTextures.length > 0) {
                return this.gpuColorTextures[0].height;
              } else if (this.gpuDepthStencilTexture) {
                return this.gpuDepthStencilTexture.height;
              }
              return height;
            },
            set height(val) {
              height = val;
            },
            lodLevel
          };
          WebGLCmdFuncCreateFramebuffer(WebGLDeviceManager.instance, this._gpuFramebuffer);
          this._gpuFramebuffer.gpuColorTextures.forEach(tex => this._gpuColorTextures.push(tex.glTexture));
          this._gpuDepthStencilTexture = (_this$_gpuFramebuffer = this._gpuFramebuffer.gpuDepthStencilTexture) == null ? void 0 : _this$_gpuFramebuffer.glTexture;
          this._width = this._gpuFramebuffer.width;
          this._height = this._gpuFramebuffer.height;
        }
        destroy() {
          if (this._gpuFramebuffer) {
            WebGLCmdFuncDestroyFramebuffer(WebGLDeviceManager.instance, this._gpuFramebuffer);
            this._gpuFramebuffer = null;
            this._gpuColorTextures.length = 0;
            this._gpuDepthStencilTexture = null;
          }
        }
      });
    }
  };
});