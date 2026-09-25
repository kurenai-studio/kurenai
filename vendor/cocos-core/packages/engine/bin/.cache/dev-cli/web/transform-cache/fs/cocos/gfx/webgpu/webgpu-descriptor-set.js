System.register("q-bundled:///fs/cocos/gfx/webgpu/webgpu-descriptor-set.js", ["../base/descriptor-set.js", "../base/define.js", "./define.js", "./webgpu-commands.js"], function (_export, _context) {
  "use strict";

  var DescriptorSet, DESCRIPTOR_BUFFER_TYPE, DESCRIPTOR_SAMPLER_TYPE, DescriptorType, Filter, ViewDimension, DESCRIPTOR_STORAGE_BUFFER_TYPE, WebGPUDeviceManager, FormatToWGPUFormatType, SEPARATE_SAMPLER_BINDING_OFFSET, WebGPUDescriptorSet;
  _export("WebGPUDescriptorSet", void 0);
  return {
    setters: [function (_baseDescriptorSetJs) {
      DescriptorSet = _baseDescriptorSetJs.DescriptorSet;
    }, function (_baseDefineJs) {
      DESCRIPTOR_BUFFER_TYPE = _baseDefineJs.DESCRIPTOR_BUFFER_TYPE;
      DESCRIPTOR_SAMPLER_TYPE = _baseDefineJs.DESCRIPTOR_SAMPLER_TYPE;
      DescriptorType = _baseDefineJs.DescriptorType;
      Filter = _baseDefineJs.Filter;
      ViewDimension = _baseDefineJs.ViewDimension;
      DESCRIPTOR_STORAGE_BUFFER_TYPE = _baseDefineJs.DESCRIPTOR_STORAGE_BUFFER_TYPE;
    }, function (_defineJs) {
      WebGPUDeviceManager = _defineJs.WebGPUDeviceManager;
    }, function (_webgpuCommandsJs) {
      FormatToWGPUFormatType = _webgpuCommandsJs.FormatToWGPUFormatType;
      SEPARATE_SAMPLER_BINDING_OFFSET = _webgpuCommandsJs.SEPARATE_SAMPLER_BINDING_OFFSET;
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
      _export("WebGPUDescriptorSet", WebGPUDescriptorSet = class WebGPUDescriptorSet extends DescriptorSet {
        constructor(...args) {
          super(...args);
          this._gpuDescriptorSet = null;
          this._bindGroupEntries = new Map();
          this._dynamicOffsets = [];
        }
        get gpuDescriptorSet() {
          return this._gpuDescriptorSet;
        }
        get dynamicOffsets() {
          return this._dynamicOffsets;
        }
        get dynamicOffsetCount() {
          return this._dynamicOffsets.length;
        }
        initialize(info) {
          const layout = this._layout = info.layout;
          const {
            bindings,
            descriptorIndices,
            descriptorCount
          } = layout.gpuDescriptorSetLayout;
          this._buffers = Array(descriptorCount).fill(null);
          this._textures = Array(descriptorCount).fill(null);
          this._samplers = Array(descriptorCount).fill(null);
          const gpuDescriptors = [];
          const bindGroup = null;
          const bindGroupLayout = null;
          this._gpuDescriptorSet = {
            gpuDescriptors,
            descriptorIndices,
            bindGroup,
            bindGroupLayout
          };
          const bindingSize = bindings.length;
          for (let i = 0; i < bindingSize; ++i) {
            const binding = bindings[i];
            const bindCount = binding.count;
            for (let j = 0; j < bindCount; j++) {
              gpuDescriptors.push({
                type: binding.descriptorType,
                gpuBuffer: null,
                gpuTexture: null,
                gpuSampler: null
              });
            }
          }
        }
        destroy() {
          this._layout = null;
          this._gpuDescriptorSet = null;
          this._buffers.length = 0;
          this._textures.length = 0;
          this._samplers.length = 0;
          this._bindGroupEntries.clear();
        }
        _bindBufferEntry(bind, buffer) {
          const destBind = this._gpuDescriptorSet.gpuDescriptors[bind.binding];
          if (destBind) {
            destBind.gpuBuffer = buffer.gpuBuffer;
          }
          const nativeBuffer = buffer.gpuBuffer.gpuBuffer;
          const bindGrpEntry = {
            binding: bind.binding,
            resource: {
              buffer: nativeBuffer,
              offset: buffer.gpuBuffer.gpuOffset,
              size: buffer.gpuBuffer.size
            }
          };
          this._bindGroupEntries.set(bindGrpEntry.binding, bindGrpEntry);
          buffer.resetChange();
        }
        _bindTextureEntry(bind, texture) {
          this._gpuDescriptorSet.gpuDescriptors[bind.binding].gpuTexture = texture.gpuTexture;
          const nativeTexView = texture.getNativeTextureView();
          const bindGrpEntry = {
            binding: bind.binding,
            resource: nativeTexView
          };
          this._bindGroupEntries.set(bindGrpEntry.binding, bindGrpEntry);
          texture.resetChange();
        }
        _bindSamplerEntry(bind, sampler) {
          const samplerIdx = bind.binding + SEPARATE_SAMPLER_BINDING_OFFSET;
          this._gpuDescriptorSet.gpuDescriptors[bind.binding].gpuSampler = sampler.gpuSampler;
          const device = WebGPUDeviceManager.instance;
          const currTexture = this._textures[bind.binding] || device.defaultResource.texture;
          const levelCount = currTexture.levelCount;
          const texFormat = currTexture.format;
          const isUnFilter = FormatToWGPUFormatType(texFormat) === 'unfilterable-float' || FormatToWGPUFormatType(texFormat) === 'float' && !device.floatFilterable;
          if (isUnFilter) {
            sampler.gpuSampler.minFilter = Filter.POINT;
            sampler.gpuSampler.magFilter = Filter.POINT;
            sampler.gpuSampler.mipFilter = Filter.POINT;
          }
          const currGPUSampler = sampler.createGPUSampler(levelCount);
          const bindSamplerGrpEntry = {
            binding: samplerIdx,
            resource: currGPUSampler
          };
          this._bindGroupEntries.set(samplerIdx, bindSamplerGrpEntry);
          sampler.resetChange();
        }
        _applyBindGroup() {
          if (this._isDirty && this._gpuDescriptorSet) {
            const layout = this._layout;
            this._bindGroupEntries.clear();
            this._dynamicOffsets.length = 0;
            const descriptors = this._gpuDescriptorSet.gpuDescriptors;
            const bindings = layout.gpuDescriptorSetLayout.bindings;
            const descCount = bindings.length;
            const device = WebGPUDeviceManager.instance;
            for (let i = 0; i < descCount; ++i) {
              const binding = bindings[i];
              const bindIdx = binding.binding;
              const descType = descriptors[i].type;
              if (descType & DESCRIPTOR_BUFFER_TYPE) {
                const defaultBuffer = device.defaultResource.buffer;
                let buffer = this._buffers[i] || defaultBuffer;
                if (buffer === defaultBuffer && descType & DESCRIPTOR_STORAGE_BUFFER_TYPE) {
                  buffer = device.defaultResource.getStorageBuffer(bindIdx);
                }
                this._bindBufferEntry(binding, buffer);
                if (descType & (DescriptorType.DYNAMIC_STORAGE_BUFFER | DescriptorType.DYNAMIC_UNIFORM_BUFFER)) {
                  this._dynamicOffsets.push(bindIdx);
                }
              } else if (descType & (DESCRIPTOR_SAMPLER_TYPE | DescriptorType.STORAGE_IMAGE)) {
                const isStorageImage = (descType & DescriptorType.STORAGE_IMAGE) === DescriptorType.STORAGE_IMAGE;
                if (isStorageImage) {
                  // storage texture (compute read/write): bind the texture view, no sampler
                  let currTex = this._textures[i];
                  if (!currTex || currTex.hasChange && !currTex.gpuTexture) {
                    currTex = device.defaultResource.texture;
                  }
                  this._bindTextureEntry(binding, currTex);
                } else if ((descType & DescriptorType.SAMPLER) !== DescriptorType.SAMPLER) {
                  // sampled texture
                  let currTex = this._textures[i];
                  // null or destroyed?
                  if (!currTex || currTex.hasChange && !currTex.gpuTexture) {
                    if (binding.viewDimension === ViewDimension.TEXCUBE) {
                      currTex = device.defaultResource.cubeTexture;
                    } else {
                      currTex = device.defaultResource.texture;
                    }
                  }
                  this._bindTextureEntry(binding, currTex);
                }
                if (!isStorageImage && !((descType & DescriptorType.INPUT_ATTACHMENT) === DescriptorType.INPUT_ATTACHMENT || (descType & DescriptorType.TEXTURE) === DescriptorType.TEXTURE)) {
                  // sampler
                  const currSampler = this._samplers[i] || device.defaultResource.sampler;
                  this._bindSamplerEntry(binding, currSampler);
                }
              }
            }
            this._isDirty = false;
            this._createBindGroup();
          }
        }
        _hasResourceChange(resource) {
          if (resource && resource.hasChange) {
            return true;
          }
          return false;
        }
        _isResourceChange() {
          const layout = this._layout;
          if (!layout) {
            return false;
          }
          return layout.gpuDescriptorSetLayout.bindings.some(bind => {
            const binding = bind.binding;
            const resource = this._buffers[binding] || this._textures[binding] || this._samplers[binding];
            return this._hasResourceChange(resource);
          });
        }
        prepare(force = false) {
          const gpuDescriptorSet = this._gpuDescriptorSet;
          if (!gpuDescriptorSet) {
            return;
          }
          // Rebuild when forced, when the bind group has never been built, or when resources changed.
          const breakUpdate = gpuDescriptorSet.bindGroup && !this._isResourceChange() && !force;
          if (breakUpdate) return;
          this._isDirty = true;
          this._applyBindGroup();
        }
        _createBindGroup() {
          const device = WebGPUDeviceManager.instance;
          const nativeDevice = device.nativeDevice;
          const layout = this._layout;
          const bindGroup = nativeDevice == null ? void 0 : nativeDevice.createBindGroup({
            layout: layout.gpuDescriptorSetLayout.bindGroupLayout,
            entries: this._bindGroupEntries.values()
          });
          this._gpuDescriptorSet.bindGroupLayout = layout.gpuDescriptorSetLayout.bindGroupLayout;
          this._gpuDescriptorSet.bindGroup = bindGroup;
        }
        update() {
          this._applyBindGroup();
        }
      });
    }
  };
});