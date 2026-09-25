System.register("q-bundled:///fs/cocos/gfx/webgl2/webgl2-gpu-objects.js", ["../../core/index.js", "./webgl2-define.js"], function (_export, _context) {
  "use strict";

  var nextPow2, WebGL2DeviceManager, WebGL2IndirectDrawInfos, IWebGL2BlitManager, WebGL2IndirectDrawInfosEnums;
  _export({
    WebGL2IndirectDrawInfos: void 0,
    IWebGL2BlitManager: void 0
  });
  return {
    setters: [function (_coreIndexJs) {
      nextPow2 = _coreIndexJs.nextPow2;
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
      // For inline enum
      WebGL2IndirectDrawInfosEnums = {
        DEFAULT_CAPACITY: 4
      };
      /** @mangle */
      _export("WebGL2IndirectDrawInfos", WebGL2IndirectDrawInfos = class WebGL2IndirectDrawInfos {
        constructor() {
          this.counts = void 0;
          this.offsets = void 0;
          this.instances = void 0;
          this.drawCount = 0;
          this.drawByIndex = false;
          this.instancedDraw = false;
          // staging buffer
          this.byteOffsets = void 0;
          this._capacity = WebGL2IndirectDrawInfosEnums.DEFAULT_CAPACITY;
          this.counts = new Int32Array(WebGL2IndirectDrawInfosEnums.DEFAULT_CAPACITY);
          this.offsets = new Int32Array(WebGL2IndirectDrawInfosEnums.DEFAULT_CAPACITY);
          this.instances = new Int32Array(WebGL2IndirectDrawInfosEnums.DEFAULT_CAPACITY);
          this.byteOffsets = new Int32Array(WebGL2IndirectDrawInfosEnums.DEFAULT_CAPACITY);
        }
        clearDraws() {
          this.drawCount = 0;
          this.drawByIndex = false;
          this.instancedDraw = false;
        }
        setDrawInfo(idx, info) {
          this._ensureCapacity(idx);
          this.drawByIndex = info.indexCount > 0;
          this.instancedDraw = !!info.instanceCount;
          this.drawCount = Math.max(idx + 1, this.drawCount);
          if (this.drawByIndex) {
            this.counts[idx] = info.indexCount;
            this.offsets[idx] = info.firstIndex;
          } else {
            this.counts[idx] = info.vertexCount;
            this.offsets[idx] = info.firstVertex;
          }
          this.instances[idx] = Math.max(1, info.instanceCount);
        }
        _ensureCapacity(target) {
          if (this._capacity > target) return;
          this._capacity = nextPow2(target);
          const counts = new Int32Array(this._capacity);
          const offsets = new Int32Array(this._capacity);
          const instances = new Int32Array(this._capacity);
          this.byteOffsets = new Int32Array(this._capacity);
          counts.set(this.counts);
          offsets.set(this.offsets);
          instances.set(this.instances);
          this.counts = counts;
          this.offsets = offsets;
          this.instances = instances;
        }
      });
      /** @mangle */
      /** @mangle */
      /** @mangle */
      /** @mangle */
      /** @mangle */
      /** @mangle */
      /** @mangle */
      /** @mangle */
      /** @mangle */
      /** @mangle */
      /** @mangle */
      /** @mangle */
      /** @mangle */
      /** @mangle */
      /** @mangle */
      /** @mangle */
      /** @mangle */
      /** @mangle */
      /** @mangle */
      /** @mangle */
      /** @mangle */
      /** @mangle */
      _export("IWebGL2BlitManager", IWebGL2BlitManager = class IWebGL2BlitManager {
        get srcFramebuffer() {
          return this._srcFramebuffer;
        }
        get dstFramebuffer() {
          return this._dstFramebuffer;
        }
        constructor() {
          this._srcFramebuffer = void 0;
          this._dstFramebuffer = void 0;
          const {
            gl
          } = WebGL2DeviceManager.instance;
          this._srcFramebuffer = gl.createFramebuffer();
          this._dstFramebuffer = gl.createFramebuffer();
        }
        destroy() {
          const {
            gl
          } = WebGL2DeviceManager.instance;
          gl.deleteFramebuffer(this._srcFramebuffer);
          gl.deleteFramebuffer(this._dstFramebuffer);
        }
      });
    }
  };
});