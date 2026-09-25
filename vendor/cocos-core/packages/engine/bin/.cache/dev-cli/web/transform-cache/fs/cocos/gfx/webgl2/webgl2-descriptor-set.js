System.register("q-bundled:///fs/cocos/gfx/webgl2/webgl2-descriptor-set.js", ["../base/descriptor-set.js", "../base/define.js"], function (_export, _context) {
  "use strict";

  var DescriptorSet, DESCRIPTOR_BUFFER_TYPE, DESCRIPTOR_SAMPLER_TYPE, WebGL2DescriptorSet;
  _export("WebGL2DescriptorSet", void 0);
  return {
    setters: [function (_baseDescriptorSetJs) {
      DescriptorSet = _baseDescriptorSetJs.DescriptorSet;
    }, function (_baseDefineJs) {
      DESCRIPTOR_BUFFER_TYPE = _baseDefineJs.DESCRIPTOR_BUFFER_TYPE;
      DESCRIPTOR_SAMPLER_TYPE = _baseDefineJs.DESCRIPTOR_SAMPLER_TYPE;
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
      /** @mangle */
      _export("WebGL2DescriptorSet", WebGL2DescriptorSet = class WebGL2DescriptorSet extends DescriptorSet {
        constructor() {
          super();
          this._gpuDescriptorSet = null;
        }
        get gpuDescriptorSet() {
          return this._gpuDescriptorSet;
        }
        initialize(info) {
          this._layout = info.layout;
          const {
            bindings,
            descriptorIndices,
            descriptorCount
          } = info.layout.getGpuDescriptorSetLayout();
          this._buffers = Array(descriptorCount).fill(null);
          this._textures = Array(descriptorCount).fill(null);
          this._samplers = Array(descriptorCount).fill(null);
          const gpuDescriptors = [];
          this._gpuDescriptorSet = {
            gpuDescriptors,
            descriptorIndices
          };
          for (let i = 0; i < bindings.length; ++i) {
            const binding = bindings[i];
            for (let j = 0; j < binding.count; j++) {
              const gpuDescriptor = {
                type: binding.descriptorType,
                gpuBuffer: null,
                gpuTextureView: null,
                gpuSampler: null
              };
              gpuDescriptors.push(gpuDescriptor);
            }
          }
        }
        destroy() {
          this._layout = null;
          this._gpuDescriptorSet = null;
        }
        update() {
          if (this._isDirty && this._gpuDescriptorSet) {
            const descriptors = this._gpuDescriptorSet.gpuDescriptors;
            for (let i = 0; i < descriptors.length; ++i) {
              if (descriptors[i].type & DESCRIPTOR_BUFFER_TYPE) {
                if (this._buffers[i]) {
                  descriptors[i].gpuBuffer = this._buffers[i].getGpuBuffer();
                }
              } else if (descriptors[i].type & DESCRIPTOR_SAMPLER_TYPE) {
                if (this._textures[i]) {
                  descriptors[i].gpuTextureView = this._textures[i].gpuTextureView;
                }
                if (this._samplers[i]) {
                  descriptors[i].gpuSampler = this._samplers[i].gpuSampler;
                }
              }
            }
            this._isDirty = false;
          }
        }
      });
    }
  };
});