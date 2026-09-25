System.register("q-bundled:///fs/cocos/gfx/webgpu/define.js", ["../base/define.js"], function (_export, _context) {
  "use strict";

  var BufferFlagBit, BufferInfo, BufferUsageBit, MemoryUsageBit, WebGPUDeviceManager, DefaultResources, webGPU, DescUpdateFrequency;
  function hashCombine(hash, currHash) {
    return currHash ^= (hash >>> 0) + 0x9e3779b9 + (currHash << 6) + (currHash >> 2);
  }
  function hashCombineNum(val, currHash) {
    const hash = 5381;
    return hashCombine(hash * 33 ^ val, currHash);
  }
  function hashCombineStr(str, currHash) {
    // DJB2 HASH
    let hash = 5381;
    const strLength = str.length;
    for (let i = 0; i < strLength; i++) {
      hash = hash * 33 ^ str.charCodeAt(i);
    }
    return hashCombine(hash, currHash);
  }
  function overrideClass(wasm) {
    if ('compileGLSL' in wasm) {
      webGPU.glslang = wasm;
    } else if ('convertSpirV2WGSL' in wasm) {
      webGPU.twgsl = wasm;
    }
  }
  function overrideWebGPUDefine(wasm) {
    overrideClass(wasm);
  }
  function isBound(binds, compares) {
    return binds.length === compares.length && binds.every(bind => compares.includes(bind));
  }
  function copyNumbersToTarget(source, target, start, count) {
    // Check that the source array is out of range
    if (start + count > source.length) {
      throw new Error('Source array is out of bounds');
    }
    // Check whether the target array is out of range
    if (start + count > target.length) {
      target.length = start + count;
    }
    const sliceToCopy = source.slice(start, start + count);
    target.splice(start, count, ...sliceToCopy);
  }
  _export({
    WebGPUDeviceManager: void 0,
    hashCombineNum: hashCombineNum,
    hashCombineStr: hashCombineStr,
    overrideWebGPUDefine: overrideWebGPUDefine,
    DefaultResources: void 0,
    isBound: isBound,
    copyNumbersToTarget: copyNumbersToTarget
  });
  return {
    setters: [function (_baseDefineJs) {
      BufferFlagBit = _baseDefineJs.BufferFlagBit;
      BufferInfo = _baseDefineJs.BufferInfo;
      BufferUsageBit = _baseDefineJs.BufferUsageBit;
      MemoryUsageBit = _baseDefineJs.MemoryUsageBit;
    }],
    execute: function () {
      /*
       Copyright (c) 2024 Xiamen Yaji Software Co., Ltd.
      
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
      _export("WebGPUDeviceManager", WebGPUDeviceManager = class WebGPUDeviceManager {
        static get instance() {
          return WebGPUDeviceManager._instance;
        }
        static setInstance(instance) {
          WebGPUDeviceManager._instance = instance;
        }
      });
      WebGPUDeviceManager._instance = null;
      _export("webGPU", webGPU = {
        glslang: undefined,
        twgsl: undefined
      });
      _export("DefaultResources", DefaultResources = class DefaultResources {
        constructor() {
          // hash, targetResource
          this.buffersDescLayout = new Map();
          this.texturesDescLayout = new Map();
          this.samplersDescLayout = new Map();
          this.buffer = void 0;
          this.storageBuffers = [];
          this.texture = void 0;
          this.cubeTexture = void 0;
          this.sampler = void 0;
          this.setLayout = void 0;
          this.descSet = void 0;
        }
        getStorageBuffer(idx) {
          if (this.storageBuffers[idx]) {
            return this.storageBuffers[idx];
          }
          const bufferInfo = new BufferInfo(BufferUsageBit.STORAGE, MemoryUsageBit.DEVICE, 16, 16,
          // in bytes
          BufferFlagBit.NONE);
          const defaultBuff = WebGPUDeviceManager.instance.createBuffer(bufferInfo);
          this.storageBuffers[idx] = defaultBuff;
          return defaultBuff;
        }
      });
      _export("DescUpdateFrequency", DescUpdateFrequency = /*#__PURE__*/function (DescUpdateFrequency) {
        DescUpdateFrequency[DescUpdateFrequency["LOW"] = 0] = "LOW";
        DescUpdateFrequency[DescUpdateFrequency["NORMAL"] = 1] = "NORMAL";
        return DescUpdateFrequency;
      }({}));
    }
  };
});