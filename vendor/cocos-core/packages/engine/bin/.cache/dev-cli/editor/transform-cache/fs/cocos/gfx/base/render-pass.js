System.register("q-bundled:///fs/cocos/gfx/base/render-pass.js", ["../../core/algorithm/murmurhash2_gc.js", "./define.js"], function (_export, _context) {
  "use strict";

  var murmurhash2_32_gc, GFXObject, ObjectType, RenderPass;
  _export("RenderPass", void 0);
  return {
    setters: [function (_coreAlgorithmMurmurhash2_gcJs) {
      murmurhash2_32_gc = _coreAlgorithmMurmurhash2_gcJs.murmurhash2_32_gc;
    }, function (_defineJs) {
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
       * @en GFX render pass.
       * @zh GFX 渲染过程。
       */
      _export("RenderPass", RenderPass = class RenderPass extends GFXObject {
        get colorAttachments() {
          return this._colorInfos;
        }
        get depthStencilAttachment() {
          return this._depthStencilInfo;
        }
        get subPasses() {
          return this._subpasses;
        }
        get hash() {
          return this._hash;
        }
        constructor() {
          super(ObjectType.RENDER_PASS);
          /** @mangle */
          this._colorInfos = [];
          /** @mangle */
          this._depthStencilInfo = null;
          /** @mangle */
          this._subpasses = [];
          /** @mangle */
          this._hash = 0;
        }

        // Based on render pass compatibility
        computeHash() {
          let res = '';
          if (this._subpasses.length) {
            for (let i = 0; i < this._subpasses.length; ++i) {
              const subpass = this._subpasses[i];
              if (subpass.inputs.length) {
                res += 'ia';
                for (let j = 0; j < subpass.inputs.length; ++j) {
                  const ia = this._colorInfos[subpass.inputs[j]];
                  res += `,${ia.format},${ia.sampleCount}`;
                }
              }
              if (subpass.colors.length) {
                res += 'ca';
                for (let j = 0; j < subpass.colors.length; ++j) {
                  const ca = this._colorInfos[subpass.colors[j]];
                  res += `,${ca.format},${ca.sampleCount}`;
                }
              }
              if (subpass.depthStencil >= 0) {
                const ds = this._colorInfos[subpass.depthStencil];
                res += `ds,${ds.format},${ds.sampleCount}`;
              }
            }
          } else {
            res += 'ca';
            for (let i = 0; i < this._colorInfos.length; ++i) {
              const ca = this._colorInfos[i];
              res += `,${ca.format},${ca.sampleCount}`;
            }
            const ds = this._depthStencilInfo;
            if (ds) {
              res += `ds,${ds.format},${ds.sampleCount}`;
            }
          }
          return murmurhash2_32_gc(res, 666);
        }
      });
    }
  };
});