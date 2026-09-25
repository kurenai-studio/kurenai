System.register("q-bundled:///fs/cocos/render-scene/core/material-instance.js", ["../../asset/assets/material.js", "./pass-instance.js"], function (_export, _context) {
  "use strict";

  var Material, PassInstance, MaterialInstance;
  _export("MaterialInstance", void 0);
  return {
    setters: [function (_assetAssetsMaterialJs) {
      Material = _assetAssetsMaterialJs.Material;
    }, function (_passInstanceJs) {
      PassInstance = _passInstanceJs.PassInstance;
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
      /**
       * @zh
       * 材质实例，当有材质修改需求时，根据材质资源创建的，可任意定制的实例。
       */
      _export("MaterialInstance", MaterialInstance = class MaterialInstance extends Material {
        get parent() {
          return this._parent;
        }
        get owner() {
          return this._owner;
        }
        constructor(info) {
          super();
          this._passes = [];
          this._subModelIdx = 0;
          this._parent = info.parent;
          this._owner = info.owner || null;
          this._subModelIdx = info.subModelIdx || 0;
          this.copy(this._parent);
        }
        recompileShaders(overrides, passIdx) {
          if (!this._passes || !this.effectAsset) {
            return;
          }
          if (passIdx === undefined) {
            this._passes.forEach(pass => {
              pass.tryCompile(overrides);
            });
          } else {
            this._passes[passIdx].tryCompile(overrides);
          }
        }
        overridePipelineStates(overrides, passIdx) {
          if (!this._passes || !this.effectAsset) {
            return;
          }
          const passInfos = this.effectAsset.techniques[this.technique].passes;
          if (passIdx === undefined) {
            for (let i = 0; i < this._passes.length; i++) {
              const pass = this._passes[i];
              const state = this._states[i] || (this._states[i] = {});
              for (const key in overrides) {
                state[key] = overrides[key];
              }
              pass.overridePipelineStates(passInfos[pass.passIndex], state);
            }
          } else {
            const state = this._states[passIdx] || (this._states[passIdx] = {});
            for (const key in overrides) {
              state[key] = overrides[key];
            }
            this._passes[passIdx].overridePipelineStates(passInfos[passIdx], state);
          }
        }
        destroy() {
          this._doDestroy();
          return true;
        }
        onPassStateChange(dontNotify) {
          this._hash = Material.getHash(this);
          if (!dontNotify && this._owner) {
            this._owner._onRebuildPSO(this._subModelIdx, this);
          }
        }
        _createPasses() {
          const passes = [];
          const parentPasses = this._parent.passes;
          if (!parentPasses) {
            return passes;
          }
          for (let k = 0; k < parentPasses.length; ++k) {
            passes.push(new PassInstance(parentPasses[k], this));
          }
          return passes;
        }
      });
    }
  };
});