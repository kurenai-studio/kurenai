System.register("q-bundled:///fs/cocos/3d/misc/buffer-blob.js", [], function (_export, _context) {
  "use strict";

  var BufferBlob;
  _export("BufferBlob", void 0);
  return {
    setters: [],
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
      _export("BufferBlob", BufferBlob = class BufferBlob {
        constructor() {
          this._arrayBufferOrPaddings = [];
          this._length = 0;
        }
        setNextAlignment(align) {
          if (align !== 0) {
            const remainder = this._length % align;
            if (remainder !== 0) {
              const padding = align - remainder;
              this._arrayBufferOrPaddings.push(padding);
              this._length += padding;
            }
          }
        }
        addBuffer(arrayBuffer) {
          const result = this._length;
          this._arrayBufferOrPaddings.push(arrayBuffer);
          this._length += arrayBuffer.byteLength;
          return result;
        }
        getLength() {
          return this._length;
        }
        getCombined() {
          const result = new Uint8Array(this._length);
          let counter = 0;
          this._arrayBufferOrPaddings.forEach(arrayBufferOrPadding => {
            if (typeof arrayBufferOrPadding === 'number') {
              counter += arrayBufferOrPadding;
            } else {
              result.set(new Uint8Array(arrayBufferOrPadding), counter);
              counter += arrayBufferOrPadding.byteLength;
            }
          });
          return result.buffer;
        }
      });
    }
  };
});