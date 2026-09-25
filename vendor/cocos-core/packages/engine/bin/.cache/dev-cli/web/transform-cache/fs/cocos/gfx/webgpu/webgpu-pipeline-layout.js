System.register("q-bundled:///fs/cocos/gfx/webgpu/webgpu-pipeline-layout.js", ["../base/pipeline-layout.js", "./define.js"], function (_export, _context) {
  "use strict";

  var PipelineLayout, WebGPUDeviceManager, WebGPUPipelineLayout;
  _export("WebGPUPipelineLayout", void 0);
  return {
    setters: [function (_basePipelineLayoutJs) {
      PipelineLayout = _basePipelineLayoutJs.PipelineLayout;
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
      _export("WebGPUPipelineLayout", WebGPUPipelineLayout = class WebGPUPipelineLayout extends PipelineLayout {
        constructor(...args) {
          super(...args);
          this._gpuPipelineLayout = null;
          this._nativePipelineLayout = void 0;
          this._bindGrpLayouts = [];
        }
        get gpuPipelineLayout() {
          return this._gpuPipelineLayout;
        }
        fetchPipelineLayout(resetAll = true) {
          const gpuPipelineLayout = this._gpuPipelineLayout;
          if (resetAll) {
            gpuPipelineLayout.gpuSetLayouts.length = 0;
            gpuPipelineLayout.dynamicOffsetIndices.length = 0;
          }
          const webGPUDevice = WebGPUDeviceManager.instance;
          const nativeDevice = webGPUDevice.nativeDevice;
          this._bindGrpLayouts.length = 0;
          const setLayoutSize = this._setLayouts.length;
          for (let i = 0; i < setLayoutSize; i++) {
            const setLayout = this._setLayouts[i];
            const bindGroupLayout = setLayout.gpuDescriptorSetLayout.bindGroupLayout;
            if (bindGroupLayout) {
              if (resetAll) {
                const dynamicBindings = setLayout.gpuDescriptorSetLayout.dynamicBindings;
                const indices = Array(setLayout.bindingIndices.length).fill(-1);
                const dynBindSize = dynamicBindings.length;
                for (let j = 0; j < dynBindSize; j++) {
                  const binding = dynamicBindings[j];
                  if (indices[binding] < 0) indices[binding] = gpuPipelineLayout.dynamicOffsetCount + j;
                }
                gpuPipelineLayout.gpuSetLayouts.push(setLayout.gpuDescriptorSetLayout);
                gpuPipelineLayout.dynamicOffsetIndices.push(indices);
                gpuPipelineLayout.dynamicOffsetCount += dynBindSize;
              }
              this._bindGrpLayouts[i] = bindGroupLayout;
            }
          }
          this._nativePipelineLayout = nativeDevice == null ? void 0 : nativeDevice.createPipelineLayout({
            bindGroupLayouts: this._bindGrpLayouts
          });
          return this._nativePipelineLayout;
        }
        initialize(info) {
          Array.prototype.push.apply(this._setLayouts, info.setLayouts);
          const dynamicOffsetIndices = [];
          const gpuSetLayouts = [];
          const dynamicOffsetCount = 0;

          // eslint-disable-next-line @typescript-eslint/no-this-alias
          const that = this;
          this._gpuPipelineLayout = {
            setLayouts: this._setLayouts,
            gpuSetLayouts,
            dynamicOffsetIndices,
            dynamicOffsetCount,
            gpuBindGroupLayouts: this._bindGrpLayouts,
            // In order to avoid binding exceeding the number specified by webgpu,
            // gpulayout changes dynamically instead of binding everything at once.
            get nativePipelineLayout() {
              return that._nativePipelineLayout;
            }
          };
          this.fetchPipelineLayout();
          return true;
        }
        changeSetLayout(idx, setLayout) {
          this._setLayouts[idx] = setLayout;
        }
        destroy() {
          this._setLayouts.length = 0;
        }
      });
    }
  };
});