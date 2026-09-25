System.register("q-bundled:///fs/cocos/render-scene/core/pass.js", ["../../../../virtual/internal%253Aconstants.js", "../../asset/asset-manager/builtin-res-mgr.js", "../../rendering/pass-phase.js", "../../core/index.js", "../../gfx/index.js", "./program-lib.js", "./pass-utils.js", "../../rendering/define.js", "../../rendering/instanced-buffer.js"], function (_export, _context) {
  "use strict";

  var DEBUG, EDITOR, builtinResMgr, getPhaseID, murmurhash2_32_gc, errorID, assertID, cclegacy, warnID, BufferUsageBit, DynamicStateFlagBit, Feature, GetTypeSize, MemoryUsageBit, PrimitiveMode, Type, BlendState, BufferInfo, BufferViewInfo, DepthStencilState, DescriptorSetInfo, RasterizerState, Sampler, SampleCount, deviceManager, programLib, customizeType, getBindingFromHandle, getDefaultFromType, getStringFromType, getOffsetFromHandle, getTypeFromHandle, type2reader, type2writer, getCountFromHandle, type2validator, RenderPassStage, RenderPriority, SetIndex, InstancedBuffer, Pass, _bufferInfo, _bufferViewInfo, _dsInfo, _materialSet, BatchingSchemes;
  function serializeBlendState(bs) {
    let res = `,bs,${bs.isA2C}`;
    bs.targets.forEach(t => {
      res += `,bt,${t.blend},${t.blendEq},${t.blendAlphaEq},${t.blendColorMask}`;
      res += `,${t.blendSrc},${t.blendDst},${t.blendSrcAlpha},${t.blendDstAlpha}`;
    });
    return res;
  }
  function serializeRasterizerState(rs) {
    return `,rs,${rs.cullMode},${rs.depthBias},${rs.isFrontFaceCCW}`;
  }
  function serializeDepthStencilState(dss) {
    let res = `,dss,${dss.depthTest},${dss.depthWrite},${dss.depthFunc}`;
    res += `,${dss.stencilTestFront},${dss.stencilFuncFront},${dss.stencilRefFront},${dss.stencilReadMaskFront}`;
    res += `,${dss.stencilFailOpFront},${dss.stencilZFailOpFront},${dss.stencilPassOpFront},${dss.stencilWriteMaskFront}`;
    res += `,${dss.stencilTestBack},${dss.stencilFuncBack},${dss.stencilRefBack},${dss.stencilReadMaskBack}`;
    res += `,${dss.stencilFailOpBack},${dss.stencilZFailOpBack},${dss.stencilPassOpBack},${dss.stencilWriteMaskBack}`;
    return res;
  }
  _export("Pass", void 0);
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      DEBUG = _virtualInternal253AconstantsJs.DEBUG;
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
    }, function (_assetAssetManagerBuiltinResMgrJs) {
      builtinResMgr = _assetAssetManagerBuiltinResMgrJs.builtinResMgr;
    }, function (_renderingPassPhaseJs) {
      getPhaseID = _renderingPassPhaseJs.getPhaseID;
    }, function (_coreIndexJs) {
      murmurhash2_32_gc = _coreIndexJs.murmurhash2_32_gc;
      errorID = _coreIndexJs.errorID;
      assertID = _coreIndexJs.assertID;
      cclegacy = _coreIndexJs.cclegacy;
      warnID = _coreIndexJs.warnID;
    }, function (_gfxIndexJs) {
      BufferUsageBit = _gfxIndexJs.BufferUsageBit;
      DynamicStateFlagBit = _gfxIndexJs.DynamicStateFlagBit;
      Feature = _gfxIndexJs.Feature;
      GetTypeSize = _gfxIndexJs.GetTypeSize;
      MemoryUsageBit = _gfxIndexJs.MemoryUsageBit;
      PrimitiveMode = _gfxIndexJs.PrimitiveMode;
      Type = _gfxIndexJs.Type;
      BlendState = _gfxIndexJs.BlendState;
      BufferInfo = _gfxIndexJs.BufferInfo;
      BufferViewInfo = _gfxIndexJs.BufferViewInfo;
      DepthStencilState = _gfxIndexJs.DepthStencilState;
      DescriptorSetInfo = _gfxIndexJs.DescriptorSetInfo;
      RasterizerState = _gfxIndexJs.RasterizerState;
      Sampler = _gfxIndexJs.Sampler;
      SampleCount = _gfxIndexJs.SampleCount;
      deviceManager = _gfxIndexJs.deviceManager;
    }, function (_programLibJs) {
      programLib = _programLibJs.programLib;
    }, function (_passUtilsJs) {
      customizeType = _passUtilsJs.customizeType;
      getBindingFromHandle = _passUtilsJs.getBindingFromHandle;
      getDefaultFromType = _passUtilsJs.getDefaultFromType;
      getStringFromType = _passUtilsJs.getStringFromType;
      getOffsetFromHandle = _passUtilsJs.getOffsetFromHandle;
      getTypeFromHandle = _passUtilsJs.getTypeFromHandle;
      type2reader = _passUtilsJs.type2reader;
      type2writer = _passUtilsJs.type2writer;
      getCountFromHandle = _passUtilsJs.getCountFromHandle;
      type2validator = _passUtilsJs.type2validator;
    }, function (_renderingDefineJs) {
      RenderPassStage = _renderingDefineJs.RenderPassStage;
      RenderPriority = _renderingDefineJs.RenderPriority;
      SetIndex = _renderingDefineJs.SetIndex;
    }, function (_renderingInstancedBufferJs) {
      InstancedBuffer = _renderingInstancedBufferJs.InstancedBuffer;
    }],
    execute: function () {
      /*
       Copyright (c) 2017-2023 Xiamen Yaji Software Co., Ltd.
      
       http://www.cocos.com
      
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
      _bufferInfo = new BufferInfo(BufferUsageBit.UNIFORM | BufferUsageBit.TRANSFER_DST, MemoryUsageBit.DEVICE);
      _bufferViewInfo = new BufferViewInfo(null);
      _dsInfo = new DescriptorSetInfo(null);
      _materialSet = 1;
      _export("BatchingSchemes", BatchingSchemes = /*#__PURE__*/function (BatchingSchemes) {
        BatchingSchemes[BatchingSchemes["NONE"] = 0] = "NONE";
        BatchingSchemes[BatchingSchemes["INSTANCING"] = 1] = "INSTANCING";
        return BatchingSchemes;
      }({}));
      /**
       * @en Render pass, store actual resources for the rendering process
       * @zh 渲染 pass，储存实际描述绘制过程的各项资源。
       */
      _export("Pass", Pass = class Pass {
        /**
         * @en Fill a pass represented by the given pass handle with the given override info
         * @param hPass The pass handle point to the pass
         * @param info The pass override info
         */
        static fillPipelineInfo(pass, info) {
          if (info.priority !== undefined) {
            pass._priority = info.priority;
          }
          if (info.primitive !== undefined) {
            pass._primitive = info.primitive;
          }
          if (info.stage !== undefined) {
            pass._stage = info.stage;
          }
          if (info.dynamicStates !== undefined) {
            pass._dynamicStates = info.dynamicStates;
          }
          if (info.phase !== undefined) {
            pass._phase = getPhaseID(info.phase);
          }
          const bs = pass._bs;
          if (info.blendState) {
            const bsInfo = info.blendState;
            const {
              targets
            } = bsInfo;
            if (targets) {
              targets.forEach((t, i) => {
                bs.setTarget(i, t);
              });
            }
            if (bsInfo.isA2C !== undefined) {
              bs.isA2C = bsInfo.isA2C;
            }
            if (bsInfo.isIndepend !== undefined) {
              bs.isIndepend = bsInfo.isIndepend;
            }
            if (bsInfo.blendColor !== undefined) {
              bs.blendColor = bsInfo.blendColor;
            }

            // A2C (Alpha to Coverage) requires MSAA to be effective.
            // Without multiple subsamples, A2C behaves like alpha-test at ~0.5 and should be disabled.
            // Disable A2C when neither the pass nor the global framebuffer has MSAA enabled:
            //   - passWantsMultisample: pass explicitly requests isMultisample
            //   - globalMsaaEnabled: swapchain has MSAA (native: colorTexture.samples > X1;
            //                        WebGL: antialias from gl.getContextAttributes(), since WebGL
            //                        MSAA is controlled at context level, not texture level)
            if (bs.isA2C) {
              const gfxDevice = deviceManager.gfxDevice;
              const gl = gfxDevice.gl || null;
              const ctxAttrs = gl && gl.getContextAttributes();
              const antialias = !!(ctxAttrs && ctxAttrs.antialias);
              const passWantsMultisample = info.rasterizerState && info.rasterizerState.isMultisample === true;
              const swapchain = deviceManager.swapchain;
              const colorTex = swapchain && swapchain.colorTexture;
              const msaaDisabled = !colorTex || colorTex && colorTex.samples <= SampleCount.X1 || !antialias || !passWantsMultisample;
              if (msaaDisabled) {
                bs.isA2C = false;
              }
            }
          }
          pass._rs.assign(info.rasterizerState);
          pass._dss.assign(info.depthStencilState);
        }

        /**
         * @en Get pass hash value by [[renderer.Pass]] hash information.
         * @zh 根据 [[renderer.Pass]] 的哈希信息获取哈希值。
         *
         * @param hPass Handle of the pass info used to compute hash value.
         */
        static getPassHash(pass) {
          let shaderKey = '';
          if (cclegacy.rendering && cclegacy.rendering.enableEffectImport) {
            const key = cclegacy.rendering.programLib.getKey(pass._phaseID, pass.program, pass.defines);
            shaderKey = `${pass._phaseID.toString()},${key}`;
          } else {
            shaderKey = programLib.getKey(pass.program, pass.defines);
          }
          let res = `${shaderKey},${pass._primitive},${pass._dynamicStates}`;
          res += serializeBlendState(pass._bs);
          res += serializeDepthStencilState(pass._dss);
          res += serializeRasterizerState(pass._rs);
          return murmurhash2_32_gc(res, 666);
        }

        // internal resources

        constructor(root) {
          this._rootBuffer = null;
          this._buffers = [];
          this._descriptorSet = null;
          this._pipelineLayout = null;
          // internal data
          this._passIndex = 0;
          this._propertyIndex = 0;
          this._programName = '';
          this._dynamics = {};
          this._propertyHandleMap = {};
          this._rootBlock = null;
          this._blocksInt = [];
          this._blocks = [];
          this._shaderInfo = null;
          this._defines = {};
          this._properties = {};
          this._shader = null;
          this._bs = new BlendState();
          this._dss = new DepthStencilState();
          this._rs = new RasterizerState();
          this._priority = RenderPriority.DEFAULT;
          this._stage = RenderPassStage.DEFAULT;
          this._phase = getPhaseID('default');
          this._passID = 0xFFFFFFFF;
          this._subpassID = 0xFFFFFFFF;
          this._phaseID = 0xFFFFFFFF;
          this._primitive = PrimitiveMode.TRIANGLE_LIST;
          this._batchingScheme = BatchingSchemes.NONE;
          this._dynamicStates = DynamicStateFlagBit.NONE;
          this._instancedBuffers = {};
          this._hash = 0;
          this._rootBufferDirty = false;
          this._root = root;
          this._device = deviceManager.gfxDevice;
        }

        /**
         * @en Initialize the pass with given pass info, shader will be compiled in the init process
         * @zh 根据指定参数初始化当前 pass，shader 会在这一阶段就尝试编译。
         */
        initialize(info) {
          this._doInit(info);
          this.resetUBOs();
          this.resetTextures();
          this.tryCompile();
        }

        /**
         * @en Get the handle of a UBO member, or specific channels of it.
         * @zh 获取指定 UBO 成员，或其更具体分量的读写句柄。默认以成员自身的类型为目标读写类型（即读写时必须传入与成员类型相同的变量）。
         * @param name Name of the target UBO member.
         * @param offset Channel offset into the member.
         * @param targetType Target type of the handle, i.e. the type of data when read/write to it.
         * @example
         * ```
         * import { Vec3, gfx } from 'cc';
         * // say 'pbrParams' is a uniform vec4
         * const hParams = pass.getHandle('pbrParams'); // get the default handle
         * pass.setUniform(hAlbedo, new Vec3(1, 0, 0)); // wrong! pbrParams.w is NaN now
         *
         * // say 'albedoScale' is a uniform vec4, and we only want to modify the w component in the form of a single float
         * const hThreshold = pass.getHandle('albedoScale', 3, gfx.Type.FLOAT);
         * pass.setUniform(hThreshold, 0.5); // now, albedoScale.w = 0.5
         * ```
         */
        getHandle(name, offset = 0, targetType = Type.UNKNOWN) {
          let handle = this._propertyHandleMap[name];
          if (!handle) {
            return 0;
          }
          if (targetType) {
            handle = customizeType(handle, targetType);
          } else if (offset) {
            handle = customizeType(handle, getTypeFromHandle(handle) - offset);
          }
          return handle + offset;
        }

        /**
         * @en Gets the uniform binding with its name
         * @zh 获取指定 uniform 的 binding。
         * @param name The name of target uniform
         */
        getBinding(name) {
          const handle = this.getHandle(name);
          if (!handle) {
            return -1;
          }
          return getBindingFromHandle(handle);
        }

        /**
         * @en Sets a vector type uniform value, if a uniform requires frequent update, please use this method.
         * @zh 设置指定普通向量类 uniform 的值，如果需要频繁更新请尽量使用此接口。
         * @param handle The handle for the target uniform
         * @param value New value
         */
        setUniform(handle, value) {
          const binding = getBindingFromHandle(handle);
          const type = getTypeFromHandle(handle);
          const ofs = getOffsetFromHandle(handle);
          const block = this._getBlockView(type, binding);
          if (DEBUG) {
            const validator = type2validator[type];
            assertID(Boolean(validator && validator(value)), 12011, binding, Type[type]);
          }
          type2writer[type](block, value, ofs);
          this._rootBufferDirty = true;
        }

        /**
         * @en Gets a uniform's value.
         * @zh 获取指定普通向量类 uniform 的值。
         * @param handle The handle for the target uniform
         * @param out The output property to store the result
         */
        getUniform(handle, out) {
          const binding = getBindingFromHandle(handle);
          const type = getTypeFromHandle(handle);
          const ofs = getOffsetFromHandle(handle);
          const block = this._getBlockView(type, binding);
          return type2reader[type](block, out, ofs);
        }

        /**
         * @en Sets an array type uniform value, if a uniform requires frequent update, please use this method.
         * @zh 设置指定数组类 uniform 的值，如果需要频繁更新请尽量使用此接口。
         * @param handle The handle for the target uniform
         * @param value New value
         */
        setUniformArray(handle, value) {
          const binding = getBindingFromHandle(handle);
          const type = getTypeFromHandle(handle);
          const stride = GetTypeSize(type) >> 2;
          const block = this._getBlockView(type, binding);
          let ofs = getOffsetFromHandle(handle);
          for (let i = 0; i < value.length; i++, ofs += stride) {
            if (value[i] === null) {
              continue;
            }
            type2writer[type](block, value[i], ofs);
          }
          this._rootBufferDirty = true;
        }

        /**
         * @en Bind a GFX [[gfx.Texture]] the given uniform binding
         * @zh 绑定实际 GFX [[gfx.Texture]] 到指定 binding。
         * @param binding The binding for target uniform of texture type
         * @param value Target texture
         */
        bindTexture(binding, value, index) {
          this._descriptorSet.bindTexture(binding, value, index || 0);
        }

        /**
         * @en Bind a GFX [[gfx.Sampler]] the given uniform binding
         * @zh 绑定实际 GFX [[gfx.Sampler]] 到指定 binding。
         * @param binding The binding for target uniform of sampler type
         * @param value Target sampler
         */
        bindSampler(binding, value, index) {
          this._descriptorSet.bindSampler(binding, value, index || 0);
        }

        /**
         * @en Sets the dynamic pipeline state property at runtime
         * @zh 设置运行时 pass 内可动态更新的管线状态属性。
         * @param state Target dynamic state
         * @param value Target value
         */
        setDynamicState(state, value) {
          const ds = this._dynamics[state];
          if (ds && ds.value === value) {
            return;
          }
          ds.value = value;
          ds.dirty = true;
        }

        /**
         * @en Override all pipeline states with the given pass override info.
         * @zh 重载当前所有管线状态。
         * @param original The original pass info
         * @param value The override pipeline state info
         */
        overridePipelineStates(original, overrides) {
          warnID(12102);
        }

        /**
         * @en Update the current uniforms data.
         * @zh 更新当前 Uniform 数据。
         */
        update() {
          if (!this._descriptorSet) {
            errorID(12006);
            return;
          }
          if (this._rootBuffer && this._rootBufferDirty) {
            this._rootBuffer.update(this._rootBlock);
            this._rootBufferDirty = false;
          }
          this._descriptorSet.update();
        }
        getInstancedBuffer(extraKey = 0) {
          return this._instancedBuffers[extraKey] || (this._instancedBuffers[extraKey] = new InstancedBuffer(this));
        }

        /**
         * @en Destroy the current pass.
         * @zh 销毁当前 pass。
         */
        destroy() {
          for (let i = 0; i < this._shaderInfo.blocks.length; i++) {
            const u = this._shaderInfo.blocks[i];
            this._buffers[u.binding].destroy();
          }
          this._buffers = [];
          if (this._rootBuffer) {
            this._rootBuffer.destroy();
            this._rootBuffer = null;
          }
          for (const ib in this._instancedBuffers) {
            this._instancedBuffers[ib].destroy();
          }
          this._descriptorSet.destroy();
          this._rs.destroy();
          this._dss.destroy();
          this._bs.destroy();
        }

        /**
         * @en Resets the value of the given uniform by name to the default value in [[EffectAsset]].
         * This method does not support array type uniform.
         * @zh 重置指定（非数组） Uniform 为 [[EffectAsset]] 默认值。
         */
        resetUniform(name) {
          const handle = this.getHandle(name);
          if (!handle) {
            return;
          }
          const type = getTypeFromHandle(handle);
          const binding = getBindingFromHandle(handle);
          const ofs = getOffsetFromHandle(handle);
          const count = getCountFromHandle(handle);
          const block = this._getBlockView(type, binding);
          const info = this._properties[name];
          const givenDefault = info && info.value;
          const value = givenDefault || getDefaultFromType(type);
          const size = (GetTypeSize(type) >> 2) * count;
          for (let k = 0; k + value.length <= size; k += value.length) {
            block.set(value, ofs + k);
          }
          this._rootBufferDirty = true;
        }

        /**
         * @en Resets the value of the given texture by name to the default value in [[EffectAsset]].
         * @zh 重置指定贴图为 [[EffectAsset]] 默认值。
         */
        resetTexture(name, index) {
          const handle = this.getHandle(name);
          if (!handle) {
            return;
          }
          const type = getTypeFromHandle(handle);
          const binding = getBindingFromHandle(handle);
          const info = this._properties[name];
          const value = info && info.value;
          let textureBase;
          if (typeof value === 'string') {
            textureBase = builtinResMgr.get(`${value}${getStringFromType(type)}`);
          } else {
            textureBase = value || builtinResMgr.get(getDefaultFromType(type));
          }
          const texture = textureBase && textureBase.getGFXTexture();
          const samplerInfo = info && info.samplerHash !== undefined ? Sampler.unpackFromHash(info.samplerHash) : textureBase && textureBase.getSamplerInfo();
          const sampler = this._device.getSampler(samplerInfo);
          this._descriptorSet.bindSampler(binding, sampler, index || 0);
          this._descriptorSet.bindTexture(binding, texture, index || 0);
        }

        /**
         * @en Resets all uniform buffer objects to the default values in [[EffectAsset]]
         * @zh 重置所有 UBO 为默认值。
         */
        resetUBOs() {
          for (let i = 0; i < this._shaderInfo.blocks.length; i++) {
            const u = this._shaderInfo.blocks[i];
            let ofs = 0;
            for (let j = 0; j < u.members.length; j++) {
              const cur = u.members[j];
              const block = this._getBlockView(cur.type, u.binding);
              const info = this._properties[cur.name];
              const givenDefault = info && info.value;
              const value = givenDefault || getDefaultFromType(cur.type);
              const size = (GetTypeSize(cur.type) >> 2) * cur.count;
              for (let k = 0; k + value.length <= size; k += value.length) {
                block.set(value, ofs + k);
              }
              ofs += size;
            }
          }
          this._rootBufferDirty = true;
        }

        /**
         * @en Resets all textures and samplers to the default values in [[EffectAsset]]
         * @zh 重置所有 texture 和 sampler 为初始默认值。
         */
        resetTextures() {
          if (cclegacy.rendering) {
            const set = this._shaderInfo.descriptors[SetIndex.MATERIAL];
            set.samplerTextures.forEach(combined => {
              for (let j = 0; j < combined.count; ++j) {
                this.resetTexture(combined.name, j);
              }
            });
          } else {
            for (let i = 0; i < this._shaderInfo.samplerTextures.length; i++) {
              const u = this._shaderInfo.samplerTextures[i];
              for (let j = 0; j < u.count; j++) {
                this.resetTexture(u.name, j);
              }
            }
          }
        }

        /**
         * @en Try to compile the shader and retrieve related resources references.
         * @zh 尝试编译 shader 并获取相关资源引用。
         */
        tryCompile() {
          const {
            pipeline
          } = this._root;
          if (!pipeline) {
            return false;
          }
          this._syncBatchingScheme();
          if (cclegacy.rendering && cclegacy.rendering.enableEffectImport) {
            const programLib = cclegacy.rendering.programLib;
            const program = programLib.getProgramVariant(this._device, this._phaseID, this._programName, this._defines);
            if (!program) {
              warnID(12103, this._programName);
              return false;
            }
            this._shader = program.shader;
            this._pipelineLayout = programLib.getPipelineLayout(this.device, this._phaseID, this._programName);
          } else {
            const shader = programLib.getGFXShader(this._device, this._programName, this._defines, pipeline);
            if (!shader) {
              warnID(12104, this._programName);
              return false;
            }
            this._shader = shader;
            this._pipelineLayout = programLib.getTemplateInfo(this._programName).pipelineLayout;
          }
          this._hash = Pass.getPassHash(this);
          return true;
        }

        /**
         * @en Gets the shader variant of the current pass and given macro patches
         * @zh 结合指定的编译宏组合获取当前 Pass 的 Shader Variant
         * @param patches The macro patches
         */
        getShaderVariant(patches = null) {
          if (!this._shader && !this.tryCompile()) {
            warnID(12105);
            return null;
          }
          if (!patches) {
            return this._shader;
          }
          if (EDITOR) {
            for (let i = 0; i < patches.length; i++) {
              if (!patches[i].name.startsWith('CC_')) {
                warnID(12106);
                return null;
              }
            }
          }
          const {
            pipeline
          } = this._root;
          for (let i = 0; i < patches.length; i++) {
            const patch = patches[i];
            this._defines[patch.name] = patch.value;
          }
          if (this._isBlend) {
            this._defines.CC_IS_TRANSPARENCY_PASS = 1;
          }
          let shader = null;
          if (cclegacy.rendering && cclegacy.rendering.enableEffectImport) {
            const program = cclegacy.rendering.programLib.getProgramVariant(this._device, this._phaseID, this._programName, this._defines);
            if (program) {
              shader = program.shader;
            }
          } else {
            shader = programLib.getGFXShader(this._device, this._programName, this._defines, pipeline);
          }
          for (let i = 0; i < patches.length; i++) {
            const patch = patches[i];
            delete this._defines[patch.name];
          }
          return shader;
        }
        get _isBlend() {
          return this.blendState.targets.some(target => target.blend);
        }

        // internal use
        /**
         * @private
         */
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        beginChangeStatesSilently() {}

        /**
         * @private
         */
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        endChangeStatesSilently() {}
        _doInit(info, copyDefines = false) {
          var _cclegacy$rendering;
          this._priority = RenderPriority.DEFAULT;
          this._stage = RenderPassStage.DEFAULT;
          const enableEffectImport = (_cclegacy$rendering = cclegacy.rendering) == null ? void 0 : _cclegacy$rendering.enableEffectImport;
          if (enableEffectImport) {
            const r = cclegacy.rendering;
            if (typeof info.phase === 'number') {
              this._passID = info._passID;
              this._subpassID = info._subpassID;
              this._phaseID = info._phaseID;
            } else {
              this._passID = r.getPassID(info.pass);
              if (this._passID !== r.INVALID_ID) {
                if (info.subpass) {
                  this._subpassID = r.getSubpassID(this._passID, info.subpass);
                  this._phaseID = r.getPhaseID(this._subpassID, info.phase);
                } else {
                  this._phaseID = r.getPhaseID(this._passID, info.phase);
                }
              }
            }
            if (this._passID === r.INVALID_ID) {
              errorID(12107, info.program);
              return;
            }
            if (this._phaseID === r.INVALID_ID) {
              errorID(12108, info.program);
              return;
            }
          } else {
            // Here we are in legacy-pipeline
            // eslint-disable-next-line no-lonely-if
            if (typeof info.phase === 'number') {
              this._passID = info._passID;
            } else if (info.pass && info.pass !== 'default') {
              // In legacy pipeline, user might select invalid material,
              // whose pass name is not 'default'.
              // We should filter these passes.
              // Here we set _passID to 0, if pass is not 'default'.
              assertID(this._passID === 0xFFFFFFFF, 12110);
              this._passID = 0;
            }
          }
          this._phase = getPhaseID('default');
          this._primitive = PrimitiveMode.TRIANGLE_LIST;
          this._passIndex = info.passIndex;
          this._propertyIndex = info.propertyIndex !== undefined ? info.propertyIndex : info.passIndex;
          this._programName = info.program;
          this._defines = copyDefines ? {
            ...info.defines
          } : info.defines;
          if (enableEffectImport) {
            this._shaderInfo = cclegacy.rendering.programLib.getProgramInfo(this._phaseID, this._programName);
          } else {
            this._shaderInfo = programLib.getTemplate(info.program);
          }
          this._properties = info.properties || this._properties;

          // init gfx
          const device = this._device;
          Pass.fillPipelineInfo(this, info);
          if (info.stateOverrides) {
            Pass.fillPipelineInfo(this, info.stateOverrides);
          }

          // init descriptor set
          if (enableEffectImport) {
            _dsInfo.layout = cclegacy.rendering.programLib.getMaterialDescriptorSetLayout(this._device, this._phaseID, info.program);
          } else {
            _dsInfo.layout = programLib.getDescriptorSetLayout(this._device, info.program);
          }
          this._descriptorSet = this._device.createDescriptorSet(_dsInfo);

          // calculate total size required
          const blocks = this._shaderInfo.blocks;
          let blockSizes;
          let handleMap;
          if (enableEffectImport) {
            const programLib = cclegacy.rendering.programLib;
            blockSizes = programLib.getBlockSizes(this._phaseID, this._programName);
            handleMap = programLib.getHandleMap(this._phaseID, this._programName);
          } else {
            const tmplInfo = programLib.getTemplateInfo(info.program);
            blockSizes = tmplInfo.blockSizes;
            handleMap = tmplInfo.handleMap;
          }

          // build uniform blocks
          if (enableEffectImport) {
            const programLib = cclegacy.rendering.programLib;
            const shaderInfo = programLib.getShaderInfo(this._phaseID, this.program);
            this._buildMaterialUniformBlocks(device, shaderInfo.blocks, blockSizes);
          } else {
            this._buildUniformBlocks(device, blocks, blockSizes);
          }

          // store handles
          const directHandleMap = this._propertyHandleMap = handleMap;
          const indirectHandleMap = {};
          for (const name in this._properties) {
            const prop = this._properties[name];
            if (!prop.handleInfo) {
              continue;
            }
            indirectHandleMap[name] = this.getHandle.apply(this, prop.handleInfo);
          }
          Object.assign(directHandleMap, indirectHandleMap);
        }
        _buildUniformBlocks(device, blocks, blockSizes) {
          const alignment = device.capabilities.uboOffsetAlignment;
          const startOffsets = [];
          let lastSize = 0;
          let lastOffset = 0;
          for (let i = 0; i < blocks.length; i++) {
            const size = blockSizes[i];
            startOffsets.push(lastOffset);
            lastOffset += Math.ceil(size / alignment) * alignment;
            lastSize = size;
          }
          // create gfx buffer resource
          // lastSize is aligned to 16, the same as _bufferViewInfo.range.
          const totalSize = startOffsets[startOffsets.length - 1] + Math.ceil(lastSize / 16) * 16;
          if (totalSize) {
            // https://bugs.chromium.org/p/chromium/issues/detail?id=988988
            _bufferInfo.size = Math.ceil(totalSize / 16) * 16;
            this._rootBuffer = device.createBuffer(_bufferInfo);
            this._rootBlock = new ArrayBuffer(totalSize);
          }
          // create buffer views
          for (let i = 0, count = 0; i < blocks.length; i++) {
            const {
              binding
            } = blocks[i];
            const size = blockSizes[i];
            _bufferViewInfo.buffer = this._rootBuffer;
            _bufferViewInfo.offset = startOffsets[count++];
            _bufferViewInfo.range = Math.ceil(size / 16) * 16;
            const bufferView = this._buffers[binding] = device.createBuffer(_bufferViewInfo);
            // non-builtin UBO data pools, note that the effect compiler
            // guarantees these bindings to be consecutive, starting from 0 and non-array-typed
            this._blocks[binding] = new Float32Array(this._rootBlock, _bufferViewInfo.offset, size / Float32Array.BYTES_PER_ELEMENT);
            this._blocksInt[binding] = new Int32Array(this._blocks[binding].buffer, this._blocks[binding].byteOffset, this._blocks[binding].length);
            this._descriptorSet.bindBuffer(binding, bufferView);
          }
        }
        _buildMaterialUniformBlocks(device, blocks, blockSizes) {
          const alignment = device.capabilities.uboOffsetAlignment;
          const startOffsets = [];
          let lastSize = 0;
          let lastOffset = 0;
          for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i];
            if (block.set !== _materialSet) {
              continue;
            }
            const size = blockSizes[i];
            startOffsets.push(lastOffset);
            lastOffset += Math.ceil(size / alignment) * alignment;
            lastSize = size;
          }
          // create gfx buffer resource
          if (lastSize !== 0) {
            const totalSize = startOffsets[startOffsets.length - 1] + lastSize;
            if (totalSize) {
              // https://bugs.chromium.org/p/chromium/issues/detail?id=988988
              _bufferInfo.size = Math.ceil(totalSize / 16) * 16;
              this._rootBuffer = device.createBuffer(_bufferInfo);
              this._rootBlock = new ArrayBuffer(totalSize);
            }
          }
          // create buffer views
          for (let i = 0, count = 0; i < blocks.length; i++) {
            const block = blocks[i];
            if (block.set !== _materialSet) {
              continue;
            }
            const {
              binding
            } = blocks[i];
            const size = blockSizes[i];
            _bufferViewInfo.buffer = this._rootBuffer;
            _bufferViewInfo.offset = startOffsets[count++];
            _bufferViewInfo.range = Math.ceil(size / 16) * 16;
            const bufferView = this._buffers[binding] = device.createBuffer(_bufferViewInfo);
            // non-builtin UBO data pools, note that the effect compiler
            // guarantees these bindings to be consecutive, starting from 0 and non-array-typed
            this._blocks[binding] = new Float32Array(this._rootBlock, _bufferViewInfo.offset, size / Float32Array.BYTES_PER_ELEMENT);
            this._blocksInt[binding] = new Int32Array(this._blocks[binding].buffer, this._blocks[binding].byteOffset, this._blocks[binding].length);
            this._descriptorSet.bindBuffer(binding, bufferView);
          }
        }
        _syncBatchingScheme() {
          if (this._defines.USE_INSTANCING) {
            if (this._device.hasFeature(Feature.INSTANCED_ARRAYS)) {
              this._batchingScheme = BatchingSchemes.INSTANCING;
            } else {
              this._defines.USE_INSTANCING = false;
              this._batchingScheme = BatchingSchemes.NONE;
            }
          } else {
            this._batchingScheme = BatchingSchemes.NONE;
          }
        }
        _getBlockView(type, binding) {
          return type < Type.FLOAT ? this._blocksInt[binding] : this._blocks[binding];
        }

        /**
         * @engineInternal
         * @mangle
         * Only for UI
         */
        _initPassFromTarget(target, dss, hashFactor) {
          this._priority = target.priority;
          this._stage = target.stage;
          this._phase = target.phase;
          this._phaseID = target._phaseID;
          this._passID = target._passID;
          this._batchingScheme = target.batchingScheme;
          this._primitive = target.primitive;
          this._dynamicStates = target.dynamicStates;
          this._bs = target.blendState;
          this._dss = dss;
          this._descriptorSet = target.descriptorSet;
          this._rs = target.rasterizerState;
          this._passIndex = target.passIndex;
          this._propertyIndex = target.propertyIndex;
          this._programName = target.program;
          this._defines = target.defines;
          this._shaderInfo = target._shaderInfo;
          this._properties = target._properties;
          this._blocks = target._blocks;
          this._blocksInt = target._blocksInt;
          this._dynamics = target._dynamics;
          this._shader = target._shader;
          if (cclegacy.rendering && cclegacy.rendering.enableEffectImport) {
            this._pipelineLayout = cclegacy.rendering.programLib.getPipelineLayout(this.device, this._phaseID, this._programName);
          } else {
            this._pipelineLayout = programLib.getTemplateInfo(this._programName).pipelineLayout;
          }
          this._hash = target._hash ^ hashFactor;
        }

        // Only for UI
        /**
         * @engineInternal
         * @mangle
         */
        _updatePassHash() {
          this._hash = Pass.getPassHash(this);
        }

        // infos
        get root() {
          return this._root;
        }
        get device() {
          return this._device;
        }
        get shaderInfo() {
          return this._shaderInfo;
        }
        get localSetLayout() {
          if (cclegacy.rendering && cclegacy.rendering.enableEffectImport) {
            return cclegacy.rendering.programLib.getLocalDescriptorSetLayout(this._device, this._phaseID, this._programName);
          } else {
            return programLib.getDescriptorSetLayout(this._device, this._programName, true);
          }
        }
        get program() {
          return this._programName;
        }
        get properties() {
          return this._properties;
        }
        get defines() {
          return this._defines;
        }
        get passIndex() {
          return this._passIndex;
        }
        get propertyIndex() {
          return this._propertyIndex;
        }
        // data
        get dynamics() {
          return this._dynamics;
        }
        get blocks() {
          return this._blocks;
        }
        get blocksInt() {
          return this._blocksInt;
        }
        get rootBufferDirty() {
          return this._rootBufferDirty;
        }
        /**
         * @engineInternal
         * @mangle
         * Currently, can not just mark setter as engine internal, so change to a function.
         */
        setRootBufferDirty(val) {
          this._rootBufferDirty = val;
        }
        // states
        get priority() {
          return this._priority;
        }
        /**
         * @engineInternal
         * @mangle
         * Currently, can not just mark setter as engine internal, so change to a function.
         */
        setPriority(val) {
          this._priority = val;
        }
        get primitive() {
          return this._primitive;
        }
        get stage() {
          return this._stage;
        }
        get phase() {
          return this._phase;
        }
        get passID() {
          return this._passID;
        }
        get phaseID() {
          return this._phaseID;
        }
        get rasterizerState() {
          return this._rs;
        }
        get depthStencilState() {
          return this._dss;
        }
        get blendState() {
          return this._bs;
        }
        get dynamicStates() {
          return this._dynamicStates;
        }
        get batchingScheme() {
          return this._batchingScheme;
        }
        get descriptorSet() {
          return this._descriptorSet;
        }
        get hash() {
          return this._hash;
        }
        get pipelineLayout() {
          return this._pipelineLayout;
        }
      });
      /**
       * @en Get the type of member in uniform buffer object with the handle
       * @zh 根据 handle 获取 uniform 的具体类型。
       */
      Pass.getTypeFromHandle = getTypeFromHandle;
      /**
       * @en Get the binding with handle
       * @zh 根据 handle 获取 binding。
       */
      Pass.getBindingFromHandle = getBindingFromHandle;
      /**
       * @en Get the array length with handle
       * @zh 根据 handle 获取数组长度。
       */
      Pass.getCountFromHandle = getCountFromHandle;
      Pass.getOffsetFromHandle = getOffsetFromHandle;
    }
  };
});