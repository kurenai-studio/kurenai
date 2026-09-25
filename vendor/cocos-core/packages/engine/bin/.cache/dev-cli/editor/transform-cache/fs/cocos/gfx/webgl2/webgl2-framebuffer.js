System.register("q-bundled:///fs/cocos/gfx/webgl2/webgl2-framebuffer.js", ["../base/framebuffer.js", "./webgl2-commands.js", "./webgl2-define.js"], function (_export, _context) {
  "use strict";

  var Framebuffer, WebGL2CmdFuncCreateFramebuffer, WebGL2CmdFuncDestroyFramebuffer, WebGL2DeviceManager, WebGL2Framebuffer;
  _export("WebGL2Framebuffer", void 0);
  return {
    setters: [function (_baseFramebufferJs) {
      Framebuffer = _baseFramebufferJs.Framebuffer;
    }, function (_webgl2CommandsJs) {
      WebGL2CmdFuncCreateFramebuffer = _webgl2CommandsJs.WebGL2CmdFuncCreateFramebuffer;
      WebGL2CmdFuncDestroyFramebuffer = _webgl2CommandsJs.WebGL2CmdFuncDestroyFramebuffer;
    }, function (_webgl2DefineJs) {
      WebGL2DeviceManager = _webgl2DefineJs.WebGL2DeviceManager;
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
      _export("WebGL2Framebuffer", WebGL2Framebuffer = class WebGL2Framebuffer extends Framebuffer {
        constructor() {
          super();
          this._gpuFramebuffer = null;
          this._gpuColorViews = [];
          this._gpuDepthStencilView = void 0;
        }
        getGpuFramebuffer() {
          return this._gpuFramebuffer;
        }
        get needRebuild() {
          const gpuFramebuffer = this.getGpuFramebuffer();
          if (gpuFramebuffer) {
            var _gpuFramebuffer$gpuDe;
            for (let i = 0; i < gpuFramebuffer.gpuColorViews.length; i++) {
              if (gpuFramebuffer.gpuColorViews[i].gpuTexture.glTexture !== this._gpuColorViews[i]) {
                return true;
              }
            }
            if (((_gpuFramebuffer$gpuDe = gpuFramebuffer.gpuDepthStencilView) == null ? void 0 : _gpuFramebuffer$gpuDe.gpuTexture.glTexture) !== this._gpuDepthStencilView) {
              return true;
            }
          }
          return false;
        }
        initialize(info) {
          var _this$_gpuFramebuffer;
          this._renderPass = info.renderPass;
          this._colorTextures = info.colorTextures || [];
          this._depthStencilTexture = info.depthStencilTexture || null;
          const gpuColorViews = [];
          for (let i = 0; i < info.colorTextures.length; i++) {
            const colorTexture = info.colorTextures[i];
            if (colorTexture) {
              gpuColorViews.push(colorTexture.gpuTextureView);
            }
          }
          let gpuDepthStencilView = null;
          if (info.depthStencilTexture) {
            gpuDepthStencilView = info.depthStencilTexture.gpuTextureView;
          }
          let width = Number.MAX_SAFE_INTEGER;
          let height = Number.MAX_SAFE_INTEGER;
          this._gpuFramebuffer = {
            gpuRenderPass: info.renderPass.getGpuRenderPass(),
            gpuColorViews,
            gpuDepthStencilView,
            glFramebuffer: null,
            isOffscreen: true,
            get width() {
              if (this.gpuColorViews.length > 0) {
                return this.gpuColorViews[0].gpuTexture.width;
              } else if (this.gpuDepthStencilView) {
                return this.gpuDepthStencilView.gpuTexture.width;
              }
              return width;
            },
            set width(val) {
              width = val;
            },
            get height() {
              if (this.gpuColorViews.length > 0) {
                return this.gpuColorViews[0].gpuTexture.height;
              } else if (this.gpuDepthStencilView) {
                return this.gpuDepthStencilView.gpuTexture.height;
              }
              return height;
            },
            set height(val) {
              height = val;
            }
          };
          WebGL2CmdFuncCreateFramebuffer(WebGL2DeviceManager.instance, this._gpuFramebuffer);
          this._gpuFramebuffer.gpuColorViews.forEach(tex => this._gpuColorViews.push(tex.gpuTexture.glTexture));
          this._gpuDepthStencilView = (_this$_gpuFramebuffer = this._gpuFramebuffer.gpuDepthStencilView) == null ? void 0 : _this$_gpuFramebuffer.gpuTexture.glTexture;
          this._width = this._gpuFramebuffer.width;
          this._height = this._gpuFramebuffer.height;
        }
        destroy() {
          if (this._gpuFramebuffer) {
            WebGL2CmdFuncDestroyFramebuffer(WebGL2DeviceManager.instance, this._gpuFramebuffer);
            this._gpuFramebuffer = null;
            this._gpuColorViews.length = 0;
            this._gpuDepthStencilView = null;
          }
        }
      });
    }
  };
});