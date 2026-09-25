System.register("q-bundled:///fs/cocos/gfx/webgpu/webgpu-descriptor-set-layout.js", ["../base/descriptor-set-layout.js", "./webgpu-commands.js", "../base/define.js", "./define.js"], function (_export, _context) {
  "use strict";

  var DescriptorSetLayout, createBindGroupLayoutEntry, DESCRIPTOR_DYNAMIC_TYPE, WebGPUDeviceManager, WebGPUDescriptorSetLayout;
  _export("WebGPUDescriptorSetLayout", void 0);
  return {
    setters: [function (_baseDescriptorSetLayoutJs) {
      DescriptorSetLayout = _baseDescriptorSetLayoutJs.DescriptorSetLayout;
    }, function (_webgpuCommandsJs) {
      createBindGroupLayoutEntry = _webgpuCommandsJs.createBindGroupLayoutEntry;
    }, function (_baseDefineJs) {
      DESCRIPTOR_DYNAMIC_TYPE = _baseDefineJs.DESCRIPTOR_DYNAMIC_TYPE;
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
      _export("WebGPUDescriptorSetLayout", WebGPUDescriptorSetLayout = class WebGPUDescriptorSetLayout extends DescriptorSetLayout {
        constructor(...args) {
          super(...args);
          this._gpuDescriptorSetLayout = null;
          this._bindGrpLayoutEntries = new Map();
          this._hasChange = false;
          this._currBinds = [];
          this._prepareEntries = [];
          this.buffers = new Map();
          this.textures = new Map();
          this.samplers = new Map();
          this.references = [];
        }
        get gpuDescriptorSetLayout() {
          return this._gpuDescriptorSetLayout;
        }
        get currBinds() {
          return this._currBinds;
        }
        get prepareEntries() {
          return this._prepareEntries;
        }
        get bindGrpLayoutEntries() {
          return this._bindGrpLayoutEntries;
        }
        get hasChanged() {
          return this._hasChange;
        }
        resetChanged() {
          this._hasChange = false;
        }
        initialize(info) {
          Array.prototype.push.apply(this._bindings, info.bindings);
          const gfxDevice = WebGPUDeviceManager.instance;
          // If the bindings are empty, it will cause the corresponding group to be generated as null,
          // which will trigger a warning for the corresponding set being unbound.
          if (!this._bindings.length) {
            this._bindings.push(gfxDevice.defaultResource.setLayout.bindings[0]);
          }
          let descriptorCount = 0;
          let maxBinding = -1;
          const flattenedIndices = [];
          const bindingSize = this._bindings.length;
          for (let i = 0; i < bindingSize; i++) {
            const binding = this._bindings[i];
            flattenedIndices.push(descriptorCount);
            descriptorCount += binding.count;
            if (binding.binding > maxBinding) maxBinding = binding.binding;
          }
          this._bindingIndices = Array(maxBinding + 1).fill(-1);
          const descriptorIndices = this._descriptorIndices = Array(maxBinding + 1).fill(-1);
          for (let i = 0; i < bindingSize; i++) {
            const binding = this._bindings[i];
            this._bindingIndices[binding.binding] = i;
            descriptorIndices[binding.binding] = flattenedIndices[i];
          }
          const dynamicBindings = [];
          for (let i = 0; i < bindingSize; i++) {
            const binding = this._bindings[i];
            if (binding.descriptorType & DESCRIPTOR_DYNAMIC_TYPE) {
              for (let j = 0; j < binding.count; j++) {
                dynamicBindings.push(binding.binding);
              }
            }
          }
          const bindGrpLayoutEntries = [];
          this._bindings.forEach(binding => {
            bindGrpLayoutEntries.push(...createBindGroupLayoutEntry(binding));
          });
          const device = gfxDevice.nativeDevice;
          const groupLayout = device.createBindGroupLayout({
            entries: bindGrpLayoutEntries
          });
          this._gpuDescriptorSetLayout = {
            bindings: this._bindings,
            dynamicBindings,
            descriptorIndices,
            descriptorCount,
            entries: bindGrpLayoutEntries,
            bindGroupLayout: groupLayout
          };
        }
        clear() {
          this.buffers.clear();
          this.textures.clear();
          this.samplers.clear();
          this._bindGrpLayoutEntries.clear();
        }
        destroy() {
          this._bindings.length = 0;
          this.clear();
          this._gpuDescriptorSetLayout = null;
        }
      });
    }
  };
});