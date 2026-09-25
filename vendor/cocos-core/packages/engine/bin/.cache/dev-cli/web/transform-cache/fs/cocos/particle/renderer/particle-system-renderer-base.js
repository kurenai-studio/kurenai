System.register("q-bundled:///fs/cocos/particle/renderer/particle-system-renderer-base.js", ["../../gfx/index.js", "../models/particle-batch-model.js", "../enum.js", "../../core/index.js"], function (_export, _context) {
  "use strict";

  var deviceManager, Feature, ParticleBatchModel, ParticleRenderMode, cclegacy, ParticleSystemRendererBase;
  _export("ParticleSystemRendererBase", void 0);
  return {
    setters: [function (_gfxIndexJs) {
      deviceManager = _gfxIndexJs.deviceManager;
      Feature = _gfxIndexJs.Feature;
    }, function (_modelsParticleBatchModelJs) {
      ParticleBatchModel = _modelsParticleBatchModelJs.default;
    }, function (_enumJs) {
      ParticleRenderMode = _enumJs.ParticleRenderMode;
    }, function (_coreIndexJs) {
      cclegacy = _coreIndexJs.cclegacy;
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
      _export("ParticleSystemRendererBase", ParticleSystemRendererBase = class ParticleSystemRendererBase {
        /**
         * @engineInternal
         */
        get model() {
          return this._model;
        }
        constructor(info) {
          this._particleSystem = null;
          this._model = null;
          this._renderInfo = null;
          this._vertAttrs = [];
          this._useInstance = void 0;
          this._renderInfo = info;
          if (!deviceManager.gfxDevice.hasFeature(Feature.INSTANCED_ARRAYS)) {
            this._useInstance = false;
          } else {
            this._useInstance = true;
          }
        }
        getUseInstance() {
          return this._useInstance;
        }
        getInfo() {
          return this._renderInfo;
        }
        onInit(ps) {
          this._particleSystem = ps;
        }
        onEnable() {
          if (!this._particleSystem) {
            return;
          }
          this.attachToScene();
          const model = this._model;
          if (model) {
            model.node = model.transform = this._particleSystem.node;
          }
        }
        onDisable() {
          this.detachFromScene();
        }
        onDestroy() {
          if (this._model) {
            cclegacy.director.root.destroyModel(this._model);
            this._model = null;
          }
        }
        attachToScene() {
          if (this._model) {
            var _this$_particleSystem;
            if (this._model.scene) {
              this.detachFromScene();
            }
            (_this$_particleSystem = this._particleSystem) == null || _this$_particleSystem._getRenderScene().addModel(this._model);
          }
        }
        detachFromScene() {
          if (this._model && this._model.scene) {
            this._model.scene.removeModel(this._model);
          }
        }
        setVertexAttributes() {
          if (this._model) {
            this.updateVertexAttrib();
            this._model.setVertexAttributes(this._renderInfo.renderMode === ParticleRenderMode.Mesh ? this._renderInfo.mesh : null, this._vertAttrs);
          }
        }
        clear() {
          if (this._model) this._model.enabled = false;
        }
        getModel() {
          return this._model;
        }
        _initModel() {
          if (!this._model && this._particleSystem) {
            this._model = cclegacy.director.root.createModel(ParticleBatchModel);
            this._model.setCapacity(this._particleSystem.capacity);
            this._model.visFlags = this._particleSystem.visibility;
          }
        }
        updateTrailMaterial() {}
        getDefaultTrailMaterial() {
          return null;
        }
      });
    }
  };
});