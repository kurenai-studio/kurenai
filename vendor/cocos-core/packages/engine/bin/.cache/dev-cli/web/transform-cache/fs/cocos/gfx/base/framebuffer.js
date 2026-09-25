System.register("q-bundled:///fs/cocos/gfx/base/framebuffer.js", ["./define.js"], function (_export, _context) {
  "use strict";

  var GFXObject, ObjectType, Framebuffer;
  _export("Framebuffer", void 0);
  return {
    setters: [function (_defineJs) {
      GFXObject = _defineJs.GFXObject;
      ObjectType = _defineJs.ObjectType;
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
       * @en GFX frame buffer.
       * @zh GFX 帧缓冲。
       */
      _export("Framebuffer", Framebuffer = class Framebuffer extends GFXObject {
        /**
         * @en Get current render pass.
         * @zh GFX 渲染过程。
         */
        get renderPass() {
          return this._renderPass;
        }

        /**
         * @en Get current color views.
         * @zh 颜色纹理视图数组。
         */
        get colorTextures() {
          return this._colorTextures;
        }

        /**
         * @en Get current depth stencil views.
         * @zh 深度模板纹理视图。
         */
        get depthStencilTexture() {
          return this._depthStencilTexture;
        }
        get width() {
          if (this.colorTextures.length > 0) {
            var _this$colorTextures$, _this$colorTextures$2;
            return (_this$colorTextures$ = (_this$colorTextures$2 = this.colorTextures[0]) == null ? void 0 : _this$colorTextures$2.width) != null ? _this$colorTextures$ : this._width;
          } else if (this.depthStencilTexture) {
            return this.depthStencilTexture.width;
          }
          return this._width;
        }
        get height() {
          if (this.colorTextures.length > 0) {
            var _this$colorTextures$3, _this$colorTextures$4;
            return (_this$colorTextures$3 = (_this$colorTextures$4 = this.colorTextures[0]) == null ? void 0 : _this$colorTextures$4.height) != null ? _this$colorTextures$3 : this._height;
          } else if (this.depthStencilTexture) {
            return this.depthStencilTexture.height;
          }
          return this._height;
        }
        get needRebuild() {
          return false;
        }

        /** @mangle */

        constructor() {
          super(ObjectType.FRAMEBUFFER);
          this._renderPass = null;
          /** @mangle */
          this._colorTextures = [];
          /** @mangle */
          this._depthStencilTexture = null;
          /** @mangle */
          this._width = 0;
          /** @mangle */
          this._height = 0;
        }
      });
    }
  };
});