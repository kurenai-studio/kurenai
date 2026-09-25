System.register("q-bundled:///fs/cocos/gfx/base/descriptor-set.js", ["./define.js"], function (_export, _context) {
  "use strict";

  var GFXObject, ObjectType, DESCRIPTOR_BUFFER_TYPE, DESCRIPTOR_SAMPLER_TYPE, AccessFlagBit, DescriptorSet;
  _export("DescriptorSet", void 0);
  return {
    setters: [function (_defineJs) {
      GFXObject = _defineJs.GFXObject;
      ObjectType = _defineJs.ObjectType;
      DESCRIPTOR_BUFFER_TYPE = _defineJs.DESCRIPTOR_BUFFER_TYPE;
      DESCRIPTOR_SAMPLER_TYPE = _defineJs.DESCRIPTOR_SAMPLER_TYPE;
      AccessFlagBit = _defineJs.AccessFlagBit;
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
       * @en GFX descriptor sets.
       * @zh GFX 描述符集组。
       */
      _export("DescriptorSet", DescriptorSet = class DescriptorSet extends GFXObject {
        get layout() {
          return this._layout;
        }

        /** @mangle */

        constructor() {
          super(ObjectType.DESCRIPTOR_SET);
          this._layout = null;
          /** @mangle */
          this._buffers = [];
          /** @mangle */
          this._textures = [];
          /** @mangle */
          this._samplers = [];
          /** @mangle */
          this._isDirty = false;
        }
        /**
         * @en Bind buffer to the specified descriptor.
         * @zh 在指定的描述符位置上绑定缓冲。
         * @param binding The target binding.
         * @param buffer The buffer to be bound.
         */
        bindBuffer(binding, buffer, index = 0) {
          const bindingIndex = this._layout.bindingIndices[binding];
          const info = this._layout.bindings[bindingIndex];
          if (!info) {
            return;
          }
          if (info.descriptorType & DESCRIPTOR_BUFFER_TYPE) {
            const descriptorIndex = this._layout.descriptorIndices[binding];
            if (this._buffers[descriptorIndex + index] !== buffer) {
              this._buffers[descriptorIndex + index] = buffer;
              this._isDirty = true;
            }
          }
        }

        /**
         * @en Bind sampler to the specified descriptor.
         * @zh 在指定的描述符位置上绑定采样器。
         * @param binding The target binding.
         * @param sampler The sampler to be bound.
         */
        bindSampler(binding, sampler, index = 0) {
          const bindingIndex = this._layout.bindingIndices[binding];
          const info = this._layout.bindings[bindingIndex];
          if (!info) {
            return;
          }
          if (info.descriptorType & DESCRIPTOR_SAMPLER_TYPE) {
            const descriptorIndex = this._layout.descriptorIndices[binding];
            if (this._samplers[descriptorIndex + index] !== sampler) {
              this._samplers[descriptorIndex + index] = sampler;
              this._isDirty = true;
            }
          }
        }

        /**
         * @en Bind texture to the specified descriptor.
         * @zh 在指定的描述符位置上绑定纹理。
         * @param binding The target binding.
         * @param texture The texture to be bound.
         */
        bindTexture(binding, texture, index = 0, flags = AccessFlagBit.NONE) {
          const bindingIndex = this._layout.bindingIndices[binding];
          const info = this._layout.bindings[bindingIndex];
          if (!info) {
            return;
          }
          if (info.descriptorType & DESCRIPTOR_SAMPLER_TYPE) {
            const descriptorIndex = this._layout.descriptorIndices[binding];
            if (this._textures[descriptorIndex + index] !== texture) {
              this._textures[descriptorIndex + index] = texture;
              this._isDirty = true;
            }
          }
        }

        /**
         * @en Get buffer from the specified binding location.
         * @zh 获取当前指定绑定位置上的缓冲。
         * @param binding The target binding.
         */
        getBuffer(binding, index = 0) {
          const descriptorIndex = this._layout.descriptorIndices[binding];
          return this._buffers[descriptorIndex + index];
        }

        /**
         * @en Get sampler from the specified binding location.
         * @zh 获取当前指定绑定位置上的采样器。
         * @param binding The target binding.
         */
        getSampler(binding, index = 0) {
          const descriptorIndex = this._layout.descriptorIndices[binding];
          return this._samplers[descriptorIndex + index];
        }

        /**
         * @en Get texture from the specified binding location.
         * @zh 获取当前指定绑定位置上的贴图。
         * @param binding The target binding.
         */
        getTexture(binding, index = 0) {
          const descriptorIndex = this._layout.descriptorIndices[binding];
          return this._textures[descriptorIndex + index];
        }
      });
    }
  };
});