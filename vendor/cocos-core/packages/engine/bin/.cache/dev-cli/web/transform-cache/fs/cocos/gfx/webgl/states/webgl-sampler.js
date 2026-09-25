System.register("q-bundled:///fs/cocos/gfx/webgl/states/webgl-sampler.js", ["../../base/define.js", "../../base/states/sampler.js", "../../gl-constants.js"], function (_export, _context) {
  "use strict";

  var Filter, Sampler, WebGLConstants, WebGLSampler, WebGLWraps;
  _export("WebGLSampler", void 0);
  return {
    setters: [function (_baseDefineJs) {
      Filter = _baseDefineJs.Filter;
    }, function (_baseStatesSamplerJs) {
      Sampler = _baseStatesSamplerJs.Sampler;
    }, function (_glConstantsJs) {
      WebGLConstants = _glConstantsJs.WebGLConstants;
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
      WebGLWraps = [0x2901,
      // WebGLRenderingContext.REPEAT,
      0x8370,
      // WebGLRenderingContext.MIRRORED_REPEAT,
      0x812F,
      // WebGLRenderingContext.CLAMP_TO_EDGE,
      0x812F // WebGLRenderingContext.CLAMP_TO_EDGE,
      ];
      /** @mangle */
      _export("WebGLSampler", WebGLSampler = class WebGLSampler extends Sampler {
        get gpuSampler() {
          return this._gpuSampler;
        }
        constructor(info, hash) {
          super(info, hash);
          this._gpuSampler = null;
          let glMinFilter = 0;
          let glMagFilter = 0;
          const minFilter = this._info.minFilter;
          const magFilter = this._info.magFilter;
          const mipFilter = this._info.mipFilter;
          if (minFilter === Filter.LINEAR || minFilter === Filter.ANISOTROPIC) {
            if (mipFilter === Filter.LINEAR || mipFilter === Filter.ANISOTROPIC) {
              glMinFilter = WebGLConstants.LINEAR_MIPMAP_LINEAR;
            } else if (mipFilter === Filter.POINT) {
              glMinFilter = WebGLConstants.LINEAR_MIPMAP_NEAREST;
            } else {
              glMinFilter = WebGLConstants.LINEAR;
            }
          } else if (mipFilter === Filter.LINEAR || mipFilter === Filter.ANISOTROPIC) {
            glMinFilter = WebGLConstants.NEAREST_MIPMAP_LINEAR;
          } else if (mipFilter === Filter.POINT) {
            glMinFilter = WebGLConstants.NEAREST_MIPMAP_NEAREST;
          } else {
            glMinFilter = WebGLConstants.NEAREST;
          }
          if (magFilter === Filter.LINEAR || magFilter === Filter.ANISOTROPIC) {
            glMagFilter = WebGLConstants.LINEAR;
          } else {
            glMagFilter = WebGLConstants.NEAREST;
          }
          const glWrapS = WebGLWraps[this._info.addressU];
          const glWrapT = WebGLWraps[this._info.addressV];
          const glWrapR = WebGLWraps[this._info.addressW];
          this._gpuSampler = {
            glMinFilter,
            glMagFilter,
            glWrapS,
            glWrapT,
            glWrapR
          };
        }
      });
    }
  };
});