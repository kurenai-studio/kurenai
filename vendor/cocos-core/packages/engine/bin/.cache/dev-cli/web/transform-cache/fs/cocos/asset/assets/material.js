System.register("q-bundled:///fs/cocos/asset/assets/material.js", ["../../core/data/decorators/index.js", "./asset.js", "./effect-asset.js", "../../gfx/index.js", "./texture-base.js", "../../render-scene/core/pass.js", "../../render-scene/core/pass-utils.js", "../../core/index.js", "../../rendering/pipeline-funcs.js"], function (_export, _context) {
  "use strict";

  var ccclass, serializable, type, Asset, EffectAsset, Texture, Type, TextureBase, Pass, getTypeFromHandle, Color, warnID, Vec4, cclegacy, SRGBToLinear, _dec, _dec2, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, v4_1, Material;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      type = _coreDataDecoratorsIndexJs.type;
    }, function (_assetJs) {
      Asset = _assetJs.Asset;
    }, function (_effectAssetJs) {
      EffectAsset = _effectAssetJs.EffectAsset;
    }, function (_gfxIndexJs) {
      Texture = _gfxIndexJs.Texture;
      Type = _gfxIndexJs.Type;
    }, function (_textureBaseJs) {
      TextureBase = _textureBaseJs.TextureBase;
    }, function (_renderSceneCorePassJs) {
      Pass = _renderSceneCorePassJs.Pass;
    }, function (_renderSceneCorePassUtilsJs) {
      getTypeFromHandle = _renderSceneCorePassUtilsJs.getTypeFromHandle;
    }, function (_coreIndexJs) {
      Color = _coreIndexJs.Color;
      warnID = _coreIndexJs.warnID;
      Vec4 = _coreIndexJs.Vec4;
      cclegacy = _coreIndexJs.cclegacy;
    }, function (_renderingPipelineFuncsJs) {
      SRGBToLinear = _renderingPipelineFuncsJs.SRGBToLinear;
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
      v4_1 = new Vec4();
      /**
       * @en The basic infos for material initialization.
       * @zh 用来初始化材质的基本信息。
       */
      /**
       * @en The material asset, specifies in details how a model is drawn on screen.
       * @zh 材质资源类，包含模型绘制方式的全部细节描述。
       */
      _export("Material", Material = (_dec = ccclass('cc.Material'), _dec2 = type(EffectAsset), _dec(_class = (_class2 = class Material extends Asset {
        /**
         * @en Get hash for a material
         * @zh 获取一个材质的哈希值
         * @param material
         */
        static getHash(material) {
          let hash = 0;
          for (const pass of material.passes) {
            hash ^= pass.hash;
          }
          return hash;
        }

        /**
         * @engineInternal
         */

        constructor(name) {
          super(name);
          _initializerDefineProperty(this, "_effectAsset", _descriptor, this);
          /**
           * @internal
           */
          _initializerDefineProperty(this, "_techIdx", _descriptor2, this);
          /**
           * @internal
           */
          _initializerDefineProperty(this, "_defines", _descriptor3, this);
          /**
           * @internal
           */
          _initializerDefineProperty(this, "_states", _descriptor4, this);
          /**
           * @internal
           */
          _initializerDefineProperty(this, "_props", _descriptor5, this);
          /**
           * @internal
           */
          this._passes = [];
          /**
           * @internal
           */
          this._hash = 0;
        }

        /**
         * @en The current [[EffectAsset]].
         * @zh 当前使用的 [[EffectAsset]] 资源。
         */
        get effectAsset() {
          return this._effectAsset;
        }

        /**
         * @en Name of the current [[EffectAsset]].
         * @zh 当前使用的 [[EffectAsset]] 资源名。
         */
        get effectName() {
          return this._effectAsset ? this._effectAsset.name : '';
        }

        /**
         * @en The current technique index.
         * @zh 当前的 technique 索引。
         */
        get technique() {
          return this._techIdx;
        }

        /**
         * @en The passes defined in this material.
         * @zh 当前正在使用的 pass 数组。
         */
        get passes() {
          return this._passes;
        }

        /**
         * @en The hash value of this material.
         * @zh 材质的 hash。
         */
        get hash() {
          return this._hash;
        }

        /**
         * @en The parent material.
         * @zh 父材质。
         */
        get parent() {
          return null;
        }

        /**
         * @en The owner render component.
         * @zh 该材质所归属的渲染组件。
         */
        get owner() {
          return null;
        }

        /**
         * @en Initialize this material with the given information.
         * @zh 根据所给信息初始化这个材质，初始化正常结束后材质即可立即用于渲染。
         * @param info @en Material description info. @zh 材质描述信息
         */
        initialize(info) {
          if (this._passes.length) {
            warnID(12005);
            return;
          }
          if (!this._defines) {
            this._defines = [];
          }
          if (!this._states) {
            this._states = [];
          }
          if (!this._props) {
            this._props = [];
          }
          this._fillInfo(info);
          this._update();
        }

        /**
         * @en Reset the material with the given information.
         * @zh 使用指定的信息重置该材质。
         *
         * @param info @en Material description info. @zh 材质描述信息。
         */
        reset(info) {
          // to be consistent with other assets
          this.initialize(info);
        }

        /**
         * @en
         * Destroy the material definitively.<br>
         * Cannot re-initialize after destroy.<br>
         * Modifications on active materials can be acheived by<br>
         * creating a new Material, invoke the `copy` function<br>
         * with the desired overrides, and assigning it to the target components.
         * @zh
         * 彻底销毁材质，注意销毁后无法重新初始化。<br>
         * 如需修改现有材质，请创建一个新材质，<br>
         * 调用 copy 函数传入需要的 overrides 并赋给目标组件。
         */
        destroy() {
          this._doDestroy();
          return super.destroy();
        }

        /**
         * @en Recompile the shader with the specified macro overrides. Allowed only on material instances.
         * @zh 使用指定预处理宏重新编译当前 pass（数组）中的 shader。只允许对材质实例执行。
         * @param overrides @en The shader macro override values. @zh 宏的覆盖值，用于编译不同 Shader 变体。
         * @param passIdx @en The pass to apply to. Will apply to all passes if not specified. @zh 要重编的 pass 索引，如果没有指定，则重编所有 pass。
         */
        recompileShaders(overrides, passIdx) {
          warnID(16370, this.name);
        }

        /**
         * @en Override the passes with the specified pipeline states. Allowed only on material instances.
         * @zh 使用指定管线状态重载当前的 pass（数组）。只允许对材质实例执行。
         * @param overrides The pipeline state override values.
         * @param passIdx The pass to apply to. Will apply to all passes if not specified.
         */
        overridePipelineStates(overrides, passIdx) {
          warnID(16371, this.name);
        }

        /**
         * @en Callback function after material is loaded in [[AssetManager]]. Initialize the resources automatically.
         * @zh 通过 [[AssetManager]] 加载完成时的回调，将自动初始化材质资源。
         */
        onLoaded() {
          this._update();
        }

        /**
         * @en Reset all the uniforms to the default value specified in [[EffectAsset]].
         * @zh 重置材质的所有 uniform 参数数据为 [[EffectAsset]] 中的默认初始值。
         * @param clearPasses @en Whether to clear the rendering data too. @zh 是否同时清空渲染数据。
         */
        resetUniforms(clearPasses = true) {
          this._props.length = this._passes.length;
          for (let i = 0; i < this._props.length; i++) {
            this._props[i] = {};
          }
          if (!clearPasses) {
            return;
          }
          for (const pass of this._passes) {
            pass.resetUBOs();
            pass.resetTextures();
          }
        }

        /**
         * @en
         * Convenient property setter provided for quick material setup.<br>
         * [[renderer.Pass.setUniform]] should be used instead if you need to do per-frame uniform update.
         * @zh
         * 设置材质 uniform 参数的统一入口。<br>
         * 注意如果需要每帧更新 uniform，建议使用 [[renderer.Pass.setUniform]] 以获得更好的性能。
         * @param name @en The target uniform name. @zh 目标 Uniform 名称。
         * @param val @en The target value. @zh 需要设置的目标值。
         * @param passIdx
         * @en The pass to apply to. Will apply to all passes if not specified.
         * @zh 设置此属性的 pass 索引，如果没有指定，则会设置此属性到所有 pass 上。
         */
        setProperty(name, val, passIdx) {
          let success = false;
          if (passIdx === undefined) {
            // try set property for all applicable passes
            const passes = this._passes;
            const len = passes.length;
            for (let i = 0; i < len; i++) {
              const pass = passes[i];
              if (this._uploadProperty(pass, name, val)) {
                this._props[pass.propertyIndex][name] = val;
                success = true;
              }
            }
          } else {
            if (passIdx >= this._passes.length) {
              warnID(16372, passIdx);
            }
            const pass = this._passes[passIdx];
            if (this._uploadProperty(pass, name, val)) {
              this._props[pass.propertyIndex][name] = val;
              success = true;
            }
          }
          if (!success) {
            warnID(16373, name);
          }
        }

        /**
         * @en
         * Gets the specified uniform value for this material.<br>
         * Note that only uniforms set through [[Material.setProperty]] can be acquired here.<br>
         * For the complete rendering data, use [[renderer.Pass.getUniform]] instead.
         * @zh
         * 获取当前材质的指定 uniform 参数的值。<br>
         * 注意只有通过 [[Material.setProperty]] 函数设置的参数才能从此函数取出，<br>
         * 如需取出完整的渲染数据，请使用 [[renderer.Pass.getUniform]]。
         * @param name @en The property or uniform name. @zh 属性或 Uniform 的名称。
         * @param passIdx
         * @en The target pass index. If not specified, return the first found value in all passes.
         * @zh 目标 pass 索引，如果没指定，则返回所有 pass 中第一个找到的值。
         * @return @en The acquired material properties. @zh 获取的材质属性。
         */
        getProperty(name, passIdx) {
          if (passIdx === undefined) {
            // try get property in all possible passes
            const propsArray = this._props;
            const len = propsArray.length;
            for (let i = 0; i < len; i++) {
              const props = propsArray[i];
              if (name in props) {
                return props[name];
              }
            }
          } else {
            if (passIdx >= this._passes.length) {
              warnID(16372, passIdx);
              return null;
            }
            const props = this._props[this._passes[passIdx].propertyIndex];
            if (name in props) {
              return props[name];
            }
          }
          return null;
        }

        /**
         * @en Copy the target material, with optional overrides.
         * @zh 复制目标材质到当前实例，允许提供重载信息。
         * @param mat @en The material to be copied. @zh 需要拷贝的原始材质。
         * @param overrides @en The overriding states on top of the original material. @zh 需要在原始材质上覆盖的状态。
         */
        copy(mat, overrides) {
          this._techIdx = mat._techIdx;
          this._props.length = mat._props.length;
          for (let i = 0; i < mat._props.length; i++) {
            this._props[i] = {
              ...mat._props[i]
            };
          }
          this._defines.length = mat._defines.length;
          for (let i = 0; i < mat._defines.length; i++) {
            this._defines[i] = {
              ...mat._defines[i]
            };
          }
          this._states.length = mat._states.length;
          for (let i = 0; i < mat._states.length; i++) {
            this._states[i] = {
              ...mat._states[i]
            };
          }
          this._effectAsset = mat._effectAsset;
          if (overrides) this._fillInfo(overrides);
          this._update();
        }

        /**
         * @engineInternal
         * @mangle
         */
        _fillInfo(info) {
          if (info.technique !== undefined) {
            this._techIdx = info.technique;
          }
          if (info.effectAsset) {
            this._effectAsset = info.effectAsset;
          } else if (info.effectName) {
            this._effectAsset = EffectAsset.get(info.effectName);
          }
          if (info.defines) {
            this._prepareInfo(info.defines, this._defines);
          }
          if (info.states) {
            this._prepareInfo(info.states, this._states);
          }
        }

        /**
         * @engineInternal
         * @mangle
         */
        _prepareInfo(patch, cur) {
          let patchArray = patch;
          if (!Array.isArray(patchArray)) {
            // fill all the passes if not specified
            const len = this._effectAsset ? this._effectAsset.techniques[this._techIdx].passes.length : 1;
            patchArray = Array(len).fill(patchArray);
          }
          for (let i = 0; i < patchArray.length; ++i) {
            Object.assign(cur[i] || (cur[i] = {}), patchArray[i]);
          }
        }

        /**
         * @engineInternal
         * @mangle
         */
        _createPasses() {
          const tech = this._effectAsset.techniques[this._techIdx || 0];
          if (!tech) {
            return [];
          }
          const passNum = tech.passes.length;
          const passes = [];
          for (let k = 0; k < passNum; ++k) {
            const passInfo = tech.passes[k];
            const propIdx = passInfo.passIndex = k;
            const defines = passInfo.defines = this._defines[propIdx] || (this._defines[propIdx] = {});
            passInfo.stateOverrides = this._states[propIdx] || (this._states[propIdx] = {});
            if (passInfo.propertyIndex !== undefined) {
              Object.assign(defines, this._defines[passInfo.propertyIndex]);
            }
            if (passInfo.embeddedMacros !== undefined) {
              Object.assign(defines, passInfo.embeddedMacros);
            }
            if (passInfo.switch && !defines[passInfo.switch]) {
              continue;
            }
            const pass = new Pass(cclegacy.director.root);
            pass.initialize(passInfo);
            passes.push(pass);
          }
          return passes;
        }

        /**
         * @engineInternal
         * @mangle
         */
        _update(keepProps = true) {
          if (this._effectAsset) {
            this._passes = this._createPasses();
            // handle property values
            const totalPasses = this._effectAsset.techniques[this._techIdx].passes.length;
            this._props.length = totalPasses;
            if (keepProps) {
              this._passes.forEach((pass, i) => {
                let props = this._props[i];
                if (!props) {
                  props = this._props[i] = {};
                }
                if (pass.propertyIndex !== undefined) {
                  Object.assign(props, this._props[pass.propertyIndex]);
                }
                for (const p in props) {
                  this._uploadProperty(pass, p, props[p]);
                }
              });
            } else {
              for (let i = 0; i < this._props.length; i++) {
                this._props[i] = {};
              }
            }
          }
          this._hash = Material.getHash(this);
        }

        /**
         * @engineInternal
         * @mangle
         */
        _uploadProperty(pass, name, val) {
          const handle = pass.getHandle(name);
          if (!handle) {
            return false;
          }
          const type = getTypeFromHandle(handle);
          if (type < Type.SAMPLER1D) {
            if (Array.isArray(val)) {
              pass.setUniformArray(handle, val);
            } else if (val !== null) {
              var _pass$properties$name;
              if ((_pass$properties$name = pass.properties[name]) != null && _pass$properties$name.linear) {
                const v4 = val;
                SRGBToLinear(v4_1, v4);
                v4_1.w = v4.w;
                val = v4_1;
              }
              pass.setUniform(handle, val);
            } else {
              pass.resetUniform(name);
            }
          } else if (Array.isArray(val)) {
            val.forEach((v, i) => {
              this._bindTexture(pass, handle, v, i);
            });
          } else if (val) {
            this._bindTexture(pass, handle, val);
          } else {
            pass.resetTexture(name);
          }
          return true;
        }

        /**
         * @engineInternal
         * @mangle
         */
        _bindTexture(pass, handle, val, index) {
          const binding = Pass.getBindingFromHandle(handle);
          if (val instanceof Texture) {
            pass.bindTexture(binding, val, index);
          } else if (val instanceof TextureBase) {
            const texture = val.getGFXTexture();
            if (!texture || !texture.width || !texture.height) {
              // warn(`material '${this._uuid}' received incomplete texture asset '${val._uuid}'`);
              return;
            }
            pass.bindTexture(binding, texture, index);
            pass.bindSampler(binding, val.getGFXSampler(), index);
          }
        }

        /**
         * @engineInternal
         * @mangle
         */
        _doDestroy() {
          if (this._passes && this._passes.length) {
            for (const pass of this._passes) {
              pass.destroy();
            }
          }
          this._passes.length = 0;
        }
        initDefault(uuid) {
          super.initDefault(uuid);
          this.initialize({
            effectName: 'builtin-unlit',
            defines: {
              USE_COLOR: true
            },
            technique: 0
          });
          this.setProperty('mainColor', new Color('#ff00ff'));
        }
        validate() {
          return !!this._effectAsset && !this._effectAsset.isDefault && this.passes.length > 0;
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_effectAsset", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_techIdx", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_defines", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "_states", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "_props", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _class2)) || _class));
      cclegacy.Material = Material;
    }
  };
});