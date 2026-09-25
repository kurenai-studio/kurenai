System.register("q-bundled:///fs/cocos/gfx/empty/empty-texture.js", ["../base/define.js", "../base/texture.js"], function (_export, _context) {
  "use strict";

  var FormatSurfaceSize, IsPowerOf2, Texture, EmptyTexture;
  _export("EmptyTexture", void 0);
  return {
    setters: [function (_baseDefineJs) {
      FormatSurfaceSize = _baseDefineJs.FormatSurfaceSize;
      IsPowerOf2 = _baseDefineJs.IsPowerOf2;
    }, function (_baseTextureJs) {
      Texture = _baseTextureJs.Texture;
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
      _export("EmptyTexture", EmptyTexture = class EmptyTexture extends Texture {
        initialize(info, isSwapchainTexture) {
          let texInfo = info;
          if ('texture' in info) {
            texInfo = info.texture.info;
            this._isTextureView = true;
            this._viewInfo.copy(info);
          } else {
            this._viewInfo.texture = this;
            this._viewInfo.type = info.type;
            this._viewInfo.format = info.format;
            this._viewInfo.baseLevel = 0;
            this._viewInfo.levelCount = 1;
            this._viewInfo.baseLayer = 0;
            this._viewInfo.layerCount = 1;
          }
          this._info.copy(texInfo);
          this._isPowerOf2 = IsPowerOf2(this._info.width) && IsPowerOf2(this._info.height);
          this._size = FormatSurfaceSize(this._info.format, this.width, this.height, this.depth, this._info.levelCount) * this._info.layerCount;
        }
        destroy() {}
        getTextureHandle() {
          return 0;
        }
        resize(width, height) {
          this._info.width = width;
          this._info.height = height;
        }
        /**
         * @engineInternal
         */
        initAsSwapchainTexture(info) {}
      });
    }
  };
});