System.register("q-bundled:///fs/cocos/animation/value-proxy-factories/uniform.js", ["../../core/data/decorators/index.js", "../../asset/asset-manager/index.js", "../../asset/assets/material.js", "../../asset/assets/texture-base.js", "../../gfx/index.js", "../../render-scene/core/pass-utils.js", "../../core/index.js"], function (_export, _context) {
  "use strict";

  var ccclass, float, serializable, builtinResMgr, Material, TextureBase, deviceManager, Type, getBindingFromHandle, getDefaultFromType, getStringFromType, getTypeFromHandle, warn, warnID, _dec, _class, _class2, _descriptor, _descriptor2, _descriptor3, UniformProxyFactory;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function isUniformArray(pass, name) {
    for (const block of pass.shaderInfo.blocks) {
      for (const uniform of block.members) {
        if (uniform.name === name) {
          return uniform.count > 1;
        }
      }
    }
    return false;
  }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      float = _coreDataDecoratorsIndexJs.float;
      serializable = _coreDataDecoratorsIndexJs.serializable;
    }, function (_assetAssetManagerIndexJs) {
      builtinResMgr = _assetAssetManagerIndexJs.builtinResMgr;
    }, function (_assetAssetsMaterialJs) {
      Material = _assetAssetsMaterialJs.Material;
    }, function (_assetAssetsTextureBaseJs) {
      TextureBase = _assetAssetsTextureBaseJs.TextureBase;
    }, function (_gfxIndexJs) {
      deviceManager = _gfxIndexJs.deviceManager;
      Type = _gfxIndexJs.Type;
    }, function (_renderSceneCorePassUtilsJs) {
      getBindingFromHandle = _renderSceneCorePassUtilsJs.getBindingFromHandle;
      getDefaultFromType = _renderSceneCorePassUtilsJs.getDefaultFromType;
      getStringFromType = _renderSceneCorePassUtilsJs.getStringFromType;
      getTypeFromHandle = _renderSceneCorePassUtilsJs.getTypeFromHandle;
    }, function (_coreIndexJs) {
      warn = _coreIndexJs.warn;
      warnID = _coreIndexJs.warnID;
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
       * @en
       * Value proxy factory for setting uniform on material target.
       * @zh
       * 用于设置材质目标上指定 Uniform 的曲线值代理工厂。
       */
      _export("UniformProxyFactory", UniformProxyFactory = (_dec = ccclass('cc.animation.UniformProxyFactory'), _dec(_class = (_class2 = class UniformProxyFactory {
        constructor(uniformName, passIndex) {
          /**
           * @en Pass index.
           * @zh Pass 索引。
           */
          _initializerDefineProperty(this, "passIndex", _descriptor, this);
          /**
           * @en Uniform name.
           * @zh Uniform 名称。
           */
          _initializerDefineProperty(this, "uniformName", _descriptor2, this);
          /**
           * @en
           * Specify the aimed channel of the uniform.
           * Use this when you're aiming at a single channel of the uniform instead of who uniform.
           * For example, only green(1) channel of a color uniform.
           * @zh
           * 指定目标 Uniform 的通道。
           * 当你希望设置 Uniform 单独的通道而非整个 Uniform 时应该当使用此字段。
           * 例如，仅设置颜色 Uniform 的红色通道。
           */
          _initializerDefineProperty(this, "channelIndex", _descriptor3, this);
          this.passIndex = passIndex || 0;
          this.uniformName = uniformName || '';
        }
        forTarget(target) {
          if (!(target instanceof Material)) {
            warnID(3940, target);
            return undefined;
          }
          const {
            passIndex,
            uniformName,
            channelIndex
          } = this;
          if (passIndex < 0 || passIndex >= target.passes.length) {
            warnID(3941, target.name, passIndex);
            return undefined;
          }
          const pass = target.passes[passIndex];
          const handle = pass.getHandle(uniformName);
          if (!handle) {
            warnID(3942, target.name, passIndex, uniformName);
            return undefined;
          }
          const type = getTypeFromHandle(handle);
          if (type < Type.SAMPLER1D) {
            const realHandle = channelIndex === undefined ? handle : pass.getHandle(uniformName, channelIndex, Type.FLOAT);
            if (!realHandle) {
              warnID(3943, target.name, passIndex, uniformName, channelIndex);
              return undefined;
            }
            if (isUniformArray(pass, uniformName)) {
              return {
                set: value => {
                  pass.setUniformArray(realHandle, value);
                }
              };
            }
            return {
              set: value => {
                pass.setUniform(realHandle, value);
              }
            };
          } else {
            const binding = getBindingFromHandle(handle);
            const prop = pass.properties[uniformName];
            const texName = prop && prop.value ? `${prop.value}${getStringFromType(prop.type)}` : getDefaultFromType(prop.type);
            let dftTex = builtinResMgr.get(texName);
            if (!dftTex) {
              warn(`Illegal texture default value: ${texName}.`);
              dftTex = builtinResMgr.get('default-texture');
            }
            return {
              set: value => {
                if (!value) {
                  value = dftTex;
                }
                const texture = value.getGFXTexture();
                if (!texture || !texture.width || !texture.height) {
                  return;
                }
                pass.bindTexture(binding, texture);
                if (value instanceof TextureBase) {
                  pass.bindSampler(binding, deviceManager.gfxDevice.getSampler(value.getSamplerInfo()));
                }
              }
            };
          }
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "passIndex", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "uniformName", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return '';
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "channelIndex", [float], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return undefined;
        }
      }), _class2)) || _class));
    }
  };
});