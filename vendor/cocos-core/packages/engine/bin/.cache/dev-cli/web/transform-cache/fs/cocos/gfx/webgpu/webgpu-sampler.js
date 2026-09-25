System.register("q-bundled:///fs/cocos/gfx/webgpu/webgpu-sampler.js", ["../base/states/sampler.js", "./webgpu-commands.js", "./define.js"], function (_export, _context) {
  "use strict";

  var Sampler, WebGPUCmdFuncCreateSampler, WebGPUCmdFuncDestroySampler, WebGPUDeviceManager, WebGPUSampler, samplerCaches;
  _export("WebGPUSampler", void 0);
  return {
    setters: [function (_baseStatesSamplerJs) {
      Sampler = _baseStatesSamplerJs.Sampler;
    }, function (_webgpuCommandsJs) {
      WebGPUCmdFuncCreateSampler = _webgpuCommandsJs.WebGPUCmdFuncCreateSampler;
      WebGPUCmdFuncDestroySampler = _webgpuCommandsJs.WebGPUCmdFuncDestroySampler;
    }, function (_defineJs) {
      WebGPUDeviceManager = _defineJs.WebGPUDeviceManager;
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
      samplerCaches = new Map();
      _export("WebGPUSampler", WebGPUSampler = class WebGPUSampler extends Sampler {
        get gpuSampler() {
          return this._gpuSampler;
        }
        get samplerInfo() {
          return this._info;
        }
        get hasChange() {
          return this._hasChange;
        }
        resetChange() {
          this._hasChange = false;
        }
        constructor(info, hash) {
          super(info, hash);
          this._gpuSampler = null;
          this._hasChange = false;
          this._gpuSampler = {
            gpuSampler: null,
            compare: info.cmpFunc,
            minFilter: info.minFilter,
            magFilter: info.magFilter,
            mipFilter: info.mipFilter,
            addressU: info.addressU,
            addressV: info.addressV,
            addressW: info.addressW,
            maxAnisotropy: info.maxAnisotropy,
            mipLevel: 1,
            gpuMinFilter: 'linear',
            gpuMagFilter: 'linear',
            gpuMipFilter: 'linear',
            gpuWrapS: 'clamp-to-edge',
            gpuWrapT: 'clamp-to-edge',
            gpuWrapR: 'clamp-to-edge'
          };
        }
        _computeSamplerKey(info) {
          let hash = info.minFilter;
          hash |= info.magFilter << 2;
          hash |= info.mipFilter << 4;
          hash |= info.addressU << 6;
          hash |= info.addressV << 8;
          hash |= info.addressW << 10;
          hash |= info.maxAnisotropy << 12;
          hash |= info.compare << 16;
          hash |= info.mipLevel << 18;
          return hash;
        }
        createGPUSampler(mipLevel = 1) {
          if (!this._gpuSampler) {
            return null;
          }
          this._gpuSampler.mipLevel = mipLevel;
          const currKey = this._computeSamplerKey(this._gpuSampler);
          let currGPUSampler = samplerCaches.get(currKey);
          if (currGPUSampler) return currGPUSampler;
          const device = WebGPUDeviceManager.instance;
          this._hasChange = true;
          WebGPUCmdFuncCreateSampler(device, this._gpuSampler);
          currGPUSampler = this._gpuSampler.gpuSampler;
          samplerCaches.set(currKey, currGPUSampler);
          return currGPUSampler;
        }
        destroy() {
          if (!this._gpuSampler) {
            return;
          }
          this._hasChange = true;
          const device = WebGPUDeviceManager.instance;
          WebGPUCmdFuncDestroySampler(device, this._gpuSampler);
          this._gpuSampler = null;
        }
      });
    }
  };
});