System.register("q-bundled:///fs/cocos/rendering/instanced-buffer.js", ["./define.js", "../gfx/index.js"], function (_export, _context) {
  "use strict";

  var UNIFORM_LIGHTMAP_TEXTURE_BINDING, UNIFORM_REFLECTION_PROBE_BLEND_CUBEMAP_BINDING, UNIFORM_REFLECTION_PROBE_CUBEMAP_BINDING, UNIFORM_REFLECTION_PROBE_TEXTURE_BINDING, ENABLE_PROBE_BLEND, getPassPool, BufferUsageBit, MemoryUsageBit, InputAssemblerInfo, Attribute, BufferInfo, InstancedBuffer, INITIAL_CAPACITY, MAX_CAPACITY;
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

  function instancingCompareFn(l, r) {
    const ls = l.sortRender;
    const rs = r.sortRender;
    return ls.hash - rs.hash || ls.shaderId - rs.shaderId;
  }
  _export({
    instancingCompareFn: instancingCompareFn,
    InstancedBuffer: void 0
  });
  return {
    setters: [function (_defineJs) {
      UNIFORM_LIGHTMAP_TEXTURE_BINDING = _defineJs.UNIFORM_LIGHTMAP_TEXTURE_BINDING;
      UNIFORM_REFLECTION_PROBE_BLEND_CUBEMAP_BINDING = _defineJs.UNIFORM_REFLECTION_PROBE_BLEND_CUBEMAP_BINDING;
      UNIFORM_REFLECTION_PROBE_CUBEMAP_BINDING = _defineJs.UNIFORM_REFLECTION_PROBE_CUBEMAP_BINDING;
      UNIFORM_REFLECTION_PROBE_TEXTURE_BINDING = _defineJs.UNIFORM_REFLECTION_PROBE_TEXTURE_BINDING;
      ENABLE_PROBE_BLEND = _defineJs.ENABLE_PROBE_BLEND;
      getPassPool = _defineJs.getPassPool;
    }, function (_gfxIndexJs) {
      BufferUsageBit = _gfxIndexJs.BufferUsageBit;
      MemoryUsageBit = _gfxIndexJs.MemoryUsageBit;
      InputAssemblerInfo = _gfxIndexJs.InputAssemblerInfo;
      Attribute = _gfxIndexJs.Attribute;
      BufferInfo = _gfxIndexJs.BufferInfo;
    }],
    execute: function () {
      INITIAL_CAPACITY = 32;
      MAX_CAPACITY = 1024;
      _export("InstancedBuffer", InstancedBuffer = class InstancedBuffer {
        constructor(pass) {
          this.instances = [];
          this.hasPendingModels = false;
          this.dynamicOffsets = [];
          this.sortRender = void 0;
          this._instanceMap = new Map();
          this._device = pass.device;
          this.pass = pass;
          this._passPool = getPassPool();
          // Sorting instances of the same material is meaningless;
          // the primary focus here is sorting different instances
          this.sortRender = this._passPool.add();
        }
        destroy() {
          this.instances.forEach(instance => {
            instance.vb.destroy();
            instance.ia.destroy();
          });
          this._passPool.reset();
          this.instances.length = 0;
          this._instanceMap.clear();
        }
        merge(subModel, passIdx, shaderImplant = null) {
          var _sourceIA$indexBuffer, _sourceIA$indexBuffer2;
          const attrs = subModel.instancedAttributeBlock;
          const stride = attrs.buffer.length;
          if (!stride) {
            return;
          } // we assume per-instance attributes are always present
          const sourceIA = subModel.inputAssembler;
          const subModelDescriptorSet = subModel.descriptorSet;
          const lightingMap = subModelDescriptorSet.getTexture(UNIFORM_LIGHTMAP_TEXTURE_BINDING);
          const reflectionProbeCubemap = subModelDescriptorSet.getTexture(UNIFORM_REFLECTION_PROBE_CUBEMAP_BINDING);
          const reflectionProbePlanarMap = subModelDescriptorSet.getTexture(UNIFORM_REFLECTION_PROBE_TEXTURE_BINDING);
          const reflectionProbeBlendCubemap = ENABLE_PROBE_BLEND ? subModelDescriptorSet.getTexture(UNIFORM_REFLECTION_PROBE_BLEND_CUBEMAP_BINDING) : null;
          const useReflectionProbeType = subModel.useReflectionProbeType;
          let shader = shaderImplant;
          if (!shader) {
            shader = subModel.shaders[passIdx];
          }
          const descriptorSet = subModel.descriptorSet;
          const hash = subModel.passes[passIdx].priority << 16 | subModel.priority << 8 | passIdx;
          this.sortRender.hash = hash;
          this.sortRender.shaderId = shader.typedID;
          this.sortRender.passIdx = passIdx;
          const key = `${(_sourceIA$indexBuffer = (_sourceIA$indexBuffer2 = sourceIA.indexBuffer) == null ? void 0 : _sourceIA$indexBuffer2.objectID) != null ? _sourceIA$indexBuffer : 0}/${lightingMap.objectID}/${useReflectionProbeType}/` + `${reflectionProbeCubemap.objectID}/${reflectionProbePlanarMap.objectID}/` + `${ENABLE_PROBE_BLEND ? reflectionProbeBlendCubemap.objectID : 0}/${stride}`;
          const mappedInstances = this._instanceMap.get(key);
          if (mappedInstances) {
            for (let i = 0; i < mappedInstances.length; ++i) {
              const instance = mappedInstances[i];
              if (instance.count >= MAX_CAPACITY) {
                continue;
              }
              this._appendInstance(instance, attrs.buffer, shader, descriptorSet);
              return;
            }
          }
          this._createInstance(key, sourceIA, attrs.attributes, attrs.buffer, stride, shader, descriptorSet, lightingMap, useReflectionProbeType, reflectionProbeCubemap, reflectionProbePlanarMap, reflectionProbeBlendCubemap);
        }
        _appendInstance(instance, data, shader, descriptorSet) {
          if (instance.count >= instance.capacity) {
            // resize buffers
            instance.capacity = Math.min(instance.capacity << 1, MAX_CAPACITY);
            const newSize = instance.stride * instance.capacity;
            const oldData = instance.data;
            instance.data = new Uint8Array(newSize);
            instance.data.set(oldData);
            instance.vb.resize(newSize);
          }
          instance.shader = shader;
          instance.descriptorSet = descriptorSet;
          instance.data.set(data, instance.stride * instance.count++);
          this.hasPendingModels = true;
        }
        _createInstance(key, sourceIA, instancedAttributes, instanceData, stride, shader, descriptorSet, lightingMap, useReflectionProbeType, reflectionProbeCubemap, reflectionProbePlanarMap, reflectionProbeBlendCubemap) {
          const newSize = stride * INITIAL_CAPACITY;
          const vb = this._device.createBuffer(new BufferInfo(BufferUsageBit.VERTEX | BufferUsageBit.TRANSFER_DST, MemoryUsageBit.HOST | MemoryUsageBit.DEVICE, newSize, stride));
          const data = new Uint8Array(newSize);
          const vertexBuffers = sourceIA.vertexBuffers.slice();
          const attributes = sourceIA.attributes.slice();
          const indexBuffer = sourceIA.indexBuffer;
          for (let i = 0; i < instancedAttributes.length; i++) {
            const attr = instancedAttributes[i];
            const newAttr = new Attribute(attr.name, attr.format, attr.isNormalized, vertexBuffers.length, true);
            attributes.push(newAttr);
          }
          data.set(instanceData);
          vertexBuffers.push(vb);
          const iaInfo = new InputAssemblerInfo(attributes, vertexBuffers, indexBuffer);
          const ia = this._device.createInputAssembler(iaInfo);
          const instance = {
            count: 1,
            capacity: INITIAL_CAPACITY,
            vb,
            data,
            ia,
            stride,
            shader,
            descriptorSet,
            lightingMap,
            reflectionProbeCubemap,
            reflectionProbePlanarMap,
            useReflectionProbeType,
            reflectionProbeBlendCubemap
          };
          this.instances.push(instance);
          let mappedInstances = this._instanceMap.get(key);
          if (!mappedInstances) {
            mappedInstances = [];
            this._instanceMap.set(key, mappedInstances);
          }
          mappedInstances.push(instance);
          this.hasPendingModels = true;
        }
        uploadBuffers(cmdBuff) {
          for (let i = 0; i < this.instances.length; ++i) {
            const instance = this.instances[i];
            if (!instance.count) {
              continue;
            }
            instance.ia.instanceCount = instance.count;
            cmdBuff.updateBuffer(instance.vb, instance.data.buffer, instance.count * instance.stride);
          }
        }
        clear() {
          this.instances.forEach(instance => {
            instance.count = 0;
          });
          this.hasPendingModels = false;
          this._passPool.reset();
        }
      });
    }
  };
});