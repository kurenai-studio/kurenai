System.register("q-bundled:///fs/cocos/gfx/base/states/texture-barrier.js", ["../../../core/algorithm/murmurhash2_gc.js", "../define.js"], function (_export, _context) {
  "use strict";

  var murmurhash2_32_gc, GFXObject, ObjectType, TextureBarrierInfo, TextureBarrier;
  _export("TextureBarrier", void 0);
  return {
    setters: [function (_coreAlgorithmMurmurhash2_gcJs) {
      murmurhash2_32_gc = _coreAlgorithmMurmurhash2_gcJs.murmurhash2_32_gc;
    }, function (_defineJs) {
      GFXObject = _defineJs.GFXObject;
      ObjectType = _defineJs.ObjectType;
      TextureBarrierInfo = _defineJs.TextureBarrierInfo;
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
       * @en GFX texture barrier.
       * @zh GFX 贴图内存屏障。
       */
      _export("TextureBarrier", TextureBarrier = class TextureBarrier extends GFXObject {
        get info() {
          return this._info;
        }
        get hash() {
          return this._hash;
        }

        /** @mangle */

        constructor(info, hash) {
          super(ObjectType.TEXTURE_BARRIER);
          this._info = new TextureBarrierInfo();
          /** @mangle */
          this._hash = 0;
          this._info.copy(info);
          this._hash = hash;
        }
        static computeHash(info) {
          let res = `${info.prevAccesses} ${info.nextAccesses}`;
          res += info.type;
          res += info.range.mipLevel;
          res += info.range.levelCount;
          res += info.range.firstSlice;
          res += info.range.numSlices;
          res += info.range.basePlane;
          res += info.range.planeCount;
          res += info.discardContents;
          res += info.srcQueue ? info.srcQueue.type : 0;
          res += info.dstQueue ? info.dstQueue.type : 0;
          return murmurhash2_32_gc(res, 666);
        }
      });
    }
  };
});