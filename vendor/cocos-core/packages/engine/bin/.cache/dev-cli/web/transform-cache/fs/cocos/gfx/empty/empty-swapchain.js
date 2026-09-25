System.register("q-bundled:///fs/cocos/gfx/empty/empty-swapchain.js", ["../base/define.js", "../base/swapchain.js", "./empty-texture.js"], function (_export, _context) {
  "use strict";

  var Format, Swapchain, EmptyTexture, EmptySwapchain;
  _export("EmptySwapchain", void 0);
  return {
    setters: [function (_baseDefineJs) {
      Format = _baseDefineJs.Format;
    }, function (_baseSwapchainJs) {
      Swapchain = _baseSwapchainJs.Swapchain;
    }, function (_emptyTextureJs) {
      EmptyTexture = _emptyTextureJs.EmptyTexture;
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
      _export("EmptySwapchain", EmptySwapchain = class EmptySwapchain extends Swapchain {
        initialize(info) {
          this._colorTexture = new EmptyTexture();
          this._colorTexture.initAsSwapchainTexture({
            swapchain: this,
            format: Format.RGBA8,
            width: info.width,
            height: info.height
          });
          this._depthStencilTexture = new EmptyTexture();
          this._depthStencilTexture.initAsSwapchainTexture({
            swapchain: this,
            format: Format.DEPTH_STENCIL,
            width: info.width,
            height: info.height
          });
        }
        destroy() {}
        resize(width, height, surfaceTransform) {}
      });
    }
  };
});